import React from 'react';
import { Player } from '../types';
import { Trophy, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface LeaderboardProps {
  players: Player[];
}

export const Leaderboard: React.FC<LeaderboardProps> = ({ players }) => {
  const sortedPlayers = [...players].sort((a, b) => b.elo - a.elo);

  if (players.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center px-4">
        <Trophy className="w-12 h-12 text-gray-300 mb-3" />
        <h3 className="text-lg font-medium text-gray-900">No Players Yet</h3>
        <p className="text-gray-500">Add players to start tracking the ranks!</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 pb-20">
      <div className="bg-emerald-600 p-6 rounded-2xl text-white shadow-xl shadow-emerald-200 mb-2">
        <div className="flex items-center gap-3 mb-1">
          <Trophy className="w-5 h-5 text-yellow-300" />
          <span className="text-emerald-100 font-medium text-sm uppercase tracking-wider">Current Champion</span>
        </div>
        <div className="text-3xl font-bold">{sortedPlayers[0].name}</div>
        <div className="text-emerald-100 opacity-90">{sortedPlayers[0].elo} Elo</div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider w-12 text-center">#</th>
                <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Player</th>
                <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Rating</th>
                <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">W-L</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {sortedPlayers.map((player, index) => (
                <tr key={player.id} className="hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4 text-center font-medium text-gray-400">
                    {index + 1}
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-medium text-gray-900">{player.name}</div>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md text-sm">
                      {player.elo}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right text-sm text-gray-500">
                    {player.wins}-{player.losses}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};