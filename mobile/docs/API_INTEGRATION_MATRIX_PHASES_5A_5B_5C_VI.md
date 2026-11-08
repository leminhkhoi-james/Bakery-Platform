# Ma trận tích hợp API Mobile — Phases 5A, 5B, 5C

Ngày xác minh: 08/11/2026. Đếm theo **microservice + HTTP method + route công khai chuẩn hóa**; không đếm internal call, storage download hoặc số lần gọi lặp. “Adapter” nghĩa là đã có phương thức trong repository Flutter, không đồng nghĩa workflow hoạt động hoàn chỉnh. “Nối UI” là có đường gọi từ UI đang triển khai; accept/direct chỉ có adapter và màn bị khóa vì thiếu hợp đồng địa chỉ. “Android 2xx” yêu cầu event từ NativeTransport của UI thật, không dùng unit/widget test thay thế.

Evidence cũ trên topology canonical vẫn chứng minh các RFQ operation đã trả 2xx; các lỗi membership/binary cũ đã được phân biệt với topology Mobile tương thích hiện tại. Toàn bộ source endpoint được đối chiếu live OpenAPI; không coi OpenAPI 200 là kiểm chứng nghiệp vụ.

## Thống kê

| Microservice | Phát hiện | Trong phạm vi / adapter | Nối UI | HTTP có 2xx | Android có 2xx |
|---|---:|---:|---:|---:|---:|
| marketplace | 15 | 14 | 13 | 11 | 11 |
| order | 8 | 4 | 3 | 1 | 1 |
| chat | 8 | 8 | 8 | 7 | 6 |

Mỗi request dùng JWT người dùng; vai trò, ownership, membership và participant được Backend kiểm tra. Mobile không gọi endpoint internal. Idempotency key tường minh dành cho accept/direct; Chat dùng `clientMessageId` và multipart metadata JSON. Không tự retry POST khi chưa xác định kết quả.

## Các operation và kết quả

### marketplace

| Method và route | Adapter / UI | HTTP quan sát | Android 2xx | Kết quả, giới hạn |
|---|---|---|---|---|
| `GET /api/v1/cake-requests` | Có / Có | 200, 503 | Có | Đã kiểm chứng thao tác |
| `GET /api/v1/cake-requests/{id}` | Có / Có | 200, 503 | Có | Đã kiểm chứng thao tác |
| `POST /api/v1/cake-requests` | Có / Có | 201, 400 | Có | Đã kiểm chứng thao tác |
| `PATCH /api/v1/cake-requests/{id}` | Có / Có | 200 | Có | Đã kiểm chứng thao tác |
| `POST /api/v1/cake-requests/{id}/publish` | Có / Có | 200 | Có | Đã kiểm chứng thao tác |
| `POST /api/v1/cake-requests/{id}/cancel` | Có / Có | 200 | Có | Đã kiểm chứng thao tác |
| `PUT /api/v1/cake-requests/{id}/selected-design` | Không / Không | Chưa gọi | Không | OUT_OF_SCOPE — AI selected-design hoặc Review/Admin Review |
| `POST /api/v1/cake-requests/{id}/images` | Có / Có | 503 | Không | BLOCKED_ENVIRONMENT — Firebase chưa cấu hình; upload 503, không có image hợp lệ để kiểm chứng delete |
| `DELETE /api/v1/cake-requests/{id}/images/{imageId}` | Có / Có | Chưa gọi | Không | BLOCKED_ENVIRONMENT — Firebase chưa cấu hình; upload 503, không có image hợp lệ để kiểm chứng delete |
| `GET /api/v1/offers` | Có / Có | 200, 503 | Có | Đã kiểm chứng thao tác |
| `GET /api/v1/offers/{id}` | Có / Có | 200 | Có | Đã kiểm chứng thao tác |
| `POST /api/v1/cake-requests/{id}/offers` | Có / Có | 201, 409, 503 | Có | Đã kiểm chứng thao tác |
| `PATCH /api/v1/offers/{id}` | Có / Có | 200 | Có | Đã kiểm chứng thao tác |
| `POST /api/v1/offers/{id}/withdraw` | Có / Có | 200 | Có | Đã kiểm chứng thao tác |
| `POST /api/v1/offers/{id}/accept` | Có / Không | Chưa gọi | Không | BLOCKED_BACKEND — chưa có API công khai chọn địa chỉ; không gửi UUID bịa |

