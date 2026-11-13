# Message feature

## Responsibility

Idempotent messages, attachments and delivery/read receipts.

## Current state

REST APIs, PostgreSQL persistence, cursor paging, SHA-256 payload idempotency,
attachment validation/storage with short-lived signed URLs, soft deletion and
delivery/read receipts are implemented.

MinIO I/O uses `CHAT_STORAGE_ENDPOINT`; signatures use
`CHAT_STORAGE_PUBLIC_ENDPOINT` and explicit `CHAT_STORAGE_REGION`. The public
origin defaults to the existing endpoint for application compatibility; local
Compose supplies its published loopback origin. URLs are never rewritten after
signing. Device loopback requires adb reverse; a public HTTPS origin can be
configured without changing the response fields or access policy.

## Boundary

This feature may persist only data owned by Chat Service. References to
other services remain plain UUID values and must be validated through internal
REST contracts.
