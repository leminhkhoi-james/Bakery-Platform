# Audit và kế hoạch trước triển khai

Ngày: 22/10/2026. Nhánh ban đầu: `test`; working tree ban đầu sạch; không có `mobile/`, không có ứng dụng hay test cũ để migrate. Kiểm kê read-only 126 file frontend trong `evidence/frontend-source-inventory.json`, gồm 23 page component, route, layout, component dùng chung, service mock, token và fixture.

## Nguồn chuẩn và phạm vi

React 19.2.8, Vite 8.3.0, Tailwind 4.3.3, JavaScript, `App.jsx` tự điều hướng bằng History API; không có React Router hay auth guard. `AppRoutes.jsx` có 23 page component riêng biệt: 11 customer, 1 auth, 7 vendor, 4 admin. `vendor-settings` và `vendor-profile` cùng một trang. Header công khai liên kết đến hai portal. `chef`/`delivery` chỉ là enum, không có portal riêng. Không tạo màn hình cho các role này.

`AppDataContext.jsx` chia sẻ RFQ → bid → kanban. Nhiều state khác nằm trong page/localStorage; services trả Promise mock. Không sử dụng services hay endpoint của backend trong Flutter. Không đọc backend internals. Các tài liệu được AGENTS tham chiếu (`PROJECT-STATUS.md`, `02-system-architecture.md`, `API_SPEC.md`, `decisions/`) không tồn tại tại baseline. Không tạo/sửa root docs vì phạm vi mission chỉ cho phép `mobile/`.

## Kế hoạch 23 màn hình

| Nhóm | Route nguồn | Flutter dự kiến | Hành vi cần giữ |
|---|---|---|---|
| Customer | home | HomeScreen | Hero kiosk/mèo, danh mục, bán chạy, size, add cart, ý tưởng, quy trình, đối tác, policy; trending/review/newsletter không được mount |
| Customer | explore | CatalogScreen | Search, sort, giá, category, thời gian, theme, occasion, color, district, phân trang, wishlist, size, cart |
| Customer | product-detail | ProductScreen | Gallery, size/giá, độ ngọt, inscription, phụ kiện, delivery, quantity, tabs, size guide, đặt nhanh |
| Customer | ai-studio | StudioScreen | Prompt preset/tag, preview giả lập, ảnh tham chiếu, cấu hình, budget, date/time/address/note, tạo RFQ; callback chọn tiệm không được gọi trong web |
| Customer | bidding | BiddingScreen | RFQ hiện tại, sort quote, cancel/edit/extend/reopen, demo stage, detail/chat, accept → payment |
| Customer | baker-quote | QuoteScreen | Thông số, package, ảnh đối chiếu, chat, điều chỉnh, xác nhận escrow demo |
| Customer | stores | StoresScreen | Search TP.HCM, menu, studio; chọn tiệm khi có thiết kế |
| Customer | cart | CartScreen | Chọn món, quantity/remove/clear, phụ kiện, voucher; checkout form, giao/pickup, ngày/giờ, lời chúc, phương thức |
| Customer | payment | PaymentScreen | VNPAY/MoMo/COD, clipboard, chờ/xác nhận/lỗi/retry, tracking/profile |
| Customer | tracking | TrackingScreen | Timeline, ảnh QC, telemetry giả, chat, chỉnh giờ/chữ, biên lai, review, cancel/refund, overdue/dispute |
| Customer | profile | ProfileScreen | Hồ sơ, lịch sử/reorder/bespoke, address/default, đổi mật khẩu, notification switches |
| Auth | login | AuthScreen | Login/register, required fields, mật khẩu đăng ký >=6, visibility, quên mật khẩu chỉ hướng dẫn |
| Vendor | vendor-dashboard | VendorDashboardScreen | Receiving switch, metric, RFQ quick quote/dismiss, các lối tắt |
| Vendor | vendor-rfq | RfqScreen | Search/category/budget/distance/urgency, detail/chat/reject/quote |
| Vendor | vendor-quote-submit | QuoteEditorScreen | Price/size/flavor/hours/note, 1–3 ảnh demo, commitments, thêm bid |
| Vendor | vendor-menu | VendorCatalogScreen | Search/status/prep/category, create/edit size/price/options (cost chỉ đọc), clone, sale toggle, delete confirm |
| Vendor | vendor-orders | VendorOrdersScreen | 5 stage, filter/search, confirm/reject/start/checklist/QC/finish, driver, success/fail, timeline |
| Vendor | vendor-revenue | RevenueScreen | Balance, filter/search transaction, withdraw >=500k và <=balance |
| Vendor | vendor-profile | SettingsScreen | Shop/chef/contact/bio/address/hours/radius/leadtime/bank, 3 switches, save |
| Admin | admin-dashboard | AdminDashboardScreen | Period metrics, cluster/search, duyệt tiệm, audit/payout |
| Admin | admin-users | UsersScreen | Search/tier/status/spending/sort, detail/add, lock/unlock |
| Admin | admin-vendors | VendorsScreen | Status/search/region/specialty, inspection, approve/re-audit/lock, fee, invite |
| Admin | admin-orders | AdminOrdersScreen | Stage/search/type/price, detail, telemetry mô phỏng, giải ngân có điều kiện |

