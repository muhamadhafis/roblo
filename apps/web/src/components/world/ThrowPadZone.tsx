import React from "react";
import { useGameStore } from "../../store/gameStore";
import { CAPS } from "@nomnom/shared";

export const ThrowPadZone: React.FC = () => {
  const { isInThrowZone } = useGameStore();

  return (
    <group position={[CAPS.THROW_PAD_CENTER_X, 0.02, CAPS.THROW_PAD_CENTER_Z]}>
      {/* Lingkaran Pad Dasar */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[CAPS.THROW_PAD_RADIUS, 32]} />
        <meshStandardMaterial
          color={isInThrowZone ? "#22d3ee" : "#0284c7"}
          transparent
          opacity={0.4}
        />
      </mesh>

      {/* Ring Pembatas Neon */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry
          args={[CAPS.THROW_PAD_RADIUS - 0.15, CAPS.THROW_PAD_RADIUS, 32]}
        />
        <meshStandardMaterial
          color={isInThrowZone ? "#38bdf8" : "#0369a1"}
          emissive={isInThrowZone ? "#38bdf8" : "#0284c7"}
          emissiveIntensity={isInThrowZone ? 1.0 : 0.4}
        />
      </mesh>
    </group>
  );
};
