# Báo cáo khắc phục ISSUE-02, 03, 04 và 06 — Bakery Platform

Ngày thực hiện: **08/11/2026**, múi giờ Việt Nam UTC+07. Repository: `H:\MSS\Bakery-Platform`, nhánh `dev`, HEAD `35536f664ffe7db889a623aabc3ff6cfd5bbb75c`.

Bằng chứng của đợt này nằm ngoài repository tại `H:\MSS\.diagnostics\remediation-20261108T101948Z`. Các liên kết bằng chứng bên dưới trỏ tới thư mục này; không chứa mật khẩu, token hoặc URL ký đầy đủ. Đây là báo cáo triển khai và kiểm chứng, kế thừa [audit sáu vấn đề](BAKERY_PLATFORM_SIX_ISSUES_REVALIDATION_VI.md), không sửa lại báo cáo audit đó.

## 1. Tổng quan nhiệm vụ

Đã thực hiện theo thứ tự: xác minh và triển khai Chat History hiện tại → journal bền vững cho Mobile → public URL cho ảnh Chat → Firebase sandbox cho RFQ → chuẩn hóa build Cake AI → hồi quy và kiểm tra toàn vẹn.

Kết quả trong môi trường local đã kiểm chứng: journal mã hóa sống qua restart tiến trình; gửi lại giữ nguyên ID và ảnh, không tạo tin trùng; ảnh Chat tải bằng byte thật trên Windows/Android/Web; RFQ upload/read/delete trên Firebase sandbox thật; Cake AI build từ Maven repository trống, Dockerfile đóng gói đúng executable và shared contract. **85 kiểm thử Maven, 122 kiểm thử Flutter đều đạt**; `flutter analyze` và build APK debug đạt.

Phạm vi này không chứng nhận production, iOS, mọi hành trình đặt hàng, Gateway hay nhà cung cấp AI. Các giới hạn cụ thể được giữ riêng tại mục 17.

## 2. Hiện trạng hệ thống trước khi sửa

Baseline ghi nhận 4.244 tệp source/config/tài liệu, 6.330 tệp trong toàn bộ `frontend` gồm cả dependencies/artifact hiện hữu, 7 tệp private liên quan và metadata của 49 container. [Baseline](../../.diagnostics/remediation-20261108T101948Z/baseline.json), [Docker ban đầu](../../.diagnostics/remediation-20261108T101948Z/containers-before.json).

Workspace đã có thay đổi của đợt trước: `mobile/README.md`, `mobile/lib/core/api/environment.dart`, `mobile/lib/core/widgets/live_data.dart`, `mobile/lib/features/ai/presentation/live_ai_pages.dart`, `mobile/tool/start_mobile.ps1` và một số tệp chưa tracked. Giữ nguyên bốn tệp đầu; chỉ mở rộng launcher và bổ sung dependency injection cho test Cake AI đã có. Không reset workspace.

Toolchain đã dùng: JDK **21.0.8**, Maven **3.9.11**, Spring Boot **4.1.1**, module **0.0.1-SNAPSHOT**, Flutter **3.47.1**, Dart **3.13.1**, Docker **29.6.1**, Compose **5.3.0**. Android Emulator `emulator-5554`, AVD `homemind_local_run`, API 36; không đổi cấu hình độ phân giải hiện hữu.

Phát hiện kế thừa được tái xác minh: Chat History source đã tách truy vấn trang đầu/cursor nhưng deployment cũ chưa theo source; pending chỉ ở RAM; URL Chat được ký cho hostname Docker; root Firebase không được container Marketplace sử dụng trong chế độ no-Firebase; Cake AI source/shared hiện tại đã có Google SDK và `accepted(T)`, trong khi build module độc lập có thể lấy SNAPSHOT cũ.

## 3. Phạm vi source code và cấu hình được phép chỉnh sửa

Chỉ sửa phần liên quan bốn issue: storage/config/test Chat; config/scheduler/test Marketplace; workflow build; journal/UI/tool/test Mobile; Compose local; launcher Python; CONTEXT liên quan và báo cáo này. Không đổi POM, schema/migration, nghiệp vụ Cake AI, hợp đồng API hoặc quyền người dùng.

Đã áp dụng quy ước project, CONTEXT và hai skill `design-taste-frontend`, `impeccable` trước khi sửa UI Chat. Giữ SweetCake, màu sắc, typography và component hiện hữu; thay đổi UI chủ yếu là phục hồi composer và thông báo lưu tin chờ.

`frontend/` hoàn toàn chỉ đọc. Root `.env`, cấu hình private và khóa Backend chỉ đọc. Người dùng xác nhận Firebase là sandbox và cho phép upload/xóa tệp synthetic; không mở quyền gọi AI, gửi email hay thanh toán thật. Không stage, commit, push, deploy production, reset database hoặc xóa volume.

## 4. ISSUE-06 — Chat Pending Recovery

**Nguyên nhân:** `pending` trước đây là Map trong bộ nhớ. Session được lưu không đồng nghĩa lệnh gửi tin được lưu; sau process death không còn payload/ID để đối chiếu. Biến môi trường không giải quyết được lỗi này.

**Tiền đề Chat History:** dùng source hiện tại có `findFirstPage` tại `backend/chat-service/src/main/java/com/se193262/chatservice/feature/message/ChatMessageRepository.java:25`, `findPageBeforeCursor` dòng 43 và UUID cast dòng 40. Build source đó rồi thay riêng container Chat, giữ DB/MinIO. Trang đầu/cursor thực tế trả 200, cursor sai 400, anonymous 401, người ngoài 404, hội thoại mới có thể có lịch sử rỗng. Không viết lại SQL đã đúng. [Kiểm chứng tiền đề](../../.diagnostics/remediation-20261108T101948Z/chat-prerequisite-api.json).

**Thiết kế journal:**

- `pending_chat_message.dart:11` giữ bản sao immutable của nội dung và toàn bộ attachment bytes; fingerprint SHA-256 bao gồm nội dung, tên/MIME và hash từng tệp. Lưu version, ID, thời gian tạo, trạng thái, số lần thử và thời gian thử cuối.
- `pending_chat_journal.dart:43` dùng AES-256-GCM, khóa ngẫu nhiên 256 bit lưu riêng trong Flutter Secure Storage namespace `sweetcake.chat.keys.v1`. Nonce 96 bit ngẫu nhiên, tag 128 bit, AAD ràng buộc account scope và tên record. Không đưa session/token vào journal.
- File ciphertext trong application-support private directory: `chat-pending-v1/<hash Identity origin + Chat origin + user ID>/<hash conversation>.pending`. Attachment base64 chỉ nằm trong plaintext được mã hóa trước khi ghi; không có bản attachment plaintext trên disk journal.
- Ghi ciphertext vào file tạm, `flush:true`, rồi rename cùng thư mục; serialize cả ghi/xóa/clear. Chỉ HTTP POST sau khi ghi thành công. Không đọc/ghi key Backend; khóa journal được tái sử dụng, mất khóa khi có ciphertext sẽ báo lỗi và giữ record.
- Giới hạn một pending mỗi hội thoại, 20 hội thoại/account, khoảng 72 MiB/record và 200 MiB/account; đầy disk/quota không được bỏ record cũ hoặc gửi HTTP khi chưa lưu an toàn.

