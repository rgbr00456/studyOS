<script>
  import { state } from '../../stores/state.js'
  import { showToast, dlgConfirm } from '../../stores/ui.js'
  import { DIAS, CORES, discMedia } from '../../lib/utils.js'

  let nomeInput = '', emojiInput = ''
  let horasInputs = [...($state.horas || [0,0,0,0,0,0,0])]

  // Sync horasInputs when state changes externally (e.g. Firestore)
  $: horasInputs = [...($state.horas || [0,0,0,0,0,0,0])]

  function addMateria() {
    const nome = nomeInput.trim().substring(0, 100)
    if (!nome) { showToast('Digite o nome da matéria.'); return }
    if ($state.materias.find(m => m.nome === nome)) { showToast('Matéria já existe.'); return }
    state.addMateria({
      id: Date.now().toString(), nome,
      emoji: emojiInput.trim() || '📖',
      n1: '', n2: '', n3: '', n4: ''
    })
    nomeInput = ''; emojiInput = ''
    showToast('Matéria adicionada! 📚')
  }

  async function deleteMateria(id) {
    const ok = await dlgConfirm('As notas desta matéria serão perdidas.', {
      icon: '📖', title: 'Remover matéria?', confirmLabel: 'Remover', dangerConfirm: true
    })
    if (!ok) return
    state.deleteMateria(id)
  }

  function updateNota(id, campo, val) {
    state.updateMateriaNota(id, campo, val)
  }

  function saveHoras() {
    state.patch({ horas: horasInputs.map(v => parseFloat(v) || 0) })
    showToast('Horas salvas! ✓')
  }

  function mediaColor(med) {
    if (med === null) return 'var(--t2)'
    return med >= 7 ? 'var(--green)' : med >= 5 ? 'var(--amber)' : 'var(--red)'
  }
</script>

<div class="view-header">
  <div class="view-title">Matérias</div>
  <div class="view-subtitle">Acompanhe notas, horas e desempenho</div>
</div>

<div class="view-content">
  <!-- Horas semanais -->
  <div class="card" style="margin-bottom:20px">
    <div class="card-head"><div class="card-title">Horas estudadas esta semana</div></div>
    <div class="horas-grid">
      {#each DIAS as dia, i}
        <div class="hora-col">
          <div class="hora-dia">{dia}</div>
          <input class="hora-inp" type="number" min="0" max="24" step="0.5"
            bind:value={horasInputs[i]} />
        </div>
      {/each}
    </div>
    <button class="btn" on:click={saveHoras}>Salvar horas</button>
  </div>

  <!-- Add materia -->
  <div class="card" style="margin-bottom:20px">
    <div class="card-head"><div class="card-title">Adicionar matéria</div></div>
    <div style="display:flex;gap:8px">
      <input class="inp" bind:value={nomeInput} placeholder="Nome da matéria (ex: Cálculo I)"
        on:keydown={e => e.key === 'Enter' && addMateria()} />
      <input class="inp" bind:value={emojiInput} placeholder="📗"
        style="width:64px;text-align:center" />
      <button class="btn" on:click={addMateria}>+ Adicionar</button>
    </div>
  </div>

  <!-- Materias list -->
  {#if !$state.materias.length}
    <div class="card" style="text-align:center;padding:32px;color:var(--t3)">
      Nenhuma matéria cadastrada. Adicione acima!
    </div>
  {:else}
    {#each $state.materias as mat, idx (mat.id)}
      {@const cor = CORES[idx % CORES.length]}
      {@const med = discMedia(mat)}
      <div class="subject-card" style="--cor:{cor}">
        <div class="subject-name">
          <span style="font-size:20px">{mat.emoji || '📖'}</span>
          {mat.nome}
          <button class="subject-del" on:click={() => deleteMateria(mat.id)}>remover</button>
        </div>
        <div class="grades-grid">
          {#each ['n1','n2','n3','n4'] as nota, j}
            <div class="grade-cell">
              <div class="grade-label">Nota {j + 1}</div>
              <input class="grade-inp" type="number" min="0" max="10" step="0.1"
                value={mat[nota]} placeholder="—"
                on:input={e => updateNota(mat.id, nota, e.target.value)} />
            </div>
          {/each}
        </div>
        <div class="subject-footer">
          <span style="font-size:13px;color:var(--t2)">Média atual</span>
          <div style="display:flex;align-items:baseline;gap:6px">
            <span class="media-val" style="color:{mediaColor(med)}">
              {med !== null ? med.toFixed(1) : '—'}
            </span>
            <span style="font-size:12px;color:var(--t3)">/10</span>
          </div>
        </div>
      </div>
    {/each}
  {/if}
</div>
