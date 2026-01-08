import { Match, Player } from '../types';
import { calculateEloChange, getNewPlayerStats } from './eloUtils';

const STORAGE_KEY = 'pongrank_api_url';

// API URL from environment variable (set at build time) or localStorage
const DEFAULT_API_URL = import.meta.env.VITE_API_URL || '';

// Load from storage or use default from env
let API_URL = localStorage.getItem(STORAGE_KEY) || DEFAULT_API_URL;

// Local memory cache for optimistic updates and read access
let cachedPlayers: Player[] = [];
let cachedMatches: Match[] = [];

// Check if API URL is available
export const hasApiUrl = () => !!API_URL;

// Get current API URL
export const getApiUrl = () => API_URL;

// Set API URL
export const setApiUrl = (url: string) => {
  API_URL = url;
  localStorage.setItem(STORAGE_KEY, url);
};

export const fetchData = async (): Promise<{players: Player[], matches: Match[]}> => {
  if (!API_URL) {
      throw new Error("API URL is not configured");
  }

  try {
    const res = await fetch(`${API_URL}?action=getData`);
    if (!res.ok) throw new Error('Network response was not ok');
    const data = await res.json();
    
    // Validate and Clean Data
    const validPlayers = Array.isArray(data.players) ? data.players.map((p: any) => ({
      ...p,
      elo: typeof p.elo === 'number' ? p.elo : Number(p.elo) || 1200,
      wins: typeof p.wins === 'number' ? p.wins : Number(p.wins) || 0,
      losses: typeof p.losses === 'number' ? p.losses : Number(p.losses) || 0,
    })) : [];

    const validMatches = Array.isArray(data.matches) ? data.matches.map((m: any) => ({
      ...m,
      winnerIds: Array.isArray(m.winnerIds) ? m.winnerIds : [],
      loserIds: Array.isArray(m.loserIds) ? m.loserIds : [],
      eloChange: typeof m.eloChange === 'number' ? m.eloChange : Number(m.eloChange) || 0,
    })) : [];
    
    // Update cache
    cachedPlayers = validPlayers;
    cachedMatches = validMatches;
    
    return { players: cachedPlayers, matches: cachedMatches };
  } catch (error) {
    console.error("Failed to fetch data:", error);
    throw error;
  }
};

// Helper to push full state to backend
const syncData = async (players: Player[], matches: Match[]) => {
  if (!API_URL) throw new Error("API URL is not configured");

  // Optimistically update cache
  cachedPlayers = players;
  cachedMatches = matches;

  // Send to backend
  await fetch(API_URL, {
    method: 'POST',
    body: JSON.stringify({ players, matches }),
  });
};

export const getPlayers = (): Player[] => {
  return cachedPlayers;
};

export const getMatches = (): Match[] => {
  return cachedMatches;
};

export const addPlayer = async (name: string): Promise<Player> => {
  const newPlayer: Player = {
    id: crypto.randomUUID(),
    name: name.trim(),
    elo: 1200,
    wins: 0,
    losses: 0,
    createdAt: new Date().toISOString(),
  };
  
  const updatedPlayers = [...cachedPlayers, newPlayer];
  await syncData(updatedPlayers, cachedMatches);
  return newPlayer;
};

export const logMatch = async (
  type: 'SINGLES' | 'DOUBLES',
  winnerIds: string[],
  loserIds: string[],
  score: string
): Promise<Match> => {
  // 1. Get current stats from cache
  const currentPlayers = [...cachedPlayers];
  const winners = currentPlayers.filter(p => winnerIds.includes(p.id));
  const losers = currentPlayers.filter(p => loserIds.includes(p.id));
  
  if (winners.length === 0 || losers.length === 0) {
    throw new Error("Invalid players selected");
  }

  // 2. Calculate Elo
  const winnerElos = winners.map(p => p.elo);
  const loserElos = losers.map(p => p.elo);
  const eloChange = calculateEloChange(winnerElos, loserElos);

  // 3. Create Match
  const newMatch: Match = {
    id: crypto.randomUUID(),
    date: new Date().toISOString(),
    type,
    winnerIds,
    loserIds,
    score,
    eloChange,
  };

  // 4. Update Players locally
  const updatedPlayers = currentPlayers.map(p => {
    if (winnerIds.includes(p.id)) {
      return getNewPlayerStats(p, true, eloChange);
    }
    if (loserIds.includes(p.id)) {
      return getNewPlayerStats(p, false, eloChange);
    }
    return p;
  });

  // 5. Sync
  // Prepend match to history
  const updatedMatches = [newMatch, ...cachedMatches];
  await syncData(updatedPlayers, updatedMatches);

  return newMatch;
};