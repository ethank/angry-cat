# Angry Cat Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a first-person obstacle course horror game where the player navigates a house while avoiding an angry cat with jump scares.

**Architecture:** Vite + Three.js vanilla JS app. Modular file structure with separate modules for player, cat AI, rooms, sounds, and HUD. Launcher is a DOM overlay; game is a Three.js scene with PointerLockControls. Cat uses a GLTF model with animations and 3-state AI (lurk, stalk, pounce).

**Tech Stack:** Vite, Three.js, vanilla JS, Web Audio API, GLTF model loading

---

### Task 1: Project Scaffolding

**Files:**
- Create: `package.json`
- Create: `vite.config.js`
- Create: `index.html`
- Create: `src/main.js`
- Create: `src/styles.css`

**Step 1: Initialize the project**

```bash
cd /Users/ethankaplan/Development/gametest
npm init -y
npm install three
npm install -D vite
```

**Step 2: Create vite.config.js**

```js
import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  publicDir: 'public',
  build: {
    outDir: 'dist',
  },
});
```

**Step 3: Create index.html**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Angry Cat</title>
  <link rel="stylesheet" href="/src/styles.css" />
</head>
<body>
  <div id="launcher"></div>
  <div id="hud"></div>
  <div id="game-canvas"></div>
  <script type="module" src="/src/main.js"></script>
</body>
</html>
```

**Step 4: Create src/styles.css with basic resets**

```css
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: #000;
  font-family: sans-serif;
}

canvas {
  display: block;
}
```

**Step 5: Create src/main.js with a basic Three.js scene**

```js
import * as THREE from 'three';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x111111);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 1.6, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.getElementById('game-canvas').appendChild(renderer.domElement);

// Test cube
const cube = new THREE.Mesh(
  new THREE.BoxGeometry(1, 1, 1),
  new THREE.MeshStandardMaterial({ color: 0xff6600 })
);
cube.position.set(0, 0.5, -3);
scene.add(cube);

// Basic light
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(5, 10, 5);
scene.add(light);
scene.add(new THREE.AmbientLight(0x404040));

// Floor
const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(20, 20),
  new THREE.MeshStandardMaterial({ color: 0x333333 })
);
floor.rotation.x = -Math.PI / 2;
scene.add(floor);

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}
animate();
```

**Step 6: Add dev script to package.json and test**

Add to package.json scripts: `"dev": "vite", "build": "vite build"`

Run: `npm run dev`
Expected: Browser opens, shows orange cube on dark floor.

**Step 7: Commit**

```bash
git add package.json vite.config.js index.html src/main.js src/styles.css
git commit -m "feat: scaffold Vite + Three.js project with basic scene"
```

---

### Task 2: Launcher Screen

**Files:**
- Create: `src/launcher.js`
- Modify: `src/styles.css`
- Modify: `src/main.js`
- Modify: `index.html`

**Step 1: Add Google Font to index.html**

Add to `<head>`:
```html
<link href="https://fonts.googleapis.com/css2?family=Creepster&display=swap" rel="stylesheet">
```

**Step 2: Create src/launcher.js**

The launcher module creates the DOM overlay, handles the PLAY button click, and calls a callback when the player starts. Use DOM creation methods (createElement/textContent) instead of innerHTML for safety.

```js
export function createLauncher(onStart) {
  const launcher = document.getElementById('launcher');

  // Build launcher DOM
  const bg = document.createElement('div');
  bg.className = 'launcher-bg';

  const fog = document.createElement('div');
  fog.className = 'fog';
  bg.appendChild(fog);

  const content = document.createElement('div');
  content.className = 'launcher-content';

  const eyes = document.createElement('div');
  eyes.className = 'cat-eyes';
  const leftEye = document.createElement('div');
  leftEye.className = 'eye left';
  const rightEye = document.createElement('div');
  rightEye.className = 'eye right';
  eyes.appendChild(leftEye);
  eyes.appendChild(rightEye);
  content.appendChild(eyes);

  const title = document.createElement('h1');
  title.className = 'title';
  title.textContent = 'ANGRY CAT';
  content.appendChild(title);

  const subtitle = document.createElement('p');
  subtitle.className = 'subtitle';
  subtitle.textContent = "Don't wake the cat.";
  content.appendChild(subtitle);

  const playBtn = document.createElement('button');
  playBtn.className = 'play-btn';
  playBtn.textContent = 'PLAY';
  content.appendChild(playBtn);

  bg.appendChild(content);
  launcher.appendChild(bg);

  playBtn.addEventListener('click', () => {
    launcher.classList.add('fade-out');
    setTimeout(() => {
      launcher.style.display = 'none';
      onStart();
    }, 500);
  });
}
```

**Step 3: Add launcher CSS to src/styles.css**

Full launcher styles including:
- `.launcher-bg` -- fixed fullscreen, dark background (#0a0a0a), z-index 50 above canvas
- `.fog` -- CSS animated translucent gradient that drifts using keyframes
- `.title` -- Creepster font, 6rem, color #ff3333, text-shadow red glow
- `.subtitle` -- 1.5rem, color #666
- `.cat-eyes` -- two 20px glowing green circles (#44ff44) with box-shadow glow, blink animation (opacity keyframes)
- `.play-btn` -- padding 1rem 3rem, font-size 1.5rem, Creepster font, background transparent, border 2px solid #ff3333, color #ff3333, cursor pointer, pulse animation (scale keyframes 1.0 to 1.05)
- `.play-btn:hover` -- background rgba(255,50,50,0.2)
- `.fade-out` -- transition opacity 0.5s, opacity 0
- `.launcher-content` -- flexbox column, centered, gap 2rem

**Step 4: Wire launcher into main.js**

```js
import { createLauncher } from './launcher.js';

