# MASTER AUDIT PROMPT — BAKERY PLATFORM STORAGE PROVIDER & BUSINESS FLOW INVENTORY

## 0. ROLE, REPOSITORY, AND MISSION

Act as a Principal Backend/Microservices Architect, Spring Boot Engineer, Flutter/React Integration Reviewer, Cloud Storage/S3 Specialist, Security Auditor, and Senior QA Engineer.

Repository root: `H:\MSS\Bakery-Platform`

Your mission is to **determine, with current source-code and runtime evidence, precisely which Bakery Platform microservices, APIs, user interfaces, and end-to-end business flows use MinIO, Firebase Storage / Google Cloud Storage (GCS), another storage provider, local filesystem, database BLOB, or an in-memory fallback.**

The user already has Firebase and recently configured MinIO Native on Windows. They want an accurate architecture inventory before deciding whether keeping both storage providers is necessary. **Do not assume the historical provider allocations are still correct.**

This is a STRICT **AUDIT-ONLY / READ-ONLY / NO-REMEDIATION** assignment. Produce a single comprehensive report in Vietnamese. Do not migrate any file or change any configuration.

## 1. NON-NEGOTIABLE SAFETY BOUNDARIES

1. Do not modify, create, delete, rename, reformat, or regenerate any application source under `backend/`, `frontend/`, or `mobile/`.
2. Do not modify existing tests, build scripts, Gradle/Maven files, Docker Compose, root `.env`, `.gitignore`, documentation, or external secrets.
3. Do not stage, commit, push, pull, merge, reset, or checkout another branch.
4. Do not start/stop/recreate/reconfigure existing Docker containers. **Do not use Docker for the runtime audit**; inspect Compose files as text only. Existing native Java processes may be queried read-only where safe.
5. Do not reset databases, delete volumes, move objects, upload/delete real files, issue paid Gemini requests, or use shared/production cloud credentials for mutation tests.
6. Do not expose passwords, access keys, Firebase service-account JSON, JWTs, signed URLs, private object keys, customer file contents, or identifying customer data in logs, screenshots, scripts, or the report.
7. Treat `H:\MSS\Bakery-Platform\.env` as the authoritative configuration reference for the current native environment. Read it without modifying it. Do not silently override it with `H:\MSS\.secrets\bakery-platform\local-runtime.env` or any other dev-credential file. If a referenced credential file exists outside the repository, check presence/permissions/path safely, never dump its contents.
8. Work with existing infrastructure; do not start services that require altering the owner's environment. Nonmutating HTTP health/metadata checks are allowed, but authenticated requests must comply with scope and data-access restrictions.
9. Only ONE new repository file may be created: the final report at `H:\MSS\Bakery-Platform\docs\mobile\BAKERY_PLATFORM_STORAGE_MINIO_FIREBASE_USAGE_AUDIT_VI.md`. Temporary scripts/evidence (if absolutely necessary) must stay outside the repository and be redacted.
10. If a build or test would create files inside the repository, do not run it directly. Use an isolated temporary copy outside the repository, or mark the check not executed. This is an architecture and provider audit, not a development task.

## 2. BASELINE AND TRUST MODEL

- Record Git branch, HEAD, Git status, relevant working changes, and runtime date.
- Read all current repo instructions including `AGENTS.md` where present.
- Read the most relevant current technical docs and recent audit reports, including those under `docs/` and `docs/mobile/`, to understand historical findings, **but never substitute historical reports for current source/runtime proof**.
- Establish read-only integrity checks for backend/frontend/mobile, root `.env`, and relevant configuration files, without printing private contents.
- Identify exact configured Java native services: API Gateway (normally 8080) and business services (normally 8081–8087), but verify actual service-to-port mapping rather than assuming it.
- Keep three evidence levels separate: **(A) source implementation**, **(B) effective runtime configuration**, **(C) verified behavior**. A source dependency or a variable name alone is NOT proof that a storage provider is active or that an upload succeeds.

## 3. INVENTORY ALL STORAGE-RELATED COMPONENTS

Inspect the entire relevant Backend source and configuration, including at minimum:

- `identity-service`
- `bakery-service`
- `marketplace-service`
- `subscription-service`
- `order-service`
- `chat-service`
- `cake-ai-service`
- `api-gateway`
- `platform-support` and shared storage/auth modules
- Root/native startup scripts and Docker/Compose definitions **as read-only reference**

