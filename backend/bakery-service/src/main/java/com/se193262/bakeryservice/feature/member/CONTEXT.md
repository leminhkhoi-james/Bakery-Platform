# Member feature

## Responsibility

Bakery membership and bakery-scoped authorization.

## Current state

BakeryMember has list/create/patch/delete endpoints under a bakery. The last
active OWNER cannot be removed or demoted; assigning OWNER through these
endpoints is blocked. Identity-owned users remain UUID references. Identity
lookup is wired through its internal API when creating a member. OWNER/MANAGER
write restrictions are enforced in the service. Display snapshots are still
pending, and Identity's internal user endpoint plus service JWT issuance are
needed to create a member at runtime. JWT authentication and ACTIVE bakery
membership checks apply in every profile. The internal authorization endpoint
supports role hierarchy and negative authorization responses.

## Boundary

This feature may persist only data owned by Bakery Service. References to
other services remain plain UUID values and must be validated through internal
REST contracts.

