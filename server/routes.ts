import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import cardPhotoRoutes from "./routes/cardPhotoRoutes";
import adminRoutes from "./routes/adminRoutes";

// Setup multer for file uploads
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});
import { storage } from "./storage";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import { 
  insertCollectionSchema, 
  insertCollectionCardSchema,
  insertUserSchema,
  loginSchema,
  insertFavoriteSchema,
  collections,
  appSettings
} from "@shared/schema";
import { db, pool } from "./db";
import { sql, eq } from "drizzle-orm";
import { setupAuth } from "./auth";
import { setupSearchRoutes } from "./searchRoutes";
import { recognizePokemonCard } from "./openai";
import fs from "fs";
import path from "path";

export async function registerRoutes(app: Express): Promise<Server> {
  // Create uploads directory if it doesn't exist
  const uploadsDir = path.resolve('./uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  
  // Set up authentication with Passport
  setupAuth(app);
  
  // Set up search routes
  setupSearchRoutes(app);
  
  // Register card photo routes
  app.use('/api/card-photos', cardPhotoRoutes);
  
  // Register admin routes
  app.use('/api/admin', adminRoutes);
  
  // Public endpoints for non-authenticated users
  app.get('/api/registration-status', async (req: Request, res: Response) => {
    try {
      const settings = await db.select()
        .from(appSettings)
        .where(eq(appSettings.key, 'users.registrationEnabled'));
      
      let registrationEnabled = true; // Default to true if not set
      
      if (settings.length > 0) {
        const settingValue = settings[0].value;
        // Convert the setting to string for comparison
        const valueStr = String(settingValue).toLowerCase();
        // Setting is enabled only if it's explicitly "true"
        registrationEnabled = valueStr === 'true';
      }
      
      console.log('Registration status check:', { enabled: registrationEnabled });
      return res.json({ enabled: registrationEnabled });
    } catch (error) {
      console.error('Error checking registration status:', error);
      return res.status(500).json({ message: 'Failed to check registration status' });
    }
  });
  
  // Public endpoint to get site stats
  app.get('/api/stats', async (req: Request, res: Response) => {
    try {
      // Get total users count
      const usersResult = await db.execute(sql`SELECT COUNT(*) FROM users`);
      const totalUsers = parseInt(usersResult.rows[0].count) || 0;
      
      // Get total collections count
      const collectionsResult = await db.execute(sql`SELECT COUNT(*) FROM collections`);
      const totalCollections = parseInt(collectionsResult.rows[0].count) || 0;
      
      // Get total cards count
      const cardsResult = await db.execute(sql`SELECT COUNT(*) FROM collection_cards`);
      const totalCards = parseInt(cardsResult.rows[0].count) || 0;
      
      return res.json({
        totalUsers,
        totalCollections,
        totalCards
      });
    } catch (error) {
      console.error('Error getting public stats:', error);
      return res.status(500).json({ message: 'Failed to get stats' });
    }
  });
  // Authentication check middleware
  const ensureAuthenticated = (req: Request, res: Response, next: NextFunction) => {
    if (req.isAuthenticated()) {
      return next();
    }
    res.status(401).json({ message: "Unauthorized - Please log in" });
  };
  
  // API for profile completion
  app.get('/api/check-username', async (req: Request, res: Response) => {
    try {
      const username = req.query.username as string;
      
      if (!username || username.length < 3) {
        return res.status(400).json({ 
          available: false, 
          message: "Username must be at least 3 characters long" 
        });
      }
      
      // Check if username already exists
      const existingUser = await storage.getUserByUsername(username);
      
      // If current user is checking their own username, it's available
      if (existingUser && req.user && existingUser.id === req.user.id) {
        return res.json({ available: true });
      }
      
      return res.json({ available: !existingUser });
    } catch (error) {
      console.error("Error checking username:", error);
      res.status(500).json({ message: "Failed to check username availability" });
    }
  });
  
  // Complete profile for OAuth users (set username and display name)
  app.post('/api/complete-profile', ensureAuthenticated, async (req: Request, res: Response) => {
    try {
      const { username, displayName } = req.body;
      
      if (!username) {
        return res.status(400).json({ message: "Username is required" });
      }
      
      // Check if username already exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser && existingUser.id !== req.user?.id) {
        return res.status(400).json({ message: "Username is already taken" });
      }
      
      // Update user profile
      const updatedUser = await storage.updateUser(req.user!.id, {
        username,
        displayName: displayName || req.user!.displayName,
        needsProfileCompletion: false,
        updatedAt: new Date()
      });
      
      // Return updated user without sensitive information
      const userResponse = { ...updatedUser } as any;
      if (userResponse.password) delete userResponse.password;
      
      res.json(userResponse);
    } catch (error) {
      console.error("Error completing profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });
  
  // Collections API

  app.get("/api/collections", ensureAuthenticated, async (req: Request, res: Response) => {
    try {
      // Get collections for the logged-in user
      const userId = req.user?.id;
      if (!userId) {
        return res.status(400).json({ message: "User ID not found" });
      }
      
      const collections = await storage.getCollectionsByUserId(Number(userId));
      res.json(collections);
    } catch (error) {
      console.error("Error fetching collections:", error);
      res.status(500).json({ message: "Failed to fetch collections" });
    }
  });

  app.get("/api/collections/:id", ensureAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid collection ID" });
      }
      
      const collection = await storage.getCollection(id);
      if (!collection) {
        return res.status(404).json({ message: "Collection not found" });
      }
      
      // Verify the collection belongs to the current user
      if (collection.userId !== req.user?.id) {
        return res.status(403).json({ message: "You don't have permission to access this collection" });
      }
      
      res.json(collection);
    } catch (error) {
      console.error("Error fetching collection:", error);
      res.status(500).json({ message: "Failed to fetch collection" });
    }
  });

  app.post("/api/collections", ensureAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(400).json({ message: "User ID not found" });
      }
      
      // Let the storage interface handle the collection creation with proper type conversion
      const { name, description, language } = req.body;
      
      const collectionData = { 
        name, 
        description: description || null,
        language: language || 'english',
        userId: Number(userId)
      };
      
      console.log("Creating collection with data:", collectionData);
      const collection = await storage.createCollection(collectionData);
      
      res.status(201).json(collection);
    } catch (error) {
      console.error("Error creating collection:", error);
      res.status(500).json({ message: "Failed to create collection", error: String(error) });
    }
  });

  app.put("/api/collections/:id", ensureAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid collection ID" });
      }
      
      // Verify the collection belongs to the current user
      const collection = await storage.getCollection(id);
      if (!collection) {
        return res.status(404).json({ message: "Collection not found" });
      }
      
      if (collection.userId !== req.user?.id) {
        return res.status(403).json({ message: "You don't have permission to modify this collection" });
      }
      
      // Extract data from request body
      const { name, description, language } = req.body;
      
      // Build the updated collection object
      const updatedCollection = {
        ...collection,
        name: name || collection.name,
        description: description !== undefined ? description : collection.description,
        language: language || collection.language,
        updatedAt: new Date()
      };
      
      // Update the collection in the database
      const result = await storage.updateCollection(updatedCollection);
      console.log("Collection updated:", result);
      
      res.status(200).json(result);
    } catch (error) {
      console.error("Error updating collection:", error);
      res.status(500).json({ message: "Failed to update collection" });
    }
  });

  app.delete("/api/collections/:id", ensureAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid collection ID" });
      }
      
      // Verify the collection belongs to the current user
      const collection = await storage.getCollection(id);
      if (!collection) {
        return res.status(404).json({ message: "Collection not found" });
      }
      
      if (collection.userId !== req.user?.id) {
        return res.status(403).json({ message: "You don't have permission to delete this collection" });
      }
      
      await storage.deleteCollection(id);
      res.status(200).json({ message: "Collection deleted successfully" });
    } catch (error) {
      console.error("Error deleting collection:", error);
      res.status(500).json({ message: "Failed to delete collection" });
    }
  });

  // Collection Cards API
  app.get("/api/collections/:id/cards", ensureAuthenticated, async (req: Request, res: Response) => {
    try {
      const collectionId = parseInt(req.params.id);
      if (isNaN(collectionId)) {
        return res.status(400).json({ message: "Invalid collection ID" });
      }
      
      // Verify the collection belongs to the current user
      const collection = await storage.getCollection(collectionId);
      if (!collection) {
        return res.status(404).json({ message: "Collection not found" });
      }
      
      if (collection.userId !== req.user?.id) {
        return res.status(403).json({ message: "You don't have permission to access this collection" });
      }
      
      const cards = await storage.getCollectionCards(collectionId);
      res.json(cards);
    } catch (error) {
      console.error("Error fetching collection cards:", error);
      res.status(500).json({ message: "Failed to fetch collection cards" });
    }
  });

  // POST: Add card to collection - REWRITTEN for bulletproof cross-device sync
  app.post("/api/collection-cards", ensureAuthenticated, async (req: Request, res: Response) => {
    const startTime = Date.now();
    let card = null;
    
    try {
      console.log(`[ADD CARD] Starting request for user ${req.user?.id}`);
      console.log(`[ADD CARD] Request body:`, req.body);
      
      // Validate input data
      const cardData = insertCollectionCardSchema.parse(req.body);
      console.log(`[ADD CARD] Validated data:`, cardData);
      
      // Verify the collection exists and belongs to current user
      const collection = await storage.getCollection(cardData.collectionId);
      if (!collection) {
        console.log(`[ADD CARD] Collection ${cardData.collectionId} not found`);
        return res.status(404).json({ message: "Collection not found" });
      }
      
      if (collection.userId !== req.user?.id) {
        console.log(`[ADD CARD] User ${req.user?.id} tried to access collection ${cardData.collectionId} owned by ${collection.userId}`);
        return res.status(403).json({ message: "You don't have permission to modify this collection" });
      }
      
      // Check if card already exists in collection before adding
      const existingCard = await storage.getCollectionCard(cardData.collectionId, cardData.cardId);
      if (existingCard) {
        console.log(`[ADD CARD] Card ${cardData.cardId} already exists in collection ${cardData.collectionId}, updating quantity`);
        // Update quantity instead of creating duplicate
        card = await storage.updateCardQuantity(
          existingCard.collectionId, 
          existingCard.cardId, 
          existingCard.quantity + (cardData.quantity || 1)
        );
      } else {
        console.log(`[ADD CARD] Adding new card ${cardData.cardId} to collection ${cardData.collectionId}`);
        // Add new card to collection
        card = await storage.addCardToCollection(cardData);
      }
      
      // Verify the card was actually saved to database
      const verifyCard = await storage.getCollectionCard(cardData.collectionId, cardData.cardId);
      if (!verifyCard) {
        console.error(`[ADD CARD] CRITICAL: Card was not saved to database!`);
        return res.status(500).json({ message: "Failed to save card to database" });
      }
      
      console.log(`[ADD CARD] Card successfully saved with ID ${verifyCard.id} and quantity ${verifyCard.quantity}`);
      
      // Return the verified card data
      const endTime = Date.now();
      console.log(`[ADD CARD] Request completed in ${endTime - startTime}ms`);
      res.status(201).json(verifyCard);
      
    } catch (error) {
      const endTime = Date.now();
      console.error(`[ADD CARD] Error after ${endTime - startTime}ms:`, error);
      
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      
      res.status(500).json({ message: "Failed to add card to collection" });
    }
  });

  app.put("/api/collection-cards/:cardId", ensureAuthenticated, async (req: Request, res: Response) => {
    try {
      const cardId = req.params.cardId;
      const collectionId = parseInt(req.body.collectionId);
      const quantity = parseInt(req.body.quantity);
      
      if (isNaN(collectionId) || isNaN(quantity) || !cardId) {
        return res.status(400).json({ message: "Invalid request parameters" });
      }
      
      // Verify the collection belongs to the current user
      const collection = await storage.getCollection(collectionId);
      if (!collection) {
        return res.status(404).json({ message: "Collection not found" });
      }
      
      if (collection.userId !== req.user?.id) {
        return res.status(403).json({ message: "You don't have permission to modify this collection" });
      }
      
      const updatedCard = await storage.updateCardQuantity(collectionId, cardId, quantity);
      res.json(updatedCard);
    } catch (error) {
      console.error("Error updating card quantity:", error);
      res.status(500).json({ message: "Failed to update card quantity" });
    }
  });

  // DELETE: Remove card from collection - REWRITTEN for bulletproof cross-device sync
  app.delete("/api/collection-cards/:collectionId/:cardId", ensureAuthenticated, async (req: Request, res: Response) => {
    const startTime = Date.now();
    
    try {
      const cardId = req.params.cardId;
      const collectionId = parseInt(req.params.collectionId);
      
      console.log(`[REMOVE CARD] Starting request for user ${req.user?.id}`);
      console.log(`[REMOVE CARD] Removing card ${cardId} from collection ${collectionId}`);
      
      if (isNaN(collectionId) || !cardId) {
        console.log(`[REMOVE CARD] Invalid parameters: collectionId=${collectionId}, cardId=${cardId}`);
        return res.status(400).json({ message: "Invalid request parameters" });
      }
      
      // Verify the collection exists and belongs to current user
      const collection = await storage.getCollection(collectionId);
      if (!collection) {
        console.log(`[REMOVE CARD] Collection ${collectionId} not found`);
        return res.status(404).json({ message: "Collection not found" });
      }
      
      if (collection.userId !== req.user?.id) {
        console.log(`[REMOVE CARD] User ${req.user?.id} tried to access collection ${collectionId} owned by ${collection.userId}`);
        return res.status(403).json({ message: "You don't have permission to modify this collection" });
      }
      
      // Check if the card exists in the collection before attempting removal
      const existingCard = await storage.getCollectionCard(collectionId, cardId);
      if (!existingCard) {
        console.log(`[REMOVE CARD] Card ${cardId} not found in collection ${collectionId}`);
        return res.status(404).json({ message: "Card not found in this collection" });
      }
      
      console.log(`[REMOVE CARD] Found existing card with quantity ${existingCard.quantity}`);
      
      // Remove the card from the collection
      await storage.removeCardFromCollection(collectionId, cardId);
      
      // Verify the card was actually removed from database
      const verifyRemoval = await storage.getCollectionCard(collectionId, cardId);
      if (verifyRemoval) {
        console.error(`[REMOVE CARD] CRITICAL: Card ${cardId} was not removed from collection ${collectionId}`);
        return res.status(500).json({ message: "Failed to remove card from collection" });
      }
      
      console.log(`[REMOVE CARD] Card successfully removed from collection ${collectionId}`);
      
      // Return success response
      const endTime = Date.now();
      console.log(`[REMOVE CARD] Request completed in ${endTime - startTime}ms`);
      res.status(200).json({ message: "Card removed from collection successfully" });
      
    } catch (error) {
      const endTime = Date.now();
      console.error(`[REMOVE CARD] Error after ${endTime - startTime}ms:`, error);
      res.status(500).json({ message: "Failed to remove card from collection" });
    }
  });

  // GET: Fetch collection cards - REWRITTEN for bulletproof cross-device sync
  app.get("/api/collection-cards", ensureAuthenticated, async (req: Request, res: Response) => {
    const startTime = Date.now();
    console.log(`[GET CARDS] Starting request for user ${req.user?.id}`);
    
    try {
      const userId = Number(req.user?.id);
      if (!userId) {
        console.log(`[GET CARDS] No user ID found in request`);
        return res.status(400).json({ message: "User ID not found" });
      }
      
      // If specific collection ID and card ID are provided, fetch that specific card
      if (req.query.collectionId && req.query.cardId) {
        const collectionId = parseInt(req.query.collectionId as string);
        const cardId = req.query.cardId as string;
        
        if (isNaN(collectionId)) {
          return res.status(400).json({ message: "Invalid collection ID" });
        }
        
        // Verify the collection belongs to the current user
        const collection = await storage.getCollection(collectionId);
        if (!collection) {
          return res.status(404).json({ message: "Collection not found" });
        }
        
        if (collection.userId !== userId) {
          return res.status(403).json({ message: "You don't have permission to access this collection" });
        }
        
        const card = await storage.getCollectionCard(collectionId, cardId);
        if (!card) {
          return res.status(404).json({ message: "Card not found in collection" });
        }
        
        return res.json(card);
      }
      
      // If only collection ID is provided, fetch all cards for that collection
      if (req.query.collectionId) {
        const collectionId = parseInt(req.query.collectionId as string);
        
        if (isNaN(collectionId)) {
          return res.status(400).json({ message: "Invalid collection ID" });
        }
        
        // Verify the collection belongs to the current user
        const collection = await storage.getCollection(collectionId);
        if (!collection) {
          return res.status(404).json({ message: "Collection not found" });
        }
        
        if (collection.userId !== userId) {
          return res.status(403).json({ message: "You don't have permission to access this collection" });
        }
        
        const cards = await storage.getCollectionCards(collectionId);
        
        const endTime = Date.now();
        console.log(`Fetched ${cards.length} cards for collection ${collectionId} in ${endTime - startTime}ms`);
        
        return res.json(cards);
      }
      
      // Get all collections for the user
      const userCollections = await storage.getCollectionsByUserId(userId);
      console.log(`User has ${userCollections.length} collections`);
      
      if (userCollections.length === 0) {
        console.log("User has no collections, returning empty array");
        return res.json([]);
      }
      
      // Get all cards from all user collections with optimized loading
      const allCards = [];
      for (const collection of userCollections) {
        const collectionCards = await storage.getCollectionCards(collection.id);
        allCards.push(...collectionCards);
      }
      
      const endTime = Date.now();
      console.log(`Fetched ${allCards.length} cards from ${userCollections.length} collections in ${endTime - startTime}ms`);
      
      // Return all cards from all collections
      res.json(allCards);
    } catch (error) {
      console.error("Error fetching collection cards:", error);
      res.status(500).json({ message: "Failed to fetch collection cards" });
    }
  });

  // Add a favorites route to allow users to favorite cards
  app.post("/api/favorites", ensureAuthenticated, async (req: Request, res: Response) => {
    try {
      const { cardId } = req.body;
      if (!cardId) {
        return res.status(400).json({ message: "Card ID is required" });
      }
      
      const userId = req.user?.id;
      if (!userId) {
        return res.status(400).json({ message: "User ID not found" });
      }
      
      // We'll add this method to storage later
      // const favorite = await storage.addFavorite({ userId, cardId });
      // res.status(201).json(favorite);
      
      // For now, just return a success message
      res.status(201).json({ message: "Card favorited successfully" });
    } catch (error) {
      console.error("Error adding favorite:", error);
      res.status(500).json({ message: "Failed to add favorite" });
    }
  });

  // Add an API endpoint for quick card search (for live search in sidebar)
  app.get("/api/search", async (req: Request, res: Response) => {
    try {
      const query = req.query.query as string;
      const limit = parseInt(req.query.limit as string) || 5;
      const partial = req.query.partial === 'true';
      
      if (!query || query.length < 3) {
        return res.status(400).json({ message: "Search query too short" });
      }
      
      // Call the Pokemon TCG API to search for cards
      // If partial is true, use a partial match query instead of exact match
      // This will find all variants of a Pokémon (e.g., all Pikachu cards)
      let apiUrl;
      if (partial) {
        apiUrl = `https://api.pokemontcg.io/v2/cards?q=name:*${encodeURIComponent(query)}*&pageSize=${limit}`;
      } else {
        apiUrl = `https://api.pokemontcg.io/v2/cards?q=name:"${encodeURIComponent(query)}"&pageSize=${limit}`;
      }
      
      const response = await fetch(apiUrl);
      const data = await response.json();
      
      res.json({ 
        results: data.data || [],
        total: data.totalCount || 0
      });
    } catch (error) {
      console.error("Error searching cards:", error);
      res.status(500).json({ message: "Failed to search cards" });
    }
  });

  // Mock Card Recognition endpoint - for backwards compatibility
  // Public statistics endpoint (no authentication required)
  app.get("/api/stats", async (req: Request, res: Response) => {
    try {
      const stats = await storage.getPublicStats();
      res.json(stats);
    } catch (error) {
      console.error('Error fetching public stats:', error);
      res.status(500).json({ message: 'Error fetching statistics' });
    }
  });
  
  app.post("/api/recognize-card", ensureAuthenticated, async (req: Request, res: Response) => {
    try {
      // Return a simple response instead of complex processing
      res.status(400).json({ 
        error: "Card recognition disabled", 
        message: "Card recognition feature is currently disabled due to technical limitations." 
      });
    } catch (error: any) {
      console.error("Error in card recognition:", error);
      res.status(500).json({ 
        error: "Failed to recognize card", 
        message: error.message || "An unknown error occurred during card recognition" 
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
