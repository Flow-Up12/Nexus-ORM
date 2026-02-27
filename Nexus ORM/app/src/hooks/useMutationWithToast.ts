import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { UseMutationOptions } from '@tanstack/react-query'

type QueryKey = readonly unknown[]

export interface UseMutationWithToastOptions<TData, TError, TVariables, TContext>
  extends Omit<UseMutationOptions<TData, TError, TVariables, TContext>, 'onSuccess' | 'onError'> {
  invalidateKeys?: QueryKey[]
  successMessage: string
  errorMessage?: string
  onSuccess?: (data: TData, variables: TVariables, context: TContext | undefined) => void
  onError?: (error: TError, variables: TVariables, context: TContext | undefined) => void
}

export function useMutationWithToast<
  TData = unknown,
  TError = Error,
  TVariables = void,
  TContext = unknown,
>({
  invalidateKeys,
  successMessage,
  errorMessage,
  onSuccess: userOnSuccess,
  onError: userOnError,
  ...options
}: UseMutationWithToastOptions<TData, TError, TVariables, TContext>) {
  const queryClient = useQueryClient()

  return useMutation<TData, TError, TVariables, TContext>({
    ...options,
    onSuccess: (data, variables, context) => {
      if (invalidateKeys?.length) {
        invalidateKeys.forEach((key) => queryClient.invalidateQueries({ queryKey: key }))
      }
      toast.success(successMessage)
      userOnSuccess?.(data, variables, context)
    },
    onError: (error, variables, context) => {
      toast.error(error instanceof Error ? error.message : errorMessage ?? 'Operation failed')
      userOnError?.(error, variables, context)
    },
  })
}
