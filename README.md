# StudyOS — Svelte + Vite

Workspace de estudos modular com Firebase Auth, Firestore, Google Calendar e editor de blocos estilo Notion.

## Stack

- **Svelte 4** — compilado para JS vanilla, sem runtime overhead
- **Vite 5** — bundler moderno com HMR instantâneo
- **Firebase 10** — Auth (Google + e-mail) + Firestore (tempo real)
- **CSS puro** — variáveis CSS para temas dark/light

## Setup

```bash
# 1. Instalar dependências
npm install

# 2. Configurar Firebase
cp .env.example .env
# Preencha os valores com as credenciais do seu projeto Firebase

# 3. Servidor de desenvolvimento
npm run dev

# 4. Build de produção
npm run build
```

## Configuração Firebase

1. [console.firebase.google.com](https://console.firebase.google.com) → Criar projeto
2. Registrar app Web → copiar `firebaseConfig` para `.env`
3. **Authentication** → Ativar E-mail/senha + Google
4. **Firestore** → Criar banco (modo teste)

## Estrutura do Projeto

```
src/
├── main.js              ← Entry point
├── App.svelte           ← Roteador raiz + listener de auth
├── firebase.js          ← Inicialização do Firebase (credenciais via .env)
│
├── stores/
│   ├── state.js         ← Estado central + helpers imutáveis + derived stores
│   ├── auth.js          ← currentUser, isLoggedIn, gcalToken
│   ├── ui.js            ← activeView, toast, dialog (dlgAlert/Confirm/Prompt)
│   └── theme.js         ← dark/light, persiste no localStorage
│
├── lib/
│   ├── security.js      ← esc(), sanitizeHtml(), safeUrl(), rate limiter
│   ├── utils.js         ← datas, formatação, CORES, DIAS, isTaskToday()
│   ├── db.js            ← subscribeDb(), saveDb() com debounce, fallback localStorage
│   └── gcal.js          ← requestCalendarAccess(), addEventToCalendar()
│
├── components/
│   ├── auth/
│   │   ├── LoginScreen.svelte    ← login/register + Google, rate limiting
│   │   └── SetupOverlay.svelte   ← guia de configuração Firebase
│   ├── layout/
│   │   ├── Topbar.svelte         ← sync status, gcal, tema, user/logout
│   │   ├── Sidebar.svelte        ← nav + caderno drag&drop + pastas
│   │   └── Dialog.svelte         ← modal customizado (substitui alert/confirm/prompt)
│   ├── views/
│   │   ├── Dashboard.svelte      ← métricas, Chart.js, listas ✅
│   │   ├── Tasks.svelte          ← tarefas + Google Calendar 🔄
│   │   ├── Subjects.svelte       ← matérias + notas 🔄
│   │   ├── Timer.svelte          ← Pomodoro 🔄
│   │   ├── Goals.svelte          ← metas 🔄
│   │   └── CalendarView.svelte   ← calendário mensal 🔄
│   ├── editor/
│   │   ├── PageEditor.svelte     ← editor principal, capa, título ✅
│   │   ├── Block.svelte          ← bloco individual + Tab/Shift+Tab ✅
│   │   ├── FormattingToolbar.svelte ← toolbar flutuante ✅
│   │   └── SlashMenu.svelte      ← menu /comando ✅
│   └── ui/
│       └── Toast.svelte          ← notificações ✅
│
└── styles/
    ├── global.css       ← reset, body, scrollbars
    ├── theme.css        ← variáveis CSS dark/light
    └── components.css   ← cards, badges, botões, inputs, métricas
```

## Padrões de Código

### Lendo estado em componentes
```svelte
<script>
  import { state, todayTasks } from '../../stores/state.js'
</script>

<!-- Reativo: atualiza automaticamente -->
<p>Tarefas hoje: {$todayTasks.length}</p>
```

### Mutando estado (imutável)
```svelte
<script>
  import { state } from '../../stores/state.js'
  // Sempre use os helpers — nunca mute diretamente
  state.addTask(novaTask)
  state.toggleTask(id)
  state.patch({ metaSemanal: 30 })
</script>
```

### Diálogos customizados
```svelte
<script>
  import { dlgConfirm, dlgPrompt, dlgAlert } from '../../stores/ui.js'

  async function remover() {
    const ok = await dlgConfirm('Tem certeza?', { dangerConfirm: true })
    if (!ok) return
    // ...
  }

  async function renomear() {
    const nome = await dlgPrompt('Novo nome:', { placeholder: 'Ex: Cálculo I' })
    if (!nome) return
    // ...
  }
</script>
```

## Deploy (Vercel)

```bash
npm run build        # gera dist/
# Vercel: preset "Other", output dir "dist", build command "npm run build"
# Adicionar variáveis de ambiente no painel do Vercel (as mesmas do .env)
```

## Status da Migração

| Módulo          | Status |
|-----------------|--------|
| Auth + Firebase | ✅ Completo |
| Editor de blocos| ✅ Completo |
| Dashboard       | ✅ Completo |
| Sidebar + pastas| ✅ Completo |
| Tema dark/light | ✅ Completo |
| Dialog system   | ✅ Completo |
| Tarefas + GCal  | ✅ Completo |
| Matérias        | ✅ Completo |
| Pomodoro        | ✅ Completo |
| Metas           | ✅ Completo |
| Calendário      | ✅ Completo |
