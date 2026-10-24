# Subscription Service

Runs on port `8084` with its own `subscription_db`. Copy `.env.example` to `.env`
for local execution, then set the database, Identity JWK, Bakery service token
and MinIO values. The real `.env` file is ignored by Git.

From the repository root, `docker compose -f docker-compose.subscription-service.yml up --build`
starts Subscription, PostgreSQL and MinIO. The defaults expose PostgreSQL on
`5437`, MinIO on `9004` and its console on `9005`.

For Bakery membership and existence validation, configure SUBSCRIPTION_CLIENT_SECRET
and its matching BCrypt hash in Identity. The client obtains/caches service JWTs
for the Bakery audience with `bakery:membership:read bakery:profile:read` scopes.
Unavailable credentials or dependencies fail closed with `503`.
The entitlement route requires a service JWT for the Subscription audience with
`subscription:entitlement:read` scope.

To run Bakery and Subscription together on the same Docker network, follow
[the combined Docker stack guide](../../docs/DOCKER-BAKERY-SUBSCRIPTION.md).

See [JWT runtime verification](../../docs/JWT-LOCAL-VERIFICATION.md) for all domain
services and the real HTTP verification script.
