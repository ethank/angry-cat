const deathMessages = [
  'The cat got you.',
  'You should have been quieter.',
  'Cats always win.',
  'That cat is REALLY angry.',
  'Maybe try tiptoeing next time?',
];

export class JumpScare {
  constructor(camera) {
    this.camera = camera;
    this.shakeIntensity = 0;
    this.shakeDuration = 0;
    this.isActive = false;
    this.onRespawn = null;

    // Create overlay element
    this.overlay = document.createElement('div');
    this.overlay.className = 'jumpscare-overlay';
    this.overlay.style.display = 'none';
    this.overlay.style.zIndex = '100';
    document.body.appendChild(this.overlay);
  }

  /**
   * Remove all child nodes from the overlay using safe DOM methods.
   */
  _clearOverlay() {
    while (this.overlay.firstChild) {
      this.overlay.removeChild(this.overlay.firstChild);
    }
  }

  trigger() {
    if (this.isActive) return;
    this.isActive = true;

    // Show overlay with red flash
    this.overlay.style.display = 'flex';
    this._clearOverlay();

    const flash = document.createElement('div');
    flash.className = 'jumpscare-flash';
    this.overlay.appendChild(flash);

    // Force reflow then add active class to trigger animation
    flash.offsetHeight;
    flash.classList.add('active');

    // Set camera shake parameters
    this.shakeIntensity = 0.15;
    this.shakeDuration = 0.5;

    // After 600ms: replace flash with death screen
    setTimeout(() => {
      this._clearOverlay();

      const deathScreen = document.createElement('div');
      deathScreen.className = 'death-screen';

      const message = document.createElement('p');
      const randomIndex = Math.floor(Math.random() * deathMessages.length);
      message.textContent = deathMessages[randomIndex];

      deathScreen.appendChild(message);
      this.overlay.appendChild(deathScreen);
    }, 600);

    // After 2500ms: hide overlay, reset, call respawn
    setTimeout(() => {
      this.overlay.style.display = 'none';
      this._clearOverlay();

      this.isActive = false;

      if (this.onRespawn) {
        this.onRespawn();
      }
    }, 2500);
  }

  update(delta) {
    if (this.shakeDuration > 0) {
      this.shakeDuration -= delta;
      this.camera.rotation.x += (Math.random() - 0.5) * this.shakeIntensity;
      this.camera.rotation.z += (Math.random() - 0.5) * this.shakeIntensity;
      this.shakeIntensity *= 0.95;
    }
  }
}
