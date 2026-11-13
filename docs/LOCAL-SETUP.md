# Chạy local bằng IntelliJ

1. Bật PostgreSQL 17 trên máy, cổng `5432`.
2. Cả 8 app dùng chung **`backend/.env`**, mẫu là `backend/.env.example`.
   DB vẫn là `identity_db`, `bakery_db`, `marketplace_db`, `subscription_db`,
   `cake_ai_db`, `order_db`, `chat_db`, cổng PostgreSQL `5432`.
3. Chọn JDK 21. Working directory của tất cả app là **`backend`**. **Program arguments để
   trống**, bỏ `--spring.config.additional-location` cũ nếu IDE còn lưu.
4. Run Identity trước, rồi Bakery/Subscription và các service còn lại.

| Service | Cổng |
|---|---|
| Identity | 8081 |
| Bakery | 8082 |
| Marketplace | 8083 |
| Subscription | 8084 |
| Cake AI | 8085 |
| Order | 8086 |
| Chat | 8087 |
| API Gateway | 8080 |

Nếu IntelliJ mở project `backend`, Working directory của **mọi app** là
`$PROJECT_DIR$`. Nếu mở repo gốc thì dùng `$PROJECT_DIR$/backend`.
Không chạy thêm bản cùng service ở terminal. Không cần `.env` trong từng module.

File chung dùng `IDENTITY_SERVER_PORT`, `BAKERY_SERVER_PORT`, v.v.; không đặt
`SERVER_PORT` chung vì sẽ làm cả 8 app trùng cổng. Marketplace và Cake AI dùng
`MARKETPLACE_CLIENT_ID`/`MARKETPLACE_CLIENT_SECRET` và
`CAKE_AI_CLIENT_ID`/`CAKE_AI_CLIENT_SECRET`, tránh ghi đè credential của nhau.
Các biến môi trường `SERVER_PORT` và `SERVICE_CLIENT_*` cũ vẫn là fallback cho
container. Root `.env` hiện có dùng cho Docker; file `backend/.env` là cấu hình
chạy Java local và không đổi các giá trị trong root `.env`.

Swagger Gateway: `http://localhost:8080/swagger-ui/index.html`. Chọn Identity thì
server URL phải có `/identity`; register qua Gateway là
`POST http://localhost:8080/identity/api/v1/auth/register`.
Gọi Swagger Identity trực tiếp ở `http://localhost:8081/swagger-ui/index.html`
thì register không có tiền tố `/identity`. Cấu hình `server.forward-headers-strategy`
trong từng service và trusted proxy/prefix handling ở Gateway giúp Swagger nhận
đúng prefix. Sau khi thay cấu hình, restart Gateway và service tương ứng rồi tải
lại Swagger.

Tham khảo cấu hình: [springdoc reverse proxy](https://springdoc.org/v2/faq.html),
[Gateway forwarded headers](https://docs.spring.io/spring-cloud-gateway/reference/spring-cloud-gateway-server-webmvc/httpheadersfilters.html).

Frontend:

```powershell
cd frontend
npm run dev
```

Trên máy hiện tại, storage ảnh/chứng từ local đã cài trong thư mục ignored,
khởi động ở một terminal riêng từ repo gốc:

```powershell
node .local/storage-server.cjs
```

Storage là S3rver cho phát triển, API ở `localhost:9000`, file lưu trong
`.local/storage-data`. Không cần launcher cho toàn dự án hoặc Docker.
Thư mục `.local` không được push. Máy khác cần tự chạy S3/MinIO và đặt endpoint,
access key, secret key tương ứng trong `backend/.env`.

`${SUBSCRIPTION_BAKERY_SERVICE_TOKEN:}` nghĩa là biến có thể để trống. Khi đó
Subscription tự xin JWT từ Identity bằng `SUBSCRIPTION_CLIENT_SECRET`; hash
tương ứng nằm trong phần Identity của `.env` chung. Token tĩnh chỉ là tùy chọn override.

VNPay merchant đã lưu trong phần Subscription của `.env` chung. Firebase vẫn cần file JSON thật và
`GOOGLE_APPLICATION_CREDENTIALS` trong môi trường IDE/OS; chỉ đặt nó trong Spring
`.env` không tự cấu hình Google ADC. Sinh ảnh AI đang tắt tới khi chủ động bật.

Các DB `bakery_native_*` được giữ nguyên riêng để đối chiếu theo lựa chọn người
dùng, không được dùng trong các `.env` hiện tại. DB thường cũ không có dữ liệu
Bakery; schema V1 cũ đã được giữ tại `bakery_db_schema_backup_20261111045214` trước
khi tạo schema đúng bằng Flyway. Subscription giữ dữ liệu gói có sẵn. Backup SQL
và cấu hình trước khi dọn nằm trong `.local/backups` và `.local/setup-backup`.
