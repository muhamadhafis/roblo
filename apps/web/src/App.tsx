import React, { useEffect } from "react";
import { GameCanvas } from "./components/game/GameCanvas";
import { useGameStore } from "./store/gameStore";

export const App: React.FC = () => {
  const {
    player,
    isConnected,
    maxDistance,
    inventory,
    carriedAnimal,
    isInThrowZone,
    isInPenZone,
    penAnimals,
    totalMps,
    errorNotice,
    connect,
    sellAnimals,
    syncAfk,
    placeInPen,
    claimPenMps,
    upgradeStat,
    clearError,
  } = useGameStore();

  useEffect(() => {
    connect();
  }, []);

  // Keyboard shortcut 'E' untuk menaruh hewan ke kandang
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "KeyE") {
        if (carriedAnimal && isInPenZone) {
          placeInPen();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [carriedAnimal, isInPenZone]);

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
            background: "rgba(15, 23, 42, 0.88)",
            backdropFilter: "blur(8px)",
            padding: "14px 20px",
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
          <div style={{ fontSize: "20px", fontWeight: 800, color: "#facc15" }}>
            🪙 {player ? Number(player.coins).toLocaleString() : "500"} Coins
          </div>
          <div style={{ fontSize: "14px", fontWeight: 600, color: "#38bdf8" }}>
            💪 Kekuatan: {player ? Number(player.strength).toFixed(1) : "0.0"}
          </div>
          <div style={{ fontSize: "13px", color: "#4ade80", fontWeight: 600 }}>
            ⚡ Passive MPS: +{totalMps.toFixed(2)}/detik
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
            onClick={() => claimPenMps()}
            style={{
              background: "#10b981",
              color: "#ffffff",
              fontWeight: 700,
              padding: "8px 14px",
              borderRadius: "8px",
              border: "none",
              cursor: "pointer",
            }}
          >
            🌾 Klaim Hasil Kandang ({penAnimals.length}/6 ekor)
          </button>

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
            💰 Jual Hewan Tas ({inventory.length})
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
        </div>
      </div>

      {/* Guide & Status Banner Tengah Bawah */}
      <div
        style={{
          position: "absolute",
          bottom: "24px",
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "8px",
          pointerEvents: "none",
          zIndex: 40,
        }}
      >
        {/* Banner Status Area Lempar */}
        <div
          style={{
            background: isInThrowZone
              ? "rgba(6, 182, 212, 0.9)"
              : "rgba(15, 23, 42, 0.85)",
            border: `2px solid ${isInThrowZone ? "#22d3ee" : "#475569"}`,
            color: "#ffffff",
            padding: "8px 24px",
            borderRadius: "24px",
            fontWeight: 700,
            fontSize: "14px",
            boxShadow: "0 4px 14px rgba(0,0,0,0.4)",
          }}
        >
          {isInThrowZone
            ? "🎯 MODE LEMPAR AKTIF: Klik pada hewan target untuk melempar makanan!"
            : "🏃 Jalan ke lingkaran Throw Pad (Area Lempar) untuk melempar"}
        </div>

        {/* Banner Kandang jika Memegang Hewan & di dekat Kandang */}
        {carriedAnimal && (
          <div
            style={{
              background: isInPenZone ? "#22c55e" : "#f59e0b",
              color: "#000000",
              fontWeight: 800,
              padding: "8px 20px",
              borderRadius: "20px",
              fontSize: "13px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
              pointerEvents: "auto",
              cursor: isInPenZone ? "pointer" : "default",
            }}
            onClick={() => {
              if (isInPenZone) placeInPen();
            }}
          >
            {isInPenZone
              ? `🐾 TEKAN [E] / KLIK DI SINI: Taruh ${carriedAnimal.grade} ke Kandang!`
              : `🐾 Memegang Hewan ${carriedAnimal.grade} — Bawa masuk ke area Pagar Kandang!`}
          </div>
        )}

        {/* Instruksi Kontrol Karakter */}
        <div
          style={{
            fontSize: "12px",
            color: "#cbd5e1",
            textShadow: "0 1px 3px rgba(0,0,0,0.8)",
          }}
        >
          [W][A][S][D] Gerak | [Shift] Lari Sprint | [Space] Melompat | [E]
          Interaksi Kandang
        </div>
      </div>

      {/* Error Toast */}
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
            padding: "8px 20px",
            borderRadius: "8px",
            fontSize: "13px",
            cursor: "pointer",
            zIndex: 50,
            fontWeight: 600,
          }}
        >
          ⚠️ {errorNotice} (Klik untuk tutup)
        </div>
      )}
    </div>
  );
};
