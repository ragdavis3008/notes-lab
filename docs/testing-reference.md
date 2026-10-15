# Testing reference — Vitest with Next.js

- Source: https://nextjs.org/docs/app/guides/testing/vitest
- Date copied: 2026-10-15

## Install (manual setup, TypeScript)

```bash
npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/dom vite-tsconfig-paths
```

## Config file: vitest.config.mts (project root)

```ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: 'jsdom',
  },
})
```

## Script in package.json

```json
"test": "vitest",
"test:run": "vitest run"
```

`npm run test` watches for changes. `npm run test:run` (same as
`npx vitest run`) runs the tests once and exits, so use it in scripts and
before committing.

## Version note: @types/node ^22

`@types/node` was bumped from `^20` to `^22` because Vitest 5 needs it. Vitest
5.0.4 declares the peer range `@types/node ^22.0.0 || >=24.0.0` (and Vite 8
needs `^20.19.0 || >=22.12.0`), so `^20` caused an npm ERESOLVE peer conflict
on install. The installed version is 22.20.5.

## Limitation

Vitest does not support async Server Components. Unit-test plain functions
and synchronous components; async pages need end-to-end tests instead.

## How this project tests

- Unit tests for pure functions first (no database): search-text cleaning,
  URL helpers, ID and colour checks.
- Tests never call Supabase or change real data.
- The first tests (search text, URL helpers, ID and colour checks) were written
  after the code existed, to lock in current behaviour. They were not test-first.
- New behaviour uses the `tdd` skill: agree the seams first, then one failing
  test (red), then just enough code to pass (green), one slice at a time.
- Refactoring is not part of that loop. Tidy up afterwards, as part of review,
  with the tests still passing.
