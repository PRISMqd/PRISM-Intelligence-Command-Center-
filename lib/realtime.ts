import { useState, useEffect } from 'react'
import { createClient } from './supabase'

export const REALTIME_CHANNELS = [
  'prism:objects',
  'prism:claims',
  'prism:evidence',
  'prism:assumptions',
  'prism:unknowns',
  'prism:decisions',
  'prism:tasks',
  'prism:metrics',
  'prism:briefs',
  'prism:risks',
  'prism:provenance',
] as const

export type RealtimeEvent<T> = {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE'
  new: T
  old: T
}

export function createRealtimeSubscription<T>(
  channelName: string,
  table: string,
  callback: (event: RealtimeEvent<T>) => void
): () => void {
  const supabase = createClient()

  const channel = supabase
    .channel(channelName)
    .on(
      'postgres_changes' as any,
      { event: '*', schema: 'public', table },
      (payload: any) => {
        callback({
          eventType: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
          new: payload.new as T,
          old: payload.old as T,
        })
      }
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}

export function useRealtimeChannel<T>(
  channelName: string,
  table: string,
  onEvent: (event: RealtimeEvent<T>) => void
): void {
  useEffect(() => {
    const unsubscribe = createRealtimeSubscription<T>(channelName, table, onEvent)
    return () => {
      unsubscribe()
    }
  }, [channelName, table])
}
