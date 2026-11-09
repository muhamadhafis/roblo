export const CAPS = {
  FOOD_LEVEL_MIN: 1,
  FOOD_LEVEL_MAX: 100,
  PULLUP_LEVEL_MIN: 1,
  PULLUP_LEVEL_MAX: 100,
  INVENTORY_CAP_BASE: 50,
  INVENTORY_CAP_MAX: 200,
  AFK_TIME_BASE_SECONDS: 4 * 3600, // 4 Jam = 14400 detik
  AFK_TIME_MAX_SECONDS: 12 * 3600, // 12 Jam = 43200 detik
  THROW_COOLDOWN_MS: 1200, // Minimum 1.2 detik antar lemparan
  MAX_DISTANCE_TOLERANCE: 1.05, // Toleransi desinkronisasi 5%
  DICE_MAX_SLOTS: 100_000,
} as const;

export interface ZoneConfig {
  id: number;
  name: string;
  minDistance: number;
  minStrength: number;
  animalIds: number[];
}

export const ZONES: readonly ZoneConfig[] = [
  {
    id: 1,
    name: "Meadow Farm",
    minDistance: 0,
    minStrength: 0,
    animalIds: [101, 102, 103],
  },
  {
    id: 2,
    name: "Deep Forest",
    minDistance: 60,
    minStrength: 650,
    animalIds: [201, 202, 203],
  },
  {
    id: 3,
    name: "Wild Savannah",
    minDistance: 180,
    minStrength: 3500,
    animalIds: [301, 302, 303],
  },
  {
    id: 4,
    name: "Mystic Tundra",
    minDistance: 400,
    minStrength: 15000,
    animalIds: [401, 402],
  },
  {
    id: 5,
    name: "Dragon Volcano",
    minDistance: 850,
    minStrength: 60000,
    animalIds: [501, 502, 503],
  },
] as const;
