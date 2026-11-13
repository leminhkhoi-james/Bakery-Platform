# Xác thực, phân quyền và bảo mật Backend

Access JWT RS256 ký bằng RSA hiện hữu, kiểm issuer/audience/time và token_type; user roles chuyển ROLE_, service scopes chuyển SCOPE_. Đọc nguồn decoder từng service: shared ResourceSecurityConfiguration được Marketplace/Cake AI import; Bakery/Subscription/Order/Chat có policy riêng. JWKS chỉ public key, refresh token opaque lưu hash SHA-256 và BCrypt password/service secrets. Không có HMAC secret được tự sinh hay key rotation trong audit.

## Ma trận quyền mọi operation


| API | Method / route | Quyền và resource boundary |
|---|---|---|
| BKR-001 | GET /api/v1/admin/bakeries | User JWT ADMIN; không suy ra ADMIN có quyền ownership ở các endpoint owner ngoài /admin/. |
| BKR-002 | GET /api/v1/admin/bakeries/{bakeryId} | User JWT ADMIN; không suy ra ADMIN có quyền ownership ở các endpoint owner ngoài /admin/. |
| BKR-003 | PATCH /api/v1/admin/bakeries/{bakeryId}/status | User JWT ADMIN; không suy ra ADMIN có quyền ownership ở các endpoint owner ngoài /admin/. |
| BKR-004 | GET /api/v1/bakeries | Public GET; nếu gửi Bearer sai thì Resource Server vẫn có thể 401 trước permitAll. |
| BKR-005 | POST /api/v1/bakeries | User JWT BAKERY_OWNER; route có bakeryId kiểm membership ACTIVE/OWNER trong DB. Endpoint create kiểm role, service gọi Identity user. |
| BKR-006 | GET /api/v1/bakeries/onboarding | User JWT CUSTOMER và membership phù hợp cho onboarding. |
| BKR-007 | POST /api/v1/bakeries/onboarding | User JWT CUSTOMER và membership phù hợp cho onboarding. |
| BKR-008 | GET /api/v1/bakeries/{bakeryId} | Public GET; nếu gửi Bearer sai thì Resource Server vẫn có thể 401 trước permitAll. |
| BKR-009 | PATCH /api/v1/bakeries/{bakeryId} | User JWT BAKERY_OWNER; route có bakeryId kiểm membership ACTIVE/OWNER trong DB. Endpoint create kiểm role, service gọi Identity user. |
| BKR-010 | GET /api/v1/bakeries/{bakeryId}/add-ons | User JWT BAKERY_OWNER; route có bakeryId kiểm membership ACTIVE/OWNER trong DB. Endpoint create kiểm role, service gọi Identity user. |
| BKR-011 | POST /api/v1/bakeries/{bakeryId}/add-ons | User JWT BAKERY_OWNER; route có bakeryId kiểm membership ACTIVE/OWNER trong DB. Endpoint create kiểm role, service gọi Identity user. |
| BKR-012 | DELETE /api/v1/bakeries/{bakeryId}/add-ons/{addOnId} | User JWT BAKERY_OWNER; route có bakeryId kiểm membership ACTIVE/OWNER trong DB. Endpoint create kiểm role, service gọi Identity user. |
| BKR-013 | PATCH /api/v1/bakeries/{bakeryId}/add-ons/{addOnId} | User JWT BAKERY_OWNER; route có bakeryId kiểm membership ACTIVE/OWNER trong DB. Endpoint create kiểm role, service gọi Identity user. |
| BKR-014 | POST /api/v1/bakeries/{bakeryId}/add-ons/{addOnId}/image | User JWT BAKERY_OWNER; route có bakeryId kiểm membership ACTIVE/OWNER trong DB. Endpoint create kiểm role, service gọi Identity user. |
| BKR-015 | GET /api/v1/bakeries/{bakeryId}/categories | User JWT BAKERY_OWNER; route có bakeryId kiểm membership ACTIVE/OWNER trong DB. Endpoint create kiểm role, service gọi Identity user. |
| BKR-016 | POST /api/v1/bakeries/{bakeryId}/categories | User JWT BAKERY_OWNER; route có bakeryId kiểm membership ACTIVE/OWNER trong DB. Endpoint create kiểm role, service gọi Identity user. |
| BKR-017 | DELETE /api/v1/bakeries/{bakeryId}/categories/{categoryId} | User JWT BAKERY_OWNER; route có bakeryId kiểm membership ACTIVE/OWNER trong DB. Endpoint create kiểm role, service gọi Identity user. |
| BKR-018 | PATCH /api/v1/bakeries/{bakeryId}/categories/{categoryId} | User JWT BAKERY_OWNER; route có bakeryId kiểm membership ACTIVE/OWNER trong DB. Endpoint create kiểm role, service gọi Identity user. |
| BKR-019 | POST /api/v1/bakeries/{bakeryId}/cover | User JWT BAKERY_OWNER; route có bakeryId kiểm membership ACTIVE/OWNER trong DB. Endpoint create kiểm role, service gọi Identity user. |
| BKR-020 | POST /api/v1/bakeries/{bakeryId}/logo | User JWT BAKERY_OWNER; route có bakeryId kiểm membership ACTIVE/OWNER trong DB. Endpoint create kiểm role, service gọi Identity user. |
| BKR-021 | GET /api/v1/bakeries/{bakeryId}/members | User JWT BAKERY_OWNER; route có bakeryId kiểm membership ACTIVE/OWNER trong DB. Endpoint create kiểm role, service gọi Identity user. |
| BKR-022 | POST /api/v1/bakeries/{bakeryId}/onboarding/complete | User JWT CUSTOMER và membership phù hợp cho onboarding. |
| BKR-023 | PUT /api/v1/bakeries/{bakeryId}/operations | User JWT BAKERY_OWNER; route có bakeryId kiểm membership ACTIVE/OWNER trong DB. Endpoint create kiểm role, service gọi Identity user. |
| BKR-024 | GET /api/v1/bakeries/{bakeryId}/products | User JWT BAKERY_OWNER; route có bakeryId kiểm membership ACTIVE/OWNER trong DB. Endpoint create kiểm role, service gọi Identity user. |
| BKR-025 | POST /api/v1/bakeries/{bakeryId}/products | User JWT BAKERY_OWNER; route có bakeryId kiểm membership ACTIVE/OWNER trong DB. Endpoint create kiểm role, service gọi Identity user. |
| BKR-026 | PATCH /api/v1/bakeries/{bakeryId}/products/{productId} | User JWT BAKERY_OWNER; route có bakeryId kiểm membership ACTIVE/OWNER trong DB. Endpoint create kiểm role, service gọi Identity user. |
| BKR-027 | POST /api/v1/bakeries/{bakeryId}/products/{productId}/archive | User JWT BAKERY_OWNER; route có bakeryId kiểm membership ACTIVE/OWNER trong DB. Endpoint create kiểm role, service gọi Identity user. |
| BKR-028 | POST /api/v1/bakeries/{bakeryId}/products/{productId}/hide | User JWT BAKERY_OWNER; route có bakeryId kiểm membership ACTIVE/OWNER trong DB. Endpoint create kiểm role, service gọi Identity user. |
| BKR-029 | POST /api/v1/bakeries/{bakeryId}/products/{productId}/images | User JWT BAKERY_OWNER; route có bakeryId kiểm membership ACTIVE/OWNER trong DB. Endpoint create kiểm role, service gọi Identity user. |
| BKR-030 | DELETE /api/v1/bakeries/{bakeryId}/products/{productId}/images/{imageId} | User JWT BAKERY_OWNER; route có bakeryId kiểm membership ACTIVE/OWNER trong DB. Endpoint create kiểm role, service gọi Identity user. |
| BKR-031 | PUT /api/v1/bakeries/{bakeryId}/products/{productId}/options | User JWT BAKERY_OWNER; route có bakeryId kiểm membership ACTIVE/OWNER trong DB. Endpoint create kiểm role, service gọi Identity user. |
| BKR-032 | POST /api/v1/bakeries/{bakeryId}/products/{productId}/publish | User JWT BAKERY_OWNER; route có bakeryId kiểm membership ACTIVE/OWNER trong DB. Endpoint create kiểm role, service gọi Identity user. |
| BKR-033 | POST /api/v1/bakeries/{bakeryId}/submit-for-approval | User JWT BAKERY_OWNER; route có bakeryId kiểm membership ACTIVE/OWNER trong DB. Endpoint create kiểm role, service gọi Identity user. |
| BKR-034 | GET /api/v1/products | Public GET; nếu gửi Bearer sai thì Resource Server vẫn có thể 401 trước permitAll. |
| BKR-035 | GET /api/v1/products/{productId} | Public GET; nếu gửi Bearer sai thì Resource Server vẫn có thể 401 trước permitAll. |
| BKR-036 | GET /internal/v1/bakeries/{bakeryId} | Service JWT đúng issuer/audience/token_type và scope của method/security matcher; không dùng user JWT. X-Correlation-Id bắt buộc tại matcher chuyên biệt Bakery/Subscription/Order; xem nguyên văn policy bên dưới. |
| BKR-037 | GET /internal/v1/bakeries/{bakeryId}/members/{userId}/authorization | Service JWT đúng issuer/audience/token_type và scope của method/security matcher; không dùng user JWT. X-Correlation-Id bắt buộc tại matcher chuyên biệt Bakery/Subscription/Order; xem nguyên văn policy bên dưới. |
| BKR-038 | PUT /internal/v1/bakeries/{bakeryId}/onboarding/activate | Service JWT đúng issuer/audience/token_type và scope của method/security matcher; không dùng user JWT. X-Correlation-Id bắt buộc tại matcher chuyên biệt Bakery/Subscription/Order; xem nguyên văn policy bên dưới. |
| BKR-039 | POST /internal/v1/catalog/add-on-quotes | Service JWT đúng issuer/audience/token_type và scope của method/security matcher; không dùng user JWT. X-Correlation-Id bắt buộc tại matcher chuyên biệt Bakery/Subscription/Order; xem nguyên văn policy bên dưới. |
| BKR-040 | POST /internal/v1/catalog/customization-quotes | Service JWT đúng issuer/audience/token_type và scope của method/security matcher; không dùng user JWT. X-Correlation-Id bắt buộc tại matcher chuyên biệt Bakery/Subscription/Order; xem nguyên văn policy bên dưới. |
| BKR-041 | POST /internal/v1/catalog/quotes | Service JWT đúng issuer/audience/token_type và scope của method/security matcher; không dùng user JWT. X-Correlation-Id bắt buộc tại matcher chuyên biệt Bakery/Subscription/Order; xem nguyên văn policy bên dưới. |
| BKR-042 | GET /internal/v1/users/{userId}/bakery-memberships | Service JWT đúng issuer/audience/token_type và scope của method/security matcher; không dùng user JWT. X-Correlation-Id bắt buộc tại matcher chuyên biệt Bakery/Subscription/Order; xem nguyên văn policy bên dưới. |
| CAI-001 | PATCH /api/v1/admin/generated-designs/{id}/moderation | User JWT ADMIN; không suy ra ADMIN có quyền ownership ở các endpoint owner ngoài /admin/. |
| CAI-002 | GET /api/v1/generated-designs/{id} | User JWT; actor/customer/owner/admin và resource visibility kiểm trong service. @PreAuthorize("hasAnyRole('CUSTOMER','ADMIN')") |
| CAI-003 | GET /api/v1/generation-jobs | User JWT; actor/customer/owner/admin và resource visibility kiểm trong service. @PreAuthorize("hasRole('CUSTOMER')") |
| CAI-004 | POST /api/v1/generation-jobs | User JWT; actor/customer/owner/admin và resource visibility kiểm trong service. @PreAuthorize("hasRole('CUSTOMER')") |
| CAI-005 | GET /api/v1/generation-jobs/{id} | User JWT; actor/customer/owner/admin và resource visibility kiểm trong service. @PreAuthorize("hasAnyRole('CUSTOMER','ADMIN')"); @PreAuthorize("hasRole('CUSTOMER')") |
| CAI-006 | POST /api/v1/generation-jobs/{id}/cancel | User JWT; actor/customer/owner/admin và resource visibility kiểm trong service. @PreAuthorize("hasRole('CUSTOMER')") |
| CAI-007 | POST /api/v1/generation-jobs/{id}/prompt-revisions | User JWT; actor/customer/owner/admin và resource visibility kiểm trong service. @PreAuthorize("hasRole('CUSTOMER')") |
| CAI-008 | GET /internal/v1/cake-requests/{id}/generation-context | Service JWT đúng issuer/audience/token_type và scope của method/security matcher; không dùng user JWT. X-Correlation-Id bắt buộc tại matcher chuyên biệt Bakery/Subscription/Order; xem nguyên văn policy bên dưới. |
| CAI-009 | GET /internal/v1/generated-designs/{id}/validation | Service JWT đúng issuer/audience/token_type và scope của method/security matcher; không dùng user JWT. X-Correlation-Id bắt buộc tại matcher chuyên biệt Bakery/Subscription/Order; xem nguyên văn policy bên dưới. |
| CHT-001 | GET /api/v1/conversations | User JWT; create cần CUSTOMER; close CUSTOMER/BAKERY_OWNER. Các thao tác kiểm participant hoặc active OWNER qua Bakery; foreign customer thường 404. |
| CHT-002 | POST /api/v1/conversations | User JWT; create cần CUSTOMER; close CUSTOMER/BAKERY_OWNER. Các thao tác kiểm participant hoặc active OWNER qua Bakery; foreign customer thường 404. |
| CHT-003 | GET /api/v1/conversations/{conversationId} | User JWT; create cần CUSTOMER; close CUSTOMER/BAKERY_OWNER. Các thao tác kiểm participant hoặc active OWNER qua Bakery; foreign customer thường 404. |
| CHT-004 | POST /api/v1/conversations/{conversationId}/close | User JWT; create cần CUSTOMER; close CUSTOMER/BAKERY_OWNER. Các thao tác kiểm participant hoặc active OWNER qua Bakery; foreign customer thường 404. |
| CHT-005 | GET /api/v1/conversations/{conversationId}/messages | User JWT; create cần CUSTOMER; close CUSTOMER/BAKERY_OWNER. Các thao tác kiểm participant hoặc active OWNER qua Bakery; foreign customer thường 404. |
| CHT-006 | POST /api/v1/conversations/{conversationId}/messages | User JWT; create cần CUSTOMER; close CUSTOMER/BAKERY_OWNER. Các thao tác kiểm participant hoặc active OWNER qua Bakery; foreign customer thường 404. |
| CHT-007 | DELETE /api/v1/conversations/{conversationId}/messages/{messageId} | User JWT; create cần CUSTOMER; close CUSTOMER/BAKERY_OWNER. Các thao tác kiểm participant hoặc active OWNER qua Bakery; foreign customer thường 404. |
| CHT-008 | POST /api/v1/conversations/{conversationId}/read | User JWT; create cần CUSTOMER; close CUSTOMER/BAKERY_OWNER. Các thao tác kiểm participant hoặc active OWNER qua Bakery; foreign customer thường 404. |
| IDN-001 | GET /.well-known/jwks.json | Không cần access JWT; login/register vẫn validation; refresh yêu cầu cookie hợp lệ. |
| IDN-002 | POST /api/v1/auth/login | Không cần access JWT; login/register vẫn validation; refresh yêu cầu cookie hợp lệ. |
| IDN-003 | POST /api/v1/auth/logout | User JWT; actor/customer/owner/admin và resource visibility kiểm trong service. Xem policy method và Actor/Access trong trace. |
| IDN-004 | GET /api/v1/auth/me | User JWT; actor/customer/owner/admin và resource visibility kiểm trong service. Xem policy method và Actor/Access trong trace. |
| IDN-005 | POST /api/v1/auth/refresh | Không cần access JWT; login/register vẫn validation; refresh yêu cầu cookie hợp lệ. |
| IDN-006 | POST /api/v1/auth/register | Không cần access JWT; login/register vẫn validation; refresh yêu cầu cookie hợp lệ. |
| IDN-007 | POST /internal/v1/auth/service-token | Không cần Bearer ở filter; body clientId/clientSecret + audience/scope được ServiceTokenService xác thực. |
| IDN-008 | GET /internal/v1/users/{id} | Service JWT đúng issuer/audience/token_type và scope của method/security matcher; không dùng user JWT. X-Correlation-Id bắt buộc tại matcher chuyên biệt Bakery/Subscription/Order; xem nguyên văn policy bên dưới. |
| IDN-009 | PUT /internal/v1/users/{id}/bakery-owner | Service JWT đúng issuer/audience/token_type và scope của method/security matcher; không dùng user JWT. X-Correlation-Id bắt buộc tại matcher chuyên biệt Bakery/Subscription/Order; xem nguyên văn policy bên dưới. |
| IDN-010 | GET /internal/v1/users/{userId}/addresses/{addressId} | Service JWT đúng issuer/audience/token_type và scope của method/security matcher; không dùng user JWT. X-Correlation-Id bắt buộc tại matcher chuyên biệt Bakery/Subscription/Order; xem nguyên văn policy bên dưới. |
| MKT-001 | GET /api/v1/cake-requests | User JWT; actor/customer/owner/admin và resource visibility kiểm trong service. Xem policy method và Actor/Access trong trace. |
| MKT-002 | POST /api/v1/cake-requests | User JWT; actor/customer/owner/admin và resource visibility kiểm trong service. Xem policy method và Actor/Access trong trace. |
| MKT-003 | GET /api/v1/cake-requests/{id} | User JWT; actor/customer/owner/admin và resource visibility kiểm trong service. Xem policy method và Actor/Access trong trace. |
| MKT-004 | PATCH /api/v1/cake-requests/{id} | User JWT; actor/customer/owner/admin và resource visibility kiểm trong service. Xem policy method và Actor/Access trong trace. |
| MKT-005 | POST /api/v1/cake-requests/{id}/cancel | User JWT; actor/customer/owner/admin và resource visibility kiểm trong service. Xem policy method và Actor/Access trong trace. |
| MKT-006 | POST /api/v1/cake-requests/{id}/images | User JWT; actor/customer/owner/admin và resource visibility kiểm trong service. Xem policy method và Actor/Access trong trace. |
| MKT-007 | DELETE /api/v1/cake-requests/{id}/images/{imageId} | User JWT; actor/customer/owner/admin và resource visibility kiểm trong service. Xem policy method và Actor/Access trong trace. |
| MKT-008 | POST /api/v1/cake-requests/{id}/offers | User JWT; actor/customer/owner/admin và resource visibility kiểm trong service. Xem policy method và Actor/Access trong trace. |
| MKT-009 | POST /api/v1/cake-requests/{id}/publish | User JWT; actor/customer/owner/admin và resource visibility kiểm trong service. Xem policy method và Actor/Access trong trace. |
| MKT-010 | PUT /api/v1/cake-requests/{id}/selected-design | User JWT; actor/customer/owner/admin và resource visibility kiểm trong service. Xem policy method và Actor/Access trong trace. |
| MKT-011 | GET /api/v1/offers | User JWT; actor/customer/owner/admin và resource visibility kiểm trong service. Xem policy method và Actor/Access trong trace. |
| MKT-012 | GET /api/v1/offers/{id} | User JWT; actor/customer/owner/admin và resource visibility kiểm trong service. Xem policy method và Actor/Access trong trace. |
| MKT-013 | PATCH /api/v1/offers/{id} | User JWT; actor/customer/owner/admin và resource visibility kiểm trong service. Xem policy method và Actor/Access trong trace. |
| MKT-014 | POST /api/v1/offers/{id}/accept | User JWT; actor/customer/owner/admin và resource visibility kiểm trong service. Xem policy method và Actor/Access trong trace. |
| MKT-015 | POST /api/v1/offers/{id}/withdraw | User JWT; actor/customer/owner/admin và resource visibility kiểm trong service. Xem policy method và Actor/Access trong trace. |
| MKT-016 | GET /internal/v1/cake-requests/{id}/chat-authorization | Service JWT đúng issuer/audience/token_type và scope của method/security matcher; không dùng user JWT. X-Correlation-Id bắt buộc tại matcher chuyên biệt Bakery/Subscription/Order; xem nguyên văn policy bên dưới. |
| MKT-017 | GET /internal/v1/cake-requests/{id}/context | Service JWT đúng issuer/audience/token_type và scope của method/security matcher; không dùng user JWT. X-Correlation-Id bắt buộc tại matcher chuyên biệt Bakery/Subscription/Order; xem nguyên văn policy bên dưới. |
| MKT-018 | GET /internal/v1/offers/{id}/order-source | Service JWT đúng issuer/audience/token_type và scope của method/security matcher; không dùng user JWT. X-Correlation-Id bắt buộc tại matcher chuyên biệt Bakery/Subscription/Order; xem nguyên văn policy bên dưới. |
| ORD-001 | PATCH /api/v1/admin/reviews/{orderId}/status | User JWT ADMIN; không suy ra ADMIN có quyền ownership ở các endpoint owner ngoài /admin/. |
| ORD-002 | GET /api/v1/orders | User JWT; actor/customer/owner/admin và resource visibility kiểm trong service. Xem policy method và Actor/Access trong trace. |
| ORD-003 | POST /api/v1/orders/direct | User JWT; actor/customer/owner/admin và resource visibility kiểm trong service. Xem policy method và Actor/Access trong trace. |
| ORD-004 | GET /api/v1/orders/{orderId} | User JWT; actor/customer/owner/admin và resource visibility kiểm trong service. Xem policy method và Actor/Access trong trace. |
| ORD-005 | DELETE /api/v1/orders/{orderId}/review | User JWT; actor/customer/owner/admin và resource visibility kiểm trong service. Xem policy method và Actor/Access trong trace. |
| ORD-006 | PATCH /api/v1/orders/{orderId}/review | User JWT; actor/customer/owner/admin và resource visibility kiểm trong service. Xem policy method và Actor/Access trong trace. |
| ORD-007 | POST /api/v1/orders/{orderId}/review | User JWT; actor/customer/owner/admin và resource visibility kiểm trong service. Xem policy method và Actor/Access trong trace. |
| ORD-008 | POST /api/v1/orders/{orderId}/status-transitions | User JWT; actor/customer/owner/admin và resource visibility kiểm trong service. Xem policy method và Actor/Access trong trace. |
| ORD-009 | POST /internal/v1/orders/from-offer | Service JWT đúng issuer/audience/token_type và scope của method/security matcher; không dùng user JWT. X-Correlation-Id bắt buộc tại matcher chuyên biệt Bakery/Subscription/Order; xem nguyên văn policy bên dưới. |
| ORD-010 | GET /internal/v1/orders/{orderId}/context | Service JWT đúng issuer/audience/token_type và scope của method/security matcher; không dùng user JWT. X-Correlation-Id bắt buộc tại matcher chuyên biệt Bakery/Subscription/Order; xem nguyên văn policy bên dưới. |
| SUB-001 | GET /api/v1/admin/bakery-payments | User JWT ADMIN; không suy ra ADMIN có quyền ownership ở các endpoint owner ngoài /admin/. |
| SUB-002 | POST /api/v1/admin/bakery-payments/{paymentId}/approve | User JWT ADMIN; không suy ra ADMIN có quyền ownership ở các endpoint owner ngoài /admin/. |
| SUB-003 | POST /api/v1/admin/bakery-payments/{paymentId}/reject | User JWT ADMIN; không suy ra ADMIN có quyền ownership ở các endpoint owner ngoài /admin/. |
| SUB-004 | GET /api/v1/admin/subscription-plans | User JWT ADMIN; không suy ra ADMIN có quyền ownership ở các endpoint owner ngoài /admin/. |
| SUB-005 | POST /api/v1/admin/subscription-plans | User JWT ADMIN; không suy ra ADMIN có quyền ownership ở các endpoint owner ngoài /admin/. |
| SUB-006 | PATCH /api/v1/admin/subscription-plans/{planId} | User JWT ADMIN; không suy ra ADMIN có quyền ownership ở các endpoint owner ngoài /admin/. |
| SUB-007 | POST /api/v1/admin/subscription-plans/{planId}/archive | User JWT ADMIN; không suy ra ADMIN có quyền ownership ở các endpoint owner ngoài /admin/. |
| SUB-008 | GET /api/v1/bakeries/{bakeryId}/subscription | User JWT CUSTOMER/BAKERY_OWNER; read có ADMIN. Quyền bakery còn kiểm BakeryAccessClient, không chỉ role trong JWT. |
| SUB-009 | GET /api/v1/bakeries/{bakeryId}/subscription-orders | User JWT CUSTOMER/BAKERY_OWNER; read có ADMIN. Quyền bakery còn kiểm BakeryAccessClient, không chỉ role trong JWT. |
| SUB-010 | POST /api/v1/bakeries/{bakeryId}/subscription-orders | User JWT CUSTOMER/BAKERY_OWNER; read có ADMIN. Quyền bakery còn kiểm BakeryAccessClient, không chỉ role trong JWT. |
| SUB-011 | GET /api/v1/subscription-orders/{orderId} | User JWT CUSTOMER/BAKERY_OWNER; read có ADMIN. Quyền bakery còn kiểm BakeryAccessClient, không chỉ role trong JWT. |
| SUB-012 | POST /api/v1/subscription-orders/{orderId}/payments | User JWT CUSTOMER/BAKERY_OWNER; read có ADMIN. Quyền bakery còn kiểm BakeryAccessClient, không chỉ role trong JWT. |
| SUB-013 | GET /api/v1/subscription-plans | Public GET; nếu gửi Bearer sai thì Resource Server vẫn có thể 401 trước permitAll. |
| SUB-014 | GET /api/v1/subscription-plans/payment-options | Public GET; nếu gửi Bearer sai thì Resource Server vẫn có thể 401 trước permitAll. |
| SUB-015 | GET /api/v1/subscription-plans/{planId} | Public GET; nếu gửi Bearer sai thì Resource Server vẫn có thể 401 trước permitAll. |
| SUB-016 | GET /internal/v1/subscriptions/bakeries/{bakeryId}/entitlement | Service JWT đúng issuer/audience/token_type và scope của method/security matcher; không dùng user JWT. X-Correlation-Id bắt buộc tại matcher chuyên biệt Bakery/Subscription/Order; xem nguyên văn policy bên dưới. |


