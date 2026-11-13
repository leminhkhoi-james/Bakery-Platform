# Platform support

Shared technical DTOs, exceptions, service HTTP clients and resource-server configuration.
No business entities, repositories or transactions are shared between services.

`persistence/UuidEntity` is a technical mapped superclass for generated UUID IDs.
Normal new entities keep a null ID until persist. DataInit can request a stable ID
with `setId`; the before-insert generator supplies it without changing generated-ID
transient/detached detection. Ordinary creation still generates a random UUID.
There are no shared domain fields or cross-service associations. Hibernate is a
provided compile dependency; each JPA service supplies its own runtime dependency.

Service controllers declare credentialed `@CrossOrigin` with explicit origins from
`BACKEND_CORS_ALLOWED_ORIGINS` (default `http://localhost:5173`). Comma-separated
approved origins may be configured; unconfigured origins are rejected.
`ResourceSecurityConfiguration` enables `.cors(Customizer.withDefaults())` so
Spring Security reads MVC controller annotations before authenticating requests.
Actual requests retain JWT/role checks. See docs/CORS-DEV.md for details.
