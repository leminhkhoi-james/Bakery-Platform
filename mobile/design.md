# SweetCake Mobile — Thiết kế và kiến trúc Flutter

Ngày đối chiếu: 22/10/2026. Đây là tài liệu duy trì ứng dụng trong `mobile/`, cùng [bản đồ tính năng](docs/WEB_TO_MOBILE_FEATURE_MAPPING.md) và [báo cáo triển khai](docs/MOBILE_IMPLEMENTATION_REPORT_VI.md). Nguồn chuẩn về sản phẩm là frontend hiện tại; không suy luận tính năng từ backend.

## 1. Sản phẩm và phạm vi

SweetCake kết nối khách đặt bánh với tiệm nghệ nhân. Giao diện đang có ba khu vực: khách hàng, xưởng bánh đối tác và quản trị viên. Khách khám phá mẫu, tùy chỉnh, đặt giỏ bánh, thiết kế mẫu và so sánh báo giá. Tiệm tiếp nhận RFQ, báo giá, quản lý catalog và bảng tiến độ. Admin quản lý hồ sơ khách/tiệm và theo dõi đơn, ký quỹ.

Ứng dụng dùng **Flutter + Dart** và native Flutter widgets; cùng mã nguồn cho Android/iOS. Đây là bản **UI với dữ liệu mô phỏng offline**, không phải ứng dụng đã kết nối dịch vụ thật. Các từ Escrow, VNPAY, MoMo, VAT, SMS, Zalo và AI phản ánh giao diện web; thao tác chỉ thay đổi dữ liệu trong bộ nhớ. Việc đóng ứng dụng làm mất thay đổi của phiên.

Không có mobile cũ tại baseline, nên không có React Native, Expo, migration hay dữ liệu người dùng cũ phải chuyển đổi. Không sửa bất kỳ tệp repository nào ngoài `mobile/`.

## 2. Phân tích frontend thực tế

Nguồn kiểm tra gồm `frontend/package.json`, `src/App.jsx`, `src/routes/AppRoutes.jsx`, `src/context/AppDataContext.jsx`, các page/layout/component, service và fixture. [Inventory máy đọc được](docs/evidence/frontend-source-inventory.json) lưu đường dẫn, hash và vị trí control.

| Thành phần web | Hiện trạng |
|---|---|
| Runtime | React 19.2.8, JavaScript, Vite 8.3.0 |
| Styling | Tailwind CSS 4.3.3, token trong `frontend/src/index.css` |
| Routing | `App.jsx` dùng History API, alias route; `AppRoutes.jsx` chọn component |
| State | useState/useEffect, localStorage; AppDataContext chia sẻ RFQ/bid/kanban |
| Data access | Các service trả mock Promise; không lấy đây làm API contract đã xác minh |
| Navigation | Header/footer customer; sidebar và drawer ở vendor/admin |
| Forms | Input/select/checkbox/radio/textarea; required và một số validator trong handler |
| Data views | Card catalog, bảng admin/catalog/revenue, kanban đơn hàng |
| Icons | Material Symbols Outlined; Flutter chọn Material Icons tương ứng |
| Ngôn ngữ | Chủ yếu tiếng Việt; không có hệ thống i18n đầy đủ hay bộ chọn locale |
| Access | Không có auth guard; Header công khai dẫn vào vendor/admin |
| Theme | Light; không có dark-mode thực sự được triển khai |

`HomePage.jsx` chỉ mount Hero, CategoryBento, BestSellers, CustomAtelier, HowItWorks và PartnerBakeries. Trending, CommitmentsAndReviews, InstagramAndNewsletter có file nhưng không được mount; mobile không tạo chức năng cho chúng. Auth có state birthday/remember/agreeTerms nhưng control không render; không thêm vào mobile. `onSetCustomCake` ở studio không được gọi; không mở luồng studio → chọn tiệm chỉ vì callback tồn tại.

Một số control admin chỉ là hình thức: pagination tĩnh, date filter không ảnh hưởng kết quả, modal cấu hình Escrow không có lối mở. Không tạo nghiệp vụ mới cho các control đó. Danh sách mobile dùng cuộn và hiển thị đúng số bản ghi cục bộ.