`pending_chat_recovery.dart:97` khóa thao tác đồng thời theo hội thoại; command đang chờ chỉ chấp nhận cùng logical ID và fingerprint. `restore()` dòng 44 có session fencing; account/origin/hội thoại khác không nhận lệnh cũ. `reconcile()` dòng 176 đối chiếu ID, sender và payload/metadata trên tối đa năm trang được kiểm tra; việc không thấy tin trong phạm vi đó **không** chứng minh server chưa commit. Có thể fetch thêm một trang tại ranh giới vòng lặp nhưng không dùng sự vắng mặt để xóa pending. Không tự động POST khi khởi động app.

ACK đúng ID hoặc lịch sử xác nhận mới xóa record. Lỗi không rõ kết quả được giữ; trước truyền được giữ trạng thái `not_sent`; 403/409 không tự đổi ID để thử lách. Explicit logout xóa pending account hiện tại trước logout, có fence chống ghi muộn; session hết hạn và chuyển account không tự gửi lệnh cũ. Thông báo UI giải thích rõ logout sẽ xóa bản chờ trên máy.

Các kịch bản restart, ACK bị mất, retry ảnh, cursor, logout và isolation đã đạt; xem mục 13–15. Rủi ro chưa kiểm thử: mất điện đột ngột tại thời điểm rename, hiệu năng attachment sát giới hạn và thiết bị iOS; không tuyên bố độ bền trước mọi lỗi phần cứng.

## 5. ISSUE-02 — Chat Attachment URL

**Nguyên nhân:** một MinIO client vừa I/O nội bộ vừa ký URL nên API trả URL mang hostname chỉ Docker hiểu. Sửa hostname sau ký sẽ làm sai canonical Host của SigV4.

Đã chọn **tách endpoint I/O và endpoint ký public**. Đây là thay đổi nhỏ nhất, giữ nguyên DTO và private bucket. Download proxy sẽ cần endpoint/auth/cache mới; reverse proxy/hostname chung cần thêm hạ tầng chưa cần cho local. Hai phương án đó không được triển khai trong đợt này.

`StorageProperties.java:14` thêm `publicEndpoint`, `region`, fallback public endpoint về endpoint cũ để tương thích cấu hình ứng dụng. Chỉ nhận origin HTTP(S), không credentials/path/query/fragment. `MinioAttachmentStorage.java:31` tạo signing client riêng với region rõ ràng; I/O vẫn dùng internal endpoint. Không gọi DNS public để khám phá region và không sửa URL sau ký.

Biến bổ sung: `CHAT_STORAGE_PUBLIC_ENDPOINT`, `CHAT_STORAGE_REGION`, mapping `CHAT_STORAGE_URL_EXPIRY`. Local dùng `http://localhost:19006`, `us-east-1`, thời hạn 15 phút. Mobile launcher cấu hình `adb reverse` cho cổng storage; public HTTPS có thể được cấu hình mà không đổi code/DTO. Không hardcode IP Windows vào nghiệp vụ.

Upload thật trả 201; Windows và Android tải đúng **42.397 byte**, MIME `image/jpeg`, SHA-256 `20b66c25d2589383403c8febd7760ccebe2fe1d5e10e085aa2e44105ced9d487`. Đây là ảnh kiểm thử từ asset có sẵn, không phải ảnh AI mới. Unsigned GET 403, metadata anonymous 401, người ngoài 404. Không chuyển JWT Identity tới storage.

**Giới hạn mạng Docker cần phân biệt:** URL public loopback không truy cập trực tiếp được từ container Chat, vì `localhost` khi đó là container. Kiểm thử trong container tải cùng URL/Host/chữ ký bằng `curl --connect-to localhost:19006:chat-storage:9000`, chỉ đổi đường TCP sang internal service. Byte tải khớp; không thay URL/canonical Host. Đây là bằng chứng storage/signature qua mạng nội bộ, **không** chứng nhận public loopback trực tiếp reachable từ mọi container. Public DNS/HTTPS thực chưa triển khai.

JUnit với MinIO dùng tmpfs thực xác minh GET 200, unsigned 403, expiration 1 giây rồi GET 403 sau 2,1 giây; không cần chờ URL runtime 15 phút hết hạn. Unit case HTTPS external-only ký được không cần DNS. [Runtime byte/security](../../.diagnostics/remediation-20261108T101948Z/chat-attachment-runtime.json), [Android](../../.diagnostics/remediation-20261108T101948Z/android-attachments-results.json), [expiry tests](../../.diagnostics/remediation-20261108T101948Z/chat-public-endpoint-tests.log).

## 6. ISSUE-03 — RFQ Image Upload

**Nguyên nhân HTTP 503 đã xác minh:** Compose no-Firebase loại credential mount và blank cấu hình; root `.env` không tự biến thành environment của container đang chạy. Không kết luận credential sai chỉ từ sự có mặt của tên biến.

`scripts/start-local-runtime.py:48` thêm opt-in `--firebase-sandbox`, đọc ba tham chiếu Firebase trong root `.env`, xác minh credential loại service-account và project khớp. Tái sử dụng file gốc; không sao chép key vào repo, không in project/bucket/key hoặc overwrite `.env`.

| Biến/thành phần | Nguồn và cách sử dụng | Kiểm chứng |
|---|---|---|
| `FIREBASE_PROJECT_ID` | Root `.env` → child `LOCAL_FIREBASE_PROJECT_ID` → Marketplace runtime | MATCH, provider upload thành công |
| `FIREBASE_STORAGE_BUCKET` | Root `.env` → child `LOCAL_FIREBASE_STORAGE_BUCKET` → Marketplace runtime | MATCH, GET byte thật |
| `FIREBASE_CREDENTIALS_FILE` | Chỉ làm nguồn bind mount của file private hiện hữu | File gốc giữ nguyên |
| `GOOGLE_APPLICATION_CREDENTIALS` | Child `LOCAL_FIREBASE_ADC_PATH` → `/run/secrets/firebase.json` | Mount read-only, container đọc được |
| `MARKETPLACE_ORPHAN_CLEANUP_ENABLED` | Local override đặt false; ứng dụng mặc định true | Test cả enabled/disabled |
| `SERVER_PORT` | 8080 theo port binding container hiện hữu | App listening và API 200 |

Trong sandbox mode, launcher bỏ `compose.no-firebase.yaml` khỏi danh sách merge để mount Firebase gốc có hiệu lực. Default mode vẫn blank các trường/mount Firebase, giữ no-Firebase chủ động; khi đó upload 503 là giới hạn được dự kiến, không giả lập thành công. [Hai mode Compose sau cùng](../../.diagnostics/remediation-20261108T101948Z/compose-mode-final-verification.json), [provenance container thực](../../.diagnostics/remediation-20261108T101948Z/firebase-final-runtime-provenance.json).

Bucket sandbox có thể chứa dữ liệu của DB khác. Đã thêm flag chỉ ngăn tác vụ **quét orphan định kỳ** trong local; mặc định production vẫn true. Compensation upload/delete của từng request giữ nguyên. Không scan bucket hoặc xóa object không thuộc fixture mới.

