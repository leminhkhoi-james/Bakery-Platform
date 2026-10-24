# ADR-001: JWT signing and internal authentication

- Status: Accepted
- Date: 2026-10-13

## Context

Bakery Platform needs stateless user authentication across independent services
without distributing signing credentials. Internal REST endpoints also need a
separate service identity and scoped authorization model. Refresh sessions must
remain revocable even though access tokens are stateless.

## Decision

- Identity Service signs JWTs with RS256. Its private PKCS#8 key and X.509 public
  key are mounted outside Git; the service publishes only the public key at
  `/.well-known/jwks.json`.
- The current key has a stable `kid`. Resource services use the JWK endpoint and
  must validate the signature, issuer, expiry, token type and expected audience.
- User access tokens last 15 minutes and contain `sub`, `email`, `roles`,
  `token_type=user`, `iss`, `aud`, `iat`, `exp` and `jti`. Platform roles map to
  Spring authorities with the `ROLE_` prefix.
- Service tokens use `token_type=service`, a target-service audience and a
  space-delimited OAuth2 `scope` claim mapped to `SCOPE_` authorities. User and
  service tokens cannot substitute for one another.
- Identity issues five-minute service tokens through the credential-authenticated
  internal token endpoint. Clients are provisioned with BCrypt secret hashes and
  exact audience/scope grants; internal routes enforce token type, audience and
  scope. HTTP clients cache tokens with expiry skew and do not retry POST calls.
- Refresh tokens are opaque 256-bit random values with a seven-day lifetime.
  Only SHA-256 hashes are stored. Every refresh rotates the token under a row
  lock; reuse of a revoked token revokes all active refresh sessions for that
  user.

## Consequences

- Resource services never possess the private signing key.
- Access tokens cannot be individually revoked and may remain usable for at
  most 15 minutes after a role/status change. Login and refresh always reload
  current account state.
- Key rotation can be added by publishing multiple public JWKs during a grace
  period. The MVP publishes one active key.
- Production startup fails fast when the external key pair is missing or does
  not match.
