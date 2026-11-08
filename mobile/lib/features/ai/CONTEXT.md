# Cake AI live

Public API xuất phát từ controller/DTO/GenerationReader thật. Danh sách job riêng Customer, phân trang Backend bắt đầu 0; UI chuyển về 1. Job detail bọc `job`, revisions, sourceImages, generatedDesigns. POST create multipart metadata + sourceImages; revision JSON; khóa logical action ổn định, không auto retry POST. Poll giới hạn và ngừng khi đổi phiên/đóng màn hình; refresh không tạo job. Kết quả SUCCEEDED chưa đồng nghĩa APPROVED. Chọn thiết kế từ result đã duyệt vào RFQ DRAFT cùng owner và ID được Backend xác minh.

Admin chỉ mở job/design qua RFQ.selectedDesignId hợp lệ; source chưa có queue AI Admin để khám phá PENDING chưa từng được chọn. Không thêm input UUID hoặc gọi internal. Thiếu runtime/provider/sandbox authorization phải báo blocker, không dựng kết quả giả.
