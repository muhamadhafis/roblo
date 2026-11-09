import React, { useState, useEffect, useRef } from "react";
import { useGameStore, sanitizeThrowPower } from "../../store/gameStore";

export const PowerBar: React.FC = () => {
  const [isCharging, setIsCharging] = useState(false);
  const [currentPower, setCurrentPower] = useState(0);
  const chargeRef = useRef<number | null>(null);
  const { throwFood, maxDistance } = useGameStore();

  useEffect(() => {
    if (isCharging) {
      let power = 0;
      let direction = 1;
      const interval = setInterval(() => {
        power += 0.03 * direction;
        if (power >= 1.0) {
          power = 1.0;
          direction = -1;
        } else if (power <= 0.05) {
          power = 0.05;
          direction = 1;
        }
        setCurrentPower(power);
      }, 20);

      chargeRef.current = interval as unknown as number;
    } else {
      if (chargeRef.current) {
        clearInterval(chargeRef.current);
        chargeRef.current = null;
      }
    }

    return () => {
      if (chargeRef.current) clearInterval(chargeRef.current);
    };
  }, [isCharging]);

  const handleStart = () => {
    setIsCharging(true);
  };

  const handleRelease = () => {
    if (!isCharging) return;
    setIsCharging(false);
    const finalRatio = sanitizeThrowPower(currentPower);
    useGameStore.getState().setPowerRatio(finalRatio);
    throwFood();
    setCurrentPower(0);
  };

  // Keyboard shortcut (Space)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" && !e.repeat && !isCharging) {
        handleStart();
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space" && isCharging) {
        handleRelease();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [isCharging, currentPower]);

  const percentage = Math.round(currentPower * 100);
  const estimatedMeters = (currentPower * maxDistance).toFixed(1);

  return (
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
        userSelect: "none",
        zIndex: 50,
      }}
    >
      <div
        style={{
          color: "#ffffff",
          fontWeight: 700,
          fontSize: "14px",
          textShadow: "0 2px 4px rgba(0,0,0,0.8)",
        }}
      >
        {isCharging
          ? `Daya: ${percentage}% (~${estimatedMeters}m)`
          : "Tahan SPASI / Klik untuk Melempar"}
      </div>

      {/* Progress Bar Container */}
      <div
        onMouseDown={handleStart}
        onMouseUp={handleRelease}
        onTouchStart={handleStart}
        onTouchEnd={handleRelease}
        style={{
          width: "280px",
          height: "24px",
          backgroundColor: "rgba(0, 0, 0, 0.6)",
          border: "2px solid #ffffff",
          borderRadius: "12px",
          overflow: "hidden",
          cursor: "pointer",
          boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
        }}
      >
        <div
          style={{
            width: `${percentage}%`,
            height: "100%",
            background:
              "linear-gradient(90deg, #22c55e 0%, #eab308 60%, #ef4444 100%)",
            transition: "width 20ms linear",
          }}
        />
      </div>
    </div>
  );
};
