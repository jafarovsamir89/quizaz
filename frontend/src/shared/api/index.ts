import api from './base';

export const authApi = {
  sync: (token: string) => api.post('/auth/sync', { token }),
};

export const profileApi = {
  getMe: () => api.get('/profile/me'),
  getStats: () => api.get('/profile/stats'),
  updateCity: (cityId: number) => api.patch('/profile/city', { cityId }),
  updateMe: (data: any) => api.patch('/profile/me', data),
  claimDailyBonus: () => api.post('/profile/daily-bonus'),
};

export const metadataApi = {
  getCities: () => api.get('/cities'),
  getCategories: () => api.get('/categories'),
};

export const gameApi = {
  startSolo: (data: { categoryId?: number; difficulty?: number; limit?: number }) => 
    api.post('/game/solo/start', data),
  submitAnswer: (sessionId: string, data: { questionId: number; selectedOption: string; timeSpentMs: number }) => 
    api.post(`/game/solo/${sessionId}/answer`, data),
  finishSolo: (sessionId: string) => 
    api.post(`/game/solo/${sessionId}/finish`),
  getSession: (sessionId: string) => 
    api.get(`/game/sessions/${sessionId}`),
};

export const leaderboardsApi = {
  getCities: (period = 'weekly') => api.get(`/leaderboards/cities?period=${period}`),
  getPlayers: (period = 'weekly', cityId?: number) => 
    api.get(`/leaderboards/players?period=${period}${cityId ? `&cityId=${cityId}` : ''}`),
  getMyRank: (period = 'weekly') => api.get(`/leaderboards/me?period=${period}`),
};

export const duelsApi = {
  findOrCreate: () => api.post('/duels/find-or-create'),
  getMyDuels: () => api.get('/duels/my'),
  submitAnswer: (duelId: string, data: { questionId: number; selectedOption: string; timeSpentMs: number }) => 
    api.post(`/duels/${duelId}/answer`, data),
  finishSide: (duelId: string) => api.post(`/duels/${duelId}/finish`),
  getDuel: (duelId: string) => api.get(`/duels/${duelId}`),
};

export const clansApi = {
  create: (data: { name: string; type: string; logoUrl?: string }) => 
    api.post('/clans/create', data),
  join: (id: string) => api.post(`/clans/${id}/join`),
  leave: () => api.post('/clans/leave'),
  getLeaderboard: (type: string) => api.get(`/clans/leaderboard/${type}`),
  getDetails: (id: string) => api.get(`/clans/${id}`),
};

export const heroesApi = {
  getAll: () => api.get('/heroes/all'),
  getMy: () => api.get('/heroes/my'),
  equip: (id: string, equip: boolean) => api.post(`/heroes/${id}/equip`, { equip }),
  openChest: () => api.post('/heroes/chest'),
  levelUp: (id: string) => api.post(`/heroes/${id}/levelup`),
};
