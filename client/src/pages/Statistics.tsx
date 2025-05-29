import React, { useState, useEffect, useMemo } from 'react';
import { useCollectionContext } from '@/context/CollectionContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

const Statistics: React.FC = () => {
  const { collections, getAllCollectionCards } = useCollectionContext();
  const [selectedCollectionId, setSelectedCollectionId] = useState<number | null>(
    collections.length > 0 ? collections[0].id : null
  );
  
  // Get all cards from collection context
  const allCards = useMemo(() => getAllCollectionCards(), [getAllCollectionCards]);
  
  // Get cards for the selected collection
  const collectionCards = useMemo(() => {
    if (!selectedCollectionId) return [];
    
    return allCards.filter(card => {
      // For our app structure where cards have a 'collections' array
      if (Array.isArray(card.collections)) {
        return card.collections.includes(selectedCollectionId);
      }
      return false;
    });
  }, [allCards, selectedCollectionId]);
  
  // Get selected collection
  const selectedCollection = selectedCollectionId 
    ? collections.find(c => c.id === selectedCollectionId) 
    : null;
  
  // Empty state
  if (collections.length === 0) {
    return (
      <div className="container px-4 py-4">
        <h1 className="text-2xl font-bold mb-6">Collection Statistics</h1>
        <Card>
          <CardHeader>
            <CardTitle>Loading Collections...</CardTitle>
          </CardHeader>
          <CardContent className="h-64 flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <p>Please wait while we load your collections</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // Match the screenshot layout
  return (
    <div className="container px-4 py-4">
      <h1 className="text-2xl font-bold mb-6">Collection Statistics</h1>
      
      {/* Current View Banner - matches screenshot exactly */}
      <div className="bg-purple-100 text-purple-800 p-2 rounded-md mb-6">
        <span>Current View: Loading... | Active Collection: {selectedCollection?.name || 'None'}</span>
      </div>
      
      {/* Collection Selector Buttons in light/dark styling */}
      <div className="mb-6 flex">
        {collections.map(collection => (
          <Button 
            key={collection.id}
            variant="outline"
            className={`mr-2 rounded py-1 px-4 ${selectedCollectionId === collection.id 
              ? 'bg-purple-600 hover:bg-purple-700 text-white' 
              : 'bg-gray-200 hover:bg-gray-300 text-gray-700 border-0'}`}
            onClick={() => setSelectedCollectionId(collection.id)}
          >
            {collection.name}
          </Button>
        ))}
      </div>
      
      {/* Empty Collection View - exact card match to screenshot */}
      <div className="border border-gray-200 rounded-lg shadow-sm">
        <div className="border-b p-4">
          <h2 className="text-xl font-medium">Empty Collection</h2>
          <p className="text-sm text-gray-500">
            Add cards to your collection to see detailed statistics
          </p>
        </div>
        <div className="p-16">
          <div className="text-center text-gray-500">
            <p className="text-lg font-medium mb-2">This collection is empty</p>
            <p className="text-sm mb-2">Add cards via the Set Browser or Search</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Statistics;