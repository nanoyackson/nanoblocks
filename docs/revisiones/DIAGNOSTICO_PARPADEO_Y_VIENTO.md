# Diagnóstico: parpadeo del inventario y ráfaga de viento que lo saca 100 bloques arriba

Encargo 21 (urgente). Solo lectura sobre `v11.13.5`: **no corrí el juego ni medí en el navegador**, así que las causas son **probables por lectura de código** (marco con «✅ leído» lo que vi tal cual y con «por confirmar» lo que depende del navegador). Cito archivo + función.

---

## 1. El inventario parpadea entero con cada clic

### 1.1 Qué se rehace por clic (✅ leído)

Un clic en una casilla entra por `UI.slotDown` → `UI.clickContainer` (`ui.js`), que termina con:

```js
this.containerChanged(c);      // → inventory.changed() → game.ui.refreshHotbar() → (state==='inventory') renderInventory()
this.renderInventory();        // ← una SEGUNDA vez, explícita
```

`containerChanged` llama a `inventory.changed()`, que dispara `onChange` (`game.js`: `this.inventory.onChange = () => this.ui.refreshHotbar()`), y `refreshHotbar` termina con `if (this.state === 'inventory') this.renderInventory()`. Es decir, **cada clic pinta el inventario dos veces**. (Los demás caminos —Mayús+clic, reparto, `R`, Alt+clic— también llaman a `renderInventory()` aparte de `changed()`.)

Cada `renderInventory()` hace, **sin ninguna comparación con lo anterior**:

| Qué | Cuánto | Cómo |
|---|---|---|
| Casillas del inventario | **36** | `fillSlot(el, stack)`: **`el.innerHTML = ''`** y vuelve a crear `<img>` (con `img.src = iconURL(id)`, o sea un **`data:` URL** de 64×64), el `span.count`, `.valor`, `.mej` y la barra `.dur` |
| Casillas de armadura | **5** | igual |
| Cuadrícula de crafteo / resultado / horno | 4–9 | igual |
| **Cofre o baúl abierto** | **27 / 54** | igual |
| La barra rápida del HUD (por `refreshHotbar`) | 9 | igual |
| **El recetario (`renderRecipes()`)** | **hasta 216 filas** (~**626 `<img>`**: 1 de salida + 1 por ingrediente) | `list.innerHTML = ''` y se arman **todas las filas de nuevo**, cada una con sus imágenes `data:` |
| Otros | — | `pintarDesglose` (se salta si la «firma» no cambió), `aplicarFiltros` (solo clases), `loQueCalza` + 36 `classList.toggle`, `fichaBajoMouse` (tooltip), `doll.setArmor` (no hace nada si no cambió), `renderCursor` |

**Total por clic ≈ 2 × (36 + 5 + 9 + hasta 54 casillas + hasta 626 imágenes del recetario) ⇒ del orden de 1 000–1 500 `<img>` destruidos y creados con un `data:` URL cada uno, y todo el panel del recetario reconstruido dos veces.** Los números salen de `RECIPES` (263 recetas, 216 de «crear»; `ICON = 64` en `textures.js`).

### 1.2 Por qué «parpadean TODOS» (causa probable)

