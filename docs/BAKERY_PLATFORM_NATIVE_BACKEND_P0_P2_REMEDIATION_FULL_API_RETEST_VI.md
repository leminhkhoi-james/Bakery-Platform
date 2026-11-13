> **Kết quả cuối sau merge: PARTIAL.** Local `dev` đã tích hợp `ea938c3` và giữ remediation;213 Maven tests pass;108/131 operation có happy trên các route intended đã kiểm chứng. Firebase dùng4/4ảnh được phép và đã xóa cả4. Kết quả hiện hành ở chương37; mục1–36 giữ snapshot PRE_MERGE. Không push.

# Báo cáo khắc phục Native Backend P0–P2 và kiểm thử toàn bộ API

> Đợt trước merge: 11/11/2026 (UTC+7). Kết quả **PARTIAL**. Evidence riêng tư đã khử nhạy cảm: `C:\Users\phuck\AppData\Local\Temp\bakery-native-remediation-20261111-160958`. API-xxx trỏ inventory hiện hành; HTTP-xxx trỏ dòng JSONL có timestamp, method/path, role, expected/actual, correlation ID và response đã lọc. Không có secret/token trong báo cáo.


## 1. Tóm tắt điều hành

Đã sửa lỗi cấu hình và HTTP có bằng chứng; chạy đủ tám Java process native, bảy database test tách biệt. Kiểm kê lại **131 operation**, không mặc định con số lịch sử. Có **108 operation có happy path được quan sát**; các operation khác được liệt kê riêng bên dưới. Mỗi operation đã nhận request HTTP trực tiếp; 110 operation có route Gateway cũng nhận request thật. Request bị từ chối đúng không được tính là happy path.

Không tuyên bố hoàn thành 100%: native MinIO chưa có; Gemini không được gọi trong execution này; callback VNPay chưa có giao dịch sandbox hợp lệ; một API internal thiếu legitimate caller scope. Firebase adapter thật đã upload hai ảnh synthetic và cả hai đã được xóa. Không thanh toán, không gửi email, không dùng Docker.


## 2. Phạm vi và an toàn native

Chỉ thay đổi Backend, native tooling, các mục root `.env` được cho phép và báo cáo này. Không chạy Docker/Compose/Podman/Testcontainers. Native test dùng mã ứng dụng thật và PostgreSQL thật. Mock server chỉ có trong unit test hoặc fault injection transport Gateway; không được tính là chứng cứ business workflow. Không chỉnh frontend/mobile; không sửa bản ghi database gốc hoặc external secret files.


## 3. Baseline Git và môi trường

Branch `dev`, HEAD trước remediation `20663353d4818e21f20527f3499f430381ab60d4`; HEAD khi chốt đợt hiện tại `20663353d4818e21f20527f3499f430381ab60d4`. Có sẵn bảy application.yml thay đổi, ba JSON evidence mobile thay đổi và các file untracked của owner; chúng được bảo toàn, không gộp thành thay đổi do agent.

Windows PowerShell 5.1.26100.9711; Java 21.0.8; Maven 3.9.11; Python 3.13; PostgreSQL 18.4 native (`postgresql-x64-18`, localhost:5432). Spring Boot 4.1.1; Spring Security 7.1.1; Spring Framework 7.0.9; Gateway 5.0.3; springdoc 3.1.0; module `0.0.1-SNAPSHOT`.

| Process | Port | Gateway prefix |
|---|---:|---|
| API Gateway | 8080 | / |
| Identity | 8081 | /identity |
| Bakery | 8082 | /bakery |
| Marketplace | 8083 | /marketplace |
| Subscription | 8084 | /subscription |
| Cake AI | 8085 | /cake-ai |
| Order | 8086 | /orders |
| Chat | 8087 | /chat |

Evidence: `baseline.private.json`, `source-manifest.json`, `native-runtime-root-final/processes.json`; executable JAR SHA-256 được ghi tại thời điểm start, không lấy trạng thái cũ làm readiness.


## 4. Đối chiếu F01–F13

| ID | Vấn đề lịch sử | Trạng thái hiện tại | Bằng chứng/kết quả |
|---|---|---|---|
| F01 | Cake AI PostgreSQL | ALREADY_FIXED_VERIFIED | Owner đã sửa; kết nối thật, Flyway/readiness/API8085 và Gateway đạt; giữ password |
| F02 | Internal client auth | FIXED_VERIFIED | Sáu cặp root; JWT200 và downstream200; negative401/403 |
| F03 | Native MinIO | BLOCKED_ENVIRONMENT | Không executable/service native được phê duyệt, không listener9000/9002 |
| F04 | Bakery upload error | FIXED_VERIFIED | PNG hợp lệ/storage hỏng503; file hỏng400 |
| F05 | Marketplace filter | FIXED_VERIFIED | Enum/UUID/time không hợp lệ400 thay500 |
| F06 | Identity method | FIXED_VERIFIED | Unsupported PUT405, giữ Allow |
| F07 | Swagger servers | FIXED_VERIFIED | Bảy server Gateway có prefix đúng, Try it out200 |
| F08 | Gateway CORS | FIXED_VERIFIED | Preflight và browser thực; deduplicate ACAO/ACAC |
| F09 | Upstream failure | FIXED_VERIFIED | Cake readiness; connection502, timeout504, unknown404 |
| F10 | OpenAPI security | FIXED_VERIFIED | Identity/Order/Cake Bearer, callback HMAC; seven UI calls200 |
| F11 | Health/YAML | FIXED_VERIFIED | Tám readiness200; health-only, DB readiness; YAML docs |
| F12 | Firebase ADC | FIXED_ADAPTER_VERIFIED | Hai ảnh thật, checksum, private unsigned403, restart/read/delete |
| F13 | Root env/native mapping | FIXED_VERIFIED | Chat JDBC typo; strict parser, root-only per-process alias/hash |


## 5. F13 — Chuẩn hóa root .env và native launcher

Root `.env` là nguồn credential duy nhất. Không import, inherit hoặc fallback `local-runtime.env`. Kiểm tra toàn bộ dotenv không thấy duplicate/invalid variable name hiện tại; không gán lại các lỗi lịch sử đã được owner sửa. Có typo thực tế Chat JDBC `jdbc=postgresql` được sửa thành `jdbc:postgresql`. Không thay DB password. Thêm alias JWKS theo property binding; cookie Secure=false chỉ cho HTTP localhost hiện tại.

Parser đọc dotenv như dữ liệu, giữ nguyên `$` trong BCrypt, quotes/comments; duplicate và syntax sai bị từ chối. Launcher lọc environment kế thừa, inject từng process, bind localhost. Firebase chỉ bật qua `--firebase-sandbox`; paid AI, scheduler và cleanup tự động tắt. Các override test chỉ đổi database URL sang database được tạo riêng, không đổi credential.

Backup root `.env` được bảo vệ Windows DPAPI ngoài Git trước khi sửa (`root-env-before*.dpapi`). Không in giá trị trong console/log/report. Không đổi external secrets.


## 6. F02 — Chuẩn hóa Service-to-Service Authentication sử dụng root .env

Identity dùng BCryptPasswordEncoder thật của Spring Security, cost12. Giữ secret Bakery/Subscription/Marketplace/Cake hiện có. Bakery và Subscription thiếu hash tương ứng: tạo hash bằng encoder của Identity và kiểm tra matches. Marketplace/Cake hash có sẵn khớp được tái sử dụng. Order/Chat thiếu secret root: tạo riêng từng secret bằng CSPRNG256bit, BCrypt12, persist root; không chia sẻ một danh tính. Không in secret/hash.

| Consumer | Root variable | Mapping hiệu lực |
|---|---|---|
| Bakery | BAKERY_CLIENT_SECRET | Biến riêng của Bakery |
| Subscription | SUBSCRIPTION_CLIENT_SECRET | Biến riêng của Subscription |
| Marketplace | MARKETPLACE_CLIENT_SECRET | SERVICE_CLIENT_SECRET chỉ process Marketplace |
| Cake AI | CAKE_AI_CLIENT_SECRET | SERVICE_CLIENT_SECRET chỉ process Cake AI |
| Order | ORDER_SERVICE_CLIENT_SECRET | Biến riêng của Order |
| Chat | CHAT_SERVICE_CLIENT_SECRET | Biến riêng của Chat |
| Identity | *_CLIENT_SECRET_HASH | Registration theo client_id/grants source hiện có |

| Client | Nguồn secret/hash | Match | Audience / scope đã thử | JWT | Downstream | Sai secret / scope ngoài grant | Evidence |
|---|---|---|---|---|---|---|---|
| bakery-service | root `.env` | True | identity-service / identity:user:read | 200 | 200 | 401 / 401 | `HTTP-2d5af9895406`, `HTTP-b411af293c22` |
| subscription-service | root `.env` | True | bakery-service / bakery:profile:read | 200 | 200 | 401 / 401 | `HTTP-9fcd7447cf14`, `HTTP-8300126cc8b3` |
| marketplace-service | root `.env` | True | bakery-service / bakery:profile:read | 200 | 200 | 401 / 401 | `HTTP-70150ec96d51`, `HTTP-dcfb6ac3e94f` |
| cake-ai-service | root `.env` | True | marketplace-service / marketplace:request:read | 200 | 200 | 401 / 401 | `HTTP-9cc440b863e5`, `HTTP-ef49913bdb73` |
| order-service | root `.env` | True | identity-service / identity:user:read | 200 | 200 | 401 / 401 | `HTTP-c7ccc725e92f`, `HTTP-ca2020cf34c7` |
| chat-service | root `.env` | True | bakery-service / bakery:membership:read | 200 | 200 | 401 / 401 | `HTTP-a0f9c538762d`, `HTTP-3d18025ec1bd` |

Tất cả sáu client có claims audience/scope đúng và downstream thực. Các grant còn lại cũng được yêu cầu token theo registry hiện có; không thêm scope rộng để đạt coverage. Bakery onboarding/owner discovery, subscription entitlement, offer accept→Order, Chat authorization hoạt động sau repair. `auth-final.json` và ledger ghi từng kết quả.


## 7. F01 — Bản sửa PostgreSQL của owner

Kiểm tra F01 trước các thay đổi hash: root credential kết nối PostgreSQL thành công, native Cake AI8085 startup/readiness và docs/API thành công. Giữ nguyên `CAKE_AI_DB_PASSWORD`; fingerprint credential trước/sau bằng nhau. `f01-before.json`, log startup và integrity xác nhận **ALREADY_FIXED_VERIFIED**; không quy lỗi mới cho F01.


## 8. Cake AI trên8085

Direct/Gateway OpenAPI, Admin PENDING list và job list200; schema/migration/DB readiness hoạt động. Correct multipart metadata + Idempotency-Key với RFQ của người khác403; RFQ thuộc chủ sở hữu503 khi policy generation tắt. JSON sai media415 (đã bổ sung handler hẹp), không còn generic500. Chưa có job/design thật trong database test; Google không được gọi. Readiness không chứng minh Gemini business FlowF.


## 9. F03 — Native MinIO

Không tìm được native binary/service được phê duyệt và ports storage không lắng nghe. Không cài/download, không thay Docker, không giả storage. Upload ảnh hợp lệ trả503 đúng sau F04; không có primary product image để publish (422), kéo theo quote/checkout chưa có happy path. Đó là blocker hạ tầng còn thật, không còn blocker root credentials.


## 10. F12 — Firebase ADC sandbox

Owner cho phép tối đa3 ảnh synthetic upload/read/delete. Đã dùng **2 ảnh PNG16×16** qua API thực, upload201 direct và Gateway. Download200, SHA-256 đầu vào/đầu ra cùng `a9b8edfddffda3b65225c2b80be7889a0c7bccc50da389a2dde19a3cc342af53`; unsigned URL403. Một object giữ qua nhiều restart và vẫn checksum đúng; cả hai delete204, signed URL hợp lệ sau delete404. Không còn object test được giữ lại. `cloud-final.log`, HTTP-4cdd31d28844, HTTP-e71072eefe92, `finish-checks.json`.

Launcher ánh xạ FIREBASE_CREDENTIALS_FILE root sang GOOGLE_APPLICATION_CREDENTIALS chỉ cho consumer thật; không sửa file service account/IAM. Chứng cứ này xác minh Marketplace adapter, không thay thế proof ảnh Gemini CakeAI. `cloud-final.json` rỗng sau một lượt harness không tạo fixture; không dùng file rỗng làm chứng cứ, dùng log và ledger upload thật.


## 11. F04 — Storage I/O

`BakeryImageStorage`: trước đây IOException mạng rơi catch đọc multipart →400. Tách riêng `getBytes` từ multipart (400) và storage network failure (503), không thay validation. Native PNG hợp lệ với storage unavailable503; MIME/content hỏng, quá cỡ400. Test giữ cả signed URL gốc và bổ sung ba scenario; không blanket-map mọi lỗi thành400.


## 12. F05 — Invalid filter/UUID

`CakeRequestServiceImpl` và `OfferServiceImpl`: parse enum/Instant/UUID trước Specification/query. Trước đây exception bị JPA wrapper →500. Sau sửa RFQ invalid status, Offer invalid status/bakeryId và invalid time trả400 direct/Gateway. Hai regression test xác nhận repository chưa được gọi với filter invalid.


## 13. F06 — Unsupported HTTP method

`GlobalExceptionHandler` Identity bổ sung handler cụ thể cho HttpRequestMethodNotSupportedException, trả405 và headers bao gồm Allow. Native PUT `/api/v1/auth/me` với JWT thật405; GET200. Test UnsupportedMethodTest xác nhận status/header/envelope; không thay authorization.


## 14. F07/F09 — Prefix Swagger và upstream

Forwarded headers được bật cho native apps; Gateway trust proxy chỉ loopback, prefix append=false để tránh `/identity/identity`. Cả bảy OpenAPI `servers` qua8080 có đúng service prefix. Gateway thực connection-refused502, JDK HttpTimeoutException504 (1.11s với timeout test1s), unknownroute404. Initial timeout500 đã được tái hiện rồi sửa; fault injection chỉ chạy Gateway phụ18080 và đã shutdown riêng. Docs/direct targets đúng8081–8087.


## 15. F08 — CORS

Gateway CorsFilter allow origin localhost:5173, credentials=true và method/header cụ thể. Phát hiện duplicate ACAO/ACAC từ upstream: response wrapper chỉ loại header trùng sau khi edge đã set. Browser thật đọc API200 từ origin5173; origin15173 bị trình duyệt chặn. Không dùng wildcard credentials. Preflight đơn lẻ không được coi là đủ; evidence `swagger-browser-final.json` và EdgeHttpConfigTest.


## 16. F10 — OpenAPI security và Try it out

Swagger UI thực trên Gateway được mở bằng Playwright, authorize user JWT trong memory và bấm Execute cho bảy service: tất cả200, request URL có prefix đúng. Identity phân biệt public auth/JWKS và protected; Order/Cake thêm bearerAuth; callback VNPay dùng HMAC, không đánh dấu bearer sai. Bảy PNG gốc trong `swagger-screenshots/`, phần curl Authorization được che trước capture; không có browser page error. Không gọi Web app này là đã kiểm thử UI frontend.


## 17. F11 — Health/readiness

Bakery/Subscription/Order/Chat thêm Actuator dependency và health-only exposure, show-details=never, readiness có DB. Security chỉ permit GET health; Bakery/Subscription thêm docs YAML matcher cần thiết. Tám process readiness200. Native smoke42/42 đạt; không expose env/configprops hay HTTP shutdown. Stop dùng JDK local management MXBean chỉ process launcher sở hữu.


## 18. Kiểm kê source và API

Đọc/kiểm kê 696 file text Backend, 77 test/helper Java. Reactor gồm platform-support, bảy service, Gateway và integration-tests; module CakeAI integration riêng ngoài parent không chạy Docker. Số business/controller mapping131 vẫn trùng lịch sử nhưng đã đếm lại. GET55/POST48/PATCH14/PUT7/DELETE7. Không cộng các actuator/springdoc generated endpoint vào131.

| Service | Operation |
|---|---:|
| identity-service | 21 |
| bakery-service | 42 |
| marketplace-service | 18 |
| subscription-service | 21 |
| cake-ai-service | 11 |
| order-service | 10 |
| chat-service | 8 |

Có110 Gateway-eligible;19 internal-only; JWKS direct-only1; storage retired1. Gateway không expose internal. Swagger generated còn chứa internal/direct-only; khả năng thử chúng qua Gateway không đồng nghĩa có route public.


## 19. Ma trận đầy đủ từng operation

`PASS_OBSERVED` chỉ biểu thị scenario hợp lệ được thực thi; không có nghĩa tất cả tổ hợp nghiệp vụ. Cột observed chứa mọi status từng gặp, gồm probe/harness trước fix; cột happy dùng request expected đúng và status2xx. 401/403/404 không thay thế happy. Với blocker vẫn có negative HTTP thật. Swagger direct/Gateway đều200 cho bảy service; schema/source được so sánh riêng trong swagger-results.json.

