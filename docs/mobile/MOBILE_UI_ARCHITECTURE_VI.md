# Kiến trúc UI và dữ liệu demo Flutter

## Phạm vi

SweetCake Mobile là UI native Android/iOS hoạt động local. Không có HTTP adapter, endpoint Backend, JWT, truy cập DB, WebSocket, provider AI, email hoặc payment SDK. SDK Flutter có kết nối phục vụ debug/test; đó không phải tích hợp nghiệp vụ của ứng dụng. Source runtime được kiểm tra riêng trong [repository-integrity.json](evidence/repository-integrity.json).

## Cấu trúc

```text
mobile/
  lib/
    main.dart                    # composition ứng dụng, locale vi
    app/router/                  # 35 ScreenId, route guard, argument
    app/navigation/              # lệnh điều hướng UI
    app/theme/                   # ColorScheme, typography, spacing
    core/demo/                   # DemoWorkspace và DemoScope
    core/widgets/                # scaffold, form, dialog, state, guard
    features/
      auth/                      # persona và biểu mẫu Identity UI
      home/                      # trang chủ
      catalog/                   # bánh, tiệm, catalog, vận hành owner
      cart/                      # cart snapshot và checkout preview
      customer/                  # hồ sơ local
      marketplace/               # RFQ, offer, comparison
      orders/                    # timeline, state machine, review
      chat/                      # conversation/message local
      subscription/              # plan, đơn gói, chứng từ local
      cake_ai/                   # draft/revision và preview mẫu
      admin/                     # user fixture, các portal quản trị
  assets/                        # font, ảnh và artwork bundle
  test/                          # domain + widget workflows + coverage
  integration_test/              # hành trình trên Android thật
  test_driver/                   # ghi screenshot từ runtime
  tool/                          # chuẩn bị nguồn, evidence và kiểm chứng
```

Không đặt business state trong `main.dart`. Domain model/repository local nằm cạnh feature. `CatalogRepository` thể hiện boundary cho catalog; các domain còn lại dùng concrete local repository vì chưa có adapter thứ hai. Không tạo bộ interface rỗng hoặc giả một lớp HTTP đã sẵn sàng.

## Quản lý trạng thái

`DemoWorkspace` là composition root chứa repository và session, không điều phối transaction của microservice. `DemoScope` kế thừa `InheritedNotifier`; `Listenable.merge` thông báo thay đổi repository. Widget giữ state biểu mẫu, filter và lựa chọn tạm; repository giữ fixture domain và mutation. Có thể inject workspace vào app để kiểm thử độc lập. Các fixture nhỏ cho phép cách này gọn, không thêm package state management hoặc runtime plugin.

Mọi mutation chỉ tồn tại trong bộ nhớ của process. Đổi persona giữ dữ liệu domain để kiểm tra handoff giữa owner/admin/customer; xóa navigation stack và scenario. Nút Đặt lại dữ liệu local khôi phục fixture domain; khởi động lại app cũng trở về fixture. Không lưu mật khẩu demo, không dùng secure storage hoặc disk persistence để giả có tài khoản thật. Tên/email/địa chỉ demo chỉ dùng cho phiên này; không nhập dữ liệu cá nhân thật.

## Ranh giới domain và invariant

| Domain Backend tham chiếu | Local repository / UI | Quy tắc chính |
|---|---|---|
| Identity | `DemoSession`, Auth/Profile/Admin Users | 4 persona là quyền xem UI; không JWT, không cấp vai thật |
| Bakery / Catalog | `LocalCatalogRepository` | membership OWNER, chọn tiệm, ACTIVE trước publication; DRAFT/PUBLISHED/HIDDEN/ARCHIVED |
| Marketplace | `LocalMarketplaceRepository` | chỉ sửa RFQ DRAFT; ngân sách min≤max; ngày sau mốc demo; loại targeted cần product; owner xem đúng tiệm đích |
| Offer | cùng Marketplace | một tiệm/một RFQ kể cả đã rút; sửa PENDING; preview không chuyển ACCEPTED |
| Order | `LocalOrderRepository` | PENDING→CONFIRMED→BAKING→READY→DELIVERING; customer mới xác nhận COMPLETED, hủy PENDING; review đơn hoàn tất |
| Chat | `LocalChatRepository` | gửi không rỗng, xóa tin của mình, chặn gửi CLOSED; unread là fixture |
| Subscription | `LocalSubscriptionRepository` | một đơn chưa hoàn tất mỗi tiệm; snapshot giá; tham chiếu/ảnh mẫu; từ chối cần lý do |
| Cake AI | `LocalDesignRepository` | prompt tối thiểu 10 ký tự; lưu draft/revision; preview ảnh có sẵn, không gọi engine |
| Admin | portal dùng repository domain tương ứng | duyệt gói và hồ sơ độc lập, user CRUD chỉ prototype; không vượt thành giao dịch thật |

