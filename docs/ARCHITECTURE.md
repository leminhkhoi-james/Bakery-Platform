# Architecture

> Tổng quan kiến trúc của MSS Bakery Platform. Chỉ cập nhật khi có thay đổi
> kiến trúc đã được thống nhất; mọi thay đổi service boundary phải có ADR đi kèm.

MSS Bakery Platform là marketplace kết nối khách hàng với nhiều tiệm bánh. Hệ
thống hỗ trợ mua bánh có sẵn, đặt bánh custom qua yêu cầu và offer, chat theo
ngữ cảnh, tạo mẫu bánh bằng AI, cùng quy trình bakery mua gói thuê nền tảng.

> **Trạng thái hiện tại:** repository mới có một Spring Boot bootstrap module và
> thiết kế database/Flyway cho bảy bounded context. Sơ đồ dưới đây mô tả kiến
> trúc microservices mục tiêu đã được chốt trong tài liệu dự án; các service,
> API Gateway, frontend và tích hợp ngoài chưa được scaffold trong source code.

---

## High-Level Architecture

```text
                              ┌──────────────────────┐
                              │   ReactJS Client     │
                              │      (planned)       │
                              └──────────┬───────────┘
                                         │ HTTPS / JWT
                                         ▼
                              ┌──────────────────────┐
                              │     API Gateway      │
                              │      (planned)       │
                              └──────────┬───────────┘
                                         │ REST
             ┌───────────────┬───────────┼───────────┬───────────────┐
             ▼               ▼           ▼           ▼               ▼
   ┌────────────────┐ ┌────────────┐ ┌────────────┐ ┌───────────┐ ┌──────────────┐
   │ Identity       │ │ Bakery     │ │Marketplace │ │ Order     │ │ Chat         │
   │ Service        │ │ Service    │ │ Service    │ │ Service   │ │ Service      │
   └───────┬────────┘ └─────┬──────┘ └─────┬──────┘ └─────┬─────┘ └──────┬───────┘
           │                │              │              │              │
           ▼                ▼              ▼              ▼              ▼
   ┌───────────────┐ ┌────────────┐ ┌────────────┐ ┌───────────┐ ┌──────────────┐
   │ identity_db   │ │ bakery_db  │ │marketplace_│ │ order_db  │ │ chat_db      │
   │               │ │            │ │db          │ │           │ │              │
   └───────────────┘ └────────────┘ └────────────┘ └───────────┘ └──────────────┘

                         ┌────────────────┐       ┌──────────────────────┐
                         │ Cake AI        │       │ Subscription         │
                         │ Service        │       │ Service              │
                         └───────┬────────┘       └──────────┬───────────┘
                                 │                           │
                                 ▼                           ▼
                         ┌────────────────┐       ┌──────────────────────┐
                         │ cake_ai_db     │       │ subscription_db      │
                         └────────────────┘       └──────────────────────┘

      Shared infrastructure (planned): PostgreSQL, MinIO/S3, observability
      External integration (planned): AI image-generation provider
```

### Service Ownership

| Service | Database | Dữ liệu sở hữu | Phụ thuộc đồng bộ chính |
|---|---|---|---|
| Identity Service | `identity_db` | User, profile, address, role, refresh token | Không phụ thuộc domain service khác |
| Bakery Service | `bakery_db` | Bakery, member, service area, catalog, option, add-on | Identity; Subscription khi publish catalog |
| Marketplace Service | `marketplace_db` | Cake request, preference, offer | Identity, Bakery, Cake AI, Subscription, Order |
| Order Service | `order_db` | Customer order, item/address snapshot, review | Identity, Bakery, Marketplace |
| Chat Service | `chat_db` | Conversation, participant, message, receipt | Identity và service sở hữu request/order context |
| Cake AI Service | `cake_ai_db` | Generation job, prompt revision, generated design | Identity, Marketplace context, AI provider, object storage |
| Subscription Service | `subscription_db` | Plan, subscription order, bakery payment, subscription period | Bakery/Identity ID validation |

Mỗi service là một Spring Boot application độc lập và chỉ đọc/ghi database của
chính mình. ID của domain khác được lưu dưới dạng UUID external reference,
không có foreign key hay JPA association xuyên service.

---

## Request Flow

### Standard Authenticated Request

```text
Client
  → [HTTPS request + Authorization: Bearer <access_token>]
  → API Gateway
  → SecurityFilterChain của resource service
  → OAuth2 Resource Server xác thực JWT
  → Controller (nhận request, validate bằng @Valid)
  → Service interface / implementation (authorization + business rules)
  → Repository (Spring Data JPA)
  → PostgreSQL database thuộc service
  → Repository (trả entity)
  → Service (entity → response DTO)
  → Controller (bọc ApiResponse<T>)
  → [HTTP response]
  → Client
```

