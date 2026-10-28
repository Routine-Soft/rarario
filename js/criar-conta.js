// Criar conta (register_page.dart) e, com "?completar=1", completar o
// cadastro de quem entrou pelo Google sem igreja (complete_profile_page.dart).
import { topbar, bindTopbar } from './shared/topo.js'
import { jaEntrou, entrou, seguir, sair, linkAcesso } from './shared/auth.js'
import { getSession, updateSession } from './shared/session.js'
import { userApi, normalizeEmail, GENDERS, ECCLESIASTICAL_ROLES, COUNTRIES } from './user/user.api.js'
import { escapeHtml, bindPasswordEyes, passwordField, fromDateInput, toDateInput } from './shared/ui.js'

const app = document.getElementById('app')
const completar = new URLSearchParams(location.search).has('completar')
const session = getSession()

if (completar && !session?.accessToken) {
    location.replace(linkAcesso('entrar.html'))
} else if (completar || !jaEntrou()) {
    render(completar ? session.user : null)
}

function render(user) {
    const options = (list, selected) => list.map((v) => `<option ${v === selected ? 'selected' : ''}>${escapeHtml(v)}</option>`).join('')

    const igreja = `
        <fieldset class="form-section reveal" style="--i:${user ? 4 : 6}">
            <legend>⛪ Igreja</legend>
            <div class="field">
                <label for="igreja">Igreja *</label>
                <select class="input" id="igreja" required><option value="">Carregando igrejas...</option></select>
            </div>
            ${user ? '' : `
                <div class="field">
                    <span class="field-label" id="cargos-label">Cargo eclesiástico</span>
                    <div class="chips" role="group" aria-labelledby="cargos-label">
                        ${ECCLESIASTICAL_ROLES.map(([value, label]) => `
                            <label class="chip"><input type="checkbox" name="cargo" value="${value}"><span>${label}</span></label>`).join('')}
                    </div>
                </div>`}
        </fieldset>`

    app.innerHTML = `
        ${topbar(user ? 'Completar cadastro' : 'Criar conta', user)}
        <form class="card auth-card auth-wide" id="cadastro" novalidate>
            <img class="auth-logo auth-logo-sm floating reveal" style="--i:1" src="../img/logo-rarario-transparente.webp" alt="">
            <h1 class="gradient-text reveal" style="--i:2">${user ? 'Complete seu cadastro' : 'Criar conta'}</h1>
            <p class="auth-sub reveal" style="--i:3">${user
                ? `Falta pouco: conte um pouco mais sobre você<br>(${escapeHtml(user.email)})`
                : 'Preencha seus dados para entrar na comunidade'}</p>

            ${user ? igreja : ''}

            <fieldset class="form-section reveal" style="--i:4">
                <legend>👤 Sobre você</legend>
                <div class="field">
                    <label for="nome">Nome completo *</label>
                    <input class="input" id="nome" autocomplete="name" required value="${escapeHtml(user?.name ?? '')}">
                </div>
                <div class="field">
                    <label for="genero">Gênero *</label>
                    <select class="input" id="genero" required><option value="">Escolha</option>${options(GENDERS, user?.gender)}</select>
                </div>
                <div class="field">
                    <label for="nascimento">Data de nascimento *</label>
                    <input class="input" id="nascimento" type="date" max="${toDateInput()}"
                        value="${user?.birthdate ? toDateInput(user.birthdate) : ''}">
                </div>
                <label class="check">
                    <input type="checkbox" id="batizado" ${user?.baptized ? 'checked' : ''}>
                    <span>
                        <strong>Sou batizado(a)</strong>
                        <small>Quem já é batizado não precisa fazer o módulo RESET do Avançai.</small>
                    </span>
                </label>
            </fieldset>

            <fieldset class="form-section reveal" style="--i:5">
                <legend>✉️ Contato</legend>
                ${user ? '' : `
                    <div class="field">
                        <label for="email">E-mail *</label>
                        <input class="input" id="email" type="email" autocomplete="email" inputmode="email" required>
                    </div>`}
                <div class="field">
                    <label for="pais">País</label>
                    <select class="input" id="pais">${COUNTRIES.map(([label], i) => `<option value="${i}">${label}</option>`).join('')}</select>
                </div>
                <div class="field">
                    <label for="telefone">Telefone *</label>
                    <input class="input" id="telefone" type="tel" autocomplete="tel-national" inputmode="tel" placeholder="DDD + número">
                </div>
            </fieldset>

            ${user ? '' : igreja}

            <fieldset class="form-section reveal" style="--i:7">
                <legend>🏠 Endereço</legend>
                <div class="field">
                    <label for="cep">CEP *</label>
                    <input class="input" id="cep" inputmode="numeric" autocomplete="postal-code" placeholder="00000-000" maxlength="9">
                    <small class="field-hint" id="cep-status" aria-live="polite"></small>
                </div>
                <div class="field"><label for="rua">Rua *</label><input class="input" id="rua" autocomplete="address-line1"></div>
                <div class="field-row">
                    <div class="field"><label for="numero">Nº</label><input class="input" id="numero"></div>
                    <div class="field"><label for="complemento">Complemento</label><input class="input" id="complemento" autocomplete="address-line2"></div>
                </div>
                <div class="field"><label for="bairro">Bairro *</label><input class="input" id="bairro"></div>
                <div class="field-row">
                    <div class="field"><label for="cidade">Cidade *</label><input class="input" id="cidade" autocomplete="address-level2"></div>
                    <div class="field"><label for="estado">Estado *</label><input class="input" id="estado" autocomplete="address-level1"></div>
                </div>
            </fieldset>

            ${user ? '' : `
                <fieldset class="form-section reveal" style="--i:8">
                    <legend>🔒 Acesso</legend>
                    ${passwordField('senha', 'Senha *', 'new-password')}
                    ${passwordField('repetir', 'Confirmar senha *', 'new-password')}
                </fieldset>`}

            <div class="alert alert-error" id="erro" role="alert" hidden></div>
            <button class="btn btn-primary btn-block btn-lg" type="submit">${user ? '✓ Concluir cadastro' : '✓ Cadastrar'}</button>
            ${user
                ? '<button type="button" class="btn btn-outline btn-block" id="sair-cadastro">Sair</button>'
                : `<p class="auth-foot">Já tem uma conta? <a href="${linkAcesso('login.html')}">Faça login</a></p>`}
        </form>
        ${user ? '' : `<div class="back-link-wrapper"><a href="${linkAcesso('entrar.html')}" class="back-link">← Voltar</a></div>`}`

    const form = app.querySelector('#cadastro')
    const $ = (id) => form.querySelector(`#${id}`)
    const value = (id) => $(id)?.value.trim() ?? ''

    const voltarAoInicio = async () => {
        await sair()
        location.replace(linkAcesso('entrar.html'))
    }
    bindTopbar(app, voltarAoInicio)
    form.querySelector('#sair-cadastro')?.addEventListener('click', voltarAoInicio)
    bindPasswordEyes(form)
    // "Nenhum" não se mistura com os outros cargos
    form.querySelectorAll('input[name="cargo"]').forEach((caixa) => caixa.addEventListener('change', () => {
        if (!caixa.checked) return
        form.querySelectorAll('input[name="cargo"]:checked').forEach((outra) => {
            if (outra !== caixa && (outra.value === 'nenhum' || caixa.value === 'nenhum')) outra.checked = false
        })
    }))
    preencherTelefone(user?.phone)
    preencherEndereco(user?.address)
    carregarIgrejas(user?.churchId)
    bindCep()

    function preencherTelefone(phone) {
        const digits = String(phone ?? '').replace(/\D/g, '')
        if (!digits) return
        // DDI mais longo primeiro (+351 antes de +35)
        const index = COUNTRIES
            .map(([, ddi], i) => ({ ddi: ddi.slice(1), i }))
            .sort((a, b) => b.ddi.length - a.ddi.length)
            .find(({ ddi }) => digits.length > ddi.length && digits.startsWith(ddi))
        if (!index) return
        $('pais').value = String(index.i)
        $('telefone').value = digits.slice(index.ddi.length)
    }

    function preencherEndereco(address) {
        if (!address) return
        const campos = { cep: 'cep', rua: 'address', numero: 'number', complemento: 'complement', bairro: 'neighborhood', cidade: 'city', estado: 'state' }
        for (const [id, key] of Object.entries(campos)) $(id).value = address[key] ?? ''
    }

    async function carregarIgrejas(selected) {
        const select = $('igreja')
        try {
            const churches = await userApi.getChurches()
            churches.sort((a, b) => String(a.name).localeCompare(String(b.name), 'pt-BR'))
            select.innerHTML = `
                <option value="">Escolha a sua igreja</option>
                ${churches.map((c) => `<option value="${c._id}" ${c._id === selected ? 'selected' : ''}>${escapeHtml(c.name)}</option>`).join('')}`
        } catch {
            select.innerHTML = '<option value="">Não foi possível carregar as igrejas</option>'
        }
    }

    // CEP com 8 números preenche rua, bairro, cidade e estado (ViaCEP, igual ao app)
    function bindCep() {
        const cep = $('cep')
        const status = $('cep-status')
        let ultimo = ''
        cep.addEventListener('input', async () => {
            const digits = cep.value.replace(/\D/g, '').slice(0, 8)
            cep.value = digits.length > 5 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits
            if (digits.length !== 8 || digits === ultimo) return
            ultimo = digits
            status.textContent = 'Buscando endereço...'
            try {
                const response = await fetch(`https://viacep.com.br/ws/${digits}/json/`)
                const data = await response.json()
                if (data.erro) throw new Error()
                $('rua').value = data.logradouro || $('rua').value
                $('bairro').value = data.bairro || $('bairro').value
                $('cidade').value = data.localidade || $('cidade').value
                $('estado').value = data.uf || $('estado').value
                status.textContent = ''
                $('numero').focus()
            } catch {
                status.textContent = 'CEP não encontrado. Preencha o endereço à mão.'
            }
        })
    }

    function problema() {
        if (value('nome').length < 3) return 'Informe o nome completo (pelo menos 3 letras).'
        if (!user && !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(normalizeEmail(value('email')))) {
            return 'Informe um e-mail válido.'
        }
        if (!value('genero')) return 'Escolha o gênero.'
        if (!value('nascimento')) return 'Informe a data de nascimento.'
        const phone = value('telefone').replace(/\D/g, '')
        if (!phone) return 'Informe o telefone.'
        if (phone.length < 10) return 'O telefone precisa ter DDD + número (pelo menos 10 números).'
        if (!value('igreja')) return 'Escolha a sua igreja.'
        if (value('cep').replace(/\D/g, '').length !== 8) return 'Informe o CEP com 8 números.'
        for (const [id, nome] of [['rua', 'a rua'], ['bairro', 'o bairro'], ['cidade', 'a cidade'], ['estado', 'o estado']]) {
            if (!value(id)) return `Informe ${nome}.`
        }
        if (!user) {
            const senha = $('senha').value
            if (senha.length < 6) return 'A senha precisa ter pelo menos 6 caracteres.'
            if (/\s/.test(senha)) return 'A senha não pode ter espaços.'
            if (senha !== $('repetir').value) return 'As duas senhas não são iguais.'
        }
        return ''
    }

    function campos() {
        const phone = value('telefone').replace(/\D/g, '')
        const ddi = COUNTRIES[Number($('pais').value)]?.[1] ?? '+55'
        const vazio = (text) => text || undefined
        return {
            name: value('nome'),
            gender: vazio(value('genero')),
            birthdate: value('nascimento') ? fromDateInput(value('nascimento')) : undefined,
            baptized: $('batizado').checked,
            phone: phone ? `${ddi}${phone}` : undefined,
            churchId: value('igreja'),
            address: {
                cep: vazio(value('cep')),
                address: vazio(value('rua')),
                number: vazio(value('numero')),
                complement: vazio(value('complemento')),
                neighborhood: vazio(value('bairro')),
                city: vazio(value('cidade')),
                state: vazio(value('estado')),
            },
        }
    }

    const erro = $('erro')
    const botao = form.querySelector('button[type="submit"]')
    const textoBotao = botao.textContent

    form.addEventListener('submit', async (event) => {
        event.preventDefault()
        const mensagem = problema()
        if (mensagem) {
            erro.textContent = mensagem
            erro.hidden = false
            erro.scrollIntoView({ behavior: 'smooth', block: 'center' })
            return
        }

        erro.hidden = true
        botao.disabled = true
        botao.textContent = 'Salvando...'
        try {
            if (user) {
                const updated = await userApi.patch(user._id, campos())
                updateSession({ user: updated })
                seguir(updated)
            } else {
                const email = value('email')
                const password = $('senha').value
                await userApi.register({
                    ...campos(),
                    email,
                    password,
                    ecclesiasticalRoles: [...form.querySelectorAll('input[name="cargo"]:checked')].map((c) => c.value),
                })
                entrou(await userApi.login(email, password))
            }
        } catch (error) {
            erro.textContent = error.message
            erro.hidden = false
            botao.disabled = false
            botao.textContent = textoBotao
        }
    })
}
