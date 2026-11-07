# Báo cáo thực thi SweetCake Mobile — API thật Phases 1–4

Ngày 07/11/2026. Bản báo cáo ghi những gì đã thực hiện và giới hạn bằng chứng, không kế thừa PASS của audit Backend trước làm kết quả Mobile.

## 1. Phạm vi, revision và môi trường

Repository `H:\MSS\Bakery-Platform`, branch `dev`, HEAD `addfd7746021ef5267b3946e7b1e9cdc6545496a`. Chỉ sửa repository trong `mobile/`; đọc Backend/Web/root docs/config để đối chiếu. Thư mục lowercase `backend`, `frontend`, `mobile` được giữ nguyên.

Flutter 3.47.1 / Dart 3.13.1, Java 21.0.8, Android SDK/API 36, Emulator 37.2.12, AVD `homemind_local_run`, `emulator-5554` x86_64, Docker Engine 29.6.1 / Compose 5.3.0, Node 22.20.0 / Vite 8.3.1. Không nâng SDK/channel, tự accept license hoặc thay backend business logic. Xem [README](README.md) để chạy trên cùng máy.

## 2. Kết quả bốn phase

| Phase | Đã tích hợp | Adapter | Operation Android UI 2xx | Tình trạng |
|---|---|---:|---:|---|
| 1 | Home/catalog, tiệm/product detail, public plans | 6 | 6 | Dữ liệu server thật; search/detail/media đã đối chiếu |
| 2 | Register/login/me/refresh/logout, session, role | 5 | 5 | JWT + cookie native; cold-start được kiểm tra riêng dưới runbook |
| 3 | Onboarding, hồ sơ/operations/membership/media, categories/products/options/add-ons, publish/hide/archive; Admin bakery | 31 | 31 | Positive flow hoàn chỉnh; còn thiếu Backend discovery/private draft read |
| 4 | Plans, current/scheduled subscription, orders, manual metadata/proof, capabilities, Admin payment/plan CRUD/archive | 13 | 13 | ACTIVE/SCHEDULED/snapshot đã xác minh; không chuyển tiền thật |
| Tổng | Identity 5 + Bakery 35 + Subscription 15 | **55** | **55** | `RUNNING_WITH_LIMITATIONS`, không tuyên bố mọi nhánh đã cover |

## 3. Inventory và cách đếm

[Ma trận API](docs/API_INTEGRATION_MATRIX_PHASES_1_4_VI.md) có 55 hàng, mỗi hàng là service + method + normalized route, auth/DTO/dependency/source controller và trace runtime. [integration-summary.json](docs/evidence/api-integration-phases-1-4/integration-summary.json) là bản máy đọc. Không cộng `/internal/`, Gateway chưa có route, duplicate request hoặc probe vào số operation tích hợp.

Adapter implemented và Android UI HTTP 2xx là hai trạng thái riêng. Một operation 2xx không chứng minh mọi filter/input/permission/timeout. Hai probe replay/conflict gắn lớp riêng; HTTP Backend preflight/reconciliation không được tính là thao tác Flutter.

## 4. Truy vết màn hình và thao tác

| Màn hình / thao tác | Operation trong ma trận | Implementation |
|---|---|---|
| Home/Explore/tiệm/product/bakery detail | BKR public list/detail/product cùng SUB-013/015 cho plans | `live_public_pages.dart`, `live_catalog_repository.dart` |
| Đăng ký/đăng nhập/hồ sơ/refresh/logout | IDN-002 đến IDN-006 | `live_auth_pages.dart`, `live_session.dart` |
| Owner profile/onboarding/complete/legacy branch | BKR-005/006/007/009/019/020/021/022/023/033 | `live_owner_profile.dart` |
| Owner catalog/category/add-on/options/media/state | Các BKR quản trị catalog còn lại | `live_owner_catalog.dart`, `live_editor_schemas.dart`, `structured_form.dart` |
| Admin bakery list/detail/status | BKR-001/002/003 | `live_admin_bakeries.dart` |
| Public plan/owner subscription/order/payment | SUB-008 đến SUB-015 | `live_subscription_pages.dart`, `live_payment_page.dart` |
| Admin payments / plans | SUB-001 đến SUB-007 | `live_admin_subscription.dart` |

