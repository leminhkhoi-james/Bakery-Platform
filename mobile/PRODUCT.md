# SweetCake Mobile — bối cảnh sản phẩm

<!-- impeccable:product-schema 1 -->

## Platform

adaptive

Ứng dụng Flutter Android/iOS native, giữ thiết kế SweetCake. Phases 1–4 và Marketplace/RFQ/Offer, Product Order/Checkout, Chat được kế thừa. Đợt full-integration ngày 08/11/2026 thêm Review, Cake AI, selected-design và Admin oversight cho các contract thật. Một số nghiệp vụ bị chặn bởi runtime/hợp đồng Backend; Android phone đã được kiểm tra, iOS runtime cần macOS/Xcode.

## Người dùng và công việc

Khách khám phá bánh, tiệm và gói thuê từ API công khai. Customer đăng ký, đăng nhập và gửi hồ sơ mở tiệm. Owner quản lý hồ sơ, vận hành, catalog và gói thuê của tiệm có membership hợp lệ. Admin duyệt tiệm, duyệt payment subscription và quản lý plan. Quyền lấy từ Identity; không có công tắc persona trong ứng dụng live.

## Ràng buộc đã được người dùng xác nhận

Chỉ sửa `mobile/`, kể cả tài liệu và bằng chứng. Ngoài thư mục này chỉ đọc. Tích hợp các public contract thực của Identity, Bakery, Subscription, Marketplace, Order/Review, Chat và Cake AI. Không dùng persona demo để xác thực hoặc trộn fixture với live. Admin Users/Revenue/Settlement chưa có contract phù hợp thì ghi gap, không dựng endpoint hay KPI giả. Không sửa Backend/Web/config/secrets/skill; không ghi SQL hoặc sửa database trực tiếp. Phép đọc metadata chỉ phục vụ chẩn đoán synthetic ở host, không cung cấp địa chỉ cho Flutter. Nền tảng không thực hiện chuyển tiền mua bánh thật.

## Thành công

Phases 1–4 dùng dữ liệu thật, có loading/empty/error/retry, session an toàn và xác nhận lại dữ liệu sau mutation. Customer đi qua onboarding, Admin approval và subscription để nhận quyền Owner hợp lệ. Publish phụ thuộc entitlement Backend. Gia hạn tạo kỳ SCHEDULED sau kỳ ACTIVE. Android emulator và Web tham chiếu đọc cùng ID/giá/ảnh. Không biến 2xx hoặc UI demo cũ thành khẳng định mọi nhánh nghiệp vụ đã được kiểm chứng.

35 route demo trước đây vẫn được giữ cho regression và preview riêng. Runtime chính dùng repository live, không import fixture hoặc fallback demo. Review nằm trong chi tiết đơn COMPLETED của Customer; Admin khám phá qua danh sách Order được phép và detail.review, không có global review queue/count. AI có lối vào từ Tài khoản và RFQ thật: job/revision/result/cancel, moderation và chọn thiết kế đã duyệt theo contract. Admin chỉ có oversight điều kiện qua RFQ.selectedDesign; chưa có hàng đợi PENDING toàn cục.

Đợt hiện tại bổ sung 12 adapter, nhưng chưa chứng minh live success của AI/Review/selected-design: thiếu public address làm Direct Order/accept Offer và toàn bộ fulfillment→Review bị chặn; Cake AI không có runtime và source nguyên trạng không compile. Không nhập UUID địa chỉ hoặc dựng job/result/order mẫu để vượt điều kiện. UI báo trạng thái thật; kiểm thử adapter/widget tách khỏi Android E2E. Gate còn PARTIAL_BLOCKED thì video chỉ mang tên partial/blocked, không phải full-pass walkthrough.

RFQ chỉ sửa/thêm ảnh ở DRAFT. Giỏ giữ product/options/add-on ID từ Backend và tính tiền thập phân để tham khảo; đọc lại catalog trước checkout, không coi tạm tính là quote server. Chat dùng REST/cursor, không giả WebSocket. Gửi chưa rõ kết quả giữ clientMessageId/nội dung trong bộ nhớ phiên qua điều hướng; không tự gửi lại. Đóng tiến trình chưa có journal khôi phục pending message, nên không tuyên bố retry bền vững qua cold restart. Logout/đổi tài khoản xóa giỏ và pending state.

## Nguồn

`../design-web.md`, source `../frontend`, docs/audit và ADR hiện tại. Yêu cầu người dùng chốt visual world; không cần chọn palette/concept mới. Các vấn đề API trong audit là bối cảnh, không sửa hoặc giả là đã giải quyết.
