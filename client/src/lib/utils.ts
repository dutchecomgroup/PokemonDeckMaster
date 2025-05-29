import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combines multiple class values into a single string
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a date string to a localized date representation
 */
export function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('default', { 
      month: '2-digit', 
      year: '2-digit' 
    }).format(date);
  } catch {
    return 'N/A';
  }
}

/**
 * Creates a debounced function that delays invoking func until after wait milliseconds
 * have elapsed since the last time the debounced function was invoked.
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  
  return function(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    
    if (timeout !== null) {
      clearTimeout(timeout);
    }
    
    timeout = setTimeout(later, wait);
  };
}

/**
 * Transforms a rarity string into a CSS class name
 */
export function getRarityClass(rarity: string): string {
  if (!rarity) return '';
  
  // Remove spaces and special characters, make camelCase
  const normalized = rarity
    .replace(/\s+/g, '')
    .replace(/[^a-zA-Z0-9]/g, '');

  // Handle common rarity names
  const rarityMap: { [key: string]: string } = {
    'Common': 'rarity-common',
    'Uncommon': 'rarity-uncommon',
    'Rare': 'rarity-rare',
    'RareHolo': 'rarity-rareHolo',
    'RareUltra': 'rarity-rareUltra',
    'RareHoloEX': 'rarity-rareHoloEX',
    'RareHoloGX': 'rarity-rareHoloGX',
    'RareHoloV': 'rarity-rareHoloV',
    'RareHoloVMAX': 'rarity-rareHoloVMAX',
    'RareHoloVSTAR': 'rarity-rareHoloVSTAR',
    'RareSecret': 'rarity-rareSecret',
    'AmazingRare': 'rarity-amazingRare',
    'IllustrationRare': 'rarity-illustrationRare',
    'UltraRare': 'rarity-rareUltra',
    'SecretRare': 'rarity-rareSecret',
  };

  return rarityMap[normalized] || 'rarity-common';
}

/**
 * Gets the CSS class for a Pokémon card type
 */
export function getTypeClass(type: string): string {
  if (!type) return 'type-colorless';
  
  const normalized = type.toLowerCase();
  const typeMap: { [key: string]: string } = {
    'colorless': 'type-colorless',
    'darkness': 'type-darkness',
    'dragon': 'type-dragon',
    'fairy': 'type-fairy',
    'fighting': 'type-fighting',
    'fire': 'type-fire',
    'grass': 'type-grass',
    'lightning': 'type-lightning',
    'metal': 'type-metal',
    'psychic': 'type-psychic',
    'water': 'type-water'
  };

  return typeMap[normalized] || 'type-colorless';
}

/**
 * Gets the SVG icon for a Pokémon energy type
 */
export function getTypeIcon(type: string): string {
  if (!type) return '';
  
  const normalized = type.toLowerCase();
  
  // SVG paths for energy symbols
  switch (normalized) {
    case 'colorless':
      return `<svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="10" fill="#A8A8A8" />
        <path d="M12 4L14.5 9.5L20.5 10.5L16 14.5L17.5 20.5L12 17.5L6.5 20.5L8 14.5L3.5 10.5L9.5 9.5L12 4Z" fill="#E0E0E0" />
      </svg>`;
    case 'darkness':
      return `<svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="10" fill="#2D2A36" />
        <path d="M12 5C8.13 5 5 8.13 5 12C5 15.87 8.13 19 12 19C15.87 19 19 15.87 19 12C19 8.13 15.87 5 12 5ZM12 17C9.24 17 7 14.76 7 12C7 9.24 9.24 7 12 7C14.76 7 17 9.24 17 12C17 14.76 14.76 17 12 17Z" fill="#63587F" />
      </svg>`;
    case 'dragon':
      return `<svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="10" fill="#7860E1" />
        <path d="M17.5 8.5L14 12L17.5 15.5L14 19H10L6.5 15.5L10 12L6.5 8.5L10 5H14L17.5 8.5Z" fill="#A08BE8" />
      </svg>`;
    case 'fairy':
      return `<svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="10" fill="#FB95B7" />
        <path d="M12 4L14 8H18L15 12L18 16H14L12 20L10 16H6L9 12L6 8H10L12 4Z" fill="#FFC9D8" />
      </svg>`;
    case 'fighting':
      return `<svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="10" fill="#A53D26" />
        <path d="M7 8H17V16H7V8Z" fill="#D26D4C" />
      </svg>`;
    case 'fire':
      return `<svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="10" fill="#E24C34" />
        <path d="M12 4C12 4 13 8 16 10C19 12 14 17 12 20C12 20 11 16 8 14C5 12 10 7 12 4Z" fill="#F8C866" />
      </svg>`;
    case 'grass':
      return `<svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="10" fill="#4A9C5E" />
        <path d="M12 4L18 12L12 20L6 12L12 4Z" fill="#6BBE7C" />
      </svg>`;
    case 'lightning':
      return `<svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="10" fill="#F8D02F" />
        <path d="M13 4L8 13H11L9 20L16 10H12L13 4Z" fill="#F4E388" />
      </svg>`;
    case 'metal':
      return `<svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="10" fill="#6D7C8D" />
        <path d="M12 5L17 12L12 19L7 12L12 5Z" fill="#A5AEBD" />
      </svg>`;
    case 'psychic':
      return `<svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="10" fill="#DC457C" />
        <path d="M12 5C9.5 5 7.5 7 7.5 9.5C7.5 12 9.5 14 12 14C14.5 14 16.5 12 16.5 9.5M12 14L12 19" stroke="#F8A9C3" stroke-width="2" fill="none" />
      </svg>`;
    case 'water':
      return `<svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="10" fill="#2995D9" />
        <path d="M12 5C12 5 16 9 16 12C16 15 14 17 12 17C10 17 8 15 8 12C8 9 12 5 12 5Z" fill="#5CBAE7" />
      </svg>`;
    default:
      return `<svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="10" fill="#A8A8A8" />
        <path d="M12 4L14.5 9.5L20.5 10.5L16 14.5L17.5 20.5L12 17.5L6.5 20.5L8 14.5L3.5 10.5L9.5 9.5L12 4Z" fill="#E0E0E0" />
      </svg>`;
  }
}

/**
 * Sort cards by different criteria
 */
export function sortCards(cards: any[], sortBy: string) {
  const sortedCards = [...cards];
  
  switch (sortBy) {
    case 'number_asc':
      return sortedCards.sort((a, b) => parseInt(a.number) - parseInt(b.number));
    case 'number_desc':
      return sortedCards.sort((a, b) => parseInt(b.number) - parseInt(a.number));
    case 'name_asc':
      return sortedCards.sort((a, b) => a.name.localeCompare(b.name));
    case 'name_desc':
      return sortedCards.sort((a, b) => b.name.localeCompare(a.name));
    case 'rarity_asc':
      return sortedCards.sort((a, b) => (a.rarity || '').localeCompare(b.rarity || ''));
    case 'rarity_desc':
      return sortedCards.sort((a, b) => (b.rarity || '').localeCompare(a.rarity || ''));
    default:
      return sortedCards;
  }
}

/**
 * Generate a unique ID
 */
export function generateId() {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}
