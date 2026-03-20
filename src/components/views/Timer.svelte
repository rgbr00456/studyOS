<script>
  import { onDestroy } from 'svelte'
  import { state } from '../../stores/state.js'
  import { showToast } from '../../stores/ui.js'
  import { getTodayISO } from '../../lib/utils.js'

  // ── Timer state ────────────────────────────────────────────
  let mode      = 'foco'   // 'foco' | 'curto' | 'longo'
  let running   = false
  let secs      = 25 * 60
  let total     = 25 * 60
  let interval  = null
  let t0        = 0
  let s0        = 0
  let timerMateriaId = ''

  // ── Config (local, synced with store) ──────────────────────
  let cfg = { ...$state.pomoCfg }

  // ── Derived ────────────────────────────────────────────────
  $: minutes  = String(Math.floor(secs / 60)).padStart(2, '0')
  $: seconds  = String(secs % 60).padStart(2, '0')
  $: arcOffset = 603.2 * (1 - secs / total)
  $: label    = running ? (mode === 'foco' ? 'Foco ativo 🔥' : 'Descansando 😌') : secs === total ? 'Pronto' : 'Pausado'

  $: todayCount = (() => {
    const today = getTodayISO()
    const p = $state.pomo || { date: '', count: 0 }
    return p.date === today ? p.count : 0
  })()

  $: dots = Array.from({ length: cfg.sessoes }, (_, i) => {
    const active = todayCount % cfg.sessoes
    const full   = todayCount > 0 && todayCount % cfg.sessoes === 0
    return i < (full ? cfg.sessoes : active)
  })

  $: history = (() => {
    const today = getTodayISO()
    const p = $state.pomo || { date: '', count: 0, history: [] }
    return p.date === today ? [...(p.history || [])].reverse() : []
  })()

  // ── Timer control ──────────────────────────────────────────
  function setMode(m) {
    if (running) return
    mode  = m
    secs  = total = cfg[m] * 60
  }

  function toggle() {
    if (running) {
      clearInterval(interval); running = false
    } else {
      running = true; t0 = Date.now(); s0 = secs
      interval = setInterval(() => {
        secs = Math.max(0, s0 - Math.floor((Date.now() - t0) / 1000))
        if (secs <= 0) finish()
      }, 500)
    }
  }

  function reset() {
    clearInterval(interval); running = false
    secs = total = cfg[mode] * 60
  }

  function finish() {
    clearInterval(interval); running = false
    if (mode === 'foco') {
      // Record session
      const today = getTodayISO()
      const cur   = $state.pomo || { date: '', count: 0, history: [] }
      const pomo  = cur.date !== today
        ? { date: today, count: 1, history: [] }
        : { ...cur, count: cur.count + 1, history: [...(cur.history || [])] }

      const matName = timerMateriaId
        ? ($state.materias.find(m => m.id === timerMateriaId)?.nome || '—')
        : '—'

      pomo.history.push({
        time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        mat:  matName,
        dur:  cfg.foco
      })

      state.patch({ pomo })
      state.checkStreak()
      showToast('Sessão concluída! 🎉')
      // Auto-advance to break
      setMode(pomo.count % cfg.sessoes === 0 ? 'longo' : 'curto')
      secs = total = cfg[mode] * 60
    } else {
      showToast('Descansado! Hora de focar 💪')
      setMode('foco')
      secs = total = cfg.foco * 60
    }
  }

  function applyCfg() {
    state.patch({ pomoCfg: { ...cfg } })
    reset()
  }

  onDestroy(() => clearInterval(interval))

  const MODES = [['foco','Foco'], ['curto','Pausa curta'], ['longo','Pausa longa']]
</script>

<div class="view-header">
  <div class="view-title">Pomodoro</div>
  <div class="view-subtitle">Técnica de foco — sessões de {cfg.foco} minutos</div>
</div>

