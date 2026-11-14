# Auditoría de pantallas (por código)

Fecha de lectura: sobre `master` con la constructora editando `src/`; por eso cada hallazgo cita **archivo + selector o función**, no solo línea. Todo sale de leer `index.html`, `src/style.css`, `src/ui.js` y los módulos que arman cada hoja (`libreta.js`, `amanecer.js`, `mapa.js`, `ayuda.js`, `manas.js`, `album.js`…). No se abrió el navegador, así que lo que depende de una imagen (la foto del menú, cómo cae un texto real) va marcado «por verificar».

Los contrastes se calcularon con la fórmula WCAG 2.1 usando los colores del CSS. Cuando el fondo es translúcido, se mezcló con el fondo real que tiene debajo (por ejemplo, `rgba(0,0,0,.5)` sobre `#c6c6c6`). Umbral: 4.5:1 para texto normal, 3:1 para texto grande (≥24 px, o ≥18.7 px en negrita) y para componentes. VT323 es una fuente de píxeles con la altura de x muy baja: 14 px de VT323 se leen como ~10 px de una fuente normal. Por eso aquí se pide un piso de 16 px.

Severidad: alto (bloquea o confunde a mucha gente) · medio · bajo.

---

## Cifras generales del CSS

| Medida | Valor | Lectura |
|---|---|---|
| Tamaños de letra distintos | 20 (13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 24, 26, 28, 32, 38, 40, 48, 52, 54, 64 px) | No hay escala; 49 declaraciones de ≤15 px |
| Colores hex únicos | 169 | Solo 8 variables en `:root` (`--btn`, `--btn-hi`, `--text`, `--shadow`, `--slot`, `--slot-dark`, `--panel`, `--dirt`); 30 usos de `var(--` |
| `@media` | 12 (casi todos `max-width: 620–760px`, uno de `max-aspect-ratio`, uno de `prefers-reduced-motion`) | Hay responsive, pero parcial (ver T7 y HUD) |
| `aria-*`, `role=`, `tabindex` | **0** en todo `src/` y `index.html` | Nada es accesible para lector de pantalla ni teclado |
| Radios de borde | 3, 4, 6, 12 px y 50 % | Panels y botones son cuadrados (bien, pixel art); los radios salen solo en el HUD y no siguen regla |

---

## Transversales (afectan a todas las pantallas)

### T1 [ALTO] Tab está bloqueado en todos los estados
`src/ui.js`, `bindInput()`, listener de `keydown`: `if (['F1', 'F3', 'Tab'].includes(e.code)) e.preventDefault();` corre antes de mirar `this.state`. En menús, ajustes y «Mundo nuevo» no se puede pasar de un campo a otro con Tab.
**Arreglo:** dejar `F1`/`F3` como están y limitar Tab al juego: `if (e.code === 'Tab' && this.state === 'playing') e.preventDefault();`. Así Tab sirve en los menús, el formulario de mundo nuevo y los ajustes.

### T2 [ALTO] No hay ningún atributo de accesibilidad
Cero `aria-label`, `role`, `aria-live`, `tabindex` en `src/` e `index.html`. Ejemplos concretos:
- `armarApariencia()` crea 4 botones solo-emoji (👕 ✋ 💇 🎩) con `title` y sin `aria-label`.
- `#toast`, `#captions`, `#recogidos`, `#region-banner` aparecen y se van sin `aria-live`.
- `.screen` no es `role="dialog"`; `#loading-bar` y `.meter` no son `role="progressbar"`.
- `.slot` (inventario, cofre, recetas, tienda) son `div` sin rol, sin `tabindex` y solo con `mousedown`.
- `#map-canvas` no tiene `aria-label`.

**Arreglo mínimo (una tarde):** `b.setAttribute('aria-label', tit)` en `armarApariencia()`; `role="dialog" aria-modal="true"` y `aria-labelledby` en cada `.screen`; `aria-live="polite"` en `#toast`, `#captions`, `#recogidos`; `role="progressbar" aria-valuenow` en `#loading-bar`; `aria-label="Mapa del mundo"` en `#map-canvas`.

### T3 [ALTO] El foco no se ve en casi nada
`src/style.css`, regla base de `button, select, input…` lleva `outline: none`. La única señal de foco es `button:hover, button:focus-visible { background: var(--btn-hi) }`:
- `#6b6b6b` → `#8a8fbf` tiene 1.72:1 entre sí: casi no se nota.
- Esa regla pierde contra `.lib-tabs button`, `.album-cambio`, `.tecla-fila`, `.tecla-reset`, `.bingo-botones button`, que redefinen `background` después y quedan **sin ninguna** señal de foco.
- `input`, `select`, `input[type=range]` y `.shop-row`/`.recipe`/`.slot` no tienen estado de foco.
- Solo `.mana-carta:focus-visible` está bien resuelto.

