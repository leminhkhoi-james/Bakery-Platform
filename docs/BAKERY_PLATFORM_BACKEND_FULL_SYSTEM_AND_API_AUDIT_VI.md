# Kiểm toán toàn bộ Backend Bakery Platform và API — tiếng Việt

Ngày kiểm toán: 07/11/2026. Baseline `addfd7746021ef5267b3946e7b1e9cdc6545496a`, nhánh `dev`.

Đã hoàn thành bộ tài liệu và các phép kiểm khả thi trong phạm vi **audit read-only**. Ứng dụng chưa vận hành hoàn chỉnh: Gateway chưa có routing, Cake AI không compile, direct order và danh sách tin nhắn có lỗi đã tái hiện. Không thực hiện remediation.

## 1. Kết luận điều hành

Có **7 microservice nghiệp vụ**, 1 Gateway bootstrap, **113 API**, **37 workflow**, **7 database nghiệp vụ và 49 bảng**. Sáu business service build và chạy thật từ bản sao source ngoài repository. Gateway khởi động rồi exit 0 vì là ứng dụng non-web; Cake AI bị chặn khi biên dịch.

Đã thực thi 323 ca runtime: 306 PASS, 17 FAIL giữ nguyên trong bằng chứng. Có 104 API được gọi, gồm kiểm tra từ chối truy cập; **97 API có ít nhất một phản hồi 2xx PASS**. Case scheduler có assertion DB được đánh dấu riêng, không giả thành HTTP 2xx. Chín API chưa thực thi vì Cake AI không build; tổng 16 API chưa có happy path 2xx.

Các đường đại diện đã chạy gồm auth/refresh replay, onboarding và cấp OWNER, catalog/media/options, RFQ/offer/accept tạo order, vòng đời order và review, thuê bao và gia hạn, chat create/send/replay/read/delete/close. Không đủ căn cứ tuyên bố mọi nhánh hoặc tích hợp mobile đã thành công.

## 2. Phạm vi và phương pháp

Yêu cầu audit-only mới nhất chi phối nhiệm vụ: mọi tệp dự án mới nằm trong `docs/`; không build, test, format hoặc tạo tệp trong `backend`, `frontend`, `mobile`. Không tiếp tục sửa UI hoặc triển khai remediation từ các nhiệm vụ trước đã hoàn thành.

Đã đọc máy và xử lý toàn bộ **644 tệp Backend liên quan**, gồm 509 production Java và 58 test Java. AST không có parse error; có 543 khai báo production, kể cả nested class/record, 42 controller và 1.764 production method entries trong catalogue. Hash, dòng nguồn, DTO, method body và call references được lưu để kiểm lại. Phân tích sâu tập trung vào luồng nghiệp vụ, transaction, authorization và các lỗi thực tế.

Call binding dùng heuristic theo kiểu, interface và module; không coi đó là semantic compiler hoặc chứng nhận đã đọc đúng mọi callback. Method reference, `var`, framework callback, derived query và JPA cascade cần đối chiếu phụ lục nguồn. Không tuyên bố độ phủ semantic branch 100%.

Đếm API theo `service + method + route` sau khi ghép mapping class/method. Kiểm độc lập bằng OpenAPI của sáu JAR mới khớp 104 route. Chín API AI đối chiếu annotation/DTO/source vì không compile. Không cộng actuator, Swagger hoặc đường forward Gateway thành API nghiệp vụ mới.

## 3. Bằng chứng và độ tin cậy

| Bằng chứng | Nội dung | Giới hạn |
|---|---|---|
| [Source manifest](backend-audit/evidence/source-manifest.json) | 644 tệp, SHA-256 và số dòng | Đọc/parse tệp không tự chứng minh mọi semantic branch |
| [API inventory](backend-audit/evidence/api-inventory.json) | 113 route, handler, source và trace | Binding heuristic; cần đọc cùng body và policy |
| [Processing catalogue](backend-audit/reference/SOURCE_PROCESSING_CATALOG_VI.md) | Toàn bộ 1.764 production method entries | Mã nguồn là bằng chứng tĩnh, không phải runtime PASS |
| [Build](backend-audit/evidence/isolated-build.json) | Exit code và lệnh theo module | Package với skipTests không là test thành công |
| [Runtime cases](backend-audit/evidence/runtime-cases.json) | 323 case, HTTP/status/shape | Không lưu token, cookie hoặc response riêng tư |
| [Database metadata](backend-audit/evidence/isolated-database-metadata.json) | Column, constraint, index và Flyway | Cake AI chỉ có DDL schema, không có app chạy |
| [Existing tests](backend-audit/evidence/existing-tests.json) | 148 test, 2 error | Không xanh toàn Maven reactor |
| [Filesystem integrity](backend-audit/evidence/filesystem-integrity.json) | 10.582 tệp và 2.934 thư mục | Docs được hoàn thiện sau scan; cây ứng dụng không ghi tiếp |

