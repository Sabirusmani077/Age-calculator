/**
 * FloatingNumbers.js
 * 3D floating temporal numerals and mathematical glyphs drifting through z-space
 * with dynamic particle trails and velocity-responsive warp streaks.
 */

import * as THREE from 'three';

export class FloatingNumbers {
  constructor(count = 35) {
    this.group = new THREE.Group();
    this.group.name = 'FloatingNumbers';

    this.count = count;
    this.items = [];
    this.symbols = ['0', '1', '2', '3', '4', '5', '7', '8', '9', '24', '60', '365', '∞', 'Δ', 'Σ'];

    this.createNumberMeshes();
    this.createParticleTrails();
  }

  createGlyphTexture(glyph) {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, 128, 128);

    // Glowing circle backing
    ctx.fillStyle = 'rgba(6, 15, 35, 0.7)';
    ctx.beginPath();
    ctx.arc(64, 64, 56, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(0, 242, 254, 0.6)';
    ctx.lineWidth = 4;
    ctx.stroke();

    // Text glyph
    ctx.fillStyle = '#ffffff';
    ctx.font = '800 48px "Outfit", "JetBrains Mono", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = '#00f2fe';
    ctx.shadowBlur = 12;
    ctx.fillText(glyph, 64, 66);

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }

  createNumberMeshes() {
    const planeGeo = new THREE.PlaneGeometry(0.75, 0.75);

    for (let i = 0; i < this.count; i++) {
      const glyph = this.symbols[i % this.symbols.length];
      const texture = this.createGlyphTexture(glyph);

      const mat = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        opacity: 0.8,
        side: THREE.DoubleSide,
        depthWrite: false
      });

      const mesh = new THREE.Mesh(planeGeo, mat);

      // Random 3D spatial distribution around the camera path
      const basePos = new THREE.Vector3(
        (Math.random() - 0.5) * 16,
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 20 - 2
      );

      mesh.position.copy(basePos);
      mesh.rotation.z = (Math.random() - 0.5) * 0.4;

      this.items.push({
        mesh,
        basePos,
        speed: 0.2 + Math.random() * 0.6,
        phase: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.5
      });

      this.group.add(mesh);
    }
  }

  createParticleTrails() {
    const trailCount = 180;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(trailCount * 3);
    const colors = new Float32Array(trailCount * 3);

    for (let i = 0; i < trailCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 20;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 14;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 25;

      const isCyan = Math.random() > 0.4;
      colors[i * 3] = isCyan ? 0.0 : 1.0;
      colors[i * 3 + 1] = isCyan ? 0.95 : 0.8;
      colors[i * 3 + 2] = isCyan ? 1.0 : 0.2;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 0.12,
      vertexColors: true,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending
    });

    this.particles = new THREE.Points(geometry, material);
    this.group.add(this.particles);
  }

  update(time, scrollProgress, scrollVelocity, mouse) {
    const warpBoost = Math.abs(scrollVelocity) * 3.5;

    // Update floating numbers
    this.items.forEach((item, index) => {
      const mesh = item.mesh;

      // Harmonic 3D drift
      mesh.position.y = item.basePos.y + Math.sin(time * item.speed + item.phase) * 0.6;
      mesh.position.x = item.basePos.x + Math.cos(time * item.speed * 0.7 + item.phase) * 0.4 + mouse.x * 0.5;

      // Z travel responsive to scroll
      const zOffset = (scrollProgress * 25 + time * item.speed * 2) % 25;
      mesh.position.z = item.basePos.z + zOffset - (warpBoost * 0.5);

      // Subtle rotation
      mesh.rotation.z += item.rotSpeed * 0.01;
      mesh.rotation.y = mouse.x * 0.2;
      mesh.rotation.x = -mouse.y * 0.2;

      // Proximity cursor repulsion
      const distToMouse = Math.hypot(mesh.position.x - mouse.x * 6, mesh.position.y - mouse.y * 4);
      if (distToMouse < 2.0) {
        mesh.position.x += (mesh.position.x - mouse.x * 6) * 0.05;
        mesh.position.y += (mesh.position.y - mouse.y * 4) * 0.05;
      }
    });

    // Particle streaks
    if (this.particles) {
      const positions = this.particles.geometry.attributes.position.array;
      const count = positions.length / 3;
      for (let i = 0; i < count; i++) {
        positions[i * 3 + 2] += (0.05 + warpBoost * 0.1);
        if (positions[i * 3 + 2] > 10) {
          positions[i * 3 + 2] = -15;
          positions[i * 3] = (Math.random() - 0.5) * 20;
          positions[i * 3 + 1] = (Math.random() - 0.5) * 14;
        }
      }
      this.particles.geometry.attributes.position.needsUpdate = true;
    }
  }
}
