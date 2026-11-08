# Ảnh chạy thật trên Android

Ngày chụp 07/11/2026. 35 ảnh canonical và 6 ảnh trạng thái/hành trình được xuất từ Flutter integration test trên emulator. Ảnh `android-installed-home.png` là screenshot Android sau khi cài lại APK app thường và khởi chạy `lib/main.dart`. Không dùng artwork dựng sẵn làm bằng chứng runtime.

PNG integration 720×1280; viewport logical khoảng 411×731. Device/Android/APK metadata nằm trong [runtime evidence](../evidence/android-installed-runtime.json); SHA-256 từng ảnh trong [screenshots.json](../evidence/screenshots.json).

## Guest / Public

- [SweetCake](00-home.png) — `/`
- [Khám phá bánh](01-explore.png) — `/explore`
- [Chi tiết bánh](02-product.png) — `/product-detail`
- [Tiệm bánh đối tác](03-stores.png) — `/stores`
- [Chi tiết tiệm](04-bakery.png) — `/bakery-detail`
- [Gói đối tác](05-plans.png) — `/subscription-plans`
- [Chào mừng đến SweetCake](06-login.png) — `/login`

## Customer

- [Giỏ bánh của bạn](07-cart.png) — `/cart`
- [Tài khoản của tôi](08-profile.png) — `/profile`
- [Đơn bánh của tôi](09-tracking.png) — `/tracking`
- [Thông tin thanh toán](10-payment.png) — `/payment`
- [Xưởng ý tưởng](11-studio.png) — `/ai-studio`
- [Yêu cầu của tôi](12-requests.png) — `/rfqs`
- [Tạo yêu cầu bánh](13-requestNew.png) — `/rfq-new`
- [Chi tiết yêu cầu](14-requestDetail.png) — `/request-detail`
- [So sánh báo giá](15-comparison.png) — `/bidding`
- [Chi tiết báo giá](16-offer.png) — `/baker-quote`
- [Tin nhắn](17-chat.png) — `/chat`

## Bakery Owner

- [Tổng quan tiệm](18-vendorDashboard.png) — `/vendor-dashboard`
- [Catalog của tiệm](19-vendorCatalog.png) — `/vendor-menu`
- [Đơn của tiệm](20-vendorOrders.png) — `/vendor-orders`
- [Yêu cầu khả dụng](21-vendorRequests.png) — `/vendor-rfq`
- [Soạn báo giá](22-vendorOffer.png) — `/vendor-quote-submit`
- [Hồ sơ và vận hành](23-vendorProfile.png) — `/vendor-profile`
- [Thông tin doanh thu](24-vendorRevenue.png) — `/vendor-revenue`
- [Tin nhắn của tiệm](25-vendorChat.png) — `/vendor-chat`
- [Gói thuê của tiệm](26-vendorSubscription.png) — `/vendor-subscription`

## Admin

- [Tổng quan nền tảng](27-adminDashboard.png) — `/admin-dashboard`
- [Người dùng](28-adminUsers.png) — `/admin-users`
- [Duyệt tiệm bánh](29-adminBakeries.png) — `/admin-vendors`
- [Duyệt thanh toán gói](30-adminPayments.png) — `/admin-payments`
- [Quản lý gói](31-adminPlans.png) — `/admin-plans`
- [Đơn trên nền tảng](32-adminOrders.png) — `/admin-orders`
- [Kiểm duyệt](33-adminModeration.png) — `/admin-moderation`
- [Doanh thu gói thuê](34-adminRevenue.png) — `/admin-revenue`

## Trạng thái và hành trình bổ sung

- [35-cart-preview.png](35-cart-preview.png)
- [36-chat-thread.png](36-chat-thread.png)
- [37-request-saved.png](37-request-saved.png)
- [38-owner-order-detail.png](38-owner-order-detail.png)
- [39-admin-reviewed.png](39-admin-reviewed.png)
- [40-error-retry.png](40-error-retry.png)
- [android-installed-home.png](android-installed-home.png)

Các ảnh là lát cắt tại thời điểm chụp, có thể cần cuộn để thấy nút phía dưới. Không chứng minh mọi nhánh thao tác, iOS, TalkBack hoặc hiệu năng release.
