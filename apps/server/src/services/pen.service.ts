import { eq, sql } from "drizzle-orm";
import { db, schema } from "../db";
import {
  CAPS,
  calculateAnimalMps,
  calculatePenYield,
  type Grade,
} from "@nomnom/shared";

export class PenService {
  /**
   * Mengambil seluruh hewan yang ada di dalam kandang pemain beserta total akumulasi MPS.
   */
  public static async getPenState(playerId: string) {
    const animalsInPen = await db
      .select({
        id: schema.penAnimals.id,
        animalId: schema.penAnimals.animalId,
        grade: schema.penAnimals.grade,
        mpsRate: schema.penAnimals.mpsRate,
        placedAt: schema.penAnimals.placedAt,
        animalName: schema.animals.name,
        assetId: schema.animals.assetId,
      })
      .from(schema.penAnimals)
      .innerJoin(
        schema.animals,
        eq(schema.penAnimals.animalId, schema.animals.id),
      )
      .where(eq(schema.penAnimals.playerId, playerId));

    let totalMps = 0;
    for (const a of animalsInPen) {
      totalMps += Number(a.mpsRate);
    }

    return {
      animals: animalsInPen,
      totalMps: Number(totalMps.toFixed(2)),
      capacityUsed: animalsInPen.length,
      capacityMax: CAPS.PEN_CAPACITY_BASE,
    };
  }

  /**
   * Menaruh hewan yang sedang dipegang/berada di inventaris ke dalam kandang.
   */
  public static async placeAnimalInPen(
    playerId: string,
    inventoryItemId: string,
  ) {
    return await db.transaction(async (tx) => {
      // 1. Cek kapasitas kandang pemain
      const [countResult] = await tx
        .select({ count: sql<number>`count(*)::int` })
        .from(schema.penAnimals)
        .where(eq(schema.penAnimals.playerId, playerId));

      if (countResult.count >= CAPS.PEN_CAPACITY_BASE) {
        throw new Error(
          `Kandang penuh! Kapasitas maksimal adalah ${CAPS.PEN_CAPACITY_BASE} ekor`,
        );
      }

      // 2. Ambil data hewan dari inventaris (dengan FOR UPDATE untuk mencegah double-spend)
      const [invItem] = await tx
        .select({
          id: schema.playerInventory.id,
          animalId: schema.playerInventory.animalId,
          grade: schema.playerInventory.grade,
          isLocked: schema.playerInventory.isLocked,
          basePrice: schema.animals.basePrice,
        })
        .from(schema.playerInventory)
        .innerJoin(
          schema.animals,
          eq(schema.playerInventory.animalId, schema.animals.id),
        )
        .where(eq(schema.playerInventory.id, inventoryItemId))
        .for("update");

      if (!invItem) {
        throw new Error("Hewan tidak ditemukan di dalam inventaris pemain");
      }

      // 3. Ambil data player untuk menghitung bonus MPS dari foodLevel
      const [player] = await tx
        .select()
        .from(schema.players)
        .where(eq(schema.players.id, playerId));

      if (!player) throw new Error("Pemain tidak ditemukan");

      const mpsRate = calculateAnimalMps(
        Number(invItem.basePrice),
        invItem.grade as Grade,
        player.foodLevel,
      );

      // 4. Hapus dari inventaris
      await tx
        .delete(schema.playerInventory)
        .where(eq(schema.playerInventory.id, inventoryItemId));

      // 5. Masukkan ke tabel pen_animals
      const [placed] = await tx
        .insert(schema.penAnimals)
        .values({
          playerId,
          animalId: invItem.animalId,
          grade: invItem.grade,
          mpsRate: mpsRate.toFixed(2),
        })
        .returning();

      return {
        placedItem: placed,
        mpsRate,
      };
    });
  }

  /**
   * Mengklaim akumulasi koin pasif dari kandang (tick-less).
   */
  public static async claimPenYield(playerId: string) {
    return await db.transaction(async (tx) => {
      const [player] = await tx
        .select()
        .from(schema.players)
        .where(eq(schema.players.id, playerId))
        .for("update");

      if (!player) throw new Error("Pemain tidak ditemukan");

      const animalsInPen = await tx
        .select()
        .from(schema.penAnimals)
        .where(eq(schema.penAnimals.playerId, playerId));

      let totalMps = 0;
      for (const a of animalsInPen) {
        totalMps += Number(a.mpsRate);
      }

      const now = Date.now();
      const lastClaimMs = new Date(player.lastPenMpsClaim).getTime();
      const { deltaSeconds, coinsEarned } = calculatePenYield(
        totalMps,
        lastClaimMs,
        now,
      );

      if (coinsEarned <= 0) {
        return {
          deltaSeconds,
          coinsEarned: 0,
          newBalance: Number(player.coins),
          totalMps,
        };
      }

      const newCoins = Number(player.coins) + coinsEarned;

      await tx
        .update(schema.players)
        .set({
          coins: newCoins.toFixed(2),
          lastPenMpsClaim: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(schema.players.id, playerId));

      // Catat di currency ledger
      await tx.insert(schema.currencyLedger).values({
        playerId,
        currencyType: "COINS",
        deltaAmount: coinsEarned.toFixed(2),
        balanceAfter: newCoins.toFixed(2),
        reason: "PEN_MPS_YIELD",
        referenceId: `seconds:${deltaSeconds}`,
      });

      return {
        deltaSeconds,
        coinsEarned,
        newBalance: newCoins,
        totalMps,
      };
    });
  }
}
