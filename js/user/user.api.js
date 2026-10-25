// Rotas de /users e /churchs do rara-backend (espelha lib/api/user_api.dart).
import { httpClient } from '../shared/httpClient.js'

export const userApi = {
    // email salvo sem espaços e minúsculo
    login: (email, password) =>
        httpClient.post('/users/login', { email: email.trim().toLowerCase(), password }),
    logout: () => httpClient.post('/users/logout'),
    getById: (id) => httpClient.get(`/users/${id}`),
    getAll: (churchId) => httpClient.get(churchId ? `/users?churchId=${encodeURIComponent(churchId)}` : '/users'),
    patch: (id, fields) => httpClient.patch(`/users/${id}`, fields),
    updatePassword: (id, newPassword, currentPassword) =>
        httpClient.post(`/users/${id}/password`, { newPassword, currentPassword }),
    getChurches: () => httpClient.get('/churchs'),
}

// Cargos que abrem o Painel do Professor (mesmos do "Avançai Liderança" no app;
// a equipe do Avançai vale como o líder)
export const TEACHER_ROLES = ['super_admin', 'pastor_local', 'secretaria_igreja', 'avancai_lider', 'avancai_equipe']

export const isTeacher = (user) => (user?.roles ?? []).some((role) => TEACHER_ROLES.includes(role))
export const isSuperAdmin = (user) => (user?.roles ?? []).includes('super_admin')
