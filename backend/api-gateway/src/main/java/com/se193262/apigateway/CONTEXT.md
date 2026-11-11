# API Gateway

## Responsibility

Single public entry point using Spring Cloud Gateway Server Web MVC. Routes keep
the existing /identity, /bakery, /marketplace, /subscription, /cake-ai, /orders
and /chat prefixes; authentication/authorization remains in the owning services.

## Current state

Spring Cloud Gateway Server Web MVC routes public requests to seven domain
services using `/identity`, `/bakery`, `/marketplace`, `/subscription`, `/cake-ai`,
`/orders` and `/chat` prefixes. The prefix is stripped before forwarding.
Each prefix also exposes `/v3/api-docs` for the shared Swagger UI.
Docs routes forward public host/protocol metadata and supply a forwarded prefix. The local
Compose stack enables backend forwarded-header handling and configures Gateway
to trust loopback/Docker bridge ingress so Swagger server URLs use Gateway.
Domain service application.yml also enables framework forwarded-header handling
for IDE/local runs. OpenAPI servers therefore include the service prefix when
loaded through Gateway, while direct service access keeps the direct base URL.
Gateway application.properties enables trusted proxy processing for loopback
ingress and disables prefix appending, so doc routes forward exactly one service
prefix during local Java runs as well. Docker overrides its own ingress regex.
The public host is conveyed with Forwarded/X-Forwarded headers rather than
PreserveHostHeader, which is incompatible with a restricted Host header in the
JDK HTTP client used by the Gateway tests/runtime.

Identity refresh cookies have their Path rewritten from `/api/v1/auth` to
`/identity/api/v1/auth` in Gateway responses, so refresh/logout requests include
the cookie when clients use the prefixed URLs. JWT validation remains in each
resource service; internal APIs have no public Gateway routes.

Run `scripts/Start-GatewayStack.ps1` from the repository root to start the
`bakery-gateway` Docker project with all seven services. The launcher uses root
`.env` credentials, separate persistent volumes, and disables paid AI execution.
Run `python scripts/Test-GatewayStack.py` for HTTP smoke verification.

springdoc-openapi-starter-webmvc-ui 3.1.0 is already a dependency; Swagger UI is
/swagger-ui.html or /swagger-ui/index.html, default gateway port 8080.

Domain controllers own CORS via `@CrossOrigin(originPatterns = "*", allowCredentials = "true")`.
`PreflightCorsConfig` answers only CORS OPTIONS requests because functional proxy
routes do not use controller annotations. Actual requests forward downstream CORS
headers unchanged; no header-removal filters are needed.

GatewayCorsTest uses a local stub only: preflight bypasses the downstream,
proxied responses have one CORS header set, Swagger UI and its seven spec URLs
load. No database or provider is needed for these checks. Individual service
specs still require their owning services to be running.

## Boundary

The gateway must not own business rules or orchestrate domain transactions.

