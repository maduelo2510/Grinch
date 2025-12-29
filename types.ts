export interface SearchQueries {
  reddit_queries: string[];
  hn_queries: string[];
  ih_queries: string[];
}

export interface ProblemIndicators {
  willingness_to_pay: boolean;
  workarounds_detected: boolean;
  trend: 'growing' | 'stable' | 'declining' | 'unknown';
  audience_size: 'niche' | 'medium' | 'large';
}

export interface Competitor {
  name: string;
  gap: string;
}

export interface Problem {
  id: string;
  title: string;
  description: string;
  pain_intensity: number; // 0-10
  frequency: number; // 0-10
  solvability: number; // 0-10 (Facilidad de solución técnica)
  monetizability: number; // 0-10 (Capacidad de pago)
  signal_score: number; // 0-10 (Nota: En la imagen es sobre 10, ajustaremos la visualización)
  
  solution_opportunity: string; // "Recommended Next Step"
  competitors: Competitor[]; // "Competitive Landscape"
  
  indicators: ProblemIndicators;
  key_quotes: string[];
  sources: { title: string; url: string; platform: 'Reddit' | 'HN' | 'IndieHackers' }[];
  raw_mentions_count: number;
}

export type AnalysisStatus = 'idle' | 'generating_queries' | 'searching' | 'analyzing' | 'complete' | 'error';

export interface AnalysisState {
  status: AnalysisStatus;
  currentStepDescription: string;
  progress: number; // 0-100
  logs: string[];
}

export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  credits_used: number;
  credits_limit?: number; // Añadido para cálculo de créditos restantes
  is_pro: boolean;
  stripe_customer_id?: string;
}