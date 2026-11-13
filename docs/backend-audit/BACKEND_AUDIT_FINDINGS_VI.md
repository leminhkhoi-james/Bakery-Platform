# Phát hiện kiểm toán Backend

Mức độ đánh giá theo ảnh hưởng hiện tại. Không có finding Critical đã chứng minh. Source-confirmed không đồng nghĩa exploit đã được thử. Mọi khuyến nghị dưới đây chưa được áp dụng vào source.


| Mức | Số lượng |
|---|---|
| Critical | 0 |
| High | 5 |
| Medium | 6 |
| Low | 3 |
| Info | 3 |



| ID | Mức | Phát hiện | Độ xác minh |
|---|---|---|---|
| F-001 | High | Gateway là bootstrap non-web, không forward API | RUNTIME_CONFIRMED |
| F-002 | High | Cake AI không compile: thiếu Google Storage dependencies và ApiResponse.accepted | BUILD_CONFIRMED |
| F-003 | High | Identity address thiếu id làm direct order luôn 422 với contract hiện tại | RUNTIME_CONFIRMED |
| F-004 | High | Chat list message lỗi PostgreSQL bind timestamp | RUNTIME_AND_EXISTING_TEST_CONFIRMED |
| F-005 | High | Image và service-client config sẵn có lệch current source | CONFIG_AND_OPENAPI_CONFIRMED |
| F-006 | Medium | HTTP403 che lỗi server do error dispatch bị security chặn | RUNTIME_CONFIRMED |
| F-007 | Medium | Grant Order→Bakery mặc định thiếu catalog quote | SOURCE_CONFIRMED_RUNTIME_OVERRIDE_PRESENT |
| F-008 | Medium | Thiếu public profile/address và admin user CRUD | INVENTORY_CONFIRMED |
| F-009 | Medium | Unknown JSON field có thể làm mất ghi chú do khác contract | RUNTIME_CONFIRMED_CONTRACT_RISK |
| F-010 | Medium | Feature map chưa trở thành quota enforcement | SOURCE_SEARCH_CONFIRMED |
| F-011 | Medium | Các adapter media chủ yếu kiểm magic bytes | SOURCE_CONFIRMED_NOT_EXPLOIT_TESTED |
| F-012 | Info | Canonical Bakery V1 khác indentation, không khác SQL | FORMATTING_ONLY_CONFIRMED |
| F-013 | Low | Readiness endpoints bị từ chối ở4 service | RUNTIME_CONFIRMED |
| F-014 | Low | Paging/shape/status khác nhau giữa service | SOURCE_AND_OPENAPI_CONFIRMED |
| F-015 | Low | Order application test có lỗi fixture bind Instant | EXISTING_TEST_CONFIRMED |
| F-016 | Info | Logout không thu hồi access JWT tức thì | RUNTIME_CONFIRMED_EXPECTED_JWT_MODEL |
| F-017 | Info | Hai pipeline tạo order từ offer không cùng đường gọi | SOURCE_CALL_TRACE_CONFIRMED |


<a id="f-001"></a>

## F-001 · High · Gateway là bootstrap non-web, không forward API

Trạng thái: **RUNTIME_CONFIRMED**.

Ảnh hưởng: Toàn bộ mobile/web qua một base URL Gateway bị chặn.