**Arreglo:** añadir al final de `style.css`:
```css
:focus-visible { outline: 3px solid #ffd84a; outline-offset: 2px; }
input:not([type=range]):not([type=checkbox]):focus-visible, select:focus-visible { border-color: #ffd84a; }
```
y quitar `outline: none` de la regla base (o dejarlo solo bajo `:focus:not(:focus-visible)`).

### T4 [MEDIO] No se mueve ni se devuelve el foco al abrir y cerrar pantallas
`ui.js`, `show()`: solo `new` hace `f.elements.name.focus()`. Al abrir pausa, muerte, ajustes o libreta el foco queda donde estaba; al cerrar con Esc nadie lo recuerda.
**Arreglo:** en `show(name)` guardar `this.focoPrevio = document.activeElement` y llevar el foco al primer `button` del `.panel` (o a `#btn-respawn` en la pantalla de muerte); en `hideScreens()` devolverlo. Para el inventario, que no tiene botones primarios, basta `tabindex="-1"` en la `.screen` y enfocarla.

### T5 [MEDIO] Esc no vuelve atrás en los menús
`ui.js`, `bindInput()`: Esc solo está manejado para `command`, `inventory`, `shop`, `libreta`, `map`, `playing`, `paused`. En `worlds`, `new`, `news` y `settings` (desde el menú) no hace nada.
**Arreglo:** al final del listener, `if (e.code === 'Escape') { const volver = document.querySelector('.screen.on .ghost, .screen.on #btn-settings-back'); if (volver) volver.click(); }`.

### T6 [MEDIO] Pantallas que no pausan el juego
`ui.js`: `openInventory`, `openMap`, `openShop`, `openLibreta` no tocan `game.paused` (solo `pause()`, `startGame`, `quitToMenu` y la hoja `manas`). Con el mapa, el inventario o la libreta abiertos en supervivencia el hambre, las Sombras y el clima siguen. Además `closeLibreta()` pone `paused = false` siempre, y la hoja Mañas solo pausa si se abre directamente (`if (tab === 'manas') this.game.paused = true` está dentro de `if (first)`): cambiar a Mañas desde otra pestaña no pausa.
**Arreglo:** opción «Pausar al abrir mapa y libreta» (activada por defecto), o pausar siempre mapa/libreta/tienda y dejar el inventario vivo como en los juegos de bloques. En `openLibreta`: `this.game.paused = tab === 'manas' || this.settings.pausarLibreta;` fuera del `if (first)`.

### T7 [MEDIO] Escala tipográfica y colores sin tokens
Ver la tabla. Efectos visibles: hay al menos 6 dorados distintos (`#ffd84a`, `#ffe066`, `#ffd860`, `#ffe080`, `#ffe680`, `#e8b840`) para el mismo papel de «acento»; tres familias de panel (oscuro translúcido en menús, gris `#c6c6c6` en inventario/mapa/tienda/libreta, y pergamino en `.carta`/`.bingo-caja`); sombras de texto de 1, 2 y 3 px mezcladas.
**Arreglo (tokens a añadir a `:root`):**
```css
--fs-xs: 16px; --fs-s: 18px; --fs-m: 22px; --fs-l: 28px; --fs-xl: 40px;
--tinta: #3f3f3f; --tinta-suave: #474747;   /* en vez de #555/#666/#777 */
--acento: #ffd860;                          /* unifica los dorados */
--ok: #5a8a3a; --alerta: #ffb070; --peligro: #8a3b3b;
--r: 0; --sombra-texto: 2px 2px 0 var(--shadow);
```
y migrar poco a poco: primero reemplazar todo `font-size: 13–15px` por `var(--fs-xs)`.

### T8 [MEDIO] Botones del mismo tipo con estilos distintos
La base `button` (24 px, bisel `#a5a5a5/#4a4a4a`, borde negro) no la usan: `.lib-tabs button` (16 px, bisel `#aaa/#555`), `.album-cambio` (17 px, bisel verde `#8ac06a/#2a4a1a`), `.tecla-fila` (15 px, bisel `#9a9a9a/#3a3a3a`), `.tecla-reset` (14 px), `.sortbar button` (18 px), `.world button` (20 px), `.bingo-botones button`. Cada uno redefine fuente, padding y colores del bisel.
**Arreglo:** dos variantes: `.btn-s` (`font-size: var(--fs-s); padding: 6px 12px; min-height: 32px`) y `.btn-ok` (verde). Aplicarlas en lugar de las siete reglas sueltas.