## Quy tắc bảo mật và các giới hạn xác minh

Cookie refresh HttpOnly, SameSite=Lax, Path=/api/v1/auth; Secure mặc định bật. Chỉ stack loopback audit tắt Secure để kiểm HTTP; đây không phải khuyến nghị cho bản triển khai thật. Flutter native cần cookie jar và lưu session an toàn, body không có refreshToken. CSRF bị tắt; CORS Identity cho origin cấu hình với credentials; CORS không là lớp authorization cho native client.

Tài khoản ACTIVE được kiểm ở login/refresh và internal getUser. Resource Server không truy vấn Identity mỗi request nên logout/đổi role/status không thu hồi JWT tức thì. Không tìm thấy rate limiting/OTP/forgot password/email verification hoặc API quản lý address/profile công khai trong inventory hiện tại. Không báo các tính năng UI demo là API đã có.

401 token sai khác 403 quyền thiếu; owner cùng role nhưng foreign bakery/customer phải bị chặn. X-Correlation-Id bắt buộc tại các service matcher nội bộ chuyên biệt. Shared platform internal policy chỉ yêu cầu service token, scope do @PreAuthorize cụ thể; không áp một quy tắc correlation đồng nhất cho mọi service.

Storage signed URLs có hạn; metadata trả URL cần refresh bằng API, không lưu URL như object key. Response Order có snapshot tên/điện thoại/địa chỉ nên chỉ đọc đúng customer/bakery/admin. File uploads có validator theo loại, byte size và image decode; xem nguồn được đính kèm dưới đây.

