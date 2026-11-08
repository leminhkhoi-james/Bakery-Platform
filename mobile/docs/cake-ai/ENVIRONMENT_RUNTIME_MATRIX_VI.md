# Ma trận môi trường và Docker Cake AI

Run `20261108T080611Z`. Không có giá trị secret trong bảng. Application source và Compose gốc chỉ đọc. Config runtime nằm ngoài repository tại `H:\MSS\.runtime\cake-ai-execution-20261108T080611Z`.

## Nguồn và thứ tự resolve

Compose dùng `--env-file cake-runtime.env` để nội suy POSTGRES_USER/POSTGRES_PASSWORD; service `env_file` chuyển đúng CAKE_AI_DB_USERNAME/PASSWORD vào consumer. Spring dùng environment runtime, sau đó placeholder/default trong application.yml, rồi ConfigurationProperties defaults. Active profile không được đặt, Boot dùng default. Không tự giả rằng root `.env` đã được đưa vào mọi container.

| Biến | Mục đích | Nguồn hiện tại | Cách xử lý | Xác minh/giới hạn |
|---|---|---|---|---|
| CAKE_AI_DB_USERNAME | user PostgreSQL/Cake AI | external `local-runtime.env` → runtime env_file | reuse, không in giá trị | pg_isready, Flyway và SQL/API thật |
| CAKE_AI_DB_PASSWORD | password PostgreSQL/Cake AI | như trên | reuse; không sinh/đổi password DB cũ | DB kết nối thành công |
| POSTGRES_USER | init user của DB mới | Compose interpolation từ CAKE_AI_DB_USERNAME | mapping cùng credential | DB mới khởi tạo một lần; không reset |
| POSTGRES_PASSWORD | init password của DB mới | Compose interpolation từ CAKE_AI_DB_PASSWORD | mapping cùng credential | không dùng để giả đổi password volume đã có |
| POSTGRES_DB | database mới | Compose ngoài repo | derive từ Compose gốc `cake_ai_db` | hai migration success |
| CAKE_AI_DB_URL | JDBC | Compose ngoài repo | derive từ DNS service cake-ai-db, port5432, DB thật | API persist và restart metadata |
| SERVER_PORT | cổng HTTP container | Compose ngoài repo | derive8080 để khớp deployment Mobile/Marketplace | readiness và business API |
| CAKE_AI_PUBLIC_URL | origin ảnh fallback | runtime override relaxed binding vào CakeAiProperties.publicUrl | derive loopback18105, đúng host port/ADB reverse | Android tải ảnh thật; không sửa URL trả về ở client |
| IDENTITY_JWK_SET_URI | xác minh user/service JWT | DNS `mobile-identity:8080` từ container hiện hữu | derive alias/port đã kiểm tra | token thật login/Customer/Admin/internal |
| IDENTITY_JWT_ISSUER | issuer JWT | application.yml default | giữ default hiện hữu | token thật được chấp nhận |
| IDENTITY_SERVICE_BASE_URL | lấy service token | DNS mobile-identity:8080 | derive từ runtime hiện hữu | reachable; Cake AI token request400 do thiếu credential |
| MARKETPLACE_SERVICE_BASE_URL | xác minh RFQ | DNS phase5-marketplace:8080 | derive từ network/alias hiện hữu | RFQ public hoạt động; Cake AI context không được xác minh đầy đủ |
| SERVICE_CLIENT_ID | định danh client Cake AI | application.yml default | giữ cake-ai-service | chưa đăng ký trong mounted Identity clients |
| SERVICE_CLIENT_SECRET | service credential | default trống, không có nguồn hợp lệ | UNRESOLVED; không bịa/generate vì Identity chưa có registration | token request400; Backend fail-open là blocker |
| CAKE_AI_API_KEY | key provider | runtime tường minh trống; không tìm thấy key trong nguồn đã kiểm tra | không fabricate; bật fallback bằng cơ chế source hỗ trợ | Java2D verified; provider BLOCKED |
| GEMINI_API_KEY | alias interpolation của Compose standalone cũ | không hiện hữu trong nguồn đã kiểm tra | không tạo giả; không dùng như Spring property trực tiếp | thiếu credential provider |
| CAKE_AI_PROVIDER_URL | REST provider origin | application.yml default | giữ, không gọi khi key trống | source đối chiếu official docs; live NOT_VERIFIED |
| CAKE_AI_IMAGE_MODEL | model generation | application.yml default | giữ; fallback không gọi model | model label trong DB không chứng minh provider |
| CAKE_AI_MODERATION_MODEL | model moderation | application.yml default | giữ; fallback dùng từ khóa local | provider moderation NOT_VERIFIED |
| CAKE_AI_CONNECT_TIMEOUT | timeout Google HTTP | application.yml default5s | giữ default | unit test; không có provider/cloud live |
| CAKE_AI_READ_TIMEOUT | timeout Google HTTP | application.yml default120s | giữ default | như trên |
| CAKE_AI_WORKERS | concurrency | application.yml default2 | giữ default | job xử lý thật |
| CAKE_AI_LEASE_DURATION | lease execution | application.yml default30m | giữ default | normal job verified; chưa đợi lease expiry thật |
| CAKE_AI_SCHEDULER_ENABLED | scheduler | application.yml defaulttrue | giữ scheduler chạy | trạng thái tiến tới terminal thật |
| CAKE_AI_POLL_DELAY_MS | fixedDelay poll | runtime5000ms | điều chỉnh cấu hình local để quan sát pending/cancel, không sửa scheduler source | host/Android cancel và processing capture |
| CAKE_AI_FIREBASE_PROJECT_ID | GCS project | runtime tường minh trống | chọn local fallback, không dùng cloud chưa được xác minh sandbox | cloud NOT_VERIFIED |
| CAKE_AI_FIREBASE_BUCKET | GCS bucket | runtime tường minh trống | như trên | local byte storage verified; không durable |
| FIREBASE_PROJECT_ID | fallback placeholder gốc | có trong external config, không inject vào Cake AI runtime này | giữ file gốc read-only | chỉ kiểm tra presence, không gọi cloud |
| FIREBASE_STORAGE_BUCKET | fallback placeholder gốc | như trên | như trên | IAM/access chưa xác minh |
| FIREBASE_CREDENTIALS_FILE | host bind path Compose gốc | external config hiện hữu | không mount vào container mới | service account chỉ kiểm tra cấu trúc |
| GOOGLE_APPLICATION_CREDENTIALS | Google ADC file | không set/mount trong Cake AI runtime | không bịa file/path | không kết luận GCS authenticated |
| CAKE_AI_SERVICE_BASE_URL | shared remote client URL tự thân | application.yml default | không dùng trong call path Cake AI đã thực thi | DEFAULT_NOT_EXERCISED |
| BAKERY_SERVICE_BASE_URL | shared remote client | application.yml default | chưa có call path Cake AI dùng trực tiếp | DEFAULT_NOT_EXERCISED |
| SUBSCRIPTION_SERVICE_BASE_URL | shared remote client | application.yml default | như trên | DEFAULT_NOT_EXERCISED |
| ORDER_SERVICE_BASE_URL | shared remote client | application.yml default | như trên | DEFAULT_NOT_EXERCISED |
| SPRING_PROFILES_ACTIVE | profile | không set | default Boot, được log xác minh | fail-open không được giới hạn bằng dev profile |
| CAKE_AI_URL | public origin Flutter | launcher/Dart define18105 | derive host port và kiểm tra readiness | Android NativeTransport thật |
| CAKE_AI_MODE | thông tin mode Flutter | launcher/Dart define local-fallback | công khai; không credential, không suy từ2xx | UI nói rõ local/ảnh tạm; unknown không hứa provider |

