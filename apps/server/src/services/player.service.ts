import { eq, and, inArray, sql } from "drizzle-orm";
import { db, schema, queryClient } from "../db";
import {
  CAPS,
  calculatePayout,
  calculateFoodUpgradeCost,
  calculatePullupUpgradeCost,
  calculateAfkYield,
  GRADE_BITMASK,
  type Grade,
} from "@nomnom/shared";

export class PlayerService {
  /**
   * Mengambil atau membuat pemain baru.
   */
  public static async getOrCreateGuestPlayer(
    walletAddress: string = "0x0000000000000000000000000000000000000000",
  ) {
    const existing = await db
      .select()
      .from(schema.players)
      .where(eq(schema.players.walletAddress, walletAddress))
      .limit(1);

    if (existing.length > 0) {
      return existing[0];
    }

    const [created] = await db
      .insert(schema.players)
      .values({
        walletAddress,
        coins: "500.00",
        strength: "0.00",
        foodLevel: 1,
        pullupLevel: 1,
        luckStat: 1,
      })
      .returning();

    return created;
  }

  /**
   * Menyimpan hasil tangkapan hewan ke inventaris & memperbarui bitmask bestiary.
   */
  public static async recordCatch(
    playerId: string,
    animalId: number,
    grade: Grade,
  ) {
    // 1. Verifikasi batas kapasitas inventaris (Cap 200)
    const [invCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(schema.playerInventory)
      .where(eq(schema.playerInventory.playerId, playerId));

    if (invCount.count >= CAPS.INVENTORY_CAP_MAX) {
      throw new Error(
        `Kapasitas inventaris penuh (Maksimal ${CAPS.INVENTORY_CAP_MAX})`,
      );
    }

    // 2. Simpan hewan ke inventaris
    const [item] = await db
      .insert(schema.playerInventory)
      .values({
        playerId,
        animalId,
        grade,
        isLocked: false,
      })
      .returning();

    // 3. Update Bitmask Bestiary secara atomic
    const gradeBit = GRADE_BITMASK[grade] ?? 1;
    await queryClient`
      INSERT INTO player_bestiary (player_id, animal_id, discovered_mask, updated_at)
      VALUES (${playerId}, ${animalId}, ${gradeBit}, NOW())
      ON CONFLICT (player_id, animal_id) DO UPDATE SET
        discovered_mask = player_bestiary.discovered_mask | ${gradeBit},
        updated_at = NOW();
    `;

    return item;
  }

  /**
   * Menjual hewan ke Master Game dengan transaksi ACID dan pencatatan double-entry ledger.
   */
  public static async sellAnimals(
    playerId: string,
    inventoryIds?: string[],
    quickSellAll: boolean = false,
  ) {
    return await db.transaction(async (tx) => {
      // 1. Ambil data pemain & lock row
      const [player] = await tx
        .select()
        .from(schema.players)
        .where(eq(schema.players.id, playerId))
        .for("update");

      if (!player) throw new Error("Pemain tidak ditemukan");

      // 2. Query hewan yang akan dijual
      let itemsToSellQuery = tx
        .select({
          id: schema.playerInventory.id,
          grade: schema.playerInventory.grade,
          isLocked: schema.playerInventory.isLocked,
          basePrice: schema.animals.basePrice,
        })
        .from(schema.playerInventory)
        .innerJoin(
          schema.animals,
          eq(schema.playerInventory.animalId, schema.animals.id),
        )
        .where(
          and(
            eq(schema.playerInventory.playerId, playerId),
            eq(schema.playerInventory.isLocked, false),
          ),
        )
        .for("update");

      let candidateItems = await itemsToSellQuery;

      if (inventoryIds && inventoryIds.length > 0) {
        candidateItems = candidateItems.filter((i) =>
          inventoryIds.includes(i.id),
        );
      } else if (!quickSellAll) {
        return {
          soldCount: 0,
          coinsEarned: 0,
          newBalance: Number(player.coins),
        };
      }

      if (candidateItems.length === 0) {
        return {
          soldCount: 0,
          coinsEarned: 0,
          newBalance: Number(player.coins),
        };
      }

      // 3. Hitung total payout dengan multiplier Food Level pemain
      let totalPayout = 0;
      const idsToDelete: string[] = [];

      for (const item of candidateItems) {
        const payout = calculatePayout(
          Number(item.basePrice),
          item.grade as Grade,
          player.foodLevel,
        );
        totalPayout += payout;
        idsToDelete.push(item.id);
      }

      // 4. Hapus hewan terjual dari inventaris
      await tx
        .delete(schema.playerInventory)
        .where(inArray(schema.playerInventory.id, idsToDelete));

      // 5. Update saldo koin pemain
      const newCoins = Number(player.coins) + totalPayout;
      await tx
        .update(schema.players)
        .set({ coins: newCoins.toFixed(2), updatedAt: new Date() })
        .where(eq(schema.players.id, playerId));

      // 6. Catat mutasi pada double-entry currency ledger
      await tx.insert(schema.currencyLedger).values({
        playerId,
        currencyType: "COINS",
        deltaAmount: totalPayout.toFixed(2),
        balanceAfter: newCoins.toFixed(2),
        reason: "SELL_ANIMALS",
        referenceId: `count:${idsToDelete.length}`,
      });

      return {
        soldCount: idsToDelete.length,
        coinsEarned: totalPayout,
        newBalance: newCoins,
      };
    });
  }

  /**
   * Melakukan upgrade level dengan pengecekan Hard-Cap 100 dan saldo koin.
   */
  public static async upgradeStat(playerId: string, type: "FOOD" | "PULLUP") {
    return await db.transaction(async (tx) => {
      const [player] = await tx
        .select()
        .from(schema.players)
        .where(eq(schema.players.id, playerId))
        .for("update");

      if (!player) throw new Error("Pemain tidak ditemukan");

      const isFood = type === "FOOD";
      const currentLevel = isFood ? player.foodLevel : player.pullupLevel;
      const cap = isFood ? CAPS.FOOD_LEVEL_MAX : CAPS.PULLUP_LEVEL_MAX;

      if (currentLevel >= cap) {
        throw new Error(`Level telah mencapai batas maksimal (${cap})`);
      }

      const cost = isFood
        ? calculateFoodUpgradeCost(currentLevel)
        : calculatePullupUpgradeCost(currentLevel);

      const currentCoins = Number(player.coins);
      if (currentCoins < cost) {
        throw new Error(
          `Koin tidak mencukupi (Butuh ${cost}, Saldo: ${currentCoins})`,
        );
      }

      const newCoins = currentCoins - cost;
      const nextLevel = currentLevel + 1;

      await tx
        .update(schema.players)
        .set(
          isFood
            ? {
                foodLevel: nextLevel,
                coins: newCoins.toFixed(2),
                updatedAt: new Date(),
              }
            : {
                pullupLevel: nextLevel,
                coins: newCoins.toFixed(2),
                updatedAt: new Date(),
              },
        )
        .where(eq(schema.players.id, playerId));

      // Catat mutasi pengeluaran ke currency ledger
      await tx.insert(schema.currencyLedger).values({
        playerId,
        currencyType: "COINS",
        deltaAmount: (-cost).toFixed(2),
        balanceAfter: newCoins.toFixed(2),
        reason: `UPGRADE_${type}`,
        referenceId: `level:${nextLevel}`,
      });

      return {
        type,
        newLevel: nextLevel,
        remainingCoins: newCoins,
        cost,
      };
    });
  }

  /**
   * Melakukan kalkulasi dan sinkronisasi akumulasi tick-less AFK ke database.
   */
  public static async syncAfk(
    playerId: string,
    action: "START" | "STOP" | "CLAIM",
  ) {
    const [player] = await db
      .select()
      .from(schema.players)
      .where(eq(schema.players.id, playerId));

    if (!player) throw new Error("Pemain tidak ditemukan");

    const now = Date.now();

    if (action === "START") {
      await db
        .update(schema.players)
        .set({ isAfkActive: true, lastPullupSync: new Date() })
        .where(eq(schema.players.id, playerId));

      return {
        isAfkActive: true,
        strengthGained: 0,
        totalStrength: Number(player.strength),
      };
    }

    const startMs = new Date(player.lastPullupSync).getTime();
    const { strengthGained, deltaSeconds } = calculateAfkYield(
      startMs,
      now,
      player.pullupLevel,
    );

    const newStrength = Number(player.strength) + strengthGained;

    await db
      .update(schema.players)
      .set({
        strength: newStrength.toFixed(2),
        lastPullupSync: new Date(),
        isAfkActive: action === "STOP" ? false : player.isAfkActive,
        updatedAt: new Date(),
      })
      .where(eq(schema.players.id, playerId));

    return {
      isAfkActive: action === "STOP" ? false : player.isAfkActive,
      strengthGained,
      deltaSeconds,
      totalStrength: newStrength,
    };
  }
}
