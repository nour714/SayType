import globals from 'globals';

// Baseline for the whole repo: nothing exotic or opinionated beyond these six.
const baselineRules = {
  // caughtErrors:'none' — an unused `catch (e)` binding is idiomatic, not a smell.
  'no-unused-vars': [
    'error',
    { args: 'after-used', caughtErrors: 'none', ignoreRestSiblings: true }
  ],
  'no-undef': 'error',
  eqeqeq: ['error', 'always'],
  'no-var': 'error',
  'prefer-const': 'error',
  'consistent-return': 'error'
};

export default [
  {
    ignores: ['node_modules/**', 'coverage/**']
  },
  {
    // Browser UI + services: the project genuinely uses ES modules here.
    files: ['client/js/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: { ...globals.browser, ...globals.es2022 }
    },
    rules: baselineRules
  },
  {
    // Server + server tests: genuine CommonJS.
    files: ['server/**/*.js', 'tests/server.test.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'commonjs',
      globals: { ...globals.node, ...globals.es2022 }
    },
    rules: baselineRules
  },
  {
    // Client test suite: ES modules running under Node with a stubbed `window`.
    // These files are the pinned behavior oracle for refactor work and must stay
    // byte-identical, so the two purely stylistic rules are relaxed here rather
    // than editing the tests. Correctness rules (undef, eqeqeq, ...) still apply.
    files: ['tests/client.test.mjs'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: { ...globals.node, ...globals.browser, ...globals.es2022 }
    },
    rules: {
      ...baselineRules,
      'no-unused-vars': 'off',
      'prefer-const': 'off'
    }
  },
  {
    // Flat config itself: ES module running under Node.
    files: ['eslint.config.mjs'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: { ...globals.node, ...globals.es2022 }
    },
    rules: baselineRules
  }
];
