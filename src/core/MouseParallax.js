/**
 * MouseParallax.js
 * Combines damped 2D mouse cursor tracking, device orientation (gyroscope on mobile),
 * and interactive 3D perspective tilts for DOM cards, images, and 3D scene cameras.
 */

export class MouseParallax {
  constructor(options = {}) {
    this.damping = options.damping || 0.08;
    this.target = { x: 0, y: 0 };
    this.current = { x: 0, y: 0 };
    this.delta = { x: 0, y: 0 };
    this.windowWidth = window.innerWidth;
    this.windowHeight = window.innerHeight;
    this.isReducedMotion = false;
    this.hasGyro = false;

    this.initEvents();
    this.initTiltElements();
  }

  initEvents() {
    window.addEventListener('resize', () => {
      this.windowWidth = window.innerWidth;
      this.windowHeight = window.innerHeight;
    }, { passive: true });

    window.addEventListener('mousemove', (e) => {
      // Map to normalized range: -1.0 (left/top) to +1.0 (right/bottom)
      this.target.x = (e.clientX / this.windowWidth) * 2 - 1;
      this.target.y = (e.clientY / this.windowHeight) * 2 - 1;
    }, { passive: true });

    window.addEventListener('mouseleave', () => {
      // Gently return to center when mouse leaves window
      this.target.x = 0;
      this.target.y = 0;
    });

    // Mobile gyroscope / orientation fallback
    if (window.DeviceOrientationEvent && typeof window.DeviceOrientationEvent.requestPermission !== 'function') {
      window.addEventListener('deviceorientation', (e) => {
        if (e.gamma !== null && e.beta !== null) {
          this.hasGyro = true;
          // Clamp gamma (-45 to 45) and beta (-45 to 45)
          const clampedX = Math.max(-45, Math.min(45, e.gamma));
          const clampedY = Math.max(-45, Math.min(45, e.beta - 45));
          this.target.x = clampedX / 45;
          this.target.y = clampedY / 45;
        }
      }, { passive: true });
    }
  }

  setReducedMotion(enabled) {
    this.isReducedMotion = enabled;
  }

  /**
   * Initializes 3D hover/tilt effects on interactive cards and images.
   */
  initTiltElements() {
    const handleCardMove = (e) => {
      if (this.isReducedMotion) return;
      const card = e.currentTarget;
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const rotateX = ((y - centerY) / centerY) * -10; // max 10 deg tilt
      const rotateY = ((x - centerX) / centerX) * 10;

      card.style.setProperty('--mouse-x', `${(x / rect.width) * 100}%`);
      card.style.setProperty('--mouse-y', `${(y / rect.height) * 100}%`);
      card.style.setProperty('--tilt-x', `${rotateX}deg`);
      card.style.setProperty('--tilt-y', `${rotateY}deg`);

      // Apply transform only if it is a standalone subcard (not a main section container)
      if (!card.classList.contains('calc-container') && !card.classList.contains('result-container') && !card.classList.contains('countdown-card') && !card.classList.contains('units-container') && !card.classList.contains('hero-content')) {
        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
      }
    };

    const handleCardLeave = (e) => {
      const card = e.currentTarget;
      card.style.setProperty('--tilt-x', '0deg');
      card.style.setProperty('--tilt-y', '0deg');
      if (!card.classList.contains('calc-container') && !card.classList.contains('result-container') && !card.classList.contains('countdown-card') && !card.classList.contains('units-container') && !card.classList.contains('hero-content')) {
        card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
      }
    };

    // Attach to all elements with data-tilt or .interactive-3d-card
    const setupCards = () => {
      const tiltCards = document.querySelectorAll('[data-tilt], .interactive-3d-card, .interactive-3d-image');
      tiltCards.forEach(card => {
        if (!card._tiltInitialized) {
          card._tiltInitialized = true;
          card.addEventListener('mousemove', handleCardMove);
          card.addEventListener('mouseleave', handleCardLeave);
        }
      });
    };

    // Setup now and observe mutations
    setupCards();
    const observer = new MutationObserver(setupCards);
    observer.observe(document.body, { childList: true, subtree: true });
  }

  update(deltaMs = 16) {
    if (this.isReducedMotion) {
      this.current.x = 0;
      this.current.y = 0;
      return this.current;
    }

    const frameDamping = 1 - Math.pow(1 - this.damping, deltaMs / 16.66);
    const prevX = this.current.x;
    const prevY = this.current.y;

    this.current.x += (this.target.x - this.current.x) * frameDamping;
    this.current.y += (this.target.y - this.current.y) * frameDamping;

    this.delta.x = this.current.x - prevX;
    this.delta.y = this.current.y - prevY;

    return this.current;
  }
}
