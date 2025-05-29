import { Request, Response } from 'express';
import { db } from '../db';
import { users, collections, collectionCards, appSettings } from '@shared/schema';
import { count, eq, sql, desc, asc, and, or } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';

// Middleware om te controleren of de gebruiker admin-rechten heeft
export const isAdmin = (req: Request, res: Response, next: Function) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: 'Niet geauthenticeerd' });
  }
  
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Geen toegang: admin rol vereist' });
  }
  
  next();
};

// Geeft overzicht statistieken voor het admin dashboard
export const getStatistics = async (req: Request, res: Response) => {
  try {
    const [totalUsersResult] = await db.select({ count: count() }).from(users);
    const [totalCollectionsResult] = await db.select({ count: count() }).from(collections);
    const [totalCardsResult] = await db.select({ count: count() }).from(collectionCards);
    
    // Voor actieve gebruikers: gebruikers die de afgelopen 30 dagen zijn ingelogd
    // Dit is een voorbeeld van een geavanceerde query die meer informatie nodig heeft dan we momenteel hebben
    // In een echte applicatie zou je een 'lastLogin' veld in de users tabel hebben
    const activeUsers = 0; // Placeholder
    
    res.status(200).json({
      totalUsers: totalUsersResult.count,
      totalCollections: totalCollectionsResult.count,
      totalCards: totalCardsResult.count,
      activeUsers
    });
  } catch (error) {
    console.error('Error getting admin statistics:', error);
    res.status(500).json({ message: 'Kon statistieken niet ophalen' });
  }
};

// Haalt alle gebruikers op
export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const allUsers = await db.select().from(users);
    
    // Verwijder wachtwoorden voor security redenen
    const safeUsers = allUsers.map(({ password, ...user }) => user);
    
    res.status(200).json(safeUsers);
  } catch (error) {
    console.error('Error getting all users:', error);
    res.status(500).json({ message: 'Kon gebruikers niet ophalen' });
  }
};

// Gebruiker bijwerken (inclusief rol wijzigen)
export const updateUser = async (req: Request, res: Response) => {
  const { id } = req.params;
  const userData = req.body;
  
  try {
    // Controleer of de huidige gebruiker niet zichzelf degradeert
    if (req.user && req.user.id === parseInt(id) && userData.role === 'user' && req.user.role === 'admin') {
      return res.status(403).json({ 
        message: 'Je kunt je eigen admin-rechten niet verwijderen' 
      });
    }
    
    const [updatedUser] = await db
      .update(users)
      .set(userData)
      .where(eq(users.id, parseInt(id)))
      .returning();
    
    if (!updatedUser) {
      return res.status(404).json({ message: 'Gebruiker niet gevonden' });
    }
    
    // Verwijder wachtwoord voor security redenen
    const { password, ...safeUser } = updatedUser;
    
    res.status(200).json(safeUser);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Kon gebruiker niet bijwerken' });
  }
};

// Specifiek de rol van een gebruiker wijzigen
export const updateUserRole = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { role } = req.body;
  
  try {
    // Controleer of de rol geldig is
    if (role !== 'admin' && role !== 'user') {
      return res.status(400).json({ message: 'Ongeldige rol. Moet "admin" of "user" zijn' });
    }
    
    // Controleer of de huidige gebruiker niet zichzelf degradeert
    if (req.user && req.user.id === parseInt(id) && role === 'user' && req.user.role === 'admin') {
      return res.status(403).json({ 
        message: 'Je kunt je eigen admin-rechten niet verwijderen' 
      });
    }
    
    const [updatedUser] = await db
      .update(users)
      .set({ role })
      .where(eq(users.id, parseInt(id)))
      .returning();
    
    if (!updatedUser) {
      return res.status(404).json({ message: 'Gebruiker niet gevonden' });
    }
    
    // Verwijder wachtwoord voor security redenen
    const { password, ...safeUser } = updatedUser;
    
    res.status(200).json(safeUser);
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({ message: 'Kon gebruikersrol niet bijwerken' });
  }
};

