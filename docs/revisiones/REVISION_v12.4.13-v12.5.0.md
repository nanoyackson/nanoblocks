# Revisión de v12.4.13 → v12.5.0

Sesión investigadora, **solo lectura**. Alcance: `git diff 55ad357..140956e` (v12.4.13 «Décima revisión (jefes)» y v12.5.0 «Gráficos: medir y regular»): `game.js` (`damagePlayer`, `jefeDelGolpe`, `render`), `jefes-balance.js`, `caverna.js`, `finca2.js`, `regulador.js`, `medidor.js`, `textures.js` (atlas y nitidez), `ui.js`, `main.js`, `save.js`.

**Cómo se hizo:** leí el diff y el código de cada llamada a `damagePlayer` (≈ 96). Corrí tres cosas mías en Node (en el scratchpad): (1) **la clase `Regulador` real** con un juego y una pantalla falsos y tiempos de cuadro inventados, para ver qué decide en cuatro máquinas imaginarias; (2) **los pintores reales** de `pixelart.js` para medir qué les pasa a las baldosas recortadas al bajar de mipmap; (3) las cuentas de geometría de la atribución de golpes. **No corrí el juego** ni el bot, y **nada de la GPU se probó**: lo de GPU/anisotropía va marcado «por confirmar».

## Los 5 más importantes

| # | Hallazgo | Gravedad | Dónde |
|---|---|---|---|
| 1 | **El regulador oscila.** Sube cuando «aguanta ≥ 95 %» *a la resolución baja*, pero eso no dice nada de si aguanta la alta: en una máquina limitada por píxeles sube, va lenta 60 s, baja, aguanta, sube… (simulado: **ciclo de ≈ 125 s, 49 % del tiempo por debajo de 42 fps**, y un aviso «Bajé…» cada ciclo) | **Alta** | `regulador.js: cuadro`, `subir` |
| 2 | **La meta es «lo mejor que se ha visto», no el refresco.** Una laptop que **pasa a 30 Hz con batería** (Ahorro de energía de Chrome) baja sola la resolución y el nivel sin necesidad (simulado: 4 bajadas en 191 s y nunca se recupera); y una máquina **lenta de forma pareja** (25 fps siempre) **nunca se regula** (0 cambios en 12 min) | **Alta** | `regulador.js` (`metaMax`) |
| 3 | **El regulador cambia `settings.calidad` y eso se guarda.** Cualquier `apply()` (subir el volumen, por ejemplo) hace `saveSettings(s)` con la calidad ya bajada: **Ultra pasa a Medio para siempre** tras un minuto malo. Además **choca con la elección a mano**: no se apaga, y al escoger la calidad en el menú la resolución se queda baja (no se llama a `resize()`) | **Alta** | `regulador.js: bajar`, `ui.js` (`#s-calidad`, `#s-v-*`), `save.js: saveSettings` |
| 4 | **`jefeDelGolpe` por origen atribuye al jefe golpes que no son suyos:** los de **secuaces pegados al jefe** (radio `0.75 + w/2`), los **proyectiles y explosiones** que caen cerca de él y de la víctima, y los de **bichos comunes** con nombre parecido (`cocodrilo`, `Cascabel`). Heredan su multiplicador, la armadura débil y el tope del 60 % | **Alta** (balance) | `game.js: jefeDelGolpe` |
| 5 | **Los mipmaps oscurecen y ralean las plantas, el vidrio y las telarañas.** Los píxeles transparentes son negros (RGB 0,0,0), el mipmap los mezcla: a partir de 2× de reducción esas baldosas quedan al **45–70 % de su brillo** y al **4×–8×** (flores, vidrio) **desaparecen**. Las hojas, en cambio, solo «engordan» (bien) | Media | `textures.js: buildAtlas`, `aplicarNitidez` |

