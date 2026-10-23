# Identity and Marketplace with Docker Compose

## Prerequisites

Docker Desktop must be running with Linux containers. The initial build downloads Maven/JRE images,
PostgreSQL 17 and Maven dependencies, so Docker Hub and Maven Central must be reachable.
Firebase setup is documented in [FIREBASE-SETUP.md](FIREBASE-SETUP.md).

## Prepare external credentials

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

The secret is used only by Marketplace; Identity receives its hash. Order has a separate optional hash
for its later external deployment. Paths in `.env` are absolute host paths with forward slashes.
Missing bind files fail startup instead of being silently created as directories.

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
