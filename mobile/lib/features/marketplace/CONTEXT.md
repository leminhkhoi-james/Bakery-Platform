# Marketplace live

Repository dùng public Marketplace origin từ `ApiEnvironment`, kế thừa `ApiClient` và session. RFQ/Offer route trong `LiveRouter`; preview cũ dùng DemoWorkspace riêng.

Backend sở hữu visibility/membership/entitlement, state machine, snapshot và accept→Order. Client chỉ cho sửa/ảnh RFQ ở DRAFT; Offer pending/unexpired còn phải được server xác minh. Patch là JSON phẳng, không bọc `changes`. Tiền dùng `Money`; timestamp UTC từ native picker. Targeted RFQ mang ID option/value từ catalog thật.

Accept adapter nhận một logical key từ caller, không auto POST retry. UI chưa thể chọn address vì Identity thiếu public contract nên khóa action và chỉ cho đối chiếu danh sách đơn. Không gọi internal API hoặc tự tạo direct Order để thay acceptance. Image API được nối nhưng phụ thuộc Firebase của deployment.

Runtime sáu service Mobile tương thích đã được reuse; image Bakery canonical cũ không phải binary đang phục vụ luồng này. Không sửa Backend/grant hoặc thay topology để né lỗi. Báo cáo current run ở docs/full-integration phân biệt evidence mới với lịch sử Phases 5.

Selected-design PUT chỉ từ thiết kế APPROVED thật trong job thuộc RFQ DRAFT của Customer. Admin oversight dùng list/detail được cấp quyền; không giả lập hàng đợi global pending-AI. Cake AI thiếu runtime/compile thì UI báo lỗi thật và không tạo thiết kế mẫu.
