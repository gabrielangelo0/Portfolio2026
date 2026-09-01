"use client";

import { useMemo } from "react";
import { CuboidCollider, RigidBody } from "@react-three/rapier";
import { projects } from "@/lib/data";
import {
  ARENA,
  CRATE_STACKS,
  RAMPS,
  START_PAD,
  generateScenery,
} from "@/lib/world";
import { ProjectZone } from "./ProjectZone";

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
  const props = useMemo(() => generateScenery(), []);

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
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[START_PAD.x, 0.03, START_PAD.z]}
        receiveShadow
      >
        <circleGeometry args={[START_PAD.radius, 48]} />
        <meshStandardMaterial color="#272247" roughness={0.8} />
      </mesh>

      {RAMPS.map((ramp, i) => (
        <Ramp key={i} position={ramp.position} rotation={ramp.rotation} />
      ))}

      {CRATE_STACKS.map((origin, i) => (
        <CrateStack key={i} origin={origin} />
      ))}

      <Scenery />

      {projects.map((project) => (
        <ProjectZone key={project.id} project={project} />
      ))}
    </>
  );
}
