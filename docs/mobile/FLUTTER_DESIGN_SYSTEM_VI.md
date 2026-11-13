# Hệ thống thiết kế SweetCake trên Flutter

Ngày thực hiện: 07/11/2026. Nguồn ưu tiên: [design-web.md](../../design-web.md), Web hiện tại và ảnh Web đã lưu trong `docs/audit/screenshots`. Không thay đổi thiết kế Web hoặc dùng một palette mới do skill gợi ý.

## Bản sắc và thích ứng native

Giữ wine, hồng sữa, wordmark SweetCake, mascot mèo và ảnh bánh đang dùng ở Web. Home kế thừa sọc mái quầy mint/hồng ở kích thước nhỏ; không chép toàn bộ sân khấu kiosk, sunburst và scroll snap vào màn hình điện thoại. Mascot là bitmap gốc, được cắt khung hiển thị bằng Flutter để bỏ phần thoại đã bị cắt ở asset nguồn; không sửa bitmap. Owner/Admin kế thừa workspace trắng/slate, tiêu đề wine, filter và status rõ ràng.

Ứng dụng dùng một theme sáng cố định theo thương hiệu. Chưa thiết kế dark theme hoặc Android Dynamic Color. Đây là lựa chọn theo brief; không báo đã kiểm thử hai appearance. Wordmark dùng ảnh thương hiệu nguyên bản; Dancing Script được bundle để dùng khi cần lettering, không thay font của nội dung UI.

## Bảng token

| Mục đích | Web / giá trị | Flutter |
|---|---|---|
| Màu chính | `#6B212E` | `AppColors.wine`, `ColorScheme.primary` |
| Trạng thái nhấn đậm | `#4F1722` | `wineDark` |
| Accent | `#C05477` | `accent`, focus/selection |
| Hồng trang trí | `#D46387` | `decorativePink`; không dùng làm chữ nhỏ trên trắng |
| Hồng nhẹ / nền | `#FFE4EC`, `#FFF0F5`, `#FFF8FA` | `softPink`, `pagePink`, `lightPink` |
| Workspace | `#F8FAFC`, `#F1F5F9`, trắng | `background`, `surfaceLow`, `white` |
| Chữ / chữ phụ | `#0F172A`, `#64748B` | `text`, `muted` |
| Border | `#E2E8F0` | `border` |
| Mint mái quầy | `#6FB9C6` | `mint`, chỉ trang trí Home |
| Thành công | `#2C6949` / `#EAF4EC` | `green` / `greenBackground` |
| Đang chờ | `#94601C` / `#FFF2DC` | `amber` / `amberBackground` |
| Thông tin | `#456B8B` / `#EDF2F8` | `blue` / `blueBackground` |
| Từ chối / hủy | `#A14B59` / `#FBECEF` | `red` / `redBackground` |
| Khoảng cách | 4 / 8 / 16 / 24 / 40 / 48 | `AppSpacing`, gutter phone 16 |
| Bo góc | control 12, card 20, badge 8 | theme và widget chung |
| Target chạm | native tối thiểu 48 logical px | button/input/icon/chip Material |

Token tập trung tại `mobile/lib/app/theme`. Các icon dùng cùng bộ Material. Màu trạng thái luôn đi cùng chữ, không yêu cầu người dùng nhận biết chỉ bằng màu.

## Typography

Plus Jakarta Sans variable được bundle local, dùng `FontVariation('wght', ...)`. Body 14, chữ phụ 12, title 16/18/20, headline 24/28/32; line-height body khoảng 1.6 và heading 1.3. Giá được format VND theo nhóm nghìn, không dùng số thập phân giả. Text scaler hệ thống được giữ; không ép toàn app về 1.0. Nội dung dài chuyển dòng và label/value chuyển dọc khi vùng chứa hẹp.

Không đặt font bằng HTTP hoặc Google Fonts runtime. Hai font nguyên bản có SIL OFL 1.1 đi kèm tại `mobile/assets/fonts`. Nguồn và SHA-256 trong [assets.json](evidence/assets.json). Ảnh bánh lấy đúng URL có sẵn trong Web fixture rồi bundle offline; nhiều ảnh gốc chứa chữ/khung website, chưa phải bộ ảnh thương mại sạch. Quyền phát hành artwork/ảnh cần được chủ dự án xác nhận trước release.

