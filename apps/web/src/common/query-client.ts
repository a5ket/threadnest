import { QueryClient } from '@tanstack/react-query'
import { ApiError } from './api-error'

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        gcTime: 5 * 60 * 1000,
        retry: (failureCount, error) => {
          if (error instanceof ApiError && error.statusCode < 500) {
            return false
          }

          return failureCount < 2
        },
        refetchOnWindowFocus: true
      },
      mutations: {
        retry: false
      }
    }
  })
}

let browserQueryClient: QueryClient | undefined

export function getQueryClient() {
  if (typeof window === 'undefined') {
    // Server: always create a new client per request.
    return makeQueryClient()
  }

  // Browser: reuse the same client across the session.
  if (!browserQueryClient) {
    browserQueryClient = makeQueryClient()
  }

  return browserQueryClient
}
