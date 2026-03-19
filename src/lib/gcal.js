// ─── Google Calendar Integration ─────────────────────────────────────────────
import { auth } from '../firebase.js'
import { GoogleAuthProvider, reauthenticateWithPopup, signInWithPopup, linkWithPopup } from 'firebase/auth'
import { safeUrl } from './security.js'
import { addOneHour, addOneDay } from './utils.js'
import { gcalToken, isGoogleUser } from '../stores/auth.js'
import { get } from 'svelte/store'

const CALENDAR_SCOPE = 'https://www.googleapis.com/auth/calendar.events'

export async function requestCalendarAccess() {
  if (!auth?.currentUser) throw new Error('Faça login primeiro.')

  const provider = new GoogleAuthProvider()
  provider.addScope(CALENDAR_SCOPE)

  if (get(isGoogleUser)) {
    provider.setCustomParameters({ login_hint: auth.currentUser.email, prompt: 'consent' })
    const result = await reauthenticateWithPopup(auth.currentUser, provider)
    return GoogleAuthProvider.credentialFromResult(result)?.accessToken ?? null
  } else {
    provider.setCustomParameters({ prompt: 'select_account' })
    try {
      const result = await linkWithPopup(auth.currentUser, provider)
      return GoogleAuthProvider.credentialFromResult(result)?.accessToken ?? null
    } catch {
      const result = await signInWithPopup(auth, provider)
      return GoogleAuthProvider.credentialFromResult(result)?.accessToken ?? null
    }
  }
}

export async function addEventToCalendar(task, getMateriaName) {
  const token = get(gcalToken)
  if (!token) throw new Error('Conecte o Google Agenda primeiro.')

  const startDate = task.dataVenc + (task.hora ? 'T' + task.hora + ':00' : '')
  const endDate   = task.dataVenc + (task.hora ? 'T' + addOneHour(task.hora) + ':00' : '')

  const event = {
    summary: `📚 ${task.texto}`,
    description: `Matéria: ${task.materiaId ? getMateriaName(task.materiaId) : '—'}\nPrioridade: ${task.prio}\nCriado pelo StudyOS`,
    start: task.hora
      ? { dateTime: startDate, timeZone: 'America/Sao_Paulo' }
      : { date: task.dataVenc },
    end: task.hora
      ? { dateTime: endDate, timeZone: 'America/Sao_Paulo' }
      : { date: addOneDay(task.dataVenc) },
    reminders: {
      useDefault: false,
      overrides: [{ method: 'popup', minutes: 60 }, { method: 'email', minutes: 1440 }]
    },
    colorId: '5'
  }

  const res  = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(event)
  })
  const data = await res.json()
  if (!data.id) throw new Error('Erro ao criar evento: ' + (data.error?.message ?? 'resposta inválida'))
  return data.id
}
