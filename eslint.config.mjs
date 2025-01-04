import typescriptEslintPlugin from '@typescript-eslint/eslint-plugin';
import typescriptEslintParser from '@typescript-eslint/parser';
import prettierPlugin from 'eslint-plugin-prettier';
import importPlugin from 'eslint-plugin-import';

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
      prettier: prettierPlugin,
      import: importPlugin
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      'prettier/prettier': 'error',
      // Enforce .js extension in import statements
      'import/extensions': [
        'error',
        'always',
        {
          js: 'always',   // JavaScript imports need to include .js
          ts: 'never',    // TypeScript imports don't need extensions
        }
      ],
      // Optional: Ensure consistent import order (enhances readability)
      'import/order': [
        'error',
        {
          'groups': ['builtin', 'external', 'internal', ['sibling', 'parent']],
          'newlines-between': 'always',
          'alphabetize': {
            'order': 'asc',
            'caseInsensitive': true
          }
        }
      ]
    },
    settings: {
      'import/resolver': {
        node: {
          extensions: ['.js', '.ts']
        }
      }
    }
  }
];
