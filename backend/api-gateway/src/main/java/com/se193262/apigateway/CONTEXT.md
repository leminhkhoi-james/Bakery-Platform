# API Gateway

## Responsibility

Single public entry point for the frontend. It will route public API requests,
enforce edge concerns and propagate correlation data to backend services.

## Current state

Spring Cloud Gateway Server Web MVC routes public requests to seven domain
services using `/identity`, `/bakery`, `/marketplace`, `/subscription`, `/cake-ai`,
`/orders` and `/chat` prefixes. The prefix is stripped before forwarding.
Each prefix also exposes `/v3/api-docs` for the shared Swagger UI.
Docs routes preserve the public host and supply a forwarded prefix. The local
Compose stack enables backend forwarded-header handling and configures Gateway
to trust loopback/Docker bridge ingress so Swagger server URLs use Gateway.

Identity refresh cookies have their Path rewritten from `/api/v1/auth` to
`/identity/api/v1/auth` in Gateway responses, so refresh/logout requests include
the cookie when clients use the prefixed URLs. JWT validation remains in each
resource service; internal APIs have no public Gateway routes.

Run `scripts/Start-GatewayStack.ps1` from the repository root to start the
`bakery-gateway` Docker project with all seven services. The launcher uses root
`.env` credentials, separate persistent volumes, and disables paid AI execution.
Run `python scripts/Test-GatewayStack.py` for HTTP smoke verification.

## Boundary

The gateway must not own business rules or orchestrate domain transactions.

