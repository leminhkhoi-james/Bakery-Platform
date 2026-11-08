# Cake AI — build, Docker, API và tích hợp Flutter thực tế

Đợt `20261108T080611Z`, ngày 08/11/2026. Repository `H:\MSS\Bakery-Platform`, nhánh `dev`, commit `35536f664ffe7db889a623aabc3ff6cfd5bbb75c`. Chỉ sửa `mobile/`. Backend, Frontend, cấu hình gốc và secret hiện hữu được giữ nguyên.

## 1. Tổng quan và mức hoàn thành

**PARTIAL_BLOCKED**. Cake AI hiện tại **build thành công**, chạy Docker, kết nối PostgreSQL, xử lý job thật và được Flutter Android sử dụng. Ảnh trong lần chạy này là **fallback Java2D tại Backend**, không phải kết quả Gemini. Đã xác minh create → xử lý → thiết kế → chọn vào RFQ, revision, cancel, từ chối nội dung và Admin xem kết quả.

| Giai đoạn | Kết quả | Giới hạn quyết định |
|---|---|---|
| 1. Maven/shared library/package | PASS — BUILD_ALREADY_SUCCESSFUL | Không cần sửa POM/Java; reactor dùng shared library hiện tại |
| 2. Docker/DB/readiness | RUNNING_WITH_LIMITATIONS | Ảnh fallback chỉ ở RAM; chưa kiểm chứng GCS |
| 3. API và quyền | PARTIAL_BLOCKED | 39/40 kiểm tra sau đối chiếu kỳ vọng đạt; phát hiện nhận RFQ của Customer khác |
| 4. Nguồn ảnh | LOCAL_FALLBACK_VERIFIED; REAL_PROVIDER_BLOCKED | Không có API key và môi trường provider/sandbox được phê duyệt |
| 5. Flutter/Android/README | VERIFIED_WITH_LIMITATIONS | Luồng cục bộ đạt; chưa có thiết kế PENDING thật để Admin duyệt/từ chối thành công |

Không công bố FULL_PASS, không gọi ảnh fallback là AI thật, không tạo video full-success. Prompt hiện tại không yêu cầu video; bằng chứng gồm screenshot và trace thật. Các báo cáo đợt trước được giữ nguyên như lịch sử.

## 2. Baseline và phạm vi bảo vệ

Đã đọc trọn 1.343 dòng prompt đính kèm trước triển khai. Baseline Git ban đầu sạch, không có staged diff. Bản ghi [baseline](evidence/20261108T080611Z/baseline.json) bao gồm SHA-256, kích thước và mtime của **3.200 tệp ngoài `mobile/`**, 924 tệp Mobile ban đầu và 7 tệp secret ngoài Git.

Bản sao build nằm tại `H:\MSS\.runtime\cake-ai-execution-20261108T080611Z\backend`. Sao chép parent/module POM và source của `platform-support`, `cake-ai-service`; các POM module khác chỉ giữ cấu trúc reactor. Không sao chép `.env`, dump DB, secret hoặc build cache vào cây source này. Manifest source nằm ngoài repository. Không chạy Maven build trong `backend/` gốc.

Các tài liệu root, API/workflow/runtime audit và contract Flutter được đối chiếu; [bản ghi tham chiếu](evidence/20261108T080611Z/historical-reference-review.json) chỉ lưu trích đoạn liên quan. CONTEXT của Cake AI còn mô tả skeleton cũ; controller/source và compiler hiện tại được ưu tiên khi chúng khác nhau.

## 3. Maven reactor và shared library

Parent dùng Spring Boot **4.1.1**, Java **21**, project version `0.0.1-SNAPSHOT`; Spring Cloud BOM **2025.1.3**. Cake AI tham gia reactor, phụ thuộc `com.se193262:platform-support:${project.version}` scope compile. `-pl cake-ai-service -am` chọn parent → platform-support → cake-ai-service. Không install hoặc thay thế JAR trong local Maven repository.

JAR `platform-support` đang cài trong `.m2` **không có `accepted(...)`**; JAR do reactor hiện tại tạo có phương thức này. Nested shared JAR trong executable JAR có checksum trùng với artifact reactor. [So sánh local artifact](evidence/20261108T080611Z/local-artifact-comparison.json), [provenance artifact](evidence/20261108T080611Z/artifact-provenance.json).

Điều này chứng minh nguy cơ dùng artifact cũ khi build module lẻ. Chưa có đủ bằng chứng về chính xác lệnh/classpath của mọi lần lỗi lịch sử để kết luận đó là nguyên nhân duy nhất trước đây.

## 4. Build hiện tại và package thực thi

Chạy trong bản sao ngoài repository:

```powershell
mvn -B -ntp -pl cake-ai-service -am dependency:tree "-Dincludes=com.google.cloud:*,com.google.auth:*,com.se193262:platform-support"
mvn -B -ntp -pl cake-ai-service -am -DskipTests package
mvn -B -ntp -pl cake-ai-service -am -Dtest=FirebaseStorageAdapterTest,GenerationParametersTest,GeminiClientTest -Dsurefire.failIfNoSpecifiedTests=false test
mvn -B -ntp -pl cake-ai-service -am test
```

