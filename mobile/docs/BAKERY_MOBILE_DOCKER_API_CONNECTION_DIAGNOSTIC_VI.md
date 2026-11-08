# Chẩn đoán SweetCake Mobile: Docker, kết nối API và đăng ký

Ngày thực thi: 07–08/11/2026, múi giờ Asia/Saigon. Revision được kiểm tra: `5ec7a890eb0f19838422042016098920d452d164`, branch `dev`. Kết quả dưới đây thuộc lần debug hiện tại; không lấy 55/55 Android UI của báo cáo trước làm PASS mới.

## 1. Tổng quan lỗi được báo cáo

Đã tái hiện cả Home không tải được dữ liệu và đăng ký bị khóa với kết quả “chưa xác định”. Khi bắt đầu, ba Spring service cùng DB Bakery/Subscription và MinIO của deployment Mobile đều dừng; bốn cổng host từ chối kết nối. ADB chưa có emulator online. Sau khi boot AVD và reverse đúng cổng nhưng vẫn để Backend dừng, Flutter tái hiện đúng hai lỗi.

| Problem | Nguyên nhân đã xác minh | Evidence | Fix location | Retest | Status |
|---|---|---|---|---|---|
| Home không tải | Bakery container dừng, port không lắng nghe; request Flutter thất bại ở kết nối | `baseline.json`, `before-ui.json`, ảnh before Home | Launcher Mobile reuse container và readiness | Home có product thật sau startup | FIXED_AND_RUNTIME_VERIFIED |
| Đăng ký bị gán uncertain khi chưa gửi được HTTP | NativeTransport bắt mọi exception của POST và gán `uncertain=true`, kể cả openUrl connection refused | `before-ui.json`, unit localhost socket | `transport.dart`, `contracts.dart` | Lỗi pre-send không khóa nút, không auto retry | FIXED_AND_RUNTIME_VERIFIED |
| Đăng ký uncertain bị mắc kẹt | Form chỉ khóa submit, không có recovery theo nghiệp vụ Identity | 201 thật rồi fault làm mất response; ảnh recovery/profile | `live_form.dart`, `live_auth_pages.dart` | Login/me xác nhận cùng ID, không POST register lặp | FIXED_AND_RUNTIME_VERIFIED |
| Recovery login thành công nhưng còn form login cũ | Stack gồm login → register → replacement login; pop một route lộ login bên dưới dù `/me` đã 200 | `after-final-ui.json`; widget regression | Callback success xóa các auth route, mở profile | Native recovery flow + widget kiểm cả offstage | FIXED_AND_RUNTIME_VERIFIED |
| Mất adb reverse với kết nối mới | Loopback emulator không còn listener host forward | `tail-ui.json`, ảnh missing reverse | Launcher thiết lập lại mapping | UI Retry tải dữ liệu thật | FIXED_AND_RUNTIME_VERIFIED |
| Startup guide không fail-fast / phụ thuộc bootstrap | Script cũ có side effect ngoài Mobile; preflight cũ không trả nonzero khi API unavailable | Source scripts, CLI failure test | `start_local_runtime.py`, `start_mobile.ps1`, preflight/README | Fresh PowerShell, readiness và app launch | FIXED_AND_RUNTIME_VERIFIED |
| Tool cleanup gỡ APK | Flutter drive mặc định stop rồi uninstall package | Source Flutter SDK `drive_service.dart`, package không còn sau test | Wrapper dùng `--keep-app-running` | Cold process restore ở namespace synthetic | FIXED_AND_RUNTIME_VERIFIED; tác dụng phụ cũ được công khai |
| Lần đăng ký thật trong screenshot trước task | Không có credential/log request lịch sử để đối chiếu chính xác | Không thử lại email/phone thật | Không thao tác tài khoản đó | Không đủ bằng chứng xác định record cụ thể | UNRESOLVED |

Toàn bộ evidence mới: [docker-api-diagnostic](evidence/docker-api-diagnostic/). Các root cause được xác minh cho tình huống tái hiện hiện tại; không khẳng định đã quan sát được command và mọi request của lần chạy trước trong screenshot.

## 2. Cấu hình môi trường hiện tại

