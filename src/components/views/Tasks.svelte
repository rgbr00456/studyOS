<script>
  import { state } from '../../stores/state.js'
  import { showToast, dlgConfirm } from '../../stores/ui.js'
  import { gcalToken, isGoogleUser } from '../../stores/auth.js'
  import { getTodayISO, getToday, isThisWeek, fmtISOFull } from '../../lib/utils.js'
  import { addEventToCalendar } from '../../lib/gcal.js'
  import { requestCalendarAccess } from '../../lib/gcal.js'

  // ── Form state ─────────────────────────────────────────────
  let texto = '', materiaId = '', prio = 'normal', dataVenc = '', hora = ''
  let sendToGcal = false
  let taskFilter = 'todas'

  // ── Helpers ────────────────────────────────────────────────
  function getMateriaName(id) {
    const m = $state.materias.find(m => m.id === id)
    return m ? `${m.emoji || '📖'} ${m.nome}` : '?'
  }

  // ── Filtered + sorted tasks ────────────────────────────────
  const PRIO_ORDER = { urgente: 0, importante: 1, normal: 2 }

  $: filteredTasks = (() => {
    const today = getTodayISO()
    const base = {
      todas:     () => $state.tasks,
      hoje:      () => $state.tasks.filter(t => {
        if (t.dataVenc === today) return true
        if (!t.dataVenc && t.criado === today) return true
        if (!t.dataVenc && (t.prio === 'hoje' || t.prio === 'urgente') && !t.done) return true
        return false
      }),
      semana:    () => $state.tasks.filter(t => isThisWeek(t.dataVenc)),
      pendentes: () => $state.tasks.filter(t => !t.done),
      urgentes:  () => $state.tasks.filter(t => t.prio === 'urgente' && !t.done),
      concluidas:() => $state.tasks.filter(t => t.done),
    }[taskFilter] || (() => $state.tasks)

    return base().slice().sort((a, b) =>
      (PRIO_ORDER[a.prio] ?? 2) - (PRIO_ORDER[b.prio] ?? 2)
    )
  })()

  $: pending = filteredTasks.filter(t => !t.done)
  $: done    = filteredTasks.filter(t => t.done)

  // ── Add task ───────────────────────────────────────────────
  async function addTask() {
    const t = texto.trim().substring(0, 500)
    if (!t) { showToast('Digite a descrição da tarefa.'); return }

    const task = {
      id: Date.now().toString(),
      texto: t, materiaId, prio, dataVenc, hora,
      done: false, gcalId: '',
      criado: getTodayISO(), criadoPTBR: getToday()
    }
    state.addTask(task)
    showToast('Tarefa adicionada! ✓')
    texto = ''; dataVenc = ''; hora = ''

    if (sendToGcal && task.dataVenc) await pushToGCal(task)
  }

  async function pushToGCal(task) {
    if (!$gcalToken) {
      try {
        const token = await requestCalendarAccess()
        if (!token) return
        gcalToken.set(token)
      } catch { return }
    }
    try {
      const gcalId = await addEventToCalendar(task, getMateriaName)
      state.updateTaskGcal(task.id, gcalId)
      showToast('Adicionado ao Google Agenda! 📅')
    } catch (e) {
      showToast('Erro ao criar evento no Agenda.')
    }
  }

  async function handleDelete(id) {
    state.deleteTask(id)
  }

  async function clearDone() {
    const ok = await dlgConfirm('Remover todas as tarefas concluídas?',
      { icon: '🗑️', title: 'Limpar concluídas', confirmLabel: 'Remover', dangerConfirm: true })
    if (!ok) return
    state.clearDone()
    showToast('Tarefas concluídas removidas.')
  }

  const PRIO_CLASS = { urgente: 'badge-red', importante: 'badge-amber', normal: 'badge-neutral' }
  const FILTERS = [
    ['todas','Todas'], ['hoje','Hoje'], ['semana','Esta semana'],
    ['pendentes','Pendentes'], ['urgentes','Urgentes'], ['concluidas','Concluídas']
  ]
