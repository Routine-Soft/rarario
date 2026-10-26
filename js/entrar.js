// Boas-vindas: entrar, continuar com Google ou criar conta
// (espelha lib/components/app/welcome_page.dart do raraapp).
import { topbar, bindTopbar } from './shared/topo.js'
import { jaEntrou, linkAcesso } from './shared/auth.js'
import { googleButton } from './shared/google.js'

const app = document.getElementById('app')

if (!jaEntrou()) {
    const expirou = new URLSearchParams(location.search).has('expirou')
    app.innerHTML = `
        ${topbar('Avançai Online')}
        <main class="card auth-card">
            <img class="auth-logo floating reveal" style="--i:1" src="../img/logo-rarario-transparente.webp" alt="Comunhão RARA RIO">
            <p class="auth-hello reveal" style="--i:2">Seja bem-vindo ao</p>
            <h1 class="gradient-text reveal" style="--i:3">Avançai Online</h1>
            <p class="auth-sub reveal" style="--i:4">Estude as aulas do Avançai pelo site da Comunhão RARA RIO, com a mesma conta do aplicativo.</p>
            ${expirou ? '<div class="alert alert-warning reveal" style="--i:4">Sua sessão expirou. Entre de novo.</div>' : ''}
            <a class="btn btn-primary btn-block btn-lg reveal" style="--i:5" href="${linkAcesso('login.html')}">➜ Entrar</a>
            <div class="google-area reveal" style="--i:6" id="google-area">
                <div class="or-divider"><span>ou</span></div>
                <div class="google-box" id="google"></div>
            </div>
            <a class="btn btn-outline btn-block btn-lg reveal" style="--i:7" href="${linkAcesso('criar-conta.html')}">👤 Criar conta</a>
        </main>
        <div class="back-link-wrapper"><a href="./avancai.html" class="back-link">← Voltar para o Avançai</a></div>`
    bindTopbar(app)
    googleButton(app.querySelector('#google'), app.querySelector('#google-area'))
}