Flutter 3.47.1, Dart 3.13.1, Java/Android toolchain hiện có. SDK/ADB/Emulator phát hiện tại `D:\HomeMind\audit-tools\android-sdk`, Flutter tại `D:\HomeMind\audit-tools\flutter`. Emulator 37.2.12, AVD `homemind_local_run`, serial `emulator-5554`, Android API 36. Các giá trị này là của máy thực thi, không phải defaults cho máy khác.

Working tree ban đầu đã có sửa `mobile/README.md` và xóa `mobile/docs.zip`; giữ nguyên việc xóa ZIP, không reset/restore/stage. Baseline bất biến mới lưu 3.099 tệp first-party ngoài Mobile và 608 directory memberships: [protected-baseline.json](evidence/docker-api-diagnostic/protected-baseline.json). [baseline.json](evidence/docker-api-diagnostic/baseline.json) có branch/HEAD/status, tool versions, container state, port bindings và kết quả host.

Command Flutter mà người dùng đã chạy trước task không được quan sát trực tiếp. Những command mới được ghi riêng trong checks và rehearsal logs.

## 3. Docker Compose và các service thực tế

Deployment dùng lại: project `bakery-mobile-20261107`, config ngoài repo `H:\MSS\.runtime\bakery-mobile-phases-1-4\compose.json`. Không chạy lại bootstrap, không sửa config/secret/ACL. Chỉ start đúng container hiện hữu theo dependency, giữ nguyên container IDs, images, networks và volumes.

| Thành phần | Compose service / container | Internal | Host đã xác minh | Trạng thái sau xử lý |
|---|---|---:|---:|---|
| Identity | `mobile-identity` / `bakery-mobile-20261107-mobile-identity-1` | 8080 | 18101 | HTTP ready; register/login/me/refresh/logout |
| Bakery | `mobile-bakery` / `bakery-mobile-20261107-mobile-bakery-1` | 8080 | 18102 | Public/catalog/onboarding/media đã gọi thật |
| Subscription | `mobile-subscription` / `bakery-mobile-20261107-mobile-subscription-1` | 8080 | 18104 | Plan/order/payment/period đã gọi thật |
| Bakery DB | `bakery-db` | 5432 | Không publish | Healthy và nghiệp vụ persisted |
| Subscription DB | `subscription-db` | 5432 | Không publish | Healthy và snapshot/period persisted |
| Identity DB dùng chung | `bakery-local-identity-db-1`, network alias `identity-db` | 5432 | Giữ mapping cũ | Healthy; không đổi password/role thủ công |
| MinIO | `mobile-storage` | 9000 | 19022 | Readiness 200, upload/read signed object |

Identity tham gia `bakery-local_default` và network riêng của project Mobile; Bakery/Subscription dùng network Mobile. DNS alias khác container name nên launcher resolve alias trên network chung, không gọi `docker inspect identity-db` như một tên container chắc chắn tồn tại.

Các stack `bakery-local`/`bakery-audit` cũ vẫn tồn tại nhưng phần lớn service dừng; không start cả bảy domain không liên quan. Root Compose là bộ merge nhiều file, không standalone: script root dùng `compose.yaml`, Bakery/Subscription, Order, Chat, services wiring, no-firebase và local-runtime overrides theo thứ tự. Root prepare/build tạo secrets và `backend/*/target/docker-runtime`; không chạy các nhánh ghi đó trong phạm vi read-only này.

Đối chiếu mới: 266 tệp source copy runtime trùng source hiện tại (81 Identity, 122 Bakery, 63 Subscription); JAR bind SHA trùng provenance bộ build đã có. Đây là kiểm tra artifact/source, không phải chạy lại Maven. Các Windows bind source tồn tại và mount read-only: [mount-verification.json](evidence/docker-api-diagnostic/mount-verification.json). `sourceExists` trên POSIX Docker VM path trong snapshot ban đầu không phải phép kiểm tra Windows host file.

## 4. Kiểm tra cổng và kết nối host

Trước fix: Identity/Bakery/Subscription/MinIO đều `ConnectionRefusedError` trên Windows host. Container app exit 137 nhưng `OOMKilled=false`; chỉ số exit này không đủ kết luận nguyên nhân daemon/container đã bị dừng. Không gán lỗi cho database corruption hoặc source code.

