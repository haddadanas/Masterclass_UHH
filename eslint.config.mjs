import typescriptEslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import path from "node:path";
import { fileURLToPath } from "node:url";
import importPlugin from "eslint-plugin-import";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default [{
    languageOptions: {
        globals: {
            window: "readonly",
            document: "readonly",
            console: "readonly",
            alert: "readonly",
            navigator: "readonly",
            localStorage: "readonly",
            location: "readonly",
            setTimeout: "readonly",
            requestAnimationFrame: "readonly",
            fetch: "readonly",
        },
        parser: tsParser,
        ecmaVersion: 2022, // Use the latest ECMAScript version
        sourceType: "module", // Enable ES module support

        parserOptions: {
            // Remove 'project' to avoid parsing errors for non-TypeScript files like this config
            project: ["./tsconfig.json"],
            exclude: ["eslint.config.mjs"],
        },
    },
    plugins: {
        "@typescript-eslint": typescriptEslint,
        "import": importPlugin,
    },
    rules: {
        // General JavaScript rules
        semi: ["error", "always"],
        quotes: ["error", "double"],
        indent: ["error", 2, {
            SwitchCase: 1,
            VariableDeclarator: 1,
            outerIIFEBody: 1,
            MemberExpression: 1,
            FunctionDeclaration: { parameters: 1, body: 1 },
            FunctionExpression: { parameters: 1, body: 1 },
        }],
        "no-undef": "warn",
        "no-unused-vars": "off", // Handled by TypeScript
        "no-console": "off",

        // TypeScript-specific rules
        "@typescript-eslint/no-explicit-any": "warn", // Discourage `any` usage
        "@typescript-eslint/no-unused-vars": ["warn", {
            vars: "all",
            args: "after-used",
            ignoreRestSiblings: true,
            argsIgnorePattern: "^_",
        }],
        "@typescript-eslint/strict-boolean-expressions": "off", // Enforce strict boolean expressions
        "@typescript-eslint/consistent-type-definitions": ["error", "interface"], // Prefer `interface` over `type`

        // Import rules
        "import/no-cycle": "error",
        "import/order": ["error", {
            "groups": ["builtin", "external", "internal"],
            "newlines-between": "always",
        }],
    },
}];