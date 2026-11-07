# SweetCake Mobile — API thật Phases 1–4

Ứng dụng Flutter native giữ theme wine/hồng, Plus Jakarta Sans, logo và mascot của Web. Luồng mặc định dùng API thật: catalog/tiệm/gói public; đăng ký/đăng nhập/refresh; onboarding và quản lý catalog; subscription và Admin duyệt tiệm/payment/quản lý plan. Không fallback dữ liệu mẫu khi API lỗi.

Marketplace/RFQ/Offer, đơn mua bánh/checkout/review, Chat, Cake AI, Admin Users/Revenue/Settlement chưa tích hợp. Những route đó hiện không khả dụng. Preview cũ chỉ còn trong test hoặc entrypoint được truyền `DemoWorkspace` riêng, không nhận ID hoặc phiên live.

## Công cụ và phạm vi đã chạy

Máy thực thi: Windows 11, Flutter 3.47.1 revision `6655482ec0`, Dart 3.13.1, Java 21.0.8, Android SDK/build-tools 36.0.0, Emulator 37.2.12, Docker Engine 29.6.1, Compose 5.3.0, Node 22.20.0/Vite 8.3.1. AVD `homemind_local_run`, thiết bị `emulator-5554`, Android 16/API 36, x86_64.

Không tự đổi Flutter channel `user-branch`, nâng SDK hoặc chấp nhận license. `flutter doctor -v` còn cảnh báo channel, một số license Android và thiếu Visual Studio; Android debug vẫn build được. iOS build/sign/runtime cần macOS/Xcode và **chưa xác minh**. Android application ID development là `com.example.bakery_mobile`; không dùng debug signing để phát hành.

## Runtime bền vững trên ổ H

Sau khi runtime tạm trước bị mất, chủ dự án cho phép tạo lại tại:

`H:\MSS\.runtime\bakery-mobile-phases-1-4`

Compose project mới `bakery-mobile-20261107` dùng JAR build từ source hiện tại ở bản sao ngoài repo. Bakery/Subscription có PostgreSQL volume mới và MinIO riêng. Identity dùng lại PostgreSQL Identity local hiện có, RSA key và Admin hợp lệ; migration đã đối chiếu trùng byte trước khi kết nối. Không dùng SQL hoặc cấp role thủ công. Không thay cấu hình, secrets, volume hoặc source của hệ cũ.

Prerequisite của máy này: Docker local cũ vẫn có container/network `bakery-local-identity-db-1` / `bakery-local_default`, các image Java/PostgreSQL/MinIO đã cache và external secrets hợp lệ. Đây **không phải hướng dẫn đã chứng minh trên máy sạch**.

```powershell
cd H:\MSS\Bakery-Platform
docker info
docker start bakery-local-identity-db-1
# Chỉ khi chưa có JAR bền vững: cần Maven cache và Java 21.
if (-not (Test-Path H:\MSS\.runtime\bakery-mobile-phases-1-4\jars\identity-service.jar)) {
    python -B mobile/tool/prepare_runtime_sources.py
}
python -B mobile/tool/recreate_runtime_h.py
python -B mobile/tool/runtime_preflight.py
python -B mobile/tool/verify_backend_contracts.py
python -B mobile/tool/run_reference_web.py
```

`prepare_runtime_sources.py` chỉ build bản sao ở ổ H. Không chạy Maven/npm trong `backend/` hoặc `frontend/` gốc. `recreate_runtime_h.py` giữ credential đã tạo giữa các lần chạy; không xóa volume. Nó đọc config có sẵn, dùng Admin từ external file và tạo cấu hình cho deployment mới. File grants mới bổ sung đúng hai scope onboarding mà source hiện tại cần; file grants gốc được giữ nguyên.

Nếu Docker chưa chạy, mở Docker Desktop bằng công cụ đã cài và đợi `docker info` thành công. Không dùng prune, `down -v` hoặc reset database. Không tự tạo lại mật khẩu cho PostgreSQL volume đã khởi tạo.

| Thành phần | URL host | Trong Docker |
|---|---|---|
| Identity hiện tại | `http://127.0.0.1:18101` | `mobile-identity:8080` |
| Bakery hiện tại | `http://127.0.0.1:18102` | `mobile-bakery:8080` |
| Subscription hiện tại | `http://127.0.0.1:18104` | `mobile-subscription:8080` |
| MinIO ảnh/chứng từ | `http://127.0.0.1:19022` | `mobile-storage:9000` |
| Web tham chiếu | `http://127.0.0.1:5174` | Vite trong bản sao ngoài repo |

