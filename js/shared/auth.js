// Caminho entre as telas de acesso (entrar, login, criar conta) e os painéis.
// O painel manda para "entrar.html?voltar=<painel>"; depois do login a pessoa
// volta para ele (ou completa o cadastro antes, se a conta não tem igreja).
import { getSession, saveSession, clearSession } from './session.js'
import { userApi } from '../user/user.api.js'

// Só volta para páginas do próprio site (nada de redirecionar para fora)
const DESTINOS = ['painel-aluno.html', 'painel-professor.html']

const params = new URLSearchParams(location.search)

export const destino = () => (DESTINOS.includes(params.get('voltar')) ? params.get('voltar') : 'painel-aluno.html')

// Link para outra tela de acesso levando o destino junto
export const linkAcesso = (pagina, extra = '') => `./${pagina}?voltar=${destino()}${extra}`

// Conta criada pelo Google começa só com nome e e-mail (igual ao app)
export const precisaCompletar = (user) => !user?.churchId

// Painel sem sessão: vai para a tela de entrar e volta depois
export function irParaEntrar(painel, expirou = false) {
    location.replace(`./entrar.html?voltar=${painel}${expirou ? '&expirou=1' : ''}`)
}

export function seguir(user) {
    location.replace(precisaCompletar(user) ? linkAcesso('criar-conta.html', '&completar=1') : `./${destino()}`)
}

// Guarda a sessão do login (senha ou Google) e segue
export function entrou({ accessToken, refreshToken, user }) {
    saveSession({ accessToken, refreshToken, user })
    seguir(user)
}

// Já entrou antes: não mostra a tela de acesso de novo
export function jaEntrou() {
    const session = getSession()
    if (!session?.accessToken) return false
    seguir(session.user)
    return true
}

export async function sair() {
    await userApi.logout().catch(() => {})
    clearSession()
}
