/**
 * main.js
 * Application entry point for MDK 3D Age Calculator.
 * Unifies WebGL 3D scene, physical scroll inertia, 2.5D card tilts,
 * temporal calculation engine, audio design, and interactive UI states.
 */

import confetti from 'canvas-confetti';
import { ScrollPhysics } from './core/ScrollPhysics.js';
import { MouseParallax } from './core/MouseParallax.js';
import { AudioEffects } from './core/AudioEffects.js';
import { AgeCalculator } from './engine/AgeCalculator.js';
import { SceneManager } from './three/SceneManager.js';

class App {
  constructor() {
    this.canvas = document.getElementById('webgl-canvas');
    this.progressBar = document.getElementById('scroll-progress-bar');
    this.sections = Array.from(document.querySelectorAll('.story-section'));
    this.chapterPills = Array.from(document.querySelectorAll('.chapter-pill'));
    this.toast = document.getElementById('toast-notice');

    // Section 3D Spatial Continuum Configuration
    this.sectionConfigs = [
      { id: 'sec-hero', childSel: '.hero-content', center: 0.0, span: 0.18 },
      { id: 'sec-calc', childSel: '.calc-container', center: 0.22, span: 0.18 },
      { id: 'sec-result', childSel: '.result-container', center: 0.48, span: 0.20 },
      { id: 'sec-countdown', childSel: '.countdown-card', center: 0.72, span: 0.16 },
      { id: 'sec-units', childSel: '.units-container', center: 0.88, span: 0.14 },
      { id: 'sec-finale', childSel: '.finale-container', center: 1.0, span: 0.14 }
    ];

    this.cachedSections = this.sectionConfigs.map(cfg => {
      const section = document.getElementById(cfg.id);
      const child = section ? section.querySelector(cfg.childSel) : null;
      return { ...cfg, section, child };
    });

    // Temporal state
    this.birthDate = null;
    this.calculationData = null;
    this.lastScrollSection = 0;

    this.initEngines();
    this.initUI();
    this.setDefaultDate();
    this.startLoop();
  }

  initEngines() {
    // 1. Audio System
    this.audio = new AudioEffects();

    // 2. Mouse Parallax & 3D Card Tilt
    this.mouse = new MouseParallax({ damping: 0.08 });

    // 3. Scroll Physics with Inertia
    this.scroll = new ScrollPhysics({ damping: 0.07 });

    // 4. 3D WebGL Scene Director
    this.sceneManager = new SceneManager(this.canvas);
  }

  setDefaultDate() {
    // Default to a 25-year-old baseline or 2000-01-01
    const defaultDate = new Date();
    defaultDate.setFullYear(defaultDate.getFullYear() - 25);
    defaultDate.setMonth(5);
    defaultDate.setDate(15);
    defaultDate.setHours(10, 30, 0, 0);

    const dateStr = defaultDate.toISOString().split('T')[0];
    const dateInput = document.getElementById('birthdate-input');
    const timeInput = document.getElementById('birthtime-input');

    if (dateInput) dateInput.value = dateStr;
    if (timeInput) timeInput.value = '10:30';

    this.setBirthDate(defaultDate);
  }

  setBirthDate(date) {
    this.birthDate = date;
    this.recalculate();

    // Update 3D Calendar leaf textures with new date
    if (this.sceneManager && this.sceneManager.calendarLeaves) {
      const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
      const monthStr = monthNames[date.getMonth()];
      const dayStr = String(date.getDate()).padStart(2, '0');
      this.sceneManager.calendarLeaves.updateData(dayStr, monthStr, 'SOON');
    }
  }

