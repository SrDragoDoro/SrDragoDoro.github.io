/* =============================================================================
 * data.js — TODO el contenido del portafolio vive aquí.
 *
 * Regla del proyecto: para tocar el contenido NO hay que abrir index.html ni
 * main.js. Se edita este archivo, se recarga la página y listo.
 *
 * Los datos de los proyectos salen de la API de GitHub (repos públicos de
 * SrDragoDoro): descripciones, lenguajes, stars, releases, versiones de Unity
 * y paquetes del manifest.json. Las cifras de `stats` son medidas, noestimate.
 * ========================================================================== */

/* ── Perfil ──────────────────────────────────────────────────────────────── */
window.PROFILE = {
  name: 'DragoDoro',
  fullName: 'Sr. DragoDoro',
  github: 'https://github.com/SrDragoDoro',
  avatar: 'img/avatar.webp',
};

/* ── Secciones de proyectos ("pilares") ─────────────────────────────────── */
/* pillar: define la sección y el color de acento (--c) que usa la tarjeta. */
window.PILLARS = [
  {
    id: 'juegos',
    color: 'var(--cyan)',
    es: {
      name: 'Juegos',
      blurb: 'Unity 6 con URP 2D. El gameplay completo: entrada, cámara, scripts, shaders, interfaz y balance.',
    },
    en: {
      name: 'Games',
      blurb: 'Unity 6 with 2D URP. The whole gameplay loop: input, camera, scripts, shaders, UI and balance.',
    },
  },
  {
    id: 'herramientas',
    color: 'var(--lime)',
    es: {
      name: 'Herramientas',
      blurb: 'Software de escritorio para Windows. Interfaz nativa, bajo consumo y distribución sin instalación.',
    },
    en: {
      name: 'Tools',
      blurb: 'Windows desktop software. Native UI, low resource usage and a no-install distribution.',
    },
  },
  {
    id: 'web',
    color: 'var(--amber)',
    es: {
      name: 'Web',
      blurb: 'Sitios estáticos que se sirven tal cual: sin build, sin dependencias y con todo el contenido en un archivo de datos.',
    },
    en: {
      name: 'Web',
      blurb: 'Static sites served as-is: no build step, no dependencies, all the content in one data file.',
    },
  },
];

/* ── Proyectos ──────────────────────────────────────────────────────────── */
/*
 * Campos de cada proyecto:
 *   id       identificador único (se usa en el DOM y en el visor)
 *   pillar   'juegos' | 'herramientas' | 'web'
 *   featured true → la tarjeta ocupa dos columnas
 *   year     texto libre con el periodo
 *   img      nombre de un .webp en img/ (sin extensión) o null
 *   video    { loop, poster } → bucle mudo en video/ + póster .webp
 *   gallery  array de 'ruta' (img/shots/x.webp) o { src, poster } para vídeos
 *   tags     tecnologías usadas
 *   links    { repo, live, release } → enlaces públicos
 *   stats    pares [número, etiqueta] con cifras medidas
 *   es / en  { title, status, text, role }
 */