Cả bốn lệnh exit 0. Package mất khoảng 28,79 giây; toàn bộ reactor test khoảng 70,62 giây. Có **29 test Cake AI + 3 test platform-support**, không failure/error/skip. 12 test tập trung là tập con, không cộng lại thành số test độc lập.

Artifact `cake-ai-service-0.0.1-SNAPSHOT-exec.jar` có Spring Boot launcher, classes và nested dependencies. SHA-256 executable JAR **`0e8a49c457adfdf6b9f3f527c255a19c19f994d3001e8ebd2705c84bfc963539`** trùng với `/app/application.jar` trong container. [Package](evidence/20261108T080611Z/package-result.json), [reactor test](evidence/20261108T080611Z/reactor-tests-result.json), [Docker manifest](evidence/20261108T080611Z/docker-runtime-manifest.json).

Môi trường build: Maven 3.9.11, Oracle JDK 21.0.8; runtime container Temurin 21.0.13. Flutter 3.47.1, Dart 3.13.1, Docker daemon 29.6.1, Compose 5.3.0. [Phiên bản công cụ](evidence/20261108T080611Z/tool-versions.json). Đây là phiên bản thực trên máy kiểm tra, không phải khuyến nghị nâng cấp dependency.

## 5. ApiResponse.accepted và lỗi Google đã báo trước đây

`backend/platform-support/src/main/java/com/se193262/platform/dto/ApiResponse.java` định nghĩa record envelope `statusCode/message/data/timestamp`. Factory public static generic có `success(T)` 200, `created(T)` 201, **`accepted(T)` 202**, `error(int,String)`. Không có vấn đề overload hoặc generic inference trong build hiện tại.

`GenerationController` import đúng `com.se193262.platform.dto.ApiResponse`; helper tại dòng 51–52 dùng `ResponseEntity.accepted().body(ApiResponse.accepted(response))`. Create/revision trả HTTP **202**, envelope cũng có statusCode 202; không thay bằng 200/201. Compiler và `javap` trên nested JAR đều xác minh phương thức có thật.

Google Cloud Storage 2.43.0 được pin trực tiếp trong Cake AI POM; Google Authentication được cung cấp transitively ở 1.25.0. [Classpath đóng gói](evidence/20261108T080611Z/packaged-class-resolution.json) tìm thấy mỗi lớp liên quan đúng một lần:

| Import/lớp | Artifact thực tế | Kết quả |
|---|---|---|
| `Storage`, `StorageOptions`, `BlobInfo`, `Blob`, `StorageException` | google-cloud-storage 2.43.0 | PRESENT |
| `GoogleCredentials` | google-auth-library-oauth2-http 1.25.0 | PRESENT |
| `HttpTransportOptions` | google-cloud-core-http 2.43.0 | PRESENT |
| `ApiResponse` | platform-support 0.0.1-SNAPSHOT từ reactor | PRESENT, có accepted |

**Không còn build blocker Google/accepted được tái hiện. CASE: BUILD_ALREADY_SUCCESSFUL.** Không cần sửa POM-only, thêm auth dependency hoặc sửa shared factory để giải quyết một lỗi compile hiện không tồn tại. Credential Google chỉ liên quan runtime, không quyết định import có compile hay không.

| Issue | Source location | Verified cause/condition | Maven-related | Java source-related | Proposed solution | Confidence |
|---|---|---|---|---|---|---|
| Google Storage resolution | `backend/cake-ai-service/pom.xml:80` | 2.43.0 resolve/compile/package thành công | có, đã đúng | không có lỗi hiện tại | không thêm dependency | CONFIRMED_BY_COMPILER |
| Google Authentication resolution | `FirebaseStorageAdapter.java:3` | GoogleCredentials có transitively ở oauth2-http1.25.0 | có, đã resolve | import đúng | không thêm direct dependency khi chưa có nhu cầu khác | CONFIRMED_BY_COMPILER |
| platform-support resolution | `backend/cake-ai-service/pom.xml:77` | reactor JAR hiện tại đúng; local installed JAR cũ khác | có | source hiện tại hợp lệ | build `-am`, kiểm checksum nested JAR | CONFIRMED_BY_COMPILER |
| accepted factory/call | `backend/platform-support/src/main/java/com/se193262/platform/dto/ApiResponse.java:14`, `GenerationController.java:52` | factory có thật, đúng generic và HTTP202 | stale artifact có thể ảnh hưởng module-only build | không có lỗi hiện tại | không sửa phương thức hiện tại | CONFIRMED_BY_COMPILER |
| Compilation blocker khác | toàn bộ source Cake AI trong reactor copy | không tái hiện; package và29 test Cake AI đạt | không lỗi đã xác minh | không lỗi đã xác minh | không triển khai fix giả định | CONFIRMED_BY_COMPILER |

