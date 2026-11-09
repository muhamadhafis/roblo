import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { EntityMaterialSet } from "../../materials/GradeMaterialFactory";

interface ProceduralChickenProps {
  materials: EntityMaterialSet;
  animationState?: "idle" | "eat" | "throw" | "pullup";
}

export const ProceduralChicken: React.FC<ProceduralChickenProps> = ({
  materials,
  animationState = "idle",
}) => {
  const headRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (animationState === "idle" && headRef.current) {
      headRef.current.position.y =
        0.6 + Math.sin(state.clock.elapsedTime * 6) * 0.04;
    }
  });

  return (
    <group>
      {/* Badan Kubus */}
      <mesh position={[0, 0.4, 0]} material={materials.body}>
        <boxGeometry args={[0.6, 0.5, 0.7]} />
      </mesh>

      {/* Kepala & Paruh */}
      <group ref={headRef} position={[0, 0.6, 0.3]}>
        <mesh material={materials.body}>
          <boxGeometry args={[0.35, 0.35, 0.35]} />
        </mesh>
        {/* Paruh Kuning */}
        <mesh
          position={[0, -0.05, 0.22]}
          rotation={[Math.PI / 2, 0, 0]}
          material={materials.accentYellow}
        >
          <coneGeometry args={[0.08, 0.15, 4]} />
        </mesh>
        {/* Jengger Merah */}
        <mesh position={[0, 0.22, 0]} material={materials.accentRed}>
          <boxGeometry args={[0.1, 0.15, 0.25]} />
        </mesh>
      </group>

      {/* Sayap */}
      <mesh position={[-0.32, 0.4, 0]} material={materials.body}>
        <boxGeometry args={[0.08, 0.3, 0.4]} />
      </mesh>
      <mesh position={[0.32, 0.4, 0]} material={materials.body}>
        <boxGeometry args={[0.08, 0.3, 0.4]} />
      </mesh>

      {/* Kaki */}
      <mesh position={[-0.15, 0.1, 0]} material={materials.accentYellow}>
        <cylinderGeometry args={[0.03, 0.03, 0.2]} />
      </mesh>
      <mesh position={[0.15, 0.1, 0]} material={materials.accentYellow}>
        <cylinderGeometry args={[0.03, 0.03, 0.2]} />
      </mesh>
    </group>
  );
};
