import { createServerSupabaseClient } from '@/lib/supabase-server'
import TasksView from '@/components/views/TasksView'

export const dynamic = 'force-dynamic'

export default async function TasksPage() {
  const supabase = await createServerSupabaseClient()

  const [tasksResult, projectsResult] = await Promise.all([
    supabase
      .from('tasks')
      .select(`
        id,
        object_id,
        project_id,
        parent_task_id,
        title,
        description,
        status,
        priority,
        assigned_to,
        due_date,
        started_at,
        completed_at,
        blocked_reason,
        strategic_importance,
        expected_value,
        urgency,
        confidence,
        focus_score,
        tags,
        notes,
        created_at,
        updated_at
      `)
      .order('created_at', { ascending: false }),
    supabase
      .from('projects')
      .select('id, name'),
  ])

  const rawTasks = tasksResult.data ?? []
  const projects = (projectsResult.data ?? []) as Array<{ id: string; name: string }>

  // Build project lookup map
  const projectMap: Record<string, string> = {}
  for (const p of projects) {
    projectMap[p.id] = p.name
  }

  // Join project names onto tasks
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tasks = (rawTasks as any[]).map((t) => ({
    ...t,
    project_name: t.project_id ? (projectMap[t.project_id] ?? null) : null,
  }))

  return <TasksView tasks={tasks} />
}
