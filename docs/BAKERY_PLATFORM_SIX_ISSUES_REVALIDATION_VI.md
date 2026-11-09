# Bakery Platform — tái xác minh sáu vấn đề lịch sử

Đợt kiểm tra `20261108T090801Z`, ngày 08/11/2026, repository `H:\MSS\Bakery-Platform`. Đây là báo cáo audit, không phải biên bản triển khai bản sửa.

## 1. Tổng quan kết quả kiểm tra

Sáu vấn đề có nguyên nhân khác nhau. **Không có bằng chứng rằng `.env` mới tự giải quyết chúng trong deployment đang chạy.** Chat History và Gateway đã được triển khai trong source hiện tại, nhưng deployment cũ chưa đồng bộ. Cake AI build được bằng reactor và container hiện tại dùng đúng classes; build module lẻ vẫn tái hiện lỗi do shared JAR cũ. URL tệp Chat, RFQ storage bị tắt và pending Chat chỉ lưu RAM vẫn là các giới hạn thực tế.

Đã chạy build ngoài repository, kiểm tra API trên deployment hiện hữu, dựng Chat/Gateway và DB/storage dùng một lần để phân biệt source mới với artifact cũ, và kiểm tra Android thật với fault injection ở transport. Không dùng mock response thành công để thay Backend. Đã quan sát Backend trả201 trước khi cố ý bỏ phản hồi, dừng riêng tiến trình ứng dụng kiểm tra, rồi xác minh phiên đăng nhập còn nhưng pending mất.

## 2. Phạm vi và phương pháp kiểm tra

Đường dẫn người dùng nêu `PROMPT_SIX_ISSUES_REVALIDATION.md` không tồn tại khi bắt đầu. Repository có `BAKERY_PLATFORM_SIX_ISSUES_REVALIDATION_UPDATED_PROMPT_EN.md` đúng chủ đề sáu vấn đề và phần bổ sung `.env`; đã đọc toàn bộ **1.312 dòng** của tệp cập nhật này trước thực thi. Không tạo lại hoặc đổi tên prompt.

Đã đọc quy tắc dự án trước, PROJECT-STATUS/ARCHITECTURE/API_SPEC/DATABASE và source liên quan. Tám tài liệu lịch sử tìm thấy được đọc và đối chiếu; tên `BAKERY_PLATFORM_MOBILE_MARKETPLACE_ORDER_CHAT_INTEGRATION_REPORT_VI.md` không tìm thấy theo tên được yêu cầu. Không coi phần không tìm được là đã đọc. CONTEXT của Gateway còn mô tả skeleton, khác source thật; source/compiler/runtime được ưu tiên.

Workspace bằng chứng ngoài repository:

`H:\MSS\.diagnostics\six-issues-20261108T090801Z`

Các link bằng chứng trong báo cáo trỏ tới workspace này trên máy hiện tại; chúng không được đưa vào Git. [Baseline](../../.diagnostics/six-issues-20261108T090801Z/baseline.json), [tài liệu lịch sử](../../.diagnostics/six-issues-20261108T090801Z/historical-references.json).

Chỉ tạo báo cáo Markdown này trong repository. Không sửa Backend, Frontend, Mobile, POM, Compose, `.env`, secret, migration hoặc README. Các harness/build nằm ngoài repository. Không thêm dependency vào source, không install shared JAR vào `.m2`, không áp dụng cấu hình mới vào deployment hiện hữu.

## 3. Thông tin repository và môi trường

| Thành phần | Đã xác minh |
|---|---|
| Nhánh/commit | `dev` / `35536f664ffe7db889a623aabc3ff6cfd5bbb75c` |
| Working tree ban đầu | Có sẵn 5 tệp Mobile tracked đã sửa và các tệp Mobile/prompt untracked từ công việc trước; giữ nguyên |
| Baseline | 4.243 tệp ngoài thư mục cache/build và 7 tệp private Bakery Platform; hash/size/mtime để đối chiếu nội bộ |
| Java/Maven | Oracle JDK21.0.8, Maven3.9.11; container Java21 |
| Backend | Spring Boot4.1.1, Java21, Spring Cloud BOM2025.1.3 |
| Flutter/Dart | Flutter3.47.1, Dart3.13.1 |
| Docker/Compose | daemon29.6.1 / Compose5.3.0 |
| Android | SDK hiện hữu `D:\HomeMind\audit-tools\android-sdk`; emulator-5554, Android API36; ADB platform-tools đã phát hiện |
| Module | platform-support; Identity, Bakery, Marketplace, Order, Chat, Cake AI, Subscription; api-gateway; integration-tests |

[Phiên bản công cụ](../../.diagnostics/six-issues-20261108T090801Z/tool-versions.json). Không nâng cấp toolchain. Không dùng Java8 theo ghi chú lịch sử khi Java21 hiện đã có và được chọn rõ ràng.

Đối chiếu executable JAR, không chỉ tag image: Chat đang triển khai khác build hiện tại ở `ChatMessageRepository.class`, `MessageService.class`, `application.yml`; Gateway cũ thiếu web server/Gateway libraries và cấu hình route mới. Cake AI đang chạy có **0 khác biệt class/resource** so với build source hiện tại. Checksum toàn JAR có thể khác do thời điểm đóng gói nên không dùng riêng checksum JAR để suy ra source drift. [Artifact provenance](../../.diagnostics/six-issues-20261108T090801Z/artifact-provenance.json).

## 4. Kiểm tra `.env` mới và secret files liên quan

Root `.env` tồn tại, mtime ghi nhận 15:59:35 ngày08/11/2026, trước audit nhưng sau thời điểm tạo các container hiện hữu liên quan. Tệp không tracked, được Git ignore. Không stage, không export cả tệp vào terminal, không in giá trị. ACL root `.env` đang kế thừa; không thay quyền hoặc kết luận quyền cloud từ ACL host.

### Nguồn cấu hình thực sự được dùng

`scripts/start-local-runtime.py:23` quy định thứ tự Compose: `compose.yaml`, `docker-compose.bakery-subscription.yml`, `docker-compose.order-service.yml`, `docker-compose.chat-service.yml`, `compose.services.yaml`, `compose.no-firebase.yaml`, `compose.local-runtime.yaml`. Hàm compose dùng **`--env-file` từ external `local-runtime.env`**, không mặc định dùng root `.env`. Kiểm tra đúng tổ hợp bằng `config --quiet` exit0, không xuất bản resolved config chứa secret.

Các container `bakery-mobile-phase5-*` là deployment hiện hữu tạo từ image/config trước đó. Container environment được giữ từ lúc tạo; sửa `.env` không thay nó. Compose interpolation khác `env_file`, container ENV khác Spring property defaults, host file khác mount thật. Active Spring profile không tự xuất hiện chỉ vì có tệp `.env`; Compose profile `gateway` cũng khác Spring profile.

