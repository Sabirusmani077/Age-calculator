/**
 * ChronoBot.js
 * The cute 3D AI mascot ("MDK Chrono-Bot").
 * Procedural body, magnetic floating ears & hands, hover thruster,
 * dynamic canvas-rendered LED eyes with emotional expressions,
 * and mouse look-at tracking.
 */

import * as THREE from 'three';

export class ChronoBot {
  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'ChronoBot';

    this.eyeState = 'curious'; // 'curious' | 'happy' | 'hearts' | 'stars' | 'scanning' | 'blink'
    this.blinkTimer = 0;
    this.nextBlinkTime = 3.0;

    this.initVisorCanvas();
    this.createBody();
    this.createHead();
    this.createVisor();
    this.createEars();
    this.createHands();
    this.createThruster();

    // Default position
    this.group.position.set(4.0, 1.2, 1.0);
    this.group.scale.setScalar(0.75);
  }

  initVisorCanvas() {
    this.canvas = document.createElement('canvas');
    this.canvas.width = 512;
    this.canvas.height = 256;
    this.ctx = this.canvas.getContext('2d');
    this.visorTexture = new THREE.CanvasTexture(this.canvas);
    this.visorTexture.anisotropy = 4;
    this.drawEyes(0, 0);
  }

  drawEyes(lookX = 0, lookY = 0) {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, 512, 256);

    // Deep OLED black visor background
    ctx.fillStyle = '#060a14';
    ctx.fillRect(0, 0, 512, 256);

    // Subtle visor scanlines
    ctx.fillStyle = 'rgba(0, 242, 254, 0.04)';
    for (let y = 0; y < 256; y += 8) {
      ctx.fillRect(0, y, 512, 3);
    }

    const eyeOffsetX = lookX * 30;
    const eyeOffsetY = lookY * 20;

    const leftCenter = { x: 170 + eyeOffsetX, y: 128 + eyeOffsetY };
    const rightCenter = { x: 342 + eyeOffsetX, y: 128 + eyeOffsetY };

    ctx.fillStyle = '#00f2fe';
    ctx.shadowColor = '#00f2fe';
    ctx.shadowBlur = 24;

    if (this.eyeState === 'blink') {
      // Eyelid line
      ctx.lineWidth = 10;
      ctx.strokeStyle = '#00f2fe';
      ctx.beginPath();
      ctx.moveTo(leftCenter.x - 40, leftCenter.y);
      ctx.lineTo(leftCenter.x + 40, leftCenter.y);
      ctx.moveTo(rightCenter.x - 40, rightCenter.y);
      ctx.lineTo(rightCenter.x + 40, rightCenter.y);
      ctx.stroke();
    } else if (this.eyeState === 'happy') {
      // Crescent happy arches ^ ^
      ctx.lineWidth = 14;
      ctx.strokeStyle = '#00f2fe';
      ctx.beginPath();
      ctx.arc(leftCenter.x, leftCenter.y + 15, 38, Math.PI * 1.15, Math.PI * 1.85);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(rightCenter.x, rightCenter.y + 15, 38, Math.PI * 1.15, Math.PI * 1.85);
      ctx.stroke();
    } else if (this.eyeState === 'hearts') {
      // Cute heart eyes for celebratory/age result
      const drawHeart = (cx, cy) => {
        ctx.beginPath();
        ctx.fillStyle = '#ff2a7a';
        ctx.shadowColor = '#ff2a7a';
        const d = 28;
        ctx.moveTo(cx, cy + d);
        ctx.bezierCurveTo(cx - d * 1.3, cy - d * 0.2, cx - d * 1.3, cy - d * 1.1, cx, cy - d * 0.5);
        ctx.bezierCurveTo(cx + d * 1.3, cy - d * 1.1, cx + d * 1.3, cy - d * 0.2, cx, cy + d);
        ctx.fill();
      };
      drawHeart(leftCenter.x, leftCenter.y);
      drawHeart(rightCenter.x, rightCenter.y);
    } else if (this.eyeState === 'stars') {
      // Star eyes
      const drawStar = (cx, cy) => {
        ctx.fillStyle = '#ffd200';
        ctx.shadowColor = '#ffd200';
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
          ctx.lineTo(
            Math.cos((18 + i * 72) * 0.01745) * 38 + cx,
            -Math.sin((18 + i * 72) * 0.01745) * 38 + cy
          );
          ctx.lineTo(
            Math.cos((54 + i * 72) * 0.01745) * 18 + cx,
            -Math.sin((54 + i * 72) * 0.01745) * 18 + cy
          );
        }
        ctx.closePath();
        ctx.fill();
      };
      drawStar(leftCenter.x, leftCenter.y);
      drawStar(rightCenter.x, rightCenter.y);
    } else {
      // Default: Curious rounded capsule eyes
      const drawCuriousEye = (cx, cy) => {
        ctx.beginPath();
        ctx.roundRect(cx - 36, cy - 50, 72, 100, 36);
        ctx.fill();

        // Eye highlight shine
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(cx + 12, cy - 22, 12, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#00f2fe';
      };
      drawCuriousEye(leftCenter.x, leftCenter.y);
      drawCuriousEye(rightCenter.x, rightCenter.y);
    }

    this.visorTexture.needsUpdate = true;
  }

  createBody() {
    // Pearlescent white/silver porcelain capsule
    const bodyGeo = new THREE.CapsuleGeometry(1.0, 1.2, 32, 32);
    const bodyMat = new THREE.MeshPhysicalMaterial({
      color: 0xf5f8ff,
      metalness: 0.2,
      roughness: 0.15,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
      reflectivity: 0.8
    });
    this.body = new THREE.Mesh(bodyGeo, bodyMat);
    this.body.position.y = 0;
    this.group.add(this.body);

    // Chest glowing status ring
    const ringGeo = new THREE.TorusGeometry(0.35, 0.05, 16, 32);
    const ringMat = new THREE.MeshStandardMaterial({
      color: 0x00f2fe,
      emissive: 0x00f2fe,
      emissiveIntensity: 1.2
    });
    const chestRing = new THREE.Mesh(ringGeo, ringMat);
    chestRing.position.set(0, -0.4, 0.98);
    this.group.add(chestRing);
  }

  createHead() {
    this.head = new THREE.Group();
    this.head.position.set(0, 0.9, 0);
    this.group.add(this.head);
  }

  createVisor() {
    // Curved glossy black visor
    const visorGeo = new THREE.CylinderGeometry(0.92, 0.92, 0.85, 32, 1, false, -Math.PI * 0.45, Math.PI * 0.9);
    const visorMat = new THREE.MeshStandardMaterial({
      map: this.visorTexture,
      emissiveMap: this.visorTexture,
      emissive: 0xffffff,
      emissiveIntensity: 1.0,
      roughness: 0.1,
      metalness: 0.5
    });
    this.visor = new THREE.Mesh(visorGeo, visorMat);
    this.visor.rotation.y = Math.PI;
    this.visor.position.set(0, 0.25, 0.25);
    this.group.add(this.visor);
  }

  createEars() {
    this.ears = [];
    const earGeo = new THREE.ConeGeometry(0.25, 0.8, 16);
    earGeo.rotateX(-Math.PI * 0.1);
    const earMat = new THREE.MeshPhysicalMaterial({
      color: 0x00f2fe,
      emissive: 0x0055aa,
      metalness: 0.8,
      roughness: 0.2
    });

    const leftEar = new THREE.Mesh(earGeo, earMat);
    leftEar.position.set(-0.95, 1.2, 0);
    leftEar.rotation.z = 0.4;
    this.group.add(leftEar);
    this.ears.push(leftEar);

    const rightEar = new THREE.Mesh(earGeo, earMat);
    rightEar.position.set(0.95, 1.2, 0);
    rightEar.rotation.z = -0.4;
    this.group.add(rightEar);
    this.ears.push(rightEar);
  }

  createHands() {
    this.hands = [];
    const handGeo = new THREE.SphereGeometry(0.28, 24, 24);
    const handMat = new THREE.MeshPhysicalMaterial({
      color: 0x223355,
      metalness: 0.9,
      roughness: 0.2,
      clearcoat: 1.0
    });

    this.leftHand = new THREE.Mesh(handGeo, handMat);
    this.leftHand.position.set(-1.4, -0.2, 0.4);
    this.group.add(this.leftHand);
    this.hands.push(this.leftHand);

    this.rightHand = new THREE.Mesh(handGeo, handMat);
    this.rightHand.position.set(1.4, -0.2, 0.4);
    this.group.add(this.rightHand);
    this.hands.push(this.rightHand);
  }

  createThruster() {
    const thrusterGeo = new THREE.CylinderGeometry(0.5, 0.2, 0.4, 24);
    const thrusterMat = new THREE.MeshStandardMaterial({
      color: 0x111c30,
      metalness: 0.9,
      roughness: 0.2
    });
    this.thruster = new THREE.Mesh(thrusterGeo, thrusterMat);
    this.thruster.position.y = -1.25;
    this.group.add(this.thruster);

    // Glowing plasma flame
    const flameGeo = new THREE.ConeGeometry(0.32, 0.7, 16);
    flameGeo.rotateX(Math.PI);
    const flameMat = new THREE.MeshBasicMaterial({
      color: 0x00f2fe,
      transparent: true,
      opacity: 0.85
    });
    this.flame = new THREE.Mesh(flameGeo, flameMat);
    this.flame.position.y = -1.65;
    this.group.add(this.flame);
  }

  setEmotion(emotion) {
    if (this.eyeState !== emotion) {
      this.eyeState = emotion;
      this.drawEyes(0, 0);
    }
  }

  update(time, scrollProgress, scrollVelocity, mouse) {
    // Floating hover bobbing
    const hoverY = Math.sin(time * 2.8) * 0.15;
    const swayZ = Math.cos(time * 1.5) * 0.08;

    // Automatic blinking
    this.blinkTimer += 0.016;
    if (this.blinkTimer > this.nextBlinkTime) {
      const prev = this.eyeState;
      this.eyeState = 'blink';
      this.drawEyes(mouse.x, mouse.y);
      setTimeout(() => {
        if (this.eyeState === 'blink') {
          this.eyeState = prev;
          this.drawEyes(mouse.x, mouse.y);
        }
      }, 150);
      this.blinkTimer = 0;
      this.nextBlinkTime = 2.5 + Math.random() * 3.5;
    } else {
      // Redraw eyes tracking mouse slightly
      this.drawEyes(mouse.x, mouse.y);
    }

    // Ear twitching with physics
    this.ears[0].rotation.z = 0.35 + Math.sin(time * 3.5) * 0.08 + scrollVelocity * 0.1;
    this.ears[1].rotation.z = -0.35 - Math.sin(time * 3.5 + 0.5) * 0.08 - scrollVelocity * 0.1;

    // Hands floating motion
    this.leftHand.position.y = -0.2 + Math.sin(time * 2.5 + 1.0) * 0.1;
    this.rightHand.position.y = -0.2 + Math.sin(time * 2.5) * 0.1;

    // Flame flicker
    this.flame.scale.y = 1.0 + Math.sin(time * 20) * 0.3 + Math.abs(scrollVelocity) * 0.8;

    // Choreographed movement across the 5 scroll phases:
    // 0% - 20%: Hero stage -> hovering at top right, waving greeting
    // 20% - 40%: Calculator stage -> moves down close to the input card, inspecting
    // 40% - 65%: Age Result stage -> floating happily, celebrating with heart eyes
    // 65% - 85%: Birthday Countdown stage -> celebratory orbit, looking up
    // 85% - 100%: Units & Finale -> floats beside MDK monolith
    if (scrollProgress < 0.2) {
      const t = scrollProgress / 0.2;
      this.group.position.x = THREE.MathUtils.lerp(3.6, 3.2, t);
      this.group.position.y = THREE.MathUtils.lerp(1.2, 0.4, t) + hoverY;
      this.group.position.z = THREE.MathUtils.lerp(1.0, 1.8, t);
      this.setEmotion('curious');
    } else if (scrollProgress < 0.45) {
      const t = (scrollProgress - 0.2) / 0.25;
      this.group.position.x = THREE.MathUtils.lerp(3.2, 4.0, t);
      this.group.position.y = THREE.MathUtils.lerp(0.4, -0.6, t) + hoverY;
      this.group.position.z = THREE.MathUtils.lerp(1.8, 1.2, t);
      this.setEmotion('scanning');
    } else if (scrollProgress < 0.7) {
      const t = (scrollProgress - 0.45) / 0.25;
      this.group.position.x = THREE.MathUtils.lerp(4.0, -3.8, t);
      this.group.position.y = THREE.MathUtils.lerp(-0.6, 1.0, t) + hoverY;
      this.group.position.z = THREE.MathUtils.lerp(1.2, 2.0, t);
      this.setEmotion('hearts');
    } else if (scrollProgress < 0.9) {
      const t = (scrollProgress - 0.7) / 0.2;
      this.group.position.x = THREE.MathUtils.lerp(-3.8, 3.5, t);
      this.group.position.y = THREE.MathUtils.lerp(1.0, 0.2, t) + hoverY;
      this.group.position.z = THREE.MathUtils.lerp(2.0, 1.5, t);
      this.setEmotion('stars');
    } else {
      const t = (scrollProgress - 0.9) / 0.1;
      this.group.position.x = THREE.MathUtils.lerp(3.5, 2.2, t);
      this.group.position.y = THREE.MathUtils.lerp(0.2, -0.2, t) + hoverY;
      this.group.position.z = THREE.MathUtils.lerp(1.5, 2.2, t);
      this.setEmotion('happy');
    }

    // Look-at mouse & subtle spring inertia
    const targetRotY = mouse.x * 0.45 + (scrollVelocity * 0.05);
    const targetRotX = -mouse.y * 0.35;
    this.group.rotation.y = THREE.MathUtils.lerp(this.group.rotation.y, targetRotY, 0.08);
    this.group.rotation.x = THREE.MathUtils.lerp(this.group.rotation.x, targetRotX, 0.08);
    this.group.rotation.z = THREE.MathUtils.lerp(this.group.rotation.z, -mouse.x * 0.15, 0.08);
  }
}
