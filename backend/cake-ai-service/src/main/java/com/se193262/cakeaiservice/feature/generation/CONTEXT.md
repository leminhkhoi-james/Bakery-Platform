# Generation feature

Durable asynchronous jobs, revisions and fenced execution leases. Admission and each paid stage require a positive Marketplace RFQ context using the Cake AI service credential; outages never permit execution.

Gemini is disabled by default (`cake-ai.policy.enabled`). No Java2D fallback. Each execution reserves 1 + 2 × design count requests before insertion. Global UTC-day, per-customer day/active quotas and the count-before-call provider ledger bound usage. Failed, cancelled and unknown calls do not refund reservations; no automatic provider retries. Legacy executions have zero reservations and cannot call the provider.

Actual provider metadata and SHA-256 are persisted; GCS upload/readback must complete before publication. Optional `require-admin-review` retains the automated decision and places safe outputs in PENDING for human review. Cloud orphan cleanup is opt-in and must not scan a shared bucket against an unrelated local dataset.

References to Identity/Marketplace are UUIDs and authenticated REST calls; never direct database reads across services.
