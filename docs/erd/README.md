# ERD của MSS Bakery Platform

Bộ tài liệu gồm một Conceptual ERD tổng thể và bảy Logical ERD. Mỗi Logical
ERD tương ứng với một microservice và một database riêng.

## Danh sách sơ đồ

1. `00-conceptual-overall.mmd` - Conceptual ERD tổng thể
2. `01-identity-service-logical.mmd` - `identity_db`
3. `02-bakery-service-logical.mmd` - `bakery_db`
4. `03-marketplace-service-logical.mmd` - `marketplace_db`
5. `04-order-service-logical.mmd` - `order_db`
6. `05-chat-service-logical.mmd` - `chat_db`
7. `06-cake-ai-service-logical.mmd` - `cake_ai_db`
8. `07-subscription-service-logical.mmd` - `subscription_db`

## Import vào draw.io/diagrams.net

1. Mở draw.io và tạo một diagram mới.
2. Chọn **Arrange > Insert > Advanced > Mermaid**. Tùy phiên bản giao diện,
   mục này có thể nằm ở **Insert > Advanced > Mermaid**.
3. Mở file `.mmd` cần import, sao chép toàn bộ nội dung và dán vào hộp Mermaid.
4. Chọn chế độ tạo diagram/editable shapes nếu draw.io hiển thị lựa chọn này.
5. Nên đặt mỗi ERD trên một page riêng trong cùng một file draw.io.

## Quy ước kiến trúc

- `PK`, `FK`, `UK` lần lượt là primary key, foreign key và unique key.
- FK chỉ tồn tại giữa các bảng trong cùng một Logical ERD/database.
- Các cột có ghi chú `External ... reference` chỉ lưu ID của domain ở service
  khác; chúng không phải database foreign key.
- Các giá trị tiền tệ dùng `decimal`; khi hiện thực bằng PostgreSQL nên dùng
  `NUMERIC(12,2)` hoặc precision phù hợp.
- Ảnh được lưu trên MinIO/S3; database chỉ lưu `object_key` và metadata.
- Các bảng snapshot trong Order Service giữ nguyên dữ liệu tại thời điểm đặt
  hàng, kể cả khi profile, offer hoặc add-on ở service khác thay đổi về sau.
- Marketplace Service là nơi sở hữu việc chọn mẫu bánh thông qua
  `cake_requests.selected_design_id`. Cake AI Service chỉ sở hữu job và các mẫu
  đã tạo, tránh tạo hai source of truth cho cùng một lựa chọn.
- Bakery Service sở hữu catalog sản phẩm. Khách có thể mua trực tiếp sản phẩm
  có sẵn, dùng sản phẩm làm mẫu để gửi yêu cầu custom cho đúng tiệm hoặc tạo
  một yêu cầu custom mở để nhiều tiệm gửi offer.
- Order Service không lưu thanh toán giữa khách và tiệm. `order_source` phân
  biệt `DIRECT_CATALOG` và `ACCEPTED_OFFER`.
- Review thuộc về order, không thuộc trực tiếp Bakery Service. Chỉ khách sở hữu
  một order `COMPLETED` mới được tạo tối đa một `ORDER_REVIEWS` cho order đó.
  Khi cần hiển thị điểm của tiệm, hệ thống tổng hợp các review thông qua
  `customer_orders.bakery_id`.
- Subscription Service chỉ quản lý đơn mua gói và thanh toán giữa bakery với
  nền tảng; service này không theo dõi tiền mua bánh giữa khách và bakery.
- Subscription Service không tạo invoice/hóa đơn điện tử. `SUBSCRIPTION_ORDERS`
  chỉ là đơn đăng ký gói nội bộ; `BAKERY_PAYMENTS` ghi nhận chứng từ thanh toán
  để admin kiểm tra và xác nhận.
- Mỗi service nên có bộ Flyway migration và database credential riêng.

## Ba luồng đặt bánh

1. `DIRECT_CATALOG`: khách chọn product và các option có sẵn, sau đó tạo order
   trực tiếp. `cake_request_id` và `offer_id` trong order để trống.
