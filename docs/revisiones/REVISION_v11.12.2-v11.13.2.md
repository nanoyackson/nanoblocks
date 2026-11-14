# Revisión independiente: v11.12.2 → v11.13.2

Encargo 18. Revisión **solo de lectura** (no se editó `src/` ni `tools/`, sin commits, sin abrir el juego ni el navegador). Base: `git diff v11.12.2..v11.13.2` y el árbol de trabajo (que coincide con `v11.13.2`: `git diff v11.13.2 -- src tools index.html` sale vacío). Marco «✅ verificado» lo que comprobé leyendo código **o corriendo scripts de Node** (los puse en el scratchpad, no en el repo); «por confirmar» lo que necesita el navegador. Cito archivo + función/selector.

Commits: `b146727` v11.13.0 (mundo compacto), `07335aa` v11.13.1 (vidrio, paneles de juego y HUD), `3f59e1c` v11.13.2 (vidrio, toda la interfaz con tokens). Nota: `tokens.css`, el código y los comentarios dicen «v11.12.3/11.12.4» en varios lugares; las versiones reales son 11.13.x.

---

## 1. Mundo compacto (v11.13.0)

### 1.1 Lo que está bien ✅

- **Determinismo.** Con 40 semillas generé dos `Generator` independientes del mismo tipo y comparé todas las estructuras a 900 bloques del inicio: **0 diferencias**. Las dos mitades (hilo principal y `lodworker.js`) construyen el mismo `Generator` porque `FarTerrain → init → {tipo}` y `World` reciben `meta.tipoMundo`; no hay **otros** `new Generator(` en `src/` (solo `ui.js` al crear el mundo, `world.js` y `lodworker.js`), así que ninguna ruta (mapa, comandos, encargos) lee un mundo «normal» por error. Los cachés de estructuras y pueblos cuelgan del `Generator` (`gen.structCache`, `gen.villageCache`) y el del mapa ya incluye `gen.tipo` en la clave (`mapa.js`).
- **Mundos viejos.** `meta.tipoMundo || 'normal'` en `game.js start` y en `switchDim`; migración `5 → 6` (`save.js MIGRATIONS[5]`) pone `'normal'`; `migrate()` encadena 3→4→5→6 y la importación de un mundo pasa por la misma función (`save.js` ≈ línea 160). Un mundo anterior carga con `kb = kc = 1`, o sea **idéntico** a antes (las dos únicas multiplicaciones nuevas en `worldgen.column` valen 1 en normal).
- **El anillo seguro de 60.** En 40 semillas: **0 estructuras de anillo a menos de 60** del inicio, **0** «Caverna del Rey» a menos de 60 (y la regla de ≥ 150 para lo peligroso se cumple) y **pueblo a ≤ 150 en el 100 %** (distancia real 70–71).
- **Encimadas.** En 40 semillas, 13 043 estructuras en 900 bloques: **0 pares con las cajas (R + R) tocándose** (pruebo más que la herramienta, que mira 600 y 5 semillas). La herramienta misma corre bien (`tools/revisar-mundo.mjs`, sale en 16 s, «Todo bien»).
- **Costo:** `sitiosAnillo` cuesta **45–94 ms una vez** por `Generator` (se repite una vez en el worker); `inicioCompacto`, 0–4 ms.
- **Distancias cortas en encargos, brújula y correo:** no hallé ninguna constante de distancia absoluta que dependa del tamaño del mundo. `encargos.js` (`sitioValido`: `structuresNear(gen, x, z, 28+r)` y 40 de margen a lote/marcas/bolsos), `misiones.js` (`lejos: [50…100]` desde la casa) y `correo.js` (30–40 de la casa de la abuela) son **locales**; usan el `gen` del mundo (con tipo). La brújula/ruta toma lo que `structuresNear` devuelve. **No lo corrí en juego** (por confirmar la sensación: ver M3).

### 1.2 Hallazgos

