<script>
  import { onMount } from 'svelte'
  import { safeUrl } from '../../lib/security.js'

  let visible = false
  let pos = { left: 0, top: 0 }
  let states = { bold: false, italic: false, underline: false, strike: false }
  let toolbarEl

  function check() {
    const sel = window.getSelection()
    if (!sel || sel.isCollapsed || !sel.toString().trim()) { visible = false; return }
    const range = sel.getRangeAt(0)
    const container = range.commonAncestorContainer
    const block = container.nodeType === 3 ? container.parentElement : container
    if (!block.closest('.blocks')) { visible = false; return }

    visible = true
    const rect = range.getBoundingClientRect()
    if (!toolbarEl) return
    const tbW = toolbarEl.offsetWidth || 380
    let left = rect.left + rect.width / 2 - tbW / 2
    let top  = rect.top - (toolbarEl.offsetHeight || 48) - 10
    if (top < 8) top = rect.bottom + 10
    left = Math.max(8, Math.min(left, window.innerWidth - tbW - 8))
    pos = { left, top }

    try {
      states.bold      = document.queryCommandState('bold')
      states.italic    = document.queryCommandState('italic')
      states.underline = document.queryCommandState('underline')
      states.strike    = document.queryCommandState('strikeThrough')
    } catch {}
  }

  function exec(cmd) { document.execCommand(cmd, false, null); check() }

  function highlight(color) {
    const colors = { yellow:'#f5e642', green:'#52c48a', blue:'#6b9ae8', pink:'#e87a9a', orange:'#e8a84b' }
    const texts  = { yellow:'#2a2600', green:'#0a2010', blue:'#050e28', pink:'#28000e', orange:'#28160a' }
    const sel = window.getSelection()
    if (!sel || sel.isCollapsed) return
    const range = sel.getRangeAt(0)
    const span  = document.createElement('span')
    span.className = `hl-${color}`
    span.style.background   = colors[color]
    span.style.color        = texts[color]
    span.style.borderRadius = '2px'
    span.style.padding      = '0 2px'
    try { range.surroundContents(span) } catch { document.execCommand('hiliteColor', false, colors[color]) }
    visible = false
  }

  function clearHighlight() {
    document.execCommand('removeFormat', false, null)
    visible = false
  }

  function setFont(font) { if (font) document.execCommand('fontName', false, font) }
  function setSize(size) { if (size) document.execCommand('fontSize', false, size) }
  function undo()  { document.execCommand('undo',  false, null) }
  function redo()  { document.execCommand('redo',  false, null) }

  function fmtErase() {
    document.execCommand('removeFormat', false, null)
    const sel = window.getSelection()
    if (!sel || sel.isCollapsed) return
    const range = sel.getRangeAt(0)
    const frag  = range.cloneContents()
    const tmp   = document.createElement('div')
    tmp.appendChild(frag)
    tmp.querySelectorAll('span,b,i,u,s,strong,em').forEach(el => el.replaceWith(document.createTextNode(el.textContent)))
    range.deleteContents()
    range.insertNode(tmp.firstChild || document.createTextNode(''))
    visible = false
  }

  async function insertLink() {
    // We can't use dlgPrompt here easily without circular dep
    // Simple approach: use a focused inline method
    visible = false
    const url = window.prompt('URL do link:', 'https://')
    if (url && url.startsWith('http')) document.execCommand('createLink', false, safeUrl(url))
  }

  onMount(() => {
    document.addEventListener('mouseup', () => setTimeout(check, 10))
    document.addEventListener('keyup',   () => setTimeout(check, 10))
    document.addEventListener('mousedown', e => {
      if (!e.target.closest('.fmt-toolbar')) { visible = false }
    })
  })
</script>

