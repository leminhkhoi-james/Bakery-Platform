# Kiểm tra nút trạng thái và điều hướng — 2026-10-28

Chỉ thay frontend trên nhánh dev. Không thay AuthProvider/authService, API service hay assets.

Fixture browser dùng App, route và mockData có sẵn, chỉ thay context phiên kiểm thử:
`node tests/fixtures/role-actions-preview.mjs`, mở http://127.0.0.1:5188/login.
Thanh chọn role chỉ xuất hiện trong fixture, không nằm trong ứng dụng production.

Đã kiểm tra tay:
- Admin → admin-dashboard; Owner → vendor-dashboard; Staff → vendor-orders; Customer → /.
- Đổi role không giữ workspace/dữ liệu của tài khoản trước; query cửa hàng/đơn cũ được xóa ở trang đích.
- Chủ động mở admin-orders/vendor-orders rồi refresh vẫn giữ trang.
- Customer mở tracking?orderId=... rồi refresh vẫn giữ nguyên đường dẫn và đơn.
- Owner xác nhận đơn; Staff tiếp tục làm bánh → sẵn sàng giao → đang giao → hoàn tất.
- Nút bước tiếp theo đúng trạng thái; không còn hủy khi đã làm bánh; đơn kết thúc không còn nút chuyển bước.
- Có xác nhận, quay lại, ghi chú tùy chọn; hủy đơn yêu cầu lý do.
- Hai phiên cùng mở đơn: khi Owner đổi trạng thái, xác nhận cũ ở Staff bị khóa và yêu cầu chọn lại.
- Customer, Owner, Staff, Admin thấy cùng trạng thái/lịch sử/ghi chú.
- Thông báo thành công cũ được ẩn khi một người khác cập nhật trạng thái tiếp theo.
- Desktop 1440px và mobile 390px: thao tác hiển thị cân đối, không tràn ngang; theme/font/background giữ nguyên.

Test tự động kiểm tra role, route hợp lệ, quyền, nút theo bước, khóa loading và đồng bộ mock qua orderService hiện có.
Các HTTP regression tests tiếp tục kiểm tra đường gọi API thật. Fixture không kiểm thử đăng nhập JWT với backend thật.

## Bổ sung: nút quản lý và bảng Admin

- Thay dropdown chuyển trạng thái tiệm và kiểm duyệt thiết kế bằng nhóm nút có icon, màu theo tính chất thao tác và bước xác nhận.
- Đóng tiệm cần xác nhận không thể mở lại; duyệt tiệm vẫn kiểm tra địa chỉ chính và vùng giao hàng.
- Mở bán/ẩn/lưu trữ sản phẩm dùng cùng component, giữ quyền OWNER/MANAGER; Staff chỉ xem theo quyền hiện có.
- Dùng bộ nhãn tiếng Việt chung; giữ nguyên enum trong giá trị form và request.
- Bảng Admin dùng chung căn lề, cỡ chữ, độ cao hàng, cách xuống dòng và vùng cuộn ngang trên màn hình nhỏ. Danh sách người dùng dùng DataTable hiện có.
- Test tự động thêm cho xác nhận, quay lại, quyền/trạng thái thay đổi, loading, chống gửi lặp, retry và enum gửi đi. Test bảng đơn hàng có dữ liệu kiểm tra nhãn trạng thái và nút xem chi tiết.
- Chưa kiểm tra tay các thay đổi bổ sung trong browser: công cụ CUA lỗi khởi tạo `failed to write kernel assets: The system cannot find the path specified (os error 3)` cả trước và sau reset. Các mục kiểm tra tay ở phần trên thuộc lượt thay đổi luồng đơn hàng/điều hướng trước đó.
- Không kiểm thử giao dịch ngân hàng hay đăng nhập backend thật; không gửi dữ liệu mock lên backend.

## Sau khi ghép bản pull owner-only

Bản pull áp dụng ADR-004: chỉ ADMIN, CUSTOMER, BAKERY_OWNER; membership chỉ OWNER. Các kết quả Staff/Manager phía trên là lịch sử trước khi đổi contract, không mô tả quyền hiện tại.

- Giữ nút thao tác có xác nhận, loading, tiếng Việt và bảng Admin đã chuẩn hóa.
- Danh sách chủ tiệm chỉ đọc; không khôi phục form thêm/sửa/xóa thành viên.
- Điều hướng và fixture chỉ cấp workspace cho các role hiện được hỗ trợ. Test bổ sung xác nhận role Staff cũ không vào workspace chủ tiệm hoặc xử lý đơn.
- Mock order flow dùng Customer → Owner → Admin, giữ ghi chú/lịch sử và không ghi backend.