Más abajo: § 1.4 (Sombra Madre y la fórmula de armadura), § 3 (medidor siempre encendido), § 4 (lo que **sí** está bien en la nitidez).

---

## 1. `jefeDelGolpe` y la armadura de jefes

### 1.1 Cómo decide
`damagePlayer(…, fromX, fromZ)` llama a `jefeDelGolpe(g, cause, fromX, fromZ)`: arma una lista de jefes vivos a < 40 bloques (se refresca cada 0.5 s), y devuelve (a) el primero **cuyo cuerpo está a ≤ `0.75 + w/2` del origen del golpe** (`fromX, fromZ`), y si no hay origen (rayos, veneno) (b) el primero cuyo **nombre o alias** aparece en el aviso (minúsculas, ≥ 4 letras). Si hay jefe: `amount *= jefe.dano`, armadura **nueva** (`0.03·puntos + 0.02·dureza`, tope 0.80) y tope de **60 % de la vida máxima** (12 de 20). Sin jefe: armadura de siempre (`0.04…`, tope 0.88).

### 1.2 «¿Hay golpes atribuidos al jefe equivocado cuando hay dos cerca?»
**Con dos jefes, bien:** el origen decide por posición y el nombre solo se usa si no hay origen; si los dos nombres aparecieran en el mismo aviso (no pasa hoy) gana el primero de la lista. La mejora respecto de la 9.ª es real: ya no se toma «el primero que encuentre». Lo que **sí** falla es la atribución al jefe *cuando no es de él* (§ 1.3) y estos dos:
- **El origen no siempre es el cuerpo del atacante.** Muchos golpes pasan otra cosa como origen: la posición del **proyectil** menos su velocidad (`final.js` pluma `p.x − v.x`, `sombras2.js` piedra, `goleta.js` cañonazo, `bichos3.js` luz mala), la del **objetivo** (`jefes3.js:157`, la salida de la Cascabel pasa `T.x, T.z`), la de **la marca** (`archivo.js:177`, Sellazo) o la del **toro** desplazada (`bravos.js:163`). Esos caen al nombre, y funciona porque llevan el nombre en el aviso (revisé los 23 jefes: todos tienen uno o un alias). Es frágil: el día que un golpe de un jefe nuevo no lleve su nombre **ni** salga de su cuerpo, queda sin presión en silencio (justo lo que le pasó a Don Cornudo antes).
- **Un golpe sin origen puede casar con el nombre de otro jefe a menos de 40 bloques** aunque lo haya dado un bicho común (§ 1.3, `cocodrilo`).

### 1.3 «¿Los secuaces heredan la presión?» Sí, por vecindad
`golpes.js:201` (la ruta de casi todos los cuerpo a cuerpo) pasa como origen la **posición del mob que pega**. Si ese mob es un secuaz (una Sombra de los refuerzos del Olvido o de la Sombra Madre, un funcionario de la Jefa, un murciélago del Rey) y su centro está a ≤ `0.75 + w/2` del centro del jefe, `jefeDelGolpe` lo toma por **el jefe**. Radios reales: Sombra Madre y El Olvido (`w 0.7`) → **1.10**; Rey Zopilote (`w 2.4`) → **1.95**; Señor del Arenal (`w 1.5`) → 1.5. Los secuaces y el jefe rodean al jugador a la vez y sus centros quedan a 0.7–1.5 bloques: **pasa en la pelea normal, no solo de rozón.** Efecto de cada golpe de secuaz atribuido: **× `dano` del jefe** (una Sombra de 3 junto al Olvido: 3 × 3 = 9, y la tabla de § 2.2 de la revisión anterior dice que 12 ya es el tope), **la armadura débil** (+67 % de daño con diamante+3) y el tope de 12. Otros casos del mismo mecanismo:
- **Explosiones** (`game.js:2238`, «Voló por los aires», con origen en la explosión): una bomba propia que cae junto al jefe se multiplica por su `dano` (×3 con la Arpía o el Olvido).
- **Proyectiles ajenos** (piedra de una Sombra hondera) que impactan al jugador cuando el jefe está pegado a él: el origen del proyectil (`p − v`) queda a ≈ 1 bloque del jugador, dentro del radio.
- **Bichos comunes con el nombre parecido**: los alias `cocodrilo` y `Cascabel` (y `Arpía`) son subcadenas del aviso de **cualquier** cocodrilo o víbora cascabel si el jefe correspondiente está a < 40 bloques (`Golpe de El Cocodrilo…`). Hoy los multiplicadores son 0.5 y 0.55 (los bichos comunes pegarían **menos** y con armadura nueva), pero es la misma trampa.

