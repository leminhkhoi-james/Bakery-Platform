# Generated design feature

## Responsibility

Generated design metadata, access validation and moderation.

## Current state

Internal design validation and request generation-context APIs read persisted jobs/designs. Provider generation and public moderation workflows remain pending.

## Boundary

This feature may persist only data owned by Cake AI Service. References to
other services remain plain UUID values and must be validated through internal
REST contracts.

