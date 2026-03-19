<script>
  import { state } from '../../stores/state.js'
  import { showToast, dlgConfirm } from '../../stores/ui.js'
  import { fmtISOFull } from '../../lib/utils.js'

  let nome = '', icone = '', atual = 0, total = 10, unidade = '', prazo = ''

  function addGoal() {
    if (!nome.trim()) { showToast('Digite o nome da meta.'); return }
    state.addGoal({
      id: Date.now().toString(),
      nome: nome.trim().substring(0, 200),
      icone: icone.trim() || '🎯',
      atual: parseFloat(atual) || 0,
      total: parseFloat(total) || 10,
      unidade: unidade.trim() || 'itens',
      prazo
    })
    nome = ''; icone = ''; atual = 0; total = 10; unidade = ''; prazo = ''
    showToast('Meta adicionada! 🎯')
  }

  async function deleteGoal(id) {
    const ok = await dlgConfirm('Esta meta será excluída permanentemente.',
      { icon: '🎯', title: 'Excluir meta?', confirmLabel: 'Excluir', dangerConfirm: true })
    if (!ok) return
    state.deleteGoal(id)
  }

  function pctColor(pct) {
    return pct >= 100 ? 'var(--green)' : pct >= 50 ? 'var(--amber)' : 'var(--blue)'
  }
  function bgColor(pct) {
    return pct >= 100 ? 'var(--green-dim)' : pct >= 50 ? 'var(--amber-dim)' : 'var(--blue-dim)'
  }
</script>

<div class="view-header">
  <div class="view-title">Metas</div>
  <div class="view-subtitle">Objetivos de longo prazo com acompanhamento</div>
</div>

<div class="view-content">
  <!-- Add goal form -->
  <div class="card" style="margin-bottom:20px">
    <div class="card-head"><div class="card-title">Nova meta</div></div>
    <div class="form-grid">
      <div>
        <label class="inp-label">Nome da meta</label>
        <input class="inp" bind:value={nome} placeholder="Ex: Terminar livro de Álgebra" />
      </div>
      <div>
        <label class="inp-label">Ícone</label>
        <input class="inp" bind:value={icone} placeholder="🎯" style="text-align:center" />
      </div>
      <div>
        <label class="inp-label">Progresso atual</label>
        <input class="inp" type="number" bind:value={atual} min="0" />
      </div>
      <div>
        <label class="inp-label">Total necessário</label>
        <input class="inp" type="number" bind:value={total} min="1" />
      </div>
      <div>
        <label class="inp-label">Unidade</label>
        <input class="inp" bind:value={unidade} placeholder="capítulos, horas..." />
      </div>
      <div>
        <label class="inp-label">Prazo</label>
        <input class="inp" type="date" bind:value={prazo} />
      </div>
    </div>
    <button class="btn" style="margin-top:4px" on:click={addGoal}>+ Adicionar meta</button>
  </div>

  <!-- Goals list -->
  {#if !$state.goals.length}
    <div class="card" style="text-align:center;padding:32px;color:var(--t3)">
      Nenhuma meta cadastrada ainda.
    </div>
  {:else}
    {#each $state.goals as g (g.id)}
      {@const pct = Math.min(100, Math.round((g.atual / g.total) * 100))}
      {@const cor = pctColor(pct)}
      <div class="goal-item">
        <div class="goal-head">
          <div class="goal-icon" style="background:{bgColor(pct)}">{g.icone || '🎯'}</div>
          <div class="goal-info">
            <div class="goal-name">{g.nome}</div>
            <div class="goal-det">
              {g.atual} de {g.total} {g.unidade}
              {#if g.prazo} · prazo: {fmtISOFull(g.prazo)}{/if}
            </div>
            <div class="prog" style="margin-top:8px">
              <div class="prog-fill" style="width:{pct}%;background:{cor}"></div>
            </div>
          </div>
          <div class="goal-right">
            <span class="goal-pct" style="color:{cor}">{pct}%</span>
            <input type="number" class="goal-upd" min="0" max={g.total} step="0.5"
              value={g.atual}
              on:change={e => state.updateGoal(g.id, parseFloat(e.target.value))} />
            <button class="btn-danger" on:click={() => deleteGoal(g.id)}>remover</button>
          </div>
        </div>
      </div>
    {/each}
  {/if}
</div>

<style>
  .card { background:var(--s1);border:1px solid var(--border);border-radius:var(--r-lg);padding:20px; }
  .card-head { display:flex;align-items:center;justify-content:space-between;margin-bottom:16px; }
  .card-title { font-size:13px;font-weight:600;color:var(--text); }
  .form-grid { display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:4px; }
  .goal-item { background:var(--s2);border:1px solid var(--border);border-radius:var(--r-lg);padding:16px;margin-bottom:10px; }
  .goal-head { display:flex;align-items:flex-start;gap:12px; }
  .goal-icon { width:38px;height:38px;border-radius:var(--r);display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0; }
  .goal-info { flex:1; }
  .goal-name { font-size:15px;font-weight:500;color:var(--text);margin-bottom:2px; }
  .goal-det { font-size:12px;color:var(--t2); }
  .goal-right { display:flex;flex-direction:column;align-items:flex-end;gap:6px; }
  .goal-pct { font-family:var(--font-serif);font-size:20px;font-weight:600; }
  .goal-upd { width:64px;background:var(--s3);border:1px solid var(--border);border-radius:var(--r-sm);
    color:var(--text);font-family:var(--font-serif);font-size:14px;font-weight:600;
    padding:6px;text-align:center;outline:none;-webkit-appearance:none; }
  .goal-upd:focus { border-color:var(--accent); }
  @media(max-width:640px) { .form-grid { grid-template-columns:1fr; } }
</style>