Public API dùng prefix `/api/v1`. API chỉ dành cho giao tiếp service-to-service
dùng `/internal/v1` và phải có cơ chế xác thực nội bộ riêng.

### Authentication Flow

```text
1. Login:
   Client → API Gateway → Identity Service
   → kiểm tra email/password bằng Spring Security + password encoder
   → phát hành access token ngắn hạn và refresh token
   → chỉ lưu hash của refresh token trong identity_db
   → trả token cho client

2. Authenticated request:
   Client → API Gateway → protected service
   → OAuth2 Resource Server xác minh chữ ký và thời hạn JWT
   → SecurityContext chứa user ID và platform roles
   → endpoint kiểm tra role + service layer kiểm tra resource ownership

3. Token refresh/revoke:
   Client → Identity Service
   → kiểm tra hash, hạn dùng và trạng thái revoke của refresh token
   → rotate/revoke token theo chính sách
   → phát hành access token mới khi hợp lệ
```

Thuật toán ký JWT và thời hạn token phải được chốt bằng ADR trước khi triển
khai. Với mô hình microservices, ưu tiên asymmetric signing để resource service
chỉ giữ public key/JWK, không chia sẻ private signing key.

### Direct Catalog Order Flow

```text
Customer chọn product + option/add-on
  → Order Service nhận lệnh tạo order kèm Idempotency-Key
  → gọi Bakery Service để kiểm tra product, option, giá và bakery
  → gọi Identity Service để kiểm tra customer/address khi cần
  → tạo CustomerOrder(orderSource = DIRECT_CATALOG)
  → lưu snapshot item, cấu hình, giá, bakery/customer và địa chỉ giao hàng
  → commit vào order_db
  → trả OrderResponse
```

Order lưu snapshot tại thời điểm đặt hàng; thay đổi catalog hoặc profile về sau
không được làm thay đổi lịch sử order. Hệ thống không theo dõi payment mua bánh
giữa customer và bakery.

### Custom Request and Offer Acceptance Flow

```text
1. Customer tạo cake request:
   Client → Marketplace Service
   → OPEN_CUSTOM hoặc TARGETED_PRODUCT_CUSTOM
   → lưu preference, option snapshot và object keys của ảnh tham khảo

2. Bakery gửi offer:
   Marketplace Service
   → gọi Subscription Service kiểm tra entitlement còn hiệu lực
   → validate bakery/request
   → lưu offer + item snapshots trong marketplace_db

3. Customer chấp nhận offer:
   Marketplace Service dùng optimistic lock chuyển offer sang trạng thái xử lý
   → gọi Order Service với idempotency key tạo từ offerId
   → Order Service tạo tối đa một ACCEPTED_OFFER order vì offerId là unique
   → Marketplace đánh dấu offer được chọn là ACCEPTED
   → từ chối các offer còn lại và cập nhật cake request
   → nếu remote call lỗi, giữ trạng thái có thể retry/compensate
```

Không mở một database transaction xuyên Marketplace và Order Service. Luồng
chấp nhận offer phải dựa trên optimistic locking, idempotency và compensation.

### Subscription Entitlement Flow

```text
Bakery chọn plan
  → Subscription Service tạo SubscriptionOrder(PENDING_PAYMENT)
  → bakery gửi transaction reference hoặc payment proof
  → admin APPROVE/REJECT payment
  → khi APPROVED: hoàn tất order và tạo đúng một subscription period
  → Bakery/Marketplace Service gọi entitlement API trước khi publish/send offer
```

Việc duyệt payment và kích hoạt subscription phải idempotent. Mỗi bakery chỉ
có tối đa một kỳ `ACTIVE` tại một thời điểm. Payment ở đây chỉ là payment giữa
bakery và nền tảng, không phải payment đơn bánh và không thay thế hóa đơn điện tử.

### Cake AI Generation Flow

```text
Client → Cake AI Service tạo GenerationJob(QUEUED)
  → trả job ID ngay, không giữ HTTP request lâu
  → worker chuyển job sang PROCESSING và gọi AI provider
  → ảnh nguồn/kết quả lưu ở MinIO/S3; database chỉ lưu object key + metadata
  → job chuyển SUCCEEDED hoặc FAILED
  → client polling trạng thái và lấy signed URL có thời hạn ngắn
  → khi customer chọn design, Marketplace Service lưu selectedDesignId
```

Marketplace Service là source of truth cho mẫu được chọn; Cake AI Service chỉ
sở hữu job, prompt revisions và generated designs.

### Chat Message Flow

```text
Client → Chat Service gửi message + clientMessageId
  → xác thực participant và quyền truy cập request/order context
  → unique clientMessageId ngăn tạo trùng khi retry
  → lưu message/attachment metadata vào chat_db
  → file thực tế lưu ở MinIO/S3
  → cập nhật delivery/read receipt theo participant
```

