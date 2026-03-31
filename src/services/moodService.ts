import SpotifyWebApi from 'spotify-web-api-node';

export async function getRecommendationsForMood(spotifyApi: SpotifyWebApi, mood: string, limit: number = 10): Promise<any> {
  // Implementación mínima
  return { tracks: [] };
}