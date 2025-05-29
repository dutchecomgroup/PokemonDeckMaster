import React, { useState, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Camera, Upload, ChevronRight, ChevronLeft, Check, Plus, X } from 'lucide-react';
import { useCollectionContext } from '@/context/CollectionContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import CardDetail from './CardDetail';

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
  selectedMatch: any | null;
  previewImage: string | null;
  isUploading: boolean;
  isSelected: boolean; // Whether this card is selected for adding to collection
}

const MulticardRecognition: React.FC = () => {
  const MAX_CARDS = 5;
  const { toast } = useToast();
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<"upload" | "camera">("upload");
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
  
  // View mode: 'grid' shows all cards, 'single' shows one card with details
  const [viewMode, setViewMode] = useState<'grid' | 'single'>('grid');
  const { addCardToCollection, activeCollection } = useCollectionContext();

  // Dialog state for card details
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedCard, setSelectedCard] = useState<any>(null);

  const getCurrentCard = () => cardRecognitions[currentCardIndex];
  
  const updateCurrentCard = (updates: Partial<CardRecognitionResult>) => {
    setCardRecognitions(prev => {
      const newCards = [...prev];
      newCards[currentCardIndex] = { ...newCards[currentCardIndex], ...updates };
      return newCards;
    });
  };
  
  const showCardDetail = (card: any) => {
    setSelectedCard(card);
    setDetailOpen(true);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, fromCamera = false) => {
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
        toast({
          title: "Maximum cards reached",
          description: `You can only upload up to ${MAX_CARDS} cards at once. Some cards will be skipped.`,
          variant: "warning",
        });
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
    for (let i = 0; i < filesToProcess.length; i++) {
      const file = filesToProcess[i];
      const cardIndex = cardRecognitions.length === 1 && !cardRecognitions[0].previewImage 
        ? i 
        : cardRecognitions.length + i;
      
      if (cardIndex < MAX_CARDS) {
        await uploadAndRecognize(file, cardIndex);
      }
    }
    
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
      // Create FormData
      const formData = new FormData();
      formData.append('image', file);
      
      // Update to show uploading state
      setCardRecognitions(prev => {
        const newCards = [...prev];
        if (cardIndex < newCards.length) {
          newCards[cardIndex] = { ...newCards[cardIndex], isUploading: true };
        }
        return newCards;
      });
      
      // Show notification
      toast({
        title: "Analyzing card",
        description: "Please wait while we process your card image...",
      });
      
      // Upload the file with correct headers for multipart form data
      const response = await fetch('/api/recognize-card', {
        method: 'POST',
        body: formData,
        credentials: 'include', // Important for authenticated requests
        // Don't manually set Content-Type header, browser will set it with boundary
      });
      
      // Handle error responses
      if (!response.ok) {
        let errorMessage = 'Failed to recognize card';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch (e) {
          // If we can't parse the error response, just use the default message
        }
        throw new Error(errorMessage);
      }
      
      // Parse the response
      const data = await response.json();
      
      // Update the card with recognition results
      setCardRecognitions(prev => {
        const newCards = [...prev];
        if (cardIndex < newCards.length) {
          newCards[cardIndex] = { 
            ...newCards[cardIndex],
            recognizedCard: data.recognized,
            cardMatches: data.matches || [],
            selectedMatch: data.matches && data.matches.length > 0 ? data.matches[0] : null,
            isUploading: false
          };
        }
        return newCards;
      });
      
      // Show success message
      if (data.matches && data.matches.length > 0) {
        toast({
          title: "Card recognized",
          description: `Successfully identified ${data.recognized.cardName}`,
          variant: "default", // Using default instead of success
        });
      } else {
        toast({
          title: "Card recognized, but no matches found",
          description: `We identified the card as ${data.recognized.cardName}, but couldn't find an exact match.`,
          variant: "default",
        });
      }
    } catch (error: any) {
      console.error('Error recognizing card:', error);
      
      // Show error message
      toast({
        title: "Recognition failed",
        description: error.message || 'Failed to recognize card. Please try again with a clearer image.',
        variant: "destructive",
      });
      
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

  const handleAddToCollection = async (cardIndex: number = currentCardIndex) => {
    const card = cardRecognitions[cardIndex];
    
    if (!card.selectedMatch || !activeCollection) {
      toast({
        title: "Cannot add card",
        description: "Please select a card and ensure you have an active collection",
        variant: "destructive",
      });
      return;
    }
    
    try {
      // Log what we're trying to add
      console.log('Adding card to collection:', card.selectedMatch);
      
      // Make sure we're using the card ID directly
      await addCardToCollection(card.selectedMatch.id);
      
      toast({
        title: "Card added",
        description: `${card.selectedMatch.name} added to collection: ${activeCollection.name}`,
        variant: "default",
      });
      
      // Mark this card as added by updating its status instead of removing it
      setCardRecognitions(prev => {
        const newCards = [...prev];
        if (cardIndex < newCards.length) {
          // Just update the card to show it's been added
          const updatedCard = { 
            ...newCards[cardIndex],
            isSelected: false, // Deselect the card
          };
          newCards[cardIndex] = updatedCard;
        }
        return newCards;
      });
      
      // Show success for 2 seconds before removing the card
      setTimeout(() => {
        setCardRecognitions(prev => {
          if (prev.length === 1) {
            // If it's the last card, reset it instead of removing
            return [{
              id: Date.now(),
              recognizedCard: null,
              cardMatches: [],
              selectedMatch: null,
              previewImage: null,
              isUploading: false,
              isSelected: true
            }];
          } else {
            // Remove current card and adjust the current index if needed
            const newCards = prev.filter((_, i) => i !== cardIndex);
            if (currentCardIndex >= newCards.length) {
              setCurrentCardIndex(Math.max(0, newCards.length - 1));
            }
            return newCards;
          }
        });
      }, 2000);
      
    } catch (error: any) {
      console.error('Error adding card to collection:', error);
      toast({
        title: "Failed to add card",
        description: error.message || 'Failed to add card to collection',
        variant: "destructive",
      });
    }
  };

  const handleAddAllToCollection = async () => {
    if (!activeCollection) {
      toast({
        title: "No active collection",
        description: "Please ensure you have an active collection selected",
        variant: "destructive",
      });
      return;
    }

    const cardsToAdd = cardRecognitions
      .filter(card => card.isSelected && card.selectedMatch)
      .map(card => ({ id: card.id, selectedMatch: card.selectedMatch }));
    
    if (cardsToAdd.length === 0) {
      toast({
        title: "No cards selected",
        description: "Please select at least one card to add to your collection",
        variant: "default",
      });
      return;
    }
    
    try {
      console.log('Adding multiple cards to collection:', cardsToAdd);
      
      let addedCount = 0;
      for (const card of cardsToAdd) {
        await addCardToCollection(card.selectedMatch.id);
        addedCount++;
      }
      
      toast({
        title: "Cards added",
        description: `${addedCount} cards added to collection: ${activeCollection.name}`,
        variant: "default",
      });
      
      // Mark all added cards
      setCardRecognitions(prev => {
        const newCards = [...prev];
        cardsToAdd.forEach(card => {
          const index = newCards.findIndex(c => c.id === card.id);
          if (index !== -1) {
            newCards[index] = { ...newCards[index], isSelected: false };
          }
        });
        return newCards;
      });
      
      // Wait a moment before clearing
      setTimeout(() => {
        // Reset all cards
        setCardRecognitions([{
          id: Date.now(),
          recognizedCard: null,
          cardMatches: [],
          selectedMatch: null,
          previewImage: null,
          isUploading: false,
          isSelected: true
        }]);
        setCurrentCardIndex(0);
      }, 2000);
    } catch (error: any) {
      console.error('Error adding cards to collection:', error);
      toast({
        title: "Failed to add cards",
        description: error.message || 'Failed to add some cards to your collection',
        variant: "destructive",
      });
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
        isUploading: false,
        isSelected: true
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
            isUploading: false,
            isSelected: true
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
  
  const handleSelectMatch = (card: any, index: number) => {
    setCardRecognitions(prev => {
      const newCards = [...prev];
      if (index < newCards.length) {
        newCards[index] = { ...newCards[index], selectedMatch: card };
      }
      return newCards;
    });
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
          isUploading: false,
          isSelected: true
        }
      ]);
      setCurrentCardIndex(cardRecognitions.length);
    } else {
      toast({
        title: "Maximum cards reached",
        description: `You can only have up to ${MAX_CARDS} cards at once`,
        variant: "warning",
      });
    }
  };

  const currentCard = getCurrentCard();
  const totalCards = cardRecognitions.length;
  const hasCards = cardRecognitions.some(card => card.previewImage);
  
  return (
    <div className="w-full">
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
        <Tabs defaultValue="upload" className="w-full" value={activeTab} onValueChange={(value) => setActiveTab(value as "upload" | "camera")}>
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
                <Upload className="h-10 w-10 text-muted-foreground" />
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
        <div className="space-y-4">
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
                  <Plus className="h-3.5 w-3.5 mr-1" /> Add Card
                </Button>
              )}
            </div>
            
            <div className="flex items-center gap-1.5">
              <Button 
                variant={viewMode === "grid" ? "secondary" : "outline"}
                size="sm"
                onClick={() => setViewMode("grid")}
                className="text-xs"
              >
                Grid View
              </Button>
              
              <Button 
                variant={viewMode === "single" ? "secondary" : "outline"}
                size="sm"
                onClick={() => setViewMode("single")}
                className="text-xs"
              >
                Single Card
              </Button>
            </div>
          </div>
          
          {/* Grid View */}
          {viewMode === "grid" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {cardRecognitions.map((card, index) => (
                <Card key={card.id} className={`overflow-hidden flex flex-col ${card.isSelected ? 'ring-2 ring-primary' : 'opacity-75'}`}>
                  <div className="relative">
                    {card.previewImage && (
                      <img 
                        src={card.previewImage} 
                        alt={card.recognizedCard?.cardName || "Card preview"} 
                        className="w-full h-48 object-contain bg-black/5 dark:bg-white/5"
                      />
                    )}
                    
                    {card.isUploading && (
                      <div className="absolute inset-0 flex items-center justify-center bg-background/80">
                        <div className="flex flex-col items-center gap-2">
                          <Loader2 className="h-8 w-8 animate-spin text-primary" />
                          <p className="text-xs font-medium">Recognizing card...</p>
                        </div>
                      </div>
                    )}
                    
                    <div className="absolute top-2 left-2">
                      <Checkbox 
                        checked={card.isSelected} 
                        onCheckedChange={() => toggleCardSelection(index)}
                        className="h-5 w-5 border-2"
                      />
                    </div>
                  </div>
                  
                  <CardContent className="flex-1 p-3">
                    <div className="space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium text-sm line-clamp-1">
                            {card.recognizedCard?.cardName || "Unknown Card"}
                          </h3>
                          {card.recognizedCard && (
                            <p className="text-xs text-muted-foreground">
                              {card.recognizedCard.setName || card.recognizedCard.setSymbol || "Unknown Set"}
                              {card.recognizedCard.cardNumber && ` • ${card.recognizedCard.cardNumber}`}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      {card.selectedMatch && (
                        <div className="flex items-center gap-2 mt-2">
                          <img 
                            src={card.selectedMatch.images?.small} 
                            alt={card.selectedMatch.name} 
                            className="w-10 h-10 object-contain"
                          />
                          <div className="overflow-hidden">
                            <p className="text-xs font-medium line-clamp-1">{card.selectedMatch.name}</p>
                            <p className="text-xs text-muted-foreground line-clamp-1">
                              {card.selectedMatch.set.name} • {card.selectedMatch.number}
                            </p>
                          </div>
                        </div>
                      )}
                      
                      <div className="flex gap-1 mt-3">
                        {!card.isUploading && (
                          <>
                            {card.selectedMatch && (
                              <Button 
                                size="sm" 
                                className="flex-1 h-8 text-xs"
                                onClick={() => handleAddToCollection(index)}
                              >
                                <Plus className="h-3.5 w-3.5 mr-1" /> Add to Collection
                              </Button>
                            )}
                            
                            {card.cardMatches && card.cardMatches.length > 0 && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 px-2"
                                onClick={() => {
                                  setCurrentCardIndex(index);
                                  setViewMode('single');
                                }}
                              >
                                <ChevronRight className="h-4 w-4" />
                              </Button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {cardRecognitions.some(card => card.isSelected && card.selectedMatch) && (
                <div className="col-span-full mt-4">
                  <Button
                    className="w-full"
                    onClick={handleAddAllToCollection}
                  >
                    <Check className="h-4 w-4 mr-2" /> Add Selected Cards to Collection
                  </Button>
                </div>
              )}
            </div>
          )}
          
          {/* Single Card View */}
          {viewMode === "single" && currentCard && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  disabled={currentCardIndex === 0}
                  onClick={handlePrevCard}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" /> Previous Card
                </Button>
                
                <span className="text-sm font-medium">
                  Card {currentCardIndex + 1} of {totalCards}
                </span>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  disabled={currentCardIndex === totalCards - 1}
                  onClick={handleNextCard}
                >
                  Next Card <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Card preview and info */}
                <div className="space-y-4">
                  <div className="relative bg-black/5 dark:bg-white/5 rounded-lg overflow-hidden flex items-center justify-center" style={{ height: '300px' }}>
                    {currentCard.previewImage && (
                      <img 
                        src={currentCard.previewImage} 
                        alt={currentCard.recognizedCard?.cardName || "Card preview"} 
                        className="max-w-full max-h-full object-contain"
                      />
                    )}
                    
                    {currentCard.isUploading && (
                      <div className="absolute inset-0 flex items-center justify-center bg-background/80">
                        <div className="flex flex-col items-center gap-2">
                          <Loader2 className="h-8 w-8 animate-spin text-primary" />
                          <p className="text-sm font-medium">Recognizing card...</p>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {currentCard.recognizedCard && (
                    <div className="p-4 bg-muted rounded-lg">
                      <h3 className="font-medium mb-2">Recognition Results</h3>
                      <dl className="grid grid-cols-2 gap-1 text-sm">
                        <dt className="text-muted-foreground">Card Name:</dt>
                        <dd>{currentCard.recognizedCard.cardName}</dd>
                        
                        {currentCard.recognizedCard.setName && (
                          <>
                            <dt className="text-muted-foreground">Set Name:</dt>
                            <dd>{currentCard.recognizedCard.setName}</dd>
                          </>
                        )}
                        
                        {currentCard.recognizedCard.cardNumber && (
                          <>
                            <dt className="text-muted-foreground">Card Number:</dt>
                            <dd>{currentCard.recognizedCard.cardNumber}</dd>
                          </>
                        )}
                        
                        {currentCard.recognizedCard.rarity && (
                          <>
                            <dt className="text-muted-foreground">Rarity:</dt>
                            <dd>{currentCard.recognizedCard.rarity}</dd>
                          </>
                        )}
                      </dl>
                    </div>
                  )}
                </div>
                
                {/* Card matches */}
                <div className="space-y-4">
                  <h3 className="font-medium">Possible Matches</h3>
                  
                  {currentCard.cardMatches && currentCard.cardMatches.length > 0 ? (
                    <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                      {currentCard.cardMatches.map(card => (
                        <div 
                          key={card.id}
                          className={`flex border rounded-lg p-2 cursor-pointer hover:bg-muted/50 transition-colors
                            ${currentCard.selectedMatch?.id === card.id ? 'border-primary bg-primary/5' : 'border-border'}`}
                          onClick={() => handleSelectMatch(card, currentCardIndex)}
                        >
                          <div className="flex-shrink-0 w-16 h-16 flex items-center justify-center bg-black/5 dark:bg-white/5 rounded-md overflow-hidden">
                            {card.images?.small && (
                              <img 
                                src={card.images.small} 
                                alt={card.name} 
                                className="max-w-full max-h-full object-contain"
                              />
                            )}
                          </div>
                          
                          <div className="ml-3 flex-1 overflow-hidden">
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium text-sm line-clamp-1">{card.name}</h4>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-7 px-2"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  showCardDetail(card);
                                }}
                              >
                                Info
                              </Button>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {card.set.name} • {card.number}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {card.rarity}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 text-center border border-dashed rounded-lg">
                      <p className="text-muted-foreground text-sm">
                        {currentCard.isUploading 
                          ? "Processing card..." 
                          : "No matching cards found. Try uploading a clearer image."}
                      </p>
                    </div>
                  )}
                  
                  {currentCard.selectedMatch && (
                    <Button 
                      className="w-full mt-4"
                      onClick={() => handleAddToCollection()}
                    >
                      <Plus className="h-4 w-4 mr-2" /> Add to Collection
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Card Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Card Details</DialogTitle>
          </DialogHeader>
          <CardDetail card={selectedCard} isOpen={detailOpen} onClose={() => setDetailOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MulticardRecognition;