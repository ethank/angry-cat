import * as THREE from 'three';
import { createRoom } from '../house.js';

const WIDTH = 8;
const DEPTH = 6;
const HEIGHT = 3;
const POSITION = new THREE.Vector3(0, 0, -14);

export function createLivingRoom() {
  const halfW = WIDTH / 2;   // 4
  const halfD = DEPTH / 2;   // 3
  const cz = POSITION.z;     // -14

  const { group, collidables, addWall } = createRoom(
    WIDTH, DEPTH, HEIGHT, POSITION,
    0x556B2F, // green carpet floor
    0xBDB76B  // dark khaki walls
  );

  // --- Walls ---
  // North wall (+z side) — door from hallway
  addWall(WIDTH, HEIGHT, new THREE.Vector3(0, 0, cz + halfD), 0, true);

  // South wall (-z side) — door to bedroom
  addWall(WIDTH, HEIGHT, new THREE.Vector3(0, 0, cz - halfD), 0, true);

  // West wall (-x side) - solid
  addWall(DEPTH, HEIGHT, new THREE.Vector3(-halfW, 0, cz), Math.PI / 2, false);

  // East wall (+x side) - solid
  addWall(DEPTH, HEIGHT, new THREE.Vector3(halfW, 0, cz), Math.PI / 2, false);

  // --- Furniture ---

  // Couch against the west wall
  const couchMat = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
  const couch = new THREE.Mesh(
    new THREE.BoxGeometry(2.5, 0.6, 0.8),
    couchMat
  );
  couch.position.set(-halfW + 1.5, 0.3, cz - 0.5);
  couch.castShadow = true;
  couch.receiveShadow = true;
  group.add(couch);
  collidables.push(couch);

  // Couch back cushion
  const couchBackMat = new THREE.MeshStandardMaterial({ color: 0x7B3F0F });
  const couchBack = new THREE.Mesh(
    new THREE.BoxGeometry(2.5, 0.4, 0.15),
    couchBackMat
  );
  couchBack.position.set(-halfW + 1.5, 0.8, cz - 0.5 - 0.325);
  couchBack.castShadow = true;
  group.add(couchBack);
  collidables.push(couchBack);

  // Coffee table in front of couch
  const coffeeTableMat = new THREE.MeshStandardMaterial({ color: 0xA0522D });
  const coffeeTable = new THREE.Mesh(
    new THREE.BoxGeometry(1.2, 0.4, 0.6),
    coffeeTableMat
  );
  coffeeTable.position.set(-halfW + 1.5, 0.2, cz + 0.4);
  coffeeTable.castShadow = true;
  coffeeTable.receiveShadow = true;
  group.add(coffeeTable);
  collidables.push(coffeeTable);

  // Coffee table legs
  const ctLegMat = new THREE.MeshStandardMaterial({ color: 0x5C3317 });
  const ctLegGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.4, 6);
  const ctBase = { x: -halfW + 1.5, z: cz + 0.4 };
  [[-0.5, -0.2], [0.5, -0.2], [-0.5, 0.2], [0.5, 0.2]].forEach(([ox, oz]) => {
    const leg = new THREE.Mesh(ctLegGeo, ctLegMat);
    leg.position.set(ctBase.x + ox, 0.2, ctBase.z + oz);
    leg.castShadow = true;
    group.add(leg);
  });

  // Bookshelf against the east wall
  const shelfMat = new THREE.MeshStandardMaterial({ color: 0x654321 });
  const bookshelf = new THREE.Mesh(
    new THREE.BoxGeometry(1.5, 2.5, 0.4),
    shelfMat
  );
  bookshelf.position.set(halfW - 0.3, 1.25, cz + 0.5);
  bookshelf.castShadow = true;
  bookshelf.receiveShadow = true;
  group.add(bookshelf);
  collidables.push(bookshelf);

  // Bookshelf shelves (visual detail)
  const shelfBoardMat = new THREE.MeshStandardMaterial({ color: 0x7B5B3A });
  for (let i = 1; i <= 4; i++) {
    const shelf = new THREE.Mesh(
      new THREE.BoxGeometry(1.45, 0.03, 0.38),
      shelfBoardMat
    );
    shelf.position.set(halfW - 0.3, i * 0.5, cz + 0.5);
    group.add(shelf);
  }

  // Some "books" on the shelf (colored blocks)
  const bookColors = [0xCC3333, 0x3366CC, 0x33CC33, 0xCCCC33];
  bookColors.forEach((color, i) => {
    const bookMat = new THREE.MeshStandardMaterial({ color });
    const book = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.25, 0.2),
      bookMat
    );
    book.position.set(halfW - 0.3 - 0.5 + i * 0.3, 2.15, cz + 0.5);
    book.castShadow = true;
    group.add(book);
  });

  // --- Room data ---
  const catHidingSpots = [
    new THREE.Vector3(-halfW + 1.5, 0, cz - 1.2), // Behind couch
    new THREE.Vector3(halfW - 0.4, 0, cz + 0.5)    // Behind bookshelf
  ];

  const triggerZone = {
    min: new THREE.Vector3(-2, 0, cz - 1.5),
    max: new THREE.Vector3(2, HEIGHT, cz + 1.5)
  };

  const spawnPoint = new THREE.Vector3(0, 1.6, -13);

  return {
    group,
    collidables,
    catHidingSpots,
    triggerZone,
    spawnPoint,
    floorType: 'carpet',
    name: 'Living Room'
  };
}