## 4. Stack thực tế

Java 21; Spring Boot 4.1.1, Spring Framework/Security 7 theo parent và dependency build; OAuth2 Resource Server/Nimbus RS256/JWK; Maven Wrapper multi-module; PostgreSQL 17/Flyway. Persistence dùng JPA/Hibernate cùng JdbcClient/JdbcTemplate ở một số pipeline, đặc biệt acceptance, from-offer và AI.

Spring MVC REST đồng bộ; không phát hiện broker hoặc service discovery bắt buộc. MinIO phục vụ Bakery/Subscription/Chat; Firebase adapter phục vụ Marketplace/AI. Nguồn có Gemini Interactions adapter nhưng chưa xác minh provider thật do AI không compile. Không suy stack triển khai chỉ từ mô tả lịch sử.

## 5. Cấu trúc repository

Parent Maven gồm `platform-support`, bảy domain service, `api-gateway`, `integration-tests`. Có source `cake-ai-integration-tests` riêng nhưng không nằm trong parent modules hiện tại. `frontend` và `mobile` chỉ được đọc để đối chiếu capability/contract.

`database/postgresql` giữ canonical SQL. Bakery V1 khác indentation so với migration resource, nhưng tương đương sau bỏ thụt đầu dòng; không có bằng chứng khác schema từ chênh lệch định dạng này. Root có 10 Compose variant. Một số launcher hiện hữu ghi `backend/*/target/docker-runtime`, vì vậy không chạy chúng trong audit read-only.

[Source models](backend-audit/reference/SOURCE_MODELS_VI.md) ghi mọi field/annotation/enum. [Processing catalogue](backend-audit/reference/SOURCE_PROCESSING_CATALOG_VI.md) giữ đầy đủ method dài và helper, không chỉ controller.

## 6. Từng microservice


| Microservice | HTTP API | Bảng DB | Happy-path2xx APIs |
|---|---|---|---|
| bakery-service | 42 | 11 | 42 |
| cake-ai-service | 9 | 6 | 0 |
| chat-service | 8 | 5 | 7 |
| identity-service | 10 | 6 | 10 |
| marketplace-service | 18 | 9 | 14 |
| order-service | 10 | 7 | 8 |
| subscription-service | 16 | 5 | 16 |



Identity sở hữu account/role/session; Bakery sở hữu profile/member/catalog/media; Marketplace sở hữu RFQ/offer/durable acceptance; Order sở hữu commercial/address snapshots, lifecycle và review; Subscription sở hữu plan/order/proof/period; Chat sở hữu participant/message/receipt; Cake AI sở hữu revision/execution/design/moderation. Gateway không phải business service thứ tám có API forward đã hoạt động.

## 7. Giao tiếp nội bộ và phụ thuộc

Identity cấp service JWT theo audience/scope. Bakery và Subscription gọi nhau cho entitlement/activation. Marketplace gọi Bakery, Subscription, AI và Order; Order gọi Marketplace, Identity, Bakery; Chat gọi Marketplace/Bakery; AI gọi Marketplace/provider/storage.

Client có timeout và cache token theo implementation cụ thể. Không có XA, message broker hoặc discovery tự phục hồi ngầm định. [Sơ đồ service](backend-audit/diagrams/service-relationships.mmd) phân biệt đường đã chạy và AI đang bị chặn.

## 8. Danh tính, role và session

Access JWT dùng RS256 với RSA 3.072 bit hiện hữu; kiểm issuer, audience, token type và thời hạn. Password/service credential dùng BCrypt; opaque refresh lưu hash SHA-256. Rotation khóa token; replay thu hồi mọi refresh còn active của user. Logout xóa cookie/revoke refresh nhưng không thu hồi access JWT tức thì.

