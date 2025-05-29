import { useState, useEffect, useRef } from 'react';
import { Collection, CollectionCard, InsertCollection, InsertCollectionCard } from '@/types';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

/**
 * Custom hook for managing collections and collection cards with database persistence
 */
export function useCollections() {
  const { toast } = useToast();
  const [error, setError] = useState<Error | null>(null);

  // We'll use standard query approach instead of the dynamic import
  // This avoids potential circular dependency issues while maintaining consistency

  // Fetch collections for the current user with standardized query settings
  const { 
    data: collections = [],
    isLoading: isLoadingCollections,
    error: collectionsError,
    refetch: refetchCollections
  } = useQuery({
    queryKey: ['/api/collections', 'user-session'], // Session-aware query key
    retry: 1,
    staleTime: 30000, // Consider data stale after 30 seconds
    gcTime: 60000, // Keep unused data in cache for 1 minute
    refetchOnWindowFocus: true, 
    refetchOnMount: true, // Critical: Always fetch fresh data on mount
    refetchOnReconnect: true,
  });

  // Fetch cards for all collections with aggressive cross-device sync
  const {
    data: collectionCards = [],
    isLoading: isLoadingCards,
    error: cardsError,
    refetch: refetchCards
  } = useQuery({
    queryKey: ['/api/collection-cards'],
    retry: 1,
    staleTime: 0, // Always consider data stale for immediate updates
    gcTime: 5 * 1000, // Very short cache time for rapid invalidation
    refetchOnWindowFocus: true, 
    refetchOnMount: true, 
    refetchOnReconnect: true,
    refetchInterval: 5000, // Balanced 5-second polling for stability
    refetchIntervalInBackground: true, // Keep polling even when tab is inactive
    networkMode: 'always', // Always try to fetch from network
  });

  // Handle any errors from queries
  useEffect(() => {
    if (collectionsError) {
      setError(collectionsError instanceof Error 
        ? collectionsError 
        : new Error('Failed to fetch collections'));
    } else if (cardsError) {
      setError(cardsError instanceof Error 
        ? cardsError 
        : new Error('Failed to fetch collection cards'));
    } else {
      setError(null);
    }
  }, [collectionsError, cardsError]);

  // Create a new collection
  const createCollectionMutation = useMutation({
    mutationFn: async (data: Omit<Collection, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => {
      console.log('Creating collection with data:', data);
      const response = await apiRequest('POST', '/api/collections', data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/collections'] });
      toast({
        title: "Collectie aangemaakt",
        description: "Je nieuwe collectie is succesvol aangemaakt"
      });
    },
    onError: (error) => {
      toast({
        title: "Fout bij aanmaken collectie",
        description: error instanceof Error ? error.message : "Er is een fout opgetreden",
        variant: "destructive"
      });
    }
  });

  const createCollection = async (data: Omit<Collection, 'id' | 'createdAt' | 'updatedAt' | 'userId'>): Promise<Collection> => {
    return await createCollectionMutation.mutateAsync(data);
  };

  // Delete a collection
  const deleteCollectionMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/collections/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/collections'] });
      queryClient.invalidateQueries({ queryKey: ['/api/collection-cards'] });
      toast({
        title: "Collectie verwijderd",
        description: "De collectie is succesvol verwijderd"
      });
    },
    onError: (error) => {
      toast({
        title: "Fout bij verwijderen collectie",
        description: error instanceof Error ? error.message : "Er is een fout opgetreden",
        variant: "destructive"
      });
    }
  });

  const deleteCollection = async (id: number): Promise<void> => {
    await deleteCollectionMutation.mutateAsync(id);
  };
  
  // Update a collection
  const updateCollectionMutation = useMutation({
    mutationFn: async (collection: Collection) => {
      const { id, ...data } = collection;
      const response = await apiRequest('PUT', `/api/collections/${id}`, data);
      return await response.json();
    },
    onSuccess: (updatedCollection) => {
      queryClient.invalidateQueries({ queryKey: ['/api/collections'] });
      
      // Update global state for header/status bar if needed
      const activeCollectionNameGlobal = document.getElementById('activeCollectionNameGlobal');
      if (activeCollectionNameGlobal) {
        activeCollectionNameGlobal.textContent = updatedCollection.name;
      }
      
      toast({
        title: "Collectie bijgewerkt",
        description: "De collectie is succesvol bijgewerkt"
      });
    },
    onError: (error) => {
      toast({
        title: "Fout bij bijwerken collectie",
        description: error instanceof Error ? error.message : "Er is een fout opgetreden",
        variant: "destructive"
      });
    }
  });

  const updateCollection = async (collection: Collection): Promise<Collection> => {
    return await updateCollectionMutation.mutateAsync(collection);
  };

  // Add a card to a collection
  const addCardMutation = useMutation({
    mutationFn: async (data: InsertCollectionCard) => {
      const response = await apiRequest('POST', '/api/collection-cards', data);
      return await response.json();
    },
    onSuccess: (newCard) => {
      // Use the same optimistic UI update strategy as in updateCardQuantity
      // This prevents UI flickering and multiple rerenders
      queryClient.setQueryData(['/api/collection-cards'], (oldData: CollectionCard[] | undefined) => {
        if (!oldData) return [newCard];
        
        // First check if this card already exists in any form (perhaps with a different quantity)
        const existingCardIndex = oldData.findIndex(card => 
          card.cardId === newCard.cardId && card.collectionId === newCard.collectionId
        );
        
        if (existingCardIndex >= 0) {
          // Update the existing card instead of adding a new one to prevent duplicates
          const updatedCards = [...oldData];
          updatedCards[existingCardIndex] = newCard;
          return updatedCards;
        } else {
          // Add the new card to the existing data
          return [...oldData, newCard];
        }
      });
      
      // We don't need to invalidate the query because we're directly updating the cache
      // queryClient.invalidateQueries({ queryKey: ['/api/collection-cards'] });
    },
    onError: (error) => {
      toast({
        title: "Error adding card",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive"
      });
    }
  });

  const addCardToCollection = async (data: InsertCollectionCard): Promise<CollectionCard> => {
    return await addCardMutation.mutateAsync(data);
  };

  // Update a card's quantity
  const updateCardQuantityMutation = useMutation({
    mutationFn: async ({ 
      collectionId, 
      cardId, 
      quantity 
    }: { 
      collectionId: number; 
      cardId: string; 
      quantity: number 
    }) => {
      const response = await apiRequest('PUT', `/api/collection-cards/${cardId}`, { collectionId, quantity });
      return await response.json();
    },
    onSuccess: (data) => {
      // Instead of invalidating queries (which causes multiple renders),
      // directly update the cache with the new card data for a smoother experience
      queryClient.setQueryData(['/api/collection-cards'], (oldData: CollectionCard[] | undefined) => {
        if (!oldData) return [data];
        
        // Find and update the specific card in the cache
        const updatedData = oldData.map(card => {
          if (card.collectionId === data.collectionId && card.cardId === data.cardId) {
            return data;
          }
          return card;
        });
        
        return updatedData;
      });
    },
    onError: (error) => {
      console.error('Error updating card quantity:', error);
      toast({
        title: "Error updating card",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive"
      });
    }
  });

  const updateCardQuantity = async (
    collectionId: number, 
    cardId: string, 
    quantity: number
  ): Promise<CollectionCard> => {
    // First update the local cache optimistically for instant UI feedback
    const existingCards = queryClient.getQueryData<CollectionCard[]>(['/api/collection-cards']) || [];
    const existingCard = existingCards.find(card => 
      card.cardId === cardId && card.collectionId === collectionId
    );
    
    if (existingCard) {
      // Create an optimistic update with the new quantity
      const optimisticCard = { ...existingCard, quantity };
      
      // Update the cache immediately before the API call
      queryClient.setQueryData(['/api/collection-cards'], 
        existingCards.map(card => 
          (card.cardId === cardId && card.collectionId === collectionId) 
            ? optimisticCard 
            : card
        )
      );
    }
    
    // Then make the actual API call
    return await updateCardQuantityMutation.mutateAsync({ collectionId, cardId, quantity });
  };

  // Remove a card from a collection
  const removeCardMutation = useMutation({
    mutationFn: async ({ collectionId, cardId }: { collectionId: number; cardId: string }) => {
      await apiRequest('DELETE', `/api/collection-cards/${collectionId}/${cardId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/collection-cards'] });
      // No toast here to avoid duplicates
    },
    onError: (error) => {
      // No toast here to avoid duplicates
      console.error("Error in removeCardMutation:", error);
    }
  });

  const removeCardFromCollection = async (collectionId: number, cardId: string): Promise<void> => {
    try {
      console.log(`Removing card ${cardId} from collection ${collectionId}`);
      await removeCardMutation.mutateAsync({ collectionId, cardId });
      console.log(`Successfully removed card ${cardId} from collection ${collectionId}`);
      
      // Force refresh the collection cards data
      await refetchCards();
      
      // Toast notifications now handled in CollectionContext.tsx
    } catch (error) {
      console.error("Error in removeCardFromCollection:", error);
      // Error toast handled in CollectionContext.tsx
      throw error;
    }
  };

  const isLoading = isLoadingCollections || isLoadingCards || 
                    createCollectionMutation.isPending || 
                    deleteCollectionMutation.isPending || 
                    updateCollectionMutation.isPending ||
                    addCardMutation.isPending ||
                    updateCardQuantityMutation.isPending ||
                    removeCardMutation.isPending;

  return {
    collections,
    collectionCards,
    isLoading,
    error,
    createCollection,
    deleteCollection,
    updateCollection,
    addCardToCollection,
    updateCardQuantity,
    removeCardFromCollection,
    refetchCards,
    refetchCollections
  };
}
