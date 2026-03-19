<script>
  // src/components/DialogModal.svelte
  // Renderiza o diálogo customizado baseado no store `dialog`.
  // Um único componente global — montado uma vez no App.svelte.

  import { dialog, closeDialog } from '../stores/dialog.js'

  let inputValue = ''

  // Quando um novo diálogo abre, inicializa o input
  $: if ($dialog?.type === 'prompt') {
    inputValue = $dialog.defaultValue || ''
  }

  function confirm() {
    if ($dialog?.type === 'prompt') {
      closeDialog(inputValue.trim() || null)
    } else {
      closeDialog(true)
    }
  }

  function cancel() {
    closeDialog($dialog?.type === 'alert' ? true : false)
  }

  function onOverlayClick(e) {
    if (e.target === e.currentTarget) cancel()
  }

  function onKeydown(e) {
    if (!$dialog) return
    if (e.key === 'Enter')  confirm()
    if (e.key === 'Escape') cancel()
  }
</script>

<svelte:window on:keydown={onKeydown} />

{#if $dialog}
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <div class="overlay" on:click={onOverlayClick}>
    <div class="box" role="dialog" aria-modal="true">

      {#if $dialog.icon}
        <span class="icon">{$dialog.icon}</span>
      {/if}

      <h2 class="title">{$dialog.title}</h2>

      {#if $dialog.msg}
        <p class="msg">{$dialog.msg}</p>
      {/if}

      {#if $dialog.type === 'prompt'}
        {#if $dialog.inputLabel}
          <label class="inp-label">{$dialog.inputLabel}</label>
        {/if}
        <!-- svelte-ignore a11y-autofocus -->
        <input
          class="inp"
          type="text"
          bind:value={inputValue}
          placeholder={$dialog.placeholder || ''}
          autofocus
        />
      {/if}

      <div class="btns">
        {#if $dialog.type !== 'alert'}
          <button class="btn-ghost" on:click={cancel}>Cancelar</button>
        {/if}

        <button
          class={$dialog.dangerConfirm ? 'btn-danger' : 'btn'}
          on:click={confirm}
        >
          {$dialog.type === 'confirm' ? ($dialog.confirmLabel || 'Confirmar') : 'OK'}
        </button>
      </div>

    </div>
  </div>
{/if}

<style>
  .overlay {
    position: fixed; inset: 0;
    background: rgba(0,0,0,0.55);
    backdrop-filter: blur(4px);
    z-index: 9000;
    display: flex; align-items: center; justify-content: center;
    padding: 20px;
    animation: fadeIn 0.15s ease;
  }
  @keyframes fadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }

  .box {
    background: var(--s1);
    border: 1px solid var(--border2);
    border-radius: var(--r-xl);
    padding: 24px;
    width: 100%; max-width: 380px;
    box-shadow: var(--shadow);
    animation: slideUp 0.15s ease;
  }
  @keyframes slideUp {
    from { transform: translateY(8px); opacity: 0; }
    to   { transform: translateY(0);   opacity: 1; }
  }

  .icon  { font-size: 28px; display: block; margin-bottom: 10px; }
  .title { font-family: var(--font-serif); font-size: 18px; font-weight: 600; color: var(--text); margin-bottom: 6px; }
  .msg   { font-size: 13.5px; color: var(--t2); line-height: 1.6; margin-bottom: 16px; }

  .inp-label { font-size: 12px; color: var(--t2); font-weight: 500; display: block; margin-bottom: 5px; }
  .inp {
    width: 100%;
    background: var(--s3); border: 1.5px solid var(--border2); border-radius: var(--r-sm);
    color: var(--text); font-family: var(--font-sans); font-size: 15px;
    padding: 11px 13px; outline: none; margin-bottom: 16px;
    transition: border-color 0.15s;
  }
  .inp:focus { border-color: var(--accent); }

  .btns { display: flex; gap: 8px; }

  .btn, .btn-ghost, .btn-danger {
    flex: 1; padding: 9px 16px; border-radius: var(--r-sm);
    font-family: var(--font-sans); font-size: 13.5px; font-weight: 600;
    cursor: pointer; border: none; transition: all 0.15s;
  }
  .btn       { background: var(--accent); color: var(--bg); }
  .btn:hover { background: var(--accent2); }
  .btn-ghost { background: transparent; color: var(--t2); border: 1px solid var(--border2); }
  .btn-ghost:hover { background: var(--s3); color: var(--text); }
  .btn-danger { background: var(--red-dim); color: var(--red); border: 1px solid rgba(217,107,107,0.25); }
  .btn-danger:hover { background: rgba(217,107,107,0.25); }
</style>
