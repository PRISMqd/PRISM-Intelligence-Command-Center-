import { create } from 'zustand'

interface ObjectsStore {
  objects: any[]
  objectsByType: Record<string, any[]>
  totalCount: number
  lastUpdated: Date | null
  setObjects: (objects: any[]) => void
  addObject: (obj: any) => void
  updateObject: (id: string, updates: any) => void
  removeObject: (id: string) => void
}

export const useObjectsStore = create<ObjectsStore>((set) => ({
  objects: [],
  objectsByType: {},
  totalCount: 0,
  lastUpdated: null,

  setObjects: (objects) =>
    set(() => {
      const objectsByType: Record<string, any[]> = {}
      for (const obj of objects) {
        const type = obj.type ?? 'unknown'
        if (!objectsByType[type]) objectsByType[type] = []
        objectsByType[type].push(obj)
      }
      return { objects, objectsByType, totalCount: objects.length, lastUpdated: new Date() }
    }),

  addObject: (obj) =>
    set((state) => {
      const objects = [...state.objects, obj]
      const type = obj.type ?? 'unknown'
      const objectsByType = {
        ...state.objectsByType,
        [type]: [...(state.objectsByType[type] ?? []), obj],
      }
      return { objects, objectsByType, totalCount: objects.length, lastUpdated: new Date() }
    }),

  updateObject: (id, updates) =>
    set((state) => {
      const objects = state.objects.map((o) => (o.id === id ? { ...o, ...updates } : o))
      const objectsByType: Record<string, any[]> = {}
      for (const obj of objects) {
        const type = obj.type ?? 'unknown'
        if (!objectsByType[type]) objectsByType[type] = []
        objectsByType[type].push(obj)
      }
      return { objects, objectsByType, lastUpdated: new Date() }
    }),

  removeObject: (id) =>
    set((state) => {
      const objects = state.objects.filter((o) => o.id !== id)
      const objectsByType: Record<string, any[]> = {}
      for (const obj of objects) {
        const type = obj.type ?? 'unknown'
        if (!objectsByType[type]) objectsByType[type] = []
        objectsByType[type].push(obj)
      }
      return { objects, objectsByType, totalCount: objects.length, lastUpdated: new Date() }
    }),
}))