  initUI() {
    // Header controls
    const btnAudio = document.getElementById('btn-audio-toggle');
    if (btnAudio) {
      btnAudio.addEventListener('click', () => {
        const isMuted = this.audio.toggleMute();
        btnAudio.textContent = isMuted ? '🔇' : '🔊';
        btnAudio.classList.toggle('active', !isMuted);
      });
    }

    const btnMotion = document.getElementById('btn-motion-toggle');
    if (btnMotion) {
      btnMotion.addEventListener('click', () => {
        const isReduced = !this.scroll.isReducedMotion;
        this.scroll.setReducedMotion(isReduced);
        this.mouse.setReducedMotion(isReduced);
        this.sceneManager.setReducedMotion(isReduced);
        btnMotion.classList.toggle('active', isReduced);
        btnMotion.textContent = isReduced ? '🛑' : '⚡';
        this.showToast(isReduced ? 'Reduced Motion: ON' : 'Cinematic Dynamics: ON');
      });
    }

    // Chapter navigation pills - Direct jump to exact section without slow scrolling
    this.chapterPills.forEach((pill, idx) => {
      pill.addEventListener('click', () => {
        this.jumpToSection(idx);
      });
    });

    // Brand logo returns to hero origin directly
    const btnBrand = document.getElementById('btn-brand-home');
    if (btnBrand) {
      btnBrand.addEventListener('click', (e) => {
        e.preventDefault();
        this.jumpToSection(0);
      });
    }

    // Hero prompt opens calculator input chamber directly
    const heroPrompt = document.getElementById('hero-scroll-prompt');
    if (heroPrompt) {
      heroPrompt.addEventListener('click', () => {
        this.jumpToSection(1);
      });
    }

    // Input form submit
    const btnSubmit = document.getElementById('btn-submit-calc');
    if (btnSubmit) {
      btnSubmit.addEventListener('click', () => {
        this.handleFormSubmit();
      });
    }

    // Presets
    const presetsBar = document.getElementById('presets-bar');
    if (presetsBar) {
      presetsBar.addEventListener('click', (e) => {
        const chip = e.target.closest('.preset-chip');
        if (!chip) return;

        this.audio.playClick();

        if (chip.dataset.years) {
          const years = parseInt(chip.dataset.years, 10);
          const target = new Date();
          target.setFullYear(target.getFullYear() - years);
          const dateStr = target.toISOString().split('T')[0];
          document.getElementById('birthdate-input').value = dateStr;
          this.setBirthDate(target);
        } else if (chip.dataset.date) {
          document.getElementById('birthdate-input').value = chip.dataset.date;
          if (chip.dataset.time) {
            document.getElementById('birthtime-input').value = chip.dataset.time;
          }
          this.readInputAndCalculate();
        }

        this.showToast(`Preset Loaded: ${chip.textContent}`);
      });
    }

    // Direct input listeners for real-time responsiveness
    const dateInput = document.getElementById('birthdate-input');
    const timeInput = document.getElementById('birthtime-input');
    if (dateInput) {
      dateInput.addEventListener('change', () => this.readInputAndCalculate());
    }
    if (timeInput) {
      timeInput.addEventListener('change', () => this.readInputAndCalculate());
    }

    // Confetti button
    const btnConfetti = document.getElementById('btn-confetti');
    if (btnConfetti) {
      btnConfetti.addEventListener('click', () => {
        this.triggerConfetti();
        this.audio.playSuccess();
      });
    }

    // Copy Summary button
    const btnCopy = document.getElementById('btn-copy-summary');
    if (btnCopy) {
      btnCopy.addEventListener('click', () => {
        this.copyDossierToClipboard();
      });
    }

    // Return to Origin button
    const btnReturn = document.getElementById('btn-return-origin');
    if (btnReturn) {
      btnReturn.addEventListener('click', () => {
        this.jumpToSection(0);
      });
    }

    // Footer Back to Top button
    const btnFooterTop = document.getElementById('btn-footer-top');
    if (btnFooterTop) {
      btnFooterTop.addEventListener('click', () => {
        this.jumpToSection(0);
      });
    }

    // Footer language selector interaction
    const footerLang = document.getElementById('footer-lang');
    if (footerLang) {
      footerLang.addEventListener('change', (e) => {
        this.audio.playTick();
        this.showToast(`Language switched: ${e.target.options[e.target.selectedIndex].text}`);
      });
    }
  }

