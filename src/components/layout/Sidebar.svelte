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
