# Project Status

> Cập nhật gần nhất: 2026-11-11.

## Gộp env backend local — 2026-11-11

- Theo yêu cầu người dùng, gộp 8 module .env thành backend/.env (Git ignored), mẫu chung backend/.env.example không có secret thật. Xóa các .env riêng sau khi backup vào .local/backups/shared-env-*. Cấu hình local khác/root Docker env và toàn bộ database không đổi.
- Working directory của cả 8 app là backend, IntelliJ project backend dùng $PROJECT_DIR$, không cần additional config arguments. Key JWT được tham chiếu tương đối từ backend tới identity-service/.keys, không đổi nội dung key.
- Tách SERVER_PORT thành 8 biến *_SERVER_PORT. Marketplace/Cake AI dùng *_CLIENT_ID và *_CLIENT_SECRET riêng để không ghi đè nhau trong file chung. Các biến SERVER_PORT/SERVICE_CLIENT_* của container vẫn được hỗ trợ qua fallback. Giữ nguyên các giá trị DB, client secret/hash, Firebase, storage và merchant VNPay hiện tại.
- Package cả 8 ứng dụng qua, kiểm tra port riêng và template không chứa secret thật qua. Không push.
- Kiểm chứng khởi động cả 8 app với working directory backend và cùng một .env qua; Identity/Bakery/Marketplace cũng kiểm tra OpenAPI 200. Lượt probe đồng thời chạm giới hạn kết nối PostgreSQL, đã dừng và chỉ chạy lại Bakery/Marketplace với pool nhỏ cho probe; không sửa pool/DB của app thật. Toàn bộ process kiểm tra đã dừng, không tạo user/giao dịch hoặc chạy test suite.

## Sửa Swagger register qua Gateway local — 2026-11-11

- Xác nhận OpenAPI tại /identity/v3/api-docs qua Gateway sinh servers=http://localhost:8080 thiếu /identity, khiến Try it out gọi /api/v1/auth/register và 404. Forwarded-header handling trước đó chỉ nằm ở cấu hình runtime/Docker đã bỏ khi dọn local.
- Bật server.forward-headers-strategy=framework trong application.yml của 7 service. Gateway bật trusted proxy processing cho loopback và không append prefix trùng; doc routes dùng Forwarded host/protocol thay PreserveHostHeader để tương thích JDK HTTP client. Không thêm endpoint hoặc sửa đăng ký/phân quyền/frontend.
- Package Identity/Gateway qua; 4 GatewayCorsTest qua, thêm regression chuyển đúng một prefix tới docs downstream. Kiểm tra 2 app thực trên cổng tạm: Swagger qua Gateway sinh /identity đúng, direct Identity giữ URL riêng, gọi register từ server URL đó với body rỗng nhận 400 validation thay vì 404. Không tạo tài khoản, các app IDE đang chạy không bị restart, chưa push.

## Cấu hình local đơn giản — 2026-11-11

- Theo yêu cầu người dùng, bỏ launcher/config native: mỗi module dùng một .env, Working directory trỏ module, không còn additional config arguments. Tất cả DB URL là localhost:5432 với tên thường identity_db, bakery_db, marketplace_db, subscription_db, cake_ai_db, order_db, chat_db. Không thay nghiệp vụ/API.
- Giữ dữ liệu DB thường cũ theo lựa chọn người dùng, không nhập fixture test. Bakery cũ có 0 dòng nghiệp vụ và V1 lệch checksum: backup pg_dump và giữ nguyên DB schema cũ bằng tên bakery_db_schema_backup_20261111045214, tạo bakery_db mới để Flyway khởi tạo đúng. Subscription giữ nguyên 3 plan/9 feature và dữ liệu hiện có; các DB thường còn thiếu được tạo. Toàn bộ bakery_native_* giữ nguyên để đối chiếu.
- Đã xóa 6 log backend người dùng chụp, 8 file .env.native.properties và 3 file launcher/hướng dẫn native do agent thêm. Cấu hình cũ/backup và storage data giữ tại .local/ ignored; key JWT hiện dùng đặt riêng trong Identity .keys/. Các secret nội bộ vẫn khớp hash Identity, VNPay credentials giữ trong Subscription .env ignored.
- Bổ sung import .env ở Order/Chat/Cake AI/Gateway để Run từ module nhất quán; sửa default Identity URL của Subscription về 8081. Biến SUBSCRIPTION_BAKERY_SERVICE_TOKEN được ghi rõ để trống: client tự xin JWT bằng secret, không bắt buộc token tĩnh.
- Đã dừng các process launcher cũ do agent mở, giữ các process người dùng tự Run. Storage có lệnh Node trực tiếp, frontend chạy npm run dev. Chưa push.
- Kiểm chứng: package cả 8 ứng dụng qua; một lượt khởi động từ từng module chỉ dùng .env trên cổng tạm, 7 Flyway/JPA và 8 OpenAPI 200 qua, sau đó dừng toàn bộ process kiểm tra. Không chạy test suite hoặc giao dịch/cloud. Xem docs/LOCAL-SETUP.md.

## CORS trên toàn bộ backend và Gateway — 2026-11-11

- 42 controller của 7 service dùng `@CrossOrigin(originPatterns = "*", allowCredentials = "true")`, tương thích FE gửi credentials. Spring Security đọc annotation bằng `.cors(Customizer.withDefaults())`; JWT/role/ownership không thay đổi.
- Bỏ filter CORS và cấu hình origin riêng ở các domain service. Gateway giữ cấu hình nhỏ chỉ trả lời preflight OPTIONS; request thật lấy header từ controller downstream. Không thay frontend.
- Gateway đã có springdoc UI 3.1.0 và 7 OpenAPI proxy URL. Xem `docs/CORS-DEV.md` cho cách dùng và hướng dẫn restart/build.
- Kiểm chứng: compile cả 7 service và Gateway qua; 5 test CORS/Swagger tập trung qua; Compose config hợp lệ. Chưa build/restart container hoặc push code.

## Approval before subscription purchase — 2026-11-11

- ADR-007 makes profile approval precede subscription purchase. Subscription now
  validates the Bakery internal profile is ACTIVE after checking OWNER membership
  at order creation, VNPay checkout and manual evidence submission. Non-ACTIVE
  returns 409; unavailable/malformed validation fails closed. Existing IPN settlement
  and admin review remain intact for payments already initiated/collected.
- Partner modal shows the payment step as waiting and disables order creation and
  payment details until an ACTIVE profile is returned. Existing history stays
  readable; initial period/renewal timing and role activation rules are unchanged.
- Validation: production FE build and Chrome approval transition regression pass;
  19 backend tests in BakeryApprovalGateTest, PaymentReviewTest and VnpayServiceTest
  pass. Existing subscription-ui suite still has two unrelated expectations failing
  (generic auth error wording and obsolete manual bakery selector text).
- Source changes tested; running backend deployment has not been restarted.

## Customer notification placeholder — 2026-11-11

- Removed hardcoded customer bell notifications, unread count, relative times
  and demo request/order references. No user notification API exists in backend.
- Guests see a sign-in prompt; signed-in users see an availability message and
  links to their existing order tracking and cake request pages. No fabricated
  unread state or events. Frontend production build passes.

## Admin user actions — 2026-11-11

- User tables now show one primary edit/role action and an overflow popover for
  status/delete actions. Shared by local and API directories; existing mutation
  permissions, unsupported profile editing and confirmation dialogs are retained.
- Popover uses the browser top layer to avoid table clipping, supports keyboard
  activation/Escape/outside dismissal and keeps destructive actions separate.
  Role selections now have full clickable rows with clear checked states.
- Validation: production build, 11 review workflow tests and a Chrome browser
  regression covering desktop/mobile, keyboard and confirmation behavior pass.

## Admin revenue/order data — 2026-11-11

- Revenue no longer mounts BusinessSimulationReport or includes local simulated
  payments. Approved backend payments (VNPay and manual) are counted once per
  subscription order; plan lookup bypasses mock fallback.
- Order activity reads every page of GET /api/v1/orders?scope=all, filtered by
  bakery and Vietnam creation dates. Unsupported simulated payment, dispute,
  request and offer counters were removed from this report. Cake order value
  excludes cancelled orders and is explicitly not collected sales revenue.
- Admin order detail now also bypasses simulation; the existing admin list
  already used the real API. Empty API results remain empty; failures show retry.
- Validation: frontend production build, 27 existing admin/dashboard tests and
  4 API regression tests pass. Full lint remains blocked by the existing parse
  error in UnifiedSourceNotice.jsx and unrelated repository warnings.

## Runtime — Kiểm tra IPN và chờ cấu hình trên VNPay SIT — 2026-11-11

- Tunnel IPN public đang hoạt động. Kiểm tra không chữ ký trả RspCode 97; kiểm tra
  chữ ký merchant hợp lệ với reference ngẫu nhiên không tồn tại trả HTTP 200/
  RspCode 01. Hai probe không thay đổi đơn hoặc kích hoạt gói.