| ID | Service | Direct path | Gateway path | Rule từ source | Happy direct / role / evidence | Happy Gateway / role / evidence | Negative / evidence | Status đã quan sát | Kết luận | Source |
|---|---|---|---|---|---|---|---|---|---|---|
| API-001 | identity-service | `GET /.well-known/jwks.json` | N/A — direct-only | JWT_OR_PUBLIC_RULE | 200 · ANONYMOUS · `HTTP-921b48665c27` | N/A | Không áp dụng/chưa có negative riêng | 200 | PASS_OBSERVED | `backend/identity-service/src/main/java/com/se193262/identityservice/config/JwkSetController.java:22` |
| API-002 | identity-service | `GET /api/v1/users/me/addresses` | `/identity/api/v1/users/me/addresses` | JWT_OR_PUBLIC_RULE | 200 · CUSTOMER · `HTTP-02be713c155e` | 200 · CUSTOMER · `HTTP-828ad5c7ba91` | 401 · ANONYMOUS · `HTTP-3feda5727cc5` | 200/401 | PASS_OBSERVED | `backend/identity-service/src/main/java/com/se193262/identityservice/feature/address/AddressController.java:21` |
| API-003 | identity-service | `GET /api/v1/users/me/addresses/{id}` | `/identity/api/v1/users/me/addresses/{id}` | JWT_OR_PUBLIC_RULE | 200 · CUSTOMER · `HTTP-e2d3c36d1d21` | 200 · CUSTOMER · `HTTP-e7dd99247cbe` | 401 · ANONYMOUS · `HTTP-3d5c03b72c57` | 200/401/404 | PASS_OBSERVED | `backend/identity-service/src/main/java/com/se193262/identityservice/feature/address/AddressController.java:26` |
| API-004 | identity-service | `POST /api/v1/users/me/addresses` | `/identity/api/v1/users/me/addresses` | JWT_OR_PUBLIC_RULE | 201 · CUSTOMER · `HTTP-93f1f3b44cb6` | 201 · CUSTOMER · `HTTP-973c959eb157` | 401 · ANONYMOUS · `HTTP-67c0ba223a2e` | 201/401 | PASS_OBSERVED | `backend/identity-service/src/main/java/com/se193262/identityservice/feature/address/AddressController.java:31` |
| API-005 | identity-service | `PATCH /api/v1/users/me/addresses/{id}` | `/identity/api/v1/users/me/addresses/{id}` | JWT_OR_PUBLIC_RULE | 200 · CUSTOMER · `HTTP-11b7c6c0685e` | 200 · CUSTOMER · `HTTP-d26019f71609` | 401 · ANONYMOUS · `HTTP-32cdaae65521` | 200/401 | PASS_OBSERVED | `backend/identity-service/src/main/java/com/se193262/identityservice/feature/address/AddressController.java:37` |
| API-006 | identity-service | `PUT /api/v1/users/me/addresses/{id}/default` | `/identity/api/v1/users/me/addresses/{id}/default` | JWT_OR_PUBLIC_RULE | 200 · CUSTOMER · `HTTP-3214cb89248b` | 200 · CUSTOMER · `HTTP-b5664f50ac41` | 401 · ANONYMOUS · `HTTP-9f5a8598e12e` | 200/401 | PASS_OBSERVED | `backend/identity-service/src/main/java/com/se193262/identityservice/feature/address/AddressController.java:43` |
| API-007 | identity-service | `DELETE /api/v1/users/me/addresses/{id}` | `/identity/api/v1/users/me/addresses/{id}` | JWT_OR_PUBLIC_RULE | 204 · CUSTOMER · `HTTP-2db84da55e2a` | 204 · CUSTOMER · `HTTP-ff7e673d340c` | 401 · ANONYMOUS · `HTTP-51fa9bdcaa9c` | 204/401 | PASS_OBSERVED | `backend/identity-service/src/main/java/com/se193262/identityservice/feature/address/AddressController.java:48` |
| API-008 | identity-service | `POST /api/v1/auth/register` | `/identity/api/v1/auth/register` | JWT_OR_PUBLIC_RULE | 201 · ANONYMOUS · `HTTP-f7daed0402a9` | 201 · ANONYMOUS · `HTTP-c46cee2c425b` | 400 · ANONYMOUS · `HTTP-eccc2c0d6ec5` | 201/400 | PASS_OBSERVED | `backend/identity-service/src/main/java/com/se193262/identityservice/feature/authentication/AuthenticationController.java:41` |
| API-009 | identity-service | `POST /api/v1/auth/login` | `/identity/api/v1/auth/login` | JWT_OR_PUBLIC_RULE | 200 · ANONYMOUS · `HTTP-698397f32ebe` | 200 · ANONYMOUS · `HTTP-10e03c8fbbbf` | 400 · ANONYMOUS · `HTTP-6cd3a6db4dc2` | 200/400 | PASS_OBSERVED | `backend/identity-service/src/main/java/com/se193262/identityservice/feature/authentication/AuthenticationController.java:50` |
| API-010 | identity-service | `POST /api/v1/auth/refresh` | `/identity/api/v1/auth/refresh` | JWT_OR_PUBLIC_RULE | 200 · ANONYMOUS · `HTTP-0207d5cbbde2` | 200 · ANONYMOUS · `HTTP-ca506f9de570` | 401 · ANONYMOUS · `HTTP-584ae81c94b3` | 200/401 | PASS_OBSERVED | `backend/identity-service/src/main/java/com/se193262/identityservice/feature/authentication/AuthenticationController.java:56` |
| API-011 | identity-service | `POST /api/v1/auth/logout` | `/identity/api/v1/auth/logout` | JWT_OR_PUBLIC_RULE | 200 · CUSTOMER · `HTTP-0a8f8c202f73` | 200 · CUSTOMER · `HTTP-529a40247309` | 401 · ANONYMOUS · `HTTP-8d0ae21b2a0d` | 200/401 | PASS_OBSERVED | `backend/identity-service/src/main/java/com/se193262/identityservice/feature/authentication/AuthenticationController.java:62` |
| API-012 | identity-service | `GET /api/v1/auth/me` | `/identity/api/v1/auth/me` | JWT_OR_PUBLIC_RULE | 200 · CUSTOMER · `HTTP-3b0ace908cba` | 200 · CUSTOMER · `HTTP-df8689a12ea3` | 401 · ANONYMOUS · `HTTP-e4918c2d4014` | 200/401 | PASS_OBSERVED | `backend/identity-service/src/main/java/com/se193262/identityservice/feature/authentication/AuthenticationController.java:71` |
| API-013 | identity-service | `POST /internal/v1/auth/service-token` | N/A — direct-only | INTERNAL | 200 · ANONYMOUS · `HTTP-607decf7e2ce` | N/A | 401 · ANONYMOUS · `HTTP-1fd02be80a1f` | 200/400/401 | PASS_OBSERVED | `backend/identity-service/src/main/java/com/se193262/identityservice/feature/authentication/ServiceTokenController.java:16` |
| API-014 | identity-service | `GET /api/v1/admin/users` | `/identity/api/v1/admin/users` | JWT_OR_PUBLIC_RULE | 200 · ADMIN · `HTTP-75c118f33bc9` | 200 · ADMIN · `HTTP-59eec497e984` | 401 · ANONYMOUS · `HTTP-c4d7983eb4fc` | 200/401 | PASS_OBSERVED | `backend/identity-service/src/main/java/com/se193262/identityservice/feature/user/AdminUserController.java:37` |
| API-015 | identity-service | `GET /api/v1/admin/users/{userId}` | `/identity/api/v1/admin/users/{userId}` | JWT_OR_PUBLIC_RULE | 200 · ADMIN · `HTTP-0fdd93ad59c1` | 200 · ADMIN · `HTTP-4244f3d4831d` | 401 · ANONYMOUS · `HTTP-55c7f49a18b2` | 200/401 | PASS_OBSERVED | `backend/identity-service/src/main/java/com/se193262/identityservice/feature/user/AdminUserController.java:48` |
| API-016 | identity-service | `PATCH /api/v1/admin/users/{userId}/status` | `/identity/api/v1/admin/users/{userId}/status` | JWT_OR_PUBLIC_RULE | 200 · ADMIN · `HTTP-c6ac84e00e3f` | 200 · ADMIN · `HTTP-679b085c03c0` | 401 · ANONYMOUS · `HTTP-364d88c9cb70` | 200/401 | PASS_OBSERVED | `backend/identity-service/src/main/java/com/se193262/identityservice/feature/user/AdminUserController.java:53` |
| API-017 | identity-service | `PUT /api/v1/admin/users/{userId}/roles` | `/identity/api/v1/admin/users/{userId}/roles` | JWT_OR_PUBLIC_RULE | 200 · ADMIN · `HTTP-0c1b3eaf43a2` | 200 · ADMIN · `HTTP-7d6925454ea6` | 401 · ANONYMOUS · `HTTP-1a945c086c5a` | 200/401 | PASS_OBSERVED | `backend/identity-service/src/main/java/com/se193262/identityservice/feature/user/AdminUserController.java:62` |
| API-018 | identity-service | `GET /internal/v1/users/{id}` | N/A — direct-only | hasAuthority('SCOPE_identity:user:read') | 200 · SERVICE:order-service · `HTTP-ca2020cf34c7` | N/A | 401 · SERVICE:marketplace-service · `HTTP-60cf071e5984` | 200/401 | PASS_OBSERVED | `backend/identity-service/src/main/java/com/se193262/identityservice/feature/user/UserContextController.java:17` |
| API-019 | identity-service | `PUT /internal/v1/users/{id}/bakery-owner` | N/A — direct-only | hasAuthority('SCOPE_identity:bakery-owner:grant') | 204 · SERVICE:bakery-service · `HTTP-dc587ccaf4ab` | N/A | 401 · ANONYMOUS · `HTTP-47d37e27218f` | 204/401 | PASS_OBSERVED | `backend/identity-service/src/main/java/com/se193262/identityservice/feature/user/UserContextController.java:23` |
| API-020 | identity-service | `GET /internal/v1/users/{userId}/addresses/{addressId}` | N/A — direct-only | hasAuthority('SCOPE_identity:address:read') | 200 · SERVICE:order-service · `HTTP-55fdc8153293` | N/A | 401 · ANONYMOUS · `HTTP-ca3c1d1f79dd` | 200/401 | PASS_OBSERVED | `backend/identity-service/src/main/java/com/se193262/identityservice/feature/user/UserContextController.java:30` |
| API-021 | identity-service | `PATCH /api/v1/users/me` | `/identity/api/v1/users/me` | JWT_OR_PUBLIC_RULE | 200 · CUSTOMER · `HTTP-1384c446ade0` | 200 · CUSTOMER · `HTTP-59bb0ac62bd2` | 401 · ANONYMOUS · `HTTP-0e6243c22b52` | 200/401 | PASS_OBSERVED | `backend/identity-service/src/main/java/com/se193262/identityservice/feature/user/UserController.java:29` |
| API-022 | bakery-service | `GET /api/v1/bakeries/{bakeryId}/add-ons` | `/bakery/api/v1/bakeries/{bakeryId}/add-ons` | JWT_OR_PUBLIC_RULE | 200 · BAKERY_OWNER · `HTTP-8d1708fca1d7` | 200 · BAKERY_OWNER · `HTTP-47fea0aa3f30` | 401 · ANONYMOUS · `HTTP-aa232320d1dd` | 200/401 | PASS_OBSERVED | `backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/addon/controller/AddOnController.java:35` |
| API-023 | bakery-service | `POST /api/v1/bakeries/{bakeryId}/add-ons` | `/bakery/api/v1/bakeries/{bakeryId}/add-ons` | JWT_OR_PUBLIC_RULE | 201 · BAKERY_OWNER · `HTTP-7011afecf836` | 201 · BAKERY_OWNER · `HTTP-c32fe800d9c1` | 401 · ANONYMOUS · `HTTP-898ead4e4096` | 201/401 | PASS_OBSERVED | `backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/addon/controller/AddOnController.java:40` |
| API-024 | bakery-service | `PATCH /api/v1/bakeries/{bakeryId}/add-ons/{addOnId}` | `/bakery/api/v1/bakeries/{bakeryId}/add-ons/{addOnId}` | JWT_OR_PUBLIC_RULE | 200 · BAKERY_OWNER · `HTTP-67f1fbaccb9c` | 200 · BAKERY_OWNER · `HTTP-70d7082e1929` | 401 · ANONYMOUS · `HTTP-d4c322770c97` | 200/401 | PASS_OBSERVED | `backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/addon/controller/AddOnController.java:47` |
| API-025 | bakery-service | `DELETE /api/v1/bakeries/{bakeryId}/add-ons/{addOnId}` | `/bakery/api/v1/bakeries/{bakeryId}/add-ons/{addOnId}` | JWT_OR_PUBLIC_RULE | 204 · BAKERY_OWNER · `HTTP-ce445ccb5f67` | 204 · BAKERY_OWNER · `HTTP-0713581d85f4` | 401 · ANONYMOUS · `HTTP-b6100b208c8c` | 204/401 | PASS_OBSERVED | `backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/addon/controller/AddOnController.java:53` |
| API-026 | bakery-service | `POST /api/v1/bakeries/{bakeryId}/add-ons/{addOnId}/image` | `/bakery/api/v1/bakeries/{bakeryId}/add-ons/{addOnId}/image` | JWT_OR_PUBLIC_RULE | Chưa có happy path | Chưa có happy path | 401 · ANONYMOUS · `HTTP-c25d51bb9b36` | 401/503 | BLOCKED_MINIO | `backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/addon/controller/AddOnController.java:59` |
| API-027 | bakery-service | `GET /api/v1/admin/bakeries` | `/bakery/api/v1/admin/bakeries` | JWT_OR_PUBLIC_RULE | 200 · ADMIN · `HTTP-9c59dbf62c91` | 200 · ADMIN · `HTTP-9ac0763c9fed` | 401 · ANONYMOUS · `HTTP-4ec743b51186` | 200/401 | PASS_OBSERVED | `backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/controller/AdminBakeryController.java:38` |
| API-028 | bakery-service | `GET /api/v1/admin/bakeries/{bakeryId}` | `/bakery/api/v1/admin/bakeries/{bakeryId}` | JWT_OR_PUBLIC_RULE | 200 · ADMIN · `HTTP-da6ab9b4ebb8` | 200 · ADMIN · `HTTP-c00a972b3321` | 401 · ANONYMOUS · `HTTP-9af06ee42a6e` | 200/401 | PASS_OBSERVED | `backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/controller/AdminBakeryController.java:49` |
| API-029 | bakery-service | `PATCH /api/v1/admin/bakeries/{bakeryId}/status` | `/bakery/api/v1/admin/bakeries/{bakeryId}/status` | JWT_OR_PUBLIC_RULE | 200 · ADMIN · `HTTP-3550a8106e0b` | 200 · ADMIN · `HTTP-c9829f13a12b` | 401 · ANONYMOUS · `HTTP-b1a55ad9c7e8` | 200/401 | PASS_OBSERVED | `backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/controller/AdminBakeryController.java:54` |
| API-030 | bakery-service | `POST /api/v1/bakeries` | `/bakery/api/v1/bakeries` | JWT_OR_PUBLIC_RULE | 201 · BAKERY_OWNER · `HTTP-ca0d4b4cd334` | 201 · BAKERY_OWNER · `HTTP-5314a2873c42` | 401 · ANONYMOUS · `HTTP-bb716db0aacc` | 201/401 | PASS_OBSERVED | `backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/controller/BakeryController.java:37` |
| API-031 | bakery-service | `PATCH /api/v1/bakeries/{bakeryId}` | `/bakery/api/v1/bakeries/{bakeryId}` | JWT_OR_PUBLIC_RULE | 200 · BAKERY_OWNER · `HTTP-910e67c8efda` | 200 · BAKERY_OWNER · `HTTP-ec81c3cbd69f` | 401 · ANONYMOUS · `HTTP-535ccfb5c1ae` | 200/401 | PASS_OBSERVED | `backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/controller/BakeryController.java:45` |
| API-032 | bakery-service | `PUT /api/v1/bakeries/{bakeryId}/operations` | `/bakery/api/v1/bakeries/{bakeryId}/operations` | JWT_OR_PUBLIC_RULE | 200 · BAKERY_OWNER · `HTTP-9e2979dadf0a` | 200 · BAKERY_OWNER · `HTTP-d003d9c6e4af` | 401 · ANONYMOUS · `HTTP-b0bde8bca946` | 200/401 | PASS_OBSERVED | `backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/controller/BakeryController.java:51` |
| API-033 | bakery-service | `POST /api/v1/bakeries/{bakeryId}/submit-for-approval` | `/bakery/api/v1/bakeries/{bakeryId}/submit-for-approval` | JWT_OR_PUBLIC_RULE | 200 · BAKERY_OWNER · `HTTP-de03d973d33f` | 200 · BAKERY_OWNER · `HTTP-da9376e2b937` | 401 · ANONYMOUS · `HTTP-b879e61c038b` | 200/401 | PASS_OBSERVED | `backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/controller/BakeryController.java:58` |
| API-034 | bakery-service | `POST /api/v1/bakeries/{bakeryId}/logo` | `/bakery/api/v1/bakeries/{bakeryId}/logo` | JWT_OR_PUBLIC_RULE | Chưa có happy path | Chưa có happy path | 401 · ANONYMOUS · `HTTP-617610c14ffb` | 400/401/503 | BLOCKED_MINIO | `backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/controller/BakeryController.java:63` |
| API-035 | bakery-service | `POST /api/v1/bakeries/{bakeryId}/cover` | `/bakery/api/v1/bakeries/{bakeryId}/cover` | JWT_OR_PUBLIC_RULE | Chưa có happy path | Chưa có happy path | 401 · ANONYMOUS · `HTTP-c15bfd771980` | 401/503 | BLOCKED_MINIO | `backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/controller/BakeryController.java:70` |
| API-036 | bakery-service | `GET /api/v1/bakeries/onboarding` | `/bakery/api/v1/bakeries/onboarding` | JWT_OR_PUBLIC_RULE | 200 · CUSTOMER · `HTTP-e43c19d048ce` | 200 · CUSTOMER · `HTTP-0ab5e89131ff` | 401 · ANONYMOUS · `HTTP-b14fd68cc675` | 200/401 | PASS_OBSERVED | `backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/controller/BakeryOnboardingController.java:29` |
| API-037 | bakery-service | `POST /api/v1/bakeries/onboarding` | `/bakery/api/v1/bakeries/onboarding` | JWT_OR_PUBLIC_RULE | 200 · CUSTOMER · `HTTP-123fd4ea91ef` | 200 · CUSTOMER · `HTTP-1bc60b3cf584` | 401 · ANONYMOUS · `HTTP-80b33fd757ec` | 200/400/401 | PASS_OBSERVED | `backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/controller/BakeryOnboardingController.java:34` |
| API-038 | bakery-service | `POST /api/v1/bakeries/{bakeryId}/onboarding/complete` | `/bakery/api/v1/bakeries/{bakeryId}/onboarding/complete` | JWT_OR_PUBLIC_RULE | 204 · CUSTOMER · `HTTP-95203bf83277` | 204 · CUSTOMER · `HTTP-f69db5ec55d6` | 401 · ANONYMOUS · `HTTP-23e9d1fab910` | 204/401/409 | PASS_OBSERVED | `backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/controller/BakeryOnboardingController.java:40` |
| API-039 | bakery-service | `PUT /internal/v1/bakeries/{bakeryId}/onboarding/activate` | N/A — direct-only | INTERNAL | 204 · SERVICE:subscription-service · `HTTP-44203728b3eb` | N/A | 401 · ANONYMOUS · `HTTP-328c48d3a053` | 204/401 | PASS_OBSERVED | `backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/controller/InternalBakeryController.java:29` |
| API-040 | bakery-service | `GET /internal/v1/bakeries/{bakeryId}` | N/A — direct-only | INTERNAL | 200 · SERVICE:marketplace-service · `HTTP-dcfb6ac3e94f` | N/A | 403 · CUSTOMER · `HTTP-1cd21ec4906b` | 200/401/403 | PASS_OBSERVED | `backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/controller/InternalBakeryController.java:35` |
| API-041 | bakery-service | `GET /internal/v1/bakeries/{bakeryId}/members/{userId}/authorization` | N/A — direct-only | INTERNAL | 200 · SERVICE:chat-service · `HTTP-3d18025ec1bd` | N/A | 403 · SERVICE:marketplace-service · `HTTP-1f1eb9f28b11` | 200/401/403 | PASS_OBSERVED | `backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/controller/InternalBakeryController.java:40` |
| API-042 | bakery-service | `GET /api/v1/bakeries` | `/bakery/api/v1/bakeries` | JWT_OR_PUBLIC_RULE | 200 · ANONYMOUS · `HTTP-655eb2aedb8f` | 200 · ANONYMOUS · `HTTP-fb842ab0d47f` | Không áp dụng/chưa có negative riêng | 200 | PASS_OBSERVED | `backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/controller/PublicBakeryController.java:23` |
| API-043 | bakery-service | `GET /api/v1/bakeries/{bakeryId}` | `/bakery/api/v1/bakeries/{bakeryId}` | JWT_OR_PUBLIC_RULE | 200 · ANONYMOUS · `HTTP-3f878a465bff` | 200 · ANONYMOUS · `HTTP-5877c347ba24` | 401 · ANONYMOUS · `HTTP-b14fd68cc675` | 200/401/404 | PASS_OBSERVED | `backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/controller/PublicBakeryController.java:34` |
| API-044 | bakery-service | `GET /internal/v1/users/{userId}/bakery-memberships` | N/A — direct-only | hasAuthority('SCOPE_bakery:membership:read') | 200 · SERVICE:marketplace-service · `HTTP-edaf2ade3744` | N/A | 401 · ANONYMOUS · `HTTP-049f99868bcb` | 200/401 | PASS_OBSERVED | `backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/catalog/CatalogController.java:21` |
| API-045 | bakery-service | `POST /internal/v1/catalog/customization-quotes` | N/A — direct-only | hasAuthority('SCOPE_bakery:catalog:quote') | Chưa có happy path | N/A | 401 · ANONYMOUS · `HTTP-c4d29faa37a5` | 401 | BLOCKED_MINIO | `backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/catalog/CatalogController.java:27` |
| API-046 | bakery-service | `POST /internal/v1/catalog/add-on-quotes` | N/A — direct-only | hasAuthority('SCOPE_bakery:catalog:quote') | 200 · SERVICE:marketplace-service · `HTTP-455539c66d30` | N/A | 401 · ANONYMOUS · `HTTP-28cc6e262dfd` | 200/401 | PASS_OBSERVED | `backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/catalog/CatalogController.java:33` |
| API-047 | bakery-service | `POST /internal/v1/catalog/quotes` | N/A — direct-only | INTERNAL | Chưa có happy path | N/A | 401 · ANONYMOUS · `HTTP-72a08c7202ba` | 401 | BLOCKED_MINIO | `backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/catalog/controller/InternalCatalogController.java:22` |
| API-048 | bakery-service | `GET /api/v1/bakeries/{bakeryId}/categories` | `/bakery/api/v1/bakeries/{bakeryId}/categories` | JWT_OR_PUBLIC_RULE | 200 · BAKERY_OWNER · `HTTP-9ee4daff3aac` | 200 · BAKERY_OWNER · `HTTP-4e900677e951` | 401 · ANONYMOUS · `HTTP-ee0f6f7e8bf2` | 200/401 | PASS_OBSERVED | `backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/category/controller/ProductCategoryController.java:31` |
| API-049 | bakery-service | `POST /api/v1/bakeries/{bakeryId}/categories` | `/bakery/api/v1/bakeries/{bakeryId}/categories` | JWT_OR_PUBLIC_RULE | 201 · BAKERY_OWNER · `HTTP-f35fb781e91f` | 201 · BAKERY_OWNER · `HTTP-e26e25e64cf9` | 401 · ANONYMOUS · `HTTP-4666d0fb89fa` | 201/401 | PASS_OBSERVED | `backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/category/controller/ProductCategoryController.java:36` |
| API-050 | bakery-service | `PATCH /api/v1/bakeries/{bakeryId}/categories/{categoryId}` | `/bakery/api/v1/bakeries/{bakeryId}/categories/{categoryId}` | JWT_OR_PUBLIC_RULE | 200 · BAKERY_OWNER · `HTTP-c7f19edcc4f1` | 200 · BAKERY_OWNER · `HTTP-502b5547f25e` | 401 · ANONYMOUS · `HTTP-ed8733855194` | 200/401 | PASS_OBSERVED | `backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/category/controller/ProductCategoryController.java:43` |
| API-051 | bakery-service | `DELETE /api/v1/bakeries/{bakeryId}/categories/{categoryId}` | `/bakery/api/v1/bakeries/{bakeryId}/categories/{categoryId}` | JWT_OR_PUBLIC_RULE | 204 · BAKERY_OWNER · `HTTP-b526d76b1bd1` | 204 · BAKERY_OWNER · `HTTP-24f751e12d56` | 401 · ANONYMOUS · `HTTP-5e9c9b8fa4f4` | 204/401 | PASS_OBSERVED | `backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/category/controller/ProductCategoryController.java:49` |
| API-052 | bakery-service | `GET /api/v1/bakeries/{bakeryId}/members` | `/bakery/api/v1/bakeries/{bakeryId}/members` | JWT_OR_PUBLIC_RULE | 200 · BAKERY_OWNER · `HTTP-987b4715363f` | 200 · BAKERY_OWNER · `HTTP-1b3d519c9dd0` | 401 · ANONYMOUS · `HTTP-ed6efd51c33b` | 200/401 | PASS_OBSERVED | `backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/member/controller/BakeryMemberController.java:25` |
| API-053 | bakery-service | `GET /api/v1/bakeries/{bakeryId}/products` | `/bakery/api/v1/bakeries/{bakeryId}/products` | JWT_OR_PUBLIC_RULE | 200 · BAKERY_OWNER · `HTTP-596cfb49da27` | 200 · BAKERY_OWNER · `HTTP-42f4040fc87a` | 401 · ANONYMOUS · `HTTP-30b515f2f975` | 200/401 | PASS_OBSERVED | `backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/product/controller/ProductController.java:40` |
| API-054 | bakery-service | `POST /api/v1/bakeries/{bakeryId}/products` | `/bakery/api/v1/bakeries/{bakeryId}/products` | JWT_OR_PUBLIC_RULE | 201 · BAKERY_OWNER · `HTTP-461be7421ba6` | 201 · BAKERY_OWNER · `HTTP-e23a290b4195` | 401 · ANONYMOUS · `HTTP-d5a64f384457` | 201/401 | PASS_OBSERVED | `backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/product/controller/ProductController.java:52` |
| API-055 | bakery-service | `PATCH /api/v1/bakeries/{bakeryId}/products/{productId}` | `/bakery/api/v1/bakeries/{bakeryId}/products/{productId}` | JWT_OR_PUBLIC_RULE | 200 · BAKERY_OWNER · `HTTP-1028c35b8c7e` | 200 · BAKERY_OWNER · `HTTP-3f055fd6bb65` | 401 · ANONYMOUS · `HTTP-eb16ee8b0149` | 200/401 | PASS_OBSERVED | `backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/product/controller/ProductController.java:59` |
| API-056 | bakery-service | `PUT /api/v1/bakeries/{bakeryId}/products/{productId}/options` | `/bakery/api/v1/bakeries/{bakeryId}/products/{productId}/options` | JWT_OR_PUBLIC_RULE | 200 · BAKERY_OWNER · `HTTP-69369f466b44` | 200 · BAKERY_OWNER · `HTTP-de4eae6bace6` | 401 · ANONYMOUS · `HTTP-b84b008c3e07` | 200/401 | PASS_OBSERVED | `backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/product/controller/ProductController.java:65` |
| API-057 | bakery-service | `POST /api/v1/bakeries/{bakeryId}/products/{productId}/images` | `/bakery/api/v1/bakeries/{bakeryId}/products/{productId}/images` | JWT_OR_PUBLIC_RULE | Chưa có happy path | Chưa có happy path | 401 · ANONYMOUS · `HTTP-e6408be9bcbd` | 401/503 | BLOCKED_MINIO | `backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/product/controller/ProductController.java:72` |
| API-058 | bakery-service | `DELETE /api/v1/bakeries/{bakeryId}/products/{productId}/images/{imageId}` | `/bakery/api/v1/bakeries/{bakeryId}/products/{productId}/images/{imageId}` | JWT_OR_PUBLIC_RULE | Chưa có happy path | Chưa có happy path | 401 · ANONYMOUS · `HTTP-e02e5c0024c8` | 401 | BLOCKED_MINIO | `backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/product/controller/ProductController.java:81` |
| API-059 | bakery-service | `POST /api/v1/bakeries/{bakeryId}/products/{productId}/publish` | `/bakery/api/v1/bakeries/{bakeryId}/products/{productId}/publish` | JWT_OR_PUBLIC_RULE | Chưa có happy path | Chưa có happy path | 401 · ANONYMOUS · `HTTP-aaf1016be0fb` | 401/422 | BLOCKED_MINIO | `backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/product/controller/ProductController.java:88` |
| API-060 | bakery-service | `POST /api/v1/bakeries/{bakeryId}/products/{productId}/hide` | `/bakery/api/v1/bakeries/{bakeryId}/products/{productId}/hide` | JWT_OR_PUBLIC_RULE | Chưa có happy path | Chưa có happy path | 401 · ANONYMOUS · `HTTP-5ad7d6ef6baa` | 401/409 | BLOCKED_MINIO | `backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/product/controller/ProductController.java:94` |
| API-061 | bakery-service | `POST /api/v1/bakeries/{bakeryId}/products/{productId}/archive` | `/bakery/api/v1/bakeries/{bakeryId}/products/{productId}/archive` | JWT_OR_PUBLIC_RULE | 200 · BAKERY_OWNER · `HTTP-5365226a7e4b` | 200 · BAKERY_OWNER · `HTTP-06617769b7ad` | 401 · ANONYMOUS · `HTTP-d02f86406355` | 200/401 | PASS_OBSERVED | `backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/product/controller/ProductController.java:100` |
| API-062 | bakery-service | `GET /api/v1/products` | `/bakery/api/v1/products` | JWT_OR_PUBLIC_RULE | 200 · ANONYMOUS · `HTTP-f9bb584b537c` | 200 · ANONYMOUS · `HTTP-9a45abe4d2e4` | Không áp dụng/chưa có negative riêng | 200 | PASS_OBSERVED | `backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/product/controller/PublicProductController.java:24` |
| API-063 | bakery-service | `GET /api/v1/products/{productId}` | `/bakery/api/v1/products/{productId}` | JWT_OR_PUBLIC_RULE | Chưa có happy path | Chưa có happy path | 404 · ANONYMOUS · `HTTP-0536bd5de905` | 404 | BLOCKED_MINIO | `backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/product/controller/PublicProductController.java:40` |
| API-064 | marketplace-service | `GET /api/v1/cake-requests` | `/marketplace/api/v1/cake-requests` | JWT_OR_PUBLIC_RULE | 200 · CUSTOMER · `HTTP-8d8ca167d870` | 200 · CUSTOMER · `HTTP-613b44dc26ca` | 401 · ANONYMOUS · `HTTP-cb1675f17569` | 200/400/401 | PASS_OBSERVED | `backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/CakeRequestController.java:26` |
| API-065 | marketplace-service | `GET /api/v1/cake-requests/{id}` | `/marketplace/api/v1/cake-requests/{id}` | JWT_OR_PUBLIC_RULE | 200 · CUSTOMER · `HTTP-8d97c3850f63` | 200 · CUSTOMER · `HTTP-0a1d49512bda` | 401 · ANONYMOUS · `HTTP-f1ece000da1b` | 200/401/403 | PASS_OBSERVED | `backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/CakeRequestController.java:32` |
| API-066 | marketplace-service | `POST /api/v1/cake-requests` | `/marketplace/api/v1/cake-requests` | JWT_OR_PUBLIC_RULE | 201 · CUSTOMER · `HTTP-b0e2ba34cdd0` | 201 · CUSTOMER · `HTTP-4b4c3952af54` | 401 · ANONYMOUS · `HTTP-1313e7fac74e` | 201/400/401 | PASS_OBSERVED | `backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/CakeRequestController.java:37` |
| API-067 | marketplace-service | `PATCH /api/v1/cake-requests/{id}` | `/marketplace/api/v1/cake-requests/{id}` | JWT_OR_PUBLIC_RULE | 200 · CUSTOMER · `HTTP-6e7f91ee7e23` | 200 · CUSTOMER · `HTTP-80fa148ea163` | 401 · ANONYMOUS · `HTTP-3380f22b76ba` | 200/401 | PASS_OBSERVED | `backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/CakeRequestController.java:43` |
| API-068 | marketplace-service | `POST /api/v1/cake-requests/{id}/publish` | `/marketplace/api/v1/cake-requests/{id}/publish` | JWT_OR_PUBLIC_RULE | 200 · CUSTOMER · `HTTP-44df04f342a7` | 200 · CUSTOMER · `HTTP-e2c5164f0c4c` | 401 · ANONYMOUS · `HTTP-da7889a5ec42` | 200/401 | PASS_OBSERVED | `backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/CakeRequestController.java:49` |
| API-069 | marketplace-service | `POST /api/v1/cake-requests/{id}/cancel` | `/marketplace/api/v1/cake-requests/{id}/cancel` | JWT_OR_PUBLIC_RULE | 200 · CUSTOMER · `HTTP-684875ce2d88` | 200 · CUSTOMER · `HTTP-a43511889580` | 401 · ANONYMOUS · `HTTP-22134b793b43` | 200/401 | PASS_OBSERVED | `backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/CakeRequestController.java:54` |
| API-070 | marketplace-service | `PUT /api/v1/cake-requests/{id}/selected-design` | `/marketplace/api/v1/cake-requests/{id}/selected-design` | JWT_OR_PUBLIC_RULE | Chưa có happy path | Chưa có happy path | 401 · ANONYMOUS · `HTTP-d59e2e428a2a` | 401 | BLOCKED_GEMINI_FIXTURE | `backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/CakeRequestController.java:60` |
| API-071 | marketplace-service | `POST /api/v1/cake-requests/{id}/images` | `/marketplace/api/v1/cake-requests/{id}/images` | JWT_OR_PUBLIC_RULE | 201 · CUSTOMER · `HTTP-ba3cdf8f24e3` | 201 · CUSTOMER · `HTTP-4cdd31d28844` | 401 · ANONYMOUS · `HTTP-0a8384f87f68` | 201/401 | PASS_OBSERVED | `backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/CakeRequestController.java:66` |
| API-072 | marketplace-service | `DELETE /api/v1/cake-requests/{id}/images/{imageId}` | `/marketplace/api/v1/cake-requests/{id}/images/{imageId}` | JWT_OR_PUBLIC_RULE | 204 · CUSTOMER · `HTTP-e71072eefe92` | 204 · CUSTOMER · `HTTP-8af890279d0c` | 401 · ANONYMOUS · `HTTP-e2e98a53b344` | 204/401 | PASS_OBSERVED | `backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/CakeRequestController.java:75` |
| API-073 | marketplace-service | `GET /internal/v1/cake-requests/{id}/context` | N/A — direct-only | hasAuthority('SCOPE_marketplace:request:read') | 200 · SERVICE:cake-ai-service · `HTTP-ef49913bdb73` | N/A | 401 · ANONYMOUS · `HTTP-9384f955b877` | 200/401 | PASS_OBSERVED | `backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/MarketplaceContextController.java:27` |
| API-074 | marketplace-service | `GET /internal/v1/cake-requests/{id}/chat-authorization` | N/A — direct-only | hasAuthority('SCOPE_marketplace:request:chat:authorize') | 200 · SERVICE:chat-service · `HTTP-15304226ac85` | N/A | 401 · ANONYMOUS · `HTTP-df488acde9ed` | 200/401 | PASS_OBSERVED | `backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/MarketplaceContextController.java:33` |
| API-075 | marketplace-service | `GET /internal/v1/offers/{id}/order-source` | N/A — direct-only | hasAuthority('SCOPE_marketplace:offer:read') | 200 · SERVICE:order-service · `HTTP-2e9ab85d5756` | N/A | 401 · ANONYMOUS · `HTTP-7af8b2ca4a91` | 200/401 | PASS_OBSERVED | `backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/MarketplaceContextController.java:42` |
| API-076 | marketplace-service | `GET /api/v1/offers` | `/marketplace/api/v1/offers` | JWT_OR_PUBLIC_RULE | 200 · BAKERY_OWNER · `HTTP-5559ff153574` | 200 · BAKERY_OWNER · `HTTP-85f5d0d0268b` | 401 · ANONYMOUS · `HTTP-5981b73b75f4` | 200/400/401 | PASS_OBSERVED | `backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/offer/OfferController.java:25` |
| API-077 | marketplace-service | `GET /api/v1/offers/{id}` | `/marketplace/api/v1/offers/{id}` | JWT_OR_PUBLIC_RULE | 200 · CUSTOMER · `HTTP-380f1e9ac943` | 200 · CUSTOMER · `HTTP-3ff69f5d3f0a` | 401 · ANONYMOUS · `HTTP-f559815cb7c0` | 200/401 | PASS_OBSERVED | `backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/offer/OfferController.java:31` |
| API-078 | marketplace-service | `POST /api/v1/cake-requests/{id}/offers` | `/marketplace/api/v1/cake-requests/{id}/offers` | JWT_OR_PUBLIC_RULE | 201 · BAKERY_OWNER · `HTTP-ff78b8e887ea` | 201 · BAKERY_OWNER · `HTTP-6d965c7b46b3` | 401 · ANONYMOUS · `HTTP-a5fb92eb5994` | 201/401/403 | PASS_OBSERVED | `backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/offer/OfferController.java:36` |
| API-079 | marketplace-service | `PATCH /api/v1/offers/{id}` | `/marketplace/api/v1/offers/{id}` | JWT_OR_PUBLIC_RULE | 200 · CUSTOMER · `HTTP-2db723fbfe85` | 200 · CUSTOMER · `HTTP-41591552a3f3` | 401 · ANONYMOUS · `HTTP-7bebb19e6e3c` | 200/401 | PASS_OBSERVED | `backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/offer/OfferController.java:42` |
| API-080 | marketplace-service | `POST /api/v1/offers/{id}/withdraw` | `/marketplace/api/v1/offers/{id}/withdraw` | JWT_OR_PUBLIC_RULE | 200 · BAKERY_OWNER · `HTTP-22618d9aa41d` | 200 · BAKERY_OWNER · `HTTP-a1f739c8b51e` | 401 · ANONYMOUS · `HTTP-d6e797caa386` | 200/401 | PASS_OBSERVED | `backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/offer/OfferController.java:48` |
| API-081 | marketplace-service | `POST /api/v1/offers/{id}/accept` | `/marketplace/api/v1/offers/{id}/accept` | JWT_OR_PUBLIC_RULE | 200 · CUSTOMER · `HTTP-5aa2d01c5708` | 200 · CUSTOMER · `HTTP-01181eeea638` | 401 · ANONYMOUS · `HTTP-b19b6d8a40e0` | 200/401 | PASS_OBSERVED | `backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/offer/OfferController.java:54` |
| API-082 | subscription-service | `GET /api/v1/admin/bakery-payments` | `/subscription/api/v1/admin/bakery-payments` | JWT_OR_PUBLIC_RULE | 200 · ADMIN · `HTTP-0ca819097256` | 200 · ADMIN · `HTTP-2cb862212ea0` | 401 · ANONYMOUS · `HTTP-9c25455fe5b3` | 200/401 | PASS_OBSERVED | `backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/payment/controller/AdminBakeryPaymentController.java:36` |
| API-083 | subscription-service | `POST /api/v1/admin/bakery-payments/{paymentId}/approve` | `/subscription/api/v1/admin/bakery-payments/{paymentId}/approve` | JWT_OR_PUBLIC_RULE | 200 · ADMIN · `HTTP-5aacf2d1ce93` | 200 · ADMIN · `HTTP-15d46f5b3afe` | 401 · ANONYMOUS · `HTTP-69593c56071f` | 200/401 | PASS_OBSERVED | `backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/payment/controller/AdminBakeryPaymentController.java:49` |
| API-084 | subscription-service | `POST /api/v1/admin/bakery-payments/{paymentId}/reject` | `/subscription/api/v1/admin/bakery-payments/{paymentId}/reject` | JWT_OR_PUBLIC_RULE | Chưa có happy path | 200 · ADMIN · `HTTP-a3659b2b0afe` | 401 · ANONYMOUS · `HTTP-7dc0b8452c52` | 200/401 | PASS_OBSERVED | `backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/payment/controller/AdminBakeryPaymentController.java:57` |
| API-085 | subscription-service | `POST /api/v1/subscription-orders/{orderId}/payments` | `/subscription/api/v1/subscription-orders/{orderId}/payments` | JWT_OR_PUBLIC_RULE | 201 · CUSTOMER · `HTTP-dd3717876c53` | 201 · CUSTOMER · `HTTP-3d124eaf8a16` | 401 · ANONYMOUS · `HTTP-9d7fd682aca6` | 201/401 | PASS_OBSERVED | `backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/payment/controller/BakeryPaymentController.java:30` |
| API-086 | subscription-service | `GET /api/v1/subscription-plans/payment-options` | `/subscription/api/v1/subscription-plans/payment-options` | JWT_OR_PUBLIC_RULE | 200 · ANONYMOUS · `HTTP-441ad60cc5af` | 200 · ANONYMOUS · `HTTP-d5fe6db3f395` | Không áp dụng/chưa có negative riêng | 200 | PASS_OBSERVED | `backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/payment/controller/PaymentOptionsController.java:16` |
| API-087 | subscription-service | `POST /api/v1/subscription-orders/{orderId}/vnpay/checkout` | `/subscription/api/v1/subscription-orders/{orderId}/vnpay/checkout` | JWT_OR_PUBLIC_RULE | 200 · BAKERY_OWNER · `HTTP-3a22d0cb7671` | 200 · BAKERY_OWNER · `HTTP-6459a1df4905` | 401 · ANONYMOUS · `HTTP-07a7f1c12b3b` | 200/401 | PASS_OBSERVED | `backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/payment/controller/VnpayController.java:26` |
| API-088 | subscription-service | `GET /api/v1/payments/vnpay/ipn` | `/subscription/api/v1/payments/vnpay/ipn` | JWT_OR_PUBLIC_RULE | Chưa có happy path | Chưa có happy path | Không áp dụng/chưa có negative riêng | 200 | PARTIAL_HMAC_CALLBACK | `backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/payment/controller/VnpayController.java:32` |
| API-089 | subscription-service | `GET /api/v1/payments/vnpay/return` | `/subscription/api/v1/payments/vnpay/return` | JWT_OR_PUBLIC_RULE | Chưa có happy path | Chưa có happy path | 400 · ANONYMOUS · `HTTP-a4601f5c037b` | 400 | PARTIAL_HMAC_CALLBACK | `backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/payment/controller/VnpayController.java:38` |
| API-090 | subscription-service | `GET /api/v1/admin/vnpay-attempts` | `/subscription/api/v1/admin/vnpay-attempts` | JWT_OR_PUBLIC_RULE | 200 · ADMIN · `HTTP-56e7e4f896ab` | 200 · ADMIN · `HTTP-e2dd7e7530eb` | 401 · ANONYMOUS · `HTTP-03cc11d6487d` | 200/401 | PASS_OBSERVED | `backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/payment/controller/VnpayController.java:48` |
| API-091 | subscription-service | `GET /api/v1/admin/subscription-plans` | `/subscription/api/v1/admin/subscription-plans` | JWT_OR_PUBLIC_RULE | 200 · ADMIN · `HTTP-8776c6d6e9ab` | 200 · ADMIN · `HTTP-892bee0ea9aa` | 401 · ANONYMOUS · `HTTP-a23f9ecc4117` | 200/401 | PASS_OBSERVED | `backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/plan/controller/AdminSubscriptionPlanController.java:29` |
| API-092 | subscription-service | `POST /api/v1/admin/subscription-plans` | `/subscription/api/v1/admin/subscription-plans` | JWT_OR_PUBLIC_RULE | 201 · ADMIN · `HTTP-a3beea42edbf` | 201 · ADMIN · `HTTP-bafafac9b566` | 401 · ANONYMOUS · `HTTP-2af6719f2aae` | 201/401 | PASS_OBSERVED | `backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/plan/controller/AdminSubscriptionPlanController.java:34` |
| API-093 | subscription-service | `PATCH /api/v1/admin/subscription-plans/{planId}` | `/subscription/api/v1/admin/subscription-plans/{planId}` | JWT_OR_PUBLIC_RULE | 200 · ADMIN · `HTTP-9a4d1bba5c1a` | 200 · ADMIN · `HTTP-630efb8b6e80` | 401 · ANONYMOUS · `HTTP-4db34f7dbfc2` | 200/401 | PASS_OBSERVED | `backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/plan/controller/AdminSubscriptionPlanController.java:40` |
| API-094 | subscription-service | `POST /api/v1/admin/subscription-plans/{planId}/archive` | `/subscription/api/v1/admin/subscription-plans/{planId}/archive` | JWT_OR_PUBLIC_RULE | 200 · ADMIN · `HTTP-d43592c9193d` | 200 · ADMIN · `HTTP-22b06a720a32` | 401 · ANONYMOUS · `HTTP-356df525c78d` | 200/401 | PASS_OBSERVED | `backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/plan/controller/AdminSubscriptionPlanController.java:46` |
| API-095 | subscription-service | `GET /api/v1/subscription-plans` | `/subscription/api/v1/subscription-plans` | JWT_OR_PUBLIC_RULE | 200 · ANONYMOUS · `HTTP-17b0551139d6` | 200 · ANONYMOUS · `HTTP-4e7f68ab037d` | Không áp dụng/chưa có negative riêng | 200 | PASS_OBSERVED | `backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/plan/controller/SubscriptionPlanController.java:24` |
| API-096 | subscription-service | `GET /api/v1/subscription-plans/{planId}` | `/subscription/api/v1/subscription-plans/{planId}` | JWT_OR_PUBLIC_RULE | 200 · ANONYMOUS · `HTTP-7aa43e9730cf` | 200 · ANONYMOUS · `HTTP-751242e869d8` | Không áp dụng/chưa có negative riêng | 200 | PASS_OBSERVED | `backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/plan/controller/SubscriptionPlanController.java:29` |
| API-097 | subscription-service | `GET /api/v1/bakeries/{bakeryId}/subscription` | `/subscription/api/v1/bakeries/{bakeryId}/subscription` | JWT_OR_PUBLIC_RULE | 200 · BAKERY_OWNER · `HTTP-4e2bc1319d7f` | 200 · BAKERY_OWNER · `HTTP-81c09aaf0a45` | 401 · ANONYMOUS · `HTTP-d68cfa42ff64` | 200/401 | PASS_OBSERVED | `backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/subscription/controller/BakerySubscriptionController.java:25` |
| API-098 | subscription-service | `GET /internal/v1/subscriptions/bakeries/{bakeryId}/entitlement` | N/A — direct-only | INTERNAL | 200 · SERVICE:marketplace-service · `HTTP-20af87bf8c26` | N/A | 401 · ANONYMOUS · `HTTP-1364c19147db` | 200/401 | PASS_OBSERVED | `backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/subscription/controller/InternalSubscriptionController.java:22` |
| API-099 | subscription-service | `GET /api/v1/admin/subscription-orders` | `/subscription/api/v1/admin/subscription-orders` | JWT_OR_PUBLIC_RULE | 200 · ADMIN · `HTTP-2b1f990cd704` | 200 · ADMIN · `HTTP-5e41f0d8552b` | 401 · ANONYMOUS · `HTTP-bfef7ba02d4f` | 200/401 | PASS_OBSERVED | `backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/subscriptionorder/controller/AdminSubscriptionOrderController.java:19` |
| API-100 | subscription-service | `POST /api/v1/bakeries/{bakeryId}/subscription-orders` | `/subscription/api/v1/bakeries/{bakeryId}/subscription-orders` | JWT_OR_PUBLIC_RULE | 201 · BAKERY_OWNER · `HTTP-566d25c5e753` | 201 · CUSTOMER · `HTTP-2d3059938b64` | 401 · ANONYMOUS · `HTTP-971bec704c47` | 201/401/422 | PASS_OBSERVED | `backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/subscriptionorder/controller/SubscriptionOrderController.java:33` |
| API-101 | subscription-service | `GET /api/v1/bakeries/{bakeryId}/subscription-orders` | `/subscription/api/v1/bakeries/{bakeryId}/subscription-orders` | JWT_OR_PUBLIC_RULE | 200 · CUSTOMER · `HTTP-4cf78f6cc185` | 200 · CUSTOMER · `HTTP-9764f21f5adb` | 401 · ANONYMOUS · `HTTP-f6433c294c50` | 200/401 | PASS_OBSERVED | `backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/subscriptionorder/controller/SubscriptionOrderController.java:43` |
| API-102 | subscription-service | `GET /api/v1/subscription-orders/{orderId}` | `/subscription/api/v1/subscription-orders/{orderId}` | JWT_OR_PUBLIC_RULE | 200 · BAKERY_OWNER · `HTTP-1cb9beb7fa49` | 200 · BAKERY_OWNER · `HTTP-0d54d4a2cc60` | 401 · ANONYMOUS · `HTTP-74549564c785` | 200/401 | PASS_OBSERVED | `backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/subscriptionorder/controller/SubscriptionOrderController.java:55` |
| API-103 | cake-ai-service | `GET /api/v1/generated-designs/{id}` | `/cake-ai/api/v1/generated-designs/{id}` | hasAnyRole('CUSTOMER','ADMIN') | Chưa có happy path | Chưa có happy path | 401 · ANONYMOUS · `HTTP-6b658d739af1` | 401 | BLOCKED_GEMINI_FIXTURE | `backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/design/DesignController.java:20` |
| API-104 | cake-ai-service | `GET /api/v1/admin/generated-designs` | `/cake-ai/api/v1/admin/generated-designs` | hasRole('ADMIN') | 200 · ADMIN · `HTTP-8ed8e6d78f0a` | 200 · ADMIN · `HTTP-a0ded48d7462` | 401 · ANONYMOUS · `HTTP-8214acb392a7` | 200/401 | PASS_OBSERVED | `backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/design/DesignController.java:26` |
| API-105 | cake-ai-service | `PATCH /api/v1/admin/generated-designs/{id}/moderation` | `/cake-ai/api/v1/admin/generated-designs/{id}/moderation` | hasRole('ADMIN') | Chưa có happy path | Chưa có happy path | 401 · ANONYMOUS · `HTTP-f8edd36c430b` | 401 | BLOCKED_GEMINI_FIXTURE | `backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/design/DesignController.java:34` |
| API-106 | cake-ai-service | `GET /internal/v1/generated-designs/{id}/validation` | N/A — direct-only | INTERNAL | Chưa có happy path | N/A | 401 · ANONYMOUS · `HTTP-c7aef765da7e` | 401 | BLOCKED_GEMINI_FIXTURE | `backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/design/DesignValidationController.java:18` |
| API-107 | cake-ai-service | `GET /internal/v1/cake-requests/{id}/generation-context` | N/A — direct-only | INTERNAL | 200 · SERVICE:marketplace-service · `HTTP-ef439ae000e9` | N/A | 401 · ANONYMOUS · `HTTP-23992e0cb870` | 200/401 | PASS_OBSERVED | `backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/design/DesignValidationController.java:26` |
| API-108 | cake-ai-service | `GET /storage/**` | N/A — direct-only | RETIRED_STORAGE | Chưa có happy path | N/A | 404 · ANONYMOUS · `HTTP-51be0252dc3e` | 404 | RETIRED_404_VERIFIED | `backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/design/PublicStorageController.java:11` |
| API-109 | cake-ai-service | `POST /api/v1/generation-jobs` | `/cake-ai/api/v1/generation-jobs` | JWT_OR_PUBLIC_RULE | Chưa có happy path | Chưa có happy path | 401 · ANONYMOUS · `HTTP-a19411cc5e72` | 401/403/415/500/503 | BLOCKED_GEMINI_FIXTURE | `backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/generation/GenerationController.java:19` |
| API-110 | cake-ai-service | `GET /api/v1/generation-jobs` | `/cake-ai/api/v1/generation-jobs` | JWT_OR_PUBLIC_RULE | 200 · CUSTOMER · `HTTP-169c15e8833b` | 200 · CUSTOMER · `HTTP-69ae7ccb1205` | 401 · ANONYMOUS · `HTTP-0ac9508acbe4` | 200/401 | PASS_OBSERVED | `backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/generation/GenerationController.java:27` |
| API-111 | cake-ai-service | `GET /api/v1/generation-jobs/{id}` | `/cake-ai/api/v1/generation-jobs/{id}` | hasAnyRole('CUSTOMER','ADMIN') | Chưa có happy path | Chưa có happy path | 401 · ANONYMOUS · `HTTP-a6f5b6a0a724` | 401 | BLOCKED_GEMINI_FIXTURE | `backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/generation/GenerationController.java:34` |
| API-112 | cake-ai-service | `POST /api/v1/generation-jobs/{id}/prompt-revisions` | `/cake-ai/api/v1/generation-jobs/{id}/prompt-revisions` | JWT_OR_PUBLIC_RULE | Chưa có happy path | Chưa có happy path | 401 · ANONYMOUS · `HTTP-ff319cd573d5` | 401 | BLOCKED_GEMINI_FIXTURE | `backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/generation/GenerationController.java:40` |
| API-113 | cake-ai-service | `POST /api/v1/generation-jobs/{id}/cancel` | `/cake-ai/api/v1/generation-jobs/{id}/cancel` | JWT_OR_PUBLIC_RULE | Chưa có happy path | Chưa có happy path | 401 · ANONYMOUS · `HTTP-9cafb126fc0a` | 401 | BLOCKED_GEMINI_FIXTURE | `backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/generation/GenerationController.java:46` |
| API-114 | order-service | `GET /internal/v1/orders/{orderId}/context` | N/A — direct-only | INTERNAL | Chưa có happy path | N/A | 401 · ANONYMOUS · `HTTP-24494ed82ce3` | 401/403 | BLOCKED_LEGITIMATE_SCOPE_FIXTURE | `backend/order-service/src/main/java/com/se193262/orderservice/feature/order/InternalOrderController.java:29` |
| API-115 | order-service | `POST /internal/v1/orders/from-offer` | N/A — direct-only | hasAuthority('SCOPE_order:create-from-offer') | 200 · SERVICE:marketplace-service · `HTTP-7f742284f404` | N/A | 401 · ANONYMOUS · `HTTP-629f567e66f9` | 200/401 | PASS_OBSERVED | `backend/order-service/src/main/java/com/se193262/orderservice/feature/order/OfferOrderController.java:19` |
| API-116 | order-service | `POST /api/v1/orders/direct` | `/orders/api/v1/orders/direct` | JWT_OR_PUBLIC_RULE | Chưa có happy path | Chưa có happy path | 401 · ANONYMOUS · `HTTP-37042d8ae919` | 401/409 | BLOCKED_MINIO | `backend/order-service/src/main/java/com/se193262/orderservice/feature/order/OrderController.java:52` |
| API-117 | order-service | `GET /api/v1/orders` | `/orders/api/v1/orders` | JWT_OR_PUBLIC_RULE | 200 · CUSTOMER · `HTTP-3890e1b7864b` | 200 · CUSTOMER · `HTTP-99ae371ef7cf` | 401 · ANONYMOUS · `HTTP-2e9ba27ad7ab` | 200/401 | PASS_OBSERVED | `backend/order-service/src/main/java/com/se193262/orderservice/feature/order/OrderController.java:70` |
| API-118 | order-service | `GET /api/v1/orders/{orderId}` | `/orders/api/v1/orders/{orderId}` | JWT_OR_PUBLIC_RULE | 200 · CUSTOMER · `HTTP-2f12585c98ae` | 200 · CUSTOMER · `HTTP-4b4ec3e4bffd` | 401 · ANONYMOUS · `HTTP-92291aa1fd51` | 200/401 | PASS_OBSERVED | `backend/order-service/src/main/java/com/se193262/orderservice/feature/order/OrderController.java:92` |
| API-119 | order-service | `POST /api/v1/orders/{orderId}/status-transitions` | `/orders/api/v1/orders/{orderId}/status-transitions` | JWT_OR_PUBLIC_RULE | 200 · CUSTOMER · `HTTP-7f5dc6eef0e9` | 200 · CUSTOMER · `HTTP-5be62f52b7d3` | 401 · ANONYMOUS · `HTTP-d2c5c6cf0ae6` | 200/401/403 | PASS_OBSERVED | `backend/order-service/src/main/java/com/se193262/orderservice/feature/order/OrderController.java:105` |
| API-120 | order-service | `POST /api/v1/orders/{orderId}/review` | `/orders/api/v1/orders/{orderId}/review` | JWT_OR_PUBLIC_RULE | 201 · CUSTOMER · `HTTP-351647aa4d8a` | 201 · CUSTOMER · `HTTP-211512b08d4d` | 401 · ANONYMOUS · `HTTP-1651448507b0` | 201/401/422 | PASS_OBSERVED | `backend/order-service/src/main/java/com/se193262/orderservice/feature/review/ReviewController.java:41` |
| API-121 | order-service | `PATCH /api/v1/orders/{orderId}/review` | `/orders/api/v1/orders/{orderId}/review` | JWT_OR_PUBLIC_RULE | 200 · CUSTOMER · `HTTP-9b4040f21243` | 200 · CUSTOMER · `HTTP-e101e0d4e479` | 401 · ANONYMOUS · `HTTP-ce0192db94e8` | 200/401/404 | PASS_OBSERVED | `backend/order-service/src/main/java/com/se193262/orderservice/feature/review/ReviewController.java:56` |
| API-122 | order-service | `DELETE /api/v1/orders/{orderId}/review` | `/orders/api/v1/orders/{orderId}/review` | JWT_OR_PUBLIC_RULE | 204 · CUSTOMER · `HTTP-f383d4fabbd8` | 204 · CUSTOMER · `HTTP-51dcd44d5217` | 401 · ANONYMOUS · `HTTP-6ee52d5d8891` | 204/401/404 | PASS_OBSERVED | `backend/order-service/src/main/java/com/se193262/orderservice/feature/review/ReviewController.java:71` |
| API-123 | order-service | `PATCH /api/v1/admin/reviews/{orderId}/status` | `/orders/api/v1/admin/reviews/{orderId}/status` | JWT_OR_PUBLIC_RULE | 200 · ADMIN · `HTTP-ec9e0d8bb2ce` | 200 · ADMIN · `HTTP-91c8fcf8ddb2` | 401 · ANONYMOUS · `HTTP-a12d782e7be1` | 200/401/404 | PASS_OBSERVED | `backend/order-service/src/main/java/com/se193262/orderservice/feature/review/ReviewController.java:85` |
| API-124 | chat-service | `GET /api/v1/conversations` | `/chat/api/v1/conversations` | JWT_OR_PUBLIC_RULE | 200 · CUSTOMER · `HTTP-70df07bbaa74` | 200 · CUSTOMER · `HTTP-36c85f3b6e8a` | 401 · ANONYMOUS · `HTTP-cbdaeed7a9ce` | 200/401 | PASS_OBSERVED | `backend/chat-service/src/main/java/com/se193262/chatservice/feature/conversation/ConversationController.java:42` |
| API-125 | chat-service | `POST /api/v1/conversations` | `/chat/api/v1/conversations` | JWT_OR_PUBLIC_RULE | 201 · CUSTOMER · `HTTP-1335b8e79f4f` | 201 · CUSTOMER · `HTTP-dd4daee3501d` | 401 · ANONYMOUS · `HTTP-7436b07519a8` | 201/401 | PASS_OBSERVED | `backend/chat-service/src/main/java/com/se193262/chatservice/feature/conversation/ConversationController.java:60` |
| API-126 | chat-service | `GET /api/v1/conversations/{conversationId}` | `/chat/api/v1/conversations/{conversationId}` | JWT_OR_PUBLIC_RULE | 200 · CUSTOMER · `HTTP-c5b9460dcf69` | 200 · CUSTOMER · `HTTP-257c651835cc` | 401 · ANONYMOUS · `HTTP-40e8caface36` | 200/401/404 | PASS_OBSERVED | `backend/chat-service/src/main/java/com/se193262/chatservice/feature/conversation/ConversationController.java:75` |
| API-127 | chat-service | `POST /api/v1/conversations/{conversationId}/close` | `/chat/api/v1/conversations/{conversationId}/close` | JWT_OR_PUBLIC_RULE | 200 · CUSTOMER · `HTTP-e8d92382df16` | 200 · CUSTOMER · `HTTP-a788e9b7b1e8` | 401 · ANONYMOUS · `HTTP-1a9c86404d46` | 200/401 | PASS_OBSERVED | `backend/chat-service/src/main/java/com/se193262/chatservice/feature/conversation/ConversationController.java:83` |
| API-128 | chat-service | `GET /api/v1/conversations/{conversationId}/messages` | `/chat/api/v1/conversations/{conversationId}/messages` | JWT_OR_PUBLIC_RULE | 200 · CUSTOMER · `HTTP-848a394b8a54` | 200 · CUSTOMER · `HTTP-909958548495` | 401 · ANONYMOUS · `HTTP-2cd42905dfe1` | 200/401 | PASS_OBSERVED | `backend/chat-service/src/main/java/com/se193262/chatservice/feature/message/MessageController.java:44` |
| API-129 | chat-service | `POST /api/v1/conversations/{conversationId}/messages` | `/chat/api/v1/conversations/{conversationId}/messages` | JWT_OR_PUBLIC_RULE | 200 · CUSTOMER · `HTTP-0aa549390f6f` | 201 · CUSTOMER · `HTTP-6323f3b0bf22` | 401 · ANONYMOUS · `HTTP-eb842af6cf46` | 200/201/401/422/503 | PASS_OBSERVED | `backend/chat-service/src/main/java/com/se193262/chatservice/feature/message/MessageController.java:55` |
| API-130 | chat-service | `POST /api/v1/conversations/{conversationId}/read` | `/chat/api/v1/conversations/{conversationId}/read` | JWT_OR_PUBLIC_RULE | 200 · CUSTOMER · `HTTP-3eac55f606ff` | 200 · CUSTOMER · `HTTP-d6507e3e6f52` | 401 · ANONYMOUS · `HTTP-1f3495d1e165` | 200/401 | PASS_OBSERVED | `backend/chat-service/src/main/java/com/se193262/chatservice/feature/message/MessageController.java:71` |
| API-131 | chat-service | `DELETE /api/v1/conversations/{conversationId}/messages/{messageId}` | `/chat/api/v1/conversations/{conversationId}/messages/{messageId}` | JWT_OR_PUBLIC_RULE | 204 · CUSTOMER · `HTTP-ad2cd1351855` | 204 · CUSTOMER · `HTTP-158aaf10c0d3` | 401 · ANONYMOUS · `HTTP-40bcd189d42b` | 204/401 | PASS_OBSERVED | `backend/chat-service/src/main/java/com/se193262/chatservice/feature/message/MessageController.java:81` |


