# Subscription order feature

## Responsibility

Bakery subscription purchase orders.

## Current state

Subscription orders have create/list/get APIs. Create snapshots plan name,
code, features, period, price and currency; it requires an Idempotency-Key and
starts in PENDING_PAYMENT. Order expiry defaults to 24 hours. Ownership and
membership are checked through Bakery Service. A scheduler expires unpaid orders.
Creation takes the same per-bakery PostgreSQL transaction advisory lock used by
approval, preventing concurrent open orders. PAYMENT_REVIEW blocks new purchases
even after the payment-submission deadline until review is resolved. A replay
filters payment proof URLs by the actual viewer, just like the order detail API.

## Boundary

This feature may persist only data owned by Subscription Service. References to
other services remain plain UUID values and must be validated through internal
REST contracts.


## Authorization update — 2026-10-28

Platform roles are ADMIN, CUSTOMER and BAKERY_OWNER. Bakery membership only
supports OWNER. Bakery access requires ownership of the requested bakery;
retired staff/manager roles cannot authorize access. See ADR-004.
