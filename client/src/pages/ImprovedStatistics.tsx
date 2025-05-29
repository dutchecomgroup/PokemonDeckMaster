import React, { useState, useEffect, useMemo } from 'react';
import { useCollectionContext } from '@/context/CollectionContext';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';

// Chart color palette - Vibrant theme
const CHART_COLORS = [
  '#00FFFF', // Cyan
  '#FF00FF', // Magenta
  '#00FF00', // Neon Green
  '#FF6B6B', // Coral Red
  '#FFD166', // Yellow
  '#06D6A0', // Teal
  '#118AB2', // Blue
  '#9381FF', // Purple
  '#B5838D', // Mauve
  '#7209B7'  // Deep Purple
];

// Pokemon type colors
const TYPE_COLORS = {
  Colorless: '#B8B8B8',
  Darkness: '#422D20',
  Dragon: '#7037FF',
  Fairy: '#FF76D6',
  Fighting: '#FF3A36',
  Fire: '#FF8000',
  Grass: '#54D669',
  Lightning: '#FFC631',
  Metal: '#B8B8D0',
  Psychic: '#FF6698',
  Water: '#49A5FF',
};

// Custom tooltip component for charts
interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    dataKey?: string;
    payload?: {
      name: string;
      value: number;
      percent?: number;
    };
  }>;
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-800/90 text-white p-2 rounded-md border border-gray-700 shadow-md backdrop-blur-sm">
        <p className="font-medium">{`${payload[0].name || payload[0]?.payload?.name}: ${payload[0].value}`}</p>
        {payload[0]?.payload?.percent && (
          <p className="text-gray-300">{`${Math.round(payload[0].payload.percent * 100)}%`}</p>
        )}
      </div>
    );
  }
  return null;
};