## 3. Token thiết kế

Nguồn giá trị gốc: `frontend/src/index.css`; style kiosk bổ sung lấy trực tiếp `components/features/home/HeroSection.jsx`.

| Ý nghĩa | Web | Flutter |
|---|---|---|
| Primary/Bordeaux | `#6b212e` | `Brand.wine` |
| Primary container đậm | `#4f1722` | `Brand.wineDark` |
| Caramel | `#b87328` | `Brand.caramel` |
| Nền/surface | `#fffdfa` | `Brand.paper` |
| Neutral cream | `#f7f0e6` | `Brand.cream` |
| Blush | `#f5dcd7` | `Brand.blush` |
| Chữ chính | `#241815` | `Brand.ink` |
| Chữ phụ | `#695e57` | `Brand.muted` |
| Border | `#ebdcd0` | `Brand.border` |
| Error | `#b91c1c` | `Brand.error` |
| Success | Emerald dùng trong status web; điều chỉnh tương phản mobile | `Brand.success = #356547` |
| Kiosk mint | `#6fb9c6` | `PatisserieBooth.mint` |
| Kiosk pink | `#ffc6db` | `PatisserieBooth.pink` |

`Brand.theme` trong `lib/core/theme/app_theme.dart` xây dựng `ThemeData`, `ColorScheme`, `TextTheme`, input/button/card/chip/navigation/snackbar themes. Không rải lại màu primary vào từng feature. Chỉ dùng màu phụ cục bộ khi nguồn tương ứng có giá trị cụ thể, ví dụ kiosk.

### Typography

Quicksand dùng cho heading; Plus Jakarta Sans dùng cho nội dung/label. Bundle variable TTF trong `assets/fonts/`; giấy phép OFL đi cùng từng family. Không dùng tải font lúc chạy. Web có các family Fraunces/Cormorant trong token và custom class; mobile chọn hierarchy được dùng phổ biến là Quicksand/Jakarta, không giả định mọi class đều áp dụng một font serif.

| Cấp | Flutter | Điều chỉnh |
|---|---|---|
| Page heading | headlineLarge 30px, Quicksand 700, height 1.2 | Hợp lý giữa heading mobile 24 và hero desktop lớn của web |
| Metric/secondary heading | headlineMedium 24px, 700 | Giữ hierarchy metric web |
| Section/card heading | titleLarge 20px; titleMedium 17px | Dùng card/list dọc |
| Nội dung | bodyMedium 14px, height 1.6 | Web base 13.5px; tăng để đọc trên điện thoại |
| Chú giải | bodySmall 12px, height 1.5 | Không dùng cho nội dung thao tác quan trọng |
| Eyebrow | 10–11px, 700–800, letterSpacing | Chỉ là nhãn phụ; có heading rõ ràng ngay dưới |

### Spacing, radius và elevation

Web có spacing 4/8/16/24/40px, margin mobile 20px, gutter mobile 16px. Flutter giữ khoảng cách chính 8/12/16/20/24; `Brand.pagePadding = 20`. Form field cách 16px; panel padding 18px. Card radius `Brand.radius = 20`, input/button 12, ảnh 14, chip 20–24. Card có border mảnh, elevation 0; tránh shadow đậm ở màn hình quản trị nhiều dữ liệu. Kiosk dùng border Bordeaux 2px theo thiết kế minh họa web.

## 4. Asset và bản sắc thương hiệu