Một user có thể đồng thời CUSTOMER và BAKERY_OWNER. Role trong JWT không thay membership ACTIVE/OWNER của bakery. Sau onboarding phải lấy JWT mới. Không đưa service credential vào Flutter. [Security reference](backend-audit/BACKEND_AUTHORIZATION_AND_SECURITY_VI.md) có ma trận 113 API và policy nguồn từng service.

## 9. Database và schema

Có 7 database logic, 49 bảng nghiệp vụ: Identity 6, Bakery 11, Marketplace 9, Order 7, Chat 5, Cake AI 6, Subscription 5; 17 migration file. Sáu DB ứng dụng chạy 43 bảng. Sáu bảng AI được áp DDL vào DB riêng chỉ để kiểm schema, không giả Flyway/app runtime. Không tính `flyway_schema_history` là bảng nghiệp vụ.

Không có physical FK xuyên database. UUID liên service là tham chiếu logic. [DB reference](backend-audit/BACKEND_DATABASE_AND_DATA_FLOW_VI.md) có từng column/type/null/default/PK/FK/check/index/state/audit/entity/read/write và bảy ER diagram vật lý. Dữ liệu khách hàng sẵn có không được in hoặc chỉnh sửa.

## 10. Tổng API và nhóm chức năng


| Microservice | HTTP API | Bảng DB | Happy-path2xx APIs |
|---|---|---|---|
| bakery-service | 42 | 11 | 42 |
| cake-ai-service | 9 | 6 | 0 |
| chat-service | 8 | 5 | 7 |
| identity-service | 10 | 6 | 10 |
| marketplace-service | 18 | 9 | 14 |
| order-service | 10 | 7 | 8 |
| subscription-service | 16 | 5 | 16 |




| Domain | API operations |
|---|---|
| Bakery/profile/onboarding/membership | 19 |
| Cake AI/design/generation | 9 |
| Catalog/products/options/add-ons/quotes | 23 |
| Chat/conversation/message | 8 |
| Identity/session/service auth | 10 |
| Offer/acceptance | 7 |
| Order/lifecycle/context | 6 |
| RFQ/context | 11 |
| Review/moderation | 4 |
| Subscription entitlement/period | 2 |
| Subscription order | 3 |
| Subscription payment/review | 4 |
| Subscription plan/options | 7 |



Method breakdown: GET 45, POST 46, PATCH 11, PUT 5, DELETE 6; tổng **113**. Gateway có 0 application operation. Existing OpenAPI có 98; sáu JAR mới có 104; cộng 9 API AI nguồn là 113. Mốc lịch sử 107 không phải tổng source hiện tại.

## 11. Đặc tả mọi API

[BACKEND_API_DETAILED_SPECIFICATION_VI.md](backend-audit/BACKEND_API_DETAILED_SPECIFICATION_VI.md) có **113 mục A–K riêng**: nhận diện/mục đích, auth/ownership, request/header/query/body/DTO, response nested/status/example, controller → service → DAO/client/branch, DB effects, rules, failure paths, runtime, source và hệ quả Flutter.

Schema runtime được đối chiếu validation thủ công, không coi OpenAPI required là toàn bộ rule. Map query RFQ/offer và raw Map response có phần giải thích riêng. Mỗi method dài nối tới body đầy đủ; không cắt theo số dòng hoặc thay bằng một câu mô tả route.

## 12. Workflow nghiệp vụ

[37 workflow](backend-audit/BACKEND_BUSINESS_WORKFLOWS_VI.md), mỗi mục đủ 23 trường theo yêu cầu: 26 có đường đại diện runtime PASS, 2 PARTIAL, 6 BLOCKED, 2 DEFECT, 1 NOT_VERIFIED. Đây là phân loại mục tiêu workflow, không là full branch coverage.

Các nhóm gồm Identity/onboarding/catalog/RFQ/offer/accept/order/review/subscription/chat/AI/scheduler/orphan cleanup. Tất cả có source entry/trace và transaction/state/compensation. Không đếm cart UI, revenue UI hoặc tính năng chưa có API thành workflow Backend đã triển khai.

## 13. State machine và invariants

