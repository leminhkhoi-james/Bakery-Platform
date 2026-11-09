# Ma trận API Cake AI và kết quả xác minh

Run `20261108T080611Z`. API thật của Docker; không phải test double. Kết quả provider thật vẫn BLOCKED.

## Inventory và Flutter

| Method/path | Quyền/consumer | Flutter | Source | Contract |
|---|---|---|---|---|
| `POST /api/v1/generation-jobs` | Customer | create | `backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/generation/GenerationController.java:19` | multipart metadata + optional sourceImages; Idempotency-Key; 202 |
| `GET /api/v1/generation-jobs` | Customer | list | `backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/generation/GenerationController.java:27` | zero-based page; size 1..100; status/cakeRequestId filters |
| `GET /api/v1/generation-jobs/{id}` | Customer own / Admin | detail | `backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/generation/GenerationController.java:34` | nested job/revisions/sources/designs |
| `POST /api/v1/generation-jobs/{id}/prompt-revisions` | Customer own | revise | `backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/generation/GenerationController.java:40` | SUCCEEDED/FAILED; JSON; Idempotency-Key; 202 |
| `POST /api/v1/generation-jobs/{id}/cancel` | Customer own | cancel | `backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/generation/GenerationController.java:46` | QUEUED/PROCESSING only |
| `GET /api/v1/generated-designs/{id}` | Customer own / Admin | design | `backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/design/DesignController.java:19` | approved image/thumbnail URLs only |
| `PATCH /api/v1/admin/generated-designs/{id}/moderation` | Admin | moderate | `backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/design/DesignController.java:25` | PENDING only; APPROVED/REJECTED |
| `GET /internal/v1/generated-designs/{id}/validation` | service scope cake-ai:design:validate | Host/internal/storage; không đưa service credential vào Flutter | `backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/design/DesignValidationController.java:18` | ownerMatches/requestMatches/moderation/jobStatus |
| `GET /internal/v1/cake-requests/{id}/generation-context` | service scope cake-ai:design:validate | Host/internal/storage; không đưa service credential vào Flutter | `backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/design/DesignValidationController.java:26` | hasJobs |
| `GET /storage/**` | public | Host/internal/storage; không đưa service credential vào Flutter | `backend/cake-ai-service/src/main/java/com/se193262/cakeaiservice/feature/design/PublicStorageController.java:21` | fallback byte route; not a signed URL |

## Từng kiểm tra runtime

Có 40 kiểm tra ban đầu; sau đối chiếu kỳ vọng 39 PASS, 1 FAIL thật. Bốn invalid-value trả422 đúng source; Admin có thêm CUSTOMER nên được list chính job của mình. Raw evidence được giữ nguyên, không chỉnh status thực tế.

| Trường hợp | Actor | HTTP thật | Kỳ vọng cuối | Kết quả |
|---|---|---|---|---|
| Cake AI host 20261108T080611Z | customer | 201 | 201 | PASS |
| Cake AI foreign ownership 20261108T080611Z | owner | 201 | 201 | PASS |
| Create multipart with controlled reference | customer | 202 | 202 | PASS |
| List own jobs zero-based page | customer | 200 | 200 | PASS |
| Filter by actual RFQ | customer | 200 | 200 | PASS |
| Replay same logical create | customer | 202 | 202 | PASS |
| Idempotency conflict | customer | 409 | 409 | PASS |
| Missing key | customer | 400 | 400 | PASS |
| Blank prompt | customer | 400 | 400 | PASS |
| Invalid ratio | customer | 422 | 422 | PASS |
| Invalid source bytes | customer | 422 | 422 | PASS |
| Invalid pagination | customer | 422 | 422 | PASS |
| Invalid status filter | customer | 422 | 422 | PASS |
| Anonymous jobs | anonymous | 401 | 401 | PASS |
| Admin cannot list Customer jobs | admin | 200 | 200 | PASS |
| Other Customer cannot read job | owner | 403 | 403 | PASS |
| Other Customer cannot revise job | owner | 403 | 403 | PASS |
| Other Customer cannot cancel job | owner | 403 | 403 | PASS |
| Customer job detail | customer | 200 | 200 | PASS |
| Admin job detail | admin | 200 | 200 | PASS |
| Cannot cancel terminal job | customer | 409 | 409 | PASS |
| Customer design detail | customer | 200 | 200 | PASS |
| Other Customer cannot read design | owner | 403 | 403 | PASS |
| Customer cannot moderate | customer | 403 | 403 | PASS |
| Admin design detail | admin | 200 | 200 | PASS |
| Admin cannot re-moderate already approved | admin | 409 | 409 | PASS |
| Invalid moderation status | admin | 400 | 400 | PASS |
| Marketplace selected design handoff | customer | 200 | 200 | PASS |
| Reconcile selected design | customer | 200 | 200 | PASS |
| Create revision | customer | 202 | 202 | PASS |
| Replay revision | customer | 202 | 202 | PASS |
| Create cancellable job | customer | 202 | 202 | PASS |
| Cancel queued job | customer | 200 | 200 | PASS |
| Cancelled detail | customer | 200 | 200 | PASS |
| Create locally moderated rejection | customer | 202 | 202 | PASS |
| Foreign RFQ must be denied | customer | 202 | 403 | FAIL |
| Cancel unexpected foreign-RFQ job | customer | 200 | 200/409 | PASS |
| Internal design validation | marketplace-service | 200 | 200 | PASS |
| Internal request generation context | marketplace-service | 200 | 200 | PASS |
| Human cannot call internal validation | customer | 403 | 403 | PASS |

## Giới hạn và bằng chứng bổ sung

Foreign RFQ được nhận202 là lỗi quyền/context thật, đã hủy job qua API. Không có pending design hợp lệ để PATCH moderation thành công trong runtime; 409 của design đã APPROVED không phải bằng chứng approve/reject thành công.

Internal validation trả ownerMatches/requestMatches theo ID thật; human internal403. Kiểm tra này ở host với token service hợp lệ, không phải Mobile integration. Xem [internal-contract-verification.json](evidence/20261108T080611Z/internal-contract-verification.json).

Không xác minh live rate-limit/timeout/refusal của provider khi không có key. Unit test có test double cho các nhánh đó; không nhập vào kết quả live.

[Raw results](evidence/20261108T080611Z/host-api-results.json) · [Adjudication](evidence/20261108T080611Z/host-expectation-adjudication.json) · [Android reconciliation](evidence/20261108T080611Z/android-server-reconciliation.json).