// Status van een gebruiker bijwerken (blokkeren/deblokkeren)
export const updateUserStatus = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;
  
  try {
    // Controleer of de status geldig is
    if (status !== 'active' && status !== 'blocked') {
      return res.status(400).json({ message: 'Ongeldige status. Moet "active" of "blocked" zijn' });
    }
    
    // Controleer of de huidige gebruiker niet zichzelf blokkeert
    if (req.user && req.user.id === parseInt(id)) {
      return res.status(403).json({ 
        message: 'Je kunt je eigen account niet blokkeren' 
      });
    }
    
    const [updatedUser] = await db
      .update(users)
      .set({ status })
      .where(eq(users.id, parseInt(id)))
      .returning();
    
    if (!updatedUser) {
      return res.status(404).json({ message: 'Gebruiker niet gevonden' });
    }
    
    // Verwijder wachtwoord voor security redenen
    const { password, ...safeUser } = updatedUser;
    
    res.status(200).json(safeUser);
  } catch (error) {
    console.error('Error updating user status:', error);
    res.status(500).json({ message: 'Kon gebruikersstatus niet bijwerken' });
  }
};

// Gebruiker verwijderen
export const deleteUser = async (req: Request, res: Response) => {
  const { id } = req.params;
  
  try {
    // Eerst alle collecties van deze gebruiker verwijderen
    // Door cascading delete worden ook alle gerelateerde collection_cards verwijderd
    await db
      .delete(collections)
      .where(eq(collections.userId, parseInt(id)));
    
    // Dan de gebruiker verwijderen
    const [deletedUser] = await db
      .delete(users)
      .where(eq(users.id, parseInt(id)))
      .returning();
    
    if (!deletedUser) {
      return res.status(404).json({ message: 'Gebruiker niet gevonden' });
    }
    
    res.status(200).json({ message: 'Gebruiker succesvol verwijderd' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Kon gebruiker niet verwijderen' });
  }
};

// Haal alle collecties op met basisinformatie
export const getAllCollections = async (req: Request, res: Response) => {
  try {
    // Haal alle collecties op met basis informatie
    const collectionsData = await db.select({
      id: collections.id,
      name: collections.name,
      description: collections.description,
      language: collections.language,
      userId: collections.userId,
      createdAt: collections.createdAt,
      updatedAt: collections.updatedAt
    }).from(collections);
    
    // Haal gebruikersinformatie op voor elke collectie
    const usersData = await db.select({
      id: users.id,
      username: users.username
    }).from(users);
    
    // Map gebruikers op id voor snelle lookup
    const usersMap = usersData.reduce((acc, user) => {
      acc[user.id] = user;
      return acc;
    }, {} as Record<number, { id: number, username: string }>);
    
    // Voor elke collectie, tel het aantal kaarten
    const collectionsWithCardCount = await Promise.all(
      collectionsData.map(async (collection) => {
        const [result] = await db
          .select({ count: count() })
          .from(collectionCards)
          .where(eq(collectionCards.collectionId, collection.id));
        
        return {
          ...collection,
          username: usersMap[collection.userId]?.username || 'Onbekend',
          cardCount: result.count
        };
      })
    );
    
    res.status(200).json(collectionsWithCardCount);
  } catch (error) {
    console.error('Error getting all collections:', error);
    res.status(500).json({ message: 'Kon collecties niet ophalen' });
  }
};

// Collectie verwijderen
export const deleteCollection = async (req: Request, res: Response) => {
  const { id } = req.params;
  
  try {
    // Collectie verwijderen (cascade delete zorgt ook voor verwijdering van collection_cards)
    const [deletedCollection] = await db
      .delete(collections)
      .where(eq(collections.id, parseInt(id)))
      .returning();
    
    if (!deletedCollection) {
      return res.status(404).json({ message: 'Collectie niet gevonden' });
    }
    
    res.status(200).json({ message: 'Collectie succesvol verwijderd' });
  } catch (error) {
    console.error('Error deleting collection:', error);
    res.status(500).json({ message: 'Kon collectie niet verwijderen' });
  }
};

// Standaardinstellingen voor de applicatie
const defaultSettings = {
  general: {
    siteName: 'TCG DeckMaster',
    siteDescription: 'Pokémon Trading Card Game Collection Manager',
    contactEmail: 'admin@tcgdeckmaster.com',
    language: 'nl',
    theme: 'light',
  },
  users: {
    registrationEnabled: true,
    defaultCollectionName: 'Mijn Collectie',
  },
  system: {
    apiEnabled: true,
    apiRateLimit: 100,
    maintenanceMode: false,
    maintenanceMessage: 'De website is tijdelijk offline voor onderhoud. Probeer het later opnieuw.',
  }
};

// Instellingen ophalen
export const getSettings = async (req: Request, res: Response) => {
  try {
    // Alle instellingen ophalen uit de database
    const settingsRecords = await db.select().from(appSettings);
    
    // Zet de instellingen om naar een samengevoegd object
    const settings = settingsRecords.reduce((result, record) => {
      const category = record.key.split('.')[0];
      const key = record.key.split('.')[1];
      
      if (!result[category]) {
        result[category] = {};
      }
      
      result[category][key] = record.value;
      return result;
    }, {} as Record<string, any>);
    
    // Als er geen instellingen zijn, gebruik de standaardinstellingen
    const mergedSettings = {
      general: { ...defaultSettings.general, ...(settings.general || {}) },
      users: { ...defaultSettings.users, ...(settings.users || {}) },
      system: { ...defaultSettings.system, ...(settings.system || {}) },
    };
    
    res.status(200).json(mergedSettings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ message: 'Kon instellingen niet ophalen' });
  }
};

// Instellingen bijwerken
export const updateSettings = async (req: Request, res: Response) => {
  try {
    const newSettings = req.body;
    
    // Valideer de instellingen
    if (!newSettings || typeof newSettings !== 'object') {
      return res.status(400).json({ message: 'Ongeldige instellingen' });
    }
    
    // Verwerk elke categorie instellingen
    for (const category of Object.keys(newSettings)) {
      const categorySettings = newSettings[category];
      
      if (typeof categorySettings !== 'object') continue;
      
      // Voor elke instelling in de categorie
      for (const [key, value] of Object.entries(categorySettings)) {
        const settingKey = `${category}.${key}`;
        
        // Controleer of de instelling al bestaat
        const [existingSetting] = await db
          .select()
          .from(appSettings)
          .where(eq(appSettings.key, settingKey));
        
        if (existingSetting) {
          // Update de bestaande instelling
          await db
            .update(appSettings)
            .set({ 
              value: value as any,
              updatedAt: new Date() 
            })
            .where(eq(appSettings.key, settingKey));
        } else {
          // Voeg een nieuwe instelling toe
          await db
            .insert(appSettings)
            .values({
              key: settingKey,
              value: value as any,
            });
        }
      }
    }
    
    res.status(200).json({ message: 'Instellingen bijgewerkt' });
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ message: 'Kon instellingen niet bijwerken' });
  }
};

