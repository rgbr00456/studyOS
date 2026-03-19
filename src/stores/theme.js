// ─── Theme Store ──────────────────────────────────────────────────────────────
import { writable } from 'svelte/store'

const STORAGE_KEY = 'sos_theme'

function createTheme() {
  const saved = typeof localStorage !== 'undefined'
    ? localStorage.getItem(STORAGE_KEY)
    : null

  const { subscribe, set, update } = writable(saved === 'light' ? 'light' : 'dark')

  return {
    subscribe,
    toggle() {
      update(t => {
        const next = t === 'dark' ? 'light' : 'dark'
        try { localStorage.setItem(STORAGE_KEY, next) } catch {}
        return next
      })
    },
    init() {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) set(saved)
    }
  }
}

export const theme = createTheme()
