
export enum EventType {
  GOAL = 'GOAL',
  YELLOW_CARD = 'YELLOW_CARD',
  RED_CARD = 'RED_CARD',
  BLUE_CARD = 'BLUE_CARD',
  TWO_MINUTES = 'TWO_MINUTES',
  MISS = 'MISS',
  SAVE = 'SAVE',
  TIMEOUT = 'TIMEOUT',
  LOST_BALL = 'LOST_BALL'
}

export enum HandballRole {
  PORTIERE = 'Portiere',
  PIVOT = 'Pivot',
  CENTRALE = 'Centrale',
  TERZINO_DESTRO = 'Terzino Destro',
  TERZINO_SINISTRO = 'Terzino Sinistro',
  ALA_DESTRA = 'Ala Destra',
  ALA_SINISTRA = 'Ala Sinistra',
  ND = 'N.D.'
}

export enum UserRole {
  ADMIN = 'ADMIN',
  OFFICIAL = 'OFFICIAL',
  GUEST = 'GUEST'
}

export type Language = 'it' | 'en' | 'fr' | 'de' | 'es';

export interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  society: string;
  role: UserRole;
  pin?: string;
  language?: Language;
}

export interface Player {
  id: string;
  firstName: string;
  lastName: string;
  number: string;
  role?: string; 
}

export interface TeamProfile {
  teamName: string;
  coachName: string;
  assistantCoachName?: string;
  category: string;
  players: Player[];
  logo?: string; // Base64 string o URL
}

export interface MatchEvent {
  id: string;
  type: EventType;
  playerId: string;
  playerName: string;
  team: 'HOME' | 'AWAY';
  timestamp: number;
  gameTime: string;
  duration?: number;
  isStaff?: boolean;
}

export interface Match {
  id: string;
  date: string;
  category: string;
  homeTeamName: string;
  awayTeamName: string;
  homeLogo?: string;
  awayLogo?: string;
  homeCoach?: string;
  awayCoach?: string;
  homeAssistantCoach?: string;
  awayAssistantCoach?: string;
  homeRoster: Player[];
  awayRoster: Player[];
  homeStaff: Player[];
  awayStaff: Player[];
  events: MatchEvent[];
  isFinished: boolean;
  currentTime?: number; 
  currentPeriod?: number; 
  score: {
    home: number;
    away: number;
  };
}

export interface ScheduledMatch {
  id: string;
  date: string;
  time: string;
  homeTeam: string;
  awayTeam: string;
  category: string;
}

export interface TrainingEvaluation {
  playerId: string;
  playerName: string;
  isPresent: boolean;
  role: HandballRole | string;
  rating: number; // 1-5 stars
  notes: string;
}

export interface TrainingSession {
  id: string;
  date: string;
  category: string;
  evaluations: TrainingEvaluation[];
  summary?: string;
}