RFQ synthetic DRAFT được tạo qua API có quyền thật. Upload 201, GET ảnh Google Cloud 200 với cùng byte/MIME/hash, metadata tồn tại; upload lặp tạo image ID mới theo contract hiện hữu; DELETE 204 và URL cũ 404. Restart Marketplace giữ metadata và ảnh. MIME sai/oversize 400; owner khác 403; anonymous 401; request thiếu 404; PUBLISHED mutation 409. Android chọn tệp qua picker OS và Web qua file input đều upload/delete thật. [RFQ matrix](../../.diagnostics/remediation-20261108T101948Z/rfq-runtime-checks.json), [byte và restart](../../.diagnostics/remediation-20261108T101948Z/rfq-storage-byte-verification.json).

Cuối đợt, hai DRAFT synthetic không còn ảnh; object còn lại đã xóa qua API và xác nhận 404. Giữ bản ghi RFQ/Chat local để đối chiếu, không purge DB. [Cleanup giới hạn fixture](../../.diagnostics/remediation-20261108T101948Z/synthetic-cloud-cleanup.json).

## 7. ISSUE-04 — Cake AI Maven Build

Google Storage hiện có trực tiếp trong POM: `google-cloud-storage:2.43.0`; Google Auth được kéo transitively: `google-auth-library-oauth2-http:1.25.0`, `google-auth-library-credentials:1.25.0`. `com.se193262.platform.dto.ApiResponse.accepted(T)` có trong source `backend/platform-support/src/main/java/com/se193262/platform/dto/ApiResponse.java:14`. Controller vẫn giữ HTTP 202 và envelope hiện tại. Không thêm dependency, đổi version hoặc thêm factory đã tồn tại.

Vấn đề cần chuẩn hóa là resolution của shared SNAPSHOT: module-only build có thể dùng local installed JAR cũ; workflow được hỗ trợ phải lấy current source trong reactor. Thêm `backend/build-service.ps1`, luôn chạy từ parent với `-pl <service> -am clean package`, chọn JDK 21 theo tham số, tùy chọn isolated Maven repository; không `install` đè SNAPSHOT global và không xóa cache người dùng.

Script chứng nhận classifier: Cake AI/Marketplace `-exec.jar`, Chat `.jar`; kiểm manifest Boot JarLauncher/Start-Class; đúng một shared JAR khi module dùng shared; `javap` xác nhận `accepted(T)`; Cake có Google Storage/Auth runtime libraries. Có lỗi thì không chứng nhận artifact. Hỗ trợ ba service trong phạm vi này.

Đã thực thi script từ bản source copy ngoài repo với Maven repository ban đầu trống, download/build/test thật thành công. Build lặp lại bằng clean reactor verify cũng đạt. Dockerfile hiện hữu build nhiều stage từ current source thành công; JAR lấy từ image so khớp **67 class/resource/shared entry** với cold build. JAR đang chạy tại cổng 18105 cũng khớp 67 entry; readiness và GET generation-jobs có auth trả 200. Không restart Cake không cần thiết, không gọi POST tạo AI job/provider.

So sánh class/resource và shared class thay vì checksum toàn JAR, vì timestamp đóng ZIP có thể khác. Raw module-only workflow chưa chuẩn bị shared artifact không được chứng nhận là cách build hỗ trợ.

[Cold build](../../.diagnostics/remediation-20261108T101948Z/cake-official-cold-build.json), [log](../../.diagnostics/remediation-20261108T101948Z/cake-official-cold-build.log), [Docker build](../../.diagnostics/remediation-20261108T101948Z/cake-supported-docker-build.json), [artifact Docker](../../.diagnostics/remediation-20261108T101948Z/cake-docker-artifact-verification.json), [JAR runtime](../../.diagnostics/remediation-20261108T101948Z/cake-current-runtime-verification.json).

## 8. Tổng hợp các thay đổi Backend

Chat: thêm cấu hình public signing/region và client ký riêng, cùng integration test private MinIO; cập nhật CONTEXT. Không thay controller, DTO, idempotency hay query History đã đúng.

Marketplace: thêm opt-out có cấu hình cho scheduled orphan cleanup và test hai nhánh; giữ provider Firebase, điều kiện DRAFT/ownership, compensation và contract ảnh; cập nhật CONTEXT. Cake AI/platform-support/POM/SQL/Dockerfile không sửa. Workflow PowerShell mới kiểm reactor/artifact; không sửa Java để lách build.

## 9. Tổng hợp các thay đổi Mobile

Ba lớp journal/payload/recovery mới; `LiveChatRepository` ghi trước gửi, restore/reconcile/ACK; `LiveWorkspace` restore theo account và guard khi Chat chưa được cấu hình; `LiveSession` gọi callback trước explicit logout; màn Chat phục hồi composer/ảnh và giải thích trạng thái.

Thêm `cryptography:2.9.0`; chuyển `path_provider:2.1.6` từ transitive thành direct. Giữ `crypto:3.0.7` và Secure Storage hiện hữu. Tests dùng `MemoryPendingChatJournal` qua dependency injection rõ ràng; production mặc định dùng file mã hóa. Test không đổi các assertion nghiệp vụ để được PASS. Launcher thêm `ChatStorageUrl` và reverse port loopback; giữ các thay đổi Cake AI của đợt trước.

## 10. Tổng hợp các thay đổi Docker/ENV

Không sửa `.env`, không sinh/rotate credential Backend. Biến local mới là mapping/derived public config. Khóa mới duy nhất phục vụ journal nằm trong secure storage của app Android; không nằm trong repo hoặc host `.env`.

| Thành phần | Cấu hình và trạng thái thực |
|---|---|
| Chat internal/public | `chat-storage:9000` cho I/O; public loopback port 19006 cho client; region rõ ràng |
| Marketplace sandbox | Root Firebase refs được inject chọn lọc, mount read-only; orphan cleanup false; port 8080 |
| Local Compose | Marketplace/Chat/Cake port 8080 khớp host mapping 18083/18087/18085; Chat/Order/Cake upstream Marketplace port 8080 |
| Runtime Mobile đang dùng | API ports 18101–18107 hiện hữu; không nhầm với stack `bakery-local` 18081–18087 |
| App container | Thay riêng Chat và Marketplace bằng JAR mới, giữ environment cần thiết/network aliases/mount/port/restart policy; container trước được rename giữ rollback |
| DB/MinIO | Không thay container DB, không reset volume; chỉ restart storage trong bài persistence |

Chat active image: `bakery-remediation:chat-public-20261108`; Marketplace active image: `bakery-remediation:marketplace-sandbox-20261108`. Backup được giữ ở tên `bakery-mobile-phase5-chat-pre-history-20261108`, `bakery-mobile-phase5-chat-pre-public-20261108`, `bakery-mobile-phase5-marketplace-pre-firebase-20261108`; bản thử port không khớp được giữ stopped tại `bakery-mobile-phase5-marketplace-pre-firebase-port-20261108`. Không chạy backup song song với active.

Khởi động lại đúng deployment đã kiểm chứng, không recreate DB:

