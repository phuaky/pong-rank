'use client';

import { Player, Match, MatchType, ApiResponse, PlayersResponse, MatchesResponse } from '@/types';

// Local cache for optimistic updates
let cachedPlayers: Player[] = [];
let cachedMatches: Match[] = [];

/**
 * Helper to make authenticated API calls
 */
async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {},
  token?: string | null
): Promise<ApiResponse<T>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(endpoint, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Request failed');
    }

    return data;
  } catch (error) {
    console.error('API call failed:', error);
    throw error;
  }
}

/**
 * Fetch all data (players and matches)
 */
export async function fetchData(): Promise<{ players: Player[]; matches: Match[] }> {
  try {
    const [playersRes, matchesRes] = await Promise.all([
      apiCall<PlayersResponse>('/api/players'),
      apiCall<MatchesResponse>('/api/matches'),
    ]);

    const players = playersRes.data?.players || [];
    const matches = matchesRes.data?.matches || [];

    // Update cache
    cachedPlayers = players;
    cachedMatches = matches;

    return { players, matches };
  } catch (error) {
    console.error('Failed to fetch data:', error);
    // Return cache on error
    return { players: cachedPlayers, matches: cachedMatches };
  }
}

/**
 * Get cached players
 */
export function getPlayers(): Player[] {
  return cachedPlayers;
}

/**
 * Get cached matches
 */
export function getMatches(): Match[] {
  return cachedMatches;
}

/**
 * Add a new player
 */
export async function addPlayer(
  name: string,
  token: string
): Promise<Player> {
  const response = await apiCall<{ player: Player }>(
    '/api/players',
    {
      method: 'POST',
      body: JSON.stringify({ name }),
    },
    token
  );

  const newPlayer = response.data?.player;
  if (!newPlayer) {
    throw new Error('Failed to create player');
  }

  // Update cache
  cachedPlayers = [...cachedPlayers, newPlayer];

  return newPlayer;
}

/**
 * Log a match
 */
export async function logMatch(
  type: MatchType,
  winnerIds: string[],
  loserIds: string[],
  score: string,
  token: string
): Promise<Match> {
  const response = await apiCall<{ match: Match }>(
    '/api/matches',
    {
      method: 'POST',
      body: JSON.stringify({ type, winnerIds, loserIds, score }),
    },
    token
  );

  const newMatch = response.data?.match;
  if (!newMatch) {
    throw new Error('Failed to log match');
  }

  // Update cache optimistically
  cachedMatches = [...cachedMatches, newMatch];

  // Update player stats in cache
  cachedPlayers = cachedPlayers.map(player => {
    if (winnerIds.includes(player.id)) {
      return {
        ...player,
        elo: player.elo + newMatch.eloChange,
        wins: player.wins + 1,
      };
    }
    if (loserIds.includes(player.id)) {
      return {
        ...player,
        elo: player.elo - newMatch.eloChange,
        losses: player.losses + 1,
      };
    }
    return player;
  });

  return newMatch;
}

/**
 * Clear cache (useful for logout)
 */
export function clearCache(): void {
  cachedPlayers = [];
  cachedMatches = [];
}
