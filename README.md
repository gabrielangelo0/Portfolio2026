# Drivable 3D portfolio

An interactive portfolio inspired by [bruno-simon.com](https://bruno-simon.com/): you
drive a low-poly car through a 3D valley, and each area of the world opens a section
of the portfolio.

Built with **Next.js (App Router) + React Three Fiber + Rapier**, with **no external
assets** — the car, the scenery, the audio and the map are all generated in code, so
there is nothing to download and it works offline.

## Running

```bash
npm install
npm run dev
```

Open http://localhost:3000.

Production build:

```bash
npm run build && npm start
```

## Controls

| Action | Keyboard | Touch |
| --- | --- | --- |
| Throttle / reverse | `W` `S` or ↑ ↓ | **Throttle** and **Reverse** pedals, bottom right |
| Steer | `A` `D` or ← → | analog wheel, bottom left |
| Brake | `Space` | — |
| Back to start | `R` | "Restart" button |
| Open the map | `M` | tap the minimap |

Steering is **direct**, like any racing game: `A` and `D` turn the car's wheel, and the
physics mirrors the command in reverse — which is what a real car does with its wheels
turned. On mobile the analog wheel only steers; the pedals provide traction.

There was an experiment with **screen-relative steering** (pressing `D` would mean "go
right on screen" even with the car driving towards the camera, with the turn direction
decided on key-down and locked while held). It works as specified, but it confuses in
practice: the command stops matching the wheel. It is kept in
[Car.tsx](components/canvas/Car.tsx) behind the `SCREEN_RELATIVE_STEERING` constant —
flip it to `true` to bring it back.

The section list in the corner is also a shortcut: clicking an entry drives the car
straight to that zone, for visitors who would rather not drive.

## The plain version

Not every visit wants to drive — a recruiter in a hurry, a weak phone, someone who would
rather just read. `/classic` is the same portfolio as a page: hero, tools, the same dated
timeline the gates tell, one card per section, and contact. The start screen links to it
right under the button.

It reads from the same sources as the 3D world — `projects`, `stack` and the career
milestones — so the two versions cannot drift apart. It ships no WebGL: 3.5 kB against
12 kB for the driving route, prerendered as static HTML, which also makes it the version
search engines actually read.

## The career track

The dirt track that leaves the start pad is the story: it winds through the valley past
six dated gates — 2012 Java, 2015 PHP, 2020 HTML/CSS/JS, 2021 first developer job, 2024
startup partner, 2025 teaching at Digital College — and then climbs the hillside to a
chequered finish line, where crossing it sets off confetti and a fanfare.

The route lives in [lib/career.ts](lib/career.ts) as a Catmull-Rom spline in plain
JavaScript, with no three.js import, because three different places need it and none of
them may disagree: the ribbon drawn in the world, the line on the minimap, and the rule
that keeps procedural scenery from growing on the track. `Finish line` in the section
list drives you to the last stretch.

The shape — half an ellipse around the valley, then the run west — was picked against
two hard constraints: it starts under the spawn point (the car begins *on* the track,
pointing along it), and no radius of curvature may be smaller than half the ribbon's
width, or the ribbon folds over itself in the bend. An earlier route failed both: the
car started six metres off the track, and the exit from the start pad had a 1.9 m radius
that creased the road.

Three things the track forced:

- **the ribbon sits 15 cm above the ground.** It is built from the exact height
  function, while the visible terrain is a mesh that interpolates linearly between
  vertices — on curved stretches that mesh rose *in front of* the ribbon and the track
  disappeared into the hillside. The grid went to 96 subdivisions and the lift covers
  what is left;
- **a parking brake.** The car's collider has no friction, so on any slope it slid back
  down on its own, and stopping at the finish to read it meant rolling away. Below
  `PARK_SPEED`, with no throttle and the car settled on the ground, lateral drift is
  zeroed. A plateau carved into the terrain was tried first and was worse: it raised a
  2.5 m step across the hillside that the car simply crashed into.

## Hidden things

Six objects are scattered around the hillside — a rubber duck, a ladybug, a giant coffee
cup, a 404 road sign, a hovering UFO and a 3½" floppy. Driving within seven metres of one
counts as finding it: a note slides in, the tally in the corner goes up, and the object
itself rises, spins and shrinks away — leaving it standing there sent players back to
collect what they had already collected. Nothing is stored, so a reload puts all six
back. There is a seventh thing, and it is not on the map — try the Konami code.

They also do the scenery a favour. The valley is laid out by sector, and before this the
south and south-west had almost nothing in them while both ramps sat side by side in the
west. Ramps, crates and village clusters were redistributed one per sector — positions
chosen by a search for the largest clearance from the track, the sections and the start
pad — and the secrets fill the outer ring, which until then was only trees.

That crowding had a cost worth knowing about: with the track, the finish clearing and the
secrets all claiming space, the house generator went from thirteen cottages to four,
because it gave up on the first collision. It now tries several spots per house.

A trap worth writing down: the first version gave each secret a `pointLight`, and
collecting one dropped it from the scene. `NUM_POINT_LIGHTS` is part of three.js's shader
key, so losing a single light forced **every material in the scene to recompile** —
measured at 40 programs before and 54 after, which is the second or two of freeze that
showed up on every pickup. The glow is now an additive shell instead, and the UFO's beam
a cone. Light count now holds at 11 through a pickup (it was 18 before), so the whole
scene got cheaper too.

## The scenery

A green valley ringed by mountains, with forest, a hamlet and a lake — all generated in
code:

- **the climb**: the middle of the valley is flat (that is where the start, the sections
  and the ramps live) and the ground rises towards the rim, so driving outwards means
  climbing. The visible mesh and the collider come from the same height function in
  [lib/terrain.ts](lib/terrain.ts), and the collider *is* that mesh (a trimesh), so the
  physical ground cannot drift from what you see;
- **mountains** in three rings, each paler and bluer than the last, with snow on the far
  peaks. Their heights are deliberately modest: taller peaks eat the whole sky at the
  game's camera angle;
- **forest** of pines, broadleaves, bushes and rocks, drawn with `InstancedMesh` (one
  draw call per type, not per tree) and tinted from a palette so the woods don't look
  flat. Density grows with the cube of the distance from the centre: thick at the rim,
  sparse in the middle, otherwise the car spends the whole time dodging trunks;
- **hamlet** of cottages with gable roofs, chimneys and lit windows;
- **sky** as a gradient dome. The drei `<Sky>` covered the whole scene in white at this
  camera angle, so the shader is hand-written — and it matches the fog better.

## The car

A compact hatchback modelled from reference photos, entirely in code — no `.glb`. The
side profile is an extruded `THREE.Shape` with the wheel arches cut into the outline.
A plain extrusion, though, looks like a tube: `shapeBody()` narrows the width at the
roof, the sills and the ends, crowns the bonnet and roof towards the edges, and makes
the front and rear convex in plan.

The **front** is assembled from its own pieces, all drawn in absolute width/height
coordinates and passed through `curveToNose()`, which moves them onto the bumper and
curves them with it — that is what stops the headlights and grille from floating in
front of the bodywork:

- boomerang headlights (both lenses in a single `ExtrudeGeometry`) with DRL, projector,
  reflector and amber indicator inside;
- a trapezoidal lower grille whose honeycomb is drawn to a `<canvas>` and used as a
  texture — the hexagons in geometry would cost hundreds of meshes. The texture is
  tileable and uses `RepeatWrapping`: `ExtrudeGeometry`'s UVs are world coordinates, so
  half the grille has negative `u` and, with the default clamp, the texture splits down
  the middle;
- a black bridge with an oval badge, chrome trim, bumper wings and a lower lip;
- two bonnet creases converging on the badge.

Scale: 1 unit ≈ 1.43 m (length 2.9 = 4.15 m).

To work on the model, use the workshop at **`/inspect`**, which shows the car alone on a
light background with free orbit:

```
/inspect?view=side                     # front, rear, side, 3-4, 3-4-rear, top, wheel, grille
/inspect?view=wheel&steer=1&spin=0.8   # inspect steering and wheel spin, frozen
```

## The map

A GTA-style minimap: the car sits at the centre pointing up and the world rotates around
it; sections out of range become blips pinned to the rim, showing their direction.
Clicking it (or `M`) opens the full map, where every section is a button that drives the
car there.

The scenery geometry lives in [lib/world.ts](lib/world.ts) — arena, start pad, ramps,
crates and the procedural tree generator — because the 3D world and the map draw the
same objects: duplicating the positions would make the map lie the moment the scenery
changed. The car's pose is published through [lib/carState.ts](lib/carState.ts), outside
React, and the minimap draws on its own `requestAnimationFrame`; going through state
would re-render the overlay sixty times a second.

## Sound

All audio is **synthesised with Web Audio** — no files ([lib/audio.ts](lib/audio.ts)):

- **procedural engine**: three partials through a low-pass filter, with frequency, cutoff
  and gain following speed and throttle — it actually reacts, instead of looping a
  recording;
- **tyre scrub**: band-passed noise that only appears when the car slides sideways with
  speed;
- **ambient score**: an Am–F–C–G pad with a melody drawn from the A minor pentatonic,
  scheduled with lookahead (`setInterval` alone isn't precise enough for music);
- **effects**: impacts (noise plus a low thump, intensity taken from the speed at the
  moment of contact) and a two-note chime on reaching a section.

The audio context is created inside the click on "Get in the car" — autoplay policy
requires a gesture — and is suspended when the tab goes away. The 🔊 button in the HUD
mutes everything. If the browser refuses to create the context the site still opens,
just silent: audio never blocks entry.

## Structure

```
app/                 layout, page and global styles
  inspect/           car model workshop (see above)
components/
  Scene.tsx          joins the client-only Canvas with the HTML UI
  canvas/
    Experience.tsx   Canvas, sky, lights, fog and the physics world
    Car.tsx          arcade physics, camera and zone detection
    CarModel.tsx     low-poly hatchback built from code
    World.tsx        terrain, forest, hamlet, mountains, ramps and crates
    ProjectZone.tsx  platform, light beam and label for each section
  ui/                intro, HUD, content panel, map and touch controls
lib/data.ts          YOUR CONTENT: profile and portfolio sections
lib/terrain.ts       height function shared by the mesh and the collider
lib/world.ts         scenery geometry shared with the minimap
lib/controls.ts      shared input state (outside React, for performance)
lib/audio.ts         engine, score and effects, all synthesised
store/               application state (zustand)
```

## Customising

All the content lives in [lib/data.ts](lib/data.ts): name, role, email and the list of
sections. Each section has `position: [x, 0, z]` — where its coloured circle appears in
the world. The sections sit in a ring around the start pad (`0, 0`); keep them spread
out and at least 8 units apart, and keep them inside the flat middle of the valley
(radius 28) so they don't end up on the slope. The procedural scenery avoids those
areas automatically.

## Implementation notes

- **Arcade physics**: the car's collider has zero friction (`frictionCombineRule: Min`)
  and all the grip is simulated in `useFrame` — engine, lateral grip and speed-dependent
  steering. With Rapier's Coulomb friction the ground braked the car before the engine
  could win.
- **Hill hold**: with a frictionless collider nothing holds the car on a slope, so it
  would roll back down on its own. A drag force applies below walking speed, without
  spoiling a fast descent.
- **Getting unstuck**: pinned against an obstacle, turning would drive the car's corner
  into it and the solver cancels the rotation — the player was stuck facing the wall
  with reverse as the only way out. Now, if they accelerate while asking for a turn and
  still don't move, the car backs off just enough to steer. Which end to aim comes from
  *intent* (`W` aims the nose, `S` the tail) and the mirroring compensation from *actual
  velocity*: mixing the two made the steering flip mid-manoeuvre.
- **No tunneling**: fixed `timeStep` of 1/60 and CCD on the car, so a long frame (a
  backgrounded tab) can't push it through the world.
- **Slope tilt**: the body has pitch and roll locked so it can never flip and strand the
  player. The tilt is visual: four raycasts measure the ground ahead, behind and to each
  side, and the model follows the slope, easing back to level in the air.
- **Wheels**: the wheel groups use `YXZ` Euler order — steering (Y) has to be applied
  before spin (X), or the wheel wobbles through corners instead of spinning on its axis.
  The angle comes from the real radius (ω = v / r) and the accumulator stays in [0, 2π).
- **Deterministic scene**: trees and rocks use a seeded PRNG, so server and client
  generate the same world.
- **Responsive camera**: on tall screens it pulls back and aims below the car, so the
  content panel doesn't cover the action.
