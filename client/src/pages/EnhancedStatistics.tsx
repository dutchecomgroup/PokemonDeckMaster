import React, { useState, useEffect, useMemo } from 'react';
import { useCollectionContext } from '@/context/CollectionContext';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis
} from 'recharts';

// Chart color palette - Futuristic neon theme
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

// Pokemon type colors with more vibrant tones
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
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-800/90 text-white p-2 rounded-md border border-gray-700 shadow-md backdrop-blur-sm">
        <p className="font-medium">{`${payload[0].name}: ${payload[0].value}`}</p>
        {payload[0].payload?.percent && (
          <p className="text-gray-300">{`${Math.round(payload[0].payload.percent * 100)}%`}</p>
        )}
      </div>
    );
  }
  return null;
};

const EnhancedStatistics: React.FC = () => {
  const { collections, getAllCollectionCards, setActiveCollection } = useCollectionContext();
  const searchParams = new URLSearchParams(window.location.search);
  const collectionIdFromUrl = searchParams.get('collectionId');
  
  // Set the initial selected collection from URL parameter or default to first collection
  const [selectedCollectionId, setSelectedCollectionId] = useState<number | null>(() => {
    if (collectionIdFromUrl) {
      return parseInt(collectionIdFromUrl, 10);
    }
    return collections.length > 0 ? collections[0]?.id : null;
  });
  
  // Get all card data
  const allCards = getAllCollectionCards();
  
  // Check URL for collection ID on mount
  useEffect(() => {
    if (collectionIdFromUrl) {
      const parsedId = parseInt(collectionIdFromUrl, 10);
      setSelectedCollectionId(parsedId);
    }
  }, [collectionIdFromUrl]);
  
  // Use a more direct approach to prevent popups
  useEffect(() => {
    // Hide all toast elements when on the statistics page
    const style = document.createElement('style');
    style.textContent = `
      [role="status"], [data-sonner-toast], [data-radix-toast-viewport] {
        display: none !important;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      // Remove our style when leaving the page
      document.head.removeChild(style);
    };
  }, []);
  
  // Update active collection whenever selection changes
  useEffect(() => {
    if (selectedCollectionId) {
      setActiveCollection(selectedCollectionId);
    }
  }, [selectedCollectionId, setActiveCollection]);
  
  // Get cards for selected collection
  const collectionCards = allCards.filter(card => {
    if (!selectedCollectionId) return false;
    
    // Filter based on collections array
    if (Array.isArray(card.collections)) {
      return card.collections.includes(selectedCollectionId);
    }
    return false;
  });
  
  // Get selected collection object
  const selectedCollection = selectedCollectionId 
    ? collections.find(c => c.id === selectedCollectionId) 
    : null;
  
  // Calculate advanced statistics for the collection
  const totalCards = collectionCards.length;
  const uniqueCards = new Set(collectionCards.map(card => card.id)).size;
  const setIds = new Set(collectionCards.map(card => card.set?.id).filter(Boolean));
  const totalSets = setIds.size;
  
  // Calculate rarity distribution
  const rarityData = (() => {
    const rarityCount: Record<string, number> = {};
    
    collectionCards.forEach(card => {
      const rarity = card.rarity || 'Unknown';
      rarityCount[rarity] = (rarityCount[rarity] || 0) + 1;
    });
    
    return Object.entries(rarityCount)
      .map(([name, value]) => ({ 
        name, 
        value,
        percent: value / Math.max(1, totalCards)
      }))
      .sort((a, b) => b.value - a.value);
  })();
  
  // Calculate type distribution
  const typeData = (() => {
    const typeCount: Record<string, number> = {};
    
    collectionCards.forEach(card => {
      if (Array.isArray(card.types) && card.types.length > 0) {
        card.types.forEach(type => {
          if (type) {
            typeCount[type] = (typeCount[type] || 0) + 1;
          }
        });
      } else {
        typeCount['Colorless'] = (typeCount['Colorless'] || 0) + 1;
      }
    });
    
    return Object.entries(typeCount)
      .map(([name, value]) => ({ 
        name, 
        value,
        percent: value / Math.max(1, totalCards)
      }))
      .sort((a, b) => b.value - a.value);
  })();
  
  // Calculate set distribution
  const setData = (() => {
    const setCount: Record<string, { count: number, name: string }> = {};
    
    collectionCards.forEach(card => {
      if (card.set?.id) {
        const setId = card.set.id;
        const setName = card.set.name || setId;
        
        if (!setCount[setId]) {
          setCount[setId] = { count: 0, name: setName };
        }
        
        setCount[setId].count++;
      }
    });
    
    return Object.entries(setCount)
      .map(([id, { count, name }]) => ({ 
        id,
        name, 
        value: count,
        percent: count / Math.max(1, totalCards)
      }))
      .sort((a, b) => b.value - a.value);
  })();
  
  // Calculate card value information with multiple timeframes
  const [timeframeValue, setTimeframeValue] = useState<'1m' | '3m' | '6m' | '1y'>('6m');
  
  // Generate value data for visualization with different timeframes
  const valueData = useMemo(() => {
    let points: { name: string, value: number }[] = [];
    let baseValue = Math.max(5, totalCards * 2.5); // Base value estimation
    
    // Generate different timeframes based on selection
    switch(timeframeValue) {
      case '1m':
        points = Array.from({ length: 30 }, (_, i) => {
          const date = new Date();
          date.setDate(date.getDate() - (29 - i));
          return {
            name: `${date.getDate()}/${date.getMonth() + 1}`,
            value: Math.round(baseValue * (0.95 + (i * 0.002)))
          };
        });
        break;
      case '3m':
        points = Array.from({ length: 12 }, (_, i) => {
          const date = new Date();
          date.setDate(date.getDate() - (90 - (i * 7)));
          return {
            name: `${date.getDate()}/${date.getMonth() + 1}`,
            value: Math.round(baseValue * (0.9 + (i * 0.01)))
          };
        });
        break;
      case '1y':
        points = Array.from({ length: 12 }, (_, i) => {
          const date = new Date();
          date.setMonth(date.getMonth() - (11 - i));
          return {
            name: `${date.toLocaleString('default', { month: 'short' })}`,
            value: Math.round(baseValue * (0.7 + (i * 0.03)))
          };
        });
        break;
      case '6m':
      default:
        points = Array.from({ length: 6 }, (_, i) => {
          const date = new Date();
          date.setMonth(date.getMonth() - (5 - i));
          return {
            name: `${date.toLocaleString('default', { month: 'short' })}`,
            value: Math.round(baseValue * (0.8 + (i * 0.05)))
          };
        });
    }
    
    return points;
  }, [timeframeValue, totalCards]);
  
  // Rarity to power level mapping
  const rarityPowerMapping: Record<string, number> = {
    'Common': 1,
    'Uncommon': 2,
    'Rare': 3,
    'Rare Holo': 4,
    'Rare Holo EX': 5,
    'Rare Holo GX': 5,
    'Rare Holo V': 5,
    'Rare Ultra': 6,
    'Rare Rainbow': 7,
    'Rare Secret': 8,
    'Rare Shiny': 7,
    'Amazing Rare': 6,
    'Promo': 4,
    'LEGEND': 8,
    'Ultra Rare': 7
  };
  
  // Calculate collection power metrics for radar chart
  const powerMetrics = (() => {
    // Initialize metrics
    const metrics = [
      { subject: 'Rarity', A: 0, fullMark: 10 },
      { subject: 'Types', A: 0, fullMark: 10 },
      { subject: 'Value', A: 0, fullMark: 10 },
      { subject: 'Variants', A: 0, fullMark: 10 },
      { subject: 'Completion', A: 0, fullMark: 10 }
    ];
    
    // Calculate rarity score
    const rarityScore = collectionCards.reduce((score, card) => {
      const rarityValue = rarityPowerMapping[card.rarity || ''] || 1;
      return score + rarityValue;
    }, 0) / Math.max(1, collectionCards.length) * 1.5; // Scale up to 10
    metrics[0].A = Math.min(10, rarityScore);
    
    // Calculate type diversity score
    metrics[1].A = Math.min(10, Math.sqrt(typeData.length) * 3);
    
    // Calculate value score (placeholder)
    metrics[2].A = Math.min(10, Math.log(totalCards + 1) * 2);
    
    // Calculate variants score based on unique cards ratio
    metrics[3].A = Math.min(10, (uniqueCards / Math.max(1, totalCards)) * 10);
    
    // Calculate completion score
    metrics[4].A = Math.min(10, Math.sqrt(totalSets) * 4);
    
    // Make sure we always show something meaningful for demo purposes
    if (collectionCards.length === 0) {
      metrics.forEach(metric => {
        metric.A = Math.random() * 5 + 3; // Random value between 3-8 for demo
      });
    }
    
    return metrics;
  })();
  
  // Empty state
  if (collections.length === 0) {
    return (
      <div className="p-4 bg-gray-50 min-h-screen">
        <h1 className="text-2xl font-bold mb-6 text-purple-800">Collection Statistics</h1>
        <div className="border border-gray-200 rounded-md p-16 text-center bg-white shadow-sm">
          <p>Loading collections...</p>
        </div>
      </div>
    );
  }
  
  // Empty collection state with maintained layout
  if (collectionCards.length === 0 && selectedCollection) {
    // We'll maintain the same layout structure but show "No data" messages
    return (
      <div className="p-6 bg-gradient-to-br from-purple-900/90 to-indigo-900/90 min-h-screen">
        <div className="mb-8 bg-purple-800/40 backdrop-blur-md rounded-2xl p-6 border border-purple-500/30 shadow-xl">
          <h1 className="text-3xl font-bold mb-3 text-pink-300">
            Collection Dashboard
          </h1>
          
          {/* Current View Banner */}
          <div className="bg-purple-700/40 text-purple-100 p-3 rounded-xl mb-4 backdrop-blur-sm border border-purple-500/30">
            <span className="font-medium">Active Collection: <span className="font-bold text-white">{selectedCollection?.name}</span></span>
          </div>
          
          {/* Collection Selector Buttons */}
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
        
        {/* Empty Collection Message */}
        <div className="bg-purple-800/40 backdrop-blur-md rounded-2xl p-6 border border-purple-500/30 shadow-xl mb-8">
          <h3 className="text-lg font-semibold text-pink-300 mb-4 flex items-center">
            <span className="inline-block w-1.5 h-1.5 bg-pink-500 rounded-full mr-1.5"></span>
            <span className="inline-block w-2 h-2 bg-purple-500 rounded-full mr-1.5"></span>
            <span className="inline-block w-1.5 h-1.5 bg-blue-500 rounded-full mr-3"></span>
            Empty Collection
          </h3>
          <div className="text-center py-16 border border-purple-500/20 rounded-xl bg-purple-700/20">
            <h2 className="text-xl font-semibold mb-4 text-white">This collection is empty</h2>
            <p className="text-purple-200 mb-2">Add cards to your collection to see detailed statistics</p>
            <p className="text-sm text-purple-300">Add cards via the Set Browser or Search</p>
          </div>
        </div>
        
        {/* Dashboard Grid Layout - Empty States */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
          {/* Row 1: Stats Cards - All showing zero data */}
          <div className="bg-purple-700/40 rounded-xl py-2 px-3 text-white shadow-lg border border-purple-500/30 flex flex-row items-center h-16">
            <div className="flex items-center justify-center mr-3 bg-pink-500/20 rounded-full p-1.5 w-8 h-8">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-pink-300" viewBox="0 0 20 20" fill="currentColor">
                <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h3 className="text-xs uppercase tracking-wider text-purple-200">Total Cards</h3>
              <div className="text-xl font-bold text-pink-300">0</div>
            </div>
          </div>
          
          <div className="bg-purple-700/40 rounded-xl py-2 px-3 text-white shadow-lg border border-purple-500/30 flex flex-row items-center h-16">
            <div className="flex items-center justify-center mr-3 bg-blue-500/20 rounded-full p-1.5 w-8 h-8">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-300" viewBox="0 0 20 20" fill="currentColor">
                <path d="M11 17a1 1 0 001.447.894l4-2A1 1 0 0017 15V9.236a1 1 0 00-1.447-.894l-4 2a1 1 0 00-.553.894V17zM15.211 6.276a1 1 0 000-1.788l-4.764-2.382a1 1 0 00-.894 0L4.789 4.488a1 1 0 000 1.788l4.764 2.382a1 1 0 00.894 0l4.764-2.382zM4.447 8.342A1 1 0 003 9.236V15a1 1 0 00.553.894l4 2A1 1 0 009 17v-5.764a1 1 0 00-.553-.894l-4-2z" />
              </svg>
            </div>
            <div>
              <h3 className="text-xs uppercase tracking-wider text-purple-200">Unique Cards</h3>
              <div className="text-xl font-bold text-blue-300">0</div>
            </div>
          </div>
          
          <div className="bg-purple-700/40 rounded-xl py-2 px-3 text-white shadow-lg border border-purple-500/30 flex flex-row items-center h-16">
            <div className="flex items-center justify-center mr-3 bg-purple-500/20 rounded-full p-1.5 w-8 h-8">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-300" viewBox="0 0 20 20" fill="currentColor">
                <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </div>
            <div>
              <h3 className="text-xs uppercase tracking-wider text-purple-200">Sets</h3>
              <div className="text-xl font-bold text-purple-300">0</div>
            </div>
          </div>
          
          <div className="bg-purple-700/40 rounded-xl py-2 px-3 text-white shadow-lg border border-purple-500/30 flex flex-row items-center h-16">
            <div className="flex items-center justify-center mr-3 bg-green-500/20 rounded-full p-1.5 w-8 h-8">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-300" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h3 className="text-xs uppercase tracking-wider text-purple-200">Estimated Value</h3>
              <div className="text-xl font-bold text-green-300">€0.00</div>
            </div>
          </div>
        </div>
        
        {/* Empty Charts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Rarity Distribution - Empty */}
          <div className="bg-purple-800/40 backdrop-blur-md rounded-2xl p-6 border border-purple-500/30 shadow-xl">
            <h3 className="text-lg font-semibold text-pink-300 mb-4">Rarity Distribution</h3>
            <div className="bg-purple-700/20 rounded-lg p-4 h-64 flex items-center justify-center border border-purple-500/20">
              <p className="text-purple-200">No data available</p>
            </div>
          </div>
          
          {/* Collection Value Chart - Empty */}
          <div className="bg-purple-800/40 backdrop-blur-md rounded-2xl p-6 border border-purple-500/30 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-pink-300">Collection Value</h3>
              <div className="flex space-x-1">
                <Button size="sm" variant="outline" className="bg-purple-700/30 text-purple-200 border-purple-500/20 hover:bg-purple-600/30 px-2 py-1 h-7">1M</Button>
                <Button size="sm" variant="outline" className="bg-purple-700/30 text-purple-200 border-purple-500/20 hover:bg-purple-600/30 px-2 py-1 h-7">3M</Button>
                <Button size="sm" variant="outline" className="bg-pink-700/50 text-white border-pink-500/30 px-2 py-1 h-7">6M</Button>
                <Button size="sm" variant="outline" className="bg-purple-700/30 text-purple-200 border-purple-500/20 hover:bg-purple-600/30 px-2 py-1 h-7">1Y</Button>
              </div>
            </div>
            <div className="bg-purple-700/20 rounded-lg p-4 h-64 flex items-center justify-center border border-purple-500/20">
              <p className="text-purple-200">No data available</p>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Main view with enhanced collection statistics
  return (
    <div className="p-6 bg-gradient-to-br from-purple-900/90 to-indigo-900/90 min-h-screen">
      <div className="mb-8 bg-purple-800/40 backdrop-blur-md rounded-2xl p-6 border border-purple-500/30 shadow-xl">
        <h1 className="text-3xl font-bold mb-3 text-pink-300">
          Collection Dashboard
        </h1>
        
        {/* Current View Banner */}
        <div className="bg-purple-700/40 text-purple-100 p-3 rounded-xl mb-4 backdrop-blur-sm border border-purple-500/30">
          <span className="font-medium">Active Collection: <span className="font-bold text-white">{selectedCollection?.name}</span></span>
        </div>
        
        {/* Collection Selector Buttons */}
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
      
      {/* Recent Additions - Moved to top */}
      <div className="bg-purple-800/40 backdrop-blur-md rounded-2xl p-6 border border-purple-500/30 shadow-xl mb-8">
        <h3 className="text-lg font-semibold text-pink-300 mb-4 flex items-center">
          <span className="inline-block w-1.5 h-1.5 bg-pink-500 rounded-full mr-1.5"></span>
          <span className="inline-block w-2 h-2 bg-purple-500 rounded-full mr-1.5"></span>
          <span className="inline-block w-1.5 h-1.5 bg-blue-500 rounded-full mr-3"></span>
          Recent Additions
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {collectionCards.slice(0, 5).map(card => (
            <div key={card.id} className="bg-purple-700/40 border border-purple-500/30 rounded-lg p-3 transition-all hover:shadow-lg hover:scale-105 hover:bg-purple-600/40">
              {card.images?.small ? (
                <img 
                  src={card.images.small} 
                  alt={card.name} 
                  className="mx-auto h-32 object-contain rounded-md" 
                />
              ) : (
                <div className="h-32 bg-purple-600/20 flex items-center justify-center rounded-md">
                  <span className="text-xs text-purple-200">No Image</span>
                </div>
              )}
              <div className="text-sm mt-3 font-medium text-center text-white truncate">{card.name}</div>
              <div className="text-xs text-purple-300 text-center truncate">{card.set?.name}</div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Dashboard Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
        {/* Row 1: Stats Cards - First 3 columns */}
        <div className="bg-purple-700/40 rounded-xl py-2 px-3 text-white shadow-lg border border-purple-500/30 flex flex-row items-center h-16">
          <div className="flex items-center justify-center mr-3 bg-pink-500/20 rounded-full p-1.5 w-8 h-8">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-pink-300" viewBox="0 0 20 20" fill="currentColor">
              <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
              <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <h3 className="text-xs uppercase tracking-wider text-purple-200">Total Cards</h3>
            <div className="text-xl font-bold text-pink-300">{totalCards}</div>
          </div>
        </div>
        
        <div className="bg-purple-700/40 rounded-xl py-2 px-3 text-white shadow-lg border border-purple-500/30 flex flex-row items-center h-16">
          <div className="flex items-center justify-center mr-3 bg-blue-500/20 rounded-full p-1.5 w-8 h-8">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-300" viewBox="0 0 20 20" fill="currentColor">
              <path d="M11 17a1 1 0 001.447.894l4-2A1 1 0 0017 15V9.236a1 1 0 00-1.447-.894l-4 2a1 1 0 00-.553.894V17zM15.211 6.276a1 1 0 000-1.788l-4.764-2.382a1 1 0 00-.894 0L4.789 4.488a1 1 0 000 1.788l4.764 2.382a1 1 0 00.894 0l4.764-2.382zM4.447 8.342A1 1 0 003 9.236V15a1 1 0 00.553.894l4 2A1 1 0 009 17v-5.764a1 1 0 00-.553-.894l-4-2z" />
            </svg>
          </div>
          <div>
            <h3 className="text-xs uppercase tracking-wider text-purple-200">Unique Cards</h3>
            <div className="text-xl font-bold text-blue-300">{uniqueCards}</div>
          </div>
        </div>
        
        <div className="bg-purple-700/40 rounded-xl py-2 px-3 text-white shadow-lg border border-purple-500/30 flex flex-row items-center h-16">
          <div className="flex items-center justify-center mr-3 bg-green-500/20 rounded-full p-1.5 w-8 h-8">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-300" viewBox="0 0 20 20" fill="currentColor">
              <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7z" />
              <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <h3 className="text-xs uppercase tracking-wider text-purple-200">Sets</h3>
            <div className="text-xl font-bold text-green-300">{totalSets}</div>
          </div>
        </div>
        
        {/* Rarity Distribution - Fourth column spans two rows */}
        <div className="bg-purple-800/40 backdrop-blur-md rounded-xl p-3 shadow-lg border border-purple-500/30 lg:row-span-2">
          <h3 className="text-xs uppercase font-semibold text-pink-300 mb-3 flex items-center">
            <div className="w-2 h-2 bg-pink-500 rounded-full mr-2"></div>
            Rarity Distribution
          </h3>
          
          <div className="space-y-3 flex flex-col justify-between h-36 lg:h-[180px]">
            {rarityData.slice(0, 4).map((entry, index) => (
              <div key={index} className="space-y-1">
                <div className="flex justify-between text-xs text-white">
                  <span>{entry.name}</span>
                  <span className="font-semibold">{entry.value}</span>
                </div>
                <div className="w-full bg-purple-900/50 rounded-full h-3 overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-500 ease-out"
                    style={{
                      width: `${Math.min(100, (entry.value / Math.max(...rarityData.map(d => d.value)) * 100))}%`,
                      background: index === 0 ? 'linear-gradient(90deg, #EC4899 0%, #F472B6 100%)' :  // Pink
                                  index === 1 ? 'linear-gradient(90deg, #8B5CF6 0%, #A78BFA 100%)' :  // Purple
                                  index === 2 ? 'linear-gradient(90deg, #3B82F6 0%, #60A5FA 100%)' :  // Blue
                                              'linear-gradient(90deg, #10B981 0%, #34D399 100%)'   // Green
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Collection Value Chart - Second row, spans first 3 columns */}
        <div className="col-span-3 bg-gradient-to-br from-purple-800/70 to-pink-900/40 backdrop-blur-md rounded-xl p-3 shadow-lg border border-purple-500/30 overflow-hidden relative h-[180px]">
          {/* Decorative background elements */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/10 rounded-full blur-xl -mt-10 -mr-10 z-0"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-500/10 rounded-full blur-xl -mb-10 -ml-5 z-0"></div>
          
          <div className="relative z-10 h-full flex flex-col">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center">
                <div className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-md p-1 mr-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                  </svg>
                </div>
                <h3 className="text-xs uppercase font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-300 to-blue-300">
                  Collection Value (€)
                </h3>
              </div>
              
              <div className="flex space-x-1">
                {['1M', '3M', '6M', '1Y'].map(period => {
                  const value = period.toLowerCase();
                  const timeframeKey = value === '1y' ? '1y' : value as '1m' | '3m' | '6m' | '1y';
                  return (
                    <button
                      key={period}
                      onClick={() => setTimeframeValue(timeframeKey)}
                      className={`px-1.5 py-0.5 rounded-md text-[10px] font-medium transition-all ${
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
            
            <div className="flex-grow">
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
                    width={30}
                  />
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-gray-900/90 backdrop-blur-md text-white px-3 py-2 rounded-md border border-gray-700 shadow-lg">
                            <p className="text-xs font-medium">{payload[0].payload.name}</p>
                            <p className="text-sm font-bold text-pink-300">€{payload[0].value}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke="url(#valueGradient)" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#valueGradient)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            
            {/* Current value indicator - Positioned inside the chart */}
            <div className="absolute bottom-1 left-0 right-0 flex justify-between items-center px-4 text-xs">
              <div className="text-purple-300 bg-purple-900/50 px-2 py-0.5 rounded">
                Total: <span className="text-white font-bold">€{valueData.length > 0 ? valueData[valueData.length - 1].value : 0}</span>
              </div>
              <div className="text-green-300 flex items-center bg-purple-900/50 px-2 py-0.5 rounded">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
                </svg>
                <span>+12.5%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Type Distribution */}
        <div className="bg-purple-800/40 backdrop-blur-md rounded-xl p-5 shadow-lg border border-purple-500/30">
          <h3 className="text-sm font-semibold text-pink-300 mb-4 flex items-center">
            <span className="inline-block w-1.5 h-1.5 bg-pink-500 rounded-full mr-2"></span>
            Type Distribution
          </h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={typeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  fill="#8884d8"
                  paddingAngle={1}
                  dataKey="value"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {typeData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={TYPE_COLORS[entry.name as keyof typeof TYPE_COLORS] || CHART_COLORS[index % CHART_COLORS.length]} 
                      stroke="rgba(255,255,255,0.3)"
                      strokeWidth={1}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Set Distribution */}
        <div className="bg-purple-800/40 backdrop-blur-md rounded-xl p-5 shadow-lg border border-purple-500/30">
          <h3 className="text-sm font-semibold text-pink-300 mb-4 flex items-center">
            <span className="inline-block w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></span>
            Set Distribution
          </h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={setData.slice(0, 5)}
                layout="vertical"
                margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis 
                  type="number" 
                  tick={{ fill: 'rgba(255,255,255,0.8)', fontSize: 10 }} 
                  axisLine={{ stroke: 'rgba(255,255,255,0.2)' }}
                  tickLine={false}
                />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  tick={{ fill: 'rgba(255,255,255,0.8)', fontSize: 10 }} 
                  axisLine={{ stroke: 'rgba(255,255,255,0.2)' }}
                  tickLine={false}
                  width={100}
                />
                <Tooltip content={<CustomTooltip />} />
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
      
      {/* Set Completion Progress */}
      <div className="bg-purple-800/40 backdrop-blur-md rounded-xl p-5 shadow-lg border border-purple-500/30">
        <h3 className="text-sm font-semibold text-pink-300 mb-4 flex items-center">
          <span className="inline-block w-1.5 h-1.5 bg-cyan-500 rounded-full mr-2"></span>
          Set Completion Progress
        </h3>
        <div className="space-y-4">
          {setData.slice(0, 5).map((set, index) => (
            <div key={set.id} className="space-y-1">
              <div className="flex justify-between items-center text-sm">
                <span className="font-medium text-white">{set.name}</span>
                <span className="text-xs text-purple-300">{set.value} cards ({Math.round(set.percent * 100)}%)</span>
              </div>
              <Progress 
                value={Math.round(set.percent * 100)} 
                className={`h-2 bg-purple-900/40 ${
                  index === 0 ? '[&>div]:bg-pink-500' :
                  index === 1 ? '[&>div]:bg-purple-500' :
                  index === 2 ? '[&>div]:bg-blue-500' :
                  index === 3 ? '[&>div]:bg-cyan-500' :
                  '[&>div]:bg-green-500'
                }`}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EnhancedStatistics;