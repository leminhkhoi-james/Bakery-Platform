# Project Status

> Cập nhật gần nhất: 2026-10-21.

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
- Chat Service has runtime JPA/PostgreSQL/Flyway, Swagger/OpenAPI and a
  non-root Docker image with Compose-managed PostgreSQL and MinIO.
- Chat conversation and message APIs implement participant/membership checks,
  Marketplace context authorization, cursor pagination, idempotent sends,
  attachment validation and signed URLs, soft-delete tombstones, and read/unread
  receipts. Protected internal routes remain deny-by-default.
- Thêm Order V2 migration cho `customer_note` và idempotency records; cập nhật
  canonical DDL, ERD và database documentation.

## Đã kiểm tra

- `mvn test` tại `backend/`: **BUILD SUCCESS**.
- Maven reactor nhận đủ parent và tám application modules.
- 19 Identity unit/configuration tests pass, không có failure hoặc error.
- 5 Identity PostgreSQL/MockMvc integration tests được cấu hình bằng
  Testcontainers và tự skip khi Docker daemon không chạy.
- Order Service unit tests cover direct/offer creation, state transitions và
  review lifecycle; Testcontainers covers Flyway V1/V2, Hibernate validation,
  and HTTP/OpenAPI routes when Docker daemon is available. Latest run:
  14 tests, 11 passed and 3 Docker-dependent tests skipped.
- Chat Service build passes; attachment validation unit tests pass. PostgreSQL,
  Flyway/JPA validation and HTTP lifecycle tests use Testcontainers and skipped
  because Docker daemon is unavailable.
- Smoke tests for the four remaining domain modules and API Gateway pass.

## Chưa triển khai

- Phần lớn controller/service nghiệp vụ của các domain khác.
- Spring Data JPA, PostgreSQL driver và Flyway trong các domain service còn lại.
- Đồng bộ migration canonical vào runtime classpath của các service ngoài
  Identity, Order và Chat.
- OAuth2 Resource Server cho các domain service còn lại và API Gateway; cơ chế
  cấp service JWT/client credentials vẫn chưa triển khai.
- Marketplace và Bakery chưa triển khai runtime cho các internal authorization
  contracts mà Chat/Order cần; cần cấp service JWT có scope tương ứng trước khi
  Chat conversation context và bakery membership hoạt động end-to-end.
- Outbound Order Service internal clients need provisioned service JWTs; Identity
  does not yet expose a service-token issuance flow.
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