Bakery: DRAFT → PENDING_APPROVAL → ACTIVE, có suspend/activate, trả hồ sơ về DRAFT và close theo nguồn. Product: DRAFT/HIDDEN → PUBLISHED, PUBLISHED → HIDDEN, ARCHIVED terminal. RFQ: DRAFT → OPEN → OFFER_SELECTED/CLOSED/CANCELLED; offer PENDING → ACCEPTED/REJECTED/WITHDRAWN/EXPIRED.

Order: PENDING → CONFIRMED → BAKING → READY → DELIVERING → COMPLETED; chỉ PENDING/CONFIRMED được cancel. Customer không tự complete. Review chỉ sau COMPLETED và một review/order, kể cả đã soft-delete.

Payment SUBMITTED → APPROVED/REJECTED. Subscription order PENDING_PAYMENT → PAYMENT_REVIEW → COMPLETED hoặc quay chờ/hết hạn; period SCHEDULED → ACTIVE → EXPIRED. AI QUEUED → PROCESSING → SUCCEEDED/FAILED/CANCELLED; revision mới từ success/failure. Conversation OPEN → CLOSED, không reopen. Quyền và cạnh cụ thể nằm trong workflow diagrams/reference.

## 14. Database effects và transaction

Local JPA/TransactionTemplate, dirty checking/cascade và JDBC constraints được tách khỏi downstream. Acceptance reserve PREPARED và claim lease trước gọi Order; Order commit rồi Marketplace complete. Có khoảng nhất quán cuối cùng: order đã commit không rollback khi caller timeout. Idempotency, unique offer và claim fencing hỗ trợ replay/recovery.

Payment approve commit period rồi notify Bakery; activation còn pending được scheduler retry. Object PUT/DELETE có compensation/after-commit best effort, không atomic với PostgreSQL. Order snapshots giữ lịch sử khi catalog/address thay đổi; add-on disable và review soft-delete giữ bản ghi.

Sáu assertion dữ liệu đều PASS sau flow. Bốn replay acceptance song song trả cùng kết quả và chỉ một order. Đã tạm dừng Order audit: acceptance trả 503/RETRYING; sau khôi phục, scheduler tự complete SUCCEEDED và chỉ tạo một order. Chưa crash-inject giữa hai DB commit hoặc race hai offer lần đầu; không suy exactly-once toàn hệ thống từ các phép kiểm này.

## 15. Failure paths và dependency unavailable

400 cho binding/DTO/paging; 401 cho session/token; 403 cho quyền/scope hoặc error dispatch; 404 có thể che foreign resource; 409 cho state/key/optimistic conflict; 422 cho business constraint; 503 cho dependency unavailable. Không áp mọi mã cho mọi endpoint: đặc tả có throws/source và HTTP thực từng case.

Firebase/AI chưa khả dụng trả 503 ở draft hợp lệ. RFQ đã OPEN trả 409 trước storage nên không dùng case đó để kết luận storage. Accept dùng `customerNote`; gửi nhầm `deliveryNote` bị bỏ qua trong runtime, không chắc nhận validation error.

## 16. Cấu hình môi trường, Docker và kết quả khởi chạy thực tế

[Configuration/Docker reference](backend-audit/CONFIGURATION_AND_DOCKER_VI.md) có 10 Compose file, container/network/volume/port matrix, 133 Spring variable references cùng nguồn/status/generated/verification. Phân biệt Compose interpolation, container env, Spring default/profile và mounted secrets/config.

Reuse RSA và service credential hiện hữu, không tạo `.env` hay key mới. Chỉ sinh credential cho DB/MinIO/test user mới của project audit bằng CSPRNG; lưu TEMP với ACL, không repository. Không đổi password DB đã initialize, không reuse volume sẵn có cho mutation tests.

[Runtime report](backend-audit/BACKEND_API_RUNTIME_VERIFICATION_VI.md) ghi lệnh build source copy TEMP, mount JAR readonly, sáu app listen 8080 trong Docker và host loopback 18091/18092/18093/18094/18096/18097. Gateway probe 18090 exit 0 non-web; AI build fail. Không test reboot; TEMP không là cấu hình production bền vững.

## 17. Kết quả runtime và kiểm thử

