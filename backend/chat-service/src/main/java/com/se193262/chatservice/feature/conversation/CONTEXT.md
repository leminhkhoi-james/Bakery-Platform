# Conversation feature

## Responsibility

Conversation lifecycle, participants and context authorization.

## Current state

REST controllers, JPA persistence, request/bakery context authorization,
participant checks, conversation listing, idempotent creation and close
lifecycle are implemented. Bakery memberships are revalidated by Bakery
Service before protected conversation access. Marketplace authorization
requires the internal `chat-authorization` contract documented in API_SPEC.

## Boundary

This feature may persist only data owned by Chat Service. References to
other services remain plain UUID values and must be validated through internal
REST contracts.
