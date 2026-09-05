/**
 * MDKMonolith.js
 * Procedural 3D MDK Centerpiece: faceted metallic monolith with cybernetic rings,
 * glowing core, dynamic emissive textures, and scroll-driven transformations.
 */

import * as THREE from 'three';

export class MDKMonolith {
  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'MDKMonolith';

    this.createCore();
    this.createOuterShell();
    this.createOrbitRings();
    this.createEmblemTexture();
  }

  createEmblemTexture() {
    // Canvas texture for luxury cream & champagne gold MDK branding
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#fbf9f5';
    ctx.fillRect(0, 0, 512, 512);

    // Glowing border ring
    ctx.strokeStyle = '#c59b27';
    ctx.lineWidth = 12;
    ctx.beginPath();
    ctx.arc(256, 256, 230, 0, Math.PI * 2);
    ctx.stroke();

    // Secondary ring
    ctx.strokeStyle = 'rgba(197, 155, 39, 0.4)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(256, 256, 200, 0, Math.PI * 2);
    ctx.stroke();

    // Text MDK
    ctx.fillStyle = '#1f1a16';
    ctx.font = '900 130px "Outfit", "Inter", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(197, 155, 39, 0.4)';
    ctx.shadowBlur = 15;
    ctx.fillText('MDK', 256, 236);

    ctx.fillStyle = '#8c6310';
    ctx.font = '700 32px "JetBrains Mono", monospace';
    ctx.shadowBlur = 8;
    ctx.fillText('CHRONO LABS', 256, 320);

    const texture = new THREE.CanvasTexture(canvas);
    texture.anisotropy = 8;
    this.emblemTexture = texture;
  }

  createCore() {
    // Glowing warm golden amber prism
    const geo = new THREE.OctahedronGeometry(1.6, 1);
    const mat = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      emissive: 0xffaa00,
      emissiveIntensity: 1.4,
      roughness: 0.2,
      metalness: 0.8,
      wireframe: true
    });
    this.innerCore = new THREE.Mesh(geo, mat);
    this.group.add(this.innerCore);

    // Inner warm glowing aura
    const sphereGeo = new THREE.SphereGeometry(0.8, 24, 24);
    const sphereMat = new THREE.MeshBasicMaterial({
      color: 0xffd275,
      transparent: true,
      opacity: 0.65
    });
    this.innerGlow = new THREE.Mesh(sphereGeo, sphereMat);
    this.group.add(this.innerGlow);
  }

  createOuterShell() {
    // Faceted pearlescent ivory crystal
    const geo = new THREE.IcosahedronGeometry(2.4, 0);
    const mat = new THREE.MeshPhysicalMaterial({
      color: 0xfaf4e8,
      emissive: 0xd4af37,
      emissiveIntensity: 0.15,
      metalness: 0.35,
      roughness: 0.18,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
      reflectivity: 0.9,
      transparent: true,
      opacity: 0.85,
      side: THREE.DoubleSide
    });
    this.outerShell = new THREE.Mesh(geo, mat);
    this.group.add(this.outerShell);

    // Front MDK disc emblem badge
    const badgeGeo = new THREE.CylinderGeometry(1.2, 1.2, 0.12, 48);
    badgeGeo.rotateX(Math.PI / 2);
    const badgeMat = [
      new THREE.MeshStandardMaterial({ color: 0xf5eee1, metalness: 0.4, roughness: 0.3 }),
      new THREE.MeshStandardMaterial({
        map: this.emblemTexture,
        emissiveMap: this.emblemTexture,
        emissive: 0xffffff,
        emissiveIntensity: 0.3,
        metalness: 0.3,
        roughness: 0.2
      }),
      new THREE.MeshStandardMaterial({ color: 0xf5eee1, metalness: 0.4, roughness: 0.3 })
    ];
    this.badge = new THREE.Mesh(badgeGeo, badgeMat);
    this.badge.position.z = 2.45;
    this.group.add(this.badge);
  }

  createOrbitRings() {
    this.rings = [];
    const ringConfigs = [
      { radius: 3.2, tube: 0.035, color: 0xd4af37, rotSpeed: 0.8 },
      { radius: 3.8, tube: 0.025, color: 0xc59b27, rotSpeed: -0.6 },
      { radius: 4.4, tube: 0.04, color: 0xe0a96d, rotSpeed: 0.4 }
    ];

    ringConfigs.forEach((cfg, idx) => {
      const geo = new THREE.TorusGeometry(cfg.radius, cfg.tube, 16, 100);
      const mat = new THREE.MeshStandardMaterial({
        color: cfg.color,
        emissive: cfg.color,
        emissiveIntensity: 0.9,
        metalness: 0.8,
        roughness: 0.2
      });
      const ring = new THREE.Mesh(geo, mat);
      ring.rotation.x = Math.PI * 0.25 * (idx + 1);
      ring.rotation.y = Math.PI * 0.15 * (idx + 1);
      this.rings.push({ mesh: ring, speed: cfg.rotSpeed });
      this.group.add(ring);
    });
  }

  /**
   * Update called every frame with scroll progress and time.
   * @param {number} time - continuous elapsed time in seconds
   * @param {number} scrollProgress - 0.0 to 1.0 damped progress
   * @param {number} scrollVelocity - scroll speed
   * @param {Object} mouse - damped mouse {x, y}
   */
  update(time, scrollProgress, scrollVelocity, mouse) {
    // Base gentle rotation
    this.innerCore.rotation.x = time * 0.4 + scrollProgress * 4;
    this.innerCore.rotation.y = time * 0.6 + scrollProgress * 6;

    // Outer shell rotation directly responsive to scroll
    this.outerShell.rotation.y = scrollProgress * Math.PI * 3 + mouse.x * 0.3;
    this.outerShell.rotation.x = Math.sin(time * 0.5) * 0.15 + mouse.y * 0.2;

    // Rings rotation
    this.rings.forEach((r, idx) => {
      r.mesh.rotation.z += r.speed * 0.015 + scrollVelocity * 0.02;
      r.mesh.rotation.x += r.speed * 0.01;
    });

    // Positioning and scaling across scroll progress:
    // 0% -> Hero: Center, large, proud
    // 20% -> Calculator: Dollies back-right slightly to frame the input form
    // 40% -> Age Result: Elevates upward like an oracle
    // 80% -> Units: Orbits in the background
    // 100% -> Finale: Grand center focal point, glowing brightly
    if (scrollProgress < 0.25) {
      const t = Math.max(0, scrollProgress) / 0.25;
      this.group.position.x = THREE.MathUtils.lerp(0, 4.5, t);
      this.group.position.y = THREE.MathUtils.lerp(0, 0.5, t);
      this.group.position.z = THREE.MathUtils.lerp(-1.8, -3.5, t);
      this.group.scale.setScalar(THREE.MathUtils.lerp(0.95, 0.85, t));
    } else if (scrollProgress < 0.65) {
      const t = (scrollProgress - 0.25) / 0.4;
      this.group.position.x = THREE.MathUtils.lerp(4.5, -5.0, t);
      this.group.position.y = THREE.MathUtils.lerp(0.5, 2.8, t);
      this.group.position.z = THREE.MathUtils.lerp(-3.5, -6.0, t);
      this.group.scale.setScalar(THREE.MathUtils.lerp(0.85, 0.7, t));
    } else if (scrollProgress < 0.85) {
      const t = (scrollProgress - 0.65) / 0.2;
      this.group.position.x = THREE.MathUtils.lerp(-5.0, 0, t);
      this.group.position.y = THREE.MathUtils.lerp(2.8, 3.5, t);
      this.group.position.z = THREE.MathUtils.lerp(-6.0, -8.0, t);
      this.group.scale.setScalar(THREE.MathUtils.lerp(0.7, 0.9, t));
    } else {
      // 85% to 100% - Grand Finale alignment
      const t = (scrollProgress - 0.85) / 0.15;
      this.group.position.x = THREE.MathUtils.lerp(0, 0, t);
      this.group.position.y = THREE.MathUtils.lerp(3.5, 0.2, t);
      this.group.position.z = THREE.MathUtils.lerp(-8.0, -0.5, t);
      this.group.scale.setScalar(THREE.MathUtils.lerp(0.9, 1.4, t));
      // Face forward for the final reveal
      this.group.rotation.y = THREE.MathUtils.lerp(this.group.rotation.y, 0, 0.05);
      this.group.rotation.x = THREE.MathUtils.lerp(this.group.rotation.x, 0, 0.05);
    }

    // Dynamic core pulse
    const pulse = 1.0 + Math.sin(time * 3) * 0.2 + Math.abs(scrollVelocity) * 0.5;
    this.innerCore.scale.setScalar(pulse);
  }
}