window.PROJECTS = [
  // ─────────────── HERRAMIENTAS ───────────────
  {
    id: 'cursorrotator',
    pillar: 'herramientas',
    featured: true,
    year: '2026',
    img: 'cursorrotator',
    tags: ['C#', '.NET 10', 'WinForms', 'Win32', 'xUnit', 'GitHub Actions', 'PowerShell'],
    links: {
      repo: 'https://github.com/SrDragoDoro/CursorRotator',
      release: 'https://github.com/SrDragoDoro/CursorRotator/releases/tag/v2.5.2',
    },
    stats: [
      ['2', 'releases públicas'],
      ['40+', 'estelas de cursor'],
      ['20', 'efectos de clic'],
      ['0 %', 'CPU en reposo'],
    ],
    es: {
      title: 'CursorRotator',
      status: 'Publicado · v2.5.2',
      text: 'App de escritorio para Windows que instala paquetes de cursores en un clic y los rota solos: por intervalo, a horas fijas o al azar. Encima añade estelas de partículas y efectos reactivos al hacer clic.',
      role: 'Proyecto en solitario, de la idea a la release. Lo difícil: el motor de estelas dibuja encima de otras ventanas sin privilege y con coordenadas 1:1 reales en varios monitores con distinto DPI —de ahí el manifest PerMonitorV2— y un hook global de ratón que hiberna para no gastar CPU cuando no te mueves.',
    },
    en: {
      title: 'CursorRotator',
      status: 'Released · v2.5.2',
      text: 'A Windows desktop app that installs cursor packs in one click and rotates them on its own: on an interval, at fixed hours or at random. On top of that it adds particle trails and reactive click effects.',
      role: 'Solo project, from idea to release. The hard part: the trail engine draws over other windows with no privilege and with true 1:1 coordinates across several monitors with different DPI —hence the PerMonitorV2 manifest— and a global mouse hook that hibernates so it costs no CPU while you are still.',
    },
  },

  // ─────────────── JUEGOS ───────────────
  {
    id: 'bookworm2',
    pillar: 'juegos',
    featured: true,
    year: '2025 – 2026',
    img: null,
    video: { loop: 'ba2-gameplay', poster: 'ba2-gameplay-poster' },
    gallery: ['shots/ba2-1', 'shots/ba2-2', 'shots/ba2-3', 'shots/ba2-4'],
    tags: ['Unity 6', 'URP 2D', 'Input System', '2D Tilemap', 'ScriptableObjects', 'Odin Inspector', 'HLSL'],
    links: { repo: 'https://github.com/SrDragoDoro/Bookworm-Adventure-2' },
    stats: [
      ['5', 'escenas jugables'],
      ['V1.2', 'rama de trabajo'],
      ['100 %', 'en español'],
    ],
    es: {
      title: 'Bookworm Adventure 2',
      status: 'En desarrollo',
      text: 'Remake del juego de 2007 Bookworm Adventures, pero traducido: todo el texto, los diálogos y la lectura de las páginas están en español. Menú, prólogo, tutorial, mapa y los libros que se pueden leer.',
      role: 'Proyecto en solitario, diseño y código. Lo difícil: reconstruir la lógica de las páginas —qué se ve, qué se arrastra, qué se suelta— sobre 2D Tilemap, con los datos de enemigos y modificadores en ScriptableObjects y un archivo de palabras que centraliza todo el texto del juego.',
    },
    en: {
      title: 'Bookworm Adventure 2',
      status: 'In development',
      text: 'A remake of the 2007 game Bookworm Adventures, but translated: all the text, the dialogue and the page reading are in Spanish. Menu, prologue, tutorial, map and the books you can read.',
      role: 'Solo project, design and code. The hard part: rebuilding the page logic —what you see, what you drag, what you let go of— on top of 2D Tilemap, with enemy and modifier data in ScriptableObjects and a word file that centralises every string in the game.',
    },
  },
  {
    id: 'cloud2026',
    pillar: 'juegos',
    year: '2026',
    img: null,
    tags: ['Unity 6', 'Unity Gaming Services', 'Cloud Code', 'Remote Config', 'Economy', 'MCP'],
    links: { repo: 'https://github.com/SrDragoDoro/Cloud2026' },
    stats: [
      ['8', 'servicios de UGS'],
      ['16', 'semanas de curso'],
      ['2', 'capas de authority'],
    ],
    es: {
      title: 'Cloud2026',
      status: 'Curso · 16 semanas',
      text: 'Un juego de Unity 6 con todo su estado en la nube: autenticación, guardado, economía, tablas de clasificación y configuración remota, con el Cloud Code decidiendo y el cliente solo mostrando.',
      role: 'Proyecto del curso de desarrollo de videojuegos en soluciones cloud. Lo difícil (y la regla del proyecto): el cliente no es la autoridad. Ningún saldo, precio ni progreso se calcula en C#; el cliente pide, Cloud Code valida contra el estado real del servidor y contra su reloj, y devuelve el resultado.',
    },
    en: {
      title: 'Cloud2026',
      status: 'Course · 16 weeks',
      text: 'A Unity 6 game with all of its state in the cloud: authentication, save, economy, leaderboards and remote config, with Cloud Code deciding and the client only showing the result.',
      role: 'Project for the game development in cloud solutions course. The hard part (and the project rule): the client is not the authority. No balance, price or progress is computed in C#; the client asks, Cloud Code validates against the real server state and against its own clock, and returns the result.',
    },
  },
  {
    id: 'protocolo',
    pillar: 'juegos',
    year: '2026',
    img: null,
    tags: ['Unity 6', 'ASP.NET', '2D Tilemap', 'Animator', 'HLSL'],
    links: { repo: 'https://github.com/SrDragoDoro/PROTOCOLO_ALFA_FRACMENTADO' },
    stats: [
      ['2', 'capas: juego y servidor'],
      ['V1', 'entrega del segundo ciclo'],
    ],
    es: {
      title: 'Protocolo Alfa Fraccionado',
      status: 'Proyecto final de ciclo',
      text: 'Intento de juego tipo Kingdom 2D: unidades, costes y un mapa que se abre por partes, con un backend en ASP.NET para la parte que no puede vivir en el cliente.',
      role: 'Proyecto final del segundo ciclo. Lo difícil: separar la simulación —que tiene que ser determinista y justifiable en el servidor— de la presentación en Unity, y que el juego siga siendo jugable aunque la llamada al backend tarde o falle.',
    },
    en: {
      title: 'Protocolo Alfa Fraccionado',
      status: 'Final year project',
      text: 'A Kingdom 2D-style attempt: units, costs and a map that opens piece by piece, with an ASP.NET backend for the part that cannot live in the client.',
      role: 'Final project of the second cycle. The hard part: separating the simulation —which has to be deterministic and auditable on the server— from the presentation in Unity, and keeping the game playable even when the backend call is slow or fails.',
    },
  },
  {
    id: 'doros',
    pillar: 'juegos',
    year: '2025 – 2026',
    img: null,
    tags: ['Unity 6', 'URP 2D', 'Cinemachine', 'Input System', 'Audio'],
    links: { repo: 'https://github.com/SrDragoDoro/DorosLaInvasion' },
    stats: [
      ['2', 'forks del proyecto'],
      ['1', 'star en GitHub'],
    ],
    es: {
      title: 'DorosLaInvasión',
      status: 'Proyecto final del curso',
      text: 'Proyecto final del curso de Fundamentos de Programación: un juego 2D en Unity con cámara cinemática, input por action map, sprites animados y audio.',
      role: 'Mi primer proyecto completo: del enunciado al build. Lo difícil: aprender a separar lo que es lógica de juego de lo que es escena, y a leer un error de compilación de Unity como lo que es —un mensaje, no un misterio.',
    },
    en: {
      title: 'DorosLaInvasión',
      status: 'Final course project',
      text: 'Final project of the Fundamentals of Programming course: a 2D Unity game with cinematic camera, action-map input, animated sprites and audio.',
      role: 'My first complete project: from brief to build. The hard part: learning to separate game logic from scene setup, and to read a Unity compile error as what it is —a message, not a mystery.',
    },
  },

  // ─────────────── WEB ───────────────
  {
    id: 'portfolio',
    pillar: 'web',
    year: '2026',
    img: null,
    tags: ['HTML', 'CSS', 'JavaScript', 'Canvas 2D', 'GitHub Pages', 'Sin dependencias'],
    links: { repo: 'https://github.com/SrDragoDoro/SrDragoDoro.github.io', live: 'https://srdragodoro.github.io' },
    stats: [
      ['0', 'dependencias'],
      ['2', 'idiomas'],
      ['1', 'archivo de datos'],
    ],
    es: {
      title: 'Este portafolio',
      status: 'En línea',
      text: 'Lo que estás leyendo. Sitio estático sin build ni dependencias: el contenido vive en un único archivo de datos y el cubo del hero se dibuja con canvas en tiempo real.',
      role: 'Diseño, maquetación y código. Lo difícil: que se sienta rápido y vivo sin comprar un framework: el cubo se renderiza celda a celda, las tarjetas se pintan desde un solo array de datos y el sitio funciona igual en un móvil sin potencia.',
    },
    en: {
      title: 'This portfolio',
      status: 'Live',
      text: 'What you are reading. A static site with no build step and no dependencies: the content lives in a single data file and the hero cube is drawn in real time on canvas.',
      role: 'Design, layout and code. The hard part: making it feel fast and alive without buying a framework: the cube is rendered cell by cell, the cards are painted from one data array, and the site behaves the same on a phone with no power to spare.',
    },
  },
];

