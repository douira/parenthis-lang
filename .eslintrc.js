module.exports = {
  root: true,
  env: {
    browser: false,
    node: true
  },
  parser: "@typescript-eslint/parser",
  parserOptions: {
    tsconfigRootDir: __dirname,
    project: "./tsconfig.eslint.json"
  },
  plugins: ["sonarjs", "@typescript-eslint"],
  extends: [
    "plugin:sonarjs/recommended",
    "plugin:import/recommended",
    "plugin:jest/recommended",
    "plugin:promise/recommended",
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:@typescript-eslint/recommended-requiring-type-checking",
    "prettier"
  ],
  rules: {
    //basic rules
    "no-console": process.env.NODE_ENV === "production" ? "error" : "off",
    "no-debugger": process.env.NODE_ENV === "production" ? "error" : "off",
    "no-constant-condition": ["error", { checkLoops: false }],
    "import/no-unresolved": "off",
    "promise/catch-or-return": "off",
    "promise/always-return": "off",
    "no-var": "error",
    "sonarjs/cognitive-complexity": "off",
    "sonarjs/no-duplicate-string": "off",
    radix: "error",
    "max-len": [
      "error",
      //code: Infinity since prettier already takes care of this
      { code: Infinity, comments: 100, ignorePattern: "TODO|DEBUG|INFO" }
    ],
    "no-implicit-globals": "error",
    eqeqeq: ["error", "smart"],

    //"@typescript-eslint/explicit-member-accessibility": "error"

    //turn off rules that have better typescript versions
    "no-shadow": "off",
    "no-unused-vars": "off",
    "require-await": "off",

    "@typescript-eslint/no-shadow": "warn",
    "@typescript-eslint/no-unused-vars": [
      "error",
      {
        vars: "all",
        args: "after-used",
        ignoreRestSiblings: false,
        varsIgnorePattern: "^_",
        argsIgnorePattern: "^_"
      }
    ],
    "@typescript-eslint/no-use-before-define": [
      "error",
      {
        functions: true,
        classes: true,
        variables: false,
        enums: true,
        typedefs: true
      }
    ],
    "@typescript-eslint/no-var-requires": "error",
    "@typescript-eslint/explicit-function-return-type": "off",
    "@typescript-eslint/explicit-module-boundary-types": "error",
    "@typescript-eslint/array-type": "error",
    "@typescript-eslint/method-signature-style": "error",
    "@typescript-eslint/prefer-for-of": "error",
    "@typescript-eslint/prefer-optional-chain": "error",
    "@typescript-eslint/prefer-ts-expect-error": "error",
    "@typescript-eslint/class-literal-property-style": "error",
    "@typescript-eslint/unified-signatures": "error",
    "@typescript-eslint/no-invalid-void-type": "error",
    "@typescript-eslint/no-extraneous-class": "error",
    "@typescript-eslint/no-floating-promises": "warn",
    "@typescript-eslint/require-await": "error",
    "@typescript-eslint/no-base-to-string": "error",
    "@typescript-eslint/no-throw-literal": "error",
    "@typescript-eslint/no-unnecessary-boolean-literal-compare": "error",
    "@typescript-eslint/no-unnecessary-qualifier": "error",
    "@typescript-eslint/no-unnecessary-type-arguments": "warn",
    "@typescript-eslint/prefer-includes": "error",
    "@typescript-eslint/prefer-nullish-coalescing": "off",
    "@typescript-eslint/prefer-readonly": "warn",
    "@typescript-eslint/prefer-reduce-type-parameter": "error",
    "@typescript-eslint/prefer-string-starts-ends-with": "error",
    "@typescript-eslint/promise-function-async": "error",
    "@typescript-eslint/require-array-sort-compare": "warn",
    "@typescript-eslint/switch-exhaustiveness-check": "warn",
    "@typescript-eslint/unbound-method": "warn",
    "@typescript-eslint/strict-boolean-expressions": [
      "error",
      {
        allowNullableString: true
      }
    ],
    "@typescript-eslint/no-non-null-assertion": "error",
    "@typescript-eslint/no-unnecessary-condition": "error",
    "@typescript-eslint/no-unsafe-member-access": "error",
    "@typescript-eslint/restrict-template-expressions": [
      "error",
      {
        allowNumber: true,
        allowBoolean: true,
        allowNullish: true
      }
    ],
    "@typescript-eslint/consistent-indexed-object-style": "warn"
  }
}