// ... scene setup code (but don't call animate() yet) ...

createLauncher(() => {
  renderer.domElement.requestPointerLock();
  animate();
});
```

**Step 5: Test**

Run: `npm run dev`
Expected: See launcher screen with title, glowing eyes, PLAY button. Clicking PLAY fades out launcher and shows the 3D scene.

**Step 6: Commit**

```bash
git add src/launcher.js src/styles.css src/main.js index.html
git commit -m "feat: add launcher screen with animated cat eyes and play button"
```

---

### Task 3: Player Controls & Movement

**Files:**
- Create: `src/player.js`
- Modify: `src/main.js`

**Step 1: Create src/player.js**

Player module that handles:
- PointerLockControls for mouse look
- WASD movement with configurable walk/sprint speeds (walk=4, sprint=6)
- Shift to sprint with stamina system (3s drain, 4s recharge)
- Raycast collision detection against scene objects (cast rays in movement direction, block if hit within 0.5 units)
- Head bob effect while moving (sine wave on camera Y, amplitude 0.04)
- Footstep tracking (fires callback on each step for sound, faster interval when sprinting)
- Eye height at 1.6m
- Exposes: position, stamina, isSprinting, isMoving, lock(), isLocked

**Step 2: Wire player into main.js**

Replace the static camera with the Player class. Add THREE.Clock for delta time. Pass collidables array from scene to player.update().

**Step 3: Test**

Run: `npm run dev`
Expected: Click to lock pointer. WASD moves, mouse looks around, shift sprints, head bobs while walking. Can't walk through the test cube.

**Step 4: Commit**

```bash
git add src/player.js src/main.js
git commit -m "feat: add first-person player controls with stamina and collision"
```

---

### Task 4: Room System & House Layout

**Files:**
- Create: `src/house.js`
- Create: `src/rooms/kitchen.js`
- Create: `src/rooms/hallway.js`
- Create: `src/rooms/livingRoom.js`
- Create: `src/rooms/bedroom.js`
- Modify: `src/main.js`

**Step 1: Create src/house.js**

House module with:
- `createRoom(width, depth, height, position, floorColor, wallColor)` helper that creates floor, ceiling, walls with optional doorways
- Doorways: wall with gap (two side segments + top piece above door)
- `createHouse(scene)` function that calls each room creator and returns `{ rooms, collidables }`
- Rooms laid out along Z axis: Kitchen z=0, Hallway z=-7, Living Room z=-15, Bedroom z=-21

**Step 2: Create each room module**

Each room file exports a function returning `{ group, collidables, catHidingSpots, triggerZone, spawnPoint, floorType, name }`.

- **kitchen.js**: 8x6, z=0. Floor color 0x8B7355 (tile). Table (wide box at y=0.8), 4 chairs (small boxes), counter along back wall (long box). Cat hiding spots: behind counter, under table.
- **hallway.js**: 3x8, z=-7. Floor color 0x654321 (wood). Narrow, small side table. Cat hiding spot: end of hall in shadow.
- **livingRoom.js**: 8x6, z=-15. Floor color 0x556B2F (carpet). Couch (wide low box), coffee table (flat box), bookshelf (tall box against wall). Cat hiding spots: behind couch, behind bookshelf.
- **bedroom.js**: 8x6, z=-21. Floor color 0x4A4A4A (dark carpet). Bed (large box), dresser (medium box), closet (tall box). Front door exit zone at far -z wall. Cat hiding spots: under bed, behind closet.

**Step 3: Wire house into main.js**

Replace test cube with `createHouse(scene)`. Set player spawn at kitchen entrance (0, 1.6, 2).

**Step 4: Test**

Run: `npm run dev`
Expected: Walk through 4 connected rooms. Each has different colored floors, furniture to navigate around, doorways between them.

**Step 5: Commit**

```bash
git add src/house.js src/rooms/ src/main.js
git commit -m "feat: add house with 4 rooms, furniture, and doorways"
```

---

### Task 5: Lighting & Atmosphere

**Files:**
- Create: `src/lighting.js`
- Modify: `src/main.js`

**Step 1: Create src/lighting.js**

LightingManager class:
- Very dim ambient light (0x111122, intensity 0.3)
- `addRoomLight(position, color, intensity, flicker)` adds a PointLight with shadow support
- Flicker logic: on each frame, 5% chance to randomize intensity (0.3-1.0x base), 0.5% chance to go fully dark momentarily
- `update(delta)` processes flicker animations

**Step 2: Add lighting per room**

- Kitchen: PointLight(0xFFE4B5, 1.5) centered overhead, no flicker
- Hallway: PointLight(0xFFFFAA, 1.0) centered, flicker=true
- Living Room: PointLight(0xFFD700, 0.6) at lamp position (corner), no flicker
- Bedroom: PointLight(0x4444FF, 0.3) moonlight feel, no flicker

Call `lightingManager.update(delta)` in game loop.

**Step 3: Test**

Run: `npm run dev`
Expected: Each room has distinct lighting mood. Hallway light flickers randomly. Bedroom is very dark. Shadows cast from furniture.

**Step 4: Commit**

```bash
git add src/lighting.js src/main.js
git commit -m "feat: add atmospheric room lighting with flickering hallway"
```

---

### Task 6: Cat Model & AI

**Files:**
- Create: `src/cat.js`
- Create: `public/models/` directory
- Modify: `src/main.js`

**Step 1: Set up cat model loading**

Download the animated cat GLB from Sketchfab (https://sketchfab.com/3d-models/an-animated-cat-aec25699660043a29595f9572149d1e8) and place at `public/models/cat.glb`.

If model is unavailable, implement fallback: dark box body (0.4x0.3x0.8), box head, cone ears, cylinder tail, glowing green sphere eyes.

**Step 2: Create src/cat.js**

Cat class with 3-state AI:

**LURKING state:**
- Model is at hiding spot, invisible
- Waiting for player to enter room's trigger zone
- `activate()` transitions to STALKING

**STALKING state:**
- Model becomes visible, looks at player
- Moves toward player at `speed * aggressionMultiplier` (base speed=2)
- If player is sprinting, multiply cat speed by 1.5
- Glowing eyes always visible (MeshBasicMaterial, emissive green)
- After stalkDuration (5s) OR distance < 2m, transition to POUNCING

**POUNCING state:**
- Fires `onJumpScare` callback
- No further movement (jump scare system handles the rest)

Additional:
- `setupForRoom(roomIndex, hidingSpots, aggressionMultiplier)` resets cat for a new room
- `load()` async method to load GLTF with GLTFLoader, set up AnimationMixer
- `update(delta, playerPosition, playerIsSprinting)` processes state machine
- `getDistanceTo(playerPosition)` for proximity checks

Aggression multipliers: Kitchen=1.0, Hallway=1.3, LivingRoom=1.6, Bedroom=2.0

**Step 3: Wire cat into main.js**

- Load cat model during init (await cat.load())
- In game loop: check if player is in current room's trigger zone, call cat.activate()
- Call cat.update(delta, playerPosition, playerIsSprinting) each frame
- Set cat.onJumpScare callback

**Step 4: Test**

Run: `npm run dev`
Expected: Walk into a room trigger zone, cat appears and stalks toward player with glowing eyes. When close enough, triggers pounce state.

**Step 5: Commit**

```bash
git add src/cat.js public/models/ src/main.js
git commit -m "feat: add cat AI with lurk/stalk/pounce states and GLTF model"
```

---

### Task 7: Jump Scare System

**Files:**
- Create: `src/jumpScare.js`
- Modify: `src/styles.css`
- Modify: `src/main.js`

**Step 1: Create src/jumpScare.js**

JumpScare class:
- Creates overlay div (class `jumpscare-overlay`, display:none, z-index 100)
- `trigger()` method:
  - Shows overlay with red flash (CSS animation, 0.5s)
  - Sets camera shake params (intensity=0.15, duration=0.5s)
  - After 600ms: shows death message (random from list: "The cat got you.", "You should have been quieter.", "Cats always win.", "That cat is REALLY angry.", "Maybe try tiptoeing next time?")
  - After 2500ms: hides overlay, calls `onRespawn` callback
- `update(delta)` method: applies camera shake (random rotation.x and rotation.z offsets) while shakeDuration > 0
- Uses createElement/textContent for DOM manipulation (no innerHTML)

**Step 2: Add jump scare CSS**

- `.jumpscare-overlay` -- fixed fullscreen, z-index 100, flex centered
- `.jumpscare-flash` -- fullscreen red background, opacity animation 0.9 to 0
- `.death-screen` -- black background, centered text, #ff3333, Creepster font, 3rem

**Step 3: Wire into main.js**

- cat.onJumpScare calls jumpScare.trigger()
- jumpScare.onRespawn resets player to current room spawnPoint, resets cat with new hiding spot
- Call jumpScare.update(delta) in game loop

**Step 4: Test**

Run: `npm run dev`
Expected: When cat reaches player, screen flashes red, camera shakes, death message appears, player respawns at room start.

**Step 5: Commit**

```bash
git add src/jumpScare.js src/styles.css src/main.js
git commit -m "feat: add jump scare system with camera shake and death messages"
```

---

### Task 8: Sound System

**Files:**
- Create: `src/sounds.js`
- Create: `public/sounds/` directory
- Modify: `src/main.js`

**Step 1: Create src/sounds.js**

SoundManager class using Three.js AudioListener + Audio + PositionalAudio:

- Constructor takes camera, creates AudioListener, attaches to camera
- `generateProceduralSounds()` -- creates in-memory AudioBuffers using Web Audio API:
  - Ambient: low brown noise loop (filtered white noise)
  - Footsteps: short noise bursts with bandpass filter (vary per floor type by filter frequency)
  - Cat growl: low frequency oscillator (sawtooth, 80-120Hz) with tremolo
  - Cat hiss: high frequency noise burst (0.3s)
  - Cat yowl: frequency sweep oscillator (200Hz to 800Hz, 0.5s) -- the jump scare sound
  - Door creak: slow frequency sweep (100-400Hz, 0.8s)
- `loadSound(name, path, loop, volume)` -- loads from file, falls back to procedural
- `createPositionalSound(name, position)` -- for cat growl (directional audio)
- `play(name)`, `stop(name)`, `setVolume(name, vol)`
- `updateCatGrowl(catPosition, catDistance)` -- move positional sound, adjust volume by distance

Note: All audio must be initialized after a user gesture (PLAY button click).

**Step 2: Wire sounds into main.js**

- Init SoundManager in onStart callback (after PLAY click)
- Generate procedural sounds
- Play ambient loop on game start
- Connect player.onStep to footstep sounds (pass floorType of current room)
- Update cat growl position/volume each frame based on cat state
- Play hiss on cat pounce, yowl on jump scare
- Play door creak on room transition

**Step 3: Test**

Run: `npm run dev`
Expected: Ambient sound plays on start, footsteps while walking, cat growl when stalking, loud yowl on jump scare.

**Step 4: Commit**

```bash
git add src/sounds.js public/sounds/ src/main.js
git commit -m "feat: add positional sound system with procedural audio"
```

---

### Task 9: HUD

**Files:**
- Create: `src/hud.js`
- Modify: `src/styles.css`
- Modify: `src/main.js`

**Step 1: Create src/hud.js**

HUD class:
- Builds DOM elements using createElement (no innerHTML)
- Stamina bar: thin bar (4px height, 200px width) at bottom center, green-to-red gradient based on value, only visible when sprinting or stamina < 1
- Room name: centered text, fades in on entry (opacity transition), fades out after 2s via setTimeout
- Timer: small text top-right, counts up in m:ss format
- `showRoomName(name)`, `updateStamina(stamina, isSprinting)`, `updateTimer(delta)`, `getTimeString()`, `reset()`

**Step 2: Add HUD CSS**

- `#hud` -- fixed, fullscreen, pointer-events none, z-index 10
- `.hud-stamina` -- fixed bottom center, opacity transition, hidden by default
- `.hud-stamina.visible` -- opacity 1
- `.hud-stamina-bar` -- height 4px, green background, transition width
- `.hud-room-name` -- fixed center, Creepster font, 2rem, white, opacity 0, transition
- `.hud-room-name.visible` -- opacity 1
- `.hud-timer` -- fixed top-right, monospace, 1rem, white, opacity 0.6