/* ── Habilidades ────────────────────────────────────────────────────────── */
/* Sin barras de porcentaje: son tecnologias reales agrupadas por contexto. */
window.SKILLS = [
  {
    id: 'motor',
    color: 'var(--cyan)',
    es: {
      title: 'Motor y gameplay',
      text: 'Unity 6 con URP 2D: input por action maps, cámara cinemática, TileMap, datos en ScriptableObjects y shaders propios en HLSL.',
      items: ['Unity 6 (6000.3.x)', 'URP 2D', 'Input System', '2D Tilemap', 'Tilemap Extras', 'Cinemachine', 'Visual Scripting', 'Odin Inspector', 'ScriptableObjects', 'Test Framework', 'ShaderLab / HLSL', 'Aseprite import'],
    },
    en: {
      title: 'Engine & gameplay',
      text: 'Unity 6 with 2D URP: action-map input, cinematic camera, TileMap, data in ScriptableObjects and custom shaders in HLSL.',
      items: ['Unity 6 (6000.3.x)', 'URP 2D', 'Input System', '2D Tilemap', 'Tilemap Extras', 'Cinemachine', 'Visual Scripting', 'Odin Inspector', 'ScriptableObjects', 'Test Framework', 'ShaderLab / HLSL', 'Aseprite import'],
    },
  },
  {
    id: 'nube',
    color: 'var(--violet)',
    es: {
      title: 'Nube y backend',
      text: 'Unity Gaming Services de punta a punta: el estado que afecta al juego se decide en el servidor, nunca en el cliente.',
      items: ['Authentication', 'Cloud Save', 'Economy', 'Cloud Code (JS)', 'Leaderboards', 'Remote Config', 'Deployment', 'ASP.NET', 'Unity MCP'],
    },
    en: {
      title: 'Cloud & backend',
      text: 'Unity Gaming Services end to end: any state that affects the game is decided on the server, never on the client.',
      items: ['Authentication', 'Cloud Save', 'Economy', 'Cloud Code (JS)', 'Leaderboards', 'Remote Config', 'Deployment', 'ASP.NET', 'Unity MCP'],
    },
  },
  {
    id: 'escritorio',
    color: 'var(--lime)',
    es: {
      title: 'Escritorio en .NET',
      text: 'Apps nativas de Windows con WinForms, calls a Win32 para lo que la API no cubre, publicación en un solo ejecutable y tests en CI.',
      items: ['C#', '.NET 10', 'WinForms', 'Hooks globales de ratón', 'Registro HKCU', 'Single-file autocontenido', 'xUnit', 'PowerShell', 'GitHub Actions'],
    },
    en: {
      title: 'Desktop on .NET',
      text: 'Native Windows apps with WinForms, Win32 calls for what the API does not cover, single-executable publishing and tests in CI.',
      items: ['C#', '.NET 10', 'WinForms', 'Global mouse hooks', 'HKCU registry', 'Self-contained single-file', 'xUnit', 'PowerShell', 'GitHub Actions'],
    },
  },
  {
    id: 'web',
    color: 'var(--amber)',
    es: {
      title: 'Web',
      text: 'Sitios estáticos que se despliegan tal cual con GitHub Pages: sin build, sin framework, sin dependencias que outdated.',
      items: ['HTML', 'CSS', 'JavaScript', 'Canvas 2D', 'GitHub Pages', 'i18n', 'Accesibilidad', 'Sin dependencias'],
    },
    en: {
      title: 'Web',
      text: 'Static sites deployed as-is with GitHub Pages: no build, no framework, no dependencies to keep up to date.',
      items: ['HTML', 'CSS', 'JavaScript', 'Canvas 2D', 'GitHub Pages', 'i18n', 'Accessibility', 'No dependencies'],
    },
  },
  {
    id: 'flujo',
    color: 'var(--magenta)',
    es: {
      title: 'Flujo de trabajo',
      text: 'Documento vivo por proyecto para que cualquier chat o persona pueda continuar el trabajo: eso es lo que hay en cada AGENTS.md y CLAUDE.md.',
      items: ['Claude Code', 'OpenCode', 'MCP de Unity', 'AGENTS.md', 'CLAUDE.md', 'Git', 'GitHub', 'CI con avisos como errores'],
    },
    en: {
      title: 'Workflow',
      text: 'A living document per project so any chat or person can continue the work: that is what every AGENTS.md and CLAUDE.md holds.',
      items: ['Claude Code', 'OpenCode', 'Unity MCP', 'AGENTS.md', 'CLAUDE.md', 'Git', 'GitHub', 'CI with warnings as errors'],
    },
  },
  {
    id: 'idiomas',
    color: 'var(--cyan)',
    es: {
      title: 'Idiomas',
      text: 'El perfil de GitHub también está en japonés: es el idioma que estoy aprendiendo ahora mismo.',
      items: ['Español — nativo', 'Japonés — aprendiendo'],
    },
    en: {
      title: 'Languages',
      text: 'The GitHub profile is in Japanese too: that is the language I am learning right now.',
      items: ['Spanish — native', 'Japanese — learning'],
    },
  },
];

