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

## Initial schema

The user confirmed that no real data exists. Initial Identity role seeds and
Bakery/Chat check constraints define only the supported roles directly. There
are no legacy-role migrations, archive tables or historical participant types.
Existing development databases must be recreated before using the revised initial
schema. Do not repair checksums or reset databases automatically.
