import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import Sidebar from '@/components/Sidebar';
import CardItem from '@/components/CardItem';
import CardDetail from '@/components/CardDetail';
import { Button } from '@/components/ui/button';
import { fetchCard, fetchSets } from '@/api/pokemonTCG';
import { useCollectionContext } from '@/context/CollectionContext';
import { sortCards, debounce } from '@/lib/utils';

const MyCollection: React.FC = () => {
  const [, setLocation] = useLocation();
  const collectionContext = useCollectionContext();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSetId, setSelectedSetId] = useState('');
  const [sortOrder, setSortOrder] = useState('name_asc');
  // Initialize compact view preference from localStorage
  const [isCompactView, setIsCompactView] = useState(() => {
    const savedPreference = window.localStorage.getItem('isCompactViewPreference');
    return savedPreference !== 'false'; // Default to true if not set
  });
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [filteredCards, setFilteredCards] = useState<any[]>([]);
  // Initialize the view state based on localStorage preference
  const [viewAllCollections, setViewAllCollections] = useState(() => {
    const savedPreference = window.localStorage.getItem('viewAllCollections');
    return savedPreference === 'true';
  });
  
  // Listen for view change events and localStorage
  useEffect(() => {
    // Function to handle custom event from sidebar
    const handleViewChange = (event: CustomEvent) => {
      console.log("Custom event received:", event.detail);
      setViewAllCollections(event.detail.viewAllCollections);
    };
    
    // Function to handle localStorage changes (for page refreshes or other tabs)
    const handleStorageChange = () => {
      const savedPreference = window.localStorage.getItem('viewAllCollections');
      setViewAllCollections(savedPreference === 'true');
      console.log("Storage changed, viewAllCollections:", savedPreference === 'true');
    };
    
    // Add event listeners
    window.addEventListener('viewCollectionChange', handleViewChange as EventListener);
    window.addEventListener('storage', handleStorageChange);
    
    // Check localStorage on mount
    handleStorageChange();
    
    // Cleanup on unmount
    return () => {
      window.removeEventListener('viewCollectionChange', handleViewChange as EventListener);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);
  
  // Fetch sets for the filter dropdown
  const { data: sets = [] } = useQuery({
    queryKey: ['/api/sets'],
    queryFn: () => fetchSets()
  });
  
  // Fetch selected card details
  const { data: cardDetails } = useQuery({
    queryKey: [`/api/cards/${selectedCard}`],
    queryFn: () => fetchCard(selectedCard || ''),
    enabled: !!selectedCard
  });
  
  // Get collection cards with quantities - either from all collections or active one
  const collectionCards = viewAllCollections 
    ? collectionContext.getAllCollectionCards()
    : (collectionContext.activeCollection 
        ? collectionContext.getCollectionCardObjects() 
        : []);
  
  // Force refresh collection data when component mounts or collection changes
  useEffect(() => {
    // Always refresh collection data to ensure we have the latest cards
    if (collectionContext.refetchCollectionCards) {
      collectionContext.refetchCollectionCards();
    }
  }, [collectionContext.activeCollection?.id]);

  // Handle automatic collection selection
  useEffect(() => {
    if (!viewAllCollections) {
      if (!collectionContext.activeCollection && collectionContext.collections.length > 0) {
        // Automatically select the first collection if viewing active collection
        console.log("Auto-selecting first collection");
        collectionContext.setActiveCollection(collectionContext.collections[0].id);
      } else if (!collectionContext.activeCollection && collectionContext.collections.length === 0) {
        // Redirect to collection manager if no collections exist
        setLocation('/collection');
      }
    }
  }, [collectionContext.collections, collectionContext.activeCollection, setLocation, viewAllCollections]);
  
  // Simplified card processing - always show all cards unless explicitly filtered
  useEffect(() => {
    // Start with all collection cards
    let cardsToShow = [...collectionCards];
    
    // Apply search filter only if there's actual search text
    if (searchTerm && searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase().trim();
      cardsToShow = cardsToShow.filter(card => 
        card.name.toLowerCase().includes(searchLower) || 
        card.number.toLowerCase().includes(searchLower)
      );
    }
    
    // Apply set filter only if a specific set is selected
    if (selectedSetId && selectedSetId !== 'all') {
      cardsToShow = cardsToShow.filter(card => card.setId === selectedSetId);
    }
    
    // Sort the results
    const sortedCards = sortCards(cardsToShow, sortOrder);
    setFilteredCards(sortedCards);
  }, [collectionCards, searchTerm, selectedSetId, sortOrder]);
  
  // Handle search input with debounce
  const handleSearchChange = debounce((value: string) => {
    setSearchTerm(value);
  }, 300);
  
  // Toggle sort order
  const toggleSortOrder = () => {
    const orders = ['name_asc', 'name_desc', 'number_asc', 'number_desc', 'rarity_asc', 'rarity_desc'];
    const currentIndex = orders.indexOf(sortOrder);
    const nextIndex = (currentIndex + 1) % orders.length;
    setSortOrder(orders[nextIndex]);
  };
  
  // Get sort order display text
  const getSortOrderText = () => {
    switch (sortOrder) {
      case 'name_asc': return 'Name A-Z';
      case 'name_desc': return 'Name Z-A';
      case 'number_asc': return 'Number ↑';
      case 'number_desc': return 'Number ↓';
      case 'rarity_asc': return 'Rarity ↑';
      case 'rarity_desc': return 'Rarity ↓';
      default: return 'Sort';
    }
  };
  
  // Handle card selection
  const handleCardClick = (cardId: string) => {
    setSelectedCard(cardId);
    setIsCardModalOpen(true);
  };
  
  if (!collectionContext.activeCollection) {
    return null; // Will redirect in useEffect
  }
  
  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Sidebar wrapper with fixed height and scrolling */}
      <div className="lg:w-96 lg:flex-shrink-0 lg:sticky lg:top-20 lg:h-[calc(100vh-5rem)] lg:overflow-y-auto lg:overflow-x-hidden lg:pr-4">
        <Sidebar />
      </div>
      
      <div className="flex-grow">
        <section className="bg-card rounded-lg shadow-lg border border-border mb-6 overflow-hidden">
          {/* Fire-themed Collection Header Banner */}
          <div className="relative border-b border-border/60">
            {/* Dynamic vibrant red background with effect layers */}
            <div className="absolute inset-0 bg-gradient-to-r from-purple-700 to-indigo-600 overflow-hidden">
              {/* Background texture pattern */}
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgdmlld0JveD0iMCAwIDYwIDYwIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0djZoNnYtNmgtNnptNi02aDZ2LTZoLTZ2NnptLTYgMGg2di02aC02djZ6TTI0IDI0aDZ2LTZoLTZ2NnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-40"></div>
              
              {/* Left decorative energy shape */}
              <div className="absolute -left-8 top-1/4 w-24 h-24 bg-gradient-to-r from-purple-500/50 to-transparent rounded-full transform -rotate-12"></div>
              
              {/* Right decorative shape */}
              <div className="absolute right-0 top-0 bottom-0 w-1/4 bg-gradient-to-l from-purple-500/30 to-transparent"></div>
              
              {/* Animated Poké Ball - subtle */}
              <div className="absolute bottom-2 right-5 w-8 h-8 opacity-30 animate-float-pokeball-alt">
                <div className="relative w-full h-full">
                  <div className="absolute inset-0 top-0 h-1/2 rounded-t-full bg-red-500 border border-white/30"></div>
                  <div className="absolute inset-0 bottom-0 top-1/2 h-1/2 rounded-b-full bg-white border border-white/30"></div>
                  <div className="absolute inset-0 h-1.5 top-[calc(50%-0.75px)] bg-white/30"></div>
                  <div className="absolute left-1/2 top-1/2 w-3 h-3 bg-white rounded-full -ml-1.5 -mt-1.5 border border-white/30"></div>
                </div>
              </div>

              {/* Heat shimmer effect - subtle */}
              <div className="absolute inset-0 opacity-20 animate-day-night"></div>
            </div>
            
            {/* Collection Info with enhanced styling */}
            <div className="relative px-5 py-4 flex flex-wrap items-center justify-between gap-3 z-10">
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2 text-white drop-shadow-sm">
                  <i className="fas fa-id-badge text-purple-300"></i> 
                  <span className="bg-gradient-to-r from-purple-200 to-indigo-300 bg-clip-text text-transparent">
                    {viewAllCollections 
                      ? "All Collection Cards" 
                      : `${collectionContext.activeCollection?.name || ""} Collection`}
                  </span>
                  <span className="text-white/80 text-sm font-normal">({collectionCards.length})</span>
                </h2>
              </div>
              
              <div className="flex gap-1.5 items-center">
                <Button 
                  variant={viewAllCollections ? "default" : "outline"}
                  size="sm"
                  className={viewAllCollections 
                    ? "bg-purple-500 text-white hover:bg-purple-600 border-0 h-8 px-3 shadow-md" 
                    : "bg-purple-900/30 text-white border-purple-400/50 hover:bg-purple-900/40 h-8 px-3"}
                  onClick={() => {
                    const event = new CustomEvent('viewCollectionChange', { 
                      detail: { viewAllCollections: true } 
                    });
                    window.dispatchEvent(event);
                    window.localStorage.setItem('viewAllCollections', 'true');
                    setViewAllCollections(true);
                  }}
                >
                  <i className="fas fa-layer-group mr-1.5"></i>
                  <span className="text-xs font-medium">All Collections</span>
                </Button>
                
                <Button 
                  variant={!viewAllCollections ? "default" : "outline"}
                  size="sm"
                  className={!viewAllCollections 
                    ? "bg-amber-400 text-red-900 hover:bg-amber-300 border-0 h-8 px-3 shadow-md" 
                    : "bg-red-900/30 text-white border-amber-400/50 hover:bg-red-900/40 h-8 px-3"}
                  onClick={() => {
                    const event = new CustomEvent('viewCollectionChange', { 
                      detail: { viewAllCollections: false } 
                    });
                    window.dispatchEvent(event);
                    window.localStorage.setItem('viewAllCollections', 'false');
                    setViewAllCollections(false);
                  }}
                  disabled={!collectionContext.activeCollection}
                >
                  <i className="fas fa-folder mr-1.5"></i>
                  <span className="text-xs font-medium">Current Only</span>
                </Button>
              </div>
            </div>
          </div>
          
          {/* Filters Row */}
          <div className="px-5 py-3 border-b border-border/40 bg-background">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative flex-grow max-w-xs">
                <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground text-sm"></i>
                <input 
                  type="text" 
                  placeholder="Search cards..." 
                  className="bg-input text-foreground placeholder-muted-foreground border border-border rounded-md py-1.5 pl-9 pr-3 w-full focus:ring-1 focus:ring-primary focus:outline-none text-sm"
                  onChange={(e) => handleSearchChange(e.target.value)}
                />
              </div>
              
              <select 
                className="bg-input text-foreground border border-border rounded-md py-1.5 px-3 w-44 appearance-none text-sm"
                value={selectedSetId}
                onChange={(e) => setSelectedSetId(e.target.value)}
              >
                <option value="">All Sets</option>
                {sets.map(set => (
                  <option key={set.id} value={set.id}>{set.name}</option>
                ))}
              </select>
              
              <div className="flex items-center ml-auto">
                <Button 
                  variant="outline" 
                  size="sm"
                  className="bg-muted/50 hover:bg-muted/80 text-foreground h-8 px-2 mr-1"
                  onClick={toggleSortOrder}
                >
                  <i className="fas fa-sort mr-1"></i>
                  <span className="text-xs">{getSortOrderText()}</span>
                </Button>
                
                <Button 
                  variant="outline" 
                  size="sm"
                  className="bg-muted/50 hover:bg-muted/80 text-foreground h-8 px-2"
                  onClick={() => {
                    const newValue = !isCompactView;
                    setIsCompactView(newValue);
                    window.localStorage.setItem('isCompactViewPreference', newValue.toString());
                  }}
                  title={isCompactView ? "Switch to full view" : "Switch to compact view"}
                >
                  <i className={`fas ${isCompactView ? 'fa-th-large' : 'fa-th-list'} mr-1`}></i>
                  <span className="text-xs">{isCompactView ? 'Full View' : 'Compact'}</span>
                </Button>
              </div>
            </div>
          </div>
          
          {/* Card Grid Container */}
          <div className="p-4">
          {collectionCards.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <i className="fas fa-folder-open text-5xl text-muted mb-4"></i>
              <h3 className="text-lg font-medium text-foreground mb-2">No Cards in Collection</h3>
              <p className="text-muted-foreground mb-4 max-w-md">
                You haven't added any cards to your "{collectionContext.activeCollection?.name || "this"}" collection yet.
              </p>
              <Button 
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
                onClick={() => setLocation('/collection')}
              >
                <i className="fas fa-search mr-2"></i> Browse Sets to Add Cards
              </Button>
            </div>
          ) : (
            <div className={`grid gap-3 ${
              isCompactView 
                ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6' 
                : 'grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
            }`}>
              {(filteredCards.length > 0 ? filteredCards : collectionCards).map(card => (
                <CardItem 
                  key={card.id}
                  card={card}
                  onClick={() => handleCardClick(card.id)}
                  isCompact={isCompactView}
                  quantity={card.quantity}
                />
              ))}
            </div>
          )}
          </div>
          
          {/* Pagination/Stats Footer */}
          {filteredCards.length > 0 && (
            <div className="px-4 py-3 border-t border-border/40 text-xs text-muted-foreground bg-muted/10 rounded-b-lg flex justify-between items-center">
              <div>
                Showing {filteredCards.length} of {collectionCards.length} cards
              </div>
              <div className="flex items-center gap-2">
                <span>
                  {getSortOrderText()}
                </span>
                <span className="w-px h-3 bg-border/60"></span>
                <span>
                  {isCompactView ? 'Compact View' : 'Full View'}
                </span>
              </div>
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

export default MyCollection;
