import express from 'express';
import { searchCards } from '../client/src/api/pokemonTCG';

export function setupSearchRoutes(app: express.Express) {
  // Direct search endpoint that works with our new SearchResults page
  app.get('/api/search', async (req, res) => {
    try {
      const { query, type, rarity, set, page = '1', pageSize = '20' } = req.query;
      
      // Convert query parameters to the correct types
      const searchQuery = query as string || '';
      const typeFilter = type ? [type as string] : [];
      const rarityFilter = rarity as string || '';
      const setFilter = set as string || '';
      const pageNumber = parseInt(page as string, 10);
      const pageSizeNumber = parseInt(pageSize as string, 10);
      
      console.log('Search API request:', { 
        query: searchQuery, 
        types: typeFilter, 
        rarity: rarityFilter,
        set: setFilter,
        page: pageNumber,
        pageSize: pageSizeNumber
      });
      
      // Make the actual search call to the Pokemon TCG API
      const results = await searchCards(
        searchQuery,
        typeFilter,
        rarityFilter,
        pageNumber, 
        pageSizeNumber,
        setFilter
      );
      
      res.json({
        results: results.data || [],
        total: results.totalCount || 0,
        page: pageNumber,
        pageSize: pageSizeNumber
      });
      
    } catch (error) {
      console.error('Search API error:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      res.status(500).json({ error: 'Search failed', details: errorMessage });
    }
  });
}