"use client";

import { useMemo } from "react";
import { CuboidCollider, RigidBody } from "@react-three/rapier";
import { projects } from "@/lib/data";
import { ProjectZone } from "./ProjectZone";

const ARENA = 46; // meia-largura do mundo jogável

/** PRNG determinístico: mesma cena no servidor e no cliente, sem hydration mismatch. */
function mulberry32(seed: number) {
  return function random() {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function Ground() {
  return (
    <RigidBody type="fixed" friction={1.1}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[ARENA * 2, ARENA * 2]} />
        <meshStandardMaterial color="#1d1a2e" roughness={0.95} />
      </mesh>
      <CuboidCollider args={[ARENA, 5, ARENA]} position={[0, -5, 0]} />
    </RigidBody>
  );
}

function Walls() {
  const height = 3;
  return (
    <RigidBody type="fixed" colliders={false}>
      <CuboidCollider args={[ARENA, height, 0.5]} position={[0, height, -ARENA]} />
      <CuboidCollider args={[ARENA, height, 0.5]} position={[0, height, ARENA]} />
      <CuboidCollider args={[0.5, height, ARENA]} position={[-ARENA, height, 0]} />
      <CuboidCollider args={[0.5, height, ARENA]} position={[ARENA, height, 0]} />

      {[
        [0, -ARENA, 0],
        [0, ARENA, 0],
      ].map(([x, z]) => (
        <mesh key={`z${z}`} position={[x, 0.5, z]}>
          <boxGeometry args={[ARENA * 2, 1, 0.6]} />
          <meshStandardMaterial color="#332e52" emissive="#5b4bd6" emissiveIntensity={0.35} />
        </mesh>
      ))}
      {[-ARENA, ARENA].map((x) => (
        <mesh key={`x${x}`} position={[x, 0.5, 0]}>
          <boxGeometry args={[0.6, 1, ARENA * 2]} />
          <meshStandardMaterial color="#332e52" emissive="#5b4bd6" emissiveIntensity={0.35} />
        </mesh>
      ))}
    </RigidBody>
  );
}

/** Rampa: subir e voar é metade da graça de dirigir. */
function Ramp({
  position,
  rotation = 0,
}: {
  position: [number, number, number];
  rotation?: number;
}) {
  return (
    <RigidBody type="fixed" colliders="cuboid" position={position} rotation={[0, rotation, 0]}>
      <mesh rotation={[-0.28, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[6, 0.4, 7]} />
        <meshStandardMaterial color="#3a3560" roughness={0.7} />
      </mesh>
    </RigidBody>
  );
}

/** Torre de caixas: alvo óbvio para o jogador destruir. */
function CrateStack({ origin }: { origin: [number, number, number] }) {
  const crates = useMemo(() => {
    const items: { position: [number, number, number] }[] = [];
    for (let level = 0; level < 3; level++) {
      const count = 3 - level;
      for (let i = 0; i < count; i++) {
        items.push({
          position: [
            origin[0] + (i - (count - 1) / 2) * 0.95,
            origin[1] + 0.45 + level * 0.9,
            origin[2],
          ],
        });
      }
    }
    return items;
  }, [origin]);

  return (
    <>
      {crates.map((crate, i) => (
        <RigidBody
          key={i}
          colliders="cuboid"
          position={crate.position}
          mass={0.12}
          restitution={0.15}
        >
          <mesh castShadow receiveShadow>
            <boxGeometry args={[0.85, 0.85, 0.85]} />
            <meshStandardMaterial color={i % 2 ? "#d8a04a" : "#c98a3c"} roughness={0.8} />
          </mesh>
        </RigidBody>
      ))}
    </>
  );
}

function Tree({ position, scale }: { position: [number, number, number]; scale: number }) {
  return (
    <RigidBody type="fixed" colliders={false} position={position}>
      <CuboidCollider args={[0.3 * scale, 1.2 * scale, 0.3 * scale]} position={[0, 1.2 * scale, 0]} />
      <mesh position={[0, 0.7 * scale, 0]} scale={scale} castShadow>
        <cylinderGeometry args={[0.16, 0.22, 1.4, 7]} />
        <meshStandardMaterial color="#4a3b2f" roughness={0.9} />
      </mesh>
      <mesh position={[0, 1.9 * scale, 0]} scale={scale} castShadow>
        <icosahedronGeometry args={[1.05, 0]} />
        <meshStandardMaterial color="#f07a9b" roughness={0.85} />
      </mesh>
      <mesh position={[0.35 * scale, 1.4 * scale, 0.2 * scale]} scale={scale * 0.62} castShadow>
        <icosahedronGeometry args={[1.05, 0]} />
        <meshStandardMaterial color="#e05d86" roughness={0.85} />
      </mesh>
    </RigidBody>
  );
}

function Rock({ position, scale }: { position: [number, number, number]; scale: number }) {
  return (
    <RigidBody type="fixed" colliders="hull" position={position}>
      <mesh scale={scale} castShadow receiveShadow>
        <dodecahedronGeometry args={[0.6, 0]} />
        <meshStandardMaterial color="#544c78" roughness={0.95} />
      </mesh>
    </RigidBody>
  );
}

function Scenery() {
  const props = useMemo(() => {
    const random = mulberry32(20260901);
    const items: {
      kind: "tree" | "rock";
      position: [number, number, number];
      scale: number;
    }[] = [];

    let guard = 0;
    while (items.length < 46 && guard < 900) {
      guard++;
      const x = (random() - 0.5) * ARENA * 1.85;
      const z = (random() - 0.5) * ARENA * 1.85;

      // nunca em cima da largada nem dentro das zonas de projeto
      if (Math.hypot(x, z - 6) < 12) continue;
      const collidesWithZone = projects.some(
        (p) => Math.hypot(x - p.position[0], z - p.position[2]) < 8,
      );
      if (collidesWithZone) continue;
      const tooClose = items.some((it) => Math.hypot(x - it.position[0], z - it.position[2]) < 4);
      if (tooClose) continue;

      const kind = random() > 0.35 ? "tree" : "rock";
      items.push({
        kind,
        position: [x, 0, z],
        scale: kind === "tree" ? 0.7 + random() * 0.6 : 0.7 + random() * 1.1,
      });
    }
    return items;
  }, []);

  return (
    <>
      {props.map((item, i) =>
        item.kind === "tree" ? (
          <Tree key={i} position={item.position} scale={item.scale} />
        ) : (
          <Rock key={i} position={item.position} scale={item.scale} />
        ),
      )}
    </>
  );
}

export function World() {
  return (
    <>
      <Ground />
      <Walls />
      <gridHelper args={[ARENA * 2, 46, "#3b3363", "#2a2545"]} position={[0, 0.01, 0]} />

      {/* plataforma de largada */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 6]} receiveShadow>
        <circleGeometry args={[7, 48]} />
        <meshStandardMaterial color="#272247" roughness={0.8} />
      </mesh>

      <Ramp position={[-14, 0, -6]} rotation={0.6} />
      <Ramp position={[12, 0, 4]} rotation={-2.2} />

      <CrateStack origin={[8, 0, -16]} />
      <CrateStack origin={[-16, 0, 14]} />

      <Scenery />

      {projects.map((project) => (
        <ProjectZone key={project.id} project={project} />
      ))}
    </>
  );
}
