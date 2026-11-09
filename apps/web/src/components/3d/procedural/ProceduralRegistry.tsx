import React from "react";
import type { EntityMaterialSet } from "../materials/GradeMaterialFactory";
import { ProceduralChicken } from "./animals/ProceduralChicken";
import { ProceduralRabbit } from "./animals/ProceduralRabbit";
import { ProceduralSheep } from "./animals/ProceduralSheep";
import { ProceduralBurger } from "./foods/ProceduralBurger";

interface ProceduralRegistryProps {
  category: "animal" | "food" | "player";
  assetId: string;
  materials: EntityMaterialSet;
  animationState?: "idle" | "eat" | "throw" | "pullup";
}

export const ProceduralRegistry: React.FC<ProceduralRegistryProps> = ({
  category,
  assetId,
  materials,
  animationState = "idle",
}) => {
  if (category === "animal") {
    switch (assetId.toLowerCase()) {
      case "chicken":
      case "ayam":
        return (
          <ProceduralChicken
            materials={materials}
            animationState={animationState}
          />
        );
      case "rabbit":
      case "kelinci":
        return (
          <ProceduralRabbit
            materials={materials}
            animationState={animationState}
          />
        );
      case "sheep":
      case "domba":
        return (
          <ProceduralSheep
            materials={materials}
            animationState={animationState}
          />
        );
      default:
        return (
          <mesh material={materials.body}>
            <boxGeometry args={[0.5, 0.5, 0.5]} />
          </mesh>
        );
    }
  }

  if (category === "food") {
    switch (assetId.toLowerCase()) {
      case "burger":
      default:
        return (
          <ProceduralBurger
            materials={materials}
            animationState={animationState}
          />
        );
    }
  }

  // Karakter Default Player (Blocky figure)
  return (
    <group>
      {/* Badan */}
      <mesh position={[0, 0.6, 0]} material={materials.body}>
        <boxGeometry args={[0.5, 0.7, 0.3]} />
      </mesh>
      {/* Kepala */}
      <mesh position={[0, 1.15, 0]} material={materials.accentYellow}>
        <boxGeometry args={[0.35, 0.35, 0.35]} />
      </mesh>
      {/* Tangan Kiri & Kanan */}
      <mesh position={[-0.35, 0.6, 0]} material={materials.body}>
        <boxGeometry args={[0.18, 0.65, 0.2]} />
      </mesh>
      <mesh position={[0.35, 0.6, 0]} material={materials.body}>
        <boxGeometry args={[0.18, 0.65, 0.2]} />
      </mesh>
      {/* Kaki Kiri & Kanan */}
      <mesh position={[-0.14, 0.15, 0]} material={materials.accentBlack}>
        <boxGeometry args={[0.2, 0.45, 0.25]} />
      </mesh>
      <mesh position={[0.14, 0.15, 0]} material={materials.accentBlack}>
        <boxGeometry args={[0.2, 0.45, 0.25]} />
      </mesh>
    </group>
  );
};
