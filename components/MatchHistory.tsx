import React from 'react';
import { Match, Player } from '../types';
import { Calendar, Users, TrendingUp } from 'lucide-react';

interface MatchHistoryProps {
  matches: Match[];
  players: Player[];
}

export const MatchHistory: React.FC<MatchHistoryProps> = ({ matches, players }) => {
  const getPlayerName = (id: string) => players.find(p => p.id === id)?.name || 'Unknown';

  if (!matches || matches.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center px-4">
        <Calendar className="w-12 h-12 text-gray-300 mb-3" />
        <h3 className="text-lg font-medium text-gray-900">No Matches Yet</h3>
        <p className="text-gray-500">Log your first match to see history here.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 pb-20">
      {matches.map((match) => {
        const date = new Date(match.date).toLocaleDateString(undefined, {
          month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });
        
        // Defensive coding: ensure ids are arrays before mapping
        const winnerIds = Array.isArray(match.winnerIds) ? match.winnerIds : [];
        const loserIds = Array.isArray(match.loserIds) ? match.loserIds : [];

        const winners = winnerIds.map(getPlayerName).join(' & ');
        const losers = loserIds.map(getPlayerName).join(' & ');

        return (
          <div key={match.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex justify-between items-start mb-3">
              <div className="text-xs font-medium text-gray-400 uppercase tracking-wide flex items-center gap-1.5">
                <Calendar className="w-3 h-3" />
                {date}
              </div>
              <div className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
                {match.type === 'DOUBLES' ? 'Doubles' : 'Singles'}
              </div>
            </div>

            <div className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <div className="font-semibold text-gray-900 truncate">{winners}</div>
                  <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="font-normal text-gray-500 truncate">{losers}</div>
                  <div className="w-2 h-2 rounded-full bg-red-400 shrink-0"></div>
                </div>
              </div>

              <div className="text-right shrink-0">
                <div className="text-lg font-bold text-gray-900">{match.score}</div>
                <div className="text-xs font-medium text-emerald-600 flex items-center justify-end gap-1">
                  <TrendingUp className="w-3 h-3" />
                  {match.eloChange} Elo
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};