- Logic settlement vẫn tạo payment APPROVED và kỳ subscription trong cùng
  transaction sau khi IPN thành công được xác minh. Chưa nhận được xác nhận giao
  dịch VNPay thật để kiểm thử activation end-to-end.
- Đã mở cổng VNPay Sandbox SIT Testing và chuẩn bị email merchant. Cấu hình IPN
  trên phía VNPay chưa được lưu vì đang chờ người dùng đăng nhập trực tiếp vào
  cổng merchant; không có mật khẩu merchant trong cấu hình backend.

## Runtime — Khôi phục admin từ dữ liệu Identity cũ — 2026-11-11

- Theo yêu cầu rõ ràng của người dùng, khôi phục tài khoản admin cùng email từ
  bakery-owner-dev_identity-data sang bakery-platform_identity-data đang chạy.
  Chép nguyên BCrypt hash và bộ quyền ADMIN/CUSTOMER; giữ ID hiện tại để bảo toàn
  liên kết dữ liệu. Thực hiện trong một transaction, kiểm tra hash/bộ quyền khớp
  bản nguồn và lưu backup trước thao tác bằng Windows DPAPI trong thư mục ignored.
- Thu hồi refresh sessions của riêng tài khoản khôi phục để lần đăng nhập mới
  nhận đúng quyền. Database cũ được trả về trạng thái dừng như trước khi đọc.
- Đã xác minh qua frontend localhost: đăng nhập 200, /auth/me có ADMIN,
  /admin/users trả 200 và logout phiên kiểm thử 200. Không ghi password/hash/token
  vào source hoặc log. Kiểm thử credential qua tunnel không thực hiện vì bị
  auto-review chặn; xác minh localhost đã hoàn tất.

## Runtime — Sửa xác thực qua tunnel HTTPS — 2026-11-10

- Auth refresh từ origin tunnel bị Identity CORS chặn 403 vì cấu hình chỉ có
  localhost. Compose hiện truyền IDENTITY_CORS_ALLOWED_ORIGINS; `.env` local bổ
  sung đúng origin tunnel, không dùng wildcard. Recreate riêng Identity Service.
- Kiểm tra refresh không cookie qua proxy: localhost/tunnel đều trả 401 và được
  CORS cho phép; origin lạ vẫn 403. Gọi qua hostname public cũng trả 401 thay vì
  403. Người dùng cần đăng nhập cùng tài khoản trên public hostname vì cookie
  localhost không chia sẻ sang hostname khác. Chưa dùng phiên người dùng để
  xác minh nội dung một đơn cụ thể.

## Runtime — Bật merchant VNPay Sandbox — 2026-11-10

- Đã nhận thông tin merchant do người dùng cung cấp, lưu riêng trong `.env` được
  Git ignore và recreate riêng Subscription Service để nhận cấu hình. Không ghi
  khóa vào source, example files hoặc tài liệu.
- Tunnel frontend đang chạy; return URL dùng route frontend trên cùng tunnel.
  Kiểm tra qua URL công khai: IPN không chữ ký trả HTTP 200/RspCode 97, return
  không chữ ký trả 400. Lỗi thiếu cấu hình merchant đã được giải quyết.
- Cần khai báo `/api/v1/payments/vnpay/ipn` trên hostname tunnel vào merchant/SIT
  của VNPay để nhận kết quả và kích hoạt gói. Chưa thực hiện giao dịch thẻ Sandbox.

## Runtime — Cập nhật Subscription container cho VNPay — 2026-11-10

- Phát hiện container local còn image cũ: endpoint IPN mới trả JWT 401, checkout
  từ frontend bị 403 dù source đã có matcher CUSTOMER/BAKERY_OWNER.
- Đóng gói JAR, build runtime image và recreate riêng Subscription Service trong
  project bakery-platform; không recreate database hoặc service khác. Flyway đã
  áp dụng V5 thành công trên subscription_db hiện hữu.
- Kiểm tra trực tiếp 8084 và qua proxy frontend 5173: IPN hiện trả protocol HTTP
  200/RspCode 99 khi chưa cấu hình; return verifier trả 503 "VNPay is not configured".
  Merchant chưa được cấu hình nên chưa thể kiểm thử checkout trên VNPay thật.

## Frontend — Thanh toán VNPay cho đơn mua gói — 2026-11-10

- Chi tiết đơn dùng chung ở đăng ký tiệm và quản lý gói có nút thanh toán VNPay
  Sandbox, gọi checkout thật và chuyển hướng tới URL sandbox đã kiểm tra host.
  Không gửi số tiền từ client. Chuyển khoản thủ công được giữ trong mục mở rộng;
  chỉ dùng tài khoản do API cung cấp, mã mẫu chỉ hiện trong development.
- Trang `/subscription-vnpay-return` xác minh query qua backend và đọc trạng thái
  persisted. Chỉ SUCCEEDED hiển thị thành công; PENDING kiểm tra lại có giới hạn,
  FAILED/REVIEW_REQUIRED/lỗi xác minh có nội dung và hành động riêng. Không gọi
  IPN, không tự duyệt, không suy ra thành công từ query trình duyệt.
- Lưu order/bakery theo attempt trong sessionStorage để mở lại đúng đơn; không
  lưu token hoặc dùng storage làm nguồn xác nhận thanh toán. Auth/ownership của
  workspace giữ nguyên. Vite proxy bổ sung return/IPN/admin reconciliation.
- 35 test VNPay/subscription pass, gồm 3 bài Chrome headless với fixture API:
  redirect, lỗi cấu hình, manual fallback, polling và các trạng thái kết quả.
  Production build và lint các file VNPay mới pass. Bộ UI subscription cũ còn
  hai assertion lệch copy/selector; lint toàn dự án còn parse error ở
  UnifiedSourceNotice.jsx ngoài phần sửa này.
  Đã xem ảnh checkout ở 1440/1024/820/768/390 px và trang kết quả ở 390 px.
- Để chạy với merchant sandbox, cấu hình return URL về frontend (local mặc định
  `http://localhost:5173/subscription-vnpay-return`); IPN vẫn là endpoint backend
  public. Chưa có giao dịch qua merchant thật trong lượt kiểm thử fixture.

## Backend — VNPay Sandbox cho mua gói tiệm — 2026-11-10

- Thêm checkout VNPay PAY 2.1.0 cho subscription order: kiểm tra OWNER membership,
  lấy giá VND snapshot từ server và lưu attempt trước khi trả URL ký HMAC-SHA512.
- IPN xác minh chữ ký/merchant/reference/amount/hai mã kết quả; ghi payment
  APPROVED, hoàn tất order và tạo đúng một kỳ trong cùng transaction. Return URL
  chỉ đọc. Callback trùng không kích hoạt lại; transaction number không dùng lại.
- V5 thêm vnpay_attempts và verification_source; gateway không giả mạo admin ID.
  Manual evidence vẫn dùng ADMIN review; active checkout chặn gửi thủ công.
- Callback đã trả tiền nhưng xung đột được lưu REVIEW_REQUIRED; ADMIN có API
  danh sách đối soát. Duy trì notification Bakery sau commit và cơ chế retry cũ.
- Đã chạy bộ test Subscription Service, gồm PostgreSQL Testcontainers: migration,
  thanh toán thủ công, IPN đồng thời, chống tái sử dụng giao dịch và rollback đều
  pass. Unit tests kiểm tra chữ ký, sai amount/merchant, giả mạo callback, return
  không kích hoạt, giao dịch thất bại, thời gian thanh toán và checkout retry.
- Cấu hình mặc định tắt. Chưa thực hiện giao dịch trên website VNPay vì cần
  TmnCode/HashSecret merchant và public HTTPS IPN URL. Frontend đã nối nút và
  trang kết quả ở mục cập nhật phía trên. Hướng dẫn tại
  [VNPAY-SANDBOX.md](VNPAY-SANDBOX.md); quyết định tại ADR-006.

## Frontend — Đồng bộ luồng customer trở thành chủ tiệm — 2026-11-10

- Bổ sung lối vào “Theo dõi đăng ký tiệm” ngay đầu trang gói. Màn hình tiến độ hiển thị riêng hồ sơ và thanh toán/gói, điều kiện còn thiếu cùng thời điểm cập nhật; nút kiểm tra đọc lại toàn bộ dữ liệu liên quan và có timeout, không tự phê duyệt.