**Arreglo (pequeño):** que el **atacante viaje por separado**, no por posición. En `golpes.js: …alGolpe`/`atacar` poner `g.atacante = m` justo antes de `damagePlayer` y limpiarlo después (o un séptimo parámetro); `jefeDelGolpe` mira primero `g.atacante` (`JEFES_BALANCE[g.atacante.type]`) y solo para los golpes sin atacante (rayos, veneno, marcas) usa el nombre/alias. Las ~90 llamadas directas siguen igual. Con eso desaparecen secuaces, explosiones y proyectiles, y los alias solo sirven para los golpes del propio jefe que no salen de su cuerpo.

### 1.4 Sombra Madre ×1.5 / 600 y la separación de fórmulas
- **Sombra Madre `{ vida: 600, dano: 1.5 }`** (antes 855 y ×3). Su golpe pasa de 21 a **10.5**, que es lo razonable (la revisión anterior marcaba 21 como «muerte de un golpe»); con el tope de 12 ni siquiera hacía falta bajarlo tanto para ese fin: se bajó por la Noche Larga. **Ojo con la Noche Larga:** allí la Sombra Madre es la **última ola** y las Sombras comunes pelean pegadas a ella, así que por § 1.3 **sus golpes también reciben ×1.5 y la armadura débil**; el 3-de-4 perdido que se midió con el bot ya incluye (o no incluye, según qué versión del código corrió) esa atribución. **Por confirmar** repitiendo la Noche Larga después del arreglo de § 1.3: la presión de la Sombra Madre y la de sus Sombras no se pueden separar hoy.
- **Rey Zopilote `{ 2500, 0.85 }`** (antes 3100 y 0.65) y **Murciélago Rey `{ 130, ×3 }`** (con la fase 2 por fracción: bien arreglado en `caverna.js:58`): coherentes con lo que pedía la revisión anterior. El comentario del Rey dice «falta la prueba con una persona»: sigue pendiente.
- **Tapa del 60 %** (`Math.min(amount, maxHealth × 0.6)`): arregla lo que marqué (Olvido 24, Sombra Madre 21, Reina Bananera 20.7 → 12). Detalle: **también** corta a quien llega con **más** equipo del que toca si el multiplicador es grande y la armadura poca… y, sobre todo, **le quita sentido al ×3** de los jefes topados (Llorona, Cadejos, Olvido…): contra cuero y sin armadura el golpe ya siempre vale 12. Eso es lo buscado, pero entonces **el ×3 solo cuenta contra armadura buena**: conviene decirlo en `BALANCE.md`.
- **Dos fórmulas de armadura según «hay jefe cerca y se le atribuye»:** coherente con la decisión de la 10.ª revisión (los jefes se calibraron con la nueva, el resto con la vieja), y `BALANCE.md` ya lo dice. Pero **el jugador no tiene manera de saber** que su armadura protege menos mientras hay un jefe a < 40 bloques, y por § 1.3 puede protegerlo menos **contra un secuaz** del mismo jefe. Además, **la misma Sombra** pega distinto según esté o no junto al jefe. Se arregla solo con el arreglo del atacante (1.3).

