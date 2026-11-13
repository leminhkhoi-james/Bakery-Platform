# Diễn tập README trên máy thực thi

Ngày 07/11/2026, Windows hiện có. [README](../README.md) đã được viết trước diễn tập, sau đó thực hiện bằng các PowerShell `-NoProfile -NonInteractive` mới, đặt cwd rõ ràng. Không gọi đây là kiểm tra máy sạch: máy đã có Flutter/SDK, Maven/npm cache, Docker images, canonical Identity DB, external PEM/client credentials và AVD.

## Kết quả CLI

| Bước | Cwd | Kết quả |
|---|---|---|
| Docker info/start DB có sẵn | `H:\MSS\Bakery-Platform` | Exit 0; không tạo lại DB hoặc đổi password |
| Điều kiện build JAR | root | Exit 0; JAR bền vững đã có nên không build lại |
| `recreate_runtime_h.py` | root | Exit 0; reuse Compose/volumes/config; ba OpenAPI ready |
| `runtime_preflight.py` | root | Exit 0; ba service đúng source, gateway còn unavailable |
| `run_reference_web.py` | root | Exit 0; reuse Web đang chạy, không tạo Vite trùng cổng |
| `flutter doctor -v` | `mobile` | Exit 0; vẫn có cảnh báo toolchain, không tự accept license/upgrade |
| Emulators/devices/boot | `mobile` | AVD có sẵn, `emulator-5554`, boot completed = 1; không mở AVD thứ hai |
| Bốn `adb reverse` | `mobile` | 18101/18102/18104/19022 thành công |
| `flutter pub get` | `mobile` | Exit 0; không nâng dependency ngoài phiên bản đã pin |
| `MOBILE_LIVE_STAGE=rehearsal` + live harness | `mobile` | Lần đầu lỗi locator logo; sửa key search, chạy lại riêng bước UI: exit 0 |
| Đại diện Phase 1 | Android UI | Public Home + plans thực, không fixture |
| Đại diện Phase 2 | Android UI | Login/me Owner hợp lệ |
| Đại diện Phase 3 | Android UI | Hồ sơ bakery persisted và navigation Owner |
| Đại diện Phase 4 | Android UI | ACTIVE/SCHEDULED persisted; Admin payment list thật |
| Restart riêng `mobile-bakery` | root | Exit 0; đợi OpenAPI ready, sau đó 15/15 đối chiếu bản ghi và 3 media GET đạt |
| `flutter run -d emulator-5554 --debug --no-resident` | `mobile` | Exit 0; target `lib/main.dart`; normal APK được mở trên emulator |

Bằng chứng lệnh/cwd/exit/timing: [readme-rehearsal.json](evidence/api-integration-phases-1-4/readme-rehearsal.json), `rehearsal-*.txt`, [main-cli-run.txt](evidence/api-integration-phases-1-4/main-cli-run.txt), [đối chiếu sau restart](evidence/api-integration-phases-1-4/persisted-record-reconciliation.json).

Sau bản sửa namespace storage cuối, chạy lại riêng `flutter run -d emulator-5554 --debug --no-resident` từ PowerShell mới: **exit 0**, đúng `lib/main.dart`; [metadata cuối](evidence/api-integration-phases-1-4/main-cli-final-run.json), [log cuối](evidence/api-integration-phases-1-4/main-cli-final-run.txt). Không lặp lại toàn bộ Docker/pub get hoặc các mutation đã đạt.

Lỗi locator được giữ trong `rehearsal-ui-previous-*.txt` và `runs/`; các bước Docker/pub get đã đạt không chạy lại khi sửa harness. CLI thông thường có thể dùng `flutter run -d emulator-5554`; lần tự động thêm `--no-resident` để trả terminal sau khi launch. Chưa xác nhận thao tác hot reload tương tác trong terminal này.

## Session qua process Android

Flutter recreation trong harness đã đạt, nhưng lần đầu cold start normal app phát hiện plugin storage default gặp `EncryptedSharedPreferences`/`bad base-64`. Đây là lỗi runtime mới, không suy ra PASS từ test in-process. Evidence lỗi được giữ tại [secure-storage-cold-start-issue.txt](evidence/api-integration-phases-1-4/secure-storage-cold-start-issue.txt).

App đã chuyển Android secure storage sang namespace riêng `sweetcake.identity.v1`, backup migration và `resetOnError=false`. Không xóa dữ liệu app, database hoặc KeyStore thủ công. Phiên phát triển cũ cần đăng nhập lại vào namespace mới.

**Cold process xác nhận PASS một lần**: đăng nhập thật trên normal `lib/main.dart`, xem profile CUSTOMER/BAKERY_OWNER, force-stop rồi mở Activity tạo PID mới; chờ khởi tạo xong và xem lại đúng profile, không nhập lại credential. [Metadata](evidence/api-integration-phases-1-4/main-confirmed-cold-process-restart.json), [trước restart](evidence/api-integration-phases-1-4/main-namespaced-confirmed-login.png), [profile đã settle sau restart](evidence/api-integration-phases-1-4/main-cold-restart-settled-profile.png). Không có FlutterDriver extension hoặc token injection ở APK chính.

Capture đầu theo timer vẫn loading; các lượt coordinate setup khác chưa tạo được login trước restart được đánh `NOT_VERIFIED_SETUP` trong `main-namespaced-process-restarts.json`. Không tính hai lượt đó là PASS hoặc lỗi persistence. Emulator cold startup chậm, chưa có benchmark latency. Các ảnh trước bản sửa/ảnh đang loading được giữ nguyên. Việc tạo lại workspace in-process và cold OS process không bị gộp vào một kết quả.

## Android Studio và nền tảng khác

**Android Studio GUI: NOT_VERIFIED.** Công cụ desktop automation không khởi tạo được kernel, đường cài đặt chuẩn kiểm tra không có IDE. Hướng dẫn GUI trong README vẫn có đủ Open mobile/SDK/Device Manager/entrypoint/reverse/Run nhưng chưa thực hiện được GUI. Không dùng CLI đạt để gắn Android Studio PASS.

**iOS: NOT_VERIFIED**, Windows không có Xcode/signing/iOS simulator. **Host reboot: NOT_VERIFIED**; restart policy có cấu hình, không thay cho diễn tập reboot. Không nâng Flutter/plugin/toolchain hoặc chấp nhận license tự động.

## Cách tiếp tục trên cùng máy

Chạy tuần tự các lệnh README từ root rồi `mobile`, reuse AVD đang chạy và reverse lại cổng. Admin credential vẫn ở external secrets; Customer test ở external runtime H. Nếu không còn plan active sau bài kiểm tra archive, Admin tạo plan mới qua UI trước khi thử onboarding mới. Dữ liệu cũ gồm một bakery ACTIVE, một branch PENDING_APPROVAL, một product PUBLISHED, hai đơn COMPLETED và kỳ ACTIVE/SCHEDULED; không xóa để chuẩn bị thử lại.

Sau khi hoàn tất full journey, dùng stage `rehearsal` để kiểm tra đọc lại. Không chạy lại stage extended vào cùng dữ liệu như thể category/draft/plan chưa bị xóa/archive. Nó là hành trình có mutation và checkpoint, không phải reset test suite. Muốn thử lại toàn bộ cần bộ dữ liệu local riêng được tạo qua API hợp lệ; không reset volume để né lỗi.
