import { fileURLToPath } from 'node:url';
import css from '@eslint/css';
import tsParser from '@typescript-eslint/parser';
import betterTailwindcss from 'eslint-plugin-better-tailwindcss';
import { tailwind4 } from 'tailwind-csstree';

const canonicalClasses = {
  plugins: { 'better-tailwindcss': betterTailwindcss },
  settings: {
    'better-tailwindcss': {
      cwd: fileURLToPath(new URL('.', import.meta.url)),
      entryPoint: 'src/style.css',
      rootFontSize: 16,
    },
  },
  rules: {
    // Prettier owns ordering; ESLint normalizes equivalent class spellings.
    'better-tailwindcss/enforce-canonical-classes': ['error', { collapse: false }],
  },
};

export default [
  { ignores: ['dist/**', 'node_modules/**'] },
  {
    ...canonicalClasses,
    files: ['src/**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
  },
  {
    ...canonicalClasses,
    files: ['src/**/*.css'],
    plugins: { ...canonicalClasses.plugins, css },
    language: 'css/css',
    languageOptions: { customSyntax: tailwind4, tolerant: true },
  },
];
