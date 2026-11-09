import { queryClient } from "./index";

export async function migrateAndSeed() {
  console.log("Menjalankan migrasi DDL pada PostgreSQL (Port 5444)...");

  // 1. Ekstensi pgcrypto untuk gen_random_uuid()
  await queryClient`CREATE EXTENSION IF NOT EXISTS "pgcrypto";`;

  // 2. Tabel players
  await queryClient`
    CREATE TABLE IF NOT EXISTS players (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      wallet_address VARCHAR(42) UNIQUE,
      coins NUMERIC(30, 2) DEFAULT 500 CHECK (coins >= 0),
      gbucks_balance INT DEFAULT 0 CHECK (gbucks_balance >= 0),
      strength NUMERIC(30, 2) DEFAULT 0 CHECK (strength >= 0),
      luck_stat INT DEFAULT 1 CHECK (luck_stat >= 1),
      food_level INT DEFAULT 1 CHECK (food_level >= 1),
      pullup_level INT DEFAULT 1 CHECK (pullup_level >= 1),
      is_afk_active BOOLEAN DEFAULT false,
      last_pullup_sync TIMESTAMPTZ DEFAULT NOW(),
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;
  await queryClient`CREATE INDEX IF NOT EXISTS idx_players_wallet ON players(wallet_address);`;

  // 3. Tabel animals
  await queryClient`
    CREATE TABLE IF NOT EXISTS animals (
      id INT PRIMARY KEY,
      zone_id INT NOT NULL,
      name VARCHAR(64) NOT NULL,
      base_price NUMERIC(18, 2) NOT NULL,
      asset_id VARCHAR(64) NOT NULL
    );
  `;

  // 4. Tabel player_inventory
  await queryClient`
    CREATE TABLE IF NOT EXISTS player_inventory (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
      animal_id INT NOT NULL REFERENCES animals(id),
      grade VARCHAR(16) NOT NULL,
      is_locked BOOLEAN DEFAULT false,
      caught_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;
  await queryClient`CREATE INDEX IF NOT EXISTS idx_inventory_player ON player_inventory(player_id);`;

  // 5. Tabel player_bestiary
  await queryClient`
    CREATE TABLE IF NOT EXISTS player_bestiary (
      player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
      animal_id INT NOT NULL REFERENCES animals(id),
      discovered_mask INT DEFAULT 0,
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      PRIMARY KEY (player_id, animal_id)
    );
  `;

  // 6. Tabel currency_ledger
  await queryClient`
    CREATE TABLE IF NOT EXISTS currency_ledger (
      id BIGSERIAL PRIMARY KEY,
      player_id UUID NOT NULL REFERENCES players(id),
      currency_type VARCHAR(10) NOT NULL,
      delta_amount NUMERIC(30, 2) NOT NULL,
      balance_after NUMERIC(30, 2) NOT NULL,
      reason VARCHAR(64) NOT NULL,
      reference_id VARCHAR(128),
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;
  await queryClient`CREATE INDEX IF NOT EXISTS idx_ledger_player ON currency_ledger(player_id, created_at DESC);`;

  // 7. Tabel pen_animals & kolom players
  await queryClient`ALTER TABLE players ADD COLUMN IF NOT EXISTS last_pen_mps_claim TIMESTAMPTZ DEFAULT NOW();`;
  await queryClient`
    CREATE TABLE IF NOT EXISTS pen_animals (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
      animal_id INT NOT NULL REFERENCES animals(id),
      grade VARCHAR(16) NOT NULL,
      mps_rate NUMERIC(18, 2) NOT NULL,
      placed_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;
  await queryClient`CREATE INDEX IF NOT EXISTS idx_pen_player ON pen_animals(player_id);`;

  console.log("Tabel database selesai dibuat.");

  // 7. Seed Animals Catalog
  const initialAnimals = [
    // Zona 1: Meadow Farm
    {
      id: 101,
      zone_id: 1,
      name: "Kelinci",
      base_price: "10.00",
      asset_id: "rabbit",
    },
    {
      id: 102,
      zone_id: 1,
      name: "Ayam",
      base_price: "15.00",
      asset_id: "chicken",
    },
    {
      id: 103,
      zone_id: 1,
      name: "Domba",
      base_price: "25.00",
      asset_id: "sheep",
    },
    // Zona 2: Deep Forest
    {
      id: 201,
      zone_id: 2,
      name: "Rusa",
      base_price: "80.00",
      asset_id: "deer",
    },
    {
      id: 202,
      zone_id: 2,
      name: "Rubah",
      base_price: "120.00",
      asset_id: "fox",
    },
    {
      id: 203,
      zone_id: 2,
      name: "Beruang",
      base_price: "200.00",
      asset_id: "bear",
    },
    // Zona 3: Wild Savannah
    {
      id: 301,
      zone_id: 3,
      name: "Zebra",
      base_price: "450.00",
      asset_id: "zebra",
    },
    {
      id: 302,
      zone_id: 3,
      name: "Jerapah",
      base_price: "700.00",
      asset_id: "giraffe",
    },
    {
      id: 303,
      zone_id: 3,
      name: "Singa",
      base_price: "1200.00",
      asset_id: "lion",
    },
    // Zona 4: Mystic Tundra
    {
      id: 401,
      zone_id: 4,
      name: "Serigala Es",
      base_price: "3000.00",
      asset_id: "ice_wolf",
    },
    {
      id: 402,
      zone_id: 4,
      name: "Mammoth",
      base_price: "6000.00",
      asset_id: "mammoth",
    },
    // Zona 5: Dragon Volcano
    {
      id: 501,
      zone_id: 5,
      name: "Drake",
      base_price: "18000.00",
      asset_id: "drake",
    },
    {
      id: 502,
      zone_id: 5,
      name: "Wyvern",
      base_price: "35000.00",
      asset_id: "wyvern",
    },
    {
      id: 503,
      zone_id: 5,
      name: "Dragon",
      base_price: "80000.00",
      asset_id: "dragon",
    },
  ];

  for (const a of initialAnimals) {
    await queryClient`
      INSERT INTO animals (id, zone_id, name, base_price, asset_id)
      VALUES (${a.id}, ${a.zone_id}, ${a.name}, ${a.base_price}, ${a.asset_id})
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        base_price = EXCLUDED.base_price,
        asset_id = EXCLUDED.asset_id;
    `;
  }

  console.log(
    `Katalog hewan berhasil di-seed (${initialAnimals.length} entitas).`,
  );
}

if (import.meta.main) {
  migrateAndSeed()
    .then(() => {
      console.log("Migrasi & seeding selesai.");
      process.exit(0);
    })
    .catch((err) => {
      console.error("Gagal menjalankan migrasi/seeding:", err);
      process.exit(1);
    });
}
