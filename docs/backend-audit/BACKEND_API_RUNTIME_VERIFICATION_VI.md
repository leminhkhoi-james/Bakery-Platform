# Kiểm chứng runtime Backend

Mục tiêu là thực thi ứng dụng thật từ current source trong project Docker disposable; không ghi dữ liệu lên bakery-local. Request qua6 cổng loopback đi thẳng service vì Gateway chưa có forwarding. Các case scheduler/recovery có assertion DB được gắn loại riêng, không giả HTTP2xx. Không kiểm chứng Web/Flutter integration và không tạo mock Backend để tính PASS.

## Môi trường và phương pháp

Build source copy bên ngoài repo tại `%TEMP%\bakery-backend-audit-20261107\source\backend`; kiểm hash copy. JAR mới mount readonly vào image Java local có cache. Project `bakery-audit-20261107`, network bridge riêng `bakery-audit-20261107-runtime`, named volumes audit-postgres/audit-storage riêng. Sáu service dùng6 DB/users trong một Postgres17 instance audit. RSA3072bits và credential service hiện hữu reuse; DB/storage/test passwords CSPRNG riêng, manifest chỉ TEMP với ACL current user+SYSTEM. Không ghi env/password/JWT/cookie vào evidence.

Ban đầu internal bridge không publish host ports trên Docker Desktop; chỉ sửa Compose TEMP sang bridge riêng và bind127.0.0.1. Mọi endpoint URL được assert Docker-local/loopback; Firebase project/bucket trống và không nạp ADC/AI key. Đây không phải network egress firewall. Không có request tới cloud/payment/email thật.

Fixture:5 user synthetic tạo qua register; chỉ thêm ADMIN role và2 địa chỉ bằng SQL trong DB audit vì chưa có public API. OWNER được cấp qua onboarding + admin duyệt bakery + chứng từ tổng hợp + admin duyệt subscription. BANK_TRANSFER trong test là chuỗi chứng từ, không chuyển khoản. Không dùng fixtureSQL này để tuyên bố public address/profile API hoạt động.

## Metrics có mẫu số rõ

Case concurrency gồm4 request nhưng tính1 testcase; health/OpenAPI không được cộng vào application API cases hoặc happy-path coverage.


| Chỉ số | Kết quả | Ý nghĩa |
|---|---|---|
| RuntimeEndpointCoverage | 104/113 = 92.04% | Có ít nhất1 case đã thực thi, gồm negative-auth |
| RuntimeSuccessCoverage | 104/113 = 92.04% | Có ít nhất1 case PASS, kể cả expected401/403/404; KHÔNG là happy-path coverage |
| Business2xxCoverage | 97/113 = 85.84% | Có ít nhất1 case PASS với HTTP2xx thật |
| TestCasePassRate raw | 306/323 = 94.74% | Giữ cả lỗi giả định harness và lỗi sản phẩm, không sửa lịch sử FAIL |
| Không thực thi | 9 | 9 API Cake AI compile blocked |
| Chưa có2xx PASS | 16 | Bao gồm9 compile blocked và7 API khác |
| Case FAIL do harness/assumption | 13 | Đã phân tích/corrected hoặc kiểm đúng precondition, không xóa evidence |
| Case implementation FAIL | 4 | 1 direct order +3 Chat list variants; không suy thành4 lỗi độc lập |


## Tình trạng từng component


| Component | Startup | Internal/host | Readiness | Functional |
|---|---|---|---|---|
| audit-db | Docker postgres:17-alpine | 5432 / không publish | pg_isready PASS | 6 DB Flyway + schema-onlyAI; metadata và6 DB assertions PASS |
| audit-storage | Docker MinIO local cached | 9000 /127.0.0.1:19012 | Uploads trả201 | Logo/cover/product/add-on thật trong audit; chưa kiểm mọi presigned download |
| Identity | Fresh JAR in Docker | 8080 /18091 | actuatorUP200 | Register/login/rotation/replay/logout/serviceJWT/internal PASS |
| Bakery | Fresh JAR in Docker | 8080 /18092 | health401; business API PASS | Onboarding, catalog, media, quotes, ownership PASS |
| Marketplace | Fresh JAR in Docker | 8080 /18093 | actuatorUP200 | RFQ/offer/accept/order replay PASS; Firebase/AI503 có chủ đích |
| Subscription | Fresh JAR in Docker | 8080 /18094 | health401; business API PASS | Order/payment review/reject/renewal SCHEDULED PASS |
| Order | Fresh JAR in Docker | 8080 /18096 | health401 | From-offer/lifecycle/review PASS; direct422 defect |
| Chat | Fresh JAR in Docker | 8080 /18097 | health401 | Create/send/replay/delete/read/close PASS; list message403 SQL defect |
| Cake AI | Build isolated | không listen | FAILED | Không giả claim runtime/provider/storage PASS |
| API Gateway | Fresh JAR probe container | 8080 dự kiến /18090 | exit0, connection refused | Bootstrap non-web, chưa route |
| Web/Flutter | Không khởi chạy/build | không áp dụng | NOT_VERIFIED | Audit Backend-only; bảo vệ source/build trongfrontend/mobile |


## Đối chiếu operation source và runtime


| Service | Source API | Existing OpenAPI | Fresh OpenAPI |
|---|---|---|---|
| bakery-service | 42 | 38 | 42 |
| cake-ai-service | 9 | NOT_AVAILABLE | NOT_AVAILABLE |
| chat-service | 8 | 8 | 8 |
| identity-service | 10 | 9 | 10 |
| marketplace-service | 18 | 18 | 18 |
| order-service | 10 | 10 | 10 |
| subscription-service | 16 | 15 | 16 |


Existing stack98 operation, fresh104, static113. Historical107 tương đương98+9AI ở version cũ; không dùng làm tổng current source. OpenAPI được so sánh bằng cặp method/path theo service, không chỉ đếm số.

## Các API chưa có happy path2xx