File rút gọn trong bảng thuộc `backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/`. Không coi các runtime blocker ở phần22 là compiler error.

## 6. Cấu hình môi trường, Docker và kết quả khởi chạy thực tế

Đã đọc Compose gốc, service overlay, local-runtime overlay, Dockerfile và application.yml. Các cấu hình hiện hữu không đồng nhất cổng 8085/8080; runtime mới bên ngoài repository dùng một contract rõ ràng. Giữ nguyên các Compose/Dockerfile gốc. Runtime Dockerfile bên ngoài tái sử dụng final-stage Java 21, user `app:app`, COPY đúng executable JAR đã xác minh, không dùng image/JAR Cake AI cũ.

| Thành phần | Tên/container | Nội bộ | Host | Readiness/chức năng |
|---|---|---|---|---|
| Cake AI | `bakery-cake-ai-20261108t080611z-cake-ai-service-1` | 8080 | `http://127.0.0.1:18105` | health/readiness/liveness 200 UP; business API thật |
| PostgreSQL | `bakery-cake-ai-20261108t080611z-cake-ai-db-1` | 5432 | không expose | pg_isready, Flyway, job/design persist |
| Identity hiện hữu | `bakery-mobile-20261107-mobile-identity-1` | 8080 | 18101 | login/JWKS thật; service client Cake AI thiếu |
| Marketplace hiện hữu | `bakery-mobile-phase5-marketplace` | 8080 | 18103 | RFQ/select-design thật |
| Android | `emulator-5554`, AVD homemind_local_run | loopback qua ADB | 9 reverse ports | UI gọi NativeTransport thật |

Compose project `bakery-cake-ai-20261108t080611z`; network riêng `bakery-cake-ai-20261108t080611z_default`, kết nối thêm network hiện hữu `bakery-mobile-20261107_runtime`. DB chỉ nằm network riêng. Cake AI alias `cake-ai-service` trên network Mobile, đúng URL `http://cake-ai-service:8080` Marketplace đã cấu hình sẵn. Không thay cấu hình Marketplace. Volume mới `bakery-cake-ai-20261108t080611z_cake-ai-data`; không đụng volume DB cũ.

Lệnh từ `mobile/`:

```powershell
python -B tool/cake_ai_runtime.py prepare
python -B tool/cake_ai_runtime.py up
python -B tool/cake_ai_runtime.py status
# Chỉ khi thực sự cần; ảnh fallback sẽ mất:
python -B tool/cake_ai_runtime.py restart
```

`prepare` kiểm tra checksum artifact rồi chuẩn bị runtime bên ngoài. `up` dùng `docker compose -p bakery-cake-ai-20261108t080611z -f <runtime>/compose.cake-ai.yaml --env-file <runtime>/cake-runtime.env up -d --build`. Không down/prune/reset. Restart Cake AI đã diễn tập, DB và metadata còn nguyên. Restart/reboot toàn host chưa kiểm chứng; `restart: unless-stopped` là cấu hình, không thay cho bằng chứng reboot.

Ma trận đầy đủ tên biến/mục đích/nguồn/trạng thái ở [ENVIRONMENT_RUNTIME_MATRIX_VI.md](ENVIRONMENT_RUNTIME_MATRIX_VI.md). Không có secret mới được sinh. DB credential hiện hữu được đưa đúng consumer qua tệp runtime ngoài Git với ACL không kế thừa, hai access rules. Không mount/copy service account Firebase vào container; không ghi secret vào Dockerfile, build-arg, Dart define, báo cáo hoặc source.

## 7. PostgreSQL và migration

Không có Cake AI container/volume hiện hữu khi bắt đầu. Dùng image PostgreSQL 17-alpine đã có trên máy, database `cake_ai_db`, hostname `cake-ai-db`, credential DB hiện hữu từ external secret file. Không thay password của DB đã khởi tạo.

Flyway **V1/V2 đều success** trên volume mới. JPA schema validation hoàn tất; API persist job/source/revision/execution/design/idempotency thật. SQL dùng để chẩn đoán chỉ đọc metadata/schema; mọi RFQ/job/revision/cancel/moderation test đều qua API/UI, không seed/chỉnh trạng thái bằng SQL.

[Restart persistence](evidence/20261108T080611Z/restart-persistence.json): job detail sau restart HTTP200, status SUCCEEDED, ba design metadata còn; byte ảnh cũ trả 404. Điều này phân biệt rõ persistence DB với persistence storage.

## 8. Firebase/Google Cloud Storage

Có tệp service account bên ngoài Git, cấu trúc service_account/private_key/project hợp lệ ở mức kiểm tra cấu trúc. Chưa xác minh đây là sandbox được phê duyệt, IAM/bucket/network hoặc quyền upload/sign/read/delete cloud; không gọi thử cloud để tạo bằng chứng giả hoặc gây ghi ngoài local.

