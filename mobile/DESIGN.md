# SweetCake Mobile — thế giới thị giác kế thừa

Nguồn quyền ưu tiên là Web hiện tại và `../design-web.md`; đây là bản ghi thích ứng native, không thay đổi kết quả trích xuất Web.

Wine `#6B212E`, hover `#4F1722`, accent `#C05477`, hồng nhạt `#FFE4EC`/`#FFF0F5`, chữ `#0F172A`/`#64748B`, surface trắng/slate và border `#E2E8F0`. Plus Jakarta Sans cho UI; Dancing Script chỉ wordmark khi cần. Font bundle local, không tải runtime.

Customer dùng nền hồng, mascot mèo, hình bánh và panel bo mềm. Owner/Admin dùng nền slate, panel trắng, status/filters/form rõ ràng. Không thêm dark theme/dynamic palette hoặc thay nhận diện. Radius control 12, card 20, badge 8; gutter phone 16, card padding 16–24; hit target native 48 thay một số control Web 36–44 để dễ thao tác.

Native navigation dùng thanh dưới tối đa năm nhóm, drawer/menu cho chức năng ít dùng, rail khi tablet; detail dùng navigation stack và system back. Nút, form, sheet, dialog dùng control Flutter có theme; không tái tạo hover/CSS/desktop sidebar trên phone.

Luồng mặc định kế thừa API Phases 1–4 và mở rộng RFQ/Offer, giỏ/Order và Chat qua repository live; không có chip Demo hoặc đổi persona. Các trang mới kế thừa bố cục/thẻ/typography của preview tương ứng, thay nguồn dữ liệu và action bằng API; preview cũ chỉ dùng entrypoint/test `DemoWorkspace`, không nhận ID live. Capability bị chặn có giải thích riêng, không đổi sang fixture hoặc báo chuyển tiền/AI thành công. Motion ngắn 160–240 ms, tôn trọng disableAnimations; không ép snap/parallax Web lên touch.

Màn hình vận hành giữ nền slate, Customer giữ nền hồng. Menu chức năng ở app bar mở rộng điều hướng mà không tăng số nhóm bottom navigation quá năm. Date/time picker native chuyển giờ thiết bị sang UTC; trường vẫn cho nhập ISO 8601 có múi giờ. Giỏ nêu rõ tạm tính khác giá được Order xác nhận. Nút checkout/accept bị khóa có lý do khi chưa có địa chỉ được API cho phép chọn. Chat phân biệt lịch sử đọc lỗi với tin nhắn được server xác nhận; không kết luận thiếu quyền chỉ vì lỗi lịch sử trả 403.

Form live giữ dữ liệu khi validation/network lỗi, chặn nhấn lặp, xác nhận khi rời dữ liệu chưa lưu và cảnh báo kết quả mutation chưa chắc chắn. Full replacement operations/options hiển thị phạm vi thay thế, giữ ID do server cấp. Chọn file dùng document picker của hệ điều hành và kiểm tra byte/MIME/kích thước; không yêu cầu quyền đọc toàn bộ thư viện ảnh. Danh sách không có dữ liệu khác với lỗi kết nối; lỗi ảnh không được thay bằng ảnh demo.

Taste và Impeccable được áp dụng theo visual world đã chốt, không chọn lại concept. Review render thực tế gồm Home, public product, Owner, Admin, payment và ACTIVE/SCHEDULED; Web headless hiển thị cùng bản ghi để so palette/type/ảnh. Widget live kiểm tra form cuộn ở 320px với text scale 1.0/1.8. Chưa xác nhận TalkBack, iOS hoặc hiệu năng release bằng kiểm thử thiết bị thực.