`compose.no-firebase.yaml` reset mount Marketplace; `compose.local-runtime.yaml` đặt project/bucket rỗng. Vì vậy giá trị ở root không vượt qua literal override này. Spring source có fallback/default cho một số biến; biến không có trong ENV không đồng nghĩa chưa resolve.

### Ma trận provenance theo vấn đề

| Issue | Biến/tệp thật | Có ở root mới? | Nguồn private liên quan | Được current container dùng? | Mount | Kiểm tra an toàn | Kết luận |
|---|---|---|---|---|---|---|---|
| 01 | CHAT_DB_URL, CHAT_DB_USERNAME, CHAT_DB_PASSWORD | NO | cấu hình local hiện hữu; URL derive từ Docker | YES, các biến consumer có thật | NOT_APPLICABLE | DB trả dữ liệu/query error42P18; source mới trên PG local đọc được | Không phải thiếu password hoặc `.env` |
| 02 | CHAT_STORAGE_ENDPOINT, CHAT_STORAGE_ACCESS_KEY, CHAT_STORAGE_SECRET_KEY, CHAT_STORAGE_BUCKET | NO | ENV của deployment local/storage hiện hữu | YES | storage volume hiện hữu giữ nguyên | signed GET nội bộ200, byte khớp; host/Android không tải được hostname nội bộ | ENV hiện tại có hiệu lực nhưng endpoint không phù hợp client |
| 02 | CHAT_STORAGE_URL_EXPIRY | NO | không cần secret | Không có explicit ENV; source default được resolve | NOT_APPLICABLE | URL có chữ ký; thời hạn theo default source | Không phải missing-required-variable |
| 03 | FIREBASE_PROJECT_ID, FIREBASE_STORAGE_BUCKET | YES | JSON service account do cấu hình tham chiếu | Có key nhưng **rỗng**, MISMATCH với root | NO credential mount trong Marketplace Mobile | valid upload503 trước upload cloud | Defined ở root nhưng không effective trong consumer |
| 03 | FIREBASE_CREDENTIALS_FILE → GOOGLE_APPLICATION_CREDENTIALS | YES | file JSON tồn tại, parseable; project khớp root bằng so sánh MATCH | ADC path đang rỗng | NO | chỉ kiểm tra format/presence, không gọi bucket | Host path hợp lệ không chứng minh container có credential |
| 04 | CAKE_AI_DB_PASSWORD | YES | external local-runtime.env hiện hữu | YES nhưng MISMATCH với root mới; khớp nguồn local cũ | NOT_APPLICABLE | Cake AI vẫn kết nối DB/readiness bình thường | Không đổi password volume đã khởi tạo; không liên quan compiler |
| 04 | CAKE_AI_CLIENT_SECRET, CAKE_AI_CLIENT_SECRET_HASH | YES | mounted service-client config Identity hiện hữu | NO; Cake AI consumer dùng SERVICE_CLIENT_SECRET, registration Cake AI chưa có | Identity mount đọc được nhưng không đăng ký Cake AI | kiểm tra tên client/property, không tạo token giả | Root bổ sung key chưa tạo registration hoặc mapping |
| 04 | CAKE_AI_API_KEY | NO | không có nguồn API key được xác minh | Biến trong Cake AI đang rỗng | NOT_APPLICABLE | không gọi provider | Không cần key để compile; không dùng credential Google thay API key |
| 05 | IDENTITY_SERVICE_URL, BAKERY_SERVICE_URL, MARKETPLACE_SERVICE_URL, ORDER_SERVICE_URL, SUBSCRIPTION_SERVICE_URL, CHAT_SERVICE_URL, CAKE_AI_SERVICE_URL; SERVER_PORT | Không có bộ upstream Gateway này ở root | không cần secret cho route URI | Gateway cũ dừng; test Gateway dùng override rõ ràng ở container mới | JAR test mount read-only | 7 route thật200, auth401, query/body/multipart đối chiếu | Có route source; cần đúng artifact, profile triển khai và URL consumer |
| 06 | IDENTITY_URL/CHAT_URL là Dart defines; không có config pending journal | Không có cấu hình journal được source hỗ trợ | credential chỉ dùng login test local; token không vào define | root `.env` không tự thành Android config | NOT_APPLICABLE | session còn, pending mất sau restart | Cần persistence/reconciliation, không phải missing secret |

Không so sánh plaintext host credential path với container path rồi kết luận chúng phải bằng nhau; cần kiểm tra bind mount. Các so sánh secret chỉ báo MATCH/MISMATCH/NOT_COMPARABLE, không đưa hash của từng secret yếu vào báo cáo. [Container provenance](../../.diagnostics/six-issues-20261108T090801Z/container-config-provenance.json), [mapping biến](../../.diagnostics/six-issues-20261108T090801Z/semantic-configuration-matrix.json), [root assessment](../../.diagnostics/six-issues-20261108T090801Z/root-env-assessment.json), [quiet validation](../../.diagnostics/six-issues-20261108T090801Z/compose-quiet-validation.json).

### Phân loại an toàn và quyền sử dụng

| Material | Phân loại | Đã làm |
|---|---|---|
| local-smoke-users và account synthetic đã có trong runtime Bakery | SAFE_LOCAL_DEV_CONFIG | dùng login HTTP local, xác minh `/auth/me`; không ghi password/token vào artifact |
| Credential DB/MinIO đang dùng bởi Chat local | SAFE_LOCAL_DEV_CONFIG | reuse có giới hạn cho DB/MinIO test trong RAM; không đổi credential hoặc data store gốc |
| Firebase service account/project/bucket có ở host | POTENTIAL_PRODUCTION_OR_SHARED_CONFIG; PRESENT_NOT_VALIDATED đối với quyền live | kiểm tra JSON/field presence và tính nhất quán project; không xác thực cloud/upload/sign/delete |
| Identity key material | chỉ kiểm tra integrity/path/mount liên quan | không ký JWT giả, không tạo/rotate key, không dùng private key để vượt auth |
| Private material khác không có reference liên quan | ngoài phạm vi | không tìm kiếm đệ quy `H:\MSS`, không mở dữ liệu dự án khác |

Không có quyền kiểm thử production hoặc provider tính phí chỉ vì credential có mặt. Không có request AI/cloud tính phí. Trong container test dùng một lần, Docker nhận các ENV local qua môi trường tiến trình con, không qua literal CLI hoặc image label; không xuất giá trị. Docker lưu ENV của container theo cơ chế mặc định trong thời gian thử, vì vậy các container test có credential được gỡ sau khi thu bằng chứng, không giữ metadata credential tạm để bàn giao. Không sửa quyền hoặc sao chép secret file vào repository.

## 4A. Bảng tổng hợp sáu vấn đề

