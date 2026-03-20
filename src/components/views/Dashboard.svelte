<script>
  import { onMount, onDestroy } from 'svelte'
  import { state, todayTasks, totalHoras, bestMateria, pomodorosHoje } from '../../stores/state.js'
  import { activeView } from '../../stores/ui.js'
  import { DIAS, CORES, fmtISO } from '../../lib/utils.js'
  import { esc } from '../../lib/security.js'

  let chartEl, chart = null

  $: title = (() => {
    const h = new Date().getHours()
    return h < 12 ? 'Bom dia 👋' : h < 18 ? 'Boa tarde 👋' : 'Boa noite 👋'
  })()

  $: subtitle = new Date().toLocaleDateString('pt-BR', { weekday:'long', day:'numeric', month:'long' })

  $: doneToday = $todayTasks.filter(t => t.done).length

  $: upcomingTasks = $state.tasks
    .filter(t => !t.done && t.dataVenc)
    .sort((a,b) => a.dataVenc.localeCompare(b.dataVenc))
    .slice(0, 5)

  $: recentPages = [...$state.pages].slice(-5).reverse()

  $: horasData = $state.horas || [0,0,0,0,0,0,0]

  onMount(async () => {
    const Chart = (await import('chart.js/auto')).default
    if (chartEl) {
      chart = new Chart(chartEl, {
        type: 'bar',
        data: {
          labels: DIAS,
          datasets: [
            { label:'Horas', data: horasData, backgroundColor:'rgba(201,169,110,0.7)',
              borderRadius:5, borderSkipped:false },
            { label:'Meta', data: Array(7).fill(($state.metaSemanal||20)/7),
              type:'line', borderColor:'rgba(201,169,110,0.25)', borderWidth:1.5, pointRadius:0, fill:false }
          ]
        },
        options: { responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}},
          scales:{
            y:{beginAtZero:true,grid:{color:'rgba(255,255,255,0.04)'},ticks:{color:'#4e4a46',font:{size:11},callback:v=>v+'h'}},
            x:{grid:{display:false},ticks:{color:'#4e4a46',font:{size:11}}}
          }
        }
      })
    }
  })

  onDestroy(() => chart?.destroy())

  const PRIO_CLASS = { urgente:'badge-red', importante:'badge-amber', normal:'badge-neutral' }
</script>

<div class="view-header">
  <div class="view-title">{title}</div>
  <div class="view-subtitle">{subtitle}</div>
</div>

<div class="view-content">
  <div class="metrics-grid">
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

  <div class="two-col">
    <div class="card">
      <div class="card-head"><div class="card-title">Horas esta semana</div></div>
      <div style="height:200px"><canvas bind:this={chartEl}></canvas></div>
    </div>

    <div class="card">
      <div class="card-head"><div class="card-title">Desempenho por matéria</div></div>
      {#if !$state.materias.length}
        <p class="empty">Nenhuma matéria cadastrada</p>
      {:else}
        {#each $state.materias.slice(0,5) as mat, i}
          {@const cor = CORES[i % CORES.length]}
          {@const media = (() => {
            const ns = [mat.n1,mat.n2,mat.n3,mat.n4].filter(n=>n!==''&&n!=null&&!isNaN(parseFloat(n)))
            return ns.length ? ns.reduce((a,b)=>a+parseFloat(b),0)/ns.length : null
          })()}
          <div class="mat-row">
            <span class="mat-name">{mat.emoji||'📖'} {mat.nome}</span>
            <div class="prog" style="flex:1"><div class="prog-fill" style="width:{media!==null?Math.min(100,media*10):0}%;background:{cor}"></div></div>
            <span class="mat-media" style="color:{cor}">{media !== null ? media.toFixed(1) : '—'}</span>
          </div>
        {/each}
      {/if}
    </div>
  </div>

  <div class="two-col" style="margin-top:16px">
    <div class="card">
      <div class="card-head">
        <div class="card-title">Próximas tarefas</div>
        <button class="card-action" on:click={() => activeView.set('tarefas')}>ver todas</button>
      </div>
      {#if !upcomingTasks.length}
        <p class="empty">Nenhuma tarefa com prazo</p>
      {:else}
        {#each upcomingTasks as t}
          <div class="row-item">
            <span class="row-text">{t.texto}</span>
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
        <p class="empty">Nenhuma página criada</p>
      {:else}
        {#each recentPages as p}
          <div class="row-item clickable" on:click={() => { state.patch({currentPageId:p.id}); activeView.set('page') }} role="button" tabindex="0">
            <span style="font-size:14px">{p.emoji||'📄'}</span>
            <span class="row-text">{p.title||'Sem título'}</span>
            <span class="row-date">{p.updated||''}</span>
          </div>
        {/each}
      {/if}
    </div>
  </div>
</div>