</script>

<div class="view-header">
  <div class="view-title">Tarefas</div>
  <div class="view-subtitle">Gerencie e agende suas tarefas no Google Agenda</div>
</div>

<div class="view-content">
  <!-- Add task form -->
  <div class="card" style="margin-bottom:20px">
    <div class="card-head"><div class="card-title">Nova tarefa</div></div>
    <div class="inp-row">
      <input class="inp" bind:value={texto} placeholder="Descrição da tarefa..."
        on:keydown={e => e.key === 'Enter' && addTask()} />
    </div>
    <div class="form-grid">
      <div>
        <label class="inp-label">Matéria</label>
        <select class="inp" bind:value={materiaId}>
          <option value="">Nenhuma</option>
          {#each $state.materias as m}
            <option value={m.id}>{m.emoji || '📖'} {m.nome}</option>
          {/each}
        </select>
      </div>
      <div>
        <label class="inp-label">Prioridade</label>
        <select class="inp" bind:value={prio}>
          <option value="normal">Normal</option>
          <option value="importante">Importante</option>
          <option value="urgente">Urgente</option>
        </select>
      </div>
      <div>
        <label class="inp-label">Data de vencimento</label>
        <input class="inp" type="date" bind:value={dataVenc} />
      </div>
      <div>
        <label class="inp-label">Horário</label>
        <input class="inp" type="time" bind:value={hora} />
      </div>
    </div>
    <div class="add-row">
      <button class="btn btn-full" on:click={addTask}>+ Adicionar tarefa</button>
      <label class="gcal-toggle">
        <input type="checkbox" bind:checked={sendToGcal} style="accent-color:var(--accent)">
        Adicionar ao Google Agenda
      </label>
    </div>
  </div>

  <!-- Filters -->
  <div class="filters">
    {#each FILTERS as [key, label]}
      <button class="filter-btn" class:active={taskFilter === key}
        on:click={() => taskFilter = key}>{label}</button>
    {/each}
    <button class="btn-ghost" style="margin-left:auto;font-size:12px;padding:5px 10px"
      on:click={clearDone}>Limpar concluídas</button>
  </div>

  <!-- Task list -->
  <div class="card">
    {#if !filteredTasks.length}
      <div class="empty">Nenhuma tarefa nesta categoria</div>
    {:else}
      {#if pending.length}
        <div class="section-head">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/></svg>
          Pendentes ({pending.length})
        </div>
        {#each pending as t (t.id)}
          <div class="task-row">
            <input type="checkbox" class="task-cb" checked={t.done}
              on:change={() => state.toggleTask(t.id)} />
            <div class="task-body">
              <div class="task-text">{t.texto}</div>
              <div class="task-meta">
                {#if t.materiaId}
                  <span class="badge badge-neutral">{getMateriaName(t.materiaId)}</span>
                {/if}
                <span class="badge {PRIO_CLASS[t.prio] || 'badge-neutral'}">{t.prio}</span>
                {#if t.dataVenc}
                  <span class="date-label">📅 {fmtISOFull(t.dataVenc)}{t.hora ? ' ' + t.hora : ''}</span>
                {/if}
                {#if t.gcalId}
                  <span class="gcal-badge">📅 Agendado</span>
                {/if}
              </div>
            </div>
            <button class="task-del" on:click={() => handleDelete(t.id)}>×</button>
          </div>
        {/each}
      {/if}

      {#if done.length}
        <div class="section-head" style="margin-top:8px">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--green)" stroke-width="2.5"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><path d="M22 4L12 14.01l-3-3"/></svg>
          Concluídas ({done.length})
        </div>
        {#each done as t (t.id)}
          <div class="task-row done">
            <input type="checkbox" class="task-cb" checked={true}
              on:change={() => state.toggleTask(t.id)} />
            <div class="task-body">
              <div class="task-text">{t.texto}</div>
            </div>
            <button class="task-del" on:click={() => handleDelete(t.id)}>×</button>
          </div>
        {/each}
      {/if}
    {/if}
  </div>
</div>
