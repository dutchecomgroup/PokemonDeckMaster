import { pgTable, text, serial, integer, timestamp, jsonb, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Collection schema
export const collections = pgTable("collections", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  language: text("language").default("english"),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertCollectionSchema = createInsertSchema(collections)
  .omit({ id: true, createdAt: true, updatedAt: true, userId: true })
  .extend({
    description: z.string().optional()
  });

// Collection cards schema (joining collections and cards)
export const collectionCards = pgTable("collection_cards", {
  id: serial("id").primaryKey(),
  collectionId: integer("collection_id").notNull().references(() => collections.id, { onDelete: 'cascade' }),
  cardId: text("card_id").notNull(), // References the Pokemon TCG API card id
  quantity: integer("quantity").default(1).notNull(),
  addedAt: timestamp("added_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertCollectionCardSchema = createInsertSchema(collectionCards).pick({
  collectionId: true,
  cardId: true,
  quantity: true,
});

// Users schema with enhanced profile data and OAuth support
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password"),  // Can be null for OAuth users
  displayName: text("display_name"),
  avatar: text("avatar"),
  role: text("role").default("user").notNull(), // 'user' or 'admin'
  status: text("status").default("active").notNull(), // 'active' or 'blocked'
  provider: text("provider"),  // 'local', 'google', 'facebook', etc.
  providerId: text("provider_id"), // ID from the provider
  providerData: jsonb("provider_data"), // Store additional provider data
  needsProfileCompletion: boolean("needs_profile_completion").default(false), // Flag for new OAuth users
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// For regular user registration
export const insertUserSchema = createInsertSchema(users)
  .omit({ id: true, createdAt: true, updatedAt: true, providerData: true })
  .extend({
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

// For OAuth user creation
export const insertOAuthUserSchema = createInsertSchema(users)
  .omit({ id: true, createdAt: true, updatedAt: true, password: true })
  .extend({
    provider: z.string().min(1, "Provider is required"),
    providerId: z.string().min(1, "Provider ID is required"),
    providerData: z.any().optional(),
    needsProfileCompletion: z.boolean().optional().default(false),
  });

export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

// Set cache schema (to minimize API calls)
export const setCache = pgTable("set_cache", {
  id: text("id").primaryKey(), // The set id from Pokemon TCG API
  data: jsonb("data").notNull(),
  lastUpdated: timestamp("last_updated").defaultNow().notNull(),
});

export const insertSetCacheSchema = createInsertSchema(setCache).pick({
  id: true,
  data: true,
});

// Types
export type InsertCollection = z.infer<typeof insertCollectionSchema>;
export type Collection = typeof collections.$inferSelect;

export type InsertCollectionCard = z.infer<typeof insertCollectionCardSchema>;
export type CollectionCard = typeof collectionCards.$inferSelect;

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertOAuthUser = z.infer<typeof insertOAuthUserSchema>;
export type LoginUser = z.infer<typeof loginSchema>;
export type User = typeof users.$inferSelect;

// Favorites table for users to mark cards they like
export const favorites = pgTable("favorites", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  cardId: text("card_id").notNull(), // References the Pokemon TCG API card id
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertFavoriteSchema = createInsertSchema(favorites)
  .omit({ id: true, createdAt: true });

export type InsertFavorite = z.infer<typeof insertFavoriteSchema>;
export type Favorite = typeof favorites.$inferSelect;

// Card photos schema for user-uploaded card images
export const cardPhotos = pgTable("card_photos", {
  id: serial("id").primaryKey(),
  collectionCardId: integer("collection_card_id").notNull().references(() => collectionCards.id, { onDelete: 'cascade' }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  photoUrl: text("photo_url").notNull(),
  isFront: integer("is_front").default(1).notNull(), // 1 for front, 0 for back
  quality: text("quality").default("normal"), // e.g., mint, excellent, good, poor
  notes: text("notes"),
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
});

export const insertCardPhotoSchema = createInsertSchema(cardPhotos)
  .omit({ id: true, uploadedAt: true });

export type InsertCardPhoto = z.infer<typeof insertCardPhotoSchema>;
export type CardPhoto = typeof cardPhotos.$inferSelect;

export type InsertSetCache = z.infer<typeof insertSetCacheSchema>;
export type SetCache = typeof setCache.$inferSelect;

// App Settings schema
export const appSettings = pgTable("app_settings", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: jsonb("value").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertAppSettingSchema = createInsertSchema(appSettings)
  .omit({ id: true, updatedAt: true });

export type InsertAppSetting = z.infer<typeof insertAppSettingSchema>;
export type AppSetting = typeof appSettings.$inferSelect;
