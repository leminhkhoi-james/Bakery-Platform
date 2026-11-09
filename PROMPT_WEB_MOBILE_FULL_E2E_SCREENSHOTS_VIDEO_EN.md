# MASTER EXECUTION PROMPT — BAKERY PLATFORM FULL WEB + FLUTTER E2E ACCEPTANCE, SCREENSHOTS & VIDEO

## 0. MISSION AND AUTHORITATIVE OUTPUT LOCATION

Act as a Principal QA Engineer, Microservices Integration Analyst, Web Test Automation Engineer, Flutter/Android QA Engineer, and Technical Documentation Specialist.

Repository:

`H:\MSS\Bakery-Platform`

Applications:

- `backend/`: the actual Backend microservices.
- `frontend/`: the actual Web Frontend.
- `mobile/`: the actual Flutter application.

Perform one comprehensive current-version acceptance campaign covering the implemented system from beginning to end. Exercise every supported human role and every discovered in-scope UI function on BOTH the Web Frontend and the native Flutter application running on a local Android Emulator. Both clients must use the real Dockerized Backend, not demo repositories or fabricated API responses.

Capture genuine screenshots during testing. After the complete mandatory acceptance suite passes, record complete role-by-role and A-to-Z walkthrough videos of BOTH the Web application and Android application. Verify the videos, then write one detailed final Vietnamese Markdown report.

**This is TEST-ONLY. Do not implement features, repair bugs, change UI, or modify application source/configuration.**

### Authoritative destination

The user's final destination takes precedence over any earlier reference to `mobile/docs/`:

`H:\MSS\Bakery-Platform\docs\mobile\`

Put all newly authored test scripts, harness configuration, test outputs, screenshots, recordings, indexes, and the final report under that directory. Do NOT place this task's deliverables in `mobile/docs/`, `mobile/test/`, `frontend/tests/`, or root `test-results/`.

Create a unique run directory, for example:

`docs/mobile/runs/<RUN_ID>/`

Generate `RUN_ID` from the actual execution timestamp and source revision. Do not assume a date, branch, device name, port, API count, or previous test result.

The ONLY permitted edit outside `docs/mobile/` is the minimal root `.gitignore` change needed to ignore `/docs/mobile/`. The user explicitly authorizes that configuration exception. The root instruction file being read is a user-provided input; do not rewrite it.

---

## 1. NON-NEGOTIABLE BOUNDARIES

### 1.1. Protected application trees

Treat the following as read-only:

- `backend/`, including Java, POMs, migrations, SQL, tests, Dockerfiles, and application settings.
- `frontend/`, including React/TypeScript, CSS, dependencies, lockfiles, assets, tests, and environment files.
- `mobile/`, including Dart, native Android/iOS projects, assets, dependencies, lockfiles, tests, tooling, and README.
- Existing root Compose files, startup scripts, `.env`, `docker.env`, project instructions, skills, and documentation outside the authorized output directory.
- Existing external secret/configuration files.

Do not add test IDs, semantics, debug buttons, test routes, dependency overrides, API adapters, network interceptors, or instrumentation to production application code, even in a temporary application copy.

Do not update SDKs, application dependencies, security rules, server grants, storage permissions, or existing environment files to make tests pass.

Do not fix broken application tests or product code. If a new external test harness is wrong, you may correct that harness under `docs/mobile/`, explain the correction, preserve the initial result, and rerun only affected tests.

Do not redesign anything. Existing Taste Skill, Impeccable, `design-web.md`, and Mobile design documents may be read to evaluate visual consistency, but not used to change the interface in this task.

### 1.2. Source and filesystem integrity

Record the initial Git branch, HEAD, staged changes, unstaged changes, and relevant untracked files. Preserve all pre-existing user work.

Record hashes of protected first-party files, including untracked source/configuration relevant to the campaign, and inventory existing generated artifacts. Protect secret-file integrity without copying their contents into evidence.

Avoid source-directory side effects from normal tooling:

- Maven can write `target/`.
- Flutter can write `.dart_tool/`, `build/`, generated native files, or lockfiles.
- Vite, package managers, Playwright, Gradle, and IDEs can write caches or test output.

Use verified existing builds, supported out-of-tree outputs, or an external temporary working copy of the SAME unmodified source and lockfiles. Direct all test-owned outputs into the authorized run directory where supported; use external scratch space for large transient build artifacts.

An external copy must not contain application-code patches, fabricated responses, relaxed validation, altered authorization, or different dependencies. Record its source hashes and differences limited to generated execution artifacts and external test harnesses.

Do not interpret an unchanged `git diff` as proof that ignored or untracked files were untouched. Verify the protected filesystem as well.

If a tool cannot run without changing protected files, choose a non-invasive equivalent or report that check as blocked. Do not silently edit and revert application files.

### 1.3. Git safety

Do not stage, commit, push, merge, rebase, reset, switch branches, stash, rewrite history, or alter Git configuration/index flags.

Do not run `git add .`, `git add -f`, `git rm --cached`, `git clean`, `git reset --hard`, `assume-unchanged`, or `skip-worktree`.

Do not remove or ignore the project's existing maintained test source merely because it contains the word `test`. This task's NEW test code belongs under the ignored `docs/mobile/` directory; existing application tests remain untouched.

### 1.4. Runtime state and test data

Testing may create normal application records through legitimate APIs/UI in a verified local or approved sandbox environment. This is not permission to edit schema or directly force business state in a database.

Use dedicated synthetic accounts, products, bakeries, requests, orders, conversations, attachments, and reviews tagged to the run where the schema permits.

Do not use a real customer's credentials or personal data. Never forge JWTs, insert an Admin into SQL, approve records with private service credentials from a client, or manually set Order/Payment/Design status to bypass a workflow.

Do not delete/reset existing volumes, databases, AVD data, or application data. Never run `docker compose down -v`, volume pruning, or broad process-kill commands.

Do not uninstall a user's application as an incidental test-runner action. Inspect runner behavior first. Prefer a dedicated test emulator/profile where needed. Process-restart testing is not permission to clear storage.

### 1.5. External side effects

Before any write test, identify all downstream effects, including scheduled cleanup, notifications, cloud storage, AI billing, and payment callbacks.

Do not use production systems, make real transfers/refunds, send unsolicited notifications, or incur unapproved AI/storage costs. Existing credentials or a prior report saying “sandbox” do not alone establish current authorization.

Use only authorized sandbox resources and run-specific storage prefixes. A disposable database paired with a shared storage bucket can still be dangerous if cleanup workers scan the whole bucket: inspect and avoid that configuration before starting it.

If an external dependency is unavailable or not approved, report `BLOCKED_EXTERNAL_SERVICE`. Do not swap it for a fake success and call the business journey live.

---

## 2. CREATE THE IGNORED EVIDENCE WORKSPACE FIRST

### 2.1. Inspect before editing

From the repository root, inspect:

```powershell
Get-Location
git status --short
git diff --name-only
git diff --cached --name-only
git ls-files -- docs/mobile
```

Read the root `.gitignore` and applicable nested ignore rules. Preserve existing encoding, line endings, comments, and rules.

Add the following root-anchored rule if it is not already effectively configured:

```gitignore
# Local-only Web/Android acceptance scripts, reports, screenshots and recordings
/docs/mobile/
```

Make the operation idempotent. Do not replace the entire `.gitignore`, add broad patterns such as `test/`, or change unrelated ignore behavior.

### 2.2. Verify ignore behavior

Create a harmless test-owned probe under the new run directory and verify both rule matching and untracked status. Appropriate checks include:

```powershell
git check-ignore -v -- docs/mobile/runs/<RUN_ID>/ignore-check.txt
git ls-files -- docs/mobile/runs/<RUN_ID>
git status --short --untracked-files=all
```

Substitute the actual `RUN_ID`; do not execute angle-bracket placeholders literally. The second command must not list new deliverables as tracked files.

Check representative script, PNG, JSON, and MP4 paths before producing sensitive or large artifacts.

**Important:** `.gitignore` does not remove files already tracked by Git. If historical files under `docs/mobile/` are tracked, do not untrack them automatically or overwrite them. Use a fresh untracked run path, record the limitation, and provide a separately labeled future command for the owner to review. Do not claim old tracked evidence has disappeared from GitHub.

Never force-add ignored artifacts. Preserve the root `.gitignore` change as an unstaged change for the owner to review later.

### 2.3. Output structure

Use this structure, adapted only for actual discovered test needs:

```text
docs/mobile/
└── runs/<RUN_ID>/
    ├── BAKERY_PLATFORM_WEB_MOBILE_FULL_E2E_REPORT_VI.md
    ├── tools/
    │   ├── web/
    │   ├── android/
    │   ├── api/
    │   └── recording/
    ├── manifests/
    │   ├── run.json
    │   ├── environment.json
    │   ├── role-function-matrix.json
    │   ├── scenario-results.json
    │   ├── api-coverage.json
    │   ├── resource-lineage.json
    │   ├── screenshot-index.json
    │   ├── video-index.json
    │   ├── file-integrity.json
    │   └── checksums.sha256
    ├── logs/
    │   ├── sanitized-api/
    │   ├── backend/
    │   ├── web/
    │   └── android/
    ├── screenshots/
    │   ├── web/<role>/<scenario>/
    │   └── android/<role>/<scenario>/
    ├── videos/
    │   ├── web/raw/
    │   ├── web/chapters/
    │   ├── android/raw/
    │   ├── android/chapters/
    │   └── final/
    └── test-results/
