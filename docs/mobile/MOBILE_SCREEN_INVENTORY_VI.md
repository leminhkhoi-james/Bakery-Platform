# Danh mục màn hình SweetCake Mobile

Ngày đối chiếu: 07/11/2026. Baseline 35 route xác minh lại từ Web hiện tại; alias `/vendor-settings` không tính là màn hình thứ 36. Có 7 Public, 11 Customer, 9 Bakery Owner và 8 Admin. Form/sheet, thread chat, order detail và thư viện ảnh là trạng thái phụ, không cộng vào 35.

Mọi màn hình có nội dung local, loading/empty/error/retry, kiểm tra bố cục ở 320/360/390/430/768 px, chữ 1.8 và landscape. Cột bằng chứng phân biệt thao tác được tự động hóa với kiểm tra mở/layout và rà source; không khẳng định mọi tổ hợp thao tác đã test trên thiết bị.

| # | Web | Màn hình Flutter / vai | Domain | Capability local | Bằng chứng thao tác | Ảnh Android |
|---|---|---|---|---|---|---|
| 1 | `/` | SweetCake · Guest / mọi vai | Catalog | Hero, mascot, danh mục, bánh mới, tiệm và CTA | Điều hướng thanh dưới, chọn persona | [Ảnh](screenshots/00-home.png) |
| 2 | `/explore` | Khám phá bánh · Guest / mọi vai | Catalog | Tìm kiếm, danh mục, sắp xếp giá, tải thêm | Tìm không có kết quả rồi xóa tìm kiếm | [Ảnh](screenshots/01-explore.png) |
| 3 | `/product-detail` | Chi tiết bánh · Guest / mọi vai | Catalog / Cart | Ảnh phóng to, size, vị, add-on, số lượng, giá | Chọn size 16 cm, thêm giỏ và đối chiếu giá | [Ảnh](screenshots/02-product.png) |
| 4 | `/stores` | Tiệm bánh đối tác · Guest / mọi vai | Bakery | Tìm tiệm và lọc khu vực | Mở/layout/trạng thái; thao tác bộ lọc rà source | [Ảnh](screenshots/03-stores.png) |
| 5 | `/bakery-detail` | Chi tiết tiệm · Guest / mọi vai | Bakery / Catalog | Thông tin vận hành, thực đơn, mở chat | Mở/layout/trạng thái; liên kết rà source | [Ảnh](screenshots/04-bakery.png) |
| 6 | `/subscription-plans` | Gói đối tác · Guest / mọi vai | Subscription | Ba gói, hạn mức và chọn gói | Mở/layout/trạng thái; liên kết rà source | [Ảnh](screenshots/05-plans.png) |
| 7 | `/login` | Chào mừng đến SweetCake · Guest / mọi vai | Identity UI | Đăng nhập/đăng ký local, validation, quên mật khẩu chưa hỗ trợ | Mở/layout/trạng thái; xác thực thật ngoài phạm vi | [Ảnh](screenshots/06-login.png) |
| 8 | `/cart` | Giỏ bánh của bạn · CUSTOMER / Guest | Cart | Sửa số lượng, bỏ bánh, tổng snapshot, lưu preview | Android thêm giỏ, tăng lượng, lưu preview | [Ảnh](screenshots/07-cart.png) |
| 9 | `/profile` | Tài khoản của tôi · CUSTOMER | Identity UI | Hồ sơ, sửa tên/email/địa chỉ, liên kết tác vụ | Sửa hồ sơ qua sheet, kiểm tra vòng đời controller | [Ảnh](screenshots/08-profile.png) |
| 10 | `/tracking` | Đơn bánh của tôi · CUSTOMER | Order | Tìm/lọc đơn, detail, timeline, hủy/hoàn tất, review | Mở/layout/trạng thái; state machine domain | [Ảnh](screenshots/09-tracking.png) |
| 11 | `/payment` | Thông tin thanh toán · CUSTOMER | Order / Chat | Thông tin thỏa thuận trực tiếp với tiệm | Mở/layout/trạng thái; không có payment giả | [Ảnh](screenshots/10-payment.png) |
| 12 | `/ai-studio` | Xưởng ý tưởng · CUSTOMER | Cake AI UI | Prompt, màu/tầng/vị, ảnh mẫu, lưu draft/revision, RFQ handoff | Mở/layout/trạng thái; không có AI/3D thật | [Ảnh](screenshots/11-studio.png) |
| 13 | `/rfqs` | Yêu cầu của tôi · CUSTOMER | Marketplace | Tìm/lọc RFQ, tạo yêu cầu, mở detail | Android retry khôi phục danh sách | [Ảnh](screenshots/12-requests.png) |
| 14 | `/rfq-new` | Tạo yêu cầu bánh · CUSTOMER | Marketplace | Form, ngân sách, ngày, loại, mẫu bánh, lưu DRAFT | Widget validation và Android tạo nháp | [Ảnh](screenshots/13-requestNew.png) |
| 15 | `/request-detail` | Chi tiết yêu cầu · CUSTOMER | Marketplace | Xem RFQ, sửa DRAFT, publish/cancel local, mở báo giá | Android mở bản nháp vừa lưu; domain publish/cancel | [Ảnh](screenshots/14-requestDetail.png) |
| 16 | `/bidding` | So sánh báo giá · CUSTOMER | Marketplace | Sắp tổng giá, đối chiếu và chọn preview | Widget chọn preview, vẫn giữ PENDING | [Ảnh](screenshots/15-comparison.png) |
| 17 | `/baker-quote` | Chi tiết báo giá · CUSTOMER | Marketplace | Breakdown giá, hiệu lực, preview, chat | Mở/layout/trạng thái; không tạo giao dịch | [Ảnh](screenshots/16-offer.png) |
| 18 | `/chat` | Tin nhắn · CUSTOMER | Chat | Danh sách, unread, thread, gửi/ảnh/xóa/đóng local | Android gửi tin; domain chặn tin rỗng và hội thoại đóng | [Ảnh](screenshots/17-chat.png) |
| 19 | `/vendor-dashboard` | Tổng quan tiệm · BAKERY_OWNER | Bakery / Catalog / Order | Chỉ số fixture theo tiệm, liên kết tác vụ | Mở/layout/trạng thái; chọn persona owner | [Ảnh](screenshots/18-vendorDashboard.png) |
| 20 | `/vendor-menu` | Catalog của tiệm · BAKERY_OWNER | Catalog | Danh mục, sản phẩm, ảnh, option, add-on, xuất bản/lưu trữ | Widget tạo sản phẩm DRAFT | [Ảnh](screenshots/19-vendorCatalog.png) |
| 21 | `/vendor-orders` | Đơn của tiệm · BAKERY_OWNER | Order | Lọc đơn theo tiệm, detail, chuyển trạng thái có xác nhận | Widget PENDING→CONFIRMED, Android detail | [Ảnh](screenshots/20-vendorOrders.png) |
| 22 | `/vendor-rfq` | Yêu cầu khả dụng · BAKERY_OWNER | Marketplace | RFQ OPEN, tìm kiếm, lọc tiệm đích | Mở/layout/trạng thái; điều kiện tiệm đích rà source | [Ảnh](screenshots/21-vendorRequests.png) |
| 23 | `/vendor-quote-submit` | Soạn báo giá · BAKERY_OWNER | Marketplace | Soạn/sửa/rút một báo giá mỗi tiệm/yêu cầu | Mở/layout/trạng thái; domain chặn báo giá trùng sau rút | [Ảnh](screenshots/22-vendorOffer.png) |
| 24 | `/vendor-profile` | Hồ sơ và vận hành · BAKERY_OWNER | Bakery | Chọn tiệm, sửa vận hành, membership, gửi hồ sơ local | Mở/layout/trạng thái; phạm vi OWNER rà source | [Ảnh](screenshots/23-vendorProfile.png) |
| 25 | `/vendor-revenue` | Thông tin doanh thu · BAKERY_OWNER | Bakery UI | Thông báo doanh thu chưa có API, liên kết đơn/gói | Mở/layout/trạng thái; không bịa số dư | [Ảnh](screenshots/24-vendorRevenue.png) |
| 26 | `/vendor-chat` | Tin nhắn của tiệm · BAKERY_OWNER | Chat | Hội thoại theo tiệm, thread, gửi/ảnh/xóa local | Mở/layout/trạng thái; dùng cùng Chat repository | [Ảnh](screenshots/25-vendorChat.png) |
| 27 | `/vendor-subscription` | Gói thuê của tiệm · BAKERY_OWNER / CUSTOMER onboarding demo | Subscription | Chọn gói, tạo đơn, tham chiếu/ảnh mẫu, lịch sử | Widget tạo đơn và gửi chứng từ vào PAYMENT_REVIEW | [Ảnh](screenshots/26-vendorSubscription.png) |
| 28 | `/admin-dashboard` | Tổng quan nền tảng · ADMIN | Admin UI | Hàng chờ, chỉ số fixture, điều hướng quản trị | Widget điều hướng đến quản lý người dùng | [Ảnh](screenshots/27-adminDashboard.png) |
| 29 | `/admin-users` | Người dùng · ADMIN | Identity UI | Tìm/lọc/phân trang, thêm/sửa/khóa/xóa local | Widget tạo user; API thật chưa có | [Ảnh](screenshots/28-adminUsers.png) |
| 30 | `/admin-vendors` | Duyệt tiệm bánh · ADMIN | Bakery | Lọc hồ sơ, xem, duyệt/bổ sung/tạm dừng local | Mở/layout/trạng thái; chuyển trạng thái rà source | [Ảnh](screenshots/29-adminBakeries.png) |
| 31 | `/admin-payments` | Duyệt thanh toán gói · ADMIN | Subscription | Hàng chờ chứng từ, duyệt/từ chối có lý do | Android duyệt local; domain từ chối phải có lý do | [Ảnh](screenshots/30-adminPayments.png) |
| 32 | `/admin-plans` | Quản lý gói · ADMIN | Subscription | Tạo/sửa gói, hạn mức, ngừng cung cấp | Mở/layout/trạng thái; đơn cũ giữ giá snapshot | [Ảnh](screenshots/31-adminPlans.png) |
| 33 | `/admin-orders` | Đơn trên nền tảng · ADMIN | Order | Danh sách/detail, timeline và state controls local | Mở/layout/trạng thái; chung state machine Order | [Ảnh](screenshots/32-adminOrders.png) |
| 34 | `/admin-moderation` | Kiểm duyệt · ADMIN | Cake AI / Order | Duyệt thiết kế, lý do từ chối, ẩn/hiện review | Mở/layout/trạng thái; quyết định local | [Ảnh](screenshots/33-adminModeration.png) |
| 35 | `/admin-revenue` | Doanh thu gói thuê · ADMIN | Subscription | Tổng giá trị gói PAID, đối chiếu theo gói | Mở/layout/trạng thái; không gồm doanh thu bánh | [Ảnh](screenshots/34-adminRevenue.png) |

## Cách đọc kết quả

`PASS` cho 35 route mở và render cùng các tình huống local trong automated tests; độ phủ layout không phải chứng nhận usability. Thao tác trọng tâm có widget/integration assertions như cột bằng chứng. Các đường còn lại được rà logic và trạng thái từ source, chưa có tự động hóa mọi nhánh. iOS runtime, TalkBack thủ công và hiệu năng release là `NOT VERIFIED`. Backend không thuộc phạm vi mobile UI này.

Guest mở chức năng cần tài khoản sẽ gặp trạng thái yêu cầu đúng persona. Bộ chọn Demo thay vai và xóa navigation stack. Đây là quyền local để xem UI, không phải lớp bảo mật. Phạm vi chủ tiệm được giới hạn bằng membership fixture và bộ chọn tiệm.
