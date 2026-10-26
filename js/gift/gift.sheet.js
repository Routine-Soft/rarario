// Teste dos Dons: uma pergunta por vez (tocar na resposta já passa para a
// próxima) e, no fim, o resultado com a pontuação de cada dom
// (espelha gift_test_quiz_page.dart e gift_test_result_page.dart).
import { giftTestApi, resultOf, ranked, maxScore } from './gift.api.js'
import { escapeHtml, toast, formatDate, openSheet, fillProgress } from '../shared/ui.js'

const EMOJIS = ['😞', '😐', '😊', '😄', '😜', '😎']

/**
 * @param {object} opts
 * @param {object} opts.test      { key, title, gifts, questions }
 * @param {string[]} opts.answers rótulos das respostas (0 a 5)
 * @param {object} opts.user      usuário logado (com giftTests)
 * @param {(user) => void} opts.onSaved recebe o usuário atualizado
 */
export function openGiftTest({ test, answers, user, onSaved }) {
    const dialog = openSheet(`
        <div class="sheet-head">
            <div>
                <h2>${escapeHtml(test.title)}</h2>
                <p>${test.questions.length} perguntas</p>
            </div>
            <button type="button" class="icon-btn" data-close aria-label="Fechar">✕</button>
        </div>
        <div class="sheet-body" aria-live="polite"></div>
        <div class="sheet-foot"></div>`)

    const body = dialog.querySelector('.sheet-body')
    const foot = dialog.querySelector('.sheet-foot')
    const chosen = [] // respostas dadas até aqui (0 a 5)
    let sending = false
    let confirmExit = false

    let quizzing = !resultOf(user, test.key) // false = mostrando o resultado

    // Sair no meio do teste perde as respostas: confirma no próprio lugar
    const tryClose = () => {
        if (!quizzing || !chosen.length) return dialog.close()
        confirmExit = true
        drawFoot()
    }

    dialog.querySelector('[data-close]').addEventListener('click', tryClose)
    dialog.addEventListener('cancel', (event) => {
        if (quizzing && chosen.length) {
            event.preventDefault()
            tryClose()
        }
    })

    function drawQuiz() {
        const total = test.questions.length
        const index = Math.min(chosen.length, total - 1)
        const position = Math.min(chosen.length + 1, total)
        const pct = Math.round((position / total) * 100)
        body.innerHTML = `
            <div class="progress" role="img" aria-label="Pergunta ${position} de ${total}">
                <div class="progress-head"><strong>Pergunta ${position} de ${total}</strong><span>${pct}%</span></div>
                <div class="progress-track"><div class="progress-fill" data-pct="${pct}" style="width:${Math.round(((position - 1) / total) * 100)}%"></div></div>
            </div>
            <p class="quiz-question" tabindex="-1">${escapeHtml(test.questions[index])}</p>
            ${sending
                ? '<div class="quiz-sending"><span class="spinner" aria-hidden="true"></span> Enviando...</div>'
                : `<div class="quiz-answers">
                    ${answers.map((label, value) => `
                        <button type="button" class="quiz-answer" data-value="${value}">
                            <span>${escapeHtml(label)}</span>
                            <span class="quiz-emoji" aria-hidden="true">${EMOJIS[value] ?? ''}</span>
                        </button>`).join('')}
                </div>`}`
        fillProgress(body)
        body.querySelectorAll('[data-value]').forEach((button) => {
            button.addEventListener('click', () => answer(Number(button.dataset.value)))
        })
    }

    async function answer(value) {
        chosen.push(value)
        confirmExit = false
        if (chosen.length < test.questions.length) {
            drawQuiz()
            drawFoot()
            body.querySelector('.quiz-question').focus()
            return
        }
        sending = true
        drawQuiz()
        drawFoot()
        try {
            user = await giftTestApi.submit(test.key, chosen)
            onSaved(user)
            quizzing = false
            toast('Teste enviado!')
            drawResult()
        } catch (error) {
            // Volta para a última pergunta para tentar enviar de novo
            chosen.pop()
            toast(error.message, 'error')
            drawQuiz()
        } finally {
            sending = false
            drawFoot()
        }
    }

    function drawResult() {
        const result = resultOf(user, test.key)
        const list = ranked(result)
        const top = list[0]?.score ?? 0
        const max = maxScore(test)
        body.innerHTML = `
            <div class="box">
                <strong class="quiz-result-title">Resultado do teste</strong>
                <p class="muted">Feito em ${formatDate(result.completedAt)} • quanto maior a pontuação, mais forte o dom</p>
            </div>
            <div class="box gift-scores">
                ${list.map((s) => {
                    const best = s.score === top && top > 0
                    return `
                        <div class="progress gift-score ${best ? 'best' : ''}" role="img" aria-label="${escapeHtml(s.gift)}: ${s.score} de ${max}">
                            <div class="progress-head">
                                <strong>${best ? '⭐ ' : ''}${escapeHtml(s.gift)}</strong>
                                <span>${s.score} / ${max}</span>
                            </div>
                            <div class="progress-track"><div class="progress-fill" data-pct="${max ? Math.round((s.score / max) * 100) : 0}"></div></div>
                        </div>`
                }).join('')}
            </div>`
        fillProgress(body)
        dialog.scrollTop = 0
        body.scrollTop = 0
    }

    function shareText() {
        return [
            `*${test.title.toUpperCase()}*`,
            '',
            `*Nome:* ${user.name ?? ''}`,
            '',
            ...ranked(resultOf(user, test.key)).map((s) => `*${s.gift}*: ${s.score}`),
        ].join('\n')
    }

    function drawFoot() {
        if (quizzing) {
            if (confirmExit) {
                foot.innerHTML = `
                    <div class="inline-confirm">
                        <span>Sair do teste? Suas respostas até aqui serão perdidas.</span>
                        <button type="button" class="icon-btn" id="confirmar-sair" aria-label="Sair do teste">✓</button>
                        <button type="button" class="icon-btn" id="continuar" aria-label="Continuar o teste">✗</button>
                    </div>`
                foot.querySelector('#confirmar-sair').addEventListener('click', () => dialog.close())
                foot.querySelector('#continuar').addEventListener('click', () => {
                    confirmExit = false
                    drawFoot()
                })
                return
            }
            foot.innerHTML = chosen.length && !sending
                ? '<button type="button" class="btn btn-outline" id="anterior">← Pergunta anterior</button>'
                : ''
            foot.querySelector('#anterior')?.addEventListener('click', () => {
                chosen.pop()
                drawQuiz()
                drawFoot()
            })
            return
        }
        foot.innerHTML = `
            <a class="btn btn-primary" target="_blank" rel="noopener"
                href="https://wa.me/?text=${encodeURIComponent(shareText())}">Compartilhar no WhatsApp</a>
            <button type="button" class="btn btn-outline" id="refazer">↻ Refazer teste</button>`
        foot.querySelector('#refazer').addEventListener('click', () => {
            chosen.length = 0
            quizzing = true
            drawQuiz()
            drawFoot()
        })
    }

    if (quizzing) drawQuiz()
    else drawResult()
    drawFoot()
}
