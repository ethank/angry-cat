import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const CAT_STATE = {
  LURKING: 'lurking',
  STALKING: 'stalking',
  POUNCING: 'pouncing',
};

export { CAT_STATE };

export class Cat {
  constructor(scene) {
    this.scene = scene;
    this.model = null;
    this.mixer = null; // for future GLTF animations
    this.state = CAT_STATE.LURKING;
    this.speed = 2;
    this.aggressionMultiplier = 1;
    this.stalkTimer = 0;
    this.stalkDuration = 5; // seconds before forced pounce
    this.onJumpScare = null; // callback
    this.visible = false;

    // Internal flags
    this._pounceFired = false;

    // Reusable vectors to avoid GC pressure
    this._direction = new THREE.Vector3();
    this._lookTarget = new THREE.Vector3();
  }

  /**
   * Build a cat from THREE primitives as a fallback when no GLTF model exists.
   * The glowing green eyes are the signature feature -- very visible in the dark.
   */
  _createFallbackCat() {
    const group = new THREE.Group();

    const darkMat = new THREE.MeshStandardMaterial({ color: 0x222222 });

    // Body
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.3, 0.8), darkMat);
    body.position.set(0, 0.25, 0);
    body.castShadow = true;
    group.add(body);

    // Head
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.3), darkMat);
    head.position.set(0, 0.4, 0.45);
    head.castShadow = true;
    group.add(head);

    // Left ear
    const leftEar = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.15, 4), darkMat);
    leftEar.position.set(-0.1, 0.6, 0.45);
    leftEar.castShadow = true;
    group.add(leftEar);

    // Right ear
    const rightEar = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.15, 4), darkMat);
    rightEar.position.set(0.1, 0.6, 0.45);
    rightEar.castShadow = true;
    group.add(rightEar);

    // Tail - angled upward
    const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.02, 0.6, 8), darkMat);
    tail.position.set(0, 0.35, -0.5);
    tail.rotation.x = Math.PI / 4; // tilt tail upward
    tail.castShadow = true;
    group.add(tail);

    // Legs — 4 thin cylinders below the body
    const legGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.2, 6);
    const legPositions = [
      [-0.12, 0.1, 0.25],  // front-left
      [0.12, 0.1, 0.25],   // front-right
      [-0.12, 0.1, -0.25], // back-left
      [0.12, 0.1, -0.25],  // back-right
    ];
    for (const [lx, ly, lz] of legPositions) {
      const leg = new THREE.Mesh(legGeo, darkMat);
      leg.position.set(lx, ly, lz);
      leg.castShadow = true;
      group.add(leg);
    }

    // --- Glowing eyes ---
    // These MUST be visible in the dark. Use MeshBasicMaterial (unaffected by lighting)
    // and add PointLights for extra glow effect.
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x44FF44 });

    const leftEye = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 8), eyeMat);
    leftEye.position.set(-0.08, 0.42, 0.61);
    group.add(leftEye);

    const rightEye = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 8), eyeMat);
    rightEye.position.set(0.08, 0.42, 0.61);
    group.add(rightEye);

    // PointLights on each eye for extra glow in the dark
    const leftEyeLight = new THREE.PointLight(0x44FF44, 0.8, 0.5);
    leftEyeLight.position.copy(leftEye.position);
    group.add(leftEyeLight);

    const rightEyeLight = new THREE.PointLight(0x44FF44, 0.8, 0.5);
    rightEyeLight.position.copy(rightEye.position);
    group.add(rightEyeLight);

    group.visible = false;
    this.scene.add(group);
    this.model = group;
  }

  /**
   * Attempt to load a GLTF model. Falls back to the procedural cat on failure.
   */
  async load() {
    try {
      const loader = new GLTFLoader();
      const gltf = await loader.loadAsync('/models/cat.glb');
      this.model = gltf.scene;
      this.model.visible = false;
      this.model.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });

      // Set up animation mixer if the model has animations
      if (gltf.animations && gltf.animations.length > 0) {
        this.mixer = new THREE.AnimationMixer(this.model);
      }

      this.scene.add(this.model);
    } catch (_err) {
      // Model file doesn't exist — use the procedural fallback
      this._createFallbackCat();
    }
  }

  /**
   * Configure the cat for a specific room.
   * @param {number} roomIndex
   * @param {THREE.Vector3[]} hidingSpots
   * @param {number} aggressionMultiplier
   */
  setupForRoom(roomIndex, hidingSpots, aggressionMultiplier) {
    this.state = CAT_STATE.LURKING;
    this._pounceFired = false;
    this.stalkTimer = 0;
    this.aggressionMultiplier = aggressionMultiplier;

    // Pick a random hiding spot
    if (hidingSpots && hidingSpots.length > 0) {
      const spot = hidingSpots[Math.floor(Math.random() * hidingSpots.length)];
      if (this.model) {
        this.model.position.copy(spot);
        this.model.visible = false;
      }
    }

    this.visible = false;
  }

  /**
   * Activate the cat — transition from LURKING to STALKING.
   */
  activate() {
    if (this.state !== CAT_STATE.LURKING) return;

    this.state = CAT_STATE.STALKING;
    this.stalkTimer = 0;
    this._pounceFired = false;

    if (this.model) {
      this.model.visible = true;
    }
    this.visible = true;
  }

  /**
   * Per-frame update. Runs the cat's state machine.
   * @param {number} delta - Seconds since last frame
   * @param {THREE.Vector3} playerPosition
   * @param {boolean} playerIsSprinting
   */
  update(delta, playerPosition, playerIsSprinting) {
    if (!this.model) return;

    // Update GLTF animation mixer if present
    if (this.mixer) {
      this.mixer.update(delta);
    }

    switch (this.state) {
      case CAT_STATE.LURKING:
        // Do nothing — waiting for trigger zone activation
        break;

      case CAT_STATE.STALKING:
        this._updateStalking(delta, playerPosition, playerIsSprinting);
        break;

      case CAT_STATE.POUNCING:
        this._updatePouncing();
        break;
    }
  }

  /**
   * STALKING state logic: move toward the player, face them, and check for pounce.
   */
  _updateStalking(delta, playerPosition, playerIsSprinting) {
    this.model.visible = true;

    // Look at the player (flatten y so the cat doesn't tilt up/down)
    this._lookTarget.set(playerPosition.x, this.model.position.y, playerPosition.z);
    this.model.lookAt(this._lookTarget);

    // Calculate direction toward player on the XZ plane
    this._direction.set(
      playerPosition.x - this.model.position.x,
      0,
      playerPosition.z - this.model.position.z,
    );
    const distance = this._direction.length();

    if (distance > 0.01) {
      this._direction.normalize();
    }

    // Move toward player — faster if player is sprinting (cat reacts to noise)
    const sprintFactor = playerIsSprinting ? 1.5 : 1.0;
    const moveSpeed = this.speed * this.aggressionMultiplier * sprintFactor * delta;
    this.model.position.addScaledVector(this._direction, moveSpeed);

    // Increment stalk timer
    this.stalkTimer += delta;

    // Check for pounce conditions
    if (distance < 2.0 || this.stalkTimer > this.stalkDuration) {
      this.state = CAT_STATE.POUNCING;
    }
  }

  /**
   * POUNCING state logic: fire the jump scare callback once.
   */
  _updatePouncing() {
    if (!this._pounceFired) {
      this._pounceFired = true;
      if (this.onJumpScare) {
        this.onJumpScare();
      }
    }
  }

  /**
   * Get the distance from the cat to a position.
   * @param {THREE.Vector3} playerPosition
   * @returns {number}
   */
  getDistanceTo(playerPosition) {
    if (!this.model) return Infinity;
    return this.model.position.distanceTo(playerPosition);
  }

  /**
   * Reset the cat to its initial dormant state.
   */
  reset() {
    this.state = CAT_STATE.LURKING;
    this.stalkTimer = 0;
    this._pounceFired = false;
    this.visible = false;

    if (this.model) {
      this.model.visible = false;
    }
  }
}
