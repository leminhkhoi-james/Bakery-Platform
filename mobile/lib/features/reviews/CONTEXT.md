# Review live

Review thuộc chi tiết Order, khóa bằng `orderId`, không có trường `id` riêng. Customer chỉ tạo trên đơn COMPLETED của mình; sửa khi PENDING/PUBLISHED, xóa mềm khi chưa DELETED. Tạo và sửa trả PENDING; hiển thị chờ duyệt, không tự công khai. Admin khám phá qua danh sách Order scope=all và detail.review; không giả lập API hàng đợi review. Admin chỉ chuyển PUBLISHED/HIDDEN. Luôn refetch Order sau mutation. Kết quả chưa rõ khóa gửi lại, cung cấp GET Order để đối chiếu review đã lưu; không tự POST lại. Lỗi parser được phân loại invalidResponse, không hiển thị mã HTTP giả.