## 20. Coverage

{"PASS_OBSERVED": 108, "BLOCKED_MINIO": 11, "BLOCKED_GEMINI_FIXTURE": 8, "PARTIAL_HMAC_CALLBACK": 2, "RETIRED_404_VERIFIED": 1, "BLOCKED_LEGITIMATE_SCOPE_FIXTURE": 1}. Happy direct: 107; happy Gateway: 92; có happy cả hai: 91. Mỗi operation nhận direct request thật;110 operation Gateway nhận request thật. Sweep cuối279 case (131 direct +110 public Gateway +38 internal Gateway denial); regression158, gap62 không có unexpected status. Đây là số request scenario, không cộng thành số API khác nhau.

11 operation bị MinIO;8 bị Gemini/thiếu design thật;2 callback chưa có settlement hợp lệ;1 Order context chưa có legitimate caller registration;1 retired404. IPN trả200 với chữ ký sai là response từ chối theo protocol, **không tính là callback happy path**. Chat attachments503 là limitation của biến thể API text đã pass.


## 21. Authentication và authorization

JWT service thật từ root, sáu hash match; wrong secret401, ungranted scope401, wrong audience401, missing endpoint scope403, user JWT→internal403. JWT thật đã hết hạn và qua clock skew401 (`finish-checks.json`). Gateway/internal404. User ownership trái phép403. Không thêm permitAll để làm business/internal endpoint vượt auth; chỉ health/docs GET công khai. Những test401/403 không được dùng thay happy path trong matrix.