`FirebaseStorageAdapter` khi bucket/project trống dùng `ConcurrentHashMap` trong RAM. Runtime tường minh chọn nhánh này; không âm thầm gọi nó là GCS. Upload/read/image/thumbnail thật đều được kiểm tra trong cùng vòng đời process. [Media verification](evidence/20261108T080611Z/media-verification.json) ghi status, byte length, magic và checksum.

Các giới hạn source đã xác minh:

- Local fallback mất ảnh/source byte sau restart; volume PostgreSQL không giải quyết được RAM storage.
- Local URL `/storage/...` là public route, không phải signed URL có xác thực/hết hạn, dù DTO có `expiresAt` khoảng 15 phút và tên factory `signedUrl`.
- `PublicStorageController` suy MIME theo hậu tố `.png`; key design không có hậu tố nên có trường hợp header image/jpeg trong khi byte PNG. Android vẫn decode được; không sửa Backend.
- Nhánh upload GCS bắt lỗi và giữ cache local; chỉ thấy ảnh trong RAM/HTTP200 không đủ chứng minh cloud upload thành công.

## 9. Provider và cấu hình mô hình

Không tìm thấy API key Gemini/Cake AI trong các nguồn env được kiểm tra. Container `CAKE_AI_API_KEY` trống. `GeminiClient.generate()` đi thẳng vào `generateDynamicCake()` khi key trống; Java2D vẽ bánh dựa trên từ khóa prompt. `moderate()` ở nhánh này dùng từ khóa cục bộ, không phải moderation của provider.

Nhánh có key gửi POST `<providerUrl>/interactions`, header x-goog-api-key, `store=false`, yêu cầu status completed và đọc `steps/model_output/content`. Source có xử lý refusal, rate-limit, timeout, invalid/no image; unit test kiểm tra bằng test double. Mặc định `imageModel`/`moderationModel` là gemini-2.0-flash; nhãn model được lưu trong job **không chứng minh model đó đã xử lý ảnh**.

