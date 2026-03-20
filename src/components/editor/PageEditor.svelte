<script>
  import { state } from '../../stores/state.js'
  import { activeView, showToast, dlgPrompt } from '../../stores/ui.js'
  import { sanitizeHtml, esc, safeUrl } from '../../lib/security.js'
  import { COVER_GRADIENTS } from '../../lib/utils.js'
  import FormattingToolbar from './FormattingToolbar.svelte'
  import Block from './Block.svelte'
  import SlashMenu from './SlashMenu.svelte'

  $: page = $state.pages.find(p => p.id === $state.currentPageId)
  $: folder = page?.folderId ? ($state.folders||[]).find(f => f.id === page.folderId) : null

  let wordCount = 0

  $: if (page?.blocks) {
    const text = page.blocks.map(b => {
      const tmp = document.createElement('div')
      tmp.innerHTML = b.content || ''
      return tmp.textContent || ''
    }).join(' ')
    wordCount = text.trim().split(/\s+/).filter(w => w.length > 0).length
  }

  function updateTitle(e) {
    if (!page) return
    state.updatePage(page.id, { title: e.target.value })
  }

  function changeCover() {
    if (!page) return
    const next = COVER_GRADIENTS[Math.floor(Math.random() * COVER_GRADIENTS.length)]
    state.updatePage(page.id, { cover: next })
  }

  function changeEmoji() {
    const emojis = ['📄','📚','📖','📝','✍️','🔬','🧮','🎯','💡','🌟','📊','🗒️','📋','🧠','⚗️','🔭']
    state.updatePage(page.id, { emoji: emojis[Math.floor(Math.random() * emojis.length)] })
  }

  async function moveToFolder() {
    if (!page) return
    // Use select from folder list — simplified version
    const folderName = await dlgPrompt('Nome da pasta destino (ou deixe vazio para remover):',
      { icon: '📁', title: 'Mover página', inputLabel: 'Pasta',
        defaultValue: folder?.name || '' })
    if (folderName === null) return
    const found = ($state.folders||[]).find(f => f.name.toLowerCase() === folderName.trim().toLowerCase())
    state.movePageToFolder(page.id, found?.id || '')
    showToast(found ? `Movido para "${found.name}"` : 'Removido da pasta.')
  }

  function addBlock(type, afterId = null) {
    if (!page) return
    const newBlock = { id: Date.now().toString(), type, content: '', checked: false }
    const blocks = [...(page.blocks || [])]
    if (afterId) {
      const idx = blocks.findIndex(b => b.id === afterId)
      blocks.splice(idx + 1, 0, newBlock)
    } else {
      blocks.push(newBlock)
    }
    state.updatePageBlocks(page.id, blocks)
    return newBlock.id
  }

  function deleteBlock(id) {
    if (!page || page.blocks.length <= 1) return
    const blocks = page.blocks.filter(b => b.id !== id)
    state.updatePageBlocks(page.id, blocks)
  }

  function updateBlock(id, content) {
    if (!page) return
    const blocks = page.blocks.map(b =>
      b.id === id ? { ...b, content: sanitizeHtml(content) } : b
    )
    state.updatePageBlocks(page.id, blocks)
  }

  function updateBlockType(id, type) {
    if (!page) return
    const blocks = page.blocks.map(b => b.id === id ? { ...b, type, content: '' } : b)
    state.updatePageBlocks(page.id, blocks)
  }

  function toggleTodo(id, checked) {
    if (!page) return
    const blocks = page.blocks.map(b => b.id === id ? { ...b, checked } : b)
    state.updatePageBlocks(page.id, blocks)
  }

  // Slash menu
  let slashMenu = null
  let slashMenuPos = { x: 0, y: 0 }
  let slashBlockId = null

  function showSlash(blockId, pos) {
    slashBlockId = blockId
    slashMenuPos = pos
    slashMenu = true
  }
  function hideSlash() { slashMenu = false; slashBlockId = null }

  function onSlashSelect(type) {
    if (slashBlockId) updateBlockType(slashBlockId, type)
    hideSlash()
  }