**Step 3: Wire HUD into main.js game loop**

Call hud.updateStamina(), hud.updateTimer() each frame. Call hud.showRoomName() on room transition.

**Step 4: Test and commit**

```bash
git add src/hud.js src/styles.css src/main.js
git commit -m "feat: add HUD with stamina bar, room names, and timer"
```

---

### Task 10: Room Transitions & Game Flow

**Files:**
- Modify: `src/main.js`

**Step 1: Implement room tracking**

Track current room based on player Z position and room boundaries. When player crosses into new room:
- Call hud.showRoomName(room.name)
- Play door creak sound
- Call cat.setupForRoom(roomIndex, room.catHidingSpots, aggressionMultiplier)
- Aggression values: Kitchen=1.0, Hallway=1.3, LivingRoom=1.6, Bedroom=2.0

**Step 2: Implement trigger zones**

Each frame, check if player position is within current room's triggerZone (AABB check). If so and cat is lurking, call cat.activate().

**Step 3: Implement win condition**

Define exit zone at far end of bedroom. When player enters it:
- Unlock pointer lock
- Stop game loop
- Show win screen

**Step 4: Implement respawn**

jumpScare.onRespawn:
- Move player to current room's spawnPoint
- Reset cat for same room (new hiding spot)
- Reset player stamina to full

