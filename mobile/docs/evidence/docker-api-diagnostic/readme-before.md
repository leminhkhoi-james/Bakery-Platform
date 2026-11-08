# SweetCake Mobile — Hướng dẫn chạy Android Emulator và kết nối Backend Docker (Local)

Tài liệu này **chỉ hướng dẫn cách khởi chạy Flutter Mobile trên máy ảo Android và kết nối tới các Backend Microservices đang chạy bằng Docker ở máy local**. Bao gồm cả cách xử lý khi ADB báo `device offline`.

> **Quan trọng:** Tên ổ đĩa, thư mục dự án, vị trí Android SDK, tên AVD, mã thiết bị và cổng Backend có thể **khác nhau ở mỗi máy**. Các giá trị của máy đã kiểm thử được ghi dưới đây chỉ là **ví dụ**, không được sao chép máy móc. Hãy dùng các lệnh kiểm tra để lấy giá trị thực tế trên máy của bạn.
>
> Tài liệu này dựa trên quy trình đã ghi nhận của Bakery Platform. Việc chạy thành công trên một máy **không chứng minh** rằng các script Backend đã hoạt động được trên một máy mới clone chưa có cấu hình/secrets/runtime.

## 1. Những thông tin nào phải thay theo máy?

| Thông tin | Ví dụ ở máy đã kiểm thử | Cách tìm giá trị **trên máy của bạn** |
|---|---|---|
| Thư mục repository | `H:\MSS\Bakery-Platform` | Nơi bạn clone dự án; chạy `Get-Location` tại thư mục gốc |
| Thư mục Flutter | `H:\MSS\Bakery-Platform\mobile` | Thư mục `mobile` bên trong repository |
| Android SDK | `D:\HomeMind\audit-tools\android-sdk` | `flutter doctor -v` → **Android SDK at ...**, hoặc `echo $env:ANDROID_HOME` |
| File Emulator | `D:\HomeMind\audit-tools\android-sdk\emulator\emulator.exe` | `where.exe emulator` |
| File ADB | `D:\HomeMind\audit-tools\android-sdk\platform-tools\adb.exe` | `where.exe adb` |
| **AVD ID** (tên cấu hình máy ảo) | `homemind_local_run` | `flutter emulators` |
| **Device ID** (mã thiết bị ADB) | `emulator-5554` | `adb devices -l` sau khi máy ảo xuất hiện |
| Runtime Backend bên ngoài repo | `H:\MSS\.runtime\bakery-mobile-phases-1-4` | Kiểm tra cấu hình runtime hiện có; không giả định mọi máy đều có đường dẫn này |
| Identity / Bakery / Subscription / Storage ports | `18101` / `18102` / `18104` / `19022` | Xem `docker ps`, Compose runtime và cấu hình Mobile hiện tại |

**Phân biệt AVD ID và Device ID:** `homemind_local_run` dùng để **khởi chạy** cấu hình máy ảo; `emulator-5554` là **serial ADB** dùng để gửi lệnh tới máy ảo sau khi khởi chạy. Hai giá trị này **không phải cùng một thứ**. Device ID có thể đổi sang `emulator-5556`, v.v.

> **Lưu ý PowerShell:** Các biến như `$avdId`, `$deviceId`, `$repoRoot` và `$identityPort` chỉ tồn tại trong **cửa sổ PowerShell đã khai báo chúng**. Nếu mở terminal mới, hãy khai báo lại theo các bước bên dưới trước khi dùng.

## 2. Kiểm tra công cụ và tìm Android SDK thật

Mở **PowerShell** tại thư mục `mobile` của dự án và chạy:

```powershell
flutter doctor -v
flutter emulators
where.exe adb
where.exe emulator
adb devices -l
```