## 22. PostgreSQL, migration và persistence

Bảy database mới `native_remediation_20261111_160958_{identity,bakery,marketplace,subscription,cake_ai,order,chat}` được tạo riêng bằng root DB users hiện có; chỉ datasourceURL được map cho test. Bootstrap một Admin synthetic trong database test; các journey mới dùng API thật để onboarding/cấp role/entitlement. Không gọi seeded bakery ban đầu là bằng chứng Ajourney.

Flyway thực khi startup; source migration sync tests pass. Hai offer đã nhận đúng một order mỗi offer (SQL count1), cả hai COMPLETED. RFQ gốc OFFER_SELECTED, accepted offer đúng. Đọc lại sau restart qua direct/Gateway200. Original bảy DB được fingerprint readonly trước/sau: row counts+aggregate bằng nhau. Không drop/reset DB hoặc sửa record cũ.


## 23. Multipart và storage

Ảnh PNG thật được validate content/MIME/size; malformed400, unsupportedmedia415/422 tùy contract, valid upload backend unavailable503. Firebase real checksum/private/access/delete pass riêng. MinIO thật chưa có nên product/add-on/logo/cover/Chat attachment không được coi pass. SignedURLs không được log, JWT/password/phone được lọc khỏi ledger.


## 24. Maven và tests

Reactor package trong bản copy ngoài repo: **205 cases,54 suite XML,0 failure/error/skip**. Gateway focused sau fix JDK timeout:5 cases pass; Python launcher4 cases pass. Root native launcher build lại toàn bộ JAR (BUILD SUCCESS46.510s), rồi startup/retest chính các JAR đó. Không claim root `-DskipTests` là test execution. Actual native smoke42/42, Swagger browser7/7, F04/F05/F06 negative và real journeys trong ledger.

Các lần đầu harness thiếu canonical database sibling/constructor compile và testdata sai đã được sửa trong harness; không đếm là application defect cuối. Không chạy surefire unfiltered vì cấm Testcontainers. Các class phụ thuộc container (gồm base) được loại rõ ràng:

- `backend/bakery-service/src/test/java/com/se193262/bakeryservice/BakeryServiceApplicationTests.java`
- `backend/bakery-service/src/test/java/com/se193262/bakeryservice/feature/bakery/BakeryCrudIntegrationTests.java`
- `backend/bakery-service/src/test/java/com/se193262/bakeryservice/feature/product/BakeryCatalogIntegrationTests.java`
- `backend/bakery-service/src/test/java/com/se193262/bakeryservice/PostgresIntegrationTest.java`
- `backend/cake-ai-integration-tests/src/test/java/com/se193262/integration/CakeAiEndToEndTest.java`
- `backend/cake-ai-service/src/test/java/com/se193262/cakeaiservice/CakeAiServiceApplicationTests.java`
- `backend/cake-ai-service/src/test/java/com/se193262/cakeaiservice/feature/generation/GenerationFlowTest.java`
- `backend/chat-service/src/test/java/com/se193262/chatservice/ChatServiceApplicationTests.java`
- `backend/chat-service/src/test/java/com/se193262/chatservice/infrastructure/storage/MinioAttachmentStorageTest.java`
- `backend/identity-service/src/test/java/com/se193262/identityservice/AbstractPostgresIntegrationTest.java`
- `backend/identity-service/src/test/java/com/se193262/identityservice/feature/address/AddressApiIntegrationTest.java`
- `backend/identity-service/src/test/java/com/se193262/identityservice/IdentityServiceApplicationTests.java`
- `backend/integration-tests/src/test/java/com/se193262/integration/MarketplaceEndToEndTest.java`
- `backend/marketplace-service/src/test/java/com/se193262/marketplaceservice/MarketplaceServiceApplicationTests.java`
- `backend/order-service/src/test/java/com/se193262/orderservice/OrderServiceApplicationTests.java`
- `backend/subscription-service/src/test/java/com/se193262/subscriptionservice/AdminSubscriptionOrderIntegrationTests.java`
- `backend/subscription-service/src/test/java/com/se193262/subscriptionservice/PostgresIntegrationTest.java`
- `backend/subscription-service/src/test/java/com/se193262/subscriptionservice/SubscriptionDataIntegrationTests.java`
- `backend/subscription-service/src/test/java/com/se193262/subscriptionservice/SubscriptionServiceApplicationTests.java`
- `backend/subscription-service/src/test/java/com/se193262/subscriptionservice/VnpayIntegrationTests.java`

Exact allowlist/command: `test-command.json`; full logs `current-build-test.log`, `gateway-final-build.log`, `native-launcher-root-build.log`. Các repository/concurrency test container chưa có native-equivalent đầy đủ; chỉ các E2E/idempotency đã ghi mới được coi verified.


## 25. E2E A — Customer thành Bakery Owner

PASS cho cohort mới rootfinal4: register→onboarding→gói mới active→Admin duyệt manual payment→entitlement→complete onboarding→role BAKERY_OWNER→bakery Admin activation→discovery. Tạo đúng dữ liệu qua API; test cả direct/Gateway ở các operation. Sáu root service client hoạt động thay vì external dev credentials. `journeys-final.json` phầnA/E và ledger.


## 26. E2E B — Direct Checkout

PARTIAL/BLOCKED_MINIO. Catalog/add-on/option CRUD có happy path; valid product image upload503, publish422 vì thiếu primary image; direct order409/422 không được gọi thành công. Không fabricate image metadata hoặc publish DB thủ công để vượt gate. Source giá/quote được unit test, native checkout happy chưa có.


## 27. E2E C — RFQ, Offer, Order

PASS hai hành trình độc lập direct/Gateway: RFQ DRAFT→OPEN→Owner offer→chat→Customer accept→Order PENDING→CONFIRMED→BAKING→READY→DELIVERING→Customer COMPLETED→review create/edit/admin moderate/delete→readback. Retry accept và internal create dùng source idempotency key `accept-offer:<offerId>` không tạo order thứ hai. Không fake payment mua bánh.

```json
[
  {
    "offerId": "bfb1b1ad-409c-4bc1-ab2e-99ceef0d63ae",
    "requestId": "5ae50ed7-00dc-4ffd-88fc-5d106ce98626",
    "orderId": "3508b2cc-1c8a-4b22-8baf-55efa4ef8041",
    "sql_count_and_status": "1|COMPLETED",
    "rfq_status": "OFFER_SELECTED",
    "accepted_offer_matches": true,
    "order_status": "COMPLETED",
    "rfq_evidence": "HTTP-fa1b97c1eec8",
    "order_evidence": "HTTP-1b15e9e99869"
  },
  {
    "offerId": "f47bd03a-f3ba-4520-8504-68991972a5e2",
    "requestId": "44bc8b3f-0b2b-46f7-a6f1-539cca2eedda",
    "orderId": "9bf97cba-ff3e-4d0c-be5c-8bab613b3170",
    "sql_count_and_status": "1|COMPLETED",
    "rfq_status": "OFFER_SELECTED",
    "accepted_offer_matches": true,
    "order_status": "COMPLETED",
    "rfq_evidence": "HTTP-0a1d49512bda",
    "order_evidence": "HTTP-2f12585c98ae"
  }
]
```


## 28. E2E D — Chat

Text/history/read/delete và idempotent clientMessageId PASS, owner/customer authorization thật; conversation lifecycle/close có HTTP evidence. Unauthorized outsider403. Attachment PNG thật503 do MinIO chưa có, biến thể attachment BLOCKED. Không gọi plain text unsupported file là bằng chứng storage failure.


## 29. E2E E — Subscription

Admin plan CRUD/activate/archive; owner order→synthetic manual reference payment→Admin reject→resubmit→approve→subscription/entitlement PASS. Payment ở đây chỉ workflow local xác nhận thủ công, không ngân hàng. VNPay checkout URL thực được tạo direct+Gateway200, attemptId giống nhau khi replay, sandboxhost/signature present; external_requests=0. Callback signature-invalid tests pass protocol nhưng paid/settlement path BLOCKED_AUTHORIZED_FIXTURE.


## 30. E2E F — Cake AI

PARTIAL. Cake startup/DB/auth/ownership/Admin list/jobs list/OpenAPI pass. Policy và scheduler tắt; root CAKE_AI_API_KEY không có; không lấy key từ external env. Không có phí nào được cho phép cho campaign native này. Correct own RFQ multipart create503; wrongowner403; job/design/moderation/select chưa có authentic provider artifact. Không dùng Java2D/mock/history làm proof. Gemini request0 và generation_jobs0 được ghi rõ.


## 31. Lỗi tồn đọng và việc cần làm

P1: chuẩn bị native MinIO được phê duyệt, bucket/policy/credential thật rồi retest11 APIs và attachment. P1: cần budget Gemini mới và safety/storage gates đạt trước FlowF thật. P2: cần VNPay sandbox transaction/signature hợp lệ để kiểm chứng callbacksettlement; không gọi ra ngoài hiện tại. API-114 Order internal context chưa có actual registered scope `order:context:read`; chỉ negative403 đã verified, không cấp scope dư để đạt báo cáo. OpenAPI Cake accepted-generation response có thể còn default200 so với source202; cần kiểm tra khi job thật được phép, không claim202 đã thấy.


## 32. Danh sách file thay đổi

Root `.env` đã sửa tối thiểu như mục5–6; các file backend application.yml đã dirty từ owner được bảo toàn khi thêm health cấu hình ở bốn consumer cần thiết. Các hash trong manifest chỉ phục vụ integrity ngoài report.

| File | Phân loại / kiểm chứng |
|---|---|
| `.env` | MODIFIED · secure backup/strict parse/auth native |
| `backend/api-gateway/src/main/resources/application.properties` | MODIFIED · Maven compile/tests + native HTTP theo mục liên quan |
| `backend/bakery-service/pom.xml` | MODIFIED · Maven compile/tests + native HTTP theo mục liên quan |
| `backend/bakery-service/src/main/java/com/se193262/bakeryservice/infrastructure/storage/BakeryImageStorage.java` | MODIFIED · Maven compile/tests + native HTTP theo mục liên quan |
| `backend/bakery-service/src/main/java/com/se193262/bakeryservice/security/SecurityConfig.java` | MODIFIED · Maven compile/tests + native HTTP theo mục liên quan |
| `backend/bakery-service/src/main/resources/application.yml` | MODIFIED · Maven compile/tests + native HTTP theo mục liên quan |
| `backend/bakery-service/src/test/java/com/se193262/bakeryservice/infrastructure/storage/BakeryImageStorageTest.java` | MODIFIED · Maven compile/tests + native HTTP theo mục liên quan |
| `backend/chat-service/pom.xml` | MODIFIED · Maven compile/tests + native HTTP theo mục liên quan |
| `backend/chat-service/src/main/java/com/se193262/chatservice/config/SecurityConfig.java` | MODIFIED · Maven compile/tests + native HTTP theo mục liên quan |
| `backend/chat-service/src/main/resources/application.yml` | MODIFIED · Maven compile/tests + native HTTP theo mục liên quan |
| `backend/identity-service/src/main/java/com/se193262/identityservice/config/OpenApiConfig.java` | MODIFIED · Maven compile/tests + native HTTP theo mục liên quan |
| `backend/identity-service/src/main/java/com/se193262/identityservice/exception/GlobalExceptionHandler.java` | MODIFIED · Maven compile/tests + native HTTP theo mục liên quan |
| `backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/CakeRequestServiceImpl.java` | MODIFIED · Maven compile/tests + native HTTP theo mục liên quan |
| `backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/offer/OfferServiceImpl.java` | MODIFIED · Maven compile/tests + native HTTP theo mục liên quan |
| `backend/order-service/pom.xml` | MODIFIED · Maven compile/tests + native HTTP theo mục liên quan |
| `backend/order-service/src/main/java/com/se193262/orderservice/config/SecurityConfig.java` | MODIFIED · Maven compile/tests + native HTTP theo mục liên quan |
| `backend/order-service/src/main/resources/application.yml` | MODIFIED · Maven compile/tests + native HTTP theo mục liên quan |
| `backend/platform-support/src/main/java/com/se193262/platform/exception/PlatformExceptionHandler.java` | MODIFIED · Maven compile/tests + native HTTP theo mục liên quan |
| `backend/subscription-service/pom.xml` | MODIFIED · Maven compile/tests + native HTTP theo mục liên quan |
| `backend/subscription-service/src/main/java/com/se193262/subscriptionservice/config/OpenApiConfig.java` | MODIFIED · Maven compile/tests + native HTTP theo mục liên quan |
| `backend/subscription-service/src/main/java/com/se193262/subscriptionservice/security/SecurityConfig.java` | MODIFIED · Maven compile/tests + native HTTP theo mục liên quan |
| `backend/subscription-service/src/main/resources/application.yml` | MODIFIED · Maven compile/tests + native HTTP theo mục liên quan |
| `backend/api-gateway/src/main/java/com/se193262/apigateway/config/EdgeHttpConfig.java` | NEW · Maven compile/tests + native HTTP theo mục liên quan |
| `backend/api-gateway/src/main/java/com/se193262/apigateway/config/UpstreamFailureFilter.java` | NEW · Maven compile/tests + native HTTP theo mục liên quan |
| `backend/api-gateway/src/test/java/com/se193262/apigateway/config/EdgeHttpConfigTest.java` | NEW · Maven compile/tests + native HTTP theo mục liên quan |
| `backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/config/OpenApiConfig.java` | NEW · Maven compile/tests + native HTTP theo mục liên quan |
| `backend/identity-service/src/test/java/com/se193262/identityservice/exception/UnsupportedMethodTest.java` | NEW · Maven compile/tests + native HTTP theo mục liên quan |
| `backend/marketplace-service/src/test/java/com/se193262/marketplaceservice/feature/cakerequest/MarketplaceFilterValidationTest.java` | NEW · Maven compile/tests + native HTTP theo mục liên quan |
| `backend/order-service/src/main/java/com/se193262/orderservice/config/OpenApiConfig.java` | NEW · Maven compile/tests + native HTTP theo mục liên quan |
| `backend/platform-support/src/test/java/com/se193262/platform/exception/PlatformExceptionHandlerTest.java` | NEW · Maven compile/tests + native HTTP theo mục liên quan |
| `scripts/Native-Backend.ps1` | NEW · Python4/native42/start-stop |
| `scripts/NativeShutdown.java` | NEW · Python4/native42/start-stop |
| `scripts/Test-NativeBackend.py` | NEW · Python4/native42/start-stop |
| `scripts/native_backend.py` | NEW · Python4/native42/start-stop |
| `scripts/test_native_backend.py` | NEW · Python4/native42/start-stop |

Báo cáo này là file documentation mới duy nhất tạo cho task. Không stage/commit/push ở đợt remediation trước merge.


## 33. Frontend/Mobile chỉ đọc

Vite frontend hiện có proxy trực tiếp từng service8081–8087 (5173); browser fixture CORS không chứng minh UI frontend đã chạy qua Gateway. API client không tự thay failed request bằng mock. PATCH users/me thiếu Vite mapping riêng là khả năng tương thích cần kiểm tra ở futureUI, chưa tìm consumer hiện hành nên không gọi confirmed UI regression. Flutter environment yêu cầu origin không có path prefix, debug ports cũ181xx; nativeAndroid cần dart-define10.0.2.2:808x. Không sửa hoặc build/test FE/Mobile trong nhiệm vụ Backend này.


## 34. Tái hiện native trên PowerShell

Prerequisite Java21, Maven, Python (python-dotenv, requests), PostgreSQL native; root env hợp lệ; JWK files local có sẵn. Không source `.env` như script.

```powershell
Set-Location 'H:\MSS\Bakery-Platform'
.\scripts\Native-Backend.ps1 build
.\scripts\Native-Backend.ps1 start --state-dir 'C:\Users\phuck\AppData\Local\Temp\bakery-native-remediation-20261111-160958\native-runtime-root-final' --database-map 'C:\Users\phuck\AppData\Local\Temp\bakery-native-remediation-20261111-160958\isolated-databases.json' --firebase-sandbox
.\scripts\Native-Backend.ps1 verify --state-dir 'C:\Users\phuck\AppData\Local\Temp\bakery-native-remediation-20261111-160958\native-runtime-root-final'
python .\scripts\Test-NativeBackend.py --help
.\scripts\Native-Backend.ps1 status --state-dir 'C:\Users\phuck\AppData\Local\Temp\bakery-native-remediation-20261111-160958\native-runtime-root-final'
.\scripts\Native-Backend.ps1 stop --state-dir 'C:\Users\phuck\AppData\Local\Temp\bakery-native-remediation-20261111-160958\native-runtime-root-final'
```

Các lệnh build/start/status/stop trên đã được chạy thật; smoke CLI dùng đúng option theo help. Map testDB nằm ngoài Git, không chứa password. Startup không tự tạo/đổi DB user password, không ngầm import external development credentials. Không dùng existing/shared data làm write target. Để chạy full safe tests, dùng exact Maven allowlist `test-command.json`, canonical database sibling và các harness ngoài repo; không chạy Testcontainers.


## 35. Repository, secrets, dữ liệu và process

Snapshot baseline so sánh **1195 tracked/source file Frontend/Mobile**: unchanged=True. Ba JSON mobile dirty có từ trước vẫn nguyên byte. Untracked local-run artifacts được giữ nguyên, baseline không hash toàn bộ file untracked nên không mở rộng kết luận quá phạm vi chứng cứ.

External secrets/JWK/service-account file SHA giữ nguyên; tất cả original root passwords và valid client secrets giữ nguyên, Cake DB password=true. New hash/OrderChat secret là thay đổi root được owner cho phép. Root env không Git tracked, scan không phát hiện secret trong file thay đổi. Original7 DB fingerprint bằng nhau. Git HEAD chưa đổi, staged empty trước continuation. Runtime chỉ stop các PID do launcher sở hữu; native PostgreSQL không dừng.

**Xác nhận bất biến:** không chỉnh Frontend/Mobile; không đổi external development secrets; không đổi original/shared database records; không dùng container; chưa commit/push/deploy. Root `.env` có các thay đổi credential/hash mới được cho phép rõ ràng, không tuyên bố env hoàn toàn unchanged. Evidence: `integrity-current.json`.


## 36. Kết luận đợt remediation trước merge

**PARTIAL**: 108 operation đã có happy path thực; eight native apps/readiness, six service clients, Gateway/Swagger/CORS và F04–F06 đạt các case đã ghi. Blocker môi trường/provider/payment được giữ rõ trong matrix, không biến expected503/401/403/404 thành happy PASS.

| Area | Initial state | Change made | Native runtime evidence | Final status |
|---|---|---|---|---|
| Cake DB | Owner vừa sửa | Giữ credential |8085/Gateway DB readiness200|ALREADY_FIXED_VERIFIED|
| Internal auth | Hash/mapping thiếu | Root-only hash/aliases |6JWT200 +6 downstream200|PASS|
| HTTP errors |400/500 sai|Handler/validation hẹp|F04–06 unit+HTTP|PASS|
| Gateway/Swagger/CORS |Prefix/security/upstream drift|Forwarded/CORS/filter/OpenAPI|7UI200, browserCORS,502/504|PASS|
| Health |4service thiếu|Health-only Actuator|8readiness200|PASS|
| Firebase |ADC chưa map|Native explicit sandbox|2realPNG/checksum/restart/delete|PASS_ADAPTER_ONLY|
| MinIO |Không native dependency|Không giả hạ tầng|503 thật|BLOCKED|
| Gemini/VNPay settlement |Không authorized run/fixture|Không gọi paid provider|0external provider calls|NOT_VERIFIED|

Đợt remediation hiện tại đã kết thúc phần kiểm chứng khả thi. Tiếp theo thực hiện prompt merge được owner yêu cầu; kết quả sau merge phải lấy request/test mới và cập nhật chương riêng trong cùng báo cáo.

## 37. Tích hợp origin/dev mới nhất vào Local và kiểm thử hồi quy toàn hệ thống sau Merge


### 37.1. Kết quả cuối và phạm vi chứng nhận

**PARTIAL**, kết quả HTTP mới từ `2026-11-11T17:55:26.336630+07:00` đến `2026-11-11T18:19:08.979397+07:00`. Đã tích hợp thật `origin/dev`, bảo toàn local fixes và kiểm thử bằng JAR build từ mã đã merge. Không dùng PASS trước merge làm chứng cứ cho chương này.

Kiểm kê **131 operation**, thêm0/xóa0 so với inventory trước merge. **108 operation có happy path ít nhất một route**; 92 đạt cả direct/Gateway, 16 direct-only đạt, 0 operation cloud thiếu một route happy trong ngân sách hiện được cho phép. Đã gửi request trực tiếp tới mọi operation và qua Gateway tới110 operation được expose. Các route internal thử bị chặn, không tính là business happy path.

Maven **213 cases / 56 suites,0 fail/error/skip**, Python4 pass; Gateway/direct CORS56/56; native smoke42/42 và42/42 sau restart; Swagger UI thực bảy Try it out200, UI/assets/config trực tiếp8process:24/24. Không dùng container. Blocker MinIO, Gemini, callback thanh toán và scope fixture được giữ rõ, không tuyên bố FULLY_VERIFIED_PASS.


### 37.2. Git revisions và phương án tích hợp

| Mốc | Giá trị |
|---|---|
| Branch | dev (không chuyển branch) |
| PRE_MERGE HEAD / merge base | `20663353d4818e21f20527f3499f430381ab60d4` |
| origin/dev trước và sau fetch | `ea938c3f0053c71920ccb66efeaa4836fa0258bf` |
| Incoming commit | `feat: unify backend configuration and fix local API access` |
| Divergence trước merge | 0 local /1 upstream |
| POST_MERGE HEAD | `ea938c3f0053c71920ccb66efeaa4836fa0258bf` |
| origin/dev từ ls-remote cuối | `ea938c3f0053c71920ccb66efeaa4836fa0258bf` (không tiến thêm khi kiểm tra) |
| Stash giữ để phục hồi | `40c60b6da48336d112d9fd1aa53231ee7245e417` |

Đã chạy `git fetch origin dev`, review toàn bộ diff, `git merge --ff-only origin/dev`, rồi `git stash apply` có kiểm tra. Không stash pop, không reset --hard, không chọn hàng loạt ours/theirs. Không cần checkpoint/merge commit trên branch: chỉ fast-forward tới commit đã có từ upstream. Git stash tạo object local phục hồi và còn được giữ. Khi giải quyết conflict có index tạm, hiện staged rỗng và không unresolved entry. **Không push, không cập nhật remote branch, không triển khai production.**


### 37.3. Bảo toàn thay đổi của owner và local

Trước stash/merge đã tạo và kiểm tra ZIP phục hồi **45 path** bao gồm mọi file tracked dirty và untracked liên quan (Backend source/tests, native scripts mới, prompts/reports và evidence mobile có sẵn). `pre-merge-backup/local-work.zip` ngoài repository, ACL chỉ current Windows user và SYSTEM; từng entry được đọc lại và so SHA-256. Manifest và binary diff staged/unstaged giữ cùng nơi. Root `.env` hiện hành được backup Windows DPAPI và decrypt-compare trong memory; không copy vào Git.

Stash scope chỉ `backend/` và năm native-tool file đã xác định;37 file được ghi nhận, không gom untracked riêng tư bằng stash -u toàn repo. Ba dirty evidence JSON mobile và các owner files được giữ nguyên bên ngoài stash, có ZIP đối chiếu. Root `.env` sau merge bằng nguyên byte trước merge=True; không đụng external development credentials. Bảy application.yml do owner chỉnh sẵn được xử lý theo từng block, không phục hồi mù bản cũ. Backup và stash vẫn còn sau campaign.


### 37.4. Toàn bộ thay đổi incoming

Upstream thay78 file: cấu hình `.env` dùng chung và service port aliases, dedicated Marketplace/CakeAI client variables, forwarded headers/Swagger prefix, CORS MVC/security/Preflight filter cùng hai test class, gỡ CorsProperties cũ, tài liệu local setup. Không có migration/schema, DTO nghiệp vụ hoặc API mapping mới/xóa. Không có file Frontend/Mobile incoming.

`.gitignore` chỉ thêm `/.local/` từ upstream; `.env.example`, Compose và các docs root dưới đây cũng là nội dung upstream nguyên bản, không chỉnh thủ công để đơn giản hóa merge. Không thực thi Docker hay Compose. Upstream có tài liệu CORS wildcard; local Backend nay áp dụng allowlist theo mục37.6, nên `docs/CORS-DEV.md` của upstream cần được đối chiếu với chương này khi vận hành.

