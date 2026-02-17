import * as THREE from 'three';

export class LightingManager {
  constructor(scene) {
    this.scene = scene;
    this.lights = [];
    this.flickerLights = [];

    // Very dim ambient — creates spooky base
    this.ambient = new THREE.AmbientLight(0x111122, 0.3);
    scene.add(this.ambient);
  }

  /**
   * Add a point light to a room.
   * @param {THREE.Vector3} position - World position of the light
   * @param {number} color - Hex color
   * @param {number} intensity - Light intensity
   * @param {boolean} flicker - Whether the light should flicker
   * @returns {THREE.PointLight}
   */
  addRoomLight(position, color, intensity, flicker = false) {
    const light = new THREE.PointLight(color, intensity, 15);
    light.position.copy(position);
    light.castShadow = true;
    light.shadow.mapSize.width = 512;
    light.shadow.mapSize.height = 512;
    this.scene.add(light);
    this.lights.push(light);

    if (flicker) {
      this.flickerLights.push({ light, baseIntensity: intensity, timer: 0 });
    }

    return light;
  }

  /**
   * Update flickering lights each frame.
   * @param {number} delta - Time since last frame in seconds
   */
  update(delta) {
    for (const f of this.flickerLights) {
      f.timer += delta;

      // 5% chance per frame: randomize intensity between 0.3x and 1.0x of base
      if (Math.random() < 0.05) {
        f.light.intensity = f.baseIntensity * (0.3 + Math.random() * 0.7);
      }

      // 0.5% chance per frame: go fully dark momentarily
      if (Math.random() < 0.005) {
        f.light.intensity = 0;
      }

      // Otherwise, slowly drift back toward base intensity
      if (Math.random() >= 0.05) {
        f.light.intensity += (f.baseIntensity - f.light.intensity) * delta * 2;
      }
    }
  }
}
