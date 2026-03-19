// ─── Auth Store ───────────────────────────────────────────────────────────────
import { writable } from 'svelte/store'

export const currentUser  = writable(null)
export const isLoggedIn   = writable(false)
export const isGoogleUser = writable(false)
export const gcalToken    = writable(null)

export const authStatus = writable('loading') // 'loading' | 'authenticated' | 'unauthenticated'
