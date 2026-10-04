# API Specification

> Contract API mục tiêu cho MSS Bakery Platform MVP. Cập nhật file này mỗi khi
> endpoint, DTO, validation, authorization hoặc business invariant thay đổi.
>
> **Implementation status:** đây là đặc tả thiết kế; repository hiện chưa
> scaffold các microservice và endpoint bên dưới.

---

## Base URL

```text
Development: http://localhost:8080/api/v1
Production:  https://<production-domain>/api/v1
Internal:    http://<service-name>:<port>/internal/v1
```

Public URL đi qua API Gateway và không để lộ tên microservice. Internal URL chỉ
được gọi trong trusted network bằng service JWT.

---

## Authentication

Mọi endpoint yêu cầu header dưới đây, trừ endpoint được đánh dấu **Public**:

```http
Authorization: Bearer <accessToken>
```

Access token có hạn 15 phút và chứa tối thiểu:

```json
{
  "sub": "4ccca4ab-50a8-4d37-9a25-d95450f7b77f",
  "email": "customer@example.com",
  "roles": ["CUSTOMER"],
  "iat": 1790848800,
  "exp": 1790849700
}
```

Refresh token có hạn 7 ngày, chỉ được truyền bằng cookie:

```http
Set-Cookie: refresh_token=<opaque-token>; HttpOnly; Secure; SameSite=Lax;
            Path=/api/v1/auth; Max-Age=604800
```

Platform roles:

| Role | Phạm vi |
|---|---|
| `CUSTOMER` | Profile, cake request, order, review, chat, Cake AI |
| `BAKERY_OWNER` | Tạo/quản lý bakery, subscription và toàn bộ bakery resources |
| `BAKERY_STAFF` | Thao tác bakery theo membership role |
| `ADMIN` | Duyệt bakery/payment và quản trị nền tảng |

Bakery membership roles `OWNER`, `MANAGER`, `STAFF` được Bakery Service kiểm
tra bổ sung; chúng không thay thế platform roles.

---

## Common Contract

### Standard Response

Mọi public response có body dùng `ApiResponse<T>`; response `204 No Content`
không có body:

```json
{
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "timestamp": "2026-10-01T09:00:00Z"
}
```

Response danh sách dùng:

```json
{
  "statusCode": 200,
  "message": "Success",
  "data": {
    "meta": {
      "page": 1,
      "pageSize": 20,
      "pages": 3,
      "total": 42
    },
    "result": []
  },
  "timestamp": "2026-10-01T09:00:00Z"
}
```

### Common Query Parameters

| Parameter | Type | Default | Validation |
|---|---|---:|---|
| `page` | integer | `1` | Tối thiểu `1` |
| `size` | integer | `20` | Từ `1` đến `100` |
| `sort` | string | Theo resource | `<allowedField>,asc|desc` |

Không chấp nhận sort field nằm ngoài allow-list của endpoint.

### Common Headers

| Header | Khi nào | Mục đích |
|---|---|---|
| `Authorization` | Protected endpoint | Access token của user/service |
| `Idempotency-Key` | Endpoint được đánh dấu | UUID do caller sinh; cùng key + payload trả cùng kết quả |
| `X-Correlation-Id` | Optional public, required internal | UUID theo dõi request xuyên service |
| `Content-Type: multipart/form-data` | Upload | Gửi metadata và file theo đúng parts được mô tả |

### Data Conventions

- ID là UUID; timestamp là ISO-8601 UTC; ngày là `YYYY-MM-DD`.
- Tiền là JSON decimal, không dùng floating-point để tính toán; currency MVP là
  `VND`.
- Signed URL chỉ có hiệu lực 15 phút. API không trả internal object key.
- Image thường: JPEG/PNG/WebP, tối đa 5 MB/file.
- Cake reference/AI source/payment proof: JPEG/PNG/WebP hoặc PDF khi được ghi
  rõ, tối đa 10 MB/file.
- Chat attachment: JPEG/PNG/WebP/PDF, tối đa 10 MB/file.
- Audit/status history là read-only; không có public CRUD trực tiếp.

### Common Errors

| Status | Khi nào |
|---:|---|
| `400` | JSON/query/header sai định dạng hoặc validation thất bại |
| `401` | Thiếu, hết hạn hoặc không hợp lệ token |
| `403` | Đúng danh tính nhưng thiếu role, membership hoặc ownership |
| `404` | Resource không tồn tại hoặc caller không được phép biết resource tồn tại |
| `409` | Unique conflict, optimistic-lock conflict hoặc transition không hợp lệ |
| `422` | Request đúng cú pháp nhưng vi phạm business invariant |
| `503` | Remote service bắt buộc hoặc object/AI provider không khả dụng |

---

## 1. Authentication and Profile — Identity Service

### POST /auth/register — Public

Đăng ký tài khoản customer.

**Request Body:**

```json
{
  "email": "customer@example.com",
  "password": "StrongPass123!",
  "displayName": "Nguyen Van A",
  "phoneNumber": "+84901234567"
}
```

**Validation:** email hợp lệ và tối đa 320 ký tự; password 8–100 ký tự;
`displayName` 1–120 ký tự; phone tối đa 30 ký tự.

**Success Response (201):** `data` là `UserProfileResponse` với `id`, `email`,
`displayName`, `phoneNumber`, `status`, `emailVerified`, `roles`, `createdAt`.

**Specific Errors:** `409` khi email đã tồn tại.

### POST /auth/login — Public

**Request Body:**

```json
{
  "email": "customer@example.com",
  "password": "StrongPass123!"
}
```

**Success Response (200):**

```json
{
  "statusCode": 200,
  "message": "Login successful",
  "data": {
    "accessToken": "eyJ...",
    "tokenType": "Bearer",
    "expiresIn": 900
  },
  "timestamp": "2026-10-01T09:00:00Z"
}
```

Response đồng thời set cookie `refresh_token`. **Specific Errors:** `401` khi
credential sai; `403` khi user `BLOCKED` hoặc `DELETED`.

### POST /auth/refresh — Public

Không có request body. Refresh token lấy duy nhất từ HttpOnly cookie.

**Success Response (200):** cùng cấu trúc token của login và rotate cookie mới.

**Specific Errors:** `401` khi thiếu, hết hạn, đã revoke hoặc token reuse bị
phát hiện.

### POST /auth/logout 🔒

Không có request body. Revoke refresh token hiện tại và xóa cookie.

**Success Response (200):** `data: null`, message `Logged out`.

### GET /auth/me 🔒

**Access:** mọi authenticated user.

**Success Response (200):**

```json
{
  "statusCode": 200,
  "message": "Success",
  "data": {
    "id": "4ccca4ab-50a8-4d37-9a25-d95450f7b77f",
    "email": "customer@example.com",
    "displayName": "Nguyen Van A",
    "phoneNumber": "+84901234567",
    "status": "ACTIVE",
    "emailVerified": true,
    "dateOfBirth": "2002-03-20",
    "preferredLanguage": "vi",
    "avatarUrl": "https://storage.example/signed/avatar",
    "avatarUrlExpiresAt": "2026-10-01T09:15:00Z",
    "roles": ["CUSTOMER"],
    "createdAt": "2026-09-01T03:00:00Z",
    "updatedAt": "2026-09-20T04:00:00Z"
  },
  "timestamp": "2026-10-01T09:00:00Z"
}
```

### PATCH /users/me 🔒

**Request Body:** mọi field đều optional, nhưng phải có ít nhất một field.

```json
{
  "displayName": "Nguyen Van A Updated",
  "phoneNumber": "+84909999999",
  "dateOfBirth": "2002-03-20",
  "preferredLanguage": "vi"
}
```

Không cho sửa email, roles hoặc status. **Success (200):**
`UserProfileResponse`. **Errors:** `400` validation; `409` optimistic conflict.

### POST /users/me/avatar 🔒

**Request:** `multipart/form-data`, part `file` bắt buộc, image tối đa 5 MB.

**Success (201):**

```json
{
  "statusCode": 201,
  "message": "Avatar uploaded",
  "data": {
    "url": "https://storage.example/signed/avatar",
    "expiresAt": "2026-10-01T09:15:00Z"
  },
  "timestamp": "2026-10-01T09:00:00Z"
}
```

**Errors:** `400` MIME/size invalid; `503` storage unavailable.

### DELETE /users/me/avatar 🔒

**Success (204):** no body. Idempotent khi user chưa có avatar.

### GET /users/me/addresses 🔒

**Success (200):** `data` là mảng `AddressResponse`; danh mục nhỏ, không phân trang.

