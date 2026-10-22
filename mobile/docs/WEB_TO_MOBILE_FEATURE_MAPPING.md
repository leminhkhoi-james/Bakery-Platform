# Đối chiếu web → Flutter

Ngày: 22/10/2026. Nguồn chuẩn: `frontend/src/App.jsx`, `frontend/src/routes/AppRoutes.jsx` và call-site thực tế. **23 page component riêng biệt đã audit; 23 destination Flutter được triển khai.** `vendor-profile`/`vendor-settings` là alias của cùng page, không tính hai màn hình. Không có mobile cũ; số màn hình migration bằng 0.

Trong bảng, đường dẫn web tính từ `frontend/src/pages/`; đường dẫn Flutter tính từ `mobile/lib/features/`. `screen smoke/layout` nghĩa là widget đã render ở 390×844 và 320×690, text scale 1.8; không khẳng định mọi action đã có test native trên iOS. Nội dung control gốc và số dòng tham chiếu nằm trong [inventory JSON](evidence/frontend-source-inventory.json).

## Ma trận truy vết

| Web module/route | Web source | Flutter screen/widget | Functionality hiện có | Mock behavior và adaptation | Trạng thái/verification |
|---|---|---|---|---|---|
| home | `customer/home/HomePage.jsx`; `components/features/home/{Hero,CategoryBento,BestSellers,CustomAtelier,HowItWorks,PartnerBakeries}Section.jsx` | `home/home_screen.dart`, `patisserie_booth.dart`, `catalog/cake_card.dart` | Kiosk/hero, categories, best sellers/size/cart, idea/tone/preview, quy trình, partner links | Cuộn dọc thay snap desktop; cat SVG gốc, native kiosk; 4 bestseller từ catalog, 3 partner; preview text cục bộ | Có UI+mock; screen smoke/layout, home golden, navigation test |
| explore | `customer/catalog/ExploreCakesPage.jsx` | `catalog/catalog_screen.dart`, `catalog_filter.dart`, `cake_card.dart` | Search/sort/price/category/delivery/themes/occasions/color/district, pagination, size/favorite/cart/order | 189 Cake typed; 9/trang; OR trong một nhóm multi-select, AND giữa các nhóm; filter bottom sheet | Có UI+mock; filter unit, empty-search widget, golden, Android search |
| product-detail | `customer/catalog/ProductDetailPage.jsx` | `catalog/product_screen.dart` | Gallery, size guide, size/price/sugar/message/accessories/delivery/quantity, tabs, suggested items | Local gallery và add-on giá 15k/25k; giữ cấu hình trong CartLine; add/fast-order → cart | Có UI+mock; smoke/layout; widget xác minh size/message/add-on/giá |
| ai-studio | `customer/ai-studio/AiCakeStudioPage.jsx` | `studio/studio_screen.dart` | AI/upload tabs, prompt presets/tags, generate preview, size/flavors/topping/accessories, placement/message, estimate/budget presets, delivery/note, submit RFQ | 2 preview bundle, delayed local generation; sample attachment; typed draft; submit shared request → bidding | Có UI+mock; smoke/layout, golden; request workflow unit; upload không truy cập thiết bị |
| bidding | `customer/bidding/BiddingComparisonPage.jsx`; `context/AppDataContext.jsx` | `bidding/bidding_screen.dart` | Request summary/edit/cancel/extend/reopen, quote sort/detail/chat/accept; demo stages/confirm/decline/reset | Quote theo rfqId, accept tạo active mock order, confirmation → payment; order/requests dùng shared state | Có UI+mock; lifecycle/idempotency/decline unit, accept-navigation widget, Android journey, golden |
| baker-quote | `customer/bidding/BakerQuoteDetailPage.jsx` | `bidding/quote_screen.dart` | Specs/comparison/package, chat, adjust-note, share, confirm escrow | Specs từ request/quote, local message và clipboard; chọn tiệm → payment; không giữ tiền thật | Có UI+mock; smoke/layout, chat widget; không gọi share service/backend |
| stores | `customer/stores/StoreDirectoryPage.jsx` | `stores/stores_screen.dart` | Search name/location/chef/specialty; TP.HCM; menu và studio links | 5 Store typed, local filter, card dọc | Có UI+mock; smoke/layout. Conditional customCake không được mở từ app vì web không gọi setter |
| cart | `customer/checkout/CartCheckoutPage.jsx`; `App.jsx` cart handlers | `checkout/cart_screen.dart`, `state/cart_state.dart` | Item selection/all, quantity/remove/clear, accessory quantity, voucher, checkout fields, delivery/pickup, schedule/message/card/payment choice | Selected totals + minimum/capped discounts, integer VND; checkout snapshot → payment | Có UI+mock; totals/quantity/voucher/snapshot unit; disable-checkout widget; golden |
| payment | `customer/checkout/PaymentGatewayPage.jsx` | `checkout/payment_screen.dart` | VNPAY/MoMo/COD, countdown/copy, verify/fail/retry, success navigation | QR biểu trưng không phải mã nhận tiền; Future local loading/failure; mark paid hoặc COD; tracking/profile | Có UI+mock; smoke/layout; Android payment journey thành công offline |
| tracking | `customer/tracking/OrderTrackingPage.jsx` | `tracking/tracking_screen.dart`, `order_dialogs.dart` | Timeline/QC gallery/driver/telemetry/chat, time/plaque edit, receipt, review/confirmation, cancel/refund, overdue/dispute demo | Local order transitions/notes; gallery 6 ảnh; 4 rating/comment/photo marker; cancel 70%/20%; route diagram thay live map | Có UI+mock; smoke/layout; lifecycle/cancel/review unit; native GPS/telemetry không triển khai thật |
| profile | `customer/profile/CustomerProfilePage.jsx` | `profile/profile_screen.dart`, `security_panel.dart` | Profile edit, order groups/history/reorder, receipt/tracking/chat link, address/default, password and notifications | Local profile/addresses/order snapshot; password fields chỉ validate rồi xóa; SMS/Zalo flags cục bộ | Có UI+mock; smoke/layout; default-address/session unit; một số nội dung phụ được gom vào card |
| login/register | `auth/AuthPage.jsx` | `auth/auth_screen.dart` | Phone/password login; last/first/phone/password register >=6, visibility; forgot-password guidance | Simulated session/profile; register 100 welcome points theo web; navigate home | Có UI+mock; required/password widget, smoke/layout; không có real authentication |
| vendor-dashboard | `vendor/dashboard/VendorDashboardPage.jsx` | `vendor/vendor_dashboard_screen.dart` | Receiving switch, metrics, quick quote/dismiss, progress/shortcuts | Counts từ local state, wallet fixture, quick quote repository; dismissed IDs local | Có UI+mock; smoke/layout; quote/state coverage unit |
| vendor-rfq | `vendor/rfq/VendorRfqMarketplacePage.jsx` | `vendor/rfq_screen.dart` | Search/category/budget/distance/urgent/today, detail/chat/reject/quote | Read shared requests, rejected IDs chỉ ẩn phía tiệm, selected request → quote editor | Có UI+mock; smoke/layout; RFQ quan hệ được unit-test |
| vendor-quote-submit | `vendor/rfq/VendorBespokeQuoteSubmitPage.jsx` | `vendor/quote_editor_screen.dart` | Quote price/size/flavor/hours/note, add/remove 1–3 sample images, 3 commitments | Sample assets, validate positive price/hours; Quote keyed rfqId; về RFQ list | Có UI+mock; smoke/layout; bid-to-order unit/Android journey |
| vendor-menu | `vendor/catalog/VendorMenuCatalogPage.jsx` | `vendor/vendor_catalog_screen.dart`, `cake_editor.dart` | Query/status/prep/category, create/edit/append-size/prices/options, sale toggle, clone, delete | 2 seeded vendor cakes; local repository CRUD; confirmation; desktop drawer → dialog | Có UI+mock; smoke/layout; edit/clone widget xác minh giữ cost; sort web chưa có logic nên không thêm |
| vendor-orders | `vendor/orders/VendorOrderManagementPage.jsx` | `vendor/vendor_orders_screen.dart` | 5 cột kanban, search/urgent/category, confirm/reject/start/steps/QC/finish/driver/success/fail/timeline | Phase chips thay cột ngang; WorkStep checklist; normal transition graph; demo contact/QC feedback | Có UI+mock; smoke/layout/golden; normal/failure transitions unit; Android visibility |
| vendor-revenue | `vendor/revenue/VendorRevenueEscrowPage.jsx` | `vendor/revenue_screen.dart` | Balance/locked/revenue/fee, query/status ledger, withdraw/all-amount | Balance 32.5M, transaction list 7, min 500k và max balance; append local withdrawal transaction | Có UI+mock; boundary unit và inline-validation/success widget |
| vendor-profile/settings | `vendor/settings/VendorSettingsPage.jsx` | `vendor/settings_screen.dart` | Shop/chef/phone/email/bio/address/hours/radius/leadtime/bank details, 3 toggles, save, storefront/menu links | Local VendorSettings, form validation; storefront link giữ; catalog có drawer shortcut | Có UI+mock; smoke/layout; không đổi profile ngân hàng thật |
| admin-dashboard | `admin/dashboard/AdminDashboardPage.jsx` | `admin/admin_dashboard_screen.dart` | Period metrics, category breakdown, cluster/search, queue inspect/approve, audit/payout | 4 period metrics, static source category ratios, dashboard queue/audit state riêng như web; local approvals/disbursements | Có UI+mock; smoke/layout/golden; không phải báo cáo tài chính thật |
| admin-users | `admin/users/AdminUsersPage.jsx` | `admin/users_screen.dart` | Search/tier/status/spending/sort, detail/add, lock/unlock | 7 accounts, required name/email, simulated status/trust change; card thay table | Có UI+mock; smoke/layout; isolated account mutations unit. Advanced filter/pagination web không hoạt động bị loại |
| admin-vendors | `admin/vendors/AdminVendorsPage.jsx` | `admin/vendors_screen.dart` | Status/query/district/specialty, inspect, approve/re-audit/lock/unlock, fee, invite | 6 vendor profiles + inspection photos; append pending invite; take-rate 3.5/5/6.5/8%; local state, không gửi email | Có UI+mock; smoke/layout; sự thay đổi dùng typed repository |
| admin-orders | `admin/orders/AdminOrdersEscrowPage.jsx` | `admin/admin_orders_screen.dart` | Query/stage/type/price, detail, GPS mock, release; refund info | Shared kanban + admin seed, dedup normalized IDs; card/sheet; release chưa released → completed | Có UI+mock; smoke/layout; dữ liệu và release nội bộ. Date filter/pagination/config không được bổ sung logic mới |

