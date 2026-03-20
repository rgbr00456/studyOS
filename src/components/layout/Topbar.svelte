<script>
  import { currentUser, gcalToken } from '../../stores/auth.js'
  import { syncStatus, showToast, dlgConfirm } from '../../stores/ui.js'
  import { theme } from '../../stores/theme.js'
  import { auth } from '../../firebase.js'
  import { signOut } from 'firebase/auth'
  import { unsubscribeDb } from '../../lib/db.js'
  import { requestCalendarAccess } from '../../lib/gcal.js'

  $: userName   = $currentUser?.displayName || $currentUser?.email?.split('@')[0] || '?'
  $: userAvatar = $currentUser?.photoURL
  $: themeIcon  = $theme === 'dark' ? '🌙' : '☀️'

  const syncLabel = { ok:'sincronizado', saving:'salvando...', error:'erro', off:'offline' }

  async function handleLogout() {
    const ok = await dlgConfirm('Tem certeza que deseja sair da conta?',
      { icon:'👋', title:'Sair da conta', confirmLabel:'Sair' })
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

<div class="topbar">
  <div class="topbar-left">
    <div class="logo">StudyOS</div>
  </div>

  <div class="topbar-right">
    <!-- Sync -->
    <div class="sync-pill">
      <div class="sync-dot"
        class:ok={$syncStatus==='ok'}
        class:saving={$syncStatus==='saving'}
        class:err={$syncStatus==='error'}></div>
      <span>{syncLabel[$syncStatus] || $syncStatus}</span>
    </div>

    <!-- Google Calendar -->
    <div class="gcal-status" on:click={handleGcal} role="button" tabindex="0"
      title={$gcalToken ? 'Desconectar Agenda' : 'Conectar Google Agenda'}>
      <div class="gcal-dot" class:connected={!!$gcalToken}></div>
      <span>{$gcalToken ? 'Agenda conectado' : 'Google Agenda'}</span>
    </div>

    <!-- Theme -->
    <button class="btn-icon" on:click={() => theme.toggle()} title="Alternar tema"
      style="font-size:16px;border:1px solid var(--border);border-radius:var(--r-sm);padding:5px 8px">
      {themeIcon}
    </button>

    <!-- User / logout -->
    <div class="user-pill" on:click={handleLogout} role="button" tabindex="0" title="Sair da conta">
      <div class="user-avatar">
        {#if userAvatar}
          <img src={userAvatar} alt={userName} referrerpolicy="no-referrer"
            style="width:100%;height:100%;object-fit:cover;border-radius:50%" />
        {:else}
          {userName[0]?.toUpperCase()}
        {/if}
      </div>
      <span class="user-name-topbar">{userName}</span>
    </div>
  </div>
</div>
