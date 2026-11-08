# SweetCake Mobile · chạy local và kiểm chứng

Kết quả hiện tại: **PARTIAL_BLOCKED**. Flutter gọi Backend Docker thật qua sáu public origins. Có adapter cho 93 operation áp dụng Mobile; địa chỉ giao hàng, lịch sử chat, RFQ storage và Cake AI còn chặn hành trình đầy đủ. [Báo cáo cuối](docs/full-integration/FULL_MOBILE_API_INTEGRATION_E2E_REPORT_VI.md) · [Ma trận API](docs/full-integration/API_COVERAGE_MATRIX_VI.md) · [Kết quả E2E](docs/full-integration/END_TO_END_TEST_RESULTS_VI.md).

## Phát hiện công cụ và deployment

Mở PowerShell tại `mobile` trong clone của bạn:

```powershell
Get-Location
Test-Path pubspec.yaml
Get-Command python, flutter, adb | Select-Object Name,Source
flutter --version
flutter doctor -v
flutter emulators
adb devices -l
docker info --format '{{.ServerVersion}}'
docker compose ls --all
```

Cần Python 3, Flutter/Dart, JDK/Android SDK, AVD và Docker Engine. Nếu Docker chưa chạy, mở Docker Desktop đã cài rồi chờ `docker info` thành công; không prune/reset. GUI khởi động Docker/Android Studio và Cold Boot **NOT_VERIFIED** trong đợt này. CLI reuse/start runtime, chờ boot/Package Manager và mở app đã diễn tập. AVD offline: xử lý đúng AVD trong Device Manager, không Wipe Data hoặc mở bản sao.

Đây là quy trình **deployment hiện hữu**, chưa chứng minh clean clone bootstrap. Phải còn `.runtime/bakery-mobile-phases-1-4` cạnh repository (Compose/JAR/source copy/mounted config/PEM chỉ đọc), container `bakery-mobile-20261107-mobile-{identity,bakery,subscription,storage}-1`, ba container `bakery-mobile-phase5-{marketplace,order,chat}`, DB/image/network/volume và credential đã được cấu hình. Không sinh lại key/password DB đã khởi tạo. Không đưa secret vào Flutter/argv/Git. Thiếu prerequisite: launcher dừng, không sửa Backend để làm xanh readiness.

## Khởi chạy ứng dụng chính

Chọn serial/AVD vừa phát hiện. `-EvidenceDirectory` phải ở trong `mobile`; dùng thư mục mới mỗi lần. Flag này bật reuse-only, không tạo container mới. Default tương thích cũ của script vẫn tồn tại; quy trình canonical dùng flag này.

```powershell
$MobileEvidence = 'docs/local-runs/' + (Get-Date -Format 'yyyyMMdd-HHmmss')
$MobileDevice = 'emulator-5554' # thay bằng serial vừa phát hiện
powershell -NoProfile -ExecutionPolicy Bypass -File tool/start_mobile.ps1 `
  -DeviceId $MobileDevice -EvidenceDirectory $MobileEvidence -NoResident
```

Chưa có emulator online: bỏ `-DeviceId`, đặt `-AvdId` từ `flutter emulators`. Script chỉ mở AVD đã cài, chờ boot và Package Manager bằng số lần thử hữu hạn. `-PrepareOnly` chuẩn bị runtime/ADB; bỏ `-NoResident` để giữ console/hot reload. Không chia sẻ debug URL có token.

Lần diễn tập `--no-resident` đầu exit0 khi còn splash; ảnh đó không được tính sẵn sàng. Đã xác minh mở lại tiến trình rồi Home SweetCake hiển thị đúng, không clear data:

```powershell
adb -s $MobileDevice shell am force-stop com.example.bakery_mobile
adb -s $MobileDevice shell am start -n com.example.bakery_mobile/.MainActivity
```

[Biên bản diễn tập](docs/full-integration/LOCAL_RUNBOOK_VERIFICATION_VI.md) ghi lệnh thực, cache/dependency và ảnh Home. SDK/AVD của máy kiểm tra không phải yêu cầu cài đặt chung.

## Routing đã kiểm chứng

Đối chiếu cổng bằng `runtime-start.json`/Docker trên máy khác. Sáu service dùng internal8080, storage9000. Gateway hiện dừng/chưa có route đầy đủ; Web không phải dependency Mobile.

| Thành phần | Host origin máy kiểm tra | Dart define |
|---|---|---|
| Identity | `http://127.0.0.1:18101` | `IDENTITY_URL` |
| Bakery | `http://127.0.0.1:18102` | `BAKERY_URL` |
| Subscription | `http://127.0.0.1:18104` | `SUBSCRIPTION_URL` |
| Marketplace | `http://127.0.0.1:18103` | `MARKETPLACE_URL` |
| Order | `http://127.0.0.1:18106` | `ORDER_URL` |
| Chat | `http://127.0.0.1:18107` | `CHAT_URL` |
| Bakery/Subscription media | `http://127.0.0.1:19022` | ADB reverse |
| Chat storage | `http://127.0.0.1:19006` | reverse; URL trả về còn giới hạn |
| Cake AI | chưa có runtime hợp lệ | `CAKE_AI_URL` tùy chọn, chỉ đặt khi đã xác minh |

