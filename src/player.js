import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

const WALK_SPEED = 4;
const SPRINT_SPEED = 6;
const EYE_HEIGHT = 1.6;
const COLLISION_DISTANCE = 0.5;
const MAX_STAMINA_DURATION = 3; // seconds to drain fully
const STAMINA_RECHARGE_TIME = 4; // seconds to recharge fully
const HEAD_BOB_AMPLITUDE = 0.04;
const HEAD_BOB_FREQ_WALK = 8;
const HEAD_BOB_FREQ_SPRINT = 12;
const STEP_INTERVAL_WALK = 0.5;
const STEP_INTERVAL_SPRINT = 0.3;

export class Player {
  constructor(camera, scene, domElement) {
    this.camera = camera;
    this.scene = scene;

    // PointerLockControls
    this.controls = new PointerLockControls(camera, domElement);
    scene.add(this.controls.object);

    // Movement key state
    this.keys = { forward: false, backward: false, left: false, right: false, sprint: false };

    // Stamina (0..1)
    this.stamina = 1;

    // Head bob
    this._headBobTimer = 0;

    // Mobile mode — when true, movement updates run without pointer lock
    this.mobileMode = false;

    // Footstep tracking
    this._stepTimer = 0;
    this.onStep = null; // callback(isSprinting)

    // Raycaster for collision
    this._raycaster = new THREE.Raycaster();
    this._raycaster.near = 0;
    this._raycaster.far = COLLISION_DISTANCE;

    // Temp vectors (reuse to avoid GC pressure)
    this._moveDirection = new THREE.Vector3();
    this._forward = new THREE.Vector3();
    this._right = new THREE.Vector3();
    this._rayOrigin = new THREE.Vector3();

    // Bind keyboard listeners
    this._onKeyDown = this._handleKeyDown.bind(this);
    this._onKeyUp = this._handleKeyUp.bind(this);
    document.addEventListener('keydown', this._onKeyDown);
    document.addEventListener('keyup', this._onKeyUp);
  }

  // --- Public getters ---

  get position() {
    return this.controls.object.position;
  }

  get isSprinting() {
    return this.keys.sprint && this.stamina > 0 && this.isMoving;
  }

  get isMoving() {
    return this.keys.forward || this.keys.backward || this.keys.left || this.keys.right;
  }

  get isLocked() {
    return this.controls.isLocked;
  }

  // --- Public methods ---

  lock() {
    this.controls.lock();
  }

  setMobileMode(enabled) {
    this.mobileMode = enabled;
  }

  update(delta, collidables) {
    if (!this.controls.isLocked && !this.mobileMode) return;

    // Determine effective sprint state
    const sprinting = this.isSprinting;
    const moving = this.isMoving;
    const speed = sprinting ? SPRINT_SPEED : WALK_SPEED;

    // --- Stamina ---
    if (sprinting) {
      this.stamina -= delta / MAX_STAMINA_DURATION;
      if (this.stamina < 0) this.stamina = 0;
    } else {
      this.stamina += delta / STAMINA_RECHARGE_TIME;
      if (this.stamina > 1) this.stamina = 1;
    }

    // --- Compute movement direction ---
    this._moveDirection.set(0, 0, 0);

    // Get camera-relative forward and right vectors (on XZ plane)
    this.camera.getWorldDirection(this._forward);
    this._forward.y = 0;
    this._forward.normalize();

    this._right.crossVectors(this._forward, this.camera.up).normalize();

    if (this.keys.forward) this._moveDirection.add(this._forward);
    if (this.keys.backward) this._moveDirection.sub(this._forward);
    if (this.keys.left) this._moveDirection.sub(this._right);
    if (this.keys.right) this._moveDirection.add(this._right);

    if (this._moveDirection.lengthSq() > 0) {
      this._moveDirection.normalize();
    }

    // --- Collision detection ---
    if (moving && collidables && collidables.length > 0) {
      this._rayOrigin.copy(this.position);
      this._rayOrigin.y = EYE_HEIGHT * 0.5; // cast from mid-body

      // Check collision along the composite movement direction
      if (this._moveDirection.lengthSq() > 0) {
        // Decompose into forward/backward and left/right components for per-axis blocking
        const forwardComponent = this._forward.dot(this._moveDirection);
        const rightComponent = this._right.dot(this._moveDirection);

        // Check forward/backward axis
        if (Math.abs(forwardComponent) > 0.01) {
          const axisDir = this._forward.clone().multiplyScalar(Math.sign(forwardComponent));
          this._raycaster.set(this._rayOrigin, axisDir);
          const hits = this._raycaster.intersectObjects(collidables, true);
          if (hits.length > 0) {
            // Block movement along forward/backward axis
            this._moveDirection.addScaledVector(this._forward, -forwardComponent);
          }
        }

        // Check left/right axis
        if (Math.abs(rightComponent) > 0.01) {
          const axisDir = this._right.clone().multiplyScalar(Math.sign(rightComponent));
          this._raycaster.set(this._rayOrigin, axisDir);
          const hits = this._raycaster.intersectObjects(collidables, true);
          if (hits.length > 0) {
            // Block movement along left/right axis
            this._moveDirection.addScaledVector(this._right, -rightComponent);
          }
        }
      }
    }

    // --- Apply movement via PointerLockControls ---
    if (moving && this._moveDirection.lengthSq() > 0) {
      // PointerLockControls.moveForward/moveRight move along camera-relative axes
      const forwardAmount = this._forward.dot(this._moveDirection) * speed * delta;
      const rightAmount = this._right.dot(this._moveDirection) * speed * delta;

      this.controls.moveForward(forwardAmount);
      this.controls.moveRight(rightAmount);
    }

    // --- Head bob ---
    if (moving && this._moveDirection.lengthSq() > 0) {
      const freq = sprinting ? HEAD_BOB_FREQ_SPRINT : HEAD_BOB_FREQ_WALK;
      this._headBobTimer += delta * freq;
      this.camera.position.y = EYE_HEIGHT + Math.sin(this._headBobTimer) * HEAD_BOB_AMPLITUDE;
    } else {
      // Smoothly return to eye height
      this._headBobTimer = 0;
      this.camera.position.y = EYE_HEIGHT;
    }

    // --- Footstep tracking ---
    if (moving && this._moveDirection.lengthSq() > 0) {
      const stepInterval = sprinting ? STEP_INTERVAL_SPRINT : STEP_INTERVAL_WALK;
      this._stepTimer += delta;
      if (this._stepTimer >= stepInterval) {
        this._stepTimer -= stepInterval;
        if (this.onStep) {
          this.onStep(sprinting);
        }
      }
    } else {
      this._stepTimer = 0;
    }
  }

  // --- Key handling ---

  _handleKeyDown(e) {
    switch (e.code) {
      case 'KeyW': this.keys.forward = true; break;
      case 'KeyS': this.keys.backward = true; break;
      case 'KeyA': this.keys.left = true; break;
      case 'KeyD': this.keys.right = true; break;
      case 'ShiftLeft':
      case 'ShiftRight':
        this.keys.sprint = true; break;
    }
  }

  _handleKeyUp(e) {
    switch (e.code) {
      case 'KeyW': this.keys.forward = false; break;
      case 'KeyS': this.keys.backward = false; break;
      case 'KeyA': this.keys.left = false; break;
      case 'KeyD': this.keys.right = false; break;
      case 'ShiftLeft':
      case 'ShiftRight':
        this.keys.sprint = false; break;
    }
  }

  dispose() {
    document.removeEventListener('keydown', this._onKeyDown);
    document.removeEventListener('keyup', this._onKeyUp);
    this.controls.dispose();
  }
}
