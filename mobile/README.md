# SweetCake Mobile — native local

Quy trình hiện tại dùng Windows native và root `.env` của repository. Backend chạy
Gateway `8080`; Identity/Bakery/Marketplace/Subscription/Cake AI/Order/Chat lần lượt
`8081–8087`. Cả Web và Android gọi API qua cùng Gateway và cùng dataset.

## Chuẩn bị và chạy

Cần JDK 21 64-bit, Maven, Python, PostgreSQL native, MinIO native, Node,
Flutter và Android SDK/AVD đã cài. Root `.env` phải có cấu hình hợp lệ; không sao chép
credential Development đè lên giá trị đang hoạt động. Xem `scripts/native_backend.py`,
`scripts/native_minio.py` và `scripts/native_clients.py --help`.

Từ thư mục gốc repository trong PowerShell:

```powershell
$NativeState = Join-Path $env:LOCALAPPDATA 'BakeryPlatform/native/20261114-003211-remediation'
$MinioState = Join-Path $env:LOCALAPPDATA 'BakeryPlatform/minio/20261114-003211-remediation'
$ClientEvidence = 'docs/mobile/runs/20261114-003211-remediation/evidence/native-clients'
python scripts/native_minio.py start --state-dir $MinioState
python scripts/native_backend.py build
python scripts/native_backend.py start --state-dir $NativeState --allow-existing-local-databases --firebase-sandbox
python scripts/native_clients.py verify --state-dir $ClientEvidence
python scripts/native_clients.py android-start --state-dir $ClientEvidence
python scripts/native_clients.py mobile-build --state-dir $ClientEvidence
python scripts/native_clients.py mobile-run --state-dir $ClientEvidence --device emulator-5554
```

Chỉ build khi các JAR cần thay thế đã dừng. `--firebase-sandbox` là opt-in cho
project nonproduction đã được chủ sở hữu cho phép; không dùng với credential không rõ
nguồn. `NATIVE_DATABASE_PREFIX` chọn bộ database local đã chuẩn bị, không reset dữ liệu.
MinIO từ chối nhận diện một listener lạ là instance của nó và không xoay secret hiện hữu.

`NATIVE_FLUTTER_EXE`, `NATIVE_ADB_EXE`, `NATIVE_ANDROID_AVD` và
`NATIVE_ANDROID_API_ORIGIN` nằm trong root `.env`. Launcher chỉ truyền các origin công
khai vào Dart defines; mọi service origin đều dùng Gateway `8080`. ADB reverse thêm
`8080`, `9000`, `9002` để truy cập Gateway và signed object URL đúng host/port.
Không sửa signed URL hoặc gửi JWT ứng dụng đến storage.

Entrypoint PowerShell tương đương:

```powershell
./mobile/tool/start_mobile.ps1 -DeviceId emulator-5554 -EvidenceDirectory $ClientEvidence
```

`-PrepareOnly` chỉ chuẩn bị emulator và reverse. Emulator mới dùng AVD đã cấu hình,
không wipe data. Script không đọc các bundle credential hay runtime cũ.

## Kiểm chứng và dừng

```powershell
python scripts/native_backend.py verify --state-dir $NativeState
Push-Location mobile
flutter analyze --no-pub
flutter test --no-pub
Pop-Location
python scripts/native_backend.py stop --state-dir $NativeState
python scripts/native_minio.py stop --state-dir $MinioState
```

`stop` chỉ tác động PID thuộc state directory đã chọn, giữ database/object/AVD.
Đóng Flutter bằng `q`; dừng Web bằng PID đã ghi trong client evidence khi không còn
người dùng khác. Chụp PNG Android bằng API binary `adb exec-out screencap -p`, tránh
PowerShell chuyển bytes thành text.

Cake AI mặc định tắt. Native launcher yêu cầu root `.env` đặt rõ admin review,
1 design/execution, tối đa 2 execution/customer/ngày và 6 provider call/ngày,
1 worker, token output tối đa 4096/1024 trước khi cho phép bật paid worker.
`CAKE_AI_MODE=unknown` là trạng thái hiển thị, không kết luận provider đã chạy.
Không coi readiness, mock/unit tests hoặc HTTP scripts là bằng chứng UI/end-to-end.

Các báo cáo trong `docs/cake-ai/`, `docs/full-integration/` và các launcher legacy còn
lại là lịch sử theo thời điểm của chúng. Chúng không mô tả topology/config hiện tại.
Bằng chứng mới nằm tại `../docs/mobile/runs/`; không suy ra PASS từ kết quả cũ.