## Ánh xạ component

| Web | Flutter | Trạng thái / hành vi |
|---|---|---|
| Nút chính/phụ | `SCButton` | disabled, busy, icon, label xuống dòng, phản hồi Material |
| Panel / product card | `SCCard`, `ProductCard` | bo góc, ảnh, giá, InkWell và Hero ở detail |
| Input | `SCField`, `SCSearch` | label, validation theo field, multiline, xóa tìm kiếm |
| Select/filter | `DropdownButtonFormField`, Choice/FilterChip | expanded trên màn hẹp; filter dài cuộn ngang hoặc wrap |
| Status | `SCStatusBadge` | màu semantic, nhãn tiếng Việt, semantics |
| Dialog/drawer Web | dialog, bottom sheet, route detail | SafeArea, inset bàn phím, scroll và nút đóng |
| Bảng desktop | thẻ record, ExpansionTile, filter | không thu nhỏ bảng desktop xuống phone |
| Empty/error/loading | `SCStateView` | nội dung phục hồi rõ ràng, retry local, vùng cuộn khi thiếu chiều cao |
| Key/value | `SCKeyValue` | chuyển dọc trên vùng hẹp, tránh bẻ email/giá thành cột nhỏ |
| Số lượng | `SCQuantity` | target 48, giới hạn 1–99, nút giảm disabled ở 1 |
| Gallery | ảnh detail + dialog InteractiveViewer | fixture hiện có một ảnh mỗi bánh; zoom tối đa 4× |
| Thông báo | `SCNotice`, SnackBar | ghi rõ local/demo; không giả nhận tiền hoặc tạo ảnh AI |

## Navigation và responsive

Phone dùng 4–5 đích chính theo persona; drawer chứa chức năng ít dùng. Detail dùng navigation stack. Tablet từ 768 px dùng rail có cuộn ở landscape thấp, nội dung tối đa 1100 px. Grid bánh có 1/2/3 cột theo vùng khả dụng và text scale; chữ lớn chuyển một cột. Chat thread ưu tiên composer và nội dung, ẩn thanh navigation dưới; gửi local cuộn đến tin vừa thêm.

Đã kiểm tra layout của 35 màn hình ở 320, 360, 390, 430, 768 px; 360 px với chữ 1.8 và 768×430 landscape. Đây là logical px của widget test. Emulator chụp PNG 720×1280 với logical viewport khoảng 411×731; không nhầm pixel ảnh với logical px.

## Motion, accessibility và giới hạn kiểm chứng

Không tái tạo parallax/snap Web, không animation vô hạn ngoài spinner loading. Route, dialog và phản hồi nút dùng Flutter native; cuộn chat 180 ms, nhảy trực tiếp khi `disableAnimations`. Có label cho icon tác vụ, ảnh, loading và quantity; form hiển thị lỗi tại field, giữ dữ liệu khi lỗi. `UnsavedGuard` bảo vệ bản nháp khi back.

Đã rà source, ảnh Android và kiểm tra chữ lớn/layout. Chưa kiểm thử thủ công TalkBack, VoiceOver, Switch Control, thiết bị iOS hoặc đo hiệu năng release. Native dialog/sheet Material vẫn được dùng trên iOS; chưa khẳng định đạt parity Cupertino hoặc mọi gesture iOS. Đây là các giới hạn xác minh, không phải kết quả PASS suy diễn từ Android.

## Rà soát Taste và Impeccable

Taste được dùng cho hệ thống nhất quán, phân cấp, mép/gutter và density. Impeccable được dùng cho craft floor, hướng dẫn Android/iOS, trạng thái, text scale, inset và audit native. Brief Web giữ quyền quyết định radius 20, mái quầy sọc và mascot. Không chạy checker CSS/browser trên Flutter và không chấm điểm thị giác tùy ý.

Lỗi đã sửa qua test/render: dropdown tràn chữ, grid thiếu chiều cao, rail landscape thấp, empty/error thiếu scroll, controller dispose trước sheet đóng, phần thoại bị cắt ở mascot, email/ngân sách bị bẻ trong cột hẹp, giá trị tiền trong metric và chat không tự cuộn. Các thay đổi này nằm trong Flutter, không chỉnh Web.
