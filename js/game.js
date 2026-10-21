/* =============================================================================
 * game.js — Juego 3D embebido en el portafolio con Three.js.
 * Se monta dentro de la sección #juego-interactivo de index.html.
 * No redirige a otra página: se juega aquí mismo.
 *
 * Mejoras: más iluminación, escenario neón con estrellas (sprites
 * generados por código), objetos que brillan solos (emissive), halo
 * alrededor del jugador y AVISO antes de que aparezca un obstáculo
 * letal (el jugador tiene tiempo de moverse).
 * ============================================================================= */

import * as THREE from 'three';

(function () {
  'use strict';

  const canvas = document.getElementById('juego-canvas');
  const container = canvas && canvas.parentElement;
  if (!canvas || !container) return;

  const elScore = document.getElementById('juego-score');
  const elTime = document.getElementById('juego-time');
  const overlay = document.getElementById('juego-overlay');
  const btnStart = document.getElementById('juego-btn-start');
  const elTitle = document.getElementById('juego-overlay-title');
  const elText = document.getElementById('juego-overlay-text');

  const MOVE_SPEED = 12;
  const SPAWN_INTERVAL = 800;
  const OBSTACLE_CHANCE = 0.35;
  const WARNING_DELAY = 1100;   // ms de aviso antes de que el obstáculo mate

  /* ── Texturas de sprite generadas por código (no necesitan internet) ── */

  function makeCircleTexture(color, size = 64) {
    const c = document.createElement('canvas');
    c.width = size;
    c.height = size;
    const ctx = c.getContext('2d');
    const r = size / 2;
    const grad = ctx.createRadialGradient(r, r, 0, r, r, r);
    grad.addColorStop(0, color);
    grad.addColorStop(0.35, color);
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
    const tex = new THREE.CanvasTexture(c);
    tex.needsUpdate = true;
    return tex;
  }

  const starTexture = makeCircleTexture('#4BD8E8', 32);
  const glowTexture = makeCircleTexture('#ffc24b', 64);
  const warnTexture = makeCircleTexture('#ff5c93', 64);

  /* ── Estado ── */

  let scene, camera, renderer, player, playerLight;
  const collectibles = [];
  const obstacles = [];
  const warnings = [];   // { mesh, x, z, spawnAt }
  const stars = [];      // estrellas del fondo
  const floaters = [];
  let score = 0;
  let seconds = 0;
  let gameActive = false;
  let lastSpawn = 0;
  const keys = {};
  const clock = new THREE.Clock();

  function initThree() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020408);
    scene.fog = new THREE.FogExp2(0x020408, 0.018);

    const aspect = container.clientWidth / container.clientHeight || 16 / 9;
    camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 300);
    // Cámara delante del jugador: W = adelante se siente natural.
    camera.position.set(0, 18, 26);
    camera.lookAt(0, 0, 0);

    renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true;
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    /* ── Iluminación fuerte ── */
    const ambient = new THREE.AmbientLight(0xffffff, 0.95);
    scene.add(ambient);

    const sun = new THREE.DirectionalLight(0x4BD8E8, 3.0);
    sun.position.set(12, 30, 12);
    sun.castShadow = true;
    sun.shadow.camera.left = -35;
    sun.shadow.camera.right = 35;
    sun.shadow.camera.top = 35;
    sun.shadow.camera.bottom = -35;
    sun.shadow.mapSize.width = 1024;
    sun.shadow.mapSize.height = 1024;
    scene.add(sun);

    const fill = new THREE.PointLight(0xff5c93, 1.4);
    fill.position.set(-18, 12, 18);
    scene.add(fill);

    const violet = new THREE.PointLight(0x9B8CFF, 1.2);
    violet.position.set(18, 8, -18);
    scene.add(violet);

    // Luz que sigue al jugador (área inmediata brillante).
    playerLight = new THREE.PointLight(0x4BD8E8, 2.2, 20);
    playerLight.position.set(0, 2, 0);
    scene.add(playerLight);

    /* ── Suelo neón ── */
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(260, 260),
      new THREE.MeshStandardMaterial({
        color: 0x0e1426,
        roughness: 0.6,
        metalness: 0.4,
      })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    const grid = new THREE.GridHelper(260, 52, 0x1c3a5e, 0x0a0f1a);
    scene.add(grid);

    /* ── Estrellas del fondo (sprites) ── */
    for (let i = 0; i < 120; i++) {
      const sprite = new THREE.Sprite(
        new THREE.SpriteMaterial({ map: starTexture, transparent: true, opacity: 0.6 })
      );
      sprite.position.set(
        (Math.random() - 0.5) * 200,
        40 + Math.random() * 60,
        (Math.random() - 0.5) * 200
      );
      sprite.scale.set(2.5, 2.5, 1);
      scene.add(sprite);
      stars.push(sprite);
    }

    /* ── Jugador con halo ── */
    player = new THREE.Mesh(
      new THREE.BoxGeometry(1.7, 1.7, 1.7),
      new THREE.MeshStandardMaterial({
        color: 0x4BD8E8,
        roughness: 0.3,
        metalness: 0.6,
        emissive: 0x1a4d6e,
        emissiveIntensity: 0.6,
      })
    );
    player.position.y = 0.85;
    player.castShadow = true;
    scene.add(player);

    // Anillo de suelo bajo el jugador.
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.85, 1.25, 32),
      new THREE.MeshBasicMaterial({ color: 0x4BD8E8, transparent: true, opacity: 0.45 })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.03;
    player.add(ring);

    // Halo puntual que sigue al jugador.
    const halo = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: glowTexture, transparent: true, opacity: 0.35 })
    );
    halo.scale.set(5, 5, 1);
    halo.position.y = 0.05;
    player.add(halo);
  }

  function spawnObject() {
    const isObstacle = Math.random() < OBSTACLE_CHANCE;
    const x = (Math.random() - 0.5) * 42;
    const z = (Math.random() - 0.5) * 42;

    if (isObstacle) {
      // ── AVISO: marcar la zona donde caerá el obstáculo ──
      const warn = new THREE.Mesh(
        new THREE.RingGeometry(1.6, 2.4, 32),
        new THREE.MeshBasicMaterial({
          color: 0xff5c93,
          transparent: true,
          opacity: 0.55,
        })
      );
      warn.rotation.x = -Math.PI / 2;
      warn.position.set(x, 0.06, z);
      scene.add(warn);

      warnings.push({
        mesh: warn,
        x,
        z,
        spawnAt: performance.now() + WARNING_DELAY,
      });
    } else {
      const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.85, 20, 20),
        new THREE.MeshStandardMaterial({
          color: 0xffc24b,
          roughness: 0.15,
          metalness: 0.8,
          emissive: 0xff8a00,
          emissiveIntensity: 1.4,
        })
      );
      mesh.position.set(x, 0.85, z);
      mesh.castShadow = true;
      scene.add(mesh);
      collectibles.push({ mesh, box: new THREE.Box3() });
    }
  }

  function spawnFloater() {
    const mesh = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.5, 1),
      new THREE.MeshStandardMaterial({
        color: 0x9B8CFF,
        roughness: 0.2,
        metalness: 0.9,
        emissive: 0x4a2c8a,
        emissiveIntensity: 0.8,
      })
    );
    mesh.position.set(
      (Math.random() - 0.5) * 40,
      2 + Math.random() * 6,
      (Math.random() - 0.5) * 40
    );
    scene.add(mesh);
    floaters.push({
      mesh,
      offset: Math.random() * Math.PI * 2,
      speed: 0.5 + Math.random(),
      amp: 0.5 + Math.random(),
    });
  }

  function startGame() {
    score = 0;
    seconds = 0;
    if (elScore) elScore.textContent = '0';
    if (elTime) elTime.textContent = '0s';
    gameActive = true;
    if (overlay) overlay.classList.add('hidden');

    // Limpiar todo lo previo
    [...collectibles, ...obstacles, ...warnings, ...floaters].forEach((o) =>
      o.mesh ? scene.remove(o.mesh) : null
    );
    collectibles.length = 0;
    obstacles.length = 0;
    warnings.length = 0;
    floaters.length = 0;

    for (let i = 0; i < 6; i++) spawnFloater();

    player.position.set(0, 0.85, 0);
    playerLight.position.copy(player.position);
    lastSpawn = performance.now();
  }

  function gameOver() {
    gameActive = false;
    if (elTitle) elTitle.textContent = 'Game Over';
    if (elText) elText.textContent = `Recogiste ${score} esferas en ${seconds}s.`;
    if (btnStart) btnStart.textContent = 'Jugar de nuevo';
    if (overlay) overlay.classList.remove('hidden');
  }

  if (btnStart) {
    btnStart.addEventListener('click', () => {
      if (!gameActive) startGame();
    });
  }

  window.addEventListener('keydown', (e) => { keys[e.code] = true; });
  window.addEventListener('keyup', (e) => { keys[e.code] = false; });

  function resize() {
    if (!camera || !renderer) return;
    const aspect = container.clientWidth / container.clientHeight || 16 / 9;
    camera.aspect = aspect;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
  }
  window.addEventListener('resize', resize);

  function animate() {
    requestAnimationFrame(animate);

    const dt = clock.getDelta();
    const now = performance.now();

    if (gameActive) {
      // Movimiento en el plano XZ.
      // Cámara delante: W = z -= 1 (adelante, alejarse de cámara).
      const move = new THREE.Vector3();
      if (keys['KeyW'] || keys['ArrowUp']) move.z -= 1;
      if (keys['KeyS'] || keys['ArrowDown']) move.z += 1;
      if (keys['KeyA'] || keys['ArrowLeft']) move.x -= 1;
      if (keys['KeyD'] || keys['ArrowRight']) move.x += 1;
      if (move.length() > 0) move.normalize();
      player.position.add(move.multiplyScalar(MOVE_SPEED * dt));
      player.position.y = 0.85;

      player.position.x = Math.max(-34, Math.min(34, player.position.x));
      player.position.z = Math.max(-34, Math.min(34, player.position.z));

      playerLight.position.set(player.position.x, 2, player.position.z);

      // Cámara sigue al jugador desde delante (suave).
      camera.position.lerp(new THREE.Vector3(player.position.x, 18, player.position.z + 26), dt * 7);
      camera.lookAt(player.position);

      // Rotar jugador ligeramente según movimiento.
      if (move.length() > 0) {
        player.rotation.y = Math.atan2(move.x, -move.z);
      }

      // ── Procesar avisos de obstáculos ──
      const stillWarnings = [];
      for (const w of warnings) {
        if (now >= w.spawnAt) {
          // Materializar el obstáculo real en la zona avisada.
          const mesh = new THREE.Mesh(
            new THREE.BoxGeometry(2.0, 2.0, 2.0),
            new THREE.MeshStandardMaterial({
              color: 0xff5c93,
              roughness: 0.3,
              metalness: 0.5,
              emissive: 0x33001a,
              emissiveIntensity: 1.2,
            })
          );
          mesh.position.set(w.x, 1.0, w.z);
          mesh.castShadow = true;
          scene.add(mesh);
          obstacles.push({ mesh, box: new THREE.Box3() });

          scene.remove(w.mesh);
        } else {
          stillWarnings.push(w);
        }
      }
      warnings.length = 0;
      warnings.push(...stillWarnings);

      // Parpadeo de los avisos restantes.
      warnings.forEach((w) => {
        const t = Math.sin(now * 0.01);
        w.mesh.material.opacity = 0.35 + 0.45 * Math.abs(t);
        w.mesh.scale.setScalar(0.9 + 0.15 * Math.abs(t));
      });

      // Spawnear objetos.
      if (now - lastSpawn > SPAWN_INTERVAL) {
        spawnObject();
        lastSpawn = now;
      }

      // Floaters flotando.
      floaters.forEach((f) => {
        f.mesh.position.y = 2 + Math.sin(now * 0.002 * f.speed + f.offset) * f.amp;
        f.mesh.rotation.y += dt * 0.8;
        f.mesh.rotation.x += dt * 0.5;
      });

      const playerBox = new THREE.Box3().setFromObject(player);

      // Esferas coleccionables: rotan, flotan, brillan.
      for (let i = collectibles.length - 1; i >= 0; i--) {
        const c = collectibles[i];
        c.mesh.rotation.y += dt * 3;
        c.mesh.rotation.x += dt * 2;
        c.mesh.position.y = 0.85 + Math.sin(now * 0.005 + i) * 0.22;
        c.box.setFromObject(c.mesh);
        if (playerBox.intersectsBox(c.box)) {
          scene.remove(c.mesh);
          collectibles.splice(i, 1);
          score += 1;
          if (elScore) elScore.textContent = String(score);
        }
      }

      // Obstáculos: chocar termina el juego.
      for (let i = obstacles.length - 1; i >= 0; i--) {
        const o = obstacles[i];
        o.box.setFromObject(o.mesh);
        if (playerBox.intersectsBox(o.box)) {
          gameOver();
          return;
        }
      }

      seconds += dt;
      if (elTime) elTime.textContent = `${Math.floor(seconds)}s`;
    }

    // Parpadeo suave de las estrellas.
    stars.forEach((s, i) => {
      s.material.opacity = 0.4 + 0.35 * Math.sin(now * 0.002 + i);
    });

    renderer.render(scene, camera);
  }

  initThree();
  animate();
})();
