import { create } from 'zustand'

interface AlertsStore {
  activeAlerts: any[]
  dismissedAlerts: Set<string>
  alertCount: number
  setAlerts: (alerts: any[]) => void
  addAlert: (alert: any) => void
  dismissAlert: (id: string) => void
}

export const useAlertsStore = create<AlertsStore>((set) => ({
  activeAlerts: [],
  dismissedAlerts: new Set<string>(),
  alertCount: 0,

  setAlerts: (alerts) =>
    set((state) => {
      const activeAlerts = alerts.filter((a) => !state.dismissedAlerts.has(a.id))
      return { activeAlerts, alertCount: activeAlerts.length }
    }),

  addAlert: (alert) =>
    set((state) => {
      if (state.dismissedAlerts.has(alert.id)) return state
      const activeAlerts = [...state.activeAlerts, alert]
      return { activeAlerts, alertCount: activeAlerts.length }
    }),

  dismissAlert: (id) =>
    set((state) => {
      const dismissedAlerts = new Set(state.dismissedAlerts)
      dismissedAlerts.add(id)
      const activeAlerts = state.activeAlerts.filter((a) => a.id !== id)
      return { dismissedAlerts, activeAlerts, alertCount: activeAlerts.length }
    }),
}))
