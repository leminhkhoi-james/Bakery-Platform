# Tham chiếu contract Backend cho Flutter

Đây là tài liệu chuẩn bị tích hợp, **không có thay đổi Dart, model, repository, UI hoặc API adapter trong mobile**. Đối chiếu35 màn hình hiện hữu theo inventory đã có; toàn bộ thao tác demo vẫn local. Contract nguồn tại baseline addfd774, không lấy mock data mobile làm bằng chứng Backend.

## Mức độ sẵn sàng

97/113 API đã có HTTP2xx PASS;104/113 đã chạy ít nhất1 case (gồm negative). Chưa đủ để bật mọi user flow mobile: Gateway chưa route, public address/profile thiếu, direct order422, chat listSQL lỗi,9AI compile blocked, Firebase chưa cấu hình. Flow accept offer/subscription/catalog đã chạy nhưng fixture address/admin được seed trong DB audit, không đại diện cho việc mobile có API quản lý address/admin user.

## Quy ước chung


| Chủ đề | Contract cần giữ |
|---|---|
| Base URL | Hiện audit gọi thẳng từng service loopback18091/92/93/94/96/97. Đây là host URL, Android emulator không dùng127.0.0.1 của máy host làm chính nó. Chưa chọn base URL production/Gateway chưa có forwarding. |
| Authentication | Bearer access RS256, refresh opaque HttpOnly cookie refresh_token, path/api/v1/auth. Token response gồm accessToken/tokenType/expiresInSeconds; không có refresh token JSON. Native cần cookie jar/session storage an toàn trong nhiệm vụ riêng. |
| Role vs membership | JWT có thể CUSTOMER+BAKERY_OWNER; owner kiểm membership bakery ACTIVE/OWNER. Onboarding chỉ CUSTOMER; lấy JWT mới sau grant. Demo persona không thay xác thực. |
| Envelope | Public đa số ApiResponse(statusCode,message,data,timestamp); internal raw DTO/Map hoặc envelope tùy endpoint.204 body rỗng; không parse JSON bắt buộc mọi response. |
| Dates | ISO8601 Instant UTC; neededAt/requestedDeliveryAt tương lai. Không gửi ngày locale dd/MM/yyyy vào Instant. Business hours dùng LocalTime, dayOfWeek1..7. |
| Money | BigDecimal, thường NUMERIC12,2 và VND. Giữ decimal semantics, không dùng double làm nguồn quyết định total; quote/snapshot server là chuẩn. |
| Paging | Đa số page1,size20,max100; AI page0/content; chat before cursor newest first. Xem schema chính xác từng endpoint. |
| Mutation | PATCH kiểu DTO đa phần null=không đổi; Marketplace patch là JSON object trực tiếp/whitelist. PUT operations/options là replace, phải gửi đủ danh sách theo contract. |
| Idempotency | Subscription/direct-order dùng UUID header; public accept dùng1..128ký tự allowed regex, internal accept key khác và không dành mobile; Chat clientMessageId UUID. Retry giữ key và payload; đổi payload tạo command mới. |
| Multipart | metadata JSON đúng MIMEapplication/json; filename và contentType hợp byte file. Bakery tối đa5MiB; Marketplace10MiB và10files/upload; Chat5files×10MiB; AI5files×10MiB; proof10MiB. |
| Errors | 401→session strategy;403→quyền nhưng biết Chat có error masking;409→state/key conflict và refetch;422→business invalid;503→dependency unavailable. Không tựretry mọi4xx. |
| Media | Object keys ở DB, signed URL có expiry; refetch để lấy URL mới. Không lưu URL tạm như asset cố định. Không gửi service storage/provider secrets vào APK/IPA. |


## Mapping35 màn hình hiện tại


