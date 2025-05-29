import React, { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Camera, Upload, ThumbsUp, ImagePlus, X, ChevronRight, ChevronLeft, Check, Plus } from 'lucide-react';
import { useCollectionContext } from '@/context/CollectionContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";

declare global {
  interface Window {
    showToast?: (message: string, type: 'success' | 'error' | 'info') => void;
  }
}

interface RecognizedCard {
  cardName: string;
  setName?: string;
  cardNumber?: string;
  setSymbol?: string;
  rarity?: string;
}

interface CardRecognitionResult {
  id: number;
  recognizedCard: RecognizedCard | null;
  cardMatches: any[];
  selectedMatch: string | null;
  previewImage: string | null;
  isUploading: boolean;
  isSelected: boolean; // Whether this card is selected for adding to collection
}

const CardRecognition: React.FC = () => {
  const MAX_CARDS = 5;
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState("upload");
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [cardRecognitions, setCardRecognitions] = useState<CardRecognitionResult[]>([{
    id: Date.now(),
    recognizedCard: null,
    cardMatches: [],
    selectedMatch: null,
    previewImage: null,
    isUploading: false,
    isSelected: true
  }]);
  
  // View mode: 'grid' shows all cards, 'detail' shows one card with details
  const [viewMode, setViewMode] = useState<'grid' | 'detail'>('grid');
  const { addCardToCollection, activeCollection } = useCollectionContext();

  const getCurrentCard = () => cardRecognitions[currentCardIndex];
  
  const updateCurrentCard = (updates: Partial<CardRecognitionResult>) => {
    setCardRecognitions(prev => {
      const newCards = [...prev];
      newCards[currentCardIndex] = { ...newCards[currentCardIndex], ...updates };
      return newCards;
    });
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, fromCamera = false) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    // Handle single or multiple files
    const files = Array.from(e.target.files);
    
    // Limit to MAX_CARDS
    const filesToProcess = files.slice(0, MAX_CARDS);
    
    // Create a new card recognition result for each file
    const newRecognitions = filesToProcess.map((file, index) => {
      const previewImage = URL.createObjectURL(file);
      return {
        id: Date.now() + index,
        recognizedCard: null,
        cardMatches: [],
        selectedMatch: null,
        previewImage,
        isUploading: true,
        isSelected: true
      };
    });
    
    // Replace current card list if it only has one empty card, otherwise append (up to MAX_CARDS)
    if (cardRecognitions.length === 1 && !cardRecognitions[0].previewImage) {
      setCardRecognitions(newRecognitions);
    } else {
      const totalCards = cardRecognitions.length + newRecognitions.length;
      if (totalCards > MAX_CARDS) {
        window.showToast?.(`You can only upload up to ${MAX_CARDS} cards at once. Some cards will be skipped.`, 'info');
        const spaceLeft = Math.max(0, MAX_CARDS - cardRecognitions.length);
        const cardsToAdd = newRecognitions.slice(0, spaceLeft);
        setCardRecognitions(prev => [...prev, ...cardsToAdd]);
      } else {
        setCardRecognitions(prev => [...prev, ...newRecognitions]);
      }
    }
    
    // Set current index to the first new card
    const newIndex = cardRecognitions.length === 1 && !cardRecognitions[0].previewImage ? 0 : cardRecognitions.length;
    setCurrentCardIndex(newIndex);
    
    // Process each file
    filesToProcess.forEach((file, index) => {
      const cardIndex = cardRecognitions.length === 1 && !cardRecognitions[0].previewImage 
        ? index 
        : cardRecognitions.length + index;
      
      if (cardIndex < MAX_CARDS) {
        uploadAndRecognize(file, cardIndex);
      }
    });
    
    // Reset file input
    e.target.value = '';
  };

  const handleCameraCapture = () => {
    if (cameraInputRef.current) {
      cameraInputRef.current.click();
    }
  };
  
  const handleBrowseFiles = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const uploadAndRecognize = async (file: File, cardIndex: number) => {
    try {
      const formData = new FormData();
      formData.append('image', file);
      
      const response = await fetch('/api/recognize-card', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Failed to recognize card');
      }
      
      const data = await response.json();
      
      // Update the specific card in the array
      setCardRecognitions(prev => {
        const newCards = [...prev];
        if (cardIndex < newCards.length) {
          newCards[cardIndex] = { 
            ...newCards[cardIndex],
            recognizedCard: data.recognized,
            cardMatches: data.matches || [],
            selectedMatch: data.matches && data.matches.length > 0 ? data.matches[0].id : null,
            isUploading: false
          };
        }
        return newCards;
      });
      
      window.showToast?.('Card recognized successfully!', 'success');
    } catch (error) {
      console.error('Error recognizing card:', error);
      window.showToast?.('Failed to recognize card. Please try again.', 'error');
      
      // Mark the card as not uploading anymore, but keep the preview
      setCardRecognitions(prev => {
        const newCards = [...prev];
        if (cardIndex < newCards.length) {
          newCards[cardIndex] = { ...newCards[cardIndex], isUploading: false };
        }
        return newCards;
      });
    }
  };

  const handleAddToCollection = async () => {
    const currentCard = getCurrentCard();
    if (!currentCard.selectedMatch || !activeCollection) {
      window.showToast?.('Please select a card and ensure you have an active collection', 'error');
      return;
    }
    
    try {
      await addCardToCollection(currentCard.selectedMatch);
      window.showToast?.(`Card added to collection: ${activeCollection.name}`, 'success');
      
      // Remove this card from the array after adding to collection
      setCardRecognitions(prev => {
        if (prev.length === 1) {
          // If it's the last card, reset it instead of removing
          return [{
            id: Date.now(),
            recognizedCard: null,
            cardMatches: [],
            selectedMatch: null,
            previewImage: null,
            isUploading: false
          }];
        } else {
          // Remove current card and adjust the current index if needed
          const newCards = prev.filter((_, i) => i !== currentCardIndex);
          if (currentCardIndex >= newCards.length) {
            setCurrentCardIndex(Math.max(0, newCards.length - 1));
          }
          return newCards;
        }
      });
    } catch (error) {
      console.error('Error adding card to collection:', error);
      window.showToast?.('Failed to add card to collection', 'error');
    }
  };

  const handleAddAllToCollection = async () => {
    if (!activeCollection) {
      window.showToast?.('Please ensure you have an active collection', 'error');
      return;
    }

    const cardsToAdd = cardRecognitions
      .filter(card => card.selectedMatch)
      .map(card => card.selectedMatch as string);
    
    if (cardsToAdd.length === 0) {
      window.showToast?.('No cards selected to add', 'info');
      return;
    }
    
    try {
      let addedCount = 0;
      for (const cardId of cardsToAdd) {
        await addCardToCollection(cardId);
        addedCount++;
      }
      
      window.showToast?.(`${addedCount} cards added to collection: ${activeCollection.name}`, 'success');
      
      // Reset all cards
      setCardRecognitions([{
        id: Date.now(),
        recognizedCard: null,
        cardMatches: [],
        selectedMatch: null,
        previewImage: null,
        isUploading: false
      }]);
      setCurrentCardIndex(0);
    } catch (error) {
      console.error('Error adding cards to collection:', error);
      window.showToast?.('Failed to add some cards to collection', 'error');
    }
  };

  const handleReset = (resetAll: boolean = false) => {
    if (resetAll) {
      setCardRecognitions([{
        id: Date.now(),
        recognizedCard: null,
        cardMatches: [],
        selectedMatch: null,
        previewImage: null,
        isUploading: false
      }]);
      setCurrentCardIndex(0);
    } else {
      // Only reset the current card
      setCardRecognitions(prev => {
        if (prev.length === 1) {
          return [{
            id: Date.now(),
            recognizedCard: null,
            cardMatches: [],
            selectedMatch: null,
            previewImage: null,
            isUploading: false
          }];
        } else {
          // Remove current card and adjust index if needed
          const newCards = prev.filter((_, i) => i !== currentCardIndex);
          if (currentCardIndex >= newCards.length) {
            setCurrentCardIndex(Math.max(0, newCards.length - 1));
          }
          return newCards;
        }
      });
    }
    
    // Clear the file inputs
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (cameraInputRef.current) {
      cameraInputRef.current.value = '';
    }
  };
  
  const handleSelectCard = (matchId: string) => {
    updateCurrentCard({ selectedMatch: matchId });
  };
  
  const toggleCardSelection = (index: number) => {
    setCardRecognitions(prev => {
      const newCards = [...prev];
      if (index < newCards.length) {
        newCards[index] = { 
          ...newCards[index], 
          isSelected: !newCards[index].isSelected 
        };
      }
      return newCards;
    });
  };
  
  const handlePrevCard = () => {
    if (currentCardIndex > 0) {
      setCurrentCardIndex(currentCardIndex - 1);
    }
  };
  
  const handleNextCard = () => {
    if (currentCardIndex < cardRecognitions.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1);
    }
  };
  
  const handleAddCardSlot = () => {
    if (cardRecognitions.length < MAX_CARDS) {
      setCardRecognitions(prev => [
        ...prev, 
        {
          id: Date.now(),
          recognizedCard: null,
          cardMatches: [],
          selectedMatch: null,
          previewImage: null,
          isUploading: false
        }
      ]);
      setCurrentCardIndex(cardRecognitions.length);
    } else {
      window.showToast?.(`You can only have up to ${MAX_CARDS} cards at once.`, 'info');
    }
  };

  const currentCard = getCurrentCard();
  const totalCards = cardRecognitions.length;
  const hasCards = cardRecognitions.some(card => card.previewImage);
  
  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="h-5 w-5" /> Card Recognition
        </CardTitle>
        <CardDescription>
          Take photos of up to {MAX_CARDS} Pokémon cards to automatically recognize and add them to your collection
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Hidden File Inputs */}
        <input
          type="file"
          accept="image/*"
          capture="environment"
          onChange={(e) => handleFileChange(e, true)}
          ref={cameraInputRef}
          className="hidden"
        />
        
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileChange}
          ref={fileInputRef}
          className="hidden"
        />
        
        {/* Upload Options */}
        {!hasCards && (
          <Tabs defaultValue="upload" className="w-full" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="upload">Upload Files</TabsTrigger>
              <TabsTrigger value="camera">Use Camera</TabsTrigger>
            </TabsList>
            <TabsContent value="upload" className="mt-4">
              <div 
                className="border-2 border-dashed border-border rounded-md p-8 text-center cursor-pointer hover:bg-muted/30 transition-colors"
                onClick={handleBrowseFiles}
              >
                <div className="flex flex-col items-center gap-2">
                  <ImagePlus className="h-10 w-10 text-muted-foreground" />
                  <h3 className="font-medium">Upload Card Images</h3>
                  <p className="text-sm text-muted-foreground">
                    Click here to browse and select up to {MAX_CARDS} card images
                  </p>
                  <p className="text-xs text-muted-foreground/70 mt-1">
                    You can select multiple files at once
                  </p>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="camera" className="mt-4">
              <div 
                className="border-2 border-dashed border-border rounded-md p-8 text-center cursor-pointer hover:bg-muted/30 transition-colors"
                onClick={handleCameraCapture}
              >
                <div className="flex flex-col items-center gap-2">
                  <Camera className="h-10 w-10 text-muted-foreground" />
                  <h3 className="font-medium">Take a Photo</h3>
                  <p className="text-sm text-muted-foreground">
                    Click here to take photos of your Pokémon cards with your camera
                  </p>
                  <p className="text-xs text-muted-foreground/70 mt-1">
                    Make sure the card is well-lit and the bottom text is visible
                  </p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        )}
        
        {/* Card Navigation */}
        {hasCards && (
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handleReset(true)}
                className="text-xs"
              >
                <X className="h-3.5 w-3.5 mr-1" /> Reset All
              </Button>
              
              {totalCards < MAX_CARDS && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleAddCardSlot}
                  className="text-xs"
                >
                  <ImagePlus className="h-3.5 w-3.5 mr-1" /> Add Card
                </Button>
              )}
            </div>
            
            <div className="flex items-center gap-1.5">
              <Button 
                variant="outline" 
                size="icon" 
                className="h-8 w-8" 
                disabled={currentCardIndex === 0}
                onClick={handlePrevCard}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <span className="text-sm font-medium">
                Card {currentCardIndex + 1} of {totalCards}
              </span>
              
              <Button 
                variant="outline" 
                size="icon" 
                className="h-8 w-8" 
                disabled={currentCardIndex === totalCards - 1}
                onClick={handleNextCard}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
        
        {/* Current Card Content */}
        {hasCards && (
          <div className="space-y-4">
            {/* Image Preview */}
            {currentCard.previewImage ? (
              <div className="relative w-full">
                <img 
                  src={currentCard.previewImage}
                  alt="Card preview" 
                  className="w-full max-h-80 object-contain mx-auto rounded-md border border-border"
                />
                {currentCard.isUploading && (
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center rounded-md">
                    <div className="bg-background p-4 rounded-md flex items-center gap-2">
                      <Loader2 className="h-5 w-5 animate-spin text-primary" />
                      <span>Recognizing card...</span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-2 p-8 border-2 border-dashed border-border rounded-md">
                <div className="flex gap-4">
                  <Button onClick={handleCameraCapture} className="flex items-center gap-2">
                    <Camera className="h-4 w-4" /> Take Photo
                  </Button>
                  <Button variant="outline" onClick={handleBrowseFiles} className="flex items-center gap-2">
                    <ImagePlus className="h-4 w-4" /> Browse Files
                  </Button>
                </div>
              </div>
            )}
            
            {/* Recognition Results */}
            {currentCard.recognizedCard && (
              <div className="space-y-3 mt-4">
                <h3 className="font-medium text-lg">Recognition Results</h3>
                <div className="p-3 bg-muted/20 rounded-md">
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Detected Card:</span>
                      <span className="font-medium">{currentCard.recognizedCard.cardName}</span>
                    </div>
                    {currentCard.recognizedCard.setName && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Set:</span>
                        <span>{currentCard.recognizedCard.setName}</span>
                      </div>
                    )}
                    {currentCard.recognizedCard.cardNumber && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Card Number:</span>
                        <span>{currentCard.recognizedCard.cardNumber}</span>
                      </div>
                    )}
                    {currentCard.recognizedCard.setSymbol && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Set Symbol:</span>
                        <span>{currentCard.recognizedCard.setSymbol}</span>
                      </div>
                    )}
                    {currentCard.recognizedCard.rarity && (
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Rarity:</span>
                        <span className={`rarity-${currentCard.recognizedCard.rarity.toLowerCase().replace(/\s+/g, '-')}`}>
                          {currentCard.recognizedCard.rarity}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            {/* Matching Cards */}
            {currentCard.cardMatches.length > 0 && (
              <div className="space-y-3 mt-2">
                <h3 className="font-medium">Matching Cards</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {currentCard.cardMatches.map((card) => (
                    <div 
                      key={card.id}
                      className={`border rounded-md p-2 cursor-pointer transition-all ${
                        currentCard.selectedMatch === card.id ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'
                      }`}
                      onClick={() => handleSelectCard(card.id)}
                    >
                      <div className="flex flex-col items-center gap-1">
                        {card.images?.small && (
                          <img 
                            src={card.images.small} 
                            alt={card.name} 
                            className="h-28 object-contain"
                          />
                        )}
                        <div className="text-xs text-center mt-1">
                          <div className="font-medium truncate w-full">{card.name}</div>
                          <div className="text-muted-foreground truncate w-full">{card.set?.name}</div>
                          <div className="flex justify-center items-center gap-1 mt-1">
                            {card.number && (
                              <span className="bg-muted text-muted-foreground text-[10px] px-1.5 py-0.5 rounded-full">
                                #{card.number}
                              </span>
                            )}
                            {card.rarity && (
                              <span className={`rarity-${card.rarity.toLowerCase().replace(/\s+/g, '-')} text-[10px]`}>
                                {card.rarity}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <Button 
          variant="outline"
          onClick={() => handleReset(false)}
          disabled={!hasCards || currentCard.isUploading}
        >
          {totalCards > 1 ? "Remove Card" : "Reset"}
        </Button>
        
        <div className="flex gap-2">
          {hasCards && totalCards > 1 && (
            <Button
              variant="secondary"
              onClick={handleAddAllToCollection}
              disabled={!cardRecognitions.some(card => card.selectedMatch) || !activeCollection}
            >
              <ThumbsUp className="h-4 w-4 mr-2" /> Add All Cards
            </Button>
          )}
          
          <Button
            onClick={handleAddToCollection}
            disabled={!hasCards || currentCard.isUploading || !currentCard.selectedMatch || !activeCollection}
          >
            <ThumbsUp className="h-4 w-4 mr-2" /> Add to Collection
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default CardRecognition;