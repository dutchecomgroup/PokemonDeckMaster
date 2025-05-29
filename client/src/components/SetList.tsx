import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { fetchSets } from '@/api/pokemonTCG';
import { formatDate, debounce } from '@/lib/utils';

const SetList: React.FC = () => {
  const [location] = useLocation();
  const [filter, setFilter] = useState('');
  const [filteredSets, setFilteredSets] = useState<any[]>([]);
  
  const { data: sets = [], isLoading, error } = useQuery({
    queryKey: ['/api/sets'],
    queryFn: () => fetchSets()
  });
  
  // Group sets by year
  const groupedSets = React.useMemo(() => {
    const grouped: { [key: string]: any[] } = {};
    
    filteredSets.forEach(set => {
      let year = 'Unknown Year';
      if (set.releaseDate) {
        try {
          year = new Date(set.releaseDate).getFullYear().toString() || 'Unknown Year';
        } catch (e) { /* default */ }
      }
      
      if (!grouped[year]) {
        grouped[year] = [];
      }
      
      grouped[year].push(set);
    });
    
    return grouped;
  }, [filteredSets]);
  
  // Sort years in descending order (newest first)
  const sortedYears = React.useMemo(() => {
    return Object.keys(groupedSets).sort((a, b) => {
      if (a === 'Unknown Year') return 1;
      if (b === 'Unknown Year') return -1;
      return Number(b) - Number(a);
    });
  }, [groupedSets]);
  
  // Handle filter change with debounce
  const handleFilterChange = debounce((value: string) => {
    setFilter(value);
  }, 300);
  
  // Filter sets based on search input and initialize
  useEffect(() => {
    if (!sets || !Array.isArray(sets) || sets.length === 0) {
      if (filteredSets.length > 0) {
        setFilteredSets([]);
      }
      return;
    }
    
    if (!filter.trim()) {
      if (JSON.stringify(filteredSets) !== JSON.stringify(sets)) {
        setFilteredSets([...sets]);
      }
      return;
    }
    
    const filtered = sets.filter(set => 
      set?.name?.toLowerCase().includes(filter.toLowerCase())
    );
    
    if (JSON.stringify(filteredSets) !== JSON.stringify(filtered)) {
      setFilteredSets(filtered);
    }
  }, [sets, filter]);
  
  if (isLoading) {
    return (
      <div className="space-y-3">
        <input 
          type="text" 
          placeholder="Filter sets by name..." 
          className="w-full bg-input text-foreground placeholder-muted-foreground border border-border rounded-md py-2 px-3 focus:ring-1 focus:ring-primary focus:border-primary focus:outline-none"
          onChange={(e) => handleFilterChange(e.target.value)}
        />
        <div className="border border-border rounded-md h-96 overflow-y-auto scrollbar-thin flex items-center justify-center text-muted-foreground text-sm">
          <i className="fas fa-spinner fa-spin mr-2"></i> Loading sets...
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="space-y-3">
        <input 
          type="text" 
          placeholder="Filter sets by name..." 
          className="w-full bg-input text-foreground placeholder-muted-foreground border border-border rounded-md py-2 px-3 focus:ring-1 focus:ring-primary focus:border-primary focus:outline-none"
          onChange={(e) => handleFilterChange(e.target.value)}
        />
        <div className="border border-border rounded-md h-96 overflow-y-auto scrollbar-thin flex items-center justify-center text-destructive text-sm p-3 text-center">
          <span>Error loading sets. Please try again later.</span>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-3">
      <input 
        type="text" 
        placeholder="Filter sets by name..." 
        className="w-full bg-input text-foreground placeholder-muted-foreground border border-border rounded-md py-2 px-3 focus:ring-1 focus:ring-primary focus:border-primary focus:outline-none"
        onChange={(e) => handleFilterChange(e.target.value)}
      />
      
      <div className="border border-border rounded-md h-96 overflow-y-auto scrollbar-thin">
        {sortedYears.length === 0 ? (
          <div className="p-3 text-center text-muted-foreground text-sm">
            No sets matching "{filter}"
          </div>
        ) : (
          sortedYears.map(year => (
            <div key={year} className="set-list-group">
              <div className="sticky top-0 z-10 bg-muted px-3 py-1.5 text-xs text-muted-foreground font-medium">
                {year}
              </div>
              
              {groupedSets[year].map(set => {
                const isActive = location === `/set/${set.id}`;
                const formattedDate = formatDate(set.releaseDate);
                
                return (
                  <Link 
                    key={set.id} 
                    href={`/set/${set.id}`}
                    className={`flex items-center py-2 px-3 border-b border-border hover:bg-muted transition-colors ${isActive ? 'set-item-active' : ''}`}
                  >
                    <img 
                      src={set.images.symbol} 
                      alt="" 
                      className="w-5 h-5 mr-2"
                      loading="lazy"
                    />
                    <span className={`text-sm ${isActive ? 'text-white' : 'text-foreground'} truncate flex-grow`}>
                      {set.name}
                    </span>
                    <span className={`text-xs ${isActive ? 'text-foreground/70' : 'text-muted-foreground'}`}>
                      {formattedDate}
                    </span>
                  </Link>
                );
              })}
            </div>
          ))
        )}
      </div>
      
      <p className="text-xs text-muted-foreground">
        Select a set to view all cards in the set.
      </p>
    </div>
  );
};

export default SetList;
