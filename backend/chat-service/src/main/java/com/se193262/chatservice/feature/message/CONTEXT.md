# Message feature

## Responsibility

Idempotent messages, attachments and delivery/read receipts.

## Current state

REST APIs, PostgreSQL persistence, cursor paging, SHA-256 payload idempotency,
attachment validation/storage with short-lived signed URLs, soft deletion and
delivery/read receipts are implemented.

## Boundary

This feature may persist only data owned by Chat Service. References to
other services remain plain UUID values and must be validated through internal
REST contracts.