<div bind:this={toolbarEl} class="fmt-toolbar" class:visible
  style="left:{pos.left}px;top:{pos.top}px">

  <select class="fmt-sel" on:mousedown|stopPropagation on:change={e => setFont(e.target.value)}>
    <option value="">Fonte</option>
    <option value="DM Sans, sans-serif">DM Sans</option>
    <option value="Playfair Display, serif">Playfair</option>
    <option value="JetBrains Mono, monospace">Mono</option>
    <option value="Georgia, serif">Georgia</option>
    <option value="Arial, sans-serif">Arial</option>
  </select>

  <select class="fmt-sel sm" on:mousedown|stopPropagation on:change={e => setSize(e.target.value)}>
    <option value="">Tam</option>
    {#each [[1,10],[2,13],[3,16],[4,18],[5,24],[6,32],[7,48]] as [v,l]}
      <option value={v}>{l}</option>
    {/each}
  </select>

  <div class="sep"></div>
  <button class="tb-btn" on:mousedown|preventDefault={() => undo()} title="Desfazer (Ctrl+Z)">
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M3 7v6h6"/><path d="M3 13A9 9 0 1 0 5.5 5.5L3 7"/></svg>
  </button>
  <button class="tb-btn" on:mousedown|preventDefault={() => redo()} title="Avançar (Ctrl+Y)">
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M21 7v6h-6"/><path d="M21 13A9 9 0 1 1 18.5 5.5L21 7"/></svg>
  </button>
  <div class="sep"></div>

  <button class="tb-btn" class:active={states.bold}    on:mousedown|preventDefault={() => exec('bold')} title="Negrito (Ctrl+B)"><svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M6 4h8a4 4 0 010 8H6V4zm0 8h9a4 4 0 010 8H6v-8z"/></svg></button>
  <button class="tb-btn" class:active={states.italic}  on:mousedown|preventDefault={() => exec('italic')} title="Itálico (Ctrl+I)"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="19" y1="4" x2="10" y2="4"/><line x1="14" y1="20" x2="5" y2="20"/><line x1="15" y1="4" x2="9" y2="20"/></svg></button>
  <button class="tb-btn" class:active={states.underline} on:mousedown|preventDefault={() => exec('underline')} title="Sublinhado (Ctrl+U)"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M6 3v7a6 6 0 0012 0V3"/><line x1="4" y1="21" x2="20" y2="21"/></svg></button>
  <button class="tb-btn" class:active={states.strike}  on:mousedown|preventDefault={() => exec('strikeThrough')} title="Tachado"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M17.3 12H20M4 12h8.7"/><line x1="4" y1="12" x2="20" y2="12"/></svg></button>

  <div class="sep"></div>
  <div class="swatches">
    {#each [['yellow','#f5e642'],['green','#52c48a'],['blue','#6b9ae8'],['pink','#e87a9a'],['orange','#e8a84b']] as [name, color]}
      <div class="swatch" style="background:{color}" title={name} on:mousedown|preventDefault={() => highlight(name)}></div>
    {/each}
    <div class="swatch clear" on:mousedown|preventDefault={clearHighlight} title="Remover marca-texto"></div>
  </div>
  <div class="sep"></div>

  <button class="tb-btn" on:mousedown|preventDefault={fmtErase} title="Borracha">
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M20 20H7L3 16l10-10 7 7-3.5 3.5"/><path d="M6 11l7 7"/></svg>
  </button>
  <button class="tb-btn" on:click={insertLink} title="Link">
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>
  </button>
</div>

<style>
  :global {

  .fmt-toolbar {
    position:fixed;background:var(--s1);border:1px solid var(--border2);border-radius:10px;
    padding:4px 6px;display:flex;align-items:center;gap:1px;
    box-shadow:0 12px 32px rgba(0,0,0,0.6);z-index:2000;
    opacity:0;pointer-events:none;transition:opacity 0.12s,transform 0.12s;
    transform:translateY(4px);white-space:nowrap;user-select:none;
  }
  .fmt-toolbar.visible { opacity:1;pointer-events:all;transform:translateY(0); }
  .sep { width:1px;height:16px;background:var(--border2);margin:0 2px;flex-shrink:0; }
  .tb-btn { width:28px;height:28px;border:none;background:none;border-radius:6px;
    color:var(--t2);cursor:pointer;font-size:13px;display:flex;align-items:center;justify-content:center;
    transition:all 0.1s; }
  .tb-btn:hover { background:var(--s3);color:var(--text); }
  .tb-btn.active { background:var(--accent-dim);color:var(--accent); }
  .fmt-sel { font-size:11px;padding:2px 4px;background:var(--s2);border:1px solid var(--border2);
    border-radius:5px;color:var(--text);cursor:pointer;outline:none;width:88px; }
  .fmt-sel.sm { width:50px; }
  .swatches { display:flex;align-items:center;gap:3px;padding:0 2px; }
  .swatch { width:18px;height:18px;border-radius:4px;cursor:pointer;
    border:1.5px solid transparent;transition:transform 0.1s; }
  .swatch:hover { transform:scale(1.2); }
  .swatch.clear { background:transparent;border-color:var(--border2); }

  }
</style>
