"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { audio } from "@/lib/audio";
import { carState } from "@/lib/carState";
import { SECRETS, SECRET_RADIUS, type Secret, type SecretKind } from "@/lib/secrets";
import { terrainHeight } from "@/lib/terrain";
import { useGameStore } from "@/store/useGameStore";

/** Pato de borracha: corpo, cabeça, bico e um olho de cada lado. */
function Duck() {
  return (
    <group>
      <mesh position={[0, 0.62, 0]} scale={[1, 0.85, 1.35]} castShadow>
        <sphereGeometry args={[0.62, 16, 12]} />
        <meshStandardMaterial color="#ffd23f" roughness={0.45} />
      </mesh>
      <mesh position={[0, 1.28, 0.45]} castShadow>
        <sphereGeometry args={[0.38, 16, 12]} />
        <meshStandardMaterial color="#ffd23f" roughness={0.45} />
      </mesh>
      <mesh position={[0, 1.22, 0.82]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <coneGeometry args={[0.16, 0.36, 8]} />
        <meshStandardMaterial color="#f08a24" roughness={0.5} />
      </mesh>
      {[-0.16, 0.16].map((x) => (
        <mesh key={x} position={[x, 1.36, 0.68]}>
          <sphereGeometry args={[0.055, 8, 8]} />
          <meshStandardMaterial color="#1a1626" roughness={0.3} />
        </mesh>
      ))}
    </group>
  );
}

/** Joaninha — o "bug" que todo mundo entende sem legenda. */
function Ladybug() {
  return (
    <group>
      <mesh position={[0, 0.42, 0]} scale={[1, 0.62, 1.25]} castShadow>
        <sphereGeometry args={[0.7, 16, 12]} />
        <meshStandardMaterial color="#d8352a" roughness={0.4} />
      </mesh>
      {/* risco do meio, separando os élitros */}
      <mesh position={[0, 0.85, 0]} scale={[0.04, 0.06, 1.72]}>
        <sphereGeometry args={[0.7, 8, 6]} />
        <meshStandardMaterial color="#1a1626" roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.5, 0.82]} castShadow>
        <sphereGeometry args={[0.34, 14, 10]} />
        <meshStandardMaterial color="#1a1626" roughness={0.45} />
      </mesh>
      {[
        [-0.3, 0.72, 0.2],
        [0.3, 0.7, -0.1],
        [-0.26, 0.62, -0.48],
        [0.28, 0.64, 0.5],
      ].map(([x, y, z], i) => (
        <mesh key={i} position={[x, y, z]} scale={[1, 0.35, 1]}>
          <sphereGeometry args={[0.15, 10, 8]} />
          <meshStandardMaterial color="#1a1626" roughness={0.5} />
        </mesh>
      ))}
    </group>
  );
}

/** Xícara de café tamanho família. */
function Coffee() {
  return (
    <group>
      <mesh position={[0, 0.75, 0]} castShadow>
        <cylinderGeometry args={[0.62, 0.5, 1.5, 20, 1, true]} />
        <meshStandardMaterial color="#f4f1ea" roughness={0.35} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 1.36, 0]}>
        <circleGeometry args={[0.62, 20]} />
        <meshStandardMaterial color="#4a2c18" roughness={0.25} />
      </mesh>
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[0.5, 20]} />
        <meshStandardMaterial color="#f4f1ea" roughness={0.35} />
      </mesh>
      <mesh position={[0.72, 0.8, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <torusGeometry args={[0.3, 0.09, 8, 16, Math.PI]} />
        <meshStandardMaterial color="#f4f1ea" roughness={0.35} />
      </mesh>
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[0.86, 20]} />
        <meshStandardMaterial color="#d9d3c6" roughness={0.6} />
      </mesh>
    </group>
  );
}

/** Placa de estrada com "404" pintado. */
function Sign404() {
  const texture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 160;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#f4f1ea";
    ctx.fillRect(0, 0, 256, 160);
    ctx.strokeStyle = "#d8352a";
    ctx.lineWidth = 10;
    ctx.strokeRect(12, 12, 232, 136);
    ctx.fillStyle = "#1a1626";
    ctx.font = "bold 86px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("404", 128, 74);
    ctx.font = "16px monospace";
    ctx.fillText("SIGN NOT FOUND", 128, 128);
    return new THREE.CanvasTexture(canvas);
  }, []);

  return (
    <group rotation={[0, -0.4, 0]}>
      <mesh position={[0, 1, 0]} castShadow>
        <boxGeometry args={[0.14, 2, 0.14]} />
        <meshStandardMaterial color="#6c4a2e" roughness={0.95} />
      </mesh>
      {/* torta de propósito: ninguém endireita uma placa que não existe */}
      <mesh position={[0, 2.1, 0.06]} rotation={[0, 0, 0.09]} castShadow>
        <boxGeometry args={[1.9, 1.2, 0.1]} />
        <meshStandardMaterial map={texture} roughness={0.7} />
      </mesh>
    </group>
  );
}

