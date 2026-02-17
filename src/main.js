import * as THREE from 'three';
import { createLauncher } from './launcher.js';
import { Player } from './player.js';
import { createHouse } from './house.js';
import { LightingManager } from './lighting.js';
import { Cat } from './cat.js';
import { JumpScare } from './jumpScare.js';
import { SoundManager } from './sounds.js';
import { HUD } from './hud.js';
import { WinScreen, PauseMenu, HelpOverlay, GameOverScreen } from './screens.js';
import { isTouchDevice, TouchControls } from './touchControls.js';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x111111);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 1.6, 2); // Kitchen spawn point

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.getElementById('game-canvas').appendChild(renderer.domElement);

// Player
const player = new Player(camera, scene, renderer.domElement);

// Build the house
const { rooms, collidables } = createHouse(scene);

// Atmospheric lighting — LightingManager provides dim ambient + per-room lights
const lightingManager = new LightingManager(scene);

// Kitchen: warm overhead light
lightingManager.addRoomLight(new THREE.Vector3(0, 2.8, 0), 0xFFE4B5, 1.5, false);

// Hallway: flickering light for tension
lightingManager.addRoomLight(new THREE.Vector3(0, 2.8, -7), 0xFFFFAA, 1.0, true);

// Living Room: dim lamp in the corner
lightingManager.addRoomLight(new THREE.Vector3(-3, 2, -14), 0xFFD700, 0.6, false);

// Bedroom: faint moonlight, very dark and scary
lightingManager.addRoomLight(new THREE.Vector3(2, 2.8, -20), 0x4444FF, 0.3, false);

// Cat AI
const cat = new Cat(scene);

// Jump scare system
const jumpScare = new JumpScare(camera);

// HUD
const hud = new HUD();

// Aggression multiplier per room: escalates as the player goes deeper
const ROOM_AGGRESSION = [1.0, 1.3, 1.6, 2.0];

// Room z-boundaries for detecting which room the player is in.
// Derived from each room's center-z and depth:
//   Kitchen:     center  0, depth 6  =>  z from -3  to +3
//   Hallway:     center -7, depth 8  =>  z from -11 to -3
//   Living Room: center -14, depth 6 =>  z from -17 to -11
//   Bedroom:     center -20, depth 6 =>  z from -23 to -17
const ROOM_Z_BOUNDS = [
  { minZ: -3, maxZ: 3 },     // 0: Kitchen
  { minZ: -11, maxZ: -3 },   // 1: Hallway
  { minZ: -17, maxZ: -11 },  // 2: Living Room
  { minZ: -23, maxZ: -17 },  // 3: Bedroom
];

// Sound manager — initialized after user click (Web Audio requires gesture)
let soundManager = null;

// Track which room the player is currently in (-1 = none/unknown)
let currentRoomIndex = -1;
// Track whether the cat has been activated in the current room
let catActivatedInRoom = false;

// Game state: controls whether game logic updates run
let gameRunning = false;

// Lives system — 3 hits before game over
const MAX_LIVES = 3;
let lives = MAX_LIVES;

// Whether the animate loop has been started (only start once)
let animateStarted = false;

// Touch controls instance (created on first game start, only on touch devices)
let touchControls = null;

/**
 * Determine which room the player is in based on their z-position.
 * Returns room index (0-3) or -1 if outside all rooms.
 */
function getRoomIndexForPosition(position) {
  const pz = position.z;
  for (let i = 0; i < ROOM_Z_BOUNDS.length; i++) {
    if (pz >= ROOM_Z_BOUNDS[i].minZ && pz <= ROOM_Z_BOUNDS[i].maxZ) {
      return i;
    }
  }
  return -1;
}

/**
 * Check whether a position is inside an AABB trigger zone.
 */
function isInsideTriggerZone(position, zone) {
  return (
    position.x >= zone.min.x && position.x <= zone.max.x &&
    position.z >= zone.min.z && position.z <= zone.max.z
  );
}

// ── Win Screen ──
const winScreen = new WinScreen(() => {
  // PLAY AGAIN callback: full reset
  resetGame();
});

// ── Game Over Screen ──
const gameOverScreen = new GameOverScreen(() => {
  // TRY AGAIN callback: full reset
  resetGame();
});

// ── Help Overlay (H key) ──
const helpOverlay = new HelpOverlay();

// ── Pause Menu ──
const pauseMenu = new PauseMenu(() => {
  if (isTouchDevice) {
    // On mobile, just hide pause and show touch controls again
    pauseMenu.hide();
    if (touchControls) touchControls.show();
  } else {
    // Desktop: re-request pointer lock
    player.lock();
  }
});

