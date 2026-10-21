/* =============================================================================
 * game.js — Juego 3D embebido en el portafolio con Three.js.
 * Se monta dentro de la sección #juego-interactivo de index.html.
 * No redirige a otra página: se juega aquí mismo.
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

  const MOVE_SPEED = 10;
  const SPAWN_INTERVAL = 900;
  const OBSTACLE_CHANCE = 0.35;

  let scene, camera, renderer, player;
  const collectibles = [];
  const obstacles = [];
  let score = 0;
  let seconds = 0;
  let gameActive = false;
  let lastSpawn = 0;
  const keys = {};
  const clock = new THREE.Clock();

  function initThree() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x05070f);
    scene.fog = new THREE.FogExp2(0x05070f, 0.04);

    const aspect = container.clientWidth / container.clientHeight || 16 / 9;
    camera = new THREE.PerspectiveCamera(55, aspect, 0.1, 200);
    camera.position.set(0, 14, -22);
    camera.lookAt(0, 0, 0);

    renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true;

    const ambient = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambient);

    const sun = new THREE.DirectionalLight(0x4BD8E8, 1.2);
    sun.position.set(10, 20, 10);
    sun.castShadow = true;
    sun.shadow.camera.left = -25;
    sun.shadow.camera.right = 25;
    sun.shadow.camera.top = 25;
    sun.shadow.camera.bottom = -25;
    scene.add(sun);

    const fill = new THREE.PointLight(0xff5c93, 0.6);
    fill.position.set(-12, 8, 12);
    scene.add(fill);

    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(200, 200),
      new THREE.MeshStandardMaterial({ color: 0x121729, roughness: 0.9 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    const grid = new THREE.GridHelper(200, 40, 0x4BD8E8, 0x1e2a3e);
    scene.add(grid);

    player = new THREE.Mesh(
      new THREE.BoxGeometry(1.6, 1.6, 1.6),
      new THREE.MeshStandardMaterial({ color: 0x4BD8E8, roughness: 0.4, metalness: 0.2 })
    );
    player.position.y = 0.8;
    player.castShadow = true;
    scene.add(player);
  }

  function spawnObject() {
    const isObstacle = Math.random() < OBSTACLE_CHANCE;
    const x = (Math.random() - 0.5) * 34;
    const z = (Math.random() - 0.5) * 34;

    if (isObstacle) {
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(1.8, 1.8, 1.8),
        new THREE.MeshStandardMaterial({ color: 0xff5c93, roughness: 0.4 })
      );
      mesh.position.set(x, 0.9, z);
      mesh.castShadow = true;
      scene.add(mesh);
      obstacles.push({ mesh, box: new THREE.Box3() });
    } else {
      const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.7, 16, 16),
        new THREE.MeshStandardMaterial({ color: 0xffc24b, roughness: 0.2, metalness: 0.6 })
      );
      mesh.position.set(x, 0.7, z);
      mesh.castShadow = true;
      scene.add(mesh);
      collectibles.push({ mesh, box: new THREE.Box3() });
    }
  }

  function startGame() {
    score = 0;
    seconds = 0;
    if (elScore) elScore.textContent = '0';
    if (elTime) elTime.textContent = '0s';
    gameActive = true;
    if (overlay) overlay.classList.add('hidden');

    [...collectibles, ...obstacles].forEach((o) => scene.remove(o.mesh));
    collectibles.length = 0;
    obstacles.length = 0;

    player.position.set(0, 0.8, 0);
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
      const move = new THREE.Vector3();
      if (keys['KeyW'] || keys['ArrowUp']) move.z -= 1;
      if (keys['KeyS'] || keys['ArrowDown']) move.z += 1;
      if (keys['KeyA'] || keys['ArrowLeft']) move.x -= 1;
      if (keys['KeyD'] || keys['ArrowRight']) move.x += 1;
      if (move.length() > 0) move.normalize();
      player.position.add(move.multiplyScalar(MOVE_SPEED * dt));
      player.position.y = 0.8;

      player.position.x = Math.max(-26, Math.min(26, player.position.x));
      player.position.z = Math.max(-26, Math.min(26, player.position.z));

      camera.position.lerp(new THREE.Vector3(player.position.x, 14, player.position.z - 22), dt * 6);
      camera.lookAt(player.position);

      if (now - lastSpawn > SPAWN_INTERVAL) {
        spawnObject();
        lastSpawn = now;
      }

      const playerBox = new THREE.Box3().setFromObject(player);

      for (let i = collectibles.length - 1; i >= 0; i--) {
        const c = collectibles[i];
        c.mesh.rotation.y += dt * 2;
        c.mesh.rotation.x += dt * 1.5;
        c.mesh.position.y = 0.7 + Math.sin(now * 0.003 + i) * 0.15;
        c.box.setFromObject(c.mesh);
        if (playerBox.intersectsBox(c.box)) {
          scene.remove(c.mesh);
          collectibles.splice(i, 1);
          score += 1;
          if (elScore) elScore.textContent = String(score);
        }
      }

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

    renderer.render(scene, camera);
  }

  initThree();
  animate();
})();
