import { CAPS, calculateMaxDistance, ZONES } from "@nomnom/shared";

export interface PlayerSecurityContext {
  playerId: string;
  strength: number;
  lastThrowTimestamp: number;
  lastActionNonce: number;
}

export type SecurityValidationResult =
  { valid: true } | { valid: false; code: string; message: string };

export class AntiCheatValidator {
  /**
   * Memvalidasi bahwa nonce transaksi sekuensial dan mencegah replay attack.
   */
  public static validateNonce(
    context: PlayerSecurityContext,
    incomingNonce: number,
  ): SecurityValidationResult {
    if (incomingNonce <= context.lastActionNonce) {
      return {
        valid: false,
        code: "NONCE_REPLAY_DETECTED",
        message: `Nonce ${incomingNonce} tidak valid. Diharapkan > ${context.lastActionNonce}`,
      };
    }
    return { valid: true };
  }

  /**
   * Memvalidasi batas cooldown lemparan proyektil (minimal 1.2 detik).
   */
  public static validateThrowCooldown(
    context: PlayerSecurityContext,
    nowMs: number = Date.now(),
  ): SecurityValidationResult {
    const elapsed = nowMs - context.lastThrowTimestamp;
    if (elapsed < CAPS.THROW_COOLDOWN_MS) {
      return {
        valid: false,
        code: "ACTION_COOLDOWN_ACTIVE",
        message: `Cooldown aktif. Sisa waktu: ${CAPS.THROW_COOLDOWN_MS - elapsed} ms`,
      };
    }
    return { valid: true };
  }

  /**
   * Memvalidasi jangkauan lemparan terhadap batas toleransi kekuatan pemain.
   */
  public static validateThrowDistance(
    claimedDistance: number,
    playerStrength: number,
  ): SecurityValidationResult {
    if (claimedDistance < 0) {
      return {
        valid: false,
        code: "INVALID_NEGATIVE_DISTANCE",
        message: "Jarak tidak boleh bernilai negatif",
      };
    }

    const maxReach = calculateMaxDistance(playerStrength);
    const maxAllowed = maxReach * CAPS.MAX_DISTANCE_TOLERANCE;

    if (claimedDistance > maxAllowed) {
      return {
        valid: false,
        code: "DISTANCE_EXCEEDS_MAX_REACH",
        message: `Jarak ${claimedDistance}m melebihi batas kekuatan maksimum ${maxAllowed.toFixed(2)}m`,
      };
    }

    return { valid: true };
  }

  /**
   * Memvalidasi apakah pemain memenuhi syarat kekuatan untuk mengakses zona target.
   */
  public static validateZoneAccess(
    zoneId: number,
    playerStrength: number,
  ): SecurityValidationResult {
    const zone = ZONES.find((z) => z.id === zoneId);
    if (!zone) {
      return {
        valid: false,
        code: "INVALID_ZONE_ID",
        message: `Zona ID ${zoneId} tidak ditemukan`,
      };
    }

    if (playerStrength < zone.minStrength) {
      return {
        valid: false,
        code: "INSUFFICIENT_ZONE_STRENGTH",
        message: `Kekuatan ${playerStrength} tidak mencukupi untuk zona ${zone.name} (minimal ${zone.minStrength})`,
      };
    }

    return { valid: true };
  }
}