Discover any additional modules rather than assuming that these are exhaustive.

Search carefully for references to:

- MinIO Java SDK, S3 clients and endpoints, buckets, object keys, presigned URLs, S3-compatible storage, `MINIO_*`, `S3_*`, `AWS_*`.
- Firebase Admin SDK, Firebase Storage, GCS/Google Cloud Storage clients, ADC, service-account paths, `GOOGLE_APPLICATION_CREDENTIALS`, `FIREBASE_*`, `GCS_*`, `GOOGLE_CLOUD_*`.
- Local filesystem adapters, temporary upload locations, byte-array/BLOB storage, `ConcurrentHashMap` and in-memory fallbacks.
- Storage provider abstractions and interfaces, adapters, factories, Spring `@Conditional...` selection, feature flags, profiles, and conditional bean initialization.
- Storage-specific APIs: multipart upload, image retrieval, download redirect/proxy, delete, attachment access, preview, signed URL creation, expiration, retry, orphan cleanup, content-type, object path generation, and object lifecycle.
- Provider-specific dependencies in `pom.xml` and actual Java imports/call sites.

**Distinguish storage products accurately:** Firebase Authentication, Firebase Cloud Messaging, and Firebase Analytics are NOT evidence of Firebase Storage. Firebase Storage and direct GCS may refer to the same underlying bucket but use different APIs/credential paths. A Firebase credential file's existence is NOT evidence that a service uses it. A MinIO/S3 client dependency is NOT evidence its code path is active.

## 4. PER-SERVICE STORAGE SOURCE-TO-SINK TRACE

For every service with a storage-relevant operation, trace the real path end to end:

`Controller / event handler -> request DTO -> validation -> service -> storage abstraction -> concrete adapter -> SDK/HTTP client -> configured endpoint and bucket -> metadata persistence -> response DTO / download URL`.

For each operation, identify:

1. Exact controller file, method, HTTP method and route; or event/job entry point.
2. Entity ownership and relevant roles (Guest, Customer, Bakery Owner, Admin, internal service).
3. Uploaded/downloaded/deleted object type and business purpose.
4. The **actual provider** selected in source under each profile/feature flag.
5. The provider when running the native root `.env`, if verifiable.
6. The provider under existing Docker configurations, from static configuration only (no container execution).
7. Required environment variable names (names only), endpoint scheme, bucket setting (non-secret names), and credential source type.
8. File metadata stored in PostgreSQL, including object key and snapshot/URL handling.
9. Public and internal endpoints; whether a hostname is client-accessible.
10. Signed URL creation, authorization, expiry and restrictions.
11. Failure and fallback behavior: fail-closed, HTTP 503, retry, in-memory fallback, mock, local file, or silent success.
12. Delete/cleanup behavior, retention and orphan sweeper, and consistency between database row and object.
13. Known configuration drift, stale deployment risk, or local-only behavior.

Explicitly answer whether a service **could operate with Firebase instead of MinIO without source changes** or whether the current implementation hard-depends on MinIO. Distinguish confirmed implementation facts from proposed future changes.

## 5. MANDATORY BUSINESS-FLOW MAPPING

Review all documented roles and workflows from current source. At minimum investigate:

**A — Customer -> Bakery Owner:** registration, onboarding, owner verification, shop logo/cover, subscription evidence, admin approvals, product creation, product/add-on images.

**B — Direct Checkout:** browse catalog/product photos, owner image upload/publish, cart, order creation, address, order lifecycle, review images if any. Identify which stage requires storage and whether an already-published product bypasses an upload prerequisite.

**C — RFQ -> Offer -> Order:** RFQ image upload/delete, bakery offers, possible attachment links, order creation; specify whether RFQ uses Firebase/GCS or MinIO and whether storage changes between stages.

**D — Subscription:** subscription proof upload, approval/rejection, download/preview, renewal and evidence retention.

**E — Chat:** chat attachments, direct/internal MinIO, public signed URL or authenticated proxy, Android/Web access and message metadata.

**F — Cake AI:** Gemini image output, GCS/Firebase persistence, pending Admin preview, moderation, approved design selection into RFQ, image durability and whether any Java2D/RAM fallback remains.

**G — Session, Account and Administration:** avatar uploads, review/moderation media, admin file views, any other storage usage genuinely present.

