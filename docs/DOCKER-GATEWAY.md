# Local Gateway stack

For business flows with real Gemini/Firebase, see
[Gateway E2E report](GATEWAY-E2E-REPORT-VI.md). That runner uses scoped service
credentials in ignored `backend/target/gateway-e2e.env`; use its setup commands
when reusing that runtime. The basic launcher below uses root `.env` only.

From the repository root, with Docker Desktop, Java 21, Maven and Python 3:

```powershell
.\scripts\Start-GatewayStack.ps1
python scripts/Test-GatewayStack.py
```

The launcher packages eight applications, stages executable JARs into ignored
`target/docker-runtime` directories, builds images and waits for health checks.
Use `-SkipPackage` only when the JARs already match the current source.

Root `.env` must contain the database passwords, service-client secrets/hashes,
Identity PEM paths and existing Firebase credential path required by the base
Compose files. Values are never printed by the launcher. Existing key and
credential files are mounted read-only.

Gateway listens at `http://localhost:8080` (override `GATEWAY_PORT` in `.env`).
Swagger UI is at `http://localhost:8080/swagger-ui/index.html`.

| Prefix | Service | Direct host port |
|---|---|---|
| `/identity` | Identity | 8081 |
| `/bakery` | Bakery | 8082 by default |
| `/marketplace` | Marketplace | MARKETPLACE_SERVICE_PORT, default 8083 |
| `/subscription` | Subscription | 8084 by default |
| `/cake-ai` | Cake AI | 8085 |
| `/orders` | Order | 8086 |
| `/chat` | Chat | 8087 |

For example, list orders at `GET /orders/api/v1/orders` with a user bearer JWT.
Swagger documents use `/{prefix}/v3/api-docs`; their server URL points back
through Gateway. Identity refresh cookies are rewritten for the `/identity`
prefix, allowing login, refresh and logout through the same public entry point.

The default Compose project is `bakery-gateway`, with separate persistent
volumes. This avoids the existing `bakery-platform` database migration checksum
mismatch without repairing or deleting its schema history. Do not run both
projects on the same host ports. No demo business data is copied into the new
databases. Cake AI generation, its worker scheduler and cloud cleanup are
disabled in this launcher; the smoke check makes no AI provider calls.

The smoke check verifies health, seven OpenAPI documents and their Gateway
server URLs, anonymous/invalid JWT rejection, registration/login, authenticated
read requests to seven services, cookie refresh and logout. It removes its own
temporary customer afterward and writes sanitized evidence to
`docs/audit/evidence/gateway-smoke.json`. This is routing/authentication smoke
coverage; order placement, payment approval, chat messaging and image generation
are outside these checks.

To stop this stack while retaining its volumes:

```powershell
docker compose -p bakery-gateway -f compose.yaml -f docker-compose.bakery-subscription.yml -f docker-compose.order-service.yml -f docker-compose.chat-service.yml -f compose.services.yaml -f compose.gateway.yaml stop
```