Sau startup: Identity OpenAPI, `/api/v1/products`, `/api/v1/subscription-plans`, MinIO readiness đều HTTP 200. DB healthy trước khi start app. Three app Docker healthchecks không phù hợp/không bật trong deployment này; `Up` được tách khỏi API readiness. [runtime-start.json](evidence/docker-api-diagnostic/runtime-start.json) và các bản `previous` giữ lịch sử.

Không sinh mới credential hạ tầng hoặc thay credential có sẵn, không đổi PostgreSQL password và không reset volume. Password của tài khoản synthetic mới chỉ giữ trong memory của test. Không có connection tới production; các HTTP test dùng loopback và service nội bộ của deployment local đã xác minh.

## 5. Kết quả kết nối Android Emulator

Normal launch AVD đã đưa ADB từ không có device sang `device`, `sys.boot_completed=1`, `bootanim=stopped`. Bốn reverse mappings theo actual port bindings được cấu hình. Đã phân biệt đủ bốn lớp: host HTTP, emulator forward, native Flutter HTTP client và UI render.

Test mất reverse chỉ gỡ mapping Bakery của app. Connection keep-alive cũ có thể vẫn chạy; lần thử đầu không tái hiện được mất kết nối vì còn socket cũ. Test tiếp theo đóng pool **trong test transport**, tạo kết nối mới, tái hiện lỗi Home; restore mapping và UI Retry đạt. Không dừng database hoặc service để giả lỗi mạng. [tail-ui.json](evidence/docker-api-diagnostic/tail-ui.json) là bằng chứng lượt đã đạt.

Không đổi hostname trong signed URL hoặc mở cleartext release. Android debug config hiện có cho loopback là phù hợp; không tìm thấy bằng chứng TLS/cleartext policy gây lỗi báo cáo.

## 6. Phân tích “Chưa tải được dữ liệu”

Chuỗi thật: `LiveCatalogPage(home:true)` → `LiveCatalogRepository.products` → `ApiClient.request(authenticated:false)` → `NativeTransport.send` → Bakery origin → decoder `ApiPage` → `LiveData`.

| Call site | Request thực tế | Contract | Trước | Sau |
|---|---|---|---|---|
| `live_public_pages.dart`, Home load | GET `http://127.0.0.1:18102/api/v1/products`, page/size/sort theo adapter | Envelope, `meta + result` | Socket failure, chưa có HTTP response | HTTP 200, ID sản phẩm thật render |
| Directory/detail/plan screens | Các public route Bakery/Subscription | Controller hiện tại | Chưa chạy khi service dừng | HTTP/UI qua metadata riêng |

Home có một data dependency chính cho phần catalog; không có chuỗi API độc lập bị gộp gây global error trong case này. Không cần redesign hoặc thêm fallback. Empty thành công, network failure và lỗi decode vẫn là trạng thái khác nhau. Ảnh lỗi được tách khỏi list error bằng widget media hiện có.

## 7. Nguyên nhân gốc của lỗi Home

Nguyên nhân được tái hiện là **Backend runtime dừng**, không phải danh sách rỗng. Thiếu reverse cũng là một nguyên nhân được chứng minh riêng với kết nối mới. Không phát hiện DTO/page contract, sort/query, source/runtime mismatch hoặc origin trỏ nhầm project gây lỗi trong lượt đã đạt.

Khắc phục bằng startup có kiểm chứng readiness và reverse, giữ thiết kế SweetCake. Không đổi business logic Backend, không thay Web, không mock sản phẩm/giá.

## 8. Phân tích lỗi đăng ký

Input contract source: email bắt buộc/Email/max 320; password 8–100; displayName bắt buộc/max 120; phone tùy chọn/max 30. Không áp đặt phone regex mới. Flutter form validation được kiểm tra trước network. Request đúng Identity origin, `POST /api/v1/auth/register`, JSON với các field này; không cần Bearer/cookie.