// Get recent users for admin dashboard
export const getRecentUsers = async (req: Request, res: Response) => {
  try {
    // Get most recently registered users, limited to 10
    const recentUsers = await db
      .select({
        id: users.id,
        username: users.username,
        email: users.email,
        displayName: users.displayName,
        role: users.role,
        provider: users.provider,
        createdAt: users.createdAt,
        lastLogin: users.updatedAt, // Using updatedAt as a proxy for last login
      })
      .from(users)
      .orderBy(desc(users.createdAt))
      .limit(10);
    
    // Remove sensitive data
    const safeUsers = recentUsers.map(user => {
      const { provider, ...userInfo } = user;
      return {
        ...userInfo,
        authProvider: provider || 'local', // Normalize provider field name
      };
    });
    
    res.status(200).json(safeUsers);
  } catch (error) {
    console.error('Error getting recent users:', error);
    res.status(500).json({ message: 'Could not fetch recent users' });
  }
};

// Example Pokémon card data structure (simulated from a real database table we don't have yet)
// In a real implementation, we would query these from the database
const exampleCards = [
  {
    id: 'swsh4-25',
    name: 'Pikachu V',
    setCode: 'swsh4',
    setName: 'Vivid Voltage',
    number: '25',
    rarity: 'Ultra Rare',
    type: 'Lightning',
    imageUrl: '/cards/swsh4-25.png',
    price: 35.99,
    releaseDate: '2020-11-13',
  },
  {
    id: 'swsh12-74',
    name: 'Charizard',
    setCode: 'swsh12',
    setName: 'Silver Tempest',
    number: '74',
    rarity: 'Rare',
    type: 'Fire',
    imageUrl: '/cards/swsh12-74.png',
    price: 12.99,
    releaseDate: '2022-11-11',
  },
  {
    id: 'swsh1-7',
    name: 'Snorlax V',
    setCode: 'swsh1',
    setName: 'Sword & Shield Base Set',
    number: '7', 
    rarity: 'Ultra Rare',
    type: 'Colorless',
    imageUrl: '/cards/swsh1-7.png',
    price: 24.99,
    releaseDate: '2020-02-07',
  },
  {
    id: 'sv2-125',
    name: 'Gardevoir ex',
    setCode: 'sv2',
    setName: 'Paldea Evolved',
    number: '125',
    rarity: 'Ultra Rare',
    type: 'Psychic',
    imageUrl: '/cards/sv2-125.png',
    price: 19.99,
    releaseDate: '2023-06-09',
  },
  {
    id: 'sv3-131',
    name: 'Mew ex',
    setCode: 'sv3',
    setName: 'Obsidian Flames',
    number: '131',
    rarity: 'Ultra Rare',
    type: 'Psychic',
    imageUrl: '/cards/sv3-131.png',
    price: 29.99,
    releaseDate: '2023-08-11',
  },
  {
    id: 'sv4-141',
    name: 'Alakazam ex',
    setCode: 'sv4',
    setName: 'Paradox Rift',
    number: '141',
    rarity: 'Ultra Rare',
    type: 'Psychic',
    imageUrl: '/cards/sv4-141.png',
    price: 22.99,
    releaseDate: '2023-11-03',
  },
  {
    id: 'sv5-121',
    name: 'Mewtwo ex',
    setCode: 'sv5',
    setName: 'Temporal Forces',
    number: '121',
    rarity: 'Ultra Rare',
    type: 'Psychic',
    imageUrl: '/cards/sv5-121.png',
    price: 59.99,
    releaseDate: '2024-03-22',
  },
  {
    id: 'swsh10-154',
    name: 'Mewtwo V Alt Art',
    setCode: 'swsh10',
    setName: 'Astral Radiance',
    number: '154',
    rarity: 'Secret',
    type: 'Psychic',
    imageUrl: '/cards/swsh10-154.png',
    price: 147.99,
    releaseDate: '2022-05-27',
  },
];

