<script>
  import { state } from '../../stores/state.js'
  import { MESES, DOWS } from '../../lib/utils.js'

  let year  = new Date().getFullYear()
  let month = new Date().getMonth()
  let selectedIso = null

  // ── Build calendar grid ────────────────────────────────────
  $: title = `${MESES[month]} ${year}`

  $: days = (() => {
    const hoje = new Date(); hoje.setHours(0,0,0,0)
    const firstDay = new Date(year, month, 1).getDay()
    const dim      = new Date(year, month + 1, 0).getDate()
    const dip      = new Date(year, month, 0).getDate()
    const cells    = []

    // Prev month filler
    for (let i = firstDay - 1; i >= 0; i--)
      cells.push({ day: dip - i, iso: null, other: true, isToday: false, tasks: [] })

    // Current month
    for (let d = 1; d <= dim; d++) {
      const iso = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`
      const isToday = new Date(year, month, d).getTime() === hoje.getTime()
      const tasks   = $state.tasks.filter(t => t.dataVenc === iso)
      cells.push({ day: d, iso, other: false, isToday, tasks })
    }

    // Next month filler
    const rem = (firstDay + dim) % 7 === 0 ? 0 : 7 - (firstDay + dim) % 7
    for (let d = 1; d <= rem; d++)
      cells.push({ day: d, iso: null, other: true, isToday: false, tasks: [] })

    return cells
  })()

  $: selectedTasks = selectedIso ? $state.tasks.filter(t => t.dataVenc === selectedIso) : []
  $: selectedLabel = selectedIso ? (() => {
    const [y,mo,d] = selectedIso.split('-')
    return `${d}/${mo}/${y} — ${MESES[parseInt(mo)-1]}`
  })() : ''

  function prev() { month--; if (month < 0) { month = 11; year-- }; selectedIso = null }
  function next() { month++; if (month > 11) { month = 0; year++ }; selectedIso = null }

  function selectDay(iso) {
    if (!iso) return
    selectedIso = selectedIso === iso ? null : iso
  }

  function taskColor(t) {
    return t.done ? 'var(--green)' : t.prio === 'urgente' ? 'var(--red)' : t.prio === 'importante' ? 'var(--amber)' : 'var(--blue)'
  }

  const PRIO_CLASS = { urgente: 'badge-red', importante: 'badge-amber', normal: 'badge-neutral' }
</script>

<div class="view-header">
  <div class="view-title">Calendário</div>
  <div class="view-subtitle">Tarefas e prazos num só lugar</div>
</div>

<div class="view-content-wide">
  <div class="card">
    <!-- Nav -->
    <div class="cal-nav">
      <button class="nav-btn" on:click={prev}>‹</button>
      <div class="cal-title">{title}</div>
      <button class="nav-btn" on:click={next}>›</button>
    </div>

    <!-- Day-of-week headers -->
    <div class="dow-row">
      {#each DOWS as dow}
        <div class="dow-cell">{dow}</div>
      {/each}
    </div>

    <!-- Day grid -->
    <div class="cal-grid">
      {#each days as cell}
        <div
          class="cal-cell"
          class:other={cell.other}
          class:today={cell.isToday}
          class:selected={cell.iso === selectedIso}
          class:has-items={cell.tasks.length > 0}
          on:click={() => selectDay(cell.iso)}
          role="button" tabindex={cell.other ? -1 : 0}
        >
          <div class="day-num">{cell.day}</div>
          <div class="events">
            {#each cell.tasks.slice(0, 3) as t}
              <div class="event-dot"
                style="background:{taskColor(t)}22;color:{taskColor(t)}">
                · {t.texto}
              </div>
            {/each}
            {#if cell.tasks.length > 3}
              <div class="event-more">+{cell.tasks.length - 3}</div>
            {/if}
          </div>
        </div>
      {/each}
    </div>
  </div>

  <!-- Day detail panel -->
  {#if selectedIso}
    <div class="detail-panel">
      <div class="detail-head">
        <div class="detail-title">{selectedLabel}</div>
        <button class="close-btn" on:click={() => selectedIso = null}>✕</button>
      </div>

      {#if !selectedTasks.length}
        <div style="font-size:13px;color:var(--t3);padding:12px 0">
          Nenhuma tarefa para este dia.
          <br><span style="font-size:12px">Adicione uma tarefa com esta data na aba Tarefas.</span>
        </div>
      {:else}
        {#each selectedTasks as t (t.id)}
          <div class="task-row" class:done={t.done}>
            <input type="checkbox" class="task-cb" checked={t.done}
              on:change={() => state.toggleTask(t.id)} />
            <div class="task-body">
              <div class="task-text">{t.texto}</div>
              <div class="task-meta">
                <span class="badge {PRIO_CLASS[t.prio] || 'badge-neutral'}">{t.prio}</span>
                {#if t.hora}
                  <span class="time-label">🕐 {t.hora}</span>
                {/if}
              </div>
            </div>
          </div>
        {/each}
      {/if}
    </div>
  {/if}
</div>
