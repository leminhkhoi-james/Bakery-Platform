# Authentication feature

## Responsibility

Registration, login, token refresh and token revocation.

## Current state

Package skeleton only. Controllers, services, repositories, entities, mappers,
DTOs and tests will be added when this feature is implemented.

## Boundary

This feature may persist only data owned by Identity Service. References to
other services remain plain UUID values and must be validated through internal
REST contracts.

