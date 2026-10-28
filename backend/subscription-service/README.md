# Subscription Service

Runs on port `8084` with its own `subscription_db`. Copy `.env.example` to `.env`
for local execution, then set the database, Identity JWK, Bakery service token
and MinIO values. The real `.env` file is ignored by Git.

For the verified owner-only setup, run from the repository root:

```powershell
./scripts/Start-BakerySubscription.ps1 -LocalBuild -Verify
```

The `bakery-owner-dev` project uses separate volumes and preserves old databases.
For local Java/IntelliJ, use `-InfrastructureOnly -NoBuild`; module `.env` uses
PostgreSQL on 5437, Identity on 8081, Bakery on 8082 and MinIO on 9004. Match
credentials to root Compose configuration. Both Docker and host Java execution
were verified against real PostgreSQL and MinIO on 2026-10-28.

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
