# Subscription order feature

## Responsibility

Bakery subscription purchase orders.

## Current state

Subscription orders have create/list/get APIs. Create snapshots plan name,
code, features, period, price and currency; it requires an Idempotency-Key and
starts in PENDING_PAYMENT. Order expiry defaults to 24 hours. Ownership and
membership are checked through Bakery Service. A scheduler expires unpaid orders.

## Boundary

This feature may persist only data owned by Subscription Service. References to
other services remain plain UUID values and must be validated through internal
REST contracts.