  jumpToSection(idx) {
    if (idx < 0 || idx >= this.sectionConfigs.length) return;
    const cfg = this.sectionConfigs[idx];
    const targetProgress = cfg.center;

    // Instant direct jump without slow intermediate scrolling
    this.scroll.jumpToProgress(targetProgress);

    // Instant snap on 3D camera
    this.sceneManager.snapCamera(targetProgress);

    // Immediately render target section at center and hide others
    this.updateSectionVisibility(targetProgress, this.mouse.current);

    // Play click sound
    this.audio.playClick();

    // Mark tab pill active
    this.chapterPills.forEach((pill, i) => {
      const isActive = i === idx;
      pill.classList.toggle('active', isActive);
      if (isActive) {
        pill.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }
    });
  }

  readInputAndCalculate() {
    const dateVal = document.getElementById('birthdate-input').value;
    const timeVal = document.getElementById('birthtime-input').value || '00:00';

    if (!dateVal) return;

    const [year, month, day] = dateVal.split('-').map(Number);
    const [hour, minute] = timeVal.split(':').map(Number);

    const parsedDate = new Date(year, month - 1, day, hour, minute, 0, 0);
    this.setBirthDate(parsedDate);
  }

  handleFormSubmit() {
    this.readInputAndCalculate();
    this.audio.playSuccess();
    this.triggerConfetti();
    // Directly open Age Matrix section!
    this.jumpToSection(2);
  }

