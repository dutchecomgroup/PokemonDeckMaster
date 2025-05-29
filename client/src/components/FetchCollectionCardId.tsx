import React, { useState, useEffect } from 'react';
import { useCollectionContext } from '@/context/CollectionContext';
import { Badge } from '@/components/ui/badge';

interface FetchCollectionCardIdProps {
  cardId: string;
}

const FetchCollectionCardId: React.FC<FetchCollectionCardIdProps> = ({ cardId }) => {
  const [inCollection, setInCollection] = useState<boolean>(false);
  const [quantity, setQuantity] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { activeCollection } = useCollectionContext();
  
  useEffect(() => {
    const fetchCardStatus = async () => {
      if (!activeCollection || !cardId) {
        setInCollection(false);
        setQuantity(0);
        setIsLoading(false);
        return;
      }
      
      try {
        setIsLoading(true);
        const response = await fetch(`/api/collection-cards?collectionId=${activeCollection.id}&cardId=${cardId}`);
        
        if (response.ok) {
          const data = await response.json();
          setInCollection(true);
          setQuantity(data.quantity || 1);
        } else {
          setInCollection(false);
          setQuantity(0);
        }
      } catch (error) {
        console.error('Error checking card collection status:', error);
        setInCollection(false);
        setQuantity(0);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchCardStatus();
  }, [cardId, activeCollection]);
  
  if (isLoading) {
    return <div className="text-muted-foreground text-xs">Checking collection...</div>;
  }
  
  if (!inCollection) {
    return <div className="text-muted-foreground text-xs">Not in collection</div>;
  }
  
  return (
    <Badge variant="outline" className="bg-primary/10 text-xs">
      In Collection {quantity > 1 ? `(${quantity})` : ''}
    </Badge>
  );
};

export default FetchCollectionCardId;