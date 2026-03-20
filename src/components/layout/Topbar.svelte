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

<style>
  :global {

  .topbar {
    position: fixed; top: 0; left: 0; right: 0; height: var(--topbar);
    background: rgba(8,8,13,0.92); backdrop-filter: blur(12px);
    border-bottom: 1px solid var(--border);
    display: flex; align-items: center; justify-content: space-between;
    padding: 0 20px; z-index: 200;
  }
  :global(body.light-mode) .topbar { background: rgba(245,244,240,0.95); }
  .logo { font-family: var(--font-serif); font-size: 17px; font-weight: 600; color: var(--accent); font-style: italic; }
  .logo span { color: var(--t3); font-weight: 400; }
  .right { display: flex; align-items: center; gap: 8px; }
  .sync-pill { display:flex;align-items:center;gap:5px;padding:4px 10px;border-radius:var(--r-sm);
    border:1px solid var(--border);font-size:11px;color:var(--t3); }
  .sync-dot { width:6px;height:6px;border-radius:50%;background:var(--t3);flex-shrink:0; }
  .sync-dot.ok     { background:var(--green); box-shadow:0 0 5px rgba(82,196,138,0.4); }
  .sync-dot.saving { background:var(--amber); animation:pulse 1s infinite; }
  .sync-dot.error  { background:var(--red); }
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
  .pill-btn { display:flex;align-items:center;gap:5px;padding:5px 10px;
    border:1px solid var(--border);border-radius:var(--r-sm);
    background:none;color:var(--t2);font-family:var(--font-sans);font-size:12px;cursor:pointer;
    transition:all 0.15s; }
  .pill-btn:hover { border-color:var(--border2);background:var(--s2);color:var(--text); }
  .cal-dot { width:6px;height:6px;border-radius:50%;background:var(--t3); }
  .cal-dot.connected { background:var(--green);box-shadow:0 0 5px rgba(82,196,138,0.5); }
  .icon-btn { background:none;border:1px solid var(--border);border-radius:var(--r-sm);
    color:var(--t2);cursor:pointer;font-size:15px;padding:5px 8px;transition:all 0.15s;
    display:flex;align-items:center; }
  .icon-btn:hover { border-color:var(--accent);color:var(--accent); }
  .user-pill { display:flex;align-items:center;gap:7px;padding:4px 10px;
    border:1px solid var(--border);border-radius:var(--r-sm);
    background:none;cursor:pointer;transition:all 0.15s; }
  .user-pill:hover { border-color:var(--border2);background:var(--s2); }
  .avatar { width:26px;height:26px;border-radius:50%;object-fit:cover; }
  .avatar-letter { width:26px;height:26px;border-radius:50%;background:var(--accent-dim);
    color:var(--accent);font-family:var(--font-serif);font-size:11px;font-weight:700;
    display:flex;align-items:center;justify-content:center; }
  .uname { font-size:12px;color:var(--t2);max-width:90px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap; }

  }
</style>
