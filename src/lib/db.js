// ─── Firestore Persistence ───────────────────────────────────────────────────
import { doc, setDoc, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase.js'
import { state } from '../stores/state.js'
import { get } from 'svelte/store'

const COLLECTION = 'studyos_users'
const STATE_KEYS = ['pages','folders','tasks','materias','horas','goals','notas',
                    'pomo','pomoCfg','streak','gcalClientId','metaSemanal','openFolders']

let _unsubscribe = null
let _saveTimer   = null

/** Subscribe to Firestore — patches state store on every remote change */
export function subscribeDb(uid, { onReady, onError, onSyncChange }) {
  if (_unsubscribe) _unsubscribe()
  onSyncChange('saving')

  _unsubscribe = onSnapshot(
    doc(db, COLLECTION, uid),
    (snap) => {
      if (snap.exists()) {
        const data = snap.data()
        state.update(s => {
          const next = { ...s }
          STATE_KEYS.forEach(k => { if (data[k] !== undefined) next[k] = data[k] })
          return next
        })
      }
      onSyncChange('ok')
      onReady()
    },
    (err) => {
      console.error('[db] snapshot error:', err)
      onSyncChange('error')
      onError()
    }
  )
}

export function unsubscribeDb() {
  if (_unsubscribe) { _unsubscribe(); _unsubscribe = null }
}

/** Debounced save — coalesces rapid changes into a single Firestore write */
export function saveDb(uid, onSyncChange) {
  if (!uid || !db) return
  clearTimeout(_saveTimer)
  onSyncChange('saving')
  _saveTimer = setTimeout(async () => {
    try {
      const s = get(state)
      const payload = {}
      STATE_KEYS.forEach(k => { payload[k] = s[k] })
      await setDoc(doc(db, COLLECTION, uid), payload)
      onSyncChange('ok')
    } catch (e) {
      console.error('[db] save error:', e)
      onSyncChange('error')
    }
  }, 1000)
}

// ─── localStorage fallback (when Firebase not configured) ─────────────────────
const LS_PREFIX = 'sos_'

export function loadLocal() {
  const loaded = {}
  STATE_KEYS.forEach(k => {
    try {
      const v = localStorage.getItem(LS_PREFIX + k)
      if (v !== null) loaded[k] = JSON.parse(v)
    } catch {}
  })
  return loaded
}

export function saveLocal(stateObj) {
  STATE_KEYS.forEach(k => {
    try { localStorage.setItem(LS_PREFIX + k, JSON.stringify(stateObj[k])) } catch {}
  })
}
