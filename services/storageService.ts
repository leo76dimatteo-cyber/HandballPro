
import { Match, TeamProfile, ScheduledMatch, UserProfile, UserRole, Language, TrainingSession } from '../types';

const KEYS = {
  USER_PROFILE: 'hpro_user_v2',
  MATCHES: 'hpro_matches_v2',
  REGISTRIES: 'hpro_registries_v3',
  CALENDAR: 'hpro_calendar_v2',
  ACTIVE_MATCH: 'hpro_active_match_v2',
  TRAININGS: 'hpro_trainings_v1'
};

export const storage = {
  // User Profile
  getUser: (): UserProfile => {
    const saved = localStorage.getItem(KEYS.USER_PROFILE);
    if (saved) return JSON.parse(saved);
    return {
      id: 'default',
      firstName: 'Operatore',
      lastName: 'HandballPro',
      society: 'Nessuna Società',
      role: UserRole.ADMIN,
      language: 'it'
    };
  },
  setUser: (user: UserProfile) => localStorage.setItem(KEYS.USER_PROFILE, JSON.stringify(user)),

  getLanguage: (): Language => {
    return storage.getUser().language || 'it';
  },

  setLanguage: (lang: Language) => {
    const user = storage.getUser();
    storage.setUser({ ...user, language: lang });
  },

  // Active Match
  getActiveMatch: (): Match | null => {
    const saved = localStorage.getItem(KEYS.ACTIVE_MATCH);
    return saved ? JSON.parse(saved) : null;
  },
  setActiveMatch: (match: Match | null) => {
    if (match) {
      localStorage.setItem(KEYS.ACTIVE_MATCH, JSON.stringify(match));
    } else {
      localStorage.removeItem(KEYS.ACTIVE_MATCH);
    }
  },

  // Matches History
  getMatches: (): Match[] => {
    const saved = localStorage.getItem(KEYS.MATCHES);
    return saved ? JSON.parse(saved) : [];
  },
  saveMatch: (match: Match) => {
    const matches = storage.getMatches();
    const index = matches.findIndex(m => m.id === match.id);
    if (index > -1) {
      matches[index] = match;
    } else {
      matches.unshift(match);
    }
    localStorage.setItem(KEYS.MATCHES, JSON.stringify(matches));
    if (match.isFinished) {
      storage.setActiveMatch(null);
    }
  },
  deleteMatch: (id: string) => {
    const matches = storage.getMatches().filter(m => m.id !== id);
    localStorage.setItem(KEYS.MATCHES, JSON.stringify(matches));
  },

  // Team Registries
  getAllRegistries: (): TeamProfile[] => {
    const saved = localStorage.getItem(KEYS.REGISTRIES);
    if (!saved) return [];
    return JSON.parse(saved);
  },

  getRegistryByCategory: (category: string): TeamProfile | null => {
    const all = storage.getAllRegistries();
    return all.find(r => r.category.toUpperCase() === category.toUpperCase()) || null;
  },

  saveRegistry: (reg: TeamProfile) => {
    const all = storage.getAllRegistries();
    const index = all.findIndex(r => r.category.toUpperCase() === reg.category.toUpperCase());
    if (index > -1) {
      all[index] = reg;
    } else {
      all.push(reg);
    }
    localStorage.setItem(KEYS.REGISTRIES, JSON.stringify(all));
  },

  deleteRegistry: (category: string) => {
    const all = storage.getAllRegistries().filter(r => r.category.toUpperCase() !== category.toUpperCase());
    localStorage.setItem(KEYS.REGISTRIES, JSON.stringify(all));
  },

  getRegistry: (): TeamProfile => {
    const all = storage.getAllRegistries();
    return all[0] || { teamName: '', coachName: '', category: 'Serie B', players: [] };
  },

  // Training Sessions
  getTrainings: (): TrainingSession[] => {
    const saved = localStorage.getItem(KEYS.TRAININGS);
    return saved ? JSON.parse(saved) : [];
  },
  saveTraining: (session: TrainingSession) => {
    const sessions = storage.getTrainings();
    const index = sessions.findIndex(s => s.id === session.id);
    if (index > -1) {
      sessions[index] = session;
    } else {
      sessions.unshift(session);
    }
    localStorage.setItem(KEYS.TRAININGS, JSON.stringify(sessions));
  },
  deleteTraining: (id: string) => {
    const sessions = storage.getTrainings().filter(s => s.id !== id);
    localStorage.setItem(KEYS.TRAININGS, JSON.stringify(sessions));
  },

  // Calendar
  getCalendar: (): ScheduledMatch[] => {
    const saved = localStorage.getItem(KEYS.CALENDAR);
    return saved ? JSON.parse(saved) : [];
  },
  setCalendar: (cal: ScheduledMatch[]) => localStorage.setItem(KEYS.CALENDAR, JSON.stringify(cal)),

  // Data management
  exportData: (data: any, filename: string) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  },

  exportAll: () => {
    const data = {
      user: storage.getUser(),
      matches: storage.getMatches(),
      registries: storage.getAllRegistries(),
      calendar: storage.getCalendar(),
      trainings: storage.getTrainings(),
      exportedAt: new Date().toISOString()
    };
    storage.exportData(data, 'HandballPro_FullBackup');
  },

  importAll: async (file: File): Promise<boolean> => {
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (data.user) storage.setUser(data.user);
      if (data.matches) localStorage.setItem(KEYS.MATCHES, JSON.stringify(data.matches));
      if (data.registries) localStorage.setItem(KEYS.REGISTRIES, JSON.stringify(data.registries));
      if (data.calendar) storage.setCalendar(data.calendar);
      if (data.trainings) localStorage.setItem(KEYS.TRAININGS, JSON.stringify(data.trainings));
      return true;
    } catch (e) {
      console.error("Errore importazione", e);
      return false;
    }
  },

  clearAll: () => {
    Object.values(KEYS).forEach(k => localStorage.removeItem(k));
  }
};
