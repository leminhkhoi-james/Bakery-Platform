# User feature

## Responsibility

User profiles, platform roles and administrative user management.

## Current state

User, customer profile and platform-role persistence needed by authentication
is implemented. Registration creates an active customer with the `CUSTOMER`
role and default `vi` profile. Profile editing, address management and admin
user-management endpoints remain pending.

## Boundary

This feature may persist only data owned by Identity Service. References to
other services remain plain UUID values and must be validated through internal
REST contracts.

