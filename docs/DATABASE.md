# Thiết kế cơ sở dữ liệu

> Logical database design cho MSS Bakery Platform sử dụng PostgreSQL.
> Cập nhật tài liệu này mỗi khi Mermaid ERD hoặc Flyway migration thay đổi.

---

## Tổng quan kiến trúc

Hệ thống áp dụng mô hình **database-per-service**. Mỗi microservice sở hữu dữ
liệu của mình và không được đọc trực tiếp database của service khác.

| Microservice | Database | Số bảng | Mermaid ERD | Flyway schema |
|---|---:|---:|---|---|
| Identity Service | `identity_db` | 6 | [Xem ERD](erd/01-identity-service-logical.mmd) | [V1](../database/postgresql/identity-service/V1__init_schema.sql) |
| Bakery Service | `bakery_db` | 11 | [Xem ERD](erd/02-bakery-service-logical.mmd) | [V1](../database/postgresql/bakery-service/V1__init_schema.sql) |
| Marketplace Service | `marketplace_db` | 8 | [Xem ERD](erd/03-marketplace-service-logical.mmd) | [V1](../database/postgresql/marketplace-service/V1__init_schema.sql) |
| Order Service | `order_db` | 5 | [Xem ERD](erd/04-order-service-logical.mmd) | [V1](../database/postgresql/order-service/V1__init_schema.sql) |
| Chat Service | `chat_db` | 5 | [Xem ERD](erd/05-chat-service-logical.mmd) | [V1](../database/postgresql/chat-service/V1__init_schema.sql) |
| Cake AI Service | `cake_ai_db` | 4 | [Xem ERD](erd/06-cake-ai-service-logical.mmd) | [V1](../database/postgresql/cake-ai-service/V1__init_schema.sql) |
| Subscription Service | `subscription_db` | 5 | [Xem ERD](erd/07-subscription-service-logical.mmd) | [V1](../database/postgresql/subscription-service/V1__init_schema.sql) |

**Tổng cộng: 44 bảng trong 7 database.**

Conceptual ERD toàn hệ thống: [00-conceptual-overall.mmd](erd/00-conceptual-overall.mmd).

### Quy tắc tham chiếu xuyên service

- Chỉ tạo foreign key giữa các bảng trong cùng database.
- Các cột như `customer_id`, `bakery_id`, `cake_request_id` hoặc `order_id`
  được ghi là **external reference** khi đối tượng gốc nằm ở service khác.
- External reference chỉ được đánh index; tính hợp lệ được kiểm tra bằng REST
  API của service sở hữu dữ liệu.
- Không thực hiện distributed join hoặc distributed transaction ở database.
- Dữ liệu cần giữ nguyên theo lịch sử phải được lưu dưới dạng snapshot.

---

## Identity Service — `identity_db`

Quản lý tài khoản, hồ sơ khách hàng, địa chỉ, role và refresh token.

### Tables

| Table | Primary key | Columns chính | Mục đích |
|---|---|---|---|
| `users` | `id` | `email`, `password_hash`, `display_name`, `phone_number`, `status`, `email_verified`, timestamps, `version` | Tài khoản đăng nhập trung tâm |
| `customer_profiles` | `user_id` | `date_of_birth`, `avatar_object_key`, `preferred_language`, `updated_at` | Hồ sơ mở rộng tùy chọn của khách hàng |
| `user_addresses` | `id` | `user_id`, người nhận, địa chỉ hành chính, tọa độ, `is_default`, timestamps | Danh sách địa chỉ khách lưu sẵn |
| `roles` | `id` | `code`, `description` | Danh mục role hệ thống |
| `user_roles` | `(user_id, role_id)` | `assigned_at` | Bảng nối nhiều-nhiều giữa user và role |
| `refresh_tokens` | `id` | `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at` | Quản lý phiên đăng nhập và token rotation |

### Relationships

| Relationship | Type | Owner side | Join column |
|---|---|---|---|
| User → CustomerProfile | OneToOne | `customer_profiles` | `user_id` |
| User → UserAddress | OneToMany | `user_addresses` | `user_id` |
| User ↔ Role | ManyToMany | `user_roles` | `user_id`, `role_id` |
| User → RefreshToken | OneToMany | `refresh_tokens` | `user_id` |

### Index và ràng buộc đáng chú ý

- `users.email` là unique.
- Mỗi user chỉ có tối đa một `user_addresses.is_default = true`.
- Refresh token chỉ lưu hash; không lưu raw token.
- Cleanup job nên xóa token hết hạn định kỳ.

