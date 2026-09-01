"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import {
  CoefficientCombineRule,
  CuboidCollider,
  RapierRigidBody,
  RigidBody,
  useRapier,
} from "@react-three/rapier";
import * as THREE from "three";
import { CarModel, WHEEL_RADIUS } from "./CarModel";
import { input, bindKeyboard } from "@/lib/controls";
import { audio } from "@/lib/audio";
import { carState } from "@/lib/carState";
import { projects } from "@/lib/data";
import { useGameStore } from "@/store/useGameStore";

const ENGINE_FORCE = 26;
const REVERSE_FORCE = 16;
const MAX_SPEED = 17;
const MAX_REVERSE_SPEED = 7;
const TURN_SPEED = 2.1;
const GRIP = 6.5;
const BRAKE = 3.2;
const ZONE_RADIUS = 4.2;
const SPAWN: [number, number, number] = [0, 1.2, 6];

// vetores reaproveitados para não alocar dentro do loop de render
const quat = new THREE.Quaternion();
const forward = new THREE.Vector3();
const right = new THREE.Vector3();
const velocity = new THREE.Vector3();
const impulse = new THREE.Vector3();
const carPosition = new THREE.Vector3();
const cameraTarget = new THREE.Vector3();
const cameraGoal = new THREE.Vector3();
const CAMERA_OFFSET = new THREE.Vector3(0, 11, 15);

const INPUT_DEAD_ZONE = 0.14;
/** Desvio a partir do qual o volante já vai todo para um lado. */
const FULL_LOCK_ANGLE = Math.PI / 4;

const UP = new THREE.Vector3(0, 1, 0);
const cameraForward = new THREE.Vector3();
const cameraRight = new THREE.Vector3();
const desired = new THREE.Vector3();

/** Normaliza para (-π, π]. */
function wrapAngle(angle: number) {
  return Math.atan2(Math.sin(angle), Math.cos(angle));
}

// distâncias de amostragem do terreno, em metros do centro do carro
const SAMPLE_AHEAD = 1.2;
const SAMPLE_SIDE = 0.55;
const RAY_HEIGHT = 0.9;
const RAY_REACH = 3;

