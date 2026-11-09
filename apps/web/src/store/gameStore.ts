import { create } from "zustand";
import type { Player, InventoryItem, Grade, ZoneConfig } from "@nomnom/shared";
import { calculateMaxDistance, ZONES } from "@nomnom/shared";

export interface GameState {
  player: Player | null;
  zones: ZoneConfig[];
  inventory: InventoryItem[];
  selectedZoneId: number;
  maxDistance: number;
  isConnected: boolean;
  isThrowing: boolean;
  powerRatio: number;
  socket: WebSocket | null;
  lastCaughtItem: InventoryItem | null;
  errorNotice: string | null;

  // Actions
  connect: () => void;
  setPowerRatio: (ratio: number) => void;
  setSelectedZoneId: (zoneId: number) => void;
  throwFood: (targetAnimalId?: number) => void;
  syncAfk: (action: "START" | "STOP" | "CLAIM") => void;
  sellAnimals: (quickSellAll?: boolean) => void;
  upgradeStat: (type: "FOOD" | "PULLUP") => void;
  clearError: () => void;
}

let actionNonce = 1;

export function sanitizeThrowPower(rawRatio: number): number {
  if (isNaN(rawRatio) || !isFinite(rawRatio)) return 0.1;
  return Math.min(1.0, Math.max(0.05, Number(rawRatio.toFixed(3))));
}

export const useGameStore = create<GameState>((set, get) => ({
  player: null,
  zones: [...ZONES],
  inventory: [],
  selectedZoneId: 1,
  maxDistance: 20,
  isConnected: false,
  isThrowing: false,
  powerRatio: 0,
  socket: null,
  lastCaughtItem: null,
  errorNotice: null,

  connect: () => {
    const wsUrl = "ws://localhost:3444/ws";
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      set({ isConnected: true, socket: ws });
      ws.send(
        JSON.stringify({
          action: "GET_PLAYER",
          nonce: actionNonce++,
          payload: {},
        }),
      );
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);

        if (message.type === "CONNECTED" && message.data?.player) {
          const p = message.data.player;
          set({
            player: p,
            maxDistance: calculateMaxDistance(Number(p.strength)),
          });
        }

        if (message.success && message.data) {
          if (message.data.player) {
            const p = message.data.player;
            set({
              player: p,
              maxDistance: calculateMaxDistance(Number(p.strength)),
            });
          }

          if (message.data.caughtItem) {
            const item = message.data.caughtItem as InventoryItem;
            set((state) => ({
              lastCaughtItem: item,
              inventory: [item, ...state.inventory],
            }));
          }

          if (message.data.soldCount !== undefined) {
            set((state) => ({
              player: state.player
                ? { ...state.player, coins: message.data.newBalance }
                : null,
              inventory: [],
            }));
          }

          if (message.data.foodLevel !== undefined) {
            set((state) => ({
              player: state.player
                ? {
                    ...state.player,
                    foodLevel: message.data.foodLevel,
                    pullupLevel: message.data.pullupLevel,
                    coins: message.data.remainingCoins,
                  }
                : null,
            }));
          }

          if (message.data.totalStrength !== undefined) {
            set((state) => ({
              player: state.player
                ? {
                    ...state.player,
                    strength: message.data.totalStrength,
                    isAfkActive: message.data.isAfkActive,
                  }
                : null,
              maxDistance: calculateMaxDistance(message.data.totalStrength),
            }));
          }
        } else if (message.error) {
          set({ errorNotice: message.error.message });
        }
      } catch (err) {
        console.error("WebSocket parse error:", err);
      }
    };

    ws.onclose = () => {
      set({ isConnected: false, socket: null });
    };
  },

  setPowerRatio: (ratio: number) => {
    set({ powerRatio: sanitizeThrowPower(ratio) });
  },

  setSelectedZoneId: (zoneId: number) => {
    set({ selectedZoneId: zoneId });
  },

  throwFood: (targetAnimalId?: number) => {
    const { socket, isConnected, maxDistance, powerRatio, selectedZoneId } =
      get();
    if (!socket || !isConnected) return;

    const safeRatio = sanitizeThrowPower(powerRatio);
    const distance = Number((safeRatio * maxDistance).toFixed(2));

    socket.send(
      JSON.stringify({
        action: "THROW_FOOD",
        nonce: actionNonce++,
        payload: {
          zoneId: selectedZoneId,
          distance,
          targetAnimalId: targetAnimalId || 101,
        },
      }),
    );
  },

  syncAfk: (action: "START" | "STOP" | "CLAIM") => {
    const { socket, isConnected } = get();
    if (!socket || !isConnected) return;

    socket.send(
      JSON.stringify({
        action: "SYNC_AFK",
        nonce: actionNonce++,
        payload: { action },
      }),
    );
  },

  sellAnimals: (quickSellAll: boolean = true) => {
    const { socket, isConnected } = get();
    if (!socket || !isConnected) return;

    socket.send(
      JSON.stringify({
        action: "SELL_ANIMALS",
        nonce: actionNonce++,
        payload: { quickSellAll },
      }),
    );
  },

  upgradeStat: (type: "FOOD" | "PULLUP") => {
    const { socket, isConnected } = get();
    if (!socket || !isConnected) return;

    socket.send(
      JSON.stringify({
        action: "UPGRADE_STAT",
        nonce: actionNonce++,
        payload: { type },
      }),
    );
  },

  clearError: () => set({ errorNotice: null }),
}));
