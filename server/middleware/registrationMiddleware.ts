import { Request, Response, NextFunction } from 'express';
import { db } from '../db';
import { appSettings } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { storage } from '../storage';

/**
 * Middleware to check if registration is enabled in app settings
 * The first user can always register (to set up admin account)
 */
export const checkRegistrationEnabled = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get all users to check if this is the first user
    const allUsers = await storage.getAllUsers();
    const isFirstUser = allUsers.length === 0;
    
    // First user can always register (to set up admin account)
    if (isFirstUser) {
      return next();
    }
    
    // Check if registration is enabled in settings
    const settings = await db.select()
      .from(appSettings)
      .where(eq(appSettings.key, 'users.registrationEnabled'));
    
    // Get the registration setting value (default to true if not set)
    // Need to handle multiple formats as settings can be stored in different ways
    console.log('Raw registration setting:', settings[0]?.value);
    console.log('Type of setting:', typeof settings[0]?.value);
    
    let registrationEnabled = true; // Default to true if not set
    
    if (settings.length > 0) {
      const settingValue = settings[0].value;
      // Convert the setting to string for comparison
      const valueStr = String(settingValue).toLowerCase();
      // Setting is enabled only if it's explicitly "true"
      registrationEnabled = valueStr === 'true';
    }
    
    console.log('Final registration enabled status:', registrationEnabled);
    
    if (!registrationEnabled) {
      return res.status(403).json({ 
        message: 'Registration is currently disabled by the administrator' 
      });
    }
    
    next();
  } catch (error) {
    console.error('Error checking registration status:', error);
    res.status(500).json({ message: 'Server error checking registration status' });
  }
};