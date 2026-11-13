# Không gian thực hành kinh doanh

Owner/Admin dùng chung kho IndexedDB `sweetcake-business-simulation` (state `sweetcake.business-simulation.v1`), tách khỏi dữ liệu API và các kho cũ. Danh tính đăng nhập vẫn xác thực bằng Backend; Owner chỉ truy cập tiệm được gán cho tài khoản test tương ứng. Không cấp quyền Backend hoặc tạo giao dịch tài chính thật.

Owner và Admin đọc cùng lúc API và kho trình duyệt qua `services/unifiedDataService.js`. Menu tài khoản hiển thị hai nguồn. API được ưu tiên khi trùng định danh. Tiệm và gói đã liên kết dùng mã Backend làm định danh đối chiếu, còn đơn, báo giá, hội thoại và các mẫu bánh riêng giữ nguyên ID đã lưu. Các mã nguồn cũ được giữ để mở liên kết và định tuyến thao tác. Nguồn không tải được có thông báo riêng, gồm cả lỗi API khi chỉ một phần danh sách khả dụng.

Kho mới gồm 3 tiệm, 46 sản phẩm/45 ảnh, 54 đơn, 20 yêu cầu, 26 báo giá, 12 hội thoại, 22 khách hàng và lịch sử gói/thu/hoàn tiền. Seed chỉ áp dụng khi chưa có kho; không ghi đè thao tác đã lưu. Ảnh menu tham khảo Customer được lưu tĩnh; ảnh/chứng từ tải lên được tách thành Blob trong object store `media`, định danh bằng SHA-256. State và receipt chỉ giữ tham chiếu, không chứa base64. Thông tin nguồn xuất hiện trong menu quản trị và các chi tiết liên quan.

Admin và Owner cùng origin, cùng browser profile thấy dữ liệu chung sau chuyển trang/refresh/đăng nhập lại. Đây không phải đồng bộ Backend hay đồng bộ nhiều thiết bị. Web Locks tuần tự hóa request ghi giữa tab; thao tác sổ trực tiếp kiểm tra quyền và lưu giao dịch nguyên tử trong tab.

`metrics.js` dùng chung cho Dashboard/báo cáo; doanh thu bán bánh chỉ gồm đơn hoàn tất, đã thu đủ qua sổ, không có phản ánh chưa xử lý. Doanh thu mô phỏng tách khỏi chứng từ API đã duyệt. Doanh thu bán bánh thực nhận chỉ hiện khi có nguồn đối soát. Lên lịch/quá hạn/phản ánh là thuộc tính dẫn xuất, không thêm trạng thái Backend.

Kiểm tra:

- `npm test`, `npm run lint`, `npm run build`.
- Smoke Chromium: đặt `SWEETCAKE_OWNER_PASSWORD` và `SWEETCAKE_ADMIN_PASSWORD`, rồi chạy `node scripts/business-simulation-smoke.mjs`. URL mặc định localhost:5173; có thể đặt `SWEETCAKE_BASE_URL`, `PLAYWRIGHT_EXECUTABLE_PATH`, `SWEETCAKE_QA_OUTPUT`. Script tạo browser context riêng, không xóa localStorage đang dùng, không gửi request ghi nghiệp vụ.
- Các thao tác trên bản ghi trình duyệt cập nhật IndexedDB. Các thao tác Backend gửi qua API và dùng quyền Backend hiện hành.

Migration tự động: nếu chưa có state IndexedDB, bản localStorage hợp lệ được sao lưu nguyên văn vào `backups/localStorage-v1-original` trong cùng giao dịch với state đã tách ảnh. Key localStorage cũ được giữ nguyên, không còn ghi vào đó. IndexedDB có ưu tiên sau migration; không seed lại hoặc nhập bản cũ đè dữ liệu mới. Nếu thiếu dung lượng/không mở được kho, giữ dữ liệu và báo thông báo khôi phục thân thiện, chi tiết ở console. Chỉ báo lưu thành công khi giao dịch IndexedDB hoàn tất.

Regression quota thật trên Chromium: `node scripts/business-storage-regression.mjs` với cùng biến môi trường test; dùng context riêng để kiểm tra localStorage đầy, migration có ảnh trùng, backup, ba lần refresh, đổi role và trạng thái đơn. Không xóa/reset kho trình duyệt người dùng.
