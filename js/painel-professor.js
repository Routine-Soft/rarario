// Painel do Professor: alunos e membros da igreja com o progresso nas aulas
// do Avançai; detalhe do aluno com "Tornar membro" e a equipe do Avançai
// (espelha lesson_teacher_page.dart e student_detail_dialog.dart).
import { mountPanel } from './shared/painel.js'
import { lessonApi } from './lesson/lesson.api.js'
import { userApi, isTeacher, isSuperAdmin, canManageAvancaiTeam, isAvancaiTeam, whatsAppUrl } from './user/user.api.js'
import { LESSON_MODULES, modulesFor, lessonsFor, moduleLabel, groupByModule, refId } from './lesson/lesson.utils.js'
import { giftTestApi, resultOf, bestGifts } from './gift/gift.api.js'
import {
    escapeHtml, toast, skeletons, emptyState, progressBar, fillProgress, openSheet,
    formatDate, initials, toDateInput, fromDateInput,
} from './shared/ui.js'

mountPanel({
    title: 'Painel do Professor',
    canAccess: isTeacher,
    deniedMessage: 'O Painel do Professor é só para a liderança do Avançai. Peça acesso ao pastor da sua igreja.',
    render: renderProfessor,
})

function renderProfessor(main, me) {
    let users = []
    let lessons = []
    let progresses = []
    let tests = [] // Testes dos Dons (contam no total, junto com as aulas)
    let tab = 'alunos' // 'alunos' | 'membros'
    let search = ''
    let churchId = me.churchId ?? ''

    main.innerHTML = `
        <section class="card hero">
            <span class="badge-step">AVANÇAI • LIDERANÇA</span>
            <h1>Acompanhe seus alunos</h1>
            <p>Veja quantas aulas cada pessoa já fez e torne membro quem concluiu a integração.</p>
            ${isSuperAdmin(me) ? `
                <div class="field">
                    <label for="igreja">Igreja</label>
                    <select class="input" id="igreja"><option value="">Carregando igrejas...</option></select>
                </div>` : ''}
        </section>
        <div class="stats" id="numeros"></div>
        <div class="filters">
            <div class="tabs" role="tablist" aria-label="Filtrar pessoas">
                <button type="button" class="tab" role="tab" data-tab="alunos" aria-selected="true">🎓 Alunos</button>
                <button type="button" class="tab" role="tab" data-tab="membros" aria-selected="false">🛡️ Membros</button>
            </div>
            <div class="search-wrap">
                <label class="sr-only" for="busca">Buscar por nome, e-mail ou telefone</label>
                <input class="input" id="busca" type="search" placeholder="Buscar por nome, e-mail ou telefone" autocomplete="off">
            </div>
        </div>
        <div class="people" id="lista">${skeletons(4)}</div>`

    const numeros = main.querySelector('#numeros')
    const lista = main.querySelector('#lista')

    const lessonsDone = (userId) => progresses.filter((p) => refId(p.userId) === userId)

    // Trilha de cada aluno: aulas que ele faz (batizado não faz o RESET) + testes
    function journey(user) {
        const visible = new Set(lessonsFor(lessons, user).map((l) => l._id))
        const doneLessons = lessonsDone(user._id).filter((p) => visible.has(refId(p.lessonId))).length
        const doneTests = tests.filter((t) => resultOf(user, t.key)).length
        return { done: doneLessons + doneTests, total: visible.size + tests.length }
    }

    main.querySelectorAll('[data-tab]').forEach((button) => {
        button.addEventListener('click', () => {
            tab = button.dataset.tab
            main.querySelectorAll('[data-tab]').forEach((b) => b.setAttribute('aria-selected', String(b === button)))
            drawList()
        })
    })

    main.querySelector('#busca').addEventListener('input', (event) => {
        search = event.target.value.trim().toLowerCase()
        drawList()
    })

    // Super admin escolhe a igreja (os demais veem só a própria)
    const igreja = main.querySelector('#igreja')
    if (igreja) {
        userApi.getChurches()
            .then((churches) => {
                igreja.innerHTML = `
                    <option value="">Todas as igrejas</option>
                    ${churches.map((c) => `<option value="${c._id}" ${c._id === churchId ? 'selected' : ''}>${escapeHtml(c.name)}</option>`).join('')}`
            })
            .catch(() => {
                igreja.innerHTML = '<option value="">Todas as igrejas</option>'
            })
        igreja.addEventListener('change', () => {
            churchId = igreja.value
            lista.innerHTML = skeletons(4)
            loadUsers()
        })
    }

    async function load() {
        try {
            let catalog
            ;[users, lessons, progresses, catalog] = await Promise.all([
                userApi.getAll(isSuperAdmin(me) ? churchId : undefined),
                lessonApi.getAll(),
                lessonApi.getAllProgress(),
                giftTestApi.getCatalog(),
            ])
            tests = catalog.tests ?? []
            drawAll()
        } catch (error) {
            showError(error)
        }
    }

    async function loadUsers() {
        try {
            users = await userApi.getAll(churchId)
            drawAll()
        } catch (error) {
            showError(error)
        }
    }

    function showError(error) {
        numeros.innerHTML = ''
        lista.innerHTML = emptyState({
            icon: '⚠️',
            message: error.message,
            action: '<button class="btn btn-primary" id="tentar">Tentar de novo</button>',
        })
        lista.querySelector('#tentar').addEventListener('click', () => {
            lista.innerHTML = skeletons(4)
            load()
        })
    }

    function drawAll() {
        const members = users.filter((u) => u.member).length
        numeros.innerHTML = `
            <div class="card stat"><strong>${users.length - members}</strong><span>Alunos</span></div>
            <div class="card stat" style="animation-delay:60ms"><strong>${members}</strong><span>Membros</span></div>
            <div class="card stat" style="animation-delay:120ms"><strong>${lessons.length}</strong><span>Aulas</span></div>`
        drawList()
    }

    function drawList() {
        const filtered = users
            .filter((u) => (tab === 'membros' ? u.member : !u.member))
            .filter((u) => !search || [u.name, u.email, u.phone].some((v) => String(v ?? '').toLowerCase().includes(search)))
            .sort((a, b) => String(a.name ?? '').localeCompare(String(b.name ?? ''), 'pt-BR'))

        if (!filtered.length) {
            lista.innerHTML = emptyState({
                icon: search ? '🔍' : tab === 'membros' ? '🛡️' : '🎓',
                message: search
                    ? 'Ninguém encontrado com essa busca.'
                    : tab === 'membros' ? 'Nenhum membro encontrado.' : 'Nenhum aluno encontrado.',
                action: search ? '<button class="btn btn-outline" id="limpar">Limpar busca</button>' : '',
            })
            lista.querySelector('#limpar')?.addEventListener('click', () => {
                main.querySelector('#busca').value = ''
                search = ''
                drawList()
            })
            return
        }

        lista.innerHTML = filtered.map((user, i) => {
            const done = lessonsDone(user._id).length
            const trilha = journey(user)
            // div (e não button): o telefone dentro do card é um link
            return `
                <div class="card person" role="button" tabindex="0" data-user="${user._id}"
                    aria-label="Ver detalhes de ${escapeHtml(user.name || 'Sem nome')}" style="animation-delay:${Math.min(i, 8) * 50}ms">
                    <span class="avatar" aria-hidden="true">${escapeHtml(initials(user.name))}</span>
                    <span class="person-info">
                        <span>
                            <strong>${escapeHtml(user.name || 'Sem nome')}</strong>
                            <span class="email" style="display:block">${escapeHtml(user.email ?? '')}</span>
                        </span>
                        <span class="tags">
                            ${user.member ? '<span class="tag tag-success">🛡️ Membro</span>' : ''}
                            ${isAvancaiTeam(user) ? '<span class="tag tag-accent">👥 Equipe Avançai</span>' : ''}
                            ${user.status ? `<span class="tag ${user.status === 'Presente' ? 'tag-success' : 'tag-danger'}">${escapeHtml(user.status)}</span>` : ''}
                            ${user.facilitator ? `<span class="tag">🤝 Facilita: ${escapeHtml(user.facilitator)}</span>` : ''}
                            <span class="tag">💧 ${user.baptized ? 'Batizado' : 'Não batizado'}</span>
                            <span class="tag tag-accent">📖 ${done} ${done === 1 ? 'aula' : 'aulas'}</span>
                            ${user.phone ? phoneLink(user.phone) : ''}
                        </span>
                        ${trilha.total ? progressBar('Progresso', trilha.done, trilha.total) : ''}
                    </span>
                </div>`
        }).join('')

        lista.querySelectorAll('[data-user]').forEach((card) => {
            // clique no telefone abre só o WhatsApp
            card.addEventListener('click', (event) => {
                if (!event.target.closest('a')) openStudent(card.dataset.user)
            })
            card.addEventListener('keydown', (event) => {
                if (event.target !== card || (event.key !== 'Enter' && event.key !== ' ')) return
                event.preventDefault()
                openStudent(card.dataset.user)
            })
        })
        fillProgress(lista)
    }

    // Dados do aluno + situação de membro + progresso por módulo
    function openStudent(userId) {
        const dialog = openSheet(`
            <div class="sheet-head">
                <div><h2></h2><p></p></div>
                <button type="button" class="icon-btn" data-close aria-label="Fechar">✕</button>
            </div>
            <div class="sheet-body"></div>
            <div class="sheet-foot"><button type="button" class="btn btn-outline" data-close>Fechar</button></div>`)
        dialog.querySelectorAll('[data-close]').forEach((b) => b.addEventListener('click', () => dialog.close()))

        const body = dialog.querySelector('.sheet-body')
        let mode = 'view' // 'view' | 'date' | 'confirm-remove' | 'confirm-team'
        let saving = false

        function draw() {
            const user = users.find((u) => u._id === userId)
            dialog.querySelector('.sheet-head h2').textContent = user.name || 'Sem nome'
            dialog.querySelector('.sheet-head p').textContent = user.email ?? ''

            const done = lessonsDone(user._id)
            const doneIds = new Set(done.map((p) => refId(p.lessonId)))
            const groups = groupByModule(lessons)

            body.innerHTML = `
                <div class="section-title">👤 Dados pessoais</div>
                <div class="box detail-rows">
                    <div class="detail-row"><span>Telefone</span>${user.phone ? phoneLink(user.phone) : '<strong>—</strong>'}</div>
                    ${row('Gênero', user.gender)}
                    ${row('Nascimento', formatDate(user.birthdate))}
                    ${row('Batizado', user.baptized ? 'Sim' : 'Não')}
                    ${row('Status', user.status)}
                    ${row('Facilitador', user.facilitator)}
                </div>

                <div class="section-title">🛡️ Membro</div>
                ${membershipHtml(user)}

                ${canManageAvancaiTeam(me) ? `
                    <div class="section-title">👥 Equipe do Avançai</div>
                    ${teamHtml(user)}` : ''}

                <div class="section-title">📊 Progresso por módulo</div>
                <div class="box">
                    ${modulesFor(user).filter((m) => groups[m]?.length).map((m) => progressBar(
                        moduleLabel(m),
                        (groups[m] ?? []).filter((l) => doneIds.has(l._id)).length,
                        (groups[m] ?? []).length,
                    )).join('')}
                    ${tests.length ? progressBar(
                        'TESTES DE DONS',
                        tests.filter((t) => resultOf(user, t.key)).length,
                        tests.length,
                    ) : ''}
                </div>
                ${user.baptized && groups.reset?.length ? '<p class="muted">💧 Batizado: não precisa fazer o RESET.</p>' : ''}

                ${tests.length ? `
                    <div class="section-title">🎁 Testes de dons</div>
                    <div class="box">
                        <ul class="score-list">
                            ${tests.map((t) => {
                                const result = resultOf(user, t.key)
                                return `
                                    <li>
                                        <span>${escapeHtml(t.title)}</span>
                                        <b class="wrap">${result ? `⭐ ${escapeHtml(bestGifts(result))}` : 'Não fez'}</b>
                                    </li>`
                            }).join('')}
                        </ul>
                    </div>` : ''}

                ${done.length ? `
                    <div class="section-title">✅ Aulas feitas</div>
                    <div class="box">
                        <ul class="score-list">
                            ${done
                                .map((p) => ({ p, lesson: lessons.find((l) => l._id === refId(p.lessonId)) }))
                                .filter(({ lesson }) => lesson)
                                .sort((a, b) => LESSON_MODULES.indexOf(a.lesson.module) - LESSON_MODULES.indexOf(b.lesson.module) || a.lesson.number - b.lesson.number)
                                .map(({ p, lesson }) => `
                                    <li>
                                        <span>${escapeHtml(moduleLabel(lesson.module))} • ${lesson.number}. ${escapeHtml(lesson.title)}</span>
                                        <b>${p.score}/${p.totalQuestions}</b>
                                    </li>`).join('')}
                        </ul>
                    </div>` : ''}`

            bindMembership(user)
            fillProgress(body)
        }

        function membershipHtml(user) {
            const subtitle = !user.member
                ? 'Torne membro quando concluir a integração'
                : user.memberSince ? `Desde ${formatDate(user.memberSince)}` : 'Sem data de entrada'

            let actions
            if (mode === 'date') {
                actions = `
                    <p>Em que data ${escapeHtml(user.name || 'a pessoa')} se tornou membro? Para quem já era membro antes, escolha a data real: ela conta no relatório de novos membros por mês.</p>
                    <div class="field">
                        <label for="membro-desde">Membro desde</label>
                        <input class="input" type="date" id="membro-desde" max="${toDateInput()}"
                            value="${toDateInput(user.memberSince ?? new Date())}">
                    </div>
                    <button type="button" class="btn-link" id="hoje">📅 Usar a data de hoje</button>
                    <div class="row-actions">
                        <button type="button" class="btn btn-outline" id="cancelar" ${saving ? 'disabled' : ''}>Cancelar</button>
                        <button type="button" class="btn btn-primary" id="salvar-data" ${saving ? 'disabled' : ''}>
                            ${saving ? 'Salvando...' : user.member ? 'Salvar data' : 'Tornar membro'}
                        </button>
                    </div>`
            } else if (mode === 'confirm-remove') {
                actions = `
                    <div class="inline-confirm">
                        <span>Remover de membro?</span>
                        <button type="button" class="icon-btn" id="confirmar-remover" aria-label="Confirmar remoção" ${saving ? 'disabled' : ''}>${saving ? '…' : '✓'}</button>
                        <button type="button" class="icon-btn" id="cancelar" aria-label="Cancelar" ${saving ? 'disabled' : ''}>✗</button>
                    </div>`
            } else if (!user.member) {
                actions = '<button type="button" class="btn btn-primary" id="tornar">✋ Tornar membro</button>'
            } else {
                actions = `
                    <div class="row-actions">
                        <button type="button" class="btn btn-outline btn-sm" id="alterar">📅 Alterar data</button>
                        <button type="button" class="btn btn-danger-outline btn-sm" id="remover">Remover de membro</button>
                    </div>`
            }

            return `
                <div class="box">
                    <div class="member-head">
                        <span class="icon" aria-hidden="true">${user.member ? '🛡️' : '🔰'}</span>
                        <div>
                            <strong>${user.member ? 'Membro' : 'Ainda não é membro'}</strong>
                            <small>${subtitle}</small>
                        </div>
                    </div>
                    ${actions}
                </div>`
        }

        // Equipe do Avançai = acesso ao Painel do Professor
        function teamHtml(user) {
            const inTeam = isAvancaiTeam(user)
            let actions
            if (mode === 'confirm-team') {
                actions = `
                    <div class="inline-confirm">
                        <span>Tirar da equipe?</span>
                        <button type="button" class="icon-btn" id="confirmar-equipe" aria-label="Confirmar saída da equipe" ${saving ? 'disabled' : ''}>${saving ? '…' : '✓'}</button>
                        <button type="button" class="icon-btn" id="cancelar" aria-label="Cancelar" ${saving ? 'disabled' : ''}>✗</button>
                    </div>`
            } else if (inTeam) {
                actions = '<button type="button" class="btn btn-danger-outline btn-sm" id="sair-equipe">Tirar da equipe</button>'
            } else {
                actions = `<button type="button" class="btn btn-primary" id="entrar-equipe" ${saving ? 'disabled' : ''}>
                    ${saving ? 'Salvando...' : '👥 Tornar membro da equipe'}</button>`
            }

            return `
                <div class="box">
                    <div class="member-head">
                        <span class="icon" aria-hidden="true">${inTeam ? '👥' : '🔒'}</span>
                        <div>
                            <strong>${inTeam ? 'Faz parte da equipe' : 'Não faz parte da equipe'}</strong>
                            <small>${inTeam ? 'Tem acesso ao Painel do Professor' : 'A equipe acessa o Painel do Professor e acompanha os alunos'}</small>
                        </div>
                    </div>
                    ${actions}
                </div>`
        }

        function bindMembership(user) {
            const on = (id, fn) => body.querySelector(`#${id}`)?.addEventListener('click', fn)
            const setMode = (next) => () => {
                mode = next
                draw()
            }
            on('tornar', setMode('date'))
            on('alterar', setMode('date'))
            on('remover', setMode('confirm-remove'))
            on('cancelar', setMode('view'))
            on('hoje', () => {
                body.querySelector('#membro-desde').value = toDateInput()
            })
            on('salvar-data', () => {
                const value = body.querySelector('#membro-desde').value
                if (!value) return toast('Escolha a data.', 'error')
                save(user, { member: true, memberSince: fromDateInput(value) }, `${user.name} agora é membro`)
            })
            on('confirmar-remover', () => save(user, { member: false }, `${user.name} não é mais membro`))
            on('sair-equipe', setMode('confirm-team'))
            on('entrar-equipe', () => save(user, null, `${user.name} agora faz parte da equipe do Avançai`, true))
            on('confirmar-equipe', () => save(user, null, `${user.name} saiu da equipe do Avançai`, false))
        }

        // fields = null: mexe só na equipe (team = entrar/sair)
        async function save(user, fields, success, team) {
            saving = true
            draw()
            try {
                const updated = fields
                    ? await userApi.patch(user._id, fields)
                    : await userApi.setTeam(user._id, 'avancai', team)
                users = users.map((u) => (u._id === updated._id ? updated : u))
                mode = 'view'
                toast(success)
                drawAll()
            } catch (error) {
                toast(error.message, 'error')
            } finally {
                saving = false
                if (dialog.open) draw()
            }
        }

        draw()
    }

    load()
}

// Telefone que abre a conversa no WhatsApp
const phoneLink = (phone) => `
    <a class="tag tag-whatsapp" href="${whatsAppUrl(phone)}" target="_blank" rel="noopener"
        aria-label="Abrir WhatsApp de ${escapeHtml(phone)}">💬 ${escapeHtml(phone)}</a>`

const row = (label, value) => `
    <div class="detail-row"><span>${label}</span><strong>${escapeHtml(value || '—')}</strong></div>`