## Giới hạn của web phải phân biệt

Pagination của một số bảng admin, sort trong vendor catalog, date filter admin và advanced filters có UI nhưng chưa có logic dữ liệu đầy đủ; không tự tạo business rule mới. Telemetry/GPS, AI, upload minh họa, payment, ngân hàng, thông báo và gửi thư mời đều đang được web giả lập. Mobile phải thông báo rõ mô phỏng; không gọi dịch vụ thật. Thuật ngữ escrow trong UI web khác quy tắc backend; chỉ dịch giao diện hiện hữu, không thay đổi hợp đồng backend.

## Thiết kế và kiến trúc đã chọn

- Bordeaux `#6B212E`, dark `#4F1722`, caramel `#B87328`, nền `#FFFDFA`, chữ `#241815`, viền `#EBDCD0`; lấy từ `frontend/src/index.css`. Quicksand heading, Plus Jakarta Sans body, font bundle offline.
- `ThemeData`, native `Navigator` với enum route, `ChangeNotifier` và `InheritedNotifier`: không cần thêm state/router dependency cho ứng dụng demo offline. Bottom navigation customer, drawer cho toàn bộ destination/portal; Navigator giữ back stack.
- Domain model typed, repository contract và in-memory mock implementation. Integer VND, ID counter deterministic, không HTTP client. Fixture JSON chỉ parse ở data boundary; widget dùng model typed.
- Responsive card/list, bottom sheet thay desktop drawer, SafeArea, field keyboard phù hợp, target >=48, `Wrap` cho action, constraint width 760; hỗ trợ text scale.
- Unit test cho workflow và calculation; widget test cho routes/forms/navigation/small screen/text scale; goldens và Android debug build nếu công cụ hỗ trợ. iOS project được generate; native build cần macOS.

Điều chỉnh sau trace call-site: loại các component home không mount; `onSetCustomCake` chỉ được khai báo, không được gọi, nên không mở luồng studio → chọn tiệm. `frontend/src/assets/hero.png` là asset Vite cũ, không dùng; thay bằng SVG mèo trích trực tiếp từ `HeroSection.jsx` và kiosk native. `flutter_svg` chỉ render asset offline, là dependency có mục đích rõ ràng.

Toolchain kiểm tra: Flutter 3.47.1, Dart 3.13.1 stable. Flutter đang ở `[user-branch]`; không đổi hay nâng cấp SDK toàn cục. Android SDK 36/JDK21 có sẵn, doctor cảnh báo license; không có device Android kết nối. Windows không build native iOS.