/**
 * Handle H key for help overlay toggle.
 */
document.addEventListener('keydown', (e) => {
  if (e.code === 'KeyH' && gameRunning) {
    helpOverlay.toggle();
  }
});

/**
 * Handle pointer lock changes for pause/resume.
 * (Touch devices don't use pointer lock — they have an explicit pause button.)
 */
document.addEventListener('pointerlockchange', () => {
  if (isTouchDevice) return;

  const isLocked = document.pointerLockElement === renderer.domElement;

  if (isLocked) {
    // Pointer lock acquired — hide pause, ensure game is running
    pauseMenu.hide();
  } else {
    // Pointer lock lost — show pause if the game is still running
    // (Don't show pause during win screen or before game starts)
    if (gameRunning && !jumpScare.isActive) {
      pauseMenu.show();
    }
  }
});

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Delta time clock
const clock = new THREE.Clock();

/**
 * Trigger win state: player escaped!
 */
function triggerWin() {
  gameRunning = false;

  // Exit pointer lock
  document.exitPointerLock();

  // Stop sounds
  if (soundManager) {
    soundManager.stop('ambient');
    soundManager.stop('cat-growl');
    soundManager.stop('cat-yowl');
    soundManager.stop('cat-hiss');
  }

  // Hide pause, help, and touch overlays
  pauseMenu.hide();
  helpOverlay.hide();
  if (touchControls) touchControls.hide();

  // Show win screen with final time
  winScreen.show(hud.getTimeString());
}

/**
 * Trigger game over: Spencer got all 3 lives.
 */
function triggerGameOver() {
  gameRunning = false;

  // Exit pointer lock
  document.exitPointerLock();

  // Stop sounds
  if (soundManager) {
    soundManager.stop('ambient');
    soundManager.stop('cat-growl');
    soundManager.stop('cat-yowl');
    soundManager.stop('cat-hiss');
  }

  // Hide pause, help, and touch overlays
  pauseMenu.hide();
  helpOverlay.hide();
  if (touchControls) touchControls.hide();

  // Show game over screen
  gameOverScreen.show();
}

/**
 * Full game reset for PLAY AGAIN / TRY AGAIN.
 * Resets player, cat, HUD, sounds, game state, and shows the launcher.
 */
function resetGame() {
  // Reset game state
  gameRunning = false;
  currentRoomIndex = -1;
  catActivatedInRoom = false;
  lives = MAX_LIVES;

  // Reset player to kitchen spawn
  player.position.set(0, 1.6, 2);
  player.stamina = 1;

  // Reset cat
  cat.reset();

  // Reset HUD
  hud.reset();

  // Stop all sounds
  if (soundManager) {
    soundManager.stop('ambient');
    soundManager.stop('cat-growl');
    soundManager.stop('cat-yowl');
    soundManager.stop('cat-hiss');
  }

  // Hide overlays and touch controls
  helpOverlay.hide();
  gameOverScreen.hide();
  if (touchControls) touchControls.hide();

  // Show the launcher again
  const launcher = document.getElementById('launcher');
  launcher.style.display = '';
  launcher.classList.remove('fade-out');
  launcher.style.opacity = '';
}

/**
 * Start the game (called from launcher onStart callback).
 */
function startGame() {
  gameRunning = true;
  currentRoomIndex = -1;
  catActivatedInRoom = false;
  lives = MAX_LIVES;
  hud.updateLives(lives);

  // Initialize sound system AFTER user click (Web Audio requires gesture)
  if (!soundManager) {
    soundManager = new SoundManager(camera);
    soundManager.generateProceduralSounds();

    // Add the growl anchor to the scene so positional audio works
    scene.add(soundManager._growlAnchor);
  }

  // Ensure the AudioContext is resumed (some browsers suspend until gesture)
  if (soundManager.audioContext.state === 'suspended') {
    soundManager.audioContext.resume();
  }

  // Start ambient background loop
  soundManager.play('ambient');

  // Wire footstep sounds to the player step callback
  player.onStep = () => {
    const room = rooms[currentRoomIndex];
    const floorType = room ? room.floorType : 'tile';
    soundManager.playFootstep(floorType);
  };

  // Reset the delta clock so the first frame doesn't get a huge delta
  clock.getDelta();

  // Show startup hint (different text for touch vs desktop)
  showStartupHint();

  if (isTouchDevice) {
    // Mobile/tablet: skip pointer lock (unsupported on iOS), use touch controls
    player.setMobileMode(true);

    if (!touchControls) {
      touchControls = new TouchControls({
        player,
        camera,
        helpOverlay,
        pauseMenu,
        gameRunningFn: () => gameRunning,
      });
    } else {
      touchControls.show();
    }
  } else {
    // Desktop: use pointer lock for mouse look
    player.lock();
  }

  // Only start the animate loop once
  if (!animateStarted) {
    animateStarted = true;
    animate();
  }
}

