# Identity and Marketplace with Docker Compose

## Prerequisites

Docker Desktop must be running with Linux containers. The initial build downloads Maven/JRE images,
PostgreSQL 17 and Maven dependencies, so Docker Hub and Maven Central must be reachable.
Firebase setup is documented in [FIREBASE-SETUP.md](FIREBASE-SETUP.md).

## Prepare external credentials

For an existing team project, ask its administrator for access and create a local
service-account key with bucket-scoped permissions as described in
FIREBASE-SETUP.md. A teammate's `C:/Users/...` paths do not exist on your machine;
use the actual local paths. Identity itself does not use Firebase. With valid
Identity keys and root `.env` values, `docker compose up --build -d identity-service`
starts only Identity and its PostgreSQL dependency; Marketplace additionally
requires the Firebase JSON bind file before it can start.

The root `.env` is read by Compose and uses `IDENTITY_JWT_*_KEY_FILE` for host
mounts. `backend/identity-service/.env` is read as Java properties for local Java
execution and uses `IDENTITY_JWT_*_KEY_PATH`; BCrypt hashes there are unquoted.
Compose BCrypt hashes in the root `.env` must remain single-quoted.
Bakery occupies host port 8082 in the existing stack, so set
`MARKETPLACE_SERVICE_PORT=8083` and `BAKERY_SERVICE_BASE_URL=http://host.docker.internal:8082`
when running the services together. Identity's Docker host port is 8081; local
Java execution without a port override uses 8080.

Create an RSA 3072-bit key pair outside the repository, once:

```powershell
openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:3072 -out C:/Users/lemin/.secrets/bakery-platform/identity-private.pem
openssl pkey -pubout -in C:/Users/lemin/.secrets/bakery-platform/identity-private.pem -out C:/Users/lemin/.secrets/bakery-platform/identity-public.pem
```

Copy `.env.example` to `.env` at the repository root. Supply distinct local DB passwords, the key paths,
Firebase details and a random Marketplace client secret. Set its BCrypt hash in
`MARKETPLACE_CLIENT_SECRET_HASH`, surrounded by single quotes so Compose preserves dollar signs.
Generate the hash with the project's Spring Security BCryptPasswordEncoder (for example in IDE Scratch),
not an online hashing service:

```java
new org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder(12).encode("your-random-service-secret")
```

The secret is used only by Marketplace; Identity receives its hash. Set a separate
`ORDER_SERVICE_CLIENT_SECRET` and BCrypt hash in `ORDER_CLIENT_SECRET_HASH` for Order's scoped internal
service tokens. Paths in `.env` are absolute host paths with forward slashes.
Missing bind files fail startup instead of being silently created as directories.

For Chat integration, set a distinct `CHAT_SERVICE_CLIENT_SECRET` and its BCrypt hash in
`CHAT_SERVICE_CLIENT_SECRET_HASH`. Chat sends the secret only to Identity's service-token endpoint;
Identity stores/configures only the hash and grants Chat narrowly scoped Marketplace and Bakery tokens.
Generate the hash locally with the same Spring Security BCryptPasswordEncoder example above.

## Validate, test and start

From `backend/` run `mvn test` with Docker available. From the repository root:

```powershell
docker compose config --quiet
docker compose up --build -d
docker compose ps
docker compose logs --tail 100 identity-service marketplace-service
```

- Identity: `http://localhost:8081`; public JWK: `/.well-known/jwks.json`.
- Marketplace: `http://localhost:8082`; API prefix `/api/v1`.
- Health: `/actuator/health`; readiness: `/actuator/health/readiness`.
- Both PostgreSQL ports stay private; use `docker compose exec <db-service> psql ...` if needed.

Identity and Marketplace listen on port 8080 internally. Marketplace uses Compose DNS for Identity,
not host localhost. The signed issuer stays `bakery-platform-identity` regardless of hostname.
The local HTTP Compose environment disables Secure on the refresh cookie; shared/production settings
must retain HTTPS and the default secure cookie.

The Maven build creates a plain jar plus an executable `*-exec.jar`; Docker copies only the executable
jar to the non-root runtime image. Private keys, JSON credentials, `.env` and target directories are
excluded from the build context. Firebase files are runtime mounts, never image layers.

## Dependencies outside this Compose stack

Bakery, Subscription, Cake AI and Order URLs default to `host.docker.internal:8083..8086`.
Start these services separately and configure their own databases and service credentials to exercise
those workflows. Their DB-owned internal APIs are implemented; full public CRUD is outside this task.
Missing dependencies do not prevent Marketplace startup but operations requiring them return 503.
An OPEN_CUSTOM draft can be created without those dependencies.

To run Chat with Identity, Marketplace and Bakery on one Compose network, start the root,
Bakery/Subscription and Chat Compose files together:

```powershell
docker compose -f compose.yaml -f docker-compose.bakery-subscription.yml -f docker-compose.chat-service.yml up --build -d
```

Set `MARKETPLACE_SERVICE_PORT=8083`, `BAKERY_SERVICE_BASE_URL=http://bakery-service:8082`,
`IDENTITY_JWKS_URI=http://identity-service:8080/.well-known/jwks.json` and
`IDENTITY_SERVICE_URL=http://identity-service:8080` in `.env` to avoid the host-port collision
and connect services over Compose DNS. Chat obtains scoped service JWTs from `identity-service`;
no pre-generated bearer tokens are needed. This stack still requires Marketplace Firebase
settings and the RSA key files described above.

Test fixture SQL in `database/dev/` must only be applied to disposable development/test databases.
The `integration-tests` module creates six service contexts with real HTTP, real JWT/JWK, six isolated
PostgreSQL databases and these fixtures; Firebase upload tests use a stub. It does not seed your Compose DBs.

## Stop and persistence

```powershell
docker compose down
```

Named volumes retain data. Starting the stack again reuses the same DBs and externally mounted keys.
Deleting volumes is a separate destructive action and is not part of normal shutdown. Changing a database
password in `.env` does not change the password of an already-initialized PostgreSQL volume.

## Verification boundaries

`docker compose config` only validates configuration. Container builds/health require reachable image
registries. Firebase smoke testing requires your real bucket and credentials. Consult PROJECT-STATUS.md
for the checks actually completed in the current implementation session.


## Session verification (2026-10-17)

Both application Dockerfiles were built successfully. A separate smoke Compose project ran on
18081/18082 with official PostgreSQL images and disposable RSA/service credentials. Both app UIDs
were 10001. Health, authentication, request ownership, service scopes and fail-closed dependency/storage
errors passed. No real Firebase account/bucket was used. Recreating the stack preserved volumes and
returned to healthy; the follow-up HTTP persistence/JWT check was not executed because permission
was declined. This is not recorded as a successful persistence check.
