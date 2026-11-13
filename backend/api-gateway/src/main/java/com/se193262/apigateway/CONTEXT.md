# API Gateway

## Responsibility

Single public entry point using Spring Cloud Gateway Server Web MVC. Public
`/api/v1/**` paths are routed by resource ownership. The existing /identity,
/bakery, /marketplace, /subscription, /cake-ai, /orders and /chat aliases also work;
authentication/authorization remains in the owning services.

## Current state

Unprefixed public routes preserve the original path/query/body and auth headers.
Copying a direct service API URL and changing its port to Gateway's 8080 therefore
works for the public REST resources. Subscription's `/bakeries/*/subscription` and
`/bakeries/*/subscription-orders` paths have order -10, before the general Bakery
route. Admin resource groups are dispatched to their owning service, not a shared
admin backend. Cake AI's public `/storage/**` route is also forwarded unchanged.
No catch-all `/api/**`, internal route, or direct service Swagger alias is added.

Spring Cloud Gateway Server Web MVC routes public requests to seven domain
services using `/identity`, `/bakery`, `/marketplace`, `/subscription`, `/cake-ai`,
`/orders` and `/chat` prefixes. The prefix is stripped before forwarding.
Each prefix also exposes `/v3/api-docs` for the shared Swagger UI.
Docs routes forward public host/protocol metadata and explicitly supply the root
forwarded prefix `/`. The local
Compose stack enables backend forwarded-header handling and configures Gateway
to trust loopback/Docker bridge ingress so Swagger server URLs use Gateway.
Domain service application.yml also enables framework forwarded-header handling
for IDE/local runs. OpenAPI servers use the Gateway root when loaded through it,
while direct service access keeps the service root. Both generate `/api/v1/...`
request URLs, so copied URLs can switch between Gateway and service ports in both
directions. The definition URLs stay namespaced (`/bakery/v3/api-docs`, etc.).
Gateway application.properties enables trusted proxy processing for loopback
ingress and disables automatic forwarded-prefix generation/appending. This stops
the proxy from replacing the explicit root with a service prefix inferred from
the namespaced definition URL. Docker overrides its own ingress regex.
The public host is conveyed with Forwarded/X-Forwarded headers rather than
PreserveHostHeader, which is incompatible with a restricted Host header in the
JDK HTTP client used by the Gateway tests/runtime.

Identity refresh cookies have their Path rewritten from `/api/v1/auth` to
`/identity/api/v1/auth` in Gateway responses, so refresh/logout requests include
the cookie when clients use the prefixed URLs. JWT validation remains in each
resource service; internal APIs have no public Gateway routes.
For unprefixed auth URLs the cookie Path remains `/api/v1/auth`; use the same URL
style for login, refresh and logout within a session. The compatibility route's
cookie rewrite remains limited to the prefixed Identity route.

Run `scripts/Start-GatewayStack.ps1` from the repository root to start the
`bakery-gateway` Docker project with all seven services. The launcher uses root
`.env` credentials, separate persistent volumes, and disables paid AI execution.
Run `python scripts/Test-GatewayStack.py` for HTTP smoke verification.

springdoc-openapi-starter-webmvc-ui 3.1.0 is already a dependency; Swagger UI is
/swagger-ui.html or /swagger-ui/index.html, default gateway port 8080.

Domain controllers use explicit origins from `BACKEND_CORS_ALLOWED_ORIGINS`.
`PreflightCorsConfig` owns the single edge CORS filter for OPTIONS and actual
requests, since functional proxy routes do not use controller annotations.
`gateway.cors.allowed-origins` defaults to that same local policy; deployments can
set `GATEWAY_CORS_ALLOWED_ORIGINS` explicitly. Unapproved origins are rejected.
`UpstreamFailureFilter` prevents duplicate upstream credentialed CORS headers
and maps only connection/timeout failures to 502/504 without changing business errors.

GatewayCorsTest uses a local stub only: preflight bypasses the downstream,
proxied responses have one CORS header set, Swagger UI and its seven spec URLs
load. No database or provider is needed for these checks. Individual service
specs still require their owning services to be running.

## Boundary

The gateway must not own business rules or orchestrate domain transactions.

