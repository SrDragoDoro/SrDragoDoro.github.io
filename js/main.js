/* =============================================================================
 * main.js — Controlador del portafolio.
 *
 * · Navegación entre las cuatro secciones y barra de progreso.
 * · Carrusel de proyectos + modal con el brief técnico.
 * · Garage de skills conectado al skin del cubo.
 * · Contacto, copiado al portapapeles y notificaciones de logro.
 * · Teclado, swipe y accesibilidad.
 * ========================================================================== */

(function () {
  'use strict';

  const DATA = window.GD_DATA;
  const scene = window.GDScene;
  const sound = window.GDAudio;

  const $ = (selector, root) => (root || document).querySelector(selector);
  const $$ = (selector, root) => Array.from((root || document).querySelectorAll(selector));

  const DIFFICULTY = {
    normal: { label: 'NORMAL', color: '#7DF05C' },
    harder: { label: 'HARDER', color: '#FFB020' },
    insane: { label: 'INSANE', color: '#FF4D6D' },
    demon: { label: 'DEMON', color: '#B026FF' },
  };

  const state = {
    section: 0,
    project: { juegos: 0, creaciones: 0 },
    video: 0,
    skill: 0,
    transitioning: false,
    curtain: false,
    modalProject: null,
    toastTimer: 0,
    readout: 0,
    readoutFrame: 0,
  };

  const els = {};
  let screens = [];
  let modalVideo = null;
  const carousels = {};
  const videoPlayers = {};
  let parallaxPending = false;

  /* ── Utilidades ────────────────────────────────────────────────────── */
  const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

  function initials(name) {
    return String(name).replace(/[^a-zA-Z0-9]/g, '').slice(0, 2).toUpperCase();
  }

  function escapeText(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function difficultyHtml(project) {
    const diff = DIFFICULTY[project.difficulty] || DIFFICULTY.normal;
    return `
      <div class="difficulty" role="img" aria-label="Dificultad: ${diff.label}" style="--diff:${diff.color};color:${diff.color}">
        ${difficultyFace(project.difficulty)}
        <b>${diff.label}</b>
      </div>`;
  }

  function difficultyFace(key) {
    const open = '<svg viewBox="0 0 64 64" aria-hidden="true">';
    const face = '<circle cx="32" cy="32" r="27" fill="currentColor" fill-opacity=".13" stroke="currentColor" stroke-width="3"/>';
    const close = '</svg>';

    if (key === 'harder') {
      return open + face +
        '<path d="M18 26l8 4M46 26l-8 4" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round"/>' +
        '<circle cx="25" cy="32" r="3.2" fill="currentColor"/>' +
        '<circle cx="39" cy="32" r="3.2" fill="currentColor"/>' +
        '<rect x="21" y="39" width="22" height="9" rx="2.5" fill="none" stroke="currentColor" stroke-width="2.6"/>' +
        '<path d="M28 39v9M37 39v9" stroke="currentColor" stroke-width="1.8"/>' +
        close;
    }

    if (key === 'insane') {
      return open + face +
        '<circle cx="24" cy="29" r="5.5" fill="none" stroke="currentColor" stroke-width="2.6"/>' +
        '<circle cx="40" cy="29" r="5.5" fill="none" stroke="currentColor" stroke-width="2.6"/>' +
        '<circle cx="24" cy="30" r="1.8" fill="currentColor"/>' +
        '<circle cx="40" cy="30" r="1.8" fill="currentColor"/>' +
        '<path d="M20 40l6 3 6-4 6 4 6-3v5l-6 4-6-3-6 3-6-4z" fill="currentColor"/>' +
        close;
    }

    if (key === 'demon') {
      return open + face +
        '<path d="M14 13l9 12M50 13l-9 12" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round"/>' +
        '<path d="M18 29l9 4-9 3zM46 29l-9 4 9 3z" fill="currentColor"/>' +
        '<path d="M19 43l5-4 5 4 5-4 5 4 5-4 5 4-4 6H24z" fill="currentColor"/>' +
        close;
    }

    // Normal
    return open + face +
      '<circle cx="24" cy="29" r="3.6" fill="currentColor"/>' +
      '<circle cx="40" cy="29" r="3.6" fill="currentColor"/>' +
      '<path d="M22 38c3 5 7 7 10 7s7-2 10-7" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round"/>' +
      close;
  }

  function barHtml(bar, accent) {
    return `
      <div class="bar" style="--bar-color:${accent};--value:${bar.value}%">
        <div class="bar__top"><span>${escapeText(bar.label)}</span><b>${bar.value}%</b></div>
        <div class="bar__track"><div class="bar__fill"></div></div>
      </div>`;
  }

  /* ── Iconos ────────────────────────────────────────────────────────── */
  const SKILL_ICONS = {
    csharp: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.6l8 4.6v9.6l-8 4.6-8-4.6V7.2z"/><path d="M9.4 8.6l-1.1 6.8M14.7 8.6l-1.1 6.8M7.8 11.2h7.6M7.4 13.9h7.6"/></svg>',
    cpp: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.6l8 4.6v9.6l-8 4.6-8-4.6V7.2z"/><path d="M9 9.2v5.6M6.2 12h5.6M17 9.2v5.6M14.2 12h5.6"/></svg>',
    unity: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.8l8 4.4v9.6l-8 4.4-8-4.4V7.2z"/><path d="M4.2 7.3L12 11.6l7.8-4.3M12 11.6v9.6"/></svg>',
    unreal: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M8 6.8v5.4a4 4 0 008 0V6.8"/><path d="M8 17.2h8"/></svg>',
    godot: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4.5" y="7" width="15" height="11" rx="5"/><circle cx="9.4" cy="12" r="1.2" fill="currentColor" stroke="none"/><circle cx="14.6" cy="12" r="1.2" fill="currentColor" stroke="none"/><path d="M8 18v2M16 18v2M12 7V4"/></svg>',
    shader: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l8.2 16H3.8z"/><path d="M12 3v16M7.2 12h9.6"/></svg>',
    git: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="7" cy="5" r="2.2"/><circle cx="7" cy="19" r="2.2"/><circle cx="17" cy="9" r="2.2"/><path d="M7 7.2v9.6M17 11.2v1.8c0 3-3 4.2-6 4.2"/></svg>',
    physics: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="2.3"/><ellipse cx="12" cy="12" rx="9" ry="3.8"/><ellipse cx="12" cy="12" rx="3.8" ry="9" transform="rotate(45 12 12)"/></svg>',
  };

  const ACTION_ICONS = {
    cv: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 2.8h8l4 4V21H6z"/><path d="M14 2.8V7h4M9 12h6M9 15.5h6"/></svg>',
    github: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 19.2c-4 1.2-4-2-5.6-2.5M15 21v-3.4c0-1 .1-1.4-.5-2 2.8-.3 5.6-1.4 5.6-6a4.8 4.8 0 00-1.3-3.3 4.5 4.5 0 00-.1-3.3s-1-.3-3.3 1.3a11.2 11.2 0 00-6 0C6.8 2.7 5.8 3 5.8 3a4.5 4.5 0 00-.1 3.3A4.8 4.8 0 004.4 9.6c0 4.6 2.8 5.7 5.6 6-.6.6-.6 1.2-.5 2V21"/></svg>',
    linkedin: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5.5 9.5V20M5.5 5.5v.1M10 20v-6.2a3.2 3.2 0 016.4 0V20"/></svg>',
    itch: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8.5h16v9a2 2 0 01-2 2H6a2 2 0 01-2-2z"/><path d="M8 8.5V6a4 4 0 018 0v2.5M8 13h.1M16 13h.1M9 16.5h6"/></svg>',
    mail: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="M4 6.5l8 6 8-6"/></svg>',
    link: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10.5 13.5l3-3M8.2 16.8l-1.4 1.4a3.5 3.5 0 01-5-5l2.8-2.8a3.5 3.5 0 015 0M15.8 7.2l1.4-1.4a3.5 3.5 0 015 5l-2.8 2.8a3.5 3.5 0 01-5 0"/></svg>',
    release: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12V5a2 2 0 012-2h7l9 9-9 9z"/><circle cx="7.5" cy="7.5" r="1.4" fill="currentColor" stroke="none"/></svg>',
  };

  /* ── Render del perfil ─────────────────────────────────────────────── */
  function renderProfile() {
    const p = DATA.profile;
    setText('player-alias', p.alias);
    setText('player-role', p.role);
    setText('player-role-2', p.role);
    setText('player-tagline', p.tagline);
    setText('player-name', p.fullName);
    setText('player-availability', p.availability);

    if (els.avatar) {
      els.avatar.src = p.avatar;
      els.avatar.alt = `Retrato de ${p.fullName}`;
    }

    setText('player-bio', DATA.stats.bio);
    setText('contact-title', DATA.contact.title);
    setText('contact-lead', DATA.contact.lead);
    setText('contact-note', DATA.contact.note);

    const note = document.createElement('p');
    note.className = 'player-card__note';
    note.textContent = DATA.stats.note;
    $('.player-card').appendChild(note);

    els.statsGrid.innerHTML = DATA.stats.items.map((item) => `
      <div class="stat">
        <b>${escapeText(item.value)}</b>
        <span>${escapeText(item.label)}</span>
      </div>`).join('');
  }

  function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  }

  /* ── HUD / barra de progreso ───────────────────────────────────────── */
  function sectionIndexFor(requested) {
    const aliases = {
      proyectos: 'juegos',
      niveles: 'juegos',
      skills: 'sobre-mi',
      stats: 'sobre-mi',
      icon: 'sobre-mi',
    };
    const id = aliases[requested] || requested;
    return DATA.sections.findIndex(
      (section) => section.id === id || String(section.progress) === id
    );
  }

  function renderLevelNodes() {
    els.nodes.innerHTML = DATA.sections.map((section, index) => `
      <button class="node" type="button" data-goto="${index}" style="left:${section.progress}%" aria-label="${escapeText(section.label)}, ${section.progress}%">
        <span class="node__label"><span class="node__pct">${section.progress}%</span> ${escapeText(section.label)}</span>
      </button>`).join('');
  }

  function setHud(index, instant) {
    const section = DATA.sections[index];
    if (!section) return;

    els.fill.style.width = section.progress + '%';
    els.levelbar.setAttribute('aria-valuenow', String(section.progress));
    els.levelbar.setAttribute('aria-valuetext', `${section.label}: ${section.progress}%`);

    $$('.node', els.nodes).forEach((node, i) => {
      const active = i === index;
      node.classList.toggle('is-active', active);
      if (active) node.setAttribute('aria-current', 'step');
      else node.removeAttribute('aria-current');
    });

    els.prevSection.disabled = index === 0;
    els.nextSection.disabled = index === DATA.sections.length - 1;

    if (instant) {
      state.readout = section.progress;
      els.readout.textContent = section.progress + '%';
      cancelAnimationFrame(state.readoutFrame);
    } else {
      animateReadout(section.progress);
    }

    applyAccent(section.palette);
    document.querySelector('meta[name="theme-color"]').setAttribute('content', section.palette.bg);
  }

  function animateReadout(target) {
    const from = state.readout;
    const start = performance.now();
    const duration = 620;
    cancelAnimationFrame(state.readoutFrame);

    const step = (now) => {
      const t = Math.min(1, Math.max(0, (now - start) / duration));
      const eased = 1 - Math.pow(1 - t, 3);
      const value = Math.round(from + (target - from) * eased);
      state.readout = value;
      els.readout.textContent = value + '%';
      if (t < 1) state.readoutFrame = requestAnimationFrame(step);
    };
    state.readoutFrame = requestAnimationFrame(step);
  }

  function applyAccent(palette) {
    const root = document.documentElement;
    root.style.setProperty('--accent', palette.accent);
    root.style.setProperty('--accent-2', palette.accent2);
    root.style.setProperty('--accent-glow', hexAlpha(palette.accent, 0.45));
  }

  function hexAlpha(hex, alpha) {
    const value = Math.round(alpha * 255).toString(16).padStart(2, '0');
    return hex + value;
  }

  /* ── Navegación entre secciones ────────────────────────────────────── */
  function goSection(index) {
    const total = DATA.sections.length;
    if (index < 0 || index >= total) return;
    if (state.curtain) return;
    if (index === state.section || state.transitioning) return;

    state.transitioning = true;
    const direction = index > state.section ? 1 : -1;
    const currentScreen = screens[state.section];
    const nextScreen = screens[index];
    const fromIndex = state.section;

    state.section = index;
    setHud(index, false);

    const section = DATA.sections[index];
    try {
      if (history.replaceState) history.replaceState(null, '', '#' + section.id);
    } catch (error) {
      // file:// u otros contextos sin History API: la navegación sigue igual.
    }

    const dashMs = scene ? scene.setSection(index) : 0;
    sound.play('dash');
    pauseProjectVideos();
    if (fromIndex === 0) pauseHomeVideos();

    currentScreen.classList.add(direction > 0 ? 'screen--out-left' : 'screen--out-right');

    window.setTimeout(() => {
      currentScreen.hidden = true;
      currentScreen.classList.remove('screen--out-left', 'screen--out-right');

      nextScreen.hidden = false;
      els.main.scrollTop = 0;
      handleHomeParallax();
      nextScreen.classList.add(direction > 0 ? 'screen--in-right' : 'screen--in-left');
      if (index === 0) playHomeVideo();
      if (index === 1 || index === 2) syncProjectVideos();

      window.setTimeout(() => {
        nextScreen.classList.remove('screen--in-left', 'screen--in-right');
      }, 460);
    }, 200);

    window.setTimeout(() => {
      state.transitioning = false;
    }, Math.max(690, dashMs + 70));

    els.live.textContent = `Sección ${section.label}, ${section.progress} por ciento del nivel.`;
  }

  /* ── Proyectos: carruseles por sección ─────────────────────────────── */
  function renderProjects() {
    $$('.carousel').forEach((container) => {
      const group = container.dataset.carousel;
      const list = DATA.projects.filter((project) => project.group === group);

      if (!list.length) {
        container.innerHTML = '<p class="carousel__empty">Próximamente.</p>';
        return;
      }

      container.innerHTML = `
        <div class="levels">
          <button class="levels__arrow" type="button" data-carousel-arrow="prev" aria-label="Proyecto anterior">‹</button>
          <div class="levels__viewport" tabindex="0" role="group" aria-roledescription="carrusel" aria-label="Selector de proyectos">
            <div class="levels__track">${list.map((project, index) => projectCard(project, index)).join('')}</div>
          </div>
          <button class="levels__arrow" type="button" data-carousel-arrow="next" aria-label="Proyecto siguiente">›</button>
        </div>
        <div class="levels__foot">
          <div class="levels__dots">${list.map((project, index) => `
            <button class="levels__dot" type="button" data-carousel-dot="${index}" aria-label="Ir al proyecto ${index + 1}: ${escapeText(project.name)}" aria-pressed="false"></button>`).join('')}
          </div>
          <p class="levels__count">1 / ${list.length}</p>
          <p class="levels__hint"><kbd>A</kbd><kbd>D</kbd> o <kbd>↑</kbd><kbd>↓</kbd> cambian de proyecto</p>
        </div>`;

      const track = $('.levels__track', container);
      const viewport = $('.levels__viewport', container);
      carousels[group] = { container, list, track, viewport };

      container.addEventListener('click', (event) => {
        const dot = event.target.closest('[data-carousel-dot]');
        if (dot) {
          goProject(group, Number(dot.dataset.carouselDot));
          return;
        }
        const arrow = event.target.closest('[data-carousel-arrow]');
        if (arrow) {
          const step = arrow.dataset.carouselArrow === 'next' ? 1 : -1;
          goProject(group, state.project[group] + step);
          return;
        }
        const button = event.target.closest('[data-project]');
        if (button) openProject(group, Number(button.dataset.project));
      });

      setupSwipe(viewport, (step) => goProject(group, state.project[group] + step));
      updateProject(group, 0, true);
    });
  }

  function projectCard(project, index) {
    const diff = DIFFICULTY[project.difficulty] || DIFFICULTY.normal;
    const media = mediaHtml(project, 'card');

    return `
      <article class="level-card ${index === 0 ? 'is-active' : ''}" style="--card-accent:${project.accent};--diff:${diff.color}" aria-label="${escapeText(project.name)}">
        <div class="level-card__media">
          <span class="level-card__badge">${String(index + 1).padStart(2, '0')}</span>
          ${media}
          <span class="level-card__engine">${escapeText(project.engine)}</span>
        </div>
        <div class="level-card__body">
          <div class="level-card__head">
            <div>
              <p class="level-card__kicker">NIVEL ${String(index + 1).padStart(2, '0')} · ${escapeText(project.year)} · ${escapeText(project.status)}</p>
              <h3 class="level-card__title">${escapeText(project.name)}</h3>
            </div>
            ${difficultyHtml(project)}
          </div>
          <p class="level-card__summary">${escapeText(project.summary)}</p>
          <p class="level-card__note">${escapeText(project.difficultyNote)}</p>
          <div class="bars">${project.bars.map((bar) => barHtml(bar, project.accent)).join('')}</div>
          <ul class="tags">${project.tags.map((tag) => `<li class="tag">${escapeText(tag)}</li>`).join('')}</ul>
          <button class="btn btn--green level-card__play" type="button" data-project="${index}">
            <span aria-hidden="true">▶</span> PLAY / VER CÓDIGO
          </button>
        </div>
      </article>`;
  }

  function mediaHtml(project, context) {
    const media = project.media;
    const label = escapeText(project.name);

    if (media && media.type === 'video') {
      if (context === 'modal') {
        return `<video id="modal-video" controls autoplay muted loop playsinline poster="${media.poster || ''}">
          <source src="${media.src}" type="video/mp4">
        </video>`;
      }
      return `<video autoplay muted loop playsinline preload="metadata" poster="${media.poster || ''}" aria-label="Gameplay de ${label}">
        <source src="${media.src}" type="video/mp4">
      </video>`;
    }

    if (media && media.type === 'image') {
      return `<img src="${media.src}" alt="Captura de ${label}" loading="lazy" width="800" height="500">`;
    }

    const cls = context === 'modal' ? 'modal__placeholder' : 'level-card__placeholder';
    return `<div class="${cls}">
      <b>${initials(project.name)}</b>
      <span>Gameplay · captura pendiente</span>
    </div>`;
  }

  function goProject(group, index, silent) {
    if (state.curtain) return;
    const carousel = carousels[group];
    if (!carousel) return;
    const total = carousel.list.length;
    const target = ((index % total) + total) % total;
    if (target === state.project[group]) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      state.project[group] = target;
      updateProject(group, target, silent);
      if (!silent) sound.play('click');
      return;
    }

    playCurtain(group, target, silent);
  }

  /* Cierre de telón → cambio de proyecto → apertura. */
  function playCurtain(group, index, silent) {
    const carousel = carousels[group];
    const project = carousel.list[index];
    if (!project) return;

    state.curtain = true;
    els.curtainTitle.textContent = `NIVEL ${String(index + 1).padStart(2, '0')}`;
    els.curtainSub.textContent = `${project.name} · ${project.engine}`;

    els.curtain.classList.remove('is-closed');
    els.curtain.classList.add('is-active');
    void els.curtain.offsetWidth;
    els.curtain.classList.add('is-closed');
    if (!silent) sound.play('curtain');

    const closeMs = 330;
    const holdMs = 100;
    const openMs = 360;

    window.setTimeout(() => {
      state.project[group] = index;

      // El carrusel cambia a puerta cerrada, sin deslizar bajo el telón.
      const previousTransition = carousel.track.style.transition;
      carousel.track.style.transition = 'none';
      updateProject(group, index, true);
      void carousel.track.offsetWidth;
      carousel.track.style.transition = previousTransition;

      window.setTimeout(() => {
        els.curtain.classList.remove('is-closed');

        window.setTimeout(() => {
          els.curtain.classList.remove('is-active');
          state.curtain = false;
          els.live.textContent = `Proyecto ${index + 1} de ${carousel.list.length}: ${project.name}.`;
        }, openMs);
      }, holdMs);
    }, closeMs);
  }

  function syncProjectVideos() {
    const activeGroup = state.section === 1 ? 'juegos' : state.section === 2 ? 'creaciones' : null;
    Object.keys(carousels).forEach((group) => {
      $$('video', carousels[group].track).forEach((video, index) => {
        if (group === activeGroup && index === state.project[group]) {
          const promise = video.play();
          if (promise && promise.catch) promise.catch(() => {});
        } else {
          video.pause();
        }
      });
    });
  }

  function pauseProjectVideos() {
    Object.keys(carousels).forEach((group) => {
      $$('video', carousels[group].track).forEach((video) => video.pause());
    });
  }

  function updateProject(group, index, silent) {
    const carousel = carousels[group];
    const project = carousel.list[index];
    if (!project) return;

    carousel.track.style.transform = `translateX(-${index * 100}%)`;
    $$('.level-card', carousel.track).forEach((card, i) => {
      card.classList.toggle('is-active', i === index);
    });
    $$('.levels__dot', carousel.container).forEach((dot, i) => {
      dot.classList.toggle('is-active', i === index);
      dot.setAttribute('aria-pressed', String(i === index));
    });
    syncProjectVideos();

    $$('.levels__count', carousel.container).forEach((count) => {
      count.textContent = `${index + 1} / ${carousel.list.length}`;
    });
    carousel.viewport.setAttribute('aria-label', `Proyecto ${index + 1} de ${carousel.list.length}: ${project.name}`);
    if (!silent) {
      els.live.textContent = `Proyecto ${index + 1} de ${carousel.list.length}: ${project.name}.`;
    }
  }

  function setupSwipe(viewport, onSwipe) {
    let startX = 0;
    let startY = 0;
    let tracking = false;

    viewport.addEventListener('pointerdown', (event) => {
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      startX = event.clientX;
      startY = event.clientY;
      tracking = true;
    });

    viewport.addEventListener('pointerup', (event) => {
      if (!tracking) return;
      tracking = false;
      const dx = event.clientX - startX;
      const dy = event.clientY - startY;
      if (Math.abs(dx) > 44 && Math.abs(dx) > Math.abs(dy) * 1.2) {
        onSwipe(dx < 0 ? 1 : -1);
      }
    });

    viewport.addEventListener('pointercancel', () => {
      tracking = false;
    });
  }

  /* ── Vídeos del inicio ─────────────────────────────────────────────── */
  function renderVideos() {
    const list = DATA.videos || [];
    if (!list.length || !els.videoTrack) return;

    els.videoTrack.innerHTML = list.map((video, index) => videoSlide(video, index)).join('');
    els.videoDots.innerHTML = list.map((video, index) => `
      <button class="video-carousel__dot" type="button" data-video-dot="${index}" aria-label="Ir al vídeo ${index + 1}: ${escapeText(video.title)}" aria-pressed="false"></button>`).join('');

    $$('.video-slide video', els.videoTrack).forEach((video, index) => {
      video.addEventListener('ended', () => goVideo(index + 1, true));
    });

    els.videoPrev.addEventListener('click', () => goVideo(state.video - 1));
    els.videoNext.addEventListener('click', () => goVideo(state.video + 1));
    els.videoDots.addEventListener('click', (event) => {
      const dot = event.target.closest('[data-video-dot]');
      if (dot) goVideo(Number(dot.dataset.videoDot));
    });
    setupSwipe(els.videoStage, (step) => goVideo(state.video + step));

    loadYouTubeApi();
    updateVideo(0, true);
    playHomeVideo();
  }

  function videoSlide(video, index) {
    const badge = `<span class="video-slide__badge">${escapeText(video.title)}</span>`;

    if (video.type === 'file' && video.src) {
      return `<div class="video-slide">
        <video class="video-slide__media" muted autoplay playsinline preload="metadata" ${video.poster ? `poster="${video.poster}"` : ''}>
          <source src="${video.src}" type="video/mp4">
        </video>
        ${badge}
      </div>`;
    }

    if (video.type === 'youtube' && video.youtubeId) {
      return `<div class="video-slide">
        <div class="video-slide__yt" data-yt="${index}" data-yt-id="${escapeText(video.youtubeId)}">
          <a class="video-slide__yt-link" href="https://www.youtube.com/watch?v=${escapeText(video.youtubeId)}" target="_blank" rel="noopener noreferrer">Ver en YouTube ↗</a>
        </div>
        ${badge}
      </div>`;
    }

    return `<div class="video-slide video-slide--empty">
      <div class="video-slide__ph">
        <b aria-hidden="true">▶</b>
        <span>${escapeText(video.title)}</span>
        <small>Edita la lista de vídeos en js/data.js</small>
      </div>
    </div>`;
  }

  function goVideo(index, silent) {
    const list = DATA.videos || [];
    if (!list.length) return;
    const total = list.length;
    const target = ((index % total) + total) % total;
    if (target === state.video) return;
    state.video = target;
    updateVideo(target, silent);
    if (!silent) sound.play('click');
  }

  function updateVideo(index, silent) {
    const list = DATA.videos || [];
    if (!list.length) return;

    els.videoTrack.style.transform = `translateX(-${index * 100}%)`;
    $$('.video-carousel__dot', els.videoDots).forEach((dot, i) => {
      dot.classList.toggle('is-active', i === index);
      dot.setAttribute('aria-pressed', String(i === index));
    });
    els.videoCount.textContent = `${index + 1} / ${list.length}`;
    if (!silent) {
      els.live.textContent = `Vídeo ${index + 1} de ${list.length}: ${list[index].title}.`;
    }

    const active = state.section === 0;
    $$('.video-slide video', els.videoTrack).forEach((video, i) => {
      if (i === index && active) {
        const promise = video.play();
        if (promise && promise.catch) promise.catch(() => {});
      } else {
        video.pause();
      }
    });
    Object.keys(videoPlayers).forEach((key) => {
      const player = videoPlayers[key];
      if (Number(key) === index && active) player.playVideo();
      else player.pauseVideo();
    });
  }

  function playHomeVideo() {
    updateVideo(state.video, true);
  }

  function pauseHomeVideos() {
    $$('.video-slide video', els.videoTrack).forEach((video) => video.pause());
    Object.keys(videoPlayers).forEach((key) => videoPlayers[key].pauseVideo());
  }

  /* El vídeo se desvanece y crece un poco mientras la presentación sube y se
   * le superpone: así el fondo animado queda visible en la bienvenida. */
  function handleHomeParallax() {
    const videoEl = $('.home-video');
    if (!videoEl || !els.main) return;

    if (state.section !== 0) {
      videoEl.style.opacity = '';
      videoEl.style.transform = '';
      videoEl.style.pointerEvents = '';
      return;
    }

    const height = videoEl.offsetHeight || 1;
    const progress = clamp(els.main.scrollTop / height, 0, 1);
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    videoEl.style.opacity = String(1 - progress);
    videoEl.style.transform = reduced ? '' : `scale(${1 + progress * 0.045})`;
    videoEl.style.pointerEvents = progress > 0.85 ? 'none' : '';
  }

  function onMainScroll() {
    if (parallaxPending) return;
    parallaxPending = true;
    requestAnimationFrame(() => {
      parallaxPending = false;
      handleHomeParallax();
    });
  }

  function loadYouTubeApi() {
    const hasYouTube = (DATA.videos || []).some((video) => video.type === 'youtube' && video.youtubeId);
    if (!hasYouTube) return;

    if (window.YT && window.YT.Player) {
      createYouTubePlayers();
      return;
    }

    window.onYouTubeIframeAPIReady = () => {
      createYouTubePlayers();
    };

    if (!document.getElementById('yt-iframe-api')) {
      const script = document.createElement('script');
      script.id = 'yt-iframe-api';
      script.src = 'https://www.youtube.com/iframe_api';
      document.head.appendChild(script);
    }
  }

  function createYouTubePlayers() {
    if (!window.YT || !window.YT.Player) return;
    $$('.video-slide__yt', els.videoTrack).forEach((holder) => {
      const index = Number(holder.dataset.yt);
      if (videoPlayers[index]) return;
      videoPlayers[index] = new window.YT.Player(holder, {
        videoId: holder.dataset.ytId,
        playerVars: {
          autoplay: index === state.video ? 1 : 0,
          mute: 1,
          playsinline: 1,
          rel: 0,
          controls: 1,
        },
        events: {
          onStateChange: (event) => {
            if (event.data === window.YT.PlayerState.ENDED) goVideo(index + 1, true);
          },
        },
      });

      // Si el embed no llega a crearse (sin red, bloqueado…), muestra el enlace.
      window.setTimeout(() => {
        const embedded = holder.tagName === 'IFRAME' || holder.querySelector('iframe');
        if (!embedded) holder.classList.add('is-fallback');
      }, 2600);
    });
  }

  /* ── Modal de proyecto ─────────────────────────────────────────────── */
  function openProject(group, index) {
    if (state.curtain) return;
    const carousel = carousels[group];
    if (!carousel) return;
    const project = carousel.list[index];
    if (!project) return;

    state.modalProject = project;
    modalVideo = null;

    els.modal.style.setProperty('--modal-accent', project.accent);
    els.modalKicker.textContent = `${project.engine} · ${project.year} · ${project.status}`;
    els.modalTitle.textContent = project.name;
    els.modalDescription.textContent = project.description;

    els.modalMedia.innerHTML = mediaHtml(project, 'modal');
    modalVideo = $('#modal-video', els.modalMedia);

    els.modalPatterns.innerHTML = project.patterns
      .map((pattern) => `<li>${escapeText(pattern)}</li>`)
      .join('');

    els.modalTags.innerHTML = project.tags
      .map((tag) => `<li class="tag">${escapeText(tag)}</li>`)
      .join('');

    els.modalBars.classList.add('is-active');
    els.modalBars.innerHTML = project.bars
      .map((bar) => barHtml(bar, project.accent))
      .join('');

    const links = [];
    if (project.links && project.links.repo) {
      links.push(`<a class="modal__link modal__link--primary" href="${project.links.repo}" target="_blank" rel="noopener noreferrer">
        <span>VER CÓDIGO</span><span>↗</span>
      </a>`);
    }
    if (project.links && project.links.itch) {
      links.push(`<a class="modal__link" href="${project.links.itch}" target="_blank" rel="noopener noreferrer">
        <span>ITCH.IO</span><span>↗</span>
      </a>`);
    }
    if (project.links && project.links.release) {
      links.push(`<a class="modal__link" href="${project.links.release}" target="_blank" rel="noopener noreferrer">
        <span>RELEASE</span><span>↗</span>
      </a>`);
    }
    if (project.links && project.links.live) {
      links.push(`<a class="modal__link" href="${project.links.live}" target="_blank" rel="noopener noreferrer">
        <span>VER EN VIVO</span><span>↗</span>
      </a>`);
    }
    els.modalLinks.innerHTML = links.join('');

    pauseProjectVideos();
    els.modal.showModal();
    sound.play('open');
  }

  function closeProject() {
    if (els.modal.open) els.modal.close();
  }

  /* ── Skills ────────────────────────────────────────────────────────── */
  function renderSkills() {
    els.skillsGrid.innerHTML = DATA.skills.map((skill, index) => `
      <button class="skill-tile" type="button" data-skill="${index}" style="--skill-color:${skill.color}" aria-pressed="false" aria-label="${escapeText(skill.name)}: ${escapeText(skill.levelLabel)}, ${skill.level}%">
        ${SKILL_ICONS[skill.icon] || SKILL_ICONS.unity}
        <span>${escapeText(skill.name)}</span>
      </button>`).join('');

    els.skillsGrid.addEventListener('click', (event) => {
      const tile = event.target.closest('[data-skill]');
      if (!tile) return;
      selectSkill(Number(tile.dataset.skill));
    });

    const defaultIndex = Math.max(0, DATA.skills.findIndex((skill) => skill.id === 'unity'));
    selectSkill(defaultIndex, true);
  }

  function selectSkill(index, silent) {
    const skill = DATA.skills[index];
    if (!skill) return;

    state.skill = index;
    $$('.skill-tile', els.skillsGrid).forEach((tile, i) => {
      const active = i === index;
      tile.classList.toggle('is-active', active);
      tile.setAttribute('aria-pressed', String(active));
    });

    els.skillName.textContent = skill.name;
    els.skillLevelLabel.textContent = skill.levelLabel;
    els.skillLevelValue.textContent = skill.level + '%';
    els.skillText.textContent = skill.text;
    els.skillSystems.innerHTML = skill.systems.map((system) => `<li>${escapeText(system)}</li>`).join('');
    els.skillPanel.style.setProperty('--bar-color', skill.color);
    els.skillBar.style.width = skill.level + '%';

    if (scene) scene.setSkin(skill.skin);
    if (!silent) {
      sound.play('select');
      els.live.textContent = `Skin equipada: ${skill.name}. Dominio ${skill.level} por ciento.`;
    }
  }

  /* ── Contacto ──────────────────────────────────────────────────────── */
  function renderContact() {
    const links = DATA.links;
    const actions = [];

    if (links.cv) {
      actions.push({
        href: links.cv,
        icon: 'cv',
        title: 'DESCARGAR CV',
        sub: 'PDF · 1 página',
        primary: true,
        download: true,
        toast: 'CV descargado. Una página, lista para enviar.',
      });
    }

    if (links.github) {
      actions.push({
        href: links.github,
        icon: 'github',
        title: 'GITHUB',
        sub: '@SrDragoDoro',
        newTab: true,
      });
    }

    if (links.linkedin) {
      actions.push({
        href: links.linkedin,
        icon: 'linkedin',
        title: 'LINKEDIN',
        sub: 'Perfil profesional',
        newTab: true,
      });
    }

    if (links.itch) {
      actions.push({
        href: links.itch,
        icon: 'itch',
        title: 'ITCH.IO',
        sub: 'Juegos publicados',
        newTab: true,
      });
    }

    if (links.releases) {
      actions.push({
        href: links.releases,
        icon: 'release',
        title: 'RELEASES',
        sub: 'Versiones públicas',
        newTab: true,
      });
    }

    if (links.email) {
      actions.push({
        copy: links.email,
        icon: 'mail',
        title: 'COPIAR EMAIL',
        sub: links.email,
        toast: `Correo copiado: ${links.email}`,
      });
    }

    if (links.site) {
      actions.push({
        copy: links.site.replace(/^https?:\/\//, ''),
        icon: 'link',
        title: 'COPIAR ENLACE',
        sub: links.site.replace(/^https?:\/\//, ''),
        toast: 'Enlace del portafolio copiado. ¡A por el 100%!',
      });
    }

    els.contactActions.innerHTML = actions.map((action, index) => {
      const icon = ACTION_ICONS[action.icon] || ACTION_ICONS.link;
      const inner = `
        <span class="action__icon" aria-hidden="true">${icon}</span>
        <span><b>${escapeText(action.title)}</b><small>${escapeText(action.sub)}</small></span>`;

      if (action.copy) {
        return `<button class="action ${action.primary ? 'action--primary' : ''}" type="button" data-copy="${index}" data-toast="${escapeText(action.toast)}">${inner}</button>`;
      }

      return `<a class="action ${action.primary ? 'action--primary' : ''}" href="${action.href}" ${action.newTab ? 'target="_blank" rel="noopener noreferrer"' : ''} ${action.download ? 'download' : ''} data-toast="${escapeText(action.toast || '')}">${inner}</a>`;
    }).join('');

    els.contactActions.addEventListener('click', (event) => {
      const copyButton = event.target.closest('[data-copy]');
      if (copyButton) {
        event.preventDefault();
        const action = actions[Number(copyButton.dataset.copy)];
        if (action && action.copy) {
          copyToClipboard(action.copy, action.toast);
        }
        return;
      }

      const link = event.target.closest('a.action');
      if (link && link.dataset.toast) {
        showToast('¡LOGRO DESBLOQUEADO!', link.dataset.toast);
        sound.play('achievement');
      }
    });
  }

  async function copyToClipboard(text, message) {
    let ok = false;
    try {
      await navigator.clipboard.writeText(text);
      ok = true;
    } catch (error) {
      ok = legacyCopy(text);
    }

    if (ok) {
      showToast('¡LOGRO DESBLOQUEADO!', message);
      sound.play('achievement');
    } else {
      showToast('NO SE PUDO COPIAR', 'Selecciona y copia el texto manualmente.');
    }
  }

  function legacyCopy(text) {
    const area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.top = '-1000px';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    let ok = false;
    try {
      ok = document.execCommand('copy');
    } catch (error) {
      ok = false;
    }
    area.remove();
    return ok;
  }

  /* ── Toast ─────────────────────────────────────────────────────────── */
  function showToast(title, message) {
    els.toastTitle.textContent = title;
    els.toastMessage.textContent = message;
    els.toast.classList.add('is-on');
    window.clearTimeout(state.toastTimer);
    state.toastTimer = window.setTimeout(() => {
      els.toast.classList.remove('is-on');
    }, 3600);
  }

  /* ── Eventos globales ──────────────────────────────────────────────── */
  function bindEvents() {
    // Botones y enlaces internos (menú, marca, checkpoints).
    document.addEventListener('click', (event) => {
      const target = event.target.closest('[data-goto]');
      if (!target) return;
      event.preventDefault();
      const index = Number(target.dataset.goto);
      if (Number.isFinite(index)) goSection(index);
    });

    els.prevSection.addEventListener('click', () => goSection(state.section - 1));
    els.nextSection.addEventListener('click', () => goSection(state.section + 1));

    els.main.addEventListener('scroll', onMainScroll, { passive: true });

    els.soundToggle.addEventListener('click', () => {
      const active = sound.toggle();
      els.soundToggle.setAttribute('aria-pressed', String(active));
      els.soundToggle.setAttribute('aria-label', active ? 'Silenciar sonido' : 'Activar sonido');
      els.soundToggle.title = active ? 'Silenciar sonido' : 'Activar sonido';
    });

    els.modalClose.addEventListener('click', closeProject);

    els.modal.addEventListener('click', (event) => {
      if (event.target === els.modal) closeProject();
    });

    els.modal.addEventListener('close', () => {
      if (modalVideo) {
        modalVideo.pause();
        modalVideo.currentTime = 0;
        modalVideo = null;
      }
      if (state.section === 1 || state.section === 2) syncProjectVideos();
      else if (state.section === 0) playHomeVideo();
      sound.play('close');
    });

    // Click directo sobre el cubo.
    document.addEventListener('pointerdown', (event) => {
      if (event.button !== 0) return;
      const interactive = event.target.closest
        ? event.target.closest('a, button, input, textarea, select, dialog, [role="button"]')
        : null;
      if (interactive || !scene) return;
      if (scene.hitTest(event.clientX, event.clientY)) {
        if (scene.jump()) sound.play('jump');
      }
    });

    // Aterrizaje: pequeño golpe sintetizado.
    window.addEventListener('gd:land', () => sound.play('land'));

    // Cambios manuales del hash (#juegos, #creaciones…) en la barra del navegador.
    window.addEventListener('hashchange', () => {
      const requested = window.location.hash.replace('#', '').toLowerCase();
      const index = sectionIndexFor(requested);
      if (index >= 0 && index !== state.section) goSection(index);
    });

    // Teclado.
    document.addEventListener('keydown', (event) => {
      if (els.modal.open) return;
      const tag = (event.target.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select' || event.target.isContentEditable) return;

      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        goSection(state.section - 1);
        return;
      }

      if (event.key === 'ArrowRight') {
        event.preventDefault();
        goSection(state.section + 1);
        return;
      }

      if (state.section === 1 || state.section === 2) {
        const group = state.section === 1 ? 'juegos' : 'creaciones';
        const key = event.key.toLowerCase();
        if (key === 'a' || key === 'arrowup') {
          event.preventDefault();
          goProject(group, state.project[group] - 1);
        } else if (key === 'd' || key === 'arrowdown') {
          event.preventDefault();
          goProject(group, state.project[group] + 1);
        }
      }
    });
  }

  /* ── Arranque ──────────────────────────────────────────────────────── */
  function init() {
    if (!DATA) {
      console.error('GD_DATA no está disponible. Revisa js/data.js.');
      return;
    }

    try {
      els.main = $('#main');
      els.screens = $$('.screen');
      screens = els.screens;
      els.live = $('#live-region');
      els.fill = $('#levelbar-fill');
      els.levelbar = $('#levelbar');
      els.nodes = $('#levelbar-nodes');
      els.prevSection = $('#prev-section');
      els.nextSection = $('#next-section');
      els.readout = $('#progress-readout');
      els.soundToggle = $('#sound-toggle');
      els.avatar = $('#avatar-img');
      els.statsGrid = $('#stats-grid');
      els.videoTrack = $('#video-track');
      els.videoStage = $('#video-stage');
      els.videoDots = $('#video-dots');
      els.videoCount = $('#video-count');
      els.videoPrev = $('#video-prev');
      els.videoNext = $('#video-next');
      els.skillsGrid = $('#skills-grid');
      els.skillPanel = $('#skill-panel');
      els.skillName = $('#skill-name');
      els.skillLevelLabel = $('#skill-level-label');
      els.skillLevelValue = $('#skill-level-value');
      els.skillText = $('#skill-text');
      els.skillSystems = $('#skill-systems');
      els.skillBar = $('#skill-bar');
      els.contactActions = $('#contact-actions');
      els.curtain = $('#curtain');
      els.curtainTitle = $('#curtain-title');
      els.curtainSub = $('#curtain-sub');
      els.modal = $('#project-modal');
      els.modalClose = $('#modal-close');
      els.modalKicker = $('#modal-kicker');
      els.modalTitle = $('#modal-title');
      els.modalMedia = $('#modal-media');
      els.modalDescription = $('#modal-description');
      els.modalPatterns = $('#modal-patterns');
      els.modalTags = $('#modal-tags');
      els.modalBars = $('#modal-bars');
      els.modalLinks = $('#modal-links');
      els.toast = $('#toast');
      els.toastTitle = $('#toast-title');
      els.toastMessage = $('#toast-message');

      renderProfile();
      renderLevelNodes();
      renderVideos();
      renderProjects();
      renderSkills();
      renderContact();
      bindEvents();
      handleHomeParallax();

      if (scene) scene.setSection(0, true);
      setHud(0, true);

      // Estado inicial del botón de sonido (siempre mute al cargar).
      els.soundToggle.setAttribute('aria-pressed', 'false');
      els.soundToggle.setAttribute('aria-label', 'Activar sonido');
      els.soundToggle.title = 'Activar sonido';
      els.live.textContent = 'Portafolio cargado. Sección Inicio, 0 por ciento.';

      // Enlaces profundos: #juegos, #creaciones, #sobre-mi o ?seccion=creaciones.
      const requested = (
        new URLSearchParams(window.location.search).get('seccion') ||
        window.location.hash.replace('#', '')
      ).toLowerCase();
      const targetIndex = sectionIndexFor(requested);
      if (targetIndex > 0) {
        window.setTimeout(() => goSection(targetIndex), 90);
      }

      // Evita que el navegador restaure un scroll raro al cargar.
      requestAnimationFrame(() => {
        els.main.scrollTop = 0;
      });
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(() => {
          if (state.section === 0) els.main.scrollTop = 0;
        });
      }
    } catch (error) {
      console.error('Error inicializando el portafolio:', error);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
