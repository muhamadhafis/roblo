import React, { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useGameStore } from "../../store/gameStore";

export const ThirdPersonCamera: React.FC = () => {
  const { camera } = useThree();
  const { playerPosition } = useGameStore();
  const currentPos = useRef(new THREE.Vector3(0, 4.5, -7));
  const currentLookAt = useRef(new THREE.Vector3(0, 1.2, 0));

  useFrame((_, delta) => {
    const targetCamPos = new THREE.Vector3(
      playerPosition.x,
      playerPosition.y + 4.5,
      playerPosition.z - 7.5,
    );

    const targetLookAt = new THREE.Vector3(
      playerPosition.x,
      playerPosition.y + 1.2,
      playerPosition.z + 2.0,
    );

    // Smooth Lerp
    currentPos.current.lerp(targetCamPos, delta * 5.0);
    currentLookAt.current.lerp(targetLookAt, delta * 8.0);

    camera.position.copy(currentPos.current);
    camera.lookAt(currentLookAt.current);
  });

  return null;
};