| # | Route UI | Màn hình/vai | API ứng dụng liên quan | Giới hạn/điều chỉnh contract |
|---|---|---|---|---|
| 1 | / | SweetCake · Guest / mọi vai | [BKR-004](BACKEND_API_DETAILED_SPECIFICATION_VI.md#bkr-004), [BKR-034](BACKEND_API_DETAILED_SPECIFICATION_VI.md#bkr-034) | Sẵn sàng read API; Gateway chưa route |
| 2 | /explore | Khám phá bánh · Guest / mọi vai | [BKR-034](BACKEND_API_DETAILED_SPECIFICATION_VI.md#bkr-034) | Read/paging/filter; không gửi display fixture IDs |
| 3 | /product-detail | Chi tiết bánh · Guest / mọi vai | [BKR-035](BACKEND_API_DETAILED_SPECIFICATION_VI.md#bkr-035) | Read sẵn; direct order ORD-003 bị422 |
| 4 | /stores | Tiệm bánh đối tác · Guest / mọi vai | [BKR-004](BACKEND_API_DETAILED_SPECIFICATION_VI.md#bkr-004) | Read/filter; không có geospatial search suy diễn |
| 5 | /bakery-detail | Chi tiết tiệm · Guest / mọi vai | [BKR-008](BACKEND_API_DETAILED_SPECIFICATION_VI.md#bkr-008), [BKR-034](BACKEND_API_DETAILED_SPECIFICATION_VI.md#bkr-034) | Read; chat cần RFQ context, không mở chat tùy bakery trống |
| 6 | /subscription-plans | Gói đối tác · Guest / mọi vai | [SUB-013](BACKEND_API_DETAILED_SPECIFICATION_VI.md#sub-013), [SUB-015](BACKEND_API_DETAILED_SPECIFICATION_VI.md#sub-015) | Gói ACTIVE, dùng giá/features thật |
| 7 | /login | Chào mừng đến SweetCake · Guest / mọi vai | [IDN-006](BACKEND_API_DETAILED_SPECIFICATION_VI.md#idn-006), [IDN-002](BACKEND_API_DETAILED_SPECIFICATION_VI.md#idn-002), [IDN-004](BACKEND_API_DETAILED_SPECIFICATION_VI.md#idn-004), [IDN-005](BACKEND_API_DETAILED_SPECIFICATION_VI.md#idn-005), [IDN-003](BACKEND_API_DETAILED_SPECIFICATION_VI.md#idn-003) | Cookie/session adapter; quên mật khẩu chưa có API |
| 8 | /cart | Giỏ bánh của bạn · CUSTOMER / Guest | [BKR-035](BACKEND_API_DETAILED_SPECIFICATION_VI.md#bkr-035), [ORD-003](BACKEND_API_DETAILED_SPECIFICATION_VI.md#ord-003) | Cart local; chưa có APIcart/multibakery checkout, direct order blocked |
| 9 | /profile | Tài khoản của tôi · CUSTOMER | [IDN-004](BACKEND_API_DETAILED_SPECIFICATION_VI.md#idn-004) | Chỉ read me; sửa profile/address chưa có public API |
| 10 | /tracking | Đơn bánh của tôi · CUSTOMER | [ORD-002](BACKEND_API_DETAILED_SPECIFICATION_VI.md#ord-002), [ORD-004](BACKEND_API_DETAILED_SPECIFICATION_VI.md#ord-004), [ORD-008](BACKEND_API_DETAILED_SPECIFICATION_VI.md#ord-008), [ORD-007](BACKEND_API_DETAILED_SPECIFICATION_VI.md#ord-007), [ORD-006](BACKEND_API_DETAILED_SPECIFICATION_VI.md#ord-006), [ORD-005](BACKEND_API_DETAILED_SPECIFICATION_VI.md#ord-005) | Customer chỉ cancel, không tự COMPLETED; review khi COMPLETED |
| 11 | /payment | Thông tin thanh toán · CUSTOMER | [ORD-004](BACKEND_API_DETAILED_SPECIFICATION_VI.md#ord-004), [CHT-002](BACKEND_API_DETAILED_SPECIFICATION_VI.md#cht-002) | Thông tin thỏa thuận, không có Backend payment mua bánh |
| 12 | /ai-studio | Xưởng ý tưởng · CUSTOMER | [CAI-003](BACKEND_API_DETAILED_SPECIFICATION_VI.md#cai-003), [CAI-004](BACKEND_API_DETAILED_SPECIFICATION_VI.md#cai-004), [CAI-005](BACKEND_API_DETAILED_SPECIFICATION_VI.md#cai-005), [CAI-006](BACKEND_API_DETAILED_SPECIFICATION_VI.md#cai-006), [CAI-007](BACKEND_API_DETAILED_SPECIFICATION_VI.md#cai-007), [MKT-010](BACKEND_API_DETAILED_SPECIFICATION_VI.md#mkt-010) | BLOCKED compile/provider/storage; không có3D API |
| 13 | /rfqs | Yêu cầu của tôi · CUSTOMER | [MKT-001](BACKEND_API_DETAILED_SPECIFICATION_VI.md#mkt-001) | scope=mine; query paging1 |
| 14 | /rfq-new | Tạo yêu cầu bánh · CUSTOMER | [MKT-002](BACKEND_API_DETAILED_SPECIFICATION_VI.md#mkt-002), [BKR-035](BACKEND_API_DETAILED_SPECIFICATION_VI.md#bkr-035) | OPEN_CUSTOM/TARGETED_PRODUCT_CUSTOM; neededAt UTC, draft vẫn validate đủ |
| 15 | /request-detail | Chi tiết yêu cầu · CUSTOMER | [MKT-003](BACKEND_API_DETAILED_SPECIFICATION_VI.md#mkt-003), [MKT-004](BACKEND_API_DETAILED_SPECIFICATION_VI.md#mkt-004), [MKT-009](BACKEND_API_DETAILED_SPECIFICATION_VI.md#mkt-009), [MKT-005](BACKEND_API_DETAILED_SPECIFICATION_VI.md#mkt-005), [MKT-006](BACKEND_API_DETAILED_SPECIFICATION_VI.md#mkt-006), [MKT-007](BACKEND_API_DETAILED_SPECIFICATION_VI.md#mkt-007), [MKT-010](BACKEND_API_DETAILED_SPECIFICATION_VI.md#mkt-010) | Draft mutation; images/selected-design dependency blocked |
| 16 | /bidding | So sánh báo giá · CUSTOMER | [MKT-011](BACKEND_API_DETAILED_SPECIFICATION_VI.md#mkt-011), [MKT-012](BACKEND_API_DETAILED_SPECIFICATION_VI.md#mkt-012), [MKT-014](BACKEND_API_DETAILED_SPECIFICATION_VI.md#mkt-014) | Compare snapshot; accept requires addressId chưa có public CRUD |
| 17 | /baker-quote | Chi tiết báo giá · CUSTOMER | [MKT-012](BACKEND_API_DETAILED_SPECIFICATION_VI.md#mkt-012), [MKT-014](BACKEND_API_DETAILED_SPECIFICATION_VI.md#mkt-014), [CHT-002](BACKEND_API_DETAILED_SPECIFICATION_VI.md#cht-002) | Accept có key/customerNote, xử lý RETRYING/conflict |
| 18 | /chat | Tin nhắn · CUSTOMER | [CHT-001](BACKEND_API_DETAILED_SPECIFICATION_VI.md#cht-001), [CHT-002](BACKEND_API_DETAILED_SPECIFICATION_VI.md#cht-002), [CHT-003](BACKEND_API_DETAILED_SPECIFICATION_VI.md#cht-003), [CHT-005](BACKEND_API_DETAILED_SPECIFICATION_VI.md#cht-005), [CHT-006](BACKEND_API_DETAILED_SPECIFICATION_VI.md#cht-006), [CHT-007](BACKEND_API_DETAILED_SPECIFICATION_VI.md#cht-007), [CHT-008](BACKEND_API_DETAILED_SPECIFICATION_VI.md#cht-008), [CHT-004](BACKEND_API_DETAILED_SPECIFICATION_VI.md#cht-004) | List message defect; REST polling, không websocket/push |
| 19 | /vendor-dashboard | Tổng quan tiệm · BAKERY_OWNER | [BKR-021](BACKEND_API_DETAILED_SPECIFICATION_VI.md#bkr-021), [BKR-024](BACKEND_API_DETAILED_SPECIFICATION_VI.md#bkr-024), [ORD-002](BACKEND_API_DETAILED_SPECIFICATION_VI.md#ord-002), [SUB-008](BACKEND_API_DETAILED_SPECIFICATION_VI.md#sub-008) | Tổng hợp client từ dữ liệu được quyền, không có dashboard aggregate API |
| 20 | /vendor-menu | Catalog của tiệm · BAKERY_OWNER | [BKR-015](BACKEND_API_DETAILED_SPECIFICATION_VI.md#bkr-015), [BKR-016](BACKEND_API_DETAILED_SPECIFICATION_VI.md#bkr-016), [BKR-018](BACKEND_API_DETAILED_SPECIFICATION_VI.md#bkr-018), [BKR-017](BACKEND_API_DETAILED_SPECIFICATION_VI.md#bkr-017), [BKR-024](BACKEND_API_DETAILED_SPECIFICATION_VI.md#bkr-024), [BKR-025](BACKEND_API_DETAILED_SPECIFICATION_VI.md#bkr-025), [BKR-026](BACKEND_API_DETAILED_SPECIFICATION_VI.md#bkr-026), [BKR-029](BACKEND_API_DETAILED_SPECIFICATION_VI.md#bkr-029), [BKR-030](BACKEND_API_DETAILED_SPECIFICATION_VI.md#bkr-030), [BKR-031](BACKEND_API_DETAILED_SPECIFICATION_VI.md#bkr-031), [BKR-032](BACKEND_API_DETAILED_SPECIFICATION_VI.md#bkr-032), [BKR-028](BACKEND_API_DETAILED_SPECIFICATION_VI.md#bkr-028), [BKR-027](BACKEND_API_DETAILED_SPECIFICATION_VI.md#bkr-027), [BKR-010](BACKEND_API_DETAILED_SPECIFICATION_VI.md#bkr-010), [BKR-011](BACKEND_API_DETAILED_SPECIFICATION_VI.md#bkr-011), [BKR-013](BACKEND_API_DETAILED_SPECIFICATION_VI.md#bkr-013), [BKR-014](BACKEND_API_DETAILED_SPECIFICATION_VI.md#bkr-014), [BKR-012](BACKEND_API_DETAILED_SPECIFICATION_VI.md#bkr-012) | Owner membership và entitlement; object URL có hạn |
| 21 | /vendor-orders | Đơn của tiệm · BAKERY_OWNER | [ORD-002](BACKEND_API_DETAILED_SPECIFICATION_VI.md#ord-002), [ORD-004](BACKEND_API_DETAILED_SPECIFICATION_VI.md#ord-004), [ORD-008](BACKEND_API_DETAILED_SPECIFICATION_VI.md#ord-008) | scope=bakery&bakeryId; owner điều hành state machine |
| 22 | /vendor-rfq | Yêu cầu khả dụng · BAKERY_OWNER | [MKT-001](BACKEND_API_DETAILED_SPECIFICATION_VI.md#mkt-001), [MKT-003](BACKEND_API_DETAILED_SPECIFICATION_VI.md#mkt-003) | scope=available rõ ràng khi JWT có CUSTOMER+OWNER |
| 23 | /vendor-quote-submit | Soạn báo giá · BAKERY_OWNER | [MKT-008](BACKEND_API_DETAILED_SPECIFICATION_VI.md#mkt-008), [MKT-013](BACKEND_API_DETAILED_SPECIFICATION_VI.md#mkt-013), [MKT-015](BACKEND_API_DETAILED_SPECIFICATION_VI.md#mkt-015) | Một bakery/request kể cả withdrawn; giá add-on server snapshot |
| 24 | /vendor-profile | Hồ sơ và vận hành · BAKERY_OWNER | [BKR-006](BACKEND_API_DETAILED_SPECIFICATION_VI.md#bkr-006), [BKR-007](BACKEND_API_DETAILED_SPECIFICATION_VI.md#bkr-007), [BKR-022](BACKEND_API_DETAILED_SPECIFICATION_VI.md#bkr-022), [BKR-009](BACKEND_API_DETAILED_SPECIFICATION_VI.md#bkr-009), [BKR-023](BACKEND_API_DETAILED_SPECIFICATION_VI.md#bkr-023), [BKR-021](BACKEND_API_DETAILED_SPECIFICATION_VI.md#bkr-021), [BKR-033](BACKEND_API_DETAILED_SPECIFICATION_VI.md#bkr-033), [BKR-019](BACKEND_API_DETAILED_SPECIFICATION_VI.md#bkr-019), [BKR-020](BACKEND_API_DETAILED_SPECIFICATION_VI.md#bkr-020) | Onboarding CUSTOMER; OWNER membership cho quản trị, role refresh |
| 25 | /vendor-revenue | Thông tin doanh thu · BAKERY_OWNER | [ORD-002](BACKEND_API_DETAILED_SPECIFICATION_VI.md#ord-002) | Chưa có revenue/settlement API; không suy đơn hoàn tất=tiền đã thu |
| 26 | /vendor-chat | Tin nhắn của tiệm · BAKERY_OWNER | [CHT-001](BACKEND_API_DETAILED_SPECIFICATION_VI.md#cht-001), [CHT-003](BACKEND_API_DETAILED_SPECIFICATION_VI.md#cht-003), [CHT-005](BACKEND_API_DETAILED_SPECIFICATION_VI.md#cht-005), [CHT-006](BACKEND_API_DETAILED_SPECIFICATION_VI.md#cht-006), [CHT-007](BACKEND_API_DETAILED_SPECIFICATION_VI.md#cht-007), [CHT-008](BACKEND_API_DETAILED_SPECIFICATION_VI.md#cht-008), [CHT-004](BACKEND_API_DETAILED_SPECIFICATION_VI.md#cht-004) | bakeryId filter, không nhầm customer conversation; list defect |
| 27 | /vendor-subscription | Gói thuê của tiệm · BAKERY_OWNER / CUSTOMER onboarding demo | [SUB-008](BACKEND_API_DETAILED_SPECIFICATION_VI.md#sub-008), [SUB-009](BACKEND_API_DETAILED_SPECIFICATION_VI.md#sub-009), [SUB-010](BACKEND_API_DETAILED_SPECIFICATION_VI.md#sub-010), [SUB-011](BACKEND_API_DETAILED_SPECIFICATION_VI.md#sub-011), [SUB-012](BACKEND_API_DETAILED_SPECIFICATION_VI.md#sub-012), [SUB-014](BACKEND_API_DETAILED_SPECIFICATION_VI.md#sub-014) | Chứng từ thủ công, idempotency UUID, scheduled renewals |
| 28 | /admin-dashboard | Tổng quan nền tảng · ADMIN | [BKR-001](BACKEND_API_DETAILED_SPECIFICATION_VI.md#bkr-001), [SUB-001](BACKEND_API_DETAILED_SPECIFICATION_VI.md#sub-001), [ORD-002](BACKEND_API_DETAILED_SPECIFICATION_VI.md#ord-002) | Có list API; không có aggregate counters đầy đủ |
| 29 | /admin-users | Người dùng · ADMIN | Không có | BLOCKED: không có admin-users CRUD/status API |
| 30 | /admin-vendors | Duyệt tiệm bánh · ADMIN | [BKR-001](BACKEND_API_DETAILED_SPECIFICATION_VI.md#bkr-001), [BKR-002](BACKEND_API_DETAILED_SPECIFICATION_VI.md#bkr-002), [BKR-003](BACKEND_API_DETAILED_SPECIFICATION_VI.md#bkr-003) | State DRAFT/PENDING_APPROVAL/ACTIVE/SUSPENDED/CLOSED; không có status NEEDS_INFO |
| 31 | /admin-payments | Duyệt thanh toán gói · ADMIN | [SUB-001](BACKEND_API_DETAILED_SPECIFICATION_VI.md#sub-001), [SUB-002](BACKEND_API_DETAILED_SPECIFICATION_VI.md#sub-002), [SUB-003](BACKEND_API_DETAILED_SPECIFICATION_VI.md#sub-003) | Approve UUID key/note; reject note bắt buộc |
| 32 | /admin-plans | Quản lý gói · ADMIN | [SUB-004](BACKEND_API_DETAILED_SPECIFICATION_VI.md#sub-004), [SUB-005](BACKEND_API_DETAILED_SPECIFICATION_VI.md#sub-005), [SUB-006](BACKEND_API_DETAILED_SPECIFICATION_VI.md#sub-006), [SUB-007](BACKEND_API_DETAILED_SPECIFICATION_VI.md#sub-007) | Giữ snapshots đơn cũ, không giả quota enforcement |
| 33 | /admin-orders | Đơn trên nền tảng · ADMIN | [ORD-002](BACKEND_API_DETAILED_SPECIFICATION_VI.md#ord-002), [ORD-004](BACKEND_API_DETAILED_SPECIFICATION_VI.md#ord-004), [ORD-008](BACKEND_API_DETAILED_SPECIFICATION_VI.md#ord-008) | scope=all; quyền admin qua JWT thật |
| 34 | /admin-moderation | Kiểm duyệt · ADMIN | [CAI-001](BACKEND_API_DETAILED_SPECIFICATION_VI.md#cai-001), [ORD-001](BACKEND_API_DETAILED_SPECIFICATION_VI.md#ord-001) | Design compile blocked; review status API không có list-review riêng |
| 35 | /admin-revenue | Doanh thu gói thuê · ADMIN | [SUB-001](BACKEND_API_DETAILED_SPECIFICATION_VI.md#sub-001), [SUB-009](BACKEND_API_DETAILED_SPECIFICATION_VI.md#sub-009) | Chưa có revenue-report API; không coi SUBMITTED là PAID/APPROVED |


## Chuyển trạng thái khác demo

Order: PENDING→CONFIRMED→BAKING→READY→DELIVERING→COMPLETED. Customer chỉ có CANCELLED ở các trạng thái cho phép, không có quyền tự hoàn tất; UI demo cho hoàn tất phải được thiết kế lại khi tích hợp. Offer có PENDING/ACCEPTED/REJECTED/WITHDRAWN/EXPIRED; withdraw không giải phóng unique bakery/request. RFQ type phải OPEN_CUSTOM hoặc TARGETED_PRODUCT_CUSTOM, không gửi OPEN như requestType (OPEN là status).

Accept public dùng **customerNote**, internal Order dùng **deliveryNote**; unknown field bị bỏ qua ở runtime, nên nhầm tên có thể mất ghi chú mà không nhận validation error. Complete onboarding trả204; logout trả200. Review đã delete mềm vẫn chiếm một review/order; không tự bật nút tạo lại.

## Luồng tích hợp đề xuất sau audit

1. Hoàn thiện và kiểm Gateway/base URL, session/cookie/error contract trước bật mutation.
2. Public catalog/plans và login/register/me/refresh.
3. Public profile/address APIs cần bổ sung; không đi vòng qua internal credential.
4. Onboarding, membership selector, subscription/manual proof; đồng bộ external grants với deployed JAR.
5. RFQ/offer/accept và Order snapshots; xử lý durable acceptance/retry, sửa direct-order contract trước mở checkout.
6. Chat sau sửa SQL và kiểm trang đầu/trang tiếp/receipts/attachments.
7. Cake AI sau sửa compile, credential sandbox được phê duyệt, moderation/storage/lease tests.
8. Dashboard/revenue/admin-users chỉ sau có API hoặc thống nhất rằng capability chưa hỗ trợ.

## Điều kiện chấp nhận tích hợp

Không bắt đầu từ việc tạo hàng loạt Dart model theo JSON demo. Mỗi flow cần schema source/runtime được chốt, authorization thực, non2xx contract, fixture e2e không dùng production, media URL reachability, key replay và thay đổi session sau grant. Các tiêu chí này là khuyến nghị kế tiếp, không phải việc đã triển khai trong audit này.

[Đặc tả113 API](BACKEND_API_DETAILED_SPECIFICATION_VI.md), [37 workflow](BACKEND_BUSINESS_WORKFLOWS_VI.md), [runtime](BACKEND_API_RUNTIME_VERIFICATION_VI.md), [findings](BACKEND_AUDIT_FINDINGS_VI.md).
