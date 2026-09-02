export default {
  'apps/api/**/*.ts': (files) => `pnpm --dir apps/api exec eslint --fix ${files.join(' ')}`,
  'apps/web/**/*.{js,jsx,ts,tsx}': (files) => `pnpm --dir apps/web exec eslint --fix ${files.join(' ')}`,
}
