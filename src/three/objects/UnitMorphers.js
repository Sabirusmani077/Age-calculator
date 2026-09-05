/**
 * UnitMorphers.js
 * 3D crystal data modules representing temporal units (Years, Months, Days, Hours, Minutes, Seconds)
 * that morph, unfold, and rearrange dynamically as the user scrolls into Section 4.
 */

import * as THREE from 'three';

export class UnitMorphers {
  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'UnitMorphers';

    this.units = [
      { name: 'YEARS', color: 0x00f2fe, icon: 'YR' },
      { name: 'MONTHS', color: 0x4facfe, icon: 'MO' },
      { name: 'DAYS', color: 0x00c6ff, icon: 'DY' },
      { name: 'HOURS', color: 0x38ef7d, icon: 'HR' },
      { name: 'MINUTES', color: 0xffd200, icon: 'MN' },
      { name: 'SECONDS', color: 0xff2a7a, icon: 'SC' }
    ];

    this.crystals = [];
    this.createCrystals();

    this.group.position.set(0, 0, -4);
  }

  createCrystalTexture(unit) {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#060f22';
    ctx.fillRect(0, 0, 256, 256);

    ctx.strokeStyle = `#${unit.color.toString(16).padStart(6, '0')}`;
    ctx.lineWidth = 6;
    ctx.strokeRect(10, 10, 236, 236);

    ctx.fillStyle = '#ffffff';
    ctx.font = '800 64px "Outfit", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(unit.icon, 128, 100);

    ctx.fillStyle = `#${unit.color.toString(16).padStart(6, '0')}`;
    ctx.font = '700 24px "JetBrains Mono", monospace';
    ctx.fillText(unit.name, 128, 175);

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }

  createCrystals() {
    // Hexagonal beveled prism geometry
    const geo = new THREE.CylinderGeometry(0.7, 0.7, 0.25, 6);
    geo.rotateX(Math.PI / 2);

    this.units.forEach((unit, idx) => {
      const texture = this.createCrystalTexture(unit);

      const mat = [
        new THREE.MeshStandardMaterial({
          color: 0x0b172a,
          metalness: 0.8,
          roughness: 0.2
        }),
        new THREE.MeshStandardMaterial({
          map: texture,
          emissiveMap: texture,
          emissive: unit.color,
          emissiveIntensity: 0.4,
          metalness: 0.5,
          roughness: 0.2
        }),
        new THREE.MeshStandardMaterial({
          color: 0x0b172a,
          metalness: 0.8,
          roughness: 0.2
        })
      ];

      const mesh = new THREE.Mesh(geo, mat);

      // Glowing edge wireframe
      const wireGeo = new THREE.EdgesGeometry(geo);
      const wireMat = new THREE.LineBasicMaterial({
        color: unit.color,
        linewidth: 2
      });
      const wireframe = new THREE.LineSegments(wireGeo, wireMat);
      mesh.add(wireframe);

      this.crystals.push({
        mesh,
        unit,
        index: idx,
        origColor: unit.color
      });

      this.group.add(mesh);
    });
  }

  update(time, scrollProgress, scrollVelocity, mouse) {
    // Morphing positions:
    // When scrollProgress is in 0.70 to 0.92 (Units Section):
    // Crystals unfold from a tight cluster into an expansive elliptical orbital constellation
    const isSectionActive = scrollProgress > 0.65;
    const sectionT = Math.max(0, Math.min(1, (scrollProgress - 0.70) / 0.18));

    this.crystals.forEach((c, idx) => {
      const mesh = c.mesh;
      const count = this.crystals.length;

      // State A (Stacked/Clustered behind scene)
      const stackX = (idx - count / 2) * 0.4;
      const stackY = -3.0;
      const stackZ = -8.0;

      // State B (Expanded Orbital Hexagon / Arc)
      const angle = (idx / count) * Math.PI * 2 + time * 0.3;
      const arcRadiusX = 4.2;
      const arcRadiusY = 2.4;
      const orbitX = Math.cos(angle) * arcRadiusX;
      const orbitY = Math.sin(angle) * arcRadiusY;
      const orbitZ = Math.sin(angle * 2) * 1.2 + 0.5;

      // State C (Final Settle around MDK finale)
      const finalAngle = (idx / count) * Math.PI * 2;
      const finalX = Math.cos(finalAngle) * 5.0;
      const finalY = Math.sin(finalAngle) * 3.0;
      const finalZ = -2.0;

      if (scrollProgress < 0.70) {
        // Dormant
        mesh.position.x = stackX;
        mesh.position.y = stackY;
        mesh.position.z = stackZ;
        mesh.scale.setScalar(0.01);
      } else if (scrollProgress < 0.90) {
        // Active morphing & cascading pulses
        const t = (scrollProgress - 0.70) / 0.20;
        mesh.position.x = THREE.MathUtils.lerp(stackX, orbitX, t) + mouse.x * 0.3;
        mesh.position.y = THREE.MathUtils.lerp(stackY, orbitY, t) - mouse.y * 0.3;
        mesh.position.z = THREE.MathUtils.lerp(stackZ, orbitZ, t);
        mesh.scale.setScalar(THREE.MathUtils.lerp(0.01, 1.0, Math.min(1, t * 2)));

        mesh.rotation.y = angle + time * 0.5;
        mesh.rotation.x = Math.sin(time * 2 + idx) * 0.2;
      } else {
        // Final calm constellation
        const t = (scrollProgress - 0.90) / 0.10;
        mesh.position.x = THREE.MathUtils.lerp(orbitX, finalX, t);
        mesh.position.y = THREE.MathUtils.lerp(orbitY, finalY, t);
        mesh.position.z = THREE.MathUtils.lerp(orbitZ, finalZ, t);
        mesh.scale.setScalar(THREE.MathUtils.lerp(1.0, 0.75, t));

        mesh.rotation.y = finalAngle;
        mesh.rotation.x = 0;
      }
    });
  }
}
