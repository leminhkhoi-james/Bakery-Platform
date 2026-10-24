# Local JWT integration verification

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

The script's Firebase-free payment check submits a bank reference, not an image.
It does not verify Firebase upload or external AI generation.
