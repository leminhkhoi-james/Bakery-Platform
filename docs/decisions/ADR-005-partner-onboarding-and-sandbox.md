# ADR-005 — Đăng ký đối tác và thanh toán thử nghiệm

## Quyết định

- Identity đăng ký tài khoản với `CUSTOMER`. Bakery tiếp nhận hồ sơ đối tác
  và tạo membership `OWNER` theo JWT subject cho đúng tiệm trong cùng
  transaction. Khách dùng membership này để mua gói cho hồ sơ của mình.
- Admin duyệt hồ sơ qua Bakery và duyệt thanh toán qua Subscription. Hai
  thao tác cập nhật hai trạng thái độc lập theo contract hiện có.
- Sau khi tiệm và kỳ dịch vụ đều `ACTIVE`, lần duyệt cuối tự kích hoạt
  quyền chủ tiệm. Bakery xác minh membership và entitlement rồi gọi Identity bằng scope
  `identity:bakery-owner:grant`, chỉ cấp cho service client Bakery. Identity
  thêm role cố định `BAKERY_OWNER` theo cách idempotent, giữ `CUSTOMER`.
  Client đang theo dõi hồ sơ refresh phiên để dùng role mới.
- Duyệt hồ sơ kiểm tra quyền sau khi Bakery commit. Duyệt thanh toán thông báo
  Bakery sau khi Subscription commit, với scope `bakery:onboarding:activate`.
  Bakery lưu cờ chờ cấp quyền trong membership để đối chiếu lại khi có lỗi
  kết nối hoặc khởi động lại.
- Demo local dùng mã sandbox cấu hình trong Subscription. Mã hợp lệ xác nhận
  thanh toán thử và dùng chung vòng đời review với chứng từ. Tham chiếu lưu
  theo đơn và idempotency key. Sandbox mặc định tắt.

Trạng thái hồ sơ, thanh toán và kỳ dịch vụ đã lưu vẫn được dùng làm nguồn
xác minh. Không thêm bảng hoặc transaction xuyên DB.

## Đính chính theo yêu cầu người dùng — 2026-11-08

Quyết định dùng mã sandbox ở trên được thay bằng luồng chứng từ và ADMIN duyệt
theo contract ban đầu. Không tích hợp cổng thanh toán, không yêu cầu mã sandbox.
Backend bỏ cấu hình mã test và từ chối phương thức SANDBOX. Endpoint báo khả
năng payment giữ tương thích client và luôn trả sandboxEnabled=false.
Demo dùng mã tham chiếu/chứng từ mẫu riêng cho từng đơn, sau đó ADMIN duyệt.
Luồng tự cấp quyền chủ tiệm sau hai điều kiện phê duyệt vẫn được giữ.