Các số operation chỉ là khóa inventory, không phải route giả. Chi tiết method/path chính xác lấy từ từng hàng ma trận và controller hiện tại.

## 5. Kiến trúc HTTP và dữ liệu

Live router → feature repository → ApiClient → native `dart:io HttpClient`; composition tại `LiveWorkspace`. Không dùng WebView, Vite proxy làm transport Mobile, database trực tiếp hoặc backend mock. URL công khai tập trung ở `ApiEnvironment`; debug loopback, release buộc HTTPS origin được cấu hình rõ. Không cho redirect mang credential sang host khác.

Envelope/page theo source: `statusCode/data`, `meta{page,pageSize,pages,total}+result`, page từ 1, một số endpoint trả array, 204 không parse JSON. TokenResponse dùng `expiresIn`, không dùng field cũ `expiresInSeconds`. Tiền dùng BigInt cents/decimal string; total và snapshot lấy server, không tính checkout ở client.

Timeout connect/request, GET retry giới hạn một lần cho lỗi tạm thời; mutation không tự gửi lại. Error copy không in response nhạy cảm/stack. Private request có context/account fence và cancel scope tách khỏi Identity rotation; logout/chuyển tiệm xóa cache, phản hồi đến muộn không tái lập dữ liệu cũ.

## 6. Authentication, cookie, logout và role

Mật khẩu chỉ nhập trong form, không lưu app. Access JWT/expiry và opaque refresh cookie lưu OS secure storage; Android dùng namespace riêng, AES-GCM và RSA OAEP wrapping theo plugin. Giữ raw cookie attributes, chỉ gửi refresh cookie tới đúng Identity origin gồm cả port và `/api/v1/auth` path boundary; tôn trọng Secure/expiry. Bakery/Subscription không nhận cookie này.

Refresh single-flight; GET có thể replay sau 401 một lần, mutation yêu cầu đối chiếu rồi gửi lại. Refresh tạm lỗi giữ khả năng khôi phục, invalid refresh xóa phiên. Logout xóa phiên local trước, gửi JWT + cookie đúng source; nếu server revoke chưa được xác nhận thì UI nói rõ. Phản hồi refresh về muộn không phục hồi phiên đã logout.

Role lấy `/me`, refresh sau complete onboarding để nhận JWT mới. Admin credential hợp lệ được tìm lại từ external file, không tạo quyền bằng SQL, không nhúng vào APK. Dữ liệu kiểm thử Customer mới được đăng ký qua UI. Kiểm tra storage in-process và OS process là hai lớp độc lập. Cold process normal APK đã xác nhận một lần: PID đổi, profile Owner khôi phục sau khi khởi tạo xong, không nhập lại credential. Các lượt setup chưa login và ảnh còn loading không được tính PASS; xem [runbook](docs/LOCAL_RUNBOOK_VERIFICATION_VI.md).

## 7. Onboarding và ownership

Customer gửi hồ sơ cùng địa chỉ/khu vực/giờ hoạt động → membership OWNER ACTIVE → Admin duyệt bakery → mua gói/payment được approve → complete onboarding 204 → refresh/me có BAKERY_OWNER. Đã đi trọn luồng này; không đổi role local để mở catalog.

GET onboarding chỉ trả membership đầu tiên phù hợp, chưa có danh sách private đầy đủ các bakery của user. App chỉ chọn trong bakery đã được Backend xác minh trong session. Legacy Owner tạo chi nhánh và submit được kiểm tra bằng actual write response, sau đó Admin GET xác nhận persist. Login lại không tự đoán chi nhánh từ public directory. Member hiện chỉ đọc; Admin không mặc nhiên có ownership.

## 8. Subscription và phụ thuộc xuyên phase

Plan/order/payment dùng server snapshot. Một order ban đầu được tạo qua UI, proof tổng hợp và manual reference được gửi; Admin reject có note, Owner sửa reference rồi gửi lại; approve tạo ACTIVE. Owner activation và publish entitlement được kiểm chứng sau đó.