| API | Mục tiêu | Lý do |
|---|---|---|
| [CAI-001](BACKEND_API_DETAILED_SPECIFICATION_VI.md#cai-001) | Admin kiểm duyệt design | Compile blocked |
| [CAI-002](BACKEND_API_DETAILED_SPECIFICATION_VI.md#cai-002) | Đọc design được phép | Compile blocked |
| [CAI-003](BACKEND_API_DETAILED_SPECIFICATION_VI.md#cai-003) | Liệt kê job theo chủ sở hữu | Compile blocked |
| [CAI-004](BACKEND_API_DETAILED_SPECIFICATION_VI.md#cai-004) | Tạo generation job và revision đầu | Compile blocked |
| [CAI-005](BACKEND_API_DETAILED_SPECIFICATION_VI.md#cai-005) | Chi tiết job/revisions/designs | Compile blocked |
| [CAI-006](BACKEND_API_DETAILED_SPECIFICATION_VI.md#cai-006) | Hủy job đang chờ hoặc xử lý | Compile blocked |
| [CAI-007](BACKEND_API_DETAILED_SPECIFICATION_VI.md#cai-007) | Tạo revision và execution mới | Compile blocked |
| [CAI-008](BACKEND_API_DETAILED_SPECIFICATION_VI.md#cai-008) | Cung cấp context job cho Marketplace | Compile blocked |
| [CAI-009](BACKEND_API_DETAILED_SPECIFICATION_VI.md#cai-009) | Xác minh design cho Marketplace | Compile blocked |
| [CHT-005](BACKEND_API_DETAILED_SPECIFICATION_VI.md#cht-005) | Đọc trang tin nhắn và ghi delivered receipts | Defect SQL→403 |
| [MKT-006](BACKEND_API_DETAILED_SPECIFICATION_VI.md#mkt-006) | Upload ảnh tham khảo RFQ | Firebase/AI dependency hoặc chưa có ảnh hợp lệ để delete |
| [MKT-007](BACKEND_API_DETAILED_SPECIFICATION_VI.md#mkt-007) | Xóa ảnh tham khảo RFQ | Firebase/AI dependency hoặc chưa có ảnh hợp lệ để delete |
| [MKT-010](BACKEND_API_DETAILED_SPECIFICATION_VI.md#mkt-010) | Chọn design đã được duyệt | Firebase/AI dependency hoặc chưa có ảnh hợp lệ để delete |
| [MKT-017](BACKEND_API_DETAILED_SPECIFICATION_VI.md#mkt-017) | Context RFQ cho Cake AI | Internal scope/client dependency happy path chưa được cấp/chạy; mới verify anonymous rejection |
| [ORD-003](BACKEND_API_DETAILED_SPECIFICATION_VI.md#ord-003) | Đặt hàng trực tiếp từ catalog | Defect422 address |
| [ORD-010](BACKEND_API_DETAILED_SPECIFICATION_VI.md#ord-010) | Context order nội bộ | Internal scope/client dependency happy path chưa được cấp/chạy; mới verify anonymous rejection |


## Quy trình chạy lại an toàn

Các lệnh dưới là cho môi trường audit riêng và giả định manifest TEMP/cached images/RSA mounts còn tồn tại. Không tự tạo/reuse credential nếu private manifest mất. Các script có guard project/database/path và dừng khi không đủ isolation. Đây không phải deployment hoàn chỉnh qua Gateway.

```powershell
python docs/backend-audit/tools/source_model.py
python docs/backend-audit/tools/isolated_build.py
python docs/backend-audit/tools/isolated_runtime.py
python docs/backend-audit/tools/runtime_probe.py
```

`isolated_build.py` chỉ build source copy ngoài repo, không gọi Maven tại backend. `runtime_cases.py` có phase bootstrap/bakery/catalog/marketplace/orders; extended/final cases thêm nhánh. **Không chạy lại các mutation phases trên fixture đã kết thúc**: product đã ARCHIVED, plan đã ARCHIVED, RFQ đã accepted. Để nghiên cứu thêm cần project/fixture namespace mới được isolate đúng; script hiện gắn ngày cố định, không được đổi sang project hiện hữu bakery-local.

Restart service audit, không thay dữ liệu:

```powershell
$bakeryAuditCompose = Join-Path $env:TEMP "bakery-backend-audit-20261107/runtime-compose.json"
docker compose -p bakery-audit-20261107 -f $bakeryAuditCompose restart chat-service
python docs/backend-audit/tools/runtime_probe.py
```

Không chạy down-v/prune/reset volumes. Không chạy scripts/start-local-runtime.py trong nhiệm vụ read-only vì script prepare ghi backend/*/target/docker-runtime. Không stage/commit TEMP private manifests. Không khẳng định host reboot/recovery đã được test; manifest TEMP chỉ phục vụ audit, không phải cấu hình production bền vững.

## Existing test suite và build

Business services+Gateway package PASS; CakeAI FAIL. Lần test đầu26 testcase,1 error do thiếu canonical database ở source copy; bổ sung SQL corpus vào TEMP rồi chạy các suite chưa PASS bằng Maven -fae, giữ các suite đã PASS không lặp. Tổng XML độc lập cuối:148 tests,146 PASS,2 errors,0 assertion failures,0 skipped. Không cộng26 ban đầu vào148 và không tính suite chưa compile thành test đã pass.

Hai error: Chat SQL timestamp tương tự runtime defect; Order test fixture JdbcTemplate không infer java.time.Instant. Order business transitions/review quaHTTP đã PASS, vì vậy không đồng nhất lỗi fixture với production order defect. CakeAI và toàn integration module chưa chạy thành công, không báo full Maven reactor xanh. Xem [test evidence](evidence/existing-tests.json), [initial evidence](evidence/existing-tests-initial.json).

## Assertion dữ liệu sau luồng

[6 assertions](evidence/runtime-db-assertions.json): một order/offer; orderCOMPLETED/completedAt có mặt; total=subtotal+deliveryFee và subtotal=sum(items.line_total); acceptanceSUCCEEDED; OWNER đã cấp; kỳSCHEDULED tồn tại tại thời điểm kiểm ban đầu. 4 replay acceptance song song đều200 và chỉ1 order; đây là replay concurrency, chưa phải race accept2 offer đầu tiên hay failure injection giữa hai commit.

Bổ sung recovery: stop chỉ Order container thuộc project audit →accept503/RETRYING →start Order →scheduler tự SUCCEEDED, một order. Expiry: đổi mốc ngày của fixture tổng hợp rồi để job nguồn đổi RFQ/offer thành CLOSED/EXPIRED, subscription order EXPIRED, period cũ EXPIRED và SCHEDULED thành ACTIVE. Vì vậy period từng SCHEDULED trong assertion trước nay đã ACTIVE. Một lần chuẩn bị date fixture bị check expires_at>created_at từ chối; đã điều chỉnh cả created_at hợp lệ, không drop constraint và không chạy lại recovery. [Method evidence](evidence/scheduler-test-method.json) và casesTC0312–0323 ghi rõ phạm vi.

## Danh mục mọi testcase

<a id="tc-0001"></a>

### TC-0001 · BKR-001 · Kiểm tra bề mặt khi chưa đăng nhập

Loại `ANONYMOUS_SURFACE`; actor alias `anonymous`; HTTP thực `401`; expected `[400, 401, 403, 415]`; **PASS**. Thông điệp lỗi: `Authentication is required or token is invalid`. 

<a id="tc-0002"></a>

### TC-0002 · BKR-002 · Kiểm tra bề mặt khi chưa đăng nhập

Loại `ANONYMOUS_SURFACE`; actor alias `anonymous`; HTTP thực `401`; expected `[400, 401, 403, 415]`; **PASS**. Thông điệp lỗi: `Authentication is required or token is invalid`. 

<a id="tc-0003"></a>

### TC-0003 · BKR-003 · Kiểm tra bề mặt khi chưa đăng nhập

Loại `ANONYMOUS_SURFACE`; actor alias `anonymous`; HTTP thực `401`; expected `[400, 401, 403, 415]`; **PASS**. Thông điệp lỗi: `Authentication is required or token is invalid`. 

<a id="tc-0004"></a>

### TC-0004 · BKR-004 · Kiểm tra bề mặt khi chưa đăng nhập

Loại `ANONYMOUS_SURFACE`; actor alias `anonymous`; HTTP thực `200`; expected `[200, 404]`; **PASS**. 

<a id="tc-0005"></a>

### TC-0005 · BKR-005 · Kiểm tra bề mặt khi chưa đăng nhập

Loại `ANONYMOUS_SURFACE`; actor alias `anonymous`; HTTP thực `401`; expected `[400, 401, 403, 415]`; **PASS**. Thông điệp lỗi: `Authentication is required or token is invalid`. 

<a id="tc-0006"></a>

### TC-0006 · BKR-006 · Kiểm tra bề mặt khi chưa đăng nhập

Loại `ANONYMOUS_SURFACE`; actor alias `anonymous`; HTTP thực `401`; expected `[400, 401, 403, 415]`; **PASS**. Thông điệp lỗi: `Authentication is required or token is invalid`. 

<a id="tc-0007"></a>

### TC-0007 · BKR-007 · Kiểm tra bề mặt khi chưa đăng nhập

Loại `ANONYMOUS_SURFACE`; actor alias `anonymous`; HTTP thực `401`; expected `[400, 401, 403, 415]`; **PASS**. Thông điệp lỗi: `Authentication is required or token is invalid`. 

<a id="tc-0008"></a>

### TC-0008 · BKR-008 · Kiểm tra bề mặt khi chưa đăng nhập

Loại `ANONYMOUS_SURFACE`; actor alias `anonymous`; HTTP thực `404`; expected `[200, 404]`; **PASS**. Thông điệp lỗi: `Bakery not found`. 

<a id="tc-0009"></a>

### TC-0009 · BKR-009 · Kiểm tra bề mặt khi chưa đăng nhập

Loại `ANONYMOUS_SURFACE`; actor alias `anonymous`; HTTP thực `401`; expected `[400, 401, 403, 415]`; **PASS**. Thông điệp lỗi: `Authentication is required or token is invalid`. 

<a id="tc-0010"></a>

### TC-0010 · BKR-010 · Kiểm tra bề mặt khi chưa đăng nhập

Loại `ANONYMOUS_SURFACE`; actor alias `anonymous`; HTTP thực `401`; expected `[400, 401, 403, 415]`; **PASS**. Thông điệp lỗi: `Authentication is required or token is invalid`. 

<a id="tc-0011"></a>

### TC-0011 · BKR-011 · Kiểm tra bề mặt khi chưa đăng nhập

Loại `ANONYMOUS_SURFACE`; actor alias `anonymous`; HTTP thực `401`; expected `[400, 401, 403, 415]`; **PASS**. Thông điệp lỗi: `Authentication is required or token is invalid`. 

<a id="tc-0012"></a>

### TC-0012 · BKR-012 · Kiểm tra bề mặt khi chưa đăng nhập

Loại `ANONYMOUS_SURFACE`; actor alias `anonymous`; HTTP thực `401`; expected `[400, 401, 403, 415]`; **PASS**. Thông điệp lỗi: `Authentication is required or token is invalid`. 

<a id="tc-0013"></a>

### TC-0013 · BKR-013 · Kiểm tra bề mặt khi chưa đăng nhập

Loại `ANONYMOUS_SURFACE`; actor alias `anonymous`; HTTP thực `401`; expected `[400, 401, 403, 415]`; **PASS**. Thông điệp lỗi: `Authentication is required or token is invalid`. 

<a id="tc-0014"></a>

### TC-0014 · BKR-014 · Kiểm tra bề mặt khi chưa đăng nhập

Loại `ANONYMOUS_SURFACE`; actor alias `anonymous`; HTTP thực `401`; expected `[400, 401, 403, 415]`; **PASS**. Thông điệp lỗi: `Authentication is required or token is invalid`. 

<a id="tc-0015"></a>

### TC-0015 · BKR-015 · Kiểm tra bề mặt khi chưa đăng nhập

Loại `ANONYMOUS_SURFACE`; actor alias `anonymous`; HTTP thực `401`; expected `[400, 401, 403, 415]`; **PASS**. Thông điệp lỗi: `Authentication is required or token is invalid`. 

<a id="tc-0016"></a>

### TC-0016 · BKR-016 · Kiểm tra bề mặt khi chưa đăng nhập

Loại `ANONYMOUS_SURFACE`; actor alias `anonymous`; HTTP thực `401`; expected `[400, 401, 403, 415]`; **PASS**. Thông điệp lỗi: `Authentication is required or token is invalid`. 

<a id="tc-0017"></a>

### TC-0017 · BKR-017 · Kiểm tra bề mặt khi chưa đăng nhập

Loại `ANONYMOUS_SURFACE`; actor alias `anonymous`; HTTP thực `401`; expected `[400, 401, 403, 415]`; **PASS**. Thông điệp lỗi: `Authentication is required or token is invalid`. 

<a id="tc-0018"></a>

### TC-0018 · BKR-018 · Kiểm tra bề mặt khi chưa đăng nhập

Loại `ANONYMOUS_SURFACE`; actor alias `anonymous`; HTTP thực `401`; expected `[400, 401, 403, 415]`; **PASS**. Thông điệp lỗi: `Authentication is required or token is invalid`. 

<a id="tc-0019"></a>

### TC-0019 · BKR-019 · Kiểm tra bề mặt khi chưa đăng nhập

Loại `ANONYMOUS_SURFACE`; actor alias `anonymous`; HTTP thực `401`; expected `[400, 401, 403, 415]`; **PASS**. Thông điệp lỗi: `Authentication is required or token is invalid`. 

<a id="tc-0020"></a>

### TC-0020 · BKR-020 · Kiểm tra bề mặt khi chưa đăng nhập

Loại `ANONYMOUS_SURFACE`; actor alias `anonymous`; HTTP thực `401`; expected `[400, 401, 403, 415]`; **PASS**. Thông điệp lỗi: `Authentication is required or token is invalid`. 

<a id="tc-0021"></a>

### TC-0021 · BKR-021 · Kiểm tra bề mặt khi chưa đăng nhập

Loại `ANONYMOUS_SURFACE`; actor alias `anonymous`; HTTP thực `401`; expected `[400, 401, 403, 415]`; **PASS**. Thông điệp lỗi: `Authentication is required or token is invalid`. 

<a id="tc-0022"></a>

### TC-0022 · BKR-022 · Kiểm tra bề mặt khi chưa đăng nhập

Loại `ANONYMOUS_SURFACE`; actor alias `anonymous`; HTTP thực `401`; expected `[400, 401, 403, 415]`; **PASS**. Thông điệp lỗi: `Authentication is required or token is invalid`. 

<a id="tc-0023"></a>

### TC-0023 · BKR-023 · Kiểm tra bề mặt khi chưa đăng nhập

Loại `ANONYMOUS_SURFACE`; actor alias `anonymous`; HTTP thực `401`; expected `[400, 401, 403, 415]`; **PASS**. Thông điệp lỗi: `Authentication is required or token is invalid`. 

<a id="tc-0024"></a>

### TC-0024 · BKR-024 · Kiểm tra bề mặt khi chưa đăng nhập

Loại `ANONYMOUS_SURFACE`; actor alias `anonymous`; HTTP thực `401`; expected `[400, 401, 403, 415]`; **PASS**. Thông điệp lỗi: `Authentication is required or token is invalid`. 

<a id="tc-0025"></a>

### TC-0025 · BKR-025 · Kiểm tra bề mặt khi chưa đăng nhập

Loại `ANONYMOUS_SURFACE`; actor alias `anonymous`; HTTP thực `401`; expected `[400, 401, 403, 415]`; **PASS**. Thông điệp lỗi: `Authentication is required or token is invalid`. 

<a id="tc-0026"></a>

### TC-0026 · BKR-026 · Kiểm tra bề mặt khi chưa đăng nhập

Loại `ANONYMOUS_SURFACE`; actor alias `anonymous`; HTTP thực `401`; expected `[400, 401, 403, 415]`; **PASS**. Thông điệp lỗi: `Authentication is required or token is invalid`. 

<a id="tc-0027"></a>

### TC-0027 · BKR-027 · Kiểm tra bề mặt khi chưa đăng nhập

Loại `ANONYMOUS_SURFACE`; actor alias `anonymous`; HTTP thực `401`; expected `[400, 401, 403, 415]`; **PASS**. Thông điệp lỗi: `Authentication is required or token is invalid`. 

<a id="tc-0028"></a>

### TC-0028 · BKR-028 · Kiểm tra bề mặt khi chưa đăng nhập

Loại `ANONYMOUS_SURFACE`; actor alias `anonymous`; HTTP thực `401`; expected `[400, 401, 403, 415]`; **PASS**. Thông điệp lỗi: `Authentication is required or token is invalid`. 

<a id="tc-0029"></a>

### TC-0029 · BKR-029 · Kiểm tra bề mặt khi chưa đăng nhập

Loại `ANONYMOUS_SURFACE`; actor alias `anonymous`; HTTP thực `401`; expected `[400, 401, 403, 415]`; **PASS**. Thông điệp lỗi: `Authentication is required or token is invalid`. 

<a id="tc-0030"></a>

### TC-0030 · BKR-030 · Kiểm tra bề mặt khi chưa đăng nhập

Loại `ANONYMOUS_SURFACE`; actor alias `anonymous`; HTTP thực `401`; expected `[400, 401, 403, 415]`; **PASS**. Thông điệp lỗi: `Authentication is required or token is invalid`. 

<a id="tc-0031"></a>

### TC-0031 · BKR-031 · Kiểm tra bề mặt khi chưa đăng nhập

Loại `ANONYMOUS_SURFACE`; actor alias `anonymous`; HTTP thực `401`; expected `[400, 401, 403, 415]`; **PASS**. Thông điệp lỗi: `Authentication is required or token is invalid`. 

<a id="tc-0032"></a>

### TC-0032 · BKR-032 · Kiểm tra bề mặt khi chưa đăng nhập

Loại `ANONYMOUS_SURFACE`; actor alias `anonymous`; HTTP thực `401`; expected `[400, 401, 403, 415]`; **PASS**. Thông điệp lỗi: `Authentication is required or token is invalid`. 

<a id="tc-0033"></a>

### TC-0033 · BKR-033 · Kiểm tra bề mặt khi chưa đăng nhập

Loại `ANONYMOUS_SURFACE`; actor alias `anonymous`; HTTP thực `401`; expected `[400, 401, 403, 415]`; **PASS**. Thông điệp lỗi: `Authentication is required or token is invalid`. 

<a id="tc-0034"></a>

### TC-0034 · BKR-034 · Kiểm tra bề mặt khi chưa đăng nhập

Loại `ANONYMOUS_SURFACE`; actor alias `anonymous`; HTTP thực `200`; expected `[200, 404]`; **PASS**. 

<a id="tc-0035"></a>

### TC-0035 · BKR-035 · Kiểm tra bề mặt khi chưa đăng nhập

Loại `ANONYMOUS_SURFACE`; actor alias `anonymous`; HTTP thực `404`; expected `[200, 404]`; **PASS**. Thông điệp lỗi: `Product not found`. 

<a id="tc-0036"></a>

### TC-0036 · BKR-036 · Kiểm tra bề mặt khi chưa đăng nhập

Loại `ANONYMOUS_SURFACE`; actor alias `anonymous`; HTTP thực `401`; expected `[400, 401, 403, 415]`; **PASS**. Thông điệp lỗi: `Authentication is required or token is invalid`. 

<a id="tc-0037"></a>

### TC-0037 · BKR-037 · Kiểm tra bề mặt khi chưa đăng nhập

Loại `ANONYMOUS_SURFACE`; actor alias `anonymous`; HTTP thực `401`; expected `[400, 401, 403, 415]`; **PASS**. Thông điệp lỗi: `Authentication is required or token is invalid`. 

<a id="tc-0038"></a>

### TC-0038 · BKR-038 · Kiểm tra bề mặt khi chưa đăng nhập

Loại `ANONYMOUS_SURFACE`; actor alias `anonymous`; HTTP thực `401`; expected `[400, 401, 403, 415]`; **PASS**. Thông điệp lỗi: `Authentication is required or token is invalid`. 

<a id="tc-0039"></a>

### TC-0039 · BKR-039 · Kiểm tra bề mặt khi chưa đăng nhập

Loại `ANONYMOUS_SURFACE`; actor alias `anonymous`; HTTP thực `401`; expected `[400, 401, 403, 415]`; **PASS**. Thông điệp lỗi: `Authentication is required or token is invalid`. 

<a id="tc-0040"></a>

### TC-0040 · BKR-040 · Kiểm tra bề mặt khi chưa đăng nhập

Loại `ANONYMOUS_SURFACE`; actor alias `anonymous`; HTTP thực `401`; expected `[400, 401, 403, 415]`; **PASS**. Thông điệp lỗi: `Authentication is required or token is invalid`. 

<a id="tc-0041"></a>

### TC-0041 · BKR-041 · Kiểm tra bề mặt khi chưa đăng nhập

Loại `ANONYMOUS_SURFACE`; actor alias `anonymous`; HTTP thực `401`; expected `[400, 401, 403, 415]`; **PASS**. Thông điệp lỗi: `Authentication is required or token is invalid`. 

<a id="tc-0042"></a>

### TC-0042 · BKR-042 · Kiểm tra bề mặt khi chưa đăng nhập

Loại `ANONYMOUS_SURFACE`; actor alias `anonymous`; HTTP thực `401`; expected `[400, 401, 403, 415]`; **PASS**. Thông điệp lỗi: `Authentication is required or token is invalid`. 

<a id="tc-0043"></a>

### TC-0043 · CHT-001 · Kiểm tra bề mặt khi chưa đăng nhập

Loại `ANONYMOUS_SURFACE`; actor alias `anonymous`; HTTP thực `401`; expected `[400, 401, 403, 415]`; **PASS**. Thông điệp lỗi: `Authentication is required or token is invalid`. 

<a id="tc-0044"></a>

### TC-0044 · CHT-002 · Kiểm tra bề mặt khi chưa đăng nhập

Loại `ANONYMOUS_SURFACE`; actor alias `anonymous`; HTTP thực `401`; expected `[400, 401, 403, 415]`; **PASS**. Thông điệp lỗi: `Authentication is required or token is invalid`. 

<a id="tc-0045"></a>

### TC-0045 · CHT-003 · Kiểm tra bề mặt khi chưa đăng nhập

Loại `ANONYMOUS_SURFACE`; actor alias `anonymous`; HTTP thực `401`; expected `[400, 401, 403, 415]`; **PASS**. Thông điệp lỗi: `Authentication is required or token is invalid`. 

<a id="tc-0046"></a>

### TC-0046 · CHT-004 · Kiểm tra bề mặt khi chưa đăng nhập

Loại `ANONYMOUS_SURFACE`; actor alias `anonymous`; HTTP thực `401`; expected `[400, 401, 403, 415]`; **PASS**. Thông điệp lỗi: `Authentication is required or token is invalid`. 

<a id="tc-0047"></a>

### TC-0047 · CHT-005 · Kiểm tra bề mặt khi chưa đăng nhập

Loại `ANONYMOUS_SURFACE`; actor alias `anonymous`; HTTP thực `401`; expected `[400, 401, 403, 415]`; **PASS**. Thông điệp lỗi: `Authentication is required or token is invalid`. 

<a id="tc-0048"></a>

### TC-0048 · CHT-006 · Kiểm tra bề mặt khi chưa đăng nhập

Loại `ANONYMOUS_SURFACE`; actor alias `anonymous`; HTTP thực `401`; expected `[400, 401, 403, 415]`; **PASS**. Thông điệp lỗi: `Authentication is required or token is invalid`. 

<a id="tc-0049"></a>

### TC-0049 · CHT-007 · Kiểm tra bề mặt khi chưa đăng nhập

Loại `ANONYMOUS_SURFACE`; actor alias `anonymous`; HTTP thực `401`; expected `[400, 401, 403, 415]`; **PASS**. Thông điệp lỗi: `Authentication is required or token is invalid`. 

<a id="tc-0050"></a>

### TC-0050 · CHT-008 · Kiểm tra bề mặt khi chưa đăng nhập

Loại `ANONYMOUS_SURFACE`; actor alias `anonymous`; HTTP thực `401`; expected `[400, 401, 403, 415]`; **PASS**. Thông điệp lỗi: `Authentication is required or token is invalid`. 

<a id="tc-0051"></a>

### TC-0051 · IDN-001 · Kiểm tra bề mặt khi chưa đăng nhập

Loại `ANONYMOUS_SURFACE`; actor alias `anonymous`; HTTP thực `200`; expected `[200, 404]`; **PASS**. 

<a id="tc-0052"></a>

### TC-0052 · IDN-002 · Kiểm tra bề mặt khi chưa đăng nhập

Loại `ANONYMOUS_SURFACE`; actor alias `anonymous`; HTTP thực `400`; expected `[400, 401, 403, 415]`; **PASS**. Thông điệp lỗi: `Validation failed`. 

<a id="tc-0053"></a>

### TC-0053 · IDN-003 · Kiểm tra bề mặt khi chưa đăng nhập

Loại `ANONYMOUS_SURFACE`; actor alias `anonymous`; HTTP thực `401`; expected `[400, 401, 403, 415]`; **PASS**. Thông điệp lỗi: `Authentication is required or token is invalid`. 

<a id="tc-0054"></a>

### TC-0054 · IDN-004 · Kiểm tra bề mặt khi chưa đăng nhập

Loại `ANONYMOUS_SURFACE`; actor alias `anonymous`; HTTP thực `401`; expected `[400, 401, 403, 415]`; **PASS**. Thông điệp lỗi: `Authentication is required or token is invalid`. 

<a id="tc-0055"></a>

### TC-0055 · IDN-005 · Kiểm tra bề mặt khi chưa đăng nhập

Loại `ANONYMOUS_SURFACE`; actor alias `anonymous`; HTTP thực `401`; expected `[400, 401, 403, 415]`; **PASS**. Thông điệp lỗi: `Refresh token is missing, expired, revoked, or invalid`. 

<a id="tc-0056"></a>

### TC-0056 · IDN-006 · Kiểm tra bề mặt khi chưa đăng nhập

Loại `ANONYMOUS_SURFACE`; actor alias `anonymous`; HTTP thực `400`; expected `[400, 401, 403, 415]`; **PASS**. Thông điệp lỗi: `Validation failed`. 

<a id="tc-0057"></a>

### TC-0057 · IDN-007 · Kiểm tra bề mặt khi chưa đăng nhập

Loại `ANONYMOUS_SURFACE`; actor alias `anonymous`; HTTP thực `400`; expected `[400, 401, 403, 415]`; **PASS**. Thông điệp lỗi: `Validation failed`. 

<a id="tc-0058"></a>

### TC-0058 · IDN-008 · Kiểm tra bề mặt khi chưa đăng nhập

Loại `ANONYMOUS_SURFACE`; actor alias `anonymous`; HTTP thực `401`; expected `[400, 401, 403, 415]`; **PASS**. Thông điệp lỗi: `Authentication is required or token is invalid`. 

<a id="tc-0059"></a>

### TC-0059 · IDN-009 · Kiểm tra bề mặt khi chưa đăng nhập

Loại `ANONYMOUS_SURFACE`; actor alias `anonymous`; HTTP thực `401`; expected `[400, 401, 403, 415]`; **PASS**. Thông điệp lỗi: `Authentication is required or token is invalid`. 

<a id="tc-0060"></a>

### TC-0060 · IDN-010 · Kiểm tra bề mặt khi chưa đăng nhập

Loại `ANONYMOUS_SURFACE`; actor alias `anonymous`; HTTP thực `401`; expected `[400, 401, 403, 415]`; **PASS**. Thông điệp lỗi: `Authentication is required or token is invalid`. 

<a id="tc-0061"></a>

### TC-0061 · MKT-001 · Kiểm tra bề mặt khi chưa đăng nhập

Loại `ANONYMOUS_SURFACE`; actor alias `anonymous`; HTTP thực `401`; expected `[400, 401, 403, 415]`; **PASS**. Thông điệp lỗi: `Authentication required`. 

<a id="tc-0062"></a>

### TC-0062 · MKT-002 · Kiểm tra bề mặt khi chưa đăng nhập

Loại `ANONYMOUS_SURFACE`; actor alias `anonymous`; HTTP thực `401`; expected `[400, 401, 403, 415]`; **PASS**. Thông điệp lỗi: `Authentication required`. 

<a id="tc-0063"></a>

### TC-0063 · MKT-003 · Kiểm tra bề mặt khi chưa đăng nhập

Loại `ANONYMOUS_SURFACE`; actor alias `anonymous`; HTTP thực `401`; expected `[400, 401, 403, 415]`; **PASS**. Thông điệp lỗi: `Authentication required`. 

<a id="tc-0064"></a>

### TC-0064 · MKT-004 · Kiểm tra bề mặt khi chưa đăng nhập

Loại `ANONYMOUS_SURFACE`; actor alias `anonymous`; HTTP thực `401`; expected `[400, 401, 403, 415]`; **PASS**. Thông điệp lỗi: `Authentication required`. 

<a id="tc-0065"></a>

### TC-0065 · MKT-005 · Kiểm tra bề mặt khi chưa đăng nhập

Loại `ANONYMOUS_SURFACE`; actor alias `anonymous`; HTTP thực `401`; expected `[400, 401, 403, 415]`; **PASS**. Thông điệp lỗi: `Authentication required`. 

<a id="tc-0066"></a>

### TC-0066 · MKT-006 · Kiểm tra bề mặt khi chưa đăng nhập

Loại `ANONYMOUS_SURFACE`; actor alias `anonymous`; HTTP thực `401`; expected `[400, 401, 403, 415]`; **PASS**. Thông điệp lỗi: `Authentication required`. 

<a id="tc-0067"></a>

### TC-0067 · MKT-007 · Kiểm tra bề mặt khi chưa đăng nhập

Loại `ANONYMOUS_SURFACE`; actor alias `anonymous`; HTTP thực `401`; expected `[400, 401, 403, 415]`; **PASS**. Thông điệp lỗi: `Authentication required`. 

<a id="tc-0068"></a>

### TC-0068 · MKT-008 · Kiểm tra bề mặt khi chưa đăng nhập

Loại `ANONYMOUS_SURFACE`; actor alias `anonymous`; HTTP thực `401`; expected `[400, 401, 403, 415]`; **PASS**. Thông điệp lỗi: `Authentication required`. 

<a id="tc-0069"></a>

### TC-0069 · MKT-009 · Kiểm tra bề mặt khi chưa đăng nhập

Loại `ANONYMOUS_SURFACE`; actor alias `anonymous`; HTTP thực `401`; expected `[400, 401, 403, 415]`; **PASS**. Thông điệp lỗi: `Authentication required`. 

<a id="tc-0070"></a>

### TC-0070 · MKT-010 · Kiểm tra bề mặt khi chưa đăng nhập

Loại `ANONYMOUS_SURFACE`; actor alias `anonymous`; HTTP thực `401`; expected `[400, 401, 403, 415]`; **PASS**. Thông điệp lỗi: `Authentication required`. 

<a id="tc-0071"></a>

### TC-0071 · MKT-011 · Kiểm tra bề mặt khi chưa đăng nhập

Loại `ANONYMOUS_SURFACE`; actor alias `anonymous`; HTTP thực `401`; expected `[400, 401, 403, 415]`; **PASS**. Thông điệp lỗi: `Authentication required`. 

<a id="tc-0072"></a>

### TC-0072 · MKT-012 · Kiểm tra bề mặt khi chưa đăng nhập

Loại `ANONYMOUS_SURFACE`; actor alias `anonymous`; HTTP thực `401`; expected `[400, 401, 403, 415]`; **PASS**. Thông điệp lỗi: `Authentication required`. 

<a id="tc-0073"></a>

### TC-0073 · MKT-013 · Kiểm tra bề mặt khi chưa đăng nhập

Loại `ANONYMOUS_SURFACE`; actor alias `anonymous`; HTTP thực `401`; expected `[400, 401, 403, 415]`; **PASS**. Thông điệp lỗi: `Authentication required`. 

<a id="tc-0074"></a>

### TC-0074 · MKT-014 · Kiểm tra bề mặt khi chưa đăng nhập

Loại `ANONYMOUS_SURFACE`; actor alias `anonymous`; HTTP thực `401`; expected `[400, 401, 403, 415]`; **PASS**. Thông điệp lỗi: `Authentication required`. 

<a id="tc-0075"></a>

### TC-0075 · MKT-015 · Kiểm tra bề mặt khi chưa đăng nhập

Loại `ANONYMOUS_SURFACE`; actor alias `anonymous`; HTTP thực `401`; expected `[400, 401, 403, 415]`; **PASS**. Thông điệp lỗi: `Authentication required`. 

<a id="tc-0076"></a>

### TC-0076 · MKT-016 · Kiểm tra bề mặt khi chưa đăng nhập

Loại `ANONYMOUS_SURFACE`; actor alias `anonymous`; HTTP thực `401`; expected `[400, 401, 403, 415]`; **PASS**. Thông điệp lỗi: `Authentication required`. 

<a id="tc-0077"></a>

### TC-0077 · MKT-017 · Kiểm tra bề mặt khi chưa đăng nhập

Loại `ANONYMOUS_SURFACE`; actor alias `anonymous`; HTTP thực `401`; expected `[400, 401, 403, 415]`; **PASS**. Thông điệp lỗi: `Authentication required`. 

<a id="tc-0078"></a>

### TC-0078 · MKT-018 · Kiểm tra bề mặt khi chưa đăng nhập

Loại `ANONYMOUS_SURFACE`; actor alias `anonymous`; HTTP thực `401`; expected `[400, 401, 403, 415]`; **PASS**. Thông điệp lỗi: `Authentication required`. 

<a id="tc-0079"></a>

### TC-0079 · ORD-001 · Kiểm tra bề mặt khi chưa đăng nhập

Loại `ANONYMOUS_SURFACE`; actor alias `anonymous`; HTTP thực `401`; expected `[400, 401, 403, 415]`; **PASS**. Thông điệp lỗi: `Authentication is required or token is invalid`. 

<a id="tc-0080"></a>

### TC-0080 · ORD-002 · Kiểm tra bề mặt khi chưa đăng nhập

Loại `ANONYMOUS_SURFACE`; actor alias `anonymous`; HTTP thực `401`; expected `[400, 401, 403, 415]`; **PASS**. Thông điệp lỗi: `Authentication is required or token is invalid`. 

<a id="tc-0081"></a>

### TC-0081 · ORD-003 · Kiểm tra bề mặt khi chưa đăng nhập

Loại `ANONYMOUS_SURFACE`; actor alias `anonymous`; HTTP thực `401`; expected `[400, 401, 403, 415]`; **PASS**. Thông điệp lỗi: `Authentication is required or token is invalid`. 

<a id="tc-0082"></a>

### TC-0082 · ORD-004 · Kiểm tra bề mặt khi chưa đăng nhập

Loại `ANONYMOUS_SURFACE`; actor alias `anonymous`; HTTP thực `401`; expected `[400, 401, 403, 415]`; **PASS**. Thông điệp lỗi: `Authentication is required or token is invalid`. 

<a id="tc-0083"></a>

### TC-0083 · ORD-005 · Kiểm tra bề mặt khi chưa đăng nhập

Loại `ANONYMOUS_SURFACE`; actor alias `anonymous`; HTTP thực `401`; expected `[400, 401, 403, 415]`; **PASS**. Thông điệp lỗi: `Authentication is required or token is invalid`. 

<a id="tc-0084"></a>

### TC-0084 · ORD-006 · Kiểm tra bề mặt khi chưa đăng nhập

Loại `ANONYMOUS_SURFACE`; actor alias `anonymous`; HTTP thực `401`; expected `[400, 401, 403, 415]`; **PASS**. Thông điệp lỗi: `Authentication is required or token is invalid`. 

<a id="tc-0085"></a>

### TC-0085 · ORD-007 · Kiểm tra bề mặt khi chưa đăng nhập

Loại `ANONYMOUS_SURFACE`; actor alias `anonymous`; HTTP thực `401`; expected `[400, 401, 403, 415]`; **PASS**. Thông điệp lỗi: `Authentication is required or token is invalid`. 

<a id="tc-0086"></a>

### TC-0086 · ORD-008 · Kiểm tra bề mặt khi chưa đăng nhập

Loại `ANONYMOUS_SURFACE`; actor alias `anonymous`; HTTP thực `401`; expected `[400, 401, 403, 415]`; **PASS**. Thông điệp lỗi: `Authentication is required or token is invalid`. 

<a id="tc-0087"></a>

### TC-0087 · ORD-009 · Kiểm tra bề mặt khi chưa đăng nhập

Loại `ANONYMOUS_SURFACE`; actor alias `anonymous`; HTTP thực `401`; expected `[400, 401, 403, 415]`; **PASS**. Thông điệp lỗi: `Authentication is required or token is invalid`. 

<a id="tc-0088"></a>

### TC-0088 · ORD-010 · Kiểm tra bề mặt khi chưa đăng nhập

Loại `ANONYMOUS_SURFACE`; actor alias `anonymous`; HTTP thực `401`; expected `[400, 401, 403, 415]`; **PASS**. Thông điệp lỗi: `Authentication is required or token is invalid`. 

<a id="tc-0089"></a>

### TC-0089 · SUB-001 · Kiểm tra bề mặt khi chưa đăng nhập

Loại `ANONYMOUS_SURFACE`; actor alias `anonymous`; HTTP thực `401`; expected `[400, 401, 403, 415]`; **PASS**. Thông điệp lỗi: `Authentication is required or token is invalid`. 

<a id="tc-0090"></a>

### TC-0090 · SUB-002 · Kiểm tra bề mặt khi chưa đăng nhập

Loại `ANONYMOUS_SURFACE`; actor alias `anonymous`; HTTP thực `401`; expected `[400, 401, 403, 415]`; **PASS**. Thông điệp lỗi: `Authentication is required or token is invalid`. 

<a id="tc-0091"></a>

### TC-0091 · SUB-003 · Kiểm tra bề mặt khi chưa đăng nhập

Loại `ANONYMOUS_SURFACE`; actor alias `anonymous`; HTTP thực `401`; expected `[400, 401, 403, 415]`; **PASS**. Thông điệp lỗi: `Authentication is required or token is invalid`. 

<a id="tc-0092"></a>

### TC-0092 · SUB-004 · Kiểm tra bề mặt khi chưa đăng nhập

Loại `ANONYMOUS_SURFACE`; actor alias `anonymous`; HTTP thực `401`; expected `[400, 401, 403, 415]`; **PASS**. Thông điệp lỗi: `Authentication is required or token is invalid`. 

<a id="tc-0093"></a>

### TC-0093 · SUB-005 · Kiểm tra bề mặt khi chưa đăng nhập

Loại `ANONYMOUS_SURFACE`; actor alias `anonymous`; HTTP thực `401`; expected `[400, 401, 403, 415]`; **PASS**. Thông điệp lỗi: `Authentication is required or token is invalid`. 

<a id="tc-0094"></a>

### TC-0094 · SUB-006 · Kiểm tra bề mặt khi chưa đăng nhập

Loại `ANONYMOUS_SURFACE`; actor alias `anonymous`; HTTP thực `401`; expected `[400, 401, 403, 415]`; **PASS**. Thông điệp lỗi: `Authentication is required or token is invalid`. 

<a id="tc-0095"></a>

### TC-0095 · SUB-007 · Kiểm tra bề mặt khi chưa đăng nhập

Loại `ANONYMOUS_SURFACE`; actor alias `anonymous`; HTTP thực `401`; expected `[400, 401, 403, 415]`; **PASS**. Thông điệp lỗi: `Authentication is required or token is invalid`. 

<a id="tc-0096"></a>

### TC-0096 · SUB-008 · Kiểm tra bề mặt khi chưa đăng nhập

Loại `ANONYMOUS_SURFACE`; actor alias `anonymous`; HTTP thực `401`; expected `[400, 401, 403, 415]`; **PASS**. Thông điệp lỗi: `Authentication is required or token is invalid`. 

<a id="tc-0097"></a>

### TC-0097 · SUB-009 · Kiểm tra bề mặt khi chưa đăng nhập

Loại `ANONYMOUS_SURFACE`; actor alias `anonymous`; HTTP thực `401`; expected `[400, 401, 403, 415]`; **PASS**. Thông điệp lỗi: `Authentication is required or token is invalid`. 

<a id="tc-0098"></a>

### TC-0098 · SUB-010 · Kiểm tra bề mặt khi chưa đăng nhập

Loại `ANONYMOUS_SURFACE`; actor alias `anonymous`; HTTP thực `401`; expected `[400, 401, 403, 415]`; **PASS**. Thông điệp lỗi: `Authentication is required or token is invalid`. 

<a id="tc-0099"></a>

### TC-0099 · SUB-011 · Kiểm tra bề mặt khi chưa đăng nhập

Loại `ANONYMOUS_SURFACE`; actor alias `anonymous`; HTTP thực `401`; expected `[400, 401, 403, 415]`; **PASS**. Thông điệp lỗi: `Authentication is required or token is invalid`. 

<a id="tc-0100"></a>

### TC-0100 · SUB-012 · Kiểm tra bề mặt khi chưa đăng nhập

Loại `ANONYMOUS_SURFACE`; actor alias `anonymous`; HTTP thực `401`; expected `[400, 401, 403, 415]`; **PASS**. Thông điệp lỗi: `Authentication is required or token is invalid`. 

<a id="tc-0101"></a>

### TC-0101 · SUB-013 · Kiểm tra bề mặt khi chưa đăng nhập

Loại `ANONYMOUS_SURFACE`; actor alias `anonymous`; HTTP thực `200`; expected `[200, 404]`; **PASS**. 

<a id="tc-0102"></a>

### TC-0102 · SUB-014 · Kiểm tra bề mặt khi chưa đăng nhập

Loại `ANONYMOUS_SURFACE`; actor alias `anonymous`; HTTP thực `200`; expected `[400, 401, 403, 415]`; **FAIL**. Payment options public matcher; corrected TC-0216.

<a id="tc-0103"></a>

### TC-0103 · SUB-015 · Kiểm tra bề mặt khi chưa đăng nhập

Loại `ANONYMOUS_SURFACE`; actor alias `anonymous`; HTTP thực `404`; expected `[200, 404]`; **PASS**. Thông điệp lỗi: `Active plan not found`. 

<a id="tc-0104"></a>

### TC-0104 · SUB-016 · Kiểm tra bề mặt khi chưa đăng nhập

Loại `ANONYMOUS_SURFACE`; actor alias `anonymous`; HTTP thực `401`; expected `[400, 401, 403, 415]`; **PASS**. Thông điệp lỗi: `Authentication is required or token is invalid`. 

<a id="tc-0105"></a>

### TC-0105 · IDN-006 · Tạo tài khoản tổng hợp admin

Loại `BUSINESS`; actor alias `anonymous`; HTTP thực `201`; expected `[201]`; **PASS**. 

<a id="tc-0106"></a>

### TC-0106 · IDN-002 · Đăng nhập admin

Loại `BUSINESS`; actor alias `anonymous`; HTTP thực `200`; expected `[200]`; **PASS**. 

<a id="tc-0107"></a>

### TC-0107 · IDN-006 · Tạo tài khoản tổng hợp ownerA

Loại `BUSINESS`; actor alias `anonymous`; HTTP thực `201`; expected `[201]`; **PASS**. 

<a id="tc-0108"></a>

### TC-0108 · IDN-002 · Đăng nhập ownerA

Loại `BUSINESS`; actor alias `anonymous`; HTTP thực `200`; expected `[200]`; **PASS**. 

<a id="tc-0109"></a>

### TC-0109 · IDN-006 · Tạo tài khoản tổng hợp ownerB

Loại `BUSINESS`; actor alias `anonymous`; HTTP thực `201`; expected `[201]`; **PASS**. 

<a id="tc-0110"></a>

### TC-0110 · IDN-002 · Đăng nhập ownerB

Loại `BUSINESS`; actor alias `anonymous`; HTTP thực `200`; expected `[200]`; **PASS**. 

<a id="tc-0111"></a>

### TC-0111 · IDN-006 · Tạo tài khoản tổng hợp customerA

Loại `BUSINESS`; actor alias `anonymous`; HTTP thực `201`; expected `[201]`; **PASS**. 

<a id="tc-0112"></a>

### TC-0112 · IDN-002 · Đăng nhập customerA

Loại `BUSINESS`; actor alias `anonymous`; HTTP thực `200`; expected `[200]`; **PASS**. 

<a id="tc-0113"></a>

### TC-0113 · IDN-006 · Tạo tài khoản tổng hợp customerB

Loại `BUSINESS`; actor alias `anonymous`; HTTP thực `201`; expected `[201]`; **PASS**. 

<a id="tc-0114"></a>

### TC-0114 · IDN-002 · Đăng nhập customerB

Loại `BUSINESS`; actor alias `anonymous`; HTTP thực `200`; expected `[200]`; **PASS**. 

<a id="tc-0115"></a>

### TC-0115 · IDN-002 · Đăng nhập admin

Loại `BUSINESS`; actor alias `anonymous`; HTTP thực `200`; expected `[200]`; **PASS**. 

<a id="tc-0116"></a>

### TC-0116 · SUB-005 · Admin tạo gói ACTIVE

Loại `BUSINESS`; actor alias `admin`; HTTP thực `201`; expected `[201]`; **PASS**. 

<a id="tc-0117"></a>

### TC-0117 · BKR-006 · Onboarding ban đầu

Loại `BUSINESS`; actor alias `ownerA`; HTTP thực `200`; expected `[200]`; **PASS**. 

<a id="tc-0118"></a>

### TC-0118 · BKR-007 · CUSTOMER gửi onboarding

Loại `BUSINESS`; actor alias `ownerA`; HTTP thực `200`; expected `[201, 200]`; **PASS**. 

<a id="tc-0119"></a>

### TC-0119 · BKR-003 · Admin duyệt bakery ACTIVE

Loại `BUSINESS`; actor alias `admin`; HTTP thực `200`; expected `[200]`; **PASS**. 

<a id="tc-0120"></a>

### TC-0120 · SUB-010 · Tạo đơn thuê bao

Loại `BUSINESS`; actor alias `ownerA`; HTTP thực `201`; expected `[201]`; **PASS**. 

<a id="tc-0121"></a>

### TC-0121 · SUB-012 · Gửi chứng từ nội bộ tổng hợp, không chuyển tiền

Loại `BUSINESS`; actor alias `ownerA`; HTTP thực `201`; expected `[201]`; **PASS**. 

<a id="tc-0122"></a>

### TC-0122 · SUB-002 · Admin xác nhận chứng từ tổng hợp

Loại `BUSINESS`; actor alias `admin`; HTTP thực `200`; expected `[200]`; **PASS**. 

<a id="tc-0123"></a>

### TC-0123 · BKR-022 · Hoàn tất cấp OWNER

Loại `BUSINESS`; actor alias `ownerA`; HTTP thực `204`; expected `[200]`; **FAIL**. Expected status phải204; corrected TC-0217.

<a id="tc-0124"></a>

### TC-0124 · IDN-002 · Đăng nhập ownerA

Loại `BUSINESS`; actor alias `anonymous`; HTTP thực `200`; expected `[200]`; **PASS**. 

<a id="tc-0125"></a>

### TC-0125 · BKR-006 · Onboarding ban đầu

Loại `BUSINESS`; actor alias `ownerB`; HTTP thực `200`; expected `[200]`; **PASS**. 

<a id="tc-0126"></a>

### TC-0126 · BKR-007 · CUSTOMER gửi onboarding

Loại `BUSINESS`; actor alias `ownerB`; HTTP thực `200`; expected `[201, 200]`; **PASS**. 

<a id="tc-0127"></a>

### TC-0127 · BKR-003 · Admin duyệt bakery ACTIVE

Loại `BUSINESS`; actor alias `admin`; HTTP thực `200`; expected `[200]`; **PASS**. 

<a id="tc-0128"></a>

### TC-0128 · SUB-010 · Tạo đơn thuê bao

Loại `BUSINESS`; actor alias `ownerB`; HTTP thực `201`; expected `[201]`; **PASS**. 

<a id="tc-0129"></a>

### TC-0129 · SUB-012 · Gửi chứng từ nội bộ tổng hợp, không chuyển tiền

Loại `BUSINESS`; actor alias `ownerB`; HTTP thực `201`; expected `[201]`; **PASS**. 

<a id="tc-0130"></a>

### TC-0130 · SUB-002 · Admin xác nhận chứng từ tổng hợp

Loại `BUSINESS`; actor alias `admin`; HTTP thực `200`; expected `[200]`; **PASS**. 

<a id="tc-0131"></a>

### TC-0131 · BKR-022 · Hoàn tất cấp OWNER

Loại `BUSINESS`; actor alias `ownerB`; HTTP thực `204`; expected `[200]`; **FAIL**. Expected status phải204; corrected TC-0218.

<a id="tc-0132"></a>

### TC-0132 · IDN-002 · Đăng nhập ownerB

Loại `BUSINESS`; actor alias `anonymous`; HTTP thực `200`; expected `[200]`; **PASS**. 

<a id="tc-0133"></a>

### TC-0133 · BKR-001 · Đọc dữ liệu fixture thật

Loại `BUSINESS`; actor alias `admin`; HTTP thực `200`; expected `[200]`; **PASS**. 

<a id="tc-0134"></a>

### TC-0134 · BKR-002 · Đọc dữ liệu fixture thật

Loại `BUSINESS`; actor alias `admin`; HTTP thực `200`; expected `[200]`; **PASS**. 

<a id="tc-0135"></a>

### TC-0135 · BKR-004 · Đọc dữ liệu fixture thật

Loại `BUSINESS`; actor alias `anonymous`; HTTP thực `200`; expected `[200]`; **PASS**. 

<a id="tc-0136"></a>

### TC-0136 · BKR-008 · Đọc dữ liệu fixture thật

Loại `BUSINESS`; actor alias `anonymous`; HTTP thực `200`; expected `[200]`; **PASS**. 

<a id="tc-0137"></a>

### TC-0137 · BKR-021 · Đọc dữ liệu fixture thật

Loại `BUSINESS`; actor alias `ownerA`; HTTP thực `200`; expected `[200]`; **PASS**. 

<a id="tc-0138"></a>

### TC-0138 · BKR-006 · Đọc dữ liệu fixture thật

Loại `BUSINESS`; actor alias `ownerA`; HTTP thực `200`; expected `[200]`; **PASS**. 

<a id="tc-0139"></a>

### TC-0139 · SUB-013 · Đọc dữ liệu fixture thật

Loại `BUSINESS`; actor alias `anonymous`; HTTP thực `200`; expected `[200]`; **PASS**. 

<a id="tc-0140"></a>

### TC-0140 · SUB-014 · Đọc dữ liệu fixture thật

Loại `BUSINESS`; actor alias `ownerA`; HTTP thực `200`; expected `[200]`; **PASS**. 

<a id="tc-0141"></a>

### TC-0141 · SUB-015 · Đọc dữ liệu fixture thật

Loại `BUSINESS`; actor alias `anonymous`; HTTP thực `200`; expected `[200]`; **PASS**. 

<a id="tc-0142"></a>

### TC-0142 · SUB-004 · Đọc dữ liệu fixture thật

Loại `BUSINESS`; actor alias `admin`; HTTP thực `200`; expected `[200]`; **PASS**. 

<a id="tc-0143"></a>

### TC-0143 · SUB-001 · Đọc dữ liệu fixture thật

Loại `BUSINESS`; actor alias `admin`; HTTP thực `200`; expected `[200]`; **PASS**. 

<a id="tc-0144"></a>

### TC-0144 · SUB-008 · Đọc dữ liệu fixture thật

Loại `BUSINESS`; actor alias `ownerA`; HTTP thực `200`; expected `[200]`; **PASS**. 

<a id="tc-0145"></a>

### TC-0145 · SUB-009 · Đọc dữ liệu fixture thật

Loại `BUSINESS`; actor alias `ownerA`; HTTP thực `200`; expected `[200]`; **PASS**. 

<a id="tc-0146"></a>

### TC-0146 · BKR-009 · Chủ tiệm khác sửa bakery bị từ chối

Loại `BUSINESS`; actor alias `ownerB`; HTTP thực `403`; expected `[403]`; **PASS**. Thông điệp lỗi: `Access is denied`. 

<a id="tc-0147"></a>

### TC-0147 · BKR-009 · Chủ tiệm cập nhật profile

Loại `BUSINESS`; actor alias `ownerA`; HTTP thực `200`; expected `[200]`; **PASS**. 

<a id="tc-0148"></a>

### TC-0148 · BKR-023 · Thay thế lịch/địa chỉ/phạm vi giao

Loại `BUSINESS`; actor alias `ownerA`; HTTP thực `200`; expected `[200]`; **PASS**. 

<a id="tc-0149"></a>

### TC-0149 · BKR-019 · Upload PNG thật vào MinIO audit

Loại `BUSINESS`; actor alias `ownerA`; HTTP thực `201`; expected `[201]`; **PASS**. 

<a id="tc-0150"></a>

### TC-0150 · BKR-020 · Upload PNG thật vào MinIO audit

Loại `BUSINESS`; actor alias `ownerA`; HTTP thực `201`; expected `[201]`; **PASS**. 

<a id="tc-0151"></a>

### TC-0151 · BKR-016 · Tạo danh mục

Loại `BUSINESS`; actor alias `ownerA`; HTTP thực `400`; expected `[201]`; **FAIL**. Thông điệp lỗi: `slug is required`. Fixture thiếu category.slug; corrected TC-0152.

<a id="tc-0152"></a>

### TC-0152 · BKR-016 · Tạo danh mục đủ slug

Loại `BUSINESS`; actor alias `ownerA`; HTTP thực `201`; expected `[201]`; **PASS**. 

<a id="tc-0153"></a>

### TC-0153 · BKR-025 · Tạo sản phẩm DRAFT

Loại `BUSINESS`; actor alias `ownerA`; HTTP thực `201`; expected `[201]`; **PASS**. 

<a id="tc-0154"></a>

### TC-0154 · BKR-011 · Tạo add-on

Loại `BUSINESS`; actor alias `ownerA`; HTTP thực `400`; expected `[201]`; **FAIL**. Thông điệp lỗi: `category is required`. Fixture thiếu add-on.category; corrected TC-0155.

<a id="tc-0155"></a>

### TC-0155 · BKR-011 · Tạo add-on đủ category

Loại `BUSINESS`; actor alias `ownerA`; HTTP thực `201`; expected `[201]`; **PASS**. 

<a id="tc-0156"></a>

### TC-0156 · BKR-010 · Danh sách quản trị bakery

Loại `BUSINESS`; actor alias `ownerA`; HTTP thực `200`; expected `[200]`; **PASS**. 

<a id="tc-0157"></a>

### TC-0157 · BKR-015 · Danh sách quản trị bakery

Loại `BUSINESS`; actor alias `ownerA`; HTTP thực `200`; expected `[200]`; **PASS**. 

<a id="tc-0158"></a>

### TC-0158 · BKR-024 · Danh sách quản trị bakery

Loại `BUSINESS`; actor alias `ownerA`; HTTP thực `200`; expected `[200]`; **PASS**. 

<a id="tc-0159"></a>

### TC-0159 · BKR-018 · Sửa danh mục

Loại `BUSINESS`; actor alias `ownerA`; HTTP thực `200`; expected `[200]`; **PASS**. 

<a id="tc-0160"></a>

### TC-0160 · BKR-013 · Sửa add-on

Loại `BUSINESS`; actor alias `ownerA`; HTTP thực `200`; expected `[200]`; **PASS**. 

<a id="tc-0161"></a>

### TC-0161 · BKR-014 · Upload ảnh add-on

Loại `BUSINESS`; actor alias `ownerA`; HTTP thực `201`; expected `[201]`; **PASS**. 

<a id="tc-0162"></a>

### TC-0162 · BKR-026 · Sửa product

Loại `BUSINESS`; actor alias `ownerA`; HTTP thực `200`; expected `[200]`; **PASS**. 

<a id="tc-0163"></a>

### TC-0163 · BKR-031 · Thay thế options rỗng hợp lệ

Loại `BUSINESS`; actor alias `ownerA`; HTTP thực `200`; expected `[200]`; **PASS**. 

<a id="tc-0164"></a>

### TC-0164 · BKR-029 · Upload ảnh primary sản phẩm

Loại `BUSINESS`; actor alias `ownerA`; HTTP thực `201`; expected `[201]`; **PASS**. 

<a id="tc-0165"></a>

### TC-0165 · BKR-032 · Publish sau entitlement và primary image

Loại `BUSINESS`; actor alias `ownerA`; HTTP thực `200`; expected `[200]`; **PASS**. 

<a id="tc-0166"></a>

### TC-0166 · BKR-034 · Danh sách sản phẩm public

Loại `BUSINESS`; actor alias `anonymous`; HTTP thực `200`; expected `[200]`; **PASS**. 

<a id="tc-0167"></a>

### TC-0167 · BKR-035 · Chi tiết sản phẩm public

Loại `BUSINESS`; actor alias `anonymous`; HTTP thực `200`; expected `[200]`; **PASS**. 

<a id="tc-0168"></a>

### TC-0168 · SUB-006 · Sửa gói không ảnh hưởng snapshot đơn

Loại `BUSINESS`; actor alias `admin`; HTTP thực `200`; expected `[200]`; **PASS**. 

<a id="tc-0169"></a>

### TC-0169 · MKT-002 · CUSTOMER tạo RFQ OPEN draft

Loại `BUSINESS`; actor alias `customerA`; HTTP thực `400`; expected `[201]`; **FAIL**. Thông điệp lỗi: `Invalid request`. Fixture requestType sai OPEN thay OPEN_CUSTOM; corrected TC-0170.

<a id="tc-0170"></a>

### TC-0170 · MKT-002 · CUSTOMER tạo RFQ OPEN_CUSTOM draft

Loại `BUSINESS`; actor alias `customerA`; HTTP thực `201`; expected `[201]`; **PASS**. 

<a id="tc-0171"></a>

### TC-0171 · MKT-004 · Sửa draft

Loại `BUSINESS`; actor alias `customerA`; HTTP thực `200`; expected `[200]`; **PASS**. 

<a id="tc-0172"></a>

### TC-0172 · MKT-003 · Khách khác không đọc request riêng

Loại `BUSINESS`; actor alias `customerB`; HTTP thực `403`; expected `[404, 403]`; **PASS**. Thông điệp lỗi: `Access denied`. 

<a id="tc-0173"></a>

### TC-0173 · MKT-009 · Publish RFQ

Loại `BUSINESS`; actor alias `customerA`; HTTP thực `200`; expected `[200]`; **PASS**. 

<a id="tc-0174"></a>

### TC-0174 · MKT-001 · Customer mine

Loại `BUSINESS`; actor alias `customerA`; HTTP thực `200`; expected `[200]`; **PASS**. 

<a id="tc-0175"></a>

### TC-0175 · MKT-003 · Chủ tiệm đọc OPEN trong service area

Loại `BUSINESS`; actor alias `ownerA`; HTTP thực `200`; expected `[200]`; **PASS**. 

<a id="tc-0176"></a>

### TC-0176 · MKT-006 · Upload cần Firebase chưa cấu hình

Loại `BUSINESS`; actor alias `customerA`; HTTP thực `409`; expected `[503]`; **FAIL**. Thông điệp lỗi: `Resource state conflict`. RFQ đã OPEN nên409 trước storage; draft đúng TC-0259→503.

<a id="tc-0177"></a>

### TC-0177 · MKT-008 · Owner gửi offer thật

Loại `BUSINESS`; actor alias `ownerA`; HTTP thực `201`; expected `[201]`; **PASS**. 

<a id="tc-0178"></a>

### TC-0178 · MKT-012 · Chi tiết offer

Loại `BUSINESS`; actor alias `customerA`; HTTP thực `200`; expected `[200]`; **PASS**. 

<a id="tc-0179"></a>

### TC-0179 · MKT-011 · Danh sách offer

Loại `BUSINESS`; actor alias `ownerA`; HTTP thực `200`; expected `[200]`; **PASS**. 

<a id="tc-0180"></a>

### TC-0180 · MKT-013 · Sửa giá offer pending

Loại `BUSINESS`; actor alias `ownerA`; HTTP thực `200`; expected `[200]`; **PASS**. 

<a id="tc-0181"></a>

### TC-0181 · CHT-002 · Tạo conversation theo request/offer

Loại `BUSINESS`; actor alias `customerA`; HTTP thực `201`; expected `[201, 200]`; **PASS**. 

<a id="tc-0182"></a>

### TC-0182 · CHT-001 · Danh sách conversation

Loại `BUSINESS`; actor alias `customerA`; HTTP thực `200`; expected `[200]`; **PASS**. 

<a id="tc-0183"></a>

### TC-0183 · CHT-003 · Chủ tiệm join/read conversation

Loại `BUSINESS`; actor alias `ownerA`; HTTP thực `200`; expected `[200]`; **PASS**. 

<a id="tc-0184"></a>

### TC-0184 · CHT-003 · Khách khác bị che conversation

Loại `BUSINESS`; actor alias `customerB`; HTTP thực `404`; expected `[404]`; **PASS**. Thông điệp lỗi: `Conversation not found`. 

<a id="tc-0185"></a>

### TC-0185 · CHT-006 · Gửi TEXT multipart

Loại `BUSINESS`; actor alias `customerA`; HTTP thực `201`; expected `[201]`; **PASS**. 

<a id="tc-0186"></a>

### TC-0186 · CHT-006 · Replay clientMessageId giống payload

Loại `BUSINESS`; actor alias `customerA`; HTTP thực `200`; expected `[200]`; **PASS**. 

<a id="tc-0187"></a>

### TC-0187 · CHT-006 · Replay clientMessageId khác payload

Loại `BUSINESS`; actor alias `customerA`; HTTP thực `409`; expected `[409]`; **PASS**. Thông điệp lỗi: `clientMessageId was already used with a different message payload`. 

<a id="tc-0188"></a>

### TC-0188 · CHT-005 · Đọc message và đánh dấu delivered

Loại `BUSINESS`; actor alias `ownerA`; HTTP thực `403`; expected `[200]`; **FAIL**. Thông điệp lỗi: `Access is denied`. 

<a id="tc-0189"></a>

### TC-0189 · CHT-008 · Mark read

Loại `BUSINESS`; actor alias `ownerA`; HTTP thực `200`; expected `[200]`; **PASS**. 

<a id="tc-0190"></a>

### TC-0190 · CHT-007 · Sender xóa mềm message

Loại `BUSINESS`; actor alias `customerA`; HTTP thực `204`; expected `[204]`; **PASS**. 

<a id="tc-0191"></a>

### TC-0191 · CHT-004 · CUSTOMER không được đóng chat

Loại `BUSINESS`; actor alias `customerA`; HTTP thực `200`; expected `[404, 403]`; **FAIL**. Source cho chính customer close; corrected TC-0255.

<a id="tc-0192"></a>

### TC-0192 · CHT-004 · OWNER đóng chat

Loại `BUSINESS`; actor alias `ownerA`; HTTP thực `200`; expected `[200]`; **PASS**. 

<a id="tc-0193"></a>

### TC-0193 · ORD-003 · Direct order với địa chỉ hợp lệ từ Identity

Loại `BUSINESS`; actor alias `customerA`; HTTP thực `422`; expected `[201]`; **FAIL**. Thông điệp lỗi: `Delivery address is missing or incomplete`. 

<a id="tc-0194"></a>

### TC-0194 · MKT-014 · Accept offer tạo order thật xuyên 4 service

Loại `BUSINESS`; actor alias `customerA`; HTTP thực `200`; expected `[200]`; **PASS**. 

<a id="tc-0195"></a>

### TC-0195 · MKT-014 · Replay acceptance giống key

Loại `BUSINESS`; actor alias `customerA`; HTTP thực `200`; expected `[200]`; **PASS**. 

<a id="tc-0196"></a>

### TC-0196 · ORD-002 · Customer đọc danh sách đơn

Loại `BUSINESS`; actor alias `customerA`; HTTP thực `200`; expected `[200]`; **PASS**. 

<a id="tc-0197"></a>

### TC-0197 · ORD-004 · Đọc order snapshots

Loại `BUSINESS`; actor alias `customerA`; HTTP thực `200`; expected `[200]`; **PASS**. 

<a id="tc-0198"></a>

### TC-0198 · ORD-004 · Khách khác không đọc order

Loại `BUSINESS`; actor alias `customerB`; HTTP thực `403`; expected `[404, 403]`; **PASS**. Thông điệp lỗi: `You are not allowed to access this order`. 

<a id="tc-0199"></a>

### TC-0199 · ORD-007 · Review trước COMPLETED bị chặn

Loại `BUSINESS`; actor alias `customerA`; HTTP thực `422`; expected `[409, 422]`; **PASS**. Thông điệp lỗi: `Only completed orders can be reviewed`. 

<a id="tc-0200"></a>

### TC-0200 · ORD-008 · Customer không tự hoàn tất đơn

Loại `BUSINESS`; actor alias `customerA`; HTTP thực `403`; expected `[403]`; **PASS**. Thông điệp lỗi: `You are not allowed to access this order`. 

<a id="tc-0201"></a>

### TC-0201 · ORD-008 · Owner chuyển trạng thái CONFIRMED

Loại `BUSINESS`; actor alias `ownerA`; HTTP thực `200`; expected `[200]`; **PASS**. 

<a id="tc-0202"></a>

### TC-0202 · ORD-008 · Owner chuyển trạng thái BAKING

Loại `BUSINESS`; actor alias `ownerA`; HTTP thực `200`; expected `[200]`; **PASS**. 

<a id="tc-0203"></a>

### TC-0203 · ORD-008 · Owner chuyển trạng thái READY

Loại `BUSINESS`; actor alias `ownerA`; HTTP thực `200`; expected `[200]`; **PASS**. 

<a id="tc-0204"></a>

### TC-0204 · ORD-008 · Owner chuyển trạng thái DELIVERING

Loại `BUSINESS`; actor alias `ownerA`; HTTP thực `200`; expected `[200]`; **PASS**. 

<a id="tc-0205"></a>

### TC-0205 · ORD-008 · Owner chuyển trạng thái COMPLETED

Loại `BUSINESS`; actor alias `ownerA`; HTTP thực `200`; expected `[200]`; **PASS**. 

<a id="tc-0206"></a>

### TC-0206 · ORD-007 · Tạo review khi COMPLETED

Loại `BUSINESS`; actor alias `customerA`; HTTP thực `201`; expected `[201]`; **PASS**. 

<a id="tc-0207"></a>

### TC-0207 · ORD-007 · Review trùng order

Loại `BUSINESS`; actor alias `customerA`; HTTP thực `409`; expected `[409]`; **PASS**. Thông điệp lỗi: `Order already has a review`. 

<a id="tc-0208"></a>

### TC-0208 · ORD-006 · Cập nhật review

Loại `BUSINESS`; actor alias `customerA`; HTTP thực `200`; expected `[200]`; **PASS**. 

<a id="tc-0209"></a>

### TC-0209 · ORD-001 · Admin ẩn review

Loại `BUSINESS`; actor alias `admin`; HTTP thực `200`; expected `[200]`; **PASS**. 

<a id="tc-0210"></a>

### TC-0210 · ORD-005 · Customer xóa review mềm

Loại `BUSINESS`; actor alias `customerA`; HTTP thực `204`; expected `[204]`; **PASS**. 

<a id="tc-0211"></a>

### TC-0211 · IDN-002 · Đăng nhập admin

Loại `BUSINESS`; actor alias `anonymous`; HTTP thực `200`; expected `[200]`; **PASS**. 

<a id="tc-0212"></a>

### TC-0212 · IDN-002 · Đăng nhập ownerA

Loại `BUSINESS`; actor alias `anonymous`; HTTP thực `200`; expected `[200]`; **PASS**. 

<a id="tc-0213"></a>

### TC-0213 · IDN-002 · Đăng nhập ownerB

Loại `BUSINESS`; actor alias `anonymous`; HTTP thực `200`; expected `[200]`; **PASS**. 

<a id="tc-0214"></a>

### TC-0214 · IDN-002 · Đăng nhập customerA

Loại `BUSINESS`; actor alias `anonymous`; HTTP thực `200`; expected `[200]`; **PASS**. 

<a id="tc-0215"></a>

### TC-0215 · IDN-002 · Đăng nhập customerB

Loại `BUSINESS`; actor alias `anonymous`; HTTP thực `200`; expected `[200]`; **PASS**. 

<a id="tc-0216"></a>

### TC-0216 · SUB-014 · Payment options public theo matcher thực tế

Loại `BUSINESS`; actor alias `anonymous`; HTTP thực `200`; expected `[200]`; **PASS**. 

<a id="tc-0217"></a>

### TC-0217 · BKR-022 · Complete idempotent trả 204

Loại `BUSINESS`; actor alias `ownerA`; HTTP thực `204`; expected `[204]`; **PASS**. 

<a id="tc-0218"></a>

### TC-0218 · BKR-022 · Complete idempotent trả 204

Loại `BUSINESS`; actor alias `ownerB`; HTTP thực `204`; expected `[204]`; **PASS**. 

<a id="tc-0219"></a>

### TC-0219 · IDN-004 · JWT me

Loại `BUSINESS`; actor alias `customerA`; HTTP thực `200`; expected `[200]`; **PASS**. 

<a id="tc-0220"></a>

### TC-0220 · IDN-005 · Refresh rotation cookie

Loại `BUSINESS`; actor alias `anonymous`; HTTP thực `200`; expected `[200]`; **PASS**. 

<a id="tc-0221"></a>

### TC-0221 · IDN-005 · Replay refresh cũ bị từ chối, revoke family

Loại `BUSINESS`; actor alias `anonymous`; HTTP thực `401`; expected `[401]`; **PASS**. Thông điệp lỗi: `Refresh token is missing, expired, revoked, or invalid`. 

<a id="tc-0222"></a>

### TC-0222 · IDN-005 · Token con sau replay cũng bị thu hồi

Loại `BUSINESS`; actor alias `anonymous`; HTTP thực `401`; expected `[401]`; **PASS**. Thông điệp lỗi: `Refresh token is missing, expired, revoked, or invalid`. 

<a id="tc-0223"></a>

### TC-0223 · IDN-002 · Đăng nhập customerB

Loại `BUSINESS`; actor alias `anonymous`; HTTP thực `200`; expected `[200]`; **PASS**. 

<a id="tc-0224"></a>

### TC-0224 · IDN-003 · Logout xóa refresh cookie

Loại `BUSINESS`; actor alias `customerB`; HTTP thực `200`; expected `[204]`; **FAIL**. Logout trả200 theo controller; corrected TC-0273.

<a id="tc-0225"></a>

### TC-0225 · IDN-004 · Access JWT còn hiệu lực sau logout

Loại `BUSINESS`; actor alias `customerB`; HTTP thực `200`; expected `[200]`; **PASS**. 

<a id="tc-0226"></a>

### TC-0226 · IDN-002 · Sai mật khẩu trả 401

Loại `BUSINESS`; actor alias `anonymous`; HTTP thực `401`; expected `[401]`; **PASS**. Thông điệp lỗi: `Invalid email or password`. 

<a id="tc-0227"></a>

### TC-0227 · IDN-006 · Email trùng trả 409

Loại `BUSINESS`; actor alias `anonymous`; HTTP thực `409`; expected `[409]`; **PASS**. Thông điệp lỗi: `Email is already registered`. 

<a id="tc-0228"></a>

### TC-0228 · BKR-001 · Customer không vào admin

Loại `BUSINESS`; actor alias `customerA`; HTTP thực `403`; expected `[403]`; **PASS**. Thông điệp lỗi: `Access is denied`. 

<a id="tc-0229"></a>

### TC-0229 · IDN-007 · Cấp service token: order-service -> bakery-service

Loại `BUSINESS`; actor alias `anonymous`; HTTP thực `200`; expected `[200]`; **PASS**. 

<a id="tc-0230"></a>

### TC-0230 · BKR-036 · Service contract với JWT đúng scope

Loại `BUSINESS`; actor alias `anonymous`; HTTP thực `200`; expected `[200]`; **PASS**. 

<a id="tc-0231"></a>

### TC-0231 · BKR-036 · User token không thay service token

Loại `BUSINESS`; actor alias `customerA`; HTTP thực `403`; expected `[401, 403]`; **PASS**. Thông điệp lỗi: `Access is denied`. 

<a id="tc-0232"></a>

### TC-0232 · IDN-007 · Cấp service token: chat-service -> bakery-service

Loại `BUSINESS`; actor alias `anonymous`; HTTP thực `200`; expected `[200]`; **PASS**. 

<a id="tc-0233"></a>

### TC-0233 · BKR-037 · Service contract với JWT đúng scope

Loại `BUSINESS`; actor alias `anonymous`; HTTP thực `200`; expected `[200]`; **PASS**. 

<a id="tc-0234"></a>

### TC-0234 · IDN-007 · Cấp service token: order-service -> bakery-service

Loại `BUSINESS`; actor alias `anonymous`; HTTP thực `200`; expected `[200]`; **PASS**. 

<a id="tc-0235"></a>

### TC-0235 · BKR-042 · Service contract với JWT đúng scope

Loại `BUSINESS`; actor alias `anonymous`; HTTP thực `200`; expected `[200]`; **PASS**. 

<a id="tc-0236"></a>

### TC-0236 · IDN-007 · Cấp service token: subscription-service -> bakery-service

Loại `BUSINESS`; actor alias `anonymous`; HTTP thực `200`; expected `[200]`; **PASS**. 

<a id="tc-0237"></a>

### TC-0237 · BKR-038 · Service contract với JWT đúng scope

Loại `BUSINESS`; actor alias `anonymous`; HTTP thực `204`; expected `[204]`; **PASS**. 

<a id="tc-0238"></a>

### TC-0238 · IDN-007 · Cấp service token: order-service -> bakery-service

Loại `BUSINESS`; actor alias `anonymous`; HTTP thực `200`; expected `[200]`; **PASS**. 

<a id="tc-0239"></a>

### TC-0239 · BKR-041 · Service contract với JWT đúng scope

Loại `BUSINESS`; actor alias `anonymous`; HTTP thực `200`; expected `[200]`; **PASS**. 

<a id="tc-0240"></a>

### TC-0240 · IDN-007 · Cấp service token: order-service -> identity-service

Loại `BUSINESS`; actor alias `anonymous`; HTTP thực `200`; expected `[200]`; **PASS**. 

<a id="tc-0241"></a>

### TC-0241 · IDN-008 · Service contract với JWT đúng scope

Loại `BUSINESS`; actor alias `anonymous`; HTTP thực `404`; expected `[200]`; **FAIL**. Thông điệp lỗi: `User not found not found`. Route {id} chưa được thay đúng, dùng zero UUID; corrected TC-0270.

<a id="tc-0242"></a>

### TC-0242 · IDN-007 · Cấp service token: order-service -> identity-service

Loại `BUSINESS`; actor alias `anonymous`; HTTP thực `200`; expected `[200]`; **PASS**. 

<a id="tc-0243"></a>

### TC-0243 · IDN-010 · Service contract với JWT đúng scope

Loại `BUSINESS`; actor alias `anonymous`; HTTP thực `200`; expected `[200]`; **PASS**. 

<a id="tc-0244"></a>

### TC-0244 · IDN-007 · Cấp service token: bakery-service -> identity-service

Loại `BUSINESS`; actor alias `anonymous`; HTTP thực `200`; expected `[200]`; **PASS**. 

<a id="tc-0245"></a>

### TC-0245 · IDN-009 · Service contract với JWT đúng scope

Loại `BUSINESS`; actor alias `anonymous`; HTTP thực `404`; expected `[204]`; **FAIL**. Thông điệp lỗi: `User not found not found`. Route {id} chưa được thay đúng; corrected TC-0272.

<a id="tc-0246"></a>

### TC-0246 · IDN-007 · Cấp service token: bakery-service -> subscription-service

Loại `BUSINESS`; actor alias `anonymous`; HTTP thực `200`; expected `[200]`; **PASS**. 

<a id="tc-0247"></a>

### TC-0247 · SUB-016 · Service contract với JWT đúng scope

Loại `BUSINESS`; actor alias `anonymous`; HTTP thực `200`; expected `[200]`; **PASS**. 

<a id="tc-0248"></a>

### TC-0248 · SUB-016 · Service token thiếu X-Correlation-Id

Loại `SECURITY`; actor alias `service`; HTTP thực `403`; expected `[403]`; **PASS**. 

<a id="tc-0249"></a>

### TC-0249 · IDN-007 · Cấp service token: chat-service -> marketplace-service

Loại `BUSINESS`; actor alias `anonymous`; HTTP thực `200`; expected `[200]`; **PASS**. 

<a id="tc-0250"></a>

### TC-0250 · MKT-016 · Service contract với JWT đúng scope

Loại `BUSINESS`; actor alias `anonymous`; HTTP thực `400`; expected `[200, 400, 422]`; **PASS**. Thông điệp lỗi: `Invalid request`. 

<a id="tc-0251"></a>

### TC-0251 · IDN-007 · Cấp service token: order-service -> marketplace-service

Loại `BUSINESS`; actor alias `anonymous`; HTTP thực `200`; expected `[200]`; **PASS**. 

<a id="tc-0252"></a>

### TC-0252 · MKT-018 · Service contract với JWT đúng scope

Loại `BUSINESS`; actor alias `anonymous`; HTTP thực `200`; expected `[200]`; **PASS**. 

<a id="tc-0253"></a>

### TC-0253 · IDN-007 · Cấp service token: marketplace-service -> order-service

Loại `BUSINESS`; actor alias `anonymous`; HTTP thực `200`; expected `[200]`; **PASS**. 

<a id="tc-0254"></a>

### TC-0254 · ORD-009 · Service contract với JWT đúng scope

Loại `BUSINESS`; actor alias `anonymous`; HTTP thực `409`; expected `[200, 201]`; **FAIL**. Thông điệp lỗi: `Resource state conflict`. Replay internal note khác fingerprint; correct null note TC-0281.

<a id="tc-0255"></a>

### TC-0255 · CHT-004 · Customer sở hữu được đóng conversation theo source

Loại `BUSINESS`; actor alias `customerA`; HTTP thực `200`; expected `[200]`; **PASS**. 

<a id="tc-0256"></a>

### TC-0256 · CHT-005 · Tái hiện lỗi trang đầu không before

Loại `BUSINESS`; actor alias `customerA`; HTTP thực `403`; expected `[200]`; **FAIL**. Thông điệp lỗi: `Access is denied`. 

<a id="tc-0257"></a>

### TC-0257 · CHT-005 · Cursor non-null phân lập lỗi SQL null

Loại `DIAGNOSTIC`; actor alias `service/parallel`; HTTP thực `403`; expected `[200]`; **FAIL**. 

<a id="tc-0258"></a>

### TC-0258 · MKT-002 · Draft phụ cho nhánh hủy/ảnh

Loại `BUSINESS`; actor alias `customerA`; HTTP thực `201`; expected `[201]`; **PASS**. 

<a id="tc-0259"></a>

### TC-0259 · MKT-006 · Firebase không cấu hình trên draft hợp lệ

Loại `BUSINESS`; actor alias `customerA`; HTTP thực `503`; expected `[503]`; **PASS**. Thông điệp lỗi: `Required service unavailable`. 

<a id="tc-0260"></a>

### TC-0260 · MKT-010 · Chọn design khi AI unavailable

Loại `BUSINESS`; actor alias `customerA`; HTTP thực `503`; expected `[503]`; **PASS**. Thông điệp lỗi: `Required service unavailable`. 

<a id="tc-0261"></a>

### TC-0261 · MKT-007 · Xóa ảnh không tồn tại

Loại `BUSINESS`; actor alias `customerA`; HTTP thực `404`; expected `[404]`; **PASS**. Thông điệp lỗi: `Resource not found`. 

<a id="tc-0262"></a>

### TC-0262 · MKT-005 · Hủy draft hợp lệ

Loại `BUSINESS`; actor alias `customerA`; HTTP thực `200`; expected `[200]`; **PASS**. 

<a id="tc-0263"></a>

### TC-0263 · MKT-004 · Không sửa request CANCELLED

Loại `BUSINESS`; actor alias `customerA`; HTTP thực `409`; expected `[409]`; **PASS**. Thông điệp lỗi: `Resource state conflict`. 

<a id="tc-0264"></a>

### TC-0264 · MKT-014 · Không tái sử dụng acceptance key khác payload

Loại `BUSINESS`; actor alias `customerA`; HTTP thực `200`; expected `[409]`; **FAIL**. deliveryNote là unknown field; customerNote đúng contract TC-0282→409.

<a id="tc-0265"></a>

### TC-0265 · MKT-014 · 4 replay song song, chỉ 1 order/offer

Loại `CONCURRENCY`; actor alias `service/parallel`; HTTP thực `[200, 200, 200, 200]`; expected `assert count/state`; **PASS**. 

<a id="tc-0266"></a>

### TC-0266 · IDN-002 · Đăng nhập admin

Loại `BUSINESS`; actor alias `anonymous`; HTTP thực `200`; expected `[200]`; **PASS**. 

<a id="tc-0267"></a>

### TC-0267 · IDN-002 · Đăng nhập ownerA

Loại `BUSINESS`; actor alias `anonymous`; HTTP thực `200`; expected `[200]`; **PASS**. 

<a id="tc-0268"></a>

### TC-0268 · IDN-002 · Đăng nhập customerA

Loại `BUSINESS`; actor alias `anonymous`; HTTP thực `200`; expected `[200]`; **PASS**. 

<a id="tc-0269"></a>

### TC-0269 · IDN-007 · Service token cho nhánh bổ sung

Loại `BUSINESS`; actor alias `anonymous`; HTTP thực `200`; expected `[200]`; **PASS**. 

<a id="tc-0270"></a>

### TC-0270 · IDN-008 · Internal UUID đúng route template

Loại `BUSINESS`; actor alias `anonymous`; HTTP thực `200`; expected `[200]`; **PASS**. 

<a id="tc-0271"></a>

### TC-0271 · IDN-007 · Service token cho nhánh bổ sung

Loại `BUSINESS`; actor alias `anonymous`; HTTP thực `200`; expected `[200]`; **PASS**. 

<a id="tc-0272"></a>

### TC-0272 · IDN-009 · Internal UUID đúng route template

Loại `BUSINESS`; actor alias `anonymous`; HTTP thực `204`; expected `[204]`; **PASS**. 

<a id="tc-0273"></a>

### TC-0273 · IDN-003 · Logout controller thực trả 200

Loại `BUSINESS`; actor alias `customerA`; HTTP thực `200`; expected `[200]`; **PASS**. 

<a id="tc-0274"></a>

### TC-0274 · IDN-002 · Đăng nhập customerA

Loại `BUSINESS`; actor alias `anonymous`; HTTP thực `200`; expected `[200]`; **PASS**. 

<a id="tc-0275"></a>

### TC-0275 · IDN-007 · Service token cho nhánh bổ sung

Loại `BUSINESS`; actor alias `anonymous`; HTTP thực `200`; expected `[200]`; **PASS**. 

<a id="tc-0276"></a>

### TC-0276 · BKR-039 · Quote nội bộ đúng dạng Marketplace

Loại `BUSINESS`; actor alias `anonymous`; HTTP thực `200`; expected `[200]`; **PASS**. 

<a id="tc-0277"></a>

### TC-0277 · BKR-040 · Quote nội bộ đúng dạng Marketplace

Loại `BUSINESS`; actor alias `anonymous`; HTTP thực `200`; expected `[200]`; **PASS**. 

<a id="tc-0278"></a>

### TC-0278 · IDN-007 · Service token cho nhánh bổ sung

Loại `BUSINESS`; actor alias `anonymous`; HTTP thực `200`; expected `[200]`; **PASS**. 

<a id="tc-0279"></a>

### TC-0279 · MKT-016 · Chat authorization đủ query

Loại `BUSINESS`; actor alias `service/parallel`; HTTP thực `200`; expected `[200]`; **PASS**. 

<a id="tc-0280"></a>

### TC-0280 · IDN-007 · Service token cho nhánh bổ sung

Loại `BUSINESS`; actor alias `anonymous`; HTTP thực `200`; expected `[200]`; **PASS**. 

<a id="tc-0281"></a>

### TC-0281 · ORD-009 · Replay from-offer giữ note null đúng fingerprint

Loại `BUSINESS`; actor alias `anonymous`; HTTP thực `200`; expected `[200]`; **PASS**. 

<a id="tc-0282"></a>

### TC-0282 · MKT-014 · Cùng key khác customerNote thực sự trả 409

Loại `BUSINESS`; actor alias `customerA`; HTTP thực `409`; expected `[409]`; **PASS**. Thông điệp lỗi: `Resource state conflict`. 

<a id="tc-0283"></a>

### TC-0283 · BKR-005 · OWNER hiện hữu tạo bakery DRAFT thứ hai

Loại `BUSINESS`; actor alias `ownerA`; HTTP thực `201`; expected `[201]`; **PASS**. 

<a id="tc-0284"></a>

### TC-0284 · BKR-023 · Chuẩn bị legacy bakery để submit

Loại `BUSINESS`; actor alias `ownerA`; HTTP thực `200`; expected `[200]`; **PASS**. 

<a id="tc-0285"></a>

### TC-0285 · BKR-033 · Submit DRAFT legacy hợp lệ

Loại `BUSINESS`; actor alias `ownerA`; HTTP thực `200`; expected `[200]`; **PASS**. 

<a id="tc-0286"></a>

### TC-0286 · SUB-010 · Tạo đơn gia hạn sau kỳ đang active

Loại `BUSINESS`; actor alias `ownerA`; HTTP thực `201`; expected `[201]`; **PASS**. 

<a id="tc-0287"></a>

### TC-0287 · SUB-011 · Chi tiết đơn thuê bao mới

Loại `BUSINESS`; actor alias `ownerA`; HTTP thực `200`; expected `[200]`; **PASS**. 

<a id="tc-0288"></a>

### TC-0288 · SUB-012 · Nộp payment để kiểm nhánh reject

Loại `BUSINESS`; actor alias `ownerA`; HTTP thực `201`; expected `[201]`; **PASS**. 

<a id="tc-0289"></a>

### TC-0289 · SUB-003 · Admin reject có lý do

Loại `BUSINESS`; actor alias `admin`; HTTP thực `200`; expected `[200]`; **PASS**. 

<a id="tc-0290"></a>

### TC-0290 · SUB-002 · Không approve payment đã rejected

Loại `BUSINESS`; actor alias `admin`; HTTP thực `409`; expected `[409]`; **PASS**. Thông điệp lỗi: `Payment is not awaiting review`. 

<a id="tc-0291"></a>

### TC-0291 · SUB-012 · Nộp lại sau reject

Loại `BUSINESS`; actor alias `ownerA`; HTTP thực `201`; expected `[201]`; **PASS**. 

<a id="tc-0292"></a>

### TC-0292 · SUB-002 · Approve gia hạn tạo kỳ SCHEDULED

Loại `BUSINESS`; actor alias `admin`; HTTP thực `200`; expected `[200]`; **PASS**. 

<a id="tc-0293"></a>

### TC-0293 · MKT-002 · Draft cho withdrawal

Loại `BUSINESS`; actor alias `customerA`; HTTP thực `201`; expected `[201]`; **PASS**. 

<a id="tc-0294"></a>

### TC-0294 · MKT-009 · Publish request withdrawal

Loại `BUSINESS`; actor alias `customerA`; HTTP thực `200`; expected `[200]`; **PASS**. 

<a id="tc-0295"></a>

### TC-0295 · MKT-008 · Offer cho nhánh withdraw

Loại `BUSINESS`; actor alias `ownerA`; HTTP thực `201`; expected `[201]`; **PASS**. 

<a id="tc-0296"></a>

### TC-0296 · MKT-015 · OWNER rút offer PENDING

Loại `BUSINESS`; actor alias `ownerA`; HTTP thực `200`; expected `[200]`; **PASS**. 

<a id="tc-0297"></a>

### TC-0297 · MKT-008 · Unique vẫn chặn tạo lại sau WITHDRAWN

Loại `BUSINESS`; actor alias `ownerA`; HTTP thực `409`; expected `[409]`; **PASS**. Thông điệp lỗi: `Resource state conflict`. 

<a id="tc-0298"></a>

### TC-0298 · BKR-028 · Ẩn sản phẩm đã PUBLISHED

Loại `BUSINESS`; actor alias `ownerA`; HTTP thực `200`; expected `[200]`; **PASS**. 

<a id="tc-0299"></a>

### TC-0299 · BKR-027 · Archive sản phẩm HIDDEN

Loại `BUSINESS`; actor alias `ownerA`; HTTP thực `200`; expected `[200]`; **PASS**. 

<a id="tc-0300"></a>

### TC-0300 · BKR-032 · Không publish lại ARCHIVED

Loại `BUSINESS`; actor alias `ownerA`; HTTP thực `409`; expected `[409]`; **PASS**. Thông điệp lỗi: `Only draft or hidden products can be published`. 

<a id="tc-0301"></a>

### TC-0301 · BKR-030 · Xóa ảnh trên sản phẩm archive

Loại `BUSINESS`; actor alias `ownerA`; HTTP thực `204`; expected `[204]`; **PASS**. 

<a id="tc-0302"></a>

### TC-0302 · BKR-012 · Disable add-on

Loại `BUSINESS`; actor alias `ownerA`; HTTP thực `204`; expected `[204]`; **PASS**. 

<a id="tc-0303"></a>

### TC-0303 · BKR-016 · Danh mục rỗng để xóa

Loại `BUSINESS`; actor alias `ownerA`; HTTP thực `201`; expected `[201]`; **PASS**. 

<a id="tc-0304"></a>

### TC-0304 · BKR-017 · Xóa danh mục không có sản phẩm

Loại `BUSINESS`; actor alias `ownerA`; HTTP thực `204`; expected `[204]`; **PASS**. 

<a id="tc-0305"></a>

### TC-0305 · SUB-007 · Archive plan, giữ nguyên subscription snapshot

Loại `BUSINESS`; actor alias `admin`; HTTP thực `200`; expected `[200]`; **PASS**. 

<a id="tc-0306"></a>

### TC-0306 · IDN-002 · Đăng nhập customerA

Loại `BUSINESS`; actor alias `anonymous`; HTTP thực `200`; expected `[200]`; **PASS**. 

<a id="tc-0307"></a>

### TC-0307 · IDN-002 · Đăng nhập ownerA

Loại `BUSINESS`; actor alias `anonymous`; HTTP thực `200`; expected `[200]`; **PASS**. 

<a id="tc-0308"></a>

### TC-0308 · IDN-002 · Đăng nhập admin

Loại `BUSINESS`; actor alias `anonymous`; HTTP thực `200`; expected `[200]`; **PASS**. 

<a id="tc-0309"></a>

### TC-0309 · MKT-002 · Draft riêng cho recovery

Loại `BUSINESS`; actor alias `customerA`; HTTP thực `201`; expected `[201]`; **PASS**. 

<a id="tc-0310"></a>

### TC-0310 · MKT-009 · Publish request recovery

Loại `BUSINESS`; actor alias `customerA`; HTTP thực `200`; expected `[200]`; **PASS**. 

<a id="tc-0311"></a>

### TC-0311 · MKT-008 · Offer riêng cho recovery

Loại `BUSINESS`; actor alias `ownerA`; HTTP thực `201`; expected `[201]`; **PASS**. 

<a id="tc-0312"></a>

### TC-0312 · MKT-014 · Order tạm ngừng: acceptance trả503 và giữ retry

Loại `BUSINESS`; actor alias `customerA`; HTTP thực `503`; expected `[503]`; **PASS**. Thông điệp lỗi: `Required service unavailable`. 

<a id="tc-0313"></a>

### TC-0313 · MKT-014 · Workflow durable RETRYING sau remote unavailable

Loại `SCHEDULER_OR_RECOVERY`; actor alias `service/parallel`; HTTP thực `DB/worker assertion, không có HTTP riêng`; expected `assert count/state`; **PASS**. 

<a id="tc-0314"></a>

### TC-0314 · MKT-014 · Scheduler tự phục hồi SUCCEEDED, chỉ1 order

Loại `SCHEDULER_OR_RECOVERY`; actor alias `service/parallel`; HTTP thực `DB/worker assertion, không có HTTP riêng`; expected `assert count/state`; **PASS**. 

<a id="tc-0315"></a>

### TC-0315 · MKT-002 · Draft riêng cho expiry

Loại `BUSINESS`; actor alias `customerA`; HTTP thực `201`; expected `[201]`; **PASS**. 

<a id="tc-0316"></a>

### TC-0316 · MKT-009 · Publish expiry fixture

Loại `BUSINESS`; actor alias `customerA`; HTTP thực `200`; expected `[200]`; **PASS**. 

<a id="tc-0317"></a>

### TC-0317 · MKT-008 · Offer chờ hết hạn

Loại `BUSINESS`; actor alias `ownerA`; HTTP thực `201`; expected `[201]`; **PASS**. 

<a id="tc-0318"></a>

### TC-0318 · MKT-001 · Scheduler RFQ CLOSED và offer EXPIRED khi qua hạn

Loại `SCHEDULER_OR_RECOVERY`; actor alias `service/parallel`; HTTP thực `DB/worker assertion, không có HTTP riêng`; expected `assert count/state`; **PASS**. 

<a id="tc-0319"></a>

### TC-0319 · IDN-002 · Đăng nhập ownerA

Loại `BUSINESS`; actor alias `anonymous`; HTTP thực `200`; expected `[200]`; **PASS**. 

<a id="tc-0320"></a>

### TC-0320 · IDN-002 · Đăng nhập admin

Loại `BUSINESS`; actor alias `anonymous`; HTTP thực `200`; expected `[200]`; **PASS**. 

<a id="tc-0321"></a>

### TC-0321 · SUB-005 · Plan phụ cho expiry order

Loại `BUSINESS`; actor alias `admin`; HTTP thực `201`; expected `[201]`; **PASS**. 

<a id="tc-0322"></a>

### TC-0322 · SUB-010 · PENDING_PAYMENT riêng cho expiry

Loại `BUSINESS`; actor alias `ownerA`; HTTP thực `201`; expected `[201]`; **PASS**. 

<a id="tc-0323"></a>

### TC-0323 · SUB-008 · Lifecycle job expire order/old period và activate scheduled

Loại `SCHEDULER_OR_RECOVERY`; actor alias `service/parallel`; HTTP thực `DB/worker assertion, không có HTTP riêng`; expected `assert count/state`; **PASS**. 
