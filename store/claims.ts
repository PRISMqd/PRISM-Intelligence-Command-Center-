import { create } from 'zustand'

interface StatusCounts {
  supported: number
  unsupported: number
  contested: number
  unknown: number
}

interface ClaimsStore {
  claims: any[]
  statusCounts: StatusCounts
  lastUpdated: Date | null
  setClaims: (claims: any[]) => void
  addClaim: (claim: any) => void
  updateClaim: (id: string, updates: any) => void
  removeClaim: (id: string) => void
}

function computeStatusCounts(claims: any[]): StatusCounts {
  const counts: StatusCounts = { supported: 0, unsupported: 0, contested: 0, unknown: 0 }
  for (const c of claims) {
    const status = c.status as keyof StatusCounts
    if (status in counts) counts[status]++
    else counts.unknown++
  }
  return counts
}

export const useClaimsStore = create<ClaimsStore>((set) => ({
  claims: [],
  statusCounts: { supported: 0, unsupported: 0, contested: 0, unknown: 0 },
  lastUpdated: null,

  setClaims: (claims) =>
    set({ claims, statusCounts: computeStatusCounts(claims), lastUpdated: new Date() }),

  addClaim: (claim) =>
    set((state) => {
      const claims = [...state.claims, claim]
      return { claims, statusCounts: computeStatusCounts(claims), lastUpdated: new Date() }
    }),

  updateClaim: (id, updates) =>
    set((state) => {
      const claims = state.claims.map((c) => (c.id === id ? { ...c, ...updates } : c))
      return { claims, statusCounts: computeStatusCounts(claims), lastUpdated: new Date() }
    }),

  removeClaim: (id) =>
    set((state) => {
      const claims = state.claims.filter((c) => c.id !== id)
      return { claims, statusCounts: computeStatusCounts(claims), lastUpdated: new Date() }
    }),
}))
