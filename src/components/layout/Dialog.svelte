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