Giao tiếp service-to-service hiện được thiết kế là REST đồng bộ; kiến trúc hiện
tại không sử dụng message broker.

---

## Feature Package Structure

Repository mục tiêu là monorepo, trong đó mỗi service build, test và deploy độc
lập:

```text
Bakery Platform/
├── backend/
│   ├── pom.xml                         # Parent/aggregator sau khi tách module
│   ├── identity-service/
│   ├── bakery-service/
│   ├── marketplace-service/
│   ├── order-service/
│   ├── chat-service/
│   ├── cake-ai-service/
│   ├── subscription-service/
│   └── api-gateway/
├── frontend/                           # ReactJS client (planned)
├── database/postgresql/                # Canonical DDL hiện tại
├── docs/
├── AGENTS.md
└── .codex-rules/project-rules.md
```

Mỗi Spring Boot service tổ chức theo feature, không gom toàn bộ domain vào các
package kỹ thuật dùng chung:

```text
com.se193262.<service>/
├── <Service>Application.java
├── config/                             # Framework/application configuration
├── security/                           # JWT, authorization configuration
├── exception/                          # AppException + global handler
├── shared/
│   └── dto/                            # Chỉ contract kỹ thuật thực sự dùng chung
├── feature/
│   └── <feature>/
│       ├── <Entity>.java
│       ├── <Feature>Controller.java
│       ├── <Feature>Service.java
│       ├── <Feature>ServiceImpl.java
│       ├── <Entity>Repository.java
│       ├── <Feature>Mapper.java
│       ├── CONTEXT.md
│       └── dto/
│           ├── <Action><Feature>Request.java
│           └── <Feature>Response.java
└── infrastructure/
    ├── client/                         # Typed HTTP clients to other services
    ├── storage/                        # MinIO/S3 adapter
    └── scheduler/                      # Cleanup/background jobs
```

### Bounded Context Dependencies

```text
Identity ────────────────┐
                        ├──→ Bakery ───────────────┐
                        ├──→ Marketplace ──────────┼──→ Order
                        ├──→ Order                 │
                        ├──→ Chat                  │
                        ├──→ Cake AI               │
                        └──→ Subscription          │
                                                   │
Subscription ── entitlement ──→ Bakery, Marketplace
Bakery ── catalog/reference ──→ Marketplace, Order
Cake AI ── generated design ──→ Marketplace
Marketplace ── accepted offer ──→ Order
Marketplace/Order ── context validation ──→ Chat
```

Dependency rules:

- Một service không import entity hoặc repository của service khác.
- External ID chỉ là UUID và được xác minh qua API của owner service.
- Không có distributed join, shared domain model lớn hoặc shared database.
- Frontend chỉ gọi API Gateway/public API; frontend không orchestration nhiều
  service để hoàn thành một business transaction.
- Dependency vòng ở cấp source code không được phép. Workflow hai chiều dùng
  contract REST rõ ràng, ownership duy nhất và idempotency.

---

## Cross-Cutting Concerns

### Security

- Spring Security 7 + OAuth2 Resource Server xác thực JWT; không tự viết filter
  parse JWT nếu framework đã hỗ trợ.
- Platform roles: `CUSTOMER`, `BAKERY_OWNER`, `BAKERY_STAFF`, `ADMIN`.
- Bakery membership roles: `OWNER`, `MANAGER`, `STAFF`; đây là dữ liệu của
  Bakery Service, không thay thế platform role.
- Authorization kiểm tra cả role và resource ownership. Không tin
  `customerId`/`bakeryId` từ request nếu có thể suy ra từ JWT và membership.
- Internal endpoints cần service credential, mTLS hoặc cơ chế được quyết định
  bằng ADR; prefix `/internal/v1` tự nó không phải lớp bảo mật.
- Secrets lấy từ environment/secret manager; không log hoặc commit password,
  raw token, private key, signed URL, payment proof hay PII.

### Database Ownership and Persistence

- PostgreSQL database-per-service: bảy database, 44 bảng theo thiết kế hiện tại.
- Schema được quản lý bằng Flyway; production dùng
  `spring.jpa.hibernate.ddl-auto=validate`, không dùng `update`.
- UUID cho ID, `BigDecimal`/`NUMERIC` cho tiền, `Instant`/`TIMESTAMPTZ` cho thời
  gian, `EnumType.STRING` cho trạng thái.
- Quan hệ trong cùng service mặc định lazy; external reference không dùng
  `@ManyToOne`.
- JSONB chỉ dùng cho cấu hình/snapshot linh hoạt, không thay cho mọi bảng quan hệ.
- Aggregate cạnh tranh sử dụng `@Version` và trả HTTP `409` khi conflict.

### Service Communication

