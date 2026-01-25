
export enum EventType {
  GOAL = 'GOAL',
  YELLOW_CARD = 'YELLOW_CARD',
  RED_CARD = 'RED_CARD',
  BLUE_CARD = 'BLUE_CARD',
  TWO_MINUTES = 'TWO_MINUTES',
  MISS = 'MISS',
  SAVE = 'SAVE',
  TIMEOUT = 'TIMEOUT'
}

export enum UserRole {
  ADMIN = 'ADMIN',
  OFFICIAL = 'OFFICIAL',
  GUEST = 'GUEST'
}

export interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  society: string;
  role: UserRole;
  pin?: string;
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
