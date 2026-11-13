# Kết quả kiểm thử tích hợp API Phases 1–4

Ngày thực thi: 07/11/2026. Source HEAD `addfd7746021ef5267b3946e7b1e9cdc6545496a`. Chỉ thay đổi repository trong `mobile/`. Dữ liệu kiểm thử được tạo qua public API/UI trên runtime local; không chuyển tiền, không gửi email, không dùng SQL hoặc cấp role thủ công.

## Các mẫu số độc lập

| Lớp kiểm chứng | Kết quả | Bằng chứng và giới hạn |
|---|---|---|
| Format | PASS, exit 0 | [final-format.txt](evidence/api-integration-phases-1-4/final-format.txt) |
| Flutter analyze | PASS, không issue, exit 0 | [final-analyze.txt](evidence/api-integration-phases-1-4/final-analyze.txt) |
| Unit/widget | 46/46 PASS | [final-test.txt](evidence/api-integration-phases-1-4/final-test.txt): 14 foundation, 6 live widget/validation, 26 regression demo cũ. Không phải 46 API live |
| Android debug APK, main | PASS, exit 0 | [final-build.txt](evidence/api-integration-phases-1-4/final-build.txt); target mặc định `lib/main.dart` |
| Adapter trong phạm vi | 55/55 implemented | Identity 5, Bakery 35, Subscription 15 |
| Operation có HTTP 2xx từ Android UI | 55/55 | Phase 1/2/3/4: 6/5/31/13; [ma trận](API_INTEGRATION_MATRIX_PHASES_1_4_VI.md), [tổng hợp](evidence/api-integration-phases-1-4/integration-summary.json) |
| Probe native adapter | 2/2 điều kiện PASS | Replay cùng key/payload → 201 cùng order ID; cùng key khác payload → 409. Gắn `ADAPTER_PROBE`, không tính Android UI operation mới |
| Backend preflight | 8/8 PASS | [backend-preflight.json](evidence/api-integration-phases-1-4/backend-preflight.json); không phải UI test |
| Đối chiếu bản ghi sau restart Backend | 15/15 PASS | [persisted-record-reconciliation.json](evidence/api-integration-phases-1-4/persisted-record-reconciliation.json); HTTP ngoài app, không cộng vào 55 |
| Đọc object storage | 3/3 HTTP 200 | Product/logo/cover, mỗi object 42.397 byte, SHA trùng file upload. Không lưu signed URL |
| Web thực | 5 route chụp bằng Chrome headless | Home/plans/stores/product/bakery; Web proxy trả cùng product ID và giá. Không xác nhận GUI desktop hoặc private Web flow |
| README CLI | PASS sau sửa locator harness | [runbook](LOCAL_RUNBOOK_VERIFICATION_VI.md); cùng máy đã có cache, không phải máy sạch |
| Android Studio / iOS | NOT_VERIFIED | Không suy ra từ CLI hoặc debug APK |

55 operation được đếm bằng service + method + normalized route. Đây là coverage tích lũy của các hành trình tiếp tục sau sửa lỗi, không phải một lượt end-to-end không gián đoạn. Phản hồi 2xx xác nhận operation đã được gọi thành công, không chứng minh tất cả validation, role, pagination boundary hoặc mọi trạng thái nghiệp vụ. Các trace đầu trước khi thêm probe chưa có trường `layer`; chúng được sinh hoàn toàn từ driver UI. Raw trace được giữ nguyên. Trace mới phân biệt `ANDROID_UI` và `ADAPTER_PROBE`.

## Hành trình Android đã kiểm chứng

| Hành trình | Kết quả và quan sát |
|---|---|
| Public catalog/plans | API thật cho Home, search, tiệm, product detail, plan list/detail. Product công khai có đúng ID/giá/ảnh đã upload |
| Identity | Register 201, login sai 401, login đúng, `/me`, refresh rotation, logout JWT + cookie. Không dùng persona giả |
| Phân quyền UI | Customer bị chặn catalog Owner trước activation; Owner bị chặn Admin. Không dùng Admin như chủ mọi tiệm |
| Onboarding | Customer gửi đầy đủ operations, đọc trạng thái pending; Admin duyệt bakery; mua gói; complete trả 204; refresh nhận BAKERY_OWNER thật |
| Hồ sơ/vận hành | PATCH hồ sơ, PUT tất cả mảng operations giữ ID, upload logo/cover, đọc membership; GET xác nhận dữ liệu đã lưu |
| Categories/add-ons | Create/read/update/delete category; add-on create/update/image/soft disable; refetch trạng thái inactive |
| Products | Create draft, PATCH, full options PUT, upload image qua picker native, delete ảnh phụ giữ ảnh chính, publish/hide/republish, archive draft riêng |
| Public sau publish | Điều hướng/search tìm đúng product; actual Backend media hiển thị trong Flutter và Web |
| Payment thủ công | Create order, metadata/proof bằng multipart JSON + file, server vào PAYMENT_REVIEW; chưa báo ACTIVE |
| Reject và sửa | Admin reject có ghi chú, Owner gửi reference mới, Admin approve; actual order COMPLETED và period ACTIVE |
| Gia hạn | Logical action mới có order/key mới; Admin approve kỳ thứ hai, server trả SCHEDULED sau kỳ ACTIVE |
| Snapshot | Sửa giá plan rồi archive; đơn đã hoàn tất vẫn giữ tổng snapshot 100.000 VND, không dùng giá plan hiện tại 120.000 VND |
| Chi nhánh legacy | Owner có role tạo bakery mới và submit operations; Admin GET thấy địa chỉ, khu vực, membership sau logout Owner |
| Lỗi mạng | Test boundary chặn transport → UI error, không fixture; bật lại kết nối → retry/refetch thật thành công. Đây là lỗi được mô phỏng tại boundary, không phải ngắt mạng toàn máy |
| Session restoration | Tạo lại Flutter application/workspace đọc secure storage và gọi refresh/me thành công. Normal main APK cold OS process: một lần xác nhận profile Owner đã settle, không nhập lại credential; [runbook](LOCAL_RUNBOOK_VERIFICATION_VI.md) tách các lượt setup chưa đạt |

