import { 
  type User, type InsertUser, type InsertOAuthUser,
  type Collection, type InsertCollection,
  type CollectionCard, type InsertCollectionCard,
  type CardPhoto, type InsertCardPhoto,
  type Favorite, type InsertFavorite,
  type AppSetting, type InsertAppSetting,
  users, collections, collectionCards, cardPhotos, favorites, appSettings
} from "@shared/schema";
import { db, pool } from './db';
import { eq, and, sql } from 'drizzle-orm';
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';

const PostgresSessionStore = connectPgSimple(session);

export interface StatsResult {
  totalUsers: number;
  totalCards: number;
  totalCollections: number;
}

export interface IStorage {
  // Session store for authentication
  sessionStore: session.Store;
  
  // Public statistics
  getPublicStats(): Promise<StatsResult>;
  
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByOAuthId(provider: string, providerId: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  createOAuthUser(user: InsertOAuthUser): Promise<User>;
  linkOAuthProvider(userId: number, provider: string, providerId: string, providerData: any): Promise<User>;
  
  // Collection methods
  getCollection(id: number): Promise<Collection | undefined>;
  getCollectionsByUserId(userId: number): Promise<Collection[]>;
  createCollection(collection: InsertCollection): Promise<Collection>;
  deleteCollection(id: number): Promise<void>;
  
  // Collection cards methods
  getCollectionCards(collectionId: number): Promise<CollectionCard[]>;
  getCollectionCard(collectionId: number, cardId: string): Promise<CollectionCard | undefined>;
  getCollectionCardById(id: number): Promise<CollectionCard | undefined>;
  addCardToCollection(card: InsertCollectionCard): Promise<CollectionCard>;
  updateCardQuantity(collectionId: number, cardId: string, quantity: number): Promise<CollectionCard>;
  removeCardFromCollection(collectionId: number, cardId: string): Promise<void>;
  
  // Card photos methods
  getCardPhotoById(id: number): Promise<CardPhoto | undefined>;
  getCardPhotosByCollectionCardId(collectionCardId: number): Promise<CardPhoto[]>;
  createCardPhoto(photo: InsertCardPhoto): Promise<CardPhoto>;
  updateCardPhoto(id: number, data: Partial<CardPhoto>): Promise<CardPhoto>;
  deleteCardPhoto(id: number): Promise<void>;

  // Favorites methods
  getFavorites(userId: number): Promise<Favorite[]>;
  getFavorite(userId: number, cardId: string): Promise<Favorite | undefined>;
  addFavorite(favorite: InsertFavorite): Promise<Favorite>;
  removeFavorite(userId: number, cardId: string): Promise<void>;

  // App settings methods
  getAppSetting(key: string): Promise<AppSetting | undefined>;
  setAppSetting(setting: InsertAppSetting): Promise<AppSetting>;
  updateAppSetting(key: string, value: any): Promise<AppSetting>;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;
  
  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      tableName: 'user_sessions',
      createTableIfMissing: false // Don't try to create the table to avoid conflicts
    });
  }
  
  // Get public statistics for the app
  async getPublicStats(): Promise<StatsResult> {
    try {
      // Use proper Drizzle queries instead of raw SQL
      const usersCount = await db.select({ count: sql`count(*)` }).from(users);
      const collectionsCount = await db.select({ count: sql`count(*)` }).from(collections);
      const cardsCount = await db.select({ count: sql`coalesce(sum(quantity), 0)` }).from(collectionCards);
      
      // Return the statistics with proper parsing
      return {
        totalUsers: Number(usersCount[0]?.count || 0),
        totalCollections: Number(collectionsCount[0]?.count || 0),
        totalCards: Number(cardsCount[0]?.count || 0)
      };
    } catch (error) {
      console.error("Error fetching public stats:", error);
      // Return default values if there's an error
      return {
        totalUsers: 0,
        totalCollections: 0,
        totalCards: 0
      };
    }
  }
  
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }
  
  async getUserByOAuthId(provider: string, providerId: string): Promise<User | undefined> {
    const [user] = await db.select()
      .from(users)
      .where(
        and(
          eq(users.provider, provider),
          eq(users.providerId, providerId)
        )
      );
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values({
      ...insertUser,
      provider: insertUser.provider || 'local' // Set default provider for regular users
    }).returning();
    return user;
  }
  
  async updateUser(id: number, userData: Partial<User>): Promise<User> {
    const [updatedUser] = await db.update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    
    return updatedUser;
  }
  
  async createOAuthUser(userData: InsertOAuthUser): Promise<User> {
    // Check if this is the first user, if so make them an admin
    const allUsers = await this.getAllUsers();
    const isFirstUser = allUsers.length === 0;
    
    const [user] = await db.insert(users).values({
      ...userData,
      role: isFirstUser ? 'admin' : 'user',
    }).returning();
    
    return user;
  }
  
  async linkOAuthProvider(userId: number, provider: string, providerId: string, providerData: any): Promise<User> {
    const [updatedUser] = await db.update(users)
      .set({
        provider,
        providerId,
        providerData,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId))
      .returning();
      
    return updatedUser;
  }

  // Collection methods
  async getCollection(id: number): Promise<Collection | undefined> {
    const [collection] = await db.select().from(collections).where(eq(collections.id, id));
    return collection;
  }

  async getCollectionsByUserId(userId: number): Promise<Collection[]> {
    console.log(`Storage: Fetching collections for user ${userId}`);
    const startTime = Date.now();
    
    try {
      const userCollections = await db.select().from(collections).where(eq(collections.userId, userId));
      
      const endTime = Date.now();
      console.log(`Storage: Fetched ${userCollections.length} collections for user ${userId} in ${endTime - startTime}ms`);
      
      return userCollections;
    } catch (error) {
      console.error(`Storage: Error fetching collections for user ${userId}:`, error);
      throw error;
    }
  }

  async createCollection(insertCollection: any): Promise<Collection> {
    console.log('Storage creating collection with data:', insertCollection);
    const [collection] = await db.insert(collections).values(insertCollection).returning();
    return collection;
  }

  async deleteCollection(id: number): Promise<void> {
    // The cascade delete will handle removing the collection cards
    await db.delete(collections).where(eq(collections.id, id));
  }

  async updateCollection(collection: Collection): Promise<Collection> {
    console.log('Storage updating collection:', collection);
    const { id, ...updateData } = collection;
    
    const [updatedCollection] = await db.update(collections)
      .set({
        ...updateData,
        updatedAt: new Date()
      })
      .where(eq(collections.id, id))
      .returning();
      
    return updatedCollection;
  }

  // Remove remaining duplicate functions
  
  // Collection cards methods
  async getCollectionCards(collectionId: number): Promise<CollectionCard[]> {
    console.log(`Storage: Fetching cards for collection ${collectionId}`);
    const startTime = Date.now();
    
    try {
      const cards = await db.select()
        .from(collectionCards)
        .where(eq(collectionCards.collectionId, collectionId));
      
      const endTime = Date.now();
      console.log(`Storage: Fetched ${cards.length} cards for collection ${collectionId} in ${endTime - startTime}ms`);
      
      return cards;
    } catch (error) {
      console.error(`Storage: Error fetching cards for collection ${collectionId}:`, error);
      throw error;
    }
  }

  async getCollectionCard(collectionId: number, cardId: string): Promise<CollectionCard | undefined> {
    console.log(`Storage: Checking if card ${cardId} exists in collection ${collectionId}`);
    const [card] = await db.select()
      .from(collectionCards)
      .where(
        and(
          eq(collectionCards.collectionId, collectionId),
          eq(collectionCards.cardId, cardId)
        )
      );
    
    if (card) {
      console.log(`Storage: Found existing card in collection with quantity ${card.quantity}`);
    } else {
      console.log(`Storage: Card not found in collection ${collectionId}`);
    }
    
    return card;
  }

  async getCollectionCardById(id: number): Promise<CollectionCard | undefined> {
    const [card] = await db.select()
      .from(collectionCards)
      .where(eq(collectionCards.id, id));
    return card;
  }

  async addCardToCollection(card: InsertCollectionCard): Promise<CollectionCard> {
    console.log(`Storage: Adding card ${card.cardId} to collection ${card.collectionId} with quantity ${card.quantity || 1}`);
    
    // Check if the card already exists in the collection
    const existingCard = await this.getCollectionCard(card.collectionId, card.cardId);
    
    if (existingCard) {
      console.log(`Storage: Card already exists, updating quantity from ${existingCard.quantity} to ${existingCard.quantity + (card.quantity || 1)}`);
      
      // Update the quantity
      return await this.updateCardQuantity(
        existingCard.collectionId, 
        existingCard.cardId,
        existingCard.quantity + (card.quantity || 1)
      );
    }
    
    console.log(`Storage: Adding new card to collection`);
    // Otherwise insert a new card
    const [newCard] = await db.insert(collectionCards).values({
      ...card,
      quantity: card.quantity || 1
    }).returning();
    
    console.log(`Storage: New card added with ID ${newCard.id} and quantity ${newCard.quantity}`);
    return newCard;
  }

  async updateCardQuantity(collectionId: number, cardId: string, quantity: number): Promise<CollectionCard> {
    console.log(`Storage: Updating card ${cardId} quantity to ${quantity} in collection ${collectionId}`);
    
    // Ensure quantity is at least 1
    const finalQuantity = Math.max(1, quantity);
    
    try {
      const [updatedCard] = await db.update(collectionCards)
        .set({ 
          quantity: finalQuantity,
          updatedAt: new Date()
        })
        .where(
          and(
            eq(collectionCards.collectionId, collectionId),
            eq(collectionCards.cardId, cardId)
          )
        )
        .returning();
      
      if (!updatedCard) {
        console.error(`Storage: Failed to update card quantity - card not found or not updated`);
        throw new Error('Card not found in collection');
      }
      
      console.log(`Storage: Successfully updated card quantity to ${updatedCard.quantity}`);
      return updatedCard;
    } catch (error) {
      console.error(`Storage: Error updating card quantity:`, error);
      throw error;
    }
  }

  async removeCardFromCollection(collectionId: number, cardId: string): Promise<void> {
    console.log(`Storage: Removing card ${cardId} from collection ${collectionId}`);
    
    try {
      // First verify the card exists in the collection
      const existingCard = await this.getCollectionCard(collectionId, cardId);
      if (!existingCard) {
        console.log(`Card ${cardId} not found in collection ${collectionId}, nothing to delete`);
        return;
      }
      
      console.log(`Found card to delete:`, existingCard);
      
      // Skip photo deletion - the card_photos table doesn't exist yet
      // We'll implement this later when the table is created
      console.log(`Skipping photo deletion as the card_photos table doesn't exist yet`);
      // Uncomment this code when card_photos table is created
      /*
      const photos = await this.getCardPhotosByCollectionCardId(existingCard.id);
      if (photos && photos.length > 0) {
        console.log(`Deleting ${photos.length} photos associated with collection card ${existingCard.id}`);
        for (const photo of photos) {
          await db.delete(cardPhotos).where(eq(cardPhotos.id, photo.id));
        }
      }
      */
      
      // Now delete the card itself
      const result = await db.delete(collectionCards)
        .where(
          and(
            eq(collectionCards.collectionId, collectionId),
            eq(collectionCards.cardId, cardId)
          )
        );
      
      // Verify deletion was successful
      const afterDelete = await this.getCollectionCard(collectionId, cardId);
      if (afterDelete) {
        console.error(`Failed to delete card ${cardId} from collection ${collectionId}, card still exists`);
        throw new Error(`Failed to delete card ${cardId} from collection ${collectionId}`);
      }
      
      console.log(`Card ${cardId} successfully deleted from collection ${collectionId}`);
    } catch (error) {
      console.error(`Error deleting card ${cardId} from collection ${collectionId}:`, error);
      throw error;
    }
  }

  // Card photos methods
  async getCardPhotoById(id: number): Promise<CardPhoto | undefined> {
    const [photo] = await db.select().from(cardPhotos).where(eq(cardPhotos.id, id));
    return photo;
  }

  async getCardPhotosByCollectionCardId(collectionCardId: number): Promise<CardPhoto[]> {
    return await db.select()
      .from(cardPhotos)
      .where(eq(cardPhotos.collectionCardId, collectionCardId));
  }

  async createCardPhoto(photo: InsertCardPhoto): Promise<CardPhoto> {
    const [newPhoto] = await db.insert(cardPhotos).values(photo).returning();
    return newPhoto;
  }

  async updateCardPhoto(id: number, data: Partial<CardPhoto>): Promise<CardPhoto> {
    const [updatedPhoto] = await db.update(cardPhotos)
      .set({
        ...data,
        uploadedAt: new Date()
      })
      .where(eq(cardPhotos.id, id))
      .returning();
    
    return updatedPhoto;
  }

  async deleteCardPhoto(id: number): Promise<void> {
    await db.delete(cardPhotos).where(eq(cardPhotos.id, id));
  }

  // Favorites methods
  async getFavorites(userId: number): Promise<Favorite[]> {
    return await db.select().from(favorites).where(eq(favorites.userId, userId));
  }

  async getFavorite(userId: number, cardId: string): Promise<Favorite | undefined> {
    const [favorite] = await db.select()
      .from(favorites)
      .where(
        and(
          eq(favorites.userId, userId),
          eq(favorites.cardId, cardId)
        )
      );
    return favorite;
  }

  async addFavorite(favorite: InsertFavorite): Promise<Favorite> {
    // Check if already favorited
    const existingFavorite = await this.getFavorite(favorite.userId, favorite.cardId);
    if (existingFavorite) return existingFavorite;
    
    const [newFavorite] = await db.insert(favorites).values(favorite).returning();
    return newFavorite;
  }

  async removeFavorite(userId: number, cardId: string): Promise<void> {
    await db.delete(favorites)
      .where(
        and(
          eq(favorites.userId, userId),
          eq(favorites.cardId, cardId)
        )
      );
  }

  // App settings methods
  async getAppSetting(key: string): Promise<AppSetting | undefined> {
    const [setting] = await db.select().from(appSettings).where(eq(appSettings.key, key));
    return setting;
  }

  async setAppSetting(setting: InsertAppSetting): Promise<AppSetting> {
    // Check if setting exists
    const existingSetting = await this.getAppSetting(setting.key);
    
    if (existingSetting) {
      // Update existing setting
      return await this.updateAppSetting(setting.key, setting.value);
    }
    
    // Insert new setting
    const [newSetting] = await db.insert(appSettings).values(setting).returning();
    return newSetting;
  }

  async updateAppSetting(key: string, value: any): Promise<AppSetting> {
    const [updatedSetting] = await db.update(appSettings)
      .set({ 
        value,
        updatedAt: new Date()
      })
      .where(eq(appSettings.key, key))
      .returning();
    
    return updatedSetting;
  }
}

export const storage = new DatabaseStorage();