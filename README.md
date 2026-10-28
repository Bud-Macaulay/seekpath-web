# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and Oxlint's TypeScript related rules in your project.

## Share links

The Share button uploads the loaded structure to the Materials Cloud
kv-store and gives a `?<id>` link, which opens it in any app using the same
store. Links expire after 30 days.

The store is `KV_URL` at the top of `src/App.jsx`, read from `VITE_KV_URL`:
`.env.development` points `pnpm dev` at the dev store, and builds use
mc-react-library's default, the production store. The store only accepts
allow-listed origins: `localhost:5173` works with the dev store, and the
deployed origin must be added before sharing works there.
