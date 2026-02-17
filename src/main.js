import * as THREE from 'three';
import { createLauncher } from './launcher.js';
import { Player } from './player.js';
import { createHouse } from './house.js';

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

// Ambient light (low intensity, rooms have their own point lights)
scene.add(new THREE.AmbientLight(0x404040, 0.6));

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
  renderer.render(scene, camera);
}

createLauncher(() => {
  player.lock();
  animate();
});

export { camera, scene, renderer, player, collidables, rooms };
