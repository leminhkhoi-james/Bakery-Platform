# SweetCake Mobile

Ứng dụng **Flutter + Dart**, dùng native widgets cho Android và iOS. 23 màn hình được chuyển từ frontend Bakery Platform: khách hàng, tiệm bánh và admin. Dữ liệu ứng dụng hoàn toàn local/mock, không gọi backend. Không cần Node.js, Expo, database, token, `.env` hay backend server để chạy.

Thao tác thanh toán, AI, Escrow, chat, upload, thư mời và rút tiền đều được ghi rõ là mô phỏng. Dữ liệu sửa chỉ tồn tại trong phiên, reset khi khởi động lại. Menu mở ba portal như bản demo web; không đại diện cho authentication/authorization production.

## Chạy ứng dụng

Môi trường đã kiểm tra: Flutter **3.47.1** trên channel `[user-branch]`, Dart **3.13.1 stable**, Android SDK 36/JDK21. Không tự đổi/nâng cấp Flutter toàn cục. Nên xác nhận lại toolchain của nhóm trước khi phát hành.

```powershell
cd D:\MSS301\Bakery-Platform\mobile
flutter --version
dart --version
flutter doctor -v
flutter pub get
flutter devices
flutter run -d <android-device-id>
```

Hoặc dùng `flutter run` sau khi bật emulator/thiết bị Android. `pub get` cần package cache hoặc mạng để cài dependency; **runtime không cần mạng**. Màn hình đầu có hai món trong giỏ và một RFQ mẫu để khám phá luồng.

Trên macOS có Xcode, chọn simulator/thiết bị iOS rồi chạy `flutter pub get` và `flutter run -d <ios-device-id>`. Native iOS chưa build trong môi trường Windows này. Cấu trúc Runner, plist, storyboard, scheme và icon đã kiểm tra tĩnh.

Development identifiers: Android `dev.sweetcake.sweetcake_mobile`; iOS `dev.sweetcake.sweetcakeMobile`. Đây không phải định danh production hay cấu hình ký phát hành.

## Kiểm tra

```powershell
dart format --output=none --set-exit-if-changed lib test integration_test
flutter analyze
flutter test
flutter test integration_test/mock_journey_test.dart -d <android-device-id>
flutter build apk --debug
python tool/verify_project.py
```

Kết quả phiên này: **79 host tests PASSED**, bao gồm 16 unit, 49 route/layout/navigation/form tests, 7 interaction/recovery tests và 7 golden tests; **1 Android integration test PASSED** trên emulator API36. Analyze không có issue; Android debug APK build và cold start thành công. Android integration được chạy khi Wi-Fi/mobile data emulator đều tắt. Chưa kiểm thử thiết bị thật, native iOS hay screen reader.

APK được Flutter tạo ở `build/app/outputs/flutter-apk/app-debug.apk`; bản giao thử nghiệm nằm tại `artifacts/sweetcake-debug.apk` (ignored, khoảng 197 MiB, debug nhiều ABI, không phải gói release tối ưu). Screenshot Android: [android-home.png](docs/evidence/android-home.png). Golden baselines: `test/goldens/`.

Để review thay đổi visual, chạy `flutter test test/widget/visual_test.dart --update-goldens`, xem PNG rồi chạy `flutter test` lại. Không cập nhật baseline chỉ để che lỗi.

## Cấu trúc

- `lib/app/`: bootstrap, route enum/factory, shell/navigation.
- `lib/core/`: ThemeData, formatter, form/chat/status/layout widgets.
- `lib/features/`: customer/auth/vendor/admin screens và widget đặc thù.
- `lib/models/`: typed domain model, integer VND, enum workflow.
- `lib/state/`: AppState và CartState, ChangeNotifier + AppScope.
- `lib/services/`: repository contract và mock implementation.
- `lib/mocks/`: parse fixture asset tại data boundary.
- `assets/`: 189 catalog records và các fixture liên quan, ảnh offline, logo/cat SVG, font + OFL.
- `test/`, `integration_test/`: kiểm thử hành vi, layout, visual và Android journey.
- `docs/evidence/`: command logs, source inventory, baseline/hash audit, screenshot.

`tool/prepare_assets.py` và `tool/generate_icons.py` là công cụ bảo trì asset; không tham gia runtime. Công cụ icon cần Pillow. Không cần chạy chúng để mở app. Các URL fixture là khóa tra cứu vào image manifest local; không được chuyển sang `Image.network`.

## Tài liệu

- [Thiết kế và kiến trúc Flutter bằng tiếng Việt](design.md)
- [Đối chiếu web → Flutter](docs/WEB_TO_MOBILE_FEATURE_MAPPING.md)
- [Báo cáo triển khai và giới hạn kiểm chứng](docs/MOBILE_IMPLEMENTATION_REPORT_VI.md)
- [Audit/kế hoạch và các quyết định scope](docs/AUDIT_AND_PLAN.md)

Mọi thay đổi của mission nằm trong `mobile/`. Giữ frontend/backend/database và root infrastructure ở trạng thái chỉ đọc. Không kết nối API cho đến một phase tích hợp được phê duyệt riêng.
