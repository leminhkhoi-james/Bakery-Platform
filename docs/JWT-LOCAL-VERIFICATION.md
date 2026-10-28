# Local JWT integration verification

For the owner-only Bakery/Subscription environment, run
`./scripts/Start-BakerySubscription.ps1 -LocalBuild -Verify`. It creates a separate
`bakery-owner-dev` Compose project without resetting older databases. To repeat
only HTTP checks against that running project:

```powershell
./scripts/Test-LocalJwt.ps1 -BakerySubscriptionOnly -WithStorage -ComposeProject bakery-owner-dev
```

`-ComposeProject` selects the databases used for test role provisioning and
cleanup; its default remains `bakery-platform` for the manual stack below.
Both container execution and host Java with module `.env` files passed on
2026-10-28, including owner-only permissions and retired member mutation routes.
See [the Docker guide](DOCKER-BAKERY-SUBSCRIPTION.md) for startup and IDE use.

Identity signs with the PEM pair configured by `IDENTITY_JWT_PRIVATE_KEY_FILE`
and `IDENTITY_JWT_PUBLIC_KEY_FILE` in root `.env`. They are mounted read-only;
PEM files are excluded from Git and both Docker build contexts.

Configure distinct local secrets for Bakery, Subscription, Order and Chat. Their
corresponding BCrypt hashes belong in Identity's environment. Bakery/Subscription
request and cache scoped five-minute JWTs automatically; they do not receive the
private signing key. Old explicit bearer-token variables remain optional overrides.

| Client | Target audience | Allowed scopes |
|---|---|---|
| bakery-service | identity-service | identity:user:read |
| bakery-service | subscription-service | subscription:entitlement:read |
| subscription-service | bakery-service | bakery:profile:read bakery:membership:read |

From the repository root, start the seven domain services with:

```powershell
docker compose -f compose.yaml -f docker-compose.bakery-subscription.yml -f docker-compose.order-service.yml -f docker-compose.chat-service.yml -f compose.services.yaml up -d --build
```

If the team's Firebase JSON is unavailable, append `-f compose.no-firebase.yaml`
before `up`. This explicitly removes Marketplace's Firebase bind mount; image
operations remain unavailable. Authentication, PostgreSQL and other routes stay
enabled. This mode does not change authorization or make storage public.

| Service | Host port |
|---|---:|
| Identity | 8081 |
| Bakery | 8082 |
| Marketplace | 8083 |
| Subscription | 8084 |
| Cake AI | 8085 |
| Order | 8086 |
| Chat | 8087 |

All service calls use container DNS; host ports are for local clients. The API
Gateway is still a scaffold and is not included in this runtime stack. Cake AI's
internal validation routes can run; actual AI generation is not implemented.

For fresh local Identity/Marketplace databases, `IDENTITY_DB_IMAGE` and
`MARKETPLACE_DB_IMAGE` can select an available PostgreSQL image. Do not switch
major versions on an existing initialized volume.

```powershell
./scripts/Test-LocalJwt.ps1
```

The script checks JWK against the configured public PEM, creates unique test users,
assigns test-only roles in the local Identity database, logs in, and verifies
Bakery member lookup, Subscription purchase/payment approval, active entitlement,
Marketplace/Order/Chat user authentication and Cake AI service authentication.
It rejects tampered tokens, wrong audiences and unauthorized users. By default it
deletes only the users and bakery it created, including their subscription data;
`-KeepTestData` retains those test records. Tokens and secrets are never printed.
Run against the local development stack only.

By default the script submits a bank reference. For a focused Bakery/Subscription
run including real MinIO uploads, start only these services (the other Compose
files below supply the same network/port wiring):

```powershell
docker compose -f compose.yaml -f docker-compose.bakery-subscription.yml -f docker-compose.order-service.yml -f docker-compose.chat-service.yml -f compose.services.yaml -f compose.no-firebase.yaml up -d --build identity-service bakery-service subscription-service
./scripts/Test-LocalJwt.ps1 -BakerySubscriptionOnly -WithStorage
```

This uses eight containers and does not build Cake AI. It checks owner/member
display-name snapshots, private proof upload/signed downloads, owner/admin access
and customer denial, bakery logo replacement/cover/add-on media, product multipart
images/primary/display order/deletion, publish and sorting. Invalid MIME, size,
sort fields and unauthorized uploads are rejected. Test media is deleted through
authenticated S3 requests before test database records are removed. Never point
this role-provisioning script at a shared/production database.

The focused run passed on 2026-10-25. Firebase upload and external AI generation
remain outside this script. Bakery aggregate ratings await an Order summary API;
see PROJECT-STATUS.md for the contract information needed from that team.