## Component/navigation dùng chung

| Nguồn web | Flutter | Hành vi giữ |
|---|---|---|
| `layouts/customer/Header.jsx`, `Footer.jsx`, `mockData/shared/navigation.js` | `app/app_shell.dart`, `app/router/*` | Customer destination, cart count, profile/tracking/bidding links, public vendor/admin links; mobile drawer và bottom navigation |
| `layouts/vendor/Vendor{Sidebar,Header}.jsx` | `AppShell`, VendorDashboardScreen | Partner navigation, receiving status, notification summary, storefront/profile links |
| `layouts/admin/Admin{Sidebar,Header}.jsx` | `AppShell`, AdminDashboardScreen | 4 admin destinations, search/cluster được trình bày trong màn hình tương ứng |
| `components/common/{Button,Card,Badge,SearchBar,EmptyState,LoadingSpinner}.jsx` | `core/widgets/common.dart` và ThemeData | Button/input/card/status/empty/loading primitives, responsive và semantic labels |
| `components/common/PolicyModal.jsx` | `showPolicies` trong `home/home_screen.dart` | 3 tabs, search; nội dung nguồn bundle trong `POLICY_TEXT`; không xác minh pháp lý hay thêm chính sách mới |
| Page-specific chat dialogs | `core/widgets/chat_sheet.dart` | Send nonempty local message, lưu theo conversation key; không realtime/server/push |

