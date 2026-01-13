'use client';

import React from 'react';
import { Shield, ExternalLink } from 'lucide-react';

export const EloExplainer: React.FC = () => {
  return (
    <div className="space-y-6 pb-20">
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold text-gray-900 mb-3">How it works</h3>
        <p className="text-gray-600 leading-relaxed mb-4">
          The Elo rating system calculates the relative skill levels of players.
          Everyone starts at <strong>1200</strong>.
        </p>
        <ul className="space-y-3 text-sm text-gray-600">
          <li className="flex gap-2">
            <span className="text-emerald-500 font-bold">•</span>
            <span>Beat a higher-rated player? Gain <strong>more</strong> points.</span>
          </li>
          <li className="flex gap-2">
            <span className="text-emerald-500 font-bold">•</span>
            <span>Beat a lower-rated player? Gain <strong>fewer</strong> points.</span>
          </li>
          <li className="flex gap-2">
            <span className="text-red-500 font-bold">•</span>
            <span>Lose to a lower-rated player? Lose <strong>more</strong> points.</span>
          </li>
        </ul>
      </div>

      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex items-center gap-2 mb-3">
          <Shield className="w-5 h-5" />
          <h4 className="font-bold">Blockchain Verified</h4>
        </div>
        <p className="text-blue-100 text-sm mb-4">
          All matches and ELO changes are permanently recorded on the Ethereum Sepolia testnet.
          This means your rankings can&apos;t be tampered with!
        </p>
        <a
          href="https://sepolia.etherscan.io"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm text-white/80 hover:text-white transition-colors"
        >
          <ExternalLink className="w-4 h-4" />
          View on Etherscan
        </a>
      </div>

      <div className="bg-gray-900 rounded-2xl p-6 text-gray-300 font-mono text-sm shadow-lg">
        <h4 className="text-white font-bold mb-3 font-sans">The Math</h4>
        <div className="space-y-2 opacity-80">
          <p>K = 32</p>
          <p>Expected = 1 / (1 + 10^((EloB - EloA) / 400))</p>
          <p className="text-emerald-400">Change = K * (1 - Expected)</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold text-gray-900 mb-3">Sign In with Google</h3>
        <p className="text-gray-600 leading-relaxed text-sm">
          Sign in with your Google account to add players and log matches.
          Your profile picture and name will be shown on the leaderboard.
          All blockchain transactions are handled automatically—no crypto knowledge required!
        </p>
      </div>
    </div>
  );
};