<div class="view-content">
  <div class="two-col">
    <!-- Timer card -->
    <div class="card">
      <div class="timer-hero">
        <!-- Mode tabs -->
        <div class="mode-tabs">
          {#each MODES as [key, label]}
            <button class="mtab" class:active={mode === key}
              on:click={() => setMode(key)}>{label}</button>
          {/each}
        </div>

        <!-- SVG ring -->
        <div class="ring-wrap">
          <svg width="220" height="220" viewBox="0 0 220 220">
            <circle cx="110" cy="110" r="96" fill="none" stroke="var(--s4)" stroke-width="8"/>
            <circle cx="110" cy="110" r="96" fill="none"
              stroke="var(--accent)" stroke-width="8" stroke-linecap="round"
              stroke-dasharray="603.2" stroke-dashoffset={arcOffset}
              style="transform:rotate(-90deg);transform-origin:110px 110px;transition:stroke-dashoffset 0.5s linear"/>
          </svg>
          <div class="ring-center">
            <div class="time-display">{minutes}:{seconds}</div>
            <div class="time-label">{label}</div>
          </div>
        </div>

        <!-- Materia select -->
        <div style="width:100%;margin-bottom:14px">
          <label class="inp-label">Estudando:</label>
          <select class="inp" bind:value={timerMateriaId}>
            <option value="">Selecione a matéria</option>
            {#each $state.materias as m}
              <option value={m.id}>{m.emoji || '📖'} {m.nome}</option>
            {/each}
          </select>
        </div>

        <!-- Controls -->
        <div class="controls">
          <button class="btn-ghost" on:click={reset}>↺ Resetar</button>
          <button class="btn" on:click={toggle}>
            {running ? '⏸ Pausar' : secs < total ? '▶ Continuar' : '▶ Iniciar'}
          </button>
        </div>

        <!-- Session dots -->
        <div class="sessions">
          <div style="font-size:13px;color:var(--t2)">
            Sessões hoje: <strong>{todayCount}</strong>
          </div>
          <div class="dots">
            {#each dots as active}
              <div class="dot" class:active></div>
            {/each}
          </div>
        </div>
      </div>
    </div>

    <!-- Config + History -->
    <div style="display:flex;flex-direction:column;gap:12px">
      <div class="card">
        <div class="card-head"><div class="card-title">Configurações</div></div>
        <div class="cfg-grid">
          <div>
            <label class="inp-label">Foco (min)</label>
            <input class="inp" type="number" min="1" max="90" bind:value={cfg.foco} on:change={applyCfg} />
          </div>
          <div>
            <label class="inp-label">Pausa curta (min)</label>
            <input class="inp" type="number" min="1" max="30" bind:value={cfg.curto} on:change={applyCfg} />
          </div>
          <div>
            <label class="inp-label">Pausa longa (min)</label>
            <input class="inp" type="number" min="1" max="60" bind:value={cfg.longo} on:change={applyCfg} />
          </div>
          <div>
            <label class="inp-label">Sessões / ciclo</label>
            <input class="inp" type="number" min="2" max="8" bind:value={cfg.sessoes} on:change={applyCfg} />
          </div>
        </div>
      </div>

      <div class="card" style="flex:1">
        <div class="card-head"><div class="card-title">Histórico de hoje</div></div>
        {#if !history.length}
          <p style="font-size:13px;color:var(--t3)">Nenhuma sessão hoje</p>
        {:else}
          <table class="tbl">
            {#each history as h}
              <tr>
                <td>{h.time}</td>
                <td>{h.mat}</td>
                <td><span class="badge badge-amber">{h.dur}min</span></td>
              </tr>
            {/each}
          </table>
        {/if}
      </div>
    </div>
  </div>
</div>

<style>
  :global {

  .card { background:var(--s1);border:1px solid var(--border);border-radius:var(--r-lg);padding:20px; }
  .card-head { display:flex;align-items:center;justify-content:space-between;margin-bottom:16px; }
  .card-title { font-size:13px;font-weight:600;color:var(--text); }
  .two-col { display:grid;grid-template-columns:1fr 1fr;gap:16px; }
  .timer-hero { display:flex;flex-direction:column;align-items:center;padding:24px 0 16px; }
  .mode-tabs { display:flex;gap:4px;background:var(--s2);border:1px solid var(--border);
    border-radius:30px;padding:4px;margin-bottom:32px; }
  .mtab { padding:7px 16px;border-radius:26px;border:none;background:none;color:var(--t2);
    font-family:var(--font-sans);font-size:13px;cursor:pointer;transition:all 0.18s;white-space:nowrap; }
  .mtab.active { background:var(--s1);color:var(--accent);box-shadow:var(--shadow-sm); }
  .ring-wrap { position:relative;width:220px;height:220px;margin-bottom:16px; }
  .ring-center { position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center; }
  .time-display { font-family:var(--font-serif);font-size:54px;font-weight:600;color:var(--text);letter-spacing:-0.04em;line-height:1; }
  .time-label { font-size:12px;color:var(--t2);margin-top:4px; }
  .controls { display:flex;gap:10px;margin-bottom:20px; }
  .controls .btn { min-width:120px;justify-content:center; }
  .sessions { display:flex;flex-direction:column;align-items:center;gap:8px; }
  .dots { display:flex;gap:7px; }
  .dot { width:10px;height:10px;border-radius:50%;background:var(--s4);transition:background 0.2s; }
  .dot.active { background:var(--accent); }
  .cfg-grid { display:grid;grid-template-columns:1fr 1fr;gap:10px; }
  .tbl { width:100%;border-collapse:collapse; }
  .tbl td { padding:8px;border-bottom:1px solid var(--border);font-size:13px; }
  .tbl tr:last-child td { border-bottom:none; }
  @media(max-width:900px) { .two-col { grid-template-columns:1fr; } }

  }
</style>
