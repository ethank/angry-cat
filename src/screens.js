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
