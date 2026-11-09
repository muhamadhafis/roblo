import { describe, expect, it, beforeAll } from "bun:test";
import { PlayerService } from "../../apps/server/src/services/player.service";
import { db, schema } from "../../apps/server/src/db";
import { eq } from "drizzle-orm";

describe("Security Suite: Database Concurrency & Race Condition Defense (Double-Spend)", () => {
  let playerId: string;

  beforeAll(async () => {
    const testWallet = "0x2222222222222222222222222222222222222222";
    const player = await PlayerService.getOrCreateGuestPlayer(testWallet);
    playerId = player.id;
  });

  it("MENCEGAH double-crediting saat dua request penjualan item yang sama dieksekusi paralel", async () => {
    // Tangkap 1 hewan langka
    const rareAnimal = await PlayerService.recordCatch(
      playerId,
      103,
      "BERLIAN",
    );

    // Catat saldo sebelum percobaan eksploitasi
    const [initialPlayer] = await db
      .select()
      .from(schema.players)
      .where(eq(schema.players.id, playerId));
    const initialCoins = Number(initialPlayer.coins);

    // Eksploitasi: Kirim dua transaksi penjualan paralel untuk UUID yang sama
    const [res1, res2] = await Promise.all([
      PlayerService.sellAnimals(playerId, [rareAnimal.id]),
      PlayerService.sellAnimals(playerId, [rareAnimal.id]),
    ]);

    // Hanya 1 transaksi yang boleh berhasil menjual item tersebut
    const totalSoldCount = res1.soldCount + res2.soldCount;
    expect(totalSoldCount).toBe(1);

    // Saldo akhir harus tepat bertambah 1x payout, bukan 2x
    const [finalPlayer] = await db
      .select()
      .from(schema.players)
      .where(eq(schema.players.id, playerId));

    const totalCoinsEarned = res1.coinsEarned + res2.coinsEarned;
    expect(Number(finalPlayer.coins)).toBe(initialCoins + totalCoinsEarned);
  });
});
