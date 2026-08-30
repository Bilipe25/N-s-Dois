import tseslint from "typescript-eslint";
import globals from "globals";

export default [
  { ignores: ["build/**", ".react-router/**", "node_modules/**", "supabase/.temp/**", ".impeccable/**"] },
  {
    files: ["app/**/*.{ts,tsx}", "*.{ts,js}"],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: { ecmaVersion: "latest", sourceType: "module" },
      globals: { ...globals.browser, ...globals.node },
    },
    rules: {
      "no-debugger": "error",
      "no-eval": "error",
      "no-implied-eval": "error",
      "no-with": "error",
    },
  },
];
