import React from "react";
import type { EntityMaterialSet } from "../materials/GradeMaterialFactory";

interface GLBModelLoaderProps {
  modelPath: string;
  materials: EntityMaterialSet;
  animationState?: "idle" | "eat" | "throw" | "pullup";
}

/**
 * Placeholder loader untuk migrasi Drop-in GLB pada Tahap 2 (PRD 6.4).
 * Saat ini me-render fallback mesh ketika file GLB belum tersedia di assets.
 */
export const GLBModelLoader: React.FC<GLBModelLoaderProps> = ({
  materials,
}) => {
  return (
    <group>
      <mesh material={materials.body}>
        <boxGeometry args={[0.6, 0.6, 0.6]} />
      </mesh>
    </group>
  );
};
