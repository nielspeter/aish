import typescriptEslintPlugin from '@typescript-eslint/eslint-plugin';
import typescriptEslintParser from '@typescript-eslint/parser';
import prettierPlugin from 'eslint-plugin-prettier';

export default [
  {
    files: ['**/*.ts'],
    ignores: ['build', 'node_modules'],
    languageOptions: {
      ecmaVersion: 'latest',
      parser: typescriptEslintParser,
      sourceType: 'module'
    },
    plugins: {
      '@typescript-eslint': typescriptEslintPlugin,
      prettier: prettierPlugin
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      'prettier/prettier': 'error'
    }
  }
];
