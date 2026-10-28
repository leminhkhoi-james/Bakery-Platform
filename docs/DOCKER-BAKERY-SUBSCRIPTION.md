# Bakery and Subscription Docker stack

## Owner-only development setup (verified 2026-10-28)

Use PowerShell 7, Java 21, Maven and Docker Desktop's Linux engine. Root `.env`
must contain the Identity PEM paths and matching service client secrets/hashes.
From the repository root:

```powershell
# Package locally using cached Maven dependencies, build runtime images, verify HTTP/DB/storage
./scripts/Start-BakerySubscription.ps1 -LocalBuild -Verify
# Later starts reuse the images and persistent databases
./scripts/Start-BakerySubscription.ps1 -NoBuild
# Stop this stack while retaining databases and media
./scripts/Start-BakerySubscription.ps1 -Stop
```

This starts Identity, Bakery, Subscription, three PostgreSQL containers and two
MinIO containers under project `bakery-owner-dev`. Its volumes are separate from
the previous `bakery-platform` project and local PostgreSQL on port 5432. No old
database is reset and no Flyway checksum is repaired. Initial schemas changed in
ADR-004, so the previous development databases cannot be reused unchanged.

`-LocalBuild` uses the host's offline Maven cache and copies only executable jars
into runtime build contexts. This works when Docker cannot resolve Maven Central;
dependencies and the base images must already be available. Omit `-LocalBuild`
to use the normal source Dockerfiles with network access. Do not combine it with
`-NoBuild`.

For IntelliJ/local Java, use the same databases and Identity:

```powershell
./scripts/Start-BakerySubscription.ps1 -InfrastructureOnly -NoBuild
# Optional: launch packaged host Java apps, verify their real .env files, then stop those Java apps
./scripts/Test-LocalServiceEnv.ps1
```

Copy each module's `.env.example` to `.env` only if it does not exist. Match DB,
MinIO and client credentials to root Compose configuration. Module defaults use
Bakery DB `localhost:5436`, Subscription DB `localhost:5437`, Identity
`localhost:8081`, Bakery MinIO `localhost:9002` and Subscription MinIO
`localhost:9004`. Run each Java application with its module as the working
directory. Infrastructure mode stops the two application containers to free
8082/8084; it leaves Identity, databases and storage running.

The commands below describe the separate, manually managed default project.
Do not start both projects together on the same host ports. For the owner-only
setup above, always use its script or pass `-p bakery-owner-dev` to diagnostics.

## Manually managed stack

Run commands from the repository root with Docker Desktop's Linux engine running.
The two applications share a Compose network and use container DNS for internal
calls. Each has a separate PostgreSQL container, MinIO container and persistent
volumes. Flyway applies migrations automatically at application startup.

MinIO is built from the official source release
`RELEASE.2024-11-07T00-52-20Z` using `docker/minio/Dockerfile`, because the
previous Docker Hub/Quay image is no longer accessible. The first build needs
network access to GitHub, Go modules and the base image registries.

```powershell
Copy-Item docker.env.example .env.docker
docker compose --env-file .env.docker -f docker-compose.bakery-subscription.yml up -d --build
docker compose --env-file .env.docker -f docker-compose.bakery-subscription.yml ps
```

Edit `.env.docker` before starting if credentials or Identity URLs differ.
Existing module `.env` files are for local Java execution; Compose uses
`.env.docker`. The example credentials are local development defaults.
The root `compose.yaml` exposes Identity on host port 8081. The default
`IDENTITY_JWKS_URI` and `IDENTITY_SERVICE_URL` reach it through
`host.docker.internal:8081`. If running Identity locally on port 8080 instead,
override both URLs in `.env.docker` to use that port.

| Component | Host port | Container address |
|---|---:|---|
| Bakery | 8082 | `http://bakery-service:8082` |
| Subscription | 8084 | `http://subscription-service:8084` |
| Bakery PostgreSQL | 5436 | `bakery-db:5432` |
| Subscription PostgreSQL | 5437 | `subscription-db:5432` |
| Bakery MinIO API / console | 9002 / 9003 | `bakery-storage:9000` |
| Subscription MinIO API / console | 9004 / 9005 | `subscription-storage:9000` |

Swagger UI: `http://localhost:8082/swagger-ui/index.html` and
`http://localhost:8084/swagger-ui/index.html`.

Internal calls still require service JWTs; Docker networking does not grant
authorization. Set BAKERY_CLIENT_SECRET and SUBSCRIPTION_CLIENT_SECRET, with
matching BCrypt hashes in Identity. Tokens are acquired/cached automatically.
For deployments using explicit bearer overrides, these variables remain available:

| Variable | Audience | Scopes |
|---|---|---|
| `BAKERY_IDENTITY_SERVICE_TOKEN` | Identity service audience | `identity:user:read` |
| `SUBSCRIPTION_SERVICE_TOKEN` | `subscription-service` | `subscription:entitlement:read` |
| `SUBSCRIPTION_BAKERY_SERVICE_TOKEN` | `bakery-service` | `bakery:membership:read bakery:profile:read` |

Without valid client credentials or bearer overrides, dependent operations return
503. Identity's internal user lookup and service token issuance are implemented.
See [JWT runtime verification](JWT-LOCAL-VERIFICATION.md) for full-domain startup.

```powershell
# Inspect application logs
docker compose --env-file .env.docker -f docker-compose.bakery-subscription.yml logs -f bakery-service subscription-service
# Stop containers; database and media volumes are retained
docker compose --env-file .env.docker -f docker-compose.bakery-subscription.yml down
```

Do not run the isolated service stacks concurrently on the same host ports.
This stack retains the existing Compose project naming so existing default
project volumes can be reused. It does not import databases from local PostgreSQL.
