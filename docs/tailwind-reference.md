# Tailwind CSS v3 plugins — reference

- Source: https://v3.tailwindcss.com/docs/plugins (page shows v3.4.17)
- Project version: tailwindcss ^3.4.1 (config in `tailwind.config.ts`)
- Date copied: 2026-10-15

## Registering a plugin

The v3 docs show the CommonJS form and have no TypeScript example:

```js
const plugin = require('tailwindcss/plugin')

module.exports = {
  plugins: [
    plugin(function({ addUtilities, addComponents, e, config }) {
      // Add your custom styles here
    }),
  ]
}
```

The only typing hint on the page is `/** @type {import('tailwindcss').Config} */`.

## How this project registers `tailwindcss-animate`

The docs do not show an ES `import` form. In `tailwind.config.ts` (an ES module
using `satisfies Config`) the plugin is imported with a standard default import
instead of `require()`, which ESLint reports as `no-require-imports`:

```ts
import animate from "tailwindcss-animate";
// ...
plugins: [animate],
```

`tailwindcss-animate` 1.0.7 ships `index.d.ts`, so the import is typed. This is
the project's own adaptation, verified with `npm run build`, not a quote from
the Tailwind docs.
