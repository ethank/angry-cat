/**
 * Screens -- win screen and pause menu overlays for Angry Cat.
 *
 * All DOM elements are created with createElement / textContent (no innerHTML).
 */

// ──────────────────────────────────────────────────────────────────────────────
//  Win Screen
// ──────────────────────────────────────────────────────────────────────────────

export class WinScreen {
  /**
   * @param {Function} onPlayAgain  Called when the player clicks "PLAY AGAIN"
   */
  constructor(onPlayAgain) {
    this.onPlayAgain = onPlayAgain;

    // Root overlay
    this.overlay = document.createElement('div');
    this.overlay.className = 'win-screen';

    // Title
    const heading = document.createElement('h1');
    heading.textContent = 'YOU ESCAPED!';
    this.overlay.appendChild(heading);

    // Subtitle
    const subtitle = document.createElement('p');
    subtitle.className = 'subtitle';
    subtitle.textContent = 'The cat goes back to sleep... for now.';
    this.overlay.appendChild(subtitle);

    // Time display
    this.timeEl = document.createElement('p');
    this.timeEl.className = 'time';
    this.timeEl.textContent = '0:00';
    this.overlay.appendChild(this.timeEl);

    // Play Again button
    const btn = document.createElement('button');
    btn.className = 'play-again-btn';
    btn.textContent = 'PLAY AGAIN';
    btn.addEventListener('click', () => {
      this.hide();
      if (this.onPlayAgain) this.onPlayAgain();
    });
    this.overlay.appendChild(btn);

    // Hidden by default
    this.overlay.style.display = 'none';
    document.body.appendChild(this.overlay);
  }

  /**
   * Show the win screen with the final time.
   * @param {string} timeString  Formatted elapsed time (e.g. "2:34")
   */
  show(timeString) {
    this.timeEl.textContent = timeString;
    this.overlay.style.display = 'flex';
    // Trigger opacity transition (start at 0, then flip to 1)
    this.overlay.style.opacity = '0';
    // Force reflow so the transition fires
    this.overlay.offsetHeight;
    this.overlay.style.opacity = '1';
  }

  hide() {
    this.overlay.style.display = 'none';
    this.overlay.style.opacity = '0';
  }
}

// ──────────────────────────────────────────────────────────────────────────────
//  Help Overlay (toggle with H key)
// ──────────────────────────────────────────────────────────────────────────────

export class HelpOverlay {
  constructor() {
    this.visible = false;

    // Root overlay
    this.overlay = document.createElement('div');
    this.overlay.className = 'help-overlay';

    const box = document.createElement('div');
    box.className = 'help-box';

    const heading = document.createElement('h2');
    heading.textContent = 'CONTROLS';
    box.appendChild(heading);

    const controls = [
      ['W A S D', 'Move'],
      ['MOUSE', 'Look around'],
      ['SHIFT', 'Sprint (uses stamina)'],
      ['H', 'Toggle this help'],
      ['ESC', 'Pause game'],
    ];

    controls.forEach(([key, action]) => {
      const row = document.createElement('div');
      row.className = 'help-row';

      const keyEl = document.createElement('span');
      keyEl.className = 'help-key';
      keyEl.textContent = key;
      row.appendChild(keyEl);

      const actionEl = document.createElement('span');
      actionEl.className = 'help-action';
      actionEl.textContent = action;
      row.appendChild(actionEl);

      box.appendChild(row);
    });

    // Tips section
    const tipsHeading = document.createElement('h3');
    tipsHeading.textContent = 'TIPS';
    box.appendChild(tipsHeading);

    const tips = [
      "Don't sprint — the cat hears you!",
      'Watch for glowing green eyes in the dark.',
      'Reach the green exit door to escape.',
    ];

    tips.forEach((tip) => {
      const tipEl = document.createElement('p');
      tipEl.className = 'help-tip';
      tipEl.textContent = '• ' + tip;
      box.appendChild(tipEl);
    });

    const dismiss = document.createElement('p');
    dismiss.className = 'help-dismiss';
    dismiss.textContent = 'Press H to close';
    box.appendChild(dismiss);

    this.overlay.appendChild(box);

    this.overlay.style.display = 'none';
    document.body.appendChild(this.overlay);
  }

  toggle() {
    this.visible = !this.visible;
    this.overlay.style.display = this.visible ? 'flex' : 'none';
  }

  show() {
    this.visible = true;
    this.overlay.style.display = 'flex';
  }

  hide() {
    this.visible = false;
    this.overlay.style.display = 'none';
  }
}

// ──────────────────────────────────────────────────────────────────────────────
//  Pause Menu
// ──────────────────────────────────────────────────────────────────────────────

export class PauseMenu {
  /**
   * @param {Function} onResume  Called when the player clicks to resume
   */
  constructor(onResume) {
    this.onResume = onResume;

    // Root overlay
    this.overlay = document.createElement('div');
    this.overlay.className = 'pause-overlay';

    // Inner wrapper (clickable area)
    const inner = document.createElement('div');
    inner.className = 'pause-inner';

    const heading = document.createElement('h2');
    heading.textContent = 'PAUSED';
    inner.appendChild(heading);

    const hint = document.createElement('p');
    hint.textContent = 'Click to resume';
    inner.appendChild(hint);

    this.overlay.appendChild(inner);

    // Click anywhere on the overlay to resume
    this.overlay.addEventListener('click', () => {
      if (this.onResume) this.onResume();
    });

    // Hidden by default
    this.overlay.style.display = 'none';
    document.body.appendChild(this.overlay);
  }

  show() {
    this.overlay.style.display = 'flex';
  }

  hide() {
    this.overlay.style.display = 'none';
  }
}