- `assets/images/brand-logo.png`: logo SweetCake; bản đang dùng khớp logo trong `frontend/src/assets/brand-logo.png`.
- `assets/images/cat-baker.svg`: SVG mèo trích từ HeroSection.jsx. Chuẩn hóa tên thuộc tính SVG và bỏ hai glyph `<text>` hình tim nhỏ trong mắt vì renderer SVG không hỗ trợ text; đường nét chính giữ nguyên.
- `PatisserieBooth`: widget native dựng mái sọc mint, biển SweetCake và counter pink từ thiết kế kiosk web. Không dùng hình minh họa Vite cũ trong `src/assets/hero.png`.
- 248 ảnh tham chiếu từ fixture được bundle. `assets/data/image_manifest.json` ánh xạ URL nguồn sang đường dẫn local. URL trong JSON là metadata tra cứu, không dùng làm nguồn mạng.
- Bảy URL không tải được được ghi tại `docs/evidence/asset-downloads.json`; `CakePicture` hiển thị fallback hình bánh trên nền cream, có semantic label.
- App icon Android/iOS tạo từ favicon SweetCake có sẵn, dùng `tool/generate_icons.py`. Đây là icon phát triển, không phải quyết định phát hành store.
- `flutter_svg` 2.3.0 chỉ dùng `SvgPicture.asset`. Hướng dẫn package chính chủ: <https://pub.dev/packages/flutter_svg>. Package có transitive dependency `http`; mã ứng dụng không gọi API HTTP hoặc `SvgPicture.network`.

`tool/prepare_assets.py` là công cụ bảo trì tải/bundle asset, không chạy khi mở app. Không đặt downloader vào `lib/`. Python/Pillow chỉ cần khi tái tạo icon, không phải dependency runtime.

## 5. Layout và điều hướng Flutter

`AppShell` là `Scaffold` chung: logo, giỏ có badge, menu, breadcrumb portal bằng nhãn offline. Body dùng `SafeArea`. `PageBody` giới hạn nội dung tối đa 800 logical pixels, padding 20px, cuộn dọc. Bảng desktop đổi thành card dọc; action dùng `Wrap` để xuống dòng ở màn hình hẹp. Không nhét bảng nhiều cột vào chiều rộng điện thoại.

Customer có `NavigationBar` bốn mục Trang chủ/Khám phá/Thiết kế/Tài khoản. Drawer chứa đầy đủ destination khách, vendor và admin. Vendor/admin dùng drawer và không thêm bottom bar ngoài cấu trúc sản phẩm. Cổng portal mở công khai như web demo, không phải cơ chế phân quyền bảo mật. Khi đi sâu, native `Navigator` tạo back stack và `BackButton`; Android system back/iOS route behavior do Flutter quản lý.

`Destination` là enum trong `lib/app/router/destination.dart`; tên route nội bộ `/home`, `/explore`, ... Route factory ở `app_router.dart` nhận argument typed (`Cake`, `Quote`, `CakeRequest`). Không cần dependency go_router cho 23 destination offline và không có deep-link/auth redirect phức tạp. Không khai báo các role chef/delivery thành portal vì web không có màn hình của chúng.

Dialog tạo/sửa dùng `editForm`/`FieldSpec` và `_FormDialog`, có `Form`, validator, scroll và controller disposal. Chat dùng modal bottom sheet, đẩy nội dung theo `viewInsets`. Dropdown có `isExpanded`; phần thao tác không cố định width gây overflow. Form dài dùng bàn phím phone/email/number/datetime theo trường. Password có visibility toggle, không log hay lưu password.

## 6. Đặc tả từng màn hình

Đường dẫn Flutter dưới đây tính từ `mobile/lib/features/`. Mọi màn hình đều dùng SafeArea qua shell, cuộn dọc, hỗ trợ text scaling, cùng nghiệp vụ Android/iOS. Các khác biệt Android/iOS chỉ là system navigation, keyboard, text rendering và scrolling behavior của Flutter, không tạo tính năng riêng.

