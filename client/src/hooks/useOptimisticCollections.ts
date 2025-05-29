import { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useCollectionContext } from '@/context/CollectionContext';

interface CardOperation {
  cardId: string;
  collectionId: number;
  isAdding: boolean;
}

interface OptimisticCard {
  cardId: string;
  isInCollection: boolean;
  quantity: number;
  isLoading: boolean;
  hasError: boolean;
}

export const useOptimisticCollections = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { collections, addCardToCollection, removeCardFromCollection } = useCollectionContext();
  
  // Track optimistic states for cards
  const [optimisticCards, setOptimisticCards] = useState<Map<string, OptimisticCard>>(new Map());

  // Get current card state including optimistic updates
  const getCardState = useCallback((cardId: string) => {
    const optimistic = optimisticCards.get(cardId);
    if (optimistic) {
      return optimistic;
    }

    // Check real collection data
    let totalQuantity = 0;
    let isInCollection = false;
    
    collections.forEach(collection => {
      // This will be updated when we connect to real collection data
      // For now, return default state
    });

    return {
      cardId,
      isInCollection,
      quantity: totalQuantity,
      isLoading: false,
      hasError: false,
    };
  }, [optimisticCards, collections]);

  // Add card mutation with optimistic updates
  const addCardMutation = useMutation({
    mutationFn: async ({ cardId }: { cardId: string }) => {
      return await addCardToCollection(cardId);
    },
    onMutate: async ({ cardId }) => {
      // Optimistically update the UI immediately
      setOptimisticCards(prev => {
        const newMap = new Map(prev);
        const current = newMap.get(cardId) || { 
          cardId, 
          isInCollection: false, 
          quantity: 0, 
          isLoading: false, 
          hasError: false 
        };
        
        newMap.set(cardId, {
          ...current,
          isInCollection: true,
          quantity: current.quantity + 1,
          isLoading: true,
          hasError: false,
        });
        
        return newMap;
      });

      // Return context for rollback
      return { cardId, previousState: optimisticCards.get(cardId) };
    },
    onSuccess: (data, { cardId }) => {
      // Update optimistic state to reflect success
      setOptimisticCards(prev => {
        const newMap = new Map(prev);
        const current = newMap.get(cardId);
        if (current) {
          newMap.set(cardId, {
            ...current,
            isLoading: false,
            hasError: false,
          });
        }
        return newMap;
      });

      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['/api/collections'] });
      queryClient.invalidateQueries({ queryKey: ['/api/collection-cards'] });
      
      // Show success feedback
      toast({
        title: "Card added!",
        description: "Successfully added to your collection",
        duration: 2000,
      });
    },
    onError: (error, { cardId }, context) => {
      // Rollback optimistic update
      setOptimisticCards(prev => {
        const newMap = new Map(prev);
        if (context?.previousState) {
          newMap.set(cardId, context.previousState);
        } else {
          newMap.delete(cardId);
        }
        return newMap;
      });

      // Show error feedback
      toast({
        title: "Failed to add card",
        description: "There was a problem adding the card. Please try again.",
        variant: "destructive",
        duration: 3000,
      });
    },
  });

  // Remove card mutation with optimistic updates
  const removeCardMutation = useMutation({
    mutationFn: async ({ cardId }: { cardId: string }) => {
      return await removeCardFromCollection(cardId);
    },
    onMutate: async ({ cardId }) => {
      // Optimistically update the UI immediately
      setOptimisticCards(prev => {
        const newMap = new Map(prev);
        const current = newMap.get(cardId) || { 
          cardId, 
          isInCollection: true, 
          quantity: 1, 
          isLoading: false, 
          hasError: false 
        };
        
        const newQuantity = Math.max(0, current.quantity - 1);
        
        newMap.set(cardId, {
          ...current,
          isInCollection: newQuantity > 0,
          quantity: newQuantity,
          isLoading: true,
          hasError: false,
        });
        
        return newMap;
      });

      return { cardId, previousState: optimisticCards.get(cardId) };
    },
    onSuccess: (data, { cardId }) => {
      // Update optimistic state to reflect success
      setOptimisticCards(prev => {
        const newMap = new Map(prev);
        const current = newMap.get(cardId);
        if (current) {
          newMap.set(cardId, {
            ...current,
            isLoading: false,
            hasError: false,
          });
        }
        return newMap;
      });

      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['/api/collections'] });
      queryClient.invalidateQueries({ queryKey: ['/api/collection-cards'] });
      
      // Show success feedback
      toast({
        title: "Card removed!",
        description: "Successfully removed from your collection",
        duration: 2000,
      });
    },
    onError: (error, { cardId }, context) => {
      // Rollback optimistic update
      setOptimisticCards(prev => {
        const newMap = new Map(prev);
        if (context?.previousState) {
          newMap.set(cardId, context.previousState);
        } else {
          newMap.delete(cardId);
        }
        return newMap;
      });

      // Show error feedback
      toast({
        title: "Failed to remove card",
        description: "There was a problem removing the card. Please try again.",
        variant: "destructive",
        duration: 3000,
      });
    },
  });

  // Quick add/remove functions
  const addCard = useCallback(async (cardId: string, cardName: string) => {
    if (collections.length === 0) {
      toast({
        title: "No collections found",
        description: "Please create a collection first",
        variant: "destructive",
      });
      return;
    }

    // Call the mutation with just cardId - the collection context handles which collection to use
    addCardMutation.mutate({ cardId });
  }, [collections, addCardMutation, toast]);

  const removeCard = useCallback(async (cardId: string, cardName: string) => {
    if (collections.length === 0) return;
    
    // Call the mutation with just cardId - the collection context handles which collection to use
    removeCardMutation.mutate({ cardId });
  }, [collections, removeCardMutation]);

  // Clean up optimistic state when it matches real state
  const cleanupOptimisticState = useCallback((cardId: string) => {
    setOptimisticCards(prev => {
      const newMap = new Map(prev);
      const optimistic = newMap.get(cardId);
      
      if (optimistic && !optimistic.isLoading && !optimistic.hasError) {
        // If the optimistic state is stable, we can clean it up
        // after a short delay to let the real data sync
        setTimeout(() => {
          setOptimisticCards(current => {
            const updated = new Map(current);
            updated.delete(cardId);
            return updated;
          });
        }, 1000);
      }
      
      return newMap;
    });
  }, []);

  return {
    getCardState,
    addCard,
    removeCard,
    isAddingCard: addCardMutation.isPending,
    isRemovingCard: removeCardMutation.isPending,
    cleanupOptimisticState,
  };
};