export async function moderateMessage(message: string): Promise<{ flagged: boolean; reason?: string; severity?: 'low' | 'medium' | 'high' }> {
  // Implementación mínima para que el build pase
  return { flagged: false };
}