### 1.5 Otros detalles
- El tope de 60 % se aplica a todo lo atribuido, también a los golpes con `armored = false` (rayos, veneno): bien y consistente.
- La lista `g.jefeCerca.L` guarda la **referencia** al mob (`J.m.body.pos` se lee vivo), no una copia: las posiciones están al día aunque la lista tenga hasta 0.5 s. Un jefe que nace dentro de esa ventana no cuenta hasta el siguiente refresco (sus primeros golpes salen sin presión): irrelevante.
- `m.dying` ya se excluye (era la observación de la revisión anterior): bien.

---

## 2. El regulador (`regulador.js`)

**Qué hace:** en `main.js: frame` recibe el intervalo crudo; con el juego jugándose, sin pausa y ≥ 8 s después de cargar, junta ventanas de 5 s, saca p50 y p10, fija la **meta** como el mayor `min(60, 1000/p10)` visto, y si `fps(p50) < 0.7 × meta` **dos ventanas seguidas** baja un escalón (resolución 1 → 0.85 → 0.7, luego Ultra → Alto → Medio); sube de a uno tras 60 s con `fps ≥ 0.95 × meta`; nunca más de un cambio por 60 s.

### 2.1 ¿Puede oscilar? Sí (hallazgo 1)
Lo simulé con la clase real. Caso D: máquina limitada por píxeles (34.7 ms al 100 %, 25 ms al 85 %, 17 ms al 70 % = 60 fps):

```
t=10 s   baja a 85 %      t=195 s  baja a 70 %
t=70 s   baja a 70 %      t=321 s  baja a 70 %   … (cada ≈ 125 s)
tiempo con < 42 fps: 444 s de 900 s (49 %)
```
Mecanismo: al 70 % aguanta 60 fps → tras 60 s «estable» **sube** al 85 % (donde da 40 fps) → el aviso de bajada no puede actuar hasta pasar 60 s del último cambio → **60 s a 40 fps** → baja → repite. Ningún mecanismo recuerda que «subir ya falló». **Arreglos:**
- **Memoria de fallo:** tras bajar a menos de ≈ 2 min de haber subido, **prohibir** ese escalón por 10 min y duplicar la prohibición cada vez (backoff).
- **Predecir antes de subir:** subir solo si `fps_actual ≥ 0.95 × meta × costo_relativo` (resolución: `(esc_actual/esc_nueva)²`; nivel: un factor fijo medido con `costo()`), es decir, **no** «aguanta» sino «aguantaría».
- **O no subir nunca dentro de la sesión** (más simple y suficiente: la persona puede subir a mano; el aviso ya dice qué se bajó).
- **A 120/144 Hz y con vsync raro:** el tope `min(60, …)` hace que 100 fps en un monitor de 144 Hz cuenten como «estable»; no hay oscilación por el refresco en sí. Con vsync que **alterna** 16.7/33.3 ms entre ventanas el p50 salta de 60 a 30 fps, pero hacen falta **dos** ventanas lentas seguidas: sale poco. La oscilación de arriba es independiente del refresco.

### 2.2 ¿La meta se calcula bien con 30 Hz de batería? No (hallazgo 2)
`metaMax` **solo sube**: toma el p10 (lo más rápido de la ventana) y no baja nunca. Si la compu estuvo en 60 Hz y luego pasa a **30 Hz** (Ahorro de energía de Chrome, laptop con batería baja: **por confirmar** que el límite sea de 30 fps en esta versión), el juego va igual de «bien» pero `fps(p50) = 30 < 0.7 × 60 = 42`, y **baja todo** (simulado, caso C: resolución 85 %, 70 %, Alto, Medio en 191 s y se queda ahí; sin avisarle que el problema es la pantalla). Y viceversa, **si arranca con 30 Hz**, la meta es 30 y todo anda; al enchufar sube a 60 y se queda. **La lectura correcta de «refresco» no se puede sacar de lo que rinde el juego** (una máquina lenta de verdad también muestra un p10 bajo).

