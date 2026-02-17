import * as THREE from 'three';
import { createLauncher } from './launcher.js';
import { Player } from './player.js';
import { createHouse } from './house.js';
import { LightingManager } from './lighting.js';
import { Cat } from './cat.js';
import { JumpScare } from './jumpScare.js';

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

// Track which room the player is currently in (-1 = none/unknown)
let currentRoomIndex = -1;
// Track whether the cat has been activated in the current room
let catActivatedInRoom = false;

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

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Delta time clock
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();
  player.update(delta, collidables);
  lightingManager.update(delta);

  // --- Room detection ---
  const roomIndex = getRoomIndexForPosition(player.position);

  // Player entered a new room — set up the cat
  if (roomIndex !== -1 && roomIndex !== currentRoomIndex) {
    currentRoomIndex = roomIndex;
    catActivatedInRoom = false;
    const room = rooms[roomIndex];
    cat.setupForRoom(roomIndex, room.catHidingSpots, ROOM_AGGRESSION[roomIndex]);
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

  // --- Update jump scare (camera shake) ---
  jumpScare.update(delta);

  renderer.render(scene, camera);
}

/**
 * Async initialization — loads assets before starting the game.
 */
async function init() {
  await cat.load();

  // Set the jump scare callback
  cat.onJumpScare = () => {
    jumpScare.trigger();
  };

  // Set the respawn callback
  jumpScare.onRespawn = () => {
    const room = rooms[currentRoomIndex];
    player.position.set(room.spawnPoint.x, room.spawnPoint.y, room.spawnPoint.z);
    cat.setupForRoom(currentRoomIndex, room.catHidingSpots, ROOM_AGGRESSION[currentRoomIndex]);
    player.stamina = 1;
  };

  createLauncher(() => {
    player.lock();
    animate();
  });
}

init();

export { camera, scene, renderer, player, collidables, rooms, lightingManager, cat, jumpScare };
