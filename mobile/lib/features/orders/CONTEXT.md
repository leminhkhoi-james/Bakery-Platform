# Order live

Public API: list/detail/direct/status-transitions và Review/Admin Review. Review gắn với `orderId`, không có `id` riêng; xem `../reviews/CONTEXT.md`. Admin khám phá Order qua scope=all rồi detail.review, không có global review queue. Customer sở hữu đơn và có role CUSTOMER được hủy đúng trạng thái hoặc xác nhận DELIVERING → COMPLETED; cần xác nhận nhận bánh, khóa nút trong khi gửi và đọc lại trạng thái. Owner/Admin không hoàn tất thay Customer; Owner cần membership cho các bước giao bánh. Server quyết định cuối.

Direct contract chỉ có một product nên giỏ có một dòng sản phẩm, quantity/options/add-ons thật và một bakery. Tạm tính dùng BigInt cents, đọc lại catalog và báo giá thay đổi; không có public quote API riêng. Snapshot hiển thị tên, số lượng, tiền và trường cấu hình đã biết, không dump JSON nội bộ.

Checkout dùng Address CRUD public authenticated của Identity tại `/api/v1/users/me/addresses`. Khách chọn UUID do server cấp từ danh sách của mình; kiểm tra lại địa chỉ và catalog trước khi gửi. Đơn giữ delivery/item/price snapshots từ Backend. Accepted-offer Order chỉ do Marketplace tạo qua orchestration; Mobile không gọi internal endpoint.

Mỗi lệnh Direct giữ nguyên payload và UUID idempotency trong phiên tài khoản. Kết quả chưa rõ khóa chỉnh/xóa giỏ, giữ lệnh qua điều hướng và chỉ replay theo thao tác rõ ràng của người dùng. HTTP 422 sau replay là kết quả validation dứt khoát, cho phép sửa prerequisite. Logout/đổi account xóa command/cart; journal Direct chưa bền vững qua process death. Không tự POST retry hoặc tuyên bố đã tạo đơn khi response chưa xác nhận ID.