---

## Bakery Service — `bakery_db`

Quản lý tiệm bánh, thành viên, khu vực giao hàng, phụ kiện và catalog sản phẩm.

### Tables

| Table | Primary key | Columns chính | Mục đích |
|---|---|---|---|
| `bakeries` | `id` | `name`, thông tin liên hệ, ảnh, `status`, timestamps, `version` | Hồ sơ chính của tiệm bánh |
| `bakery_members` | `id` | `bakery_id`, `user_id`*, `member_role`, `status`, `joined_at` | User tham gia quản lý/vận hành tiệm |
| `bakery_addresses` | `id` | `bakery_id`, địa chỉ, tọa độ, `is_primary`, timestamps | Chi nhánh hoặc địa điểm của tiệm |
| `service_areas` | `id` | `bakery_id`, `city`, `district`, `delivery_fee`, `minimum_order`, `active` | Khu vực tiệm nhận giao bánh |
| `business_hours` | `id` | `bakery_id`, `day_of_week`, giờ mở/đóng, `closed` | Lịch hoạt động trong tuần |
| `add_ons` | `id` | `bakery_id`, `name`, `category`, `price`, ảnh, `active`, timestamps, `version` | Nến, dĩa, topper và dịch vụ bổ sung |
| `product_categories` | `id` | `bakery_id`, `name`, `slug`, thứ tự, `active`, timestamps | Danh mục sản phẩm riêng của tiệm |
| `products` | `id` | `bakery_id`, `category_id`, tên, giá, trạng thái, khả năng custom, timestamps, `version` | Sản phẩm bánh có sẵn của tiệm |
| `product_images` | `id` | `product_id`, `object_key`, `media_type`, thứ tự, `is_primary` | Ảnh sản phẩm lưu trên object storage |
| `product_option_groups` | `id` | `product_id`, `name`, `selection_type`, min/max lựa chọn | Nhóm lựa chọn như size hoặc vị bánh |
| `product_option_values` | `id` | `option_group_id`, `name`, mô tả, `price_adjustment`, `active` | Giá trị cụ thể trong một nhóm lựa chọn |

`user_id` trong `bakery_members` là external reference tới Identity Service.

### Relationships

| Relationship | Type | Owner side | Join column |
|---|---|---|---|
| Bakery → BakeryMember | OneToMany | `bakery_members` | `bakery_id` |
| Bakery → BakeryAddress | OneToMany | `bakery_addresses` | `bakery_id` |
| Bakery → ServiceArea | OneToMany | `service_areas` | `bakery_id` |
| Bakery → BusinessHour | OneToMany | `business_hours` | `bakery_id` |
| Bakery → AddOn | OneToMany | `add_ons` | `bakery_id` |
| Bakery → ProductCategory | OneToMany | `product_categories` | `bakery_id` |
| Bakery → Product | OneToMany | `products` | `bakery_id` |
| ProductCategory → Product | OneToMany | `products` | `category_id` |
| Product → ProductImage | OneToMany | `product_images` | `product_id` |
| Product → ProductOptionGroup | OneToMany | `product_option_groups` | `product_id` |
| ProductOptionGroup → ProductOptionValue | OneToMany | `product_option_values` | `option_group_id` |

### Index và ràng buộc đáng chú ý

- Thành viên là duy nhất theo `(bakery_id, user_id)`.
- Mỗi tiệm có tối đa một địa chỉ chính.
- `products.slug` và `product_categories.slug` là duy nhất trong phạm vi tiệm.
- Mỗi sản phẩm có tối đa một ảnh chính.
- Xóa category chỉ đặt `products.category_id` về `NULL`; không xóa sản phẩm.

---

## Marketplace Service — `marketplace_db`

Quản lý yêu cầu custom bánh và offer của các tiệm.

### Tables

