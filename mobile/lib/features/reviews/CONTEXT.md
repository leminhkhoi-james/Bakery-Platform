# Review live

Review thuộc chi tiết Order, khóa bằng `orderId`, không có trường `id` riêng. Customer chỉ tạo trên đơn COMPLETED của mình; sửa khi PUBLISHED, xóa mềm khi chưa DELETED. Admin khám phá qua danh sách Order scope=all và detail.review; không giả lập API hàng đợi review. Admin chỉ chuyển PUBLISHED/HIDDEN. Luôn refetch Order sau mutation. Runtime cần đơn hoàn tất thật; source/adapter test không thay cho E2E bị chặn bởi address contract.
