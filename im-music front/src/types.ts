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
