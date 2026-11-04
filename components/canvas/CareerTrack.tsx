"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { audio } from "@/lib/audio";
import { carState } from "@/lib/carState";
import {
  FINISH,
  MILESTONES,
  TRACK,
  TRACK_WIDTH,
  trackPointAt,
} from "@/lib/career";
import type { Localized } from "@/lib/i18n";
import { terrainHeight } from "@/lib/terrain";
import { useGameStore } from "@/store/useGameStore";
import { useLanguage } from "@/components/ui/LanguageProvider";

const POST = "#6c4a2e";

/**
 * Faixa de terra batida que segue o eixo da pista. Cada amostra do traçado vira
 * dois vértices, um de cada lado; a altura sai de `terrainHeight`, então a faixa
 * acompanha a subida da serra em vez de flutuar sobre ela.
 */
function useRibbonGeometry(width: number, lift: number) {
  return useMemo(() => {
    const positions: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];

    for (let i = 0; i < TRACK.length; i++) {
      const previous = TRACK[Math.max(i - 1, 0)];
      const next = TRACK[Math.min(i + 1, TRACK.length - 1)];
      const dx = next.x - previous.x;
      const dz = next.z - previous.z;
      const length = Math.hypot(dx, dz) || 1;

      // perpendicular no plano, para abrir a faixa dos dois lados do eixo
      const nx = -dz / length;
      const nz = dx / length;
      const point = TRACK[i];

      for (const side of [-1, 1]) {
        const x = point.x + nx * width * 0.5 * side;
        const z = point.z + nz * width * 0.5 * side;
        positions.push(x, terrainHeight(x, z) + lift, z);
        uvs.push(side < 0 ? 0 : 1, point.distance / 7);
      }

      if (i > 0) {
        const o = (i - 1) * 2;
        indices.push(o, o + 2, o + 1, o + 1, o + 2, o + 3);
      }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    return geometry;
  }, [width, lift]);
}

/** Terra batida com bordas mais escuras e uma faixa central tracejada. */
function useTrackTexture() {
  return useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 64;
    canvas.height = 128;
    const ctx = canvas.getContext("2d")!;

    ctx.fillStyle = "#a9855a";
    ctx.fillRect(0, 0, 64, 128);

    // grão: sem isso a faixa fica com cara de plástico ao lado da grama
    for (let i = 0; i < 900; i++) {
      const shade = 150 + Math.floor(Math.random() * 60);
      ctx.fillStyle = `rgba(${shade}, ${shade - 30}, ${shade - 70}, 0.25)`;
      ctx.fillRect(Math.random() * 64, Math.random() * 128, 2, 2);
    }

    // bordas gastas
    const edge = ctx.createLinearGradient(0, 0, 64, 0);
    edge.addColorStop(0, "rgba(97, 72, 45, 0.85)");
    edge.addColorStop(0.16, "rgba(97, 72, 45, 0)");
    edge.addColorStop(0.84, "rgba(97, 72, 45, 0)");
    edge.addColorStop(1, "rgba(97, 72, 45, 0.85)");
    ctx.fillStyle = edge;
    ctx.fillRect(0, 0, 64, 128);

    // tracejado do meio
    ctx.fillStyle = "rgba(247, 236, 214, 0.55)";
    ctx.fillRect(30, 16, 4, 46);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.anisotropy = 4;
    return texture;
  }, []);
}

function TrackRibbon() {
  const geometry = useRibbonGeometry(TRACK_WIDTH, 0.15);
  const texture = useTrackTexture();

  return (
    <mesh geometry={geometry} receiveShadow>
      <meshStandardMaterial map={texture} roughness={1} side={THREE.DoubleSide} />
    </mesh>
  );
}

/**
 * Pórtico de madeira sobre a pista, com o ano e o título do marco. Não tem
 * colisão de propósito: o jogador passa por baixo lendo, sem risco de emperrar
 * no meio da história.
 */