/* ── Trayectoria ────────────────────────────────────────────────────────── */
/* Cronología breve. Cada entrada sale de un proyecto real: ajusta las fechas
 * y los títulos cuando quieras contarlo de otra forma. */
window.JOURNEY = [
  {
    when: { es: '2025 – 2026', en: '2025 – 2026' },
    es: {
      role: 'Fundamentos de Programación',
      text: 'Curso de programación y su proyecto final: DorosLaInvasión, un juego 2D en Unity con cámara cinemática, input por action map y audio.',
    },
    en: {
      role: 'Fundamentals of Programming',
      text: 'Programming course and its final project: DorosLaInvasión, a 2D Unity game with a cinematic camera, action-map input and audio.',
    },
  },
  {
    when: { es: '2026', en: '2026' },
    es: {
      role: 'Segundo ciclo',
      text: 'Proyecto final del ciclo: Protocolo Alfa Fraccionado, un intento de juego tipo Kingdom 2D con Unity 6 y un backend en ASP.NET.',
    },
    en: {
      role: 'Second cycle',
      text: 'Final project of the cycle: Protocolo Alfa Fraccionado, a Kingdom 2D-style attempt with Unity 6 and an ASP.NET backend.',
    },
  },
  {
    when: { es: '2026', en: '2026' },
    es: {
      role: 'Videojuegos en soluciones cloud',
      text: 'Curso de 16 semanas sobre Unity Gaming Services: Cloud2026, con la regla de que el cliente pide y el servidor decide.',
    },
    en: {
      role: 'Games in cloud solutions',
      text: 'A 16-week course on Unity Gaming Services: Cloud2026, built on the rule that the client asks and the server decides.',
    },
  },
  {
    when: { es: '2025 – 2026', en: '2025 – 2026' },
    es: {
      role: 'En solitario',
      text: 'Bookworm Adventure 2: remake del juego de 2007 traducido al español, con informe de progreso público y el código abierto.',
    },
    en: {
      role: 'On my own',
      text: 'Bookworm Adventure 2: a remake of the 2007 game translated into Spanish, with a public progress report and open source.',
    },
  },
];

