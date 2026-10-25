// Rotas de /lessons e /lesson-progresses do rara-backend
// (espelha lib/api/lesson_api.dart e lesson_progress_api.dart).
import { httpClient } from '../shared/httpClient.js'

export const lessonApi = {
    getAll: () => httpClient.get('/lessons'),
    getMyProgress: () => httpClient.get('/lesson-progresses/me'),
    getAllProgress: () => httpClient.get('/lesson-progresses'),
    // answers: [{ questionIndex, selectedOptionIndex }] — o backend corrige
    submit: (lessonId, answers) => httpClient.post(`/lessons/${lessonId}/submit`, { answers }),
}
