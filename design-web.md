# Design system Web hiện hữu — Bakery Platform / SweetCake

Bản trích xuất ngày 2026-11-06 từ mã nguồn và Chromium render thật. Đây là tài liệu mô tả hình ảnh/hành vi đang có, không phải một bản redesign hoặc cam kết mọi nghiệp vụ đã hoạt động. Không sửa CSS/JSX, không áp palette của Taste lên Web và chưa tạo Flutter ThemeData/component.

## 1. Phạm vi, phương pháp và độ chắc chắn

Đã lập inventory 35 route canonical, đọc component/CSS/theme/assets và render các nhóm public/customer/vendor/admin. Browser evidence ban đầu có 56 observation và 10 lượt trang chi tiết, bổ sung smoke Web–Docker với sản phẩm/ảnh thật. Các kích thước chính 1440, 1024, 768, 390 × 1000 CSS px. Route detail không có id chỉ cho biết empty/error state; hình sản phẩm Docker bổ sung dữ liệu thật. Không khẳng định mọi trạng thái form, drawer, hover hoặc mọi tổ hợp viewport được chụp.

Phân biệt `SOURCE_VERIFIED` (giá trị khai báo), `RENDER_VERIFIED` (computed style/screenshot) và `FUTURE_MAPPING` (gợi ý Flutter, chưa implementation). Source và render khác nhau thì ghi cả cascade và giá trị thắng. [Browser evidence](docs/audit/evidence/browser-runtime.json), [Docker browser](docs/audit/evidence/browser-docker.json), [token inventory](docs/audit/evidence/design-tokens.json).

## 2. Ngôn ngữ thị giác và cascade

SweetCake dùng đỏ wine, hồng nhạt, nền trắng/slate, chữ sans rõ và góc bo mềm. Trang chủ có quầy bánh/mascot mèo, mây mint, tia hồng và sọc kẹo. Các workspace nghiệp vụ giữ wine/pink nhưng dùng panel trắng, thanh công cụ slate, bảng và sidebar dễ quét. Đây là hai ngữ cảnh của cùng thiết kế hiện có; không tự bỏ các hoa văn trang chủ để đồng nhất thành dashboard. Không thấy dark-mode toggle hoặc bộ token dark hoàn chỉnh được kết nối.

Thứ tự stylesheet tại [main.jsx](frontend/src/main.jsx): `index.css` (Tailwind v4 + design-tokens) → `artisan-workspace.css` → `legacy-backgrounds.css` → `design-system.css`. CSS module/component import có thể xuất hiện trong bundle cùng các utility, specificity quyết định cuối cùng; không đọc riêng Tailwind class để suy ra hình ảnh. [design-system.css](frontend/src/styles/design-system.css) chuẩn hóa font, spacing, control và panel. [legacy-backgrounds.css](frontend/src/styles/legacy-backgrounds.css) bảo tồn nền/decor.

Ví dụ xung đột đã đối chiếu: ProductCard khai báo ảnh 4/5 nhưng `.sc-catalog-card > button` ở artisan thắng thành 1/1; `font-serif`/`font-fraunces` được alias về Plus Jakarta Sans; Badge có `rounded-full` nhưng contract dùng radius 8px; Button md có `text-xs` nhưng contract cuối dùng 14px. Các comment “Caramel Gold” không mô tả đúng secondary #c05477 hiện tại, không lấy comment làm nguồn màu.

## 3. Màu sắc và semantic usage

