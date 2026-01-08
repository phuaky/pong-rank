export interface Player {
  id: string;
  name: string;
  elo: number;
  wins: number;
  losses: number;
  createdAt: string; // ISO Date string
}

export type MatchType = 'SINGLES' | 'DOUBLES';

export interface Match {
  id: string;
  date: string; // ISO Date string
  type: MatchType;
  // Old format
  winnerIds?: string[];
  loserIds?: string[];
  score?: string;
  eloChange?: number;
  // New format from API
  teamAIds?: string[];
  teamBIds?: string[];
  winnerTeam?: 'A' | 'B';
  sets?: { teamAScore: number; teamBScore: number }[];
}

export interface EloCalculationResult {
  winnerChange: number;
  loserChange: number; // usually negative of winnerChange
  expectedWinProb: number;
}

export type Tab = 'leaderboard' | 'history' | 'log' | 'players' | 'info';