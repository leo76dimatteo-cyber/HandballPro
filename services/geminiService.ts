
import { GoogleGenAI } from "@google/genai";
import { Match, MatchEvent, EventType } from "../types";

export const generateMatchReport = async (match: Match): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const eventsSummary = match.events.map(e => {
    const typeLabel = {
      [EventType.GOAL]: 'Gol',
      [EventType.YELLOW_CARD]: 'Ammonizione',
      [EventType.RED_CARD]: 'Espulsione',
      [EventType.BLUE_CARD]: 'Cartellino Blu (Squalifica con referto)',
      [EventType.TWO_MINUTES]: '2 Minuti',
      [EventType.MISS]: 'Tiro Fuori',
      [EventType.SAVE]: 'Parata',
      [EventType.TIMEOUT]: 'Time-out'
    }[e.type];
    const durationStr = e.duration ? ` (Durata: ${e.duration} secondi)` : '';
    const staffStr = e.isStaff ? ' [AREA TECNICA/DIRIGENTE]' : '';
    return `[${e.gameTime}] ${e.team === 'HOME' ? match.homeTeamName : match.awayTeamName} - ${e.playerName}: ${typeLabel}${durationStr}${staffStr}`;
  }).join('\n');

  const prompt = `
    Sei un cronista sportivo esperto di pallamano. 
    Analizza i seguenti dati della partita e scrivi un referto tecnico dettagliato e appassionante.
    Partita: ${match.homeTeamName} vs ${match.awayTeamName}
    Categoria: ${match.category || 'Serie B'}
    Risultato Finale: ${match.score.home} - ${match.score.away}
    Data: ${match.date}

    Eventi salienti (inclusi i Time-out e le sanzioni alla panchina/area tecnica):
    ${eventsSummary}
    
    Il referto deve includere:
    1. Un riassunto dell'andamento della gara.
    2. I migliori marcatori per squadra.
    3. Analisi della disciplina: menziona esplicitamente se ci sono stati cartellini o sanzioni allo STAFF/DIRIGENTI (Ufficiali A, B, C, D) e come questo ha influenzato la partita.
    4. Commento sui Time-out e la gestione tattica delle panchine.
    5. Un commento finale sulla prestazione delle due squadre.
    Scrivi tutto in italiano professionale.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || "Impossibile generare il referto al momento.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Errore nella generazione del referto AI.";
  }
};
