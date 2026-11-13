# Kịch bản test Marketplace + Cake AI + Firebase bằng Postman

Mục tiêu: customer tạo cake request, upload ảnh tham khảo lên Firebase, tạo mẫu bánh bằng AI,
đọc ảnh qua signed URL rồi chọn mẫu vào Marketplace. Luồng chính tạo **một ảnh Gemini thật**.

## 1. Chuẩn bị

Import file [Postman collection](postman/marketplace-cake-ai-firebase.postman_collection.json).
Mở collection → Variables, kiểm tra:

| Biến | Giá trị mẫu |
|---|---|
| `identity` | `http://localhost:8081` |
| `marketplace` | `http://localhost:8082` |
| `cakeAi` | `http://localhost:8085` |
| `email` | `manual-ai-customer-a@example.test` |
| `otherEmail` | `manual-ai-customer-b@example.test` |
| `password` | `DemoCake123!` — mật khẩu mẫu cho tài khoản test |

Các biến token/ID/URL để trống; script trong collection tự điền sau từng response.
Gửi thủ công từng request theo số thứ tự, đặc biệt bước upload file và polling.

Kiểm tra ba URL `/actuator/health/readiness` trên các port trên: phải trả HTTP 200,
`{"status":"UP"}`. Firebase project/bucket/service-account và Gemini key được cấu hình ở backend.
Trong Postman chỉ dùng JWT của Identity; không cần đưa Gemini key hoặc Firebase credential vào request.

Nếu cần khởi động lại stack từ thư mục gốc bằng PowerShell:

```powershell
$env:GEMINI_API_KEY = 'điền-key-trên-máy-của-bạn'
docker compose up -d identity-service marketplace-service cake-ai-service
docker compose ps
```

Root `.env` cần các DB/client credentials và Firebase configuration theo [hướng dẫn Cake AI](CAKE-AI.md).
Key ở lần test trước chỉ được truyền vào môi trường container; cần cung cấp lại khi recreate Cake AI.
Chuẩn bị một ảnh JPEG, PNG hoặc WebP dưới 10 MB trên máy.

## 2. Luồng chính — folder A

### 01–02. Đăng ký và đăng nhập customer A

`POST {{identity}}/api/v1/auth/register`, Body → raw → JSON:

```json
{
  "email": "{{email}}",
  "password": "{{password}}",
  "displayName": "Manual Cake AI Customer A"
}
```

Mong đợi **201**. Nếu email đã tồn tại, đổi biến email hoặc bỏ qua đăng ký và login bằng mật khẩu đã dùng.

`POST {{identity}}/api/v1/auth/login`:

```json
{
  "email": "{{email}}",
  "password": "{{password}}"
}
```

Mong đợi **200**; collection lưu `data.accessToken` vào `token`.
Các API Marketplace/Cake AI kế thừa Authorization → Bearer Token `{{token}}` từ collection.

### 03. Tạo yêu cầu bánh

`POST {{marketplace}}/api/v1/cake-requests`, Body → raw → JSON:

```json
{
  "requestType": "OPEN_CUSTOM",
  "title": "[MANUAL TEST] Bánh sinh nhật pastel",
  "description": "Bánh hai tầng, màu hồng pastel, hoa mẫu đơn.",
  "neededAt": "{{neededAt}}",
  "deliveryCity": "HCM",
  "deliveryDistrict": "D1"
}
```

Pre-request script tự đặt `neededAt` sau hiện tại 7 ngày và tạo `jobKey` mới.
Mong đợi **201**, `data.status=DRAFT`; tự lưu `data.id` vào `requestId`.
Giữ request ở DRAFT trong kịch bản này; chọn design không tự publish request.

### 04–05. Kiểm tra Firebase qua ảnh tham khảo Marketplace

`POST {{marketplace}}/api/v1/cake-requests/{{requestId}}/images`

Body → **form-data**:

| Key | Type | Value |
|---|---|---|
| `files` | File | Chọn ảnh trên máy |

Để Postman tự sinh header multipart và boundary. Mong đợi **201**, có `data[0].url`,
`expiresAt`, `mediaType`, `sizeBytes`. Collection tự lưu `referenceUrl`.

Gửi request 05 `GET {{referenceUrl}}`, Authorization → **No Auth**. Mong đợi **200** và thấy ảnh.
Để kiểm tra object private, mở bản sao URL và xóa toàn bộ từ dấu `?` trở đi: mong đợi **403**.

Có thể đối chiếu trên Firebase Console → Storage → prefix `marketplace/requests/{{requestId}}/`.
Signed URL có hiệu lực khoảng 15 phút; GET lại cake request để nhận URL mới nếu hết hạn.

### 06. Tạo job Cake AI

`POST {{cakeAi}}/api/v1/generation-jobs`

Headers: `Idempotency-Key: {{jobKey}}`; Authorization vẫn là Bearer `{{token}}`.

Body → **form-data**:

| Key | Type | Content-Type của part | Value |
|---|---|---|---|
| `metadata` | Text | **application/json** | JSON bên dưới |
| `sourceImages` | File | Postman tự xác định | Tùy chọn: tick bật và chọn ảnh tham khảo |

```json
{
  "cakeRequestId": "{{requestId}}",
  "prompt": "{{cakePrompt}}",
  "negativePrompt": "people, text, watermark",
  "generationParameters": {
    "aspectRatio": "1:1",
    "numberOfDesigns": 1
  }
}
```

Collection đã đặt Content-Type của part `metadata`. Nếu tự tạo request, bật cột Content-Type trong
form-data và đặt riêng part này thành `application/json`. Không đặt header chung thành `application/json`.

Ảnh đã upload ở Marketplace không tự được đưa vào job AI. Muốn test tạo ảnh từ reference,
bật `sourceImages` và chọn lại cùng file ở request 06. Cho phép tối đa 5 file, mỗi file 10 MB.

Mong đợi **202**, `data.status=QUEUED`; collection tự lưu `jobId` và acceptance response.

### 07. Theo dõi job và kiểm duyệt

`GET {{cakeAi}}/api/v1/generation-jobs/{{jobId}}`

Gửi lại khoảng mỗi 2–3 giây. Đây là polling, không gửi lại POST để hỏi tiến độ.

Mong đợi:

- `data.job.status`: QUEUED → PROCESSING → SUCCEEDED; có thể bỏ lỡ trạng thái trung gian khi polling.
- `data.generatedDesigns` có ảnh và `moderationStatus=APPROVED`.
- Có `imageUrl`, `thumbnailUrl`, `expiresAt`.
- Nếu có source image, `data.sourceImages` có URL sau khi input được duyệt.

Collection chỉ lưu `designId`, `imageUrl`, `thumbnailUrl` khi job SUCCEEDED và có design APPROVED.
Chỉ chuyển sang bước tiếp theo khi đáp ứng cả hai điều kiện này.
Nếu FAILED, đọc `data.job.errorMessage`. Nếu design PENDING/REJECTED, URL không được cấp và chưa được chọn.

### 08–09. Kiểm tra ảnh kết quả trên Firebase

Gửi `GET {{imageUrl}}` và `GET {{thumbnailUrl}}`, Authorization → **No Auth**.
Mong đợi **200**, hiển thị ảnh và thumbnail. Xem các object trong Firebase Console:

- `cake-ai/sources/{{jobId}}/` — chỉ có khi gửi sourceImages.
- `cake-ai/designs/{{jobId}}/`.
- `cake-ai/thumbnails/{{jobId}}/`.

Nếu URL hết hạn, gửi lại request 07 để lấy URL mới. URL có chữ ký cho phép đọc trong thời hạn mà không cần JWT.

