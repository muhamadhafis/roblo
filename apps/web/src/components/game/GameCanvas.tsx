import React, { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Sky } from "@react-three/drei";
import * as THREE from "three";
import { EntityRenderer } from "../3d/EntityRenderer";
import { useGameStore } from "../../store/gameStore";

const AnimatedBurger: React.FC = () => {
  const burgerRef = useRef<THREE.Group>(null);
  const { isThrowing } = useGameStore();

  useFrame((state) => {
    if (burgerRef.current && isThrowing) {
      burgerRef.current.position.z += 0.2;
      burgerRef.current.rotation.x += 0.1;
      burgerRef.current.rotation.y += 0.1;
    }
  });

  return (
    <group ref={burgerRef} position={[0, 1.2, 0]}>
      <EntityRenderer
        category="food"
        assetId="burger"
        grade="NORMAL"
        scale={0.8}
      />
    </group>
  );
};

export const GameCanvas: React.FC = () => {
  return (
    <div style={{ width: "100vw", height: "100vh", position: "relative" }}>
      <Canvas
        camera={{ position: [0, 4, -8], fov: 50 }}
        shadows
        style={{ width: "100%", height: "100%" }}
      >
        <Sky sunPosition={[100, 40, 100]} />
        <ambientLight intensity={0.7} />
        <directionalLight position={[10, 20, 15]} intensity={1.2} castShadow />

        {/* Karakter Pemain di Pangkal */}
        <EntityRenderer
          category="player"
          assetId="player"
          position={[0, 0, 0]}
          scale={1}
        />

        {/* Proyektil Makanan */}
        <AnimatedBurger />

        {/* Hewan-Hewan Zona 1 (Meadow Farm) */}
        {/* Kelinci di jarak 6m */}
        <EntityRenderer
          category="animal"
          assetId="rabbit"
          grade="NORMAL"
          position={[-1.5, 0, 6]}
          rotation={[0, Math.PI, 0]}
          scale={1}
        />

        {/* Ayam Emas di jarak 12m */}
        <EntityRenderer
          category="animal"
          assetId="chicken"
          grade="EMAS"
          position={[1.5, 0, 12]}
          rotation={[0, Math.PI, 0]}
          scale={1}
        />

        {/* Domba Besar di jarak 18m */}
        <EntityRenderer
          category="animal"
          assetId="sheep"
          grade="BESAR"
          position={[0, 0, 18]}
          rotation={[0, Math.PI, 0]}
          scale={1}
        />

        {/* Lantai Lapangan (Meadow Zone Ground) */}
        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, -0.01, 20]}
          receiveShadow
        >
          <planeGeometry args={[20, 60]} />
          <meshStandardMaterial color="#4ade80" roughness={0.8} />
        </mesh>

        {/* Area Berdiri Pemain (Stone Platform) */}
        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, 0, 0]}
          receiveShadow
        >
          <circleGeometry args={[2.5, 32]} />
          <meshStandardMaterial color="#94a3b8" roughness={0.6} />
        </mesh>

        <OrbitControls
          maxPolarAngle={Math.PI / 2.1}
          minDistance={3}
          maxDistance={30}
        />
      </Canvas>
    </div>
  );
};
