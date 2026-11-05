/* =============================================================================
 * main.js — pintador y controlador del portafolio.
 *
 * El HTML solo tiene el esqueleto (cabecera, secciones, pie). Todo el
 * contenido —proyectos, habilidades, trayectoria, contacto— se genera aquí a
 * partir de js/data.js. Así, tocar el contenido nunca significa tocar el
 * marcado ni este archivo.
 *
 * Bloques:
 *   1. Utilidades        5. Tarjetas de proyecto
 *   2. Idioma            6. Ficha de proyecto (visor)
 *   3. Render            7. Hero: cubo y semilla
 *   4. Secciones         8. Navegación móvil y animaciones
 * ========================================================================== */
(function () {
  'use strict';

  /* ── 1. Utilidades ────────────────────────────────────────────────────── */

  const $ = (sel, el = document) => el.querySelector(sel);
  const $$ = (sel, el = document) => Array.from(el.querySelectorAll(sel));

  /** Crea un elemento. Los atributos `null` o `false` se omiten. */
  const h = (tag, attrs = {}, ...kids) => {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (v == null || v === false) continue;
      if (k === 'class') el.className = v;
      else if (k === 'text') el.textContent = v;
      else if (k === 'html') el.innerHTML = v;
      else el.setAttribute(k, v);
    }
    for (const kid of kids.flat()) if (kid != null) el.append(kid);
    return el;
  };

  /* ── 2. Idioma ────────────────────────────────────────────────────────── */
  /* Los idiomas disponibles viven en window.LANGS (js/data.js). La
   * preferencia guardada manda; si no hay, se usa el idioma del navegador. */

  const LANGS = window.LANGS || [{ code: 'es', label: 'ES', name: 'Español' }];
  const LANGS_CODES = LANGS.map((l) => l.code);

  function pickLang() {
    let saved = null;
    try { saved = localStorage.getItem('lang'); } catch (e) { /* sin storage */ }
    if (saved && LANGS_CODES.includes(saved)) return saved;

    const nav = String(navigator.language || 'es').slice(0, 2).toLowerCase();
    return LANGS_CODES.includes(nav) ? nav : LANGS_CODES[0];
  }

  let lang = pickLang();

  /** Texto de interfaz por clave, con español como red de seguridad. */
  const t = (key) =>
    (UI[lang] && UI[lang][key]) || (UI.es && UI.es[key]) || key;

  /** Contenido localizado de un bloque (proyecto, pilar, habilidad…). */
  const loc = (obj) => (obj && (obj[lang] || obj.es)) || {};

  /** Traduce un valor que puede ser string o { es, en, ja }. */
  const tx = (v) => {
    if (v == null) return '';
    if (typeof v !== 'object') return v;
    return v[lang] ?? v.es ?? v.en ?? '';
  };

  /* ── 3. Render ────────────────────────────────────────────────────────── */

  function render() {
    document.documentElement.lang = lang;
    document.title = t('meta.title');

    const desc = $('meta[name="description"]');
    if (desc) desc.setAttribute('content', t('meta.description'));

    // Textos fijos marcados en el HTML con data-i18n y sus etiquetas ARIA.
    $$('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
    $$('[data-i18n-aria-label]').forEach((el) => {
      el.setAttribute('aria-label', t(el.dataset.i18nAriaLabel));
    });

    renderLangSwitch();
    renderPillars();
    renderSkills();
    renderAbout();
    renderContact();

    // Los lienzos necesitan que el navegador ya haya calculado el layout.
    setTimeout(drawCovers, 0);
    watchVideos();

    // Las secciones recién pintadas también entran al hacer scroll.
    setupReveal();

    // Avisa a otros módulos (game.js) del cambio de idioma.
    document.dispatchEvent(new CustomEvent('langchange', { detail: { lang } }));
  }

  /** Conmutador de idioma: un botón por cada entrada de window.LANGS. */
  function renderLangSwitch() {
    const host = $('.lang');
    if (!host) return;

    host.setAttribute('aria-label', t('lang.label'));
    host.replaceChildren(...LANGS.map((l) =>
      h('button', {
        type: 'button',
        class: `lang__btn${l.code === lang ? ' on' : ''}`,
        'data-set-lang': l.code,
        'aria-pressed': String(l.code === lang),
        title: l.name,
        lang: l.code,
        text: l.label,
      })
    ));
  }

  /* ── 4. Secciones ─────────────────────────────────────────────────────── */

  /** Los bloques de proyectos, uno por pilar, en el orden de PILLARS. */
  function renderPillars() {
    const host = $('.pillars');
    host.replaceChildren(...PILLARS.map((pillar) => {
      const items = PROJECTS.filter((p) => p.pillar === pillar.id);
      const P = loc(pillar);

      const head = h('header', { class: 'pillar__head' },
        h('h3', { class: 'pillar__title', text: P.name }),
        h('p', { class: 'pillar__blurb', text: P.blurb })
      );

      const grid = h('div', { class: 'grid' }, items.map(card));

      return h('section', {
        class: 'pillar', id: pillar.id,
        style: `--c:${pillar.color}`,
        'aria-labelledby': `h-${pillar.id}`,
      },
        head,
        h('span', { class: 'pillar__rule', 'aria-hidden': 'true' }),
        grid
      );
    }));
  }

  /** Habilidades: un bloque por grupo, con sus tecnologías. */
  function renderSkills() {
    const host = $('.skills');
    host.replaceChildren(...SKILLS.map((s) => {
      const S = loc(s);
      return h('article', { class: 'skill', style: `--c:${s.color}` },
        h('h3', { class: 'skill__title', text: S.title }),
        h('p', { class: 'skill__text', text: S.text }),
        h('ul', { class: 'skill__list' }, S.items.map((i) => h('li', { text: i })))
      );
    }));
  }

  /** Sobre mí: texto, cifras y trayectoria. */
  function renderAbout() {
    const A = loc(ABOUT);

    $('.about__text').replaceChildren(...A.body.map((p) => h('p', { text: p })));

    $('.about__facts').replaceChildren(...A.facts.map(([value, label]) =>
      h('li', {}, h('b', { text: value }), h('span', { text: label }))
    ));

    // La trayectoria va debajo del texto, dentro de la misma sección.
    const list = $('.journey__list');
    if (list) {
      list.replaceChildren(...JOURNEY.map((e) =>
        h('li', { class: 'journey__item' },
          h('p', { class: 'journey__when', text: tx(e.when) || '' }),
          h('div', {},
            h('h4', { class: 'journey__role', text: loc(e).role }),
            h('p', { class: 'journey__text', text: loc(e).text }))
        )
      ));
    }
  }

  /** Canales de contacto. Los que no tengan href no se muestran. */
  function renderContact() {
    $('.foot__links').replaceChildren(
      ...CONTACT.filter((c) => c.href).map((c) =>
        h('li', {}, h('a', {
          href: c.href,
          target: '_blank',
          rel: 'noopener me',
          text: `${tx(c.label)} ↗`,
        }))
      )
    );
  }

  /* ── 5. Tarjetas de proyecto ──────────────────────────────────────────── */

  // Orden en que se muestran los enlaces de una tarjeta.
  const LINK_ORDER = ['live', 'release', 'repo'];

  const imgUrl = (name) => `img/${name}.webp`;

  /** Todos los medios de un proyecto: vídeo, portada y galería. */
  function galleryOf(p) {
    const items = [];
    if (p.video) {
      items.push({ video: `video/${p.video.loop}.mp4`, poster: imgUrl(p.video.poster) });
    }
    if (p.img) items.push({ img: imgUrl(p.img) });
    (p.gallery || []).forEach((g) => {
      if (typeof g === 'string') items.push({ img: imgUrl(g) });
      else items.push({ video: g.src, poster: g.poster });
    });
    return items;
  }

  /** Enlaces públicos del proyecto, en el orden de LINK_ORDER. */
  function linksOf(p) {
    return LINK_ORDER.filter((k) => p.links && p.links[k]).map((k) =>
      h('a', {
        href: p.links[k],
        target: '_blank',
        rel: 'noopener',
      }, t(`link.${k}`), h('span', { 'aria-hidden': 'true', text: ' ↗' }))
    );
  }

  /** Bloque "lo que hice": qué hice y cuál fue la parte difícil. */
  function roleOf(L) {
    if (!L.role) return null;
    return h('p', { class: 'card__role' },
      h('span', { class: 'card__role-k', text: t('card.role') }),
      L.role
    );
  }

  /** Cifras medidas del proyecto. `stats` vive en el proyecto, no en el idioma. */
  function statsOf(p) {
    if (!p.stats) return null;
    return h('ul', { class: 'card__nums' },
      p.stats.map(([value, label]) =>
        h('li', {}, h('b', { text: value }), h('span', { text: tx(label) })))
    );
  }

  /** Construye la tarjeta de un proyecto. */
  function card(p) {
    const L = loc(p);
    const pillar = PILLARS.find((x) => x.id === p.pillar);

    // --- medio de la tarjeta -------------------------------------------
    let media;
    if (p.video) {
      // Bucle mudo: solo se carga y reproduce cuando la tarjeta está a la vista.
      media = h('div', { class: 'card__media' },
        h('video', {
          'data-src': `video/${p.video.loop}.mp4`,
          poster: imgUrl(p.video.poster),
          muted: '', loop: '', playsinline: '', preload: 'none',
          'aria-label': L.title,
        })
      );
    } else if (p.img) {
      media = h('div', { class: 'card__media' },
        h('img', { src: imgUrl(p.img), alt: L.title, loading: 'lazy' })
      );
    } else {
      // Sin captura todavía: portada generada con código.
      media = h('div', { class: 'card__media' },
        h('canvas', { class: 'card__cover', 'data-cover': p.id, 'data-pillar': p.pillar, 'aria-hidden': 'true' }),
        h('p', { class: 'card__stamp', text: L.status })
      );
    }

    // Contador de medios: avisa de que la tarjeta tiene ficha con más contenido.
    const count = galleryOf(p).length;
    if (count > 1) {
      media.append(h('p', { class: 'card__count', 'aria-hidden': 'true', text: `▦ ${count} ${t('card.media')}` }));
    }

    // --- cuerpo de la tarjeta ------------------------------------------
    const body = h('div', { class: 'card__body' },
      h('p', { class: 'card__meta' },
        h('span', { text: p.year }),
        h('span', { class: 'card__status', text: L.status })
      ),
      h('h4', { class: 'card__title' },
        h('button', { type: 'button', class: 'card__open', 'data-open': p.id, text: L.title })
      ),
      h('p', { class: 'card__text', text: L.text }),
      roleOf(L),
      statsOf(p),
      h('ul', { class: 'card__tags' }, p.tags.map((tag) => h('li', { text: tag }))),
      h('p', { class: 'card__links' }, linksOf(p))
    );

    return h('article', {
      class: `card${p.featured ? ' card--featured' : ''}`,
      style: `--c:${pillar ? pillar.color : 'var(--cyan)'}`,
      'data-id': p.id,
    }, media, body);
  }

  /** Pinta las portadas procedurales de las tarjetas que no tienen imagen. */
  function drawCovers() {
    $$('canvas[data-cover]').forEach((cv) => {
      const pillar = PILLARS.find((x) => x.id === cv.dataset.pillar);
      FX.cover(cv, FX.hash(cv.dataset.cover), pillar ? pillar.color : null);
    });
  }

  let resizeTimer;
  addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(drawCovers, 200);
  });

  /* ── 6. Ficha de proyecto (visor) ─────────────────────────────────────── */

  const detail = $('.detail');
  const stage = $('.detail__stage');
  let current = null;   // { p, items, i }

  /** Abre la ficha de un proyecto. */
  function openDetail(id) {
    const p = PROJECTS.find((x) => x.id === id);
    if (!p) return;

    const L = loc(p);
    const pillar = PILLARS.find((x) => x.id === p.pillar);
    current = { p, items: galleryOf(p), i: 0 };

    detail.style.setProperty('--c', pillar ? pillar.color : 'var(--cyan)');
    $('.detail__title').textContent = L.title;

    // Miniaturas: solo si hay más de un medio.
    const thumbs = $('.detail__thumbs');
    thumbs.hidden = current.items.length < 2;
    thumbs.replaceChildren(...current.items.map((it, i) =>
      h('button', {
        type: 'button',
        class: `detail__thumb${it.video ? ' is-video' : ''}`,
        'data-index': i,
        'aria-label': `${i + 1} / ${current.items.length}`,
      }, it.poster || it.img ? h('img', { src: it.video ? it.poster : it.img, alt: '', loading: 'lazy' }) : null)
    ));

    // Textos de la ficha.
    $('.detail__body').replaceChildren(...[
      h('p', { class: 'card__meta' },
        h('span', { text: p.year }),
        h('span', { class: 'card__status', text: L.status })
      ),
      h('p', { class: 'detail__text', text: L.text }),
      roleOf(L),
      statsOf(p),
      h('ul', { class: 'card__tags' }, p.tags.map((tag) => h('li', { text: tag }))),
      h('p', { class: 'card__links' }, linksOf(p)),
    ].filter(Boolean));

    detail.showModal();
    show(0);
  }

  /** Muestra el medio `i` del visor. */
  function show(i) {
    if (!current) return;
    const { items } = current;
    const n = items.length;

    // Pausa el vídeo anterior antes de sustituirlo.
    const old = stage.querySelector('video');
    if (old) old.pause();

    if (!n) return;

    current.i = (i + n) % n;
    const it = items[current.i];
    const title = loc(current.p).title;

    const el = it.video
      ? h('video', { src: it.video, poster: it.poster, controls: '', playsinline: '', preload: 'metadata' })
      : h('img', { src: it.img, alt: `${title} · ${current.i + 1} / ${n}` });

    const nav = n > 1 ? [
      h('button', { type: 'button', class: 'detail__nav detail__nav--prev', 'data-step': -1, 'aria-label': t('detail.prev'), text: '‹' }),
      h('button', { type: 'button', class: 'detail__nav detail__nav--next', 'data-step': 1, 'aria-label': t('detail.next'), text: '›' }),
      h('p', { class: 'detail__count', text: `${current.i + 1} / ${n}` }),
    ] : [];

    stage.replaceChildren(el, ...nav);
    if (it.video) el.play().catch(() => { /* el navegador puede bloquearlo */ });

    // Marca la miniatura activa.
    $$('.detail__thumb').forEach((b, k) => b.setAttribute('aria-current', k === current.i));
    const active = $('.detail__thumb[aria-current="true"]');
    if (active) active.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }

  // Clic en un botón de "abrir ficha" o en la tarjeta.
  document.addEventListener('click', (e) => {
    const opener = e.target.closest('[data-open]');
    if (opener) { openDetail(opener.dataset.open); return; }

    const cardEl = e.target.closest('.card[data-id]');
    if (cardEl && !e.target.closest('a, button')) openDetail(cardEl.dataset.id);
  });

  // Navegación dentro del visor.
  detail.addEventListener('click', (e) => {
    if (e.target === detail) { detail.close(); return; }
    const step = e.target.closest('[data-step]');
    if (step) { show(current.i + Number(step.dataset.step)); return; }
    const thumb = e.target.closest('[data-index]');
    if (thumb) show(Number(thumb.dataset.index));
  });

  detail.addEventListener('keydown', (e) => {
    if (!current || e.target.tagName === 'VIDEO') return;  // en el vídeo las flechas son del reproductor
    if (e.key === 'ArrowRight') show(current.i + 1);
    if (e.key === 'ArrowLeft') show(current.i - 1);
  });

  detail.addEventListener('close', () => {
    // El evento 'close' llega tarde: si ya se abrió otra ficha, no se toca.
    if (detail.open) return;
    const v = stage.querySelector('video');
    if (v) { v.pause(); v.removeAttribute('src'); v.load(); }
    stage.replaceChildren();
    current = null;
  });

  $('.detail__close').addEventListener('click', () => detail.close());

  /* ── 7. Hero: cubo y semilla ──────────────────────────────────────────── */
  /* La semilla es la fecha de hoy (AAAAMMDD): el cubo cambia cada día. */

  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const now = new Date();
  let seed = now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate();

  const heroCube = FX.cube($('.hero__cube'));
  heroCube.setSeed(seed);

  const seedLabel = $('.hero__seed');
  const showSeed = () => { if (seedLabel) seedLabel.textContent = seed; };

  $('.hero__again').addEventListener('click', () => {
    seed = (Math.random() * 1e8) | 0;
    showSeed();
    heroCube.setSeed(seed);
    if (reducedMotion) heroCube.redraw();
  });

  /* ── 8. Navegación móvil y animaciones ────────────────────────────────── */

  // Vídeos en bucle: solo cargan y corren cuando están a la vista.
  const io = 'IntersectionObserver' in window
    ? new IntersectionObserver((entries) => {
        for (const entry of entries) {
          const v = entry.target;
          if (entry.isIntersecting) {
            if (!v.src) v.src = v.dataset.src;
            v.play().catch(() => { /* autoplay bloqueado */ });
          } else {
            v.pause();
          }
        }
      }, { threshold: 0.35 })
    : null;

  function watchVideos() {
    if (reducedMotion || !io) return;
    $$('video[data-src]').forEach((v) => { v.muted = true; io.observe(v); });
  }

  // Menú en móvil: el botón abre y cierra la lista de enlaces.
  const menuBtn = $('.nav__toggle');
  const navLinks = $('.nav__links');
  if (menuBtn && navLinks) {
    menuBtn.addEventListener('click', () => {
      const open = navLinks.classList.toggle('is-open');
      menuBtn.setAttribute('aria-expanded', String(open));
    });
    // Al pulsar un enlace, el menú se cierra.
    navLinks.addEventListener('click', (e) => {
      if (e.target.tagName === 'A') {
        navLinks.classList.remove('is-open');
        menuBtn.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // Entrada de los bloques al hacer scroll.
  const revealTargets = ['.sect__head', '.pillar', '.skill', '.about__side', '.about__text', '.journey'];
  let revealer = null;   // el observador vivo, para poder reconectarlo
  let pendingReveal = []; // bloques marcados que aún no han aparecido

  /**
   * Marca los bloques para que aparezcan al entrar en pantalla.
   * Se puede volver a llamar (por ejemplo al cambiar de idioma): los bloques
   * que ya se habían visto conservan su estado y los nuevos se animan.
   */
  function setupReveal() {
    if (!('IntersectionObserver' in window) || reducedMotion) return;

    // Observador anterior: se desconecta para no observar dos veces lo mismo.
    if (revealer) revealer.disconnect();

    const obs = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('is-in');
        obs.unobserve(entry.target);
      }
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });

    revealer = obs;

    revealTargets.forEach((sel) => {
      $$(sel).forEach((el, i) => {
        el.classList.add('reveal');
        el.style.transitionDelay = `${Math.min(i, 4) * 60}ms`;
        obs.observe(el);
      });
    });

    pendingReveal = $$('.reveal:not(.is-in)');
  }

  /**
   * Un salto brusco (tecla Fin, rueda rápida, ancla) puede dejar bloques por
   * encima del viewport sin que el observador llegue a verlos nunca: aquí se
   * revelan igualmente, para que nunca quede un hueco en blanco.
   */
  function sweepReveal() {
    if (!pendingReveal.length) return;
    const rest = [];
    for (const el of pendingReveal) {
      if (el.classList.contains('is-in')) continue;         // ya apareció
      if (el.getBoundingClientRect().bottom < 0) {           // quedó por encima
        el.classList.add('is-in');
        if (revealer) revealer.unobserve(el);
      } else {
        rest.push(el);
      }
    }
    pendingReveal = rest;
  }

  // Barrido al hacer scroll, limitado a un fotograma por movimiento.
  let sweepRaf = 0;
  addEventListener('scroll', () => {
    if (sweepRaf) return;
    sweepRaf = requestAnimationFrame(() => { sweepRaf = 0; sweepReveal(); });
  }, { passive: true });

  // Conmutador de idioma (delegado: los botones se repintan en cada render).
  $('.lang').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-set-lang]');
    if (!btn) return;
    const next = btn.dataset.setLang;
    if (!LANGS_CODES.includes(next) || next === lang) return;
    lang = next;
    try { localStorage.setItem('lang', lang); } catch (err) { /* sin storage */ }
    render();
  });

  /* ── Arranque ─────────────────────────────────────────────────────────── */

  render();
  showSeed();
  heroCube.start();
  FX.mark($('.nav__mark'));
})();
