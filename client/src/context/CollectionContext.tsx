import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useCollections } from '@/hooks/useCollections';
import { fetchCard } from '@/api/pokemonTCG';
import { Collection, CollectionCard, Card, InsertCollectionCard } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { queryClient } from '@/lib/queryClient';
import { useOptimisticCardUpdates } from '@/hooks/useOptimisticCardUpdates';

interface CollectionContextProps {
  collections: Collection[];
  activeCollection: Collection | null;
  collection: CollectionCard[];
  isLoading: boolean;
  error: Error | null;
  setActiveCollection: (id: number | null) => void;
  createCollection: (data: Omit<Collection, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => Promise<Collection>;
  deleteCollection: (id: number) => Promise<void>;
  updateCollection: (collection: Collection) => Promise<Collection>;
  addCardToCollection: (cardId: string) => Promise<void>;
  removeCardFromCollection: (cardId: string) => Promise<void>;
  getCollectionCards: (collectionId?: string | number) => string[];
  getCollectionCardObjects: () => Card[];
  getAllCollectionCards: () => Card[];
  getCardQuantity: (cardId: string) => number;
  refetchCollectionCards: () => Promise<any>;
}

const CollectionContext = createContext<CollectionContextProps | undefined>(undefined);

export function CollectionProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeCollectionId, setActiveCollectionId] = useLocalStorage<number | null>('activeCollectionId', null);
  const [cardsCache, setCardsCache] = useLocalStorage<Record<string, Card>>('cardsCache', {});

  // Get collections and cards from the database with proper typing
  const collectionsData = useCollections();
  
  // Explicitly define our collections and cards as arrays to fix TypeScript errors
  const collections: Collection[] = Array.isArray(collectionsData.collections) 
    ? collectionsData.collections 
    : [];
    
  const collectionCards: CollectionCard[] = Array.isArray(collectionsData.collectionCards) 
    ? collectionsData.collectionCards 
    : [];
    
  const {
    isLoading,
    error,
    createCollection: createCollectionRequest,
    deleteCollection: deleteCollectionRequest,
    updateCollection: updateCollectionRequest,
    addCardToCollection: addCardRequest,
    updateCardQuantity,
    removeCardFromCollection: removeCardRequest,
    refetchCards,
    refetchCollections
  } = collectionsData;

  const [activeCollection, setActiveCollection] = useState<Collection | null>(null);

  // Set active collection whenever activeCollectionId or collections change
  useEffect(() => {
    if (activeCollectionId && collections.length > 0) {
      const collection = collections.find((c: Collection) => c.id === activeCollectionId) || null;
      setActiveCollection(collection);
      
      // Update global state (header/status bar)
      if (collection) {
        const activeCollectionIndicator = document.getElementById('activeCollectionIndicator');
        const activeCollectionNameGlobal = document.getElementById('activeCollectionNameGlobal');
        
        if (activeCollectionIndicator) activeCollectionIndicator.classList.remove('hidden');
        if (activeCollectionNameGlobal) activeCollectionNameGlobal.textContent = collection.name;
      }
    } else {
      setActiveCollection(null);
      
      // Update global state (header/status bar)
      const activeCollectionIndicator = document.getElementById('activeCollectionIndicator');
      if (activeCollectionIndicator) activeCollectionIndicator.classList.add('hidden');
    }
  }, [activeCollectionId, collections]);

  const handleSetActiveCollection = (id: number | null) => {
    // Show loading toast to provide feedback during the operation
    if (id) {
      // Find the collection name to display in the toast
      const collectionName = collections.find(c => c.id === id)?.name || "Collection";
      
      toast({
        title: `Opening ${collectionName}`,
        description: "Loading your cards...",
        duration: 2000
      });
      
      // When selecting a specific collection, automatically exit "Show All Collections" mode
      const event = new CustomEvent('viewCollectionChange', { 
        detail: { viewAllCollections: false } 
      });
      window.dispatchEvent(event);
      window.localStorage.setItem('viewAllCollections', 'false');
    }
    
    // Set the active collection ID immediately
    setActiveCollectionId(id);
  };

  const createCollection = async (data: Omit<Collection, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => {
    const newCollection = await createCollectionRequest(data);
    // Automatically set as active collection
    setActiveCollectionId(newCollection.id);
    return newCollection;
  };

  const deleteCollection = async (id: number) => {
    await deleteCollectionRequest(id);
    // If the deleted collection was active, clear the active collection
    if (activeCollectionId === id) {
      setActiveCollectionId(null);
    }
  };
  
  const updateCollection = async (collection: Collection) => {
    return await updateCollectionRequest(collection);
  };

  // Use our custom hook for optimistic UI updates
  const { optimisticAddCard, optimisticRemoveCard, scheduleBackgroundRefresh } = useOptimisticCardUpdates();
  
  // Track card operations in progress with a simple object to prevent duplicates
  const [pendingOps, setPendingOps] = useState<Record<string, boolean>>({});
  
  const addCardToCollection = async (cardId: string) => {
    if (!activeCollection) {
      toast({
        title: "No active collection", 
        description: "Please select a collection first",
        variant: "destructive"
      });
      return;
    }
    
    // Create a unique operation ID to prevent duplicate requests
    const operationId = `add-${activeCollection.id}-${cardId}`;
    
    // Skip if this operation is already in progress
    if (pendingOps[operationId]) {
      return;
    }
    
    // Mark operation as in-progress
    setPendingOps(prev => ({ ...prev, [operationId]: true }));
    
    try {
      // Check if we have the card details in cache
      if (!cardsCache[cardId]) {
        const cardData = await fetchCard(cardId);
        setCardsCache(prev => ({
          ...prev,
          [cardId]: cardData
        }));
      }
      
      // Get the card name for toast messages
      const cardName = cardsCache[cardId]?.name || "Card";
      
      // IMPORTANT FIX: Use optimistic updates to prevent screen flashing
      // Update the UI immediately before making the API call
      const existingCard = optimisticAddCard(
        activeCollection.id,
        cardId, 
        cardName
      );
      
      // Show success toast immediately after optimistic update
      toast({
        title: "Card Added",
        description: `${cardName} added to ${activeCollection.name}`,
        variant: "default",
        duration: 2000,
      });
      
      // Now make the actual API call in the background
      let result;
      if (existingCard) {
        // Update quantity
        result = await updateCardQuantity(
          existingCard.collectionId, 
          existingCard.cardId, 
          existingCard.quantity + 1
        );
      } else {
        // Add new card
        result = await addCardRequest({
          collectionId: activeCollection.id,
          cardId,
          quantity: 1
        });
      }
      
      // Immediately invalidate cache and refetch to ensure sync across devices
      queryClient.invalidateQueries({ queryKey: ['/api/collection-cards'] });
      queryClient.invalidateQueries({ queryKey: ['/api/collections'] });
      await refetchCards();
      
      // Return void to match interface
      return;
    } catch (error) {
      console.error('Failed to add card to collection:', error);
      toast({
        title: "Error adding card",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive"
      });
      throw error;
    } finally {
      // Clear the pending operation flag
      setTimeout(() => {
        setPendingOps(prev => {
          const updated = { ...prev };
          delete updated[operationId];
          return updated;
        });
      }, 500);
    }
  };

  const removeCardFromCollection = async (cardId: string) => {
    if (!activeCollection) {
      toast({
        title: "Error",
        description: "No collection is currently active",
        variant: "destructive"
      });
      return;
    }
    
    // Create a unique operation ID to prevent duplicate requests
    const operationId = `remove-${activeCollection.id}-${cardId}`;
    
    // Skip if this operation is already in progress
    if (pendingOps[operationId]) {
      return;
    }
    
    // Mark operation as in-progress
    setPendingOps(prev => ({ ...prev, [operationId]: true }));
    
    try {
      // Get the card name for toast messages if available
      const cardName = cardsCache[cardId]?.name || "Card";
      
      const existingCard = collectionCards.find(
        (card: CollectionCard) => card.cardId === cardId && card.collectionId === activeCollection.id
      );
      
      if (!existingCard) {
        toast({
          title: "Card Not Found",
          description: "This card was not found in your collection",
          variant: "destructive"
        });
        
        // Clear the pending operation flag for this card
        setPendingOps(prev => {
          const updated = { ...prev };
          delete updated[operationId];
          return updated;
        });
        
        return;
      }
      
      // OPTIMISTIC UPDATE: Update the UI immediately before API call
      // This prevents screen flashing and gives immediate feedback
      optimisticRemoveCard(
        activeCollection.id,
        cardId,
        cardName
      );
      
      // Show immediate toast feedback based on quantity
      if (existingCard.quantity > 1) {
        toast({
          title: "Card Updated",
          description: `Quantity decreased to ${existingCard.quantity - 1}`,
          variant: "default",
          duration: 2000,
        });
      } else {
        toast({
          title: "Card Removed",
          description: `${cardName} removed from ${activeCollection.name}`,
          variant: "default",
          duration: 2000,
        });
      }
      
      // MAKE THE ACTUAL API CALL IN THE BACKGROUND
      if (existingCard.quantity > 1) {
        // Decrease quantity
        await updateCardQuantity(
          existingCard.collectionId, 
          existingCard.cardId, 
          existingCard.quantity - 1
        );
      } else {
        // Remove completely
        await removeCardRequest(activeCollection.id, cardId);
      }
      
      // Immediately invalidate cache and refetch to ensure sync across devices
      queryClient.invalidateQueries({ queryKey: ['/api/collection-cards'] });
      queryClient.invalidateQueries({ queryKey: ['/api/collections'] });
      await refetchCards();
      
    } catch (error) {
      console.error('Failed to remove card from collection:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to remove card",
        variant: "destructive"
      });
    } finally {
      // Clear the pending operation flag
      setTimeout(() => {
        setPendingOps(prev => {
          const updated = { ...prev };
          delete updated[operationId];
          return updated;
        });
      }, 500);
    }
  };

  // Get card IDs from a specific collection
  const getCollectionCards = (collectionId?: string | number): string[] => {
    // If no collection ID is provided, use the active collection
    const targetCollectionId = collectionId || (activeCollection ? activeCollection.id : null);
    
    if (!targetCollectionId) return [];
    
    // Convert to number for comparison with collectionId
    const numericId = typeof targetCollectionId === 'string' ? parseInt(targetCollectionId, 10) : targetCollectionId;
    
    // Get all cards for the specified collection
    const targetCards = collectionCards.filter((card: CollectionCard) => card.collectionId === numericId);
    
    // Debug sync issues across devices
    console.log(`[SYNC DEBUG] Collection ${numericId}: Total in context: ${collectionCards.length}, Filtered: ${targetCards.length}, Device: ${navigator.userAgent.slice(0, 20)}`);
    if (numericId === 37) {
      console.log(`[SYNC DEBUG] Beta Collection details:`, {
        allCards: collectionCards.map(c => ({ id: c.id, cardId: c.cardId, collectionId: c.collectionId })),
        filteredCards: targetCards.map(c => ({ id: c.id, cardId: c.cardId, collectionId: c.collectionId }))
      });
    }
    
    // Return just the card IDs
    return targetCards.map((card: CollectionCard) => card.cardId);
  };
  
  // Get card objects from the active collection
  const getCollectionCardObjects = (): Card[] => {
    if (!activeCollection) return [];
    
    // Get all cards for the active collection
    const activeCards = collectionCards.filter((card: CollectionCard) => card.collectionId === activeCollection.id);
    
    // Debug: Log mobile card loading issues
    console.log(`[MOBILE DEBUG] Active collection ${activeCollection.id}: ${activeCards.length} cards in database`);
    console.log(`[MOBILE DEBUG] Cards cache size: ${Object.keys(cardsCache).length}`);
    
    // If cache is empty, trigger card fetching for missing cards
    if (Object.keys(cardsCache).length === 0 && activeCards.length > 0) {
      console.log(`[MOBILE DEBUG] Cache empty, triggering card fetches for ${activeCards.length} cards`);
      
      // Fetch missing cards asynchronously
      activeCards.forEach(async (collectionCard) => {
        try {
          const cardData = await fetchCard(collectionCard.cardId);
          if (cardData) {
            setCardsCache(prev => ({
              ...prev,
              [collectionCard.cardId]: cardData
            }));
          }
        } catch (error) {
          console.error(`Failed to fetch card ${collectionCard.cardId}:`, error);
        }
      });
      
      // Return empty for now, cards will display once fetched
      return [];
    }
    
    // Map to card objects with quantity, filtering out cards without data
    const mappedCards = activeCards
      .map((collectionCard: CollectionCard) => {
        const cardData = cardsCache[collectionCard.cardId];
        
        if (!cardData) {
          // Debug: Log missing cards on mobile
          console.log(`[MOBILE DEBUG] Missing card data for ${collectionCard.cardId} in cache`);
          return null;
        }
        
        return {
          ...cardData,
          quantity: collectionCard.quantity,
          setId: cardData.set?.id || '',
          collectionId: collectionCard.collectionId
        } as Card;
      })
      .filter((card): card is Card => card !== null);
    
    console.log(`[MOBILE DEBUG] Final mapped cards: ${mappedCards.length} of ${activeCards.length}`);
    return mappedCards;
  };
  
  // Get cards from all collections
  const getAllCollectionCards = (): Card[] => {
    if (collections.length === 0) return [];
    
    // Group cards by cardId (to combine quantities across collections)
    const cardMap = new Map<string, { cardData: Card | null, totalQuantity: number, collectionIds: number[] }>();
    
    // Process all collection cards
    collectionCards.forEach((collectionCard: CollectionCard) => {
      const cardId = collectionCard.cardId;
      const cardData = cardsCache[cardId];
      
      if (!cardMap.has(cardId)) {
        cardMap.set(cardId, { 
          cardData, 
          totalQuantity: collectionCard.quantity,
          collectionIds: [collectionCard.collectionId]
        });
      } else {
        const existing = cardMap.get(cardId)!;
        existing.totalQuantity += collectionCard.quantity;
        existing.collectionIds.push(collectionCard.collectionId);
      }
    });
    
    // Convert map to array of cards
    return Array.from(cardMap, ([cardId, { cardData, totalQuantity, collectionIds }]) => {
      if (!cardData) {
        // If card data is not in cache, return minimal info with a placeholder card
        return {
          id: cardId,
          name: 'Loading...',
          number: '',
          images: { small: '', large: '' },
          quantity: totalQuantity,
          setId: '',
          collections: collectionIds
        } as Card;
      }
      
      // Return the card with added collection data
      return {
        ...cardData,
        quantity: totalQuantity,
        collections: collectionIds
      } as Card;
    });
  };

  const getCardQuantity = (cardId: string): number => {
    if (!activeCollection) return 0;
    
    const card = collectionCards.find(
      (card: CollectionCard) => card.cardId === cardId && card.collectionId === activeCollection.id
    );
    
    return card?.quantity || 0;
  };

  return (
    <CollectionContext.Provider
      value={{
        collections: collections as Collection[],
        activeCollection,
        collection: collectionCards as CollectionCard[],
        isLoading,
        error,
        setActiveCollection: handleSetActiveCollection,
        createCollection,
        deleteCollection,
        updateCollection,
        addCardToCollection,
        removeCardFromCollection,
        getCollectionCards,
        getCollectionCardObjects,
        getAllCollectionCards,
        getCardQuantity,
        refetchCollectionCards: refetchCards
      }}
    >
      {children}
    </CollectionContext.Provider>
  );
}

export function useCollectionContext() {
  const context = useContext(CollectionContext);
  if (context === undefined) {
    throw new Error('useCollectionContext must be used within a CollectionProvider');
  }
  return context;
}