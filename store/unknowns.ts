import { create } from 'zustand'

interface UnknownsStore {
  unknowns: any[]
  highEVIList: any[]
  setUnknowns: (unknowns: any[]) => void
  addUnknown: (unknown: any) => void
  updateUnknown: (id: string, updates: any) => void
  removeUnknown: (id: string) => void
}

function deriveHighEVI(unknowns: any[]): any[] {
  return unknowns.filter((u) => u.evi === 'high' || u.evidenceValue === 'high' || u.eviScore > 0.7)
}

export const useUnknownsStore = create<UnknownsStore>((set) => ({
  unknowns: [],
  highEVIList: [],

  setUnknowns: (unknowns) => set({ unknowns, highEVIList: deriveHighEVI(unknowns) }),

  addUnknown: (unknown) =>
    set((state) => {
      const unknowns = [...state.unknowns, unknown]
      return { unknowns, highEVIList: deriveHighEVI(unknowns) }
    }),

  updateUnknown: (id, updates) =>
    set((state) => {
      const unknowns = state.unknowns.map((u) => (u.id === id ? { ...u, ...updates } : u))
      return { unknowns, highEVIList: deriveHighEVI(unknowns) }
    }),

  removeUnknown: (id) =>
    set((state) => {
      const unknowns = state.unknowns.filter((u) => u.id !== id)
      return { unknowns, highEVIList: deriveHighEVI(unknowns) }
    }),
}))
