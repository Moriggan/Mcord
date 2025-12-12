module.exports = {
  parserOptions: { ecmaVersion: 2020, sourceType: 'module' },
  env: { browser: true, node: true, es2021: true },
  extends: ['eslint:recommended', 'plugin:react/recommended'],
  settings: { react: { version: '18.0' } },
  overrides: [
    {
      files: ['*.ts', '*.tsx'],
      parser: '@typescript-eslint/parser',
      plugins: ['@typescript-eslint'],
      extends: ['plugin:@typescript-eslint/recommended']
    }
  ]
};
