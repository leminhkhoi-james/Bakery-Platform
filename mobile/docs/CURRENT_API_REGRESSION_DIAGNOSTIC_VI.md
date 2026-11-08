# Ma trận hồi quy API trong lần chẩn đoán hiện tại

Inventory 55 operation; HTTP Backend 2xx 55; Android UI transport 2xx 20. Đây không phải 55/55 UI PASS.

Một 2xx xác minh response của operation; kết quả UI/nghiệp vụ cần đọc checkpoint và ảnh tương ứng. Mutation chỉ tạo trên fixture synthetic mới. Không dùng PASS lịch sử.

| Phase | ID | Service | Method / normalized route | Adapter | Backend HTTP | Android UI 2xx |
|---|---|---|---|---|---|---|
| 3 | BKR-001 | bakery | `GET /api/v1/admin/bakeries` | Implemented | 2xx đã xác minh | Có |
| 3 | BKR-002 | bakery | `GET /api/v1/admin/bakeries/{bakeryId}` | Implemented | 2xx đã xác minh | Chưa xác minh qua UI |
| 3 | BKR-003 | bakery | `PATCH /api/v1/admin/bakeries/{bakeryId}/status` | Implemented | 2xx đã xác minh | Chưa xác minh qua UI |
| 1 | BKR-004 | bakery | `GET /api/v1/bakeries` | Implemented | 2xx đã xác minh | Có |
| 3 | BKR-005 | bakery | `POST /api/v1/bakeries` | Implemented | 2xx đã xác minh | Chưa xác minh qua UI |
| 3 | BKR-006 | bakery | `GET /api/v1/bakeries/onboarding` | Implemented | 2xx đã xác minh | Có |
| 3 | BKR-007 | bakery | `POST /api/v1/bakeries/onboarding` | Implemented | 2xx đã xác minh | Chưa xác minh qua UI |
| 1 | BKR-008 | bakery | `GET /api/v1/bakeries/{bakeryId}` | Implemented | 2xx đã xác minh | Có |
| 3 | BKR-009 | bakery | `PATCH /api/v1/bakeries/{bakeryId}` | Implemented | 2xx đã xác minh | Chưa xác minh qua UI |
| 3 | BKR-010 | bakery | `GET /api/v1/bakeries/{bakeryId}/add-ons` | Implemented | 2xx đã xác minh | Có |
| 3 | BKR-011 | bakery | `POST /api/v1/bakeries/{bakeryId}/add-ons` | Implemented | 2xx đã xác minh | Chưa xác minh qua UI |
| 3 | BKR-012 | bakery | `DELETE /api/v1/bakeries/{bakeryId}/add-ons/{addOnId}` | Implemented | 2xx đã xác minh | Chưa xác minh qua UI |
| 3 | BKR-013 | bakery | `PATCH /api/v1/bakeries/{bakeryId}/add-ons/{addOnId}` | Implemented | 2xx đã xác minh | Chưa xác minh qua UI |
| 3 | BKR-014 | bakery | `POST /api/v1/bakeries/{bakeryId}/add-ons/{addOnId}/image` | Implemented | 2xx đã xác minh | Chưa xác minh qua UI |
| 3 | BKR-015 | bakery | `GET /api/v1/bakeries/{bakeryId}/categories` | Implemented | 2xx đã xác minh | Có |
| 3 | BKR-016 | bakery | `POST /api/v1/bakeries/{bakeryId}/categories` | Implemented | 2xx đã xác minh | Chưa xác minh qua UI |
| 3 | BKR-017 | bakery | `DELETE /api/v1/bakeries/{bakeryId}/categories/{categoryId}` | Implemented | 2xx đã xác minh | Chưa xác minh qua UI |
| 3 | BKR-018 | bakery | `PATCH /api/v1/bakeries/{bakeryId}/categories/{categoryId}` | Implemented | 2xx đã xác minh | Chưa xác minh qua UI |
| 3 | BKR-019 | bakery | `POST /api/v1/bakeries/{bakeryId}/cover` | Implemented | 2xx đã xác minh | Chưa xác minh qua UI |
| 3 | BKR-020 | bakery | `POST /api/v1/bakeries/{bakeryId}/logo` | Implemented | 2xx đã xác minh | Chưa xác minh qua UI |
| 3 | BKR-021 | bakery | `GET /api/v1/bakeries/{bakeryId}/members` | Implemented | 2xx đã xác minh | Chưa xác minh qua UI |
| 3 | BKR-022 | bakery | `POST /api/v1/bakeries/{bakeryId}/onboarding/complete` | Implemented | 2xx đã xác minh | Chưa xác minh qua UI |
| 3 | BKR-023 | bakery | `PUT /api/v1/bakeries/{bakeryId}/operations` | Implemented | 2xx đã xác minh | Chưa xác minh qua UI |
| 3 | BKR-024 | bakery | `GET /api/v1/bakeries/{bakeryId}/products` | Implemented | 2xx đã xác minh | Có |
| 3 | BKR-025 | bakery | `POST /api/v1/bakeries/{bakeryId}/products` | Implemented | 2xx đã xác minh | Chưa xác minh qua UI |
| 3 | BKR-026 | bakery | `PATCH /api/v1/bakeries/{bakeryId}/products/{productId}` | Implemented | 2xx đã xác minh | Chưa xác minh qua UI |
| 3 | BKR-027 | bakery | `POST /api/v1/bakeries/{bakeryId}/products/{productId}/archive` | Implemented | 2xx đã xác minh | Chưa xác minh qua UI |
| 3 | BKR-028 | bakery | `POST /api/v1/bakeries/{bakeryId}/products/{productId}/hide` | Implemented | 2xx đã xác minh | Chưa xác minh qua UI |
| 3 | BKR-029 | bakery | `POST /api/v1/bakeries/{bakeryId}/products/{productId}/images` | Implemented | 2xx đã xác minh | Chưa xác minh qua UI |
| 3 | BKR-030 | bakery | `DELETE /api/v1/bakeries/{bakeryId}/products/{productId}/images/{imageId}` | Implemented | 2xx đã xác minh | Chưa xác minh qua UI |
| 3 | BKR-031 | bakery | `PUT /api/v1/bakeries/{bakeryId}/products/{productId}/options` | Implemented | 2xx đã xác minh | Chưa xác minh qua UI |
| 3 | BKR-032 | bakery | `POST /api/v1/bakeries/{bakeryId}/products/{productId}/publish` | Implemented | 2xx đã xác minh | Chưa xác minh qua UI |
| 3 | BKR-033 | bakery | `POST /api/v1/bakeries/{bakeryId}/submit-for-approval` | Implemented | 2xx đã xác minh | Chưa xác minh qua UI |
| 1 | BKR-034 | bakery | `GET /api/v1/products` | Implemented | 2xx đã xác minh | Có |
| 1 | BKR-035 | bakery | `GET /api/v1/products/{productId}` | Implemented | 2xx đã xác minh | Có |
| 2 | IDN-002 | identity | `POST /api/v1/auth/login` | Implemented | 2xx đã xác minh | Có |
| 2 | IDN-003 | identity | `POST /api/v1/auth/logout` | Implemented | 2xx đã xác minh | Có |
| 2 | IDN-004 | identity | `GET /api/v1/auth/me` | Implemented | 2xx đã xác minh | Có |
| 2 | IDN-005 | identity | `POST /api/v1/auth/refresh` | Implemented | 2xx đã xác minh | Có |
| 2 | IDN-006 | identity | `POST /api/v1/auth/register` | Implemented | 2xx đã xác minh | Có |
| 4 | SUB-001 | subscription | `GET /api/v1/admin/bakery-payments` | Implemented | 2xx đã xác minh | Có |
| 4 | SUB-002 | subscription | `POST /api/v1/admin/bakery-payments/{paymentId}/approve` | Implemented | 2xx đã xác minh | Chưa xác minh qua UI |
| 4 | SUB-003 | subscription | `POST /api/v1/admin/bakery-payments/{paymentId}/reject` | Implemented | 2xx đã xác minh | Chưa xác minh qua UI |
| 4 | SUB-004 | subscription | `GET /api/v1/admin/subscription-plans` | Implemented | 2xx đã xác minh | Có |
| 4 | SUB-005 | subscription | `POST /api/v1/admin/subscription-plans` | Implemented | 2xx đã xác minh | Chưa xác minh qua UI |
| 4 | SUB-006 | subscription | `PATCH /api/v1/admin/subscription-plans/{planId}` | Implemented | 2xx đã xác minh | Chưa xác minh qua UI |
| 4 | SUB-007 | subscription | `POST /api/v1/admin/subscription-plans/{planId}/archive` | Implemented | 2xx đã xác minh | Chưa xác minh qua UI |
| 4 | SUB-008 | subscription | `GET /api/v1/bakeries/{bakeryId}/subscription` | Implemented | 2xx đã xác minh | Có |
| 4 | SUB-009 | subscription | `GET /api/v1/bakeries/{bakeryId}/subscription-orders` | Implemented | 2xx đã xác minh | Có |
| 4 | SUB-010 | subscription | `POST /api/v1/bakeries/{bakeryId}/subscription-orders` | Implemented | 2xx đã xác minh | Chưa xác minh qua UI |
| 4 | SUB-011 | subscription | `GET /api/v1/subscription-orders/{orderId}` | Implemented | 2xx đã xác minh | Chưa xác minh qua UI |
| 4 | SUB-012 | subscription | `POST /api/v1/subscription-orders/{orderId}/payments` | Implemented | 2xx đã xác minh | Chưa xác minh qua UI |
| 1 | SUB-013 | subscription | `GET /api/v1/subscription-plans` | Implemented | 2xx đã xác minh | Có |
| 4 | SUB-014 | subscription | `GET /api/v1/subscription-plans/payment-options` | Implemented | 2xx đã xác minh | Chưa xác minh qua UI |
| 1 | SUB-015 | subscription | `GET /api/v1/subscription-plans/{planId}` | Implemented | 2xx đã xác minh | Có |

Bằng chứng: [Backend](evidence/docker-api-diagnostic/backend-regression.json), [coverage máy đọc](evidence/docker-api-diagnostic/current-api-coverage.json), các `*-ui.json` và screenshot trong cùng thư mục evidence. Các checkpoint backend kiểm tra Owner activation, media byte hash, SCHEDULED và snapshot giá; không suy ra mọi nhánh/validation/permission đều được kiểm thử.
