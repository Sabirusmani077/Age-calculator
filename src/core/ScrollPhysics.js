/**
 * ScrollPhysics.js
 * Ultra-smooth virtual & native scroll controller with physical inertia,
 * continuous momentum damping, wheel smoothing, and touch deceleration.
 */

export class ScrollPhysics {
  constructor(options = {}) {
    // Damping factor: 0.045 gives ultra-luxury butter-smooth glide
    this.damping = options.damping || 0.048;
    this.targetProgress = 0;
    this.currentProgress = 0;
    this.velocity = 0;
    this.previousProgress = 0;
    this.isReducedMotion = false;
    this.callbacks = new Set();

    // Wheel & Touch physics
    this.touchStartY = 0;
    this.touchLastY = 0;
    this.touchLastTime = 0;
    this.touchVelocityY = 0;
    this.touchSamples = [];
    this.isTouch = false;
    this.isWheelActive = false;
    this.wheelTimeout = null;

    this.checkReducedMotion();
    this.initEvents();
  }

  checkReducedMotion() {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    this.isReducedMotion = mediaQuery.matches;
    mediaQuery.addEventListener('change', (e) => {
      this.isReducedMotion = e.matches;
    });
  }

  setReducedMotion(enabled) {
    this.isReducedMotion = enabled;
  }

  getMaxScroll() {
    return Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
  }

  initEvents() {
    // 1. Smooth Wheel Interceptor: converts chunky mouse notches into fluid velocity
    window.addEventListener('wheel', (e) => {
      if (this.isReducedMotion) return;

      // Normalize delta across browsers and devices
      let deltaY = e.deltaY;
      if (e.deltaMode === 1) deltaY *= 32; // Line mode (Firefox)
      else if (e.deltaMode === 2) deltaY *= 400; // Page mode

      // Multiplier tuned for intuitive responsiveness and cinematic feel
      // If user is at the footer finale and scrolling inside it, allow smooth panning inside footer
      if (this.targetProgress >= 0.98) {
        const finale = document.getElementById('sec-finale');
        if (finale && finale.scrollHeight > finale.clientHeight + 10) {
          if (deltaY > 0 && finale.scrollTop + finale.clientHeight < finale.scrollHeight - 5) {
            finale.scrollTop += deltaY;
            e.preventDefault();
            return;
          } else if (deltaY < 0 && finale.scrollTop > 5) {
            finale.scrollTop += deltaY;
            e.preventDefault();
            return;
          }
        }
      }

      const maxScroll = this.getMaxScroll();
      const scrollStep = (deltaY * 1.2) / maxScroll;

      this.targetProgress = Math.max(0, Math.min(1, this.targetProgress + scrollStep));
      this.isWheelActive = true;

      clearTimeout(this.wheelTimeout);
      this.wheelTimeout = setTimeout(() => {
        this.isWheelActive = false;
      }, 150);

      // Prevent native jumpy step scrolling so the physical inertia takes over
      e.preventDefault();
    }, { passive: false });

    // 2. High-Performance Kinetic Touch Physics for Mobile Devices
    window.addEventListener('touchstart', (e) => {
      if (e.touches.length > 1) return;
      this.isTouch = true;
      const y = e.touches[0].clientY;
      this.touchStartY = y;
      this.touchLastY = y;
      this.touchLastTime = performance.now();
      this.touchVelocityY = 0;
      this.touchSamples = [];
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
      if (!this.isTouch || e.touches.length > 1) return;
      const touchY = e.touches[0].clientY;
      const now = performance.now();
      const deltaY = this.touchLastY - touchY;
      const dt = Math.max(1, now - this.touchLastTime);

      this.touchVelocityY = deltaY / dt; // px per ms

      // Keep recent velocity samples for accurate flick / kinetic fling
      this.touchSamples.push({ v: this.touchVelocityY, time: now });
      if (this.touchSamples.length > 5) this.touchSamples.shift();

      this.touchLastY = touchY;
      this.touchLastTime = now;

      // Section 6 Finale: Discord footer internal scroll support on touch
      if (this.targetProgress >= 0.98) {
        const finale = document.getElementById('sec-finale');
        if (finale && finale.scrollHeight > finale.clientHeight + 10) {
          if (deltaY > 0 && finale.scrollTop + finale.clientHeight < finale.scrollHeight - 5) {
            finale.scrollTop += deltaY;
            return;
          } else if (deltaY < 0 && finale.scrollTop > 5) {
            finale.scrollTop += deltaY;
            return;
          }
        }
      }

      // Mobile Touch Gesture Calibration:
      // A natural swipe (~180-220px) seamlessly advances roughly one full chapter!
      // gestureScale based on screen height ensures natural responsiveness across all phones & tablets
      const gestureScale = Math.max(320, window.innerHeight * 1.15);
      const scrollStep = (deltaY * 1.15) / gestureScale;

      this.targetProgress = Math.max(0, Math.min(1, this.targetProgress + scrollStep));

      if (e.cancelable) {
        e.preventDefault();
      }
    }, { passive: false });

    window.addEventListener('touchend', () => {
      if (!this.isTouch) return;
      this.isTouch = false;

      const now = performance.now();
      // Average recent samples from the last 120ms
      const recent = (this.touchSamples || []).filter(s => now - s.time < 120);
      let avgV = 0;
      if (recent.length > 0) {
        avgV = recent.reduce((sum, s) => sum + s.v, 0) / recent.length;
      } else {
        avgV = this.touchVelocityY || 0;
      }

      // Kinetic Momentum Fling: when user flicks with speed, glide forward smoothly
      if (Math.abs(avgV) > 0.18) {
        const gestureScale = Math.max(320, window.innerHeight * 1.15);
        // Calculate fling impulse (clamped to at most 1.5 chapters per single flick)
        const flingDistance = avgV * Math.min(380, Math.abs(avgV) * 220);
        const flingProgress = flingDistance / gestureScale;
        this.targetProgress = Math.max(0, Math.min(1, this.targetProgress + flingProgress));
      }
    }, { passive: true });

    window.addEventListener('touchcancel', () => {
      this.isTouch = false;
    }, { passive: true });

    // 3. Keyboard Arrow & Page navigation
    window.addEventListener('keydown', (e) => {
      const step = 0.04;
      if (e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === ' ') {
        this.targetProgress = Math.min(1, this.targetProgress + step);
        if (e.key === ' ') e.preventDefault();
      } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        this.targetProgress = Math.max(0, this.targetProgress - step);
      } else if (e.key === 'Home') {
        this.targetProgress = 0;
      } else if (e.key === 'End') {
        this.targetProgress = 1;
      }
    });