### POST /users/me/addresses 🔒

**Request Body:**

```json
{
  "label": "Home",
  "recipientName": "Nguyen Van A",
  "recipientPhone": "+84901234567",
  "addressLine": "123 Nguyen Trai",
  "ward": "Ben Thanh",
  "district": "District 1",
  "city": "Ho Chi Minh City",
  "latitude": 10.772,
  "longitude": 106.698,
  "isDefault": true
}
```

**Validation:** required `label`, recipient, address, district, city; latitude
`[-90,90]`; longitude `[-180,180]`. Chỉ một default address/user.

**Success (201):** `AddressResponse`. **Errors:** `409` nếu concurrent update
vi phạm one-default invariant.

### PATCH /users/me/addresses/{addressId} 🔒

**Request:** subset của create body. **Success (200):** `AddressResponse`.
**Errors:** `404` address không thuộc current user; `409` default conflict.

### DELETE /users/me/addresses/{addressId} 🔒

**Success (204):** no body. **Errors:** `404` address không thuộc current user.

### PUT /users/me/addresses/{addressId}/default 🔒

Đặt address làm mặc định và bỏ default của address cũ trong một transaction.

**Success (200):** `AddressResponse`. **Errors:** `404` address không thuộc user;
`409` concurrency conflict.

---

## 2. User Administration — Identity Service

Mọi endpoint trong section này yêu cầu `ADMIN`.

### GET /admin/users 🔒 ADMIN

**Query:** common pagination; `email`, `status`, `role` filters; default sort
`createdAt,desc`.

**Success (200):** paginated `AdminUserSummaryResponse`.

### GET /admin/users/{userId} 🔒 ADMIN

**Success (200):** user profile, roles và addresses; không trả password hash hay
refresh tokens. **Errors:** `404` user không tồn tại.

### PATCH /admin/users/{userId}/status 🔒 ADMIN

```json
{
  "status": "BLOCKED"
}
```

**Validation:** status chỉ `ACTIVE`, `BLOCKED`, `DELETED`; không cho admin tự
block/delete chính mình. Khi block/delete, revoke toàn bộ refresh token.

**Success (200):** `AdminUserResponse`. **Errors:** `409` self-operation hoặc
optimistic conflict; `422` transition không hợp lệ.

### PUT /admin/users/{userId}/roles 🔒 ADMIN

```json
{
  "roles": ["CUSTOMER", "BAKERY_OWNER"]
}
```

Danh sách thay thế toàn bộ platform roles. Role code phải tồn tại; một user phải
còn ít nhất một role. **Success (200):** `AdminUserResponse`. **Errors:** `404`
user/role; `422` empty roles hoặc vi phạm admin safety rule.

---

## 3. Bakeries — Bakery Service

### GET /bakeries — Public

Chỉ trả bakery `ACTIVE`, có active subscription còn hạn.

**Query:** common pagination; `query`, `city`, `district`; default sort
`name,asc`.

**Success (200):** paginated bakery cards gồm `id`, `name`, `description`,
`logoUrl`, primary address và aggregate rating lấy từ Order Service khi khả dụng.
Rating unavailable không làm fail catalog response.

### GET /bakeries/{bakeryId} — Public

**Success (200):** bakery profile, primary address, service areas, business
hours và signed media URLs. **Errors:** `404` bakery không public/tồn tại.

### POST /bakeries 🔒 BAKERY_OWNER

```json
{
  "name": "Sweet Home Bakery",
  "description": "Custom birthday cakes",
  "phoneNumber": "+84901112223",
  "email": "contact@sweethome.vn"
}
```

Tạo bakery `DRAFT` và current user làm member `OWNER`. **Success (201):**
`BakeryManagementResponse`. **Errors:** `400` validation; `503` Identity
validation unavailable.

### PATCH /bakeries/{bakeryId} 🔒 OWNER|MANAGER

**Request:** subset của create body. Không sửa status qua endpoint này.

**Success (200):** `BakeryManagementResponse`. **Errors:** `403` membership;
`404`; `409` optimistic conflict.

### POST /bakeries/{bakeryId}/logo 🔒 OWNER|MANAGER

Upload hoặc thay logo. Contract multipart, response và error giống endpoint
cover ngay dưới đây.

### POST /bakeries/{bakeryId}/cover 🔒 OWNER|MANAGER

Hai endpoint dùng `multipart/form-data`, part `file`, image tối đa 5 MB. File
mới thay file cũ bằng quy trình upload + compensation.

**Success (201):** `MediaResponse {url, expiresAt}`. **Errors:** `400` invalid
file; `403`; `404`; `503` storage unavailable.

### PUT /bakeries/{bakeryId}/operations 🔒 OWNER|MANAGER

Thay thế atomically cấu hình address, service area và business hours thuộc
Bakery Service.

```json
{
  "addresses": [
    {
      "id": null,
      "addressLine": "12 Le Loi",
      "ward": "Ben Nghe",
      "district": "District 1",
      "city": "Ho Chi Minh City",
      "latitude": 10.775,
      "longitude": 106.701,
      "isPrimary": true
    }
  ],
  "serviceAreas": [
    {
      "id": null,
      "city": "Ho Chi Minh City",
      "district": "District 1",
      "deliveryFee": 30000,
      "minimumOrder": 200000,
      "active": true
    }
  ],
  "businessHours": [
    {
      "dayOfWeek": 1,
      "opensAt": "08:00:00",
      "closesAt": "20:00:00",
      "closed": false
    }
  ]
}
```

**Validation:** tối đa một primary address; unique service area theo
city/district; `dayOfWeek` 1–7 unique; giờ mở nhỏ hơn giờ đóng; tiền không âm.

**Success (200):** `BakeryOperationsResponse`. **Errors:** `409` duplicate/
optimistic conflict; `422` invalid hours/invariants.

### POST /bakeries/{bakeryId}/submit-for-approval 🔒 OWNER

Không body. Bakery phải đang `DRAFT`, có primary address, service area và đủ
thông tin liên hệ.

**Success (200):** status `PENDING_APPROVAL`. **Errors:** `409` wrong state;
`422` profile incomplete.

### GET /bakeries/{bakeryId}/members 🔒 OWNER|MANAGER

**Success (200):** member list không phân trang gồm user ID, display snapshot,
member role, status, joinedAt. **Errors:** `403`; `404`.

### POST /bakeries/{bakeryId}/members 🔒 OWNER|MANAGER

```json
{
  "userId": "58cd4975-e979-4d87-95d4-cceb7dbb4fd7",
  "memberRole": "STAFF"
}
```

Manager chỉ thêm `STAFF`; chỉ owner thêm `MANAGER`. User phải có platform role
`BAKERY_STAFF` hoặc `BAKERY_OWNER` phù hợp.

**Success (201):** `BakeryMemberResponse`. **Errors:** `404` user; `409` member
đã tồn tại; `422` role mismatch; `503` Identity unavailable.

### PATCH /bakeries/{bakeryId}/members/{memberId} 🔒 OWNER|MANAGER

```json
{
  "memberRole": "MANAGER",
  "status": "ACTIVE"
}
```

Manager không sửa owner/manager khác. Không hạ quyền hoặc deactivate owner cuối
cùng. **Success (200):** `BakeryMemberResponse`. **Errors:** `403`, `404`, `409`,
`422` last-owner invariant.

### DELETE /bakeries/{bakeryId}/members/{memberId} 🔒 OWNER|MANAGER

**Success (204):** no body. **Errors:** `403`; `404`; `422` không được xóa owner
cuối cùng.

---

## 4. Catalog — Bakery Service

### GET /products — Public

**Query:** common pagination; `query`, `bakeryId`, `categoryId`, `city`,
`customizable`, `minPrice`, `maxPrice`; default sort `createdAt,desc`.

Chỉ trả product `PUBLISHED` của bakery public và có entitlement.

**Success (200):** paginated `ProductCardResponse`. **Errors:** `400` filter/sort
invalid; `503` entitlement service unavailable nếu không có cache hợp lệ.

### GET /products/{productId} — Public

**Success (200):** product, bakery summary, category, signed image URLs, option
groups/values và active add-ons của bakery. **Errors:** `404` product không public.

### GET /bakeries/{bakeryId}/categories 🔒 OWNER|MANAGER|STAFF

**Success (200):** tất cả categories của bakery, không phân trang.

### POST /bakeries/{bakeryId}/categories 🔒 OWNER|MANAGER