### T9 [MEDIO] Texto del juego: un voseo y varias etiquetas con género
- `index.html`, `#screen-worlds h2`: «**Elegí** un mundo» (voseo) → «Escoja un mundo».
- Estados del jugador con género marcado en `ui.js`, `renderEffects()` (`const names`): `empapado: '🌧 Empapado'`, `coraza: '🛡 Bien comido'`, `lleno: '🍲 Lleno'`, `mareo: '🥴 Mareado'`, `cansado: '🥱 Cansado'`, `enlodado: '🟫 Enlodado'`, `enredado: '🌿 Enredado'`, `fresco: '🧊 Fresco'`. Neutros sugeridos: «🌧 Ropa empapada», «🛡 Buen provecho», «🍲 Panza llena», «🥴 Mareo», «🥱 Cansancio», «🟫 Lodo», «🌿 Enredo», «🧊 Frescura».
- `supervivencia3.js`, `tickMojado`: «Va empapado» → «Lleva la ropa empapada». `muebles.js`, `sentarse()`: «Sentado: descansa…» → «Sentarse descansa…». Logros como «Sentadito» (`g.achieve('silla', …)`) son de decisión de nanoyackson; se anotan por si quiere unificar.
- No se encontró otro voseo ni tuteo en el texto visible. Los encontrados por búsqueda estaban en comentarios de código.

### T10 [MEDIO] «Movimiento tranquilo» no se respeta igual en la interfaz y en el juego
`ui.js`, `syncSettings()` activa `body.calma` con `settings.calma` **o** `prefers-reduced-motion`; `game.js` (cámara, flotación, `kCam`, `shake`) usa solo `this.settings.calma`. Y la casilla `#s-calma` aparece sin marcar aunque el sistema pida poco movimiento.
**Arreglo:** una función `calmaActiva(settings)` en un módulo común; marcar `#s-calma` cuando el sistema lo pide.

### T11 [BAJO] `confirm()` y `alert()` nativos
`ui.js`, `renderWorldList()`: borrar usa `confirm('¿Borrar "…" para siempre?…')`; importar usa `alert(err.message)`. Rompen el estilo, bloquean el hilo y dependen del idioma del navegador.
**Arreglo:** un modal con `.panel` y la clase `.modal-entra` (ya existe para `#ermitas`), con foco en «Cancelar» por defecto.

### T12 [BAJO] Sin estado `:disabled`
`style.css` no tiene ningún `button:disabled`. Lo que se ve «apagado» usa `opacity` (`.shop-row.off` .5, `.recipe.no` .45) y baja el contraste a niveles ilegibles (ver Tienda e Inventario).
**Arreglo:** `button:disabled, [aria-disabled=true] { background: #4a4a4a; color: #b8b8b8; cursor: not-allowed; filter: none; }` (≈ 5:1) y no usar `opacity` para texto.

---

## Menú principal (`#screen-menu`, `.bg-menu`)

**M1 [MEDIO] Sin «Salir» ni «Créditos» propios.** Solo `Un jugador / Novedades / Ajustes`. Los créditos están enterrados al final de «Novedades» (`renderNews()`). Añadir un cuarto botón «Créditos» que salte a esa sección.

**M2 [BAJO] CSS muerto:** `#screen-menu .panel button { backdrop-filter: blur(2px) }` no hace efecto porque el fondo del botón (`--btn`) es opaco. Quitar, o dar al botón `background: rgba(107,107,107,.85)`.

**M3 [BAJO] Legibilidad sobre la foto (por verificar).** `.bg-menu` solo oscurece 0.18 (`box-shadow: inset 0 0 0 100vmax rgba(0,0,0,.18)`), mucho menos que `.bg-dirt` (0.62). Textos que van directo sobre la imagen: `#splash` (`.subtitle`, `#ffff55`, con sombra), `.foot` (`#ddd` al 80 %). Sobre fondo oscuro dan >10:1, pero sobre un cielo claro de la foto puede bajar de 3:1. Recomendado: `.foot { text-shadow: 1px 1px 0 #000; opacity: 1; }` y subir el oscurecimiento a 0.30.

