# ADR-008: Tồn kho phụ kiện theo đơn hàng

Ngày: 2026-11-13. Trạng thái: accepted theo yêu cầu thêm số lượng mua và tự trừ/hoàn.

Bakery sở hữu số lượng có thể bán (`add_ons.stock_quantity`). Số lượng phụ kiện là
số đơn vị bán cho cả đơn (bộ nến hoặc phụ kiện lẻ), độc lập số bánh. Quote chỉ
kiểm tra, không giữ chỗ. Order gọi
internal allocation trước khi lưu đơn; Bakery khóa các phụ kiện theo UUID để trừ
nguyên tử, không âm. Cùng order/payload chỉ trừ một lần. Hủy hoàn đúng số đã trừ,
kể cả phụ kiện bị ẩn. Release không có allocation tạo tombstone để chặn request
allocate đến muộn sau timeout.

Order ghi intent RESERVING trước HTTP. Lưu order, idempotency và COMMITTED trong
cùng transaction DB Order. Tạo lỗi/attempt thua idempotency chuyển RELEASE_REQUIRED;
hủy đơn cũng ghi RELEASE_REQUIRED trong transaction đổi trạng thái. Worker 30 giây
thử hoàn lại và thu hồi RESERVING quá 2 phút. Khóa intent ngăn lưu đơn sau khi worker
đã thu hồi. Không gọi HTTP trong transaction ghi order, không cần broker hoặc DB chung.
Đơn cũ không có intent không được cộng tồn khi hủy. Giữ intent/allocation để retry
và đối chiếu; chưa có chính sách xóa lịch sử.

Internal writes chỉ chấp nhận service JWT subject `order-service`, audience Bakery,
scope sẵn có `bakery:catalog:quote` và correlation ID. Marketplace dù có quote scope
cũng không được ghi tồn. Gateway không công khai internal routes.

Phụ kiện cũ chưa nhập tồn giữ NULL và chưa đặt được; create thiếu tồn mặc định 0.
Chủ tiệm nhập số có thể bán, gửi version hiện tại khi chỉnh tồn để tránh ghi đè một
allocation vừa xảy ra. Seed chỉ điền 100 cho phụ kiện mẫu mới/chưa khởi tạo, không
reset tồn đã dùng khi restart. Không sửa migration cũ hoặc dữ liệu đơn lịch sử.

Giao diện khách ghi giá nến theo bộ và không hiển thị số tồn cụ thể. Thiệp được
loại khỏi lựa chọn mua kèm và draft cũ trước khi tính giá; không xóa lịch sử.
