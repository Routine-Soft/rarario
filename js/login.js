// Login com e-mail e senha da conta do app (espelha login_page.dart).
import { topbar, bindTopbar } from './shared/topo.js'
import { jaEntrou, entrou, linkAcesso } from './shared/auth.js'
import { googleButton } from './shared/google.js'
import { userApi } from './user/user.api.js'
import { bindPasswordEyes, passwordField } from './shared/ui.js'

const app = document.getElementById('app')

if (!jaEntrou()) {
    app.innerHTML = `
        ${topbar('Entrar')}
        <form class="card auth-card" id="login" novalidate>
            <img class="auth-logo floating reveal" style="--i:1" src="../img/logo-rarario-transparente.webp" alt="">
            <h1 class="gradient-text reveal" style="--i:2">Entrar</h1>
            <p class="auth-sub reveal" style="--i:3">Use o mesmo e-mail e senha do aplicativo da RARA.</p>
            <div class="field reveal" style="--i:4">
                <label for="email">E-mail</label>
                <input class="input" id="email" type="email" autocomplete="email" inputmode="email" required>
            </div>
            <div class="reveal" style="--i:5">${passwordField('senha', 'Senha', 'current-password')}</div>
            <button type="button" class="btn-link reveal" style="--i:5" id="esqueci" aria-expanded="false">Esqueceu a senha?</button>
            <div class="alert alert-warning" id="dica-senha" hidden>
                Entre com a conta Google do mesmo e-mail que você usa no app. Depois, se quiser, troque a senha em "Minha conta" no aplicativo.
            </div>
            <div class="alert alert-error" id="erro" role="alert" hidden></div>
            <button class="btn btn-primary btn-block btn-lg reveal" style="--i:6" type="submit">➜ Entrar</button>
            <div class="google-area reveal" style="--i:7" id="google-area">
                <div class="or-divider"><span>ou</span></div>
                <div class="google-box" id="google"></div>
            </div>
            <p class="auth-foot reveal" style="--i:8">Ainda não tem conta? <a href="${linkAcesso('criar-conta.html')}">Criar conta</a></p>
        </form>
        <div class="back-link-wrapper"><a href="${linkAcesso('entrar.html')}" class="back-link">← Voltar</a></div>`
    bindTopbar(app)
    bindPasswordEyes(app)
    googleButton(app.querySelector('#google'), app.querySelector('#google-area'))

    const form = app.querySelector('#login')
    const erro = form.querySelector('#erro')
    const botao = form.querySelector('button[type="submit"]')

    form.querySelector('#esqueci').addEventListener('click', (event) => {
        const dica = form.querySelector('#dica-senha')
        dica.hidden = !dica.hidden
        event.currentTarget.setAttribute('aria-expanded', String(!dica.hidden))
    })

    form.addEventListener('submit', async (event) => {
        event.preventDefault()
        const email = form.querySelector('#email').value
        const password = form.querySelector('#senha').value

        if (!email.trim() || !password) {
            erro.textContent = 'Preencha o e-mail e a senha.'
            erro.hidden = false
            return
        }

        erro.hidden = true
        botao.disabled = true
        botao.textContent = 'Entrando...'
        try {
            entrou(await userApi.login(email, password))
        } catch (error) {
            erro.textContent = error.message
            erro.hidden = false
            botao.disabled = false
            botao.textContent = '➜ Entrar'
        }
    })
}