```json
{
  "name": "Birthday Cakes",
  "slug": "birthday-cakes",
  "displayOrder": 1,
  "active": true
}
```

**Success (201):** `ProductCategoryResponse`. **Errors:** `409` duplicate slug
trong bakery.

### PATCH /bakeries/{bakeryId}/categories/{categoryId} 🔒 OWNER|MANAGER

**Request:** subset của create body. **Success (200):** category. **Errors:**
`404`; `409` duplicate slug.

### DELETE /bakeries/{bakeryId}/categories/{categoryId} 🔒 OWNER|MANAGER

Xóa category và đặt `categoryId=null` cho products liên quan; không xóa product.

**Success (204):** no body. **Errors:** `404`.

### GET /bakeries/{bakeryId}/add-ons 🔒 OWNER|MANAGER|STAFF

**Success (200):** tất cả add-ons của bakery, không phân trang.

### POST /bakeries/{bakeryId}/add-ons 🔒 OWNER|MANAGER

```json
{
  "name": "Number Candle",
  "description": "One number candle",
  "category": "CANDLE",
  "price": 20000,
  "active": true
}
```

**Success (201):** `AddOnResponse`. **Errors:** `400` price âm/validation.

### PATCH /bakeries/{bakeryId}/add-ons/{addOnId} 🔒 OWNER|MANAGER

**Request:** subset của create body. **Success (200):** add-on. **Errors:**
`404`; `409` optimistic conflict.

### POST /bakeries/{bakeryId}/add-ons/{addOnId}/image 🔒 OWNER|MANAGER

**Request:** multipart part `file`, image tối đa 5 MB. **Success (201):**
`MediaResponse`. **Errors:** `400`, `404`, `503`.

### DELETE /bakeries/{bakeryId}/add-ons/{addOnId} 🔒 OWNER|MANAGER

Soft-disable bằng `active=false` nếu đã được tham chiếu; snapshot offer cũ không
thay đổi. **Success (204):** no body. **Errors:** `404`.

### GET /bakeries/{bakeryId}/products 🔒 OWNER|MANAGER|STAFF

**Query:** common pagination, `status`, `categoryId`, `query`. Trả cả draft và
archived theo quyền membership.

**Success (200):** paginated `ProductManagementResponse`.

### POST /bakeries/{bakeryId}/products 🔒 OWNER|MANAGER

```json
{
  "categoryId": "bb574121-66fd-4725-994b-9e0d57e76569",
  "name": "Chocolate Birthday Cake",
  "slug": "chocolate-birthday-cake",
  "description": "Chocolate sponge with ganache",
  "basePrice": 450000,
  "customizable": true,
  "defaultServingSize": 10,
  "minimumNoticeHours": 24
}
```

Tạo product `DRAFT`. **Success (201):** `ProductManagementResponse`. **Errors:**
`404` category; `409` duplicate bakery/slug; `422` category thuộc bakery khác.

### PATCH /bakeries/{bakeryId}/products/{productId} 🔒 OWNER|MANAGER

**Request:** subset của create body; không sửa status. **Success (200):** product.
**Errors:** `404`; `409` slug/optimistic conflict; `422` cross-bakery category.

### POST /bakeries/{bakeryId}/products/{productId}/images 🔒 OWNER|MANAGER

**Request:** multipart parts `files` (1–10 images, tối đa 5 MB/file), optional
`primaryIndex` và `displayOrder` JSON array.

**Success (201):** array `ProductImageResponse`. **Errors:** `400` file/count;
`404`; `409` multiple-primary conflict; `503` storage unavailable.

### DELETE /bakeries/{bakeryId}/products/{productId}/images/{imageId} 🔒 OWNER|MANAGER

**Success (204):** no body. Nếu xóa ảnh primary, không tự chọn ảnh khác.
**Errors:** `404`.

### PUT /bakeries/{bakeryId}/products/{productId}/options 🔒 OWNER|MANAGER

Thay thế toàn bộ option configuration của product trong một transaction.

```json
{
  "groups": [
    {
      "id": null,
      "name": "Size",
      "selectionType": "SINGLE",
      "required": true,
      "minimumSelections": 1,
      "maximumSelections": 1,
      "displayOrder": 1,
      "values": [
        {
          "id": null,
          "name": "Large",
          "description": "Serves 12-15",
          "priceAdjustment": 120000,
          "active": true,
          "displayOrder": 1
        }
      ]
    }
  ]
}
```

**Validation:** `SINGLE|MULTIPLE`; min ≥ 0; max ≥ min; required group phải có
min ≥ 1; IDs nếu có phải thuộc product hiện tại.

**Success (200):** option groups/values. **Errors:** `409` optimistic conflict;
`422` selection invariant/cross-product ID.

### POST /bakeries/{bakeryId}/products/{productId}/publish 🔒 OWNER|MANAGER

Product phải có ít nhất một image primary, giá/cấu hình hợp lệ và bakery có
active subscription.

**Success (200):** product status `PUBLISHED`. **Errors:** `409` wrong state;
`422` incomplete product/inactive entitlement; `503` Subscription unavailable.

### POST /bakeries/{bakeryId}/products/{productId}/hide 🔒 OWNER|MANAGER

Chuyển `PUBLISHED` thành `HIDDEN`. **Success (200):** product. **Errors:** `409`
wrong state.

### POST /bakeries/{bakeryId}/products/{productId}/archive 🔒 OWNER|MANAGER

Chuyển product chưa archived thành `ARCHIVED`; order/request snapshots cũ giữ
nguyên. **Success (200):** product. **Errors:** `409` wrong state.

---

## 5. Bakery Administration — Bakery Service

Mọi endpoint yêu cầu `ADMIN`.

### GET /admin/bakeries 🔒 ADMIN

**Query:** common pagination; `status`, `query`, `city`; default sort
`createdAt,desc`. **Success (200):** paginated `AdminBakerySummaryResponse`.

### GET /admin/bakeries/{bakeryId} 🔒 ADMIN

**Success (200):** bakery management detail, members, operations và current
subscription summary. **Errors:** `404`.

### PATCH /admin/bakeries/{bakeryId}/status 🔒 ADMIN

```json
{
  "status": "ACTIVE"
}
```

Allowed commands: approve `PENDING_APPROVAL→ACTIVE`, reject
`PENDING_APPROVAL→DRAFT`, suspend `ACTIVE→SUSPENDED`, reopen
`SUSPENDED→ACTIVE`, close non-closed bakery.

**Success (200):** `AdminBakeryResponse`. **Errors:** `409` optimistic/wrong
state; `422` approval checklist chưa đạt.

---

## 6. Cake Requests — Marketplace Service

### GET /cake-requests 🔒

**Access:** `CUSTOMER` xem request của mình; bakery member xem request `OPEN`
phù hợp service area hoặc targeted đúng bakery; `ADMIN` xem theo filter quản trị.

**Query:** common pagination; `scope=mine|available`, `status`, `requestType`,
`city`, `district`, `neededFrom`, `neededTo`; default sort `createdAt,desc`.

**Success (200):** paginated `CakeRequestSummaryResponse`. Các field nhạy cảm
customer chỉ hiện với bakery đã có quyền tham gia request.

### GET /cake-requests/{cakeRequestId} 🔒

**Access:** owner customer, eligible/target bakery member hoặc admin.

**Success (200):** request detail gồm preference, option snapshots, signed image
URLs, selected design summary, status history và offer summary theo quyền.

**Errors:** `403` không đủ context permission; `404` request không tồn tại.

### POST /cake-requests 🔒 CUSTOMER

Tạo request ở trạng thái `DRAFT`.

```json
{
  "requestType": "TARGETED_PRODUCT_CUSTOM",
  "targetBakeryId": "f22b255f-cdd7-4f1e-946d-4f1309c70e34",
  "baseProductId": "ebca6e49-e829-4751-a123-d4db2af91da0",
  "title": "Pastel birthday cake",
  "description": "Two-tier cake with flower decoration",
  "occasion": "BIRTHDAY",
  "servingSize": 20,
  "budgetMin": 700000,
  "budgetMax": 1200000,
  "neededAt": "2026-10-20T03:00:00Z",
  "deliveryDistrict": "District 1",
  "deliveryCity": "Ho Chi Minh City",
  "offerDeadline": "2026-10-10T16:59:59Z",
  "preference": {
    "cakeSize": "Large",
    "cakeShape": "ROUND",
    "flavor": "Chocolate",
    "filling": "Strawberry",
    "frosting": "Buttercream",
    "colorPalette": "Pastel pink and white",
    "decorationNotes": "Fresh-looking sugar flowers",
    "allergyNotes": "No peanuts",
    "extraOptions": {}
  },
  "optionSelections": [
    {
      "optionGroupId": "39e79ea7-f110-4c56-a65e-bad567bb06cf",
      "optionValueId": "457e163f-a992-4753-a020-9c3d9a64ba63",
      "quantity": 1
    }
  ]
}
```