Gateway chưa có routing hoạt động. Mobile debug gọi public API trực tiếp qua ba origin cấu hình tập trung; không gọi `/internal/`, không phụ thuộc Vite. Web hữu ích để đối chiếu bản ghi nhưng không phải transport của Mobile.

## Chạy Android từ terminal mới

```powershell
cd H:\MSS\Bakery-Platform\mobile
flutter doctor -v
flutter emulators
flutter devices
adb devices
# Chỉ chạy lệnh launch nếu AVD chưa mở.
flutter emulators --launch homemind_local_run
adb -s emulator-5554 shell getprop sys.boot_completed
adb -s emulator-5554 reverse tcp:18101 tcp:18101
adb -s emulator-5554 reverse tcp:18102 tcp:18102
adb -s emulator-5554 reverse tcp:18104 tcp:18104
adb -s emulator-5554 reverse tcp:19022 tcp:19022
flutter pub get
flutter run -d emulator-5554
```

Đợi `sys.boot_completed` bằng `1`. Không mở AVD thứ hai nếu đã có thiết bị phù hợp. `adb reverse` cần làm lại sau khi emulator/host khởi động lại. Default **debug** dùng các URL loopback trên; release không có default HTTP. Có thể truyền `--dart-define=IDENTITY_URL=...`, `BAKERY_URL=...`, `SUBSCRIPTION_URL=...` cho public HTTPS origin đã được xác minh. Không truyền password/token/service secret bằng dart-define.

Loopback emulator khác loopback host. Port reversal giữ nguyên hostname/port của signed storage URL; không thay hostname trong chữ ký. Không đưa Docker DNS vào app. Android debug chỉ cho HTTP tới `127.0.0.1`, `localhost`, `10.0.2.2`; không tắt kiểm tra TLS hoặc mở cleartext release.

## Android Studio

Đường GUI **NOT_VERIFIED**: công cụ desktop automation báo lỗi khởi tạo kernel. Không suy rằng CLI PASS là Android Studio PASS.

Trên máy có Android Studio/Flutter plugin: Open thư mục `mobile`; chọn SDK Flutter đã cài; mở Device Manager, chọn AVD hiện hữu hoặc thiết bị phù hợp; chạy các lệnh `adb reverse` trên; chọn cấu hình Dart entrypoint `lib/main.dart`, device tương ứng, thêm cùng các dart-define nếu đổi origin, rồi Run. Không mở nhầm root như một dự án Android native và không tự nâng toolchain/plugin theo cảnh báo IDE.

## Tài khoản, session và dữ liệu

Đăng ký Customer bằng form trong app. Owner được cấp bởi Backend sau onboarding + Admin duyệt tiệm + subscription có hiệu lực, rồi refresh token. Mua gói dành cho tiệm mà tài khoản có OWNER membership ACTIVE, không phải gói cá nhân. Role ADMIN không tự biến thành chủ của mọi tiệm.

Tài khoản Admin local được lấy từ external credential file đã có; harness đọc `BAKERY_ADMIN_CREDENTIAL_FILE` hoặc file `local-smoke-users.json` trong external secrets. Chỉ cung cấp đường dẫn cho công cụ, không đưa giá trị vào source, report, screenshot hoặc APK. Credential Customer kiểm thử nằm trong runtime ổ H với ACL riêng, không nằm trong repo. Người dùng app nhập tài khoản qua UI, app không lưu mật khẩu.

Android secure storage dùng namespace `sweetcake.identity.v1`, tách data và KeyStore aliases khỏi preferences legacy. Sau lần chuyển từ bản preview/default store, đăng nhập lại một lần. Không cần clear app data hoặc xóa KeyStore. Trong dữ liệu kiểm thử hiện tại, plan đã archive để xác minh snapshot; Admin cần tạo plan active mới nếu bắt đầu onboarding mới.

