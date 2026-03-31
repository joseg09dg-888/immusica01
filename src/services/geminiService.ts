export async function generateSongDescription(title: string, artist: string, genre?: string, mood?: string): Promise<string> {
  return `Descripción generada para la canción ${title} de ${artist}.`;
}

export async function generateHashtags(title: string, artist: string, genre?: string, mood?: string): Promise<string[]> {
  return ['#musica', '#nuevotema'];
}

export async function generateSocialPost(title: string, artist: string, genre?: string, mood?: string): Promise<{ caption: string; hashtags: string[] }> {
  return {
    caption: `¡Nuevo tema: ${title} por ${artist}!`,
    hashtags: ['#musica', '#nuevotema']
  };
}