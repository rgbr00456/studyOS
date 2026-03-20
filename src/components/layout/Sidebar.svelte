<script>
  import { activeView, cadernoOpen, showToast, dlgConfirm, dlgPrompt } from '../../stores/ui.js'
  import { state } from '../../stores/state.js'
  import { getTodayISO } from '../../lib/utils.js'
  import { COVER_GRADIENTS } from '../../lib/utils.js'

  let draggingPageId = null

  function nav(view) { activeView.set(view) }

  function openPage(id) {
    state.patch({ currentPageId: id })
    activeView.set('page')
  }

  async function newFolder() {
    const name = await dlgPrompt('Como chamar esta pasta?', {
      icon:'📁', title:'Nova pasta', inputLabel:'Nome', placeholder:'Ex: Matemática, Biologia...'
    })
    if (!name?.trim()) return
    state.addFolder({ id: Date.now().toString(), name: name.trim().substring(0,80), emoji:'📁' })
    showToast('Pasta criada!')
  }

  async function deleteFolder(id) {
    const ok = await dlgConfirm('As páginas dentro ficarão sem pasta.',
      { icon:'📁', title:'Remover pasta?', confirmLabel:'Remover', dangerConfirm:true })
    if (!ok) return
    state.deleteFolder(id)
  }

  async function deletePage(id) {
    const ok = await dlgConfirm('Esta página será excluída permanentemente.',
      { icon:'📄', title:'Excluir página?', confirmLabel:'Excluir', dangerConfirm:true })
    if (!ok) return
    state.deletePage(id)
    if ($activeView === 'page' && $state.currentPageId === id) activeView.set('dashboard')
  }

  function newPage() {
    const page = {
      id: Date.now().toString(), title:'', emoji:'📄', folderId:'',
      cover: COVER_GRADIENTS[Math.floor(Math.random() * COVER_GRADIENTS.length)],
      blocks: [{ id: Date.now().toString(), type:'paragraph', content:'' }],
      updated: new Date().toLocaleDateString('pt-BR')
    }
    state.addPage(page)
    activeView.set('page')
  }

  function onDragStart(e, pageId) {
    draggingPageId = pageId
    e.dataTransfer.effectAllowed = 'move'
    setTimeout(() => {
      const el = document.querySelector(`[data-page-id="${pageId}"]`)
      if (el) el.style.opacity = '0.4'
    }, 0)
  }
  function onDragEnd() {
    draggingPageId = null
    document.querySelectorAll('[data-page-id]').forEach(el => el.style.opacity = '')
  }
  function onFolderDragOver(e) { e.preventDefault(); e.currentTarget.classList.add('folder-drag-over') }
  function onFolderDragLeave(e) { e.currentTarget.classList.remove('folder-drag-over') }
  function onFolderDrop(e, folderId) {
    e.preventDefault(); e.currentTarget.classList.remove('folder-drag-over')
    if (draggingPageId) { state.movePageToFolder(draggingPageId, folderId); showToast('Página movida!') }
  }
  function onNoFolderDragOver(e) { e.preventDefault(); e.currentTarget.classList.add('folder-drag-over') }
  function onNoFolderDragLeave(e) { e.currentTarget.classList.remove('folder-drag-over') }
  function onNoFolderDrop(e) {
    e.preventDefault(); e.currentTarget.classList.remove('folder-drag-over')
    if (draggingPageId) { state.movePageToFolder(draggingPageId, ''); showToast('Removido da pasta.') }
  }
</script>