323 runtime cases: **306 PASS / 17 FAIL**, raw pass rate 94,74%. Có 13 FAIL do giả định/fixture harness đã được phân tích và kiểm đúng lại; 4 FAIL thuộc hai implementation defects: direct order một case, Chat list ba case. Không sửa lịch sử FAIL để làm đẹp tỷ lệ.

RuntimeEndpointCoverage = 104/113 (92,04%). RuntimeSuccessCoverage theo định nghĩa “ít nhất một case PASS”, kể cả negative, cũng 104/113. **Business 2xx coverage = 97/113 (85,84%)**. Chín API chưa thực thi; 16 chưa có 2xx PASS. Báo cáo runtime liệt kê từng ID và lý do.

Existing tests cuối có 148 test, 146 PASS, 2 error, không assertion failure/skipped. Error Chat trùng SQL runtime; error Order ở fixture JdbcTemplate bind Instant, không đồng nghĩa lifecycle Order hỏng vì flow HTTP đã PASS. Cake AI và toàn reactor chưa xanh. Không chạy tải lớn, cloud/email/payment thật hoặc tích hợp native.

## 18. Defects và risk findings

Có **17 findings: Critical 0, High 5, Medium 6, Low 3, Info 3**. High gồm Gateway non-web, AI compile, address contract làm direct order lỗi, Chat SQL, và deployed image/grant drift. Các mục khác phân biệt code defect, contract risk, cấu hình và hành vi có chủ đích.

[Findings reference](backend-audit/BACKEND_AUDIT_FINDINGS_VI.md) có ID, severity, độ xác minh, source/case, cách tái hiện, ảnh hưởng, đề xuất và giới hạn. Bakery canonical SQL chỉ khác định dạng được ghi Info, không gọi là schema drift. Chưa áp dụng bất kỳ sửa lỗi nào vào source.

## 19. Sai lệch tài liệu và mã nguồn

Architecture còn một số mô tả planned trong khi frontend/mobile UI đã có; điều đó không chứng minh Backend integration. Mốc API 107 khác source 113; deployed JAR chỉ có 98 route so với 104 của JAR mới. External grants cũ thiếu hai scope onboarding mới.

Canonical Bakery V1 khác indentation, không khác SQL sau đối chiếu thụt đầu dòng. Không sửa migration/checksum. 35 màn UI không tương đương 35 capability Backend sẵn sàng, nhất là profile/address/admin-users/revenue/AI 3D.

## 20. Bảo mật và phân quyền

Đã kiểm anonymous surface của 104 operation, foreign bakery 403, foreign order 404, refresh replay family revocation, user/service token và correlation/scope đại diện. Negative PASS không là business success. Policy filter và `@PreAuthorize` được giữ đầy đủ trong security reference.

Access JWT sau logout còn hợp lệ đến expiry. Không thấy rate limiter, OTP hoặc public password recovery trong inventory. Signed URL có expiry nhưng chưa kiểm mọi đường download/expiry trên từng adapter. Không thực hiện pentest tải, token/key compromise hoặc exploit upload; không suy lỗ hổng RCE/XSS từ kiểm magic bytes.

## 21. Contract và tính nhất quán API

Controller/runtime có 201/204/202 khác OpenAPI default 200 ở một số route. Internal raw Map/DTO và ApiResponse không đồng nhất. AI page 0 khác page 1 và chat cursor. DTO required không thể hiện hết validation thủ công; PATCH null khác PUT replace.

Public accept dùng `customerNote`, internal Order dùng `deliveryNote`; runtime đã chứng minh nhầm tên có thể mất note. Body token không có refresh token. Các khác biệt này được ghi ở từng API và contract Flutter, không tự chuẩn hóa bằng sửa source.

## 22. Sẵn sàng cho Flutter

**Chưa sẵn sàng tích hợp toàn bộ mobile.** Public catalog/auth/subscription và RFQ/offer/order-from-offer có đường PASS để chuẩn bị adapter. Public address CRUD thiếu là blocker cho end-user đặt hàng. Direct checkout, chat list, AI và Gateway cần sửa/bổ sung trước khi bật flow đầy đủ.

Mobile hiện tại vẫn offline, giữ nguyên 35 màn hình và source/build. Không tạo Dart model, API repository hoặc backend giả. [Mapping 35 màn hình](backend-audit/BACKEND_TO_FLUTTER_API_CONTRACT_REFERENCE_VI.md) nêu API, quyền và capability chưa có, gồm khác biệt quyền hoàn tất order của customer.

