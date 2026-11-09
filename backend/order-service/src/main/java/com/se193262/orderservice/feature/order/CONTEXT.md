# Order feature

## Responsibility

Direct and accepted-offer orders with immutable transaction snapshots.

## Current state

Direct and accepted-offer creation, public fulfillment and eligible reviews are implemented. Creation persists immutable items/address and durable key/payload fingerprints; replay checks precede remote calls. Direct uses the Identity address's persisted UUID and validates its flat internal response. Identity now returns `id` and `label` alongside its ownership-checked delivery fields.

Identity address 404 becomes invalid order input (422), preserving privacy for foreign/deleted addresses. Catalog quote 404/422 also preserve validation meaning; quote 409 remains a business conflict. Internal authentication errors and outages remain remote failures (503), never successful fallback data. Address deletion or edits do not rewrite existing Order snapshots.

## Boundary

This feature may persist only data owned by Order Service. References to
other services remain plain UUID values and must be validated through internal
REST contracts.


## Authorization update — 2026-10-28

Platform roles are ADMIN, CUSTOMER and BAKERY_OWNER. Bakery membership only
supports OWNER. Bakery access requires ownership of the requested bakery;
only the owner can manage the bakery. See ADR-004.
