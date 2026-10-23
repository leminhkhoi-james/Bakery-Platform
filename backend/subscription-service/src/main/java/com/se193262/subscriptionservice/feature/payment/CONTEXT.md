# Bakery payment feature

## Responsibility

Payment proof submission, review and audit.

## Current state

Submission accepts a reference or a private proof file in MinIO. Signed proof
URLs are returned only to the submitting owner or admin. Admin approval and
rejection update payment and order in one Subscription DB transaction; approval
creates one period from the order's feature snapshot. Idempotency key hashes and
optimistic versioning protect retries and concurrent review. Owner membership is
validated through Bakery Service; unavailable validation fails closed.

## Boundary

This feature may persist only data owned by Subscription Service. References to
other services remain plain UUID values and must be validated through internal
REST contracts.

