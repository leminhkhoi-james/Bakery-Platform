# SweetCake Mobile — chạy Android với Backend Docker local

Hướng dẫn này khởi động **deployment đã có**, đợi API sẵn sàng, đợi Android boot, thiết lập `adb reverse` rồi chạy Flutter bằng đúng public origins. Không cần Web để Mobile gọi API. Không tạo lại database, credential, Compose hoặc secrets.

## 1. Kiểm tra công cụ và vị trí dự án

Mở PowerShell tại thư mục `mobile` của bản clone đang dùng:

```powershell
Get-Location
Test-Path pubspec.yaml
Get-Command python, flutter, adb, emulator | Select-Object Name,Source
flutter --version
flutter doctor -v
flutter emulators
adb devices -l
docker info --format '{{.ServerVersion}}'
docker compose ls --all
```

`Test-Path` phải True. Các công cụ cần có: Python 3, Flutter/Dart, JDK/Android SDK tương thích, Docker Engine/Desktop. Không tự nâng Flutter/channel/plugin theo cảnh báo. Cảnh báo thiếu Visual Studio là cho Windows desktop; không phải nguyên nhân Android không gọi được API.

Thông số **máy đã kiểm tra**, không phải cấu hình chung:

| Thông số | Ví dụ thực tế | Cách tìm trên máy khác |
|---|---|---|
| Repository | `H:\MSS\Bakery-Platform` | Nơi clone / `Get-Location` |
| Android SDK | `D:\HomeMind\audit-tools\android-sdk` | `flutter doctor -v` |
| ADB / Emulator | Dưới SDK trên | `Get-Command adb,emulator` |
| AVD ID | `homemind_local_run` | `emulator -list-avds` / `flutter emulators` |
| Device serial | `emulator-5554` | `adb devices -l` sau khi boot |
| Runtime có sẵn | `H:\MSS\.runtime\bakery-mobile-phases-1-4` | `compose.json` và labels của deployment local đã chuẩn bị |
| Project Docker | `bakery-mobile-20261107` | `docker compose ls --all` |
| Identity/Bakery/Subscription/MinIO host ports | `18101/18102/18104/19022` | `docker port` / container PortBindings, không đoán theo số cũ |

AVD ID là tên cấu hình dùng để launch; device serial là mã dùng với `adb -s`. Hai giá trị khác nhau. Biến PowerShell chỉ tồn tại trong terminal đã khai báo.

## 2. Quy trình chính đã kiểm chứng

Chạy từ `mobile` trong **PowerShell mới**:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\tool\start_mobile.ps1
```

Lệnh này:

1. Kiểm tra daemon, tìm project qua label của `compose.json` có sẵn.
2. Dùng container environment và Docker network alias để tìm Identity DB thật.
3. Start các DB/MinIO bị dừng; đợi DB healthy; start Identity/Bakery/Subscription bị dừng.
4. Đợi OpenAPI Identity, public products/plans và MinIO readiness trả HTTP 200. Lỗi readiness trả exit code khác 0, **không chạy Flutter tiếp**.
5. Dùng ADB của SDK đang có trên PATH; reuse emulator online hoặc launch AVD duy nhất đã cài. Nếu có nhiều AVD/device, yêu cầu chọn bằng tham số.
6. Đợi `sys.boot_completed=1`, `init.svc.bootanim=stopped`; reverse các cổng đọc từ container metadata.
7. `flutter pub get`, rồi `flutter run --debug` với `IDENTITY_URL`, `BAKERY_URL`, `SUBSCRIPTION_URL` đúng cổng đã xác minh. Không truyền credential qua dart-define.

Nếu cần chọn rõ (các giá trị sau chỉ là **ví dụ của máy kiểm tra**):

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\tool\start_mobile.ps1 `
  -RuntimeDirectory 'H:\MSS\.runtime\bakery-mobile-phases-1-4' `
  -DeviceId 'emulator-5554' -AvdId 'homemind_local_run'
```

`-PrepareOnly` dừng sau readiness/boot/reverse. `-NoResident` mở app rồi trả terminal, đã dùng trong diễn tập tự động. `-ExecutionPolicy Bypass` chỉ áp dụng process PowerShell mới, không sửa policy toàn máy.

