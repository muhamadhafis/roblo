import { describe, expect, it } from "bun:test";
import { CAPS, calculateMaxDistance } from "@nomnom/shared";
import { AntiCheatValidator } from "../../apps/server/src/modules/security/anti-cheat";

describe("Security Suite: Throw Distance & Zone Spoofing Protection", () => {
  it("MENOLAK jarak lemparan yang melebihi batas jangkauan kekuatan (+5% toleransi)", () => {
    const strength = 100;
    const maxReach = calculateMaxDistance(strength);
    const maxAllowed = maxReach * CAPS.MAX_DISTANCE_TOLERANCE;

    // Jarak legal dalam toleransi
    const legalResult = AntiCheatValidator.validateThrowDistance(
      maxAllowed - 0.1,
      strength,
    );
    expect(legalResult.valid).toBe(true);

    // Eksploitasi: Jarak melampaui batas toleransi
    const spoofedDistance = maxAllowed + 5.0;
    const spoofResult = AntiCheatValidator.validateThrowDistance(
      spoofedDistance,
      strength,
    );
    expect(spoofResult.valid).toBe(false);
    if (!spoofResult.valid) {
      expect(spoofResult.code).toBe("DISTANCE_EXCEEDS_MAX_REACH");
    }
  });

  it("MENOLAK jarak bernilai negatif", () => {
    const result = AntiCheatValidator.validateThrowDistance(-10, 500);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.code).toBe("INVALID_NEGATIVE_DISTANCE");
    }
  });

  it("MENOLAK akses ke zona bertingkat tinggi jika kekuatan pemain belum memenuhi syarat", () => {
    // Zona 5 (Dragon Volcano) butuh minimal S = 60,000
    const weakStrength = 100;
    const result = AntiCheatValidator.validateZoneAccess(5, weakStrength);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.code).toBe("INSUFFICIENT_ZONE_STRENGTH");
    }
  });

  it("MENOLAK zona ID yang tidak terdaftar", () => {
    const result = AntiCheatValidator.validateZoneAccess(999, 100000);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.code).toBe("INVALID_ZONE_ID");
    }
  });

  it("MENGIZINKAN zona target yang sesuai dengan tier kekuatan pemain", () => {
    // Zona 2 (Deep Forest) butuh minimal S = 650
    const validResult = AntiCheatValidator.validateZoneAccess(2, 700);
    expect(validResult.valid).toBe(true);
  });
});