- Đọc dòng `Android SDK at ...` trong `flutter doctor -v`. Nếu khác đường dẫn ví dụ, **dùng đường dẫn trên máy của bạn**.
- `where.exe emulator` sẽ chỉ ra nơi có `emulator.exe`. Nếu không trả kết quả, kiểm tra đường dẫn `<ANDROID_SDK_CỦA_BẠN>\emulator\emulator.exe`.
- `flutter emulators` liệt kê **AVD ID** để khởi chạy.
- `adb devices -l` liệt kê **Device ID** cùng trạng thái `device`, `offline` hoặc không có thiết bị.

Ví dụ PowerShell lấy `emulator.exe` từ PATH:

```powershell
$emulatorExe = (Get-Command emulator -ErrorAction Stop).Source
Test-Path $emulatorExe   # Phải là True
```

Nếu `Get-Command emulator` không tìm thấy nhưng `flutter doctor -v` đã chỉ rõ SDK, dùng đường dẫn SDK thật:

```powershell
# THAY bằng Android SDK được flutter doctor -v báo trên máy của bạn.
$sdkRoot = 'D:\HomeMind\audit-tools\android-sdk'
$emulatorExe = Join-Path $sdkRoot 'emulator\emulator.exe'
Test-Path $emulatorExe   # Phải là True
```

Lệnh `Test-Path` trả `False` chỉ có nghĩa là **đường dẫn vừa kiểm tra không tồn tại**; không tự động kết luận Emulator chưa được cài.

## 3. Khởi chạy máy ảo và xử lý `device offline`

### 3.1. Chọn đúng AVD

```powershell
flutter emulators
```

Đặt **đúng AVD ID** lấy từ kết quả (dưới đây là ví dụ):

```powershell
$avdId = 'homemind_local_run'   # THAY bằng ID từ flutter emulators
```

Nếu AVD chưa chạy và ADB chưa có máy ảo này, có thể khởi chạy bình thường:

```powershell
flutter emulators --launch $avdId
```

Mở terminal khác và kiểm tra:

```powershell
adb devices -l
```

Khi serial xuất hiện, đặt **Device ID thực tế** (ví dụ):

```powershell
$deviceId = 'emulator-5554'   # THAY bằng serial thực tế từ adb devices -l
adb -s $deviceId shell getprop sys.boot_completed
```

Chỉ được coi là Android khởi động xong khi:

- `adb devices -l` hiện trạng thái **`device`** (không phải `offline`);
- `getprop sys.boot_completed` trả về **`1`**.

Nếu thiết bị vẫn `offline`, **không chạy `adb reverse` hoặc `flutter run` vội**. Chuyển sang mục 3.2.

### 3.2. Nếu máy ảo báo `offline` (đúng quy trình xử lý)

**Bước A — Thử kết nối lại ADB một lần:**

```powershell
adb kill-server
adb start-server
adb devices -l
```

Nếu vẫn hiển thị `offline`, đừng lặp đi lặp lại lệnh restart ADB.

**Bước B — Đóng đúng máy ảo bị lỗi:**

- Trong **Android Studio → Device Manager**, tìm đúng AVD và chọn **Stop**; hoặc đóng cửa sổ Emulator tương ứng.
- Nếu cần xác minh tiến trình trên Windows:

```powershell
Get-Process emulator, qemu-system-x86_64 -ErrorAction SilentlyContinue
```

Chỉ kết thúc tiến trình thủ công nếu đã xác nhận nó thuộc **đúng máy ảo cần tắt**. Không dùng lệnh kill tất cả emulator nếu máy đang chạy AVD khác.

**Bước C — Cold Boot, bỏ qua snapshot cũ nhưng không xóa dữ liệu AVD:**

Kiểm tra `$emulatorExe` đã trỏ tới file thật (`Test-Path $emulatorExe` phải trả `True`), và `$avdId` đúng tên máy ảo:

```powershell
Start-Process -FilePath $emulatorExe -ArgumentList @('-avd', $avdId, '-no-snapshot-load')
```

