"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import { CuboidCollider, RigidBody, TrimeshCollider } from "@react-three/rapier";
import * as THREE from "three";
import { projects } from "@/lib/data";
import {
  ARENA,
  CRATE_STACKS,
  HOUSES,
  LAKE,
  MOUNTAINS,
  RAMPS,
  START_PAD,
  type House,
  type SceneryItem,
  generateScenery,
} from "@/lib/world";
import { RESOLUTION, RISE_HEIGHT, terrainHeight } from "@/lib/terrain";
import { CareerTrack } from "./CareerTrack";
import { ProjectZone } from "./ProjectZone";

const GRASS = "#5b8c42";
const GRASS_DARK = "#55833e";
const DIRT = "#a9855a";

/** Verdes da mata, sorteados por `tint` para a floresta não ficar chapada. */
const FOLIAGE = ["#3f7a35", "#4b8c3c", "#356b30", "#57993f", "#2f6330"];
const PINE = ["#2c5c37", "#356b3f", "#25502f", "#3d7546"];

const matrix = new THREE.Matrix4();
const position = new THREE.Vector3();
const quaternion = new THREE.Quaternion();
const scale = new THREE.Vector3();
const color = new THREE.Color();

/** Distribui as instâncias de um tipo de vegetação numa malha só. */
function useInstances(
  items: SceneryItem[],
  apply: (item: SceneryItem, index: number) => { y: number; scale: [number, number, number] },
  palette?: string[],
) {
  const ref = useRef<THREE.InstancedMesh>(null);

  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;

    items.forEach((item, index) => {
      const { y, scale: s } = apply(item, index);
      position.set(item.position[0], terrainHeight(item.position[0], item.position[2]) + y, item.position[2]);
      quaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), item.rotation);
      scale.set(s[0], s[1], s[2]);
      matrix.compose(position, quaternion, scale);
      mesh.setMatrixAt(index, matrix);

      if (palette) {
        color.set(palette[Math.floor(item.tint * palette.length) % palette.length]);
        mesh.setColorAt(index, color);
      }
    });

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [items, apply, palette]);

  return ref;
}

