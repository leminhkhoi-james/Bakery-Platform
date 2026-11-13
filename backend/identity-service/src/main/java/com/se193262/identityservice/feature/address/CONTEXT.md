# Address feature

## Responsibility

Customer address management.

## Current state

Public authenticated CRUD is available at `/api/v1/users/me/addresses`, including detail and default selection. The actor comes only from the user JWT. All mutations lock the active parent user row, preserving the existing single-default partial unique index without a schema change. Another user's address returns 404. Delete removes the saved address; previously created Order snapshots remain independent.

PATCH null fields are unchanged; an empty ward clears the optional ward. Coordinate values must fit the existing six-decimal schema. Internal ownership-checked snapshots retain their flat response and now include persisted `id` and `label`, required by Direct Order's existing validation. No service credential is exposed to clients.

## Boundary

This feature may persist only data owned by Identity Service. References to
other services remain plain UUID values and must be validated through internal
REST contracts.

