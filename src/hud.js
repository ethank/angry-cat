/**
 * HUD -- heads-up display for Angry Cat.
 *
 * Renders a stamina bar, room-name popup, and elapsed-time timer.
 * All DOM elements are created with createElement (no innerHTML).
 */
export class HUD {
  constructor() {
    this._elapsed = 0;
    this._roomNameTimeout = null;

    // ── Root container ──
    this.root = document.getElementById('hud');

    // ── Lives display ──
    this.livesWrap = document.createElement('div');
    this.livesWrap.className = 'hud-lives';
    this._livesHearts = [];
    for (let i = 0; i < 3; i++) {
      const heart = document.createElement('span');
      heart.className = 'hud-heart';
      heart.textContent = '\u2764'; // ❤
      this.livesWrap.appendChild(heart);
      this._livesHearts.push(heart);
    }
    this.root.appendChild(this.livesWrap);

    // ── Stamina bar ──
    this.staminaWrap = document.createElement('div');
    this.staminaWrap.className = 'hud-stamina';

    this.staminaBar = document.createElement('div');
    this.staminaBar.className = 'hud-stamina-bar';
    this.staminaBar.style.width = '100%';

    this.staminaWrap.appendChild(this.staminaBar);
    this.root.appendChild(this.staminaWrap);

    // ── Room name ──
    this.roomName = document.createElement('div');
    this.roomName.className = 'hud-room-name';
    this.root.appendChild(this.roomName);

    // ── Timer ──
    this.timer = document.createElement('div');
    this.timer.className = 'hud-timer';
    this.timer.textContent = '0:00';
    this.root.appendChild(this.timer);
  }

  /**
   * Show a room name that fades in, then auto-fades out after 2 seconds.
   * @param {string} name
   */
  showRoomName(name) {
    // Clear any pending hide
    if (this._roomNameTimeout) {
      clearTimeout(this._roomNameTimeout);
      this._roomNameTimeout = null;
    }

    this.roomName.textContent = name;
    this.roomName.classList.add('visible');

    this._roomNameTimeout = setTimeout(() => {
      this.roomName.classList.remove('visible');
      this._roomNameTimeout = null;
    }, 2000);
  }

  /**
   * Update stamina bar width and visibility.
   * Bar is visible when sprinting or stamina < 1.
   * @param {number} stamina  0..1
   * @param {boolean} isSprinting
   */
  updateStamina(stamina, isSprinting) {
    // Width as percentage
    this.staminaBar.style.width = (stamina * 100) + '%';

    // Color transition: green (#44ff44) at full, red (#ff4444) when empty
    const r = Math.round(0x44 + (0xFF - 0x44) * (1 - stamina));
    const g = Math.round(0xFF * stamina);
    const b = 0x44;
    this.staminaBar.style.backgroundColor = `rgb(${r},${g},${b})`;

    // Visibility
    if (isSprinting || stamina < 1) {
      this.staminaWrap.classList.add('visible');
    } else {
      this.staminaWrap.classList.remove('visible');
    }
  }

  /**
   * Increment the elapsed timer and update the DOM.
   * @param {number} delta  seconds since last frame
   */
  updateTimer(delta) {
    this._elapsed += delta;
    this.timer.textContent = this.getTimeString();
  }

  /**
   * Return the current elapsed time formatted as m:ss.
   * @returns {string}
   */
  getTimeString() {
    const totalSeconds = Math.floor(this._elapsed);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return minutes + ':' + String(seconds).padStart(2, '0');
  }

  /**
   * Update the lives display.
   * @param {number} lives  Current number of lives (0..3)
   */
  updateLives(lives) {
    for (let i = 0; i < this._livesHearts.length; i++) {
      if (i < lives) {
        this._livesHearts[i].classList.remove('lost');
      } else {
        this._livesHearts[i].classList.add('lost');
      }
    }
  }

  /**
   * Reset the timer to zero.
   */
  reset() {
    this._elapsed = 0;
    this.timer.textContent = '0:00';
    this.staminaWrap.classList.remove('visible');
    this.staminaBar.style.width = '100%';
    this.roomName.classList.remove('visible');
    this.updateLives(3);
    if (this._roomNameTimeout) {
      clearTimeout(this._roomNameTimeout);
      this._roomNameTimeout = null;
    }
  }
}
