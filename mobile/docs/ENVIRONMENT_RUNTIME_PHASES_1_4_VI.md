# Cấu hình môi trường, Docker và kết quả khởi chạy thực tế

Phạm vi runtime của nhiệm vụ Mobile là Identity, Bakery, Subscription và storage; không phải tuyên bố bảy bounded context đều chạy đầy đủ. Các stack local/audit cũ được giữ nguyên. Không sửa `backend/`, `frontend/`, root `.env`, Compose hoặc external secrets gốc.

## Deployment bền vững

Chủ dự án đã cho phép tạo lại runtime ở ổ H sau khi thư mục runtime tạm biến mất. Deployment mới nằm ở `H:\MSS\.runtime\bakery-mobile-phases-1-4`, ngoài Git, ACL chỉ tài khoản Windows hiện tại và SYSTEM. Project Compose `bakery-mobile-20261107`, file `compose.json`; JAR và config mount read-only. Không dùng image build args chứa secret.

| Thành phần | Compose / container | Internal | Host | Kiểm chứng |
|---|---|---|---|---|
| Identity, app name `identity-service` | `mobile-identity` / `bakery-mobile-20261107-mobile-identity-1` | 8080 | `127.0.0.1:18101` | Login/me/refresh/logout và service token phục vụ onboarding |
| Bakery, app name `bakery-service` | `mobile-bakery` / `bakery-mobile-20261107-mobile-bakery-1` | 8080 | `127.0.0.1:18102` | Onboarding/operations/catalog/media/public read; restart đạt |
| Subscription, app name `subscription-service` | `mobile-subscription` / `bakery-mobile-20261107-mobile-subscription-1` | 8080 | `127.0.0.1:18104` | Plan/order/payment/Admin approve, ACTIVE/SCHEDULED |
| Bakery PostgreSQL | `bakery-db` / `bakery-mobile-20261107-bakery-db-1` | 5432 | Không publish | Docker health + write/refetch nghiệp vụ |
| Subscription PostgreSQL | `subscription-db` / `bakery-mobile-20261107-subscription-db-1` | 5432 | Không publish | Docker health + snapshot/kỳ thuê persist |
| Identity PostgreSQL dùng lại | `bakery-local-identity-db-1` | 5432 | Mapping cũ giữ nguyên | Migration byte-identical, login và role thật |
| MinIO | `mobile-storage` / `bakery-mobile-20261107-mobile-storage-1` | 9000 | `127.0.0.1:19022` | Upload và GET signed media thành công |
| Web | Vite từ bản sao ngoài repo | 5174 | `http://127.0.0.1:5174` | Main app/public routes + cùng bản ghi product |
| Gateway | Bootstrap hiện có | Chưa xác nhận | 8080 không route khả dụng | BLOCKED; dùng direct public origins tập trung cho debug |

Ba Spring app dùng profile mặc định của source, không tự đặt `SPRING_PROFILES_ACTIVE`. Network mới `bakery-mobile-20261107_runtime`; Identity còn tham gia external network `bakery-local_default` để dùng DB cũ. Ba named volume mới: `bakery-mobile-20261107_bakery-data`, `bakery-mobile-20261107_subscription-data`, `bakery-mobile-20261107_storage-data`. Không xóa/reset volume cũ, không chiếm cổng PostgreSQL host.

Không có service discovery/message broker cần khởi chạy cho ba service này. URL nội bộ theo DNS Compose; mobile dùng loopback qua `adb reverse`. Image cũ có healthcheck không phù hợp target JAR nên deployment mới tắt healthcheck kế thừa ở ba app. Vì vậy Docker `Up` được báo riêng với readiness: OpenAPI và API nghiệp vụ thật là bằng chứng ứng dụng. DB vẫn có `pg_isready`. Đây là hạn chế monitoring, không coi healthcheck bị tắt là PASS.

Source 266 tệp được so với bản copy build ngoài repo: Identity 81, Bakery 122, Subscription 63, không khác byte. Maven offline build ba JAR thành công; không chạy lại Backend unit suite hoặc nhận PASS từ audit cũ. SHA JAR và preflight ở [persistent-runtime-h.json](evidence/api-integration-phases-1-4/persistent-runtime-h.json), [runtime-preflight.json](evidence/api-integration-phases-1-4/runtime-preflight.json).

## Ma trận cấu hình từng service

Các ô sau chỉ ghi tên biến, nguồn và tình trạng. Có mặt trong environment không đồng nghĩa mọi nhánh đã được xác minh.