**M4 [BAJO] Animación de fondo continua.** `@keyframes menu-pan` anima `background-size` y `background-position` 40 s sin parar (repinta toda la pantalla). Solo se apaga con `prefers-reduced-motion` o `calma`; aplicar `will-change: background-position` o animar un `transform` sobre una capa.

---

## Mundos (`#screen-worlds`) y Mundo nuevo (`#screen-new`)

**W1 [MEDIO] «Elegí un mundo»** (voseo): ver T9.

**W2 [MEDIO] El nombre largo se sale.** `.world .name` no tiene `overflow-wrap`; el `maxlength` es 40 y un nombre sin espacios a 26 px (~520 px) rebasa `.info` (`min-width: 160px`) y queda cortado por `.panel { overflow-x: hidden }`.
**Arreglo:** `.world .name { overflow-wrap: anywhere; }`.

**W3 [BAJO] `.world .meta` se corta sin recurso.** Tiene `white-space: nowrap; text-overflow: ellipsis` y no `title`: en pantallas angostas se pierde la fecha y la versión. Añadir `row.querySelector('.meta').title = texto` en `renderWorldList()`.

**W4 [MEDIO] Lista de mundos sin búsqueda, sin orden elegible y con «Borrar» pegado a «Jugar».** `listWorlds()` ordena por `lastPlayed`. Con ≥10 mundos la lista de 50 vh es larga; los tres botones (`Jugar`, `Exportar`, `Borrar`) miden 20 px de letra con padding 4 px (≈ 30 px de alto, bajo 32). **Arreglo:** `.world button { min-height: 32px }`, margen izquierdo extra para `.danger`, y un `<input>` de filtro cuando hay más de 6 mundos.

**W5 [MEDIO] Opciones de dificultad demasiado largas.** `<option>` de «Dificultad» llevan frases de ~50 caracteres (por ejemplo «Difícil: más monstruos, el hambre y el frío matan»). A 24 px dentro de un panel de 420 px el `<select>` cerrado las corta. **Arreglo:** opciones cortas («Tranquilo», «Normal», «Difícil») y un `<small id="dif-nota" aria-live="polite">` debajo con la descripción, que cambia con `change`.

**W6 [BAJO] Botones de salida con nombres distintos.** `Volver` (mundos, novedades), `Cancelar` (nuevo mundo), `Listo` (ajustes). Unificar en «Volver», y dejar «Listo» solo donde se confirma algo.

**W7 [BAJO] Campos de texto sin estado de foco** (T3).

---

## Carga (`#screen-loading`)

**L-1 [BAJO]** `#loading-bar` sin `role="progressbar"` ni `aria-valuenow`; `#loading-tip` en `#ddd` (≈ 10:1, bien). Nada más grave.

---

## Pausa (`#screen-pause`)

**P1 [MEDIO] Cada Esc guarda.** `pause()` llama a `this.game.save()` siempre: un jugador que usa Esc para mirar algo escribe en IndexedDB todos los chunks sucios cada vez. Además existe el botón «Guardar ahora», redundante. **Arreglo:** guardar al pausar solo si pasaron >30 s desde el último guardado, o quitar el guardado de `pause()` y dejar el botón y el autoguardado.

**P2 [BAJO] Sin acceso a la ayuda.** La pausa no tiene botón «Libreta (Y)» ni «Atajos». Un jugador nuevo que abre Esc para entender cómo se juega no ve la ayuda que existe. Añadir «Ayuda» que llame a `openLibreta('ayuda')`.

**P3 [BAJO] `#pause-info`** conserva «Partida guardada ✔» solo hasta la próxima pausa (se reescribe en `pause()`), bien, pero no lleva `aria-live`.

---

## Ajustes (`#screen-settings`)

**A1 [MEDIO] 20 controles en una sola columna, sin secciones, y «Listo» al final.** El `.panel` (420 px, `overflow-y: auto`) obliga a bajar hasta el fondo para cerrar. **Arreglo:** agrupar con `<fieldset><legend>` en cuatro bloques (Imagen: distancia, FOV, brillo, resolución, horizonte, pantalla completa · Sonido: volumen, música · Juego: sombras, balanceo, objetivo, mirando, reloj, números, herramienta, correr · Accesibilidad: movimiento tranquilo, subtítulos) y `#btn-settings-back { position: sticky; bottom: 0; }`.

**A2 [MEDIO] Sin «Restablecer ajustes».** Solo existe `.tecla-reset` para las teclas. Añadir un botón «Restablecer todo» con confirmación.

