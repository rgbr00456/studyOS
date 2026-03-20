<script>
  import { toastMessage } from '../../stores/ui.js'
</script>

{#if $toastMessage}
  <div class="toast" role="status">{$toastMessage}</div>
{/if}