| Flutter source | Web page tương ứng | Cấu trúc, tương tác và dữ liệu |
|---|---|---|
| `home/home_screen.dart`, `patisserie_booth.dart`, `category_section.dart` | customer/home/HomePage.jsx và 6 section được mount | Hero kiosk/mèo, 5 category card theo fixture/call-site, 4 CakeCard bán chạy, chọn size/add/đặt, idea/tone/preview cục bộ, quy trình, partner; footer/policy. Chuyển desktop snap sections thành luồng cuộn. |
| `catalog/catalog_screen.dart`, `cake_card.dart` | ExploreCakesPage.jsx | Search, sort, filter bottom sheet, nhiều theme/dịp, giá, màu, district, delivery, 9 bản ghi/trang; favorite, size và cart. Nguồn catalog đủ 189 mẫu. |
| `catalog/product_screen.dart` | ProductDetailPage.jsx | Gallery thumbnail, size guide, size/giá, sugar, message, candle/hat, delivery, quantity; tabs taste/ingredients/care và gợi ý. Giá nguyên VND. |
| `studio/studio_screen.dart` | AiCakeStudioPage.jsx | AI/upload tabs, preset/tag, delayed preview local, 10 size/12 flavor/12 topping/6 accessory, inscription/placement, estimate, budget preset, date/time/custom time/address/note. Tạo RFQ shared state. Upload chỉ chọn asset có sẵn, không đọc thư viện máy. |
| `bidding/bidding_screen.dart` | BiddingComparisonPage.jsx | Request card, quote sorting, detail/chat/accept, edit/cancel/reopen/extend, bảng kịch bản demo. RFQ mới không nhận bừa quote của yêu cầu khác. |
| `bidding/quote_screen.dart` | BakerQuoteDetailPage.jsx | Specs/package, ảnh tham chiếu/mẫu tiệm, chat, điều chỉnh qua form, clipboard chia sẻ, confirmation chọn tiệm → payment. Không giữ tiền thật. |
| `stores/stores_screen.dart` | StoreDirectoryPage.jsx | 5 tiệm TP.HCM, search name/location/chef/specialty; menu/studio links. Không mở conditional customCake flow đang không có call-site trong web. |
| `checkout/cart_screen.dart` | CartCheckoutPage.jsx | Hai bước cart/giao nhận, chọn tất cả/từng món, quantity/delete/clear, phụ kiện, voucher/minimum/cap, tổng tiền; recipient/email/address/delivery-pickup/date/time/plaque/card/method. Disable checkout khi không chọn món. |
| `checkout/payment_screen.dart` | PaymentGatewayPage.jsx | VNPAY/MoMo/COD, biểu trưng QR không quét được, clipboard mẫu, countdown, verifying/success/fail/retry; kết quả ghi local order. |
| `tracking/tracking_screen.dart`, `order_dialogs.dart` | OrderTrackingPage.jsx | Timeline, ảnh QC gallery, driver/telemetry mẫu, chat, chỉnh giờ/chữ trước giao, receipt, cancel/refund 70% hoặc 20% theo web, review 4 score/comment/ảnh mẫu, overdue/dispute demo. |
| `profile/profile_screen.dart`, `security_panel.dart` | CustomerProfilePage.jsx | Name/phone edit, 3 nhóm đơn/reorder/receipt/tracking, address create/default, password validation và 3 notification switches. Không thêm chỉnh role hay email khi web form không có control đó. |
| `auth/auth_screen.dart` | AuthPage.jsx | Login phone/password; register last/first/phone/password >=6; visibility; forgot-password hướng dẫn. Thành công là hồ sơ/session mô phỏng. |
| `vendor/vendor_dashboard_screen.dart` | VendorDashboardPage.jsx | Receiving switch, metric tóm tắt, RFQ quick quote/dismiss, order progress và shortcuts. Quick quote cập nhật repository local. |
| `vendor/rfq_screen.dart` | VendorRfqMarketplacePage.jsx | Query/category/budget/distance/urgency, request card/detail/chat/reject/quote. Reject ẩn riêng ở tiệm. |
| `vendor/quote_editor_screen.dart` | VendorBespokeQuoteSubmitPage.jsx | Price/size/flavor/hours/note, 1–3 ảnh mẫu, ba commitment, submit liên kết rfqId. Không giả lập gửi thông báo thật. |
| `vendor/vendor_catalog_screen.dart`, `cake_editor.dart` | VendorMenuCatalogPage.jsx | Query/status/prep/category, create/edit/append size & price, readonly cost, gift/calligraphy/flower flags, clone/sale/delete confirmation. Desktop drawer thành dialog cuộn. |
| `vendor/vendor_orders_screen.dart` | VendorOrderManagementPage.jsx | 5 phase chips thay 5 cột kanban, category/urgent/search; confirm/reject/start/checklist/QC/finish/driver/success/fail/timeline. |
| `vendor/revenue_screen.dart` | VendorRevenueEscrowPage.jsx | Wallet balance, locked/revenue/fee display, transaction query/status, withdrawal form minimum 500k và <=balance, local ledger. |
| `vendor/settings_screen.dart` | VendorSettingsPage.jsx | 12 thông tin shop/chef/contact/bio/address/hours/radius/leadtime/bank và 3 switches; save local settings. |
| `admin/admin_dashboard_screen.dart` | AdminDashboardPage.jsx | Period metrics, 4 category bars, region/search, pending queue inspect/approve, high-value audit/payout. Queue và dashboard audit có state riêng như page web. |
| `admin/users_screen.dart` | AdminUsersPage.jsx | Search/tier/status/spending/sort; card detail, add user name/email/phone/location, lock/unlock confirmation. |
| `admin/vendors_screen.dart` | AdminVendorsPage.jsx | Status/query/district/specialty, inspection photos, approve/re-audit, suspend/unlock, fee editor, invitation mock form. |
| `admin/admin_orders_screen.dart` | AdminOrdersEscrowPage.jsx | Search/stage/type/price, order detail sheet, delivery info mô phỏng, release confirmation. Giữ điều kiện web là chưa released, không tự thêm điều kiện thanh toán backend. |

