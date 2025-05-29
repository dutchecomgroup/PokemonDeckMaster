import React, { useState, useEffect, useMemo } from 'react';
import { 
  Card, 
  searchCards, 
  fetchTypes, 
  fetchRarities, 
  fetchSets, 
  Set as CardSet 
} from '@/api/pokemonTCG';
import CardItem from '@/components/CardItem';
import { useCollectionContext } from '@/context/CollectionContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Loader2, Search, X, ArrowUpDown, SortAsc, SortDesc } from 'lucide-react';
import CardDetail from '@/components/CardDetail';
import Sidebar from '@/components/Sidebar';
import { useQuery } from '@tanstack/react-query';
import { useDebounce } from '@/hooks/useDebounce';

const SimpleSearch: React.FC = () => {
  // Get the query from URL params
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedRarity, setSelectedRarity] = useState('');
  const [selectedSet, setSelectedSet] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<Card[]>([]);
  const [totalCards, setTotalCards] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  // Create debounced values for live search
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const debouncedType = useDebounce(selectedType, 300);
  const debouncedRarity = useDebounce(selectedRarity, 300);
  const debouncedSet = useDebounce(selectedSet, 300);
  
  // State for card detail modal
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  // State for sorting options
  const [sortOption, setSortOption] = useState('name-asc');
  
  const { getCardQuantity } = useCollectionContext();
  
  // Fetch filter data
  const { data: types = [] } = useQuery({
    queryKey: ['pokemon-tcg-types'],
    queryFn: () => fetchTypes()
  });
  
  const { data: rarities = [] } = useQuery({
    queryKey: ['pokemon-tcg-rarities'],
    queryFn: () => fetchRarities()
  });
  
  const { data: sets = [] } = useQuery({
    queryKey: ['pokemon-tcg-sets'],
    queryFn: () => fetchSets()
  });
  
  // Extract search parameters from URL on load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const query = params.get('query');
    const type = params.get('type');
    const rarity = params.get('rarity');
    const set = params.get('set');
    
    if (query) setSearchQuery(query);
    if (type) setSelectedType(type);
    if (rarity) setSelectedRarity(rarity);
    if (set) setSelectedSet(set);
    
    if (query || type || rarity || set) {
      performSearch(
        query || '', 
        type ? [type] : [], 
        rarity || '', 
        set || ''
      );
    }
  }, []);
  
  // For live search - react to changes in debounced search parameters
  useEffect(() => {
    if (debouncedSearchQuery || debouncedType || debouncedRarity || debouncedSet) {
      // Update URL to reflect the search
      const url = new URL(window.location.href);
      if (debouncedSearchQuery) url.searchParams.set('query', debouncedSearchQuery);
      else url.searchParams.delete('query');
      
      if (debouncedType && debouncedType !== 'all') url.searchParams.set('type', debouncedType);
      else url.searchParams.delete('type');
      
      if (debouncedRarity && debouncedRarity !== 'all') url.searchParams.set('rarity', debouncedRarity);
      else url.searchParams.delete('rarity');
      
      if (debouncedSet && debouncedSet !== 'all') url.searchParams.set('set', debouncedSet);
      else url.searchParams.delete('set');
      
      window.history.pushState({}, '', url);
      
      performSearch(
        debouncedSearchQuery, 
        debouncedType && debouncedType !== 'all' ? [debouncedType] : [], 
        debouncedRarity !== 'all' ? debouncedRarity : '', 
        debouncedSet !== 'all' ? debouncedSet : ''
      );
    }
  }, [debouncedSearchQuery, debouncedType, debouncedRarity, debouncedSet]);
  
  // Handle sidebar search
  const handleSidebarSearch = (query: string, type: string, rarity: string) => {
    setSearchQuery(query);
    setSelectedType(type || 'all');
    setSelectedRarity(rarity || 'all');
    
    // Update URL to reflect the search
    const url = new URL(window.location.href);
    if (query) url.searchParams.set('query', query);
    else url.searchParams.delete('query');
    
    if (type) url.searchParams.set('type', type);
    else url.searchParams.delete('type');
    
    if (rarity) url.searchParams.set('rarity', rarity);
    else url.searchParams.delete('rarity');
    
    window.history.pushState({}, '', url);
    
    performSearch(
      query, 
      type && type !== 'all' ? [type] : [], 
      rarity !== 'all' ? rarity : '', 
      selectedSet !== 'all' ? selectedSet : ''
    );
  };
  
  // Handle search form submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Update URL to reflect the search
    const url = new URL(window.location.href);
    if (searchQuery) url.searchParams.set('query', searchQuery);
    else url.searchParams.delete('query');
    
    if (selectedType) url.searchParams.set('type', selectedType);
    else url.searchParams.delete('type');
    
    if (selectedRarity) url.searchParams.set('rarity', selectedRarity);
    else url.searchParams.delete('rarity');
    
    if (selectedSet) url.searchParams.set('set', selectedSet);
    else url.searchParams.delete('set');
    
    window.history.pushState({}, '', url);
    
    performSearch(
      searchQuery, 
      selectedType && selectedType !== 'all' ? [selectedType] : [], 
      selectedRarity !== 'all' ? selectedRarity : '', 
      selectedSet !== 'all' ? selectedSet : ''
    );
  };
  
  // Reset all filters
  const handleReset = () => {
    setSearchQuery('');
    setSelectedType('');
    setSelectedRarity('');
    setSelectedSet('');
    
    // Clear URL parameters
    const url = new URL(window.location.href);
    url.search = '';
    window.history.pushState({}, '', url);
    
    // Clear search results
    setSearchResults([]);
    setTotalCards(0);
  };
  
  // Perform the actual search
  const performSearch = async (
    query: string, 
    types: string[] = [], 
    rarity: string = '',
    setId: string = ''
  ) => {
    if (!query && types.length === 0 && !rarity && !setId) {
      // No search criteria provided, don't search
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const results = await searchCards(query, types, rarity, 1, 100, setId);
      setSearchResults(results.data || []);
      setTotalCards(results.totalCount || results.data.length);
      console.log('Search completed:', results);
    } catch (err) {
      console.error('Search failed:', err);
      setError('Failed to search for cards. Please try again.');
      setSearchResults([]);
      setTotalCards(0);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Create sorted search results based on sort option
  const sortedResults = useMemo(() => {
    if (!searchResults.length) return [];
    
    const results = [...searchResults];
    
    switch (sortOption) {
      case 'name-asc':
        return results.sort((a, b) => a.name.localeCompare(b.name));
      case 'name-desc':
        return results.sort((a, b) => b.name.localeCompare(a.name));
      case 'number-asc':
        return results.sort((a, b) => {
          // Extract numeric part from card number for proper sorting
          const aNum = a.number ? parseInt(a.number.replace(/\D/g, '')) || 0 : 0;
          const bNum = b.number ? parseInt(b.number.replace(/\D/g, '')) || 0 : 0;
          return aNum - bNum;
        });
      case 'number-desc':
        return results.sort((a, b) => {
          const aNum = a.number ? parseInt(a.number.replace(/\D/g, '')) || 0 : 0;
          const bNum = b.number ? parseInt(b.number.replace(/\D/g, '')) || 0 : 0;
          return bNum - aNum;
        });
      case 'rarity':
        // Sort by rarity (common first, then uncommon, rare, etc.)
        return results.sort((a, b) => {
          const rarityOrder: Record<string, number> = {
            'Common': 1, 
            'Uncommon': 2,
            'Rare': 3,
            'Rare Holo': 4,
            'Rare Ultra': 5,
            'Rare Holo EX': 6,
            'Rare Holo GX': 7,
            'Rare Holo V': 8,
            'Rare Holo VMAX': 9,
            'Rare Rainbow': 10,
            'Amazing Rare': 11
          };
          
          const aVal = a.rarity ? (rarityOrder[a.rarity] || 999) : 999;
          const bVal = b.rarity ? (rarityOrder[b.rarity] || 999) : 999;
          return aVal - bVal;
        });
      case 'set':
        // Sort by set name
        return results.sort((a, b) => {
          const aSet = a.set?.name || '';
          const bSet = b.set?.name || '';
          return aSet.localeCompare(bSet);
        });
      default:
        return results;
    }
  }, [searchResults, sortOption]);
  
  // Handle card selection for detail view
  const handleCardClick = (card: Card) => {
    setSelectedCard(card);
    setIsCardModalOpen(true);
  };
  
  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Sidebar wrapper with fixed height and scrolling */}
      <div className="lg:w-96 lg:flex-shrink-0 lg:sticky lg:top-20 lg:h-[calc(100vh-5rem)] lg:overflow-y-auto lg:overflow-x-hidden lg:pr-4">
        <Sidebar onSearch={handleSidebarSearch} />
      </div>
      
      {/* Main Content */}
      <div className="flex-grow">
        <div className="bg-card rounded-lg shadow-sm p-6 border border-border">
          <h1 className="text-2xl font-bold mb-4 text-foreground flex items-center">
            <Search className="mr-2 h-6 w-6 text-primary" /> 
            Card Explorer
          </h1>
          
          {/* Search Form */}
          <form onSubmit={handleSearch} className="space-y-4 mb-6">
            <div className="relative">
              <Input 
                type="text" 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by Pokémon name or card number..."
                className="pl-9"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Type Filter */}
              <div>
                <label className="text-sm font-medium flex items-center mb-1.5 text-muted-foreground">
                  <i className="fas fa-fire mr-1.5"></i> Pokémon Type
                </label>
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {types.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Rarity Filter */}
              <div>
                <label className="text-sm font-medium flex items-center mb-1.5 text-muted-foreground">
                  <i className="fas fa-star mr-1.5"></i> Card Rarity
                </label>
                <Select value={selectedRarity} onValueChange={setSelectedRarity}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Rarities" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Rarities</SelectItem>
                    {rarities.map((rarity) => (
                      <SelectItem key={rarity} value={rarity}>
                        {rarity}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Set Filter */}
              <div>
                <label className="text-sm font-medium flex items-center mb-1.5 text-muted-foreground">
                  <i className="fas fa-layer-group mr-1.5"></i> Card Set
                </label>
                <Select value={selectedSet} onValueChange={setSelectedSet}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Sets" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sets</SelectItem>
                    {sets.map((set: CardSet) => (
                      <SelectItem key={set.id} value={set.id}>
                        {set.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex gap-2 pt-2">
              <Button 
                type="submit" 
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                {isLoading ? 
                  <Loader2 className="h-4 w-4 animate-spin" /> : 
                  <Search className="h-4 w-4" />
                }
                Find Cards
              </Button>
              
              <Button 
                type="button" 
                variant="outline"
                onClick={handleReset}
                className="flex items-center gap-2"
              >
                <X className="h-4 w-4" />
                Reset All
              </Button>
            </div>
          </form>
          
          <Separator className="my-4" />
          
          {/* Search Results */}
          {isLoading ? (
            <div className="flex flex-col justify-center items-center py-12">
              <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
              <span className="text-lg text-muted-foreground">Searching for cards...</span>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-destructive mb-2">{error}</p>
              <p className="text-muted-foreground">Please try again with different search terms</p>
            </div>
          ) : searchResults.length > 0 ? (
            <>
              <div className="flex justify-between items-center mb-4">
                <p className="text-sm text-muted-foreground">
                  Found {totalCards} cards
                </p>
                
                {/* Sort dropdown for search results */}
                <div className="flex items-center gap-2">
                  <Select value={sortOption} onValueChange={setSortOption}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Sort by..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                      <SelectItem value="name-desc">Name (Z-A)</SelectItem>
                      <SelectItem value="number-asc">Number (Low-High)</SelectItem>
                      <SelectItem value="number-desc">Number (High-Low)</SelectItem>
                      <SelectItem value="rarity">Rarity</SelectItem>
                      <SelectItem value="set">Set</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {sortedResults.map((card) => (
                  <CardItem 
                    key={card.id}
                    card={card}
                    onClick={() => handleCardClick(card)}
                    quantity={getCardQuantity(card.id)}
                  />
                ))}
              </div>
            </>
          ) : (searchQuery || selectedType || selectedRarity || selectedSet) ? (
            <div className="flex flex-col justify-center items-center py-16">
              <div className="rounded-full bg-muted/50 p-6 mb-4">
                <Search className="h-12 w-12 text-muted-foreground" />
              </div>
              <p className="text-lg mb-2 text-foreground">No cards found matching your criteria</p>
              <p className="text-muted-foreground text-center max-w-md">
                Try adjusting your search terms or filters to broaden your search
              </p>
            </div>
          ) : (
            <div className="flex flex-col justify-center items-center py-16">
              <div className="rounded-full bg-muted/50 p-6 mb-4">
                <Search className="h-12 w-12 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Discover Your Cards</h3>
              <p className="text-muted-foreground text-center max-w-md">
                Enter a Pokémon name, select a type, or choose a rarity to find cards. 
                For precision, use card codes like "SV01-023" for exact matches.
              </p>
              <p className="text-sm text-muted-foreground mt-6">
                <i className="fas fa-lightbulb text-amber-400 mr-2"></i>
                Try searching for "Pikachu", "Fire" type, or "Rare" rarity
              </p>
            </div>
          )}
        </div>
      </div>
      
      {/* Card Detail Modal */}
      {selectedCard && (
        <CardDetail 
          card={selectedCard}
          isOpen={isCardModalOpen}
          onClose={() => setIsCardModalOpen(false)}
        />
      )}
    </div>
  );
};

export default SimpleSearch;