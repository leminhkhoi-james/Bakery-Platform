# Member feature

## Responsibility

Bakery membership and bakery-scoped authorization.

## Current state

BakeryMember has list/create/patch/delete endpoints under a bakery. The last
active OWNER cannot be removed or demoted; assigning OWNER through these
endpoints is blocked. Identity-owned users remain UUID references. Identity
lookup is wired through its internal API when creating a member. OWNER/MANAGER
write restrictions are enforced in the service. `displayNameSnapshot` is captured
from Identity on owner/member creation and persisted through Flyway V2. It is
read-only in request bodies and survives later profile edits. A legacy null name
is enriched on authorized list reads; a missing/unavailable Identity user leaves
that field null without hiding the membership. JWT authentication and ACTIVE bakery
membership checks apply in every profile. The internal authorization endpoint
supports role hierarchy and negative authorization responses.

## Boundary

This feature may persist only data owned by Bakery Service. References to
other services remain plain UUID values and must be validated through internal
REST contracts.

