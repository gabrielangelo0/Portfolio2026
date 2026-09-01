"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { RigidBody } from "@react-three/rapier";
import * as THREE from "three";
import type { Project } from "@/lib/data";
import { useGameStore } from "@/store/useGameStore";

export function ProjectZone({ project }: { project: Project }) {
  const ringRef = useRef<THREE.Mesh>(null);
  const beamRef = useRef<THREE.Mesh>(null);
  const active = useGameStore((s) => s.activeZone === project.id);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (ringRef.current) {
      const pulse = active ? 1.06 + Math.sin(t * 4) * 0.05 : 1;
      ringRef.current.scale.setScalar(pulse);
    }
    if (beamRef.current) {
      const material = beamRef.current.material as THREE.MeshBasicMaterial;
      material.opacity = active ? 0.16 + Math.sin(t * 3) * 0.04 : 0.07;
    }
  });

  return (
    <group position={project.position}>
      {/* piso da zona */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} receiveShadow>
        <circleGeometry args={[4.2, 48]} />
        <meshStandardMaterial color={project.color} roughness={0.7} toneMapped={false} />
      </mesh>

      {/* anel luminoso */}
      <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 0]}>
        <ringGeometry args={[4.2, 4.55, 48]} />
        <meshBasicMaterial color={project.color} toneMapped={false} />
      </mesh>

      {/* feixe de luz vertical */}
      <mesh ref={beamRef} position={[0, 5, 0]}>
        <cylinderGeometry args={[2.6, 4.1, 9, 24, 1, true]} />
        <meshBasicMaterial
          color={project.color}
          transparent
          opacity={0.07}
          side={THREE.DoubleSide}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>

      {/* totens sólidos: dão referência visual e batem no carro */}
      <RigidBody type="fixed" colliders="cuboid">
        {[-3.1, 3.1].map((x) => (
          <mesh key={x} position={[x, 1.1, -2.6]} castShadow>
            <boxGeometry args={[0.4, 2.2, 0.4]} />
            <meshStandardMaterial color="#2a2740" roughness={0.8} />
          </mesh>
        ))}
      </RigidBody>

      <pointLight
        position={[0, 3, 0]}
        color={project.color}
        intensity={active ? 26 : 12}
        distance={14}
      />

      <Html position={[0, 3.6, 0]} center distanceFactor={18} zIndexRange={[20, 0]}>
        <div className={`zone-label ${active ? "is-active" : ""}`} style={{ ["--zone" as string]: project.color }}>
          <span className="zone-label__title">{project.title}</span>
          <span className="zone-label__subtitle">{project.subtitle}</span>
        </div>
      </Html>
    </group>
  );
}