```

Write ONE primary Vietnamese Markdown report; use structured JSON/CSV manifests for detailed indexes rather than proliferating separate reports. Link all artifacts from the report using relative paths.

Do not overwrite older runs. Normal global tool caches may remain in their normal locations; new reusable test code and final evidence must reside under the ignored output directory. Keep temporary authentication/session material in a separate protected ephemeral location, not in evidence.

---

## 3. DISCOVER THE CURRENT SYSTEM, ROLES, AND COVERAGE

### 3.1. Read current references

Read applicable `AGENTS.md` files and project rules, current source, current startup guides, and relevant historical reports. Useful references may include:

- `docs/PROJECT-STATUS.md`, architecture and API specifications.
- Backend full-system audit and detailed API catalog.
- Current role, workflow, database, and authorization documentation.
- Mobile full-integration, six-issue revalidation, and remediation reports.
- Cake AI build/runtime/provider reports.
- `mobile/README.md`, `mobile/PRODUCT.md`, `mobile/DESIGN.md`.
- `design-web.md` and the two installed design skills for read-only UI review.

Discover actual paths. A missing historical file is not permission to invent its contents. Use available current evidence and disclose the gap.

Do not reuse old totals such as 113 APIs, 93 adapters, or previous test-pass counts as current results.

### 3.2. Build a role/function/platform matrix

Discover all current human roles and authorized role combinations. Expected examples are Guest, Customer, Bakery Owner, and Admin; verify actual authorities and membership semantics.

Inventory every actionable screen, route, menu item, form, filter, upload, download, mutation, and status transition implemented in either client.

For each function record:

| Field | Required content |
|---|---|
| Function ID | Stable identifier |
| Domain | Identity/Bakery/Subscription/Marketplace/Order/Chat/Cake AI/other verified domain |
| Role | Required role and resource ownership |
| Web | Actual route, component, action, or explicit absence |
| Android | Actual screen, control, action, or explicit absence |
| Backend | Service + method + normalized route |
| Prerequisites | Accounts, records, state, permissions, dependencies |
| Test cases | Happy path, relevant rejection/recovery cases |
| Expected state | Source-backed outcome |
| Evidence | Screenshots, request summaries, record IDs, videos |
| Result | Separate Web, Android, and cross-client results |

All implemented UI functions need a documented disposition. Do not test only the homepage and login then describe the platform as complete.

Distinguish static informational content from business actions. Do not invent APIs for static text.

### 3.3. Coverage categories

Keep these separate:

1. Backend operation exists.
2. Client adapter exists.
3. Backend preflight request was executed.
4. Web UI actually invoked the operation.
5. Android UI actually invoked the operation.
6. Intended state persisted and was read back.
7. Another authorized role/client observed the same resource.
8. The full business journey passed.

API coverage must use `service + HTTP method + normalized route`. Do not count duplicate invocations as separate APIs or count Gateway forwarding as another business operation.

Internal service APIs, JWKS, health, documentation, and webhooks are not ordinary user-screen integrations. List their supporting role separately. Never embed service credentials in browser/Mobile test flows.

### 3.4. Missing features and historical blockers

Revalidate, do not assume, historical Address/Checkout gaps, Chat history/media/pending issues, RFQ storage configuration, Cake AI provider/build/moderation limitations, Gateway drift, and membership discovery gaps.

If the Backend supports a feature but one client lacks the corresponding UI, report that platform gap. Do not add the feature.

If a visible screen uses mocks, report `FAIL_NOT_LIVE` for a claimed live action. Do not silently connect it to Backend.

Do not shrink mandatory scope after discovering failures. Distinguish genuine out-of-product-scope capabilities from incomplete expected journeys such as Checkout.

---

## 4. ESTABLISH A SAFE AND TRACEABLE LOCAL RUNTIME

### 4.1. Identify source and deployed artifact versions

Record source HEAD plus dirty-worktree hashes, Backend image IDs, JAR identities when available, Web build provenance, and APK/package/build identity.

Separate the existing deployment from any isolated current-source deployment. A test of a newly built copy is not proof that the user's original container was updated.

If an image is stale, report the mismatch. You may build unchanged current source in isolated scratch space and start a separate permitted local test deployment; do not silently redeploy or patch the owner's existing stack.

Do not modify root Compose or secrets. A temporary launcher/configuration under the output directory may reference existing settings and use distinct test ports/volumes, but may not introduce new product behavior, new Gateway routes, auth bypasses, or a storage workaround that masks a defect.

### 4.2. Verify prerequisites and startup

Discover actual executables and versions rather than assuming this machine's historical paths:

- Docker Engine/Compose and active context.
- Java/Maven and available images/build outputs.
- Node/package manager and Web runtime.
- Flutter/Dart and Android SDK/ADB/Emulator.
- Available AVDs and actual device serial.
- Browser/automation and recording tools.
- Disk space for artifacts and video.

Inspect startup scripts before running them. Confirm they will not generate files into protected trees, regenerate credentials, change databases, or reset services.

Verify Docker Engine availability before attempting Backend startup. An unavailable Engine is `BLOCKED_ENVIRONMENT`, not an API bug.

Start/reuse only relevant local services and their dependencies. Use read-only source/configuration discovery to select the correct file layering, profiles, and environment sources.

### 4.3. Configuration and secrets

Read only relevant existing settings, including the root `.env` and known project secrets such as `H:\MSS\.secrets\bakery-platform`, if needed and authorized.

Do not scan unrelated private directories. Do not print full environment files, container environments, credentials, private keys, cookies, or signed URL queries.

Verify whether settings are actually passed to running containers; a variable existing on the host does not prove runtime use.

Do not enable a different Firebase/AI/payment mode without verifying that the supported setting is authorized for the selected test environment. Missing permissions are blockers, not permission to create new accounts, keys, or IAM policies.

### 4.4. Android readiness and networking

Discover and launch the correct AVD. Verify ADB connectivity and actual Android boot completion before installation or testing.

A typical check sequence, after resolving the actual device ID, is:

```powershell
flutter doctor -v
flutter emulators
flutter devices
adb devices -l
adb -s <DEVICE_ID> shell getprop sys.boot_completed
```

If offline or still booting, diagnose the selected emulator. A safe Cold Boot may be used without wiping data. Avoid killing unrelated emulators or changing shared virtualization settings.

Use a bounded readiness check with a timeout and diagnostic output; never loop indefinitely.

Discover actual published Backend/storage ports. Verify the application's existing URL configuration and whether it relies on `adb reverse` or another supported network path. Set only the required mappings for the selected emulator and record them.

Verify host HTTP access, emulator transport access, and actual Flutter-client access separately. Do not assume that `localhost`, a Docker service hostname, and the emulator host alias are interchangeable.

Do not rewrite presigned URLs, disable TLS verification, bypass CORS, change cookie security attributes, or alter app network-security config. If existing configuration cannot reach a service safely, report it.

### 4.5. Web runtime and shared data

Run the actual Web Frontend, not Flutter Web as a substitute. Use a real browser at the intended viewport and verify actual API requests.

Ensure Web and Android point to the SAME intended Backend services, databases, and storage dataset. Record any distinct Gateway/direct-service paths. Do not compare two independent datasets as evidence of cross-platform synchronization.

Check that Web/Mobile runtime modes do not load fixtures or intercept requests with fake success responses.

### 4.6. Execution safety

Use a separate local test environment if data ownership, background jobs, or destructive actions cannot be safely bounded. Do not copy production data into it.

A separate environment must preserve the current application implementation. Do not suppress failed features to make the environment appear healthy.

Keep initial service states and test-owned resource labels. Stop/delete only newly created disposable resources when safe. Do not stop pre-existing owner services without explicit authorization.

---

## 5. BUILD REPRODUCIBLE TEST DATA WITHOUT SHORTCUTS

Create a small synthetic actor set sufficient for role/ownership tests, such as:

- Customer A: primary buyer.
- Customer B: independent buyer/unauthorized actor.
- Owner A: legitimate owner of Bakery A.
- Owner B, if required to verify bakery isolation.
- An existing authorized test Admin.

Use actual supported registration, onboarding, approval, and session flows. Do not grant roles in SQL or use a demo persona switch as live authentication.

Keep passwords in memory or protected ephemeral credentials storage. Record non-secret actor labels rather than real personal information.

Plan separate records for mutually exclusive branches: an Order completed successfully cannot also serve as a legitimate cancelled Order; a withdrawn Offer cannot be used to prove acceptance.

Use unique run identifiers to avoid duplicate email, one-offer-per-bakery, subscription-period, and record-state conflicts.

Maintain a resource-lineage manifest connecting:

`actor → bakery → plan/subscription order → product/options → RFQ → offer → product order → review → conversation/messages → generation job/design`

For each ID, record creation method, creating role/client, subsequent actions, and evidence. Do not splice unrelated old records into a purported continuous journey.

API setup may prepare legitimate fixtures where necessary, but label it `FIXTURE_SETUP_API`; it is not a Web or Android UI PASS. Never seed an intermediate business state to claim a skipped UI journey passed.

---

## 6. TEST EVERY ROLE AND FUNCTION ON BOTH CLIENTS

The following is the minimum domain checklist. Expand it from current source/UI discovery; do not assume a named feature exists.

### 6.1. Guest/Public

On Web and Android, verify Home, navigation, product/bakery discovery, details, categories, real prices/options/images, plan discovery, search, filters, sorting, pagination, empty results, retry, and restricted-action prompts.

Use real server IDs. Confirm no fixture products replace API failures. Static logos and decorative assets are not mock business data.

### 6.2. Customer/Identity

Verify registration, field validation, duplicate-account handling, login success/failure, current-user data, token/session refresh, app/browser restart behavior, logout, and role-sensitive navigation.

Verify profile/address operations only where actually supported. If Checkout requires an address that neither application can obtain through an authorized public contract, mark the dependent journey blocked. Do not invent an address UUID or use internal Identity APIs.

Keep failed-registration versus uncertain-result behavior separate. A lost response does not establish that the account was not created.

### 6.3. Owner onboarding and bakery management

Exercise application submission, permitted edits, administrative review, supported activation prerequisites, fresh token/role updates, legitimate bakery selection, membership boundaries, business profile, operating settings, branches, media, and supported member functions.

Verify product/category CRUD, options/add-ons, images, publication/hiding/archival, validation, and unauthorized actions. Match actual Backend replacement/update semantics.

Where more than one bakery is supported, test correct context switching and cold-start discovery. Do not infer ownership from the public directory.

### 6.4. Subscription and related Admin workflows

Test real plan data, Subscription order creation, proofs/payment references, review, rejection/resubmission, activation, current/scheduled periods, renewal, plan management, archival, and price snapshots where implemented.

A proof submission is not confirmed bank payment. Test only the actual sandbox/manual-review contract. Do not describe it as real settlement.

Track the same bakery and Subscription order across Customer/Owner and Admin, Web and Android.

### 6.5. Marketplace/RFQ/Offer

Test creation, draft editing, publication, permitted cancellation, eligibility filters, image upload/retrieval/deletion, Offer creation/edit/withdrawal, customer comparison, and acceptance where supported.

Verify ownership, bakery membership/eligibility, status restrictions, duplicates, validation, and cross-service failure messages.

For Offer acceptance, retain any supported operation key and reconcile actual results before retry. A timeout/5xx response can leave an uncertain outcome. Do not create a separate direct Order to impersonate an accepted-Offer Order.

### 6.6. Direct product Order/Checkout

Test real product selection, options/add-ons, quantities, bakery restrictions, local draft/cart behavior, actual server pricing, delivery date/time, supported address selection, submission, Order retrieval, tracking, Owner processing, cancellation, completion, and permitted review.

Keep provisional totals distinct from authoritative server totals. Test currency, date/timezone display, and stale/unavailable products.

Follow actual Order transitions and authorized roles. Do not make Customer complete an Order if only the Owner can do so. Do not show payment/escrow success when no such Backend operation exists.

Missing Address/Order contracts remain blockers and must prevent a false full-journey PASS.

### 6.7. Chat

Test conversation creation/discovery/details, participation, text messages, attachments, message history, cursor pagination, read state, supported deletion/closure, and authorization.

Verify Customer Web → Owner Android and Customer Android → Owner Web exchanges using the same conversation and server message IDs.

Test attachment display and actual byte retrieval; an upload 201 alone is not a media PASS. Check MIME, authorization, and expiry where safely feasible.

Test current durable pending-message behavior: controlled uncertain send, application process termination, restart, account-scoped recovery, reconciliation, and duplicate prevention. Use existing supported idempotency and a safe external fault-injection method only in the isolated test setup. Do not modify transport code or suppress real Backend behavior.

Do not claim a lost-response test was performed unless evidence establishes that Backend committed before the client missed the response.

If no safe source-unchanged fault setup exists, mark that specific scenario blocked/unverified rather than faking it.

### 6.8. Reviews and moderation

Use a legitimate completed Order from a supported journey. Test create/edit/delete review and Admin moderation according to the current API and UI.

Check eligibility, ownership, state constraints, visibility, and same-record synchronization across clients.

Do not insert a completed Order or Review directly into SQL. A missing discovery/queue screen is a client/contract gap, not proof that a single detail endpoint is broken.

### 6.9. Cake AI and selected-design handoff

Test existing job submission, listing, details, asynchronous progress, valid cancellation, prompt revision, design retrieval, authorized moderation, and RFQ design selection when supported.

Record actual execution mode for every job: real external provider, local fallback, unavailable, or unknown. Distinguish HTTP acceptance, job completion, artifact storage, and actual image retrieval.

Do not claim real AI generation from Java2D/static fallback. Do not call an approved design a tested PENDING-moderation workflow. If no legitimate PENDING design can be produced, report the moderation test as blocked.

For restart persistence, verify both metadata and image bytes. A database row surviving while its image returns 404 is not persistence success.

### 6.10. Other discovered functions and Admin screens

Cover all additional implemented, in-scope UI functions discovered in the matrix. Check legitimate metrics, lists, filters, and authorized actions against Backend data.

Do not invent Admin Users, revenue settlement, refunds, staff invitations, notifications, or finance operations where the product does not implement them. Record visible unsupported controls and misleading demo success as findings.

---

## 7. REQUIRED A-TO-Z JOURNEYS AND CROSS-CLIENT VERIFICATION

Build complete journeys before execution. Use the actual business state machine, not an assumed commercial flow.

### Journey A — Customer becomes Owner; another Customer sees the product

Registration → authentication → owner application → Admin review → Subscription prerequisites and legitimate approval → Owner activation/token refresh → bakery management → category/product/options/images → publication → independent Customer discovers the SAME product.

Verify the UI steps available on Web and Android separately, plus at least one cross-client continuation. Record any required ordering differences from current source.

### Journey B — Direct purchase, fulfillment, and Review

Customer selects a real product → supported Checkout/address → real Order → Owner sees the SAME Order → permitted fulfillment transitions → Customer sees final status → eligible Review → Admin moderation → resulting visibility.

Use one primary record chain for an A-to-Z demonstration, and separate records for cancel/conflict branches.

### Journey C — Bespoke RFQ, Offer, Chat, and Order

Customer creates RFQ and image → publishes → eligible Owner discovers → creates Offer → Customer compares → Customer/Owner communicate → legitimate acceptance with supported delivery data → real resulting Order → authorized processing → final state.

Verify Offer/Order linkage; do not swap in an unrelated Order when acceptance is blocked.

### Journey D — Subscription rejection, correction, approval, renewal

Owner requests plan → submits supported proof → Admin rejects with reason → Owner sees the decision → permitted correction/resubmission → approval → entitlement/period changes → renewal → correct scheduled period and historical price snapshot.

Test only actual supported branches. Do not simulate banking confirmation.

### Journey E — Chat restart/recovery and media

Create/open authorized conversation → send across clients → retrieve history → upload and view attachment → create a controlled uncertain-send situation → restart the test app → verify pending recovery and one server message → verify unrelated account cannot access it.

### Journey F — Cake AI to approved design/RFQ

Create legitimate request context → submit job → observe processing → verify generated artifact and mode → supported revision/cancellation on separate jobs → legitimate moderation where reachable → select an approved design for the SAME RFQ → retrieve from the other client.

Fallback-only success must be labeled and cannot satisfy a mandatory real-provider acceptance requirement.

### Journey G — Session, ownership, and restart regression

Exercise account switching, logout, invalid access, fresh authentication after role changes, browser reload, Mobile process restart, and safe selected-service restart on an isolated runtime where appropriate.

Prove persistence through real API reads and the other client; do not use retained widget state as evidence.

### Cross-client requirements

For each domain that both clients expose, test both directions where meaningful:

- Create/edit in Web, observe in Android.
- Create/edit in Android, observe in Web.
- One role acts on Web; another authorized role responds on Android.
- Repeat the inverse for critical workflows.

State whether refresh/polling/manual navigation is required. Do not demand realtime behavior where the contract provides polling only.

A Web PASS never automatically gives Android PASS, and vice versa.

---

## 8. EXECUTE TESTS WITHOUT CHANGING THE PRODUCT

### 8.1. External test harness

Author any new PowerShell, Python, JavaScript/TypeScript, or Android automation scripts under the ignored run's `tools/` directory.

Use a separate harness dependency environment there or in external scratch space. Do not install Playwright/Appium/test packages into the application's dependency manifests.

Prefer black-box UI interaction against the real running Web/Android apps. Existing supported tests may be run unchanged from an isolated working copy, with outputs redirected appropriately.

Do not add app-side selectors or patch Flutter widgets to facilitate automation. Use existing semantic labels, native accessibility, screenshots, or controlled manual interaction. If automation cannot operate a control, record manual verification or a tool limitation honestly.

Direct API tests supplement UI tests. They do not substitute for clicking the actual Web/Android action.

### 8.2. Assertions and result interpretation

Derive expected behavior from current contracts and business requirements. Check actual persisted state, ownership, status, and displayed content, not only response codes.

A valid unauthorized test may PASS with a 401/403/404. A required user action unexpectedly rejected is FAIL. Do not count expected rejection as happy-path API 2xx coverage.

Classify actual application behavior separately from test-harness failure. When correcting a mistaken test expectation, cite the source contract and preserve the earlier attempt.

Do not weaken assertions, force clicks past invalid state, accept any nonempty response, hide console errors, skip difficult tests, or treat timeouts as success.

Use bounded waits based on observed state and reasonable timeouts; avoid arbitrary long sleeps and indefinite polling.

### 8.3. Recovery and destructive boundaries

Do not run load/stress tests or intrusive security scans. Use bounded duplicate/idempotency checks on synthetic records only.

Do not inject faults into shared services, globally block the user's network, install systemwide proxy certificates, or alter trust stores. Scope any test-only transport failure to the isolated app/test runtime and restore it afterward.

Do not reset the entire system to fix one failed scenario. Keep initial failures, determine cause, continue independent tests, and perform only a bounded confirmation rerun when justified.

### 8.4. Existing automated suites

Where feasible, run relevant existing Backend, Web, and Flutter suites unchanged in isolated copies. Capture their results separately from live UI acceptance.

Do not claim comprehensive API correctness from unit/widget tests. Do not reuse historical counts as results of this run.

A failing existing suite remains a finding even if a visible UI journey passes. Explain whether it blocks mandatory acceptance or is a separately documented pre-existing test/tool issue.

### 8.5. Visual/UX review without edits

Evaluate current Web/Mobile branding, typography, data/date formatting, loading, empty/error states, keyboard behavior, touch targets, overflow, back navigation, role menus, and permission messages against the existing design references.

Test a representative desktop viewport, a small Web viewport if supported, and the actual Android viewport. Do not substitute responsive Web for native Android.

Record observed defects with screenshots and reproduction steps. Do not alter the design to fix them.

---

## 9. SCREENSHOT AND EVIDENCE REQUIREMENTS

Capture genuine screenshots from the real browser and Android Emulator during the acceptance campaign.

For each mandatory scenario, capture meaningful checkpoints:

- Initial actionable state and relevant role.
- Form/input context without exposed secrets.
- Submission/result or status transition.
- Persisted detail/list after refresh.
- Cross-role/client observation of the same resource.
- Meaningful validation, unauthorized, error, or blocked state.

Avoid hundreds of identical screenshots that add no evidence.

Use stable filenames such as:

`<SCENARIO_ID>__<STEP>__<PLATFORM>__<ROLE>__<RESULT>.png`

Record timestamp, client, role label, route/screen, related API operation, resource identifier, expected/observed outcome, and file checksum in the screenshot index.

Screenshots may be captured by browser automation and ADB. Preserve binary bytes when copying PNG output; do not use a text pipeline that corrupts images. Verify files can be decoded and inspect representative images visually.

Do not generate mockups, reconstruct screens, edit displayed statuses, or use unrelated old screenshots as current evidence.

Sensitive data must be excluded at capture time where possible. If redaction is necessary, create a disclosed sanitized copy without changing business content or hiding a failure. Do not distribute raw sensitive originals in the deliverable set.

A screenshot alone does not prove persistence. Pair it with sanitized network/state evidence. Conversely, HTTP logs alone do not prove the UI path was used.

Record evidence quality limitations. Do not claim an exact HTTP status from a Mobile screenshot if no transport/server evidence captured that response.

---

## 10. ACCEPTANCE GATE BEFORE FINAL WALKTHROUGH RECORDING

Complete the mandatory test matrix before recording official full-system walkthroughs.

### Full-system acceptance requires

- The reviewed source/runtime identity is known and stable.
- All mandatory current-scope business journeys pass.
- All implemented in-scope role functions are exercised on each applicable client.
- Cross-client data lineage and persistence checks pass.
- No in-scope application failure, unresolved required capability, or blocked mandatory test remains.
- Real Backend usage is demonstrated; no mock fallback masked failures.
- No unresolved critical/high-severity security, data-loss, or duplicate-transaction finding exists.
- Any lower-severity observation is disclosed and does not contradict a required acceptance criterion.
- Environment, privacy, and source-integrity checks pass.

Predefine mandatory versus optional checks before execution. Do not reclassify failures as optional to unlock video recording.

### If the gate passes

Set `TEST_ACCEPTANCE = FULL_PASS` and proceed to official recordings. This means the documented current local scope passed, not an unlimited production-readiness certification.

### If the gate does not pass

Set `TEST_ACCEPTANCE = PARTIAL_BLOCKED`, `FAILED`, or `BLOCKED_ENVIRONMENT`, as justified.

Continue all independent tests, capture failure evidence, and produce the final report. Do not edit code to achieve PASS.

**Do not produce or label an official “full system all flows passed” walkthrough when the gate has not passed.** Mark official recordings `NOT_STARTED_ACCEPTANCE_GATE_NOT_MET` and explain the exact blocking scenarios.

Short diagnostic recordings are allowed only when needed to document a failure and must be stored/labeled as diagnostic, not as the requested successful walkthrough. A recorder capability check on a neutral screen is not a successful product demo.

Do not silently substitute a partial success montage for the requested complete walkthrough.

---

## 11. RECORD COMPLETE WEB AND ANDROID WALKTHROUGHS AFTER PASS

### 11.1. Required final videos

After the gate passes, produce the complete combined walkthrough requested by the owner, plus separate platform masters for easier review:

```text
videos/final/SWEETCAKE_FULL_SYSTEM_WEB_MOBILE_A_TO_Z.mp4
videos/final/SWEETCAKE_WEB_ALL_ROLES_A_TO_Z.mp4
videos/final/SWEETCAKE_ANDROID_ALL_ROLES_A_TO_Z.mp4
```

The combined master must include the complete accepted role/function coverage of both platforms, not only a short highlight reel. Organize it into readable platform/role/domain chapters and show cross-client handoffs using matching resource IDs. The separate masters may reuse those same genuine recorded segments; do not repeat chargeable or irreversible business actions merely to produce another edit.

Preserve Web and phone aspect ratios without cropping important controls or stretching the image. Mark platform switches and separate takes clearly. Do not claim the edited master is one uninterrupted capture.

If a master cannot be produced or validated, record that as an incomplete video deliverable. Do not substitute a few clips and claim the full video requirement was met.

Provide per-role/domain chapters so each implemented function can be located without watching an entire long recording.

### 11.2. Storyboard and coverage

Prepare the storyboard from the accepted role/function matrix, not a marketing summary.

For every function specify its platform, role, scenario, prerequisites, action, expected visible result, and planned chapter. Every accepted UI function must appear in the corresponding platform recording or have a documented omission that prevents claiming complete video coverage.

Show meaningful interactions: open the screen, perform the action, show the result and refresh/persistence where relevant. Merely opening a menu does not demonstrate the function.

Record coherent A-to-Z record chains. Use fresh synthetic datasets for the recording where repeating completed/cancelled states would be invalid. Do not reset statuses via SQL or edit footage to pretend unrelated IDs are one journey.

### 11.3. Actual screen capture only

Record the real Web application in a browser and real Flutter application on the local Android Emulator.

Do not use slideshows, image-to-video generation, animated screenshots, staged fake screens, recreated UI, or prerecorded unrelated runs.

Keep visible state and network behavior unchanged. Do not inject demo data, speed up server states, or bypass user actions for recording.

Synthetic account names and visible role labels should make identity clear without displaying passwords or privileged credentials.

### 11.4. Web recording

Use available browser recording or desktop window capture. With Playwright, configure recording for all successful storyboard chapters, not only retained-on-failure videos. Close/flush browser contexts correctly to finalize video files.

Keep the viewport/text readable. Capture modal, dialog, popup, and new-tab behavior where needed; a main-page-only recording must not silently omit a popup-based workflow.

If an OS file picker cannot be captured by the browser recorder, disclose the boundary and show the actual selected file plus real upload result. Prefer native window recording where necessary for complete evidence.

Do not claim Playwright recorded browser chrome or the desktop when it recorded only the page viewport.

### 11.5. Android recording

Use the installed Android Emulator/ADB recording capabilities or an appropriate existing screen-capture tool such as scrcpy or equivalent.

Inspect actual tool versions and `screenrecord --help` before recording. Some documented/platform versions have short duration limits; do not assume a long recording request will capture the full story.

If needed, record chapters within supported limits, pull files safely, verify each segment, and assemble them transparently. Track any gaps or resets. Do not claim an uninterrupted recording if it consists of separate takes.

Use stable orientation and legible resolution; test rotation separately rather than corrupting an entire recording. Do not wipe the emulator or delete unrelated screen recordings.

### 11.6. Production of the evidence video, not the product

Adding chapter labels, role captions, disclosed pauses, privacy redaction, and a table of contents to the delivered video is allowed. Changing the underlying UI, displayed values, outcomes, or chronology to conceal failure is forbidden.

Real-time playback is the default. Disclose accelerated idle periods and preserve original segments. Do not cut out errors to make a failed run appear clean. If a recording reveals a new real failure, invalidate the affected acceptance, preserve evidence, and stop claiming FULL_PASS.

Voiceover/music are not required. Do not synthesize narration claiming results absent from evidence.

### 11.7. Validate each video

Before delivery:

- Confirm the file exists, is nonzero, and is finalized.
- Verify codec/container, dimensions, frame rate, duration, and stream integrity.
- Decode/check representative beginning, middle, end, and chapter-boundary frames.
- Confirm no long black/frozen sections or missing final actions.
- Check text readability, actual role switches, actions, results, and privacy.
- Confirm every claimed function has a timestamp entry.
- Record checksums and segment origins.

Use `ffprobe`/`ffmpeg` or equivalent available tools. Do not rename a WebM file to `.mp4`; transcode/container-convert correctly when needed.

If recording tools, storage, or capture permissions prevent completion, report `VIDEO_BLOCKED` separately from test acceptance. Passing tests does not mean video delivery succeeded.

---

## 12. METRICS, STATUS TAXONOMY, AND EVIDENCE RECONCILIATION

### Test-case statuses

- `PASS`: the actual expected outcome was observed with evidence.
- `FAIL_APPLICATION`: actual product behavior violated the validated expectation.
- `FAIL_NOT_LIVE`: a purported live flow used fixtures or fake success.
- `BLOCKED_BACKEND`: missing/failed Backend capability prevents execution.
- `BLOCKED_FRONTEND`: current Web implementation prevents the journey.
- `BLOCKED_MOBILE`: current Android implementation prevents the journey.
- `BLOCKED_ENVIRONMENT`: tooling/runtime/network prevents meaningful testing.
- `BLOCKED_EXTERNAL_SERVICE`: required authorized external capability unavailable.
- `HARNESS_ERROR`: a test/recording tool failed; not automatically a product defect.
- `NOT_RUN`: planned but not executed, with reason.
- `NOT_APPLICABLE`: justified by the verified product scope, not used to conceal a missing expected feature.

Retain each attempt and its final classification. Distinguish a justified rerun from an unexplained flaky test.

### Required separate totals

Report separately:

- Discovered functions by role and platform.
- In-scope user-facing Backend operations.
- Backend preflight calls versus Web UI operations versus Android UI operations.
- Operations with observed 2xx and correct business results.
- Expected negative cases passed.
- Complete E2E journeys passed, partial, failed, blocked, and not run.
- Existing unit/widget/integration suites and their own denominators.
- Screenshot count by platform, including failure captures.
- Video chapter/function coverage and validated duration.
- External-provider mode and verified operations.

Never add overlapping suite counts into a misleading grand total.

Use both execution coverage and pass rate. For example:

- Execution coverage = executed mandatory cases / planned mandatory cases.
- Pass rate = passed cases / executed cases with a product verdict.
- Full journey acceptance = all required steps and postconditions passed for the same resource lineage.

Show blocked/not-run counts next to percentages. A 100% pass rate on a small executed subset is not full acceptance.

---

## 13. ONE DETAILED VIETNAMESE FINAL REPORT

Create:

`docs/mobile/runs/<RUN_ID>/BAKERY_PLATFORM_WEB_MOBILE_FULL_E2E_REPORT_VI.md`

All explanatory prose must be in professional Vietnamese. Preserve technical identifiers, paths, commands, HTTP fields, and code as appropriate.

The report must be understandable independently of raw logs and contain these sections:

1. Executive conclusion: test acceptance, video-delivery status, and scope limitations.
2. Mission scope and strict no-source-change boundary.
3. Actual timestamp/timezone, source revision, dirty-worktree provenance, and tested builds.
4. Environment: Docker, services, profiles, database/storage/provider modes, browser, Flutter, Android AVD, and network paths.
5. Canonical commands actually executed, with working directories and readiness checks. Do not update application README files.
6. Full role/function/platform inventory.
7. Current API mapping and separate Backend/Web/Android coverage.
8. Test identities, fixture policy, and sanitized resource-lineage explanation.
9. Guest and Customer results.
10. Owner results.
11. Admin results and any other discovered human roles.
12. Each A-to-Z journey, step-by-step, using actual records and cross-client observations.
13. Authentication, permissions, ownership, idempotency, and state-transition results.
14. Upload/download/storage URL, expiry, MIME, and checksum results.
15. Chat pending recovery, app restart, persistence, and account isolation.
16. Cake AI: provider/fallback distinction and artifact/moderation verification.
17. Visual/navigation/accessibility observations without remediation.
18. Existing automated suite results versus real UI acceptance results.
19. Web screenshots and Android screenshots, linked by scenario.
20. Recording gate decision and reasons.
21. Validated Web/Android video files, chapters, and timestamps, or explicit reasons recordings were not made.
22. Defects and blockers: steps, expected/actual behavior, responsible layer, severity, evidence, and recommended future fix. Do not implement fixes.
23. Harness/environment mistakes and rerun history, separately from application defects.
24. Unexecuted/blocked work and impact on completeness.
25. Source integrity and allowed output changes, including root `.gitignore` before/after scope.
26. Git-ignore verification and any historical tracked artifacts requiring a separate owner decision.
27. Privacy/secret checks, retained synthetic records, test-owned cleanup, and runtime handoff state.
28. Prioritized future actions and the conditions needed for another full acceptance campaign.
29. Final verdict without unsupported production-readiness claims.

Include a video timestamp table:

| Video | Start–End | Platform | Role | Function/journey | Resource chain | Evidence | Result |
|---|---|---|---|---|---|---|---|

Include a defect table:

| ID | Severity | Platform/layer | Reproduction | Expected | Actual | Evidence | Suggested future fix |
|---|---|---|---|---|---|---|---|

Provide relative clickable links and concise sanitized evidence excerpts so the owner does not need to open every raw JSON file.

State clearly that ignored reports remain local and will not be delivered to teammates through a normal Git commit unless the owner later changes that policy.

---

## 14. FINAL INTEGRITY, PRIVACY, AND HANDOFF CHECKS

Before finishing:

1. Compare the source/file baseline against the final state.
2. Confirm original Backend, Web, Mobile, configs, skills, secrets, tests, and README files are unchanged.
3. Confirm only `docs/mobile/` outputs and the narrowly authorized root `.gitignore` edit were added/changed by this task.
4. Confirm no staged changes, commits, pushes, or index manipulations were introduced.
5. Recheck ignore behavior for every new deliverable category and confirm no run artifact is tracked.
6. Review report/logs/screenshots/videos for tokens, passwords, cookies, service-account keys, signed URL queries, and real personal data.
7. Do not retain plaintext authentication state, unrestricted HAR dumps, or secret-bearing traces merely because the folder is ignored. Sanitize or omit them.
8. Validate file readability, JSON indexes, report links, screenshot decoding, and recorded-video integrity.
9. Record synthetic data left behind and clean up only test-owned resources when safe and permitted.
10. Restore transient test-only network mappings/settings where appropriate; leave the owner's original infrastructure intact and state exactly what remains running.

If an accidental unauthorized write occurred, disclose it and stop the offending tool. Do not pretend it never happened or silently revert unrelated user changes.

If full acceptance passed and all required videos are validated, finish and stop. Do not start implementing improvements discovered during testing.

If failures remain, finish the independent tests and report them; do not enter a repair loop because code changes are prohibited.

---

## 15. EXECUTION ORDER

1. Read this entire prompt and relevant project instructions.
2. Record baseline and protected source state.
3. Configure the precise root ignore rule and verify a fresh ignored run path.
4. Read current contracts/screens and build the role/function/API/journey matrix.
5. Discover and safely prepare the local Docker, Web, and Android runtime.
6. Verify same-dataset connectivity and actual live-data mode.
7. Prepare authorized synthetic accounts and traceable fixtures.
8. Execute all independent Web role/function tests with screenshots.
9. Execute all independent Android role/function tests with screenshots.
10. Complete cross-client A-to-Z journeys, permissions, error/recovery, and persistence checks.
11. Run relevant existing suites unchanged where feasible; classify their evidence separately.
12. Reconcile results and evaluate the mandatory acceptance gate.
13. Only if the gate passes, record all-role/function Web and Android walkthroughs and cross-platform handoffs.
14. Validate video completeness, timing, privacy, and playback.
15. Generate the single detailed Vietnamese report and structured indexes.
16. Verify source integrity, Git-ignore coverage, secrets, artifact paths, and runtime handoff.
17. Provide a final Vietnamese summary and exact file paths.

Do not stop after a planning document, a Backend smoke test, one role, or one client. Complete every safely feasible independent check. Do not ask the user to repeat information already available from the repository. Missing credentials, authorization, or capabilities are evidence-backed blockers, not excuses to fabricate results.

---

## 16. FINAL RESPONSE TO THE OWNER

Respond in Vietnamese and include:

- Overall test acceptance and video-delivery status, separately.
- Tested source/builds and actual environment.
- Roles, functions, and journeys exercised on Web and Android.
- Exact Web/Android API coverage with denominators.
- Passed, failed, blocked, and not-run counts.
- Main real defects and outstanding dependencies.
- Screenshot counts and paths.
- Final video names/durations and timestamp-index location, or the gate/tool reason they do not exist.
- Full path to the single final report under `H:\MSS\Bakery-Platform\docs\mobile\runs\<RUN_ID>\`.
- Exact `.gitignore` change and ignore verification result.
- Any already-tracked historical artifacts that remain tracked.
- Confirmation of source integrity and no stage/commit/push.

Do not claim that the system is fully working merely because the test harness exited successfully. Do not claim files were created unless their exact paths exist and have been verified.

---

## 17. OFFICIAL TOOL REFERENCES FOR THE EXECUTING AGENT

Check installed versions and their official documentation before relying on tool flags. These references explain tool behavior, not the Bakery Platform's current condition:

- Git ignore semantics: https://git-scm.com/docs/gitignore
- Git ignore verification: https://git-scm.com/docs/git-check-ignore
- Android ADB screenshots/recording/device controls: https://developer.android.com/tools/adb
- Playwright browser recording and finalization: https://playwright.dev/docs/videos
- Flutter integration testing: https://docs.flutter.dev/testing/integration-tests

Do not follow tutorial steps that modify application source; this prompt's read-only boundary takes precedence. Use the existing supported application/test facilities or external black-box tooling.

## FINAL INSTRUCTION

**Test the actual Bakery Platform Web Frontend and native Flutter Android application against the real Backend through every currently supported role, function, and complete business journey. Capture genuine screenshots. Only after complete mandatory acceptance passes, record and validate full Web and Android walkthroughs.**

**Do not fix or change any application source, dependency, configuration, or existing test. The only allowed project changes are local testing deliverables under `docs/mobile/` and the minimal root `.gitignore` rule for that directory.**

**Use current evidence rather than historical PASS claims. Report all incomplete, failed, blocked, and unsupported workflows accurately. Place every new test script, evidence file, video, and the final Vietnamese report under the specified ignored output path.**

**Begin execution in `H:\MSS\Bakery-Platform` and continue through the complete test-only campaign, acceptance decision, eligible recordings, and final report.**