Discover **all other storage-related flows** beyond A–G. For each flow record: exact role, UI action, API chain, storage provider per step, bucket/object type, failure consequences, whether provider is required/optional, and evidence.

Do not confuse a UI displaying a remote image URL with the service that actually stores that image. Trace origin and owner of the file.

## 6. BACKEND VS WEB VS FLUTTER CONSUMERS

Read `frontend/` and `mobile/` **read-only**. For each operation:

- Identify the screen/page/widget and client API method.
- Determine whether the client uploads bytes to Backend, uses a provider SDK directly, or only consumes a signed URL returned by Backend.
- Trace whether Web and Android use the same service/provider or different APIs.
- Identify outdated local/mock upload paths, broken links, preview expiry assumptions, CORS issues and internal Docker hostnames returned to clients.
- Record whether removing MinIO or adopting only Firebase would require Web/Mobile changes.
- Never edit either client.

## 7. EFFECTIVE ROOT .ENV, NATIVE RUNTIME AND PROVIDER SELECTION

Inspect `H:\MSS\Bakery-Platform\.env` strictly read-only and produce a **redacted presence/mapping matrix**:

- Variable name; set/empty/missing/duplicate/conflicting; expected Spring property; consuming service; provider; env/profile requirements; availability of referenced credential files (presence only).
- The active native launcher and process environment injection logic.
- Native endpoints and port listeners, if services are already running.
- Whether MinIO Native configured ports are actually listening and return a safe `/minio/health/live` response (HTTP status only).
- Whether the root `.env` points to Docker-only hostnames or a Windows-local endpoint.
- Whether Firebase/GCS is selected via ADC, application properties, or provider-specific flags.
- Whether root `.env` contains competing Firebase and MinIO settings for the same service and which branch actually takes precedence.
- Whether credentials are simply defined or demonstrably accepted in permitted, read-only checks.

Do NOT create cloud objects or perform paid Gemini requests. Do not start/stop/change existing services. If runtime verification is not possible, label **SOURCE_CONFIRMED_RUNTIME_UNVERIFIED** instead of inventing active-provider claims.

## 8. READ-ONLY VERIFICATION AND OPTIONAL SAFE TESTS

Primary evidence must come from source, configs and safe runtime inspection.

When permitted and already operational, use strictly nonmutating tests such as:

- Check API service readiness/health endpoints without exposing sensitive data.
- Query documented nonmutating endpoint schemas, OpenAPI docs, and application status.
- Check native MinIO health endpoint, with no bucket deletion or object writes.
- Inspect provider selection logs with secrets/PII redacted.
- Verify a designated synthetic public or authorized test object **only if it already exists** and reading it is allowed; do not list other users' private objects.

Do not treat the absence of a read-only sample object as evidence upload cannot work. Do not claim E2E upload PASS from an HTTP health status alone.

Each verification must have evidence (path+line or command with sanitized HTTP result), expected result, actual result and scope limitations.

## 9. REQUIRED ANALYTICAL OUTPUTS

Produce the following report tables, grounded in current implementation:

### Matrix 1: Per microservice
`Service | Ports/routes | Storage role | MinIO (source/runtime) | Firebase/GCS (source/runtime) | Other fallback | Bucket/object type | Actual status | Evidence`

### Matrix 2: Per API/operation
`Method/path | Service | Auth roles | File operation | Concrete provider | Configuration | Storage failure response | Web consumer | Mobile consumer | Evidence`

### Matrix 3: Per full business flow
`Flow/substep | Acting role | API chain | Source of media | Storage provider | Required/optional | Read/write/delete | Operational consequence | Verification status`

### Matrix 4: Configuration drift
`Variable | Expected module/property | Root .env status | Native runtime outcome | Compose comparison | Risk/required future action`

### Matrix 5: Potential Firebase-only migration (analysis ONLY)
`Service | Current MinIO dependency | Existing storage abstraction | Could switch by config alone? | Backend work required | Web impact | Mobile impact | Existing-object migration | Security/cost/risk`

For every table, distinguish **CONFIRMED**, **INFERRED**, and **NOT VERIFIED** rather than guessing. Count unique endpoints and provider-dependent flows from current source, not a historical fixed total.

## 10. EXACT QUESTIONS TO ANSWER IN VIETNAMESE

