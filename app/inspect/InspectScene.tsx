"use client";

import { useLayoutEffect, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { Environment, Grid, Lightformer, OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { CarModel } from "@/components/canvas/CarModel";

/** Ângulos pré-definidos, para comparar rapidamente com as fotos de referência. */
const VIEWS: Record<string, [number, number, number]> = {
  front: [0.6, 1.1, 5.2],
  side: [5.4, 1.0, 0.2],
  rear: [-1.1, 1.2, -5.2],
  "3-4": [3.6, 1.6, 3.8],
  "3-4-rear": [-3.4, 1.5, -3.6],
  top: [0.1, 8.5, 0.6],
  wheel: [2.1, 1.0, 2.3],
  grille: [0.15, 0.55, 2.5],
  parabrisa: [0.6, 1.7, 2.7],
};

/** Alvo da órbita por vista; sem isso a vista da roda mira o meio do carro. */
const TARGETS: Record<string, [number, number, number]> = {
  parabrisa: [0, 0.92, 0.55],
  grille: [0, 0.33, 1.35],
  wheel: [0.45, 0.25, 0.84],
  top: [0, 0.5, 0],
};

/**
 * Reproduz o que o Car faz a cada frame, mas estático: permite conferir eixo de
 * giro e sentido do esterço sem depender da física. Precisa estar dentro do
 * Canvas — fora dele os refs das rodas ainda não existem.
 */
function WheelPose({
  wheelRefs,
  steer,
  spin,
}: {
  wheelRefs: Record<"frontLeft" | "frontRight" | "rearLeft" | "rearRight", React.RefObject<THREE.Group | null>>;
  steer: number;
  spin: number;
}) {
  useLayoutEffect(() => {
    for (const key of ["frontLeft", "frontRight", "rearLeft", "rearRight"] as const) {
      const wheel = wheelRefs[key].current;
      if (!wheel) continue;
      // a ordem YXZ vem do próprio CarModel; não a redefinimos aqui de propósito
      wheel.rotation.x = spin;
      wheel.rotation.y = key.startsWith("front") ? steer * 0.45 : 0;
    }
  }, [wheelRefs, steer, spin]);

  return null;
}

export default function InspectScene({
  view,
  steer = 0,
  spin = 0,
}: {
  view: string;
  /** -1 a 1: mesma convenção do jogo (positivo = curva à direita do carro). */
  steer?: number;
  /** Giro do pneu em radianos, para conferir o eixo de rotação parado. */
  spin?: number;
}) {
  const position = VIEWS[view] ?? VIEWS["3-4"];
  const wheelRefs = {
    frontLeft: useRef<THREE.Group>(null),
    frontRight: useRef<THREE.Group>(null),
    rearLeft: useRef<THREE.Group>(null),
    rearRight: useRef<THREE.Group>(null),
  };

  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{ position, fov: 32 }}
      gl={{ antialias: true }}
      onCreated={({ gl, scene }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        scene.background = new THREE.Color("#dfe3ea");
      }}
    >
      <hemisphereLight args={["#ffffff", "#b8bec9", 1.4]} />
      <directionalLight
        position={[6, 9, 5]}
        intensity={2.4}
        castShadow
        shadow-mapSize={[2048, 2048]}
      />
      <directionalLight position={[-6, 5, -4]} intensity={0.9} />

      <Environment resolution={64}>
        <Lightformer form="rect" intensity={3} color="#ffffff" scale={[12, 5, 1]} position={[0, 7, -8]} />
        <Lightformer form="rect" intensity={2} color="#ffffff" scale={[10, 4, 1]} position={[-8, 5, 3]} rotation={[0, Math.PI / 2, 0]} />
        <Lightformer form="rect" intensity={2} color="#ffffff" scale={[10, 4, 1]} position={[8, 5, 3]} rotation={[0, -Math.PI / 2, 0]} />
      </Environment>

      <CarModel wheelRefs={wheelRefs} />
      <WheelPose wheelRefs={wheelRefs} steer={steer} spin={spin} />

      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[40, 40]} />
        <meshStandardMaterial color="#e7eaef" roughness={0.9} />
      </mesh>
      <Grid
        args={[40, 40]}
        cellSize={0.5}
        cellColor="#c3c8d2"
        sectionSize={1}
        sectionColor="#a9b0bd"
        position={[0, 0.002, 0]}
        fadeDistance={22}
      />

      <OrbitControls target={TARGETS[view] ?? [0, 0.5, 0]} makeDefault />
    </Canvas>
  );
}
