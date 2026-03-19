import { writable } from 'svelte/store'

export const activeView   = writable('dashboard')
export const syncStatus   = writable('ok')
export const toastMessage = writable(null)
export const dialogState  = writable(null)
export const searchOpen   = writable(false)
export const cadernoOpen  = writable(true)

let _toastTimer = null
export function showToast(msg, duration = 2500) {
  toastMessage.set(msg)
  clearTimeout(_toastTimer)
  _toastTimer = setTimeout(() => toastMessage.set(null), duration)
}

// ── Dialog helpers ────────────────────────────────────────────────
function openDialog(config) {
  return new Promise(resolve => dialogState.set({ ...config, resolve }))
}

export function dlgAlert(msg, { icon = 'ℹ️', title = 'Aviso' } = {}) {
  return openDialog({ icon, title, msg, type: 'alert',
    buttons: [{ label: 'OK', primary: true, value: true }] })
}

export function dlgConfirm(msg, { icon = '⚠️', title = 'Confirmar',
    confirmLabel = 'Confirmar', dangerConfirm = false } = {}) {
  return openDialog({ icon, title, msg, type: 'confirm', buttons: [
    { label: 'Cancelar', value: false },
    { label: confirmLabel, value: true, primary: !dangerConfirm, danger: dangerConfirm }
  ]})
}

export function dlgPrompt(msg, { icon = '✏️', title = '', inputLabel = '',
    placeholder = '', defaultValue = '' } = {}) {
  return openDialog({ icon, title: title || msg, msg: title ? msg : '',
    inputLabel, placeholder, type: 'prompt',
    buttons: [
      { label: 'Cancelar', value: null },
      { label: 'Confirmar', primary: true, value: '__input__' }
    ]
  })
}
