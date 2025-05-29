import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Card } from '@/api/pokemonTCG';
import CardItem from '@/components/CardItem';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import CardDetail from '@/components/CardDetail';
import { fetchCard, searchCards } from '@/api/pokemonTCG';
import { useCollectionContext } from '@/context/CollectionContext';
import { Loader2 } from 'lucide-react';

const SearchResults: React.FC = () => {
  const [location] = useLocation();
  const { getCardQuantity } = useCollectionContext();
  
  // Get query from URL
  const params = new URLSearchParams(location.split('?')[1]);
  const searchQuery = params.get('query') || '';
  
  // State for selected card and modal
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  
  // Fetch search results directly from Pokemon TCG API
  const { data: searchResults, isLoading, error } = useQuery({
    queryKey: ['pokemon-tcg-search', searchQuery],
    queryFn: async () => {
      if (!searchQuery) return { data: [], totalCount: 0 };
      
      try {
        console.log('Searching for cards with query:', searchQuery);
        const results = await searchCards(searchQuery);
        console.log('Search results:', results);
        return results;
      } catch (err) {
        console.error('Error searching:', err);
        throw err;
      }
    },
    enabled: !!searchQuery
  });
  
  // Fetch card details when a card is selected
  const { data: cardDetails, isLoading: isCardLoading } = useQuery({
    queryKey: [`pokemon-tcg-card-${selectedCard}`],
    queryFn: async () => {
      if (!selectedCard) return null;
      const card = await fetchCard(selectedCard);
      return card;
    },
    enabled: !!selectedCard
  });
  
  // Handle card click
  const handleCardClick = (cardId: string) => {
    setSelectedCard(cardId);
    setIsCardModalOpen(true);
  };
  
  // Display loading, error, or results
  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Search Results</h1>
        {searchQuery && (
          <p className="text-muted-foreground">
            Showing results for "{searchQuery}"
          </p>
        )}
        <Separator className="my-4" />
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-destructive mb-2">Error searching for cards</p>
          <p className="text-muted-foreground">Please try again with a different search term</p>
        </div>
      ) : searchResults && searchResults.data && searchResults.data.length > 0 ? (
        <div>
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-muted-foreground">
              Found {searchResults.totalCount || searchResults.data.length} cards
            </p>
            <Button 
              variant="outline" 
              onClick={() => window.history.back()}
            >
              Back
            </Button>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {searchResults.data.map((card: Card) => (
              <CardItem 
                key={card.id} 
                card={card} 
                onClick={() => handleCardClick(card.id)}
                quantity={getCardQuantity(card.id)}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-lg mb-2">No cards found matching your search</p>
          <p className="text-muted-foreground">Try adjusting your search term</p>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => window.history.back()}
          >
            Back
          </Button>
        </div>
      )}
      
      {/* Card Detail Modal */}
      {selectedCard && cardDetails && (
        <CardDetail 
          card={cardDetails}
          isOpen={isCardModalOpen}
          onClose={() => setIsCardModalOpen(false)}
        />
      )}
    </div>
  );
};

export default SearchResults;