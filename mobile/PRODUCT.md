# SweetCake Mobile — bối cảnh sản phẩm

<!-- impeccable:product-schema 1 -->

## Platform

`adaptive`: ứng dụng Flutter Android/iOS, prototype UI hoàn toàn local theo yêu cầu ngày 2026-11-07. Hình ảnh SweetCake được kế thừa từ Web. Material navigation trên Android, hành vi back/inset/reduced motion phù hợp iOS; chưa có môi trường Xcode để xác minh iOS runtime.

## Người dùng và công việc

Khách khám phá bánh/tiệm, cấu hình bánh, xem giỏ/đơn, so sánh RFQ và trò chuyện. Chủ tiệm quản lý catalog, vận hành, đơn, RFQ/offer, hội thoại và gói thuê. Admin duyệt tiệm/payment gói, quản lý plan/order và moderation. Có persona Guest, CUSTOMER, BAKERY_OWNER, ADMIN để xem demo; không phải xác thực thật.

## Ràng buộc đã được người dùng xác nhận

Chỉ sửa implementation trong `mobile`, tài liệu trong `docs`. Không sửa Backend/Web, root config hoặc skill. Không networking, JWT, database, provider AI, payment hoặc gửi tin thật. Tất cả mutation dùng fixture local, phản hồi phải ghi rõ demo. Không dựng escrow/payout mua bánh. Nền tảng chỉ theo dõi payment subscription của bakery.

## Thành công

Mọi capability của 35 route Web có UI native tương ứng; navigation, form validation, local search/filter/cart/RFQ/offer/chat/catalog/review hoạt động. Có loading/empty/error/retry và kiểm tra viewport nhỏ/text scale. Build Android, kiểm thử widget, chạy emulator và chụp ảnh thật nếu công cụ khả dụng. Không báo iOS hoặc Backend integration PASS khi chưa thực hiện.

## Nguồn

`../design-web.md`, source `../frontend`, docs/audit và ADR hiện tại. Yêu cầu người dùng chốt visual world; không cần chọn palette/concept mới. Các vấn đề API trong audit là bối cảnh, không sửa hoặc giả là đã giải quyết.
