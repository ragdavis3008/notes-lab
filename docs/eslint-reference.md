# ESLint with Next.js — reference

- Source: https://nextjs.org/docs/app/api-reference/config/eslint
- Page last updated (per the page): 2026-10-05
- Date copied: 2026-10-15

## Ignoring build output (flat config)

The docs show `eslint.config.mjs` with `globalIgnores`, listing the default
ignores of `eslint-config-next`:

```js
import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'

const eslintConfig = defineConfig([
  ...nextVitals,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
  ]),
])

export default eslintConfig
```

Run the linter with the ESLint CLI: `npx eslint .` (`next lint` was removed in
Next.js 16).

## How this project differs from the example

- This project's config still uses `FlatCompat` with `next/core-web-vitals` and
  `next/typescript` (eslint-config-next 15.3.1), not the new
  `eslint-config-next/core-web-vitals` imports shown above. Only the ignore
  list is taken from the docs.
- `node_modules/**` is also ignored by ESLint by default; it is listed
  explicitly here so the intent is visible.
- `globalIgnores` and `defineConfig` come from `eslint/config`, available in the
  installed ESLint 9.39.5. It needs ESLint 9.22 or newer; `package.json` only says
  `^9`, and the lockfile pins 9.39.5.
