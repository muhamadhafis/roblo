import { Elysia, t } from "elysia";
import { cors } from "@elysiajs/cors";
import {
  PORTS,
  CAPS,
  ZONES,
  type Player,
  type InventoryItem,
  type ClientMessage,
  type ThrowFoodPayload,
  type SyncAfkPayload,
  calculateMaxDistance,
  rollAnimalGrade,
  calculatePayout,
  calculateAfkYield,
  calculateFoodUpgradeCost,
  calculatePullupUpgradeCost,
} from "@nomnom/shared";
import {
  AntiCheatValidator,
  type PlayerSecurityContext,
} from "./modules/security/anti-cheat";

// In-memory mock storage for development/test harness
const mockPlayers: Map<string, Player> = new Map();
const mockSecurityContexts: Map<string, PlayerSecurityContext> = new Map();
const mockInventories: Map<string, InventoryItem[]> = new Map();

function getOrCreatePlayer(playerId: string): {
  player: Player;
  sec: PlayerSecurityContext;
} {
  if (!mockPlayers.has(playerId)) {
    const newPlayer: Player = {
      id: playerId,
      walletAddress: null,
      coins: 500,
      gbucksBalance: 0,
      strength: 0,
      luckStat: 1,
      foodLevel: 1,
      pullupLevel: 1,
      isAfkActive: false,
      lastPullupSync: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockPlayers.set(playerId, newPlayer);

    mockSecurityContexts.set(playerId, {
      playerId,
      strength: 0,
      lastThrowTimestamp: 0,
      lastActionNonce: 0,
    });

    mockInventories.set(playerId, []);
  }

  return {
    player: mockPlayers.get(playerId)!,
    sec: mockSecurityContexts.get(playerId)!,
  };
}

export const app = new Elysia()
  .use(cors())
  .get("/health", () => ({
    status: "ok",
    port: PORTS.SERVER,
    portsConfig: {
      server: PORTS.SERVER,
      postgres: PORTS.POSTGRES,
      redis: PORTS.REDIS,
    },
    caps: {
      foodLevelMax: CAPS.FOOD_LEVEL_MAX,
      pullupLevelMax: CAPS.PULLUP_LEVEL_MAX,
      afkCapSeconds: CAPS.AFK_TIME_BASE_SECONDS,
      cooldownMs: CAPS.THROW_COOLDOWN_MS,
    },
    timestamp: Date.now(),
  }))
  .get("/api/zones", () => ({
    success: true,
    data: ZONES,
    error: null,
    timestamp: Date.now(),
  }))
  .ws("/ws", {
    open(ws) {
      const playerId = "guest-default";
      getOrCreatePlayer(playerId);
      ws.send({
        type: "CONNECTED",
        data: { playerId, serverPort: PORTS.SERVER },
      });
    },
    message(ws, message: ClientMessage) {
      const playerId = "guest-default";
      const { player, sec } = getOrCreatePlayer(playerId);
      const now = Date.now();

      // 1. Validasi Nonce
      const nonceCheck = AntiCheatValidator.validateNonce(sec, message.nonce);
      if (!nonceCheck.valid) {
        ws.send({
          success: false,
          error: { code: nonceCheck.code, message: nonceCheck.message },
          nonce: message.nonce,
        });
        return;
      }
      sec.lastActionNonce = message.nonce;

      // 2. Dispatch Berdasarkan Aksi
      switch (message.action) {
        case "THROW_FOOD": {
          const payload = message.payload as ThrowFoodPayload;

          // Cooldown check
          const cooldownCheck = AntiCheatValidator.validateThrowCooldown(
            sec,
            now,
          );
          if (!cooldownCheck.valid) {
            ws.send({
              success: false,
              error: {
                code: cooldownCheck.code,
                message: cooldownCheck.message,
              },
              nonce: message.nonce,
            });
            return;
          }

          // Zone eligibility check
          const zoneCheck = AntiCheatValidator.validateZoneAccess(
            payload.zoneId,
            player.strength,
          );
          if (!zoneCheck.valid) {
            ws.send({
              success: false,
              error: { code: zoneCheck.code, message: zoneCheck.message },
              nonce: message.nonce,
            });
            return;
          }

          // Distance reach check
          const distCheck = AntiCheatValidator.validateThrowDistance(
            payload.distance,
            player.strength,
          );
          if (!distCheck.valid) {
            ws.send({
              success: false,
              error: { code: distCheck.code, message: distCheck.message },
              nonce: message.nonce,
            });
            return;
          }

          // Lolos seluruh validasi security
          sec.lastThrowTimestamp = now;

          // Roll animal grade
          const grade = rollAnimalGrade(player.luckStat);
          const caughtItem: InventoryItem = {
            id: `inv-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            playerId: player.id,
            animalId: payload.targetAnimalId || 101,
            grade,
            isLocked: false,
            caughtAt: new Date().toISOString(),
          };

          const inventory = mockInventories.get(playerId)!;
          if (inventory.length < CAPS.INVENTORY_CAP_MAX) {
            inventory.push(caughtItem);
          }

          ws.send({
            success: true,
            data: {
              caughtItem,
              inventoryCount: inventory.length,
            },
            nonce: message.nonce,
          });
          break;
        }

        case "SYNC_AFK": {
          const payload = message.payload as SyncAfkPayload;
          if (payload.action === "START") {
            player.isAfkActive = true;
            player.lastPullupSync = new Date().toISOString();
          } else if (payload.action === "CLAIM" || payload.action === "STOP") {
            const startMs = new Date(player.lastPullupSync).getTime();
            const { strengthGained, deltaSeconds } = calculateAfkYield(
              startMs,
              now,
              player.pullupLevel,
            );

            player.strength += strengthGained;
            sec.strength = player.strength;
            player.lastPullupSync = new Date().toISOString();
            if (payload.action === "STOP") player.isAfkActive = false;

            ws.send({
              success: true,
              data: {
                strengthGained,
                deltaSeconds,
                totalStrength: player.strength,
              },
              nonce: message.nonce,
            });
            return;
          }

          ws.send({
            success: true,
            data: { isAfkActive: player.isAfkActive },
            nonce: message.nonce,
          });
          break;
        }

        case "UPGRADE_STAT": {
          const payload = message.payload as { type: "FOOD" | "PULLUP" };
          if (payload.type === "FOOD") {
            if (player.foodLevel >= CAPS.FOOD_LEVEL_MAX) {
              ws.send({
                success: false,
                error: {
                  code: "LEVEL_CAP_REACHED",
                  message: `Food level telah mencapai batas maksimal (${CAPS.FOOD_LEVEL_MAX})`,
                },
                nonce: message.nonce,
              });
              return;
            }
            const cost = calculateFoodUpgradeCost(player.foodLevel);
            if (player.coins < cost) {
              ws.send({
                success: false,
                error: {
                  code: "INSUFFICIENT_COINS",
                  message: `Koin tidak mencukupi. Butuh ${cost}`,
                },
                nonce: message.nonce,
              });
              return;
            }
            player.coins -= cost;
            player.foodLevel += 1;
          } else {
            if (player.pullupLevel >= CAPS.PULLUP_LEVEL_MAX) {
              ws.send({
                success: false,
                error: {
                  code: "LEVEL_CAP_REACHED",
                  message: `Pull-up level telah mencapai batas maksimal (${CAPS.PULLUP_LEVEL_MAX})`,
                },
                nonce: message.nonce,
              });
              return;
            }
            const cost = calculatePullupUpgradeCost(player.pullupLevel);
            if (player.coins < cost) {
              ws.send({
                success: false,
                error: {
                  code: "INSUFFICIENT_COINS",
                  message: `Koin tidak mencukupi. Butuh ${cost}`,
                },
                nonce: message.nonce,
              });
              return;
            }
            player.coins -= cost;
            player.pullupLevel += 1;
          }

          ws.send({
            success: true,
            data: {
              foodLevel: player.foodLevel,
              pullupLevel: player.pullupLevel,
              remainingCoins: player.coins,
            },
            nonce: message.nonce,
          });
          break;
        }

        case "GET_PLAYER":
        default: {
          ws.send({
            success: true,
            data: {
              player,
              maxDistance: calculateMaxDistance(player.strength),
              inventoryCount: mockInventories.get(playerId)!.length,
            },
            nonce: message.nonce,
          });
          break;
        }
      }
    },
  });

// Start listen if executed directly
if (import.meta.main) {
  app.listen(PORTS.SERVER, () => {
    console.log(`NomNom Server running at http://localhost:${PORTS.SERVER}`);
  });
}
