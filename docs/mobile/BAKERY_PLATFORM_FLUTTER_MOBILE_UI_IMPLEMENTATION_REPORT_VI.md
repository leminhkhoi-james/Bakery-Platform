# Báo cáo triển khai giao diện Flutter SweetCake

Ngày thực hiện: **07/11/2026**. Repository: `H:\MSS\Bakery-Platform`. Baseline Git: `912c5ffc478911e485b4d0fee8db80c473b4fd66`, workspace sạch trước triển khai.

## 1. Tổng quan nhiệm vụ

Đã mở rộng scaffold Flutter sẵn có thành ứng dụng SweetCake UI local có **35 màn hình canonical**, tương ứng 7 Public, 11 Customer, 9 Bakery Owner và 8 Admin. Có giao diện, điều hướng, repository fixture và thao tác demo; không dừng ở theme hoặc một số trang mẫu.

Phạm vi của master prompt Flutter mới là UI offline, **không tích hợp Backend**. Vì vậy nhiệm vụ này không tiếp tục sửa Docker, `.env`, Gateway hay API từ đợt audit trước. Các báo cáo/evidence audit trước được giữ nguyên; kết quả hiện tại không thay thế hoặc nâng trạng thái vận hành Backend. Chỉ sửa `mobile` và tài liệu `docs`, không stage/commit/push.

## 2. Nguồn tham chiếu

Đã đối chiếu quy tắc dự án, PROJECT-STATUS, ARCHITECTURE, API_SPEC, DATABASE, ADR và báo cáo audit hiện có; đọc lại inventory Web từ source để xác nhận 35 route. Danh sách tài liệu và hash được ghi trong [reference-reading.json](evidence/reference-reading.json); source Web trong [web-source-reading.json](evidence/web-source-reading.json). Đã dùng nội dung đầy đủ của `design-web.md`, source feature Web, token và ảnh chụp Web có sẵn để xác định nhận diện.

Đặc biệt giữ quyết định onboarding mới trong ADR-005: duyệt tiệm và duyệt gói là hai điều kiện độc lập, việc cấp platform role thật thuộc Backend. Không lặp lại các kết luận audit đã cũ như thể chúng chưa được sửa; không sửa business logic trong nhiệm vụ Flutter.

## 3. Phân tích phong cách thiết kế Web

SweetCake dùng wine/hồng sữa, Plus Jakarta Sans, wordmark mềm và mascot mèo. Public/Customer thiên về khám phá bánh và hình ảnh; portal vận hành dùng nền slate/trắng, trạng thái và hành động rõ ràng. Mobile giữ các dấu hiệu đó, thích ứng kiosk thành mái sọc mint/hồng nhỏ và mascot trong khung tròn. Không tái tạo sân khấu trang trí, scroll snap hoặc hiệu ứng parallax của Web.

Ảnh bánh bundle là ảnh đang được Web fixture tham chiếu, không phải ảnh AI mới hoặc sản phẩm thật đã xác minh. Không sao chép các tuyên bố escrow/bảo đảm tài chính không có Backend hỗ trợ. Xem [đối chiếu design system](FLUTTER_DESIGN_SYSTEM_VI.md).

## 4. Kiến trúc Flutter Mobile

Feature-first, tách presentation và domain repository local. `DemoWorkspace` compose session và repository; `DemoScope`/`InheritedNotifier` thông báo thay đổi. Widget giữ state form/filter; domain giữ dữ liệu và quy tắc chuyển trạng thái. Chưa thêm HTTP adapter, JWT, DB hoặc orchestration microservice vào mobile.

`CatalogRepository` là abstraction đang có nhu cầu thật; các domain khác giữ local repository cụ thể để tránh interface hình thức. Có workspace injection cho tests. Chi tiết trong [MOBILE_UI_ARCHITECTURE_VI.md](MOBILE_UI_ARCHITECTURE_VI.md).

## 5. Cấu trúc thư mục Mobile

`lib/app` chứa router/navigation/theme; `lib/core` chứa composition và component chung; `lib/features` có auth, home, catalog, cart, customer, marketplace, orders, chat, subscription, cake_ai, admin. `assets` chứa artwork/font/ảnh offline; `test`, `integration_test`, `test_driver` chứa kiểm thử; `tool` chứa công cụ thu evidence và kiểm tra ranh giới.

Giữ nguyên thư mục `mobile` hiện hữu, Android/iOS scaffold, định danh development và nội dung chuẩn bị trước. Không tạo `Mobile`, `Backend` hoặc `Frontend` trùng tên. Các thư mục chuẩn bị chưa có nhu cầu vẫn giữ `.gitkeep`, không bị xóa để dựng lại dự án.

