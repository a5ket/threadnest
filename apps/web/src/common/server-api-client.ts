import { env } from '@/config/env'
import { cookies } from 'next/headers'
import { ApiError, ApiNetworkError, ApiParseError } from './api-error'

const API_URL = env.apiUrl

if (!API_URL) {
  throw new Error('NEXT_PUBLIC_API_URL is not set')
}

async function performFetchServer(url: string, options: RequestInit) {
  try {
    return await fetch(url, options)
  }
  catch (cause) {
    throw new ApiNetworkError(cause)
  }
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

async function requestServer<T extends { status: number, data: unknown, headers: Headers }>(url: string, options: RequestInit): Promise<T> {
  const cookieStore = await cookies()

  const response = await performFetchServer(url, {
    ...options,
    headers: { ...options.headers, Cookie: cookieStore.toString() },
    cache: 'no-store'
  })

  const data = await parseBody(response)

  return { status: response.status, data, headers: response.headers } as T
}

export function apiFetchServer<T extends { status: number, data: unknown, headers: Headers }>(url: string, options: RequestInit) {
  const sourceUrl = new URL(url, API_URL)
  return requestServer<T>(`${API_URL}${sourceUrl.pathname}${sourceUrl.search}`, options)
}

export async function apiClientServer<T = unknown>(path: string, options: { method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE', body?: unknown } = {}) {
  const { method = 'GET', body } = options

  const result = await requestServer<{ status: number, data: unknown, headers: Headers }>(`${API_URL}${path}`, {
    method,
    headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined
  })

  if (result.status >= 400) {
    throw ApiError.fromComposite(result)
  }

  return (result.data as { data: T }).data
}
