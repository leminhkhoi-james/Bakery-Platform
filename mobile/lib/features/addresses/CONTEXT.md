# Live delivery addresses

Identity owns persisted UUIDs at `/api/v1/users/me/addresses`: list, detail, create, PATCH, DELETE and PUT default. ApiClient supplies user authentication and fences stale responses across account changes. The repository deliberately has no address cache. Selection lives only in the current route; logout replaces the authenticated navigation context.

List and picker share one screen and the existing SweetCake components. CRUD reloads the server list, default is explicit, empty/error states stay distinct, and ambiguous creation asks for reconciliation rather than another POST. No hand-entered UUID or browser-local address is accepted for Checkout/Offer acceptance. Optional coordinates are preserved by PATCH and are not required by the native delivery form.