| Microservice | Required / nhóm cấu hình | Existing | Derived từ Docker/source | Generated | Unresolved | Runtime |
|---|---|---|---|---|---|---|
| Identity | DB, RSA, JWT properties, refresh cookie, service clients | DB credential/RSA PEM/client hashes/grants gốc | Container DNS, CORS local, config mount; defaults JWT/cookie/TTL | Không tạo RSA hoặc Admin | Không có cho core Phases 1–4 | RUNNING_AND_VERIFIED trong phạm vi đã thử |
| Bakery | DB, JWKS/issuer/audience, client auth, Subscription, MinIO | Client secret và cấu hình đã hoạt động | Host/DB/bucket/public media endpoints; thêm grant đúng source trong file mới | Password DB mới; storage credential dùng chung có lý do | Không có cho core; owner-read API còn thiếu | RUNNING_WITH_LIMITATIONS |
| Subscription | DB, Identity, Bakery, client auth, MinIO | Client secret/cấu hình hợp lệ | DNS/bucket/public endpoint và grant activate | Password DB mới; cùng storage credential | Sandbox/external payment không được xác minh | RUNNING_WITH_LIMITATIONS |

### Identity: biến được tham chiếu bởi source

| Tên biến | Mục đích / nguồn | Xác minh |
|---|---|---|
| `IDENTITY_DB_URL`, `IDENTITY_DB_USERNAME`, `IDENTITY_DB_PASSWORD` | Dùng lại env container Identity và DB local đã khởi tạo; không đổi password DB | Login/register/refresh persisted |
| `IDENTITY_JWT_PRIVATE_KEY_PATH`, `IDENTITY_JWT_PUBLIC_KEY_PATH` | Mount PEM có sẵn từ external secrets; RS256 theo `JwtConfig` | JWT được Bakery/Subscription xác thực qua JWKS |
| `IDENTITY_JWT_ISSUER`, `IDENTITY_JWT_KEY_ID`, `IDENTITY_JWT_USER_AUDIENCE`, `IDENTITY_JWT_SERVICE_AUDIENCE`, `IDENTITY_JWT_ACCESS_TOKEN_TTL` | Defaults application.yml khi không có override; nhất quán với consumers | User JWT, refresh, role và service calls; không phát minh HMAC key |
| `IDENTITY_REFRESH_COOKIE_NAME`, `IDENTITY_REFRESH_TOKEN_TTL`, `IDENTITY_BCRYPT_STRENGTH` | Defaults source | Cookie contract/login/register/rotation đạt; không thử tất cả TTL boundaries |
| `IDENTITY_REFRESH_COOKIE_SECURE`, `IDENTITY_CORS_ALLOWED_ORIGINS` | Dùng local HTTP cookie setting có sẵn; CORS thêm cổng Web local mới | Cookie native contract và Web proxy; không dùng setting local cho production |
| `BAKERY_CLIENT_SECRET_HASH`, `SUBSCRIPTION_CLIENT_SECRET_HASH` | Hash/grants dùng lại; config mount mới | Hai luồng grant Owner/activate đi qua auth thật |
| `MARKETPLACE_CLIENT_SECRET_HASH`, `ORDER_CLIENT_SECRET_HASH`, `CHAT_SERVICE_CLIENT_SECRET_HASH` | Kế thừa cấu hình cũ | Không xác minh các service ngoài phạm vi |
| `SPRING_CONFIG_ADDITIONAL_LOCATION`, `SERVER_PORT`, `JAVA_TOOL_OPTIONS` | Mount grants mới/port/bộ nhớ deployment | Startup thực tế; không ảnh hưởng source gốc |

### Bakery: biến được tham chiếu bởi source

| Tên biến | Mục đích / nguồn | Xác minh |
|---|---|---|
| `BAKERY_DB_URL`, `BAKERY_DB_USERNAME` | Derive từ Compose `bakery-db`, database/user đúng source | Startup/Flyway và catalog persisted |
| `BAKERY_DB_PASSWORD` | Sinh cho volume PostgreSQL mới, map đồng nhất DB/consumer | Write/refetch sau restart |
| `IDENTITY_JWKS_URI`, `IDENTITY_JWT_ISSUER`, `IDENTITY_JWT_USER_AUDIENCE`, `IDENTITY_JWT_SERVICE_AUDIENCE` | JWKS qua Docker DNS; issuer/audience kế thừa/default đúng contract | User role/membership và service authentication |
| `IDENTITY_SERVICE_URL`, `BAKERY_CLIENT_SECRET`, `BAKERY_IDENTITY_SERVICE_TOKEN` | Client credentials có sẵn, URL derive; static-token fallback không chứng minh là cần dùng | Hoàn tất onboarding cấp Owner, không đưa secret vào app |
| `SUBSCRIPTION_SERVICE_URL`, `SUBSCRIPTION_SERVICE_TOKEN` | URL derive, fallback kế thừa; source hỗ trợ client auth | Publish entitlement và activate sau approve |
| `BAKERY_MINIO_ENDPOINT`, `BAKERY_MINIO_PUBLIC_ENDPOINT`, `BAKERY_MINIO_BUCKET` | Internal DNS cho server, public loopback để emulator giữ đúng chữ ký | Upload rồi download product/logo/cover |
| `BAKERY_MINIO_ACCESS_KEY`, `BAKERY_MINIO_SECRET_KEY` | Storage credential mới, chỉ server dùng | Chữ ký và object đọc lại thành công |
| `SERVER_PORT` | Internal 8080, host mapping riêng | Business API tại 18102 |

