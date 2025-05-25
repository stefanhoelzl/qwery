import { fileURLToPath } from "node:url";
import { URL } from "url";
import prettier from "eslint-plugin-prettier/recommended";
import js from "@eslint/js";
import { includeIgnoreFile } from "@eslint/compat";
import svelte from "eslint-plugin-svelte";
import ts from "typescript-eslint";
import globals from "globals";
import json from "eslint-plugin-json";

const gitignorePath = fileURLToPath(new URL(".gitignore", import.meta.url));

export default ts.config(
  includeIgnoreFile(gitignorePath),
  js.configs.recommended,
  json.configs.recommended,
  ...ts.configs.recommended,
  ...svelte.configs.recommended,
  ...svelte.configs.prettier,
  prettier,
  {
    files: ["**/*.json"],
    plugins: { json },
    processor: "json/json",
    rules: {
      "json/*": ["error", { allowComments: true }]
    }
  },
  {
    files: ["**/*.svelte", "**/*.svelte.ts"],
    languageOptions: {
      parserOptions: {
        projectService: true,
        extraFileExtensions: [".svelte"],
        parser: ts.parser
      }
    }
  },
  {
    files: ["packages/dashboard/**/*"],
    languageOptions: {
      globals: {
        ...globals.browser
      }
    }
  }
);
