import React from "react";
import { EntityRenderer } from "../3d/EntityRenderer";
import { useGameStore } from "../../store/gameStore";
import { CAPS } from "@nomnom/shared";

const animalAssetMapping: Record<number, string> = {
  101: "rabbit",
  102: "chicken",
  103: "sheep",
};

export const AnimalPenZone: React.FC = () => {
  const { penAnimals, isInPenZone, carriedAnimal, placeInPen } = useGameStore();

  const centerX = CAPS.PEN_CENTER_X; // 10
  const centerZ = CAPS.PEN_CENTER_Z; // 0

  return (
    <group position={[centerX, 0, centerZ]}>
      {/* Lantai Jerami Kandang */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <circleGeometry args={[CAPS.PEN_RADIUS, 32]} />
        <meshStandardMaterial
          color={isInPenZone ? "#fef08a" : "#d97706"}
          roughness={0.9}
          transparent
          opacity={0.6}
        />
      </mesh>

      {/* Pagar Kayu Melingkar (Fence Posts) */}
      {Array.from({ length: 12 }).map((_, i) => {
        const angle = (i / 12) * Math.PI * 2;
        // Berikan celah gerbang di sudut yang menghadap tengah (angle dekat PI)
        if (Math.abs(angle - Math.PI) < 0.4) return null;

        const x = Math.cos(angle) * CAPS.PEN_RADIUS;
        const z = Math.sin(angle) * CAPS.PEN_RADIUS;

        return (
          <group key={i} position={[x, 0.5, z]}>
            <mesh>
              <cylinderGeometry args={[0.08, 0.08, 1.0]} />
              <meshStandardMaterial color="#78350f" roughness={0.8} />
            </mesh>
          </group>
        );
      })}

      {/* Hewan-Hewan di Dalam Kandang Penghasil MPS */}
      {penAnimals.map((animal, idx) => {
        const offsetAngle =
          (idx / Math.max(1, penAnimals.length)) * Math.PI * 2;
        const radiusOffset = 1.2 + (idx % 2) * 0.8;
        const x = Math.cos(offsetAngle) * radiusOffset;
        const z = Math.sin(offsetAngle) * radiusOffset;

        return (
          <group key={animal.id || idx} position={[x, 0, z]}>
            <EntityRenderer
              category="animal"
              assetId={animalAssetMapping[animal.animalId] || "chicken"}
              grade={animal.grade}
              scale={0.7}
              animationState="idle"
            />
          </group>
        );
      })}

      {/* Interaksi Klik Langsung ke Kandang untuk Menaruh Hewan */}
      {carriedAnimal && isInPenZone && (
        <mesh position={[0, 1.5, 0]} onClick={() => placeInPen()}>
          <boxGeometry args={[2.5, 0.8, 0.1]} />
          <meshBasicMaterial color="#22c55e" />
        </mesh>
      )}
    </group>
  );
};
