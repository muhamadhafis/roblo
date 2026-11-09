import { describe, expect, it } from "bun:test";
import { calculateAnimalMps, calculatePenYield, CAPS } from "@nomnom/shared";

describe("Unit Suite: Animal Pen Money Per Second (MPS) Business Logic", () => {
  describe("Kalkulasi Nilai MPS Hewan (calculateAnimalMps)", () => {
    it("menghitung MPS hewan Normal dengan Food Level 1", () => {
      // Kelinci basePrice = 10
      // 10 * 0.05 * 1.0 * (1 + 1 * 0.1) = 0.5 * 1.1 = 0.55
      const mps = calculateAnimalMps(10, "NORMAL", 1);
      expect(mps).toBe(0.55);
    });

    it("mengaplikasikan multiplier grade Emas (10x)", () => {
      // 10 * 0.05 * 10 * 1.1 = 5.5
      const mps = calculateAnimalMps(10, "EMAS", 1);
      expect(mps).toBe(5.5);
    });

    it("mengaplikasikan multiplier grade Rubi (250x)", () => {
      // 10 * 0.05 * 250 * 1.1 = 137.5
      const mps = calculateAnimalMps(10, "RUBI", 1);
      expect(mps).toBe(137.5);
    });

    it("mengaplikasikan bonus Food Level pada MPS dengan clamping level cap 100", () => {
      // Level 100: 1 + 100 * 0.1 = 11.0
      // 100 * 0.05 * 1.0 * 11.0 = 55.0
      const mpsAtCap = calculateAnimalMps(100, "NORMAL", 100);
      const mpsOverCap = calculateAnimalMps(100, "NORMAL", 999);
      expect(mpsAtCap).toBe(55.0);
      expect(mpsOverCap).toBe(55.0);
    });
  });

  describe("Kalkulasi Akumulasi Koin Pasif Kandang (calculatePenYield)", () => {
    it("menghitung koin pasif berdasarkan akumulasi detik berjalan", () => {
      const totalMps = 10.0;
      const start = 1_000_000;
      const now = start + 30 * 1000; // 30 detik

      const yieldResult = calculatePenYield(totalMps, start, now);
      expect(yieldResult.deltaSeconds).toBe(30);
      expect(yieldResult.coinsEarned).toBe(300.0);
    });

    it("menahan akumulasi koin pasif pada batas maksimal offline cap (12 jam)", () => {
      const totalMps = 2.0;
      const start = 1_000_000;
      const now = start + 24 * 3600 * 1000; // 24 jam offline

      const yieldResult = calculatePenYield(
        totalMps,
        start,
        now,
        CAPS.AFK_TIME_MAX_SECONDS,
      );
      expect(yieldResult.deltaSeconds).toBe(CAPS.AFK_TIME_MAX_SECONDS);
      expect(yieldResult.coinsEarned).toBe(CAPS.AFK_TIME_MAX_SECONDS * 2.0);
    });
  });
});