## 7. Component và trách nhiệm

`core/widgets/common.dart`: `PageBody`, `Panel`, `SectionTitle`, `StatusPill`, `CakePicture`, `EmptyView`, `SearchField`, `SelectField`, `FilterChips`, `ActionButtons`, `InfoRow`, `feedback`, `confirm`. Đây là các primitive hiển thị; không truy cập server hay tính nghiệp vụ.

`form_sheet.dart` quản lý form metadata, controller, required/custom validator và kết quả typed string field map. Domain record chỉ được tạo sau validation. `chat_sheet.dart` lưu text theo conversation key trong AppState. `multi_choice.dart` là lựa chọn nhiều giá trị; OR trong một nhóm, AND giữa các nhóm theo web.

Widget feature dùng model typed, repository/state và token chung. Mọi controller/Timer được dispose. Không dùng global mutable singleton. `Bootstrap` quản lý vòng đời AppState và chỉ tải JSON/font/image từ asset. Loader có thể inject trong test cho loading/error/retry.

## 8. State, model và repository

Chọn Flutter `ChangeNotifier` + `InheritedNotifier` (`AppScope`) vì dữ liệu mock cục bộ, state graph hữu hạn; không cần Riverpod/Bloc/Provider chỉ để bọc thêm. `AppState` là coordinator frontend; `CartState` tách quantity/selection/accessory/voucher/total. Các screen giữ query/tab/draft/dialog local; state liên màn hình vào AppState.

Model nằm trong `models/catalog.dart`, `workflow.dart`, `accounts.dart`: Cake/CakeSize/CartLine/Choice/Store/Voucher; CakeRequest/Quote/CakeOrder/WorkStep/ChatMessage; CustomerProfile/SavedAddress/UserAccount/VendorAccount/WalletTransaction/VendorSettings. Tiền dùng integer VND; không tính số tiền bằng double tùy tiện. Các tỷ lệ hiển thị được round tại ranh giới mô phỏng.

`FixtureBundle` parse JSON tại một ranh giới; `MockBakeryRepository` seed và upsert model typed, trả collection unmodifiable. `BakeryRepository` định nghĩa catalog/stores/vendor catalog, request/quote/order, account và ledger. ID mới dùng counter bắt đầu 10000, không random/DateTime nên test lặp lại được. Catalog và stores UI đi qua repository getter trong AppState; cấu hình/policy/metric tĩnh nằm trong fixture.

