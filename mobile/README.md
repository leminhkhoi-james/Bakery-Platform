# Bakery Platform — nền tảng Flutter

Scaffold Android/iOS được tạo bằng Flutter CLI trong thư mục `mobile` có sẵn (trước đó rỗng). Chưa triển khai màn hình, nghiệp vụ, API client, đăng nhập hay theme SweetCake. `lib/main.dart` chỉ khởi tạo một `MaterialApp` và `Scaffold` trống.

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

Đã chạy thành công `pub get`, `analyze`, một widget smoke test và Android debug APK. APK ở `build/app/outputs/flutter-apk/app-debug.apk`, là output bị ignore. Chưa chạy app trên emulator/thiết bị thật. `doctor -v` còn cảnh báo channel, một số Android license và Visual Studio (không cần cho Android/iOS). Build Android thành công với SDK/package cần thiết đang có; không tự chấp thuận license còn thiếu.

iOS có `Runner.xcodeproj`, `Runner.xcworkspace`, `Info.plist`, Swift entrypoint và cấu hình Flutter được CLI sinh. Build/sign iOS **chưa xác minh**: cần macOS và Xcode. Chưa có Apple Team hoặc signing identity production.

## Cấu trúc chuẩn bị

| Thư mục | Trách nhiệm khi phát triển sau này |
|---|---|
| `lib/app/config` | Chọn môi trường và API base URL; không chứa secret |
| `lib/app/router` | Routing và deep link tập trung, chưa chọn package |
| `lib/app/theme` | Token/theme theo [design-web.md](../design-web.md), chưa triển khai |
| `lib/core/network`, `errors`, `storage` | Transport, ánh xạ lỗi và secure storage khi cần |
| `lib/core/constants`, `utils`, `widgets` | Kỹ thuật dùng chung có nhu cầu thật |
| `lib/features` | Feature-first; tách UI/domain/data theo độ phức tạp thực tế |
| `lib/shared/models`, `widgets`, `extensions` | Chia sẻ có chủ đích; tránh shared domain model khổng lồ |
| `lib/l10n` | Localization; chưa thêm intl/ARB trước khi có giao diện |
| `assets/fonts`, `icons`, `images` | Chỗ dành cho asset có quyền sử dụng; chưa copy bộ asset Web |
| `test`, `integration_test` | Widget/unit và kiểm thử hành trình thật sau này |
| `android`, `ios` | File nền tảng chuẩn từ CLI, được giữ nguyên |

Các thư mục chưa có implementation dùng `.gitkeep`. Chỉ giữ package của template Flutter, không thêm state management, routing, networking hay storage library một cách suy đoán.

## Định danh development

Tên package Dart: `bakery_mobile`. Android application ID/namespace: `com.example.bakery_mobile`; iOS bundle ID: `com.example.bakeryMobile`. Đây là mặc định **development**, không phải định danh sản phẩm đã được duyệt. Trước release cần xác định tổ chức, bundle/application ID, provisioning/signing, quyền nền tảng và store metadata. Cấu hình release Android do template còn dùng debug signing; không dùng để phát hành.

Không đưa client secret, private key, database credential hoặc provider API key vào ứng dụng mobile. Kiến trúc API cần Gateway hoạt động trước; hiện local Web đang dùng Vite proxy đến sáu service, không phải endpoint production/mobile. Flutter native cần quyết định refresh-token/cookie và secure storage dựa trên contract đã ổn định.

Nguồn chuẩn bị: [audit hệ thống](../docs/audit/BAKERY_PLATFORM_CURRENT_SYSTEM_AUDIT_VI.md), [catalog API](../docs/audit/BACKEND_API_CATALOG_VI.md), [runtime Docker](../docs/audit/LOCAL_RUNTIME_VI.md), [skill cục bộ](../docs/audit/SKILLS_REVIEW_VI.md). Taste/Impeccable không tự biến mã Web thành native Flutter; giữ hình ảnh Web theo `design-web.md`, dùng widget và hành vi accessibility phù hợp nền tảng.
