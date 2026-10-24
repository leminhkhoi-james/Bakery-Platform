# Project Status

> Cập nhật gần nhất: 2026-10-24.

## JWT runtime — 2026-10-24

- Cặp PEM mới trong Identity đã được kiểm tra khớp nhau; root/local env trỏ
  đúng file. Live JWK của Identity khớp public PEM. PEM/key files bị Git ignore
  và loại khỏi cả hai Docker build context; private key chỉ mount vào Identity.
- Bakery/Subscription tự lấy và cache service JWT 5 phút từ Identity bằng
  client secret riêng, với grant giới hạn theo target/scope. Không chia sẻ private
  key và không cần paste bearer token ngắn hạn vào env cho luồng mặc định.
- Identity internal user lookup đã bổ sung email/roles theo spec; thiếu roles
  trước đó gây 422 khi Bakery thêm nhân viên dù JWT hợp lệ.
- Stack 7 domain service + 7 PostgreSQL + 3 MinIO đã build và chạy. Compose runtime
  wiring ở `compose.services.yaml`; chế độ `compose.no-firebase.yaml` cho phép chạy
  Marketplace khi chưa có JSON credential, riêng image operations chưa khả dụng.
- `scripts/Test-LocalJwt.ps1` pass trên HTTP thật: JWK/public PEM, register/login,
  Bakery member lookup qua Identity, Subscription owner validation qua Bakery,
  gửi reference payment/ADMIN approval, Bakery đọc active entitlement, user JWT
  tại Marketplace/Order/Chat và service JWT tại Cake AI. Token sửa chữ ký, sai
  audience và user không sở hữu bakery bị từ chối. Script đã xóa dữ liệu thử.
- Test JWT/security/storage/routing chọn lọc pass. API Gateway vẫn là scaffold;
  chưa có routing runtime. Chưa kiểm thử Firebase upload hay AI generation.
- Local Identity/Marketplace dùng PostgreSQL 16 sẵn có với volume mới; cấu hình
  mặc định của root Compose vẫn là PostgreSQL 17. Không đổi major version trên
  volume đã khởi tạo. Docker images dùng Java 21 và Maven dependency cache chung.

## Sửa lỗi sau merge — 2026-10-24

- Bakery bổ sung dependency platform-support; Bakery/Subscription bổ sung
  Testcontainers dependencies cho context tests đã merge.
- Bakery profile/member và Subscription entitlement có một controller sở hữu mỗi
  URI. Subscription giữ SecurityConfig/JwtDecoderConfig riêng, không import thêm
  PlatformConfiguration gây trùng bean hoặc thay đổi kiểm tra quyền.
- Marketplace customization quote chuyển sang `/internal/v1/catalog/customization-quotes`;
  Order giữ `/internal/v1/catalog/quotes`. Các route bổ sung được bảo vệ theo scope.
- Bakery xử lý platform business exception đúng HTTP status và AccessDenied 403.
- Bakery/Subscription/Order xuất plain jar và executable `-exec.jar`; Dockerfiles
  dùng executable jar để integration-tests vẫn import được application classes.
- Maven test-compile và package toàn reactor pass. Test JWT/security của Identity,
  Bakery/Subscription, signed URL storage và 3 routing regression tests pass.
  Docker Compose config pass; chưa xác nhận runtime Docker/Firebase trong phiên này.
- Docker Bakery/Subscription mặc định tìm Identity qua host port 8081 theo root
  compose.yaml. Root .env và Identity local .env là hai cấu hình riêng; secrets
  thực tế chỉ lưu trong file bị Git ignore. Firebase JSON local chưa có nên
  Marketplace upload còn chờ credential của project nhóm.
- Cặp Marketplace secret/hash được cung cấp không khớp; local hash được tạo lại
  và đồng bộ giữa root Compose env với Identity local env, không ghi vào Git.

## Đã hoàn thành

- Thiết kế database cho bảy bounded context tại `database/postgresql/`.
- ERD, database documentation, architecture và API contract mục tiêu.
- Chuyển `backend/` từ một bootstrap application thành Maven multi-module
  reactor.
- Scaffold tám Spring Boot application độc lập:
  - `identity-service`
  - `bakery-service`
  - `marketplace-service`
  - `order-service`
  - `chat-service`
  - `cake-ai-service`
  - `subscription-service`
  - `api-gateway`
- Tạo package xương sống cho mỗi domain service: `config`, `security`,
  `exception`, `shared.dto`, `feature` và `infrastructure`.
