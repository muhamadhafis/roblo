import { describe, expect, it, beforeAll } from "bun:test";
import { PlayerService } from "../../apps/server/src/services/player.service";
import { db, schema } from "../../apps/server/src/db";
import { eq } from "drizzle-orm";
import { GRADE_BITMASK } from "@nomnom/shared";

describe("Integration Suite: Database Inventory & Bestiary Persistence", () => {
  let playerId: string;

  beforeAll(async () => {
    // Gunakan player terdedikasi untuk test integrasi
    const testWallet = "0x1111111111111111111111111111111111111111";
    const player = await PlayerService.getOrCreateGuestPlayer(testWallet);
    playerId = player.id;
  });

  it("menyimpan hewan tangkapan ke database PostgreSQL riil", async () => {
    const item = await PlayerService.recordCatch(playerId, 101, "NORMAL");

    expect(item).toBeDefined();
    expect(item.playerId).toBe(playerId);
    expect(item.animalId).toBe(101);
    expect(item.grade).toBe("NORMAL");

    // Verifikasi row tersimpan di PostgreSQL
    const [row] = await db
      .select()
      .from(schema.playerInventory)
      .where(eq(schema.playerInventory.id, item.id));

    expect(row).toBeDefined();
    expect(row.animalId).toBe(101);
  });

  it("memperbarui bitmask player_bestiary dengan operasi bitwise OR secara atomic", async () => {
    // Tangkap hewan 102 grade EMAS (bitmask 4)
    await PlayerService.recordCatch(playerId, 102, "EMAS");

    const [bestiaryRow] = await db
      .select()
      .from(schema.playerBestiary)
      .where(eq(schema.playerBestiary.animalId, 102));

    expect(bestiaryRow).toBeDefined();
    expect(bestiaryRow.discoveredMask & GRADE_BITMASK.EMAS).toBeTruthy();
  });

  it("melakukan transaksi penjualan hewan dan mencatat mutasi pada currency_ledger", async () => {
    // Tangkap 1 hewan untuk dijual
    const itemToSell = await PlayerService.recordCatch(playerId, 103, "NORMAL");

    const sellResult = await PlayerService.sellAnimals(playerId, [
      itemToSell.id,
    ]);

    expect(sellResult.soldCount).toBe(1);
    expect(sellResult.coinsEarned).toBeGreaterThan(0);

    // Verifikasi item terhapus dari tabel player_inventory
    const deletedCheck = await db
      .select()
      .from(schema.playerInventory)
      .where(eq(schema.playerInventory.id, itemToSell.id));

    expect(deletedCheck.length).toBe(0);

    // Verifikasi ledger audit mencatat mutasi COINS
    const [ledgerEntry] = await db
      .select()
      .from(schema.currencyLedger)
      .where(eq(schema.currencyLedger.playerId, playerId))
      .orderBy(schema.currencyLedger.id);

    expect(ledgerEntry).toBeDefined();
    expect(ledgerEntry.currencyType).toBe("COINS");
    expect(ledgerEntry.reason).toBe("SELL_ANIMALS");
  });
});
