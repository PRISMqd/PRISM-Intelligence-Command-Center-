// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient, createServerSupabaseClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const { project_id } = body as { project_id?: string }

    const readClient = await createServerSupabaseClient()
    const writeClient = createServiceClient()

    // Gather focus scores from tasks
    const tasksQuery = readClient
      .from('tasks')
      .select('id, title, focus_score, status, priority')
      .order('focus_score', { ascending: false })
    if (project_id) tasksQuery.eq('project_id', project_id)
    const { data: tasks, error: tasksError } = await tasksQuery
    if (tasksError) throw tasksError

    // Gather focus scores from decisions
    const decisionsQuery = readClient
      .from('decisions')
      .select('id, title, focus_score, status')
      .order('focus_score', { ascending: false })
    if (project_id) decisionsQuery.eq('project_id', project_id)
    const { data: decisions, error: decisionsError } = await decisionsQuery
    if (decisionsError) throw decisionsError

    // Gather focus scores from claims
    const claimsQuery = readClient
      .from('claims')
      .select('id, title, focus_score, status')
      .order('focus_score', { ascending: false })
    if (project_id) claimsQuery.eq('project_id', project_id)
    const { data: claims, error: claimsError } = await claimsQuery
    if (claimsError) throw claimsError

    // Gather focus scores from assumptions
    const assumptionsQuery = readClient
      .from('assumptions')
      .select('id, title, focus_score, status')
      .order('focus_score', { ascending: false })
    if (project_id) assumptionsQuery.eq('project_id', project_id)
    const { data: assumptions, error: assumptionsError } = await assumptionsQuery
    if (assumptionsError) throw assumptionsError

    // Build focus_items array combining all sources
    const focus_items = [
      ...(tasks ?? []).map((t) => ({
        type: 'task' as const,
        id: t.id,
        title: t.title,
        focus_score: t.focus_score ?? 0,
        meta: { status: t.status, priority: t.priority },
      })),
      ...(decisions ?? []).map((d) => ({
        type: 'decision' as const,
        id: d.id,
        title: d.title,
        focus_score: d.focus_score ?? 0,
        meta: { status: d.status },
      })),
      ...(claims ?? []).map((c) => ({
        type: 'claim' as const,
        id: c.id,
        title: c.title,
        focus_score: c.focus_score ?? 0,
        meta: { status: c.status },
      })),
      ...(assumptions ?? []).map((a) => ({
        type: 'assumption' as const,
        id: a.id,
        title: a.title,
        focus_score: a.focus_score ?? 0,
        meta: { status: a.status },
      })),
    ]
      .filter((item) => item.focus_score != null)
      .sort((a, b) => (b.focus_score ?? 0) - (a.focus_score ?? 0))

    // Insert brief row
    const { data: brief, error: briefError } = await writeClient
      .from('briefs')
      .insert({
        project_id: project_id ?? null,
        focus_items,
        generated_at: new Date().toISOString(),
        status: 'draft',
      })
      .select('id')
      .single()

    if (briefError) throw briefError

    return NextResponse.json({ success: true, brief_id: brief.id })
  } catch (error) {
    console.error('[briefs/generate]', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