/* ── Sobre mí ───────────────────────────────────────────────────────────── */
window.ABOUT = {
  es: {
    lead: 'Desarrollo videojuegos en Unity y herramientas de escritorio en Windows. Me gusta entender un proyecto de punta a punta: la lógica, la interfaz, los shaders, la escena y las herramientas que hay alrededor.',
    body: [
      'Empecé por los juegos y acabé escribiendo también las herramientas que uso para hacerlos. Eso me ha enseñado a mirar un proyecto desde los dos lados: la parte que se ve en pantalla y la que la sostiene.',
      'En el día a día trabajo con Unity 6, C# y .NET, y me imports de que el código que dejo se entienda a la primera. Cada proyecto tiene su documento de traspaso (AGENTS.md, CLAUDE.md) para que se pueda continuar sin contexto previo.',
      'Fuera del código: estudio japonés y me paso la vida armando cubos de Rubik. Las dos cosas tienen más en común de lo que parece.',
    ],
    facts: [
      ['6', 'repositorios públicos'],
      ['Unity 6', '6000.3.22f1'],
      ['2', 'releases publicadas'],
      ['MIT', 'licencia abierta'],
    ],
  },
  en: {
    lead: 'I build games in Unity and desktop tools for Windows. I like understanding a project end to end: the logic, the interface, the shaders, the scene and the tooling around it.',
    body: [
      'I started with games and ended up writing the tools I use to make them. That taught me to look at a project from both sides: the part you see on screen and the part holding it up.',
      'Day to day I work with Unity 6, C# and .NET, and I care about the code I leave behind being readable on the first try. Every project carries its own handover document (AGENTS.md, CLAUDE.md) so it can be picked up without prior context.',
      'Off the clock: I am studying Japanese and I spend my life solving Rubik’s cubes. The two have more in common than it looks.',
    ],
    facts: [
      ['6', 'public repositories'],
      ['Unity 6', '6000.3.22f1'],
      ['2', 'published releases'],
      ['MIT', 'open licence'],
    ],
  },
};