1. Which Bakery Platform services genuinely store objects in MinIO today? Which use Firebase/GCS? Which use neither or a hybrid?
2. Precisely which user actions and A–G flows write, read, preview, and delete files in each provider?
3. Does any service select both MinIO and Firebase conditionally? Under which exact profile/env variables?
4. Why did the previous native Backend audit describe Direct Checkout and Chat attachment as MinIO-dependent? Does current source confirm that?
5. Does Bakery product publishing genuinely require a file upload, or was the previous blocker specific to test-fixture preparation?
6. Which Firebase/GCS buckets are referenced, and are they for RFQ, Cake AI, or other modules?
7. Is there any in-memory or local fallback that risks falsely reporting success or losing data after restart?
8. Is MinIO Native now reachable in the user's environment, and does that prove actual upload support (explain limitation)?
9. Would removing MinIO today break any existing service or API? Name exact files and business flows.
10. Can Bakery, Chat, and Subscription reuse the existing Firebase/GCS setup without changing source? If not, list concrete adaptations and migration concerns—but DO NOT implement them.
11. What would change in Backend, Web and Flutter if the owner decided to adopt Firebase-only storage?
12. What is the recommended architecture based on current evidence—keep hybrid, or investigate consolidation—and why? Be explicit about operational cost, security, migration complexity and provider lock-in; do not fabricate prices.

## 11. FINAL VIETNAMESE MARKDOWN REPORT — ONE FILE ONLY

Create exactly this report:

`H:\MSS\Bakery-Platform\docs\mobile\BAKERY_PLATFORM_STORAGE_MINIO_FIREBASE_USAGE_AUDIT_VI.md`

Write a detailed Vietnamese report with these sections:

1. Tóm tắt điều hành và kết luận trả lời ngay câu hỏi MinIO vs Firebase.
2. Phạm vi kiểm tra, Git baseline, nguồn chứng cứ và giới hạn.
3. Kiến trúc lưu trữ và sơ đồ luồng dữ liệu theo service.
4. Ma trận tổng hợp từng microservice.
5. Danh mục đầy đủ API và phương thức lưu trữ sử dụng.
6. Phân tích Bakery Service và sản phẩm/ảnh.
7. Phân tích Chat Service và attachment.
8. Phân tích Subscription Service và chứng từ.
9. Phân tích Marketplace RFQ và ảnh.
10. Phân tích Cake AI/Gemini và GCS/Admin moderation.
11. Identity/Order/API Gateway và những chức năng lưu trữ liên quan khác.
12. Ma trận các luồng nghiệp vụ A–G và mọi luồng bổ sung.
13. Tác động và sự khác biệt giữa Flutter Android và Web Frontend.
14. Root `.env` và cấu hình runtime thực tế (không công bố secrets).
15. Kết quả kiểm tra MinIO Native/Firebase ở mức an toàn, phân biệt runtime và source.
16. Lỗi, rủi ro và các hành vi fallback/storage chưa được xác minh.
17. Ma trận phụ thuộc nếu muốn loại bỏ MinIO và chuyển sang Firebase/GCS.
18. Đề xuất kiến trúc và kế hoạch chuyển đổi (chỉ phân tích).
19. Bảng bằng chứng đường dẫn source, class/method, dòng code, cấu hình và HTTP status.
20. Những câu hỏi chưa trả lời được và bước kiểm chứng tiếp theo.
21. Kiểm tra tính toàn vẹn: Backend/Frontend/Mobile/.env/secrets không bị sửa.
22. Kết luận cuối cùng với danh sách service và flow theo provider.

The report must be a decision-grade architecture audit, not a speculative overview. Include precise file paths and source line references whenever feasible. No source/configuration changes, no fake test results, and no migration implementation.

## 12. FINAL EXECUTION ORDER

1. Read instructions/reports and capture baseline.
2. Enumerate storage-related dependencies and concrete adapters in all Backend modules.
3. Trace every storage-related API and persistence path.
4. Trace business flows A–G and discover additional flows.
5. Check Web and Flutter consumers read-only.
6. Resolve provider selection from root `.env` and native Spring property bindings.
7. Perform safe, nonmutating runtime verification where available.
8. Produce source-evidence-backed matrices and recommendations.
9. Confirm protected files were not modified.
10. Write the single Vietnamese Markdown report.
11. Return a short Vietnamese summary of the actual findings, report path, and unverified items.

**STOP after the report. DO NOT FIX, MIGRATE, RECONFIGURE, OR DEPLOY ANYTHING.**
