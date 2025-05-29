import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AlertTriangle, Loader2, PlusCircle } from 'lucide-react';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import CardPhotoUpload from './CardPhotoUpload';

interface CardDetailProps {
  cardId: string;
  collectionId?: number;
  onAddToCollection?: (cardId: string) => void;
}

export default function CardDetailWithPhotos({ cardId, collectionId, onAddToCollection }: CardDetailProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = React.useState('details');
  
  // Fetch the card details from the Pokemon TCG API
  const { data: card, isLoading, error } = useQuery({
    queryKey: [`/api/card/${cardId}`],
    queryFn: async () => {
      const response = await fetch(`https://api.pokemontcg.io/v2/cards/${cardId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch card details');
      }
      return response.json().then(data => data.data);
    }
  });

  // If the card is in a collection, fetch the collection card data
  const { data: collectionCard, isLoading: isLoadingCollectionCard } = useQuery({
    queryKey: ['/api/collection-card', collectionId, cardId],
    queryFn: async () => {
      if (!collectionId) return null;
      
      const response = await fetch(`/api/collections/${collectionId}/cards?cardId=${cardId}`);
      if (!response.ok) {
        if (response.status === 404) {
          return null; // Card not in collection
        }
        throw new Error('Failed to fetch collection card details');
      }
      return response.json();
    },
    enabled: !!collectionId
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !card) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          {error ? (error as Error).message : 'Failed to load card details'}
        </AlertDescription>
      </Alert>
    );
  }

  // Generate a gradient based on the card type for the header
  const typeColors: Record<string, string> = {
    Colorless: 'from-slate-300 to-slate-400',
    Darkness: 'from-purple-900 to-slate-900',
    Dragon: 'from-orange-500 to-indigo-600',
    Fairy: 'from-pink-400 to-pink-600',
    Fighting: 'from-orange-700 to-red-800',
    Fire: 'from-orange-500 to-red-600',
    Grass: 'from-green-400 to-green-600',
    Lightning: 'from-yellow-300 to-amber-500',
    Metal: 'from-slate-400 to-zinc-600',
    Psychic: 'from-purple-400 to-purple-600',
    Water: 'from-blue-400 to-blue-600',
  };

  const mainType = card.types?.[0] || 'Colorless';
  const gradientClass = typeColors[mainType] || 'from-slate-300 to-slate-400';

  // Helper function to get rarity badge color
  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'Common':
        return 'bg-gradient-to-r from-slate-500 to-slate-400 text-white';
      case 'Uncommon':
        return 'bg-gradient-to-r from-green-500 to-emerald-400 text-white';
      case 'Rare':
        return 'bg-gradient-to-r from-blue-500 to-cyan-400 text-white';
      case 'Rare Holo':
      case 'Rare Holo EX':
        return 'bg-gradient-to-r from-indigo-500 to-purple-400 text-white';
      case 'Rare Ultra':
      case 'Ultra Rare':
        return 'bg-gradient-to-r from-violet-600 to-fuchsia-400 text-white';
      case 'Rare Secret':
      case 'Secret Rare':
        return 'bg-gradient-to-r from-amber-500 to-yellow-300 text-black';
      case 'Rare Rainbow':
      case 'Rainbow Rare':
        return 'bg-gradient-to-r from-red-500 via-green-500 to-blue-500 text-white';
      case 'LEGEND':
      case 'Amazing Rare':
        return 'bg-gradient-to-r from-rose-500 to-pink-400 text-white';
      case 'Promo':
        return 'bg-gradient-to-r from-teal-500 to-cyan-400 text-white';
      default:
        return 'bg-slate-500 text-white';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className={`bg-gradient-to-r ${gradientClass} text-white`}>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl md:text-2xl">{card.name}</CardTitle>
            <CardDescription className="text-white/80">
              {card.subtypes?.join(' · ')} {card.supertype}
            </CardDescription>
          </div>
          {card.rarity && (
            <Badge className={getRarityColor(card.rarity)}>
              {card.rarity}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details">Card Details</TabsTrigger>
            <TabsTrigger value="image">Card Image</TabsTrigger>
            <TabsTrigger value="photos">My Photos</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="p-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Set</h3>
                  <p className="text-base font-medium">
                    {card.set.name} <span className="text-sm text-muted-foreground">({card.set.series})</span>
                  </p>
                  {card.set.releaseDate && (
                    <p className="text-xs text-muted-foreground">
                      Released: {new Date(card.set.releaseDate).toLocaleDateString()}
                    </p>
                  )}
                </div>

                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Card Number</h3>
                  <p className="text-base font-medium">
                    {card.number} <span className="text-sm text-muted-foreground">/ {card.set.printedTotal}</span>
                  </p>
                </div>

                {card.types && card.types.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Type</h3>
                    <div className="flex space-x-2 mt-1">
                      {card.types.map(type => (
                        <Badge 
                          key={type} 
                          className={`${typeColors[type]?.replace('from-', 'bg-').split(' ')[0] || 'bg-slate-300'} text-white`}
                        >
                          {type}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {card.resistances && card.resistances.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Resistances</h3>
                    <div className="flex space-x-2 mt-1">
                      {card.resistances.map((resistance, index) => (
                        <Badge 
                          key={index} 
                          className={`${typeColors[resistance.type]?.replace('from-', 'bg-').split(' ')[0] || 'bg-slate-300'} text-white`}
                        >
                          {resistance.type} {resistance.value}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {card.weaknesses && card.weaknesses.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Weaknesses</h3>
                    <div className="flex space-x-2 mt-1">
                      {card.weaknesses.map((weakness, index) => (
                        <Badge 
                          key={index} 
                          className={`${typeColors[weakness.type]?.replace('from-', 'bg-').split(' ')[0] || 'bg-slate-300'} text-white`}
                        >
                          {weakness.type} {weakness.value}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                {card.hp && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">HP</h3>
                    <Progress value={parseInt(card.hp)} max={300} className="h-2 mt-1" />
                    <p className="text-base font-medium mt-1">{card.hp}</p>
                  </div>
                )}

                {card.artist && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Artist</h3>
                    <p className="text-base font-medium">{card.artist}</p>
                  </div>
                )}

                {card.flavorText && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Flavor Text</h3>
                    <p className="text-sm italic mt-1">{card.flavorText}</p>
                  </div>
                )}

                {card.legalities && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Legalities</h3>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {Object.entries(card.legalities).map(([format, status]) => (
                        <Badge 
                          key={format} 
                          variant={status === "Legal" ? "outline" : "destructive"}
                        >
                          {format}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {collectionId && (
                  <div className="mt-6">
                    <h3 className="text-sm font-medium text-muted-foreground">Collection Status</h3>
                    {isLoadingCollectionCard ? (
                      <div className="flex items-center mt-2">
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        <span>Checking collection status...</span>
                      </div>
                    ) : collectionCard ? (
                      <div className="flex items-center mt-2">
                        <Badge variant="outline" className="mr-2">
                          Quantity: {collectionCard.quantity}
                        </Badge>
                        <p className="text-xs text-muted-foreground">
                          Added on {new Date(collectionCard.addedAt).toLocaleDateString()}
                        </p>
                      </div>
                    ) : (
                      <Button 
                        size="sm" 
                        className="mt-2"
                        onClick={() => onAddToCollection?.(cardId)}
                      >
                        <PlusCircle className="h-4 w-4 mr-2" />
                        Add to Collection
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {card.attacks && card.attacks.length > 0 && (
              <div className="mt-4">
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Attacks</h3>
                <div className="space-y-3">
                  {card.attacks.map((attack, index) => (
                    <div key={index} className="border rounded-lg p-3">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center">
                          <div className="flex space-x-1 mr-2">
                            {attack.cost?.map((cost, costIndex) => (
                              <Avatar key={costIndex} className="h-6 w-6">
                                <AvatarImage src={`/symbols/${cost.toLowerCase()}.png`} alt={cost} />
                                <AvatarFallback className={`${typeColors[cost]?.replace('from-', 'bg-').split(' ')[0] || 'bg-slate-300'} text-white text-xs`}>
                                  {cost.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                            ))}
                          </div>
                          <div>
                            <h4 className="font-medium">{attack.name}</h4>
                          </div>
                        </div>
                        {attack.damage && (
                          <Badge variant="outline" className="ml-2">
                            {attack.damage}
                          </Badge>
                        )}
                      </div>
                      {attack.text && (
                        <p className="text-sm mt-2">{attack.text}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {card.abilities && card.abilities.length > 0 && (
              <div className="mt-4">
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Abilities</h3>
                <div className="space-y-3">
                  {card.abilities.map((ability, index) => (
                    <div key={index} className="border rounded-lg p-3">
                      <div className="flex items-center">
                        <Badge variant="outline" className="mr-2">
                          {ability.type}
                        </Badge>
                        <h4 className="font-medium">{ability.name}</h4>
                      </div>
                      {ability.text && (
                        <p className="text-sm mt-2">{ability.text}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(card.rules && card.rules.length > 0) && (
              <div className="mt-4">
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Rules</h3>
                <div className="space-y-2">
                  {card.rules.map((rule, index) => (
                    <p key={index} className="text-sm">{rule}</p>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="image" className="p-4">
            <div className="w-full max-w-sm mx-auto">
              <AspectRatio ratio={2/3} className="bg-muted overflow-hidden rounded-md">
                <img 
                  src={card.images.large} 
                  alt={card.name}
                  className="object-contain w-full h-full"
                  loading="lazy"
                />
              </AspectRatio>
            </div>
          </TabsContent>

          <TabsContent value="photos" className="p-4">
            {user && collectionCard ? (
              <CardPhotoUpload 
                collectionCardId={collectionCard.id} 
                userId={user.id}
                cardName={card.name}
              />
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  {!user 
                    ? "You need to be logged in to manage card photos." 
                    : "You need to add this card to your collection first to upload photos."}
                </p>
                {!user ? (
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => window.location.href = "/auth"}
                  >
                    Login to Continue
                  </Button>
                ) : collectionId && onAddToCollection ? (
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => onAddToCollection(cardId)}
                  >
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Add to Collection
                  </Button>
                ) : null}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}