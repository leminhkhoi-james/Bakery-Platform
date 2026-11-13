# ADR-006 — VNPay Sandbox for subscription purchases

## Decision — 2026-11-10

Add VNPay PAY 2.1.0 for bakery subscription orders, as requested by the user.
This supersedes ADR-005's exclusion of gateway payments. Cake orders remain
outside the payment boundary. Manual evidence and admin approval remain available.

The backend creates a persisted attempt using the order's VND price snapshot.
Only a verified IPN may settle a gateway payment and activate/queue its period.
Browser return is read-only. HMAC-SHA512, merchant, reference, amount and both
success codes are checked. Secrets come from environment variables; the gateway
is disabled until configured. Gateway approval has no fabricated admin identity.

Order row locking serializes attempt creation, manual submission and IPN. Active
attempts block manual submission. Repeated IPNs never create another period.
Successful late IPNs for expired unpaid orders can settle when the signed pay
time falls within the attempt window. A successful payment conflicting with an
already reviewed/completed order is retained as REVIEW_REQUIRED for reconciliation,
without granting a second period. Failed attempts allow another attempt.

Reference: https://sandbox.vnpayment.vn/apis/docs/thanh-toan-pay/pay.html