```powershell
docker start bakery-mobile-phase5-chat bakery-mobile-phase5-marketplace
docker restart bakery-local-chat-storage-1
docker restart bakery-mobile-phase5-chat
docker restart bakery-mobile-phase5-marketplace
```

Đã diễn tập riêng restart Chat/Marketplace/storage, xác nhận dữ liệu còn. `docker start` là thủ tục bật container đã có, không phải build source. Có thể stop app mới rồi rename backup về tên cũ để rollback, nhưng rollback đưa lại lỗi cũ/thiếu sandbox; không thực hiện rollback sau khi acceptance đạt. Không dùng `down -v`, prune hoặc recreate database.

Workflow Compose tái sử dụng config bền vững đã tồn tại:

```powershell
python scripts/start-local-runtime.py --firebase-sandbox status
python scripts/start-local-runtime.py --firebase-sandbox restart
```

Các lệnh này nhắm **project `bakery-local`**, không nhắm runtime 181xx. Đã kiểm merge config ở cả hai mode; chưa chuyển toàn bộ stack đang chạy 181xx sang project đó. Không chạy `prepare` để tạo lại secrets trong đợt này. Không dùng `build/up` dựa trên JAR cũ trong `target`; build current reactor trước nếu cần tái tạo image.

## 11. Ảnh hưởng tới Frontend Web

**Không sửa bất kỳ tệp Frontend nào.** Đối chiếu đầy đủ 6.330 tệp, kể cả `node_modules`/`dist`: không thêm/xóa/đổi byte hoặc timestamp. [Integrity](../../.diagnostics/remediation-20261108T101948Z/final-integrity.json).

API path, request multipart, response envelope, field ảnh, quyền và HTTP status nghiệp vụ giữ nguyên. Khác biệt chủ đích là host/scheme/port URL ảnh Chat có thể public-configurable; Web nhận URL mới từ API và đã tải/hiển thị được ảnh thật. URL ký cũ đã nhận trước redeploy không tự biến đổi; làm mới history để nhận URL mới.

Đã chạy actual React/Vite Frontend từ source hiện hữu ở `http://127.0.0.1:5173`, proxy đến Backend thật. Dùng cache ngoài repo và bỏ duy nhất plugin dev-sync vốn ghi file; không đổi ứng dụng hoặc mock API. Browser context incognito, login UI thật. Port thử 15173 bị CORS từ chối đúng chính sách, chuyển về origin 5173 đã được cho phép; không nới CORS.

Chat: file input/composer Web gửi multipart thật 201, ảnh load `naturalWidth > 0`. RFQ: file input thật upload Firebase 201, DOM ảnh load, detail có image ID; tick checkbox xác nhận hiện hữu rồi DELETE 204, metadata mất. 401 refresh trước login trong fresh context là trạng thái anonymous bình thường. [Chat Web](../../.diagnostics/remediation-20261108T101948Z/web-chat-valid-rfq-selector-failure.json), [RFQ upload](../../.diagnostics/remediation-20261108T101948Z/web-rfq-upload-valid-unconfirmed-delete.json), [delete cuối](../../.diagnostics/remediation-20261108T101948Z/web-runtime-regression.json).

Không xác định tệp Frontend nào bắt buộc sửa cho bốn issue này. Khi triển khai public HTTPS thật cần kiểm origin/CSP/proxy/cache theo môi trường; chưa kiểm cấu hình production đó. Không suy rộng các test Chat/RFQ thành acceptance toàn bộ Web.

## 12. Kết quả kiểm thử Backend

Lệnh clean verify chạy từ parent trong **bản copy source hiện tại ngoài repository**, có canonical SQL reference chỉ phục vụ MigrationSyncTest:

```powershell
mvn -B -ntp -pl cake-ai-service,chat-service,marketplace-service -am clean verify "-Dmaven.repo.local=H:\MSS\.diagnostics\remediation-20261108T101948Z\maven-empty-repository"
```

| Test ID | Issue | Service | Scenario | Expected | Actual | Evidence | Status |
|---|---|---|---|---|---|---|---|
| BE-01 | 04 | platform-support | Contract shared hiện tại | Không fail/skip | 3 tests, 0 fail/error/skip | [Counts](../../.diagnostics/remediation-20261108T101948Z/backend-final-test-counts.json) | PASS |
| BE-02 | 04 | cake-ai-service | Unit/integration và compile/package | Không fail/skip | 29 tests, 0 fail/error/skip | [Final log](../../.diagnostics/remediation-20261108T101948Z/backend-final-regression.log) | PASS |
| BE-03 | 02/06 | chat-service | Query/idempotency/security/storage thực | Không fail/skip | 15 tests, 0 fail/error/skip | [Final log](../../.diagnostics/remediation-20261108T101948Z/backend-final-regression.log) | PASS |
| BE-04 | 03 | marketplace-service | Nghiệp vụ/storage boundaries/cleanup/migration sync | Không fail/skip | 38 tests, 0 fail/error/skip | [Counts](../../.diagnostics/remediation-20261108T101948Z/backend-final-test-counts.json) | PASS |
| BE-05 | 04 | Maven/Docker | Cold resolve, shared class, classifier, repeated build | Executable hiện tại | Empty repository build đạt; 67 entries khớp | [Cold](../../.diagnostics/remediation-20261108T101948Z/cake-official-cold-build.json), [repeat](../../.diagnostics/remediation-20261108T101948Z/backend-final-regression.json) | PASS |
| BE-06 | 02 | MinIO disposable | Private URL expiration | 200 trước hạn, 403 sau hạn/unsigned | Đúng byte/MIME; 403 đúng hạn | [Storage test](../../.diagnostics/remediation-20261108T101948Z/chat-public-endpoint-tests.log) | PASS |

Tổng **85 tests**, không skip. PostgreSQL/MinIO test container mới/disposable tách biệt database thật. Chi tiết từng testcase có trong Surefire XML bên ngoài repo và [danh mục kiểm thử](../../.diagnostics/remediation-20261108T101948Z/final-test-catalogue.json). Không coi build success là chứng nhận cloud/AI hoạt động.

## 13. Kết quả kiểm thử Flutter

| Test ID | Issue | Service | Scenario | Expected | Actual | Evidence | Status |
|---|---|---|---|---|---|---|---|
| FL-01 | 06 | Flutter | Static analysis toàn mobile | Không lỗi | Exit 0 | [Analyze](../../.diagnostics/remediation-20261108T101948Z/flutter-analyze-final.log) | PASS |
| FL-02 | 06 và regression | Flutter | Unit/widget toàn bộ | Không test fail | 122 tests PASS | [Test log](../../.diagnostics/remediation-20261108T101948Z/flutter-tests-final.log) | PASS |
| FL-03 | 06 | Journal/recovery | AES/tamper/key-loss, immutable bytes, quota/disk, write-before-send, duplicate tap, cursor, logout fencing | Fail closed, không mất/lẫn command, không POST trước lưu | Assertions đạt trong full suite | [Test source](../mobile/test/chat_pending_recovery_test.dart) | PASS |
| FL-04 | 02/06 | Android | Build normal debug APK current source | Build thành công | Exit 0, install -r thành công, main UI mở | [Build](../../.diagnostics/remediation-20261108T101948Z/flutter-debug-apk-final.json), [ảnh app chính](../../.diagnostics/remediation-20261108T101948Z/screenshots/normal-mobile-final-startup.png) | PASS |
| FL-05 | 02 | Launcher | Script hiện tại prepare, boot, reverse port storage | Port 19006 được reverse | Exit 0; 18101–18107,19006,19022 | [Rehearsal](../../.diagnostics/remediation-20261108T101948Z/mobile-launcher-rehearsal.json) | PASS |
| FL-06 | 06 | iOS | Native keychain/journal/process restart | Native verification | Windows host, chưa chạy | Giới hạn mục 17 | NOT_TESTED |

