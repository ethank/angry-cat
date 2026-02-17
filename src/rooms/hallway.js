import * as THREE from 'three';
import { createRoom } from '../house.js';

const WIDTH = 3;
const DEPTH = 8;
const HEIGHT = 3;
const POSITION = new THREE.Vector3(0, 0, -7);

export function createHallway() {
  const halfW = WIDTH / 2;   // 1.5
  const halfD = DEPTH / 2;   // 4
  const cz = POSITION.z;     // -7

  const { group, collidables, addWall } = createRoom(
    WIDTH, DEPTH, HEIGHT, POSITION,
    0x654321, // wood floor
    0xC4A882  // walls
  );

  // --- Walls ---
  // North wall (+z side) — door back to kitchen
  addWall(WIDTH, HEIGHT, new THREE.Vector3(0, 0, cz + halfD), 0, true);

  // South wall (-z side) — door to living room
  addWall(WIDTH, HEIGHT, new THREE.Vector3(0, 0, cz - halfD), 0, true);

  // West wall (-x side) - solid
  addWall(DEPTH, HEIGHT, new THREE.Vector3(-halfW, 0, cz), Math.PI / 2, false);

  // East wall (+x side) - solid
  addWall(DEPTH, HEIGHT, new THREE.Vector3(halfW, 0, cz), Math.PI / 2, false);

  // --- Furniture ---

  // Small side table against the east wall
  const tableMat = new THREE.MeshStandardMaterial({ color: 0x7B5B3A });
  const sideTable = new THREE.Mesh(
    new THREE.BoxGeometry(0.5, 0.6, 0.5),
    tableMat
  );
  sideTable.position.set(halfW - 0.35, 0.3, cz + 1);
  sideTable.castShadow = true;
  sideTable.receiveShadow = true;
  group.add(sideTable);
  collidables.push(sideTable);

  // Small decorative item on top of side table
  const decorMat = new THREE.MeshStandardMaterial({ color: 0xB8860B });
  const decor = new THREE.Mesh(
    new THREE.BoxGeometry(0.15, 0.2, 0.15),
    decorMat
  );
  decor.position.set(halfW - 0.35, 0.7, cz + 1);
  decor.castShadow = true;
  group.add(decor);

  // --- Room data ---
  const catHidingSpots = [
    new THREE.Vector3(0, 0, cz - halfD + 0.8) // Far end near south wall, in shadow
  ];

  const triggerZone = {
    min: new THREE.Vector3(-halfW, 0, cz - 2),
    max: new THREE.Vector3(halfW, HEIGHT, cz + 2)
  };

  const spawnPoint = new THREE.Vector3(0, 1.6, -4);

  return {
    group,
    collidables,
    catHidingSpots,
    triggerZone,
    spawnPoint,
    floorType: 'wood',
    name: 'Hallway'
  };
}
