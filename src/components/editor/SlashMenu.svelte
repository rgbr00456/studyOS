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
