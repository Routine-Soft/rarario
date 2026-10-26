// Rotas de /gift-tests do rara-backend (espelha lib/api/gift_test_api.dart).
import { httpClient } from '../shared/httpClient.js'

export const giftTestApi = {
    // { answers: ['Nunca', ...], tests: [{ key, title, gifts, questions }] }
    getCatalog: () => httpClient.get('/gift-tests'),
    // answers: um valor de 0 a 5 por pergunta; devolve o usuário atualizado
    submit: (key, answers) => httpClient.post(`/gift-tests/${key}/submit`, { answers }),
}

// Resultado salvo no usuário para o teste (ou undefined)
export const resultOf = (user, key) => (user?.giftTests ?? []).find((r) => r.test === key)

// Dons do maior para o menor
export const ranked = (result) => [...(result?.scores ?? [])].sort((a, b) => b.score - a.score)

// Os de maior pontuação (empatados no topo), ex.: "Ensino e Serviço"
export function bestGifts(result) {
    const list = ranked(result)
    const top = list[0]?.score ?? 0
    return list.filter((s) => s.score === top).map((s) => s.gift).join(' e ')
}

// Cada dom soma (perguntas ÷ dons) respostas de 0 a 5
export const maxScore = (test) => Math.floor(test.questions.length / test.gifts.length) * 5
