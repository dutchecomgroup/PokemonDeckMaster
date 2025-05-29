import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { PlusCircle, FolderOpen, Trash2, CheckCircle, Calendar, Globe, Pencil } from 'lucide-react';
import { useLocation, useRoute } from 'wouter';
import CollectionForm from '@/components/CollectionForm';
import { useCollectionContext } from '@/context/CollectionContext';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card as CardType } from '@/types';

// Add global type for showToast function
declare global {
  interface Window {
    showToast?: (message: string, type: 'success' | 'error' | 'info') => void;
  }
}

// Component to show actual card previews for a collection
const CardPreviews: React.FC<{ collectionId: number; collectionName: string }> = ({ collectionId, collectionName }) => {
  const { 
    getCollectionCards, 
    getAllCollectionCards,
    refetchCollectionCards 
  } = useCollectionContext();
  
  const [previewCards, setPreviewCards] = useState<CardType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Load cards on component mount and when collection changes
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    
    const fetchCards = async () => {
      try {
        // Get cards for this collection
        const cardIds = getCollectionCards(collectionId);
        const allCards = getAllCollectionCards();
        
        // Filter to just this collection's cards
        const collectionCards = allCards.filter(card => 
          cardIds.includes(card.id)
        );
        
        // Get up to 3 random cards for preview
        const randomCards: CardType[] = [];
        if (collectionCards.length > 0) {
          const cardsCopy = [...collectionCards];
          
          // Get up to 3 random cards
          for (let i = 0; i < Math.min(3, cardsCopy.length); i++) {
            const randomIndex = Math.floor(Math.random() * cardsCopy.length);
            randomCards.push(cardsCopy[randomIndex]);
            cardsCopy.splice(randomIndex, 1);
          }
        }
        
        if (isMounted) {
          setPreviewCards(randomCards);
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Error fetching preview cards:", error);
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };
    
    fetchCards();
    
    return () => {
      isMounted = false;
    };
  }, [collectionId, getCollectionCards, getAllCollectionCards]);
  
  // If loading, show loading placeholders with gradient backgrounds
  if (isLoading) {
    const colorClasses = [
      'from-blue-50 to-sky-100',
      'from-purple-50 to-violet-100',
      'from-green-50 to-emerald-100',
      'from-amber-50 to-yellow-100',
      'from-rose-50 to-pink-100'
    ];
    
    const colorIndex = collectionId % colorClasses.length;
    const gradientClass = colorClasses[colorIndex];
    
    return (
      <div className="flex justify-center gap-3">
        {[1, 2, 3].map((i) => (
          <div 
            key={`placeholder-${i}`} 
            className={`h-20 w-16 overflow-hidden rounded-md border border-gray-200 shadow-sm bg-gradient-to-b ${gradientClass} flex items-center justify-center`}
          >
            <div className="animate-pulse">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-400 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
        ))}
      </div>
    );
  }
  
  // If we have no cards, show a message
  if (previewCards.length === 0) {
    return (
      <div className="flex justify-center">
        <p className="text-xs text-gray-400 italic">No cards in this collection</p>
      </div>
    );
  }
  
  // Show the actual card previews
  return (
    <div className="flex justify-center gap-3">
      {previewCards.map((card, index) => (
        <div key={`${card.id}-${index}`} className="h-20 w-16 overflow-hidden rounded-md border border-gray-200 shadow-sm hover:shadow-md transition-all">
          <img 
            src={card.images?.small || card.images?.large} 
            alt={card.name}
            className="h-full w-full object-cover"
            onError={(e) => {
              // If image fails to load, replace with a placeholder
              e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='125' viewBox='0 0 100 125' fill='none'%3E%3Crect width='100' height='125' fill='%23f3f4f6'/%3E%3Cpath d='M35 62.5 H65 M50 47.5 V77.5' stroke='%23d1d5db' stroke-width='2'/%3E%3C/svg%3E";
            }}
          />
        </div>
      ))}
      {/* Add placeholder slots if we have fewer than 3 cards */}
      {Array.from({ length: Math.max(0, 3 - previewCards.length) }, (_, i) => (
        <div key={`empty-${i}`} className="h-20 w-16 bg-gray-100 rounded-md border border-gray-200" />
      ))}
    </div>
  );
}