Đã đối chiếu tài liệu chính thức [Interactions API](https://ai.google.dev/api/interactions-api?hl=en) và [image generation](https://ai.google.dev/gemini-api/docs/image-generation?hl=en). Cần xác minh model, quota và contract trên chính project được cấp quyền trước khi bật provider. Không kết luận API hiện tại sai chỉ từ tên nhánh Gemini; chưa có live provider request để xác nhận hoặc bác bỏ đầy đủ tính tương thích.

## 10. Phân biệt provider thật với fallback

[Provider-mode evidence](evidence/20261108T080611Z/provider-mode.json): API key không có, Firebase project/bucket không bật, không mount ADC; source branch và artifact runtime đã đối chiếu. Số request provider có phí do agent thực hiện: **0**.

Job SUCCEEDED, ảnh có checksum, image URL HTTP200, tên model trong DB hoặc UI “đã duyệt” đều không được dùng riêng lẻ làm bằng chứng Gemini. Ảnh screenshot xuất phát từ byte Backend Java2D thật; không dùng image generation tool, mock response, ảnh ghép hoặc ảnh mẫu làm kết quả AI. Ảnh tham khảo là fixture kiểm soát hiện hữu, chọn qua native picker, không phải kết quả provider.

Muốn kiểm tra provider thật cần `CAKE_AI_API_KEY` hợp lệ, model được hỗ trợ và quyền dùng sandbox/cost rõ ràng. Không thể tự sinh credential của nhà cung cấp. Muốn lưu cloud cần project/bucket/ADC/IAM được xác minh riêng. Hai giới hạn này độc lập với build/readiness.

## 11. Inventory API đầy đủ và mapping Flutter

Đối chiếu toàn bộ controller Cake AI: **7 operation public cho người dùng, 2 internal service operation, 1 storage route**. [Inventory source](evidence/20261108T080611Z/api-inventory.json), [ma trận API](API_VERIFICATION_MATRIX_VI.md).

| Operation | Flutter hiện hữu | Hành vi chính |
|---|---|---|
| POST generation-jobs | `LiveAiRepository.create` + form | multipart metadata/sourceImages, logical key, HTTP202 |
| GET generation-jobs | `list` + danh sách/filter | page Backend từ 0, UI từ 1; dữ liệu của chính Customer |
| GET generation-jobs/{id} | `detail` + job page | job/revisions/sources/designs; Customer sở hữu hoặc Admin |
| POST .../prompt-revisions | `revise` + chỉnh ý tưởng | JSON, key ổn định, chỉ SUCCEEDED/FAILED |
| POST .../cancel | `cancel` + xác nhận | chỉ QUEUED/PROCESSING |
| GET generated-designs/{id} | `design` + design page | ảnh APPROVED; chưa duyệt không hiển thị ảnh |
| PATCH admin/.../moderation | `moderate` + nút Admin PENDING | APPROVED hoặc REJECTED; không có global queue |

Hai internal GET dùng service token có scope `cake-ai:design:validate`; chỉ host kiểm tra bằng token hợp lệ của Marketplace. Flutter không có internal credential hoặc internal URL. `/storage/**` được image widget đọc từ URL Backend, không đính Identity token. Selected-design là PUT thật của Marketplace, không bịa endpoint Cake AI mới.

## 12. Kết quả API theo trường hợp

[Raw results](evidence/20261108T080611Z/host-api-results.json) giữ nguyên 40 kiểm tra; [đối chiếu kỳ vọng](evidence/20261108T080611Z/host-expectation-adjudication.json) và [kết quả cuối](evidence/20261108T080611Z/api-final-results.json) tách lỗi test harness khỏi lỗi sản phẩm.

Bốn kỳ vọng ban đầu 400 được sửa thành 422 vì `BusinessException.invalid` dùng 422. Một kỳ vọng Admin list phải 403 được sửa vì tài khoản Admin thật đồng thời có CUSTOMER; endpoint chỉ list theo chính customerId, không phải list toàn cục. Không rerun các request đã có bằng chứng hợp lệ để làm xanh log. Tổng sau đối chiếu **39 PASS, 1 FAIL có thật**.

Đã kiểm tra create 202, list/filter/detail 200, missing key/blank prompt 400, invalid ratio/source/page/status 422, replay cùng key 202, payload khác cùng key 409, anonymous 401, Customer khác đọc/sửa/hủy job hoặc đọc design 403, Customer moderate 403, Admin detail 200, terminal cancel 409, re-moderate APPROVED 409, moderation enum sai 400. Internal GET 200 với service token hợp lệ; human gọi internal 403. Selected-design PUT và đọc lại RFQ 200, ID khớp.

**FAIL quan trọng:** Customer A gửi job bằng RFQ DRAFT thật của Customer B vẫn nhận 202. Đã hủy job ngoài dự kiến qua API. Không giả RFQ/UUID/quyền để tạo kết quả này. Nguồn: `MarketplaceClient.validate()` bắt BusinessException status >=500 và cho qua; service client Cake AI chưa đăng ký/không có secret trong Identity runtime. `ServiceHttpClient` quy lỗi lấy token thành unavailable. Hành vi này chưa bị ràng buộc bởi Spring dev profile.

## 13. Hành trình job thực tế

Host: RFQ DRAFT của Customer → multipart có ảnh tham khảo → QUEUED → xử lý worker → SUCCEEDED → design APPROVED → image/thumbnail HTTP200 → chọn vào RFQ → đọc lại cùng selectedDesignId. Cùng key create/revision không được coi là ý định mới; API giữ response replay. Worker/scheduler chạy source nguyên trạng, poll interval local 5 giây để quan sát trạng thái và hủy.

Trường city/district của RFQ dùng dữ liệu test có nhãn Local Test/Local audit, không được trình bày là địa chỉ giao hàng thật. Không tạo UUID địa chỉ Identity giả, đơn mua bánh hoặc hành động vận chuyển để vượt điều kiện checkout.

Android lặp lại hành trình qua màn hình thật, không dùng host API để thực hiện mutation thay UI. Trace có POST RFQ201, POST job202, GET job200, GET design200, PUT selected-design200 và GET RFQ200. IDs thật ở [Android fixtures](evidence/20261108T080611Z/android-fixtures.json); host chỉ đọc lại sau UI để xác minh, ở [server reconciliation](evidence/20261108T080611Z/android-server-reconciliation.json).

## 14. Revision, cancel và failure

Host revision lần 2 yêu cầu hai thiết kế: job SUCCEEDED, tổng ba design qua hai revision. Android revision lần 2 mặc định một thiết kế: tổng hai design, giữ lịch sử prompt và ảnh đầu đã chọn. Không dùng ảnh cũ làm bằng chứng revision mới.

Android cancel trả HTTP200; đọc lại status CANCELLED, không design. Android/host prompt kiểm soát có từ khóa bị cấm ở nhánh cục bộ tạo FAILED/INPUT_REJECTED, không có design. UI giải thích lỗi và cho người dùng chủ động sửa prompt; không tự retry POST. Thử cancel terminal trả409. Source không cho revision từ CANCELLED; không đổi contract để mở nhánh đó.

Polling Flutter tối đa sáu lần, mỗi năm giây, dừng khi terminal, đổi session, dispose hoặc route không còn hiện; có refresh thủ công. Refresh chỉ GET, không tạo job/revision. Không tuyên bố đã live-test quota429, provider timeout hoặc provider refusal khi chưa có key; đó là coverage unit với test double.

## 15. Thiết kế, ảnh và selected-design

Ảnh result/detail được mở từ job thật, URL và byte được Backend trả. Đã sửa riêng cách fit ảnh Cake AI sang contain, chiều cao thích ứng portrait/landscape, tránh cắt mất phần bánh. `LiveMedia.fit` mặc định cover giữ hành vi các màn hình khác.

UI chỉ cho chọn design APPROVED vào RFQ DRAFT của chính Customer, đọc RFQ mới nhất trước mutation và đọc lại selectedDesignId sau đó. Host và Android đều xác nhận cùng ID đã chọn. Admin mở từ liên kết RFQ thật. Không nhập UUID thủ công, không gọi internal API trong ứng dụng. Sau restart Cake AI, metadata liên kết vẫn có nhưng ảnh RAM có thể 404; UI hiện trạng thái thiếu ảnh, không chèn ảnh demo.

## 16. Admin moderation và giới hạn khám phá

Customer gọi PATCH bị403. Admin đọc job/design thật200. PATCH lên design APPROVED trả409 do repository chỉ update PENDING. Trước đây UI có thể hiện nút từ chối cho APPROVED; nay nút chỉ xuất hiện với PENDING và Admin, trạng thái đã duyệt có giải thích rõ.

**Chưa xác minh thành công Admin APPROVED/REJECTED trên PENDING trong runtime.** Fallback phê duyệt design an toàn, từ chối input trước khi tạo design; không có pending fixture hợp lệ để dùng. Không chỉnh SQL hoặc mock provider nhằm tạo pending giả. Test widget kiểm tra hai action trên PENDING, không trình bày đó là Android E2E. Test Backend GenerationFlowTest có nhánh pending/moderation với mock provider, tách biệt runtime.

Backend chưa có API list/global moderation queue dành Admin. Lối vào hiện hữu chỉ qua RFQ đã liên kết design; không thể khám phá tất cả pending bằng cách tự tạo một endpoint hoặc input UUID. Đây là thiếu contract, không phải nhiệm vụ Flutter có thể hoàn tất độc lập.

## 17. Thay đổi Flutter và giữ chức năng hiện hữu

Tái sử dụng `LiveAiRepository` bảy operation, `LiveWorkspace`, ApiClient/NativeTransport, form, picker, state/retry, router và RFQ handoff đã có. Không viết feature song song, không thay mock cho Backend.

Thêm `CakeAiMode` và public build define `CAKE_AI_MODE`: unknown/local-fallback/provider-configured. Đây là thông tin deployment, không phải chứng thực provider. Unknown luôn nói chưa xác minh; local ghi rõ vẽ cục bộ/lưu tạm; provider-configured không khẳng định kết quả đến từ provider. Gỡ câu “dịch vụ AI thật” không có bằng chứng. Bổ sung lỗi INPUT_REJECTED dễ hiểu, mô tả moderation bằng tiếng Việt và stable keys cho native test.

Launcher thêm URL/mode/readiness/ADB reverse của Cake AI. Lựa chọn `-ReuseRunningServices` kiểm tra thật container/public APIs đã chạy và ghi source drift, không làm suy yếu guard legacy, không rebuild dịch vụ ngoài Cake AI. Chỉ dùng khi có CakeAiUrl và evidence directory riêng. Startup vẫn dừng nếu dependency/readiness thực sự lỗi.

## 18. Thiết kế SweetCake và chất lượng giao diện

Đã đọc/apply `design-taste-frontend`, Impeccable context/harden/craft-floor/polish, Mobile PRODUCT/DESIGN và `design-web.md`. Giữ wine #6B212E, hồng nhạt, Plus Jakarta Sans, wordmark, mascot, Material controls, layout native và style Owner/Admin hiện hữu. Không đổi theme Web, palette, assets hoặc persona.

Screenshot cuối cho thấy ảnh trọn khung, thông báo chế độ cục bộ, action duyệt đúng trạng thái và typography nhất quán. Android portrait 720×1280, landscape 1280×720, font scale1.3 được capture thật; hoàn trả font_scale1.0, auto-rotation1, rotation0. Hai widget regression kiểm tra 320px/text1.8 và Admin state. Không tuyên bố TalkBack, tablet thật, iOS, dark theme hoặc release-performance đã được xác minh.

Impeccable báo metadata PRODUCT cũ và có bản skill mới 4.8.1. Không sửa metadata/skill ngoài nhiệm vụ. Có thể thực hiện `init`/cập nhật skill trong task riêng; đợt này dùng visual world đã được xác nhận.

## 19. Kết quả Android thực tế

[Android results](evidence/20261108T080611Z/android-results.json) có 11 nhóm kiểm tra đạt: login, RFQ201, native picker/multipart202, result, handoff, revision, cancel, failure, Customer khác bị chặn, Admin oversight, public Home regression. Actor roles đọc từ Identity thật: Customer `[CUSTOMER]`, Owner `[BAKERY_OWNER,CUSTOMER]`, Admin `[ADMIN,CUSTOMER]`; không có công tắc role giả.

Driver chạy `BakeryApp` và `NativeTransport` thật, session test trong RAM; credential chỉ đọc ở host từ file private hiện hữu. Named navigation chỉ phục vụ setup test; không bỏ kiểm tra role/API hoặc tạo ghi ẩn. Không sử dụng dữ liệu phiên thật của chủ máy làm fixture. Event sanitization chỉ giữ method/path/status/resource IDs/states/time, không body/header/token/password.

Sau chỉnh framing, chạy follow-up chỉ đọc trên cùng RFQ/job/design, không tạo lại các mutation đã thành công. [Visual results](evidence/20261108T080611Z/android-visual-results.json) và ảnh `final-*` thuộc source UI cuối. Ảnh trước chỉnh được giữ trong `previous-visual-*`; không đánh tráo ảnh trước thành bằng chứng của source sau.

## 20. Test và regression

| Kiểm tra | Kết quả | Ý nghĩa |
|---|---|---|
| Maven dependency tree/package | PASS | compile/classpath và executable artifact hiện tại |
| Reactor tests | 32 PASS | 29 Cake AI + 3 shared; gồm DB Testcontainers/mocks theo từng test |
| Flutter suite hiện hữu | 109 PASS | bao gồm các feature trước, preview và layout; không tương đương live E2E |
| Hai regression widget mới | 2 PASS | mode trung thực, Admin chỉ quyết định PENDING, chữ lớn |
| Nhóm widget affected cuối | 16 PASS | Cake AI/full-integration/Phase5; tập con có overlap |
| Flutter analyze cuối | PASS, no issues | đã sửa năm lint trong driver host; giữ log ban đầu |
| Android lifecycle local | 11 nhóm PASS | actual local Docker; xem từng trace |
| Visual follow-up | PASS phạm vi đã nêu | source UI cuối, ảnh thật, settings được khôi phục |
| README main/cold restart | PASS_WITH_PROVENANCE_LIMITATIONS | app chính có Home thật; không chỉ exit0/splash |

Không cộng các suite overlap thành số test duy nhất. Warning KGP/file_picker và skipped frames ở debug emulator được ghi nhận; không đổi dependency ngoài phạm vi hoặc tuyên bố hiệu năng release đạt.

README đã chạy launcher thật với 9 reverse ports gồm 18105, pub get, build/install **lib/main.dart**, `--no-resident`, quan sát Home. Force-stop/mở lại không clear data: ảnh đầu sau 5 giây còn splash nên không tính ready; ảnh sau xác nhận Home. Không đo thời gian cold startup. [Biên bản](evidence/20261108T080611Z/readme-rehearsal-acceptance.json), [startup flags](evidence/20261108T080611Z/readme-rehearsal/mobile-start.json).

## 21. Chỉ mục bằng chứng

[EVIDENCE_INDEX_VI.md](EVIDENCE_INDEX_VI.md) liên kết screenshot và timestamp/checksum/dimensions; [screenshot-index.json](evidence/20261108T080611Z/screenshot-index.json) là chỉ mục máy đọc. Ảnh do Android framebuffer/Flutter engine trên emulator thật capture, không render lại từ mock hoặc chỉnh pixel.

Ảnh chính: form `01-*`, progress `02-*`, revision `06/07-*`, cancel `08-*`, failure `09-*`, quyền `10/11-*`, Admin `12/13-*`, source UI cuối `final-*`, app chính `readme-main-initial.png` và `readme-main-cold-ready.png`. Ảnh cold-restart đầu chỉ là splash, được giữ như bằng chứng chưa ready.

Log build/test bị Git ignore theo cấu hình sẵn nhưng vẫn lưu trên đĩa; không stage/commit hoặc đổi gitignore. Event, JSON result và reports đọc được trong thư mục evidence. Không có video được dựng hay tuyên bố acceptance đầy đủ.

## 22. Blocker và rủi ro còn lại

| Mức | Vấn đề | Bằng chứng/ảnh hưởng |
|---|---|---|
| Cao | Marketplace validation fail-open khi service-token/context unavailable | RFQ Customer khác được nhận202; service client Cake AI thiếu; quyền job/design riêng vẫn trả403 |
| Cao | Storage fallback không bền vững | ảnh200 → restart →404, DB còn; không thể coi restart stack là khôi phục đầy đủ ảnh |
| Blocked | Provider thật | thiếu key/sandbox/cost authorization; 0 request có phí |
| Not verified | GCS/Firebase | credential có cấu trúc, chưa xác minh IAM/bucket/sandbox hoặc live upload/sign/delete |
| Blocked | Runtime Admin quyết định PENDING và discovery queue | không có pending hợp lệ/global list contract; không seed giả |
| Giới hạn | Identity/Bakery/Subscription đang chạy khác source HEAD | 12/1/4 tệp source drift; không rebuild ngoài Cake AI |
| Giới hạn | MIME và local URL hết hạn | key không extension trả header JPEG cho PNG; URL local public không ký |
| Not verified | iOS/tablet/hardware/performance/reboot host | môi trường và phạm vi kiểm tra hiện tại chưa bao phủ |

Các lỗi cũ Order/address/Review/Chat không tự biến mất vì Cake AI chạy. Không mở rộng thành audit/fix các dịch vụ này; giữ chứng cứ trước và source drift để người đọc đánh giá giới hạn.

## 23. Tệp Mobile đã thay đổi hoặc tạo

Existing: `mobile/README.md`, `lib/core/api/environment.dart`, `lib/core/widgets/live_data.dart`, `lib/features/ai/presentation/live_ai_pages.dart`, `tool/start_mobile.ps1`.

New: `test/cake_ai_runtime_widget_test.dart`; các script `tool/cake_ai_runtime.py`, `cake_ai_readiness.py`, `cake_ai_api.py`, `cake_ai_run_android.py`, `cake_ai_driver.dart`, `cake_ai_visual_driver.dart`, `cake_ai_guard.py`, `cake_ai_evidence.py`; reports/current-run/evidence dưới `mobile/docs/cake-ai/`. Build/cache chỉ trong Mobile hoặc workspace runtime ngoài repository.

Không sửa adapter các feature khác, Backend POM/Java/config/Compose, Web, root docs/config, skill, secret hoặc Git config. Core media chỉ thêm tùy chọn fit với default giữ nguyên; Core environment chỉ thêm mode thông tin Cake AI.

## 24. Xác minh integrity, diff và secret

[Final integrity](evidence/20261108T080611Z/final-integrity.json) so với baseline: 3.200 tệp protected ngoài Mobile giữ nguyên hash/size/mtime, không thêm/xóa; 7 secret hiện hữu giữ nguyên; HEAD không đổi, staged rỗng. Kiểm tra Git diff chỉ thấy thay đổi thuộc `mobile/`.

Scanner đọc secret hiện hữu trong bộ nhớ và tìm trong tệp Mobile mới/đổi và từng entry APK hiện tại; chỉ ghi tên biến/tệp nếu có match. Kết quả không có known-secret match. Đây là kiểm tra credential đã biết và marker nhạy cảm, không phải chứng minh toán học không thể có bí mật nào khác. VM debug URLs được redacted trước bàn giao. Không expose token/password/private key/URL GCS riêng trong báo cáo, source, screenshot hoặc APK.

Không commit/stage/push/merge/deploy, không reset database/xóa volume, không thay signing key, không gọi thanh toán/email/provider tính phí. Runtime và AVD giữ hoạt động để bàn giao.

## 25. Khuyến nghị và bước kiểm chứng tiếp theo

Task Backend riêng cần xử lý theo thứ tự: đăng ký service client Cake AI với grant Marketplace cần thiết, cấp secret đúng consumer; sửa MarketplaceClient để lỗi kiểm tra context không cho qua quyền sở hữu; kiểm tra RFQ khác chủ phải403 và context unavailable phải lỗi rõ ràng. Chỉ thêm env secret vào Cake AI không đủ khi Identity chưa có registration/grant.

Vị trí cần xem trong task được cấp quyền tương lai: `backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/infrastructure/client/MarketplaceClient.java:25` (catch cho qua), `infrastructure/storage/FirebaseStorageAdapter.java:21` (RAM cache), cùng file dòng100 (URL fallback), `feature/design/PublicStorageController.java:30` (MIME), `feature/generation/GenerationRepository.java:108` (chỉ moderate PENDING, contract cần giữ nhất quán). Các đường dẫn rút gọn sau đường dẫn đầu đều thuộc package `com/se193262/cakeaiservice` của cùng module. Không có đề xuất sửa POM/ApiResponse hiện tại.

Thiết kế storage cần durable implementation được hỗ trợ, phân biệt local/cloud, sign/expiry/MIME theo byte và báo lỗi upload thật. Sau sửa, create ảnh → restart service/Compose → đọc lại đúng checksum; thiết kế đang pending/rejected không bị lộ qua đường public.

Đăng ký sandbox provider thật và cho phép chi phí rõ ràng, kiểm tra model/Interactions contract trên project đó; chạy tối thiểu một job có ảnh, trace request/provider outcome, byte checksum và storage persistence. Không dùng lỗi thiếu key để tự sinh fake key hoặc đổi model tùy ý.

Cần contract discovery cho Admin pending nếu muốn luồng duyệt hoàn chỉnh. Dùng thiết kế PENDING do quy trình thật tạo để duyệt/reject qua Android, rồi kiểm tra selected-design chặn REJECTED. Không dùng SQL seed làm bằng chứng nghiệp vụ thật.

Mọi remediation Backend ở trên **chưa thực hiện** vì read-only. Sau khi được cấp task sửa riêng, build lại bằng reactor trong workspace ngoài, package/JAR provenance, tests, auth/ownership tests, startup và Android regression. README hiện mô tả đúng deployment đã chạy, không chứng nhận clean-clone/bootstrap hoặc reboot host.

## 26. Kết luận

Đã hoàn tất công việc độc lập được phép trong cả năm giai đoạn: xác minh build hiện tại, dựng Cake AI Docker cô lập, kiểm tra API và lỗi quyền thật, xác định rõ fallback, tích hợp/kiểm thử Android, diễn tập README và bàn giao bằng chứng. Không sửa Backend để che blocker. Kết quả cuối **PARTIAL_BLOCKED**: Cake AI và Flutter hoạt động thật ở chế độ cục bộ, nhưng chưa đạt acceptance cho provider thật, lưu trữ bền vững và toàn bộ moderation/quyền liên dịch vụ.
