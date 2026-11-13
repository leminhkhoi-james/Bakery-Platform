# SweetCake Web — native local

From the repository root, install the locked dependency tree with `npm ci --prefix frontend`.
Run `python scripts/native_clients.py web-start --state-dir docs/mobile/runs/<RUN_ID>/evidence/native-clients`.
The native launcher reads root `.env` only, passes an explicit public Vite allowlist,
and proxies every `/api/v1` request to the native Gateway on port 8080.
Mock fallback, business simulation and demo empty data must all be false.
Backend credentials are never exported to Node or client bundles.

Use `npm test --prefix frontend -- --test-concurrency=1`, `npm run lint --prefix frontend`,
and `python scripts/native_clients.py web-build --state-dir docs/mobile/runs/<RUN_ID>/evidence/native-clients`
for the native verification path. The lockfile supports a clean install including browser tests.
Browser tests use an installed Edge browser; suite assertions and live UI verification
are separate evidence. See `../mobile/README.md` for the shared native runtime.

## Vite tooling

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and Oxlint's TypeScript related rules in your project.