- Tách package feature theo bounded context/API contract và thêm `CONTEXT.md`
  mô tả responsibility, trạng thái cùng boundary của từng feature.
- Tạo application-context smoke test cho từng module.
- Hoàn thiện nền tảng authentication của Identity Service:
  - persistence cho user, customer profile, platform role và refresh token;
  - register, login, refresh rotation/reuse detection, logout và `/auth/me`;
  - RS256 access token, external PEM key pair và public JWK Set;
  - phân tách user JWT/service JWT, role/scope authorization và JSON 401/403;
  - Flyway runtime migrations đồng bộ với canonical Identity DDL.
- Chốt ADR-001 cho JWT signing, refresh session và internal authentication.
- Order Service đã có runtime JPA/PostgreSQL/Flyway, Resource Server nền tảng,
  typed clients tới Identity/Bakery/Marketplace và Swagger UI.
- Hoàn thiện tạo order trực tiếp từ catalog và tạo order từ accepted offer:
  snapshot địa chỉ/items, kiểm tra authoritative quote/offer data, idempotency
  key + payload fingerprint và lưu ban đầu trong transaction Order DB.
- Hoàn thiện Order/Review API: lọc/pagination danh sách, xem snapshot, fulfillment
  state machine + history, internal order context và review lifecycle/moderation.
- Order Service validates RS256 JWTs through Identity JWKs, maps platform roles
  and service scopes, protects public/internal routes, checks order ownership,
  and verifies active Bakery membership for bakery access.
- Order obtains cached five-minute service JWTs from Identity for Identity,
  Bakery and Marketplace clients; Identity grants Order only the required scopes.
- Chat Service has runtime JPA/PostgreSQL/Flyway, Swagger/OpenAPI and a
  non-root Docker image with Compose-managed PostgreSQL and MinIO.
- Chat conversation and message APIs implement participant/membership checks,
  Marketplace context authorization, cursor pagination, idempotent sends,
  attachment validation and signed URLs, soft-delete tombstones, and read/unread
  receipts. Chat obtains short-lived service JWTs from Identity and calls the
  scoped Marketplace/Bakery authorization APIs; protected internal routes remain
  deny-by-default.
- Thêm Order V2/V3 migrations cho `customer_note`, idempotency records và
  accepted-offer idempotency; cập nhật canonical DDL, ERD và database docs.
- Bakery Service đã có JPA/PostgreSQL/Flyway dependencies, runtime V1 migration
  và entity mapping cho 11 bảng trong `bakery_db`, đặt trong từng
  `feature/<feature>/entity`.
- Bakery Service đã có 11 Spring Data repository interface và 11 service
  interface tương ứng với 11 bảng; Bakery profile đã có một số query đọc cấu
  hình hoạt động.
- Bakery profile có API tạo, public đọc theo ID, cập nhật và thay thế cấu hình
  hoạt động cùng `ApiResponse`.
- Bakery Service có API dữ liệu theo spec cho category, add-on, member và product
  management: list/create/patch/delete nơi contract có quy định, cùng PUT thay
  toàn bộ product options. Controller dùng `ResponseEntity`, lỗi đi qua
  `GlobalExceptionHandler`; category delete xóa tham chiếu trên product,
  add-on delete chuyển `active=false`.
- Subscription Service có Spring Web/JPA/Validation/Flyway/PostgreSQL, runtime
  migration V1–V3 và entity mapping cho năm bảng trong `subscription_db`.
  PostgreSQL local đã có database riêng và `.env` riêng của module.
- Subscription Service có API dữ liệu cho public/admin plan, subscription order,
  gửi payment bằng mã giao dịch, admin payment queue và đọc kỳ subscription.
  Create order/payment dùng `Idempotency-Key`; controller trả `ResponseEntity`
  và lỗi qua `GlobalExceptionHandler`. Bakery membership được kiểm tra qua
  internal API khi có service JWT hợp lệ; thiếu credential thì trả `503`.
- Bakery và Subscription đã cấu hình OAuth2 Resource Server xác thực JWT của
  Identity qua JWK/issuer/audience. SecurityFilterChain kiểm tra `token_type=user`,
  platform role và trả ApiResponse cho 401/403; các internal API không được
  khai báo vẫn deny-by-default.
  Bakery còn kiểm tra member ACTIVE và member role của đúng bakery cho các route
  quản lý đã triển khai. User ID khi tạo bakery/order và gửi payment lấy từ JWT
  `sub`, không còn nhận từ `X-User-Id`.
