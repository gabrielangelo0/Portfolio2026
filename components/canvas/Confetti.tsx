"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { terrainHeight } from "@/lib/terrain";
import { useGameStore } from "@/store/useGameStore";

const COUNT = 260;
const COLORS = [
  "#ff6b4a",
  "#4ac8ff",
  "#b04aff",
  "#ffd24a",
  "#4affa1",
  "#ff4a8d",
  "#ffffff",
];

type Confetto = {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  spin: THREE.Vector3;
  rotation: THREE.Euler;
  life: number;
};

/**
 * Retângulos de papel com uma cor por instância. A cor entra como atributo
 * instanciado da própria geometria em vez de `setColorAt`: o `instanceColor` só
 * chega ao shader se o material recompilar depois de existir, e nesse intervalo
 * os confetes saem pretos.
 */
function useConfettiGeometry() {
  return useMemo(() => {
    const geometry = new THREE.PlaneGeometry(0.16, 0.26);
    const colors = new Float32Array(COUNT * 3);
    const color = new THREE.Color();

    for (let i = 0; i < COUNT; i++) {
      color.set(COLORS[i % COLORS.length]);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }

    geometry.setAttribute("color", new THREE.InstancedBufferAttribute(colors, 3));
    return geometry;
  }, []);
}

/**
 * Emissor único de confetes, no mundo inteiro. A linha de chegada e o código do
 * Konami pedem a festa pelo store, em vez de cada um carregar a sua malha
 * instanciada — são 260 partículas que ficam paradas a maior parte do tempo.
 */
export function Confetti() {
  const celebration = useGameStore((s) => s.celebration);
  const geometry = useConfettiGeometry();
  const mesh = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const remaining = useRef(0);

  const pieces = useRef<Confetto[]>(
    Array.from({ length: COUNT }, () => ({
      position: new THREE.Vector3(),
      velocity: new THREE.Vector3(),
      spin: new THREE.Vector3(),
      rotation: new THREE.Euler(),
      life: 0,
    })),
  );

  useEffect(() => {
    if (!celebration) return;

    for (const piece of pieces.current) {
      piece.position.set(
        celebration.x + (Math.random() - 0.5) * 6,
        celebration.y + Math.random() * 0.9,
        celebration.z + (Math.random() - 0.5) * 6,
      );
      piece.velocity.set(
        (Math.random() - 0.5) * 5.5,
        1.5 + Math.random() * 5.5,
        (Math.random() - 0.5) * 5.5,
      );
      piece.spin.set(
        (Math.random() - 0.5) * 12,
        (Math.random() - 0.5) * 12,
        (Math.random() - 0.5) * 12,
      );
      piece.rotation.set(
        Math.random() * 6.28,
        Math.random() * 6.28,
        Math.random() * 6.28,
      );
      piece.life = 3.4 + Math.random() * 1.8;
    }

    remaining.current = 5.2;
  }, [celebration]);

  useFrame((_, rawDelta) => {
    const instanced = mesh.current;
    if (!instanced) return;

    if (remaining.current <= 0) {
      if (instanced.visible) instanced.visible = false;
      return;
    }

    const delta = Math.min(rawDelta, 1 / 20);
    instanced.visible = true;
    remaining.current -= delta;

    pieces.current.forEach((piece, index) => {
      if (piece.life > 0) {
        piece.life -= delta;
        piece.velocity.y -= 11 * delta;
        // arrasto: papel não cai como pedra, ele planeia
        piece.velocity.multiplyScalar(1 - 1.1 * delta);
        piece.position.addScaledVector(piece.velocity, delta);
        piece.rotation.x += piece.spin.x * delta;
        piece.rotation.y += piece.spin.y * delta;
        piece.rotation.z += piece.spin.z * delta;

        const floor = terrainHeight(piece.position.x, piece.position.z) + 0.05;
        if (piece.position.y < floor) {
          piece.position.y = floor;
          piece.velocity.set(0, 0, 0);
          piece.spin.set(0, 0, 0);
        }
      }

      dummy.position.copy(piece.position);
      dummy.rotation.copy(piece.rotation);
      dummy.scale.setScalar(piece.life > 0 ? 1 : 0);
      dummy.updateMatrix();
      instanced.setMatrixAt(index, dummy.matrix);
    });

    instanced.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={mesh}
      args={[geometry, undefined, COUNT]}
      visible={false}
      frustumCulled={false}
    >
      <meshStandardMaterial vertexColors side={THREE.DoubleSide} roughness={0.55} />
    </instancedMesh>
  );
}
