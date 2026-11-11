# Bakery payment feature

ADR-007: initiating VNPay checkout or submitting manual evidence additionally
requires an ACTIVE Bakery profile. Check occurs before upload/attempt persistence.
Verified IPN settlement and admin review of existing payments remain unchanged so
previously collected money is not lost when a profile changes status.

Payment supports manual evidence/admin review and VNPay Sandbox (ADR-006).
The retired SANDBOX evidence method remains rejected; sandboxEnabled=false on
the compatibility endpoint describes that retired simulator, not VNPay availability.
VNPay checkout requires configured merchant credentials and owner membership.
Only verified IPN settles; browser return is read-only. Gateway verification_source
is VNPAY with no admin identity. Manual verification_source remains MANUAL.
Checkout, manual submission and IPN serialize on the order row. Active VNPay
attempts block manual evidence; failed/expired attempts allow retry/fallback.
Late successful IPNs with a pay time inside the original window can settle
expired unpaid orders. Conflicting paid callbacks persist REVIEW_REQUIRED for
admin reconciliation at GET /api/v1/admin/vnpay-attempts?status=REVIEW_REQUIRED.
Settlement and attempt outcome commit atomically. Duplicate IPNs do not grant
another period. See docs/VNPAY-SANDBOX.md for setup and external verification.
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

