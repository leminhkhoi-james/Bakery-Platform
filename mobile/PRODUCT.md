# SweetCake Mobile — bối cảnh sản phẩm

<!-- impeccable:product-schema 1 -->

## Platform

adaptive

Ứng dụng Flutter Android/iOS native, giữ thiết kế SweetCake. Nhiệm vụ hiện tại tích hợp API thật Phases 1–4; iOS runtime cần macOS/Xcode.

## Người dùng và công việc

Khách khám phá bánh, tiệm và gói thuê từ API công khai. Customer đăng ký, đăng nhập và gửi hồ sơ mở tiệm. Owner quản lý hồ sơ, vận hành, catalog và gói thuê của tiệm có membership hợp lệ. Admin duyệt tiệm, duyệt payment subscription và quản lý plan. Quyền lấy từ Identity; không có công tắc persona trong ứng dụng live.

## Ràng buộc đã được người dùng xác nhận

Chỉ sửa `mobile/`, kể cả tài liệu và bằng chứng. Ngoài thư mục này chỉ đọc. Tích hợp public catalog/plans, Identity, onboarding/catalog Owner và subscription/Admin liên quan. Không dùng persona demo để xác thực; không trộn fixture với dữ liệu live. Marketplace/RFQ/Offer, Order/Checkout/Review, Chat, AI, Admin Users/Revenue/Settlement ngoài phạm vi. Không sửa Backend/Web/config/secrets/skill và không dùng SQL. Nền tảng chỉ theo dõi payment subscription của bakery; không thực hiện chuyển tiền thật.

## Thành công

Phases 1–4 dùng dữ liệu thật, có loading/empty/error/retry, session an toàn và xác nhận lại dữ liệu sau mutation. Customer đi qua onboarding, Admin approval và subscription để nhận quyền Owner hợp lệ. Publish phụ thuộc entitlement Backend. Gia hạn tạo kỳ SCHEDULED sau kỳ ACTIVE. Android emulator và Web tham chiếu đọc cùng ID/giá/ảnh. Không biến 2xx hoặc UI demo cũ thành khẳng định mọi nhánh nghiệp vụ đã được kiểm chứng.

35 route demo trước đây vẫn được giữ cho regression và preview riêng. Cart/RFQ/Offer/Chat/AI/Review trong preview không được coi là chức năng live. API còn thiếu discovery đầy đủ tiệm của user và dữ liệu options/images draft sau restart; UI công khai giới hạn, không đoán ID hoặc gửi thay thế thiếu dữ liệu.

## Nguồn

`../design-web.md`, source `../frontend`, docs/audit và ADR hiện tại. Yêu cầu người dùng chốt visual world; không cần chọn palette/concept mới. Các vấn đề API trong audit là bối cảnh, không sửa hoặc giả là đã giải quyết.