  triggerConfetti() {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#00f2fe', '#4facfe', '#ffd200', '#ff2a7a', '#ffffff']
    });
  }

  showToast(message) {
    if (!this.toast) return;
    this.toast.textContent = message;
    this.toast.classList.add('show');
    clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => {
      this.toast.classList.remove('show');
    }, 2800);
  }

  copyDossierToClipboard() {
    if (!this.calculationData || this.calculationData.isFuture) return;

    const p = this.calculationData.primary;
    const t = this.calculationData.totals;
    const b = this.calculationData.nextBirthday;
    const z = this.calculationData.astronomy;

    const text = `🌌 MDK CHRONO TEMPORAL DOSSIER 🌌
----------------------------------
Chronological Age: ${p.years} Years, ${p.months} Months, ${p.days} Days
Elapsed Time: ${p.hours}h ${p.minutes}m ${p.seconds}s
Total Days Alive: ${t.totalDays.toLocaleString()} Days
Total Hours Lived: ${t.totalHours.toLocaleString()} Hours
Estimated Heartbeats: ${this.calculationData.biology.heartbeats.toLocaleString()}
Next Celebration: Turning ${b.turningAge} in ${b.days} days!
Western Zodiac: ${z.westernZodiac.sign} (${z.westernZodiac.symbol})
Chinese Zodiac: Year of the ${z.chineseZodiac.animal} (${z.chineseZodiac.symbol})
----------------------------------
Calculated with MDK 3D Age Engine`;

    navigator.clipboard.writeText(text).then(() => {
      this.audio.playSuccess();
      this.showToast('Temporal Dossier copied to clipboard! 📋');
    }).catch(() => {
      this.showToast('Could not copy to clipboard.');
    });
  }

  recalculate() {
    if (!this.birthDate) return;
    const res = AgeCalculator.calculate(this.birthDate, new Date());
    if (!res) return;

    this.calculationData = res;

    if (res.isFuture) {
      const mascot = document.getElementById('mascot-text');
      if (mascot) mascot.textContent = 'Chrono-Bot: "Warning! Selected timestamp is in the future."';
      return;
    }

    // Update Live Age Tiles
    document.getElementById('val-years').textContent = String(res.primary.years).padStart(2, '0');
    document.getElementById('val-months').textContent = String(res.primary.months).padStart(2, '0');
    document.getElementById('val-days').textContent = String(res.primary.days).padStart(2, '0');
    document.getElementById('val-hours').textContent = String(res.primary.hours).padStart(2, '0');
    document.getElementById('val-minutes').textContent = String(res.primary.minutes).padStart(2, '0');
    document.getElementById('val-seconds').textContent = String(res.primary.seconds).padStart(2, '0');
    document.getElementById('val-milliseconds').textContent = String(res.primary.ms).padStart(3, '0');

    // Mascot reaction
    const mascot = document.getElementById('mascot-text');
    if (mascot) {
      mascot.textContent = `Chrono-Bot: "Sensors calibrated! You have lived ${res.totals.totalDays.toLocaleString()} radiant earth days!"`;
    }

    // Next Birthday countdown
    const bday = res.nextBirthday;
    document.getElementById('bday-turning-heading').textContent = `Turning Age ${bday.turningAge} In`;
    document.getElementById('bday-exact-date').textContent = `${bday.date.toDateString()}`;
    document.getElementById('bday-days').textContent = String(bday.days).padStart(2, '0');
    document.getElementById('bday-hours').textContent = String(bday.hours).padStart(2, '0');
    document.getElementById('bday-minutes').textContent = String(bday.minutes).padStart(2, '0');
    document.getElementById('bday-seconds').textContent = String(bday.seconds).padStart(2, '0');

    // Upcoming birthdays list
    const upcomingList = document.getElementById('upcoming-bdays-list');
    if (upcomingList && bday.upcoming) {
      upcomingList.innerHTML = bday.upcoming.map(item => `
        <div class="upcoming-item">
          <span class="upcoming-year">${item.year} (Turn ${item.turning})</span>
          <span class="upcoming-day">${item.dayOfWeek}</span>
        </div>
      `).join('');
    }

    // Zodiac & Astrology
    const wz = res.astronomy.westernZodiac;
    const cz = res.astronomy.chineseZodiac;
    document.getElementById('zodiac-symbol').textContent = wz.symbol;
    document.getElementById('zodiac-name').textContent = wz.sign;
    document.getElementById('zodiac-details').textContent = `Element: ${wz.element} • Stone: ${wz.stone}`;

    document.getElementById('chinese-zodiac-symbol').textContent = cz.symbol;
    document.getElementById('chinese-zodiac-name').textContent = `${cz.animal}`;
    document.getElementById('chinese-zodiac-details').textContent = `Chinese Zodiac Sign`;

    // Section 5 Units & Space
    document.getElementById('tot-days').textContent = res.totals.totalDays.toLocaleString();
    document.getElementById('tot-hours').textContent = res.totals.totalHours.toLocaleString();
    document.getElementById('bio-heartbeats').textContent = (res.biology.heartbeats / 1e6).toFixed(1) + 'M';
    document.getElementById('bio-breaths').textContent = (res.biology.breaths / 1e6).toFixed(1) + 'M';
    document.getElementById('cos-sun-dist').textContent = (res.astronomy.spaceDistanceKm / 1e9).toFixed(2) + 'B km';
    document.getElementById('cos-mars-age').textContent = res.astronomy.marsAge;
  }

  /**
   * Continuous 3D Spatial Emergence Engine:
   * Drives the physical fly-in from background z-depth, scale expansion,
   * lens focus de-blur, and mouse perspective tilt on every single frame!
   */
  updateSectionVisibility(progress, mouseCoords = { x: 0, y: 0 }) {
    let closestIdx = 0;
    let minDistance = Infinity;

    this.cachedSections.forEach((item, idx) => {
      if (!item.section || !item.child) return;

      const d = progress - item.center;
      const absD = Math.abs(d);
      if (absD < minDistance) {
        minDistance = absD;
        closestIdx = idx;
      }

      const u = d / item.span; // Normalized offset: -1.0 (entering) to 0.0 (center) to +1.0 (exiting)

      if (Math.abs(u) > 1.25) {
        // Completely hidden in deep background or far past camera
        item.section.style.opacity = '0';
        item.section.style.visibility = 'hidden';
        item.section.style.pointerEvents = 'none';
        item.child.style.pointerEvents = 'none';
        return;
      }

      item.section.style.visibility = 'visible';

      let z = 0;
      let y = 0;
      let scale = 1.0;
      let rotX = 0;
      let opacity = 1.0;

      if (idx === 0 && progress <= item.center) {
        // Hero at top origin (scroll top / up):
        // Always 100% sharp, full scale, 100% opacity, resting cleanly at origin!
        z = 0;
        y = 0;
        scale = 1.0;
        rotX = 0;
        opacity = 1.0;
      } else if (idx === this.cachedSections.length - 1 && progress >= item.center) {
        // Finale at bottom boundary:
        // Always 100% sharp, full scale, 100% opacity, resting cleanly at origin!
        z = 0;
        y = 0;
        scale = 1.0;
        rotX = 0;
        opacity = 1.0;
      } else if (u < 0) {
        // PHYSICAL EMERGENCE: Rising from 3D background depth toward user
        const t = Math.max(0, 1 + u); // 0.0 -> 1.0
        // Smooth cubic easing
        const s = t * t * (3 - 2 * t);

        z = -700 * (1 - s);     // -700px background -> 0px
        y = 35 * (1 - s);       // 35px -> 0px
        scale = 0.80 + 0.20 * s;// 0.80 scale -> 1.0
        rotX = 10 * (1 - s);    // 10deg back tilt -> 0deg
        opacity = s;
      } else {
        // DEPARTURE: Gliding forward past the camera / dissolving cleanly
        const t = Math.min(1, u); // 0.0 -> 1.0
        const s = t * t;

        z = 250 * s;            // 0px -> +250px flying towards viewer
        y = -40 * s;            // Ascends slightly
        scale = 1.0 + 0.08 * s;
        rotX = -6 * s;
        opacity = Math.max(0, 1 - s * 1.35);
      }

      // Layer mouse parallax tilt
      const tiltX = -mouseCoords.y * 5;
      const tiltY = mouseCoords.x * 5;

      // Apply GPU-accelerated 3D transform with clean coordinates
      item.child.style.transform = `perspective(1200px) translate3d(0px, ${y.toFixed(1)}px, ${z.toFixed(1)}px) rotateX(${(rotX + tiltX).toFixed(2)}deg) rotateY(${tiltY.toFixed(2)}deg) scale(${scale.toFixed(3)})`;
      item.section.style.opacity = opacity.toFixed(3);

      // NEVER BLUR CONTENT: All text, numbers, and inputs stay 100% razor sharp!
      item.child.style.filter = 'none';

      // Interactive pointer events when prominently in view
      const isInteractive = (idx === 0 && progress <= 0.12) ||
                            (idx === this.cachedSections.length - 1 && progress >= 0.88) ||
                            (Math.abs(u) < 0.35 && opacity > 0.55);
      item.section.style.pointerEvents = isInteractive ? 'auto' : 'none';
      item.child.style.pointerEvents = isInteractive ? 'auto' : 'none';

      // Staggered emergence for child age tiles in the Main Box
      if (item.id === 'sec-result') {
        const tiles = item.child.querySelectorAll('.age-tile');
        const tileZ = u < 0 ? (1 - Math.max(0, 1 + u)) * -100 : 0;
        tiles.forEach((tile, tileIdx) => {
          tile.style.transform = `translateZ(${(tileZ * (1 + tileIdx * 0.12)).toFixed(1)}px)`;
        });
      }
    });

    // Sound tick on chapter change
    const hasSectionChanged = closestIdx !== this.lastScrollSection;
    if (hasSectionChanged) {
      this.lastScrollSection = closestIdx;
      this.audio.playTick();
    }

    // Update chapter pills
    this.chapterPills.forEach((pill, idx) => {
      const isActive = idx === closestIdx;
      pill.classList.toggle('active', isActive);
      if (isActive && hasSectionChanged) {
        pill.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }
    });

    // Update progress bar width
    if (this.progressBar) {
      this.progressBar.style.width = `${(progress * 100).toFixed(1)}%`;
    }
  }

  startLoop() {
    let lastTime = performance.now();

    const frame = (now) => {
      const deltaMs = Math.min(now - lastTime, 100);
      lastTime = now;
      const timeInSec = now * 0.001;

      // 1. Update Scroll Physics with physical inertia
      const { progress, velocity } = this.scroll.update(deltaMs);

      // 2. Update Mouse Parallax
      const mouseCoords = this.mouse.update(deltaMs);

      // 3. Update DOM Story Sections (continuous 3D spatial emergence)
      this.updateSectionVisibility(progress, mouseCoords);

      // 4. Update 3D WebGL Scene
      this.sceneManager.update(timeInSec, progress, velocity, mouseCoords);

      // 5. Continuous live recalculation for milliseconds ticker
      this.recalculate();

      requestAnimationFrame(frame);
    };

    requestAnimationFrame(frame);
  }
}

// Bootstrap once DOM is loaded
window.addEventListener('DOMContentLoaded', () => {
  window.app = new App();
});
