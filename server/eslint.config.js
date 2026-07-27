import js from "@eslint/js";
import tsParser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";

const nodeGlobals = {
  clearInterval: "readonly",
  clearTimeout: "readonly",
  console: "readonly",
  process: "readonly",
  setInterval: "readonly",
  setTimeout: "readonly",
};

const mochaGlobals = {
  after: "readonly",
  afterEach: "readonly",
  before: "readonly",
  beforeEach: "readonly",
  describe: "readonly",
  it: "readonly",
};

export default [
  {
    ignores: ["dist", "artifacts", "cache", "**/node_modules/", ".git/"],
  },
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
      },
      globals: {
        ...nodeGlobals,
        ...mochaGlobals,
      },
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...tsPlugin.configs.recommended.rules,
    },
  },
];
