import { create } from 'zustand'

interface BriefsStore {
  todayBrief: any | null
  lastGenerated: Date | null
  setBrief: (brief: any | null) => void
  clearBrief: () => void
}

export const useBriefsStore = create<BriefsStore>((set) => ({
  todayBrief: null,
  lastGenerated: null,

  setBrief: (brief) => set({ todayBrief: brief, lastGenerated: new Date() }),

  clearBrief: () => set({ todayBrief: null, lastGenerated: null }),
}))