**Step 5: Test full game loop**

Run: `npm run dev`
Expected: Navigate all 4 rooms, cat activates per room, jump scare respawns in same room, reaching end wins.

**Step 6: Commit**

```bash
git add src/main.js
git commit -m "feat: add room transitions, win condition, and full game loop"
```

---

### Task 11: Win Screen & Pause Menu

**Files:**
- Create: `src/screens.js`
- Modify: `src/styles.css`
- Modify: `src/main.js`

**Step 1: Create win screen**

DOM overlay (createElement, not innerHTML):
- White/gold gradient background fading in
- "YOU ESCAPED!" in large Creepster font, green color
- "The cat goes back to sleep... for now." subtitle
- Time displayed from HUD
- "PLAY AGAIN" button that resets everything and shows launcher

**Step 2: Create pause overlay**

On pointer lock exit (ESC):
- Show "PAUSED" overlay with "Click to resume" text
- On click: re-engage pointer lock, hide overlay, resume game loop

**Step 3: Add credits**

Small text on launcher: "Cat model by [creator] (CC-BY)" for attribution.

**Step 4: Add screen CSS**

Win screen and pause overlay styles matching game aesthetic.

**Step 5: Test**

Run: `npm run dev`
Expected: ESC pauses, click resumes. Reaching exit shows win screen. Play again works.

**Step 6: Commit**

```bash
git add src/screens.js src/styles.css src/main.js
git commit -m "feat: add win screen, pause menu, and model credits"
```

---

### Task 12: Final Integration Test

**Step 1: Full playthrough test**

Run: `npm run dev`

Test checklist:
- [ ] Launcher displays with animated eyes and title
- [ ] PLAY button starts game and locks pointer
- [ ] WASD movement, sprint with stamina works
- [ ] Can't walk through walls or furniture
- [ ] Kitchen warm, hallway flickers, bedroom dark
- [ ] Cat activates on trigger zone entry
- [ ] Cat stalks with glowing eyes, growl audio
- [ ] Jump scare: red flash, shake, death message, respawn
- [ ] All 4 rooms navigable via doorways
- [ ] Cat aggression increases in later rooms
- [ ] Front door exit triggers win screen with time
- [ ] Play again restarts from launcher
- [ ] ESC pauses, click resumes
- [ ] Sounds: ambient, footsteps, cat growl, hiss, yowl, door creak

**Step 2: Build test**

Run: `npm run build`
Expected: Builds to `dist/` without errors.

**Step 3: Final commit**

```bash
git add -A
git commit -m "chore: verify full game integration and build"
```
