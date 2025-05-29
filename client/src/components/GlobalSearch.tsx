import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { fetchTypes, fetchRarities, searchCards } from '@/api/pokemonTCG';

const GlobalSearch: React.FC = () => {
  const [, setLocation] = useLocation();
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const [showResults, setShowResults] = useState(false);
  
  // Fetch quick results if typing
  const { data: quickResults = { data: [] }, isLoading } = useQuery({
    queryKey: ['/api/cards/quick-search', searchQuery],
    queryFn: () => searchCards(searchQuery, [], '', 1, 5),
    enabled: searchQuery.length > 2 && showResults,
  });
  
  // Load types and rarities in background for advanced search
  const { data: types = [] } = useQuery({
    queryKey: ['/api/types'],
    queryFn: () => fetchTypes()
  });
  
  const { data: rarities = [] } = useQuery({
    queryKey: ['/api/rarities'],
    queryFn: () => fetchRarities()
  });
  
  // Close search when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsExpanded(false);
        setShowResults(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Focus input when expanded
  useEffect(() => {
    if (isExpanded && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isExpanded]);
  
  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (searchQuery.trim()) {
      const params = new URLSearchParams();
      params.append('query', searchQuery.trim());
      
      // Log the search action for debugging
      console.log(`Quick Search: Searching for "${searchQuery.trim()}"`);
      
      // Store the current query before clearing it
      const currentQuery = searchQuery.trim();
      
      // Clear the search input
      setSearchQuery('');
      
      // Close search UI components first
      setIsExpanded(false);
      setShowResults(false);
      
      // Use direct API call for search results instead of relying on the Search page
      console.log(`Quick Search: Directly searching for query: ${currentQuery}`);
      
      // Use our SimpleSearch page which should work more reliably
      window.location.href = `/search?query=${encodeURIComponent(currentQuery)}`;
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsExpanded(false);
      setShowResults(false);
    } else if (e.key === 'Enter') {
      // When user presses Enter, submit the search form
      if (searchQuery.trim()) {
        console.log('Enter key pressed - executing search for:', searchQuery.trim());
        
        // Call the search handler to avoid duplicating code
        e.preventDefault();
        handleSearch();
      }
    }
  };
  
  return (
    <div className="relative" ref={searchRef}>
      {/* Search Button/Bar */}
      <div 
        className={`flex items-center transition-all duration-300 rounded-full ${
          isExpanded 
            ? 'bg-background border border-border py-1 pl-3 pr-1' 
            : 'bg-transparent hover:bg-muted/30 p-2'
        }`}
      >
        {isExpanded ? (
          <div className="flex items-center w-full sm:w-72">
            <i className="fas fa-search text-muted-foreground mr-2"></i>
            <Input
              ref={inputRef}
              type="text"
              placeholder="Search cards..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (e.target.value.length > 2) {
                  setShowResults(true);
                } else {
                  setShowResults(false);
                }
              }}
              onKeyDown={handleKeyDown}
              className="flex-grow bg-transparent border-none shadow-none focus-visible:ring-0 text-foreground placeholder-muted-foreground"
            />
            <Button 
              size="sm" 
              variant="ghost" 
              className="h-8 w-8 p-0 rounded-full flex items-center justify-center"
              onClick={() => {
                setIsExpanded(false);
                setShowResults(false);
                setSearchQuery('');
              }}
            >
              <i className="fas fa-times text-muted-foreground"></i>
            </Button>
          </div>
        ) : (
          <button 
            className="h-9 w-9 rounded-full flex items-center justify-center text-muted-foreground"
            onClick={() => setIsExpanded(true)}
            aria-label="Open search"
          >
            <i className="fas fa-search"></i>
          </button>
        )}
      </div>
      
      {/* Quick Results Dropdown */}
      {isExpanded && showResults && (
        <Card className="absolute top-full mt-1 right-0 z-50 shadow-lg border border-border bg-card p-2 w-80 max-h-96 overflow-y-auto">
          <div className="p-2">
            <h3 className="text-sm font-medium mb-2 text-foreground">Quick Results</h3>
            
            {isLoading ? (
              <div className="flex items-center justify-center p-4 text-muted-foreground">
                <i className="fas fa-spinner fa-spin mr-2"></i> Searching...
              </div>
            ) : quickResults.data.length === 0 ? (
              <div className="py-2 text-center text-muted-foreground text-sm">
                No results found
              </div>
            ) : (
              <div className="space-y-2">
                {quickResults.data.map(card => (
                  <div 
                    key={card.id}
                    className="flex items-center gap-2 p-2 hover:bg-muted/30 rounded cursor-pointer transition-colors"
                    onClick={() => {
                      // Find the set ID from the card to navigate directly to that set
                      if (card.set && card.set.id) {
                        // Navigate to the set page and pass the card ID in the URL fragment
                        setLocation(`/sets/${card.set.id}#${card.id}`);
                      } else {
                        // Fallback to search if set info is missing
                        setLocation(`/search?query=${encodeURIComponent(card.id)}`);
                      }
                      setIsExpanded(false);
                      setShowResults(false);
                    }}
                  >
                    {card.images?.small && (
                      <img src={card.images.small} alt={card.name} className="w-10 h-14 object-contain rounded" />
                    )}
                    <div>
                      <div className="text-sm font-medium text-foreground">{card.name}</div>
                      <div className="text-xs text-muted-foreground">{card.set.name} · {card.number}</div>
                    </div>
                  </div>
                ))}
                
                <div className="pt-2 mt-2 border-t border-border">
                  <Button 
                    variant="secondary" 
                    className="w-full text-xs h-8" 
                    onClick={handleSearch}
                  >
                    <i className="fas fa-search mr-1"></i> See all results
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="w-full text-xs h-8 mt-1" 
                    onClick={() => {
                      setLocation('/search');
                      setIsExpanded(false);
                      setShowResults(false);
                    }}
                  >
                    <i className="fas fa-sliders-h mr-1"></i> Advanced Search
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};

export default GlobalSearch;