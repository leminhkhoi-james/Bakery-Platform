# Project Status

> Cập nhật gần nhất: 2026-10-02.

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

## Đã kiểm tra

- `mvn test` tại `backend/`: **BUILD SUCCESS**.
- Maven reactor nhận đủ parent và tám application modules.
- 8 application-context tests pass, không có failure hoặc error.

## Chưa triển khai

- Controller, service, repository, entity, mapper và DTO nghiệp vụ.
- Spring Data JPA, PostgreSQL driver và Flyway trong từng domain service.
- Đồng bộ migration canonical từ `database/postgresql/` vào runtime classpath
  của từng service.
- Spring Security OAuth2 Resource Server, JWT issuing/validation và internal
  service authentication.
- Gateway routing/filter implementation và lựa chọn gateway dependency.
- REST clients, timeout/error mapping, object storage và scheduler thực tế.
- Docker Compose, frontend và external AI provider integration.
- ADR cho JWT signing/internal authentication và các quyết định chưa chốt.

## Vấn đề đã biết

- `backend/mvnw.cmd test` hiện lỗi trong Maven Wrapper PowerShell script tại
  bước xử lý thư mục `.m2`; build đã được xác minh bằng Maven cài trên máy.
- Cảnh báo Mockito self-attaching xuất hiện trên Java 21 nhưng không làm test
  thất bại; cần cấu hình Java agent khi dự án nâng mức kiểm soát test runtime.
