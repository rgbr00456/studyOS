<script>
  import { activeView, cadernoOpen, showToast, dlgConfirm, dlgPrompt } from '../../stores/ui.js'
  import { state } from '../../stores/state.js'
  import { getTodayISO } from '../../lib/utils.js'

  let draggingPageId = null

  function nav(view) { activeView.set(view) }

  function openPage(id) {
    state.patch({ currentPageId: id })
    activeView.set('page')
  }

  async function newFolder() {
    const name = await dlgPrompt('Como chamar esta pasta?', {
      icon: '📁', title: 'Nova pasta',
      inputLabel: 'Nome', placeholder: 'Ex: Matemática, Biologia...'
    })
    if (!name?.trim()) return
    state.addFolder({ id: Date.now().toString(), name: name.trim().substring(0,80), emoji: '📁' })
    showToast('Pasta criada!')
  }

  async function deleteFolder(id) {
    const ok = await dlgConfirm('As páginas dentro ficarão sem pasta.',
      { icon: '📁', title: 'Remover pasta?', confirmLabel: 'Remover', dangerConfirm: true })
    if (!ok) return
    state.deleteFolder(id)
  }

  async function deletePage(id) {
    const ok = await dlgConfirm('Esta página será excluída permanentemente.',
      { icon: '📄', title: 'Excluir página?', confirmLabel: 'Excluir', dangerConfirm: true })
    if (!ok) return
    state.deletePage(id)
    if ($activeView === 'page' && $state.currentPageId === id) activeView.set('dashboard')
  }

  function newPage() {
    const page = {
      id: Date.now().toString(),
      title: '', emoji: '📄', folderId: '',
      cover: 'linear-gradient(135deg,#1a1a2e,#16213e)',
      blocks: [{ id: Date.now().toString(), type: 'paragraph', content: '' }],
      updated: new Date().toLocaleDateString('pt-BR')
    }
    state.addPage(page)
    activeView.set('page')
  }

  // Drag & drop
  function onDragStart(e, pageId) {
    draggingPageId = pageId
    e.dataTransfer.effectAllowed = 'move'
  }
  function onDragEnd() { draggingPageId = null }
  function onFolderDragOver(e) { e.preventDefault(); e.currentTarget.classList.add('drag-over') }
  function onFolderDragLeave(e) { e.currentTarget.classList.remove('drag-over') }
  function onFolderDrop(e, folderId) {
    e.preventDefault(); e.currentTarget.classList.remove('drag-over')
    if (draggingPageId) { state.movePageToFolder(draggingPageId, folderId); showToast('Página movida!') }
  }
  function onNoFolderDrop(e) {
    e.preventDefault(); e.currentTarget.classList.remove('drag-over')
    if (draggingPageId) state.movePageToFolder(draggingPageId, '')
  }
</script>