Dos consecuencias opuestas del mismo defecto:
- **Máquina lenta pareja = no se regula** (caso B, 25 fps constantes: **0 cambios**, 720 s de 720 por debajo de 42). Justamente a quien más ayudaría. El aviso viejo de la v12.2.1 (< 40 fps durante 10 s) sí le avisaba; ahora ese aviso solo corre con `calidadAuto === false`.
- **Pantalla limitada = se baja sin motivo** (caso C).

**Arreglo:** la meta es **60 salvo que se demuestre lo contrario**: medir el refresco real **en un momento ligero** (menú principal o los primeros cuadros, sin mundo) con la mediana de rAF, y recalcularlo con una ventana *sin carga*; y reconocer el **tope duro**: si p10 ≈ p50 ≈ p90 ≈ 33.3 ms (casi sin dispersión) es una pantalla/ahorro de energía, no un juego lento → no tocar nada. Dejar `metaMax` con **caducidad** (solo cuenta lo de los últimos 3 minutos).

### 2.3 ¿Choca con la elección a mano o con Bajo? Sí (hallazgo 3)
- **No se apaga al tocar a mano** (el comentario de cabecera dice «Se apaga con la casilla… o tocando a mano la calidad o la resolución»; el código solo hace `olvidar()`, que **vacía lo bajado y vuelve `escalaAuto` a 1**, pero `calidadAuto` sigue en `true`): la persona escoge «Alto» y 15–70 s después, si los fps no alcanzan, el regulador **vuelve a bajarla** con otro aviso. Es una lucha con lo que acaba de decidir.
- **`#s-calidad` llama a `olvidar()` pero no a `game.resize()`**: `escalaAuto` queda en 1 y el `setPixelRatio` sigue en 0.7 hasta el próximo `resize` de la ventana. (`#s-scale` y `#s-calidad-auto` sí lo llaman.) Resultado: la imagen queda borrosa y «Resolución» en el panel no lo dice.
- **Los interruptores sueltos** (`#s-v-tono/niebla/cielo/bruma/nitidez`) **no llaman a `olvidar()`**: pasan a «Personalizado» pero el regulador sigue con su lista; `bajar()` aún reduce la resolución en Personalizado (permitido) y, en el mejor caso, `subir()` consume un elemento sin efecto.
- **Con «Bajo»:** `BAJA['bajo']` no existe, así que solo toca la **resolución** (85 % y 70 %). Es razonable para quien tiene un equipo flojo, pero contradice «Bajo = como siempre»; decirlo en la nota de calidad o dejar la resolución fuera en Bajo.
- **El mensaje:** «Bajé la calidad a Alto…» sale con la clave `regulador:baja` como `consejo` (el Locutor lo agrupa: bien).

### 2.4 ¿Guarda algo en `settings` que no debería? Sí: `settings.calidad`
`bajar()` hace `s.calidad = BAJA[s.calidad]` y `s` **es** el objeto de ajustes que `saveSettings(s)` escribe completo a `localStorage` en cada `apply()` (volumen, brillo, resolución, casillas…) y en `ui.js:2740`. Entonces **una bajada del regulador se vuelve la elección guardada**: se recarga la página y arranca en Medio, sin `calidadElegida` ni rastro de que se bajó por fps (el `bajados` vive en memoria). `escalaAuto` **no** se guarda (bien, vive en `game`). **Arreglo:** que el regulador no toque `s.calidad`: llevar una `calidadEfectiva` aparte (`game.calidadAuto`) que `flagsDe` y `aplicarNitidez` lean junto con `s.calidad`; así lo guardado es siempre lo que la persona escogió.
- `DEFAULT_SETTINGS.calidadAuto: true` también aplica a **quien ya tenía ajustes guardados** (se mezcla con `...DEFAULT_SETTINGS`): el regulador se enciende solo para todos; está documentado en el CHANGELOG, pero conviene decirlo en la guía de prueba.