Launcher đợi sáu `/v3/api-docs` và hai `/minio/health/ready` HTTP200, thiết lập tám reverse mappings. `adb -s $MobileDevice reverse --list` xác minh emulator loopback. Không dùng Docker DNS làm origin Android, rewrite signed URL hoặc gửi Identity token tới storage. `Up`/readiness200 chưa chứng minh mọi nghiệp vụ thành công.

## Test, screenshot và video

```powershell
flutter pub get
flutter analyze --no-pub
flutter test --no-pub
python -B tool/full_checks.py
```

Đã đạt 109 unit/widget test; test double không chứng minh Backend. Build debug thực tế có cả normal `lib/main.dart` và driver cùng BakeryApp/NativeTransport. Android tests có synthetic writes thật. Cần fixture/current-run và tài khoản local hợp lệ trong tệp private hiện hữu; không tự tạo Admin. Không chạy hai driver cùng emulator hoặc reset fixture để chạy lại.

```powershell
# Đã diễn tập, dùng đúng fixture deployment hiện tại:
python -B tool/full_run_ui.py review-fix
```

Driver dùng `test_driver/full_app.dart`, secure namespace synthetic riêng, không persona/demo/hidden grant. `--reuse-apk` chỉ dùng cache có source/origin/APK hash khớp; normal APK không dùng nhầm làm driver. Các stage `journey-a`, `remaining`, `extra`, `walkthrough` có mutation; đọc scenario/source trước khi chủ động chạy lại, không dùng làm startup hằng ngày.

Ảnh native: driver screenshot hoặc Python `subprocess.check_output([adb,'-s',serial,'exec-out','screencap','-p'])` rồi `Path.write_bytes`; tránh redirect text PowerShell làm hỏng PNG. [Evidence index](docs/full-integration/EVIDENCE_INDEX_VI.md) chứa hash, UTC, role, API và resource.

```powershell
python -B tool/full_record.py
python -B tool/full_media.py
```

Recording yêu cầu gate `PARTIAL_BLOCKED` đã lập và fixture hợp lệ, có synthetic RFQ/Offer/Chat mới. Đây là **partial diagnostic recording**, không phải full acceptance. Binary Android screenrecord v1.4 hiện tại hỗ trợ `--time-limit 0`; script xác minh help, theo dõi PID/file riêng, SIGINT, pull rồi chỉ xóa file tạm của nó. Không audio, không tắt emulator để dừng, không cắt bỏ lỗi rồi gọi pass. [Video/timestamp index](docs/full-integration/VIDEO_INDEX_VI.md) ghi nội dung đã quay, phần thiếu và kiểm tra giải mã.

## Restart và giới hạn

Mở lại app bằng `am force-stop`/`am start` giữ secure storage. Chạy launcher để phục hồi reverse sau emulator restart. Đã kiểm tra cold process restore Customer, logout rồi restart vẫn Guest bằng namespace kiểm thử riêng; không đọc namespace mặc định của người dùng.

Khi cần phục hồi đúng deployment Mobile, có thể `docker restart bakery-mobile-phase5-marketplace bakery-mobile-phase5-order bakery-mobile-phase5-chat`, rồi launcher `-PrepareOnly` đợi readiness. Đã diễn tập ba restart này và đọc lại cùng RFQ/Offer/Conversation; không restart DB hoặc đổi config/mount. Thoát Flutter khi kết thúc; chỉ stop container của mình khi không còn người dùng khác. Toàn bộ Docker/AVD shutdown **NOT_VERIFIED**, được giữ chạy để bàn giao. Không `down -v`, prune, Wipe Data, reset DB hoặc regenerate key.

[Blocker đã xác minh](docs/full-integration/BACKEND_BLOCKERS_AND_REQUIRED_CONTRACTS_VI.md): thiếu public address → Order/fulfillment/Review chưa E2E; Chat history403/SQL42P18, upload nhận tệp nhưng URL Docker-only; RFQ image storage lỗi; Cake AI không có container và source nguyên trạng không compile. Không mô phỏng địa chỉ, Order, thanh toán hay AI để vượt chặn.

Run `20261108T045031Z` giữ cả lần lỗi/sửa/chạy lại. `.dart_tool/`, `build/`, `*.log` đang bị ignore; báo cáo/media giữ trên đĩa, không tự thêm LFS/commit/push. Báo cáo cũ được bảo tồn như lịch sử. Máy kiểm tra: AVD `homemind_local_run`, serial `emulator-5554`, API36, 720×1280; đường dẫn tool cụ thể ở biên bản diễn tập.
