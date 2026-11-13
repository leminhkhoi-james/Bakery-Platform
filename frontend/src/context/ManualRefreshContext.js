import { createContext, useContext } from 'react'

// Portal screens update through their existing resource subscriptions.
// Customer screens retain their current refresh controls.
export const ManualRefreshContext = createContext(true)
export const useManualRefresh = () => useContext(ManualRefreshContext)
