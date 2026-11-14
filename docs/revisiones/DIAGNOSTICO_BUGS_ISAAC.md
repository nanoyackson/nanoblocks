# Diagnóstico de los bugs que reportó nanoyackson

Solo lectura. Donde la constructora ya tiene cambios sin commitear en el árbol de trabajo (`world.js`, `mar.js`, `ui.js`, `game.js`), se dice qué cubre y qué falta. Los chequeos de ids y recetas se hicieron **ejecutando** `blocks.js` y `recipes.js` en Node (sin navegador), así que son comprobados, no supuestos.

---

## 1. «La mena de hierro dice puerta, el trompo dice yuca, hay varios enredados»

**Causa: no es una tabla desalineada, es una ficha vieja.** El registro de ids está sano (ver abajo). El nombre que sale en el recuadro flotante lo arma `UI.showTooltip(stack, el)` (`ui.js`), y **solo se llamaba en el `mouseenter` de cada casilla** (`renderInventory`, `buildStationArea`, `armorEls`, `renderCatalog`). Al hacer clic para agarrar, soltar, intercambiar, Shift+clic o repartir, la casilla cambia de contenido pero el recuadro seguía diciendo lo de antes. Se ve «mena de hierro → Puerta» si se pasaba el mouse por encima de una puerta, se hacía clic y la casilla quedaba con la mena; igual con trompo/yuca. «Varios enredados» es el mismo caso repetido.

**Estado:** el árbol de trabajo ya trae el arreglo (`fichaBajoMouse()` en `ui.js`, que reconstruye la ficha desde `hoverEl` y `containerArr(el.dataset.c)[i]` en cada `moveCursor`, más el `hoverEl = null` en `mouseleave`). Falta confirmar que también se llame **después de cada clic** y no solo al mover el mouse (un clic sin mover el ratón no dispara `moveCursor`): llamar `this.fichaBajoMouse()` al final de `renderInventory()` y de `renderCursor()`. Lo mismo para la casilla de resultado del crafteo (`'result'`) y la hoja de recetas, donde el recuadro depende del contenido de la cuadrícula.

**Comprobaciones del registro (por si acaso):**
- `blocks.js`: 0 colisiones de id entre bloques e ítems, ningún ítem en el rango de bloques (0–255, 600–1023) ni bloque en el de ítems (256–599), todo `BLOCKS[i].id === i`.
- Los íconos `src/assets/items/<clave>.png` son correctos por contenido (se revisaron `trompo`, `yuca`, `iron`, `door`): no hay hojas cortadas con corrimiento.
- Los ids no cambiaron nunca (`git log -S` sobre `yuca`, `trompo`, `iron_ore`: una sola adición cada uno).

**Lo que sí está duplicado o torcido (menor, pero puede dar síntomas parecidos):**

| Qué | Dónde | Efecto |
|---|---|---|
| Clave de ítem repetida `escritura` (389 y 512) | `blocks.js` | Todo lo que busca por clave (`Object.values(ITEMS).find(i => i.key === …)`, el ícono `assets/items/escritura.png`) toma el primero; los dos se ven iguales |
| Clave de ítem repetida `arroz_con_leche` (416 y 450) | `blocks.js` | Igual; y nombre repetido «Arroz con leche» |
| Clave de bloque repetida `ceniza` (141 y 602) | `blocks.js` | `BLOCK_BY_KEY.ceniza` (`K.ceniza`) **queda con el último (602)**; el 141 es inalcanzable por clave y las recetas/hornos que usan `K.ceniza` apuntan al 602. Las dos se llaman «Ceniza» |
| Nombre repetido «Frasco con morfo» | ítem 286 `morpho_jar_item` y bloque 93 `morpho_jar` | Intencional (se coloca), pero el `origen.js` muestra «Sale de: Frasco con morfo» para el propio ítem |
| «Puerta» ×5 | ítem 266 y bloques 38–41 (`door_*`) | Intencional (mitades y abierta/cerrada); por eso `textoMirando` lo dice igual |
| Un PNG sin ítem | `src/assets/items/trofeo_rey_zopilote.png` es clave de **bloque** (643), no de ítem | No se carga nunca (`loadSprites` solo recorre `ITEMS`) |
| Tablas paralelas con ids numéricos a mano | `AGUA`, `HIERBAS`, `CRUDO_A_COCIDO` (`supervivencia2.js`), `esUnico` (`inventory.js`, rangos 495–498 y 510–520), `[262, 361, 362, 363, 364]` repetido en `game.js`, `fuerza.js`, `comodidad.js` | Ninguno está mal hoy; si un ítem cambia de id, hay que acordarse de 6 sitios. Mover a un conjunto exportado (`CRUDOS`) |

