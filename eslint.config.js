import js from '@eslint/js'
import reactHooks from 'eslint-plugin-react-hooks'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  { ignores: ['dist/**', 'node_modules/**', 'public/**'] },

  js.configs.recommended,
  ...tseslint.configs.recommended,

  // App code (browser).
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      globals: { ...globals.browser },
    },
    plugins: { 'react-hooks': reactHooks },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      // Established debt (mostly the phone-swap tuning scaffolding): surfaced as
      // warnings to burn down, not block CI. Underscore prefix marks intentional.
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },

  // Node-context files (build scripts, config).
  {
    files: [
      'scripts/**/*.{mjs,js}',
      '**/*.config.{ts,js,mjs}',
      'vite/**/*.{ts,tsx,mjs}',
    ],
    languageOptions: {
      globals: { ...globals.node },
    },
  },

  // Prerender/OG scripts serialize browser-context code into page.evaluate().
  {
    files: ['scripts/prerender.mjs', 'scripts/generate-og-share.mjs'],
    languageOptions: {
      globals: { ...globals.node, ...globals.browser },
    },
  },
)