/* ── Canales de contacto ────────────────────────────────────────────────── */
/* Los que no tengan href no se muestran: añade el tuyo y aparecerá solo. */
window.CONTACT = [
  { label: { es: 'GitHub', en: 'GitHub' }, href: 'https://github.com/SrDragoDoro' },
  { label: { es: 'Releases', en: 'Releases' }, href: 'https://github.com/SrDragoDoro/CursorRotator/releases' },
  { label: { es: 'Este sitio', en: 'This site' }, href: 'https://srdragodoro.github.io' },
  // Añade tu correo así y aparecerá en la lista:
  // { label: { es: 'Email', en: 'Email' }, href: 'mailto:tu@correo.com' },
];

/* ── Textos fijos de la interfaz ────────────────────────────────────────── */
window.UI = {
  es: {
    'nav.projects': 'Proyectos',
    'nav.skills': 'Habilidades',
    'nav.about': 'Sobre mí',
    'nav.contact': 'Contacto',
    'hero.role': 'Game Developer · .NET Developer',
    'hero.lead': 'Videojuegos en Unity 6 y herramientas de escritorio en .NET. Construyo el juego entero —lógica, shaders, interfaz y balance— y también las herramientas que lo hacen más rápido.',
    'hero.cta': 'Ver proyectos',
    'cube.label': 'Cubo nº',
    'cube.note': 'Se arma con código a partir de la fecha de hoy.',
    'cube.again': 'Armar otro',
    'projects.title': 'Proyectos',
    'projects.lead': 'Lo que hay en mi cuenta de GitHub, con lo que hay dentro de cada repositorio. Todos con el código abierto.',
    'skills.title': 'Habilidades',
    'skills.lead': 'Herramientas que uso a diario, agrupadas por para qué las uso y no por como suenan en una lista de CV.',
    'about.title': 'Sobre mí',
    'journey.title': 'Trayectoria',
    'detail.close': 'Cerrar',
    'detail.prev': 'Anterior',
    'detail.next': 'Siguiente',
    'card.role': 'Lo que hice',
    'card.media': 'capturas y vídeos',
    'card.private': 'Código privado',
    'link.repo': 'Código',
    'link.live': 'Ver en vivo',
    'link.release': 'Release',
    'link.video': 'Ver el vídeo',
    'link.notion': 'Informe de progreso',
    'footer.title': 'Hablemos',
    'footer.lead': '¿Un juego, una herramienta de Windows o un proyecto en Unity? Escríbeme por cualquiera de estos canales.',
    'footer.made': 'Hecho a mano: sin plantillas y sin dependencias. El cubo de arriba se arma con código.',
  },
  en: {
    'nav.projects': 'Projects',
    'nav.skills': 'Skills',
    'nav.about': 'About',
    'nav.contact': 'Contact',
    'hero.role': 'Game Developer · .NET Developer',
    'hero.lead': 'Games in Unity 6 and desktop tools on .NET. I build the whole thing —logic, shaders, interface and balance— and the tools that make it faster.',
    'hero.cta': 'See the projects',
    'cube.label': 'Cube no.',
    'cube.note': 'Assembled by code from today’s date.',
    'cube.again': 'Assemble another',
    'projects.title': 'Projects',
    'projects.lead': 'What is on my GitHub account, and what is inside each repository. All of them open source.',
    'skills.title': 'Skills',
    'skills.lead': 'Tools I use every day, grouped by what I use them for and not by how they sound on a résumé list.',
    'about.title': 'About me',
    'journey.title': 'Journey',
    'detail.close': 'Close',
    'detail.prev': 'Previous',
    'detail.next': 'Next',
    'card.role': 'What I did',
    'card.media': 'shots and videos',
    'card.private': 'Private code',
    'link.repo': 'Code',
    'link.live': 'Live',
    'link.release': 'Release',
    'link.video': 'Watch the video',
    'link.notion': 'Progress report',
    'footer.title': 'Let’s talk',
    'footer.lead': 'A game, a Windows tool or a Unity project? Reach me on any of these channels.',
    'footer.made': 'Handmade: no templates and no dependencies. The cube up top is assembled by code.',
  },
};
