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

## Admin purchase directory — 2026-11-11

GET /api/v1/admin/subscription-orders lists all orders, including unpaid ones,
with server-side order status, bakery, created-time, text/amount and eligibility
filters. Payments are loaded once per page in a batch; list rows contain safe
payment DTOs without signed proof URLs. Existing admin order detail provides
current proof URLs only when opened. This is read-only and ADMIN-only.

Eligibility requires PAYMENT_REVIEW plus a SUBMITTED non-VNPAY payment whose
positive amount/currency matches the order. A candidate payment ID and explicit
reason code distinguish unpaid, mismatched, expired and completed orders.
Eligibility is an invitation to inspect evidence, not proof of received funds.
The existing approve endpoint reloads and validates payment/order state inside
its transaction. Listing never submits a payment or activates a period.

## Boundary

This feature may persist only data owned by Subscription Service. References to
other services remain plain UUID values and must be validated through internal
REST contracts.


## Authorization update — 2026-10-28

Platform roles are ADMIN, CUSTOMER and BAKERY_OWNER. Bakery membership only
supports OWNER. Bakery access requires ownership of the requested bakery;
only the owner can manage the bakery. See ADR-004.

## Subscription role update — 2026-11-01

CUSTOMER and BAKERY_OWNER user JWTs may create orders and read subscription/order
data, subject to the existing ACTIVE OWNER bakery membership checks. ADMIN retains
read/review access. This changes platform-role eligibility only; purchases remain
bakery-scoped and do not create personal subscriptions or bakery ownership.
# Approval prerequisite — 2026-11-11

Creation now requires OWNER membership and an ACTIVE Bakery profile, validated
through the existing internal profile API before entering the local transaction.
Non-ACTIVE profiles return 409. Historical order reads remain available. ADR-007
supersedes ADR-005's independent approval/payment order.

