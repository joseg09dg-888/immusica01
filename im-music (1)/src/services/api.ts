import axios from 'axios';
import { API_URL } from '../config/api';

const api = axios.create({
  baseURL: API_URL,
});

// Interceptor para agregar el token de autenticación
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('im_music_token'); // Using the existing token key from previous turns
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ==================== AUTH ====================
export const loginWithSpotify = () => {
  window.location.href = `${API_URL}/auth/login`;
};

export const handleCallback = (code: string) => {
  return api.get(`/auth/callback?code=${code}`);
};

// ==================== WOMPI & PAYMENTS ====================
export const getWompiPlans = () => api.get('/wompi/plans');
export const createWompiPayment = (planId: string, amount: number) => 
  api.post('/wompi/create-payment', { planId, amount });
export const checkTransactionStatus = (id: string) => api.get(`/wompi/transaction/${id}`);
export const getTransactionHistory = () => api.get('/wompi/history');
export const getSubscriptions = () => api.get('/wompi/subscriptions');
export const cancelSubscription = (id: string) => api.post(`/wompi/subscriptions/${id}/cancel`);

// ==================== TRACKS ====================
export const getTracks = () => api.get('/tracks');
export const createTrack = (formData: FormData) => 
  api.post('/tracks', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const updateTrack = (id: number, formData: FormData) => 
  api.put(`/tracks/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const deleteTrack = (id: number) => api.delete(`/tracks/${id}`);
export const getTrackStats = (trackId: number) => 
  api.get(`/stats/track/${trackId}`);

// ==================== SPLITS ====================
export const createSplit = (trackId: number, data: any) => 
  api.post(`/tracks/${trackId}/splits`, data);
export const getSplits = (trackId?: number) => 
  trackId ? api.get(`/tracks/${trackId}/splits`) : api.get('/splits');
export const getPendingSplits = (trackId?: number) => 
  trackId ? api.get(`/tracks/${trackId}/splits/pending`) : api.get('/splits/pending');
export const acceptSplit = (token: string) => 
  api.get(`/splits/accept/${token}`);
export const rejectSplit = (token: string) => 
  api.get(`/splits/reject/${token}`);
export const deleteSplit = (splitId: number) => 
  api.delete(`/splits/${splitId}`);

// ==================== STATS ====================
export const uploadStats = (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post('/stats/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
};
export const getArtistSummary = () => 
  api.get('/stats/summary');
export const getArtistTracks = () => 
  api.get('/stats/tracks');

// ==================== MARKETPLACE ====================
export const getBeats = () => api.get('/marketplace/beats');
export const buyBeat = (beatId: number) => api.post('/marketplace/buy', { beatId });

// ==================== FINANCING ====================
export const checkEligibility = () => api.get('/financing/mi-elegibilidad');
export const requestAdvance = (amount: number, reason: string) => 
  api.post('/financing/solicitar', { amount, reason });
export const getAdvances = () => api.get('/financing/mis-adelantos');

// ==================== BULK UPLOAD / CATALOG MIGRATION ====================
export const bulkUploadFiles = (files: File[]) => {
  const formData = new FormData();
  files.forEach(file => formData.append('files', file));
  return api.post('/upload/files', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
};

// ==================== MARKETING & BRANDING ====================
export const getBrandingQuestions = () => api.get('/marketing/preguntas');
export const submitBrandingTest = (respuestas: string[]) => 
  api.post('/marketing/procesar-test', { respuestas });
export const generateSensoryBranding = () => api.post('/marketing/generar-sensorial');
export const generateTargetMarket = () => api.post('/marketing/generar-mercado');
export const generateContentPlan = () => api.post('/marketing/generar-plan');
export const getMiBranding = () => api.get('/marketing/mi-branding');

// ==================== FACEBOOK ADS ====================
export const createFacebookCampaign = (data: any) => api.post('/facebook-ads/campaign', data);
export const getCampaigns = () => api.get('/facebook-ads/campaigns');
export const getCampaignInsights = (campaignId: string) => api.get(`/facebook-ads/insights/${campaignId}`);

// ==================== MOOD & AI ====================
export const analyzeMood = (text: string) => api.post('/mood/analyze', { text });
export const getSpotifyMoodLogin = () => {
  window.open(`${API_URL}/mood/login`, 'spotify_login', 'width=600,height=700');
};
export const getMoodRecommendations = (mood: string) => 
  api.get(`/mood/recommendations?mood=${mood}`);

// ==================== ROYALTIES & WITHHOLDINGS ====================
export const getMyWithholdings = () => api.get('/royalties/withholdings/my');
export const releaseWithholding = (id: number) => api.post(`/royalties/withholdings/${id}/release`);

// ==================== LEGAL AGENT ====================
export const queryLegalAgent = (query: string) => 
  api.post('/legal-agent/query', { query });

// ==================== HYPERFOLLOW ====================
export const createHyperFollow = (data: any) => api.post('/hyperfollow', data);
export const getHyperFollows = () => api.get('/hyperfollow');
export const deleteHyperFollow = (id: number) => api.delete(`/hyperfollow/${id}`);
export const getHyperFollowBySlug = (slug: string) => api.get(`/hyperfollow/${slug}`);
export const captureLead = (hyperfollowId: number, email: string) => 
  api.post(`/hyperfollow/${hyperfollowId}/leads`, { email });

// ==================== CHAT ====================
export const getChatHistory = () => api.get('/chat/history');
export const reportMessage = (messageId: number, reason: string) => 
  api.post(`/chat/report/${messageId}`, { reason });

// ==================== PLAYLISTS ====================
export const getPlaylists = (filters?: any) => api.get('/playlists', { params: filters });
export const createPlaylist = (data: any) => api.post('/playlists', data);
export const updatePlaylist = (id: number, data: any) => api.put(`/playlists/${id}`, data);
export const deletePlaylist = (id: number) => api.delete(`/playlists/${id}`);
export const getPlaylistMoods = () => api.get('/playlists/moods');

// ==================== PROMO CARDS ====================
export const generatePromoCard = (trackId: number, options: any) => 
  api.post(`/promo-cards/generate/${trackId}`, options);

// ==================== SYSTEM ====================
export const getSystemInfo = () => api.get('/system/info');

// ==================== RELEASES & SCHEDULING ====================
export const getScheduledReleases = () => api.get('/releases/scheduled');
export const scheduleRelease = (data: any) => api.post('/releases/schedule', data);
export const cancelScheduledRelease = (id: number) => api.post(`/releases/schedule/${id}/cancel`);

// ==================== VIDEO DISTRIBUTION ====================
export const getVideos = () => api.get('/videos');
export const uploadVideo = (formData: FormData) => 
  api.post('/videos/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const deleteVideo = (id: number) => api.delete(`/videos/${id}`);

// ==================== LYRICS ====================
export const uploadLyrics = (trackId: number, data: { lyrics: string, type: 'plain' | 'synced' }) => 
  api.post(`/tracks/${trackId}/lyrics`, data);
export const getLyrics = (trackId: number) => api.get(`/tracks/${trackId}/lyrics`);

// ==================== PUBLISHING ====================
export const getCompositions = () => api.get('/publishing/compositions');
export const createComposition = (data: any) => api.post('/publishing/compositions', data);
export const getPublishingRoyalties = () => api.get('/publishing/royalties');

// ==================== LABEL & ARTISTS ====================
export const getMyArtists = () => api.get('/artists/my');
export const createArtist = (data: any) => api.post('/artists', data);
export const switchArtist = (artistId: number) => api.post(`/artists/switch/${artistId}`);

// ==================== SPOTLIGHT (PITCHING) ====================
export const pitchToPlaylist = (trackId: number, playlistId: number, message: string) => 
  api.post('/spotlight/pitch', { trackId, playlistId, message });
export const getMyPitches = () => api.get('/spotlight/my-pitches');

// ==================== SPOTIFY VERIFICATION ====================
export const getSpotifyAuthUrl = () => api.get('/artists/spotify/auth');
export const checkSpotifyStatus = () => api.get('/artists/spotify/status');

// ==================== VAULT ====================
export const getVaultFiles = () => api.get('/vault');
export const uploadToVault = (formData: FormData) => 
  api.post('/vault', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const deleteFromVault = (id: number) => api.delete(`/vault/${id}`);

// ==================== RIAA CERTIFICATIONS ====================
export const getRiaaCertifications = () => api.get('/riaa');

// ==================== AI PROMOTION ====================
export const generatePromotionalContent = (trackId: number, platform: string) => 
  api.post('/marketing/generar-promocion', { track_id: trackId, platform });

// ==================== PROMO REELS ====================
export const generatePromoReel = (trackId: number, message: string) => 
  api.post('/promo/reel', { track_id: trackId, message });

// ==================== STORE MAXIMIZER ====================
export const toggleAutoDistribute = (trackId: number, auto_distribute: boolean) => 
  api.post(`/tracks/${trackId}/auto-distribute`, { auto_distribute });

// ==================== YOUTUBE CONTENT ID ====================
export const registerYoutubeContentId = (trackId: number) => 
  api.post('/youtube/register', { track_id: trackId });
export const getYoutubeRegistrations = () => api.get('/youtube/registrations');

// ==================== LEAVE A LEGACY ====================
export const activateLeaveALegacy = (trackId: number) => 
  api.post(`/tracks/${trackId}/leave-a-legacy`);

// ==================== OPENCLAW ADMIN ====================

// Obtener mensajes del buzón
export const getInboxMessages = (status?: string, limit?: number) => {
  const params = new URLSearchParams();
  if (status) params.append('status', status);
  if (limit) params.append('limit', limit.toString());
  return api.get(`/openclaw/inbox?${params.toString()}`);
};

// Marcar mensaje como procesado
export const processInboxMessage = (id: number, status: string, taskId?: number) => 
  api.put(`/openclaw/inbox/${id}/process`, { status, taskId });

// Obtener logs del sistema
export const getSystemLogs = (lines?: number) => {
  const params = new URLSearchParams();
  if (lines) params.append('lines', lines.toString());
  return api.get(`/openclaw/logs?${params.toString()}`);
};

// Obtener estado de recursos
export const getResourceStatus = () => api.get('/openclaw/resources');

// Crear rama en GitHub (simulado)
export const createGitHubBranch = (branchName: string, baseBranch?: string, filePath?: string, content?: string, commitMessage?: string) =>
  api.post('/openclaw/github/branch', { branchName, baseBranch, filePath, content, commitMessage });

// Probar ngrok
export const testNgrok = (port?: number, subdomain?: string) =>
  api.post('/openclaw/ngrok/test', { port, subdomain });

// Obtener configuración de IA
export const getAiConfig = () => api.get('/openclaw/config');

// Activar/desactivar emergencia
export const setEmergencyStop = (stop: boolean) =>
  api.post('/openclaw/emergency', { stop });

// Obtener tareas pendientes
export const getPendingTasks = () => api.get('/openclaw/tasks');

// Actualizar tarea
export const updateTask = (id: number, data: any) => api.put(`/openclaw/tasks/${id}`, data);

// Enviar notificación
export const sendNotification = (channel: string, recipient: string, message: string) =>
  api.post('/openclaw/notify', { channel, recipient, message });

export default api;
