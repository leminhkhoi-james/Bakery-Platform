# Báo cáo triển khai SweetCake Flutter Mobile

Ngày: **22/10/2026** — repository `D:\MSS301\Bakery-Platform`, nhánh `test`.

**Trạng thái tổng thể: PARTIALLY COMPLETED.** Đã hoàn tất phần mã Flutter UI/mock, 23 destination, kiểm thử host và Android khả thi trong môi trường này. Chưa xác minh native iOS trên macOS/Xcode, thiết bị thật và screen reader; không tuyên bố đủ điều kiện phát hành production/store. Bảy ảnh nguồn không truy xuất được dùng fallback local. Độ tương đương từng điểm ảnh với web chưa được xác minh bằng screenshot web đối chiếu tự động.

## 1. Tổng quan kết quả

Ứng dụng thực nằm tại `mobile/`, không lồng thêm project con. Stack hoạt động duy nhất là **Flutter + Dart**, native Flutter widgets, Android và iOS platform projects. Không có React Native/Expo/WebView runtime.

Đã audit **23 page component web** và triển khai **23 destination Flutter**: 11 customer, 1 auth, 7 vendor, 4 admin. Có catalog đầy đủ 189 mẫu bánh, thiết kế/RFQ/báo giá/order shared state, checkout/payment mock, tracking/review/profile/address, catalog/order/ledger tiệm và quản trị account/vendor/order.

**79 host tests PASSED**, **1 Android integration test PASSED**, `flutter analyze` không có issue, format check không đổi file. Android debug APK đã build, cài và cold-start thành công trên emulator API36. iOS chỉ được kiểm tra cấu trúc/configuration tĩnh; native build **NOT RUN** do host Windows.

## 2. Audit frontend

Đọc rules trước triển khai; kiểm tra AGENTS, nhánh, status và việc chưa có mobile. Nguồn chính là frontend, không đọc nội dung backend để suy luận module hay API.

`frontend/package.json`: React 19.2.8, Vite 8.3.0, Tailwind 4.3.3, JavaScript. `App.jsx` điều hướng qua History API và alias; `AppRoutes.jsx` có 23 component riêng biệt. Không có auth guard thực; customer Header công khai dẫn sang vendor/admin. `AppDataContext.jsx` mô phỏng RFQ → bid → order kanban. Nhiều page dùng localStorage/state riêng; service đang trả Promise từ mock.

Đã lập inventory máy đọc được cho **126 tệp frontend** gồm route, page, layout, component, fixture, service, style và HTML. [frontend-source-inventory.json](evidence/frontend-source-inventory.json) lưu hash, số dòng, vị trí state/control; [feature mapping](WEB_TO_MOBILE_FEATURE_MAPPING.md) giải thích phạm vi từng branch/call-site.

Phát hiện và xử lý scope:

- Home chỉ mount 6 section; không thêm trending/review/newsletter từ các component chưa sử dụng.
- Prop `onSetCustomCake` không được studio gọi; không mở luồng đặt custom tại tiệm từ prop chưa hoạt động.
- State birthday/remember/agreeTerms ở auth, flexible-price ở studio, wishlist ở product không có active control thì không tạo action tương ứng. Favorite trong catalog có control nên được giữ.
- Một số admin pagination, date/advanced filter, vendor sort chỉ là UI hoặc không có logic; không phát minh nghiệp vụ mới.
- Escrow config modal không có call-site mở trong web nên không tạo destination/action mới.
- `frontend/src/assets/hero.png` là hình Vite cũ. Đã loại khỏi mobile; dùng SVG mèo thực trong HeroSection và dựng kiosk bằng Flutter.

Các tài liệu được AGENTS tham chiếu như `docs/PROJECT-STATUS.md`, `docs/02-system-architecture.md`, `docs/API_SPEC.md`, `docs/decisions/` không tồn tại tại baseline. Không tạo/sửa root docs vì yêu cầu mission giới hạn tuyệt đối trong mobile; ghi nhận tiến độ/kiến trúc tại các tài liệu mobile này.

