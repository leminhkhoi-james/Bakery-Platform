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

## Authorization update — 2026-10-28

Platform roles are ADMIN, CUSTOMER and BAKERY_OWNER. Bakery membership only
supports OWNER. Bakery access requires ownership of the requested bakery;
only the owner can manage the bakery. See ADR-004.

## Concurrent participant access — 2026-11-14

Authorized owner list/detail requests serialize participant insertion on the
conversation row within a short transaction. Existing active participants keep
their join time and read marker; reactivation retains its existing semantics.
Bakery membership checks still happen before persistence. This prevents two
first reads from racing on `uq_conversation_participants_user`.
