"use client";

import { Suspense, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { Physics } from "@react-three/rapier";
import { AdaptiveDpr, Environment, Lightformer, Preload } from "@react-three/drei";
import * as THREE from "three";
import { Car } from "./Car";
import { Confetti } from "./Confetti";
import { World } from "./World";

/**
 * Domo de céu próprio. O <Sky> do drei cobria a cena inteira de branco neste
 * enquadramento; um gradiente controlado resolve e ainda combina com a névoa.
 */
function SkyDome() {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        depthWrite: false,
        fog: false,
        uniforms: {
          top: { value: new THREE.Color("#3f86cf") },
          horizon: { value: new THREE.Color("#bcd8e8") },
          ground: { value: new THREE.Color("#dccfae") },
        },
        vertexShader: `
          varying vec3 vPosition;
          void main() {
            vPosition = position;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          varying vec3 vPosition;
          uniform vec3 top;
          uniform vec3 horizon;
          uniform vec3 ground;
          void main() {
            float h = normalize(vPosition).y;
            vec3 sky = h > 0.0
              ? mix(horizon, top, pow(h, 0.55))
              : mix(horizon, ground, pow(-h, 0.4));
            gl_FragColor = vec4(sky, 1.0);
          }
        `,
      }),
    [],
  );

  return (
    <mesh material={material} scale={430} renderOrder={-1}>
      <sphereGeometry args={[1, 32, 20]} />
    </mesh>
  );
}

/** Nuvens volumosas de baixo custo: grupos de esferas achatadas bem ao longe. */
function Clouds() {
  const puffs = useMemo(() => {
    const list: { position: [number, number, number]; scale: [number, number, number] }[] = [];
    let seed = 4242;
    const random = () => {
      seed = (seed * 1103515245 + 12345) % 2147483648;
      return seed / 2147483648;
    };

    for (let i = 0; i < 14; i++) {
      const angle = (i / 14) * Math.PI * 2 + random() * 0.4;
      const distance = 150 + random() * 130;
      const height = 42 + random() * 34;
      const x = Math.cos(angle) * distance;
      const z = Math.sin(angle) * distance;

      for (let p = 0; p < 3; p++) {
        const size = 16 + random() * 16;
        list.push({
          position: [x + (random() - 0.5) * 34, height + (random() - 0.5) * 8, z + (random() - 0.5) * 34],
          scale: [size, size * 0.45, size],
        });
      }
    }
    return list;
  }, []);

  return (
    <group>
      {puffs.map((puff, i) => (
        <mesh key={i} position={puff.position} scale={puff.scale}>
          <sphereGeometry args={[1, 10, 8]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.9} fog={false} />
        </mesh>
      ))}
    </group>
  );
}

export default function Experience() {
  return (
    <Canvas
      shadows
      dpr={[1, 1.75]}
      camera={{ position: [0, 12, 22], fov: 45, near: 0.5, far: 600 }}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      onCreated={({ gl, scene }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.05;
        // névoa clara e longe: dá profundidade à serra sem apagar o vale
        scene.fog = new THREE.Fog("#b9cfd8", 130, 380);
      }}
    >
      <color attach="background" args={["#a9cfe4"]} />
      <SkyDome />
      <Clouds />

      <hemisphereLight args={["#cfe3ff", "#5d7040", 1.2]} />
      <ambientLight intensity={0.28} />
      <directionalLight
        position={[52, 34, -56]}
        intensity={2.6}
        color="#ffdaa8"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-45}
        shadow-camera-right={45}
        shadow-camera-top={45}
        shadow-camera-bottom={-45}
        shadow-camera-far={120}
        shadow-bias={-0.0006}
      />
      {/* preenchimento frio vindo do lado oposto, para as sombras não fecharem */}
      <directionalLight position={[-30, 16, 26]} intensity={0.5} color="#9fc4ff" />

      {/* Cubemap gerado na própria cena (sem baixar HDRI): é o que dá o reflexo
          alongado na lataria metálica do carro. */}
      <Environment resolution={64} background={false}>
        <Lightformer form="rect" intensity={2.6} color="#ffd9a6" scale={[14, 5, 1]} position={[0, 6, -10]} />
        <Lightformer form="rect" intensity={1.2} color="#bcd6ff" scale={[10, 4, 1]} position={[-9, 5, 4]} rotation={[0, Math.PI / 2, 0]} />
        <Lightformer form="rect" intensity={1.2} color="#dff0ff" scale={[10, 4, 1]} position={[9, 5, 4]} rotation={[0, -Math.PI / 2, 0]} />
        <Lightformer form="circle" intensity={1.8} color="#ffffff" scale={[8, 8, 1]} position={[0, 12, 0]} rotation={[-Math.PI / 2, 0, 0]} />
      </Environment>

      <Suspense fallback={null}>
        <Physics gravity={[0, -21, 0]} timeStep={1 / 60}>
          <World />
          <Car />
        </Physics>
        {/* fora do mundo físico: papel picado não colide com nada */}
        <Confetti />
        <Preload all />
      </Suspense>

      <AdaptiveDpr pixelated />
    </Canvas>
  );
}
