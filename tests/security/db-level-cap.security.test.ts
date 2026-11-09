import { describe, expect, it, beforeAll } from "bun:test";
import { PlayerService } from "../../apps/server/src/services/player.service";
import { db, schema } from "../../apps/server/src/db";
import { eq } from "drizzle-orm";
import { CAPS } from "@nomnom/shared";

describe("Security Suite: Database Level Cap & Balance Tamper Defense", () => {
  let playerId: string;

  beforeAll(async () => {
    const testWallet = "0x3333333333333333333333333333333333333333";
    const player = await PlayerService.getOrCreateGuestPlayer(testWallet);
    playerId = player.id;
  });

  it("MENOLAK upgrade ketika pemain telah mencapai Hard Cap level 100", async () => {
    // Set level pemain ke 100 secara langsung
    await db
      .update(schema.players)
      .set({ foodLevel: CAPS.FOOD_LEVEL_MAX, coins: "1000000.00" })
      .where(eq(schema.players.id, playerId));

    // Eksploitasi: Request upgrade di atas level cap
    let errorCaught: any = null;
    try {
      await PlayerService.upgradeStat(playerId, "FOOD");
    } catch (err) {
      errorCaught = err;
    }

    expect(errorCaught).toBeDefined();
    expect(errorCaught.message).toContain("batas maksimal");

    // Pastikan level di database tidak bertambah menjadi 101
    const [persistedPlayer] = await db
      .select()
      .from(schema.players)
      .where(eq(schema.players.id, playerId));

    expect(persistedPlayer.foodLevel).toBe(CAPS.FOOD_LEVEL_MAX);
  });

  it("MENOLAK upgrade jika koin pemain tidak mencukupi saldo", async () => {
    // Set koin pemain menjadi 0
    await db
      .update(schema.players)
      .set({ foodLevel: 1, coins: "0.00" })
      .where(eq(schema.players.id, playerId));

    let errorCaught: any = null;
    try {
      await PlayerService.upgradeStat(playerId, "FOOD");
    } catch (err) {
      errorCaught = err;
    }

    expect(errorCaught).toBeDefined();
    expect(errorCaught.message).toContain("Koin tidak mencukupi");
  });
});
