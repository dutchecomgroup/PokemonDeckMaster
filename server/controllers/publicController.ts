import { db } from '../db';
import { appSettings } from '@shared/schema';
import { eq, count, sql } from 'drizzle-orm';
import { Request, Response } from 'express';

// Controller to check if registration is enabled
export const getRegistrationStatus = async (req: Request, res: Response) => {
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
};

// Controller to get public stats
export const getPublicStats = async (req: Request, res: Response) => {
  try {
    // Query for total users
    const userCountResult = await db.select({ count: count() }).from('users');
    const totalUsers = userCountResult[0]?.count || 0;
    
    // Query for total collections
    const collectionCountResult = await db.select({ count: count() }).from('collections');
    const totalCollections = collectionCountResult[0]?.count || 0;
    
    // Query for total cards
    const cardCountResult = await db.select({ count: count() }).from('collection_cards');
    const totalCards = cardCountResult[0]?.count || 0;
    
    return res.json({
      totalUsers,
      totalCollections,
      totalCards
    });
  } catch (error) {
    console.error('Error getting public stats:', error);
    return res.status(500).json({ message: 'Failed to get stats' });
  }
};