Mốc fixture cố định là 07/11/2026, không giả tự cập nhật theo đồng hồ thực. RFQ/offer có ngày minh họa tháng 11/2026 để kết quả test tái lập. Revision hiện lưu lịch sử prompt, chưa là hệ thống versioning cấu hình 3D. Danh mục/add-on dùng chung trong demo để thử UI, chưa là mô hình phân quyền multi-tenant hoàn chỉnh.

Giỏ giới hạn một bakery, chụp giá/option/add-on khi thêm; thay giá catalog không tự sửa snapshot. Checkout chỉ lưu bản xem trước có thể xem lại trong phiên, không tạo Order. Order fixtures độc lập với cart preview; không dựng transaction giả giữa hai domain.

Subscription payment review dùng `PAYMENT_REVIEW` trên đơn để mô phỏng tổng hợp trạng thái UI; payment entity thật có trạng thái riêng và cần mapping DTO ở giai đoạn tích hợp. PAID demo không chứng minh dòng tiền. Onboarding CUSTOMER có màn gói và hồ sơ fixture; không thực hiện flow Identity cấp BAKERY_OWNER. Các service thật vẫn phải kiểm tra ownership, quyền, thời hạn và hạn mức.

## Navigation và state phục hồi

`ScreenId` là inventory canonical, `ScreenArguments` truyền ID/type đơn giản; resource thiếu dẫn tới trang không tìm thấy. Route guard kiểm tra persona local. Owner order/chat kiểm tra selected bakery khi deep-link. Detail/sheet bổ sung không làm tăng số route Web tương đương.

Mỗi screen có bộ chọn Demo cho normal/loading/empty/error/partial/forbidden/notFound/conflict/timeout. Scenario mô phỏng ở scaffold chung, retry khôi phục normal; không tuyên bố đã thử sự cố microservice thật. Repository validation trả `StateError` với thông điệp tiếng Việt; UI hiển thị Snackbar. Một số form có busy và chặn submit lặp, repository chặn đơn gói hoặc báo giá trùng. UnsavedGuard hỏi trước khi bỏ form đã sửa.

## Mở rộng trong giai đoạn tích hợp

Sau khi có nhiệm vụ riêng, bổ sung adapter theo domain và mapping DTO/API đã xác minh, inject qua composition root; không gọi trực tiếp database hoặc internal service endpoint từ app. Auth/session/refresh cần thiết kế riêng và server phải giữ trách nhiệm authorization. Quy trình tạo order/accept offer, subscription activation và cross-service consistency phải do Backend đảm bảo, không chuyển sang `DemoWorkspace`.

Thay fixture bằng dữ liệu mạng cần paging thực, cancellation, retry có idempotency, partial data, cache và bảo vệ thông tin cá nhân. Không giữ toàn bộ list của demo cho dữ liệu production lớn. Asset media cần URL/permission/provenance đúng; AI 3D cần quyết định engine native riêng. Kiến trúc hiện chuẩn bị ranh giới UI, không chứng minh future adapter có thể thay trực tiếp mà không cần thay contract.

## Kiểm thử và giới hạn

26 ca Flutter kiểm tra domain invariant, widget workflows, 35 route, responsive và scenario. Một integration test Android kiểm tra 35 route và các hành trình giỏ, chat, RFQ, order detail, admin payment review. Log, command exit code, screenshot và integrity manifest ở `docs/mobile/evidence` và `screenshots`.

Không tích hợp Backend là phạm vi được yêu cầu, không phải lỗi startup cần khắc phục ở nhiệm vụ này. Không đụng Docker, `.env`, secrets hoặc dữ liệu persistent. iOS build: `NOT VERIFIED — macOS/Xcode environment unavailable`.
