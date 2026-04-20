import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import globals from "globals";

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/consistent-type-imports": "error",
      "no-console": ["warn", { allow: ["warn", "error"] }],
      eqeqeq: ["error", "always"],
      "no-throw-literal": "error",
      "prefer-const": "error",
    },
  },
  {
    ignores: [
      "**/node_modules/",
      "**/lib/",
      "**/dist/",
      "**/*.js",
      "**/*.cjs",
      "**/*.mjs",
      ".agents/",
      "patches/",
    ],
  }
);
