"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import {
  CoefficientCombineRule,
  RapierRigidBody,
  RigidBody,
  RoundCuboidCollider,
  useRapier,
} from "@react-three/rapier";
import * as THREE from "three";
import { CarModel, WHEEL_RADIUS } from "./CarModel";
import { input, bindKeyboard } from "@/lib/controls";
import { audio } from "@/lib/audio";
import { carState } from "@/lib/carState";
import { START_HEADING, trackPointAt } from "@/lib/career";
import { projects } from "@/lib/data";
import { terrainHeight } from "@/lib/terrain";
import { useGameStore } from "@/store/useGameStore";

const ENGINE_FORCE = 34;
const REVERSE_FORCE = 16;
const MAX_SPEED = 17;
const MAX_REVERSE_SPEED = 7;
const TURN_SPEED = 2.1;
const GRIP = 6.5;
const BRAKE = 3.2;
/**
 * Sem isto o carro desce a encosta de ré sozinho: o collider tem atrito zero
 * (a aderência é toda simulada aqui), então nada o segura parado numa ladeira.
 * Só age em baixa velocidade, para não atrapalhar quem desce a serra embalado.
 */
const HILL_HOLD = 9;
const HILL_HOLD_MAX_SPEED = 4;
/** Abaixo desta velocidade e sem acelerador, o carro fica onde parou. */
const PARK_SPEED = 1.8;
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
// Mais deitada que uma câmera isométrica pura: é o que deixa a serra e o céu
// entrarem no enquadramento em vez de só o gramado.
const CAMERA_OFFSET = new THREE.Vector3(0, 8, 18);

const INPUT_DEAD_ZONE = 0.14;

/**
 * Direção relativa à tela — **desligada**, guardada de propósito.
 *
 * A ideia era corrigir a perspectiva: apertar D significaria "vá para a direita
 * da tela" mesmo com o carro vindo na direção da câmera, com o sentido do giro
 * decidido no instante do toque e travado enquanto a tecla ficasse pressionada
 * (soltar e apertar recalculava). Funciona como especificado — os testes
 * confirmam que o carro vai para o mesmo lado da tela nas duas orientações —
 * mas na prática confunde mais do que ajuda: o comando deixa de corresponder ao
 * volante e o jogador perde a noção de para que lado o carro vai virar.
 *
 * O padrão agora é o esterço direto de qualquer jogo de corrida. Para reativar
 * o experimento, basta pôr esta constante em `true`.
 */
