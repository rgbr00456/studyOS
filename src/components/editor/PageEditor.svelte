<script>
  import { state } from '../../stores/state.js'
  import { activeView, showToast, dlgPrompt } from '../../stores/ui.js'
  import { sanitizeHtml } from '../../lib/security.js'
  import { COVER_GRADIENTS } from '../../lib/utils.js'
  import FormattingToolbar from './FormattingToolbar.svelte'
  import Block from './Block.svelte'
  import SlashMenu from './SlashMenu.svelte'

  $: page   = $state.pages.find(p => p.id === $state.currentPageId)
  $: folder = page?.folderId ? ($state.folders||[]).find(f => f.id === page.folderId) : null

  let wordCount = 0

  $: if (page?.blocks) {
    const tmp = document.createElement('div')
    const text = page.blocks.map(b => { tmp.innerHTML = b.content||''; return tmp.textContent||'' }).join(' ')
    wordCount = text.trim().split(/\s+/).filter(w=>w.length>0).length
  }

  function updateTitle(e) {
    if (!page) return
    state.updatePage(page.id, { title: e.target.value })
  }

  function changeCover() {
    if (!page) return
    const idx = COVER_GRADIENTS.indexOf(page.cover)
    const next = COVER_GRADIENTS[(idx + 1) % COVER_GRADIENTS.length]
    state.updatePage(page.id, { cover: next })
  }

  function changeEmoji() {
    const emojis = ['📄','📚','📖','📝','✍️','🔬','🧮','🎯','💡','🌟','📊','🗒️','📋','🧠','⚗️','🔭']
    state.updatePage(page.id, { emoji: emojis[Math.floor(Math.random()*emojis.length)] })
  }

  async function moveToFolder() {
    if (!page) return
    const folderName = await dlgPrompt(
      'Selecione a pasta de destino:',
      { icon:'📁', title:'Mover página', inputLabel:'Nome da pasta (deixe vazio para remover)',
        defaultValue: folder?.name || '' }
    )
    if (folderName === null) return
    const found = ($state.folders||[]).find(f => f.name.toLowerCase() === folderName.trim().toLowerCase())
    state.movePageToFolder(page.id, found?.id || '')
    showToast(found ? `Movido para "${found.name}"` : 'Removido da pasta.')
  }

  function addBlock(type, afterId = null) {
    if (!page) return
    const newBlock = { id: Date.now().toString(), type, content:'', checked:false }
    const blocks = [...(page.blocks||[])]
    if (afterId) {
      const idx = blocks.findIndex(b => b.id === afterId)
      blocks.splice(idx+1, 0, newBlock)
    } else {
      blocks.push(newBlock)
    }
    state.updatePageBlocks(page.id, blocks)
    return newBlock.id
  }

  function deleteBlock(id) {
    if (!page || (page.blocks||[]).length <= 1) return
    state.updatePageBlocks(page.id, page.blocks.filter(b => b.id !== id))
  }

  function updateBlock(id, content) {
    if (!page) return
    state.updatePageBlocks(page.id,
      page.blocks.map(b => b.id === id ? { ...b, content: sanitizeHtml(content) } : b))
  }

  function updateBlockType(id, type) {
    if (!page) return
    state.updatePageBlocks(page.id,
      page.blocks.map(b => b.id === id ? { ...b, type, content:'' } : b))
  }

  function toggleTodo(id, checked) {
    if (!page) return
    state.updatePageBlocks(page.id,
      page.blocks.map(b => b.id === id ? { ...b, checked } : b))
  }

  let slashVisible = false
  let slashPos     = { x:0, y:0 }
  let slashBlockId = null

  function showSlash(blockId, pos) { slashBlockId = blockId; slashPos = pos; slashVisible = true }
  function hideSlash() { slashVisible = false; slashBlockId = null }
  function onSlashSelect(type) {
    if (slashBlockId) updateBlockType(slashBlockId, type)
    hideSlash()
  }
</script>

{#if !page}
  <div style="display:flex;align-items:center;justify-content:center;height:80vh;color:var(--t3);font-size:14px">
    Selecione ou crie uma página no painel lateral
  </div>
{:else}
  <!-- Editor topbar — sticky -->
  <div class="editor-topbar">
    <button class="editor-folder-tag" on:click={moveToFolder}>
      {#if folder}
        {folder.emoji||'📁'} {folder.name}
      {:else}
        <span style="color:var(--t3)">+ Adicionar à pasta</span>
      {/if}
    </button>
    <span class="editor-word-count" id="word-count">{wordCount} {wordCount===1?'palavra':'palavras'}</span>
  </div>

  <!-- Cover + icon + title -->
  <div style="padding:20px 60px 0">
    <div class="page-cover" style="background:{page.cover||'linear-gradient(135deg,#1a1a2e,#16213e)'}"
      on:click={changeCover} role="button" tabindex="0">
      <button class="page-cover-change">Alterar capa</button>
    </div>

    <div class="page-icon-wrap" on:click={changeEmoji} role="button" tabindex="0"
      title="Clique para mudar o ícone">
      <span class="page-icon">{page.emoji||'📄'}</span>
    </div>

    <input class="page-title-inp"
      value={page.title||''}
      placeholder="Sem título"
      on:input={updateTitle}
      on:keydown={e => { if(e.key==='Enter'){e.preventDefault(); addBlock('paragraph', null)} }}
    />
  </div>

  <!-- Blocks -->
  <div id="blocks-container" style="padding:0 60px 80px">
    {#each (page.blocks||[]) as block, i (block.id)}
      <Block
        {block}
        blockIndex={i}
        on:enter={() => addBlock('paragraph', block.id)}
        on:delete={() => deleteBlock(block.id)}
        on:update={e => updateBlock(block.id, e.detail)}
        on:typechange={e => updateBlockType(block.id, e.detail)}
        on:toggletodo={e => toggleTodo(block.id, e.detail)}
        on:slash={e => showSlash(block.id, e.detail)}
        on:hideslash={hideSlash}
      />
    {/each}
  </div>
{/if}

<FormattingToolbar />

{#if slashVisible}
  <SlashMenu pos={slashPos}
    on:select={e => onSlashSelect(e.detail)}
    on:close={hideSlash}
  />
{/if}