Harness Android ở bản copy ngoài repo, applicationId riêng `com.example.bakery_mobile.remediation`. **82 tệp production Dart byte-identical** với source cuối; chỉ entry/driver/transport fault injection bên ngoài production. [Provenance](../../.diagnostics/remediation-20261108T101948Z/mobile-final-copy-provenance.json). Fault injection loại bỏ ACK sau HTTP 201 thật; lượt cuối lỗi trước gửi dùng NativeTransport tới loopback cổng từ chối kết nối. Không dựng response thành công giả.

APK trước/sau lượt restart cuối có cùng checksum; `--use-application-binary` và guard hash ngăn build lại giữa hai bước. App chính `com.example.bakery_mobile` được update bằng `adb install -r`, không uninstall/clear data; [APK lấy lại từ package đã cài khớp byte với build cuối](../../.diagnostics/remediation-20261108T101948Z/normal-mobile-install-verification.json). Launcher rehearsal dùng script byte-identical trong copy, điều chỉnh riêng đường dẫn chẩn đoán để đọc source thật và ghi evidence bên ngoài repo; chạy `-PrepareOnly`, APK chính được build/install/start riêng.

## 14. Kết quả kiểm thử nghiệp vụ End-to-End

| Test ID | Issue | Service | Scenario | Expected | Actual | Evidence | Status |
|---|---|---|---|---|---|---|---|
| E2E-01 | 02 | Chat/Windows | Upload ảnh → metadata → signed GET | 201/200, đúng MIME/byte/hash | 42.397 byte JPEG khớp | [Runtime](../../.diagnostics/remediation-20261108T101948Z/chat-attachment-runtime.json) | PASS |
| E2E-02 | 02 | Chat/Docker | Signed Host nguyên vẹn qua TCP nội bộ | Tải đúng bytes | Đạt qua connect-to; direct public loopback không reachable | [Runtime](../../.diagnostics/remediation-20261108T101948Z/chat-attachment-runtime.json) | PASS |
| E2E-03 | 02 | Android native | OS picker → multipart → ảnh hiển thị/tải | POST201, GET200, không JWT ở storage | Đạt, byte/hash khớp | [Native results](../../.diagnostics/remediation-20261108T101948Z/android-native-storage-results.json), [ảnh](../../.diagnostics/remediation-20261108T101948Z/screenshots/android-native-chat-upload-and-image.png) | PASS |
| E2E-04 | 02 | Existing Web | Composer thật upload/hiển thị | POST201, ảnh decode | Đạt | [Ảnh](../../.diagnostics/remediation-20261108T101948Z/screenshots/web-native-chat-upload.png) | PASS |
| E2E-05 | 02 | Chat security | Unsigned/anonymous/outsider | 403/401/404 | Đúng status; không lộ bytes cho unsigned | [Runtime](../../.diagnostics/remediation-20261108T101948Z/chat-attachment-runtime.json) | PASS |
| E2E-06 | 03 | Marketplace/Firebase | DRAFT upload/read/delete/GET lại | 201/200/204/404 | Đạt trên provider sandbox thật | [RFQ](../../.diagnostics/remediation-20261108T101948Z/rfq-runtime-checks.json), [byte](../../.diagnostics/remediation-20261108T101948Z/rfq-storage-byte-verification.json) | PASS |
| E2E-07 | 03 | Marketplace | MIME, oversize, wrong owner, anon, missing, published | 400/400/403/401/404/409 | Đúng từng nhánh | [RFQ matrix](../../.diagnostics/remediation-20261108T101948Z/rfq-runtime-checks.json) | PASS |
| E2E-08 | 03 | Android native | RFQ picker/upload/detail/delete UI | 201/204, ảnh thật | Đạt | [Native results](../../.diagnostics/remediation-20261108T101948Z/android-native-storage-results.json), [ảnh](../../.diagnostics/remediation-20261108T101948Z/screenshots/android-native-rfq-sandbox-upload.png) | PASS |
| E2E-09 | 03 | Existing Web | RFQ file input/upload/checkbox/delete | 201/204, metadata mất | Đạt; ảnh DOM decode thành công | [Upload](../../.diagnostics/remediation-20261108T101948Z/web-rfq-upload-valid-unconfirmed-delete.json), [delete](../../.diagnostics/remediation-20261108T101948Z/web-runtime-regression.json) | PASS |
| E2E-10 | 02/03/04/06 | Cross-service | Customer/Owner/Admin login/me; catalog/plans/orders/RFQ/jobs/Chat GET và quyền | API thực theo contract | Tất cả check cuối đạt | [Cross-service](../../.diagnostics/remediation-20261108T101948Z/cross-service-final-regression.json) | PASS |

Ảnh PNG là screencap Android/Chrome thật, không chỉnh sửa pixels. Ảnh RFQ Web ghi nhận detail với số lượng ảnh; kiểm tra decode qua DOM ở log, không dùng một viewport screenshot để suy ra mọi request đều thành công. Các RFQ/địa chỉ mô tả “synthetic” chỉ là fixture lưu qua API, không đưa vào báo cáo như dữ liệu khách hàng thật. Không tạo đơn mua/thanh toán/email/AI trong lượt này.

## 15. Kiểm thử Restart, Recovery và Idempotency

| Test ID | Issue | Service | Scenario | Expected | Actual | Evidence | Status |
|---|---|---|---|---|---|---|---|
| REC-01 | 06 | Android/Chat | Lỗi trước truyền, restart app | Khôi phục cùng ID/payload, retry 201 một lần | Đạt; lượt cuối dùng connection-refused thật | [Before](../../.diagnostics/remediation-20261108T101948Z/android-final-image-before-results.json), [after](../../.diagnostics/remediation-20261108T101948Z/android-final-image-after-results.json) | PASS |
| REC-02 | 06 | Android/Chat | Server commit 201, mất ACK, kill app, history reconciliation | Tin server được nhận diện, không POST lại tự động | Đạt, pending được xóa sau đối chiếu | [After restart](../../.diagnostics/remediation-20261108T101948Z/android-after-restart-results.json) | PASS |
| REC-03 | 06/02 | Android/Chat/MinIO | Pending có ảnh, cùng APK, force-stop + restart storage/Chat, manual replay | ID/fingerprint/attempt/bytes giữ nguyên, replay200, một message | Đạt; 2 ciphertext commands còn sau force-stop, record server count1 | [Restart](../../.diagnostics/remediation-20261108T101948Z/final-app-storage-restart.json), [after](../../.diagnostics/remediation-20261108T101948Z/android-final-image-after-results.json), [ảnh](../../.diagnostics/remediation-20261108T101948Z/screenshots/final-image-replay-after-app-and-storage-restart.png) | PASS |
| REC-04 | 06 | Android | Logout → Owner → Customer → restart lại | Không lẫn account/hồi sinh/replay lệnh | Đạt | [After](../../.diagnostics/remediation-20261108T101948Z/android-after-restart-results.json), [repeat](../../.diagnostics/remediation-20261108T101948Z/android-repeated-restart-results.json) | PASS |
| REC-05 | 06 | Chat | Cùng ID/payload vs cùng ID đổi payload | Replay200 cùng message/count1; mismatch409 | Đúng; Chat restart giữ messages | [Idempotency](../../.diagnostics/remediation-20261108T101948Z/chat-restart-idempotency.json) | PASS |
| REC-06 | 03 | Marketplace/Firebase | Restart Marketplace sau upload | Metadata/image ID/bytes còn nguyên | GET200 và hash khớp | [Byte/restart](../../.diagnostics/remediation-20261108T101948Z/rfq-storage-byte-verification.json) | PASS |
| REC-07 | 06 | Mobile | Hard power-loss/host reboot thật/iOS | Chứng nhận tương ứng | Chưa thực hiện | Không suy ra từ force-stop | NOT_TESTED |

