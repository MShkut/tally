import path from 'path'
import { fileURLToPath } from 'url'

import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import importPlugin from 'eslint-plugin-import' // ✅ NEW

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export default [
  { ignores: ['dist'] },
  {
    // Config files can use default exports and Node globals
    files: ['**/*.config.js'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
    rules: {
      'import/no-default-export': 'off',
      'import/order': 'off',  // Config files can have any import order
    },
  },
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      import: importPlugin, // ✅ NEW
    },
    rules: {
      ...js.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,

      // Ignore unused vars for React components (used in JSX)
      'no-unused-vars': ['error', {
        varsIgnorePattern: '^[A-Z]',  // Ignore PascalCase (React components)
        argsIgnorePattern: '^_'        // Ignore args starting with _
      }],

      /*'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],*/

      // ✅ Enforce named exports only
      'import/no-default-export': 'error',

      // ✅ Disallow relative parent imports (e.g. ../../Component)
      // DISABLED: Rule incorrectly flags path alias imports as relative
      // We use path aliases (contexts/, utils/, etc.) which aren't relative imports
      // 'import/no-relative-parent-imports': 'error',

      // ✅ Optional: Group and order imports (if you want)
      'import/order': [
        'warn',
        {
          groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
          'newlines-between': 'always',
        },
      ],
    },
    settings: {
      // Configure import resolver to recognize Vite path aliases
      'import/resolver': {
        node: {
          extensions: ['.js', '.jsx'],
        },
        alias: {
          map: [
            ['components', path.resolve(__dirname, 'src/components')],
            ['hooks', path.resolve(__dirname, 'src/hooks')],
            ['utils', path.resolve(__dirname, 'src/utils')],
            ['pages', path.resolve(__dirname, 'src/pages')],
            ['contexts', path.resolve(__dirname, 'src/contexts')],
            ['constants', path.resolve(__dirname, 'src/constants')],
          ],
          extensions: ['.js', '.jsx'],
        },
      },
    },
  },
]