## 3. Backend startup riêng và các prerequisite

```powershell
python -B tool/start_local_runtime.py
```

Script mặc định tìm `.runtime/bakery-mobile-phases-1-4` cạnh repository. Có thể chọn deployment có sẵn:

```powershell
python -B tool/start_local_runtime.py --runtime 'H:\MSS\.runtime\bakery-mobile-phases-1-4' --project bakery-mobile-20261107
```

Script dùng **`docker start` cho container hiện hữu**, không build/recreate. Nó không sửa external config/secrets/ACL và không thay password PostgreSQL. Cần còn nguyên container/network/volume, mounted JAR/config/PEM và Identity DB của deployment đã chuẩn bị. Source copy runtime được so với 266 tệp source của ba service. Nếu thiếu hoặc khác source, dừng và báo blocker; đây không phải hướng dẫn bootstrap máy mới clone.

Không dùng `recreate_runtime_h.py` làm lệnh restart thường ngày: script bootstrap cũ có thể ghi external runtime/ACL, cần container mẫu/JAR/cache, và gọi Compose interpolation trên credential đã có. Không chạy `docker compose config` in toàn bộ env/secret. Raw Compose và environment container có thể khác nhau; script mới chỉ báo **tên biến** khác, không in giá trị.

Khi Docker chưa chạy, mở Docker Desktop đã cài rồi đợi `docker info` đạt. Nhánh mở Desktop khi daemon dừng **chưa được diễn tập trong lần debug này**, vì daemon đã chạy. Không dùng prune, `down -v`, reset PostgreSQL hoặc tạo password mới để thử sửa lỗi.

Đầu ra an toàn và lịch sử readiness ở `docs/evidence/docker-api-diagnostic/runtime-start*.json`; `PASS` cần cả API nghiệp vụ HTTP 200, không chỉ container `Up`. Ba app hiện không có Docker healthcheck thích hợp, nên dùng readiness HTTP; DB có `pg_isready`.

## 4. Kiểm tra SDK, boot và mạng thủ công

Các lệnh sau giúp xác định đúng đường dẫn, không hardcode ổ D:

```powershell
$adbExe = (Get-Command adb).Source
$sdkRoot = Split-Path (Split-Path $adbExe -Parent) -Parent
$emulatorExe = Join-Path $sdkRoot 'emulator\emulator.exe'
& $emulatorExe -list-avds
adb devices -l
```

Sau khi chọn serial thật (ví dụ dưới đây):

```powershell
$deviceId = 'emulator-5554' # THAY bằng serial đang online
adb -s $deviceId shell getprop sys.boot_completed
adb -s $deviceId shell getprop init.svc.bootanim
adb -s $deviceId reverse --list
```

Phải là `1` và `stopped` trước khi install/chạy Flutter. Startup script tự lấy host ports từ metadata và apply reverse, thay vì dùng cổng mặc định chưa kiểm tra. `127.0.0.1` trong emulator chỉ tới host khi reverse tương ứng còn tồn tại. ADB/emulator restart có thể làm mất mapping; chạy lại `start_mobile.ps1 -PrepareOnly`.

Signed image/proof URL phải giữ hostname/port do Backend ký. Reverse cả storage port; không sửa hostname trong URL, không đưa Docker DNS vào app. Debug cho HTTP loopback/10.0.2.2; release cần public HTTPS origins, không tắt TLS validation.

Nếu ADB offline: kiểm tra đang dùng đúng một ADB từ SDK; đợi Android boot, kiểm tra emulator logs/virtualization. Không launch trùng AVD. Khi cần Cold Boot, đóng AVD đang treo rồi launch đúng AVD với `-no-snapshot-load`, **không `-wipe-data`**. Nhánh khôi phục offline/Cold Boot này là hướng dẫn xử lý, **chưa tái hiện trong lần debug**; AVD hiện đã online khi normal launch. Android Studio Device Manager → Stop/Cold Boot Now/Run cũng **chưa trực tiếp xác minh GUI**.

## 5. Xác nhận trên ứng dụng

Home gọi `GET /api/v1/products`, không cần login. Sau startup phải thấy dữ liệu thật hoặc empty thành công; lỗi kết nối khác empty. Mở Bánh/Tiệm/chi tiết/Public Plans; kiểm ảnh storage. Không có fallback mock khi API lỗi.

