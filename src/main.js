import * as THREE from 'three';
import { createLauncher } from './launcher.js';
import { Player } from './player.js';
import { createHouse } from './house.js';
import { LightingManager } from './lighting.js';

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
  renderer.render(scene, camera);
}

createLauncher(() => {
  player.lock();
  animate();
});

export { camera, scene, renderer, player, collidables, rooms, lightingManager };
