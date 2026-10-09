import js from "@eslint/js";
import globals from "globals";

// Stage adoption: recommended checks warn; only these three rules block CI.
const rules = Object.fromEntries(
  Object.keys(js.configs.recommended.rules).map((name) => [name, "warn"]),
);
Object.assign(rules, {
  "no-undef": "error",
  "no-unused-vars": "error",
  "no-redeclare": "error",
});

export default [
  { ignores: ["node_modules/**", "tests/artifacts/**"] },
  {
    files: ["src/**/*.{js,mjs}", "tests/**/*.{cjs,mjs}", "scripts/**/*.cjs", "eslint.config.mjs"],
    languageOptions: { ecmaVersion: "latest" },
    rules,
  },
  { files: ["src/**/*.{js,mjs}"], languageOptions: { globals: globals.browser } },
  {
    files: ["tests/**/*.{cjs,mjs}"],
    languageOptions: { globals: { ...globals.node, ...globals.browser } },
  },
  {
    files: ["scripts/**/*.cjs", "eslint.config.mjs"],
    languageOptions: { globals: globals.node },
  },
];