**Business rules:**

- `OPEN_CUSTOM`: `targetBakeryId` và `baseProductId` phải null.
- `TARGETED_PRODUCT_CUSTOM`: cả hai ID bắt buộc; product phải thuộc bakery và
  customizable.
- `neededAt` ở tương lai; deadline nếu có phải trước neededAt; budget không âm
  và max ≥ min.
- Snapshot tên option được lấy từ Bakery Service, không nhận từ client.

**Success (201):** `CakeRequestResponse`. **Errors:** `404` bakery/product/
option; `422` type/invariant hoặc bakery không phục vụ khu vực; `503` Bakery
Service unavailable.

### PATCH /cake-requests/{cakeRequestId} 🔒 CUSTOMER owner

**Request:** subset của create body; chỉ request `DRAFT` được sửa. Không cho đổi
`requestType` sau khi đã có ảnh, AI job hoặc offer.

**Success (200):** `CakeRequestResponse`. **Errors:** `403`; `409` wrong state/
optimistic conflict; `422` invariant.

### POST /cake-requests/{cakeRequestId}/images 🔒 CUSTOMER owner

**Request:** multipart `files` gồm 1–10 JPEG/PNG/WebP, tối đa 10 MB/file;
optional `displayOrder` array.

**Success (201):** array `RequestImageResponse {id,url,expiresAt,mediaType,
displayOrder}`. **Errors:** `400` file/count; `409` request không còn `DRAFT`;
`503` storage unavailable.

### DELETE /cake-requests/{cakeRequestId}/images/{imageId} 🔒 CUSTOMER owner

Chỉ được xóa khi request `DRAFT`. **Success (204):** no body. **Errors:** `404`;
`409` wrong state.

### PUT /cake-requests/{cakeRequestId}/selected-design 🔒 CUSTOMER owner

```json
{
  "generatedDesignId": "ced2863d-cf4b-4410-8a8e-9a98035bb92e"
}
```

Design phải thuộc AI job của chính request/customer và moderation status
`APPROVED`. Chỉ request chưa closed/cancelled được chọn hoặc đổi design.

**Success (200):** `CakeRequestResponse`. **Errors:** `404` design; `409` wrong
request state; `422` ownership/moderation mismatch; `503` Cake AI unavailable.

### POST /cake-requests/{cakeRequestId}/publish 🔒 CUSTOMER owner

Chuyển `DRAFT→OPEN`. Request phải hợp lệ, neededAt/deadline còn tương lai; với
targeted request, bakery/product vẫn usable.

**Success (200):** request status `OPEN`. **Errors:** `409` wrong state;
`422` incomplete/expired data; `503` remote validation unavailable.

### POST /cake-requests/{cakeRequestId}/cancel 🔒 CUSTOMER owner

```json
{
  "reason": "Event was cancelled"
}
```

Cho phép cancel `DRAFT|OPEN`; không cancel khi đã có accepted offer/order.

**Success (200):** request status `CANCELLED`; pending offers được rejected.
**Errors:** `409` wrong state; `503` nếu workflow bắt buộc không hoàn thành.

---

## 7. Offers — Marketplace Service

### GET /offers 🔒

**Access:** customer dùng `scope=received`; bakery member dùng `scope=sent`;
admin dùng filters quản trị.

**Query:** common pagination; `scope`, `cakeRequestId`, `bakeryId`, `status`;
default sort `createdAt,desc`.

**Success (200):** paginated `OfferSummaryResponse`, chỉ hiện dữ liệu theo owner.

### GET /offers/{offerId} 🔒

**Access:** request owner, member của bakery gửi offer hoặc admin.

**Success (200):** offer detail, item snapshots và status history. **Errors:**
`403`; `404`.

### POST /cake-requests/{cakeRequestId}/offers 🔒 BAKERY_OWNER|BAKERY_STAFF

```json
{
  "bakeryId": "f22b255f-cdd7-4f1e-946d-4f1309c70e34",
  "message": "We can make this design with Belgian chocolate",
  "cakePrice": 900000,
  "deliveryFee": 30000,
  "estimatedCompletionAt": "2026-10-19T09:00:00Z",
  "expiresAt": "2026-10-10T10:00:00Z",
  "items": [
    {
      "addOnId": "8214b736-b094-42b4-974a-4d66f07d4ac6",
      "quantity": 1
    }
  ]
}
```

Server lấy add-on snapshot/price và tự tính `addOnTotal`, `lineTotal`,
`totalPrice`; không nhận các total từ client. Bakery phải active, đúng target
nếu targeted, phục vụ khu vực và có active subscription.

**Success (201):** `OfferResponse`. **Errors:** `409` bakery đã có offer cho
request; `422` request không open/offer expired/ineligible/inactive entitlement;
`503` Bakery hoặc Subscription unavailable.

### PATCH /offers/{offerId} 🔒 submitting bakery OWNER|MANAGER

**Request:** subset của offer create body, trừ `bakeryId`; chỉ offer `PENDING`
chưa hết hạn được sửa. Giá/totals được tính lại.

**Success (200):** `OfferResponse`. **Errors:** `409` wrong state/optimistic
conflict; `422` invariant.

### POST /offers/{offerId}/withdraw 🔒 submitting bakery OWNER|MANAGER

```json
{
  "reason": "Capacity is no longer available"
}
```

Chỉ `PENDING→WITHDRAWN`. **Success (200):** offer response. **Errors:** `409`
wrong state.

### POST /offers/{offerId}/accept 🔒 CUSTOMER request owner

**Required Header:** `Idempotency-Key`.

```json
{
  "deliveryAddressId": "20ee2daf-d4cd-475f-a478-a0e16d78fb7c",
  "customerNote": "Please call before delivery"
}
```

Marketplace lock offer/request, gọi Order Service bằng key ổn định dựa trên
offer ID, tạo tối đa một `ACCEPTED_OFFER` order, accept offer và reject offers
còn lại. Address được Identity Service xác minh và Order Service lưu snapshot.

**Success (200):**

```json
{
  "statusCode": 200,
  "message": "Offer accepted",
  "data": {
    "offerId": "4be46cc4-470f-40cf-a53d-dd59744a81e9",
    "cakeRequestId": "af2c72e8-5571-4c14-8481-4440cfdad5aa",
    "orderId": "2a58e788-bc05-449a-8920-2211696d09a2",
    "orderNumber": "ORD-20261001-000001",
    "offerStatus": "ACCEPTED",
    "requestStatus": "OFFER_SELECTED"
  },
  "timestamp": "2026-10-01T09:00:00Z"
}
```

**Errors:** `400` missing/invalid idempotency key; `409` offer selected/expired
hoặc concurrency conflict; `422` invalid address; `503` Order/Identity unavailable.

---

## 8. Orders and Reviews — Order Service

### POST /orders/direct 🔒 CUSTOMER

**Required Header:** `Idempotency-Key`.

```json
{
  "bakeryId": "f22b255f-cdd7-4f1e-946d-4f1309c70e34",
  "productId": "ebca6e49-e829-4751-a123-d4db2af91da0",
  "quantity": 1,
  "optionSelections": [
    {
      "optionGroupId": "39e79ea7-f110-4c56-a65e-bad567bb06cf",
      "optionValueIds": ["457e163f-a992-4753-a020-9c3d9a64ba63"]
    }
  ],
  "addOns": [
    {
      "addOnId": "8214b736-b094-42b4-974a-4d66f07d4ac6",
      "quantity": 2
    }
  ],
  "deliveryAddressId": "20ee2daf-d4cd-475f-a478-a0e16d78fb7c",
  "requestedDeliveryAt": "2026-10-20T03:00:00Z",
  "customerNote": "Write Happy Birthday An"
}
```

Order Service lấy catalog/address data từ owner services, tính giá server-side
và lưu immutable snapshots. Product/bakery phải public, entitlement active,
option selection hợp lệ và thời gian đáp ứng minimum notice.

**Success (201):** `OrderResponse` với `orderSource=DIRECT_CATALOG`,
`cakeRequestId=null`, `offerId=null`. **Errors:** `409` idempotency payload
mismatch; `422` catalog/option/area/notice invalid; `503` remote unavailable.

