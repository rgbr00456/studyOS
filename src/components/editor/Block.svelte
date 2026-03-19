<script>
  import { createEventDispatcher, afterUpdate } from 'svelte'
  import { sanitizeHtml } from '../../lib/security.js'

  export let block
  export let blockIndex

  const dispatch = createEventDispatcher()

  let el   // The contenteditable element

  // Sync DOM content when block.content changes externally (e.g. type change)
  afterUpdate(() => {
    if (el && el.innerHTML !== block.content) {
      el.innerHTML = block.content || ''
    }
  })

  function onInput() {
    dispatch('update', el.innerHTML)
    // Slash menu trigger
    if (el.innerText.startsWith('/')) {
      const rect = el.getBoundingClientRect()
      dispatch('slash', { x: rect.left, y: rect.bottom + 4 })
    } else {
      dispatch('hideslash')
    }
  }

  function onKeydown(e) {
    if (el?.classList.contains('code-block')) {
      if (e.key === 'Tab') {
        e.preventDefault()
        insertAtCursor('\u00a0\u00a0\u00a0\u00a0')
      }
      return
    }

    if (e.key === 'Tab') {
      e.preventDefault()
      if (e.shiftKey) removeIndent()
      else insertAtCursor('\u00a0\u00a0\u00a0\u00a0')
      return
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      const txt = el?.innerText.trim() || ''
      if (['todo','bullet','numbered'].includes(block.type) && txt === '') {
        e.preventDefault()
        dispatch('typechange', 'paragraph')
        return
      }
      e.preventDefault()
      dispatch('enter')
      return
    }

    if (e.key === 'Backspace' && (el?.innerText.trim() === '')) {
      e.preventDefault()
      dispatch('delete')
    }

    if (e.key === 'Escape') dispatch('hideslash')
  }

  function insertAtCursor(text) {
    const sel = window.getSelection()
    if (!sel?.rangeCount) return
    const range = sel.getRangeAt(0)
    if (!sel.isCollapsed) range.deleteContents()
    const node = document.createTextNode(text)
    range.insertNode(node)
    range.setStartAfter(node); range.setEndAfter(node)
    sel.removeAllRanges(); sel.addRange(range)
    dispatch('update', el.innerHTML)
  }

  function removeIndent() {
    const sel = window.getSelection()
    if (!sel?.rangeCount) return
    const range = sel.getRangeAt(0)
    const container = range.startContainer
    if (container.nodeType !== 3) return
    const text = container.textContent
    const offset = range.startOffset
    let lineStart = text.lastIndexOf('\n', offset - 1) + 1
    let toRemove = 0
    for (let i = lineStart; i < offset && toRemove < 4; i++) {
      if (text[i] === ' ' || text[i] === '\u00a0') toRemove++
      else break
    }
    if (toRemove > 0) {
      container.textContent = text.substring(0, lineStart) + text.substring(lineStart + toRemove)
      const newOffset = Math.max(lineStart, offset - toRemove)
      range.setStart(container, newOffset); range.setEnd(container, newOffset)
      sel.removeAllRanges(); sel.addRange(range)
      dispatch('update', el.innerHTML)
    }
  }
</script>

