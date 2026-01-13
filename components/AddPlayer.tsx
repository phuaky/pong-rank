'use client';

import React, { useState } from 'react';
import { Button } from './Button';
import { Input } from './Input';
import { addPlayer } from '@/lib/dataService';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';

interface AddPlayerProps {
  onPlayerAdded: () => void;
  onCancel: () => void;
}

export const AddPlayer: React.FC<AddPlayerProps> = ({ onPlayerAdded, onCancel }) => {
  const { user, getToken } = useAuth();
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [txStatus, setTxStatus] = useState<'idle' | 'pending' | 'confirmed'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError('Name is required');
      return;
    }

    if (!user) {
      setError('You must be signed in to add players');
      return;
    }
    
    setIsSubmitting(true);
    setTxStatus('pending');
    setError(null);
    
    try {
      const token = await getToken();
      if (!token) {
        throw new Error('Failed to get authentication token');
      }

      await addPlayer(name, token);
      setTxStatus('confirmed');
      
      // Brief delay to show confirmation
      setTimeout(() => {
        onPlayerAdded();
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to create player. Please try again.');
      setTxStatus('idle');
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center bg-white rounded-2xl shadow-sm">
        <XCircle className="w-12 h-12 text-gray-300 mb-4" />
        <p className="text-gray-600 mb-4">You need to sign in to add players.</p>
        <Button onClick={onCancel}>Go Back</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <h2 className="text-xl font-bold text-gray-900 mb-6">New Player</h2>
      
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input 
          label="Player Name" 
          placeholder="e.g. Forrest Gump" 
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setError(null);
          }}
          autoFocus
          disabled={isSubmitting}
        />
        
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm flex items-center gap-2">
            <XCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        {txStatus === 'confirmed' && (
          <div className="bg-emerald-50 text-emerald-600 p-3 rounded-lg text-sm flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            Player registered on blockchain!
          </div>
        )}
        
        <div className="bg-emerald-50 p-4 rounded-xl text-emerald-800 text-sm">
          <p>New players start with a rating of <strong>1200 Elo</strong>.</p>
        </div>

        {txStatus === 'pending' && (
          <div className="bg-blue-50 p-4 rounded-xl text-center">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600 mx-auto mb-2" />
            <p className="text-sm text-blue-700">Registering player on Sepolia blockchain...</p>
            <p className="text-xs text-blue-500">This may take a few seconds</p>
          </div>
        )}

        <div className="flex gap-3 mt-4">
          <Button type="button" variant="secondary" className="flex-1" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" className="flex-1 flex items-center justify-center gap-2" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {isSubmitting ? 'Creating...' : 'Create Player'}
          </Button>
        </div>
      </form>
    </div>
  );
};
