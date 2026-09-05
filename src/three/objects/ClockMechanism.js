/**
 * ClockMechanism.js
 * Procedural 3D mechanical timepiece with glass case, interlocking brass gears,
 * glowing tick dial, and spinning hour/minute/second hands responsive to scroll velocity.
 */

import * as THREE from 'three';

export class ClockMechanism {
  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'ClockMechanism';

    this.spinOffset = 0;

    this.createCasing();
    this.createDial();
    this.createGears();
    this.createHands();

    this.group.position.set(3.6, 1.2, 1.0);
    this.group.scale.setScalar(0.85);
  }

  createCasing() {
    // Outer brass rim
    const rimGeo = new THREE.TorusGeometry(1.8, 0.12, 16, 48);
    const rimMat = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      metalness: 0.85,
      roughness: 0.25
    });
    this.rim = new THREE.Mesh(rimGeo, rimMat);
    this.group.add(this.rim);

    // Glass face
    const glassGeo = new THREE.CylinderGeometry(1.78, 1.78, 0.08, 48);
    glassGeo.rotateX(Math.PI / 2);
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0x051226,
      transparent: true,
      opacity: 0.5,
      roughness: 0.1,
      metalness: 0.1,
      transmission: 0.6,
      ior: 1.5
    });
    this.glass = new THREE.Mesh(glassGeo, glassMat);
    this.group.add(this.glass);
  }

  createDial() {
    // 12 glowing hour markers
    this.markers = new THREE.Group();
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const isQuarter = i % 3 === 0;
      const length = isQuarter ? 0.35 : 0.18;
      const width = isQuarter ? 0.06 : 0.03;

      const markerGeo = new THREE.BoxGeometry(width, length, 0.04);
      const markerMat = new THREE.MeshStandardMaterial({
        color: isQuarter ? 0x00f2fe : 0xffffff,
        emissive: isQuarter ? 0x00f2fe : 0x4facfe,
        emissiveIntensity: isQuarter ? 1.5 : 0.6
      });
      const marker = new THREE.Mesh(markerGeo, markerMat);

      const r = 1.45;
      marker.position.set(Math.sin(angle) * r, Math.cos(angle) * r, 0.05);
      marker.rotation.z = -angle;
      this.markers.add(marker);
    }
    this.group.add(this.markers);
  }

  createGears() {
    // Interlocking decorative gear
    const gearGeo = new THREE.CylinderGeometry(0.8, 0.8, 0.06, 24);
    gearGeo.rotateX(Math.PI / 2);
    const gearMat = new THREE.MeshStandardMaterial({
      color: 0xb8860b,
      metalness: 0.8,
      roughness: 0.3,
      wireframe: true
    });
    this.centerGear = new THREE.Mesh(gearGeo, gearMat);
    this.centerGear.position.z = -0.02;
    this.group.add(this.centerGear);
  }

  createHands() {
    // Center cap
    const capGeo = new THREE.SphereGeometry(0.12, 16, 16);
    const capMat = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.9, roughness: 0.1 });
    const cap = new THREE.Mesh(capGeo, capMat);
    cap.position.z = 0.15;
    this.group.add(cap);

    // Hour hand
    const hourGeo = new THREE.BoxGeometry(0.06, 0.8, 0.03);
    hourGeo.translate(0, 0.4, 0.08);
    const hourMat = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.7, roughness: 0.2 });
    this.hourHand = new THREE.Mesh(hourGeo, hourMat);
    this.group.add(this.hourHand);

    // Minute hand
    const minGeo = new THREE.BoxGeometry(0.04, 1.2, 0.03);
    minGeo.translate(0, 0.6, 0.1);
    const minMat = new THREE.MeshStandardMaterial({ color: 0x00f2fe, emissive: 0x00f2fe, emissiveIntensity: 0.5 });
    this.minHand = new THREE.Mesh(minGeo, minMat);
    this.group.add(this.minHand);

    // Second hand
    const secGeo = new THREE.BoxGeometry(0.02, 1.45, 0.02);
    secGeo.translate(0, 0.6, 0.12);
    const secMat = new THREE.MeshStandardMaterial({ color: 0xff2a7a, emissive: 0xff2a7a, emissiveIntensity: 1.0 });
    this.secHand = new THREE.Mesh(secGeo, secMat);
    this.group.add(this.secHand);
  }

  update(time, scrollProgress, scrollVelocity, mouse) {
    // Time travel spinning when scrolling
    this.spinOffset += scrollVelocity * 0.4;

    const now = new Date();
    const hours = now.getHours() % 12;
    const minutes = now.getMinutes();
    const seconds = now.getSeconds() + now.getMilliseconds() / 1000;

    // Base clock rotation
    const baseHourAngle = -((hours + minutes / 60) / 12) * Math.PI * 2;
    const baseMinAngle = -((minutes + seconds / 60) / 60) * Math.PI * 2;
    const baseSecAngle = -(seconds / 60) * Math.PI * 2;

    this.hourHand.rotation.z = baseHourAngle + this.spinOffset * 0.1;
    this.minHand.rotation.z = baseMinAngle + this.spinOffset * 0.5;
    this.secHand.rotation.z = baseSecAngle + this.spinOffset * 3.0;

    this.centerGear.rotation.z += 0.01 + scrollVelocity * 0.05;

    // Follow the former mascot position across the scroll sections.
    if (scrollProgress < 0.25) {
      const t = scrollProgress / 0.25;
      this.group.position.x = THREE.MathUtils.lerp(3.6, 3.2, t);
      this.group.position.y = THREE.MathUtils.lerp(1.2, 0.4, t);
      this.group.position.z = THREE.MathUtils.lerp(1.0, 1.8, t);
      this.group.rotation.y = THREE.MathUtils.lerp(0.6, 0.35, t) + mouse.x * 0.2;
      this.group.rotation.x = THREE.MathUtils.lerp(0.2, -0.1, t) + mouse.y * 0.2;
    } else if (scrollProgress < 0.45) {
      const t = (scrollProgress - 0.25) / 0.2;
      this.group.position.x = THREE.MathUtils.lerp(3.2, 4.0, t);
      this.group.position.y = THREE.MathUtils.lerp(0.4, -0.6, t);
      this.group.position.z = THREE.MathUtils.lerp(1.8, 1.2, t);
      this.group.rotation.y = THREE.MathUtils.lerp(0.35, 0.5, t) + mouse.x * 0.2;
      this.group.rotation.x = mouse.y * 0.2;
    } else if (scrollProgress < 0.7) {
      const t = (scrollProgress - 0.45) / 0.25;
      this.group.position.x = THREE.MathUtils.lerp(4.0, -3.8, t);
      this.group.position.y = THREE.MathUtils.lerp(-0.6, 1.0, t);
      this.group.position.z = THREE.MathUtils.lerp(1.2, 2.0, t);
      this.group.rotation.y = THREE.MathUtils.lerp(0.5, -0.35, t) + mouse.x * 0.2;
      this.group.rotation.x = mouse.y * 0.2;
    } else if (scrollProgress < 0.9) {
      const t = (scrollProgress - 0.7) / 0.2;
      this.group.position.x = THREE.MathUtils.lerp(-3.8, 3.5, t);
      this.group.position.y = THREE.MathUtils.lerp(1.0, 0.2, t);
      this.group.position.z = THREE.MathUtils.lerp(2.0, 1.5, t);
      this.group.rotation.y = THREE.MathUtils.lerp(-0.35, 0.35, t) + mouse.x * 0.2;
      this.group.rotation.x = mouse.y * 0.2;
    } else {
      const t = (scrollProgress - 0.9) / 0.1;
      this.group.position.x = THREE.MathUtils.lerp(3.5, 2.2, t);
      this.group.position.y = THREE.MathUtils.lerp(0.2, -0.2, t);
      this.group.position.z = THREE.MathUtils.lerp(1.5, 2.2, t);
      this.group.rotation.y = THREE.MathUtils.lerp(0.35, 0.1, t) + mouse.x * 0.2;
    }
  }
}
