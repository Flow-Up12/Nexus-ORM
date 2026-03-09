import { useQuery } from '@tanstack/react-query'
import { fetchSchema } from '@/api/schema'

export function useSchema(projectId?: string | null) {
  const { data: schema, isLoading, error, refetch } = useQuery({
    queryKey: ['schema', projectId ?? 'global'],
    queryFn: () => fetchSchema(projectId),
  })

  const models = schema?.parsed?.models ?? []
  const enums = schema?.parsed?.enums ?? []
  const modelNames = models.map((m) => m.name)
  const enumNames = enums.map((e) => e.name)

  return {
    schema,
    isLoading,
    error,
    models,
    enums,
    modelNames,
    enumNames,
    refetch,
  }
}