| Table | Primary key | Columns chính | Mục đích |
|---|---|---|---|
| `cake_requests` | `id` | các external ID, `request_type`, nội dung, ngân sách, giao hàng, trạng thái, timestamps, `version` | Bài đăng yêu cầu làm bánh |
| `request_images` | `id` | `cake_request_id`, `object_key`, `media_type`, thứ tự | Ảnh tham khảo của yêu cầu |
| `cake_preferences` | `cake_request_id` | size, shape, flavor, filling, frosting, màu, ghi chú, `extra_options` | Cấu hình custom chi tiết |
| `request_option_selections` | `id` | `cake_request_id`, external option IDs, snapshot tên, `quantity` | Option sản phẩm được chọn làm nền custom |
| `request_status_history` | `id` | `cake_request_id`, trạng thái cũ/mới, `changed_by`*, lý do, thời gian | Audit trạng thái request |
| `offers` | `id` | `cake_request_id`, `bakery_id`*, giá, thời gian, trạng thái, timestamps, `version` | Báo giá của một tiệm |
| `offer_items` | `id` | `offer_id`, `add_on_id`*, snapshot, số lượng, đơn giá, thành tiền | Phụ kiện/dịch vụ kèm offer |
| `offer_status_history` | `id` | `offer_id`, trạng thái cũ/mới, `changed_by`*, lý do, thời gian | Audit trạng thái offer |

Dấu `*` biểu thị external reference, không phải database foreign key.

### Relationships

| Relationship | Type | Owner side | Join column |
|---|---|---|---|
| CakeRequest → RequestImage | OneToMany | `request_images` | `cake_request_id` |
| CakeRequest → CakePreference | OneToOne | `cake_preferences` | `cake_request_id` |
| CakeRequest → RequestOptionSelection | OneToMany | `request_option_selections` | `cake_request_id` |
| CakeRequest → RequestStatusHistory | OneToMany | `request_status_history` | `cake_request_id` |
| CakeRequest → Offer | OneToMany | `offers` | `cake_request_id` |
| Offer → OfferItem | OneToMany | `offer_items` | `offer_id` |
| Offer → OfferStatusHistory | OneToMany | `offer_status_history` | `offer_id` |

### Quy tắc nghiệp vụ

- `OPEN_CUSTOM`: không có `target_bakery_id` và `base_product_id`.
- `TARGETED_PRODUCT_CUSTOM`: bắt buộc có cả target bakery và base product.
- Một bakery chỉ có một offer cho một request.
- Một request chỉ có tối đa một offer ở trạng thái `ACCEPTED`.
- Tổng offer phải bằng giá bánh + phí giao + tổng add-on.

---

## Order Service — `order_db`

Quản lý đơn mua trực tiếp hoặc đơn hình thành từ offer. Service này không theo
dõi thanh toán giữa khách và tiệm.

### Tables

| Table | Primary key | Columns chính | Mục đích |
|---|---|---|---|
| `customer_orders` | `id` | số đơn, external IDs, `order_source`, snapshot hai bên, số tiền, trạng thái, timestamps, `version` | Aggregate root của đơn bánh |
| `order_items` | `id` | `order_id`, external source IDs, loại item, snapshot, cấu hình JSONB, giá và số lượng | Các hạng mục trong đơn |
| `delivery_address_snapshots` | `order_id` | người nhận, địa chỉ, tọa độ, ghi chú | Địa chỉ bất biến tại thời điểm đặt |
| `order_status_history` | `id` | `order_id`, trạng thái cũ/mới, `changed_by`*, ghi chú, thời gian | Audit tiến độ đơn |
| `order_reviews` | `order_id` | `customer_id`*, `rating`, `comment`, `status`, timestamps, `version` | Review dựa trên order đã hoàn thành |

### Relationships

| Relationship | Type | Owner side | Join column |
|---|---|---|---|
| CustomerOrder → OrderItem | OneToMany | `order_items` | `order_id` |
| CustomerOrder → DeliveryAddressSnapshot | OneToOne | `delivery_address_snapshots` | `order_id` |
| CustomerOrder → OrderStatusHistory | OneToMany | `order_status_history` | `order_id` |
| CustomerOrder → OrderReview | OneToOne tùy chọn | `order_reviews` | `order_id` |

### Quy tắc nghiệp vụ

- `DIRECT_CATALOG`: `cake_request_id` và `offer_id` phải `NULL`.
- `ACCEPTED_OFFER`: bắt buộc có `cake_request_id` và `offer_id`.
- Một offer chỉ sinh tối đa một order.
- Mỗi order có tối đa một review, rating từ 1 đến 5.
- Chỉ customer của order `COMPLETED` được tạo review; kiểm tra này nằm ở service.

---

## Chat Service — `chat_db`

Quản lý hội thoại, participant, tin nhắn, file đính kèm và trạng thái đọc.

### Tables

