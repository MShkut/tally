import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import importPlugin from 'eslint-plugin-import' // ✅ NEW

export default [
  { ignores: ['dist'] },
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

      /*'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],*/

      // ✅ Enforce named exports only
      'import/no-default-export': 'error',

      // ✅ Disallow relative parent imports (e.g. ../../Component)
      'import/no-relative-parent-imports': 'error',

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
      // Optional but helps `import` plugin resolve aliases
      'import/resolver': {
        node: true,
        alias: {
          map: [
            ['components', './src/components'],
            ['hooks', './src/hooks'],
            ['utils', './src/utils'],
            ['pages', './src/pages'],
          ],
          extensions: ['.js', '.jsx'],
        },
      },
    },
  },
]

