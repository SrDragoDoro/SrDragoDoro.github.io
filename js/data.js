/* =============================================================================
 * data.js — CONTENIDO EDITABLE DEL PORTAFOLIO
 *
 * Todo lo que se ve en la web sale de este archivo. Para cambiar textos,
 * proyectos, skills o enlaces no hace falta tocar index.html, main.js ni CSS.
 *
 * Los proyectos salen de los repositorios públicos de github.com/SrDragoDoro.
 * ========================================================================== */

window.GD_DATA = {
  /* ── Perfil ──────────────────────────────────────────────────────────── */
  profile: {
    name: 'DragoDoro',
    fullName: 'Sr. DragoDoro',
    alias: 'PLAYER 01',
    role: 'Gameplay & Systems Programmer',
    tagline:
      'Programo el juego entero —lógica, sistemas, shaders e interfaz— y también las herramientas que lo sostienen.',
    location: 'España · Disponible en remoto',
    availability: 'Abierto a nuevas oportunidades',
    avatar: 'img/avatar.webp',
  },

  /* ── Secciones y color triggers ──────────────────────────────────────── */
  /* progress: posición del checkpoint en la barra de nivel (0–100).
   * palette:  colores que el canvas interpola al cambiar de sección.
   *           Toda la web usa la paleta rojo/negro del ícono del cubo.      */
  sections: [
    {
      id: 'inicio',
      label: 'Inicio',
      short: 'LOBBY',
      progress: 0,
      palette: {
        bg: '#1A0404',
        bg2: '#0A0101',
        ground: '#120202',
        ground2: '#070000',
        accent: '#E10600',
        accent2: '#FF5A52',
      },
    },
    {
      id: 'juegos',
      label: 'Videojuegos',
      short: 'VIDEOJUEGOS',
      progress: 35,
      palette: {
        bg: '#170304',
        bg2: '#090101',
        ground: '#100202',
        ground2: '#060000',
        accent: '#FF3B30',
        accent2: '#FF7A70',
      },
    },
    {
      id: 'creaciones',
      label: 'Creaciones',
      short: 'CREACIONES',
      progress: 70,
      palette: {
        bg: '#1D0502',
        bg2: '#0C0200',
        ground: '#140302',
        ground2: '#080100',
        accent: '#FF2D20',
        accent2: '#FF8A80',
      },
    },
    {
      id: 'sobre-mi',
      label: 'Sobre mi',
      short: 'SOBRE MÍ',
      progress: 95,
      palette: {
        bg: '#120305',
        bg2: '#070101',
        ground: '#0C0203',
        ground2: '#040000',
        accent: '#D40000',
        accent2: '#FF453A',
      },
    },
  ],

  /* ── Vídeos del inicio ────────────────────────────────────────────────── */
  /* Se reproducen en cadena: al terminar uno pasa al siguiente.
   * type: 'file' (mp4 local) o 'youtube' (pega el ID del vídeo).
   * Si una entrada no tiene src/youtubeId se muestra un hueco en blanco.    */
  videos: [
    {
      title: 'Bookworm Adventure 2 · Gameplay',
      type: 'file',
      src: 'video/ba2-gameplay.mp4',
      poster: 'img/ba2-gameplay-poster.webp',
    },
    {
      title: 'Tu vídeo de YouTube (pega el enlace en js/data.js)',
      type: 'youtube',
      youtubeId: '',
    },
  ],

  /* ── Proyectos / niveles ─────────────────────────────────────────────── */
  /*
   * group:      'juegos' (sección Videojuegos) o 'creaciones' (Creaciones).
   * difficulty: 'normal' | 'harder' | 'insane' | 'demon'
   * bars:       las dos barras de progreso de la tarjeta.
   * patterns:   patrones de diseño / decisiones técnicas que se muestran en el modal.
   * media:      { type:'video'|'image'|null, src, poster } — null = placeholder.
   */
  projects: [
    {
      id: 'bookworm',
      group: 'juegos',
      name: 'Bookworm Adventure 2',
      engine: 'Unity 6 · URP 2D',
      year: '2025 — 2026',
      status: 'EN DESARROLLO',
      difficulty: 'insane',
      difficultyNote: 'Lógica de puzzles + contenido data-driven',
      accent: '#FF5A52',
      summary:
        'Remake jugable en español del clásico de 2007: menú, mapa, tutorial y batallas de palabras con un tablero por partes.',
      description:
        'Reconstrucción completa del bucle de Bookworm Adventures: se seleccionan letras del tablero, se forman palabras y cada palabra ataca o cura según el estado del combate. Todo el texto, los diálogos y los libros legibles están traducidos al español y centralizados en un archivo de palabras.',
      patterns: [
        'Máquina de estados para turnos, combate y navegación',
        'ScriptableObjects para enemigos, objetos y modificadores',
        '2D Tilemap para el tablero y la lectura de páginas',
        'UI dirigida por eventos, sin lógica de juego en la escena',
        'Datos de texto centralizados para traducir sin recompilar',
      ],
      bars: [
        { label: 'Arquitectura & Sistemas', value: 82 },
        { label: 'Gameplay & Pulido', value: 68 },
      ],
      tags: ['Unity 6', 'C#', 'URP 2D', 'Input System', 'Tilemap', 'HLSL'],
      media: {
        type: 'video',
        src: 'video/ba2-gameplay.mp4',
        poster: 'img/ba2-gameplay-poster.webp',
      },
      links: {
        repo: 'https://github.com/SrDragoDoro/Bookworm-Adventure-2',
      },
    },
    {
      id: 'cloud2026',
      group: 'juegos',
      name: 'Cloud2026',
      engine: 'Unity 6 · Unity Gaming Services',
      year: '2026',
      status: 'CURSO · 16 SEMANAS',
      difficulty: 'demon',
      difficultyNote: 'Cliente sin autoridad + economía en servidor',
      accent: '#FF3B30',
      summary:
        'Juego con todo su estado en la nube: autenticación, guardado, economía, rankings y configuración remota.',
      description:
        'La regla del proyecto: el cliente nunca es la autoridad. Ningún saldo, precio o progreso se calcula en C#. El cliente solicita una acción, Cloud Code la valida contra el estado real del servidor y su propio reloj, y devuelve el resultado. La presentación reacciona sin poder alterar la economía.',
      patterns: [
        'Server Authoritative: el servidor decide, el cliente muestra',
        'Cloud Code como única fuente de verdad de la economía',
        'Remote Config para balancear sin publicar build',
        'Cloud Save y Leaderboards con validación del servidor',
        'Separación estricta entre presentación y estado remoto',
      ],
      bars: [
        { label: 'Arquitectura & Sistemas', value: 92 },
        { label: 'Gameplay & Pulido', value: 58 },
      ],
      tags: ['Unity 6', 'C#', 'Cloud Code', 'Economy', 'Remote Config', 'UGS'],
      media: null,
      links: {
        repo: 'https://github.com/SrDragoDoro/Cloud2026',
      },
    },
    {
      id: 'cursorrotator',
      group: 'creaciones',
      name: 'CursorRotator',
      engine: 'C# · .NET 10 · WinForms',
      year: '2026',
      status: 'PUBLICADO · v2.5.2',
      difficulty: 'harder',
      difficultyNote: 'Interoperabilidad Win32 + rendimiento en reposo',
      accent: '#FF7043',
      summary:
        'App de escritorio que instala paquetes de cursores y los rota sola, con estelas y efectos reactivos al hacer clic.',
      description:
        'Herramienta nativa de Windows que instala paquetes de cursores en un clic y los cambia por intervalo, a horas fijas o al azar. Encima añade un motor de estelas de partículas que dibuja sobre otras ventanas sin privilegios, con coordenadas reales en varios monitores y DPI distintos.',
      patterns: [
        'Hook global de ratón con hibernación por inactividad',
        'Manifest PerMonitorV2 para coordenadas 1:1 reales',
        'Registro HKCU para instalar cursores sin administrador',
        'Publicación single-file autocontenida',
        'Tests xUnit y CI con GitHub Actions',
      ],
      bars: [
        { label: 'Arquitectura & Sistemas', value: 88 },
        { label: 'Gameplay & Pulido', value: 74 },
      ],
      tags: ['C#', '.NET 10', 'WinForms', 'Win32', 'xUnit', 'CI'],
      media: {
        type: 'image',
        src: 'img/cursorrotator.webp',
        poster: 'img/cursorrotator.webp',
      },
      links: {
        repo: 'https://github.com/SrDragoDoro/CursorRotator',
        release: 'https://github.com/SrDragoDoro/CursorRotator/releases/tag/v2.5.2',
      },
    },
    {
      id: 'doros',
      group: 'juegos',
      name: 'DorosLaInvasión',
      engine: 'Unity 6 · URP 2D',
      year: '2025 — 2026',
      status: 'PROYECTO FINAL DE CURSO',
      difficulty: 'normal',
      difficultyNote: 'Primer juego completo, del enunciado al build',
      accent: '#FF1744',
      summary:
        'Juego 2D con cámara cinemática, input por action maps, sprites animados y audio. El primero que llevé de principio a fin.',
      description:
        'Proyecto final del curso de Fundamentos de Programación. Es el punto donde aprendí a separar lógica de juego y composición de escena, a usar Cinemachine para la cámara y a leer los errores de compilación como mensajes en vez de misterios.',
      patterns: [
        'Action Maps del Input System para control desacoplado',
        'Cinemachine para seguimiento y límites de cámara',
        'Separación entre lógica de gameplay y escena',
        'Animación por sprites y audio centralizado',
      ],
      bars: [
        { label: 'Arquitectura & Sistemas', value: 56 },
        { label: 'Gameplay & Pulido', value: 64 },
      ],
      tags: ['Unity 6', 'C#', 'URP 2D', 'Cinemachine', 'Input System', 'Audio'],
      media: null,
      links: {
        repo: 'https://github.com/SrDragoDoro/DorosLaInvasion',
      },
    },
    {
      id: 'portfolio',
      group: 'creaciones',
      name: 'Este portafolio',
      engine: 'HTML · CSS · JavaScript · Canvas',
      year: '2026',
      status: 'EN LÍNEA',
      difficulty: 'harder',
      difficultyNote: 'Interfaz jugable sin frameworks',
      accent: '#E10600',
      summary:
        'La web que estás viendo: HUD estilo Geometry Dash, físicas propias del cubo, telón de teatro y todo el contenido en un solo archivo.',
      description:
        'Sitio estático sin build ni dependencias. El fondo y el cubo se dibujan en un canvas con física propia, los SFX se sintetizan con Web Audio API y todo el contenido vive en un único archivo de datos, así que se puede editar sin tocar el código.',
      patterns: [
        'JavaScript vanilla: cero dependencias',
        'Canvas 2D para el mundo, el cubo y las partículas',
        'Contenido data-driven en un solo archivo',
        'Web Audio API para los sonidos',
        'Accesibilidad y prefers-reduced-motion',
      ],
      bars: [
        { label: 'Arquitectura & Sistemas', value: 78 },
        { label: 'Gameplay & Pulido', value: 74 },
      ],
      tags: ['HTML', 'CSS', 'JavaScript', 'Canvas 2D', 'Web Audio', 'GitHub Pages'],
      media: null,
      links: {
        repo: 'https://github.com/SrDragoDoro/SrDragoDoro.github.io',
        live: 'https://srdragodoro.github.io',
      },
    },
  ],

  /* ── Icon Kit / Stack técnico ────────────────────────────────────────── */
  /*
   * icon:    clave del SVG que pinta main.js (csharp, unity, shader…).
   * skin:    { base, accent, pattern } — el cubo del canvas cambia en vivo.
   * pattern: visor | checker | stripes | split | ring | dots | cross
   */
  skills: [
    {
      id: 'csharp',
      name: 'C#',
      icon: 'csharp',
      level: 88,
      levelLabel: 'Avanzado',
      color: '#A78BFA',
      skin: { base: '#7C3AED', accent: '#DDD6FE', pattern: 'checker' },
      text: 'Lenguaje principal de gameplay y herramientas. Lo uso para bucles de juego, UI, editor scripts, tests y apps de escritorio en .NET.',
      systems: ['Gameplay loops', 'ScriptableObjects', 'Editor tooling', 'xUnit', 'WinForms / .NET'],
    },
    {
      id: 'unity',
      name: 'Unity 6',
      icon: 'unity',
      level: 90,
      levelLabel: 'Avanzado',
      color: '#22D3EE',
      skin: { base: '#0891B2', accent: '#A5F3FC', pattern: 'visor' },
      text: 'Motor principal. Trabajo con URP 2D, Input System, 2D Tilemap, Cinemachine, ScriptableObjects y shaders propios en ShaderLab/HLSL.',
      systems: ['URP 2D', 'Input System', 'Tilemap', 'Cinemachine', 'ShaderLab / HLSL', 'Unity Gaming Services'],
    },
    {
      id: 'cpp',
      name: 'C++',
      icon: 'cpp',
      level: 62,
      levelLabel: 'Intermedio',
      color: '#3B82F6',
      skin: { base: '#1D4ED8', accent: '#93C5FD', pattern: 'split' },
      text: 'Base para entender memoria, estructuras de datos y lo que un motor hace por debajo. Lo aplico en ejercicios de simulación y prototipos de bajo nivel.',
      systems: ['Punteros y memoria', 'Estructuras de datos', 'Algoritmos', 'Prototipos de simulación'],
    },
    {
      id: 'unreal',
      name: 'Unreal',
      icon: 'unreal',
      level: 45,
      levelLabel: 'Explorando',
      color: '#FB923C',
      skin: { base: '#C2410C', accent: '#FED7AA', pattern: 'stripes' },
      text: 'Aprendiendo la estructura de proyectos, Blueprints y la base de C++ en Unreal. Sin promesas: es una línea de estudio abierta, no mi motor diario.',
      systems: ['Blueprints', 'Estructura de proyectos', 'Fundamentos de C++ en Unreal'],
    },
    {
      id: 'godot',
      name: 'Godot',
      icon: 'godot',
      level: 40,
      levelLabel: 'Explorando',
      color: '#34D399',
      skin: { base: '#047857', accent: '#A7F3D0', pattern: 'ring' },
      text: 'Prototipos pequeños con GDScript para comparar flujos de trabajo y entender qué aporta un motor ligero frente a Unity.',
      systems: ['GDScript', 'Prototipos 2D', 'Nodos y escenas'],
    },
    {
      id: 'shaders',
      name: 'Shaders / HLSL',
      icon: 'shader',
      level: 70,
      levelLabel: 'Intermedio',
      color: '#C084FC',
      skin: { base: '#9333EA', accent: '#F0ABFC', pattern: 'gradient' },
      text: 'Efectos visuales en URP 2D: disolvencias, outlines, distorsión y materiales que responden al gameplay sin sacrificar legibilidad.',
      systems: ['Shader Graph', 'HLSL', 'Efectos 2D', 'Post-proceso', 'Materiales reactivos'],
    },
    {
      id: 'git',
      name: 'Git',
      icon: 'git',
      level: 80,
      levelLabel: 'Avanzado',
      color: '#F87171',
      skin: { base: '#B91C1C', accent: '#FECACA', pattern: 'cross' },
      text: 'Ramas por feature, commits legibles, releases etiquetadas y CI. Cada repositorio incluye su documento de traspaso para poder continuar sin contexto previo.',
      systems: ['Feature branches', 'Releases', 'GitHub Actions', 'AGENTS.md / CLAUDE.md'],
    },
    {
      id: 'fisica',
      name: 'Física / IA',
      icon: 'physics',
      level: 65,
      levelLabel: 'Intermedio',
      color: '#FACC15',
      skin: { base: '#CA8A04', accent: '#FEF08A', pattern: 'dots' },
      text: 'Movimiento con aceleración, colisiones, steering behaviors y máquinas de estados para enemigos. La parte que hace que un sistema se sienta vivo.',
      systems: ['Cinemática', 'Colisiones', 'Steering behaviors', 'FSM', 'Pathfinding básico'],
    },
  ],

  /* ── Stats / perfil ──────────────────────────────────────────────────── */
  stats: {
    bio:
      'Empecé por los juegos y acabé escribiendo también las herramientas que uso para hacerlos. Me interesa el proyecto completo: la lógica que se ejecuta, la interfaz que se entiende a la primera y el código que otra persona puede continuar.',
    items: [
      { value: '8', label: 'Repos públicos' },
      { value: '2+', label: 'Años programando' },
      { value: '2', label: 'Releases' },
      { value: '3', label: 'Idiomas' },
    ],
    note: 'Unity 6 · C# · .NET · Shaders · Git',
  },

  /* ── Enlaces y contacto ──────────────────────────────────────────────── */
  /*
   * Los enlaces vacíos no se pintan. Rellena los que quieras activar:
   *   linkedin: 'https://www.linkedin.com/in/tu-usuario'
   *   itch:     'https://tu-usuario.itch.io'
   *   email:    'tu@correo.com'
   */
  links: {
    github: 'https://github.com/SrDragoDoro',
    releases: 'https://github.com/SrDragoDoro/CursorRotator/releases',
    site: 'https://srdragodoro.github.io',
    cv: 'cv/DragoDoro-CV.pdf',
    linkedin: '',
    itch: '',
    email: '',
  },

  contact: {
    title: 'HABLEMOS',
    lead: '¿Un juego, un prototipo, una herramienta o un sistema que necesita orden? Escríbeme por cualquiera de estos canales.',
    note: 'Respondo normalmente en menos de 48 h.',
  },
};