export function Car() {
  const body = useRef<RapierRigidBody>(null);
  const wheelRefs = {
    frontLeft: useRef<THREE.Group>(null),
    frontRight: useRef<THREE.Group>(null),
    rearLeft: useRef<THREE.Group>(null),
    rearRight: useRef<THREE.Group>(null),
  };

  const visual = useRef<THREE.Group>(null);
  const { world, rapier } = useRapier();
  const groundRay = useMemo(
    () => new rapier.Ray({ x: 0, y: 0, z: 0 }, { x: 0, y: -1, z: 0 }),
    [rapier],
  );

  const camera = useThree((s) => s.camera);
  const viewport = useThree((s) => s.size);
  const resetSignal = useGameStore((s) => s.resetSignal);
  const teleport = useGameStore((s) => s.teleport);
  const started = useGameStore((s) => s.started);

  useEffect(() => bindKeyboard(), []);

  const respawn = () => {
    const rb = body.current;
    if (!rb) return;
    rb.setTranslation({ x: SPAWN[0], y: SPAWN[1], z: SPAWN[2] }, true);
    rb.setLinvel({ x: 0, y: 0, z: 0 }, true);
    rb.setAngvel({ x: 0, y: 0, z: 0 }, true);
    rb.setRotation({ x: 0, y: 0, z: 0, w: 1 }, true);
  };

  useEffect(() => {
    if (resetSignal > 0) respawn();
  }, [resetSignal]);

  // Atalho da lista lateral: leva o carro até a entrada da zona escolhida,
  // já virado para o centro dela.
  useEffect(() => {
    const rb = body.current;
    if (!rb || !teleport) return;
    const target = projects.find((p) => p.id === teleport.id);
    if (!target) return;

    const [tx, , tz] = target.position;
    const distance = Math.hypot(tx, tz) || 1;
    const x = tx + (tx / distance) * 3;
    const z = tz + (tz / distance) * 3;
    const yaw = Math.atan2(tx - x, tz - z);

    rb.setTranslation({ x, y: 1.2, z }, true);
    rb.setLinvel({ x: 0, y: 0, z: 0 }, true);
    rb.setAngvel({ x: 0, y: 0, z: 0 }, true);
    rb.setRotation(
      { x: 0, y: Math.sin(yaw / 2), z: 0, w: Math.cos(yaw / 2) },
      true,
    );
  }, [teleport]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "KeyR") respawn();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const zoneCheck = useRef(0);
  const wheelSpin = useRef(0);

  useFrame((state, rawDelta) => {
    const rb = body.current;
    if (!rb) return;
    const delta = Math.min(rawDelta, 1 / 30);

    const rot = rb.rotation();
    quat.set(rot.x, rot.y, rot.z, rot.w);
    forward.set(0, 0, 1).applyQuaternion(quat).setY(0).normalize();
    right.set(1, 0, 0).applyQuaternion(quat).setY(0).normalize();

    const linvel = rb.linvel();
    velocity.set(linvel.x, 0, linvel.z);
    const planarSpeed = velocity.length();
    const goingForward = velocity.dot(forward) >= 0;
    const signedSpeed = goingForward ? planarSpeed : -planarSpeed;

    // ---- intenção do jogador ----
    // Tração é relativa ao carro (W acelera, S dá ré). Só o lado é resolvido no
    // espaço da câmera: apertar "direita" significa ir para a direita *da tela*,
    // e o carro esterça até se alinhar. Sem isso, com o carro vindo na direção
    // da câmera os comandos laterais aparecem invertidos.
    let throttle = 0;
    let steer = 0;

    if (started) {
      const pedal = input.throttle - input.reverse;
      throttle = pedal !== 0 ? pedal : input.moveY;

      const lateral = input.moveX;
      if (Math.abs(lateral) > INPUT_DEAD_ZONE) {
        camera.getWorldDirection(cameraForward);
        cameraForward.setY(0).normalize();
        cameraRight.crossVectors(cameraForward, UP).normalize();
        desired.copy(cameraRight).multiplyScalar(Math.sign(lateral));

        // andando de ré é a traseira que aponta para onde o carro vai
        const reversing = signedSpeed < -0.4;
        const heading = reversing
          ? Math.atan2(-forward.x, -forward.z)
          : Math.atan2(forward.x, forward.z);

        const deviation = wrapAngle(Math.atan2(desired.x, desired.z) - heading);
        steer =
          THREE.MathUtils.clamp(deviation / FULL_LOCK_ANGLE, -1, 1) *
          Math.min(Math.abs(lateral), 1);

        // a física já espelha o comando quando a velocidade é negativa
        if (reversing) steer = -steer;
      }
    }

    // aceleração / ré
    if (throttle > 0 && signedSpeed < MAX_SPEED) {
      impulse.copy(forward).multiplyScalar(ENGINE_FORCE * throttle * delta);
      rb.applyImpulse(impulse, true);
    } else if (throttle < 0 && signedSpeed > -MAX_REVERSE_SPEED) {
      impulse.copy(forward).multiplyScalar(REVERSE_FORCE * throttle * delta);
      rb.applyImpulse(impulse, true);
    }

    // freio de mão
    if (input.brake) {
      impulse.copy(velocity).multiplyScalar(-BRAKE * delta);
      rb.applyImpulse(impulse, true);
    }

    // aderência lateral: mata o deslizamento para o carro "morder" a curva
    const lateral = velocity.dot(right);
    audio.updateEngine(signedSpeed, throttle, lateral);
    impulse.copy(right).multiplyScalar(-lateral * GRIP * delta);
    rb.applyImpulse(impulse, true);

    // esterço proporcional à velocidade (parado, o volante não gira)
    const steerAuthority = Math.min(planarSpeed / 4, 1);
    const angular = rb.angvel();
    const targetYaw = steer * TURN_SPEED * steerAuthority * (signedSpeed < -0.4 ? -1 : 1);
    rb.setAngvel(
      { x: angular.x, y: THREE.MathUtils.lerp(angular.y, targetYaw, 0.25), z: angular.z },
      true,
    );

    // Rodas. O ângulo vem do raio real (ω = v / r), senão o pneu patina em
    // relação ao chão; o acumulador fica em [0, 2π) para não perder precisão
    // depois de alguns minutos rodando. Os grupos usam ordem YXZ: o esterço
    // precisa vir antes do giro do pneu, senão a roda cambaleia na curva.
    wheelSpin.current =
      (wheelSpin.current + (signedSpeed * delta) / WHEEL_RADIUS) % (Math.PI * 2);
    const steerAngle = steer * 0.45;
    for (const key of ["frontLeft", "frontRight", "rearLeft", "rearRight"] as const) {
      const wheel = wheelRefs[key].current;
      if (!wheel) continue;
      wheel.rotation.x = wheelSpin.current;
      wheel.rotation.y = key.startsWith("front")
        ? THREE.MathUtils.lerp(wheel.rotation.y, steerAngle, 0.2)
        : 0;
    }

    const translation = rb.translation();
    carPosition.set(translation.x, translation.y, translation.z);

    // publica a pose para o minimapa, que desenha fora do Canvas
    carState.x = translation.x;
    carState.z = translation.z;
    carState.yaw = Math.atan2(forward.x, forward.z);
    carState.speed = signedSpeed;

    // O corpo tem pitch e roll travados para nunca capotar, então a inclinação
    // é visual: quatro sondas medem a altura do chão em volta e o modelo é
    // rotacionado para acompanhar a rampa.
    if (visual.current) {
      const sampleGround = (ahead: number, side: number) => {
        groundRay.origin.x = carPosition.x + forward.x * ahead + right.x * side;
        groundRay.origin.y = carPosition.y + RAY_HEIGHT;
        groundRay.origin.z = carPosition.z + forward.z * ahead + right.z * side;
        const hit = world.castRay(groundRay, RAY_REACH, true, undefined, undefined, undefined, rb);
        return hit ? groundRay.origin.y - hit.timeOfImpact : null;
      };

      const front = sampleGround(SAMPLE_AHEAD, 0);
      const rear = sampleGround(-SAMPLE_AHEAD, 0);
      const rightSide = sampleGround(0, SAMPLE_SIDE);
      const leftSide = sampleGround(0, -SAMPLE_SIDE);

      // no ar (sem contato) o carro volta suavemente para a horizontal
      const pitch =
        front !== null && rear !== null ? -Math.atan2(front - rear, SAMPLE_AHEAD * 2) : 0;
      const roll =
        rightSide !== null && leftSide !== null
          ? Math.atan2(rightSide - leftSide, SAMPLE_SIDE * 2)
          : 0;

      const ease = 1 - Math.pow(0.0001, delta);
      visual.current.rotation.x = THREE.MathUtils.lerp(visual.current.rotation.x, pitch, ease);
      visual.current.rotation.z = THREE.MathUtils.lerp(visual.current.rotation.z, roll, ease);
    }

    // caiu do mapa
    if (translation.y < -12) respawn();

    // Em telas verticais o campo de visão horizontal encolhe: afasta a câmera
    // para o carro não engolir a tela no celular.
    const aspect = viewport.width / Math.max(viewport.height, 1);
    const zoomOut = THREE.MathUtils.clamp(1.35 / Math.max(aspect, 0.35), 1, 1.9);

    // câmera isométrica que segue o carro com suavização
    cameraGoal.copy(carPosition).addScaledVector(CAMERA_OFFSET, zoomOut);
    camera.position.lerp(cameraGoal, 1 - Math.pow(0.001, delta));
    // Na vertical, mira um pouco abaixo do carro: ele sobe na tela e o painel
    // de conteúdo deixa de cobri-lo.
    cameraTarget.lerp(carPosition, 1 - Math.pow(0.002, delta));
    camera.lookAt(
      cameraTarget.x,
      cameraTarget.y - (zoomOut - 1) * 11,
      cameraTarget.z,
    );

    // HUD e detecção de zona rodam a ~10Hz, não a cada frame
    zoneCheck.current += delta;
    if (zoneCheck.current > 0.1) {
      zoneCheck.current = 0;
      const store = useGameStore.getState();
      store.setSpeed(Math.abs(signedSpeed));

      let near: string | null = null;
      for (const project of projects) {
        const dx = carPosition.x - project.position[0];
        const dz = carPosition.z - project.position[2];
        if (dx * dx + dz * dz < ZONE_RADIUS * ZONE_RADIUS) {
          near = project.id;
          break;
        }
      }
      if (near !== store.activeZone) {
        if (near) audio.zoneReached();
        store.setActiveZone(near);
      }
    }
  });

  return (
    <RigidBody
      ref={body}
      colliders={false}
      position={SPAWN}
      mass={1}
      linearDamping={0.55}
      angularDamping={4}
      enabledRotations={[false, true, false]}
      onCollisionEnter={() => {
        // a intensidade vem da velocidade no instante do toque
        const rb = body.current;
        if (!rb) return;
        const { x, z } = rb.linvel();
        audio.impact(Math.min(Math.hypot(x, z) / 12, 1));
      }}
      canSleep={false}
      ccd
    >
      {/* Sem atrito de contato: a aderência é simulada no useFrame (modelo arcade).
          Com o atrito do Rapier o chão freava o carro antes do motor vencer. */}
      <CuboidCollider
        args={[0.6, 0.5, 1.45]}
        position={[0, 0.5, 0]}
        friction={0}
        frictionCombineRule={CoefficientCombineRule.Min}
        restitution={0.05}
      />
      <group ref={visual}>
        <CarModel wheelRefs={wheelRefs} />
      </group>
    </RigidBody>
  );
}
