# Subscription order feature

## Responsibility

Bakery subscription purchase orders.

## Current state

Subscription orders have create/list/get APIs. Create snapshots plan name,
period, price and currency; it requires an Idempotency-Key and starts in
PENDING_PAYMENT. Order expiry defaults to 24 hours. The temporary controller
uses the JWT subject as the requester ID and checks platform roles. It remains
disabled in `prod` and does not yet validate bakery membership through Bakery Service.

## Boundary

This feature may persist only data owned by Subscription Service. References to
other services remain plain UUID values and must be validated through internal
REST contracts.

