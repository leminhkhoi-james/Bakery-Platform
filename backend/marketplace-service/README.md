# Marketplace Service

Owns cake requests, preference/option snapshots, request image metadata, offers and durable offer acceptance.
Public API: `/api/v1/cake-requests`, `/api/v1/offers`. Internal context/order-source APIs require scoped service JWTs.

See [Docker](../../docs/DOCKER.md), [Firebase setup](../../docs/FIREBASE-SETUP.md),
[API spec](../../docs/API_SPEC.md) and [ADR-002](../../docs/decisions/ADR-002-marketplace-workflows-and-storage.md).

Outside Docker configure MARKETPLACE_DB_URL/USERNAME/PASSWORD, IDENTITY_JWK_SET_URI,
IDENTITY_SERVICE_BASE_URL, SERVICE_CLIENT_ID/SECRET, remote service URLs and Firebase ADC variables.
Default local JVM port is 8083; Identity is 8081 and Bakery is 8082.
All local services read `backend/.env`; use `backend` as the IDE working
directory and `backend/.env.example` as the shared template. Marketplace uses
MARKETPLACE_CLIENT_ID/MARKETPLACE_CLIENT_SECRET; Identity uses the matching
MARKETPLACE_CLIENT_SECRET_HASH from the same file. For Firebase,
GOOGLE_APPLICATION_CREDENTIALS must also be set in the IDE/OS environment because
Google ADC does not read Spring properties. A missing JSON key leaves image operations
unavailable; startup and non-storage APIs do not require a Firebase connection.
Run `mvn -pl marketplace-service -am test` from backend. Integration tests require Docker.
The executable build is `target/marketplace-service-0.0.1-SNAPSHOT-exec.jar`.
