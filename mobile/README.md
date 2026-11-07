# SweetCake — giao diện Flutter local

Ứng dụng UI offline có 35 màn hình tương ứng Web: 7 Public, 11 Customer, 9 Bakery Owner và 8 Admin. Giữ theme wine/hồng, wordmark, mascot và ảnh mẫu của SweetCake. Có thao tác local cho giỏ, RFQ/báo giá, đơn, chat, catalog, hồ sơ, gói thuê và quản trị. Không tích hợp Backend, JWT, DB, payment hoặc AI thật.

## Công cụ và chạy local

SDK đã kiểm chứng trên máy: Flutter 3.47.1, Dart 3.13.1, revision `6655482ec0`; SDK đang ở channel `user-branch`, không tự chuyển channel/nâng cấp. `pubspec.lock` lưu dependency đã resolve.

```powershell
cd H:\MSS\Bakery-Platform\mobile
flutter pub get
flutter analyze
flutter test
flutter build apk --debug
flutter run -d <device-id>
```

Trên máy audit có thể dùng đường dẫn đầy đủ `D:\HomeMind\audit-tools\flutter\bin\flutter.bat` nếu Flutter chưa ở PATH. Không hardcode đường dẫn SDK này vào source được theo dõi Git.

Đã chạy thành công `pub get`, `dart format .`, `analyze` không issue, 26 ca Flutter test và Android debug APK. Đã cài/chạy trên emulator `emulator-5554`, chạy integration test mở 35 route và kiểm tra các luồng local, chụp ảnh thật. APK ở `build/app/outputs/flutter-apk/app-debug.apk`, là output bị ignore. SDK XML có warning tooling, build exit code 0; không tự nâng SDK/channel hoặc chấp thuận license còn thiếu.

iOS có `Runner.xcodeproj`, `Runner.xcworkspace`, `Info.plist`, Swift entrypoint và cấu hình Flutter được CLI sinh. Build/sign iOS **chưa xác minh**: cần macOS và Xcode. Chưa có Apple Team hoặc signing identity production.

## Cấu trúc và dữ liệu

| Thư mục | Trách nhiệm hiện tại |
|---|---|
| `lib/app/router`, `navigation` | 35 route, persona guard local, detail/sheet |
| `lib/app/theme` | Token/theme theo [design-web.md](../design-web.md) |
| `lib/core/demo` | Composition repository và session local |
| `lib/core/widgets` | Scaffold, state, form, card, sheet và guard nháp |
| `lib/features` | UI và domain local theo feature; không networking |
| `assets/fonts`, `images`, `demo` | Font bundle/OFL, artwork và ảnh Web fixture offline |
| `test`, `integration_test`, `test_driver` | Domain/widget, responsive, Android và screenshot |
| `tool` | Evidence, inventory và kiểm tra ranh giới thay đổi |
| `android`, `ios` | Giữ scaffold và định danh development hiện hữu |

Các thư mục chuẩn bị chưa cần dùng vẫn giữ `.gitkeep`. Chỉ thêm SDK localization/integration test/driver, không thêm networking, storage hoặc state management package. Locale mặc định là tiếng Việt.

Mở **Demo** trên AppBar để đổi persona, chọn trạng thái loading/empty/error/retry hoặc reset fixture. Dữ liệu chỉ trong RAM: đổi persona giữ domain data để thử handoff, reset/restart khôi phục fixture. Không nhập tài khoản hoặc chứng từ thật. Ngày fixture cố định 07/11/2026. Gallery có một ảnh mỗi bánh; ảnh chứng từ chỉ là ảnh bánh có nhãn demo.

```powershell
flutter drive --driver=test_driver/integration_test.dart --target=integration_test/mobile_demo_test.dart -d emulator-5554
```

Ảnh được ghi vào `../docs/mobile/screenshots`. [Báo cáo thực thi](../docs/mobile/BAKERY_PLATFORM_FLUTTER_MOBILE_UI_IMPLEMENTATION_REPORT_VI.md), [35 màn hình](../docs/mobile/MOBILE_SCREEN_INVENTORY_VI.md), [design system](../docs/mobile/FLUTTER_DESIGN_SYSTEM_VI.md) và [kiến trúc](../docs/mobile/MOBILE_UI_ARCHITECTURE_VI.md) mô tả kết quả và giới hạn đã kiểm chứng.

## Định danh development

Tên package Dart: `bakery_mobile`. Android application ID/namespace: `com.example.bakery_mobile`; iOS bundle ID: `com.example.bakeryMobile`. Đây là mặc định **development**, không phải định danh sản phẩm đã được duyệt. Trước release cần xác định tổ chức, bundle/application ID, provisioning/signing, quyền nền tảng và store metadata. Cấu hình release Android do template còn dùng debug signing; không dùng để phát hành.

Không đưa client secret, private key, database credential hoặc provider API key vào ứng dụng mobile. Nhiệm vụ này không đọc `.env`/external secrets hoặc thay cấu hình Docker. Adapter API, session refresh, secure storage, upload ảnh và native 3D cần nhiệm vụ tích hợp riêng dựa trên contract đã ổn định.

Nguồn chuẩn bị: [audit hệ thống](../docs/audit/BAKERY_PLATFORM_CURRENT_SYSTEM_AUDIT_VI.md), [catalog API](../docs/audit/BACKEND_API_CATALOG_VI.md), [runtime Docker](../docs/audit/LOCAL_RUNTIME_VI.md), [skill cục bộ](../docs/audit/SKILLS_REVIEW_VI.md). Taste/Impeccable không tự biến mã Web thành native Flutter; giữ hình ảnh Web theo `design-web.md`, dùng widget và hành vi accessibility phù hợp nền tảng.