Đăng ký bằng **tài khoản synthetic mới** với email local test như `...@audit.invalid`, mật khẩu tự chọn chỉ dùng local, tên hiển thị; phone là tùy chọn. Không chụp/lưu password vào báo cáo. UI phải báo tạo tài khoản thành công, chuyển login, login và `/me` trả đúng user.

- Kết nối chưa gửi được request: thông báo kiểm tra Backend/emulator, nút cho phép thử lại bằng thao tác người dùng; không tự retry POST.
- Timeout/mất phản hồi sau gửi: **không đăng ký lại ngay**. Chọn **Kiểm tra tài khoản bằng đăng nhập**; email được giữ, mật khẩu phải nhập lại. Login/me xác nhận tài khoản đã tồn tại. Login chưa được không chứng minh account chưa tạo nếu mạng vẫn lỗi hoặc password sai.
- Email trùng 409: kết quả từ chối đã biết, có đường đăng nhập để kiểm tra.
- Sau login, các form credential cũ được loại khỏi navigation stack. Logout xóa phiên local và gửi revoke tới Identity theo contract.

Không dùng account thật trong automation. Lần đăng ký thật trước đây trong screenshot của người dùng chưa được truy vấn bằng credential thật; không tự gửi lại tài khoản đó để “thử”.

Diễn tập ngày 07–08/11/2026 đã chạy entrypoint trên từ PowerShell mới và mở đúng `lib/main.dart`: Home/Explore có sản phẩm thật; đăng ký synthetic → login → hồ sơ Customer → force-stop/mở lại vẫn khôi phục phiên → logout được server xác nhận. Kết quả và ảnh nằm trong báo cáo bên dưới. Số API mới được xác minh tách riêng: 55/55 qua HTTP, 20/55 qua UI Android; không dùng số UI lịch sử thay bằng chứng hiện tại.

## 6. Restart, lỗi thường gặp và kiểm thử

Restart môi trường thường ngày: chạy lại quy trình chính. Container đang chạy được reuse; container dừng được start đúng dependency. Không cần chạy Web, Maven hoặc npm trong source Backend/Frontend.

| Hiện tượng | Kiểm tra / xử lý |
|---|---|
| Home “Chưa tải được dữ liệu” | Host readiness trước, rồi device online/boot/reverse/origins. Retry sau khi khắc phục |
| Host gọi được nhưng Flutter không gọi được | Kiểm tra serial và reverse; kết nối TCP cũ có thể còn sống, cần kiểm tra bằng request mới sau app restart |
| Nút đăng ký khóa vì chưa rõ kết quả | Dùng đường đăng nhập để đối chiếu; không đổi key/tự POST lặp |
| HTTP 400/409 | Input/duplicate theo contract, không phải lỗi ADB |
| HTTP 401/403 | Session/role/membership; không gán quyền local |
| 5xx/response không đúng JSON | Ghi status/kind an toàn, đối chiếu trạng thái trước retry mutation |
| Ảnh lỗi | Storage readiness + reverse + refetch URL hết hạn; không thay bằng fixture |
| Runtime/secret/JAR/container thiếu | Dừng; cần quy trình bootstrap riêng. Không tự sinh credential hoặc reset volume |

```powershell
python -B tool/check_diagnostic.py pub-get format analyze test build
```

Live diagnostic harness dùng memory session riêng; khi kiểm tra cold restart dùng namespace secure storage synthetic riêng. Wrapper hiện truyền `--keep-app-running` vì Flutter drive mặc định gỡ APK khi kết thúc; các lượt đầu trước khi phát hiện đã có tác dụng phụ đó, nên không khẳng định app data cũ được giữ nguyên. Không có thao tác reset/xóa dữ liệu Backend. Evidence không chứa request body/password/token/signed URL. Kết quả mới và giới hạn từng lớp xem [báo cáo chẩn đoán](docs/BAKERY_MOBILE_DOCKER_API_CONNECTION_DIAGNOSTIC_VI.md). Lịch sử tích hợp cũ được giữ nguyên, không dùng 55/55 cũ thay kết quả debug hiện tại.
