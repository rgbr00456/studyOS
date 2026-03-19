// src/stores/dialog.js
// Sistema de diálogos customizados via Svelte store.
// Qualquer componente pode abrir um diálogo sem depender de prompt/confirm do browser.

import { writable } from 'svelte/store'

// Estado do diálogo ativo
export const dialog = writable(null)
// null = fechado | { type, icon, title, msg, inputLabel, placeholder, defaultValue, resolve }

function open(config) {
  return new Promise(resolve => {
    dialog.set({ ...config, resolve })
  })
}

export function closeDialog(value) {
  dialog.update(d => {
    if (d?.resolve) d.resolve(value)
    return null
  })
}

/** Alerta simples — só OK */
export function dlgAlert(msg, { icon = 'ℹ️', title = 'Aviso' } = {}) {
  return open({ type: 'alert', icon, title, msg })
}

/** Confirmação — Cancelar / Confirmar */
export function dlgConfirm(msg, {
  icon           = '⚠️',
  title          = 'Confirmar',
  confirmLabel   = 'Confirmar',
  dangerConfirm  = false,
} = {}) {
  return open({ type: 'confirm', icon, title, msg, confirmLabel, dangerConfirm })
}

/** Prompt — campo de texto */
export function dlgPrompt(msg, {
  icon         = '✏️',
  title        = '',
  inputLabel   = '',
  placeholder  = '',
  defaultValue = '',
} = {}) {
  return open({
    type: 'prompt', icon,
    title:        title || msg,
    msg:          title ? msg : '',
    inputLabel, placeholder, defaultValue,
  })
}
