<script>
  import { onMount, onDestroy } from 'svelte'
  import { auth, isConfigured, gProvider } from './firebase.js'
  import { onAuthStateChanged, signOut, getRedirectResult } from 'firebase/auth'

  import { currentUser, isLoggedIn, isGoogleUser, gcalToken, authStatus } from './stores/auth.js'
  import { state } from './stores/state.js'
  import { activeView, syncStatus, showToast } from './stores/ui.js'
  import { theme } from './stores/theme.js'
  import { subscribeDb, unsubscribeDb, saveDb, loadLocal, saveLocal } from './lib/db.js'

  import SetupOverlay from './components/auth/SetupOverlay.svelte'
  import LoginScreen  from './components/auth/LoginScreen.svelte'
  import Topbar       from './components/layout/Topbar.svelte'
  import Sidebar      from './components/layout/Sidebar.svelte'
  import Dialog       from './components/layout/Dialog.svelte'
  import Toast        from './components/ui/Toast.svelte'
  import Dashboard    from './components/views/Dashboard.svelte'
  import Tasks        from './components/views/Tasks.svelte'
  import Subjects     from './components/views/Subjects.svelte'
  import Timer        from './components/views/Timer.svelte'
  import Goals        from './components/views/Goals.svelte'
  import CalendarView from './components/views/CalendarView.svelte'
  import PageEditor   from './components/editor/PageEditor.svelte'

  // ── Reactive bindings ───────────────────────────────────────────
  $: if (typeof document !== 'undefined') {
    const classes = []
    if ($theme === 'light') classes.push('light-mode')
    if ($authStatus === 'authenticated') classes.push('app-ready')
    document.body.className = classes.join(' ')
  }

  let uid = null

  function onSave() {
    if (isConfigured && uid) saveDb(uid, syncStatus.set)
    else if (!isConfigured) saveLocal($state)
  }

  // Subscribe to state changes → auto-save
  const unsubState = state.subscribe(() => { if (uid || !isConfigured) onSave() })

  onMount(() => {
    theme.init()

    if (!isConfigured) {
      // Offline mode — load from localStorage
      const local = loadLocal()
      if (Object.keys(local).length) state.update(s => ({ ...s, ...local }))
      authStatus.set('authenticated') // skip auth
      isLoggedIn.set(true)
      return
    }

    // Handle Google redirect result
    getRedirectResult(auth).catch(() => {})

    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        uid = user.uid
        currentUser.set(user)
        isLoggedIn.set(true)
        isGoogleUser.set(user.providerData.some(p => p.providerId === 'google.com'))
        authStatus.set('authenticated')

        subscribeDb(uid, {
          onReady: () => state.checkStreak(),
          onError: () => {},
          onSyncChange: syncStatus.set
        })
      } else {
        uid = null
        currentUser.set(null)
        isLoggedIn.set(false)
        isGoogleUser.set(false)
        gcalToken.set(null)
        authStatus.set('unauthenticated')
        unsubscribeDb()
      }
    })

    return () => { unsubAuth(); unsubState() }
  })

  onDestroy(() => { unsubState(); unsubscribeDb() })
</script>

{#if !isConfigured}
  <SetupOverlay />
{/if}

{#if $authStatus === 'unauthenticated'}
  <LoginScreen />
{/if}

{#if $authStatus === 'authenticated'}
  <!-- Main app shell -->
  <div class="app-shell">
    <Topbar />
    <Sidebar />
    <main class="main-content">
      {#if $activeView === 'dashboard'}   <Dashboard /> {/if}
      {#if $activeView === 'tarefas'}     <Tasks />     {/if}
      {#if $activeView === 'materias'}    <Subjects />  {/if}
      {#if $activeView === 'timer'}       <Timer />     {/if}
      {#if $activeView === 'metas'}       <Goals />     {/if}
      {#if $activeView === 'calendario'}  <CalendarView />{/if}
      {#if $activeView === 'page'}        <PageEditor /> {/if}
    </main>
  </div>
{/if}

<Dialog />
<Toast />
