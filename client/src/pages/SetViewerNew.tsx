import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Grid, List, Filter, Search, Plus, Check, X, Star, Heart, Eye, Loader2, ChevronDown } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { fetchSet, fetchSetCards } from '@/api/pokemonTCG';
import { useCollectionContext } from '@/context/CollectionContext';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import OptimisticCard from '@/components/OptimisticCard';

interface PokemonCard {
  id: string;
  name: string;
  images: {
    small: string;
    large: string;
  };
  rarity?: string;
  set: {
    name: string;
    id: string;
  };
  types?: string[];
  hp?: string;
  number: string;
  artist?: string;
  flavorText?: string;
}

interface PokemonSet {
  id: string;
  name: string;
  series: string;
  total: number;
  releaseDate: string;
  images: {
    logo: string;
    symbol: string;
  };
}

const SetViewerNew: React.FC = () => {
  const { setId } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { collections, addCardToCollection, removeCardFromCollection } = useCollectionContext();
  
  // View and filter states
  const [viewMode, setViewMode] = useState<'grid' | 'compact'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedRarity, setSelectedRarity] = useState('all');
  const [sortBy, setSortBy] = useState('number');
  const [showOnlyOwned, setShowOnlyOwned] = useState(false);
  const [selectedCard, setSelectedCard] = useState<PokemonCard | null>(null);
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  
  // Fetch set data
  const { data: set, isLoading: isLoadingSet } = useQuery<PokemonSet>({
    queryKey: [`/api/sets/${setId}`],
    queryFn: () => fetchSet(setId || ''),
    enabled: !!setId
  });

  // Fetch set cards
  const { data: cards = [], isLoading: isLoadingCards } = useQuery<PokemonCard[]>({
    queryKey: [`/api/cards/set/${setId}`],
    queryFn: () => fetchSetCards(setId || ''),
    enabled: !!setId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Get unique types and rarities for filters
  const availableTypes = useMemo(() => {
    const types = new Set<string>();
    cards.forEach(card => {
      card.types?.forEach(type => types.add(type));
    });
    return Array.from(types).sort();
  }, [cards]);

  const availableRarities = useMemo(() => {
    const rarities = new Set<string>();
    cards.forEach(card => {
      if (card.rarity) rarities.add(card.rarity);
    });
    return Array.from(rarities).sort();
  }, [cards]);

  // Filter and sort cards
  const filteredAndSortedCards = useMemo(() => {
    let filtered = cards.filter(card => {
      // Search filter
      if (searchQuery && !card.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      
      // Type filter
      if (selectedType !== 'all' && !card.types?.includes(selectedType)) {
        return false;
      }
      
      // Rarity filter
      if (selectedRarity !== 'all' && card.rarity !== selectedRarity) {
        return false;
      }
      
      // Owned filter
      if (showOnlyOwned) {
        const isOwned = collections.some(collection => 
          collection.cards?.some(collectionCard => collectionCard.cardId === card.id)
        );
        if (!isOwned) return false;
      }
      
      return true;
    });

    // Sort cards
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'rarity':
          return (a.rarity || '').localeCompare(b.rarity || '');
        case 'type':
          return (a.types?.[0] || '').localeCompare(b.types?.[0] || '');
        case 'number':
        default:
          return parseInt(a.number) - parseInt(b.number);
      }
    });

    return filtered;
  }, [cards, searchQuery, selectedType, selectedRarity, sortBy, showOnlyOwned, collections]);

  // Check if card is in any collection
  const isCardInCollection = (cardId: string) => {
    // This will be implemented with proper collection card checking
    return false; // Placeholder for now
  };

  // Get card quantity across all collections
  const getCardQuantity = (cardId: string) => {
    // This will be implemented with proper collection card checking
    return 0; // Placeholder for now
  };

  // Add card to first collection (or create new logic)
  const handleAddCard = async (card: PokemonCard) => {
    if (collections.length === 0) {
      toast({
        title: "No collections found",
        description: "Please create a collection first to add cards.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Add to first collection for now - you can enhance this with collection selection
      await addCardToCollection(collections[0].id, card.id);
      toast({
        title: "Card added!",
        description: `${card.name} has been added to your collection.`,
      });
    } catch (error) {
      toast({
        title: "Error adding card",
        description: "There was a problem adding the card to your collection.",
        variant: "destructive",
      });
    }
  };

  // Remove card from collection
  const handleRemoveCard = async (card: PokemonCard) => {
    if (collections.length === 0) return;

    try {
      // Remove from first collection - simplified for now
      await removeCardFromCollection(collections[0].id, card.id);
      toast({
        title: "Card removed!",
        description: `${card.name} has been removed from your collection.`,
      });
    } catch (error) {
      toast({
        title: "Error removing card",
        description: "There was a problem removing the card from your collection.",
        variant: "destructive",
      });
    }
  };

  const openCardDetail = (card: PokemonCard) => {
    setSelectedCard(card);
    setIsCardModalOpen(true);
  };

  if (isLoadingSet || isLoadingCards) {
    return (
      <div className="min-h-screen bg-slate-900 text-white">
        {/* Mobile Loading - Clean and Consistent */}
        <div className="lg:hidden">
          <div className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 p-6">
            <div className="animate-pulse">
              <div className="h-6 bg-slate-700 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-slate-700 rounded w-1/2"></div>
            </div>
          </div>
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin text-purple-500 mx-auto mb-4" />
              <p className="text-slate-400 text-sm">Loading cards...</p>
            </div>
          </div>
        </div>

        {/* Desktop Loading */}
        <div className="hidden lg:flex h-screen">
          <div className="w-80 bg-slate-800 border-r border-slate-700">
            <Sidebar />
          </div>
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Loader2 className="w-12 h-12 animate-spin text-purple-500 mx-auto mb-4" />
              <h2 className="text-2xl font-semibold text-white mb-2">Loading Set...</h2>
              <p className="text-slate-400">Fetching cards and set information</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen lg:h-screen lg:flex bg-slate-900 text-white">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block w-80 bg-slate-800 border-r border-slate-700 overflow-y-auto">
        <Sidebar />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:overflow-hidden">
        {/* Header - Mobile Optimized */}
        <div className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 border-b border-slate-700 p-4 lg:p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            {/* Set Info */}
            <div className="flex items-center space-x-3 lg:space-x-4">
              {set?.images?.symbol && (
                <img 
                  src={set.images.symbol} 
                  alt={set.name}
                  className="w-8 h-8 lg:w-12 lg:h-12 object-contain flex-shrink-0"
                />
              )}
              <div className="min-w-0 flex-1">
                <h1 className="text-xl lg:text-3xl font-bold text-white truncate">{set?.name}</h1>
                <div className="flex flex-wrap items-center gap-2 lg:gap-4 mt-1 lg:mt-2">
                  <Badge className="bg-purple-600/20 text-purple-300 border-purple-500/30 text-xs">
                    {set?.series}
                  </Badge>
                  <span className="text-slate-400 text-xs lg:text-sm">
                    {filteredAndSortedCards.length} of {set?.total} cards
                  </span>
                  <span className="text-slate-400 text-xs lg:text-sm hidden sm:inline">
                    Released: {set?.releaseDate}
                  </span>
                </div>
              </div>
            </div>
            
            {/* View Toggle - Mobile Friendly */}
            <div className="flex items-center justify-center lg:justify-end">
              <div className="flex items-center space-x-1 bg-slate-800/50 rounded-lg p-1">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className={cn(
                    "transition-all duration-200 text-xs lg:text-sm px-2 lg:px-3",
                    viewMode === 'grid' 
                      ? "bg-purple-600 hover:bg-purple-700 text-white" 
                      : "text-slate-400 hover:text-white hover:bg-slate-700"
                  )}
                >
                  <Grid className="w-3 h-3 lg:w-4 lg:h-4 mr-1 lg:mr-2" />
                  Grid
                </Button>
                <Button
                  variant={viewMode === 'compact' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('compact')}
                  className={cn(
                    "transition-all duration-200 text-xs lg:text-sm px-2 lg:px-3",
                    viewMode === 'compact' 
                      ? "bg-purple-600 hover:bg-purple-700 text-white" 
                      : "text-slate-400 hover:text-white hover:bg-slate-700"
                  )}
                >
                  <List className="w-3 h-3 lg:w-4 lg:h-4 mr-1 lg:mr-2" />
                  Compact
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile-First Filters Bar */}
        <div className="bg-slate-800/50 border-b border-slate-700">
          {/* Mobile Filter Header */}
          <div className="lg:hidden p-3">
            <div className="flex items-center gap-3">
              {/* Search - Mobile */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input
                  placeholder="Search cards..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-slate-700 border-slate-600 text-white placeholder-slate-400 focus:ring-purple-500 focus:border-purple-500 h-9"
                />
              </div>
              
              {/* Filter Toggle Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsFiltersOpen(!isFiltersOpen)}
                className="border-slate-600 text-slate-400 hover:text-white hover:border-slate-500 h-9 px-3 flex-shrink-0"
              >
                <Filter className="w-4 h-4 mr-2" />
                <span className="text-xs">
                  {(selectedType !== 'all' || selectedRarity !== 'all' || showOnlyOwned) ? 'Filters*' : 'Filters'}
                </span>
                <ChevronDown className={cn(
                  "w-3 h-3 ml-2 transition-transform duration-200",
                  isFiltersOpen && "rotate-180"
                )} />
              </Button>
            </div>

            {/* Mobile Filter Panel - Collapsible */}
            <AnimatePresence>
              {isFiltersOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="pt-3 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      {/* Type Filter */}
                      <Select value={selectedType} onValueChange={setSelectedType}>
                        <SelectTrigger className="bg-slate-700 border-slate-600 text-white text-xs h-9">
                          <SelectValue placeholder="Type" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-700 border-slate-600">
                          <SelectItem value="all">All Types</SelectItem>
                          {availableTypes.map(type => (
                            <SelectItem key={type} value={type}>{type}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {/* Rarity Filter */}
                      <Select value={selectedRarity} onValueChange={setSelectedRarity}>
                        <SelectTrigger className="bg-slate-700 border-slate-600 text-white text-xs h-9">
                          <SelectValue placeholder="Rarity" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-700 border-slate-600">
                          <SelectItem value="all">All Rarities</SelectItem>
                          {availableRarities.map(rarity => (
                            <SelectItem key={rarity} value={rarity}>{rarity}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {/* Sort */}
                      <Select value={sortBy} onValueChange={setSortBy}>
                        <SelectTrigger className="bg-slate-700 border-slate-600 text-white text-xs h-9">
                          <SelectValue placeholder="Sort by" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-700 border-slate-600">
                          <SelectItem value="number">Number</SelectItem>
                          <SelectItem value="name">Name</SelectItem>
                          <SelectItem value="rarity">Rarity</SelectItem>
                          <SelectItem value="type">Type</SelectItem>
                        </SelectContent>
                      </Select>

                      {/* Owned Filter */}
                      <Button
                        variant={showOnlyOwned ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setShowOnlyOwned(!showOnlyOwned)}
                        className={cn(
                          "transition-all duration-200 text-xs h-9",
                          showOnlyOwned 
                            ? "bg-green-600 hover:bg-green-700 text-white border-green-600" 
                            : "border-slate-600 text-slate-400 hover:text-white hover:border-slate-500"
                        )}
                      >
                        <Check className="w-3 h-3 mr-2" />
                        Owned Only
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Desktop Filters - Full Width */}
          <div className="hidden lg:block p-4">
            <div className="flex flex-wrap items-center gap-4">
              {/* Search - Desktop */}
              <div className="relative flex-1 min-w-[300px]">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input
                  placeholder="Search cards..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-slate-700 border-slate-600 text-white placeholder-slate-400 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>

              {/* Type Filter */}
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="w-[140px] bg-slate-700 border-slate-600 text-white">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600">
                  <SelectItem value="all">All Types</SelectItem>
                  {availableTypes.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Rarity Filter */}
              <Select value={selectedRarity} onValueChange={setSelectedRarity}>
                <SelectTrigger className="w-[140px] bg-slate-700 border-slate-600 text-white">
                  <SelectValue placeholder="Rarity" />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600">
                  <SelectItem value="all">All Rarities</SelectItem>
                  {availableRarities.map(rarity => (
                    <SelectItem key={rarity} value={rarity}>{rarity}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Sort */}
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[140px] bg-slate-700 border-slate-600 text-white">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600">
                  <SelectItem value="number">Number</SelectItem>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="rarity">Rarity</SelectItem>
                  <SelectItem value="type">Type</SelectItem>
                </SelectContent>
              </Select>

              {/* Owned Filter */}
              <Button
                variant={showOnlyOwned ? 'default' : 'outline'}
                size="sm"
                onClick={() => setShowOnlyOwned(!showOnlyOwned)}
                className={cn(
                  "transition-all duration-200",
                  showOnlyOwned 
                    ? "bg-green-600 hover:bg-green-700 text-white border-green-600" 
                    : "border-slate-600 text-slate-400 hover:text-white hover:border-slate-500"
                )}
              >
                <Check className="w-4 h-4 mr-2" />
                Owned Only
              </Button>
            </div>
          </div>
        </div>

        {/* Cards Content - Perfect Mobile Layout */}
        <div className="flex-1 lg:overflow-y-auto p-3 lg:p-6 pb-24 lg:pb-6">
          {filteredAndSortedCards.length === 0 ? (
            <div className="text-center py-12 lg:py-16">
              <Search className="w-12 h-12 lg:w-16 lg:h-16 text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg lg:text-xl font-semibold text-white mb-2">No cards found</h3>
              <p className="text-slate-400 text-sm lg:text-base px-4">Try adjusting your filters or search term</p>
            </div>
          ) : (
            <div className={cn(
              "grid",
              viewMode === 'grid' 
                ? "grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7" 
                : "grid-cols-3 gap-2 sm:grid-cols-4 sm:gap-3 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 2xl:grid-cols-12"
            )}>
              {filteredAndSortedCards.map((card) => (
                <OptimisticCard
                  key={card.id}
                  card={card}
                  viewMode={viewMode}
                  onCardClick={openCardDetail}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Card Detail Modal - Mobile Optimized */}
      <Dialog open={isCardModalOpen} onOpenChange={setIsCardModalOpen}>
        <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] bg-slate-800 border-slate-700 text-white overflow-y-auto">
          {selectedCard && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
              {/* Card Image */}
              <div className="space-y-4 flex justify-center md:justify-start">
                <img
                  src={selectedCard.images.large}
                  alt={selectedCard.name}
                  className="w-full max-w-[280px] md:max-w-none rounded-lg shadow-2xl"
                />
              </div>
              
              {/* Card Details */}
              <div className="space-y-4">
                <DialogHeader>
                  <DialogTitle className="text-xl lg:text-2xl font-bold text-white">
                    {selectedCard.name}
                  </DialogTitle>
                </DialogHeader>
                
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2 lg:gap-4">
                    <Badge className="bg-purple-600/20 text-purple-300 border-purple-500/30 text-xs lg:text-sm">
                      #{selectedCard.number}
                    </Badge>
                    {selectedCard.rarity && (
                      <Badge className="bg-slate-700 text-slate-300 border-slate-600 text-xs lg:text-sm">
                        {selectedCard.rarity}
                      </Badge>
                    )}
                  </div>
                  
                  {selectedCard.hp && (
                    <div className="text-slate-300 text-sm lg:text-base">
                      <strong>HP:</strong> {selectedCard.hp}
                    </div>
                  )}
                  
                  {selectedCard.types && (
                    <div className="text-slate-300 text-sm lg:text-base">
                      <strong>Type:</strong> {selectedCard.types.join(', ')}
                    </div>
                  )}
                  
                  {selectedCard.artist && (
                    <div className="text-slate-300 text-sm lg:text-base">
                      <strong>Artist:</strong> {selectedCard.artist}
                    </div>
                  )}
                  
                  {selectedCard.flavorText && (
                    <div className="text-slate-300 text-sm lg:text-base">
                      <strong>Flavor Text:</strong> {selectedCard.flavorText}
                    </div>
                  )}
                </div>
                
                {/* Action Buttons - Mobile Optimized */}
                <div className="flex flex-col sm:flex-row gap-2 lg:gap-3 pt-4">
                  {isCardInCollection(selectedCard.id) ? (
                    <Button
                      variant="destructive"
                      onClick={() => {
                        handleRemoveCard(selectedCard);
                        setIsCardModalOpen(false);
                      }}
                      className="flex-1 h-10 lg:h-11 text-sm lg:text-base"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Remove from Collection
                    </Button>
                  ) : (
                    <Button
                      className="flex-1 h-10 lg:h-11 text-sm lg:text-base bg-purple-600 hover:bg-purple-700"
                      onClick={() => {
                        handleAddCard(selectedCard);
                        setIsCardModalOpen(false);
                      }}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SetViewerNew;