Hoặc qua GUI: **Android Studio → Device Manager → menu của AVD → Cold Boot Now**.

> `-no-snapshot-load` không tải snapshot khởi động cũ. **Không dùng Wipe Data, xóa AVD hoặc cài lại Android SDK** ở bước này. Đừng chạy thêm `flutter emulators --launch` khi Cold Boot đang mở cùng AVD.

**Bước D — Kiểm tra lại trên terminal mới:**

```powershell
adb devices -l
# THAY bằng serial được adb trả ra, nếu khác ví dụ.
$deviceId = 'emulator-5554'
adb -s $deviceId shell getprop sys.boot_completed
```

Kết quả mong muốn:

```text
List of devices attached
emulator-5554    device

1
```

Nếu vẫn `offline` sau Cold Boot, tiếp tục chẩn đoán thay vì xóa dữ liệu:

```powershell
where.exe adb
where.exe emulator
& $emulatorExe -accel-check
```

Kiểm tra cửa sổ máy ảo có hiện màn hình Android, đứng ở logo hay màn hình đen; kiểm tra log/virtualization và bảo đảm không có nhiều bản ADB khác nhau trên PATH. Có thể chạy Emulator ở chế độ `-verbose` để thu thập log sau khi đóng AVD hiện tại. **Chưa nên xử lý Docker hay Flutter khi ADB còn offline.**

## 4. Khởi chạy Backend Docker local

### 4.1. Kiểm tra Docker

Từ **thư mục gốc repository** (thay đường dẫn cho máy bạn):

```powershell
# Ví dụ: THAY theo thư mục clone trên máy của bạn.
$repoRoot = 'H:\MSS\Bakery-Platform'
Set-Location $repoRoot

docker info
docker ps
```

Nếu `docker info` thất bại, khởi động Docker Desktop/Engine trước. Không xóa container/volume, không dùng `docker compose down -v`, `docker system prune` hoặc tự đặt lại mật khẩu của database hiện hữu.

### 4.2. Runtime đã được chuẩn bị của Bakery Platform

README gốc ghi nhận quy trình runtime local bằng các script sau. **Chỉ chạy trực tiếp nếu máy của bạn có các Docker prerequisites, external secrets và runtime tương thích**. Đường dẫn `.runtime` hoặc container Identity ở máy cũ **không tự có trên một máy mới clone**.

```powershell
Set-Location $repoRoot

# Kiểm tra các container hiện có trước khi thao tác.
docker ps -a --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'

# Ví dụ container Identity DB của môi trường đã kiểm thử:
# docker start bakery-local-identity-db-1
# CHỈ dùng khi đúng container này thực sự tồn tại trên máy của bạn.

# Cần môi trường Python, Maven/Java cache và external secrets như runtime đã thiết lập.
# Chỉ chuẩn bị JAR nếu bộ runtime chưa có JAR hợp lệ.
# python -B mobile/tool/prepare_runtime_sources.py

python -B mobile/tool/recreate_runtime_h.py
python -B mobile/tool/runtime_preflight.py
python -B mobile/tool/verify_backend_contracts.py
```

**Quan trọng:** Các script trên có thể tham chiếu runtime hoặc secrets theo cấu hình riêng của máy đã audit. Trước khi chạy trên máy khác, đọc script và xác minh đường dẫn, project name, volume/database, nguồn secrets và quyền truy cập. Không tự suy đoán hay tạo secrets để thay thế dữ liệu hiện có.

Nếu môi trường của bạn đang sử dụng Compose khác, hãy khởi động bằng **lệnh Compose đã được dự án xác minh**, không ghép tùy ý tất cả file `compose*.yaml`.

### 4.3. Xác nhận các cổng Backend thật

Theo runtime Mobile đã được báo cáo, các cổng **ví dụ** là:

