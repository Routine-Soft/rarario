// Painel do Aluno: aulas do Avançai agrupadas por módulo, com os acertos de
// cada uma; abre a aula para estudar e responder (espelha lesson_page.dart).
import { mountPanel } from './shared/painel.js'
import { lessonApi } from './lesson/lesson.api.js'
import {
    LESSON_MODULES, moduleLabel, groupByModule, refId, optionLetter,
    lessonSubtitle, lessonContentHtml, bindVideo,
} from './lesson/lesson.utils.js'
import {
    escapeHtml, toast, skeletons, emptyState, progressBar, fillProgress, openSheet,
} from './shared/ui.js'

mountPanel({ title: 'Painel do Aluno', render: renderAluno })

function renderAluno(main, user) {
    let lessons = []
    let mine = [] // progresso do aluno logado

    const firstName = escapeHtml(String(user.name ?? '').split(' ')[0])
    main.innerHTML = `
        <section class="card hero">
            <span class="badge-step">AVANÇAI</span>
            <h1>Olá${firstName ? `, ${firstName}` : ''}! 👋</h1>
            <p>Ao terminar todas as aulas, você se tornará membro no culto da família. 1º domingo de cada mês.</p>
            <div id="geral"></div>
        </section>
        <div class="stack" id="modulos">${skeletons(3)}</div>`

    const geral = main.querySelector('#geral')
    const modulos = main.querySelector('#modulos')

    const progressOf = (lessonId) => mine.find((p) => refId(p.lessonId) === lessonId)

    async function load() {
        try {
            ;[lessons, mine] = await Promise.all([lessonApi.getAll(), lessonApi.getMyProgress()])
            draw()
        } catch (error) {
            geral.innerHTML = ''
            modulos.innerHTML = emptyState({
                icon: '⚠️',
                message: error.message,
                action: '<button class="btn btn-primary" id="tentar">Tentar de novo</button>',
            })
            modulos.querySelector('#tentar').addEventListener('click', () => {
                modulos.innerHTML = skeletons(3)
                load()
            })
        }
    }

    function draw() {
        const groups = groupByModule(lessons)
        const done = lessons.filter((l) => progressOf(l._id)).length
        geral.innerHTML = lessons.length ? progressBar('Seu progresso', done, lessons.length) : ''

        const filled = LESSON_MODULES.filter((m) => groups[m]?.length)
        if (!filled.length) {
            modulos.innerHTML = emptyState({ icon: '📚', message: 'Nenhuma aula disponível ainda. Volte em breve!' })
            return
        }

        // Mantém aberto o módulo que o aluno já tinha aberto
        const abertos = new Set([...modulos.querySelectorAll('details[open]')].map((d) => d.dataset.module))

        modulos.innerHTML = filled.map((module, i) => {
            const list = groups[module]
            const count = list.filter((l) => progressOf(l._id)).length
            return `
                <details class="card module" data-module="${module}" ${abertos.has(module) ? 'open' : ''}
                    style="animation-delay:${i * 60}ms">
                    <summary>
                        ${progressBar(moduleLabel(module), count, list.length)}
                        <span class="chevron" aria-hidden="true">❯</span>
                    </summary>
                    <ul class="lesson-list">
                        ${list.map(lessonItem).join('')}
                    </ul>
                </details>`
        }).join('')

        modulos.querySelectorAll('[data-lesson]').forEach((button) => {
            button.addEventListener('click', () => {
                openStudy(lessons.find((l) => l._id === button.dataset.lesson))
            })
        })
        fillProgress(main)
    }

    function lessonItem(lesson) {
        const progress = progressOf(lesson._id)
        return `
            <li>
                <button type="button" class="lesson-item ${progress ? 'done' : ''}" data-lesson="${lesson._id}">
                    <span class="lesson-num" aria-hidden="true">${progress ? '✓' : lesson.number}</span>
                    <span class="lesson-info">
                        <strong>${escapeHtml(lesson.title)}</strong>
                        <span>${progress
                            ? `Acertos: ${progress.score}/${progress.totalQuestions}`
                            : `Aula ${lesson.number} • não iniciada`}</span>
                    </span>
                    <span class="chevron" aria-hidden="true">❯</span>
                </button>
            </li>`
    }

    // Aluno estuda a aula e responde as perguntas (lesson_study_dialog.dart)
    function openStudy(lesson) {
        const questions = lesson.questions ?? []
        const selected = new Map() // questionIndex -> optionIndex
        let result = null

        const dialog = openSheet(`
            <div class="sheet-head">
                <div>
                    <h2>${escapeHtml(lesson.title)}</h2>
                    <p>${escapeHtml(lessonSubtitle(lesson))}</p>
                </div>
                <button type="button" class="icon-btn" data-close aria-label="Fechar">✕</button>
            </div>
            <div class="sheet-body"></div>
            <div class="sheet-foot"></div>`)

        const body = dialog.querySelector('.sheet-body')
        const foot = dialog.querySelector('.sheet-foot')
        dialog.querySelector('[data-close]').addEventListener('click', () => dialog.close())

        const isCorrect = (q) => result?.answers.find((a) => a.questionIndex === q)?.isCorrect

        function drawBody() {
            const pct = result?.total ? Math.round((result.score / result.total) * 100) : 0
            body.innerHTML = `
                ${result ? `
                    <div class="box result" role="status">
                        <div class="ring" style="--pct:${pct}"><span>${pct}%</span></div>
                        <div><small>Resultado</small><strong>${result.score} de ${result.total} acertos</strong></div>
                    </div>` : ''}
                ${lessonContentHtml(lesson)}
                ${questions.length ? `
                    <div class="section-title">
                        <span>❓ Questões</span>
                        ${result ? '' : `<span id="contador">${selected.size}/${questions.length}</span>`}
                    </div>
                    ${questions.map(questionHtml).join('')}` : ''}`
            bindVideo(body)
            body.querySelectorAll('input[type="radio"]').forEach((input) => {
                input.addEventListener('change', () => {
                    selected.set(Number(input.dataset.q), Number(input.value))
                    body.querySelector('#contador').textContent = `${selected.size}/${questions.length}`
                    drawFoot()
                })
            })
        }

        function questionHtml(question, q) {
            const correct = isCorrect(q)
            return `
                <fieldset class="box question">
                    <legend class="sr-only">Questão ${q + 1}</legend>
                    <div class="question-head">
                        <span>${q + 1}. ${escapeHtml(question.statement)}</span>
                        ${correct === undefined ? '' : `<span title="${correct ? 'Acertou' : 'Errou'}" aria-label="${correct ? 'Acertou' : 'Errou'}">${correct ? '✅' : '❌'}</span>`}
                    </div>
                    ${question.options.map((option, o) => `
                        <label class="option">
                            <input type="radio" name="q${q}" value="${o}" data-q="${q}"
                                ${selected.get(q) === o ? 'checked' : ''} ${result ? 'disabled' : ''}>
                            <span class="letter" aria-hidden="true">${optionLetter(o)}</span>
                            <span>${escapeHtml(option)}</span>
                        </label>`).join('')}
                </fieldset>`
        }

        function drawFoot(sending = false) {
            if (result) {
                foot.innerHTML = `
                    <button type="button" class="btn btn-outline" id="refazer">↻ Refazer</button>
                    <button type="button" class="btn btn-primary" id="concluir">✓ Concluir</button>`
                foot.querySelector('#refazer').addEventListener('click', () => {
                    result = null
                    selected.clear()
                    drawBody()
                    drawFoot()
                    dialog.scrollTop = 0
                })
                foot.querySelector('#concluir').addEventListener('click', () => dialog.close())
                return
            }
            const allAnswered = selected.size === questions.length
            foot.innerHTML = `
                <button type="button" class="btn btn-outline" id="fechar">Fechar</button>
                ${questions.length ? `
                    <button type="button" class="btn btn-primary" id="enviar" ${allAnswered && !sending ? '' : 'disabled'}>
                        ${sending ? 'Enviando...' : '➤ Enviar'}
                    </button>` : ''}`
            foot.querySelector('#fechar').addEventListener('click', () => dialog.close())
            foot.querySelector('#enviar')?.addEventListener('click', submit)
        }

        async function submit() {
            drawFoot(true)
            try {
                const answers = [...selected].map(([questionIndex, selectedOptionIndex]) => ({ questionIndex, selectedOptionIndex }))
                result = await lessonApi.submit(lesson._id, answers)
                mine = [...mine.filter((p) => refId(p.lessonId) !== lesson._id), result.progress]
                drawBody()
                drawFoot()
                dialog.scrollTop = 0
                draw()
                toast('Respostas enviadas!')
            } catch (error) {
                toast(error.message, 'error')
                drawFoot()
            }
        }

        drawBody()
        drawFoot()
    }

    load()
}
