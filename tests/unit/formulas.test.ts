import { describe, expect, it } from "bun:test";
import {
  CAPS,
  ZONES,
  calculateMaxDistance,
  rollAnimalGrade,
  calculatePayout,
  calculateAfkYield,
  calculateFoodUpgradeCost,
  calculatePullupUpgradeCost,
  GRADE_BITMASK,
  GRADE_MULTIPLIERS,
} from "@nomnom/shared";

describe("NomNom Core Formulas & Business Logic Tests", () => {
  describe("Formula Jarak Lemparan (calculateMaxDistance)", () => {
    it("menghasilkan 20.00 meter pada Kekuatan S = 0", () => {
      const distance = calculateMaxDistance(0);
      expect(distance).toBe(20.0);
    });

    it("menghasilkan jangkauan sesuai formula deterministik PRD 2.1", () => {
      // Formula: 20 * log10(S + 10) + (S / 80)^0.65
      expect(calculateMaxDistance(0)).toBe(20.0);
      expect(calculateMaxDistance(650)).toBe(60.29);
      expect(calculateMaxDistance(3500)).toBe(82.56);
      expect(calculateMaxDistance(15000)).toBe(113.55);
      expect(calculateMaxDistance(60000)).toBe(169.49);
    });
  });

  describe("Formula Penjualan Hewan (calculatePayout)", () => {
    it("menghitung harga hewan Normal dengan Food Level 1", () => {
      const basePrice = 100;
      // 100 * 1.0 * (1 + 1 * 0.15) = 115
      const payout = calculatePayout(basePrice, "NORMAL", 1);
      expect(payout).toBe(115);
    });

    it("mengaplikasikan multiplier grade Emas (10x)", () => {
      const basePrice = 100;
      // 100 * 10 * 1.15 = 1150
      const payout = calculatePayout(basePrice, "EMAS", 1);
      expect(payout).toBe(1150);
    });

    it("mengaplikasikan multiplier grade Rubi (250x)", () => {
      const basePrice = 100;
      // 100 * 250 * 1.15 = 28750
      const payout = calculatePayout(basePrice, "RUBI", 1);
      expect(payout).toBe(28750);
    });

    it("menahan Food Level pada batas maksimum (Level Cap 100)", () => {
      const basePrice = 100;
      // Level 100: multiplier = 1 + 100 * 0.15 = 16.0
      const payoutAtCap = calculatePayout(basePrice, "NORMAL", 100);
      // Level 999: harus di-clamp di 100
      const payoutOverCap = calculatePayout(basePrice, "NORMAL", 999);
      expect(payoutAtCap).toBe(1600);
      expect(payoutOverCap).toBe(1600);
    });
  });

  describe("Formula AFK Pull-Up Tick-less (calculateAfkYield)", () => {
    it("mengakumulasi perolehan kekuatan sebanding dengan detik berjalan", () => {
      const start = 1_000_000;
      const now = start + 60 * 1000; // 60 detik
      const yieldResult = calculateAfkYield(start, now, 1);

      expect(yieldResult.deltaSeconds).toBe(60);
      expect(yieldResult.strengthGained).toBe(60.0);
    });

    it("menahan akumulasi pada batas default 4 jam (14400 detik)", () => {
      const start = 1_000_000;
      const now = start + 10 * 3600 * 1000; // 10 jam
      const yieldResult = calculateAfkYield(
        start,
        now,
        1,
        CAPS.AFK_TIME_BASE_SECONDS,
      );

      expect(yieldResult.deltaSeconds).toBe(14400);
      expect(yieldResult.strengthGained).toBe(14400.0);
    });

    it("menahan akumulasi pada batas maksimal booster 12 jam (43200 detik)", () => {
      const start = 1_000_000;
      const now = start + 24 * 3600 * 1000; // 24 jam
      const yieldResult = calculateAfkYield(start, now, 1, 999999);

      expect(yieldResult.deltaSeconds).toBe(CAPS.AFK_TIME_MAX_SECONDS);
      expect(yieldResult.strengthGained).toBe(CAPS.AFK_TIME_MAX_SECONDS);
    });

    it("mengaplikasikan level cap 100 pada pull-up level", () => {
      const start = 1_000_000;
      const now = start + 10 * 1000; // 10 detik
      const yieldAt100 = calculateAfkYield(start, now, 100);
      const yieldAt999 = calculateAfkYield(start, now, 999);

      expect(yieldAt999.strengthGained).toBe(yieldAt100.strengthGained);
    });
  });

  describe("Formula Biaya Upgrade & Level Caps", () => {
    it("menghitung biaya upgrade eksponensial dengan tepat", () => {
      expect(calculateFoodUpgradeCost(1)).toBe(150);
      expect(calculatePullupUpgradeCost(1)).toBe(100);
    });

    it("mengembalikan Infinity saat level telah mencapai Hard Cap 100", () => {
      expect(calculateFoodUpgradeCost(100)).toBe(Infinity);
      expect(calculatePullupUpgradeCost(100)).toBe(Infinity);
    });
  });

  describe("Bestiary Bitmask Logic", () => {
    it("menguji bitwise flag untuk setiap grade hewan", () => {
      let mask = 0;
      mask |= GRADE_BITMASK.NORMAL;
      expect(mask & GRADE_BITMASK.NORMAL).toBeTruthy();
      expect(mask & GRADE_BITMASK.RUBI).toBeFalsy();

      mask |= GRADE_BITMASK.RUBI;
      expect(mask & GRADE_BITMASK.RUBI).toBeTruthy();
      // Mask total untuk semua grade 1+2+4+8+16 = 31 (0b11111)
      const fullMask =
        GRADE_BITMASK.NORMAL |
        GRADE_BITMASK.BESAR |
        GRADE_BITMASK.EMAS |
        GRADE_BITMASK.BERLIAN |
        GRADE_BITMASK.RUBI;
      expect(fullMask).toBe(31);
    });
  });
});
