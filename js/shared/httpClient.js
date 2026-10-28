// Único ponto de acesso à API do rara-backend (a mesma do raraapp).
// Injeta o token, renova com o refreshToken quando expira e devolve o `data`
// do envelope { success, data, message }.
import { getSession, updateSession, clearSession } from './session.js'

export const API_URL = 'https://rara.cestsegtrabalho.com.br/api'

// Mensagens do backend que ainda vêm em inglês
const TRADUCOES = {
    'Token not provided': 'Sua sessão expirou. Entre de novo.',
    'Invalid token': 'Sua sessão expirou. Entre de novo.',
    'Invalid refresh token': 'Sua sessão expirou. Entre de novo.',
    Forbidden: 'Você não tem permissão para isso.',
    'User not found': 'Usuário não encontrado.',
    'Lesson not found': 'Aula não encontrada.',
    'Answers are required': 'Responda as perguntas antes de enviar.',
    'Invalid question index': 'Pergunta inválida.',
    'Invalid current password': 'Senha atual incorreta.',
}

export class HttpError extends Error {
    constructor(message, status) {
        super(message)
        this.status = status
    }
}

// Quem precisa voltar para a tela de login quando a sessão cai
let aoExpirar = () => {}
export function onSessionExpired(callback) {
    aoExpirar = callback
}

async function enviar(method, path, body, token) {
    const headers = {}
    if (body !== undefined) headers['Content-Type'] = 'application/json'
    if (token) headers.Authorization = `Bearer ${token}`

    let response
    try {
        response = await fetch(`${API_URL}${path}`, {
            method,
            headers,
            body: body === undefined ? undefined : JSON.stringify(body),
        })
    } catch {
        throw new HttpError('Sem conexão com o servidor. Verifique sua internet.', 0)
    }

    const json = await response.json().catch(() => ({}))
    return { response, json }
}

async function renovarToken() {
    const refreshToken = getSession()?.refreshToken
    if (!refreshToken) return null
    const { response, json } = await enviar('POST', '/users/refresh', { refreshToken })
    if (!response.ok || !json.success) return null
    updateSession({ accessToken: json.data.accessToken })
    return json.data.accessToken
}

export async function http(method, path, body) {
    let { response, json } = await enviar(method, path, body, getSession()?.accessToken)

    // 401 fora do login: tenta renovar; se não der (ou nem há refreshToken), desloga
    if (response.status === 401 && !path.startsWith('/users/login') && getSession()) {
        const novoToken = await renovarToken()
        if (novoToken) {
            ;({ response, json } = await enviar(method, path, body, novoToken))
        }
        if (response.status === 401) {
            clearSession()
            aoExpirar()
        }
    }

    if (!response.ok || json.success === false) {
        const mensagem = json.message || 'Algo deu errado. Tente de novo.'
        throw new HttpError(TRADUCOES[mensagem] ?? mensagem, response.status)
    }

    return json.data
}

export const httpClient = {
    get: (path) => http('GET', path),
    post: (path, body = {}) => http('POST', path, body),
    put: (path, body = {}) => http('PUT', path, body),
    patch: (path, body = {}) => http('PATCH', path, body),
    delete: (path) => http('DELETE', path),
}
