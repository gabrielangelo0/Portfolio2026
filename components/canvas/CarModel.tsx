"use client";

import { forwardRef, useMemo } from "react";
import * as THREE from "three";

/**
 * Hatch compacto modelado a partir de fotos de referência (Toyota Yaris XS).
 * A silhueta lateral é uma Shape extrudada — é o perfil que faz o carro ser
 * reconhecível — e o resto são primitivas encaixadas por cima.
 *
 * Escala: 1 unidade ≈ 1,43 m. Comprimento 2,9 (4,15 m), largura 1,21 (1,73 m),
 * altura 1,05 (1,50 m), entre-eixos 1,78 (2,55 m).
 */

const LENGTH = 2.9;
const WIDTH = 1.21;
const BEVEL = 0.045;
const HALF_LENGTH = LENGTH / 2;

const FRONT_AXLE = 2.29; // no espaço da Shape (0 = traseira)
const REAR_AXLE = 0.51;
export const WHEEL_RADIUS = 0.25;
const WHEEL_WIDTH = 0.17;
const TRACK = 0.5; // meia-bitola

/** Converte X da Shape (0 = traseira) para Z do carro (frente = +Z). */
const toZ = (x: number) => x - HALF_LENGTH;

const BODY_COLOR = "#60666f";
const BODY_DARK = "#40454e";
const GLASS_COLOR = "#16181e";
const TRIM_COLOR = "#1c1f25";
const CHROME_COLOR = "#c3c8d1";

const smoothstep = (edge0: number, edge1: number, x: number) => {
  const t = THREE.MathUtils.clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
};

/**
 * Uma extrusão pura vira um tubo: sem isto o carro fica com cara de pão.
 * Três deformações, aplicadas na ordem em que se enxergam no carro real:
 * a largura afina no teto, nas saias e nas pontas; o capô e o teto abaulam
 * para as bordas; e a frente e a traseira ficam convexas em planta — sem esta
 * última a frente é literalmente uma parede reta.
 */
function shapeBody(geometry: THREE.BufferGeometry, extraWidth = 1) {
  const position = geometry.attributes.position as THREE.BufferAttribute;
  const halfWidth = WIDTH / 2;

  for (let i = 0; i < position.count; i++) {
    const x = position.getX(i);
    const y = position.getY(i);
    const z = position.getZ(i);

    // 1. largura: estreita no teto, nas saias e nas pontas
    const top = 1 - 0.12 * smoothstep(0.72, 1.05, y);
    const bottom = 1 - 0.06 * smoothstep(0.34, 0.12, y);
    const along = Math.abs(z) / HALF_LENGTH;
    const ends = 1 - 0.07 * smoothstep(0.6, 1, along);
    const newX = x * top * bottom * ends * extraWidth;

    // 2. abaulamento: capô e teto caem em direção às bordas
    const lateral = Math.min(Math.abs(newX) / halfWidth, 1);
    const newY = y - 0.05 * smoothstep(0.5, 0.78, y) * lateral * lateral;

    // 3. planta convexa nas pontas: as quinas recuam, o centro avança
    const nose = smoothstep(0.72, 1, along) * lateral * lateral;
    const newZ = z - Math.sign(z) * 0.16 * nose;

    position.setXYZ(i, newX, newY, newZ);
  }

  position.needsUpdate = true;
  geometry.computeVertexNormals();
  return geometry;
}

/** Recuo da frente em planta, o mesmo aplicado à lataria em shapeBody(). */
const NOSE_CURVE = 0.16;
/** O chanfro da lataria avança ~5 cm: sem esta folga as peças ficam embutidas. */
const NOSE_SKIN = 0.06;
const HALF_WIDTH = WIDTH / 2;
const noseZAt = (x: number) => {
  const lateral = Math.min(Math.abs(x) / HALF_WIDTH, 1);
  return toZ(LENGTH) + NOSE_SKIN - NOSE_CURVE * lateral * lateral;
};