| Status | Path incoming |
|---|---|
| M | `.env.example` |
| M | `.gitignore` |
| A | `backend/.env.example` |
| M | `backend/api-gateway/src/main/java/com/se193262/apigateway/CONTEXT.md` |
| A | `backend/api-gateway/src/main/java/com/se193262/apigateway/config/PreflightCorsConfig.java` |
| M | `backend/api-gateway/src/main/resources/application.properties` |
| A | `backend/api-gateway/src/test/java/com/se193262/apigateway/GatewayCorsTest.java` |
| D | `backend/bakery-service/.env.example` |
| M | `backend/bakery-service/README.md` |
| M | `backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/addon/controller/AddOnController.java` |
| M | `backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/controller/AdminBakeryController.java` |
| M | `backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/controller/BakeryController.java` |
| M | `backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/controller/BakeryOnboardingController.java` |
| M | `backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/controller/InternalBakeryController.java` |
| M | `backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/controller/PublicBakeryController.java` |
| M | `backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/catalog/CatalogController.java` |
| M | `backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/catalog/controller/InternalCatalogController.java` |
| M | `backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/category/controller/ProductCategoryController.java` |
| M | `backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/member/controller/BakeryMemberController.java` |
| M | `backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/product/controller/ProductController.java` |
| M | `backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/product/controller/PublicProductController.java` |
| M | `backend/bakery-service/src/main/java/com/se193262/bakeryservice/security/SecurityConfig.java` |
| M | `backend/bakery-service/src/main/resources/application.yml` |
| M | `backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/design/DesignController.java` |
| M | `backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/design/DesignValidationController.java` |
| M | `backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/design/PublicStorageController.java` |
| M | `backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/generation/GenerationController.java` |
| M | `backend/cake-ai-service/src/main/resources/application.yml` |
| M | `backend/chat-service/src/main/java/com/se193262/chatservice/config/SecurityConfig.java` |
| M | `backend/chat-service/src/main/java/com/se193262/chatservice/feature/conversation/ConversationController.java` |
| M | `backend/chat-service/src/main/java/com/se193262/chatservice/feature/message/MessageController.java` |
| M | `backend/chat-service/src/main/resources/application.yml` |
| D | `backend/identity-service/.env.example` |
| M | `backend/identity-service/README.md` |
| D | `backend/identity-service/src/main/java/com/se193262/identityservice/config/CorsProperties.java` |
| M | `backend/identity-service/src/main/java/com/se193262/identityservice/config/JwkSetController.java` |
| M | `backend/identity-service/src/main/java/com/se193262/identityservice/config/JwtConfig.java` |
| M | `backend/identity-service/src/main/java/com/se193262/identityservice/config/SecurityConfig.java` |
| M | `backend/identity-service/src/main/java/com/se193262/identityservice/feature/address/AddressController.java` |
| M | `backend/identity-service/src/main/java/com/se193262/identityservice/feature/authentication/AuthenticationController.java` |
| M | `backend/identity-service/src/main/java/com/se193262/identityservice/feature/authentication/ServiceTokenController.java` |
| M | `backend/identity-service/src/main/java/com/se193262/identityservice/feature/user/AdminUserController.java` |
| M | `backend/identity-service/src/main/java/com/se193262/identityservice/feature/user/UserContextController.java` |
| M | `backend/identity-service/src/main/java/com/se193262/identityservice/feature/user/UserController.java` |
| M | `backend/identity-service/src/main/resources/application.yml` |
| M | `backend/marketplace-service/README.md` |
| M | `backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/CakeRequestController.java` |
| M | `backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/MarketplaceContextController.java` |
| M | `backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/offer/OfferController.java` |
| M | `backend/marketplace-service/src/main/resources/application.yml` |
| M | `backend/order-service/src/main/java/com/se193262/orderservice/config/SecurityConfig.java` |
| M | `backend/order-service/src/main/java/com/se193262/orderservice/feature/order/InternalOrderController.java` |
| M | `backend/order-service/src/main/java/com/se193262/orderservice/feature/order/OfferOrderController.java` |
| M | `backend/order-service/src/main/java/com/se193262/orderservice/feature/order/OrderController.java` |
| M | `backend/order-service/src/main/java/com/se193262/orderservice/feature/review/ReviewController.java` |
| M | `backend/order-service/src/main/resources/application.yml` |
| A | `backend/platform-support/CONTEXT.md` |
| M | `backend/platform-support/src/main/java/com/se193262/platform/config/ResourceSecurityConfiguration.java` |
| A | `backend/platform-support/src/test/java/com/se193262/platform/config/ControllerCorsTest.java` |
| D | `backend/subscription-service/.env.example` |
| M | `backend/subscription-service/README.md` |
| M | `backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/payment/controller/AdminBakeryPaymentController.java` |
| M | `backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/payment/controller/BakeryPaymentController.java` |
| M | `backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/payment/controller/PaymentOptionsController.java` |
| M | `backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/payment/controller/VnpayController.java` |
| M | `backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/plan/controller/AdminSubscriptionPlanController.java` |
| M | `backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/plan/controller/SubscriptionPlanController.java` |
| M | `backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/subscription/controller/BakerySubscriptionController.java` |
| M | `backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/subscription/controller/InternalSubscriptionController.java` |
| M | `backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/subscriptionorder/controller/AdminSubscriptionOrderController.java` |
| M | `backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/subscriptionorder/controller/SubscriptionOrderController.java` |
| M | `backend/subscription-service/src/main/java/com/se193262/subscriptionservice/security/SecurityConfig.java` |
| M | `backend/subscription-service/src/main/resources/application.yml` |
| M | `compose.local-runtime.yaml` |
| M | `compose.yaml` |
| A | `docs/CORS-DEV.md` |
| A | `docs/LOCAL-SETUP.md` |
| M | `docs/PROJECT-STATUS.md` |


### 37.5. Xung đột và chứng minh không mất bản sửa

Có đúng7 conflict khi apply stash; fast-forward bản thân không conflict. Base/local/incoming đều được đọc và lưu hash. Upstream muốn `SERVER_PORT`→`<SERVICE>_SERVER_PORT`; owner đã dùng `SERVER_PORT_<SERVICE>` và local thêm health. Giữ cả hai alias và forwarded strategy; giữ datasource placeholders/password, root imports, dedicated client variables và health. Priority: explicit SERVER_PORT, owner alias, upstream alias, default808x. YAML được kiểm tra duplicate key, không còn marker.

| File conflict | Cách giải quyết |
|---|---|
| `backend/identity-service/src/main/resources/application.yml` | Giữ hai nhánh alias + framework forwarded headers; health/DB/client contract không bị bỏ |
| `backend/bakery-service/src/main/resources/application.yml` | Giữ hai nhánh alias + framework forwarded headers; health/DB/client contract không bị bỏ |
| `backend/marketplace-service/src/main/resources/application.yml` | Giữ hai nhánh alias + framework forwarded headers; health/DB/client contract không bị bỏ |
| `backend/subscription-service/src/main/resources/application.yml` | Giữ hai nhánh alias + framework forwarded headers; health/DB/client contract không bị bỏ |
| `backend/cake-ai-service/src/main/resources/application.yml` | Giữ hai nhánh alias + framework forwarded headers; health/DB/client contract không bị bỏ |
| `backend/order-service/src/main/resources/application.yml` | Giữ hai nhánh alias + framework forwarded headers; health/DB/client contract không bị bỏ |
| `backend/chat-service/src/main/resources/application.yml` | Giữ hai nhánh alias + framework forwarded headers; health/DB/client contract không bị bỏ |

F04 storage try/catch, F05 parse-before-Spec, F06 narrow405 handler, shared415 handler, health dependencies/security và OpenAPI customization/tests đều tồn tại trong local source/JAR. Mọi source file dùng compile khớp working source sau normalize EOL; `compiled_source_mismatch=[]`. Incoming root files khớp target, các owner file ngoài Backend không đổi. Evidence `merge-proof.json`, `merge-conflicts.json` và native HTTP mới.


### 37.6. Regression CORS sau merge và bản sửa

Build đầu sau merge:9 Gateway cases,1 failure; upstream test port5174 expected200, observed403 vì local policy chỉ allow5173. Ngoài ra upstream wildcard origin với credentials mở rộng phạm vi so với policy đã kiểm chứng; đây là thay đổi source xác nhận được, không gán thành auth bypass JWT.

Giữ class PreflightCorsConfig của upstream, hợp nhất thành **một** CORS filter cho preflight và actual request với origin/method/header cụ thể; EdgeHttpConfig chỉ còn transport handling. Giữ upstream controller annotations và `.cors(Customizer.withDefaults())`, đổi wildcard tại42 controller sang `BACKEND_CORS_ALLOWED_ORIGINS` (default localhost5173). Gateway dùng GATEWAY_CORS_ALLOWED_ORIGINS hoặc cùng policy Backend. Native launcher chỉ inject root value, không kế thừa máy ngoài; unit test xác minh mapping.

GatewayCorsTest vẫn thử5174 bằng **test-specific allowlist 5173,5174**, giữ assertion200/không gọi downstream và thêm unapproved403. ControllerCorsTest dùng configured origins, kiểm tra allowed preflight, actual401 không JWT và unknownorigin403. Không nới authentication hay làm yếu assertion. Hai CONTEXT Backend được cập nhật. Full213 tests pass; runtime56 checks đủ7service×direct/Gateway×allowed/denied×OPTIONS/GET đều đúng; browser thật đọc200 và chặn origin15173. Duplicate ACAO/ACAC được ngăn, không che lỗi business.


### 37.7. Root .env và service authentication sau merge

Root `.env` tiếp tục là nguồn duy nhất; không sửa thêm credential khi merge. Dedicated names mới từ upstream được giữ; alias SERVICE_CLIENT_SECRET của launcher vẫn chỉ nằm trong đúng consumer và bằng secret root của chính service đó. Identity nhận đúng hash theo từng client. Không nhập cặp dev bên ngoài. Cake AI DB password vẫn bằng bản owner sửa; native8085/readiness/DB/API/docs đều200.

| Client | Hash match | Scope/audience kiểm tra | JWT / downstream | Wrong secret / ungranted | Evidence |
|---|---|---|---|---|---|
| bakery-service | True | identity:user:read → identity-service | 200 / 200 | 401 / 401 | `HTTP-e526dc3c3881`; `HTTP-bdf8d21e425e` |
| subscription-service | True | bakery:profile:read → bakery-service | 200 / 200 | 401 / 401 | `HTTP-1f8e75afa4da`; `HTTP-84ddf513a4b6` |
| marketplace-service | True | bakery:profile:read → bakery-service | 200 / 200 | 401 / 401 | `HTTP-a76e0a3ab54a`; `HTTP-ef126672fa70` |
| cake-ai-service | True | marketplace:request:read → marketplace-service | 200 / 200 | 401 / 401 | `HTTP-79df386b06f3`; `HTTP-68bee6199087` |
| order-service | True | identity:user:read → identity-service | 200 / 200 | 401 / 401 | `HTTP-eff1a6515d4a`; `HTTP-d99c3080c42e` |
| chat-service | True | bakery:membership:read → bakery-service | 200 / 200 | 401 / 401 | `HTTP-70ec5b418e64`; `HTTP-45ac7d052d9d` |

Mọi audience/scope grant đang có trong Identity cũng được yêu cầu token thực, không thêm grant để tăng coverage. Missing endpoint scope403, wrong audience401, user JWT→internal403, JWT thật hết hạn401. Issuer/public-key validation và user ownership giữ nguyên. Thông tin env chỉ có tên/trạng thái trong config-sanitized.json; không có rawJWT/hash/password trong báo cáo.


### 37.8. Build, JAR và native runtime

Fresh copy source dưới `C:\Users\phuck\AppData\Local\Temp\bakery-native-remediation-20261111-160958\post-merge\verified\backend`, bỏ target/secrets; canonical `database/` sibling phục vụ MigrationSyncTest. Build reactor11 module thành công. Bản thử đầu CORS failure được giữ riêng tại gateway-before-policy-build.log; full build sau sửa là current-build-test.log, **213/56/0fail/0error/0skip**. Các Testcontainers class được loại, danh sách gốc đầy đủ mục24 vẫn áp dụng; hai class upstream mới đều được chạy, không xóa test cũ.

Native start bằng scripts/Native-Backend.ps1, đúng default Spring profile, binding loopback, root credentials và isolated datasource map. JAR lấy từ workspace fresh vừa test; không dùng JAR root trước merge. Bảy database test cũ của campaign được giữ, chỉ tạo cohort synthetic mới `postmerge1`, không dùng record cũ làm kết quả mới. Startup toàn stack, restart riêng Marketplace để thử durability, rồi rehearsal start toàn stack lần cuối kiểm tra trực tiếp UI/assets và đọc lại RFQ/Order. process manifests ghi PID/port/JAR SHA-256 và provenance names, không chứa giá trị credential.

Maven allowlist thực được lưu `test-command.json` (gồm ControllerCorsTest, GatewayCorsTest và các test local mới). Tất cả56 XML có0fail/error/skip;20 class/helper có phụ thuộc container không được chạy, không gọi chúng là PASS. Unit Gemini/Firebase có mock là chứng cứ contract, không phải provider E2E.


### 37.9. Kiểm kê và ma trận từng API sau merge

Source mappings và OpenAPI đã được đối chiếu lại: Identity21, Bakery42, Marketplace18, Subscription21, CakeAI11, Order10, Chat8; GET55/POST48/PATCH14/PUT7/DELETE7. 110 public Gateway,19 internal,1 JWKS direct,1 retired storage. Không có operation thêm/xóa. Actuator/springdoc generated endpoints được thử riêng, không cộng vào131.

Chỉ dùng ledger mới `C:\Users\phuck\AppData\Local\Temp\bakery-native-remediation-20261111-160958\post-merge\http-events.jsonl`. Mỗi evidence có timestamp/correlation/schema body đã sanitize. Cột role là actor metadata của case, scope/class rule lấy từ source. Expected401/403/404 chỉ xác minh negative, không làm happy. Callback IPN200 với chữ ký sai được loại khỏi happy count. Với blocked API, cột route ghi attempt thực gần nhất và nói rõ chưa có happy; random ID404 không chứng minh fixture thật. `PASS_BOTH_ROUTES` là case hợp lệ quan sát cả hai route, không khẳng định mọi tổ hợp DTO/role.

