/* =============================================================================
 * fx.js — efectos de canvas del portafolio.
 *
 * Tres piezas, todas generadas con código (no hay imágenes de fondo):
 *   1. cube()  → el cubo de vóxeles que flota en el hero.
 *   2. mark()  → la marca pequeña de la barra de navegación (el mismo cubo).
 *   3. cover() → la portada procedural de las tarjetas que todavía no tienen
 *                captura: parece una captura de un nivel de arcade.
 *
 * Todo es determinista: la misma semilla da siempre el mismo resultado.
 * ========================================================================== */
(function () {
  'use strict';

  /* ── Utilidades de color y aleatoriedad ──────────────────────────────── */

  // Lee una variable CSS del :root (los colores viven en style.css).
  const cssVar = (name) =>
    getComputedStyle(document.documentElement).getPropertyValue(name).trim();

  // PRNG mulberry32: rápido y reproducible a partir de una semilla.
  function rng(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // Hash de cadena a entero de 32 bits (FNV-1a). Se usa para el id del proyecto.
  function hash(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619);
    return h >>> 0;
  }

  // Convierte "#rrggbb" a [r,g,b].
  function hex2rgb(hex) {
    const h = hex.replace('#', '');
    const n = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }

  // Mezcla dos colores hex. t=0 → a, t=1 → b.
  function mix(a, b, t) {
    const A = hex2rgb(a), B = hex2rgb(b);
    return `rgb(${Math.round(A[0] + (B[0] - A[0]) * t)},${
      Math.round(A[1] + (B[1] - A[1]) * t)},${
      Math.round(A[2] + (B[2] - A[2]) * t)})`;
  }

  /* ── Rotaciones y proyección isométrica ──────────────────────────────── */

  const COS30 = Math.cos(Math.PI / 6);
  const SIN30 = 0.5;

  // Giro alrededor del eje Y (horizontal).
  function rotY(p, a) {
    const c = Math.cos(a), s = Math.sin(a);
    return { x: p.x * c + p.z * s, y: p.y, z: -p.x * s + p.z * c };
  }

  // Inclinación alrededor del eje X: con phi > 0 se ve la cara de arriba.
  function rotX(p, a) {
    const c = Math.cos(a), s = Math.sin(a);
    return { x: p.x, y: p.y * c - p.z * s, z: p.y * s + p.z * c };
  }

  // Proyección isométrica clásica: la base X cae a la derecha, la Z a la izquierda.
  function project(p) {
    return { x: (p.x - p.z) * COS30, y: (p.x + p.z) * SIN30 - p.y };
  }

  /* ── El cubo de vóxeles ──────────────────────────────────────────────── */

  // Descripción de las 6 caras: normal, centro y los dos ejes del plano.
  const FACES = [
    { n: { x: 1, y: 0, z: 0 }, fc: { x: 1, y: 0, z: 0 }, u: { x: 0, y: 0, z: 1 }, v: { x: 0, y: 1, z: 0 } },
    { n: { x: -1, y: 0, z: 0 }, fc: { x: -1, y: 0, z: 0 }, u: { x: 0, y: 0, z: 1 }, v: { x: 0, y: 1, z: 0 } },
    { n: { x: 0, y: 1, z: 0 }, fc: { x: 0, y: 1, z: 0 }, u: { x: 1, y: 0, z: 0 }, v: { x: 0, y: 0, z: 1 } },
    { n: { x: 0, y: -1, z: 0 }, fc: { x: 0, y: -1, z: 0 }, u: { x: 1, y: 0, z: 0 }, v: { x: 0, y: 0, z: 1 } },
    { n: { x: 0, y: 0, z: 1 }, fc: { x: 0, y: 0, z: 1 }, u: { x: 1, y: 0, z: 0 }, v: { x: 0, y: 1, z: 0 } },
    { n: { x: 0, y: 0, z: -1 }, fc: { x: 0, y: 0, z: -1 }, u: { x: 1, y: 0, z: 0 }, v: { x: 0, y: 1, z: 0 } },
  ];

  // Multiplica un punto por un eje (suma de componentes).
  const scaleAxis = (axis, k) => ({ x: axis.x * k, y: axis.y * k, z: axis.z * k });

  /**
   * Dibuja el cubo de vóxeles en el canvas.
   * @param {HTMLCanvasElement} canvas
   * @param {object} opts  n (celdas por arista), seed, angle, tilt, size, palette, gap
   */
  function drawCube(canvas, opts) {
    const o = Object.assign(
      { n: 4, seed: 1, angle: 0, tilt: 0.38, size: 1, palette: null, gap: 0.1 },
      opts
    );

    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = rect.width || canvas.clientWidth || 300;
    const h = rect.height || canvas.clientHeight || 300;

    // Solo se redimensiona el buffer cuando de verdad cambia: reasignar
    // canvas.width en cada fotograma reinicia el contexto y reserva memoria
    // nueva 60 veces por segundo sin necesidad.
    const bw = Math.round(w * dpr);
    const bh = Math.round(h * dpr);
    if (canvas.width !== bw || canvas.height !== bh) {
      canvas.width = bw;
      canvas.height = bh;
    }

    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    const pal = o.palette || [
      cssVar('--cyan') || '#4BD8E8',
      cssVar('--lime') || '#7DF05C',
      cssVar('--amber') || '#FFC24B',
      cssVar('--magenta') || '#FF5C93',
      cssVar('--violet') || '#9B8CFF',
    ].filter(Boolean);

    const n = o.n;
    const s = (o.size || Math.min(w, h) * 0.19);   // arista de una celda
    const half = (n * s) / 2;

    // Centro de cada cara (ya escalado) y los dos ejes del plano (unitarios).
    const faces = FACES.map((f) => ({
      n: f.n,
      fc: scaleAxis(f.fc, half),
      u: f.u,
      v: f.v,
    }));

    // 1) Rotar el cubo y quedarse solo con las caras que miran a la cámara.
    const rot = (p) => rotX(rotY(p, o.angle), o.tilt);
    const visible = faces
      .map((f) => {
        const n = rot(f.n);
        return { f, n, depth: rot(f.fc).z };
      })
      .filter((f) => f.n.z > 0.02)          // la cámara mira desde +z
      .sort((a, b) => a.depth - b.depth);  // de lejos a cerca (pintor)

    // Resplandor suave detrás del cubo: lo despega del fondo.
    const glow = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h) * 0.45);
    glow.addColorStop(0, 'rgba(75,216,232,.10)');
    glow.addColorStop(0.5, 'rgba(75,216,232,.04)');
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, w, h);

    // 2) Dibujar celda a celda. Cada celda es un cuadrilátero proyectado desde
    //    sus cuatro esquinas reales: así el cubo tiene volumen de verdad.
    //    `gap` abre una junta entre celdas para que se lea la estructura.
    const q = 0.5 - o.gap / 2;            // media celda menos la junta
    const corners = [
      [-q, -q], [q, -q], [q, q], [-q, q],
    ];

    for (const { f } of visible) {
      for (let a = 0; a < n; a++) {
        for (let b = 0; b < n; b++) {
          // Desplazamiento de la celda dentro de la cara.
          const du = (a - (n - 1) / 2) * s;
          const dv = (b - (n - 1) / 2) * s;

          // Cuatro esquinas de la celda, en espacio 3D y ya proyectadas.
          const pts = corners.map(([cu, cv]) => {
            // Desplazamiento en píxeles dentro del plano de la cara.
            const ou = du + cu * s;
            const ov = dv + cv * s;
            const p = {
              x: f.fc.x + f.u.x * ou + f.v.x * ov,
              y: f.fc.y + f.u.y * ou + f.v.y * ov,
              z: f.fc.z + f.u.z * ou + f.v.z * ov,
            };
            const r = rot(p);
            const s2 = project(r);
            return { x: w / 2 + s2.x, y: h / 2 + s2.y };
          });

          // Color: la misma celda siempre con el mismo color (depende de la semilla).
          const r = rng(o.seed ^ (a * 73856093) ^ (b * 19349663));
          const base = pal[Math.floor(r() * pal.length) % pal.length];

          ctx.fillStyle = base;
          ctx.globalAlpha = 0.95;
          ctx.beginPath();
          ctx.moveTo(pts[0].x, pts[0].y);
          for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
          ctx.closePath();
          ctx.fill();
          ctx.globalAlpha = 1;
        }
      }
    }
  }

  /* ── Cubo animado del hero ───────────────────────────────────────────── */

  /**
   * Cubo del hero: gira solo, sigue al puntero con suavidad y se recoloca al
   * cambiar el tamaño de la ventana.
   */
  function cube(canvas) {
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    let seed = 0;
    let angle = 0.6;
    let targetAngle = 0.6;
    let pointer = { x: 0, y: 0 };     // desplazamiento por el ratón
    let pointerTarget = { x: 0, y: 0 };
    let raf = 0;
    let last = 0;

    function frame(now) {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;

      // Giro propio + un empujón hacia donde apunta el ratón.
      angle += dt * 0.35;
      pointer.x += (pointerTarget.x - pointer.x) * 0.06;
      pointer.y += (pointerTarget.y - pointer.y) * 0.06;

      drawCube(canvas, {
        n: 4,
        seed,
        angle: angle + pointer.x,
        tilt: 0.38 + pointer.y,
        size: Math.min(canvas.getBoundingClientRect().width, canvas.getBoundingClientRect().height) * 0.17,
      });

      raf = requestAnimationFrame(frame);
    }

    function start() {
      if (reduced) { drawCube(canvas, { n: 4, seed, angle: 0.6, tilt: 0.38, size: 220 }); return; }
      last = performance.now();
      raf = requestAnimationFrame(frame);
    }

    // El puntero inclina el cubo; en táctil no hay puntero y se queda quieto.
    addEventListener('pointermove', (e) => {
      const nx = (e.clientX / innerWidth) * 2 - 1;
      const ny = (e.clientY / innerHeight) * 2 - 1;
      pointerTarget = { x: nx * 0.55, y: -ny * 0.28 };
    }, { passive: true });

    // Recalcular al redimensionar (el tamaño de celda depende del viewport).
    let t;
    addEventListener('resize', () => {
      clearTimeout(t);
      t = setTimeout(() => { if (reduced) drawCube(canvas, { n: 4, seed, angle: 0.6, tilt: 0.38, size: 220 }); }, 150);
    });

    return {
      setSeed(s) { seed = s >>> 0; },
      redraw() { drawCube(canvas, { n: 4, seed, angle: 0.6, tilt: 0.38, size: 220 }); },
      start,
      stop() { cancelAnimationFrame(raf); },
    };
  }

  /* ── Marca de la barra de navegación ─────────────────────────────────── */

  /** La marca es el mismo cubo, quieto y con menos celdas. */
  function mark(canvas) {
    drawCube(canvas, {
      n: 2,
      seed: 7,
      angle: 0.72,
      tilt: 0.42,
      size: 9,
      gap: 0.16,
    });
  }

  /* ── Portada procedural para tarjetas sin captura ─────────────────────── */

  // Ruido de valor 1D suavizado: sirve para dibujar siluetas de montañas.
  function noise1(seed, x) {
    const i = Math.floor(x);
    const f = x - i;
    const a = rng(seed + i * 9781)();
    const b = rng(seed + (i + 1) * 9781)();
    const u = f * f * (3 - 2 * f);
    return a * (1 - u) + b * u;
  }

  // Ruido fraccionario: varias capas de ruido a distinta escala.
  function fbm(seed, x) {
    return noise1(seed, x) * 0.6 + noise1(seed + 77, x * 2.3) * 0.27 + noise1(seed + 151, x * 4.7) * 0.13;
  }

  /**
   * Dibuja una portada que parece una captura de un nivel: cielo en bandas,
   * un astro, montañas de fondo y suelo. Todo a partir de la semilla.
   */
  function cover(canvas, seed, accent) {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = rect.width || 320;
    const h = rect.height || 200;

    // Igual que en drawCube: el buffer solo se toca cuando cambia de tamaño.
    const bw = Math.round(w * dpr);
    const bh = Math.round(h * dpr);
    if (canvas.width !== bw || canvas.height !== bh) {
      canvas.width = bw;
      canvas.height = bh;
    }

    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = false;

    const voidC = cssVar('--void') || '#0A0D18';
    const panelC = cssVar('--panel-2') || '#182036';
    const inkC = cssVar('--ink') || '#E9EDFB';
    const acc = accent || cssVar('--cyan') || '#4BD8E8';

    // Escala de píxel: la escena se resuelve en celdas y se amplía.
    const cell = Math.max(4, Math.round(w / 80));
    const cols = Math.ceil(w / cell);
    const rows = Math.ceil(h / cell);

    const r = rng(seed);
    const sunCol = Math.floor(r() * 3);
    const sunX = 0.15 + r() * 0.7;
    const sunY = 0.18 + r() * 0.25;
    const sunR = 0.05 + r() * 0.05;

    // Cielo: degradado en bandas discretas (estética de pixel art).
    for (let y = 0; y < rows; y++) {
      const t = y / rows;
      let col;
      if (t < 0.55) col = mix(voidC, mix(voidC, acc, 0.35), t / 0.55);
      else if (t < 0.72) col = mix(mix(voidC, acc, 0.35), acc, (t - 0.55) / 0.17);
      else col = mix(acc, panelC, Math.min(1, (t - 0.72) / 0.28));
      ctx.fillStyle = col;
      ctx.fillRect(0, y * cell, w, cell);
    }

    // Estrellas: píxeles dispersos en la parte alta.
    ctx.fillStyle = inkC;
    for (let i = 0; i < cols * 0.9; i++) {
      const x = Math.floor(r() * cols);
      const y = Math.floor(r() * rows * 0.45);
      ctx.globalAlpha = 0.25 + r() * 0.5;
      ctx.fillRect(x * cell, y * cell, cell, cell);
    }
    ctx.globalAlpha = 1;

    // Astro: disco de píxeles.
    const sx = sunX * cols, sy = sunY * rows, sr = sunR * cols;
    const sunPal = [accent, inkC, '#FF5C93'];
    ctx.fillStyle = sunPal[sunCol] || acc;
    for (let y = -sr; y <= sr; y++) {
      for (let x = -sr; x <= sr; x++) {
        if (x * x + y * y > sr * sr) continue;
        ctx.fillRect(Math.round(sx + x) * cell, Math.round(sy + y) * cell, cell, cell);
      }
    }

    // Montañas: dos siluetas generadas con ruido.
    const horizon = Math.round(rows * 0.66);
    const layers = [
      { amp: rows * 0.16, base: horizon - rows * 0.02, col: mix(panelC, voidC, 0.35), off: 0 },
      { amp: rows * 0.11, base: horizon + rows * 0.03, col: mix(voidC, acc, 0.12), off: 31 },
    ];
    for (const layer of layers) {
      ctx.fillStyle = layer.col;
      for (let x = 0; x < cols; x++) {
        const hgt = (fbm(seed + layer.off, x * 0.18) - 0.35) * layer.amp * 2;
        const top = Math.max(0, Math.round(layer.base + hgt));
        ctx.fillRect(x * cell, top * cell, cell, (rows - top) * cell);
      }
    }

    // Suelo.
    ctx.fillStyle = mix(voidC, '#000000', 0.35);
    ctx.fillRect(0, (rows - 3) * cell, w, 3 * cell);
    ctx.fillStyle = mix(acc, voidC, 0.55);
    ctx.fillRect(0, (rows - 3) * cell, w, cell);

    // Protagonista: una figura de píxeles sobre el suelo.
    const hx = Math.floor(cols * (0.22 + r() * 0.5));
    const hy = rows - 4;
    ctx.fillStyle = inkC;
    ctx.fillRect(hx * cell, hy * cell, cell, cell);                       // cabeza
    ctx.fillStyle = accent;
    ctx.fillRect(hx * cell, (hy + 1) * cell, cell, 2 * cell);             // cuerpo
    ctx.fillRect((hx - 1) * cell, (hy + 1) * cell, cell, cell);           // brazo
    ctx.fillRect((hx + 1) * cell, (hy + 3) * cell, cell, cell);           // pierna

    // Viñeta para que el texto de la tarjeta resalte encima.
    const grd = ctx.createLinearGradient(0, h * 0.4, 0, h);
    grd.addColorStop(0, 'rgba(10,13,24,0)');
    grd.addColorStop(1, 'rgba(10,13,24,.75)');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, w, h);
  }

  window.FX = { cube, mark, cover, drawCube, hash, rng };
})();