/**
 * Faz uma peça frontal abraçar a curvatura do para-choque. Sem isto as pontas
 * de faróis e grade ficam boiando à frente da lataria.
 */
function curveToNose(geometry: THREE.BufferGeometry) {
  const position = geometry.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < position.count; i++) {
    // leva a peça até a frente do carro e a curva junto com o para-choque
    position.setZ(i, position.getZ(i) + noseZAt(position.getX(i)));
  }
  position.needsUpdate = true;
  geometry.computeVertexNormals();
  return geometry;
}

/**
 * Colmeia da grade desenhada em canvas: reproduzir os hexágonos em geometria
 * custaria centenas de meshes por nada.
 */
function useHoneycombTexture() {
  return useMemo(() => {
    // O padrão precisa ser tileável: os passos saem do tamanho do canvas, não o
    // contrário, senão a emenda aparece ao repetir.
    const radius = 20;
    const stepX = radius * 1.5;
    const columns = 4;
    const rows = 7;
    const width = Math.round(2 * stepX * columns);
    const height = Math.round(Math.sqrt(3) * radius * rows);
    const stepY = height / rows;

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    ctx.fillStyle = "#08090b";
    ctx.fillRect(0, 0, width, height);
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#3c414a";

    // desenha uma volta a mais em cada direção para os hexágonos cruzarem a borda
    for (let col = -1; col <= columns * 2 + 1; col++) {
      for (let row = -1; row <= rows + 1; row++) {
        const cx = col * stepX;
        const cy = row * stepY + (col % 2 ? stepY / 2 : 0);
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const angle = (Math.PI / 3) * i;
          const px = cx + radius * Math.cos(angle);
          const py = cy + radius * Math.sin(angle);
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.stroke();
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    // A UV da ExtrudeGeometry é a coordenada do mundo, então metade da grade tem
    // u negativo: sem RepeatWrapping o Three clampa e a textura "parte" no meio.
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(3.4, 3.4);
    texture.anisotropy = 8;
    return texture;
  }, []);
}

/** Grade inferior: o hexágono achatado que domina o para-choque. */
function useGrilleGeometry() {
  return useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(-0.3, 0.47);
    shape.lineTo(0.3, 0.47);
    shape.lineTo(0.45, 0.17);
    shape.lineTo(-0.45, 0.17);
    shape.closePath();

    const geometry = new THREE.ExtrudeGeometry(shape, {
      depth: 0.1,
      bevelEnabled: true,
      bevelThickness: 0.015,
      bevelSize: 0.015,
      bevelSegments: 1,
    });
    geometry.translate(0, 0, -0.06);
    return curveToNose(geometry);
  }, []);
}

/** Moldura preta em volta da grade, com as bordas seguindo o para-choque. */
function useGrilleFrameGeometry() {
  return useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(-0.335, 0.5);
    shape.lineTo(0.335, 0.5);
    shape.lineTo(0.495, 0.14);
    shape.lineTo(-0.495, 0.14);
    shape.closePath();

    const geometry = new THREE.ExtrudeGeometry(shape, { depth: 0.16, bevelEnabled: false });
    geometry.translate(0, 0, -0.17);
    return curveToNose(geometry);
  }, []);
}

/**
 * Faróis em bumerangue, os dois numa geometria só: ponta afilada apontando
 * para o emblema e canto externo alto, acompanhando a linha do capô. É o traço
 * que mais identifica esta frente.
 */