- Trang mở tiệm đã có tích hợp API thật trong code hiện tại. Hoàn thiện bước theo dõi hồ sơ và tự làm mới access token/profile khi backend cấp `BAKERY_OWNER`; không gọi thêm API hoàn tất onboarding và không bắt đăng nhập lại.
- Luồng onboarding, subscription và admin duyệt hồ sơ/chứng từ dùng `allowMockFallback: false`. Unified transport tôn trọng lựa chọn này, không trộn hoặc thay bằng dữ liệu mô phỏng.
- Bỏ số tài khoản và ảnh QR ngân hàng hardcode trong form thanh toán. Chỉ hiện thông tin tài khoản khi API cung cấp đầy đủ; thiếu cấu hình vẫn gửi được mã tham chiếu hoặc chứng từ để admin duyệt. Mã test local không tự kích hoạt gói, không có thanh toán tiền thật trong lần kiểm tra.
- Gửi lại chứng từ sau lỗi kết nối giữ nguyên payload và idempotency key. Thông báo phân biệt đã gửi chứng từ, hồ sơ đã duyệt và gói đang có hiệu lực.
- Kiểm tra local: tạo customer mới, gửi hồ sơ/tạo đơn/gửi tham chiếu từ giao diện; duyệt hồ sơ và chứng từ qua API admin. FE tự chuyển sang đúng tiệm, trang gói hiển thị kỳ `ACTIVE` và đơn `COMPLETED`. Không thay đổi backend hoặc API spec trong lần này.
- 78 kiểm tra tập trung cho auth, subscription, admin review và unified transport đã qua. Frontend production build qua.
> Cập nhật gần nhất: 2026-11-10.

## Gateway business flows and live Cake AI — 2026-11-10

- 215 HTTP/invariant checks passed across onboarding, subscription, catalog,
  RFQ/offers, direct/accepted-offer orders, fulfillment, reviews, chat, replay,
  concurrency, cancellation and quota. All calls used Gateway public routes.
- Real Gemini original/refinement both SUCCEEDED; 6 provider calls within a
  9-call reservation ceiling. Firebase, signed URLs, admin review and AI design
  → completed order → review passed. Cancellation/quota added no provider calls.
- Added resumable Gateway workflow scripts and `compose.gateway-e2e.yaml`.
  Scoped credentials/state remain Git-ignored, with no secrets in evidence.
- Fixed default Order/Identity grants for `bakery:catalog:quote`; rebuilt and
  deployed both, then verified concurrent direct creation without overrides.
- Maven reactor: 242 passed, 1 setup error in old MarketplaceEndToEndTest
  (missing Bakery JWK URI in isolated-e2e). Follow-up token test/package passed.
- Generation/scheduler disabled afterward; all applications kept healthy.
  Details and limits: `docs/GATEWAY-E2E-REPORT-VI.md`.

## Seven-service Gateway runtime — 2026-11-10

- Added `compose.gateway.yaml` and `scripts/Start-GatewayStack.ps1` to package,
  build and start seven domain services plus Spring Cloud Gateway Web MVC,
  seven PostgreSQL databases and three MinIO instances. Gateway: localhost:8080.
- Running project: `bakery-gateway`, separate persistent volumes. The existing
  `bakery-platform` Identity database has V1/V2 Flyway checksum mismatches;
  no repair, schema-history edits or old-volume deletion were performed.
- Fixed runtime health checks to use the actual service ports; Cake AI uses
  readiness. Added its missing Springdoc dependency for the Gateway docs route.
- Gateway rewrites Identity refresh-cookie Path for the `/identity` prefix.
  Swagger proxy routes preserve the public host/prefix; the local Compose
  configuration handles forwarded headers from loopback/Docker bridge ingress.
- `scripts/Test-GatewayStack.py` passed 44 checks: Gateway health, seven OpenAPI
  schemas and public server URLs, missing/invalid JWT rejection, registration,
  login, authenticated reads to all seven services, refresh, logout and cleanup
  of its temporary customer. Evidence: `docs/audit/evidence/gateway-smoke.json`.
- Maven packaging for all eight applications and the existing Gateway context
  test passed. All eight applications were healthy at handoff. Scope is HTTP
  routing/authentication smoke coverage; business transaction flows were not
  exercised. AI generation, scheduler and cloud cleanup remain disabled in this
  launcher. Instructions: `docs/DOCKER-GATEWAY.md`.

