import { describe, expect, it } from "bun:test";
import { CAPS } from "@nomnom/shared";
import {
  AntiCheatValidator,
  type PlayerSecurityContext,
} from "../../apps/server/src/modules/security/anti-cheat";

describe("Security Suite: Rate Limiting & Nonce Replay Protection", () => {
  it("MENOLAK replay nonce yang sama atau lebih kecil", () => {
    const context: PlayerSecurityContext = {
      playerId: "test-player-1",
      strength: 1000,
      lastThrowTimestamp: 0,
      lastActionNonce: 5,
    };

    // Eksploitasi 1: Mengirim nonce yang sama (5)
    const replaySame = AntiCheatValidator.validateNonce(context, 5);
    expect(replaySame.valid).toBe(false);
    if (!replaySame.valid) {
      expect(replaySame.code).toBe("NONCE_REPLAY_DETECTED");
    }

    // Eksploitasi 2: Mengirim nonce lebih kecil (4)
    const replayLower = AntiCheatValidator.validateNonce(context, 4);
    expect(replayLower.valid).toBe(false);
    if (!replayLower.valid) {
      expect(replayLower.code).toBe("NONCE_REPLAY_DETECTED");
    }

    // Aksi Sah: Nonce sekuensial meningkat (6)
    const validNonce = AntiCheatValidator.validateNonce(context, 6);
    expect(validNonce.valid).toBe(true);
  });

  describe("Cooldown Lemparan (Minimum 1.2 Detik)", () => {
    it("MENOLAK lemparan bertubi-tubi dalam jeda < 1200 ms", () => {
      const now = 10_000_000;
      const context: PlayerSecurityContext = {
        playerId: "test-player-2",
        strength: 500,
        lastThrowTimestamp: now,
        lastActionNonce: 1,
      };

      // Spam lemparan 500ms setelah lemparan pertama
      const spamCheck = AntiCheatValidator.validateThrowCooldown(
        context,
        now + 500,
      );
      expect(spamCheck.valid).toBe(false);
      if (!spamCheck.valid) {
        expect(spamCheck.code).toBe("ACTION_COOLDOWN_ACTIVE");
      }

      // Spam lemparan 1199ms setelah lemparan pertama (masih < 1200ms)
      const edgeCheck = AntiCheatValidator.validateThrowCooldown(
        context,
        now + CAPS.THROW_COOLDOWN_MS - 1,
      );
      expect(edgeCheck.valid).toBe(false);
    });

    it("MENGIZINKAN lemparan setelah cooldown 1200 ms terpenuhi", () => {
      const now = 10_000_000;
      const context: PlayerSecurityContext = {
        playerId: "test-player-3",
        strength: 500,
        lastThrowTimestamp: now,
        lastActionNonce: 1,
      };

      const validCheck = AntiCheatValidator.validateThrowCooldown(
        context,
        now + CAPS.THROW_COOLDOWN_MS,
      );
      expect(validCheck.valid).toBe(true);
    });
  });
});