- REST đồng bộ với connect/read timeout cho mọi HTTP client.
- Chỉ retry có giới hạn cho operation idempotent; không retry mù `POST`.
- Operation có nguy cơ tạo trùng phải nhận `Idempotency-Key`.
- Propagate correlation/trace ID xuyên Gateway và các service.
- Remote validation bắt buộc bị lỗi phải trả lỗi rõ ràng (thường `503`), không
  giả vờ thành công.
- Entitlement subscription có thể cache ngắn hạn, không cache vô thời hạn.

### API, DTO and Validation

- Controller chỉ xử lý HTTP; business logic và transaction nằm ở service layer.
- Request body dùng `@Valid` và Jakarta Bean Validation.
- Request/response DTO ưu tiên Java records; không expose JPA entity.
- Public response dùng một `ApiResponse<T>` envelope thống nhất.
- Error đi qua `@RestControllerAdvice`; không trả stack trace, SQL error hoặc
  internal URL cho client.
- Endpoint danh sách dùng pagination, trừ danh mục nhỏ và ổn định.

### Object Storage

- Product image, request image, attachment, AI image và payment proof lưu ở
  MinIO/S3; PostgreSQL chỉ lưu object key và metadata.
- Validate MIME từ nội dung, giới hạn kích thước và để server sinh object key.
- Signed URL có thời hạn ngắn và không được lưu vào database.
- Upload và database write không tạo transaction giả; lỗi một phía phải có
  cleanup/compensation.

### Consistency and Audit

- Write transaction chỉ bao phủ một database.
- Accept offer, cập nhật order status, duyệt payment và kích hoạt subscription
  dùng optimistic locking, idempotency và audit history.
- Order/offer lưu snapshot để giữ đúng dữ liệu lịch sử.
- Status history ghi actor, thời điểm và lý do phù hợp.
- Không dùng distributed transaction; workflow nhiều service có trạng thái trung
  gian và hành động bù.

### Testing

- Unit test service/mapper/domain rule bằng JUnit + Mockito.
- Repository integration test dùng PostgreSQL Testcontainers, không dùng H2.
- Controller integration test dùng Spring Boot/MockMvc với profile `test`.
- HTTP client test timeout và error mapping bằng mock server/stub.
- Contract test cho public/internal API quan trọng.
- Bắt buộc test concurrency/idempotency cho accept offer và approve payment.

### Observability

- SLF4J parameterized logging; business event quan trọng được log ở service layer.
- Correlation/trace ID đi xuyên mọi request nội bộ.
- Health/readiness endpoint phục vụ orchestration nhưng không expose secret.
- ERROR dành cho lỗi cần xử lý, WARN cho bất thường, INFO cho business event và
  DEBUG cho chẩn đoán.

---

## Scalability Notes

### Current Repository State

- `backend/` mới là một Spring Boot 4.1.1 application bootstrap dùng Java 21.
- `pom.xml` hiện chỉ có core starter và test starter; JPA, Security, Resource
  Server, Flyway, PostgreSQL driver và module service chưa được thêm.
- Chưa có controller, feature package, API Gateway, frontend hoặc integration.
- Database design đã có 7 PostgreSQL schema sets, 44 tables, Flyway-compatible
  DDL, seed reference data và 8 Mermaid ERD files.
- `docs/API_SPEC.md`, `docs/PROJECT-STATUS.md`, ADR và module `CONTEXT.md` chưa
  tồn tại tại thời điểm tài liệu này được tạo.

### Target MVP

- Tám Spring Boot applications độc lập: bảy domain services và một API Gateway.
- Mỗi domain service có PostgreSQL database và credential riêng.
- REST đồng bộ; không dùng message broker trong phạm vi kiến trúc hiện tại.
- Stateless access-token validation cho phép scale ngang service phía sau load
  balancer; refresh-token state chỉ thuộc Identity Service.
- MinIO/S3 tách binary object khỏi database.
- Cake AI dùng asynchronous job state + polling để không giữ request dài.

### Future Considerations (not implemented)

- Containerize từng service và bổ sung Docker Compose cho local development.
- Bổ sung service discovery/configuration tùy môi trường triển khai thực tế.
- Thêm distributed tracing, metrics và centralized logs.
- Dùng Redis cho cache entitlement/rate limiting nếu tải thực tế yêu cầu.
- Tách worker pool cho Cake AI và cleanup jobs để scale độc lập API instances.
- Chỉ cân nhắc message broker khi cần event-driven integration; thay đổi này
  phải có ADR vì kiến trúc hiện tại chủ đích dùng REST đồng bộ.
- Bổ sung search engine khi PostgreSQL search không còn đáp ứng catalog hoặc
  marketplace search ở quy mô thực tế.

---

## Related Documents

- [Database design](DATABASE.md)
- [ERD index](erd/README.md)
- [PostgreSQL migration guide](../database/postgresql/README.md)
- [Project rules](../.codex-rules/project-rules.md)

