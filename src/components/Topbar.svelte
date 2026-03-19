<script>
  // src/components/Topbar.svelte

  import { user, syncStatus, theme } from '../stores/state.js'
  import { logout }                  from '../stores/auth.js'
  import { dlgConfirm }              from '../stores/dialog.js'
  import { safeUrl }                 from '../lib/security.js'

  let searchOpen = false

  function toggleTheme() {
    theme.update(t => t === 'dark' ? 'light' : 'dark')
  }

  async function handleLogout() {
    const ok = await dlgConfirm('Tem certeza que deseja sair da conta?', {
      icon: '👋', title: 'Sair da conta', confirmLabel: 'Sair',
    })
    if (ok) logout()
  }

  $: avatarSrc = $user?.photoURL ? safeUrl($user.photoURL) : null
  $: displayName = $user?.displayName || $user?.email?.split('@')[0] || '?'
  $: initial = displayName[0]?.toUpperCase() || '?'

  $: syncLabel = { ok: 'sincronizado', saving: 'salvando...', err: 'erro', off: 'offline' }[$syncStatus] || ''
  $: syncClass = $syncStatus
</script>

<header class="topbar">
  <div class="logo">StudyOS</div>

  <div class="center">
    <button class="search-bar" on:click={() => searchOpen = true}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
        <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
      </svg>
      <span>Buscar em tudo...</span>
      <kbd>⌘K</kbd>
    </button>
  </div>

  <div class="right">
    <div class="sync-pill">
      <div class="sync-dot {syncClass}"></div>
      <span>{syncLabel}</span>
    </div>

    <button class="icon-btn" on:click={toggleTheme} title="Alternar tema">
      {$theme === 'dark' ? '🌙' : '☀️'}
    </button>

    <button class="user-pill" on:click={handleLogout} title="Clique para sair">
      <div class="avatar">
        {#if avatarSrc}
          <img src={avatarSrc} alt="avatar" referrerpolicy="no-referrer" />
        {:else}
          {initial}
        {/if}
      </div>
      <span class="uname">{displayName}</span>
    </button>
  </div>
</header>

<style>
  .topbar {
    position: fixed; top: 0; left: 0; right: 0; height: var(--topbar);
    background: rgba(8,8,13,0.92); backdrop-filter: blur(12px);
    border-bottom: 1px solid var(--border);
    display: flex; align-items: center; justify-content: space-between;
    padding: 0 16px 0 0; z-index: 200;
  }
  :global(body.light-mode) .topbar { background: rgba(245,244,240,0.95); }

  .logo { font-family: var(--font-serif); font-size: 17px; font-weight: 600; color: var(--accent); font-style: italic; width: var(--sidebar); padding-left: 16px; flex-shrink: 0; }

  .center { flex: 1; display: flex; padding: 0 20px; }
  .search-bar { flex: 1; max-width: 480px; display: flex; align-items: center; gap: 8px; background: var(--s2); border: 1px solid var(--border); border-radius: var(--r); padding: 7px 12px; cursor: pointer; transition: border-color 0.15s; color: var(--t3); font-family: var(--font-sans); font-size: 13px; }
  .search-bar:hover { border-color: var(--border2); }
  .search-bar svg { stroke: var(--t3); flex-shrink: 0; }
  .search-bar span { flex: 1; text-align: left; }
  .search-bar kbd { font-size: 10px; background: var(--s3); padding: 2px 5px; border-radius: 4px; font-family: var(--font-mono); }

  .right { display: flex; align-items: center; gap: 8px; }

  .sync-pill { display: flex; align-items: center; gap: 5px; font-size: 11px; color: var(--t3); padding: 4px 10px; border-radius: var(--r-sm); border: 1px solid var(--border); }
  .sync-dot  { width: 6px; height: 6px; border-radius: 50%; background: var(--t3); flex-shrink: 0; }
  .sync-dot.ok      { background: var(--green); box-shadow: 0 0 5px rgba(82,196,138,0.4); }
  .sync-dot.saving  { background: var(--accent); animation: pulse 1s infinite; }
  .sync-dot.err     { background: var(--red); }
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }

  .icon-btn { background: none; border: 1px solid var(--border); border-radius: var(--r-sm); color: var(--t2); cursor: pointer; font-size: 16px; line-height: 1; padding: 5px 8px; transition: all 0.15s; display: flex; align-items: center; }
  .icon-btn:hover { border-color: var(--border2); background: var(--s2); }

  .user-pill { display: flex; align-items: center; gap: 8px; padding: 4px 10px; border-radius: var(--r-sm); cursor: pointer; border: 1px solid var(--border); background: none; color: inherit; font-family: var(--font-sans); transition: all 0.15s; }
  .user-pill:hover { border-color: var(--border2); background: var(--s2); }
  .avatar { width: 26px; height: 26px; border-radius: 50%; background: var(--accent-dim); color: var(--accent); font-family: var(--font-serif); font-size: 11px; font-weight: 700; display: flex; align-items: center; justify-content: center; overflow: hidden; flex-shrink: 0; }
  .avatar img { width: 100%; height: 100%; object-fit: cover; }
  .uname { font-size: 12px; color: var(--t2); max-width: 100px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
</style>
