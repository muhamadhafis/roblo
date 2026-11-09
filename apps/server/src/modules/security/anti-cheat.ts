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

  /**
   * Memvalidasi bahwa pemain berada di dalam radius Throw Pad (0, 0) saat melempar makanan.
   */
  public static validateThrowPadProximity(playerPos?: {
    x: number;
    z: number;
  }): SecurityValidationResult {
    if (!playerPos) {
      return {
        valid: false,
        code: "MISSING_PLAYER_POSITION",
        message: "Posisi pemain diperlukan untuk validasi area lempar",
      };
    }

    const dx = playerPos.x - CAPS.THROW_PAD_CENTER_X;
    const dz = playerPos.z - CAPS.THROW_PAD_CENTER_Z;
    const distSq = dx * dx + dz * dz;

    if (distSq > CAPS.THROW_PAD_RADIUS * CAPS.THROW_PAD_RADIUS) {
      return {
        valid: false,
        code: "NOT_IN_THROW_PAD_ZONE",
        message:
          "Anda harus berada di dalam lingkaran Throw Pad untuk melempar makanan",
      };
    }

    return { valid: true };
  }

  /**
   * Memvalidasi bahwa pemain berada di dekat area Kandang (10, 0) saat menaruh hewan.
   */
  public static validatePenProximity(playerPos?: {
    x: number;
    z: number;
  }): SecurityValidationResult {
    if (!playerPos) {
      return {
        valid: false,
        code: "MISSING_PLAYER_POSITION",
        message: "Posisi pemain diperlukan untuk validasi area kandang",
      };
    }

    const dx = playerPos.x - CAPS.PEN_CENTER_X;
    const dz = playerPos.z - CAPS.PEN_CENTER_Z;
    const distSq = dx * dx + dz * dz;

    if (distSq > CAPS.PEN_RADIUS * CAPS.PEN_RADIUS) {
      return {
        valid: false,
        code: "NOT_IN_PEN_ZONE",
        message: "Anda harus berada di dekat pagar kandang untuk menaruh hewan",
      };
    }

    return { valid: true };
  }
}