**M1 (media): el inicio puede caer **dentro** de la feria del pueblo** (`estructuras.js inicioCompacto`). El inicio queda a 70–140 del centro del pueblo, y `feria_pueblo` y `cementerio_pueblo` (tipos con `place` propio, atados al pueblo) **no pasan por el anillo ni por `enZona`**: la regla «anillo seguro de 60» solo cubre los sitios del anillo. En 60 semillas, **3 (5 %)** dejan el inicio **dentro de la caja de una feria** (`166312`: a 13 de la feria, R = 19; `277178`: a **4**; `332611`: a 14). Además hay un `mirador_arenal` a 18 del inicio en una de 40 (`118798`). Como `game.update` sube al jugador mientras `boxHitsSolid` (hasta 200 bloques), la persona **aparece encima del techo de un puesto** en vez de en el piso; si el recinto es cerrado, sale por el techo. *Arreglo sugerido:* excluir del lugar del inicio (o repetir el intento) todo lo que esté a < R + 8 de una estructura `place` del pueblo; o aplicar `SEGURO = 60` también a esas estructuras.

**M2 (baja): lo que pisa agua o pueblo es lo mismo que en normal.** Conté cuántas estructuras caen en agua (`h < 61`) y cuántas a < 90 + R de un pueblo (60 semillas compacto y 8 normal): **los tipos son los mismos** (`templo_hundido` bajo el agua a propósito; `tarcoles`, `san_lucas`, `amistad`, `cumbre`, `mirador_arenal` con la base en agua; `feria_pueblo`/`cementerio_pueblo` junto al pueblo a propósito; `zurqui`, `puente_colgante` ocasionalmente). **No encontré una regresión nueva del compacto aquí**; el compacto solo las acerca (por eso se ven más). Los sitios **del anillo** sí verifican `fits` y `cercaDePueblo` (90 + R), y no aparece ninguno encimado. Pendiente conocido, no de esta versión: `cumbre` (Chirripó) y `mirador_arenal` con `h < SEA` indican un `fits` demasiado flojo.

**M3 (baja, por confirmar): hay ~6 tipos que no aparecen a menos de 900 bloques.** Por semilla faltan `isla_coco` (en las 40), `aeropuerto`, `zurqui`, `amistad`, `cementerio_pueblo`, `feria_pueblo`, `san_lucas`, `tarcoles`, `puente_colgante` (según la semilla). La nota «un pueblo a la par y cada lugar a pocos minutos a pie» es cierta para ~35 tipos a menos de 300 (medí 31–35), pero **no para todos**; lo imprime la herramienta como «·», sin fallar. No hay problema técnico, solo una promesa del texto de la pantalla «Mundo nuevo».

**M4 (baja): la grilla fuera del anillo puede quedar pegada a la zona.** `enZona` evita solo el **centro** de la candidata dentro de `zonaAnillo`; para tipos grandes (R ≥ 60) una candidata a un paso de la zona puede tocar un sitio del anillo del borde (`pisaAnillo` solo se aplica a los tipos con `place`). En 40 semillas no apareció, pero el control es por centros; por eso `revisar-mundo.mjs` (que mira cajas) es el que lo vigilará: conviene correrlo con **50+ semillas** al cambiar parámetros, no con 5.

**M5 (info): la «zona» del anillo mide hasta 764–953 bloques** (`gen.zonaAnillo`), no 600: los sitios entre 600 y 900 existen cuando no hay lugar antes. El comentario dice «de 60 a 600»; el máximo real es `ANILLO + 300 − R`.

---

## 2. Vidrio (v11.13.1–2)

### 2.1 Cargas y fuentes ✅

- **Orden de las hojas:** `tokens.css → style.css → vidrio.css` (`index.html`): `vidrio.css` gana a `style.css` en igualdad de especificidad, como se pretende.
- **Fuentes / CSP:** se **quitó Google Fonts** (`preconnect` y `<link>` de VT323). Ya no queda ninguna referencia a `VT323` en `src/` ni en `index.html`, y el lienzo del mapa usa `"Segoe UI Variable", "Segoe UI", system-ui` (`mapa.js`). **Ojo:** `--font` empieza con `Inter`, pero **no hay `@font-face` ni archivo de Inter en el repo** (`tokens.css` lo dice: «cuando se sirva desde el repo»): hoy se ve con **Segoe UI / system-ui** (según el sistema). No hay petición externa, así que la CSP no se rompe; pero **el diseño no es el mismo en Windows, Mac y Android** y las medidas del documento de diseño (Inter) no se cumplen. Falta `public/fonts/` y `OFL.txt` si se adopta Inter.
- **Archivos del arte nuevo:** `public/sprites/arte/billetera.png` y `billetera-abierta.png` existen (30 KB y **244 KB**; este último se baja siempre aunque la billetera esté cerrada: el `background:url()` del cajón se pide al pintar el inventario por primera vez).

