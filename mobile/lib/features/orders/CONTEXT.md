# Order live

Public API: list/detail/direct/status-transitions và Review/Admin Review. Review gắn với `orderId`, không có `id` riêng; xem `../reviews/CONTEXT.md`. Admin khám phá Order qua scope=all rồi detail.review, không có global review queue. Order state/action được đối chiếu `CustomerOrder.transitionTo` và authorization ở service. Customer chỉ cancellation đúng trạng thái; Owner cần membership; Admin có state machine từ source. Server quyết định cuối.

Direct contract chỉ có một product nên giỏ có một dòng sản phẩm, quantity/options/add-ons thật và một bakery. Tạm tính dùng BigInt cents, đọc lại catalog và báo giá thay đổi; không có public quote API riêng. Snapshot hiển thị tên, số lượng, tiền và trường cấu hình đã biết, không dump JSON nội bộ.

Identity chưa có public address discovery/management. Checkout không nhận UUID nhập tay và không gửi đơn giả. Direct adapter/idempotency có test nhưng real creation/transition chưa được xem là hoàn tất khi thiếu prerequisite. Accepted-offer Order chỉ do Marketplace tạo qua internal orchestration; Mobile chỉ đọc Order public.