Ảnh chính: [public](evidence/api-integration-phases-1-4/10-public-real-product-image.png), [Owner](evidence/api-integration-phases-1-4/09-owner-published-product.png), [ACTIVE/SCHEDULED](evidence/api-integration-phases-1-4/12-current-and-scheduled-subscription.png), [chi nhánh](evidence/api-integration-phases-1-4/13-admin-refetches-legacy-branch.png), [lỗi mạng](evidence/api-integration-phases-1-4/11-network-error-no-fixture.png).

## Unit/widget bảo vệ các rủi ro thực tế

Foundation kiểm tra decimal tiền, envelope/page/204, origin gồm cả port và path boundary của cookie, Secure/expiry, nhiều request cùng một refresh, logout khi refresh về muộn, lỗi refresh tạm thời so với invalid token, GET retry có giới hạn, không tự retry mutation/403, idempotency key theo payload/context, phản hồi riêng tư đến muộn, cancel scope Bakery tách khỏi Identity, mutation malformed là uncertain, rotation không cập nhật một phần, logout gửi đúng JWT + cookie và hai session instance mới đọc lại serialization/rotation đã lưu. Unit store là in-memory; cold process Android được kiểm tra độc lập.

Widget live kiểm tra empty/error không có fixture, retry không trả Future từ setState, route guard theo role, full replacement giữ mọi mảng/ID/decimal, validation operations/options, form cuộn ở 320px và text scale 1.0/1.8. Regression 35 màn hình demo cũ có kiểm tra viewport và chữ lớn riêng; không tính chúng như live Backend coverage.

## Lỗi đã phát hiện, sửa và giới hạn của PASS

- Kotlin incremental cache không relativize được Pub cache ổ C với project ổ H: cấu hình compiler in-process và tắt incremental ở riêng `mobile/android/gradle.properties`; build sau đạt. Không xóa cache toàn máy.
- Harness register chờ biến mất key dùng chung với form login nên dừng dù register đã 201. Tiếp tục bằng tài khoản đã tạo, không đăng ký lại.
- `LiveData` từng dùng callback setState trả Future khiến refetch fail: sửa callback đồng bộ và mounted guard; widget regression và Android catalog rerun đạt.
- Android 16 image-only picker chuyển sang photo picker không có filename fixture: dùng scoped document picker, giữ kiểm tra MIME/bytes/size; upload/delete thật sau đó đạt.
- Chi nhánh thứ hai chưa có private GET/discovery đầy đủ: giữ actual write DTO trong session; Admin GET xác nhận persist. Login lại trở về membership đầu tiên, không tuyên bố selector đa tiệm đầy đủ.
- README harness tìm text của logo dạng ảnh: sửa locator sang key ô search; chỉ chạy lại bước UI và các bước phụ thuộc. Lần thất bại được giữ trong `runs/` và rehearsal log cũ.
- Cold start Android 16 phát hiện secure storage default gặp legacy ESP `bad base-64`; chuyển namespace/KeyStore riêng và backup migration, không auto-reset data khi plugin lỗi. Không dùng PASS recreation in-process để che lỗi; ảnh/metadata cold process được báo riêng trong runbook.

Không xác nhận live sandbox payment khi capability chưa bật; không có real money transfer. Chưa kiểm chứng mọi input validation phía Backend, mutation timeout trên mạng thật, TalkBack, hiệu năng release, physical device, iOS, Android Studio GUI, Gateway, hoặc các tính năng ngoài Phases 1–4. Lịch sử lỗi còn trong evidence; không xóa để tạo tỷ lệ PASS giả.
