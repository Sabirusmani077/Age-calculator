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

    // 2. Touch Physics for Mobile Devices
    window.addEventListener('touchstart', (e) => {
      this.isTouch = true;
      this.touchStartY = e.touches[0].clientY;
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
      if (!this.isTouch) return;
      const touchY = e.touches[0].clientY;
      const deltaY = (this.touchStartY - touchY) * 1.6;
      this.touchStartY = touchY;

      const maxScroll = this.getMaxScroll();
      this.targetProgress = Math.max(0, Math.min(1, this.targetProgress + (deltaY / maxScroll)));
      e.preventDefault();
    }, { passive: false });

    window.addEventListener('touchend', () => {
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
      const frameDamping = 1 - Math.pow(1 - this.damping, deltaMs / 16.66);
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
