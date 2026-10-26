# Offer feature

## Responsibility

Bakery offers and the idempotent offer-acceptance workflow.

## Current state

Offer snapshots, entitlement/membership checks, lifecycle and durable acceptance workflow are implemented. See ADR-002 for reservation, leases, idempotency and ambiguous-result recovery.

## Boundary

This feature may persist only data owned by Marketplace Service. References to
other services remain plain UUID values and must be validated through internal
REST contracts.