**A3 [BAJO] Etiqueta de pantalla completa de 80 caracteres** («Pantalla completa al jugar (Esc sale; evita que Ctrl+W cierre la pestaña)») ocupa 3 líneas. Dejar «Pantalla completa al jugar» y mover lo demás a un `<small>`.

**A4 [BAJO] Objetivos de clic.** `input[type=range]` mide ≈ 16 px de alto; `.tecla-fila` (15 px de letra, padding 3 px) ≈ 26 px; `.tecla-reset` ≈ 24 px. **Arreglo:** `input[type=range] { height: 28px }`, `.tecla-fila { min-height: 32px; font-size: var(--fs-xs) }`.

**A5 [BAJO] Valor de los deslizadores solo en texto del label.** `<span id="v-…">` va dentro del `<label>`, sin `aria-valuetext`; aceptable, pero el slider nativo se anuncia como «50» sin unidad. Añadir `aria-valuetext` al actualizar.

---

## Novedades (`#screen-news`)

**N1 [MEDIO] Se arma el registro completo de 382 versiones cada vez.** `renderNews()` recorre `CHANGELOG` entero (382 entradas, con sus viñetas) y vuelve a pedir `sounds/real/manifest.json` en cada apertura. **Arreglo:** mostrar solo las últimas 10 con `<details>` por versión y un botón «Ver versiones anteriores» que agrega el resto; guardar el manifest en una variable.

**N2 [BAJO] Títulos `h3` amarillos** (`#news-list h3 { color: #ffff55; font-size: 28px }`) sobre `rgba(0,0,0,.5)` sobre foto: contraste alto (≈ 15:1), bien. Pero el panel no tiene ninguna forma de saltar a «Créditos» (ver M1).

---

## Inventario (`#screen-inventory`) y vestidor

**I1 [ALTO] Solo se maneja con mouse.** Todos los `.slot` son `div` con `mousedown`/`mouseenter`; no hay `tabindex`, ni foco, ni teclado. **Arreglo mínimo:** `role="grid"` en `#inv-grid`, `tabindex="0"` en el slot activo (roving), flechas para moverse, Enter para tomar/dejar y Alt+Enter para fijar; `aria-label` con el nombre y la cantidad.

**I2 [MEDIO] Texto gris sobre gris que no llega a 4.5:1.**
| Elemento | Colores | Contraste |
|---|---|---|
| `.stat-note` (16 px) | `#555` / `#c6c6c6` | 4.36 |
| `#craft-table-note` (18 px) | `#666` / `#c6c6c6` | 3.36 |
| `.doll-hint` (15 px) | ≈ `#6a5f52` / `#c9b994` | ≈ 3.2 |
| `.shop-hint` (14 px, también en mapa y libreta) | `#555` / `#c6c6c6` | 4.36 |
| `.slot .count` sin sombra | `#fff` / `#8b8b8b` | 3.41 (con la sombra de 2 px sube) |

**Arreglo:** `color: var(--tinta-suave)` (`#474747` ≈ 5.4:1) en las cuatro primeras; la quinta ya está compensada por `text-shadow`.

**I3 [MEDIO] Recetas apagadas ilegibles.** `.recipe.no { opacity: .45 }`: el texto `#222` sobre `#b0b0b0` pasa de 7.3:1 a **2.2:1** efectivos. Además `renderRecipes()` marca si hay o no ingredientes solo con color (`#225522` / `#882222`), que no distingue a quien tiene daltonismo rojo-verde. **Arreglo:** `.recipe.no { opacity: 1; background: #a8a8a8; color: #4a4a4a }` (≈ 4.9:1 con `#c0c0c0`) y anteponer «✓» / «✗» al número en `sp.textContent`.

**I4 [MEDIO] Sin estado vacío en las recetas.** `renderRecipes()` no agrega nada cuando el filtro no encuentra coincidencias (la lista queda en blanco). **Arreglo:** `if (!rows.length) list.innerHTML = '<div class="empty">Ninguna receta con «…». Pruebe con otro ingrediente.</div>'`.

**I5 [MEDIO] La lista de recetas pierde el desplazamiento.** `renderRecipes()` hace `list.innerHTML = ''` y se llama desde `renderInventory()` en cada cambio (tomar, soltar, fabricar). Al vaciar el contenedor `scrollTop` vuelve a 0 y al reponer los hijos no se recupera; quien está en la mitad de una lista larga salta al principio. **Arreglo:** `const st = list.scrollTop; … ; list.scrollTop = st;`.

