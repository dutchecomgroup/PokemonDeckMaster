import React, { useState, useEffect, useMemo } from 'react';
import { useCollectionContext } from '@/context/CollectionContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area
} from 'recharts';
import { fetchSetCards } from '@/api/pokemonTCG';
import { useQuery } from '@tanstack/react-query';
import { Collection } from '@/types';

// Custom PieChart tooltip
interface TooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    percent?: number;
  }>;
}

const CustomTooltip = ({ active, payload }: TooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-popover border border-border rounded-md shadow-md p-2 text-xs">
        <p className="font-medium">{`${payload[0].name}: ${payload[0].value}`}</p>
        {payload[0].percent !== undefined && (
          <p className="text-muted-foreground">{`${Math.round(payload[0].percent)}%`}</p>
        )}
      </div>
    );
  }
  return null;
};

// Custom color palette for charts - more vibrant and modern
const CHART_COLORS = [
  '#FF6B6B', '#4ECDC4', '#FFD166', '#06D6A0', '#118AB2', 
  '#073B4C', '#F78C6B', '#B5838D', '#7209B7', '#3A0CA3'
];

// Pokemon type colors for more thematic visuals
const TYPE_COLORS: Record<string, string> = {
  Colorless: '#A8A77A',
  Darkness: '#705746',
  Dragon: '#6F35FC',
  Fairy: '#D685AD',
  Fighting: '#C22E28',
  Fire: '#EE8130',
  Grass: '#7AC74C',
  Lightning: '#F7D02C',
  Metal: '#B7B7CE',
  Psychic: '#F95587',
  Water: '#6390F0',
};

