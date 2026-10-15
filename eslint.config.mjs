import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";
import { globalIgnores } from "eslint/config";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  // Build output and dependencies are not our source (see docs/eslint-reference.md).
  globalIgnores([".next/**", "node_modules/**", "out/**", "build/**", "next-env.d.ts"]),
];

export default eslintConfig;