**I6 [BAJO] Regla duplicada que anula a la buena.** `style.css` tiene `#armor-slots .slot.empty::after { … font-size: 13px; opacity: .35 }` y `.armor-col .slot.empty::after { … font-size: 24px; opacity: .42; filter: grayscale(1) }`. `#armor-slots` tiene también la clase `.armor-col`, y como el selector con id gana por especificidad, los ícono-guía de las ranuras de armadura salen a **13 px** en vez de los 24 px pensados. Eliminar la primera.

**I7 [MEDIO] Botones del vestidor muy chicos y sin nombre.** `#apariencia button` mide 30×28 px (bajo 32), tiene solo emoji y `title` (T2) y flota sobre la esquina del muñeco. **Arreglo:** `width: 32px; height: 32px;` y `aria-label`.

**I8 [MEDIO] «Alt+clic fija» no se ve.** El atajo solo aparece en un consejo de carga, un consejo al jugar (`CONSEJOS: 'fijas'`) y un toast una vez (`alternarFija`). En el inventario no hay ninguna pista. **Arreglo:** `<small>` bajo `#inv-sortbar`: «Alt+clic fija una casilla».

**I9 [MEDIO] Pantallas angostas.** En `@media (max-width: 640px)` las casillas bajan a 34 px, pero `.slot .count` queda en 22 px y `.slot .mej`/`.dur` no se ajustan: el número tapa el ícono. **Arreglo:** dentro de ese `@media`, `.slot .count { font-size: 16px; }`.

**I10 [MEDIO] Catálogo creativo plano.** `#creative-grid` (300 px de alto) lista cientos de objetos sin categorías; la búsqueda solo compara el nombre. **Arreglo:** pestañas «Bloques / Herramientas / Comida / Otros» usando la misma clasificación que `sortRange()` (`cat()`).

**I11 [BAJO] Tooltip.** `#tooltip` es `position: fixed` y lo sigue el cursor; no se ve si invierte el lado cerca del borde derecho (por verificar en `moveCursor`). Su texto (`white-space: pre-line`, 22 px) puede ser muy ancho. Añadir `max-width: min(360px, 90vw)`.

---

## Crafteo (panel «Recetas» y mesas)

**C1 [BAJO] Leyenda del 🔨.** Las recetas grandes en mesa 2×2 llevan «🔨» en el nombre y un `title` que solo aparece al pasar el mouse; la nota `#craft-table-note` dice «(2×2 — las grandes piden mesa)» sin explicar el símbolo. Añadir al texto de la nota: «🔨 = pide mesa».

**C2 [BAJO] Sin filtro por «puedo fabricar ahora».** Las recetas se ordenan con las posibles primero (`rows.sort`), pero no se puede ocultar el resto. Un conmutador «Solo las que puedo fabricar» ahorraría desplazarse.

**C3 [BAJO] La búsqueda no se enfoca con una tecla.** `#craft-buscar` solo se toca con mouse (`keydown` hace `stopPropagation` y en Esc borra). Añadir «/» o Ctrl+F dentro del inventario para saltar al campo.

---

## Mapa (`#screen-map`)

**Mp1 [MEDIO] No hay paneo.** `openMap()` centra siempre en el jugador; `zoomMap()` solo acerca o aleja (1–16). Para marcar un destino lejano hay que alejar a 16 bloques por píxel y se pierde el detalle. **Arreglo:** arrastrar con el mouse (`mousedown/mousemove` sobre `#map-canvas`) para mover el centro y botón «Centrar en mí».

**Mp2 [MEDIO] Marcadores sin leyenda y solo por color.** `marker()` en `mapa.js` dibuja un círculo de color y una etiqueta de 16 px dentro del canvas. Con muchos puntos (pueblos, nidos, marcadores, bolsos) las etiquetas se solapan. A 90 vw en un teléfono el canvas (560 px lógicos) se reduce y el texto queda bajo 10 px. **Arreglo:** mostrar la etiqueta solo en los 8 puntos más cercanos al cursor/centro, y una leyenda (tecla L) con ícono, color y nombre.

**Mp3 [MEDIO] No pausa** (T6), y **destino solo con clic** (no hay teclado para marcar). Añadir «Enter marca el centro del mapa» cuando haya paneo.

**Mp4 [BAJO] Pista larga en 14 px** (`.shop-hint`: «Rueda del mouse o + / − para acercar · clic marca destino · clic derecho borra un marcador · M o Esc para cerrar») sobre `#c6c6c6` (4.36:1, I2). Partirla en dos líneas de 16 px.

**Mp5 [BAJO]** `#map-canvas` sin `aria-label` (T2); `.map-panel` sin `role="dialog"`.

---