## 6. Hệ thống Design Tokens

Màu chính `#6B212E`, màu nhấn `#C05477`, nền `#FFF0F5`/`#FFF8FA`, chữ `#0F172A`/`#64748B`, workspace `#F8FAFC`; status có foreground/background semantic. Typography body 14, title 16–20, headline 24–32, variable font bundle local. Gutter 16, spacing 4/8/16/24/40/48, radius 12/20/8, target chạm native 48.

Theme dùng ColorScheme cụ thể, không sinh palette từ seed hoặc bật Dynamic Color làm đổi thương hiệu. Chi tiết mapping, component, motion và license font trong [FLUTTER_DESIGN_SYSTEM_VI.md](FLUTTER_DESIGN_SYSTEM_VI.md).

## 7. Danh sách toàn bộ màn hình

35/35 route có đối ứng Flutter. [MOBILE_SCREEN_INVENTORY_VI.md](MOBILE_SCREEN_INVENTORY_VI.md) liệt kê từng Web path, persona, domain, capability, bằng chứng thao tác và ảnh Android. Inventory JSON giúp kiểm tra lại bằng công cụ. Alias `/vendor-settings` không tăng số lượng; thread, detail, editor, gallery và sheet là trạng thái phụ.

Đã kiểm tra mở/layout ở 35 route, ba tình huống loading/empty/error của từng route, retry và persona đúng. Không suy diễn kết quả này thành mọi tổ hợp thao tác hoặc mọi thiết bị đều đã kiểm thử.

## 8. Giao diện Guest và Customer

Home, khám phá, bakery directory/detail, product detail, plans và login/registration có nhận diện SweetCake. Có tìm kiếm, category/khu vực filter, sắp giá, tải thêm, chọn size/flavor/add-on, gallery phóng to và giỏ local. Giỏ chụp giá khi thêm, giới hạn một tiệm, thay số lượng và lưu checkout preview xem lại trong phiên.

Customer có hồ sơ sửa local, order list/detail/timeline/review, RFQ form/draft/publish/cancel, báo giá/so sánh/chọn preview và chat. Studio có prompt, màu/tầng/vị, chọn ảnh cảm hứng, lưu draft/revision và chuyển mô tả sang form RFQ. Không có native AI/3D engine; UI ghi rõ ảnh mẫu. Quên mật khẩu chỉ giải thích chưa hỗ trợ, không gửi email giả.

## 9. Giao diện Bakery Owner

Owner chọn một trong hai tiệm có membership fixture, xem dashboard theo tiệm, quản lý sản phẩm/danh mục/add-on/size-flavor/media, publication và hồ sơ vận hành. Editor có validation và bảo vệ thay đổi chưa lưu. Có order detail và state controls, RFQ khả dụng, soạn/sửa/rút báo giá, chat theo tiệm, plan/order history và gửi tham chiếu/ảnh minh họa chứng từ.

Tiệm cần ACTIVE để publication; RFQ nhắm sản phẩm chỉ xuất hiện cho tiệm đích. Báo giá bị chặn trùng ngay cả sau khi rút. Revenue owner là màn thông tin có liên kết tác vụ, vì chưa có API doanh thu/ví/payout thật; không dựng số dư có thể rút.

## 10. Giao diện Admin

Admin có dashboard hàng chờ, user CRUD local với tìm/lọc/tải thêm, duyệt/bổ sung/tạm dừng hồ sơ tiệm, duyệt/từ chối chứng từ gói có lý do, tạo/sửa/ngừng plan, order list/detail, kiểm duyệt design/review và tổng giá trị gói PAID fixture. Dùng thẻ, filter, sheet, expansion và dialog thay bảng desktop quá nhỏ.

User management được ghi rõ chưa có hợp đồng API live đầy đủ. Doanh thu admin chỉ là giá trị subscription fixture, không phải doanh thu bánh, tiền escrow hoặc xác nhận dòng tiền.

## 11. Điều hướng và quản lý trạng thái

Thanh dưới tối đa năm nhóm theo persona; drawer cho tác vụ ít dùng; rail ở tablet. Route con giữ stack/back, map về nhóm navigation phù hợp. Chat thread ẩn thanh dưới để ưu tiên composer; gửi tin cuộn đến cuối. Sheet có SafeArea, scroll và inset bàn phím. Form RFQ/product/offer/studio dùng bảo vệ nháp khi back.