<nav class="sidebar">
  <!-- Menu -->
  <div class="sidebar-section">
    <div class="sidebar-label">Menu</div>
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
        <span class="nav-ico">{icon}</span>
        {label}
      </button>
    {/each}
  </div>

  <!-- Caderno -->
  <div class="caderno-section" class:expanded={$cadernoOpen} id="caderno-section">
    <div class="caderno-header">
      <button class="caderno-toggle" on:click={() => cadernoOpen.update(v => !v)}
        style="background:none;border:none;cursor:pointer;display:flex;align-items:center;gap:5px;color:var(--t3)">
        <span style="font-size:9px;transition:transform 0.2s;display:inline-block;transform:{$cadernoOpen?'rotate(0deg)':'rotate(-90deg)'}">▼</span>
        <span class="sidebar-label" style="margin:0;cursor:pointer">Caderno</span>
      </button>
      <button title="Nova pasta" on:click={newFolder}
        style="background:none;border:none;color:var(--t3);cursor:pointer;font-size:16px;padding:2px 4px;border-radius:4px">⊕</button>
    </div>

    {#if $cadernoOpen}
      <div class="pages-list" id="pages-list">
        <!-- Folders -->
        {#each $state.folders as folder (folder.id)}
          {@const folderPages = $state.pages.filter(p => p.folderId === folder.id)}
          {@const isOpen = ($state.openFolders || []).includes(folder.id)}

          <div class="folder-item" class:open={isOpen}
            data-folder-id={folder.id}
            on:click={() => state.toggleFolder(folder.id)}
            on:dragover={onFolderDragOver}
            on:dragleave={onFolderDragLeave}
            on:drop={e => onFolderDrop(e, folder.id)}
            role="button" tabindex="0">
            <span style="font-size:9px;transition:transform 0.15s;transform:{isOpen?'rotate(90deg)':'rotate(0deg)'}">▶</span>
            <span>{folder.emoji || '📁'}</span>
            <span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">{folder.name}</span>
            <span style="font-size:10px;color:var(--t3);background:var(--s4);padding:1px 5px;border-radius:10px">{folderPages.length}</span>
            <button class="folder-del" on:click|stopPropagation={() => deleteFolder(folder.id)}>×</button>
          </div>

          {#if isOpen}
            <div class="folder-pages" style="padding-left:14px">
              {#each folderPages as page (page.id)}
                <div class="page-nav-item" class:active={$state.currentPageId === page.id && $activeView === 'page'}
                  data-page-id={page.id}
                  draggable="true"
                  on:dragstart={e => onDragStart(e, page.id)}
                  on:dragend={onDragEnd}
                  on:click={() => openPage(page.id)}
                  role="button" tabindex="0">
                  <span class="page-emoji">{page.emoji || '📄'}</span>
                  <span class="page-title-nav">{page.title || 'Sem título'}</span>
                  <button class="page-del" on:click|stopPropagation={() => deletePage(page.id)}>×</button>
                </div>
              {/each}
              {#if folderPages.length === 0}
                <div style="font-size:12px;color:var(--t3);padding:4px 10px 6px">Pasta vazia</div>
              {/if}
            </div>
          {/if}
        {/each}

        <!-- Pages without folder -->
        <div on:dragover={onNoFolderDragOver} on:dragleave={onNoFolderDragLeave} on:drop={onNoFolderDrop}>
          {#each $state.pages.filter(p => !p.folderId || !$state.folders.find(f => f.id === p.folderId)) as page (page.id)}
            <div class="page-nav-item" class:active={$state.currentPageId === page.id && $activeView === 'page'}
              data-page-id={page.id}
              draggable="true"
              on:dragstart={e => onDragStart(e, page.id)}
              on:dragend={onDragEnd}
              on:click={() => openPage(page.id)}
              role="button" tabindex="0">
              <span class="page-emoji">{page.emoji || '📄'}</span>
              <span class="page-title-nav">{page.title || 'Sem título'}</span>
              <button class="page-del" on:click|stopPropagation={() => deletePage(page.id)}>×</button>
            </div>
          {/each}
        </div>

        <button class="new-page-btn" on:click={newPage}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>
          Nova página
        </button>
      </div>
    {/if}
  </div>

  <div class="sidebar-footer">
    <button class="sidebar-footer-btn" on:click={() => {}}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
      Conectar Google Agenda
    </button>
  </div>
</nav>
