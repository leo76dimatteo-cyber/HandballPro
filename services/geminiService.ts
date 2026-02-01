
import { GoogleGenAI } from "@google/genai";
import { Match, MatchEvent, EventType, Language } from "../types";

export const generateMatchReport = async (match: Match, language: Language = 'it'): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const eventsSummary = match.events.map(e => {
    const typeLabel = {
      [EventType.GOAL]: 'Gol',
      [EventType.YELLOW_CARD]: 'Ammonizione',
      [EventType.RED_CARD]: 'Espulsione',
      [EventType.BLUE_CARD]: 'Cartellino Blu',
      [EventType.TWO_MINUTES]: '2 Minuti',
      [EventType.MISS]: 'Tiro Fuori',
      [EventType.SAVE]: 'Parata',
      [EventType.TIMEOUT]: 'Time-out',
      [EventType.LOST_BALL]: 'Palla Persa'
    }[e.type];
    const durationStr = e.duration ? ` (Durata: ${e.duration}s)` : '';
    const staffStr = e.isStaff ? ' [STAFF]' : '';
    return `[${e.gameTime}] ${e.team === 'HOME' ? match.homeTeamName : match.awayTeamName} - ${e.playerName}: ${typeLabel}${durationStr}${staffStr}`;
  }).join('\n');

  const langMap: Record<Language, string> = {
    it: "Italiano",
    en: "English",
    fr: "Français",
    de: "Deutsch",
    es: "Español"
  };

  const prompt = `
    Sei un cronista sportivo esperto di pallamano. 
    Analizza i seguenti dati della partita e scrivi un referto tecnico dettagliato.
    LINGUA RICHIESTA: ${langMap[language]}
    Partita: ${match.homeTeamName} vs ${match.awayTeamName}
    Categoria: ${match.category}
    Risultato: ${match.score.home} - ${match.score.away}
    Data: ${match.date}

    Eventi Cronologici:
    ${eventsSummary}
    
    Il referto deve includere: 
    1. Riassunto dell'andamento (chi ha dominato, rimonte, etc).
    2. Migliori marcatori e migliori portieri (basandoti sulle parate registrate).
    3. Analisi della precisione al tiro (considerando i Gol vs Tiri Fuori).
    4. Analisi del controllo palla (commenta le Palle Perse registrate).
    5. Analisi disciplina (staff incluso, sanzioni e 2 minuti).
    6. Commento tattico finale e prospettive per le squadre.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || "Report error.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Error generating report.";
  }
};
