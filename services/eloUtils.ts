import { Player } from '../types';

const K_FACTOR = 32;

export const calculateEloChange = (
  winnerElos: number[],
  loserElos: number[]
): number => {
  // Calculate average Elo for teams (even if single player)
  const avgWinnerElo = winnerElos.reduce((a, b) => a + b, 0) / winnerElos.length;
  const avgLoserElo = loserElos.reduce((a, b) => a + b, 0) / loserElos.length;

  // Calculate expected score for the winner
  // ExpectedA = 1 / (1 + 10^((eloB - eloA) / 400))
  const exponent = (avgLoserElo - avgWinnerElo) / 400;
  const expectedWinner = 1 / (1 + Math.pow(10, exponent));

  // Calculate change
  // change = round(K * (1 - expected))
  const change = Math.round(K_FACTOR * (1 - expectedWinner));

  return change;
};

export const getNewPlayerStats = (
  player: Player,
  isWinner: boolean,
  eloChange: number
): Player => {
  return {
    ...player,
    elo: player.elo + (isWinner ? eloChange : -eloChange),
    wins: player.wins + (isWinner ? 1 : 0),
    losses: player.losses + (isWinner ? 0 : 1),
  };
};