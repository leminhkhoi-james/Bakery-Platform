# Member feature

## Responsibility

Bakery-scoped ownership authorization and owner membership listing.

## Current state

Only OWNER membership is supported. Creation of a bakery creates its owner from
JWT sub; member POST/PATCH/DELETE endpoints and service mutations have been removed.
Management requires platform BAKERY_OWNER and ACTIVE OWNER membership of the exact
bakery. Internal authorization accepts only OWNER (or no requiredRole).
V2 archives and removes retired staff/manager memberships without promoting users.
See docs/decisions/ADR-004-owner-only-authorization.md.

## Boundary

Membership data belongs to Bakery; user_id remains an external UUID reference.
Retired membership audit records never authorize access.
