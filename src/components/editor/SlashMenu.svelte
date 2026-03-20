<script>
  import { createEventDispatcher } from 'svelte'
  export let pos = { x: 0, y: 0 }
  const dispatch = createEventDispatcher()

  const items = [
    { type:'h1',       icon:'H1', label:'Título grande',    desc:'Seção principal' },
    { type:'h2',       icon:'H2', label:'Título médio',     desc:'Subseção' },
    { type:'h3',       icon:'H3', label:'Título pequeno',   desc:'Subtítulo' },
    { type:'todo',     icon:'☑',  label:'To-do',            desc:'Lista de tarefas' },
    { type:'bullet',   icon:'•',  label:'Lista',            desc:'Ponto de lista' },
    { type:'numbered', icon:'1.', label:'Lista numerada',   desc:'Lista ordenada' },
    { type:'quote',    icon:'"',  label:'Citação',          desc:'Citação ou destaque' },
    { type:'callout',  icon:'💡', label:'Destaque',         desc:'Bloco de atenção' },
    { type:'code',     icon:'{}', label:'Código',           desc:'Bloco de código' },
    { type:'divider',  icon:'—',  label:'Divisor',          desc:'Linha divisória' },
  ]
</script>

<div class="slash-menu" style="left:{pos.x}px;top:{pos.y}px">
  {#each items as item}
    <div class="slash-item" on:click={() => dispatch('select', item.type)} role="button" tabindex="0">
      <div class="slash-icon">{item.icon}</div>
      <div>
        <div class="slash-name">{item.label}</div>
        <div class="slash-desc">{item.desc}</div>
      </div>
    </div>
  {/each}
</div>

<style>
  :global {

  .slash-menu { position:fixed;background:var(--s2);border:1px solid var(--border2);
    border-radius:var(--r-lg);padding:6px;min-width:220px;box-shadow:var(--shadow);z-index:1000; }
  .slash-item { display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:var(--r-sm);cursor:pointer;transition:background 0.1s; }
  .slash-item:hover { background:var(--s3); }
  .slash-icon { width:30px;height:30px;background:var(--s3);border-radius:var(--r-sm);
    display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0; }
  .slash-name { font-size:13px;color:var(--text);font-weight:500; }
  .slash-desc { font-size:11px;color:var(--t3); }

  }
</style>