Sau PATCH giá plan, logical renewal mới tạo order/key mới; Admin approve tạo SCHEDULED sau ACTIVE. Archive plan không làm đổi snapshot đơn đã hoàn tất: đơn đầu 100.000 VND, renewal 120.000 VND. Create order/payment/approve có UUID Idempotency-Key; cùng thao tác chưa rõ kết quả giữ key, hoàn tất logical action sau readback mới cho key mới. Probe native replay 201 cùng ID và conflict 409 được tách khỏi UI count.

Không báo metadata submit là tiền đã vào tài khoản. Không giả sandbox credential; chỉ hiện sandbox khi capability thật bật. Không phát sinh real payment hoặc external email.

## 9. Mock đã gỡ khỏi luồng tích hợp

`main()` mặc định tạo LiveWorkspace và LiveRouter. Home/profile/Owner/Admin/subscription không lấy fixture metrics, persona, fake role, fake success hoặc fake ID. API lỗi hiển thị lỗi/retry, không fallback demo. Product chưa có ảnh dùng trạng thái trung tính, không gắn ảnh mẫu vào bản ghi server.

DemoWorkspace và 35 route preview cũ được giữ cho regression/entrypoint được inject rõ ràng, không có công tắc Demo trong app live, không nhận credential/ID live. Marketplace/RFQ/Offer, cake Order/Checkout/Review, Chat, AI, Admin Users/Revenue/Settlement đều ngoài phạm vi và live router báo không khả dụng.

## 10. UI và độ trung thành thiết kế

Giữ wine `#6B212E`, accent `#C05477`, hồng nhạt, font Plus Jakarta Sans/Dancing Script, wordmark và mascot Web, assets đã có. Customer nền hồng, Owner/Admin nền slate; native form/dialog/picker/navigation và hit target phù hợp touch. Không sửa Web design, token extraction gốc hoặc Backend.

Thêm loading/empty/error/retry, dirty-form guard, disabled/busy, uncertain mutation copy, full replacement warning. Màn hình operational detail giữ navigation Owner/Admin. Form live kiểm tra 320px và text scale 1.8; dữ liệu dài cuộn/wrap. Chưa tuyên bố TalkBack hoặc release performance PASS.

## 11. Taste và Impeccable

Đã đọc skill local cùng các reference native/craft/harden/audit phù hợp; context launcher Impeccable chạy một lần. Áp dụng theo visual world người dùng đã chốt, không tự tạo palette/concept mới. Review ảnh emulator Home, product, Owner/Admin, payment và ACTIVE/SCHEDULED cạnh Web thực. PRODUCT/DESIGN đã cập nhật từ bối cảnh demo sang live.