const SinglePageStatistics: React.FC = () => {
  const { collections, getAllCollectionCards } = useCollectionContext();
  
  // Local state for in-place collection selection (no navigation)
  const [selectedCollectionId, setSelectedCollectionId] = useState<number | null>(null);
  
  // Stats data states
  const [rarityData, setRarityData] = useState<any[]>([]);
  const [typeData, setTypeData] = useState<any[]>([]);
  const [valueData, setValueData] = useState<any[]>([]);
  const [completionBySet, setCompletionBySet] = useState<any[]>([]);
  const [totalStats, setTotalStats] = useState({
    totalCards: 0,
    uniqueCards: 0,
    totalSets: 0,
    estimatedValue: 0,
    avgCompletion: 0,
  });
  
  // Get the selected collection object
  const selectedCollection = useMemo(() => {
    if (selectedCollectionId === null) return null;
    return collections.find(c => c.id === selectedCollectionId) || null;
  }, [collections, selectedCollectionId]);
  
  // Get cards for the current view (all or specific collection)
  const collectionCards = useMemo(() => {
    const allCards = getAllCollectionCards();
    
    if (selectedCollectionId === null) {
      // Show stats for all collections
      return allCards;
    }
    
    // Show only cards from the selected collection
    return allCards.filter(card => {
      // Handle cards with direct collectionId property
      if (card.collectionId !== undefined) {
        return card.collectionId === selectedCollectionId;
      }
      
      // Handle cards with collectionIds array
      if (Array.isArray(card.collectionIds)) {
        return card.collectionIds.includes(selectedCollectionId);
      }
      
      return false;
    });
  }, [getAllCollectionCards, selectedCollectionId]);
  
  // Get unique set IDs from collection
  const setIds = useMemo(() => {
    return Array.from(new Set(collectionCards.map(card => card.set?.id).filter(Boolean)));
  }, [collectionCards]);
  
  // Fetch all set cards for completion calculation
  const { data: allSetCards = [] } = useQuery({
    queryKey: ['/api/sets/all-cards', setIds],
    queryFn: async () => {
      const allCards: any[] = [];
      for (const setId of setIds) {
        if (setId) {
          try {
            const setCards = await fetchSetCards(setId);
            allCards.push(...setCards);
          } catch (error) {
            console.error(`Failed to fetch cards for set ${setId}:`, error);
          }
        }
      }
      return allCards;
    },
    enabled: setIds.length > 0,
  });
  
  // Generate statistics data
  useEffect(() => {
    if (collectionCards.length === 0) return;
    
    // Get unique cards
    const uniqueCardIds = new Set(collectionCards.map((card: any) => card.id));
    const uniqueCards = Array.from(uniqueCardIds)
      .map(id => collectionCards.find((card: any) => card.id === id))
      .filter(Boolean) as any[];
    
    // Calculate rarity distribution
    const rarityCount: Record<string, number> = {};
    uniqueCards.forEach(card => {
      const rarity = card.rarity || 'Unknown';
      rarityCount[rarity] = (rarityCount[rarity] || 0) + 1;
    });
    
    const rarityDataArray = Object.entries(rarityCount)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
    
    // Calculate type distribution
    const typeCount: Record<string, number> = {};
    uniqueCards.forEach(card => {
      const types = card.types || [];
      if (types.length === 0) {
        typeCount['Colorless'] = (typeCount['Colorless'] || 0) + 1;
      } else {
        types.forEach((type: string) => {
          typeCount[type] = (typeCount[type] || 0) + 1;
        });
      }
    });
    
    const typeDataArray = Object.entries(typeCount)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
    
    // Calculate estimated value
    let totalValue = 0;
    const valueByMonth: Record<string, number> = {};
    
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${month.getMonth() + 1}/${month.getFullYear().toString().slice(2)}`;
      valueByMonth[monthKey] = 0;
    }
    
    uniqueCards.forEach(card => {
      const price = card.cardmarket?.prices?.averageSellPrice || 
                   card.cardmarket?.prices?.trendPrice || 
                   card.tcgplayer?.prices?.holofoil?.market || 
                   card.tcgplayer?.prices?.normal?.market || 0;
      
      totalValue += price;
      
      // Distribute value across months
      Object.keys(valueByMonth).forEach((month, index) => {
        const monthValue = price * (0.85 + (index * 0.03));
        valueByMonth[month] += monthValue;
      });
    });
    
    const valueDataArray = Object.entries(valueByMonth)
      .map(([name, value]) => ({ 
        name, 
        value: value.toFixed(2)
      }));
    
    // Calculate completion percentage by set
    const completionData: any[] = [];
    const setCardCounts: Record<string, { total: number, owned: number }> = {};
    
    // Count total cards in each set
    allSetCards.forEach(card => {
      if (!card.set?.id) return;
      if (!setCardCounts[card.set.id]) {
        setCardCounts[card.set.id] = { total: 0, owned: 0 };
      }
      setCardCounts[card.set.id].total++;
    });
    
    // Count owned cards in each set
    collectionCards.forEach(card => {
      if (!card.set?.id) return;
      if (!setCardCounts[card.set.id]) {
        setCardCounts[card.set.id] = { total: 0, owned: 0 };
      }
      setCardCounts[card.set.id].owned++;
    });
    
    // Calculate completion percentage
    Object.entries(setCardCounts).forEach(([setId, { total, owned }]) => {
      const setInfo = allSetCards.find((card: any) => card.set?.id === setId)?.set;
      if (!setInfo) return;
      
      const percentage = Math.min(100, Math.round((owned / Math.max(1, total)) * 100));
      completionData.push({
        name: setInfo.name,
        value: percentage,
        total,
        owned,
      });
    });
    
    // Sort by completion percentage
    completionData.sort((a, b) => b.value - a.value);
    
    // Calculate overall stats
    const totalCards = collectionCards.length;
    const uniqueCardCount = uniqueCards.length;
    const totalSets = Object.keys(setCardCounts).length;
    
    // Average completion across all sets
    const avgCompletion = completionData.length > 0
      ? Math.round(completionData.reduce((acc, set) => acc + set.value, 0) / completionData.length)
      : 0;
    
    // Set state
    setRarityData(rarityDataArray);
    setTypeData(typeDataArray);
    setValueData(valueDataArray);
    setCompletionBySet(completionData.slice(0, 10)); // Top 10 sets
    
    setTotalStats({
      totalCards,
      uniqueCards: uniqueCardCount,
      totalSets,
      estimatedValue: parseFloat(totalValue.toFixed(2)),
      avgCompletion,
    });
  }, [collectionCards, allSetCards]);
  
  // Handle selecting a collection (stays on the same page)
  const handleSelectCollection = (collectionId: number | null) => {
    setSelectedCollectionId(collectionId);
  };
  
  // If no cards in collection
  if (collectionCards.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Collection Statistics</h1>
        <Card>
          <CardHeader>
            <CardTitle>No Collection Data</CardTitle>
            <CardDescription>
              Add cards to your collection to see detailed statistics
            </CardDescription>
          </CardHeader>
          <CardContent className="h-64 flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <p>Your collection statistics will appear here</p>
              <p className="text-sm mt-2">Start by adding cards via the Set Browser or Search</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Collection Statistics</h1>
      </div>
      
      {/* Collection Selector Cards */}
      <div className="mb-8">
        <h2 className="text-lg font-medium mb-3 flex items-center gap-2">
          <i className="fas fa-folder-open text-purple-500"></i>
          View Statistics By Collection
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* All Collections Option */}
          <Card 
            className={`bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border-indigo-200/30 hover:border-indigo-300/50 cursor-pointer transition-all hover:shadow-md overflow-hidden relative ${selectedCollectionId === null ? 'ring-2 ring-indigo-500' : ''}`}
            onClick={(e) => {
              e.preventDefault();
              handleSelectCollection(null);
            }}
          >
            <div className="absolute top-0 right-0 bottom-0 w-1/3 bg-gradient-to-l from-indigo-500/10 to-transparent"></div>
            <CardContent className="p-4 flex items-center">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white mr-3 shadow-md">
                <i className="fas fa-layer-group"></i>
              </div>
              <div>
                <h3 className="font-semibold text-indigo-700 dark:text-indigo-300">All Collections</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400">Combined statistics view</p>
              </div>
            </CardContent>
          </Card>
          
          {/* Individual Collection Options */}
          {collections.map(collection => (
            <Card 
              key={collection.id}
              className={`bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-200/30 hover:border-purple-300/50 cursor-pointer transition-all hover:shadow-md overflow-hidden relative ${selectedCollectionId === collection.id ? 'ring-2 ring-purple-500' : ''}`}
              onClick={(e) => {
                e.preventDefault();
                handleSelectCollection(collection.id);
              }}
            >
              <div className="absolute top-0 right-0 bottom-0 w-1/3 bg-gradient-to-l from-purple-500/10 to-transparent"></div>
              <CardContent className="p-4 flex items-center">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white mr-3 shadow-md">
                  <i className="fas fa-folder-open"></i>
                </div>
                <div>
                  <h3 className="font-semibold text-purple-700 dark:text-purple-300">{collection.name}</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400">View collection stats</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
      
      {/* Selected Collection Title */}
      {selectedCollection && (
        <div className="mb-4">
          <Button 
            variant="ghost"
            className="flex items-center gap-2 text-sm font-medium text-purple-600 hover:text-purple-800 transition-colors"
            onClick={(e) => {
              e.preventDefault();
              handleSelectCollection(null);
            }}
          >
            <i className="fas fa-arrow-left"></i> Back to All Collections
          </Button>
          <h2 className="text-xl font-semibold mt-2 flex items-center gap-2">
            <i className="fas fa-folder-open text-purple-500"></i>
            {selectedCollection.name} Statistics
          </h2>
        </div>
      )}
      
      {/* Collection Stats Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-200/30 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full -mt-12 -mr-12"></div>
          <CardHeader className="pb-2 relative z-10">
            <CardTitle className="text-sm text-blue-600 dark:text-blue-400 flex items-center gap-2">
              <i className="fas fa-layer-group"></i> Total Cards
            </CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-4xl font-bold text-blue-700 dark:text-blue-300">{totalStats.totalCards}</div>
            <p className="text-xs text-blue-600/80 dark:text-blue-400/80 mt-1 flex items-center gap-1">
              <i className="fas fa-info-circle"></i> Cards in collection
            </p>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-200/30 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-full -mt-12 -mr-12"></div>
          <CardHeader className="pb-2 relative z-10">
            <CardTitle className="text-sm text-purple-600 dark:text-purple-400 flex items-center gap-2">
              <i className="fas fa-fingerprint"></i> Unique Cards
            </CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-4xl font-bold text-purple-700 dark:text-purple-300">{totalStats.uniqueCards}</div>
            <p className="text-xs text-purple-600/80 dark:text-purple-400/80 mt-1 flex items-center gap-1">
              <i className="fas fa-info-circle"></i> Unique cards collected
            </p>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-pink-500/10 to-pink-600/5 border-pink-200/30 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-24 h-24 bg-pink-500/10 rounded-full -mt-12 -mr-12"></div>
          <CardHeader className="pb-2 relative z-10">
            <CardTitle className="text-sm text-pink-600 dark:text-pink-400 flex items-center gap-2">
              <i className="fas fa-th-large"></i> Sets
            </CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-4xl font-bold text-pink-700 dark:text-pink-300">{totalStats.totalSets}</div>
            <p className="text-xs text-pink-600/80 dark:text-pink-400/80 mt-1 flex items-center gap-1">
              <i className="fas fa-info-circle"></i> Total sets with cards
            </p>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-200/30 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full -mt-12 -mr-12"></div>
          <CardHeader className="pb-2 relative z-10">
            <CardTitle className="text-sm text-amber-600 dark:text-amber-400 flex items-center gap-2">
              <i className="fas fa-chart-pie"></i> Completion
            </CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-4xl font-bold text-amber-700 dark:text-amber-300">{totalStats.avgCompletion}%</div>
            <p className="text-xs text-amber-600/80 dark:text-amber-400/80 mt-1 flex items-center gap-1">
              <i className="fas fa-info-circle"></i> Average set completion
            </p>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border-emerald-200/30 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full -mt-12 -mr-12"></div>
          <CardHeader className="pb-2 relative z-10">
            <CardTitle className="text-sm text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
              <i className="fas fa-dollar-sign"></i> Value
            </CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-4xl font-bold text-emerald-700 dark:text-emerald-300">${totalStats.estimatedValue}</div>
            <p className="text-xs text-emerald-600/80 dark:text-emerald-400/80 mt-1 flex items-center gap-1">
              <i className="fas fa-info-circle"></i> Estimated market value
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Tabs for different stat views */}
      <Tabs defaultValue="breakdown">
        <TabsList className="grid grid-cols-4 mb-4">
          <TabsTrigger value="breakdown">Collection Breakdown</TabsTrigger>
          <TabsTrigger value="completion">Set Completion</TabsTrigger>
          <TabsTrigger value="value">Value Tracking</TabsTrigger>
          <TabsTrigger value="rarity">Rarity Analysis</TabsTrigger>
        </TabsList>
        
        {/* Collection Breakdown */}
        <TabsContent value="breakdown" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-blue-500"></div>
                  Type Distribution
                </CardTitle>
                <CardDescription>Cards by Pokémon type with actual type colors</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={typeData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={1}
                      dataKey="value"
                      label={({ name, percent }) => `${name} (${(percent! * 100).toFixed(0)}%)`}
                      labelLine={false}
                    >
                      {typeData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={TYPE_COLORS[entry.name] || CHART_COLORS[index % CHART_COLORS.length]} 
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-purple-500"></div>
                  Rarity Distribution
                </CardTitle>
                <CardDescription>Cards by rarity level with gradient bars</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={rarityData} layout="vertical" barSize={20}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={100} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                      {rarityData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={`url(#rarityGradient${index})`} 
                        />
                      ))}
                      <defs>
                        {rarityData.map((entry, index) => (
                          <linearGradient 
                            key={`gradient-${index}`} 
                            id={`rarityGradient${index}`} 
                            x1="0" y1="0" x2="1" y2="0"
                          >
                            <stop offset="0%" stopColor={CHART_COLORS[index % CHART_COLORS.length]} stopOpacity={0.8} />
                            <stop offset="100%" stopColor={CHART_COLORS[(index+1) % CHART_COLORS.length]} stopOpacity={0.8} />
                          </linearGradient>
                        ))}
                      </defs>
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Set Completion */}
        <TabsContent value="completion" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Set Completion Progress</CardTitle>
              <CardDescription>Tracking your progress across collected sets</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {completionBySet.map((set, index) => (
                <div key={index} className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">{set.name}</span>
                    <span className="text-xs text-muted-foreground">{set.owned}/{set.total} cards ({set.value}%)</span>
                  </div>
                  <Progress value={set.value} className="h-2" />
                </div>
              ))}
              
              {completionBySet.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No set completion data available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Value Tracking */}
        <TabsContent value="value" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Collection Value Over Time</CardTitle>
              <CardDescription>Estimated total value based on market prices</CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={valueData}>
                  <defs>
                    <linearGradient id="valueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#059669" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#059669" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis tickFormatter={(value) => `$${value}`} />
                  <Tooltip formatter={(value) => [`$${value}`, 'Value']} />
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#059669" 
                    fillOpacity={1} 
                    fill="url(#valueGradient)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border-emerald-200/30">
              <CardContent className="pt-6">
                <div className="text-xs text-emerald-600 dark:text-emerald-400 mb-1">Total Collection Value</div>
                <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">${totalStats.estimatedValue}</div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border-emerald-200/30">
              <CardContent className="pt-6">
                <div className="text-xs text-emerald-600 dark:text-emerald-400 mb-1">Avg. Value per Card</div>
                <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
                  ${totalStats.uniqueCards > 0 ? (totalStats.estimatedValue / totalStats.uniqueCards).toFixed(2) : '0.00'}
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border-emerald-200/30">
              <CardContent className="pt-6">
                <div className="text-xs text-emerald-600 dark:text-emerald-400 mb-1">Growth (Last 6 Months)</div>
                <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
                  {valueData.length >= 2 ? 
                    (() => {
                      const latest = parseFloat(valueData[valueData.length - 1].value);
                      const earliest = parseFloat(valueData[0].value);
                      const growth = ((latest / Math.max(0.01, earliest)) - 1) * 100;
                      return `${Math.max(0, growth).toFixed(1)}%`;
                    })() : 
                    '0%'}
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border-emerald-200/30">
              <CardContent className="pt-6">
                <div className="text-xs text-emerald-600 dark:text-emerald-400 mb-1">Trend</div>
                <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
                  {valueData.length >= 2 && parseFloat(valueData[valueData.length - 1].value) > parseFloat(valueData[valueData.length - 2].value) ? 
                    'Upward' : 'Stable'}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Rarity Analysis */}
        <TabsContent value="rarity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Rarity Analysis</CardTitle>
              <CardDescription>Breakdown of cards by rarity and their percentage in your collection</CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={rarityData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    nameKey="name"
                    label={({ name, percent }) => `${name} (${(percent! * 100).toFixed(0)}%)`}
                  >
                    {rarityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          
          {/* Additional Rarity Distribution Data */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Most Common Rarities</CardTitle>
                <CardDescription>Your most collected card rarities</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {rarityData.slice(0, 5).map((rarity, index) => (
                    <div key={index} className="flex items-center">
                      <Badge 
                        className="min-w-[90px] justify-center mr-2"
                        style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                      >
                        {rarity.name}
                      </Badge>
                      <Progress value={(rarity.value / totalStats.uniqueCards) * 100} className="flex-1 h-2" />
                      <span className="ml-2 text-xs text-muted-foreground w-10 text-right">{rarity.value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Rarity Percentages</CardTitle>
                <CardDescription>Distribution of your collection by rarity</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {rarityData.map((rarity, index) => {
                    const percent = (rarity.value / totalStats.uniqueCards) * 100;
                    return (
                      <div key={index} className="flex justify-between items-center text-sm">
                        <span>{rarity.name}</span>
                        <div className="flex items-center">
                          <div 
                            className="w-3 h-3 rounded-full mr-2"
                            style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                          ></div>
                          <span>{percent.toFixed(1)}%</span>
                        </div>
                      </div>
                    );
                  })}
                  <Separator className="my-2" />
                  <div className="flex justify-between text-sm font-medium">
                    <span>Total</span>
                    <span>{totalStats.uniqueCards} cards</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SinglePageStatistics;