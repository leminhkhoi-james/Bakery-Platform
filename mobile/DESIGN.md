# SweetCake Mobile — thế giới thị giác kế thừa

Nguồn quyền ưu tiên là Web hiện tại và `../design-web.md`; đây là bản ghi thích ứng native, không thay đổi kết quả trích xuất Web.

Wine `#6B212E`, hover `#4F1722`, accent `#C05477`, hồng nhạt `#FFE4EC`/`#FFF0F5`, chữ `#0F172A`/`#64748B`, surface trắng/slate và border `#E2E8F0`. Plus Jakarta Sans cho UI; Dancing Script chỉ wordmark khi cần. Font bundle local, không tải runtime.

Customer dùng nền hồng, mascot mèo, hình bánh và panel bo mềm. Owner/Admin dùng nền slate, panel trắng, status/filters/form rõ ràng. Không thêm dark theme/dynamic palette hoặc thay nhận diện. Radius control 12, card 20, badge 8; gutter phone 16, card padding 16–24; hit target native 48 thay một số control Web 36–44 để dễ thao tác.

Native navigation dùng thanh dưới tối đa năm nhóm, drawer/menu cho chức năng ít dùng, rail khi tablet; detail dùng navigation stack và system back. Nút, form, sheet, dialog dùng control Flutter có theme; không tái tạo hover/CSS/desktop sidebar trên phone.

Một chip Demo toàn app và thông báo tại mutation đủ phân biệt dữ liệu local, không phủ banner lớn trên từng trang. Không báo chuyển tiền hay AI generation thành công. Motion ngắn 160–240 ms và tôn trọng disableAnimations; không ép snap/parallax của Web lên scroll touch.
