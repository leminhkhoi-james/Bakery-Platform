# Order feature

## Responsibility

Direct and accepted-offer orders with immutable transaction snapshots.

## Current state

Package skeleton only. Controllers, services, repositories, entities, mappers,
DTOs and tests will be added when this feature is implemented.

## Boundary

This feature may persist only data owned by Order Service. References to
other services remain plain UUID values and must be validated through internal
REST contracts.

