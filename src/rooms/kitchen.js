import * as THREE from 'three';
import { createRoom } from '../house.js';

const WIDTH = 8;
const DEPTH = 6;
const HEIGHT = 3;
const POSITION = new THREE.Vector3(0, 0, 0);

export function createKitchen() {
  const halfW = WIDTH / 2;   // 4
  const halfD = DEPTH / 2;   // 3

  const { group, collidables, addWall } = createRoom(
    WIDTH, DEPTH, HEIGHT, POSITION,
    0x8B7355, // tile floor
    0xD2B48C  // tan walls
  );

  // --- Walls ---
  // North wall (+z side, back wall) - solid
  addWall(WIDTH, HEIGHT, new THREE.Vector3(0, 0, halfD), 0, false);

  // South wall (-z side) - door leading to hallway
  addWall(WIDTH, HEIGHT, new THREE.Vector3(0, 0, -halfD), 0, true);

  // West wall (-x side) - solid
  addWall(DEPTH, HEIGHT, new THREE.Vector3(-halfW, 0, 0), Math.PI / 2, false);

  // East wall (+x side) - solid
  addWall(DEPTH, HEIGHT, new THREE.Vector3(halfW, 0, 0), Math.PI / 2, false);

  // --- Furniture ---

  // Counter along the back wall (+z side)
  const counterMat = new THREE.MeshStandardMaterial({ color: 0x8B6914 });
  const counter = new THREE.Mesh(
    new THREE.BoxGeometry(6, 1, 0.6),
    counterMat
  );
  counter.position.set(0, 0.5, halfD - 0.35);
  counter.castShadow = true;
  counter.receiveShadow = true;
  group.add(counter);
  collidables.push(counter);

  // Counter top surface (slightly different shade)
  const counterTopMat = new THREE.MeshStandardMaterial({ color: 0xA0A0A0 });
  const counterTop = new THREE.Mesh(
    new THREE.BoxGeometry(6, 0.05, 0.65),
    counterTopMat
  );
  counterTop.position.set(0, 1.025, halfD - 0.35);
  counterTop.castShadow = true;
  group.add(counterTop);

  // Table
  const tableMat = new THREE.MeshStandardMaterial({ color: 0x8B5A2B });
  const tableTop = new THREE.Mesh(
    new THREE.BoxGeometry(2, 0.05, 1.2),
    tableMat
  );
  tableTop.position.set(0, 0.8, 0);
  tableTop.castShadow = true;
  tableTop.receiveShadow = true;
  group.add(tableTop);
  collidables.push(tableTop);

  // Table legs
  const legMat = new THREE.MeshStandardMaterial({ color: 0x5C3317 });
  const legGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.8, 8);
  const legPositions = [
    [-0.9, 0.4, -0.5],
    [0.9, 0.4, -0.5],
    [-0.9, 0.4, 0.5],
    [0.9, 0.4, 0.5]
  ];
  legPositions.forEach(([lx, ly, lz]) => {
    const leg = new THREE.Mesh(legGeo, legMat);
    leg.position.set(lx, ly, lz);
    leg.castShadow = true;
    group.add(leg);
  });

  // Chair 1 (left side of table)
  const chairMat = new THREE.MeshStandardMaterial({ color: 0x6B3A2A });
  const chair1Seat = new THREE.Mesh(
    new THREE.BoxGeometry(0.5, 0.05, 0.5),
    chairMat
  );
  chair1Seat.position.set(-1.4, 0.45, 0);
  chair1Seat.castShadow = true;
  group.add(chair1Seat);
  collidables.push(chair1Seat);

  // Chair 1 back
  const chair1Back = new THREE.Mesh(
    new THREE.BoxGeometry(0.5, 0.5, 0.05),
    chairMat
  );
  chair1Back.position.set(-1.4, 0.7, -0.25);
  chair1Back.castShadow = true;
  group.add(chair1Back);

  // Chair 1 legs
  const chairLegGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.45, 6);
  [[-1.6, 0.225, -0.2], [-1.2, 0.225, -0.2], [-1.6, 0.225, 0.2], [-1.2, 0.225, 0.2]].forEach(([cx, cy, cz]) => {
    const cleg = new THREE.Mesh(chairLegGeo, legMat);
    cleg.position.set(cx, cy, cz);
    cleg.castShadow = true;
    group.add(cleg);
  });

  // Chair 2 (right side of table)
  const chair2Seat = new THREE.Mesh(
    new THREE.BoxGeometry(0.5, 0.05, 0.5),
    chairMat
  );
  chair2Seat.position.set(1.4, 0.45, 0);
  chair2Seat.castShadow = true;
  group.add(chair2Seat);
  collidables.push(chair2Seat);

  // Chair 2 back
  const chair2Back = new THREE.Mesh(
    new THREE.BoxGeometry(0.5, 0.5, 0.05),
    chairMat
  );
  chair2Back.position.set(1.4, 0.7, 0.25);
  chair2Back.castShadow = true;
  group.add(chair2Back);

  // Chair 2 legs
  [[1.2, 0.225, -0.2], [1.6, 0.225, -0.2], [1.2, 0.225, 0.2], [1.6, 0.225, 0.2]].forEach(([cx, cy, cz]) => {
    const cleg = new THREE.Mesh(chairLegGeo, legMat);
    cleg.position.set(cx, cy, cz);
    cleg.castShadow = true;
    group.add(cleg);
  });

  // --- Room data ---
  const catHidingSpots = [
    new THREE.Vector3(2.5, 0, halfD - 0.5),  // Behind counter (offset to side)
    new THREE.Vector3(0, 0, 0)                // Under table
  ];

  const triggerZone = {
    min: new THREE.Vector3(-2, 0, -1.5),
    max: new THREE.Vector3(2, HEIGHT, 1.5)
  };

  const spawnPoint = new THREE.Vector3(0, 1.6, 2);

  return {
    group,
    collidables,
    catHidingSpots,
    triggerZone,
    spawnPoint,
    floorType: 'tile',
    name: 'Kitchen'
  };
}