### Subscription: biến được tham chiếu bởi source

| Tên biến | Mục đích / nguồn | Xác minh |
|---|---|---|
| `SUBSCRIPTION_DB_URL`, `SUBSCRIPTION_DB_USERNAME`, `SUBSCRIPTION_DB_PASSWORD` | DB/user derive; password mới chỉ volume mới | Order/payment/period persisted |
| `IDENTITY_JWKS_URI`, `IDENTITY_JWT_ISSUER`, `IDENTITY_JWT_USER_AUDIENCE`, `IDENTITY_JWT_SERVICE_AUDIENCE` | JWKS DNS và properties nhất quán | Owner/Admin APIs và liên service |
| `IDENTITY_SERVICE_URL`, `SUBSCRIPTION_CLIENT_SECRET` | Client secret dùng lại, URL derive | Token cho Bakery activation |
| `BAKERY_SERVICE_URL`, `SUBSCRIPTION_BAKERY_SERVICE_TOKEN` | Docker DNS, fallback kế thừa | Admin approve → Bakery activation; không giả mọi fallback đã được dùng |
| `SUBSCRIPTION_MINIO_ENDPOINT`, `SUBSCRIPTION_MINIO_PUBLIC_ENDPOINT`, `SUBSCRIPTION_MINIO_BUCKET`, `SUBSCRIPTION_MINIO_ACCESS_KEY`, `SUBSCRIPTION_MINIO_SECRET_KEY` | Bucket payment riêng trong MinIO local; storage credential mới | Proof upload/read và Admin review |
| `SERVER_PORT` | Internal 8080, host mapping riêng | Business API tại 18104 |

Deployment còn kế thừa alias `IDENTITY_SERVICE_BASE_URL`, `IDENTITY_JWK_SET_URI`, `BAKERY_SERVICE_BASE_URL`, `SUBSCRIPTION_SERVICE_BASE_URL`, các URL self-service và `STORAGE_MINIO_REGION` từ container gốc. Những tên không được application.yml hiện tại tham chiếu chỉ là env kế thừa; không coi chúng là required hoặc đã được business flow sử dụng. Không phụ thuộc `.env` interpolation để chạy deployment này. Docker runtime env, default Spring property và mounted grants là ba nguồn khác nhau.

## Cấu hình mới và bảo mật

`runtime-generated.json` ngoài repository giữ bốn giá trị sinh một lần bằng Python `secrets`: `bakeryDbPassword`, `subscriptionDbPassword`, `storageSecret` dùng 32 byte CSPRNG (256 bit entropy mỗi giá trị); `storageAccess` là identifier 12 byte (96 bit). Credential storage được share cho Bakery/Subscription vì dùng cùng MinIO local; bucket khác nhau. Đây là quyền root local, chưa phải mô hình storage least-privilege cho production.

Password PostgreSQL mới chỉ áp dụng cho named volume mới được initialize; không giả định env đổi được password của DB cũ. Không đổi RSA signing/encryption key hoặc Admin đã có. Không tạo HS256 secret vì source dùng RS256. Customer mới được đăng ký qua UI, mật khẩu CSPRNG 24 byte giữ ngoài repo trong `mobile-live-user.json`, không nhúng APK.

File `service-clients.yml` mới giữ hash/grants gốc và thêm đúng scope source gọi: Bakery→Identity `identity:bakery-owner:grant`; Subscription→Bakery `bakery:onboarding:activate`. Không chỉnh file grants external gốc. Admin hợp lệ tìm lại được trong `local-smoke-users.json`; không tạo Admin giả, không dùng SQL.

Hai lần Compose up giữ nguyên file generated, credential và volume. Restart Bakery xong API và 15 kiểm tra đối chiếu vẫn đạt. Source/Compose chỉ ghi đường dẫn hoặc mapping cần thiết; không in full env/config. Private `compose.json` có secret runtime nên phải giữ ngoài Git và bảo vệ cùng ACL. Không chép thư mục `.secrets` vào repository.

## Khởi động và restart an toàn

Lệnh đầy đủ đã diễn tập trong [README](../README.md) và [runbook](LOCAL_RUNBOOK_VERIFICATION_VI.md). Cốt lõi từ root:

```powershell
docker start bakery-local-identity-db-1
python -B mobile/tool/recreate_runtime_h.py
python -B mobile/tool/runtime_preflight.py
python -B mobile/tool/run_reference_web.py
docker compose -p bakery-mobile-20261107 -f H:\MSS\.runtime\bakery-mobile-phases-1-4\compose.json restart mobile-bakery
```

Không `down -v`, prune hoặc reset PostgreSQL. `restart: unless-stopped` áp dụng container runtime mới; vẫn cần Docker daemon/desktop khởi động sau reboot. Chưa thực hiện host reboot, nên không xác nhận cold host boot hoàn chỉnh. Gateway, các bounded context ngoài phạm vi, external payment/SMTP/cloud production không được tuyên bố hoạt động.
