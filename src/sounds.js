import * as THREE from 'three';

/**
 * SoundManager -- procedural audio engine for Angry Cat.
 *
 * Every sound is synthesized at runtime using the Web Audio API.  No external
 * audio files are required.  The class attaches a THREE.AudioListener to the
 * camera so that positional audio (e.g. the cat growl) works correctly.
 */
export class SoundManager {
  constructor(camera) {
    this.camera = camera;

    // THREE.js audio plumbing
    this.listener = new THREE.AudioListener();
    this.camera.add(this.listener);

    // Underlying Web Audio context (created by THREE)
    this.audioContext = this.listener.context;

    // Map of name -> THREE.Audio / THREE.PositionalAudio objects
    this.sounds = {};

    // Track whether the cat growl is currently playing
    this._growlActive = false;

    // Dedicated Object3D to anchor the positional growl in the scene
    this._growlAnchor = new THREE.Object3D();
    camera.parent?.add(this._growlAnchor); // add to scene (camera is in scene)
  }

  // -----------------------------------------------------------------------
  //  Buffer generation helpers
  // -----------------------------------------------------------------------

  /**
   * Generate a buffer filled with white noise.
   */
  _generateNoiseBuffer(duration, sampleRate) {
    const length = Math.ceil(duration * sampleRate);
    const buffer = this.audioContext.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  /**
   * Generate a tonal buffer (sine or sawtooth) with an attack/release envelope.
   */
  _generateToneBuffer(frequency, duration, sampleRate, waveform = 'sine') {
    const length = Math.ceil(duration * sampleRate);
    const buffer = this.audioContext.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      // Fast attack, quick release at the end
      const env = Math.min(1, t * 20) * Math.max(0, 1 - (t - duration + 0.05) * 20);
      if (waveform === 'sine') {
        data[i] = Math.sin(2 * Math.PI * frequency * t) * env;
      } else if (waveform === 'sawtooth') {
        data[i] = ((t * frequency) % 1 * 2 - 1) * env;
      }
    }
    return buffer;
  }

