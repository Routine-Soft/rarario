// Estrutura comum dos painéis: topo (logo, nome, tema, sair), tela de login
// e troca da senha provisória. Cada painel só desenha o próprio conteúdo.
import { getSession, saveSession, updateSession, clearSession } from './session.js'
import { onSessionExpired } from './httpClient.js'
import { userApi } from '../user/user.api.js'
import { escapeHtml, toast, skeletons, bindPasswordEyes, passwordField } from './ui.js'

const TEMAS = [
    ['escuro', 'Escuro'],
    ['claro', 'Claro'],
    ['rosa', 'Rosa'],
    ['sistema', 'Sistema'],
]

/**
 * @param {object} opts
 * @param {string} opts.title       ex.: "Painel do Aluno"
 * @param {(user) => boolean} [opts.canAccess]
 * @param {string} [opts.deniedMessage]
 * @param {(main: HTMLElement, user) => void} opts.render
 */
export function mountPanel({ title, canAccess = () => true, deniedMessage = '', render }) {
    const app = document.getElementById('app')

    onSessionExpired(() => {
        toast('Sua sessão expirou. Entre de novo.', 'error')
        show()
    })

    // Na primeira abertura, busca o usuário de novo (cargos podem ter mudado)
    let atualizado = false

    async function show() {
        const session = getSession()
        if (!session?.accessToken) return renderLogin()
        if (!atualizado && session.user?._id) {
            atualizado = true
            app.innerHTML = skeletons(3)
            try {
                updateSession({ user: await userApi.getById(session.user._id) })
            } catch {
                // sem conexão: segue com o usuário guardado (sessão caída já voltou ao login)
            }
            return show()
        }
        if (session.user?.mustChangePassword) return renderChangePassword(session.user)
        renderShell(session.user)
    }

    function topbar(user) {
        const escolha = window.temaPainel.escolha()
        return `
            <header class="topbar">
                <a class="logo-badge" href="/" aria-label="Voltar para a página inicial">
                    <img src="../img/logo-rarario-transparente.webp" alt="">
                </a>
                <div class="topbar-title">
                    <strong>${escapeHtml(title)}</strong>
                    <span>${user ? escapeHtml(user.name || user.email) : 'Comunhão RARA RIO'}</span>
                </div>
                <div class="topbar-actions">
                    <label class="sr-only" for="tema">Tema</label>
                    <select id="tema" class="theme-select">
                        ${TEMAS.map(([v, l]) => `<option value="${v}" ${v === escolha ? 'selected' : ''}>${l}</option>`).join('')}
                    </select>
                    ${user ? '<button type="button" class="btn btn-outline btn-sm" id="sair">Sair</button>' : ''}
                </div>
            </header>`
    }

    function bindTopbar() {
        app.querySelector('#tema').addEventListener('change', (e) => window.temaPainel.trocar(e.target.value))
        app.querySelector('#sair')?.addEventListener('click', async () => {
            await userApi.logout().catch(() => {})
            clearSession()
            show()
        })
    }

    function renderShell(user) {
        if (!canAccess(user)) {
            app.innerHTML = `
                ${topbar(user)}
                <div class="card empty">
                    <div class="empty-icon" aria-hidden="true">🔒</div>
                    <p>${escapeHtml(deniedMessage)}</p>
                    <a class="btn btn-primary" href="./painel-aluno.html">Ir para o Painel do Aluno</a>
                </div>`
            return bindTopbar()
        }
        app.innerHTML = `${topbar(user)}<main class="stack" id="conteudo"></main>`
        bindTopbar()
        render(app.querySelector('#conteudo'), user)
    }

    function renderLogin() {
        app.innerHTML = `
            ${topbar(null)}
            <form class="card" id="login" novalidate>
                <span class="badge-step">ENTRAR</span>
                <h1 style="font-size:1.4rem;font-weight:800">${escapeHtml(title)}</h1>
                <p>Use o mesmo e-mail e senha do aplicativo da RARA.</p>
                <div class="field">
                    <label for="email">E-mail</label>
                    <input class="input" id="email" type="email" autocomplete="email" inputmode="email" required>
                </div>
                ${passwordField('senha', 'Senha', 'current-password')}
                <div class="alert alert-error" id="erro" hidden></div>
                <button class="btn btn-primary btn-block" type="submit">Entrar</button>
            </form>
            <div class="back-link-wrapper"><a href="/" class="back-link">← Voltar para os Passos</a></div>`
        bindTopbar()
        bindPasswordEyes(app)

        const form = app.querySelector('#login')
        form.addEventListener('submit', async (event) => {
            event.preventDefault()
            const email = form.querySelector('#email').value
            const password = form.querySelector('#senha').value
            const erro = form.querySelector('#erro')
            const botao = form.querySelector('button[type="submit"]')

            if (!email.trim() || !password) {
                erro.textContent = 'Preencha o e-mail e a senha.'
                erro.hidden = false
                return
            }

            erro.hidden = true
            botao.disabled = true
            botao.textContent = 'Entrando...'
            try {
                const { accessToken, refreshToken, user } = await userApi.login(email, password)
                saveSession({ accessToken, refreshToken, user })
                atualizado = true
                show()
            } catch (error) {
                erro.textContent = error.message
                erro.hidden = false
                botao.disabled = false
                botao.textContent = 'Entrar'
            }
        })
    }

    // Conta criada pelo facilitador entra com a senha provisória: troca antes
    function renderChangePassword(user) {
        app.innerHTML = `
            ${topbar(user)}
            <form class="card" id="trocar-senha" novalidate>
                <span class="badge-step">NOVA SENHA</span>
                <h1 style="font-size:1.3rem;font-weight:800">Crie a sua senha</h1>
                <p>Você entrou com a senha provisória. Escolha uma senha nova com pelo menos 6 caracteres.</p>
                ${passwordField('nova', 'Nova senha', 'new-password')}
                ${passwordField('repetir', 'Repita a nova senha', 'new-password')}
                <div class="alert alert-error" id="erro" hidden></div>
                <button class="btn btn-primary btn-block" type="submit">Salvar senha</button>
            </form>`
        bindTopbar()
        bindPasswordEyes(app)

        const form = app.querySelector('#trocar-senha')
        form.addEventListener('submit', async (event) => {
            event.preventDefault()
            const nova = form.querySelector('#nova').value
            const repetir = form.querySelector('#repetir').value
            const erro = form.querySelector('#erro')
            const botao = form.querySelector('button[type="submit"]')

            const problema = nova.length < 6
                ? 'A nova senha precisa ter pelo menos 6 caracteres.'
                : nova !== repetir ? 'As duas senhas não são iguais.' : ''
            if (problema) {
                erro.textContent = problema
                erro.hidden = false
                return
            }

            erro.hidden = true
            botao.disabled = true
            botao.textContent = 'Salvando...'
            try {
                await userApi.updatePassword(user._id, nova)
                updateSession({ user: { ...user, mustChangePassword: false } })
                toast('Senha alterada com sucesso!')
                show()
            } catch (error) {
                erro.textContent = error.message
                erro.hidden = false
                botao.disabled = false
                botao.textContent = 'Salvar senha'
            }
        })
    }

    show()
}
