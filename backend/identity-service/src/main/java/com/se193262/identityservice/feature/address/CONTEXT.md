# Address feature

## Responsibility

Customer address management.

## Current state

Internal ownership-checked address snapshots are served through the user-context service. Public address CRUD remains pending.

## Boundary

This feature may persist only data owned by Identity Service. References to
other services remain plain UUID values and must be validated through internal
REST contracts.

