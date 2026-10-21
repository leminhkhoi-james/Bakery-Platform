# Member feature

## Responsibility

Bakery membership and bakery-scoped authorization.

## Current state

BakeryMember has list/create/patch/delete endpoints under a bakery. The last
active OWNER cannot be removed or demoted; assigning OWNER through these
endpoints is blocked. Identity-owned users remain UUID references. Identity
validation and display snapshots are pending. JWT authentication and ACTIVE
bakery membership checks apply to these endpoints, which remain available only
outside the `prod` profile.

## Boundary

This feature may persist only data owned by Bakery Service. References to
other services remain plain UUID values and must be validated through internal
REST contracts.

