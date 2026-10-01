# PostgreSQL cho MSS Bakery Platform

Mỗi thư mục con tương ứng với một microservice và một database riêng. Các file
`V1__init_schema.sql` được viết theo quy ước tên của Flyway nên có thể sao chép
trực tiếp vào `src/main/resources/db/migration` của service tương ứng.

## Database

| Microservice | Database |
|---|---|
| Identity Service | `identity_db` |
| Bakery Service | `bakery_db` |
| Marketplace Service | `marketplace_db` |
| Order Service | `order_db` |
| Chat Service | `chat_db` |
| Cake AI Service | `cake_ai_db` |
| Subscription Service | `subscription_db` |

## Khởi tạo bằng psql

Chạy file tạo database bằng tài khoản PostgreSQL có quyền `CREATE DATABASE`:

```powershell
psql -U postgres -f database/postgresql/00_create_databases.sql
```

Sau đó chạy migration trên từng database:

```powershell
psql -U postgres -d identity_db -f database/postgresql/identity-service/V1__init_schema.sql
psql -U postgres -d identity_db -f database/postgresql/identity-service/V2__seed_reference_data.sql

psql -U postgres -d bakery_db -f database/postgresql/bakery-service/V1__init_schema.sql
psql -U postgres -d marketplace_db -f database/postgresql/marketplace-service/V1__init_schema.sql
psql -U postgres -d order_db -f database/postgresql/order-service/V1__init_schema.sql
psql -U postgres -d chat_db -f database/postgresql/chat-service/V1__init_schema.sql
psql -U postgres -d cake_ai_db -f database/postgresql/cake-ai-service/V1__init_schema.sql

psql -U postgres -d subscription_db -f database/postgresql/subscription-service/V1__init_schema.sql
psql -U postgres -d subscription_db -f database/postgresql/subscription-service/V2__seed_reference_data.sql
```

Nếu mỗi service chạy một PostgreSQL container riêng, không cần chạy
`00_create_databases.sql`; chỉ cấu hình container tạo đúng một database rồi để
Flyway chạy migration của service đó.

## Nguyên tắc microservice

- Chỉ có foreign key giữa các bảng trong cùng database.
- Các cột được ghi chú là external reference chỉ lưu UUID và được đánh index.
- Service phải gọi REST API của service sở hữu dữ liệu để kiểm tra external ID.
- Không dùng chung schema và không cho service đọc trực tiếp database của nhau.
- Không chạy toàn bộ `V1__init_schema.sql` vào cùng một database trong production.

## Cấu hình Flyway gợi ý

```yaml
spring:
  jpa:
    hibernate:
      ddl-auto: validate
  flyway:
    enabled: true
    locations: classpath:db/migration
```

Không dùng `ddl-auto: update` cùng với Flyway vì hai cơ chế có thể thay đổi
schema theo các cách khác nhau.