| API | Service | Direct route | Gateway route | Rule/class scope | Direct actual/expected/role/evidence | Gateway actual/expected/role/evidence | Negative evidence | Kết luận | Source |
|---|---|---|---|---|---|---|---|---|---|
| API-001 | identity-service | `GET /.well-known/jwks.json` | N/A (internal/JWKS/retired) | JWT_OR_PUBLIC_RULE | 200 (expected [200]) · ANONYMOUS · `HTTP-146f57af5408` | N/A | Không có negative riêng | PASS_DIRECT_ONLY | `backend/identity-service/src/main/java/com/se193262/identityservice/config/JwkSetController.java:25` |
| API-002 | identity-service | `GET /api/v1/users/me/addresses` | `/identity/api/v1/users/me/addresses` | JWT_OR_PUBLIC_RULE | 200 (expected [200]) · CUSTOMER · `HTTP-0acf8f1245c0` | 200 (expected [200]) · CUSTOMER · `HTTP-9340c1a1cc0a` | 401 (expected [401]) · ANONYMOUS · `HTTP-ec8ad1bfb239` | PASS_BOTH_ROUTES | `backend/identity-service/src/main/java/com/se193262/identityservice/feature/address/AddressController.java:22` |
| API-003 | identity-service | `GET /api/v1/users/me/addresses/{id}` | `/identity/api/v1/users/me/addresses/{id}` | JWT_OR_PUBLIC_RULE | 200 (expected [200]) · CUSTOMER · `HTTP-02aaa0b63bf3` | 200 (expected [200]) · CUSTOMER · `HTTP-f6071fbabb96` | 401 (expected [401]) · ANONYMOUS · `HTTP-82b4deae9cba` | PASS_BOTH_ROUTES | `backend/identity-service/src/main/java/com/se193262/identityservice/feature/address/AddressController.java:27` |
| API-004 | identity-service | `POST /api/v1/users/me/addresses` | `/identity/api/v1/users/me/addresses` | JWT_OR_PUBLIC_RULE | 201 (expected [201]) · CUSTOMER · `HTTP-22bb1aa4dc83` | 201 (expected [201]) · CUSTOMER · `HTTP-bf88c9cac227` | 401 (expected [401]) · ANONYMOUS · `HTTP-eaf8b86ed027` | PASS_BOTH_ROUTES | `backend/identity-service/src/main/java/com/se193262/identityservice/feature/address/AddressController.java:32` |
| API-005 | identity-service | `PATCH /api/v1/users/me/addresses/{id}` | `/identity/api/v1/users/me/addresses/{id}` | JWT_OR_PUBLIC_RULE | 200 (expected [200]) · CUSTOMER · `HTTP-23850c9dfd73` | 200 (expected [200]) · CUSTOMER · `HTTP-bf1f58fb4d7e` | 401 (expected [401]) · ANONYMOUS · `HTTP-3fb575f59bd9` | PASS_BOTH_ROUTES | `backend/identity-service/src/main/java/com/se193262/identityservice/feature/address/AddressController.java:38` |
| API-006 | identity-service | `PUT /api/v1/users/me/addresses/{id}/default` | `/identity/api/v1/users/me/addresses/{id}/default` | JWT_OR_PUBLIC_RULE | 200 (expected [200]) · CUSTOMER · `HTTP-913ec7248a6b` | 200 (expected [200]) · CUSTOMER · `HTTP-374da6b33cf5` | 401 (expected [401]) · ANONYMOUS · `HTTP-bda2a7a29c22` | PASS_BOTH_ROUTES | `backend/identity-service/src/main/java/com/se193262/identityservice/feature/address/AddressController.java:44` |
| API-007 | identity-service | `DELETE /api/v1/users/me/addresses/{id}` | `/identity/api/v1/users/me/addresses/{id}` | JWT_OR_PUBLIC_RULE | 204 (expected [204]) · CUSTOMER · `HTTP-0ae204dc04cf` | 204 (expected [204]) · CUSTOMER · `HTTP-6cfd04d5f2dd` | 401 (expected [401]) · ANONYMOUS · `HTTP-690c3a97f532` | PASS_BOTH_ROUTES | `backend/identity-service/src/main/java/com/se193262/identityservice/feature/address/AddressController.java:49` |
| API-008 | identity-service | `POST /api/v1/auth/register` | `/identity/api/v1/auth/register` | JWT_OR_PUBLIC_RULE | 201 (expected [201]) · ANONYMOUS · `HTTP-ee089a127d9e` | 201 (expected [201]) · ANONYMOUS · `HTTP-b49d66686661` | 400 (expected [400]) · ANONYMOUS · `HTTP-b0ea60b601d2` | PASS_BOTH_ROUTES | `backend/identity-service/src/main/java/com/se193262/identityservice/feature/authentication/AuthenticationController.java:44` |
| API-009 | identity-service | `POST /api/v1/auth/login` | `/identity/api/v1/auth/login` | JWT_OR_PUBLIC_RULE | 200 (expected [200]) · ANONYMOUS · `HTTP-4e04d246327c` | 200 (expected [200]) · ANONYMOUS · `HTTP-b25899a9b7d7` | 400 (expected [400]) · ANONYMOUS · `HTTP-3dc79a448617` | PASS_BOTH_ROUTES | `backend/identity-service/src/main/java/com/se193262/identityservice/feature/authentication/AuthenticationController.java:53` |
| API-010 | identity-service | `POST /api/v1/auth/refresh` | `/identity/api/v1/auth/refresh` | JWT_OR_PUBLIC_RULE | 200 (expected [200]) · ANONYMOUS · `HTTP-e5131f05c8bf` | 200 (expected [200]) · ANONYMOUS · `HTTP-123bdc46603a` | 401 (expected [401]) · ANONYMOUS · `HTTP-106a1b43975a` | PASS_BOTH_ROUTES | `backend/identity-service/src/main/java/com/se193262/identityservice/feature/authentication/AuthenticationController.java:59` |
| API-011 | identity-service | `POST /api/v1/auth/logout` | `/identity/api/v1/auth/logout` | JWT_OR_PUBLIC_RULE | 200 (expected [200]) · CUSTOMER · `HTTP-a5a64c79a613` | 200 (expected [200]) · CUSTOMER · `HTTP-acf075899f72` | 401 (expected [401]) · ANONYMOUS · `HTTP-500c57a057b6` | PASS_BOTH_ROUTES | `backend/identity-service/src/main/java/com/se193262/identityservice/feature/authentication/AuthenticationController.java:65` |
| API-012 | identity-service | `GET /api/v1/auth/me` | `/identity/api/v1/auth/me` | JWT_OR_PUBLIC_RULE | 200 (expected [200]) · CUSTOMER · `HTTP-d897ee8b0fa8` | 200 (expected [200]) · CUSTOMER · `HTTP-0f24efa828c1` | 401 (expected [401]) · ANONYMOUS · `HTTP-1f9d385a27e3` | PASS_BOTH_ROUTES | `backend/identity-service/src/main/java/com/se193262/identityservice/feature/authentication/AuthenticationController.java:74` |
| API-013 | identity-service | `POST /internal/v1/auth/service-token` | N/A (internal/JWKS/retired) | INTERNAL | 200 (expected [200]) · ANONYMOUS · `HTTP-e3f6a996b0ba` | N/A | 401 (expected [401]) · ANONYMOUS · `HTTP-35c7413bf83a` | PASS_DIRECT_ONLY | `backend/identity-service/src/main/java/com/se193262/identityservice/feature/authentication/ServiceTokenController.java:17` |
| API-014 | identity-service | `GET /api/v1/admin/users` | `/identity/api/v1/admin/users` | JWT_OR_PUBLIC_RULE | 200 (expected [200]) · ADMIN · `HTTP-4493284bbedc` | 200 (expected [200]) · ADMIN · `HTTP-a3d4419ccfb0` | 401 (expected [401]) · ANONYMOUS · `HTTP-18b86b2d8a53` | PASS_BOTH_ROUTES | `backend/identity-service/src/main/java/com/se193262/identityservice/feature/user/AdminUserController.java:40` |
| API-015 | identity-service | `GET /api/v1/admin/users/{userId}` | `/identity/api/v1/admin/users/{userId}` | JWT_OR_PUBLIC_RULE | 200 (expected [200]) · ADMIN · `HTTP-925dac8b8662` | 200 (expected [200]) · ADMIN · `HTTP-7af54b3796a1` | 401 (expected [401]) · ANONYMOUS · `HTTP-e2f267172b43` | PASS_BOTH_ROUTES | `backend/identity-service/src/main/java/com/se193262/identityservice/feature/user/AdminUserController.java:51` |
| API-016 | identity-service | `PATCH /api/v1/admin/users/{userId}/status` | `/identity/api/v1/admin/users/{userId}/status` | JWT_OR_PUBLIC_RULE | 200 (expected [200]) · ADMIN · `HTTP-fa56910dd822` | 200 (expected [200]) · ADMIN · `HTTP-5d6c12af35ab` | 401 (expected [401]) · ANONYMOUS · `HTTP-878c65631cea` | PASS_BOTH_ROUTES | `backend/identity-service/src/main/java/com/se193262/identityservice/feature/user/AdminUserController.java:56` |
| API-017 | identity-service | `PUT /api/v1/admin/users/{userId}/roles` | `/identity/api/v1/admin/users/{userId}/roles` | JWT_OR_PUBLIC_RULE | 200 (expected [200]) · ADMIN · `HTTP-d4dee3a53330` | 200 (expected [200]) · ADMIN · `HTTP-78ecf70cbb80` | 401 (expected [401]) · ANONYMOUS · `HTTP-a3c90a657177` | PASS_BOTH_ROUTES | `backend/identity-service/src/main/java/com/se193262/identityservice/feature/user/AdminUserController.java:65` |
| API-018 | identity-service | `GET /internal/v1/users/{id}` | N/A (internal/JWKS/retired) | hasAuthority('SCOPE_identity:user:read') | 200 (expected [200]) · SERVICE:order-service · `HTTP-d99c3080c42e` | N/A | 401 (expected [401]) · EXPIRED_SERVICE · `HTTP-bdc9bb9ef29a` | PASS_DIRECT_ONLY | `backend/identity-service/src/main/java/com/se193262/identityservice/feature/user/UserContextController.java:18` |
| API-019 | identity-service | `PUT /internal/v1/users/{id}/bakery-owner` | N/A (internal/JWKS/retired) | hasAuthority('SCOPE_identity:bakery-owner:grant') | 204 (expected [204]) · SERVICE:bakery-service · `HTTP-0b221a5f9b48` | N/A | 401 (expected [401]) · ANONYMOUS · `HTTP-e4467ffc5005` | PASS_DIRECT_ONLY | `backend/identity-service/src/main/java/com/se193262/identityservice/feature/user/UserContextController.java:24` |
| API-020 | identity-service | `GET /internal/v1/users/{userId}/addresses/{addressId}` | N/A (internal/JWKS/retired) | hasAuthority('SCOPE_identity:address:read') | 200 (expected [200]) · SERVICE:order-service · `HTTP-77ad486ddd36` | N/A | 401 (expected [401]) · ANONYMOUS · `HTTP-6aeee2d39ac9` | PASS_DIRECT_ONLY | `backend/identity-service/src/main/java/com/se193262/identityservice/feature/user/UserContextController.java:31` |
| API-021 | identity-service | `PATCH /api/v1/users/me` | `/identity/api/v1/users/me` | JWT_OR_PUBLIC_RULE | 200 (expected [200]) · CUSTOMER · `HTTP-cddf2a899a07` | 200 (expected [200]) · CUSTOMER · `HTTP-136925b27f60` | 401 (expected [401]) · ANONYMOUS · `HTTP-ea7aa67a86ed` | PASS_BOTH_ROUTES | `backend/identity-service/src/main/java/com/se193262/identityservice/feature/user/UserController.java:32` |
| API-022 | bakery-service | `GET /api/v1/bakeries/{bakeryId}/add-ons` | `/bakery/api/v1/bakeries/{bakeryId}/add-ons` | JWT_OR_PUBLIC_RULE | 200 (expected [200]) · BAKERY_OWNER · `HTTP-14e32ba5a6ba` | 200 (expected [200]) · BAKERY_OWNER · `HTTP-7992a0e6734f` | 401 (expected [401]) · ANONYMOUS · `HTTP-b3d0ea6862c8` | PASS_BOTH_ROUTES | `backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/addon/controller/AddOnController.java:38` |
| API-023 | bakery-service | `POST /api/v1/bakeries/{bakeryId}/add-ons` | `/bakery/api/v1/bakeries/{bakeryId}/add-ons` | JWT_OR_PUBLIC_RULE | 201 (expected [201]) · BAKERY_OWNER · `HTTP-b91b0b70e521` | 201 (expected [201]) · BAKERY_OWNER · `HTTP-fee8ab4eea8f` | 401 (expected [401]) · ANONYMOUS · `HTTP-f8d2ba601122` | PASS_BOTH_ROUTES | `backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/addon/controller/AddOnController.java:43` |
| API-024 | bakery-service | `PATCH /api/v1/bakeries/{bakeryId}/add-ons/{addOnId}` | `/bakery/api/v1/bakeries/{bakeryId}/add-ons/{addOnId}` | JWT_OR_PUBLIC_RULE | 200 (expected [200]) · BAKERY_OWNER · `HTTP-3b54aaa53cbb` | 200 (expected [200]) · BAKERY_OWNER · `HTTP-9aa90e611c4d` | 401 (expected [401]) · ANONYMOUS · `HTTP-afa7637cb82b` | PASS_BOTH_ROUTES | `backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/addon/controller/AddOnController.java:50` |
| API-025 | bakery-service | `DELETE /api/v1/bakeries/{bakeryId}/add-ons/{addOnId}` | `/bakery/api/v1/bakeries/{bakeryId}/add-ons/{addOnId}` | JWT_OR_PUBLIC_RULE | 204 (expected [204]) · BAKERY_OWNER · `HTTP-c3da27c24bc6` | 204 (expected [204]) · BAKERY_OWNER · `HTTP-887ba9b94d17` | 401 (expected [401]) · ANONYMOUS · `HTTP-2ff2217a8b6f` | PASS_BOTH_ROUTES | `backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/addon/controller/AddOnController.java:56` |
| API-026 | bakery-service | `POST /api/v1/bakeries/{bakeryId}/add-ons/{addOnId}/image` | `/bakery/api/v1/bakeries/{bakeryId}/add-ons/{addOnId}/image` | JWT_OR_PUBLIC_RULE | HAPPY CHƯA ĐẠT; 503 (expected [503]) · BAKERY_OWNER · `HTTP-32282183bde8` | HAPPY CHƯA ĐẠT; 503 (expected [503]) · BAKERY_OWNER · `HTTP-91eefc81087f` | 401 (expected [401]) · ANONYMOUS · `HTTP-dd668598f6ac` | BLOCKED_MINIO | `backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/addon/controller/AddOnController.java:62` |
| API-027 | bakery-service | `GET /api/v1/admin/bakeries` | `/bakery/api/v1/admin/bakeries` | JWT_OR_PUBLIC_RULE | 200 (expected [200]) · ADMIN · `HTTP-d4eaa9a75622` | 200 (expected [200]) · ADMIN · `HTTP-1bbc590928d0` | 401 (expected [401]) · ANONYMOUS · `HTTP-9017fa14a247` | PASS_BOTH_ROUTES | `backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/controller/AdminBakeryController.java:42` |
| API-028 | bakery-service | `GET /api/v1/admin/bakeries/{bakeryId}` | `/bakery/api/v1/admin/bakeries/{bakeryId}` | JWT_OR_PUBLIC_RULE | 200 (expected [200]) · ADMIN · `HTTP-d57e8db189b7` | 200 (expected [200]) · ADMIN · `HTTP-ed34fb9479f4` | 401 (expected [401]) · ANONYMOUS · `HTTP-363809bbefa2` | PASS_BOTH_ROUTES | `backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/controller/AdminBakeryController.java:53` |
| API-029 | bakery-service | `PATCH /api/v1/admin/bakeries/{bakeryId}/status` | `/bakery/api/v1/admin/bakeries/{bakeryId}/status` | JWT_OR_PUBLIC_RULE | 200 (expected [200]) · ADMIN · `HTTP-dd0754f44edd` | 200 (expected [200]) · ADMIN · `HTTP-b3d5ef248ef4` | 401 (expected [401]) · ANONYMOUS · `HTTP-a65c74e00528` | PASS_BOTH_ROUTES | `backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/controller/AdminBakeryController.java:58` |
| API-030 | bakery-service | `POST /api/v1/bakeries` | `/bakery/api/v1/bakeries` | JWT_OR_PUBLIC_RULE | 201 (expected [201]) · BAKERY_OWNER · `HTTP-5b68cd61b426` | 201 (expected [201]) · BAKERY_OWNER · `HTTP-881a5878d717` | 401 (expected [401]) · ANONYMOUS · `HTTP-a414df03cb56` | PASS_BOTH_ROUTES | `backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/controller/BakeryController.java:40` |
| API-031 | bakery-service | `PATCH /api/v1/bakeries/{bakeryId}` | `/bakery/api/v1/bakeries/{bakeryId}` | JWT_OR_PUBLIC_RULE | 200 (expected [200]) · BAKERY_OWNER · `HTTP-6885273ef58f` | 200 (expected [200]) · BAKERY_OWNER · `HTTP-50f3fcbf52d0` | 401 (expected [401]) · ANONYMOUS · `HTTP-f07b4d7a6bc5` | PASS_BOTH_ROUTES | `backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/controller/BakeryController.java:48` |
| API-032 | bakery-service | `PUT /api/v1/bakeries/{bakeryId}/operations` | `/bakery/api/v1/bakeries/{bakeryId}/operations` | JWT_OR_PUBLIC_RULE | 200 (expected [200]) · BAKERY_OWNER · `HTTP-bc6219e0bdc9` | 200 (expected [200]) · BAKERY_OWNER · `HTTP-85b73ed14a47` | 401 (expected [401]) · ANONYMOUS · `HTTP-3516e19b87d6` | PASS_BOTH_ROUTES | `backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/controller/BakeryController.java:54` |
| API-033 | bakery-service | `POST /api/v1/bakeries/{bakeryId}/submit-for-approval` | `/bakery/api/v1/bakeries/{bakeryId}/submit-for-approval` | JWT_OR_PUBLIC_RULE | 200 (expected [200]) · BAKERY_OWNER · `HTTP-78f3fefbebf9` | 200 (expected [200]) · BAKERY_OWNER · `HTTP-8edfc7c931df` | 401 (expected [401]) · ANONYMOUS · `HTTP-9953432ddc84` | PASS_BOTH_ROUTES | `backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/controller/BakeryController.java:61` |
| API-034 | bakery-service | `POST /api/v1/bakeries/{bakeryId}/logo` | `/bakery/api/v1/bakeries/{bakeryId}/logo` | JWT_OR_PUBLIC_RULE | HAPPY CHƯA ĐẠT; 400 (expected [400]) · BAKERY_OWNER · `HTTP-513221f8f291` | HAPPY CHƯA ĐẠT; 400 (expected [400]) · BAKERY_OWNER · `HTTP-f1804f42a445` | 401 (expected [401]) · ANONYMOUS · `HTTP-badf1ee9874b` | BLOCKED_MINIO | `backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/controller/BakeryController.java:66` |
| API-035 | bakery-service | `POST /api/v1/bakeries/{bakeryId}/cover` | `/bakery/api/v1/bakeries/{bakeryId}/cover` | JWT_OR_PUBLIC_RULE | HAPPY CHƯA ĐẠT; 503 (expected [503]) · BAKERY_OWNER · `HTTP-fbc4a6b02a73` | HAPPY CHƯA ĐẠT; 503 (expected [503]) · BAKERY_OWNER · `HTTP-012486bdc6bf` | 401 (expected [401]) · ANONYMOUS · `HTTP-bd44eecdf388` | BLOCKED_MINIO | `backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/controller/BakeryController.java:73` |
| API-036 | bakery-service | `GET /api/v1/bakeries/onboarding` | `/bakery/api/v1/bakeries/onboarding` | JWT_OR_PUBLIC_RULE | 200 (expected [200]) · CUSTOMER · `HTTP-d1c3d2741a61` | 200 (expected [200]) · CUSTOMER · `HTTP-ea92fedffefe` | 401 (expected [401]) · ANONYMOUS · `HTTP-edba4b1c8c5e` | PASS_BOTH_ROUTES | `backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/controller/BakeryOnboardingController.java:32` |
| API-037 | bakery-service | `POST /api/v1/bakeries/onboarding` | `/bakery/api/v1/bakeries/onboarding` | JWT_OR_PUBLIC_RULE | 200 (expected [200]) · CUSTOMER · `HTTP-4cd98295ff0a` | 200 (expected [200]) · CUSTOMER · `HTTP-3e14b5f9e5a6` | 401 (expected [401]) · ANONYMOUS · `HTTP-2c0db87b68a0` | PASS_BOTH_ROUTES | `backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/controller/BakeryOnboardingController.java:37` |
| API-038 | bakery-service | `POST /api/v1/bakeries/{bakeryId}/onboarding/complete` | `/bakery/api/v1/bakeries/{bakeryId}/onboarding/complete` | JWT_OR_PUBLIC_RULE | 204 (expected [204]) · CUSTOMER · `HTTP-dee646d29986` | 204 (expected [204]) · CUSTOMER · `HTTP-e977e9d850b8` | 401 (expected [401]) · ANONYMOUS · `HTTP-170cd8405e0e` | PASS_BOTH_ROUTES | `backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/controller/BakeryOnboardingController.java:43` |
| API-039 | bakery-service | `PUT /internal/v1/bakeries/{bakeryId}/onboarding/activate` | N/A (internal/JWKS/retired) | INTERNAL | 204 (expected [204]) · SERVICE:subscription-service · `HTTP-0c61bf5e087c` | N/A | 401 (expected [401]) · ANONYMOUS · `HTTP-d2279418ddd9` | PASS_DIRECT_ONLY | `backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/controller/InternalBakeryController.java:32` |
| API-040 | bakery-service | `GET /internal/v1/bakeries/{bakeryId}` | N/A (internal/JWKS/retired) | INTERNAL | 200 (expected [200]) · SERVICE:marketplace-service · `HTTP-ef126672fa70` | N/A | 403 (expected [403]) · CUSTOMER · `HTTP-faa2fc081c7a` | PASS_DIRECT_ONLY | `backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/controller/InternalBakeryController.java:38` |
| API-041 | bakery-service | `GET /internal/v1/bakeries/{bakeryId}/members/{userId}/authorization` | N/A (internal/JWKS/retired) | INTERNAL | 200 (expected [200]) · SERVICE:chat-service · `HTTP-45ac7d052d9d` | N/A | 403 (expected [403]) · SERVICE:marketplace-service · `HTTP-0fd209a10d55` | PASS_DIRECT_ONLY | `backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/controller/InternalBakeryController.java:43` |
| API-042 | bakery-service | `GET /api/v1/bakeries` | `/bakery/api/v1/bakeries` | JWT_OR_PUBLIC_RULE | 200 (expected [200]) · ANONYMOUS · `HTTP-2286c26362ac` | 200 (expected [200]) · ANONYMOUS · `HTTP-15cedea9b70e` | 403 (expected [403]) · CUSTOMER · `HTTP-2e0d47f47c79` | PASS_BOTH_ROUTES | `backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/controller/PublicBakeryController.java:26` |
| API-043 | bakery-service | `GET /api/v1/bakeries/{bakeryId}` | `/bakery/api/v1/bakeries/{bakeryId}` | JWT_OR_PUBLIC_RULE | 200 (expected [200]) · ANONYMOUS · `HTTP-e3cd0be48d1f` | 200 (expected [200]) · ANONYMOUS · `HTTP-7d8fadc6d2cd` | 401 (expected [401]) · ANONYMOUS · `HTTP-edba4b1c8c5e` | PASS_BOTH_ROUTES | `backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/controller/PublicBakeryController.java:37` |
| API-044 | bakery-service | `GET /internal/v1/users/{userId}/bakery-memberships` | N/A (internal/JWKS/retired) | hasAuthority('SCOPE_bakery:membership:read') | 200 (expected [200]) · SERVICE:marketplace-service · `HTTP-fe8b6c3da758` | N/A | 401 (expected [401]) · ANONYMOUS · `HTTP-fed1bae30bcc` | PASS_DIRECT_ONLY | `backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/catalog/CatalogController.java:22` |
| API-045 | bakery-service | `POST /internal/v1/catalog/customization-quotes` | N/A (internal/JWKS/retired) | hasAuthority('SCOPE_bakery:catalog:quote') | HAPPY CHƯA ĐẠT; 401 (expected [401]) · ANONYMOUS · `HTTP-e7d2f46def1d` | N/A | 401 (expected [401]) · ANONYMOUS · `HTTP-e7d2f46def1d` | BLOCKED_MINIO | `backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/catalog/CatalogController.java:28` |
| API-046 | bakery-service | `POST /internal/v1/catalog/add-on-quotes` | N/A (internal/JWKS/retired) | hasAuthority('SCOPE_bakery:catalog:quote') | 200 (expected [200]) · SERVICE:marketplace-service · `HTTP-ea6339252c4d` | N/A | 401 (expected [401]) · ANONYMOUS · `HTTP-4265da7d8277` | PASS_DIRECT_ONLY | `backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/catalog/CatalogController.java:34` |
| API-047 | bakery-service | `POST /internal/v1/catalog/quotes` | N/A (internal/JWKS/retired) | INTERNAL | HAPPY CHƯA ĐẠT; 401 (expected [401]) · ANONYMOUS · `HTTP-32cb58306fb2` | N/A | 401 (expected [401]) · ANONYMOUS · `HTTP-32cb58306fb2` | BLOCKED_MINIO | `backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/catalog/controller/InternalCatalogController.java:25` |
| API-048 | bakery-service | `GET /api/v1/bakeries/{bakeryId}/categories` | `/bakery/api/v1/bakeries/{bakeryId}/categories` | JWT_OR_PUBLIC_RULE | 200 (expected [200]) · BAKERY_OWNER · `HTTP-fd8da65f5401` | 200 (expected [200]) · BAKERY_OWNER · `HTTP-30caa84e4364` | 401 (expected [401]) · ANONYMOUS · `HTTP-fe950ef3c6b2` | PASS_BOTH_ROUTES | `backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/category/controller/ProductCategoryController.java:34` |
| API-049 | bakery-service | `POST /api/v1/bakeries/{bakeryId}/categories` | `/bakery/api/v1/bakeries/{bakeryId}/categories` | JWT_OR_PUBLIC_RULE | 201 (expected [201]) · BAKERY_OWNER · `HTTP-abb1de0e2656` | 201 (expected [201]) · BAKERY_OWNER · `HTTP-d33dd8d50a45` | 401 (expected [401]) · ANONYMOUS · `HTTP-870704a8d900` | PASS_BOTH_ROUTES | `backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/category/controller/ProductCategoryController.java:39` |
| API-050 | bakery-service | `PATCH /api/v1/bakeries/{bakeryId}/categories/{categoryId}` | `/bakery/api/v1/bakeries/{bakeryId}/categories/{categoryId}` | JWT_OR_PUBLIC_RULE | 200 (expected [200]) · BAKERY_OWNER · `HTTP-a5626fbf8135` | 200 (expected [200]) · BAKERY_OWNER · `HTTP-d3d7fcbcb2ad` | 401 (expected [401]) · ANONYMOUS · `HTTP-db2dab70ce1e` | PASS_BOTH_ROUTES | `backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/category/controller/ProductCategoryController.java:46` |
| API-051 | bakery-service | `DELETE /api/v1/bakeries/{bakeryId}/categories/{categoryId}` | `/bakery/api/v1/bakeries/{bakeryId}/categories/{categoryId}` | JWT_OR_PUBLIC_RULE | 204 (expected [204]) · BAKERY_OWNER · `HTTP-902ae2a6ac3a` | 204 (expected [204]) · BAKERY_OWNER · `HTTP-0ab1e5ea1363` | 401 (expected [401]) · ANONYMOUS · `HTTP-bbd1320f5546` | PASS_BOTH_ROUTES | `backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/category/controller/ProductCategoryController.java:52` |
| API-052 | bakery-service | `GET /api/v1/bakeries/{bakeryId}/members` | `/bakery/api/v1/bakeries/{bakeryId}/members` | JWT_OR_PUBLIC_RULE | 200 (expected [200]) · BAKERY_OWNER · `HTTP-ff45928d17be` | 200 (expected [200]) · BAKERY_OWNER · `HTTP-b8afe513a895` | 401 (expected [401]) · ANONYMOUS · `HTTP-5d6ecc23391c` | PASS_BOTH_ROUTES | `backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/member/controller/BakeryMemberController.java:28` |
| API-053 | bakery-service | `GET /api/v1/bakeries/{bakeryId}/products` | `/bakery/api/v1/bakeries/{bakeryId}/products` | JWT_OR_PUBLIC_RULE | 200 (expected [200]) · BAKERY_OWNER · `HTTP-1c23bacc3a04` | 200 (expected [200]) · BAKERY_OWNER · `HTTP-b0df4180e411` | 401 (expected [401]) · ANONYMOUS · `HTTP-21493114f423` | PASS_BOTH_ROUTES | `backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/product/controller/ProductController.java:43` |
| API-054 | bakery-service | `POST /api/v1/bakeries/{bakeryId}/products` | `/bakery/api/v1/bakeries/{bakeryId}/products` | JWT_OR_PUBLIC_RULE | 201 (expected [201]) · BAKERY_OWNER · `HTTP-9c1a9b9eb38f` | 201 (expected [201]) · BAKERY_OWNER · `HTTP-47bed4322747` | 401 (expected [401]) · ANONYMOUS · `HTTP-dec337fccfe1` | PASS_BOTH_ROUTES | `backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/product/controller/ProductController.java:55` |
| API-055 | bakery-service | `PATCH /api/v1/bakeries/{bakeryId}/products/{productId}` | `/bakery/api/v1/bakeries/{bakeryId}/products/{productId}` | JWT_OR_PUBLIC_RULE | 200 (expected [200]) · BAKERY_OWNER · `HTTP-61819aa2ea8e` | 200 (expected [200]) · BAKERY_OWNER · `HTTP-d789f384debb` | 401 (expected [401]) · ANONYMOUS · `HTTP-8bbf371b712c` | PASS_BOTH_ROUTES | `backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/product/controller/ProductController.java:62` |
| API-056 | bakery-service | `PUT /api/v1/bakeries/{bakeryId}/products/{productId}/options` | `/bakery/api/v1/bakeries/{bakeryId}/products/{productId}/options` | JWT_OR_PUBLIC_RULE | 200 (expected [200]) · BAKERY_OWNER · `HTTP-d692be33120b` | 200 (expected [200]) · BAKERY_OWNER · `HTTP-a8cb4228d0a8` | 401 (expected [401]) · ANONYMOUS · `HTTP-709ddf3a8862` | PASS_BOTH_ROUTES | `backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/product/controller/ProductController.java:68` |
| API-057 | bakery-service | `POST /api/v1/bakeries/{bakeryId}/products/{productId}/images` | `/bakery/api/v1/bakeries/{bakeryId}/products/{productId}/images` | JWT_OR_PUBLIC_RULE | HAPPY CHƯA ĐẠT; 503 (expected [503]) · BAKERY_OWNER · `HTTP-d10ad702cb24` | HAPPY CHƯA ĐẠT; 503 (expected [503]) · BAKERY_OWNER · `HTTP-e6d6760c24e5` | 401 (expected [401]) · ANONYMOUS · `HTTP-c418dd8de8dc` | BLOCKED_MINIO | `backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/product/controller/ProductController.java:75` |
| API-058 | bakery-service | `DELETE /api/v1/bakeries/{bakeryId}/products/{productId}/images/{imageId}` | `/bakery/api/v1/bakeries/{bakeryId}/products/{productId}/images/{imageId}` | JWT_OR_PUBLIC_RULE | HAPPY CHƯA ĐẠT; 401 (expected [401]) · ANONYMOUS · `HTTP-532fb7037ad0` | HAPPY CHƯA ĐẠT; 401 (expected [401]) · ANONYMOUS · `HTTP-44bd07e467ec` | 401 (expected [401]) · ANONYMOUS · `HTTP-44bd07e467ec` | BLOCKED_MINIO | `backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/product/controller/ProductController.java:84` |
| API-059 | bakery-service | `POST /api/v1/bakeries/{bakeryId}/products/{productId}/publish` | `/bakery/api/v1/bakeries/{bakeryId}/products/{productId}/publish` | JWT_OR_PUBLIC_RULE | HAPPY CHƯA ĐẠT; 422 (expected [422]) · BAKERY_OWNER · `HTTP-74173648f11f` | HAPPY CHƯA ĐẠT; 422 (expected [422]) · BAKERY_OWNER · `HTTP-35b9590f94d1` | 401 (expected [401]) · ANONYMOUS · `HTTP-aa9499c21f6c` | BLOCKED_MINIO | `backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/product/controller/ProductController.java:91` |
| API-060 | bakery-service | `POST /api/v1/bakeries/{bakeryId}/products/{productId}/hide` | `/bakery/api/v1/bakeries/{bakeryId}/products/{productId}/hide` | JWT_OR_PUBLIC_RULE | HAPPY CHƯA ĐẠT; 409 (expected [409]) · BAKERY_OWNER · `HTTP-e894aa0ac7a1` | HAPPY CHƯA ĐẠT; 409 (expected [409]) · BAKERY_OWNER · `HTTP-d2408208f061` | 401 (expected [401]) · ANONYMOUS · `HTTP-c7be83704fdb` | BLOCKED_MINIO | `backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/product/controller/ProductController.java:97` |
| API-061 | bakery-service | `POST /api/v1/bakeries/{bakeryId}/products/{productId}/archive` | `/bakery/api/v1/bakeries/{bakeryId}/products/{productId}/archive` | JWT_OR_PUBLIC_RULE | 200 (expected [200]) · BAKERY_OWNER · `HTTP-8040bad16ad6` | 200 (expected [200]) · BAKERY_OWNER · `HTTP-7a8de884cc3a` | 401 (expected [401]) · ANONYMOUS · `HTTP-c177de0989ce` | PASS_BOTH_ROUTES | `backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/product/controller/ProductController.java:103` |
| API-062 | bakery-service | `GET /api/v1/products` | `/bakery/api/v1/products` | JWT_OR_PUBLIC_RULE | 200 (expected [200]) · ANONYMOUS · `HTTP-040e39adf0ac` | 200 (expected [200]) · ANONYMOUS · `HTTP-0ef895a482ce` | Không có negative riêng | PASS_BOTH_ROUTES | `backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/product/controller/PublicProductController.java:27` |
| API-063 | bakery-service | `GET /api/v1/products/{productId}` | `/bakery/api/v1/products/{productId}` | JWT_OR_PUBLIC_RULE | HAPPY CHƯA ĐẠT; 404 (expected [404]) · ANONYMOUS · `HTTP-f3f4fc79ee52` | HAPPY CHƯA ĐẠT; 404 (expected [404]) · ANONYMOUS · `HTTP-696255673f35` | 404 (expected [404]) · ANONYMOUS · `HTTP-696255673f35` | BLOCKED_MINIO | `backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/product/controller/PublicProductController.java:43` |
| API-064 | marketplace-service | `GET /api/v1/cake-requests` | `/marketplace/api/v1/cake-requests` | JWT_OR_PUBLIC_RULE | 200 (expected [200]) · CUSTOMER · `HTTP-dea6d2edbf67` | 200 (expected [200]) · CUSTOMER · `HTTP-c528fac077bf` | 401 (expected [401]) · ANONYMOUS · `HTTP-9731caf99f4b` | PASS_BOTH_ROUTES | `backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/CakeRequestController.java:27` |
| API-065 | marketplace-service | `GET /api/v1/cake-requests/{id}` | `/marketplace/api/v1/cake-requests/{id}` | JWT_OR_PUBLIC_RULE | 200 (expected [200]) · CUSTOMER · `HTTP-969203853f5b` | 200 (expected [200]) · CUSTOMER · `HTTP-f51b0ad16169` | 403 (expected [403]) · CUSTOMER · `HTTP-4eda30764cdc` | PASS_BOTH_ROUTES | `backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/CakeRequestController.java:33` |
| API-066 | marketplace-service | `POST /api/v1/cake-requests` | `/marketplace/api/v1/cake-requests` | JWT_OR_PUBLIC_RULE | 201 (expected [201]) · CUSTOMER · `HTTP-2d837e4c474b` | 201 (expected [201]) · CUSTOMER · `HTTP-d793cae20f01` | 401 (expected [401]) · ANONYMOUS · `HTTP-d936bd694386` | PASS_BOTH_ROUTES | `backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/CakeRequestController.java:38` |
| API-067 | marketplace-service | `PATCH /api/v1/cake-requests/{id}` | `/marketplace/api/v1/cake-requests/{id}` | JWT_OR_PUBLIC_RULE | 200 (expected [200]) · CUSTOMER · `HTTP-6897c7a011ca` | 200 (expected [200]) · CUSTOMER · `HTTP-6c3828c76327` | 401 (expected [401]) · ANONYMOUS · `HTTP-887d405914cf` | PASS_BOTH_ROUTES | `backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/CakeRequestController.java:44` |
| API-068 | marketplace-service | `POST /api/v1/cake-requests/{id}/publish` | `/marketplace/api/v1/cake-requests/{id}/publish` | JWT_OR_PUBLIC_RULE | 200 (expected [200]) · CUSTOMER · `HTTP-df75f7f6a9ff` | 200 (expected [200]) · CUSTOMER · `HTTP-d81dac8aab7d` | 401 (expected [401]) · ANONYMOUS · `HTTP-e6ca9ebb1a4a` | PASS_BOTH_ROUTES | `backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/CakeRequestController.java:50` |
| API-069 | marketplace-service | `POST /api/v1/cake-requests/{id}/cancel` | `/marketplace/api/v1/cake-requests/{id}/cancel` | JWT_OR_PUBLIC_RULE | 200 (expected [200]) · CUSTOMER · `HTTP-25d8c3f60afa` | 200 (expected [200]) · CUSTOMER · `HTTP-ef52c937daac` | 401 (expected [401]) · ANONYMOUS · `HTTP-eeb9c156c62f` | PASS_BOTH_ROUTES | `backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/CakeRequestController.java:55` |
| API-070 | marketplace-service | `PUT /api/v1/cake-requests/{id}/selected-design` | `/marketplace/api/v1/cake-requests/{id}/selected-design` | JWT_OR_PUBLIC_RULE | HAPPY CHƯA ĐẠT; 401 (expected [401]) · ANONYMOUS · `HTTP-597ab8bb8838` | HAPPY CHƯA ĐẠT; 401 (expected [401]) · ANONYMOUS · `HTTP-32c4859c1fb2` | 401 (expected [401]) · ANONYMOUS · `HTTP-32c4859c1fb2` | BLOCKED_GEMINI_FIXTURE | `backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/CakeRequestController.java:61` |
| API-071 | marketplace-service | `POST /api/v1/cake-requests/{id}/images` | `/marketplace/api/v1/cake-requests/{id}/images` | JWT_OR_PUBLIC_RULE | 201 (expected [201]) · CUSTOMER · `HTTP-c5b24b3d9c17` | 201 (expected [201]) · CUSTOMER · `HTTP-610c3d487728` | 401 (expected [401]) · ANONYMOUS · `HTTP-e699cbf710de` | PASS_BOTH_ROUTES | `backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/CakeRequestController.java:67` |
| API-072 | marketplace-service | `DELETE /api/v1/cake-requests/{id}/images/{imageId}` | `/marketplace/api/v1/cake-requests/{id}/images/{imageId}` | JWT_OR_PUBLIC_RULE | 204 (expected [204]) · CUSTOMER · `HTTP-91f1c496b0d7` | 204 (expected [204]) · CUSTOMER · `HTTP-80f0b169180b` | 401 (expected [401]) · ANONYMOUS · `HTTP-b88b006edb26` | PASS_BOTH_ROUTES | `backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/CakeRequestController.java:76` |
| API-073 | marketplace-service | `GET /internal/v1/cake-requests/{id}/context` | N/A (internal/JWKS/retired) | hasAuthority('SCOPE_marketplace:request:read') | 200 (expected [200]) · SERVICE:cake-ai-service · `HTTP-68bee6199087` | N/A | 401 (expected [401]) · ANONYMOUS · `HTTP-fcf825991f04` | PASS_DIRECT_ONLY | `backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/MarketplaceContextController.java:28` |
| API-074 | marketplace-service | `GET /internal/v1/cake-requests/{id}/chat-authorization` | N/A (internal/JWKS/retired) | hasAuthority('SCOPE_marketplace:request:chat:authorize') | 200 (expected [200]) · SERVICE:chat-service · `HTTP-29d04af24537` | N/A | 401 (expected [401]) · ANONYMOUS · `HTTP-97d6f9f02f05` | PASS_DIRECT_ONLY | `backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/MarketplaceContextController.java:34` |
| API-075 | marketplace-service | `GET /internal/v1/offers/{id}/order-source` | N/A (internal/JWKS/retired) | hasAuthority('SCOPE_marketplace:offer:read') | 200 (expected [200]) · SERVICE:order-service · `HTTP-df7c426410bb` | N/A | 401 (expected [401]) · ANONYMOUS · `HTTP-d72f398bca8f` | PASS_DIRECT_ONLY | `backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/MarketplaceContextController.java:43` |
| API-076 | marketplace-service | `GET /api/v1/offers` | `/marketplace/api/v1/offers` | JWT_OR_PUBLIC_RULE | 200 (expected [200]) · BAKERY_OWNER · `HTTP-9e87dd4e351a` | 200 (expected [200]) · BAKERY_OWNER · `HTTP-e95ff4b7ba9a` | 401 (expected [401]) · ANONYMOUS · `HTTP-a7c60627a1fd` | PASS_BOTH_ROUTES | `backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/offer/OfferController.java:26` |
| API-077 | marketplace-service | `GET /api/v1/offers/{id}` | `/marketplace/api/v1/offers/{id}` | JWT_OR_PUBLIC_RULE | 200 (expected [200]) · CUSTOMER · `HTTP-bc80964976ca` | 200 (expected [200]) · CUSTOMER · `HTTP-fd2c31b2831b` | 401 (expected [401]) · ANONYMOUS · `HTTP-a32e7174768e` | PASS_BOTH_ROUTES | `backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/offer/OfferController.java:32` |
| API-078 | marketplace-service | `POST /api/v1/cake-requests/{id}/offers` | `/marketplace/api/v1/cake-requests/{id}/offers` | JWT_OR_PUBLIC_RULE | 201 (expected [201]) · BAKERY_OWNER · `HTTP-5f9f4ce7eaaf` | 201 (expected [201]) · BAKERY_OWNER · `HTTP-de6de3edaf01` | 401 (expected [401]) · ANONYMOUS · `HTTP-759b200085ce` | PASS_BOTH_ROUTES | `backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/offer/OfferController.java:37` |
| API-079 | marketplace-service | `PATCH /api/v1/offers/{id}` | `/marketplace/api/v1/offers/{id}` | JWT_OR_PUBLIC_RULE | 200 (expected [200]) · CUSTOMER · `HTTP-f5284d4b38f5` | 200 (expected [200]) · CUSTOMER · `HTTP-ec6583d16e95` | 401 (expected [401]) · ANONYMOUS · `HTTP-f3e17ebcb8a6` | PASS_BOTH_ROUTES | `backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/offer/OfferController.java:43` |
| API-080 | marketplace-service | `POST /api/v1/offers/{id}/withdraw` | `/marketplace/api/v1/offers/{id}/withdraw` | JWT_OR_PUBLIC_RULE | 200 (expected [200]) · BAKERY_OWNER · `HTTP-0df56d6c3755` | 200 (expected [200]) · BAKERY_OWNER · `HTTP-34f0d82368ba` | 401 (expected [401]) · ANONYMOUS · `HTTP-a8856f445a34` | PASS_BOTH_ROUTES | `backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/offer/OfferController.java:49` |
| API-081 | marketplace-service | `POST /api/v1/offers/{id}/accept` | `/marketplace/api/v1/offers/{id}/accept` | JWT_OR_PUBLIC_RULE | 200 (expected [200]) · CUSTOMER · `HTTP-178a19caa595` | 200 (expected [200]) · CUSTOMER · `HTTP-ea30bed23c7d` | 401 (expected [401]) · ANONYMOUS · `HTTP-8603511b9709` | PASS_BOTH_ROUTES | `backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/offer/OfferController.java:55` |
| API-082 | subscription-service | `GET /api/v1/admin/bakery-payments` | `/subscription/api/v1/admin/bakery-payments` | JWT_OR_PUBLIC_RULE | 200 (expected [200]) · ADMIN · `HTTP-52dc2d3a473d` | 200 (expected [200]) · ADMIN · `HTTP-05ab0cf2970c` | 401 (expected [401]) · ANONYMOUS · `HTTP-01d0ed907a41` | PASS_BOTH_ROUTES | `backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/payment/controller/AdminBakeryPaymentController.java:39` |
| API-083 | subscription-service | `POST /api/v1/admin/bakery-payments/{paymentId}/approve` | `/subscription/api/v1/admin/bakery-payments/{paymentId}/approve` | JWT_OR_PUBLIC_RULE | 200 (expected [200]) · ADMIN · `HTTP-1a44d04d13c5` | 200 (expected [200]) · ADMIN · `HTTP-53dee11809ac` | 401 (expected [401]) · ANONYMOUS · `HTTP-a22eee4e8814` | PASS_BOTH_ROUTES | `backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/payment/controller/AdminBakeryPaymentController.java:52` |
| API-084 | subscription-service | `POST /api/v1/admin/bakery-payments/{paymentId}/reject` | `/subscription/api/v1/admin/bakery-payments/{paymentId}/reject` | JWT_OR_PUBLIC_RULE | 200 (expected [200]) · ADMIN · `HTTP-f4fa8c36f585` | 200 (expected [200]) · ADMIN · `HTTP-b84801768772` | 409 (expected [409]) · ADMIN · `HTTP-4fb16e3de25e` | PASS_BOTH_ROUTES | `backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/payment/controller/AdminBakeryPaymentController.java:60` |
| API-085 | subscription-service | `POST /api/v1/subscription-orders/{orderId}/payments` | `/subscription/api/v1/subscription-orders/{orderId}/payments` | JWT_OR_PUBLIC_RULE | 201 (expected [201]) · BAKERY_OWNER · `HTTP-ce90dfd2ec73` | 201 (expected [201]) · CUSTOMER · `HTTP-3f213fbc7125` | 401 (expected [401]) · ANONYMOUS · `HTTP-7dc8ae4e41eb` | PASS_BOTH_ROUTES | `backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/payment/controller/BakeryPaymentController.java:33` |
| API-086 | subscription-service | `GET /api/v1/subscription-plans/payment-options` | `/subscription/api/v1/subscription-plans/payment-options` | JWT_OR_PUBLIC_RULE | 200 (expected [200]) · ANONYMOUS · `HTTP-6575532ea3d3` | 200 (expected [200]) · ANONYMOUS · `HTTP-269edd454446` | Không có negative riêng | PASS_BOTH_ROUTES | `backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/payment/controller/PaymentOptionsController.java:19` |
| API-087 | subscription-service | `POST /api/v1/subscription-orders/{orderId}/vnpay/checkout` | `/subscription/api/v1/subscription-orders/{orderId}/vnpay/checkout` | JWT_OR_PUBLIC_RULE | 200 (expected [200]) · BAKERY_OWNER · `HTTP-41a8d8fa0157` | 200 (expected [200]) · BAKERY_OWNER · `HTTP-4f7da4923372` | 401 (expected [401]) · ANONYMOUS · `HTTP-6e64e97c8317` | PASS_BOTH_ROUTES | `backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/payment/controller/VnpayController.java:27` |
| API-088 | subscription-service | `GET /api/v1/payments/vnpay/ipn` | `/subscription/api/v1/payments/vnpay/ipn` | JWT_OR_PUBLIC_RULE | HAPPY CHƯA ĐẠT; 200 (expected [200]) · ANONYMOUS · `HTTP-dea3423584ec` | HAPPY CHƯA ĐẠT; 200 (expected [200]) · ANONYMOUS · `HTTP-ab33d1881516` | 200 (expected [200]) · ANONYMOUS · `HTTP-11e1c7f94ede` | PARTIAL_CALLBACK | `backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/payment/controller/VnpayController.java:33` |
| API-089 | subscription-service | `GET /api/v1/payments/vnpay/return` | `/subscription/api/v1/payments/vnpay/return` | JWT_OR_PUBLIC_RULE | HAPPY CHƯA ĐẠT; 400 (expected [400]) · ANONYMOUS · `HTTP-342112371a19` | HAPPY CHƯA ĐẠT; 400 (expected [400]) · ANONYMOUS · `HTTP-b395a1101fd1` | 400 (expected [400]) · ANONYMOUS · `HTTP-b395a1101fd1` | PARTIAL_CALLBACK | `backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/payment/controller/VnpayController.java:39` |
| API-090 | subscription-service | `GET /api/v1/admin/vnpay-attempts` | `/subscription/api/v1/admin/vnpay-attempts` | JWT_OR_PUBLIC_RULE | 200 (expected [200]) · ADMIN · `HTTP-c71e43ab4b47` | 200 (expected [200]) · ADMIN · `HTTP-d93a7de9d472` | 401 (expected [401]) · ANONYMOUS · `HTTP-0e38abbb6c61` | PASS_BOTH_ROUTES | `backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/payment/controller/VnpayController.java:49` |
| API-091 | subscription-service | `GET /api/v1/admin/subscription-plans` | `/subscription/api/v1/admin/subscription-plans` | JWT_OR_PUBLIC_RULE | 200 (expected [200]) · ADMIN · `HTTP-f7ba0d0bca3c` | 200 (expected [200]) · ADMIN · `HTTP-8c5eda825fab` | 401 (expected [401]) · ANONYMOUS · `HTTP-57fc0944ba09` | PASS_BOTH_ROUTES | `backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/plan/controller/AdminSubscriptionPlanController.java:32` |
| API-092 | subscription-service | `POST /api/v1/admin/subscription-plans` | `/subscription/api/v1/admin/subscription-plans` | JWT_OR_PUBLIC_RULE | 201 (expected [201]) · ADMIN · `HTTP-b4ef58892f2e` | 201 (expected [201]) · ADMIN · `HTTP-b830489010e6` | 401 (expected [401]) · ANONYMOUS · `HTTP-ba9014d722ea` | PASS_BOTH_ROUTES | `backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/plan/controller/AdminSubscriptionPlanController.java:37` |
| API-093 | subscription-service | `PATCH /api/v1/admin/subscription-plans/{planId}` | `/subscription/api/v1/admin/subscription-plans/{planId}` | JWT_OR_PUBLIC_RULE | 200 (expected [200]) · ADMIN · `HTTP-9ccb1803fc2f` | 200 (expected [200]) · ADMIN · `HTTP-a5fa5d7361db` | 401 (expected [401]) · ANONYMOUS · `HTTP-948c4aa42676` | PASS_BOTH_ROUTES | `backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/plan/controller/AdminSubscriptionPlanController.java:43` |
| API-094 | subscription-service | `POST /api/v1/admin/subscription-plans/{planId}/archive` | `/subscription/api/v1/admin/subscription-plans/{planId}/archive` | JWT_OR_PUBLIC_RULE | 200 (expected [200]) · ADMIN · `HTTP-a965691056a0` | 200 (expected [200]) · ADMIN · `HTTP-f6a99fe17dc1` | 401 (expected [401]) · ANONYMOUS · `HTTP-bbe8d5347843` | PASS_BOTH_ROUTES | `backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/plan/controller/AdminSubscriptionPlanController.java:49` |
| API-095 | subscription-service | `GET /api/v1/subscription-plans` | `/subscription/api/v1/subscription-plans` | JWT_OR_PUBLIC_RULE | 200 (expected [200]) · ANONYMOUS · `HTTP-37c03882c09d` | 200 (expected [200]) · ANONYMOUS · `HTTP-28e97efe0368` | 403 (expected [403]) · CUSTOMER · `HTTP-4f1be463d9ce` | PASS_BOTH_ROUTES | `backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/plan/controller/SubscriptionPlanController.java:27` |
| API-096 | subscription-service | `GET /api/v1/subscription-plans/{planId}` | `/subscription/api/v1/subscription-plans/{planId}` | JWT_OR_PUBLIC_RULE | 200 (expected [200]) · ANONYMOUS · `HTTP-bcfe912cebbd` | 200 (expected [200]) · ANONYMOUS · `HTTP-b1e94e1fb6a3` | Không có negative riêng | PASS_BOTH_ROUTES | `backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/plan/controller/SubscriptionPlanController.java:32` |
| API-097 | subscription-service | `GET /api/v1/bakeries/{bakeryId}/subscription` | `/subscription/api/v1/bakeries/{bakeryId}/subscription` | JWT_OR_PUBLIC_RULE | 200 (expected [200]) · BAKERY_OWNER · `HTTP-acbbc54a7e21` | 200 (expected [200]) · BAKERY_OWNER · `HTTP-03aac37e420e` | 401 (expected [401]) · ANONYMOUS · `HTTP-6d1180145eb1` | PASS_BOTH_ROUTES | `backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/subscription/controller/BakerySubscriptionController.java:28` |
| API-098 | subscription-service | `GET /internal/v1/subscriptions/bakeries/{bakeryId}/entitlement` | N/A (internal/JWKS/retired) | INTERNAL | 200 (expected [200]) · SERVICE:marketplace-service · `HTTP-596ad5dfca79` | N/A | 401 (expected [401]) · ANONYMOUS · `HTTP-6b2953927383` | PASS_DIRECT_ONLY | `backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/subscription/controller/InternalSubscriptionController.java:25` |
| API-099 | subscription-service | `GET /api/v1/admin/subscription-orders` | `/subscription/api/v1/admin/subscription-orders` | JWT_OR_PUBLIC_RULE | 200 (expected [200]) · ADMIN · `HTTP-52b51b1963bb` | 200 (expected [200]) · ADMIN · `HTTP-34e88f512aba` | 401 (expected [401]) · ANONYMOUS · `HTTP-cff138611088` | PASS_BOTH_ROUTES | `backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/subscriptionorder/controller/AdminSubscriptionOrderController.java:22` |
| API-100 | subscription-service | `POST /api/v1/bakeries/{bakeryId}/subscription-orders` | `/subscription/api/v1/bakeries/{bakeryId}/subscription-orders` | JWT_OR_PUBLIC_RULE | 201 (expected [201]) · BAKERY_OWNER · `HTTP-7973b65bc1ac` | 201 (expected [201]) · CUSTOMER · `HTTP-8c1fb209da54` | 401 (expected [401]) · ANONYMOUS · `HTTP-5bf89237d0ba` | PASS_BOTH_ROUTES | `backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/subscriptionorder/controller/SubscriptionOrderController.java:36` |
| API-101 | subscription-service | `GET /api/v1/bakeries/{bakeryId}/subscription-orders` | `/subscription/api/v1/bakeries/{bakeryId}/subscription-orders` | JWT_OR_PUBLIC_RULE | 200 (expected [200]) · CUSTOMER · `HTTP-7fa22e7615f9` | 200 (expected [200]) · CUSTOMER · `HTTP-db793f685922` | 401 (expected [401]) · ANONYMOUS · `HTTP-71c63030cab7` | PASS_BOTH_ROUTES | `backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/subscriptionorder/controller/SubscriptionOrderController.java:46` |
| API-102 | subscription-service | `GET /api/v1/subscription-orders/{orderId}` | `/subscription/api/v1/subscription-orders/{orderId}` | JWT_OR_PUBLIC_RULE | 200 (expected [200]) · BAKERY_OWNER · `HTTP-398df71623f8` | 200 (expected [200]) · BAKERY_OWNER · `HTTP-97c3921cf9cc` | 401 (expected [401]) · ANONYMOUS · `HTTP-aef87a2cfd8c` | PASS_BOTH_ROUTES | `backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/subscriptionorder/controller/SubscriptionOrderController.java:58` |
| API-103 | cake-ai-service | `GET /api/v1/generated-designs/{id}` | `/cake-ai/api/v1/generated-designs/{id}` | hasAnyRole('CUSTOMER','ADMIN') | HAPPY CHƯA ĐẠT; 401 (expected [401]) · ANONYMOUS · `HTTP-3e1bb20251d7` | HAPPY CHƯA ĐẠT; 401 (expected [401]) · ANONYMOUS · `HTTP-946be94329ce` | 401 (expected [401]) · ANONYMOUS · `HTTP-946be94329ce` | BLOCKED_GEMINI_FIXTURE | `backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/design/DesignController.java:21` |
| API-104 | cake-ai-service | `GET /api/v1/admin/generated-designs` | `/cake-ai/api/v1/admin/generated-designs` | hasRole('ADMIN') | 200 (expected [200]) · ADMIN · `HTTP-e35b8f520671` | 200 (expected [200]) · ADMIN · `HTTP-7f873a9bcedc` | 401 (expected [401]) · ANONYMOUS · `HTTP-6cff2b3ce420` | PASS_BOTH_ROUTES | `backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/design/DesignController.java:27` |
| API-105 | cake-ai-service | `PATCH /api/v1/admin/generated-designs/{id}/moderation` | `/cake-ai/api/v1/admin/generated-designs/{id}/moderation` | hasRole('ADMIN') | HAPPY CHƯA ĐẠT; 401 (expected [401]) · ANONYMOUS · `HTTP-a03baf5ef02c` | HAPPY CHƯA ĐẠT; 401 (expected [401]) · ANONYMOUS · `HTTP-337c993ce931` | 401 (expected [401]) · ANONYMOUS · `HTTP-337c993ce931` | BLOCKED_GEMINI_FIXTURE | `backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/design/DesignController.java:35` |
| API-106 | cake-ai-service | `GET /internal/v1/generated-designs/{id}/validation` | N/A (internal/JWKS/retired) | hasAuthority('SCOPE_cake-ai:design:validate') | HAPPY CHƯA ĐẠT; 401 (expected [401]) · ANONYMOUS · `HTTP-75d8defc377c` | N/A | 401 (expected [401]) · ANONYMOUS · `HTTP-75d8defc377c` | BLOCKED_GEMINI_FIXTURE | `backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/design/DesignValidationController.java:19` |
| API-107 | cake-ai-service | `GET /internal/v1/cake-requests/{id}/generation-context` | N/A (internal/JWKS/retired) | hasAuthority('SCOPE_cake-ai:design:validate') | 200 (expected [200]) · SERVICE:marketplace-service · `HTTP-c8a9440ce8db` | N/A | 401 (expected [401]) · ANONYMOUS · `HTTP-8cbe6ced5c1b` | PASS_DIRECT_ONLY | `backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/design/DesignValidationController.java:27` |
| API-108 | cake-ai-service | `GET /storage/**` | N/A (internal/JWKS/retired) | RETIRED_STORAGE | HAPPY CHƯA ĐẠT; 404 (expected [404]) · ANONYMOUS · `HTTP-e7766114fe75` | N/A | 404 (expected [404]) · ANONYMOUS · `HTTP-e7766114fe75` | RETIRED_404_VERIFIED | `backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/design/PublicStorageController.java:14` |
| API-109 | cake-ai-service | `POST /api/v1/generation-jobs` | `/cake-ai/api/v1/generation-jobs` | hasRole('CUSTOMER') | HAPPY CHƯA ĐẠT; 403 (expected [403]) · CUSTOMER · `HTTP-18cf50ddaa6e` | HAPPY CHƯA ĐẠT; 403 (expected [403]) · CUSTOMER · `HTTP-24681a2ae448` | 401 (expected [401]) · ANONYMOUS · `HTTP-74d372a436a3` | BLOCKED_GEMINI_FIXTURE | `backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/generation/GenerationController.java:20` |
| API-110 | cake-ai-service | `GET /api/v1/generation-jobs` | `/cake-ai/api/v1/generation-jobs` | hasRole('CUSTOMER') | 200 (expected [200]) · CUSTOMER · `HTTP-0a6dd2928aa1` | 200 (expected [200]) · CUSTOMER · `HTTP-73775d93e484` | 401 (expected [401]) · ANONYMOUS · `HTTP-484218fe126c` | PASS_BOTH_ROUTES | `backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/generation/GenerationController.java:28` |
| API-111 | cake-ai-service | `GET /api/v1/generation-jobs/{id}` | `/cake-ai/api/v1/generation-jobs/{id}` | hasRole('CUSTOMER'); hasAnyRole('CUSTOMER','ADMIN') | HAPPY CHƯA ĐẠT; 401 (expected [401]) · ANONYMOUS · `HTTP-1578e794df08` | HAPPY CHƯA ĐẠT; 401 (expected [401]) · ANONYMOUS · `HTTP-528645a5d46b` | 401 (expected [401]) · ANONYMOUS · `HTTP-528645a5d46b` | BLOCKED_GEMINI_FIXTURE | `backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/generation/GenerationController.java:35` |
| API-112 | cake-ai-service | `POST /api/v1/generation-jobs/{id}/prompt-revisions` | `/cake-ai/api/v1/generation-jobs/{id}/prompt-revisions` | hasRole('CUSTOMER') | HAPPY CHƯA ĐẠT; 401 (expected [401]) · ANONYMOUS · `HTTP-df1e119fd74c` | HAPPY CHƯA ĐẠT; 401 (expected [401]) · ANONYMOUS · `HTTP-edb066ffb675` | 401 (expected [401]) · ANONYMOUS · `HTTP-edb066ffb675` | BLOCKED_GEMINI_FIXTURE | `backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/generation/GenerationController.java:41` |
| API-113 | cake-ai-service | `POST /api/v1/generation-jobs/{id}/cancel` | `/cake-ai/api/v1/generation-jobs/{id}/cancel` | hasRole('CUSTOMER') | HAPPY CHƯA ĐẠT; 401 (expected [401]) · ANONYMOUS · `HTTP-6bc3b0e459cb` | HAPPY CHƯA ĐẠT; 401 (expected [401]) · ANONYMOUS · `HTTP-bc8fbb354828` | 401 (expected [401]) · ANONYMOUS · `HTTP-bc8fbb354828` | BLOCKED_GEMINI_FIXTURE | `backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/generation/GenerationController.java:47` |
| API-114 | order-service | `GET /internal/v1/orders/{orderId}/context` | N/A (internal/JWKS/retired) | INTERNAL | HAPPY CHƯA ĐẠT; 403 (expected [403]) · SERVICE:marketplace-service · `HTTP-85052695ffa5` | N/A | 401 (expected [401]) · ANONYMOUS · `HTTP-a8e3433f2e70` | NOT_VERIFIED_LEGITIMATE_CALLER | `backend/order-service/src/main/java/com/se193262/orderservice/feature/order/InternalOrderController.java:32` |
| API-115 | order-service | `POST /internal/v1/orders/from-offer` | N/A (internal/JWKS/retired) | hasAuthority('SCOPE_order:create-from-offer') | 200 (expected [200]) · SERVICE:marketplace-service · `HTTP-e7e5523906a3` | N/A | 401 (expected [401]) · ANONYMOUS · `HTTP-39ebfd78ff58` | PASS_DIRECT_ONLY | `backend/order-service/src/main/java/com/se193262/orderservice/feature/order/OfferOrderController.java:20` |
| API-116 | order-service | `POST /api/v1/orders/direct` | `/orders/api/v1/orders/direct` | JWT_OR_PUBLIC_RULE | HAPPY CHƯA ĐẠT; 409 (expected [409, 422]) · CUSTOMER · `HTTP-1fba4a1c5d86` | HAPPY CHƯA ĐẠT; 409 (expected [409, 422]) · CUSTOMER · `HTTP-e14a5e291225` | 401 (expected [401]) · ANONYMOUS · `HTTP-9c84cac50ccf` | BLOCKED_MINIO | `backend/order-service/src/main/java/com/se193262/orderservice/feature/order/OrderController.java:55` |
| API-117 | order-service | `GET /api/v1/orders` | `/orders/api/v1/orders` | JWT_OR_PUBLIC_RULE | 200 (expected [200]) · CUSTOMER · `HTTP-baad297c2457` | 200 (expected [200]) · CUSTOMER · `HTTP-097aaeb95b24` | 401 (expected [401]) · ANONYMOUS · `HTTP-cedd7ac70d4a` | PASS_BOTH_ROUTES | `backend/order-service/src/main/java/com/se193262/orderservice/feature/order/OrderController.java:73` |
| API-118 | order-service | `GET /api/v1/orders/{orderId}` | `/orders/api/v1/orders/{orderId}` | JWT_OR_PUBLIC_RULE | 200 (expected [200]) · CUSTOMER · `HTTP-6ae042cb45fd` | 200 (expected [200]) · CUSTOMER · `HTTP-816fae1335aa` | 401 (expected [401]) · ANONYMOUS · `HTTP-88514e644404` | PASS_BOTH_ROUTES | `backend/order-service/src/main/java/com/se193262/orderservice/feature/order/OrderController.java:95` |
| API-119 | order-service | `POST /api/v1/orders/{orderId}/status-transitions` | `/orders/api/v1/orders/{orderId}/status-transitions` | JWT_OR_PUBLIC_RULE | 200 (expected [200]) · CUSTOMER · `HTTP-681b50be70c6` | 200 (expected [200]) · CUSTOMER · `HTTP-2fdfb6433aae` | 401 (expected [401]) · ANONYMOUS · `HTTP-cff412703a6f` | PASS_BOTH_ROUTES | `backend/order-service/src/main/java/com/se193262/orderservice/feature/order/OrderController.java:108` |
| API-120 | order-service | `POST /api/v1/orders/{orderId}/review` | `/orders/api/v1/orders/{orderId}/review` | JWT_OR_PUBLIC_RULE | 201 (expected [201]) · CUSTOMER · `HTTP-965ee971a4c5` | 201 (expected [201]) · CUSTOMER · `HTTP-f16933e39712` | 401 (expected [401]) · ANONYMOUS · `HTTP-7d1df2fb3100` | PASS_BOTH_ROUTES | `backend/order-service/src/main/java/com/se193262/orderservice/feature/review/ReviewController.java:44` |
| API-121 | order-service | `PATCH /api/v1/orders/{orderId}/review` | `/orders/api/v1/orders/{orderId}/review` | JWT_OR_PUBLIC_RULE | 200 (expected [200]) · CUSTOMER · `HTTP-b438c337ebd5` | 200 (expected [200]) · CUSTOMER · `HTTP-b71621f79fef` | 401 (expected [401]) · ANONYMOUS · `HTTP-2a47e0f979c2` | PASS_BOTH_ROUTES | `backend/order-service/src/main/java/com/se193262/orderservice/feature/review/ReviewController.java:59` |
| API-122 | order-service | `DELETE /api/v1/orders/{orderId}/review` | `/orders/api/v1/orders/{orderId}/review` | JWT_OR_PUBLIC_RULE | 204 (expected [204]) · CUSTOMER · `HTTP-df927e71d1b6` | 204 (expected [204]) · CUSTOMER · `HTTP-bd548836cfae` | 401 (expected [401]) · ANONYMOUS · `HTTP-9ace27e7084d` | PASS_BOTH_ROUTES | `backend/order-service/src/main/java/com/se193262/orderservice/feature/review/ReviewController.java:74` |
| API-123 | order-service | `PATCH /api/v1/admin/reviews/{orderId}/status` | `/orders/api/v1/admin/reviews/{orderId}/status` | JWT_OR_PUBLIC_RULE | 200 (expected [200]) · ADMIN · `HTTP-cfc5888eb1be` | 200 (expected [200]) · ADMIN · `HTTP-efa789d28a0c` | 401 (expected [401]) · ANONYMOUS · `HTTP-2c8b359e1988` | PASS_BOTH_ROUTES | `backend/order-service/src/main/java/com/se193262/orderservice/feature/review/ReviewController.java:88` |
| API-124 | chat-service | `GET /api/v1/conversations` | `/chat/api/v1/conversations` | JWT_OR_PUBLIC_RULE | 200 (expected [200]) · CUSTOMER · `HTTP-0eb7d77c1109` | 200 (expected [200]) · CUSTOMER · `HTTP-46003734b72a` | 401 (expected [401]) · ANONYMOUS · `HTTP-3bbcd1226cce` | PASS_BOTH_ROUTES | `backend/chat-service/src/main/java/com/se193262/chatservice/feature/conversation/ConversationController.java:45` |
| API-125 | chat-service | `POST /api/v1/conversations` | `/chat/api/v1/conversations` | JWT_OR_PUBLIC_RULE | 201 (expected [201]) · CUSTOMER · `HTTP-80278d519aa3` | 201 (expected [201]) · CUSTOMER · `HTTP-6999456259f5` | 401 (expected [401]) · ANONYMOUS · `HTTP-6ba9163111a6` | PASS_BOTH_ROUTES | `backend/chat-service/src/main/java/com/se193262/chatservice/feature/conversation/ConversationController.java:63` |
| API-126 | chat-service | `GET /api/v1/conversations/{conversationId}` | `/chat/api/v1/conversations/{conversationId}` | JWT_OR_PUBLIC_RULE | 200 (expected [200]) · CUSTOMER · `HTTP-1f08c4cb4792` | 200 (expected [200]) · CUSTOMER · `HTTP-210af5e22665` | 401 (expected [401]) · ANONYMOUS · `HTTP-491ad0801fff` | PASS_BOTH_ROUTES | `backend/chat-service/src/main/java/com/se193262/chatservice/feature/conversation/ConversationController.java:78` |
| API-127 | chat-service | `POST /api/v1/conversations/{conversationId}/close` | `/chat/api/v1/conversations/{conversationId}/close` | JWT_OR_PUBLIC_RULE | 200 (expected [200]) · CUSTOMER · `HTTP-436e21b89b6f` | 200 (expected [200]) · CUSTOMER · `HTTP-e7d65d43cfa0` | 401 (expected [401]) · ANONYMOUS · `HTTP-a08d49dcded1` | PASS_BOTH_ROUTES | `backend/chat-service/src/main/java/com/se193262/chatservice/feature/conversation/ConversationController.java:86` |
| API-128 | chat-service | `GET /api/v1/conversations/{conversationId}/messages` | `/chat/api/v1/conversations/{conversationId}/messages` | JWT_OR_PUBLIC_RULE | 200 (expected [200]) · CUSTOMER · `HTTP-773b7f48adee` | 200 (expected [200]) · CUSTOMER · `HTTP-1976038d3a48` | 401 (expected [401]) · ANONYMOUS · `HTTP-444c610d3c26` | PASS_BOTH_ROUTES | `backend/chat-service/src/main/java/com/se193262/chatservice/feature/message/MessageController.java:47` |
| API-129 | chat-service | `POST /api/v1/conversations/{conversationId}/messages` | `/chat/api/v1/conversations/{conversationId}/messages` | JWT_OR_PUBLIC_RULE | 200 (expected [200]) · CUSTOMER · `HTTP-7d4c6e866d7d` | 201 (expected [201]) · CUSTOMER · `HTTP-6f3f7653c1f2` | 401 (expected [401]) · ANONYMOUS · `HTTP-5dcf0b78a702` | PASS_BOTH_ROUTES | `backend/chat-service/src/main/java/com/se193262/chatservice/feature/message/MessageController.java:58` |
| API-130 | chat-service | `POST /api/v1/conversations/{conversationId}/read` | `/chat/api/v1/conversations/{conversationId}/read` | JWT_OR_PUBLIC_RULE | 200 (expected [200]) · CUSTOMER · `HTTP-af1b2c51bc9d` | 200 (expected [200]) · CUSTOMER · `HTTP-cfb7730f6abe` | 401 (expected [401]) · ANONYMOUS · `HTTP-a4fdb4be116e` | PASS_BOTH_ROUTES | `backend/chat-service/src/main/java/com/se193262/chatservice/feature/message/MessageController.java:74` |
| API-131 | chat-service | `DELETE /api/v1/conversations/{conversationId}/messages/{messageId}` | `/chat/api/v1/conversations/{conversationId}/messages/{messageId}` | JWT_OR_PUBLIC_RULE | 204 (expected [204]) · CUSTOMER · `HTTP-66bb52105fa3` | 204 (expected [204]) · CUSTOMER · `HTTP-946aab359a31` | 401 (expected [401]) · ANONYMOUS · `HTTP-c129e8725e64` | PASS_BOTH_ROUTES | `backend/chat-service/src/main/java/com/se193262/chatservice/feature/message/MessageController.java:84` |