- **Frontend — Sửa lỗi giao diện Modal Đăng ký Đối tác, Đồng bộ Sổ địa chỉ & Chuẩn hóa Thông báo Người dùng — 2026-11-09**:
  - **Chuẩn hóa thông báo & loại bỏ thuật ngữ kỹ thuật**:
    - Chuyển toàn bộ các thông báo mang tính kỹ thuật hệ thống (`Backend`, `PENDING`, `APPROVED`, `PAYMENT_REVIEW`, `COMPLETED`, `cấp quyền`) sang văn phong nghiệp vụ thân thiện với người dùng (tiệm bánh và khách hàng).
    - Cập nhật huy hiệu trạng thái: `Đang chờ duyệt`, `Đã duyệt`, `Cần bổ sung`, `Bản nháp`.
    - Thiết kế lại toàn diện khu vực Thanh toán gói dịch vụ (`SubscriptionOrderDetail`):
      - Bổ sung **Mã VietQR tự động** tích hợp sẵn ngân hàng, số tài khoản, số tiền và nội dung chuyển khoản, giúp người dùng quét mã thanh toán ngay trên ứng dụng ngân hàng mà không cần nhập tay.
      - Bổ sung nút **[Sao chép] 1 chạm** cho Số tài khoản, Số tiền và Nội dung chuyển khoản kèm hiệu ứng phản hồi trực quan.
      - Tích hợp công cụ **"Tạo giao dịch ảo test" (Sandbox Simulator)**: Hỗ trợ 1-click tự động vẽ biên lai chuyển khoản Vietcombank giả lập hợp lệ kèm mã giao dịch mẫu từ tài khoản ảo, giúp người phát triển/kiểm thử nộp thẳng chứng từ thanh toán lên Backend kiểm tra luồng duyệt mà không cần chuyển tiền thật hay chuẩn bị ảnh thủ công.
      - Thay thế input file mặc định bằng **Khu vực tải ảnh biên lai chuyên nghiệp**: Hỗ trợ xem trước ảnh (preview thumbnail), tên tệp, dung lượng và nút xóa/thay đổi tệp.
      - Ẩn menu dropdown thừa khi chỉ có 1 đơn mua gói duy nhất, mở thẳng giao diện thanh toán liền mạch.
    - Việt hóa thông báo lỗi `Bakery already has an open subscription order`: *"Tiệm bánh đã có một đơn mua gói đang chờ xử lý bên dưới. Vui lòng thanh toán hoặc hoàn tất đơn này trước khi tạo đơn mới."*
    - Chuẩn hóa hướng dẫn thanh toán gói: Hướng dẫn chuyển khoản rõ ràng, hiển thị tên phương thức *"Chuyển khoản ngân hàng (Ủy nhiệm chi)"* thay vì text field kỹ thuật `BANK_TRANSFER`.
    - Nâng cấp `ApiErrorMessage` và `SubscriptionError`: Bổ sung mapping thông báo lỗi trực quan từ Backend sang tiếng Việt dễ hiểu (`Bakery approval and an active subscription are required`, `Delivery area is not served`, ...).
  - **Căn giữa Modal Đăng ký Đối tác (`PartnerCheckoutModal`)**: Khắc phục lỗi dialog bị lệch góc trên bên trái do thiếu thuộc tính căn giữa native `<dialog>` (`inset: 0; margin: auto;`). Bổ sung class `.sc-partner-modal` trong [`modal.css`](file:///d:/MSS/Bakery-Platform/frontend/src/components/common/modal.css) và backdrop blur chuẩn chỉn cho toàn màn hình.
  - **Đồng bộ Sổ địa chỉ cá nhân (`UserAddressBook`)**: Chuyển đổi 100% việc lưu trữ địa chỉ nhận hàng của khách từ `localStorage` sang Backend API thật (`GET / POST / PATCH / DELETE / PUT default` tại `/api/v1/users/me/addresses`), dùng chung dữ liệu với Cart Checkout.

## Luồng Hoàn tất Đơn hàng theo chuẩn Shopee & Tự động hoàn tất sau 24 giờ — 2026-11-09

- **Backend (`order-service`)**:
  - Cập nhật phân quyền chuyển trạng thái trong `OrderManagementServiceImpl.java`:
    - Khách hàng (`CUSTOMER`) sở hữu đơn hàng được phép chuyển trạng thái đơn hàng sang `COMPLETED` (Xác nhận đã nhận hàng) khi đơn đang ở trạng thái `DELIVERING`.
    - Tiệm bánh (`BAKERY_OWNER`) quản lý các khâu làm bánh và giao bánh (`CONFIRMED` -> `BAKING` -> `READY` -> `DELIVERING`), không được tự ý hoàn tất đơn sớm của khách.
  - Xây dựng tiến trình nền tự động hoàn tất `OrderAutoCompletionScheduler` (`@Scheduled` định kỳ):
    - Quét các đơn hàng đang ở trạng thái `DELIVERING` có thời gian cập nhật quá thời hạn 24 giờ (`order.auto-completion.delay-hours: 24`).
    - Tự động hoàn tất đơn sang `COMPLETED` với lý do *"Hệ thống tự động hoàn tất sau 24 giờ kể từ khi giao hàng"*.
  - Bổ sung truy vấn `findAllByStatusAndUpdatedAtBefore` trong `CustomerOrderRepository`.
  - Bổ sung unit tests cho phân quyền chuyển trạng thái (`OrderManagementAuthorizationTest`) và tiến trình tự động hoàn tất (`OrderAutoCompletionSchedulerTest`).
- **Frontend**:
  - `orderModels.js`: Cập nhật `allowedOrderActions` cho phép khách hàng nhấn `COMPLETED` khi đơn ở trạng thái `DELIVERING`, ẩn nút `COMPLETED` phía tiệm bánh.
  - `OrderStatusActions.jsx`: Tối ưu giao diện nút hành động cho khách hàng:
    - Nút **"Đã nhận được bánh"** (Icon `check_circle`), form xác nhận *"Xác nhận đã nhận bánh?"*, nút hành động *"Tôi đã nhận đủ bánh"*, gợi ý kiểm tra bánh trước khi xác nhận.
  - `OrderViews.jsx`:
    - Hiển thị banner thông báo thân thiện cho tiệm bánh khi đơn đang giao: *"Đơn hàng đang trên đường giao tới khách. Đơn sẽ chính thức hoàn tất khi khách hàng bấm xác nhận đã nhận bánh, hoặc hệ thống sẽ tự động hoàn tất sau 24 giờ"*.
    - Mở ngay form đánh giá sản phẩm / tiệm bánh (`OrderReview`) cho khách hàng ngay sau khi đơn chuyển sang `COMPLETED`.
  - `uiLabels.js`: Bổ sung dịch nghĩa tiếng Việt thân thiện cho các lỗi nghiệp vụ từ Backend (khu vực giao hàng, tùy chọn, tối thiểu đơn hàng...).
- **Build & Quality**:
  - Backend: Toàn bộ 10 unit tests trong `order-service` chạy `mvnw test` PASS 100%.
  - Frontend: `npm run build` chạy thành công (Vite build sạch, 0 errors).

## Frontend — Hoàn thiện tích hợp Trở thành đối tác, Mua gói dịch vụ & Địa chỉ giao hàng — 2026-11-09

- **Trở thành đối tác (Become a Partner)**:
  - Loại bỏ hoàn toàn mock data, fake localStorage (`DEMO_STORAGE_KEY`, `recordDemoPartnerPayment`) và modal giả lập trong `SubscriptionPlansPage.jsx`.
  - Tích hợp `PartnerCheckoutModal.jsx` với API thật `POST /api/v1/bakeries/onboarding` qua `onboardingService.submit` và `GET /api/v1/bakeries/onboarding`.
  - Validate đầy đủ các trường thông tin thực tế từ người dùng: tên tiệm, số điện thoại, địa chỉ xưởng, quận/huyện, tỉnh/thành.
  - Phân định trạng thái hồ sơ tiệm từ Backend: `PENDING_APPROVAL` (PENDING - hiển thị badge và chặn gửi trùng hồ sơ), `ACTIVE` (APPROVED - đã duyệt), `DRAFT` (Bản nháp / Cần hoàn thiện thông tin), `REJECTED` (Bị từ chối).
- **Mua gói dịch vụ (Subscription Purchase)**:
  - Danh sách gói, giá và quyền lợi lấy trực tiếp từ `GET /api/v1/subscription-plans`.
  - Tạo yêu cầu mua gói qua `POST /api/v1/bakeries/{bakeryId}/subscription-orders`. Đơn mua gói tạo ở trạng thái `PENDING_PAYMENT` (không tự động kích hoạt).
  - Khách hàng cung cấp thông tin chuyển khoản / biên lai chứng từ qua `POST /api/v1/subscription-orders/{orderId}/payments`.
  - Sau khi gửi chứng từ, đơn chuyển trạng thái `PAYMENT_REVIEW` (Chờ admin phê duyệt). Gói chỉ có hiệu lực sau khi Admin kiểm tra và duyệt thanh toán.
  - Sửa lỗi `SubscriptionOrderDetail.jsx` phụ thuộc `bankTransfer` bị undefined từ API `/payment-options` khiến form bị khóa vô hiệu; cấu hình thông tin chuyển khoản mặc định rõ ràng cho nền tảng.
- **Đặt bánh trực tiếp (Direct Order)**:
  - Kiểm tra và tích hợp form chọn / thêm địa chỉ giao hàng (`AddressPicker.jsx` kết nối `GET / POST /api/v1/users/me/addresses`).
  - Gửi đúng `deliveryAddressId`, `requestedDeliveryAt` (thời gian tương lai), `customerNote` theo chuẩn `CreateDirectOrderRequest` tới `POST /api/v1/orders/direct`.
  - Đảm bảo snapshot địa chỉ được lưu và hiển thị chi tiết trong `OrderTrackingView.jsx` (người nhận, SĐT, địa chỉ chi tiết, phường, quận, thành phố).
  - Xử lý điều hướng ngay tới trang chi tiết đơn hàng sau khi tạo đơn thành công.
- **Yêu cầu báo giá (Request Quotation - RFQ)**:
  - `RequestForm.jsx` hỗ trợ chọn nhanh từ sổ địa chỉ đã lưu (`loadAddresses`) để tự động điền `deliveryDistrict` và `deliveryCity`.
  - Validate bắt buộc `deliveryDistrict` và `deliveryCity` gửi đúng chuẩn DTO `CreateCakeRequestRequest` tới `POST /api/v1/cake-requests`.
  - Thông tin khu vực nhận bánh hiển thị rõ ràng trên chi tiết RFQ (`CustomerRequestDetail`) và danh sách yêu cầu.
  - Luồng chấp nhận báo giá (`POST /api/v1/offers/{offerId}/accept`) truyền đúng `deliveryAddressId` theo chuẩn Backend.
- **Build & Quality**:
  - `npm run build` chạy thành công (Vite build sạch, 0 lỗi TypeScript / syntax).

## Flutter SweetCake UI local — 2026-11-07

- Đã mở rộng scaffold `mobile` hiện hữu thành 35 màn hình tương ứng Web:
  7 Public, 11 Customer, 9 Bakery Owner và 8 Admin, cùng form/detail/sheet.
  Theme wine/hồng, wordmark/mascot, font và ảnh bundle kế thừa Web.
- Repository fixture theo domain, navigation/persona demo, tìm/lọc, giỏ,
  RFQ/offer, timeline/review, chat, catalog, vận hành tiệm, gói/chứng từ và
  quản trị đều có thao tác local. Không có Backend/API/JWT/DB/payment/AI thật.
  Revenue tiệm được ghi rõ chưa có nguồn dữ liệu; không dựng escrow/payout.
- `pub get`, format, analyze không issue, 26 Flutter test và debug APK pass.
  Android emulator mở 35 route và qua integration assertions cho giỏ, chat,
  RFQ và admin review. Có ảnh runtime và báo cáo tiếng Việt trong
  [docs/mobile](mobile/BAKERY_PLATFORM_FLUTTER_MOBILE_UI_IMPLEMENTATION_REPORT_VI.md).
  iOS build/runtime chưa xác minh vì thiếu macOS/Xcode; TalkBack/VoiceOver và
  hiệu năng release chưa kiểm thử thủ công.
- Thay đổi chỉ ở `mobile` và `docs`; đối chiếu hash 2.754 file tracked ngoài
  hai vùng này không có thay đổi. Giữ nguyên Backend, Frontend, Docker,
  `design-web.md`, secrets và skill hiện hữu. Không stage/commit.

Các mục bên dưới giữ nguyên lịch sử các đợt thực hiện trước.

## Bakery internal JWT scope — 2026-11-06

- Bakery ánh xạ `scope` thành authority `SCOPE_*` bên cạnh platform role.
  Sửa lỗi API membership nội bộ trả 403 ở lớp method security dù JWT service
  có scope hợp lệ, khiến Marketplace trả 503 khi tải yêu cầu và báo giá.
  Giữ kiểm tra loại token, audience và correlation ID ở lớp HTTP.
- 10 test SecurityConfig pass. Sau khi cập nhật riêng Bakery, token Marketplace
  đọc membership thành công và API yêu cầu/báo giá qua Vite đều trả 200.

## Đăng ký đối tác và thanh toán sandbox — 2026-11-06

- Lần duyệt cuối tự kích hoạt quyền chủ tiệm theo cả hai thứ tự duyệt.
  Bakery lưu cờ chờ và tự đối chiếu lại khi các service tạm gián đoạn.
- Tài khoản CUSTOMER gửi hồ sơ qua API onboarding và dùng membership của
  đúng tiệm để mua gói. Khi hồ sơ được duyệt và gói có hiệu lực, Bakery
  xác minh điều kiện và yêu cầu Identity cấp thêm BAKERY_OWNER cho cùng
  tài khoản. Token refresh chứa quyền mới.
- Mã sandbox chỉ hoạt động khi cấu hình local, lưu payment thật trong
  Subscription DB và giữ bước admin duyệt. Dùng lại mã trên đơn khác không
  trùng tham chiếu, retry cùng yêu cầu không tạo thêm payment.
- Đã chạy test Maven cho Identity, Bakery, Subscription và platform-support
  với PostgreSQL Testcontainers. Kiểm tra HTTP trên Docker local đi từ
  CUSTOMER mới đến token BAKERY_OWNER của cùng user ID, gồm mã sai, retry,
  chặn hoàn tất sớm và chặn truy cập tiệm của người khác. Đồng bộ API spec
  và ADR-005.

## Identity admin và Chat history repair — 2026-11-08

- Identity có `PATCH /api/v1/users/me` và các API admin protected gồm list/filter,
  xem user, đổi trạng thái và thay thế roles. Block/xóa mềm revoke toàn bộ refresh
  token; admin không thể tự đổi status hoặc roles của chính mình.
- Chat history cursor đã bỏ phép so sánh UUID bằng JPQL không portable. Trang đầu
  và trang cursor giờ dùng truy vấn riêng; cursor dùng UUID ordering của PostgreSQL.
- Chưa chạy được Maven verification trong môi trường hiện tại vì wrapper không khởi
  động được từ PowerShell và Java trên PATH là 8, trong khi project yêu cầu Java 21.

## Audit toàn hệ thống, Docker local và nền tảng mobile — 2026-11-06

- Đã tạo báo cáo hiện trạng và báo cáo thực thi tiếng Việt trong `docs/audit/`:
  107 API source, 209 Java record, ma trận 106 nhánh lời gọi Web, 35 route,
  49 bảng/16 migration và bằng chứng HTTP/browser. Không sửa business logic
  `backend` hoặc giao diện/hành vi `frontend`.
- `bakery-local` chạy sáu microservice, sáu PostgreSQL và ba MinIO; Web thật tại
  `http://localhost:5173` nối Docker qua proxy Vite hiện có. Có 25/25 HTTP check
  Docker local pass, ba role đăng nhập UI và ảnh sản phẩm MinIO đã xác minh.
  Restart giữ user/product/ảnh và cấu hình. RSA có sẵn giữ nguyên; credential
  local thiếu được resolve/lưu bên ngoài Git trong external secrets.
- Chưa phải full-stack thành công: Cake AI thiếu dependency Google Storage để
  compile; Gateway bootstrap thoát exit 0, chưa có HTTP routing. Bakery internal
  SCOPE, Order address DTO, Chat cursor query và admin users API thiếu vẫn là
  blocker. Scope quote Order đã cấu hình đúng ở local override, source default
  được giữ nguyên. Firebase/AI provider chưa có credential được xác minh.
- Frontend build/lint pass, 607 test pass; Backend clean reactor có 142/144 test
  pass và 2 errors (Order test seed Instant, Chat query); Cake AI compile fail.
  Không xem OpenAPI hoặc container Up là bằng chứng mọi nghiệp vụ hoạt động.
- `mobile` có scaffold Flutter Android/iOS tối thiểu từ CLI; pub get/analyze/
  widget test và Android debug APK pass. iOS build/sign chưa kiểm chứng trên
  Windows. Chưa thêm màn hình, theme, API client hoặc state-management package.
- Taste 2.5.0 và Impeccable 4.8.0 được pin commit/cài project-local tại
  `.agents/skills`; không thêm hook/global config hoặc redesign Web. `design-web.md`
  trích token, component, responsive, motion/assets và mapping Flutter tương lai.
- Hướng dẫn chạy/restart: `docs/audit/LOCAL_RUNTIME_VI.md`, launcher
  `scripts/start-local-runtime.py`, `scripts/start-web-local.ps1`. Chưa commit,
  stage, push hoặc thay dữ liệu PostgreSQL host cũ. Quy tắc `.gitignore` thêm
  `docs/audit` xuất hiện trong lúc thực thi được giữ nguyên; các báo cáo hiện ở
  filesystem nhưng bị Git ignore.

## Mở role CUSTOMER cho Subscription payment — 2026-11-01

- Tạo subscription order/gửi payment nhận user JWT có CUSTOMER hoặc BAKERY_OWNER;
  các API đọc subscription/order cũng nhận CUSTOMER. Giữ kiểm tra ACTIVE OWNER
  của đúng bakery, proof privacy, idempotency và quyền ADMIN khi duyệt payment.
  Đây là thay đổi role; gói vẫn gắn bakery, chưa có gói cá nhân.
- Frontend cho CUSTOMER vào trang vendor-subscription và dùng luồng mua/gửi chứng
  từ; các trang vendor khác giữ BAKERY_OWNER. Đồng bộ API spec, ADR-004 và CONTEXT.
- Maven offline verify Subscription + platform-support thành công: 14 test pass,
  5 test PostgreSQL/context bị skip vì Docker không khả dụng. Frontend 49 test
  subscription/UI/auth pass, production build thành công. Chưa chạy HTTP end-to-end.

## DB và runtime Bakery/Subscription — 2026-10-28

- DB local cũ trên 5432 vẫn có constraint OWNER/MANAGER/STAFF và checksum cũ.
  Giữ nguyên DB này và volumes project cũ; không reset hoặc repair Flyway.
- Tạo môi trường `bakery-owner-dev` với volumes riêng: Identity, Bakery,
  Subscription + 3 PostgreSQL + 2 MinIO. DB mới migrate thành công: Identity
  chỉ có ADMIN/CUSTOMER/BAKERY_OWNER; Bakery V1–V2 chỉ nhận OWNER; Subscription
  V1–V4 validate thành công. Hai module `.env` chuyển sang DB Docker 5436/5437,
  Identity 8081 và MinIO 9002/9004; các file thật vẫn được Git ignore.
- HTTP thật pass cả hai cách: app trong Docker và Java trên máy đọc module `.env`.
  Kiểm tra PEM/JWK, user/service JWT, token bị sửa, quyền owner của đúng tiệm,
  member mutation bị chặn, requiredRole cũ bị từ chối, mua/duyệt gói, entitlement,
  payment proof privacy, upload/download/xóa ảnh, publish và sorting. Script dọn
  đúng users/bakery/subscription/objects tạo trong lần chạy.
- Thêm `Start-BakerySubscription.ps1` (build/start/IDE infrastructure/verify/stop)
  và `Test-LocalServiceEnv.ps1`. Docker build không resolve được Maven Central
  trên máy này; `-LocalBuild` đã package từ Maven cache và build runtime images
  thành công, context chỉ chứa jar/Dockerfile. Không cần Firebase cho ba service.
- Phạm vi kiểm tra là Identity/Bakery/Subscription; chưa chạy lại toàn bộ dự án.
  Rating summary của Bakery vẫn chờ contract từ Order như ghi bên dưới.

## Kiểm tra Bakery theo spec role mới — 2026-10-28

- Bản pull `6c6875a` đã áp dụng ADR-004: platform có CUSTOMER, BAKERY_OWNER,
  ADMIN; membership Bakery chỉ có OWNER. API thêm/sửa/xóa member đã bị loại bỏ.
- Bakery dùng guard `bakeryOwner()` yêu cầu user JWT có BAKERY_OWNER và OWNER
  ACTIVE của đúng bakery; admin API giữ policy ADMIN riêng. Dọn các repository
  query và helper bổ sung tên cũ không còn dùng sau khi bỏ member mutations.
- Bổ sung regression tests: owner không ghi catalog tiệm khác hoặc duyệt tiệm
  thay admin; ADMIN không tự vượt policy quản lý catalog; PATCH/DELETE member bị
  chặn; internal requiredRole từ chối MANAGER/STAFF/ADMIN; PostgreSQL constraint
  chỉ cho lưu OWNER. Tên role cũ còn xuất hiện trong test từ chối, không phải enum.
- `mvn -o -pl bakery-service,subscription-service -am clean verify
  -Dtest.postgres.image=postgres:16-alpine` pass: Bakery 32, Subscription 14 và
  platform-support 3 tests, không skip. Testcontainers dùng DB mới, Flyway/JPA
  validate và executable jars pass. HTTP thật được kiểm tra tiếp ở mục trên.
- Không sửa checksum/migration lịch sử hoặc reset DB dev đang có. Theo ADR-004,
  bản initial schema đã đổi nên DB tạo trước thay đổi cần được tạo lại có chủ đích
  trước khi chạy runtime mới; README Bakery đã ghi rõ điều kiện này.

## Owner-only roles — 2026-10-28

- Platform chỉ còn `ADMIN`, `CUSTOMER`, `BAKERY_OWNER`; bakery membership chỉ
  còn `OWNER`. Các API quản lý yêu cầu owner ACTIVE của đúng bakery.
- Người dùng xác nhận chưa có dữ liệu thực: sửa schema khởi tạo/seed trực tiếp,
  bỏ toàn bộ migration thu hồi quyền, bảng audit và loại participant lịch sử.
  Không tự reset database/volume hoặc sửa Flyway checksum trên máy người dùng.
- Giữ snapshot tên OWNER khi tạo tiệm; bỏ bổ sung tên cho dữ liệu cũ và API
  thêm/sửa/xóa nhân viên. Giữ các thay đổi mới về sort, catalog và subscription.
- Frontend đồng bộ owner-only: bỏ demo account staff, các lựa chọn chức vụ và
  form sửa nhân sự; danh sách membership chỉ đọc thông tin chủ tiệm.
- Đã xử lý conflict nội dung từ origin/dev trong các file liên quan đến role.
  Không tạo merge commit.
- Kiểm tra: clean build/test các module liên quan thành công: 101 test,
  không failure/error/skip. Frontend 448/448 test pass, production build pass;
  lint không có error (còn warning có sẵn). Script JWT kiểm tra cú pháp pass.
  Chưa chạy HTTP end-to-end/DB integration hoặc reset database phát triển.

## Hoàn thiện giao diện Marketplace, AI Studio, Quote Detail & Demo Runtime — 2026-10-28

- Tối ưu hóa UI/UX Marketplace: Chuẩn hóa nhãn trạng thái RFQ/Offer tiếng Việt, layout 2 cột rõ ràng, hiển thị đầy đủ thông tin chi tiết báo giá và hỗ trợ trao đổi chat trực tiếp với tiệm bánh.
- Hoàn thiện Baker Quote Detail Page: Layout 2 cột với panel thanh toán cố định (sticky checkout), phân rã chi tiết tiền bánh/phí giao hàng/phụ kiện, xem tóm tắt yêu cầu RFQ gốc và ảnh mẫu đi kèm.
- Form báo giá Vendor (OfferForm): Nâng cấp trải nghiệm tạo báo giá cho baker, tự động tính toán tổng tiền, kiểm tra hạn báo giá và xác thực trường nhập liệu.
- AI Cake Studio Page: Quy trình thiết kế bánh AI tương tác mượt mà, theo dõi trạng thái job (Job Status) và kiểm duyệt (Moderation Status), thư viện thiết kế đã tạo và chuyển nhanh sang luồng tạo RFQ custom bánh.
- Header & Navigation: Cải thiện bố cục responsive, chống tràn/co vỡ text trên các kích thước màn hình khác nhau (lg, xl, 2xl).
- Demo Runtime & Auth: Bổ sung cơ chế tự động fallback khi backend gateway ngắt kết nối (offline demo mode), hỗ trợ đăng nhập test account nhanh (Customer, Owner, Staff, Admin) và lưu trữ phiên qua sessionStorage.
- Toàn bộ 449 test suite frontend pass; Vite build thành công sạch sẽ 0 lỗi.

## Hoàn thiện Bakery/Subscription — 2026-10-25

- Bakery public/admin lists hỗ trợ sort allow-list; product lists thêm `basePrice`.
  Trường/hướng không hợp lệ trả 400; sort có UUID tie-breaker trước phân trang.
- Flyway V2 thêm `bakery_members.display_name_snapshot`. Bakery xác minh OWNER
  qua Identity khi tạo tiệm; owner/member lưu tên tại lúc tham gia. Snapshot là
  read-only, không đổi theo profile về sau. Membership cũ được bổ sung tên khi đọc
  nếu Identity khả dụng; không lấy được thì vẫn trả membership với snapshot null.
- Maven verify Bakery/Subscription cùng platform-support pass: Bakery 27 tests,
  Subscription 14 và shared client 3; không skip. Flyway V1→V2/JPA validate và
  executable jars pass trên PostgreSQL 16 Testcontainers.
- HTTP thật trên Identity/Bakery/Subscription + 3 DB + 2 MinIO pass qua
  `scripts/Test-LocalJwt.ps1 -BakerySubscriptionOnly -WithStorage`: PEM/JWK,
  user/service JWT, owner/member names, quyền sở hữu, token bị sửa, mua/duyệt gói,
  proof upload/download và quyền owner/admin/staff, logo replacement cleanup,
  cover/add-on, multipart product images/display order/primary/delete, publish,
  sort và invalid sort/MIME/size. Script dọn users, bakery, subscription và objects.
- Chờ Order: chưa có API rating summary theo bakery. Cần nhóm Order cung cấp
  method/path, request/response (`bakeryId`, average rating, review count), quy tắc
  review được tính và scope. Sau khi chốt mới nối client Bakery và Identity grant.
- Cake AI mới pull vẫn có lỗi compile đã ghi bên dưới; không thuộc phạm vi này.

## Bakery/Subscription review sau pull — 2026-10-25

- Commit mới `658c32c` bổ sung Cake AI, không thay đổi trực tiếp Bakery/Subscription.
- Marketplace customization/add-on quotes của Bakery kiểm tra subscription còn
  hiệu lực giống direct-order quotes; thiếu entitlement trả 409, remote lỗi trả 503.
  Phần tử null trong option/add-on selection trả 400 thay vì lỗi xử lý bên trong.
- Subscription tạo order dùng transaction advisory lock theo bakery để chặn
  concurrent open orders. Order PAYMENT_REVIEW tiếp tục chặn mua mới ngay cả khi
  hết hạn gửi payment, cho tới khi admin giải quyết review.
- Retry tạo order giữ quyền xem payment proof: chỉ người gửi chứng từ hoặc admin
  nhận signed URL. Người tạo order không mặc nhiên xem chứng từ người khác gửi.
- Bakery trả đúng 404/405/415 và lỗi thiếu query parameter 400; Subscription trả
  403 khi method security từ chối, thay vì bị generic handler chuyển thành 500.
- Integration tests của hai service dùng profile test và PostgreSQL Testcontainers
  riêng, không import local `.env` hoặc dùng DB phát triển. Khi Docker không chạy,
  các test cần DB được skip; unit/MVC tests vẫn chạy.
- `mvn -o -pl bakery-service,subscription-service -am verify
  -Dtest.postgres.image=postgres:16-alpine` pass: Bakery 21 tests, Subscription 14,
  platform-support 3; không skip. Flyway/JPA validate và executable jars pass.
  PostgreSQL test containers đã được dọn; Docker Desktop đã tắt lại.
- Full-reactor `test-compile` còn fail trong Cake AI mới pull vì thiếu dependency
  Google Cloud Storage/Google Auth và gọi `ApiResponse.accepted(...)` chưa tồn tại
  trong platform-support. Chưa sửa Cake AI ngoài phạm vi Bakery/Subscription;
  chưa chạy lại HTTP end-to-end toàn stack trong đợt review này.

## JWT runtime — 2026-10-24

- Cặp PEM mới trong Identity đã được kiểm tra khớp nhau; root/local env trỏ
  đúng file. Live JWK của Identity khớp public PEM. PEM/key files bị Git ignore
  và loại khỏi cả hai Docker build context; private key chỉ mount vào Identity.
- Bakery/Subscription tự lấy và cache service JWT 5 phút từ Identity bằng
  client secret riêng, với grant giới hạn theo target/scope. Không chia sẻ private
  key và không cần paste bearer token ngắn hạn vào env cho luồng mặc định.
- Identity internal user lookup đã bổ sung email/roles theo spec; thiếu roles
  trước đó gây 422 khi Bakery thêm nhân viên dù JWT hợp lệ.
- Stack 7 domain service + 7 PostgreSQL + 3 MinIO đã build và chạy. Compose runtime
  wiring ở `compose.services.yaml`; chế độ `compose.no-firebase.yaml` cho phép chạy
  Marketplace khi chưa có JSON credential, riêng image operations chưa khả dụng.
- `scripts/Test-LocalJwt.ps1` pass trên HTTP thật: JWK/public PEM, register/login,
  Bakery member lookup qua Identity, Subscription owner validation qua Bakery,
  gửi reference payment/ADMIN approval, Bakery đọc active entitlement, user JWT
  tại Marketplace/Order/Chat và service JWT tại Cake AI. Token sửa chữ ký, sai
  audience và user không sở hữu bakery bị từ chối. Script đã xóa dữ liệu thử.
- Test JWT/security/storage/routing chọn lọc pass. API Gateway vẫn là scaffold;
  chưa có routing runtime. Chưa kiểm thử Firebase upload hay AI generation.
- Local Identity/Marketplace dùng PostgreSQL 16 sẵn có với volume mới; cấu hình
  mặc định của root Compose vẫn là PostgreSQL 17. Không đổi major version trên
  volume đã khởi tạo. Docker images dùng Java 21 và Maven dependency cache chung.

## Sửa lỗi sau merge — 2026-10-24

- Bakery bổ sung dependency platform-support; Bakery/Subscription bổ sung
  Testcontainers dependencies cho context tests đã merge.
- Bakery profile/member và Subscription entitlement có một controller sở hữu mỗi
  URI. Subscription giữ SecurityConfig/JwtDecoderConfig riêng, không import thêm
  PlatformConfiguration gây trùng bean hoặc thay đổi kiểm tra quyền.
- Marketplace customization quote chuyển sang `/internal/v1/catalog/customization-quotes`;
  Order giữ `/internal/v1/catalog/quotes`. Các route bổ sung được bảo vệ theo scope.
- Bakery xử lý platform business exception đúng HTTP status và AccessDenied 403.
- Bakery/Subscription/Order xuất plain jar và executable `-exec.jar`; Dockerfiles
  dùng executable jar để integration-tests vẫn import được application classes.
- Maven test-compile và package toàn reactor pass. Test JWT/security của Identity,
  Bakery/Subscription, signed URL storage và 3 routing regression tests pass.
  Docker Compose config pass; chưa xác nhận runtime Docker/Firebase trong phiên này.
- Docker Bakery/Subscription mặc định tìm Identity qua host port 8081 theo root
  compose.yaml. Root .env và Identity local .env là hai cấu hình riêng; secrets
  thực tế chỉ lưu trong file bị Git ignore. Firebase JSON local chưa có nên
  Marketplace upload còn chờ credential của project nhóm.
- Cặp Marketplace secret/hash được cung cấp không khớp; local hash được tạo lại
  và đồng bộ giữa root Compose env với Identity local env, không ghi vào Git.

## Đã hoàn thành

- Thiết kế database cho bảy bounded context tại `database/postgresql/`.
- ERD, database documentation, architecture và API contract mục tiêu.
- Chuyển `backend/` từ một bootstrap application thành Maven multi-module
  reactor.
- Scaffold tám Spring Boot application độc lập:
  - `identity-service`
  - `bakery-service`
  - `marketplace-service`
  - `order-service`
  - `chat-service`
  - `cake-ai-service`
  - `subscription-service`
  - `api-gateway`
- Tạo package xương sống cho mỗi domain service: `config`, `security`,
  `exception`, `shared.dto`, `feature` và `infrastructure`.
- Tách package feature theo bounded context/API contract và thêm `CONTEXT.md`
  mô tả responsibility, trạng thái cùng boundary của từng feature.
- Tạo application-context smoke test cho từng module.
- Hoàn thiện nền tảng authentication của Identity Service:
  - persistence cho user, customer profile, platform role và refresh token;
  - register, login, refresh rotation/reuse detection, logout và `/auth/me`;
  - RS256 access token, external PEM key pair và public JWK Set;
  - phân tách user JWT/service JWT, role/scope authorization và JSON 401/403;
  - Flyway runtime migrations đồng bộ với canonical Identity DDL.
- Chốt ADR-001 cho JWT signing, refresh session và internal authentication.
- Order Service đã có runtime JPA/PostgreSQL/Flyway, Resource Server nền tảng,
  typed clients tới Identity/Bakery/Marketplace và Swagger UI.
- Hoàn thiện tạo order trực tiếp từ catalog và tạo order từ accepted offer:
  snapshot địa chỉ/items, kiểm tra authoritative quote/offer data, idempotency
  key + payload fingerprint và lưu ban đầu trong transaction Order DB.
- Hoàn thiện Order/Review API: lọc/pagination danh sách, xem snapshot, fulfillment
  state machine + history, internal order context và review lifecycle/moderation.
- Order Service validates RS256 JWTs through Identity JWKs, maps platform roles
  and service scopes, protects public/internal routes, checks order ownership,
  and verifies active Bakery membership for bakery access.
- Order obtains cached five-minute service JWTs from Identity for Identity,
  Bakery and Marketplace clients; Identity grants Order only the required scopes.
- Chat Service has runtime JPA/PostgreSQL/Flyway, Swagger/OpenAPI and a
  non-root Docker image with Compose-managed PostgreSQL and MinIO.
- Chat conversation and message APIs implement participant/membership checks,
  Marketplace context authorization, cursor pagination, idempotent sends,
  attachment validation and signed URLs, soft-delete tombstones, and read/unread
  receipts. Chat obtains short-lived service JWTs from Identity and calls the
  scoped Marketplace/Bakery authorization APIs; protected internal routes remain
  deny-by-default.
- Thêm Order V2/V3 migrations cho `customer_note`, idempotency records và
  accepted-offer idempotency; cập nhật canonical DDL, ERD và database docs.
- Bakery Service đã có JPA/PostgreSQL/Flyway dependencies, runtime V1 migration
  và entity mapping cho 11 bảng trong `bakery_db`, đặt trong từng
  `feature/<feature>/entity`.
- Bakery Service đã có 11 Spring Data repository interface và 11 service
  interface tương ứng với 11 bảng; Bakery profile đã có một số query đọc cấu
  hình hoạt động.
- Bakery profile có API tạo, public đọc theo ID, cập nhật và thay thế cấu hình
  hoạt động cùng `ApiResponse`.
- Bakery Service có API dữ liệu theo spec cho category, add-on, member và product
  management: list/create/patch/delete nơi contract có quy định, cùng PUT thay
  toàn bộ product options. Controller dùng `ResponseEntity`, lỗi đi qua
  `GlobalExceptionHandler`; category delete xóa tham chiếu trên product,
  add-on delete chuyển `active=false`.
- Subscription Service có Spring Web/JPA/Validation/Flyway/PostgreSQL, runtime
  migration V1–V3 và entity mapping cho năm bảng trong `subscription_db`.
  PostgreSQL local đã có database riêng và `.env` riêng của module.
- Subscription Service có API dữ liệu cho public/admin plan, subscription order,
  gửi payment bằng mã giao dịch, admin payment queue và đọc kỳ subscription.
  Create order/payment dùng `Idempotency-Key`; controller trả `ResponseEntity`
  và lỗi qua `GlobalExceptionHandler`. Bakery membership được kiểm tra qua
  internal API khi có service JWT hợp lệ; thiếu credential thì trả `503`.
- Bakery và Subscription đã cấu hình OAuth2 Resource Server xác thực JWT của
  Identity qua JWK/issuer/audience. SecurityFilterChain kiểm tra `token_type=user`,
  platform role và trả ApiResponse cho 401/403; các internal API không được
  khai báo vẫn deny-by-default.
  Bakery còn kiểm tra member ACTIVE và member role của đúng bakery cho các route
  quản lý đã triển khai. User ID khi tạo bakery/order và gửi payment lấy từ JWT
  `sub`, không còn nhận từ `X-User-Id`.
- Bakery Service chạy local trên port `8082` (override bằng `SERVER_PORT`),
  Subscription Service trên `8084`. Bakery có `.env.example`, Dockerfile và
  Compose riêng với PostgreSQL/MinIO.
- Bakery có public bakery/product catalog, signed media URLs, upload logo/cover/
  add-on/product images, submit/approve/suspend/close bakery, publish/hide/archive
  product, admin bakery list/detail/status và ba internal endpoints cho profile,
  membership authorization và catalog quote. Management routes đã bật ở mọi
  profile; JWT user/service audience, scope và `X-Correlation-Id` bảo vệ internal.
- Bakery outbound clients tới Identity user lookup và Subscription entitlement
  đã được nối theo API spec và fail closed khi thiếu service token/remote API.
  Quy tắc MANAGER chỉ được thêm/sửa/xóa STAFF đã được áp dụng.
- Subscription Service đã nối Bakery membership/existence validation, MinIO proof
  upload và signed URL, admin approve/reject payment, snapshot plan features,
  tạo/gia hạn kỳ sử dụng, scheduler activate/expire và internal entitlement API.
  Các route đã bật trong profile `prod`; JWT service audience/scope bảo vệ
  internal endpoint. Có Dockerfile và Compose riêng cho DB/MinIO/service.
- Bakery và Subscription có Compose chung `docker-compose.bakery-subscription.yml`,
  gọi nhau bằng container DNS; mỗi service giữ PostgreSQL/MinIO và volume riêng.
  Cấu hình mẫu ở `docker.env.example`, hướng dẫn tại
  `docs/DOCKER-BAKERY-SUBSCRIPTION.md`. MinIO public URL signing cấu hình region
  để không truy vấn region qua địa chỉ localhost của container.

## Đã kiểm tra

- `mvn test` tại `backend/` trước khi thêm Bakery persistence: **BUILD SUCCESS**.
- Maven reactor nhận đủ parent và tám application modules.
- 19 Identity unit/configuration tests pass, không có failure hoặc error.
- 5 Identity PostgreSQL/MockMvc integration tests được cấu hình bằng
  Testcontainers và tự skip khi Docker daemon không chạy.
- Order Service unit tests cover direct/offer creation, state transitions và
  review lifecycle; Testcontainers covers Flyway V1/V2, Hibernate validation,
  and HTTP/OpenAPI routes when Docker daemon is available. Latest run:
  14 tests, 11 passed and 3 Docker-dependent tests skipped.
- Chat Service tests: 10 total, 6 passed and 4 PostgreSQL/HTTP Testcontainers
  tests skipped because Docker is unavailable. Marketplace reactor tests: 33 total,
  16 passed and 17 Docker-dependent HTTP tests skipped; all 3 new chat
  authorization tests passed.
- Combined Identity/Marketplace/Bakery/Chat Compose configuration validates;
  runtime service-to-service HTTP has not been exercised because Docker is unavailable.
- `mvn -pl bakery-service -am -DskipTests compile`: **BUILD SUCCESS**.
- `mvn test` tại `backend/bakery-service/` với PostgreSQL local: smoke test pass;
  Flyway xác nhận V1, Hibernate `ddl-auto=validate` chấp nhận 11 entity và
  Spring Data phát hiện đủ 11 repository interface.
- `BakeryCrudIntegrationTests` với PostgreSQL local: tạo bakery/member OWNER,
  thay thế và xóa cấu hình hoạt động, cập nhật và đọc lại hồ sơ; test rollback.
- `BakeryCatalogIntegrationTests` với PostgreSQL local: tạo category/add-on/
  product/member, lọc product, thay options giữ ID, chặn ID lạ, xóa category
  mà giữ product; test rollback.
- Subscription Service context test: Flyway áp dụng V1–V3 lên PostgreSQL local,
  Hibernate `ddl-auto=validate` và 4 repository khởi động thành công.
- `SubscriptionDataIntegrationTests` với PostgreSQL local: tạo plan/order/payment,
  kiểm tra snapshot giá, pagination/filter, idempotency và archive; test rollback.
- 6 SecurityConfig Web MVC tests của Bakery/Subscription pass: 401, role/token
  type, Bakery membership và public subscription plans.
- Ngày 2026-10-21, Subscription tests pass; Bakery compile và SecurityConfig tests
  pass. Bakery DB integration tests không kết nối được PostgreSQL local trong lần
  chạy này.
- Bakery compile thành công sau phần catalog/media/internal. Hai domain lifecycle
  tests, hai quote tests và năm SecurityConfig tests pass; Maven package và Docker Compose config
  hợp lệ. PostgreSQL
  local port 5432 hiện không mở nên chưa chạy lại integration tests; Docker daemon
  cũng chưa sẵn để chạy stack.
- Subscription package và Docker Compose config hợp lệ; 2 payment review tests,
  1 lifecycle job test cùng 4 security route tests pass ngày 2026-10-23.
  PostgreSQL local port 5432 và Docker daemon hiện không chạy nên chưa xác nhận
  Flyway V4/JPA/HTTP end-to-end.
- Ngày 2026-10-23, Maven package Bakery/Subscription và Compose chung config pass.
  Hai storage URL tests pass, xác nhận ký URL public mà không gọi localhost từ
  container để lấy region.
- Stack Docker chung đã build và chạy đủ 6 container. Bakery Flyway V1 và
  Subscription V1–V4 được áp dụng thành công; Hibernate validate schema pass.
  Hai API OpenAPI và public plan trả 200, admin không token trả 401, MinIO health
  của cả hai trả 200. HTTP qua container DNS hai chiều trả 200.
  Bakery CRUD và Subscription data/payment approval integration tests pass trên
  PostgreSQL Docker (profile test; Bakery client được mock trong test Subscription).
  Identity port 8080 chưa chạy nên chưa xác nhận luồng HTTP có user/service JWT thật.
  Image MinIO cũ không tải được từ Docker Hub/Quay; stack build cùng release từ
  mã nguồn chính thức qua `docker/minio/Dockerfile`.

## Chưa triển khai

- Bakery public catalog chưa kèm rating: chờ API summary của Order như mục trên.
  Media compensation đã kiểm thử HTTP; job retry cleanup ảnh mồ côi là cải thiện
  vận hành còn lại, không phải endpoint mới trong API spec.
- Bakery/Subscription đã kiểm thử HTTP với PostgreSQL/MinIO/Identity và proof;
  các trường hợp ngoài phạm vi script/test hiện có chưa được xác nhận toàn bộ.
- Cake AI and API Gateway still need their remaining runtime/domain features.
- Runtime integration still requires deployment configuration for service client
  secrets/hashes and dependent service URLs. Identity issues scoped tokens;
  Chat's credentials/grants are configured for Marketplace and Bakery.
- Gateway routing/filter implementation và lựa chọn gateway dependency.
- REST clients, timeout/error mapping, object storage và scheduler trong các
  service còn lại.
- Docker Compose tổng thể, frontend và external AI provider integration.
- Các ADR chưa chốt ngoài quyết định JWT/internal authentication.

## Vấn đề đã biết

- `backend/mvnw.cmd test` hiện lỗi trong Maven Wrapper PowerShell script tại
  bước xử lý thư mục `.m2`; build đã được xác minh bằng Maven cài trên máy.
- Cảnh báo Mockito self-attaching xuất hiện trên Java 21 nhưng không làm test
  thất bại; cần cấu hình Java agent khi dự án nâng mức kiểm soát test runtime.
- Springdoc hiện phát warning khi chuyển một số JSON schema annotation; endpoint
  `/v3/api-docs` và kiểm tra route vẫn pass.
- Docker hiện hoạt động; các service khác cần chạy lại Testcontainers đã skip
  trong các phiên trước khi xác minh full HTTP flow.
- Bakery/Subscription đã có test profile/Testcontainers độc lập; cần Docker để
  chạy persistence/context tests. Identity user lookup và scoped service JWT đã
  xác minh HTTP trong đợt 2026-10-24.
- Compose của Order/Chat hiện mặc định trỏ Identity tới port `8081`, trong khi
  Identity local/Bakery mặc định dùng `8080`; cần thống nhất URL khi ghép stack.
- Subscription V4 và luồng persistence đã xác minh trên PostgreSQL Docker;
  luồng HTTP với Identity/Bakery JWT thật vẫn cần kiểm thử khi Identity chạy.
- Bakery runtime V1 khác bản canonical ở phần thụt lề. Flyway đã áp dụng bản
  runtime, nên không sửa trực tiếp V1 sau khi chạy nếu chưa xử lý checksum.

## Subscription trở về duyệt chứng từ thủ công — 2026-11-08

- Bỏ cơ chế mã sandbox local và cấu hình mã test. Gửi mã tham chiếu hoặc chứng
  từ vẫn tạo payment SUBMITTED/order PAYMENT_REVIEW; ADMIN duyệt mới kích hoạt
  gói. Payment-options giữ tương thích client và luôn báo sandboxEnabled=false.
- Giữ nguyên nội dung API spec hiện có, chỉ thêm ghi chú đính chính ở cuối.
  Không sửa frontend hoặc service khác; không khởi động stack ứng dụng.
- Maven offline test Subscription + platform-support thành công: 21 test pass,
  không skip, gồm PostgreSQL Testcontainers, gửi tham chiếu thủ công, chặn
  phương thức sandbox cũ, duyệt và idempotency.

## Bakery đối chiếu khu vực giao hàng — 2026-11-09

- Các API quote đặt bánh trực tiếp/custom/phụ kiện dùng cùng quy tắc nhận diện
  dấu tiếng Việt, hoa/thường, khoảng trắng và tên viết tắt TP.HCM. Quận số chấp
  nhận `5`, `Quan 5`, `Quận 5`, `Q.5`, `District 5`, `D5` trong cùng tỉnh/thành.
  Giữ điều kiện khu vực hoạt động, phí giao hàng và dữ liệu gốc; không đổi schema.
- Bakery trả HTTP 422, thông báo khu vực cụ thể và mã
  `data.errorCode=DELIVERY_AREA_NOT_SERVED`. Order vẫn cần giữ/ánh xạ mã lỗi để
  web hiển thị nguyên nhân cụ thể; Order và frontend không sửa trong lần này.
- 27 test liên quan của Bakery pass, không skip; không chạy toàn bộ reactor.
  Không sửa Identity hoặc Subscription vì lỗi này thuộc đối chiếu khu vực của
  Bakery. API spec chỉ thêm ghi chú; chưa build lại image Docker cho sửa địa chỉ.
- Bổ sung cấu hình Bearer JWT cho Swagger Bakery/Subscription để có nút Authorize
  và gửi token cho các API cần đăng nhập; các API GET public giữ public.
  Hai image Swagger đã build và xác minh trong lần kiểm tra HTTP onboarding trước.
