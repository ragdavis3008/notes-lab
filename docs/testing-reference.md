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
"test": "vitest"
```

`npm run test` watches for changes. `npx vitest run` runs the tests once.

## Limitation

Vitest does not support async Server Components. Unit-test plain functions
and synchronous components; async pages need end-to-end tests instead.

## How this project tests

- Unit tests for pure functions first (no database): search-text cleaning,
  URL helpers, ID and colour checks.
- Tests never call Supabase or change real data.
- TDD for new behaviour: write a failing test first (red), write just enough
  code to pass (green), then tidy up with the tests still passing (refactor).