### order

| Method và route | Adapter / UI | HTTP quan sát | Android 2xx | Kết quả, giới hạn |
|---|---|---|---|---|
| `POST /api/v1/orders/direct` | Có / Không | Chưa gọi | Không | BLOCKED_BACKEND — chưa có API công khai chọn địa chỉ; không gửi UUID bịa |
| `GET /api/v1/orders` | Có / Có | 200 | Có | Đã kiểm chứng thao tác |
| `GET /api/v1/orders/{orderId}` | Có / Có | Chưa gọi | Không | NOT_VERIFIED — chưa tạo được Order hợp lệ để mở detail/chuyển state |
| `POST /api/v1/orders/{orderId}/status-transitions` | Có / Có | Chưa gọi | Không | NOT_VERIFIED — chưa tạo được Order hợp lệ để mở detail/chuyển state |
| `POST /api/v1/orders/{orderId}/review` | Không / Không | Chưa gọi | Không | OUT_OF_SCOPE — AI selected-design hoặc Review/Admin Review |
| `PATCH /api/v1/orders/{orderId}/review` | Không / Không | Chưa gọi | Không | OUT_OF_SCOPE — AI selected-design hoặc Review/Admin Review |
| `DELETE /api/v1/orders/{orderId}/review` | Không / Không | Chưa gọi | Không | OUT_OF_SCOPE — AI selected-design hoặc Review/Admin Review |
| `PATCH /api/v1/admin/reviews/{orderId}/status` | Không / Không | Chưa gọi | Không | OUT_OF_SCOPE — AI selected-design hoặc Review/Admin Review |

### chat

| Method và route | Adapter / UI | HTTP quan sát | Android 2xx | Kết quả, giới hạn |
|---|---|---|---|---|
| `GET /api/v1/conversations` | Có / Có | 200 | Có | Đã kiểm chứng thao tác |
| `POST /api/v1/conversations` | Có / Có | 200, 201, 422 | Có | Đã kiểm chứng thao tác |
| `GET /api/v1/conversations/{conversationId}` | Có / Có | 200, 404 | Có | Đã kiểm chứng thao tác |
| `POST /api/v1/conversations/{conversationId}/close` | Có / Có | 200 | Có | Đã kiểm chứng thao tác |
| `GET /api/v1/conversations/{conversationId}/messages` | Có / Có | 403 | Không | BLOCKED_BACKEND — history 403, SQLState 42P18 với cả first page và cursor hợp lệ |
| `POST /api/v1/conversations/{conversationId}/messages` | Có / Có | 200, 201 | Có | TEXT/IMAGE 201; replay 200 cùng ID. Download public bị chặn bởi hostname Docker |
| `POST /api/v1/conversations/{conversationId}/read` | Có / Có | 200 | Không | HTTP 200; UI chưa đi tới read vì history bị lỗi |
| `DELETE /api/v1/conversations/{conversationId}/messages/{messageId}` | Có / Có | 204, 404 | Có | Đã kiểm chứng thao tác |

## Hợp đồng request, response và nguồn

Chi tiết schema đầy đủ được giữ nguyên trong các OpenAPI công khai đã lấy từ runtime. Các link dưới đây tới controller và schema, không chứa response business hoặc credential. Query không được “sáng tạo” từ UI; danh sách dùng page/size/filter/scope theo controller; Chat history dùng `before` + `limit`, response `items` + `nextCursor` + `hasMore`.

