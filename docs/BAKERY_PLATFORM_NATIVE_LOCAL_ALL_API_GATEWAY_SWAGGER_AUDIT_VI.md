# Kiểm toán Backend native Windows, toàn bộ API, Gateway và Swagger

**Kết quả tổng thể: PARTIAL — không đạt FULL PASS.**

RUN_ID: `bakery-native-audit-20261111-144126`; múi giờ Asia/Saigon. Baseline hash: 2026-11-11T14:43:48.814041+07:00; biên soạn final: 2026-11-11T15:26:43.711247+07:00. Báo cáo này là tệp repository duy nhất được tạo trong lượt kiểm thử. Không thực hiện sửa lỗi.

## 1. Tổng quan cuộc kiểm toán

Đã đọc toàn bộ Master Prompt 553 dòng, lập snapshot từ working tree hiện tại, build reactor, chạy native Java và PostgreSQL Windows Service; không chạy bất kỳ công cụ/container/Docker/Testcontainers nào. Sáu business service cùng Gateway khởi chạy; Cake AI không sẵn sàng do PostgreSQL từ chối xác thực. Không gọi Gemini, VNPay hay Firebase/GCS bên ngoài.

| Chỉ số | Kết quả |
|---|---|
| Commit / branch | 20663353d4818e21f20527f3499f430381ab60d4 / dev |
| Operation controller trong source | 131 |
| Operation hiện diện trong OpenAPI runtime của sáu service | 120 |
| Direct được gửi probe | 131/131, gồm cả negative và lỗi kết nối |
| Gateway-eligible được gửi probe | 110/110, gồm cả negative và upstream failure |
| Có ít nhất một scenario hợp lệ 2xx đã kiểm chứng direct | 65/131 — 49.62% |
| Có ít nhất một scenario hợp lệ 2xx qua Gateway | 58/110 — 52.73% |
| Operation có terminal PASS_DIRECT_AND_GATEWAY | 54 |
| Maven test thực thi | 194 PASS; 0 failure; 0 error; 0 JUnit skip |
| Test phụ thuộc container | 17 lớp concrete bị BLOCKED_NO_DOCKER; 3 lớp base không chạy |
| HTTP trong ledger ngoài repository | 660 |
| Workflow E2E liên service hoàn chỉnh | 0/5; chi tiết phần 24 |

Số API có một happy path PASS không có nghĩa mọi role/filter/nhánh đều PASS. Ví dụ RFQ list, Offer list và Chat list có scenario 200 nhưng vẫn có nhánh lỗi; terminal của chúng là FAIL_DIRECT. Các API public danh sách rỗng được ghi đúng giới hạn, không dùng để chứng minh entitlement đang hoạt động.

## 2. Cam kết bất biến source code và dữ liệu

Baseline có sẵn 7 service `application.yml` bị sửa, 3 JSON evidence mobile bị sửa, Master Prompt mới và `mobile/docs/local-runs/` untracked. Không revert, stage, format hay ghi đè các thay đổi này. Mọi build/test/script/log ở thư mục ngoài repository bên dưới.

```text
C:\Users\phuck\AppData\Local\Temp\bakery-native-audit-20261111-144126
```

Đã fingerprint 3872 tệp duy nhất. Chỉ PostgreSQL native đã cài sẵn được sử dụng. Sáu database audit mới có prefix `native_audit_20261111_144126_`; không đưa Java vào sáu database hiện hữu có dữ liệu. Cake AI chỉ thử credential hiện có, bị chặn trước khi chạy migration. Chi tiết so sánh cuối ở phần 32.

Tài khoản synthetic được đăng ký qua API thật. Chỉ bootstrap ADMIN đầu tiên bằng INSERT role trong database audit mới do không có API tạo ADMIN ban đầu; các quyền OWNER sau đó cấp bằng API ADMIN thật. Hai bakery DRAFT + membership OWNER được seed riêng để kiểm thử độc lập Catalog. Đây là fixture database có ID PostgreSQL thực, **không được tính là luồng tạo tiệm/onboarding thành công**. Không seed Order, Offer, Payment, Conversation, Message hoặc AI Design giả để vượt qua blocker.

## 3. Thông tin môi trường Windows Local

| Thành phần | Thực tế |
|---|---|
| OS / shell | Windows 11 amd64; Windows PowerShell 5.1.26100.9711 |
| Java | Oracle JDK 21.0.8 LTS; `C:/Program Files/Java/jdk-21/bin/java.exe` |
| Maven | 3.9.11; `C:/Program Files/apache-maven-3.9.11/bin/mvn.cmd` |
| PostgreSQL | 18.4; Windows Service `postgresql-x64-18`, PID server ban đầu 9516, port 5432 |
| PostgreSQL provenance | `pg_ctl.exe runservice`, installation `C:/Program Files/PostgreSQL/18`; không phải container proxy |
| psql | Có binary native tại `C:/Program Files/PostgreSQL/18/bin/psql.exe`, không có trong PATH |
| Python | 3.13; requests, python-dotenv, PyYAML, Pillow có sẵn; không cài dependency mới |
| Spring Boot / Spring Security | 4.1.1 / 7.1.1 từ executable JAR |
| Spring Cloud / Gateway | BOM 2025.1.3; Gateway Server Web MVC 5.0.3 |
| Springdoc / Flyway / Hibernate | 3.1.0 / 12.4.0 / 7.4.5.Final |
| Profiles | default cho cả 8 application; không dùng profile Docker hay test thay thế runtime thật |
| Port trước chạy | 8080–8087 trống; không dừng tiến trình có sẵn |

## 4. Kết quả đọc và phân tích toàn bộ Backend

Đã đọc/lập chỉ mục 688 tệp text (34.644 dòng), gồm 618 Java files (545 main, 73 test/helper/base), 12 POM và toàn bộ controller, DTO, security, business service, repository/query, migrations, CONTEXT. Phân tích mapping cân bằng dấu ngoặc/chuỗi để ghép prefix lớp với path method, tách method/content condition và đối chiếu OpenAPI runtime. Không tìm thấy functional RouterFunction/programmatic registerMapping trong main source; Gateway định nghĩa route bằng properties.

Reactor thực có 11 project gồm parent, platform-support, bảy domain service, Gateway, integration-tests. Thư mục `cake-ai-integration-tests` có POM riêng nhưng **không nằm trong `<modules>`**; test ở đây phụ thuộc Testcontainers và không chạy. platform-support chỉ chia sẻ hạ tầng kỹ thuật, không có domain controller mới.

| Module | Tệp text | Dòng | Vai trò |
|---|---|---|---|
| api-gateway | 11 | 265 | HTTP application |
| bakery-service | 128 | 7033 | HTTP application |
| cake-ai-integration-tests | 3 | 220 | shared/test/build |
| cake-ai-service | 67 | 3001 | HTTP application |
| chat-service | 76 | 3413 | HTTP application |
| identity-service | 96 | 3980 | HTTP application |
| integration-tests | 2 | 468 | shared/test/build |
| marketplace-service | 102 | 5871 | HTTP application |
| order-service | 102 | 4721 | HTTP application |
| platform-support | 13 | 599 | shared/test/build |
| subscription-service | 86 | 4999 | HTTP application |

Đối chiếu tài liệu thấy CONTEXT User còn ghi profile/admin/address pending và CONTEXT Review còn ghi skeleton, trong khi controller hiện tại đã triển khai. API_SPEC đã có ghi chú prefix local; URL target không prefix trong phần đầu không phải cấu hình Gateway đang chạy. Toàn bộ inventory lấy source hiện tại làm chuẩn, không lấy số PASS cũ.

## 5. Sơ đồ và ánh xạ Gateway 8080 ↔ 8081–8087

```text
HTTP client -> Java Gateway :8080
  /identity/api/**     -> Identity :8081
  /bakery/api/**       -> Bakery :8082
  /marketplace/api/**  -> Marketplace :8083
  /subscription/api/** -> Subscription :8084
  /cake-ai/api/**      -> Cake AI :8085 (không lắng nghe)
  /orders/api/**       -> Order :8086
  /chat/api/**         -> Chat :8087
Các service -> PostgreSQL native :5432 -> database audit riêng
```

| Port | Module / Spring name | Main class | PID | Profile / health | Kết quả runtime |
|---|---|---|---|---|---|
| 8080 | api-gateway | com.se193262.apigateway.ApiGatewayApplication | 6928 | default; /actuator/health | RUNNING_WITH_LIMITATIONS — 6 upstream thật |
| 8081 | identity-service | com.se193262.identityservice.IdentityServiceApplication | 33216 | default; /actuator/health | RUNNING_WITH_LIMITATIONS |
| 8082 | bakery-service | com.se193262.bakeryservice.BakeryServiceApplication | 36108 | default; không có Actuator JAR | RUNNING_WITH_LIMITATIONS |
| 8083 | marketplace-service | com.se193262.marketplaceservice.MarketplaceServiceApplication | 16364 | default; /actuator/health | RUNNING_WITH_LIMITATIONS |
| 8084 | subscription-service | com.se193262.subscriptionservice.SubscriptionServiceApplication | 34484 | default; không có Actuator JAR | RUNNING_WITH_LIMITATIONS |
| 8085 | cake-ai-service | com.se193262.cakeaiservice.CakeAiServiceApplication | 18916 | default; không start | FAILED (28P01) |
| 8086 | order-service | com.se193262.orderservice.OrderServiceApplication | 22312 | default; không có Actuator JAR | RUNNING_WITH_LIMITATIONS |
| 8087 | chat-service | com.se193262.chatservice.ChatServiceApplication | 7164 | default; không có Actuator JAR | RUNNING_WITH_LIMITATIONS |

Source port: service YAML `server.port`; Gateway properties `services.*.url`. Gateway có 7 business route + 7 docs route, StripPrefix=1; cookie refresh của Identity được rewrite Path sang `/identity/api/v1/auth`. Không có service discovery, message broker hoặc Redis bắt buộc trong source hiện tại. Internal HTTP trực tiếp dùng JWT audience/scope, không đi qua route public Gateway.

## 6. Root `.env` và Spring property binding

Đọc đúng root `.env` như dữ liệu UTF-8, không Invoke-Expression/dot-source/setx. Duplicate theo thứ tự file, assignment cuối thắng. Hai entry có tên không phù hợp regex `[A-Za-z_][A-Za-z0-9_]*` bị từ chối riêng, không tự sửa hoặc đoán giá trị:

- Dòng 58 dùng cú pháp colon cho `ORDER_DB_URL`; tên biến hợp lệ này thực tế ABSENT; YAML có default local.
- Dòng 64 dùng cú pháp colon cho `CHAT_DB_URL`; tên hợp lệ ABSENT; YAML default local.
- `IDENTITY_JWKS_URI` xuất hiện hai lần, cùng giá trị.
- `CAKE_AI_DB_PASSWORD` xuất hiện hai lần, khác giá trị; assignment cuối được inject và PostgreSQL từ chối. Không thử thay credential bằng assignment trước.

Một số YAML có `optional:file:.env[.properties]`, đây là Java properties parsing theo working directory và không đồng nghĩa dotenv parser. Audit không đặt `.env` vào runtime cwd; dùng process environment để có semantics rõ ràng. Chỉ biến được YAML tham chiếu, tên hợp lệ, cần cho từng service được truyền. System environment không thay đổi. `SPRING_DATASOURCE_URL` override endpoint đến database audit; `SERVER_PORT` cố định topology, không đổi mật khẩu/key/feature gate.

| Biến trong root .env | Trạng thái |
|---|---|
| IDENTITY_DB_URL | SET |
| IDENTITY_DB_USERNAME | SET |
| IDENTITY_DB_PASSWORD | SET |
| IDENTITY_JWKS_URI | SET |
| IDENTITY_JWT_PRIVATE_KEY_PATH | SET |
| IDENTITY_JWT_PUBLIC_KEY_PATH | SET |
| SERVER_PORT_IDENTITY | SET |
| FIREBASE_CREDENTIALS_FILE | SET |
| FIREBASE_PROJECT_ID | SET |
| FIREBASE_STORAGE_BUCKET | SET |
| BAKERY_DB_URL | SET |
| BAKERY_DB_USERNAME | SET |
| BAKERY_DB_PASSWORD | SET |
| BAKERY_CLIENT_SECRET | SET |
| BAKERY_MINIO_ACCESS_KEY | SET |
| BAKERY_MINIO_ENDPOINT | SET |
| BAKERY_MINIO_SECRET_KEY | SET |
| BAKERY_MINIO_PUBLIC_ENDPOINT | SET |
| SERVER_PORT_BAKERY | SET |
| MARKETPLACE_CLIENT_SECRET | SET |
| MARKETPLACE_CLIENT_SECRET_HASH | SET |
| MARKETPLACE_DB_URL | SET |
| MARKETPLACE_DB_USERNAME | SET |
| MARKETPLACE_DB_PASSWORD | SET |
| SERVER_PORT_MARKETPLACE | SET |
| SUBSCRIPTION_DB_URL | SET |
| SUBSCRIPTION_DB_USERNAME | SET |
| SUBSCRIPTION_DB_PASSWORD | SET |
| SERVER_PORT_SUBSCRIPTION | SET |
| SUBSCRIPTION_VNPAY_TMN_CODE | SET |
| SUBSCRIPTION_VNPAY_HASH_SECRET | SET |
| SUBSCRIPTION_VNPAY_PAYMENT_URL | SET |
| SUBSCRIPTION_VNPAY_RETURN_URL | SET |
| SUBSCRIPTION_MINIO_ENDPOINT | SET |
| SUBSCRIPTION_MINIO_PUBLIC_ENDPOINT | SET |
| SUBSCRIPTION_MINIO_ACCESS_KEY | SET |
| SUBSCRIPTION_MINIO_SECRET_KEY | SET |
| SUBSCRIPTION_CLIENT_SECRET | SET |
| CAKE_AI_DB_URL | SET |
| CAKE_AI_DB_USERNAME | SET |
| CAKE_AI_DB_PASSWORD | SET |
| SERVER_PORT_CAKE_AI | SET |
| CAKE_AI_CLIENT_SECRET | SET |
| CAKE_AI_CLIENT_SECRET_HASH | SET |
| ORDER_DB_USERNAME | SET |
| ORDER_DB_PASSWORD | SET |
| SERVER_PORT_ORDER | SET |
| CHAT_DB_USERNAME | SET |
| CHAT_DB_PASSWORD | SET |
| SERVER_PORT_CHAT | SET |

Ma trận binding đầy đủ theo mọi placeholder YAML (chỉ tên và trạng thái, không giá trị):

| Service | Property | Variable | Root .env | Native binding / kết luận |
|---|---|---|---|---|
| bakery-service | spring.security.oauth2.resourceserver.jwt.jwk-set-uri | IDENTITY_JWKS_URI | SET | INJECTED_FROM_ROOT |
| bakery-service | spring.security.oauth2.resourceserver.jwt.issuer-uri | IDENTITY_JWT_ISSUER | ABSENT | DEFAULT/EMPTY — xem source và blocker; không tự tạo |
| bakery-service | spring.datasource.url | BAKERY_DB_URL | SET | INJECTED_FROM_ROOT |
| bakery-service | spring.datasource.username | BAKERY_DB_USERNAME | SET | INJECTED_FROM_ROOT |
| bakery-service | spring.datasource.password | BAKERY_DB_PASSWORD | SET | INJECTED_FROM_ROOT |
| bakery-service | platform.remote.identity-url | IDENTITY_SERVICE_URL | ABSENT | DEFAULT/EMPTY — xem source và blocker; không tự tạo |
| bakery-service | platform.remote.client-secret | BAKERY_CLIENT_SECRET | SET | INJECTED_FROM_ROOT |
| bakery-service | security.jwt.user-audience | IDENTITY_JWT_USER_AUDIENCE | ABSENT | DEFAULT/EMPTY — xem source và blocker; không tự tạo |
| bakery-service | security.jwt.service-audience | IDENTITY_JWT_SERVICE_AUDIENCE | ABSENT | DEFAULT/EMPTY — xem source và blocker; không tự tạo |
| bakery-service | clients.identity.url | IDENTITY_SERVICE_URL | ABSENT | DEFAULT/EMPTY — xem source và blocker; không tự tạo |
| bakery-service | clients.identity.service-token | BAKERY_IDENTITY_SERVICE_TOKEN | ABSENT | DEFAULT/EMPTY — xem source và blocker; không tự tạo |
| bakery-service | clients.subscription.url | SUBSCRIPTION_SERVICE_URL | ABSENT | DEFAULT/EMPTY — xem source và blocker; không tự tạo |
| bakery-service | clients.subscription.service-token | SUBSCRIPTION_SERVICE_TOKEN | ABSENT | DEFAULT/EMPTY — xem source và blocker; không tự tạo |
| bakery-service | storage.minio.endpoint | BAKERY_MINIO_ENDPOINT | SET | INJECTED_FROM_ROOT |
| bakery-service | storage.minio.public-endpoint | BAKERY_MINIO_PUBLIC_ENDPOINT | SET | INJECTED_FROM_ROOT |
| bakery-service | storage.minio.access-key | BAKERY_MINIO_ACCESS_KEY | SET | INJECTED_FROM_ROOT |
| bakery-service | storage.minio.secret-key | BAKERY_MINIO_SECRET_KEY | SET | INJECTED_FROM_ROOT |
| bakery-service | storage.minio.bucket | BAKERY_MINIO_BUCKET | ABSENT | DEFAULT/EMPTY — xem source và blocker; không tự tạo |
| bakery-service | server.port | SERVER_PORT_BAKERY | SET | INJECTED_FROM_ROOT |
| cake-ai-service | spring.datasource.url | CAKE_AI_DB_URL | SET | INJECTED_FROM_ROOT |
| cake-ai-service | spring.datasource.username | CAKE_AI_DB_USERNAME | SET | INJECTED_FROM_ROOT |
| cake-ai-service | spring.datasource.password | CAKE_AI_DB_PASSWORD | SET | INJECTED_FROM_ROOT |
| cake-ai-service | platform.security.jwk-set-uri | IDENTITY_JWK_SET_URI | ABSENT | DEFAULT/EMPTY — xem source và blocker; không tự tạo |
| cake-ai-service | platform.security.issuer | IDENTITY_JWT_ISSUER | ABSENT | DEFAULT/EMPTY — xem source và blocker; không tự tạo |
| cake-ai-service | platform.remote.identity-url | IDENTITY_SERVICE_BASE_URL | ABSENT | DEFAULT/EMPTY — xem source và blocker; không tự tạo |
| cake-ai-service | platform.remote.bakery-url | BAKERY_SERVICE_BASE_URL | ABSENT | DEFAULT/EMPTY — xem source và blocker; không tự tạo |
| cake-ai-service | platform.remote.subscription-url | SUBSCRIPTION_SERVICE_BASE_URL | ABSENT | DEFAULT/EMPTY — xem source và blocker; không tự tạo |
| cake-ai-service | platform.remote.cake-ai-url | CAKE_AI_SERVICE_BASE_URL | ABSENT | DEFAULT/EMPTY — xem source và blocker; không tự tạo |
| cake-ai-service | platform.remote.order-url | ORDER_SERVICE_BASE_URL | ABSENT | DEFAULT/EMPTY — xem source và blocker; không tự tạo |
| cake-ai-service | platform.remote.marketplace-url | MARKETPLACE_SERVICE_BASE_URL | ABSENT | DEFAULT/EMPTY — xem source và blocker; không tự tạo |
| cake-ai-service | platform.remote.client-id | SERVICE_CLIENT_ID | ABSENT | DEFAULT/EMPTY — xem source và blocker; không tự tạo |
| cake-ai-service | platform.remote.client-secret | SERVICE_CLIENT_SECRET | ABSENT | DEFAULT/EMPTY — xem source và blocker; không tự tạo |
| cake-ai-service | cake-ai.api-key | CAKE_AI_API_KEY | ABSENT | DEFAULT/EMPTY — xem source và blocker; không tự tạo |
| cake-ai-service | cake-ai.provider-url | CAKE_AI_PROVIDER_URL | ABSENT | DEFAULT/EMPTY — xem source và blocker; không tự tạo |
| cake-ai-service | cake-ai.image-model | CAKE_AI_IMAGE_MODEL | ABSENT | DEFAULT/EMPTY — xem source và blocker; không tự tạo |
| cake-ai-service | cake-ai.moderation-model | CAKE_AI_MODERATION_MODEL | ABSENT | DEFAULT/EMPTY — xem source và blocker; không tự tạo |
| cake-ai-service | cake-ai.connect-timeout | CAKE_AI_CONNECT_TIMEOUT | ABSENT | DEFAULT/EMPTY — xem source và blocker; không tự tạo |
| cake-ai-service | cake-ai.read-timeout | CAKE_AI_READ_TIMEOUT | ABSENT | DEFAULT/EMPTY — xem source và blocker; không tự tạo |
| cake-ai-service | cake-ai.workers | CAKE_AI_WORKERS | ABSENT | DEFAULT/EMPTY — xem source và blocker; không tự tạo |
| cake-ai-service | cake-ai.lease-duration | CAKE_AI_LEASE_DURATION | ABSENT | DEFAULT/EMPTY — xem source và blocker; không tự tạo |
| cake-ai-service | cake-ai.firebase-project-id | CAKE_AI_FIREBASE_PROJECT_ID | ABSENT | DEFAULT/EMPTY — xem source và blocker; không tự tạo |
| cake-ai-service | cake-ai.firebase-project-id | FIREBASE_PROJECT_ID | SET | INJECTED_FROM_ROOT |
| cake-ai-service | cake-ai.firebase-bucket | CAKE_AI_FIREBASE_BUCKET | ABSENT | DEFAULT/EMPTY — xem source và blocker; không tự tạo |
| cake-ai-service | cake-ai.firebase-bucket | FIREBASE_STORAGE_BUCKET | SET | INJECTED_FROM_ROOT |
| cake-ai-service | cake-ai.scheduler-enabled | CAKE_AI_SCHEDULER_ENABLED | ABSENT | DEFAULT/EMPTY — xem source và blocker; không tự tạo |
| cake-ai-service | cake-ai.poll-delay-ms | CAKE_AI_POLL_DELAY_MS | ABSENT | DEFAULT/EMPTY — xem source và blocker; không tự tạo |
| cake-ai-service | cake-ai.policy.enabled | CAKE_AI_ENABLED | ABSENT | DEFAULT/EMPTY — xem source và blocker; không tự tạo |
| cake-ai-service | cake-ai.policy.require-admin-review | CAKE_AI_REQUIRE_ADMIN_REVIEW | ABSENT | DEFAULT/EMPTY — xem source và blocker; không tự tạo |
| cake-ai-service | cake-ai.policy.daily-executions-per-customer | CAKE_AI_DAILY_EXECUTIONS_PER_CUSTOMER | ABSENT | DEFAULT/EMPTY — xem source và blocker; không tự tạo |
| cake-ai-service | cake-ai.policy.active-executions-per-customer | CAKE_AI_ACTIVE_EXECUTIONS_PER_CUSTOMER | ABSENT | DEFAULT/EMPTY — xem source và blocker; không tự tạo |
| cake-ai-service | cake-ai.policy.daily-provider-requests | CAKE_AI_DAILY_PROVIDER_REQUESTS | ABSENT | DEFAULT/EMPTY — xem source và blocker; không tự tạo |
| cake-ai-service | cake-ai.policy.image-output-tokens | CAKE_AI_IMAGE_OUTPUT_TOKENS | ABSENT | DEFAULT/EMPTY — xem source và blocker; không tự tạo |
| cake-ai-service | cake-ai.policy.moderation-output-tokens | CAKE_AI_MODERATION_OUTPUT_TOKENS | ABSENT | DEFAULT/EMPTY — xem source và blocker; không tự tạo |
| cake-ai-service | cake-ai.policy.cleanup-enabled | CAKE_AI_CLEANUP_ENABLED | ABSENT | DEFAULT/EMPTY — xem source và blocker; không tự tạo |
| cake-ai-service | cake-ai.policy.max-designs-per-execution | CAKE_AI_MAX_DESIGNS_PER_EXECUTION | ABSENT | DEFAULT/EMPTY — xem source và blocker; không tự tạo |
| cake-ai-service | server.port | SERVER_PORT_CAKE_AI | SET | INJECTED_FROM_ROOT |
| chat-service | spring.datasource.url | CHAT_DB_URL | ABSENT | DEFAULT/EMPTY — xem source và blocker; không tự tạo |
| chat-service | spring.datasource.username | CHAT_DB_USERNAME | SET | INJECTED_FROM_ROOT |
| chat-service | spring.datasource.password | CHAT_DB_PASSWORD | SET | INJECTED_FROM_ROOT |
| chat-service | security.jwt.jwk-set-uri | IDENTITY_JWK_SET_URI | ABSENT | DEFAULT/EMPTY — xem source và blocker; không tự tạo |
| chat-service | security.jwt.issuer | IDENTITY_JWT_ISSUER | ABSENT | DEFAULT/EMPTY — xem source và blocker; không tự tạo |
| chat-service | security.jwt.user-audience | IDENTITY_JWT_USER_AUDIENCE | ABSENT | DEFAULT/EMPTY — xem source và blocker; không tự tạo |
| chat-service | security.jwt.service-audience | CHAT_SERVICE_JWT_AUDIENCE | ABSENT | DEFAULT/EMPTY — xem source và blocker; không tự tạo |
| chat-service | clients.identity-url | IDENTITY_SERVICE_URL | ABSENT | DEFAULT/EMPTY — xem source và blocker; không tự tạo |
| chat-service | clients.client-id | CHAT_SERVICE_CLIENT_ID | ABSENT | DEFAULT/EMPTY — xem source và blocker; không tự tạo |
| chat-service | clients.client-secret | CHAT_SERVICE_CLIENT_SECRET | ABSENT | DEFAULT/EMPTY — xem source và blocker; không tự tạo |
| chat-service | clients.marketplace.base-url | MARKETPLACE_SERVICE_URL | ABSENT | DEFAULT/EMPTY — xem source và blocker; không tự tạo |
| chat-service | clients.bakery.base-url | BAKERY_SERVICE_URL | ABSENT | DEFAULT/EMPTY — xem source và blocker; không tự tạo |
| chat-service | clients.connect-timeout | SERVICE_CLIENT_CONNECT_TIMEOUT | ABSENT | DEFAULT/EMPTY — xem source và blocker; không tự tạo |
| chat-service | clients.read-timeout | SERVICE_CLIENT_READ_TIMEOUT | ABSENT | DEFAULT/EMPTY — xem source và blocker; không tự tạo |
| chat-service | storage.minio.endpoint | CHAT_STORAGE_ENDPOINT | ABSENT | DEFAULT/EMPTY — xem source và blocker; không tự tạo |
| chat-service | storage.minio.public-endpoint | CHAT_STORAGE_PUBLIC_ENDPOINT | ABSENT | DEFAULT/EMPTY — xem source và blocker; không tự tạo |
| chat-service | storage.minio.public-endpoint | CHAT_STORAGE_ENDPOINT | ABSENT | DEFAULT/EMPTY — xem source và blocker; không tự tạo |
| chat-service | storage.minio.region | CHAT_STORAGE_REGION | ABSENT | DEFAULT/EMPTY — xem source và blocker; không tự tạo |
| chat-service | storage.minio.access-key | CHAT_STORAGE_ACCESS_KEY | ABSENT | DEFAULT/EMPTY — xem source và blocker; không tự tạo |
| chat-service | storage.minio.secret-key | CHAT_STORAGE_SECRET_KEY | ABSENT | DEFAULT/EMPTY — xem source và blocker; không tự tạo |
| chat-service | storage.minio.bucket | CHAT_STORAGE_BUCKET | ABSENT | DEFAULT/EMPTY — xem source và blocker; không tự tạo |
| chat-service | storage.minio.presigned-url-expiry | CHAT_STORAGE_URL_EXPIRY | ABSENT | DEFAULT/EMPTY — xem source và blocker; không tự tạo |
| chat-service | server.port | SERVER_PORT_CHAT | SET | INJECTED_FROM_ROOT |
| identity-service | spring.datasource.url | IDENTITY_DB_URL | SET | INJECTED_FROM_ROOT |
| identity-service | spring.datasource.username | IDENTITY_DB_USERNAME | SET | INJECTED_FROM_ROOT |
| identity-service | spring.datasource.password | IDENTITY_DB_PASSWORD | SET | INJECTED_FROM_ROOT |
| identity-service | server.port | SERVER_PORT_IDENTITY | SET | INJECTED_FROM_ROOT |
| identity-service | security.jwt.private-key-path | IDENTITY_JWT_PRIVATE_KEY_PATH | SET | INJECTED_FROM_ROOT |
| identity-service | security.jwt.public-key-path | IDENTITY_JWT_PUBLIC_KEY_PATH | SET | INJECTED_FROM_ROOT |
| identity-service | security.jwt.key-id | IDENTITY_JWT_KEY_ID | ABSENT | DEFAULT/EMPTY — xem source và blocker; không tự tạo |
| identity-service | security.jwt.issuer | IDENTITY_JWT_ISSUER | ABSENT | DEFAULT/EMPTY — xem source và blocker; không tự tạo |
| identity-service | security.jwt.user-audience | IDENTITY_JWT_USER_AUDIENCE | ABSENT | DEFAULT/EMPTY — xem source và blocker; không tự tạo |
| identity-service | security.jwt.service-audience | IDENTITY_JWT_SERVICE_AUDIENCE | ABSENT | DEFAULT/EMPTY — xem source và blocker; không tự tạo |
| identity-service | security.jwt.access-token-ttl | IDENTITY_JWT_ACCESS_TOKEN_TTL | ABSENT | DEFAULT/EMPTY — xem source và blocker; không tự tạo |
| identity-service | security.auth.refresh-token-ttl | IDENTITY_REFRESH_TOKEN_TTL | ABSENT | DEFAULT/EMPTY — xem source và blocker; không tự tạo |
| identity-service | security.auth.refresh-cookie-name | IDENTITY_REFRESH_COOKIE_NAME | ABSENT | DEFAULT/EMPTY — xem source và blocker; không tự tạo |
| identity-service | security.auth.refresh-cookie-secure | IDENTITY_REFRESH_COOKIE_SECURE | ABSENT | DEFAULT/EMPTY — xem source và blocker; không tự tạo |
| identity-service | security.auth.bcrypt-strength | IDENTITY_BCRYPT_STRENGTH | ABSENT | DEFAULT/EMPTY — xem source và blocker; không tự tạo |
| identity-service | security.cors.allowed-origins | IDENTITY_CORS_ALLOWED_ORIGINS | ABSENT | DEFAULT/EMPTY — xem source và blocker; không tự tạo |
| identity-service | security.service-clients.clients.marketplace-service.secret-hash | MARKETPLACE_CLIENT_SECRET_HASH | SET | INJECTED_FROM_ROOT |
| identity-service | security.service-clients.clients.order-service.secret-hash | ORDER_CLIENT_SECRET_HASH | ABSENT | DEFAULT/EMPTY — xem source và blocker; không tự tạo |
| identity-service | security.service-clients.clients.chat-service.secret-hash | CHAT_SERVICE_CLIENT_SECRET_HASH | ABSENT | DEFAULT/EMPTY — xem source và blocker; không tự tạo |
| identity-service | security.service-clients.clients.bakery-service.secret-hash | BAKERY_CLIENT_SECRET_HASH | ABSENT | DEFAULT/EMPTY — xem source và blocker; không tự tạo |
| identity-service | security.service-clients.clients.subscription-service.secret-hash | SUBSCRIPTION_CLIENT_SECRET_HASH | ABSENT | DEFAULT/EMPTY — xem source và blocker; không tự tạo |
| identity-service | security.service-clients.clients.cake-ai-service.secret-hash | CAKE_AI_CLIENT_SECRET_HASH | SET | INJECTED_FROM_ROOT |
| marketplace-service | spring.datasource.url | MARKETPLACE_DB_URL | SET | INJECTED_FROM_ROOT |
| marketplace-service | spring.datasource.username | MARKETPLACE_DB_USERNAME | SET | INJECTED_FROM_ROOT |
| marketplace-service | spring.datasource.password | MARKETPLACE_DB_PASSWORD | SET | INJECTED_FROM_ROOT |
| marketplace-service | platform.security.jwk-set-uri | IDENTITY_JWK_SET_URI | ABSENT | DEFAULT/EMPTY — xem source và blocker; không tự tạo |
| marketplace-service | platform.security.issuer | IDENTITY_JWT_ISSUER | ABSENT | DEFAULT/EMPTY — xem source và blocker; không tự tạo |
| marketplace-service | platform.remote.identity-url | IDENTITY_SERVICE_BASE_URL | ABSENT | DEFAULT/EMPTY — xem source và blocker; không tự tạo |
| marketplace-service | platform.remote.bakery-url | BAKERY_SERVICE_BASE_URL | ABSENT | DEFAULT/EMPTY — xem source và blocker; không tự tạo |
| marketplace-service | platform.remote.subscription-url | SUBSCRIPTION_SERVICE_BASE_URL | ABSENT | DEFAULT/EMPTY — xem source và blocker; không tự tạo |
| marketplace-service | platform.remote.cake-ai-url | CAKE_AI_SERVICE_BASE_URL | ABSENT | DEFAULT/EMPTY — xem source và blocker; không tự tạo |
| marketplace-service | platform.remote.order-url | ORDER_SERVICE_BASE_URL | ABSENT | DEFAULT/EMPTY — xem source và blocker; không tự tạo |
| marketplace-service | platform.remote.marketplace-url | MARKETPLACE_SERVICE_BASE_URL | ABSENT | DEFAULT/EMPTY — xem source và blocker; không tự tạo |
| marketplace-service | platform.remote.client-id | SERVICE_CLIENT_ID | ABSENT | DEFAULT/EMPTY — xem source và blocker; không tự tạo |
| marketplace-service | platform.remote.client-secret | SERVICE_CLIENT_SECRET | ABSENT | DEFAULT/EMPTY — xem source và blocker; không tự tạo |
| marketplace-service | marketplace.firebase.project-id | FIREBASE_PROJECT_ID | SET | INJECTED_FROM_ROOT |
| marketplace-service | marketplace.firebase.bucket | FIREBASE_STORAGE_BUCKET | SET | INJECTED_FROM_ROOT |
| marketplace-service | marketplace.firebase.connect-timeout | FIREBASE_CONNECT_TIMEOUT | ABSENT | DEFAULT/EMPTY — xem source và blocker; không tự tạo |
| marketplace-service | marketplace.firebase.read-timeout | FIREBASE_READ_TIMEOUT | ABSENT | DEFAULT/EMPTY — xem source và blocker; không tự tạo |
| marketplace-service | marketplace.scheduler-delay-ms | MARKETPLACE_SCHEDULER_DELAY_MS | ABSENT | DEFAULT/EMPTY — xem source và blocker; không tự tạo |
| marketplace-service | marketplace.orphan-cleanup-enabled | MARKETPLACE_ORPHAN_CLEANUP_ENABLED | ABSENT | DEFAULT/EMPTY — xem source và blocker; không tự tạo |
| marketplace-service | server.port | SERVER_PORT_MARKETPLACE | SET | INJECTED_FROM_ROOT |
| order-service | spring.datasource.url | ORDER_DB_URL | ABSENT | DEFAULT/EMPTY — xem source và blocker; không tự tạo |
| order-service | spring.datasource.username | ORDER_DB_USERNAME | SET | INJECTED_FROM_ROOT |
| order-service | spring.datasource.password | ORDER_DB_PASSWORD | SET | INJECTED_FROM_ROOT |
| order-service | security.jwt.jwk-set-uri | IDENTITY_JWK_SET_URI | ABSENT | DEFAULT/EMPTY — xem source và blocker; không tự tạo |
| order-service | security.jwt.issuer | IDENTITY_JWT_ISSUER | ABSENT | DEFAULT/EMPTY — xem source và blocker; không tự tạo |
| order-service | security.jwt.user-audience | IDENTITY_JWT_USER_AUDIENCE | ABSENT | DEFAULT/EMPTY — xem source và blocker; không tự tạo |
| order-service | security.jwt.service-audience | ORDER_SERVICE_JWT_AUDIENCE | ABSENT | DEFAULT/EMPTY — xem source và blocker; không tự tạo |
| order-service | clients.identity.base-url | IDENTITY_SERVICE_URL | ABSENT | DEFAULT/EMPTY — xem source và blocker; không tự tạo |
| order-service | clients.bakery.base-url | BAKERY_SERVICE_URL | ABSENT | DEFAULT/EMPTY — xem source và blocker; không tự tạo |
| order-service | clients.marketplace.base-url | MARKETPLACE_SERVICE_URL | ABSENT | DEFAULT/EMPTY — xem source và blocker; không tự tạo |
| order-service | clients.connect-timeout | SERVICE_CLIENT_CONNECT_TIMEOUT | ABSENT | DEFAULT/EMPTY — xem source và blocker; không tự tạo |
| order-service | clients.read-timeout | SERVICE_CLIENT_READ_TIMEOUT | ABSENT | DEFAULT/EMPTY — xem source và blocker; không tự tạo |
| order-service | platform.security.audience | ORDER_SERVICE_JWT_AUDIENCE | ABSENT | DEFAULT/EMPTY — xem source và blocker; không tự tạo |
| order-service | platform.security.jwk-set-uri | IDENTITY_JWK_SET_URI | ABSENT | DEFAULT/EMPTY — xem source và blocker; không tự tạo |
| order-service | platform.security.issuer | IDENTITY_JWT_ISSUER | ABSENT | DEFAULT/EMPTY — xem source và blocker; không tự tạo |
| order-service | platform.security.user-audience | IDENTITY_JWT_USER_AUDIENCE | ABSENT | DEFAULT/EMPTY — xem source và blocker; không tự tạo |
| order-service | platform.remote.identity-url | IDENTITY_SERVICE_URL | ABSENT | DEFAULT/EMPTY — xem source và blocker; không tự tạo |
| order-service | platform.remote.bakery-url | BAKERY_SERVICE_URL | ABSENT | DEFAULT/EMPTY — xem source và blocker; không tự tạo |
| order-service | platform.remote.subscription-url | SUBSCRIPTION_SERVICE_URL | ABSENT | DEFAULT/EMPTY — xem source và blocker; không tự tạo |
| order-service | platform.remote.cake-ai-url | CAKE_AI_SERVICE_URL | ABSENT | DEFAULT/EMPTY — xem source và blocker; không tự tạo |
| order-service | platform.remote.order-url | ORDER_SERVICE_URL | ABSENT | DEFAULT/EMPTY — xem source và blocker; không tự tạo |
| order-service | platform.remote.marketplace-url | MARKETPLACE_SERVICE_URL | ABSENT | DEFAULT/EMPTY — xem source và blocker; không tự tạo |
| order-service | platform.remote.client-id | ORDER_SERVICE_CLIENT_ID | ABSENT | DEFAULT/EMPTY — xem source và blocker; không tự tạo |
| order-service | platform.remote.client-secret | ORDER_SERVICE_CLIENT_SECRET | ABSENT | DEFAULT/EMPTY — xem source và blocker; không tự tạo |
| order-service | platform.remote.connect-timeout | SERVICE_CLIENT_CONNECT_TIMEOUT | ABSENT | DEFAULT/EMPTY — xem source và blocker; không tự tạo |
| order-service | platform.remote.read-timeout | SERVICE_CLIENT_READ_TIMEOUT | ABSENT | DEFAULT/EMPTY — xem source và blocker; không tự tạo |
| order-service | order.auto-completion.delay-hours | ORDER_AUTO_COMPLETION_DELAY_HOURS | ABSENT | DEFAULT/EMPTY — xem source và blocker; không tự tạo |
| order-service | order.auto-completion.interval-ms | ORDER_AUTO_COMPLETION_INTERVAL_MS | ABSENT | DEFAULT/EMPTY — xem source và blocker; không tự tạo |
| order-service | server.port | SERVER_PORT_ORDER | SET | INJECTED_FROM_ROOT |
| subscription-service | spring.security.oauth2.resourceserver.jwt.jwk-set-uri | IDENTITY_JWKS_URI | SET | INJECTED_FROM_ROOT |
| subscription-service | spring.security.oauth2.resourceserver.jwt.issuer-uri | IDENTITY_JWT_ISSUER | ABSENT | DEFAULT/EMPTY — xem source và blocker; không tự tạo |
| subscription-service | spring.datasource.url | SUBSCRIPTION_DB_URL | SET | INJECTED_FROM_ROOT |
| subscription-service | spring.datasource.username | SUBSCRIPTION_DB_USERNAME | SET | INJECTED_FROM_ROOT |
| subscription-service | spring.datasource.password | SUBSCRIPTION_DB_PASSWORD | SET | INJECTED_FROM_ROOT |
| subscription-service | platform.remote.identity-url | IDENTITY_SERVICE_URL | ABSENT | DEFAULT/EMPTY — xem source và blocker; không tự tạo |
| subscription-service | platform.remote.client-secret | SUBSCRIPTION_CLIENT_SECRET | SET | INJECTED_FROM_ROOT |
| subscription-service | security.jwt.user-audience | IDENTITY_JWT_USER_AUDIENCE | ABSENT | DEFAULT/EMPTY — xem source và blocker; không tự tạo |
| subscription-service | security.jwt.service-audience | IDENTITY_JWT_SERVICE_AUDIENCE | ABSENT | DEFAULT/EMPTY — xem source và blocker; không tự tạo |
| subscription-service | clients.bakery.url | BAKERY_SERVICE_URL | ABSENT | DEFAULT/EMPTY — xem source và blocker; không tự tạo |
| subscription-service | clients.bakery.service-token | SUBSCRIPTION_BAKERY_SERVICE_TOKEN | ABSENT | DEFAULT/EMPTY — xem source và blocker; không tự tạo |
| subscription-service | storage.minio.endpoint | SUBSCRIPTION_MINIO_ENDPOINT | SET | INJECTED_FROM_ROOT |
| subscription-service | storage.minio.public-endpoint | SUBSCRIPTION_MINIO_PUBLIC_ENDPOINT | SET | INJECTED_FROM_ROOT |
| subscription-service | storage.minio.access-key | SUBSCRIPTION_MINIO_ACCESS_KEY | SET | INJECTED_FROM_ROOT |
| subscription-service | storage.minio.secret-key | SUBSCRIPTION_MINIO_SECRET_KEY | SET | INJECTED_FROM_ROOT |
| subscription-service | storage.minio.bucket | SUBSCRIPTION_MINIO_BUCKET | ABSENT | DEFAULT/EMPTY — xem source và blocker; không tự tạo |
| subscription-service | subscription.vnpay.enabled | SUBSCRIPTION_VNPAY_ENABLED | ABSENT | DEFAULT/EMPTY — xem source và blocker; không tự tạo |
| subscription-service | subscription.vnpay.tmn-code | SUBSCRIPTION_VNPAY_TMN_CODE | SET | INJECTED_FROM_ROOT |
| subscription-service | subscription.vnpay.hash-secret | SUBSCRIPTION_VNPAY_HASH_SECRET | SET | INJECTED_FROM_ROOT |
| subscription-service | subscription.vnpay.payment-url | SUBSCRIPTION_VNPAY_PAYMENT_URL | SET | INJECTED_FROM_ROOT |
| subscription-service | subscription.vnpay.return-url | SUBSCRIPTION_VNPAY_RETURN_URL | SET | INJECTED_FROM_ROOT |
| subscription-service | server.port | SERVER_PORT_SUBSCRIPTION | SET | INJECTED_FROM_ROOT |

