<script>
  import { currentUser, gcalToken, isGoogleUser } from '../../stores/auth.js'
  import { syncStatus, showToast, dlgConfirm, dlgAlert } from '../../stores/ui.js'
  import { theme } from '../../stores/theme.js'
  import { auth } from '../../firebase.js'
  import { signOut } from 'firebase/auth'
  import { unsubscribeDb } from '../../lib/db.js'
  import { requestCalendarAccess } from '../../lib/gcal.js'

  $: userName   = $currentUser?.displayName || $currentUser?.email?.split('@')[0] || '?'
  $: userAvatar = $currentUser?.photoURL
  $: themeIcon  = $theme === 'dark' ? '🌙' : '☀️'

  const syncLabel = { ok: 'sincronizado', saving: 'salvando...', error: 'erro', off: 'offline' }

  async function handleLogout() {
    const ok = await dlgConfirm('Tem certeza que deseja sair da conta?',
      { icon: '👋', title: 'Sair da conta', confirmLabel: 'Sair' })
    if (!ok) return
    unsubscribeDb()
    await signOut(auth)
  }

  async function handleGcal() {
    if ($gcalToken) { gcalToken.set(null); showToast('Google Agenda desconectado.'); return }
    try {
      const token = await requestCalendarAccess()
      if (token) { gcalToken.set(token); showToast('Google Agenda conectado! 📅') }
    } catch(e) {
      if (!e.message?.includes('popup-closed')) showToast('Erro ao conectar. Tente novamente.')
    }
  }
</script>

<header class="topbar">
  <div class="logo">Study<span>OS</span></div>

  <div class="right">
    <!-- Sync status -->
    <div class="sync-pill">
      <div class="sync-dot" class:ok={$syncStatus==='ok'} class:saving={$syncStatus==='saving'}
           class:error={$syncStatus==='error'}></div>
      <span>{syncLabel[$syncStatus] || $syncStatus}</span>
    </div>

    <!-- Google Calendar -->
    <button class="pill-btn" on:click={handleGcal}
      title={$gcalToken ? 'Desconectar Agenda' : 'Conectar Google Agenda'}>
      <span class="cal-dot" class:connected={!!$gcalToken}></span>
      {$gcalToken ? 'Agenda conectado' : 'Google Agenda'}
    </button>

    <!-- Theme toggle -->
    <button class="icon-btn" on:click={() => theme.toggle()} title="Alternar tema">
      {themeIcon}
    </button>

    <!-- User / logout -->
    <button class="user-pill" on:click={handleLogout} title="Sair da conta">
      {#if userAvatar}
        <img src={userAvatar} alt={userName} class="avatar" referrerpolicy="no-referrer" />
      {:else}
        <span class="avatar-letter">{userName[0]?.toUpperCase()}</span>
      {/if}
      <span class="uname">{userName}</span>
    </button>
  </div>
</header>
