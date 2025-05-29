import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card as PokemonCard } from '@/api/pokemonTCG';
import { useCollectionContext } from '@/context/CollectionContext';
import { getTypeClass, getRarityClass } from '@/lib/utils';
import EnergyIcon from '@/components/EnergyIcon';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
// Foto-gerelateerde imports verwijderd

interface CardDetailProps {
  card: PokemonCard | null;
  isOpen: boolean;
  onClose: () => void;
}

const CardDetail: React.FC<CardDetailProps> = ({ card, isOpen, onClose }) => {
  const { activeCollection, addCardToCollection, removeCardFromCollection, getCardQuantity } = useCollectionContext();
  const { user } = useAuth();
  const [quantity, setQuantity] = useState(0);
  
  useEffect(() => {
    if (card && activeCollection) {
      const currentQuantity = getCardQuantity(card.id);
      setQuantity(currentQuantity);
    } else {
      setQuantity(0);
    }
  }, [card, activeCollection, getCardQuantity]);
  
  const handleIncreaseQuantity = () => {
    if (!card || !activeCollection) return;
    
    addCardToCollection(card.id);
    setQuantity(prev => prev + 1);
    
    if (typeof (window as any).showToast === 'function') {
      (window as any).showToast(`Added ${card.name} to your collection.`, 'success');
    }
  };
  
  const handleDecreaseQuantity = () => {
    if (!card || !activeCollection || quantity <= 0) return;
    
    removeCardFromCollection(card.id);
    setQuantity(prev => Math.max(0, prev - 1));
    
    if (typeof (window as any).showToast === 'function') {
      (window as any).showToast(`Removed ${card.name} from your collection.`, 'info');
    }
  };
  
  if (!card) return null;
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-card text-foreground sm:max-w-3xl md:max-w-4xl p-0 overflow-y-auto max-h-[90vh] h-auto w-[95vw] sm:w-auto">
        {/* Kruisje verwijderd omdat er maar één sluitknop nodig is */}
        
        <div className="p-4 sm:p-6">
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-1">
              <TabsTrigger value="details">Kaartdetails</TabsTrigger>
            </TabsList>
            
            <TabsContent value="details" className="mt-4">
              <div className="flex flex-col md:flex-row gap-4 sm:gap-6">
                {/* Left Column - Card Image and Collection Controls */}
                <div className="w-full md:w-2/5 flex-shrink-0">
                  <div className="relative group rounded-lg overflow-hidden shadow-lg">
                    <img 
                      src={card.images.large} 
                      alt={card.name} 
                      className="w-full max-w-[300px] mx-auto rounded-lg transition-transform duration-300 group-hover:scale-[1.02]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-4">
                      {card.tcgplayer && (
                        <a 
                          href={card.tcgplayer.url} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="px-4 py-2 bg-secondary hover:bg-secondary/90 text-secondary-foreground rounded-lg transition-colors text-sm"
                        >
                          <i className="fas fa-shopping-cart mr-2"></i> View on TCGPlayer
                        </a>
                      )}
                    </div>
                  </div>
                  
                  {activeCollection && (
                    <div className="mt-4">
                      <div className="flex justify-between items-center p-3 bg-gradient-to-r from-primary/10 to-accent/10 border border-border rounded-lg">
                        <button 
                          className="text-foreground hover:text-destructive text-xl p-2 transition-colors"
                          onClick={handleDecreaseQuantity}
                          disabled={quantity <= 0}
                          aria-label="Decrease quantity"
                        >
                          <i className="fas fa-minus-circle"></i>
                        </button>
                        <div className="flex flex-col items-center">
                          <span className="text-2xl font-bold text-foreground">{quantity}</span>
                          <span className="text-xs text-muted-foreground">in collection</span>
                        </div>
                        <button 
                          className="text-foreground hover:text-primary text-xl p-2 transition-colors"
                          onClick={handleIncreaseQuantity}
                          aria-label="Increase quantity"
                        >
                          <i className="fas fa-plus-circle"></i>
                        </button>
                      </div>
                      
                      <p className="mt-2 text-center text-sm text-muted-foreground">
                        Collected in: <span className="text-primary font-medium">{activeCollection.name}</span>
                      </p>
                    </div>
                  )}
                  
                  {card.tcgplayer?.prices && (
                    <div className="mt-4">
                      <h3 className="text-base font-medium text-foreground mb-2 flex items-center">
                        <i className="fas fa-tag text-secondary mr-2"></i> Market Prices
                      </h3>
                      <div className="p-3 bg-muted rounded-lg border border-border/50">
                        <div className="grid grid-cols-2 gap-2">
                          {card.tcgplayer.prices.normal && (
                            <div className="text-center">
                              <p className="text-xs text-muted-foreground mb-1">Normal</p>
                              <p className="text-sm font-medium">${card.tcgplayer.prices.normal.market || card.tcgplayer.prices.normal.mid || '—'}</p>
                            </div>
                          )}
                          {card.tcgplayer.prices.holofoil && (
                            <div className="text-center">
                              <p className="text-xs text-muted-foreground mb-1">Holofoil</p>
                              <p className="text-sm font-medium">${card.tcgplayer.prices.holofoil.market || card.tcgplayer.prices.holofoil.mid || '—'}</p>
                            </div>
                          )}
                          {card.tcgplayer.prices.reverseHolofoil && (
                            <div className="text-center">
                              <p className="text-xs text-muted-foreground mb-1">Reverse Holo</p>
                              <p className="text-sm font-medium">${card.tcgplayer.prices.reverseHolofoil.market || card.tcgplayer.prices.reverseHolofoil.mid || '—'}</p>
                            </div>
                          )}
                          {card.tcgplayer.prices.firstEditionHolofoil && (
                            <div className="text-center">
                              <p className="text-xs text-muted-foreground mb-1">1st Ed. Holo</p>
                              <p className="text-sm font-medium">${card.tcgplayer.prices.firstEditionHolofoil.market || card.tcgplayer.prices.firstEditionHolofoil.mid || '—'}</p>
                            </div>
                          )}
                        </div>
                        <div className="mt-2 pt-2 border-t border-border/30 text-center">
                          <p className="text-xs text-muted-foreground">
                            Updated: {card.tcgplayer.updatedAt ? new Date(card.tcgplayer.updatedAt).toLocaleDateString() : 'N/A'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Right Column - Card Details */}
                <div className="flex-grow overflow-y-auto">
                  <div className="flex items-start justify-between">
                    <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-3 sm:mb-4">{card.name}</h2>
                    {card.hp && (
                      <span className="inline-flex items-center justify-center bg-gradient-to-r from-red-500 to-red-600 text-white font-bold px-2 py-1 rounded ml-2">
                        HP {card.hp}
                      </span>
                    )}
                  </div>
                  
                  {/* Card Meta Info */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-5 sm:mb-6">
                    <div>
                      <p className="text-muted-foreground text-xs sm:text-sm mb-1">Set:</p>
                      <div className="flex items-center">
                        {card.set.images?.symbol && (
                          <img 
                            src={card.set.images.symbol} 
                            alt="Set Symbol" 
                            className="w-4 h-4 mr-2"
                          />
                        )}
                        <p className="text-foreground text-sm sm:text-base">{card.set.name}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs sm:text-sm mb-1">Number:</p>
                      <p className="text-foreground text-sm sm:text-base font-medium">
                        #{card.number}
                        <span className="text-muted-foreground font-normal">/{card.set.printedTotal}</span>
                      </p>
                    </div>
                    {card.rarity && (
                      <div>
                        <p className="text-muted-foreground text-xs sm:text-sm mb-1">Rarity:</p>
                        <p className="text-foreground flex items-center">
                          <span className={`inline-block mr-2 px-2 py-0.5 ${getRarityClass(card.rarity)} text-white text-xs rounded shadow-sm`}>
                            {card.rarity}
                          </span>
                        </p>
                      </div>
                    )}
                    {card.types && card.types.length > 0 && (
                      <div>
                        <p className="text-muted-foreground text-xs sm:text-sm mb-1">Type:</p>
                        <p className="text-foreground flex flex-wrap items-center">
                          {card.types.map((type: string, index: number) => (
                            <span key={index} className="flex items-center mr-2 mb-1">
                              <EnergyIcon type={type} size="sm" className="mr-1" />
                              <span className="text-sm sm:text-base">{type}</span>
                            </span>
                          ))}
                        </p>
                      </div>
                    )}
                    {activeCollection && (
                      <div className="md:hidden">
                        <p className="text-muted-foreground text-xs sm:text-sm mb-1">Collection:</p>
                        <p className="text-primary font-medium text-sm sm:text-base">{activeCollection.name}</p>
                      </div>
                    )}
                    
                    {card.subtypes && card.subtypes.length > 0 && (
                      <div>
                        <p className="text-muted-foreground text-xs sm:text-sm mb-1">Subtype:</p>
                        <div className="flex flex-wrap gap-1">
                          {card.subtypes.map((subtype: string, i: number) => (
                            <span key={i} className="inline-block text-xs px-2 py-1 bg-muted/70 rounded-full">
                              {subtype}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Attacks */}
                  {card.attacks && card.attacks.length > 0 && (
                    <div className="mt-4 sm:mt-5">
                      <h3 className="text-base sm:text-lg font-semibold text-foreground mb-2 flex items-center">
                        <i className="fas fa-bolt text-secondary mr-2"></i> Attacks
                      </h3>
                      <div className="space-y-3">
                        {card.attacks.map((attack: any, index: number) => (
                          <div key={index} className="p-3 bg-gradient-to-r from-muted to-muted/70 rounded-lg border border-border/50 hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex flex-wrap items-center">
                                {attack.cost.map((costType: string, costIndex: number) => (
                                  <EnergyIcon 
                                    key={costIndex} 
                                    type={costType}
                                    size="md"
                                    className="mr-1"
                                  />
                                ))}
                                <span className="text-foreground font-medium ml-2 text-sm sm:text-base">{attack.name}</span>
                              </div>
                              <span className="text-primary font-bold text-sm sm:text-base">{attack.damage}</span>
                            </div>
                            {attack.text && (
                              <p className="text-muted-foreground text-xs sm:text-sm">{attack.text}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Abilities */}
                  {card.abilities && card.abilities.length > 0 && (
                    <div className="mt-4 sm:mt-5">
                      <h3 className="text-base sm:text-lg font-semibold text-foreground mb-2 flex items-center">
                        <i className="fas fa-star text-yellow-500 mr-2"></i> Abilities
                      </h3>
                      <div className="space-y-3">
                        {card.abilities.map((ability: any, index: number) => (
                          <div key={index} className="p-3 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-lg border border-indigo-500/20">
                            <div className="flex items-start justify-between mb-1">
                              <div className="flex flex-wrap items-center">
                                <span className="text-foreground font-semibold text-sm sm:text-base">{ability.name}</span>
                                {ability.type && (
                                  <span className="ml-2 text-xs bg-indigo-500/20 px-2 py-0.5 rounded-full text-indigo-400">
                                    {ability.type}
                                  </span>
                                )}
                              </div>
                            </div>
                            {ability.text && (
                              <p className="text-muted-foreground text-xs sm:text-sm">{ability.text}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Rules */}
                  {card.rules && card.rules.length > 0 && (
                    <div className="mt-4 sm:mt-5">
                      <h3 className="text-base sm:text-lg font-semibold text-foreground mb-2 flex items-center">
                        <i className="fas fa-book text-accent mr-2"></i> Rules
                      </h3>
                      <div className="p-3 bg-gradient-to-r from-accent/10 to-accent/5 rounded-lg border border-border/50">
                        {card.rules.map((rule: string, index: number) => (
                          <p key={index} className="text-muted-foreground text-xs sm:text-sm mb-2 last:mb-0">{rule}</p>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Weaknesses, Resistances, Retreat Cost */}
                  <div className="mt-4 sm:mt-5 grid grid-cols-3 gap-3">
                    {card.weaknesses && card.weaknesses.length > 0 && (
                      <div className="col-span-1">
                        <p className="text-muted-foreground text-xs mb-1">Weakness:</p>
                        <div className="space-y-1">
                          {card.weaknesses.map((weakness: any, index: number) => (
                            <div key={index} className="flex items-center">
                              <EnergyIcon type={weakness.type} size="sm" className="mr-1" />
                              <span className="text-sm font-medium">{weakness.value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {card.resistances && card.resistances.length > 0 && (
                      <div className="col-span-1">
                        <p className="text-muted-foreground text-xs mb-1">Resistance:</p>
                        <div className="space-y-1">
                          {card.resistances.map((resistance: any, index: number) => (
                            <div key={index} className="flex items-center">
                              <EnergyIcon type={resistance.type} size="sm" className="mr-1" />
                              <span className="text-sm font-medium">{resistance.value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {card.retreatCost && card.retreatCost.length > 0 && (
                      <div className="col-span-1">
                        <p className="text-muted-foreground text-xs mb-1">Retreat Cost:</p>
                        <div className="flex">
                          {card.retreatCost.map((cost: string, i: number) => (
                            <EnergyIcon key={i} type="colorless" size="sm" className="mr-1" />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Artist */}
                  {card.artist && (
                    <div className="mt-4 sm:mt-5 text-right">
                      <p className="text-xs text-muted-foreground">
                        Illustrated by <span className="italic">{card.artist}</span>
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CardDetail;