<div class="block-wrap" data-type={block.type}>
  <button class="handle" on:click={() => dispatch('delete')} title="Deletar bloco">⌫</button>

  {#if block.type === 'todo'}
    <div class="todo-wrap">
      <input type="checkbox" class="todo-cb" checked={block.checked}
        on:change={e => dispatch('toggletodo', e.target.checked)} />
      <div bind:this={el} class="block" class:done={block.checked}
        contenteditable="true" data-ph="Tarefa..."
        on:input={onInput} on:keydown={onKeydown}>{@html block.content || ''}</div>
    </div>

  {:else if block.type === 'bullet'}
    <div class="bullet-wrap">
      <div class="bullet-dot"></div>
      <div bind:this={el} class="block" contenteditable="true" data-ph="Item da lista..."
        on:input={onInput} on:keydown={onKeydown}>{@html block.content || ''}</div>
    </div>

  {:else if block.type === 'numbered'}
    <div class="numbered-wrap">
      <div class="num-label">{blockIndex + 1}.</div>
      <div bind:this={el} class="block" contenteditable="true" data-ph="Item numerado..."
        on:input={onInput} on:keydown={onKeydown}>{@html block.content || ''}</div>
    </div>

  {:else if block.type === 'quote'}
    <div class="quote-wrap">
      <div bind:this={el} class="block italic" contenteditable="true" data-ph="Citação..."
        on:input={onInput} on:keydown={onKeydown}>{@html block.content || ''}</div>
    </div>

  {:else if block.type === 'callout'}
    <div class="callout-wrap">
      <span class="callout-icon">💡</span>
      <div bind:this={el} class="block" contenteditable="true" data-ph="Escreva um destaque..."
        on:input={onInput} on:keydown={onKeydown}>{@html block.content || ''}</div>
    </div>

  {:else if block.type === 'code'}
    <div bind:this={el} class="block code-block" contenteditable="true" data-ph="// código..."
      on:input={onInput} on:keydown={onKeydown}>{@html block.content || ''}</div>

  {:else if block.type === 'divider'}
    <hr class="divider" />

  {:else if block.type === 'h1'}
    <div bind:this={el} class="block h1" contenteditable="true" data-ph="Título 1..."
      on:input={onInput} on:keydown={onKeydown}>{@html block.content || ''}</div>

  {:else if block.type === 'h2'}
    <div bind:this={el} class="block h2" contenteditable="true" data-ph="Título 2..."
      on:input={onInput} on:keydown={onKeydown}>{@html block.content || ''}</div>

  {:else if block.type === 'h3'}
    <div bind:this={el} class="block h3" contenteditable="true" data-ph="Título 3..."
      on:input={onInput} on:keydown={onKeydown}>{@html block.content || ''}</div>

  {:else}
    <div bind:this={el} class="block" contenteditable="true" data-ph="Escreva algo, ou / para comandos..."
      on:input={onInput} on:keydown={onKeydown}>{@html block.content || ''}</div>
  {/if}
</div>

<style>
  .block-wrap { position:relative; margin:1px 0; }
  .block-wrap:hover .handle { opacity:1; }
  .handle { position:absolute;left:-28px;top:50%;transform:translateY(-50%);opacity:0;
    transition:opacity 0.12s;background:none;border:none;color:var(--t3);cursor:pointer;
    padding:3px;border-radius:4px;font-size:12px; }
  .handle:hover { background:var(--s3);color:var(--text); }
  .block { outline:none;min-height:1.5em;width:100%;font-size:15px;line-height:1.7;
    color:var(--text);caret-color:var(--accent);font-family:var(--font-sans); }
  .block:empty::before { content:attr(data-ph);color:var(--t4);pointer-events:none; }
  .block.h1 { font-family:var(--font-serif);font-size:30px;font-weight:600;line-height:1.3; }
  .block.h2 { font-family:var(--font-serif);font-size:22px;font-weight:600;line-height:1.3; }
  .block.h3 { font-size:17px;font-weight:600;line-height:1.4; }
  .block.italic { font-style:italic;color:var(--t2);font-family:var(--font-serif); }
  .block.done { text-decoration:line-through;color:var(--t3); }
  .code-block { font-family:var(--font-mono);font-size:13px;background:var(--s3);
    border:1px solid var(--border);border-radius:var(--r);padding:14px;color:var(--green);
    white-space:pre-wrap;word-break:break-all; }
  .todo-wrap { display:flex;align-items:flex-start;gap:8px;margin:2px 0; }
  .todo-cb { width:16px;height:16px;border-radius:4px;border:1.5px solid var(--border3);
    background:none;cursor:pointer;flex-shrink:0;margin-top:5px;
    transition:all 0.15s;appearance:none;-webkit-appearance:none; }
  .todo-cb:checked { background:var(--accent);border-color:var(--accent); }
  .bullet-wrap { display:flex;gap:10px;align-items:flex-start;margin:2px 0; }
  .bullet-dot { width:5px;height:5px;border-radius:50%;background:var(--t3);flex-shrink:0;margin-top:10px; }
  .numbered-wrap { display:flex;gap:8px;align-items:flex-start;margin:2px 0; }
  .num-label { min-width:20px;font-size:14px;color:var(--t2);text-align:right;flex-shrink:0;margin-top:4px; }
  .quote-wrap { border-left:3px solid var(--accent);padding-left:14px;margin:4px 0; }
  .callout-wrap { background:var(--accent-glow);border:1px solid rgba(201,169,110,0.15);
    border-radius:var(--r);padding:12px 14px;display:flex;gap:10px;margin:4px 0; }
  .callout-icon { font-size:16px;flex-shrink:0;margin-top:2px; }
  .divider { border:none;border-top:1px solid var(--border);margin:12px 0; }
</style>