Hai kịch bản ACK-loss khác nhau đều có bằng chứng: đối chiếu history không POST; và manual replay ảnh từ journal đã restore. Lượt cuối tạm giữ GET history trong transport harness để chủ động kiểm nhánh retry, sau đó thả GET thật. Production không có fault flags này. Pending ảnh cuối logical ID `a9385824-1bf1-4d64-8536-545db2cd0e78` được server giữ đúng một message `0142cc29-2ada-4d6c-b313-eb67da6d6f59`; ID này chỉ là định danh fixture, không phải credential.

## 16. Những lỗi phát sinh trong quá trình sửa

1. Full Flutter regression ban đầu phát hiện restore/logout Chat bị gọi khi legacy config chưa có Chat origin. Đã guard bằng `environment.chat != null` và chuyển restore sang async để lỗi đi đúng Future; chạy lại toàn bộ đạt 122 tests. Giữ log trước sửa `pre-optional-chat-guard-*`; không bỏ test.
2. Marketplace current-source JAR mặc định 8083 nhưng deployment cũ bind 8080, gây disconnect. Xác minh listening port rồi đặt `SERVER_PORT=8080`, giữ DB. Đối chiếu owned list trước retry tạo fixture; không retry mù mutation. Đồng bộ upstream/port local Compose liên quan.
3. Isolated Marketplace test lần đầu thiếu canonical `database/postgresql` SQL trong bản copy, MigrationSyncTest lỗi fixture; copy đúng reference ngoài repo, rerun affected check và cuối cùng full clean verify đạt 38 tests. Không sửa migration.
4. PowerShell 5 xử lý stderr của `java -version` thành NativeCommandError; script mới dùng `java --version` stdout. Cold run sau đó đạt. Lần build image đầu dùng sha256 như tên repository không hợp BuildKit; dùng local tag trỏ cùng base image, không đụng DB.
5. Harness ban đầu dùng conversation CLOSED, DocumentsUI Recent/search và tọa độ physical/override không phù hợp; không mở cưỡng bức hội thoại cũ. Tạo OPEN fixture qua API hợp lệ; chọn đúng filename qua OS picker; cuối cùng helper tự chọn thành công. Failed harness logs được giữ `initial-harness-*`, `second-picker-*`.
6. Harness Web có selector quote sai sau Chat upload đã thành công; sửa riêng harness và tiếp tục RFQ. Delete lần đầu chưa tick checkbox nên chưa có mutation; tick control thật rồi xác nhận DELETE204. Không sửa Web để bỏ xác nhận.
7. Final health probe anonymous gặp 401 ở Bakery/Subscription/Order/Chat; source không public route này. Giữ quan sát trong `initial-cross-service-health-probe.json`, kiểm OpenAPI + API nghiệp vụ thật và ghi rõ endpoint được bảo vệ; không đổi security/đánh dấu app chết từ 401.
8. Kiểm artifact cần mở nested shared JAR; checker đầu đọc synthetic comparison key như ZIP path trực tiếp nên lỗi chẩn đoán. Sửa checker ngoài repo, đối chiếu class thật đạt. Docker inspect trả thứ tự mounts không ổn định; so sánh normalized mount/network sets, không coi đảo thứ tự là đổi cấu hình.

Launcher rehearsal đầu truyền evidence path absolute trong khi launcher hiện dùng đường dẫn tương đối dưới mobile; đổi cách gọi thành relative, không sửa source ngoài phạm vi. Các lỗi harness/tool ở trên không được ghi thành lỗi business đã giải quyết bằng mock.

## 17. Những vấn đề chưa giải quyết được

Không còn blocker cho acceptance local của bốn issue trong môi trường đã nêu. Các giới hạn vẫn tồn tại:

- Public HTTPS/DNS/TLS thực, truy cập trực tiếp public loopback từ container khác, thiết bị Android vật lý, iOS, release build/store và host reboot/power-loss chưa kiểm thử. Config hỗ trợ public HTTPS không đồng nghĩa triển khai đã đạt.
- Một số service nền đang chạy source cũ so với checkout: readiness rehearsal ghi Identity 12 đường dẫn khác, Bakery 1, Subscription 4; đây là source-drift có sẵn, không tự redeploy ngoài phạm vi. Compatibility chứng nhận với deployment đang chạy và source Chat/Marketplace/Cake đã kiểm, không chứng nhận toàn Backend theo HEAD.
- Không retest toàn bộ Gateway, register/address, checkout/order transitions, subscription/payment/email/AI provider; không dùng 85 tests của các module liên quan để tuyên bố tất cả microservice nghiệp vụ đạt.
- Chế độ no-Firebase vẫn không upload RFQ được theo chủ đích. Sandbox chỉ hoạt động khi người vận hành chọn opt-in với credential/project/bucket hợp lệ; khả năng truy cập mạng/quyền cloud trong tương lai có thể thay đổi.
- Journal giữ attachment trong RAM khi serialize/decrypt; chưa benchmark 5 tệp sát 10 MiB/tệp hoặc storage gần đầy trên thiết bị thật. Khi corrupt/mất key, giữ ciphertext và chặn gửi mới là hành vi có chủ đích, chưa có UI phục hồi thủ công nâng cao.
- Signed URL là bearer capability có thời hạn: ai sở hữu URL còn hạn có thể tải. Quyền lấy metadata và private bucket không được nới; xóa/revoke tức thời một URL đã chia sẻ không được bổ sung.

## 18. Đánh giá mức độ hoàn thành của từng ISSUE