`MARKETPLACE_CLIENT_SECRET` và `CAKE_AI_CLIENT_SECRET` có trong file nhưng YAML của hai service lấy `SERVICE_CLIENT_SECRET`; không có alias thật trong native runtime. `FIREBASE_CREDENTIALS_FILE` tồn tại trên host nhưng adapter gọi Google ADC, không đọc tên biến này. Không suy luận key Gemini từ lịch sử: `CAKE_AI_API_KEY` ABSENT trong file đang đọc; chính process audit không nhận key. Không gọi provider.

## 7. Prerequisites non-Docker và mức độ sẵn sàng

| Dependency | Kiểm chứng | Kết luận |
|---|---|---|
| PostgreSQL native | Service/PID/binary + psql SELECT version 18.4, read_only=on | Sẵn sàng cho 6 credential; Cake AI AUTH_FAILED |
| DB hiện hữu | 6 DB đọc fingerprint 50 bảng tổng, bao gồm Flyway history | Không dùng cho mutations/startup |
| DB audit | 6 DB mới; Flyway thật và JPA thật | Dữ liệu riêng cho campaign |
| MinIO native | Không binary/process/service phát hiện; TCP 9000–9005 không listen | BLOCKED_MISSING_LOCAL_DB_OR_STORAGE; không cài/tải/khởi chạy dependency mới |
| Redis | 6379 không listen; source không yêu cầu | Không phải blocker |
| Identity RSA files | Hai file được tham chiếu tồn tại; Identity load/key-pair check và phát hành JWT thật | Đã dùng, không copy nội dung |
| Internal clients | Probe cấu hình hiệu lực trả 400/401 cho các client chưa provision đúng | F02; không sửa hash/secret |
| Firebase/GCS | File được tham chiếu tồn tại nhưng không được ADC native consume qua tên hiện tại | Không gọi cloud/không upload/không scan bucket |
| Gemini | Không có cấp phép chi phí cho execution này; Cake AI không start | BLOCKED_EXTERNAL_PROVIDER_OR_COST |
| VNPay | Chỉ kiểm tra signature lỗi cục bộ; không truy cập website/provider | Không tạo giao dịch thanh toán |

Không có dependency giả thay PostgreSQL, storage hoặc service nội bộ. Không dùng H2/mock server làm bằng chứng runtime; mock HTTP/Mockito trong unit test được báo riêng.

## 8. Quy trình native build, startup và cleanup

Snapshot giữ nguyên uncommitted YAML hiện tại, không lấy stale target/JAR cũ. Loại target/.env/key material/log khỏi copy. 688 text files của Backend được đối chiếu với snapshot; canonical `database/` được copy thêm chỉ để hai MigrationSyncTest đọc đúng đường dẫn.

```powershell
Set-Location "C:\Users\phuck\AppData\Local\Temp\bakery-native-audit-20261111-144126\snapshot\backend"
mvn -B -ntp -DskipTests package
```

Build SUCCESS cho cả 11 reactor project; tests vẫn được compile nhưng không execute trong bước package. Tám executable JAR có JarLauncher, Start-Class chính xác và Boot 4.1.1.

| Module | Executable JAR | BOOT-INF/lib JAR |
|---|---|---|
| identity-service | identity-service-0.0.1-SNAPSHOT-exec.jar | 105 |
| bakery-service | bakery-service-0.0.1-SNAPSHOT-exec.jar | 130 |
| marketplace-service | marketplace-service-0.0.1-SNAPSHOT-exec.jar | 212 |
| subscription-service | subscription-service-0.0.1-SNAPSHOT-exec.jar | 119 |
| cake-ai-service | cake-ai-service-0.0.1-SNAPSHOT-exec.jar | 188 |
| order-service | order-service-0.0.1-SNAPSHOT-exec.jar | 98 |
| chat-service | chat-service-0.0.1-SNAPSHOT.jar | 118 |
| api-gateway | api-gateway-0.0.1-SNAPSHOT.jar | 67 |

Native launcher tạo Process environment, chạy `java -Xms64m -Xmx256m -jar <temp-jar>`; command line không chứa credential. stdout/stderr đi qua redactor trực tiếp vào log ngoài repo. Thứ tự tạo process: Identity → Bakery → Marketplace → Subscription → Cake AI → Order → Chat → Gateway; sau đó chờ startup thực tế và chỉ gửi HTTP khi có listener. Khởi tạo process không đồng nghĩa ready: Identity Started 14:49:34, sáu service còn lại/Gateway có Started ở 14:50; Cake AI exit 1.

Không restart shared service. Launcher có trần 40 phút để dừng trước Marketplace cloud cleanup initialDelay 1 giờ; không đổi cấu hình scheduler. Không có ADC env được inject và không gọi endpoint upload Firebase. Tình trạng dừng cuối được kiểm tra ở phần 32.

## 9. Tổng kiểm kê API từ source

| Service | Source operations | Direct có happy path | Gateway có happy path / eligible |
|---|---|---|---|
| identity-service | 21 | 18 | 16/16 |
| bakery-service | 42 | 26 | 23/35 |
| marketplace-service | 18 | 8 | 7/15 |
| subscription-service | 21 | 11 | 10/20 |
| cake-ai-service | 11 | 0 | 0/8 |
| order-service | 10 | 1 | 1/8 |
| chat-service | 8 | 1 | 1/8 |

HTTP methods: GET 55; POST 48; PATCH 14; PUT 7; DELETE 7. Tổng 131. Có 19 internal operation, 1 JWK và 1 retired `/storage/**`; 110 operation public-prefix đủ điều kiện Gateway. Không mở internal chỉ để tăng coverage. HEAD/OPTIONS tự sinh và resource tĩnh Swagger được báo ở nhóm framework, không nhân giả tổng controller.

Các bảng phần 10–16 giữ đủ một dòng cho mỗi operation. `Expected` là happy-path status từ controller; status negative không thay thế nó. Evidence ID trỏ ledger `http-events.jsonl` ngoài repo; URL có UUID trong ledger là UUID API/DB trả thật. Khi fixture không tồn tại, UUID synthetic đã có được dùng cố ý như sai loại resource để probe negative, không gắn nhãn happy path. Điểm này không tạo bakery/order/design/message giả.

### Tỷ lệ happy path theo domain

| Service | Direct có ít nhất một valid PASS | Gateway có ít nhất một valid PASS |
|---|---|---|
| identity-service | 18/21 (85.71%) | 16/16 (100.00%) |
| bakery-service | 26/42 (61.90%) | 23/35 (65.71%) |
| marketplace-service | 8/18 (44.44%) | 7/15 (46.67%) |
| subscription-service | 11/21 (52.38%) | 10/20 (50.00%) |
| cake-ai-service | 0/11 (0.00%) | 0/8 (0.00%) |
| order-service | 1/10 (10.00%) | 1/8 (12.50%) |
| chat-service | 1/8 (12.50%) | 1/8 (12.50%) |

Mẫu số direct là source operation; mẫu số Gateway là operation eligible. Đây không phải tỷ lệ full journey hay mọi nhánh đều thành công.

## 10. Bảng chi tiết từng API Identity