Bằng chứng: [ApiGatewayApplication:6](../../backend/api-gateway/src/main/java/com/se193262/apigateway/ApiGatewayApplication.java#L6); [pom Gateway](../../backend/api-gateway/pom.xml); [probe](evidence/gateway-probe.json).

Tái hiện/đối chiếu: JAR current source start rồi exit0; không Tomcat/Netty; GET18090 connection refused.

Khuyến nghị: Thiết kế/triển khai routing và security Gateway trong nhiệm vụ remediation riêng; không coi build PASS là gateway hoạt động.

Giới hạn: audit read-only, chưa triển khai remediation; chỉ fixture disposable được phép ghi.

<a id="f-002"></a>

## F-002 · High · Cake AI không compile: thiếu Google Storage dependencies và ApiResponse.accepted

Trạng thái: **BUILD_CONFIRMED**.

Ảnh hưởng: 9 API AI không khởi chạy; các nhánh upload/generation/revision/moderation chưa sẵn sàng.

Bằng chứng: [FirebaseStorageAdapter:12](../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/infrastructure/storage/FirebaseStorageAdapter.java#L12); [GenerationController:51](../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/generation/GenerationController.java#L51); [build](evidence/build-cake-ai.txt).

Tái hiện/đối chiếu: Build isolated -pl cake-ai-service -am -DskipTests package exit1; missing com.google.auth.oauth2/cloud.storage/http và accepted method.

Khuyến nghị: Bổ sung dependency đúng module và thống nhất response factory sau review; cần build và chạy lại AI sandbox, không dùng cloud thật để che compile lỗi.

Giới hạn: audit read-only, chưa triển khai remediation; chỉ fixture disposable được phép ghi.

<a id="f-003"></a>

## F-003 · High · Identity address thiếu id làm direct order luôn 422 với contract hiện tại

Trạng thái: **RUNTIME_CONFIRMED**.

Ảnh hưởng: CUSTOMER không tạo được direct catalog order dù địa chỉ hợp lệ; flow from-offer dùng Map vẫn chạy.

Bằng chứng: [UserContextService:11](../../backend/identity-service/src/main/java/com/se193262/identityservice/feature/user/UserContextService.java#L11); [IdentityClient:11](../../backend/order-service/src/main/java/com/se193262/orderservice/infrastructure/client/IdentityClient.java#L11); [OrderCreationServiceImpl:24](../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/OrderCreationServiceImpl.java#L24); [TC-0193](BACKEND_API_RUNTIME_VERIFICATION_VI.md#tc-0193); [shape](evidence/address-contract-check.json).

Tái hiện/đối chiếu: Đăng nhập synthetic customer có address đầy đủ → POST /orders/direct →422 Delivery address is missing or incomplete; internal address200 nhưng hasId=false.

Khuyến nghị: Thống nhất DTO Identity/Order bao gồm id và kiểm contract qua HTTP thật; audit không sửa implementation.

Giới hạn: audit read-only, chưa triển khai remediation; chỉ fixture disposable được phép ghi.

<a id="f-004"></a>

## F-004 · High · Chat list message lỗi PostgreSQL bind timestamp

Trạng thái: **RUNTIME_AND_EXISTING_TEST_CONFIRMED**.

Ảnh hưởng: Danh sách tin nhắn không tải được; send/replay/read/delete hoạt động nhưng chat chưa đủ dùng.

Bằng chứng: [ChatMessageRepository:20](../../backend/chat-service/src/main/java/com/se193262/chatservice/feature/message/ChatMessageRepository.java#L20); [TC-0188](BACKEND_API_RUNTIME_VERIFICATION_VI.md#tc-0188); [TC-0256](BACKEND_API_RUNTIME_VERIFICATION_VI.md#tc-0256); [test](evidence/existing-tests.json).

Tái hiện/đối chiếu: GET conversation/messages hợp lệ →403; server lỗi could not determine data type of parameter $2. Test ChatServiceApplicationTests cũng gặp cùng lỗi. Cursor non-null case cũng chưa PASS.

Khuyến nghị: Tách query không cursor hoặc bind/cast timestamp rõ ràng; xử lý error dispatch để response phản ánh đúng lỗi server; kiểm lại cả trang đầu và trang sau.

Giới hạn: audit read-only, chưa triển khai remediation; chỉ fixture disposable được phép ghi.

<a id="f-005"></a>

## F-005 · High · Image và service-client config sẵn có lệch current source

Trạng thái: **CONFIG_AND_OPENAPI_CONFIRMED**.

Ảnh hưởng: Stack bakery-local thiếu6 API hiện tại; grants cũ thiếu identity:bakery-owner:grant và bakery:onboarding:activate, có thể ngăn onboarding mới.

Bằng chứng: [reconciliation](evidence/api-reconciliation.json); [grants audit](evidence/isolated-configuration.json); [ServiceTokenService:15](../../backend/identity-service/src/main/java/com/se193262/identityservice/feature/authentication/ServiceTokenService.java#L15).

Tái hiện/đối chiếu: Existing OpenAPI98, fresh isolated104; source113 gồm9AI. Runtime-mounted Identity clients cũ không có hai scope onboarding mới; audit chỉ hợp grants ở cấu hình TEMP của stack audit.

Khuyến nghị: Đồng bộ version JAR và external service-client grants sau review. Không đổi hash/key hiện hữu và không cấp scope rộng hơn caller cần.

Giới hạn: audit read-only, chưa triển khai remediation; chỉ fixture disposable được phép ghi.

<a id="f-006"></a>

## F-006 · Medium · HTTP403 che lỗi server do error dispatch bị security chặn

Trạng thái: **RUNTIME_CONFIRMED**.

Ảnh hưởng: Client có thể hiểu lỗi SQL thành thiếu quyền, dẫn đến logout/ẩn UI sai.

Bằng chứng: [SecurityConfig:39](../../backend/chat-service/src/main/java/com/se193262/chatservice/config/SecurityConfig.java#L39); [GlobalExceptionHandler:17](../../backend/chat-service/src/main/java/com/se193262/chatservice/exception/GlobalExceptionHandler.java#L17); [TC-0256](BACKEND_API_RUNTIME_VERIFICATION_VI.md#tc-0256).

Tái hiện/đối chiếu: HTTP403 Access is denied trong khi log PostgreSQL lỗi bind; không có business ownership rejection ở thời điểm lỗi.

Khuyến nghị: Quy định error-dispatch/exception mapping và generic500 có correlation, giữ chi tiết SQL khỏi client.

Giới hạn: audit read-only, chưa triển khai remediation; chỉ fixture disposable được phép ghi.

<a id="f-007"></a>

## F-007 · Medium · Grant Order→Bakery mặc định thiếu catalog quote

Trạng thái: **SOURCE_CONFIRMED_RUNTIME_OVERRIDE_PRESENT**.

Ảnh hưởng: Direct order còn có blocker scope khi dùng application.yml thuần; runtime cũ đã override scope này.

Bằng chứng: [application Identity](../../backend/identity-service/src/main/resources/application.yml); [grants](evidence/isolated-configuration.json); [CatalogQuoteService:33](../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/catalog/service/CatalogQuoteService.java#L33).

Tái hiện/đối chiếu: Source grants order-service/bakery-service không có bakery:catalog:quote, nhưng typed direct pipeline cần nó; external grant đang có đã được reuse.

Khuyến nghị: Chuẩn hóa declarative grants với contract caller; không cấp blanket scope hoặc nhét service token vào Flutter.

Giới hạn: audit read-only, chưa triển khai remediation; chỉ fixture disposable được phép ghi.

<a id="f-008"></a>

## F-008 · Medium · Thiếu public profile/address và admin user CRUD

Trạng thái: **INVENTORY_CONFIRMED**.

Ảnh hưởng: Các màn profile/address/admin-users local chưa có API; addressId cần cho đặt hàng không thể lấy qua public address book.

Bằng chứng: [AuthenticationController:29](../../backend/identity-service/src/main/java/com/se193262/identityservice/feature/authentication/AuthenticationController.java#L29); [inventory](evidence/api-inventory.json); [35 màn mobile](../mobile/MOBILE_SCREEN_INVENTORY_VI.md).

Tái hiện/đối chiếu: Inventory113 chỉ auth/me và internal user/address reads, không có public address CRUD/profile mutation/admin-users endpoints.

Khuyến nghị: Chốt và triển khai API thiếu trong nhiệm vụ riêng; UI phải thể hiện chưa hỗ trợ, không nhúng credential nội bộ để workaround.

Giới hạn: audit read-only, chưa triển khai remediation; chỉ fixture disposable được phép ghi.

<a id="f-009"></a>

## F-009 · Medium · Unknown JSON field có thể làm mất ghi chú do khác contract

Trạng thái: **RUNTIME_CONFIRMED_CONTRACT_RISK**.

Ảnh hưởng: AcceptOfferRequest dùng customerNote; gửi deliveryNote được bỏ qua. Replay với field không biết không đổi fingerprint.

Bằng chứng: [AcceptOfferRequest:7](../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/offer/dto/AcceptOfferRequest.java#L7); [OfferAcceptanceServiceImpl:17](../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/offer/OfferAcceptanceServiceImpl.java#L17); [TC-0264](BACKEND_API_RUNTIME_VERIFICATION_VI.md#tc-0264); [TC-0282](BACKEND_API_RUNTIME_VERIFICATION_VI.md#tc-0282).

Tái hiện/đối chiếu: Cùng key với deliveryNote khác vẫn200; đổi đúng customerNote→409. Internal Order dùng deliveryNote, public Marketplace dùng customerNote.

Khuyến nghị: Mapping contract rõ ràng, contract tests và cân nhắc strict unknown-field policy; không đổi semantics âm thầm.

Giới hạn: audit read-only, chưa triển khai remediation; chỉ fixture disposable được phép ghi.

<a id="f-010"></a>

## F-010 · Medium · Feature map chưa trở thành quota enforcement

Trạng thái: **SOURCE_SEARCH_CONFIRMED**.

Ảnh hưởng: Mobile không được coi maxProducts/maxAiGenerations là giới hạn đã được Backend bảo đảm.

Bằng chứng: [ProductServiceImpl:43](../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/feature/product/service/impl/ProductServiceImpl.java#L43); [SubscriptionPlanServiceImpl:20](../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/feature/plan/service/impl/SubscriptionPlanServiceImpl.java#L20); [GenerationServiceImpl:15](../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/generation/GenerationServiceImpl.java#L15).

Tái hiện/đối chiếu: Publish kiểm hasActiveSubscription; toàn corpus không có đọc maxProducts/maxAiGenerations để chặn quota theo số lượng.

Khuyến nghị: Định nghĩa semantic từng feature và enforcement atomic trước quảng bá hạn mức; không bịa quota từ nhãn UI.

Giới hạn: audit read-only, chưa triển khai remediation; chỉ fixture disposable được phép ghi.

<a id="f-011"></a>

## F-011 · Medium · Các adapter media chủ yếu kiểm magic bytes

Trạng thái: **SOURCE_CONFIRMED_NOT_EXPLOIT_TESTED**.

Ảnh hưởng: Có thể lưu file không decode được; không chứng minh RCE/XSS hay exploit storage.

Bằng chứng: [BakeryImageStorage:26](../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/infrastructure/storage/BakeryImageStorage.java#L26); [RequestImageServiceImpl:16](../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/feature/cakerequest/RequestImageServiceImpl.java#L16); [AttachmentValidator:14](../../backend/chat-service/src/main/java/com/se193262/chatservice/feature/message/AttachmentValidator.java#L14); [PaymentProofStorage:25](../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/infrastructure/storage/PaymentProofStorage.java#L25).

Tái hiện/đối chiếu: JPEG/PNG/WebP/PDF dựa chữ ký header và MIME. AI ImageValidator có decode sâu hơn; không suy validator các service giống nhau.

Khuyến nghị: Decode/giới hạn pixel/chuyển định dạng theo nhu cầu, kiểm file malformed và giữ filename sanitation. Chưa chạy malicious-file tests.

Giới hạn: audit read-only, chưa triển khai remediation; chỉ fixture disposable được phép ghi.

<a id="f-012"></a>

## F-012 · Info · Canonical Bakery V1 khác indentation, không khác SQL

Trạng thái: **FORMATTING_ONLY_CONFIRMED**.

Ảnh hưởng: Raw byte/text comparison khác nhưng không có bằng chứng schema drift từ khác biệt này.

Bằng chứng: [comparison](evidence/migration-canonical-comparison.json); [Bakery migration](../../backend/bakery-service/src/main/resources/db/migration/V1__init_schema.sql); [canonical](../../database/postgresql/bakery-service/V1__init_schema.sql).

Tái hiện/đối chiếu: 1/17 file khác sau normalize newline; cùng nội dung khi strip indentation từng dòng. Không được mô tả thành schema mismatch hoặc test failure.

Khuyến nghị: Giữ phân biệt byte equality và SQL equivalence khi kiểm sync; không sửa migration/checksum lịch sử chỉ để làm sạch định dạng.

Giới hạn: audit read-only, chưa triển khai remediation; chỉ fixture disposable được phép ghi.

<a id="f-013"></a>

## F-013 · Low · Readiness endpoints bị từ chối ở4 service

Trạng thái: **RUNTIME_CONFIRMED**.

Ảnh hưởng: Docker Up/healthy theo OpenAPI không phản ánh readiness business từng dependency.

Bằng chứng: [SecurityConfig:33](../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/security/SecurityConfig.java#L33); [health](evidence/isolated-readiness.json).

Tái hiện/đối chiếu: GET /actuator/health: Bakery/Subscription/Order/Chat401, Identity/MarketplaceUP200; business readiness được chứng minh riêng bằng API và DB.

Khuyến nghị: Chuẩn hóa policy health/readiness và kiểm dependency phù hợp, không expose thông tin chi tiết nhạy cảm.

Giới hạn: audit read-only, chưa triển khai remediation; chỉ fixture disposable được phép ghi.

<a id="f-014"></a>

## F-014 · Low · Paging/shape/status khác nhau giữa service

Trạng thái: **SOURCE_AND_OPENAPI_CONFIRMED**.

Ảnh hưởng: Một generic mobile paginator/envelope có thể parse sai hoặc hiển thị lệch trang.

Bằng chứng: [QueryPaging:9](../../backend/marketplace-service/src/main/java/com/se193262/marketplaceservice/shared/QueryPaging.java#L9); [GenerationReader:14](../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/generation/GenerationReader.java#L14); [MessageController:32](../../backend/chat-service/src/main/java/com/se193262/chatservice/feature/message/MessageController.java#L32).

Tái hiện/đối chiếu: Đa số page1; AI page0; chat cursor. Internal raw Map/DTO và ApiResponse lẫn nhau; OpenAPI200 có thể khác controller201/204/202.

Khuyến nghị: Định nghĩa adapter theo contract từng endpoint, cùng contract tests; không tự đổi Backend trong audit.

Giới hạn: audit read-only, chưa triển khai remediation; chỉ fixture disposable được phép ghi.

<a id="f-015"></a>

## F-015 · Low · Order application test có lỗi fixture bind Instant

Trạng thái: **EXISTING_TEST_CONFIRMED**.

Ảnh hưởng: Bộ test không hoàn toàn xanh; không chứng minh production order transition hỏng vì runtime transition đã PASS.

Bằng chứng: [existing tests](evidence/existing-tests.json); [Order test](../../backend/order-service/src/test/java/com/se193262/orderservice/OrderServiceApplicationTests.java#L165).

Tái hiện/đối chiếu: JdbcTemplate fixture setObject(java.time.Instant) không suy ra SQL type. Test error xảy ra khi insert fixture trước assertions.

Khuyến nghị: Dùng binding timestamp đúng kiểu trong bài test ở nhiệm vụ riêng; chạy lại regression, không xóa assertion để xanh.

Giới hạn: audit read-only, chưa triển khai remediation; chỉ fixture disposable được phép ghi.

<a id="f-016"></a>

## F-016 · Info · Logout không thu hồi access JWT tức thì

Trạng thái: **RUNTIME_CONFIRMED_EXPECTED_JWT_MODEL**.

Ảnh hưởng: Token bị lộ còn dùng được đến expiry; cần thiết kế UX/security rõ.

Bằng chứng: [TokenSessionService:18](../../backend/identity-service/src/main/java/com/se193262/identityservice/feature/authentication/TokenSessionService.java#L18); [TC-0225](BACKEND_API_RUNTIME_VERIFICATION_VI.md#tc-0225).

Tái hiện/đối chiếu: Logout revoke refresh và clear cookie; gọi auth/me bằng access token cũ vẫn200.

Khuyến nghị: Xác nhận threat model/TTL và nếu cần thì thiết kế revoke/version check; hiện không gọi đây là chức năng revoke access token.

Giới hạn: audit read-only, chưa triển khai remediation; chỉ fixture disposable được phép ghi.

<a id="f-017"></a>

## F-017 · Info · Hai pipeline tạo order từ offer không cùng đường gọi

Trạng thái: **SOURCE_CALL_TRACE_CONFIRMED**.

Ảnh hưởng: Dễ đọc nhầm method typed không được route gọi và ghi sai contract.

Bằng chứng: [OfferOrderController:10](../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/OfferOrderController.java#L10); [OfferOrderServiceImpl:14](../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/OfferOrderServiceImpl.java#L14); [OrderCreationServiceImpl:24](../../backend/order-service/src/main/java/com/se193262/orderservice/feature/order/OrderCreationServiceImpl.java#L24).

Tái hiện/đối chiếu: Controller internal gọi OfferOrderService, còn createFromAcceptedOffer typed không tìm thấy controller gọi; response/address validation hai nhánh khác nhau.

Khuyến nghị: Giữ contract source-to-route rõ; cân nhắc hợp nhất sau review, không refactor trong audit.

Giới hạn: audit read-only, chưa triển khai remediation; chỉ fixture disposable được phép ghi.
