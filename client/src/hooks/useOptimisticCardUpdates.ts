import { useCallback } from 'react';
import { queryClient } from '@/lib/queryClient';
import { CollectionCard } from '@/types';
import { useToast } from '@/hooks/use-toast';

/**
 * Custom hook for providing optimistic updates when adding or removing cards
 * This prevents screen flashing when adding cards in the Set Viewer
 */
export function useOptimisticCardUpdates() {
  const { toast } = useToast();
  
  /**
   * Optimistically add a card to the collection before the API call completes
   * This provides immediate UI feedback and prevents screen flashing
   */
  const optimisticAddCard = useCallback((collectionId: number, cardId: string, cardName: string) => {
    // Get current collection cards from cache
    const currentCards = queryClient.getQueryData<CollectionCard[]>(['/api/collection-cards']) || [];
    
    // Find if the card already exists in this collection
    const existingCard = currentCards.find(
      card => card.cardId === cardId && card.collectionId === collectionId
    );
    
    if (existingCard) {
      // Update quantity of existing card
      const updatedCards = currentCards.map(card => {
        if (card.id === existingCard.id) {
          return { ...card, quantity: card.quantity + 1, updatedAt: new Date().toISOString() };
        }
        return card;
      });
      
      // Update cache immediately
      queryClient.setQueryData(['/api/collection-cards'], updatedCards);
    } else {
      // Create a temporary card with optimistic ID
      const optimisticCard: CollectionCard = {
        id: Date.now(), // Temporary ID that will be replaced on refresh
        collectionId: collectionId,
        cardId: cardId,
        quantity: 1,
        addedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // Add to cache
      queryClient.setQueryData(['/api/collection-cards'], [...currentCards, optimisticCard]);
    }
    
    return existingCard;
  }, []);
  
  /**
   * Optimistically remove a card from the collection before the API call completes
   * This provides immediate UI feedback and prevents screen flashing
   */
  const optimisticRemoveCard = useCallback((collectionId: number, cardId: string, cardName: string) => {
    // Get current collection cards from cache
    const currentCards = queryClient.getQueryData<CollectionCard[]>(['/api/collection-cards']) || [];
    
    // Find if the card exists in this collection
    const existingCard = currentCards.find(
      card => card.cardId === cardId && card.collectionId === collectionId
    );
    
    if (!existingCard) {
      // Card doesn't exist in collection
      return null;
    }
    
    if (existingCard.quantity > 1) {
      // Decrease quantity
      const updatedCards = currentCards.map(card => {
        if (card.id === existingCard.id) {
          return { ...card, quantity: card.quantity - 1, updatedAt: new Date().toISOString() };
        }
        return card;
      });
      
      // Update cache immediately
      queryClient.setQueryData(['/api/collection-cards'], updatedCards);
    } else {
      // Remove card entirely
      const filteredCards = currentCards.filter(card => !(
        card.cardId === cardId && card.collectionId === collectionId
      ));
      
      // Update cache immediately
      queryClient.setQueryData(['/api/collection-cards'], filteredCards);
    }
    
    return existingCard;
  }, []);
  
  /**
   * Schedule a silent background refresh after optimistic updates
   * to ensure data consistency without disrupting the user experience
   */
  const scheduleBackgroundRefresh = useCallback((refreshFn: () => Promise<any>) => {
    setTimeout(() => {
      refreshFn().catch(error => console.error("Background refresh failed:", error));
    }, 2000); // 2-second delay to ensure UI smoothness
  }, []);
  
  return {
    optimisticAddCard,
    optimisticRemoveCard,
    scheduleBackgroundRefresh
  };
}