function Forest() {
  const scenery = useMemo(() => generateScenery(), []);

  const pines = useMemo(() => scenery.filter((s) => s.kind === "pine"), [scenery]);
  const broadleaves = useMemo(() => scenery.filter((s) => s.kind === "broadleaf"), [scenery]);
  const bushes = useMemo(() => scenery.filter((s) => s.kind === "bush"), [scenery]);
  const rocks = useMemo(() => scenery.filter((s) => s.kind === "rock"), [scenery]);

  const pineTrunks = useInstances(
    pines,
    useMemo(() => (item: SceneryItem) => ({ y: item.scale * 0.5, scale: [item.scale * 0.55, item.scale, item.scale * 0.55] as [number, number, number] }), []),
  );
  const pineCrowns = useInstances(
    pines,
    useMemo(() => (item: SceneryItem) => ({ y: item.scale * 2.1, scale: [item.scale * 1.6, item.scale * 2.6, item.scale * 1.6] as [number, number, number] }), []),
    PINE,
  );

  const leafTrunks = useInstances(
    broadleaves,
    useMemo(() => (item: SceneryItem) => ({ y: item.scale * 0.7, scale: [item.scale * 0.6, item.scale * 1.4, item.scale * 0.6] as [number, number, number] }), []),
  );
  const leafCrowns = useInstances(
    broadleaves,
    useMemo(() => (item: SceneryItem) => ({ y: item.scale * 2, scale: [item.scale * 1.7, item.scale * 1.5, item.scale * 1.7] as [number, number, number] }), []),
    FOLIAGE,
  );

  const bushMeshes = useInstances(
    bushes,
    useMemo(() => (item: SceneryItem) => ({ y: item.scale * 0.45, scale: [item.scale, item.scale * 0.8, item.scale] as [number, number, number] }), []),
    FOLIAGE,
  );

  const rockMeshes = useInstances(
    rocks,
    useMemo(() => (item: SceneryItem) => ({ y: item.scale * 0.3, scale: [item.scale, item.scale * 0.75, item.scale] as [number, number, number] }), []),
  );

  // Um corpo fixo só, com um collider por tronco: centenas de RigidBody
  // separados custariam caro à toa, já que nada disso se move.
  const trunks = useMemo(() => [...pines, ...broadleaves], [pines, broadleaves]);

  return (
    <>
      <instancedMesh ref={pineTrunks} args={[undefined, undefined, pines.length]} castShadow>
        <cylinderGeometry args={[0.16, 0.22, 1, 6]} />
        <meshStandardMaterial color="#6b4b32" roughness={0.95} />
      </instancedMesh>
      <instancedMesh ref={pineCrowns} args={[undefined, undefined, pines.length]} castShadow>
        <coneGeometry args={[0.6, 1, 7]} />
        <meshStandardMaterial roughness={0.85} />
      </instancedMesh>

      <instancedMesh ref={leafTrunks} args={[undefined, undefined, broadleaves.length]} castShadow>
        <cylinderGeometry args={[0.14, 0.2, 1, 6]} />
        <meshStandardMaterial color="#75523a" roughness={0.95} />
      </instancedMesh>
      <instancedMesh ref={leafCrowns} args={[undefined, undefined, broadleaves.length]} castShadow>
        <icosahedronGeometry args={[0.9, 0]} />
        <meshStandardMaterial roughness={0.9} flatShading />
      </instancedMesh>

      <instancedMesh ref={bushMeshes} args={[undefined, undefined, bushes.length]} castShadow>
        <dodecahedronGeometry args={[0.7, 0]} />
        <meshStandardMaterial roughness={0.95} flatShading />
      </instancedMesh>

      <instancedMesh ref={rockMeshes} args={[undefined, undefined, rocks.length]} castShadow receiveShadow>
        <dodecahedronGeometry args={[0.7, 0]} />
        <meshStandardMaterial color="#8d8b86" roughness={0.95} flatShading />
      </instancedMesh>

      <RigidBody type="fixed" colliders={false}>
        {trunks.map((tree, i) => (
          <CuboidCollider
            key={i}
            args={[0.28 * tree.scale, 1.2 * tree.scale, 0.28 * tree.scale]}
            position={[
              tree.position[0],
              terrainHeight(tree.position[0], tree.position[2]) + 1.2 * tree.scale,
              tree.position[2],
            ]}
          />
        ))}
      </RigidBody>
    </>
  );
}

function Cottage({ house }: { house: House }) {
  const { width, depth, height, wall, roof } = house;

  return (
    <group
      position={[
        house.position[0],
        terrainHeight(house.position[0], house.position[2]),
        house.position[2],
      ]}
      rotation={[0, house.rotation, 0]}
    >
      <mesh position={[0, height / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[width, height, depth]} />
        <meshStandardMaterial color={wall} roughness={0.9} />
      </mesh>

      {/* telhado de duas águas */}
      <mesh position={[0, height + 0.7, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <coneGeometry args={[Math.max(width, depth) * 0.78, 1.5, 4]} />
        <meshStandardMaterial color={roof} roughness={0.85} flatShading />
      </mesh>

      {/* porta e janelas */}
      <mesh position={[0, 0.55, depth / 2 + 0.02]}>
        <boxGeometry args={[0.6, 1.1, 0.06]} />
        <meshStandardMaterial color="#6b4630" roughness={0.8} />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * width * 0.28, height * 0.62, depth / 2 + 0.02]}>
          <boxGeometry args={[0.5, 0.5, 0.06]} />
          <meshStandardMaterial
            color="#f6e7a8"
            emissive="#ffca6a"
            emissiveIntensity={0.7}
            roughness={0.4}
          />
        </mesh>
      ))}

      {/* chaminé */}
      <mesh position={[width * 0.28, height + 1.1, -depth * 0.2]} castShadow>
        <boxGeometry args={[0.34, 1.1, 0.34]} />
        <meshStandardMaterial color="#9a8676" roughness={0.9} />
      </mesh>

      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider args={[width / 2, height / 2 + 0.6, depth / 2]} position={[0, height / 2, 0]} />
      </RigidBody>
    </group>
  );
}