function useHeadlightGeometry() {
  return useMemo(() => {
    const right = new THREE.Shape();
    right.moveTo(0.11, 0.552); // ponta interna, junto do emblema
    right.quadraticCurveTo(0.25, 0.598, 0.39, 0.622);
    right.quadraticCurveTo(0.49, 0.638, 0.555, 0.618); // canto externo, colado no capô
    right.lineTo(0.562, 0.555);
    right.quadraticCurveTo(0.43, 0.512, 0.25, 0.522); // borda inferior
    right.closePath();

    const left = new THREE.Shape();
    left.moveTo(-0.11, 0.552);
    left.quadraticCurveTo(-0.25, 0.598, -0.39, 0.622);
    left.quadraticCurveTo(-0.49, 0.638, -0.555, 0.618);
    left.lineTo(-0.562, 0.555);
    left.quadraticCurveTo(-0.43, 0.512, -0.25, 0.522);
    left.closePath();

    const geometry = new THREE.ExtrudeGeometry([right, left], {
      depth: 0.16,
      bevelEnabled: true,
      bevelThickness: 0.012,
      bevelSize: 0.012,
      bevelSegments: 1,
    });
    geometry.translate(0, 0, -0.14);
    return curveToNose(geometry);
  }, []);
}

/** Luz de condução diurna: a faixa clara na borda de cima do farol. */
function useDrlGeometry() {
  return useMemo(() => {
    const band = (sign: number) => {
      const shape = new THREE.Shape();
      shape.moveTo(sign * 0.17, 0.564);
      shape.quadraticCurveTo(sign * 0.3, 0.605, sign * 0.42, 0.63);
      shape.quadraticCurveTo(sign * 0.5, 0.645, sign * 0.548, 0.626);
      shape.lineTo(sign * 0.544, 0.608);
      shape.quadraticCurveTo(sign * 0.45, 0.623, sign * 0.33, 0.594);
      shape.quadraticCurveTo(sign * 0.25, 0.573, sign * 0.178, 0.549);
      shape.closePath();
      return shape;
    };

    const geometry = new THREE.ExtrudeGeometry([band(1), band(-1)], {
      depth: 0.05,
      bevelEnabled: false,
    });
    geometry.translate(0, 0, -0.012);
    return curveToNose(geometry);
  }, []);
}

/**
 * Para-brisa. Peça própria em vez de parte do greenhouse: o bevel infla a
 * lataria ~4,5 cm, então o painel precisa de uma folga maior que isso para
 * aflorar — como parte do polígono da cabine ele afundava e só aparecia uma
 * tira fina de vidro junto ao capô.
 */
function useWindshieldGeometry() {
  return useMemo(() => {
    const shape = new THREE.Shape();
    // face externa, acompanhando a curva do para-brisa da lataria
    shape.moveTo(2.045, 0.858);
    shape.quadraticCurveTo(1.72, 0.985, 1.32, 1.095);
    // volta pela face interna
    shape.lineTo(1.315, 1.063);
    shape.quadraticCurveTo(1.72, 0.953, 2.038, 0.826);
    shape.closePath();

    const width = WIDTH * 0.995;
    const geometry = new THREE.ExtrudeGeometry(shape, {
      depth: width,
      bevelEnabled: false,
      curveSegments: 12,
    });
    geometry.rotateY(-Math.PI / 2);
    geometry.translate(0, 0, -HALF_LENGTH);
    geometry.translate(width / 2, 0, 0);
    return shapeBody(geometry);
  }, []);
}

/** "Asas" cromadas das quinas do para-choque. */
function useBumperWingGeometry() {
  return useMemo(() => {
    const wing = (sign: number) => {
      const shape = new THREE.Shape();
      shape.moveTo(sign * 0.44, 0.17);
      shape.lineTo(sign * 0.5, 0.19);
      shape.lineTo(sign * 0.52, 0.35);
      shape.lineTo(sign * 0.47, 0.38);
      shape.lineTo(sign * 0.45, 0.24);
      shape.closePath();
      return shape;
    };

    const geometry = new THREE.ExtrudeGeometry([wing(1), wing(-1)], {
      depth: 0.1,
      bevelEnabled: false,
    });
    geometry.translate(0, 0, -0.085);
    return curveToNose(geometry);
  }, []);
}

/** Lâmina preta inferior do para-choque. */
function useLowerLipGeometry() {
  return useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(-0.52, 0.175);
    shape.lineTo(0.52, 0.175);
    shape.lineTo(0.52, 0.115);
    shape.lineTo(-0.52, 0.115);
    shape.closePath();

    const geometry = new THREE.ExtrudeGeometry(shape, { depth: 0.22, bevelEnabled: false });
    geometry.translate(0, 0, -0.24);
    return curveToNose(geometry);
  }, []);
}

