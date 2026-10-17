# Project Status

> Cập nhật gần nhất: 2026-10-13.

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

## Đã kiểm tra

- `mvn test` tại `backend/`: **BUILD SUCCESS**.
- Maven reactor nhận đủ parent và tám application modules.
- 19 Identity unit/configuration tests pass, không có failure hoặc error.
- 5 Identity PostgreSQL/MockMvc integration tests được cấu hình bằng
  Testcontainers và tự skip trên máy hiện tại vì Docker daemon không chạy.
- Smoke test của bảy module còn lại pass.

## Chưa triển khai

- Controller, service, repository, entity, mapper và DTO nghiệp vụ ngoài phần
  authentication/user persistence tối thiểu của Identity Service.
- Spring Data JPA, PostgreSQL driver và Flyway trong sáu domain service còn lại.
- Đồng bộ migration canonical từ `database/postgresql/` vào runtime classpath
  của các service ngoài Identity.
- OAuth2 Resource Server cho sáu domain service và API Gateway; cơ chế cấp
  service JWT/client credentials vẫn chưa triển khai.
- Gateway routing/filter implementation và lựa chọn gateway dependency.
- REST clients, timeout/error mapping, object storage và scheduler thực tế.
- Docker Compose, frontend và external AI provider integration.
- Các ADR chưa chốt ngoài quyết định JWT/internal authentication.

## Vấn đề đã biết

- `backend/mvnw.cmd test` hiện lỗi trong Maven Wrapper PowerShell script tại
  bước xử lý thư mục `.m2`; build đã được xác minh bằng Maven cài trên máy.
- Cảnh báo Mockito self-attaching xuất hiện trên Java 21 nhưng không làm test
  thất bại; cần cấu hình Java agent khi dự án nâng mức kiểm soát test runtime.
- Docker daemon hiện không khả dụng nên PostgreSQL Testcontainers integration
  tests bị skip; cần chạy lại khi Docker hoạt động để xác minh full HTTP flow.
