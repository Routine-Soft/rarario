// Sessão do login (tokens + usuário) guardada no navegador.
const CHAVE = 'rarario-sessao'

export function getSession() {
    try {
        return JSON.parse(localStorage.getItem(CHAVE)) || null
    } catch {
        return null
    }
}

export function saveSession(session) {
    try {
        localStorage.setItem(CHAVE, JSON.stringify(session))
    } catch {
        // sem armazenamento (aba anônima): a sessão dura só nesta página
    }
}

export function updateSession(fields) {
    saveSession({ ...getSession(), ...fields })
}

export function clearSession() {
    try {
        localStorage.removeItem(CHAVE)
    } catch {
        // nada a fazer
    }
}
