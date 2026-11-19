# SrDragoDoro.github.io

Portafolio de **DragoDoro** — Gameplay & Systems Programmer.
Sitio estático publicado con GitHub Pages: **https://srdragodoro.github.io**

La interfaz está inspirada en **Geometry Dash**: un nivel de cuatro checkpoints (0 %, 35 %, 70 %,
95 %), un cubo jugador con física de salto, color triggers entre secciones, barras de progreso y
un garaje de skins. Todo se dibuja con Canvas 2D y JavaScript vanilla, sin frameworks ni build.

---

## Estructura

```text
index.html            Estructura semántica: HUD, secciones, modal y toast.
css/style.css         Tokens, componentes, animaciones y responsive.
js/data.js            >>> TODO EL CONTENIDO EDITABLE <<<
js/canvas.js          Motor 2D: parallax, suelo, cubo, física y partículas.
js/audio.js           SFX sintetizados con Web Audio API (sin archivos).
js/main.js            Navegación, carrusel, skills, modales y teclado.
cv.html               CV imprimible (fuente del PDF, una página A4).
cv/DragoDoro-CV.pdf   CV listo para descargar desde la sección Stats.
img/                  Avatar, capturas, póster y favicon.
video/                Gameplay en bucle para la ficha de Bookworm Adventure 2.
games/                Juego independiente Collector 3D.
serve.ps1             Servidor local de desarrollo (Windows, sin dependencias).
```

## Cómo se usa

- **Barra superior:** clic en cualquier checkpoint, o en `‹` / `›`.
- **Teclado:** `←` / `→` cambian de sección. En Niveles, `A` / `D` o `↑` / `↓` cambian de
  proyecto. `Esc` cierra la ficha de proyecto.
- **Cubo:** haz clic sobre él para un salto vertical con rotación de 180°.
- **Niveles:** usa las flechas laterales, los puntos o el swipe en móvil. Al cambiar de
  proyecto, un telón de terciopelo rojo cierra la escena, cambia la tarjeta/repo y vuelve a
  abrirse. El botón *PLAY / VER CÓDIGO* abre el brief técnico del proyecto.
- **Icon Kit:** al elegir una tecnología, el cubo cambia de color y patrón en tiempo real y el
  panel inferior muestra el dominio y los sistemas programados.
- **Stats:** descarga el CV, abre GitHub / releases o copia el enlace del portafolio.
  Al copiar se muestra una notificación de *logro desbloqueado*.
- **Sonido:** silenciado por defecto. El botón de la derecha activa los SFX sintetizados.

## Editar el contenido

Abre `js/data.js`. No hace falta tocar HTML, CSS ni el resto de JS.

```js
window.GD_DATA = {
  profile: { ... },        // Nombre, alias, rol, tagline y avatar.
  sections: [ ... ],       // Checkpoints, etiquetas y paletas de color.
  projects: [ ... ],       // Proyectos / niveles.
  skills: [ ... ],         // Icon Kit, dominio y skins del cubo.
  stats: { ... },          // Bio breve y cifras del perfil.
  links: { ... },          // GitHub, releases, CV, LinkedIn, Itch, email…
  contact: { ... },        // Textos de la tarjeta de contacto.
};
```

### Añadir un proyecto

Copia un objeto de `projects` y ajusta:

| Campo            | Qué es                                                                 |
| ---------------- | ---------------------------------------------------------------------- |
| `id`             | Identificador único.                                                   |
| `name`, `engine` | Título y motor/tecnología.                                             |
| `year`, `status` | Periodo y estado mostrado en la tarjeta.                               |
| `difficulty`     | `normal`, `harder`, `insane` o `demon` (dibuja la cara SVG).           |
| `difficultyNote` | Texto corto bajo el resumen.                                           |
| `accent`         | Color de la tarjeta y de sus barras.                                   |
| `summary`        | Texto de la tarjeta.                                                   |
| `description`    | Brief técnico del modal.                                               |
| `patterns`       | Lista de patrones / decisiones técnicas.                               |
| `bars`           | `[{ label, value }]` para las dos barras de progreso.                  |
| `tags`           | Chips de tecnologías.                                                  |
| `media`          | `{ type:'video'\|'image', src, poster }` o `null` para placeholder.    |
| `links`          | `repo`, `release`, `itch`, `live`; los que falten no se muestran.       |

### Activar LinkedIn, Itch.io o email

En `js/data.js`, dentro de `links`, rellena los campos vacíos:

```js
links: {
  github: 'https://github.com/SrDragoDoro',
  linkedin: 'https://www.linkedin.com/in/tu-usuario',
  itch: 'https://tu-usuario.itch.io',
  email: 'tu@correo.com',
  // ...
}
```

