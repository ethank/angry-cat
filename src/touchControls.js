/**
 * Touch Controls for mobile/tablet (iPad, iPhone, Android).
 *
 * Provides a virtual joystick, swipe-to-look, sprint button, and
 * pause/help buttons. Only active on touch-capable devices.
 *
 * All DOM elements are created with createElement / textContent (no innerHTML).
 */

import { Euler } from 'three';

// ── Device detection ─────────────────────────────────────────────────────────

/**
 * True when running on a touch-capable device (phones, tablets).
 * Uses maxTouchPoints as the primary signal since `ontouchstart` can be
 * unreliable on some tablets with attached keyboards.
 */
export const isTouchDevice = (
  'ontouchstart' in window ||
  navigator.maxTouchPoints > 0
);

// ── Constants ────────────────────────────────────────────────────────────────

const DEAD_ZONE = 0.2;           // fraction of joystick radius
const LOOK_SENSITIVITY = 0.004;  // radians per pixel of touch movement
const PITCH_LIMIT = Math.PI / 2 - 0.05; // clamp to avoid gimbal flip

// Reusable Euler for camera rotation (YXZ matches PointerLockControls)
const _euler = new Euler(0, 0, 0, 'YXZ');

// ── TouchControls class ─────────────────────────────────────────────────────

export class TouchControls {
  /**
   * @param {Object} opts
   * @param {import('./player.js').Player} opts.player
   * @param {THREE.Camera} opts.camera
   * @param {import('./screens.js').HelpOverlay} opts.helpOverlay
   * @param {import('./screens.js').PauseMenu} opts.pauseMenu
   * @param {Function} opts.gameRunningFn  Returns current gameRunning state
   */
  constructor({ player, camera, helpOverlay, pauseMenu, gameRunningFn }) {
    this.player = player;
    this.camera = camera;
    this.helpOverlay = helpOverlay;
    this.pauseMenu = pauseMenu;
    this.gameRunningFn = gameRunningFn;

    // Touch tracking
    this._joystickTouchId = null;
    this._lookTouchId = null;
    this._lookLastX = 0;
    this._lookLastY = 0;

    // Build DOM
    this._createContainer();
    this._createJoystick();
    this._createLookArea();
    this._createSprintButton();
    this._createPauseButton();
    this._createHelpButton();

    // Wire up events
    this._bindEvents();
  }

  // ── DOM creation ─────────────────────────────────────────────────────────

  _createContainer() {
    this.container = document.createElement('div');
    this.container.className = 'touch-controls';
    document.body.appendChild(this.container);
  }

  _createJoystick() {
    this.joystickOuter = document.createElement('div');
    this.joystickOuter.className = 'touch-joystick';

    this.joystickKnob = document.createElement('div');
    this.joystickKnob.className = 'touch-joystick-knob';

    this.joystickOuter.appendChild(this.joystickKnob);
    this.container.appendChild(this.joystickOuter);
  }

  _createLookArea() {
    this.lookArea = document.createElement('div');
    this.lookArea.className = 'touch-look-area';
    this.container.appendChild(this.lookArea);
  }

  _createSprintButton() {
    this.sprintBtn = document.createElement('div');
    this.sprintBtn.className = 'touch-sprint-btn';
    this.sprintBtn.textContent = 'SPRINT';
    this.container.appendChild(this.sprintBtn);
  }

  _createPauseButton() {
    this.pauseBtn = document.createElement('div');
    this.pauseBtn.className = 'touch-pause-btn';
    this.pauseBtn.textContent = '| |';
    this.container.appendChild(this.pauseBtn);
  }

  _createHelpButton() {
    this.helpBtn = document.createElement('div');
    this.helpBtn.className = 'touch-help-btn';
    this.helpBtn.textContent = '?';
    this.container.appendChild(this.helpBtn);
  }

  // ── Event binding ────────────────────────────────────────────────────────