function useBodyGeometry() {
  return useMemo(() => {
    const shape = new THREE.Shape();

    // traseira quase vertical, como num hatch
    shape.moveTo(0.16, 0.13);
    shape.lineTo(0.07, 0.26);
    shape.lineTo(0.04, 0.5);
    shape.lineTo(0.05, 0.72); // faixa das lanternas
    shape.lineTo(0.1, 0.84); // base do vidro traseiro
    shape.quadraticCurveTo(0.17, 0.99, 0.34, 1.035); // vidro traseiro
    shape.lineTo(1.26, 1.05); // teto
    shape.quadraticCurveTo(1.52, 1.04, 1.76, 0.88); // para-brisa
    shape.lineTo(2.02, 0.79); // base do para-brisa
    // Capô: uma curva só, levemente convexa, do para-brisa até o nariz. Antes
    // era um trecho reto seguido de um joelho, o que criava a barriga.
    shape.quadraticCurveTo(2.49, 0.745, 2.85, 0.615);
    shape.quadraticCurveTo(2.9, 0.575, 2.9, 0.45); // dobra para a frente
    shape.lineTo(2.89, 0.22);
    shape.lineTo(2.88, 0.22);
    shape.lineTo(2.76, 0.13);
    shape.lineTo(2.62, 0.13);

    // caixa de roda dianteira (arco aberto para baixo)
    shape.lineTo(2.6, 0.28);
    shape.absarc(FRONT_AXLE, 0.28, 0.33, 0, Math.PI, false);
    shape.lineTo(1.9, 0.13);

    shape.lineTo(0.9, 0.13); // soleira

    // caixa de roda traseira
    shape.lineTo(0.83, 0.28);
    shape.absarc(REAR_AXLE, 0.28, 0.33, 0, Math.PI, false);
    shape.lineTo(0.16, 0.13);
    shape.closePath();

    const geometry = new THREE.ExtrudeGeometry(shape, {
      depth: WIDTH - BEVEL * 2,
      bevelEnabled: true,
      bevelThickness: BEVEL,
      bevelSize: BEVEL,
      bevelSegments: 1,
      curveSegments: 12,
    });

    // comprimento no eixo Z, largura no X, base no chão
    geometry.rotateY(-Math.PI / 2);
    geometry.translate(0, 0, -HALF_LENGTH);
    geometry.translate(WIDTH / 2 - BEVEL, 0, 0);
    return shapeBody(geometry);
  }, []);
}

/** Faixa escura da cabine: pilares e vidros em uma peça só, como insulfilm. */
function useGreenhouseGeometry() {
  return useMemo(() => {
    const shape = new THREE.Shape();
    // Os vértices ficam ~2 cm à frente da lataria: sem essa folga o corpo
    // cobre o para-brisa e o vidro traseiro nas vistas de frente e de trás.
    shape.moveTo(1.95, 0.78); // base do pilar A
    shape.lineTo(1.72, 0.9);
    shape.lineTo(1.3, 1.02); // sob o teto
    shape.lineTo(0.06, 0.875); // vidro traseiro
    shape.lineTo(0.02, 0.75);
    shape.lineTo(1.35, 0.72); // linha de cintura: janelas laterais mais altas
    shape.closePath();

    const geometry = new THREE.ExtrudeGeometry(shape, {
      depth: WIDTH,
      bevelEnabled: false,
      curveSegments: 8,
    });
    geometry.rotateY(-Math.PI / 2);
    geometry.translate(0, 0, -HALF_LENGTH);
    geometry.translate(WIDTH / 2, 0, 0);
    // um pouco mais largo que a lataria para os vidros aflorarem na lateral
    return shapeBody(geometry, 1.006);
  }, []);
}

