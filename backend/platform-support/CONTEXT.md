# Platform support

Shared technical DTOs, exceptions, service HTTP clients and resource-server configuration.
No business entities, repositories or transactions are shared between services.

Service controllers declare `@CrossOrigin(originPatterns = "*", allowCredentials = "true")`.
`ResourceSecurityConfiguration` enables `.cors(Customizer.withDefaults())` so
Spring Security reads MVC controller annotations before authenticating requests.
There is no separate global CORS filter or origin environment variable.
Actual requests retain JWT/role checks. See docs/CORS-DEV.md for details.