## Libreta (`#screen-libreta`)

**Lb1 [ALTO] Las 9 pestañas no caben.** `.lib-tabs { display: flex }` sin `flex-wrap`; cada `button` lleva ícono + nombre + atajo («🎖️ Habilidades (H)»), unos 150 px de texto a 16 px, en un panel de 640 px (≈ 71 px por pestaña). El texto se parte en 2–3 líneas dentro del botón y en pantallas de <500 px es ilegible. **Arreglo:** `.lib-tabs { flex-wrap: wrap } .lib-tabs button { flex: 1 1 30%; min-height: 32px }`, o solo ícono bajo 700 px (`@media (max-width: 700px) { .lib-tabs button span { display: none } }`, con `aria-label`).

**Lb2 [MEDIO] Contraste de las hojas que son oscuras dentro de un panel gris.** El `.map-panel` es `#c6c6c6`, pero varios componentes de la libreta usan fondos negros translúcidos y letra clara, que se mezclan con el gris:
| Selector | Colores efectivos | Contraste |
|---|---|---|
| `.lib-logro` (bloqueado, 15 px) | `#555` / `#a8a8a8` | 3.14 |
| `.lib-hitos` (14 px) | `#777` / `#d6d6d6` | 3.08 |
| `.lib-gtit span` (15 px) | `#666` / `#c6c6c6` | 3.36 |
| `.plato-lista p`, `.mana-mia span` (15–16 px) | `#e8dcc0` / ≈ `#6d6d6d` | 3.80 |
| `.mana-carta span` (16 px, arriba de la carta) | `#eee` / ≈ `#818181` | 3.36 |
| `.mana-carta small` (14 px, arriba de la carta) | `#c8c0a8` / ≈ `#818181` | **2.14** |
| `.partida .dato span` (15 px) | `#e8dcc0` / ≈ `#636363` | 4.41 |

**Arreglo:** dar a esas piezas un fondo opaco oscuro (`background: #3a3a3a`, que con `#e8dcc0` da ≈ 8.4:1) en lugar de `rgba(0,0,0,.45–.6)`, y `color: #333`/`#474747` para los textos claros-sobre-gris (el bloqueado pasa de 3.14 a ≈ 5.6).

**Lb3 [MEDIO] «Partida» no tiene atajo y la pista lo omite.** `data-lib="partida"` es la única hoja sin tecla; el pie dice «Y, I, U, C, L, H, K y N cambian de hoja». Anotar «Partida» como P (o decir «P»), o al menos pie: «las demás se abren con el mouse».

**Lb4 [MEDIO] Logros, ayuda y bestiario sin búsqueda ni filtro.** `logrosHTML()` muestra el catálogo completo agrupado por ícono, con los bloqueados visibles (texto completo y `title="Todavía no"`); `ayudaHTML()` es un documento corrido de ~50 entradas. **Arreglo:** una caja de búsqueda por hoja (reutilizar el patrón de `#craft-buscar`) y un conmutador «Solo pendientes» en logros.

**Lb5 [MEDIO] Pausa inconsistente** (T6): la hoja Mañas pausa o no según cómo se llegó.

**Lb6 [BAJO] Teclado.** En estado `libreta` el listener hace `e.preventDefault()` a **todas** las teclas (incluida Tab) y los botones de pestaña no tienen `role="tab"`/`aria-selected`. Solo la hoja `.mana-carta` (botón real con `:focus-visible`) es operable con teclado, y Tab no llega.

**Lb7 [BAJO] Estados vacíos: bien resueltos en la mayoría.** `diario`, `cartas`, `manas`, `habilidades`, `partida` y `album` tienen texto vacío claro (`.lib-nada`). No se revisó `bestiarioHTML()` (por verificar).

---

## Tienda / pulpería (`#screen-shop`) — extra

**S1 [ALTO] El precio es casi ilegible.** `.shop-row` es `#8b8b8b` con texto blanco (3.41:1), y el precio `.shop-row .p { color: #ffe066 }` queda en **2.61:1**; al pasar el mouse (`#a0a0c8`) el blanco baja a **2.51:1**. **Arreglo:** `.shop-row { background: #5a5a5a }` (blanco ≈ 6.9:1) y `.shop-row:hover { background: #6e6e8a }`; el precio `#ffe066` sobre `#4a4a4a` da 6.8:1.

**S2 [MEDIO] Filas con solo `mousedown`, sin foco** (T1–T3). Tampoco hay `role="button"`, y `#shop-debt` es un `span` clicable. **Arreglo:** hacerlas `<button class="shop-row">`.