type WheelProps = { position: [number, number, number] };

const Wheel = forwardRef<THREE.Group, WheelProps>(function Wheel({ position }, ref) {
  const spokes = useMemo(() => [0, 1, 2, 3, 4].map((i) => (i * Math.PI * 2) / 5), []);

  return (
    <group ref={ref} position={position} rotation-order="YXZ">
      {/* pneu */}
      <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[WHEEL_RADIUS, WHEEL_RADIUS, WHEEL_WIDTH, 18]} />
        <meshStandardMaterial color="#14161a" roughness={0.92} />
      </mesh>

      {/* aro de liga nas duas faces */}
      {[1, -1].map((side) => (
        <group key={side} position={[side * (WHEEL_WIDTH / 2 - 0.01), 0, 0]}>
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.16, 0.16, 0.02, 18]} />
            <meshStandardMaterial color={CHROME_COLOR} metalness={0.85} roughness={0.32} />
          </mesh>
          <mesh rotation={[0, 0, Math.PI / 2]} position={[side * 0.012, 0, 0]}>
            <cylinderGeometry args={[0.05, 0.05, 0.02, 12]} />
            <meshStandardMaterial color="#9aa0aa" metalness={0.8} roughness={0.35} />
          </mesh>
          {spokes.map((angle, i) => (
            <mesh key={i} rotation={[angle, 0, 0]} position={[side * 0.012, 0, 0]}>
              <boxGeometry args={[0.014, 0.27, 0.05]} />
              <meshStandardMaterial color={CHROME_COLOR} metalness={0.8} roughness={0.34} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
});

type Props = {
  wheelRefs: {
    frontLeft: React.RefObject<THREE.Group | null>;
    frontRight: React.RefObject<THREE.Group | null>;
    rearLeft: React.RefObject<THREE.Group | null>;
    rearRight: React.RefObject<THREE.Group | null>;
  };
};

export function CarModel({ wheelRefs }: Props) {
  const bodyGeometry = useBodyGeometry();
  const greenhouseGeometry = useGreenhouseGeometry();
  const windshieldGeometry = useWindshieldGeometry();
  const grilleGeometry = useGrilleGeometry();
  const grilleFrameGeometry = useGrilleFrameGeometry();
  const headlightGeometry = useHeadlightGeometry();
  const drlGeometry = useDrlGeometry();
  const bumperWingGeometry = useBumperWingGeometry();
  const lowerLipGeometry = useLowerLipGeometry();
  const honeycomb = useHoneycombTexture();

  const tailZ = toZ(0.04);

  return (
    <group>
      <mesh geometry={bodyGeometry} castShadow receiveShadow>
        <meshStandardMaterial color={BODY_COLOR} metalness={0.45} roughness={0.38} />
      </mesh>

      <mesh geometry={greenhouseGeometry} castShadow>
        <meshStandardMaterial color={GLASS_COLOR} metalness={0.5} roughness={0.18} />
      </mesh>

      <mesh geometry={windshieldGeometry} castShadow>
        <meshStandardMaterial color="#191c23" metalness={0.55} roughness={0.1} />
      </mesh>

      {/* ---------- frente ----------
          Todas as peças abaixo são desenhadas em coordenadas absolutas de
          largura/altura e curvadas por curveToNose(), então basta posicioná-las
          em z = 0 do grupo do carro: elas já nascem coladas no para-choque. */}

      <mesh geometry={grilleFrameGeometry}>
        <meshStandardMaterial color="#101217" roughness={0.5} metalness={0.15} />
      </mesh>

      <mesh geometry={grilleGeometry}>
        {honeycomb ? (
          <meshStandardMaterial map={honeycomb} color="#ffffff" roughness={0.85} metalness={0.1} />
        ) : (
          <meshStandardMaterial color={TRIM_COLOR} roughness={0.85} />
        )}
      </mesh>

      {/* placa, apoiada na colmeia */}
      <mesh position={[0, 0.3, noseZAt(0) + 0.035]}>
        <boxGeometry args={[0.36, 0.12, 0.03]} />
        <meshStandardMaterial color="#e8ebef" roughness={0.55} />
      </mesh>

      {/* ponte preta entre os faróis, onde mora o emblema */}
      <mesh position={[0, 0.552, noseZAt(0) - 0.03]}>
        <boxGeometry args={[0.4, 0.075, 0.12]} />
        <meshStandardMaterial color="#0f1116" roughness={0.4} metalness={0.2} />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * 0.16, 0.545, noseZAt(0.16) + 0.005]}>
          <boxGeometry args={[0.14, 0.022, 0.04]} />
          <meshStandardMaterial color={CHROME_COLOR} metalness={0.9} roughness={0.22} />
        </mesh>
      ))}
      <group position={[0, 0.545, noseZAt(0) + 0.025]} rotation={[0.1, 0, 0]}>
        <mesh scale={[1, 0.62, 1]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.082, 0.082, 0.025, 22]} />
          <meshStandardMaterial color={CHROME_COLOR} metalness={0.9} roughness={0.2} />
        </mesh>
        <mesh scale={[1, 0.62, 1]} rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.012]}>
          <cylinderGeometry args={[0.052, 0.052, 0.02, 22]} />
          <meshStandardMaterial color="#20242c" metalness={0.7} roughness={0.3} />
        </mesh>
      </group>

      {/* faróis: a lente é escura; o que brilha são DRL, projetor e seta */}
      <mesh geometry={headlightGeometry}>
        <meshStandardMaterial color="#93a0b3" metalness={0.82} roughness={0.14} />
      </mesh>
      <mesh geometry={drlGeometry}>
        <meshStandardMaterial
          color="#fbfdff"
          emissive="#dceaff"
          emissiveIntensity={0.75}
          roughness={0.08}
        />
      </mesh>
      {[-1, 1].map((side) => (
        <group key={side}>
          {/* fundo escuro da carcaça, atrás da lente */}
          <mesh position={[side * 0.33, 0.548, noseZAt(0.33) + 0.012]} rotation={[0, side * -0.2, side * 0.07]}>
            <boxGeometry args={[0.34, 0.05, 0.03]} />
            <meshStandardMaterial color="#161a20" roughness={0.35} metalness={0.3} />
          </mesh>
          {/* projetor */}
          <mesh
            position={[side * 0.42, 0.573, noseZAt(0.42) + 0.03]}
            rotation={[Math.PI / 2, 0, 0]}
          >
            <cylinderGeometry args={[0.038, 0.038, 0.03, 16]} />
            <meshStandardMaterial
              color="#f8fbff"
              emissive="#fff0cc"
              emissiveIntensity={1.8}
              roughness={0.1}
            />
          </mesh>
          {/* refletor secundário, mais para dentro */}
          <mesh
            position={[side * 0.26, 0.556, noseZAt(0.26) + 0.03]}
            rotation={[Math.PI / 2, 0, 0]}
          >
            <cylinderGeometry args={[0.024, 0.024, 0.03, 12]} />
            <meshStandardMaterial color="#c9d3e2" metalness={0.75} roughness={0.2} />
          </mesh>
          {/* seta âmbar rente à borda inferior */}
          <mesh
            position={[side * 0.36, 0.529, noseZAt(0.36) + 0.028]}
            rotation={[0, side * -0.22, side * 0.05]}
          >
            <boxGeometry args={[0.15, 0.022, 0.04]} />
            <meshStandardMaterial color="#e8871f" emissive="#ff8a1e" emissiveIntensity={0.55} />
          </mesh>
        </group>
      ))}

      <mesh geometry={bumperWingGeometry}>
        <meshStandardMaterial color="#a9b0bb" metalness={0.85} roughness={0.28} />
      </mesh>

      <mesh geometry={lowerLipGeometry}>
        <meshStandardMaterial color={TRIM_COLOR} roughness={0.85} />
      </mesh>

      {/* vincos do capô, convergindo para o emblema */}
      {[-1, 1].map((side) => (
        <mesh
          key={side}
          position={[side * 0.28, 0.754, toZ(2.3)]}
          rotation={[0.115, side * 0.14, 0]}
        >
          <boxGeometry args={[0.05, 0.008, 0.48]} />
          <meshStandardMaterial color={BODY_COLOR} metalness={0.45} roughness={0.36} />
        </mesh>
      ))}

      {/* ---------- traseira ---------- */}
      {[-1, 1].map((side) => (
        <group key={side}>
          {/* lanterna em L: barra na tampa + retorno pela lateral */}
          <mesh position={[side * 0.31, 0.75, tailZ - 0.03]}>
            <boxGeometry args={[0.3, 0.13, 0.08]} />
            <meshStandardMaterial color="#e02637" emissive="#ff2438" emissiveIntensity={1.4} />
          </mesh>
          <mesh position={[side * 0.47, 0.7, tailZ + 0.12]}>
            <boxGeometry args={[0.06, 0.22, 0.2]} />
            <meshStandardMaterial color="#c81f30" emissive="#ff2438" emissiveIntensity={1} />
          </mesh>
        </group>
      ))}
      {/* placa e para-choque traseiro */}
      <mesh position={[0, 0.46, tailZ - 0.02]}>
        <boxGeometry args={[0.32, 0.11, 0.05]} />
        <meshStandardMaterial color="#d9dde4" roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.21, tailZ + 0.03]}>
        <boxGeometry args={[0.94, 0.1, 0.12]} />
        <meshStandardMaterial color={TRIM_COLOR} roughness={0.85} />
      </mesh>

      {/* ---------- teto ---------- */}
      <mesh position={[0, 1.06, toZ(0.36)]} rotation={[0.3, 0, 0]} castShadow>
        <boxGeometry args={[0.92, 0.045, 0.26]} />
        <meshStandardMaterial color={BODY_DARK} metalness={0.4} roughness={0.45} />
      </mesh>
      <mesh position={[0, 1.11, toZ(0.52)]} rotation={[0.45, 0, 0]}>
        <cylinderGeometry args={[0.011, 0.015, 0.2, 6]} />
        <meshStandardMaterial color={TRIM_COLOR} roughness={0.6} />
      </mesh>

      {/* ---------- laterais ---------- */}
      {[-1, 1].map((side) => (
        <group key={side}>
          <mesh position={[side * 0.59, 0.84, toZ(1.9)]} rotation={[0, side * 0.2, 0]} castShadow>
            <boxGeometry args={[0.11, 0.075, 0.15]} />
            <meshStandardMaterial color={BODY_COLOR} metalness={0.45} roughness={0.4} />
          </mesh>
          {[toZ(1.5), toZ(0.88)].map((z) => (
            <mesh key={z} position={[side * 0.56, 0.71, z]}>
              <boxGeometry args={[0.04, 0.035, 0.15]} />
              <meshStandardMaterial color={BODY_DARK} metalness={0.5} roughness={0.4} />
            </mesh>
          ))}
          <mesh position={[side * 0.53, 0.17, toZ(1.42)]}>
            <boxGeometry args={[0.04, 0.06, 1.4]} />
            <meshStandardMaterial color={TRIM_COLOR} roughness={0.85} />
          </mesh>
        </group>
      ))}

      <Wheel ref={wheelRefs.frontLeft} position={[-TRACK, WHEEL_RADIUS, toZ(FRONT_AXLE)]} />
      <Wheel ref={wheelRefs.frontRight} position={[TRACK, WHEEL_RADIUS, toZ(FRONT_AXLE)]} />
      <Wheel ref={wheelRefs.rearLeft} position={[-TRACK, WHEEL_RADIUS, toZ(REAR_AXLE)]} />
      <Wheel ref={wheelRefs.rearRight} position={[TRACK, WHEEL_RADIUS, toZ(REAR_AXLE)]} />
    </group>
  );
}