Nguồn chính [design-tokens.css](frontend/src/styles/design-tokens.css), [index.css:4](frontend/src/index.css#L4). Các giá trị hex dưới đây là màu thiết kế, không phải secret.

| Vai trò | Giá trị hiện có | Sử dụng |
|---|---|---|
| Primary | `#6b212e` | Heading, action chính, nav được chọn |
| Primary hover/container | `#4f1722` | Hover nút chính, nhấn mạnh |
| On primary | `#ffffff` | Chữ/icon nút wine |
| Accent / secondary / focus | `#c05477` | Focus outline, kicker, CTA phụ |
| Brand pink | `#d46387` | Trang trí, illustration tint |
| Pink token | `#ffe4ec` | Nền nhấn mềm |
| Page decorative pink | `#fff0f5`, `#fff1f5`, `#fff8fa` | Customer canvas, sọc và fairy backdrop |
| Text | `#0f172a` | Nội dung chính |
| Muted | `#64748b` | Mô tả và nhãn phụ |
| White/cream token | `#ffffff` | Surface/panel; tên cream hiện không có nghĩa vàng kem |
| Background low | `#f8fafc` | Portal, input, surface nhẹ |
| Surface/container | `#f1f5f9` | Toolbar, tabs, table header |
| Border / outline variant | `#e2e8f0` | Card, table, input |
| Outline | `#94a3b8` | Icon/label legacy, không mặc định đủ contrast cho text nhỏ |
| Error | `#b91c1c` / `#fee2e2` / `#7f1d1d` | Error, container và chữ trong container |
| Mint decor | `#6fb9c6`, `#dcf0f4` | Mây/chấm/sọc trang chủ, không thay màu success |

StatusBadge ở [WorkspaceUI.jsx:14](frontend/src/components/common/WorkspaceUI.jsx#L14) dùng nhãn và chấm cùng màu; trạng thái không nằm trong map dùng neutral.

| Tone | Background | Foreground | Status tiêu biểu |
|---|---|---|---|
| Green | `#eaf4ec` | `#2c6949` | ACTIVE/PUBLISHED/APPROVED/COMPLETED |
| Amber | `#fff2dc` | `#94601c` | PENDING/PENDING_APPROVAL/SUBMITTED/PAYMENT_REVIEW/BAKING |
| Blue | `#edf2f8` | `#456b8b` | CONFIRMED/READY/DELIVERING/SCHEDULED |
| Red | `#fbecef` | `#a14b59` | REJECTED/CANCELLED/CLOSED/SUSPENDED/EXPIRED |
| Neutral | `.sc-status` base + inherited text | Theo scope | DRAFT và status chưa map |

Badge chung có variants default/primary/success/warning/error/info bằng Tailwind slate/emerald/amber/rose/sky. Không đồng nhất các shade này với StatusBadge nếu cần tái hiện đúng. Hai họ component cần được lựa chọn có chủ đích khi mobile có UI.

### Độ tương phản tính từ màu đặc

Bảng sau tính relative sRGB luminance bằng script, không thay audit toàn trang có ảnh/opacity. Theo [WCAG 2.2 SC 1.4.3](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html), text thường cần 4,5:1, text lớn 3:1.

| Foreground / background | Ratio | Text thường AA |
|---|---|---|
| `#ffffff` / `#6b212e` | 11.16:1 | Đạt |
| `#0f172a` / `#ffffff` | 17.85:1 | Đạt |
| `#64748b` / `#ffffff` | 4.76:1 | Đạt |
| `#ffffff` / `#c05477` | 4.40:1 | Không đạt |
| `#94a3b8` / `#ffffff` | 2.56:1 | Không đạt |
| `#2c6949` / `#eaf4ec` | 5.78:1 | Đạt |
| `#94601c` / `#fff2dc` | 4.81:1 | Đạt |
| `#456b8b` / `#edf2f8` | 5.00:1 | Đạt |
| `#a14b59` / `#fbecef` | 5.00:1 | Đạt |

## 4. Typography

Font UI thực tế là **Plus Jakarta Sans**, fallback `system-ui, -apple-system, Segoe UI, sans-serif`; body computed 14px. Google Fonts link tải weights 400/500/600/700. Logo chữ `.font-sweetcake` dùng Dancing Script/cursive, khác ảnh logo artwork. `index.html` còn tải Fraunces, Quicksand, Nunito, Cormorant Garamond, Montserrat, Baloo 2 nhưng alias CSS hiện tại phần lớn quay về Plus Jakarta Sans; không suy ra mọi font tải đều đang render.

| Semantic | Source size | Line-height | Weight | Quy tắc |
|---|---|---|---|---|
| Body/sm | 14px | 1.6 = 22.4px | 400 | Nội dung, input, bảng |
| XS/kicker/status | 12px | 1.5 = 18px | 600–700 | Nhãn ngắn, badge |
| Label legacy | .8rem = 12.8px | 1.6 | theo component | Nhỏ hơn body, không coi mọi label đều14 |
| Heading h3–h6 | 16px | 1.3 = 20.8px | 700 | Tiêu đề card |
| Section h2 | 20px | 26px | 700 | Tiêu đề section thông thường |
| Customer h1 | clamp(24px, 2.5vw, 32px) | 1.3 | 700 | Letter spacing −.02em |
| Portal header h1 | 20px | 26px | 700 | Contract riêng header |
| Home snap h2 | clamp(24px, 3vw, 36px) | 1.3 | 700 | Home marketing exception |
| Metric value | 32px | 40px | 700 | Các class metric; không mặc định admin-title token24 thắng |
| SweetCake wordmark DOM | Render mẫu48px | 48px | 700 | Dancing Script; artwork không thay bằng font UI |
| Button md | 14px | 1.4 = 19.6px | 600 | sm12px, lg14px |

Chữ uppercase/letter spacing .1em chỉ ở một số lớp decor/eyebrow; nội dung nghiệp vụ dùng sentence case/tiếng Việt. Giá tiền dùng formatter VND, table money có tabular-nums. Phải thử dấu tiếng Việt, currency, UUID dài và textScale sau này.

Plus Jakarta Sans và Dancing Script có [OFL upstream](https://github.com/google/fonts/blob/main/ofl/plusjakartasans/OFL.txt), [OFL Dancing Script](https://github.com/google/fonts/blob/main/ofl/dancingscript/OFL.txt). Nếu bundle font Flutter cần mang license/đúng bản font và kiểm tra glyph tiếng Việt; đợt này chưa tải font vào mobile.

## 5. Spacing, container, grid, responsive

| Token / pattern | Desktop | Nhỏ hơn640px |
|---|---|---|
| Content max | 88rem = 1408px | 100% theo viewport |
| Page gutter | clamp(16px,3vw,32px) | 16px tại390px |
| Page top/bottom | 32 / 48px | 24 / 32px |
| Section gap | 24px | 20px |
| Card gap | 16px | 16px |
| Card padding | 24px | 16px |
| Control/card/badge radius | 12 / 20 / 8px | Contract cuối giữ giá trị chung |
| Baseline spacing palette | 4,8,16,24,40,48px | Một số cục bộ12/20/32/36px, không ép thành scale mới |

Customer có container center; explore là filter sidebar và grid, filter thu gọn khi hẹp. Product/bakery detail chuyển cột ảnh–thông tin thành stack; giỏ dùng phần nội dung và summary sticky ở màn hình rộng. Profile có nav và panel; ở390px nav thành grid hai cột. Portal có sidebar cố định desktop, header72px; admin sidebar256px, vendor288px. Từ768px header/main chừa sidebar; dưới768px chuyển menu overlay và main toàn chiều rộng. Drawer width min(768px,88vw) desktop, full width dưới640px. Native dialog ở top layer, không cần sao chép z-index web sang Flutter.

Breakpoint nguồn: Tailwind sm640, md768, lg1024, xl1280 và class responsive đang dùng; bổ sung custom1280–1439 để ẩn full customer nav vì nhãn/search thiếu chỗ. Browser xác nhận1440 full nav;1024/768/390 hamburger. <=639px đổi padding/gap; admin table <=640px min-width34rem/544px và cuộn ngang trong region. Không rút mọi table thành card nếu yêu cầu giữ Web; đó là quyết định UI mobile tương lai.

Header/search/menu có ngoại lệ kích thước: một số nút menu40px và category36px, refresh36px desktop/tableaction40px; token44px không bảo đảm mọi target hiện tại44px. Cần ghi nhận và cân nhắc native minimum khi triển khai Flutter.

### Kích thước đã render

| Route / vai trò | Viewport | Document width | Body | Heading đầu tiên |
|---|---|---|---|---|
| `/` / anonymous | 1440 | 1425 | 14px | 48px / 700 |
| `/explore` / anonymous | 1440 | 1425 | 14px | 32px / 700 |
| `/login` / anonymous | 1440 | 1425 | 14px | 20px / 700 |
| `/` / anonymous | 1024 | 1009 | 14px | 48px / 700 |
| `/explore` / anonymous | 1024 | 1009 | 14px | 25.6px / 700 |
| `/login` / anonymous | 1024 | 1009 | 14px | 20px / 700 |
| `/` / anonymous | 768 | 753 | 14px | 48px / 700 |
| `/explore` / anonymous | 768 | 753 | 14px | 24px / 700 |
| `/login` / anonymous | 768 | 753 | 14px | 20px / 700 |
| `/` / anonymous | 390 | 375 | 14px | 30px / 700 |
| `/explore` / anonymous | 390 | 375 | 14px | 24px / 700 |
| `/login` / anonymous | 390 | 375 | 14px | 20px / 700 |
| `/login` / customer | 1440 | 1425 | 14px | 20px / 700 |
| `/profile` / customer | 1440 | 1425 | 14px | 32px / 700 |
| `/profile` / customer | 390 | 375 | 14px | 24px / 700 |
| `/login` / owner | 1440 | 1425 | 14px | 20px / 700 |
| `/vendor-dashboard` / owner | 1440 | 1425 | 14px | 20px / 700 |
| `/login` / admin | 1440 | 1425 | 14px | 20px / 700 |
| `/admin-dashboard` / admin | 1440 | 1425 | 14px | 20px / 700 |

Document width thường nhỏ hơn viewport15px do scrollbar gutter stable. Không thấy horizontal document overflow trong mẫu public ở bốn kích thước; điều này không chứng minh mọi drawer/table/state đều không overflow. `checkVisibility` có thể gồm heading dưới fold; chỉ screenshot/rect là bằng chứng vị trí trong viewport.

## 6. Surface, border, shadow và backdrop

Shared card `border 1px #e2e8f0`, radius20, shadow `0 4px 20px -2px rgba(15,23,42,.05)`; hover `0 10px 25px -4px rgba(15,23,42,.08)`. Panel trắng, toolbar slate; catalogcard padding12px và body8/8/12px là ngoại lệ. Home dome-card border1.5px #f2dbe2, radius165px165px18px18px, hover translateY(-5px), không biến mọi card thành dome.

Drawer nền #f8fafc, shadow trái −16px 0 60px #321b2c20; discard-dialog radius20, backdrop #0f172a80 blur3px. Chat entry radius24/backdrop đen30% blur4px; policy dialog width min(1024px,100vw−32px),height90dvh,radius24/backdrop wine có blur12px. Portal header trắng có backdrop blur20px; không mặc định blur thấy rõ trên mọi nền.

Nền hiện có: sunburst repeating-conic quanh50%/248px, sọc trắng/hồng chu kỳ124 hoặc152px; fairy JPG cover/center top/fixed, local overrides bỏ fixed trên thiết bị nhỏ/touch; mây/chấm mint14px, gingham32px. Ornaments pointer-events:none, clipping và lớp tách nền giúp không chặn control. Các recipe ở [index.css:524](frontend/src/index.css#L524) và [legacy-backgrounds.css](frontend/src/styles/legacy-backgrounds.css).

## 7. Inventory component và trạng thái

| Component / nguồn | Cấu trúc và thông số | States/interaction hiện có | Flutter mapping tương lai |
|---|---|---|---|
| [Button.jsx](frontend/src/components/common/Button.jsx) | primary/secondary/outline/ghost/danger; sizes40/44/48px, radius12; gap6/8/10px | Hover tối wine primary; activeY1; focus2px offset3; disabledopacity.45; busy do caller disable/copy | FilledButton/OutlinedButton/TextButton, WidgetStateProperty; không cài ngay |
| [WorkspaceUI.jsx](frontend/src/components/common/WorkspaceUI.jsx) | Icon, SectionHeading, StatusBadge, DataTable, EmptyPanel, DetailDrawer, PortalHeader | aria label/caption/status; tone theo status; native dialog busy/dirty; account menu | Component native có semantics và state; tách khi xuất hiện nhu cầu |
| [Badge.jsx](frontend/src/components/common/Badge.jsx) | Radius8px,font12px/600,padding4.8px9.6px; sáu variant | Không dùng riêng màu làm thông tin; label status có text | Chip/Container + Semantics, không dùng ChoiceChip nếu không chọn |
| [Card.jsx](frontend/src/components/common/Card.jsx) | sc-ui-card/panel radius20,border,shadow,padding24/16 | hover opt-in; card chứa action riêng | Card hoặc DecoratedBox, elevation/shadow cần so ảnh |
| [ProductCard.jsx](frontend/src/components/catalog/ProductCard.jsx) | Article,image button crop1/1 cho catalog,heading16px,giá20px và CTA | Ảnh hover scale1.05/500ms; title/image/CTA mở detail; home dome variant | AspectRatio + ClipRRect, InkWell/focus semantics; không port nguyên CSS |
| [CatalogImage.jsx](frontend/src/components/catalog/CatalogImage.jsx) | Ảnh product hoặc fallback có alt; object-cover | Remote error fallback; không để broken image thành bằng chứng có hàng | Image loading/errorBuilder và BoxFit.cover |
| [SearchBar.jsx](frontend/src/components/common/SearchBar.jsx) | Icon, input, submit/dropdown theo header; UI font14 | Focus, query, enter/click; chưa suy ra tìm kiếm server debounce nếu source không có | SearchBar/TextField theo actual contract |
| [ApiState.jsx](frontend/src/components/management/ApiState.jsx) | Loading/error/empty từ API; Workspace/Catalog có component trạng thái riêng | Error copy, retry/refresh; không tự dùng mock khi network lỗi | Async state + text semantics/retry |
| [LoadingSpinner.jsx](frontend/src/components/common/LoadingSpinner.jsx) | 16/24/40px vòng border, text Đang tải; animate-spin | Không tìm thấy skeleton chung là chuẩn; không sáng tạo skeleton hiện có | ProgressIndicator + live region phù hợp |
| [EmptyState.jsx](frontend/src/components/common/EmptyState.jsx) | Icon,title,description,optional action; EmptyPanel role=status | Empty khác failed/network; dữ liệu0 không đồng nghĩa0doanhthu thật | Empty panel có action và semantics |
| [ModalSurface.jsx](frontend/src/components/common/ModalSurface.jsx) | Native dialog,aria-modal,label,labelledBy,register top modal | ShowModal focus containment/restoration; Esc/backdrop; dirty confirm; busy chặn close | showDialog/showModalBottomSheet + PopScope/FocusScope, giữ guard thay đổi |
| [ConfirmAction.jsx](frontend/src/components/common/ConfirmAction.jsx) | Xác nhận action có nội dung rõ và state busy | Không thực hiện mutation trước confirm; action disabled theo điều kiện | Dialog confirm + pending state/idempotency |
| [EntityActionButtons.jsx](frontend/src/components/common/EntityActionButtons.jsx) | Action row,secondary/warning/danger,acknowledgement | Trạng thái entity, busy, confirm; wrap trên mobile | Wrap actions + status transitions đã kiểm chứng |
| [RefreshButton.jsx](frontend/src/components/common/RefreshButton.jsx) | Icon+label,gap6.4px; desktopmin36px/mobile40px | Loading/busyfeedback,không làm textoverflow | RefreshIndicator/IconButton accessible target |
| [PortalAccountMenu.jsx](frontend/src/components/common/PortalAccountMenu.jsx) | Avatar,role,label và dropdown tài khoản | Open/close/navigation/signout; profile info bị cleanPresentationLabel | MenuAnchor/PopupMenuButton phù hợp platform |
| [AddressPicker.jsx](frontend/src/components/orders/AddressPicker.jsx) | Select địa chỉ + trạng thái capability thiếu | PublicaddressAPIchưacó; không dựng formgiảvàbáođãlưu | Form/selector khi contract address tồn tại |
| [OrderStatusActions.jsx](frontend/src/components/orders/OrderStatusActions.jsx) | Action dựa trên status,review,confirmation | Khách xác nhận hoàn tất,ownerchuyểnsảnxuất/giao; version/idempotency | Native actions theo đúng FSM, không suy diễn payment |
| [MarketplaceViews.jsx](frontend/src/components/marketplace/MarketplaceViews.jsx) | Requestcard/offer,list/filter/form/detail | DRAFT/OPEN,validation,error/loading/empty; accept hiện bị chặn khi thiếuaddress | Feature UI sau khi API ổn định |
| [SubscriptionView.jsx](frontend/src/components/subscription/SubscriptionView.jsx) | Plan/order/reference/proof/review và lịch sử thật | Pending/approved/rejected,idempotency; khác public demo modal | Form upload/reference và native image picker khi được phát triển |
| [BrandLogo.jsx](frontend/src/components/common/BrandLogo.jsx) | Artworkbrand src/assets/brand-logo.png,objectcontain;size32..80px | Hover1.03/300ms; một wrapper div clickable thiếu keyboardbuttonsemantics | Asset Image với semantic label, button native nếu click |

Tables: wrapper role region,aria-label,tabIndex0,caption sr-only; th12px/700,td14px,line1.6; sharedpadding16px,adminrow72px. Admin actioncolumn192px centered/wrap, currencyright/tabular. Toolbar filter labels, inputs/selects, pagination và refresh đồng bộ. Tabs dùng button/aria-pressed, chưa tự coi là WAI-ARIA tablist đầy đủ.

Form: min-height44px,radius12,border#e2e8f0,inputpadding10px14px,text14; placeholder muted opacity.8; checkbox/radio/range accent wine. Error thường inline role=alert hoặc ApiState, success role=status ở một số flow; không phát hiện toast manager chung đang mounted. Một số handler còn dùng window.alert, cần ghi rõ khi port native.

Public PartnerCheckoutModal là ngoại lệ quan trọng: overlay div nhiều bước, local demo payment; không có cùng native-dialog focus/dirty contract, và có thể hiện thành công khi mock runtime tắt. Không dùng làm mẫu thanh toán mobile. Chi tiết hành vi ở [audit](docs/audit/BAKERY_PLATFORM_CURRENT_SYSTEM_AUDIT_VI.md) và [bằng chứng](docs/audit/evidence/public-partner-modal.json).

## 8. Motion, transition và scroll

| Pattern | Trigger | Giá trị/timing | Giới hạn/reduced motion | Flutter concept tương lai |
|---|---|---|---|---|
| Shared control | hover/active/focus | 160ms ease background/border/shadow/transform; pressY1px | prefers-reduced-motion bỏ transition | WidgetStateProperty + AnimatedContainer hoặc không animation |
| ScrollReveal | IntersectionObserver lần đầu | 800ms,cubic-bezier(.16,1,.3,1),delayprop; threshold.12,rootmarginbottom−40px | fade/±48px/scale.92→1; unobserve; chưa có JSmatchMedia guard | Tween/CurvedAnimation kết hợp visibility và disableAnimations |
| Home snap | wheel≥18px,Arrow/PageUp/Down | smooth scroll native browser,lock750ms,headeroffset95px; minsection100vh−88px | Không thấy guard JSreduced-motion/touch; không thể báo duration750ms là durationbrowser | Native scroll thường; snap chỉ khi product yêu cầu và a11y cho phép |
| Product image | group hover | scale1.05 trong500ms | Hover không tồn tại trên touch; không biến thành autoloop | Optional hover/tapfeedback; ảnh giữlayout |
| Dome card | hover | translateY−5px,.2s shadow/transform | Home exception | Optional hover nhẹ khi pointer |
| Brand logo | hover | scale1.03,300ms | Logoartwork | Tùy interaction, không autoloop |
| Spinner | pending | Tailwind animate-spin | Portal/customer/drawer scope reducedmotion tắt animation; phải giữ text báo đangtải | ProgressIndicator, semantics, tránh spinner vô nghĩa |
| Drawer/modal | open/close | Native showModal/close,không có duration chung được khai báo | Không tự thêm slide300ms vào tài liệu “hiện có” | Native transition có chủ đích ở bước UI |

`index.css` có reduced-motion rule mạnh cho `.sc-portal *`, `.sc-customer *`, `.sc-drawer *` (transition/animation:none!important,scrollauto); design-system thêm button rule. Quy tắc này không bao trùm mọi `.home-page-wrapper` hay JS smooth scroll. Vì vậy bảo vệ motion hiện tại chỉ một phần, không kết luận toàn ứng dụng tuân thủ. Audit browser chạy reducedMotion=reduce cho mẫu công khai; motion spec khác lấy source, không phải đo frame-by-frame.

## 9. Assets, logo, icon và hình ảnh

Material Symbols Outlined dùng webfont variable từ Google Fonts; Icon wrapper aria-hidden. Các axis FILL/wght/GRAD/opsz tồn tại; không mặc định glyph của Flutter Icons cũ giống tuyệt đối. [Tài liệu Google](https://developers.google.com/fonts/docs/material_symbols) ghi Apache2.0. Khi mobile cần icon dùng mapping tên/semantic và kiểm tra license/fontsubset/SVG, chưa thêm package trong scaffold.

Logo raster dùng contain, ảnh sản phẩm/bakery dùng cover; catalog1/1, một số detail/hero khác có ratio riêng. Không kéo dãn logo; crop ảnh nội dung phải có fallback/alt. API trả signed URL có hạn: chỉ lưu object metadata theo contract, không hardcode URL đã ký vào design/mobile. Ảnh fixture32×32 trong screenshot Docker chỉ chứng minh storage/network, không là asset thiết kế.

| Asset cục bộ | Kích thước px / dung lượng | Vai trò | Quyền/provenance |
|---|---|---|---|
| [brand-logo-brown.png](frontend/public/brand-logo-brown.png) | 876×252; 133,656 B | Logo/favicon/mascot | Có sẵn trong repository; chưa xác minh license riêng của artwork |
| [brand-logo-original.png](frontend/public/brand-logo-original.png) | 1024×397; 322,302 B | Logo/favicon/mascot | Có sẵn trong repository; chưa xác minh license riêng của artwork |
| [brand-logo-transparent.png](frontend/public/brand-logo-transparent.png) | 876×252; 122,643 B | Logo/favicon/mascot | Có sẵn trong repository; chưa xác minh license riêng của artwork |
| [brand-logo.png](frontend/public/brand-logo.png) | 876×252; 122,643 B | Logo/favicon/mascot | Có sẵn trong repository; chưa xác minh license riêng của artwork |
| [cat-logo-transparent.png](frontend/public/cat-logo-transparent.png) | 217×271; 35,521 B | Logo/favicon/mascot | Có sẵn trong repository; chưa xác minh license riêng của artwork |
| [cat-logo.png](frontend/public/cat-logo.png) | 217×271; 50,961 B | Logo/favicon/mascot | Có sẵn trong repository; chưa xác minh license riêng của artwork |
| [favicon-sweetcake.png](frontend/public/favicon-sweetcake.png) | 217×62; 15,647 B | Logo/favicon/mascot | Có sẵn trong repository; chưa xác minh license riêng của artwork |
| [favicon.png](frontend/public/favicon.png) | 64×64; 7,107 B | Logo/favicon/mascot | Có sẵn trong repository; chưa xác minh license riêng của artwork |
| [favicon.svg](frontend/public/favicon.svg) | SVG/vector; 9,522 B | Logo/favicon/mascot | Có sẵn trong repository; chưa xác minh license riêng của artwork |
| [icons.svg](frontend/public/icons.svg) | SVG/vector; 5,055 B | Hero/sprite/icon asset | Có sẵn trong repository; chưa xác minh license riêng của artwork |
| [fairy-bg.jpg](frontend/public/images/fairy-bg.jpg) | 1376×768; 979,860 B | Nền fairy/night | Có sẵn trong repository; chưa xác minh license riêng của artwork |
| [fairy-night-bg.jpg](frontend/public/images/fairy-night-bg.jpg) | 1024×576; 489,245 B | Nền fairy/night | Có sẵn trong repository; chưa xác minh license riêng của artwork |
| [night-sky-bg.jpg](frontend/public/images/night-sky-bg.jpg) | 1024×1024; 1,187,970 B | Nền fairy/night | Có sẵn trong repository; chưa xác minh license riêng của artwork |
| [brand-logo.png](frontend/src/assets/brand-logo.png) | 876×252; 122,643 B | Logo/favicon/mascot | Có sẵn trong repository; chưa xác minh license riêng của artwork |
| [hero.png](frontend/src/assets/hero.png) | 343×361; 13,057 B | Hero/sprite/icon asset | Có sẵn trong repository; chưa xác minh license riêng của artwork |

Một số ảnh minh họa/marketing tải URL ngoài (ví dụ Unsplash và ảnh đồ uống trong header); đây không phải sản phẩm Backend. Cần kiểm tra attribution/license cụ thể trước phát hành hoặc chép lại. Không sao chép tập asset vào mobile ở đợt này. Font/icon license đã có nguồn upstream; quyền artwork thương hiệu không suy ra từ license code/skill.

## 10. Trang, layout và navigation inventory

Route là navigation điều kiện theo path/query trong App/AppRoutes, không phải mỗi file JSX là một URL. `vendor-settings` là alias của vendor-profile, không tính route thứ36. Các protected route redirect về login khi chưa auth; backend vẫn là nơi thực thi quyền.

| Route | Layout/điểm nhìn | Vai trò | Nguồn | Hành vi/state đáng giữ |
|---|---|---|---|---|
| `/` | Hero mascot; các section full viewport | Public | [HomePage.jsx](frontend/src/pages/customer/home/HomePage.jsx) | Catalog, bakery; hero và hướng dẫn tĩnh |
| `/explore` | Toolbar và grid catalog | Public | [ExploreCakesPage.jsx](frontend/src/pages/customer/catalog/ExploreCakesPage.jsx) | Lọc/tìm/page sản phẩm thật; không tự fallback mock |
| `/product-detail` | Ảnh và cấu hình hai cột | Public | [ProductDetailPage.jsx](frontend/src/pages/customer/catalog/ProductDetailPage.jsx) | id từ query/selection; options/add-on, thêm giỏ in-memory |
| `/stores` | Grid card tiệm, filter | Public | [StoreDirectoryPage.jsx](frontend/src/pages/customer/stores/StoreDirectoryPage.jsx) | Lọc tiệm thật; nội dung escrow/giao lạnh hardcode không có invariant tương ứng |
| `/bakery-detail` | Cover, thông tin, grid menu | Public | [BakeryDetailPage.jsx](frontend/src/pages/customer/stores/BakeryDetailPage.jsx) | id bắt buộc; hồ sơ public, giờ mở cửa và menu có pagination |
| `/subscription-plans` | Hero, plan cards, modal nhiều bước | Public | [SubscriptionPlansPage.jsx](frontend/src/pages/customer/subscription/SubscriptionPlansPage.jsx) | GET plan thật; CTA mở payment mô phỏng ngay cả khi demo tắt |
| `/login` | Card max-width, hai tab, hai form | Public | [AuthPage.jsx](frontend/src/pages/auth/AuthPage.jsx) | Email/password; đăng ký rồi đăng nhập; quên mật khẩu chỉ alert |
| `/cart` | Giỏ 7/5 cột và summary sticky | Public/CUSTOMER | [CartCheckoutPage.jsx](frontend/src/pages/customer/checkout/CartCheckoutPage.jsx) | Giỏ in-memory; revalidate catalog; xác nhận đơn thật bị disabled vì address API chưa có |
| `/profile` | Profile header, nav và nội dung | User | [CustomerProfilePage.jsx](frontend/src/pages/customer/profile/CustomerProfilePage.jsx) | Me và order history thật; sửa hồ sơ, mật khẩu, địa chỉ chưa có API public |
| `/tracking` | Danh sách/detail và trạng thái | User | [OrderTrackingPage.jsx](frontend/src/pages/customer/tracking/OrderTrackingPage.jsx) | orderId hoặc danh sách mine; snapshot, timeline, review |
| `/payment` | Panel giải thích và navigation | CUSTOMER | [PaymentGatewayPage.jsx](frontend/src/pages/customer/checkout/PaymentGatewayPage.jsx) | Trang thông tin thỏa thuận trực tiếp với tiệm; không thu tiền |
| `/ai-studio` | Canvas, editor, kết quả và hội thoại | CUSTOMER | [AiCakeStudioPage.jsx](frontend/src/pages/customer/ai-studio/AiCakeStudioPage.jsx) | Builder Three.js local, RFQ và AI job; provider service hiện không build được |
| `/rfqs` | Filter, request cards, pagination | CUSTOMER | [MarketplaceViews.jsx](frontend/src/components/marketplace/MarketplaceViews.jsx) | Lọc danh sách RFQ theo scope mine |
| `/rfq-new` | Form nhiều section | CUSTOMER | [MarketplaceViews.jsx](frontend/src/components/marketplace/MarketplaceViews.jsx) | Form request type, địa điểm, thời gian, ngân sách, preference/options |
| `/request-detail` | Thông tin, lịch sử, ảnh, offer | CUSTOMER | [MarketplaceViews.jsx](frontend/src/components/marketplace/MarketplaceViews.jsx) | id; sửa DRAFT, publish/cancel, ảnh, chọn design, xem offer |
| `/bidding` | Request và offer cards | CUSTOMER | [BiddingComparisonPage.jsx](frontend/src/pages/customer/bidding/BiddingComparisonPage.jsx) | Request/offer thật; accept qua VerifiedCheckout bị chặn khi demo tắt |
| `/baker-quote` | Quote summary và actions | CUSTOMER | [BakerQuoteDetailPage.jsx](frontend/src/pages/customer/bidding/BakerQuoteDetailPage.jsx) | id; snapshot báo giá thật; accept bị chặn thiếu địa chỉ public |
| `/chat` | Master/detail conversation | User | [ChatPage.jsx](frontend/src/pages/chat/ChatPage.jsx) | Danh sách, detail, cursor/polling, send/read/delete; first-page SQL đang lỗi |
| `/vendor-dashboard` | Sidebar, metrics và bảng | BAKERY_OWNER | [VendorDashboardPage.jsx](frontend/src/pages/vendor/dashboard/VendorDashboardPage.jsx) | Xác minh OWNER từng tiệm; bộ chọn chỉ dò catalog public trang đầu tối đa 100 |
| `/vendor-menu` | Tabs, table, drawer editor | BAKERY_OWNER | [VendorMenuCatalogPage.jsx](frontend/src/pages/vendor/catalog/VendorMenuCatalogPage.jsx) | CRUD product/category/add-on, options/media, publish/hide/archive; OWNER chỉ xem |
| `/vendor-orders` | Toolbar, list/table, drawer | BAKERY_OWNER | [VendorOrderManagementPage.jsx](frontend/src/pages/vendor/orders/VendorOrderManagementPage.jsx) | Lọc/order detail và state transitions theo membership |
| `/vendor-rfq` | Filter và request/offer cards | BAKERY_OWNER | [VendorRfqMarketplacePage.jsx](frontend/src/pages/vendor/rfq/VendorRfqMarketplacePage.jsx) | Đọc available theo union memberships rồi lọc tiệm trước pagination; bị lỗi scope Bakery |
| `/vendor-quote-submit` | Request, quote editor, confirm drawer | BAKERY_OWNER | [VendorBespokeQuoteSubmitPage.jsx](frontend/src/pages/vendor/rfq/VendorBespokeQuoteSubmitPage.jsx) | cakeRequestId hoặc offerId; form submit/edit/withdraw; create bị lỗi scope Bakery |
| `/vendor-profile` | Selector, profile panels, drawer | BAKERY_OWNER | [VendorSettingsPage.jsx](frontend/src/pages/vendor/settings/VendorSettingsPage.jsx) | Tạo tiệm và thay vận hành/ảnh; đọc lại DRAFT qua public API có thể 404 |
| `/vendor-revenue` | EmptyPanel | BAKERY_OWNER | [VendorRevenueEscrowPage.jsx](frontend/src/pages/vendor/revenue/VendorRevenueEscrowPage.jsx) | Placeholder rõ ràng; backend không theo dõi payment bánh/đối soát |
| `/vendor-chat` | Inbox hai pane, chuyển pane trên mobile | BAKERY_OWNER | [ChatPage.jsx](frontend/src/pages/chat/ChatPage.jsx) | Bakery-scoped conversation và thread; first-page SQL đang lỗi |
| `/vendor-subscription` | Selector, plan cards, order drawer | BAKERY_OWNER/CUSTOMER | [VendorSubscriptionPage.jsx](frontend/src/pages/vendor/subscription/VendorSubscriptionPage.jsx) | OWNER ACTIVE; create order, submit proof/reference, lịch sử/period thật |
| `/admin-dashboard` | Metrics, distributions, activity tables | ADMIN | [AdminDashboardPage.jsx](frontend/src/pages/admin/dashboard/AdminDashboardPage.jsx) | Tổng hợp nhiều trang bakery/payment/order; users không có backend; phần thiếu hiển thị dấu gạch |
| `/admin-users` | Filter/table và editor/confirm | ADMIN | [AdminUsersPage.jsx](frontend/src/pages/admin/users/AdminUsersPage.jsx) | GET /admin/users không có; mutation chỉ cho local demo và bị chặn khi demo tắt |
| `/admin-vendors` | Table và review drawer | ADMIN | [AdminVendorsPage.jsx](frontend/src/pages/admin/vendors/AdminVendorsPage.jsx) | Danh sách/detail/checklist và transitions theo trạng thái |
| `/admin-payments` | Table và review drawer | ADMIN | [AdminPaymentsPage.jsx](frontend/src/pages/admin/vendors/AdminPaymentsPage.jsx) | Lọc, order/proof detail, approve/reject có confirmation và idempotency |
| `/admin-plans` | Card/table, form drawer | ADMIN | [AdminPlansPage.jsx](frontend/src/pages/admin/vendors/AdminPlansPage.jsx) | Tạo/sửa/trạng thái/archive plan, features key/value; backend bảo vệ snapshot cũ |
| `/admin-orders` | OrderList và drawer | ADMIN | [AdminOrdersEscrowPage.jsx](frontend/src/pages/admin/orders/AdminOrdersEscrowPage.jsx) | scope all; read/detail và transitions; tên file Escrow không chứng minh có escrow |
| `/admin-moderation` | Lookup form và review dialog | ADMIN | [AdminModerationPage.jsx](frontend/src/pages/admin/vendors/AdminModerationPage.jsx) | Tra order/design theo UUID; review moderation thật, AI bị chặn compile |
| `/admin-revenue` | Metrics, chart, table, detail | ADMIN | [AdminRevenuePage.jsx](frontend/src/pages/admin/revenue/AdminRevenuePage.jsx) | Tổng hợp payment APPROVED theo thời gian/plan; không phải doanh thu bánh |

Ma trận tích hợp và phần chưa có API nằm ở [FRONTEND_SCREEN_MATRIX_VI.md](docs/audit/FRONTEND_SCREEN_MATRIX_VI.md). Không lấy placeholder admin-users, vendor-revenue, checkout-disabled, lỗi chat hay bản demo subscription làm business behavior chuẩn cho mobile. Payment bánh thỏa thuận với tiệm; nền tảng chỉ theo dõi payment gói của bakery.

## 11. Accessibility và tính nhất quán

Đã thấy: focus-visible2px/pink offset3; label input ở form chính; native dialog/aria-modal/title; portal skiplink; caption/region cho table; status text cùng màu; rolealert/status một số state; image alt; responsivewrap và textoverflowUUID. Đây là bằng chứng từng pattern, chưa là chứng nhận WCAG cho toàn Web.

Điểm cần review khi được giao sửa: outline-gray#94a3b8 trên trắng thiếu contrast text nhỏ; secondary trắng/hồng cần kiểm ratio đúng size; một số target36/40px; clickable logo div không có keyboard semantics tương đương button; public payment overlay thiếu nativefocusguard; tabs chỉaria-pressed; Home smoothsnap/scrollreveal chưa phủ reduced-motion. Chưa có screen-reader walkthrough, keyboard-only tất cả route, focusorder mọi dialog, zoom200%/textscale hoặc axe fullscan. Không thay UI trong đợt trích xuất.

## 12. Web Design System → Flutter Design System Mapping

Đây là FUTURE_MAPPING, không phải mã đã tạo. Giữ màu, nhịp chữ, mascot và recipe cần thiết; dùng layout/gesture/focus native thay vì mô phỏng DOM.

| Web concept | Existing value/pattern | Future Flutter equivalent | Notes |
|---|---|---|---|
| Primary/secondary/surface | wine#6b212e,pink#c05477,white/slate | ColorScheme và ThemeExtension semantic | Không dùng fromSeed rồi chấp nhận màu suy ra khác Web |
| Typography | PlusJakartaSans,body14,h1clamp24–32,h220,h316 | TextTheme / LayoutBuilder | BundleOFLfont, kiểm dấuVN vàtextScale; dùng label semantic thay h1DOM |
| Spacing | gutter16–32,gap16/24,pad16/24 | Padding/SizedBox/design token class | Logicalpx tương ứng cần so screenshot, không áp px vật lý |
| Shape | control12/card20/badge8 | RoundedRectangleBorder/BorderRadius | Dome165/165/18/18 chỉ homevariant |
| Shadow | cardrgba.05,hover.08 | BoxShadow | Không mặc định Materialelevation render giống CSS |
| Icon | MaterialSymbolsOutlined | Chọn font/SVG/package phù hợp | LicenseApache2; kiểm glyph vàaxes |
| Assets | LogoPNGcontain,ảnhcover,mây/hoa văn | AssetImage/Image/CustomPainter khi cần | Không thực hiện vẽ lại/copyasset lúc scaffold |
| Button/input | 44pxstandard,statesfocusdisabled | ButtonStyle/InputDecorationTheme | Native target/accessibility, giữstatechứkhôngcopyDOMclass |
| Responsive | breakpoint640/768/1024/1280 +nav1440 | LayoutBuilder,MediaQuery,SafeArea | Chọn bố cục phone/tablet theo chức năng, không cố sidebar288px trênphone |
| Navigation | header/sidebar/path/query | Router tập trung khi códeep-link requirement | Chưa chọn go_router haystatearchitecture |
| Drawer/modal | focus/dirty/busy/native dialog | showModalBottomSheet/showDialog/PopScope | Giữ discard guard vàpendingmutation |
| Loading/error/empty | ApiState/retry/rolealert | Typedasyncstate + Semantics | Không tự fallbackmock, không báo paymentgiả thànhcông |
| Motion |160ms,800msreveal,home750mslock | Animated*/AnimationController/Curves | HonorMediaQuery.disableAnimations vànativebackgesture |
| Tables | horizontalregion/72pxrows | HorizontalScrollView/DataTable hoặcadaptiveview | Chỉ chọn khi cóUI thật, currency/ownership không bịmất |
| Localization | tiếngViệt/currency/statuslabels | ARB/gen-l10n sau này | Không hardcode Englishdummy hoặc rawenum trongUI |

## 13. Ảnh chụp tham chiếu và giới hạn

Các ảnh là trạng thái thật lúc audit, có dữ liệu local và lỗi/empty state được giữ để không giả hình hoàn thiện. Home/default public mẫu ban đầu catalog có thể trống; ảnh sản phẩm Docker bổ sung hiển thị thật.

### Trang chủ desktop, mascot và quầy bánh

![Trang chủ desktop, mascot và quầy bánh](docs/audit/screenshots/home-anonymous-1440.png)

### Trang chủ phone

![Trang chủ phone](docs/audit/screenshots/home-anonymous-390.png)

### Catalog desktop/filter

![Catalog desktop/filter](docs/audit/screenshots/explore-anonymous-1440.png)

### Catalog phone/empty

![Catalog phone/empty](docs/audit/screenshots/explore-anonymous-390.png)

### Auth desktop

![Auth desktop](docs/audit/screenshots/login-anonymous-1440.png)

### Auth phone

![Auth phone](docs/audit/screenshots/login-anonymous-390.png)

### Profile phone sau đăng nhập thật

![Profile phone sau đăng nhập thật](docs/audit/screenshots/profile-customer-390.png)

### Vendor workspace

![Vendor workspace](docs/audit/screenshots/vendor-dashboard-owner-1440.png)

### Admin workspace

![Admin workspace](docs/audit/screenshots/admin-dashboard-admin-1440.png)

### Admin trên phone

![Admin trên phone](docs/audit/screenshots/admin-plans-admin-390.png)

### Product và ảnh MinIO thật trên stack Docker

![Product và ảnh MinIO thật trên stack Docker](docs/audit/screenshots/product-docker-1440.png)

## 14. Phụ lục token khai báo đầy đủ

Mỗi dòng là declaration tại scope gốc; có trùng tên do override. Đây không phải một map flatten cuối cùng cho mọi route. Màu literal còn xuất hiện trong Tailwind arbitrary/inline JSX và recipe CSS; source component là nguồn các ngoại lệ.

| Token | Giá trị source | File / dòng |
|---|---|---|
| `--vendor` | `has(.sc-owner-chat-page) .sc-portal-main { padding-bottom: 1rem` | [frontend/src/components/chat/owner-chat.css:2](frontend/src/components/chat/owner-chat.css#L2) |
| `--sc-portal-header-height` | `5.25rem` | [frontend/src/components/common/portal-header.css:1](frontend/src/components/common/portal-header.css#L1) |
| `--sc-portal-content-top` | `calc(var(--sc-portal-header-height) + .9rem)` | [frontend/src/components/common/portal-header.css:1](frontend/src/components/common/portal-header.css#L1) |
| `--sc-portal-header-height` | `6rem` | [frontend/src/components/common/portal-header.css:13](frontend/src/components/common/portal-header.css#L13) |
| `--sc-portal-content-top` | `calc(var(--sc-portal-header-height) + .65rem)` | [frontend/src/components/common/portal-header.css:13](frontend/src/components/common/portal-header.css#L13) |
| `--sc-admin-gap` | `1rem` | [frontend/src/components/management/admin-layout.css:2](frontend/src/components/management/admin-layout.css#L2) |
| `--sc-admin-padding` | `clamp(.75rem, 1.5vw, 1.25rem)` | [frontend/src/components/management/admin-layout.css:2](frontend/src/components/management/admin-layout.css#L2) |
| `--sc-page-gutter` | `.75rem` | [frontend/src/components/management/admin-layout.css:36](frontend/src/components/management/admin-layout.css#L36) |
| `--text-admin-title` | `20px` | [frontend/src/index.css:5](frontend/src/index.css#L5) |
| `--text-admin-title--line-height` | `28px` | [frontend/src/index.css:6](frontend/src/index.css#L6) |
| `--text-admin-heading` | `16px` | [frontend/src/index.css:7](frontend/src/index.css#L7) |
| `--text-admin-heading--line-height` | `24px` | [frontend/src/index.css:8](frontend/src/index.css#L8) |
| `--text-admin-body` | `14px` | [frontend/src/index.css:9](frontend/src/index.css#L9) |
| `--text-admin-body--line-height` | `20px` | [frontend/src/index.css:10](frontend/src/index.css#L10) |
| `--text-admin-metric` | `24px` | [frontend/src/index.css:11](frontend/src/index.css#L11) |
| `--text-admin-metric--line-height` | `32px` | [frontend/src/index.css:12](frontend/src/index.css#L12) |
| `--color-wine` | `#6b212e` | [frontend/src/index.css:13](frontend/src/index.css#L13) |
| `--color-wine-dark` | `#4f1722` | [frontend/src/index.css:14](frontend/src/index.css#L14) |
| `--color-brand-pink` | `#d46387` | [frontend/src/index.css:15](frontend/src/index.css#L15) |
| `--color-primary` | `#6b212e` | [frontend/src/index.css:18](frontend/src/index.css#L18) |
| `--color-on-primary` | `#ffffff` | [frontend/src/index.css:20](frontend/src/index.css#L20) |
| `--color-primary-container` | `#4f1722` | [frontend/src/index.css:21](frontend/src/index.css#L21) |
| `--color-on-primary-container` | `#f5dcd7` | [frontend/src/index.css:23](frontend/src/index.css#L23) |
| `--color-primary-fixed` | `#f5dcd7` | [frontend/src/index.css:24](frontend/src/index.css#L24) |
| `--color-primary-fixed-dim` | `#f0eae5` | [frontend/src/index.css:25](frontend/src/index.css#L25) |
| `--color-on-primary-fixed` | `#331017` | [frontend/src/index.css:26](frontend/src/index.css#L26) |
| `--color-on-primary-fixed-variant` | `#521c25` | [frontend/src/index.css:27](frontend/src/index.css#L27) |
| `--color-secondary` | `#c05477` | [frontend/src/index.css:29](frontend/src/index.css#L29) |
| `--color-on-secondary` | `#ffffff` | [frontend/src/index.css:31](frontend/src/index.css#L31) |
| `--color-secondary-container` | `#fce7eb` | [frontend/src/index.css:32](frontend/src/index.css#L32) |
| `--color-on-secondary-container` | `#78350f` | [frontend/src/index.css:34](frontend/src/index.css#L34) |
| `--color-secondary-fixed` | `#fce7eb` | [frontend/src/index.css:35](frontend/src/index.css#L35) |
| `--color-secondary-fixed-dim` | `#fbcfe8` | [frontend/src/index.css:36](frontend/src/index.css#L36) |
| `--color-on-secondary-fixed` | `#451a03` | [frontend/src/index.css:37](frontend/src/index.css#L37) |
| `--color-on-secondary-fixed-variant` | `#78350f` | [frontend/src/index.css:38](frontend/src/index.css#L38) |
| `--color-tertiary` | `#64748b` | [frontend/src/index.css:40](frontend/src/index.css#L40) |
| `--color-on-tertiary` | `#ffffff` | [frontend/src/index.css:42](frontend/src/index.css#L42) |
| `--color-tertiary-container` | `#f1f5f9` | [frontend/src/index.css:43](frontend/src/index.css#L43) |
| `--color-on-tertiary-container` | `#0f172a` | [frontend/src/index.css:44](frontend/src/index.css#L44) |
| `--color-tertiary-fixed` | `#f1f5f9` | [frontend/src/index.css:45](frontend/src/index.css#L45) |
| `--color-tertiary-fixed-dim` | `#e2e8f0` | [frontend/src/index.css:46](frontend/src/index.css#L46) |
| `--color-on-tertiary-fixed` | `#0f172a` | [frontend/src/index.css:47](frontend/src/index.css#L47) |
| `--color-on-tertiary-fixed-variant` | `#334155` | [frontend/src/index.css:48](frontend/src/index.css#L48) |
| `--color-background` | `#f8fafc` | [frontend/src/index.css:50](frontend/src/index.css#L50) |
| `--color-on-background` | `#0f172a` | [frontend/src/index.css:52](frontend/src/index.css#L52) |
| `--color-surface` | `#ffffff` | [frontend/src/index.css:55](frontend/src/index.css#L55) |
| `--color-on-surface` | `#0f172a` | [frontend/src/index.css:57](frontend/src/index.css#L57) |
| `--color-surface-dim` | `#f1f5f9` | [frontend/src/index.css:59](frontend/src/index.css#L59) |
| `--color-surface-bright` | `#ffffff` | [frontend/src/index.css:60](frontend/src/index.css#L60) |
| `--color-surface-container-lowest` | `#ffffff` | [frontend/src/index.css:61](frontend/src/index.css#L61) |
| `--color-surface-container-low` | `#f8fafc` | [frontend/src/index.css:62](frontend/src/index.css#L62) |
| `--color-surface-container` | `#f1f5f9` | [frontend/src/index.css:64](frontend/src/index.css#L64) |
| `--color-surface-container-high` | `#e2e8f0` | [frontend/src/index.css:66](frontend/src/index.css#L66) |
| `--color-surface-container-highest` | `#cbd5e1` | [frontend/src/index.css:67](frontend/src/index.css#L67) |
| `--color-surface-variant` | `#f1f5f9` | [frontend/src/index.css:68](frontend/src/index.css#L68) |
| `--color-on-surface-variant` | `#64748b` | [frontend/src/index.css:69](frontend/src/index.css#L69) |
| `--color-inverse-surface` | `#0f172a` | [frontend/src/index.css:71](frontend/src/index.css#L71) |
| `--color-inverse-on-surface` | `#ffffff` | [frontend/src/index.css:72](frontend/src/index.css#L72) |
| `--color-inverse-primary` | `#f5dcd7` | [frontend/src/index.css:73](frontend/src/index.css#L73) |
| `--color-outline` | `#94a3b8` | [frontend/src/index.css:75](frontend/src/index.css#L75) |
| `--color-outline-variant` | `#e2e8f0` | [frontend/src/index.css:77](frontend/src/index.css#L77) |
| `--color-surface-tint` | `#6b212e` | [frontend/src/index.css:79](frontend/src/index.css#L79) |
| `--color-error` | `#b91c1c` | [frontend/src/index.css:81](frontend/src/index.css#L81) |
| `--color-on-error` | `#ffffff` | [frontend/src/index.css:82](frontend/src/index.css#L82) |
| `--color-error-container` | `#fee2e2` | [frontend/src/index.css:83](frontend/src/index.css#L83) |
| `--color-on-error-container` | `#7f1d1d` | [frontend/src/index.css:84](frontend/src/index.css#L84) |
| `--spacing-space-xs` | `0.25rem` | [frontend/src/index.css:86](frontend/src/index.css#L86) |
| `--spacing-space-sm` | `0.5rem` | [frontend/src/index.css:87](frontend/src/index.css#L87) |
| `--spacing-space-md` | `1rem` | [frontend/src/index.css:88](frontend/src/index.css#L88) |
| `--spacing-space-lg` | `1.5rem` | [frontend/src/index.css:89](frontend/src/index.css#L89) |
| `--spacing-space-xl` | `2.5rem` | [frontend/src/index.css:90](frontend/src/index.css#L90) |
| `--spacing-margin` | `3rem` | [frontend/src/index.css:91](frontend/src/index.css#L91) |
| `--spacing-margin-mobile` | `1.25rem` | [frontend/src/index.css:92](frontend/src/index.css#L92) |
| `--spacing-gutter` | `1.5rem` | [frontend/src/index.css:93](frontend/src/index.css#L93) |
| `--spacing-gutter-mobile` | `1rem` | [frontend/src/index.css:94](frontend/src/index.css#L94) |
| `--font-display` | `var(--sc-font-ui)` | [frontend/src/index.css:96](frontend/src/index.css#L96) |
| `--font-headline` | `var(--sc-font-ui)` | [frontend/src/index.css:97](frontend/src/index.css#L97) |
| `--font-fraunces` | `var(--sc-font-ui)` | [frontend/src/index.css:98](frontend/src/index.css#L98) |
| `--font-serif` | `var(--sc-font-ui)` | [frontend/src/index.css:99](frontend/src/index.css#L99) |
| `--font-body` | `var(--sc-font-ui)` | [frontend/src/index.css:100](frontend/src/index.css#L100) |
| `--font-label` | `var(--sc-font-ui)` | [frontend/src/index.css:101](frontend/src/index.css#L101) |
| `--font-cormorant` | `var(--sc-font-ui)` | [frontend/src/index.css:102](frontend/src/index.css#L102) |
| `--font-sans` | `var(--sc-font-ui)` | [frontend/src/index.css:103](frontend/src/index.css#L103) |
| `--wine` | `#6b212e` | [frontend/src/index.css:289](frontend/src/index.css#L289) |
| `--wine-dark` | `#4f1722` | [frontend/src/index.css:290](frontend/src/index.css#L290) |
| `--pink` | `#ffdce5` | [frontend/src/index.css:291](frontend/src/index.css#L291) |
| `--pink-light` | `#fff0f5` | [frontend/src/index.css:292](frontend/src/index.css#L292) |
| `--cream` | `#fff8fa` | [frontend/src/index.css:293](frontend/src/index.css#L293) |
| `--paper` | `#ffffff` | [frontend/src/index.css:294](frontend/src/index.css#L294) |
| `--teal` | `#6fb9c6` | [frontend/src/index.css:295](frontend/src/index.css#L295) |
| `--teal-soft` | `#e4f4f7` | [frontend/src/index.css:296](frontend/src/index.css#L296) |
| `--butter` | `#ffeaf1` | [frontend/src/index.css:297](frontend/src/index.css#L297) |
| `--ink` | `#2b1810` | [frontend/src/index.css:298](frontend/src/index.css#L298) |
| `--border` | `1.5px solid #f2dbe2` | [frontend/src/index.css:299](frontend/src/index.css#L299) |
| `--sc-sidebar` | `16rem` | [frontend/src/index.css:557](frontend/src/index.css#L557) |
| `--sc-sidebar` | `18rem` | [frontend/src/index.css:558](frontend/src/index.css#L558) |
| `--color-secondary` | `#c05477` | [frontend/src/styles/artisan-workspace.css:3](frontend/src/styles/artisan-workspace.css#L3) |
| `--color-secondary-container` | `#fef3c7` | [frontend/src/styles/artisan-workspace.css:4](frontend/src/styles/artisan-workspace.css#L4) |
| `--color-secondary-fixed` | `#fde68a` | [frontend/src/styles/artisan-workspace.css:5](frontend/src/styles/artisan-workspace.css#L5) |
| `--color-background` | `#f8fafc` | [frontend/src/styles/artisan-workspace.css:6](frontend/src/styles/artisan-workspace.css#L6) |
| `--color-surface` | `#ffffff` | [frontend/src/styles/artisan-workspace.css:7](frontend/src/styles/artisan-workspace.css#L7) |
| `--color-surface-container-low` | `#f8fafc` | [frontend/src/styles/artisan-workspace.css:8](frontend/src/styles/artisan-workspace.css#L8) |
| `--color-surface-container` | `#f1f5f9` | [frontend/src/styles/artisan-workspace.css:9](frontend/src/styles/artisan-workspace.css#L9) |
| `--color-outline-variant` | `#e2e8f0` | [frontend/src/styles/artisan-workspace.css:10](frontend/src/styles/artisan-workspace.css#L10) |
| `--color-primary` | `var(--sc-color-primary)` | [frontend/src/styles/design-system.css:4](frontend/src/styles/design-system.css#L4) |
| `--color-primary-container` | `var(--sc-color-primary-hover)` | [frontend/src/styles/design-system.css:5](frontend/src/styles/design-system.css#L5) |
| `--color-on-surface` | `var(--sc-color-text)` | [frontend/src/styles/design-system.css:6](frontend/src/styles/design-system.css#L6) |
| `--color-on-surface-variant` | `var(--sc-color-muted)` | [frontend/src/styles/design-system.css:7](frontend/src/styles/design-system.css#L7) |
| `--font-serif` | `var(--sc-font-ui)` | [frontend/src/styles/design-system.css:8](frontend/src/styles/design-system.css#L8) |
| `--sc-font-ui` | `'Plus Jakarta Sans', system-ui, -apple-system, 'Segoe UI', sans-serif` | [frontend/src/styles/design-tokens.css:2](frontend/src/styles/design-tokens.css#L2) |
| `--sc-color-primary` | `#6b212e` | [frontend/src/styles/design-tokens.css:3](frontend/src/styles/design-tokens.css#L3) |
| `--sc-color-primary-hover` | `#4f1722` | [frontend/src/styles/design-tokens.css:4](frontend/src/styles/design-tokens.css#L4) |
| `--sc-color-text` | `#0f172a` | [frontend/src/styles/design-tokens.css:5](frontend/src/styles/design-tokens.css#L5) |
| `--sc-color-muted` | `#64748b` | [frontend/src/styles/design-tokens.css:6](frontend/src/styles/design-tokens.css#L6) |
| `--sc-color-accent` | `#c05477` | [frontend/src/styles/design-tokens.css:7](frontend/src/styles/design-tokens.css#L7) |
| `--sc-color-border` | `#e2e8f0` | [frontend/src/styles/design-tokens.css:8](frontend/src/styles/design-tokens.css#L8) |
| `--sc-color-focus` | `#c05477` | [frontend/src/styles/design-tokens.css:9](frontend/src/styles/design-tokens.css#L9) |
| `--sc-color-pink` | `#ffe4ec` | [frontend/src/styles/design-tokens.css:10](frontend/src/styles/design-tokens.css#L10) |
| `--sc-color-cream` | `#ffffff` | [frontend/src/styles/design-tokens.css:11](frontend/src/styles/design-tokens.css#L11) |
| `--sc-text-xs` | `.75rem` | [frontend/src/styles/design-tokens.css:12](frontend/src/styles/design-tokens.css#L12) |
| `--sc-text-sm` | `.875rem` | [frontend/src/styles/design-tokens.css:13](frontend/src/styles/design-tokens.css#L13) |
| `--sc-text-body` | `.875rem` | [frontend/src/styles/design-tokens.css:14](frontend/src/styles/design-tokens.css#L14) |
| `--sc-text-title` | `clamp(1.5rem, 2.5vw, 2rem)` | [frontend/src/styles/design-tokens.css:15](frontend/src/styles/design-tokens.css#L15) |
| `--sc-text-section` | `1.25rem` | [frontend/src/styles/design-tokens.css:16](frontend/src/styles/design-tokens.css#L16) |
| `--sc-text-heading` | `1rem` | [frontend/src/styles/design-tokens.css:17](frontend/src/styles/design-tokens.css#L17) |
| `--sc-line-body` | `1.6` | [frontend/src/styles/design-tokens.css:18](frontend/src/styles/design-tokens.css#L18) |
| `--sc-line-heading` | `1.3` | [frontend/src/styles/design-tokens.css:19](frontend/src/styles/design-tokens.css#L19) |
| `--sc-weight-regular` | `400` | [frontend/src/styles/design-tokens.css:20](frontend/src/styles/design-tokens.css#L20) |
| `--sc-weight-medium` | `500` | [frontend/src/styles/design-tokens.css:21](frontend/src/styles/design-tokens.css#L21) |
| `--sc-weight-semibold` | `600` | [frontend/src/styles/design-tokens.css:22](frontend/src/styles/design-tokens.css#L22) |
| `--sc-weight-bold` | `700` | [frontend/src/styles/design-tokens.css:23](frontend/src/styles/design-tokens.css#L23) |
| `--sc-content-width` | `88rem` | [frontend/src/styles/design-tokens.css:24](frontend/src/styles/design-tokens.css#L24) |
| `--sc-page-gutter` | `clamp(1rem, 3vw, 2rem)` | [frontend/src/styles/design-tokens.css:25](frontend/src/styles/design-tokens.css#L25) |
| `--sc-page-top` | `2rem` | [frontend/src/styles/design-tokens.css:26](frontend/src/styles/design-tokens.css#L26) |
| `--sc-page-bottom` | `3rem` | [frontend/src/styles/design-tokens.css:27](frontend/src/styles/design-tokens.css#L27) |
| `--sc-section-gap` | `1.5rem` | [frontend/src/styles/design-tokens.css:28](frontend/src/styles/design-tokens.css#L28) |
| `--sc-card-gap` | `1rem` | [frontend/src/styles/design-tokens.css:29](frontend/src/styles/design-tokens.css#L29) |
| `--sc-card-padding` | `1.5rem` | [frontend/src/styles/design-tokens.css:30](frontend/src/styles/design-tokens.css#L30) |
| `--sc-radius-control` | `.75rem` | [frontend/src/styles/design-tokens.css:31](frontend/src/styles/design-tokens.css#L31) |
| `--sc-radius-card` | `1.25rem` | [frontend/src/styles/design-tokens.css:32](frontend/src/styles/design-tokens.css#L32) |
| `--sc-radius-badge` | `.5rem` | [frontend/src/styles/design-tokens.css:33](frontend/src/styles/design-tokens.css#L33) |
| `--sc-control-height` | `2.75rem` | [frontend/src/styles/design-tokens.css:34](frontend/src/styles/design-tokens.css#L34) |
| `--sc-shadow-card` | `0 4px 20px -2px rgba(15, 23, 42, 0.05)` | [frontend/src/styles/design-tokens.css:35](frontend/src/styles/design-tokens.css#L35) |
| `--sc-shadow-hover` | `0 10px 25px -4px rgba(15, 23, 42, 0.08)` | [frontend/src/styles/design-tokens.css:36](frontend/src/styles/design-tokens.css#L36) |
| `--sc-transition` | `160ms ease` | [frontend/src/styles/design-tokens.css:37](frontend/src/styles/design-tokens.css#L37) |
| `--sc-page-top` | `1.5rem` | [frontend/src/styles/design-tokens.css:41](frontend/src/styles/design-tokens.css#L41) |
| `--sc-page-bottom` | `2rem` | [frontend/src/styles/design-tokens.css:42](frontend/src/styles/design-tokens.css#L42) |
| `--sc-section-gap` | `1.25rem` | [frontend/src/styles/design-tokens.css:43](frontend/src/styles/design-tokens.css#L43) |
| `--sc-card-padding` | `1rem` | [frontend/src/styles/design-tokens.css:44](frontend/src/styles/design-tokens.css#L44) |
| `--color-primary-fixed` | `#f5dcd7` | [frontend/src/styles/legacy-backgrounds.css:4](frontend/src/styles/legacy-backgrounds.css#L4) |
| `--color-primary-fixed-dim` | `#f0eae5` | [frontend/src/styles/legacy-backgrounds.css:5](frontend/src/styles/legacy-backgrounds.css#L5) |
| `--color-secondary-container` | `#fce7eb` | [frontend/src/styles/legacy-backgrounds.css:6](frontend/src/styles/legacy-backgrounds.css#L6) |
| `--color-secondary-fixed` | `#fbcfe8` | [frontend/src/styles/legacy-backgrounds.css:7](frontend/src/styles/legacy-backgrounds.css#L7) |
| `--color-secondary-fixed-dim` | `#f9a8d4` | [frontend/src/styles/legacy-backgrounds.css:8](frontend/src/styles/legacy-backgrounds.css#L8) |
| `--color-tertiary` | `#64748b` | [frontend/src/styles/legacy-backgrounds.css:9](frontend/src/styles/legacy-backgrounds.css#L9) |
| `--color-tertiary-container` | `#f1f5f9` | [frontend/src/styles/legacy-backgrounds.css:10](frontend/src/styles/legacy-backgrounds.css#L10) |
| `--color-tertiary-fixed` | `#f1f5f9` | [frontend/src/styles/legacy-backgrounds.css:11](frontend/src/styles/legacy-backgrounds.css#L11) |
| `--color-tertiary-fixed-dim` | `#e2e8f0` | [frontend/src/styles/legacy-backgrounds.css:12](frontend/src/styles/legacy-backgrounds.css#L12) |
| `--color-surface-dim` | `#f1f5f9` | [frontend/src/styles/legacy-backgrounds.css:13](frontend/src/styles/legacy-backgrounds.css#L13) |
| `--color-surface-container` | `#f1f5f9` | [frontend/src/styles/legacy-backgrounds.css:14](frontend/src/styles/legacy-backgrounds.css#L14) |
| `--color-surface-container-high` | `#e2e8f0` | [frontend/src/styles/legacy-backgrounds.css:15](frontend/src/styles/legacy-backgrounds.css#L15) |
| `--color-surface-container-highest` | `#cbd5e1` | [frontend/src/styles/legacy-backgrounds.css:16](frontend/src/styles/legacy-backgrounds.css#L16) |
| `--color-surface-variant` | `#f1f5f9` | [frontend/src/styles/legacy-backgrounds.css:17](frontend/src/styles/legacy-backgrounds.css#L17) |
| `--color-background` | `#fff0f5` | [frontend/src/styles/legacy-backgrounds.css:20](frontend/src/styles/legacy-backgrounds.css#L20) |
| `--color-surface` | `#ffffff` | [frontend/src/styles/legacy-backgrounds.css:21](frontend/src/styles/legacy-backgrounds.css#L21) |
| `--color-primary` | `var(--sc-color-primary)` | [frontend/src/styles/legacy-backgrounds.css:22](frontend/src/styles/legacy-backgrounds.css#L22) |
| `--color-primary-container` | `var(--sc-color-primary-hover)` | [frontend/src/styles/legacy-backgrounds.css:23](frontend/src/styles/legacy-backgrounds.css#L23) |
| `--color-secondary-container` | `#fce7eb` | [frontend/src/styles/legacy-backgrounds.css:24](frontend/src/styles/legacy-backgrounds.css#L24) |
| `--sc-glow-gold` | `rgba(212, 99, 135, 0.04)` | [frontend/src/styles/legacy-backgrounds.css:40](frontend/src/styles/legacy-backgrounds.css#L40) |
| `--sc-glow-champagne` | `rgba(226, 232, 240, 0.4)` | [frontend/src/styles/legacy-backgrounds.css:41](frontend/src/styles/legacy-backgrounds.css#L41) |
| `--sc-glow-gold` | `#c054770d` | [frontend/src/styles/legacy-backgrounds.css:63](frontend/src/styles/legacy-backgrounds.css#L63) |
| `--sc-glow-champagne` | `rgba(226, 232, 240, 0.4)` | [frontend/src/styles/legacy-backgrounds.css:63](frontend/src/styles/legacy-backgrounds.css#L63) |
| `--sc-glow-gold` | `rgba(212, 99, 135, 0.04)` | [frontend/src/styles/legacy-backgrounds.css:66](frontend/src/styles/legacy-backgrounds.css#L66) |
| `--sc-glow-champagne` | `rgba(226, 232, 240, 0.4)` | [frontend/src/styles/legacy-backgrounds.css:66](frontend/src/styles/legacy-backgrounds.css#L66) |
| `--sc-glow-gold` | `rgba(212, 99, 135, 0.04)` | [frontend/src/styles/legacy-backgrounds.css:95](frontend/src/styles/legacy-backgrounds.css#L95) |
| `--sc-glow-champagne` | `rgba(226, 232, 240, 0.3)` | [frontend/src/styles/legacy-backgrounds.css:95](frontend/src/styles/legacy-backgrounds.css#L95) |
| `--color-primary` | `var(--sc-color-primary)` | [frontend/src/styles/legacy-backgrounds.css:128](frontend/src/styles/legacy-backgrounds.css#L128) |

## 15. Ranh giới sử dụng tài liệu

Mobile hiện chỉ có scaffold trống. Khi phát triển feature, lấy đúng token/variant liên quan, thử trên thiết bị với text lớn, bàn phím và navigation native, đối chiếu ảnh Web tương ứng. Không dùng tài liệu này để hợp thức hóa escrow claim, demo checkout hay API thiếu. Các vấn đề đó thuộc audit nghiệp vụ và cần quyết định sản phẩm/hợp đồng trước khi port.