function MilestoneGate({
  at,
  year,
  title,
  detail,
  accent,
}: {
  at: number;
  year: string;
  title: Localized;
  detail: Localized;
  accent: string;
}) {
  const { t } = useLanguage();
  const { position, rotation, ground } = useMemo(() => {
    const point = trackPointAt(at);
    return {
      position: [point.x, 0, point.z] as [number, number, number],
      // o pórtico fica atravessado na pista, olhando para quem vem
      rotation: Math.atan2(point.dx, point.dz),
      ground: terrainHeight(point.x, point.z),
    };
  }, [at]);

  const half = TRACK_WIDTH / 2 + 0.35;

  return (
    <group position={[position[0], ground, position[2]]} rotation={[0, rotation, 0]}>
      {[-half, half].map((x) => (
        <mesh key={x} position={[x, 1.7, 0]} castShadow>
          <boxGeometry args={[0.24, 3.4, 0.24]} />
          <meshStandardMaterial color={POST} roughness={0.95} />
        </mesh>
      ))}

      <mesh position={[0, 3.5, 0]} castShadow>
        <boxGeometry args={[half * 2 + 0.24, 0.26, 0.26]} />
        <meshStandardMaterial color={POST} roughness={0.95} />
      </mesh>

      {/* placa do ano, pendurada na travessa */}
      <mesh position={[0, 3.0, 0.02]}>
        <boxGeometry args={[2.1, 0.72, 0.08]} />
        <meshStandardMaterial color={accent} roughness={0.6} />
      </mesh>

      <Html position={[0, 4.5, 0]} center distanceFactor={9} zIndexRange={[18, 0]}>
        <div className="milestone" style={{ ["--accent" as string]: accent }}>
          <span className="milestone__year">{year}</span>
          <span className="milestone__title">{t(title)}</span>
          <span className="milestone__detail">{t(detail)}</span>
        </div>
      </Html>
    </group>
  );
}

/**
 * Linha de chegada no alto da serra. Os confetes disparam quando o carro cruza
 * e se rearmam depois que ele se afasta — assim dá para voltar e comemorar de
 * novo, que é o que qualquer um faz.
 */
function FinishLine() {
  const gate = useMemo(() => {
    const point = trackPointAt(1);
    return {
      x: point.x,
      z: point.z,
      y: terrainHeight(point.x, point.z),
      rotation: Math.atan2(point.dx, point.dz),
    };
  }, []);

  const checker = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext("2d")!;
    const cell = 8;
    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 8; x++) {
        ctx.fillStyle = (x + y) % 2 ? "#15121f" : "#f6f3ee";
        ctx.fillRect(x * cell, y * cell, cell, cell);
      }
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(6, 1);
    texture.magFilter = THREE.NearestFilter;
    return texture;
  }, []);

  const floorChecker = useMemo(() => {
    const texture = checker.clone();
    texture.repeat.set(8, 2);
    texture.needsUpdate = true;
    return texture;
  }, [checker]);

  const armed = useRef(true);
  const celebrate = useGameStore((state) => state.celebrate);
  const { t } = useLanguage();

  const half = TRACK_WIDTH / 2 + 1;

  useFrame(() => {
    const distance = Math.hypot(carState.x - gate.x, carState.z - gate.z);

    // rearma quando o carro se afasta: dá para voltar e comemorar de novo, que
    // é o que qualquer um faz
    if (armed.current && distance < half + 1.5) {
      armed.current = false;
      celebrate(gate.x, gate.y + 4.6, gate.z);
      try {
        audio.finish();
      } catch {
        // som é bônus, a festa continua sem ele
      }
    } else if (!armed.current && distance > 16) {
      armed.current = true;
    }
  });

  return (
    <group position={[gate.x, gate.y, gate.z]} rotation={[0, gate.rotation, 0]}>
      {[-half, half].map((x) => (
        <mesh key={x} position={[x, 2.2, 0]} castShadow>
          <boxGeometry args={[0.3, 4.4, 0.3]} />
          <meshStandardMaterial color={POST} roughness={0.95} />
        </mesh>
      ))}

      {/* faixa quadriculada em cima do pórtico */}
      <mesh position={[0, 4.6, 0]} castShadow>
        <boxGeometry args={[half * 2 + 0.3, 1, 0.14]} />
        <meshStandardMaterial map={checker} roughness={0.8} />
      </mesh>

      {/* e pintada no chão, atravessando a pista */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
        <planeGeometry args={[TRACK_WIDTH, 1.6]} />
        <meshStandardMaterial map={floorChecker} roughness={1} />
      </mesh>

      <Html position={[0, 6, 0]} center distanceFactor={11} zIndexRange={[18, 0]}>
        <div className="milestone is-finish">
          <span className="milestone__year">{t(FINISH.year)}</span>
          <span className="milestone__title">{t(FINISH.title)}</span>
          <span className="milestone__detail">{t(FINISH.detail)}</span>
        </div>
      </Html>
    </group>
  );
}

/** Cor de cada marco, do começo (quente) ao fim (frio) — só para dar ritmo. */
const ACCENTS = ["#ff6b4a", "#ff9a3c", "#ffd24a", "#4affa1", "#4ac8ff", "#b04aff"];

export function CareerTrack() {
  return (
    <group>
      <TrackRibbon />

      {MILESTONES.map((milestone, i) => (
        <MilestoneGate
          key={milestone.year}
          at={milestone.at}
          year={milestone.year}
          title={milestone.title}
          detail={milestone.detail}
          accent={ACCENTS[i % ACCENTS.length]}
        />
      ))}

      <FinishLine />
    </group>
  );
}
