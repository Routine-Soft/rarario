// Regras de exibição das aulas (espelha o raraapp).
import { escapeHtml } from '../shared/ui.js'

// Módulos aceitos pelo backend (enum em models/lesson.model.js), na ordem do app
export const LESSON_MODULES = ['historia', 'reset', 'start', 'cdv']

const MODULE_LABELS = {
    historia: 'HISTÓRIA DA IGREJA',
    reset: 'RESET',
    start: 'START',
    cdv: 'CDV',
}

export const moduleLabel = (module) => MODULE_LABELS[module] ?? String(module).toUpperCase()

// Quem é batizado não faz o RESET: o módulo some da trilha e do total
export const modulesFor = (user) => LESSON_MODULES.filter((m) => !(user?.baptized && m === 'reset'))

export const lessonsFor = (lessons, user) => {
    const modules = modulesFor(user)
    return lessons.filter((l) => modules.includes(l.module))
}

// { historia: [aulas...], reset: [...], ... } na ordem dos módulos e das aulas
export function groupByModule(lessons) {
    const groups = Object.fromEntries(LESSON_MODULES.map((m) => [m, []]))
    for (const lesson of lessons) (groups[lesson.module] ??= []).push(lesson)
    for (const list of Object.values(groups)) list.sort((a, b) => a.number - b.number)
    return groups
}

// O progresso pode vir com userId/lessonId populados (objeto) ou só o id
export const refId = (value) => (value && typeof value === 'object' ? value._id : value) ?? ''

export const optionLetter = (index) => String.fromCharCode(65 + index)

export const lessonSubtitle = (lesson) => `Módulo: ${moduleLabel(lesson.module)} • Aula ${lesson.number}`

export function youtubeId(url) {
    const match = String(url).match(
        /(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/))([\w-]{11})/,
    )
    return match?.[1] ?? null
}

export const isHttpUrl = (url) => /^https?:\/\//i.test(String(url ?? ''))

// Markdown simples (o mesmo que o app aceita): títulos, negrito, itálico,
// riscado, listas, citações, links e divisórias. Escapa o HTML antes.
function inline(text) {
    return escapeHtml(text)
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/__(.+?)__/g, '<strong>$1</strong>')
        .replace(/(^|[^*])\*(?!\s)(.+?)\*/g, '$1<em>$2</em>')
        .replace(/~~(.+?)~~/g, '<del>$1</del>')
        .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
}

export function markdownToHtml(text) {
    const html = []
    let paragraph = []
    let list = null // { tag, items }

    const fecharParagrafo = () => {
        if (paragraph.length) html.push(`<p>${paragraph.map(inline).join('<br>')}</p>`)
        paragraph = []
    }
    const fecharLista = () => {
        if (list) html.push(`<${list.tag}>${list.items.map((i) => `<li>${inline(i)}</li>`).join('')}</${list.tag}>`)
        list = null
    }

    for (const raw of String(text ?? '').split(/\r?\n/)) {
        const line = raw.trim()
        let m
        if (!line) {
            fecharParagrafo()
            fecharLista()
        } else if ((m = line.match(/^(#{1,3})\s+(.*)$/))) {
            fecharParagrafo()
            fecharLista()
            html.push(`<h${m[1].length}>${inline(m[2])}</h${m[1].length}>`)
        } else if (/^(-{3,}|\*{3,})$/.test(line)) {
            fecharParagrafo()
            fecharLista()
            html.push('<hr>')
        } else if ((m = line.match(/^>\s?(.*)$/))) {
            fecharParagrafo()
            fecharLista()
            html.push(`<blockquote>${inline(m[1])}</blockquote>`)
        } else if ((m = line.match(/^[-*•]\s+(.*)$/)) || (m = line.match(/^\d+[.)]\s+(.*)$/))) {
            fecharParagrafo()
            const tag = /^\d/.test(line) ? 'ol' : 'ul'
            if (list?.tag !== tag) fecharLista()
            list ??= { tag, items: [] }
            list.items.push(m[1])
        } else {
            fecharLista()
            paragraph.push(line)
        }
    }
    fecharParagrafo()
    fecharLista()
    return html.join('')
}

// Imagem, vídeo e texto da aula (usado pelo aluno)
export function lessonContentHtml(lesson) {
    const parts = []
    if (isHttpUrl(lesson.image)) {
        parts.push(`<img class="lesson-image" src="${escapeHtml(lesson.image)}" alt="" loading="lazy">`)
    }
    const videoId = lesson.videoUrl ? youtubeId(lesson.videoUrl) : null
    if (videoId) {
        parts.push(`
            <div class="video" data-video="${videoId}" style="background-image:url('https://i.ytimg.com/vi/${videoId}/hqdefault.jpg')">
                <button type="button" aria-label="Assistir vídeo da aula"><span aria-hidden="true">▶</span></button>
            </div>`)
    } else if (isHttpUrl(lesson.videoUrl)) {
        parts.push(`<a class="btn btn-outline" href="${escapeHtml(lesson.videoUrl)}" target="_blank" rel="noopener">▶ Assistir vídeo da aula</a>`)
    }
    if (lesson.content) {
        parts.push(`<div class="section-title">📖 Conteúdo</div><div class="rich">${markdownToHtml(lesson.content)}</div>`)
    }
    return parts.join('')
}

// Troca a capa pelo player só no clique (não carrega o YouTube à toa)
export function bindVideo(root) {
    root.querySelectorAll('.video[data-video] button').forEach((button) => {
        button.addEventListener('click', () => {
            const box = button.parentElement
            box.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${box.dataset.video}?autoplay=1&rel=0"
                title="Vídeo da aula" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>`
        })
    })
}
