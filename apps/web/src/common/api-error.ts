export type ApiErrorResponse = {
  error?: {
    status?: number
    code?: string
    message?: string
    fields?: unknown
    retryAfterSeconds?: number
  }
}

type CodeOf<TResponse> = (TResponse extends { error: { code: infer TCode } } ? TCode : never) | 'UNKNOWN_ERROR'

export class ApiError<TResponse = unknown> extends Error {
  readonly statusCode: number
  readonly errorCode: CodeOf<TResponse>
  readonly details?: unknown
  readonly retryAfterSeconds?: number
  readonly response?: TResponse

  constructor(statusCode: number, errorCode: CodeOf<TResponse>, message: string, details?: unknown, response?: TResponse, retryAfterSeconds?: number) {
    super(message)
    this.name = 'ApiError'
    this.statusCode = statusCode
    this.errorCode = errorCode
    this.details = details
    this.retryAfterSeconds = retryAfterSeconds
    this.response = response
  }

  static async fromResponse<TResponse = ApiErrorResponse>(response: Response) {
    let payload: TResponse | undefined

    try {
      payload = await response.json() as TResponse
    }
    catch {
      payload = undefined
    }

    const apiError = payload as ApiErrorResponse | undefined

    return new ApiError<TResponse>(
      apiError?.error?.status ?? response.status,
      (apiError?.error?.code ?? 'UNKNOWN_ERROR') as CodeOf<TResponse>,
      apiError?.error?.message ?? (response.statusText || 'Something went wrong'),
      apiError?.error?.fields,
      payload,
      apiError?.error?.retryAfterSeconds
    )
  }

  static fromComposite<TResponse>(result: { status: number, data: TResponse }) {
    const body = result.data as ApiErrorResponse | undefined

    return new ApiError<TResponse>(
      body?.error?.status ?? result.status,
      (body?.error?.code ?? 'UNKNOWN_ERROR') as CodeOf<TResponse>,
      body?.error?.message ?? 'Something went wrong',
      body?.error?.fields,
      result.data,
      body?.error?.retryAfterSeconds
    )
  }

  is(code: CodeOf<TResponse>) {
    return this.errorCode === code
  }
}

/**
 * The request never reached the server (offline, DNS failure, CORS, connection refused, ...).
 */
export class ApiNetworkError extends Error {
  readonly errorCode = 'NETWORK_ERROR' as const
  readonly cause?: unknown

  constructor(cause?: unknown) {
    super('Network request failed')
    this.name = 'ApiNetworkError'
    this.cause = cause
  }
}

/**
 * The server responded, but the body wasn't valid JSON when JSON was expected.
 */
export class ApiParseError extends Error {
  readonly errorCode = 'PARSE_ERROR' as const
  readonly statusCode: number
  readonly cause?: unknown

  constructor(statusCode: number, cause?: unknown) {
    super('Failed to parse API response')
    this.name = 'ApiParseError'
    this.statusCode = statusCode
    this.cause = cause
  }
}

/**
 * Everything a generated API function can throw: a typed backend error, or one of the
 * client-side failure modes that can happen before/without a usable backend response.
 */
export type ApiClientError<TResponse> = ApiError<TResponse> | ApiNetworkError | ApiParseError

// INTERNAL_SERVER_ERROR is HttpExceptionFilter's app-wide fallback, not per-endpoint.
export type GenericApiErrorCode
  = | 'INTERNAL_SERVER_ERROR'
    | 'UNKNOWN_ERROR'
    | ApiNetworkError['errorCode']
    | ApiParseError['errorCode']
    | (string & {})
