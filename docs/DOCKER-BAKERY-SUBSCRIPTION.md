# Bakery and Subscription Docker stack

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
