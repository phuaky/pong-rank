import React, { useState } from 'react';
import { Button } from './Button';
import { Input } from './Input';
import { addPlayer } from '../services/dataService';
import { Loader2 } from 'lucide-react';

interface AddPlayerProps {
  onPlayerAdded: () => void;
  onCancel: () => void;
}

export const AddPlayer: React.FC<AddPlayerProps> = ({ onPlayerAdded, onCancel }) => {
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Name is required');
      return;
    }
    
    setIsSubmitting(true);
    try {
      await addPlayer(name);
      onPlayerAdded();
    } catch (err) {
      setError("Failed to create player. Check your internet connection.");
      setIsSubmitting(false);
    }
  };

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
        {error && <p className="text-red-500 text-sm">{error}</p>}
        
        <div className="bg-emerald-50 p-4 rounded-xl text-emerald-800 text-sm">
          <p>New players start with a rating of <strong>1200 Elo</strong>.</p>
        </div>

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