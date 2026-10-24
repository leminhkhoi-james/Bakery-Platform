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
from Identity's own database. Bakery uses these roles to validate staff eligibility;
omitting roles would reject legitimate active staff even when service JWT is valid.

This feature may persist only data owned by Identity Service. References to
other services remain plain UUID values and must be validated through internal
REST contracts.

