import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchSets } from '@/api/pokemonTCG';
import { useCollectionContext } from '@/context/CollectionContext';

interface SetProgressProps {
  collectionId: number;
}

interface SetProgress {
  id: string;
  name: string;
  collected: number;
  total: number;
  percentage: number;
}

const SetProgressBar: React.FC<SetProgressProps> = ({ collectionId }) => {
  const [progress, setProgress] = useState<SetProgress[]>([]);
  const { collection, getCollectionCards } = useCollectionContext();
  
  const { data: sets = [] } = useQuery({
    queryKey: ['/api/sets'],
    queryFn: () => fetchSets()
  });
  
  useEffect(() => {
    if (!collection || !sets.length) return;
    
    // Get all cards in the collection
    const collectionCards = getCollectionCards();
    
    // Group cards by set
    const cardsBySet: Record<string, number> = {};
    
    collectionCards.forEach(card => {
      if (card.setId) {
        if (!cardsBySet[card.setId]) {
          cardsBySet[card.setId] = 0;
        }
        cardsBySet[card.setId]++;
      }
    });
    
    // Calculate progress for each set
    const calculatedProgress: SetProgress[] = [];
    
    sets.forEach(set => {
      const collected = cardsBySet[set.id] || 0;
      
      if (collected > 0) {
        calculatedProgress.push({
          id: set.id,
          name: set.name,
          collected,
          total: set.total,
          percentage: Math.round((collected / set.total) * 100)
        });
      }
    });
    
    // Sort by most collected percentage
    calculatedProgress.sort((a, b) => b.percentage - a.percentage);
    
    // Only show top 5 sets
    setProgress(calculatedProgress.slice(0, 5));
    
  }, [collection, sets, getCollectionCards]);
  
  if (progress.length === 0) {
    return (
      <div className="text-center text-sm text-muted-foreground p-2">
        Add cards to your collection to track set progress.
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {progress.map(set => (
        <div key={set.id}>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-foreground truncate">{set.name}</span>
            <span className="text-primary font-medium">{set.collected}/{set.total}</span>
          </div>
          <div className="progress-bar-bg h-2">
            <div 
              className="progress-bar-fill" 
              style={{ width: `${set.percentage}%` }}
            ></div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default SetProgressBar;
