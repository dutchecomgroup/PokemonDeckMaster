/**
 * API client for communicating with the Pokemon TCG API
 */

const API_URL = "https://api.pokemontcg.io/v2";

// Get API key safely for both browser and server environments
const getApiKey = () => {
  if (typeof window !== 'undefined' && import.meta?.env) {
    return import.meta.env.VITE_POKEMON_TCG_API_KEY;
  }
  return process.env.VITE_POKEMON_TCG_API_KEY || "";
};

const API_KEY = getApiKey();

// Interface for the response of the sets endpoint
interface SetsResponse {
  data: Set[];
  page: number;
  pageSize: number;
  count: number;
  totalCount: number;
}

// Interface for the response of the cards endpoint
interface CardsResponse {
  data: Card[];
  page: number;
  pageSize: number;
  count: number;
  totalCount: number;
}

// Interface for the response of a single card endpoint
interface CardResponse {
  data: Card;
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

// Card interface
export interface Card {
  id: string;
  name: string;
  supertype: string;
  subtypes: string[];
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
  set: {
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
  legalities: {
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
}

// Attack interface
interface Attack {
  name: string;
  cost: string[];
  convertedEnergyCost: number;
  damage: string;
  text: string;
}

// Function to fetch all sets
export async function fetchSets(): Promise<Set[]> {
  try {
    const response = await fetch(`${API_URL}/sets?orderBy=releaseDate`, {
      headers: {
        "X-Api-Key": API_KEY
      }
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    const data: SetsResponse = await response.json();
    return data.data;
  } catch (error) {
    console.error("Error fetching sets:", error);
    throw error;
  }
}

// Function to fetch a specific set by its ID
export async function fetchSet(setId: string): Promise<Set> {
  try {
    const response = await fetch(`${API_URL}/sets/${setId}`, {
      headers: {
        "X-Api-Key": API_KEY
      }
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error(`Error fetching set ${setId}:`, error);
    throw error;
  }
}

// Function to fetch cards from a specific set
export async function fetchSetCards(setId: string): Promise<Card[]> {
  try {
    const response = await fetch(`${API_URL}/cards?q=set.id:${setId}&orderBy=number&pageSize=250`, {
      headers: {
        "X-Api-Key": API_KEY
      }
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    const data: CardsResponse = await response.json();
    return data.data;
  } catch (error) {
    console.error(`Error fetching cards for set ${setId}:`, error);
    throw error;
  }
}

// Function to fetch a specific card by its ID
export async function fetchCard(cardId: string): Promise<Card> {
  try {
    const response = await fetch(`${API_URL}/cards/${cardId}`, {
      headers: {
        "X-Api-Key": API_KEY
      }
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    const data: CardResponse = await response.json();
    return data.data;
  } catch (error) {
    console.error(`Error fetching card ${cardId}:`, error);
    throw error;
  }
}

// Function to search cards with various parameters
export async function searchCards(
  query: string = "",
  types: string[] = [],
  rarity: string = "",
  page: number = 1,
  pageSize: number = 20,
  setId: string = ""
): Promise<CardsResponse> {
  try {
    // Build all query parts in a single array
    const queryParts: string[] = [];
    
    // Case 1: We have a text search query
    if (query && query.trim() !== '') {
      // Clean the query string
      const cleanQuery = query.trim().replace(/\*/g, '');
      
      // Check if it looks like a card number (e.g., SV01-023)
      if (cleanQuery.includes('-') || /^\d+$/.test(cleanQuery)) {
        queryParts.push(`(number:"${cleanQuery}" OR name:"${cleanQuery}")`);
      } else {
        // Use wildcard on both sides for better partial matching
        queryParts.push(`name:*${cleanQuery}*`);
        console.log(`Searching for name:*${cleanQuery}*`);
      }
    }
    
    // Add all filter parts regardless of whether we have a search query
    
    // Add type filter if present
    if (types.length > 0) {
      queryParts.push(`types:${types.join(',')}`);
    }
    
    // Add rarity filter if present
    if (rarity) {
      queryParts.push(`rarity:"${rarity}"`);
    }
    
    // Add set filter if present
    if (setId) {
      queryParts.push(`set.id:${setId}`);
    }
    
    // Build the final URL
    let url = `${API_URL}/cards?page=${page}&pageSize=${pageSize}`;
    
    // If we have any query parts, add them to the URL
    if (queryParts.length > 0) {
      const queryString = queryParts.join(' ');
      url = `${API_URL}/cards?q=${encodeURIComponent(queryString)}&page=${page}&pageSize=${pageSize}`;
    }
    
    console.log('Search URL:', url);
    
    // Make the API request
    const response = await fetch(url, {
      headers: {
        "X-Api-Key": API_KEY
      }
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    const data: CardsResponse = await response.json();
    return data;
  } catch (error) {
    console.error("Error searching cards:", error);
    throw error;
  }
}

// Specialized function to get available sets based on type and rarity
export async function getSetsByTypeAndRarity(
  type: string = "",
  rarity: string = "",
  pageSize: number = 1000
): Promise<{id: string, name: string}[]> {
  try {
    // Build query string parts for type and rarity only
    const queryParts: string[] = [];
    
    if (type) {
      queryParts.push(`types:${type}`);
    }
    
    if (rarity) {
      queryParts.push(`rarity:"${rarity}"`);
    }
    
    // If no filters, return empty array - full set list should be used instead
    if (queryParts.length === 0) {
      return [];
    }
    
    // Build the URL with a larger page size to get as many matches as possible
    const queryString = queryParts.join(' ');
    const url = `${API_URL}/cards?q=${encodeURIComponent(queryString)}&page=1&pageSize=${pageSize}`;
    
    console.log('Checking sets with filters:', url);
    
    // Make the API request
    const response = await fetch(url, {
      headers: {
        "X-Api-Key": API_KEY
      }
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    const data: CardsResponse = await response.json();
    console.log(`Found ${data.data.length} cards matching the filters out of ${data.totalCount} total`);
    
    // Extract unique sets from the results
    const setsMap = new Map<string, {id: string, name: string}>();
    data.data.forEach((card: Card) => {
      if (card.set && card.set.id && card.set.name) {
        if (!setsMap.has(card.set.id)) {
          setsMap.set(card.set.id, {
            id: card.set.id,
            name: card.set.name
          });
        }
      }
    });
    
    const sortedSets = Array.from(setsMap.values()).sort((a, b) => a.name.localeCompare(b.name));
    console.log(`Found ${sortedSets.length} unique sets containing the filtered cards`);
    
    // Return sorted sets
    return sortedSets;
  } catch (error) {
    console.error("Error finding sets by type and rarity:", error);
    return [];
  }
}

// Function to fetch all types
export async function fetchTypes(): Promise<string[]> {
  try {
    const response = await fetch(`${API_URL}/types`, {
      headers: {
        "X-Api-Key": API_KEY
      }
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error("Error fetching types:", error);
    throw error;
  }
}

// Function to fetch all rarities
export async function fetchRarities(): Promise<string[]> {
  try {
    const response = await fetch(`${API_URL}/rarities`, {
      headers: {
        "X-Api-Key": API_KEY
      }
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error("Error fetching rarities:", error);
    throw error;
  }
}

// Function to fetch random cards for the home page
export async function fetchRandomCards(count: number = 10): Promise<Card[]> {
  try {
    // Strategy: Get a random set and then random cards from that set
    // First, fetch all sets
    const sets = await fetchSets();
    
    if (sets.length === 0) {
      throw new Error("No sets available");
    }
    
    // Select a random set from the available sets (preferably with nice images)
    // Focus on the newer sets which typically have better images
    const recentSets = sets.slice(0, 20); // Get more recent sets
    const randomSet = recentSets[Math.floor(Math.random() * recentSets.length)];
    
    // Fetch cards from the selected set
    const setCards = await fetchSetCards(randomSet.id);
    
    if (setCards.length === 0) {
      throw new Error(`No cards available in set ${randomSet.id}`);
    }
    
    // Shuffle the cards and select the requested count
    const shuffled = [...setCards].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  } catch (error) {
    console.error("Error fetching random cards:", error);
    // Return empty array instead of throwing to handle this gracefully in the UI
    return [];
  }
}
