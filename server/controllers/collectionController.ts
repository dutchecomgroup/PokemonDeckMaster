import { Request, Response } from 'express';
import { db } from '../db';
import { collections } from '@shared/schema';
import { eq } from 'drizzle-orm';

// Create new collection
export const createCollection = async (req: Request, res: Response) => {
  try {
    console.log("Creating collection with user:", req.user);
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(400).json({ message: "User ID not found" });
    }
    
    console.log("User ID for collection creation:", userId, "type:", typeof userId);
    
    const { name, description, language } = req.body;
    
    // Create the collection using Drizzle's standard insert method
    const [collection] = await db.insert(collections).values({
      name,
      description: description || null,
      language: language || 'english',
      userId: Number(userId) // This maps to user_id in the database
    }).returning();
    
    console.log("Collection created successfully:", collection);
    
    res.status(201).json(collection);
  } catch (error) {
    console.error("Error creating collection:", error);
    res.status(500).json({ message: "Failed to create collection", error: String(error) });
  }
};

// Get all collections for logged-in user
export const getUserCollections = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(400).json({ message: "User ID not found" });
    }
    
    const userCollections = await db.select().from(collections).where(eq(collections.userId, userId));
    
    res.json(userCollections);
  } catch (error) {
    console.error("Error fetching collections:", error);
    res.status(500).json({ message: "Failed to fetch collections" });
  }
};