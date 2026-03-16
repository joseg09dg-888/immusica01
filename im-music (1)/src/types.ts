export interface User {
  id: number;
  email: string;
  name: string;
  role: string;
}

export interface Artist {
  id: number;
  user_id: number;
  name: string;
  genre: string;
  bio: string;
  tier: 'Basic' | 'Pro' | 'Premium';
}

export interface Track {
  id: number;
  artist_id: number;
  title: string;
  release_date: string;
  status: 'draft' | 'pending' | 'distributed';
  isrc?: string;
  upc?: string;
}

export interface RoyaltySummary {
  total: number;
  byPlatform: { platform: string; total: number }[];
}

export interface MarketResearch {
  trends: string[];
  benchmarks: string[];
  territories: string[];
  psychographics: string;
  narrative: string;
}

export interface Branding {
  id: number;
  artist_id: number;
  respuestas_test: string | null;
  arquetipo: string | null;
  manifiesto: string | null;
  colores: string | null;
  olores: string | null;
  sabores: string | null;
  texturas: string | null;
  lenguaje_tribu: string | null;
  simbolo: string | null;
  mercados_prioritarios: string | null;
  perfil_oyente: string | null;
  plan_contenidos: string | null;
  fecha_generacion_plan: string | null;
  created_at: string;
  updated_at: string;
}