### GET /orders 🔒

**Access:** customer xem order của mình; bakery member xem order của bakery;
admin xem theo filter.

**Query:** common pagination; `scope=mine|bakery`, `bakeryId`, `status`,
`orderSource`, `createdFrom`, `createdTo`; default sort `createdAt,desc`.

**Success (200):** paginated `OrderSummaryResponse`.

### GET /orders/{orderId} 🔒

**Success (200):** full snapshots, items, delivery address, status history và
review nếu có. Không gọi catalog để thay snapshot. **Errors:** `403`; `404`.

### POST /orders/{orderId}/status-transitions 🔒

**Access:** bakery member thực hiện fulfillment transitions; customer/bakery có
thể cancel theo rule; admin override chỉ khi policy cho phép.

```json
{
  "targetStatus": "CONFIRMED",
  "reason": "Order accepted by bakery"
}
```

State machine:

```text
PENDING → CONFIRMED → BAKING → READY → DELIVERING → COMPLETED
PENDING|CONFIRMED → CANCELLED
```

Không cho bỏ qua trạng thái. Cancel sau `BAKING` không thuộc MVP. Mỗi transition
ghi history với actor từ JWT.

**Success (200):** `OrderResponse`. **Errors:** `403`; `409` wrong state/
optimistic conflict; `422` actor không được phép thực hiện transition.

### POST /orders/{orderId}/review 🔒 CUSTOMER order owner

```json
{
  "rating": 5,
  "comment": "Cake looked exactly like the design"
}
```

Chỉ order `COMPLETED`, tối đa một review/order; rating 1–5.

**Success (201):** `ReviewResponse`. **Errors:** `409` review tồn tại; `422`
order chưa completed.

### PATCH /orders/{orderId}/review 🔒 CUSTOMER order owner

```json
{
  "rating": 4,
  "comment": "Updated after contacting the bakery"
}
```

Chỉ review `PUBLISHED`; không đổi owner/order. **Success (200):** review.
**Errors:** `404`; `409` hidden/deleted/optimistic conflict.

### DELETE /orders/{orderId}/review 🔒 CUSTOMER order owner

Soft-delete review thành `DELETED`. **Success (204):** no body. **Errors:**
`404`; `409` already deleted.

### PATCH /admin/reviews/{orderId}/status 🔒 ADMIN

```json
{
  "status": "HIDDEN"
}
```

Admin chuyển `PUBLISHED↔HIDDEN`; không restore `DELETED`. **Success (200):**
`ReviewResponse`. **Errors:** `404`; `409` transition/optimistic conflict.

---

## 9. Chat — Chat Service

MVP dùng REST polling; không có WebSocket/SSE contract.

### GET /conversations 🔒

**Query:** common pagination; `status`; default sort `lastMessageAt,desc`.
Chỉ trả conversation current user là active participant.

**Success (200):** paginated `ConversationSummaryResponse` gồm unread count và
last message preview.

### POST /conversations 🔒 CUSTOMER

```json
{
  "cakeRequestId": "af2c72e8-5571-4c14-8481-4440cfdad5aa",
  "bakeryId": "f22b255f-cdd7-4f1e-946d-4f1309c70e34"
}
```

Request phải thuộc customer; bakery phải được phép trao đổi cho request.
Unique `(cakeRequestId,bakeryId)` giúp retry trả conversation hiện có.

**Success (201 hoặc 200 nếu đã tồn tại):** `ConversationResponse`. **Errors:**
`422` context invalid; `503` Marketplace/Bakery unavailable.

### GET /conversations/{conversationId} 🔒 participant

**Success (200):** conversation context, participants và current read state.
**Errors:** `404` khi không phải participant.

### POST /conversations/{conversationId}/close 🔒 CUSTOMER|bakery OWNER|MANAGER

```json
{
  "reason": "Discussion completed"
}
```

Chuyển `OPEN→CLOSED`; close lặp lại idempotent. **Success (200):** conversation.
**Errors:** `403`; `409` archived conversation.

### GET /conversations/{conversationId}/messages 🔒 participant

**Query:** `before` optional opaque cursor, `limit` default 30, min 1 max 100.

**Success (200):**

```json
{
  "statusCode": 200,
  "message": "Success",
  "data": {
    "items": [],
    "nextCursor": "eyJjcmVhdGVkQXQiOiIyMDI2LTEwLTAxVDA5OjAwOjAwWiJ9",
    "hasMore": true
  },
  "timestamp": "2026-10-01T09:00:00Z"
}
```

Messages sắp xếp mới đến cũ trong page; client đảo thứ tự để render timeline.
Deleted message chỉ trả tombstone, không trả content/attachment URL.

### POST /conversations/{conversationId}/messages 🔒 participant

**Request:** `multipart/form-data`:

| Part | Type | Required | Description |
|---|---|---|---|
| `metadata` | JSON | yes | `clientMessageId`, `messageType`, optional `content` |
| `files` | file[] | conditional | 1–5 files cho `IMAGE`/`FILE`, tối đa 10 MB/file |

`metadata` example:

```json
{
  "clientMessageId": "0dc18663-3464-44bd-b17e-e54b78c719d9",
  "messageType": "TEXT",
  "content": "Can you make the flowers slightly darker?"
}
```

TEXT yêu cầu non-blank content và không có files; IMAGE/FILE yêu cầu files.
`clientMessageId` là idempotency key tự nhiên toàn hệ thống.

**Success (201 hoặc 200 khi duplicate cùng payload):** `MessageResponse` với
signed attachment URLs. **Errors:** `409` clientMessageId payload mismatch hoặc
conversation closed; `422` type/content/file mismatch; `503` storage unavailable.

### POST /conversations/{conversationId}/read 🔒 participant

```json
{
  "throughMessageId": "d865003e-c13d-4517-bf69-f76ef6dd0528"
}
```

Idempotently cập nhật receipt/lastReadAt đến message thuộc conversation.

**Success (200):** `data {conversationId,lastReadAt}`. **Errors:** `404` message;
`422` message thuộc conversation khác.

---

## 10. Cake AI — Cake AI Service

### POST /generation-jobs 🔒 CUSTOMER

**Request:** `multipart/form-data`:

| Part | Type | Required | Description |
|---|---|---|---|
| `metadata` | JSON | yes | Request ID, prompt và generation parameters |
| `sourceImages` | file[] | no | Tối đa 5 images, 10 MB/file |

```json
{
  "cakeRequestId": "af2c72e8-5571-4c14-8481-4440cfdad5aa",
  "prompt": "Two-tier pastel cake with sugar peonies",
  "negativePrompt": "text, watermark, people",
  "generationParameters": {
    "aspectRatio": "1:1",
    "numberOfDesigns": 4
  }
}
```

Model name được server chọn theo configuration, không nhận từ client. Request
phải thuộc customer và chưa closed/cancelled; prompt/source images phải qua
moderation. Job được tạo `QUEUED` và API trả ngay.

**Success (202):** `GenerationJobResponse` gồm ID, status, modelName,
currentRevision, timestamps. **Errors:** `422` moderation/context/parameters;
`503` Marketplace/storage unavailable.

### GET /generation-jobs 🔒 CUSTOMER

**Query:** common pagination; `cakeRequestId`, `status`; chỉ job current customer.
**Success (200):** paginated `GenerationJobSummaryResponse`.

### GET /generation-jobs/{jobId} 🔒 owner|ADMIN

**Success (200):** job, safe error, prompt revisions, source image URLs và
generated designs. Không trả raw provider response. **Errors:** `404`.

### POST /generation-jobs/{jobId}/prompt-revisions 🔒 CUSTOMER owner

```json
{
  "prompt": "Keep the design but use darker pink peonies",
  "negativePrompt": "text, watermark, people",
  "generationParameters": {
    "numberOfDesigns": 2
  }
}
```

Chỉ job `SUCCEEDED|FAILED`; tạo revision number kế tiếp và queue generation mới
trên cùng job. **Success (202):** updated `GenerationJobResponse`. **Errors:**
`409` job processing/cancelled; `422` moderation/parameters; `503` provider queue.

### POST /generation-jobs/{jobId}/cancel 🔒 CUSTOMER owner

Chỉ `QUEUED|PROCESSING→CANCELLED`; cancel là best effort với provider.
**Success (200):** job. **Errors:** `409` terminal state.

### GET /generated-designs/{designId} 🔒 owner|ADMIN

**Success (200):** design metadata, moderation status và signed image/thumbnail
URLs. **Errors:** `404`.

