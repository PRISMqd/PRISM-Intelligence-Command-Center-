import { create } from 'zustand'

interface AssumptionsStore {
  assumptions: any[]
  highRiskList: any[]
  setAssumptions: (assumptions: any[]) => void
  addAssumption: (assumption: any) => void
  updateAssumption: (id: string, updates: any) => void
  removeAssumption: (id: string) => void
}

function deriveHighRisk(assumptions: any[]): any[] {
  return assumptions.filter((a) => a.risk === 'high' || a.riskLevel === 'high')
}

export const useAssumptionsStore = create<AssumptionsStore>((set) => ({
  assumptions: [],
  highRiskList: [],

  setAssumptions: (assumptions) =>
    set({ assumptions, highRiskList: deriveHighRisk(assumptions) }),

  addAssumption: (assumption) =>
    set((state) => {
      const assumptions = [...state.assumptions, assumption]
      return { assumptions, highRiskList: deriveHighRisk(assumptions) }
    }),

  updateAssumption: (id, updates) =>
    set((state) => {
      const assumptions = state.assumptions.map((a) =>
        a.id === id ? { ...a, ...updates } : a
      )
      return { assumptions, highRiskList: deriveHighRisk(assumptions) }
    }),

  removeAssumption: (id) =>
    set((state) => {
      const assumptions = state.assumptions.filter((a) => a.id !== id)
      return { assumptions, highRiskList: deriveHighRisk(assumptions) }
    }),
}))