Trạng thái triển khai ở đây ưu tiên deployment hiện hữu khi bắt đầu; kết quả container test được nêu riêng để tránh gọi bản thử là bản đã triển khai.

| ID | Vấn đề | Trạng thái hiện tại | Nguyên nhân | Cần sửa code? | Cần sửa ENV? | Ưu tiên |
|---|---|---|---|---|---|---|
| ISSUE-01 | Chat History403/42P18 | RESOLVED_SOURCE_ONLY | source đã tách query; image đang dùng query cũ | Không sửa lại query đã đúng; xem error mapping | Không cần secret mới; cần build/deploy đúng artifact | P0 |
| ISSUE-02 | URL chat-storage:9000 | STILL_PRESENT | một MinIO endpoint dùng cho I/O và ký URL; DNS nội bộ | Có cho phương án tách endpoint/proxy download được khuyến nghị | Có public address/network đúng thiết kế; không chỉ đổi host sau ký | P1 |
| ISSUE-03 | RFQ upload503 | STILL_PRESENT | provider Firebase bị tắt trong current container; mount bị reset | Không có source blocker upload đã xác minh; local provider mới sẽ cần code | Có, với sandbox/credential/quyền hợp lệ được cấp phép | P1 |
| ISSUE-04 | Cake AI build | PARTIALLY_RESOLVED | reactor/Docker đạt; module-only lấy shared SNAPSHOT cũ | Không cần sửa Java/POM hiện tại | Không phải ENV; cần workflow/artifact Maven nhất quán | P1 |
| ISSUE-05 | Gateway chưa route HTTP | RESOLVED_SOURCE_ONLY | source đã có router; image/deployment cũ chưa dùng nó | Không cần viết lại routing đã có | Đúng image/profile Compose/upstream URI được source hỗ trợ | P1 |
| ISSUE-06 | Pending mất qua restart | STILL_PRESENT | pending Map/RAM; secure store chỉ lưu session | Có ở Flutter; dùng Backend idempotency/reconciliation hiện hữu | Không có `.env` flag giải quyết | P0 |

ISSUE-04 không có nghĩa reactor hiện tại vẫn compile lỗi: reactor và Cake AI đang chạy đã đạt. Nhãn PARTIALLY_RESOLVED giữ lại bằng chứng module-only vẫn thất bại do cache cũ, thay vì che trường hợp này.

## 5. ISSUE-01 — Chat History / SQLState 42P18

**Source hiện tại:** `backend/chat-service/src/main/java/com/se193262/chatservice/feature/message/ChatMessageRepository.java:25` có `findFirstPage`; dòng43 có `findPageBeforeCursor`. Trang đầu không còn `:beforeTime IS NULL`. Cursor query native dùng PostgreSQL ordering theo created_at/id, `cast(:beforeId as uuid)` tại dòng40. `MessageService.java:103` chọn hai nhánh; `decodeCursor` dòng235 parse Instant/UUID và trả400 khi cursor sai. Schema `messages.id`/client_message_id là UUID, created_at có timezone.

**Artifact đang triển khai:** bytecode annotation trích từ JAR `bakery-mobile-phase5-chat` còn query hợp nhất:

```sql
and (:beforeTime is null or m.createdAt < :beforeTime
     or (m.createdAt = :beforeTime and m.id < :beforeId))
```

Không dùng comment lịch sử để suy ra lỗi: đã thực sự đọc annotation của JAR và tái hiện query. [Query deployed](../../.diagnostics/six-issues-20261108T090801Z/deployed-query-and-gateway-config.json).

| Trường hợp | Deployment cũ | Source hiện tại trên DB test riêng |
|---|---|---|
| Detail hội thoại synthetic được phép | 200 | 200 |
| Trang đầu hội thoại có tin | 403, SQLState42P18 | 200 |
| Cursor không null hợp lệ, lấy từ timestamp/ID thật | 403 | 200, ID trang sau khác trang đầu |
| Hội thoại rỗng | không có fixture rỗng phù hợp ở deployment cũ để xác minh | 200, empty page; kiểm cả trước gửi và hội thoại thứ hai |
| Cursor sai | 400 | 400 |
| Anonymous | không dùng để suy ra lỗi SQL | 401 |
| Người không tham gia | Admin không tham gia trả404 | 404 |
| ID không tồn tại | 404 | 404 |

[Deployed tests](../../.diagnostics/six-issues-20261108T090801Z/deployed-chat-read-tests.json), [cursor bổ sung](../../.diagnostics/six-issues-20261108T090801Z/deployed-chat-additional-checks.json), [SQL signals](../../.diagnostics/six-issues-20261108T090801Z/bakery-mobile-phase5-chat-error-signals.json), [test source mới](../../.diagnostics/six-issues-20261108T090801Z/runtime-api-checks.json). Không có42P18 trong log Chat test source mới.

**Nguyên nhân đã xác minh:** query/artifact cũ gây inference lỗi tham số PostgreSQL; không phải password/host DB hoặc thiếu `.env`. Cùng user đọc detail200 nhưng history403, kèm server42P18, nên403 này không phải bằng chứng mất quyền. `GlobalExceptionHandler` chưa handle nhóm lỗi DB/query tổng quát; `SecurityConfig.java:112` deny các request khác, gồm đường error không được permit. Đây giải thích việc lỗi server bị che thành403; chưa chạy một fault DB mới riêng để quy toàn bộ error-dispatch của source hiện tại cho mọi loại exception.

**Khuyến nghị:** build/deploy đúng Chat hiện tại trước, không sửa lại query đã đạt. Bổ sung regression PostgreSQL cho null/non-null/timestamp bằng nhau và kiểm error mapping500/503 trong task được cấp quyền; tránh blanket permit API hoặc bỏ kiểm tra participant. Phương án typed bind/cast là hợp lý cho query cần nó, nhưng source đã chọn hai nhánh rõ ràng. Độ phức tạp LOW cho cập nhật artifact đúng quy trình, MEDIUM nếu bổ sung error handling/tests. Ảnh hưởng: chặn lịch sử, cursor và đối soát pending của ISSUE-06.

## 6. ISSUE-02 — Chat Attachment Public URL

`StorageProperties.java:9` chỉ có một endpoint. `MinioAttachmentStorage.java:24` dựng một MinioClient; cùng client upload và `signedGetUrl` dòng48. `application.yml` dùng các biến CHAT_STORAGE_* đã liệt kê, expiry default; không có public signing endpoint riêng được source hỗ trợ.

Đã upload ảnh kiểm soát vào Chat/MinIO dùng một lần: POST201, MIME được khai báo JPEG. GET URL nguyên gốc bên trong network Docker trả **200 image/jpeg, 42.397 byte**, SHA-256 khớp byte upload. URL hiện có hostname **chat-storage**, port9000, signed headers có host. Host Windows dùng URL nguyên gốc gặp URLError. Android dùng chính URL Backend vừa cấp, không gắn Identity token, gặp **SocketException**; UI từ chối link HTTP nội bộ và nêu rõ tệp được nhận nhưng chưa tải được trên thiết bị.

