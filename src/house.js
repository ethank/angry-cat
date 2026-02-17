import * as THREE from 'three';
import { createKitchen } from './rooms/kitchen.js';
import { createHallway } from './rooms/hallway.js';
import { createLivingRoom } from './rooms/livingRoom.js';
import { createBedroom } from './rooms/bedroom.js';

const ROOM_HEIGHT = 3;
const DOOR_WIDTH = 1.2;
const DOOR_HEIGHT = 2.2;
const WALL_THICKNESS = 0.15;

/**
 * Creates a wall mesh (solid or with a doorway gap).
 * Returns an array of meshes that make up the wall.
 */
function buildWall(width, height, position, rotationY, hasDoor, wallMaterial) {
  const meshes = [];

  if (!hasDoor) {
    // Solid wall
    const geo = new THREE.BoxGeometry(width, height, WALL_THICKNESS);
    const wall = new THREE.Mesh(geo, wallMaterial);
    wall.position.copy(position);
    wall.position.y = height / 2;
    if (rotationY) wall.rotation.y = rotationY;
    wall.castShadow = true;
    wall.receiveShadow = true;
    meshes.push(wall);
  } else {
    // Wall with doorway: left segment, right segment, top piece above door
    const halfDoor = DOOR_WIDTH / 2;
    const leftWidth = (width / 2) - halfDoor;
    const rightWidth = (width / 2) - halfDoor;
    const topHeight = height - DOOR_HEIGHT;

    // Direction vector perpendicular to the wall for offset calculation
    const dir = new THREE.Vector3(1, 0, 0);
    if (rotationY) {
      dir.applyAxisAngle(new THREE.Vector3(0, 1, 0), rotationY);
    }

    // Left segment
    if (leftWidth > 0.01) {
      const leftGeo = new THREE.BoxGeometry(leftWidth, height, WALL_THICKNESS);
      const leftWall = new THREE.Mesh(leftGeo, wallMaterial);
      // Position: shift left by half the remaining wall + half the door
      const offsetX = -(halfDoor + leftWidth / 2);
      leftWall.position.copy(position);
      leftWall.position.y = height / 2;
      if (rotationY) {
        leftWall.rotation.y = rotationY;
        // Offset along the wall's local X axis
        leftWall.position.x += Math.cos(rotationY) * offsetX;
        leftWall.position.z += -Math.sin(rotationY) * offsetX;
      } else {
        leftWall.position.x += offsetX;
      }
      leftWall.castShadow = true;
      leftWall.receiveShadow = true;
      meshes.push(leftWall);
    }

    // Right segment
    if (rightWidth > 0.01) {
      const rightGeo = new THREE.BoxGeometry(rightWidth, height, WALL_THICKNESS);
      const rightWall = new THREE.Mesh(rightGeo, wallMaterial);
      const offsetX = halfDoor + rightWidth / 2;
      rightWall.position.copy(position);
      rightWall.position.y = height / 2;
      if (rotationY) {
        rightWall.rotation.y = rotationY;
        rightWall.position.x += Math.cos(rotationY) * offsetX;
        rightWall.position.z += -Math.sin(rotationY) * offsetX;
      } else {
        rightWall.position.x += offsetX;
      }
      rightWall.castShadow = true;
      rightWall.receiveShadow = true;
      meshes.push(rightWall);
    }

    // Top piece above door
    if (topHeight > 0.01) {
      const topGeo = new THREE.BoxGeometry(DOOR_WIDTH, topHeight, WALL_THICKNESS);
      const topWall = new THREE.Mesh(topGeo, wallMaterial);
      topWall.position.copy(position);
      topWall.position.y = DOOR_HEIGHT + topHeight / 2;
      if (rotationY) topWall.rotation.y = rotationY;
      topWall.castShadow = true;
      topWall.receiveShadow = true;
      meshes.push(topWall);
    }
  }

  return meshes;
}

/**
 * Creates a room with floor, ceiling, and provides an addWall helper.
 *
 * @param {number} width - Room width (x-axis)
 * @param {number} depth - Room depth (z-axis)
 * @param {number} height - Room height (y-axis)
 * @param {THREE.Vector3} position - Center of the room floor
 * @param {number} floorColor - Hex color for floor
 * @param {number} wallColor - Hex color for walls
 * @returns {{ group: THREE.Group, collidables: THREE.Mesh[], addWall: Function }}
 */
export function createRoom(width, depth, height, position, floorColor, wallColor) {
  const group = new THREE.Group();
  const collidables = [];

  const wallMaterial = new THREE.MeshStandardMaterial({ color: wallColor, side: THREE.DoubleSide });
  const floorMaterial = new THREE.MeshStandardMaterial({ color: floorColor });
  const ceilingMaterial = new THREE.MeshStandardMaterial({ color: 0xEEEEDD });

  // Floor
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(width, depth), floorMaterial);
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(position.x, 0.001, position.z);
  floor.receiveShadow = true;
  group.add(floor);

  // Ceiling
  const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(width, depth), ceilingMaterial);
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.set(position.x, height, position.z);
  ceiling.receiveShadow = true;
  group.add(ceiling);

  /**
   * Add a wall to the room.
   * @param {number} wallWidth
   * @param {number} wallHeight
   * @param {THREE.Vector3} wallPos - Center-bottom of the wall
   * @param {number} rotationY
   * @param {boolean} hasDoor
   */
  function addWall(wallWidth, wallHeight, wallPos, rotationY, hasDoor) {
    const meshes = buildWall(wallWidth, wallHeight, wallPos, rotationY, hasDoor, wallMaterial);
    meshes.forEach(m => {
      group.add(m);
      collidables.push(m);
    });
    return meshes;
  }

  return { group, collidables, addWall };
}

/**
 * Creates the entire house by calling each room creator and assembling them.
 * @param {THREE.Scene} scene
 * @returns {{ rooms: object[], collidables: THREE.Mesh[] }}
 */
export function createHouse(scene) {
  const allCollidables = [];
  const rooms = [];

  // Create each room
  const kitchen = createKitchen();
  const hallway = createHallway();
  const livingRoom = createLivingRoom();
  const bedroom = createBedroom();

  const roomList = [kitchen, hallway, livingRoom, bedroom];

  roomList.forEach(room => {
    scene.add(room.group);
    allCollidables.push(...room.collidables);
    rooms.push(room);
  });

  return { rooms, collidables: allCollidables };
}
