# Order feature

## Responsibility

Direct and accepted-offer orders with immutable transaction snapshots.

## Current state

Internal accepted-offer order creation persists immutable items/address and a durable key/payload fingerprint. Replay checks precede remote calls. Direct orders, public status management and reviews remain pending.

## Boundary

This feature may persist only data owned by Order Service. References to
other services remain plain UUID values and must be validated through internal
REST contracts.


## Authorization update — 2026-10-28

Platform roles are ADMIN, CUSTOMER and BAKERY_OWNER. Bakery membership only
supports OWNER. Bakery access requires ownership of the requested bakery;
retired staff/manager roles cannot authorize access. See ADR-004.
