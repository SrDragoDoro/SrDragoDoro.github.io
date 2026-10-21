# SrDragoDoro.github.io

Portafolio de **DragoDoro** — Game Developer (Unity 6) y .NET Developer (WinForms).
En línea: <https://srdragodoro.github.io>

Sitio estático **sin build y sin dependencias**: `index.html` + `css/` + `js/`, publicado
tal cual con GitHub Pages. El sitio está en español por defecto y tiene conmutador a
inglés.

---

## Cómo está montado

```text
index.html        Esqueleto: cabecera, secciones, pie y el <dialog> del visor.
css/style.css     Tokens de diseño y componentes, en bloques numerados.
js/data.js        >>> TODO EL CONTENIDO <<<
js/fx.js          Efectos de canvas: el cubo del hero, la marca y las portadas.
js/main.js        Renderizador y controlador (idioma, tarjetas, visor, animaciones).
img/              Imágenes en WebP (portadas, capturas, avatar, favicon).
video/            Vídeos cortos en bucle, con su póster .webp.
```

La idea central: **`index.html` y `main.js` no se tocan para cambiar el contenido**.
Todo sale de `js/data.js`.

## Añadir o cambiar un proyecto

Abre `js/data.js` y copia un objeto de `window.PROJECTS`:

```js
{
  id: 'miproyecto',        // identificador único (se usa en el DOM)
  pillar: 'juegos',        // 'juegos' | 'herramientas' | 'web'
  featured: true,          // opcional: la tarjeta ocupa dos columnas
  year: '2026',
  img: 'miproyecto',       // nombre de un .webp en img/ (sin extensión) o null
  video: { loop: 'mi-loop', poster: 'mi-poster' },
  gallery: ['shots/mi-captura-1'],   // más capturas para la ficha
  tags: ['Unity 6', 'C#'],
  links: { repo: 'https://github.com/…', live: 'https://…', release: 'https://…' },
  stats: [['40+', 'estelas'], ['2', 'releases']],
  es: { title: '…', status: 'En desarrollo', text: '…', role: '…' },
  en: { title: '…', status: 'In development', text: '…', role: '…' },
}
```

- `pillar` decide la sección y el color de acento de la tarjeta.
- `img: null` → la portada se **genera con código** (parece una captura de un nivel de
  arcade). Es lo que se usa cuando todavía no hay captura real.
- `stats` son cifras **medidas**, no estimaciones.
- `role` es lo que hiciste y cuál fue la parte técnicamente difícil. Sale en la tarjeta
  y en la ficha.

Los otros bloques de `data.js`:

| Bloque       | Qué es                                                         |
| ------------ | -------------------------------------------------------------- |
| `PROFILE`    | Nombre, avatar y enlace a GitHub.                               |
| `PILLARS`    | Las secciones de proyectos y su color.                          |
| `PROJECTS`   | Los proyectos.                                                  |
| `SKILLS`     | Los grupos de habilidades.                                      |
| `JOURNEY`    | La trayectoria (fechas e hitos).                                |
| `ABOUT`      | El texto de "Sobre mí" y las cifras.                            |
| `CONTACT`    | Los canales. Los que no tengan `href` no se muestran.          |
| `UI`         | Todos los textos fijos de la interfaz, en `es` y en `en`.       |

Para añadir un canal de contacto, descomenta la línea del email en `CONTACT`:

```js
{ label: { es: 'Email', en: 'Email' }, href: 'mailto:tu@correo.com' },
```

## Imágenes y vídeos

- Las imágenes van en `img/` en **WebP**, de 1200 px como máximo. Convierte con:
  `ffmpeg -i captura.png -vf "scale=1200:-2" -quality 82 img/captura.webp`
- Las capturas de un proyecto van en `img/shots/`.
- Un vídeo en bucle son dos archivos: `video/<nombre>.mp4` y su póster
  `img/<nombre>.webp`. El bucle se reproduce solo cuando la tarjeta está a la vista.
- Si añades un vídeo nuevo, actualiza a mano el `poster` del proyecto en `data.js`.

## Los efectos de canvas (`js/fx.js`)

- **El cubo del hero**: un cubo de vóxeles en proyección isométrica que gira solo y
  sigue al puntero. La semilla es la fecha de hoy (`AAAAMMDD`), así que cambia cada
  día; el botón "Armar otro" genera una semilla al azar.
- **La marca** de la barra de navegación: el mismo cubo, quieto y con menos celdas.
- **Las portadas generadas**: una escena de pixel art (cielo, astro, montañas y suelo)
  calculada a partir del identificador del proyecto.

Si no te gusta el cubo, `js/fx.js` está aislado: `FX.cube()`, `FX.mark()` y
`FX.cover()` se pueden sustituir por otras cosas sin tocar `main.js`.

## Cambiar los colores y las tipografías

Todo está en el bloque `:root` de `css/style.css`:

```css
--void: #0A0D18;      /* fondo */
--panel: #121729;     /* tarjetas */
--ink: #E9EDFB;       /* texto */
--cyan: #4BD8E8;      /* acento: juegos */
--lime: #7DF05C;      /* acento: herramientas */
--amber: #FFC24B;     /* acento: web */
```

## Probar en local

Cualquier servidor estático sirve. Por ejemplo:

```powershell
powershell -File .\serve.ps1 8770
```

o, con Python:

```bash
python -m http.server 8770
```

## Desplegar

Se publica con GitHub Pages desde la rama `main`: `Settings → Pages → Deploy from a
branch → / (main) / root`. No hay paso de build: lo que hay en el repositorio es
exactamente lo que se sirve.

---

**Datos de los proyectos**: salen de la API de GitHub (repositorios públicos de
`SrDragoDoro`). Las cifras de `stats` se han medido sobre el código, las releases y
los `manifest.json` de Unity.
