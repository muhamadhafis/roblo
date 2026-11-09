import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { EntityMaterialSet } from "../../materials/GradeMaterialFactory";

interface ProceduralRabbitProps {
  materials: EntityMaterialSet;
  animationState?: "idle" | "eat" | "throw" | "pullup";
}

export const ProceduralRabbit: React.FC<ProceduralRabbitProps> = ({
  materials,
  animationState = "idle",
}) => {
  const earLeftRef = useRef<THREE.Mesh>(null);
  const earRightRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (
      animationState === "idle" &&
      earLeftRef.current &&
      earRightRef.current
    ) {
      const wiggle = Math.sin(state.clock.elapsedTime * 4) * 0.08;
      earLeftRef.current.rotation.z = wiggle;
      earRightRef.current.rotation.z = -wiggle;
    }
  });

  return (
    <group>
      {/* Badan Kelinci */}
      <mesh position={[0, 0.35, 0]} material={materials.body}>
        <boxGeometry args={[0.5, 0.45, 0.6]} />
      </mesh>

      {/* Kepala */}
      <mesh position={[0, 0.55, 0.25]} material={materials.body}>
        <boxGeometry args={[0.38, 0.35, 0.35]} />
      </mesh>

      {/* Hidung Merah Muda */}
      <mesh position={[0, 0.5, 0.43]} material={materials.accentPink}>
        <boxGeometry args={[0.08, 0.06, 0.04]} />
      </mesh>

      {/* Telinga Panjang Kiri */}
      <mesh
        ref={earLeftRef}
        position={[-0.1, 0.85, 0.2]}
        material={materials.body}
      >
        <boxGeometry args={[0.08, 0.4, 0.08]} />
      </mesh>

      {/* Telinga Panjang Kanan */}
      <mesh
        ref={earRightRef}
        position={[0.1, 0.85, 0.2]}
        material={materials.body}
      >
        <boxGeometry args={[0.08, 0.4, 0.08]} />
      </mesh>

      {/* Ekor Bundar */}
      <mesh position={[0, 0.35, -0.35]} material={materials.accentWhite}>
        <boxGeometry args={[0.15, 0.15, 0.15]} />
      </mesh>

      {/* Kaki Depan */}
      <mesh position={[-0.14, 0.1, 0.2]} material={materials.body}>
        <cylinderGeometry args={[0.04, 0.04, 0.2]} />
      </mesh>
      <mesh position={[0.14, 0.1, 0.2]} material={materials.body}>
        <cylinderGeometry args={[0.04, 0.04, 0.2]} />
      </mesh>

      {/* Kaki Belakang */}
      <mesh position={[-0.18, 0.1, -0.15]} material={materials.body}>
        <boxGeometry args={[0.1, 0.2, 0.25]} />
      </mesh>
      <mesh position={[0.18, 0.1, -0.15]} material={materials.body}>
        <boxGeometry args={[0.1, 0.2, 0.25]} />
      </mesh>
    </group>
  );
};
