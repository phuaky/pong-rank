export interface Player {
  id: string;
  name: string;
  email?: string;
  photoURL?: string;
  elo: number;
  wins: number;
  losses: number;
  createdAt: string; // ISO Date string
  // Firebase UID linking
  firebaseUid?: string;
}

export type MatchType = 'SINGLES' | 'DOUBLES';

export interface Match {
  id: string;
  date: string; // ISO Date string
  type: MatchType;
  winnerIds: string[];
  loserIds: string[];
  score: string;
  eloChange: number;
  // On-chain transaction hash for verification
  txHash?: string;
}

export interface EloCalculationResult {
  winnerChange: number;
  loserChange: number;
  expectedWinProb: number;
}

export type Tab = 'leaderboard' | 'history' | 'log' | 'players' | 'info';

// Firebase User type
export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

// API response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface PlayersResponse {
  players: Player[];
}

export interface MatchesResponse {
  matches: Match[];
}

export interface LogMatchRequest {
  type: MatchType;
  winnerIds: string[];
  loserIds: string[];
  score: string;
}

export interface AddPlayerRequest {
  name: string;
  firebaseUid?: string;
  email?: string;
  photoURL?: string;
}