Bộ chọn Demo đổi Guest/CUSTOMER/BAKERY_OWNER/ADMIN và tình huống màn hình. Đây không phải authentication hoặc security boundary. Dữ liệu domain giữ giữa các vai để thử handoff local; reset khôi phục fixture. Session/profile chỉ trong bộ nhớ process.

## 12. Dữ liệu giả lập và phạm vi mô phỏng

Fixture có 8 bánh, 4 tiệm, 3 RFQ, 2 báo giá, 3 đơn bánh, 2 hội thoại, 3 plan, 2 đơn gói, 1 design và 3 user ở trạng thái ban đầu. Dùng email `example.invalid`; không đọc `.env` hoặc external secrets. Mốc thời gian demo cố định 07/11/2026 để test tái lập.

Chọn offer chỉ lưu `previewOfferId`, vẫn PENDING. Checkout không tạo Order. Gửi chat chỉ append local. Duyệt chứng từ chỉ đổi fixture; không có tài khoản nhận tiền hoặc QR thật. Revision lưu lịch sử prompt, chưa là versioning đầy đủ của cấu hình 3D. Gallery có một ảnh mỗi sản phẩm trong fixture hiện tại.

## 13. Khả năng mở rộng cho Microservices

Domain UI được phân theo Identity, Bakery/Catalog, Marketplace, Order, Chat, Subscription, Cake AI. Giai đoạn tích hợp sau phải xác nhận DTO/route/error contracts rồi thêm adapter và dependency injection theo domain. Backend tiếp tục giữ ownership, quyền, hạn mức, expiry, transaction và tính nhất quán phân tán.

Không có URL nội bộ service, client secret hoặc cơ chế mobile gọi DB trực tiếp. Chưa cam kết có thể đổi fixture sang HTTP bằng một cấu hình; adapter, session refresh, idempotency và paging thật vẫn cần triển khai trong nhiệm vụ riêng.

## 14. Kết quả sử dụng Taste Skill

Đã đọc skill Taste cục bộ và hướng dẫn hệ thống/motion phù hợp, dùng khi xây phân cấp, gutter, density, typography, ảnh và tác vụ native. Giữ nhận diện đã có theo brief, không tự đổi radius/palette để chạy theo mặc định của skill. Rà ảnh thật của cả 35 màn hình và các trạng thái tiêu biểu; sửa các lỗi có bằng chứng thay vì chấm điểm tùy ý.

Không chạy checker HTML/CSS của Taste lên Flutter hoặc báo một điểm số Web như chứng nhận chất lượng native. Skill không bị chỉnh sửa/cài lại trong nhiệm vụ này; hash file được kiểm tra ở bước integrity.

## 15. Kết quả sử dụng Impeccable

Đã đọc Impeccable, craft floor, hướng dẫn Android/iOS và audit native. Đã gọi context engine một lần với target mobile và cache ngoài repository, tránh launcher có thể chuẩn hóa lại file skill. Tạo `mobile/PRODUCT.md` và `mobile/DESIGN.md` từ brief có sẵn, không tạo tài liệu root bị cấm.

Rà native theo accessibility, performance, theme, platform và adaptivity. Không dùng browser detect làm chứng cứ Flutter. Ghi nhận giới hạn iOS, TalkBack và release profiling; không tuyên bố tool đã kiểm tra các phần không chạy.

## 16. Kiểm tra UI/UX và Accessibility

Đã sửa dropdown tràn ở phone, card bánh thiếu chiều cao, rail landscape thấp và state view thiếu scroll. Widget tests bắt lỗi controller bị dispose trước animation đóng sheet; đã chuyển controller vào StatefulWidget sở hữu form. Rà ảnh phát hiện email/ngân sách và metric tiền bị bẻ dòng kém; đã cho label/value và metric chuyển bố cục khi hẹp. Mascot dùng khung crop native để bỏ thoại nguồn bị cắt. Chat tự cuộn và dành thêm diện tích thread.

35 màn hình qua các width 320/360/390/430/768, chữ 1.8 và landscape 768×430. Có semantics/tooltip cho icon, status và ảnh, màu status kèm chữ, target native 48, validation gần field. Chưa chạy TalkBack/VoiceOver thủ công; chưa tuyên bố WCAG toàn ứng dụng. Debug emulator có log skipped frames khi startup/IME/chụp ảnh; chưa có phép đo hiệu năng release nên không kết luận 60 fps.

Kiểm tra hồi quy bổ sung bao gồm không còn gói ACTIVE, chặn tạo đơn khi không có gói, catalog của tiệm bị tạm dừng, reset danh mục, hương vị trống, giới hạn số lượng giỏ và xác nhận trước khi bỏ form đã sửa. Bảy cặp màu token được tính contrast từ 4,55:1 đến 17,85:1; chi tiết và phạm vi giới hạn trong [visual-review.json](evidence/visual-review.json).