Session dùng OS secure storage, access token và opaque refresh cookie đúng Identity origin **kể cả port** và `/api/v1/auth`. Refresh single-flight, rotation giữ nguyên Secure/HttpOnly/expiry; logout xóa local ngay và phân biệt server revoke đã xác nhận với cleanup khi mất mạng. JWT access đã cấp không được tuyên bố thu hồi tức thì. Đổi tài khoản/tiệm làm mất hiệu lực dữ liệu private và phản hồi cũ.

Payment là metadata/proof để Admin duyệt thủ công, không chuyển tiền thật. Sandbox chỉ xuất hiện nếu capability endpoint báo bật; không nhúng mã sandbox. Dùng chứng từ tổng hợp khi thử local. Server total và snapshot là chuẩn; không tính tổng checkout bằng số thực.

## Kiểm thử và bằng chứng

```powershell
cd H:\MSS\Bakery-Platform\mobile
flutter pub get
dart format --output=none --set-exit-if-changed lib test integration_test test_driver tool/live_ui_driver.dart
flutter analyze
flutter test
flutter build apk --debug
python -B tool/run_live_verification.py
# Sau khi đã hoàn tất hành trình tạo dữ liệu: diễn tập chỉ đọc dữ liệu đã lưu.
$env:MOBILE_LIVE_STAGE='rehearsal'
python -B tool/run_live_verification.py
Remove-Item Env:MOBILE_LIVE_STAGE
# Kiểm tra các tệp first-party ngoài mobile so với baseline, không ghi đè baseline.
python -B tool/protected_inventory.py --verify
```

Harness live cần runtime/AVD/reverse đã sẵn sàng và Admin hợp lệ. Nó đi qua UI Flutter, native file picker, API thật; các lỗi mạng có test boundary riêng, không dừng database dùng chung. Log được lọc credential trước khi lưu. Tệp input kiểm thử được giữ ngoài repo để tiếp tục hành trình đang dở; không dùng làm fallback của app.

Preview demo cũ có thể chạy riêng bằng integration test cũ; screenshot đã chuyển vào `mobile/docs/evidence/demo-preview/`. Không coi các PASS demo là bằng chứng Backend.

Kết quả và số lượng thực tế xem [ma trận](docs/API_INTEGRATION_MATRIX_PHASES_1_4_VI.md), [kiểm thử](docs/API_INTEGRATION_TEST_RESULTS_PHASES_1_4_VI.md), [diễn tập runbook](docs/LOCAL_RUNBOOK_VERIFICATION_VI.md) và [báo cáo thực thi](BAKERY_PLATFORM_MOBILE_API_INTEGRATION_PHASES_1_4_REPORT_VI.md). Bằng chứng mới ở `docs/evidence/api-integration-phases-1-4/`.

## Restart và xử lý lỗi

```powershell
cd H:\MSS\Bakery-Platform
docker compose -p bakery-mobile-20261107 -f H:\MSS\.runtime\bakery-mobile-phases-1-4\compose.json restart mobile-bakery
python -B mobile/tool/runtime_preflight.py
# Dừng riêng stack thử này khi cần; không xóa volume hoặc dừng Identity DB dùng lại.
docker compose -p bakery-mobile-20261107 -f H:\MSS\.runtime\bakery-mobile-phases-1-4\compose.json stop
```

Chỉ restart service bị ảnh hưởng sau khi xem lỗi thực tế. Container `Up` chưa đủ: kiểm tra readiness và API nghiệp vụ. Cổng trùng: kiểm tra tiến trình, không dừng PostgreSQL khác. 401: khôi phục/đăng nhập lại; 403: kiểm role + membership; 409: đọc lại trạng thái, không tạo key mới để né conflict; 422: kiểm DTO/điều kiện publish/payment. Mất response mutation: đối chiếu danh sách/chi tiết trước khi gửi lại.

Ảnh lỗi: kiểm reverse cổng 19022, expiry và refetch lấy URL mới; không dùng ảnh fixture thay thế. Bakery draft/options/images không có API quản trị đọc đầy đủ sau restart: app thông báo giới hạn và chặn PUT thiếu dữ liệu. Chưa có public API profile edit/address/reset password hoặc danh sách đầy đủ bakery của user.

Kotlin plugin cache khác ổ C:/H: đã cấu hình `kotlin.incremental=false` và compiler in-process trong dự án; không cần xóa cache toàn máy. Cảnh báo plugin KGP và SDK XML được ghi nhận, không tự nâng phiên bản để che cảnh báo.
