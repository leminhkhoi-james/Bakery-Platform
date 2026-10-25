# Bakery Service runtime

Local default port: `8082` (`SERVER_PORT` overrides it). Subscription Service
defaults to `8084`. Copy `.env.example` to `.env` in this directory and set the
database, Identity JWK and MinIO values before running the application from
`backend/bakery-service`.

For the isolated Docker stack, run from the repository root:

```powershell
docker compose -f docker-compose.bakery-service.yml up --build
```

The stack exposes Bakery on `localhost:8082`, PostgreSQL on `localhost:5436`,
and MinIO API/console on `localhost:9002`/`localhost:9003`. The application
uses Docker service names internally, while signed image URLs use
`BAKERY_MINIO_PUBLIC_ENDPOINT` so a browser can reach them.

Internal Bakery endpoints require a service JWT with audience
`bakery-service`, the endpoint's scope and `X-Correlation-Id`. Bakery's outbound
Identity and Subscription calls acquire scoped service JWTs automatically using
`BAKERY_CLIENT_SECRET` and Identity's matching BCrypt hash. Explicit
`BAKERY_IDENTITY_SERVICE_TOKEN` and `SUBSCRIPTION_SERVICE_TOKEN` remain optional
bearer overrides. Dependent operations fail closed when token issuance or remote
validation is unavailable.

To run Bakery and Subscription together, follow
[the combined Docker stack guide](../../docs/DOCKER-BAKERY-SUBSCRIPTION.md).

See [JWT runtime verification](../../docs/JWT-LOCAL-VERIFICATION.md) for all domain
services and the real HTTP verification script.

From `backend/`, run the service tests with Docker available:

```powershell
mvn -pl bakery-service -am verify
```

Persistence/context tests use temporary PostgreSQL Testcontainers and a test
profile; they do not read local `.env` or use the development database. Without
Docker those tests are skipped. To use another installed PostgreSQL image, pass
`"-Dtest.postgres.image=postgres:16-alpine"` (default: `postgres:17-alpine`).

Public/admin bakery lists sort by `name`, `createdAt`, or `id`; product lists also
allow `basePrice`. Invalid sort input returns 400. Member responses include a
read-only `displayNameSnapshot` from Identity, persisted by Flyway V2.

For the real JWT + MinIO checks, start Identity/Bakery/Subscription with the
combined Compose wiring, then run from the repository root:

```powershell
./scripts/Test-LocalJwt.ps1 -BakerySubscriptionOnly -WithStorage
```

The script tests media replacement/deletion, signed downloads, proof privacy,
membership snapshots and sorting. It removes only its own test users, bakery,
subscriptions and uploaded objects unless `-KeepTestData` is supplied.
