# Platform support

Shared technical DTOs, exceptions, service HTTP clients and resource-server configuration.
No business entities, repositories or transactions are shared between services.

Service controllers declare credentialed `@CrossOrigin` with explicit origins from
`BACKEND_CORS_ALLOWED_ORIGINS` (default `http://localhost:5173`). Comma-separated
approved origins may be configured; unconfigured origins are rejected.
`ResourceSecurityConfiguration` enables `.cors(Customizer.withDefaults())` so
Spring Security reads MVC controller annotations before authenticating requests.
Actual requests retain JWT/role checks. See docs/CORS-DEV.md for details.
