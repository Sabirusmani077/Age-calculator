/**
 * CalendarLeaves.js
 * 3D Calendar leaves that fan out, peel, and flip through time along 3D curves
 * as the user scrolls from Calculator into Age Result and Birthday Countdown.
 */

import * as THREE from 'three';

export class CalendarLeaves {
  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'CalendarLeaves';

    this.leaves = [];
    this.createLeaves();

    this.group.position.set(-3.5, 0.5, 0);
    this.group.scale.setScalar(0.85);
  }

  createPageTexture(monthName, dayNum, tag = 'CHRONO') {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 640;
    const ctx = canvas.getContext('2d');

    // Card background - luxury cream parchment
    ctx.fillStyle = '#fdfbf7';
    ctx.roundRect(10, 10, 492, 620, 24);
    ctx.fill();

    // Glowing warm gold border
    ctx.strokeStyle = '#c59b27';
    ctx.lineWidth = 6;
    ctx.shadowColor = 'rgba(197, 155, 39, 0.4)';
    ctx.shadowBlur = 12;
    ctx.roundRect(10, 10, 492, 620, 24);
    ctx.stroke();

    // Header bar
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(197, 155, 39, 0.15)';
    ctx.roundRect(16, 16, 480, 140, [20, 20, 0, 0]);
    ctx.fill();

    // Month text
    ctx.fillStyle = '#1f1a16';
    ctx.font = '800 48px "Outfit", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(monthName, 256, 95);

    // Tag badge
    ctx.fillStyle = '#8c6310';
    ctx.font = '700 24px "JetBrains Mono", monospace';
    ctx.fillText(tag, 256, 132);

    // Day number
    ctx.fillStyle = '#1f1a16';
    ctx.font = '900 180px "Outfit", sans-serif';
    ctx.shadowColor = 'rgba(197, 155, 39, 0.3)';
    ctx.shadowBlur = 15;
    ctx.fillText(dayNum, 256, 390);

    // Mini calendar grid dots
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(90, 70, 50, 0.25)';
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 7; col++) {
        ctx.beginPath();
        ctx.arc(100 + col * 52, 490 + row * 38, 5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.anisotropy = 4;
    return texture;
  }

  createLeaves() {
    const pageData = [
      { month: 'YEARS', day: '25', tag: 'TIME LAPSE' },
      { month: 'MONTHS', day: '300', tag: 'ACCUMULATED' },
      { month: 'DAYS', day: '9,125', tag: 'JOURNEY' },
      { month: 'BIRTHDAY', day: 'SOON', tag: 'CELEBRATION' }
    ];

    const cardGeo = new THREE.BoxGeometry(1.6, 2.0, 0.04);

    pageData.forEach((data, index) => {
      const texture = this.createPageTexture(data.month, data.day, data.tag);
      const materials = [
        new THREE.MeshStandardMaterial({ color: 0xf4eee2, metalness: 0.2, roughness: 0.4 }),
        new THREE.MeshStandardMaterial({ color: 0xf4eee2, metalness: 0.2, roughness: 0.4 }),
        new THREE.MeshStandardMaterial({ color: 0xf4eee2, metalness: 0.2, roughness: 0.4 }),
        new THREE.MeshStandardMaterial({ color: 0xf4eee2, metalness: 0.2, roughness: 0.4 }),
        new THREE.MeshStandardMaterial({
          map: texture,
          emissiveMap: texture,
          emissive: 0xffffff,
          emissiveIntensity: 0.2,
          metalness: 0.2,
          roughness: 0.3
        }),
        new THREE.MeshStandardMaterial({ color: 0xf0e8d8, metalness: 0.2, roughness: 0.4 })
      ];

      const leaf = new THREE.Mesh(cardGeo, materials);
      leaf.position.z = index * 0.08;
      this.leaves.push({
        mesh: leaf,
        baseIndex: index,
        texture: texture
      });
      this.group.add(leaf);
    });
  }

  updateData(dayStr, monthStr, nextBdayStr) {
    if (this.leaves[0]) {
      this.leaves[0].mesh.material[4].map = this.createPageTexture(monthStr || 'PAST', dayStr || '01', 'BIRTHDATE');
      this.leaves[0].mesh.material[4].needsUpdate = true;
    }
    if (this.leaves[3]) {
      this.leaves[3].mesh.material[4].map = this.createPageTexture('NEXT BDAY', nextBdayStr || 'SOON', 'COUNTDOWN');
      this.leaves[3].mesh.material[4].needsUpdate = true;
    }
  }

  update(time, scrollProgress, scrollVelocity, mouse) {
    // Fan out / flip pages based on scroll progress:
    // When scrollProgress is around 0.2 to 0.7, the pages peel and flutter through space!
    this.leaves.forEach((leafObj, i) => {
      const mesh = leafObj.mesh;
      const progressOffset = Math.max(0, Math.min(1, (scrollProgress - 0.2 - i * 0.08) / 0.35));

      // Fan out in an arc
      const fanAngle = progressOffset * (Math.PI * 0.45 * (i + 1) * 0.4);
      const fanY = Math.sin(progressOffset * Math.PI) * (i * 0.6 + 0.3);
      const fanX = Math.cos(progressOffset * Math.PI * 0.5) * (i * 0.4);

      mesh.rotation.y = fanAngle + mouse.x * 0.15;
      mesh.rotation.x = Math.sin(time * 2 + i) * 0.06 - mouse.y * 0.15;
      mesh.rotation.z = Math.sin(progressOffset * Math.PI) * 0.2 * (i % 2 === 0 ? 1 : -1);

      mesh.position.x = fanX;
      mesh.position.y = fanY;
      mesh.position.z = (i * 0.08) + progressOffset * 1.5;
    });

    // Overall group position
    if (scrollProgress < 0.25) {
      const t = scrollProgress / 0.25;
      this.group.position.x = THREE.MathUtils.lerp(-4.5, -3.2, t);
      this.group.position.y = THREE.MathUtils.lerp(-0.5, 0.4, t);
      this.group.position.z = THREE.MathUtils.lerp(-2.0, 0.5, t);
    } else if (scrollProgress < 0.65) {
      const t = (scrollProgress - 0.25) / 0.4;
      this.group.position.x = THREE.MathUtils.lerp(-3.2, -3.8, t);
      this.group.position.y = THREE.MathUtils.lerp(0.4, 0.1, t);
      this.group.position.z = THREE.MathUtils.lerp(0.5, 1.2, t);
    } else {
      const t = (scrollProgress - 0.65) / 0.35;
      this.group.position.x = THREE.MathUtils.lerp(-3.8, -5.5, t);
      this.group.position.y = THREE.MathUtils.lerp(0.1, -1.5, t);
      this.group.position.z = THREE.MathUtils.lerp(1.2, -4.0, t);
    }
  }
}