- Bakery Service chạy local trên port `8082` (override bằng `SERVER_PORT`),
  Subscription Service trên `8084`. Bakery có `.env.example`, Dockerfile và
  Compose riêng với PostgreSQL/MinIO.
- Bakery có public bakery/product catalog, signed media URLs, upload logo/cover/
  add-on/product images, submit/approve/suspend/close bakery, publish/hide/archive
  product, admin bakery list/detail/status và ba internal endpoints cho profile,
  membership authorization và catalog quote. Management routes đã bật ở mọi
  profile; JWT user/service audience, scope và `X-Correlation-Id` bảo vệ internal.
- Bakery outbound clients tới Identity user lookup và Subscription entitlement
  đã được nối theo API spec và fail closed khi thiếu service token/remote API.
  Quy tắc MANAGER chỉ được thêm/sửa/xóa STAFF đã được áp dụng.
- Subscription Service đã nối Bakery membership/existence validation, MinIO proof
  upload và signed URL, admin approve/reject payment, snapshot plan features,
  tạo/gia hạn kỳ sử dụng, scheduler activate/expire và internal entitlement API.
  Các route đã bật trong profile `prod`; JWT service audience/scope bảo vệ
  internal endpoint. Có Dockerfile và Compose riêng cho DB/MinIO/service.
- Bakery và Subscription có Compose chung `docker-compose.bakery-subscription.yml`,
  gọi nhau bằng container DNS; mỗi service giữ PostgreSQL/MinIO và volume riêng.
  Cấu hình mẫu ở `docker.env.example`, hướng dẫn tại
  `docs/DOCKER-BAKERY-SUBSCRIPTION.md`. MinIO public URL signing cấu hình region
  để không truy vấn region qua địa chỉ localhost của container.

## Đã kiểm tra

- `mvn test` tại `backend/` trước khi thêm Bakery persistence: **BUILD SUCCESS**.
- Maven reactor nhận đủ parent và tám application modules.
- 19 Identity unit/configuration tests pass, không có failure hoặc error.
- 5 Identity PostgreSQL/MockMvc integration tests được cấu hình bằng
  Testcontainers và tự skip khi Docker daemon không chạy.
- Order Service unit tests cover direct/offer creation, state transitions và
  review lifecycle; Testcontainers covers Flyway V1/V2, Hibernate validation,
  and HTTP/OpenAPI routes when Docker daemon is available. Latest run:
  14 tests, 11 passed and 3 Docker-dependent tests skipped.
- Chat Service tests: 10 total, 6 passed and 4 PostgreSQL/HTTP Testcontainers
  tests skipped because Docker is unavailable. Marketplace reactor tests: 33 total,
  16 passed and 17 Docker-dependent HTTP tests skipped; all 3 new chat
  authorization tests passed.
- Combined Identity/Marketplace/Bakery/Chat Compose configuration validates;
  runtime service-to-service HTTP has not been exercised because Docker is unavailable.
- `mvn -pl bakery-service -am -DskipTests compile`: **BUILD SUCCESS**.
- `mvn test` tại `backend/bakery-service/` với PostgreSQL local: smoke test pass;
  Flyway xác nhận V1, Hibernate `ddl-auto=validate` chấp nhận 11 entity và
  Spring Data phát hiện đủ 11 repository interface.
- `BakeryCrudIntegrationTests` với PostgreSQL local: tạo bakery/member OWNER,
  thay thế và xóa cấu hình hoạt động, cập nhật và đọc lại hồ sơ; test rollback.
- `BakeryCatalogIntegrationTests` với PostgreSQL local: tạo category/add-on/
  product/member, lọc product, thay options giữ ID, chặn ID lạ, xóa category
  mà giữ product; test rollback.
- Subscription Service context test: Flyway áp dụng V1–V3 lên PostgreSQL local,
  Hibernate `ddl-auto=validate` và 4 repository khởi động thành công.
- `SubscriptionDataIntegrationTests` với PostgreSQL local: tạo plan/order/payment,
  kiểm tra snapshot giá, pagination/filter, idempotency và archive; test rollback.
- 6 SecurityConfig Web MVC tests của Bakery/Subscription pass: 401, role/token
  type, Bakery membership và public subscription plans.
- Ngày 2026-10-21, Subscription tests pass; Bakery compile và SecurityConfig tests
  pass. Bakery DB integration tests không kết nối được PostgreSQL local trong lần
  chạy này.
