import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import SetList from './SetList';
import SetProgressBar from './SetProgressBar';
import { fetchTypes, fetchRarities } from '@/api/pokemonTCG';
import { useCollectionContext } from '@/context/CollectionContext';

interface SidebarProps {
  onSearch?: (query: string, type: string, rarity: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onSearch }) => {
  const [, setLocation] = useLocation();
  const { activeCollection, collections, setActiveCollection } = useCollectionContext();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedRarity, setSelectedRarity] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  const { data: types = [] } = useQuery({
    queryKey: ['/api/types'],
    queryFn: () => fetchTypes()
  });
  
  const { data: rarities = [] } = useQuery({
    queryKey: ['/api/rarities'],
    queryFn: () => fetchRarities()
  });
  
  // Function to search cards
  const searchCards = async (query: string) => {
    if (!query || query.length < 3) {
      setSearchResults([]);
      return;
    }
    
    setIsSearching(true);
    try {
      // Modified to search more broadly by using a wildcard-like approach
      const response = await fetch(`/api/search?query=${encodeURIComponent(query)}&limit=5&partial=true`);
      if (response.ok) {
        const data = await response.json();
        // Limit results to 5 items for quick search
        const limitedResults = data.results ? data.results.slice(0, 5) : [];
        setSearchResults(limitedResults);
      }
    } catch (error) {
      console.error('Error searching cards:', error);
    } finally {
      setIsSearching(false);
    }
  };

  // Debounce the search function
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery && searchQuery.length >= 3) {
        searchCards(searchQuery);
      } else {
        setSearchResults([]);
      }
    }, 300);
    
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(searchQuery, selectedType, selectedRarity);
    } else {
      // Redirect to search page with query parameters
      const params = new URLSearchParams();
      if (searchQuery) params.append('query', searchQuery);
      if (selectedType) params.append('type', selectedType);
      if (selectedRarity) params.append('rarity', selectedRarity);
      
      setLocation(`/search?${params.toString()}`);
    }
  };
  
  // Handle enter key in the search input
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault(); // Prevent default form submission
      e.stopPropagation(); // Stop event propagation
      const value = e.currentTarget.value;
      if (value.trim()) {
        // Clear the search results first to avoid state conflicts
        setSearchResults([]);
        
        // If onSearch is provided, use it (we're in the search page)
        if (onSearch) {
          onSearch(value.trim(), selectedType, selectedRarity);
        } else {
          // Navigate to search page with the query
          const params = new URLSearchParams();
          params.append('query', value.trim());
          
          // Navigate to the search page
          setLocation(`/search?${params.toString()}`);
        }
        
        // Clear the search input after submitting
        setSearchQuery('');
        
        // Log the action for debugging
        console.log('Search submitted:', value.trim());
      }
    }
  };
  
  const handleReset = () => {
    setSearchQuery('');
    setSelectedType('');
    setSelectedRarity('');
  };
  
  return (
    <aside className="w-full flex-shrink-0 space-y-5">
      {/* Search Section */}
      <div className="bg-card rounded-lg shadow-sm p-4 border border-border">
        <h3 className="font-medium text-sm uppercase tracking-wider text-muted-foreground mb-3 flex items-center">
          <i className="fas fa-search text-muted-foreground mr-2"></i> Search Cards
        </h3>
        <div className="space-y-2">          
          <div className="relative">
            <input
              type="text"
              placeholder="Quick search..."
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary pr-8"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
              }}
              onKeyDown={handleKeyDown}
            />
            {searchQuery && (
              <button 
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() => setSearchQuery('')}
              >
                <i className="fas fa-times text-xs"></i>
              </button>
            )}
            
            {/* Live search results dropdown */}
            {searchQuery.length >= 3 && (
              <div className="absolute z-50 w-full mt-1 bg-background rounded-md border border-border shadow-lg max-h-96 overflow-y-auto">
                {isSearching ? (
                  <div className="p-2 text-center text-sm text-muted-foreground">
                    <i className="fas fa-circle-notch fa-spin mr-2"></i> Searching...
                  </div>
                ) : searchResults.length > 0 ? (
                  <>
                    {searchResults.map((card) => (
                      <div 
                        key={card.id}
                        className="p-2 hover:bg-muted/50 cursor-pointer border-b border-border/50 last:border-0"
                        onClick={() => {
                          setLocation(`/card/${card.id}`);
                          setSearchQuery('');
                        }}
                      >
                        <div className="flex items-center gap-2">
                          {card.images?.small && (
                            <img src={card.images.small} alt={card.name} className="w-8 h-8 object-contain" />
                          )}
                          <div>
                            <div className="text-sm font-medium">{card.name}</div>
                            <div className="text-xs text-muted-foreground">{card.set?.name} · {card.number}/{card.set?.printedTotal}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                    <div 
                      className="p-2 text-center text-xs text-primary hover:text-primary/80 cursor-pointer bg-muted/30"
                      onClick={() => {
                        // Store the current search query
                        const query = searchQuery.trim();
                        
                        // Clear the search input
                        setSearchQuery('');
                        
                        // Call the search function if it exists (used on Search page)
                        if (onSearch) {
                          onSearch(query, '', '');
                        } else {
                          // Navigate directly to search results using query parameter
                          setLocation(`/search?query=${encodeURIComponent(query)}`);
                          
                          // Give it a moment to update, then trigger a search refresh
                          setTimeout(() => {
                            // Force a search trigger by directly accessing the full-page search input
                            const searchInput = document.querySelector('input[placeholder="Search cards..."]') as HTMLInputElement;
                            if (searchInput) {
                              searchInput.value = query;
                              searchInput.dispatchEvent(new Event('input', { bubbles: true }));
                              
                              // Trigger the search button click to ensure a search happens
                              const searchButton = document.querySelector('button[type="submit"]');
                              if (searchButton) {
                                searchButton.click();
                              }
                            }
                          }, 300);
                        }
                      }}
                    >
                      View all results <i className="fas fa-arrow-right ml-1"></i>
                    </div>
                  </>
                ) : (
                  <div className="p-2 text-center text-sm text-muted-foreground">
                    No results found
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
     
      {/* Collections Section - Improved Usability */}
      <div className="bg-card rounded-lg shadow-sm p-3 border border-border">
        <h3 className="font-medium text-xs uppercase tracking-wider text-muted-foreground mb-3 flex items-center">
          <i className="fas fa-folder-open text-muted-foreground mr-1.5"></i> Collections
        </h3>
        
        {collections.length === 0 ? (
          <div className="text-xs text-muted-foreground p-1.5 bg-muted/30 rounded-md">
            No collections yet
          </div>
        ) : (
          <div className="space-y-2">
            {collections.map(collection => (
              <div 
                key={collection.id} 
                className={`text-sm transition-all rounded-md overflow-hidden shadow-sm ${
                  activeCollection?.id === collection.id 
                    ? 'bg-gradient-to-r from-primary/15 to-primary/5 border border-primary/30' 
                    : 'bg-gradient-to-r from-muted/15 to-transparent border border-border hover:border-primary/20 hover:bg-muted/20'
                }`}
              >
                <div 
                  className={`flex items-center p-2 cursor-pointer group relative ${
                    activeCollection?.id === collection.id 
                      ? 'border-l-2 border-primary' 
                      : 'border-l-2 border-transparent hover:border-primary/50'
                  }`}
                  onClick={() => {
                    setActiveCollection(collection.id);
                    setLocation('/my-collection');
                  }}
                >
                  <i className={`fas fa-folder${activeCollection?.id === collection.id ? '-open' : ''} mr-2 text-sm ${
                    activeCollection?.id === collection.id 
                      ? 'text-primary' 
                      : 'text-muted-foreground group-hover:text-primary/70'
                  }`}></i>
                  
                  <span className={`font-medium truncate flex-1 ${
                    activeCollection?.id === collection.id 
                      ? 'text-primary' 
                      : 'group-hover:text-foreground'
                  }`}>
                    {collection.name}
                  </span>
                  
                  <div className="flex items-center ml-1 opacity-70 group-hover:opacity-100">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveCollection(collection.id);
                        setLocation('/my-collection');
                      }}
                      className="w-6 h-6 flex items-center justify-center rounded-sm hover:bg-primary/10"
                      title="View Collection"
                    >
                      <i className="fas fa-eye text-xs"></i>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveCollection(collection.id);
                        setLocation(`/statistics?collectionId=${collection.id}`);
                      }}
                      className="w-6 h-6 flex items-center justify-center rounded-sm hover:bg-blue-500/10"
                      title="View Statistics"
                    >
                      <i className="fas fa-chart-bar text-xs text-blue-500"></i>
                    </button>
                  </div>
                </div>
              </div>
            ))}
            
            <button
              onClick={() => setLocation('/collection')}
              className="w-full text-xs py-1.5 rounded bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 flex items-center justify-center border border-emerald-500/20"
            >
              <i className="fas fa-folder-plus mr-1.5"></i> Manage Collections
            </button>
          </div>
        )}
      </div>
      
      {/* Set Browser Section */}
      <div className="bg-card rounded-lg shadow-sm p-4 border border-border">
        <h3 className="font-medium text-sm uppercase tracking-wider text-muted-foreground mb-3 flex items-center">
          <i className="fas fa-layer-group text-muted-foreground mr-2"></i> Browse Sets
        </h3>
        <SetList />
      </div>
    </aside>
  );
};

export default Sidebar;