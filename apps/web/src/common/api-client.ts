import { env } from '@/config/env'
import { ApiError, ApiNetworkError, ApiParseError } from './api-error'

export type ErrorType<T> = ApiError<T>

const API_URL = env.apiUrl
const REFRESHABLE_AUTH_ERRORS = new Set(['INVALID_ACCESS_TOKEN', 'MISSING_ACCESS_TOKEN'])

if (!API_URL) {
  throw new Error('NEXT_PUBLIC_API_URL is not set')
}

interface ApiClientOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'
  body?: unknown
  signal?: AbortSignal
}

let refreshPromise: Promise<void> | null = null

async function performFetch(url: string, options: RequestInit) {
  try {
    return await fetch(url, { ...options, credentials: 'include' })
  }
  catch (cause) {
    if (cause instanceof DOMException && cause.name === 'AbortError') {
      throw cause
    }

    throw new ApiNetworkError(cause)
  }
}

async function requestRefresh() {
  const response = await performFetch(`${API_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{}'
  })

  if (!response.ok) {
    throw await ApiError.fromResponse(response)
  }
}

async function refreshSession() {
  refreshPromise ??= requestRefresh().finally(() => {
    refreshPromise = null
  })

  return refreshPromise
}

async function parseBody(response: Response) {
  if (response.status === 204 || response.status === 205 || response.status === 304) {
    return undefined
  }

  try {
    return await response.json()
  }
  catch (cause) {
    throw new ApiParseError(response.status, cause)
  }
}

function errorCodeOf(data: unknown) {
  return (data as { error?: { code?: string } } | undefined)?.error?.code
}

async function request<T extends { status: number, data: unknown, headers: Headers }>(url: string, options: RequestInit, isRetry = false): Promise<T> {
  const response = await performFetch(url, options)
  const data = await parseBody(response)

  if (
    !response.ok
    && typeof window !== 'undefined'
    && response.status === 401
    && !isRetry
    && REFRESHABLE_AUTH_ERRORS.has(errorCodeOf(data) ?? '')
  ) {
    try {
      await refreshSession()
      return request<T>(url, options, true)
    }
    catch (refreshError) {
      if (window.location.pathname !== '/login') {
        window.location.assign('/login')
      }

      throw refreshError
    }
  }

  return { status: response.status, data, headers: response.headers } as T
}

export function apiFetch<T extends { status: number, data: unknown, headers: Headers }>(url: string, options: RequestInit) {
  const sourceUrl = new URL(url, API_URL)
  return request<T>(`${API_URL}${sourceUrl.pathname}${sourceUrl.search}`, options)
}

export async function apiClient<T = unknown>(path: string, options: ApiClientOptions = {}) {
  const { method = 'GET', body, signal } = options

  const result = await request<{ status: number, data: unknown, headers: Headers }>(`${API_URL}${path}`, {
    method,
    headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    signal
  })

  if (result.status >= 400) {
    throw ApiError.fromComposite(result)
  }

  return (result.data as { data: T }).data
}