- Bakery compile thành công sau phần catalog/media/internal. Hai domain lifecycle
  tests, hai quote tests và năm SecurityConfig tests pass; Maven package và Docker Compose config
  hợp lệ. PostgreSQL
  local port 5432 hiện không mở nên chưa chạy lại integration tests; Docker daemon
  cũng chưa sẵn để chạy stack.
- Subscription package và Docker Compose config hợp lệ; 2 payment review tests,
  1 lifecycle job test cùng 4 security route tests pass ngày 2026-10-23.
  PostgreSQL local port 5432 và Docker daemon hiện không chạy nên chưa xác nhận
  Flyway V4/JPA/HTTP end-to-end.
- Ngày 2026-10-23, Maven package Bakery/Subscription và Compose chung config pass.
  Hai storage URL tests pass, xác nhận ký URL public mà không gọi localhost từ
  container để lấy region.
- Stack Docker chung đã build và chạy đủ 6 container. Bakery Flyway V1 và
  Subscription V1–V4 được áp dụng thành công; Hibernate validate schema pass.
  Hai API OpenAPI và public plan trả 200, admin không token trả 401, MinIO health
  của cả hai trả 200. HTTP qua container DNS hai chiều trả 200.
  Bakery CRUD và Subscription data/payment approval integration tests pass trên
  PostgreSQL Docker (profile test; Bakery client được mock trong test Subscription).
  Identity port 8080 chưa chạy nên chưa xác nhận luồng HTTP có user/service JWT thật.
  Image MinIO cũ không tải được từ Docker Hub/Quay; stack build cùng release từ
  mã nguồn chính thức qua `docker/minio/Dockerfile`.

## Chưa triển khai

- Bakery admin detail có danh sách member và subscription summary khi remote
  service khả dụng; public catalog chưa kèm rating Order. Chưa có end-to-end test với
  PostgreSQL/MinIO/Identity/Subscription và chưa có job retry cleanup ảnh mồ côi.
- Luồng Subscription reference payment/JWT đã kiểm thử HTTP với Identity/Bakery;
  upload proof lên MinIO và các luồng ngoài phạm vi script vẫn cần HTTP end-to-end.
- Cake AI and API Gateway still need their remaining runtime/domain features.
- Runtime integration still requires deployment configuration for service client
  secrets/hashes and dependent service URLs. Identity issues scoped tokens;
  Chat's credentials/grants are configured for Marketplace and Bakery.
- Gateway routing/filter implementation và lựa chọn gateway dependency.
- REST clients, timeout/error mapping, object storage và scheduler trong các
  service còn lại.
- Docker Compose tổng thể, frontend và external AI provider integration.
- Các ADR chưa chốt ngoài quyết định JWT/internal authentication.

## Vấn đề đã biết

- `backend/mvnw.cmd test` hiện lỗi trong Maven Wrapper PowerShell script tại
  bước xử lý thư mục `.m2`; build đã được xác minh bằng Maven cài trên máy.
- Cảnh báo Mockito self-attaching xuất hiện trên Java 21 nhưng không làm test
  thất bại; cần cấu hình Java agent khi dự án nâng mức kiểm soát test runtime.
- Springdoc hiện phát warning khi chuyển một số JSON schema annotation; endpoint
  `/v3/api-docs` và kiểm tra route vẫn pass.
- Docker hiện hoạt động; các service khác cần chạy lại Testcontainers đã skip
  trong các phiên trước khi xác minh full HTTP flow.
- Bakery smoke test hiện cần PostgreSQL local và `.env` trong thư mục module;
  chưa có test profile/Testcontainers độc lập cho Maven reactor.
- Subscription smoke/integration test hiện cũng cần PostgreSQL local và `.env`
  trong thư mục module; chưa có test profile/Testcontainers độc lập.
- Bakery member creation có Identity lookup client nhưng Identity chưa triển khai
  internal user endpoint. Bakery/Subscription đều đã có internal contracts nhưng
  còn thiếu service JWT hợp lệ nên các luồng phụ thuộc trả `503`.
- Compose của Order/Chat hiện mặc định trỏ Identity tới port `8081`, trong khi
  Identity local/Bakery mặc định dùng `8080`; cần thống nhất URL khi ghép stack.
- Subscription V4 và luồng persistence đã xác minh trên PostgreSQL Docker;
  luồng HTTP với Identity/Bakery JWT thật vẫn cần kiểm thử khi Identity chạy.
- Bakery runtime V1 khác bản canonical ở phần thụt lề. Flyway đã áp dụng bản
  runtime, nên không sửa trực tiếp V1 sau khi chạy nếu chưa xử lý checksum.
