// src/stores/db.js
// Responsável por ler e escrever no Firestore.
// Completamente separado da UI — nenhum componente acessa Firestore diretamente.

import { doc, setDoc, onSnapshot } from 'firebase/firestore'
import { db }                       from '../lib/firebase.js'
import { syncStatus, hydrateState, serializeState } from './state.js'

let _unsubscribe = null
let _saveTimer   = null
const COLLECTION  = 'studyos_users'

/** Inicia listener em tempo real para o documento do usuário */
export function subscribeUser(uid) {
  unsubscribeUser()
  syncStatus.set('saving')

  _unsubscribe = onSnapshot(
    doc(db, COLLECTION, uid),
    (snap) => {
      if (snap.exists()) hydrateState(snap.data())
      syncStatus.set('ok')
    },
    (err) => {
      console.error('Firestore snapshot error:', err)
      syncStatus.set('err')
    }
  )
}

/** Para de escutar o documento (usado no logout) */
export function unsubscribeUser() {
  if (_unsubscribe) { _unsubscribe(); _unsubscribe = null }
}

/** Salva estado no Firestore com debounce de 1s */
export function save(uid) {
  if (!uid) return
  clearTimeout(_saveTimer)
  syncStatus.set('saving')

  _saveTimer = setTimeout(async () => {
    try {
      await setDoc(doc(db, COLLECTION, uid), serializeState())
      syncStatus.set('ok')
    } catch (err) {
      console.error('Save error:', err)
      syncStatus.set('err')
    }
  }, 1000)
}

// ── Fallback localStorage (quando Firebase não está configurado) ──
const LS_PREFIX = 'sos_'

export function lsSave() {
  const data = serializeState()
  Object.entries(data).forEach(([k, v]) => {
    try { localStorage.setItem(LS_PREFIX + k, JSON.stringify(v)) } catch {}
  })
}

export function lsLoad() {
  const keys = ['pages','folders','tasks','materias','horas','goals','notas',
                 'pomo','pomoCfg','streak','metaSemanal','openFolders','gcalClientId']
  const data = {}
  keys.forEach(k => {
    try {
      const raw = localStorage.getItem(LS_PREFIX + k)
      if (raw != null) data[k] = JSON.parse(raw)
    } catch {}
  })
  hydrateState(data)
}
