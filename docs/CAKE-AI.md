# Cake AI: local setup and API

## Credentials and startup

The root Compose stack now includes Identity (8081), Marketplace (8082), Cake AI (8085) and
three isolated PostgreSQL databases. Firebase and Gemini are external services.

Add these settings to the root `.env`, using `.env.example` as a guide:

```dotenv
CAKE_AI_DB_USERNAME=cake_ai
CAKE_AI_DB_PASSWORD=your-separate-db-password
CAKE_AI_CLIENT_SECRET=your-random-service-secret
CAKE_AI_CLIENT_SECRET_HASH='your-bcrypt-hash'
GEMINI_API_KEY=your-gemini-key
GEMINI_IMAGE_MODEL=gemini-nano-banana-2.1
GEMINI_MODERATION_MODEL=gemini-3.8-flash
```

Generate the service secret's BCrypt hash locally with Spring Security, as described in
[DOCKER.md](DOCKER.md). Identity receives the hash; Cake AI receives the matching raw secret.
Create a Gemini key at [Google AI Studio](https://aistudio.google.com/apikey) with access/quota for
both configured models. Model availability and charges depend on the account; do not assume free quota.

Reuse `FIREBASE_PROJECT_ID`, `FIREBASE_STORAGE_BUCKET` and `FIREBASE_CREDENTIALS_FILE` from
[FIREBASE-SETUP.md](FIREBASE-SETUP.md). Optionally configure `CAKE_AI_FIREBASE_CREDENTIALS_FILE`
with a separate service account authorized on the same private bucket. Its JSON must support V4
signing and be stored outside Git. An empty Gemini key permits startup but new generation returns 503.

```powershell
docker compose config --quiet
docker compose up --build -d identity-service marketplace-service cake-ai-service
docker compose logs --tail 100 cake-ai-service
```

Health/readiness: `http://localhost:8085/actuator/health/readiness`. Running outside Docker defaults
to port 8080; set `SERVER_PORT=8085`, the three `CAKE_AI_DB_*` variables, service credentials and
`GOOGLE_APPLICATION_CREDENTIALS`. Outbound URLs use `IDENTITY_SERVICE_BASE_URL`,
`IDENTITY_JWK_SET_URI`, and `MARKETPLACE_SERVICE_BASE_URL`.

## API walkthrough

1. Login through Identity. Create an OPEN_CUSTOM DRAFT request through Marketplace with the customer JWT.
2. POST `/api/v1/generation-jobs` on Cake AI using that JWT and a fresh `Idempotency-Key`.
   Multipart `metadata` is JSON, e.g.:

```json
{
  "cakeRequestId": "your-request-uuid",
  "prompt": "Bánh sinh nhật hai tầng màu pastel, hoa mẫu đơn hồng",
  "negativePrompt": "watermark, people",
  "generationParameters": { "aspectRatio": "1:1", "numberOfDesigns": 1 }
}
```

Optional `sourceImages` accepts up to five JPEG/PNG/WebP files, 10 MB each. The backend checks actual
content, not filename. Response 202 contains job ID,
QUEUED status, selected model, revision number and timestamps. Input moderation happens in the worker.

3. Poll GET `/api/v1/generation-jobs/{jobId}`. `data.job` contains status, safe error code and timestamps;
   `data.promptRevisions`, `data.sourceImages`, `data.generatedDesigns` contain details. Poll roughly every
   2 seconds until SUCCEEDED/FAILED/CANCELLED. List jobs with GET `/api/v1/generation-jobs?page=0&size=20`;
   optional filters are `cakeRequestId` and `status`.
4. APPROVED designs have signed image/thumbnail URLs and `expiresAt`; PENDING/REJECTED designs have
   no URLs. Refresh through the detail endpoint after expiry. Original source URLs appear only after
   successful input moderation.
5. PUT Marketplace `/api/v1/cake-requests/{requestId}/selected-design` with
   `{"generatedDesignId":"approved-design-uuid"}`. Marketplace validates ownership, request, moderation
   and successful job through a scoped service JWT. The customer chooses; generation never selects automatically.
6. Refine with POST `/api/v1/generation-jobs/{jobId}/prompt-revisions`, a new idempotency key, and JSON
   `{ "prompt": "Giữ kiểu bánh, đổi hoa sang hồng đậm", "generationParameters": { "numberOfDesigns": 1 } }`.
   Only SUCCEEDED/FAILED jobs can be refined. Existing sources and an approved previous-revision image
   provide context. Old designs remain if the new revision fails.
7. POST `/api/v1/generation-jobs/{jobId}/cancel` cancels QUEUED/PROCESSING jobs. It cannot guarantee
   cancellation of external billing. Admin may resolve PENDING via PATCH
   `/api/v1/admin/generated-designs/{designId}/moderation` with `{"moderationStatus":"APPROVED"}` or REJECTED.

Reusing an idempotency key returns the original acceptance response; GET job detail for current status.
Different payload with the same key returns 409. No automatic retry of provider generation occurs.
Provider errors and lease expiration fail the job; an explicit revision is the retry mechanism.

## Verification

From `backend/`:

```powershell
mvn -q -pl cake-ai-service -am test
mvn -q -pl cake-ai-integration-tests -am '-Dtest=CakeAiEndToEndTest' '-Dsurefire.failIfNoSpecifiedTests=false' test
```

Tests require Docker for PostgreSQL Testcontainers. The dedicated integration module uses actual
Identity JWT/JWK and service tokens with three real HTTP services, replacing only Gemini/Firebase.
No real provider credential or paid API call is used by automated tests.

For the live smoke test, configure the key, start the stack, then perform steps 1–5 with one image.
Verify Firebase contains the image/thumbnail, the returned signed URL renders the image, and
Marketplace persists the selected design. This live check passed on 2026-10-24 with real Gemini/Firebase and both domain services; see [live report](CAKE-AI-LIVE-SMOKE-2026-10-24.md).

Worker tuning (outside Compose, via environment or Spring configuration): `CAKE_AI_WORKERS=2`,
`CAKE_AI_LEASE_DURATION=30m`, `GEMINI_CONNECT_TIMEOUT=5s`, `GEMINI_READ_TIMEOUT=120s`.
Full property names are under `cake-ai`; scheduler disable: `cake-ai.scheduler-enabled=false`.

Repeat the opt-in live integration with `python scripts/smoke_cake_ai_live.py --source C:/path/to/reference.jpg --output-dir C:/path/to/results` after starting the configured stack. This creates labeled test fixtures and makes one paid-capable generation; use the test bucket/project.

Manual Postman walkthrough and importable collection: [Marketplace + Cake AI + Firebase test scenario](TEST-MARKETPLACE-CAKE-AI-FIREBASE.md).
