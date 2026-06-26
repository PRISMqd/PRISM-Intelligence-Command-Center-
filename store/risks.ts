import { create } from 'zustand'

interface RisksStore {
  risks: any[]
  criticalList: any[]
  setRisks: (risks: any[]) => void
  addRisk: (risk: any) => void
  updateRisk: (id: string, updates: any) => void
  removeRisk: (id: string) => void
}

function deriveCritical(risks: any[]): any[] {
  return risks.filter((r) => r.severity === 'critical' || r.level === 'critical')
}

export const useRisksStore = create<RisksStore>((set) => ({
  risks: [],
  criticalList: [],

  setRisks: (risks) => set({ risks, criticalList: deriveCritical(risks) }),

  addRisk: (risk) =>
    set((state) => {
      const risks = [...state.risks, risk]
      return { risks, criticalList: deriveCritical(risks) }
    }),

  updateRisk: (id, updates) =>
    set((state) => {
      const risks = state.risks.map((r) => (r.id === id ? { ...r, ...updates } : r))
      return { risks, criticalList: deriveCritical(risks) }
    }),

  removeRisk: (id) =>
    set((state) => {
      const risks = state.risks.filter((r) => r.id !== id)
      return { risks, criticalList: deriveCritical(risks) }
    }),
}))
