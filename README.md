# SeeK-path web

Materials Cloud tool that finds the high-symmetry k-path of a crystal
structure and shows it in the Brillouin zone, using
[matsci-parse](https://www.npmjs.com/package/matsci-parse) in the browser.

## Development

```sh
pnpm install
pnpm dev     # http://localhost:5173
pnpm build   # static site in dist/
pnpm lint
```

## Share links

Share links are stored on the Materials Cloud kv-store at `VITE_KV_URL`.
`pnpm dev` uses the dev store (`.env.development`); builds use the
production store. The deployed origin must be on the store's allow-list.
