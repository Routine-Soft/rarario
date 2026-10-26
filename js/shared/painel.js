// Estrutura comum dos painéis: topo (logo, nome, tema, sair) e troca da senha
// provisória. Sem login, manda para entrar.html (que volta para cá depois).
// Cada painel só desenha o próprio conteúdo.
import { getSession, updateSession } from './session.js'
import { onSessionExpired } from './httpClient.js'
import { userApi } from '../user/user.api.js'
import { irParaEntrar, precisaCompletar, sair } from './auth.js'
import { topbar as topo, bindTopbar as bindTopo } from './topo.js'
import { escapeHtml, toast, skeletons, bindPasswordEyes, passwordField } from './ui.js'

/**
 * @param {object} opts
 * @param {string} opts.title       ex.: "Painel do Aluno"
 * @param {(user) => boolean} [opts.canAccess]
 * @param {string} [opts.deniedMessage]
 * @param {(main: HTMLElement, user) => void} opts.render
 */
export function mountPanel({ title, canAccess = () => true, deniedMessage = '', render }) {
    const app = document.getElementById('app')
    const painel = location.pathname.split('/').pop() || 'painel-aluno.html'

    onSessionExpired(() => irParaEntrar(painel, true))

    // Na primeira abertura, busca o usuário de novo (cargos podem ter mudado)
    let atualizado = false

    async function show() {
        const session = getSession()
        if (!session?.accessToken) return irParaEntrar(painel)
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
        if (precisaCompletar(session.user)) {
            return location.replace(`./criar-conta.html?completar=1&voltar=${painel}`)
        }
        renderShell(session.user)
    }

    const topbar = (user) => topo(title, user)
    const bindTopbar = () => bindTopo(app, async () => {
        await sair()
        irParaEntrar(painel)
    })

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
