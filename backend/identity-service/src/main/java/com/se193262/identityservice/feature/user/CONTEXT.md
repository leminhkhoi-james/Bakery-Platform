# User feature

## Responsibility

User profiles, platform roles and administrative user management.

## Current state

User, customer profile and platform-role persistence needed by authentication
is implemented. Registration creates an active customer with the `CUSTOMER`
role and default `vi` profile. Internal user/address snapshot APIs have also been implemented using service-scoped JWTs. Profile editing, public address management and admin
user-management endpoints remain pending.

## Boundary

The scoped internal user lookup includes `email`, `status` and platform `roles`
from Identity's own database. The lookup exposes only the three supported platform roles in the initial role seed.

This feature may persist only data owned by Identity Service. References to
other services remain plain UUID values and must be validated through internal
REST contracts.


## Authorization update — 2026-10-28

Platform roles are ADMIN, CUSTOMER and BAKERY_OWNER. Bakery membership only
supports OWNER. Bakery access requires ownership of the requested bakery;
only the owner can manage the bakery. See ADR-004.
