# SrDragoDoro.github.io

Portafolio de **DragoDoro** — Gameplay & Systems Programmer.
Sitio estático publicado con GitHub Pages: **https://srdragodoro.github.io**

La interfaz está inspirada en **Geometry Dash**: un nivel de cuatro checkpoints (Inicio,
Videojuegos, Creaciones y Sobre mi), un cubo jugador con física de salto, color triggers entre
secciones, vídeos en cadena, barras de progreso y un telón de teatro. Todo con la paleta
rojo/negro del ícono del cubo, Canvas 2D y JavaScript vanilla, sin frameworks ni build.

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
cv/DragoDoro-CV.pdf   CV listo para descargar desde la sección Sobre mi.
img/                  Ícono del cubo (icono.png), avatar, capturas y póster.
video/                Gameplay en bucle para la ficha de Bookworm Adventure 2.
games/                Juego independiente Collector 3D.
serve.ps1             Servidor local de desarrollo (Windows, sin dependencias).
```

## Cómo se usa

- **Barra superior:** clic en cualquier checkpoint, o en `‹` / `›`.
- **Teclado:** `←` / `→` cambian de sección. En Videojuegos y Creaciones, `A` / `D` o `↑` / `↓`
  cambian de proyecto. `Esc` cierra la ficha de proyecto.
- **Cubo:** haz clic sobre él para un salto vertical con rotación de 180°. El cubo es el ícono
  `img/icono.png`.
- **Inicio:** la parte superior reproduce vídeos en cadena (mp4 locales o YouTube): al terminar
  uno pasa al siguiente deslizándose de derecha a izquierda. Usa las flechas del reproductor para
  ir al anterior o al siguiente.
- **Videojuegos y Creaciones:** carruseles con flechas, puntos, teclado y swipe en móvil. Al
  cambiar de proyecto, un telón de terciopelo rojo cierra la escena, cambia la tarjeta/repo y
  vuelve a abrirse. El botón *PLAY / VER CÓDIGO* abre el brief técnico del proyecto.
- **Sobre mi:** ficha de jugador, garaje de tecnologías (cambian el resplandor y las partículas
  del cubo) y canales de contacto. Descarga el CV, abre GitHub / releases o copia el enlace del
  portafolio. Al copiar se muestra una notificación de *logro desbloqueado*.
- **Sonido:** silenciado por defecto. El botón de la derecha activa los SFX sintetizados.

## Editar el contenido

Abre `js/data.js`. No hace falta tocar HTML, CSS ni el resto de JS.

```js
window.GD_DATA = {
  profile: { ... },        // Nombre, alias, rol, tagline y avatar.
  sections: [ ... ],       // Checkpoints, etiquetas y paletas de color.
  videos: [ ... ],         // Vídeos en cadena del inicio (mp4 o YouTube).
  projects: [ ... ],       // Proyectos, agrupados en juegos / creaciones.
  skills: [ ... ],         // Garaje de tecnologías (en Sobre mi).
  stats: { ... },          // Bio breve y cifras del perfil.
  links: { ... },          // GitHub, releases, CV, LinkedIn, Itch, email…
  contact: { ... },        // Textos de la tarjeta de contacto.
};
```

### Añadir o cambiar un vídeo

```js
videos: [
  // Vídeo local (mp4):
  { title: 'Bookworm Adventure 2 · Gameplay', type: 'file', src: 'video/ba2-gameplay.mp4', poster: 'img/ba2-gameplay-poster.webp' },
  // Vídeo de YouTube (pega el ID del enlace):
  { title: 'Mi tráiler', type: 'youtube', youtubeId: 'dQw4w9WgXcQ' },
]
```

Al terminar uno, el reproductor pasa solo al siguiente con una transición de derecha a izquierda.
Si una entrada no tiene `src`/`youtubeId`, se muestra un hueco en blanco.

### Añadir un proyecto

Copia un objeto de `projects` y ajusta:

| Campo            | Qué es                                                                 |
| ---------------- | ---------------------------------------------------------------------- |
| `id`             | Identificador único.                                                   |
| `group`          | `juegos` (sección Videojuegos) o `creaciones` (sección Creaciones).    |
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

Toda la web usa la paleta rojo/negro del ícono del cubo. Cada entrada de `sections` tiene su
variante:

```js
palette: {
  bg: '#1A0404',       // fondo
  bg2: '#0A0101',      // degradado superior
  ground: '#120202',   // suelo
  ground2: '#070000',  // base del suelo
  accent: '#E10600',   // neón, HUD y acentos
  accent2: '#FF5A52',
}
```

El canvas interpola los valores con `lerp` al cambiar de sección. La UI toma `accent` por
variables CSS, así que el HUD y los focos cambian al mismo tiempo.

### Añadir una skill

Cada skill vive en la sección **Sobre mi**:

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

El cubo es el ícono `img/icono.png`; la skin cambia su resplandor y las partículas que suelta.

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
  al aterrizar, estela de partículas y anillo de impacto. El cubo es el ícono `img/icono.png`.
- **Dash de sección:** al cambiar de nivel, el cubo crece hasta ~5× su tamaño en una capa de
  canvas por encima del contenido, gira 720°, cruza la pantalla con estelas, líneas de velocidad
  y ondas de choque, y se encoge en el nuevo checkpoint. La sección entra mientras el cubo pasa,
  así que el cambio queda enmascarado por el dash.
- **Telón de proyecto:** los carruseles de Videojuegos y Creaciones se cambian con un telón CSS
  de terciopelo rojo, guirnalda dorada y flecos. Cierra en 330 ms, cambia la tarjeta y el repo
  detrás del telón, y abre en 360 ms. El sello central muestra el número de nivel y el proyecto
  nuevo.
- **Vídeos en cadena:** el inicio reproduce una lista editable (mp4 locales o YouTube). Al
  terminar un vídeo pasa al siguiente con una transición de derecha a izquierda; tiene flechas,
  puntos y swipe. YouTube usa la IFrame API para detectar el final.
- **Color triggers:** paletas RGB rojo/negro (las del ícono) interpoladas por frame con un factor
  exponencial; la UI cambia con variables CSS.
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