### 37.10. Coverage, Gateway, Swagger và browser

| Chỉ số | Kết quả sau merge |
|---|---:|
| Operation được kiểm kê/gửi direct request |131/131|
| Gateway-eligible được gửi request thật |110/110|
| Operation có ít nhất một happy route |108|
| Happy direct |108|
| Happy Gateway |92|
| Happy cả direct/Gateway |92|
| Direct-only happy |16|
| Thiếu một cloud route happy |Không|
| Ledger request mới |853|
| CORS direct/Gateway checks |56/56|
| Native smoke sau các restart |42/42|
| Direct UI/assets/config8process |24/24|

Regression158, gap62, sweep279 đều0 unexpected; direct reject bổ sung200 đã đóng gap API-084. Raw ledger giữ một mismatch từ harness: actuator/info expected200 nhưng actual404; health-only exposure đúng, đã sửa expected test và gọi lại404. Không che/xóa sự kiện ban đầu, không gọi nó là regression của ứng dụng.

Swagger specs direct/Gateway200, prefix đúng, protected security scheme và callback HMAC đúng. Browser thực Execute7/7 APIs200 và không page error; ảnh trong swagger-screenshots/ che vùng curl chứa Authorization trước capture. Đã xem ảnh CakeAI thực. Direct UI HTML, JS bundle và swagger-config được kiểm tra bằng HTTP cho từng service/Gateway. Twelve same-ID direct/Gateway business bodies bằng nhau sau bỏ timestamp/signedURL, không chỉ so status.

