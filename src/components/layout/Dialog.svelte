<script>
  import { dialogState } from '../../stores/ui.js'

  let inputValue = ''
  let inputEl

  $: if ($dialogState?.type === 'prompt' && inputEl) {
    setTimeout(() => { inputEl?.focus(); inputEl?.select() }, 80)
  }

  function handleBtn(btn) {
    const val = (btn.value === '__input__' || $dialogState.type === 'prompt') ? inputValue : btn.value
    $dialogState?.resolve(val || null)
    dialogState.set(null)
    inputValue = ''
  }

  function handleOverlay(e) {
    if (e.target === e.currentTarget) {
      $dialogState?.resolve(null); dialogState.set(null)
    }
  }

  function handleKey(e) {
    if (!$dialogState) return
    if (e.key === 'Enter' && $dialogState.type === 'prompt') {
      $dialogState.resolve(inputValue || null); dialogState.set(null); inputValue = ''
    }
    if (e.key === 'Escape') { $dialogState.resolve(null); dialogState.set(null) }
  }
</script>

<svelte:window on:keydown={handleKey} />

{#if $dialogState}
  <div class="overlay" on:click={handleOverlay} role="dialog" aria-modal="true">
    <div class="box">
      {#if $dialogState.icon}<span class="icon">{$dialogState.icon}</span>{/if}
      <div class="title">{$dialogState.title}</div>
      {#if $dialogState.msg}<div class="msg">{$dialogState.msg}</div>{/if}
      {#if $dialogState.type === 'prompt'}
        {#if $dialogState.inputLabel}<label class="inp-label">{$dialogState.inputLabel}</label>{/if}
        <input bind:this={inputEl} bind:value={inputValue}
          class="dlg-input" placeholder={$dialogState.placeholder || ''} />
      {/if}
      <div class="btns">
        {#each $dialogState.buttons as btn}
          <button class={btn.danger ? 'btn-danger' : btn.primary ? 'btn' : 'btn-ghost'}
            on:mousedown|preventDefault on:click={() => handleBtn(btn)}>{btn.label}</button>
        {/each}
      </div>
    </div>
  </div>
{/if}

<style>
  .overlay { position:fixed;inset:0;background:rgba(0,0,0,0.55);backdrop-filter:blur(4px);
    z-index:9000;display:flex;align-items:center;justify-content:center;padding:20px;animation:fi 0.15s; }
  @keyframes fi { from{opacity:0} to{opacity:1} }
  .box { background:var(--s1);border:1px solid var(--border2);border-radius:var(--r-xl);
    padding:24px;width:100%;max-width:380px;box-shadow:var(--shadow);animation:si 0.15s; }
  @keyframes si { from{transform:scale(0.97)} to{transform:scale(1)} }
  .icon  { font-size:28px;display:block;margin-bottom:10px; }
  .title { font-family:var(--font-serif);font-size:18px;font-weight:600;color:var(--text);margin-bottom:6px; }
  .msg   { font-size:13.5px;color:var(--t2);line-height:1.6;margin-bottom:16px; }
  .inp-label { font-size:12px;color:var(--t2);margin-bottom:5px;display:block;font-weight:500; }
  .dlg-input { width:100%;background:var(--s3);border:1.5px solid var(--border2);border-radius:var(--r-sm);
    color:var(--text);font-family:var(--font-sans);font-size:15px;padding:11px 13px;
    outline:none;margin-bottom:16px;transition:border-color 0.15s; }
  .dlg-input:focus { border-color:var(--accent); }
  .btns { display:flex;gap:8px;margin-top:4px; }
  .btns > :global(*) { flex:1; }
</style>
