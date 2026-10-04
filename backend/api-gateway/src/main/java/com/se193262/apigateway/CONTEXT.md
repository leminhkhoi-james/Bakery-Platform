# API Gateway

## Responsibility

Single public entry point for the frontend. It will route public API requests,
enforce edge concerns and propagate correlation data to backend services.

## Current state

Application and package skeleton only. Gateway technology, route configuration
and internal-service authentication still require implementation decisions.

## Boundary

The gateway must not own business rules or orchestrate domain transactions.

