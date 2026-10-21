# Bakery Service runtime

Local default port: `8082` (`SERVER_PORT` overrides it). Subscription Service
defaults to `8084`. Copy `.env.example` to `.env` in this directory and set the
database, Identity JWK and MinIO values before running the application from
`backend/bakery-service`.

For the isolated Docker stack, run from the repository root:

```powershell
docker compose -f docker-compose.bakery-service.yml up --build
```

The stack exposes Bakery on `localhost:8082`, PostgreSQL on `localhost:5436`,
and MinIO API/console on `localhost:9002`/`localhost:9003`. The application
uses Docker service names internally, while signed image URLs use
`BAKERY_MINIO_PUBLIC_ENDPOINT` so a browser can reach them.

Internal Bakery endpoints require a service JWT with audience
`bakery-service`, the endpoint's scope and `X-Correlation-Id`. Bakery's outbound
Identity and Subscription calls require separate service JWTs in
`BAKERY_IDENTITY_SERVICE_TOKEN` and `SUBSCRIPTION_SERVICE_TOKEN`. Identity's
internal user lookup and Subscription's entitlement endpoint still need to be
implemented; creating a member, publishing a product, public catalog lookup
and quotes fail closed until those integrations are available.
