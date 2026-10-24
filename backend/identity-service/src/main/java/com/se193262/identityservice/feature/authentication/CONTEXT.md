# Authentication feature

## Responsibility

Registration, login, token refresh and token revocation.

## Current state

Implemented registration, login, current-user lookup, refresh-token rotation,
logout, RS256 access-token issuing/validation and public JWK discovery. Refresh
tokens are opaque and only their SHA-256 hashes are stored. Reuse of a rotated
token revokes all remaining refresh sessions for that user.

Service-token issuance is implemented. A client authenticates with its
configured BCrypt secret hash and requests scopes granted for the exact
audience; the resulting RS256 service JWT expires after five minutes.

## Boundary

This feature may persist only data owned by Identity Service. References to
other services remain plain UUID values and must be validated through internal
REST contracts.


## Internal service authentication

ServiceTokenService issues five-minute target/scoped RS256 tokens after checking a configured BCrypt client secret hash and exact audience/scope grants. See ADR-002.