// Example Pokémon card sets (simulated from a real database table)
const exampleSets = [
  {
    id: 'swsh1',
    name: 'Sword & Shield Base Set',
    releaseDate: '2020-02-07',
    logoUrl: '/sets/swsh1.png',
    numberOfCards: 202,
    series: 'Sword & Shield'
  },
  {
    id: 'swsh4',
    name: 'Vivid Voltage',
    releaseDate: '2020-11-13',
    logoUrl: '/sets/swsh4.png',
    numberOfCards: 185,
    series: 'Sword & Shield'
  },
  {
    id: 'swsh10',
    name: 'Astral Radiance',
    releaseDate: '2022-05-27',
    logoUrl: '/sets/swsh10.png',
    numberOfCards: 246,
    series: 'Sword & Shield'
  },
  {
    id: 'swsh12',
    name: 'Silver Tempest',
    releaseDate: '2022-11-11',
    logoUrl: '/sets/swsh12.png',
    numberOfCards: 196,
    series: 'Sword & Shield'
  },
  {
    id: 'sv1',
    name: 'Scarlet & Violet Base Set',
    releaseDate: '2023-03-31',
    logoUrl: '/sets/sv1.png',
    numberOfCards: 198,
    series: 'Scarlet & Violet'
  },
  {
    id: 'sv2',
    name: 'Paldea Evolved',
    releaseDate: '2023-06-09',
    logoUrl: '/sets/sv2.png',
    numberOfCards: 190,
    series: 'Scarlet & Violet'
  },
  {
    id: 'sv3',
    name: 'Obsidian Flames',
    releaseDate: '2023-08-11',
    logoUrl: '/sets/sv3.png',
    numberOfCards: 197,
    series: 'Scarlet & Violet'
  },
  {
    id: 'sv4',
    name: 'Paradox Rift',
    releaseDate: '2023-11-03',
    logoUrl: '/sets/sv4.png',
    numberOfCards: 182,
    series: 'Scarlet & Violet'
  },
  {
    id: 'sv5',
    name: 'Temporal Forces',
    releaseDate: '2024-03-22',
    logoUrl: '/sets/sv5.png',
    numberOfCards: 177,
    series: 'Scarlet & Violet'
  },
];

