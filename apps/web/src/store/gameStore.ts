import { create } from "zustand";
import type { Player, InventoryItem, ZoneConfig } from "@nomnom/shared";
import { calculateMaxDistance, ZONES, CAPS } from "@nomnom/shared";

export interface GameState {
  player: Player | null;
  zones: ZoneConfig[];
  inventory: InventoryItem[];
  selectedZoneId: number;
  maxDistance: number;
  isConnected: boolean;
  isThrowing: boolean;
  socket: WebSocket | null;
  lastCaughtItem: InventoryItem | null;
  errorNotice: string | null;

  // Roblox Movement & Interactive State
  playerPosition: { x: number; y: number; z: number };
  carriedAnimal: InventoryItem | null;
  isInThrowZone: boolean;
  isInPenZone: boolean;
  penAnimals: any[];
  totalMps: number;

  // Actions
  connect: () => void;
  setPlayerPosition: (pos: { x: number; y: number; z: number }) => void;
  setSelectedZoneId: (zoneId: number) => void;
  throwFoodAtDistance: (distance: number, targetAnimalId?: number) => void;
  placeInPen: () => void;
  claimPenMps: () => void;
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
  socket: null,
  lastCaughtItem: null,
  errorNotice: null,

  playerPosition: { x: 0, y: 0, z: 0 },
  carriedAnimal: null,
  isInThrowZone: true,
  isInPenZone: false,
  penAnimals: [],
  totalMps: 0,

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

          if (message.data.penState) {
            set({
              penAnimals: message.data.penState.animals || [],
              totalMps: message.data.penState.totalMps || 0,
            });
          }

          // Tangkapan Berhasil: Otomatis masuk ke status Carry
          if (message.data.caughtItem) {
            const item = message.data.caughtItem as InventoryItem;
            set((state) => ({
              lastCaughtItem: item,
              carriedAnimal: item,
              inventory: [item, ...state.inventory],
              isThrowing: false,
            }));
          }

          if (message.data.placedItem) {
            set((state) => ({
              carriedAnimal: null,
              penAnimals: message.data.penState?.animals || state.penAnimals,
              totalMps: message.data.penState?.totalMps || state.totalMps,
              inventory: state.inventory.filter(
                (i) => i.id !== state.carriedAnimal?.id,
              ),
            }));
          }

          if (message.data.coinsEarned !== undefined) {
            set((state) => ({
              player: state.player
                ? { ...state.player, coins: message.data.newBalance }
                : null,
            }));
          }

          if (message.data.soldCount !== undefined) {
            set((state) => ({
              player: state.player
                ? { ...state.player, coins: message.data.newBalance }
                : null,
              carriedAnimal: null,
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
          set({ errorNotice: message.error.message, isThrowing: false });
        }
      } catch (err) {
        console.error("WebSocket parse error:", err);
      }
    };

    ws.onclose = () => {
      set({ isConnected: false, socket: null });
    };
  },

  setPlayerPosition: (pos: { x: number; y: number; z: number }) => {
    const dxPad = pos.x - CAPS.THROW_PAD_CENTER_X;
    const dzPad = pos.z - CAPS.THROW_PAD_CENTER_Z;
    const inThrow =
      dxPad * dxPad + dzPad * dzPad <=
      CAPS.THROW_PAD_RADIUS * CAPS.THROW_PAD_RADIUS;

    const dxPen = pos.x - CAPS.PEN_CENTER_X;
    const dzPen = pos.z - CAPS.PEN_CENTER_Z;
    const inPen =
      dxPen * dxPen + dzPen * dzPen <= CAPS.PEN_RADIUS * CAPS.PEN_RADIUS;

    set({
      playerPosition: pos,
      isInThrowZone: inThrow,
      isInPenZone: inPen,
    });
  },

  setSelectedZoneId: (zoneId: number) => {
    set({ selectedZoneId: zoneId });
  },

  // Lempar Makanan Mode Klik (Langsung sesuai target jarak)
  throwFoodAtDistance: (distance: number, targetAnimalId?: number) => {
    const {
      socket,
      isConnected,
      maxDistance,
      selectedZoneId,
      isInThrowZone,
      playerPosition,
    } = get();
    if (!socket || !isConnected) return;

    if (!isInThrowZone) {
      set({ errorNotice: "Masuk ke dalam Throw Pad untuk melempar makanan!" });
      return;
    }

    const safeDistance = Math.min(maxDistance, Math.max(1.0, distance));
    set({ isThrowing: true });

    socket.send(
      JSON.stringify({
        action: "THROW_FOOD",
        nonce: actionNonce++,
        payload: {
          zoneId: selectedZoneId,
          distance: safeDistance,
          targetAnimalId: targetAnimalId || 101,
          playerPos: { x: playerPosition.x, z: playerPosition.z },
        },
      }),
    );
  },

  // Menaruh Hewan yang Sedang Dipegang ke Kandang
  placeInPen: () => {
    const { socket, isConnected, carriedAnimal, isInPenZone, playerPosition } =
      get();
    if (!socket || !isConnected || !carriedAnimal) return;

    if (!isInPenZone) {
      set({
        errorNotice: "Bawa hewan mendekat ke pagar kandang untuk menaruhnya!",
      });
      return;
    }

    socket.send(
      JSON.stringify({
        action: "PLACE_IN_PEN",
        nonce: actionNonce++,
        payload: {
          inventoryItemId: carriedAnimal.id,
          playerPos: { x: playerPosition.x, z: playerPosition.z },
        },
      }),
    );
  },

  // Klaim passive MPS
  claimPenMps: () => {
    const { socket, isConnected } = get();
    if (!socket || !isConnected) return;

    socket.send(
      JSON.stringify({
        action: "CLAIM_PEN_MPS",
        nonce: actionNonce++,
        payload: {},
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
