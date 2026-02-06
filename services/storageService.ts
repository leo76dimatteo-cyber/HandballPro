
import { Match, TeamProfile, ScheduledMatch, UserProfile, UserRole, Language, TrainingSession, Collaborator } from '../types';

const KEYS = {
  USER_PROFILE: 'hpro_user_v2',
  MATCHES: 'hpro_matches_v2',
  REGISTRIES: 'hpro_registries_v3',
  CALENDAR: 'hpro_calendar_v2',
  ACTIVE_MATCH: 'hpro_active_match_v2',
  TRAININGS: 'hpro_trainings_v1',
  COLLABORATORS: 'hpro_collaborators_v1'
};

const getDeviceType = (): 'Mobile' | 'Desktop' | 'Tablet' | 'Unknown' => {
  const ua = navigator.userAgent;
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) return 'Tablet';
  if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) return 'Mobile';
  return 'Desktop';
};

export const storage = {
  // User Profile
  getUser: (): UserProfile => {
    const saved = localStorage.getItem(KEYS.USER_PROFILE);
    if (saved) return JSON.parse(saved);
    return {
      id: Math.random().toString(36).substr(2, 9),
      firstName: 'Operatore',
      lastName: 'HandballPro',
      society: 'Nessuna Società',
      role: UserRole.ADMIN,
      language: 'it',
      lastActive: Date.now(),
      deviceName: getDeviceType()
    };
  },
  setUser: (user: UserProfile) => {
    const userWithActivity = { 
      ...user, 
      lastActive: Date.now(),
      deviceName: getDeviceType() 
    };
    localStorage.setItem(KEYS.USER_PROFILE, JSON.stringify(userWithActivity));
    
    // Sync to collaborators list with device metadata
    storage.syncCollaborator(userWithActivity as Collaborator);
  },

  // Collaborators Management
  getCollaborators: (): Collaborator[] => {
    const saved = localStorage.getItem(KEYS.COLLABORATORS);
    const collaborators: Collaborator[] = saved ? JSON.parse(saved) : [];
    
    return collaborators.map(c => ({
      ...c,
      isOnline: c.lastActive ? (Date.now() - c.lastActive < 300000) : false
    }));
  },

  syncCollaborator: (collab: Collaborator) => {
    const list = storage.getCollaborators();
    const deviceType = getDeviceType();
    
    const index = list.findIndex(c => c.id === collab.id);
    if (index > -1) {
      list[index] = { 
        ...list[index], 
        ...collab, 
        deviceType,
        lastActive: Date.now() 
      };
    } else {
      list.push({ 
        ...collab, 
        joinedAt: new Date().toISOString(), 
        lastActive: Date.now(),
        deviceType
      });
    }
    localStorage.setItem(KEYS.COLLABORATORS, JSON.stringify(list));
  },

  updateCollaboratorRole: (id: string, role: UserRole) => {
    const list = storage.getCollaborators();
    const index = list.findIndex(c => c.id === id);
    if (index > -1) {
      list[index].role = role;
      localStorage.setItem(KEYS.COLLABORATORS, JSON.stringify(list));
    }
  },

  removeCollaborator: (id: string) => {
    const list = storage.getCollaborators().filter(c => c.id !== id);
    localStorage.setItem(KEYS.COLLABORATORS, JSON.stringify(list));
  },

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
      collaborators: storage.getCollaborators(),
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
      if (data.collaborators) localStorage.setItem(KEYS.COLLABORATORS, JSON.stringify(data.collaborators));
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
