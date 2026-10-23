# Marketplace Service

Owns cake requests, preference/option snapshots, request image metadata, offers and durable offer acceptance.
Public API: `/api/v1/cake-requests`, `/api/v1/offers`. Internal context/order-source APIs require scoped service JWTs.

See [Docker](../../docs/DOCKER.md), [Firebase setup](../../docs/FIREBASE-SETUP.md),
[API spec](../../docs/API_SPEC.md) and [ADR-002](../../docs/decisions/ADR-002-marketplace-workflows-and-storage.md).

Outside Docker configure MARKETPLACE_DB_URL/USERNAME/PASSWORD, IDENTITY_JWK_SET_URI,
IDENTITY_SERVICE_BASE_URL, SERVICE_CLIENT_ID/SECRET, remote service URLs and Firebase ADC variables.
Default JVM port is 8080; choose SERVER_PORT=8082 when running locally next to Identity.
Run `mvn -pl marketplace-service -am test` from backend. Integration tests require Docker.
The executable build is `target/marketplace-service-0.0.1-SNAPSHOT-exec.jar`.
