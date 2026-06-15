import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
    rules: {
      // Regla solo de DX (granularidad de Fast Refresh), no de correctitud.
      // Dispara en patrones idiomáticos e intencionales: el hook useAuth colocado
      // con su AuthProvider, y buttonVariants (cva) junto a Button en shadcn.
      // La dejamos como warning (visible) para que no bloquee el gate de CI.
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    },
  },
])
