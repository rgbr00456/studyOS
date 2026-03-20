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

<style>
  :global {

  .view-content-wide { padding:0 24px 40px;max-width:1000px;margin:0 auto; }
  .card { background:var(--s1);border:1px solid var(--border);border-radius:var(--r-lg);padding:20px; }
  .cal-nav { display:flex;align-items:center;justify-content:space-between;margin-bottom:20px; }
  .cal-title { font-family:var(--font-serif);font-size:22px;font-weight:600;color:var(--text); }
  .nav-btn { width:34px;height:34px;background:var(--s2);border:1px solid var(--border);
    border-radius:var(--r-sm);color:var(--t2);font-size:20px;display:flex;align-items:center;
    justify-content:center;cursor:pointer;transition:all 0.12s; }
  .nav-btn:hover { border-color:var(--border2);color:var(--text); }
  .dow-row { display:grid;grid-template-columns:repeat(7,1fr);gap:2px;margin-bottom:4px; }
  .dow-cell { font-size:11px;color:var(--t3);text-align:center;padding:4px 0;font-weight:600;letter-spacing:0.04em; }
  .cal-grid { display:grid;grid-template-columns:repeat(7,1fr);gap:2px; }
  .cal-cell { min-height:72px;background:var(--s2);border:1px solid var(--border);
    border-radius:var(--r);padding:6px;cursor:pointer;transition:all 0.12s;position:relative; }
  .cal-cell:hover { border-color:var(--border2);background:var(--s3); }
  .cal-cell.today { border-color:rgba(201,169,110,0.4);background:var(--accent-glow); }
  .cal-cell.other { opacity:0.3;cursor:default; }
  .cal-cell.selected { border-color:var(--accent); }
  .day-num { font-size:12px;font-weight:500;color:var(--t2);margin-bottom:4px; }
  .cal-cell.today .day-num { color:var(--accent);font-weight:700; }
  .events { display:flex;flex-direction:column;gap:2px; }
  .event-dot { font-size:10px;border-radius:3px;padding:1px 4px;
    white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%; }
  .event-more { font-size:10px;color:var(--t3);padding:1px 4px; }
  .detail-panel { background:var(--s1);border:1px solid var(--border2);border-radius:var(--r-lg);
    padding:20px;margin-top:16px; }
  .detail-head { display:flex;align-items:center;justify-content:space-between;margin-bottom:16px; }
  .detail-title { font-family:var(--font-serif);font-size:16px;font-weight:600;color:var(--text); }
  .close-btn { background:none;border:none;color:var(--t3);cursor:pointer;font-size:16px;padding:4px; }
  .close-btn:hover { color:var(--text); }
  .task-row { display:flex;align-items:flex-start;gap:10px;padding:10px 0;
    border-bottom:1px solid var(--border); }
  .task-row:last-child { border-bottom:none; }
  .task-row.done .task-text { text-decoration:line-through;color:var(--t3); }
  .task-cb { width:16px;height:16px;border-radius:4px;border:1.5px solid var(--border3);
    appearance:none;-webkit-appearance:none;cursor:pointer;flex-shrink:0;margin-top:2px;
    transition:all 0.15s;background:none; }
  .task-cb:checked { background:var(--green);border-color:var(--green); }
  .task-body { flex:1; }
  .task-text { font-size:14px;color:var(--text);line-height:1.4; }
  .task-meta { display:flex;align-items:center;gap:6px;margin-top:4px; }
  .time-label { font-size:12px;color:var(--t2); }

  }
</style>
