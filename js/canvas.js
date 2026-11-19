/* =============================================================================
 * canvas.js — Motor 2D del fondo, el cubo jugador y las partículas.
 *
 * · Cuadrícula parallax y figuras geométricas a varias profundidades.
 * · Suelo sólido con línea de neón y rejilla en movimiento.
 * · Paletas que se interpolan (lerp) al cambiar de sección.
 * · Cubo con salto parabólico, rotación de 180°/360°, squash & stretch,
 *   estela de partículas e impacto al aterrizar.
 * · Dash gigante al cambiar de sección: el cubo crece, gira 720°, cruza la
 *   pantalla y aterriza en el nuevo checkpoint.
 * · Skin del cubo editable en tiempo real desde el Icon Kit.
 * ========================================================================== */

(function () {
  'use strict';

  const TAU = Math.PI * 2;
  const DASH_DURATION = 0.62;
  const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
  const smoothstep = (t) => t * t * (3 - 2 * t);

  function hexToRgb(hex) {
    if (!hex) return [255, 255, 255];
    let h = String(hex).trim().replace('#', '');
    if (h.length === 3) h = h.split('').map((c) => c + c).join('');
    const n = parseInt(h, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }

  function rgbCss(rgb, alpha) {
    if (alpha === undefined) {
      return `rgb(${rgb[0] | 0}, ${rgb[1] | 0}, ${rgb[2] | 0})`;
    }
    return `rgba(${rgb[0] | 0}, ${rgb[1] | 0}, ${rgb[2] | 0}, ${alpha})`;
  }

  function mixRgb(a, b, t) {
    return [
      a[0] + (b[0] - a[0]) * t,
      a[1] + (b[1] - a[1]) * t,
      a[2] + (b[2] - a[2]) * t,
    ];
  }

  function mixColor(a, b, t) {
    return mixRgb(hexToRgb(a), hexToRgb(b), t);
  }

  function normalizePalette(p) {
    return {
      bg: hexToRgb(p.bg),
      bg2: hexToRgb(p.bg2),
      ground: hexToRgb(p.ground),
      ground2: hexToRgb(p.ground2),
      accent: hexToRgb(p.accent),
      accent2: hexToRgb(p.accent2),
    };
  }

  function roundRectPath(ctx, x, y, w, h, r) {
    const radius = Math.min(r, w * 0.5, h * 0.5);
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + w - radius, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
    ctx.lineTo(x + w, y + h - radius);
    ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
    ctx.lineTo(x + radius, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }

  const DEFAULT_SKIN = {
    base: '#0891b2',
    accent: '#a5f3fc',
    pattern: 'visor',
  };

  class GDWorld {
    constructor(canvas, sections, dashCanvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.dashCanvas = dashCanvas || null;
      this.dashCtx = this.dashCanvas ? this.dashCanvas.getContext('2d') : null;
      this.sections = sections || [];

      this.w = 0;
      this.h = 0;
      this.dpr = 1;
      this.groundH = 130;
      this.groundY = 0;

      this.time = 0;
      this.last = 0;
      this.scroll = 0;
      this.section = 0;
      this.progress = 0;

      this.palette = normalizePalette(this.sections[0].palette);
      this.targetPalette = normalizePalette(this.sections[0].palette);
      this.paletteSnap = true;

      this.skinBase = hexToRgb(DEFAULT_SKIN.base);
      this.skinAccent = hexToRgb(DEFAULT_SKIN.accent);
      this.skinTargetBase = hexToRgb(DEFAULT_SKIN.base);
      this.skinTargetAccent = hexToRgb(DEFAULT_SKIN.accent);
      this.skinPattern = DEFAULT_SKIN.pattern;

      this.x = 0;
      this.prevX = 0;
      this.size = 64;
      this.jumpOffset = 0;
      this.angle = 0;
      this.airborne = false;
      this.jumpElapsed = 0;
      this.jumpDuration = 0.45;
      this.jumpHeight = 150;
      this.jumpBase = 0;
      this.jumpFrom = 0;
      this.jumpTargetX = 0;
      this.angleFrom = 0;
      this.angleDelta = 0;
      this.squashTime = 9;
      this.squashX = 1;
      this.squashY = 1;
      this.trailTimer = 0;
      this.sparkTimer = 0;

      this.particles = [];
      this.rings = [];
      this.shapes = [];
      this.dash = null;

      this.reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (window.matchMedia) {
        const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
        const onChange = (e) => { this.reduced = e.matches; };
        if (mq.addEventListener) mq.addEventListener('change', onChange);
        else if (mq.addListener) mq.addListener(onChange);
      }

      this.resize();
      this.x = this.anchorFor(this.progress);
      this.prevX = this.x;
      this.buildShapes();

      this.onResize = () => this.resize();
      window.addEventListener('resize', this.onResize, { passive: true });

      this.onPointerMove = (event) => {
        const interactive = event.target && event.target.closest
          ? event.target.closest('a, button, input, textarea, select, dialog, .modal')
          : null;
        const hit = !interactive && this.hitTest(event.clientX, event.clientY);
        document.body.classList.toggle('is-cube-hover', hit);
      };
      window.addEventListener('pointermove', this.onPointerMove, { passive: true });
      window.addEventListener('pointerleave', () => {
        document.body.classList.remove('is-cube-hover');
      });

      this.loop = this.loop.bind(this);
      requestAnimationFrame(this.loop);
    }

    /* ── Tamaño, anclajes y figuras de fondo ───────────────────────────── */
    resize() {
      const oldW = this.w;
      this.w = window.innerWidth;
      this.h = window.innerHeight;
      this.dpr = Math.min(2, window.devicePixelRatio || 1);

      this.canvas.width = Math.round(this.w * this.dpr);
      this.canvas.height = Math.round(this.h * this.dpr);
      this.canvas.style.width = this.w + 'px';
      this.canvas.style.height = this.h + 'px';
      this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);

      if (this.dashCanvas && this.dashCtx) {
        this.dashCanvas.width = Math.round(this.w * this.dpr);
        this.dashCanvas.height = Math.round(this.h * this.dpr);
        this.dashCanvas.style.width = this.w + 'px';
        this.dashCanvas.style.height = this.h + 'px';
        this.dashCtx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
      }

      const mobile = this.w <= 820;
      this.groundH = mobile
        ? clamp(this.h * 0.14, 92, 140)
        : clamp(this.h * 0.16, 96, 170);
      this.groundY = this.h - this.groundH;

      this.size = clamp(this.w * 0.052, 46, 76);
      this.x = this.anchorFor(this.progress);
      if (this.dash && oldW && this.w !== oldW) this.dash = null;

      if (oldW && this.shapes.length) this.buildShapes();
    }

    anchorFor(progress) {
      const margin = clamp(this.w * 0.075, 32, 120);
      return margin + (this.w - margin * 2) * (clamp(progress, 0, 100) / 100);
    }

    buildShapes() {
      const count = this.w < 700 ? 9 : 15;
      let seed = 1337;
      const rand = () => {
        seed = (seed * 1664525 + 1013904223) >>> 0;
        return seed / 4294967296;
      };

      this.shapes = Array.from({ length: count }, (_, i) => ({
        x: rand() * this.w,
        y: 40 + rand() * Math.max(120, this.groundY * 0.82),
        size: 26 + rand() * 110,
        layer: 0.12 + rand() * 0.5,
        type: i % 3,
        rot: rand() * TAU,
        spin: (rand() - 0.5) * 0.35,
        alpha: 0.035 + rand() * 0.07,
      }));
    }

    /* ── API pública ───────────────────────────────────────────────────── */
    setSection(index, instant) {
      if (!this.sections[index]) return 0;
      this.section = index;
      this.progress = this.sections[index].progress;
      this.targetPalette = normalizePalette(this.sections[index].palette);

      if (instant) {
        this.palette = normalizePalette(this.sections[index].palette);
        this.x = this.anchorFor(this.progress);
        this.prevX = this.x;
        this.paletteSnap = true;
        this.dash = null;
        return 0;
      }

      const targetX = this.anchorFor(this.progress);
      const direction = targetX >= this.x ? 1 : -1;

      this.jumpTo(this.progress, {
        duration: this.reduced ? 0.45 : DASH_DURATION - 0.03,
        spin: this.w < 480 ? 180 : 360,
      });

      if (!this.reduced) {
        this.startDash(targetX, direction);
        return DASH_DURATION * 1000;
      }
      return 0;
    }

    jump() {
      if (this.airborne) return false;
      this.jumpTo(this.progress, {
        duration: 0.45,
        spin: this.w < 480 ? 360 : 180,
        inPlace: true,
      });
      return true;
    }

    setSkin(skin) {
      if (!skin) return;
      this.skinTargetBase = hexToRgb(skin.base || DEFAULT_SKIN.base);
      this.skinTargetAccent = hexToRgb(skin.accent || DEFAULT_SKIN.accent);
      this.skinPattern = skin.pattern || 'visor';

      if (!this.reduced) {
        const baseY = this.groundY - this.jumpOffset - this.size * 0.5;
        for (let i = 0; i < 16; i++) {
          const a = Math.random() * TAU;
          this.particles.push({
            x: this.x,
            y: baseY,
            vx: Math.cos(a) * (50 + Math.random() * 130),
            vy: Math.sin(a) * (50 + Math.random() * 130) - 40,
            g: 260,
            life: 0.45 + Math.random() * 0.4,
            max: 0.85,
            size: 3 + Math.random() * 5,
            rot: Math.random() * TAU,
            vr: (Math.random() - 0.5) * 10,
            color: Math.random() > 0.45 ? this.skinTargetAccent : this.skinTargetBase,
          });
        }
      }
    }

    hitTest(clientX, clientY) {
      const centerY = this.groundY - this.jumpOffset - this.size * 0.5;
      const pad = this.size * 0.34;
      return (
        Math.abs(clientX - this.x) <= this.size * 0.5 + pad &&
        Math.abs(clientY - centerY) <= this.size * 0.5 + pad
      );
    }

    /* ── Salto ─────────────────────────────────────────────────────────── */
    jumpTo(progress, options) {
      const opts = options || {};
      const target = this.anchorFor(progress);
      const distance = Math.abs(target - this.x);

      this.jumpFrom = this.x;
      this.jumpTargetX = target;
      this.jumpBase = this.jumpOffset;
      this.jumpElapsed = 0;
      this.jumpDuration = opts.duration || 0.45;
      this.angleFrom = this.angle;
      this.airborne = true;

      if (this.reduced) {
        this.jumpHeight = 26;
        this.jumpDuration = 0.16;
        this.angleDelta = 0;
      } else {
        const base = opts.inPlace
          ? clamp(this.h * 0.17, 95, 180)
          : clamp(this.h * 0.2, 110, 210);
        this.jumpHeight = base + Math.min(40, distance * 0.04);
        const direction = target < this.x ? -1 : 1;
        const spin = (opts.spin || 180) * (Math.PI / 180);
        this.angleDelta = direction * spin;
      }

      if (!this.reduced) {
        const y = this.groundY - this.jumpOffset - this.size * 0.4;
        for (let i = 0; i < 6; i++) {
          this.particles.push({
            x: this.x + (Math.random() - 0.5) * this.size,
            y,
            vx: (Math.random() - 0.5) * 90,
            vy: 20 + Math.random() * 60,
            g: 420,
            life: 0.3 + Math.random() * 0.25,
            max: 0.55,
            size: 2 + Math.random() * 4,
            rot: Math.random() * TAU,
            vr: (Math.random() - 0.5) * 9,
            color: Math.random() > 0.5 ? this.palette.accent : this.skinAccent,
          });
        }
      }
    }

    /* ── Dash gigante de transición ────────────────────────────────────── */
    startDash(targetX, direction) {
      this.dash = {
        t: 0,
        dur: DASH_DURATION,
        fromX: this.x,
        toX: targetX,
        fromY: this.groundY - this.jumpOffset - this.size * 0.5,
        toY: this.groundY - this.size * 0.5,
        arc: clamp(this.h * 0.34, 150, 310),
        spin: direction * TAU * 2,
        startAngle: this.angle,
        giant: Math.max(this.size * 3.2, Math.min(this.w * 0.42, this.h * 0.5, 380)),
        direction,
        trail: [],
        trailTimer: 0,
        seed: Math.random() * 1000,
      };

      if (!this.reduced) {
        const y = this.groundY - this.jumpOffset - this.size * 0.5;
        for (let i = 0; i < 22; i++) {
          const a = Math.random() * TAU;
          this.particles.push({
            x: this.x,
            y,
            vx: Math.cos(a) * (80 + Math.random() * 240),
            vy: Math.sin(a) * (80 + Math.random() * 200) - 40,
            g: 460,
            life: 0.35 + Math.random() * 0.5,
            max: 0.85,
            size: 3 + Math.random() * 6,
            rot: Math.random() * TAU,
            vr: (Math.random() - 0.5) * 12,
            color: Math.random() > 0.35 ? this.palette.accent : this.skinAccent,
          });
        }
      }
    }

    dashPose(t) {
      const d = this.dash;
      if (!d) return { x: 0, y: 0, size: 0, angle: 0, alpha: 1 };
      const p = clamp(t, 0, 1);

      let size;
      if (p < 0.22) {
        size = lerp(this.size, d.giant, easeOutCubic(p / 0.22));
      } else if (p < 0.58) {
        size = d.giant * (1 + 0.035 * Math.sin(((p - 0.22) / 0.36) * Math.PI));
      } else {
        size = lerp(d.giant, this.size, smoothstep((p - 0.58) / 0.42));
      }

      const x = lerp(d.fromX, d.toX, smoothstep(p));
      const y = lerp(d.fromY, d.toY, p) - Math.sin(Math.PI * p) * d.arc;
      const angle = d.startAngle + d.spin * easeOutCubic(p);
      const alpha = 1 - smoothstep(clamp((p - 0.92) / 0.08, 0, 1));

      return { x, y, size, angle, alpha };
    }

    /* ── Bucle principal ───────────────────────────────────────────────── */
    loop(now) {
      if (!this.last) this.last = now;
      let dt = (now - this.last) / 1000;
      this.last = now;
      dt = clamp(dt, 0, 0.05);
      this.time += dt;

      this.update(dt);
      this.draw();

      requestAnimationFrame(this.loop);
    }

    update(dt) {
      this.prevX = this.x;

      // Paleta: lerp exponencial (rápido pero suave).
      const pk = this.paletteSnap ? 1 : 1 - Math.exp(-dt * 4.2);
      for (const key of Object.keys(this.palette)) {
        this.palette[key] = mixRgb(this.palette[key], this.targetPalette[key], pk);
      }
      if (this.paletteSnap) this.paletteSnap = false;

      // Skin: mismo tratamiento.
      const sk = 1 - Math.exp(-dt * 7);
      this.skinBase = mixRgb(this.skinBase, this.skinTargetBase, sk);
      this.skinAccent = mixRgb(this.skinAccent, this.skinTargetAccent, sk);

      // Dash gigante: avanza, guarda estelas y termina solo.
      if (this.dash) {
        this.dash.t += dt;
        this.dash.trailTimer -= dt;
        if (this.dash.trailTimer <= 0) {
          this.dash.trailTimer = 0.022;
          this.dash.trail.unshift(this.dashPose(this.dash.t / this.dash.dur));
          if (this.dash.trail.length > 7) this.dash.trail.pop();
        }
        if (this.dash.t >= this.dash.dur) this.dash = null;
      }

      if (this.airborne) {
        this.jumpElapsed += dt;
        const t = clamp(this.jumpElapsed / this.jumpDuration, 0, 1);
        const p = smoothstep(t);

        const prevOffset = this.jumpOffset;
        this.x = lerp(this.jumpFrom, this.jumpTargetX, p);
        const arc = 4 * this.jumpHeight * t * (1 - t);
        this.jumpOffset = Math.max(arc, this.jumpBase * (1 - t));
        this.angle = this.angleFrom + this.angleDelta * easeOutCubic(t);

        const vy = (this.jumpOffset - prevOffset) / Math.max(dt, 0.001);
        const stretch = this.reduced ? 1 : clamp(1 + Math.abs(vy) * 0.00012, 1, 1.075);
        this.squashX += (1 / stretch - this.squashX) * Math.min(1, dt * 10);
        this.squashY += (stretch - this.squashY) * Math.min(1, dt * 10);

        // Estela de cuadrados mientras se desplaza.
        if (!this.reduced && Math.abs(this.jumpTargetX - this.jumpFrom) > 4) {
          this.trailTimer -= dt;
          if (this.trailTimer <= 0) {
            this.trailTimer = 0.022;
            const dir = this.jumpTargetX > this.jumpFrom ? -1 : 1;
            this.particles.push({
              x: this.x + dir * this.size * 0.36,
              y: this.groundY - this.jumpOffset - this.size * 0.5 + (Math.random() - 0.5) * this.size * 0.5,
              vx: dir * (20 + Math.random() * 70) + (Math.random() - 0.5) * 30,
              vy: (Math.random() - 0.5) * 50,
              g: 340,
              life: 0.25 + Math.random() * 0.3,
              max: 0.55,
              size: 2 + Math.random() * 4.5,
              rot: Math.random() * TAU,
              vr: (Math.random() - 0.5) * 12,
              color: Math.random() > 0.4 ? this.palette.accent : this.skinAccent,
            });
          }
        }

        if (t >= 1) {
          this.airborne = false;
          this.x = this.jumpTargetX;
          this.jumpOffset = 0;
          // El cubo aterriza siempre de pie; el giro se ha visto completo en el aire.
          this.angle = 0;
          this.squashTime = 0;
          this.squashX = 1.3;
          this.squashY = 0.72;

          if (!this.reduced) {
            this.impact(this.x, this.groundY - 2, this.palette.accent);
            this.rings.push({ x: this.x, y: this.groundY, r: this.size * 0.35, life: 1, max: 1 });
          }
          window.dispatchEvent(new CustomEvent('gd:land'));
        }
      } else {
        this.jumpOffset = 0;
        if (this.squashTime < 0.65) {
          this.squashTime += dt;
          const e = Math.exp(-this.squashTime * 12);
          const osc = Math.cos(this.squashTime * 34);
          this.squashX = 1 + 0.3 * e * osc;
          this.squashY = 1 - 0.28 * e * osc;
        } else {
          this.squashX = 1;
          this.squashY = 1;
        }

        // Chispa ambiental ocasional junto al cubo.
        this.sparkTimer -= dt;
        if (!this.reduced && this.sparkTimer <= 0) {
          this.sparkTimer = 1.4 + Math.random() * 1.6;
          this.particles.push({
            x: this.x + (Math.random() - 0.5) * this.size * 1.7,
            y: this.groundY - 6,
            vx: (Math.random() - 0.5) * 18,
            vy: -25 - Math.random() * 35,
            g: -8,
            life: 0.7 + Math.random() * 0.5,
            max: 1.2,
            size: 2 + Math.random() * 3,
            rot: Math.random() * TAU,
            vr: (Math.random() - 0.5) * 5,
            color: this.palette.accent,
          });
        }
      }

      // Scroll del mundo: avanza solo y reacciona al desplazamiento del cubo.
      const moved = this.x - this.prevX;
      this.scroll += (this.reduced ? 0 : dt * 30) + moved * 0.45;

      // Partículas.
      const limit = this.w < 700 ? 150 : 280;
      if (this.particles.length > limit) {
        this.particles.splice(0, this.particles.length - limit);
      }
      for (let i = this.particles.length - 1; i >= 0; i--) {
        const p = this.particles[i];
        p.life -= dt;
        if (p.life <= 0) {
          this.particles.splice(i, 1);
          continue;
        }
        p.vy += p.g * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.rot += p.vr * dt;
      }

      for (let i = this.rings.length - 1; i >= 0; i--) {
        const r = this.rings[i];
        r.life -= dt * 2.2;
        r.r += dt * 190;
        if (r.life <= 0) this.rings.splice(i, 1);
      }
    }

    impact(x, y, color) {
      for (let i = 0; i < 20; i++) {
        const a = (i / 20) * TAU + Math.random() * 0.35;
        const speed = 70 + Math.random() * 220;
        this.particles.push({
          x: x + (Math.random() - 0.5) * this.size * 0.6,
          y: y - Math.random() * 4,
          vx: Math.cos(a) * speed,
          vy: Math.sin(a) * speed - 70,
          g: 820,
          life: 0.4 + Math.random() * 0.45,
          max: 0.85,
          size: 2.5 + Math.random() * 5.5,
          rot: Math.random() * TAU,
          vr: (Math.random() - 0.5) * 14,
          color: Math.random() > 0.35 ? color : [255, 255, 255],
        });
      }
    }

    /* ── Dibujo ────────────────────────────────────────────────────────── */
    draw() {
      const ctx = this.ctx;
      ctx.clearRect(0, 0, this.w, this.h);

      this.drawSky(ctx);
      this.drawShapes(ctx);
      this.drawGrid(ctx);
      this.drawGround(ctx);

      // Durante el dash el cubo pequeño desaparece: lo sustituye el gigante.
      if (!this.dash) {
        this.drawShadow(ctx);
        this.drawCube(ctx);
      }

      this.drawParticles(ctx);
      this.drawRings(ctx);
      this.drawDash();
    }

    drawSky(ctx) {
      const p = this.palette;
      const grad = ctx.createLinearGradient(0, 0, 0, this.groundY);
      grad.addColorStop(0, rgbCss(p.bg2));
      grad.addColorStop(0.62, rgbCss(p.bg));
      grad.addColorStop(1, rgbCss(mixRgb(p.bg, p.accent, 0.09)));
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, this.w, this.groundY + 1);

      // Resplandor del horizonte.
      const glow = ctx.createRadialGradient(
        this.w * 0.5, this.groundY, 0,
        this.w * 0.5, this.groundY, Math.max(this.w, this.h) * 0.62
      );
      glow.addColorStop(0, rgbCss(p.accent, 0.13));
      glow.addColorStop(0.5, rgbCss(p.accent, 0.035));
      glow.addColorStop(1, rgbCss(p.accent, 0));
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, this.w, this.groundY);

      // Viñeta superior para que el HUD respire.
      const top = ctx.createLinearGradient(0, 0, 0, 130);
      top.addColorStop(0, 'rgba(2, 5, 11, 0.5)');
      top.addColorStop(1, 'rgba(2, 5, 11, 0)');
      ctx.fillStyle = top;
      ctx.fillRect(0, 0, this.w, 130);
    }

    drawShapes(ctx) {
      const p = this.palette;
      const span = this.w + 260;

      for (const s of this.shapes) {
        const drift = this.scroll * s.layer * 0.7 + this.time * 4 * s.layer;
        let x = ((s.x - drift) % span + span) % span - 130;
        const y = s.y;
        const r = s.rot + this.time * s.spin * (this.reduced ? 0 : 1);

        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(r);
        ctx.strokeStyle = rgbCss(p.accent, s.alpha);
        ctx.fillStyle = rgbCss(p.accent, s.alpha * 0.38);
        ctx.lineWidth = 1.5;

        if (s.type === 0) {
          ctx.beginPath();
          ctx.rect(-s.size / 2, -s.size / 2, s.size, s.size);
          ctx.fill();
          ctx.stroke();
        } else if (s.type === 1) {
          ctx.beginPath();
          ctx.moveTo(0, -s.size / 2);
          ctx.lineTo(s.size / 2, s.size / 2);
          ctx.lineTo(-s.size / 2, s.size / 2);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        } else {
          ctx.beginPath();
          ctx.moveTo(0, -s.size / 2);
          ctx.lineTo(s.size / 2, 0);
          ctx.lineTo(0, s.size / 2);
          ctx.lineTo(-s.size / 2, 0);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        }
        ctx.restore();
      }
    }

    drawGrid(ctx) {
      const p = this.palette;
      const spacing = this.w < 620 ? 48 : 66;
      const offset = (this.scroll * 0.34 + this.time * 12) % spacing;
      const maxY = this.groundY;

      ctx.save();
      ctx.lineWidth = 1;
      ctx.strokeStyle = rgbCss(p.accent, 0.075);
      ctx.beginPath();

      for (let x = -offset; x <= this.w + spacing; x += spacing) {
        ctx.moveTo(Math.round(x) + 0.5, 0);
        ctx.lineTo(Math.round(x) + 0.5, maxY);
      }

      const vOffset = (this.scroll * 0.12) % spacing;
      for (let y = -vOffset; y <= maxY; y += spacing) {
        ctx.moveTo(0, Math.round(y) + 0.5);
        ctx.lineTo(this.w, Math.round(y) + 0.5);
      }
      ctx.stroke();

      // Línea guía más marcada cada 4 celdas.
      ctx.strokeStyle = rgbCss(p.accent, 0.045);
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let x = -offset; x <= this.w + spacing; x += spacing * 4) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, maxY);
      }
      ctx.stroke();
      ctx.restore();
    }

    drawGround(ctx) {
      const p = this.palette;
      const y = this.groundY;
      const h = this.h - y;

      const grad = ctx.createLinearGradient(0, y, 0, this.h);
      grad.addColorStop(0, rgbCss(p.ground));
      grad.addColorStop(0.5, rgbCss(mixRgb(p.ground, p.ground2, 0.35)));
      grad.addColorStop(1, rgbCss(p.ground2));
      ctx.fillStyle = grad;
      ctx.fillRect(0, y, this.w, h);

      const spacing = this.w < 620 ? 58 : 84;
      const offset = (this.scroll * 0.9) % spacing;

      ctx.save();
      ctx.beginPath();
      ctx.rect(0, y, this.w, h);
      ctx.clip();

      // Rejilla del suelo.
      ctx.strokeStyle = rgbCss(p.accent, 0.085);
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = -offset; x <= this.w + spacing; x += spacing) {
        ctx.moveTo(x, y);
        ctx.lineTo(x + 26, this.h);
      }
      for (let gy = y + 26; gy < this.h; gy += 30) {
        ctx.moveTo(0, gy);
        ctx.lineTo(this.w, gy);
      }
      ctx.stroke();

      // Bloques que pasan a toda velocidad.
      const blockGap = spacing * 2.2;
      const blockOffset = (this.scroll * 1.35) % blockGap;
      ctx.fillStyle = rgbCss(p.accent, 0.05);
      for (let x = -blockOffset; x < this.w + blockGap; x += blockGap) {
        ctx.fillRect(x, y + 12, spacing * 0.9, 9);
        ctx.fillRect(x + spacing * 0.35, y + 52, spacing * 0.55, 6);
      }
      ctx.restore();

      // Línea de neón.
      ctx.save();
      ctx.shadowColor = rgbCss(p.accent, 0.95);
      ctx.shadowBlur = 22;
      ctx.strokeStyle = rgbCss(p.accent, 0.95);
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, y + 0.5);
      ctx.lineTo(this.w, y + 0.5);
      ctx.stroke();

      ctx.shadowBlur = 8;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.78)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, y + 1);
      ctx.lineTo(this.w, y + 1);
      ctx.stroke();
      ctx.restore();
    }

    drawShadow(ctx) {
      const p = this.palette;
      const height = this.jumpOffset;
      const shrink = clamp(1 - height / 420, 0.42, 1);
      const w = this.size * 0.94 * shrink;
      const alpha = 0.34 * shrink;

      ctx.save();
      ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`;
      ctx.beginPath();
      ctx.ellipse(this.x, this.groundY + 5, w * 0.5, 7 * shrink + 2, 0, 0, TAU);
      ctx.fill();

      // Aro de invitación cuando el cubo está quieto.
      if (!this.airborne) {
        const pulse = 0.5 + 0.5 * Math.sin(this.time * 2.4);
        ctx.strokeStyle = rgbCss(p.accent, 0.12 + pulse * 0.13);
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(this.x, this.groundY + 5, this.size * (0.6 + pulse * 0.12), 10, 0, 0, TAU);
        ctx.stroke();
      }
      ctx.restore();
    }

    drawParticles(ctx) {
      for (const p of this.particles) {
        const a = clamp(p.life / p.max, 0, 1);
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.globalAlpha = a * a;
        ctx.fillStyle = rgbCss(p.color, 1);
        const s = p.size * (0.55 + a * 0.7);
        ctx.fillRect(-s / 2, -s / 2, s, s);
        ctx.restore();
      }
      ctx.globalAlpha = 1;
    }

    drawRings(ctx) {
      const p = this.palette;
      for (const r of this.rings) {
        ctx.save();
        ctx.strokeStyle = rgbCss(p.accent, 0.42 * r.life);
        ctx.lineWidth = 2.5 * r.life + 0.5;
        ctx.beginPath();
        ctx.ellipse(r.x, r.y, r.r, r.r * 0.26, 0, 0, TAU);
        ctx.stroke();
        ctx.restore();
      }
    }

    /* El dash vive en un canvas por encima del contenido y debajo del HUD. */
    drawDash() {
      const ctx = this.dashCtx;
      if (!ctx) return;

      ctx.clearRect(0, 0, this.w, this.h);
      if (!this.dash) return;

      const d = this.dash;
      const t = clamp(d.t / d.dur, 0, 1);
      const pose = this.dashPose(t);
      const accent = this.palette.accent;
      const alpha = pose.alpha;
      const dir = d.direction;

      // Resplandor radial alrededor del cubo.
      const glow = ctx.createRadialGradient(
        pose.x, pose.y, 0,
        pose.x, pose.y, pose.size * 1.9
      );
      glow.addColorStop(0, rgbCss(accent, 0.26 * alpha));
      glow.addColorStop(0.5, rgbCss(accent, 0.07 * alpha));
      glow.addColorStop(1, rgbCss(accent, 0));
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, this.w, this.h);

      // Líneas de velocidad detrás del cubo.
      ctx.save();
      ctx.globalAlpha = alpha;
      for (let i = 0; i < 22; i++) {
        const n = Math.abs(Math.sin(d.seed + i * 12.9898) * 43758.5453) % 1;
        const y = pose.y + (n - 0.5) * pose.size * 1.8;
        const length = pose.size * (0.24 + n * 0.7);
        const startX = pose.x - dir * (pose.size * 0.58 + 14 + n * 90);
        const white = n > 0.72;
        ctx.strokeStyle = white
          ? `rgba(255, 255, 255, ${0.06 + (1 - n) * 0.16})`
          : rgbCss(accent, 0.1 + (1 - n) * 0.26);
        ctx.lineWidth = 1.5 + (1 - n) * 4;
        ctx.beginPath();
        ctx.moveTo(startX, y);
        ctx.lineTo(startX - dir * length, y);
        ctx.stroke();
      }
      ctx.restore();

      // Ondas de choque.
      ctx.save();
      for (let k = 0; k < 2; k++) {
        const local = (t - 0.14 - k * 0.16) / 0.56;
        if (local <= 0 || local >= 1) continue;
        const radius = pose.size * 0.38 + local * this.w * 0.46;
        ctx.strokeStyle = rgbCss(accent, (1 - local) * 0.2 * alpha);
        ctx.lineWidth = 2 + (1 - local) * 4;
        ctx.beginPath();
        ctx.ellipse(pose.x, pose.y, radius, radius * 0.62, 0, 0, TAU);
        ctx.stroke();
      }
      ctx.restore();

      // Estelas fantasma.
      for (let i = d.trail.length - 1; i >= 0; i--) {
        const ghost = d.trail[i];
        const ghostAlpha = alpha * (1 - i / d.trail.length) * 0.13;
        if (ghostAlpha <= 0.005) continue;
        ctx.save();
        ctx.globalAlpha = ghostAlpha;
        ctx.translate(ghost.x, ghost.y);
        ctx.rotate(ghost.angle);
        ctx.fillStyle = rgbCss(this.skinAccent, 0.9);
        roundRectPath(ctx, -ghost.size / 2, -ghost.size / 2, ghost.size, ghost.size, ghost.size * 0.16);
        ctx.fill();
        ctx.restore();
      }

      // Cubo gigante con la skin equipada.
      if (alpha > 0.001) {
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.translate(pose.x, pose.y);
        ctx.rotate(pose.angle);
        this.paintCube(ctx, pose.size, this.skinBase, this.skinAccent, this.skinPattern);
        ctx.restore();
      }
    }

    drawCube(ctx) {
      const size = this.size;
      const base = this.groundY - this.jumpOffset;

      ctx.save();
      ctx.translate(this.x, base);
      ctx.scale(this.squashX, this.squashY);
      ctx.translate(0, -size / 2);
      ctx.rotate(this.angle);
      this.paintCube(ctx, size, this.skinBase, this.skinAccent, this.skinPattern);
      ctx.restore();
    }

    /* Dibuja el cubo centrado en (0, 0). Se reutiliza para el cubo normal y
     * para el cubo gigante del dash, con cualquier tamaño y skin. */
    paintCube(ctx, size, bodyBase, accent, pattern) {
      const unit = size / 64;
      const radius = size * 0.16;

      ctx.save();

      // Halo.
      ctx.shadowColor = rgbCss(accent, 0.62);
      ctx.shadowBlur = Math.min(60, 20 * unit) + Math.sin(this.time * 3) * 3 * Math.min(unit, 2);

      // Cuerpo con bisel.
      const body = ctx.createLinearGradient(-size / 2, -size / 2, size / 2, size / 2);
      body.addColorStop(0, rgbCss(mixRgb(bodyBase, [255, 255, 255], 0.3)));
      body.addColorStop(0.46, rgbCss(bodyBase));
      body.addColorStop(1, rgbCss(mixRgb(bodyBase, [0, 0, 0], 0.42)));
      ctx.fillStyle = body;
      roundRectPath(ctx, -size / 2, -size / 2, size, size, radius);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Patrón interior.
      ctx.save();
      roundRectPath(ctx, -size / 2, -size / 2, size, size, radius);
      ctx.clip();
      this.drawPattern(ctx, size, bodyBase, accent, pattern);
      ctx.restore();

      // Bisel interior.
      ctx.lineWidth = 3 * unit;
      ctx.strokeStyle = 'rgba(3, 8, 16, 0.88)';
      roundRectPath(ctx, -size / 2, -size / 2, size, size, radius);
      ctx.stroke();

      ctx.lineWidth = 1.5 * unit;
      const inner = size / 2 - size * 0.075;
      roundRectPath(ctx, -inner, -inner, inner * 2, inner * 2, size * 0.11);
      ctx.strokeStyle = rgbCss(accent, 0.55);
      ctx.stroke();

      // Brillo superior.
      const shine = ctx.createLinearGradient(0, -size / 2, 0, 0);
      shine.addColorStop(0, 'rgba(255, 255, 255, 0.28)');
      shine.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = shine;
      roundRectPath(ctx, -size * 0.4, -size * 0.44, size * 0.8, size * 0.38, size * 0.08);
      ctx.fill();

      // Visor y ojos (simétricos: un giro de 180° se ve igual).
      const vw = size * 0.66;
      const vh = size * 0.28;
      const vy = -size * 0.02;
      ctx.fillStyle = 'rgba(2, 8, 14, 0.9)';
      roundRectPath(ctx, -vw / 2, vy - vh / 2, vw, vh, vh * 0.32);
      ctx.fill();
      ctx.strokeStyle = rgbCss(accent, 0.35);
      ctx.lineWidth = 1.2 * unit;
      ctx.stroke();

      const eyeW = size * 0.135;
      const eyeH = size * 0.145;
      const eyeGap = size * 0.055;
      ctx.shadowColor = rgbCss(accent, 1);
      ctx.shadowBlur = 8 * Math.min(unit, 3);
      ctx.fillStyle = rgbCss(mixRgb(accent, [255, 255, 255], 0.5));
      roundRectPath(ctx, -eyeGap - eyeW, vy - eyeH / 2, eyeW, eyeH, size * 0.03);
      ctx.fill();
      roundRectPath(ctx, eyeGap, vy - eyeH / 2, eyeW, eyeH, size * 0.03);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Pequeños remaches en las esquinas.
      ctx.fillStyle = rgbCss(accent, 0.42);
      const rr = size * 0.035;
      const off = size * 0.33;
      for (const sx of [-1, 1]) {
        for (const sy of [-1, 1]) {
          ctx.beginPath();
          ctx.arc(sx * off, sy * off, rr, 0, TAU);
          ctx.fill();
        }
      }

      ctx.restore();
    }

    drawPattern(ctx, size, base, accent, pattern) {
      const half = size / 2;

      if (pattern === 'gradient') {
        const g = ctx.createLinearGradient(-half, -half, half, half);
        g.addColorStop(0, rgbCss(accent, 0.5));
        g.addColorStop(0.5, rgbCss(base, 0.02));
        g.addColorStop(1, rgbCss(accent, 0.28));
        ctx.fillStyle = g;
        ctx.fillRect(-half, -half, size, size);
        return;
      }

      if (pattern === 'checker') {
        const cells = 3;
        const cell = size / cells;
        ctx.fillStyle = rgbCss(accent, 0.2);
        for (let r = 0; r < cells; r++) {
          for (let c = 0; c < cells; c++) {
            if ((r + c) % 2 === 0) {
              ctx.fillRect(-half + c * cell, -half + r * cell, cell, cell);
            }
          }
        }
        return;
      }

      if (pattern === 'stripes') {
        ctx.save();
        ctx.translate(-half, -half);
        ctx.rotate(-Math.PI / 4);
        ctx.fillStyle = rgbCss(accent, 0.22);
        const step = size * 0.22;
        for (let x = -size * 1.5; x < size * 1.5; x += step) {
          ctx.fillRect(x, -size, step * 0.45, size * 2.2);
        }
        ctx.restore();
        return;
      }

      if (pattern === 'split') {
        ctx.fillStyle = rgbCss(accent, 0.2);
        ctx.beginPath();
        ctx.moveTo(-half, half);
        ctx.lineTo(-half, -half);
        ctx.lineTo(half, -half);
        ctx.closePath();
        ctx.fill();
        return;
      }

      if (pattern === 'ring') {
        ctx.strokeStyle = rgbCss(accent, 0.36);
        ctx.lineWidth = size * 0.075;
        ctx.beginPath();
        ctx.arc(0, 0, size * 0.31, 0, TAU);
        ctx.stroke();
        ctx.strokeStyle = rgbCss(accent, 0.2);
        ctx.lineWidth = size * 0.025;
        ctx.beginPath();
        ctx.arc(0, 0, size * 0.43, 0, TAU);
        ctx.stroke();
        return;
      }

      if (pattern === 'dots') {
        ctx.fillStyle = rgbCss(accent, 0.28);
        const gap = size * 0.19;
        for (let y = -half + gap * 0.7; y < half; y += gap) {
          for (let x = -half + gap * 0.7; x < half; x += gap) {
            ctx.fillRect(x - size * 0.025, y - size * 0.025, size * 0.05, size * 0.05);
          }
        }
        return;
      }

      if (pattern === 'cross') {
        ctx.strokeStyle = rgbCss(accent, 0.26);
        ctx.lineWidth = size * 0.07;
        ctx.beginPath();
        ctx.moveTo(-half, -half);
        ctx.lineTo(half, half);
        ctx.moveTo(half, -half);
        ctx.lineTo(-half, half);
        ctx.stroke();
        return;
      }

      // 'visor' no pinta patrón de fondo: el visor ya hace de identidad.
    }
  }

  const canvas = document.getElementById('world');
  if (canvas && window.GD_DATA) {
    const dashCanvas = document.getElementById('dash-canvas');
    const world = new GDWorld(canvas, window.GD_DATA.sections, dashCanvas);

    window.GDScene = {
      setSection(index, instant) { return world.setSection(index, instant); },
      jump() { return world.jump(); },
      setSkin(skin) { world.setSkin(skin); },
      hitTest(x, y) { return world.hitTest(x, y); },
      get section() { return world.section; },
    };
  }
})();
