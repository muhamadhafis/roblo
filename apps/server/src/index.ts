import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import {
  PORTS,
  CAPS,
  ZONES,
  type ClientMessage,
  type ThrowFoodPayload,
  type SyncAfkPayload,
  type SellAnimalsPayload,
  type UpgradeStatPayload,
  type PlaceInPenPayload,
  type ClaimPenMpsPayload,
  calculateMaxDistance,
  rollAnimalGrade,
} from "@nomnom/shared";
import {
  AntiCheatValidator,
  type PlayerSecurityContext,
} from "./modules/security/anti-cheat";
import { PlayerService } from "./services/player.service";
import { PenService } from "./services/pen.service";

const securityContexts: Map<string, PlayerSecurityContext> = new Map();

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
    async open(ws) {
      try {
        const player = await PlayerService.getOrCreateGuestPlayer();
        const playerId = player.id;

        if (!securityContexts.has(playerId)) {
          securityContexts.set(playerId, {
            playerId,
            strength: Number(player.strength),
            lastThrowTimestamp: 0,
            lastActionNonce: 0,
          });
        }

        ws.send({
          type: "CONNECTED",
          data: {
            player,
            serverPort: PORTS.SERVER,
            maxDistance: calculateMaxDistance(Number(player.strength)),
          },
        });
      } catch (err: any) {
        ws.send({
          type: "ERROR",
          error: { code: "INIT_FAILED", message: err.message },
        });
      }
    },
    async message(ws, message: ClientMessage) {
      try {
        const player = await PlayerService.getOrCreateGuestPlayer();
        const playerId = player.id;
        let sec = securityContexts.get(playerId);

        if (!sec) {
          sec = {
            playerId,
            strength: Number(player.strength),
            lastThrowTimestamp: 0,
            lastActionNonce: 0,
          };
          securityContexts.set(playerId, sec);
        }

        const now = Date.now();

        // 1. Validasi Nonce Sekuensial
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

        // 2. Dispatch Aksi Game
        switch (message.action) {
          case "THROW_FOOD": {
            const payload = message.payload as ThrowFoodPayload;

            // Validasi Cooldown
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

            // Validasi Jangkauan Kekuatan
            const distCheck = AntiCheatValidator.validateThrowDistance(
              payload.distance,
              Number(player.strength),
            );
            if (!distCheck.valid) {
              ws.send({
                success: false,
                error: { code: distCheck.code, message: distCheck.message },
                nonce: message.nonce,
              });
              return;
            }

            // Validasi Area Lempar (Throw Pad Proximity)
            if (payload.playerPos) {
              const padCheck = AntiCheatValidator.validateThrowPadProximity(
                payload.playerPos,
              );
              if (!padCheck.valid) {
                ws.send({
                  success: false,
                  error: { code: padCheck.code, message: padCheck.message },
                  nonce: message.nonce,
                });
                return;
              }
            }

            // Validasi Akses Zona
            const zoneCheck = AntiCheatValidator.validateZoneAccess(
              payload.zoneId,
              Number(player.strength),
            );
            if (!zoneCheck.valid) {
              ws.send({
                success: false,
                error: { code: zoneCheck.code, message: zoneCheck.message },
                nonce: message.nonce,
              });
              return;
            }

            sec.lastThrowTimestamp = now;

            // Roll grade berdasarkan Luck stat
            const grade = rollAnimalGrade(player.luckStat);
            const targetAnimalId = payload.targetAnimalId || 101;

            // Simpan ke PostgreSQL
            const savedItem = await PlayerService.recordCatch(
              player.id,
              targetAnimalId,
              grade,
            );

            ws.send({
              success: true,
              data: {
                caughtItem: savedItem,
              },
              nonce: message.nonce,
            });
            break;
          }

          case "SELL_ANIMALS": {
            const payload = message.payload as SellAnimalsPayload;
            const sellResult = await PlayerService.sellAnimals(
              player.id,
              payload?.inventoryIds,
              payload?.quickSellAll ?? false,
            );

            ws.send({
              success: true,
              data: sellResult,
              nonce: message.nonce,
            });
            break;
          }

          case "UPGRADE_STAT": {
            const payload = message.payload as UpgradeStatPayload;
            const upgradeResult = await PlayerService.upgradeStat(
              player.id,
              payload.type,
            );

            ws.send({
              success: true,
              data: upgradeResult,
              nonce: message.nonce,
            });
            break;
          }

          case "SYNC_AFK": {
            const payload = message.payload as SyncAfkPayload;
            const afkResult = await PlayerService.syncAfk(
              player.id,
              payload.action,
            );
            sec.strength = afkResult.totalStrength;

            ws.send({
              success: true,
              data: afkResult,
              nonce: message.nonce,
            });
            break;
          }

          case "PLACE_IN_PEN": {
            const payload = message.payload as PlaceInPenPayload;

            // Validasi proximity pemain ke kandang
            const penProximityCheck = AntiCheatValidator.validatePenProximity(
              payload.playerPos,
            );
            if (!penProximityCheck.valid) {
              ws.send({
                success: false,
                error: {
                  code: penProximityCheck.code,
                  message: penProximityCheck.message,
                },
                nonce: message.nonce,
              });
              return;
            }

            const result = await PenService.placeAnimalInPen(
              player.id,
              payload.inventoryItemId,
            );
            const penState = await PenService.getPenState(player.id);

            ws.send({
              success: true,
              data: {
                placedItem: result.placedItem,
                mpsRate: result.mpsRate,
                penState,
              },
              nonce: message.nonce,
            });
            break;
          }

          case "CLAIM_PEN_MPS": {
            const result = await PenService.claimPenYield(player.id);
            ws.send({
              success: true,
              data: result,
              nonce: message.nonce,
            });
            break;
          }

          case "GET_PLAYER":
          default: {
            const penState = await PenService.getPenState(player.id);
            ws.send({
              success: true,
              data: {
                player,
                maxDistance: calculateMaxDistance(Number(player.strength)),
                penState,
              },
              nonce: message.nonce,
            });
            break;
          }
        }
      } catch (err: any) {
        ws.send({
          success: false,
          error: { code: "SERVER_ERROR", message: err.message },
          nonce: message.nonce,
        });
      }
    },
  });

if (import.meta.main) {
  app.listen(PORTS.SERVER, () => {
    console.log(`NomNom Server running at http://localhost:${PORTS.SERVER}`);
  });
}