1. **Se recrean las `<img>` (no solo los `background-image`)**. `fillSlot` vacía la casilla y crea un `<img>` nuevo; `iconURL` devuelve siempre el mismo string `data:image/png;base64,…` (cacheado en `iconCache`), pero **un `<img>` nuevo con un `data:` URL no está decodificado**: el navegador lo decodifica y lo sube a la GPU al pintar, y por ese cuadro **la casilla queda vacía o con el ícono sin pintar**. Con ~1 000 imágenes nuevas a la vez, **todos los íconos (inventario, cofre, recetas, armadura) se apagan juntos por un cuadro**, y el «tironcito» es el costo de analizar ~1 000 strings base64 y decodificar. (**Por confirmar** con la pestaña *Performance* de Chrome: debería verse una `Recalculate Style` + `Layout` + `Decode Image` larga por clic.)
2. **`backdrop-filter` encima**: los tres `.inv-panel` llevan `backdrop-filter: var(--blur)` (18 px) y la pantalla `#screen-inventory:not(.station)` otro de 3 px (`style.css`/`vidrio.css`). Cualquier cambio de DOM dentro de un panel con `backdrop-filter` obliga a **volver a rasterizar y volver a desenfocar toda la región del panel** (no solo la casilla que cambió), con el lienzo WebGL detrás. **No es la causa** del parpadeo (ocurre también sin vidrio), pero **lo agranda**; y ya había dicho en la revisión 18 que con el panel al .88 de opacidad ese desenfoque casi no se ve.
3. **`--zoom-ui`**: **no se recalcula por clic** (solo en `resize`, `ui.js` `zoomUI`). Pero `#screen-inventory .inv-wrap { zoom: var(--zoom-ui) }` hace que **todo cambio de DOM dentro de `.inv-wrap` invalide el layout del subárbol completo** (no hay `contain`). Es un amplificador del costo de layout, no la causa.
4. **Transición de la `<img>`**: `vidrio.css` pone `.slot img { transition: transform … }` y `.grid .slot:hover img { transform: translateY(-1px) }`. Al recrear la `<img>` bajo el cursor, **la casilla sobre la que está el ratón «salta» 1 px** en cada clic (el ícono nuevo nace sin el `translateY` y vuelve a transitar). Es un parpadeo chico, solo en esa casilla.
5. **No es** la animación `slot-pop` de apertura: se aplica a `#screen-inventory.opening .slot` (la clase se quita a los 900 ms, `openingT`) y las casillas (`div.slot`) **no se recrean**, solo su contenido; no se repite por clic.

### 1.3 Arreglo (en orden de rendimiento y de riesgo)

1. **`fillSlot` incremental** (`ui.js`): guardar en el elemento una firma `el._sig = \`${id}|${count}|${dur}|${mejora}|${fija}\`` y **salir si no cambió**; si cambió solo el conteo, **cambiar el texto del `span.count` sin tocar la `<img>`**; si cambió el `id`, **reutilizar la misma `<img>` y asignar `src` solo si es distinto**. Elimina el 95 % del DOM creado y el parpadeo (los íconos que no cambian **nunca se tocan**).
2. **Una sola pasada por clic**: quitar el `this.renderInventory()` explícito que sigue a `containerChanged()` (ya lo dispara `changed() → refreshHotbar`), o, mejor, **juntar los pedidos**: `pedirRender() { if (!this._rq) this._rq = requestAnimationFrame(() => { this._rq = 0; this.renderInventory(); }); }` y que `refreshHotbar`/`clickContainer` llamen a `pedirRender()`.
3. **`renderRecipes` con memoria** (`ui.js`): armar una firma barata de lo que realmente cambia (`busca`, filtros, y la **lista ordenada de `[índice de receta, ok]`**) y **si no cambió, no tocar la lista**; si solo cambió algún `ok`, **solo alternar la clase `.no`, el ✓/✗ y el color de los números** en esa fila. Los chips (`#craft-chips`) se arman una vez. Es el mayor ahorro de CPU (≈ 600 imágenes).
4. **Íconos como imágenes ya decodificadas**: en `iconURL`, convertir cada canvas a **Blob URL** (`canvas.toBlob` + `URL.createObjectURL`) una vez y reutilizarla; o precargar `new Image()` por id, `await img.decode()`, y **clonar** (`cloneNode`) en vez de crear con `data:`. Con los pasos 1 y 3 ya casi no hace falta.
5. **CSS**: `contain: layout style paint` en `.slot` y en `#craft-list` (el layout de una casilla no recalcula las demás) y **quitar `backdrop-filter` de `.inv-panel`** (dejar solo el velo de la pantalla, o ninguno en «Bajo»): ahorra la re-rasterización del panel y evita el problema de «raíz de fondo» que ya anoté.
6. **Opcional:** con «Movimiento tranquilo» (`body.calma`) y en general, **no aplicar la transición de `.slot img` al recrear** (con el paso 1 deja de ocurrir).

*Verificación sugerida:* abrir DevTools → *Performance* → grabar 3 clics: debe bajar de ~1 000 nodos nuevos a **0–2 por clic**, sin `Decode Image`.

---

## 2. La ráfaga que lo metió bajo tierra y lo sacó ~100 bloques arriba

### 2.1 Qué empuja al jugador por viento o clima (✅ leído)