### 2.2 Hallazgos graves de migración

**G1 (alta): hay texto que quedó **del mismo color que su fondo** o casi.** La migración de `style.css` fue un reemplazo mecánico de **muchos colores distintos por unos pocos tokens**, y varias reglas quedaron incoherentes. Verificado con un script que cruza `color` y `background` en cada regla de `style.css`/`vidrio.css`:

| Regla (`style.css`) | Qué quedó | Resultado |
|---|---|---|
| `.carta` (las cartas de la abuela, Libreta → Cartas) | `background: linear-gradient(var(--warn), var(--warn)); color: var(--warn)` | letra = fondo → **invisible (1.00:1)** (también `.carta header span`) |
| `.bingo-caja` (el bingo) | `background: var(--warn); color: var(--warn)` | cuerpo invisible; los hijos: `h2` rojo `--danger` sobre amarillo = **1.52**; `.bingo-canto` `--accent` sobre amarillo = **1.24** |
| `.estampa` / `.estampa.rara` y `.estampa b` (álbum) | fondo `--warn` y `b { color: var(--warn) }` | **nombres de las estampas invisibles (1.00)** |
| `.lib-logro.ok` (**logros ganados**, Libreta → Logros) | `background: var(--warn); color: var(--text)` | **1.32:1** (claro sobre amarillo; en v11.12.2 se había arreglado a ≥ 4.5) |
| `.bingo-carton button.libre` | fondo `--warn`, texto `--warn` | la casilla «LIBRE» sin letra |
| botones con fondo de color claro y letra `--text`: `.bingo-grito`, `.album-cambio` (`--success`), `.bingo-carton b`, `.bingo-carton button.marcada`, `.alma span.hoy` (`--danger`) | `--text` (#f2f5fa) sobre `--success`/`--danger` | **1.44 y 2.01** |

*Causa:* `--danger`, `--success` y `--warn` son tintes **claros pensados como letra sobre vidrio oscuro** y se usaron también como **relleno** con la letra clara encima. *Arreglo:* para rellenos de color usar `--on-accent` (#06121c): da **13.1 / 8.6 / 12.0** sobre `--warn`/`--danger`/`--success`; o rellenos con `--surface-2` y borde del color. Las reglas a corregir son las de la tabla (≈ 10).

**G2 (media): `--velo` (alfa .55) se usa como fondo de unos 40 textos del HUD y de paneles**, y la propia medición de la guía lo prohíbe. Peor caso (cielo/nieve claro detrás, **solo el tinte**: calculado con la fórmula WCAG):

| Texto | Sobre `--velo` / cielo `#e8f0ff` | Sobre `--velo` / blanco |
|---|---|---|
| `--text` | **4.48** ✘ | **4.05** ✘ |
| `--text-soft` | **2.59** ✘ | **2.34** ✘ |
| `--accent` | **2.73** ✘ | **2.47** ✘ |
| `--danger` / `--success` / `--warn` | **2.23 / 3.11 / 3.39** ✘ | **2.02 / 2.81 / 3.07** ✘ |

Afecta a: `#captions div`, `#vistas`, `#tiro`, `#ind-meta`, `#ind-dur`, `#guardado` (`--success`), `#mirando`, `#objetivo`/`#receta-fija` (`--warn`/`--accent`), `#reloj`, `#effects div`, `.chatlog div`, `#debug`, `.achv`, `#recogidos > div`, `#click-hint`, y los paneles **`#ermitas .panel`**, **`#tooltip`** (`background: var(--velo)`: el tooltip del inventario es **translúcido y claro de fondo**) y `.pend li`. Donde `vidrio.css` ya les puso `--surface` (.88: **12.8–13.2 / 7.4–7.6 / 6.4–9.7 ✅**, p. ej. `#mision-hud`, `#toast`, `#compass`, `#hotbar`, `#billetera-hud`, `#tooltip` en `vidrio.css:73`) el problema desaparece; **el resto sigue con el `--velo` del `style.css`** (porque `vidrio.css` solo redeclara algunos). *Arreglo:* que todo texto del HUD use `--surface` (o un `--velo-texto` de alfa ≥ .85); `--velo` solo para telones de pantalla completa.

**G3 (media): la letra se achicó a 12 px en cien reglas.** `style.css` tiene **109 declaraciones de `font-size: 12px`** (en v11.12.2 había **una**, y sus mínimos eran 15–18 px: la v11.12.2 había subido el HUD a 16 px). Sin `font:` en `vidrio.css` para ellas siguen en 12 px: `.lib-*` (la **Libreta casi entera**: `.lib-logro`, `.lib-gtit`, `.lib-sdet`, `.lib-hitos`), `.carta p`, `.best-*`, `.diario-*`, `.partida .dato span`, `.tecla-fila`, `#ruta-panel`, `.bingo-*`, `.cuaderno`, `#compass-strip span`, `#xp-level`, `#version-tag`, `.world .meta`, `.foot`, `#craft-table-note`, `.slot .mej`, etc. (el HUD principal sí quedó a 13 px por `vidrio.css`: `#mision-hud`, `#toast` 18, `#captions`, `#ind-dur`). El piso del sistema de diseño era 13 px (`--fs-small`; 11 solo en teclas). En **1280×720** son letras de 12 px (Segoe UI) sobre fondos translúcidos: legibles de cerca, pero es **un paso atrás respecto de v11.12.2** y contradice «que se lea bien». *Arreglo:* subir a `var(--fs-small)` (13) lo que es texto de lectura y reservar 11–12 para teclas/contadores.

**G4 (baja): `--border-strong` no llega a 3:1.** `rgba(255,255,255,.28)` sobre el panel da **2.47:1** (y `--border`, **1.57**): los controles (campos, casillas, chips) quedan con un borde apenas visible en vidrio. *Esto es culpa mía:* mi documento `SISTEMA_DISENO_UI.md` (2.1) decía «`--border-strong` … 3:1 como borde de control» **sin haberlo calculado para A**; el cálculo real es 2.47. Subir a `.38–.42` o usar el color sólido de B (`#6b7585`, 3.54) para campos y casillas.

### 2.3 CSS muerto y pantallas sin migrar

- **`tools/revisar-estilo.mjs` dice «✔ todo con tokens» y no es cierto del todo** (ver sección 3): fuera de lo que mira quedan estilos a mano en `pezvela.js` (barra del pez vela, con `font: bold 14px monospace` y colores `#e8f0f8`), `toros.js` (barra del toro: 3 `cssText` con `#f4e6c8`, `#fff`, `monospace`) y `bravos.js` (el velo de «bravos»): **5 líneas de estilo en línea con colores y `monospace`** que quedaron con la interfaz vieja. Además `ui.js` conserva `COLOR_CAT` con **hex fijos** (`#c8503c`, `#6a8ab0`…) para el borde de la casilla y las pestañas, **distintos de los `--cat-*` de `tokens.css`** (`#ff9f5a`, `#7fb2ff`…): el recetario usa los tokens y el inventario sigue con los viejos, así que **la misma categoría tiene dos colores**.
- **CSS muerto:** de 266 clases y 105 ids del CSS, **13 clases y 1 id no aparecen en ningún `.js` ni `index.html`** (por literal): `armor-row`, `bill-tit`, `lib-panel`, `dialog-box`, `panel-cabeza`, `reacomoda` (más `g2`, `g3`, `f-pelea`, `f-monte`, `f-oficio`, `tarjeta-banco`, `tarjeta-chanchito`, que sí se arman con plantillas `g${n}`, `f-${k}`, `tarjeta-${k}`: **falsos positivos**). Muertas de verdad: **`armor-row`, `bill-tit`, `lib-panel`, `dialog-box`, `panel-cabeza`, `reacomoda`** (6). Y hay **81 selectores repetidos entre `style.css` y `vidrio.css`** (68 con propiedades que solo están en `style.css`): es la capa nueva sobre la vieja, no un error, pero deja deuda: p. ej. `.billetera .bill-fila { flex-wrap: wrap; gap: 4px }` en `style.css` (especificidad 0-2-0) **pisa** el `gap: var(--sp-2)` de `.bill-fila` en `vidrio.css` (0-1-0).
- **Tokens sueltos:** variables definidas y sin uso: `--bg`, `--sel`, `--shadow`, `--dirt`, `--tinta`, `--ease-in`; y `--cat-minerales/-tierra/-plantas` solo se usan dinámicamente. Ninguna `var(--x)` apunta a algo sin definir ✅ (la única «sin definir» es `--cat-` de una plantilla).
- **Pantallas del `index.html`**: todas tienen la capa de vidrio (`.screen`, `.panel`, `.inv-panel`, `.map-panel`, `.shop-panel`, el menú principal con botones en vidrio). **Armadas por JS** que revisé: bingo, álbum/cartas, `#ermitas`, vestidor y las barras de `pezvela`/`toros`/`bravos` son las que **arrastran los problemas de G1 y 2.3**. Solo hay **una captura** de v11.13.2 (`01-inventario-billetera-tarjetas.jpg`) y una de v11.13.1: **la Libreta (Logros, Cartas), el Álbum y el Bingo no se miraron**; `tools/escenas-ui.js` ofrece `libreta:<hoja>` y las otras pantallas, así que bastaba correrlo para verlas.

### 2.4 Contraste, costo y 1280×720

- **Contraste con los tokens reales** (peor caso, cielo claro o blanco detrás):
  - Panel `--surface` (.88): `--text` **13.15** · `--text-soft` **7.59** · `--accent` **8.01** · `--danger` **6.55** · `--success` **9.13** · `--warn` **9.97**, y las 9 categorías **5.9–9.3**; con **blanco puro** detrás: 12.83 · 7.40 · 7.81 · 6.39 · 8.90 · 9.72. ✅ (esto cumple lo prometido).
  - Texto sobre `--surface-3` (hover): `--text` 8.80, `--text-soft` 5.08, `--accent` 5.36 ✅. Campo (`--campo`, negro .28): `--text-soft` 8.63 ✅. `--sel` con `--text`: 5.02 ✅.
  - **No cumplen:** todo lo de G1 y G2, `--border-strong` (G4) y `--velo-rojo` con texto claro (**2.38**; se usa en la pantalla de muerte, pero ahí el texto va en el panel `.panel` opaco, así que no es un problema práctico).
- **`backdrop-filter`:** hay **17 declaraciones** (`style.css` 3, `vidrio.css` 12, `tokens.css` 2 variables). **No lo medí en GPU**; lo que sí veo: (a) en la partida están siempre visibles **hotbar, billetera, compás, misión/objetivo/receta (hasta 3), toast, `#guardado`/`#vistas`** con `blur(10px)`, o sea ≈ 6–9 regiones pequeñas desenfocando el lienzo WebGL **en cada cuadro**; (b) en el inventario, `#screen-inventory:not(.station)` tiene `backdrop-filter: blur(3px)` **y** cada `.inv-panel` (3) trae `blur(18px)`; por la regla de «raíz de fondo» de los navegadores, **un `backdrop-filter` dentro de un elemento que ya tiene `backdrop-filter` (o `opacity` < 1, como en el fundido de pantallas) solo desenfoca lo que está **dentro** de ese elemento**, no el mundo detrás: el blur de 18 px de los paneles **no ve el juego** (por confirmar en el navegador), y como el panel es `.88` opaco, **no se aprecia**; es **costo sin efecto**. *Sugerencia:* quitar el `blur(3px)` de la pantalla, bajar el de los paneles a 8–10 px o quitarlo en «Bajo» y con «Movimiento tranquilo» (el comentario de `tokens.css` dice «cae a opaco» solo cuando el navegador **no** soporta `backdrop-filter`; **no hay regla para «Bajo» ni para `calma`**: `body.calma` solo pone `--m: 0`).
- **1280×720:** la casilla del inventario da `clamp(34, min(6vh, 2.85vw), 58)` = **36.5 px**; la letra del cuerpo es de 15 px (`vidrio.css`), pero **los 109 textos de 12 px (G3)** y las 12 reglas con `backdrop-filter`: ahí es donde se nota. No pude verlo sin navegador.

### 2.5 La billetera abierta (arrastre, clic, duplicación) ✅

- **Clic y arrastre:** el `mousedown` del panel `#inv-billetera` conserva la lógica de antes: con el cursor ocupado solo acepta **plata** (la guarda entera con `meterPlata`; otra cosa → no pasa nada), y sobre una pieza `sacarPlata` (una; Mayús o clic derecho, todas). La fila de arriba (`.bill-fila`) abre y cierra el cajón y **no** saca nada. **No hallé forma de duplicar ni de perder plata**: `sacarPlata` resta antes de dar y `meterPlata` suma antes de vaciar el cursor.
- **Cajón:** cierra con Esc (captura `keydown` con `stopPropagation`, así que **Esc cierra la billetera y no el inventario**), con clic afuera (captura `mousedown`) y al cerrar el inventario (`closeInventoryDom`). Los oyentes de `document` se retiran al cerrar y se rearman al abrir (sin fugas). `pointer-events: none` cuando está cerrado, así que no tapa las casillas.
- **H1 (baja): las tarjetas del banco y del chanchito pueden quedar desactualizadas.** La `firma` que decide si se vuelve a pintar (`pintarDesglose`) solo mira la plata de la billetera y sus piezas, **no `meta.banco` ni el contenido del chanchito**: si se cambia el saldo del banco o se meten billetes en un chanchito **sin que cambie la billetera**, el texto «🏦 Banco · …» / «🐷 Chanchito · …» queda con el valor viejo hasta el próximo cambio. *Arreglo:* incluir `M.banco` y `enChanchito` en la `firma`.
- **H2 (info):** la cuenta del chanchito cuenta **solo piezas de plata** (`VALOR[s.id]`), no otros objetos; el rótulo dice «en plata», así que está bien, pero conviene que el texto diga «(solo plata)».
- **Efectos laterales:** `pintarBilletera` ahora suena (`monedas`, vol. 0.18) **cada vez que sube el total** con `state === 'playing'`: con un cofre de loot de varias monedas o el pago de un jefe, suena varias veces seguidas (no hay tope). Bajo, pero es un candidato a ruido; sin «Movimiento tranquilo» no se atenúa.

---

## 3. `tools/revisar-estilo.mjs`: ¿atrapa lo que dice?

Lo corrí (`node tools/revisar-estilo.mjs`): sale **✔ «todo con tokens» (0 colores y 0 radios a mano)**. Lo que **sí** atrapa: `#hex`, `rgb()/rgba()/hsl()` y `border-radius: …px` en `vidrio.css` y `style.css`, y `.style.x = '…#hex…'`/`rgba(` en `src/*.js`. **Lo que no atrapa** (y debería, dada la frase «que no quede ninguna vista con el estilo viejo»):

1. **`@keyframes` excluidos a propósito** (`cuenta` los quita): quedan colores a mano dentro (`bill-sube`/`bill-baja` con `#9fff8a`, `#ff9a8a`, `#f4e7b0`; `ready`, `equip-flash`, `bingofondo`, `sinaire`, `objetivoNuevo` con `rgba(...)`: **≥ 8**).
2. **`cssText` con `;`**: la regex `\.style\.(…|cssText)\s*=\s*[^;\n]*(#hex|rgba?\()` corta en el **primer `;`**, y los colores vienen **después**; por eso **no ve** `pezvela.js`, `toros.js` ni `bravos.js` (5 líneas) y `enLinea` da **0**. También ignora `style="…"` dentro de plantillas `innerHTML`, `setProperty` y los `#hex` en tablas de JS (`COLOR_CAT` de `ui.js`).
3. **No mira la semántica.** El error de G1 (la misma variable como texto y fondo, o `--text` sobre `--warn`) **pasa limpio**: el reemplazo por tokens **cumple** la herramienta y rompe la legibilidad. Una herramienta útil habría fallado en `.carta`, `.bingo-caja` y `.lib-logro.ok`.
4. **No verifica contraste, ni tamaños** (109 de 12 px), **ni** que cada `var(--x)` exista (yo lo comprobé con un script aparte: todo definido), **ni** CSS muerto.
5. **Umbral permisivo:** pasa con hasta 6 colores en `vidrio.css`, 12 en `style.css` y 6 en línea, incluso en modo «estricto».
6. `#[0-9a-fA-F]{3,8}\b` puede dar **falsos positivos** con selectores de id hexadecimales (`#bad`, `#face`…): hoy no hay ninguno.

*Qué le pediría:* (a) contar también dentro de `@keyframes`; (b) leer todo el literal del `cssText`/`style="…"`; (c) reglas de pares: **falla si `color` y `background` de una regla resuelven al mismo token o a un par con contraste < 4.5** (con los valores de `tokens.css`, alfa mezclado sobre el peor fondo claro); (d) listar `font-size` < 13 px; (e) listar clases del CSS sin referencia (con whitelist de plantillas). Mi script `parestoken.cjs` (≈ 40 líneas) ya hace (c) y detectó G1; puede pasarse a `tools/`.

---

## 4. Resumen: los 5 más importantes

1. **G1 — Texto invisible o casi en tres pantallas de contenido (alta).** `.carta` (cartas de la abuela) y `.bingo-caja` tienen **letra y fondo del mismo token** (`--warn`: 1.00:1); `.estampa b` (álbum) igual; `.lib-logro.ok` (**logros ganados**) queda en **1.32:1**; y los botones de relleno `--success/--danger` con letra clara dan 1.4–2.0. La migración de `style.css` fue un reemplazo mecánico; usar `--on-accent` para rellenos de color. Estas pantallas **no tienen captura** de v11.13.x.
2. **G2 y G3 — `--velo` (.55) como fondo de ~40 textos del HUD y 109 declaraciones de 12 px (media).** Contraste de 2.0–4.5 con cielo o nieve detrás y letra más chica que en v11.12.2 (un paso atrás respecto a «que se lea bien»); solo el HUD principal quedó en vidrio opaco (.88, 6.4–13).
3. **`tools/revisar-estilo.mjs` da un «✔ todo con tokens» que no es real.** No ve `@keyframes` ni los `cssText` con `;` (`pezvela.js`, `toros.js`, `bravos.js`: 5 líneas con `monospace` y hex), ni la semántica (no habría detectado G1), y tolera hasta 24 colores a mano. Hay que reforzarla antes de confiar en ella.
4. **M1 — El inicio del mundo compacto cae dentro de una feria en el 5 % de las semillas (media).** `feria_pueblo`/`cementerio_pueblo` (con `place` propio) quedan fuera del «anillo seguro de 60»; el jugador aparece sobre un techo. Lo demás del compacto está sólido: **0 encimadas y 0 diferencias de determinismo en 40 semillas**, pueblo a ≤ 150 siempre y lo peligroso a ≥ 150.
5. **`backdrop-filter` y Inter (media–baja).** 17 usos; el `blur(18px)` de los paneles **probablemente no ve el juego** (dentro de `#screen-inventory` que ya filtra) y con panel `.88` **no se nota**: costo sin efecto, y no hay regla para «Bajo» ni «Movimiento tranquilo». Además **Inter no se sirve** (no hay `@font-face`): hoy es Segoe UI/system-ui, y mi documento de diseño tenía mal el `--border-strong` (2.47:1, no 3:1).

**Lo que está bien (verificado):** determinismo y migración del tipo de mundo; mundos viejos idénticos; 0 encimadas; las dos hojas cargan en el orden correcto; Google Fonts eliminado; contraste real de paneles `--surface` ≥ 6.4:1 en el peor caso; billetera abierta sin duplicar ni perder y con cierre limpio; ninguna `var(--x)` sin definir.
