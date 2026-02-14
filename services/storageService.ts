
import { Match, TeamProfile, ScheduledMatch, UserProfile, UserRole, Language, TrainingSession, Collaborator, Exercise } from '../types';

const KEYS = {
  USER_PROFILE: 'hpro_user_v2',
  MATCHES: 'hpro_matches_v2',
  REGISTRIES: 'hpro_registries_v3',
  CALENDAR: 'hpro_calendar_v2',
  ACTIVE_MATCH: 'hpro_active_match_v2',
  TRAININGS: 'hpro_trainings_v1',
  COLLABORATORS: 'hpro_collaborators_v1',
  CUSTOM_EXERCISES: 'hpro_custom_exercises_v1'
};

// Utilizzo di un bucket persistente dedicato per evitare collisioni
const SYNC_URL = 'https://kvdb.io/MWq5E9k2Y5E8J3fQ2z4Z6y/'; 

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
      id: Math.random().toString(36).substr(2, 9).toUpperCase(),
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
      list[index] = { ...list[index], ...collab, deviceType, lastActive: Date.now() };
    } else {
      list.push({ ...collab, joinedAt: new Date().toISOString(), lastActive: Date.now(), deviceType });
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

  getLanguage: (): Language => storage.getUser().language || 'it',

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
    if (match) localStorage.setItem(KEYS.ACTIVE_MATCH, JSON.stringify(match));
    else localStorage.removeItem(KEYS.ACTIVE_MATCH);
  },

  // Matches History
  getMatches: (): Match[] => {
    const saved = localStorage.getItem(KEYS.MATCHES);
    return saved ? JSON.parse(saved) : [];
  },
  saveMatch: (match: Match) => {
    const matches = storage.getMatches();
    const index = matches.findIndex(m => m.id === match.id);
    if (index > -1) matches[index] = match;
    else matches.unshift(match);
    localStorage.setItem(KEYS.MATCHES, JSON.stringify(matches));
    if (match.isFinished) storage.setActiveMatch(null);
  },
  deleteMatch: (id: string) => {
    const matches = storage.getMatches().filter(m => m.id !== id);
    localStorage.setItem(KEYS.MATCHES, JSON.stringify(matches));
  },

  // Team Registries
  getAllRegistries: (): TeamProfile[] => {
    const saved = localStorage.getItem(KEYS.REGISTRIES);
    return saved ? JSON.parse(saved) : [];
  },
  getRegistryByCategory: (category: string): TeamProfile | null => {
    const all = storage.getAllRegistries();
    return all.find(r => r.category.toUpperCase() === category.toUpperCase()) || null;
  },
  saveRegistry: (reg: TeamProfile) => {
    const all = storage.getAllRegistries();
    const index = all.findIndex(r => r.category.toUpperCase() === reg.category.toUpperCase());
    if (index > -1) all[index] = reg;
    else all.push(reg);
    localStorage.setItem(KEYS.REGISTRIES, JSON.stringify(all));
  },
  deleteRegistry: (category: string) => {
    const all = storage.getAllRegistries().filter(r => r.category.toUpperCase() !== category.toUpperCase());
    localStorage.setItem(KEYS.REGISTRIES, JSON.stringify(all));
  },

  // Training Sessions
  getTrainings: (): TrainingSession[] => {
    const saved = localStorage.getItem(KEYS.TRAININGS);
    return saved ? JSON.parse(saved) : [];
  },
  saveTraining: (session: TrainingSession) => {
    const sessions = storage.getTrainings();
    const index = sessions.findIndex(s => s.id === session.id);
    if (index > -1) sessions[index] = session;
    else sessions.unshift(session);
    localStorage.setItem(KEYS.TRAININGS, JSON.stringify(sessions));
  },
  deleteTraining: (id: string) => {
    const sessions = storage.getTrainings().filter(s => s.id !== id);
    localStorage.setItem(KEYS.TRAININGS, JSON.stringify(sessions));
  },

  // Custom Exercises
  getCustomExercises: (): Exercise[] => {
    const saved = localStorage.getItem(KEYS.CUSTOM_EXERCISES);
    return saved ? JSON.parse(saved) : [];
  },
  saveCustomExercise: (ex: Exercise) => {
    const all = storage.getCustomExercises();
    all.push(ex);
    localStorage.setItem(KEYS.CUSTOM_EXERCISES, JSON.stringify(all));
  },

  // Calendar
  getCalendar: (): ScheduledMatch[] => {
    const saved = localStorage.getItem(KEYS.CALENDAR);
    return saved ? JSON.parse(saved) : [];
  },
  setCalendar: (cal: ScheduledMatch[]) => localStorage.setItem(KEYS.CALENDAR, JSON.stringify(cal)),

  // Cloud Sync Improved with PIN Security
  pushToCloud: async (userId: string): Promise<{success: boolean, error?: string}> => {
    try {
      const user = storage.getUser();
      const data = {
        matches: storage.getMatches(),
        registries: storage.getAllRegistries(),
        calendar: storage.getCalendar(),
        trainings: storage.getTrainings(),
        customExercises: storage.getCustomExercises(),
        exportedAt: new Date().toISOString(),
        securityPin: user.pin || '0000', // Include current PIN for authentication on other devices
        userData: {
          firstName: user.firstName,
          lastName: user.lastName,
          society: user.society,
          position: user.position,
          role: user.role
        }
      };
      
      const payload = JSON.stringify(data);
      // Controllo dimensione approssimativa (64KB limite tipico KV free)
      if (payload.length > 65536) {
        return { success: false, error: "Database troppo grande per la sincronizzazione cloud (Max 64KB)." };
      }

      const response = await fetch(`${SYNC_URL}${userId.trim()}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: payload
      });

      if (!response.ok) {
        return { success: false, error: `Errore Server: ${response.status}` };
      }

      return { success: true };
    } catch (e) {
      console.error("Cloud push error", e);
      return { success: false, error: "Errore di rete. Controlla la connessione." };
    }
  },

  pullFromCloud: async (userId: string, pin: string): Promise<{success: boolean, error?: string}> => {
    try {
      const response = await fetch(`${SYNC_URL}${userId.trim()}`);
      if (!response.ok) {
        return { success: false, error: "ID Sorgente non trovato." };
      }
      
      const text = await response.text();
      if (!text || text === "null") return { success: false, error: "Nessun dato salvato per questo ID." };
      
      const data = JSON.parse(text);
      
      // Verification of security PIN
      const storedPin = data.securityPin || '0000';
      if (storedPin !== pin) {
        return { success: false, error: "PIN di sicurezza errato per questo ID." };
      }
      
      // Update local storage
      if (data.matches) localStorage.setItem(KEYS.MATCHES, JSON.stringify(data.matches));
      if (data.registries) localStorage.setItem(KEYS.REGISTRIES, JSON.stringify(data.registries));
      if (data.calendar) storage.setCalendar(data.calendar);
      if (data.trainings) localStorage.setItem(KEYS.TRAININGS, JSON.stringify(data.trainings));
      if (data.customExercises) localStorage.setItem(KEYS.CUSTOM_EXERCISES, JSON.stringify(data.customExercises));
      
      // Optional: Restore user profile too (excluding local device specific ID)
      if (data.userData) {
        const currentUser = storage.getUser();
        storage.setUser({
          ...currentUser,
          ...data.userData,
          pin: storedPin
        });
      }
      
      return { success: true };
    } catch (e) {
      console.error("Cloud pull error", e);
      return { success: false, error: "Errore durante il recupero dei dati. ID non valido?" };
    }
  },

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
      customExercises: storage.getCustomExercises(),
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
      if (data.customExercises) localStorage.setItem(KEYS.CUSTOM_EXERCISES, JSON.stringify(data.customExercises));
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
