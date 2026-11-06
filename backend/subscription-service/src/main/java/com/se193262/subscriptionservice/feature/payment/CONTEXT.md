# Bakery payment feature

The optional local sandbox validates a reusable test code server-side and uses
the same payment submission, idempotency and admin review flow. The test code is
replaced with an order-specific reference before persistence. See ADR-005.
Successful admin approval notifies Bakery after commit to check pending owner
activation. Bakery retries activation if the notification fails.

## Responsibility

Payment proof submission, review and audit.

## Current state

Submission accepts a reference or a private proof file in MinIO. Signed proof
URLs are returned only to the submitting owner or admin. Admin approval and
rejection update payment and order in one Subscription DB transaction; approval
creates one period from the order's feature snapshot. Idempotency key hashes and
optimistic versioning protect retries and concurrent review. Owner membership is
validated through Bakery Service; unavailable validation fails closed.

User JWTs with CUSTOMER or BAKERY_OWNER may submit payment. Both still require
ACTIVE OWNER membership of the order's bakery. Review remains ADMIN-only.

## Boundary

This feature may persist only data owned by Subscription Service. References to
other services remain plain UUID values and must be validated through internal
REST contracts.

