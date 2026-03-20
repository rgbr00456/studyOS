<script>
  import { onMount, onDestroy } from 'svelte'
  import { state, todayTasks, totalHoras, bestMateria, pomodorosHoje } from '../../stores/state.js'
  import { activeView } from '../../stores/ui.js'
  import { DIAS, CORES, fmtISO } from '../../lib/utils.js'

  let chartEl, chart = null

  $: title = (() => {
    const h = new Date().getHours()
    return h < 12 ? 'Bom dia 👋' : h < 18 ? 'Boa tarde 👋' : 'Boa noite 👋'
  })()

  $: subtitle = new Date().toLocaleDateString('pt-BR', { weekday:'long', day:'numeric', month:'long' })
  $: doneToday = $todayTasks.filter(t => t.done).length
  $: upcomingTasks = $state.tasks.filter(t => !t.done && t.dataVenc)
    .sort((a,b) => a.dataVenc.localeCompare(b.dataVenc)).slice(0,5)
  $: recentPages = [...$state.pages].slice(-5).reverse()

  const PRIO_CLASS = { urgente:'badge-red', importante:'badge-amber', normal:'badge-neutral' }

  onMount(async () => {
    const { Chart, registerables } = await import('chart.js')
    Chart.register(...registerables)
    if (chartEl) {
      chart = new Chart(chartEl, {
        type: 'bar',
        data: {
          labels: DIAS,
          datasets: [
            { label:'Horas', data:$state.horas||[0,0,0,0,0,0,0],
              backgroundColor:'rgba(201,169,110,0.7)', borderRadius:5, borderSkipped:false },
            { label:'Meta', data:Array(7).fill(($state.metaSemanal||20)/7),
              type:'line', borderColor:'rgba(201,169,110,0.25)', borderWidth:1.5,
              pointRadius:0, fill:false }
          ]
        },
        options: {
          responsive:true, maintainAspectRatio:false,
          plugins:{ legend:{ display:false } },
          scales:{
            y:{ beginAtZero:true, grid:{color:'rgba(255,255,255,0.04)'},
                ticks:{color:'#4e4a46',font:{size:11},callback:v=>v+'h'} },
            x:{ grid:{display:false}, ticks:{color:'#4e4a46',font:{size:11}} }
          }
        }
      })
    }
  })

  onDestroy(() => chart?.destroy())
</script>

<div class="view-header">
  <div class="view-title">{title}</div>
  <div class="view-subtitle">{subtitle}</div>
</div>

<div class="view-content">
  <!-- Metrics 4-col grid -->
  <div class="metrics-row">
    <div class="metric">
      <div class="metric-label">Horas / semana</div>
      <div class="metric-value">{$totalHoras.toFixed(1)}h</div>
      <div class="metric-sub">de {$state.metaSemanal}h planejadas</div>
    </div>
    <div class="metric green">
      <div class="metric-label">Tarefas hoje</div>
      <div class="metric-value">{doneToday}/{$todayTasks.length}</div>
      <div class="metric-sub">concluídas</div>
    </div>
    <div class="metric blue">
      <div class="metric-label">Pomodoros</div>
      <div class="metric-value">{$pomodorosHoje}</div>
      <div class="metric-sub">hoje</div>
    </div>
    <div class="metric purple">
      <div class="metric-label">Melhor média</div>
      <div class="metric-value">{$bestMateria.media !== null ? $bestMateria.media.toFixed(1) : '—'}</div>
      <div class="metric-sub">{$bestMateria.nome}</div>
    </div>
  </div>

  <!-- Charts row -->
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px">
    <div class="card">
      <div class="card-head">
        <div class="card-title">Horas esta semana</div>
      </div>
      <div class="chart-wrap"><canvas bind:this={chartEl}></canvas></div>
    </div>

    <div class="card">
      <div class="card-head">
        <div class="card-title">Desempenho por matéria</div>
      </div>
      {#if !$state.materias.length}
        <div style="font-size:13px;color:var(--t3);padding:8px 0">Nenhuma matéria cadastrada</div>
      {:else}
        {#each $state.materias.slice(0,5) as mat, i}
          {@const cor = CORES[i % CORES.length]}
          {@const ns = [mat.n1,mat.n2,mat.n3,mat.n4].filter(n=>n!==''&&n!=null&&!isNaN(parseFloat(n)))}
          {@const media = ns.length ? ns.reduce((a,b)=>a+parseFloat(b),0)/ns.length : null}
          <div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--border)">
            <span style="font-size:13px;color:var(--text);flex:1">{mat.emoji||'📖'} {mat.nome}</span>
            <div style="flex:1"><div class="prog"><div class="prog-fill" style="width:{media!==null?Math.min(100,media*10):0}%;background:{cor}"></div></div></div>
            <span style="font-family:var(--font-serif);font-size:15px;font-weight:600;color:{cor};min-width:30px;text-align:right">{media !== null ? media.toFixed(1) : '—'}</span>
          </div>
        {/each}
      {/if}
    </div>
  </div>

  <!-- Bottom row -->
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
    <div class="card">
      <div class="card-head">
        <div class="card-title">Próximas tarefas</div>
        <button class="card-action" on:click={() => activeView.set('tarefas')}>ver todas</button>
      </div>
      {#if !upcomingTasks.length}
        <div style="font-size:13px;color:var(--t3);padding:8px 0">Nenhuma tarefa com prazo</div>
      {:else}
        {#each upcomingTasks as t}
          <div style="display:flex;align-items:center;gap:8px;padding:8px 0;border-bottom:1px solid var(--border)">
            <div style="flex:1;font-size:13px;color:var(--text)">{t.texto}</div>
            <span class="badge {PRIO_CLASS[t.prio]||'badge-neutral'}">{fmtISO(t.dataVenc)}</span>
          </div>
        {/each}
      {/if}
    </div>

    <div class="card">
      <div class="card-head">
        <div class="card-title">Páginas recentes</div>
        <button class="card-action" on:click={() => activeView.set('page')}>+ nova</button>
      </div>
      {#if !recentPages.length}
        <div style="font-size:13px;color:var(--t3);padding:8px 0">Nenhuma página criada</div>
      {:else}
        {#each recentPages as p}
          <div style="display:flex;align-items:center;gap:8px;padding:8px 0;border-bottom:1px solid var(--border);cursor:pointer"
            on:click={() => { state.patch({currentPageId:p.id}); activeView.set('page') }}
            role="button" tabindex="0">
            <span style="font-size:14px">{p.emoji||'📄'}</span>
            <span style="font-size:13px;color:var(--text);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">{p.title||'Sem título'}</span>
            <span style="font-size:11px;color:var(--t3)">{p.updated||''}</span>
          </div>
        {/each}
      {/if}
    </div>
  </div>
</div>
