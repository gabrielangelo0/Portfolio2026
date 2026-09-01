# Portfólio 3D dirigível

Portfólio interativo inspirado em [bruno-simon.com](https://bruno-simon.com/): você dirige um
carro low-poly por uma cena 3D e cada área do mundo abre uma seção do portfólio.

Feito com **Next.js (App Router) + React Three Fiber + Rapier**, sem nenhum asset externo —
todo o cenário é montado com geometrias primitivas, então o carregamento é instantâneo.

## Rodando

```bash
npm install
npm run dev
```

Abra http://localhost:3000.

Build de produção:

```bash
npm run build && npm start
```

## Controles

| Ação | Teclado | Toque |
| --- | --- | --- |
| Acelerar / ré | `W` `S` ou ↑ ↓ | pedais **Acelerar** e **Ré**, à direita |
| Esterçar | `A` `D` ou ← → | volante analógico, à esquerda |
| Freio | `Espaço` | — |
| Voltar à largada | `R` | botão "Reiniciar posição" |
| Abrir o mapa | `M` | tocar no minimapa |

No celular o volante é **analógico**: o esterço é proporcional ao quanto o polegar
se afasta do centro, com zona morta de 12% e retorno automático. `input.left` e
`input.right` aceitam frações justamente para isso — a física usa a diferença
entre os dois, então teclado (0 ou 1) e volante (contínuo) passam pelo mesmo
caminho.

A lista de seções no canto da tela também é um atalho: clicar em um item leva o carro
direto até a zona correspondente, para quem não quiser dirigir.

## Mapa

Minimapa no estilo GTA: o carro fica fixo no centro apontando para cima e o mundo
gira em volta; seções fora do alcance viram blips presos na borda, indicando a
direção. Clicar nele (ou `M`) abre o mapa inteiro, onde cada seção é um botão que
leva o carro até lá.

A geometria do cenário mora em [lib/world.ts](lib/world.ts) — arena, largada,
rampas, caixas e o gerador procedural de árvores — porque o mundo 3D e o mapa
desenham os mesmos objetos: duplicar as posições faria o mapa mentir assim que o
cenário mudasse. A pose do carro é publicada em [lib/carState.ts](lib/carState.ts),
fora do React, e o minimapa desenha no próprio `requestAnimationFrame`; passar por
estado faria o overlay renderizar 60 vezes por segundo.

## Som

Todo o áudio é **sintetizado em Web Audio** — nenhum arquivo para baixar, no mesmo
espírito do resto do projeto ([lib/audio.ts](lib/audio.ts)):

- **motor procedural**: três parciais por um filtro passa-baixa, com frequência,
  corte e ganho acompanhando velocidade e acelerador — reage de verdade, em vez de
  tocar um loop gravado;
- **derrapagem**: ruído em passa-banda que só aparece quando o carro escorrega de
  lado com velocidade;
- **trilha ambiente**: progressão Am–F–C–G em pad, com melodia em pentatônica de lá
  menor sorteada a cada compasso, agendada com lookahead (`setInterval` sozinho não
  é preciso o bastante para música);
- **efeitos**: batida (ruído + "toc" grave, com a intensidade vinda da velocidade no
  instante da colisão) e um sino de duas notas ao chegar numa seção.

O contexto de áudio nasce dentro do clique em "Entrar no carro" — a política de
autoplay exige um gesto do usuário — e é suspenso quando a aba sai de vista. O botão
🔊 no HUD silencia tudo. Se o navegador recusar criar o contexto, o jogo entra normal,
só que mudo: o áudio nunca bloqueia a entrada.

## Estrutura

```
app/                 layout, página e estilos globais
components/
  Scene.tsx          junta o Canvas (client-only) com a UI em HTML
  canvas/
    Experience.tsx   Canvas, luzes, névoa e o mundo físico
    Car.tsx          física arcade do carro, câmera e detecção de zonas
    CarModel.tsx     carroceria low-poly (hatch compacto) modelada por código
    World.tsx        chão, muros, rampas, caixas e cenário procedural
    ProjectZone.tsx  plataforma, feixe de luz e rótulo de cada seção
  ui/                intro, HUD, painel de conteúdo e controles de toque
app/inspect/         oficina do modelo do carro (ver abaixo)
lib/data.ts          SEU CONTEÚDO: perfil e seções do portfólio
lib/controls.ts      estado de input compartilhado (fora do React, por performance)
lib/audio.ts         motor, trilha e efeitos, todos sintetizados
store/               estado da aplicação (zustand)
```

## Personalizando

Todo o conteúdo vive em [`lib/data.ts`](lib/data.ts): nome, cargo, e-mail e a lista de
seções. Cada seção tem `position: [x, 0, z]` — é onde o círculo colorido nasce no mundo.
As zonas ficam num anel em volta da largada (`0, 0`), então vale manter os pontos
espalhados e a pelo menos 8 unidades uns dos outros; o cenário procedural evita
automaticamente essas áreas.

## O carro

O carro é um hatch compacto modelado a partir de fotos de referência, inteiramente
por código — nenhum arquivo `.glb`. A silhueta lateral é uma `THREE.Shape` extrudada,
com as caixas de roda recortadas no próprio contorno. Uma extrusão pura, porém, vira
um tubo: `shapeBody()` afina a largura no teto, nas saias e nas pontas, abaula capô e
teto em direção às bordas e deixa frente e traseira convexas em planta.

A **frente** é montada com peças próprias, todas desenhadas em coordenadas absolutas
de largura e altura e passadas por `curveToNose()`, que as leva até o para-choque e as
curva com ele — é isso que impede faróis e grade de boiarem à frente da lataria:

- faróis em bumerangue (as duas lentes numa `ExtrudeGeometry` só), com DRL, projetor,
  refletor e seta âmbar por dentro;
- grade inferior trapezoidal (estreita em cima, alargando até a base) com colmeia
  desenhada em `<canvas>` — os hexágonos em geometria custariam centenas de meshes.
  A textura é tileável e usa `RepeatWrapping`: a UV da `ExtrudeGeometry` é a própria
  coordenada do mundo, então metade da grade tem `u` negativo e, com o clamp padrão,
  a textura "parte" no meio;
- ponte preta com emblema oval, filetes cromados, asas do para-choque e lâmina inferior;
- dois vincos no capô convergindo para o emblema.

Os vidros são uma segunda extrusão, levemente maior que a lataria para aflorarem nas
laterais e não serem cobertos no para-brisa e no vidro traseiro.

Escala: 1 unidade ≈ 1,43 m (comprimento 2,9 = 4,15 m).

Para mexer no modelo, use a oficina em **`/inspect`**, que mostra o carro isolado,
em fundo claro e com órbita livre:

```
/inspect?view=lateral            # frente, traseira, lateral, 3-4, 3-4-tras, topo, roda
/inspect?view=roda&steer=1&spin=0.8   # confere esterço e giro do pneu parados
```

`steer` vai de -1 a 1 (positivo = curva à direita do carro, mesma convenção do
jogo) e `spin` é o giro do pneu em radianos. Serve para checar o eixo de rotação
das rodas sem depender da física.

Trocar de carro é editar `components/canvas/CarModel.tsx`. Se ao mudar as dimensões
o carro passar a flutuar ou afundar, ajuste o `CuboidCollider` em
[Car.tsx](components/canvas/Car.tsx): a base dele (`position.y - args[1]`) precisa
coincidir com o ponto em que os pneus tocam o chão.

## Notas de implementação

- **Física arcade**: o collider do carro tem atrito zero (`frictionCombineRule: Min`) e
  toda a aderência é simulada no `useFrame` — motor, grip lateral e esterço proporcional à
  velocidade. Com o atrito de Coulomb do Rapier o chão freava o carro antes do motor vencer.
- **Sem tunneling**: `timeStep` fixo em 1/60, CCD ligado no carro e chão com 10 unidades de
  espessura — em um frame longo (aba em segundo plano) o carro não atravessa o mundo.
- **Inclinação nas rampas**: o corpo físico tem pitch e roll travados
  (`enabledRotations={[false, true, false]}`) para nunca capotar e deixar o jogador
  preso. A inclinação é visual: quatro raycasts medem a altura do chão à frente,
  atrás e dos dois lados, e o modelo é rotacionado para acompanhar a rampa. No ar,
  sem contato, ele volta suavemente à horizontal.
- **Rodas**: os grupos das rodas usam ordem de Euler `YXZ` — o esterço (Y) tem que
  ser aplicado antes do giro do pneu (X), senão a roda cambaleia nas curvas em vez
  de girar no próprio eixo. O ângulo vem do raio real (ω = v / r) e o acumulador
  fica em [0, 2π) para não perder precisão com o tempo.
- **Cena determinística**: as árvores e pedras usam um PRNG com semente fixa, então
  servidor e cliente geram o mesmo cenário.
- **Câmera responsiva**: em telas verticais ela se afasta e mira abaixo do carro, para o
  painel de conteúdo não cobrir a ação.
