<script>
  import { toastMessage } from '../../stores/ui.js'
</script>

{#if $toastMessage}
  <div class="toast" role="status">{$toastMessage}</div>
{/if}

<style>
  :global {

  .toast {
    position: fixed; bottom: 24px; right: 24px;
    background: var(--s2); border: 1px solid var(--border2);
    border-radius: 30px; padding: 10px 18px;
    font-size: 13px; color: var(--text);
    box-shadow: var(--shadow-sm); z-index: 9100;
    animation: toastIn 0.22s ease;
  }
  @keyframes toastIn { from { opacity:0; transform:translateY(10px) } to { opacity:1; transform:translateY(0) } }

  }
</style>
