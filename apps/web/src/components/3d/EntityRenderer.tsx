import React from "react";
import type { Grade } from "@nomnom/shared";
import { ProceduralRegistry } from "./procedural/ProceduralRegistry";
import { GLBModelLoader } from "./models/GLBModelLoader";
import { GradeMaterialFactory } from "./materials/GradeMaterialFactory";

export interface EntityRendererProps {
  category: "animal" | "food" | "player";
  assetId: string;
  grade?: Grade;
  animationState?: "idle" | "eat" | "throw" | "pullup";
  scale?: number;
  position?: [number, number, number];
  rotation?: [number, number, number];
}

const ASSET_SOURCE_MODE =
  (import.meta.env?.VITE_ASSET_MODE as "PROCEDURAL" | "GLB") || "PROCEDURAL";

export const EntityRenderer: React.FC<EntityRendererProps> = ({
  category,
  assetId,
  grade = "NORMAL",
  animationState = "idle",
  scale = 1,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
}) => {
  // Hewan grade BESAR berskala 1.5x
  const effectiveScale = grade === "BESAR" ? scale * 1.5 : scale;
  const materials = GradeMaterialFactory.getMaterials(grade);

  return (
    <group position={position} scale={effectiveScale} rotation={rotation}>
      {ASSET_SOURCE_MODE === "PROCEDURAL" ? (
        <ProceduralRegistry
          category={category}
          assetId={assetId}
          materials={materials}
          animationState={animationState}
        />
      ) : (
        <GLBModelLoader
          modelPath={`/assets/models/${category}s/${assetId}.glb`}
          materials={materials}
          animationState={animationState}
        />
      )}
    </group>
  );
};
