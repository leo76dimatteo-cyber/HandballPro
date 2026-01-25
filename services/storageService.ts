
import { Match, TeamProfile, ScheduledMatch, UserProfile, UserRole } from '../types';

const KEYS = {
  USER_PROFILE: 'hpro_user_v2',
  MATCHES: 'hpro_matches_v2',
  REGISTRY: 'hpro_registry_v2',
  CALENDAR: 'hpro_calendar_v2'
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
      role: UserRole.GUEST
    };
  },
  setUser: (user: UserProfile) => localStorage.setItem(KEYS.USER_PROFILE, JSON.stringify(user)),

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
  },
  deleteMatch: (id: string) => {
    const matches = storage.getMatches().filter(m => m.id !== id);
    localStorage.setItem(KEYS.MATCHES, JSON.stringify(matches));
  },

  // Team Registry
  getRegistry: (): TeamProfile => {
    const saved = localStorage.getItem(KEYS.REGISTRY);
    return saved ? JSON.parse(saved) : { teamName: '', coachName: '', category: 'Serie B', players: [] };
  },
  setRegistry: (reg: TeamProfile) => localStorage.setItem(KEYS.REGISTRY, JSON.stringify(reg)),

  // Calendar
  getCalendar: (): ScheduledMatch[] => {
    const saved = localStorage.getItem(KEYS.CALENDAR);
    return saved ? JSON.parse(saved) : [];
  },
  setCalendar: (cal: ScheduledMatch[]) => localStorage.setItem(KEYS.CALENDAR, JSON.stringify(cal)),

  // Backup & Export
  exportAll: () => {
    const data = {
      user: storage.getUser(),
      matches: storage.getMatches(),
      registry: storage.getRegistry(),
      calendar: storage.getCalendar(),
      exportedAt: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `HandballPro_Backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  },

  importAll: async (file: File): Promise<boolean> => {
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (data.user) storage.setUser(data.user);
      if (data.matches) localStorage.setItem(KEYS.MATCHES, JSON.stringify(data.matches));
      if (data.registry) storage.setRegistry(data.registry);
      if (data.calendar) storage.setCalendar(data.calendar);
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
