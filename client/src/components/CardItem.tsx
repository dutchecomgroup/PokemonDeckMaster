import React, { useState, useEffect } from 'react';
import { Card } from '@/api/pokemonTCG';
import { useCollectionContext } from '@/context/CollectionContext';
import { getRarityClass } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { PlusCircle, MinusCircle, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { fetchCard } from '@/api/pokemonTCG';
import ProgressiveImage from './ProgressiveImage';

type CardItemBaseProps = {
  isCompact?: boolean;
  quantity?: number;
  className?: string;
  showInfo?: boolean;
};

// Option 1: Use with a card object directly
interface CardObjectProps extends CardItemBaseProps {
  card: Card;
  cardId?: never;
  onClick: () => void;
}

// Option 2: Use with a card ID (fetches the card data)
interface CardIdProps extends CardItemBaseProps {
  card?: never;
  cardId: string;
  onClick?: () => void;
}

type CardItemProps = CardObjectProps | CardIdProps;

const CardItem: React.FC<CardItemProps> = ({ 
  card,
  cardId,
  onClick, 
  isCompact = false,
  quantity = 0,
  className = '',
  showInfo = true
}) => {
  const { activeCollection, addCardToCollection, removeCardFromCollection } = useCollectionContext();
  const { toast } = useToast();
  const [showingToast, setShowingToast] = useState(false);
  
  // Track locally if the card is being added to prevent duplicate adds
  const [isAddingCard, setIsAddingCard] = useState(false);
  // Track local quantity for optimistic UI updates
  const [localQuantity, setLocalQuantity] = useState(quantity);
  // Store locally if we've just added this card
  const [justAdded, setJustAdded] = useState(false);

  // If cardId is provided, fetch the card data with improved caching and error handling
  const { data: fetchedCard, isLoading, error } = useQuery({
    queryKey: ['card', cardId],
    queryFn: () => fetchCard(cardId!),
    enabled: !!cardId,
    staleTime: 60 * 60 * 1000, // 60 minutes - cards rarely change
    gcTime: 24 * 60 * 60 * 1000, // 24 hours - keep in cache longer
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Use either the directly provided card or the fetched card
  const cardData = card || fetchedCard;
  
  // When actual quantity from props changes, update local quantity
  useEffect(() => {
    setLocalQuantity(quantity);
  }, [quantity]);
  
  // Show loading state
  if (!cardData || (cardId && isLoading)) {
    return (
      <div className={`relative rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 border border-slate-200 dark:border-slate-700 ${className}`} 
           style={{ aspectRatio: '0.7', minHeight: isCompact ? '120px' : '200px' }}>
        <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
          <div className="w-6 h-6 border-2 border-primary rounded-full border-b-transparent animate-spin mb-2"></div>
          <span className="text-xs text-muted-foreground text-center">Loading card...</span>
        </div>
      </div>
    );
  }

  // Show error state if API failed but we have basic card info
  if (error && cardId) {
    return (
      <div className={`relative rounded-lg bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 border border-amber-200 dark:border-amber-700 ${className}`} 
           style={{ aspectRatio: '0.7', minHeight: isCompact ? '120px' : '200px' }}>
        <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
          <div className="w-8 h-8 rounded-full bg-amber-200 dark:bg-amber-800 flex items-center justify-center mb-2">
            <span className="text-amber-600 dark:text-amber-300 text-xs">⚠</span>
          </div>
          <span className="text-xs text-amber-600 dark:text-amber-300 text-center mb-1">Temporarily unavailable</span>
          <span className="text-xs text-muted-foreground text-center">{cardId}</span>
          {localQuantity > 0 && (
            <div className="absolute top-2 right-2 bg-green-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold">
              {localQuantity}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Show minimal card info if no images available
  if (!cardData.images?.small && !cardData.images?.large) {
    return (
      <div className={`relative rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border border-blue-200 dark:border-blue-700 ${className}`} 
           style={{ aspectRatio: '0.7', minHeight: isCompact ? '120px' : '200px' }}>
        <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
          <div className="w-8 h-8 rounded-full bg-blue-200 dark:bg-blue-800 flex items-center justify-center mb-2">
            <span className="text-blue-600 dark:text-blue-300 text-xs">🎴</span>
          </div>
          <span className="text-xs text-blue-600 dark:text-blue-300 text-center mb-1">Card in collection</span>
          {cardData.name && <span className="text-xs text-muted-foreground text-center">{cardData.name}</span>}
          {localQuantity > 0 && (
            <div className="absolute top-2 right-2 bg-green-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold">
              {localQuantity}
            </div>
          )}
        </div>
      </div>
    );
  }
  
  // Format the card number for display
  const formattedCardNumber = cardData.number ? `#${cardData.number}/${cardData.set.printedTotal}` : 'No. -';
  
  // Get the CSS class for the card's rarity
  const rarityClass = getRarityClass(cardData.rarity || '');
  
  // Handle card clicks, quantity changes without propagating to parent
  const handleClick = (e: React.MouseEvent) => {
    if (onClick) {
      onClick();
    }
  };
  
  const handleAddCard = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the card click
    
    // Skip if already adding or no collection selected
    if (isAddingCard || !activeCollection) {
      if (!activeCollection) {
        toast({
          title: 'No Collection Selected',
          description: 'Please select a collection first',
          variant: 'destructive',
        });
      }
      return;
    }
    
    // Mark as adding to prevent duplicate clicks and disable UI
    setIsAddingCard(true);
    setShowingToast(true);
    
    // OPTIMISTIC UPDATE: Immediately update the local quantity
    // This gives instant visual feedback without waiting for the server
    setLocalQuantity(prev => prev + 1);
    setJustAdded(true);
    
    // Show success toast
    toast({
      title: 'Card Added',
      description: `${cardData.name} added to ${activeCollection.name}`,
      variant: 'default',
      duration: 2000,
    });
    
    // Use requestAnimationFrame to delay the API call until after the current render is complete
    // This prevents React from immediately re-rendering due to state updates
    requestAnimationFrame(() => {
      // Fire and forget - don't wait for response in the UI
      addCardToCollection(cardData.id)
        .catch(error => {
          console.error('Failed to add card:', error);
          // Revert optimistic update if there was an error
          setLocalQuantity(quantity);
          setJustAdded(false);
          toast({
            title: 'Error',
            description: 'Failed to add card to collection',
            variant: 'destructive',
          });
        });
      
      // Allow another add after a short cooldown
      setTimeout(() => {
        setIsAddingCard(false);
        setShowingToast(false);
        // Keep the "just added" state for a bit longer to maintain visual feedback
        setTimeout(() => {
          setJustAdded(false);
        }, 2000);
      }, 1000);
    });
  };
  
  const handleRemoveCard = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the card click
    if (activeCollection && quantity > 0 && !showingToast) {
      try {
        console.log(`Removing card: ${cardData.id} from collection: ${activeCollection.id} (${activeCollection.name})`);
        setShowingToast(true);
        
        // Remove card and wait for confirmation
        await removeCardFromCollection(cardData.id);
        console.log(`Successfully removed card: ${cardData.id}`);
        
        // Show a success toast
        toast({
          title: 'Card Removed',
          description: `Removed ${cardData.name} from ${activeCollection.name}`,
          variant: 'default',
          duration: 2000,
        });
        
        // Reset after toast duration
        setTimeout(() => setShowingToast(false), 2000);
      } catch (error) {
        console.error('Failed to remove card:', error);
        toast({
          title: 'Error',
          description: error instanceof Error ? error.message : 'Failed to remove card from collection',
          variant: 'destructive',
        });
        setShowingToast(false);
      }
    } else if (!activeCollection) {
      console.log('No active collection selected');
      toast({
        title: 'No Collection Selected',
        description: 'Please select a collection first',
        variant: 'destructive',
      });
    } else if (quantity <= 0) {
      console.log('Card quantity is 0 or negative:', quantity);
      toast({
        title: 'Cannot Remove Card',
        description: 'This card is not in your collection',
        variant: 'destructive',
      });
    }
  };
  
  const handleInfoClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the card click
    if (onClick) {
      onClick(); // Show card details
    }
  };
  
  return (
    <div 
      className={`card-item bg-background rounded-lg overflow-hidden shadow-sm hover:shadow-lg border border-border transition-all duration-200 hover:scale-[1.02] touch-manipulation ${className}`}
      role="button"
      aria-label={`View details for ${cardData.name || 'Pokemon card'}`}
      tabIndex={0}
      style={{ 
        minHeight: isCompact ? '120px' : '200px',
        aspectRatio: isCompact ? 'auto' : '0.7'
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          if (onClick) onClick();
        }
      }}
    >
      {isCompact ? (
        // New compact view with cropped image and controls
        <>
          <div 
            className="relative h-28 cursor-pointer overflow-hidden" 
            onClick={handleClick}
          >
            <ProgressiveImage 
              src={cardData.images.small} 
              alt={cardData.name} 
              className="object-cover object-top"
              style={{ marginTop: '0px' }} // Show the actual top of the card
            />
            {quantity > 0 && (
              <span className="absolute top-2 right-2 bg-primary text-white text-xs font-bold px-2 py-1 rounded-full inline-flex items-center justify-center min-w-[1.5rem] min-h-[1.5rem] z-10">
                {quantity}
              </span>
            )}
          </div>
          
          {showInfo && (
            <div className="p-2 border-t border-border">
              <h4 className="text-xs font-medium text-foreground truncate mb-1" title={cardData.name}>
                {cardData.name}
              </h4>
              
              <div className="flex justify-between items-center text-xs mb-1.5">
                <span className="text-muted-foreground">{formattedCardNumber}</span>
                {cardData.rarity && (
                  <span className={`px-1.5 py-0.5 rounded ${rarityClass} text-white text-xs`}>
                    {cardData.rarity}
                  </span>
                )}
              </div>
            
              <div className="flex items-center justify-between gap-1 mt-auto">
                {activeCollection ? (
                  <>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="p-0 h-7 w-7 rounded-full hover:bg-muted-foreground/20"
                      onClick={handleRemoveCard}
                      disabled={quantity === 0}
                      title="Remove from collection"
                    >
                      <MinusCircle className="h-5 w-5" />
                    </Button>
                    
                    <Button 
                      size="sm" 
                      variant="ghost"
                      className="p-0 h-7 w-7 rounded-full hover:bg-muted-foreground/20"
                      onClick={handleInfoClick}
                      title="View details"
                    >
                      <Info className="h-5 w-5" />
                    </Button>
                    
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="p-0 h-7 w-7 rounded-full hover:bg-muted-foreground/20"
                      onClick={handleAddCard}
                      title="Add to collection"
                    >
                      <PlusCircle className="h-5 w-5" />
                    </Button>
                  </>
                ) : (
                  <Button 
                    size="sm" 
                    variant="ghost"
                    className="p-0 h-7 w-7 rounded-full hover:bg-muted-foreground/20 mx-auto"
                    onClick={handleInfoClick}
                    title="View details"
                  >
                    <Info className="h-5 w-5" />
                  </Button>
                )}
              </div>
            </div>
          )}
        </>
      ) : (
        // Full view 
        <>
          <div className="relative aspect-[2.5/3.8] cursor-pointer" onClick={handleClick}>
            <ProgressiveImage 
              src={cardData.images.small} 
              alt={cardData.name} 
              className="object-contain"
            />
            {quantity > 0 && (
              <span className="absolute top-2 right-2 bg-primary text-white text-xs font-bold px-2 py-1 rounded-full inline-flex items-center justify-center min-w-[1.5rem] min-h-[1.5rem] z-10">
                {quantity}
              </span>
            )}
          </div>
          
          <div className="p-2 sm:p-3 border-t border-border">
            <h4 className="text-sm font-medium text-foreground truncate" title={cardData.name}>
              {cardData.name}
            </h4>
            <div className="flex justify-between items-center mt-1">
              <span className="text-xs text-muted-foreground">{formattedCardNumber}</span>
              {cardData.rarity && (
                <span className={`text-xs px-1.5 py-0.5 rounded ${rarityClass} text-white`}>
                  {cardData.rarity}
                </span>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default CardItem;