Bằng chứng runtime: foreign bakery patch403, customer khác đọc order404, service thiếu correlation403, user JWT gọi internal bị chặn; refresh replay revoke family PASS. Không thực hiện pentest tải lớn, key compromise, XSS, brute force hay truy cập cloud thật. Không suy ra đã kiểm hết security chỉ từ những case này.

## Chính sách nguồn đầy đủ

### SecurityConfig.java — bakery-service

[SecurityConfig.java:1](../../backend/bakery-service/src/main/java/com/se193262/bakeryservice/security/SecurityConfig.java#L1)

```java
1: package com.se193262.bakeryservice.security;
2: 
29: 
32: 
33: @Configuration
34: @EnableWebSecurity
35: @EnableMethodSecurity
36: public class SecurityConfig {
37: 
38:     private final BakeryMemberRepository memberRepository;
39:     private final String serviceAudience;
40: 
41:     public SecurityConfig(BakeryMemberRepository memberRepository,
42:             @Value("${security.jwt.service-audience:bakery-service}") String serviceAudience) {
43:         this.memberRepository = memberRepository;
44:         this.serviceAudience = serviceAudience;
45:     }
46: 
47:     @Bean
48:     SecurityFilterChain securityFilterChain(HttpSecurity http,
49:             JwtAuthenticationConverter jwtAuthenticationConverter,
50:             AuthenticationEntryPoint authenticationEntryPoint,
51:             AccessDeniedHandler accessDeniedHandler) throws Exception {
52:         http
53:                 .csrf(csrf -> csrf.disable())
54:                 .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
55:                 .authorizeHttpRequests(authorize -> authorize
56:                         .requestMatchers(HttpMethod.GET, "/api/v1/bakeries/onboarding")
57:                         .access(userRole("CUSTOMER"))
58:                         .requestMatchers(HttpMethod.POST, "/api/v1/bakeries/onboarding",
59:                                 "/api/v1/bakeries/{bakeryId}/onboarding/complete")
60:                         .access(userRole("CUSTOMER"))
61:                         .requestMatchers(HttpMethod.GET, "/v3/api-docs/**", "/swagger-ui/**", "/swagger-ui.html")
62:                         .permitAll()
63:                         .requestMatchers(HttpMethod.GET, "/api/v1/bakeries", "/api/v1/bakeries/{bakeryId}",
64:                                 "/api/v1/products", "/api/v1/products/{productId}").permitAll()
65:                         .requestMatchers(HttpMethod.GET, "/internal/v1/bakeries/{bakeryId}")
66:                         .access(serviceScope("bakery:profile:read"))
67:                         .requestMatchers(HttpMethod.PUT, "/internal/v1/bakeries/{bakeryId}/onboarding/activate")
68:                         .access(serviceScope("bakery:onboarding:activate"))
69:                         .requestMatchers(HttpMethod.GET,
70:                                 "/internal/v1/bakeries/{bakeryId}/members/{userId}/authorization",
71:                                 "/internal/v1/users/{userId}/bakery-memberships")
72:                         .access(serviceScope("bakery:membership:read"))
73:                         .requestMatchers(HttpMethod.POST, "/internal/v1/catalog/quotes",
74:                                 "/internal/v1/catalog/customization-quotes",
75:                                 "/internal/v1/catalog/add-on-quotes")
76:                         .access(serviceScope("bakery:catalog:quote"))
77:                         .requestMatchers("/internal/v1/**").denyAll()
78:                         .requestMatchers("/api/v1/admin/**").access(userRole("ADMIN"))
79:                         .requestMatchers(HttpMethod.POST, "/api/v1/bakeries").access(userRole("BAKERY_OWNER"))
80:                         .requestMatchers(HttpMethod.POST, "/api/v1/bakeries/{bakeryId}/submit-for-approval")
81:                         .access(bakeryOwner())
82:                         .requestMatchers(HttpMethod.POST,
83:                                 "/api/v1/bakeries/{bakeryId}/logo",
84:                                 "/api/v1/bakeries/{bakeryId}/cover")
85:                         .access(bakeryOwner())
86:                         .requestMatchers(HttpMethod.POST, "/api/v1/bakeries/{bakeryId}/add-ons/{addOnId}/image")
87:                         .access(bakeryOwner())
88:                         .requestMatchers(HttpMethod.POST, "/api/v1/bakeries/{bakeryId}/products/{productId}/images")
89:                         .access(bakeryOwner())
90:                         .requestMatchers(HttpMethod.POST,
91:                                 "/api/v1/bakeries/{bakeryId}/products/{productId}/publish",
92:                                 "/api/v1/bakeries/{bakeryId}/products/{productId}/hide",
93:                                 "/api/v1/bakeries/{bakeryId}/products/{productId}/archive")
94:                         .access(bakeryOwner())
95:                         .requestMatchers(HttpMethod.GET, "/api/v1/bakeries/{bakeryId}/members")
96:                         .access(bakeryOwner())
97:                         .requestMatchers(HttpMethod.GET,
98:                                 "/api/v1/bakeries/{bakeryId}/categories",
99:                                 "/api/v1/bakeries/{bakeryId}/add-ons",
100:                                 "/api/v1/bakeries/{bakeryId}/products")
101:                         .access(bakeryOwner())
102:                         .requestMatchers(HttpMethod.PATCH,
103:                                 "/api/v1/bakeries/{bakeryId}",
104:                                 "/api/v1/bakeries/{bakeryId}/categories/{categoryId}",
105:                                 "/api/v1/bakeries/{bakeryId}/add-ons/{addOnId}",
106:                                 "/api/v1/bakeries/{bakeryId}/products/{productId}")
107:                         .access(bakeryOwner())
108:                         .requestMatchers(HttpMethod.POST,
109:                                 "/api/v1/bakeries/{bakeryId}/categories",
110:                                 "/api/v1/bakeries/{bakeryId}/add-ons",
111:                                 "/api/v1/bakeries/{bakeryId}/products")
112:                         .access(bakeryOwner())
113:                         .requestMatchers(HttpMethod.PUT,
114:                                 "/api/v1/bakeries/{bakeryId}/operations",
115:                                 "/api/v1/bakeries/{bakeryId}/products/{productId}/options")
116:                         .access(bakeryOwner())
117:                         .requestMatchers(HttpMethod.DELETE,
118:                                 "/api/v1/bakeries/{bakeryId}/categories/{categoryId}",
119:                                 "/api/v1/bakeries/{bakeryId}/add-ons/{addOnId}")
120:                         .access(bakeryOwner())
121:                         .requestMatchers(HttpMethod.DELETE,
122:                                 "/api/v1/bakeries/{bakeryId}/products/{productId}/images/{imageId}")
123:                         .access(bakeryOwner())
124:                         .anyRequest().denyAll())
125:                 .oauth2ResourceServer(resourceServer -> resourceServer
126:                         .jwt(jwt -> jwt.jwtAuthenticationConverter(jwtAuthenticationConverter))
127:                         .authenticationEntryPoint(authenticationEntryPoint)
128:                         .accessDeniedHandler(accessDeniedHandler))
129:                 .exceptionHandling(exceptions -> exceptions
130:                         .authenticationEntryPoint(authenticationEntryPoint)
131:                         .accessDeniedHandler(accessDeniedHandler));
132:         return http.build();
133:     }
134: 
135:     @Bean
136:     JwtAuthenticationConverter jwtAuthenticationConverter() {
137:         JwtGrantedAuthoritiesConverter roles = new JwtGrantedAuthoritiesConverter();
138:         roles.setAuthoritiesClaimName("roles");
139:         roles.setAuthorityPrefix("ROLE_");
140:         JwtGrantedAuthoritiesConverter scopes = new JwtGrantedAuthoritiesConverter();
141:         scopes.setAuthoritiesClaimName("scope");
142:         JwtAuthenticationConverter converter = new JwtAuthenticationConverter();
143:         converter.setJwtGrantedAuthoritiesConverter(new DelegatingJwtGrantedAuthoritiesConverter(roles, scopes));
144:         return converter;
145:     }
146: 
147:     private AuthorizationManager<RequestAuthorizationContext> userRole(String role) {
148:         return (authentication, context) -> {
149:             Authentication resolved = authentication.get();
150:             return new AuthorizationDecision(isUser(resolved) && hasRole(resolved, role));
151:         };
152:     }
153: 
154:     private AuthorizationManager<RequestAuthorizationContext> serviceScope(String scope) {
155:         return (authentication, context) -> {
156:             Authentication resolved = authentication.get();
157:             if (!(resolved instanceof JwtAuthenticationToken token) || !resolved.isAuthenticated()) {
158:                 return new AuthorizationDecision(false);
159:             }
160:             String correlationId = context.getRequest().getHeader("X-Correlation-Id");
161:             String scopes = token.getToken().getClaimAsString("scope");
162:             boolean allowed = "service".equals(token.getToken().getClaimAsString("token_type"))
163:                     && token.getToken().getAudience().contains(serviceAudience)
164:                     && correlationId != null && !correlationId.isBlank()
165:                     && scopes != null && Arrays.asList(scopes.split(" ")).contains(scope);
166:             return new AuthorizationDecision(allowed);
167:         };
168:     }
169: 
170:     private AuthorizationManager<RequestAuthorizationContext> bakeryOwner() {
171:         return (authentication, context) -> {
172:             Authentication resolved = authentication.get();
173:             if (!isUser(resolved)
174:                     || !hasRole(resolved, "BAKERY_OWNER")) {
175:                 return new AuthorizationDecision(false);
176:             }
177:             try {
178:                 String bakeryIdValue = context.getVariables().get("bakeryId");
179:                 if (bakeryIdValue == null) {
180:                     return new AuthorizationDecision(false);
181:                 }
182:                 UUID bakeryId = UUID.fromString(bakeryIdValue);
183:                 UUID userId = UUID.fromString(((JwtAuthenticationToken) resolved).getToken().getSubject());
184:                 boolean allowed = memberRepository.findByBakery_IdAndUserId(bakeryId, userId)
185:                         .filter(member -> member.getStatus() == BakeryMemberStatus.ACTIVE)
186:                         .map(member -> member.getMemberRole() == BakeryMemberRole.OWNER)
187:                         .orElse(false);
188:                 return new AuthorizationDecision(allowed);
189:             } catch (IllegalArgumentException exception) {
190:                 return new AuthorizationDecision(false);
191:             }
192:         };
193:     }
194: 
195:     private boolean isUser(Authentication authentication) {
196:         if (!(authentication instanceof JwtAuthenticationToken jwtAuthentication)
197:                 || !authentication.isAuthenticated()
198:                 || !"user".equals(jwtAuthentication.getToken().getClaimAsString("token_type"))
199:                 || jwtAuthentication.getToken().getSubject() == null) {
200:             return false;
201:         }
202:         try {
203:             UUID.fromString(jwtAuthentication.getToken().getSubject());
204:             return true;
205:         } catch (IllegalArgumentException exception) {
206:             return false;
207:         }
208:     }
209: 
210:     private boolean hasRole(Authentication authentication, String role) {
211:         return authentication.getAuthorities().stream()
212:                 .anyMatch(authority -> ("ROLE_" + role).equals(authority.getAuthority()));
213:     }
214: 
215:     @Bean
216:     AuthenticationEntryPoint authenticationEntryPoint(ObjectMapper objectMapper) {
217:         return (request, response, exception) -> {
218:             response.setStatus(HttpStatus.UNAUTHORIZED.value());
219:             response.setContentType(MediaType.APPLICATION_JSON_VALUE);
220:             response.setCharacterEncoding("UTF-8");
221:             objectMapper.writeValue(response.getWriter(),
222:                     ApiResponse.error(HttpStatus.UNAUTHORIZED.value(), "Authentication is required or token is invalid"));
223:         };
224:     }
225: 
226:     @Bean
227:     AccessDeniedHandler accessDeniedHandler(ObjectMapper objectMapper) {
228:         return (request, response, exception) -> {
229:             response.setStatus(HttpStatus.FORBIDDEN.value());
230:             response.setContentType(MediaType.APPLICATION_JSON_VALUE);
231:             response.setCharacterEncoding("UTF-8");
232:             objectMapper.writeValue(response.getWriter(),
233:                     ApiResponse.error(HttpStatus.FORBIDDEN.value(), "Access is denied"));
234:         };
235:     }
236: }
```

### ImageValidator.java — cake-ai-service

[ImageValidator.java:1](../../backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/infrastructure/storage/ImageValidator.java#L1)

```java
1: package com.se193262.cakeaiservice.infrastructure.storage;
2: 
9: 
10: @Component
11: public class ImageValidator {
12:     public record Image(byte[] bytes, String mediaType, int width, int height) {}
13: 
14:     public Image validate(byte[] bytes) {
15:         if (bytes == null || bytes.length == 0 || bytes.length > 10 * 1024 * 1024)
16:             throw BusinessException.invalid("Image must be between 1 byte and 10 MB");
17:         try (var input = ImageIO.createImageInputStream(new ByteArrayInputStream(bytes))) {
18:             var readers = ImageIO.getImageReaders(input);
19:             if (!readers.hasNext()) throw BusinessException.invalid("Invalid image content");
20:             var reader = readers.next();
21:             try {
22:                 String format = reader.getFormatName().toLowerCase(java.util.Locale.ROOT);
23:                 if (!Set.of("png", "jpeg", "jpg", "webp").contains(format))
24:                     throw BusinessException.invalid("Only JPEG, PNG and WebP are supported");
25:                 reader.setInput(input);
26:                 int width = reader.getWidth(0), height = reader.getHeight(0);
27:                 if (width < 1 || height < 1 || (long) width * height > 25_000_000)
28:                     throw BusinessException.invalid("Image dimensions exceed limit");
29:                 if (reader.read(0) == null) throw BusinessException.invalid("Invalid image content");
30:                 return new Image(bytes, "image/" + (format.equals("jpg") ? "jpeg" : format), width, height);
31:             } finally { reader.dispose(); }
32:         } catch (IOException error) { throw BusinessException.invalid("Invalid image content"); }
33:     }
34: 
35:     public byte[] thumbnail(Image image) {
36:         return resized(image, 320);
37:     }
38: 
39:     public Image providerReference(Image image) {
40:         return validate(resized(image, 1536));
41:     }
42: 
43:     private byte[] resized(Image image, int maximumDimension) {
44:         try {
45:             BufferedImage original = ImageIO.read(new ByteArrayInputStream(image.bytes()));
46:             double scale = Math.min(1.0, (double) maximumDimension / Math.max(image.width(), image.height()));
47:             BufferedImage result = new BufferedImage(Math.max(1, (int) (image.width() * scale)),
48:                     Math.max(1, (int) (image.height() * scale)), BufferedImage.TYPE_INT_RGB);
49:             var graphics = result.createGraphics();
50:             try { graphics.drawImage(original, 0, 0, result.getWidth(), result.getHeight(), null); }
51:             finally { graphics.dispose(); }
52:             var output = new ByteArrayOutputStream();
53:             ImageIO.write(result, "jpeg", output);
54:             return output.toByteArray();
55:         } catch (IOException error) { throw BusinessException.invalid("Cannot decode image"); }
56:     }
57: }
```

### JwtProperties.java — chat-service

[JwtProperties.java:1](../../backend/chat-service/src/main/java/com/se193262/chatservice/config/JwtProperties.java#L1)

```java
1: package com.se193262.chatservice.config;
2: 
4: 
5: @ConfigurationProperties(prefix = "security.jwt")
6: public record JwtProperties(
7:         String jwkSetUri,
8:         String issuer,
9:         String userAudience,
10:         String serviceAudience
11: ) {
12: }
```

### SecurityConfig.java — chat-service

[SecurityConfig.java:1](../../backend/chat-service/src/main/java/com/se193262/chatservice/config/SecurityConfig.java#L1)

```java
1: package com.se193262.chatservice.config;
2: 
32: 
36: 
38: 
39: @Configuration
40: @EnableWebSecurity
41: @EnableConfigurationProperties(JwtProperties.class)
42: public class SecurityConfig {
43: 
44:     private static final OAuth2Error INVALID_TOKEN_CONTRACT = new OAuth2Error(
45:             "invalid_token", "JWT audience or token type is invalid", null);
46: 
47:     @Bean
48:     JwtDecoder jwtDecoder(JwtProperties properties) {
49:         NimbusJwtDecoder decoder = NimbusJwtDecoder.withJwkSetUri(properties.jwkSetUri()).build();
50:         OAuth2TokenValidator<Jwt> audienceAndTypeValidator = jwt -> {
51:             String tokenType = jwt.getClaimAsString("token_type");
52:             String expectedAudience = switch (tokenType == null ? "" : tokenType) {
53:                 case "user" -> properties.userAudience();
54:                 case "service" -> properties.serviceAudience();
55:                 default -> null;
56:             };
57:             return expectedAudience != null && jwt.getAudience().contains(expectedAudience)
58:                     ? OAuth2TokenValidatorResult.success()
59:                     : OAuth2TokenValidatorResult.failure(INVALID_TOKEN_CONTRACT);
60:         };
61:         decoder.setJwtValidator(new DelegatingOAuth2TokenValidator<>(
62:                 new JwtTimestampValidator(),
63:                 new JwtIssuerValidator(properties.issuer()),
64:                 audienceAndTypeValidator));
65:         return decoder;
66:     }
67: 
68:     @Bean
69:     Converter<Jwt, ? extends AbstractAuthenticationToken> jwtAuthenticationConverter() {
70:         return jwt -> {
71:             Set<org.springframework.security.core.GrantedAuthority> authorities = new LinkedHashSet<>();
72:             List<String> roles = jwt.getClaimAsStringList("roles");
73:             if (roles != null) {
74:                 roles.stream()
75:                         .filter(role -> role != null && !role.isBlank())
76:                         .map(role -> new org.springframework.security.core.authority.SimpleGrantedAuthority(
77:                                 "ROLE_" + role))
78:                         .forEach(authorities::add);
79:             }
80:             String scopes = jwt.getClaimAsString("scope");
81:             if (scopes != null) {
82:                 for (String scope : scopes.trim().split("\\s+")) {
83:                     if (!scope.isBlank()) {
84:                         authorities.add(new org.springframework.security.core.authority.SimpleGrantedAuthority(
85:                                 "SCOPE_" + scope));
86:                     }
87:                 }
88:             }
89:             return new JwtAuthenticationToken(jwt, authorities, jwt.getSubject());
90:         };
91:     }
92: 
93:     @Bean
94:     SecurityFilterChain securityFilterChain(
95:             HttpSecurity http,
96:             Converter<Jwt, ? extends AbstractAuthenticationToken> jwtAuthenticationConverter,
97:             AuthenticationEntryPoint authenticationEntryPoint,
98:             AccessDeniedHandler accessDeniedHandler
99:     ) throws Exception {
100:         http
101:                 .csrf(csrf -> csrf.disable())
102:                 .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
103:                 .authorizeHttpRequests(authorize -> authorize
104:                         .requestMatchers(HttpMethod.GET, "/v3/api-docs/**", "/v3/api-docs.yaml",
105:                                 "/swagger-ui/**", "/swagger-ui.html").permitAll()
106:                         .requestMatchers("/internal/v1/**").denyAll()
107:                         .requestMatchers(HttpMethod.POST, "/api/v1/conversations")
108:                         .access(userRole("ROLE_CUSTOMER"))
109:                         .requestMatchers(HttpMethod.POST, "/api/v1/conversations/*/close")
110:                         .access(userRoleAny("ROLE_CUSTOMER", "ROLE_BAKERY_OWNER"))
111:                         .requestMatchers("/api/v1/**").access(userToken())
112:                         .anyRequest().denyAll())
113:                 .oauth2ResourceServer(resourceServer -> resourceServer
114:                         .jwt(jwt -> jwt.jwtAuthenticationConverter(jwtAuthenticationConverter))
115:                         .authenticationEntryPoint(authenticationEntryPoint)
116:                         .accessDeniedHandler(accessDeniedHandler))
117:                 .exceptionHandling(exceptions -> exceptions
118:                         .authenticationEntryPoint(authenticationEntryPoint)
119:                         .accessDeniedHandler(accessDeniedHandler));
120:         return http.build();
121:     }
122: 
123:     @Bean
124:     AuthenticationEntryPoint authenticationEntryPoint(ObjectMapper objectMapper) {
125:         return (request, response, exception) -> {
126:             response.setStatus(HttpStatus.UNAUTHORIZED.value());
127:             response.setContentType(MediaType.APPLICATION_JSON_VALUE);
128:             response.setCharacterEncoding("UTF-8");
129:             objectMapper.writeValue(response.getWriter(), ApiResponse.error(
130:                     HttpStatus.UNAUTHORIZED.value(), "Authentication is required or token is invalid"));
131:         };
132:     }
133: 
134:     @Bean
135:     AccessDeniedHandler accessDeniedHandler(ObjectMapper objectMapper) {
136:         return (request, response, exception) -> {
137:             response.setStatus(HttpStatus.FORBIDDEN.value());
138:             response.setContentType(MediaType.APPLICATION_JSON_VALUE);
139:             response.setCharacterEncoding("UTF-8");
140:             objectMapper.writeValue(response.getWriter(), ApiResponse.error(
141:                     HttpStatus.FORBIDDEN.value(), "Access is denied"));
142:         };
143:     }
144: 
145:     private AuthorizationManager<RequestAuthorizationContext> userToken() {
146:         return (authentication, context) -> {
147:             Authentication resolved = authentication.get();
148:             boolean allowed = resolved instanceof JwtAuthenticationToken jwtAuthentication
149:                     && resolved.isAuthenticated()
150:                     && "user".equals(jwtAuthentication.getToken().getClaimAsString("token_type"));
151:             return new AuthorizationDecision(allowed);
152:         };
153:     }
154: 
155:     private AuthorizationManager<RequestAuthorizationContext> userRole(String requiredAuthority) {
156:         return userRoleAny(requiredAuthority);
157:     }
158: 
159:     private AuthorizationManager<RequestAuthorizationContext> userRoleAny(String... requiredAuthorities) {
160:         return (authentication, context) -> {
161:             Authentication resolved = authentication.get();
162:             boolean allowed = resolved instanceof JwtAuthenticationToken jwtAuthentication
163:                     && resolved.isAuthenticated()
164:                     && "user".equals(jwtAuthentication.getToken().getClaimAsString("token_type"))
165:                     && java.util.Arrays.stream(requiredAuthorities)
166:                     .anyMatch(requiredAuthority -> hasAuthority(resolved, requiredAuthority));
167:             return new AuthorizationDecision(allowed);
168:         };
169:     }
170: 
171:     private boolean hasAuthority(Authentication authentication, String requiredAuthority) {
172:         return authentication.getAuthorities().stream()
173:                 .anyMatch(authority -> requiredAuthority.equals(authority.getAuthority()));
174:     }
175: }
```

### AttachmentValidator.java — chat-service

[AttachmentValidator.java:1](../../backend/chat-service/src/main/java/com/se193262/chatservice/feature/message/AttachmentValidator.java#L1)

```java
1: package com.se193262.chatservice.feature.message;
2: 
7: 
13: 
14: @Component
15: public class AttachmentValidator {
16: 
17:     private static final long MAX_FILE_SIZE = 10L * 1024 * 1024;
18:     private static final int MAX_FILES = 5;
19: 
20:     public List<AttachmentFile> validate(MessageType type, List<MultipartFile> files) {
21:         List<MultipartFile> provided = files == null ? List.of() : files.stream()
22:                 .filter(file -> file != null && !file.isEmpty())
23:                 .toList();
24:         if (type == MessageType.TEXT) {
25:             if (!provided.isEmpty()) {
26:                 throw invalid("Text messages cannot contain attachments");
27:             }
28:             return List.of();
29:         }
30:         if (type != MessageType.IMAGE && type != MessageType.FILE) {
31:             throw invalid("Unsupported message type");
32:         }
33:         if (provided.isEmpty() || provided.size() > MAX_FILES) {
34:             throw invalid("Image and file messages require between one and five attachments");
35:         }
36:         List<AttachmentFile> result = new ArrayList<>(provided.size());
37:         for (MultipartFile file : provided) {
38:             if (file.getSize() <= 0 || file.getSize() > MAX_FILE_SIZE) {
39:                 throw invalid("Each attachment must be between 1 byte and 10 MB");
40:             }
41:             try {
42:                 byte[] bytes = file.getBytes();
43:                 String mediaType = detectMediaType(bytes);
44:                 String declaredType = file.getContentType();
45:                 if (mediaType == null || declaredType == null
46:                         || !mediaType.equalsIgnoreCase(declaredType.split(";", 2)[0].trim())) {
47:                     throw invalid("Attachment content does not match its declared media type");
48:                 }
49:                 if (type == MessageType.IMAGE && !mediaType.startsWith("image/")) {
50:                     throw invalid("Image messages can contain only image attachments");
51:                 }
52:                 result.add(new AttachmentFile(safeFileName(file.getOriginalFilename()), mediaType, bytes));
53:             } catch (IOException exception) {
54:                 throw new ChatException(HttpStatus.UNPROCESSABLE_ENTITY, "An attachment could not be read");
55:             }
56:         }
57:         return List.copyOf(result);
58:     }
59: 
60:     private String detectMediaType(byte[] bytes) {
61:         if (startsWith(bytes, new byte[]{(byte) 0xff, (byte) 0xd8, (byte) 0xff})) {
62:             return "image/jpeg";
63:         }
64:         if (startsWith(bytes, new byte[]{
65:                 (byte) 0x89, 'P', 'N', 'G', 0x0d, 0x0a, 0x1a, 0x0a})) {
66:             return "image/png";
67:         }
68:         if (bytes.length >= 12 && ascii(bytes, 0, 4).equals("RIFF")
69:                 && ascii(bytes, 8, 4).equals("WEBP")) {
70:             return "image/webp";
71:         }
72:         if (bytes.length >= 5 && ascii(bytes, 0, 5).equals("%PDF-")) {
73:             return "application/pdf";
74:         }
75:         return null;
76:     }
77: 
78:     private boolean startsWith(byte[] bytes, byte[] prefix) {
79:         if (bytes.length < prefix.length) {
80:             return false;
81:         }
82:         for (int index = 0; index < prefix.length; index++) {
83:             if (bytes[index] != prefix[index]) {
84:                 return false;
85:             }
86:         }
87:         return true;
88:     }
89: 
90:     private String ascii(byte[] bytes, int offset, int length) {
91:         return new String(bytes, offset, length, StandardCharsets.US_ASCII);
92:     }
93: 
94:     private String safeFileName(String fileName) {
95:         String normalized = fileName == null ? "" : fileName.replace('\\', '/');
96:         String leaf = normalized.substring(normalized.lastIndexOf('/') + 1)
97:                 .replaceAll("[\\p{Cntrl}]", "")
98:                 .trim();
99:         if (leaf.isBlank()) {
100:             return "attachment";
101:         }
102:         return leaf.length() <= 255 ? leaf : leaf.substring(0, 255);
103:     }
104: 
105:     private ChatException invalid(String message) {
106:         return new ChatException(HttpStatus.UNPROCESSABLE_ENTITY, message);
107:     }
108: }
```

### JwtConfig.java — identity-service

[JwtConfig.java:1](../../backend/identity-service/src/main/java/com/se193262/identityservice/config/JwtConfig.java#L1)

```java
1: package com.se193262.identityservice.config;
2: 
28: 
39: 
40: @Configuration
41: @EnableConfigurationProperties({JwtProperties.class, AuthProperties.class, CorsProperties.class})
42: public class JwtConfig {
43: 
44:     private static final OAuth2Error INVALID_AUDIENCE = new OAuth2Error(
45:             "invalid_token", "JWT audience or token type is invalid", null);
46: 
47:     @Bean
48:     Clock clock() {
49:         return Clock.systemUTC();
50:     }
51: 
52:     @Bean
53:     @ConditionalOnMissingBean(RSAKey.class)
54:     RSAKey rsaKey(JwtProperties properties) {
55:         RSAPrivateKey privateKey = readPrivateKey(properties);
56:         RSAPublicKey publicKey = readPublicKey(properties);
57:         if (!privateKey.getModulus().equals(publicKey.getModulus())) {
58:             throw new IllegalStateException("Configured JWT private and public keys do not match");
59:         }
60:         return new RSAKey.Builder(publicKey)
61:                 .privateKey(privateKey)
62:                 .keyID(requireText(properties.keyId(), "security.jwt.key-id"))
63:                 .algorithm(JWSAlgorithm.RS256)
64:                 .keyUse(KeyUse.SIGNATURE)
65:                 .build();
66:     }
67: 
68:     @Bean
69:     JwtEncoder jwtEncoder(RSAKey rsaKey) {
70:         ImmutableJWKSet<SecurityContext> jwkSource = new ImmutableJWKSet<>(new JWKSet(rsaKey));
71:         return new NimbusJwtEncoder(jwkSource);
72:     }
73: 
74:     @Bean
75:     JwtDecoder jwtDecoder(RSAKey rsaKey, JwtProperties properties) throws Exception {
76:         NimbusJwtDecoder decoder = NimbusJwtDecoder.withPublicKey(rsaKey.toRSAPublicKey())
77:                 .signatureAlgorithm(SignatureAlgorithm.RS256)
78:                 .build();
79: 
80:         OAuth2TokenValidator<Jwt> audienceValidator = token -> {
81:             String tokenType = token.getClaimAsString("token_type");
82:             String requiredAudience = "service".equals(tokenType)
83:                     ? properties.serviceAudience()
84:                     : "user".equals(tokenType) ? properties.userAudience() : null;
85:             if (requiredAudience != null && token.getAudience().contains(requiredAudience)) {
86:                 return OAuth2TokenValidatorResult.success();
87:             }
88:             return OAuth2TokenValidatorResult.failure(INVALID_AUDIENCE);
89:         };
90: 
91:         decoder.setJwtValidator(new DelegatingOAuth2TokenValidator<>(
92:                 new JwtTimestampValidator(),
93:                 new JwtIssuerValidator(requireText(properties.issuer(), "security.jwt.issuer")),
94:                 audienceValidator,
95:                 new JwtClaimValidator<String>("sub", subject -> subject != null && !subject.isBlank())
96:         ));
97:         return decoder;
98:     }
99: 
100:     @Bean
101:     Converter<Jwt, ? extends AbstractAuthenticationToken> jwtAuthenticationConverter() {
102:         return new BakeryJwtAuthenticationConverter();
103:     }
104: 
105:     private RSAPrivateKey readPrivateKey(JwtProperties properties) {
106:         String pem = readPem(properties.privateKeyPath(), "security.jwt.private-key-path");
107:         byte[] encoded = decodePem(pem, "PRIVATE KEY");
108:         try {
109:             return (RSAPrivateKey) KeyFactory.getInstance("RSA")
110:                     .generatePrivate(new PKCS8EncodedKeySpec(encoded));
111:         } catch (Exception exception) {
112:             throw new IllegalStateException("Cannot parse JWT PKCS#8 private key", exception);
113:         }
114:     }
115: 
116:     private RSAPublicKey readPublicKey(JwtProperties properties) {
117:         String pem = readPem(properties.publicKeyPath(), "security.jwt.public-key-path");
118:         byte[] encoded = decodePem(pem, "PUBLIC KEY");
119:         try {
120:             return (RSAPublicKey) KeyFactory.getInstance("RSA")
121:                     .generatePublic(new X509EncodedKeySpec(encoded));
122:         } catch (Exception exception) {
123:             throw new IllegalStateException("Cannot parse JWT X.509 public key", exception);
124:         }
125:     }
126: 
127:     private String readPem(java.nio.file.Path path, String propertyName) {
128:         if (path == null) {
129:             throw new IllegalStateException(propertyName + " must be configured");
130:         }
131:         try {
132:             return Files.readString(path, StandardCharsets.US_ASCII);
133:         } catch (IOException exception) {
134:             throw new IllegalStateException("Cannot read " + propertyName + " from " + path, exception);
135:         }
136:     }
137: 
138:     private byte[] decodePem(String pem, String type) {
139:         String normalized = pem
140:                 .replace("-----BEGIN " + type + "-----", "")
141:                 .replace("-----END " + type + "-----", "")
142:                 .replaceAll("\\s", "");
143:         try {
144:             return Base64.getDecoder().decode(normalized);
145:         } catch (IllegalArgumentException exception) {
146:             throw new IllegalStateException("Invalid PEM content for " + type, exception);
147:         }
148:     }
149: 
150:     private String requireText(String value, String propertyName) {
151:         if (value == null || value.isBlank()) {
152:             throw new IllegalStateException(propertyName + " must be configured");
153:         }
154:         return value;
155:     }
156: }
```

### JwtProperties.java — identity-service

[JwtProperties.java:1](../../backend/identity-service/src/main/java/com/se193262/identityservice/config/JwtProperties.java#L1)

```java
1: package com.se193262.identityservice.config;
2: 
4: 
7: 
8: @ConfigurationProperties(prefix = "security.jwt")
9: public record JwtProperties(
10:         Path privateKeyPath,
11:         Path publicKeyPath,
12:         String keyId,
13:         String issuer,
14:         String userAudience,
15:         String serviceAudience,
16:         Duration accessTokenTtl
17: ) {
18: }
```

### SecurityConfig.java — identity-service

[SecurityConfig.java:1](../../backend/identity-service/src/main/java/com/se193262/identityservice/config/SecurityConfig.java#L1)

```java
1: package com.se193262.identityservice.config;
2: 
5: 
34: 
36: 
39: 
40: @Configuration
41: @EnableWebSecurity
42: @EnableMethodSecurity
43: public class SecurityConfig {
44: 
45:     @Bean
46:     SecurityFilterChain securityFilterChain(
47:             HttpSecurity http,
48:             Converter<Jwt, ? extends AbstractAuthenticationToken> jwtAuthenticationConverter,
49:             AuthenticationEntryPoint authenticationEntryPoint,
50:             AccessDeniedHandler accessDeniedHandler,
51:             CorsConfigurationSource corsConfigurationSource)
52:             throws Exception {
53:         http.csrf(csrf -> csrf.disable())
54:                 .cors(cors -> cors.configurationSource(corsConfigurationSource))
55:                 .sessionManagement(
56:                         session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
57:                 .authorizeHttpRequests(
58:                         authorize ->
59:                                 authorize
60:                                         .requestMatchers(
61:                                                 HttpMethod.POST, "/internal/v1/auth/service-token")
62:                                         .permitAll()
63:                                         .requestMatchers("/actuator/health", "/actuator/health/**")
64:                                         .permitAll()
65:                                         .requestMatchers(
66:                                                 HttpMethod.GET,
67:                                                 "/.well-known/jwks.json",
68:                                                 "/v3/api-docs/**",
69:                                                 "/v3/api-docs.yaml",
70:                                                 "/swagger-ui/**",
71:                                                 "/swagger-ui.html")
72:                                         .permitAll()
73:                                         .requestMatchers(
74:                                                 HttpMethod.POST,
75:                                                 "/api/v1/auth/register",
76:                                                 "/api/v1/auth/login",
77:                                                 "/api/v1/auth/refresh")
78:                                         .permitAll()
79:                                         .requestMatchers(
80:                                                 HttpMethod.GET, "/internal/v1/users/*/addresses/*")
81:                                         .access(serviceScope("identity:address:read"))
82:                                         .requestMatchers(HttpMethod.GET, "/internal/v1/users/*")
83:                                         .access(serviceScope("identity:user:read"))
84:                                         .requestMatchers(HttpMethod.PUT, "/internal/v1/users/*/bakery-owner")
85:                                         .access(serviceScope("identity:bakery-owner:grant"))
86:                                         .requestMatchers("/internal/v1/**")
87:                                         .denyAll()
88:                                         .requestMatchers("/api/v1/admin/**")
89:                                         .access(userRole("ROLE_ADMIN"))
90:                                         .requestMatchers("/api/v1/**")
91:                                         .access(tokenType("user"))
92:                                         .anyRequest()
93:                                         .denyAll())
94:                 .oauth2ResourceServer(
95:                         resourceServer ->
96:                                 resourceServer
97:                                         .jwt(
98:                                                 jwt ->
99:                                                         jwt.jwtAuthenticationConverter(
100:                                                                 jwtAuthenticationConverter))
101:                                         .authenticationEntryPoint(authenticationEntryPoint)
102:                                         .accessDeniedHandler(accessDeniedHandler))
103:                 .exceptionHandling(
104:                         exceptions ->
105:                                 exceptions
106:                                         .authenticationEntryPoint(authenticationEntryPoint)
107:                                         .accessDeniedHandler(accessDeniedHandler));
108:         return http.build();
109:     }
110: 
111:     @Bean
112:     PasswordEncoder passwordEncoder(AuthProperties properties) {
113:         return new BCryptPasswordEncoder(properties.bcryptStrength());
114:     }
115: 
116:     @Bean
117:     AuthenticationManager authenticationManager(
118:             CustomUserDetailsService userDetailsService, PasswordEncoder passwordEncoder) {
119:         DaoAuthenticationProvider provider = new DaoAuthenticationProvider(userDetailsService);
120:         provider.setPasswordEncoder(passwordEncoder);
121:         return new ProviderManager(provider);
122:     }
123: 
124:     @Bean
125:     CorsConfigurationSource corsConfigurationSource(CorsProperties properties) {
126:         CorsConfiguration configuration = new CorsConfiguration();
127:         configuration.setAllowedOrigins(properties.allowedOrigins());
128:         configuration.setAllowedMethods(
129:                 List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
130:         configuration.setAllowedHeaders(
131:                 List.of(
132:                         "Authorization",
133:                         "Content-Type",
134:                         "Cache-Control",
135:                         "Idempotency-Key",
136:                         "X-Correlation-Id"));
137:         configuration.setAllowCredentials(true);
138:         UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
139:         source.registerCorsConfiguration("/**", configuration);
140:         return source;
141:     }
142: 
143:     @Bean
144:     AuthenticationEntryPoint authenticationEntryPoint(ObjectMapper objectMapper) {
145:         return (request, response, exception) -> {
146:             response.setStatus(HttpStatus.UNAUTHORIZED.value());
147:             response.setContentType(MediaType.APPLICATION_JSON_VALUE);
148:             response.setCharacterEncoding("UTF-8");
149:             objectMapper.writeValue(
150:                     response.getWriter(),
151:                     ApiResponse.error(
152:                             HttpStatus.UNAUTHORIZED.value(),
153:                             "Authentication is required or token is invalid"));
154:         };
155:     }
156: 
157:     @Bean
158:     AccessDeniedHandler accessDeniedHandler(ObjectMapper objectMapper) {
159:         return (request, response, exception) -> {
160:             response.setStatus(HttpStatus.FORBIDDEN.value());
161:             response.setContentType(MediaType.APPLICATION_JSON_VALUE);
162:             response.setCharacterEncoding("UTF-8");
163:             objectMapper.writeValue(
164:                     response.getWriter(),
165:                     ApiResponse.error(HttpStatus.FORBIDDEN.value(), "Access is denied"));
166:         };
167:     }
168: 
169:     private AuthorizationManager<RequestAuthorizationContext> tokenType(String expectedType) {
170:         return (authentication, context) ->
171:                 new AuthorizationDecision(hasTokenType(authentication, expectedType));
172:     }
173: 
174:     private AuthorizationManager<RequestAuthorizationContext> userRole(String authority) {
175:         return (authentication, context) ->
176:                 new AuthorizationDecision(
177:                         hasTokenType(authentication, "user")
178:                                 && hasAuthority(authentication, authority));
179:     }
180: 
181:     private AuthorizationManager<RequestAuthorizationContext> serviceScope(String scope) {
182:         return (authentication, context) ->
183:                 new AuthorizationDecision(
184:                         hasTokenType(authentication, "service")
185:                                 && hasAuthority(authentication, "SCOPE_" + scope));
186:     }
187: 
188:     private boolean hasTokenType(
189:             Supplier<? extends Authentication> authentication, String expectedType) {
190:         Authentication resolved = authentication.get();
191:         return resolved instanceof JwtAuthenticationToken jwtAuthentication
192:                 && resolved.isAuthenticated()
193:                 && expectedType.equals(jwtAuthentication.getToken().getClaimAsString("token_type"));
194:     }
195: 
196:     private boolean hasAuthority(
197:             Supplier<? extends Authentication> authentication, String authority) {
198:         Authentication resolved = authentication.get();
199:         return resolved != null
200:                 && resolved.getAuthorities().stream()
201:                         .anyMatch(
202:                                 grantedAuthority ->
203:                                         authority.equals(grantedAuthority.getAuthority()));
204:     }
205: }
```

### ServiceTokenService.java — identity-service

[ServiceTokenService.java:1](../../backend/identity-service/src/main/java/com/se193262/identityservice/feature/authentication/ServiceTokenService.java#L1)

```java
1: package com.se193262.identityservice.feature.authentication;
2: 
5: 
11: 
14: 
15: @Service
16: @EnableConfigurationProperties(ServiceClientProperties.class)
17: public class ServiceTokenService {
18:     private final ServiceClientProperties clients;
19:     private final PasswordEncoder encoder;
20:     private final JwtEncoder jwtEncoder;
21:     private final JwtProperties jwt;
22:     private final Clock clock;
23: 
24:     public ServiceTokenService(
25:             ServiceClientProperties clients,
26:             PasswordEncoder encoder,
27:             JwtEncoder jwtEncoder,
28:             JwtProperties jwt,
29:             Clock clock) {
30:         this.clients = clients;
31:         this.encoder = encoder;
32:         this.jwtEncoder = jwtEncoder;
33:         this.jwt = jwt;
34:         this.clock = clock;
35:     }
36: 
37:     public ServiceTokenResponse issue(ServiceTokenRequest request) {
38:         var configured =
39:                 clients.clients() == null ? null : clients.clients().get(request.clientId());
40:         if (configured == null
41:                 || configured.secretHash() == null
42:                 || !encoder.matches(request.clientSecret(), configured.secretHash()))
43:             throw new ServiceAuthenticationFailedException();
44:         String granted =
45:                 configured.grants() == null ? null : configured.grants().get(request.audience());
46:         Set<String> requested = new HashSet<>(Arrays.asList(request.scope().split(" +")));
47:         if (granted == null
48:                 || requested.isEmpty()
49:                 || !Set.of(granted.split(" +")).containsAll(requested))
50:             throw new ServiceAuthenticationFailedException();
51:         Instant now = clock.instant();
52:         var claims =
53:                 JwtClaimsSet.builder()
54:                         .issuer(jwt.issuer())
55:                         .subject(request.clientId())
56:                         .audience(List.of(request.audience()))
57:                         .issuedAt(now)
58:                         .expiresAt(now.plusSeconds(300))
59:                         .id(UUID.randomUUID().toString())
60:                         .claim("token_type", "service")
61:                         .claim("scope", String.join(" ", new TreeSet<>(requested)))
62:                         .build();
63:         var header = JwsHeader.with(SignatureAlgorithm.RS256).keyId(jwt.keyId()).build();
64:         return new ServiceTokenResponse(
65:                 jwtEncoder.encode(JwtEncoderParameters.from(header, claims)).getTokenValue(), 300);
66:     }
67: }
```

### TokenSessionService.java — identity-service

[TokenSessionService.java:1](../../backend/identity-service/src/main/java/com/se193262/identityservice/feature/authentication/TokenSessionService.java#L1)

```java
1: package com.se193262.identityservice.feature.authentication;
2: 
13: 
17: 
18: @Service
19: public class TokenSessionService {
20: 
21:     private final RefreshTokenRepository refreshTokenRepository;
22:     private final UserRepository userRepository;
23:     private final JwtTokenService jwtTokenService;
24:     private final RefreshTokenGenerator refreshTokenGenerator;
25:     private final RefreshTokenHasher refreshTokenHasher;
26:     private final AuthProperties authProperties;
27:     private final Clock clock;
28: 
29:     public TokenSessionService(
30:             RefreshTokenRepository refreshTokenRepository,
31:             UserRepository userRepository,
32:             JwtTokenService jwtTokenService,
33:             RefreshTokenGenerator refreshTokenGenerator,
34:             RefreshTokenHasher refreshTokenHasher,
35:             AuthProperties authProperties,
36:             Clock clock
37:     ) {
38:         this.refreshTokenRepository = refreshTokenRepository;
39:         this.userRepository = userRepository;
40:         this.jwtTokenService = jwtTokenService;
41:         this.refreshTokenGenerator = refreshTokenGenerator;
42:         this.refreshTokenHasher = refreshTokenHasher;
43:         this.authProperties = authProperties;
44:         this.clock = clock;
45:     }
46: 
47:     @Transactional
48:     public AuthenticationResult createSession(User user) {
49:         AccessToken accessToken = jwtTokenService.issueUserToken(user);
50:         String rawRefreshToken = refreshTokenGenerator.generate();
51:         Instant now = clock.instant();
52:         RefreshToken refreshToken = new RefreshToken(
53:                 user,
54:                 refreshTokenHasher.hash(rawRefreshToken),
55:                 now.plus(authProperties.refreshTokenTtl()),
56:                 now
57:         );
58:         refreshTokenRepository.save(refreshToken);
59:         TokenResponse response = new TokenResponse(accessToken.value(), "Bearer", accessToken.expiresInSeconds());
60:         return new AuthenticationResult(response, rawRefreshToken);
61:     }
62: 
63:     @Transactional(noRollbackFor = {InvalidRefreshTokenException.class, AccountUnavailableException.class})
64:     public AuthenticationResult refresh(String rawRefreshToken) {
65:         if (rawRefreshToken == null || rawRefreshToken.isBlank()) {
66:             throw new InvalidRefreshTokenException();
67:         }
68:         Instant now = clock.instant();
69:         RefreshToken storedToken = refreshTokenRepository
70:                 .findByTokenHashForUpdate(refreshTokenHasher.hash(rawRefreshToken))
71:                 .orElseThrow(InvalidRefreshTokenException::new);
72:         UUID userId = storedToken.getUser().getId();
73: 
74:         rejectRevokedOrExpired(storedToken, userId, now);
75:         User user = userRepository.findById(userId)
76:                 .orElseThrow(() -> new ResourceNotFoundException("User"));
77:         if (user.getStatus() != UserStatus.ACTIVE) {
78:             refreshTokenRepository.revokeAllActiveByUserId(userId, now);
79:             throw new AccountUnavailableException();
80:         }
81:         storedToken.revoke(now);
82:         return createSession(user);
83:     }
84: 
85:     @Transactional
86:     public void logout(String rawRefreshToken) {
87:         if (rawRefreshToken == null || rawRefreshToken.isBlank()) {
88:             return;
89:         }
90:         refreshTokenRepository.findByTokenHashForUpdate(refreshTokenHasher.hash(rawRefreshToken))
91:                 .ifPresent(token -> token.revoke(clock.instant()));
92:     }
93: 
94:     private void rejectRevokedOrExpired(RefreshToken storedToken, UUID userId, Instant now) {
95:         if (storedToken.getRevokedAt() != null) {
96:             refreshTokenRepository.revokeAllActiveByUserId(userId, now);
97:             throw new InvalidRefreshTokenException();
98:         }
99:         if (!storedToken.getExpiresAt().isAfter(now)) {
100:             storedToken.revoke(now);
101:             throw new InvalidRefreshTokenException();
102:         }
103:     }
104: }
```

### JwtProperties.java — order-service

[JwtProperties.java:1](../../backend/order-service/src/main/java/com/se193262/orderservice/config/JwtProperties.java#L1)

```java
1: package com.se193262.orderservice.config;
2: 
4: 
5: @ConfigurationProperties(prefix = "security.jwt")
6: public record JwtProperties(
7:         String jwkSetUri,
8:         String issuer,
9:         String userAudience,
10:         String serviceAudience
11: ) {
12: }
```

### SecurityConfig.java — order-service

[SecurityConfig.java:1](../../backend/order-service/src/main/java/com/se193262/orderservice/config/SecurityConfig.java#L1)

```java
1: package com.se193262.orderservice.config;
2: 
33: 
38: 
40: 
41: @Configuration
42: @EnableWebSecurity
43: @EnableMethodSecurity
44: @EnableConfigurationProperties(JwtProperties.class)
45: public class SecurityConfig {
46: 
47:     private static final OAuth2Error INVALID_TOKEN_CONTRACT = new OAuth2Error(
48:             "invalid_token", "JWT audience or token type is invalid", null);
49: 
50:     @Bean
51:     JwtDecoder jwtDecoder(JwtProperties properties) {
52:         NimbusJwtDecoder decoder = NimbusJwtDecoder.withJwkSetUri(properties.jwkSetUri()).build();
53:         OAuth2TokenValidator<Jwt> audienceAndTypeValidator = jwt -> {
54:             String tokenType = jwt.getClaimAsString("token_type");
55:             String expectedAudience = switch (tokenType == null ? "" : tokenType) {
56:                 case "user" -> properties.userAudience();
57:                 case "service" -> properties.serviceAudience();
58:                 default -> null;
59:             };
60:             return expectedAudience != null && jwt.getAudience().contains(expectedAudience)
61:                     ? OAuth2TokenValidatorResult.success()
62:                     : OAuth2TokenValidatorResult.failure(INVALID_TOKEN_CONTRACT);
63:         };
64:         decoder.setJwtValidator(new DelegatingOAuth2TokenValidator<>(
65:                 new JwtTimestampValidator(),
66:                 new JwtIssuerValidator(properties.issuer()),
67:                 audienceAndTypeValidator));
68:         return decoder;
69:     }
70: 
71:     @Bean
72:     Converter<Jwt, ? extends AbstractAuthenticationToken> jwtAuthenticationConverter() {
73:         return jwt -> {
74:             Set<org.springframework.security.core.GrantedAuthority> authorities = new LinkedHashSet<>();
75:             List<String> roles = jwt.getClaimAsStringList("roles");
76:             if (roles != null) {
77:                 roles.stream()
78:                         .filter(role -> role != null && !role.isBlank())
79:                         .map(role -> new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_" + role))
80:                         .forEach(authorities::add);
81:             }
82:             String scopes = jwt.getClaimAsString("scope");
83:             if (scopes != null) {
84:                 for (String scope : scopes.trim().split("\\s+")) {
85:                     if (!scope.isBlank()) {
86:                         authorities.add(new org.springframework.security.core.authority.SimpleGrantedAuthority("SCOPE_" + scope));
87:                     }
88:                 }
89:             }
90:             return new JwtAuthenticationToken(jwt, authorities, jwt.getSubject());
91:         };
92:     }
93: 
94:     @Bean
95:     SecurityFilterChain securityFilterChain(
96:             HttpSecurity http,
97:             Converter<Jwt, ? extends AbstractAuthenticationToken> jwtAuthenticationConverter,
98:             AuthenticationEntryPoint authenticationEntryPoint,
99:             AccessDeniedHandler accessDeniedHandler
100:     ) throws Exception {
101:         http
102:                 .csrf(csrf -> csrf.disable())
103:                 .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
104:                 .authorizeHttpRequests(authorize -> authorize
105:                         .requestMatchers(HttpMethod.GET, "/v3/api-docs/**", "/v3/api-docs.yaml",
106:                                 "/swagger-ui/**", "/swagger-ui.html").permitAll()
107:                         .requestMatchers(HttpMethod.POST, "/internal/v1/orders/from-offer")
108:                         .access(serviceScope("order:create-from-offer"))
109:                         .requestMatchers(HttpMethod.GET, "/internal/v1/orders/*/context")
110:                         .access(serviceScope("order:context:read"))
111:                         .requestMatchers("/internal/v1/**").denyAll()
112:                         .requestMatchers(HttpMethod.PATCH, "/api/v1/admin/reviews/**")
113:                         .access(userRole("ROLE_ADMIN"))
114:                         .requestMatchers(HttpMethod.POST, "/api/v1/orders/direct",
115:                                 "/api/v1/orders/*/review")
116:                         .access(userRole("ROLE_CUSTOMER"))
117:                         .requestMatchers(HttpMethod.PATCH, "/api/v1/orders/*/review")
118:                         .access(userRole("ROLE_CUSTOMER"))
119:                         .requestMatchers(HttpMethod.DELETE, "/api/v1/orders/*/review")
120:                         .access(userRole("ROLE_CUSTOMER"))
121:                         .requestMatchers("/api/v1/**").access(userToken())
122:                         .anyRequest().denyAll())
123:                 .oauth2ResourceServer(resourceServer -> resourceServer
124:                         .jwt(jwt -> jwt.jwtAuthenticationConverter(jwtAuthenticationConverter))
125:                         .authenticationEntryPoint(authenticationEntryPoint)
126:                         .accessDeniedHandler(accessDeniedHandler))
127:                 .exceptionHandling(exceptions -> exceptions
128:                         .authenticationEntryPoint(authenticationEntryPoint)
129:                         .accessDeniedHandler(accessDeniedHandler));
130:         return http.build();
131:     }
132: 
133:     @Bean
134:     AuthenticationEntryPoint authenticationEntryPoint(ObjectMapper objectMapper) {
135:         return (request, response, exception) -> {
136:             response.setStatus(HttpStatus.UNAUTHORIZED.value());
137:             response.setContentType(MediaType.APPLICATION_JSON_VALUE);
138:             response.setCharacterEncoding("UTF-8");
139:             objectMapper.writeValue(response.getWriter(), ApiResponse.error(
140:                     HttpStatus.UNAUTHORIZED.value(), "Authentication is required or token is invalid"));
141:         };
142:     }
143: 
144:     @Bean
145:     AccessDeniedHandler accessDeniedHandler(ObjectMapper objectMapper) {
146:         return (request, response, exception) -> {
147:             response.setStatus(HttpStatus.FORBIDDEN.value());
148:             response.setContentType(MediaType.APPLICATION_JSON_VALUE);
149:             response.setCharacterEncoding("UTF-8");
150:             objectMapper.writeValue(response.getWriter(), ApiResponse.error(
151:                     HttpStatus.FORBIDDEN.value(), "Access is denied"));
152:         };
153:     }
154: 
155:     private AuthorizationManager<RequestAuthorizationContext> userToken() {
156:         return tokenType("user");
157:     }
158: 
159:     private AuthorizationManager<RequestAuthorizationContext> userRole(String requiredAuthority) {
160:         return (authentication, context) -> {
161:             Authentication resolved = authentication.get();
162:             boolean allowed = resolved instanceof JwtAuthenticationToken jwtAuthentication
163:                     && resolved.isAuthenticated()
164:                     && "user".equals(jwtAuthentication.getToken().getClaimAsString("token_type"))
165:                     && hasAuthority(resolved, requiredAuthority);
166:             return new AuthorizationDecision(allowed);
167:         };
168:     }
169: 
170:     private AuthorizationManager<RequestAuthorizationContext> serviceScope(String requiredScope) {
171:         return (authentication, context) -> {
172:             Authentication resolved = authentication.get();
173:             boolean allowed = resolved instanceof JwtAuthenticationToken jwtAuthentication
174:                     && resolved.isAuthenticated()
175:                     && "service".equals(jwtAuthentication.getToken().getClaimAsString("token_type"))
176:                     && hasAuthority(resolved, "SCOPE_" + requiredScope);
177:             return new AuthorizationDecision(allowed);
178:         };
179:     }
180: 
181:     private AuthorizationManager<RequestAuthorizationContext> tokenType(String expectedType) {
182:         return (authentication, context) -> {
183:             Authentication resolved = authentication.get();
184:             boolean allowed = resolved instanceof JwtAuthenticationToken jwtAuthentication
185:                     && resolved.isAuthenticated()
186:                     && expectedType.equals(jwtAuthentication.getToken().getClaimAsString("token_type"));
187:             return new AuthorizationDecision(allowed);
188:         };
189:     }
190: 
191:     private boolean hasAuthority(Authentication authentication, String requiredAuthority) {
192:         return authentication.getAuthorities().stream()
193:                 .anyMatch(authority -> requiredAuthority.equals(authority.getAuthority()));
194:     }
195: }
```

### ResourceSecurityConfiguration.java — platform-support

[ResourceSecurityConfiguration.java:1](../../backend/platform-support/src/main/java/com/se193262/platform/config/ResourceSecurityConfiguration.java#L1)

```java
1: package com.se193262.platform.config;
2: 
4: 
17: 
19: 
21: 
22: @Configuration
23: @EnableMethodSecurity
24: public class ResourceSecurityConfiguration {
25:     @Bean
26:     JwtDecoder jwtDecoder(SecurityProperties properties, RemoteProperties remote) {
27:         var factory = new org.springframework.http.client.SimpleClientHttpRequestFactory();
28:         factory.setConnectTimeout(remote.connectTimeout());
29:         factory.setReadTimeout(remote.readTimeout());
30:         var rest = new org.springframework.web.client.RestTemplate(factory);
31:         var decoder = NimbusJwtDecoder.withJwkSetUri(properties.jwkSetUri()).restOperations(rest).jwsAlgorithm(SignatureAlgorithm.RS256).build();
32:         decoder.setJwtValidator(new DelegatingOAuth2TokenValidator<>(JwtValidators.createDefaultWithIssuer(properties.issuer()), token -> {
33:             String type = token.getClaimAsString("token_type");
34:             String audience = "service".equals(type) ? properties.audience() : "user".equals(type) ? properties.userAudience() : null;
35:             return audience != null && token.getAudience().contains(audience) && token.getSubject() != null ? org.springframework.security.oauth2.core.OAuth2TokenValidatorResult.success() : org.springframework.security.oauth2.core.OAuth2TokenValidatorResult.failure(new org.springframework.security.oauth2.core.OAuth2Error("invalid_token"));
36:         }));
37:         return decoder;
38:     }
39: 
40:     @Bean
41:     SecurityFilterChain security(HttpSecurity http, ObjectMapper mapper) throws Exception {
42:         http.csrf(c -> c.disable()).sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS)).authorizeHttpRequests(a -> a.requestMatchers("/actuator/health", "/actuator/health/**").permitAll().requestMatchers(HttpMethod.GET, "/v3/api-docs/**", "/v3/api-docs.yaml", "/swagger-ui/**", "/swagger-ui.html").permitAll().requestMatchers("/internal/v1/**").access((authentication, context) -> new AuthorizationDecision(isType(authentication.get(), "service"))).requestMatchers("/api/v1/**").access((authentication, context) -> new AuthorizationDecision(isType(authentication.get(), "user"))).anyRequest().denyAll()).oauth2ResourceServer(o -> o.jwt(j -> j.jwtAuthenticationConverter(token -> {
43:             List<SimpleGrantedAuthority> authorities = new ArrayList<>();
44:             if ("user".equals(token.getClaimAsString("token_type"))) {
45:                 List<String> roles = token.getClaimAsStringList("roles");
46:                 if (roles != null) roles.forEach(r -> authorities.add(new SimpleGrantedAuthority("ROLE_" + r)));
47:             } else {
48:                 String scopes = token.getClaimAsString("scope");
49:                 if (scopes != null)
50:                     Arrays.stream(scopes.split(" ")).filter(s -> !s.isBlank()).forEach(s -> authorities.add(new SimpleGrantedAuthority("SCOPE_" + s)));
51:             }
52:             return new JwtAuthenticationToken(token, authorities);
53:         })).authenticationEntryPoint((request, response, error) -> {
54:             response.setStatus(401);
55:             response.setContentType("application/json");
56:             mapper.writeValue(response.getWriter(), ApiResponse.error(401, "Authentication required"));
57:         })).exceptionHandling(e -> e.accessDeniedHandler((request, response, error) -> {
58:             response.setStatus(403);
59:             response.setContentType("application/json");
60:             mapper.writeValue(response.getWriter(), ApiResponse.error(403, "Access denied"));
61:         }));
62:         return http.build();
63:     }
64: 
65:     private boolean isType(org.springframework.security.core.Authentication auth, String type) {
66:         return auth instanceof JwtAuthenticationToken token && type.equals(token.getToken().getClaimAsString("token_type"));
67:     }
68: }
```

### SecurityProperties.java — platform-support

[SecurityProperties.java:1](../../backend/platform-support/src/main/java/com/se193262/platform/config/SecurityProperties.java#L1)

```java
1: package com.se193262.platform.config;
2: 
4: 
5: @ConfigurationProperties("platform.security")
6: public record SecurityProperties(
7:         String audience, String jwkSetUri, String issuer, String userAudience) {}
```

### SecurityConfig.java — subscription-service

[SecurityConfig.java:1](../../backend/subscription-service/src/main/java/com/se193262/subscriptionservice/security/SecurityConfig.java#L1)

```java
1: package com.se193262.subscriptionservice.security;
2: 
25: 
28: 
29: @Configuration
30: @EnableWebSecurity
31: @EnableMethodSecurity
32: public class SecurityConfig {
33:     private final String serviceAudience;
34: 
35:     public SecurityConfig(@Value("${security.jwt.service-audience:subscription-service}") String serviceAudience) {
36:         this.serviceAudience = serviceAudience;
37:     }
38: 
39:     @Bean
40:     SecurityFilterChain securityFilterChain(HttpSecurity http,
41:             JwtAuthenticationConverter jwtAuthenticationConverter,
42:             AuthenticationEntryPoint authenticationEntryPoint,
43:             AccessDeniedHandler accessDeniedHandler) throws Exception {
44:         http
45:                 .csrf(csrf -> csrf.disable())
46:                 .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
47:                 .authorizeHttpRequests(authorize -> authorize
48:                         .requestMatchers(HttpMethod.GET, "/v3/api-docs/**", "/swagger-ui/**", "/swagger-ui.html")
49:                         .permitAll()
50:                         .requestMatchers(HttpMethod.GET,
51:                                 "/internal/v1/subscriptions/bakeries/{bakeryId}/entitlement")
52:                         .access(serviceScope("subscription:entitlement:read"))
53:                         .requestMatchers("/internal/v1/**").denyAll()
54:                         .requestMatchers(HttpMethod.GET,
55:                                 "/api/v1/subscription-plans",
56:                                 "/api/v1/subscription-plans/{planId}")
57:                         .permitAll()
58:                         .requestMatchers("/api/v1/admin/**").access(userRole("ADMIN"))
59:                         .requestMatchers(HttpMethod.POST,
60:                                 "/api/v1/bakeries/{bakeryId}/subscription-orders",
61:                                 "/api/v1/subscription-orders/{orderId}/payments")
62:                         .access(userRole("BAKERY_OWNER", "CUSTOMER"))
63:                         .requestMatchers(HttpMethod.GET,
64:                                 "/api/v1/bakeries/{bakeryId}/subscription",
65:                                 "/api/v1/bakeries/{bakeryId}/subscription-orders",
66:                                 "/api/v1/subscription-orders/{orderId}")
67:                         .access(userRole("BAKERY_OWNER", "CUSTOMER", "ADMIN"))
68:                         .anyRequest().denyAll())
69:                 .oauth2ResourceServer(resourceServer -> resourceServer
70:                         .jwt(jwt -> jwt.jwtAuthenticationConverter(jwtAuthenticationConverter))
71:                         .authenticationEntryPoint(authenticationEntryPoint)
72:                         .accessDeniedHandler(accessDeniedHandler))
73:                 .exceptionHandling(exceptions -> exceptions
74:                         .authenticationEntryPoint(authenticationEntryPoint)
75:                         .accessDeniedHandler(accessDeniedHandler));
76:         return http.build();
77:     }
78: 
79:     @Bean
80:     JwtAuthenticationConverter jwtAuthenticationConverter() {
81:         JwtGrantedAuthoritiesConverter roles = new JwtGrantedAuthoritiesConverter();
82:         roles.setAuthoritiesClaimName("roles");
83:         roles.setAuthorityPrefix("ROLE_");
84:         JwtAuthenticationConverter converter = new JwtAuthenticationConverter();
85:         converter.setJwtGrantedAuthoritiesConverter(roles);
86:         return converter;
87:     }
88: 
89:     private AuthorizationManager<RequestAuthorizationContext> userRole(String... roles) {
90:         return (authentication, context) -> {
91:             Authentication resolved = authentication.get();
92:             boolean allowed = resolved instanceof JwtAuthenticationToken jwtAuthentication
93:                     && resolved.isAuthenticated()
94:                     && "user".equals(jwtAuthentication.getToken().getClaimAsString("token_type"))
95:                     && isUuid(jwtAuthentication.getToken().getSubject())
96:                     && Arrays.stream(roles).anyMatch(role -> resolved.getAuthorities().stream()
97:                             .anyMatch(authority -> ("ROLE_" + role).equals(authority.getAuthority())));
98:             return new AuthorizationDecision(allowed);
99:         };
100:     }
101: 
102:     private AuthorizationManager<RequestAuthorizationContext> serviceScope(String scope) {
103:         return (authentication, context) -> {
104:             Authentication resolved = authentication.get();
105:             if (!(resolved instanceof JwtAuthenticationToken token) || !resolved.isAuthenticated()) {
106:                 return new AuthorizationDecision(false);
107:             }
108:             String correlationId = context.getRequest().getHeader("X-Correlation-Id");
109:             String scopes = token.getToken().getClaimAsString("scope");
110:             return new AuthorizationDecision("service".equals(token.getToken().getClaimAsString("token_type"))
111:                     && token.getToken().getAudience().contains(serviceAudience)
112:                     && correlationId != null && !correlationId.isBlank()
113:                     && scopes != null && Arrays.asList(scopes.split(" ")).contains(scope));
114:         };
115:     }
116: 
117:     private boolean isUuid(String value) {
118:         if (value == null) {
119:             return false;
120:         }
121:         try {
122:             UUID.fromString(value);
123:             return true;
124:         } catch (IllegalArgumentException exception) {
125:             return false;
126:         }
127:     }
128: 
129:     @Bean
130:     AuthenticationEntryPoint authenticationEntryPoint(ObjectMapper objectMapper) {
131:         return (request, response, exception) -> {
132:             response.setStatus(HttpStatus.UNAUTHORIZED.value());
133:             response.setContentType(MediaType.APPLICATION_JSON_VALUE);
134:             response.setCharacterEncoding("UTF-8");
135:             objectMapper.writeValue(response.getWriter(),
136:                     ApiResponse.error(HttpStatus.UNAUTHORIZED.value(), "Authentication is required or token is invalid"));
137:         };
138:     }
139: 
140:     @Bean
141:     AccessDeniedHandler accessDeniedHandler(ObjectMapper objectMapper) {
142:         return (request, response, exception) -> {
143:             response.setStatus(HttpStatus.FORBIDDEN.value());
144:             response.setContentType(MediaType.APPLICATION_JSON_VALUE);
145:             response.setCharacterEncoding("UTF-8");
146:             objectMapper.writeValue(response.getWriter(),
147:                     ApiResponse.error(HttpStatus.FORBIDDEN.value(), "Access is denied"));
148:         };
149:     }
150: }
```

## Findings liên quan

Xem [findings](BACKEND_AUDIT_FINDINGS_VI.md): cấu hình scope drift, JWT sau logout còn sống, lỗi dispatch HTTP403 che SQL và surface API thiếu cho mobile. Không có claim đã thử token RSA giả, token expired hoặc đổi role concurrent nếu runtime-cases không có case tương ứng.