const CollectionManager: React.FC = () => {
  const { collections, activeCollection, setActiveCollection, deleteCollection, updateCollection } = useCollectionContext();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState('all');
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [collectionToRename, setCollectionToRename] = useState<number | null>(null);
  const [newCollectionName, setNewCollectionName] = useState('');
  const { toast } = useToast();
  const [location, setLocation] = useLocation();
  
  // Function to get random Pokemon types for visual decorations
  const getRandomPokemonType = () => {
    const types = ['fire', 'water', 'grass', 'electric', 'psychic', 'fairy', 'dragon', 'dark', 'steel', 'fighting'];
    return types[Math.floor(Math.random() * types.length)];
  };
  
  // Generate a background gradient class based on Pokemon type
  const getGradientClass = (type: string) => {
    switch(type) {
      case 'fire': return 'from-red-600/40 to-orange-500/30';
      case 'water': return 'from-blue-600/40 to-cyan-500/30';
      case 'grass': return 'from-green-600/40 to-emerald-500/30';
      case 'electric': return 'from-yellow-600/40 to-amber-500/30';
      case 'psychic': return 'from-purple-600/40 to-pink-500/30';
      case 'fairy': return 'from-pink-600/40 to-rose-500/30';
      case 'dragon': return 'from-indigo-600/40 to-blue-500/30';
      case 'dark': return 'from-slate-700/40 to-gray-600/30';
      case 'steel': return 'from-slate-500/40 to-gray-400/30';
      case 'fighting': return 'from-red-700/40 to-orange-600/30';
      default: return 'from-blue-600/40 to-violet-500/30';
    }
  };
  
  // Assign a random type to each collection for visual variety
  const [collectionTypes, setCollectionTypes] = useState<Record<number, string>>({});
  
  useEffect(() => {
    // Generate random types for collections that don't have one assigned yet
    const newTypes: Record<number, string> = {...collectionTypes};
    collections.forEach(collection => {
      if (!newTypes[collection.id]) {
        newTypes[collection.id] = getRandomPokemonType();
      }
    });
    setCollectionTypes(newTypes);
  }, [collections]);
  
  const handleRenameCollection = async () => {
    if (collectionToRename === null || !newCollectionName.trim()) return;
    
    try {
      const collectionToUpdate = collections.find(c => c.id === collectionToRename);
      if (!collectionToUpdate) return;
      
      await updateCollection({
        ...collectionToUpdate,
        name: newCollectionName.trim()
      });
      
      toast({
        title: "Collection renamed",
        description: "Collection has been successfully renamed",
      });
      
      setIsRenameModalOpen(false);
      setCollectionToRename(null);
      setNewCollectionName('');
    } catch (error) {
      console.error('Failed to rename collection:', error);
      
      toast({
        title: "Failed to rename",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    }
  };

  const openRenameModal = (collectionId: number, name: string) => {
    setCollectionToRename(collectionId);
    setNewCollectionName(name);
    setIsRenameModalOpen(true);
  };

  // Filter collections based on selected tab
  const filteredCollections = selectedTab === 'all' 
    ? collections 
    : collections.filter(c => c.language.toLowerCase() === selectedTab);
  
  // Group languages for tabs
  const languages = Array.from(new Set(collections.map(c => c.language)));
  
  // Format date in a more readable way
  const formatDate = (dateString: string | Date) => {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
    return date.toLocaleDateString(undefined, options);
  };
  
  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Sidebar wrapper with fixed height and scrolling */}
      <div className="lg:w-96 lg:flex-shrink-0 lg:sticky lg:top-20 lg:h-[calc(100vh-5rem)] lg:overflow-y-auto lg:overflow-x-hidden lg:pr-4">
        <Sidebar />
      </div>
      
      <div className="flex-grow">
        {/* Hero section with Pokémon-themed purple pattern */}
        <div className="relative mb-6 overflow-hidden rounded-xl shadow-lg">
          {/* Dynamic purple background with gradient and effect layers */}
          <div className="absolute inset-0 bg-gradient-to-r from-purple-700 to-purple-500 overflow-hidden">
            {/* Background texture pattern */}
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgdmlld0JveD0iMCAwIDYwIDYwIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0djZoNnYtNmgtNnptNi02aDZ2LTZoLTZ2NnptLTYgMGg2di02aC02djZ6TTI0IDI0aDZ2LTZoLTZ2NnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-40"></div>
            
            {/* Left decorative shape */}
            <div className="absolute -left-8 top-1/4 w-24 h-24 bg-gradient-to-r from-violet-500/50 to-transparent rounded-full transform -rotate-12"></div>
            
            {/* Right decorative shape */}
            <div className="absolute right-0 top-0 bottom-0 w-1/4 bg-gradient-to-l from-indigo-500/30 to-transparent"></div>
            
            {/* Subtle pokeball pattern overlay */}
            <div className="absolute inset-0 opacity-10 pointer-events-none pattern-pokeballs"></div>
            
            {/* Animated Poké Ball */}
            <div className="absolute bottom-3 right-8 w-10 h-10 opacity-30 animate-float-pokeball-alt">
              <div className="relative w-full h-full">
                <div className="absolute inset-0 top-0 h-1/2 rounded-t-full bg-purple-500 border border-white/30"></div>
                <div className="absolute inset-0 bottom-0 top-1/2 h-1/2 rounded-b-full bg-white border border-white/30"></div>
                <div className="absolute inset-0 h-1.5 top-[calc(50%-0.75px)] bg-white/30"></div>
                <div className="absolute left-1/2 top-1/2 w-3 h-3 bg-white rounded-full -ml-1.5 -mt-1.5 border border-white/30"></div>
              </div>
            </div>
          </div>
          
          <div className="relative p-6 md:p-8">
            <div className="max-w-3xl">
              <h1 className="text-2xl md:text-3xl font-bold mb-3 text-white drop-shadow-sm">
                Pokémon Card Collections
              </h1>
              <p className="text-white/90 md:w-3/4">
                Organize your Pokémon cards into custom collections. Group by expansion set, type, rarity, or create your own organization system.
              </p>
              <div className="flex flex-wrap gap-3 mt-5">
                <Button 
                  onClick={() => {
                    if (collections.length >= 6) {
                      toast({
                        title: "Collection Limit Reached",
                        description: "You can create a maximum of 6 collections. Please delete an existing collection to create a new one.",
                        variant: "destructive"
                      });
                    } else {
                      setIsCreateModalOpen(true);
                    }
                  }}
                  className="bg-indigo-500 hover:bg-indigo-600 text-white shadow-md border-0"
                >
                  <PlusCircle className="h-4 w-4 mr-2" /> Create New Collection
                </Button>
                <span className="text-white/80 text-sm self-center ml-2">
                  {collections.length}/6 Collections
                </span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 gap-6">
          {/* Collections Section */}
          <Card className="overflow-hidden border-border">
            <CardHeader className="bg-card pb-0">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <FolderOpen className="h-5 w-5 text-primary" /> Your Collections
                  </CardTitle>
                  <CardDescription>
                    Manage and organize your Pokémon card collections
                  </CardDescription>
                </div>
                <div className="flex flex-wrap gap-2 items-center">
                  <Button 
                    onClick={() => {
                      if (collections.length >= 6) {
                        toast({
                          title: "Collection Limit Reached",
                          description: "You can create a maximum of 6 collections. Please delete an existing collection to create a new one.",
                          variant: "destructive"
                        });
                      } else {
                        setIsCreateModalOpen(true);
                      }
                    }}
                    className="self-start sm:self-auto"
                    disabled={collections.length >= 6}
                  >
                    <PlusCircle className="h-4 w-4 mr-2" /> New Collection
                  </Button>
                  <span className="text-sm text-gray-500">
                    {collections.length}/6 Collections
                  </span>
                </div>
              </div>
              
              {/* Language tabs */}
              {collections.length > 0 && languages.length > 1 && (
                <Tabs defaultValue="all" value={selectedTab} onValueChange={setSelectedTab} className="mt-4">
                  <TabsList className="bg-muted/50 p-1 h-auto">
                    <TabsTrigger value="all" className="text-xs h-8 px-3 data-[state=active]:bg-background">
                      All Collections ({collections.length})
                    </TabsTrigger>
                    {languages.map(lang => (
                      <TabsTrigger 
                        key={lang} 
                        value={lang.toLowerCase()} 
                        className="text-xs h-8 px-3 data-[state=active]:bg-background"
                      >
                        {lang} ({collections.filter(c => c.language === lang).length})
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>
              )}
            </CardHeader>
            
            <CardContent className="pt-4">
              {/* Active collection display */}
              {activeCollection && (
                <div className="mb-5 p-4 rounded-lg relative overflow-hidden shadow-md">
                  {/* Purple gradient background */}
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-100 to-violet-200 pointer-events-none"></div>
                  
                  {/* Subtle animated Pokéball pattern */}
                  <div className="absolute inset-0 opacity-5 pattern-pokeballs pointer-events-none"></div>
                  
                  <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <Badge className="mb-1 bg-purple-600 hover:bg-purple-700 text-white border-0">
                        <CheckCircle className="h-3 w-3 mr-1" /> Active Collection
                      </Badge>
                      <h3 className="text-lg font-semibold text-gray-900">{activeCollection.name}</h3>
                      <p className="text-sm text-gray-700 flex items-center mt-1">
                        <Globe className="h-3.5 w-3.5 mr-1" />
                        {activeCollection.language.charAt(0).toUpperCase() + activeCollection.language.slice(1)}
                        <span className="mx-2">•</span>
                        <Calendar className="h-3.5 w-3.5 mr-1" />
                        {formatDate(activeCollection.createdAt)}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="bg-violet-600 hover:bg-violet-700 text-white border-0 shadow-sm"
                        onClick={() => {
                          if (activeCollection) {
                            // Use setActiveCollection first to ensure data is loaded
                            setActiveCollection(activeCollection.id);
                            
                            // Show a toast to give feedback to the user
                            toast({
                              title: `Opening ${activeCollection.name}`,
                              description: "Loading your collection...",
                              duration: 2000
                            });
                            
                            // Use wouter's setLocation for client-side navigation
                            setLocation(`/my-collection?id=${activeCollection.id}`);
                          }
                        }}
                      >
                        <FolderOpen className="h-4 w-4 mr-1.5" /> Open Collection
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-white text-purple-600 border-purple-200 hover:bg-purple-50"
                        onClick={() => openRenameModal(activeCollection.id, activeCollection.name)}
                      >
                        <Pencil className="h-4 w-4 mr-1.5" /> Rename
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-white text-purple-600 border-purple-200 hover:bg-purple-50"
                        onClick={() => {
                          window.location.href = `/statistics?collectionId=${activeCollection.id}`;
                        }}
                      >
                        <i className="fas fa-chart-bar h-4 w-4 mr-1.5"></i> Statistics
                      </Button>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm" className="bg-red-600 hover:bg-red-700">
                            <Trash2 className="h-4 w-4 mr-1.5" /> Delete
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-card text-foreground border-border">
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Collection</AlertDialogTitle>
                            <AlertDialogDescription className="text-muted-foreground">
                              Are you sure you want to delete "{activeCollection.name}"? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="bg-muted text-foreground hover:bg-muted/80">
                              Cancel
                            </AlertDialogCancel>
                            <AlertDialogAction 
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              onClick={() => deleteCollection(activeCollection.id)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" /> Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </div>
              )}
              
              {collections.length === 0 ? (
                <div className="py-8 text-center bg-muted/20 rounded-lg border border-dashed border-muted">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted/30 mb-4">
                    <FolderOpen className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium text-foreground mb-2">No Collections Yet</h3>
                  <p className="text-muted-foreground max-w-md mx-auto mb-5 text-sm">
                    Create your first collection to start organizing your Pokémon card collection.
                    Group cards by language, type, or any custom category.
                  </p>
                  <Button 
                    className="bg-primary hover:bg-primary/90 text-primary-foreground"
                    onClick={() => setIsCreateModalOpen(true)}
                  >
                    <PlusCircle className="h-4 w-4 mr-2" /> Create First Collection
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {filteredCollections.map(collection => {
                    const collectionType = collectionTypes[collection.id] || 'normal';
                    const gradientClass = getGradientClass(collectionType);
                    return (
                      <div 
                        key={collection.id}
                        className={`rounded-lg overflow-hidden shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 ${
                          activeCollection?.id === collection.id 
                            ? 'ring-2 ring-sky-500 border border-sky-500' 
                            : 'border border-gray-200 dark:border-gray-700'
                        } cursor-pointer bg-card`}
                        onClick={() => setActiveCollection(collection.id)}
                      >
                        <div className={`h-3 bg-gradient-to-r ${gradientClass}`}></div>
                        
                        <div className="p-4 bg-card">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h3 className="font-semibold text-gray-800 dark:text-gray-200 truncate">{collection.name}</h3>
                              <p className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1 mt-1">
                                <Globe className="h-3 w-3" />
                                {collection.language.charAt(0).toUpperCase() + collection.language.slice(1)}
                              </p>
                            </div>
                            <div className="flex gap-1">
                              {activeCollection?.id === collection.id ? (
                                <Badge className="bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800 h-6">
                                  <CheckCircle className="h-3 w-3 mr-1" /> Active
                                </Badge>
                              ) : (
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="h-7 text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/30 hover:text-sky-700 dark:hover:text-sky-300 border-sky-200 dark:border-sky-800" 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveCollection(collection.id);
                                  }}
                                >
                                  <FolderOpen className="h-3.5 w-3.5 mr-1.5" /> Set Active
                                </Button>
                              )}
                            </div>
                          </div>
                          
                          {/* Card Previews - Show 3 cards from this collection */}
                          <div className="mt-4 mb-4">
                            <CardPreviews 
                              key={`preview-${collection.id}-${collection.name}`}
                              collectionId={collection.id} 
                              collectionName={collection.name} 
                            />
                          </div>
                          
                          <div className="flex flex-col gap-2">
                            <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
                              <span className="flex items-center">
                                <Calendar className="h-3 w-3 mr-1" />
                                {formatDate(collection.createdAt)}
                              </span>
                              <div className="flex gap-1">
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  className="h-6 px-2 text-gray-500 dark:text-gray-400 hover:text-sky-600 dark:hover:text-sky-400"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openRenameModal(collection.id, collection.name);
                                  }}
                                >
                                  <Pencil className="h-3 w-3" />
                                </Button>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button 
                                      variant="ghost" 
                                      size="sm"
                                      className="h-6 px-2 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent className="bg-card border-border text-foreground">
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Delete Collection</AlertDialogTitle>
                                      <AlertDialogDescription className="text-muted-foreground">
                                        Are you sure you want to delete "{collection.name}"? This action cannot be undone.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel onClick={(e) => e.stopPropagation()}>
                                        Cancel
                                      </AlertDialogCancel>
                                      <AlertDialogAction 
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          deleteCollection(collection.id);
                                        }}
                                      >
                                        <Trash2 className="h-4 w-4 mr-2" /> Delete
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </div>
                            
                            <div className="flex gap-1 mt-1">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="flex-1 h-7 text-xs bg-sky-500 hover:bg-sky-600 text-white border-0"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  
                                  // Set active collection first to ensure data is available
                                  setActiveCollection(collection.id);
                                  
                                  // Show a toast to give feedback
                                  toast({
                                    title: `Opening ${collection.name}`,
                                    description: "Loading your collection...",
                                    duration: 2000
                                  });
                                  
                                  // Use client-side navigation
                                  setLocation(`/my-collection?id=${collection.id}`);
                                }}
                              >
                                <FolderOpen className="h-3 w-3 mr-1" /> Open
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-1 h-7 text-xs bg-white text-sky-600 border-sky-200 hover:bg-sky-50"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  
                                  // Navigate immediately for responsive feel
                                  setLocation(`/statistics?collectionId=${collection.id}`);
                                  
                                  // Set active collection in background (will be used when stats page loads)
                                  setTimeout(() => setActiveCollection(collection.id), 0);
                                }}
                              >
                                <i className="fas fa-chart-bar h-3 w-3 mr-1"></i> Stats
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Create Collection Modal */}
      {isCreateModalOpen && (
        <CollectionForm 
          isOpen={isCreateModalOpen} 
          onClose={() => setIsCreateModalOpen(false)} 
        />
      )}

      {/* Rename Collection Dialog */}
      <Dialog open={isRenameModalOpen} onOpenChange={setIsRenameModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Rename Collection</DialogTitle>
            <DialogDescription>
              Enter a new name for your collection
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input 
                id="name" 
                value={newCollectionName} 
                onChange={(e) => setNewCollectionName(e.target.value)} 
                className="col-span-3"
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRenameModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleRenameCollection} disabled={!newCollectionName.trim()}>
              <Pencil className="h-4 w-4 mr-1.5" /> Rename
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CollectionManager;