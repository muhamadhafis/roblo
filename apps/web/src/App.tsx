import React, { useEffect } from "react";
import { GameCanvas } from "./components/game/GameCanvas";
import { PowerBar } from "./components/game/PowerBar";
import { useGameStore } from "./store/gameStore";

export const App: React.FC = () => {
  const {
    player,
    isConnected,
    maxDistance,
    inventory,
    lastCaughtItem,
    errorNotice,
    connect,
    sellAnimals,
    syncAfk,
    upgradeStat,
    clearError,
  } = useGameStore();

  useEffect(() => {
    connect();
  }, []);

  return (
    <div
      style={{
        position: "relative",
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
      }}
    >
      {/* 3D WebGL Canvas Viewport */}
      <GameCanvas />

      {/* Top HUD: Player Stats */}
      <div
        style={{
          position: "absolute",
          top: "16px",
          left: "16px",
          right: "16px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          pointerEvents: "none",
          zIndex: 40,
        }}
      >
        {/* Stat Box Kiri */}
        <div
          style={{
            background: "rgba(15, 23, 42, 0.85)",
            backdropFilter: "blur(8px)",
            padding: "12px 18px",
            borderRadius: "12px",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            color: "#f8fafc",
            display: "flex",
            flexDirection: "column",
            gap: "6px",
            pointerEvents: "auto",
          }}
        >
          <div
            style={{
              fontSize: "12px",
              color: isConnected ? "#4ade80" : "#f87171",
            }}
          >
            ● {isConnected ? "Server Online (Port 3444)" : "Terputus"}
          </div>
          <div style={{ fontSize: "18px", fontWeight: 800, color: "#facc15" }}>
            🪙 {player ? Number(player.coins).toLocaleString() : "500"} Coins
          </div>
          <div style={{ fontSize: "14px", fontWeight: 600, color: "#38bdf8" }}>
            💪 Kekuatan: {player ? Number(player.strength).toFixed(1) : "0.0"}
          </div>
          <div style={{ fontSize: "12px", color: "#94a3b8" }}>
            🎯 Jangkauan Maks: {maxDistance} m
          </div>
        </div>

        {/* Action Controls Kanan */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "8px",
            pointerEvents: "auto",
          }}
        >
          <button
            onClick={() => sellAnimals(true)}
            style={{
              background: "#eab308",
              color: "#000000",
              fontWeight: 700,
              padding: "8px 14px",
              borderRadius: "8px",
              border: "none",
              cursor: "pointer",
            }}
          >
            💰 Jual Hewan ({inventory.length})
          </button>

          <button
            onClick={() => syncAfk(player?.isAfkActive ? "CLAIM" : "START")}
            style={{
              background: player?.isAfkActive ? "#22c55e" : "#3b82f6",
              color: "#ffffff",
              fontWeight: 700,
              padding: "8px 14px",
              borderRadius: "8px",
              border: "none",
              cursor: "pointer",
            }}
          >
            🏋️ {player?.isAfkActive ? "Klaim Pull-Up AFK" : "Mulai Pull-Up AFK"}
          </button>

          <button
            onClick={() => upgradeStat("FOOD")}
            style={{
              background: "#8b5cf6",
              color: "#ffffff",
              fontWeight: 600,
              padding: "6px 12px",
              borderRadius: "8px",
              border: "none",
              cursor: "pointer",
              fontSize: "12px",
            }}
          >
            🍱 Upgrade Food (Lv. {player?.foodLevel ?? 1}/100)
          </button>

          <button
            onClick={() => upgradeStat("PULLUP")}
            style={{
              background: "#ec4899",
              color: "#ffffff",
              fontWeight: 600,
              padding: "6px 12px",
              borderRadius: "8px",
              border: "none",
              cursor: "pointer",
              fontSize: "12px",
            }}
          >
            ⚡ Upgrade Pull-Up (Lv. {player?.pullupLevel ?? 1}/100)
          </button>
        </div>
      </div>

      {/* Tangkapan Terakhir Toast */}
      {lastCaughtItem && (
        <div
          style={{
            position: "absolute",
            top: "120px",
            left: "50%",
            transform: "translateX(-50%)",
            background: "rgba(0, 0, 0, 0.85)",
            border: "2px solid #f59e0b",
            color: "#ffffff",
            padding: "8px 20px",
            borderRadius: "20px",
            fontWeight: 700,
            zIndex: 45,
          }}
        >
          🎉 Mendapatkan Hewan Grade: {lastCaughtItem.grade}!
        </div>
      )}

      {/* Error Notice */}
      {errorNotice && (
        <div
          onClick={clearError}
          style={{
            position: "absolute",
            top: "80px",
            left: "50%",
            transform: "translateX(-50%)",
            background: "#ef4444",
            color: "#ffffff",
            padding: "6px 16px",
            borderRadius: "8px",
            fontSize: "13px",
            cursor: "pointer",
            zIndex: 50,
          }}
        >
          ⚠️ {errorNotice} (Klik untuk tutup)
        </div>
      )}

      {/* Bottom HUD: Power Throw Bar */}
      <PowerBar />
    </div>
  );
};
