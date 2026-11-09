import React from "react";
import { Canvas } from "@react-three/fiber";
import { Sky } from "@react-three/drei";
import { EntityRenderer } from "../3d/EntityRenderer";
import { CharacterController } from "../character/CharacterController";
import { ThirdPersonCamera } from "../character/ThirdPersonCamera";
import { ThrowPadZone } from "../world/ThrowPadZone";
import { AnimalPenZone } from "../world/AnimalPenZone";
import { useGameStore } from "../../store/gameStore";

export const GameCanvas: React.FC = () => {
  const { isInThrowZone, throwFoodAtDistance, maxDistance } = useGameStore();

  const handleFieldClick = (e: any) => {
    e.stopPropagation();
    if (!isInThrowZone) return;

    // Klik pada bidang tanah: Ambil jarak Z ke depan
    const clickZ = Math.max(3, Math.min(maxDistance, e.point.z));
    throwFoodAtDistance(clickZ, 101);
  };

  return (
    <div style={{ width: "100vw", height: "100vh", position: "relative" }}>
      <Canvas
        camera={{ position: [0, 5, -8], fov: 55 }}
        shadows
        style={{ width: "100%", height: "100%" }}
      >
        <Sky sunPosition={[100, 40, 100]} />
        <ambientLight intensity={0.7} />
        <directionalLight position={[15, 25, 20]} intensity={1.3} castShadow />

        {/* Third-Person Dynamic Camera Follow */}
        <ThirdPersonCamera />

        {/* Karakter Pemain yang Dapat Digerakkan (WASD, Shift, Space) */}
        <CharacterController />

        {/* Area Lingkaran Khusus Lempar (Throw Pad Zone) */}
        <ThrowPadZone />

        {/* Area Kandang Hewan (Animal Pen) Penghasil Passive MPS */}
        <AnimalPenZone />

        {/* Hewan Target Zona 1 (Klik Langsung untuk Melempar Makanan) */}
        {/* Kelinci di jarak 6m */}
        <group
          position={[-1.5, 0, 6]}
          rotation={[0, Math.PI, 0]}
          onClick={(e) => {
            e.stopPropagation();
            if (isInThrowZone) throwFoodAtDistance(6, 101);
          }}
        >
          <EntityRenderer
            category="animal"
            assetId="rabbit"
            grade="NORMAL"
            scale={1}
          />
        </group>

        {/* Ayam Emas di jarak 12m */}
        <group
          position={[1.5, 0, 12]}
          rotation={[0, Math.PI, 0]}
          onClick={(e) => {
            e.stopPropagation();
            if (isInThrowZone) throwFoodAtDistance(12, 102);
          }}
        >
          <EntityRenderer
            category="animal"
            assetId="chicken"
            grade="EMAS"
            scale={1}
          />
        </group>

        {/* Domba Besar di jarak 18m */}
        <group
          position={[0, 0, 18]}
          rotation={[0, Math.PI, 0]}
          onClick={(e) => {
            e.stopPropagation();
            if (isInThrowZone) throwFoodAtDistance(18, 103);
          }}
        >
          <EntityRenderer
            category="animal"
            assetId="sheep"
            grade="BESAR"
            scale={1}
          />
        </group>

        {/* Lantai Lapangan Rumput (Meadow Zone Ground) */}
        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, -0.01, 20]}
          receiveShadow
          onClick={handleFieldClick}
        >
          <planeGeometry args={[40, 70]} />
          <meshStandardMaterial color="#4ade80" roughness={0.8} />
        </mesh>

        {/* Lantai Hub Utama */}
        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          position={[5, -0.02, 0]}
          receiveShadow
        >
          <planeGeometry args={[25, 20]} />
          <meshStandardMaterial color="#cbd5e1" roughness={0.6} />
        </mesh>
      </Canvas>
    </div>
  );
};