/** Serra em três anéis: quanto mais longe, mais clara e azulada pela distância. */
function Mountains() {
  return (
    <group>
      {MOUNTAINS.map((peak, i) => (
        <mesh
          key={i}
          position={[peak.position[0], peak.height / 2 - 1, peak.position[2]]}
          rotation={[0, peak.rotation, 0]}
        >
          <coneGeometry args={[peak.radius, peak.height, peak.ring === 2 ? 5 : 6]} />
          <meshStandardMaterial
            color={["#5b7d46", "#6d8a63", "#8ea3a8"][peak.ring]}
            roughness={1}
            flatShading
          />
        </mesh>
      ))}

      {/* neve nos picos mais altos do anel do fundo */}
      {MOUNTAINS.filter((p) => p.ring === 2 && p.height > 55).map((peak, i) => (
        <mesh
          key={`snow-${i}`}
          position={[peak.position[0], peak.height * 0.86 - 1, peak.position[2]]}
          rotation={[0, peak.rotation, 0]}
        >
          <coneGeometry args={[peak.radius * 0.3, peak.height * 0.28, 5]} />
          <meshStandardMaterial color="#eef3f6" roughness={0.85} flatShading />
        </mesh>
      ))}
    </group>
  );
}

function Fence() {
  const posts = useMemo(() => {
    const list: [number, number][] = [];
    for (let i = -ARENA; i <= ARENA; i += 4) {
      list.push([i, -ARENA], [i, ARENA], [-ARENA, i], [ARENA, i]);
    }
    return list;
  }, []);

  // quase cem postes: numa malha só, em vez de uma chamada de desenho por poste
  const postsRef = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const mesh = postsRef.current;
    if (!mesh) return;
    posts.forEach(([x, z], i) => {
      position.set(x, terrainHeight(x, z) + 0.55, z);
      quaternion.identity();
      scale.set(1, 1, 1);
      matrix.compose(position, quaternion, scale);
      mesh.setMatrixAt(i, matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [posts]);

  return (
    <group>
      <instancedMesh ref={postsRef} args={[undefined, undefined, posts.length]} castShadow>
        <boxGeometry args={[0.16, 1.1, 0.16]} />
        <meshStandardMaterial color="#7a5a3c" roughness={0.95} />
      </instancedMesh>
      {/* travessas */}
      {[0.45, 0.85].map((y) => (
        <group key={y} position={[0, RISE_HEIGHT, 0]}>
          {[-ARENA, ARENA].map((z) => (
            <mesh key={`z${z}`} position={[0, y, z]}>
              <boxGeometry args={[ARENA * 2, 0.1, 0.08]} />
              <meshStandardMaterial color="#8a6844" roughness={0.95} />
            </mesh>
          ))}
          {[-ARENA, ARENA].map((x) => (
            <mesh key={`x${x}`} position={[x, y, 0]}>
              <boxGeometry args={[0.08, 0.1, ARENA * 2]} />
              <meshStandardMaterial color="#8a6844" roughness={0.95} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

function Ground() {
  // A colisão é a própria malha que aparece na tela (trimesh), não um
  // heightfield paralelo: assim não há como o chão físico divergir do visual
  // por ordem de índices ou escala.
  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(ARENA * 2, ARENA * 2, RESOLUTION, RESOLUTION);
    geo.rotateX(-Math.PI / 2);

    const pos = geo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      pos.setY(i, terrainHeight(pos.getX(i), pos.getZ(i)));
    }
    pos.needsUpdate = true;
    geo.computeVertexNormals();
    return geo;
  }, []);

  const collision = useMemo(() => {
    const position = geometry.attributes.position as THREE.BufferAttribute;
    return {
      vertices: new Float32Array(position.array),
      indices: new Uint32Array(geometry.index!.array),
    };
  }, [geometry]);

  return (
    <>
      <RigidBody type="fixed" colliders={false} friction={1.1}>
        <TrimeshCollider args={[collision.vertices, collision.indices]} />
      </RigidBody>

      <mesh geometry={geometry} receiveShadow>
        <meshStandardMaterial color={GRASS} roughness={1} flatShading />
      </mesh>

      {/* Campo que continua além da cerca até o pé da serra. Começa por baixo
          da borda do vale (que é quadrada) para não abrir fenda nos lados. */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, RISE_HEIGHT - 0.06, 0]}
        receiveShadow
      >
        <ringGeometry args={[ARENA * 0.99, ARENA * 4.5, 64]} />
        <meshStandardMaterial color={GRASS_DARK} roughness={1} />
      </mesh>

      {/* lago no sopé da serra */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[LAKE.x, RISE_HEIGHT - 0.02, LAKE.z]}
      >
        <circleGeometry args={[LAKE.radius, 48]} />
        <meshStandardMaterial color="#3f7f9c" roughness={0.15} metalness={0.5} />
      </mesh>
    </>
  );
}

function Walls() {
  const height = 4;
  const base = RISE_HEIGHT; // a borda do vale fica no topo da encosta
  return (
    <RigidBody type="fixed" colliders={false}>
      <CuboidCollider args={[ARENA, height, 0.5]} position={[0, base + height, -ARENA]} />
      <CuboidCollider args={[ARENA, height, 0.5]} position={[0, base + height, ARENA]} />
      <CuboidCollider args={[0.5, height, ARENA]} position={[-ARENA, base + height, 0]} />
      <CuboidCollider args={[0.5, height, ARENA]} position={[ARENA, base + height, 0]} />
    </RigidBody>
  );
}

/** Rampa de terra: subir e voar é metade da graça de dirigir. */
function Ramp({ position, rotation }: { position: [number, number, number]; rotation: number }) {
  return (
    <RigidBody type="fixed" colliders="cuboid" position={position} rotation={[0, rotation, 0]}>
      <mesh rotation={[-0.28, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[6, 0.4, 7]} />
        <meshStandardMaterial color={DIRT} roughness={1} />
      </mesh>
    </RigidBody>
  );
}

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
        <RigidBody key={i} colliders="cuboid" position={crate.position} mass={0.12} restitution={0.15}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[0.85, 0.85, 0.85]} />
            <meshStandardMaterial color={i % 2 ? "#c08b4e" : "#a97840"} roughness={0.9} />
          </mesh>
        </RigidBody>
      ))}
    </>
  );
}

export function World() {
  return (
    <>
      <Ground />
      <Walls />
      <Fence />
      <Mountains />
      <Forest />
      <CareerTrack />

      {HOUSES.map((house, i) => (
        <Cottage key={i} house={house} />
      ))}

      {/* clareira de terra batida da largada */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[START_PAD.x, 0.02, START_PAD.z]}
        receiveShadow
      >
        <circleGeometry args={[START_PAD.radius, 48]} />
        <meshStandardMaterial color={DIRT} roughness={1} />
      </mesh>

      {RAMPS.map((ramp, i) => (
        <Ramp key={i} position={ramp.position} rotation={ramp.rotation} />
      ))}

      {CRATE_STACKS.map((origin, i) => (
        <CrateStack key={i} origin={origin} />
      ))}

      {projects.map((project) => (
        <ProjectZone key={project.id} project={project} />
      ))}
    </>
  );
}