### PATCH /admin/generated-designs/{designId}/moderation 🔒 ADMIN

```json
{
  "moderationStatus": "APPROVED"
}
```

Allowed `PENDING→APPROVED|REJECTED`; rejected design không được chọn ở cake
request. **Success (200):** `GeneratedDesignResponse`. **Errors:** `409` terminal
moderation conflict.

---

## 11. Subscription — Subscription Service

### GET /subscription-plans — Public

Chỉ trả plan `ACTIVE`. **Success (200):** danh sách plan và features, không phân
trang vì là reference data nhỏ.

### GET /subscription-plans/{planId} — Public

**Success (200):** `SubscriptionPlanResponse`. **Errors:** `404` inactive hoặc
không tồn tại.

### GET /bakeries/{bakeryId}/subscription 🔒 bakery member|ADMIN

**Success (200):** current active/scheduled period và entitlement features;
`data.currentSubscription=null` nếu chưa có. **Errors:** `403`; `404` bakery.

### POST /bakeries/{bakeryId}/subscription-orders 🔒 OWNER

**Required Header:** `Idempotency-Key`.

```json
{
  "planId": "1e5bbdb7-dff2-45a1-b166-d8dd23ab10fd"
}
```

Server snapshot plan name/period/price, currency VND và expiry. Không tạo order
trùng cho cùng idempotency key.

**Success (201):** `SubscriptionOrderResponse` status `PENDING_PAYMENT`.
**Errors:** `409` conflicting open order/idempotency mismatch; `422` plan inactive;
`503` Bakery validation unavailable.

### GET /bakeries/{bakeryId}/subscription-orders 🔒 bakery member|ADMIN

**Query:** common pagination; `status`; default sort `createdAt,desc`.
**Success (200):** paginated subscription orders.

### GET /subscription-orders/{orderId} 🔒 bakery member|ADMIN

**Success (200):** order, safe payment summaries và activated period. Payment
proof URL chỉ trả cho submitting bakery owner và admin. **Errors:** `403`; `404`.

### POST /subscription-orders/{orderId}/payments 🔒 OWNER

**Required Header:** `Idempotency-Key`. **Request:** `multipart/form-data`:

| Part | Type | Required | Description |
|---|---|---|---|
| `metadata` | JSON | yes | method, optional reference, amount, currency |
| `proof` | file | conditional | JPEG/PNG/WebP/PDF, tối đa 10 MB |

```json
{
  "paymentMethod": "BANK_TRANSFER",
  "paymentReference": "VCB-20261001-123456",
  "amount": 499000,
  "currency": "VND"
}
```

Phải có `paymentReference` hoặc proof. Amount/currency phải khớp order. Order
chuyển `PENDING_PAYMENT→PAYMENT_REVIEW` khi submission hợp lệ.

**Success (201):** `BakeryPaymentResponse` status `SUBMITTED`; proof là signed
URL chỉ cho authorized viewer. **Errors:** `409` duplicate reference/wrong order
state/idempotency mismatch; `422` amount/evidence mismatch; `503` storage.

### GET /admin/subscription-plans 🔒 ADMIN

**Success (200):** tất cả plans gồm inactive/archived, không phân trang.

### POST /admin/subscription-plans 🔒 ADMIN

```json
{
  "code": "PRO",
  "name": "Pro",
  "description": "For growing bakeries",
  "monthlyPrice": 499000,
  "currency": "VND",
  "billingPeriodMonths": 1,
  "status": "ACTIVE",
  "features": {
    "MAX_PRODUCTS": "100",
    "MAX_MONTHLY_OFFERS": "500",
    "FEATURED_LISTING": "true"
  }
}
```

**Success (201):** `SubscriptionPlanResponse`. **Errors:** `409` duplicate code;
`422` invalid price/period/features.

### PATCH /admin/subscription-plans/{planId} 🔒 ADMIN

**Request:** subset của create body; code không đổi sau khi có order. Existing
order/subscription snapshots không đổi khi giá/feature thay đổi.

**Success (200):** plan. **Errors:** `404`; `409` immutable code/optimistic
conflict; `422` validation.

### POST /admin/subscription-plans/{planId}/archive 🔒 ADMIN

Chuyển plan thành `ARCHIVED`; không ảnh hưởng active subscriptions hiện có.
**Success (200):** plan. **Errors:** `409` already archived.

### GET /admin/bakery-payments 🔒 ADMIN

**Query:** common pagination; `status`, `bakeryId`, `submittedFrom`,
`submittedTo`; default sort `submittedAt,asc` cho queue.

**Success (200):** paginated payment reviews với signed proof URL.

### POST /admin/bakery-payments/{paymentId}/approve 🔒 ADMIN

**Required Header:** `Idempotency-Key`.

```json
{
  "reviewNote": "Payment matched bank statement"
}
```

Atomically trong subscription DB: payment `SUBMITTED→APPROVED`, order
`PAYMENT_REVIEW→COMPLETED`, tạo tối đa một subscription period theo
`sourceOrderId`. Mỗi bakery tối đa một ACTIVE period; renewal phù hợp có thể
được tạo `SCHEDULED` sau current period.

**Success (200):** payment, completed order và subscription response. **Errors:**
`409` wrong state/concurrent approval/active-period invariant; `422` order data
invalid.

### POST /admin/bakery-payments/{paymentId}/reject 🔒 ADMIN

```json
{
  "reviewNote": "Transfer amount does not match the order"
}
```

Note bắt buộc. Payment thành `REJECTED`; order trở lại `PENDING_PAYMENT` nếu còn
hạn, ngược lại `EXPIRED`.

**Success (200):** updated payment/order. **Errors:** `409` wrong state;
`422` blank note.

---

## 12. Internal Service APIs

Internal endpoints không đi qua public Gateway. Mọi request bắt buộc có service
JWT đúng `audience`/`scope` và `X-Correlation-Id`. Response có thể dùng DTO gọn
nhưng không expose entity. Lỗi authentication/authorization vẫn là `401/403`.

### GET /internal/v1/users/{userId} — Identity

**Required scope:** `identity:user:read`.

**Success (200):**

```json
{
  "id": "4ccca4ab-50a8-4d37-9a25-d95450f7b77f",
  "email": "customer@example.com",
  "displayName": "Nguyen Van A",
  "phoneNumber": "+84901234567",
  "status": "ACTIVE",
  "roles": ["CUSTOMER"]
}
```

**Errors:** `404` user; `503` Identity dependencies unavailable.

### GET /internal/v1/users/{userId}/addresses/{addressId} — Identity

**Required scope:** `identity:address:read`.

**Success (200):** address snapshot fields required by Order Service. **Errors:**
`404` user/address mismatch.

### GET /internal/v1/bakeries/{bakeryId} — Bakery

**Required scope:** `bakery:profile:read`.

**Success (200):** bakery identity, status, primary address and service areas.
**Errors:** `404` bakery.

### GET /internal/v1/bakeries/{bakeryId}/members/{userId}/authorization — Bakery

**Required scope:** `bakery:membership:read`. **Query:** `requiredRole` optional.

**Success (200):**

```json
{
  "bakeryId": "f22b255f-cdd7-4f1e-946d-4f1309c70e34",
  "userId": "58cd4975-e979-4d87-95d4-cceb7dbb4fd7",
  "active": true,
  "memberRole": "MANAGER",
  "authorized": true
}
```

Không dùng `404` cho negative authorization khi bakery/user hợp lệ; trả
`authorized=false`. `404` chỉ khi bakery không tồn tại.

### POST /internal/v1/catalog/quotes — Bakery

**Required scope:** `bakery:catalog:quote`.

```json
{
  "bakeryId": "f22b255f-cdd7-4f1e-946d-4f1309c70e34",
  "productId": "ebca6e49-e829-4751-a123-d4db2af91da0",
  "quantity": 1,
  "optionSelections": [
    {
      "optionGroupId": "39e79ea7-f110-4c56-a65e-bad567bb06cf",
      "optionValueIds": ["457e163f-a992-4753-a020-9c3d9a64ba63"]
    }
  ],
  "addOns": [
    {
      "addOnId": "8214b736-b094-42b4-974a-4d66f07d4ac6",
      "quantity": 2
    }
  ],
  "deliveryDistrict": "District 1",
  "deliveryCity": "Ho Chi Minh City"
}
```

**Success (200):** validated product/option/add-on snapshots, subtotal,
deliveryFee, totalAmount, minimumNoticeHours and a short-lived `quoteId` valid
for 5 minutes. **Errors:** `404` resource; `409` unpublished/inactive catalog;
`422` invalid selection/service area.

