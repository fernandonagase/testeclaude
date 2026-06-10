import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: ['**/dist/**', '**/build/**', '**/.expo/**', '**/node_modules/**', '**/*.config.*'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/consistent-type-imports': 'error',
    },
  },
  {
    // A DI do Nest depende de imports de valor (emitDecoratorMetadata);
    // import type quebraria a resolução de providers por tipo.
    files: ['apps/api/**'],
    rules: {
      '@typescript-eslint/consistent-type-imports': 'off',
    },
  },
);
