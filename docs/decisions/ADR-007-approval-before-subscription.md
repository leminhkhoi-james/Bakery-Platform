# ADR-007 — Approve bakery profiles before subscription checkout

## Decision — 2026-11-11

Supersedes ADR-005's independent ordering of profile approval and payment.
The owner submits the bakery profile, waits for admin approval, then purchases
a subscription. Existing Bakery status ACTIVE represents an approved profile;
it does not by itself grant public listing or seller workspace access.

Subscription validates OWNER membership and reads the Bakery internal profile
before creating an order, starting VNPay checkout or accepting manual evidence.
Only ACTIVE profiles may proceed; other statuses return 409. Missing/malformed
or unavailable remote validation does not permit purchase. No cross-database
query or new status/schema is required. Read access to existing orders remains.

The frontend keeps a selected plan visible while awaiting approval, disables
order creation and payment, and refreshes approval before enabling the next step.
Workspace activation still requires both the approved profile and active period.

Already initiated gateway payments must retain verified IPN processing and
idempotent settlement even if the bakery is subsequently suspended or returned
for changes. This policy does not reject a callback for money already collected,
delete historical orders, or retroactively alter paid periods. Manual admin
review/reconciliation also remains available. New purchase initiation is blocked.

Initial subscription periods continue to start at confirmed payment settlement;
renewals follow the existing paid period. There is no distributed transaction
between profile approval and payment; later status changes still prevent public
listing/workspace activation via the existing entitlement checks.