| Fuente | Archivo · función | **Cómo empuja** | ¿Respeta colisión? |
|---|---|---|---|
| **Viento papagayo** (Guanacaste, verano, de día; ráfagas cada 8–18 s, 2.5–4.5 s) | `naturaleza3.js` · `tickNaturaleza3` (bloque «viento papagayo») | **Escribe `b.pos.x` y `b.pos.z` directamente** (`emp = 2.2·k·dt` por cuadro, ≈ 0.04 bloque/cuadro), después de una prueba casera `libre(x, z)` | **No de verdad** (ver 2.2) |
| Huracán «Chepe» (Caribe/norte) | `clima3.js` · función del huracán | **`b.vel.x/z += 9·dt`** por cuadro, sin tope, solo a la intemperie (`techo`) | **Sí** (la física `Body.step` lo resuelve) |
| Ráfaga de la **Arpía** | `arpia.js` · `ráfaga` | `vel.x/z += 13·k`, `vel.y = max(vel.y, 4·k)` (`k = 0.25` con escudo) | Sí |
| Dentro de la tormenta | `weather.js` (`windDir` solo orienta animales/partículas) | **No empuja** | — |
| `aire.js` (planeo/caída), `alas.js` | `b.vel.y`/`b.vel.x/z` calculados por el planeo | Sí (vel) | Sí |
| `neblina.js`, `naturaleza4.js` | **No empujan al jugador** (efectos de pantalla/partículas) | — | — |
| `globo.js` | **Escribe `P.pos` (x, y, z)** al subir/bajar (`P.pos.x = b.x + 0.25…`, `P.pos.y = suelo(…) + 0.1`) y deja `vel = 0` | **No** (mueve el cuerpo con el globo) | No |

**La ráfaga de viento que lo «metió bajo tierra» es casi seguro el papagayo (`naturaleza3.js`)**: es el único viento que mueve la **posición** del jugador en vez de la velocidad; el resto resuelve las colisiones por `Body.step`.

### 2.2 Causa probable en dos pasos (✅ leído, por confirmar jugando)

**Paso A — el papagayo puede meter la caja del cuerpo dentro de un bloque.** En `tickNaturaleza3`:

```js
const libre = (x, z) => !SOLID[w.getBlock(Math.floor(x), y, Math.floor(z))] && !SOLID[w.getBlock(Math.floor(x), y + 1, Math.floor(z))];
const nx = b.pos.x + R.dx * emp, nz = b.pos.z + R.dz * emp;
if (libre(nx + Math.sign(R.dx) * 0.3, b.pos.z)) b.pos.x = nx;
if (libre(b.pos.x, nz + Math.sign(R.dz) * 0.3)) b.pos.z = nz;
```

Esa prueba **mira un solo punto** (el centro del borde delantero), **dos celdas de alto** (`y`, `y+1`, con `y = floor(pos.y)`). El cuerpo es una **caja** de 0.6 × 1.8 con las esquinas a ±0.3: **las esquinas laterales no se prueban**, ni la celda **`y+2`** cuando uno está en un medio bloque o saltando (cabeza a `pos.y + 1.8`). Resultado: la ráfaga puede **empujar la caja hasta superponerse unos centímetros con una pared, un pilar o la esquina de un acantilado**. Es un empujón chiquito, pero **la superposición ya está hecha** y la física no la arregla por el lado.

**Paso B — la «desatascada» implícita de `Body.moveAxis` lo sube por la pared como un ascensor.** En `physics.js` · `moveAxis`, para un eje `y` con `d < 0` (la gravedad cada cuadro):

```js
for (let y = y0 - 1; y <= y1; y++) for (let z …) for (let x …) {
  … if (y < y0) continue; hit = true;
  … else p.y = d > 0 ? Math.min(p.y, y - this.h - EPS) : Math.max(p.y, y + 1 + EPS);
}
```