</script>

{#if !page}
  <div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--t3);font-size:14px">
    Selecione ou crie uma página no painel lateral
  </div>
{:else}
  <div class="editor-topbar">
    <button class="folder-tag" on:click={moveToFolder}>
      {#if folder}{folder.emoji||'📁'} {folder.name}{:else}<span style="color:var(--t3)">+ Adicionar à pasta</span>{/if}
    </button>
    <span class="wc">{wordCount} {wordCount === 1 ? 'palavra' : 'palavras'}</span>
  </div>

  <div class="editor-body">
    <div class="cover" style="background:{page.cover}" role="button" tabindex="0"
      on:click={changeCover} on:keydown={e=>e.key==='Enter'&&changeCover()}>
      <button class="cover-change-btn">Alterar capa</button>
    </div>

    <button class="emoji-btn" on:click={changeEmoji} title="Clique para mudar o ícone">
      {page.emoji || '📄'}
    </button>

    <input class="title-inp" value={page.title || ''} placeholder="Sem título"
      on:input={updateTitle}
      on:keydown={e => { if(e.key==='Enter'){e.preventDefault();addBlock('paragraph',null)} }} />

    <div class="blocks">
      {#each (page.blocks || []) as block, i (block.id)}
        <Block {block} blockIndex={i}
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
  </div>

  <FormattingToolbar />

  {#if slashMenu}
    <SlashMenu pos={slashMenuPos} on:select={e => onSlashSelect(e.detail)} on:close={hideSlash} />
  {/if}
{/if}

<style>
  :global {

  .editor-topbar { display:flex;align-items:center;gap:8px;padding:10px 60px;
    border-bottom:1px solid var(--border);position:sticky;top:0;
    background:rgba(8,8,13,0.95);backdrop-filter:blur(8px);z-index:50; }
  :global(body.light-mode) .editor-topbar { background:rgba(245,244,240,0.95); }
  .folder-tag { display:flex;align-items:center;gap:5px;font-size:12px;color:var(--t2);
    background:var(--s3);border-radius:20px;padding:3px 10px;cursor:pointer;border:none;
    font-family:var(--font-sans);transition:all 0.12s; }
  .folder-tag:hover { background:var(--s4); }
  .wc { font-size:11px;color:var(--t3);margin-left:auto; }
  .editor-body { padding:20px 60px 80px;max-width:820px;margin:0 auto; }
  .cover { width:100%;height:160px;border-radius:var(--r-lg);margin-bottom:32px;
    display:flex;align-items:flex-end;padding:20px;position:relative;overflow:hidden;cursor:pointer; }
  .cover-change-btn { position:absolute;top:12px;right:12px;font-size:11px;background:rgba(0,0,0,0.4);
    color:rgba(255,255,255,0.6);border:none;border-radius:var(--r-sm);padding:4px 8px;cursor:pointer;
    font-family:var(--font-sans);opacity:0;transition:opacity 0.15s; }
  .cover:hover .cover-change-btn { opacity:1; }
  .emoji-btn { font-size:48px;line-height:1;background:none;border:none;cursor:pointer;
    margin-bottom:12px;display:block;transition:transform 0.1s; }
  .emoji-btn:hover { transform:scale(1.05); }
  .title-inp { font-family:var(--font-serif);font-size:36px;font-weight:600;color:var(--text);
    background:none;border:none;outline:none;width:100%;line-height:1.2;margin-bottom:8px;
    caret-color:var(--accent); }
  .title-inp::placeholder { color:var(--t4); }
  .blocks { padding-top:4px; }
  @media(max-width:900px) { .editor-body { padding:12px 20px 60px; } .editor-topbar { padding:10px 20px; } }

  }
</style>