  _bindEvents() {
    // --- Joystick ---
    this.joystickOuter.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const touch = e.changedTouches[0];
      this._joystickTouchId = touch.identifier;
      this._updateJoystick(touch);
    }, { passive: false });

    this.joystickOuter.addEventListener('touchmove', (e) => {
      e.preventDefault();
      for (const touch of e.changedTouches) {
        if (touch.identifier === this._joystickTouchId) {
          this._updateJoystick(touch);
        }
      }
    }, { passive: false });

    const joystickEnd = (e) => {
      for (const touch of e.changedTouches) {
        if (touch.identifier === this._joystickTouchId) {
          this._joystickTouchId = null;
          this._resetJoystick();
        }
      }
    };
    this.joystickOuter.addEventListener('touchend', joystickEnd);
    this.joystickOuter.addEventListener('touchcancel', joystickEnd);

    // --- Look area (swipe to rotate camera) ---
    this.lookArea.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const touch = e.changedTouches[0];
      this._lookTouchId = touch.identifier;
      this._lookLastX = touch.clientX;
      this._lookLastY = touch.clientY;
    }, { passive: false });

    this.lookArea.addEventListener('touchmove', (e) => {
      e.preventDefault();
      for (const touch of e.changedTouches) {
        if (touch.identifier === this._lookTouchId) {
          const deltaX = touch.clientX - this._lookLastX;
          const deltaY = touch.clientY - this._lookLastY;
          this._lookLastX = touch.clientX;
          this._lookLastY = touch.clientY;
          this._applyLook(deltaX, deltaY);
        }
      }
    }, { passive: false });

    const lookEnd = (e) => {
      for (const touch of e.changedTouches) {
        if (touch.identifier === this._lookTouchId) {
          this._lookTouchId = null;
        }
      }
    };
    this.lookArea.addEventListener('touchend', lookEnd);
    this.lookArea.addEventListener('touchcancel', lookEnd);

    // --- Sprint button (hold to sprint) ---
    this.sprintBtn.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.player.keys.sprint = true;
      this.sprintBtn.classList.add('active');
    }, { passive: false });

    const sprintEnd = (e) => {
      e.preventDefault();
      this.player.keys.sprint = false;
      this.sprintBtn.classList.remove('active');
    };
    this.sprintBtn.addEventListener('touchend', sprintEnd, { passive: false });
    this.sprintBtn.addEventListener('touchcancel', sprintEnd, { passive: false });

    // --- Pause button ---
    this.pauseBtn.addEventListener('touchstart', (e) => {
      e.preventDefault();
      if (this.gameRunningFn()) {
        this.pauseMenu.show();
        this.hide();
      }
    }, { passive: false });

    // --- Help button ---
    this.helpBtn.addEventListener('touchstart', (e) => {
      e.preventDefault();
      if (this.gameRunningFn()) {
        this.helpOverlay.toggle();
      }
    }, { passive: false });
  }

  // ── Joystick logic ───────────────────────────────────────────────────────

  /**
   * Map the touch position relative to the joystick center into
   * player.keys booleans (forward, backward, left, right).
   */
  _updateJoystick(touch) {
    const rect = this.joystickOuter.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const radius = rect.width / 2;

    let dx = touch.clientX - centerX;
    let dy = touch.clientY - centerY;

    // Clamp to radius
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > radius) {
      dx = (dx / dist) * radius;
      dy = (dy / dist) * radius;
    }

    // Move the knob visually
    this.joystickKnob.style.transform = `translate(${dx}px, ${dy}px)`;

    // Normalize distance
    const normalizedDist = dist / radius;

    // Dead zone — ignore tiny movements
    if (normalizedDist < DEAD_ZONE) {
      this.player.keys.forward = false;
      this.player.keys.backward = false;
      this.player.keys.left = false;
      this.player.keys.right = false;
      return;
    }

    // Angle from center. Note: screen Y is inverted, so negate dy so up = forward.
    const angle = Math.atan2(-dy, dx);

    // Map to 8-directional input using overlapping angular sectors.
    // This allows diagonal combos (forward+right, etc.) just like W+D on keyboard.
    this.player.keys.forward  = angle > Math.PI / 8 && angle < Math.PI * 7 / 8;
    this.player.keys.backward = angle < -Math.PI / 8 && angle > -Math.PI * 7 / 8;
    this.player.keys.right    = angle > -Math.PI * 3 / 8 && angle < Math.PI * 3 / 8;
    this.player.keys.left     = angle > Math.PI * 5 / 8 || angle < -Math.PI * 5 / 8;
  }

  _resetJoystick() {
    this.joystickKnob.style.transform = 'translate(0px, 0px)';
    this.player.keys.forward = false;
    this.player.keys.backward = false;
    this.player.keys.left = false;
    this.player.keys.right = false;
  }

  // ── Camera look ──────────────────────────────────────────────────────────

  /**
   * Apply touch-delta-based camera rotation, replicating the exact logic
   * inside PointerLockControls.onMouseMove (Euler YXZ quaternion approach).
   */
  _applyLook(deltaX, deltaY) {
    _euler.setFromQuaternion(this.camera.quaternion);

    _euler.y -= deltaX * LOOK_SENSITIVITY;
    _euler.x -= deltaY * LOOK_SENSITIVITY;

    // Clamp pitch
    _euler.x = Math.max(-PITCH_LIMIT, Math.min(PITCH_LIMIT, _euler.x));

    this.camera.quaternion.setFromEuler(_euler);
  }

  // ── Lifecycle ────────────────────────────────────────────────────────────

  show() {
    this.container.style.display = '';
  }

  hide() {
    this.container.style.display = 'none';
    // Reset all inputs when hidden
    this._resetJoystick();
    this.player.keys.sprint = false;
    this.sprintBtn.classList.remove('active');
  }

  dispose() {
    this.container.remove();
  }
}