## 23. Thứ tự xử lý và tích hợp đề xuất

1. Chốt Gateway/base URL, deployed version và external grants khớp JAR.
2. Sửa AI compile, direct address contract, Chat SQL/error mapping; giữ regression cases.
3. Bổ sung public profile/address và phạm vi admin-user đã được duyệt.
4. Tích hợp public read/auth cookie adapter, rồi onboarding/subscription/RFQ/offer/order/review.
5. Kiểm chat paging/receipts/files và AI provider/storage/moderation/lease trong sandbox được phép.
6. Chốt revenue/quota/dashboard contract; không dùng số fixture làm dữ liệu API.

Đây là khuyến nghị kế tiếp, ngoài audit-only; chưa thực hiện remediation hoặc native integration.

## 24. Giới hạn và phần chưa xác minh

Chín AI API chưa runtime, bảy API khác chưa có 2xx PASS. Workflow dọn object orphan chưa được trigger riêng; hai workflow partial và hai có defect. Các job expiry đã được kiểm bằng đổi ngày của fixture tổng hợp, không gán status trực tiếp; scheduler thực thay trạng thái. Chưa kiểm crash recovery giữa commit, race accept hai offer đầu tiên, load, mọi presigned download, native cookie QA, cloud provider hoặc reboot.

AST binding không giải hoàn hảo method references/`var`/framework callbacks. SQL, DTO, entity, policy và body đầy đủ được giữ để reviewer kiểm lại. Không khẳng định semantic coverage 100% hoặc mọi business branch đã chạy.

Stack audit được giữ để review với dữ liệu tổng hợp; credentials chỉ TEMP. Existing `bakery-local` volumes không bị seed/reset. Không chạy down-v/prune/reset hoặc fabricate external credential để che blocker. Core chạy được đến mức evidence đã ghi, không gọi đó là toàn ứng dụng đã hoàn chỉnh.

## 25. Đánh giá cuối và danh sách bàn giao

Đã hoàn thành bộ tài liệu Backend read-only với bằng chứng source, schema, API và runtime. Giữ nguyên audit/mobile artifacts lịch sử. Không đánh đồng audit hoàn tất với remediation hoặc vận hành toàn ứng dụng đã hoàn tất.

Filesystem guard kiểm 10.582 tệp với hash/size/mtime và 2.934 thư mục: **không thay đổi, không lỗi đọc**. Git diff ngoài `docs/` rỗng; không stage/commit. Bộ tài liệu có script tái tạo và evidence đã lọc. [Kiểm tra artifacts](backend-audit/evidence/artifact-validation.json) đối chiếu cấu trúc, liên kết và secret exact-match; [16 sơ đồ Mermaid](backend-audit/evidence/mermaid-validation.json) đã parse thành công, chưa render thành ảnh.


| Báo cáo | Đường dẫn |
|---|---|
| BACKEND_API_DETAILED_SPECIFICATION_VI.md | [Mở](backend-audit/BACKEND_API_DETAILED_SPECIFICATION_VI.md) |
| BACKEND_BUSINESS_WORKFLOWS_VI.md | [Mở](backend-audit/BACKEND_BUSINESS_WORKFLOWS_VI.md) |
| BACKEND_DATABASE_AND_DATA_FLOW_VI.md | [Mở](backend-audit/BACKEND_DATABASE_AND_DATA_FLOW_VI.md) |
| BACKEND_AUTHORIZATION_AND_SECURITY_VI.md | [Mở](backend-audit/BACKEND_AUTHORIZATION_AND_SECURITY_VI.md) |
| BACKEND_API_RUNTIME_VERIFICATION_VI.md | [Mở](backend-audit/BACKEND_API_RUNTIME_VERIFICATION_VI.md) |
| BACKEND_TO_FLUTTER_API_CONTRACT_REFERENCE_VI.md | [Mở](backend-audit/BACKEND_TO_FLUTTER_API_CONTRACT_REFERENCE_VI.md) |
| BACKEND_AUDIT_FINDINGS_VI.md | [Mở](backend-audit/BACKEND_AUDIT_FINDINGS_VI.md) |
| Docker/environment | [Mở](backend-audit/CONFIGURATION_AND_DOCKER_VI.md) |