## Trường form, validation và trạng thái

- **Auth:** login phone/password required; register first name/phone/password required, password >=6; last name optional. Quên mật khẩu chỉ thông báo hướng dẫn như web. Birthday/remember/agreeTerms không render nên không thêm.
- **Product:** size, sweetness (French/−30%/−50%), inscription <=35, candle/hat, express/scheduled, quantity >=1. Đơn giá = selected size +15k candle +25k hat; quantity nhân sau. Giá giữ integer.
- **Studio:** prompt, budget>0, date/address, preset/custom time required khi chọn custom; size/flavor/topping/accessories, message/placement, note. Estimate thuần local; không coi ước tính là báo giá được bảo đảm.
- **Checkout:** recipient name/phone required; email optional có kiểm tra format; address/district required khi delivery, bỏ yêu cầu khi pickup; date/slot, plaque <=35, card/note, method. Voucher kiểm tra existence, minimum và percent cap. Không chọn món thì disable checkout.
- **Profile:** name/phone edit; address title/details required, phone fallback profile; một default. Password current required, new >=6, confirmation khớp; không lưu password thật.
- **Vendor quote/catalog/settings:** positive quote/price/hours, required tên mẫu/size; catalog chỉ sửa price/label, cost readonly đúng nguồn. Hồ sơ tiệm 12 field và 3 bool. Withdrawal min500k, <=available.
- **Admin:** add-user name/email required, phone/location; invite name/phone required, chef/email/specialty/location; fee selection bốn mức. Lock/delete/cancel/release có confirmation.
- **Feedback:** bootstrap loading/error/retry; AI generation disabled/loading; payment verifying/fail/retry/success; list populated/empty/search; selected/disabled controls; form field errors; local confirmation/snackbar rõ “mô phỏng”.

