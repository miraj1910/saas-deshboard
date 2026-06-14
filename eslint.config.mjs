import next from '@next/eslint-plugin-next'
import js from '@eslint/js'

export default [
  js.configs.recommended,
  {
    plugins: {
      '@next/next': next,
    },
    rules: {
      ...next.configs['core-web-vitals'].rules,
      '@next/next/no-html-link-for-pages': 'off',
    },
  },
  {
    ignores: ['prisma/seed-workspace.ts'],
  },
]
