import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export const geminiService = {
  async generateMarketResearch(artistName: string, genre: string) {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Generate a detailed music market research report for an artist named "${artistName}" in the "${genre}" genre. 
      Include:
      1. Current market trends for this genre.
      2. Top 3 comparable artists (benchmarks).
      3. Recommended geographic territories for growth.
      4. Ideal fan psychographics.
      5. Suggested branding narrative.
      
      Return the response in a structured JSON format.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            trends: { type: Type.ARRAY, items: { type: Type.STRING } },
            benchmarks: { type: Type.ARRAY, items: { type: Type.STRING } },
            territories: { type: Type.ARRAY, items: { type: Type.STRING } },
            psychographics: { type: Type.STRING },
            narrative: { type: Type.STRING },
          },
          required: ["trends", "benchmarks", "territories", "psychographics", "narrative"],
        },
      },
    });
    return JSON.parse(response.text || "{}");
  },

  async extractMetadata(trackTitle: string) {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Based on the track title "${trackTitle}", suggest optimized metadata:
      - Genre
      - Mood
      - Key instruments
      - Potential sub-genres
      
      Return as JSON.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            genre: { type: Type.STRING },
            mood: { type: Type.STRING },
            instruments: { type: Type.ARRAY, items: { type: Type.STRING } },
            subGenres: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ["genre", "mood", "instruments", "subGenres"],
        },
      },
    });
    return JSON.parse(response.text || "{}");
  }
};