// Get all cards for the admin panel
export const getCards = async (req: Request, res: Response) => {
  try {
    // In a real implementation, we would query the database
    // For now, use our example cards data
    res.status(200).json(exampleCards);
  } catch (error) {
    console.error('Error getting cards:', error);
    res.status(500).json({ message: 'Could not fetch cards' });
  }
};

// Get all sets for the admin panel
export const getSets = async (req: Request, res: Response) => {
  try {
    // In a real implementation, we would query the database
    // For now, use our example sets data
    res.status(200).json(exampleSets);
  } catch (error) {
    console.error('Error getting sets:', error);
    res.status(500).json({ message: 'Could not fetch sets' });
  }
};

// Get popular cards based on collection frequency
export const getPopularCards = async (req: Request, res: Response) => {
  try {
    // Query actual collection data to get real popular cards
    const popularCardsQuery = await db.execute(sql`
      SELECT 
        cc.card_id as id,
        COUNT(DISTINCT cc.collection_id) as collection_count,
        SUM(cc.quantity) as total_quantity,
        MIN(cc.added_at) as first_added
      FROM collection_cards cc
      GROUP BY cc.card_id
      ORDER BY collection_count DESC, total_quantity DESC
      LIMIT 10
    `);

    // If no cards found, return empty array
    if (!popularCardsQuery.rows || popularCardsQuery.rows.length === 0) {
      return res.status(200).json([]);
    }

    // Fetch real card data from Pokémon TCG API
    const popularCards = await Promise.all(
      popularCardsQuery.rows.map(async (row: any) => {
        try {
          const response = await fetch(`https://api.pokemontcg.io/v2/cards/${row.id}`, {
            headers: {
              'X-Api-Key': process.env.POKEMON_TCG_API_KEY || ''
            }
          });
          
          if (response.ok) {
            const cardData = await response.json();
            const card = cardData.data;
            
            return {
              id: card.id,
              name: card.name,
              imageUrl: card.images?.small || card.images?.large,
              rarity: card.rarity,
              type: card.types?.[0] || 'Unknown',
              setName: card.set?.name,
              collectionCount: parseInt(row.collection_count),
              totalQuantity: parseInt(row.total_quantity),
              firstAdded: row.first_added
            };
          } else {
            // Fallback for cards that can't be fetched
            return {
              id: row.id,
              name: `Card ${row.id}`,
              collectionCount: parseInt(row.collection_count),
              totalQuantity: parseInt(row.total_quantity),
              firstAdded: row.first_added
            };
          }
        } catch (error) {
          console.error(`Error fetching card ${row.id}:`, error);
          return {
            id: row.id,
            name: `Card ${row.id}`,
            collectionCount: parseInt(row.collection_count),
            totalQuantity: parseInt(row.total_quantity),
            firstAdded: row.first_added
          };
        }
      })
    );
    
    res.status(200).json(popularCards);
  } catch (error) {
    console.error('Error getting popular cards:', error);
    res.status(500).json({ message: 'Could not fetch popular cards' });
  }
};