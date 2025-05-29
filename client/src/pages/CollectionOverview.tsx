import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Plus, Folder, Edit, Trash2, BarChart3, Calendar, ExternalLink } from "lucide-react";
import { useCollectionContext } from "@/context/CollectionContext";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { fetchCard } from "@/api/pokemonTCG";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";
import Sidebar from "@/components/Sidebar";
import MobileBottomNav from "@/components/MobileBottomNav";
import MobileSidebar from "@/components/MobileSidebar";

interface Collection {
  id: number;
  name: string;
  description?: string;
  userId: number;
  createdAt: string;
  updatedAt: string;
}

interface PokemonCard {
  id: string;
  name: string;
  images: {
    small: string;
    large: string;
  };
  rarity?: string;
  set: {
    name: string;
  };
}

export default function CollectionOverview() {
  const { collections, collection: collectionCards, deleteCollection, createCollection, updateCollection, activeCollection, setActiveCollection } = useCollectionContext();
  const { user } = useAuth();
  const { toast } = useToast();
  const [location, setLocation] = useLocation();
  
  const [collectionPreviews, setCollectionPreviews] = useState<Record<number, PokemonCard[]>>({});
  const [collectionStats, setCollectionStats] = useState<Record<number, { total: number; unique: number }>>({});
  const [renameDialogOpen, setRenameDialogOpen] = useState<number | null>(null);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [newCollectionDialogOpen, setNewCollectionDialogOpen] = useState(false);
  const [createCollectionName, setCreateCollectionName] = useState("");
  const [createCollectionDescription, setCreateCollectionDescription] = useState("");
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Simulate premium status
  const isPremium = user?.id === 1;
  const maxCollections = isPremium ? 12 : 6;



  // Collection management handlers
  const handleCreateCollection = async () => {
    if (!createCollectionName.trim()) {
      toast({
        title: "Collection name required",
        description: "Please enter a name for your collection",
        variant: "destructive",
      });
      return;
    }

    try {
      await createCollection({
        name: createCollectionName.trim(),
        language: "English",
      });
      
      toast({
        title: "Collection created!",
        description: `${createCollectionName} has been created successfully`,
      });
      
      // Reset form and close dialog
      setCreateCollectionName("");
      setCreateCollectionDescription("");
      setNewCollectionDialogOpen(false);
    } catch (error) {
      toast({
        title: "Failed to create collection",
        description: "There was a problem creating your collection. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleRenameCollection = async (collectionId: number) => {
    if (!newCollectionName.trim()) {
      toast({
        title: "Collection name required",
        description: "Please enter a new name for your collection",
        variant: "destructive",
      });
      return;
    }

    const collection = collections.find(c => c.id === collectionId);
    if (!collection) return;

    try {
      await updateCollection({
        ...collection,
        name: newCollectionName.trim(),
      });
      
      toast({
        title: "Collection renamed!",
        description: `Collection renamed to ${newCollectionName}`,
      });
      
      // Reset form and close dialog
      setNewCollectionName("");
      setRenameDialogOpen(null);
    } catch (error) {
      toast({
        title: "Failed to rename collection",
        description: "There was a problem renaming your collection. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteCollection = async (collectionId: number) => {
    try {
      await deleteCollection(collectionId);
      toast({
        title: "Collection deleted",
        description: "Your collection has been deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Failed to delete collection",
        description: "There was a problem deleting your collection. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Load collection data using real database cards
  useEffect(() => {
    const loadCollectionData = async () => {
      if (!collections || !collectionCards) return;

      for (const collection of collections) {
        // Get real cards for this collection from database
        const realCollectionCards = collectionCards.filter(card => card.collectionId === collection.id);
        const totalCards = realCollectionCards.reduce((sum, card) => sum + card.quantity, 0);
        const uniqueCards = realCollectionCards.length;
        
        setCollectionStats(prev => ({
          ...prev,
          [collection.id]: { total: totalCards, unique: uniqueCards }
        }));

        // Always refresh preview cards to show latest collection state
        if (realCollectionCards.length > 0) {
          try {
            const previewCards = realCollectionCards.slice(0, 3);
            const cardPromises = previewCards.map(async (collectionCard) => {
              try {
                const cardData = await fetchCard(collectionCard.cardId);
                return cardData;
              } catch (error) {
                console.error(`Failed to load card ${collectionCard.cardId}:`, error);
                return null;
              }
            });

            const cards = (await Promise.all(cardPromises)).filter(Boolean) as PokemonCard[];
            
            setCollectionPreviews(prev => ({
              ...prev,
              [collection.id]: cards
            }));
          } catch (error) {
            console.error(`Failed to load preview for collection ${collection.id}:`, error);
          }
        } else {
          // Clear previews for empty collections
          setCollectionPreviews(prev => ({
            ...prev,
            [collection.id]: []
          }));
        }
      }
    };

    loadCollectionData();
  }, [collections, collectionCards]); // Removed collectionPreviews to fix infinite loop

  const handleRename = async (collectionId: number) => {
    if (!newCollectionName.trim()) {
      toast({
        title: "Invalid name",
        description: "Collection name cannot be empty",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Collection renamed",
      description: `Collection renamed to "${newCollectionName}"`,
    });
    setRenameDialogOpen(null);
    setNewCollectionName("");
  };

  const handleDelete = async (collectionId: number, collectionName: string) => {
    try {
      await deleteCollection(collectionId);
      toast({
        title: "Collection deleted",
        description: `"${collectionName}" has been deleted`,
      });
    } catch (error) {
      toast({
        title: "Failed to delete",
        description: "Could not delete collection. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleSetActive = (collectionId: number) => {
    setActiveCollection(collectionId);
    toast({
      title: "Active collection set",
      description: "This collection is now active for adding new cards",
    });
  };

  const displayedCollections = collections.slice(0, maxCollections);

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Mobile: Show responsive layout */}
      <div className="lg:hidden">
        {/* Mobile Header */}
        <div className="bg-gradient-to-br from-purple-600 via-purple-700 to-blue-600 p-6">
          <h1 className="text-2xl font-bold text-center text-white mb-2">My Collections</h1>
          <div className="text-center">
            <Badge className="bg-white/20 backdrop-blur-sm text-white border-white/30 px-4 py-2 text-sm">
              {collections.length}/{maxCollections} Collections
            </Badge>
          </div>
        </div>

        {/* Mobile Collections */}
        <div className="p-4">
          {displayedCollections.length > 0 ? (
            <div className="space-y-4">
              {displayedCollections.map((collection) => {
                const cardCount = collectionPreviews[collection.id]?.length || 0;
                const previewCards = collectionPreviews[collection.id]?.slice(0, 3) || [];
                
                return (
                  <motion.div
                    key={collection.id}
                    className="bg-slate-800 rounded-xl border border-slate-700 p-4"
                    whileHover={{ scale: 1.02 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-semibold text-white truncate">{collection.name}</h3>
                      <Badge className="bg-purple-600/20 text-purple-300 border-purple-500/30 text-xs">
                        {cardCount} cards
                      </Badge>
                    </div>

                    {/* Mobile Card Preview */}
                    <div className="grid grid-cols-3 gap-2 mb-4">
                      {previewCards.length > 0 ? (
                        previewCards.map((card, index) => (
                          <div key={index} className="aspect-[3/4] bg-slate-700 rounded-lg overflow-hidden">
                            <img 
                              src={card.images?.small || ''} 
                              alt={card.name || 'Pokemon Card'}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          </div>
                        ))
                      ) : (
                        <div className="col-span-3 text-center py-8 text-slate-500">
                          <Folder className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">No cards yet</p>
                        </div>
                      )}
                    </div>

                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full border-purple-500/30 text-purple-300 hover:bg-purple-600/20"
                      onClick={() => {
                        // Fast collection opening with immediate navigation
                        setActiveCollection(collection.id);
                        setLocation('/my-collection');
                      }}
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      View Collection
                    </Button>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <motion.div
              className="text-center py-16"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Folder className="w-16 h-16 mx-auto mb-4 text-slate-600" />
              <h2 className="text-2xl font-bold text-white mb-2">No Collections Yet</h2>
              <p className="text-slate-400 mb-6 px-4 text-sm">
                Create your first collection to start organizing your Pokémon cards.
              </p>
              <Button 
                onClick={() => setNewCollectionDialogOpen(true)}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Collection
              </Button>
            </motion.div>
          )}
        </div>
      </div>

      {/* Desktop: Show sidebar + main content */}
      <div className="hidden lg:flex">
        {/* Desktop Sidebar */}
        <div className="w-80 bg-slate-800 border-r border-slate-700 overflow-y-auto">
          <Sidebar onSearch={(query, type, rarity) => {
            console.log('Search:', { query, type, rarity });
          }} />
        </div>

        {/* Desktop Main Content */}
        <div className="flex-1 overflow-y-auto">
        {/* Hero Header */}
        <div className="bg-gradient-to-br from-purple-600 via-purple-700 to-blue-600 relative overflow-hidden">
        {/* Pokéball pattern background */}
        <div className="absolute inset-0 opacity-10">
          <div className="grid grid-cols-8 gap-8 p-8">
            {[...Array(32)].map((_, i) => (
              <div key={i} className="w-16 h-16 rounded-full border-4 border-white/20 flex items-center justify-center">
                <div className="w-2 h-2 bg-white/30 rounded-full"></div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative max-w-6xl mx-auto p-8">
          <h1 className="text-5xl font-bold text-white mb-4">
            Pokémon Card Collections
          </h1>
          <p className="text-purple-100 text-lg mb-8 max-w-2xl">
            Organize your Pokémon cards into custom collections. Group by expansion set, 
            type, rarity, or create your own organization system.
          </p>
          
          <div className="flex items-center gap-4">
            <Button 
              onClick={() => setNewCollectionDialogOpen(true)}
              className="bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/30 text-white"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create New Collection
            </Button>
            <Badge className="bg-white/20 backdrop-blur-sm text-white border-white/30 px-4 py-2 text-sm">
              {collections.length}/{maxCollections} Collections
            </Badge>
          </div>
        </div>
      </div>

      {/* Collections Management */}
      <div className="max-w-6xl mx-auto p-8">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Folder className="w-6 h-6 text-purple-400" />
            <h2 className="text-2xl font-bold text-white">Your Collections</h2>
            <span className="text-slate-400">
              Manage and organize your Pokémon card collections
            </span>
          </div>
          <Button 
            onClick={() => setNewCollectionDialogOpen(true)}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Collection
          </Button>
        </div>

        {/* Active Collection Bar */}
        {activeCollection && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-800 border border-slate-700 rounded-xl p-6 mb-8"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Badge className="bg-purple-600 text-white px-3 py-1">
                  Active Collection
                </Badge>
                <div>
                  <h3 className="text-xl font-semibold text-white">
                    {activeCollection.name}
                  </h3>
                  <div className="flex items-center gap-4 text-sm text-slate-400 mt-1">
                    <span>English</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {new Date(activeCollection.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-3">
                <Button 
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                  onClick={() => window.location.href = `/collection-manager?collectionId=${activeCollection.id}`}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Open Collection
                </Button>
                
                <Dialog open={renameDialogOpen === activeCollection.id} onOpenChange={(open) => {
                  if (open) {
                    setRenameDialogOpen(activeCollection.id);
                    setNewCollectionName(activeCollection.name);
                  } else {
                    setRenameDialogOpen(null);
                    setNewCollectionName("");
                  }
                }}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-700">
                      <Edit className="w-4 h-4 mr-2" />
                      Rename
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-slate-800 border-slate-700 text-white">
                    <DialogHeader>
                      <DialogTitle>Rename Collection</DialogTitle>
                      <DialogDescription className="text-slate-400">
                        Enter a new name for your collection.
                      </DialogDescription>
                    </DialogHeader>
                    <Input
                      value={newCollectionName}
                      onChange={(e) => setNewCollectionName(e.target.value)}
                      placeholder="Collection name"
                      className="bg-slate-700 border-slate-600 text-white"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleRename(activeCollection.id);
                        }
                      }}
                    />
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setRenameDialogOpen(null)}>
                        Cancel
                      </Button>
                      <Button onClick={() => handleRename(activeCollection.id)} className="bg-purple-600 hover:bg-purple-700">
                        Rename
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                <Button 
                  variant="outline" 
                  className="border-slate-600 text-slate-300 hover:bg-slate-700"
                  onClick={() => window.location.href = `/statistics?collectionId=${activeCollection.id}`}
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Statistics
                </Button>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" className="border-red-600 text-red-400 hover:bg-red-900/20">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-slate-800 border-slate-700 text-white">
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Collection</AlertDialogTitle>
                      <AlertDialogDescription className="text-slate-400">
                        Are you sure you want to delete "{activeCollection.name}"? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600">
                        Cancel
                      </AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDelete(activeCollection.id, activeCollection.name)}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </motion.div>
        )}

        {/* Collections Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <AnimatePresence>
            {displayedCollections.map((collection, index) => {
              const stats = collectionStats[collection.id] || { total: 0, unique: 0 };
              const preview = collectionPreviews[collection.id] || [];
              const isActive = activeCollection?.id === collection.id;

              return (
                <motion.div
                  key={collection.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <Card className={cn(
                    "group overflow-hidden transition-all duration-300 border-2",
                    isActive 
                      ? "bg-slate-800/50 border-cyan-500 shadow-lg shadow-cyan-500/20" 
                      : "bg-slate-800/50 border-slate-700 hover:border-slate-600"
                  )}>
                    <CardContent className="p-6">
                      {/* Collection Header */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <h3 className="text-xl font-semibold text-white">
                            {collection.name}
                          </h3>
                          {isActive && (
                            <Badge className="bg-cyan-500 text-cyan-900 text-xs">
                              Active
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex gap-1">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0 text-slate-400 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => {
                              setRenameDialogOpen(collection.id);
                              setNewCollectionName(collection.name);
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0 text-red-400 hover:text-red-300 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Collection Info */}
                      <div className="flex items-center gap-4 text-sm text-slate-400 mb-4">
                        <span>English</span>
                      </div>

                      {/* Card Preview */}
                      <div className="grid grid-cols-3 gap-3 mb-6">
                        {preview.length > 0 ? (
                          preview.map((card, cardIndex) => (
                            <motion.div
                              key={card.id}
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: cardIndex * 0.1 }}
                              className="aspect-[3/4] rounded-lg overflow-hidden bg-slate-700 hover:scale-105 transition-transform cursor-pointer shadow-lg"
                            >
                              <img
                                src={card.images.small}
                                alt={card.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                  target.nextElementSibling?.classList.remove('hidden');
                                }}
                              />
                              <div className="hidden w-full h-full flex items-center justify-center bg-slate-700 text-slate-400">
                                <div className="text-center">
                                  <div className="w-8 h-8 mx-auto mb-1 bg-slate-600 rounded"></div>
                                  <div className="text-xs">No Image</div>
                                </div>
                              </div>
                            </motion.div>
                          ))
                        ) : (
                          [...Array(3)].map((_, i) => (
                            <div key={i} className="aspect-[3/4] bg-slate-700 rounded-lg flex items-center justify-center border-2 border-dashed border-slate-600">
                              <div className="text-center text-slate-500">
                                <div className="w-6 h-6 mx-auto mb-1 bg-slate-600 rounded"></div>
                                <div className="text-xs">Empty</div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>

                      {/* Date */}
                      <div className="flex items-center gap-2 text-sm text-slate-400 mb-4">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(collection.createdAt).toLocaleDateString()}</span>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        <Button 
                          className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white"
                          onClick={() => {
                            setActiveCollection(collection.id);
                            setLocation('/my-collection');
                          }}
                        >
                          Open
                        </Button>
                        <Button 
                          variant="outline" 
                          className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700"
                          onClick={() => {
                            setActiveCollection(collection.id);
                            setLocation('/statistics');
                          }}
                        >
                          <BarChart3 className="w-4 h-4 mr-1" />
                          Stats
                        </Button>
                      </div>
                      
                      {!isActive && (
                        <Button 
                          variant="outline" 
                          className="w-full mt-2 border-purple-600 text-purple-400 hover:bg-purple-900/20"
                          onClick={() => handleSetActive(collection.id)}
                        >
                          Set Active
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Empty State */}
        {displayedCollections.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <div className="w-24 h-24 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center mx-auto mb-6">
              <Folder className="w-12 h-12 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">
              No Collections Yet
            </h2>
            <p className="text-slate-400 mb-8 max-w-md mx-auto">
              Create your first collection to start organizing your Pokémon cards. You can add up to {maxCollections} collections.
            </p>
            <Button 
              onClick={() => setNewCollectionDialogOpen(true)}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Collection
            </Button>
          </motion.div>
        )}
        </div>
        </div>
      </div>

      {/* Mobile Navigation Components */}
      <MobileBottomNav onMenuClick={() => setIsMobileSidebarOpen(true)} />
      <MobileSidebar 
        isOpen={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
        onSearch={(query, type, rarity) => {
          console.log('Mobile search:', { query, type, rarity });
          setIsMobileSidebarOpen(false); // Close sidebar after search
        }}
      />

      {/* New Collection Dialog */}
      <Dialog open={newCollectionDialogOpen} onOpenChange={setNewCollectionDialogOpen}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle>Create New Collection</DialogTitle>
            <DialogDescription className="text-slate-400">
              Give your collection a name to start organizing your Pokémon cards.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="collection-name" className="text-white">Collection Name</Label>
              <Input
                id="collection-name"
                value={createCollectionName}
                onChange={(e) => setCreateCollectionName(e.target.value)}
                placeholder="e.g., My Favorite Cards, Base Set Collection"
                className="bg-slate-700 border-slate-600 text-white"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleCreateCollection();
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setNewCollectionDialogOpen(false);
                setCreateCollectionName("");
              }}
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCreateCollection}
              className="bg-purple-600 hover:bg-purple-700"
              disabled={!createCollectionName.trim()}
            >
              Create Collection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}