## 17. Kết quả chạy Flutter

| Hạng mục | Kết quả | Bằng chứng |
|---|---|---|
| Flutter / Dart | 3.47.1 / 3.13.1, SDK hiện hữu, không nâng cấp | môi trường local đã xác minh |
| `flutter pub get` | PASS | lockfile, dependency resolution trong log |
| `dart format .` trong `mobile` | PASS | [final-format.txt](evidence/final-format.txt) |
| `flutter analyze` | PASS, không issue | [final-analyze.txt](evidence/final-analyze.txt) |
| `flutter test` | PASS, **26 ca** | [final-test.txt](evidence/final-test.txt) |
| Android debug APK | PASS | [final-build.txt](evidence/final-build.txt), [commands.json](evidence/commands.json) |
| Android integration | PASS, 1 hành trình kiểm tra 35 route + tác vụ | [android-integration.txt](evidence/android-integration.txt) |
| Cài/chạy app thường trên emulator | kiểm chứng qua runtime riêng | [android-installed-runtime.json](evidence/android-installed-runtime.json) |
| iOS build/runtime | **NOT VERIFIED — macOS/Xcode environment unavailable** | máy thực thi Windows |

26 ca gồm 6 domain, 11 widget workflow, 8 coverage/scenario và 1 smoke. Ngoài mở màn hình, assertions kiểm tra giá snapshot, size, số lượng, bản nháp, trạng thái offer, đơn, chứng từ và user. Integration Android kiểm tra cart preview, gửi tin, lưu RFQ, order detail và admin review; hai lần trước phát hiện thao tác automation cần đợi IME/scroll, đã sửa synchronization và chạy lại thành công. Không giấu các lỗi UI phát hiện trong quá trình triển khai.

Build có warning SDK XML/tooling và thông báo package mới hơn, nhưng exit code thật bằng 0; không tự đổi SDK/channel/license. Chỉ debug APK, chưa release signing/store submission. Dùng [run_checks.py](../../mobile/tool/run_checks.py) để ghi exit code thật, tránh nhầm stderr warning của PowerShell với build thất bại.

## 18. Ảnh chụp giao diện

41 ảnh từ integration Android: 35 màn canonical và 6 trạng thái/hành trình bổ sung. Ảnh app cài/chạy thường được ghi riêng. Đây là render thật từ emulator, không phải ảnh thiết kế hoặc mockup. Index và thông tin ảnh tại [screenshots/README.md](screenshots/README.md); từng route có link ở inventory.

Ảnh tiêu biểu: [Home](screenshots/00-home.png), [Explore](screenshots/01-explore.png), [Studio](screenshots/11-studio.png), [Owner catalog](screenshots/19-vendorCatalog.png), [Admin payment review](screenshots/30-adminPayments.png), [Chat thread](screenshots/36-chat-thread.png), [Error/retry](screenshots/40-error-retry.png).

## 19. So sánh giao diện Web và Mobile

| Nhóm | Giữ từ Web | Thích ứng Flutter |
|---|---|---|
| Home | wordmark, mèo, wine/hồng, sọc mint | hero gọn và CTA touch; không sao chép toàn kiosk |
| Catalog | ảnh fixture, tên/giá, card và status | grid responsive, option bằng chip/select, ảnh zoom native |
| RFQ/Offer | phân cấp yêu cầu, so giá và hành động | form cuộn, dialog xác nhận, comparison stack trên phone |
| Owner/Admin | nền slate/trắng, wine, filter, panel | cards/expansion thay bảng desktop, bộ chọn tiệm |
| Chat/Studio | ngôn ngữ màu và nội dung workspace | composer native, ảnh preview thay Three.js/AI thật |

Không khẳng định pixel-perfect với kiosk Web hoặc parity native 3D. Những khác biệt về navigation, touch target, keyboard và chiều rộng là thích ứng chủ đích, không thay đổi thiết kế Web.

## 20. Các vấn đề còn tồn tại

Chưa có iOS build/runtime, review bằng screen reader thật, thiết bị vật lý hoặc release profiling. Dữ liệu chỉ trong RAM; restart mất mutation local theo thiết kế demo. Fixture nhỏ không chứng minh hiệu năng dữ liệu production lớn. Ảnh nguồn chứa chữ/khung website và quyền phát hành cần xác nhận; nên thay bằng bộ media sản phẩm sạch ở giai đoạn release được duyệt.

