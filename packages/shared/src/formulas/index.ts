import { CAPS, ZONES, type ZoneConfig } from "../constants/caps";
import type { Grade } from "../types";

export const GRADE_MULTIPLIERS: Record<Grade, number> = {
  NORMAL: 1.0,
  BESAR: 3.0,
  EMAS: 10.0,
  BERLIAN: 50.0,
  RUBI: 250.0,
};

export const GRADE_BITMASK: Record<Grade, number> = {
  NORMAL: 1 << 0, // 1
  BESAR: 1 << 1, // 2
  EMAS: 1 << 2, // 4
  BERLIAN: 1 << 3, // 8
  RUBI: 1 << 4, // 16
};

export function calculateMaxDistance(strength: number): number {
  const safeStrength = Math.max(0, strength);
  const distance =
    20 * Math.log10(safeStrength + 10) + Math.pow(safeStrength / 80, 0.65);
  return Number(distance.toFixed(2));
}

export function getZoneByDistance(distance: number): ZoneConfig | null {
  const matchingZones = ZONES.filter((z) => distance >= z.minDistance);
  if (matchingZones.length === 0) return null;
  return matchingZones[matchingZones.length - 1];
}

export function rollAnimalGrade(
  luckStat: number,
  customRandom?: number,
): Grade {
  const safeLuck = Math.max(1, luckStat);
  const totalSlots = CAPS.DICE_MAX_SLOTS;

  const wRubi = Math.floor(20 * (1 + 0.08 * safeLuck));
  const wBerlian = Math.floor(180 * (1 + 0.05 * safeLuck));
  const wEmas = Math.floor(2300 * (1 + 0.03 * safeLuck));
  const wBesar = 17500;

  const roll =
    customRandom !== undefined
      ? Math.floor(customRandom * totalSlots)
      : Math.floor(Math.random() * totalSlots);

  let cursor = 0;

  cursor += wRubi;
  if (roll < cursor) return "RUBI";

  cursor += wBerlian;
  if (roll < cursor) return "BERLIAN";

  cursor += wEmas;
  if (roll < cursor) return "EMAS";

  cursor += wBesar;
  if (roll < cursor) return "BESAR";

  return "NORMAL";
}

export function calculatePayout(
  basePrice: number,
  grade: Grade,
  foodLevel: number,
): number {
  const safeFoodLevel = Math.min(
    CAPS.FOOD_LEVEL_MAX,
    Math.max(CAPS.FOOD_LEVEL_MIN, foodLevel),
  );
  const gradeMult = GRADE_MULTIPLIERS[grade] ?? 1.0;
  const foodMult = 1 + safeFoodLevel * 0.15;
  const payout = basePrice * gradeMult * foodMult;
  return Number(payout.toFixed(2));
}

export function calculateAfkYield(
  startTimeMs: number,
  nowMs: number,
  pullupLevel: number,
  maxCapSeconds: number = CAPS.AFK_TIME_BASE_SECONDS,
  baseRatePerSec: number = 1.0,
): { deltaSeconds: number; strengthGained: number } {
  const safeLevel = Math.min(
    CAPS.PULLUP_LEVEL_MAX,
    Math.max(CAPS.PULLUP_LEVEL_MIN, pullupLevel),
  );
  const effectiveMaxSeconds = Math.min(
    CAPS.AFK_TIME_MAX_SECONDS,
    maxCapSeconds,
  );

  const elapsedSeconds = Math.max(0, Math.floor((nowMs - startTimeMs) / 1000));
  const deltaSeconds = Math.min(elapsedSeconds, effectiveMaxSeconds);

  const levelMultiplier = Math.pow(1.25, safeLevel - 1);
  const strengthGained = deltaSeconds * baseRatePerSec * levelMultiplier;

  return {
    deltaSeconds,
    strengthGained: Number(strengthGained.toFixed(2)),
  };
}

export function calculateFoodUpgradeCost(currentLevel: number): number {
  if (currentLevel >= CAPS.FOOD_LEVEL_MAX) return Infinity;
  const cost = 150 * Math.pow(1.45, currentLevel - 1);
  return Math.floor(cost);
}

export function calculatePullupUpgradeCost(currentLevel: number): number {
  if (currentLevel >= CAPS.PULLUP_LEVEL_MAX) return Infinity;
  const cost = 100 * Math.pow(1.38, currentLevel - 1);
  return Math.floor(cost);
}

export * from "./mps";
