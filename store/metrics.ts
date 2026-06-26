import { create } from 'zustand'

interface OrgHealthEntry {
  score: number
  trend?: string
  [key: string]: any
}

interface MetricsStore {
  orgHealth: Record<string, OrgHealthEntry>
  rai: number | null
  lastComputed: Date | null
  setMetric: (key: string, value: any) => void
  setOrgHealth: (dimension: string, entry: OrgHealthEntry) => void
  setRai: (rai: number | null) => void
  setOrgHealthAll: (orgHealth: Record<string, OrgHealthEntry>) => void
}

export const useMetricsStore = create<MetricsStore>((set) => ({
  orgHealth: {},
  rai: null,
  lastComputed: null,

  setMetric: (key, value) =>
    set((state) => ({
      orgHealth: { ...state.orgHealth, [key]: value },
      lastComputed: new Date(),
    })),

  setOrgHealth: (dimension, entry) =>
    set((state) => ({
      orgHealth: { ...state.orgHealth, [dimension]: entry },
      lastComputed: new Date(),
    })),

  setRai: (rai) => set({ rai, lastComputed: new Date() }),

  setOrgHealthAll: (orgHealth) => set({ orgHealth, lastComputed: new Date() }),
}))
