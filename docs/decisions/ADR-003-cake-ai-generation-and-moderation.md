# ADR-003: Durable Cake AI generation, Gemini and Firebase

- Status: Accepted (implementation requested by project owner)
- Date: 2026-10-23

Cake AI owns generation jobs, source images, prompt revisions, execution attempts and designs.
Marketplace alone owns `selected_design_id`. Identity issues user JWTs and five-minute scoped service
JWTs; Firebase Authentication is not introduced. Cake AI receives only the
`marketplace:request:read` grant for Marketplace context validation. Marketplace retains
`cake-ai:design:validate` for Cake AI.

## Execution and consistency

Each accepted revision creates one durable `generation_executions` row. The database queue uses
short local transactions, `FOR UPDATE SKIP LOCKED`, claim tokens and a configurable 30-minute lease.
Two workers run by default. All operations lock the job before mutating its execution, including
cancel, completion and expiry recovery. External calls and uploads never hold database transactions.
The JPA job projection validates the job schema; explicit PostgreSQL SQL implements queue locking,
conditional updates and idempotency. SQL writes increment the job's `version` mapped with `@Version`.

Create/revision require `Idempotency-Key` (1–128 characters). The customer, operation and key identify
a stored normalized payload fingerprint and immutable acceptance response. Replays return the same
response, even after job status changes; different payloads return 409. Transaction advisory locks
serialize concurrent identical keys. Source uploads happen before the final short transaction;
duplicate requests and failures compensate their own uncommitted objects.

Provider POSTs are not automatically retried, including 429 and ambiguous timeouts. A failed/expired
execution becomes FAILED; explicit refinement creates a new execution. Claim tokens and lease checks
prevent stale workers publishing after cancellation/recovery. Cancellation is local best effort and
cannot undo a provider charge. Partial execution output is not published; old revision designs survive.
Refinement uses all original references and one approved image from the immediately previous revision.
An old design remains subject to the existing Marketplace requirement that its job be SUCCEEDED.

## Provider and moderation

Gemini Interactions REST is used with configurable image and moderation models, dedicated timeouts,
bounded response size, server-selected model names and `store=false`. Model defaults are
`gemini-nano-banana-2.1` and `gemini-3.8-flash`; account availability must be verified in the live smoke
test. One API key supplies both capabilities. No Google/Gemini API secret is sent to the frontend.

The API accepts up to five 10 MB JPEG/PNG/WebP sources, validates actual image decoding and limits
pixel count to 25 million. Provider reference copies are scaled to at most 1536 pixels and encoded
as JPEG; original uploads remain unchanged. Outputs are 1K, 1–4 designs, aspect ratio 1:1/4:3/3:4.
Each design is generated through a separate provider call. Negative prompts become avoidance instructions.

Input moderation runs asynchronously before image generation. A structured Gemini classifier rejects
sexual content, graphic violence, hateful content and dangerous self-harm encouragement. Provider
refusals remain failures, never successful images. Rejected inputs fail the execution; uncertain or
unavailable input moderation fails without generating. Output moderation produces APPROVED/REJECTED/
PENDING. Invalid or unavailable output classification stays PENDING, without URLs or selection rights.
Admin can resolve PENDING designs. SUCCEEDED means all requested images were generated technically;
it does not imply all designs are approved. Automated checks do not guarantee detection of all abuse.

## Firebase and operations

Use a private Firebase bucket with separate `cake-ai/sources/{jobId}/`,
`cake-ai/designs/{jobId}/{executionId}/` and `cake-ai/thumbnails/{jobId}/{executionId}/` prefixes.
IAM service-account credentials authorize backend operations; client Security Rules remain deny-all.
Only approved images receive 15-minute V4 signed URLs after ownership/admin authorization. Source
URLs appear only after input moderation approval. No signed URL or image binary is stored in PostgreSQL.
Failed uploads/finalization compensate objects. Paginated cleanup only scans known Cake AI prefixes
and deletes objects older than 24 hours without DB references or an active execution for their job.

Compose adds a separate Cake AI PostgreSQL database and service on host port 8085. Identity and
Marketplace use container DNS, not host loopback. Credentials remain environment values or read-only
runtime mounts. Live smoke testing is deferred until the owner supplies the Gemini key.