RFQ → Quote liên kết bằng `rfqId`; chấp nhận báo giá tạo một active order, không tạo trùng khi bấm lặp. Từ chối sau chọn hủy active mock order trước khi chọn báo giá khác, tránh pending order mồ côi. Checkout giữ snapshot các dòng đã chọn và tổng giá tại thời điểm tạo. Order transition normal có tập cạnh rõ ràng; debug scenario là lối mô phỏng riêng. Review của một order không bị ghi lặp. Phân biệt đây là tính nhất quán của demo frontend, không phải khẳng định hợp đồng backend.

Không sửa các mâu thuẫn tài chính trong backend vì không đọc/đổi backend: vendor revenue hiển thị fee 10%, kanban hiển thị net 95%, admin có take-rate riêng theo đúng nguồn UI. Không gộp thành một công thức mới và không coi đó là chính sách đã xác nhận.

## 9. Hướng tích hợp backend ở giai đoạn sau

Ranh giới hiện có phản ánh catalog/bakery, marketplace, order, identity/profile/chat và administration/wallet mà web thực sự hiển thị. Không triển khai microservice discovery, message queue, gateway hay auth server trong Flutter.

Sau này, xác minh contract public/gateway cùng nhóm backend, rồi thay repository adapters và bootstrap dependency injection. Tách interface theo domain khi đưa adapter thực vào; không để widget tự điều phối nhiều microservice. Cần thống nhất enum/ID, ownership, lỗi/timeout, pagination, payment/escrow và authentication trước khi kết nối. Chưa có endpoint, credential, token refresh hay API client thực trong bản này.

## 10. Android, iOS và accessibility

Android/iOS platform project do Flutter SDK sinh. Development identifiers: Android `dev.sweetcake.sweetcake_mobile`, iOS `dev.sweetcake.sweetcakeMobile`; không phải app ID production. Không tạo keystore/provisioning/profile hay store pipeline. Android `adjustResize` hỗ trợ keyboard. iOS có Runner, AppDelegate, SceneDelegate, storyboard, asset catalog, workspace và scheme; cần macOS/Xcode để compile và xác minh native.

Button thường cao >=48; icon button có tooltip/semantic label; ảnh có nhãn; không khóa TextScaler. Dùng body 14px, contrast Bordeaux/cream, form error tại field. Danh sách/ảnh/data bảng chuyển thành card để có thể đọc khi text scale 1.8. `Wrap` giảm tràn action. Các layout đã được widget-test ở 390×844 và 320×690 với font thật, scale 1.8; không thay cho kiểm tra VoiceOver/TalkBack thực tế.

## 11. Quy ước duy trì và kiểm thử

Dart lower_snake_case cho file, UpperCamelCase cho class/enum, lowerCamelCase cho member. Format bằng `dart format`. Giữ feature ở thư mục feature, primitive ở core, business state ngoài widget. Không hardcode URL API, không `Image.network`/`SvgPicture.network`/HttpClient trong lib. Asset nguồn mới phải bundle và có manifest; font phải đi cùng license.

Thêm screen/action chỉ khi có call-site frontend đang hoạt động và cập nhật feature mapping. Không thêm dark theme, role, notification center, report hay commerce rule từ TODO/comment. Khi khác biệt chỉ do trình bày mobile, nêu rõ nguồn và lý do.

Test unit kiểm tra quan hệ fixture, selected totals/voucher, snapshots, RFQ/quote/idempotency/decline, order lifecycle, withdrawal, chat/address/session. Widget test kiểm tra đủ route, search/navigation/form validation, CRUD catalog, chat và recovery. Bảy golden dùng font thật, có review bằng mắt; baseline PNG ở `test/goldens/`. Android integration chạy trong emulator và không cần dữ liệu backend. Không cập nhật golden để che lỗi; xem ảnh trước khi chấp nhận baseline mới.

Các lệnh và kết quả cuối cùng ở README và báo cáo. Giới hạn chưa xác minh gồm native iOS, thiết bị thật, screen-reader, ký/phát hành store và độ đúng contract backend; không đánh dấu những mục này PASSED.
