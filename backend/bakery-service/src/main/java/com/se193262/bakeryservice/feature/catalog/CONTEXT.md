# Catalog feature

## Responsibility

Public and bakery-owned catalog orchestration.

## Current state

Internal profile, membership, customization quote and add-on quote APIs read this service database. Full public catalog CRUD remains pending.

## Boundary

This feature may persist only data owned by Bakery Service. References to
other services remain plain UUID values and must be validated through internal
REST contracts.

