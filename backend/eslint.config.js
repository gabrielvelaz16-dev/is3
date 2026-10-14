import js from '@eslint/js';
import { defineConfig } from 'eslint/config';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default defineConfig([
  { ignores: ['dist', 'coverage', 'src/generated'] },
  js.configs.recommended,
  tseslint.configs.recommended,
  {
    languageOptions: { globals: globals.node },
    rules: {
      // Toda salida debe pasar por el logger (sin datos sensibles).
      'no-console': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', ignoreRestSiblings: true }],
    },
  },
  {
    // El seed es un script de consola: puede informar por consola.
    files: ['prisma/seed.ts'],
    rules: { 'no-console': 'off' },
  },
]);