| Thành phần | Cổng host ví dụ | Cách kiểm tra |
|---|---:|---|
| Identity | `18101` | `docker ps`, runtime Compose và API readiness |
| Bakery | `18102` | `docker ps`, runtime Compose và API readiness |
| Subscription | `18104` | `docker ps`, runtime Compose và API readiness |
| MinIO (ảnh/chứng từ) | `19022` | `docker ps`, runtime Compose và truy cập ảnh |

Đặt biến theo đúng cổng được publish trên **máy của bạn**:

```powershell
$identityPort     = 18101   # THAY nếu Docker publish cổng khác
$bakeryPort       = 18102   # THAY nếu Docker publish cổng khác
$subscriptionPort = 18104   # THAY nếu Docker publish cổng khác
$storagePort      = 19022   # THAY nếu Docker publish cổng khác

$ports = @($identityPort, $bakeryPort, $subscriptionPort, $storagePort)
foreach ($port in $ports) {
    Test-NetConnection 127.0.0.1 -Port $port -InformationLevel Quiet |
        ForEach-Object { "localhost:$port => $_" }
}
```

Kết quả `True` chỉ chứng minh cổng TCP có thể kết nối từ host, **không đủ chứng minh API đã sẵn sàng**. Dùng script `runtime_preflight.py` và một endpoint public hợp lệ để xác nhận API nghiệp vụ. Nếu cổng khác, cấu hình Mobile ở mục 6 cũng phải đổi tương ứng.

## 5. Kết nối Emulator ↔ Docker bằng `adb reverse`

Điều kiện tiên quyết:

1. Android ADB đang là `device`, `sys.boot_completed = 1`.
2. Backend đã chạy và host truy cập được các cổng cần thiết.
3. `$deviceId` và các biến `$...Port` ở trên khớp máy hiện tại.

Trong **cùng một cửa sổ PowerShell** đã đặt các biến này:

```powershell
foreach ($port in $ports) {
    adb -s $deviceId reverse "tcp:$port" "tcp:$port"
}

adb -s $deviceId reverse --list
```

Kết quả phải chứa bốn port mapping tương ứng. Nếu trả `device offline`, quay lại mục 3; nếu host API không hoạt động, quay lại mục 4.

`adb reverse` cho phép địa chỉ `127.0.0.1:<PORT>` bên trong emulator trỏ về cổng tương ứng trên máy host. **Không dùng hostname chỉ tồn tại trong Docker network** (như tên container) làm URL Mobile.

Bạn cần thiết lập lại `adb reverse` khi emulator hoặc ADB restart. Đối với URL ảnh/chứng từ có chữ ký, không tự ý thay hostname bên trong signed URL; hãy giữ cơ chế mạng đúng với URL do Backend trả về.

## 6. Chạy Flutter Mobile trên máy ảo Android

Mở terminal tại `mobile/` (thay repository path theo máy):

```powershell
Set-Location (Join-Path $repoRoot 'mobile')
flutter devices
flutter pub get
```

Chạy nếu Mobile debug đã được cấu hình sẵn để dùng các port ví dụ (theo README trước đây):

```powershell
flutter run -d $deviceId
```

**Nếu cổng/URL Backend của máy bạn khác**, truyền các URL thật theo cấu hình Flutter đang hỗ trợ:

```powershell
flutter run -d $deviceId `
  --dart-define="IDENTITY_URL=http://127.0.0.1:$identityPort" `
  --dart-define="BAKERY_URL=http://127.0.0.1:$bakeryPort" `
  --dart-define="SUBSCRIPTION_URL=http://127.0.0.1:$subscriptionPort"
