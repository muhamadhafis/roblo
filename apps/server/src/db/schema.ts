import {
  pgTable,
  uuid,
  varchar,
  numeric,
  integer,
  boolean,
  timestamp,
  bigserial,
  primaryKey,
  index,
} from "drizzle-orm/pg-core";

// 1. Master Profil Pemain
export const players = pgTable(
  "players",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    walletAddress: varchar("wallet_address", { length: 42 }).unique(),
    coins: numeric("coins", { precision: 30, scale: 2 }).default("0").notNull(),
    gbucksBalance: integer("gbucks_balance").default(0).notNull(),
    strength: numeric("strength", { precision: 30, scale: 2 })
      .default("0")
      .notNull(),
    luckStat: integer("luck_stat").default(1).notNull(),
    foodLevel: integer("food_level").default(1).notNull(),
    pullupLevel: integer("pullup_level").default(1).notNull(),
    isAfkActive: boolean("is_afk_active").default(false).notNull(),
    lastPullupSync: timestamp("last_pullup_sync", { withTimezone: true })
      .defaultNow()
      .notNull(),
    lastPenMpsClaim: timestamp("last_pen_mps_claim", { withTimezone: true })
      .defaultNow()
      .notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [index("idx_players_wallet").on(table.walletAddress)],
);

// 2. Master Katalog Hewan per Zona
export const animals = pgTable("animals", {
  id: integer("id").primaryKey(),
  zoneId: integer("zone_id").notNull(),
  name: varchar("name", { length: 64 }).notNull(),
  basePrice: numeric("base_price", { precision: 18, scale: 2 }).notNull(),
  assetId: varchar("asset_id", { length: 64 }).notNull(),
});

// 3. Inventory Hewan Tersimpan
export const playerInventory = pgTable(
  "player_inventory",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    playerId: uuid("player_id")
      .notNull()
      .references(() => players.id, { onDelete: "cascade" }),
    animalId: integer("animal_id")
      .notNull()
      .references(() => animals.id),
    grade: varchar("grade", { length: 16 }).notNull(),
    isLocked: boolean("is_locked").default(false).notNull(),
    caughtAt: timestamp("caught_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [index("idx_inventory_player").on(table.playerId)],
);

// 4. Indeks / Bestiary Tracking (Bitmask 1-31)
export const playerBestiary = pgTable(
  "player_bestiary",
  {
    playerId: uuid("player_id")
      .notNull()
      .references(() => players.id, { onDelete: "cascade" }),
    animalId: integer("animal_id")
      .notNull()
      .references(() => animals.id),
    discoveredMask: integer("discovered_mask").default(0).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [primaryKey({ columns: [table.playerId, table.animalId] })],
);

// 5. Ledger Transaksi Keuangan (Auditable)
export const currencyLedger = pgTable(
  "currency_ledger",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    playerId: uuid("player_id")
      .notNull()
      .references(() => players.id),
    currencyType: varchar("currency_type", { length: 10 }).notNull(), // 'COINS' atau 'GBUCKS'
    deltaAmount: numeric("delta_amount", { precision: 30, scale: 2 }).notNull(),
    balanceAfter: numeric("balance_after", {
      precision: 30,
      scale: 2,
    }).notNull(),
    reason: varchar("reason", { length: 64 }).notNull(),
    referenceId: varchar("reference_id", { length: 128 }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [index("idx_ledger_player").on(table.playerId, table.createdAt)],
);

// 6. Kandang Hewan (Animal Pen / Coop) - Passive MPS Generator
export const penAnimals = pgTable(
  "pen_animals",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    playerId: uuid("player_id")
      .notNull()
      .references(() => players.id, { onDelete: "cascade" }),
    animalId: integer("animal_id")
      .notNull()
      .references(() => animals.id),
    grade: varchar("grade", { length: 16 }).notNull(),
    mpsRate: numeric("mps_rate", { precision: 18, scale: 2 }).notNull(),
    placedAt: timestamp("placed_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [index("idx_pen_player").on(table.playerId)],
);