| Table | Primary key | Columns chính | Mục đích |
|---|---|---|---|
| `conversations` | `id` | external request/order/customer/bakery IDs, trạng thái, timestamps, `version` | Một cuộc hội thoại khách-tiệm |
| `conversation_participants` | `id` | `conversation_id`, `user_id`*, loại participant, thời gian tham gia/đọc | Thành viên cuộc hội thoại |
| `messages` | `id` | `conversation_id`, `sender_participant_id`, `client_message_id`, loại, nội dung, timestamps | Tin nhắn trong cuộc hội thoại |
| `message_attachments` | `id` | `message_id`, object key, tên file, media type, dung lượng, thứ tự | Metadata file đính kèm |
| `message_receipts` | `(message_id, participant_id)` | `delivered_at`, `read_at` | Trạng thái nhận và đọc theo participant |

### Relationships

| Relationship | Type | Owner side | Join column |
|---|---|---|---|
| Conversation → Participant | OneToMany | `conversation_participants` | `conversation_id` |
| Conversation → Message | OneToMany | `messages` | `conversation_id` |
| Participant → Message | OneToMany | `messages` | `sender_participant_id` |
| Message → Attachment | OneToMany | `message_attachments` | `message_id` |
| Message ↔ Participant | ManyToMany có thuộc tính | `message_receipts` | `message_id`, `participant_id` |

`client_message_id` là idempotency key do client sinh, giúp retry mà không tạo
tin nhắn trùng.

---

## Cake AI Service — `cake_ai_db`

Quản lý job tạo ảnh, ảnh nguồn, lịch sử prompt và thiết kế AI sinh ra.

### Tables

| Table | Primary key | Columns chính | Mục đích |
|---|---|---|---|
| `generation_jobs` | `id` | external customer/request IDs, trạng thái, model, tham số JSONB, lỗi, timestamps, `version` | Một phiên tạo mẫu bánh bằng AI |
| `source_images` | `id` | `generation_job_id`, object key, media type, thứ tự, thời gian | Ảnh tham khảo của job |
| `prompt_revisions` | `id` | `generation_job_id`, số revision, prompt, negative prompt, `created_by`* | Các phiên bản prompt của job |
| `generated_designs` | `id` | job, prompt revision, image keys, seed, metadata JSONB, moderation status | Kết quả ảnh do AI tạo |

### Relationships

| Relationship | Type | Owner side | Join column |
|---|---|---|---|
| GenerationJob → SourceImage | OneToMany | `source_images` | `generation_job_id` |
| GenerationJob → PromptRevision | OneToMany | `prompt_revisions` | `generation_job_id` |
| GenerationJob → GeneratedDesign | OneToMany | `generated_designs` | `generation_job_id` |
| PromptRevision → GeneratedDesign | OneToMany | `generated_designs` | `prompt_revision_id` |

Composite foreign key bảo đảm design và prompt revision luôn thuộc cùng một
generation job. Mẫu khách chọn được lưu tại Marketplace Service bằng
`cake_requests.selected_design_id`.

---

## Subscription Service — `subscription_db`

Quản lý gói thuê của bakery, đơn đăng ký gói và payment do admin xác nhận.
Không sử dụng invoice và không theo dõi tiền mua bánh giữa khách với tiệm.

### Tables

| Table | Primary key | Columns chính | Mục đích |
|---|---|---|---|
| `subscription_plans` | `id` | `code`, tên, giá tháng, chu kỳ, trạng thái, timestamps, `version` | Gói thuê nền tảng |
| `plan_features` | `(plan_id, feature_code)` | `feature_value` | Quyền lợi/giới hạn linh hoạt của gói |
| `subscription_orders` | `id` | số đơn, external bakery/user IDs, plan, snapshot, số tiền, trạng thái, timestamps, `version` | Đơn bakery đăng ký hoặc gia hạn gói |
| `bakery_payments` | `id` | order, người gửi, phương thức, mã/ảnh chứng từ, số tiền, trạng thái, admin duyệt | Ghi nhận payment bakery gửi nền tảng |
| `bakery_subscriptions` | `id` | bakery*, plan, source order, trạng thái, thời hạn, timestamps, `version` | Một kỳ sử dụng gói đã được cấp |

### Relationships

| Relationship | Type | Owner side | Join column |
|---|---|---|---|
| SubscriptionPlan → PlanFeature | OneToMany | `plan_features` | `plan_id` |
| SubscriptionPlan → SubscriptionOrder | OneToMany | `subscription_orders` | `plan_id` |
| SubscriptionOrder → BakeryPayment | OneToMany | `bakery_payments` | `subscription_order_id` |
| SubscriptionOrder → BakerySubscription | OneToOne tùy chọn | `bakery_subscriptions` | `source_order_id` |
| SubscriptionPlan → BakerySubscription | OneToMany | `bakery_subscriptions` | `plan_id` |