2. `TARGETED_PRODUCT_CUSTOM`: khách chọn một product làm mẫu nhưng muốn sửa tự
   do. Cake request lưu `base_product_id` và `target_bakery_id`; chỉ bakery đó
   gửi offer, sau đó offer được chuyển thành order.
3. `OPEN_CUSTOM`: khách không chọn product/target bakery, mô tả mẫu bánh mong
   muốn và chờ nhiều bakery gửi offer.

## Kiểm tra quyền theo gói thuê

- Bakery Service phải hỏi Subscription Service trước khi publish product.
- Marketplace Service phải hỏi Subscription Service trước khi cho bakery gửi
  offer.
- Chỉ bakery có subscription `ACTIVE` và `current_period_end` còn hạn mới được
  hiển thị công khai trên platform.
- Nếu không dùng message broker, các kiểm tra này có thể gọi REST đồng bộ, đặt
  timeout ngắn và cache kết quả trong thời gian ngắn.

## Luồng đăng ký gói của bakery

1. Bakery chọn một `SUBSCRIPTION_PLAN` và tạo `SUBSCRIPTION_ORDER`.
2. Bakery chuyển khoản hoặc thanh toán theo phương thức nền tảng hỗ trợ.
3. Bakery gửi mã giao dịch và ảnh chứng từ vào `BAKERY_PAYMENTS`.
4. Admin kiểm tra payment rồi chuyển trạng thái thành `APPROVED` hoặc
   `REJECTED`.
5. Khi payment được duyệt, order chuyển thành `COMPLETED` và hệ thống tạo một
   `BAKERY_SUBSCRIPTION` có thời hạn tương ứng với gói đã mua.

Các bảng trên là dữ liệu vận hành nội bộ, không thay thế hóa đơn điện tử hoặc
chứng từ thuế. Nếu sau này nền tảng phải xuất hóa đơn hợp pháp, nên tích hợp
với một hệ thống hóa đơn điện tử riêng.

## Ràng buộc kết hợp cần tạo trong migration

Mermaid ERD không biểu diễn rõ mọi composite unique constraint. Khi tạo Flyway
migration, cần bổ sung tối thiểu các ràng buộc sau:

- `bakery_members (bakery_id, user_id)` là duy nhất.
- `business_hours (bakery_id, day_of_week)` là duy nhất.
- `product_categories (bakery_id, slug)` là duy nhất.
- `products (bakery_id, slug)` là duy nhất.
- Mỗi product chỉ có tối đa một `product_images.is_primary = true`.
- `user_addresses` chỉ có tối đa một địa chỉ mặc định cho mỗi user.
- `offers (cake_request_id, bakery_id)` là duy nhất nếu mỗi tiệm chỉ được gửi
  một offer đang hoạt động cho một request.
- `conversation_participants (conversation_id, user_id)` là duy nhất.
- `conversations (cake_request_id, bakery_id)` là duy nhất trong giai đoạn
  báo giá.
- `prompt_revisions (generation_job_id, revision_number)` là duy nhất.
- `order_reviews.order_id` vừa là PK vừa là FK, bảo đảm mỗi order chỉ có tối đa
  một review.
- `subscription_orders.order_number` là duy nhất.
- `bakery_subscriptions.source_order_id` là duy nhất; một order chỉ kích hoạt
  tối đa một kỳ subscription.
- Mỗi bakery chỉ có tối đa một `bakery_subscriptions.status = ACTIVE`.
- Mỗi cake request chỉ có tối đa một offer `ACCEPTED`; ràng buộc này nên được
  bảo vệ bằng transaction và partial unique index trong PostgreSQL.

## Lưu ý cho báo cáo

Conceptual ERD thể hiện quan hệ nghiệp vụ xuyên toàn hệ thống. Các đường nối
trong sơ đồ này không đại diện cho foreign key xuyên database. Bảy Logical ERD
mới là mô hình dữ liệu mà từng service sở hữu và triển khai.