NativeTransport cũ catch mọi exception của POST rồi đặt `uncertain=true`. Với `openUrl` connection refused, chưa thể gửi HTTP body nhưng UI vẫn coi có thể đã ghi dữ liệu. `LiveFormPage` khóa submit khi uncertain và chỉ bảo quay về “danh sách”, không phù hợp việc kiểm tra account. Notice password-reset/address không liên quan còn xuất hiện ngay trên register.

## 9. Kết quả request đăng ký

| Case hiện tại | Backend / transport | UI / kết luận |
|---|---|---|
| Invalid input | Không POST | Validation hiện, không đổi dữ liệu |
| Service/port không kết nối trước send | Socket refused, không HTTP status | Có thể sửa mạng rồi nhấn lại; không auto retry POST |
| New synthetic Customer | HTTP 201 | Notice đã tạo, chuyển login; login/me 200 đúng user |
| Email synthetic trùng | HTTP 409 | Known rejection, recovery login; password nhập lại |
| Controlled invalid body sau client validation | Identity HTTP 400 | Known validation rejection, submit không mắc kẹt |
| Controlled response loss sau real 201 | Identity đã trả 201 và ID; test boundary làm mất phản hồi phía form | Giữ conservative lock; recovery login/me trả cùng ID; không POST register lặp |
| Native HTTP timeout sau server nhận body | Local socket unit server nhận 1 request, client timeout | uncertain=true; không tự retry |

Fault response-loss/invalid-body được ghi rõ `mode`; không coi là timeout tự nhiên của Identity. Unit malformed 400/201 giữ `responseStatus`, phân biệt invalidResponse với connection/timeout. Không biến uncertain thành thành công giả.

## 10. Trạng thái bản ghi tài khoản

Synthetic case thành công có ID trong trace 201 và cùng ID ở `/me`. Case response-loss có đúng một 201, sau đó login/me cùng ID, chứng minh account đã tồn tại trước recovery. Case refused-before-send không có thao tác ghi từ request đó. Case validation 400 không được tính account-created.

Sau diễn tập README, đã kiểm tra thêm bằng APK chính `lib/main.dart`, không bật FlutterDriver extension: đăng ký qua UI báo thành công, login UI hiển thị đúng Customer mới, host login và `/me` bằng cùng credential trả 200. Credential synthetic chỉ giữ trong memory của process điều khiển; không đưa vào argv, file, log hoặc dart-define. Lượt điều khiển đầu bị EOF ở stdin sau khi đăng ký đã thành công; giữ riêng [first-confirmed](evidence/docker-api-diagnostic/canonical-registration-first-confirmed.json), không gửi lại đăng ký cho email đó. Lượt tiếp theo dùng email synthetic mới, đi hết đăng nhập → cold restart → đăng xuất. [canonical-registration.json](evidence/docker-api-diagnostic/canonical-registration.json) ghi bằng chứng đối chiếu; không ghi nhận trực tiếp HTTP status của POST register trong bản main, nên không lấy nó làm một trace 201 mới.

Không retry email thật trong screenshot, không dùng password/phone thật trong automation và không truy vấn database. **Trạng thái record cụ thể của lần thử thật trước task chưa xác minh** vì không có credential/request history phù hợp. Người dùng có thể dùng đường login recovery để đối chiếu; login thất bại khi mạng/password chưa đúng cũng không chứng minh account không tồn tại.

## 11. Nguyên nhân gốc lỗi đăng ký

Hai lỗi Mobile xác minh được: phân loại lỗi pre-send thành uncertain sai, và không có đường recovery cho outcome thực sự chưa rõ. Thêm lỗi navigation được phát hiện khi retest: login/me thành công nhưng pop một route làm lộ form login cũ trong stack; đã sửa bằng callback success xóa các auth routes.

Nút khóa **là đúng** khi request có thể đã commit; lỗi là không có đường kiểm tra account. Sau fix, lỗi chắc chắn chưa gửi giữ khả năng thao tác lại; outcome chưa rõ dẫn sang login, giữ email và bỏ password cũ.

## 12. Các thay đổi Mobile

