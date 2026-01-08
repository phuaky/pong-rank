import React, { ReactNode } from 'react';
import { Tab } from '../types';
import { Trophy, History, PlusCircle, Info, UserPlus } from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  onOpenAddPlayer: () => void;
  onOpenLogMatch: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ 
  children, 
  activeTab, 
  onTabChange, 
  onOpenAddPlayer,
  onOpenLogMatch
}) => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col max-w-md mx-auto shadow-2xl overflow-hidden relative">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <div className="bg-emerald-600 text-white p-1.5 rounded-lg">
            <Trophy className="w-5 h-5" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">PongRank</h1>
        </div>
        <div className="flex items-center gap-1">
          <button 
            onClick={onOpenAddPlayer}
            className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-full transition-colors"
            aria-label="Add Player"
          >
            <UserPlus className="w-6 h-6" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto px-4 py-6 no-scrollbar relative">
        {children}
      </main>

      {/* Floating Action Button (FAB) for logging match */}
      <div className="absolute bottom-24 right-6 z-20">
        <button 
          onClick={onOpenLogMatch}
          className="bg-emerald-600 hover:bg-emerald-700 text-white p-4 rounded-full shadow-lg shadow-emerald-600/30 transition-all active:scale-95 flex items-center justify-center"
        >
          <PlusCircle className="w-8 h-8" />
        </button>
      </div>

      {/* Bottom Navigation */}
      <nav className="bg-white border-t border-gray-200 px-6 py-3 flex justify-between items-center pb-safe sticky bottom-0 z-10">
        <button 
          onClick={() => onTabChange('leaderboard')}
          className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'leaderboard' ? 'text-emerald-600' : 'text-gray-400 hover:text-gray-600'}`}
        >
          <Trophy className="w-6 h-6" />
          <span className="text-[10px] font-medium uppercase tracking-wide">Rankings</span>
        </button>
        
        <button 
          onClick={() => onTabChange('history')}
          className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'history' ? 'text-emerald-600' : 'text-gray-400 hover:text-gray-600'}`}
        >
          <History className="w-6 h-6" />
          <span className="text-[10px] font-medium uppercase tracking-wide">History</span>
        </button>

        <button 
          onClick={() => onTabChange('info')}
          className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'info' ? 'text-emerald-600' : 'text-gray-400 hover:text-gray-600'}`}
        >
          <Info className="w-6 h-6" />
          <span className="text-[10px] font-medium uppercase tracking-wide">Rules</span>
        </button>
      </nav>
    </div>
  );
};