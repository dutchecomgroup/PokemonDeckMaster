CREATE TABLE IF NOT EXISTS "users" (
  "id" SERIAL PRIMARY KEY,
  "username" TEXT NOT NULL UNIQUE,
  "email" TEXT NOT NULL UNIQUE,
  "password" TEXT NOT NULL,
  "display_name" TEXT,
  "avatar" TEXT,
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "collections" (
  "id" SERIAL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "language" TEXT DEFAULT 'english',
  "user_id" INTEGER NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "collection_cards" (
  "id" SERIAL PRIMARY KEY,
  "collection_id" INTEGER NOT NULL REFERENCES "collections"("id") ON DELETE CASCADE,
  "card_id" TEXT NOT NULL,
  "quantity" INTEGER NOT NULL DEFAULT 1,
  "added_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "favorites" (
  "id" SERIAL PRIMARY KEY,
  "user_id" INTEGER NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "card_id" TEXT NOT NULL,
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "set_cache" (
  "id" TEXT PRIMARY KEY,
  "data" JSONB NOT NULL,
  "last_updated" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_collections_user_id" ON "collections"("user_id");
CREATE INDEX IF NOT EXISTS "idx_collection_cards_collection_id" ON "collection_cards"("collection_id");
CREATE INDEX IF NOT EXISTS "idx_collection_cards_card_id" ON "collection_cards"("card_id");
CREATE INDEX IF NOT EXISTS "idx_favorites_user_id" ON "favorites"("user_id");
CREATE INDEX IF NOT EXISTS "idx_favorites_card_id" ON "favorites"("card_id");
CREATE UNIQUE INDEX IF NOT EXISTS "idx_favorites_user_card" ON "favorites"("user_id", "card_id");