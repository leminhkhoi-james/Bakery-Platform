# Partner onboarding

`SubscriptionPlansPage` mở `PartnerCheckoutModal` cho customer mới hoặc hồ sơ đang chờ duyệt. `OwnerBakeryOnboarding` sử dụng cùng cơ chế theo dõi quyền khi được dùng để đăng ký tiệm.

Khối dưới danh sách gói chỉ hiện khi có hồ sơ đăng ký hoặc role BAKERY_OWNER. Customer có hồ sơ dùng “Theo dõi đăng ký tiệm” để mở lại cùng modal; chủ tiệm dùng “Quản lý gói”. Khách chưa đăng ký không thấy khối này.

1. GET/POST `/bakeries/onboarding`: đọc hồ sơ hiện tại, gửi thông tin và vận hành; backend tạo membership OWNER cho customer nhưng chưa cấp role BAKERY_OWNER.
2. GET `/subscription-plans`, POST `/bakeries/{id}/subscription-orders`: tạo đơn PENDING_PAYMENT với idempotency key.
3. POST multipart `/subscription-orders/{id}/payments`: metadata JSON chứa amount/currency từ đơn, BANK_TRANSFER và paymentReference; reference hoặc proof PNG/JPEG/PDF (tối đa 10 MB) là bắt buộc. Gửi thành công chỉ là PAYMENT_REVIEW.
4. Admin duyệt hồ sơ ACTIVE và chứng từ qua API quản trị. Backend tự cấp role khi hồ sơ ACTIVE và gói có hiệu lực. FE không tự cấp role hoặc mặc định xem đã thanh toán.
5. `usePartnerActivation` kiểm tra hồ sơ và kỳ subscription mỗi 5 giây khi trang hiển thị; khi hồ sơ ACTIVE thì đọc `/auth/me`. Tạm ngừng khi gửi form và hủy khi unmount. Mỗi lượt đọc có timeout 10 giây. Khi có role mới, `refreshSession` đổi JWT rồi công bố profile của cùng user. Router chuyển sang kênh chủ tiệm.

“Theo dõi đăng ký tiệm” có ngay đầu trang gói và trong khối hồ sơ để mở lại tiến độ. Màn hình hiển thị riêng trạng thái hồ sơ, thanh toán/gói, điều kiện còn thiếu và thời điểm cập nhật. “Kiểm tra trạng thái duyệt” đọc lại cả hồ sơ, subscription, lịch sử đơn và chi tiết chứng từ; không thực hiện phê duyệt. Lượt đọc tự động không khóa nút, lượt kiểm tra thủ công hiển thị trạng thái đang kiểm tra.

Các service onboarding/subscription/publicationAdmin gửi `allowMockFallback: false`; unified transport chuyển trực tiếp tới API, không merge nguồn local. Giữ hành vi mô phỏng của các màn hình khác.

`payment-options` hiện không cung cấp thông tin tài khoản ngân hàng. Không dựng tài khoản/QR giả để hướng dẫn chuyển tiền. Form vẫn cho gửi bằng chứng đối chiếu; mã tham chiếu mẫu chỉ phục vụ demo local và luôn chờ admin duyệt. Retry giữ nguyên payload/key khi kết quả yêu cầu trước chưa rõ.

Khi chạy Vite dev, nút “Tạo mã mẫu (test)” điền `LOCAL-TEST-{UUID}` vào paymentReference. Nút không gửi hoặc tự duyệt; người dùng vẫn gửi qua form multipart/API thật như mã nhập tay. Production build không hiện nút tạo mã test.

Validation: 4 nhóm Node tests auth/subscription/publication-workflow/unified-data, production build và một lượt FE thật từ customer tới trang gói ACTIVE (admin approve qua HTTP local).
