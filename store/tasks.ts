import { create } from 'zustand'

interface TasksStore {
  tasks: any[]
  overdueList: any[]
  blockedList: any[]
  velocity: number
  lastUpdated: Date | null
  setTasks: (tasks: any[]) => void
  addTask: (task: any) => void
  updateTask: (id: string, updates: any) => void
  removeTask: (id: string) => void
  setVelocity: (velocity: number) => void
}

function deriveOverdue(tasks: any[]): any[] {
  const now = new Date()
  return tasks.filter((t) => t.dueDate && new Date(t.dueDate) < now && t.status !== 'done')
}

function deriveBlocked(tasks: any[]): any[] {
  return tasks.filter((t) => t.status === 'blocked')
}

export const useTasksStore = create<TasksStore>((set) => ({
  tasks: [],
  overdueList: [],
  blockedList: [],
  velocity: 0,
  lastUpdated: null,

  setTasks: (tasks) =>
    set({
      tasks,
      overdueList: deriveOverdue(tasks),
      blockedList: deriveBlocked(tasks),
      lastUpdated: new Date(),
    }),

  addTask: (task) =>
    set((state) => {
      const tasks = [...state.tasks, task]
      return {
        tasks,
        overdueList: deriveOverdue(tasks),
        blockedList: deriveBlocked(tasks),
        lastUpdated: new Date(),
      }
    }),

  updateTask: (id, updates) =>
    set((state) => {
      const tasks = state.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t))
      return {
        tasks,
        overdueList: deriveOverdue(tasks),
        blockedList: deriveBlocked(tasks),
        lastUpdated: new Date(),
      }
    }),

  removeTask: (id) =>
    set((state) => {
      const tasks = state.tasks.filter((t) => t.id !== id)
      return {
        tasks,
        overdueList: deriveOverdue(tasks),
        blockedList: deriveBlocked(tasks),
        lastUpdated: new Date(),
      }
    }),

  setVelocity: (velocity) => set({ velocity }),
}))
