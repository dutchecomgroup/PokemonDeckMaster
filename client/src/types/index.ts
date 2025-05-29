// Collection types
export interface Collection {
  id: number;
  name: string;
  language: string;
  userId: string;
  createdAt: Date;
  updatedAt?: Date;
}

export type InsertCollection = Omit<Collection, 'id' | 'createdAt'>;

// Collection card types
export interface CollectionCard {
  id: number;
  collectionId: number;
  cardId: string;
  quantity: number;
  addedAt: Date;
}

export type InsertCollectionCard = Omit<CollectionCard, 'id' | 'addedAt'>;

// User types
export interface User {
  id: number;
  username: string;
  password: string;
}

export type InsertUser = Omit<User, 'id'>;

// Set cache types
export interface SetCache {
  id: string;
  data: any;
  lastUpdated: Date;
}

export type InsertSetCache = Omit<SetCache, 'lastUpdated'>;

// API Response types

// Pokemon Card type extended with our app-specific fields
export interface Card {
  id: string;
  name: string;
  supertype?: string;
  subtypes?: string[];
  hp?: string;
  types?: string[];
  evolvesFrom?: string;
  evolvesTo?: string[];
  rules?: string[];
  attacks?: Attack[];
  weaknesses?: {
    type: string;
    value: string;
  }[];
  resistances?: {
    type: string;
    value: string;
  }[];
  retreatCost?: string[];
  convertedRetreatCost?: number;
  set?: {
    id: string;
    name: string;
    series: string;
    printedTotal: number;
    total: number;
    legalities: {
      [key: string]: string;
    };
    ptcgoCode: string;
    releaseDate: string;
    updatedAt: string;
    images: {
      symbol: string;
      logo: string;
    };
  };
  number: string;
  artist?: string;
  rarity?: string;
  flavorText?: string;
  nationalPokedexNumbers?: number[];
  legalities?: {
    [key: string]: string;
  };
  images: {
    small: string;
    large: string;
  };
  tcgplayer?: {
    url: string;
    updatedAt: string;
    prices: {
      [key: string]: {
        low: number;
        mid: number;
        high: number;
        market: number;
        directLow: number;
      };
    };
  };
  cardmarket?: {
    url: string;
    updatedAt: string;
    prices: {
      averageSellPrice: number;
      lowPrice: number;
      trendPrice: number;
      germanProLow: number;
      suggestedPrice: number;
      reverseHoloSell: number;
      reverseHoloLow: number;
      reverseHoloTrend: number;
      lowPriceExPlus: number;
      avg1: number;
      avg7: number;
      avg30: number;
      reverseHoloAvg1: number;
      reverseHoloAvg7: number;
      reverseHoloAvg30: number;
    };
  };
  // Our app-specific properties
  quantity?: number;
  setId?: string;
}

// Attack interface
export interface Attack {
  name: string;
  cost: string[];
  convertedEnergyCost: number;
  damage: string;
  text: string;
}

// Set interface
export interface Set {
  id: string;
  name: string;
  series: string;
  printedTotal: number;
  total: number;
  legalities: {
    [key: string]: string;
  };
  ptcgoCode: string;
  releaseDate: string;
  updatedAt: string;
  images: {
    symbol: string;
    logo: string;
  };
}