### Quy tắc nghiệp vụ

1. Bakery tạo order ở trạng thái `PENDING_PAYMENT`.
2. Bakery gửi mã giao dịch hoặc ảnh chứng từ.
3. Admin duyệt payment thành `APPROVED` hoặc `REJECTED`.
4. Payment được duyệt làm order thành `COMPLETED`.
5. Mỗi order hoàn thành chỉ kích hoạt tối đa một kỳ subscription.
6. Mỗi bakery chỉ có tối đa một kỳ `ACTIVE` tại một thời điểm.

Các bảng này là dữ liệu vận hành, không thay thế hóa đơn điện tử hoặc chứng từ
thuế hợp pháp.

---

## External references giữa các database

| Consumer service | Column | Owner service | Resource |
|---|---|---|---|
| Bakery | `bakery_members.user_id` | Identity | User |
| Marketplace | `cake_requests.customer_id` | Identity | User |
| Marketplace | `cake_requests.target_bakery_id` | Bakery | Bakery |
| Marketplace | `cake_requests.base_product_id` | Bakery | Product |
| Marketplace | `cake_requests.selected_design_id` | Cake AI | GeneratedDesign |
| Marketplace | `offers.bakery_id` | Bakery | Bakery |
| Marketplace | `offer_items.add_on_id` | Bakery | AddOn |
| Order | `customer_orders.customer_id` | Identity | User |
| Order | `customer_orders.bakery_id` | Bakery | Bakery |
| Order | `customer_orders.cake_request_id`, `offer_id` | Marketplace | CakeRequest, Offer |
| Order | `order_items.source_product_id` | Bakery | Product |
| Order | `order_items.source_offer_item_id` | Marketplace | OfferItem |
| Chat | request/order/customer/bakery IDs | Các service tương ứng | Conversation context |
| Cake AI | customer/request IDs | Identity, Marketplace | User, CakeRequest |
| Subscription | bakery/user/admin IDs | Bakery, Identity | Bakery, User |

---

## JPA mapping notes

- Dùng `UUID` cho mọi aggregate ID và `BigDecimal` cho tiền.
- `TIMESTAMPTZ` nên map sang `Instant` hoặc `OffsetDateTime`.
- Các trạng thái map bằng `@Enumerated(EnumType.STRING)`, không dùng ordinal.
- Các quan hệ `@ManyToOne` và `@OneToMany` trong cùng service dùng
  `FetchType.LAZY`.
- External reference chỉ là trường `UUID`; không khai báo `@ManyToOne` sang
  entity thuộc microservice khác.
- Trường `version` map bằng `@Version` để optimistic locking.
- `JSONB` có thể map bằng Hibernate 7:

```java
@JdbcTypeCode(SqlTypes.JSON)
@Column(columnDefinition = "jsonb")
private Map<String, Object> configurationSnapshot;
```

- Không serialize trực tiếp entity hai chiều; dùng DTO để tránh vòng lặp JSON.
- Snapshot trong order và offer không tự đồng bộ ngược với dữ liệu nguồn.

---

## Sample data

- Identity seed tạo bốn role: `CUSTOMER`, `BAKERY_OWNER`, `BAKERY_STAFF`,
  `ADMIN`.
- Subscription seed tạo ba gói mẫu: `BASIC`, `PRO`, `PREMIUM` và các feature
  `MAX_PRODUCTS`, `MAX_MONTHLY_OFFERS`, `FEATURED_LISTING`.
- Không seed user, bakery, order hoặc payment giả vào migration production.

---

## Migration notes

- **Tổng số bảng: 44**, chia trong 7 database.
- Schema được quản lý bằng Flyway; production dùng `ddl-auto: validate`.
- File tạo database: [00_create_databases.sql](../database/postgresql/00_create_databases.sql).
- Hướng dẫn chạy: [database/postgresql/README.md](../database/postgresql/README.md).
- `V1__init_schema.sql` chỉ chứa DDL của đúng một service.
- `V2__seed_reference_data.sql` chỉ seed dữ liệu danh mục ổn định.
- Không sửa migration đã chạy ở môi trường dùng chung; tạo `V3`, `V4`, ... cho
  mọi thay đổi tiếp theo.
