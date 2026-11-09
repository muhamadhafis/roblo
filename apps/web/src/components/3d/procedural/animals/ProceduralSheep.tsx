import React from "react";
import type { EntityMaterialSet } from "../../materials/GradeMaterialFactory";

interface ProceduralSheepProps {
  materials: EntityMaterialSet;
  animationState?: "idle" | "eat" | "throw" | "pullup";
}

export const ProceduralSheep: React.FC<ProceduralSheepProps> = ({
  materials,
}) => {
  return (
    <group>
      {/* Badan Berbulu (Kubus Besar Putih) */}
      <mesh position={[0, 0.45, 0]} material={materials.body}>
        <boxGeometry args={[0.7, 0.6, 0.9]} />
      </mesh>

      {/* Kepala Domba (Warna Hitam) */}
      <mesh position={[0, 0.6, 0.5]} material={materials.accentBlack}>
        <boxGeometry args={[0.35, 0.35, 0.4]} />
      </mesh>

      {/* Telinga Kiri & Kanan */}
      <mesh position={[-0.22, 0.62, 0.45]} material={materials.accentBlack}>
        <boxGeometry args={[0.15, 0.08, 0.08]} />
      </mesh>
      <mesh position={[0.22, 0.62, 0.45]} material={materials.accentBlack}>
        <boxGeometry args={[0.15, 0.08, 0.08]} />
      </mesh>

      {/* 4 Kaki (Warna Hitam) */}
      <mesh position={[-0.22, 0.12, 0.3]} material={materials.accentBlack}>
        <cylinderGeometry args={[0.04, 0.04, 0.25]} />
      </mesh>
      <mesh position={[0.22, 0.12, 0.3]} material={materials.accentBlack}>
        <cylinderGeometry args={[0.04, 0.04, 0.25]} />
      </mesh>
      <mesh position={[-0.22, 0.12, -0.3]} material={materials.accentBlack}>
        <cylinderGeometry args={[0.04, 0.04, 0.25]} />
      </mesh>
      <mesh position={[0.22, 0.12, -0.3]} material={materials.accentBlack}>
        <cylinderGeometry args={[0.04, 0.04, 0.25]} />
      </mesh>
    </group>
  );
};
