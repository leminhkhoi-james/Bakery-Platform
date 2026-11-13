# Cake AI / Firebase / Marketplace live smoke — 2026-10-24

Result: **PASSED**, using real Gemini, private Cloud Storage for Firebase, Identity JWTs,
Marketplace and Cake AI in the root Docker Compose stack. No external adapters were mocked.

## Verified flow

1. All three services and their separate PostgreSQL databases are healthy.
2. Registered two disposable customers and logged in through Identity.
3. Marketplace created a DRAFT request and uploaded a real JPEG reference to Firebase.
4. The signed reference URL returned byte-identical content. Unsigned access returned HTTP 403.
5. Cake AI accepted the multipart request with source image and idempotency key as HTTP 202.
6. The durable job transitioned QUEUED → PROCESSING → SUCCEEDED using `gemini-nano-banana-2.1`.
7. Automatic Gemini moderation returned APPROVED. Firebase stored the generated image and thumbnail.
8. Signed URLs downloaded the generated JPEG (1024 × 1024, 502,520 bytes) and thumbnail (10,305 bytes).
9. Replaying the create command returned the same job and original acceptance response.
10. Another customer was denied job/design access (403); anonymous job access was denied (401).
11. Marketplace obtained a scoped service JWT, validated the design through Cake AI and selected it.
12. Marketplace GET and its database both confirmed the persisted selected design.

## Trace references

- Cake request: `e41c3ff4-cb85-4c7c-b409-fa6111f804e4`
- Generation job: `616246cb-27b6-4d42-b15e-0b26364eb7d6`
- Generated and selected design: `0b924fc6-96a0-437f-aef5-41fc3f57d5c8`
- Job/execution statuses: SUCCEEDED / SUCCEEDED; moderation: APPROVED; request remains DRAFT.
- Image SHA-256: `93c757c2d21dcfb723c7515153e6f38f15d8c319f682959c92270039b6468beb`.

Test fixtures and Firebase objects are retained for inspection. No additional generation was issued
while recovering the selection check. Temporary customer passwords, tokens and signed URLs are not
included in this report or the JSON evidence.

## Local configuration issue resolved

The existing Marketplace BCrypt hash in the ignored root `.env` did not match its client secret.
Identity correctly rejected its service-token request with 401. Recomputed the local hash from the
existing secret and restarted Identity. Selection then passed with the original generated design.
Only the disposable smoke customer's password was refreshed to resume authentication after the test
process exited. No business authorization or moderation rules were bypassed.

Added missing local Cake AI DB/client credentials. The Gemini key was supplied to the Cake AI
container through the launching process environment, without adding it to tracked files or `.env`.
The three service images were built from source and remain running. Supply `GEMINI_API_KEY` when
recreating the Cake AI container.

## Repeat the test

The opt-in script creates labeled test data and makes one real, potentially billable generation:

```powershell
python scripts/smoke_cake_ai_live.py --source C:/path/to/reference.jpg --output-dir C:/path/to/results
```

It requires the configured stack to be running. Output includes a secret-free JSON report and local
copies of the image/thumbnail. It never prints access tokens or signed URLs. A run that fails before
completion records its failure; do not interpret an accepted job as a complete integration pass.
