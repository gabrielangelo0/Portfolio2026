"use client";

import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { Physics } from "@react-three/rapier";
import { AdaptiveDpr, Environment, Lightformer, Preload } from "@react-three/drei";
import * as THREE from "three";
import { Car } from "./Car";
import { World } from "./World";

export default function Experience() {
  return (
    <Canvas
      shadows
      dpr={[1, 1.75]}
      camera={{ position: [0, 12, 22], fov: 45, near: 0.5, far: 200 }}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      onCreated={({ gl, scene }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        scene.background = new THREE.Color("#120f1f");
        scene.fog = new THREE.Fog("#120f1f", 40, 88);
      }}
    >
      <hemisphereLight args={["#8f7dff", "#2a1f3d", 1.1]} />
      <ambientLight intensity={0.35} />
      <directionalLight
        position={[18, 28, 12]}
        intensity={2.1}
        color="#ffd9c4"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-45}
        shadow-camera-right={45}
        shadow-camera-top={45}
        shadow-camera-bottom={-45}
        shadow-camera-far={90}
        shadow-bias={-0.0006}
      />
      <directionalLight position={[-16, 10, -18]} intensity={0.6} color="#6a8cff" />

      {/* Cubemap gerado na própria cena (sem baixar HDRI): é o que dá o reflexo
          alongado na lataria metálica do carro. */}
      <Environment resolution={64} background={false}>
        <Lightformer form="rect" intensity={2.2} color="#fff1e0" scale={[12, 4, 1]} position={[0, 6, -8]} rotation={[0, 0, 0]} />
        <Lightformer form="rect" intensity={1.1} color="#9db4ff" scale={[10, 3, 1]} position={[-8, 4, 4]} rotation={[0, Math.PI / 2, 0]} />
        <Lightformer form="rect" intensity={1.1} color="#ffb2c8" scale={[10, 3, 1]} position={[8, 4, 4]} rotation={[0, -Math.PI / 2, 0]} />
        <Lightformer form="circle" intensity={1.6} color="#ffffff" scale={[6, 6, 1]} position={[0, 9, 0]} rotation={[-Math.PI / 2, 0, 0]} />
      </Environment>

      <Suspense fallback={null}>
        <Physics gravity={[0, -21, 0]} timeStep={1 / 60}>
          <World />
          <Car />
        </Physics>
        <Preload all />
      </Suspense>

      <AdaptiveDpr pixelated />
    </Canvas>
  );
}
