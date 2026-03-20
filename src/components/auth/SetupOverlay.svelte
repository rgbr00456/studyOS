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
