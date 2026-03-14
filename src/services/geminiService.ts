import { GoogleGenerativeAI } from '@google/generative-ai';

// Configurar Gemini con tu API key (desde .env)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

/**
 * Genera una descripción promocional para una canción.
 */
export async function generateSongDescription(title: string, artist: string, genre?: string, mood?: string): Promise<string> {
  try {
    const prompt = `
      Escribe una descripción promocional atractiva para una canción.
      Título: "${title}"
      Artista: "${artist}"
      ${genre ? `Género: ${genre}` : ''}
      ${mood ? `Estado de ánimo: ${mood}` : ''}
      La descripción debe ser breve (máximo 150 palabras) y adecuada para redes sociales o plataformas de streaming.
      No incluyas hashtags en la descripción.
    `;
    const result = await model.generateContent(prompt);
    const response = result.response.text();
    return response.trim();
  } catch (error) {
    console.error('Error en generateSongDescription:', error);
    return 'No se pudo generar la descripción en este momento.';
  }
}

/**
 * Genera una lista de hashtags relevantes para una canción.
 */
export async function generateHashtags(title: string, artist: string, genre?: string, mood?: string): Promise<string[]> {
  try {
    const prompt = `
      Genera una lista de 10 hashtags relevantes para promocionar una canción en redes sociales.
      Título: "${title}"
      Artista: "${artist}"
      ${genre ? `Género: ${genre}` : ''}
      ${mood ? `Estado de ánimo: ${mood}` : ''}
      Los hashtags deben estar en español, comenzar con '#' y ser útiles para marketing musical.
      Devuélvelos como una lista separada por comas, sin números ni explicaciones.
    `;
    const result = await model.generateContent(prompt);
    const response = result.response.text();
    // Limpiar y convertir a array
    const hashtags = response.split(',').map(tag => tag.trim().replace(/^#/, '').replace(/\s+/g, '')).filter(t => t);
    return hashtags.map(tag => `#${tag}`);
  } catch (error) {
    console.error('Error en generateHashtags:', error);
    return ['#musica', '#nuevotema', '#artista'];
  }
}

/**
 * Genera un post completo para Instagram o Facebook.
 */
export async function generateSocialPost(title: string, artist: string, genre?: string, mood?: string): Promise<{ caption: string; hashtags: string[] }> {
  try {
    const prompt = `
      Genera un post promocional para redes sociales (Instagram/Facebook) sobre una canción.
      Título: "${title}"
      Artista: "${artist}"
      ${genre ? `Género: ${genre}` : ''}
      ${mood ? `Estado de ánimo: ${mood}` : ''}
      El post debe incluir un texto atractivo (máximo 200 palabras) y una lista de 5 hashtags relevantes.
      Devuelve el resultado en el siguiente formato JSON:
      {
        "caption": "texto del post",
        "hashtags": ["#hashtag1", "#hashtag2", ...]
      }
    `;
    const result = await model.generateContent(prompt);
    const response = result.response.text();
    // Intentar parsear JSON
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          caption: parsed.caption || '',
          hashtags: Array.isArray(parsed.hashtags) ? parsed.hashtags : []
        };
      }
    } catch (e) {
      console.error('Error parseando JSON de Gemini, usando respuesta cruda:', e);
    }
    // Fallback: devolver todo como caption y generar hashtags por separado
    return {
      caption: response.substring(0, 500),
      hashtags: await generateHashtags(title, artist, genre, mood)
    };
  } catch (error) {
    console.error('Error en generateSocialPost:', error);
    return {
      caption: '¡Escucha lo nuevo!',
      hashtags: ['#musica', '#nuevotema']
    };
  }
}