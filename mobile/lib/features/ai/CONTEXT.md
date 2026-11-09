# Cake AI live

Public create uses multipart metadata/sourceImages with an action-scoped idempotency key; revise JSON and cancel preserve existing contracts. Customer jobs remain owner-scoped, bounded polling only reads status. DRAFT/OPEN RFQs allow generation; selection currently shown for DRAFT and validates readback selectedDesignId on the same request.

ADMIN entry from profile and Admin RFQ page opens `/admin-ai-designs`: public authorized list with server pagination and PENDING/APPROVED/REJECTED filters. Authorized PENDING preview, terminal decisions and audit history use public APIs; no internal endpoints or manual UUID entry. Cancelled confirmation sends no mutation/success feedback.

Source attribution comes from persisted providerMetadata provider=GOOGLE_GEMINI and completed status, never from CAKE_AI_MODE. Missing/legacy metadata is explicitly unverified. Expired image links can be refreshed through authorized metadata GET. Customer PENDING/REJECTED media remains hidden; Admin rejected images remain hidden. SweetCake tokens, existing native components and accessibility behavior are preserved.