- `marketplace GET /api/v1/cake-requests`: [controller, dòng 26](../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/CakeRequestController.java#L26); DTO: `ApiResponse`, `CakeRequestSummaryResponse`, `PageResponse`. [OpenAPI](evidence/phases-5a-5b-5c/marketplace-public-openapi.json).
- `marketplace GET /api/v1/cake-requests/{id}`: [controller, dòng 32](../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/CakeRequestController.java#L32); DTO: `ApiResponse`, `CakeRequestResponse`. [OpenAPI](evidence/phases-5a-5b-5c/marketplace-public-openapi.json).
- `marketplace POST /api/v1/cake-requests`: [controller, dòng 37](../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/CakeRequestController.java#L37); DTO: `ApiResponse`, `CakeRequestResponse`, `CreateCakeRequestRequest`. [OpenAPI](evidence/phases-5a-5b-5c/marketplace-public-openapi.json).
- `marketplace PATCH /api/v1/cake-requests/{id}`: [controller, dòng 43](../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/CakeRequestController.java#L43); DTO: `ApiResponse`, `CakeRequestResponse`, `PatchCakeRequestRequest`. [OpenAPI](evidence/phases-5a-5b-5c/marketplace-public-openapi.json).
- `marketplace POST /api/v1/cake-requests/{id}/publish`: [controller, dòng 49](../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/CakeRequestController.java#L49); DTO: `ApiResponse`, `CakeRequestResponse`. [OpenAPI](evidence/phases-5a-5b-5c/marketplace-public-openapi.json).
- `marketplace POST /api/v1/cake-requests/{id}/cancel`: [controller, dòng 54](../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/CakeRequestController.java#L54); DTO: `ApiResponse`, `CakeRequestResponse`, `ReasonRequest`. [OpenAPI](evidence/phases-5a-5b-5c/marketplace-public-openapi.json).
- `marketplace PUT /api/v1/cake-requests/{id}/selected-design`: [controller, dòng 60](../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/CakeRequestController.java#L60); DTO: `ApiResponse`, `CakeRequestResponse`, `SelectDesignRequest`. [OpenAPI](evidence/phases-5a-5b-5c/marketplace-public-openapi.json).
- `marketplace POST /api/v1/cake-requests/{id}/images`: [controller, dòng 66](../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/CakeRequestController.java#L66); DTO: `ApiResponse`, `RequestImageResponse`. [OpenAPI](evidence/phases-5a-5b-5c/marketplace-public-openapi.json).
- `marketplace DELETE /api/v1/cake-requests/{id}/images/{imageId}`: [controller, dòng 75](../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/CakeRequestController.java#L75); DTO: Không có body DTO. [OpenAPI](evidence/phases-5a-5b-5c/marketplace-public-openapi.json).
- `marketplace GET /api/v1/offers`: [controller, dòng 25](../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/offer/OfferController.java#L25); DTO: `ApiResponse`, `OfferResponse`, `PageResponse`. [OpenAPI](evidence/phases-5a-5b-5c/marketplace-public-openapi.json).
- `marketplace GET /api/v1/offers/{id}`: [controller, dòng 31](../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/offer/OfferController.java#L31); DTO: `ApiResponse`, `OfferResponse`. [OpenAPI](evidence/phases-5a-5b-5c/marketplace-public-openapi.json).
- `marketplace POST /api/v1/cake-requests/{id}/offers`: [controller, dòng 36](../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/offer/OfferController.java#L36); DTO: `ApiResponse`, `CreateOfferRequest`, `OfferResponse`. [OpenAPI](evidence/phases-5a-5b-5c/marketplace-public-openapi.json).
- `marketplace PATCH /api/v1/offers/{id}`: [controller, dòng 42](../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/offer/OfferController.java#L42); DTO: `ApiResponse`, `OfferResponse`, `PatchOfferRequest`. [OpenAPI](evidence/phases-5a-5b-5c/marketplace-public-openapi.json).
- `marketplace POST /api/v1/offers/{id}/withdraw`: [controller, dòng 48](../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/offer/OfferController.java#L48); DTO: `ApiResponse`, `OfferResponse`, `ReasonRequest`. [OpenAPI](evidence/phases-5a-5b-5c/marketplace-public-openapi.json).
- `marketplace POST /api/v1/offers/{id}/accept`: [controller, dòng 54](../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/offer/OfferController.java#L54); DTO: `AcceptOfferRequest`, `AcceptanceResponse`, `ApiResponse`. [OpenAPI](evidence/phases-5a-5b-5c/marketplace-public-openapi.json).
- `order POST /api/v1/orders/direct`: [controller, dòng 52](../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/OrderController.java#L52); DTO: `ApiResponse`, `CreateDirectOrderRequest`, `OrderResponse`. [OpenAPI](evidence/phases-5a-5b-5c/order-public-openapi.json).
- `order GET /api/v1/orders`: [controller, dòng 70](../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/OrderController.java#L70); DTO: `ApiResponse`, `OrderSummaryResponse`. [OpenAPI](evidence/phases-5a-5b-5c/order-public-openapi.json).
- `order GET /api/v1/orders/{orderId}`: [controller, dòng 92](../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/OrderController.java#L92); DTO: `ApiResponse`, `OrderResponse`. [OpenAPI](evidence/phases-5a-5b-5c/order-public-openapi.json).
- `order POST /api/v1/orders/{orderId}/status-transitions`: [controller, dòng 105](../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/OrderController.java#L105); DTO: `ApiResponse`, `OrderResponse`, `TransitionOrderRequest`. [OpenAPI](evidence/phases-5a-5b-5c/order-public-openapi.json).
- `order POST /api/v1/orders/{orderId}/review`: [controller, dòng 41](../../backend/order-service/src/main/java/com/se193262/orderservice/feature/review/ReviewController.java#L41); DTO: `ApiResponse`, `CreateReviewRequest`, `ReviewResponse`. [OpenAPI](evidence/phases-5a-5b-5c/order-public-openapi.json).
- `order PATCH /api/v1/orders/{orderId}/review`: [controller, dòng 56](../../backend/order-service/src/main/java/com/se193262/orderservice/feature/review/ReviewController.java#L56); DTO: `ApiResponse`, `ReviewResponse`, `UpdateReviewRequest`. [OpenAPI](evidence/phases-5a-5b-5c/order-public-openapi.json).
- `order DELETE /api/v1/orders/{orderId}/review`: [controller, dòng 71](../../backend/order-service/src/main/java/com/se193262/orderservice/feature/review/ReviewController.java#L71); DTO: `ApiResponse`. [OpenAPI](evidence/phases-5a-5b-5c/order-public-openapi.json).
- `order PATCH /api/v1/admin/reviews/{orderId}/status`: [controller, dòng 85](../../backend/order-service/src/main/java/com/se193262/orderservice/feature/review/ReviewController.java#L85); DTO: `ApiResponse`, `ReviewResponse`, `UpdateReviewStatusRequest`. [OpenAPI](evidence/phases-5a-5b-5c/order-public-openapi.json).
- `chat GET /api/v1/conversations`: [controller, dòng 42](../../backend/chat-service/src/main/java/com/se193262/chatservice/feature/conversation/ConversationController.java#L42); DTO: `ApiResponse`, `ConversationSummaryResponse`. [OpenAPI](evidence/phases-5a-5b-5c/chat-public-openapi.json).
- `chat POST /api/v1/conversations`: [controller, dòng 60](../../backend/chat-service/src/main/java/com/se193262/chatservice/feature/conversation/ConversationController.java#L60); DTO: `ApiResponse`, `ConversationResponse`, `CreateConversationRequest`. [OpenAPI](evidence/phases-5a-5b-5c/chat-public-openapi.json).
- `chat GET /api/v1/conversations/{conversationId}`: [controller, dòng 75](../../backend/chat-service/src/main/java/com/se193262/chatservice/feature/conversation/ConversationController.java#L75); DTO: `ApiResponse`, `ConversationResponse`. [OpenAPI](evidence/phases-5a-5b-5c/chat-public-openapi.json).
- `chat POST /api/v1/conversations/{conversationId}/close`: [controller, dòng 83](../../backend/chat-service/src/main/java/com/se193262/chatservice/feature/conversation/ConversationController.java#L83); DTO: `ApiResponse`, `CloseConversationRequest`, `ConversationResponse`. [OpenAPI](evidence/phases-5a-5b-5c/chat-public-openapi.json).
- `chat GET /api/v1/conversations/{conversationId}/messages`: [controller, dòng 44](../../backend/chat-service/src/main/java/com/se193262/chatservice/feature/message/MessageController.java#L44); DTO: `ApiResponse`, `MessagePageResponse`. [OpenAPI](evidence/phases-5a-5b-5c/chat-public-openapi.json).
- `chat POST /api/v1/conversations/{conversationId}/messages`: [controller, dòng 55](../../backend/chat-service/src/main/java/com/se193262/chatservice/feature/message/MessageController.java#L55); DTO: `ApiResponse`, `MessageResponse`. [OpenAPI](evidence/phases-5a-5b-5c/chat-public-openapi.json).
- `chat POST /api/v1/conversations/{conversationId}/read`: [controller, dòng 71](../../backend/chat-service/src/main/java/com/se193262/chatservice/feature/message/MessageController.java#L71); DTO: `ApiResponse`, `ReadMessagesRequest`, `ReadMessagesResponse`. [OpenAPI](evidence/phases-5a-5b-5c/chat-public-openapi.json).
- `chat DELETE /api/v1/conversations/{conversationId}/messages/{messageId}`: [controller, dòng 81](../../backend/chat-service/src/main/java/com/se193262/chatservice/feature/message/MessageController.java#L81); DTO: Không có body DTO. [OpenAPI](evidence/phases-5a-5b-5c/chat-public-openapi.json).

## Điều kiện và đối chiếu nghiệp vụ

| Nhóm | Request và validation chính | Response / state / lỗi |
|---|---|---|
| RFQ | `OPEN_CUSTOM` hoặc `TARGETED_PRODUCT_CUSTOM`; title ≤180, description ≤10000, neededAt tương lai, deliveryCity/deliveryDistrict; budget không âm, khoảng min/max hợp lệ; targeted lấy bakery/product/option UUID thật | ID server, preference/images/options snapshot; DRAFT mới được sửa/ảnh; publish → OPEN; cancel theo Backend. Không thay lỗi eligibility thành danh sách rỗng |
| Offer | bakeryId đã xác minh membership; cakePrice/deliveryFee/item giá hợp lệ; estimatedCompletionAt/expiresAt có timezone và tương lai; RFQ còn mở/đủ điều kiện | Giá tổng Backend là nguồn chính; PENDING và chưa hết hạn mới sửa/rút; duplicate gửi lại bị 409; withdraw → WITHDRAWN |
| Accept | addressId thực + delivery note/time theo DTO; key ổn định cho một ý định | Marketplace điều phối Order qua internal service; không dùng Cart/direct để thay thế. UI khóa vì không có public address API; chưa kiểm chứng distributed recovery |
| Direct Order | productId, quantity, option/add-on UUID thật; addressId, thời gian và ghi chú; key ổn định | Cart chỉ tạm tính bằng số nguyên tiền lẻ; revalidate catalog; server quyết định snapshot/giá. Chưa POST direct vì thiếu địa chỉ được cấp quyền |
| Order management | scope mine/bakery, bakeryId thật; status-transitions gửi targetStatus/reason | PENDING→CONFIRMED/CANCELLED; CONFIRMED→BAKING/CANCELLED; BAKING→READY→DELIVERING→COMPLETED. Customer chỉ hủy ở trạng thái Backend cho phép; Backend xét quyền cuối cùng |
| Chat | conversation từ RFQ/bakery đúng context; Customer tạo/lấy, Owner tìm existing authorized conversation. Multipart metadata + tối đa 5 file ×10 MiB JPEG/PNG/WEBP/PDF | Server message ID/clientMessageId; cursor merge/dedupe; own-delete tombstone; closed khóa gửi mới. Giữ logical ID/payload khi chưa rõ kết quả; pending chỉ tồn tại qua navigation cùng phiên |

## Bằng chứng và giới hạn

- [Số đếm có thể tái tạo](evidence/phases-5a-5b-5c/integration-summary.json); chạy `python -B tool/phase5_matrix.py` từ `mobile`.
- Native test thực hiện bằng màn hình/repository/transport thật; hook chỉ điều hướng và đọc event method/path/status/ID/state. Session test dùng namespace riêng, không đọc secure session mặc định.
- HTTP host kiểm chứng read-state 200; Android chưa kiểm chứng read-state/pagination thành công vì lỗi history. Unit/widget test chỉ chứng minh hành vi client với test doubles.
- Host dùng connection override giữ nguyên signed Host để chẩn đoán storage: không phải cách sửa ứng dụng và không tính là Mobile download thành công.
- Các event âm 400/403/404/409/503 được lưu để đối chiếu; không cộng vào API đã xác minh thành công. Không claim 100% coverage hoặc Order/Chat end-to-end hoàn chỉnh.
