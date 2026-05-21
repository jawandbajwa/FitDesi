// ESLint flat config (ESLint 9+).
// FitDesi is a vanilla-JS static PWA — no build step, no framework.
// This config catches obvious bugs (undefined vars, unused vars, etc.)
// without being overly opinionated. Run via:  npx eslint .
// Or via the Lint workflow on every PR.

import js from "@eslint/js";
import globals from "globals";

export default [
  js.configs.recommended,
  {
    files: ["**/*.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.serviceworker,
        // App globals exposed across files
        Chart: "readonly",
        firebase: "readonly",
      },
    },
    rules: {
      // Allowed: console.log/warn/error (used for debugging in a hobby project)
      "no-console": "off",
      // Catch unused vars but allow _-prefixed args (convention for "I know, on purpose")
      "no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_", caughtErrorsIgnorePattern: "^_" },
      ],
      // Empty catch blocks are fine if the error doesn't matter
      "no-empty": ["error", { allowEmptyCatch: true }],
      // Allow `==` when intentional (we use it for null/undefined checks)
      eqeqeq: ["warn", "smart"],
      // Useless catches are noise
      "no-useless-catch": "warn",
      // Prefer const for never-reassigned bindings
      "prefer-const": "warn",
    },
  },
  {
    // Service worker has different globals
    files: ["sw.js"],
    languageOptions: {
      globals: {
        ...globals.serviceworker,
      },
    },
    rules: {
      "no-restricted-globals": "off",
    },
  },
  {
    // Ignore vendor data + 3rd-party files
    ignores: [
      "node_modules/**",
      ".claude/**",
      "ingredients.js",
      "ingredients_canada.js",
      "recipes_canada.js",
      "coach-config.js",
      "bump-version.js",
    ],
  },
];