  /**
   * Generate a frequency-sweep buffer (linear interpolation from startFreq to
   * endFreq) with an envelope.
   */
  _generateSweepBuffer(startFreq, endFreq, duration, sampleRate, waveform = 'sine') {
    const length = Math.ceil(duration * sampleRate);
    const buffer = this.audioContext.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      const freq = startFreq + (endFreq - startFreq) * (t / duration);
      const env = Math.min(1, t * 50) * Math.max(0, 1 - (t - duration + 0.1) * 10);
      if (waveform === 'sine') {
        data[i] = Math.sin(2 * Math.PI * freq * t) * env;
      } else if (waveform === 'sawtooth') {
        data[i] = ((t * freq) % 1 * 2 - 1) * env;
      }
    }
    return buffer;
  }

  // -----------------------------------------------------------------------
  //  Simple DSP filters applied directly to sample arrays
  // -----------------------------------------------------------------------

  /**
   * Very simple one-pole lowpass filter applied in-place.
   * alpha in (0, 1) -- smaller = more filtering.
   */
  _applyLowpass(data, alpha) {
    let prev = data[0];
    for (let i = 1; i < data.length; i++) {
      data[i] = prev + alpha * (data[i] - prev);
      prev = data[i];
    }
  }

  /**
   * Very simple one-pole highpass filter applied in-place.
   */
  _applyHighpass(data, alpha) {
    let prev = data[0];
    let prevOut = data[0];
    for (let i = 1; i < data.length; i++) {
      const curr = data[i];
      prevOut = alpha * (prevOut + curr - prev);
      prev = curr;
      data[i] = prevOut;
    }
  }

  /**
   * Bandpass: highpass then lowpass.
   * centerFreq is approximate; quality is very rough.
   */
  _applyBandpass(data, sampleRate, centerFreq) {
    // Derive crude cutoff alphas from the center frequency
    const lowAlpha = Math.min(0.99, (2 * Math.PI * centerFreq * 1.5) / sampleRate);
    const highAlpha = Math.max(0.01, 1 - (2 * Math.PI * centerFreq * 0.5) / sampleRate);
    this._applyHighpass(data, highAlpha);
    this._applyLowpass(data, lowAlpha);
  }

  // -----------------------------------------------------------------------
  //  Procedural sound generation
  // -----------------------------------------------------------------------

  generateProceduralSounds() {
    const sr = this.audioContext.sampleRate;

    // ------ ambient (brown noise loop) ------
    {
      const duration = 5;
      const buf = this._generateNoiseBuffer(duration, sr);
      const data = buf.getChannelData(0);
      // Brown noise: integrate white noise then lowpass
      // Simple cumulative sum then lowpass for a rumble
      let acc = 0;
      for (let i = 0; i < data.length; i++) {
        acc += data[i] * 0.02; // scale to avoid clipping
        acc *= 0.998;           // leak to prevent DC drift
        data[i] = acc;
      }
      this._applyLowpass(data, 0.05); // aggressive lowpass (~200Hz feel)
      // Normalize
      this._normalize(data, 0.5);

      const audio = new THREE.Audio(this.listener);
      audio.setBuffer(buf);
      audio.setLoop(true);
      audio.setVolume(0.15);
      this.sounds['ambient'] = audio;
    }

    // ------ footstep-tile ------
    {
      const duration = 0.1;
      const buf = this._generateNoiseBuffer(duration, sr);
      const data = buf.getChannelData(0);
      this._applyBandpass(data, sr, 2000);
      // Snappy envelope
      for (let i = 0; i < data.length; i++) {
        const t = i / sr;
        data[i] *= Math.exp(-t * 40);
      }
      this._normalize(data, 0.7);

      const audio = new THREE.Audio(this.listener);
      audio.setBuffer(buf);
      audio.setLoop(false);
      audio.setVolume(0.4);
      this.sounds['footstep-tile'] = audio;
    }

    // ------ footstep-wood ------
    {
      const duration = 0.1;
      const buf = this._generateNoiseBuffer(duration, sr);
      const data = buf.getChannelData(0);
      this._applyBandpass(data, sr, 800);
      for (let i = 0; i < data.length; i++) {
        const t = i / sr;
        data[i] *= Math.exp(-t * 35);
      }
      this._normalize(data, 0.7);

      const audio = new THREE.Audio(this.listener);
      audio.setBuffer(buf);
      audio.setLoop(false);
      audio.setVolume(0.35);
      this.sounds['footstep-wood'] = audio;
    }

    // ------ footstep-carpet ------
    {
      const duration = 0.08;
      const buf = this._generateNoiseBuffer(duration, sr);
      const data = buf.getChannelData(0);
      this._applyBandpass(data, sr, 400);
      for (let i = 0; i < data.length; i++) {
        const t = i / sr;
        data[i] *= Math.exp(-t * 50);
      }
      this._normalize(data, 0.4);

      const audio = new THREE.Audio(this.listener);
      audio.setBuffer(buf);
      audio.setLoop(false);
      audio.setVolume(0.2);
      this.sounds['footstep-carpet'] = audio;
    }

    // ------ cat-growl (sawtooth 80Hz + tremolo LFO at 4Hz, looping) ------
    {
      const duration = 2;
      const buf = this._generateToneBuffer(80, duration, sr, 'sawtooth');
      const data = buf.getChannelData(0);
      // Apply tremolo (LFO at 4Hz modulating amplitude)
      for (let i = 0; i < data.length; i++) {
        const t = i / sr;
        const lfo = 0.5 + 0.5 * Math.sin(2 * Math.PI * 4 * t);
        data[i] *= lfo;
      }
      // Light lowpass to tame harshness
      this._applyLowpass(data, 0.15);
      this._normalize(data, 0.6);

      // Positional audio so the growl comes from the cat's direction
      const audio = new THREE.PositionalAudio(this.listener);
      audio.setBuffer(buf);
      audio.setLoop(true);
      audio.setVolume(0.5);
      audio.setRefDistance(3);
      audio.setRolloffFactor(1.5);
      audio.setMaxDistance(20);
      this._growlAnchor.add(audio);
      this.sounds['cat-growl'] = audio;
    }

    // ------ cat-hiss (high-freq noise burst) ------
    {
      const duration = 0.3;
      const buf = this._generateNoiseBuffer(duration, sr);
      const data = buf.getChannelData(0);
      this._applyBandpass(data, sr, 5000);
      // Fast attack / decay envelope
      for (let i = 0; i < data.length; i++) {
        const t = i / sr;
        const env = Math.min(1, t * 100) * Math.exp(-t * 8);
        data[i] *= env;
      }
      this._normalize(data, 0.7);

      const audio = new THREE.Audio(this.listener);
      audio.setBuffer(buf);
      audio.setLoop(false);
      audio.setVolume(0.5);
      this.sounds['cat-hiss'] = audio;
    }

    // ------ cat-yowl (frequency sweep, the jump scare sound) ------
    {
      const duration = 0.5;
      const buf = this._generateSweepBuffer(200, 800, duration, sr, 'sawtooth');
      const data = buf.getChannelData(0);
      // Extra harshness: add some high-frequency noise on top
      for (let i = 0; i < data.length; i++) {
        const t = i / sr;
        const env = Math.min(1, t * 100) * Math.max(0, 1 - (t - duration + 0.05) * 20);
        data[i] += (Math.random() * 2 - 1) * 0.3 * env;
      }
      this._normalize(data, 0.95);

      const audio = new THREE.Audio(this.listener);
      audio.setBuffer(buf);
      audio.setLoop(false);
      audio.setVolume(0.9); // LOUD for jump scare
      this.sounds['cat-yowl'] = audio;
    }

    // ------ door-creak (slow frequency sweep with vibrato) ------
    {
      const duration = 0.8;
      const length = Math.ceil(duration * sr);
      const buf = this.audioContext.createBuffer(1, length, sr);
      const data = buf.getChannelData(0);
      for (let i = 0; i < length; i++) {
        const t = i / sr;
        const baseFreq = 100 + (400 - 100) * (t / duration);
        // Add slight vibrato (6Hz wobble, +/- 15Hz)
        const vibrato = 15 * Math.sin(2 * Math.PI * 6 * t);
        const freq = baseFreq + vibrato;
        const env = Math.min(1, t * 10) * Math.max(0, 1 - (t - duration + 0.15) * 7);
        data[i] = Math.sin(2 * Math.PI * freq * t) * env;
      }
      this._normalize(data, 0.6);

      const audio = new THREE.Audio(this.listener);
      audio.setBuffer(buf);
      audio.setLoop(false);
      audio.setVolume(0.35);
      this.sounds['door-creak'] = audio;
    }
  }

  // -----------------------------------------------------------------------
  //  Utility
  // -----------------------------------------------------------------------

  /**
   * Normalize sample data in-place to a target peak amplitude.
   */
  _normalize(data, targetPeak) {
    let max = 0;
    for (let i = 0; i < data.length; i++) {
      const abs = Math.abs(data[i]);
      if (abs > max) max = abs;
    }
    if (max === 0) return;
    const scale = targetPeak / max;
    for (let i = 0; i < data.length; i++) {
      data[i] *= scale;
    }
  }

  // -----------------------------------------------------------------------
  //  Public API
  // -----------------------------------------------------------------------

  /**
   * Play a sound by name.  If the sound is already playing it will be
   * stopped and restarted so that rapid-fire triggers (footsteps) work.
   */
  play(name) {
    const sound = this.sounds[name];
    if (!sound) return;
    if (sound.isPlaying) {
      sound.stop();
    }
    sound.play();
  }

  /**
   * Stop a (looping) sound by name.
   */
  stop(name) {
    const sound = this.sounds[name];
    if (!sound) return;
    if (sound.isPlaying) {
      sound.stop();
    }
  }

  /**
   * Adjust the volume of a sound.
   */
  setVolume(name, vol) {
    const sound = this.sounds[name];
    if (!sound) return;
    sound.setVolume(vol);
  }

  /**
   * Play the footstep sound matching the current floor type.
   * Falls back to 'tile' if the floor type is unknown.
   */
  playFootstep(floorType) {
    const name = `footstep-${floorType}`;
    if (this.sounds[name]) {
      this.play(name);
    } else {
      this.play('footstep-tile');
    }
  }

  /**
   * Manage the positional cat growl.
   *
   * @param {boolean} isActive  - true when the cat is stalking
   * @param {THREE.Vector3|null} catPosition - world position of the cat
   */
  updateCatGrowl(isActive, catPosition) {
    const growl = this.sounds['cat-growl'];
    if (!growl) return;

    if (isActive && catPosition) {
      // Move the positional audio anchor to the cat's position
      this._growlAnchor.position.copy(catPosition);

      if (!growl.isPlaying) {
        growl.play();
        this._growlActive = true;
      }
    } else {
      if (growl.isPlaying) {
        growl.stop();
        this._growlActive = false;
      }
    }
  }
}
