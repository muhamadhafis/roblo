import React from "react";
import type { EntityMaterialSet } from "../../materials/GradeMaterialFactory";

interface ProceduralBurgerProps {
  materials: EntityMaterialSet;
  animationState?: "idle" | "eat" | "throw" | "pullup";
}

export const ProceduralBurger: React.FC<ProceduralBurgerProps> = ({
  materials,
}) => {
  return (
    <group>
      {/* Roti Bawah (Bun Bottom) */}
      <mesh position={[0, 0.06, 0]} material={materials.accentYellow}>
        <cylinderGeometry args={[0.2, 0.2, 0.08, 16]} />
      </mesh>

      {/* Daging Burger (Patty) */}
      <mesh position={[0, 0.13, 0]} material={materials.accentBlack}>
        <cylinderGeometry args={[0.22, 0.22, 0.06, 16]} />
      </mesh>

      {/* Keju / Saus Merah */}
      <mesh position={[0, 0.17, 0]} material={materials.accentRed}>
        <boxGeometry args={[0.28, 0.02, 0.28]} />
      </mesh>

      {/* Roti Atas Kubah (Bun Top) */}
      <mesh position={[0, 0.23, 0]} material={materials.accentYellow}>
        <sphereGeometry args={[0.21, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
      </mesh>
    </group>
  );
};
