# ADR-002: Marketplace acceptance, Firebase and internal clients

- Status: Accepted (implementation requested by project owner)
- Date: 2026-10-17

## Decisions

Marketplace owns requests, preferences, image metadata, offers and acceptance workflows.
Cloud Storage for Firebase replaces MinIO for Marketplace reference images. Uploads pass
through the backend using existing Identity user JWTs. No Firebase Authentication is required.
Storage uses service-account IAM, private objects and V4 signed GET URLs lasting 15 minutes.
Client Firebase Security Rules deny all reads/writes. PostgreSQL stores object keys and byte size.
The Firebase project/bucket are fixed per deployment; changing them requires migrating objects.

Identity issues five-minute RS256 service JWTs at `/internal/v1/auth/service-token`.
Clients authenticate with configured BCrypt secret hashes and exact target-audience/scope grants.
Only Identity has the signing private key. HTTP clients cache tokens with 30-second expiry skew,
propagate correlation IDs and have configured connect/read timeouts. There is no automatic POST retry.

A small `platform-support` Maven library contains only technical JWT/HTTP/envelope/error utilities.
No domain entities/repositories are shared. Each service retains its own database and API contracts.
Executable service artifacts use the `exec` classifier so the separate integration-test module can
consume the plain jars without introducing production dependencies between domain services.

## Offer acceptance

`offer_acceptance_workflows` stores PREPARED/RETRYING/SUCCEEDED/FAILED, actor/key, payload hash,
address/note, lease, retry counters and order result. Domain request/offer enums stay unchanged.
A partial unique index reserves each request for at most one active or successful workflow.
Every mutation of a request or its offers touches the request's optimistic version.

1. A short local transaction validates ownership/state, reserves the request and persists the command.
2. After commit, a worker claims a 30-second lease and calls Order using `accept-offer:{offerId}`.
3. Order checks persisted key/payload before fetching snapshots. Unique offer ID and the local
   creation-key record guarantee one committed order even under concurrent calls.
4. Marketplace finalizes ACCEPTED/OFFER_SELECTED, rejects other pending offers and writes history.

A definitive 404/422 from Order releases the reservation as FAILED and preserves the failed-key result.
Timeout, transport errors, 409 or 5xx keep the reservation retryable; an ambiguous result never permits
accepting another offer. The scheduler uses durable leases/backoff capped at 300 seconds and does not
abandon ambiguous work. Replaying a committed order completes finalization after a restart.

## Lifecycle and storage compensation

Offer deadline closes submission, not acceptance of unexpired offers. OPEN requests close at neededAt.
Scheduler audit entries use the request customer as business actor with an explicit automatic reason.
Workflow reservations block mutation, expiry and cancellation until resolved.

Upload and metadata persistence use separate phases. DB failure cleans uploaded objects; deletion
commits metadata first and performs best-effort object deletion. A paginated cleanup removes only
Marketplace-prefix objects older than 24 hours that have no metadata row. Public responses never
expose object keys or permanent download tokens.

## Local deployment

Compose runs Identity + Marketplace and two PostgreSQL 17 containers. Firebase remains external.
Other internal services are configured externally; required calls fail with 503 if unavailable.
External RSA PEM and Firebase JSON files are mounted read-only and excluded from images.
Development fixture SQL lives outside Flyway and is never automatically applied in production.
