import globals from "globals";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import importPlugin from "eslint-plugin-import";
import { defineConfig, globalIgnores } from "eslint/config";

export default defineConfig([
  globalIgnores(["dist/", "node_modules/", "js/"]),
  {
    plugins: {
      import: importPlugin,
      "@typescript-eslint": tsPlugin,
    },
    rules: {
      // General JavaScript rules
      semi: ["error", "always"],
      quotes: ["error", "double"],
      indent: [
        "error",
        2,
        {
          SwitchCase: 1,
          VariableDeclarator: 1,
          outerIIFEBody: 1,
          MemberExpression: 1,
          FunctionDeclaration: { parameters: 1, body: 1 },
          FunctionExpression: { parameters: 1, body: 1 },
        },
      ],
      "no-undef": "warn",
      "no-unused-vars": "off", // Handled by TypeScript
      "no-console": "off",

      // TypeScript-specific rules
      "@typescript-eslint/no-explicit-any": "warn", // Discourage `any` usage
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          vars: "all",
          args: "after-used",
          ignoreRestSiblings: true,
          argsIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/strict-boolean-expressions": "off", // Enforce strict boolean expressions
      "@typescript-eslint/consistent-type-definitions": ["error", "interface"], // Prefer `interface` over `type`

      // Import rules
      "import/no-cycle": "error",
      "import/order": [
        "error",
        {
          groups: ["builtin", "external", "internal"],
          "newlines-between": "always",
        },
      ],
    },
  },
  {
    files: ["**/*.ts", "**/*.tsx", "**/*.js"],
    languageOptions: {
      globals: { ...globals.browser, "BlobPart": "readonly", "EventListener": "readonly" },
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: "module",
        // add project only if you want type-aware rules; remove if you don't
        // project: ["./tsconfig.json"],
        // tsconfigRootDir: __dirname,
      },
    },
  },
  // tseslint.configs.recommended,
]);
