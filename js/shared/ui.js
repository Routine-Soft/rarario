// Peças de tela usadas pelos dois painéis.

export function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
}

export function toast(message, type = 'success') {
    let area = document.querySelector('.toast-area')
    if (!area) {
        area = document.createElement('div')
        area.className = 'toast-area'
        area.setAttribute('role', 'status')
        area.setAttribute('aria-live', 'polite')
        document.body.append(area)
    }
    const item = document.createElement('div')
    item.className = `toast toast-${type}`
    item.textContent = message
    area.append(item)
    setTimeout(() => item.remove(), 3500)
}

export const skeletons = (count = 3) =>
    Array.from({ length: count }, () => '<div class="skeleton" aria-hidden="true"></div>').join('')

export function emptyState({ icon, message, action = '' }) {
    return `
        <div class="card empty">
            <div class="empty-icon" aria-hidden="true">${icon}</div>
            <p>${escapeHtml(message)}</p>
            ${action}
        </div>`
}

export function progressBar(label, completed, total) {
    const pct = total ? Math.round((completed / total) * 100) : 0
    return `
        <div class="progress" role="img" aria-label="${escapeHtml(label)}: ${completed} de ${total} aulas">
            <div class="progress-head">
                <strong>${escapeHtml(label)}</strong>
                <span>${completed} de ${total}</span>
            </div>
            <div class="progress-track"><div class="progress-fill" data-pct="${pct}"></div></div>
        </div>`
}

// As barras "enchem" depois de aparecer na tela (transition de width)
export function fillProgress(root = document) {
    requestAnimationFrame(() => {
        root.querySelectorAll('.progress-fill[data-pct]').forEach((el) => {
            el.style.width = `${el.dataset.pct}%`
        })
    })
}

export function formatDate(value) {
    if (!value) return '—'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return '—'
    return date.toLocaleDateString('pt-BR')
}

export function initials(name) {
    const parts = String(name ?? '?').trim().split(/\s+/)
    return ((parts[0]?.[0] ?? '?') + (parts.length > 1 ? parts.at(-1)[0] : '')).toUpperCase()
}

// Abre um <dialog> de tela cheia (no celular) e apaga ao fechar
export function openSheet(html) {
    const dialog = document.createElement('dialog')
    dialog.className = 'sheet'
    dialog.innerHTML = html
    document.body.append(dialog)
    dialog.addEventListener('close', () => dialog.remove())
    dialog.addEventListener('click', (event) => {
        if (event.target === dialog) dialog.close()
    })
    dialog.showModal()
    return dialog
}

// Botão de olho dos campos de senha
export function bindPasswordEyes(root) {
    root.querySelectorAll('.password-wrap .eye').forEach((button) => {
        button.addEventListener('click', () => {
            const input = button.parentElement.querySelector('input')
            const showing = input.type === 'text'
            input.type = showing ? 'password' : 'text'
            button.textContent = showing ? '👁️' : '🙈'
            button.setAttribute('aria-label', showing ? 'Mostrar senha' : 'Esconder senha')
        })
    })
}

export const passwordField = (id, label, autocomplete) => `
    <div class="field">
        <label for="${id}">${label}</label>
        <div class="password-wrap">
            <input class="input" id="${id}" name="${id}" type="password" autocomplete="${autocomplete}" required>
            <button type="button" class="eye" aria-label="Mostrar senha">👁️</button>
        </div>
    </div>`

// Data de hoje / de um ISO para o <input type="date"> (yyyy-mm-dd, hora local)
export function toDateInput(value = new Date()) {
    const date = new Date(value)
    const two = (n) => String(n).padStart(2, '0')
    return `${date.getFullYear()}-${two(date.getMonth() + 1)}-${two(date.getDate())}`
}

// "yyyy-mm-dd" -> meia-noite local em ISO (igual ao app: toUtc().toIso8601String())
export function fromDateInput(text) {
    const [y, m, d] = text.split('-').map(Number)
    return new Date(y, m - 1, d).toISOString()
}
