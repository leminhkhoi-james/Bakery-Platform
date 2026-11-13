# Offer feature

## Responsibility

Bakery offers and the idempotent offer-acceptance workflow.

## Current state

Offer snapshots, entitlement/membership checks, lifecycle and durable acceptance workflow are implemented. See ADR-002 for reservation, leases, idempotency and ambiguous-result recovery.

Acceptance consumes an owned Identity address UUID through Order's existing internal orchestration. Failed validation keeps the key's definitive failed result; ambiguous outages retain recovery state. A PostgreSQL lock victim is mapped to HTTP 409 by MarketplaceConcurrencyExceptionHandler after transaction rollback, preserving the existing reservation/recovery model rather than returning an unexpected 500.

## Boundary

This feature may persist only data owned by Marketplace Service. References to
other services remain plain UUID values and must be validated through internal
REST contracts.

