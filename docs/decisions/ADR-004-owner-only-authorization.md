# ADR-004: Owner-only bakery authorization

- Status: Accepted by user request
- Date: 2026-10-28

## Decision

Platform roles are ADMIN, CUSTOMER and BAKERY_OWNER. A user may retain multiple
platform roles. Bakery membership has only OWNER and remains scoped to bakery ID.
Creating a bakery requires BAKERY_OWNER and creates its OWNER membership from JWT sub.
Bakery management requires BAKERY_OWNER plus ACTIVE OWNER membership of that bakery.
Admin routes retain their explicit administration policy.

Member listing and internal membership authorization remain available. Public
member creation/update/deletion are removed; adding co-owners or transferring
ownership is outside the current contract. Order, Marketplace, Chat and Subscription
require OWNER membership for bakery access, with existing explicit admin exceptions.

## Existing data and rollout

Apply Identity V3, Bakery V2 and Chat V2 when deploying the services together.
Former platform staff assignments and bakery staff/manager memberships are archived
in local audit tables before removal. Former staff gain CUSTOMER, never BAKERY_OWNER.
Existing OWNER memberships and their status remain unchanged. Old staff-only JWTs
cannot authorize bakery management even before they expire.

Historical Chat BAKERY_STAFF participant types remain readable to preserve sender
attribution, but are marked left and cannot authorize access or new participation.
No existing migration is edited. No live database is modified by editing these files.
