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
      const response = await fetch(`/api/search?query=${encodeURIComponent(query)}&limit=5`);
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.results || []);
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
  
  const handleReset = () => {
    setSearchQuery('');
    setSelectedType('');
    setSelectedRarity('');
  };
  
  return (
    <aside className="w-full flex-shrink-0 space-y-5">
      {/* Navigation Section */}
      <div className="bg-card rounded-lg shadow-sm p-4 border border-border">
        <h3 className="font-medium text-sm uppercase tracking-wider text-muted-foreground mb-3 flex items-center">
          <i className="fas fa-compass text-muted-foreground mr-2"></i> Navigation
        </h3>
        <div className="space-y-2">
          <button 
            onClick={() => setLocation('/')}
            className="w-full bg-gradient-to-r from-primary to-primary/80 hover:opacity-90 text-primary-foreground rounded-md py-2 px-4 flex items-center justify-center transition-colors"
          >
            <i className="fas fa-home mr-2"></i> Home
          </button>
          
          <div className="relative">
            <input
              type="search"
              placeholder="Quick search..."
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary pr-8"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const value = e.currentTarget.value;
                  if (value.trim()) {
                    const params = new URLSearchParams();
                    params.append('query', value.trim());
                    setLocation(`/search?${params.toString()}`);
                  }
                }
              }}
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
              <div className="absolute z-50 w-full mt-1 bg-background rounded-md border border-border shadow-lg max-h-60 overflow-y-auto">
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
                        const params = new URLSearchParams();
                        params.append('query', searchQuery.trim());
                        setLocation(`/search?${params.toString()}`);
                        setSearchQuery('');
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
          <button 
            onClick={() => setLocation('/search')}
            className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground rounded-md py-2 px-4 flex items-center justify-center transition-colors"
          >
            <i className="fas fa-sliders-h mr-2"></i> Advanced Search
          </button>
        </div>
      </div>
      
      {/* Collection Management Section */}
      <div className="bg-card rounded-lg shadow-sm p-4 border border-border w-full">
        <h3 className="font-medium text-sm uppercase tracking-wider text-muted-foreground mb-3 flex items-center">
          <i className="fas fa-folder text-muted-foreground mr-2"></i> Collection Management
        </h3>
        
        {activeCollection && (
          <div className="mb-3 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Active:</span> {activeCollection.name}
          </div>
        )}
        
        <div className="space-y-2 w-full">
          <div className="space-y-2 w-full">
            <button 
              onClick={() => setLocation('/collection')}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-md py-2 px-4 flex items-center justify-center transition-colors"
            >
              <i className="fas fa-folder-open mr-2"></i> Collection Manager
            </button>

            <button 
              onClick={() => {
                // Create a custom event
                const event = new CustomEvent('viewCollectionChange', { 
                  detail: { viewAllCollections: false } 
                });
                
                // Dispatch the event
                window.dispatchEvent(event);
                
                // Set localStorage for persistence across page refreshes
                window.localStorage.setItem('viewAllCollections', 'false');
                
                // Navigate to collection page
                setLocation('/my-collection');
              }}
              className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground rounded-md py-2 px-4 flex items-center justify-center transition-colors"
            >
              <i className="fas fa-eye mr-2"></i> My Collection
            </button>
            
            <button 
              onClick={() => setLocation('/statistics')}
              className="w-full bg-accent hover:bg-accent/90 text-accent-foreground rounded-md py-2 px-4 flex items-center justify-center transition-colors"
            >
              <i className="fas fa-chart-bar mr-2"></i> Collection Statistics
            </button>
          </div>
          
          <hr className="border-border my-2" />
          
          <div className="max-h-48 overflow-y-auto pr-1 space-y-1">
            {collections.length === 0 ? (
              <div className="text-xs text-muted-foreground text-center p-2">
                No collections yet. Create one in Collection Manager.
              </div>
            ) : (
              collections.map(collection => (
                <div
                  key={collection.id}
                  className={`w-full px-3 py-2 rounded-md text-sm transition-colors ${
                    activeCollection?.id === collection.id 
                      ? 'bg-primary/10 text-foreground font-medium' 
                      : 'hover:bg-muted text-muted-foreground'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => {
                        // Just select the collection, don't navigate yet
                        setActiveCollection(collection.id);
                      }}
                      className="flex-grow text-left flex items-center"
                    >
                      <i className={`fas fa-folder${activeCollection?.id === collection.id ? '-open' : ''} mr-2 ${
                        activeCollection?.id === collection.id ? 'text-primary' : 'text-muted-foreground'
                      }`}></i>
                      {collection.name}
                    </button>
                    
                    {activeCollection?.id === collection.id && (
                      <button
                        onClick={() => {
                          // Navigate to selected collection
                          setLocation('/my-collection');
                        }}
                        className="ml-2 text-xs px-2 py-1 rounded bg-primary/20 text-primary hover:bg-primary/30"
                        title="Open Collection"
                      >
                        Open
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
          
          <button 
            onClick={() => setLocation('/collection')}
            className="w-full bg-muted hover:bg-muted/80 text-foreground rounded-md py-2 px-4 flex items-center justify-center transition-colors text-sm"
          >
            <i className="fas fa-cog mr-2"></i> Manage Collections
          </button>
        </div>
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