### 2.5 Otros
- `bajar()` con `paso` al máximo y sin `BAJA` no actualiza `ultimoCambio`: cada ventana vuelve a intentarlo (inofensivo).
- Cada `bajar`/`subir` de resolución llama a `resize()` (reasigna el búfer): un tirón de 10–40 ms por cambio.
- `ms > 250` descarta bien la carga de chunks y la pestaña oculta; los estados `shop`, `libreta`, `inventory`… se excluyen por `ui.state === 'playing'`.

---

## 3. El medidor (`medidor.js`)

- **El costo con el panel cerrado: no está cerrado.** `empezarCuadro`/`terminarCuadro` corren **en cada cuadro** (`game.js: render`), con `settings.perf` encendido o no y en **Bajo también**: crear una `WebGLQuery`, `beginQuery`/`endQuery`, sondear las pendientes con `getQueryParameter` y, al recoger una, `getParameter(GPU_DISJOINT_EXT)` y `deleteQuery`. Son unas pocas llamadas por cuadro (decenas de µs de CPU), pero (a) **Bajo deja de ser «como siempre»** (regla de oro de `PLAN_GRAFICOS`), (b) las consultas de tiempo a veces **serializan** el trabajo en algunos controladores (**por confirmar**; la precisión que da Chrome también es limitada), y (c) no hace falta nada de esto si nadie mira el panel.
- **Arreglo:** que `empezarCuadro` salga sin hacer nada si `!game.settings.perf` (y que `costo()` la encienda mientras corre); al apagarse el panel, vaciar `pendientes` con `deleteQuery`.
- **La consulta puede quedar abierta:** `terminarCuadro` solo se llama al final de `render`. Si un `renderer.render` **lanza** (el `try/catch` de `main.js` lo traga), el `endQuery` nunca corre y **el siguiente `beginQuery` falla** (no se pueden anidar): el medidor se queda en «gpu —» para siempre. Envolver en `try/finally`.
- `renderer.info.autoReset = false` se pone una vez y se queda; el panel suma las **tres** pasadas (`farScene`, `scene`, mano) porque se reinicia en cada `empezarCuadro`: coherente. Los renderers de `vestidor.js` y `bestiario.js` tienen el suyo.
- `costo(clave)` se ve bien hecha: cambia `settings.calidad`/`video`, mide 120 cuadros alternando sin/con tres veces y **restaura en `finally`**. Dos precauciones: (1) con `calidad: 'personalizado'` el «sin» es **todo apagado** (`FLAGS.bajo`) salvo la bandera, no el nivel actual: mide la bandera aislada del Bajo (que es lo que se quiere, pero hay que decirlo); (2) si algo llama a `saveSettings` mientras corre (no pasa: es síncrona), quedarían los ajustes de la prueba guardados. Sin mundo cargado `game.render` falla y el `finally` restaura.

---

## 4. La nitidez (atlas de 384×512)

