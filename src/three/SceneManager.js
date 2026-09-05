/**
 * SceneManager.js
 * Master 3D WebGL Scene Director. Orchestrates the camera spline, lighting changes,
 * background starfields, and integrates MDKMonolith, ClockMechanism,
 * CalendarLeaves, FloatingNumbers, and UnitMorphers.
 */

import * as THREE from 'three';
import { MDKMonolith } from './objects/MDKMonolith.js';
import { ClockMechanism } from './objects/ClockMechanism.js';
import { CalendarLeaves } from './objects/CalendarLeaves.js';
import { FloatingNumbers } from './objects/FloatingNumbers.js';
import { UnitMorphers } from './objects/UnitMorphers.js';

export class SceneManager {
  constructor(canvas) {
    this.canvas = canvas;
    this.isReducedMotion = false;
    this.isMobile = window.innerWidth < 768;

    this.initRenderer();
    this.initScene();
    this.initCamera();
    this.initLights();
    this.initBackgroundCosmos();
    this.initObjects();

    this.onResize = this.onResize.bind(this);
    window.addEventListener('resize', this.onResize, { passive: true });
  }

  initRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: !this.isMobile,
      alpha: true,
      powerPreference: 'high-performance',
      stencil: false
    });

    const maxDpr = this.isMobile ? 1.5 : 2.0;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, maxDpr));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
  }

  initScene() {
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0xf5eedf, 0.025);
  }

  initCamera() {
    this.camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      100
    );
    this.camera.position.set(0, 0, 7.5);
    this.targetCameraPos = new THREE.Vector3(0, 0, 7.5);
    this.cameraLookTarget = new THREE.Vector3(0, 0, 0);
  }

  initLights() {
    // Warm ambient fill
    this.ambientLight = new THREE.AmbientLight(0xfff8ee, 2.5);
    this.scene.add(this.ambientLight);

    // Warm sunlit key light
    this.keyLight = new THREE.DirectionalLight(0xfffaed, 2.6);
    this.keyLight.position.set(5, 8, 5);
    this.scene.add(this.keyLight);

    // Dynamic Rim lights (Champagne Gold & Rose Bronze)
    this.rimLightCyan = new THREE.PointLight(0xd4af37, 3.2, 20);
    this.rimLightCyan.position.set(-6, 3, 2);
    this.scene.add(this.rimLightCyan);

    this.rimLightMagenta = new THREE.PointLight(0xe07a5f, 2.2, 20);
    this.rimLightMagenta.position.set(6, -2, -2);
    this.scene.add(this.rimLightMagenta);

    this.accentGold = new THREE.PointLight(0xffc048, 2.0, 15);
    this.accentGold.position.set(0, -4, 3);
    this.scene.add(this.accentGold);
  }

  initBackgroundCosmos() {
    // Warm golden stardust particle field
    const starCount = this.isMobile ? 250 : 600;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 45;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 35;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 35 - 5;

      const isGold = Math.random() > 0.4;
      colors[i * 3] = isGold ? 0.85 : 0.95;
      colors[i * 3 + 1] = isGold ? 0.70 : 0.88;
      colors[i * 3 + 2] = isGold ? 0.25 : 0.65;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 0.08,
      vertexColors: true,
      transparent: true,
      opacity: 0.45,
      blending: THREE.NormalBlending
    });

    this.cosmos = new THREE.Points(geometry, material);
    this.scene.add(this.cosmos);
  }

  initObjects() {
    // 1. MDK Centerpiece
    this.mdkMonolith = new MDKMonolith();
    this.scene.add(this.mdkMonolith.group);

    // 2. Mechanical Clock
    this.clockMechanism = new ClockMechanism();
    this.scene.add(this.clockMechanism.group);

    // 3. Calendar Pages
    this.calendarLeaves = new CalendarLeaves();
    this.scene.add(this.calendarLeaves.group);

    // 4. Floating Numbers & Particle Trails
    this.floatingNumbers = new FloatingNumbers(this.isMobile ? 20 : 35);
    this.scene.add(this.floatingNumbers.group);

    // 5. Unit Morphers
    this.unitMorphers = new UnitMorphers();
    this.scene.add(this.unitMorphers.group);
  }

  setReducedMotion(enabled) {
    this.isReducedMotion = enabled;
  }

  onResize() {
    this.isMobile = window.innerWidth < 768;
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();

    const maxDpr = this.isMobile ? 1.5 : 2.0;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, maxDpr));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  /**
   * Updates camera dolly, lighting, and all 3D objects.
   */
  update(time, scrollProgress, scrollVelocity, mouse) {
    // Camera Dolly Path across scroll progress (0.0 to 1.0)
    // 0.0 -> Hero: centered panoramic view
    // 0.25 -> Calculator: subtle dolly forward & right shift
    // 0.50 -> Age Result: focus on celebratory center-left
    // 0.75 -> Birthday Countdown: orbit high elevation
    // 1.00 -> Finale: majestic frontal centerpiece
    if (this.isReducedMotion) {
      this.targetCameraPos.set(0, 0, 7.5);
      this.cameraLookTarget.set(0, 0, 0);
    } else {
      if (scrollProgress < 0.25) {
        const t = scrollProgress / 0.25;
        this.targetCameraPos.set(
          THREE.MathUtils.lerp(0, 0.4, t),
          THREE.MathUtils.lerp(0, -0.1, t),
          THREE.MathUtils.lerp(7.5, 6.2, t)
        );
        this.cameraLookTarget.set(0.1, 0, 0);
      } else if (scrollProgress < 0.55) {
        const t = (scrollProgress - 0.25) / 0.3;
        this.targetCameraPos.set(
          THREE.MathUtils.lerp(0.4, -0.3, t),
          THREE.MathUtils.lerp(-0.1, 0.2, t),
          THREE.MathUtils.lerp(6.2, 5.8, t)
        );
        this.cameraLookTarget.set(-0.1, 0.1, 0);
      } else if (scrollProgress < 0.8) {
        const t = (scrollProgress - 0.55) / 0.25;
        this.targetCameraPos.set(
          THREE.MathUtils.lerp(-0.3, 0.3, t),
          THREE.MathUtils.lerp(0.2, 0.5, t),
          THREE.MathUtils.lerp(5.8, 6.5, t)
        );
        this.cameraLookTarget.set(0, 0.1, 0);
      } else {
        const t = (scrollProgress - 0.8) / 0.2;
        this.targetCameraPos.set(
          THREE.MathUtils.lerp(0.3, 0, t),
          THREE.MathUtils.lerp(0.5, 0.1, t),
          THREE.MathUtils.lerp(6.5, 7.0, t)
        );
        this.cameraLookTarget.set(0, 0, 0);
      }

      // Add damped mouse parallax to camera position
      const parallaxX = mouse.x * 0.35;
      const parallaxY = -mouse.y * 0.25;

      this.camera.position.x = THREE.MathUtils.lerp(
        this.camera.position.x,
        this.targetCameraPos.x + parallaxX,
        0.12
      );
      this.camera.position.y = THREE.MathUtils.lerp(
        this.camera.position.y,
        this.targetCameraPos.y + parallaxY,
        0.12
      );
      this.camera.position.z = THREE.MathUtils.lerp(
        this.camera.position.z,
        this.targetCameraPos.z,
        0.12
      );

      this.camera.lookAt(this.cameraLookTarget);
    }

    // Dynamic lighting shifts according to scroll
    this.rimLightCyan.position.x = -6 + Math.sin(time * 0.5 + scrollProgress * 3) * 2;
    this.rimLightMagenta.position.y = -2 + Math.cos(time * 0.6 + scrollProgress * 4) * 2;
    this.accentGold.intensity = 1.5 + Math.sin(time * 2 + scrollProgress * 6) * 0.8;

    // Cosmos slow cosmic drift
    if (this.cosmos) {
      this.cosmos.rotation.y = time * 0.015 + scrollProgress * 0.2;
      this.cosmos.rotation.x = time * 0.008;
    }

    // Update child objects
    this.mdkMonolith.update(time, scrollProgress, scrollVelocity, mouse);
    this.clockMechanism.update(time, scrollProgress, scrollVelocity, mouse);
    this.calendarLeaves.update(time, scrollProgress, scrollVelocity, mouse);
    this.floatingNumbers.update(time, scrollProgress, scrollVelocity, mouse);
    this.unitMorphers.update(time, scrollProgress, scrollVelocity, mouse);

    // Render 3D Scene
    this.renderer.render(this.scene, this.camera);
  }

  snapCamera(scrollProgress) {
    if (this.isReducedMotion) {
      this.targetCameraPos.set(0, 0, 7.5);
      this.cameraLookTarget.set(0, 0, 0);
    } else {
      if (scrollProgress < 0.25) {
        const t = scrollProgress / 0.25;
        this.targetCameraPos.set(
          THREE.MathUtils.lerp(0, 0.4, t),
          THREE.MathUtils.lerp(0, -0.1, t),
          THREE.MathUtils.lerp(7.5, 6.2, t)
        );
        this.cameraLookTarget.set(0.1, 0, 0);
      } else if (scrollProgress < 0.55) {
        const t = (scrollProgress - 0.25) / 0.3;
        this.targetCameraPos.set(
          THREE.MathUtils.lerp(0.4, -0.3, t),
          THREE.MathUtils.lerp(-0.1, 0.2, t),
          THREE.MathUtils.lerp(6.2, 5.8, t)
        );
        this.cameraLookTarget.set(-0.1, 0.1, 0);
      } else if (scrollProgress < 0.8) {
        const t = (scrollProgress - 0.55) / 0.25;
        this.targetCameraPos.set(
          THREE.MathUtils.lerp(-0.3, 0.3, t),
          THREE.MathUtils.lerp(0.2, 0.5, t),
          THREE.MathUtils.lerp(5.8, 6.5, t)
        );
        this.cameraLookTarget.set(0, 0.1, 0);
      } else {
        const t = (scrollProgress - 0.8) / 0.2;
        this.targetCameraPos.set(
          THREE.MathUtils.lerp(0.3, 0, t),
          THREE.MathUtils.lerp(0.5, 0.1, t),
          THREE.MathUtils.lerp(6.5, 7.0, t)
        );
        this.cameraLookTarget.set(0, 0, 0);
      }
    }
    this.camera.position.copy(this.targetCameraPos);
    this.camera.lookAt(this.cameraLookTarget);
  }
}