### GET /internal/v1/cake-requests/{cakeRequestId}/context — Marketplace

**Required scope:** `marketplace:request:read`.

**Success (200):** request ID, customer ID, target bakery, status and chat/AI
eligibility flags. **Errors:** `404` request.

### GET /internal/v1/offers/{offerId}/order-source — Marketplace

**Required scope:** `marketplace:offer:read`.

**Success (200):** accepted-offer snapshot sufficient to create order: request,
customer, bakery, item/price snapshots and requested delivery time. Chỉ trả khi
offer đang trong acceptance workflow. **Errors:** `404`; `409` offer state.

### POST /internal/v1/orders/from-offer — Order

**Required scope:** `order:create-from-offer`; **Required Header:**
`Idempotency-Key`, được Marketplace suy ra ổn định từ offer ID.

```json
{
  "offerId": "4be46cc4-470f-40cf-a53d-dd59744a81e9",
  "cakeRequestId": "af2c72e8-5571-4c14-8481-4440cfdad5aa",
  "customerId": "4ccca4ab-50a8-4d37-9a25-d95450f7b77f",
  "deliveryAddressId": "20ee2daf-d4cd-475f-a478-a0e16d78fb7c",
  "deliveryNote": "Please call before delivery"
}
```

Order Service lấy authoritative offer snapshot từ Marketplace và address từ
Identity; payload IDs chỉ dùng để cross-check. Unique offer ID bảo đảm tối đa
một order.

**Success (201 hoặc 200 khi replay):** `{orderId,orderNumber,status}`. **Errors:**
`409` key/payload mismatch hoặc offer đã gắn order khác; `422` snapshot mismatch;
`503` Marketplace/Identity unavailable.

### GET /internal/v1/orders/{orderId}/context — Order

**Required scope:** `order:context:read`.

**Success (200):** customer ID, bakery ID, request/offer IDs, status và chat/
review eligibility. **Errors:** `404` order.

### GET /internal/v1/generated-designs/{designId}/validation — Cake AI

**Required scope:** `cake-ai:design:validate`; **Query:** `customerId`,
`cakeRequestId`.

**Success (200):** `{exists,ownerMatches,requestMatches,moderationStatus}`.
**Errors:** `404` design.

### GET /internal/v1/subscriptions/bakeries/{bakeryId}/entitlement — Subscription

**Required scope:** `subscription:entitlement:read`.

**Success (200):**

```json
{
  "bakeryId": "f22b255f-cdd7-4f1e-946d-4f1309c70e34",
  "active": true,
  "planCode": "PRO",
  "periodEnd": "2026-11-01T00:00:00Z",
  "features": {
    "MAX_PRODUCTS": "100",
    "MAX_MONTHLY_OFFERS": "500",
    "FEATURED_LISTING": "true"
  }
}
```

Bakery/Marketplace có thể cache response trong tối đa 60 giây, không cache quá
`periodEnd`. Bakery chưa có entitlement trả `200 active=false`, không trả 404.

---

## Error Response Format

### Standard Error

```json
{
  "statusCode": 404,
  "message": "Order not found",
  "data": null,
  "timestamp": "2026-10-01T09:00:00Z"
}
```