| ID | Service | Method | Direct port/path | Gateway path (8080) | Auth/role | Expected | Actual direct | Actual Gateway | Evidence | Status / reason |
|---|---|---|---|---|---|---|---|---|---|---|
| API-001 | identity-service | GET | 8081 /.well-known/jwks.json | — | Public | 200 | HTTP-0011:200 [HAPPY] | Không routable | [JwkSetController.java:1](../backend/identity-service/src/main/java/com/se193262/identityservice/config/JwkSetController.java#L1) dòng 22; HTTP-0011 | NOT_EXPOSED_BY_DESIGN; Direct hợp lệ đã đạt; không có route Gateway theo thiết kế |
| API-002 | identity-service | GET | 8081 /api/v1/users/me/addresses | /identity/api/v1/users/me/addresses | JWT user + ownership (trừ public theo security) | 200 | HTTP-0013:200 [HAPPY]<br>HTTP-0600:200 [HAPPY_EQUIVALENCE]<br>HTTP-0119:401 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | HTTP-0029:200 [HAPPY]<br>HTTP-0601:200 [HAPPY_EQUIVALENCE]<br>HTTP-0120:401 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | [AddressController.java:1](../backend/identity-service/src/main/java/com/se193262/identityservice/feature/address/AddressController.java#L1) dòng 21; HTTP-0013, HTTP-0029 | PASS_DIRECT_AND_GATEWAY; Scenario hợp lệ đã quan sát ở cả hai đường; giới hạn theo fixture nêu trong báo cáo |
| API-003 | identity-service | GET | 8081 /api/v1/users/me/addresses/{id} | /identity/api/v1/users/me/addresses/{id} | JWT user + ownership (trừ public theo security) | 200 | HTTP-0048:200 [HAPPY]<br>HTTP-0121:401 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | HTTP-0052:200 [HAPPY]<br>HTTP-0122:401 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | [AddressController.java:1](../backend/identity-service/src/main/java/com/se193262/identityservice/feature/address/AddressController.java#L1) dòng 26; HTTP-0048, HTTP-0051 | PASS_DIRECT_AND_GATEWAY; Scenario hợp lệ đã quan sát ở cả hai đường; giới hạn theo fixture nêu trong báo cáo |
| API-004 | identity-service | POST | 8081 /api/v1/users/me/addresses | /identity/api/v1/users/me/addresses | JWT user + ownership (trừ public theo security) | 201 | HTTP-0044:201 [HAPPY]<br>HTTP-0123:401 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | HTTP-0046:201 [HAPPY]<br>HTTP-0124:401 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | [AddressController.java:1](../backend/identity-service/src/main/java/com/se193262/identityservice/feature/address/AddressController.java#L1) dòng 31; HTTP-0044, HTTP-0046 | PASS_DIRECT_AND_GATEWAY; Scenario hợp lệ đã quan sát ở cả hai đường; giới hạn theo fixture nêu trong báo cáo |
| API-005 | identity-service | PATCH | 8081 /api/v1/users/me/addresses/{id} | /identity/api/v1/users/me/addresses/{id} | JWT user + ownership (trừ public theo security) | 200 | HTTP-0049:200 [HAPPY]<br>HTTP-0125:401 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | HTTP-0053:200 [HAPPY]<br>HTTP-0126:401 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | [AddressController.java:1](../backend/identity-service/src/main/java/com/se193262/identityservice/feature/address/AddressController.java#L1) dòng 37; HTTP-0049, HTTP-0053 | PASS_DIRECT_AND_GATEWAY; Scenario hợp lệ đã quan sát ở cả hai đường; giới hạn theo fixture nêu trong báo cáo |
| API-006 | identity-service | PUT | 8081 /api/v1/users/me/addresses/{id}/default | /identity/api/v1/users/me/addresses/{id}/default | JWT user + ownership (trừ public theo security) | 200 | HTTP-0050:200 [HAPPY]<br>HTTP-0127:401 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | HTTP-0054:200 [HAPPY]<br>HTTP-0128:401 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | [AddressController.java:1](../backend/identity-service/src/main/java/com/se193262/identityservice/feature/address/AddressController.java#L1) dòng 43; HTTP-0050, HTTP-0054 | PASS_DIRECT_AND_GATEWAY; Scenario hợp lệ đã quan sát ở cả hai đường; giới hạn theo fixture nêu trong báo cáo |
| API-007 | identity-service | DELETE | 8081 /api/v1/users/me/addresses/{id} | /identity/api/v1/users/me/addresses/{id} | JWT user + ownership (trừ public theo security) | 204 | HTTP-0430:204 [HAPPY_DELETE_OWN_FIXTURE]<br>HTTP-0129:401 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | HTTP-0463:204 [HAPPY_DELETE_OWN_FIXTURE]<br>HTTP-0130:401 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | [AddressController.java:1](../backend/identity-service/src/main/java/com/se193262/identityservice/feature/address/AddressController.java#L1) dòng 48; HTTP-0129, HTTP-0130 | PASS_DIRECT_AND_GATEWAY; Scenario hợp lệ đã quan sát ở cả hai đường; giới hạn theo fixture nêu trong báo cáo |
| API-008 | identity-service | POST | 8081 /api/v1/auth/register | /identity/api/v1/auth/register | Public | 201 | HTTP-0001:201 [HAPPY]<br>HTTP-0131:400 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | HTTP-0002:201 [HAPPY]<br>HTTP-0132:400 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | [AuthenticationController.java:1](../backend/identity-service/src/main/java/com/se193262/identityservice/feature/authentication/AuthenticationController.java#L1) dòng 41; HTTP-0001, HTTP-0002 | PASS_DIRECT_AND_GATEWAY; Scenario hợp lệ đã quan sát ở cả hai đường; giới hạn theo fixture nêu trong báo cáo |
| API-009 | identity-service | POST | 8081 /api/v1/auth/login | /identity/api/v1/auth/login | Public | 200 | HTTP-0005:200 [HAPPY]<br>HTTP-0133:400 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | HTTP-0459:200 [HAPPY]<br>HTTP-0134:400 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | [AuthenticationController.java:1](../backend/identity-service/src/main/java/com/se193262/identityservice/feature/authentication/AuthenticationController.java#L1) dòng 50; HTTP-0005, HTTP-0007 | PASS_DIRECT_AND_GATEWAY; Scenario hợp lệ đã quan sát ở cả hai đường; giới hạn theo fixture nêu trong báo cáo |
| API-010 | identity-service | POST | 8081 /api/v1/auth/refresh | /identity/api/v1/auth/refresh | Public / refresh cookie | 200 | HTTP-0565:200 [HAPPY_EXPLICIT_REAL_REFRESH_COOKIE]<br>HTTP-0427:401 [HAPPY_REFRESH_COOKIE]<br>HTTP-0135:401 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | HTTP-0580:200 [HAPPY_EXPLICIT_REAL_REFRESH_COOKIE]<br>HTTP-0460:401 [HAPPY_REFRESH_COOKIE]<br>HTTP-0136:401 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | [AuthenticationController.java:1](../backend/identity-service/src/main/java/com/se193262/identityservice/feature/authentication/AuthenticationController.java#L1) dòng 56; HTTP-0135, HTTP-0136 | PASS_DIRECT_AND_GATEWAY; Scenario hợp lệ đã quan sát ở cả hai đường; giới hạn theo fixture nêu trong báo cáo |
| API-011 | identity-service | POST | 8081 /api/v1/auth/logout | /identity/api/v1/auth/logout | JWT user + ownership (trừ public theo security) | 200 | HTTP-0428:200 [HAPPY_LOGOUT_COOKIE]<br>HTTP-0569:200 [HAPPY_EXPLICIT_REAL_LOGOUT_COOKIE]<br>HTTP-0137:401 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | HTTP-0461:200 [HAPPY_LOGOUT_COOKIE]<br>HTTP-0584:200 [HAPPY_EXPLICIT_REAL_LOGOUT_COOKIE]<br>HTTP-0138:401 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | [AuthenticationController.java:1](../backend/identity-service/src/main/java/com/se193262/identityservice/feature/authentication/AuthenticationController.java#L1) dòng 62; HTTP-0137, HTTP-0138 | PASS_DIRECT_AND_GATEWAY; Scenario hợp lệ đã quan sát ở cả hai đường; giới hạn theo fixture nêu trong báo cáo |
| API-012 | identity-service | GET | 8081 /api/v1/auth/me | /identity/api/v1/auth/me | JWT user + ownership (trừ public theo security) | 200 | HTTP-0012:200 [HAPPY]<br>HTTP-0571:200 [HAPPY_EQUIVALENCE]<br>HTTP-0659:401 [NEGATIVE_GENUINE_EXPIRED_JWT]<br>HTTP-0139:401 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | HTTP-0028:200 [HAPPY]<br>HTTP-0586:200 [HAPPY_EQUIVALENCE]<br>HTTP-0660:401 [NEGATIVE_GENUINE_EXPIRED_JWT]<br>HTTP-0140:401 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | [AuthenticationController.java:1](../backend/identity-service/src/main/java/com/se193262/identityservice/feature/authentication/AuthenticationController.java#L1) dòng 71; HTTP-0012, HTTP-0028 | PASS_DIRECT_AND_GATEWAY; Scenario hợp lệ đã quan sát ở cả hai đường; giới hạn theo fixture nêu trong báo cáo |
| API-013 | identity-service | POST | 8081 /internal/v1/auth/service-token | — | clientId/clientSecret + audience/scope | 200 | HTTP-0397:200 [CONFIGURED_SERVICE_AUTH]<br>HTTP-0646:401 [EFFECTIVE_NATIVE_CLIENT_AUTH_DIAGNOSIS]<br>HTTP-0648:400 [EFFECTIVE_NATIVE_CLIENT_AUTH_DIAGNOSIS]<br>HTTP-0141:400 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | Không routable | [ServiceTokenController.java:1](../backend/identity-service/src/main/java/com/se193262/identityservice/feature/authentication/ServiceTokenController.java#L1) dòng 16; HTTP-0141, HTTP-0397 | NOT_EXPOSED_BY_DESIGN; Direct hợp lệ đã đạt; không có route Gateway theo thiết kế |
| API-014 | identity-service | GET | 8081 /api/v1/admin/users | /identity/api/v1/admin/users | ADMIN | 200 | HTTP-0014:200 [HAPPY]<br>HTTP-0144:401 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | HTTP-0030:200 [HAPPY]<br>HTTP-0145:401 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | [AdminUserController.java:1](../backend/identity-service/src/main/java/com/se193262/identityservice/feature/user/AdminUserController.java#L1) dòng 37; HTTP-0014, HTTP-0030 | PASS_DIRECT_AND_GATEWAY; Scenario hợp lệ đã quan sát ở cả hai đường; giới hạn theo fixture nêu trong báo cáo |
| API-015 | identity-service | GET | 8081 /api/v1/admin/users/{userId} | /identity/api/v1/admin/users/{userId} | ADMIN | 200 | HTTP-0056:200 [HAPPY]<br>HTTP-0602:200 [HAPPY_EQUIVALENCE]<br>HTTP-0146:401 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | HTTP-0060:200 [HAPPY]<br>HTTP-0603:200 [HAPPY_EQUIVALENCE]<br>HTTP-0147:401 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | [AdminUserController.java:1](../backend/identity-service/src/main/java/com/se193262/identityservice/feature/user/AdminUserController.java#L1) dòng 48; HTTP-0056, HTTP-0060 | PASS_DIRECT_AND_GATEWAY; Scenario hợp lệ đã quan sát ở cả hai đường; giới hạn theo fixture nêu trong báo cáo |
| API-016 | identity-service | PATCH | 8081 /api/v1/admin/users/{userId}/status | /identity/api/v1/admin/users/{userId}/status | ADMIN | 200 | HTTP-0057:200 [HAPPY]<br>HTTP-0148:401 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | HTTP-0061:200 [HAPPY]<br>HTTP-0149:401 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | [AdminUserController.java:1](../backend/identity-service/src/main/java/com/se193262/identityservice/feature/user/AdminUserController.java#L1) dòng 53; HTTP-0057, HTTP-0058 | PASS_DIRECT_AND_GATEWAY; Scenario hợp lệ đã quan sát ở cả hai đường; giới hạn theo fixture nêu trong báo cáo |
| API-017 | identity-service | PUT | 8081 /api/v1/admin/users/{userId}/roles | /identity/api/v1/admin/users/{userId}/roles | ADMIN | 200 | HTTP-0006:200 [HAPPY]<br>HTTP-0655:200 [HAPPY_OWNER_B_FIXTURE_ROLE]<br>HTTP-0150:401 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | HTTP-0654:200 [HAPPY_GATEWAY_ROLES]<br>HTTP-0151:401 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | [AdminUserController.java:1](../backend/identity-service/src/main/java/com/se193262/identityservice/feature/user/AdminUserController.java#L1) dòng 62; HTTP-0006, HTTP-0150 | PASS_DIRECT_AND_GATEWAY; Scenario hợp lệ đã quan sát ở cả hai đường; giới hạn theo fixture nêu trong báo cáo |
| API-018 | identity-service | GET | 8081 /internal/v1/users/{id} | — | service JWT + scope | 200 | HTTP-0152:401 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | Không routable | [UserContextController.java:1](../backend/identity-service/src/main/java/com/se193262/identityservice/feature/user/UserContextController.java#L1) dòng 17; HTTP-0152 | NOT_EXPOSED_BY_DESIGN; Direct hợp lệ thiếu credential/fixture; không có route Gateway theo thiết kế |
| API-019 | identity-service | PUT | 8081 /internal/v1/users/{id}/bakery-owner | — | service JWT + scope | 204 | HTTP-0155:401 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | Không routable | [UserContextController.java:1](../backend/identity-service/src/main/java/com/se193262/identityservice/feature/user/UserContextController.java#L1) dòng 23; HTTP-0155 | NOT_EXPOSED_BY_DESIGN; Direct hợp lệ thiếu credential/fixture; không có route Gateway theo thiết kế |
| API-020 | identity-service | GET | 8081 /internal/v1/users/{userId}/addresses/{addressId} | — | service JWT + scope | 200 | HTTP-0158:401 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | Không routable | [UserContextController.java:1](../backend/identity-service/src/main/java/com/se193262/identityservice/feature/user/UserContextController.java#L1) dòng 30; HTTP-0158 | NOT_EXPOSED_BY_DESIGN; Direct hợp lệ thiếu credential/fixture; không có route Gateway theo thiết kế |
| API-021 | identity-service | PATCH | 8081 /api/v1/users/me | /identity/api/v1/users/me | JWT user + ownership (trừ public theo security) | 200 | HTTP-0045:200 [HAPPY]<br>HTTP-0161:401 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | HTTP-0047:200 [HAPPY]<br>HTTP-0162:401 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | [UserController.java:1](../backend/identity-service/src/main/java/com/se193262/identityservice/feature/user/UserController.java#L1) dòng 29; HTTP-0045, HTTP-0047 | PASS_DIRECT_AND_GATEWAY; Scenario hợp lệ đã quan sát ở cả hai đường; giới hạn theo fixture nêu trong báo cáo |

## 11. Bảng chi tiết từng API Bakery

| ID | Service | Method | Direct port/path | Gateway path (8080) | Auth/role | Expected | Actual direct | Actual Gateway | Evidence | Status / reason |
|---|---|---|---|---|---|---|---|---|---|---|
| API-022 | bakery-service | GET | 8082 /api/v1/bakeries/{bakeryId}/add-ons | /bakery/api/v1/bakeries/{bakeryId}/add-ons | BAKERY_OWNER + OWNER membership | 200 | HTTP-0489:200 [HAPPY]<br>HTTP-0163:401 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | HTTP-0530:200 [HAPPY]<br>HTTP-0164:401 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | [AddOnController.java:1](../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/addon/controller/AddOnController.java#L1) dòng 35; HTTP-0163, HTTP-0164 | PASS_DIRECT_AND_GATEWAY; Scenario hợp lệ đã quan sát ở cả hai đường; giới hạn theo fixture nêu trong báo cáo |
| API-023 | bakery-service | POST | 8082 /api/v1/bakeries/{bakeryId}/add-ons | /bakery/api/v1/bakeries/{bakeryId}/add-ons | BAKERY_OWNER + OWNER membership | 201 | HTTP-0488:201 [HAPPY]<br>HTTP-0165:401 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | HTTP-0529:201 [HAPPY]<br>HTTP-0166:401 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | [AddOnController.java:1](../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/addon/controller/AddOnController.java#L1) dòng 40; HTTP-0165, HTTP-0166 | PASS_DIRECT_AND_GATEWAY; Scenario hợp lệ đã quan sát ở cả hai đường; giới hạn theo fixture nêu trong báo cáo |
| API-024 | bakery-service | PATCH | 8082 /api/v1/bakeries/{bakeryId}/add-ons/{addOnId} | /bakery/api/v1/bakeries/{bakeryId}/add-ons/{addOnId} | BAKERY_OWNER + OWNER membership | 200 | HTTP-0490:200 [HAPPY]<br>HTTP-0167:401 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | HTTP-0531:200 [HAPPY]<br>HTTP-0168:401 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | [AddOnController.java:1](../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/addon/controller/AddOnController.java#L1) dòng 47; HTTP-0167, HTTP-0168 | PASS_DIRECT_AND_GATEWAY; Scenario hợp lệ đã quan sát ở cả hai đường; giới hạn theo fixture nêu trong báo cáo |
| API-025 | bakery-service | DELETE | 8082 /api/v1/bakeries/{bakeryId}/add-ons/{addOnId} | /bakery/api/v1/bakeries/{bakeryId}/add-ons/{addOnId} | BAKERY_OWNER + OWNER membership | 204 | HTTP-0518:204 [HAPPY_DELETE_OWN_FIXTURE]<br>HTTP-0169:401 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | HTTP-0559:204 [HAPPY_DELETE_OWN_FIXTURE]<br>HTTP-0170:401 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | [AddOnController.java:1](../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/addon/controller/AddOnController.java#L1) dòng 53; HTTP-0169, HTTP-0170 | PASS_DIRECT_AND_GATEWAY; Scenario hợp lệ đã quan sát ở cả hai đường; giới hạn theo fixture nêu trong báo cáo |
| API-026 | bakery-service | POST | 8082 /api/v1/bakeries/{bakeryId}/add-ons/{addOnId}/image | /bakery/api/v1/bakeries/{bakeryId}/add-ons/{addOnId}/image | BAKERY_OWNER + OWNER membership | 201 | HTTP-0491:400 [VALID_UPLOAD_MISSING_NATIVE_STORAGE]<br>HTTP-0171:401 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | HTTP-0532:400 [VALID_UPLOAD_MISSING_NATIVE_STORAGE]<br>HTTP-0172:401 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | [AddOnController.java:1](../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/addon/controller/AddOnController.java#L1) dòng 59; HTTP-0171, HTTP-0172 | FAIL_DIRECT; F04: xem chẩn đoán; có lỗi/thiếu cấu hình trong ít nhất một scenario |
| API-027 | bakery-service | GET | 8082 /api/v1/admin/bakeries | /bakery/api/v1/admin/bakeries | ADMIN | 200 | HTTP-0017:200 [HAPPY]<br>HTTP-0608:200 [HAPPY_EQUIVALENCE]<br>HTTP-0173:401 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | HTTP-0033:200 [HAPPY]<br>HTTP-0609:200 [HAPPY_EQUIVALENCE]<br>HTTP-0174:401 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | [AdminBakeryController.java:1](../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/controller/AdminBakeryController.java#L1) dòng 38; HTTP-0017, HTTP-0033 | PASS_DIRECT_AND_GATEWAY; Scenario hợp lệ đã quan sát ở cả hai đường; giới hạn theo fixture nêu trong báo cáo |
| API-028 | bakery-service | GET | 8082 /api/v1/admin/bakeries/{bakeryId} | /bakery/api/v1/admin/bakeries/{bakeryId} | ADMIN | 200 | HTTP-0481:200 [HAPPY]<br>HTTP-0175:401 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | HTTP-0522:200 [HAPPY]<br>HTTP-0176:401 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | [AdminBakeryController.java:1](../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/controller/AdminBakeryController.java#L1) dòng 49; HTTP-0175, HTTP-0176 | PASS_DIRECT_AND_GATEWAY; Scenario hợp lệ đã quan sát ở cả hai đường; giới hạn theo fixture nêu trong báo cáo |
| API-029 | bakery-service | PATCH | 8082 /api/v1/admin/bakeries/{bakeryId}/status | /bakery/api/v1/admin/bakeries/{bakeryId}/status | ADMIN | 200 | HTTP-0483:200 [HAPPY]<br>HTTP-0177:401 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | HTTP-0524:200 [HAPPY]<br>HTTP-0178:401 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | [AdminBakeryController.java:1](../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/controller/AdminBakeryController.java#L1) dòng 54; HTTP-0177, HTTP-0178 | PASS_DIRECT_AND_GATEWAY; Scenario hợp lệ đã quan sát ở cả hai đường; giới hạn theo fixture nêu trong báo cáo |
| API-030 | bakery-service | POST | 8082 /api/v1/bakeries | /bakery/api/v1/bakeries | JWT user + ownership (trừ public theo security) | 201 | HTTP-0080:503 [HAPPY]<br>HTTP-0179:401 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | HTTP-0083:503 [HAPPY]<br>HTTP-0180:401 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | [BakeryController.java:1](../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/controller/BakeryController.java#L1) dòng 37; HTTP-0080, HTTP-0083 | FAIL_DIRECT; F02: xem chẩn đoán; có lỗi/thiếu cấu hình trong ít nhất một scenario |
| API-031 | bakery-service | PATCH | 8082 /api/v1/bakeries/{bakeryId} | /bakery/api/v1/bakeries/{bakeryId} | JWT user + ownership (trừ public theo security) | 200 | HTTP-0478:200 [HAPPY]<br>HTTP-0181:401 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | HTTP-0519:200 [HAPPY]<br>HTTP-0182:401 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | [BakeryController.java:1](../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/controller/BakeryController.java#L1) dòng 45; HTTP-0181, HTTP-0182 | PASS_DIRECT_AND_GATEWAY; Scenario hợp lệ đã quan sát ở cả hai đường; giới hạn theo fixture nêu trong báo cáo |
| API-032 | bakery-service | PUT | 8082 /api/v1/bakeries/{bakeryId}/operations | /bakery/api/v1/bakeries/{bakeryId}/operations | BAKERY_OWNER + OWNER membership | 200 | HTTP-0479:200 [HAPPY]<br>HTTP-0183:401 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | HTTP-0520:200 [HAPPY]<br>HTTP-0184:401 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | [BakeryController.java:1](../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/controller/BakeryController.java#L1) dòng 51; HTTP-0183, HTTP-0184 | PASS_DIRECT_AND_GATEWAY; Scenario hợp lệ đã quan sát ở cả hai đường; giới hạn theo fixture nêu trong báo cáo |
| API-033 | bakery-service | POST | 8082 /api/v1/bakeries/{bakeryId}/submit-for-approval | /bakery/api/v1/bakeries/{bakeryId}/submit-for-approval | BAKERY_OWNER + OWNER membership | 200 | HTTP-0482:200 [HAPPY]<br>HTTP-0185:401 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | HTTP-0523:200 [HAPPY]<br>HTTP-0186:401 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | [BakeryController.java:1](../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/controller/BakeryController.java#L1) dòng 58; HTTP-0185, HTTP-0186 | PASS_DIRECT_AND_GATEWAY; Scenario hợp lệ đã quan sát ở cả hai đường; giới hạn theo fixture nêu trong báo cáo |
| API-034 | bakery-service | POST | 8082 /api/v1/bakeries/{bakeryId}/logo | /bakery/api/v1/bakeries/{bakeryId}/logo | BAKERY_OWNER + OWNER membership | 201 | HTTP-0503:400 [VALID_UPLOAD_MISSING_NATIVE_STORAGE]<br>HTTP-0187:401 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | HTTP-0544:400 [VALID_UPLOAD_MISSING_NATIVE_STORAGE]<br>HTTP-0188:401 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | [BakeryController.java:1](../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/controller/BakeryController.java#L1) dòng 63; HTTP-0187, HTTP-0188 | FAIL_DIRECT; F04: xem chẩn đoán; có lỗi/thiếu cấu hình trong ít nhất một scenario |
| API-035 | bakery-service | POST | 8082 /api/v1/bakeries/{bakeryId}/cover | /bakery/api/v1/bakeries/{bakeryId}/cover | BAKERY_OWNER + OWNER membership | 201 | HTTP-0504:400 [VALID_UPLOAD_MISSING_NATIVE_STORAGE]<br>HTTP-0189:401 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | HTTP-0545:400 [VALID_UPLOAD_MISSING_NATIVE_STORAGE]<br>HTTP-0190:401 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | [BakeryController.java:1](../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/controller/BakeryController.java#L1) dòng 70; HTTP-0189, HTTP-0190 | FAIL_DIRECT; F04: xem chẩn đoán; có lỗi/thiếu cấu hình trong ít nhất một scenario |
| API-036 | bakery-service | GET | 8082 /api/v1/bakeries/onboarding | /bakery/api/v1/bakeries/onboarding | JWT user + ownership (trừ public theo security) | 200 | HTTP-0081:200 [HAPPY]<br>HTTP-0191:401 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | HTTP-0084:200 [HAPPY]<br>HTTP-0192:401 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | [BakeryOnboardingController.java:1](../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/controller/BakeryOnboardingController.java#L1) dòng 29; HTTP-0081, HTTP-0084 | PASS_DIRECT_AND_GATEWAY; Scenario hợp lệ đã quan sát ở cả hai đường; giới hạn theo fixture nêu trong báo cáo |
| API-037 | bakery-service | POST | 8082 /api/v1/bakeries/onboarding | /bakery/api/v1/bakeries/onboarding | JWT user + ownership (trừ public theo security) | 200 | HTTP-0082:503 [HAPPY]<br>HTTP-0193:401 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | HTTP-0085:503 [HAPPY]<br>HTTP-0194:401 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | [BakeryOnboardingController.java:1](../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/controller/BakeryOnboardingController.java#L1) dòng 34; HTTP-0082, HTTP-0085 | FAIL_DIRECT; F02: xem chẩn đoán; có lỗi/thiếu cấu hình trong ít nhất một scenario |
| API-038 | bakery-service | POST | 8082 /api/v1/bakeries/{bakeryId}/onboarding/complete | /bakery/api/v1/bakeries/{bakeryId}/onboarding/complete | BAKERY_OWNER + OWNER membership | 204 | HTTP-0508:503 [VALID_CONFIG_DEPENDENCY]<br>HTTP-0195:401 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | HTTP-0549:503 [VALID_CONFIG_DEPENDENCY]<br>HTTP-0196:401 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | [BakeryOnboardingController.java:1](../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/controller/BakeryOnboardingController.java#L1) dòng 40; HTTP-0195, HTTP-0196 | FAIL_DIRECT; F02: xem chẩn đoán; có lỗi/thiếu cấu hình trong ít nhất một scenario |
| API-039 | bakery-service | PUT | 8082 /internal/v1/bakeries/{bakeryId}/onboarding/activate | — | service JWT + scope | 204 | HTTP-0197:401 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | Không routable | [InternalBakeryController.java:1](../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/controller/InternalBakeryController.java#L1) dòng 29; HTTP-0197 | NOT_EXPOSED_BY_DESIGN; Direct hợp lệ thiếu credential/fixture; không có route Gateway theo thiết kế |
| API-040 | bakery-service | GET | 8082 /internal/v1/bakeries/{bakeryId} | — | service JWT + scope | 200 | HTTP-0639:200 [HAPPY_INTERNAL]<br>HTTP-0200:401 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | Không routable | [InternalBakeryController.java:1](../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/controller/InternalBakeryController.java#L1) dòng 35; HTTP-0200, HTTP-0639 | NOT_EXPOSED_BY_DESIGN; Direct hợp lệ đã đạt; không có route Gateway theo thiết kế |
| API-041 | bakery-service | GET | 8082 /internal/v1/bakeries/{bakeryId}/members/{userId}/authorization | — | service JWT + scope | 200 | HTTP-0640:200 [HAPPY_INTERNAL]<br>HTTP-0203:401 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | Không routable | [InternalBakeryController.java:1](../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/controller/InternalBakeryController.java#L1) dòng 40; HTTP-0203, HTTP-0640 | NOT_EXPOSED_BY_DESIGN; Direct hợp lệ đã đạt; không có route Gateway theo thiết kế |
| API-042 | bakery-service | GET | 8082 /api/v1/bakeries | /bakery/api/v1/bakeries | Public | 200 | HTTP-0015:200 [HAPPY]<br>HTTP-0604:503 [HAPPY_EQUIVALENCE]<br>HTTP-0206:200 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | HTTP-0031:200 [HAPPY]<br>HTTP-0605:503 [HAPPY_EQUIVALENCE]<br>HTTP-0207:200 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | [PublicBakeryController.java:1](../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/controller/PublicBakeryController.java#L1) dòng 23; HTTP-0015, HTTP-0031 | FAIL_DIRECT; F02: xem chẩn đoán; có lỗi/thiếu cấu hình trong ít nhất một scenario |
| API-043 | bakery-service | GET | 8082 /api/v1/bakeries/{bakeryId} | /bakery/api/v1/bakeries/{bakeryId} | Public | 200 | HTTP-0484:503 [HAPPY]<br>HTTP-0208:404 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | HTTP-0525:503 [HAPPY]<br>HTTP-0209:404 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | [PublicBakeryController.java:1](../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/controller/PublicBakeryController.java#L1) dòng 34; HTTP-0208, HTTP-0209 | FAIL_DIRECT; F02: xem chẩn đoán; có lỗi/thiếu cấu hình trong ít nhất một scenario |
| API-044 | bakery-service | GET | 8082 /internal/v1/users/{userId}/bakery-memberships | — | service JWT + scope | 200 | HTTP-0401:200 [HAPPY_INTERNAL]<br>HTTP-0210:401 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | Không routable | [CatalogController.java:1](../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/catalog/CatalogController.java#L1) dòng 21; HTTP-0210, HTTP-0401 | NOT_EXPOSED_BY_DESIGN; Direct hợp lệ đã đạt; không có route Gateway theo thiết kế |
| API-045 | bakery-service | POST | 8082 /internal/v1/catalog/customization-quotes | — | service JWT + scope | 200 | HTTP-0642:503 [DEPENDENCY_QUOTE_ARCHIVED_PRODUCT]<br>HTTP-0213:401 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | Không routable | [CatalogController.java:1](../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/catalog/CatalogController.java#L1) dòng 27; HTTP-0213, HTTP-0642 | NOT_EXPOSED_BY_DESIGN; Direct hợp lệ thiếu credential/fixture; không có route Gateway theo thiết kế |
| API-046 | bakery-service | POST | 8082 /internal/v1/catalog/add-on-quotes | — | service JWT + scope | 200 | HTTP-0643:503 [DEPENDENCY_QUOTE_ARCHIVED_PRODUCT]<br>HTTP-0216:401 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | Không routable | [CatalogController.java:1](../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/catalog/CatalogController.java#L1) dòng 33; HTTP-0216, HTTP-0643 | NOT_EXPOSED_BY_DESIGN; Direct hợp lệ thiếu credential/fixture; không có route Gateway theo thiết kế |
| API-047 | bakery-service | POST | 8082 /internal/v1/catalog/quotes | — | service JWT + scope | 200 | HTTP-0641:409 [DEPENDENCY_QUOTE_ARCHIVED_PRODUCT]<br>HTTP-0219:401 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | Không routable | [InternalCatalogController.java:1](../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/catalog/controller/InternalCatalogController.java#L1) dòng 22; HTTP-0219, HTTP-0641 | NOT_EXPOSED_BY_DESIGN; Direct hợp lệ thiếu credential/fixture; không có route Gateway theo thiết kế |
| API-048 | bakery-service | GET | 8082 /api/v1/bakeries/{bakeryId}/categories | /bakery/api/v1/bakeries/{bakeryId}/categories | BAKERY_OWNER + OWNER membership | 200 | HTTP-0485:200 [HAPPY]<br>HTTP-0222:401 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | HTTP-0526:200 [HAPPY]<br>HTTP-0223:401 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | [ProductCategoryController.java:1](../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/category/controller/ProductCategoryController.java#L1) dòng 31; HTTP-0222, HTTP-0223 | PASS_DIRECT_AND_GATEWAY; Scenario hợp lệ đã quan sát ở cả hai đường; giới hạn theo fixture nêu trong báo cáo |
| API-049 | bakery-service | POST | 8082 /api/v1/bakeries/{bakeryId}/categories | /bakery/api/v1/bakeries/{bakeryId}/categories | BAKERY_OWNER + OWNER membership | 201 | HTTP-0486:201 [HAPPY]<br>HTTP-0224:401 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | HTTP-0527:201 [HAPPY]<br>HTTP-0225:401 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | [ProductCategoryController.java:1](../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/category/controller/ProductCategoryController.java#L1) dòng 36; HTTP-0224, HTTP-0225 | PASS_DIRECT_AND_GATEWAY; Scenario hợp lệ đã quan sát ở cả hai đường; giới hạn theo fixture nêu trong báo cáo |
| API-050 | bakery-service | PATCH | 8082 /api/v1/bakeries/{bakeryId}/categories/{categoryId} | /bakery/api/v1/bakeries/{bakeryId}/categories/{categoryId} | BAKERY_OWNER + OWNER membership | 200 | HTTP-0487:200 [HAPPY]<br>HTTP-0226:401 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | HTTP-0528:200 [HAPPY]<br>HTTP-0227:401 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | [ProductCategoryController.java:1](../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/category/controller/ProductCategoryController.java#L1) dòng 43; HTTP-0226, HTTP-0227 | PASS_DIRECT_AND_GATEWAY; Scenario hợp lệ đã quan sát ở cả hai đường; giới hạn theo fixture nêu trong báo cáo |
| API-051 | bakery-service | DELETE | 8082 /api/v1/bakeries/{bakeryId}/categories/{categoryId} | /bakery/api/v1/bakeries/{bakeryId}/categories/{categoryId} | BAKERY_OWNER + OWNER membership | 204 | HTTP-0517:204 [HAPPY_DELETE_OWN_FIXTURE]<br>HTTP-0228:401 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | HTTP-0558:204 [HAPPY_DELETE_OWN_FIXTURE]<br>HTTP-0229:401 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | [ProductCategoryController.java:1](../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/category/controller/ProductCategoryController.java#L1) dòng 49; HTTP-0228, HTTP-0229 | PASS_DIRECT_AND_GATEWAY; Scenario hợp lệ đã quan sát ở cả hai đường; giới hạn theo fixture nêu trong báo cáo |
| API-052 | bakery-service | GET | 8082 /api/v1/bakeries/{bakeryId}/members | /bakery/api/v1/bakeries/{bakeryId}/members | BAKERY_OWNER + OWNER membership | 200 | HTTP-0480:200 [HAPPY]<br>HTTP-0612:200 [HAPPY_EQUIVALENCE]<br>HTTP-0230:401 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | HTTP-0521:200 [HAPPY]<br>HTTP-0613:200 [HAPPY_EQUIVALENCE]<br>HTTP-0231:401 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | [BakeryMemberController.java:1](../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/member/controller/BakeryMemberController.java#L1) dòng 25; HTTP-0230, HTTP-0231 | PASS_DIRECT_AND_GATEWAY; Scenario hợp lệ đã quan sát ở cả hai đường; giới hạn theo fixture nêu trong báo cáo |
| API-053 | bakery-service | GET | 8082 /api/v1/bakeries/{bakeryId}/products | /bakery/api/v1/bakeries/{bakeryId}/products | BAKERY_OWNER + OWNER membership | 200 | HTTP-0494:200 [HAPPY]<br>HTTP-0610:200 [HAPPY_EQUIVALENCE]<br>HTTP-0232:401 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | HTTP-0535:200 [HAPPY]<br>HTTP-0611:200 [HAPPY_EQUIVALENCE]<br>HTTP-0233:401 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | [ProductController.java:1](../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/product/controller/ProductController.java#L1) dòng 40; HTTP-0232, HTTP-0233 | PASS_DIRECT_AND_GATEWAY; Scenario hợp lệ đã quan sát ở cả hai đường; giới hạn theo fixture nêu trong báo cáo |
| API-054 | bakery-service | POST | 8082 /api/v1/bakeries/{bakeryId}/products | /bakery/api/v1/bakeries/{bakeryId}/products | BAKERY_OWNER + OWNER membership | 201 | HTTP-0492:201 [HAPPY]<br>HTTP-0234:401 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | HTTP-0533:201 [HAPPY]<br>HTTP-0235:401 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | [ProductController.java:1](../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/product/controller/ProductController.java#L1) dòng 52; HTTP-0234, HTTP-0235 | PASS_DIRECT_AND_GATEWAY; Scenario hợp lệ đã quan sát ở cả hai đường; giới hạn theo fixture nêu trong báo cáo |
| API-055 | bakery-service | PATCH | 8082 /api/v1/bakeries/{bakeryId}/products/{productId} | /bakery/api/v1/bakeries/{bakeryId}/products/{productId} | BAKERY_OWNER + OWNER membership | 200 | HTTP-0493:200 [HAPPY]<br>HTTP-0236:401 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | HTTP-0534:200 [HAPPY]<br>HTTP-0237:401 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | [ProductController.java:1](../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/product/controller/ProductController.java#L1) dòng 59; HTTP-0236, HTTP-0237 | PASS_DIRECT_AND_GATEWAY; Scenario hợp lệ đã quan sát ở cả hai đường; giới hạn theo fixture nêu trong báo cáo |
| API-056 | bakery-service | PUT | 8082 /api/v1/bakeries/{bakeryId}/products/{productId}/options | /bakery/api/v1/bakeries/{bakeryId}/products/{productId}/options | BAKERY_OWNER + OWNER membership | 200 | HTTP-0495:200 [HAPPY]<br>HTTP-0238:401 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | HTTP-0536:200 [HAPPY]<br>HTTP-0239:401 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | [ProductController.java:1](../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/product/controller/ProductController.java#L1) dòng 65; HTTP-0238, HTTP-0239 | PASS_DIRECT_AND_GATEWAY; Scenario hợp lệ đã quan sát ở cả hai đường; giới hạn theo fixture nêu trong báo cáo |
| API-057 | bakery-service | POST | 8082 /api/v1/bakeries/{bakeryId}/products/{productId}/images | /bakery/api/v1/bakeries/{bakeryId}/products/{productId}/images | BAKERY_OWNER + OWNER membership | 201 | HTTP-0496:400 [VALID_UPLOAD_MISSING_NATIVE_STORAGE]<br>HTTP-0240:401 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | HTTP-0537:400 [VALID_UPLOAD_MISSING_NATIVE_STORAGE]<br>HTTP-0241:401 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | [ProductController.java:1](../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/product/controller/ProductController.java#L1) dòng 72; HTTP-0240, HTTP-0241 | FAIL_DIRECT; F04: xem chẩn đoán; có lỗi/thiếu cấu hình trong ít nhất một scenario |
| API-058 | bakery-service | DELETE | 8082 /api/v1/bakeries/{bakeryId}/products/{productId}/images/{imageId} | /bakery/api/v1/bakeries/{bakeryId}/products/{productId}/images/{imageId} | BAKERY_OWNER + OWNER membership | 204 | HTTP-0242:401 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | HTTP-0243:401 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | [ProductController.java:1](../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/product/controller/ProductController.java#L1) dòng 81; HTTP-0242, HTTP-0243 | BLOCKED_MISSING_LOCAL_DB_OR_STORAGE; Thiếu ảnh primary/native MinIO; chưa có điều kiện publish/imageId hợp lệ |
| API-059 | bakery-service | POST | 8082 /api/v1/bakeries/{bakeryId}/products/{productId}/publish | /bakery/api/v1/bakeries/{bakeryId}/products/{productId}/publish | BAKERY_OWNER + OWNER membership | 200 | HTTP-0497:422 [VALID_CONFIG_DEPENDENCY]<br>HTTP-0244:401 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | HTTP-0538:422 [VALID_CONFIG_DEPENDENCY]<br>HTTP-0245:401 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | [ProductController.java:1](../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/product/controller/ProductController.java#L1) dòng 88; HTTP-0244, HTTP-0245 | BLOCKED_MISSING_LOCAL_DB_OR_STORAGE; Thiếu ảnh primary/native MinIO; chưa có điều kiện publish/imageId hợp lệ |
| API-060 | bakery-service | POST | 8082 /api/v1/bakeries/{bakeryId}/products/{productId}/hide | /bakery/api/v1/bakeries/{bakeryId}/products/{productId}/hide | BAKERY_OWNER + OWNER membership | 200 | HTTP-0246:401 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | HTTP-0247:401 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | [ProductController.java:1](../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/product/controller/ProductController.java#L1) dòng 94; HTTP-0246, HTTP-0247 | BLOCKED_MISSING_LOCAL_DB_OR_STORAGE; Thiếu ảnh primary/native MinIO; chưa có điều kiện publish/imageId hợp lệ |
| API-061 | bakery-service | POST | 8082 /api/v1/bakeries/{bakeryId}/products/{productId}/archive | /bakery/api/v1/bakeries/{bakeryId}/products/{productId}/archive | BAKERY_OWNER + OWNER membership | 200 | HTTP-0502:200 [HAPPY]<br>HTTP-0248:401 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | HTTP-0543:200 [HAPPY]<br>HTTP-0249:401 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | [ProductController.java:1](../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/product/controller/ProductController.java#L1) dòng 100; HTTP-0248, HTTP-0249 | PASS_DIRECT_AND_GATEWAY; Scenario hợp lệ đã quan sát ở cả hai đường; giới hạn theo fixture nêu trong báo cáo |
| API-062 | bakery-service | GET | 8082 /api/v1/products | /bakery/api/v1/products | Public | 200 | HTTP-0016:200 [HAPPY]<br>HTTP-0606:200 [HAPPY_EQUIVALENCE]<br>HTTP-0250:200 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | HTTP-0032:200 [HAPPY]<br>HTTP-0607:200 [HAPPY_EQUIVALENCE]<br>HTTP-0251:200 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | [PublicProductController.java:1](../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/product/controller/PublicProductController.java#L1) dòng 24; HTTP-0016, HTTP-0032 | PASS_DIRECT_AND_GATEWAY; Scenario hợp lệ đã quan sát ở cả hai đường; giới hạn theo fixture nêu trong báo cáo |
| API-063 | bakery-service | GET | 8082 /api/v1/products/{productId} | /bakery/api/v1/products/{productId} | Public | 200 | HTTP-0252:404 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | HTTP-0253:404 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | [PublicProductController.java:1](../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/product/controller/PublicProductController.java#L1) dòng 40; HTTP-0252, HTTP-0253 | BLOCKED_MISSING_LOCAL_DB_OR_STORAGE; Thiếu ảnh primary/native MinIO; chưa có điều kiện publish/imageId hợp lệ |

## 12. Bảng chi tiết từng API Marketplace

| ID | Service | Method | Direct port/path | Gateway path (8080) | Auth/role | Expected | Actual direct | Actual Gateway | Evidence | Status / reason |
|---|---|---|---|---|---|---|---|---|---|---|
| API-064 | marketplace-service | GET | 8083 /api/v1/cake-requests | /marketplace/api/v1/cake-requests | JWT user + ownership (trừ public theo security) | 200 | HTTP-0018:200 [HAPPY]<br>HTTP-0616:200 [HAPPY_EQUIVALENCE]<br>HTTP-0409:500 [NEGATIVE_ENUM]<br>HTTP-0412:503 [VALID_CONFIG_DEPENDENCY] | HTTP-0034:200 [HAPPY]<br>HTTP-0617:200 [HAPPY_EQUIVALENCE]<br>HTTP-0442:500 [NEGATIVE_ENUM]<br>HTTP-0445:503 [VALID_CONFIG_DEPENDENCY] | [CakeRequestController.java:1](../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/CakeRequestController.java#L1) dòng 26; HTTP-0018, HTTP-0034 | FAIL_DIRECT; F05: xem chẩn đoán; có lỗi/thiếu cấu hình trong ít nhất một scenario |
| API-065 | marketplace-service | GET | 8083 /api/v1/cake-requests/{id} | /marketplace/api/v1/cake-requests/{id} | JWT user + ownership (trừ public theo security) | 200 | HTTP-0071:200 [HAPPY]<br>HTTP-0435:200 [HAPPY_CANCEL_READBACK]<br>HTTP-0614:200 [HAPPY_EQUIVALENCE]<br>HTTP-0256:401 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | HTTP-0076:200 [HAPPY]<br>HTTP-0468:200 [HAPPY_CANCEL_READBACK]<br>HTTP-0615:200 [HAPPY_EQUIVALENCE]<br>HTTP-0257:401 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | [CakeRequestController.java:1](../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/CakeRequestController.java#L1) dòng 32; HTTP-0071, HTTP-0073 | PASS_DIRECT_AND_GATEWAY; Scenario hợp lệ đã quan sát ở cả hai đường; giới hạn theo fixture nêu trong báo cáo |
| API-066 | marketplace-service | POST | 8083 /api/v1/cake-requests | /marketplace/api/v1/cake-requests | JWT user + ownership (trừ public theo security) | 201 | HTTP-0070:201 [HAPPY]<br>HTTP-0258:401 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | HTTP-0075:201 [HAPPY]<br>HTTP-0259:401 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | [CakeRequestController.java:1](../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/CakeRequestController.java#L1) dòng 37; HTTP-0070, HTTP-0075 | PASS_DIRECT_AND_GATEWAY; Scenario hợp lệ đã quan sát ở cả hai đường; giới hạn theo fixture nêu trong báo cáo |
| API-067 | marketplace-service | PATCH | 8083 /api/v1/cake-requests/{id} | /marketplace/api/v1/cake-requests/{id} | JWT user + ownership (trừ public theo security) | 200 | HTTP-0072:200 [HAPPY]<br>HTTP-0260:401 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | HTTP-0077:200 [HAPPY]<br>HTTP-0261:401 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | [CakeRequestController.java:1](../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/CakeRequestController.java#L1) dòng 43; HTTP-0072, HTTP-0077 | PASS_DIRECT_AND_GATEWAY; Scenario hợp lệ đã quan sát ở cả hai đường; giới hạn theo fixture nêu trong báo cáo |
| API-068 | marketplace-service | POST | 8083 /api/v1/cake-requests/{id}/publish | /marketplace/api/v1/cake-requests/{id}/publish | JWT user + ownership (trừ public theo security) | 200 | HTTP-0074:200 [HAPPY]<br>HTTP-0262:401 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | HTTP-0079:200 [HAPPY]<br>HTTP-0263:401 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | [CakeRequestController.java:1](../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/CakeRequestController.java#L1) dòng 49; HTTP-0074, HTTP-0079 | PASS_DIRECT_AND_GATEWAY; Scenario hợp lệ đã quan sát ở cả hai đường; giới hạn theo fixture nêu trong báo cáo |
| API-069 | marketplace-service | POST | 8083 /api/v1/cake-requests/{id}/cancel | /marketplace/api/v1/cake-requests/{id}/cancel | JWT user + ownership (trừ public theo security) | 200 | HTTP-0434:200 [HAPPY_CANCEL_OWN_FIXTURE]<br>HTTP-0264:401 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | HTTP-0467:200 [HAPPY_CANCEL_OWN_FIXTURE]<br>HTTP-0265:401 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | [CakeRequestController.java:1](../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/CakeRequestController.java#L1) dòng 54; HTTP-0264, HTTP-0265 | PASS_DIRECT_AND_GATEWAY; Scenario hợp lệ đã quan sát ở cả hai đường; giới hạn theo fixture nêu trong báo cáo |
| API-070 | marketplace-service | PUT | 8083 /api/v1/cake-requests/{id}/selected-design | /marketplace/api/v1/cake-requests/{id}/selected-design | JWT user + ownership (trừ public theo security) | 200 | HTTP-0266:401 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | HTTP-0267:401 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | [CakeRequestController.java:1](../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/CakeRequestController.java#L1) dòng 60; HTTP-0266, HTTP-0267 | BLOCKED_EXTERNAL_PROVIDER_OR_COST; Không được upload cloud/gọi provider hoặc chưa có thiết kế/giao dịch thật; chỉ negative an toàn |
| API-071 | marketplace-service | POST | 8083 /api/v1/cake-requests/{id}/images | /marketplace/api/v1/cake-requests/{id}/images | JWT user + ownership (trừ public theo security) | 201 | HTTP-0268:401 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | HTTP-0269:401 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | [CakeRequestController.java:1](../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/CakeRequestController.java#L1) dòng 66; HTTP-0268, HTTP-0269 | BLOCKED_EXTERNAL_PROVIDER_OR_COST; Không được upload cloud/gọi provider hoặc chưa có thiết kế/giao dịch thật; chỉ negative an toàn |
| API-072 | marketplace-service | DELETE | 8083 /api/v1/cake-requests/{id}/images/{imageId} | /marketplace/api/v1/cake-requests/{id}/images/{imageId} | JWT user + ownership (trừ public theo security) | 204 | HTTP-0270:401 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | HTTP-0271:401 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | [CakeRequestController.java:1](../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/CakeRequestController.java#L1) dòng 75; HTTP-0270, HTTP-0271 | BLOCKED_EXTERNAL_PROVIDER_OR_COST; Không được upload cloud/gọi provider hoặc chưa có thiết kế/giao dịch thật; chỉ negative an toàn |
| API-073 | marketplace-service | GET | 8083 /internal/v1/cake-requests/{id}/context | — | service JWT + scope | 200 | HTTP-0402:200 [HAPPY_INTERNAL]<br>HTTP-0272:401 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | Không routable | [MarketplaceContextController.java:1](../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/MarketplaceContextController.java#L1) dòng 27; HTTP-0272, HTTP-0402 | NOT_EXPOSED_BY_DESIGN; Direct hợp lệ đã đạt; không có route Gateway theo thiết kế |
| API-074 | marketplace-service | GET | 8083 /internal/v1/cake-requests/{id}/chat-authorization | — | service JWT + scope | 200 | HTTP-0275:401 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | Không routable | [MarketplaceContextController.java:1](../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/MarketplaceContextController.java#L1) dòng 33; HTTP-0275, HTTP-0635 | NOT_EXPOSED_BY_DESIGN; Direct hợp lệ thiếu credential/fixture; không có route Gateway theo thiết kế |
| API-075 | marketplace-service | GET | 8083 /internal/v1/offers/{id}/order-source | — | service JWT + scope | 200 | HTTP-0278:401 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | Không routable | [MarketplaceContextController.java:1](../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/MarketplaceContextController.java#L1) dòng 42; HTTP-0278 | NOT_EXPOSED_BY_DESIGN; Direct hợp lệ thiếu credential/fixture; không có route Gateway theo thiết kế |
| API-076 | marketplace-service | GET | 8083 /api/v1/offers | /marketplace/api/v1/offers | JWT user + ownership (trừ public theo security) | 200 | HTTP-0019:200 [HAPPY]<br>HTTP-0618:200 [HAPPY_EQUIVALENCE]<br>HTTP-0413:503 [VALID_CONFIG_DEPENDENCY]<br>HTTP-0573:500 [NEGATIVE_ENUM_OFFERS] | HTTP-0035:200 [HAPPY]<br>HTTP-0619:200 [HAPPY_EQUIVALENCE]<br>HTTP-0446:503 [VALID_CONFIG_DEPENDENCY]<br>HTTP-0588:500 [NEGATIVE_ENUM_OFFERS] | [OfferController.java:1](../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/offer/OfferController.java#L1) dòng 25; HTTP-0019, HTTP-0035 | FAIL_DIRECT; F05: xem chẩn đoán; có lỗi/thiếu cấu hình trong ít nhất một scenario |
| API-077 | marketplace-service | GET | 8083 /api/v1/offers/{id} | /marketplace/api/v1/offers/{id} | JWT user + ownership (trừ public theo security) | 200 | HTTP-0283:401 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | HTTP-0284:401 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | [OfferController.java:1](../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/offer/OfferController.java#L1) dòng 31; HTTP-0283, HTTP-0284 | PASS_EXPECTED_NEGATIVE_ONLY; Chỉ xác minh từ chối truy cập/validation; happy path BLOCKED_AUTH_OR_TEST_FIXTURE |
| API-078 | marketplace-service | POST | 8083 /api/v1/cake-requests/{id}/offers | /marketplace/api/v1/cake-requests/{id}/offers | JWT user + ownership (trừ public theo security) | 201 | HTTP-0515:503 [BLOCKED_WORKFLOW_ATTEMPT]<br>HTTP-0285:401 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | HTTP-0556:503 [BLOCKED_WORKFLOW_ATTEMPT]<br>HTTP-0286:401 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | [OfferController.java:1](../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/offer/OfferController.java#L1) dòng 36; HTTP-0285, HTTP-0286 | FAIL_DIRECT; F02: xem chẩn đoán; có lỗi/thiếu cấu hình trong ít nhất một scenario |
| API-079 | marketplace-service | PATCH | 8083 /api/v1/offers/{id} | /marketplace/api/v1/offers/{id} | JWT user + ownership (trừ public theo security) | 200 | HTTP-0287:401 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | HTTP-0288:401 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | [OfferController.java:1](../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/offer/OfferController.java#L1) dòng 42; HTTP-0287, HTTP-0288 | PASS_EXPECTED_NEGATIVE_ONLY; Chỉ xác minh từ chối truy cập/validation; happy path BLOCKED_AUTH_OR_TEST_FIXTURE |
| API-080 | marketplace-service | POST | 8083 /api/v1/offers/{id}/withdraw | /marketplace/api/v1/offers/{id}/withdraw | JWT user + ownership (trừ public theo security) | 200 | HTTP-0289:401 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | HTTP-0290:401 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | [OfferController.java:1](../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/offer/OfferController.java#L1) dòng 48; HTTP-0289, HTTP-0290 | PASS_EXPECTED_NEGATIVE_ONLY; Chỉ xác minh từ chối truy cập/validation; happy path BLOCKED_AUTH_OR_TEST_FIXTURE |
| API-081 | marketplace-service | POST | 8083 /api/v1/offers/{id}/accept | /marketplace/api/v1/offers/{id}/accept | JWT user + ownership (trừ public theo security) | 200 | HTTP-0291:401 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | HTTP-0292:401 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | [OfferController.java:1](../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/offer/OfferController.java#L1) dòng 54; HTTP-0291, HTTP-0292 | PASS_EXPECTED_NEGATIVE_ONLY; Chỉ xác minh từ chối truy cập/validation; happy path BLOCKED_AUTH_OR_TEST_FIXTURE |

## 13. Bảng chi tiết từng API Subscription

| ID | Service | Method | Direct port/path | Gateway path (8080) | Auth/role | Expected | Actual direct | Actual Gateway | Evidence | Status / reason |
|---|---|---|---|---|---|---|---|---|---|---|
| API-082 | subscription-service | GET | 8084 /api/v1/admin/bakery-payments | /subscription/api/v1/admin/bakery-payments | ADMIN | 200 | HTTP-0023:200 [HAPPY]<br>HTTP-0624:200 [HAPPY_EQUIVALENCE]<br>HTTP-0293:401 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | HTTP-0039:200 [HAPPY]<br>HTTP-0625:200 [HAPPY_EQUIVALENCE]<br>HTTP-0294:401 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | [AdminBakeryPaymentController.java:1](../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/payment/controller/AdminBakeryPaymentController.java#L1) dòng 36; HTTP-0023, HTTP-0039 | PASS_DIRECT_AND_GATEWAY; Scenario hợp lệ đã quan sát ở cả hai đường; giới hạn theo fixture nêu trong báo cáo |
| API-083 | subscription-service | POST | 8084 /api/v1/admin/bakery-payments/{paymentId}/approve | /subscription/api/v1/admin/bakery-payments/{paymentId}/approve | ADMIN | 200 | HTTP-0295:401 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | HTTP-0296:401 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | [AdminBakeryPaymentController.java:1](../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/payment/controller/AdminBakeryPaymentController.java#L1) dòng 49; HTTP-0295, HTTP-0296 | PASS_EXPECTED_NEGATIVE_ONLY; Chỉ xác minh từ chối truy cập/validation; happy path BLOCKED_AUTH_OR_TEST_FIXTURE |
| API-084 | subscription-service | POST | 8084 /api/v1/admin/bakery-payments/{paymentId}/reject | /subscription/api/v1/admin/bakery-payments/{paymentId}/reject | ADMIN | 200 | HTTP-0297:401 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | HTTP-0298:401 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | [AdminBakeryPaymentController.java:1](../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/payment/controller/AdminBakeryPaymentController.java#L1) dòng 57; HTTP-0297, HTTP-0298 | PASS_EXPECTED_NEGATIVE_ONLY; Chỉ xác minh từ chối truy cập/validation; happy path BLOCKED_AUTH_OR_TEST_FIXTURE |
| API-085 | subscription-service | POST | 8084 /api/v1/subscription-orders/{orderId}/payments | /subscription/api/v1/subscription-orders/{orderId}/payments | JWT user + ownership (trừ public theo security) | 201 | HTTP-0299:401 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | HTTP-0300:401 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | [BakeryPaymentController.java:1](../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/payment/controller/BakeryPaymentController.java#L1) dòng 30; HTTP-0299, HTTP-0300 | PASS_EXPECTED_NEGATIVE_ONLY; Chỉ xác minh từ chối truy cập/validation; happy path BLOCKED_AUTH_OR_TEST_FIXTURE |
| API-086 | subscription-service | GET | 8084 /api/v1/subscription-plans/payment-options | /subscription/api/v1/subscription-plans/payment-options | Public | 200 | HTTP-0021:200 [HAPPY]<br>HTTP-0301:200 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | HTTP-0037:200 [HAPPY]<br>HTTP-0302:200 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | [PaymentOptionsController.java:1](../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/payment/controller/PaymentOptionsController.java#L1) dòng 16; HTTP-0021, HTTP-0037 | PASS_DIRECT_AND_GATEWAY; Scenario hợp lệ đã quan sát ở cả hai đường; giới hạn theo fixture nêu trong báo cáo |
| API-087 | subscription-service | POST | 8084 /api/v1/subscription-orders/{orderId}/vnpay/checkout | /subscription/api/v1/subscription-orders/{orderId}/vnpay/checkout | JWT user + ownership (trừ public theo security) | 200 | HTTP-0303:401 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | HTTP-0304:401 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | [VnpayController.java:1](../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/payment/controller/VnpayController.java#L1) dòng 26; HTTP-0303, HTTP-0304 | PASS_EXPECTED_NEGATIVE_ONLY; Chỉ xác minh từ chối truy cập/validation; happy path BLOCKED_AUTH_OR_TEST_FIXTURE |
| API-088 | subscription-service | GET | 8084 /api/v1/payments/vnpay/ipn | /subscription/api/v1/payments/vnpay/ipn | Public | 200 | HTTP-0305:200 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | HTTP-0306:200 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | [VnpayController.java:1](../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/payment/controller/VnpayController.java#L1) dòng 32; HTTP-0305, HTTP-0306 | BLOCKED_EXTERNAL_PROVIDER_OR_COST; Không được upload cloud/gọi provider hoặc chưa có thiết kế/giao dịch thật; chỉ negative an toàn |
| API-089 | subscription-service | GET | 8084 /api/v1/payments/vnpay/return | /subscription/api/v1/payments/vnpay/return | Public | 200 | HTTP-0307:400 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | HTTP-0308:400 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | [VnpayController.java:1](../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/payment/controller/VnpayController.java#L1) dòng 38; HTTP-0307, HTTP-0308 | BLOCKED_EXTERNAL_PROVIDER_OR_COST; Không được upload cloud/gọi provider hoặc chưa có thiết kế/giao dịch thật; chỉ negative an toàn |
| API-090 | subscription-service | GET | 8084 /api/v1/admin/vnpay-attempts | /subscription/api/v1/admin/vnpay-attempts | ADMIN | 200 | HTTP-0025:200 [HAPPY]<br>HTTP-0309:401 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | HTTP-0041:200 [HAPPY]<br>HTTP-0310:401 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | [VnpayController.java:1](../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/payment/controller/VnpayController.java#L1) dòng 48; HTTP-0025, HTTP-0041 | PASS_DIRECT_AND_GATEWAY; Scenario hợp lệ đã quan sát ở cả hai đường; giới hạn theo fixture nêu trong báo cáo |
| API-091 | subscription-service | GET | 8084 /api/v1/admin/subscription-plans | /subscription/api/v1/admin/subscription-plans | ADMIN | 200 | HTTP-0022:200 [HAPPY]<br>HTTP-0311:401 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | HTTP-0038:200 [HAPPY]<br>HTTP-0312:401 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | [AdminSubscriptionPlanController.java:1](../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/plan/controller/AdminSubscriptionPlanController.java#L1) dòng 29; HTTP-0022, HTTP-0038 | PASS_DIRECT_AND_GATEWAY; Scenario hợp lệ đã quan sát ở cả hai đường; giới hạn theo fixture nêu trong báo cáo |
| API-092 | subscription-service | POST | 8084 /api/v1/admin/subscription-plans | /subscription/api/v1/admin/subscription-plans | ADMIN | 201 | HTTP-0064:201 [HAPPY]<br>HTTP-0313:401 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | HTTP-0067:201 [HAPPY]<br>HTTP-0314:401 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | [AdminSubscriptionPlanController.java:1](../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/plan/controller/AdminSubscriptionPlanController.java#L1) dòng 34; HTTP-0064, HTTP-0067 | PASS_DIRECT_AND_GATEWAY; Scenario hợp lệ đã quan sát ở cả hai đường; giới hạn theo fixture nêu trong báo cáo |
| API-093 | subscription-service | PATCH | 8084 /api/v1/admin/subscription-plans/{planId} | /subscription/api/v1/admin/subscription-plans/{planId} | ADMIN | 200 | HTTP-0066:200 [HAPPY]<br>HTTP-0315:401 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | HTTP-0069:200 [HAPPY]<br>HTTP-0316:401 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | [AdminSubscriptionPlanController.java:1](../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/plan/controller/AdminSubscriptionPlanController.java#L1) dòng 40; HTTP-0066, HTTP-0069 | PASS_DIRECT_AND_GATEWAY; Scenario hợp lệ đã quan sát ở cả hai đường; giới hạn theo fixture nêu trong báo cáo |
| API-094 | subscription-service | POST | 8084 /api/v1/admin/subscription-plans/{planId}/archive | /subscription/api/v1/admin/subscription-plans/{planId}/archive | ADMIN | 200 | HTTP-0432:200 [HAPPY_ARCHIVE_OWN_FIXTURE]<br>HTTP-0317:401 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | HTTP-0465:200 [HAPPY_ARCHIVE_OWN_FIXTURE]<br>HTTP-0318:401 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | [AdminSubscriptionPlanController.java:1](../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/plan/controller/AdminSubscriptionPlanController.java#L1) dòng 46; HTTP-0317, HTTP-0318 | PASS_DIRECT_AND_GATEWAY; Scenario hợp lệ đã quan sát ở cả hai đường; giới hạn theo fixture nêu trong báo cáo |
| API-095 | subscription-service | GET | 8084 /api/v1/subscription-plans | /subscription/api/v1/subscription-plans | Public | 200 | HTTP-0020:200 [HAPPY]<br>HTTP-0620:200 [HAPPY_EQUIVALENCE]<br>HTTP-0319:200 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | HTTP-0036:200 [HAPPY]<br>HTTP-0621:200 [HAPPY_EQUIVALENCE]<br>HTTP-0320:200 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | [SubscriptionPlanController.java:1](../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/plan/controller/SubscriptionPlanController.java#L1) dòng 24; HTTP-0020, HTTP-0036 | PASS_DIRECT_AND_GATEWAY; Scenario hợp lệ đã quan sát ở cả hai đường; giới hạn theo fixture nêu trong báo cáo |
| API-096 | subscription-service | GET | 8084 /api/v1/subscription-plans/{planId} | /subscription/api/v1/subscription-plans/{planId} | Public | 200 | HTTP-0065:200 [HAPPY]<br>HTTP-0321:200 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | HTTP-0068:200 [HAPPY]<br>HTTP-0322:200 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | [SubscriptionPlanController.java:1](../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/plan/controller/SubscriptionPlanController.java#L1) dòng 29; HTTP-0065, HTTP-0068 | PASS_DIRECT_AND_GATEWAY; Scenario hợp lệ đã quan sát ở cả hai đường; giới hạn theo fixture nêu trong báo cáo |
| API-097 | subscription-service | GET | 8084 /api/v1/bakeries/{bakeryId}/subscription | /subscription/api/v1/bakeries/{bakeryId}/subscription | JWT user + ownership (trừ public theo security) | 200 | HTTP-0511:503 [VALID_CONFIG_DEPENDENCY]<br>HTTP-0323:401 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | HTTP-0552:503 [VALID_CONFIG_DEPENDENCY]<br>HTTP-0324:401 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | [BakerySubscriptionController.java:1](../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/subscription/controller/BakerySubscriptionController.java#L1) dòng 25; HTTP-0323, HTTP-0324 | FAIL_DIRECT; F02: xem chẩn đoán; có lỗi/thiếu cấu hình trong ít nhất một scenario |
| API-098 | subscription-service | GET | 8084 /internal/v1/subscriptions/bakeries/{bakeryId}/entitlement | — | service JWT + scope | 200 | HTTP-0645:200 [HAPPY_INTERNAL]<br>HTTP-0325:401 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | Không routable | [InternalSubscriptionController.java:1](../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/subscription/controller/InternalSubscriptionController.java#L1) dòng 22; HTTP-0325, HTTP-0645 | NOT_EXPOSED_BY_DESIGN; Direct hợp lệ đã đạt; không có route Gateway theo thiết kế |
| API-099 | subscription-service | GET | 8084 /api/v1/admin/subscription-orders | /subscription/api/v1/admin/subscription-orders | ADMIN | 200 | HTTP-0024:200 [HAPPY]<br>HTTP-0622:200 [HAPPY_EQUIVALENCE]<br>HTTP-0328:401 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | HTTP-0040:200 [HAPPY]<br>HTTP-0623:200 [HAPPY_EQUIVALENCE]<br>HTTP-0329:401 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | [AdminSubscriptionOrderController.java:1](../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/subscriptionorder/controller/AdminSubscriptionOrderController.java#L1) dòng 19; HTTP-0024, HTTP-0040 | PASS_DIRECT_AND_GATEWAY; Scenario hợp lệ đã quan sát ở cả hai đường; giới hạn theo fixture nêu trong báo cáo |
| API-100 | subscription-service | POST | 8084 /api/v1/bakeries/{bakeryId}/subscription-orders | /subscription/api/v1/bakeries/{bakeryId}/subscription-orders | JWT user + ownership (trừ public theo security) | 201 | HTTP-0509:503 [BLOCKED_WORKFLOW_ATTEMPT]<br>HTTP-0578:503 [BLOCKED_WORKFLOW_VALID_INPUTS]<br>HTTP-0330:401 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | HTTP-0550:503 [BLOCKED_WORKFLOW_ATTEMPT]<br>HTTP-0593:503 [BLOCKED_WORKFLOW_VALID_INPUTS]<br>HTTP-0331:401 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | [SubscriptionOrderController.java:1](../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/subscriptionorder/controller/SubscriptionOrderController.java#L1) dòng 33; HTTP-0330, HTTP-0331 | FAIL_DIRECT; F02: xem chẩn đoán; có lỗi/thiếu cấu hình trong ít nhất một scenario |
| API-101 | subscription-service | GET | 8084 /api/v1/bakeries/{bakeryId}/subscription-orders | /subscription/api/v1/bakeries/{bakeryId}/subscription-orders | JWT user + ownership (trừ public theo security) | 200 | HTTP-0510:503 [VALID_CONFIG_DEPENDENCY]<br>HTTP-0332:401 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | HTTP-0551:503 [VALID_CONFIG_DEPENDENCY]<br>HTTP-0333:401 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | [SubscriptionOrderController.java:1](../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/subscriptionorder/controller/SubscriptionOrderController.java#L1) dòng 43; HTTP-0332, HTTP-0333 | FAIL_DIRECT; F02: xem chẩn đoán; có lỗi/thiếu cấu hình trong ít nhất một scenario |
| API-102 | subscription-service | GET | 8084 /api/v1/subscription-orders/{orderId} | /subscription/api/v1/subscription-orders/{orderId} | JWT user + ownership (trừ public theo security) | 200 | HTTP-0334:401 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | HTTP-0335:401 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | [SubscriptionOrderController.java:1](../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/subscriptionorder/controller/SubscriptionOrderController.java#L1) dòng 55; HTTP-0334, HTTP-0335 | PASS_EXPECTED_NEGATIVE_ONLY; Chỉ xác minh từ chối truy cập/validation; happy path BLOCKED_AUTH_OR_TEST_FIXTURE |

## 14. Bảng chi tiết từng API Order

| ID | Service | Method | Direct port/path | Gateway path (8080) | Auth/role | Expected | Actual direct | Actual Gateway | Evidence | Status / reason |
|---|---|---|---|---|---|---|---|---|---|---|
| API-114 | order-service | GET | 8086 /internal/v1/orders/{orderId}/context | — | service JWT + scope | 200 | HTTP-0359:401 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | Không routable | [InternalOrderController.java:1](../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/InternalOrderController.java#L1) dòng 29; HTTP-0359 | NOT_EXPOSED_BY_DESIGN; Direct hợp lệ thiếu credential/fixture; không có route Gateway theo thiết kế |
| API-115 | order-service | POST | 8086 /internal/v1/orders/from-offer | — | service JWT + scope | 201 | HTTP-0362:401 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | Không routable | [OfferOrderController.java:1](../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/OfferOrderController.java#L1) dòng 19; HTTP-0362 | NOT_EXPOSED_BY_DESIGN; Direct hợp lệ thiếu credential/fixture; không có route Gateway theo thiết kế |
| API-116 | order-service | POST | 8086 /api/v1/orders/direct | /orders/api/v1/orders/direct | JWT user + ownership (trừ public theo security) | 201 / 200 nếu replay | HTTP-0501:503 [BLOCKED_WORKFLOW_ATTEMPT]<br>HTTP-0365:401 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | HTTP-0542:503 [BLOCKED_WORKFLOW_ATTEMPT]<br>HTTP-0366:401 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | [OrderController.java:1](../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/OrderController.java#L1) dòng 52; HTTP-0365, HTTP-0366 | FAIL_DIRECT; F02: xem chẩn đoán; có lỗi/thiếu cấu hình trong ít nhất một scenario |
| API-117 | order-service | GET | 8086 /api/v1/orders | /orders/api/v1/orders | JWT user + ownership (trừ public theo security) | 200 | HTTP-0026:200 [HAPPY]<br>HTTP-0626:200 [HAPPY_EQUIVALENCE]<br>HTTP-0367:401 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | HTTP-0042:200 [HAPPY]<br>HTTP-0627:200 [HAPPY_EQUIVALENCE]<br>HTTP-0368:401 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | [OrderController.java:1](../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/OrderController.java#L1) dòng 70; HTTP-0026, HTTP-0042 | PASS_DIRECT_AND_GATEWAY; Scenario hợp lệ đã quan sát ở cả hai đường; giới hạn theo fixture nêu trong báo cáo |
| API-118 | order-service | GET | 8086 /api/v1/orders/{orderId} | /orders/api/v1/orders/{orderId} | JWT user + ownership (trừ public theo security) | 200 | HTTP-0369:401 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | HTTP-0370:401 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | [OrderController.java:1](../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/OrderController.java#L1) dòng 92; HTTP-0369, HTTP-0370 | PASS_EXPECTED_NEGATIVE_ONLY; Chỉ xác minh từ chối truy cập/validation; happy path BLOCKED_AUTH_OR_TEST_FIXTURE |
| API-119 | order-service | POST | 8086 /api/v1/orders/{orderId}/status-transitions | /orders/api/v1/orders/{orderId}/status-transitions | JWT user + ownership (trừ public theo security) | 200 | HTTP-0371:401 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | HTTP-0372:401 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | [OrderController.java:1](../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/OrderController.java#L1) dòng 105; HTTP-0371, HTTP-0372 | PASS_EXPECTED_NEGATIVE_ONLY; Chỉ xác minh từ chối truy cập/validation; happy path BLOCKED_AUTH_OR_TEST_FIXTURE |
| API-120 | order-service | POST | 8086 /api/v1/orders/{orderId}/review | /orders/api/v1/orders/{orderId}/review | JWT user + ownership (trừ public theo security) | 201 | HTTP-0373:401 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | HTTP-0374:401 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | [ReviewController.java:1](../backend/order-service/src/main/java/com/se193262/orderservice/feature/review/ReviewController.java#L1) dòng 41; HTTP-0373, HTTP-0374 | PASS_EXPECTED_NEGATIVE_ONLY; Chỉ xác minh từ chối truy cập/validation; happy path BLOCKED_AUTH_OR_TEST_FIXTURE |
| API-121 | order-service | PATCH | 8086 /api/v1/orders/{orderId}/review | /orders/api/v1/orders/{orderId}/review | JWT user + ownership (trừ public theo security) | 200 | HTTP-0375:401 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | HTTP-0376:401 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | [ReviewController.java:1](../backend/order-service/src/main/java/com/se193262/orderservice/feature/review/ReviewController.java#L1) dòng 56; HTTP-0375, HTTP-0376 | PASS_EXPECTED_NEGATIVE_ONLY; Chỉ xác minh từ chối truy cập/validation; happy path BLOCKED_AUTH_OR_TEST_FIXTURE |
| API-122 | order-service | DELETE | 8086 /api/v1/orders/{orderId}/review | /orders/api/v1/orders/{orderId}/review | JWT user + ownership (trừ public theo security) | 204 | HTTP-0377:401 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | HTTP-0378:401 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | [ReviewController.java:1](../backend/order-service/src/main/java/com/se193262/orderservice/feature/review/ReviewController.java#L1) dòng 71; HTTP-0377, HTTP-0378 | PASS_EXPECTED_NEGATIVE_ONLY; Chỉ xác minh từ chối truy cập/validation; happy path BLOCKED_AUTH_OR_TEST_FIXTURE |
| API-123 | order-service | PATCH | 8086 /api/v1/admin/reviews/{orderId}/status | /orders/api/v1/admin/reviews/{orderId}/status | ADMIN | 200 | HTTP-0379:401 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | HTTP-0380:401 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | [ReviewController.java:1](../backend/order-service/src/main/java/com/se193262/orderservice/feature/review/ReviewController.java#L1) dòng 85; HTTP-0379, HTTP-0380 | PASS_EXPECTED_NEGATIVE_ONLY; Chỉ xác minh từ chối truy cập/validation; happy path BLOCKED_AUTH_OR_TEST_FIXTURE |

## 15. Bảng chi tiết từng API Chat

| ID | Service | Method | Direct port/path | Gateway path (8080) | Auth/role | Expected | Actual direct | Actual Gateway | Evidence | Status / reason |
|---|---|---|---|---|---|---|---|---|---|---|
| API-124 | chat-service | GET | 8087 /api/v1/conversations | /chat/api/v1/conversations | JWT user + ownership (trừ public theo security) | 200 | HTTP-0027:200 [HAPPY]<br>HTTP-0628:200 [HAPPY_EQUIVALENCE]<br>HTTP-0414:503 [DEPENDENCY_BEFORE_RESOURCE_LOOKUP]<br>HTTP-0381:401 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | HTTP-0043:200 [HAPPY]<br>HTTP-0629:200 [HAPPY_EQUIVALENCE]<br>HTTP-0447:503 [DEPENDENCY_BEFORE_RESOURCE_LOOKUP]<br>HTTP-0382:401 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | [ConversationController.java:1](../backend/chat-service/src/main/java/com/se193262/chatservice/feature/conversation/ConversationController.java#L1) dòng 42; HTTP-0027, HTTP-0043 | FAIL_DIRECT; F02: xem chẩn đoán; có lỗi/thiếu cấu hình trong ít nhất một scenario |
| API-125 | chat-service | POST | 8087 /api/v1/conversations | /chat/api/v1/conversations | JWT user + ownership (trừ public theo security) | 201 / 200 nếu replay | HTTP-0416:503 [BLOCKED_WORKFLOW_ATTEMPT]<br>HTTP-0383:401 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | HTTP-0449:503 [BLOCKED_WORKFLOW_ATTEMPT]<br>HTTP-0384:401 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | [ConversationController.java:1](../backend/chat-service/src/main/java/com/se193262/chatservice/feature/conversation/ConversationController.java#L1) dòng 60; HTTP-0383, HTTP-0384 | FAIL_DIRECT; F02: xem chẩn đoán; có lỗi/thiếu cấu hình trong ít nhất một scenario |
| API-126 | chat-service | GET | 8087 /api/v1/conversations/{conversationId} | /chat/api/v1/conversations/{conversationId} | JWT user + ownership (trừ public theo security) | 200 | HTTP-0385:401 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | HTTP-0386:401 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | [ConversationController.java:1](../backend/chat-service/src/main/java/com/se193262/chatservice/feature/conversation/ConversationController.java#L1) dòng 75; HTTP-0385, HTTP-0386 | PASS_EXPECTED_NEGATIVE_ONLY; Chỉ xác minh từ chối truy cập/validation; happy path BLOCKED_AUTH_OR_TEST_FIXTURE |
| API-127 | chat-service | POST | 8087 /api/v1/conversations/{conversationId}/close | /chat/api/v1/conversations/{conversationId}/close | JWT user + ownership (trừ public theo security) | 200 | HTTP-0387:401 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | HTTP-0388:401 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | [ConversationController.java:1](../backend/chat-service/src/main/java/com/se193262/chatservice/feature/conversation/ConversationController.java#L1) dòng 83; HTTP-0387, HTTP-0388 | PASS_EXPECTED_NEGATIVE_ONLY; Chỉ xác minh từ chối truy cập/validation; happy path BLOCKED_AUTH_OR_TEST_FIXTURE |
| API-128 | chat-service | GET | 8087 /api/v1/conversations/{conversationId}/messages | /chat/api/v1/conversations/{conversationId}/messages | JWT user + ownership (trừ public theo security) | 200 | HTTP-0389:401 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | HTTP-0390:401 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | [MessageController.java:1](../backend/chat-service/src/main/java/com/se193262/chatservice/feature/message/MessageController.java#L1) dòng 44; HTTP-0389, HTTP-0390 | PASS_EXPECTED_NEGATIVE_ONLY; Chỉ xác minh từ chối truy cập/validation; happy path BLOCKED_AUTH_OR_TEST_FIXTURE |
| API-129 | chat-service | POST | 8087 /api/v1/conversations/{conversationId}/messages | /chat/api/v1/conversations/{conversationId}/messages | JWT user + ownership (trừ public theo security) | 201 / 200 nếu replay | HTTP-0391:401 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | HTTP-0392:401 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | [MessageController.java:1](../backend/chat-service/src/main/java/com/se193262/chatservice/feature/message/MessageController.java#L1) dòng 55; HTTP-0391, HTTP-0392 | PASS_EXPECTED_NEGATIVE_ONLY; Chỉ xác minh từ chối truy cập/validation; happy path BLOCKED_AUTH_OR_TEST_FIXTURE |
| API-130 | chat-service | POST | 8087 /api/v1/conversations/{conversationId}/read | /chat/api/v1/conversations/{conversationId}/read | JWT user + ownership (trừ public theo security) | 200 | HTTP-0393:401 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | HTTP-0394:401 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | [MessageController.java:1](../backend/chat-service/src/main/java/com/se193262/chatservice/feature/message/MessageController.java#L1) dòng 71; HTTP-0393, HTTP-0394 | PASS_EXPECTED_NEGATIVE_ONLY; Chỉ xác minh từ chối truy cập/validation; happy path BLOCKED_AUTH_OR_TEST_FIXTURE |
| API-131 | chat-service | DELETE | 8087 /api/v1/conversations/{conversationId}/messages/{messageId} | /chat/api/v1/conversations/{conversationId}/messages/{messageId} | JWT user + ownership (trừ public theo security) | 204 | HTTP-0395:401 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | HTTP-0396:401 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | [MessageController.java:1](../backend/chat-service/src/main/java/com/se193262/chatservice/feature/message/MessageController.java#L1) dòng 81; HTTP-0395, HTTP-0396 | PASS_EXPECTED_NEGATIVE_ONLY; Chỉ xác minh từ chối truy cập/validation; happy path BLOCKED_AUTH_OR_TEST_FIXTURE |

## 16. Bảng chi tiết từng API Cake AI

| ID | Service | Method | Direct port/path | Gateway path (8080) | Auth/role | Expected | Actual direct | Actual Gateway | Evidence | Status / reason |
|---|---|---|---|---|---|---|---|---|---|---|
| API-103 | cake-ai-service | GET | 8085 /api/v1/generated-designs/{id} | /cake-ai/api/v1/generated-designs/{id} | JWT user + ownership (trừ public theo security) | 200 | HTTP-0336:CONNECTION_FAILED [NEGATIVE_ANONYMOUS_OR_PUBLIC] | HTTP-0337:500 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | [DesignController.java:1](../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/design/DesignController.java#L1) dòng 20; HTTP-0336, HTTP-0337 | BLOCKED_AUTH_OR_TEST_FIXTURE; F01: PostgreSQL authentication failed; Gateway upstream 500; chưa kiểm chứng handler |
| API-104 | cake-ai-service | GET | 8085 /api/v1/admin/generated-designs | /cake-ai/api/v1/admin/generated-designs | ADMIN | 200 | HTTP-0338:CONNECTION_FAILED [NEGATIVE_ANONYMOUS_OR_PUBLIC] | HTTP-0339:500 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | [DesignController.java:1](../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/design/DesignController.java#L1) dòng 26; HTTP-0338, HTTP-0339 | BLOCKED_AUTH_OR_TEST_FIXTURE; F01: PostgreSQL authentication failed; Gateway upstream 500; chưa kiểm chứng handler |
| API-105 | cake-ai-service | PATCH | 8085 /api/v1/admin/generated-designs/{id}/moderation | /cake-ai/api/v1/admin/generated-designs/{id}/moderation | ADMIN | 200 | HTTP-0340:CONNECTION_FAILED [NEGATIVE_ANONYMOUS_OR_PUBLIC] | HTTP-0341:500 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | [DesignController.java:1](../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/design/DesignController.java#L1) dòng 34; HTTP-0340, HTTP-0341 | BLOCKED_AUTH_OR_TEST_FIXTURE; F01: PostgreSQL authentication failed; Gateway upstream 500; chưa kiểm chứng handler |
| API-106 | cake-ai-service | GET | 8085 /internal/v1/generated-designs/{id}/validation | — | service JWT + scope | 200 | HTTP-0342:CONNECTION_FAILED [NEGATIVE_ANONYMOUS_OR_PUBLIC] | Không routable | [DesignValidationController.java:1](../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/design/DesignValidationController.java#L1) dòng 18; HTTP-0342 | BLOCKED_AUTH_OR_TEST_FIXTURE; F01: PostgreSQL authentication failed; Gateway upstream 500; chưa kiểm chứng handler |
| API-107 | cake-ai-service | GET | 8085 /internal/v1/cake-requests/{id}/generation-context | — | service JWT + scope | 200 | HTTP-0345:CONNECTION_FAILED [NEGATIVE_ANONYMOUS_OR_PUBLIC] | Không routable | [DesignValidationController.java:1](../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/design/DesignValidationController.java#L1) dòng 26; HTTP-0345 | BLOCKED_AUTH_OR_TEST_FIXTURE; F01: PostgreSQL authentication failed; Gateway upstream 500; chưa kiểm chứng handler |
| API-108 | cake-ai-service | GET | 8085 /storage/** | — | JWT user + ownership (trừ public theo security) | 404 (route retired) | HTTP-0348:CONNECTION_FAILED [NEGATIVE_ANONYMOUS_OR_PUBLIC] | Không routable | [PublicStorageController.java:1](../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/design/PublicStorageController.java#L1) dòng 11; HTTP-0348 | BLOCKED_AUTH_OR_TEST_FIXTURE; F01: PostgreSQL authentication failed; Gateway upstream 500; chưa kiểm chứng handler |
| API-109 | cake-ai-service | POST | 8085 /api/v1/generation-jobs | /cake-ai/api/v1/generation-jobs | JWT user + ownership (trừ public theo security) | 202 | HTTP-0349:CONNECTION_FAILED [NEGATIVE_ANONYMOUS_OR_PUBLIC] | HTTP-0350:500 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | [GenerationController.java:1](../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/generation/GenerationController.java#L1) dòng 19; HTTP-0349, HTTP-0350 | BLOCKED_AUTH_OR_TEST_FIXTURE; F01: PostgreSQL authentication failed; Gateway upstream 500; chưa kiểm chứng handler |
| API-110 | cake-ai-service | GET | 8085 /api/v1/generation-jobs | /cake-ai/api/v1/generation-jobs | JWT user + ownership (trừ public theo security) | 200 | HTTP-0351:CONNECTION_FAILED [NEGATIVE_ANONYMOUS_OR_PUBLIC] | HTTP-0352:500 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | [GenerationController.java:1](../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/generation/GenerationController.java#L1) dòng 27; HTTP-0351, HTTP-0352 | BLOCKED_AUTH_OR_TEST_FIXTURE; F01: PostgreSQL authentication failed; Gateway upstream 500; chưa kiểm chứng handler |
| API-111 | cake-ai-service | GET | 8085 /api/v1/generation-jobs/{id} | /cake-ai/api/v1/generation-jobs/{id} | JWT user + ownership (trừ public theo security) | 200 | HTTP-0353:CONNECTION_FAILED [NEGATIVE_ANONYMOUS_OR_PUBLIC] | HTTP-0354:500 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | [GenerationController.java:1](../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/generation/GenerationController.java#L1) dòng 34; HTTP-0353, HTTP-0354 | BLOCKED_AUTH_OR_TEST_FIXTURE; F01: PostgreSQL authentication failed; Gateway upstream 500; chưa kiểm chứng handler |
| API-112 | cake-ai-service | POST | 8085 /api/v1/generation-jobs/{id}/prompt-revisions | /cake-ai/api/v1/generation-jobs/{id}/prompt-revisions | JWT user + ownership (trừ public theo security) | 202 | HTTP-0355:CONNECTION_FAILED [NEGATIVE_ANONYMOUS_OR_PUBLIC] | HTTP-0356:500 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | [GenerationController.java:1](../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/generation/GenerationController.java#L1) dòng 40; HTTP-0355, HTTP-0356 | BLOCKED_AUTH_OR_TEST_FIXTURE; F01: PostgreSQL authentication failed; Gateway upstream 500; chưa kiểm chứng handler |
| API-113 | cake-ai-service | POST | 8085 /api/v1/generation-jobs/{id}/cancel | /cake-ai/api/v1/generation-jobs/{id}/cancel | JWT user + ownership (trừ public theo security) | 200 | HTTP-0357:CONNECTION_FAILED [NEGATIVE_ANONYMOUS_OR_PUBLIC] | HTTP-0358:500 [NEGATIVE_ANONYMOUS_OR_PUBLIC] | [GenerationController.java:1](../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/generation/GenerationController.java#L1) dòng 46; HTTP-0357, HTTP-0358 | BLOCKED_AUTH_OR_TEST_FIXTURE; F01: PostgreSQL authentication failed; Gateway upstream 500; chưa kiểm chứng handler |

## 17. Framework và route bổ sung

Gateway không có custom business controller. Đã probe runtime `/actuator/health`, `/actuator/info`, `/v3/api-docs`, `/v3/api-docs.yaml`, `/v3/api-docs/swagger-config`, `/swagger-ui/index.html`, `/swagger-ui.html`; UI HTML 200 và redirect 302 được ghi nhận. `/v3/api-docs` của Gateway có 0 business operation là bình thường vì nó aggregate 7 URL service qua swagger-config.

| Port | URL framework | HTTP | Content-Type / redirect |
|---|---|---|---|
| 8081 | /actuator/health | 200 | application/vnd.spring-boot.actuator.v3+json; [] |
| 8081 | /v3/api-docs | 200 | application/json; [] |
| 8081 | /swagger-ui/index.html | 200 | text/html; [] |
| 8081 | /swagger-ui.html | 200 | text/html; [302] |
| 8081 | /v3/api-docs.yaml | 200 | application/vnd.oai.openapi; [] |
| 8082 | /actuator/health | 401 | application/json;charset=UTF-8; [] |
| 8082 | /v3/api-docs | 200 | application/json; [] |
| 8082 | /swagger-ui/index.html | 200 | text/html; [] |
| 8082 | /swagger-ui.html | 200 | text/html; [302] |
| 8082 | /v3/api-docs.yaml | 401 | application/json;charset=UTF-8; [] |
| 8083 | /actuator/health | 200 | application/vnd.spring-boot.actuator.v3+json; [] |
| 8083 | /v3/api-docs | 200 | application/json; [] |
| 8083 | /swagger-ui/index.html | 200 | text/html; [] |
| 8083 | /swagger-ui.html | 200 | text/html; [302] |
| 8083 | /v3/api-docs.yaml | 200 | application/vnd.oai.openapi; [] |
| 8084 | /actuator/health | 401 | application/json;charset=UTF-8; [] |
| 8084 | /v3/api-docs | 200 | application/json; [] |
| 8084 | /swagger-ui/index.html | 200 | text/html; [] |
| 8084 | /swagger-ui.html | 200 | text/html; [302] |
| 8084 | /v3/api-docs.yaml | 401 | application/json;charset=UTF-8; [] |
| 8085 | /actuator/health | CONNECTION_FAILED | —; [] |
| 8085 | /v3/api-docs | CONNECTION_FAILED | —; [] |
| 8085 | /swagger-ui/index.html | CONNECTION_FAILED | —; [] |
| 8085 | /swagger-ui.html | CONNECTION_FAILED | —; [] |
| 8085 | /v3/api-docs.yaml | CONNECTION_FAILED | —; [] |
| 8086 | /actuator/health | 401 | application/json;charset=UTF-8; [] |
| 8086 | /v3/api-docs | 200 | application/json; [] |
| 8086 | /swagger-ui/index.html | 200 | text/html; [] |
| 8086 | /swagger-ui.html | 200 | text/html; [302] |
| 8086 | /v3/api-docs.yaml | 200 | application/vnd.oai.openapi; [] |
| 8087 | /actuator/health | 401 | application/json;charset=UTF-8; [] |
| 8087 | /v3/api-docs | 200 | application/json; [] |
| 8087 | /swagger-ui/index.html | 200 | text/html; [] |
| 8087 | /swagger-ui.html | 200 | text/html; [302] |
| 8087 | /v3/api-docs.yaml | 200 | application/vnd.oai.openapi; [] |
| 8080 | /actuator/health | 200 | application/vnd.spring-boot.actuator.v3+json; [] |
| 8080 | /v3/api-docs | 200 | application/json; [] |
| 8080 | /swagger-ui/index.html | 200 | text/html; [] |
| 8080 | /swagger-ui.html | 200 | text/html; [302] |
| 8080 | /v3/api-docs.yaml | 200 | application/vnd.oai.openapi; [] |

Static assets bên trong Swagger UI không được tính thành business endpoint. `/error` là framework error dispatch; thử wrong method đã chứng minh error handling thực tế, không thêm nó thành API nghiệp vụ. Các health path không tồn tại hoặc bị deny không được gán PASS readiness.

## 18. Swagger/OpenAPI trực tiếp từng service

| Service | Direct docs | HTTP | Operation | Swagger UI | Schema / local ref |
|---|---|---|---|---|---|
| identity-service | localhost:8081/v3/api-docs | 200 | 21 | 200 | JSON hợp lệ; không dangling $ref |
| bakery-service | localhost:8082/v3/api-docs | 200 | 42 | 200 | JSON hợp lệ; không dangling $ref |
| marketplace-service | localhost:8083/v3/api-docs | 200 | 18 | 200 | JSON hợp lệ; không dangling $ref |
| subscription-service | localhost:8084/v3/api-docs | 200 | 21 | 200 | JSON hợp lệ; không dangling $ref |
| cake-ai-service | localhost:8085/v3/api-docs | CONNECTION_FAILED | — | Không kết nối | BLOCKED |
| order-service | localhost:8086/v3/api-docs | 200 | 10 | 200 | JSON hợp lệ; không dangling $ref |
| chat-service | localhost:8087/v3/api-docs | 200 | 8 | 200 | JSON hợp lệ; không dangling $ref |

120/120 operation trong sáu spec runtime khớp source theo method/path: không thiếu hoặc thừa. JSON parse và toàn bộ reference nội bộ được đối chiếu; đây không phải tuyên bố đã chạy một bộ validator OpenAPI đầy đủ. Cake AI 11 operation chưa có spec runtime vì không start.

Drift security: Order thiếu securitySchemes cho cả 10 operation. Identity chỉ 3/21 operation có security requirement; 13 operation JWT-protected còn thiếu annotation (Address/Admin/Internal user). Bakery 38/42 và Marketplace 18/18 mô tả bearer; Chat 8/8. Subscription mô tả bearer cả IPN/return trong khi security thực permitAll và provider dùng chữ ký query.

Bakery và Subscription `/v3/api-docs.yaml` trả 401 anonymous, 403 ADMIN vì matcher chỉ `/v3/api-docs/**`, không bao phủ `.yaml`. Bốn service Bakery/Subscription/Order/Chat không có Actuator JAR, đồng thời anyRequest deny; health 401/403 không phải bằng chứng database chết. Identity và Marketplace health/readiness 200 thật.

## 19. Swagger qua API Gateway

| Service | Gateway docs URL | HTTP | Operations | Server URL được spec trả |
|---|---|---|---|---|
| identity-service | http://localhost:8080/identity/v3/api-docs | 200 | 21 | http://localhost:8080 |
| bakery-service | http://localhost:8080/bakery/v3/api-docs | 200 | 42 | http://localhost:8080 |
| marketplace-service | http://localhost:8080/marketplace/v3/api-docs | 200 | 18 | http://localhost:8080 |
| subscription-service | http://localhost:8080/subscription/v3/api-docs | 200 | 21 | http://localhost:8080 |
| cake-ai-service | http://localhost:8080/cake-ai/v3/api-docs | 500 | — | — |
| order-service | http://localhost:8080/orders/v3/api-docs | 200 | 10 | http://localhost:8080 |
| chat-service | http://localhost:8080/chat/v3/api-docs | 200 | 8 | http://localhost:8080 |

Unified Swagger UI và swagger-config tồn tại, danh sách đủ bảy service. Sáu JSON tải được, Cake AI upstream trả 500. Cả sáu spec đi qua proxy có server `http://localhost:8080` nhưng **thiếu prefix service**. Operation `/api/v1/auth/me` ghép thành Gateway `/api/v1/auth/me` trả 404, còn `/identity/api/v1/auth/me` với JWT thật trả 200. Source docs route có X-Forwarded-Prefix và PreserveHostHeader, nhưng cấu hình native mặc định không bật xử lý forwarded headers như runtime khác. Không đổi runtime property để che lỗi này. Docs proxy hiện chỉ định exact JSON path; không suy diễn có YAML proxy.

## 20. Ma trận toàn bộ operation qua Gateway

Gateway chuyển Authorization thật tới cả sáu service sống; query `status=INVALID` đến Marketplace và tái hiện đúng lỗi backend; multipart PNG đi tới Bakery và nhận cùng lỗi backend. Không có entity/mutation nhân đôi để so sánh: các lần create/update/delete dùng fixture riêng theo direct/Gateway, read-only so sánh cùng ID.

| Operation | Direct HTTP tập hợp | Gateway URL | Gateway HTTP tập hợp | Kết luận |
|---|---|---|---|---|
| API-002 GET /api/v1/users/me/addresses | {'200': 2, '401': 1} | /identity/api/v1/users/me/addresses | {'200': 2, '401': 1} | PASS_DIRECT_AND_GATEWAY |
| API-003 GET /api/v1/users/me/addresses/{id} | {'200': 1, '404': 2, '401': 1} | /identity/api/v1/users/me/addresses/{id} | {'200': 1, '404': 2, '401': 1} | PASS_DIRECT_AND_GATEWAY |
| API-004 POST /api/v1/users/me/addresses | {'201': 2, '401': 1} | /identity/api/v1/users/me/addresses | {'201': 2, '401': 1} | PASS_DIRECT_AND_GATEWAY |
| API-005 PATCH /api/v1/users/me/addresses/{id} | {'200': 1, '401': 1} | /identity/api/v1/users/me/addresses/{id} | {'200': 1, '401': 1} | PASS_DIRECT_AND_GATEWAY |
| API-006 PUT /api/v1/users/me/addresses/{id}/default | {'200': 1, '401': 1} | /identity/api/v1/users/me/addresses/{id}/default | {'200': 1, '401': 1} | PASS_DIRECT_AND_GATEWAY |
| API-007 DELETE /api/v1/users/me/addresses/{id} | {'401': 1, '204': 1} | /identity/api/v1/users/me/addresses/{id} | {'401': 1, '204': 1} | PASS_DIRECT_AND_GATEWAY |
| API-008 POST /api/v1/auth/register | {'201': 2, '400': 2, '409': 1} | /identity/api/v1/auth/register | {'201': 2, '400': 2, '409': 1} | PASS_DIRECT_AND_GATEWAY |
| API-009 POST /api/v1/auth/login | {'200': 29, '400': 1} | /identity/api/v1/auth/login | {'400': 1, '200': 3} | PASS_DIRECT_AND_GATEWAY |
| API-010 POST /api/v1/auth/refresh | {'401': 6, '200': 1} | /identity/api/v1/auth/refresh | {'401': 6, '200': 1} | PASS_DIRECT_AND_GATEWAY |
| API-011 POST /api/v1/auth/logout | {'401': 1, '200': 2} | /identity/api/v1/auth/logout | {'401': 1, '200': 2} | PASS_DIRECT_AND_GATEWAY |
| API-012 GET /api/v1/auth/me | {'200': 3, '401': 3} | /identity/api/v1/auth/me | {'200': 3, '401': 3} | PASS_DIRECT_AND_GATEWAY |
| API-014 GET /api/v1/admin/users | {'200': 1, '403': 2, '401': 1} | /identity/api/v1/admin/users | {'200': 1, '403': 2, '401': 1} | PASS_DIRECT_AND_GATEWAY |
| API-015 GET /api/v1/admin/users/{userId} | {'200': 2, '401': 1, '403': 1} | /identity/api/v1/admin/users/{userId} | {'200': 2, '401': 1, '403': 1} | PASS_DIRECT_AND_GATEWAY |
| API-016 PATCH /api/v1/admin/users/{userId}/status | {'200': 2, '401': 1} | /identity/api/v1/admin/users/{userId}/status | {'200': 2, '401': 1} | PASS_DIRECT_AND_GATEWAY |
| API-017 PUT /api/v1/admin/users/{userId}/roles | {'200': 2, '401': 1} | /identity/api/v1/admin/users/{userId}/roles | {'401': 1, '200': 1} | PASS_DIRECT_AND_GATEWAY |
| API-021 PATCH /api/v1/users/me | {'200': 2, '401': 1} | /identity/api/v1/users/me | {'200': 2, '401': 1} | PASS_DIRECT_AND_GATEWAY |
| API-022 GET /api/v1/bakeries/{bakeryId}/add-ons | {'401': 1, '200': 1} | /bakery/api/v1/bakeries/{bakeryId}/add-ons | {'401': 1, '200': 1} | PASS_DIRECT_AND_GATEWAY |
| API-023 POST /api/v1/bakeries/{bakeryId}/add-ons | {'401': 1, '201': 1} | /bakery/api/v1/bakeries/{bakeryId}/add-ons | {'401': 1, '201': 1} | PASS_DIRECT_AND_GATEWAY |
| API-024 PATCH /api/v1/bakeries/{bakeryId}/add-ons/{addOnId} | {'401': 1, '200': 1} | /bakery/api/v1/bakeries/{bakeryId}/add-ons/{addOnId} | {'401': 1, '200': 1} | PASS_DIRECT_AND_GATEWAY |
| API-025 DELETE /api/v1/bakeries/{bakeryId}/add-ons/{addOnId} | {'401': 1, '204': 1} | /bakery/api/v1/bakeries/{bakeryId}/add-ons/{addOnId} | {'401': 1, '204': 1} | PASS_DIRECT_AND_GATEWAY |
| API-026 POST /api/v1/bakeries/{bakeryId}/add-ons/{addOnId}/image | {'401': 1, '400': 1} | /bakery/api/v1/bakeries/{bakeryId}/add-ons/{addOnId}/image | {'401': 1, '400': 1} | FAIL_DIRECT |
| API-027 GET /api/v1/admin/bakeries | {'200': 2, '401': 1, '403': 1} | /bakery/api/v1/admin/bakeries | {'200': 2, '401': 1, '403': 1} | PASS_DIRECT_AND_GATEWAY |
| API-028 GET /api/v1/admin/bakeries/{bakeryId} | {'401': 1, '403': 1, '200': 1} | /bakery/api/v1/admin/bakeries/{bakeryId} | {'401': 1, '403': 1, '200': 1} | PASS_DIRECT_AND_GATEWAY |
| API-029 PATCH /api/v1/admin/bakeries/{bakeryId}/status | {'401': 1, '200': 1} | /bakery/api/v1/admin/bakeries/{bakeryId}/status | {'401': 1, '200': 1} | PASS_DIRECT_AND_GATEWAY |
| API-030 POST /api/v1/bakeries | {'503': 1, '401': 1} | /bakery/api/v1/bakeries | {'503': 1, '401': 1} | FAIL_DIRECT |
| API-031 PATCH /api/v1/bakeries/{bakeryId} | {'401': 1, '200': 1} | /bakery/api/v1/bakeries/{bakeryId} | {'401': 1, '200': 1} | PASS_DIRECT_AND_GATEWAY |
| API-032 PUT /api/v1/bakeries/{bakeryId}/operations | {'401': 1, '200': 1} | /bakery/api/v1/bakeries/{bakeryId}/operations | {'401': 1, '200': 1} | PASS_DIRECT_AND_GATEWAY |
| API-033 POST /api/v1/bakeries/{bakeryId}/submit-for-approval | {'401': 1, '200': 1} | /bakery/api/v1/bakeries/{bakeryId}/submit-for-approval | {'401': 1, '200': 1} | PASS_DIRECT_AND_GATEWAY |
| API-034 POST /api/v1/bakeries/{bakeryId}/logo | {'401': 1, '400': 1} | /bakery/api/v1/bakeries/{bakeryId}/logo | {'401': 1, '400': 1} | FAIL_DIRECT |
| API-035 POST /api/v1/bakeries/{bakeryId}/cover | {'401': 1, '400': 1} | /bakery/api/v1/bakeries/{bakeryId}/cover | {'401': 1, '400': 1} | FAIL_DIRECT |
| API-036 GET /api/v1/bakeries/onboarding | {'200': 2, '401': 1} | /bakery/api/v1/bakeries/onboarding | {'200': 2, '401': 1} | PASS_DIRECT_AND_GATEWAY |
| API-037 POST /api/v1/bakeries/onboarding | {'503': 1, '401': 1} | /bakery/api/v1/bakeries/onboarding | {'503': 1, '401': 1} | FAIL_DIRECT |
| API-038 POST /api/v1/bakeries/{bakeryId}/onboarding/complete | {'401': 1, '503': 1} | /bakery/api/v1/bakeries/{bakeryId}/onboarding/complete | {'401': 1, '503': 1} | FAIL_DIRECT |
| API-042 GET /api/v1/bakeries | {'200': 2, '400': 1, '503': 1} | /bakery/api/v1/bakeries | {'200': 2, '400': 1, '503': 1} | FAIL_DIRECT |
| API-043 GET /api/v1/bakeries/{bakeryId} | {'404': 1, '503': 1} | /bakery/api/v1/bakeries/{bakeryId} | {'404': 1, '503': 1} | FAIL_DIRECT |
| API-048 GET /api/v1/bakeries/{bakeryId}/categories | {'401': 1, '200': 1} | /bakery/api/v1/bakeries/{bakeryId}/categories | {'401': 1, '200': 1} | PASS_DIRECT_AND_GATEWAY |
| API-049 POST /api/v1/bakeries/{bakeryId}/categories | {'401': 1, '201': 1} | /bakery/api/v1/bakeries/{bakeryId}/categories | {'401': 1, '201': 1} | PASS_DIRECT_AND_GATEWAY |
| API-050 PATCH /api/v1/bakeries/{bakeryId}/categories/{categoryId} | {'401': 1, '200': 1} | /bakery/api/v1/bakeries/{bakeryId}/categories/{categoryId} | {'401': 1, '200': 1} | PASS_DIRECT_AND_GATEWAY |
| API-051 DELETE /api/v1/bakeries/{bakeryId}/categories/{categoryId} | {'401': 1, '204': 1} | /bakery/api/v1/bakeries/{bakeryId}/categories/{categoryId} | {'401': 1, '204': 1} | PASS_DIRECT_AND_GATEWAY |
| API-052 GET /api/v1/bakeries/{bakeryId}/members | {'401': 1, '200': 2, '403': 3} | /bakery/api/v1/bakeries/{bakeryId}/members | {'401': 1, '200': 2, '403': 3} | PASS_DIRECT_AND_GATEWAY |
| API-053 GET /api/v1/bakeries/{bakeryId}/products | {'401': 1, '200': 2} | /bakery/api/v1/bakeries/{bakeryId}/products | {'401': 1, '200': 2} | PASS_DIRECT_AND_GATEWAY |
| API-054 POST /api/v1/bakeries/{bakeryId}/products | {'401': 1, '201': 1} | /bakery/api/v1/bakeries/{bakeryId}/products | {'401': 1, '201': 1} | PASS_DIRECT_AND_GATEWAY |
| API-055 PATCH /api/v1/bakeries/{bakeryId}/products/{productId} | {'401': 1, '200': 1} | /bakery/api/v1/bakeries/{bakeryId}/products/{productId} | {'401': 1, '200': 1} | PASS_DIRECT_AND_GATEWAY |
| API-056 PUT /api/v1/bakeries/{bakeryId}/products/{productId}/options | {'401': 1, '200': 1} | /bakery/api/v1/bakeries/{bakeryId}/products/{productId}/options | {'401': 1, '200': 1} | PASS_DIRECT_AND_GATEWAY |
| API-057 POST /api/v1/bakeries/{bakeryId}/products/{productId}/images | {'401': 1, '400': 1} | /bakery/api/v1/bakeries/{bakeryId}/products/{productId}/images | {'401': 1, '400': 1} | FAIL_DIRECT |
| API-058 DELETE /api/v1/bakeries/{bakeryId}/products/{productId}/images/{imageId} | {'401': 1} | /bakery/api/v1/bakeries/{bakeryId}/products/{productId}/images/{imageId} | {'401': 1} | BLOCKED_MISSING_LOCAL_DB_OR_STORAGE |
| API-059 POST /api/v1/bakeries/{bakeryId}/products/{productId}/publish | {'401': 1, '422': 1} | /bakery/api/v1/bakeries/{bakeryId}/products/{productId}/publish | {'401': 1, '422': 1} | BLOCKED_MISSING_LOCAL_DB_OR_STORAGE |
| API-060 POST /api/v1/bakeries/{bakeryId}/products/{productId}/hide | {'401': 1, '409': 1} | /bakery/api/v1/bakeries/{bakeryId}/products/{productId}/hide | {'401': 1, '409': 1} | BLOCKED_MISSING_LOCAL_DB_OR_STORAGE |
| API-061 POST /api/v1/bakeries/{bakeryId}/products/{productId}/archive | {'401': 1, '200': 1} | /bakery/api/v1/bakeries/{bakeryId}/products/{productId}/archive | {'401': 1, '200': 1} | PASS_DIRECT_AND_GATEWAY |
| API-062 GET /api/v1/products | {'200': 3} | /bakery/api/v1/products | {'200': 3} | PASS_DIRECT_AND_GATEWAY |
| API-063 GET /api/v1/products/{productId} | {'404': 2} | /bakery/api/v1/products/{productId} | {'404': 2} | BLOCKED_MISSING_LOCAL_DB_OR_STORAGE |
| API-064 GET /api/v1/cake-requests | {'200': 2, '401': 1, '500': 2, '503': 1, '400': 1, '403': 1} | /marketplace/api/v1/cake-requests | {'200': 2, '401': 1, '500': 1, '503': 1, '400': 1} | FAIL_DIRECT |
| API-065 GET /api/v1/cake-requests/{id} | {'200': 3, '403': 1, '401': 1} | /marketplace/api/v1/cake-requests/{id} | {'200': 3, '403': 1, '401': 1} | PASS_DIRECT_AND_GATEWAY |
| API-066 POST /api/v1/cake-requests | {'201': 2, '401': 1} | /marketplace/api/v1/cake-requests | {'201': 2, '401': 1} | PASS_DIRECT_AND_GATEWAY |
| API-067 PATCH /api/v1/cake-requests/{id} | {'200': 1, '401': 1} | /marketplace/api/v1/cake-requests/{id} | {'200': 1, '401': 1} | PASS_DIRECT_AND_GATEWAY |
| API-068 POST /api/v1/cake-requests/{id}/publish | {'200': 2, '401': 1} | /marketplace/api/v1/cake-requests/{id}/publish | {'200': 2, '401': 1} | PASS_DIRECT_AND_GATEWAY |
| API-069 POST /api/v1/cake-requests/{id}/cancel | {'401': 1, '200': 1} | /marketplace/api/v1/cake-requests/{id}/cancel | {'401': 1, '200': 1} | PASS_DIRECT_AND_GATEWAY |
| API-070 PUT /api/v1/cake-requests/{id}/selected-design | {'401': 1} | /marketplace/api/v1/cake-requests/{id}/selected-design | {'401': 1} | BLOCKED_EXTERNAL_PROVIDER_OR_COST |
| API-071 POST /api/v1/cake-requests/{id}/images | {'401': 1, '409': 1, '400': 1} | /marketplace/api/v1/cake-requests/{id}/images | {'401': 1, '409': 1, '400': 1} | BLOCKED_EXTERNAL_PROVIDER_OR_COST |
| API-072 DELETE /api/v1/cake-requests/{id}/images/{imageId} | {'401': 1} | /marketplace/api/v1/cake-requests/{id}/images/{imageId} | {'401': 1} | BLOCKED_EXTERNAL_PROVIDER_OR_COST |
| API-076 GET /api/v1/offers | {'200': 2, '401': 1, '503': 1, '500': 4} | /marketplace/api/v1/offers | {'200': 2, '401': 1, '503': 1, '500': 2} | FAIL_DIRECT |
| API-077 GET /api/v1/offers/{id} | {'401': 1} | /marketplace/api/v1/offers/{id} | {'401': 1} | PASS_EXPECTED_NEGATIVE_ONLY |
| API-078 POST /api/v1/cake-requests/{id}/offers | {'401': 1, '503': 1} | /marketplace/api/v1/cake-requests/{id}/offers | {'401': 1, '503': 1} | FAIL_DIRECT |
| API-079 PATCH /api/v1/offers/{id} | {'401': 1} | /marketplace/api/v1/offers/{id} | {'401': 1} | PASS_EXPECTED_NEGATIVE_ONLY |
| API-080 POST /api/v1/offers/{id}/withdraw | {'401': 1} | /marketplace/api/v1/offers/{id}/withdraw | {'401': 1} | PASS_EXPECTED_NEGATIVE_ONLY |
| API-081 POST /api/v1/offers/{id}/accept | {'401': 1} | /marketplace/api/v1/offers/{id}/accept | {'401': 1} | PASS_EXPECTED_NEGATIVE_ONLY |
| API-082 GET /api/v1/admin/bakery-payments | {'200': 2, '401': 1, '403': 1} | /subscription/api/v1/admin/bakery-payments | {'200': 2, '401': 1, '403': 1} | PASS_DIRECT_AND_GATEWAY |
| API-083 POST /api/v1/admin/bakery-payments/{paymentId}/approve | {'401': 1} | /subscription/api/v1/admin/bakery-payments/{paymentId}/approve | {'401': 1} | PASS_EXPECTED_NEGATIVE_ONLY |
| API-084 POST /api/v1/admin/bakery-payments/{paymentId}/reject | {'401': 1} | /subscription/api/v1/admin/bakery-payments/{paymentId}/reject | {'401': 1} | PASS_EXPECTED_NEGATIVE_ONLY |
| API-085 POST /api/v1/subscription-orders/{orderId}/payments | {'401': 1} | /subscription/api/v1/subscription-orders/{orderId}/payments | {'401': 1} | PASS_EXPECTED_NEGATIVE_ONLY |
| API-086 GET /api/v1/subscription-plans/payment-options | {'200': 2} | /subscription/api/v1/subscription-plans/payment-options | {'200': 2} | PASS_DIRECT_AND_GATEWAY |
| API-087 POST /api/v1/subscription-orders/{orderId}/vnpay/checkout | {'401': 1} | /subscription/api/v1/subscription-orders/{orderId}/vnpay/checkout | {'401': 1} | PASS_EXPECTED_NEGATIVE_ONLY |
| API-088 GET /api/v1/payments/vnpay/ipn | {'200': 2} | /subscription/api/v1/payments/vnpay/ipn | {'200': 2} | BLOCKED_EXTERNAL_PROVIDER_OR_COST |
| API-089 GET /api/v1/payments/vnpay/return | {'400': 2} | /subscription/api/v1/payments/vnpay/return | {'400': 2} | BLOCKED_EXTERNAL_PROVIDER_OR_COST |
| API-090 GET /api/v1/admin/vnpay-attempts | {'200': 1, '401': 1, '403': 1} | /subscription/api/v1/admin/vnpay-attempts | {'200': 1, '401': 1, '403': 1} | PASS_DIRECT_AND_GATEWAY |
| API-091 GET /api/v1/admin/subscription-plans | {'200': 1, '401': 1, '403': 1} | /subscription/api/v1/admin/subscription-plans | {'200': 1, '401': 1, '403': 1} | PASS_DIRECT_AND_GATEWAY |
| API-092 POST /api/v1/admin/subscription-plans | {'201': 2, '401': 1} | /subscription/api/v1/admin/subscription-plans | {'201': 2, '401': 1} | PASS_DIRECT_AND_GATEWAY |
| API-093 PATCH /api/v1/admin/subscription-plans/{planId} | {'200': 1, '401': 1} | /subscription/api/v1/admin/subscription-plans/{planId} | {'200': 1, '401': 1} | PASS_DIRECT_AND_GATEWAY |
| API-094 POST /api/v1/admin/subscription-plans/{planId}/archive | {'401': 1, '200': 1} | /subscription/api/v1/admin/subscription-plans/{planId}/archive | {'401': 1, '200': 1} | PASS_DIRECT_AND_GATEWAY |
| API-095 GET /api/v1/subscription-plans | {'200': 3} | /subscription/api/v1/subscription-plans | {'200': 3} | PASS_DIRECT_AND_GATEWAY |
| API-096 GET /api/v1/subscription-plans/{planId} | {'200': 2, '404': 1} | /subscription/api/v1/subscription-plans/{planId} | {'200': 2, '404': 1} | PASS_DIRECT_AND_GATEWAY |
| API-097 GET /api/v1/bakeries/{bakeryId}/subscription | {'401': 1, '503': 1} | /subscription/api/v1/bakeries/{bakeryId}/subscription | {'401': 1, '503': 1} | FAIL_DIRECT |
| API-099 GET /api/v1/admin/subscription-orders | {'200': 2, '401': 1, '403': 1} | /subscription/api/v1/admin/subscription-orders | {'200': 2, '401': 1, '403': 1} | PASS_DIRECT_AND_GATEWAY |
| API-100 POST /api/v1/bakeries/{bakeryId}/subscription-orders | {'401': 1, '503': 2} | /subscription/api/v1/bakeries/{bakeryId}/subscription-orders | {'401': 1, '503': 2} | FAIL_DIRECT |
| API-101 GET /api/v1/bakeries/{bakeryId}/subscription-orders | {'401': 1, '503': 1} | /subscription/api/v1/bakeries/{bakeryId}/subscription-orders | {'401': 1, '503': 1} | FAIL_DIRECT |
| API-102 GET /api/v1/subscription-orders/{orderId} | {'401': 1} | /subscription/api/v1/subscription-orders/{orderId} | {'401': 1} | PASS_EXPECTED_NEGATIVE_ONLY |
| API-103 GET /api/v1/generated-designs/{id} | {'CONNECTION_FAILED': 1} | /cake-ai/api/v1/generated-designs/{id} | {'500': 1} | BLOCKED_AUTH_OR_TEST_FIXTURE |
| API-104 GET /api/v1/admin/generated-designs | {'CONNECTION_FAILED': 2} | /cake-ai/api/v1/admin/generated-designs | {'500': 2} | BLOCKED_AUTH_OR_TEST_FIXTURE |
| API-105 PATCH /api/v1/admin/generated-designs/{id}/moderation | {'CONNECTION_FAILED': 1} | /cake-ai/api/v1/admin/generated-designs/{id}/moderation | {'500': 1} | BLOCKED_AUTH_OR_TEST_FIXTURE |
| API-109 POST /api/v1/generation-jobs | {'CONNECTION_FAILED': 1} | /cake-ai/api/v1/generation-jobs | {'500': 1} | BLOCKED_AUTH_OR_TEST_FIXTURE |
| API-110 GET /api/v1/generation-jobs | {'CONNECTION_FAILED': 1} | /cake-ai/api/v1/generation-jobs | {'500': 1} | BLOCKED_AUTH_OR_TEST_FIXTURE |
| API-111 GET /api/v1/generation-jobs/{id} | {'CONNECTION_FAILED': 1} | /cake-ai/api/v1/generation-jobs/{id} | {'500': 1} | BLOCKED_AUTH_OR_TEST_FIXTURE |
| API-112 POST /api/v1/generation-jobs/{id}/prompt-revisions | {'CONNECTION_FAILED': 1} | /cake-ai/api/v1/generation-jobs/{id}/prompt-revisions | {'500': 1} | BLOCKED_AUTH_OR_TEST_FIXTURE |
| API-113 POST /api/v1/generation-jobs/{id}/cancel | {'CONNECTION_FAILED': 1} | /cake-ai/api/v1/generation-jobs/{id}/cancel | {'500': 1} | BLOCKED_AUTH_OR_TEST_FIXTURE |
| API-116 POST /api/v1/orders/direct | {'401': 1, '503': 1} | /orders/api/v1/orders/direct | {'401': 1, '503': 1} | FAIL_DIRECT |
| API-117 GET /api/v1/orders | {'200': 2, '401': 1, '400': 1} | /orders/api/v1/orders | {'200': 2, '401': 1, '400': 1} | PASS_DIRECT_AND_GATEWAY |
| API-118 GET /api/v1/orders/{orderId} | {'401': 1} | /orders/api/v1/orders/{orderId} | {'401': 1} | PASS_EXPECTED_NEGATIVE_ONLY |
| API-119 POST /api/v1/orders/{orderId}/status-transitions | {'401': 1} | /orders/api/v1/orders/{orderId}/status-transitions | {'401': 1} | PASS_EXPECTED_NEGATIVE_ONLY |
| API-120 POST /api/v1/orders/{orderId}/review | {'401': 1} | /orders/api/v1/orders/{orderId}/review | {'401': 1} | PASS_EXPECTED_NEGATIVE_ONLY |
| API-121 PATCH /api/v1/orders/{orderId}/review | {'401': 1} | /orders/api/v1/orders/{orderId}/review | {'401': 1} | PASS_EXPECTED_NEGATIVE_ONLY |
| API-122 DELETE /api/v1/orders/{orderId}/review | {'401': 1} | /orders/api/v1/orders/{orderId}/review | {'401': 1} | PASS_EXPECTED_NEGATIVE_ONLY |
| API-123 PATCH /api/v1/admin/reviews/{orderId}/status | {'401': 1} | /orders/api/v1/admin/reviews/{orderId}/status | {'401': 1} | PASS_EXPECTED_NEGATIVE_ONLY |
| API-124 GET /api/v1/conversations | {'200': 2, '401': 1, '400': 1, '503': 1} | /chat/api/v1/conversations | {'200': 2, '401': 1, '400': 1, '503': 1} | FAIL_DIRECT |
| API-125 POST /api/v1/conversations | {'401': 1, '503': 2} | /chat/api/v1/conversations | {'401': 1, '503': 2} | FAIL_DIRECT |
| API-126 GET /api/v1/conversations/{conversationId} | {'401': 1} | /chat/api/v1/conversations/{conversationId} | {'401': 1} | PASS_EXPECTED_NEGATIVE_ONLY |
| API-127 POST /api/v1/conversations/{conversationId}/close | {'401': 1} | /chat/api/v1/conversations/{conversationId}/close | {'401': 1} | PASS_EXPECTED_NEGATIVE_ONLY |
| API-128 GET /api/v1/conversations/{conversationId}/messages | {'401': 1} | /chat/api/v1/conversations/{conversationId}/messages | {'401': 1} | PASS_EXPECTED_NEGATIVE_ONLY |
| API-129 POST /api/v1/conversations/{conversationId}/messages | {'401': 1} | /chat/api/v1/conversations/{conversationId}/messages | {'401': 1} | PASS_EXPECTED_NEGATIVE_ONLY |
| API-130 POST /api/v1/conversations/{conversationId}/read | {'401': 1} | /chat/api/v1/conversations/{conversationId}/read | {'401': 1} | PASS_EXPECTED_NEGATIVE_ONLY |
| API-131 DELETE /api/v1/conversations/{conversationId}/messages/{messageId} | {'401': 1} | /chat/api/v1/conversations/{conversationId}/messages/{messageId} | {'401': 1} | PASS_EXPECTED_NEGATIVE_ONLY |

Đối chiếu sâu 16 cặp cùng resource: 16/16 response bằng nhau sau loại timestamp; 15 cặp 200, một cặp Bakery listing 503 ở cả hai đường. Sự tương đương của lỗi không được tính là business PASS. Với mutations, đã quan sát status/schema và readback/persistence fixture; không tuyên bố byte-for-byte equivalence cho response chứa ID/thời gian khác nhau. Chưa kiểm chứng large-response/download thành công vì không có media/native storage/entity hợp lệ.

## 21. Authentication, authorization và security

Đăng ký/login/JWK thật; JWT RS256 từ Identity dùng được cho sáu resource service. Customer bị chặn ADMIN 403; địa chỉ foreign owner 404; RFQ foreign customer 403. OWNER B có platform role BAKERY_OWNER nhưng không có membership vẫn bị Bakery từ chối 403 (HTTP-0657/0658), phân biệt role với ownership. Service JWT audience/scope thật được cấp cho Marketplace/Cake AI theo cấu hình có sẵn; sai scope vào chat-authorization 403, user token vào internal 403, service token vào public user API 403. Internal Gateway prefixed/unprefixed đều không có route, 404.

Cookie: native root default Secure=true. `requests.Session` không tự gửi Secure cookie trên HTTP, nên automatic refresh trả 401. Đây là giới hạn transport/client policy được quan sát, **không kết luận browser localhost chắc chắn hỏng**. Gửi đúng cookie thật nhận từ login một cách explicit trên loopback đã xác minh refresh 200, rotation/reuse 401 và family revocation; logout có cookie thu hồi thật. Gateway rewrite Path chính xác. Không đổi flag Secure.

Token JWT thật đã hết hạn: [{"id": "HTTP-0659", "status": 401, "gateway": false, "status_match": true}, {"id": "HTTP-0660", "status": 401, "gateway": true, "status_match": true}]

CORS: direct Identity chấp nhận origin localhost:5173, trả ACAO và credentials; origin lạ 403. Gateway OPTIONS trả 200 cho cả hai nhưng không có ACAO/ACAM/ACAC. Origin lạ vẫn không được browser cho phép; đây không phải CORS bypass. Origin được phép cũng thiếu preflight hợp lệ, là lỗi tương thích cross-origin. Invalid JWT 401; query/page/size validation đã chạy. Không khẳng định đã kiểm thử đầy đủ mọi cặp role × operation × state.

### Thống kê negative/security riêng

| Nhóm HTTP scenario | Đã thử | PASS đúng expected | FAIL | BLOCKED |
|---|---|---|---|---|
| Anonymous/public contract | 240 | 221 | 0 | 19 |
| Negative/security explicit | 84 | 71 | 11 | 2 |

Đếm theo request evidence (gồm direct/Gateway và reproduction), không phải số operation duy nhất. 11 failure explicit gồm 9 filter parse500 và2 wrong-method500; hai blocked là Admin Cake AI không có runtime. CORS được phân tích bằng header riêng, không coi status200 không ACAO của origin lạ là bypass.

## 22. PostgreSQL, migrations và persistence

Đã xác minh `default_transaction_read_only=on` khi fingerprint database hiện hữu. Sáu database audit được CREATE bằng đúng credential hiện có đã xác thực trên PostgreSQL native; chỉ override JDBC endpoint/database trong child environment. Flyway chạy thật: Identity V2 (2 migration), Bakery V3 (3), Marketplace V2 (2), Subscription V5 (5), Order V3 (3), Chat V1 (1). Tổng 16 migration trên **database mới**, không sửa schema cũ. Cake AI SQLSTATE 28P01 trước migration.

| Service | Database audit | Tạo thành công |
|---|---|---|
| bakery-service | native_audit_20261111_144126_bakery | True |
| chat-service | native_audit_20261111_144126_chat | True |
| identity-service | native_audit_20261111_144126_identity | True |
| marketplace-service | native_audit_20261111_144126_marketplace | True |
| order-service | native_audit_20261111_144126_order | True |
| subscription-service | native_audit_20261111_144126_subscription | True |

Persistence đã đối chiếu bằng API readback và SELECT count(*) read-only: 4 user, 2 địa chỉ checkout còn lại, 2 bakery seeded, 2 product, 2 option group + 2 option value, 4 RFQ; 0 product image, 0 request image, 0 Offer/Order/Conversation/Payment/Subscription order. 7 plan gồm 3 reference seed và 4 plan API; 2 plan audit đã archive. Refresh tokens chỉ lưu hash theo source; raw token không được lưu evidence. Query ban đầu dùng tên `chat_messages` sai và bị từ chối; tên đúng source là `messages`, đã sửa truy vấn diagnostic ngoài repo và xác minh lại; không có schema thay đổi.

Các invariant idempotency/concurrency có unit tests; integration tests Testcontainers không chạy và không thay bằng H2. Không tuyên bố đã xác minh replay Order/Offer qua runtime khi chưa tạo được Order/Offer. Original DB fingerprint 50 bảng không đổi ở sáu DB truy cập được; Cake AI không có quyền truy cập thành công để fingerprint dữ liệu.

## 23. Multipart, upload/download và storage

PNG synthetic 16×16 do Pillow tạo trong RAM, đúng PNG signature/content-type, được gửi multipart qua direct và Gateway tới add-on, product image, logo, cover. Tất cả trả 400 `Image could not be read`, DB không có product image. TCP native MinIO không lắng nghe. Source BakeryImageStorage.upload bao cả `file.getBytes()` lẫn MinIO bucketExists/putObject trong cùng try, catch IOException chuyển 400; lỗi network IOException vì vậy bị phân loại như lỗi file. Không ghi đây là ảnh PNG không hợp lệ. Chưa có network stack trace trong catch để phân biệt chi tiết từng I/O, nhưng catch rộng và runtime 400 cùng dependency mất đã được xác nhận.

Marketplace file nội dung không phải ảnh bị từ chối 400 trước khi storage khởi tạo; upload lên RFQ đã publish trả 409. Đây là negative PASS, không phải Firebase upload PASS. Không upload/delete/scan GCS do không có phép cloud cho execution này; `FIREBASE_CREDENTIALS_FILE` không tự làm ADC có hiệu lực. Chat attachment và Subscription proof còn BLOCKED bởi conversation/subscription order và native storage. Không tạo signed URL giả hoặc thử URL lịch sử. Cake AI storage, durability sau restart, moderation preview chưa thể kiểm thử native.

## 24. E2E liên service

| Journey | Điểm đạt thật | Điểm chặn | Kết quả |
|---|---|---|---|
| Identity/Address → Bakery → Checkout → Order | Register/login/address CRUD; Bakery catalog API độc lập với fixture seeded | Bakery create 503 do service credential; checkout 503 trước Identity validation; ảnh/publish chưa có | BLOCKED; không có Order |
| RFQ → Offer → Accept → Order | Customer RFQ DRAFT → patch → OPEN; owner discovery attempt | Owner discovery/offer create 503 khi acquire scoped service token | BLOCKED; 0 Offer, 0 Order |
| Customer ↔ Owner Chat | Customer list 200; valid RFQ + ACTIVE bakery IDs có thật | Conversation create 503 Identity service-token issuance unavailable | BLOCKED; 0 Conversation/Message |
| Subscription → Admin decision → entitlement | Plan CRUD/Admin directory; actual internal entitlement returns inactive | Membership validation 503 do issuer chưa provision Subscription hash | BLOCKED; 0 subscription order/payment/period |
| Cake AI → storage → moderation → selection | Build + 33 non-container unit tests; source fail-closed kiểm tra ownership | Cake AI không start; provider/cloud chưa được cấp phép; không có design thật | BLOCKED_EXTERNAL_PROVIDER_OR_COST + native auth |

Customer RFQ được tạo direct rồi đọc cùng ID qua Gateway; địa chỉ/profile/catalog quản trị cũng cross-readback. Đây là cross-entry consistency của cùng native dataset, không phải năm E2E business journey hoàn tất. Không có Java2D fallback/mocked provider được tính là Gemini PASS.

## 25. Kiểm thử tự động Maven

Allowlist tạo từ source test classes, loại cả class import Testcontainers lẫn subclass kế thừa base container. Đã kiểm tra source test được chọn dùng Mockito/loopback stub và không gọi cloud có phí. Lệnh thành công:

```powershell
$allow = Get-Content "C:\Users\phuck\AppData\Local\Temp\bakery-native-audit-20261111-144126\test-allowlist.txt"
mvn -B -ntp test "-Dtest=$allow" "-Dsurefire.failIfNoSpecifiedTests=false"
```

194 test trong 50 suite report, 0 failure/error/skipped. Có 48 tên class duy nhất; hai tên xuất hiện ở nhiều module. `SKIPPED=0` của JUnit chỉ nói về allowlist, **không tính các test bị chủ động loại trước discovery**.

| Module | Test thực thi | Failure | Error | Skip |
|---|---|---|---|---|
| api-gateway | 1 | 0 | 0 | 0 |
| bakery-service | 45 | 0 | 0 | 0 |
| cake-ai-service | 33 | 0 | 0 | 0 |
| chat-service | 9 | 0 | 0 | 0 |
| identity-service | 22 | 0 | 0 | 0 |
| marketplace-service | 21 | 0 | 0 | 0 |
| order-service | 26 | 0 | 0 | 0 |
| platform-support | 3 | 0 | 0 | 0 |
| subscription-service | 34 | 0 | 0 | 0 |

Danh sách concrete bị BLOCKED_NO_DOCKER:

| Module | Class | Lý do |
|---|---|---|
| bakery-service | BakeryServiceApplicationTests | Testcontainers trực tiếp/kế thừa; không load/run |
| bakery-service | BakeryCrudIntegrationTests | Testcontainers trực tiếp/kế thừa; không load/run |
| bakery-service | BakeryCatalogIntegrationTests | Testcontainers trực tiếp/kế thừa; không load/run |
| cake-ai-integration-tests | CakeAiEndToEndTest | Testcontainers trực tiếp/kế thừa; không load/run |
| cake-ai-service | CakeAiServiceApplicationTests | Testcontainers trực tiếp/kế thừa; không load/run |
| cake-ai-service | GenerationFlowTest | Testcontainers trực tiếp/kế thừa; không load/run |
| chat-service | ChatServiceApplicationTests | Testcontainers trực tiếp/kế thừa; không load/run |
| chat-service | MinioAttachmentStorageTest | Testcontainers trực tiếp/kế thừa; không load/run |
| identity-service | AddressApiIntegrationTest | Testcontainers trực tiếp/kế thừa; không load/run |
| identity-service | IdentityServiceApplicationTests | Testcontainers trực tiếp/kế thừa; không load/run |
| integration-tests | MarketplaceEndToEndTest | Testcontainers trực tiếp/kế thừa; không load/run |
| marketplace-service | MarketplaceServiceApplicationTests | Testcontainers trực tiếp/kế thừa; không load/run |
| order-service | OrderServiceApplicationTests | Testcontainers trực tiếp/kế thừa; không load/run |
| subscription-service | AdminSubscriptionOrderIntegrationTests | Testcontainers trực tiếp/kế thừa; không load/run |
| subscription-service | SubscriptionDataIntegrationTests | Testcontainers trực tiếp/kế thừa; không load/run |
| subscription-service | SubscriptionServiceApplicationTests | Testcontainers trực tiếp/kế thừa; không load/run |
| subscription-service | VnpayIntegrationTests | Testcontainers trực tiếp/kế thừa; không load/run |

Ba abstract/base PostgreSQL test class cũng không chạy. `cake-ai-integration-tests` không thuộc reactor và bị chặn độc lập. Ban đầu PowerShell truyền `-Dsurefire.failIfNoSpecifiedTests=false` không quote khiến Maven hiểu nhầm lifecycle phase; lần đó dừng ở parent, không test/container nào chạy. Đã sửa **lệnh audit ngoài repository**, không sửa POM/test, rồi chạy allowlist thành công. Các warning deprecated API/Mockito dynamic attach không phải build failure.

## 26. Tổng hợp lỗi API không hoạt động và root cause

| Mã | Mức | Phân loại | Quan sát | Source | Nguyên nhân / độ chắc chắn | Đề xuất tương lai |
|---|---|---|---|---|---|---|
| F01 | Cao | RUNTIME_CONFIGURATION_ERROR | Cake AI native không start; 11 operation direct connection failed, 8 API Gateway upstream 500; SQLSTATE 28P01 | [application.yml:7](../backend/cake-ai-service/src/main/resources/application.yml#L7) | PostgreSQL từ chối credential hiệu lực; duplicate khác nhau tồn tại nhưng chưa chứng minh assignment đầu hợp lệ | Owner rà soát mật khẩu thực của native instance và loại duplicate ở task được cho phép; không thêm dependency Maven |
| F02 | Cao | ENV_MAPPING_OR_SECRET_INJECTION | Bakery create/onboarding, entitlement/public profile, Owner discovery, Offer, Checkout, Chat và Subscription trả 503 | [application.yml:56](../backend/identity-service/src/main/resources/application.yml#L56); [application.yml:32](../backend/marketplace-service/src/main/resources/application.yml#L32) | Bakery/Subscription có plaintext nhưng issuer hash trống; Marketplace/Cake AI đọc SERVICE_CLIENT_SECRET không có alias; Order/Chat thiếu đúng tên secret/hash | Chuẩn hóa launcher native và tên property; provision đúng cặp client/hash, scope/audience theo source; không dùng token giả/bỏ auth |
| F03 | Cao | NATIVE_DEPENDENCY_UNAVAILABLE | MinIO 9000–9005 không listen; không có ảnh persist | [BakeryImageStorage.java:69](../backend/bakery-service/src/main/java/com/se193262/bakeryservice/infrastructure/storage/BakeryImageStorage.java#L69) | Không có native storage đã cài/chạy trong campaign; không được thay bằng container | Chuẩn bị native MinIO isolated khi được owner cho phép; xác minh upload/readback rồi publish |
| F04 | Trung bình | CONFIRMED_SOURCE_DEFECT | PNG hợp lệ ở logo/cover/add-on/product image trả 400 Image could not be read | [BakeryImageStorage.java:79](../backend/bakery-service/src/main/java/com/se193262/bakeryservice/infrastructure/storage/BakeryImageStorage.java#L79) | IOException từ storage/network nằm trong catch dành cho đọc file; nguồn catch xác nhận, chi tiết socket chỉ là suy luận phù hợp TCP vắng | Tách file decoding I/O khỏi storage I/O; downstream unavailable trả 503; thêm regression connection-refused |
| F05 | Trung bình | CONFIRMED_SOURCE_DEFECT | RFQ status INVALID; Offer status INVALID hoặc bakeryId invalid →500, direct lẫn Gateway | [CakeRequestServiceImpl.java:144](../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/CakeRequestServiceImpl.java#L144); [OfferServiceImpl.java:177](../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/offer/OfferServiceImpl.java#L177) | Enum/UUID parse bên trong JPA Specification bị bọc InvalidDataAccessApiUsageException; generic handler trả500, log có cause chính xác | Parse/validate filter trước repository, trả400 typed error; không blanket-map mọi DB exception thành400 |
| F06 | Trung bình | CONFIRMED_SOURCE_DEFECT | PUT /api/v1/auth/me với user JWT →500 thay405 | [GlobalExceptionHandler.java:70](../backend/identity-service/src/main/java/com/se193262/identityservice/exception/GlobalExceptionHandler.java#L70) | HttpRequestMethodNotSupportedException rơi generic catch; log xác nhận | Giữ405 và Allow header bằng handler hẹp; kiểm tra unknown route/media type liên quan |
| F07 | Trung bình | API_CONTRACT_OR_OPENAPI_DRIFT | 6 Swagger spec qua Gateway mất service prefix trong servers | [application.properties:63](../backend/api-gateway/src/main/resources/application.properties#L63) | Docs proxy gửi header nhưng native backend không áp dụng forwarded-prefix; generated server8080 thiếu prefix | Trong task cấu hình tương lai, cấu hình forwarded headers/trusted proxy hoặc server URL có prefix; retest Try it out |
| F08 | Trung bình | GATEWAY_FILTER_OR_REWRITE_DEFECT | OPTIONS Gateway origin được phép 200 nhưng không ACAO; direct200 có ACAO | [application.properties:16](../backend/api-gateway/src/main/resources/application.properties#L16) | Native Gateway chưa có CORS configuration hoặc preflight forwarding phù hợp; không suy luận origin lạ200 là bypass | Bổ sung policy origin cụ thể/credentials và kiểm thử browser preflight; không wildcard credentials |
| F09 | Trung bình | NATIVE_DEPENDENCY_UNAVAILABLE | Upstream Cake AI mất trả Gateway500 cả business/docs | [application.properties:41](../backend/api-gateway/src/main/resources/application.properties#L41) | Target8085 không listen; route đã đúng địa chỉ, không phải proof path rewrite sai | Khôi phục upstream trước; cân nhắc map lỗi upstream sang502/503 trong task khác |
| F10 | Trung bình | API_CONTRACT_OR_OPENAPI_DRIFT | Order không bearer scheme; Identity thiếu13 protected security annotation; VNPay callback docs yêu cầu bearer sai | [OrderController.java:1](../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/OrderController.java#L1); [AdminUserController.java:1](../backend/identity-service/src/main/java/com/se193262/identityservice/feature/user/AdminUserController.java#L1); [VnpayController.java:1](../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/payment/controller/VnpayController.java#L1) | Spec phản ánh thiếu/sai annotation; runtime authorization vẫn thực thi | Bổ sung OpenAPI security tương ứng contract thật, không đổi permission để khớp tài liệu sai |
| F11 | Thấp | RUNTIME_CONFIGURATION_ERROR | Bốn service không có Actuator JAR; YAML docs Bakery/Subscription bịdeny | [pom.xml:1](../backend/bakery-service/pom.xml#L1); [SecurityConfig.java:48](../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/security/SecurityConfig.java#L48) | Thiếu health capability và matcher YAML riêng; không gán unhealthy cho process chỉ vì401/403 | Task tương lai bổ sung health dependency/permit tối thiểu theo yêu cầu; YAML matcher chỉ khi cần |
| F12 | Cao nếu dùng cloud | ENV_MAPPING_OR_SECRET_INJECTION | FIREBASE_CREDENTIALS_FILE tồn tại nhưng native adapter không consume trực tiếp | [FirebaseStorageAdapter.java:33](../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/infrastructure/storage/FirebaseStorageAdapter.java#L33) | Adapter dùng ADC; launcher Docker cũ có thể map nhưng bị cấm trong task này; chỉ root env không đủ | Chuẩn hóa ADC native trong task được ủy quyền; sandbox isolated và tắt cleanup trước khi dùng DB audit |
| F13 | Trung bình | ENV_MAPPING_OR_SECRET_INJECTION | Hai biến DB sai cú pháp và hai duplicate trong root env | [application.yml:1](../backend/order-service/src/main/resources/application.yml#L1); root .env dòng58/64 (không chép giá trị) | Dotenv khác Java properties; order/chat hợp lệ không có trong env nhưng YAML có default; không phải nguyên nhân auth tất cả service | Sửa file ở task riêng có quyền; audit hiện tại chỉ từ chối entry sai và ghi fallback/default đã dùng |

Tái hiện F05: login synthetic CUSTOMER, GET direct `:8083/api/v1/cake-requests?status=INVALID`, sau đó `/marketplace/api/v1/cake-requests?status=INVALID`; HTTP-0409/0442 và repro HTTP-0630 cùng500. Log Marketplace ghi InvalidDataAccessApiUsageException → IllegalArgumentException tại CakeRequestServiceImpl:144. Offer tương tự HTTP-0573/0588/0631 và invalid UUID HTTP-0575/0590/0632. F06 HTTP-0572/0587 có log HttpRequestMethodNotSupportedException. Đây là lỗi source đã tái hiện, không quy cho thiếu env.

F02 có bằng chứng issuer trực tiếp, độc lập business API:

| Client | Biến secret thực | Root env | Hash issuer cần | HTTP | Evidence |
|---|---|---|---|---|---|
| bakery-service | BAKERY_CLIENT_SECRET | SET | BAKERY_CLIENT_SECRET_HASH | 401 | HTTP-0646 |
| subscription-service | SUBSCRIPTION_CLIENT_SECRET | SET | SUBSCRIPTION_CLIENT_SECRET_HASH | 401 | HTTP-0647 |
| marketplace-service | SERVICE_CLIENT_SECRET | ABSENT_OR_EMPTY | MARKETPLACE_CLIENT_SECRET_HASH | 400 | HTTP-0648 |
| cake-ai-service | SERVICE_CLIENT_SECRET | ABSENT_OR_EMPTY | CAKE_AI_CLIENT_SECRET_HASH | 400 | HTTP-0649 |
| order-service | ORDER_SERVICE_CLIENT_SECRET | ABSENT_OR_EMPTY | ORDER_CLIENT_SECRET_HASH | 400 | HTTP-0650 |
| chat-service | CHAT_SERVICE_CLIENT_SECRET | ABSENT_OR_EMPTY | CHAT_SERVICE_CLIENT_SECRET_HASH | 400 | HTTP-0651 |

Trái lại, dùng credential Marketplace/Cake AI thực đã có với đúng grant để gọi issuer trực tiếp được200 và truy cập internal scope đúng. Điều đó chứng minh issuer/key/JWT hoạt động cho cặp hợp lệ, không chứng minh native consumer đã nhận đúng secret. Các probe issuer 400/401 là từ chối đúng đối với cấu hình chưa provision, không phải lỗ hổng hay token endpoint hỏng.

## 27. Cấu hình, port, Gateway và Swagger

Mapping port đúng source và runtime cho sáu service; 8085 không listen vì startup failed, không đổi port để né. Gateway8080 đúng native JAR/PID mới build, không phải app khác. Route business và StripPrefix hoạt động với API thật của sáu service. Các lỗi503 của business vẫn xuất hiện direct nên không đổ cho Gateway. Docs thiếu prefix/CORS là vấn đề native configuration riêng. Upstream unavailable500 được phân biệt khỏi lỗi business500 của Marketplace/Identity.

Không ghi nhận build blocker Maven hiện tại. Google Storage/Auth resolve và compile; ApiResponse.accepted tồn tại trong shared source được Cake AI compile sử dụng, không lặp lại kết luận cũ rằng thiếu method. Phiên bản Google SDK giữa Marketplace và Cake AI khác nhau trong executable JAR riêng, không phải tự động là classpath conflict.

`ddl-auto=update` trong cả bảy YAML là thay đổi đã có trước audit. Mọi Java chạy với DB audit để không mutate schema cũ; đây không phải đề xuất dùng update trên Production. Scheduler Marketplace có cloud orphan cleanup mặc định bật, vì vậy runtime audit bị giới hạn dưới một giờ và không inject ADC. Không để nó chạy lâu với DB audit đối chiếu bucket dùng chung.

## 28. Operation chưa có happy path và lý do

| ID | Operation | Terminal | Điều kiện còn thiếu |
|---|---|---|---|
| API-018 | identity-service GET /internal/v1/users/{id} | NOT_EXPOSED_BY_DESIGN | Direct hợp lệ thiếu credential/fixture; không có route Gateway theo thiết kế |
| API-019 | identity-service PUT /internal/v1/users/{id}/bakery-owner | NOT_EXPOSED_BY_DESIGN | Direct hợp lệ thiếu credential/fixture; không có route Gateway theo thiết kế |
| API-020 | identity-service GET /internal/v1/users/{userId}/addresses/{addressId} | NOT_EXPOSED_BY_DESIGN | Direct hợp lệ thiếu credential/fixture; không có route Gateway theo thiết kế |
| API-026 | bakery-service POST /api/v1/bakeries/{bakeryId}/add-ons/{addOnId}/image | FAIL_DIRECT | F04: xem chẩn đoán; có lỗi/thiếu cấu hình trong ít nhất một scenario |
| API-030 | bakery-service POST /api/v1/bakeries | FAIL_DIRECT | F02: xem chẩn đoán; có lỗi/thiếu cấu hình trong ít nhất một scenario |
| API-034 | bakery-service POST /api/v1/bakeries/{bakeryId}/logo | FAIL_DIRECT | F04: xem chẩn đoán; có lỗi/thiếu cấu hình trong ít nhất một scenario |
| API-035 | bakery-service POST /api/v1/bakeries/{bakeryId}/cover | FAIL_DIRECT | F04: xem chẩn đoán; có lỗi/thiếu cấu hình trong ít nhất một scenario |
| API-037 | bakery-service POST /api/v1/bakeries/onboarding | FAIL_DIRECT | F02: xem chẩn đoán; có lỗi/thiếu cấu hình trong ít nhất một scenario |
| API-038 | bakery-service POST /api/v1/bakeries/{bakeryId}/onboarding/complete | FAIL_DIRECT | F02: xem chẩn đoán; có lỗi/thiếu cấu hình trong ít nhất một scenario |
| API-039 | bakery-service PUT /internal/v1/bakeries/{bakeryId}/onboarding/activate | NOT_EXPOSED_BY_DESIGN | Direct hợp lệ thiếu credential/fixture; không có route Gateway theo thiết kế |
| API-043 | bakery-service GET /api/v1/bakeries/{bakeryId} | FAIL_DIRECT | F02: xem chẩn đoán; có lỗi/thiếu cấu hình trong ít nhất một scenario |
| API-045 | bakery-service POST /internal/v1/catalog/customization-quotes | NOT_EXPOSED_BY_DESIGN | Direct hợp lệ thiếu credential/fixture; không có route Gateway theo thiết kế |
| API-046 | bakery-service POST /internal/v1/catalog/add-on-quotes | NOT_EXPOSED_BY_DESIGN | Direct hợp lệ thiếu credential/fixture; không có route Gateway theo thiết kế |
| API-047 | bakery-service POST /internal/v1/catalog/quotes | NOT_EXPOSED_BY_DESIGN | Direct hợp lệ thiếu credential/fixture; không có route Gateway theo thiết kế |
| API-057 | bakery-service POST /api/v1/bakeries/{bakeryId}/products/{productId}/images | FAIL_DIRECT | F04: xem chẩn đoán; có lỗi/thiếu cấu hình trong ít nhất một scenario |
| API-058 | bakery-service DELETE /api/v1/bakeries/{bakeryId}/products/{productId}/images/{imageId} | BLOCKED_MISSING_LOCAL_DB_OR_STORAGE | Thiếu ảnh primary/native MinIO; chưa có điều kiện publish/imageId hợp lệ |
| API-059 | bakery-service POST /api/v1/bakeries/{bakeryId}/products/{productId}/publish | BLOCKED_MISSING_LOCAL_DB_OR_STORAGE | Thiếu ảnh primary/native MinIO; chưa có điều kiện publish/imageId hợp lệ |
| API-060 | bakery-service POST /api/v1/bakeries/{bakeryId}/products/{productId}/hide | BLOCKED_MISSING_LOCAL_DB_OR_STORAGE | Thiếu ảnh primary/native MinIO; chưa có điều kiện publish/imageId hợp lệ |
| API-063 | bakery-service GET /api/v1/products/{productId} | BLOCKED_MISSING_LOCAL_DB_OR_STORAGE | Thiếu ảnh primary/native MinIO; chưa có điều kiện publish/imageId hợp lệ |
| API-070 | marketplace-service PUT /api/v1/cake-requests/{id}/selected-design | BLOCKED_EXTERNAL_PROVIDER_OR_COST | Không được upload cloud/gọi provider hoặc chưa có thiết kế/giao dịch thật; chỉ negative an toàn |
| API-071 | marketplace-service POST /api/v1/cake-requests/{id}/images | BLOCKED_EXTERNAL_PROVIDER_OR_COST | Không được upload cloud/gọi provider hoặc chưa có thiết kế/giao dịch thật; chỉ negative an toàn |
| API-072 | marketplace-service DELETE /api/v1/cake-requests/{id}/images/{imageId} | BLOCKED_EXTERNAL_PROVIDER_OR_COST | Không được upload cloud/gọi provider hoặc chưa có thiết kế/giao dịch thật; chỉ negative an toàn |
| API-074 | marketplace-service GET /internal/v1/cake-requests/{id}/chat-authorization | NOT_EXPOSED_BY_DESIGN | Direct hợp lệ thiếu credential/fixture; không có route Gateway theo thiết kế |
| API-075 | marketplace-service GET /internal/v1/offers/{id}/order-source | NOT_EXPOSED_BY_DESIGN | Direct hợp lệ thiếu credential/fixture; không có route Gateway theo thiết kế |
| API-077 | marketplace-service GET /api/v1/offers/{id} | PASS_EXPECTED_NEGATIVE_ONLY | Chỉ xác minh từ chối truy cập/validation; happy path BLOCKED_AUTH_OR_TEST_FIXTURE |
| API-078 | marketplace-service POST /api/v1/cake-requests/{id}/offers | FAIL_DIRECT | F02: xem chẩn đoán; có lỗi/thiếu cấu hình trong ít nhất một scenario |
| API-079 | marketplace-service PATCH /api/v1/offers/{id} | PASS_EXPECTED_NEGATIVE_ONLY | Chỉ xác minh từ chối truy cập/validation; happy path BLOCKED_AUTH_OR_TEST_FIXTURE |
| API-080 | marketplace-service POST /api/v1/offers/{id}/withdraw | PASS_EXPECTED_NEGATIVE_ONLY | Chỉ xác minh từ chối truy cập/validation; happy path BLOCKED_AUTH_OR_TEST_FIXTURE |
| API-081 | marketplace-service POST /api/v1/offers/{id}/accept | PASS_EXPECTED_NEGATIVE_ONLY | Chỉ xác minh từ chối truy cập/validation; happy path BLOCKED_AUTH_OR_TEST_FIXTURE |
| API-083 | subscription-service POST /api/v1/admin/bakery-payments/{paymentId}/approve | PASS_EXPECTED_NEGATIVE_ONLY | Chỉ xác minh từ chối truy cập/validation; happy path BLOCKED_AUTH_OR_TEST_FIXTURE |
| API-084 | subscription-service POST /api/v1/admin/bakery-payments/{paymentId}/reject | PASS_EXPECTED_NEGATIVE_ONLY | Chỉ xác minh từ chối truy cập/validation; happy path BLOCKED_AUTH_OR_TEST_FIXTURE |
| API-085 | subscription-service POST /api/v1/subscription-orders/{orderId}/payments | PASS_EXPECTED_NEGATIVE_ONLY | Chỉ xác minh từ chối truy cập/validation; happy path BLOCKED_AUTH_OR_TEST_FIXTURE |
| API-087 | subscription-service POST /api/v1/subscription-orders/{orderId}/vnpay/checkout | PASS_EXPECTED_NEGATIVE_ONLY | Chỉ xác minh từ chối truy cập/validation; happy path BLOCKED_AUTH_OR_TEST_FIXTURE |
| API-088 | subscription-service GET /api/v1/payments/vnpay/ipn | BLOCKED_EXTERNAL_PROVIDER_OR_COST | Không được upload cloud/gọi provider hoặc chưa có thiết kế/giao dịch thật; chỉ negative an toàn |
| API-089 | subscription-service GET /api/v1/payments/vnpay/return | BLOCKED_EXTERNAL_PROVIDER_OR_COST | Không được upload cloud/gọi provider hoặc chưa có thiết kế/giao dịch thật; chỉ negative an toàn |
| API-097 | subscription-service GET /api/v1/bakeries/{bakeryId}/subscription | FAIL_DIRECT | F02: xem chẩn đoán; có lỗi/thiếu cấu hình trong ít nhất một scenario |
| API-100 | subscription-service POST /api/v1/bakeries/{bakeryId}/subscription-orders | FAIL_DIRECT | F02: xem chẩn đoán; có lỗi/thiếu cấu hình trong ít nhất một scenario |
| API-101 | subscription-service GET /api/v1/bakeries/{bakeryId}/subscription-orders | FAIL_DIRECT | F02: xem chẩn đoán; có lỗi/thiếu cấu hình trong ít nhất một scenario |
| API-102 | subscription-service GET /api/v1/subscription-orders/{orderId} | PASS_EXPECTED_NEGATIVE_ONLY | Chỉ xác minh từ chối truy cập/validation; happy path BLOCKED_AUTH_OR_TEST_FIXTURE |
| API-103 | cake-ai-service GET /api/v1/generated-designs/{id} | BLOCKED_AUTH_OR_TEST_FIXTURE | F01: PostgreSQL authentication failed; Gateway upstream 500; chưa kiểm chứng handler |
| API-104 | cake-ai-service GET /api/v1/admin/generated-designs | BLOCKED_AUTH_OR_TEST_FIXTURE | F01: PostgreSQL authentication failed; Gateway upstream 500; chưa kiểm chứng handler |
| API-105 | cake-ai-service PATCH /api/v1/admin/generated-designs/{id}/moderation | BLOCKED_AUTH_OR_TEST_FIXTURE | F01: PostgreSQL authentication failed; Gateway upstream 500; chưa kiểm chứng handler |
| API-106 | cake-ai-service GET /internal/v1/generated-designs/{id}/validation | BLOCKED_AUTH_OR_TEST_FIXTURE | F01: PostgreSQL authentication failed; Gateway upstream 500; chưa kiểm chứng handler |
| API-107 | cake-ai-service GET /internal/v1/cake-requests/{id}/generation-context | BLOCKED_AUTH_OR_TEST_FIXTURE | F01: PostgreSQL authentication failed; Gateway upstream 500; chưa kiểm chứng handler |
| API-108 | cake-ai-service GET /storage/** | BLOCKED_AUTH_OR_TEST_FIXTURE | F01: PostgreSQL authentication failed; Gateway upstream 500; chưa kiểm chứng handler |
| API-109 | cake-ai-service POST /api/v1/generation-jobs | BLOCKED_AUTH_OR_TEST_FIXTURE | F01: PostgreSQL authentication failed; Gateway upstream 500; chưa kiểm chứng handler |
| API-110 | cake-ai-service GET /api/v1/generation-jobs | BLOCKED_AUTH_OR_TEST_FIXTURE | F01: PostgreSQL authentication failed; Gateway upstream 500; chưa kiểm chứng handler |
| API-111 | cake-ai-service GET /api/v1/generation-jobs/{id} | BLOCKED_AUTH_OR_TEST_FIXTURE | F01: PostgreSQL authentication failed; Gateway upstream 500; chưa kiểm chứng handler |
| API-112 | cake-ai-service POST /api/v1/generation-jobs/{id}/prompt-revisions | BLOCKED_AUTH_OR_TEST_FIXTURE | F01: PostgreSQL authentication failed; Gateway upstream 500; chưa kiểm chứng handler |
| API-113 | cake-ai-service POST /api/v1/generation-jobs/{id}/cancel | BLOCKED_AUTH_OR_TEST_FIXTURE | F01: PostgreSQL authentication failed; Gateway upstream 500; chưa kiểm chứng handler |
| API-114 | order-service GET /internal/v1/orders/{orderId}/context | NOT_EXPOSED_BY_DESIGN | Direct hợp lệ thiếu credential/fixture; không có route Gateway theo thiết kế |
| API-115 | order-service POST /internal/v1/orders/from-offer | NOT_EXPOSED_BY_DESIGN | Direct hợp lệ thiếu credential/fixture; không có route Gateway theo thiết kế |
| API-116 | order-service POST /api/v1/orders/direct | FAIL_DIRECT | F02: xem chẩn đoán; có lỗi/thiếu cấu hình trong ít nhất một scenario |
| API-118 | order-service GET /api/v1/orders/{orderId} | PASS_EXPECTED_NEGATIVE_ONLY | Chỉ xác minh từ chối truy cập/validation; happy path BLOCKED_AUTH_OR_TEST_FIXTURE |
| API-119 | order-service POST /api/v1/orders/{orderId}/status-transitions | PASS_EXPECTED_NEGATIVE_ONLY | Chỉ xác minh từ chối truy cập/validation; happy path BLOCKED_AUTH_OR_TEST_FIXTURE |
| API-120 | order-service POST /api/v1/orders/{orderId}/review | PASS_EXPECTED_NEGATIVE_ONLY | Chỉ xác minh từ chối truy cập/validation; happy path BLOCKED_AUTH_OR_TEST_FIXTURE |
| API-121 | order-service PATCH /api/v1/orders/{orderId}/review | PASS_EXPECTED_NEGATIVE_ONLY | Chỉ xác minh từ chối truy cập/validation; happy path BLOCKED_AUTH_OR_TEST_FIXTURE |
| API-122 | order-service DELETE /api/v1/orders/{orderId}/review | PASS_EXPECTED_NEGATIVE_ONLY | Chỉ xác minh từ chối truy cập/validation; happy path BLOCKED_AUTH_OR_TEST_FIXTURE |
| API-123 | order-service PATCH /api/v1/admin/reviews/{orderId}/status | PASS_EXPECTED_NEGATIVE_ONLY | Chỉ xác minh từ chối truy cập/validation; happy path BLOCKED_AUTH_OR_TEST_FIXTURE |
| API-125 | chat-service POST /api/v1/conversations | FAIL_DIRECT | F02: xem chẩn đoán; có lỗi/thiếu cấu hình trong ít nhất một scenario |
| API-126 | chat-service GET /api/v1/conversations/{conversationId} | PASS_EXPECTED_NEGATIVE_ONLY | Chỉ xác minh từ chối truy cập/validation; happy path BLOCKED_AUTH_OR_TEST_FIXTURE |
| API-127 | chat-service POST /api/v1/conversations/{conversationId}/close | PASS_EXPECTED_NEGATIVE_ONLY | Chỉ xác minh từ chối truy cập/validation; happy path BLOCKED_AUTH_OR_TEST_FIXTURE |
| API-128 | chat-service GET /api/v1/conversations/{conversationId}/messages | PASS_EXPECTED_NEGATIVE_ONLY | Chỉ xác minh từ chối truy cập/validation; happy path BLOCKED_AUTH_OR_TEST_FIXTURE |
| API-129 | chat-service POST /api/v1/conversations/{conversationId}/messages | PASS_EXPECTED_NEGATIVE_ONLY | Chỉ xác minh từ chối truy cập/validation; happy path BLOCKED_AUTH_OR_TEST_FIXTURE |
| API-130 | chat-service POST /api/v1/conversations/{conversationId}/read | PASS_EXPECTED_NEGATIVE_ONLY | Chỉ xác minh từ chối truy cập/validation; happy path BLOCKED_AUTH_OR_TEST_FIXTURE |
| API-131 | chat-service DELETE /api/v1/conversations/{conversationId}/messages/{messageId} | PASS_EXPECTED_NEGATIVE_ONLY | Chỉ xác minh từ chối truy cập/validation; happy path BLOCKED_AUTH_OR_TEST_FIXTURE |

Tất cả131 operation đã có direct HTTP attempt, nhưng Cake AI chỉ connection failure và nhiều route chỉ bị security chặn trước controller. Tất cả110 route eligible đã được gửi Gateway probe, không đồng nghĩa happy path đầy đủ. Internal User/address/grant thiếu credential phù hợp; không lấy private key để ký token tự chế. Order/Review/Offer/Message còn thiếu entity được tạo hợp lệ bằng business API. Không seed các entity đó hoặc gọi cloud/payment chỉ để tăng tỷ lệ xanh. Negative PASS được tách rõ khỏi happy path.

## 29. Hướng sửa theo ưu tiên — chỉ là đề xuất

1. Chuẩn hóa dotenv/native launcher và cặp internal client secret/hash theo F01/F02/F13, không bỏ xác thực. Xác minh từng issuer request và từng service consumer; không chia sẻ một secret chung cho các identity khác nhau nếu không có lý do kiến trúc.
2. Chuẩn bị native object storage riêng và cấu hình ADC sandbox được phê duyệt; tuyệt đối không đối chiếu cloud bucket dùng chung với database audit. Kiểm thử upload/readback/rollback trước publish, checkout và AI.
3. Sửa F04/F05/F06 bằng handler/validation hẹp; không sửa logic business để biến422/409 hợp lệ thành200. Thêm test regression cho exception wrapper/network và HTTP method.
4. Đồng bộ Swagger forwarded-prefix, security scheme/requirements và Gateway CORS native; kiểm tra Try it out với một protected API mỗi service, cookie path và multipart.
5. Sau khi mọi dependency/token pass, chạy lại năm journey bằng fixtures API thật, concurrency/idempotency, persistence readback và ownership. Chỉ xin phí Gemini/cloud theo ngân sách cho execution tương lai; không dùng phê duyệt cũ.
6. Đánh giá health/readiness cho bốn service còn thiếu và tích hợp test PostgreSQL native riêng trong task được phép sửa; hiện không đổi Testcontainers sang fake provider/H2.

Các vị trí source/line trong F01–F13 và bảng operation là đề xuất cho task sau. Không nội dung nào đã được áp dụng vào source/config trong audit này.

## 30. Ma trận terminal của toàn bộ API

| Terminal | Số operation |
|---|---|
| NOT_EXPOSED_BY_DESIGN | 18 |
| PASS_DIRECT_AND_GATEWAY | 54 |
| FAIL_DIRECT | 18 |
| BLOCKED_MISSING_LOCAL_DB_OR_STORAGE | 4 |
| BLOCKED_EXTERNAL_PROVIDER_OR_COST | 5 |
| PASS_EXPECTED_NEGATIVE_ONLY | 21 |
| BLOCKED_AUTH_OR_TEST_FIXTURE | 11 |

Mỗi operation đúng một terminal classification. `NOT_EXPOSED_BY_DESIGN` mô tả Gateway không expose; cột direct-positive vẫn thể hiện test direct nếu có. Với ba route Cake AI không expose, startup blocker được ưu tiên terminal BLOCKED.

| ID | Service | Method / path | Direct happy path | Gateway happy path | Terminal | Evidence IDs |
|---|---|---|---|---|---|---|
| API-001 | identity-service | GET /.well-known/jwks.json | True | Không eligible | NOT_EXPOSED_BY_DESIGN | HTTP-0011 |
| API-002 | identity-service | GET /api/v1/users/me/addresses | True | True | PASS_DIRECT_AND_GATEWAY | HTTP-0013, HTTP-0029, HTTP-0119, HTTP-0120, HTTP-0600, HTTP-0601 |
| API-003 | identity-service | GET /api/v1/users/me/addresses/{id} | True | True | PASS_DIRECT_AND_GATEWAY | HTTP-0048, HTTP-0051, HTTP-0052, HTTP-0055, HTTP-0121, HTTP-0122, HTTP-0431, HTTP-0464 |
| API-004 | identity-service | POST /api/v1/users/me/addresses | True | True | PASS_DIRECT_AND_GATEWAY | HTTP-0044, HTTP-0046, HTTP-0123, HTTP-0124, HTTP-0500, HTTP-0541 |
| API-005 | identity-service | PATCH /api/v1/users/me/addresses/{id} | True | True | PASS_DIRECT_AND_GATEWAY | HTTP-0049, HTTP-0053, HTTP-0125, HTTP-0126 |
| API-006 | identity-service | PUT /api/v1/users/me/addresses/{id}/default | True | True | PASS_DIRECT_AND_GATEWAY | HTTP-0050, HTTP-0054, HTTP-0127, HTTP-0128 |
| API-007 | identity-service | DELETE /api/v1/users/me/addresses/{id} | True | True | PASS_DIRECT_AND_GATEWAY | HTTP-0129, HTTP-0130, HTTP-0430, HTTP-0463 |
| API-008 | identity-service | POST /api/v1/auth/register | True | True | PASS_DIRECT_AND_GATEWAY | HTTP-0001, HTTP-0002, HTTP-0003, HTTP-0004, HTTP-0131, HTTP-0132, HTTP-0405, HTTP-0406, HTTP-0438, HTTP-0439 |
| API-009 | identity-service | POST /api/v1/auth/login | True | True | PASS_DIRECT_AND_GATEWAY | HTTP-0005, HTTP-0007, HTTP-0008, HTTP-0009, HTTP-0010, HTTP-0092, HTTP-0093, HTTP-0115, HTTP-0116, HTTP-0117, HTTP-0118, HTTP-0133, HTTP-0134, HTTP-0426, HTTP-0459, HTTP-0474, HTTP-0475, HTTP-0476, HTTP-0477, HTTP-0560, HTTP-0561, HTTP-0562, HTTP-0563, HTTP-0564, HTTP-0568, HTTP-0579, HTTP-0583, HTTP-0594, HTTP-0595, HTTP-0596, HTTP-0597, HTTP-0652, HTTP-0653, HTTP-0656 |
| API-010 | identity-service | POST /api/v1/auth/refresh | True | True | PASS_DIRECT_AND_GATEWAY | HTTP-0135, HTTP-0136, HTTP-0427, HTTP-0429, HTTP-0460, HTTP-0462, HTTP-0565, HTTP-0566, HTTP-0567, HTTP-0570, HTTP-0580, HTTP-0581, HTTP-0582, HTTP-0585 |
| API-011 | identity-service | POST /api/v1/auth/logout | True | True | PASS_DIRECT_AND_GATEWAY | HTTP-0137, HTTP-0138, HTTP-0428, HTTP-0461, HTTP-0569, HTTP-0584 |
| API-012 | identity-service | GET /api/v1/auth/me | True | True | PASS_DIRECT_AND_GATEWAY | HTTP-0012, HTTP-0028, HTTP-0139, HTTP-0140, HTTP-0407, HTTP-0440, HTTP-0571, HTTP-0586, HTTP-0598, HTTP-0599, HTTP-0659, HTTP-0660 |
| API-013 | identity-service | POST /internal/v1/auth/service-token | True | Không eligible | NOT_EXPOSED_BY_DESIGN | HTTP-0141, HTTP-0397, HTTP-0398, HTTP-0399, HTTP-0400, HTTP-0633, HTTP-0638, HTTP-0644, HTTP-0646, HTTP-0647, HTTP-0648, HTTP-0649, HTTP-0650, HTTP-0651 |
| API-014 | identity-service | GET /api/v1/admin/users | True | True | PASS_DIRECT_AND_GATEWAY | HTTP-0014, HTTP-0030, HTTP-0059, HTTP-0063, HTTP-0144, HTTP-0145, HTTP-0417, HTTP-0450 |
| API-015 | identity-service | GET /api/v1/admin/users/{userId} | True | True | PASS_DIRECT_AND_GATEWAY | HTTP-0056, HTTP-0060, HTTP-0146, HTTP-0147, HTTP-0418, HTTP-0451, HTTP-0602, HTTP-0603 |
| API-016 | identity-service | PATCH /api/v1/admin/users/{userId}/status | True | True | PASS_DIRECT_AND_GATEWAY | HTTP-0057, HTTP-0058, HTTP-0061, HTTP-0062, HTTP-0148, HTTP-0149 |
| API-017 | identity-service | PUT /api/v1/admin/users/{userId}/roles | True | True | PASS_DIRECT_AND_GATEWAY | HTTP-0006, HTTP-0150, HTTP-0151, HTTP-0654, HTTP-0655 |
| API-018 | identity-service | GET /internal/v1/users/{id} | False | Không eligible | NOT_EXPOSED_BY_DESIGN | HTTP-0152 |
| API-019 | identity-service | PUT /internal/v1/users/{id}/bakery-owner | False | Không eligible | NOT_EXPOSED_BY_DESIGN | HTTP-0155 |
| API-020 | identity-service | GET /internal/v1/users/{userId}/addresses/{addressId} | False | Không eligible | NOT_EXPOSED_BY_DESIGN | HTTP-0158 |
| API-021 | identity-service | PATCH /api/v1/users/me | True | True | PASS_DIRECT_AND_GATEWAY | HTTP-0045, HTTP-0047, HTTP-0161, HTTP-0162, HTTP-0576, HTTP-0591 |
| API-022 | bakery-service | GET /api/v1/bakeries/{bakeryId}/add-ons | True | True | PASS_DIRECT_AND_GATEWAY | HTTP-0163, HTTP-0164, HTTP-0489, HTTP-0530 |
| API-023 | bakery-service | POST /api/v1/bakeries/{bakeryId}/add-ons | True | True | PASS_DIRECT_AND_GATEWAY | HTTP-0165, HTTP-0166, HTTP-0488, HTTP-0529 |
| API-024 | bakery-service | PATCH /api/v1/bakeries/{bakeryId}/add-ons/{addOnId} | True | True | PASS_DIRECT_AND_GATEWAY | HTTP-0167, HTTP-0168, HTTP-0490, HTTP-0531 |
| API-025 | bakery-service | DELETE /api/v1/bakeries/{bakeryId}/add-ons/{addOnId} | True | True | PASS_DIRECT_AND_GATEWAY | HTTP-0169, HTTP-0170, HTTP-0518, HTTP-0559 |
| API-026 | bakery-service | POST /api/v1/bakeries/{bakeryId}/add-ons/{addOnId}/image | False | False | FAIL_DIRECT | HTTP-0171, HTTP-0172, HTTP-0491, HTTP-0532 |
| API-027 | bakery-service | GET /api/v1/admin/bakeries | True | True | PASS_DIRECT_AND_GATEWAY | HTTP-0017, HTTP-0033, HTTP-0173, HTTP-0174, HTTP-0419, HTTP-0452, HTTP-0608, HTTP-0609 |
| API-028 | bakery-service | GET /api/v1/admin/bakeries/{bakeryId} | True | True | PASS_DIRECT_AND_GATEWAY | HTTP-0175, HTTP-0176, HTTP-0420, HTTP-0453, HTTP-0481, HTTP-0522 |
| API-029 | bakery-service | PATCH /api/v1/admin/bakeries/{bakeryId}/status | True | True | PASS_DIRECT_AND_GATEWAY | HTTP-0177, HTTP-0178, HTTP-0483, HTTP-0524 |
| API-030 | bakery-service | POST /api/v1/bakeries | False | False | FAIL_DIRECT | HTTP-0080, HTTP-0083, HTTP-0179, HTTP-0180 |
| API-031 | bakery-service | PATCH /api/v1/bakeries/{bakeryId} | True | True | PASS_DIRECT_AND_GATEWAY | HTTP-0181, HTTP-0182, HTTP-0478, HTTP-0519 |
| API-032 | bakery-service | PUT /api/v1/bakeries/{bakeryId}/operations | True | True | PASS_DIRECT_AND_GATEWAY | HTTP-0183, HTTP-0184, HTTP-0479, HTTP-0520 |
| API-033 | bakery-service | POST /api/v1/bakeries/{bakeryId}/submit-for-approval | True | True | PASS_DIRECT_AND_GATEWAY | HTTP-0185, HTTP-0186, HTTP-0482, HTTP-0523 |
| API-034 | bakery-service | POST /api/v1/bakeries/{bakeryId}/logo | False | False | FAIL_DIRECT | HTTP-0187, HTTP-0188, HTTP-0503, HTTP-0544 |
| API-035 | bakery-service | POST /api/v1/bakeries/{bakeryId}/cover | False | False | FAIL_DIRECT | HTTP-0189, HTTP-0190, HTTP-0504, HTTP-0545 |
| API-036 | bakery-service | GET /api/v1/bakeries/onboarding | True | True | PASS_DIRECT_AND_GATEWAY | HTTP-0081, HTTP-0084, HTTP-0191, HTTP-0192, HTTP-0507, HTTP-0548 |
| API-037 | bakery-service | POST /api/v1/bakeries/onboarding | False | False | FAIL_DIRECT | HTTP-0082, HTTP-0085, HTTP-0193, HTTP-0194 |
| API-038 | bakery-service | POST /api/v1/bakeries/{bakeryId}/onboarding/complete | False | False | FAIL_DIRECT | HTTP-0195, HTTP-0196, HTTP-0508, HTTP-0549 |
| API-039 | bakery-service | PUT /internal/v1/bakeries/{bakeryId}/onboarding/activate | False | Không eligible | NOT_EXPOSED_BY_DESIGN | HTTP-0197 |
| API-040 | bakery-service | GET /internal/v1/bakeries/{bakeryId} | True | Không eligible | NOT_EXPOSED_BY_DESIGN | HTTP-0200, HTTP-0639 |
| API-041 | bakery-service | GET /internal/v1/bakeries/{bakeryId}/members/{userId}/authorization | True | Không eligible | NOT_EXPOSED_BY_DESIGN | HTTP-0203, HTTP-0640 |
| API-042 | bakery-service | GET /api/v1/bakeries | True | True | FAIL_DIRECT | HTTP-0015, HTTP-0031, HTTP-0206, HTTP-0207, HTTP-0408, HTTP-0441, HTTP-0604, HTTP-0605 |
| API-043 | bakery-service | GET /api/v1/bakeries/{bakeryId} | False | False | FAIL_DIRECT | HTTP-0208, HTTP-0209, HTTP-0484, HTTP-0525 |
| API-044 | bakery-service | GET /internal/v1/users/{userId}/bakery-memberships | True | Không eligible | NOT_EXPOSED_BY_DESIGN | HTTP-0210, HTTP-0401 |
| API-045 | bakery-service | POST /internal/v1/catalog/customization-quotes | False | Không eligible | NOT_EXPOSED_BY_DESIGN | HTTP-0213, HTTP-0642 |
| API-046 | bakery-service | POST /internal/v1/catalog/add-on-quotes | False | Không eligible | NOT_EXPOSED_BY_DESIGN | HTTP-0216, HTTP-0643 |
| API-047 | bakery-service | POST /internal/v1/catalog/quotes | False | Không eligible | NOT_EXPOSED_BY_DESIGN | HTTP-0219, HTTP-0641 |
| API-048 | bakery-service | GET /api/v1/bakeries/{bakeryId}/categories | True | True | PASS_DIRECT_AND_GATEWAY | HTTP-0222, HTTP-0223, HTTP-0485, HTTP-0526 |
| API-049 | bakery-service | POST /api/v1/bakeries/{bakeryId}/categories | True | True | PASS_DIRECT_AND_GATEWAY | HTTP-0224, HTTP-0225, HTTP-0486, HTTP-0527 |
| API-050 | bakery-service | PATCH /api/v1/bakeries/{bakeryId}/categories/{categoryId} | True | True | PASS_DIRECT_AND_GATEWAY | HTTP-0226, HTTP-0227, HTTP-0487, HTTP-0528 |
| API-051 | bakery-service | DELETE /api/v1/bakeries/{bakeryId}/categories/{categoryId} | True | True | PASS_DIRECT_AND_GATEWAY | HTTP-0228, HTTP-0229, HTTP-0517, HTTP-0558 |
| API-052 | bakery-service | GET /api/v1/bakeries/{bakeryId}/members | True | True | PASS_DIRECT_AND_GATEWAY | HTTP-0230, HTTP-0231, HTTP-0480, HTTP-0505, HTTP-0506, HTTP-0521, HTTP-0546, HTTP-0547, HTTP-0612, HTTP-0613, HTTP-0657, HTTP-0658 |
| API-053 | bakery-service | GET /api/v1/bakeries/{bakeryId}/products | True | True | PASS_DIRECT_AND_GATEWAY | HTTP-0232, HTTP-0233, HTTP-0494, HTTP-0535, HTTP-0610, HTTP-0611 |
| API-054 | bakery-service | POST /api/v1/bakeries/{bakeryId}/products | True | True | PASS_DIRECT_AND_GATEWAY | HTTP-0234, HTTP-0235, HTTP-0492, HTTP-0533 |
| API-055 | bakery-service | PATCH /api/v1/bakeries/{bakeryId}/products/{productId} | True | True | PASS_DIRECT_AND_GATEWAY | HTTP-0236, HTTP-0237, HTTP-0493, HTTP-0534 |
| API-056 | bakery-service | PUT /api/v1/bakeries/{bakeryId}/products/{productId}/options | True | True | PASS_DIRECT_AND_GATEWAY | HTTP-0238, HTTP-0239, HTTP-0495, HTTP-0536 |
| API-057 | bakery-service | POST /api/v1/bakeries/{bakeryId}/products/{productId}/images | False | False | FAIL_DIRECT | HTTP-0240, HTTP-0241, HTTP-0496, HTTP-0537 |
| API-058 | bakery-service | DELETE /api/v1/bakeries/{bakeryId}/products/{productId}/images/{imageId} | False | False | BLOCKED_MISSING_LOCAL_DB_OR_STORAGE | HTTP-0242, HTTP-0243 |
| API-059 | bakery-service | POST /api/v1/bakeries/{bakeryId}/products/{productId}/publish | False | False | BLOCKED_MISSING_LOCAL_DB_OR_STORAGE | HTTP-0244, HTTP-0245, HTTP-0497, HTTP-0538 |
| API-060 | bakery-service | POST /api/v1/bakeries/{bakeryId}/products/{productId}/hide | False | False | BLOCKED_MISSING_LOCAL_DB_OR_STORAGE | HTTP-0246, HTTP-0247, HTTP-0498, HTTP-0539 |
| API-061 | bakery-service | POST /api/v1/bakeries/{bakeryId}/products/{productId}/archive | True | True | PASS_DIRECT_AND_GATEWAY | HTTP-0248, HTTP-0249, HTTP-0502, HTTP-0543 |
| API-062 | bakery-service | GET /api/v1/products | True | True | PASS_DIRECT_AND_GATEWAY | HTTP-0016, HTTP-0032, HTTP-0250, HTTP-0251, HTTP-0606, HTTP-0607 |
| API-063 | bakery-service | GET /api/v1/products/{productId} | False | False | BLOCKED_MISSING_LOCAL_DB_OR_STORAGE | HTTP-0252, HTTP-0253, HTTP-0499, HTTP-0540 |
| API-064 | marketplace-service | GET /api/v1/cake-requests | True | True | FAIL_DIRECT | HTTP-0018, HTTP-0034, HTTP-0254, HTTP-0255, HTTP-0409, HTTP-0412, HTTP-0442, HTTP-0445, HTTP-0574, HTTP-0589, HTTP-0616, HTTP-0617, HTTP-0630, HTTP-0637 |
| API-065 | marketplace-service | GET /api/v1/cake-requests/{id} | True | True | PASS_DIRECT_AND_GATEWAY | HTTP-0071, HTTP-0073, HTTP-0076, HTTP-0078, HTTP-0256, HTTP-0257, HTTP-0435, HTTP-0468, HTTP-0614, HTTP-0615 |
| API-066 | marketplace-service | POST /api/v1/cake-requests | True | True | PASS_DIRECT_AND_GATEWAY | HTTP-0070, HTTP-0075, HTTP-0258, HTTP-0259, HTTP-0512, HTTP-0553 |
| API-067 | marketplace-service | PATCH /api/v1/cake-requests/{id} | True | True | PASS_DIRECT_AND_GATEWAY | HTTP-0072, HTTP-0077, HTTP-0260, HTTP-0261 |
| API-068 | marketplace-service | POST /api/v1/cake-requests/{id}/publish | True | True | PASS_DIRECT_AND_GATEWAY | HTTP-0074, HTTP-0079, HTTP-0262, HTTP-0263, HTTP-0514, HTTP-0555 |
| API-069 | marketplace-service | POST /api/v1/cake-requests/{id}/cancel | True | True | PASS_DIRECT_AND_GATEWAY | HTTP-0264, HTTP-0265, HTTP-0434, HTTP-0467 |
| API-070 | marketplace-service | PUT /api/v1/cake-requests/{id}/selected-design | False | False | BLOCKED_EXTERNAL_PROVIDER_OR_COST | HTTP-0266, HTTP-0267 |
| API-071 | marketplace-service | POST /api/v1/cake-requests/{id}/images | False | False | BLOCKED_EXTERNAL_PROVIDER_OR_COST | HTTP-0268, HTTP-0269, HTTP-0415, HTTP-0448, HTTP-0513, HTTP-0554 |
| API-072 | marketplace-service | DELETE /api/v1/cake-requests/{id}/images/{imageId} | False | False | BLOCKED_EXTERNAL_PROVIDER_OR_COST | HTTP-0270, HTTP-0271 |
| API-073 | marketplace-service | GET /internal/v1/cake-requests/{id}/context | True | Không eligible | NOT_EXPOSED_BY_DESIGN | HTTP-0272, HTTP-0402, HTTP-0634, HTTP-0636 |
| API-074 | marketplace-service | GET /internal/v1/cake-requests/{id}/chat-authorization | False | Không eligible | NOT_EXPOSED_BY_DESIGN | HTTP-0275, HTTP-0635 |
| API-075 | marketplace-service | GET /internal/v1/offers/{id}/order-source | False | Không eligible | NOT_EXPOSED_BY_DESIGN | HTTP-0278 |
| API-076 | marketplace-service | GET /api/v1/offers | True | True | FAIL_DIRECT | HTTP-0019, HTTP-0035, HTTP-0281, HTTP-0282, HTTP-0413, HTTP-0446, HTTP-0573, HTTP-0575, HTTP-0588, HTTP-0590, HTTP-0618, HTTP-0619, HTTP-0631, HTTP-0632 |
| API-077 | marketplace-service | GET /api/v1/offers/{id} | False | False | PASS_EXPECTED_NEGATIVE_ONLY | HTTP-0283, HTTP-0284 |
| API-078 | marketplace-service | POST /api/v1/cake-requests/{id}/offers | False | False | FAIL_DIRECT | HTTP-0285, HTTP-0286, HTTP-0515, HTTP-0556 |
| API-079 | marketplace-service | PATCH /api/v1/offers/{id} | False | False | PASS_EXPECTED_NEGATIVE_ONLY | HTTP-0287, HTTP-0288 |
| API-080 | marketplace-service | POST /api/v1/offers/{id}/withdraw | False | False | PASS_EXPECTED_NEGATIVE_ONLY | HTTP-0289, HTTP-0290 |
| API-081 | marketplace-service | POST /api/v1/offers/{id}/accept | False | False | PASS_EXPECTED_NEGATIVE_ONLY | HTTP-0291, HTTP-0292 |
| API-082 | subscription-service | GET /api/v1/admin/bakery-payments | True | True | PASS_DIRECT_AND_GATEWAY | HTTP-0023, HTTP-0039, HTTP-0293, HTTP-0294, HTTP-0421, HTTP-0454, HTTP-0624, HTTP-0625 |
| API-083 | subscription-service | POST /api/v1/admin/bakery-payments/{paymentId}/approve | False | False | PASS_EXPECTED_NEGATIVE_ONLY | HTTP-0295, HTTP-0296 |
| API-084 | subscription-service | POST /api/v1/admin/bakery-payments/{paymentId}/reject | False | False | PASS_EXPECTED_NEGATIVE_ONLY | HTTP-0297, HTTP-0298 |
| API-085 | subscription-service | POST /api/v1/subscription-orders/{orderId}/payments | False | False | PASS_EXPECTED_NEGATIVE_ONLY | HTTP-0299, HTTP-0300 |
| API-086 | subscription-service | GET /api/v1/subscription-plans/payment-options | True | True | PASS_DIRECT_AND_GATEWAY | HTTP-0021, HTTP-0037, HTTP-0301, HTTP-0302 |
| API-087 | subscription-service | POST /api/v1/subscription-orders/{orderId}/vnpay/checkout | False | False | PASS_EXPECTED_NEGATIVE_ONLY | HTTP-0303, HTTP-0304 |
| API-088 | subscription-service | GET /api/v1/payments/vnpay/ipn | False | False | BLOCKED_EXTERNAL_PROVIDER_OR_COST | HTTP-0305, HTTP-0306, HTTP-0403, HTTP-0436 |
| API-089 | subscription-service | GET /api/v1/payments/vnpay/return | False | False | BLOCKED_EXTERNAL_PROVIDER_OR_COST | HTTP-0307, HTTP-0308, HTTP-0404, HTTP-0437 |
| API-090 | subscription-service | GET /api/v1/admin/vnpay-attempts | True | True | PASS_DIRECT_AND_GATEWAY | HTTP-0025, HTTP-0041, HTTP-0309, HTTP-0310, HTTP-0422, HTTP-0455 |
| API-091 | subscription-service | GET /api/v1/admin/subscription-plans | True | True | PASS_DIRECT_AND_GATEWAY | HTTP-0022, HTTP-0038, HTTP-0311, HTTP-0312, HTTP-0423, HTTP-0456 |
| API-092 | subscription-service | POST /api/v1/admin/subscription-plans | True | True | PASS_DIRECT_AND_GATEWAY | HTTP-0064, HTTP-0067, HTTP-0313, HTTP-0314, HTTP-0577, HTTP-0592 |
| API-093 | subscription-service | PATCH /api/v1/admin/subscription-plans/{planId} | True | True | PASS_DIRECT_AND_GATEWAY | HTTP-0066, HTTP-0069, HTTP-0315, HTTP-0316 |
| API-094 | subscription-service | POST /api/v1/admin/subscription-plans/{planId}/archive | True | True | PASS_DIRECT_AND_GATEWAY | HTTP-0317, HTTP-0318, HTTP-0432, HTTP-0465 |
| API-095 | subscription-service | GET /api/v1/subscription-plans | True | True | PASS_DIRECT_AND_GATEWAY | HTTP-0020, HTTP-0036, HTTP-0319, HTTP-0320, HTTP-0620, HTTP-0621 |
| API-096 | subscription-service | GET /api/v1/subscription-plans/{planId} | True | True | PASS_DIRECT_AND_GATEWAY | HTTP-0065, HTTP-0068, HTTP-0321, HTTP-0322, HTTP-0433, HTTP-0466 |
| API-097 | subscription-service | GET /api/v1/bakeries/{bakeryId}/subscription | False | False | FAIL_DIRECT | HTTP-0323, HTTP-0324, HTTP-0511, HTTP-0552 |
| API-098 | subscription-service | GET /internal/v1/subscriptions/bakeries/{bakeryId}/entitlement | True | Không eligible | NOT_EXPOSED_BY_DESIGN | HTTP-0325, HTTP-0645 |
| API-099 | subscription-service | GET /api/v1/admin/subscription-orders | True | True | PASS_DIRECT_AND_GATEWAY | HTTP-0024, HTTP-0040, HTTP-0328, HTTP-0329, HTTP-0424, HTTP-0457, HTTP-0622, HTTP-0623 |
| API-100 | subscription-service | POST /api/v1/bakeries/{bakeryId}/subscription-orders | False | False | FAIL_DIRECT | HTTP-0330, HTTP-0331, HTTP-0509, HTTP-0550, HTTP-0578, HTTP-0593 |
| API-101 | subscription-service | GET /api/v1/bakeries/{bakeryId}/subscription-orders | False | False | FAIL_DIRECT | HTTP-0332, HTTP-0333, HTTP-0510, HTTP-0551 |
| API-102 | subscription-service | GET /api/v1/subscription-orders/{orderId} | False | False | PASS_EXPECTED_NEGATIVE_ONLY | HTTP-0334, HTTP-0335 |
| API-103 | cake-ai-service | GET /api/v1/generated-designs/{id} | False | False | BLOCKED_AUTH_OR_TEST_FIXTURE | HTTP-0336, HTTP-0337 |
| API-104 | cake-ai-service | GET /api/v1/admin/generated-designs | False | False | BLOCKED_AUTH_OR_TEST_FIXTURE | HTTP-0338, HTTP-0339, HTTP-0425, HTTP-0458 |
| API-105 | cake-ai-service | PATCH /api/v1/admin/generated-designs/{id}/moderation | False | False | BLOCKED_AUTH_OR_TEST_FIXTURE | HTTP-0340, HTTP-0341 |
| API-106 | cake-ai-service | GET /internal/v1/generated-designs/{id}/validation | False | Không eligible | BLOCKED_AUTH_OR_TEST_FIXTURE | HTTP-0342 |
| API-107 | cake-ai-service | GET /internal/v1/cake-requests/{id}/generation-context | False | Không eligible | BLOCKED_AUTH_OR_TEST_FIXTURE | HTTP-0345 |
| API-108 | cake-ai-service | GET /storage/** | False | Không eligible | BLOCKED_AUTH_OR_TEST_FIXTURE | HTTP-0348 |
| API-109 | cake-ai-service | POST /api/v1/generation-jobs | False | False | BLOCKED_AUTH_OR_TEST_FIXTURE | HTTP-0349, HTTP-0350 |
| API-110 | cake-ai-service | GET /api/v1/generation-jobs | False | False | BLOCKED_AUTH_OR_TEST_FIXTURE | HTTP-0351, HTTP-0352 |
| API-111 | cake-ai-service | GET /api/v1/generation-jobs/{id} | False | False | BLOCKED_AUTH_OR_TEST_FIXTURE | HTTP-0353, HTTP-0354 |
| API-112 | cake-ai-service | POST /api/v1/generation-jobs/{id}/prompt-revisions | False | False | BLOCKED_AUTH_OR_TEST_FIXTURE | HTTP-0355, HTTP-0356 |
| API-113 | cake-ai-service | POST /api/v1/generation-jobs/{id}/cancel | False | False | BLOCKED_AUTH_OR_TEST_FIXTURE | HTTP-0357, HTTP-0358 |
| API-114 | order-service | GET /internal/v1/orders/{orderId}/context | False | Không eligible | NOT_EXPOSED_BY_DESIGN | HTTP-0359 |
| API-115 | order-service | POST /internal/v1/orders/from-offer | False | Không eligible | NOT_EXPOSED_BY_DESIGN | HTTP-0362 |
| API-116 | order-service | POST /api/v1/orders/direct | False | False | FAIL_DIRECT | HTTP-0365, HTTP-0366, HTTP-0501, HTTP-0542 |
| API-117 | order-service | GET /api/v1/orders | True | True | PASS_DIRECT_AND_GATEWAY | HTTP-0026, HTTP-0042, HTTP-0367, HTTP-0368, HTTP-0410, HTTP-0443, HTTP-0626, HTTP-0627 |
| API-118 | order-service | GET /api/v1/orders/{orderId} | False | False | PASS_EXPECTED_NEGATIVE_ONLY | HTTP-0369, HTTP-0370 |
| API-119 | order-service | POST /api/v1/orders/{orderId}/status-transitions | False | False | PASS_EXPECTED_NEGATIVE_ONLY | HTTP-0371, HTTP-0372 |
| API-120 | order-service | POST /api/v1/orders/{orderId}/review | False | False | PASS_EXPECTED_NEGATIVE_ONLY | HTTP-0373, HTTP-0374 |
| API-121 | order-service | PATCH /api/v1/orders/{orderId}/review | False | False | PASS_EXPECTED_NEGATIVE_ONLY | HTTP-0375, HTTP-0376 |
| API-122 | order-service | DELETE /api/v1/orders/{orderId}/review | False | False | PASS_EXPECTED_NEGATIVE_ONLY | HTTP-0377, HTTP-0378 |
| API-123 | order-service | PATCH /api/v1/admin/reviews/{orderId}/status | False | False | PASS_EXPECTED_NEGATIVE_ONLY | HTTP-0379, HTTP-0380 |
| API-124 | chat-service | GET /api/v1/conversations | True | True | FAIL_DIRECT | HTTP-0027, HTTP-0043, HTTP-0381, HTTP-0382, HTTP-0411, HTTP-0414, HTTP-0444, HTTP-0447, HTTP-0628, HTTP-0629 |
| API-125 | chat-service | POST /api/v1/conversations | False | False | FAIL_DIRECT | HTTP-0383, HTTP-0384, HTTP-0416, HTTP-0449, HTTP-0516, HTTP-0557 |
| API-126 | chat-service | GET /api/v1/conversations/{conversationId} | False | False | PASS_EXPECTED_NEGATIVE_ONLY | HTTP-0385, HTTP-0386 |
| API-127 | chat-service | POST /api/v1/conversations/{conversationId}/close | False | False | PASS_EXPECTED_NEGATIVE_ONLY | HTTP-0387, HTTP-0388 |
| API-128 | chat-service | GET /api/v1/conversations/{conversationId}/messages | False | False | PASS_EXPECTED_NEGATIVE_ONLY | HTTP-0389, HTTP-0390 |
| API-129 | chat-service | POST /api/v1/conversations/{conversationId}/messages | False | False | PASS_EXPECTED_NEGATIVE_ONLY | HTTP-0391, HTTP-0392 |
| API-130 | chat-service | POST /api/v1/conversations/{conversationId}/read | False | False | PASS_EXPECTED_NEGATIVE_ONLY | HTTP-0393, HTTP-0394 |
| API-131 | chat-service | DELETE /api/v1/conversations/{conversationId}/messages/{messageId} | False | False | PASS_EXPECTED_NEGATIVE_ONLY | HTTP-0395, HTTP-0396 |

## 31. Sẵn sàng Development / Integration / Production

| Mức | Đánh giá trong phạm vi campaign |
|---|---|
| Development | PARTIAL: build và194 tests chạy được; sáu service + Gateway native phục vụ một phần API thật. Cake AI/startup, internal clients và storage chưa đủ. |
| Integration | BLOCKED: năm journey chưa hoàn tất; các capability phụ thuộc Order/Offer/Chat/Subscription/AI không được xác nhận toàn phần. |
| Production | NOT_VERIFIED; không có quyền/test Production. Local unit/direct/Gateway PASS không chứng minh sẵn sàng Production. |

Không báo FULL PASS vì còn service không start, thiếu native storage/credential, Swagger/CORS và lỗi source500. Không có Frontend/Mobile runtime được test trong mission Backend native này; source/config của hai client chỉ nằm trong integrity baseline.

## 32. Xác minh cuối: Git, source, env, secrets, process và dữ liệu

| Phạm vi | Kết quả |
|---|---|
| HEAD/branch | True / True |
| Tệp baseline duy nhất | 3872 |
| Tệp baseline đổi hash | 0 |
| Tệp baseline mất | 0 |
| backend/ (tracked + indexed) | 704 tệp không đổi |
| frontend/ | 501 tệp không đổi |
| mobile/ tracked | 694 tệp không đổi; ignored generated data không được hash toàn bộ |
| Root .env / .gitignore / Maven / Compose / scripts | Hash không đổi; không xuất giá trị credential |
| External referenced key/credential files | 3/3 không đổi từ fingerprint giữa campaign đến cuối; không có hash đầu campaign cho chúng, không giả claim so sánh từ trước khi đọc |
| Git index/commit | Không stage/commit/push/merge/reset hoặc đổi Git config |
| Original PostgreSQL | 6 DB,50 table fingerprints không đổi; Cake AI không fingerprint được vì28P01 |
| Audit database cleanup | Giữ lại6 DB riêng và synthetic fixtures để trace; không DROP/TRUNCATE/reset bất kỳ DB nào |
| Native processes | 7 process đang sống đã được dừng; Cake AI đã exit1; xem process-cleanup.json |
| Container usage | Không gọi Docker/Compose/Podman/Desktop/Testcontainers; không dùng port proxy container làm dependency |
| Repository write | Chỉ final report tại docs/BAKERY_PLATFORM_NATIVE_LOCAL_ALL_API_GATEWAY_SWAGGER_AUDIT_VI.md |

Baseline Git được lưu ở `baseline.private.json`, final comparator ở `integrity-results.json`. Tệp untracked Master Prompt và mobile local-runs có sẵn được giữ nguyên. Fingerprint tracked/source và root.env không bao phủ mọi build/cache/evidence ignored khổng lồ; audit không thao tác các thư mục đó. Không dùng so sánh Git status đơn thuần để tuyên bố toàn bộ filesystem unchanged.

Các DB audit mới và ID retained được liệt kê ở phần22/phụ lục. Có DELETE address và soft-delete/archive API thích hợp, nhưng không có public user/bakery/RFQ hard delete; không tự làm destructive cleanup. Việc cleanup riêng database audit có thể thực hiện trong task được phép sau khi xác minh đúng tên và không còn process; chưa thực hiện trong campaign. Đã chạy comparator sau khi tạo report: chỉ thêm `?? docs/BAKERY_PLATFORM_NATIVE_LOCAL_ALL_API_GATEWAY_SWAGGER_AUDIT_VI.md`; không mất entry baseline, không đổi HEAD/branch và không tệp baseline nào đổi hash. Lần kiểm tra: 2026-11-11T15:25:33.474083+07:00.

### Kết quả dừng process thực tế

| Application | PID audit | Còn chạy | Exit sau kết thúc |
|---|---|---|---|
| identity-service | 33216 | False | 1 |
| bakery-service | 36108 | False | 1 |
| marketplace-service | 16364 | False | 1 |
| subscription-service | 34484 | False | 1 |
| cake-ai-service | 18916 | False | 1 |
| order-service | 22312 | False | 1 |
| chat-service | 7164 | False | 1 |
| api-gateway | 6928 | False | 1 |

8080–8087 sau cleanup: không có listener. PostgreSQL native vẫn Running. Exit code1 ở bảy process còn sống là hệ quả TerminateProcess do audit yêu cầu, không phải startup failure; Cake AI exit1 ngay lúc startup được phân biệt trong log. Không có tiến trình có sẵn bị stop.

## 33. Kết luận cuối cùng

**PARTIAL.** Đã kiểm kê đủ131 operation source, gửi direct probe131/131 và Gateway probe110/110. Có 65 operation đạt ít nhất một happy path direct, 58 qua Gateway; 54 operation có terminal PASS_DIRECT_AND_GATEWAY. Swagger JSON/UI có thể tải ở6/7 service; docs proxy6/7 tải được nhưng thiếu server prefix cho Try it out, nên Swagger chức năng đầy đủ không PASS. Maven194/194 test allowlist PASS; test container không thực thi.

Nguyên nhân chặn chính đã được kiểm chứng: PostgreSQL credential Cake AI, native internal client mapping/hash, native MinIO vắng, cloud/provider chưa có phép cho execution này. Đồng thời có source defect500 filter/method và phân loại storage I/O400. Không sửa bất kỳ vấn đề nào. Không có journey liên service hoàn chỉnh được gán PASS và không có API blocked/mocked được tính thành thành công.

## Phụ lục A. Hợp đồng, dependency và kế hoạch theo từng operation

Các signature dưới đây lấy trực tiếp source; request multipart/JSON/query từ signature và OpenAPI runtime. Response envelope/DTO nằm trong kiểu trả về; không tự tạo DTO mới.

| ID | Handler / request & response signature | Content condition | Dependency / safe strategy | Source |
|---|---|---|---|---|
| API-001 | getJwkSet — public ResponseEntity<Map<String, Object>> getJwkSet() | @GetMapping("/.well-known/jwks.json") | JWT issuer + DB audit; DB Identity / RSA; Synthetic fixture thật; status/schema/readback | backend/identity-service/src/main/java/com/se193262/identityservice/config/JwkSetController.java:22 |
| API-002 | list — public ApiResponse<List<AddressResponse>> list(@AuthenticationPrincipal Jwt jwt) | @GetMapping | JWT issuer + DB audit; DB Identity / RSA; Synthetic fixture thật; status/schema/readback | backend/identity-service/src/main/java/com/se193262/identityservice/feature/address/AddressController.java:21 |
| API-003 | get — public ApiResponse<AddressResponse> get(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID id) | @GetMapping("/{id}") | JWT issuer + DB audit; DB Identity / RSA; Synthetic fixture thật; status/schema/readback | backend/identity-service/src/main/java/com/se193262/identityservice/feature/address/AddressController.java:26 |
| API-004 | create — public ResponseEntity<ApiResponse<AddressResponse>> create(@AuthenticationPrincipal Jwt jwt, @Validated(SaveAddressRequest.Create.class) @RequestBody SaveAddressRequest request) | @PostMapping | JWT issuer + DB audit; DB Identity / RSA; Synthetic fixture thật; status/schema/readback | backend/identity-service/src/main/java/com/se193262/identityservice/feature/address/AddressController.java:31 |
| API-005 | update — public ApiResponse<AddressResponse> update(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID id, @Valid @RequestBody SaveAddressRequest request) | @PatchMapping("/{id}") | JWT issuer + DB audit; DB Identity / RSA; Synthetic fixture thật; status/schema/readback | backend/identity-service/src/main/java/com/se193262/identityservice/feature/address/AddressController.java:37 |
| API-006 | setDefault — public ApiResponse<AddressResponse> setDefault(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID id) | @PutMapping("/{id}/default") | JWT issuer + DB audit; DB Identity / RSA; Synthetic fixture thật; status/schema/readback | backend/identity-service/src/main/java/com/se193262/identityservice/feature/address/AddressController.java:43 |
| API-007 | delete — public ResponseEntity<Void> delete(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID id) | @DeleteMapping("/{id}") | JWT issuer + DB audit; DB Identity / RSA; Synthetic fixture thật; status/schema/readback | backend/identity-service/src/main/java/com/se193262/identityservice/feature/address/AddressController.java:48 |
| API-008 | register — public ResponseEntity<ApiResponse<UserProfileResponse>> register( @Valid @RequestBody RegisterRequest request ) | @PostMapping("/register") | JWT issuer + DB audit; DB Identity / RSA; Synthetic fixture thật; status/schema/readback | backend/identity-service/src/main/java/com/se193262/identityservice/feature/authentication/AuthenticationController.java:41 |
| API-009 | login — public ResponseEntity<ApiResponse<TokenResponse>> login(@Valid @RequestBody LoginRequest request) | @PostMapping("/login") | JWT issuer + DB audit; DB Identity / RSA; Synthetic fixture thật; status/schema/readback | backend/identity-service/src/main/java/com/se193262/identityservice/feature/authentication/AuthenticationController.java:50 |
| API-010 | refresh — public ResponseEntity<ApiResponse<TokenResponse>> refresh(HttpServletRequest request) | @PostMapping("/refresh") | JWT issuer + DB audit; DB Identity / RSA; Synthetic fixture thật; status/schema/readback | backend/identity-service/src/main/java/com/se193262/identityservice/feature/authentication/AuthenticationController.java:56 |
| API-011 | logout — public ResponseEntity<ApiResponse<Void>> logout(HttpServletRequest request) | @PostMapping("/logout") | JWT issuer + DB audit; DB Identity / RSA; Synthetic fixture thật; status/schema/readback | backend/identity-service/src/main/java/com/se193262/identityservice/feature/authentication/AuthenticationController.java:62 |
| API-012 | me — public ApiResponse<UserProfileResponse> me(@AuthenticationPrincipal Jwt jwt) | @GetMapping("/me") | JWT issuer + DB audit; DB Identity / RSA; Synthetic fixture thật; status/schema/readback | backend/identity-service/src/main/java/com/se193262/identityservice/feature/authentication/AuthenticationController.java:71 |
| API-013 | issue — public ServiceTokenResponse issue(@Valid @RequestBody ServiceTokenRequest request) | @PostMapping("/service-token") | JWT issuer + DB audit; DB Identity / RSA; Synthetic fixture thật; status/schema/readback | backend/identity-service/src/main/java/com/se193262/identityservice/feature/authentication/ServiceTokenController.java:16 |
| API-014 | list — public ResponseEntity<ApiResponse<ResultPaginationDTO>> list( @RequestParam(required = false) String email, @RequestParam(required = false) UserStatus status, @RequestParam(required = false) String role, @RequestParam(defaultValue = "1") @Min(1) int page, @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size) | @GetMapping | JWT issuer + DB audit; DB Identity / RSA; Synthetic fixture thật; status/schema/readback | backend/identity-service/src/main/java/com/se193262/identityservice/feature/user/AdminUserController.java:37 |
| API-015 | get — public ResponseEntity<ApiResponse<UserProfileResponse>> get(@PathVariable UUID userId) | @GetMapping("/{userId}") | JWT issuer + DB audit; DB Identity / RSA; Synthetic fixture thật; status/schema/readback | backend/identity-service/src/main/java/com/se193262/identityservice/feature/user/AdminUserController.java:48 |
| API-016 | changeStatus — public ResponseEntity<ApiResponse<UserProfileResponse>> changeStatus( @PathVariable UUID userId, @AuthenticationPrincipal Jwt jwt, @Valid @RequestBody UpdateUserStatusRequest request) | @PatchMapping("/{userId}/status") | JWT issuer + DB audit; DB Identity / RSA; Synthetic fixture thật; status/schema/readback | backend/identity-service/src/main/java/com/se193262/identityservice/feature/user/AdminUserController.java:53 |
| API-017 | replaceRoles — public ResponseEntity<ApiResponse<UserProfileResponse>> replaceRoles( @PathVariable UUID userId, @AuthenticationPrincipal Jwt jwt, @Valid @RequestBody ReplaceUserRolesRequest request) | @PutMapping("/{userId}/roles") | JWT issuer + DB audit; DB Identity / RSA; Synthetic fixture thật; status/schema/readback | backend/identity-service/src/main/java/com/se193262/identityservice/feature/user/AdminUserController.java:62 |
| API-018 | user — public Map<String, Object> user(@PathVariable UUID id) | @GetMapping("/{id}") | JWT issuer + DB audit; DB Identity / RSA; Không mutate khi thiếu fixture; negative only | backend/identity-service/src/main/java/com/se193262/identityservice/feature/user/UserContextController.java:17 |
| API-019 | grantBakeryOwner — public void grantBakeryOwner(@PathVariable UUID id) | @PutMapping("/{id}/bakery-owner") | JWT issuer + DB audit; DB Identity / RSA; Không mutate khi thiếu fixture; negative only | backend/identity-service/src/main/java/com/se193262/identityservice/feature/user/UserContextController.java:23 |
| API-020 | address — public Map<String, Object> address(@PathVariable UUID userId, @PathVariable UUID addressId) | @GetMapping("/{userId}/addresses/{addressId}") | JWT issuer + DB audit; DB Identity / RSA; Không mutate khi thiếu fixture; negative only | backend/identity-service/src/main/java/com/se193262/identityservice/feature/user/UserContextController.java:30 |
| API-021 | updateMyProfile — public ResponseEntity<ApiResponse<UserProfileResponse>> updateMyProfile( @AuthenticationPrincipal Jwt jwt, @Valid @RequestBody UpdateMyProfileRequest request) | @PatchMapping("/me") | JWT issuer + DB audit; DB Identity / RSA; Synthetic fixture thật; status/schema/readback | backend/identity-service/src/main/java/com/se193262/identityservice/feature/user/UserController.java:29 |
| API-022 | list — public ResponseEntity<ApiResponse<List<AddOnDto>>> list(@PathVariable UUID bakeryId) | @GetMapping | JWT issuer + DB audit; Identity/Subscription + native MinIO ở media/catalog; Synthetic fixture thật; status/schema/readback | backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/addon/controller/AddOnController.java:35 |
| API-023 | create — public ResponseEntity<ApiResponse<AddOnDto>> create(@PathVariable UUID bakeryId, @Valid @RequestBody AddOnDto request) | @PostMapping | JWT issuer + DB audit; Identity/Subscription + native MinIO ở media/catalog; Synthetic fixture thật; status/schema/readback | backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/addon/controller/AddOnController.java:40 |
| API-024 | update — public ResponseEntity<ApiResponse<AddOnDto>> update(@PathVariable UUID bakeryId, @PathVariable UUID addOnId, @Valid @RequestBody AddOnDto request) | @PatchMapping("/{addOnId}") | JWT issuer + DB audit; Identity/Subscription + native MinIO ở media/catalog; Synthetic fixture thật; status/schema/readback | backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/addon/controller/AddOnController.java:47 |
| API-025 | delete — public ResponseEntity<Void> delete(@PathVariable UUID bakeryId, @PathVariable UUID addOnId) | @DeleteMapping("/{addOnId}") | JWT issuer + DB audit; Identity/Subscription + native MinIO ở media/catalog; Synthetic fixture thật; status/schema/readback | backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/addon/controller/AddOnController.java:53 |
| API-026 | uploadImage — public ResponseEntity<ApiResponse<MediaResponse>> uploadImage(@PathVariable UUID bakeryId, @PathVariable UUID addOnId, @RequestPart("file") MultipartFile file) | @PostMapping(value = "/{addOnId}/image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE) | JWT issuer + DB audit; Identity/Subscription + native MinIO ở media/catalog; Không mutate khi thiếu fixture; negative only | backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/addon/controller/AddOnController.java:59 |
| API-027 | list — public ResponseEntity<ApiResponse<PageResult<BakeryDto>>> list( @RequestParam(required = false) BakeryStatus status, @RequestParam(required = false) String query, @RequestParam(required = false) String city, @RequestParam(defaultValue = "1") int page, @RequestParam(defaultValue = "20") int size, @RequestParam(defaultValue = "createdAt,desc") String sort) | @GetMapping | JWT issuer + DB audit; Identity/Subscription + native MinIO ở media/catalog; Synthetic fixture thật; status/schema/readback | backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/controller/AdminBakeryController.java:38 |
| API-028 | get — public ResponseEntity<ApiResponse<AdminBakeryDetailResponse>> get(@PathVariable UUID bakeryId) | @GetMapping("/{bakeryId}") | JWT issuer + DB audit; Identity/Subscription + native MinIO ở media/catalog; Synthetic fixture thật; status/schema/readback | backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/controller/AdminBakeryController.java:49 |
| API-029 | changeStatus — public ResponseEntity<ApiResponse<BakeryDto>> changeStatus(@PathVariable UUID bakeryId, @Valid @RequestBody ChangeBakeryStatusRequest request) | @PatchMapping("/{bakeryId}/status") | JWT issuer + DB audit; Identity/Subscription + native MinIO ở media/catalog; Synthetic fixture thật; status/schema/readback | backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/controller/AdminBakeryController.java:54 |
| API-030 | create — public ResponseEntity<ApiResponse<BakeryDto>> create( @Valid @RequestBody BakeryDto request, @AuthenticationPrincipal Jwt jwt) | @PostMapping | JWT issuer + DB audit; Identity/Subscription + native MinIO ở media/catalog; Không mutate khi thiếu fixture; negative only | backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/controller/BakeryController.java:37 |
| API-031 | update — public ResponseEntity<ApiResponse<BakeryDto>> update(@PathVariable UUID bakeryId, @Valid @RequestBody BakeryDto request) | @PatchMapping("/{bakeryId}") | JWT issuer + DB audit; Identity/Subscription + native MinIO ở media/catalog; Synthetic fixture thật; status/schema/readback | backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/controller/BakeryController.java:45 |
| API-032 | replaceOperations — public ResponseEntity<ApiResponse<BakeryOperationsDto>> replaceOperations( @PathVariable UUID bakeryId, @Valid @RequestBody BakeryOperationsDto request) | @PutMapping("/{bakeryId}/operations") | JWT issuer + DB audit; Identity/Subscription + native MinIO ở media/catalog; Synthetic fixture thật; status/schema/readback | backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/controller/BakeryController.java:51 |
| API-033 | submitForApproval — public ResponseEntity<ApiResponse<BakeryDto>> submitForApproval(@PathVariable UUID bakeryId) | @PostMapping("/{bakeryId}/submit-for-approval") | JWT issuer + DB audit; Identity/Subscription + native MinIO ở media/catalog; Synthetic fixture thật; status/schema/readback | backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/controller/BakeryController.java:58 |
| API-034 | uploadLogo — public ResponseEntity<ApiResponse<MediaResponse>> uploadLogo(@PathVariable UUID bakeryId, @RequestPart("file") MultipartFile file) | @PostMapping(value = "/{bakeryId}/logo", consumes = MediaType.MULTIPART_FORM_DATA_VALUE) | JWT issuer + DB audit; Identity/Subscription + native MinIO ở media/catalog; Không mutate khi thiếu fixture; negative only | backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/controller/BakeryController.java:63 |
| API-035 | uploadCover — public ResponseEntity<ApiResponse<MediaResponse>> uploadCover(@PathVariable UUID bakeryId, @RequestPart("file") MultipartFile file) | @PostMapping(value = "/{bakeryId}/cover", consumes = MediaType.MULTIPART_FORM_DATA_VALUE) | JWT issuer + DB audit; Identity/Subscription + native MinIO ở media/catalog; Không mutate khi thiếu fixture; negative only | backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/controller/BakeryController.java:70 |
| API-036 | get — public ApiResponse<BakeryDto> get(@AuthenticationPrincipal Jwt jwt) | @GetMapping("/onboarding") | JWT issuer + DB audit; Identity/Subscription + native MinIO ở media/catalog; Synthetic fixture thật; status/schema/readback | backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/controller/BakeryOnboardingController.java:29 |
| API-037 | submit — public ApiResponse<BakeryDto> submit(@AuthenticationPrincipal Jwt jwt, @Valid @RequestBody BakeryOnboardingRequest request) | @PostMapping("/onboarding") | JWT issuer + DB audit; Identity/Subscription + native MinIO ở media/catalog; Không mutate khi thiếu fixture; negative only | backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/controller/BakeryOnboardingController.java:34 |
| API-038 | complete — public ResponseEntity<Void> complete(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID bakeryId) | @PostMapping("/{bakeryId}/onboarding/complete") | JWT issuer + DB audit; Identity/Subscription + native MinIO ở media/catalog; Không mutate khi thiếu fixture; negative only | backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/controller/BakeryOnboardingController.java:40 |
| API-039 | activate — public ResponseEntity<Void> activate(@PathVariable UUID bakeryId) | @PutMapping("/{bakeryId}/onboarding/activate") | JWT issuer + DB audit; Identity/Subscription + native MinIO ở media/catalog; Không mutate khi thiếu fixture; negative only | backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/controller/InternalBakeryController.java:29 |
| API-040 | profile — public ResponseEntity<BakeryInternalProfileResponse> profile(@PathVariable UUID bakeryId) | @GetMapping("/{bakeryId}") | JWT issuer + DB audit; Identity/Subscription + native MinIO ở media/catalog; Synthetic fixture thật; status/schema/readback | backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/controller/InternalBakeryController.java:35 |
| API-041 | authorization — public ResponseEntity<BakeryAuthorizationResponse> authorization(@PathVariable UUID bakeryId, @PathVariable UUID userId, @RequestParam(required = false) BakeryMemberRole requiredRole) | @GetMapping("/{bakeryId}/members/{userId}/authorization") | JWT issuer + DB audit; Identity/Subscription + native MinIO ở media/catalog; Synthetic fixture thật; status/schema/readback | backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/controller/InternalBakeryController.java:40 |
| API-042 | list — public ResponseEntity<ApiResponse<PageResult<PublicBakeryResponse>>> list( @RequestParam(required = false) String query, @RequestParam(required = false) String city, @RequestParam(required = false) String district, @RequestParam(defaultValue = "1") int page, @RequestParam(defaultValue = "20") int size, @RequestParam(defaultValue = "name,asc") String sort) | @GetMapping | JWT issuer + DB audit; Identity/Subscription + native MinIO ở media/catalog; Synthetic fixture thật; status/schema/readback | backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/controller/PublicBakeryController.java:23 |
| API-043 | get — public ResponseEntity<ApiResponse<PublicBakeryResponse>> get(@PathVariable UUID bakeryId) | @GetMapping("/{bakeryId}") | JWT issuer + DB audit; Identity/Subscription + native MinIO ở media/catalog; Không mutate khi thiếu fixture; negative only | backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/controller/PublicBakeryController.java:34 |
| API-044 | memberships — public List<Membership> memberships(@PathVariable UUID userId) | @GetMapping("/users/{userId}/bakery-memberships") | JWT issuer + DB audit; Identity/Subscription + native MinIO ở media/catalog; Synthetic fixture thật; status/schema/readback | backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/catalog/CatalogController.java:21 |
| API-045 | quote — public Quote quote(@Valid @RequestBody QuoteRequest request) | @PostMapping("/catalog/customization-quotes") | JWT issuer + DB audit; Identity/Subscription + native MinIO ở media/catalog; Không mutate khi thiếu fixture; negative only | backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/catalog/CatalogController.java:27 |
| API-046 | addons — public Quote addons(@Valid @RequestBody QuoteRequest request) | @PostMapping("/catalog/add-on-quotes") | JWT issuer + DB audit; Identity/Subscription + native MinIO ở media/catalog; Không mutate khi thiếu fixture; negative only | backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/catalog/CatalogController.java:33 |
| API-047 | quote — public ResponseEntity<CatalogQuoteResponse> quote(@Valid @RequestBody CatalogQuoteRequest request) | @PostMapping("/quotes") | JWT issuer + DB audit; Identity/Subscription + native MinIO ở media/catalog; Không mutate khi thiếu fixture; negative only | backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/catalog/controller/InternalCatalogController.java:22 |
| API-048 | list — public ResponseEntity<ApiResponse<List<ProductCategoryDto>>> list(@PathVariable UUID bakeryId) | @GetMapping | JWT issuer + DB audit; Identity/Subscription + native MinIO ở media/catalog; Synthetic fixture thật; status/schema/readback | backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/category/controller/ProductCategoryController.java:31 |
| API-049 | create — public ResponseEntity<ApiResponse<ProductCategoryDto>> create(@PathVariable UUID bakeryId, @Valid @RequestBody ProductCategoryDto request) | @PostMapping | JWT issuer + DB audit; Identity/Subscription + native MinIO ở media/catalog; Synthetic fixture thật; status/schema/readback | backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/category/controller/ProductCategoryController.java:36 |
| API-050 | update — public ResponseEntity<ApiResponse<ProductCategoryDto>> update(@PathVariable UUID bakeryId, @PathVariable UUID categoryId, @Valid @RequestBody ProductCategoryDto request) | @PatchMapping("/{categoryId}") | JWT issuer + DB audit; Identity/Subscription + native MinIO ở media/catalog; Synthetic fixture thật; status/schema/readback | backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/category/controller/ProductCategoryController.java:43 |
| API-051 | delete — public ResponseEntity<Void> delete(@PathVariable UUID bakeryId, @PathVariable UUID categoryId) | @DeleteMapping("/{categoryId}") | JWT issuer + DB audit; Identity/Subscription + native MinIO ở media/catalog; Synthetic fixture thật; status/schema/readback | backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/category/controller/ProductCategoryController.java:49 |
| API-052 | list — public ResponseEntity<ApiResponse<List<BakeryMemberDto>>> list(@PathVariable UUID bakeryId) | @GetMapping | JWT issuer + DB audit; Identity/Subscription + native MinIO ở media/catalog; Synthetic fixture thật; status/schema/readback | backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/member/controller/BakeryMemberController.java:25 |
| API-053 | list — public ResponseEntity<ApiResponse<PageResult<ProductDto>>> list(@PathVariable UUID bakeryId, @RequestParam(required = false) ProductStatus status, @RequestParam(required = false) UUID categoryId, @RequestParam(required = false) String query, @RequestParam(defaultValue = "1") int page, @RequestParam(defaultValue = "20") int size, @RequestParam(defaultValue = "createdAt,desc") String sort) | @GetMapping | JWT issuer + DB audit; Identity/Subscription + native MinIO ở media/catalog; Synthetic fixture thật; status/schema/readback | backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/product/controller/ProductController.java:40 |
| API-054 | create — public ResponseEntity<ApiResponse<ProductDto>> create(@PathVariable UUID bakeryId, @Valid @RequestBody ProductDto request) | @PostMapping | JWT issuer + DB audit; Identity/Subscription + native MinIO ở media/catalog; Synthetic fixture thật; status/schema/readback | backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/product/controller/ProductController.java:52 |
| API-055 | update — public ResponseEntity<ApiResponse<ProductDto>> update(@PathVariable UUID bakeryId, @PathVariable UUID productId, @Valid @RequestBody ProductDto request) | @PatchMapping("/{productId}") | JWT issuer + DB audit; Identity/Subscription + native MinIO ở media/catalog; Synthetic fixture thật; status/schema/readback | backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/product/controller/ProductController.java:59 |
| API-056 | replaceOptions — public ResponseEntity<ApiResponse<ProductOptionsDto>> replaceOptions(@PathVariable UUID bakeryId, @PathVariable UUID productId, @Valid @RequestBody ProductOptionsDto request) | @PutMapping("/{productId}/options") | JWT issuer + DB audit; Identity/Subscription + native MinIO ở media/catalog; Synthetic fixture thật; status/schema/readback | backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/product/controller/ProductController.java:65 |
| API-057 | uploadImages — public ResponseEntity<ApiResponse<List<ProductImageResponse>>> uploadImages(@PathVariable UUID bakeryId, @PathVariable UUID productId, @RequestPart("files") List<MultipartFile> files, @RequestParam(required = false) Integer primaryIndex, @RequestPart(required = false) List<Integer> displayOrder) | @PostMapping(value = "/{productId}/images", consumes = MediaType.MULTIPART_FORM_DATA_VALUE) | JWT issuer + DB audit; Identity/Subscription + native MinIO ở media/catalog; Không mutate khi thiếu fixture; negative only | backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/product/controller/ProductController.java:72 |
| API-058 | deleteImage — public ResponseEntity<Void> deleteImage(@PathVariable UUID bakeryId, @PathVariable UUID productId, @PathVariable UUID imageId) | @DeleteMapping("/{productId}/images/{imageId}") | JWT issuer + DB audit; Identity/Subscription + native MinIO ở media/catalog; Không mutate khi thiếu fixture; negative only | backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/product/controller/ProductController.java:81 |
| API-059 | publish — public ResponseEntity<ApiResponse<ProductDto>> publish(@PathVariable UUID bakeryId, @PathVariable UUID productId) | @PostMapping("/{productId}/publish") | JWT issuer + DB audit; Identity/Subscription + native MinIO ở media/catalog; Không mutate khi thiếu fixture; negative only | backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/product/controller/ProductController.java:88 |
| API-060 | hide — public ResponseEntity<ApiResponse<ProductDto>> hide(@PathVariable UUID bakeryId, @PathVariable UUID productId) | @PostMapping("/{productId}/hide") | JWT issuer + DB audit; Identity/Subscription + native MinIO ở media/catalog; Không mutate khi thiếu fixture; negative only | backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/product/controller/ProductController.java:94 |
| API-061 | archive — public ResponseEntity<ApiResponse<ProductDto>> archive(@PathVariable UUID bakeryId, @PathVariable UUID productId) | @PostMapping("/{productId}/archive") | JWT issuer + DB audit; Identity/Subscription + native MinIO ở media/catalog; Synthetic fixture thật; status/schema/readback | backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/product/controller/ProductController.java:100 |
| API-062 | list — public ResponseEntity<ApiResponse<PageResult<PublicProductResponse>>> list( @RequestParam(required = false) String query, @RequestParam(required = false) UUID bakeryId, @RequestParam(required = false) UUID categoryId, @RequestParam(required = false) String city, @RequestParam(required = false) Boolean customizable, @RequestParam(required = false) BigDecimal minPrice, @RequestParam(required = false) BigDecimal maxPrice, @RequestParam(defaultValue = "1") int page, @RequestParam(defaultValue = "20") int size, @RequestParam(defaultValue = "createdAt,desc") String sort) | @GetMapping | JWT issuer + DB audit; Identity/Subscription + native MinIO ở media/catalog; Synthetic fixture thật; status/schema/readback | backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/product/controller/PublicProductController.java:24 |
| API-063 | get — public ResponseEntity<ApiResponse<PublicProductResponse>> get(@PathVariable UUID productId) | @GetMapping("/{productId}") | JWT issuer + DB audit; Identity/Subscription + native MinIO ở media/catalog; Không mutate khi thiếu fixture; negative only | backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/product/controller/PublicProductController.java:40 |
| API-064 | list — public ApiResponse<PageResponse<CakeRequestSummaryResponse>> list( @RequestParam Map<String, String> filters) | @GetMapping | JWT issuer + DB audit; Identity/Bakery/Subscription/Order/Cake AI theo typed client; không gọi cloud khi chưa có phép; Synthetic fixture thật; status/schema/readback | backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/CakeRequestController.java:26 |
| API-065 | detail — public ApiResponse<CakeRequestResponse> detail(@PathVariable UUID id) | @GetMapping("/{id}") | JWT issuer + DB audit; Identity/Bakery/Subscription/Order/Cake AI theo typed client; không gọi cloud khi chưa có phép; Synthetic fixture thật; status/schema/readback | backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/CakeRequestController.java:32 |
| API-066 | create — public ResponseEntity<ApiResponse<CakeRequestResponse>> create( @Valid @RequestBody CreateCakeRequestRequest command) | @PostMapping | JWT issuer + DB audit; Identity/Bakery/Subscription/Order/Cake AI theo typed client; không gọi cloud khi chưa có phép; Synthetic fixture thật; status/schema/readback | backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/CakeRequestController.java:37 |
| API-067 | patch — public ApiResponse<CakeRequestResponse> patch( @PathVariable UUID id, @Valid @RequestBody PatchCakeRequestRequest command) | @PatchMapping("/{id}") | JWT issuer + DB audit; Identity/Bakery/Subscription/Order/Cake AI theo typed client; không gọi cloud khi chưa có phép; Synthetic fixture thật; status/schema/readback | backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/CakeRequestController.java:43 |
| API-068 | publish — public ApiResponse<CakeRequestResponse> publish(@PathVariable UUID id) | @PostMapping("/{id}/publish") | JWT issuer + DB audit; Identity/Bakery/Subscription/Order/Cake AI theo typed client; không gọi cloud khi chưa có phép; Synthetic fixture thật; status/schema/readback | backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/CakeRequestController.java:49 |
| API-069 | cancel — public ApiResponse<CakeRequestResponse> cancel( @PathVariable UUID id, @Valid @RequestBody ReasonRequest command) | @PostMapping("/{id}/cancel") | JWT issuer + DB audit; Identity/Bakery/Subscription/Order/Cake AI theo typed client; không gọi cloud khi chưa có phép; Synthetic fixture thật; status/schema/readback | backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/CakeRequestController.java:54 |
| API-070 | design — public ApiResponse<CakeRequestResponse> design( @PathVariable UUID id, @Valid @RequestBody SelectDesignRequest command) | @PutMapping("/{id}/selected-design") | JWT issuer + DB audit; Identity/Bakery/Subscription/Order/Cake AI theo typed client; không gọi cloud khi chưa có phép; Không mutate khi thiếu fixture; negative only | backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/CakeRequestController.java:60 |
| API-071 | upload — public ResponseEntity<ApiResponse<List<RequestImageResponse>>> upload( @PathVariable UUID id, @RequestParam("files") List<MultipartFile> files, @RequestParam(required = false) List<Integer> displayOrder) | @PostMapping(value = "/{id}/images", consumes = "multipart/form-data") | JWT issuer + DB audit; Identity/Bakery/Subscription/Order/Cake AI theo typed client; không gọi cloud khi chưa có phép; Không mutate khi thiếu fixture; negative only | backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/CakeRequestController.java:66 |
| API-072 | delete — public ResponseEntity<Void> delete(@PathVariable UUID id, @PathVariable UUID imageId) | @DeleteMapping("/{id}/images/{imageId}") | JWT issuer + DB audit; Identity/Bakery/Subscription/Order/Cake AI theo typed client; không gọi cloud khi chưa có phép; Không mutate khi thiếu fixture; negative only | backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/CakeRequestController.java:75 |
| API-073 | context — public Map<String, Object> context(@PathVariable UUID id) | @GetMapping("/cake-requests/{id}/context") | JWT issuer + DB audit; Identity/Bakery/Subscription/Order/Cake AI theo typed client; không gọi cloud khi chưa có phép; Synthetic fixture thật; status/schema/readback | backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/MarketplaceContextController.java:27 |
| API-074 | chatAuthorization — public ChatAuthorizationResponse chatAuthorization( @PathVariable UUID id, @RequestParam UUID customerId, @RequestParam UUID bakeryId) | @GetMapping("/cake-requests/{id}/chat-authorization") | JWT issuer + DB audit; Identity/Bakery/Subscription/Order/Cake AI theo typed client; không gọi cloud khi chưa có phép; Không mutate khi thiếu fixture; negative only | backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/MarketplaceContextController.java:33 |
| API-075 | source — public OfferOrderSource source(@PathVariable UUID id) | @GetMapping("/offers/{id}/order-source") | JWT issuer + DB audit; Identity/Bakery/Subscription/Order/Cake AI theo typed client; không gọi cloud khi chưa có phép; Không mutate khi thiếu fixture; negative only | backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/MarketplaceContextController.java:42 |
| API-076 | list — public ApiResponse<PageResponse<OfferResponse>> list( @RequestParam Map<String, String> filters) | @GetMapping("/offers") | JWT issuer + DB audit; Identity/Bakery/Subscription/Order/Cake AI theo typed client; không gọi cloud khi chưa có phép; Synthetic fixture thật; status/schema/readback | backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/offer/OfferController.java:25 |
| API-077 | detail — public ApiResponse<OfferResponse> detail(@PathVariable UUID id) | @GetMapping("/offers/{id}") | JWT issuer + DB audit; Identity/Bakery/Subscription/Order/Cake AI theo typed client; không gọi cloud khi chưa có phép; Không mutate khi thiếu fixture; negative only | backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/offer/OfferController.java:31 |
| API-078 | create — public ResponseEntity<ApiResponse<OfferResponse>> create( @PathVariable UUID id, @Valid @RequestBody CreateOfferRequest command) | @PostMapping("/cake-requests/{id}/offers") | JWT issuer + DB audit; Identity/Bakery/Subscription/Order/Cake AI theo typed client; không gọi cloud khi chưa có phép; Không mutate khi thiếu fixture; negative only | backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/offer/OfferController.java:36 |
| API-079 | patch — public ApiResponse<OfferResponse> patch( @PathVariable UUID id, @Valid @RequestBody PatchOfferRequest command) | @PatchMapping("/offers/{id}") | JWT issuer + DB audit; Identity/Bakery/Subscription/Order/Cake AI theo typed client; không gọi cloud khi chưa có phép; Không mutate khi thiếu fixture; negative only | backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/offer/OfferController.java:42 |
| API-080 | withdraw — public ApiResponse<OfferResponse> withdraw( @PathVariable UUID id, @Valid @RequestBody ReasonRequest command) | @PostMapping("/offers/{id}/withdraw") | JWT issuer + DB audit; Identity/Bakery/Subscription/Order/Cake AI theo typed client; không gọi cloud khi chưa có phép; Không mutate khi thiếu fixture; negative only | backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/offer/OfferController.java:48 |
| API-081 | accept — public ApiResponse<AcceptanceResponse> accept( @PathVariable UUID id, @RequestHeader(value = "Idempotency-Key", required = false) String key, @Valid @RequestBody AcceptOfferRequest command) | @PostMapping("/offers/{id}/accept") | JWT issuer + DB audit; Identity/Bakery/Subscription/Order/Cake AI theo typed client; không gọi cloud khi chưa có phép; Không mutate khi thiếu fixture; negative only | backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/offer/OfferController.java:54 |
| API-082 | list — public ResponseEntity<ApiResponse<PageResult<BakeryPaymentDto>>> list( @RequestParam(required = false) PaymentStatus status, @RequestParam(required = false) UUID bakeryId, @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant submittedFrom, @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant submittedTo, @RequestParam(defaultValue = "1") int page, @RequestParam(defaultValue = "20") int size, @RequestParam(defaultValue = "submittedAt,asc") String sort) | @GetMapping | JWT issuer + DB audit; Identity/Bakery/Subscription/Order/Cake AI theo typed client; không gọi cloud khi chưa có phép; Synthetic fixture thật; status/schema/readback | backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/payment/controller/AdminBakeryPaymentController.java:36 |
| API-083 | approve — public ResponseEntity<ApiResponse<PaymentReviewResponse>> approve(@PathVariable UUID paymentId, @AuthenticationPrincipal Jwt jwt, @RequestHeader("Idempotency-Key") String idempotencyKey, @Valid @RequestBody ReviewPaymentRequest request) | @PostMapping("/{paymentId}/approve") | JWT issuer + DB audit; Identity/Bakery/Subscription/Order/Cake AI theo typed client; không gọi cloud khi chưa có phép; Không mutate khi thiếu fixture; negative only | backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/payment/controller/AdminBakeryPaymentController.java:49 |
| API-084 | reject — public ResponseEntity<ApiResponse<PaymentReviewResponse>> reject(@PathVariable UUID paymentId, @AuthenticationPrincipal Jwt jwt, @Valid @RequestBody ReviewPaymentRequest request) | @PostMapping("/{paymentId}/reject") | JWT issuer + DB audit; Identity/Bakery/Subscription/Order/Cake AI theo typed client; không gọi cloud khi chưa có phép; Không mutate khi thiếu fixture; negative only | backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/payment/controller/AdminBakeryPaymentController.java:57 |
| API-085 | submit — public ResponseEntity<ApiResponse<BakeryPaymentDto>> submit(@PathVariable UUID orderId, @AuthenticationPrincipal Jwt jwt, @RequestHeader("Idempotency-Key") String idempotencyKey, @Valid @RequestPart("metadata") BakeryPaymentDto request, @RequestPart(value = "proof", required = false) MultipartFile proof) | @PostMapping(consumes = "multipart/form-data") | JWT issuer + DB audit; Identity/Bakery/Subscription/Order/Cake AI theo typed client; không gọi cloud khi chưa có phép; Không mutate khi thiếu fixture; negative only | backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/payment/controller/BakeryPaymentController.java:30 |
| API-086 | options — public ApiResponse<PaymentOptions> options() | @GetMapping("/api/v1/subscription-plans/payment-options") | JWT issuer + DB audit; Identity/Bakery/Subscription/Order/Cake AI theo typed client; không gọi cloud khi chưa có phép; Synthetic fixture thật; status/schema/readback | backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/payment/controller/PaymentOptionsController.java:16 |
| API-087 | checkout — public ApiResponse<VnpayCheckoutResponse> checkout(@PathVariable UUID orderId, @AuthenticationPrincipal Jwt jwt, HttpServletRequest request) | @PostMapping("/api/v1/subscription-orders/{orderId}/vnpay/checkout") | JWT issuer + DB audit; Identity/Bakery/Subscription/Order/Cake AI theo typed client; không gọi cloud khi chưa có phép; Không mutate khi thiếu fixture; negative only | backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/payment/controller/VnpayController.java:26 |
| API-088 | ipn — public Map<String, String> ipn(@RequestParam MultiValueMap<String, String> parameters) | @GetMapping("/api/v1/payments/vnpay/ipn") | JWT issuer + DB audit; Identity/Bakery/Subscription/Order/Cake AI theo typed client; không gọi cloud khi chưa có phép; Không mutate khi thiếu fixture; negative only | backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/payment/controller/VnpayController.java:32 |
| API-089 | result — public ApiResponse<Map<String, String>> result(@RequestParam MultiValueMap<String, String> parameters) | @GetMapping("/api/v1/payments/vnpay/return") | JWT issuer + DB audit; Identity/Bakery/Subscription/Order/Cake AI theo typed client; không gọi cloud khi chưa có phép; Không mutate khi thiếu fixture; negative only | backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/payment/controller/VnpayController.java:38 |
| API-090 | list — public ApiResponse<PageResult<VnpayAttemptResponse>> list(@RequestParam(required = false) VnpayAttempt.Status status, @RequestParam(defaultValue = "1") int page, @RequestParam(defaultValue = "20") int size) | @GetMapping("/api/v1/admin/vnpay-attempts") | JWT issuer + DB audit; Identity/Bakery/Subscription/Order/Cake AI theo typed client; không gọi cloud khi chưa có phép; Synthetic fixture thật; status/schema/readback | backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/payment/controller/VnpayController.java:48 |
| API-091 | list — public ResponseEntity<ApiResponse<List<SubscriptionPlanDto>>> list() | @GetMapping | JWT issuer + DB audit; Identity/Bakery/Subscription/Order/Cake AI theo typed client; không gọi cloud khi chưa có phép; Synthetic fixture thật; status/schema/readback | backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/plan/controller/AdminSubscriptionPlanController.java:29 |
| API-092 | create — public ResponseEntity<ApiResponse<SubscriptionPlanDto>> create(@Valid @RequestBody SubscriptionPlanDto request) | @PostMapping | JWT issuer + DB audit; Identity/Bakery/Subscription/Order/Cake AI theo typed client; không gọi cloud khi chưa có phép; Synthetic fixture thật; status/schema/readback | backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/plan/controller/AdminSubscriptionPlanController.java:34 |
| API-093 | update — public ResponseEntity<ApiResponse<SubscriptionPlanDto>> update(@PathVariable UUID planId, @Valid @RequestBody SubscriptionPlanDto request) | @PatchMapping("/{planId}") | JWT issuer + DB audit; Identity/Bakery/Subscription/Order/Cake AI theo typed client; không gọi cloud khi chưa có phép; Synthetic fixture thật; status/schema/readback | backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/plan/controller/AdminSubscriptionPlanController.java:40 |
| API-094 | archive — public ResponseEntity<ApiResponse<SubscriptionPlanDto>> archive(@PathVariable UUID planId) | @PostMapping("/{planId}/archive") | JWT issuer + DB audit; Identity/Bakery/Subscription/Order/Cake AI theo typed client; không gọi cloud khi chưa có phép; Synthetic fixture thật; status/schema/readback | backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/plan/controller/AdminSubscriptionPlanController.java:46 |
| API-095 | list — public ResponseEntity<ApiResponse<List<SubscriptionPlanDto>>> list() | @GetMapping | JWT issuer + DB audit; Identity/Bakery/Subscription/Order/Cake AI theo typed client; không gọi cloud khi chưa có phép; Synthetic fixture thật; status/schema/readback | backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/plan/controller/SubscriptionPlanController.java:24 |
| API-096 | get — public ResponseEntity<ApiResponse<SubscriptionPlanDto>> get(@PathVariable UUID planId) | @GetMapping("/{planId}") | JWT issuer + DB audit; Identity/Bakery/Subscription/Order/Cake AI theo typed client; không gọi cloud khi chưa có phép; Synthetic fixture thật; status/schema/readback | backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/plan/controller/SubscriptionPlanController.java:29 |
| API-097 | get — public ResponseEntity<ApiResponse<BakerySubscriptionDto>> get(@PathVariable UUID bakeryId, @AuthenticationPrincipal Jwt jwt) | @GetMapping | JWT issuer + DB audit; Identity/Bakery/Subscription/Order/Cake AI theo typed client; không gọi cloud khi chưa có phép; Không mutate khi thiếu fixture; negative only | backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/subscription/controller/BakerySubscriptionController.java:25 |
| API-098 | entitlement — public ResponseEntity<EntitlementResponse> entitlement(@PathVariable UUID bakeryId) | @GetMapping("/{bakeryId}/entitlement") | JWT issuer + DB audit; Identity/Bakery/Subscription/Order/Cake AI theo typed client; không gọi cloud khi chưa có phép; Synthetic fixture thật; status/schema/readback | backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/subscription/controller/InternalSubscriptionController.java:22 |
| API-099 | list — public ApiResponse<PageResult<AdminSubscriptionOrderDto>> list(@Valid @ModelAttribute AdminSubscriptionOrderFilter filter) | @GetMapping("/api/v1/admin/subscription-orders") | JWT issuer + DB audit; Identity/Bakery/Subscription/Order/Cake AI theo typed client; không gọi cloud khi chưa có phép; Synthetic fixture thật; status/schema/readback | backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/subscriptionorder/controller/AdminSubscriptionOrderController.java:19 |
| API-100 | create — public ResponseEntity<ApiResponse<SubscriptionOrderDto>> create(@PathVariable UUID bakeryId, @AuthenticationPrincipal Jwt jwt, @RequestHeader("Idempotency-Key") String idempotencyKey, @Valid @RequestBody SubscriptionOrderDto request) | @PostMapping("/bakeries/{bakeryId}/subscription-orders") | JWT issuer + DB audit; Identity/Bakery/Subscription/Order/Cake AI theo typed client; không gọi cloud khi chưa có phép; Không mutate khi thiếu fixture; negative only | backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/subscriptionorder/controller/SubscriptionOrderController.java:33 |
| API-101 | list — public ResponseEntity<ApiResponse<PageResult<SubscriptionOrderDto>>> list(@PathVariable UUID bakeryId, @AuthenticationPrincipal Jwt jwt, @RequestParam(required = false) SubscriptionOrderStatus status, @RequestParam(defaultValue = "1") int page, @RequestParam(defaultValue = "20") int size, @RequestParam(defaultValue = "createdAt,desc") String sort) | @GetMapping("/bakeries/{bakeryId}/subscription-orders") | JWT issuer + DB audit; Identity/Bakery/Subscription/Order/Cake AI theo typed client; không gọi cloud khi chưa có phép; Không mutate khi thiếu fixture; negative only | backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/subscriptionorder/controller/SubscriptionOrderController.java:43 |
| API-102 | get — public ResponseEntity<ApiResponse<SubscriptionOrderDto>> get(@PathVariable UUID orderId, @AuthenticationPrincipal Jwt jwt) | @GetMapping("/subscription-orders/{orderId}") | JWT issuer + DB audit; Identity/Bakery/Subscription/Order/Cake AI theo typed client; không gọi cloud khi chưa có phép; Không mutate khi thiếu fixture; negative only | backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/subscriptionorder/controller/SubscriptionOrderController.java:55 |
| API-103 | get — public ApiResponse<GeneratedDesignResponse> get(@PathVariable UUID id) | @GetMapping("/generated-designs/{id}") | JWT issuer + DB audit; storage/provider hoặc RFQ context nếu generation; Không mutate khi thiếu fixture; negative only | backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/design/DesignController.java:20 |
| API-104 | pending — public ApiResponse<DesignService.DesignPage> pending( @RequestParam(defaultValue = "PENDING") String status, @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "20") int size) | @GetMapping("/admin/generated-designs") | JWT issuer + DB audit; storage/provider hoặc RFQ context nếu generation; Không mutate khi thiếu fixture; negative only | backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/design/DesignController.java:26 |
| API-105 | moderate — public ApiResponse<GeneratedDesignResponse> moderate(@PathVariable UUID id, @Valid @RequestBody ModerateDesignRequest request) | @PatchMapping("/admin/generated-designs/{id}/moderation") | JWT issuer + DB audit; storage/provider hoặc RFQ context nếu generation; Không mutate khi thiếu fixture; negative only | backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/design/DesignController.java:34 |
| API-106 | validate — public Map<String, Object> validate( @PathVariable UUID id, @RequestParam UUID customerId, @RequestParam UUID cakeRequestId) | @GetMapping("/generated-designs/{id}/validation") | JWT issuer + DB audit; storage/provider hoặc RFQ context nếu generation; Không mutate khi thiếu fixture; negative only | backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/design/DesignValidationController.java:18 |
| API-107 | context — public Map<String, Boolean> context(@PathVariable UUID id) | @GetMapping("/cake-requests/{id}/generation-context") | JWT issuer + DB audit; storage/provider hoặc RFQ context nếu generation; Không mutate khi thiếu fixture; negative only | backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/design/DesignValidationController.java:26 |
| API-108 | getFile — public ResponseEntity<byte[]> getFile() | @GetMapping("/storage/**") | JWT issuer + DB audit; storage/provider hoặc RFQ context nếu generation; Không mutate khi thiếu fixture; negative only | backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/design/PublicStorageController.java:11 |
| API-109 | create — public ResponseEntity<ApiResponse<GenerationJobResponse>> create( @Valid @RequestPart("metadata") CreateGenerationJobRequest request, @RequestPart(value = "sourceImages", required = false) List<MultipartFile> images, @RequestHeader("Idempotency-Key") String key) | @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE) | JWT issuer + DB audit; storage/provider hoặc RFQ context nếu generation; Không mutate khi thiếu fixture; negative only | backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/generation/GenerationController.java:19 |
| API-110 | list — public ApiResponse<GenerationReader.JobPage> list(@RequestParam(required = false) UUID cakeRequestId, @RequestParam(required = false) String status, @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "20") int size) | @GetMapping | JWT issuer + DB audit; storage/provider hoặc RFQ context nếu generation; Không mutate khi thiếu fixture; negative only | backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/generation/GenerationController.java:27 |
| API-111 | detail — public ApiResponse<GenerationReader.JobDetail> detail(@PathVariable UUID id) | @GetMapping("/{id}") | JWT issuer + DB audit; storage/provider hoặc RFQ context nếu generation; Không mutate khi thiếu fixture; negative only | backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/generation/GenerationController.java:34 |
| API-112 | revise — public ResponseEntity<ApiResponse<GenerationJobResponse>> revise(@PathVariable UUID id, @Valid @RequestBody CreatePromptRevisionRequest request, @RequestHeader("Idempotency-Key") String key) | @PostMapping("/{id}/prompt-revisions") | JWT issuer + DB audit; storage/provider hoặc RFQ context nếu generation; Không mutate khi thiếu fixture; negative only | backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/generation/GenerationController.java:40 |
| API-113 | cancel — public ApiResponse<GenerationJobResponse> cancel(@PathVariable UUID id) | @PostMapping("/{id}/cancel") | JWT issuer + DB audit; storage/provider hoặc RFQ context nếu generation; Không mutate khi thiếu fixture; negative only | backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/generation/GenerationController.java:46 |
| API-114 | getContext — public ResponseEntity<ApiResponse<OrderContextResponse>> getContext(@PathVariable UUID orderId) | @GetMapping("/{orderId}/context") | JWT issuer + DB audit; Identity/Bakery/Subscription/Order/Cake AI theo typed client; không gọi cloud khi chưa có phép; Không mutate khi thiếu fixture; negative only | backend/order-service/src/main/java/com/se193262/orderservice/feature/order/InternalOrderController.java:29 |
| API-115 | create — public org.springframework.http.ResponseEntity<OrderCreationResponse> create( @RequestHeader("Idempotency-Key") String key, @Valid @RequestBody CreateOfferOrderRequest command) | @PostMapping("/from-offer") | JWT issuer + DB audit; Identity/Bakery/Subscription/Order/Cake AI theo typed client; không gọi cloud khi chưa có phép; Không mutate khi thiếu fixture; negative only | backend/order-service/src/main/java/com/se193262/orderservice/feature/order/OfferOrderController.java:19 |
| API-116 | createDirectOrder — public ResponseEntity<ApiResponse<OrderResponse>> createDirectOrder( @RequestHeader("Idempotency-Key") UUID idempotencyKey, @AuthenticationPrincipal Jwt jwt, @Valid @RequestBody CreateDirectOrderRequest request) | @PostMapping("/direct") | JWT issuer + DB audit; Identity/Bakery/Subscription/Order/Cake AI theo typed client; không gọi cloud khi chưa có phép; Không mutate khi thiếu fixture; negative only | backend/order-service/src/main/java/com/se193262/orderservice/feature/order/OrderController.java:52 |
| API-117 | getOrders — public ResponseEntity<ApiResponse<PageResult<OrderSummaryResponse>>> getOrders( @AuthenticationPrincipal Jwt jwt, @RequestParam(defaultValue = "1") @Min(1) int page, @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size, @RequestParam(required = false) String scope, @RequestParam(required = false) UUID bakeryId, @RequestParam(required = false) OrderStatus status, @RequestParam(required = false) OrderSource orderSource, @RequestParam(required = false) Instant createdFrom, @RequestParam(required = false) Instant createdTo, @RequestParam(defaultValue = "createdAt,desc") String sort) | @GetMapping | JWT issuer + DB audit; Identity/Bakery/Subscription/Order/Cake AI theo typed client; không gọi cloud khi chưa có phép; Synthetic fixture thật; status/schema/readback | backend/order-service/src/main/java/com/se193262/orderservice/feature/order/OrderController.java:70 |
| API-118 | getOrder — public ResponseEntity<ApiResponse<OrderResponse>> getOrder( @PathVariable UUID orderId, @AuthenticationPrincipal Jwt jwt) | @GetMapping("/{orderId}") | JWT issuer + DB audit; Identity/Bakery/Subscription/Order/Cake AI theo typed client; không gọi cloud khi chưa có phép; Không mutate khi thiếu fixture; negative only | backend/order-service/src/main/java/com/se193262/orderservice/feature/order/OrderController.java:92 |
| API-119 | transitionOrder — public ResponseEntity<ApiResponse<OrderResponse>> transitionOrder( @PathVariable UUID orderId, @AuthenticationPrincipal Jwt jwt, @Valid @RequestBody TransitionOrderRequest request) | @PostMapping("/{orderId}/status-transitions") | JWT issuer + DB audit; Identity/Bakery/Subscription/Order/Cake AI theo typed client; không gọi cloud khi chưa có phép; Không mutate khi thiếu fixture; negative only | backend/order-service/src/main/java/com/se193262/orderservice/feature/order/OrderController.java:105 |
| API-120 | createReview — public ResponseEntity<ApiResponse<ReviewResponse>> createReview( @PathVariable UUID orderId, @AuthenticationPrincipal Jwt jwt, @Valid @RequestBody CreateReviewRequest request) | @PostMapping("/orders/{orderId}/review") | JWT issuer + DB audit; Identity/Bakery/Subscription/Order/Cake AI theo typed client; không gọi cloud khi chưa có phép; Không mutate khi thiếu fixture; negative only | backend/order-service/src/main/java/com/se193262/orderservice/feature/review/ReviewController.java:41 |
| API-121 | updateReview — public ResponseEntity<ApiResponse<ReviewResponse>> updateReview( @PathVariable UUID orderId, @AuthenticationPrincipal Jwt jwt, @Valid @RequestBody UpdateReviewRequest request) | @PatchMapping("/orders/{orderId}/review") | JWT issuer + DB audit; Identity/Bakery/Subscription/Order/Cake AI theo typed client; không gọi cloud khi chưa có phép; Không mutate khi thiếu fixture; negative only | backend/order-service/src/main/java/com/se193262/orderservice/feature/review/ReviewController.java:56 |
| API-122 | deleteReview — public ResponseEntity<Void> deleteReview( @PathVariable UUID orderId, @AuthenticationPrincipal Jwt jwt) | @DeleteMapping("/orders/{orderId}/review") | JWT issuer + DB audit; Identity/Bakery/Subscription/Order/Cake AI theo typed client; không gọi cloud khi chưa có phép; Không mutate khi thiếu fixture; negative only | backend/order-service/src/main/java/com/se193262/orderservice/feature/review/ReviewController.java:71 |
| API-123 | updateReviewStatus — public ResponseEntity<ApiResponse<ReviewResponse>> updateReviewStatus( @PathVariable UUID orderId, @Valid @RequestBody UpdateReviewStatusRequest request) | @PatchMapping("/admin/reviews/{orderId}/status") | JWT issuer + DB audit; Identity/Bakery/Subscription/Order/Cake AI theo typed client; không gọi cloud khi chưa có phép; Không mutate khi thiếu fixture; negative only | backend/order-service/src/main/java/com/se193262/orderservice/feature/review/ReviewController.java:85 |
| API-124 | list — public ResponseEntity<ApiResponse<PageResult<ConversationSummaryResponse>>> list( @AuthenticationPrincipal Jwt jwt, @RequestParam(required = false) ConversationStatus status, @RequestParam(required = false) UUID bakeryId, @RequestParam(defaultValue = "1") @Min(1) int page, @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size) | @GetMapping | JWT issuer + DB audit; Identity/Bakery/Subscription/Order/Cake AI theo typed client; không gọi cloud khi chưa có phép; Synthetic fixture thật; status/schema/readback | backend/chat-service/src/main/java/com/se193262/chatservice/feature/conversation/ConversationController.java:42 |
| API-125 | create — public ResponseEntity<ApiResponse<ConversationResponse>> create( @AuthenticationPrincipal Jwt jwt, @Valid @RequestBody CreateConversationRequest request) | @PostMapping | JWT issuer + DB audit; Identity/Bakery/Subscription/Order/Cake AI theo typed client; không gọi cloud khi chưa có phép; Không mutate khi thiếu fixture; negative only | backend/chat-service/src/main/java/com/se193262/chatservice/feature/conversation/ConversationController.java:60 |
| API-126 | get — public ResponseEntity<ApiResponse<ConversationResponse>> get( @PathVariable UUID conversationId, @AuthenticationPrincipal Jwt jwt) | @GetMapping("/{conversationId}") | JWT issuer + DB audit; Identity/Bakery/Subscription/Order/Cake AI theo typed client; không gọi cloud khi chưa có phép; Không mutate khi thiếu fixture; negative only | backend/chat-service/src/main/java/com/se193262/chatservice/feature/conversation/ConversationController.java:75 |
| API-127 | close — public ResponseEntity<ApiResponse<ConversationResponse>> close( @PathVariable UUID conversationId, @AuthenticationPrincipal Jwt jwt, @Valid @RequestBody(required = false) CloseConversationRequest request) | @PostMapping("/{conversationId}/close") | JWT issuer + DB audit; Identity/Bakery/Subscription/Order/Cake AI theo typed client; không gọi cloud khi chưa có phép; Không mutate khi thiếu fixture; negative only | backend/chat-service/src/main/java/com/se193262/chatservice/feature/conversation/ConversationController.java:83 |
| API-128 | list — public ResponseEntity<ApiResponse<MessagePageResponse>> list( @PathVariable UUID conversationId, @AuthenticationPrincipal Jwt jwt, @RequestParam(required = false) String before, @RequestParam(defaultValue = "30") @Min(1) @Max(100) int limit) | @GetMapping("/messages") | JWT issuer + DB audit; Identity/Bakery/Subscription/Order/Cake AI theo typed client; không gọi cloud khi chưa có phép; Không mutate khi thiếu fixture; negative only | backend/chat-service/src/main/java/com/se193262/chatservice/feature/message/MessageController.java:44 |
| API-129 | send — public ResponseEntity<ApiResponse<MessageResponse>> send( @PathVariable UUID conversationId, @AuthenticationPrincipal Jwt jwt, @Valid @RequestPart("metadata") MessageMetadata metadata, @RequestPart(value = "files", required = false) List<MultipartFile> files) | @PostMapping(value = "/messages", consumes = "multipart/form-data") | JWT issuer + DB audit; Identity/Bakery/Subscription/Order/Cake AI theo typed client; không gọi cloud khi chưa có phép; Không mutate khi thiếu fixture; negative only | backend/chat-service/src/main/java/com/se193262/chatservice/feature/message/MessageController.java:55 |
| API-130 | markRead — public ResponseEntity<ApiResponse<ReadMessagesResponse>> markRead( @PathVariable UUID conversationId, @AuthenticationPrincipal Jwt jwt, @Valid @org.springframework.web.bind.annotation.RequestBody ReadMessagesRequest request) | @PostMapping("/read") | JWT issuer + DB audit; Identity/Bakery/Subscription/Order/Cake AI theo typed client; không gọi cloud khi chưa có phép; Không mutate khi thiếu fixture; negative only | backend/chat-service/src/main/java/com/se193262/chatservice/feature/message/MessageController.java:71 |
| API-131 | delete — public ResponseEntity<Void> delete( @PathVariable UUID conversationId, @PathVariable UUID messageId, @AuthenticationPrincipal Jwt jwt) | @DeleteMapping("/messages/{messageId}") | JWT issuer + DB audit; Identity/Bakery/Subscription/Order/Cake AI theo typed client; không gọi cloud khi chưa có phép; Không mutate khi thiếu fixture; negative only | backend/chat-service/src/main/java/com/se193262/chatservice/feature/message/MessageController.java:81 |

## Phụ lục B. Lệnh native đã thực thi và công cụ tái hiện

Tất cả script sau nằm ngoài repository tại temp path của campaign; chúng không sửa source/config. Những lệnh dưới đã dùng thực tế. Không tự chạy lại create fixtures trên dataset hiện hữu hoặc giả định các script sẽ cho FULL PASS. Runtime launcher có stop marker và database manifest của campaign; muốn chạy campaign mới phải chọn thư mục/database audit mới, không reset database cũ.

```powershell
$repo = "H:\MSS\Bakery-Platform"
$auditTemp = "C:\Users\phuck\AppData\Local\Temp\bakery-native-audit-20261111-144126"

# Read-only preflight; không in full process command line/env.
java -version
mvn -version
Get-Service -Name postgresql-x64-18
Get-NetTCPConnection -State Listen | Where-Object { $_.LocalPort -ge 8080 -and $_.LocalPort -le 8087 } | Select-Object LocalPort,OwningProcess
python "$auditTemp\db_preflight.py"

# Exact working-tree snapshot + baseline; chỉ dùng khi bắt đầu campaign mới.
python "$auditTemp\baseline.py"
Set-Location "$auditTemp\snapshot\backend"
mvn -B -ntp -DskipTests package
$allow = Get-Content "$auditTemp\test-allowlist.txt"
mvn -B -ntp test "-Dtest=$allow" "-Dsurefire.failIfNoSpecifiedTests=false"

# Chỉ native dependency/DB audit; script có xác minh target và credential hiện có.
python "$auditTemp\native_data.py" before
python "$auditTemp\native_data.py" create
python "$auditTemp\runtime.py"
# runtime.py: Identity8081 -> Bakery8082 -> Marketplace8083 -> Subscription8084
# -> CakeAI8085 -> Order8086 -> Chat8087 -> Gateway8080
# Mỗi child: java -Xms64m -Xmx256m -jar <JAR trong snapshot/target>
# Parent env không thay đổi; 8 child env độc lập; native DB endpoint override.

# Ở terminal khác sau readiness, các script dùng synthetic accounts/DPAPI.
python "$auditTemp\http_audit.py"
python "$auditTemp\swagger_audit.py"
python "$auditTemp\coverage_audit.py"
python "$auditTemp\catalog_audit.py"
python "$auditTemp\followup_checks.py"
python "$auditTemp\equivalence_audit.py"
python "$auditTemp\config_auth_checks.py"
python "$auditTemp\expiry_audit.py"

# Probe read-only không cần credential.
curl.exe -sS -o NUL -w "%{http_code}" http://localhost:8081/v3/api-docs
curl.exe -sS -o NUL -w "%{http_code}" http://localhost:8080/identity/v3/api-docs
curl.exe -sS -o NUL -w "%{http_code}" http://localhost:8080/bakery/api/v1/products

# Dừng qua manager, không kill mọi java.exe hoặc PID ngoài audit.
New-Item -ItemType File -Path "$auditTemp\STOP_RUNTIME" -Force | Out-Null
# Chờ manager thoát rồi kiểm tra port/PID; PostgreSQL có sẵn vẫn Running.
python "$auditTemp\native_data.py" after
python "$auditTemp\integrity_check.py"
```

Đoạn dotenv process-scoped thực tế trong inspect_config.py/runtime.py dùng `dotenv.parser.parse_stream`, kiểm tra `binding.error`/regex tên, last assignment, chỉ intersect placeholder YAML; child `subprocess.Popen(..., env=penv, cwd=<temp/runtime/service>, creationflags=CREATE_NO_WINDOW)`. Không execute file env. Password ở env dictionary, không trong args; log qua sanitizer, JWT/cookie/presigned query được redact. Các script riêng theo dõi DPAPI state, không lưu raw token/password vào report/response ledger.

PowerShell chấm trong `-D...` được quote như lệnh Maven phía trên; không dùng lệnh lỗi ban đầu. File STOP_RUNTIME hiện tồn tại sau cleanup nên `runtime.py` không phải lệnh restart duy trì hoạt động nguyên trạng; phải dùng audit directory mới hoặc thao tác reset riêng marker temp trong một campaign được ủy quyền. Các lệnh manual java không có secure env loader **chưa được thử độc lập**, không được giới thiệu là đủ cấu hình.

## Phụ lục C. Evidence, IDs retained và provenance

| Artifact ngoài repository | Nội dung |
|---|---|
| baseline.private.json | HEAD/status và file hash baseline; metadata nhạy cảm không copy vào report |
| source-manifest.json | 688 text file đã đọc, hash/line; test dependency classification |
| inventory.json | 131 operation độc nhất source |
| verification-matrix.json | Terminal, status/evidence và OpenAPI contract từng operation |
| http-events.jsonl | Ledger HTTP đã redact; timestamp/correlation/status/content type |
| initial-probes.json | 40 probe framework direct/Gateway entry |
| swagger-results.json | Direct/proxy spec, schema/security/server metadata |
| openapi-ref-validation.json | Kiểm tra reference local của6 JSON spec |
| equivalence-results.json | 16 cặp direct/Gateway cùng ID |
| config-sanitized.json | Tên biến và property binding; secret redacted |
| config-auth-results.json | Issuer probes theo native effective config |
| runtime-processes.json | PID, JAR hash, injected variable names, exit codes |
| jars.json | JarLauncher/Start-Class/Boot version/dependency count |
| build.log | Build reactor |
| tests.log | Maven allowlist run |
| automated-tests.json | 194 tests, suite/module counters |
| isolated-persistence.json | SELECT count(*) read-only trên DB audit |
| expiry-results.json | JWT expired thật; không lưu JWT |
| process-cleanup.json | Chỉ audit-owned process được dừng và port restore |
| integrity-results.json | Protected file/Git/secret metadata/data comparison |

Log theo service: `<module>.runtime.log`, sanitized ngoài repo; không upload vào Git. Source snapshot có đúng uncommitted changes khi bắt đầu, không chỉ HEAD. DB synthetic và credential DPAPI giữ ngoài source; report không chứa giá trị bí mật.

| Fixture | UUID thật / ghi chú |
|---|---|
| address | 9ec69339-7ed2-4491-8818-d775b02cf639 |
| address_gateway | a1858bb5-e206-43ad-b43d-6a39aee16e8c |
| plan | 39520e97-e25c-4d0f-b603-15f6123c3e4d |
| plan_gateway | 1ae80863-dd33-483b-937b-0e9a3d40d14d |
| rfq | 8c04a9df-2c83-4a9d-8e5c-d0262b8ce45f |
| rfq_gateway | ac28466c-283a-44d8-9435-3dc0718e4a5a |
| bakery | 89fce42d-bcc0-4b16-9f81-5ea696f33aeb |
| category | 73e1b284-3594-4203-ab56-f361123a68e3 |
| addon | 9b8e73ba-e455-42e6-bb73-b30af555f623 |
| product | 6fca9e85-2a3b-4835-9db4-df620ba01631 |
| checkout_address | 3fb4d554-9485-4b8d-aef2-21c27a2fd5d0 |
| journey_rfq | 873a7de2-fd03-44ca-b095-5c272478d87a |
| bakery_gateway | dd0cfac4-6857-44d7-9980-0fe858a98f7e |
| category_gateway | 59a3b808-8b1a-47e1-8ad0-b80029ae0cbe |
| addon_gateway | 9344e28c-eb78-49d9-92a3-331ac329c4cb |
| product_gateway | 46d5434a-28ac-4f76-9e53-4f587c393fad |
| checkout_address_gateway | 50fe03b8-0fc7-495e-b310-7cbc5d2b100b |
| journey_rfq_gateway | 6a253be7-58cb-41cd-817f-6ebcfa5fc694 |
| journey_plan | abd8eea6-aef7-44f5-a824-98c472d397b1 |
| journey_plan_gateway | 1da4dc6d-174b-412f-863a-f3b753b3bd6a |

Ma trận HTTP dùng response body đã redact, không chứa API key, password, JWT, refresh cookie hoặc signed URL. IDs retained không phải bí mật xác thực; không lấy historical IDs làm bằng chứng mới.