No hay que tocar `main.js`: los botones aparecen automáticamente y el botón de email copia la
dirección al portapapeles con su toast de logro.

### Cambiar los colores de una sección

Cada entrada de `sections` tiene su paleta:

```js
palette: {
  bg: '#1E0B36',       // fondo
  bg2: '#0D041A',      // degradado superior
  ground: '#150724',   // suelo
  ground2: '#080210',  // base del suelo
  accent: '#C084FC',   // neón, HUD y acentos
  accent2: '#A855F7',
}
```

El canvas interpola los valores con `lerp` al cambiar de sección. La UI toma `accent` por
variables CSS, así que el HUD y los focos cambian al mismo tiempo.

### Añadir una skill

Cada skill equipa una skin del cubo:

```js
{
  id: 'csharp',
  name: 'C#',
  icon: 'csharp',       // csharp|cpp|unity|unreal|godot|shader|git|physics
  level: 88,
  levelLabel: 'Avanzado',
  color: '#A78BFA',
  skin: { base: '#7C3AED', accent: '#DDD6FE', pattern: 'checker' },
  text: '…',
  systems: ['…'],
}
```

Patrones disponibles en el canvas: `visor`, `checker`, `stripes`, `split`, `ring`, `dots`,
`cross` y `gradient`.

## CV en PDF

El PDF de `cv/DragoDoro-CV.pdf` se genera desde `cv.html` (una página A4). Si cambias el CV:

1. Abre `http://localhost:8770/cv.html`.
2. Pulsa **Guardar como PDF**.
3. Guarda el archivo como `cv/DragoDoro-CV.pdf`.

También se puede regenerar sin abrir el navegador a mano:

```powershell
& "C:\Program Files\Google\Chrome\Application\chrome.exe" `
  --headless=new --disable-gpu --no-pdf-header-footer `
  --print-to-pdf=".\cv\DragoDoro-CV.pdf" `
  "http://localhost:8770/cv.html"
```

## Probar en local

Cualquier servidor estático sirve. El proyecto incluye uno sin dependencias:

```powershell
powershell -ExecutionPolicy Bypass -File .\serve.ps1 8770
```

Después: <http://localhost:8770>

También vale `python -m http.server 8770`.

## Detalles técnicos

- **Canvas:** `requestAnimationFrame`, `devicePixelRatio` limitado a 2, `dt` acotado para evitar
  saltos al volver a la pestaña. El fondo tiene tres capas de parallax y una rejilla que reacciona
  al desplazamiento del cubo.
- **Física:** salto parabólico de ~0,45 s, rotación de 180° o 360° con easing, squash & stretch
  al aterrizar, estela de partículas y anillo de impacto. El cubo vuelve a quedar de pie al
  aterrizar para que la cara y el visor se lean siempre bien.
- **Dash de sección:** al cambiar de nivel, el cubo crece hasta ~5× su tamaño en una capa de
  canvas por encima del contenido, gira 720°, cruza la pantalla con estelas, líneas de velocidad
  y ondas de choque, y se encoge en el nuevo checkpoint. La sección entra mientras el cubo pasa,
  así que el cambio queda enmascarado por el dash.
- **Telón de proyecto:** el carrusel de Niveles se cambia con un telón CSS de terciopelo rojo,
  guirnalda dorada y flecos. Cierra en 1 s, cambia la tarjeta y el repo detrás del telón, y abre
  en 1,75 s comprimiendo la tela con `scaleX(0.2)` + `skewY` para simular que se frunce y se
  recoge. El sello central muestra el número de nivel y el proyecto nuevo.
- **Color triggers:** paletas RGB interpoladas por frame con un factor exponencial; la UI cambia
  con variables CSS.
- **Audio:** osciladores, envolventes y ruido generado en `AudioContext`. No hay archivos ni
  librerías; el contexto se crea solo al pulsar el botón de sonido.
- **Accesibilidad:** navegación por teclado, `aria-current` en el checkpoint activo,
  `role="progressbar"`, diálogo nativo con foco atrapado, `aria-live` para anuncios y
  `prefers-reduced-motion` para desactivar animaciones.
- **Responsive:** sin overflow horizontal desde 320 px. El layout compacta el lobby en pantallas
  bajas y el carrusel se convierte en una columna con swipe.

## Desplegar

GitHub Pages sirve la rama `main` tal cual:

`Settings → Pages → Deploy from a branch → main → / (root)`

No hay paso de build. Lo que hay en el repositorio es exactamente lo que se publica.

---

Hecho a mano con HTML5, CSS3, Canvas 2D y JavaScript vanilla. Sin frameworks, sin dependencias
de build y sin archivos de audio externos.
