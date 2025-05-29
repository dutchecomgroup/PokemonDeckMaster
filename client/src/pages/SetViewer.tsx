import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import Sidebar from '@/components/Sidebar';
import CardItem from '@/components/CardItem';
import CardDetail from '@/components/CardDetail';
import { Button } from '@/components/ui/button';
import { fetchSet, fetchSetCards, fetchCard, fetchTypes, fetchRarities } from '@/api/pokemonTCG';
import { useCollectionContext } from '@/context/CollectionContext';
import { sortCards, debounce } from '@/lib/utils';
import { FixedSizeGrid as Grid } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';

const SetViewer: React.FC = () => {
  const { setId } = useParams();
  const { getCardQuantity } = useCollectionContext();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedRarity, setSelectedRarity] = useState('');
  
  // State to track when menu should be sticky
  const [isMenuSticky, setIsMenuSticky] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuTopPosition = useRef<number>(0);
  
  // Initialize compact view preference from localStorage
  const [isCompactView, setIsCompactView] = useState(() => {
    const savedPreference = window.localStorage.getItem('isCompactViewPreference');
    return savedPreference !== 'false'; // Default to true if not set
  });
  
  const [sortOrder, setSortOrder] = useState('number_asc');
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [filteredCards, setFilteredCards] = useState<any[]>([]);
  
  // Fetch set data
  const { data: set, isLoading: isLoadingSet } = useQuery({
    queryKey: [`/api/sets/${setId}`],
    queryFn: () => fetchSet(setId || ''),
    enabled: !!setId
  });
  
  // Fetch set cards with improved caching and performance and NO auto-refreshing
  const { data: cards = [], isLoading: isLoadingCards } = useQuery({
    queryKey: [`/api/cards/set/${setId}`],
    queryFn: () => fetchSetCards(setId || ''),
    enabled: !!setId,
    staleTime: Infinity, // Prevent automatic refetching completely
    gcTime: 24 * 60 * 60 * 1000, // Keep in cache for 24 hours
    refetchOnWindowFocus: false, // Don't refetch when window regains focus
    refetchOnMount: false, // Use cached data when component remounts
    refetchOnReconnect: false, // Don't refetch on reconnect
    refetchInterval: false // Disable periodic refetching
  });
  
  // Reset filters when changing sets
  useEffect(() => {
    // Reset all filters when setId changes
    setSearchTerm('');
    setSelectedType('');
    setSelectedRarity('');
    // Don't reset sort order or compact view as those are more like preferences
  }, [setId]);
  
  // Fetch types for filter
  const { data: types = [] } = useQuery({
    queryKey: ['/api/types'],
    queryFn: () => fetchTypes()
  });
  
  // Fetch rarities for filter - we'll extract actual rarities from the set cards
  const { data: allRarities = [] } = useQuery({
    queryKey: ['/api/rarities'],
    queryFn: () => fetchRarities()
  });
  
  // Extract unique rarities that exist in this set's cards
  const [setRarities, setSetRarities] = useState<string[]>([]);
  
  // Fetch selected card details
  const { data: cardDetails, isLoading: isLoadingCardDetails } = useQuery({
    queryKey: [`/api/cards/${selectedCard}`],
    queryFn: async () => {
      try {
        const result = await fetchCard(selectedCard || '');
        return result;
      } catch (error) {
        console.error("Error fetching card:", error);
        return null;
      }
    },
    enabled: !!selectedCard
  });
  
  // CRITICAL FIX: Using a ref to prevent infinite rerendering issues that can cause flashing
  const hasInitializedFilters = useRef(false);

  // Extract unique rarities from the set cards when cards data loads
  useEffect(() => {
    // Only run this effect once when cards are first loaded
    if (cards.length > 0 && !hasInitializedFilters.current) {
      hasInitializedFilters.current = true;
      // Get unique rarities from this set's cards with normalization
      const uniqueRarities = Array.from(new Set(
        cards
          .filter(card => card.rarity) // Only cards with rarity property
          .map(card => (card.rarity as string).trim())    // Extract and normalize rarity value
      )).sort() as string[]; // Sort alphabetically
      
      setSetRarities(uniqueRarities);
      
      // Reset selectedRarity if it's not in this set
      if (selectedRarity && !uniqueRarities.includes(selectedRarity)) {
        setSelectedRarity('');
      }
    }
  }, [cards, selectedRarity]);

  // Apply filtering and sorting
  useEffect(() => {
    if (!cards.length) {
      setFilteredCards([]);
      return;
    }
    
    let filtered = [...cards];
    
    // Apply search term filter
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      filtered = filtered.filter(card => 
        card.name.toLowerCase().includes(lowerSearchTerm) || 
        card.number.includes(lowerSearchTerm)
      );
    }
    
    // Apply type filter
    if (selectedType) {
      filtered = filtered.filter(card => 
        card.types?.includes(selectedType)
      );
    }
    
    // Apply rarity filter - normalize rarity values to handle inconsistencies
    if (selectedRarity) {
      filtered = filtered.filter(card => {
        if (!card.rarity) return false;
        
        // Normalize rarities to handle case sensitivity and whitespace
        const normalizedCardRarity = card.rarity.trim();
        const normalizedSelectedRarity = selectedRarity.trim();
        
        return normalizedCardRarity === normalizedSelectedRarity;
      });
    }
    
    // Sort the filtered cards
    const sorted = sortCards(filtered, sortOrder);
    setFilteredCards(sorted);
  }, [cards, searchTerm, selectedType, selectedRarity, sortOrder]);
  
  // Handle search input with debounce
  const handleSearchChange = debounce((value: string) => {
    setSearchTerm(value);
  }, 300);
  
  // Toggle sort order
  const toggleSortOrder = () => {
    const orders = ['number_asc', 'number_desc', 'name_asc', 'name_desc', 'rarity_asc', 'rarity_desc'];
    const currentIndex = orders.indexOf(sortOrder);
    const nextIndex = (currentIndex + 1) % orders.length;
    setSortOrder(orders[nextIndex]);
  };
  
  // Get sort order display text
  const getSortOrderText = () => {
    switch (sortOrder) {
      case 'number_asc': return 'Number ↑';
      case 'number_desc': return 'Number ↓';
      case 'name_asc': return 'Name A-Z';
      case 'name_desc': return 'Name Z-A';
      case 'rarity_asc': return 'Rarity ↑';
      case 'rarity_desc': return 'Rarity ↓';
      default: return 'Sort';
    }
  };
  
  // Set up scroll event listener for sticky menu
  useEffect(() => {
    // Reset the position when the component mounts
    menuTopPosition.current = 0;
    
    const handleScroll = () => {
      if (!menuRef.current) return;
      
      // Save the menu's original position if we haven't already
      if (menuTopPosition.current === 0) {
        const menuRect = menuRef.current.getBoundingClientRect();
        // Calculate actual position by adding current scroll position
        menuTopPosition.current = menuRect.top + window.scrollY;
        
        // Add a small offset to account for any header
        const headerOffset = 80; // Adjust based on your header height
        menuTopPosition.current -= headerOffset;
      }
      
      // Check if we've scrolled past the menu's original position
      const scrollPosition = window.scrollY;
      setIsMenuSticky(scrollPosition > menuTopPosition.current);
    };
    
    // Add a small delay before setting up the scroll listener
    // to ensure the layout is stable
    const timer = setTimeout(() => {
      // Add scroll event listener
      window.addEventListener('scroll', handleScroll);
      
      // Trigger once to set initial position
      handleScroll();
    }, 500);
    
    // Clean up event listener and timer
    return () => {
      clearTimeout(timer);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Handle card selection
  const handleCardClick = (cardId: string) => {
    setSelectedCard(cardId);
    setIsCardModalOpen(true);
    
    // Update URL fragment without navigating
    window.history.replaceState(null, '', `#${cardId}`);
  };
  
  // Check URL fragment on load to open a specific card
  useEffect(() => {
    if (window.location.hash && window.location.hash.length > 1) {
      const cardId = window.location.hash.substring(1);
      if (cardId) {
        setSelectedCard(cardId);
        setIsCardModalOpen(true);
      }
    }
  }, [setId, cards]);
  
  // Loading state
  const isLoading = isLoadingSet || isLoadingCards;
  
  return (
    <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
      {/* Sidebar wrapper with fixed height and scrolling */}
      <div className="lg:w-96 lg:flex-shrink-0 lg:sticky lg:top-20 lg:h-[calc(100vh-5rem)] lg:overflow-y-auto lg:overflow-x-hidden lg:pr-4">
        <Sidebar />
      </div>
      
      <div className="flex-grow relative">
        {/* Sticky menu placeholder - takes up space when menu is fixed */}
        {isMenuSticky && (
          <div 
            className="w-full mb-4 sm:mb-6"
            style={{ 
              height: menuRef.current ? `${menuRef.current.offsetHeight}px` : '120px' 
            }}
          ></div>
        )}
        
        {/* Menu bar - will be fixed when scrolled past */}
        <div 
          ref={menuRef}
          className={`bg-card/95 backdrop-blur-sm rounded-lg shadow-sm p-4 sm:p-6 border border-border mb-4 sm:mb-6 z-30 ${
            isMenuSticky 
              ? 'fixed top-16 left-0 right-0 max-w-[calc(100%-2rem)] mx-auto shadow-lg transition-all duration-300 ease-in-out' 
              : 'transition-all duration-300'
          }`}
          style={{
            width: isMenuSticky ? 'calc(100% - 2rem)' : '100%',
            maxWidth: isMenuSticky ? '1200px' : '100%'
          }}
        >
          <div className={`flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center justify-between gap-3 sm:gap-4 ${isMenuSticky ? 'sm:py-1' : ''}`}>
            <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
              {set?.images?.logo && (
                <img 
                  src={set.images.logo} 
                  alt={`${set.name} Logo`} 
                  className={`w-auto object-contain ${isMenuSticky ? 'max-h-8 sm:max-h-10' : 'max-h-12 sm:max-h-16'}`}
                />
              )}
              <div className="flex items-center gap-2">
                <h2 className={`font-semibold flex items-center gap-2 text-foreground ${isMenuSticky ? 'text-base sm:text-lg' : 'text-lg sm:text-xl'}`}>
                  <i className="fas fa-swatchbook text-secondary"></i>
                  {isLoading ? 'Loading...' : set?.name || 'Set Viewer'}
                </h2>
                {set?.images?.symbol && (
                  <img 
                    src={set.images.symbol} 
                    alt="Set Symbol" 
                    className={`w-auto ${isMenuSticky ? 'h-4 sm:h-5' : 'h-5 sm:h-6'}`}
                  />
                )}
              </div>
            </div>
            
            <div className={`grid grid-cols-2 sm:flex sm:flex-wrap gap-2 sm:gap-3 w-full sm:w-auto ${isMenuSticky ? 'animate-in fade-in duration-300' : ''}`}>
              <input 
                type="text" 
                placeholder="Search..." 
                className="bg-input text-foreground placeholder-muted-foreground border border-border rounded-md py-2 px-3 col-span-2 sm:w-44 text-sm focus:ring-1 focus:ring-primary focus:outline-none"
                onChange={(e) => handleSearchChange(e.target.value)}
                aria-label="Search cards by name or number"
              />
              
              <select 
                className="bg-input text-foreground border border-border rounded-md py-2 px-3 text-sm appearance-none"
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                aria-label="Filter by type"
              >
                <option value="">All Types</option>
                {types.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
              
              <div className="relative">
                <select 
                  className="bg-input text-foreground border border-border rounded-md py-2 px-3 pr-8 text-sm appearance-none"
                  value={selectedRarity}
                  onChange={(e) => setSelectedRarity(e.target.value)}
                  aria-label="Filter by rarity"
                >
                  <option value="">All Rarities ({setRarities.length})</option>
                  {/* Only show rarities that exist in this set */}
                  {setRarities.map(rarity => (
                    <option key={rarity} value={rarity}>{rarity}</option>
                  ))}
                </select>
                <div className="absolute right-2 top-2.5 text-xs bg-primary/20 text-primary px-1 rounded-sm pointer-events-none">
                  {setRarities.length}
                </div>
              </div>
              
              <Button 
                variant="outline" 
                size="sm"
                className="flex items-center justify-center gap-1 text-xs h-[38px] bg-muted hover:bg-muted/80 text-foreground"
                onClick={() => {
                  const newValue = !isCompactView;
                  setIsCompactView(newValue);
                  window.localStorage.setItem('isCompactViewPreference', newValue.toString());
                }}
                title={isCompactView ? 'Show card details' : 'Hide card details'}
                aria-label={`Switch to ${isCompactView ? 'detailed' : 'compact'} view`}
              >
                <i className={`fas ${isCompactView ? 'fa-th-large' : 'fa-th-list'}`}></i>
                <span className="hidden sm:inline ml-1">{isCompactView ? 'Full View' : 'Compact View'}</span>
              </Button>
              
              <Button 
                variant="outline" 
                size="sm"
                className="flex items-center justify-center gap-1 text-xs h-[38px] bg-muted hover:bg-muted/80 text-foreground"
                onClick={toggleSortOrder}
                aria-label={`Change sort order: ${getSortOrderText()}`}
              >
                <i className="fas fa-sort"></i>
                <span className="hidden sm:inline ml-1">{getSortOrderText()}</span>
              </Button>
            </div>
          </div>
        </div>
        
        <section className="bg-card rounded-lg shadow-sm p-4 sm:p-6 border border-border mb-4 sm:mb-6">
          {isLoading ? (
            <div className="flex items-center justify-center p-10 text-muted-foreground">
              <i className="fas fa-spinner fa-spin text-2xl mr-3"></i>
              <span>Loading set cards...</span>
            </div>
          ) : filteredCards.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-10 text-center">
              <i className="fas fa-search text-5xl text-muted mb-4"></i>
              <h3 className="text-lg font-medium text-foreground mb-2">No Cards Found</h3>
              <p className="text-muted-foreground">
                Try adjusting your search filters or clear them to see all cards in this set.
              </p>
            </div>
          ) : (
            <div className="w-full h-[70vh]">
              <AutoSizer>
                {({ height, width }) => {
                  // Calculate number of columns based on available width and compact mode
                  let columnCount = 2; // Default for small screens
                  const cardWidth = isCompactView ? 180 : 220; // Approximate card widths
                  
                  // Responsive column counts
                  if (width >= 1536) { // 2xl
                    columnCount = isCompactView ? 6 : 5;
                  } else if (width >= 1280) { // xl
                    columnCount = isCompactView ? 5 : 4;
                  } else if (width >= 1024) { // lg
                    columnCount = isCompactView ? 4 : 3;
                  } else if (width >= 768) { // md
                    columnCount = isCompactView ? 3 : 2;
                  }
                  
                  // Calculate item dimensions
                  const effectiveWidth = width - (columnCount * 16); // Account for gaps
                  const cellWidth = Math.floor(effectiveWidth / columnCount);
                  const cellHeight = isCompactView ? 220 : 320; // Adjust based on card size
                  
                  // Calculate total rows needed
                  const rowCount = Math.ceil(filteredCards.length / columnCount);
                  
                  return (
                    <Grid
                      columnCount={columnCount}
                      columnWidth={cellWidth}
                      height={height}
                      rowCount={rowCount}
                      rowHeight={cellHeight}
                      width={width}
                      itemData={{
                        cards: filteredCards,
                        columnCount,
                        isCompact: isCompactView,
                        getQuantity: getCardQuantity,
                        onCardClick: handleCardClick
                      }}
                    >
                      {({ columnIndex, rowIndex, style, data }) => {
                        const index = rowIndex * data.columnCount + columnIndex;
                        if (index >= data.cards.length) return null;
                        
                        const card = data.cards[index];
                        
                        return (
                          <div style={{
                            ...style,
                            padding: '8px'
                          }}>
                            <CardItem 
                              key={`card-${card.id}`}
                              card={card}
                              onClick={() => data.onCardClick(card.id)}
                              isCompact={data.isCompact}
                              quantity={data.getQuantity(card.id)}
                            />
                          </div>
                        );
                      }}
                    </Grid>
                  );
                }}
              </AutoSizer>
            </div>
          )}
        </section>
      </div>
      
      <CardDetail 
        card={cardDetails || null}
        isOpen={isCardModalOpen}
        onClose={() => setIsCardModalOpen(false)}
      />
    </div>
  );
};

export default SetViewer;