**S3 [BAJO] Colores de dinero.** `#shop-colones` (`#7a5a00` / `#c6c6c6`) = 3.74 → usar `#5c4300` (5.4). `#shop-debt` (`#a02020`) ya da 4.52.

**S4 [BAJO] No pausa** (T6). Con una tienda abierta de noche, las Sombras pueden golpear.

---

## Muerte (`#screen-dead`)

**D1 [MEDIO] El botón de reaparecer no recibe foco.** `showDeath()` no enfoca nada: con el teclado (que es lo habitual tras morir) hay que usar el mouse o Tab (que está bloqueado, T1). **Arreglo:** `showDeath()` termina con `$('#btn-respawn').focus()`.

**D2 [MEDIO] El consejo no dice dónde quedó el bolso.** `deathTip()` (`supervivencia.js`) dice «🎒 en el mapa» pero no la distancia ni la dirección, aunque tiene `meta.bolso` y la posición. **Arreglo:** añadir «a 120 bloques al noreste (🧭)» calculado igual que lo hace `updateCompass()` en `ui.js` para la brújula.

**D3 [BAJO] Dos salidas casi iguales.** «Reaparecer» y «Salir al menú»: la segunda (`#btn-dead-quit`) ejecuta `respawn()` antes de salir (revive y guarda); el texto no lo dice. Rotular «Reaparecer y salir al menú».

**D4 [BAJO] `.red` translúcido** (`rgba(120,0,0,.55)`) deja ver el mundo; el texto es `#fff` y `#ddd`, con >8:1 sobre rojo oscuro, bien.

---

## HUD (de paso)

**H1 [MEDIO] Paneles de ancho fijo sin `@media` propio.** `#ruta-panel { width: 400px; right: 12px }` desborda en pantallas de <430 px; `#torneo { width: 210px }` y `#tramite { max-width: 260px }` no tienen versión angosta (solo `#tramite` y `#ind-meta` mueven su `top`). **Arreglo:** `#ruta-panel { width: min(400px, calc(100vw - 24px)) }`.

**H2 [BAJO] `#toast` queda limitado a la mitad de la pantalla.** Es `position: absolute; left: 50%; transform: translateX(-50%)` sin ancho: el ancho auto de un elemento absoluto con `left: 50%` no puede pasar de la mitad del contenedor. Los avisos largos (por ejemplo los de `supervivencia3.js`, de ~90 caracteres a 28 px) se parten en 3–4 líneas angostas. **Arreglo:** `#toast { width: max-content; max-width: min(720px, 92vw); }`.

**H3 [BAJO] `#captions div { white-space: nowrap }`** a la derecha: una descripción larga se corta por el borde. Quitar el `nowrap` y poner `max-width: 40vw`.

**H4 [BAJO] Letras de 13–14 px en el HUD:** `#ind-dur`, `#vistas`, `#guardado`, `#receta-fija` y `.slot .mej` (13 px). Subir a 16 px.

---

## Las 10 mejoras que más se notarían (en orden)

1. **Tab y foco global** (T1 + T3): una línea en `ui.js` y tres de CSS devuelven el teclado a menús, ajustes y formulario de mundo nuevo.
2. **Contraste de tienda, listas y libreta** (S1, I2, I3, Lb2): reemplazar `opacity` y translúcidos por fondos opacos; es el cambio de CSS que más se nota al leer.
3. **Pestañas de la libreta que se parten** (Lb1): `flex-wrap` y `min-height: 32px`.
4. **Pausar al abrir mapa, libreta y tienda** (T6): que leer no cueste vida. Opción en ajustes, activada por defecto.
5. **Recetas legibles y con memoria** (I3 + I4 + I5): letra visible en las que no alcanzan, estado vacío y que la lista no salte al principio.
6. **Ajustes en secciones y «Listo» fijo** (A1 + A2 + T10): agrupar, restablecer y respetar el movimiento reducido del sistema.
7. **Mapa con paneo y leyenda** (Mp1 + Mp2): arrastrar para moverse y etiquetas solo de lo cercano.
8. **Novedades más livianas** (N1): las últimas 10 versiones, el resto bajo «Ver anteriores».
9. **Textos neutros y en «usted»** (T9): «Elegí un mundo» y los estados con género.
10. **Escala de letra y tokens de color** (T7 + T8): piso de 16 px y las dos variantes de botón; es el trabajo más grande y conviene empezar por reemplazar los 13–15 px.

Si hay tiempo para solo tres: las 1, 2 y 4.
