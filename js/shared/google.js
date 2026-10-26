// Botão "Continuar com Google" (Google Identity Services). Entrega o idToken
// para o rara-backend (POST /users/google), o mesmo que o app faz.
import { userApi } from '../user/user.api.js'
import { entrou } from './auth.js'
import { toast } from './ui.js'

// ID "Aplicativo da Web" do Google Cloud: o mesmo serverClientId do raraapp,
// que o backend aceita em GOOGLE_CLIENT_IDS
const CLIENT_ID = '600964662831-1fi1jdhva1bvofg714iv0a2kntn4b2b9.apps.googleusercontent.com'

let carregando

function carregarScript() {
    carregando ??= new Promise((resolve, reject) => {
        const script = document.createElement('script')
        script.src = 'https://accounts.google.com/gsi/client'
        script.async = true
        script.onload = resolve
        script.onerror = reject
        document.head.append(script)
    })
    return carregando
}

// Desenha o botão dentro de `box`. Se o Google não carregar (sem internet,
// bloqueador), some com o bloco inteiro de `esconder`.
export async function googleButton(box, esconder = box) {
    try {
        await carregarScript()
    } catch {
        esconder.hidden = true
        return
    }

    window.google.accounts.id.initialize({
        client_id: CLIENT_ID,
        ux_mode: 'popup',
        callback: async ({ credential }) => {
            box.classList.add('loading')
            try {
                entrou(await userApi.loginWithGoogle(credential))
            } catch (error) {
                box.classList.remove('loading')
                toast(error.message, 'error')
            }
        },
    })

    const claro = document.documentElement.getAttribute('data-tema') !== 'escuro'
    window.google.accounts.id.renderButton(box, {
        type: 'standard',
        theme: claro ? 'outline' : 'filled_black',
        size: 'large',
        shape: 'pill',
        text: 'continue_with',
        logo_alignment: 'center',
        locale: 'pt-BR',
        width: Math.min(box.clientWidth || 320, 400),
    })
}
