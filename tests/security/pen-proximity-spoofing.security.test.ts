import { describe, expect, it } from "bun:test";
import { CAPS } from "@nomnom/shared";
import { AntiCheatValidator } from "../../apps/server/src/modules/security/anti-cheat";

describe("Security Suite: Spatial Proximity & Teleport Packet Injection Defense", () => {
  describe("Throw Pad Proximity Defense", () => {
    it("MENOLAK lemparan jika posisi pemain berada di luar radius Throw Pad", () => {
      // Throw Pad berada di (0, 0) dengan radius toleransi 3.5m
      // Eksploitasi: Klien mengirim koordinat di (10, 5)
      const spoofedPos = { x: 10.0, z: 5.0 };
      const check = AntiCheatValidator.validateThrowPadProximity(spoofedPos);

      expect(check.valid).toBe(false);
      if (!check.valid) {
        expect(check.code).toBe("NOT_IN_THROW_PAD_ZONE");
      }
    });

    it("MENOLAK jika posisi pemain tidak dikirimkan (undefined)", () => {
      const check = AntiCheatValidator.validateThrowPadProximity(undefined);
      expect(check.valid).toBe(false);
      if (!check.valid) {
        expect(check.code).toBe("MISSING_PLAYER_POSITION");
      }
    });

    it("MENGIZINKAN lemparan jika pemain berada di dalam radius Throw Pad (0, 0)", () => {
      const validPos = { x: 1.5, z: 2.0 }; // Jarak ~2.5m (dalam batas 3.5m)
      const check = AntiCheatValidator.validateThrowPadProximity(validPos);
      expect(check.valid).toBe(true);
    });
  });

  describe("Animal Pen Proximity Defense", () => {
    it("MENOLAK penempatan hewan ke kandang jika pemain berada jauh dari kandang (Anti-Teleport)", () => {
      // Kandang berada di (10, 0) dengan radius 3.5m
      // Eksploitasi: Klien berada di hub (0, 0) mencoba menaruh hewan ke kandang secara remote
      const remotePos = { x: 0.0, z: 0.0 };
      const check = AntiCheatValidator.validatePenProximity(remotePos);

      expect(check.valid).toBe(false);
      if (!check.valid) {
        expect(check.code).toBe("NOT_IN_PEN_ZONE");
      }
    });

    it("MENGIZINKAN penempatan hewan jika pemain berada di dekat pagar kandang", () => {
      const validPenPos = { x: 10.5, z: 1.0 }; // Dekat (10, 0)
      const check = AntiCheatValidator.validatePenProximity(validPenPos);
      expect(check.valid).toBe(true);
    });
  });
});
