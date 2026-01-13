'use client';

import React, { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { Leaderboard } from '@/components/Leaderboard';
import { MatchHistory } from '@/components/MatchHistory';
import { EloExplainer } from '@/components/EloExplainer';
import { LogMatch } from '@/components/LogMatch';
import { AddPlayer } from '@/components/AddPlayer';
import { fetchData, getPlayers, getMatches } from '@/lib/dataService';
import { Tab, Player, Match } from '@/types';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';

export default function Home() {
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('leaderboard');
  const [players, setPlayers] = useState<Player[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Modal states
  const [isLogMatchOpen, setIsLogMatchOpen] = useState(false);
  const [isAddPlayerOpen, setIsAddPlayerOpen] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await fetchData();
      setPlayers(data.players);
      setMatches(data.matches);
    } catch (error) {
      console.error("Failed to load data", error);
      // Fallback to local cache if fetch fails but cache exists
      setPlayers(getPlayers());
      setMatches(getMatches());
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Only load data when auth is ready
    if (!authLoading) {
      loadData();
    }
  }, [authLoading]);

  const handleMatchLogged = () => {
    // Refresh data after match is logged
    setPlayers(getPlayers());
    setMatches(getMatches());
    setIsLogMatchOpen(false);
    setActiveTab('leaderboard');
    // Also fetch fresh data from server
    loadData();
  };

  const handlePlayerAdded = () => {
    setPlayers(getPlayers());
    setIsAddPlayerOpen(false);
    // Also fetch fresh data from server
    loadData();
  };

  // Full Screen Modals
  if (isLogMatchOpen) {
    return (
      <div className="fixed inset-0 bg-gray-50 z-50 flex flex-col max-w-md mx-auto shadow-2xl">
        <div className="flex-1 p-6 overflow-hidden min-h-0">
          <LogMatch 
            players={players} 
            onMatchLogged={handleMatchLogged} 
            onCancel={() => setIsLogMatchOpen(false)} 
          />
        </div>
      </div>
    );
  }

  if (isAddPlayerOpen) {
    return (
      <div className="fixed inset-0 bg-gray-50 z-50 flex flex-col max-w-md mx-auto shadow-2xl">
        <div className="flex-1 p-6 overflow-hidden min-h-0">
          <AddPlayer 
            onPlayerAdded={handlePlayerAdded} 
            onCancel={() => setIsAddPlayerOpen(false)} 
          />
        </div>
      </div>
    );
  }

  return (
    <Layout 
      activeTab={activeTab} 
      onTabChange={setActiveTab}
      onOpenAddPlayer={() => setIsAddPlayerOpen(true)}
      onOpenLogMatch={() => setIsLogMatchOpen(true)}
    >
      {(isLoading || authLoading) && players.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-emerald-600">
          <Loader2 className="w-8 h-8 animate-spin mb-2" />
          <p className="text-sm font-medium">
            {authLoading ? 'Checking authentication...' : 'Loading data...'}
          </p>
        </div>
      ) : (
        <>
          {activeTab === 'leaderboard' && <Leaderboard players={players} />}
          {activeTab === 'history' && <MatchHistory matches={matches} players={players} />}
          {activeTab === 'info' && <EloExplainer />}
        </>
      )}
    </Layout>
  );
}
