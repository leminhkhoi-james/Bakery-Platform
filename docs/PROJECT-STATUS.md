# Project Status

> Cập nhật gần nhất: 2026-10-21.

## Đã triển khai

- Maven reactor gồm tám application, platform-support kỹ thuật và integration-tests.
- Identity authentication RS256/JWK, refresh rotation và platform RBAC giữ nguyên.
- Identity bổ sung service JWT (client credential + BCrypt hash + audience/scope allow-list,
  TTL 5 phút), internal user/address snapshots và Actuator readiness.
- Marketplace có 15 API public và 2 API internal: request lifecycle, preferences/option snapshots,
  selected-design validation, authorized pagination, offers và acceptance.
- Firebase Storage adapter: backend upload, MIME/size validation, object metadata, signed GET URL
  15 phút, cleanup khi DB/upload lỗi và orphan cleanup sau 24 giờ.
- Acceptance workflow bền vững với reservation, optimistic locking, payload-bound idempotency,
  worker lease và retry sau timeout/restart; không giữ transaction khi gọi Order.
- API internal có DB thật ở Bakery (profile/membership/quotes), Subscription (entitlement),
  Cake AI (design/job context) và Order (accepted-offer snapshot + persisted idempotency).
- PostgreSQL/Flyway/resource-server cho các service liên quan; entity Marketplace đồng bộ 8 bảng
  ban đầu và workflow mới. Order bổ sung creation-key table bằng V2.
- Dockerfile multi-stage non-root cho Identity/Marketplace, Compose cùng hai PostgreSQL riêng,
  healthcheck, read-only secret mounts và .env.example.
- Fixture dev/test tách khỏi migration production; test REST xuyên sáu service dùng JWT thật.
- Hướng dẫn Firebase/Docker, ADR-002, API/schema/ERD/feature context được cập nhật.

## Kiểm chứng trong phiên hiện tại

- Maven reactor compile/package (`mvn -q -DskipTests package`): pass.
- **66 tests đã pass, 0 failure/error/skip**: full reactor và các lần chạy targeted bổ sung.
  Gồm unit/config/client/migration sync, PostgreSQL/MockMvc, race accept/cancel/upload,
  entitlement-cache expiry và retry/recovery.
- Hai luồng OPEN_CUSTOM và TARGETED_PRODUCT_CUSTOM chạy qua REST thật của sáu service,
  JWT/JWK/service credentials thật, sáu PostgreSQL database riêng trong test harness.
- Order replay vẫn trả cùng order sau khi xóa địa chỉ nguồn; thay đổi catalog/profile không
  thay đổi snapshot tên/giá của order đã tạo.
- Dockerfile Identity/Marketplace đều build thành công; runtime UID của cả hai là **10001**.
- Compose config validation pass. Smoke stack riêng dùng đúng image PostgreSQL chính thức,
  cả bốn container healthy; register/login, user JWT, service token/grants, request create/publish,
  ownership 403, invalid JWT 401 và missing dependency 503 đều pass qua HTTP trên Docker.
- Firebase credentials lỗi trả 503 đúng dự kiến; **chưa thử Firebase bucket thật** vì cần credentials
  và project/bucket của người dùng.
- Đã down/up smoke stack và cả bốn container healthy trở lại, giữ nguyên named volumes và keys.
  Bước gọi lại API để xác nhận dữ liệu/JWT sau recreate **chưa chạy vì quyền thực thi bị từ chối**;
  không tính bước đó là pass.
- Native PostgreSQL tests dùng image kiểm thử PostgreSQL 17.11 trên Alpine do Docker Hub ban đầu
  timeout; Docker smoke sau đó đã chạy được với image `postgres:17-alpine` chính thức.

## Giới hạn và công việc còn lại

- Compose hiện chỉ chạy Identity và Marketplace. Các service hỗ trợ cần chạy riêng hoặc dùng
  harness integration-tests cho luồng đầy đủ.
- Public CRUD/admin của Bakery, Subscription, Cake AI và Order chưa nằm trong phạm vi này;
  chỉ có API internal cần cho Marketplace. Direct catalog order và AI provider vẫn chưa làm.
- Catalog quote hiện triển khai contract cần cho custom requests/add-ons; quote đầy đủ cho
  direct catalog order là phần mở rộng sau (đã ghi rõ trong API_SPEC).
- Frontend, Gateway routing và Chat vẫn chưa triển khai.
- Docker Hub ban đầu timeout/tải chậm; đã khắc phục đủ để build và chạy smoke test bằng image chính thức.
- Maven Wrapper PowerShell có vấn đề đã biết; phiên này dùng Maven cài sẵn.

## Cập nhật Swagger Marketplace — 2026-10-21

- Marketplace đã tích hợp Springdoc OpenAPI UI, công khai riêng các đường dẫn tài liệu
  `GET /swagger-ui/**` và `GET /v3/api-docs/**`, đồng thời khai báo Bearer JWT để dùng nút
  Authorize. API nghiệp vụ vẫn giữ nguyên yêu cầu xác thực.
- Regression test Swagger/OpenAPI riêng đã pass và container Compose đã được rebuild; kiểm tra
  runtime xác nhận Swagger UI trả HTTP 200, OpenAPI 3.1.0 và security scheme là bearer.
- Khi chạy toàn bộ `MarketplaceServiceApplicationTests`, 16/17 test pass; test concurrency cũ
  `acceptOffer_concurrentCancel_onlyOneTransitionWins` gặp deadlock/race và fail ở kỳ vọng status.
  Lỗi này không xuất hiện trong regression test Swagger riêng.
