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
  },

  async reviewContract(contractText: string) {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analyze the following music industry contract text and provide a legal risk assessment.
      Contract Text: "${contractText}"
      
      Include:
      1. Summary of key terms (Duration, Territory, Royalties, Rights).
      2. Potential red flags or risks for the artist.
      3. Suggested improvements or negotiation points.
      4. Overall risk score (1-10, where 1 is safe and 10 is high risk).
      
      Return as JSON.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            redFlags: { type: Type.ARRAY, items: { type: Type.STRING } },
            suggestions: { type: Type.ARRAY, items: { type: Type.STRING } },
            riskScore: { type: Type.NUMBER },
          },
          required: ["summary", "redFlags", "suggestions", "riskScore"],
        },
      },
    });
    return JSON.parse(response.text || "{}");
  },

  async migrateCatalog(fileBase64: string, mimeType: string) {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: [
        {
          inlineData: {
            data: fileBase64,
            mimeType: mimeType
          }
        },
        {
          text: `Extract all music catalog metadata from this document/image. 
          Identify tracks, artists, ISRC codes, UPC codes, release dates, and royalty split percentages if available.
          Organize the data into a list of tracks.
          
          Return EXCLUSIVELY a JSON object with this structure:
          {
            "tracks": [
              {
                "title": "string",
                "isrc": "string or null",
                "upc": "string or null",
                "release_date": "YYYY-MM-DD or null",
                "splits": "string description of splits or null",
                "artist_name": "string"
              }
            ]
          }`
        }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            tracks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  isrc: { type: Type.STRING, nullable: true },
                  upc: { type: Type.STRING, nullable: true },
                  release_date: { type: Type.STRING, nullable: true },
                  splits: { type: Type.STRING, nullable: true },
                  artist_name: { type: Type.STRING }
                },
                required: ["title", "artist_name"]
              }
            }
          },
          required: ["tracks"]
        }
      }
    });
    return JSON.parse(response.text || "{\"tracks\": []}");
  }
};