Không có Backend auth, đồng bộ, upload ảnh thiết bị, gửi tin thật, order/payment thật hoặc AI/3D. Đây là phạm vi được yêu cầu, không phải chức năng được báo PASS. Các blocker API từ audit trước vẫn thuộc báo cáo Backend và trạng thái mới nhất của dự án; nhiệm vụ này không sửa hoặc kiểm thử lại chúng.

## 21. Danh sách file được tạo hoặc chỉnh sửa

Implementation nằm trong `mobile/lib`, asset/font local trong `mobile/assets`, dependency Flutter SDK localization/test trong `pubspec.yaml` và lockfile. Có tests, driver, công cụ evidence, README và tài liệu PRODUCT/DESIGN của riêng mobile. Không thêm package networking hoặc state management không cần thiết.

Tài liệu mới: inventory, design system, architecture và báo cáo này cùng evidence/screenshots trong `docs/mobile`. PROJECT-STATUS được bổ sung mục ngày 07/11/2026, giữ nguyên lịch sử. Danh sách chi tiết, kích thước và SHA-256 tại [file-manifest.json](evidence/file-manifest.json); manifest không tự hash chính nó.

## 22. Kiểm chứng không thay đổi Backend/Frontend

Đối chiếu **2.754 file tracked được bảo vệ** ngoài `mobile`/`docs` với baseline: không đổi hash. Bao gồm Backend, Frontend, root config, `design-web.md` và skill hiện hữu. Git status không có thay đổi ngoài hai vùng cho phép; không có file staged. Xem [repository-integrity.json](evidence/repository-integrity.json).

Quét runtime Dart không thấy HTTP/Dio/WebSocket/NetworkImage/URL Backend; quét các file text thay đổi không thấy private key hoặc JWT theo pattern kiểm tra. Không đọc secrets để so khớp giá trị. Đây không phải chứng nhận phát hiện mọi loại secret hoặc kiểm toán cache/build untracked. Không chạy tests/backend tooling có thể tạo file ngoài phạm vi được phép.

## 23. Hướng dẫn chạy ứng dụng Flutter

```powershell
cd H:\MSS\Bakery-Platform\mobile
flutter pub get
dart format .
flutter analyze
flutter test
flutter build apk --debug
flutter run -d emulator-5554
```

SDK trên máy hiện tại ở `D:\HomeMind\audit-tools\flutter\bin`; nếu chưa có PATH, dùng đường dẫn đầy đủ hoặc đặt `FLUTTER_BIN` cho script kiểm tra. APK: `mobile/build/app/outputs/flutter-apk/app-debug.apk` (output bị Git ignore).

Chạy automation và xuất ảnh:

```powershell
flutter drive --driver=test_driver/integration_test.dart --target=integration_test/mobile_demo_test.dart -d emulator-5554
```

Không cần Docker, `.env` hoặc kết nối mạng để dùng UI. Mở Demo trên AppBar để đổi vai, chọn lỗi/loading/empty hoặc reset fixture. Chọn Chủ tiệm để mở portal vận hành; Admin để xem hàng chờ. Khởi động lại app khôi phục dữ liệu ban đầu. Không nhập credential hoặc chứng từ thật vào biểu mẫu demo.

## 24. Đề xuất giai đoạn tiếp theo

Thực hiện QA iOS trên macOS/Xcode và test VoiceOver/TalkBack với người dùng. Đo release/profile trên thiết bị tầm trung, bổ sung paging/virtualization khi có data lớn và xác nhận bộ ảnh có quyền phát hành. Quyết định app ID/signing/store metadata trước release; template hiện còn định danh development và debug signing.

Chỉ bắt đầu tích hợp API trong nhiệm vụ được duyệt riêng, dựa trên API_SPEC/ADR hiện hành. Ưu tiên auth/session, Gateway public contract, Catalog và RFQ; sau đó Order, Chat, Subscription và AI theo năng lực thực tế. Không chuyển trách nhiệm transaction/phân quyền microservice sang client và không hồi sinh escrow/payout giả.

## 25. Kết luận và mức độ hoàn thành

Đã hoàn thành UI local cho 35 màn hình và các trạng thái phụ, theme/component chung, repository theo domain, các luồng demo có hành động, build Android, tests, runtime emulator, ảnh và tài liệu tiếng Việt. Phạm vi Android local được kiểm chứng bằng test và render thật. iOS, accessibility thủ công, release performance và mọi tích hợp Backend được ghi đúng giới hạn; không báo thành sản phẩm production hoặc hệ thống thanh toán/AI đang hoạt động.
