import React, { useState, useMemo } from 'react';
import { useCollectionContext } from '@/context/CollectionContext';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area 
} from 'recharts';

const StatisticsNew: React.FC = () => {
  const { collections, getAllCollectionCards, setActiveCollection } = useCollectionContext();
  const [selectedCollectionId, setSelectedCollectionId] = useState<number | null>(
    collections.length > 0 ? collections[0]?.id : null
  );
  
  // Get all card data
  const allCards = getAllCollectionCards();
  
  // Update active collection when selection changes
  const handleSelectCollection = (collectionId: number) => {
    setSelectedCollectionId(collectionId);
    setActiveCollection(collectionId);
  };
  
  // Get cards for selected collection
  const collectionCards = allCards.filter(card => {
    if (!selectedCollectionId) return false;
    
    // Filter based on collections array
    if (Array.isArray(card.collections)) {
      return card.collections.includes(selectedCollectionId);
    }
    return false;
  });
  
  // Get selected collection
  const selectedCollection = selectedCollectionId 
    ? collections.find(c => c.id === selectedCollectionId) 
    : null;
  
  // Calculate some basic stats for the collection
  const totalCards = collectionCards.length;
  const uniqueCards = new Set(collectionCards.map(card => card.id)).size;
  const setIds = new Set(collectionCards.map(card => card.set?.id).filter(Boolean));
  const totalSets = setIds.size;
  
  // Empty state
  if (collections.length === 0) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-6">Collection Statistics</h1>
        <div className="border border-gray-200 rounded-md p-16 text-center">
          <p>Loading collections...</p>
        </div>
      </div>
    );
  }
  
  // Set active collection whenever selection changes
  useMemo(() => {
    if (selectedCollectionId) {
      setActiveCollection(selectedCollectionId);
    }
  }, [selectedCollectionId, setActiveCollection]);
  
  // Empty collection state
  if (collectionCards.length === 0 && selectedCollection) {
    return (
      <div className="px-4 py-4">
        <h1 className="text-2xl font-bold mb-4">Collection Statistics</h1>
        
        {/* Current View Banner - exact match to screenshot */}
        <div className="bg-purple-100 text-purple-800 p-2 rounded-md mb-4">
          <span>Current View: Loading... | Active Collection: {selectedCollection?.name}</span>
        </div>
        
        {/* Collection Selector Buttons */}
        <div className="mb-4">
          {collections.map(collection => (
            <Button 
              key={collection.id}
              variant="outline"
              className={`mr-2 ${selectedCollectionId === collection.id 
                ? 'bg-purple-600 text-white' 
                : 'bg-gray-200 text-gray-700 border-0'}`}
              onClick={() => handleSelectCollection(collection.id)}
            >
              {collection.name}
            </Button>
          ))}
        </div>
        
        {/* Empty Collection View - exactly matching screenshot */}
        <div className="border border-gray-200 rounded-md p-4">
          <h2 className="text-lg font-semibold mb-1">Empty Collection</h2>
          <p className="text-sm text-gray-500 mb-4">Add cards to your collection to see detailed statistics</p>
          
          <div className="text-center py-16">
            <p className="text-gray-500 mb-1">This collection is empty</p>
            <p className="text-sm text-gray-500">Add cards via the Set Browser or Search</p>
          </div>
        </div>
      </div>
    );
  }
  
  // Main view with collection statistics
  return (
    <div className="px-4 py-4">
      <h1 className="text-2xl font-bold mb-4">Collection Statistics</h1>
      
      {/* Current View Banner */}
      <div className="bg-purple-100 text-purple-800 p-2 rounded-md mb-4">
        <span>Current View: Loading... | Active Collection: {selectedCollection?.name}</span>
      </div>
      
      {/* Collection Selector Buttons */}
      <div className="mb-4">
        {collections.map(collection => (
          <Button 
            key={collection.id}
            variant="outline"
            className={`mr-2 ${selectedCollectionId === collection.id 
              ? 'bg-purple-600 text-white' 
              : 'bg-gray-200 text-gray-700 border-0'}`}
            onClick={() => handleSelectCollection(collection.id)}
          >
            {collection.name}
          </Button>
        ))}
      </div>
      
      {/* Statistics Content */}
      <div className="border border-gray-200 rounded-md p-4">
        <h2 className="text-lg font-semibold mb-4">Collection Statistics</h2>
        
        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-purple-50 border border-purple-200 rounded-md p-3">
            <div className="text-sm text-gray-600">Total Cards</div>
            <div className="text-xl font-bold text-purple-700">{totalCards}</div>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
            <div className="text-sm text-gray-600">Unique Cards</div>
            <div className="text-xl font-bold text-blue-700">{uniqueCards}</div>
          </div>
          
          <div className="bg-green-50 border border-green-200 rounded-md p-3">
            <div className="text-sm text-gray-600">Sets</div>
            <div className="text-xl font-bold text-green-700">{totalSets}</div>
          </div>
        </div>
        
        {/* Type Distribution */}
        <h3 className="text-md font-semibold mb-2">Type Distribution</h3>
        <div className="space-y-3 mb-6">
          {['Fire', 'Water', 'Grass', 'Electric', 'Psychic'].map(type => {
            // Count cards of this type
            const count = collectionCards.filter(card => 
              Array.isArray(card.types) && 
              card.types.some(t => t && t.toLowerCase() === type.toLowerCase())
            ).length;
            
            // Calculate percentage
            const percentage = Math.max(0, Math.min(100, 
              totalCards > 0 ? Math.round((count / totalCards) * 100) : 0
            ));
            
            return (
              <div key={type} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>{type}</span>
                  <span>{count} cards ({percentage}%)</span>
                </div>
                <Progress value={percentage} className="h-2" />
              </div>
            );
          })}
        </div>
        
        {/* Rarity Distribution */}
        <h3 className="text-md font-semibold mb-2">Rarity Distribution</h3>
        <div className="space-y-3 mb-6">
          {['Common', 'Uncommon', 'Rare', 'Ultra Rare'].map(rarity => {
            // Count cards of this rarity
            const count = collectionCards.filter(card => 
              card.rarity && card.rarity.toLowerCase().includes(rarity.toLowerCase())
            ).length;
            
            // Calculate percentage
            const percentage = Math.max(0, Math.min(100, 
              totalCards > 0 ? Math.round((count / totalCards) * 100) : 0
            ));
            
            return (
              <div key={rarity} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>{rarity}</span>
                  <span>{count} cards ({percentage}%)</span>
                </div>
                <Progress value={percentage} className="h-2" />
              </div>
            );
          })}
        </div>
        
        {/* Recent Additions */}
        <h3 className="text-md font-semibold mb-2">Recent Additions</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {collectionCards.slice(0, 5).map(card => (
            <div key={card.id} className="border rounded-md p-2 text-center">
              {card.images?.small ? (
                <img 
                  src={card.images.small} 
                  alt={card.name} 
                  className="mx-auto h-28 object-contain" 
                />
              ) : (
                <div className="h-28 bg-gray-100 flex items-center justify-center">
                  <span className="text-xs text-gray-500">No Image</span>
                </div>
              )}
              <div className="text-xs mt-2 truncate">{card.name}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StatisticsNew;