## 3. Audit mobile cũ và migration

Baseline không có thư mục `mobile/`; không có màn hình, fixture, test, tài liệu hay asset mobile cũ cần bảo toàn. **Số màn hình migration: 0.** Không xóa user work, không có migration backup cần thiết.

Flutter scaffold được tạo trực tiếp trong mobile sau audit/kế hoạch. Các file counter/sample test do scaffold mới sinh đã được thay thế bằng ứng dụng và test thực; chúng không phải sản phẩm có sẵn của người dùng.

## 4. Toolchain và quyết định công nghệ

| Mục | Giá trị thực đo |
|---|---|
| OS | Windows 11, build 10.0.26200.9711 |
| Flutter | **3.47.1**, framework revision `6655482ec0` |
| Channel | **`[user-branch]`**, doctor cảnh báo unknown channel; không khẳng định là official stable channel |
| Dart | **3.13.1 stable** |
| DevTools | 2.60.0 |
| Android | SDK/platform/build-tools 36; emulator 37.2.12.0 |
| Java | JDK21, 21.0.8 |
| Flutter path | `D:\HomeMind\audit-tools\flutter` |
| Native iOS toolchain | Không có macOS/Xcode trên host này |

Không nâng cấp, đổi channel hay thay Flutter toàn cục. Dependency được resolve thực bằng `flutter pub get`, lockfile nằm trong mobile. Runtime chỉ thêm `flutter_svg` 2.3.0 ngoài Flutter/localizations để tái sử dụng vector thương hiệu. [Package chính chủ](https://pub.dev/packages/flutter_svg) mô tả asset rendering; mã chỉ gọi `SvgPicture.asset`.

Doctor còn cảnh báo một số Android license chưa được accept và Windows C++ workload thiếu thành phần. Không tự chấp nhận license hay cài toolchain toàn cục. Các cảnh báo này **không ngăn debug APK và Android integration đã chạy thành công**. Không sử dụng khả năng build Windows desktop để thay thế mobile.

## 5. Kiến trúc Flutter

| Thư mục | Trách nhiệm |
|---|---|
| `lib/main.dart` | Khởi tạo binding và Bootstrap |
| `lib/app/` | Asset bootstrap/loading/error/retry, AppShell, typed route factory, native Navigator |
| `lib/core/` | Brand ThemeData, formatter/validator, layout/form/chat/status/filter widgets |
| `lib/features/` | Customer/auth/vendor/admin screens được chia theo feature |
| `lib/models/` | Typed catalog/workflow/account/ledger models; integer VND; enum phase |
| `lib/mocks/` | Parse JSON và local asset manifest tại data boundary |
| `lib/services/contracts/` | Repository interface, không có endpoint hay HTTP client |
| `lib/services/mock/` | In-memory mock implementation, typed upsert và deterministic IDs |
| `lib/state/` | ChangeNotifier AppState/CartState, InheritedNotifier AppScope |
| `test/`, `integration_test/` | Unit, form/navigation/layout, visual và Android journey |

Chọn native state management và Navigator vì app offline có state graph hữu hạn; tránh thêm router/state package không cần thiết. Các local field/tab/query ở screen; dữ liệu xuyên screen qua AppState/repository. Catalog/stores UI dùng repository-backed getter, không rải kết nối dữ liệu trong widget.

Luồng tương lai có thể thay mock adapter sau khi contract public/gateway được xác minh. Không xây microservice orchestration trong mobile, không thêm auth server/service discovery và không giả định endpoint backend.

## 6. Thiết kế và asset

Theme giữ Bordeaux `#6B212E`, dark `#4F1722`, caramel `#B87328`, nền `#FFFDFA`, cream `#F7F0E6`, chữ `#241815`, border `#EBDCD0`. Heading Quicksand, body Plus Jakarta Sans được bundle offline cùng OFL. Padding/card/button/input/status dùng primitive chung; nội dung responsive tối đa 800px, margin 20px và cuộn dọc.

Home dùng logo nguồn, SVG mèo của HeroSection, mái sọc mint/pink dựng bằng native layout. Desktop table/kanban thành card và phase chips. Drawer/bottom navigation phù hợp smartphone, SafeArea, bàn phím theo field, Dialog/BottomSheet có scroll, TextScaler không bị khóa. Button chính >=48px, ảnh/biểu tượng có label/tooltip.

**248/255 URL ảnh fixture tải được**; map sang asset local. Bảy lỗi giữ trong [asset-downloads.json](evidence/asset-downloads.json), dùng fallback `CakePicture` thay vì thử mạng khi chạy. App icon Android/iOS tạo từ favicon SweetCake sẵn có. Native screenshot đã review: [android-home.png](evidence/android-home.png). Bảy goldens có font thật nằm trong `test/goldens/`.

Thiết kế chi tiết từng screen/widget/token ở [design.md](../design.md). Không tuyên bố web/mobile pixel-perfect; typography/spacing/table/navigation được điều chỉnh cho điện thoại.

## 7. Chức năng được triển khai

| Nhóm | Phạm vi UI/mock |
|---|---|
| Khách hàng | Home, catalog/search/sort/filter/multi-select/pagination, detail/config/cart, studio/preset/local preview/RFQ, bidding/detail/chat/accept, store directory, checkout, payment success/failure/retry/COD, tracking/QC/gallery/driver/review/cancel, profile/address/security |
| Tiệm bánh | Dashboard/receiving/quick quote, RFQ filter/detail/chat/reject/quote, quote editor, catalog create/edit/size/clone/sale/delete, 5-stage order/checklist/QC/driver/success/fail/timeline, wallet/ledger/withdraw, shop settings |
| Admin | Period metrics/category bars/queue/audit, user filter/detail/add/lock, vendor inspection/approve/re-audit/fee/invite/suspend, order filter/detail/telemetry mock/release |
| Chung | Native navigation/back, local toast/confirmation, policy tabs/search, clipboard, error/empty/loading/validation/disabled states |

Một request mới chỉ nhận quote liên kết đúng rfqId. Accept lặp không tạo order trùng. Từ chối sau chọn trả yêu cầu về OPEN và kết thúc active mock order cũ trước khi chọn tiệm khác. Checkout giữ snapshot các item đã chọn. Các trạng thái thử nghiệm được phân biệt với thao tác vận hành thông thường.

Mọi action đều có source mapping; control placeholder được ghi rõ giới hạn. Không thêm loyalty module, báo cáo, role/portal hay workflow mua subscription chỉ từ nhãn/TODO/backend.

## 8. Dữ liệu mock và chế độ offline

Nguồn dữ liệu là fixture demo của frontend, không đọc production record hoặc credential. `assets/data/web_fixtures.json` bảo toàn nội dung/ID/quan hệ dataset gốc; lớp mapper chuyển thành Dart model. Một số số liệu dashboard là fixture tĩnh riêng, đúng với cách web đang trình bày.

| Dataset chính | Số lượng seed |
|---|---:|
| Catalog customer | 189 |
| Store directory | 5 |
| RFQ | 4 |
| Báo giá request mẫu | 3 |
| Catalog vendor | 2 |
| Kanban orders | 7 trên 5 phase |
| Wallet transaction | 7 |
| Admin users | 7 |
| Admin vendors | 6 |
| Admin order fixture | 6, gộp/dedup với shared orders |
| Studio | 10 size, 12 flavor, 12 topping, 6 accessory, 2 preview |

Không có API client thật, database connection, login request, token, backend URL trong config hay production secret. Static source audit không tìm thấy network-loading API trong `lib/`. URL JSON chỉ dùng làm khóa manifest. Dependency `http` là transitive của flutter_svg; không được ứng dụng khởi tạo/gọi.

Android integration được chạy với `wifi_on=0`, `mobile_data=0` trên emulator riêng của task. Tạo request/quote, chọn báo giá, xác nhận payment và thấy order trong portal tiệm không cần backend. Thay đổi chỉ lưu RAM, reset khi khởi động lại; không hứa persistence qua restart.

## 9. Tệp tạo/sửa/xóa

Toàn bộ project mới nằm trong `mobile/`: source Dart, Android/iOS projects, pubspec/lock/analyzer config, assets/font/license, tests/goldens, tool scripts, README/design/mapping/report/evidence.

Tệp nền của repository được sửa hoặc xóa: **0**. Không có tệp mobile cũ tại baseline. Tệp counter/widget test scaffold được thay thế trong cùng mission. Asset Vite cũ được loại khỏi project mobile sau visual QA. Chỉ artifact build/cache do mission sinh được clean/rebuild; APK được giữ trong `artifacts/` trước cleanup.

Danh sách đầy đủ các file source/document/asset mới được ghi tại `mobileNonIgnoredInventory` trong [repository-and-project-audit.json](evidence/repository-and-project-audit.json) và [git-status-after.txt](evidence/git-status-after.txt). Các cache `.dart_tool/`, `build/`, `.tool-cache/` và APK `artifacts/` được ignore, vẫn nằm dưới mobile.

## 10. Kiểm thử và kết quả chất lượng

| Check | Trạng thái | Bằng chứng |
|---|---|---|
| `flutter --version`, `dart --version` | **PASSED** | `evidence/flutter-version.txt`, `dart-version.txt` |
| `flutter doctor -v` | **WARNINGS**, không phải toàn xanh | `evidence/flutter-doctor.txt`; channel/license/desktop workload như mục 4 |
| `flutter pub get` | **PASSED** | Dependencies resolve và `pubspec.lock` |
| `dart format --output=none --set-exit-if-changed lib test integration_test` | **PASSED** | 56 Dart files, 0 changed; `evidence/dart-format.txt` |
| `flutter analyze` | **PASSED** | No issues found; `evidence/flutter-analyze.txt` |
| `flutter test` | **PASSED — 79 tests** | `evidence/flutter-test.txt` |
| `flutter test integration_test/mock_journey_test.dart -d emulator-5556` | **PASSED — 1 test** | `evidence/android-integration-test.txt`; emulator API36, network radio off |
| `flutter build apk --debug` | **PASSED** | `evidence/android-build.txt` |
| Install/cold start Android | **PASSED** | `Status: ok`, cold start 4893ms; `evidence/android-smoke.json`, `android-home.png`; không có flutter:E/AndroidRuntime:E sau startup |
| iOS file/config/icon XML/plist checks | **PASSED, chỉ tĩnh** | `native` section trong project audit |
| Native iOS build/run | **NOT RUN / môi trường không hỗ trợ** | Windows; cần macOS/Xcode |
| Thiết bị thật/TalkBack/VoiceOver/store signing/release | **NOT RUN** | Không tuyên bố đã kiểm thử/phát hành |
| Repository/offline static audit | **PASSED** | 183 hash ngoài mobile giữ nguyên, không có active network-source call |

79 host tests gồm **16 unit**, **49 route/layout/navigation/form tests**, **7 interaction/recovery tests**, **7 visual goldens**. Mỗi destination được render trên 390×844 và 320×690 với text scale 1.8 và font thật; kiểm tra exception/overflow và scroll. Interaction tests xác minh product configuration/add-ons, checkout disabled, quote-selection navigation, withdrawal boundary, catalog edit/clone, chat reopening, bootstrap loading/error/retry.

Các lỗi gặp trong vòng phát triển đã sửa: parser bracket của dialog, inferred num ở estimate, retry handler trả Future trong setState. Test harness được sửa theo API `tester.binding.setSurfaceSize`, finder được scope đúng dialog, assertion offline cho phép hai nhãn trên payment và text home được cập nhật theo source thật. Chạy lại cuối cùng đạt 79/79; không giấu failure bằng ignore/lint suppression hay bỏ test.

Golden mới đã được xem bằng mắt, gồm home/catalog/studio/bidding/cart/vendor orders/admin dashboard. Đây là baseline Flutter để chống regression, không phải chứng minh pixel equivalence với một screenshot web đã render. Android screenshot xác minh startup với font/asset thực.

APK cuối: `mobile/artifacts/sweetcake-debug.apk`, **206.916.178 bytes** (~197 MiB), SHA-256 `2728f08d71870478d2c61567c4058ef0f24472a1d0c6565475e3634e22307c0d`. Đây là **debug APK nhiều ABI**, không phải gói production được tối ưu/ký phát hành.

## 11. Dọn framework và artifact

Không có React Native/Expo tại baseline; không cần xóa package Node/Metro/Babel hay migration test. Flutter/Dart là active application framework duy nhất. Không có mobile package.json hay yêu cầu Node để chạy app.

Đã thay boilerplate Flutter counter, dùng SweetCake favicon cho platform icon, bỏ asset Vite không sử dụng, giữ license font và evidence. Dùng `flutter clean` để thu hồi build output có thể tái tạo khi emulator thiếu disk; không clean toàn repository. Emulator QA dùng AVD riêng dưới `.tool-cache/avd/`, không wipe AVD người dùng có sẵn.

## 12. Audit an toàn repository

Baseline: repository root đúng, branch **test**, working tree **sạch**, chưa có mobile; không có uncommitted change cần phân biệt. Final branch vẫn **test**.

Đã so sánh hash **183 tệp ngoài mobile** với baseline, kiểm tra thêm tracked/nonignored-untracked inventory và porcelain status. Kết quả: **0 thay đổi**, **0 mất file**, **0 file mới ngoài mobile**, **0 status entry ngoài mobile**. Không chỉ dựa vào `git diff` trống vì mobile là thư mục mới chưa track.

**`frontend/`, `backend/`, `database/`, root docs, `.github/` và infrastructure không bị thay đổi bởi mission.** Không commit/push/merge/deploy/chuyển branch, không chạy migration, không dùng database/credential/auth thật. `tool/verify_project.py` tái chạy audit và chỉ ghi evidence trong mobile.

## 13. Hạn chế và phần chưa xác minh

1. Native iOS chưa compile/run; phải dùng macOS/Xcode để kiểm tra lifecycle, keyboard/safe-area/gestures, simulator và device thật. Parse project không thay thế native build.
2. SDK Flutter báo `[user-branch]`; đã build/test trên revision hiện có nhưng chưa xác nhận chính thức stable-channel provenance. Không tự đổi cài đặt toàn cục.
3. Bảy URL ảnh nguồn thất bại được fallback. Không bổ sung ảnh lạ để che thiếu asset.
4. Không có persistence qua restart, auth/RBAC/API/payment/AI/GPS/upload/notification thực. Đó là giới hạn mock-only có chủ đích, không được mô tả thành tích hợp đã hoàn thành.
5. Telemetry không phải sensor stream; bản đồ là sơ đồ; 360 viewer, thư viện ảnh thiết bị, phone call và hóa đơn tài chính thực không triển khai. Web có alert/stub cho nhiều mục này.
6. Danh mục sản phẩm, stats/ledger/dashboard có các giá trị fixture không hoàn toàn thống nhất giữa các trang web, ví dụ fee 10%/95%/take-rate riêng. Chưa có phase xác minh backend contract để thống nhất.
7. Layout đã có smoke/golden/Android startup evidence, nhưng chưa kiểm thử screen reader, thiết bị thật, mọi kích thước màn hình, mọi chuỗi localization hay pixel parity tự động với web.
8. Chưa có production identifiers, signing, store metadata, release pipeline hay kiểm thử bảo mật cho backend integration; không coi mock portals là phân quyền thật.

Không còn test host/Android thất bại trong các check cuối đã chạy. Các hạn chế ở trên là lý do trạng thái tổng thể thận trọng **PARTIALLY COMPLETED**, dù phần UI/mock và Android khả thi đã được thực thi.

## 14. Hướng dẫn phát triển cục bộ

```powershell
cd D:\MSS301\Bakery-Platform\mobile
flutter --version
dart --version
flutter doctor -v
flutter pub get
flutter devices
flutter run -d <android-device-id>
```

Mở emulator Android hoặc kết nối device trước `flutter run`. Không cần chạy frontend/backend, Docker, database hay đặt environment secret. Mỗi lần mở mới có seed hai món cart, RFQ và quote demo; menu cho phép chuyển portal để kiểm thử xuyên module.

```powershell
dart format --output=none --set-exit-if-changed lib test integration_test
flutter analyze
flutter test
flutter test integration_test/mock_journey_test.dart -d <android-device-id>
flutter build apk --debug
python tool/verify_project.py
```

Trên macOS: cài/kiểm tra Xcode và iOS simulator, `flutter pub get`, `flutter devices`, `flutter run -d <ios-device-id>`. Có thể build simulator bằng `flutter build ios --simulator`; lệnh này **chưa chạy tại đây**. Production signing cần quyết định riêng của nhóm, không dùng development placeholder như định danh đã chốt.

Thiết kế: `mobile/design.md`. Mapping: `mobile/docs/WEB_TO_MOBILE_FEATURE_MAPPING.md`. Logs/ảnh: `mobile/docs/evidence/`. Công cụ asset chỉ để bảo trì; không cần Python/Pillow khi chạy Flutter thông thường.

## 15. Đề xuất tích hợp backend sau này

Đây là đề xuất, chưa thực hiện: xác minh contract public/gateway, role/ownership, schema DTO và trạng thái với nhóm backend; chuẩn hóa các mâu thuẫn escrow/fee của giao diện; tách adapter theo domain sau khi có contract. Inject repository thực ở bootstrap, giữ UI/state dùng model typed. Bổ sung error/timeout/pagination/cancellation và token handling theo quyết định bảo mật chính thức. Không để widget tự gọi nhiều service hoặc tính giá production như source of truth.

Trước pilot cần iOS native verification, device/screen-reader QA và ổn định Flutter SDK provenance. Trước release cần xác nhận app IDs, asset quyền sử dụng, signing/store config và phạm vi dữ liệu người dùng. Không tiến hành các bước đó trong mission UI/mock này.

## 16. Checklist chấp nhận

- [x] Flutter project root chính xác tại `mobile/`, pubspec/lock/main thực.
- [x] Android và iOS platform projects; native widgets, Dart null safety.
- [x] Audit 23 web pages, 126 tệp inventory; mapping source/call-site.
- [x] 23 destination có UI và local mock behavior; không chỉ scaffold/static screenshot.
- [x] Giữ brand/theme/font/logo/cat; native mobile layout, SafeArea/form/keyboard/back.
- [x] Typed models/repository/state; 189 catalog records và các quan hệ fixture.
- [x] Search/filter/sort/forms/CRUD/workflow theo source hiện có.
- [x] Loading/empty/error/retry/validation/disabled/local feedback.
- [x] Mock-only; không active backend/auth/database/network image/data loading.
- [x] 79 host tests, 7 visual baselines, analyze/format pass.
- [x] Android debug build, install/cold start, offline emulator integration pass.
- [x] iOS project/config/icon checks tĩnh pass.
- [ ] Native iOS build và simulator/device QA — cần macOS/Xcode.
- [ ] Device thật, TalkBack/VoiceOver, pixel comparison tự động với web — chưa chạy.
- [ ] Official stable Flutter channel provenance — SDK local đang user-branch.
- [x] React Native/Expo không active; không có migration cũ để làm.
- [x] README/design/mapping/báo cáo tiếng Việt và evidence đầy đủ.
- [x] Hash/status audit xác minh mọi thay đổi repository chỉ dưới mobile.
- [x] Frontend/backend/database/root infrastructure giữ nguyên; không commit/deploy.