## Cấu hình mới và persistence

Không sinh secret hoặc cryptographic key mới. Username/password DB lấy từ tệp external đã có, chia sẻ đúng giữa một DB mới và Cake AI consumer. Không kết luận entropy của credential cũ từ việc nó tồn tại.

Các giá trị derive đều có căn cứ source/network: DNS Compose, cổng nội bộ8080/5432, alias Marketplace đã dùng, host port18105 không xung đột khi tạo và publicUrl đọc từ ConfigurationProperties thật. DB không mở cổng host nên không tác động PostgreSQL5432 khác.

Runtime env_file chứa đúng hai biến DB, nằm ngoài Git, ACL hạn chế: inheritance disabled, hai access rules cho user hiện tại và SYSTEM. File được tạo một lần và tái sử dụng; prepare không regenerate hoặc ghi đè. Compose/Dockerfile runtime không chứa literal secret. Identity signing keys và Firebase file gốc không bị đổi/copy vào repository.

Container/database/volume dùng restart unless-stopped. `restart` Cake AI đã kiểm chứng DB metadata còn, ảnh RAM mất. Đây là giới hạn source, không phải lỗi thiếu volume mount có thể tự chữa bằng cấu hình. Reboot host chưa thực hiện.

## Trạng thái theo thành phần

| Thành phần | Required | Existing/reuse | Derive | Generated | Unresolved | Runtime |
|---|---|---|---|---|---|---|
| cake-ai-service | DB/JWT/Marketplace; provider/storage tùy chế độ | DB credential, issuer/defaults, current reactor artifact | DB URL, Identity/JWK/Marketplace URL, public URL, port | không secret mới; chỉ runtime config | SERVICE_CLIENT_SECRET + Identity registration/grant; provider key/sandbox; GCS sandbox/IAM | RUNNING_WITH_LIMITATIONS |
| cake-ai-db | POSTGRES_DB/USER/PASSWORD | image17-alpine, credential external | DB/service DNS, new volume | new local DB/schema qua migration được phép | không | RUNNING_AND_VERIFIED |
| Identity hiện hữu | login/JWKS/service grants | không sửa image/config/mount/key | không đổi | không | Cake AI client chưa registered; source drift12 tệp | RUNNING_WITH_LIMITATIONS |
| Marketplace hiện hữu | RFQ và Cake AI internal validation | container và client credential/grant hiện hữu | Cake AI alias trên network đúng URL sẵn có | không | Backend fail-open ở Cake AI consumer; source/runtime khác cần task riêng nếu muốn đồng bộ | handoff RUNNING_AND_VERIFIED trong phạm vi local |

[Runtime configuration](evidence/20261108T080611Z/runtime-configuration.json) · [health](evidence/20261108T080611Z/runtime-health.json) · [ACL](evidence/20261108T080611Z/runtime-file-permissions.json) · [internal verification](evidence/20261108T080611Z/internal-contract-verification.json).
