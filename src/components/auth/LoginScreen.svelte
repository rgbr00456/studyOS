<script>
  import { auth, gProvider, isConfigured } from '../../firebase.js'
  import { signInWithEmailAndPassword, createUserWithEmailAndPassword,
           updateProfile, signInWithPopup, signInWithRedirect,
           GoogleAuthProvider } from 'firebase/auth'
  import { checkAuthRateLimit } from '../../lib/security.js'

  let mode = 'login'  // 'login' | 'register'
  let name = '', email = '', password = '', errorMsg = '', loading = false

  // Read URL param to pre-select form
  if (typeof window !== 'undefined') {
    const p = new URLSearchParams(window.location.search).get('action')
    if (p === 'register') mode = 'register'
  }

  function showError(msg) { errorMsg = msg; setTimeout(() => errorMsg = '', 8000) }

  const errMap = {
    'auth/user-not-found':       'Usuário não encontrado.',
    'auth/wrong-password':       'Senha incorreta.',
    'auth/invalid-credential':   'E-mail ou senha incorretos.',
    'auth/email-already-in-use': 'E-mail já cadastrado.',
    'auth/weak-password':        'Senha muito fraca (mínimo 6 caracteres).',
    'auth/invalid-email':        'E-mail inválido.',
    'auth/too-many-requests':    'Muitas tentativas. Aguarde.',
    'auth/popup-closed-by-user': '',
    'auth/cancelled-popup-request': '',
  }
  const xlate = code => errMap[code] || 'Erro ao autenticar. Tente novamente.'

  async function doLogin() {
    try { checkAuthRateLimit() } catch(e) { showError(e.message); return }
    if (!email || !password) { showError('Preencha e-mail e senha.'); return }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { showError('E-mail inválido.'); return }
    loading = true
    try { await signInWithEmailAndPassword(auth, email, password) }
    catch(e) { showError(xlate(e.code)) }
    finally { loading = false }
  }

  async function doRegister() {
    try { checkAuthRateLimit() } catch(e) { showError(e.message); return }
    if (!name.trim()) { showError('Informe seu nome.'); return }
    if (name.length > 80) { showError('Nome muito longo.'); return }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { showError('E-mail inválido.'); return }
    if (password.length < 6) { showError('Senha deve ter pelo menos 6 caracteres.'); return }
    loading = true
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password)
      await updateProfile(cred.user, { displayName: name.trim() })
    } catch(e) { showError(xlate(e.code)) }
    finally { loading = false }
  }

  async function doGoogle() {
    try { checkAuthRateLimit() } catch(e) { showError(e.message); return }
    try { await signInWithPopup(auth, gProvider) }
    catch(e) {
      if (e.code === 'auth/popup-blocked') {
        showError('Popup bloqueado. Redirecionando...')
        setTimeout(() => signInWithRedirect(auth, gProvider), 1200)
      } else if (e.code !== 'auth/popup-closed-by-user') {
        showError(xlate(e.code))
      }
    }
  }
</script>

<div class="screen">
  <div class="box">
    <div class="logo">StudyOS</div>
    <div class="tagline">Seu workspace de estudos, em qualquer dispositivo</div>

    {#if errorMsg}<div class="error">{errorMsg}</div>{/if}

    {#if mode === 'login'}
      <label class="lbl">E-mail</label>
      <input class="inp" type="email" bind:value={email} placeholder="seu@email.com"
        on:keydown={e => e.key === 'Enter' && doLogin()} />
      <label class="lbl">Senha</label>
      <input class="inp" type="password" bind:value={password} placeholder="••••••••"
        on:keydown={e => e.key === 'Enter' && doLogin()} />
      <button class="btn-login" on:click={doLogin} disabled={loading}>
        {loading ? 'Entrando...' : 'Entrar'}
      </button>
    {:else}
      <label class="lbl">Nome</label>
      <input class="inp" type="text" bind:value={name} placeholder="Seu nome" />
      <label class="lbl">E-mail</label>
      <input class="inp" type="email" bind:value={email} placeholder="seu@email.com" />
      <label class="lbl">Senha</label>
      <input class="inp" type="password" bind:value={password} placeholder="Mínimo 6 caracteres"
        on:keydown={e => e.key === 'Enter' && doRegister()} />
      <button class="btn-login" on:click={doRegister} disabled={loading}>
        {loading ? 'Criando...' : 'Criar conta'}
      </button>
    {/if}

    <div class="divider"><span>ou</span></div>

    <button class="btn-google" on:click={doGoogle}>
      <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.2l6.7-6.7C35.8 2.5 30.3 0 24 0 14.6 0 6.6 5.4 2.6 13.3l7.8 6.1C12.4 13.4 17.7 9.5 24 9.5z"/><path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4.1 6.9-10.1 6.9-17z"/><path fill="#FBBC05" d="M10.4 28.6c-.6-1.6-.9-3.3-.9-5.1s.3-3.5.8-5l-7.7-6C.9 16.6 0 20.2 0 24s.9 7.4 2.6 10.6l7.8-6z"/><path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.5-5.8c-2.1 1.4-4.8 2.2-8.4 2.2-6.3 0-11.6-3.9-13.6-9.4l-7.8 6C6.6 42.6 14.6 48 24 48z"/></svg>
      {mode === 'login' ? 'Entrar com Google' : 'Continuar com Google'}
    </button>

    <div class="switch">
      {#if mode === 'login'}
        Não tem conta? <button on:click={() => { mode='register'; errorMsg='' }}>Criar conta</button>
      {:else}
        Já tem conta? <button on:click={() => { mode='login'; errorMsg='' }}>Entrar</button>
      {/if}
    </div>
  </div>
</div>