### 4.1 Lo que está bien (verificado leyendo el código)
- **El atlas:** `CELDA = 16 + 2 × 4 = 24`, `COLS = 16` → ancho **384**, alto `ceil(n/16) × 24` redondeado a potencia de 2 → **512** (≈ 290 baldosas = 19 filas × 24 = 456 → 512). Cada celda lleva la baldosa **centrada** y 8 copias «dando la vuelta» (±1 baldosa) recortadas a la celda: las baldosas se pintan enrollables, así que el margen es la continuación natural.
- **Alineación:** `tileUV` apunta a `(col × 24 + 4 + 0.01)…(col × 24 + 4 + 16 − 0.01)`; **todo el que lee el atlas lo hace con `tileUV`**: el mallador (bloques, fluidos, formas con `px / 16`, rotaciones de `VARY`), `models.js` (cubos de ítem con `du × (7 + u × 2) / 16`), `portones.js`, los bloques sueltos. **Ninguno usa constantes del tamaño viejo** (busqué `COLS`, `* T`, `atlasCanvas`, `TILE_INDEX` fuera de `textures.js`: nadie). Las grietas (`crackTextures`) y las partículas (`tilePixels`) usan sus propios lienzos, no el atlas.
- **Texturas animadas:** **no hay.** El agua se mueve por vértice (`aAnim`, `world.js`) y la lava y el magma son una sola baldosa estática (`P.water`, `P.lava`, `P.magma`); los cultivos son baldosas distintas por etapa (`cafe0…3`). No hay ningún `putImageData` que escriba en el atlas después de construirlo.
- **Arte de GPT:** las baldosas con arte (`TEX_ARTE`, 2 en `pixelart.js`) se pintan en el `Tile` de 16×16 como cualquier otra y entran al mismo margen; el arte grande de GPT de `public/sprites/arte/` es de **ítems** (otro lienzo, 128 px), no del atlas.
- **Mipmaps y margen:** la celda de 24 es múltiplo de 8: hasta el **nivel 3** (reducción de 8×) cada texel cae dentro de una sola celda, así que **no hay sangrado entre baldosas vecinas** hasta ahí; desde el nivel 4 (16×, un bloque de 1 píxel en pantalla, ≈ 700 bloques con 1080p y FOV 75) la celda de 1.5 texels ya no calza. Con el alcance máximo (16 chunks = 256 bloques) solo se ve a ras de suelo con anisotropía. **No encontré un problema de sangrado.**
- `aplicarNitidez` recompila la textura solo si cambia la anisotropía; el atlas pasa a NPOT (384): WebGL2 lo acepta con mipmaps.

### 4.2 Lo que **no** está bien: los píxeles transparentes son negros (hallazgo 5)
Todos los píxeles transparentes de los pintores son `(0, 0, 0, 0)`. El lienzo 2D los guarda premultiplicados y `CanvasTexture` los sube **sin** premultiplicar (`premultiplyAlpha` en falso): el mipmap promedia el color **con el negro**. Medí con los pintores reales (reducción por caja, como `generateMipmap`), el brillo de los texeles que **sí** pasan `alphaTest` (0.5) frente al de la baldosa original, y cuántos pasan:

| Baldosa (bloques) | Cobertura | Nivel 1 (2×) | Nivel 2 (4×) | Nivel 3 (8×) |
|---|---|---|---|---|
| `tall_grass` (pasto alto) | 22 % | 23/64 pasan, **56 %** del brillo | 5/16, 49 % | 1/4, 45 % |
| `flower_red` (flores) | 12 % | 10/64, 68 % | 1/16, 55 % | **0/4: desaparece** |
| `helecho` | 26 % | 21/64, 72 % | 4/16, 69 % | 1/4, 56 % |
| `vine` (enredadera) | 27 % | 22/64, 63 % | 2/16, 58 % | **0/4** |
| `glass` (vidrio) | 27 % | 29/64, **53 %** | **0/16: desaparece** | 0/4 |
| `cane` (caña) | 30 % | 35/64, 52 % | 8/16, 53 % | 0/4 |
| `cobweb` (telaraña) | 28 % | 17/64, 62 % | 3/16, 65 % | 0/4 |
| `corn3` (maíz maduro) | 32 % | 24/64, 70 % | 2/16, 61 % | 0/4 |
| `leaves`, `jungle_leaves` (hojas) | 93–94 % | 62–64/64, **95 %** | 16/16, 93 % | 4/4, 93 % |
| `verja` (verja) | 63 % | 64/64, 62 % | 16/16, 62 % | 4/4, 62 % |