**Arreglos:** renombrar las claves duplicadas (`escritura_2`, `arroz_con_leche_2`, `ceniza_ext`) y revisar que `K.ceniza` sea el que se quiere; un test en `tools/revisar-datos.mjs` que falle ante clave repetida.

---

## 2. Recetas duplicadas o tapadas (todas las mesas)

Se ejecutó cada receta contra `findRecipe` con su propia disposición (en mesa 2×2 y 3×3, incluyendo las del fogón y las que se aprenden) para ver cuál gana. De 250 recetas, **5 están tapadas o muertas**:

| # | Receta que no sale | Quién la tapa | Por qué |
|---|---|---|---|
| 170 | **Cartelito para nombre ×2** (tabla + palo, sin forma) | **Trompo** (#162, tabla + palo, sin forma), definida antes | Mismos ingredientes sin forma: `findRecipe` devuelve la primera que coincide |
| 87 | **Plato vacío ×2** (`['P P','PPP']` de tablas) | **Bote de remos** (#67, mismo patrón) | Patrón idéntico |
| 171 | **Cajuela** (canasto de café; `['S S','SSS']` de palos) | **Estacas ×4** (#78, mismo patrón) | Patrón idéntico |
| 199 | **Jabalina ×2** (`['  I',' S ','S  ']`) | **Lanza de hierro** (#104, mismo patrón) | Patrón idéntico |
| 105 | **Mazo de hierro** (`['II ','II ',' S ']`) | **Nadie: es imposible de fabricar** | El patrón tiene la columna derecha vacía. `trim()` recorta la cuadrícula a las celdas usadas (ancho 2) y `matchShaped` compara con `pat[0].length` (3): nunca coincide |

**Arreglo de las cuatro tapadas:** darles una forma distinta (por ejemplo cartelito: `['T','S']` vertical; plato: `['P P',' P ']`; cajuela `['SSS','S S']` con un cuero o mimbre; jabalina: `['I','S','S']`) o un ingrediente propio, y **registrar** el cambio en `ayuda.js`/`origen.js` (que arma «Se fabrica…» desde `RECIPES`). **Arreglo del Mazo:** en `matchShaped`, comparar contra el patrón **recortado** (un `trimPattern(rec)` hecho una vez al cargar `RECIPES`, para que ninguna receta con filas o columnas vacías en el borde quede muerta). Alternativa de datos: reescribirlo sin columna vacía, por ejemplo `["II","II","S "]` (ancho 2). La primera es la robusta.

**Otras salidas repetidas (no son bug):** Tablas ×4 desde tres troncos distintos (0, 3, 249), Gallo pinto (3 formas), Dinamita (2), Bombeta (3), Mechero (2), Olla de carne (2), Empanada (2), Dardo/Flecha envenenada (2 cada uno), Maceta con flores (2 flores), Ceviche (3 pescados): las variantes tienen ingredientes distintos y las recetas no se tapan entre sí. **Prueba que dejaría esto vigilado:** el script de esta revisión (cada receta contra `findRecipe`) pasado a `tools/revisar-recetas.mjs` para que falle en CI.

---

## 3. Arena flotando que no cae

**Cómo funciona hoy.** La caída es **reactiva**, no continua. `World.neighborUpdates(x, y, z)` (`world.js`), que corre solo cuando alguien llama a `setBlock` con `updates` activo, revisa: la arena justo **encima** del bloque que cambió (si el bloque cambiado ya no es sólido), la del propio bloque, y (cambio nuevo, aún sin commitear) los 4 vecinos laterales y el de abajo. Cuando decide caer llama a `World.fall()`: si hay `onFall` (el juego lo pone en `game.js`), borra el bloque y crea una `FallingBlock` (`entities.js`) con un `Body` 0.98; al tocar suelo hace `setBlock` de nuevo (que despierta a su vez a los vecinos).

**Por qué queda flotando tras generar.** Ningún camino de generación llama a `neighborUpdates`: `Generator.generate()` escribe directo en `c.blocks`, y `ensureChunk()` reaplica los cambios guardados (`mods`) también directo. Así que **nada «despierta» la arena al cargar el chunk**, y una arena con aire debajo se queda ahí para siempre salvo que alguien toque exactamente la celda de abajo.

**Caminos que la dejan sin apoyo (ubicados en el código):**
1. **Cuevas que se tallan contra la capa de arena.** `worldgen.js` (y `worldgen2.js`): `carveTopLimit = underwater || biome === 'beach' ? h - 4 : h`, y la arena de superficie/relleno ocupa `y > h - 4`. En **playa y océano** la cueva se talla hasta `h - 4` y la arena empieza en `h - 3`: techo de arena justo sobre aire. En **desierto** el límite es `h`, así que la cueva puede abrirse **dentro** del relleno de arena (y de la arenisca, que no cae).
2. **Vetas de grava.** `worldgen.js` (lista `ores`): la grava reemplaza piedra (`blocks[i] === K.stone`) **después** de las cuevas. Una veta pegada a una cueva deja grava en el techo.
3. **Dunas y lagos de `worldgen2.js`:** línea ~385 (`K.sand` al azar sobre `col.h`, 30 %), ~456 (grava bajo el agua del lago): soporte presente en la columna, pero dependen de que lo de abajo sea sólido en el chunk vecino; en el borde de un chunk aún no generado `getBlock` devuelve aire.
4. **Estructuras** que apoyan arena (`estructuras.js`: cimientos de arena en playa, camino de grava) sobre terreno que luego se talla.
5. **Cambios del jugador** guardados en `mods`: al volver a cargar el chunk se reponen sin `neighborUpdates`.
6. **Bordes de chunk:** `neighborUpdates` llama `getBlock` en un chunk no cargado → aire → arena que cree sin apoyo cae a un vacío fantasma (o al revés, se queda).

**Qué hace falta.** El parche del árbol de trabajo (despertar los 4 vecinos y el de abajo) ayuda cuando el jugador interviene, pero **no resuelve lo generado** (nadie interviene). Falta un paso al cargar: **barrido de gravedad por chunk** al terminar `ensureChunk` (y cuando se cargan los vecinos): recorrer solo los bloques `gravity` y, si el de abajo no es sólido, o bien **rellenar el soporte** en generación (cambiar la arena sin apoyo por arenisca/piedra, la solución barata y sin cascada) o bien encolar `fall()` con un presupuesto (p. ej. 20 por cuadro) para no generar cientos de `FallingBlock` a la vez (hoy no hay tope: `spawnFalling` los acumula y cada uno es una malla). En generación, la regla más simple: tras tallar cuevas, `if (blocks[i] es gravity && blocks[i - CHUNK*CHUNK] === 0) blocks[i] = K.sandstone / K.stone`.

---

## 4. El bote se sale del agua y atraviesa tierra

**Causas (en `mar.js`, `BOTE.update` y `boatRide`):**
1. **La caja de colisión no es el casco.** El bote es `Body(w = 1.4, h = 0.6)`: un cuadrado de 1.4 × 1.4 alineado a los ejes (`physics.js`, `Body.moveAxis` solo conoce AABB cuadradas). El casco mide ≈ 3 de largo y la proa queda a ~1.25 del centro. Al girar (`m.yaw`) la caja **no gira**: el modelo se mete en la orilla por la proa y la popa sin que `moveAxis` lo note.
2. **Con `{ flying: true }` no hay gravedad ni autoescalón** (`step`: `canStep = !opts.flying && …`), y la posición vertical la manda un muelle hacia `surf - 0.28` (`b.vel.y += (…) * min(1, dt*4)`). Si la proa pasa sobre una celda sin agua, `findSurface` (solo busca 3 bloques debajo de `y + 0.6`) sigue encontrando agua del propio cuerpo, así que el muelle nunca suelta el bote.
3. **En tierra (`surf === null`) la velocidad máxima era 0.7** en vez de 0: `boatRide` calcula `speed = surf !== null ? … : 0.7`, y se podía avanzar a pie por la playa.
4. **La regla vieja «si choca con un bloque de altura, súbete»** (`if (b.hitWall && f > 0) … b.pos.y += 0.6`) permitía trepar la orilla escalón por escalón.
5. **El jugador se copia a la posición del bote** (`p.body.pos = b.pos`) sin colisión propia: el jugador atraviesa lo que el bote atraviese.

**Estado:** el árbol de trabajo agrega una prueba de proa/popa (`proa(1.25) || proa(0.9)`, a la altura `hy`) que anula la velocidad a lo largo del eje y solo permite varar desde el agua contra un escalón de 1 bloque con aire encima. Cubre el 1, el 3 (parcial) y el 4. **Falta:** (a) el barrido solo mira **hacia adelante en línea recta**; al girar, el casco barre de lado: probar también 2 puntos laterales (`±0.7` perpendicular) o usar 3 cajas (proa, centro, popa) con `boxHitsSolid`; (b) cuando `surf === null` el bote debe **quedarse varado** (`speed = 0`, no 0.7) y bajarse al jugador, o dejar solo 1 bloque de tolerancia; (c) `findSurface` debería exigir agua **en la celda** de la quilla, no a 3 bloques de profundidad; (d) la pos del jugador no debe sobrescribirse sin comprobar tierra.

---

## 5. Insolación estando encerrado en casa

**Dónde se decide.** `tickSed(g, dt)` (`supervivencia2.js`, llamado una vez por segundo con `dt = 1` desde `game.js`):

```js
const calor = (g.dim === 'inframundo' ? 2 : col && ['bosque_seco','beach','desert','guanacaste'].includes(col.biome) && g.daylight > 0.7 ? 1.6 : 1) * (sequía ? 1.3 : 1);
…
if (calor > 1.2 && g.dim === 'tierra' && !g.inventory.armor[0] && p.water < 10 && (g.clock - (g.insoT || 0)) > 20 && Math.random() < dt * 0.05) { … 'mareo' 8 s …}
```

**No mira techo, ni la luz real, ni el clima:** el bioma sale de `g.world.gen.column(x, z)` (el generador, no lo construido); la hora, de `g.daylight` (luz global del cielo); no se consulta si hay un bloque encima, ni la lluvia, ni la luz de cielo local. `tickMojado` (`supervivencia3.js`) **sí** tiene un escaneo de techo (`for y de q.y+2 a q.y+25 … SOLID`), pero no se reutiliza.

**Ritmos.** Insolación: a partir de 20 s desde la última, 5 % por segundo → en promedio **un evento cada ~40 s** (20 + 1/0.05) mientras `calor > 1.2`, sin casco y con `water < 10`. Además el mismo `calor` multiplica la **sed**: `thirstT += dt × (0.7 quieto | 1.0 caminando | 2.4 corriendo) × calor × dif.hunger × 0.9`, y a 38 baja un punto: ×1.6 en esos biomas, también bajo techo.

**Arreglo:**
1. Un solo `exposicionSol(g)`: sol **y** cielo abierto **y** no llueve: `techo` (el escaneo de 25 bloques de `tickMojado`, ahora compartido) → 0; `g.weather.intensity > 0.3` → ×0.3; hora entre ≈ 0.22 y 0.78 de `g.time` en lugar de `daylight > 0.7`; sombra de árbol (hojas encima) → ×0.5.
2. No usar azar: un contador `g.solT` que sube con la exposición y baja a la sombra (por ejemplo +1/s al sol, −2/s a la sombra), y la insolación sale a los 90 s acumulados. Así «encerrado» nunca acumula.
3. Aplicar `exposicionSol` también al `calor` de la sed.
4. Bonus: sombrero de paja/sabanero ya cuenta como `armor[0]` (cualquier casco); decidir si el casco de hierro debe **empeorar** el calor.

---

## 6. Herramienta automática

**Dónde se dispara.** `Game.herramientaSola(id)` (`game.js`), llamada desde el bucle de picar (`tickBreak`, junto al `crack`) al empezar a golpear un bloque. En el HEAD se llamaba **en el primer cuadro** con el clic izquierdo apuntando a un bloque (`if (!this.breaking || … distinto bloque) { this.herramientaSola(t.id); … }`).

**Interacción con el golpe de espada.** Peleando, el rayo de apuntado queda en el bloque de atrás/abajo del enemigo cuando el enemigo no está al alcance (`mobTarget = null` si `target.dist < mobTarget.dist`, línea de `updateTarget`); al pulsar clic izquierdo sobre el suelo, el bucle de picar arrancaba, `herramientaSola` veía `hd.tool = 'sword'` ≠ `b.tool = 'shovel'` y cambiaba la espada por una pala **en el primer clic**. La espada tiene `tool: 'sword'` truthy, así que no entraba en la salvaguarda `!(hd && hd.tool)`.

**Estado:** el árbol de trabajo ya añade `br.sostenido` (0.35 s con el clic mantenido en el mismo bloque, `br.revisado`), lo que distingue clic corto de mantener y recalcula `br.total` con el progreso ya hecho. **Falta cubrir:** (a) mantener 0.35 s apuntando al suelo **mientras se pelea** (arma en mano + enemigo a < 4 bloques o golpe reciente): añadir `if (this.mobTarget || this.lastHitT > clock - 2) return;` dentro de `herramientaSola`, o simplemente **no cambiar si lleva arma con `damage`** salvo que haya pasado 1 s sin enemigos; (b) **devolver** la herramienta anterior cuando se suelta el clic y pasan N segundos (guardar `this.herrPrevia`), para que la espada vuelva a la mano sola; (c) mostrar el cambio (hoy solo cambia la casilla marcada): un destello en la barra.

---

## 7. Hitboxes: puertas, cercas, portones y losas

**Colisión (jugador y criaturas), hoy.** `Body` (`physics.js`) es **una caja alineada a los ejes** de ancho cuadrado `w` y alto `h`. Contra el mundo usa `moveAxis` y `boxHitsSolid`, que ya saben de **cajas parciales** a través de la tabla `BOXES` (`blocks.js`): para cada bloque `render: 'shape'` **y** `solid`, `BOXES[id] = (collide || boxes) / 16`. Por eso las losas (`boxes: [[0,0,0,16,8,16]]`), las cercas (`collide: [[0,0,0,16,24,16]]`, que sube a 1.5 de alto) y los portones cerrados (`[0,0,7,16,15,9]`) sí tienen colisión parcial. **No** la tienen: las **puertas** (`render: 'model'`, ids 38–41: cerradas son **un cubo entero** para la física; abiertas, `solid: false`), las **cortinas** (`solid: false`, siempre pasables) y los portones abiertos (`solid: false`).

**Selección (el rayo de apuntado), hoy.** `World.raycast` (`world.js`) es un DDA de celdas: devuelve **la primera celda no aire y no fluido**, sea cual sea su forma; no consulta `BOXES` ni `boxes`. La bandera `b.thin` (cruces y antorchas) está **definida pero no se usa en ningún sitio**. Consecuencia: se apunta (y se rompe/pone) contra la celda entera de una losa, aunque se mire por encima de ella; se puede apuntar a una cortina o a un portón abierto aunque estén al otro extremo del bloque; y la cara que devuelve (`nx, ny, nz`) es la de la celda, no la de la caja.

**Mobs.** `raycastMob` (`entities.js`) usa una caja `rayBox` por criatura (`w × e`, `h × e`, +0.1 de holgura): AABB cuadrada, no sigue la orientación ni el modelo. **Proyectiles:** `Arrow` (`armas.js`), `armas2.js`, `sombras2.js` (`Piedra`) comprueban `SOLID[world.getBlock(floor(p))]`: la celda **entera** cuenta como sólida (una flecha se detiene en una losa aunque pase por encima de la caja) y las cortinas/portones abiertos **no frenan**.

**Qué haría falta para cajas parciales (de menor a mayor):**
1. **Selección:** en `World.raycast`, al entrar a una celda con `BLOCKS[id].boxes` (o `collide`, o `thin` → caja 0.6), hacer `rayBox` contra cada caja desplazada a la celda; si ninguna acierta, **seguir** el DDA; si acierta, devolver el `t` real y la cara según el eje de entrada. Hay que mantener el comportamiento de colocación (`placeBlock` usa `nx/ny/nz` y la celda): la cara debe ser de la caja, pero la celda vecina a poner sigue siendo la misma.
2. **Puertas:** convertirlas en `render: 'shape'` con `boxes` según `facing` y abierta/cerrada (hoy el modelo lo dibuja `stations.js` y la caja se conoce por `BE.facing`): exige variantes por orientación o una `boxesFn(be)`; sin eso la puerta cerrada sigue siendo un cubo.
3. **Proyectiles:** sustituir `SOLID[getBlock]` por `world.pointInBox(x, y, z)` (mira `BOXES`) y sub-pasar la flecha cada ≤ 0.15 bloques (hoy salta ~ `v·dt` por cuadro, a 40 m/s = 0.66 bloques: hace falta barrer).
4. **Jugador y criaturas:** el `Body` ya respeta `BOXES`; lo que falta son **cajas no cuadradas** (el bote, vagones, vacas largas): `Body` con `w` y `d` separados y, para el bote, 2–3 cajas encadenadas.
5. **Luz y malla:** no cambian; los `shape` ya son no opacos.

**Riesgo principal:** cualquier lugar que use `world.raycast` asume celda entera (`gancho.js`, pescar, bote, colocar, picar: 12 llamadas). Cambiarlo es seguro si se devuelve el mismo objeto con `dist` más fino.

---

## 8. El barrido (Z)

**Entrada.** `Game.onKeyDown` (`game.js`, línea ~543): `if (esTecla(S, 'deslizada', code) && !e.repeat) trySlide(this)`. La tecla se define en `teclas.js` (`['deslizada', 'Barrerse (caminando hacia adelante)', 'KeyZ']`) y se puede reasignar en Ajustes. «Clic derecho + Espacio» **no** es el barrido: es el **esquive** (`tryDodge`, `combate.js`; línea ~539: `if (code === 'Space' && !e.repeat) { … else if (this.blocking) tryDodge(this); … }`), que **sí** va en cualquier dirección (usa A/D/S, y sin dirección va hacia atrás), pero necesita bloqueo activo y 18 de aguante.

**Por qué solo hacia adelante.** `trySlide` (`combate.js`):
- Exige `g.keys.has('KeyW') || g.player.sprinting` (si no, el toast «Para barrerse, camine hacia adelante (W) y toque Z»).
- La dirección **no lee WASD**: `g.slide = { vx: -Math.sin(yaw) * v, vz: -Math.cos(yaw) * v }`, o sea siempre la mirada (adelante). `tryRoll` y `tryDodge`, en cambio, usan `moveDir(g, …)`/`fx, fz` y sí admiten dirección.
- El resto del barrido (`tickCombat`: `g.slide.t`, `forcedVel` con `0.35 + k × 0.65`, `landHit` y partículas) no depende de la dirección; lo único «hacia adelante» es esa línea y la condición de arranque.

**Arreglo mínimo:** reemplazar la condición y el vector por `const [vx, vz] = moveDir(g, 0, -1)` (ya existe en el mismo archivo, la misma que usa la voltereta) y quitar la exigencia de `KeyW`: con WASD barre a donde se camina, sin tecla barre adelante. El `v` (9 o 12) y el `t` se dejan. Revisar el cartel de ayuda (`ayuda.js:31`) y la etiqueta de `teclas.js` («Barrerse (caminando hacia adelante)» → «Barrerse»). Pregunta de diseño: si barrer hacia atrás debería costar más aguante o tener menos distancia.

---

## 9. Comida: penalización por repetir y premios por variedad

**La penalización** está en `Game.tickEating` (`game.js`, al terminar de comer, `e.t >= 1.6`):
```js
const ult = (this.meta.comidas ||= []);                       // las últimas 6 comidas (meta, se guarda)
const rep = ult.filter((id) => id === e.id).length;
const factor = survival ? (rep >= 3 ? 0.4 : rep === 2 ? 0.7 : 1) : 1;
… ult.push(e.id); if (ult.length > 6) ult.shift();
food += max(1, round(def.food × factor × mult.comida × casa.comida));
```
Aviso (`toldAburrido`, «¿Otra vez X?…»), una vez, y se rearma solo con `factor === 1`. Se repite en tres sitios: `fichaItem` (`comodidad.js`, muestra «Ya la comió mucho: rinde 70/40 %»), `mejorComida` (`comodidad.js`, la tecla de comer rápido elige entre iguales según el rendimiento) y `tickEating`. **No hay desvanecimiento por tiempo:** la ventana son las últimas **6 comidas**, no los últimos N minutos, así que una comida repetida hace 3 días sigue contando si no se comió nada más.

**Qué premia la variedad hoy (en realidad, casi nada de forma directa):**
- `comidaFuerza` / `tickFuerza` (`fuerza.js`): hasta **3 comidas distintas a la vez** dan vida y aguante máximos (+1/+2 corazones, +2.5 de aguante por punto de comida, 4–9 min), logros «Comer bien da fuerza» y «Tres tiempos de comida». Repetir la misma se bloquea con otro umbral (esperar a < 50 % de la duración), distinto del de `meta.comidas`.
- `comerPlato` / `efectoPlato` (`platos.js`): cada plato tradicional tiene su efecto propio.
- Habilidad `cocina` (`habilidades.js`): sube comiendo comida de `food ≥ 5` no cruda; `hito 10`: «comer cura 2 corazones».
- Multiplicadores `mult.comida`, `casa.comida`, y el bono de casa con despensa.
- Alertas y filtros: lo crudo da dolor de panza (`panza`) y no da fuerza.

**Lo que no existe:** ningún bono por comer **tres tipos distintos seguidos**, ni por grupos (carbohidrato, proteína, fruta, bebida), ni el contador de variedad visible en la interfaz. **Ideas de premio:** (a) «variedad» como bonificación: si las últimas 4 comidas son distintas, +10 % de llenado y +1 de aguante máximo por 5 min (reutiliza `meta.comidas`); (b) hacer que `meta.comidas` guarde `{id, dia}` y descuente por **día de juego** (la penalización baja a la mitad por día); (c) mostrar «Variedad: 3/4» al lado del ícono de fuerza (`#fuerza`); (d) unir los dos umbrales (`meta.comidas` y la espera de `fuerza.js`) en una sola función `rendimiento(id)` para que `tickEating`, `fichaItem` y `mejorComida` no se repitan.

---

## Resumen para la constructora

| # | Causa | Estado |
|---|---|---|
| 1 | Ficha flotante que solo se armaba al entrar a la casilla | Arreglo ya en árbol; falta llamarlo tras cada clic y en casilla de resultado |
| 2 | Recetas tapadas: Cartelito (por Trompo), Plato (por Bote), Cajuela (por Estacas), Jabalina (por Lanza); Mazo de hierro imposible por patrón no recortado | Sin arreglo |
| 3 | La arena cae solo por eventos; la generación no la «despierta» y talla cuevas bajo capas de arena/grava | Parche parcial (vecinos); falta barrido al cargar o soporte en generación |
| 4 | Casco ≠ caja de colisión; sin gravedad con `flying`; 0.7 en tierra; escalón automático | Parche parcial (proa); faltan laterales y varar a 0 |
| 5 | `tickSed` no mira techo, clima ni luz local; azar 5 %/s | Sin arreglo |
| 6 | `herramientaSola` disparaba en el primer cuadro; la espada tiene `tool` | Parche (0.35 s); falta excluir pelea y devolver la herramienta |
| 7 | Colisión parcial existe (`BOXES`); selección, puertas y proyectiles usan celda entera | Sin arreglo (plan en 5 pasos) |
| 8 | `trySlide` usa siempre la mirada y exige W | Sin arreglo (una línea) |
| 9 | Penalización en `tickEating`: últimas 6 comidas, 70 % / 40 %; casi sin premio por variedad | Sin arreglo |
