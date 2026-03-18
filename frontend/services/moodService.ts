import SpotifyWebApi from 'spotify-web-api-node';

export async function getRecommendationsForMood(
  spotifyApi: SpotifyWebApi,
  mood: string,
  limit: number = 10
) {
  const moodToGenres: Record<string, string[]> = {
    alegre: ['pop', 'dance', 'funk'],
    triste: ['acoustic', 'piano', 'sad'],
    energético: ['rock', 'electronic', 'dance'],
    relajado: ['ambient', 'chill', 'acoustic'],
    romántico: ['romance', 'pop', 'acoustic'],
    agresivo: ['metal', 'hard-rock', 'punk'],
    feliz: ['happy', 'pop', 'reggae'],
    melancólico: ['indie', 'alternative', 'sad'],
  };

  const seedGenres = moodToGenres[mood] || ['pop', 'rock'];

  try {
    const recommendations = await spotifyApi.getRecommendations({
      seed_genres: seedGenres,
      limit: limit,
      min_popularity: 30,
    });

    return recommendations.body;
  } catch (error) {
    console.error('Error en getRecommendationsForMood:', error);
    throw error;
  }
}