import React, { useState, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const DirectSearchLink: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Focus input when expanded
  React.useEffect(() => {
    if (isExpanded && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isExpanded]);
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (searchQuery.trim()) {
      // Direct navigation to search page with the query parameter
      window.location.href = `/search?query=${encodeURIComponent(searchQuery.trim())}`;
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsExpanded(false);
    } else if (e.key === 'Enter') {
      handleSearch(e as unknown as React.FormEvent);
    }
  };
  
  return (
    <div className="relative">
      <div 
        className={`flex items-center transition-all duration-300 rounded-full ${
          isExpanded 
            ? 'bg-background border border-border py-1 pl-3 pr-1' 
            : 'bg-transparent hover:bg-muted/30 p-2'
        }`}
      >
        {isExpanded ? (
          <form onSubmit={handleSearch} className="flex items-center w-full sm:w-72">
            <i className="fas fa-search text-muted-foreground mr-2"></i>
            <Input
              ref={inputRef}
              type="text"
              placeholder="Search cards..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-grow bg-transparent border-none shadow-none focus-visible:ring-0 text-foreground placeholder-muted-foreground"
            />
            <Button 
              type="button"
              size="sm" 
              variant="ghost" 
              className="h-8 w-8 p-0 rounded-full flex items-center justify-center"
              onClick={() => {
                setIsExpanded(false);
                setSearchQuery('');
              }}
            >
              <i className="fas fa-times text-muted-foreground"></i>
            </Button>
          </form>
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
    </div>
  );
};

export default DirectSearchLink;