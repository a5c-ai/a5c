// Flat config for ESLint v9+
import tseslint from '@typescript-eslint/eslint-plugin'
import tsparser from '@typescript-eslint/parser'
import eslint from '@eslint/js'
import globals from 'globals'

export default [
  // Ignore build artifacts
  { ignores: ['dist/**', 'tests/fixtures/**', 'samples/**'] },
  eslint.configs.recommended,
  // Base JS (Node) files
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.node,
      },
    },
  },
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: tsparser,
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.node,
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
    },
    rules: {
      'no-unused-vars': 'off',
      'no-undef': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-empty': ['error', { allowEmptyCatch: true }],
      'no-useless-escape': 'off',
    },
  },
  // Relax rules for declaration files
  {
    files: ['**/*.d.ts'],
    rules: {
      'no-unused-vars': 'off',
      'no-undef': 'off',
    },
  },
  // Test environment tweaks
  {
    files: ['tests/**/*.*', 'test/**/*.*'],
    languageOptions: {
      globals: {
        ...globals.node,
        require: 'readonly',
      },
    },
    rules: {
      'no-unused-vars': 'off',
    },
  },
]
