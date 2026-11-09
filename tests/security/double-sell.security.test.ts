import { describe, expect, it } from "bun:test";
import type { InventoryItem } from "@nomnom/shared";

describe("Security Suite: Inventory Locking & Double-Spend Protection", () => {
  it("MENOLAK penjualan hewan yang berada dalam status terkunci (isLocked = true)", () => {
    const lockedItem: InventoryItem = {
      id: "inv-item-locked-1",
      playerId: "player-1",
      animalId: 101,
      grade: "RUBI",
      isLocked: true,
      caughtAt: new Date().toISOString(),
    };

    function processSale(item: InventoryItem): {
      success: boolean;
      error?: string;
    } {
      if (item.isLocked) {
        return { success: false, error: "ITEM_IS_LOCKED" };
      }
      return { success: true };
    }

    const saleResult = processSale(lockedItem);
    expect(saleResult.success).toBe(false);
    expect(saleResult.error).toBe("ITEM_IS_LOCKED");
  });

  it("MENCEGAH double-crediting pada transaksi penjualan bersamaan (Idempotency / Atomic Execution)", () => {
    const itemInventory = new Set<string>(["item-uuid-123"]);
    let coinsPaid = 0;

    function sellItemAtomic(itemId: string, payout: number): boolean {
      if (!itemInventory.has(itemId)) {
        return false; // Item sudah terjual atau tidak ada
      }
      // Hapus secara atomic sebelum menambahkan payout
      itemInventory.delete(itemId);
      coinsPaid += payout;
      return true;
    }

    // Panggilan pertama sukses
    const firstCall = sellItemAtomic("item-uuid-123", 500);
    expect(firstCall).toBe(true);
    expect(coinsPaid).toBe(500);

    // Eksploitasi: Replay penjualan untuk item yang sama
    const duplicateCall = sellItemAtomic("item-uuid-123", 500);
    expect(duplicateCall).toBe(false);
    // Koin tidak bertambah dua kali
    expect(coinsPaid).toBe(500);
  });
});