| Issue | Original problem | Changes | Runtime verification | Final status |
|---|---|---|---|---|
| ISSUE-06 | Pending mất sau restart | Encrypted durable journal, write-before-send, recovery/isolation/reconciliation | Force-stop/cùng APK, mất ACK, retry ảnh200, unsent201, logout/account, server count1 | FULLY_RESOLVED_AND_VERIFIED trong local Android đã kiểm |
| ISSUE-02 | URL Docker-only không tải trên client | Internal I/O/public signing tách biệt, region/config/reverse port | Host/Android/Web bytes thật, private/expiry, storage restart; Docker dùng routing nội bộ mô tả rõ | FULLY_RESOLVED_AND_VERIFIED trong local đã kiểm |
| ISSUE-03 | Upload RFQ503 do deployment không dùng Firebase | Explicit sandbox config/mount, local cleanup safety/port alignment | Cloud upload/read/delete/checksum/restart, Android/Web thật, negative cases | FULLY_RESOLVED_AND_VERIFIED trong sandbox được phép |
| ISSUE-04 | Build shared SNAPSHOT không nhất quán | Official reactor script + packaged contract checks | Empty Maven repo, tests, repeat, actual Dockerfile/image/runtime classes | FULLY_RESOLVED_AND_VERIFIED cho workflow reactor được hỗ trợ |

Các trạng thái trên giải quyết vấn đề gốc, không mở rộng sang các phần NOT_TESTED tại mục 17.

## 19. Kết quả kiểm tra bảo mật và secrets

Root `.env` và **7 private files** liên quan: SHA-256, size và mtime không đổi; không xuất plaintext hoặc hash từng secret yếu vào báo cáo. Credential Firebase mount read-only và thực sự được tiêu thụ bởi Marketplace; không generate/copy/rotate Backend secrets. Không gọi provider tính phí hoặc production credentials ngoài sandbox đã được xác nhận.

Journal dùng private app storage và secure-key namespace riêng; disk chỉ có ciphertext, token không vào journal/ảnh/log. Test fixture cố định trong MinIO Testcontainers chỉ là credential của container disposable mới, không phải tài khoản ngoài. URL ký đầy đủ/Authorization/password không được ghi evidence; VM-service endpoint có auth được scrub khỏi log Android. Screenshot đã xem trực tiếp, không có màn hình password/token.

Đã scan phần source thay đổi, báo cáo và evidence text cho các giá trị bí mật liên quan được nạp chỉ trong RAM, private-key material, JWT và signed query đầy đủ; kết quả tại [secret scan](../../.diagnostics/remediation-20261108T101948Z/final-secret-scan.json). Scan là kiểm tra có phạm vi, không phải chứng nhận toàn bộ dữ liệu lịch sử không có secret.

Git HEAD/branch/index giữ nguyên; không commit/push. `frontend` byte/timestamp unchanged. 47 container gốc ngoài hai app được thay có cùng image/creation/status/port/network/mount sau normalize thứ tự; DB/volume không bị xóa/reset. [Docker integrity](../../.diagnostics/remediation-20261108T101948Z/docker-final-integrity.json).

`git diff --check` mặc định báo CR cuối dòng ở ba tệp đã tracked CRLF từ HEAD; kiểm lại với `cr-at-eol` đạt, không đổi Git config hoặc normalize cả file gây churn. File ignored `.idea/workspace.xml` đổi ngoài các patch của nhiệm vụ, giữ nguyên; `.swift_pm.lock` ephemeral chỉ đổi timestamp, nội dung giữ nguyên. Không đưa hai tệp này thành thay đổi implementation của task.

## 20. Danh sách toàn bộ file thay đổi

Bảng này so với baseline đầu đợt, không tính các thay đổi người dùng đã có trước. Đường dẫn giữ đúng `backend`, `mobile`, `frontend` chữ thường. Test Cake AI đã untracked trước đợt này được ghi là Modified.

