# Kiểm thử luồng qua API Gateway — 2026-11-10

**215 kiểm tra HTTP/invariant pass, 0 kiểm tra nghiệp vụ fail**, trên Docker
project `bakery-gateway`, qua `http://127.0.0.1:8080`. PostgreSQL, MinIO,
Firebase và Gemini thật; đây là kiểm thử API, chưa phải kiểm thử giao diện.

## Luồng đã chạy

| Nhóm | Kết quả |
|---|---|
| Identity | Đăng ký/đăng nhập, sửa profile, địa chỉ, chặn truy cập địa chỉ của người khác |
| Bakery | Onboarding hai tiệm, admin duyệt, cấp quyền owner sau subscription, kiểm tra ownership |
| Subscription | Mua gói, chứng từ, duyệt/replay; từ chối, nộp lại, gia hạn tạo một kỳ SCHEDULED |
| Catalog | Danh mục, add-on, draft product, primary image, MinIO, options, publish/public detail |
| Marketplace | RFQ mở/custom sản phẩm, publish, hai báo giá, ownership, rút báo giá, hủy RFQ |
| Direct Order | Quote liên service, add-on/phí giao, idempotency, snapshot địa chỉ bất biến, hoàn tất |
| Accepted Offer | Accept/replay tạo một đơn, payload conflict, báo giá cạnh tranh bị từ chối, hoàn tất |
| Review | Chặn trước COMPLETED, tạo review, chặn trùng, sửa, admin ẩn |
| Chat | Eligibility/participant, text/replay/conflict, read receipt, ảnh MinIO, đóng chat/chặn gửi mới |
| Đồng thời | Bốn replay duyệt gói giữ một kỳ; bốn tạo direct cùng key trả một đơn và chỉ một row |
| Cake AI | Tạo/refine Gemini, Firebase, moderation, ownership, signed URL/thumbnail, chọn design |
| AI đến đơn | Design đã chọn → publish RFQ → offer → accept → giao hàng → khách hoàn tất → review |
| Hủy/quota | Hủy order/RFQ/AI; terminal AI cancel trả 409, vượt quota trả 429, không thêm provider call |

Chứng từ thanh toán là dữ liệu tổng hợp E2E, không chuyển tiền ngân hàng.
ADMIN bootstrap chỉ được cấp bằng SQL cho tài khoản tổng hợp vừa tạo; các bước
nghiệp vụ sau đó đi qua Gateway. Dữ liệu thử được giữ lại để đối chiếu; không
sửa/xóa volume của project cũ.

## Cake AI thật

- Model Google đã xác minh: `gemini-3.1-flash-image`, `gemini-3.5-flash`.
- Một generation và một refinement đều `SUCCEEDED`, tổng **6 provider calls**.
- PENDING không lộ URL cho customer, chưa được chọn; customer không được tự
  moderate. Admin preview/approve, owner đọc và chọn design đều pass.
- Ảnh/thumbnail đọc được; bỏ signed query trả 403. Người khác không đọc job/design.
- Hủy job với worker paused và thử vượt quota không gọi thêm Gemini.
- Budget reservation 9: hai execution đã chạy giữ 6, job hủy giữ 3 theo chính
  sách không hoàn quota. Số provider calls thực tế vẫn là 6.
- Sau kiểm thử, generation/scheduler được tắt; cleanup vẫn tắt. Tám ứng dụng
  được giữ chạy và healthy.

[Ảnh gốc](audit/evidence/gateway-e2e-original.png) ·
[Ảnh refine](audit/evidence/gateway-e2e-refined.png) ·
[Provider discovery](audit/evidence/gateway-e2e-provider.json).

## Cấu hình sửa và kết quả Maven

Bổ sung `bakery:catalog:quote` trong default scope của Order và grant của
Identity. Đã build/deploy lại, bỏ override tạm và kiểm tra bằng bốn request tạo
direct order đồng thời. Credential nội bộ riêng cho E2E nằm trong file bị Git
ignore, có ACL tại `backend/target/gateway-e2e.env`; không ghi đè `.env` gốc.

`mvn -q test`: **242 pass, 1 lỗi setup**, không skip; tổng 243 entries.

| Module | Pass | Lỗi |
|---|---:|---:|
| platform-support | 3 | 0 |
| identity-service | 28 | 0 |
| bakery-service | 51 | 0 |
| marketplace-service | 38 | 0 |
| order-service | 29 | 0 |
| chat-service | 15 | 0 |
| cake-ai-service | 59 | 0 |
| subscription-service | 18 | 0 |
| api-gateway | 1 | 0 |
| integration-tests | 0 | 1 |

`MarketplaceEndToEndTest.startServices` không khởi tạo được Bakery JWT decoder:
thiếu `spring.security.oauth2.resourceserver.jwt.jwk-set-uri` trong cấu hình
`isolated-e2e`. Test cũ này chưa tới kịch bản nghiệp vụ, không được tính pass.
Sau thay đổi scope, build Identity/Order và `ServiceTokenServiceTest` pass.

## Chạy lại

```powershell
python scripts/gateway_e2e_setup.py prepare
python scripts/gateway_e2e_setup.py provider
python scripts/gateway_e2e_setup.py enable-ai
python scripts/Test-GatewayFlows.py all
python scripts/Test-GatewayFlows.py final-config
python scripts/gateway_e2e_setup.py pause-worker
python scripts/Test-GatewayFlows.py cancel-ai
python scripts/gateway_e2e_setup.py disable-ai
```

Runner resume theo phase, không tự chạy lại generation đã xong. Trong quota
window hiện tại không thể tạo execution mới sau khi giữ đủ 9 reservation.

[HTTP/invariant evidence](audit/evidence/gateway-e2e.json) ·
[Maven suite evidence](audit/evidence/gateway-e2e-maven.json) ·
[Gateway smoke](audit/evidence/gateway-smoke.json).

Evidence không chứa key, token, password hoặc signed URL. Hai kỳ vọng harness
ban đầu về đóng chat và cancel lại AI được sửa theo API_SPEC; các lần thử cũ
giữ trong `harnessCorrections`, không tính là lỗi nghiệp vụ.

Chưa kiểm thử UI Web/Android/iOS, chờ 24 giờ thực cho auto-completion, tải lớn,
diễn tập lỗi hạ tầng hay mọi tổ hợp lỗi/endpoint nội bộ trong đợt này.
