# Conversation feature

## Responsibility

Conversation lifecycle, participants and context authorization.

## Current state

REST controllers, JPA persistence, request/bakery context authorization,
participant checks, conversation listing, idempotent creation and close
lifecycle are implemented. Bakery memberships are revalidated by Bakery
Service before protected conversation access. Marketplace verifies the customer,
request state and target/pending/accepted offer eligibility. Chat obtains
audience- and scope-specific service JWTs from Identity and caches them until
shortly before expiry.

## Boundary

This feature may persist only data owned by Chat Service. References to
other services remain plain UUID values and must be validated through internal
REST contracts.
