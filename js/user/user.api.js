// Rotas de /users e /churchs do rara-backend (espelha lib/api/user_api.dart).
import { httpClient } from '../shared/httpClient.js'

// email salvo sem espaços e minúsculo
export const normalizeEmail = (email) => String(email ?? '').replace(/\s/g, '').toLowerCase()

export const userApi = {
    login: (email, password) => httpClient.post('/users/login', { email: normalizeEmail(email), password }),
    // Troca o idToken do Google pela sessão (cria a conta se for nova)
    loginWithGoogle: (idToken) => httpClient.post('/users/google', { idToken }),
    // Cadastro público (a própria pessoa)
    register: (fields) => httpClient.post('/users', { ...fields, email: normalizeEmail(fields.email) }),
    logout: () => httpClient.post('/users/logout'),
    getById: (id) => httpClient.get(`/users/${id}`),
    getAll: (churchId) => httpClient.get(churchId ? `/users?churchId=${encodeURIComponent(churchId)}` : '/users'),
    patch: (id, fields) => httpClient.patch(`/users/${id}`, fields),
    updatePassword: (id, newPassword, currentPassword) =>
        httpClient.post(`/users/${id}/password`, { newPassword, currentPassword }),
    getChurches: () => httpClient.get('/churchs'),
}

export const GENDERS = ['Masculino', 'Feminino']

// Cargos eclesiásticos — enum ECCLESIASTICAL_ROLES do backend
export const ECCLESIASTICAL_ROLES = [
    ['pastor', 'Pastor(a)'],
    ['presbitero', 'Presbítero(a)'],
    ['apostolo', 'Apóstolo(a)'],
    ['diacono', 'Diácono(a)'],
    ['obreiro', 'Obreiro(a)'],
    ['evangelista', 'Evangelista'],
]

// Países com DDI, usados no telefone (lib/constants/register_constants.dart)
export const COUNTRIES = [
    ['Brasil (+55)', '+55'],
    ['Estados Unidos (+1)', '+1'],
    ['Canadá (+1)', '+1'],
    ['México (+52)', '+52'],
    ['Argentina (+54)', '+54'],
    ['Chile (+56)', '+56'],
    ['Colombia (+57)', '+57'],
    ['Peru (+51)', '+51'],
    ['Venezuela (+58)', '+58'],
    ['Portugal (+351)', '+351'],
    ['Espanha (+34)', '+34'],
    ['França (+33)', '+33'],
    ['Alemanha (+49)', '+49'],
    ['Itália (+39)', '+39'],
    ['Reino Unido (+44)', '+44'],
    ['Austrália (+61)', '+61'],
    ['Nova Zelândia (+64)', '+64'],
    ['Japão (+81)', '+81'],
    ['China (+86)', '+86'],
    ['Índia (+91)', '+91'],
    ['Moçambique (+258)', '+258'],
    ['Angola (+244)', '+244'],
]

// Cargos que abrem o Painel do Professor (mesmos do "Avançai Liderança" no app;
// a equipe do Avançai vale como o líder)
export const TEACHER_ROLES = ['super_admin', 'pastor_local', 'secretaria_igreja', 'avancai_lider', 'avancai_equipe']

export const isTeacher = (user) => (user?.roles ?? []).some((role) => TEACHER_ROLES.includes(role))
export const isSuperAdmin = (user) => (user?.roles ?? []).includes('super_admin')