Không thay hoặc cài đè các skill ngoài `mobile/` ở nhiệm vụ này; skill hiện có được giữ nguyên. Những checker dành cho website không được coi là native UI PASS. Nguồn thuật toán/storage options: [AndroidOptions 10.3.4](https://pub.dev/documentation/flutter_secure_storage/10.3.4/flutter_secure_storage/AndroidOptions-class.html).

## 12. Emulator networking và media

`adb reverse` bốn cổng 18101/18102/18104/19022; origin `127.0.0.1` giữ nguyên signed media URL, không đổi Docker hostname vào chữ ký. Android debug chỉ cho cleartext loopback/10.0.2.2; không tắt TLS validation hoặc mở HTTP release. API `/internal/` không được Mobile gọi.

Native document picker, kiểm byte/MIME/size cho JPEG/PNG/WEBP; proof thêm PDF. Multipart metadata dùng `application/json`, chứng từ ≤10 MiB. Product/logo/cover đã upload thực và GET 200 từ MinIO. Ảnh upload là asset demo đã có dùng như **file dữ liệu kiểm thử**; không phải ảnh kinh doanh thật hoặc runtime fallback. Proof PNG tổng hợp có nhãn không chuyển tiền. PDF upload được hỗ trợ nhưng chưa có inline PDF viewer hoàn chỉnh.

## 13. Kết quả kiểm thử

46/46 unit/widget PASS cuối cùng: 14 foundation, 6 live widget/validation, 26 regression demo. Format/analyze/debug APK exit 0. 55/55 operation có Android UI 2xx, 8/8 preflight, 15/15 reconciliation, 3/3 media reads; hai điều kiện idempotency probe đạt riêng. Không gộp các mẫu số này.

Kết quả, lỗi đã sửa, test boundary và giới hạn chi tiết ở [báo cáo kiểm thử](docs/API_INTEGRATION_TEST_RESULTS_PHASES_1_4_VI.md). Final commands và log exit thật ở [commands.json](docs/evidence/api-integration-phases-1-4/commands.json). Cảnh báo KGP/SDK/toolchain còn được giữ, không che bằng nâng phiên bản ngoài phạm vi.

## 14. Bằng chứng runtime

[Thư mục evidence](docs/evidence/api-integration-phases-1-4/) chứa sanitized requests/results, screenshots Android/Web, source/runtime hashes, preflight, build/test logs, replay/conflict metadata và các run trước. Không lưu password/token/raw headers/signed URL vào report.

Các ID local để đối chiếu: bakery `33e60a6f-7751-423d-a6f0-584df99a06d6`; published product `361b1c6a-8305-4ddb-bea6-60004f29f986`; original order `70a8c5bd-5fea-4a9a-bae0-ac5efce7f67e`; renewal `6d989576-a762-4392-8150-7e8f5088b73f`; branch `bdbc3954-9858-457a-8a4f-20ee3d1c2958`. Đây là ID do server cấp, không hardcode vào live application.

## 15. README và cách chạy đã diễn tập

[README](README.md) là canonical procedure. Fresh PowerShell thực hiện Docker reuse/readiness, Web, SDK/device/reverse/pub get; Android UI kiểm tra đại diện cả bốn phase và Admin. Restart riêng Bakery xong dữ liệu vẫn đúng. Main `flutter run --no-resident` exit 0. Lần đầu locator logo của rehearsal sai được giữ lịch sử và chỉ rerun bước bị ảnh hưởng.

[Runbook verification](docs/LOCAL_RUNBOOK_VERIFICATION_VI.md) tách CLI, process restart và Android Studio. Android Studio GUI **NOT_VERIFIED** do desktop automation kernel lỗi/IDE không xác nhận; iOS **NOT_VERIFIED** vì Windows không có Xcode. Không gọi đây là kiểm thử máy sạch hoặc host reboot.

## Cấu hình môi trường, Docker và kết quả khởi chạy thực tế

Runtime bền vững được tạo theo ủy quyền bổ sung tại `H:\MSS\.runtime\bakery-mobile-phases-1-4`, không nằm trong repository. Dùng lại Identity DB/RSA/Admin hợp lệ, so migration byte-identical; Bakery/Subscription DB và MinIO volume mới. Ba JAR build từ bản sao đúng source, không sửa source/config hệ cũ. Core Phases 1–4 chạy thực; Gateway chưa khả dụng nên debug gọi ba public service origins tập trung.

[Báo cáo môi trường riêng](docs/ENVIRONMENT_RUNTIME_PHASES_1_4_VI.md) có service/container/network/volume/port, profile, từng tên biến/nguồn/kiểm chứng, generated credentials, hạn chế và lệnh restart. Password hai DB mới và storage secret có 256 bit entropy, sinh một lần/persist ngoài Git; không rotate key established, không tạo external production credential giả. Compose up/restart giữ cấu hình và dữ liệu. Không chạy prune/down -v/reset DB.

## 16. Tệp đã thay đổi trong Mobile

Nhóm foundation `lib/core/api/`, `core/live/`, auth/data; repository feature-first catalog/subscription; live router và các presentation live; native common form/data/upload/scaffold. `main.dart` chọn live mặc định. Dependencies chỉ thêm secure storage/file picker/crypto đã pin.

Android thêm INTERNET, debug network security, label/backup policy và workaround Kotlin cache trong project. Không thay iOS ATS để chạy HTTP. Test mới và test demo entrypoint được tách rõ. `tool/` thêm guard/preflight/runtime/rehearsal/driver/reconciliation; sửa script cũ ghi evidence về Mobile. README/PRODUCT/DESIGN/ma trận/test/runbook/report/evidence nằm trong Mobile.

Danh sách và SHA/bytes chính xác: [file-manifest.json](docs/evidence/api-integration-phases-1-4/file-manifest.json), Git diff/status cuối. Không stage/commit/push hoặc sửa Git config.

## 17. Bảo vệ Backend/Web/root và secret

Baseline bất biến được lập trước khi sửa: 3.099 first-party files ngoài Mobile, 608 directories, gồm untracked audit docs và `.env`; cache/build/Git metadata được loại trừ công khai. Final guard so hash/size/mtime và directory membership, không ghi đè baseline hoặc tự restore.

[protected-integrity.json](docs/evidence/api-integration-phases-1-4/protected-integrity.json) ghi kết quả kiểm tra boundary; [final-boundary-and-secrets.json](docs/evidence/api-integration-phases-1-4/final-boundary-and-secrets.json) kiểm exact known credential/private-key/JWT patterns trong deliverables và known secrets trong APK đã giải nén. Đây không phải chứng minh mọi secret tiềm ẩn trên toàn máy đều được phát hiện. Các untracked root audit docs có trước được giữ nguyên. External runtime mới là ngoại lệ người dùng cho phép, không nhập secrets vào repo.

Kết quả cuối: **PASS** 3.099 tệp bảo vệ, không đổi file/directory/hash/mtime, HEAD giữ nguyên; Git diff check exit 0, không staged file. Quét deliverables và các entry giải nén của debug APK cuối không khớp các secret đã biết. Kiểm tra local link của các báo cáo không còn target thiếu sau khi tạo evidence cuối.

## 18. Defect, capability thiếu và blocker còn lại

- Gateway hiện chưa có route thực hoạt động. Không mở rộng sửa Backend để tạo Gateway trong nhiệm vụ Mobile.
- Thiếu private discovery đầy đủ bakery memberships; không có full owner read options/images draft/hidden sau restart. App không gửi PUT thay thế khi chưa biết đầy đủ data.
- Không có public profile edit/address/reset password/Admin users; UI chỉ đọc/thông báo thiếu.
- PaymentSummary của Owner không expose reviewNote dù Admin có; không tự suy ra ghi chú. PDF inline preview còn giới hạn. Sandbox chưa được verify.
- Secure storage default bộc lộ lỗi legacy ESP khi cold start Android 16; bản sửa namespace được kiểm chứng riêng, không coi in-process restore là đủ.
- Không có Android Studio GUI/iOS/TalkBack/physical device/release perf/host reboot evidence. Monitoring ba app còn dựa API readiness ngoài Docker healthcheck.
- Bản runtime tạm trước mất ngoài kiểm soát; evidence cũ được giữ và tạo runtime H mới theo ủy quyền. Không tuyên bố toàn bộ bảy microservices production-ready.

## 19. Hoàn tất, một phần và chưa thực hiện

Đã hoàn tất adapter/UI Phases 1–4, inventory và traceability, positive cross-phase activation/publish/renewal/snapshot, unit/widget/build, Android native/API journeys, Web public đối chiếu, persistent H deployment, README CLI rehearsal và báo cáo Việt.

Hoàn tất một phần theo khả năng Backend: đa tiệm sau restart, quản trị draft options/images sau restart, PDF proof viewing, Gateway routing. Android cold-start evidence được báo riêng theo ảnh kiểm tra, không gộp vào 55 operation.

Chưa thực hiện: chức năng Phases 5–6/out-of-scope, source fix Backend/Web, SQL/role grant, real money/email, production deployment, iOS/Android Studio GUI và những lớp test chưa có bằng chứng nêu trên.

## 20. Bước tiếp theo được đề xuất

Chủ dự án có thể lên task Backend riêng cho Gateway, private memberships và full draft-management read APIs; review per-bucket least privilege và Docker readiness. Sau đó Mobile mới bổ sung selector/reload đầy đủ dựa contract đã duyệt. Kiểm tra Android Studio/iOS/physical device/accessibility/release bằng toolchain phù hợp. Không triển khai Marketplace/Order/Chat/AI hoặc mở rộng Phases 5–6 trong phiên này.
