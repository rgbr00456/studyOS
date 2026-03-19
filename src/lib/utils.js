// ─── Utility Helpers ─────────────────────────────────────────────────────────

export const getTodayISO  = () => new Date().toISOString().split('T')[0]
export const getToday     = () => new Date().toLocaleDateString('pt-BR')

export function fmtISO(iso) {
  if (!iso) return ''
  const [y, m, d] = iso.split('-')
  return `${d}/${m}`
}

export function fmtISOFull(iso) {
  if (!iso) return ''
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

export function isThisWeek(iso) {
  if (!iso) return false
  const d = new Date(iso + 'T00:00:00')
  const now = new Date()
  const start = new Date(now)
  start.setDate(now.getDate() - now.getDay() + 1)
  start.setHours(0, 0, 0, 0)
  const end = new Date(start)
  end.setDate(start.getDate() + 7)
  return d >= start && d < end
}

/** A task "belongs to today" if scheduled for today, created today, or flagged urgent/hoje */
export function isTaskToday(task) {
  const today = getTodayISO()
  if (task.dataVenc === today) return true
  if (!task.dataVenc && task.criado === today) return true
  if (!task.dataVenc && (task.prio === 'hoje' || task.prio === 'urgente') && !task.done) return true
  return false
}

export function discMedia(m) {
  const ns = [m.n1, m.n2, m.n3, m.n4].filter(n => n !== '' && n != null && !isNaN(parseFloat(n)))
  return ns.length ? ns.reduce((a, b) => a + parseFloat(b), 0) / ns.length : null
}

export function addOneHour(time) {
  const [h, m] = time.split(':')
  return `${String(Math.min(23, parseInt(h) + 1)).padStart(2, '0')}:${m}`
}

export function addOneDay(iso) {
  const d = new Date(iso + 'T00:00:00')
  d.setDate(d.getDate() + 1)
  return d.toISOString().split('T')[0]
}

export const CORES = ['#c9a96e','#52c48a','#6b9ae8','#9b7ee8','#d96b6b','#e8a84b','#5bc8f5','#d96b9b']
export const DIAS  = ['Seg','Ter','Qua','Qui','Sex','Sáb','Dom']
export const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
export const DOWS  = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb']

export const COVER_GRADIENTS = [
  'linear-gradient(135deg,#1a1a2e,#16213e)',
  'linear-gradient(135deg,#0d1b2a,#1b2838)',
  'linear-gradient(135deg,#1a0a0a,#2e1a00)',
  'linear-gradient(135deg,#0a1a0a,#1a2e1a)',
  'linear-gradient(135deg,#1a0a2e,#0a1a2e)',
  'linear-gradient(135deg,#2e1a0a,#1a0a2e)',
]