- `contracts.dart`: failure kind và HTTP response status nhận được.
- `transport.dart`: track giai đoạn có thể đã gửi request; phân biệt connection/timeout/invalid response; không tự retry mutation.
- `live_session.dart`: duplicate email copy rõ, register 5xx/invalid envelope được xử lý conservative.
- `live_form.dart`: recovery builder, success callback, bỏ password khỏi values khi dispose; generic form khác giữ mặc định.
- `live_auth_pages.dart`: register success notice/login, recovery giữ email nhưng yêu cầu password mới, xóa auth stack sau login, bỏ notice không liên quan khỏi register.
- Tools/tests/docs mới nằm trong Mobile. Không đổi Android cleartext config hoặc API origins mặc định vì origin hiện tại đã đúng.

Áp dụng Impeccable harden/craft floor theo visual world hiện có; giữ palette, type, control và native navigation. Không làm lại design hoặc cài/sửa skill.

## 13. API Phases 1–4 được kiểm tra lại

| Service | Adapter inventory | Current Backend HTTP 2xx | Current Android UI transport 2xx |
|---|---:|---:|---:|
| Identity | 5 | 5 | 5 |
| Bakery | 35 | 35 | 9 |
| Subscription | 15 | 15 | 6 |
| Tổng | **55** | **55** | **20** |

[Ma trận 55 hàng](CURRENT_API_REGRESSION_DIAGNOSTIC_VI.md), [coverage JSON](evidence/docker-api-diagnostic/current-api-coverage.json). Mỗi operation là service + method + normalized route. **Không tuyên bố 55/55 UI PASS**. 2xx transport không tự chứng minh UI đã phản ánh mọi mutation hoặc mọi nhánh permission.

Backend HTTP regression có 69 request đạt kỳ vọng trên fixture mới: onboarding → Admin bakery approval → payment reject/resubmit/approve → Owner grant → catalog CRUD/options/images/publish/hide/archive → gia hạn SCHEDULED, price snapshot, legacy branch. Chỉ xóa/disable category/add-on/ảnh/draft do chính fixture này tạo. Không xóa dữ liệu cũ để tăng coverage. Metadata payment/proof hoàn toàn synthetic, không chuyển tiền thật.

## 14. Flutter analysis, tests và build

Format và analyze cuối đạt, không issue. **54/54 unit/widget đạt**: baseline 46 + 5 test network/auth + 3 test form/recovery/navigation. 26 trong tổng này là regression preview demo, không phải Backend live. Android debug build target main đạt; các log/timing thật ở [checks.json](evidence/docker-api-diagnostic/checks.json).

Preflight CLI có unit fault injection unavailable → exit 1, và launcher actual unavailable → exit khác 0; không biến “có report JSON” thành readiness PASS. Lịch sử lỗi harness locator/compile được tách khỏi lỗi app và giữ các kết quả đã có.

## 15. Kết quả Android thực tế

Đã xác minh Home, public bakery/product/plan detail, input validation, signup/login/me/logout/refresh, duplicate và uncertain recovery, Owner profile/catalog/category/add-on/subscription reads, Admin bakery/plan/payment reads. Signed object GET 200 và hash bytes đúng file upload; không lưu signed URL. Screenshot chỉ dùng dữ liệu synthetic.

Cold process test dùng namespace secure storage **riêng cho synthetic test**, force-stop rồi start Activity và kiểm tra refresh/me trả cùng Owner ID: [cold-process-check.json](evidence/docker-api-diagnostic/cold-process-check.json). Không dùng kết quả in-process thay cold restart.

Bản main thông thường sau README cũng đã đi hết luồng bằng native UI: [đăng ký thành công](evidence/docker-api-diagnostic/canonical-registration-success-login.png), [hồ sơ sau login](evidence/docker-api-diagnostic/canonical-registration-native-profile.png), [hồ sơ sau force-stop/start](evidence/docker-api-diagnostic/canonical-registration-cold-profile.png), [đăng xuất](evidence/docker-api-diagnostic/canonical-registration-logged-out.png). Tên/email synthetic, role CUSTOMER và trạng thái ACTIVE khớp trước/sau restart; màn hình cuối trở về guest và báo server xác nhận thu hồi refresh token. Đây là kiểm tra session store mặc định của bản main với dữ liệu test mới; không thay kết luận về dữ liệu app cũ bị ảnh hưởng bởi Flutter drive. Các ảnh đã được xem trực tiếp, kết quả ở [canonical-visual-review.json](evidence/docker-api-diagnostic/canonical-visual-review.json). Để app ở trạng thái guest sau kiểm tra.

