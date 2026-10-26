// Topo das páginas com login (painéis, entrar, criar conta): logo, título,
// nome de quem entrou, tema e "Sair".
import { escapeHtml } from './ui.js'

const TEMAS = [
    ['escuro', 'Escuro'],
    ['claro', 'Claro'],
    ['rosa', 'Rosa'],
    ['sistema', 'Sistema'],
]

export function topbar(title, user) {
    const escolha = window.temaPainel.escolha()
    return `
        <header class="topbar">
            <a class="logo-badge" href="/" aria-label="Voltar para a página inicial">
                <img src="../img/logo-rarario-transparente.webp" alt="">
            </a>
            <div class="topbar-title">
                <strong>${escapeHtml(title)}</strong>
                <span>${user ? escapeHtml(user.name || user.email) : 'Comunhão RARA RIO'}</span>
            </div>
            <div class="topbar-actions">
                <label class="sr-only" for="tema">Tema</label>
                <select id="tema" class="theme-select">
                    ${TEMAS.map(([v, l]) => `<option value="${v}" ${v === escolha ? 'selected' : ''}>${l}</option>`).join('')}
                </select>
                ${user ? '<button type="button" class="btn btn-outline btn-sm" id="sair">Sair</button>' : ''}
            </div>
        </header>`
}

export function bindTopbar(root, onLogout) {
    root.querySelector('#tema').addEventListener('change', (e) => window.temaPainel.trocar(e.target.value))
    root.querySelector('#sair')?.addEventListener('click', onLogout)
}