### Validation Error

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "data": {
    "email": "must be a well-formed email address",
    "neededAt": "must be a future instant",
    "items[0].quantity": "must be greater than 0"
  },
  "timestamp": "2026-10-01T09:00:00Z"
}
```

### Conflict Error

```json
{
  "statusCode": 409,
  "message": "Offer has already been accepted",
  "data": {
    "resourceType": "OFFER",
    "resourceId": "4be46cc4-470f-40cf-a53d-dd59744a81e9"
  },
  "timestamp": "2026-10-01T09:00:00Z"
}
```

Không trả stack trace, SQL message, internal URL, token, object key hoặc provider
raw error. `X-Correlation-Id` được echo trong response header để tra log.

---

## Enum Reference

| Domain | Field | Values |
|---|---|---|
| Identity | User status | `PENDING`, `ACTIVE`, `BLOCKED`, `DELETED` |
| Identity | Platform role | `CUSTOMER`, `BAKERY_OWNER`, `BAKERY_STAFF`, `ADMIN` |
| Bakery | Bakery status | `DRAFT`, `PENDING_APPROVAL`, `ACTIVE`, `SUSPENDED`, `CLOSED` |
| Bakery | Member role | `OWNER`, `MANAGER`, `STAFF` |
| Bakery | Member status | `INVITED`, `ACTIVE`, `INACTIVE` |
| Catalog | Product status | `DRAFT`, `PUBLISHED`, `HIDDEN`, `ARCHIVED` |
| Catalog | Option selection | `SINGLE`, `MULTIPLE` |
| Marketplace | Request type | `OPEN_CUSTOM`, `TARGETED_PRODUCT_CUSTOM` |
| Marketplace | Request status | `DRAFT`, `OPEN`, `OFFER_SELECTED`, `CLOSED`, `CANCELLED` |
| Marketplace | Offer status | `PENDING`, `ACCEPTED`, `REJECTED`, `WITHDRAWN`, `EXPIRED` |
| Order | Order source | `DIRECT_CATALOG`, `ACCEPTED_OFFER` |
| Order | Order status | `PENDING`, `CONFIRMED`, `BAKING`, `READY`, `DELIVERING`, `COMPLETED`, `CANCELLED` |
| Review | Review status | `PUBLISHED`, `HIDDEN`, `DELETED` |
| Chat | Conversation status | `OPEN`, `CLOSED`, `ARCHIVED` |
| Chat | Message type | `TEXT`, `IMAGE`, `FILE`, `SYSTEM` |
| Cake AI | Job status | `QUEUED`, `PROCESSING`, `SUCCEEDED`, `FAILED`, `CANCELLED` |
| Cake AI | Moderation | `PENDING`, `APPROVED`, `REJECTED` |
| Subscription | Plan status | `ACTIVE`, `INACTIVE`, `ARCHIVED` |
| Subscription | Order status | `PENDING_PAYMENT`, `PAYMENT_REVIEW`, `COMPLETED`, `REJECTED`, `CANCELLED`, `EXPIRED` |
| Subscription | Payment status | `SUBMITTED`, `APPROVED`, `REJECTED` |
| Subscription | Period status | `SCHEDULED`, `ACTIVE`, `EXPIRED`, `CANCELLED` |

---

## Endpoint Summary

### Public and User APIs

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/auth/register` | Public | Register customer |
| POST | `/auth/login` | Public | Login and set refresh cookie |
| POST | `/auth/refresh` | Public + cookie | Rotate refresh token |
| POST | `/auth/logout` | Authenticated | Revoke refresh token |
| GET | `/auth/me` | Authenticated | Current profile |
| PATCH | `/users/me` | Authenticated | Update current profile |
| POST | `/users/me/avatar` | Authenticated | Upload avatar |
| DELETE | `/users/me/avatar` | Authenticated | Delete avatar |
| GET | `/users/me/addresses` | Authenticated | List saved addresses |
| POST | `/users/me/addresses` | Authenticated | Create address |
| PATCH | `/users/me/addresses/{addressId}` | Address owner | Update address |
| DELETE | `/users/me/addresses/{addressId}` | Address owner | Delete address |
| PUT | `/users/me/addresses/{addressId}/default` | Address owner | Set default address |
| GET | `/bakeries` | Public | Browse public bakeries |
| GET | `/bakeries/{bakeryId}` | Public | Public bakery detail |
| POST | `/bakeries` | `BAKERY_OWNER` | Create bakery |
| PATCH | `/bakeries/{bakeryId}` | Owner/manager | Update bakery |
| POST | `/bakeries/{bakeryId}/logo` | Owner/manager | Upload logo |
| POST | `/bakeries/{bakeryId}/cover` | Owner/manager | Upload cover |
| PUT | `/bakeries/{bakeryId}/operations` | Owner/manager | Replace operations config |
| POST | `/bakeries/{bakeryId}/submit-for-approval` | Owner | Submit bakery |
| GET | `/bakeries/{bakeryId}/members` | Owner/manager | List members |
| POST | `/bakeries/{bakeryId}/members` | Owner/manager | Add member |
| PATCH | `/bakeries/{bakeryId}/members/{memberId}` | Owner/manager | Update member |
| DELETE | `/bakeries/{bakeryId}/members/{memberId}` | Owner/manager | Remove member |
| GET | `/products` | Public | Search public products |
| GET | `/products/{productId}` | Public | Product detail |
| GET | `/bakeries/{bakeryId}/categories` | Bakery member | List categories |
| POST | `/bakeries/{bakeryId}/categories` | Owner/manager | Create category |
| PATCH | `/bakeries/{bakeryId}/categories/{categoryId}` | Owner/manager | Update category |
| DELETE | `/bakeries/{bakeryId}/categories/{categoryId}` | Owner/manager | Delete category |
| GET | `/bakeries/{bakeryId}/add-ons` | Bakery member | List add-ons |
| POST | `/bakeries/{bakeryId}/add-ons` | Owner/manager | Create add-on |
| PATCH | `/bakeries/{bakeryId}/add-ons/{addOnId}` | Owner/manager | Update add-on |
| POST | `/bakeries/{bakeryId}/add-ons/{addOnId}/image` | Owner/manager | Upload add-on image |
| DELETE | `/bakeries/{bakeryId}/add-ons/{addOnId}` | Owner/manager | Disable add-on |
| GET | `/bakeries/{bakeryId}/products` | Bakery member | Manage product list |
| POST | `/bakeries/{bakeryId}/products` | Owner/manager | Create product |
| PATCH | `/bakeries/{bakeryId}/products/{productId}` | Owner/manager | Update product |
| POST | `/bakeries/{bakeryId}/products/{productId}/images` | Owner/manager | Upload product images |
| DELETE | `/bakeries/{bakeryId}/products/{productId}/images/{imageId}` | Owner/manager | Delete product image |
| PUT | `/bakeries/{bakeryId}/products/{productId}/options` | Owner/manager | Replace product options |
| POST | `/bakeries/{bakeryId}/products/{productId}/publish` | Owner/manager | Publish product |
| POST | `/bakeries/{bakeryId}/products/{productId}/hide` | Owner/manager | Hide product |
| POST | `/bakeries/{bakeryId}/products/{productId}/archive` | Owner/manager | Archive product |
| GET | `/cake-requests` | Authorized context | Search cake requests |
| GET | `/cake-requests/{cakeRequestId}` | Authorized context | Request detail |
| POST | `/cake-requests` | `CUSTOMER` | Create draft request |
| PATCH | `/cake-requests/{cakeRequestId}` | Customer owner | Update draft request |
| POST | `/cake-requests/{cakeRequestId}/images` | Customer owner | Upload request images |
| DELETE | `/cake-requests/{cakeRequestId}/images/{imageId}` | Customer owner | Delete request image |
| PUT | `/cake-requests/{cakeRequestId}/selected-design` | Customer owner | Select AI design |
| POST | `/cake-requests/{cakeRequestId}/publish` | Customer owner | Publish request |
| POST | `/cake-requests/{cakeRequestId}/cancel` | Customer owner | Cancel request |
| GET | `/offers` | Offer participant | List offers |
| GET | `/offers/{offerId}` | Offer participant | Offer detail |
| POST | `/cake-requests/{cakeRequestId}/offers` | Bakery member | Submit offer |
| PATCH | `/offers/{offerId}` | Submitting bakery | Update offer |
| POST | `/offers/{offerId}/withdraw` | Submitting bakery | Withdraw offer |
| POST | `/offers/{offerId}/accept` | Customer owner | Accept offer and create order |
| POST | `/orders/direct` | `CUSTOMER` | Create direct order |
| GET | `/orders` | Order participant | List orders |
| GET | `/orders/{orderId}` | Order participant | Order detail |
| POST | `/orders/{orderId}/status-transitions` | Authorized actor | Transition order |
| POST | `/orders/{orderId}/review` | Customer owner | Create review |
| PATCH | `/orders/{orderId}/review` | Customer owner | Update review |
| DELETE | `/orders/{orderId}/review` | Customer owner | Delete review |
| GET | `/conversations` | Authenticated | List conversations |
| POST | `/conversations` | `CUSTOMER` | Open/get request conversation |
| GET | `/conversations/{conversationId}` | Participant | Conversation detail |
| POST | `/conversations/{conversationId}/close` | Authorized participant | Close conversation |
| GET | `/conversations/{conversationId}/messages` | Participant | Poll message history |
| POST | `/conversations/{conversationId}/messages` | Participant | Send message |
| POST | `/conversations/{conversationId}/read` | Participant | Mark messages read |
| POST | `/generation-jobs` | `CUSTOMER` | Queue AI generation |
| GET | `/generation-jobs` | `CUSTOMER` | List own AI jobs |
| GET | `/generation-jobs/{jobId}` | Owner/admin | AI job detail |
| POST | `/generation-jobs/{jobId}/prompt-revisions` | Customer owner | Refine prompt and queue |
| POST | `/generation-jobs/{jobId}/cancel` | Customer owner | Cancel AI job |
| GET | `/generated-designs/{designId}` | Owner/admin | Design detail |
| GET | `/subscription-plans` | Public | List active plans |
| GET | `/subscription-plans/{planId}` | Public | Plan detail |
| GET | `/bakeries/{bakeryId}/subscription` | Bakery member/admin | Current entitlement |
| POST | `/bakeries/{bakeryId}/subscription-orders` | Owner | Create subscription order |
| GET | `/bakeries/{bakeryId}/subscription-orders` | Bakery member/admin | List subscription orders |
| GET | `/subscription-orders/{orderId}` | Bakery member/admin | Subscription order detail |
| POST | `/subscription-orders/{orderId}/payments` | Owner | Submit payment evidence |

### Administration APIs

| Method | Endpoint | Description |
|---|---|---|
| GET | `/admin/users` | List/filter users |
| GET | `/admin/users/{userId}` | User detail |
| PATCH | `/admin/users/{userId}/status` | Change user status |
| PUT | `/admin/users/{userId}/roles` | Replace platform roles |
| GET | `/admin/bakeries` | Review bakery list |
| GET | `/admin/bakeries/{bakeryId}` | Bakery review detail |
| PATCH | `/admin/bakeries/{bakeryId}/status` | Approve/reject/suspend bakery |
| PATCH | `/admin/reviews/{orderId}/status` | Moderate review |
| PATCH | `/admin/generated-designs/{designId}/moderation` | Moderate AI design |
| GET | `/admin/subscription-plans` | List all plans |
| POST | `/admin/subscription-plans` | Create plan |
| PATCH | `/admin/subscription-plans/{planId}` | Update plan |
| POST | `/admin/subscription-plans/{planId}/archive` | Archive plan |
| GET | `/admin/bakery-payments` | Payment review queue |
| POST | `/admin/bakery-payments/{paymentId}/approve` | Approve and activate subscription |
| POST | `/admin/bakery-payments/{paymentId}/reject` | Reject payment |

### Internal APIs

| Method | Endpoint | Owner | Required scope |
|---|---|---|---|
| GET | `/internal/v1/users/{userId}` | Identity | `identity:user:read` |
| GET | `/internal/v1/users/{userId}/addresses/{addressId}` | Identity | `identity:address:read` |
| GET | `/internal/v1/bakeries/{bakeryId}` | Bakery | `bakery:profile:read` |
| GET | `/internal/v1/bakeries/{bakeryId}/members/{userId}/authorization` | Bakery | `bakery:membership:read` |
| POST | `/internal/v1/catalog/quotes` | Bakery | `bakery:catalog:quote` |
| GET | `/internal/v1/cake-requests/{cakeRequestId}/context` | Marketplace | `marketplace:request:read` |
| GET | `/internal/v1/offers/{offerId}/order-source` | Marketplace | `marketplace:offer:read` |
| POST | `/internal/v1/orders/from-offer` | Order | `order:create-from-offer` |
| GET | `/internal/v1/orders/{orderId}/context` | Order | `order:context:read` |
| GET | `/internal/v1/generated-designs/{designId}/validation` | Cake AI | `cake-ai:design:validate` |
| GET | `/internal/v1/subscriptions/bakeries/{bakeryId}/entitlement` | Subscription | `subscription:entitlement:read` |

---

## Non-Goals for MVP

- Không có payment API cho giao dịch mua bánh giữa customer và bakery.
- Không có invoice/e-invoice API; subscription order không phải hóa đơn thuế.
- Không có WebSocket/SSE chat contract trong MVP.
- Không có generic `/files`; upload luôn thuộc resource/domain cụ thể.
- Không expose CRUD cho status history, refresh token, receipt hoặc snapshot
  tables.
- Không có distributed transaction hoặc endpoint cho phép client tự điều phối
  accept-offer workflow.