<nav class="sidebar">
  <!-- Menu section -->
  <div class="section">
    <div class="section-label">Menu</div>
    {#each [
      ['dashboard','◈','Dashboard'],
      ['tarefas','✓','Tarefas'],
      ['materias','◎','Matérias'],
      ['timer','◷','Pomodoro'],
      ['metas','◉','Metas'],
      ['calendario','▦','Calendário'],
    ] as [view, icon, label]}
      <button class="nav-item" class:active={$activeView === view}
        on:click={() => nav(view)}>
        <span class="nav-icon">{icon}</span> {label}
      </button>
    {/each}
  </div>

  <!-- Caderno section -->
  <div class="section caderno" class:open={$cadernoOpen}>
    <div class="caderno-header">
      <button class="caderno-toggle" on:click={() => cadernoOpen.update(v => !v)}>
        <span class="arrow" class:rotated={!$cadernoOpen}>▼</span>
        <span class="section-label" style="margin:0">Caderno</span>
      </button>
      <button class="icon-act" on:click={newFolder} title="Nova pasta">⊕</button>
    </div>

    {#if $cadernoOpen}
      <div class="pages-list">
        <!-- Folders -->
        {#each $state.folders as folder (folder.id)}
          {@const folderPages = $state.pages.filter(p => p.folderId === folder.id)}
          {@const isOpen = ($state.openFolders || []).includes(folder.id)}

          <div class="folder-item" class:open={isOpen}
            on:click={() => state.toggleFolder(folder.id)}
            on:dragover={onFolderDragOver} on:dragleave={onFolderDragLeave}
            on:drop={e => onFolderDrop(e, folder.id)}
            role="button" tabindex="0">
            <span class="f-arrow" class:open={isOpen}>▶</span>
            <span>{folder.emoji || '📁'}</span>
            <span class="f-name">{folder.name}</span>
            <span class="f-count">{folderPages.length}</span>
            <button class="f-del" on:click|stopPropagation={() => deleteFolder(folder.id)}>×</button>
          </div>

          {#if isOpen}
            <div class="folder-pages">
              {#each folderPages as page (page.id)}
                <div class="page-item" class:active={$state.currentPageId === page.id && $activeView === 'page'}
                  draggable="true" on:dragstart={e => onDragStart(e, page.id)} on:dragend={onDragEnd}
                  on:click={() => openPage(page.id)} role="button" tabindex="0">
                  <span>{page.emoji || '📄'}</span>
                  <span class="p-title">{page.title || 'Sem título'}</span>
                  <button class="p-del" on:click|stopPropagation={() => deletePage(page.id)}>×</button>
                </div>
              {/each}
            </div>
          {/if}
        {/each}

        <!-- Pages without folder -->
        <div class="no-folder" on:dragover={e=>{e.preventDefault();e.currentTarget.classList.add('drag-over')}}
          on:dragleave={e=>e.currentTarget.classList.remove('drag-over')} on:drop={onNoFolderDrop}>
          {#each $state.pages.filter(p => !p.folderId || !$state.folders.find(f=>f.id===p.folderId)) as page (page.id)}
            <div class="page-item" class:active={$state.currentPageId === page.id && $activeView === 'page'}
              draggable="true" on:dragstart={e => onDragStart(e, page.id)} on:dragend={onDragEnd}
              on:click={() => openPage(page.id)} role="button" tabindex="0">
              <span>{page.emoji || '📄'}</span>
              <span class="p-title">{page.title || 'Sem título'}</span>
              <button class="p-del" on:click|stopPropagation={() => deletePage(page.id)}>×</button>
            </div>
          {/each}
        </div>

        <button class="new-page-btn" on:click={newPage}>+ Nova página</button>
      </div>
    {/if}
  </div>
</nav>

<style>
  :global {

  .sidebar { position:fixed;top:var(--topbar);left:0;bottom:0;width:var(--sidebar);
    background:var(--s1);border-right:1px solid var(--border);display:flex;flex-direction:column;z-index:100;overflow:hidden; }
  .section { padding:8px 8px 4px;flex-shrink:0; }
  .section-label { font-size:10px;font-weight:600;color:var(--t3);text-transform:uppercase;letter-spacing:0.1em;padding:6px 8px 4px; }
  .nav-item { display:flex;align-items:center;gap:8px;padding:7px 10px;border-radius:var(--r-sm);cursor:pointer;
    color:var(--t2);transition:all 0.12s;border:none;background:none;width:100%;font-family:var(--font-sans);font-size:13.5px;text-align:left; }
  .nav-item:hover { background:var(--s3);color:var(--text); }
  .nav-item.active { background:var(--accent-dim);color:var(--accent); }
  .nav-icon { width:16px;text-align:center;flex-shrink:0; }

  .caderno { border-top:1px solid var(--border);padding-top:8px;display:flex;flex-direction:column; }
  .caderno.open { flex:1;overflow:hidden; }
  .caderno-header { display:flex;align-items:center;justify-content:space-between;padding:0 8px 4px; }
  .caderno-toggle { display:flex;align-items:center;gap:5px;background:none;border:none;cursor:pointer;color:var(--t2);font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.1em; }
  .caderno-toggle:hover { color:var(--text); }
  .arrow { font-size:9px;transition:transform 0.2s;display:inline-block; }
  .arrow.rotated { transform:rotate(-90deg); }
  .icon-act { background:none;border:none;color:var(--t3);cursor:pointer;font-size:16px;padding:2px 4px;border-radius:4px; }
  .icon-act:hover { color:var(--text);background:var(--s3); }
  .pages-list { flex:1;overflow-y:auto;padding:0 8px 8px; }

  .folder-item { display:flex;align-items:center;gap:7px;padding:6px 10px;border-radius:var(--r-sm);
    cursor:pointer;color:var(--t2);font-size:13px;font-weight:500;transition:all 0.12s;user-select:none;border:1px solid transparent; }
  .folder-item:hover { background:var(--s3);color:var(--text); }
  .folder-item:global(.drag-over) { background:var(--accent-dim);border-color:rgba(201,169,110,0.3); }
  .f-arrow { font-size:9px;transition:transform 0.15s;flex-shrink:0; }
  .f-arrow.open { transform:rotate(90deg); }
  .f-name { flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap; }
  .f-count { font-size:10px;color:var(--t3);background:var(--s4);padding:1px 5px;border-radius:10px; }
  .f-del { opacity:0;background:none;border:none;color:var(--t3);cursor:pointer;font-size:14px;padding:0 2px; }
  .folder-item:hover .f-del { opacity:1; }
  .folder-pages { padding-left:14px; }

  .page-item { display:flex;align-items:center;gap:7px;padding:6px 10px;border-radius:var(--r-sm);
    cursor:pointer;color:var(--t2);font-size:13px;transition:all 0.12s;user-select:none; }
  .page-item:hover { background:var(--s3);color:var(--text); }
  .page-item.active { background:var(--s3);color:var(--text); }
  .p-title { flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap; }
  .p-del { opacity:0;background:none;border:none;color:var(--t3);cursor:pointer;font-size:14px;padding:0 2px; }
  .page-item:hover .p-del { opacity:1; }

  .no-folder { min-height:4px;border-radius:var(--r-sm);transition:all 0.15s; }
  .no-folder:global(.drag-over) { background:var(--s3);outline:1px dashed var(--border2); }

  .new-page-btn { display:flex;align-items:center;gap:7px;padding:6px 10px;border-radius:var(--r-sm);
    cursor:pointer;color:var(--t3);font-size:13px;width:100%;border:none;background:none;
    font-family:var(--font-sans);transition:all 0.12s;margin-top:2px; }
  .new-page-btn:hover { background:var(--s3);color:var(--t2); }

  }
</style>