Para cada celda sólida que toque la caja (aunque sea por 0.04 de lado), **sube los pies a la parte de arriba de la celda más alta tocada**, como si hubiera caído encima. Si uno está **superpuesto de lado con una pared alta**, cada cuadro lo sube **hasta ~1.8 bloques** (la altura de la caja), y **como la superposición lateral con la pared sigue ahí** (nada la empuja hacia afuera), **al cuadro siguiente vuelve a pasar**: sube **1–2 bloques por cuadro ≈ 60–110 bloques por segundo** por la cara del acantilado o de la montaña **hasta que la pared termina**. Eso explica **«lo lanzó lejos por un segundo»** (la subida dura ~1 s) y **«lo sacó unos 100 bloques más arriba»** (el borde de la montaña). No hay tope por cuadro, ni búsqueda de la celda libre más cercana, ni vuelta a la última posición válida.

> **Es un defecto general de la física, no solo del viento**: cualquier cosa que escriba la posición dentro de un bloque (tirolesa, avioneta, globo, surf, teletransportes…) y deje al jugador superpuesto por un lado dispara el mismo «ascensor».

### 2.3 La lógica de «desatascar» que existe hoy (✅ leído)

Hay **solo dos** (`grep boxHitsSolid`):

1. **`game.js` · `update`**, al terminar de cargar (`!this.ready`): `while (guard++ < 200 && boxHitsSolid(...)) pos.y += 1;` → **sube de a un bloque hasta 200 si el jugador está dentro de bloques**, y solo se usa **tras un teletransporte o la reaparición** (`ready = false` lo ponen `respawn`, `switchDim`, `/tp`, `anselmo.js`, `ermitas.js`, `nidos.js`, `pruebas.js`, etc.). **No corre durante el juego normal**: si hubiera sido esta, habría hecho falta un `ready = false` (el viento no lo pone).
2. **`physics.js` · `moveAxis`** (el «ascensor» de arriba), que **sí** corre cada cuadro.

Más: `palo.js` (86) usa `boxHitsSolid` solo para no meter al jugador al trepar el palo. **No hay** una rutina de «desatascar» con límite ni con «última posición segura».

### 2.4 Otros empujones del juego con el mismo patrón

**Los que escriben `body.pos` del jugador directamente** (riesgo igual: superponer la caja con un bloque y activar el «ascensor»):

| Archivo · función | Qué escribe |
|---|---|
| `naturaleza3.js` · papagayo | `pos.x/z` por ráfaga (**el sospechoso**) |
| `globo.js` | `P.pos.x/z/y` al subir/bajar y al soltar (`P.pos.y = suelo(…) + 0.1`) |
| `avioneta.js` | `p.body.pos = avión + offset` cada cuadro (si la avioneta roza terrenos, el jugador queda dentro y, al bajarse, **sube**) |
| `tirolesa.js` | `b.pos.x/z/y` a lo largo del cable |
| `surf.js` | `b.pos.y = yAgua + …` |
| `foto.js` | `b.pos = F.ancla` (modo foto) |
| `bravos.js` (76) | `P.pos.x/z = A.x/A.z` (ancla de la arena) |
| Teletransportes: `/tp`, `/pueblo ir`, `anselmo.js`, `ermitas.js`, `nidos.js`, `pruebas.js` (`ir`) | ponen `pos` y `ready = false` (usan la desatascada **de 200** de `game.js`) |

**Los que usan `vel` (la física sí resuelve colisiones, pero conviene un tope):** `clima3.js` (huracán, `vel += 9·dt` sin tope), `arpia.js` (+13), `jefes2.js` (+14 y `vel.y = 7`), `bichos3.js` (+10, `vel.y = 6`), `combate.js` (voltereta 8–9), `armasmano.js` (embestida), `bravos.js` (11), `game.js` ≈ 1795 (retroceso por daño: `vel += 6·emp`, `vel.y = 5.5`). Estos **no meten bajo tierra** porque pasan por `moveStep`/`moveAxis` cuadro a cuadro con subpasos ≤ 0.35 (`steps = ceil(dist/0.35)` en `Body.step`).

**Riesgo extra (por confirmar):** `World.getBlock` devuelve **AIRE** donde el chunk no está cargado (`world.js`: `if (!c) return AIR`), así que un empujón fuerte hacia afuera del radio cargado (o un teletransporte a un lugar sin cargar) **cae a −60 m/s** y, al cargarse el terreno, **aparece dentro de piedra** (y entonces dispara el «ascensor»). Con `renderDistance` ≥ 2 es raro a pie, pero posible con vuelos o saltos grandes.

### 2.5 Arreglos

