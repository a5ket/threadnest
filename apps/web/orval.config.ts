import { defineConfig } from 'orval'

const apiUrl = process.env.NEXT_PUBLIC_API_URL!

export default defineConfig({
  threadnest: {
    input: `${apiUrl}/docs-json`,
    output: {
      mode: 'tags-split',
      target: 'src/generated/api',
      schemas: 'src/generated/api/models',
      client: 'fetch',
      clean: true,
      override: {
        mutator: {
          path: './src/common/api-client.ts',
          name: 'apiFetch'
        }
      }
    },
    hooks: {
      afterAllFilesWrite: 'eslint --fix'
    }
  },
  threadnestSchemas: {
    input: `${apiUrl}/docs-json`,
    output: {
      mode: 'tags-split',
      target: 'src/generated/schemas',
      schemas: 'src/generated/schemas/models',
      client: 'zod',
      clean: true
    },
    hooks: {
      afterAllFilesWrite: 'eslint --fix'
    }
  }
})