**Lectura:**
- **Las hojas y el follaje denso «engordan»** (los huecos se cierran y el brillo casi no cambia): se ven más llenas de lejos, que es lo normal con `alphaTest` y no hay agujeros que centelleen. **No hay problema.**
- **Plantas, flores, maíz, caña, enredaderas, telarañas y vidrio se oscurecen al 45–70 %** apenas se reducen 2× y **desaparecen** (flores, vidrio, enredaderas) a 4–8×. El vidrio de las ventanas a ≈ 180 bloques o más (4×) deja de existir; antes (sin mipmaps) esos píxeles centelleaban pero se veían.
- **Cuándo empieza:** nivel 1 ≈ bloque de 8 px en pantalla ≈ **88 bloques** a 1080p con FOV 75 (`704 / px`), o sea en el último anillo con la distancia por defecto (6 chunks = 96) y en casi todo el campo con 12–16. **Y se adelanta** con la resolución baja: con el regulador al **70 %** el bloque mide 0.7× los píxeles, así que el oscurecimiento empieza a ≈ **62 bloques**: la medida «de ahorro» deja el pasto y las flores oscuros y ralos más cerca. (Esto se suma al hallazgo 2.)
- **Anisotropía con filtro «nearest»:** `NearestMipmapLinear` + `anisotropy` 4/8/16. **Por confirmar** que el navegador la aplique con ese filtro (la especificación de la extensión la liga a los filtros mipmapeados, pero algunos controladores la ignoran con «nearest»): comparar a ras de suelo en Medio y Ultra.

**Arreglo:** quitar el negro de los píxeles transparentes **antes** de generar los mipmaps (*sangrado de color*): rellenar el RGB de cada píxel con alfa 0 con el **color medio de los opacos de esa baldosa**, dejando el alfa en 0. El lienzo 2D no lo permite (premultiplicado: el RGB del alfa 0 se pierde), así que el atlas debe construirse como **`THREE.DataTexture`** (`Uint8Array` RGBA de 384×512 armado con los `tile.data` y los márgenes copiados a mano, `flipY = false`, `colorSpace` y filtros como hoy). `atlasCanvas` solo se usa dentro de `textures.js`, así que el cambio es local. Además, opcional: pasar el `alphaTest` a una versión que **conserve la cobertura** por nivel (escalar el alfa de cada mip para que la media se mantenga) si se quiere que flores y vidrio no se desvanezcan; es lo que hace Unity/«alpha to coverage» y exige un paso más en el shader (`texture2D(map).a *= …`), así que lo dejaría para después del sangrado de color.

**Cómo medirlo:** una captura en Medio (con nitidez) y en Bajo (sin) de un prado de flores y de una casa con ventanas a 90, 150 y 220 bloques, con la distancia de visión al máximo; y la misma con el regulador forzado a 70 %.

---

## 5. Lo que haría la constructora, en orden
1. **Regulador (hallazgos 1–3):** meta = 60 con detección de tope duro y de refresco medido en el menú; **no subir** (o backoff/predicción); **no tocar `settings.calidad`** (calidad efectiva aparte); apagar o resetear bien al tocar a mano (`resize()` en el select, `olvidar()` en los interruptores).
2. **Atribución de golpes (hallazgo 4):** `g.atacante` desde `golpes.js` y solo ese; alias solo para golpes sin atacante; **repetir** la Noche Larga y la pelea del Olvido después (los números de la 10.ª revisión incluyen secuaces atribuidos).
3. **Atlas (hallazgo 5):** `DataTexture` con sangrado de color; revisar plantas y vidrio con capturas.
4. **Medidor:** salir si no hay panel (y no en Bajo); `try/finally` en `render`.
5. Documentar en `BALANCE.md` que el ×3 de los jefes topados solo cuenta contra armadura buena (por el tope del 60 %).

*Escrito por la sesión investigadora. Solo lectura: no se corrió el juego ni el bot ni nada de GPU; las simulaciones del regulador usan la clase real con tiempos inventados, y las medidas de mipmaps usan los pintores reales con promedio por caja (lo que hace `generateMipmap`).*
