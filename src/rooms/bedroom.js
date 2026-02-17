import * as THREE from 'three';
import { createRoom } from '../house.js';

const WIDTH = 8;
const DEPTH = 6;
const HEIGHT = 3;
const POSITION = new THREE.Vector3(0, 0, -20);

export function createBedroom() {
  const halfW = WIDTH / 2;   // 4
  const halfD = DEPTH / 2;   // 3
  const cz = POSITION.z;     // -20

  const { group, collidables, addWall } = createRoom(
    WIDTH, DEPTH, HEIGHT, POSITION,
    0x4A4A4A, // dark carpet floor
    0x696969  // dim grey walls
  );

  // --- Walls ---
  // North wall (+z side) — door from living room
  addWall(WIDTH, HEIGHT, new THREE.Vector3(0, 0, cz + halfD), 0, true);

  // South wall (-z side) — EXIT door (has doorway)
  addWall(WIDTH, HEIGHT, new THREE.Vector3(0, 0, cz - halfD), 0, true);

  // West wall (-x side) - solid
  addWall(DEPTH, HEIGHT, new THREE.Vector3(-halfW, 0, cz), Math.PI / 2, false);

  // East wall (+x side) - solid
  addWall(DEPTH, HEIGHT, new THREE.Vector3(halfW, 0, cz), Math.PI / 2, false);

  // --- EXIT door frame (bright green to make it obvious) ---
  const exitFrameMat = new THREE.MeshStandardMaterial({
    color: 0x00FF44,
    emissive: 0x00AA22,
    emissiveIntensity: 0.4
  });

  // Left frame post
  const framePost = new THREE.Mesh(
    new THREE.BoxGeometry(0.1, 2.2, 0.2),
    exitFrameMat
  );
  framePost.position.set(-0.65, 1.1, cz - halfD);
  framePost.castShadow = true;
  group.add(framePost);

  // Right frame post
  const framePost2 = new THREE.Mesh(
    new THREE.BoxGeometry(0.1, 2.2, 0.2),
    exitFrameMat
  );
  framePost2.position.set(0.65, 1.1, cz - halfD);
  framePost2.castShadow = true;
  group.add(framePost2);

  // Top frame
  const frameTop = new THREE.Mesh(
    new THREE.BoxGeometry(1.4, 0.1, 0.2),
    exitFrameMat
  );
  frameTop.position.set(0, 2.25, cz - halfD);
  frameTop.castShadow = true;
  group.add(frameTop);

  // "EXIT" sign above door (small glowing box)
  const exitSignMat = new THREE.MeshStandardMaterial({
    color: 0xFF0000,
    emissive: 0xFF0000,
    emissiveIntensity: 0.8
  });
  const exitSign = new THREE.Mesh(
    new THREE.BoxGeometry(0.6, 0.15, 0.05),
    exitSignMat
  );
  exitSign.position.set(0, 2.55, cz - halfD + 0.1);
  group.add(exitSign);

  // Add a small green point light near the exit to make it glow
  const exitLight = new THREE.PointLight(0x00FF44, 0.5, 5);
  exitLight.position.set(0, 2, cz - halfD + 0.5);
  group.add(exitLight);

  // --- Furniture ---

  // Bed against the west wall
  const bedMat = new THREE.MeshStandardMaterial({ color: 0x4169E1 });
  const bedFrame = new THREE.Mesh(
    new THREE.BoxGeometry(2, 0.5, 1.8),
    new THREE.MeshStandardMaterial({ color: 0x5C3317 })
  );
  bedFrame.position.set(-halfW + 1.3, 0.25, cz - 0.5);
  bedFrame.castShadow = true;
  bedFrame.receiveShadow = true;
  group.add(bedFrame);
  collidables.push(bedFrame);

  // Bed mattress
  const mattress = new THREE.Mesh(
    new THREE.BoxGeometry(1.9, 0.2, 1.7),
    bedMat
  );
  mattress.position.set(-halfW + 1.3, 0.6, cz - 0.5);
  mattress.castShadow = true;
  group.add(mattress);

  // Headboard against wall
  const headboardMat = new THREE.MeshStandardMaterial({ color: 0x3C1414 });
  const headboard = new THREE.Mesh(
    new THREE.BoxGeometry(2, 0.8, 0.1),
    headboardMat
  );
  headboard.position.set(-halfW + 1.3, 0.9, cz - 0.5 - 0.9);
  headboard.castShadow = true;
  group.add(headboard);
  collidables.push(headboard);

  // Pillow
  const pillowMat = new THREE.MeshStandardMaterial({ color: 0xFFF8DC });
  const pillow = new THREE.Mesh(
    new THREE.BoxGeometry(0.6, 0.1, 0.4),
    pillowMat
  );
  pillow.position.set(-halfW + 1.3, 0.75, cz - 0.5 - 0.55);
  pillow.castShadow = true;
  group.add(pillow);

  // Dresser against the east wall
  const dresserMat = new THREE.MeshStandardMaterial({ color: 0x8B7355 });
  const dresser = new THREE.Mesh(
    new THREE.BoxGeometry(1.2, 1, 0.5),
    dresserMat
  );
  dresser.position.set(halfW - 0.7, 0.5, cz + 1);
  dresser.castShadow = true;
  dresser.receiveShadow = true;
  group.add(dresser);
  collidables.push(dresser);

  // Dresser drawers (visual lines)
  const drawerMat = new THREE.MeshStandardMaterial({ color: 0x6B4226 });
  for (let i = 0; i < 3; i++) {
    const drawer = new THREE.Mesh(
      new THREE.BoxGeometry(1.1, 0.02, 0.48),
      drawerMat
    );
    drawer.position.set(halfW - 0.7, 0.2 + i * 0.3, cz + 1 + 0.02);
    group.add(drawer);
  }

  // Drawer handles
  const handleMat = new THREE.MeshStandardMaterial({ color: 0xC0C0C0 });
  for (let i = 0; i < 3; i++) {
    const handle = new THREE.Mesh(
      new THREE.BoxGeometry(0.15, 0.04, 0.04),
      handleMat
    );
    handle.position.set(halfW - 0.7, 0.25 + i * 0.3, cz + 1 + 0.28);
    handle.castShadow = true;
    group.add(handle);
  }

  // Closet against the east wall, further back
  const closetMat = new THREE.MeshStandardMaterial({ color: 0x555555 });
  const closet = new THREE.Mesh(
    new THREE.BoxGeometry(1.5, 2.5, 0.6),
    closetMat
  );
  closet.position.set(halfW - 0.8, 1.25, cz - 1.5);
  closet.castShadow = true;
  closet.receiveShadow = true;
  group.add(closet);
  collidables.push(closet);

  // Closet door lines (visual detail)
  const closetDoorMat = new THREE.MeshStandardMaterial({ color: 0x4A4A4A });
  const closetDoorL = new THREE.Mesh(
    new THREE.BoxGeometry(0.72, 2.45, 0.02),
    closetDoorMat
  );
  closetDoorL.position.set(halfW - 0.8 - 0.37, 1.25, cz - 1.5 + 0.32);
  group.add(closetDoorL);

  const closetDoorR = new THREE.Mesh(
    new THREE.BoxGeometry(0.72, 2.45, 0.02),
    closetDoorMat
  );
  closetDoorR.position.set(halfW - 0.8 + 0.37, 1.25, cz - 1.5 + 0.32);
  group.add(closetDoorR);

  // --- Room data ---
  const catHidingSpots = [
    new THREE.Vector3(-halfW + 2.5, 0, cz - 0.5),  // Next to bed
    new THREE.Vector3(halfW - 0.5, 0, cz - 1.8)     // Behind closet
  ];

  const triggerZone = {
    min: new THREE.Vector3(-2, 0, cz - 1.5),
    max: new THREE.Vector3(2, HEIGHT, cz + 1.5)
  };

  const spawnPoint = new THREE.Vector3(0, 1.6, -19);

  // Exit zone: area near the south wall (-z) exit door
  const exitZone = {
    min: new THREE.Vector3(-0.8, 0, cz - halfD - 0.5),
    max: new THREE.Vector3(0.8, HEIGHT, cz - halfD + 0.5)
  };

  return {
    group,
    collidables,
    catHidingSpots,
    triggerZone,
    spawnPoint,
    exitZone,
    floorType: 'carpet',
    name: 'Bedroom'
  };
}