/** Disco voador pousado, com as luzes acesas. */
function Ufo() {
  const ref = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!ref.current) return;
    ref.current.rotation.y = state.clock.elapsedTime * 0.35;
    ref.current.position.y = 1.6 + Math.sin(state.clock.elapsedTime * 0.9) * 0.18;
  });

  return (
    <group ref={ref} position={[0, 1.6, 0]}>
      <mesh scale={[1, 0.26, 1]} castShadow>
        <sphereGeometry args={[1.7, 20, 12]} />
        <meshStandardMaterial color="#9aa6b4" roughness={0.28} metalness={0.75} />
      </mesh>
      <mesh position={[0, 0.32, 0]}>
        <sphereGeometry args={[0.75, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial
          color="#7ee8ff"
          roughness={0.1}
          metalness={0.2}
          transparent
          opacity={0.55}
        />
      </mesh>
      {Array.from({ length: 6 }, (_, i) => {
        const angle = (i / 6) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(angle) * 1.15, -0.3, Math.sin(angle) * 1.15]}>
            <sphereGeometry args={[0.13, 8, 8]} />
            <meshStandardMaterial
              color="#ffd24a"
              emissive="#ffd24a"
              emissiveIntensity={2.2}
              roughness={0.2}
            />
          </mesh>
        );
      })}
      <pointLight position={[0, -0.6, 0]} color="#8ce9ff" intensity={14} distance={9} />
    </group>
  );
}

/** Disquete de 3½", espetado no chão como uma lápide. */
function Floppy() {
  return (
    <group rotation={[0.12, 0.5, 0]}>
      <mesh position={[0, 0.95, 0]} castShadow>
        <boxGeometry args={[1.7, 1.7, 0.16]} />
        <meshStandardMaterial color="#2b2b33" roughness={0.6} />
      </mesh>
      {/* obturador metálico */}
      <mesh position={[0.08, 1.5, 0.1]} castShadow>
        <boxGeometry args={[0.85, 0.5, 0.06]} />
        <meshStandardMaterial color="#b9bec7" roughness={0.35} metalness={0.6} />
      </mesh>
      {/* etiqueta */}
      <mesh position={[0, 0.62, 0.1]}>
        <boxGeometry args={[1.35, 0.72, 0.04]} />
        <meshStandardMaterial color="#eae5d8" roughness={0.8} />
      </mesh>
    </group>
  );
}

const SHAPES: Record<SecretKind, () => React.ReactElement> = {
  duck: Duck,
  ladybug: Ladybug,
  coffee: Coffee,
  sign404: Sign404,
  ufo: Ufo,
  floppy: Floppy,
};

function SecretItem({ secret }: { secret: Secret }) {
  const found = useGameStore((s) => s.foundSecrets.includes(secret.id));
  const glow = useRef<THREE.PointLight>(null);
  const Shape = SHAPES[secret.id];

  const [x, z] = secret.position;
  const y = useMemo(() => terrainHeight(x, z), [x, z]);

  useFrame((state) => {
    if (!glow.current) return;
    // pulsa devagar; depois de achado fica só um brilho de lembrete
    const pulse = 1 + Math.sin(state.clock.elapsedTime * 1.6) * 0.35;
    glow.current.intensity = (found ? 5 : 9) * pulse;
  });

  return (
    // 1.5x: no tamanho natural desses objetos, um pato de borracha some ao lado
    // de um pinheiro e o jogador passa direto
    <group position={[x, y, z]} scale={1.5}>
      <Shape />
      <pointLight ref={glow} position={[0, 1.6, 0]} color="#ffe6a8" distance={12} />
    </group>
  );
}

/**
 * Os segredos e a caçada. A detecção lê a pose publicada em `carState` em vez de
 * um sensor de física: são seis pontos fixos, e um `hypot` por quadro é bem mais
 * barato do que seis colliders sensores no mundo.
 */
export function Secrets() {
  const findSecret = useGameStore((s) => s.findSecret);

  useFrame(() => {
    for (const secret of SECRETS) {
      const [x, z] = secret.position;
      if (Math.hypot(carState.x - x, carState.z - z) > SECRET_RADIUS) continue;

      const before = useGameStore.getState().foundSecrets.length;
      findSecret(secret.id);
      if (useGameStore.getState().foundSecrets.length > before) {
        try {
          audio.zoneReached();
        } catch {
          // som é bônus
        }
      }
    }
  });

  return (
    <group>
      {SECRETS.map((secret) => (
        <SecretItem key={secret.id} secret={secret} />
      ))}
    </group>
  );
}