    // 4. Scrollbar drag sync (when user drags the native scrollbar)
    window.addEventListener('scroll', () => {
      if (!this.isWheelActive && !this.isTouch) {
        const scrollY = window.scrollY || window.pageYOffset;
        const maxScroll = this.getMaxScroll();
        this.targetProgress = Math.min(Math.max(scrollY / maxScroll, 0), 1);
      }
    }, { passive: true });

    // Initialize position
    const scrollY = window.scrollY || window.pageYOffset;
    this.targetProgress = Math.min(Math.max(scrollY / this.getMaxScroll(), 0), 1);
    this.currentProgress = this.targetProgress;
  }

  scrollToProgress(progress, smooth = true) {
    const clamped = Math.max(0, Math.min(1, progress));
    this.targetProgress = clamped;
    if (!smooth || this.isReducedMotion) {
      this.jumpToProgress(clamped);
    }
  }

  jumpToProgress(progress) {
    const clamped = Math.max(0, Math.min(1, progress));
    this.targetProgress = clamped;
    this.currentProgress = clamped;
    this.previousProgress = clamped;
    this.velocity = 0;
    const maxScroll = this.getMaxScroll();
    window.scrollTo({ top: clamped * maxScroll, behavior: 'instant' });
    for (const cb of this.callbacks) {
      cb(this.currentProgress, 0, this.targetProgress);
    }
  }

  onUpdate(callback) {
    this.callbacks.add(callback);
    return () => this.callbacks.delete(callback);
  }

  /**
   * Called on every requestAnimationFrame in the render loop.
   * Interpolates currentProgress towards targetProgress with high-inertia momentum.
   */
  update(deltaMs = 16) {
    if (this.isReducedMotion) {
      this.currentProgress = this.targetProgress;
      this.velocity = 0;
    } else {
      // Damped spring / lerp equation with delta-time compensation
      const diff = this.targetProgress - this.currentProgress;
      // Snappy 1:1 finger tracking while dragging on touch screen (0.22), luxury momentum when coasting
      const activeDamping = this.isTouch ? 0.22 : this.damping;
      const frameDamping = 1 - Math.pow(1 - activeDamping, deltaMs / 16.66);
      this.currentProgress += diff * frameDamping;

      // Calculate instantaneous velocity
      this.velocity = (this.currentProgress - this.previousProgress) * (1000 / deltaMs);
      this.previousProgress = this.currentProgress;

      // Clamp micro-oscillations
      if (Math.abs(diff) < 0.00002) {
        this.currentProgress = this.targetProgress;
      }

      // Sync native scrollbar position so user can see scrollbar moving
      const maxScroll = this.getMaxScroll();
      window.scrollTo({ top: this.currentProgress * maxScroll, behavior: 'instant' });
    }

    for (const cb of this.callbacks) {
      cb(this.currentProgress, this.velocity, this.targetProgress);
    }

    return {
      progress: this.currentProgress,
      velocity: this.velocity,
      target: this.targetProgress
    };
  }
}