```

Chỉ dùng các `--dart-define` trên nếu Mobile hiện tại vẫn hỗ trợ đúng các tên biến đó (kiểm tra code/config của Mobile). **Không đưa mật khẩu, JWT, client secret hoặc credentials vào `--dart-define`**.

Kiểm tra trực tiếp trong ứng dụng:

- Trang danh sách **tiệm/bánh** phải hiển thị dữ liệu thật từ Bakery API.
- Trang **Subscription Plans** phải hiển thị gói từ Backend, không tự lấy fixture khi lỗi.
- Luồng đăng nhập phải sử dụng **Identity API** thật khi có tài khoản local hợp lệ.
- Ảnh sản phẩm cần tải được qua cấu hình Storage phù hợp.
- Khi mất kết nối, giao diện phải báo lỗi/Retry, **không hiện dữ liệu mock giả thành công**.

Không cần chạy Web Frontend để Flutter truyền request đến Backend; Web chỉ cần thiết khi muốn đối chiếu giao diện/dữ liệu riêng.

## 7. Chạy máy ảo bằng Android Studio (thay cho lệnh CLI)

1. Mở **Android Studio → Device Manager**.
2. Chọn AVD đã có trên máy bạn (**không nhất thiết là** `homemind_local_run`).
3. Nếu AVD đang treo/offline, chọn **Stop → Cold Boot Now**.
4. Kiểm tra `adb devices -l` cho trạng thái `device`, sau đó kiểm tra `sys.boot_completed = 1`.
5. Thiết lập lại `adb reverse` như mục 5.
6. Mở **đúng thư mục `mobile/`** bằng Android Studio, chọn Flutter SDK đã cài trên máy và chọn thiết bị vừa boot.
7. Chạy `lib/main.dart`. Nếu cần đổi URL theo port riêng, cấu hình **Additional run args** với các `--dart-define` tương ứng.

Quy trình Android Studio GUI trong báo cáo trước chưa được kiểm thử trực tiếp; hướng dẫn CLI là luồng đã có bằng chứng chạy trên máy audit.

## 8. Lỗi thường gặp

| Hiện tượng | Nguyên nhân cần kiểm tra | Cách xử lý an toàn |
|---|---|---|
| `Test-Path $emulatorExe` = `False` | Dùng nhầm Android SDK path | Chạy `flutter doctor -v`, `where.exe emulator`; thay bằng đường dẫn thật |
| `emulator-5554 offline` | Android chưa boot, ADB/snapshot lỗi | Mục 3: restart ADB một lần → Stop đúng AVD → Cold Boot |
| `sys.boot_completed` không trả `1` | Android chưa sẵn sàng | Chưa reverse/run Flutter; kiểm tra màn hình/log Emulator |
| `adb reverse` thất bại | Device offline hoặc chọn sai Device ID | Lấy serial mới bằng `adb devices -l` |
| `flutter run` không thấy Android | Device chưa `device` hoặc SDK/Flutter config sai | `flutter devices`, `flutter doctor -v` |
| Mobile không gọi được API | Docker chưa ready, host port khác hoặc thiếu reverse | Kiểm `docker ps`, preflight, host-port, reverse, URL Mobile |
| API 401/403 | Session/role/membership không hợp lệ | Đăng nhập lại, kiểm quyền thực; không sửa JWT hay dữ liệu trực tiếp |
| Hình ảnh không hiển thị | Cổng MinIO chưa reverse hoặc signed URL hết hạn | Kiểm storage port, refetch URL mới; không thay URL bừa bãi |
| Flutter doctor báo thiếu Visual Studio | Thiếu công cụ build **Windows desktop** | Không cần cài Visual Studio chỉ để chạy Android Emulator |
| Flutter doctor báo Android licenses | License SDK chưa chấp nhận | Chỉ thực hiện quy trình license chính thức khi được quyền/đồng ý; đây không tự động là nguyên nhân ADB offline |

**Giới hạn:** Tài liệu không thay thế quy trình cài mới toàn bộ Backend trên máy trống. Các scripts/runtime/secrets ngoài repository phải được cấu hình hợp lệ theo môi trường local tương ứng. Không tự nhận rằng môi trường mới clone có thể chạy chỉ bằng các lệnh đã kiểm thử trên máy cũ.
