# Subscription Service

Runs on port `8084` with its own `subscription_db`. Local execution reads the
shared `backend/.env` from working directory `backend`. Its template is
`backend/.env.example`; configure database, Identity JWK, client secret, storage
and VNPay there. The real `.env` is ignored by Git. A static Bakery service
token is optional: leave it blank to acquire service JWTs automatically.

For the verified owner-only setup, run from the repository root:

```powershell
./scripts/Start-BakerySubscription.ps1 -LocalBuild -Verify
```

The `bakery-owner-dev` project uses separate volumes and preserves old databases.
Local Java/IntelliJ uses PostgreSQL on 5432, Identity on 8081, Bakery on 8082
and the shared config described in [local setup](../../docs/LOCAL-SETUP.md).
The optional separate Docker infrastructure exposes different DB/storage ports;
configure those in the shared file if choosing that setup.

From the repository root, `docker compose -f docker-compose.subscription-service.yml up --build`
starts Subscription, PostgreSQL and MinIO. The defaults expose PostgreSQL on
`5437`, MinIO on `9004` and its console on `9005`.

For Bakery membership and existence validation, configure SUBSCRIPTION_CLIENT_SECRET
and its matching BCrypt hash in Identity. The client obtains/caches service JWTs
for the Bakery audience with `bakery:membership:read bakery:profile:read` scopes.
Unavailable credentials or dependencies fail closed with `503`.
The entitlement route requires a service JWT for the Subscription audience with
`subscription:entitlement:read` scope.

To run Bakery and Subscription together on the same Docker network, follow
[the combined Docker stack guide](../../docs/DOCKER-BAKERY-SUBSCRIPTION.md).

See [JWT runtime verification](../../docs/JWT-LOCAL-VERIFICATION.md) for all domain
services and the real HTTP verification script.

From `backend/`, run the service tests with Docker available:

```powershell
mvn -pl subscription-service -am verify
```

Persistence/context tests use temporary PostgreSQL Testcontainers and a test
profile; they do not read local `.env` or use the development database. Without
Docker those tests are skipped. To use another installed PostgreSQL image, pass
`"-Dtest.postgres.image=postgres:16-alpine"` (default: `postgres:17-alpine`).

`scripts/Test-LocalJwt.ps1 -BakerySubscriptionOnly -WithStorage -ComposeProject bakery-owner-dev` exercises real
Identity/Bakery/Subscription JWT calls, proof upload and signed downloads, and
checks that unrelated customers cannot access private payments while the submitting owner/admin can.
Run it from the repository root against the local combined Compose stack.
