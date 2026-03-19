// ─── Application State Store ──────────────────────────────────────────────────
// Single source of truth. Components read/write via this store.
// Persistence (Firestore + localStorage) is handled in lib/db.js.
import { writable, derived } from 'svelte/store'
import { getTodayISO, isTaskToday, discMedia } from '../lib/utils.js'

function createState() {
  const defaults = {
    pages:       [],
    folders:     [],
    tasks:       [],
    materias:    [],
    horas:       [0,0,0,0,0,0,0],
    goals:       [],
    notas:       [],
    pomo:        { date: '', count: 0, history: [] },
    pomoCfg:     { foco: 25, curto: 5, longo: 15, sessoes: 4 },
    streak:      { lastDate: '', count: 0 },
    gcalClientId: '',
    metaSemanal:  20,
    openFolders:  [],
    currentPageId: null,
  }

  const { subscribe, set, update } = writable({ ...defaults })

  return {
    subscribe, set, update,
    reset: () => set({ ...defaults }),

    /** Patch specific keys */
    patch: (partial) => update(s => ({ ...s, ...partial })),

    // ── Task helpers ──────────────────────────────────────────
    addTask: (task) => update(s => ({ ...s, tasks: [...s.tasks, task] })),
    toggleTask: (id) => update(s => ({
      ...s,
      tasks: s.tasks.map(t => t.id === id ? { ...t, done: !t.done } : t)
    })),
    deleteTask: (id) => update(s => ({ ...s, tasks: s.tasks.filter(t => t.id !== id) })),
    clearDone: () => update(s => ({ ...s, tasks: s.tasks.filter(t => !t.done) })),
    updateTaskGcal: (id, gcalId) => update(s => ({
      ...s, tasks: s.tasks.map(t => t.id === id ? { ...t, gcalId } : t)
    })),

    // ── Materia helpers ───────────────────────────────────────
    addMateria: (m) => update(s => ({ ...s, materias: [...s.materias, m] })),
    deleteMateria: (id) => update(s => ({ ...s, materias: s.materias.filter(m => m.id !== id) })),
    updateMateriaNota: (id, campo, val) => update(s => ({
      ...s,
      materias: s.materias.map(m => m.id === id ? { ...m, [campo]: val } : m)
    })),

    // ── Page helpers ──────────────────────────────────────────
    addPage: (page) => update(s => ({ ...s, pages: [...s.pages, page], currentPageId: page.id })),
    deletePage: (id) => update(s => ({
      ...s,
      pages: s.pages.filter(p => p.id !== id),
      currentPageId: s.currentPageId === id ? null : s.currentPageId
    })),
    updatePage: (id, partial) => update(s => ({
      ...s,
      pages: s.pages.map(p => p.id === id ? { ...p, ...partial, updated: new Date().toLocaleDateString('pt-BR') } : p)
    })),
    updatePageBlocks: (id, blocks) => update(s => ({
      ...s,
      pages: s.pages.map(p => p.id === id ? { ...p, blocks } : p)
    })),
    movePageToFolder: (pageId, folderId) => update(s => ({
      ...s,
      pages: s.pages.map(p => p.id === pageId ? { ...p, folderId } : p)
    })),

    // ── Folder helpers ────────────────────────────────────────
    addFolder: (folder) => update(s => ({
      ...s,
      folders: [...s.folders, folder],
      openFolders: [...(s.openFolders || []), folder.id]
    })),
    deleteFolder: (id) => update(s => ({
      ...s,
      folders: s.folders.filter(f => f.id !== id),
      pages: s.pages.map(p => p.folderId === id ? { ...p, folderId: '' } : p)
    })),
    toggleFolder: (id) => update(s => {
      const open = s.openFolders || []
      return {
        ...s,
        openFolders: open.includes(id) ? open.filter(i => i !== id) : [...open, id]
      }
    }),

    // ── Goal helpers ──────────────────────────────────────────
    addGoal: (goal) => update(s => ({ ...s, goals: [...s.goals, goal] })),
    updateGoal: (id, atual) => update(s => ({
      ...s,
      goals: s.goals.map(g => g.id === id ? { ...g, atual: Math.min(atual, g.total) } : g)
    })),
    deleteGoal: (id) => update(s => ({ ...s, goals: s.goals.filter(g => g.id !== id) })),

    // ── Nota helpers ──────────────────────────────────────────
    addNota: (nota) => update(s => ({ ...s, notas: [nota, ...s.notas] })),
    deleteNota: (id) => update(s => ({ ...s, notas: s.notas.filter(n => n.id !== id) })),

    // ── Streak ────────────────────────────────────────────────
    checkStreak: () => update(s => {
      const today = getTodayISO()
      if (s.streak.lastDate === today) return s
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      const yISO = yesterday.toISOString().split('T')[0]
      const count = s.streak.lastDate === yISO ? s.streak.count + 1 : 1
      return { ...s, streak: { lastDate: today, count } }
    }),
  }
}

export const state = createState()

// ── Derived stores (computed from state) ──────────────────────────────────────
export const todayTasks = derived(state, $s => $s.tasks.filter(isTaskToday))

export const pendingTasks = derived(state, $s => $s.tasks.filter(t => !t.done))

export const totalHoras = derived(state, $s => ($s.horas || []).reduce((a, b) => a + b, 0))

export const bestMateria = derived(state, $s => {
  let best = null, bestNome = 'sem dados'
  $s.materias.forEach(m => {
    const med = discMedia(m)
    if (med !== null && (best === null || med > best)) { best = med; bestNome = m.nome }
  })
  return { media: best, nome: bestNome }
})

export const pomodorosHoje = derived(state, $s => {
  const today = getTodayISO()
  const p = $s.pomo || { date: '', count: 0 }
  return p.date === today ? p.count : 0
})