### 10–11. Chọn mẫu AI vào Marketplace và đọc lại

`PUT {{marketplace}}/api/v1/cake-requests/{{requestId}}/selected-design`, Body → raw → JSON:

```json
{
  "generatedDesignId": "{{designId}}"
}
```

Mong đợi **200**, `data.selectedDesignId={{designId}}`.
Marketplace tự gọi Cake AI qua service JWT để kiểm tra owner, request, job status và moderation.

Gửi `GET {{marketplace}}/api/v1/cake-requests/{{requestId}}`.
Mong đợi **200**, `selectedDesignId` vẫn đúng design vừa chọn; request vẫn DRAFT.
Đến đây luồng Marketplace → Cake AI → Firebase → chọn design đã hoàn tất.

## 3. Các ca kiểm tra bổ sung — folder B

| Request | Thao tác | Mong đợi |
|---|---|---|
| 12 | Gửi lại POST tạo job với **cùng key, metadata và file như 06** | 202; cùng job ID và acceptance response; không tạo job mới |
| 13 | Giữ key cũ nhưng đổi prompt | 409 |
| 14 | GET job không có Bearer token | 401 |
| 15–16 | Đăng ký/login customer B | 201/200; lưu `otherToken` |
| 17 | B đọc job của A | 403 |
| 18 | B đọc design của A | 403 |
| 19 | A list job theo requestId | 200; chỉ danh sách job của A |

Nếu đã bật `sourceImages` ở request 06, bật và chọn đúng cùng file ở 12–13.
Giữ nguyên `jobKey` trong suốt test idempotency. Response replay vẫn có thể ghi QUEUED vì là
response lúc nhận lệnh; xem request 07 để biết trạng thái hiện tại.

Các ca thử thủ công khác:

| Thao tác | Mong đợi |
|---|---|
| Tạo job thiếu `Idempotency-Key` | 400 |
| `numberOfDesigns=5` hoặc `aspectRatio=16:9` | 422 |
| File text đổi đuôi thành `.jpg` | 422 từ Cake AI |
| Dùng design PENDING/REJECTED có thật để chọn vào request | 422 |
| Chọn design thuộc request khác | 422 |
| Gửi cancel khi job đã SUCCEEDED | 409 |

## 4. Tùy chọn: sửa prompt — folder C

Request 20 tạo **thêm một ảnh thật**; chỉ chạy nếu muốn kiểm tra refinement.
Chạy khi job đang SUCCEEDED/FAILED, dùng revision key riêng, rồi quay lại request 07 để polling.
Khi revision mới SUCCEEDED và có ảnh APPROVED, lặp lại 08–11 để chọn mẫu mới.
Ảnh revision cũ vẫn được lưu. Muốn tạo một revision khác nữa, đổi `revisionKey`.

## 5. Đọc lỗi thường gặp

- **401 ở public API:** token thiếu/hết hạn; login lại A ở request 02 để cập nhật token.
- **503 khi chọn design:** kiểm tra service credential của Marketplace và grant
  `cake-ai:design:validate`; BCrypt hash ở Identity phải khớp raw secret của Marketplace.
- **503 khi upload:** kiểm tra bucket, credential mount và IAM của Firebase service account.
- **INPUT_MODERATION_UNAVAILABLE:** job chưa qua được kiểm duyệt đầu vào; kiểm tra model/quota Gemini.
- **PROVIDER_RATE_LIMITED:** quota tạo ảnh của model không đủ; không liên tục gửi POST tạo job mới.
- **PENDING không có URL:** output chưa được duyệt; không tính luồng chọn mẫu là pass.

Tiêu chí pass chính: ảnh đọc được từ Firebase, job SUCCEEDED, design APPROVED và Marketplace đọc lại
đúng selectedDesignId. Báo cáo chạy thật trước đó ở [live smoke report](CAKE-AI-LIVE-SMOKE-2026-10-24.md).