## Hành vi có điều kiện, placeholder và phần không mở

| Phân loại | Bằng chứng source | Quyết định mobile |
|---|---|---|
| Accessible | 23 branches/page component trong AppRoutes | Có destination tương ứng |
| Conditional | Product/RFQ/quote argument; tracking cancellation trước giao; release khi chưa released | Giữ argument và điều kiện UI tương ứng |
| Public demo portals | Customer Header links vendor/admin, không có auth guard | Không phát minh auth/RBAC mới; ghi rõ đây là portal demo |
| Unmounted component | TrendingCakesSection, CommitmentsAndReviewsSection, InstagramAndNewsletterSection không được HomePage import/mount | Không thêm trending, newsletter subscription hay home-review module |
| Dormant state/prop | `onSetCustomCake`, `allowFlexiblePrice`, auth birthday/remember/terms, product isWishlisted không có active control/call-site | Không tạo business action tương ứng. Favorite trong catalog vẫn có vì control hoạt động |
| Conditional unreachable | StoreDirectory customCake branch có source, nhưng studio không gọi setter | Không mở nút đặt custom trực tiếp tại tiệm |
| Placeholder | Web upload/360/GPS/calls dùng alert/illustration; AI/payment/withdraw là timeout/state | Bundle sample/local feedback; không tải lên, không WebGL, không GPS/AI/phone/bank service |
| Placeholder data controls | Một số pagination admin, vendor-catalog sort, date filter admin/advanced-filter, Escrow config không có setter mở | Không tạo capability mới cho control không thực hiện chức năng; mobile cuộn toàn bộ bản ghi nhỏ |
| Không có screen | Role constants chef/delivery; không có route/component riêng | Không tạo portal mới |

## Khác biệt trình bày và giới hạn

Table/kanban/drawer desktop được chuyển thành card, phase chips, form dialog hoặc bottom sheet. Home kiosk được đơn giản hóa bằng layout native giữ màu, họa tiết, SVG và lời giới thiệu nguồn; không cam kết pixel-perfect với desktop. Header search được gom vào màn catalog. System back và keyboard dùng Flutter native; chưa có native iOS evidence.

Một số nội dung phụ được trình bày ngắn hơn: explanatory policy/product copy, telemetry cập nhật cố định và bản đồ chỉ sơ đồ minh họa. Ảnh remote đều local; 7 URL không truy xuất được có fallback. Upload thực, 360 viewer, gọi điện, GPS, VAT generation, gửi thư và thông báo thật không nằm trong phase này. Bản web cũng dùng dữ liệu mô phỏng, nhưng có các bản copy state thiếu đồng bộ; Flutter giữ shared RFQ/order nhất quán và không nhân quote của yêu cầu mẫu cho RFQ mới.

Không có migration table React Native → Flutter vì baseline không có `mobile/`. Không xóa hay chuyển đổi tệp ứng dụng cũ. Toàn bộ dữ liệu source gốc được giữ trong `assets/data/web_fixtures.json`, bên cạnh model typed và asset manifest.

Ở home, nhãn category bento-4/bento-5 và category được điều hướng tới có sự không khớp trong web: bento-4 dẫn `Bánh Trung Thu & Quà Tặng`, bento-5 dẫn `Bánh Tạo Hình 3D`. `HomeCategories` giữ call-site này, không tự sửa ý nghĩa danh mục khi không có chỉ định. Checkout giữ ba lựa chọn khung giờ nguồn (09:00–10:30, 14:00–15:30, 18:00–19:30) và default seed 15:30–16:30.

Native iOS, kiểm thử thiết bị thật, screen reader và độ tương đương từng điểm ảnh vẫn là các hạng mục chưa xác minh. Kết quả cụ thể và checklist nằm trong [báo cáo cuối](MOBILE_IMPLEMENTATION_REPORT_VI.md).