function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();

  // Always render and update lighting (even when paused for visual continuity)
  lightingManager.update(delta);
  renderer.render(scene, camera);

  // Skip game logic when not running (paused, win screen, etc.)
  if (!gameRunning) return;

  player.update(delta, collidables);

  // --- HUD updates ---
  hud.updateStamina(player.stamina, player.isSprinting);
  hud.updateTimer(delta);

  // --- Room detection ---
  const roomIndex = getRoomIndexForPosition(player.position);

  // Player entered a new room — set up the cat and play door creak
  if (roomIndex !== -1 && roomIndex !== currentRoomIndex) {
    // Play door creak on room transitions (not on the very first room detection)
    if (currentRoomIndex !== -1 && soundManager) {
      soundManager.play('door-creak');
    }
    currentRoomIndex = roomIndex;
    catActivatedInRoom = false;
    const room = rooms[roomIndex];
    cat.setupForRoom(roomIndex, room.catHidingSpots, ROOM_AGGRESSION[roomIndex]);

    // Show room name on HUD
    hud.showRoomName(room.name);
  }

  // --- Win condition: player reaches bedroom exit zone ---
  if (roomIndex === 3) {
    const bedroom = rooms[3];
    if (bedroom.exitZone && isInsideTriggerZone(player.position, bedroom.exitZone)) {
      triggerWin();
      return; // Stop processing this frame
    }
  }

  // --- Cat trigger zone check ---
  if (roomIndex !== -1 && !catActivatedInRoom) {
    const room = rooms[roomIndex];
    if (isInsideTriggerZone(player.position, room.triggerZone)) {
      cat.activate();
      catActivatedInRoom = true;
    }
  }

  // --- Update cat AI ---
  cat.update(delta, player.position, player.isSprinting);

  // --- Update positional cat growl ---
  if (soundManager) {
    soundManager.updateCatGrowl(
      cat.state === 'stalking',
      cat.model ? cat.model.position : null
    );
  }

  // --- Update jump scare (camera shake) ---
  jumpScare.update(delta);
}

/**
 * Show a brief controls hint at the bottom of the screen, then fade out.
 */
function showStartupHint() {
  // Remove any existing hint
  const existing = document.querySelector('.startup-hint');
  if (existing) existing.remove();

  const hint = document.createElement('div');
  hint.className = 'startup-hint';
  hint.textContent = isTouchDevice
    ? 'Joystick to move · Hold SPRINT to run · Swipe to look'
    : 'WASD to move · SHIFT to sprint · H for help';
  document.body.appendChild(hint);

  // Fade out after 4 seconds
  setTimeout(() => {
    hint.classList.add('hidden');
    // Remove from DOM after fade completes
    setTimeout(() => hint.remove(), 1000);
  }, 4000);
}

/**
 * Async initialization — loads assets before starting the game.
 */
async function init() {
  await cat.load();

  // Set the jump scare callback — subtract a life, trigger hit or game over
  cat.onJumpScare = () => {
    if (soundManager) {
      soundManager.play('cat-yowl');
      soundManager.play('cat-hiss');
    }

    lives--;
    hud.updateLives(lives);

    if (lives <= 0) {
      // Final life lost — full death sequence, then game over
      jumpScare.trigger();
    } else {
      // Still have lives — short hit scare, then respawn in room
      jumpScare.triggerHit();
    }
  };

  // Set the respawn callback
  jumpScare.onRespawn = () => {
    // If no lives left, show game over instead of respawning
    if (lives <= 0) {
      triggerGameOver();
      return;
    }

    const room = rooms[currentRoomIndex];
    player.position.set(room.spawnPoint.x, room.spawnPoint.y, room.spawnPoint.z);
    cat.setupForRoom(currentRoomIndex, room.catHidingSpots, ROOM_AGGRESSION[currentRoomIndex]);
    player.stamina = 1;
    // Stop any lingering cat sounds on respawn
    if (soundManager) {
      soundManager.stop('cat-growl');
      soundManager.stop('cat-yowl');
      soundManager.stop('cat-hiss');
    }
  };

  createLauncher(startGame);
}

init();

export { camera, scene, renderer, player, collidables, rooms, lightingManager, cat, jumpScare, soundManager };
