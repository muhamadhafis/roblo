import { CAPS } from "../constants/caps";
import type { Grade } from "../types";
import { GRADE_MULTIPLIERS } from "./index";

/**
 * Menghitung pendapatan Money Per Second (MPS) per hewan di dalam kandang.
 * Formula: BasePrice * 0.05 * GradeMultiplier * (1 + FoodLevel * 0.1)
 */
export function calculateAnimalMps(
  basePrice: number,
  grade: Grade,
  foodLevel: number = 1,
): number {
  const safeFoodLevel = Math.min(
    CAPS.FOOD_LEVEL_MAX,
    Math.max(CAPS.FOOD_LEVEL_MIN, foodLevel),
  );
  const gradeMult = GRADE_MULTIPLIERS[grade] ?? 1.0;
  const foodBonus = 1 + safeFoodLevel * 0.1;
  const mps = basePrice * 0.05 * gradeMult * foodBonus;
  return Number(mps.toFixed(2));
}

/**
 * Menghitung akumulasi koin pasif dari seluruh hewan di kandang secara tick-less.
 */
export function calculatePenYield(
  totalMps: number,
  startMs: number,
  nowMs: number,
  maxCapSeconds: number = CAPS.AFK_TIME_BASE_SECONDS,
): { deltaSeconds: number; coinsEarned: number } {
  if (totalMps <= 0) return { deltaSeconds: 0, coinsEarned: 0 };

  const elapsedSeconds = Math.max(0, Math.floor((nowMs - startMs) / 1000));
  const effectiveMax = Math.min(CAPS.AFK_TIME_MAX_SECONDS, maxCapSeconds);
  const deltaSeconds = Math.min(elapsedSeconds, effectiveMax);

  const coinsEarned = Number((deltaSeconds * totalMps).toFixed(2));
  return { deltaSeconds, coinsEarned };
}
