import { GoogleGenAI, Type } from "@google/genai";
import { Problem, SearchQueries } from "../types";

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

// Constants for prompts
const SYSTEM_INSTRUCTION_QUERIES = `
Eres un experto investigador de mercado. Tu objetivo es traducir el interés amplio de un usuario en consultas de búsqueda específicas.
Retorna SOLO JSON válido.
`;

const SYSTEM_INSTRUCTION_ANALYSIS = `
Eres un estratega de producto y analista de negocios. 
Tu trabajo es identificar oportunidades de negocio validadas a partir de datos de foros.
TODA la salida de texto (títulos, descripciones, citas, competidores) DEBE estar en ESPAÑOL.
Retorna SOLO JSON válido.
`;

export const generateSearchQueries = async (topic: string): Promise<SearchQueries> => {
  const ai = getAI();
  
  const prompt = `
  Tema del Usuario: "${topic}"

  Genera 2 consultas optimizadas para cada plataforma:
  - Reddit: Lenguaje casual, quejas, "how do I", "hate when".
  - Hacker News: Lenguaje técnico, "Ask HN".
  - IndieHackers: "validation", "growing pains".
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION_QUERIES,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          reddit_queries: { type: Type.ARRAY, items: { type: Type.STRING } },
          hn_queries: { type: Type.ARRAY, items: { type: Type.STRING } },
          ih_queries: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: ["reddit_queries", "hn_queries", "ih_queries"],
      },
    },
  });

  if (!response.text) throw new Error("No hubo respuesta de Gemini");
  return JSON.parse(response.text) as SearchQueries;
};

export const analyzeSignals = async (topic: string, queries: SearchQueries): Promise<Problem[]> => {
  const ai = getAI();

  const prompt = `
  Tema: ${topic}
  
  Simula una búsqueda profunda en Reddit, HN e IndieHackers con estas consultas:
  ${queries.reddit_queries.join(", ")}, ${queries.hn_queries.join(", ")}, ${queries.ih_queries.join(", ")}

  Identifica 4-6 oportunidades de negocio CLARAS y validadas por quejas de usuarios.
  
  Para cada oportunidad, analiza:
  1. Pain Intensity (0-10): Qué tanto duele.
  2. Frequency (0-10): Qué tan común es.
  3. Solvability (0-10): Qué tan factible es construir una solución (SaaS, AI Wrapper, Kit, etc).
  4. Monetizability (0-10): Qué tanta capacidad de pago tiene la audiencia.
  5. Signal Score (0-10): Promedio ponderado.
  6. Recommended Next Step: Una idea concreta de producto (ej. "Crear una consultora AI nicho" o "Desarrollar un plugin de Chrome").
  7. Competitors: Lista soluciones actuales ineficientes (ej. "Excel manual", "Agencias costosas") y su "gap" o fallo.

  IMPORTANTE: Traduce todo el contenido al ESPAÑOL.

  Formato JSON estricto.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION_ANALYSIS,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          problems: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                pain_intensity: { type: Type.NUMBER },
                frequency: { type: Type.NUMBER },
                solvability: { type: Type.NUMBER },
                monetizability: { type: Type.NUMBER },
                signal_score: { type: Type.NUMBER },
                solution_opportunity: { type: Type.STRING },
                raw_mentions_count: { type: Type.NUMBER },
                indicators: {
                  type: Type.OBJECT,
                  properties: {
                    willingness_to_pay: { type: Type.BOOLEAN },
                    workarounds_detected: { type: Type.BOOLEAN },
                    trend: { type: Type.STRING, enum: ['growing', 'stable', 'declining', 'unknown'] },
                    audience_size: { type: Type.STRING, enum: ['niche', 'medium', 'large'] },
                  },
                  required: ["willingness_to_pay", "workarounds_detected"]
                },
                key_quotes: { type: Type.ARRAY, items: { type: Type.STRING } },
                competitors: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      name: { type: Type.STRING },
                      gap: { type: Type.STRING }
                    },
                    required: ["name", "gap"]
                  }
                },
                sources: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      title: { type: Type.STRING },
                      url: { type: Type.STRING },
                      platform: { type: Type.STRING, enum: ['Reddit', 'HN', 'IndieHackers'] }
                    },
                    required: ["title", "url", "platform"]
                  }
                }
              },
              required: [
                "id", "title", "description", 
                "pain_intensity", "frequency", "solvability", "monetizability", "signal_score", 
                "solution_opportunity", "competitors", "key_quotes", "sources"
              ]
            }
          }
        },
        required: ["problems"]
      }
    }
  });

  if (!response.text) throw new Error("No hubo respuesta del Análisis de Gemini");
  const data = JSON.parse(response.text);
  return data.problems;
};