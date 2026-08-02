import { ApiError, type ApiClientError } from './api-error'
import { useMutation, type UseMutationOptions } from '@tanstack/react-query'

export type Composite = { status: number, data: unknown }
type SuccessOf<TResult extends Composite, TSuccessStatus extends number> = Extract<TResult, { status: TSuccessStatus }>
type ErrorOf<TResult extends Composite, TSuccessStatus extends number> = Exclude<TResult, { status: TSuccessStatus }>

/** The backend wraps every success body as `{ data: T }`; peel it back to `T`. */
type Unwrapped<T> = T extends { data: infer D } ? D : T

export type ApiMutationOptions<TResult extends Composite, TSuccessStatus extends number, TVariables> = Omit<
  UseMutationOptions<Unwrapped<SuccessOf<TResult, TSuccessStatus>['data']>, ApiClientError<ErrorOf<TResult, TSuccessStatus>['data']>, TVariables>,
  'mutationFn'
>

function unwrap<TResult extends Composite, TSuccessStatus extends number>(result: TResult, successStatus: TSuccessStatus) {
  if (result.status !== successStatus) {
    throw ApiError.fromComposite(result)
  }

  return (result.data as { data: unknown } | undefined)?.data as Unwrapped<SuccessOf<TResult, TSuccessStatus>['data']>
}

export function createMutationHook<TInput, TResult extends Composite, TSuccessStatus extends number>(
  fn: (input: TInput) => Promise<TResult>,
  successStatus: TSuccessStatus
) {
  return (options?: ApiMutationOptions<TResult, TSuccessStatus, TInput>) =>
    useMutation({
      ...options,
      mutationFn: async (input: TInput) => unwrap(await fn(input), successStatus)
    })
}

/** Same as {@link createMutationHook}, for endpoints that take no request body. */
export function createVoidMutationHook<TResult extends Composite, TSuccessStatus extends number>(
  fn: () => Promise<TResult>,
  successStatus: TSuccessStatus
) {
  return (options?: ApiMutationOptions<TResult, TSuccessStatus, void>) =>
    useMutation({
      ...options,
      mutationFn: async () => unwrap(await fn(), successStatus)
    })
}
