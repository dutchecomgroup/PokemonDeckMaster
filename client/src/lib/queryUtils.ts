/**
 * Centralized query utility functions for consistent data handling across the application
 * This ensures all components use the same patterns for data fetching and cache management
 */

import { queryClient } from './queryClient';

// Query key definitions for consistent cache management
export const QUERY_KEYS = {
  // User data
  USER: ['/api/user'],
  USER_SESSION: ['user-session'],
  
  // Collection data (with optional filters)
  COLLECTIONS: (filters?: string[]) => ['/api/collections', 'user-session', ...(filters || [])],
  COLLECTION_CARDS: (filters?: string[]) => ['/api/collection-cards', 'user-session', ...(filters || [])],
  COLLECTION_BY_ID: (id: number) => ['/api/collections', id, 'user-session'],
  
  // Card data
  CARDS_BY_SET: (setId: string) => ['/api/sets', setId, 'cards'],
  CARD_DETAILS: (cardId: string) => ['/api/cards', cardId],
  
  // Statistics
  GLOBAL_STATS: ['/api/stats'],
  USER_STATS: ['/api/user-stats', 'user-session'],
  
  // Other
  SEARCH_RESULTS: (query: string) => ['/api/search', query],
};

/**
 * Force refresh user data and all user-related collections
 * Use this after login/logout and any significant user data change
 */
export function refreshUserSessionData() {
  // First remove all session-dependent queries from the cache
  queryClient.removeQueries({ queryKey: ['user-session'] });
  
  // Then invalidate specific queries to trigger refetches
  queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USER });
  queryClient.invalidateQueries({ queryKey: QUERY_KEYS.COLLECTIONS() });
  queryClient.invalidateQueries({ queryKey: QUERY_KEYS.COLLECTION_CARDS() });
  queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USER_STATS });
}

/**
 * Update collection data after a write operation (create/update/delete)
 */
export function refreshCollectionData(collectionId?: number) {
  // Invalidate all collection listings
  queryClient.invalidateQueries({ queryKey: QUERY_KEYS.COLLECTIONS() });
  
  // If specific collection ID provided, also invalidate that collection
  if (collectionId) {
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.COLLECTION_BY_ID(collectionId) });
  }
}

/**
 * Update card data after adding/removing/updating cards in collections
 */
export function refreshCardData(collectionId?: number) {
  // Always refresh all collection cards to ensure consistency
  queryClient.invalidateQueries({ queryKey: QUERY_KEYS.COLLECTION_CARDS() });
  
  // Also refresh statistics which depend on card data
  queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USER_STATS });
}

/**
 * Get standard query options for consistent cache behavior
 * These settings provide a good balance of responsiveness and data freshness
 */
export function getStandardQueryOptions() {
  return {
    retry: 1,
    staleTime: 30000, // Consider data stale after 30 seconds
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchOnReconnect: true,
  };
}

/**
 * Get query options for data that should always be fresh
 * Use for critical user data that must never be stale
 */
export function getCriticalDataQueryOptions() {
  return {
    retry: 2,
    staleTime: 0, // Always consider stale (always refetch)
    gcTime: 60000, // Only keep in cache for 1 minute
    refetchOnWindowFocus: true,
    refetchOnMount: 'always' as const,
    refetchOnReconnect: true,
  };
}

/**
 * Background data refresh strategy that doesn't disrupt the UI
 * @param refreshFn The function to call to refresh data
 * @param delay Optional delay in ms before refreshing (default: 2000ms)
 */
export function scheduleBackgroundRefresh(refreshFn: () => Promise<any>, delay = 2000) {
  setTimeout(() => {
    refreshFn().catch(error => console.error("Background refresh failed:", error));
  }, delay);
}