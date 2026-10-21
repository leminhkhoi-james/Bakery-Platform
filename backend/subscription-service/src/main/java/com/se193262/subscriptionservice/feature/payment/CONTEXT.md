# Bakery payment feature

## Responsibility

Payment proof submission, review and audit.

## Current state

Reference-based payment submission and admin queue listing are implemented.
Submission requires multipart `metadata`, a payment reference and an
Idempotency-Key. Payment and order move to SUBMITTED/PAYMENT_REVIEW. V3 adds a
unique key hash; raw keys are not stored. Proof upload, signed URLs, approval,
rejection and subscription activation are pending. Temporary controllers are
disabled in `prod`. Submission takes user ID from the JWT subject and requires
platform BAKERY_OWNER; bakery membership validation is not integrated yet.

## Boundary

This feature may persist only data owned by Subscription Service. References to
other services remain plain UUID values and must be validated through internal
REST contracts.

