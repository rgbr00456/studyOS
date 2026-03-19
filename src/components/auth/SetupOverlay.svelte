<script>
  // Shown when Firebase is not configured (.env missing)
</script>

<div class="overlay">
  <div class="box">
    <div class="title">⚙ Configure o Firebase</div>
    <div class="sub">Copie <code>.env.example</code> para <code>.env</code> e preencha com as credenciais do seu projeto Firebase.</div>
    <ol class="steps">
      <li>Acesse <a href="https://console.firebase.google.com" target="_blank">console.firebase.google.com</a></li>
      <li>Crie um projeto → Registre um app Web → copie o <code>firebaseConfig</code></li>
      <li>Cole os valores no arquivo <code>.env</code> na raiz do projeto</li>
      <li>Ative <strong>Authentication</strong> (E-mail/senha + Google) e <strong>Firestore</strong> no console</li>
      <li>Rode <code>npm run dev</code> novamente</li>
    </ol>
    <div class="note">O plano gratuito Spark suporta 50.000 leituras/dia — suficiente para uso pessoal.</div>
  </div>
</div>

<style>
  .overlay { position:fixed;inset:0;background:var(--bg);z-index:9999;display:flex;align-items:center;justify-content:center;padding:24px; }
  .box { background:var(--s1);border:1px solid var(--border2);border-radius:var(--r-xl);padding:36px;max-width:560px;width:100%; }
  .title { font-family:var(--font-serif);font-size:24px;font-weight:600;color:var(--accent);margin-bottom:8px;font-style:italic; }
  .sub { font-size:13px;color:var(--t2);line-height:1.6;margin-bottom:20px; }
  .steps { padding-left:20px;display:flex;flex-direction:column;gap:10px;font-size:13.5px;color:var(--text);line-height:1.6; }
  .steps a { color:var(--accent); }
  code { background:var(--s3);padding:1px 5px;border-radius:4px;font-family:var(--font-mono);font-size:12px;color:var(--accent2); }
  .note { margin-top:20px;background:var(--s3);border:1px solid var(--border);border-radius:var(--r);padding:12px 14px;font-size:12.5px;color:var(--t2);line-height:1.6; }
</style>