const SCREEN_RELATIVE_STEERING = false;

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
    rb.setRotation(
      { x: 0, y: Math.sin(START_HEADING / 2), z: 0, w: Math.cos(START_HEADING / 2) },
      true,
    );
  };

  useEffect(() => {
    if (resetSignal > 0) respawn();
  }, [resetSignal]);

  // Atalho da lista lateral: leva o carro até a entrada da zona escolhida,
  // já virado para o centro dela.
  useEffect(() => {
    const rb = body.current;
    if (!rb || !teleport) return;

    let x: number;
    let z: number;
    let yaw: number;

    if (teleport.id === "finish") {
      // Larga o carro um pouco antes da linha e apontado para ela: quem pede a
      // chegada quer cruzá-la, não olhar para ela parado do lado.
      const approach = trackPointAt(0.93);
      x = approach.x;
      z = approach.z;
      yaw = Math.atan2(approach.dx, approach.dz);
    } else {
      const target = projects.find((p) => p.id === teleport.id);
      if (!target) return;

      const [tx, , tz] = target.position;
      const distance = Math.hypot(tx, tz) || 1;
      x = tx + (tx / distance) * 3;
      z = tz + (tz / distance) * 3;
      yaw = Math.atan2(tx - x, tz - z);
    }

    // A altura vem do relevo — com y fixo o carro cairia de 4 metros na encosta
    // — e a folga é curta de propósito: caindo de mais alto ele bate na rampa
    // com velocidade suficiente para escapar da trava de estacionamento e sair
    // ladeira abaixo sozinho.
    rb.setTranslation({ x, y: terrainHeight(x, z) + 0.6, z }, true);
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
  const stuckFor = useRef(0);
  const unstickUntil = useRef(0);
  const steerSign = useRef(0);
  const steerHeld = useRef(false);

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
    // Direção direta, como em qualquer jogo de corrida: A e D esterçam o volante
    // do carro, e a física espelha o comando em marcha à ré — que é o que um
    // carro de verdade faz com as rodas viradas. O modo relativo à tela fica
    // guardado atrás de SCREEN_RELATIVE_STEERING.
    let throttle = 0;
    let steer = 0;

    if (started) {
      const pedal = input.throttle - input.reverse;
      throttle = pedal !== 0 ? pedal : input.moveY;

      const lateral = input.moveX;
      const holding = Math.abs(lateral) > INPUT_DEAD_ZONE;

      if (SCREEN_RELATIVE_STEERING) {
        // Sentido decidido na borda de subida e travado enquanto a tecla fica
        // pressionada — ver o comentário de SCREEN_RELATIVE_STEERING.
        if (holding && !steerHeld.current) {
          camera.getWorldDirection(cameraForward);
          cameraForward.setY(0).normalize();
          cameraRight.crossVectors(cameraForward, UP).normalize();
          desired.copy(cameraRight).multiplyScalar(Math.sign(lateral));

          // dando ré é a traseira que aponta para onde o carro vai
          const heading =
            throttle < 0
              ? Math.atan2(-forward.x, -forward.z)
              : Math.atan2(forward.x, forward.z);
          const deviation = wrapAngle(Math.atan2(desired.x, desired.z) - heading);
          steerSign.current = deviation >= 0 ? 1 : -1;
        }
        steerHeld.current = holding;

        if (holding) {
          steer = steerSign.current * Math.min(Math.abs(lateral), 1);
          // a física espelha o comando com velocidade negativa; desfaz aqui
          if (signedSpeed < -0.4) steer = -steer;
        }
      } else if (holding) {
        // D vira o volante para a direita do carro. O sinal é negativo porque
        // yaw positivo gira o nariz de +Z para +X, que é o lado esquerdo dele.
        steer = -Math.max(-1, Math.min(1, lateral));
      }
    }

    // Desencalhe. Prensado contra um obstáculo, girar enfiaria a quina do carro
    // nele e o solver cancela a rotação: o jogador ficava preso apontando para
    // a parede e só saía dando ré na mão. Quando ele acelera, pede direção e
    // mesmo assim não sai do lugar, o carro recua sozinho o suficiente para
    // descolar e conseguir esterçar.
    const wantsToTurn = Math.abs(input.moveX) > INPUT_DEAD_ZONE;
    if (throttle !== 0 && wantsToTurn && Math.abs(signedSpeed) < 0.6) {
      stuckFor.current += delta;
      if (stuckFor.current > 0.25) unstickUntil.current = state.clock.elapsedTime + 0.6;
    } else {
      stuckFor.current = 0;
    }
    const unsticking = state.clock.elapsedTime < unstickUntil.current;

    // aceleração / ré
    if (unsticking) {
      impulse
        .copy(forward)
        .multiplyScalar(-Math.sign(throttle) * ENGINE_FORCE * 0.8 * delta);
      rb.applyImpulse(impulse, true);
    } else if (throttle > 0 && signedSpeed < MAX_SPEED) {
      impulse.copy(forward).multiplyScalar(ENGINE_FORCE * throttle * delta);
      rb.applyImpulse(impulse, true);
    } else if (throttle < 0 && signedSpeed > -MAX_REVERSE_SPEED) {
      impulse.copy(forward).multiplyScalar(REVERSE_FORCE * throttle * delta);
      rb.applyImpulse(impulse, true);
    }

    // trava de ladeira
    if (throttle === 0 && !input.brake && planarSpeed < HILL_HOLD_MAX_SPEED) {
      impulse.copy(velocity).multiplyScalar(-HILL_HOLD * delta);
      rb.applyImpulse(impulse, true);
    }

    // Trava de estacionamento. O arrasto acima freia, mas não segura: numa
    // ladeira o collider sem atrito desce sozinho para sempre, e quem parou no
    // alto da serra para ler a chegada voltava ladeira abaixo. Sem acelerador,
    // quase parado e com o carro apoiado no chão, a deriva horizontal morre.
    const settling = Math.abs(linvel.y) < 2;
    if (throttle === 0 && !input.brake && planarSpeed < PARK_SPEED && settling) {
      rb.setLinvel({ x: 0, y: linvel.y, z: 0 }, true);
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
    // Encostado num obstáculo a velocidade cai a ~0 e o esterço morria junto: o
    // carro ficava preso apontando para a parede e só saía dando ré. Com o
    // acelerador aplicado o volante mantém um mínimo de autoridade.
    const steerAuthority = Math.max(
      Math.min(planarSpeed / 4, 1),
      unsticking ? 0.9 : throttle !== 0 ? 0.45 : 0,
    );
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
    // mira acima do carro: sem isso o horizonte fica fora do quadro e a serra
    // ao redor do vale nunca aparece
    camera.lookAt(
      cameraTarget.x,
      cameraTarget.y + 3.2 - (zoomOut - 1) * 11,
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
      // nasce apontado ao longo da pista: largar de lado deixava o jogador de
      // cara para a grama, sem saber por onde a história começa
      rotation={[0, START_HEADING, 0]}
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
          Com o atrito do Rapier o chão freava o carro antes do motor vencer.

          Quinas arredondadas de propósito: sobre o terreno em malha, um cuboide
          de quinas vivas engancha nas arestas entre triângulos — batidas em
          pontos invisíveis — e chega a atravessar o chão. */}
      <RoundCuboidCollider
        args={[0.54, 0.44, 1.39, 0.06]}
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