| File | Created/Modified | Reason | Related issue | Verification |
|---|---|---|---|---|
| [backend/build-service.ps1](../backend/build-service.ps1) | Created | Build parent reactor và chứng nhận executable/shared | 04 | Cold Maven repo + Docker + repeat |
| [backend/chat-service/src/main/java/com/se193262/chatservice/config/StorageProperties.java](../backend/chat-service/src/main/java/com/se193262/chatservice/config/StorageProperties.java) | Modified | Public signing origin/region | 02 | 15 Chat tests + host/Android/Web/storage restart |
| [backend/chat-service/src/main/java/com/se193262/chatservice/feature/message/CONTEXT.md](../backend/chat-service/src/main/java/com/se193262/chatservice/feature/message/CONTEXT.md) | Modified | Cập nhật contract cấu hình storage | 02 | 15 Chat tests + host/Android/Web/storage restart |
| [backend/chat-service/src/main/java/com/se193262/chatservice/infrastructure/storage/MinioAttachmentStorage.java](../backend/chat-service/src/main/java/com/se193262/chatservice/infrastructure/storage/MinioAttachmentStorage.java) | Modified | Public signing origin/region | 02 | 15 Chat tests + host/Android/Web/storage restart |
| [backend/chat-service/src/main/resources/application.yml](../backend/chat-service/src/main/resources/application.yml) | Modified | Public signing origin/region | 02 | 15 Chat tests + host/Android/Web/storage restart |
| [backend/chat-service/src/test/java/com/se193262/chatservice/infrastructure/storage/MinioAttachmentStorageTest.java](../backend/chat-service/src/test/java/com/se193262/chatservice/infrastructure/storage/MinioAttachmentStorageTest.java) | Created | MinIO private bytes/expiry integration tests | 02 | 15 Chat tests + host/Android/Web/storage restart |
| [backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/CONTEXT.md](../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/CONTEXT.md) | Modified | Ghi rõ no-Firebase và sandbox opt-in | 03 | 38 Marketplace tests + actual Firebase lifecycle |
| [backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/infrastructure/scheduler/MarketplaceScheduler.java](../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/infrastructure/scheduler/MarketplaceScheduler.java) | Modified | Opt-out orphan scan cho shared sandbox; mặc định production giữ nguyên | 03 | 38 Marketplace tests + actual Firebase lifecycle |
| [backend/marketplace-service/src/main/resources/application.yml](../backend/marketplace-service/src/main/resources/application.yml) | Modified | Opt-out orphan scan cho shared sandbox; mặc định production giữ nguyên | 03 | 38 Marketplace tests + actual Firebase lifecycle |
| [backend/marketplace-service/src/test/java/com/se193262/marketplaceservice/infrastructure/scheduler/MarketplaceSchedulerTest.java](../backend/marketplace-service/src/test/java/com/se193262/marketplaceservice/infrastructure/scheduler/MarketplaceSchedulerTest.java) | Created | Opt-out orphan scan cho shared sandbox; mặc định production giữ nguyên | 03 | 38 Marketplace tests + actual Firebase lifecycle |
| [compose.local-runtime.yaml](../compose.local-runtime.yaml) | Modified | Storage env mapping và local port/upstream alignment | 02/03/04 | Compose default/sandbox resolves + runtime APIs |
| [docker-compose.chat-service.yml](../docker-compose.chat-service.yml) | Modified | Storage env mapping và local port/upstream alignment | 02/03/04 | Compose default/sandbox resolves + runtime APIs |
| [docs/BAKERY_PLATFORM_ISSUES_02_03_04_06_REMEDIATION_REPORT_VI.md](../docs/BAKERY_PLATFORM_ISSUES_02_03_04_06_REMEDIATION_REPORT_VI.md) | Created | Báo cáo duy nhất và liên kết bằng chứng | 02/03/04/06 | 22 mục, links/integrity scan |
| [mobile/lib/core/live/live_workspace.dart](../mobile/lib/core/live/live_workspace.dart) | Modified | Journal/recovery/UI và account lifecycle | 06 | 122 Flutter tests + Android restart |
| [mobile/lib/features/auth/data/live_session.dart](../mobile/lib/features/auth/data/live_session.dart) | Modified | Journal/recovery/UI và account lifecycle | 06 | 122 Flutter tests + Android restart |
| [mobile/lib/features/chat/CONTEXT.md](../mobile/lib/features/chat/CONTEXT.md) | Modified | Ghi rõ journal và chính sách logout | 06 | 122 Flutter tests + Android restart |
| [mobile/lib/features/chat/data/live_chat_repository.dart](../mobile/lib/features/chat/data/live_chat_repository.dart) | Modified | Journal/recovery/UI và account lifecycle | 06 | 122 Flutter tests + Android restart |
| [mobile/lib/features/chat/data/pending_chat_journal.dart](../mobile/lib/features/chat/data/pending_chat_journal.dart) | Created | Journal/recovery/UI và account lifecycle | 06 | 122 Flutter tests + Android restart |
| [mobile/lib/features/chat/data/pending_chat_message.dart](../mobile/lib/features/chat/data/pending_chat_message.dart) | Created | Journal/recovery/UI và account lifecycle | 06 | 122 Flutter tests + Android restart |
| [mobile/lib/features/chat/data/pending_chat_recovery.dart](../mobile/lib/features/chat/data/pending_chat_recovery.dart) | Created | Journal/recovery/UI và account lifecycle | 06 | 122 Flutter tests + Android restart |
| [mobile/lib/features/chat/presentation/live_chat_page.dart](../mobile/lib/features/chat/presentation/live_chat_page.dart) | Modified | Journal/recovery/UI và account lifecycle | 06 | 122 Flutter tests + Android restart |
| [mobile/pubspec.lock](../mobile/pubspec.lock) | Modified | cryptography direct và path_provider direct | 06 | 122 Flutter tests + Android restart |
| [mobile/pubspec.yaml](../mobile/pubspec.yaml) | Modified | cryptography direct và path_provider direct | 06 | 122 Flutter tests + Android restart |
| [mobile/test/auth_recovery_test.dart](../mobile/test/auth_recovery_test.dart) | Modified | Test journal hoặc inject test journal vào fixture hiện hữu | 06 | 122 Flutter tests + Android restart |
| [mobile/test/cake_ai_runtime_widget_test.dart](../mobile/test/cake_ai_runtime_widget_test.dart) | Modified | Test journal hoặc inject test journal vào fixture hiện hữu | 06 | 122 Flutter tests + Android restart |
| [mobile/test/chat_pending_recovery_test.dart](../mobile/test/chat_pending_recovery_test.dart) | Created | Test journal hoặc inject test journal vào fixture hiện hữu | 06 | 122 Flutter tests + Android restart |
| [mobile/test/live_widgets_test.dart](../mobile/test/live_widgets_test.dart) | Modified | Test journal hoặc inject test journal vào fixture hiện hữu | 06 | 122 Flutter tests + Android restart |
| [mobile/test/phase5_contract_test.dart](../mobile/test/phase5_contract_test.dart) | Modified | Test journal hoặc inject test journal vào fixture hiện hữu | 06 | 122 Flutter tests + Android restart |
| [mobile/test/phase5_widget_test.dart](../mobile/test/phase5_widget_test.dart) | Modified | Test journal hoặc inject test journal vào fixture hiện hữu | 06 | 122 Flutter tests + Android restart |
| [mobile/tool/start_mobile.ps1](../mobile/tool/start_mobile.ps1) | Modified | Public storage origin và adb reverse; giữ patch trước | 02 | Launcher prepare rehearsal + native image GET |
| [scripts/start-local-runtime.py](../scripts/start-local-runtime.py) | Modified | Explicit sandbox opt-in, reuse credential read-only | 03 | Default/sandbox Compose + actual runtime provenance |

Không có file Frontend, POM, migration/schema, credential hay `.env` nào trong danh sách sửa. Các thư mục build/cache được tool tạo là artifact generated, không stage; raw diagnostics/PNG/JAR/log nằm ngoài repository. Chỉ tạo **một báo cáo Markdown mới** là tệp này; CONTEXT được cập nhật tại chỗ theo module.

## 21. Các bước tiếp theo

Không cần thêm sửa source để đạt acceptance local của bốn issue. Khi cần build lại Cake AI trên máy này, dùng workflow đã được thực thi từ copy source:

```powershell
& .\backend\build-service.ps1 -Service cake-ai-service `
  -JavaHome 'C:\Program Files\Java\jdk-21' `
  -MavenCommand 'C:\Program Files\apache-maven-3.9.11\BIN\mvn.cmd' `
  -MavenRepository 'H:\MSS\.diagnostics\remediation-20261108T101948Z\maven-empty-repository'
```

Lệnh trên tạo `target` trong repo nếu người vận hành chạy tại repo; lượt kiểm chứng đã chạy bản copy ngoài repo. Không dùng artifact unclassified của Cake làm executable, không `mvn install` đè shared global để chữa triệu chứng.

Mobile có thể chạy launcher hiện hữu với `-ReuseRunningServices`, origin Cake 18105, `-DeviceId emulator-5554`, evidence path tương đối dưới mobile, `-ChatStorageUrl http://localhost:19006`; xem [rehearsal command](../../.diagnostics/remediation-20261108T101948Z/mobile-launcher-rehearsal.json). Launcher đã được diễn tập `-PrepareOnly`; normal APK đã build/install/start thật bằng các define trong [build command](../../.diagnostics/remediation-20261108T101948Z/flutter-debug-apk-final.json). Giữ DB/container/secret hiện hữu, không chạy prepare/reset để tạo lại cấu hình.

Trước môi trường mới: triển khai public HTTPS storage và kiểm CORS/TLS/client; kiểm iOS/Android vật lý và release; lập task riêng giải quyết source-drift/Gateway/hành trình chưa kiểm. Việc dùng Firebase sandbox tiếp tục cần cùng phạm vi tệp synthetic, không bật quét orphan trên bucket dùng chung khi chưa đối chiếu ownership toàn bộ.

## 22. Kết luận cuối cùng

Bốn vấn đề đã được sửa và có bằng chứng acceptance local riêng: dữ liệu pending sống qua restart thật; ảnh Chat public tải đúng bytes; RFQ làm việc với Firebase sandbox thật; Cake build bằng current reactor và Docker đóng gói đúng shared class. Các bài kiểm thử, lỗi trung gian và phần chưa kiểm được phân biệt trong báo cáo, không có thành công giả hoặc thay Backend bằng mock.

Đã giữ nguyên Frontend, root `.env`, private configuration, migration/schema, persistent DB/volumes và các thay đổi có sẵn của người dùng. Chưa commit/push. Báo cáo và evidence này là cơ sở đối chiếu cho runtime hiện tại; không phải chứng nhận triển khai production hoặc nhà cung cấp AI hoạt động.
