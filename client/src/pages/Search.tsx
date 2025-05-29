import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import Sidebar from '@/components/Sidebar';
import CardItem from '@/components/CardItem';
import CardDetail from '@/components/CardDetail';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { fetchTypes, fetchRarities, searchCards, fetchCard, fetchSets, getSetsByTypeAndRarity } from '@/api/pokemonTCG';
import { useCollectionContext } from '@/context/CollectionContext';
import { useDebounce } from '@/hooks/useDebounce';
import { Card } from '@/api/pokemonTCG';

const Search: React.FC = () => {
  const [location, setLocation] = useLocation();
  const { getCardQuantity } = useCollectionContext();
  
  // Refs
  const searchFormRef = useRef<HTMLDivElement>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const isInitialMount = useRef(true);

  // UI state
  const [isSticky, setIsSticky] = useState(false);
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  
  // Sorting state
  const [sortOption, setSortOption] = useState('name-asc');
  const [sortedResults, setSortedResults] = useState<Card[]>([]);
  
  // Search parameters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedRarity, setSelectedRarity] = useState('');
  const [selectedSet, setSelectedSet] = useState('');
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  
  // Filter options
  const [availableTypes, setAvailableTypes] = useState<string[]>([]);
  const [availableRarities, setAvailableRarities] = useState<string[]>([]);
  const [availableSets, setAvailableSets] = useState<{id: string, name: string}[]>([]);
  const [originalAvailableSets, setOriginalAvailableSets] = useState<{id: string, name: string}[]>([]);
  
  // For live search, reduce debounce time to provide faster results
  const debouncedSearchTerm = useDebounce(searchTerm, 150); // Faster response for better UX
  const debouncedType = useDebounce(selectedType, 150);
  const debouncedRarity = useDebounce(selectedRarity, 150);
  const debouncedSet = useDebounce(selectedSet, 150);

  // Handle scroll for sticky search form
  useEffect(() => {
    const handleScroll = () => {
      if (searchFormRef.current) {
        const formPosition = searchFormRef.current.getBoundingClientRect().top;
        setIsSticky(formPosition <= 0);
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Special effect to handle URL parameters on initial load
  useEffect(() => {
    if (location.startsWith('/search?')) {
      const params = new URLSearchParams(location.split('?')[1]);
      const query = params.get('query');
      const type = params.get('type');
      const rarity = params.get('rarity');
      const set = params.get('set');
      
      console.log('Initial load URL parameters:', { query, type, rarity, set });
      
      // Set search parameters from URL
      if (query) setSearchTerm(query);
      if (type) setSelectedType(type);
      if (rarity) setSelectedRarity(rarity);
      if (set) setSelectedSet(set);
    }
  }, []); // Only run once on mount

  // Effect to handle URL changes after initial mount
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    
    if (location.startsWith('/search?')) {
      const params = new URLSearchParams(location.split('?')[1]);
      const query = params.get('query');
      const type = params.get('type');
      const rarity = params.get('rarity');
      const set = params.get('set');
      
      console.log('URL changed:', { query, type, rarity, set });
      
      // Update state with URL parameters
      if (query !== null) setSearchTerm(query);
      if (type !== null) setSelectedType(type);
      if (rarity !== null) setSelectedRarity(rarity);
      if (set !== null) setSelectedSet(set);
    }
  }, [location]);

  // Fetch data for filter options  
  const { data: types = [] } = useQuery({
    queryKey: ['/api/types'],
    queryFn: () => fetchTypes()
  });
  
  const { data: rarities = [] } = useQuery({
    queryKey: ['/api/rarities'],
    queryFn: () => fetchRarities()
  });
  
  const { data: sets = [] } = useQuery({
    queryKey: ['/api/sets'],
    queryFn: () => fetchSets()
  });
  
  // Effect to update available sets when type or rarity changes
  useEffect(() => {
    if (debouncedType || debouncedRarity) {
      const updateSets = async () => {
        const filteredSets = await getSetsByTypeAndRarity(debouncedType, debouncedRarity);
        if (filteredSets.length > 0) {
          setAvailableSets(filteredSets);
        } else if (sets && sets.length > 0) {
          const formattedSets = sets.map(set => ({
            id: set.id,
            name: set.name
          })).sort((a, b) => a.name.localeCompare(b.name));
          setAvailableSets(formattedSets);
        }
      };
      
      updateSets();
    } else if (sets && sets.length > 0) {
      const formattedSets = sets.map(set => ({
        id: set.id,
        name: set.name
      })).sort((a, b) => a.name.localeCompare(b.name));
      setAvailableSets(formattedSets);
      setOriginalAvailableSets(formattedSets);
    }
  }, [debouncedType, debouncedRarity, sets]);

  // Effect to update URL when search parameters change
  useEffect(() => {
    const hasAnyParam = debouncedType || debouncedRarity || debouncedSet || debouncedSearchTerm;
    const validTextSearch = !debouncedSearchTerm || debouncedSearchTerm.length >= 2;
    
    if (hasAnyParam && validTextSearch) {
      // Update URL with search parameters
      const params = new URLSearchParams();
      if (debouncedSearchTerm) params.append('query', debouncedSearchTerm);
      if (debouncedType) params.append('type', debouncedType);
      if (debouncedRarity) params.append('rarity', debouncedRarity);
      if (debouncedSet) params.append('set', debouncedSet);
      
      // Only update location if URL would actually change
      const newUrl = `/search?${params.toString()}`;
      if (location !== newUrl) {
        setLocation(newUrl, { replace: true });
      }
    }
  }, [debouncedSearchTerm, debouncedType, debouncedRarity, debouncedSet, location, setLocation]);

  // Fetch types for filter
  const { data: types = [] } = useQuery({
    queryKey: ['/api/types'],
    queryFn: () => fetchTypes()
  });
  
  // Fetch rarities for filter
  const { data: rarities = [] } = useQuery({
    queryKey: ['/api/rarities'],
    queryFn: () => fetchRarities()
  });
  
  // Fetch sets for filter
  const { data: sets = [] } = useQuery({
    queryKey: ['/api/sets'],
    queryFn: () => fetchSets()
  });

  // Fetch search results
  const { 
    data: searchResultsPages, 
    isLoading, 
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['/api/cards/search', debouncedSearchTerm, debouncedType, debouncedRarity, debouncedSet],
    queryFn: async ({ pageParam = 1 }) => {
      // Only perform search if we have at least one parameter
      if (debouncedSearchTerm || debouncedType || debouncedRarity || debouncedSet) {
        console.log('Executing search with params:', { 
          query: debouncedSearchTerm, 
          type: debouncedType, 
          rarity: debouncedRarity,
          set: debouncedSet,
          page: pageParam 
        });
        
        // Get partial search parameter from URL
        const params = new URLSearchParams(location.split('?')[1]);
        const usePartialSearch = params.get('partial') === 'true';
        
        const result = await searchCards(
          debouncedSearchTerm,
          debouncedType ? [debouncedType] : [],
          debouncedRarity,
          pageParam as number,
          20,
          debouncedSet,
          usePartialSearch
        );
        
        console.log(`Received ${result.data.length} results of ${result.totalCount} total`);
        
        // Update available filter options based on search results
        if (pageParam === 1 && result.data.length > 0) {
          // Extract types from results
          const typesSet = new Set<string>();
          result.data.forEach((card: Card) => {
            if (card.types) {
              card.types.forEach(type => typesSet.add(type));
            }
          });
          setAvailableTypes(Array.from(typesSet).sort());
          
          // Extract rarities from results
          const raritiesSet = new Set<string>();
          result.data.forEach((card: Card) => {
            if (card.rarity && card.rarity.trim() !== '') {
              raritiesSet.add(card.rarity);
            }
          });
          setAvailableRarities(Array.from(raritiesSet).sort());
          
          setHasSearched(true);
        }
        
        return result;
      }
      
      return { data: [], page: 1, pageSize: 20, count: 0, totalCount: 0 };
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.page < Math.ceil(lastPage.totalCount / lastPage.pageSize)) {
        return lastPage.page + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
    enabled: !!(debouncedSearchTerm || debouncedType || debouncedRarity || debouncedSet)
  });

  // Flatten search results pages into a single array of cards
  const allCards = searchResultsPages?.pages.flatMap(page => page.data) || [];
  const totalCount = searchResultsPages?.pages[0]?.totalCount || 0;
  
  // Sort the cards based on the selected sort option
  const sortedCards = useMemo(() => {
    if (!allCards.length) return [];
    
    const cards = [...allCards];
    
    switch (sortOption) {
      case 'name-asc':
        return cards.sort((a, b) => a.name.localeCompare(b.name));
      case 'name-desc':
        return cards.sort((a, b) => b.name.localeCompare(a.name));
      case 'number-asc':
        return cards.sort((a, b) => {
          // Extract numeric part from card number for proper sorting
          const aNum = a.number ? parseInt(a.number.replace(/\D/g, '')) || 0 : 0;
          const bNum = b.number ? parseInt(b.number.replace(/\D/g, '')) || 0 : 0;
          return aNum - bNum;
        });
      case 'number-desc':
        return cards.sort((a, b) => {
          const aNum = a.number ? parseInt(a.number.replace(/\D/g, '')) || 0 : 0;
          const bNum = b.number ? parseInt(b.number.replace(/\D/g, '')) || 0 : 0;
          return bNum - aNum;
        });
      case 'rarity':
        // Sort by rarity (common first, then uncommon, rare, etc.)
        return cards.sort((a, b) => {
          const rarityOrder = {
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
        return cards.sort((a, b) => {
          const aSet = a.set?.name || '';
          const bSet = b.set?.name || '';
          return aSet.localeCompare(bSet);
        });
      default:
        return cards;
    }
  }, [allCards, sortOption]);

  // Setup intersection observer for infinite scrolling
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );
    
    const currentLoadMoreRef = loadMoreRef.current;
    if (currentLoadMoreRef) {
      observer.observe(currentLoadMoreRef);
    }
    
    return () => {
      if (currentLoadMoreRef) {
        observer.unobserve(currentLoadMoreRef);
      }
    };
  }, [loadMoreRef, hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Fetch selected card details
  const { data: cardDetails, isLoading: isLoadingCardDetails } = useQuery({
    queryKey: [`/api/cards/${selectedCard}`],
    queryFn: () => fetchCard(selectedCard || ''),
    enabled: !!selectedCard
  });

  // Handle sidebar search - now with live results
  const handleSidebarSearch = (query: string, type: string, rarity: string) => {
    setSearchTerm(query);
    setSelectedType(type);
    setSelectedRarity(rarity);
    // The search will happen automatically via the debounced useEffect
  };

  // Handle search submit - now just prevents default as search is live
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // No need to do anything here as search happens automatically via useEffect with debounced values
  };

  // Handle search reset
  const handleReset = () => {
    setSearchTerm('');
    setSelectedType('');
    setSelectedRarity('');
    setSelectedSet('');
    setHasSearched(false);
    setLocation('/search');
  };

  // Handle card selection
  const handleCardClick = (cardId: string) => {
    setSelectedCard(cardId);
    setIsCardModalOpen(true);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Sidebar */}
      <div className="lg:w-96 lg:flex-shrink-0 lg:sticky lg:top-20 lg:h-[calc(100vh-5rem)] lg:overflow-y-auto lg:overflow-x-hidden lg:pr-4">
        <Sidebar onSearch={handleSidebarSearch} />
      </div>
      
      <div className="flex-grow">
        {/* Search form */}
        <section ref={searchFormRef} className={`bg-card rounded-lg shadow-sm p-6 border border-border mb-6 ${isSticky ? 'lg:sticky lg:top-0 lg:z-30' : ''}`}>
          <h2 className="text-xl font-bold mb-4">Advanced Search</h2>
          
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Text search */}
              <div className="space-y-2">
                <label htmlFor="searchTerm" className="text-sm font-medium">
                  Card Name
                </label>
                <input
                  type="text"
                  id="searchTerm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search cards..."
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
                />
              </div>
              
              {/* Type filter */}
              <div className="space-y-2">
                <label htmlFor="type" className="text-sm font-medium">
                  Type
                </label>
                <select
                  id="type"
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
                >
                  <option value="">All Types</option>
                  {types.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Rarity filter */}
              <div className="space-y-2">
                <label htmlFor="rarity" className="text-sm font-medium">
                  Rarity
                </label>
                <select
                  id="rarity"
                  value={selectedRarity}
                  onChange={(e) => setSelectedRarity(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
                >
                  <option value="">All Rarities</option>
                  {rarities.map((rarity) => (
                    <option key={rarity} value={rarity}>
                      {rarity}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Set filter */}
              <div className="space-y-2">
                <label htmlFor="set" className="text-sm font-medium">
                  Set
                </label>
                <select
                  id="set"
                  value={selectedSet}
                  onChange={(e) => setSelectedSet(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
                >
                  <option value="">All Sets</option>
                  {availableSets.map((set) => (
                    <option key={set.id} value={set.id}>
                      {set.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleReset}
              >
                Clear
              </Button>
              
              <Button type="submit">
                Search
              </Button>
            </div>
          </form>
        </section>
        
        {/* Search results */}
        <section>
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-4">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              <p className="text-lg text-muted-foreground">Searching cards...</p>
            </div>
          ) : error ? (
            <div className="py-12 text-center">
              <p className="text-destructive mb-2">Error loading search results</p>
              <p className="text-muted-foreground">{(error as Error).message}</p>
            </div>
          ) : allCards.length === 0 ? (
            hasSearched ? (
              <div className="py-12 text-center">
                <p className="text-lg mb-2">No cards found matching your search</p>
                <p className="text-muted-foreground">Try adjusting your search criteria</p>
              </div>
            ) : (
              <div className="py-12 text-center">
                <p className="text-lg mb-2">Search for Pokémon cards</p>
                <p className="text-muted-foreground">Use the search form above to find cards</p>
              </div>
            )
          ) : (
            <>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
                <h2 className="text-xl font-bold">Search Results</h2>
                <div className="flex items-center gap-3">
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
                  <p className="text-sm text-muted-foreground whitespace-nowrap">Found {totalCount} cards</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {/* Use the sorted cards based on the current sort option */}
                {sortedCards.map((card: Card) => (
                  <CardItem 
                    key={card.id} 
                    card={card} 
                    onClick={() => handleCardClick(card.id)}
                    quantity={getCardQuantity(card.id)}
                  />
                ))}
              </div>
              
              {/* Infinite scroll loading indicator */}
              {hasNextPage && (
                <div 
                  ref={loadMoreRef} 
                  className="py-8 flex justify-center"
                >
                  {isFetchingNextPage ? (
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <Button 
                      variant="outline" 
                      onClick={() => fetchNextPage()}
                    >
                      Load More
                    </Button>
                  )}
                </div>
              )}
            </>
          )}
        </section>
      </div>
      
      {/* Card detail modal */}
      {selectedCard && (
        <CardDetail 
          cardId={selectedCard}
          isOpen={isCardModalOpen}
          onClose={() => setIsCardModalOpen(false)}
        />
      )}
    </div>
  );
};

export default Search;