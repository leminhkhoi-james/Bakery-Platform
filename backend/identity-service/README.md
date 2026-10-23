# Identity Service local configuration

Identity Service requires PostgreSQL and an RSA key pair. Never commit the
private key.

Generate a development key pair outside the repository:

```powershell
openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:3072 -out identity-private.pem
openssl pkey -pubout -in identity-private.pem -out identity-public.pem
```

Set these environment variables before starting the service:

```text
IDENTITY_DB_URL=jdbc:postgresql://localhost:5432/identity_db
IDENTITY_DB_USERNAME=<database-user>
IDENTITY_DB_PASSWORD=<database-password>
IDENTITY_JWT_PRIVATE_KEY_PATH=<absolute-path-to-identity-private.pem>
IDENTITY_JWT_PUBLIC_KEY_PATH=<absolute-path-to-identity-public.pem>
```

Optional settings include `IDENTITY_JWT_KEY_ID`, issuer/audience variables,
token TTLs, `IDENTITY_CORS_ALLOWED_ORIGINS` and
`IDENTITY_REFRESH_COOKIE_SECURE`. Keep the cookie secure in shared environments;
set the last variable to `false` only for local HTTP development.

Runtime Flyway migrations under `src/main/resources/db/migration` mirror the
canonical files in `database/postgresql/identity-service`. A test fails when
the copies drift.

Docker instructions: [docs/DOCKER.md](../../docs/DOCKER.md). Executable builds use the `-exec.jar` suffix.
Internal service-token issuance, user snapshot and address snapshot are implemented.