Fault-injection native Gateway riêng18080: connection502, timeout504 trong1.10s với cấu hình timeout1s, unknown404; process test exit0. Stub upstream này chỉ là transport test, không tính business API/provider thành công.


### 37.11. E2E thực từ mã sau merge

| Journey | Kết quả mới | Giới hạn |
|---|---|---|
| A Customer/Address/Owner | Register/address CRUD/ownership/onboarding/Admin→entitlement→Owner/catalog CRUD đạt |Không sửa original DB|
| B Direct checkout |Validation/auth và lỗi hạ tầng đúng|Ảnh MinIO chưa upload/publish được; checkout→order chưa happy|
| C RFQ/Offer/Order |Hai RFQ mới direct/Gateway, accept→exactly1order, fulfillment→Customer COMPLETED, Review lifecycle|Không có payment mua bánh trên platform|
| D Subscription |Plan/order/manual reference/reject/resubmit/approve/renewal/entitlement đạt; direct reject bổ sung200|Synthetic administrative flow, không chứng minh bank transfer/IPN|
| E Chat |Customer↔Owner text/history/read/cursor/idempotent replay/delete/close đạt|Attachment PNG503 do MinIO|
| F CakeAI |DB/auth/ownership/job/Admin lists đạt, correct multipart wrongowner403/owned503policyoff|Không có real Gemini design/job/moderation/select E2E|

IDs và persistence mới, được đọc lại sau final full-stack restart:

```json
[
  {
    "offerId": "9f7a8243-fc00-4c0a-b8e6-55ea9e80bc6e",
    "requestId": "1bbe0487-923f-415b-a4a8-025766a35d35",
    "orderId": "b4f25607-53f2-479b-b887-46bbfc7917d9",
    "sql_count_and_status": "1|COMPLETED",
    "rfq_status": "OFFER_SELECTED",
    "accepted_offer_matches": true,
    "order_status": "COMPLETED",
    "rfq_evidence": "HTTP-f6c80f73d226",
    "order_evidence": "HTTP-421e93f1bf10"
  },
  {
    "offerId": "18b3905d-a0d4-4a27-8a3b-20d509a37dc4",
    "requestId": "9b6b3bac-13cf-4626-9e59-198f19042e95",
    "orderId": "9757aba6-66b2-4d84-98d0-bfed75524c06",
    "sql_count_and_status": "1|COMPLETED",
    "rfq_status": "OFFER_SELECTED",
    "accepted_offer_matches": true,
    "order_status": "COMPLETED",
    "rfq_evidence": "HTTP-f51b0ad16169",
    "order_evidence": "HTTP-6ae042cb45fd"
  }
]
```

Mỗi offer SQL count1|COMPLETED; RFQ original OFFER_SELECTED và accepted offer đúng. Không dùng tên trạng thái ACCEPTED cho RFQ. Owner chuyển CONFIRMED→BAKING→READY→DELIVERING; Customer xác nhận COMPLETED. Retry accept/internal source key không tạo order thứ hai. `business-invariants.json` cùng fresh readback event IDs là chứng cứ, không record lịch sử.

VNPay chỉ tạo URL sandbox local direct/Gateway200, same actual attemptId, signature present, zero external requests. Không visit signed URL, không tạo chữ ký IPN giả để settle giao dịch. Không gửi email/Gemini/payment thực.


### 37.12. Firebase, ngân sách và durability

Owner đã xác nhận nâng tổng ngân sách lên4 ảnh. Campaign dùng đúng **4/4 ảnh**:2 trước merge,2 ảnh mới sau merge; cả4 đã xóa. Ảnh thứ3 upload direct201 `HTTP-c5b24b3d9c17`, download200/checksum đúng, unsigned403, wrongowner403. Chỉ có một upload attempt cho object này; harness đầu parse nhầm data List thành object đã được khôi phục bằng authorized GET, **không reupload** và không sửa ứng dụng.

Restart riêng Marketplace bằng local JMX của đúng PID owned, sau đó authorized Gateway RFQ read trả image còn bền; SHA-256 `a9b8edfddffda3b65225c2b80be7889a0c7bccc50da389a2dde19a3cc342af53` khớp đầu vào. Delete Gateway204 `HTTP-80f0b169180b`; signed URL chưa hết hạn đọc lại404. ADC/service-account/IAM không đổi; cleanup tự động luôn tắt.

Sau khi nhận xác nhận mới, chỉ khởi động Identity/Marketplace/Gateway từ cùng JAR để dùng ảnh thứ4: Gateway upload201 `HTTP-610c3d487728`, download200/checksum đúng/unsigned403, rồi direct delete204 `HTTP-91f1c496b0d7` và after-delete404. Hai route happy còn thiếu API-071/072 đã được đóng bằng request mới, không lấy PASS trước merge lấp vào. Native MinIO vẫn không có,11 operation phụ thuộc bị blocked. Gemini requests0, generation_jobs0, không Java2D/mock design thay thế.


### 37.13. F01–F13 và lỗi tồn đọng

| Finding | Sau merge | Chứng cứ/kết luận |
|---|---|---|
| F01 | ALREADY_FIXED_VERIFIED | Native Cake DB/root credential giữ nguyên,8085/Gateway200 |
| F02 | FIXED_VERIFIED | 6clients root JWT/downstream200; negative401/403 |
| F03 | BLOCKED_ENVIRONMENT | Không native MinIO; storage503 |
| F04 | FIXED_VERIFIED | Storage503/input400 actual direct/GW |
| F05 | FIXED_VERIFIED | Invalid enum/UUID/time400 |
| F06 | FIXED_VERIFIED | 405/Allow thực |
| F07 | FIXED_VERIFIED | 7spec prefix +7UIExecute200 |
| F08 | FIXED_VERIFIED | CORS56/56 +browser thật |
| F09 | FIXED_VERIFIED | Ready Cake; refused502/timeout504 |
| F10 | FIXED_VERIFIED | Bearer/HMAC spec +protectedruntime |
| F11 | FIXED_VERIFIED | 8readiness200, UI/YAML docs |
| F12 | FIXED_ADAPTER_VERIFIED | ADC real upload/read/delete cả2route, checksum/restart; trong4ảnh được phép |
| F13 | FIXED_VERIFIED | Root-only/envaliases/backup;hasheskhớp |

Source regression CORS đã sửa và fullsuite pass. Native storage/provider constraints trước merge vẫn tồn tại, không quy thành lỗi merge. API-114 chưa có legitimate registered caller grant order:context:read; wrongscope403 đạt nhưng happy chưa được chứng nhận. Không thêm grant quá quyền chỉ để tăng coverage. API-108 retired404 đúng contract. Callback088/089 còn thiếu sandbox settlement fixture. Cake OpenAPI response202 của job và root CORS-DEV docs cần đối chiếu khi future provider campaign được phép; không sửa Frontend/Mobile để che giới hạn.


### 37.14. File thay đổi và tương thích protected clients

Danh sách dưới đây so với **baseline đầu execution**, bao gồm thay đổi incoming và local cần giữ. File user dirty nhưng nguyên byte so baseline không được nhận là file do agent sửa. `.env` có sửa P0 trước merge, nguyên byte trong merge. Root Compose/.gitignore/docs thay đổi chỉ từ upstream; agent không sửa thêm. Backend CONTEXT đã cập nhật CORS policy mới.

| File | Loại |
|---|---|
| `.env` | MODIFIED |
| `.env.example` | MODIFIED |
| `.gitignore` | MODIFIED |
| `backend/api-gateway/src/main/java/com/se193262/apigateway/CONTEXT.md` | MODIFIED |
| `backend/api-gateway/src/main/java/com/se193262/apigateway/config/EdgeHttpConfig.java` | NEW |
| `backend/api-gateway/src/main/java/com/se193262/apigateway/config/UpstreamFailureFilter.java` | NEW |
| `backend/api-gateway/src/main/resources/application.properties` | MODIFIED |
| `backend/api-gateway/src/test/java/com/se193262/apigateway/config/EdgeHttpConfigTest.java` | NEW |
| `backend/bakery-service/README.md` | MODIFIED |
| `backend/bakery-service/pom.xml` | MODIFIED |
| `backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/addon/controller/AddOnController.java` | MODIFIED |
| `backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/controller/AdminBakeryController.java` | MODIFIED |
| `backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/controller/BakeryController.java` | MODIFIED |
| `backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/controller/BakeryOnboardingController.java` | MODIFIED |
| `backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/controller/InternalBakeryController.java` | MODIFIED |
| `backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/bakery/controller/PublicBakeryController.java` | MODIFIED |
| `backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/catalog/CatalogController.java` | MODIFIED |
| `backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/catalog/controller/InternalCatalogController.java` | MODIFIED |
| `backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/category/controller/ProductCategoryController.java` | MODIFIED |
| `backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/member/controller/BakeryMemberController.java` | MODIFIED |
| `backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/product/controller/ProductController.java` | MODIFIED |
| `backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/product/controller/PublicProductController.java` | MODIFIED |
| `backend/bakery-service/src/main/java/com/se193262/bakeryservice/infrastructure/storage/BakeryImageStorage.java` | MODIFIED |
| `backend/bakery-service/src/main/java/com/se193262/bakeryservice/security/SecurityConfig.java` | MODIFIED |
| `backend/bakery-service/src/main/resources/application.yml` | MODIFIED |
| `backend/bakery-service/src/test/java/com/se193262/bakeryservice/infrastructure/storage/BakeryImageStorageTest.java` | MODIFIED |
| `backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/config/OpenApiConfig.java` | NEW |
| `backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/design/DesignController.java` | MODIFIED |
| `backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/design/DesignValidationController.java` | MODIFIED |
| `backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/design/PublicStorageController.java` | MODIFIED |
| `backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/generation/GenerationController.java` | MODIFIED |
| `backend/cake-ai-service/src/main/resources/application.yml` | MODIFIED |
| `backend/chat-service/pom.xml` | MODIFIED |
| `backend/chat-service/src/main/java/com/se193262/chatservice/config/SecurityConfig.java` | MODIFIED |
| `backend/chat-service/src/main/java/com/se193262/chatservice/feature/conversation/ConversationController.java` | MODIFIED |
| `backend/chat-service/src/main/java/com/se193262/chatservice/feature/message/MessageController.java` | MODIFIED |
| `backend/chat-service/src/main/resources/application.yml` | MODIFIED |
| `backend/identity-service/README.md` | MODIFIED |
| `backend/identity-service/src/main/java/com/se193262/identityservice/config/JwkSetController.java` | MODIFIED |
| `backend/identity-service/src/main/java/com/se193262/identityservice/config/JwtConfig.java` | MODIFIED |
| `backend/identity-service/src/main/java/com/se193262/identityservice/config/OpenApiConfig.java` | MODIFIED |
| `backend/identity-service/src/main/java/com/se193262/identityservice/config/SecurityConfig.java` | MODIFIED |
| `backend/identity-service/src/main/java/com/se193262/identityservice/exception/GlobalExceptionHandler.java` | MODIFIED |
| `backend/identity-service/src/main/java/com/se193262/identityservice/feature/address/AddressController.java` | MODIFIED |
| `backend/identity-service/src/main/java/com/se193262/identityservice/feature/authentication/AuthenticationController.java` | MODIFIED |
| `backend/identity-service/src/main/java/com/se193262/identityservice/feature/authentication/ServiceTokenController.java` | MODIFIED |
| `backend/identity-service/src/main/java/com/se193262/identityservice/feature/user/AdminUserController.java` | MODIFIED |
| `backend/identity-service/src/main/java/com/se193262/identityservice/feature/user/UserContextController.java` | MODIFIED |
| `backend/identity-service/src/main/java/com/se193262/identityservice/feature/user/UserController.java` | MODIFIED |
| `backend/identity-service/src/main/resources/application.yml` | MODIFIED |
| `backend/identity-service/src/test/java/com/se193262/identityservice/exception/UnsupportedMethodTest.java` | NEW |
| `backend/marketplace-service/README.md` | MODIFIED |
| `backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/CakeRequestController.java` | MODIFIED |
| `backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/CakeRequestServiceImpl.java` | MODIFIED |
| `backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/MarketplaceContextController.java` | MODIFIED |
| `backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/offer/OfferController.java` | MODIFIED |
| `backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/offer/OfferServiceImpl.java` | MODIFIED |
| `backend/marketplace-service/src/main/resources/application.yml` | MODIFIED |
| `backend/marketplace-service/src/test/java/com/se193262/marketplaceservice/feature/cakerequest/MarketplaceFilterValidationTest.java` | NEW |
| `backend/order-service/pom.xml` | MODIFIED |
| `backend/order-service/src/main/java/com/se193262/orderservice/config/OpenApiConfig.java` | NEW |
| `backend/order-service/src/main/java/com/se193262/orderservice/config/SecurityConfig.java` | MODIFIED |
| `backend/order-service/src/main/java/com/se193262/orderservice/feature/order/InternalOrderController.java` | MODIFIED |
| `backend/order-service/src/main/java/com/se193262/orderservice/feature/order/OfferOrderController.java` | MODIFIED |
| `backend/order-service/src/main/java/com/se193262/orderservice/feature/order/OrderController.java` | MODIFIED |
| `backend/order-service/src/main/java/com/se193262/orderservice/feature/review/ReviewController.java` | MODIFIED |
| `backend/order-service/src/main/resources/application.yml` | MODIFIED |
| `backend/platform-support/src/main/java/com/se193262/platform/config/ResourceSecurityConfiguration.java` | MODIFIED |
| `backend/platform-support/src/main/java/com/se193262/platform/exception/PlatformExceptionHandler.java` | MODIFIED |
| `backend/platform-support/src/test/java/com/se193262/platform/exception/PlatformExceptionHandlerTest.java` | NEW |
| `backend/subscription-service/README.md` | MODIFIED |
| `backend/subscription-service/pom.xml` | MODIFIED |
| `backend/subscription-service/src/main/java/com/se193262/subscriptionservice/config/OpenApiConfig.java` | MODIFIED |
| `backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/payment/controller/AdminBakeryPaymentController.java` | MODIFIED |
| `backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/payment/controller/BakeryPaymentController.java` | MODIFIED |
| `backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/payment/controller/PaymentOptionsController.java` | MODIFIED |
| `backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/payment/controller/VnpayController.java` | MODIFIED |
| `backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/plan/controller/AdminSubscriptionPlanController.java` | MODIFIED |
| `backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/plan/controller/SubscriptionPlanController.java` | MODIFIED |
| `backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/subscription/controller/BakerySubscriptionController.java` | MODIFIED |
| `backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/subscription/controller/InternalSubscriptionController.java` | MODIFIED |
| `backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/subscriptionorder/controller/AdminSubscriptionOrderController.java` | MODIFIED |
| `backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/subscriptionorder/controller/SubscriptionOrderController.java` | MODIFIED |
| `backend/subscription-service/src/main/java/com/se193262/subscriptionservice/security/SecurityConfig.java` | MODIFIED |
| `backend/subscription-service/src/main/resources/application.yml` | MODIFIED |
| `compose.local-runtime.yaml` | MODIFIED |
| `compose.yaml` | MODIFIED |
| `docs/PROJECT-STATUS.md` | MODIFIED |
| `scripts/Native-Backend.ps1` | NEW |
| `scripts/NativeShutdown.java` | NEW |
| `scripts/Test-NativeBackend.py` | NEW |
| `scripts/native_backend.py` | NEW |
| `scripts/test_native_backend.py` | NEW |
| `backend/bakery-service/.env.example` | DELETED_BY_UPSTREAM (không phục hồi CorsProperties/env examples cũ) |
| `backend/identity-service/.env.example` | DELETED_BY_UPSTREAM (không phục hồi CorsProperties/env examples cũ) |
| `backend/identity-service/src/main/java/com/se193262/identityservice/config/CorsProperties.java` | DELETED_BY_UPSTREAM (không phục hồi CorsProperties/env examples cũ) |
| `backend/subscription-service/.env.example` | DELETED_BY_UPSTREAM (không phục hồi CorsProperties/env examples cũ) |
| `docs/BAKERY_PLATFORM_NATIVE_BACKEND_P0_P2_REMEDIATION_FULL_API_RETEST_VI.md` | Báo cáo hợp nhất này |

Không có frontend/mobile incoming, không có thay đổi do agent trong hai cây:1195 protected file hash giữ nguyên. Ba mobile JSON dirty vốn có vẫn nguyên byte. Vite đang proxy direct service ports; Flutter origin config không nhận Gateway prefix trong origin. Không test Web/Android UI trong nhiệm vụ Backend native và không claim các client đã đổi config. HTTP error codes400/405/415/503 có thể làm UI cần ánh xạ thông báo đúng; payload API nghiệp vụ không bị đổi vì merge.


### 37.15. Tính toàn vẹn và bảo mật

Root `.env` ignored/untracked; existing passwords/client secrets/JWK paths giữ nguyên, Cake password preserved=true. External secrets SHA giữ nguyên. Original7 DB row-count+aggregate fingerprints bằng nhau; mọi write nằm trong7 DB isolated. Không reset/drop DB, không xóa persistent volumes, không đổi migration/schema/IAM.

`git diff --check` exit0; unresolved conflicts=[], staged=[]; origin/dev là ancestor/HEAD hiện tại. Stash/ZIP vẫn còn. Compiled source parity không mismatch. Không manual change frontend/mobile/root Compose/.gitignore. Không secret scan flag trong modified source/report; raw JWT/signed URLs không ghi Markdown. Logs native được lọc, DPAPI chỉ decrypt trong memory. Không push/force-push/remote update/production deploy.

Theo yêu cầu cleanup của master mục16.12, chỉ stop Java process của task sau khi collect evidence; giữ PostgreSQL và DB synthetic để tái hiện. Xem trạng thái shutdown đã chốt ở mục37.18; không coi stack sau stop là đang chạy.


### 37.16. Lệnh chạy lại và exact verification

Các script/commands này đã được dùng; artifacts nằm ngoài repo, chỉ root env được đọc làm credential source. Full Maven allowlist và log là evidence, không được thay bằng unfiltered tests vì cấm Testcontainers.

```powershell
Set-Location 'H:\MSS\Bakery-Platform'
# Recopy source fresh và build/test reactor; script nằm ngoài repo.
python 'C:\Users\phuck\AppData\Local\Temp\bakery-native-remediation-20261111-160958\post-merge\source_inventory.py'
python 'C:\Users\phuck\AppData\Local\Temp\bakery-native-remediation-20261111-160958\post-merge\build_current.py'
.\scripts\Native-Backend.ps1 start --state-dir 'C:\Users\phuck\AppData\Local\Temp\bakery-native-remediation-20261111-160958\post-merge\native-runtime-final' --backend-dir 'C:\Users\phuck\AppData\Local\Temp\bakery-native-remediation-20261111-160958\post-merge\verified\backend' --database-map 'C:\Users\phuck\AppData\Local\Temp\bakery-native-remediation-20261111-160958\post-merge\isolated-databases.json' --firebase-sandbox
.\scripts\Native-Backend.ps1 verify --state-dir 'C:\Users\phuck\AppData\Local\Temp\bakery-native-remediation-20261111-160958\post-merge\native-runtime-final'
python .\scripts\Test-NativeBackend.py --output 'C:\Users\phuck\AppData\Local\Temp\bakery-native-remediation-20261111-160958\post-merge\repeat-native-smoke.json'
.\scripts\Native-Backend.ps1 status --state-dir 'C:\Users\phuck\AppData\Local\Temp\bakery-native-remediation-20261111-160958\post-merge\native-runtime-final'
.\scripts\Native-Backend.ps1 stop --state-dir 'C:\Users\phuck\AppData\Local\Temp\bakery-native-remediation-20261111-160958\post-merge\native-runtime-final'
```

Không chạy lại cloud upload script: ngân sách4 ảnh đã dùng hết. Không chạy Gemini hay visit VNPay URL. Để lặp full HTTP journey an toàn, dùng tag cohort mới và database-map isolated; không chạy harness __main__ bootstrap lần nữa trên email cũ. `test-command.json` là command package với named test allowlist thật; JAR provenance ghi source có local fixes, không chỉ HEAD upstream.


### 37.17. Quyết định readiness và bước tiếp theo cần thiết

**PARTIAL**. Git integration hoàn tất an toàn, source Backend đã merge/build/retest thật;108 operation có positive case,108 operation đã có happy trên tất cả route intended hiện được kiểm chứng. Không còn gap hai cloud route sau xác nhận ảnh thứ4. Không còn F02 blocker do khác external dev credentials. Không có confirmed application regression còn mở từ merge sau CORS reconciliation và regression cycle.

Cần native MinIO hợp lệ để11 operation/attachment/direct-checkout đạt; budget/provider sandbox mới cho Gemini authentic workflow; settlement fixture VNPay hợp lệ; legitimate scope contract/caller cho API-114. Root CORS docs upstream cần được đồng bộ trong task tài liệu được cho phép. Không phải thao tác source/secret nào được tự thực hiện ngoài scope để ép100%.

Evidence chính: `merge-proof.json`, `current-build-test.log`, `maven-summary.json`, `http-events.jsonl`, `coverage-final.json`, `journeys-final.json`, `auth-final.json`, `business-invariants.json`, `finish-checks.json`, `swagger-results.json`, `swagger-browser-final.json`, `direct-swagger-ui.json`, `cors-after-merge.json`, `integrity-current.json` trong `C:\Users\phuck\AppData\Local\Temp\bakery-native-remediation-20261111-160958\post-merge`.


### 37.18. Chốt process và thời điểm báo cáo

| Component | Port | PID đã test | JAR SHA-256 | Đã stop / exit |
|---|---:|---:|---|---|
| identity-service | 8081 | 39424 | `49568e20c6ca1c0ae9781ef32dfca4fe12d00542eedaf4214e6ef98da15a211a` | True / 0 |
| bakery-service | 8082 | 38636 | `be0663b0ab256a16695a05153209c3ef01bbf08d626b1cddf9b7c6940ae2d963` | True / 0 |
| marketplace-service | 8083 | 33780 | `f8a43a8d7476d450cf3e686f03df46ee40557ff416579fe5d9c891f6f58a5c27` | True / 0 |
| subscription-service | 8084 | 28340 | `ac0fb8c84ec95817a01edd8287cd4a79940507e087c88773c1c7953406582dfa` | True / 0 |
| cake-ai-service | 8085 | 32548 | `f845c798adfdacee91562642517fdf662103826b21145f2842b7854a78f8601d` | True / 0 |
| order-service | 8086 | 30864 | `b2989d9f55f87d042fb5af8718e7e9df1193bfc1cc9b90e8a8aa0045a8eb6469` | True / 0 |
| chat-service | 8087 | 36020 | `15b369b65662ab9bf34e4f47727b9db5c1fae9394445039244d7ea3837c687cb` | True / 0 |
| api-gateway | 8080 | 14672 | `fa726babdd40f963d91cd0f74fbb838cae9f9a3ee1c6af1340c5afa795fc64b0` | True / 0 |

Final state stopped marker=True. Thời điểm chốt `2026-11-11T18:26:54.492276+07:00`. PostgreSQL native không được dừng. Không có code nào được push lên GitHub.


Bổ sung sau quyền ảnh thứ4: identity-service PID38244 graceful=True, exit=0, marketplace-service PID36180 graceful=True, exit=0, api-gateway PID33516 graceful=True, exit=0. Cloud scoped state stopped=True.