Unsigned GET cùng object trong storage test trả403; signed GET không cần JWT ứng dụng vì quyền nằm trong chữ ký URL. Không sửa hostname/cổng/query trong một URL đã ký để làm cho test thành công. Không chờ hết TTL nên expiry thực tế sau thời hạn chưa được xác minh. [Byte verification](../../.diagnostics/six-issues-20261108T090801Z/attachment-verification.json), [HTTP type/auth](../../.diagnostics/six-issues-20261108T090801Z/attachment-auth-and-type.json), [Android probe](../../.diagnostics/six-issues-20261108T090801Z/android-before-restart-results.json).

SigV4 đưa host vào canonical signed headers, nên thay host/cổng sau ký có thể làm chữ ký không còn khớp. Điều này phù hợp [tài liệu chính thức AWS về query signing](https://docs.aws.amazon.com/AmazonS3/latest/developerguide/sigv4-query-string-auth.html); không kiểm bằng cách tự rewrite URL.

**Nguyên nhân:** internal endpoint được dùng làm public download origin; thiếu sự tách biệt hoặc một hostname chung truy cập được bởi Backend và thiết bị. Credential local không thiếu: upload/sign/download trong Docker đã đạt. `.env` mới không có cấu hình Chat này và không tạo public contract.

**Phương án:** cấu hình một DNS/proxy chung đúng Host, dùng được cả Docker và Android, có thể tránh sửa app nếu hạ tầng đáp ứng đầy đủ. Phương án được khuyến nghị cho kiến trúc hiện tại là tách endpoint nội bộ với signing/public origin trong StorageProperties/adapter, hoặc thêm Backend download proxy được kiểm quyền. Các property mới này **chưa tồn tại**, cần task triển khai; không khuyên điền một tên ENV tưởng tượng vào `.env`. Độ phức tạp MEDIUM; kiểm signed/unsigned GET, checksum, MIME, expiry và Android sau sửa. Không dùng Gateway hiện tại để mặc định sửa URL MinIO: nó chưa proxy object-storage path.

## 7. ISSUE-03 — RFQ Image Upload HTTP 503

Endpoint thật `POST /api/v1/cake-requests/{id}/images`, parts `files`. `RequestImageServiceImpl.java:42` kiểm số tệp và quyền DRAFT, kiểm byte/size trước upload, persist metadata sau storage thành công. `infrastructure/storage/FirebaseStorageAdapter.java:26` chỉ có Firebase/GCS; dòng29–33 từ chối bucket/project trống, sau đó mới load ADC. Không có MinIO/local provider để tự bật chỉ bằng cấu hình.

Root có project/bucket/credential reference; file host tồn tại, JSON parseable và có trường cần thiết, project so sánh MATCH. Nhưng Marketplace Mobile đang có project/bucket **rỗng**, ADC path rỗng và **không có mount credential**. Source override `compose.no-firebase.yaml`/`compose.local-runtime.yaml` giải thích trạng thái này. Chưa có bằng chứng credential sai hoặc IAM bị từ chối: adapter dừng trước khi sử dụng chúng.

Chỉ gửi upload sau khi preflight xác nhận consumer đang tắt cloud, trên RFQ DRAFT synthetic đã có của tài khoản test. Các request đều không tạo object hoặc metadata thành công; đọc RFQ trước/sau cho kết quả không đổi.

| Test | HTTP thật |
|---|---|
| Ảnh hợp lệ, owner, DRAFT, provider đang tắt | 503 |
| Byte không phải ảnh | 400 |
| Vượt10MiB | 400 |
| RFQ OPEN | 409 |
| Customer khác | 403 |
| Anonymous | 401 |
| Retrieve/delete ảnh đã upload | BLOCKED, không có object thành công để dùng |

[RFQ test evidence](../../.diagnostics/six-issues-20261108T090801Z/rfq-upload-checks.json). Không gọi bucket thật hoặc tạo thành công giả. API login dùng synthetic credentials local; không gửi email hoặc tạo đơn/thanh toán.

**Nguyên nhân hiện tại:** cấu hình provider bị tắt và mount không được truyền, không phải bằng chứng thiếu dependency hoặc sai business permission. **ENV-only khả thi theo source** nếu có sandbox/project/bucket/ADC/IAM hợp lệ được cấp phép và áp dụng đúng Compose/mount rồi recreate riêng consumer trong task sau. Mere presence không chứng minh những điều kiện đó. Nếu yêu cầu chạy hoàn toàn offline, phải triển khai provider abstraction/local adapter trong task khác; không giả rằng MinIO của Chat là provider Marketplace. Độ phức tạp LOW–MEDIUM cho cấu hình được phê duyệt, MEDIUM cho local provider mới.

## 8. ISSUE-04 — Cake AI Maven Build

Đã đọc đầy đủ parent POM, Cake AI POM và platform-support POM. Parent Boot4.1.1/Java21, BOM Cloud2025.1.3. Cake AI khai báo compile `google-cloud-storage:2.43.0`, shared `${project.version}`; executable classifier `exec`. Google auth resolve transitively `google-auth-library-credentials` và `google-auth-library-oauth2-http`1.25.0; không cần thêm direct dependency để lớp đã có xuất hiện lại.

Source `backend/platform-support/src/main/java/com/se193262/platform/dto/ApiResponse.java:14` có public static generic `<T> ApiResponse<T> accepted(T data)`, envelope status202; `GenerationController.java:52` dùng đúng import và `ResponseEntity.accepted()` giữ HTTP202. Không có lỗi overload/generic hoặc khác tên phương thức trong source hiện tại.

Build trong workspace ngoài repository, không sửa source:

```powershell
mvn -B -ntp -pl cake-ai-service,chat-service,api-gateway -am -DskipTests package
```

Reactor parent → platform-support → Chat → Cake AI → Gateway **SUCCESS**, exit0, khoảng49 giây. Cake AI executable JAR đóng gói shared JAR hiện tại, `javap` xác minh có accepted. Container Cake AI hiện hữu có classes/resources khớp build hiện tại và đáp ứng API thật. Không dùng readiness để suy ra provider đã hoạt động.

Đối chứng fresh target module-only trong bản sao riêng:

```powershell
mvn -B -ntp -f cake-ai-service/pom.xml -DskipTests compile
```

Lệnh này **FAIL**, `GenerationController.java:[52,58] cannot find symbol method accepted(GenerationJobResponse)`. JAR platform-support đang installed trong `.m2` thực sự không có accepted; nested JAR reactor có. Không thay `.m2` hoặc install để làm mất bằng chứng.

**Kết luận trực tiếp:** Cake AI **không còn fail với reactor/Docker workflow hiện tại**. Module-only vẫn fail trong cache hiện tại do stale SNAPSHOT. Đây là lý do giữ trạng thái PARTIALLY_RESOLVED đối với toàn bộ ma trận build, đồng thời xác nhận source/current container đã sửa được compiler blocker. `.env` mới, DB password, service client secret hoặc Google runtime credential không sửa được một phương thức thiếu trong JAR cũ.

[Reactor](../../.diagnostics/six-issues-20261108T090801Z/reactor-package-result.json), [standalone](../../.diagnostics/six-issues-20261108T090801Z/standalone-compile-result.json), [signatures/libraries](../../.diagnostics/six-issues-20261108T090801Z/cake-build-contract.json). Không có Maven profile/JDK selection từ root `.env` được chứng minh. JDK21 đã dùng rõ ràng; runtime credential không tham gia compile.

**Khuyến nghị LOW:** chuẩn hóa `-pl cake-ai-service -am` trong CI/local/Docker; nếu cần module-only, chuẩn bị artifact shared đúng version trong workflow có kiểm soát. Không thêm dependency Google hoặc sửa factory đúng chỉ để chữa cache. Không cần sửa Java/POM theo bằng chứng này; chưa kiểm AI/provider vì không liên quan ISSUE-04 và không được cấp phép tính phí.

## 9. ISSUE-05 — API Gateway Routing

Source hiện tại đã có `spring-cloud-gateway-server-webmvc`, actuator, Boot web server transitively và application entry point. `backend/api-gateway/src/main/resources/application.properties:19` bắt đầu14 route: bảy API domain và bảy OpenAPI proxies. Route API dùng Path có prefix service và StripPrefix1. URI dùng các biến `*_SERVICE_URL` thật ở dòng7–13; tên khác `*_SERVICE_BASE_URL` của một số business service.

Gateway hiện hữu `bakery-local-api-gateway-1` dừng; JAR cũ chỉ có Boot core, không có router/server libs và thiếu application.properties mới. Tên module/tag image không đủ chứng minh routing. Không start/recreate deployment cũ để áp `.env` mới. Bản Gateway current-source được chạy **tạm** tại host18200 với upstream URLs derive từ network đang có, không sửa Compose hoặc service hiện hữu.

| Domain | Public route thật | Source có route | Runtime test hiện tại | Deployment gốc |
|---|---|---|---|---|
| Identity | `/identity/api/**` | YES | `/identity/api/v1/auth/me`200 với user hợp lệ | chưa cập nhật |
| Bakery | `/bakery/api/**` | YES | products200; pageSize1/2 được bảo toàn | chưa cập nhật |
| Marketplace | `/marketplace/api/**` | YES | cake-requests200, data tương đương direct | chưa cập nhật |
| Order | `/orders/api/**` | YES | orders200, data/meta tương đương direct | chưa cập nhật |
| Subscription | `/subscription/api/**` | YES | plans200, data tương đương direct | chưa cập nhật |
| Chat | `/chat/api/**` | YES | messages200 trên Chat test source mới | chưa cập nhật |
| Cake AI | `/cake-ai/api/**` | YES | generation-jobs200, data tương đương direct | chưa cập nhật |

Đã kiểm auth header được forward bằng `/auth/me` thật; anonymous upstream401 được giữ. `/identity/internal/v1/...`404, generic `/api/v1/products`404 và `/chat/storage/...`404 đúng vì không có các route này. Multipart replay qua Gateway trả200 và cùng message ID, không tạo thêm message trong DB test. Không đánh đồng `/api/v1` generic với contract service-prefix đang có.

So sánh body ban đầu khác do expiry/URL storage được sinh theo mỗi request; một assertion ban đầu đọc nhầm `meta.size`, trong khi Bakery dùng **meta.pageSize**. Đã giữ raw kết quả và đối chiếu lại pageSize1/2, count1/2, stable data và các field khác. Không đổi response để làm test đạt, không rewrite URL request. [API checks](../../.diagnostics/six-issues-20261108T090801Z/runtime-api-checks.json), [body/query đối chiếu](../../.diagnostics/six-issues-20261108T090801Z/gateway-body-query-verification.json).

**Kết luận:** RESOLVED_SOURCE_ONLY đối với deployment gốc; source đã được xác minh chạy router thật trong môi trường tạm. Khuyến nghị LOW–MEDIUM: build/deploy image hiện tại theo quy trình riêng, bật đúng Compose profile và cung cấp URI đúng tên property/cổng/DNS. Không viết lại router. Flutter hiện dùng direct origins và builder `/api/v1`, nên chưa thể chỉ đặt một Gateway origin để tự thêm service-prefix; cần kế hoạch tích hợp client hoặc edge contract rõ ràng. Không thực hiện trong audit.

## 10. ISSUE-06 — Chat Pending Message Recovery

`mobile/lib/features/chat/data/live_chat_repository.dart` giữ `Map<String,PendingChatMessage>`; command gồm ID/content/attachment bytes trong RAM. Send giữ logical ID/payload khi uncertain, chặn đổi payload khi còn pending, không tự retry POST. `live_chat_page.dart:76` phục hồi pending từ repository trong cùng process; dòng129 đối chiếu `clientMessageId` và sender trong trang history đã tải. `LiveWorkspace` clear pending khi đổi session/account. Không có durable journal được gọi trong path này.

`features/auth/data/session_store.dart:86` encode accessToken/expiry/cookie/identity origin; secure storage là **session store**, không phải journal Chat. Package secure-storage có mặt không làm Map pending tự persist. Root `.env` không tham gia lifecycle Map này.

Backend hiện có `client_message_id UUID NOT NULL UNIQUE` ở migrationV1 dòng38, payload fingerprint dòng39. `MessageService.java:198` verify conversation/sender/fingerprint khi replay; persistence transactional; cùng logical ID/payload trả message cũ200, khác payload409. Message response có clientMessageId và cursor history đủ cho reconciliation cơ bản, nếu dùng đúng version Chat.

### Sáu tình huống kiểm tra

Production Dart source được copy ra workspace ngoài, **79 tệp lib Dart khớp hash** với Mobile hiện tại. Chỉ thêm harness bên ngoài và tách Android applicationId `com.example.bakery_mobile.sixaudit`, không ghi đè app chính. Wrapper gọi NativeTransport thật; fault A chặn trước truyền, fault B nhận response201 thật rồi bỏ trước khi ApiClient/UI nhận. Trong cửa sổ uncertain, harness tạm chặn GET history của riêng test app để giữ tình huống tới restart; không sửa network/service của người khác. Sau restart wrapper mới trở về normal.

| Scenario | Bằng chứng thật | Kết quả chức năng |
|---|---|---|
| A: lỗi trước truyền | NativeTransport không được gọi cho POST; pending trở0 | xử lý unsent đúng trong test |
| B: persist rồi mất response | Native HTTP201, message/client ID thật; UI nhận uncertain, pending1 | giữ trong RAM đúng; chưa phải durable recovery |
| C: kill/reopen process | chỉ force-stop package test; không kill emulator/DB, không clear data; user/session còn, pending1→0 | **xác minh lỗi mất pending** |
| D: reconciliation | Android đọc được nội dung B từ history Backend source mới, GET200 | Backend cung cấp dữ liệu; app không khôi phục journal đã mất |
| E: duplicate prevention | host replay đúng clientMessageId/payload do Android gửi,200 cùng ID; số bản ghi1→1 | idempotency Backend đạt |
| F: đổi account | pending của phiên cũ được clear; user khác không thấy/resend, convo private trả404 | scope isolation đạt, cần giữ sau khi thêm journal |

[Before restart](../../.diagnostics/six-issues-20261108T090801Z/android-before-restart-results.json), [process control](../../.diagnostics/six-issues-20261108T090801Z/android-process-restart.json), [after restart](../../.diagnostics/six-issues-20261108T090801Z/android-after-restart-results.json), [E replay](../../.diagnostics/six-issues-20261108T090801Z/pending-backend-reconciliation.json), [copy provenance](../../.diagnostics/six-issues-20261108T090801Z/mobile-copy-provenance.json).

Chữ PASS trong assertion C nghĩa là test đã quan sát đúng hiện tượng mất pending, **không phải tính năng recovery đạt**. Đổi lại điều kiện để gọi thành công sẽ sai với bằng chứng. Dùng source Chat mới giúp chứng minh rằng sửa history không tự làm pending durable. Trên deployment Chat cũ, history403 còn ngăn đối soát.

**Khuyến nghị MEDIUM:** journal riêng theo userId+conversationId, persist trước send, giữ immutable clientMessageId/payload fingerprint và byte/file cache private của attachment. Khi mở lại: auth đúng account, load journal, reconcile theo client ID/sender/payload, giới hạn pagination/retry, chỉ retry cùng logical ID và payload; clear khi ACK/reconciled. Không dùng content giống nhau để đoán duplicate, không kết luận chưa gửi chỉ vì không thấy ở trang30 tin mới nhất. Backend hiện có idempotency cần thiết; lookup chuyên biệt có thể bổ sung sau nếu thực sự cần, không bịa endpoint hiện hữu. Logout/account switching phải cách ly và dọn journal/cache an toàn theo chính sách được xác định.

## 11. Những lỗi đã được khắc phục từ các lần trước

- SQL history đã sửa trong source và được DB/HTTP test mới xác minh; deployment hiện hữu chưa cập nhật.
- Gateway source đã có HTTP routing thật, bảy miền và multipart/auth/query được kiểm tra trong container tạm; không còn là skeleton như CONTEXT cũ mô tả.
- Google classpath và `ApiResponse.accepted` đã đúng trong Cake AI reactor/current Docker artifact. Standalone stale artifact được tách riêng.
- Chat cùng phiên đã giữ logical ID/payload khi uncertain, clear khi account đổi; Backend replay chống duplicate đạt. Đây chưa phải sửa recovery qua process restart.

Không tuyên bố URL tệp, RFQ provider hoặc durable pending đã được sửa chỉ vì một nhánh test có2xx.

## 12. Những lỗi còn tồn tại

Deployment Chat hiện hữu vẫn dùng query cũ và trả403/42P18; Gateway gốc chưa triển khai bản router mới. Chat attachment URL vẫn mang DNS Docker; Marketplace upload hợp lệ vẫn503 do provider bị tắt. Module-only Cake AI vẫn lỗi với shared SNAPSHOT trong cache hiện tại. Flutter pending mất khi process khởi động lại dù session còn.

Tác động nghiệp vụ: không đọc được trao đổi, không xem được tệp, không gửi ảnh yêu cầu; trạng thái tin chưa rõ có thể bị người dùng gửi lại bằng logical ID mới và gây trùng nội dung. Idempotency chỉ bảo vệ cùng ID/payload, không tự ngăn mọi thao tác nhập lại nội dung.

## 13. Các vấn đề mới phát hiện

1. **Source/runtime drift đã được chứng minh**, gồm Chat và Gateway; giải thích tại sao tài liệu source và kết quả app thực tế khác nhau.
2. **Root ENV mới chưa effective:** DB password Cake AI khác current consumer, Firebase bị explicit override/mount reset, cặp Cake AI client secret/hash chưa được đăng ký/mapping. Không phải lỗi authentication cloud đã kiểm chứng.
3. **Current module-only compile tái hiện stale shared artifact**, thay vì một Java method thực sự thiếu ở current source.
4. **Gateway có router nhưng chưa phải storage proxy hoặc drop-in origin cho Flutter builder hiện tại.** Đây là khoảng cách contract/config cần được tính trong task tích hợp sau.
5. **Restore session độc lập restore pending** được chứng minh bằng PID restart, không chỉ suy từ Map trong source.

Không đưa các lỗi Order/payment hay audit bảo mật ngoài sáu vấn đề vào phạm vi này.

## 14. Phân tích nguyên nhân gốc

| Nhóm | Kết luận có bằng chứng | Điều không được suy ra |
|---|---|---|
| SQL/Java | artifact Chat cũ có optional-null query; source mới tách hai nhánh chạy được | DB password mới sẽ chữa42P18 |
| Maven | installed SNAPSHOT thiếu factory, reactor shared có factory | runtime Google key quyết định compile |
| Docker/deploy | image cũ và profile/override/upstream mapping khác source | container có tên gateway thì có router |
| ENV/storage | Marketplace intentionally disabled; Chat có credential hoạt động nhưng ký hostname nội bộ | mọi503 đều credential sai; upload200 thì tải được |
| External service | service account có cấu trúc nhưng quyền/sandbox chưa kiểm | file có private key thì được phép dùng production |
| Flutter | RAM pending khác secure session store, identity scope có clear | history sửa xong thì journal tự persist |

Liên hệ có thật: ISSUE-01 chặn một phần reconciliation của06; ISSUE-02 không được giải quyết bởi API routing05; ISSUE-03 dùng Firebase còn02 dùng MinIO, không có chung nguyên nhân chỉ vì đều là storage. ISSUE-04 là classpath/build, không phải bằng chứng provider Cake AI hoặc RFQ cloud sẵn sàng.

## 15. Các vấn đề có thể giải quyết bằng cấu hình

| Issue | Phân loại theo yêu cầu | Vai trò `.env`/private files |
|---|---|---|
| 01 | RUNTIME_IMAGE_OR_BUILD_ONLY | dùng artifact source đã sửa; không cần secret mới cho query |
| 02 | CONFIG_PLUS_SOURCE_CHANGE_REQUIRED đối với phương án tách endpoint được đề xuất | credential đã dùng được; cần public addressing và implementation binding; unified DNS/proxy có thể là phương án cấu hình riêng nếu được chứng minh |
| 03 | CONFIG_ONLY_FIX_PLAUSIBLE_AND_SOURCE_SUPPORTED | root có material liên quan, nhưng cần phê duyệt sandbox/IAM, đúng injection/mount và recreate consumer sau này; chưa chứng minh live |
| 04 | RUNTIME_IMAGE_OR_BUILD_ONLY | build reactor/chuẩn bị shared artifact; `.env` không thay phương thức trong JAR |
| 05 | RUNTIME_IMAGE_OR_BUILD_ONLY | source có router, cần image hiện tại + profile/upstream URL đúng tên property |
| 06 | MOBILE_AND_BACKEND_RECONCILIATION_REQUIRED | source Mobile journal + triển khai history đúng version + dùng idempotency hiện hữu; không có ENV-only fix |

Không sửa ENV trong audit. Áp giá trị mới sau này phải phân biệt recreate consumer với đổi credential DB đã khởi tạo. Không ghi đè password volume bằng cách sửa POSTGRES_PASSWORD rồi kỳ vọng user trong DB tự đổi. Không dùng CAKE_AI_CLIENT_SECRET thay vì SERVICE_CLIENT_SECRET nếu chưa có mapping và Identity registration/grant tương ứng.

## 16. Các vấn đề bắt buộc sửa source code

Phương án02 tách endpoint/signing: `backend/chat-service/src/main/java/com/se193262/chatservice/config/StorageProperties.java`, `infrastructure/storage/MinioAttachmentStorage.java`, `src/main/resources/application.yml`, cùng Compose/runtime mapping trong task triển khai sau. Download proxy là phương án thay thế cần controller/auth contract được thiết kế, chưa có trong source.

Issue06: `mobile/lib/features/chat/data/live_chat_repository.dart`, `presentation/live_chat_page.dart`, `mobile/lib/core/live/live_workspace.dart` và một journal/store được thiết kế riêng. Attachment byte/file lifecycle cần tính thêm; không chỉ persist một ID. Không biến SecureSessionStore hiện tại thành dump toàn bộ object tùy ý.

Không cần thêm dependency Google hoặc thêm accepted vào shared hiện đã có. Không cần viết lại Gateway routing. Error mapping Chat ở `exception/GlobalExceptionHandler.java` và `config/SecurityConfig.java` cần regression cụ thể nếu được giao task hardening; không mở toàn bộ API hoặc bỏ authorization để che lỗi.

## 17. Phương án khắc phục tối ưu

Ưu tiên artifact/workflow đã được chứng minh trước, chỉ thay source ở chỗ còn thiếu implementation. Deploy Chat source mới với hồi quy cursor; chuẩn hóa Maven reactor; chuẩn bị Gateway image và existing upstream properties. Song song thiết kế journal pending và public storage addressing. Firebase chỉ bật với sandbox, permission và phê duyệt sử dụng rõ ràng.

Đối với06, state machine nên phân biệt chưa truyền, đang gửi, chưa rõ kết quả, đã ACK/reconciled và lỗi chắc chắn; lưu queue trước send. Retry hữu hạn cùng clientMessageId/payload; không auto resend dưới account khác. Backend uniqueness/fingerprint vẫn là authority; UI không tự đánh dấu thành công khi chưa đọc lại hoặc nhận ACK thật.

## 18. Thứ tự ưu tiên triển khai

| Thứ tự | Công việc | Phức tạp | Phụ thuộc |
|---|---|---|---|
| 1 | Đưa Chat current artifact vào deployment có kiểm soát; xác minh lỗi server không bị hiểu thành mất quyền | LOW–MEDIUM | quy trình build/deploy riêng, không cần đổi DB password |
| 2 | Journal/recovery pending scoped theo account và attachment lifecycle | MEDIUM | history/current API ổn định; Backend idempotency hiện hữu |
| 3 | Public attachment endpoint/proxy và signature đúng Host | MEDIUM | DNS/network/URL contract; không rewrite link đã ký |
| 4 | Bật RFQ sandbox storage được cấp phép | LOW–MEDIUM | xác minh credential/IAM/bucket/mount; chưa được cấp phép ở audit |
| 5 | Đưa Gateway current artifact + đúng upstream/profile vào deployment | LOW–MEDIUM | kiểm route/auth/body; kế hoạch client service-prefix |
| Liên tục | Chuẩn hóa reactor và shared artifact provenance | LOW | CI/cache/workflow, không phải secret |

## 19. Kế hoạch kiểm thử sau khi sửa

- 01: same user detail/history, trang đầu/cursor/empty/timestamp trùng, invalid cursor400, outsider404, anonymous401; kiểm SQLState và500/503 khi dependency lỗi. Test đúng image sẽ chạy, không chỉ source test.
- 02: upload JPEG/PNG/PDF thật, tải URL nguyên gốc ở Docker/host/Android, MIME/byte checksum, expiry, unsigned/private access, refresh link, reverse-proxy Host và signed headers. Không forward Identity JWT sang storage.
- 03: sandbox upload owner/DRAFT, unsupported/oversize/state/ownership, retrieve/delete object và metadata, retry/cleanup; xác minh mount bên trong consumer và chứng cứ cloud đúng project được phép.
- 04: fresh cache reactor package, nested shared signature/classpath, module-only với shared artifact đúng; không dùng một target cũ còn classes để che compile. Google runtime/AI generation kiểm riêng khi được cấp quyền.
- 05: bảy service prefix, query/body/status/auth/header, upload/multipart, Swagger, internal-negative, timeout; kiểm actual Compose profile/image và cổng bên ngoài. Test storage URL riêng.
- 06: lặp A–F; nhiều pending/account/conversation, attachment cache, kill giữa persist/send/ACK, history vượt30 tin, same ID replay200/changed payload409, token refresh/logout, restart offline, retry hữu hạn. Khôi phục queue khác với chỉ restore auth session.

## 20. Kết quả kiểm tra Docker và Android Emulator

Stack test độc lập tạo từ JAR current source, không sửa image/deployment gốc: PostgreSQL17 tmpfs, MinIO tmpfs, Chat tại18207 và Gateway tại18200. Chỉ test data vào Chat DB/storage dùng một lần; dependency Identity/Marketplace/Bakery là local deployment đã có, dùng synthetic account và RFQ/context thật được API cấp quyền. Login/logout có side effect session tiêu chuẩn; không SQL UPDATE/DDL vào database hiện hữu, không dựng quyền hoặc entity thành công bằng SQL. RFQ failed upload đã kiểm trước/sau không đổi.

28 HTTP check chính đạt kỳ vọng, trong đó kỳ vọng503/403 là negative/blocked behavior, **không biến chúng thành tính năng hoạt động**. Sáu RFQ checks tách riêng. Các kiểm tra source/runtime cũ, byte/type/auth và body/query bổ sung có evidence riêng. Không dùng tổng số PASS để chứng nhận full-stack.

MinIO test ban đầu không ghi được root-owned tmpfs dưới user non-root; chỉ fixture tạm được tạo lại với owner999:999/mode0700 đúng image user, không chỉnh storage gốc. Android harness ban đầu có lỗi binding order; sửa riêng test entry ngoài repo, giữ log lỗi, không tính exit0 khi chưa có assertion. Điều hướng đầu tiên vào list được hoàn tất bằng tap card thật; driver sau đó dùng `/chat-detail` đúng router. Không sửa ứng dụng để làm test pass.

Ảnh thật, không chỉnh pixel:

- [Pending uncertain trước restart](../../.diagnostics/six-issues-20261108T090801Z/screenshots/android-uncertain-before-restart.png).
- [History sau restart](../../.diagnostics/six-issues-20261108T090801Z/screenshots/android-history-after-process-restart.png); trace/widget assertion xác minh nội dung B tồn tại.
- [Account khác không có pending](../../.diagnostics/six-issues-20261108T090801Z/screenshots/android-account-switch-no-pending-leak.png).
- [Tệp nội bộ chưa dùng được trên Android](../../.diagnostics/six-issues-20261108T090801Z/screenshots/android-attachment-warning-visible.png).
- [Tin B đã persist, hiển thị sau restart](../../.diagnostics/six-issues-20261108T090801Z/screenshots/android-persisted-message-visible-after-restart.png).

Read-only capture sau cùng chỉ mở lại message đã có, không gửi lại các mutation thành công. Test package tách biệt, không clear dữ liệu app chính, không kill emulator. Đã kiểm trực quan hai ảnh capture cuối; [screenshot index](../../.diagnostics/six-issues-20261108T090801Z/screenshot-index.json) ghi kích thước, timestamp và checksum của bảy PNG. Năm container do audit tạo, gồm fixture storage đầu tiên thất bại, được dừng/gỡ riêng sau khi xác minh tên, label, thời điểm tạo và không gắn volume hiện hữu. Test app riêng đã force-stop; network test rỗng được giữ lại. Không stop/remove/reset container hoặc volume đã có trước audit. [Disposable manifest](../../.diagnostics/six-issues-20261108T090801Z/disposable-runtime-manifest.json), [cleanup](../../.diagnostics/six-issues-20261108T090801Z/cleanup.json).

## 21. Giới hạn kiểm chứng

Không xác minh quyền live Firebase/GCS, cloud upload/sign/delete, AI provider hoặc chi phí vì chưa có sandbox/ủy quyền sử dụng được xác nhận. Format/presence không thay cho kiểm thử quyền.

Không deploy Chat/Gateway mới vào stack gốc; kết quả isolated chứng minh source hiện tại nhưng không làm source drift tự biến mất. Không có fixture empty phù hợp trong old deployed Chat để xác minh riêng nhánh này ở bản cũ; nhánh empty source mới đã đạt. Chưa đợi presigned URL expiry thực, chưa kiểm Production DNS/TLS, iOS, thiết bị vật lý hoặc hiệu năng release.

Fault injection là wrapper transport ở harness ngoài repo, chỉ cố ý chặn response sau201 thật và giữ history unavailable trong cửa sổ test; không phải packet loss tự nhiên hay mock success. Production Dart byte-identical, nhưng APK test có package/test entry riêng; ảnh không phải screenshot của app chính được thay bằng phiên giả. Session restore được chứng minh thực tế sau PID restart, không đọc token plaintext từ app data.

Không khảo sát toàn `H:\MSS` hoặc dữ liệu ngoài Bakery Platform có liên quan rõ ràng. Các tài liệu thiếu/CONTEXT cũ đã ghi rõ; không dựa vào chúng để kết luận hiện trạng.

## 22. Xác nhận không thay đổi source code

Đối chiếu baseline toàn bộ tệp được bảo vệ, bao gồm các thay đổi Mobile có sẵn, bằng SHA-256/kích thước/mtime: **4.243/4.243 tệp cũ và 7/7 tệp private không thay đổi**; tổng cuối là4.244 tệp với duy nhất báo cáo này được thêm. Đầu và cuối giữ nguyên commit/branch, không staged diff mới; Git status cũ được bảo toàn. Mười lăm container có trước audit giữ nguyên image ID, created time, trạng thái, mount, network và host-port binding; thứ tự mount không mang ý nghĩa thay đổi cấu hình. Không làm sạch hoặc ghi đè uncommitted work trước đó.

Root `.env`, các secret files liên quan và các Compose/migrations/source được giữ nguyên. Không tạo/rotate secret hoặc private key; không in password/token/credential JSON/signed query, không lưu secret vào báo cáo/source/argv. So sánh private values chỉ tạo trạng thái MATCH/MISMATCH. Scan báo cáo, log/JSON/harness mới và các entry trong APK kiểm tra cho credential đã biết, private-key body, JWT và signed query; không coi đường dẫn tệp private là nội dung secret. Bản sao source và binary lịch sử không phải output mới được rà sửa; phạm vi scan được ghi rõ trong final integrity. VM debug endpoints được che trong log. Runtime test containers có ENV private được dọn sau thử như đã nêu; không đưa image label hoặc cấu hình secret vào báo cáo.

[Final integrity](../../.diagnostics/six-issues-20261108T090801Z/final-integrity.json) ghi số tệp, thay đổi ngoài whitelist, trạng thái secret, Git và kiểm tra exposure. Không tuyên bố working tree sạch vì baseline vốn có thay đổi của công việc trước. Không commit, stage, push, merge, rebase hoặc deploy bản sửa; không xóa/reset persistent volume hoặc database hiện hữu.

## 23. Kết luận

ISSUE-01 và05 đã sửa trong source và được chạy kiểm chứng trong môi trường tạm nhưng chưa đồng bộ vào deployment gốc. ISSUE-04 reactor/current Docker đã đạt; standalone stale shared cache vẫn tái hiện. ISSUE-02,03 và06 còn tồn tại trong phạm vi đã kiểm tra. `.env` mới giúp xác định provenance/mismatch và khả năng cấu hình RFQ sau này, nhưng hiện không tự sửa SQL, classpath, public URL, routing deployment hoặc journal Flutter.

Đã hoàn thành cả sáu cuộc điều tra và đưa phương án/độ ưu tiên/điều kiện kiểm chứng tiếp theo. Không triển khai fix để làm mất dấu lỗi hoặc vượt hạn chế chỉ đọc.
