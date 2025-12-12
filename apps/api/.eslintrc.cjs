module.exports = {
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
  env: {
    node: true,
    jest: true
  },
  parserOptions: {
    sourceType: 'module',
    ecmaVersion: 2020
  },
  ignorePatterns: ['dist', 'coverage']
};