**(a) Sacar la causa del papagayo (rápido, 5 minutos).** En `naturaleza3.js` reemplazar la escritura de `pos` por la física: 

```js
// en vez de b.pos.x = nx / b.pos.z = nz con la prueba «libre»:
b.moveStep(g.world, 'x', R.dx * emp, false);
b.moveStep(g.world, 'z', R.dz * emp, false);
```

`moveStep`/`moveAxis` ya prueban **toda la caja** y empujan hacia afuera del bloque. (Alternativa: darle una `vel` por cuadro, pero `game.js` ≈ 1574 mezcla `vel` hacia la velocidad deseada y el comentario del código dice que el frenado la anulaba; con `moveStep` no hace falta.)

**(b) Quitar el «ascensor» de `Body.moveAxis` (el arreglo de fondo).** Dos reglas:
1. **Para `d < 0` (caída), ignorar las celdas cuyo tope esté más arriba de donde estaban los pies + 0.6** (`if (d < 0 && y + 1 > prevY + 0.6) continue;`): una celda que solo toca de lado no es «el suelo donde aterrizó». Hay que guardar `prevY = p.y` **antes** de sumar `d`.
2. **Resolver la superposición lateral:** al empezar `Body.step`, si `boxHitsSolid(caja)` es **verdadero**, correr `desatascar(world)`: probar las posiciones a ≤ 1 bloque (primero los 4 lados a 0.1…0.6, después ±1 en `y`) y **quedarse con la primera sin choque**; si no hay ninguna, **volver a `this.safePos`** (la última posición donde la caja estaba libre, que se guarda cada cuadro si `!boxHitsSolid`). Así nunca se sube más de ~1 bloque por cuadro.

**(c) Reforzar la desatascada de `game.js`** (`while … pos.y += 1`, hasta 200): bajar el tope a ~8–10 bloques; si sigue dentro, usar la **superficie de esa columna** (`gen.column(x, z).h + 2`) en vez de subir a ciegas por dentro de la roca.

**(d) Defensa general:** un *watchdog* en `Player.update`: si el jugador cambia de **y > 6 bloques en un cuadro** sin estar en vehículo/globo/planeo/teletransporte, **volver a `safePos`** y registrar un aviso en consola (útil para encontrar otros disparadores).

**(e) Pruebas:** `/prueba` con un **pilar y una pared** en Guanacaste en verano (`/tiempo mediodia`, estación verano, `g.rafaga` forzado): caminar pegado a una pared alta durante una ráfaga **no debe subir al jugador más de 1 bloque**; repetir en una esquina con un pilar y en un escalón (pos.y fraccionaria).

---

## 3. Resumen

1. **Parpadeo:** cada clic hace **dos** `renderInventory()` completos que **vacían (`innerHTML = ''`) y recrean `<img>` con `data:` URL** en las 36 casillas, las 5 de armadura, el cofre (27/54) y **todo el recetario (~626 imágenes)**; las imágenes nuevas pintan un cuadro en blanco y por eso parpadean **todas juntas**. El `backdrop-filter` y el `zoom` lo agrandan pero no lo causan. **Arreglo:** `fillSlot` incremental con firma y reutilizando la `<img>`, **un solo render por clic** (coalescer con `requestAnimationFrame`) y **memoria en `renderRecipes`**.
2. **Viento:** el único viento que escribe la **posición** del jugador es el **papagayo** (`naturaleza3.js`), con una prueba de un solo punto que **no cuida las esquinas ni la celda `y+2`**; la caja queda superpuesta unos centímetros con una pared, y **`Body.moveAxis` (`physics.js`) lo sube por la pared 1–2 bloques por cuadro** (60–110/s) hasta el borde: ahí salen el «lanzado» de un segundo y los ~100 bloques. No hay tope, ni búsqueda de celda libre, ni posición segura. **Arreglo:** usar `moveStep` en el papagayo, ignorar en `moveAxis` las celdas que no están bajo los pies y agregar `desatascar()` con `safePos`.
3. **Mismo patrón:** `globo.js`, `avioneta.js`, `tirolesa.js`, `surf.js`, `foto.js`, `bravos.js` y los teletransportes escriben `pos`; el resto usa `vel` y es seguro (huracán sin tope).
