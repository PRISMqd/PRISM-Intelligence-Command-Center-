import { createServerSupabaseClient } from '@/lib/supabase-server'
import ObjectsView from '@/components/views/ObjectsView'
import type { ObjectType } from '@/lib/types'

export const dynamic = 'force-dynamic'

const PAGE_SIZE = 50

export default async function ObjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; type?: string; status?: string; q?: string }>
}) {
  const params = await searchParams
  const page = Math.max(1, parseInt(params.page ?? '1', 10))
  const typeFilter = (params.type ?? '') as ObjectType | ''
  const statusFilter = params.status ?? ''
  const searchQuery = params.q ?? ''

  const supabase = await createServerSupabaseClient()

  // Build the objects query
  let objectsQuery = supabase
    .from('objects')
    .select('*', { count: 'exact' })
    .is('deleted_at', null)
    .order('updated_at', { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1)

  if (typeFilter) {
    objectsQuery = objectsQuery.eq('object_type', typeFilter)
  }
  if (statusFilter) {
    objectsQuery = objectsQuery.eq('status', statusFilter)
  }
  if (searchQuery) {
    objectsQuery = objectsQuery.ilike('name', `%${searchQuery}%`)
  }

  // Fetch type counts (always unfiltered except deleted)
  const [objectsResult, countsResult] = await Promise.all([
    objectsQuery,
    supabase
      .from('objects')
      .select('object_type')
      .is('deleted_at', null),
  ])

  const objects = objectsResult.data ?? []
  const totalCount = objectsResult.count ?? 0

  // Aggregate counts by type client-side from the counts query
  const typeCounts: Record<string, number> = {}
  for (const row of (countsResult.data ?? []) as Array<{ object_type: string | null }>) {
    const t = (row.object_type ?? 'unknown') as string
    typeCounts[t] = (typeCounts[t] ?? 0) + 1
  }

  return (
    <ObjectsView
      objects={objects}
      totalCount={totalCount}
      typeCounts={typeCounts}
      page={page}
      pageSize={PAGE_SIZE}
      typeFilter={typeFilter}
      statusFilter={statusFilter}
      searchQuery={searchQuery}
    />
  )
}
