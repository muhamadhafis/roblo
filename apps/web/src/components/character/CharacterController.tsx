import React, { useRef, useState, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { EntityRenderer } from "../3d/EntityRenderer";
import { useGameStore } from "../../store/gameStore";

export const CharacterController: React.FC = () => {
  const groupRef = useRef<THREE.Group>(null);
  const leftLegRef = useRef<THREE.Mesh>(null);
  const rightLegRef = useRef<THREE.Mesh>(null);
  const leftArmRef = useRef<THREE.Mesh>(null);
  const rightArmRef = useRef<THREE.Mesh>(null);

  const { carriedAnimal, setPlayerPosition } = useGameStore();

  // Posisi & Fisika Lompat
  const posRef = useRef(new THREE.Vector3(0, 0, 0));
  const velYRef = useRef(0);
  const isGroundedRef = useRef(true);

  // Input State
  const [keys, setKeys] = useState({
    w: false,
    a: false,
    s: false,
    d: false,
    shift: false,
    space: false,
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.code) {
        case "KeyW":
        case "ArrowUp":
          setKeys((k) => ({ ...k, w: true }));
          break;
        case "KeyA":
        case "ArrowLeft":
          setKeys((k) => ({ ...k, a: true }));
          break;
        case "KeyS":
        case "ArrowDown":
          setKeys((k) => ({ ...k, s: true }));
          break;
        case "KeyD":
        case "ArrowRight":
          setKeys((k) => ({ ...k, d: true }));
          break;
        case "ShiftLeft":
        case "ShiftRight":
          setKeys((k) => ({ ...k, shift: true }));
          break;
        case "Space":
          if (isGroundedRef.current) {
            velYRef.current = 8.0; // Jump impulse
            isGroundedRef.current = false;
          }
          break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      switch (e.code) {
        case "KeyW":
        case "ArrowUp":
          setKeys((k) => ({ ...k, w: false }));
          break;
        case "KeyA":
        case "ArrowLeft":
          setKeys((k) => ({ ...k, a: false }));
          break;
        case "KeyS":
        case "ArrowDown":
          setKeys((k) => ({ ...k, s: false }));
          break;
        case "KeyD":
        case "ArrowRight":
          setKeys((k) => ({ ...k, d: false }));
          break;
        case "ShiftLeft":
        case "ShiftRight":
          setKeys((k) => ({ ...k, shift: false }));
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    // 1. Kecepatan Gerak
    const baseSpeed = keys.shift ? 8.5 : 5.0;
    const moveZ = (keys.w ? 1 : 0) - (keys.s ? 1 : 0);
    // Kamera menghadap ke arah +Z, sehingga dalam sistem koordinat layar:
    // "a" bergerak ke kiri (+X) dan "d" bergerak ke kanan (-X)
    const moveX = (keys.a ? 1 : 0) - (keys.d ? 1 : 0);

    const isMoving = moveX !== 0 || moveZ !== 0;

    if (isMoving) {
      const moveVec = new THREE.Vector3(moveX, 0, moveZ).normalize();
      posRef.current.x += moveVec.x * baseSpeed * delta;
      posRef.current.z += moveVec.z * baseSpeed * delta;

      // Rotasi Karakter Mengikuti Arah Gerak
      const angle = Math.atan2(moveVec.x, moveVec.z);
      groupRef.current.rotation.y = angle;
    }

    // 2. Gravitasi & Lompat
    velYRef.current -= 20.0 * delta; // Gravitasi
    posRef.current.y += velYRef.current * delta;

    if (posRef.current.y <= 0) {
      posRef.current.y = 0;
      velYRef.current = 0;
      isGroundedRef.current = true;
    }

    groupRef.current.position.copy(posRef.current);
    setPlayerPosition({
      x: Number(posRef.current.x.toFixed(2)),
      y: Number(posRef.current.y.toFixed(2)),
      z: Number(posRef.current.z.toFixed(2)),
    });

    // 3. Animasi Berjalan / Lari (Kaki & Tangan Mengayun)
    const animSpeed = keys.shift ? 14 : 9;
    const swingAngle = isMoving
      ? Math.sin(Date.now() * 0.001 * animSpeed) * 0.6
      : 0;

    if (leftLegRef.current && rightLegRef.current) {
      leftLegRef.current.rotation.x = swingAngle;
      rightLegRef.current.rotation.x = -swingAngle;
    }

    // Jika Memegang Hewan: Kedua Tangan Terangkat ke Atas
    if (carriedAnimal) {
      if (leftArmRef.current && rightArmRef.current) {
        leftArmRef.current.rotation.x = Math.PI * 0.85;
        rightArmRef.current.rotation.x = Math.PI * 0.85;
      }
    } else if (leftArmRef.current && rightArmRef.current) {
      leftArmRef.current.rotation.x = -swingAngle * 0.8;
      rightArmRef.current.rotation.x = swingAngle * 0.8;
    }
  });

  const animalAssetMapping: Record<number, string> = {
    101: "rabbit",
    102: "chicken",
    103: "sheep",
  };

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {/* Visual Humanoid Roblox Karakter */}
      {/* Badan */}
      <mesh position={[0, 0.6, 0]}>
        <boxGeometry args={[0.5, 0.7, 0.3]} />
        <meshStandardMaterial color="#38bdf8" roughness={0.5} />
      </mesh>

      {/* Kepala */}
      <mesh position={[0, 1.15, 0]}>
        <boxGeometry args={[0.35, 0.35, 0.35]} />
        <meshStandardMaterial color="#fcd34d" roughness={0.4} />
      </mesh>

      {/* Tangan Kiri */}
      <mesh ref={leftArmRef} position={[-0.35, 0.7, 0]}>
        <boxGeometry args={[0.18, 0.65, 0.2]} />
        <meshStandardMaterial color="#38bdf8" roughness={0.5} />
      </mesh>

      {/* Tangan Kanan */}
      <mesh ref={rightArmRef} position={[0.35, 0.7, 0]}>
        <boxGeometry args={[0.18, 0.65, 0.2]} />
        <meshStandardMaterial color="#38bdf8" roughness={0.5} />
      </mesh>

      {/* Kaki Kiri */}
      <mesh ref={leftLegRef} position={[-0.14, 0.15, 0]}>
        <boxGeometry args={[0.2, 0.45, 0.25]} />
        <meshStandardMaterial color="#1e293b" roughness={0.7} />
      </mesh>

      {/* Kaki Kanan */}
      <mesh ref={rightLegRef} position={[0.14, 0.15, 0]}>
        <boxGeometry args={[0.2, 0.45, 0.25]} />
        <meshStandardMaterial color="#1e293b" roughness={0.7} />
      </mesh>

      {/* Carry State: Hewan Diangkat di Atas Kepala */}
      {carriedAnimal && (
        <group position={[0, 1.6, 0]}>
          <EntityRenderer
            category="animal"
            assetId={animalAssetMapping[carriedAnimal.animalId] || "chicken"}
            grade={carriedAnimal.grade}
            scale={0.7}
          />
        </group>
      )}
    </group>
  );
};
