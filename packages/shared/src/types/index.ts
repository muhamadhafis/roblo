export type Grade = "NORMAL" | "BESAR" | "EMAS" | "BERLIAN" | "RUBI";

export interface Player {
  id: string;
  walletAddress: string | null;
  coins: number;
  gbucksBalance: number;
  strength: number;
  luckStat: number;
  foodLevel: number;
  pullupLevel: number;
  isAfkActive: boolean;
  lastPullupSync: string;
  createdAt: string;
  updatedAt: string;
}

export interface Animal {
  id: number;
  zoneId: number;
  name: string;
  basePrice: number;
  assetId: string;
}

export interface InventoryItem {
  id: string;
  playerId: string;
  animalId: number;
  grade: Grade;
  isLocked: boolean;
  caughtAt: string;
}

export interface PenAnimal {
  id: string;
  playerId: string;
  animalId: number;
  grade: Grade;
  placedAt: string;
  mpsRate: number;
}

export type WebSocketAction =
  | "THROW_FOOD"
  | "SYNC_AFK"
  | "SELL_ANIMALS"
  | "UPGRADE_STAT"
  | "GET_PLAYER"
  | "PLACE_IN_PEN"
  | "CLAIM_PEN_MPS";

export interface ClientMessage<T = unknown> {
  action: WebSocketAction;
  nonce: number;
  payload: T;
}

export interface ThrowFoodPayload {
  zoneId: number;
  distance: number;
  targetAnimalId: number;
  playerPos?: { x: number; z: number };
}

export interface PlaceInPenPayload {
  inventoryItemId: string;
  playerPos: { x: number; z: number };
}

export interface ClaimPenMpsPayload {
  playerPos?: { x: number; z: number };
}

export interface SyncAfkPayload {
  action: "START" | "STOP" | "CLAIM";
}

export interface SellAnimalsPayload {
  inventoryIds?: string[];
  quickSellAll?: boolean;
}

export interface UpgradeStatPayload {
  type: "FOOD" | "PULLUP";
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T | null;
  error: { code: string; message: string } | null;
  timestamp: number;
}