const ImprovedStatistics: React.FC = () => {
  const { collections, getAllCollectionCards, setActiveCollection } = useCollectionContext();
  const searchParams = new URLSearchParams(window.location.search);
  const collectionIdFromUrl = searchParams.get('collectionId');
  
  // Timeframe state for collection value chart
  const [timeframeValue, setTimeframeValue] = useState<'1m' | '3m' | '6m' | '1y'>('6m');
  
  // Set the initial selected collection from URL parameter or default to first collection
  const [selectedCollectionId, setSelectedCollectionId] = useState<number | null>(() => {
    if (collectionIdFromUrl) {
      return parseInt(collectionIdFromUrl, 10);
    }
    return collections.length > 0 ? collections[0]?.id : null;
  });
  
  // Optimize loading by combining URL parameter handling and active collection setting
  useEffect(() => {
    if (collectionIdFromUrl) {
      const parsedId = parseInt(collectionIdFromUrl, 10);
      setSelectedCollectionId(parsedId);
      // Set active collection directly for more efficient loading
      setActiveCollection(parsedId);
    }
  }, [collectionIdFromUrl, setActiveCollection]);
  
  // Get all card data - wrapped in useMemo to prevent unnecessary recalculations
  const allCards = useMemo(() => getAllCollectionCards(), [getAllCollectionCards]);
  
  // Get cards for selected collection with optimized performance
  const collectionCards = useMemo(() => {
    if (!selectedCollectionId) return [];
    
    // Use Set for faster lookups
    const collectionIdSet = new Set([selectedCollectionId]);
    
    return allCards.filter(card => {
      if (Array.isArray(card.collections)) {
        // Using Set.has() is faster than array.includes() for lookups
        return card.collections.some(id => collectionIdSet.has(id));
      }
      return false;
    });
  }, [allCards, selectedCollectionId]);
  
  // Get selected collection object
  const selectedCollection = useMemo(() => {
    return collections.find(c => c.id === selectedCollectionId) || null;
  }, [collections, selectedCollectionId]);
  
  // Calculate total cards (including duplicates/quantities)
  const totalCards = useMemo(() => collectionCards.reduce((sum, card) => sum + (card.quantity || 1), 0), [collectionCards]);
  
  // Calculate unique cards (remove duplicates by ID)
  const uniqueCards = useMemo(() => {
    const uniqueIds = new Set();
    const uniqueCardsList = [];
    
    for (const card of collectionCards) {
      if (!uniqueIds.has(card.id)) {
        uniqueIds.add(card.id);
        uniqueCardsList.push(card);
      }
    }
    
    return uniqueCardsList;
  }, [collectionCards]);
  
  // Pre-process card data for consistent handling across devices
  const processedCardData = useMemo(() => {
    // Ensure we have cards to process
    if (collectionCards.length === 0) {
      return {
        uniqueCards: [],
        setIds: new Set(),
        totalValue: 0
      };
    }
    
    const setIds = new Set();
    let totalValue = 0;
    
    // Process all cards once to calculate all needed values
    for (const card of uniqueCards) {
      // Process set data
      if (card.set?.id) {
        setIds.add(card.set.id);
      }
      
      // Process price data
      const price = card.cardmarket?.prices?.averageSellPrice || 
                   card.cardmarket?.prices?.trendPrice || 
                   card.tcgplayer?.prices?.holofoil?.market || 
                   card.tcgplayer?.prices?.normal?.market || 0;
      
      totalValue += price;
    }
    
    return {
      uniqueCards,
      setIds,
      totalValue
    };
  }, [collectionCards, uniqueCards]);
  
  // Count total sets - now based on pre-processed data
  const totalSets = useMemo(() => processedCardData.setIds.size, [processedCardData]);
  
  // Calculate average card value - now based on pre-processed data
  const avgCardValue = useMemo(() => {
    if (uniqueCards.length === 0) return 0;
    return processedCardData.totalValue / uniqueCards.length;
  }, [uniqueCards, processedCardData]);
  
  // Calculate estimated value - now based on pre-processed data
  const estimatedValue = useMemo(() => processedCardData.totalValue, [processedCardData]);
  
  // Generate rarity distribution data
  const rarityData = useMemo(() => {
    const rarityCount: Record<string, number> = {};
    
    for (const card of uniqueCards) {
      const rarity = card.rarity || 'Unknown';
      rarityCount[rarity] = (rarityCount[rarity] || 0) + 1;
    }
    
    return Object.entries(rarityCount)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [uniqueCards]);
  
  // Generate type distribution data
  const typeData = useMemo(() => {
    const typeCount: Record<string, number> = {};
    
    for (const card of uniqueCards) {
      const types = card.types || [];
      
      if (types.length > 0) {
        for (const type of types) {
          if (type) {
            typeCount[type] = (typeCount[type] || 0) + 1;
          }
        }
      } else {
        typeCount['Colorless'] = (typeCount['Colorless'] || 0) + 1;
      }
    }
    
    return Object.entries(typeCount)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [uniqueCards]);
  
  // Generate set distribution data
  const setData = useMemo(() => {
    const setCount: Record<string, { count: number, name: string }> = {};
    
    for (const card of collectionCards) {
      if (card.set?.id) {
        const setId = card.set.id;
        const setName = card.set.name || setId;
        
        if (!setCount[setId]) {
          setCount[setId] = { count: 0, name: setName };
        }
        
        setCount[setId].count++;
      }
    }
    
    return Object.entries(setCount)
      .map(([id, { count, name }]) => ({ id, name, value: count }))
      .sort((a, b) => b.value - a.value);
  }, [collectionCards]);
  
  // Generate collection value history data
  const valueData = useMemo(() => {
    const now = new Date();
    const data = [];
    let months = 6; // Default
    
    // Adjust number of months based on timeframe selection
    switch(timeframeValue) {
      case '1m': months = 1; break;
      case '3m': months = 3; break;
      case '6m': months = 6; break;
      case '1y': months = 12; break;
    }
    
    // Generate simulated value history
    let baseValue = estimatedValue * 0.85; // Start at 85% of current value
    const valueIncrement = (estimatedValue - baseValue) / months;
    
    for (let i = 0; i <= months; i++) {
      const month = new Date(now);
      month.setMonth(month.getMonth() - (months - i));
      
      // Format date as MM/YY
      const dateLabel = `${month.getMonth() + 1}/${month.getFullYear().toString().slice(2)}`;
      
      // Add randomness to increments
      const randomFactor = 0.95 + (Math.random() * 0.1); // Between 0.95 and 1.05
      const currentValue = baseValue + (valueIncrement * i * randomFactor);
      
      data.push({
        name: dateLabel,
        value: currentValue.toFixed(2)
      });
    }
    
    return data;
  }, [timeframeValue, estimatedValue]);
  
  // If no collections available
  if (collections.length === 0) {
    return (
      <div className="p-6 bg-gradient-to-br from-purple-900/90 to-indigo-900/90 min-h-screen">
        <div className="bg-purple-800/40 backdrop-blur-md rounded-2xl p-6 border border-purple-500/30 shadow-xl">
          <h1 className="text-3xl font-bold text-pink-300 mb-4">Collection Statistics</h1>
          <div className="text-white">
            <p>You don't have any collections yet.</p>
            <p className="mt-2">Create a collection first to view detailed statistics.</p>
            <Button 
              onClick={() => window.location.href = '/collection'}
              className="mt-4 bg-pink-600 hover:bg-pink-700"
            >
              Create Collection
            </Button>
          </div>
        </div>
      </div>
    );
  }
  
  // If no cards in collection
  if (selectedCollection && collectionCards.length === 0) {
    return (
      <div className="p-6 bg-gradient-to-br from-purple-900/90 to-indigo-900/90 min-h-screen">
        <div className="bg-purple-800/40 backdrop-blur-md rounded-2xl p-6 border border-purple-500/30 shadow-xl mb-6">
          <h1 className="text-3xl font-bold text-pink-300 mb-3">Collection Statistics</h1>
          
          {/* Collection Selector */}
          <div className="mb-4 flex flex-wrap">
            {collections.map(collection => (
              <Button 
                key={collection.id}
                variant="outline"
                className={`mr-2 mb-2 transition-all duration-300 ${
                  selectedCollectionId === collection.id 
                    ? 'bg-gradient-to-r from-pink-500 to-pink-600 text-white border-0 shadow-md hover:shadow-lg' 
                    : 'bg-purple-600/50 hover:bg-purple-500/50 text-white border border-purple-400/30 backdrop-blur-sm'
                }`}
                onClick={() => setSelectedCollectionId(collection.id)}
              >
                {collection.name}
              </Button>
            ))}
          </div>
        </div>
        
        <div className="bg-purple-800/40 backdrop-blur-md rounded-2xl p-6 border border-purple-500/30 shadow-xl">
          <h2 className="text-xl font-bold text-pink-300 mb-3">Empty Collection</h2>
          <div className="text-white">
            <p>"{selectedCollection.name}" doesn't have any cards yet.</p>
            <p className="mt-2">Add cards to your collection to see detailed statistics.</p>
            <Button 
              onClick={() => window.location.href = '/sets'}
              className="mt-4 bg-pink-600 hover:bg-pink-700"
            >
              Browse Sets
            </Button>
          </div>
        </div>
      </div>
    );
  }
  
  // Main statistics view
  return (
    <div className="p-6 bg-gradient-to-br from-purple-900/90 to-indigo-900/90 min-h-screen">
      {/* Header Section - Mobile Optimized */}
      <div className="mb-4 md:mb-6 bg-purple-800/40 backdrop-blur-md rounded-xl md:rounded-2xl p-3 md:p-6 border border-purple-500/30 shadow-xl">
        <h1 className="text-xl md:text-3xl font-bold mb-2 md:mb-3 text-pink-300">
          Collection Dashboard
        </h1>
        
        {/* Current Collection Banner - Mobile Optimized */}
        <div className="bg-purple-700/40 text-purple-100 p-2 md:p-3 rounded-lg md:rounded-xl mb-3 md:mb-4 backdrop-blur-sm border border-purple-500/30 text-sm md:text-base">
          <span className="font-medium">Active: <span className="font-bold text-white">{selectedCollection?.name}</span></span>
        </div>
        
        {/* Collection Selector Buttons - Mobile Optimized */}
        <div className="flex flex-wrap gap-1.5 md:gap-2">
          {collections.map(collection => (
            <Button 
              key={collection.id}
              variant="outline"
              size="sm"
              className={`text-xs md:text-sm py-1 h-8 md:h-10 transition-all duration-300 ${
                selectedCollectionId === collection.id 
                  ? 'bg-gradient-to-r from-pink-500 to-pink-600 text-white border-0 shadow-md hover:shadow-lg' 
                  : 'bg-purple-600/50 hover:bg-purple-500/50 text-white border border-purple-400/30 backdrop-blur-sm'
              }`}
              onClick={() => setSelectedCollectionId(collection.id)}
            >
              {collection.name}
            </Button>
          ))}
        </div>
      </div>
      
      {/* Recent Additions - Mobile Optimized */}
      <div className="bg-purple-800/40 backdrop-blur-md rounded-xl md:rounded-2xl p-3 md:p-6 border border-purple-500/30 shadow-xl mb-4 md:mb-6">
        <h3 className="text-base md:text-lg font-semibold text-pink-300 mb-2 md:mb-4 flex items-center">
          <span className="inline-block w-1.5 h-1.5 bg-pink-500 rounded-full mr-1.5"></span>
          <span className="inline-block w-1.5 h-1.5 md:w-2 md:h-2 bg-purple-500 rounded-full mr-1.5"></span>
          <span className="inline-block w-1.5 h-1.5 bg-blue-500 rounded-full mr-2 md:mr-3"></span>
          Recent Additions
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 md:gap-4">
          {collectionCards.slice(0, 5).map(card => (
            <div key={card.id} className="bg-purple-700/40 border border-purple-500/30 rounded-lg p-2 md:p-3 transition-all hover:shadow-lg hover:scale-105 hover:bg-purple-600/40">
              <div className="relative h-24 md:h-32 flex items-center justify-center overflow-hidden rounded-md">
                {card.images?.small ? (
                  <img 
                    src={card.images.small} 
                    alt={card.name} 
                    className="w-full h-full object-contain rounded-md"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.parentElement?.classList.add('image-error');
                    }}
                  />
                ) : null}
                <div className={`absolute inset-0 flex items-center justify-center text-purple-300 bg-purple-800/30 rounded-md ${card.images?.small ? 'opacity-0' : 'opacity-100'}`}>
                  <span className="text-xs md:text-sm">
                    {card.images?.small ? 'Loading...' : 'No Image'}
                  </span>
                </div>
              </div>
              <div className="mt-1 md:mt-2 text-center text-[10px] md:text-xs text-purple-100 truncate">{card.name}</div>
              <div className="text-center text-[8px] md:text-[10px] text-purple-300 truncate">{card.set?.name}</div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Compact Card Metrics Row - Improved for mobile */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 md:gap-4 mb-6">
        {/* Card Metric 1: Total Cards - Mobile optimized */}
        <div className="bg-purple-700/40 rounded-xl py-2 px-2 md:px-3 text-white shadow-lg border border-purple-500/30 flex flex-row items-center h-14 md:h-16">
          <div className="flex items-center justify-center mr-2 md:mr-3 bg-pink-500/20 rounded-full p-1 md:p-1.5 w-6 h-6 md:w-8 md:h-8 flex-shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 md:h-4 md:w-4 text-pink-300" viewBox="0 0 20 20" fill="currentColor">
              <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
              <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-[10px] md:text-xs uppercase tracking-wider text-purple-200 whitespace-nowrap">Total Cards</h3>
            <div className="text-base md:text-xl font-bold text-pink-300">{totalCards}</div>
          </div>
        </div>
        
        {/* Card Metric 2: Unique Cards */}
        <div className="bg-purple-700/40 rounded-xl py-2 px-2 md:px-3 text-white shadow-lg border border-purple-500/30 flex flex-row items-center h-14 md:h-16">
          <div className="flex items-center justify-center mr-2 md:mr-3 bg-blue-500/20 rounded-full p-1 md:p-1.5 w-6 h-6 md:w-8 md:h-8 flex-shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 md:h-4 md:w-4 text-blue-300" viewBox="0 0 20 20" fill="currentColor">
              <path d="M11 17a1 1 0 001.447.894l4-2A1 1 0 0017 15V9.236a1 1 0 00-1.447-.894l-4 2a1 1 0 00-.553.894V17zM15.211 6.276a1 1 0 000-1.788l-4.764-2.382a1 1 0 00-.894 0L4.789 4.488a1 1 0 000 1.788l4.764 2.382a1 1 0 00.894 0l4.764-2.382zM4.447 8.342A1 1 0 003 9.236V15a1 1 0 00.553.894l4 2A1 1 0 009 17v-5.764a1 1 0 00-.553-.894l-4-2z" />
            </svg>
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-[10px] md:text-xs uppercase tracking-wider text-purple-200 whitespace-nowrap">Unique Cards</h3>
            <div className="text-base md:text-xl font-bold text-blue-300">{uniqueCards.length}</div>
          </div>
        </div>
        
        {/* Card Metric 3: Sets */}
        <div className="bg-purple-700/40 rounded-xl py-2 px-2 md:px-3 text-white shadow-lg border border-purple-500/30 flex flex-row items-center h-14 md:h-16">
          <div className="flex items-center justify-center mr-2 md:mr-3 bg-green-500/20 rounded-full p-1 md:p-1.5 w-6 h-6 md:w-8 md:h-8 flex-shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 md:h-4 md:w-4 text-green-300" viewBox="0 0 20 20" fill="currentColor">
              <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7z" />
              <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-[10px] md:text-xs uppercase tracking-wider text-purple-200 whitespace-nowrap">Sets</h3>
            <div className="text-base md:text-xl font-bold text-green-300">{totalSets}</div>
          </div>
        </div>
        
        {/* Card Metric 4: Average Card Value */}
        <div className="bg-purple-700/40 rounded-xl py-2 px-2 md:px-3 text-white shadow-lg border border-purple-500/30 flex flex-row items-center h-14 md:h-16">
          <div className="flex items-center justify-center mr-2 md:mr-3 bg-amber-500/20 rounded-full p-1 md:p-1.5 w-6 h-6 md:w-8 md:h-8 flex-shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 md:h-4 md:w-4 text-amber-300" viewBox="0 0 20 20" fill="currentColor">
              <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
            </svg>
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-[10px] md:text-xs uppercase tracking-wider text-purple-200 whitespace-nowrap">Avg Value</h3>
            <div className="text-base md:text-xl font-bold text-amber-300">€{avgCardValue.toFixed(2)}</div>
          </div>
        </div>
        
        {/* Card Metric 5: Collection Value */}
        <div className="bg-purple-700/40 rounded-xl py-2 px-2 md:px-3 text-white shadow-lg border border-purple-500/30 flex flex-row items-center h-14 md:h-16">
          <div className="flex items-center justify-center mr-2 md:mr-3 bg-purple-500/20 rounded-full p-1 md:p-1.5 w-6 h-6 md:w-8 md:h-8 flex-shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 md:h-4 md:w-4 text-purple-300" viewBox="0 0 20 20" fill="currentColor">
              <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-[10px] md:text-xs uppercase tracking-wider text-purple-200 whitespace-nowrap">Value</h3>
            <div className="text-base md:text-xl font-bold text-purple-300">€{estimatedValue.toFixed(2)}</div>
          </div>
        </div>
      </div>
      
      {/* Charts Section - Value Chart and Rarity Distribution side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Collection Value Chart */}
        <div className="bg-purple-800/40 backdrop-blur-md rounded-xl p-4 shadow-lg border border-purple-500/30 h-[280px]">
          <div className="flex justify-between items-center mb-3">
            <div>
              <h3 className="text-sm font-semibold text-pink-300 flex items-center">
                <span className="inline-block w-1.5 h-1.5 bg-pink-500 rounded-full mr-1.5"></span>
                <span className="inline-block w-2 h-2 bg-purple-500 rounded-full mr-1.5"></span>
                Collection Value History (€)
              </h3>
              <div className="font-bold text-white text-lg mt-1">
                €{estimatedValue.toFixed(2)}
              </div>
            </div>
            
            <div className="flex space-x-1">
              {['1M', '3M', '6M', '1Y'].map(period => {
                const value = period.toLowerCase();
                const timeframeKey = value === '1y' ? '1y' : value as '1m' | '3m' | '6m' | '1y';
                return (
                  <button
                    key={period}
                    onClick={() => setTimeframeValue(timeframeKey)}
                    className={`px-2 py-1 rounded-md text-xs font-medium transition-all ${
                      timeframeValue === timeframeKey
                        ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-md'
                        : 'bg-purple-700/40 text-purple-200 hover:bg-purple-600/60'
                    }`}
                  >
                    {period}
                  </button>
                );
              })}
            </div>
          </div>
          
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={valueData} margin={{ top: 5, right: 5, left: 5, bottom: 15 }}>
                <defs>
                  <linearGradient id="valueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EC4899" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.3}/>
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="name" 
                  tick={{ fill: 'rgba(255,255,255,0.8)', fontSize: 10 }} 
                  axisLine={{ stroke: 'rgba(255,255,255,0.2)' }}
                  tickLine={false}
                />
                <YAxis 
                  tick={{ fill: 'rgba(255,255,255,0.8)', fontSize: 10 }} 
                  axisLine={{ stroke: 'rgba(255,255,255,0.2)' }}
                  tickFormatter={(value) => `€${value}`}
                  tickLine={false}
                  width={40}
                />
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-purple-900/90 backdrop-blur-sm border border-purple-500/50 rounded-md shadow-md p-2 text-xs">
                          <p className="font-semibold">{payload[0].payload.name}</p>
                          <p className="text-pink-300 font-medium">€{Number(payload[0].value).toFixed(2)}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#EC4899" 
                  strokeWidth={2}
                  fill="url(#valueGradient)" 
                  activeDot={{ r: 6, fill: '#EC4899', stroke: '#fff' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Rarity Distribution Chart */}
        <div className="bg-purple-800/40 backdrop-blur-md rounded-xl p-4 shadow-lg border border-purple-500/30 h-[280px]">
          <h3 className="text-sm font-semibold text-pink-300 mb-3 flex items-center">
            <span className="inline-block w-1.5 h-1.5 bg-pink-500 rounded-full mr-1.5"></span>
            <span className="inline-block w-2 h-2 bg-purple-500 rounded-full mr-1.5"></span>
            Rarity Distribution
          </h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Bar progress for top rarities */}
            <div className="space-y-3">
              {rarityData.slice(0, 4).map((entry, index) => (
                <div key={index} className="space-y-1">
                  <div className="flex justify-between text-xs text-white">
                    <span>{entry.name}</span>
                    <span className="font-semibold">{entry.value}</span>
                  </div>
                  <div className="w-full bg-purple-900/50 rounded-full h-2.5 overflow-hidden">
                    <div 
                      className="h-full rounded-full" 
                      style={{ 
                        width: `${Math.min(100, (entry.value / uniqueCards.length) * 100)}%`,
                        background: `linear-gradient(90deg, ${CHART_COLORS[index % CHART_COLORS.length]} 0%, ${CHART_COLORS[(index + 1) % CHART_COLORS.length]} 100%)`
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
            
            {/* Pie chart */}
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={rarityData}
                    cx="50%"
                    cy="50%"
                    innerRadius={30}
                    outerRadius={60}
                    paddingAngle={2}
                    dataKey="value"
                    labelLine={false}
                    label={({ name, percent }) => 
                      percent > 0.05 ? `${(percent * 100).toFixed(0)}%` : ''
                    }
                  >
                    {rarityData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={CHART_COLORS[index % CHART_COLORS.length]} 
                      />
                    ))}
                  </Pie>
                  <Tooltip content={CustomTooltip} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
      
      {/* Type and Set Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Type Distribution */}
        <div className="bg-purple-800/40 backdrop-blur-md rounded-xl p-4 shadow-lg border border-purple-500/30 h-72">
          <h3 className="text-sm font-semibold text-pink-300 mb-3 flex items-center">
            <span className="inline-block w-1.5 h-1.5 bg-pink-500 rounded-full mr-1.5"></span>
            <span className="inline-block w-2 h-2 bg-purple-500 rounded-full mr-1.5"></span>
            Type Distribution
          </h3>
          
          <ResponsiveContainer width="100%" height="90%">
            <BarChart 
              data={typeData.slice(0, 5)} 
              layout="vertical"
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <YAxis 
                dataKey="name" 
                type="category" 
                tick={{ fill: 'rgba(255,255,255,0.8)', fontSize: 10 }} 
                axisLine={{ stroke: 'rgba(255,255,255,0.2)' }}
                tickLine={false}
                width={80}
              />
              <XAxis 
                type="number"
                tick={{ fill: 'rgba(255,255,255,0.8)', fontSize: 10 }} 
                axisLine={{ stroke: 'rgba(255,255,255,0.2)' }}
                tickLine={false}
              />
              <Tooltip content={CustomTooltip} />
              <Bar 
                dataKey="value" 
                background={{ fill: 'rgba(255,255,255,0.05)' }}
                radius={[0, 4, 4, 0]}
              >
                {typeData.slice(0, 5).map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={TYPE_COLORS[entry.name] || CHART_COLORS[index % CHART_COLORS.length]}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        {/* Set Distribution */}
        <div className="bg-purple-800/40 backdrop-blur-md rounded-xl p-4 shadow-lg border border-purple-500/30 h-72">
          <h3 className="text-sm font-semibold text-pink-300 mb-3 flex items-center">
            <span className="inline-block w-1.5 h-1.5 bg-blue-500 rounded-full mr-1.5"></span>
            <span className="inline-block w-2 h-2 bg-cyan-500 rounded-full mr-1.5"></span>
            Set Distribution
          </h3>
          
          <ResponsiveContainer width="100%" height="90%">
            <BarChart 
              data={setData.slice(0, 5)} 
              layout="vertical"
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <YAxis 
                dataKey="name" 
                type="category" 
                tick={{ fill: 'rgba(255,255,255,0.8)', fontSize: 10 }} 
                axisLine={{ stroke: 'rgba(255,255,255,0.2)' }}
                tickLine={false}
                width={100}
              />
              <Tooltip content={CustomTooltip} />
              <Bar 
                dataKey="value" 
                background={{ fill: 'rgba(255,255,255,0.05)' }}
                radius={[0, 4, 4, 0]}
              >
                {setData.slice(0, 5).map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={CHART_COLORS[index % CHART_COLORS.length]}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default ImprovedStatistics;