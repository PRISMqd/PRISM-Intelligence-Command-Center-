'use client'

import { useState, useEffect } from 'react'
import { createRealtimeSubscription } from '@/lib/realtime'

interface UseRealtimeChannelOptions<T> {
  table: string
  onInsert?: (record: T) => void
  onUpdate?: (record: T) => void
  onDelete?: (record: T) => void
}

interface UseRealtimeChannelResult {
  isConnected: boolean
}

export function useRealtimeChannel<T = Record<string, unknown>>({
  table,
  onInsert,
  onUpdate,
  onDelete,
}: UseRealtimeChannelOptions<T>): UseRealtimeChannelResult {
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    const channelName = `prism:${table}`

    const unsubscribe = createRealtimeSubscription<T>(
      channelName,
      table,
      (event) => {
        setIsConnected(true)

        switch (event.eventType) {
          case 'INSERT':
            onInsert?.(event.new)
            break
          case 'UPDATE':
            onUpdate?.(event.new)
            break
          case 'DELETE':
            onDelete?.(event.old)
            break
        }
      }
    )

    setIsConnected(true)

    return () => {
      unsubscribe()
      setIsConnected(false)
    }
  }, [table])

  return { isConnected }
}
