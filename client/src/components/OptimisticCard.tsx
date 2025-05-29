import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Eye, Loader2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useOptimisticCollections } from '@/hooks/useOptimisticCollections';

interface PokemonCard {
  id: string;
  name: string;
  images: {
    small: string;
    large: string;
  };
  rarity?: string;
  number: string;
  types?: string[];
}

interface OptimisticCardProps {
  card: PokemonCard;
  viewMode: 'grid' | 'compact';
  onCardClick: (card: PokemonCard) => void;
}

const OptimisticCard: React.FC<OptimisticCardProps> = ({ card, viewMode, onCardClick }) => {
  const { getCardState, addCard, removeCard, isAddingCard, isRemovingCard } = useOptimisticCollections();
  
  // First-load guard: Don't render until card has complete data
  if (!card || !card.images?.small || !card.name || !card.id) {
    return (
      <div className="aspect-[3/4] bg-slate-800 border border-slate-700 rounded-lg animate-pulse">
        <div className="h-full flex items-center justify-center">
          <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
        </div>
      </div>
    );
  }
  
  const cardState = getCardState(card.id);
  const isLoading = cardState.isLoading;
  const isOwned = cardState.isInCollection;
  const quantity = cardState.quantity;

  const handleAddCard = (e: React.MouseEvent) => {
    e.stopPropagation();
    addCard(card.id, card.name);
  };

  const handleRemoveCard = (e: React.MouseEvent) => {
    e.stopPropagation();
    removeCard(card.id, card.name);
  };

  const handleCardClick = () => {
    onCardClick(card);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
      className="group relative"
    >
      <Card 
        className={cn(
          "bg-slate-800 border-slate-700 hover:border-purple-500/50 transition-all duration-300 overflow-hidden cursor-pointer",
          isOwned && "ring-2 ring-green-500/30 border-green-500/50",
          isLoading && "ring-2 ring-purple-500/50 border-purple-500/50"
        )}
      >
        <CardContent className="p-0 relative">
          {/* Card Image */}
          <div className="relative aspect-[3/4] overflow-hidden">
            <img
              src={card.images.small}
              alt={card.name}
              className={cn(
                "w-full h-full object-cover transition-all duration-300",
                "group-hover:scale-105",
                isLoading && "opacity-75"
              )}
              loading="lazy"
              onClick={handleCardClick}
            />
            
            {/* Loading Overlay */}
            <AnimatePresence>
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center"
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <Loader2 className="w-8 h-8 text-purple-400" />
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Collection Status Indicator - Moved to top-left to avoid overlap */}
            {isOwned && (
              <div className="absolute top-2 left-2 z-10">
                <Badge className="bg-green-600/90 text-white border-green-500 shadow-lg backdrop-blur-sm text-xs">
                  <Check className="w-3 h-3 mr-1" />
                  {quantity > 1 ? `${quantity}x` : 'Owned'}
                </Badge>
              </div>
            )}

            {/* Mobile-Only Action Button */}
            <div className="lg:hidden absolute bottom-2 right-2">
              {isOwned ? (
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={handleRemoveCard}
                  disabled={isLoading}
                  className={cn(
                    "h-8 w-8 p-0 bg-red-500 hover:bg-red-600 text-white shadow-lg border-2 border-white/20 transition-all duration-200",
                    isLoading && "opacity-75 cursor-not-allowed"
                  )}
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <X className="w-4 h-4" />
                  )}
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={handleAddCard}
                  disabled={isLoading}
                  className={cn(
                    "h-8 w-8 p-0 bg-purple-600 hover:bg-purple-700 text-white shadow-lg border-2 border-white/20 transition-all duration-200",
                    isLoading && "opacity-75 cursor-not-allowed"
                  )}
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                </Button>
              )}
            </div>

            {/* Desktop Hover Actions Overlay */}
            <div className="hidden lg:block absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
              <Button
                size="sm"
                variant="secondary"
                onClick={handleCardClick}
                className="bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur-sm"
              >
                <Eye className="w-4 h-4 mr-2" />
                View Details
              </Button>
            </div>



            {/* Rarity Badge - Moved to top-right when card is owned */}
            {card.rarity && (
              <div className={cn("absolute top-2 z-10", isOwned ? "right-2" : "left-2")}>
                <Badge className="bg-black/60 text-white border-0 text-xs backdrop-blur-sm">
                  {card.rarity}
                </Badge>
              </div>
            )}

            {/* Success Animation */}
            <AnimatePresence>
              {isOwned && !isLoading && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: [0, 1.2, 1], opacity: [0, 1, 0] }}
                  transition={{ duration: 0.6, times: [0, 0.6, 1] }}
                  className="absolute inset-0 flex items-center justify-center pointer-events-none"
                >
                  <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                    <Check className="w-8 h-8 text-green-400" />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Card Info and Action Button (only in grid view) */}
          {viewMode === 'grid' && (
            <motion.div 
              className="p-3 space-y-3"
              animate={{ opacity: isLoading ? 0.7 : 1 }}
              transition={{ duration: 0.2 }}
            >
              <div>
                <h4 className="font-semibold text-white text-sm mb-1 truncate">
                  {card.name}
                </h4>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-xs">#{card.number}</span>
                  {card.types && (
                    <Badge className="bg-slate-700 text-slate-300 border-0 text-xs">
                      {card.types[0]}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Mobile-Friendly Action Buttons - Properly Aligned */}
              <div className="flex gap-2 px-2 py-1">
                {isOwned ? (
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={handleRemoveCard}
                    disabled={isLoading}
                    className={cn(
                      "flex-1 h-8 text-xs bg-red-500 hover:bg-red-600 transition-all duration-200 min-w-0",
                      isLoading && "opacity-75 cursor-not-allowed"
                    )}
                  >
                    {isLoading ? (
                      <Loader2 className="w-3 h-3 animate-spin mr-1" />
                    ) : (
                      <X className="w-3 h-3 mr-1" />
                    )}
                    Remove
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={handleAddCard}
                    disabled={isLoading}
                    className={cn(
                      "flex-1 h-8 text-xs bg-purple-600 hover:bg-purple-700 transition-all duration-200 min-w-0",
                      isLoading && "opacity-75 cursor-not-allowed"
                    )}
                  >
                    {isLoading ? (
                      <Loader2 className="w-3 h-3 animate-spin mr-1" />
                    ) : (
                      <Plus className="w-3 h-3 mr-1" />
                    )}
                    Add
                  </Button>
                )}
                
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCardClick}
                  className="h-8 w-10 p-0 text-xs border-slate-600 text-slate-400 hover:text-white hover:border-slate-500 flex-shrink-0"
                >
                  <Eye className="w-3 h-3" />
                </Button>
              </div>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default OptimisticCard;