Tác dụng phụ cần công khai: Flutter drive mặc định gỡ APK khi test kết thúc; các lượt đầu đã dùng default này. Sau phát hiện, wrapper thêm `--keep-app-running` và cold test đạt. Vì vậy **không khẳng định dữ liệu app cục bộ trước các lượt đó được giữ nguyên**. Không wipe AVD, không reset/xóa dữ liệu Backend; không tạo lại password thật. Test không đọc namespace credential thật, nhưng uninstall có thể xóa app data. Đây là giới hạn của quá trình kiểm thử, không được che bằng trạng thái PASS.

## 16. Quy trình Backend/Docker startup đã xác minh

Từ `mobile` trong PowerShell mới:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\tool\start_mobile.ps1
```

Chỉ để auto-run trả terminal trong diễn tập: thêm `-NoResident`. Script resolve deployment/DB alias từ metadata, start đúng dependency, đợi DB healthy và business HTTP 200, tìm SDK/AVD/device thật, đợi Android boot, reverse actual ports, pub get và chạy main bằng explicit public dart-defines. Không chạy Maven/npm trong protected source hoặc ghi external config.

Các command/cwd/exit được ghi ở [readme-rehearsal.json](evidence/docker-api-diagnostic/readme-rehearsal.json); README được viết **sau** khi method startup reuse đã chứng minh, rồi được thực hiện lại từ terminal mới. Đây là máy đã có deployment/images/secrets/JAR, không phải fresh clone bootstrap.

Lượt diễn tập đầu phát hiện lỗi parse cột ADB trong launcher mới, nên dù emulator online script chưa tìm được serial và trả exit 1. Đã thay regex bằng tách cột tab/space, giữ log lỗi, chỉ chạy lại canonical sequence: **exit 0**, boot `1`/`stopped`, đủ bốn mappings, đúng `lib/main.dart` và public origins. Normal APK cuối hiển thị Home và hai sản phẩm thật: [Home](evidence/docker-api-diagnostic/canonical-main-home.png), [Explore](evidence/docker-api-diagnostic/canonical-main-explore.png). Không báo lần diễn tập thất bại là PASS.

Đăng ký synthetic, login, cold restart và logout đã được thực hiện tiếp trên chính bản main vừa khởi chạy bằng quy trình này; xem mục 10 và 15. Không tăng số 20/55 UI transport operation bằng các screenshot không có transport hook.

## 17. Sai sót và giới hạn README cũ

1. `recreate_runtime_h.py` là bootstrap/reconstruction có side effect ACL/config bên ngoài; không nên là lệnh restart thường ngày trong task read-only.
2. Cần container mẫu/cache/JAR/secrets và canonical Identity DB/network, nhưng các prerequisite chưa thành một check fail-fast; lệnh start DB chỉ ở comment.
3. Preflight cũ print trạng thái unavailable nhưng implicit exit 0. Đã sửa exit code và thêm `--output` để giữ evidence cũ.
4. Raw Compose có chuỗi credential chứa `$`; so raw config với container cho thấy khác tên của năm biến client-secret-hash. Mounted grants hiện tại vẫn làm service auth hoạt động, đã kiểm tra bằng real cross-service flows. Không khẳng định đây là nguyên nhân Home/register hiện tại, không in các đoạn nội suy hoặc sửa external file.
5. Cổng/serial/path lịch sử chỉ là ví dụ; không đủ chứng minh environment hiện tại đang chạy. Host HTTP/TCP không thay cho Flutter request/render.

Không quan sát được command cũ người dùng đã gõ nên không bịa một stderr cụ thể cho lần đó. Script bootstrap/root build không được chạy nguyên bản vì sẽ ghi các vị trí được bảo vệ; đã đọc source/Compose order và chọn reuse runtime hiện hữu.

## 18. README mới

Tập trung Docker → readiness → Emulator boot → reverse → Flutter. Tự lấy ports từ container và dùng cùng origins cho dart-defines, một entrypoint tự khai báo biến nên terminal mới không thiếu state. Có discovery commands, prerequisite/missing-runtime blocker, safe restart, troubleshooting và account reconciliation.

Các nhánh Docker Desktop đang tắt, device offline/Cold Boot và Android Studio GUI được ghi rõ **chưa trực tiếp diễn tập** trong lượt này; không claim đã thử mọi điều kiện trên máy khác. Không hướng dẫn wipe/prune/reset để né lỗi.

## 19. Backend/config chưa xử lý trong phạm vi Mobile

Không có Backend defect chặn 55 operation HTTP đã thử. Những capability còn thiếu trước đây (private discovery đa tiệm, full draft options/images read, profile edit/address/reset password) không được tự thêm endpoint hay sửa Backend.

Mismatch interpolation ở năm env client hash thuộc external config được bảo vệ, giữ nguyên; launcher dùng environment container đã hoạt động và mounted grants. Không sửa Gateway hoặc triển khai routing mới. Nếu cần recreate deployment, phải có task cấu hình riêng được phép kiểm tra/chuẩn hóa secrets, không dùng Mobile để âm thầm sửa.

## 20. Chưa xác minh

Record của account thật trong screenshot; command và reverse map chính xác tại thời điểm ảnh được chụp; nguyên nhân container bị dừng trước task; outage/timeout tự nhiên sau Identity commit; mọi tổ hợp input/role/rate limit; tất cả 55 operation qua UI; iOS/Android Studio GUI/physical device/TalkBack/release perf/host reboot/fresh-machine bootstrap. Failure-loss/validation injection và unit timeout được ghi đúng lớp kiểm thử, không gọi là sự cố Backend tự nhiên.

## 21. Bước tiếp theo

Chạy launcher mới trước khi mở app, kiểm readiness và mapping sau ADB/emulator restart. Với đăng ký chưa rõ kết quả, dùng login recovery thay vì gửi lại. Nếu login không xác nhận được, giữ nguyên kết luận chưa đủ bằng chứng và kiểm connection/password; không tự tạo account thật bằng credential khác.

Task riêng có thể chuẩn hóa bootstrap Compose secret interpolation, giám sát readiness hoặc bổ sung API thiếu theo contract được duyệt. Không mở rộng Marketplace/RFQ/Order/Checkout/Chat/AI và không stage/commit/push/deploy trong nhiệm vụ này.

## 22. Xác minh không thay đổi Backend/Frontend

Final guard đối chiếu SHA/size/mtime/directory membership với baseline đầu task, HEAD/status và staged files. Bản sửa README có trước được lưu ở `readme-before.md`; xóa `mobile/docs.zip` có trước không bị đảo ngược. Mọi tệp code/tool/docs mới hoặc sửa đều nằm trong Mobile.

Kết quả cuối: **PASS**, 3.099 tệp ngoài Mobile không đổi; directory memberships và metadata external config/secrets không đổi, HEAD giữ nguyên, không có staged file, `git diff --check` exit 0. Known-secret/pattern scan không có match trong Mobile hoặc 144 entries của APK main; đây là phép quét các giá trị đã biết/pattern, không phải bảo đảm phát hiện mọi secret có thể tồn tại. [Readiness cuối](evidence/docker-api-diagnostic/final-runtime/runtime-before.json) tiếp tục đạt HTTP 200 cho ba service và MinIO; app main để ở Home sau logout: [ảnh cuối](evidence/docker-api-diagnostic/final-main-home.png).

[final-verification.json](evidence/docker-api-diagnostic/final-verification.json) ghi kết quả boundary, external config/secrets metadata trước/sau rehearsal, secret scan và Git diff check. Hash metadata không tiết lộ secret. Không có password/token/raw body/cookie/signed URL hoặc PII thật trong evidence chủ động tạo. Một lệnh Compose discovery ban đầu đã phát cảnh báo có đoạn nội suy nhạy cảm ra tool output; không sao chép các đoạn đó vào log/report và các lệnh sau đều capture/filter. Không tuyên bố có thể rút lại tool output đã xuất hiện.
