# Plan del horizonte lejano y de ver más chunks

Pedido: encargo 15 de la orquestadora y sección 5b de `docs/COLA_DE_TRABAJO.md`. Estado base: `v11.11.3`. **Solo diseño y medición**: no se editó código del juego. Lo medido se corrió con scripts de Node sobre una copia del `HEAD` (el generador y el mallador son funciones puras que corren sin navegador); la GPU y los fps **no se midieron** (no se abrió el navegador): lo que depende de ellos va marcado «estimación» o «📏 medir».

**El hallazgo que cambia el plan:** el juego **ya tiene** un horizonte lejano (`src/lod.js` + `src/lodworker.js`, ajuste «Horizonte lejano» de 0 a 1 536 bloques, hoy por defecto 768). Dibuja el terreno en baja resolución desde un hilo aparte y lo esconde con un shader donde ya hay chunks. Por eso este plan **no empieza de cero**: ordena lo que le falta (construcciones, grietas entre niveles, fundido, más alcance, atmósfera) y ataca lo que de verdad limita la distancia de vista, que **no es el horizonte sino el mallado de los chunks reales en el hilo principal**.

---

## 1. Cómo funciona hoy

### 1.1 Chunks reales (`world.js`, `mesher.js`, `worldgen.js`)

| Pieza | Hoy | Dónde |
|---|---|---|
| Tamaño | **16×16×128** bloques por chunk; `Uint16Array` de 32 768 (**64 KB**) más un tinte de color por columna (3 KB) | `worldgen.js` (`CHUNK = 16`, `HEIGHT = 128`), `world.js` (`class Chunk`) |
| Distancia de vista | `renderDistance` en chunks, **2 a 12**, por defecto **6** (13×13 = 169 chunks) | `save.js` (`DEFAULT_SETTINGS`), `index.html` (`#s-rd`), `ui.js` |
| Carga | `World.update(px, pz, budgetMs)` recorre una lista ordenada por distancia: genera lo que falta (`ensureChunk` → `Generator.generate`, aplica `apuntalar`, los `mods` guardados y las entidades de bloque) y **malla** lo que está sucio (`meshChunk`) si sus **8 vecinos** ya existen. Se genera hasta **R + 1** y se malla hasta **R** | `world.js` (`update`, `ensureChunk`, `neighborsReady`, `meshChunk`) |
| Descarga | Un chunk se borra al pasar de **R + 2** (sus mallas se liberan; **los cambios del jugador viven en `world.mods`**, que no se descarga) | `world.js` (`update`, `disposeMeshes`) |
| **Dónde corre** | **Todo en el hilo principal.** Sin worker de chunks. El presupuesto es `busyBudget = ready ? 6 : 30` ms por cuadro, pero la regla `work > 0` hace que **siempre se procese al menos un chunk**, aunque pase del presupuesto | `game.js` (`update`, ≈ línea 2552) |
| Mallado | `buildChunkGeometry(nb, ambientSky)` es una **función pura** (recibe 9 chunks, devuelve arreglos tipados): caras visibles, oclusión ambiental por vértice, luz del cielo y de lámparas, agua aparte. Después `toGeometry` arma el `BufferGeometry` | `mesher.js` |
| Geometría | Dos mallas por chunk (opaca y agua), material compartido, **sin instancias**, **sin fusión de caras iguales (no es greedy)** | `world.js` |

**Por qué el tope en 12.** No es una decisión arbitraria: es la suma de tres costos que crecen con **R²**. Con los números medidos abajo, **R = 12 son 625 chunks ≈ 3.8 millones de triángulos y ≈ 390 MB**, y cada chunk nuevo cuesta **~13 ms en el hilo principal** (5 de generar + 8 de mallar), lo que a pie ya compite con el cuadro de 16.7 ms y **en vehículo no alcanza** (la avioneta cruza 2.5 chunks por segundo: 60 chunks/s × 13 ms = 0.8 s de trabajo por segundo).

### 1.2 Horizonte lejano que ya existe (`lod.js`, `lodworker.js`, `game.js`)

- **Qué es:** baldosas cuadradas de **128×128 bloques** (`TILE`) con una cuadrícula de columnas: cada celda es una **columna** (tapa + paredes laterales donde la vecina está más abajo), a **paso 4, 8 o 16** según la distancia (`stepFor`: < 384 → 4, < 768 → 8, resto → 16).
- **De dónde salen los datos:** `lodworker.js` llama a `Generator.column(x, z)` (alturas y bioma del **mismo generador por semilla**), colorea por bioma (pasto con su tinte, arena, nieve, roca, basalto, lava, agua más oscura al profundizar, copas de árboles como «manchas» más altas según bioma y azar) y devuelve `Int16Array`/`Float32Array` **transferibles**. **La geometría se arma en el hilo principal** (`buildTile`).
- **Cómo se esconde lo que ya está cerca:** un `discard` en el shader cuando el fragmento cae dentro del cuadrado de los chunks realmente dibujados (`uHide`, calculado con `World.shownRadius`: solo hasta donde **ya no hay huecos**).
- **Atmósfera:** `MeshBasicMaterial` con colores por vértice y **un parche de shader** (`onBeforeCompile`) que multiplica por la luz del día y el color del cielo (`SKY_LIGHT`) y sube la saturación un 14 % para igualar lo cercano; **la niebla de three** (`scene.fog`) la maneja `game.js`: con horizonte activo `near = max(R·16, 0.35·D)` y `far = 0.97·D` (menos con lluvia); **`camera.far = max(1200, 1.35·D)`**; sin horizonte `near = 0.55·R·16`, `far = 0.95·R·16`.
- **Solo en la tierra** (`this.far = dim === 'tierra' ? new FarTerrain(…) : null`).
- **Lo que le falta** (leído del código): (1) **no ve lo que el jugador construyó** (el worker solo conoce el generador, no los `mods`); (2) **los pueblos y estructuras no aparecen** (`Generator.column` no los incluye); (3) **grietas entre niveles**: dos baldosas vecinas con pasos distintos no comparten borde y entre ellas se ve el cielo por las paredes que no llegan; (4) **sin fundido**: el reemplazo es un cambio brusco (la baldosa vieja espera a que llegue la nueva, pero luego se cambia de golpe); (5) **un solo salto de calidad** entre el último chunk real y el paso 4 (≈ 4 bloques por celda); (6) el techo es 1 536 bloques y la precisión de profundidad (ver 1.4) ya empieza a fallar ahí; (7) **la geometría se arma en el hilo principal** (≈ 2–3 ms por baldosa).

### 1.3 Costo medido

Medido en Node sobre una semilla fija, tras calentar (el navegador de escritorio debería quedar en el mismo orden; la diferencia está en la subida a la GPU, que no se midió):

| Concepto | Valor medido |
|---|---|
| **Generar un chunk** (`Generator.generate`) | **≈ 5 ms** (4.6–5.2) |
| **Mallar un chunk** (`buildChunkGeometry`, con los vecinos ya generados; 169 chunks) | **media 8.1 ms, mediana 7.5, p95 13.8, máximo 27.8** |
| Triángulos por chunk | **≈ 6 000** |
| Geometría por chunk (CPU y GPU) | **≈ 550 KB**, más 64 KB de bloques y 3 KB de tinte → **≈ 620 KB por chunk** |
| `Generator.column` (lo que usa el horizonte) | **1.8 µs por columna**: una baldosa de 32×32 celdas sale en **≈ 2 ms** |
| Bloques no vacíos por chunk | 15 779 de 32 768 (48 %) |

**Totales por distancia de vista** (cuadrado de (2R+1)² chunks): **R = 6 → 169 chunks ≈ 1.0 M triángulos y ≈ 105 MB**; **R = 8 → 289 chunks ≈ 1.7 M y ≈ 180 MB**; **R = 10 → 441 ≈ 2.6 M y ≈ 275 MB**; **R = 12 → 625 ≈ 3.8 M y ≈ 390 MB**; R = 16 → 1 089 ≈ 6.5 M y ≈ 675 MB. Es decir, **cada chunk cuesta 6 000 triángulos por 256 m²** (23 triángulos por metro cuadrado), mientras que **el horizonte actual cuesta 0.2 por metro cuadrado a paso 4 y menos de 0.04 a paso 16**.

**Horizonte actual**, calculado con el mismo muestreo (169 baldosas a 768 bloques): **≈ 241 000 triángulos y ≈ 12 MB**; a 1 536: **≈ 365 000 triángulos y ≈ 19 MB**. Es **barato** comparado con los chunks reales.

### 1.4 La precisión de profundidad (el límite técnico del horizonte)

Con un buffer de profundidad de 24 bits, la resolución en el eje Z a la distancia `z` es **≈ z² / (near · 2²⁴)**. Con `near = 0.05` (el de la cámara, `game.js`): a **1 000 bloques ≈ 1.2 m**, a **1 500 ≈ 2.7 m**, a **3 000 ≈ 10.7 m**, a **6 000 ≈ 43 m**. Por eso, **más allá de ≈ 1 500 bloques las baldosas empiezan a «bailar» entre sí** (z-fighting en los bordes y en las paredes). La solución estándar es **partir el rango de profundidad en dos pasadas** (lo lejano con `near = 80`, lo cercano con `near = 0.05`); está en la recomendación (sección 3.6). El `near = 0.05` también explica por qué la distancia de la niebla del juego se hizo con `camera.far = 1 200`.

---

## 2. Opciones para el terreno lejano

**Verificado en la web (no de memoria):**

- **Transvoxel** cose dos resoluciones de un terreno **volumétrico** con celdas de transición propias (512 casos que se reducen a 73 clases), no necesita varios octrees y se ha usado en juegos publicados; sus propios documentos reconocen que las costuras todavía pueden verse como «escalones» chiquitos cuando se combina con fundido de niveles. Fuentes: [Cinevva, «Open world in the browser, parte 9: Transvoxel»](https://app.cinevva.com/blog/2026-02-25-open-world-browser-part-09-transvoxel-first-cut), [Godot Voxel Tools: terreno suave](https://voxel-tools.readthedocs.io/en/latest/smooth_terrain/), [hilo en GameDev.net](https://nene.gamedev.net/forums/topic/708711-required-to-use-multiple-octrees-for-transvoxels).
- **Geometry clipmaps** (Losasso y Hoppe, 2004): anillos de **cuadrículas regulares anidadas**, centradas en el observador, guardadas como vertex buffers y **rellenadas de a poco al moverse**; la versión de GPU Gems 2 pasa la altura a una **textura de vértices** y **instancia** un mismo trozo de malla; cada nivel excepto el más fino es un **anillo hueco**. Funciona para **campos de altura**, no para volúmenes con cuevas. Fuentes: [Hoppe, geometry clipmaps](https://hhoppe.com/proj/geomclipmap/), [GPU Gems 2, cap. 2](https://developer.nvidia.com/gpugems/gpugems2/part-i-geometric-complexity/chapter-2-terrain-rendering-using-gpu-based-geometry), [versión de GPU](https://hhoppe.com/proj/gpugcm/). **No se encontró una implementación en three.js**: habría que escribirla.
- **LOD «por pedazos» (chunked LOD, Ulrich)**: cada baldosa es un árbol cuaternario sin restricciones de borde y **las grietas se tapan con «faldones»** (aletas de geometría que cuelgan de los bordes); los saltos se suavizan con **geomorphing**, que **solo sirve para campos de altura**. Los faldones son lo más simple y se combinan bien con el fundido; el «stitching» da un borde más limpio a más costo. Fuentes: [capítulo de libro sobre LOD de terreno](https://www.yaldex.com/game-programming/0131020099_ch14lev1sec5.html), [artículo de la TUM](https://www.cs.cit.tum.de/fileadmin/w00cfj/cg/Research/Publications/2006/GPU-Friendly_High-Quality_Terrain_Rendering/wscg06.pdf), [GameDev.net: faldones y grietas](https://gamedev.net/forums/topic/376154-terrain-lod-and-skirting/).
- **«Distant Horizons» (mod de otro juego)** es la referencia de qué espera el jugador: el terreno lejano se guarda como **datos de LOD por mundo**, se rellena **en segundo plano con un presupuesto de CPU**, y los datos se toman de lo ya visitado; sus problemas conocidos son **el solape con los chunks reales** y los **huecos mientras genera**. Se cita solo como referencia de comportamiento; **no se copia nada de su diseño ni de su código**. Fuentes: [guía](https://distant-horizons-guide.pages.dev/about), [preguntas frecuentes en CurseForge](https://blog.curseforge.com/distant-horizons-frequently-asked-questions/).
- **Motores voxel en el navegador:** un motor de 2022 **no usa workers** y limita cuántos chunks se mallan por cuadro, pero **otros que lo intentaron con workers reportan tirones cuando el mallado tarda demasiado**; los mejores resultados vienen de **mallar más rápido** (fusionar caras iguales, saltar capas completamente iguales: «≈ 3× más rápido»). Fuente: [r/VoxelGameDev, motor web de código abierto](https://reddit.rtrace.io/r/VoxelGameDev/comments/wny62d/opensource_web_voxel_engine). **Lo que no se encontró:** una referencia concreta de `postMessage` con transferibles para mallas de chunks (es una función estándar del navegador y ya se usa aquí: `lodworker.js` devuelve sus arreglos con `[h.buffer, …]`).

### 2.1 Comparación

| | **A. Columnas jerárquicas** (lo que hay, mejorado) | **B. LOD voxel real** (2×, 4×, 8×… con el mallador) | **C. Heightmap en la GPU** (clipmaps) | **D. Impostores** |
|---|---|---|---|---|
| **Qué dibuja** | Cuadrícula de columnas con tapa y paredes (aspecto de **bloques grandes**, como el juego) | Chunks con vóxeles agrandados (cada celda = 2³, 4³… bloques) | Una malla suave desplazada por una textura de alturas y coloreada por otra | Cartelitos o cajas simples para lo que sobresale (árboles, casas, estructuras) |
| **Calidad lejos** | Buena: respeta la silueta de montañas, costas y bosques; **se ve «vóxel»**, a tono con el juego | La mejor cerca (cuevas, voladizos); **nada que no se vea desde arriba aporta de lejos** | Suave y limpia; **no combina con el estilo de bloques** salvo que se pixele en el shader | Solo complementa |
| **Memoria** | **≈ 190–260 KB por baldosa**, ≈ 34 MB a 1 536 bloques (medido) | Alta: cada chunk de LOD cuesta lo de un chunk real a menos resolución, **y hay que generar los chunks completos para tener qué agrandar** | **Muy baja** (una textura por anillo, ≈ 1 MB por nivel) | Casi nula (instancias) |
| **Tiempo de armado** | **≈ 2 ms de muestreo por baldosa en un worker** (medido); **sin generar chunks** | **≈ 5 ms por chunk generado** + mallado: 36 000 chunks (a 1 536 bloques) = **3 minutos de CPU de worker** | Casi nada por baldosa (alturas muestreadas con `column`), **todo el trabajo va a la GPU** | Trivial |
| **Construcciones del jugador** | Sí, con un **resumen por chunk modificado** (sección 3.3) | Sí, naturalmente (usa los datos completos) | Sí, con un segundo mapa de alturas/colores de lo modificado | Solo las estructuras de la semilla |
| **Saltos entre niveles** | **Faldones + fundido por tramado**; barato | **Transvoxel o celdas de transición**: complejo y las costuras sobreviven al fundido (ver arriba) | **Geomorphing** (suave, pero solo en campos de altura) | Aparecen y desaparecen |
| **Cuevas e inframundo** | **No** (solo la superficie); ver 3.7 | Sí | **No** | No |
| **Atmósfera y `PostFX`** | Material propio con el mismo parche de shader que los chunks: **comparte niebla de altura, tonemapping y bruma** | Igual, pero con mucha más geometría | Igual; un solo material | Igual (material de instancias) |
| **Esfuerzo** | **Bajo–medio** (ya existe) | **Muy alto** | Alto (código nuevo en GLSL, sin base en three.js) | Bajo |
| **Veredicto** | **Recomendada como base** | **No** para la distancia lejana (sí como idea para un anillo de cuevas, que no se pide) | **No ahora**: otra técnica con otro aspecto; se puede reconsiderar si se quisiera terreno suave | **Sí, solo para estructuras y árboles grandes** (Fase 4) |

**Por qué no B (vóxeles reales agrandados):** hacerlo bien exige **generar y guardar los 3D completos de cada chunk lejano** (5 ms cada uno: 36 000 chunks a 1 536 bloques son 3 minutos de CPU de worker y ≈ 2.3 GB de datos antes de agrandarlos), y de lejos **solo se ve la superficie**, que un campo de altura ya da. La excepción es **cerca** (entre el último chunk y los ≈ 400 bloques), donde sí vale tener datos exactos: lo resolvemos con **datos exactos de la parte de arriba de cada columna** (sección 3.3), sin volver a 3D.

---

## 3. Recomendación

**A + D, más sacar el mallado de chunks del hilo principal:** columnas jerárquicas con datos de tres calidades, faldones y fundido, geometría armada en el worker, estructuras como impostores y una segunda pasada de profundidad cuando el alcance pasa de 1 500 bloques.

### 3.1 Estructura de datos

**Jerarquía de baldosas** (todas de **32×32 celdas**, el tamaño crece con la distancia): paso **2, 4, 8, 16, 32 y 64** → baldosas de **64, 128, 256, 512, 1 024 y 2 048** bloques de lado. Cada nivel cubre una banda de distancia (desde el jugador), con **histéresis del 10 %** para que no parpadee al moverse:

| Nivel | Paso | Banda de distancia | Baldosa |
|---|---|---|---|
| L1 | 2 | borde de los chunks reales → 256 | 64 m |
| L2 | 4 | 256 → 512 | 128 m |
| L3 | 8 | 512 → 1 024 | 256 m |
| L4 | 16 | 1 024 → 2 048 | 512 m |
| L5 | 32 | 2 048 → 4 096 | 1 024 m |
| L6 | 64 | 4 096 → 8 192 | 2 048 m |

**Cada baldosa** guarda en el worker: `h: Int16Array((32+2)²)` (alturas con borde de 1), `color: Uint8Array((32+2)²·3)` (color de la tapa; el de las paredes se deriva al armar) y `agua: Uint8Array`. **Datos de tres calidades** (de mejor a peor, y se usa la mejor que exista para esa columna):

1. **Exactos** (`resumen de chunk`): para los chunks **modificados por el jugador** (hay todos en memoria: `World.mods` se carga entero al abrir el mundo) y para el **anillo cercano** (R + 1 hasta ≈ 24 chunks), la altura y el **bloque de arriba** de cada una de las 256 columnas, sacados de **`Generator.generate` + `mods`**: es lo que muestra árboles, casas y obras exactas. **768 B por chunk** (256 × `Int16` + `Uint8` de índice de color con una paleta de ≈ 60 colores). Se calcula **una sola vez** (≈ 5.5 ms en el worker) y se guarda en un `Map` del worker; **al descargar un chunk**, el hilo principal manda el resumen del chunk que ya tenía en memoria (≈ 0.05 ms de recorrer 256 columnas) para no regenerarlo.
2. **Terreno rápido** (`Generator.column`): lo que se hace hoy, a **1.8 µs por columna**, con los colores por bioma de `lodworker.js` (**se conservan**).
3. **Estructuras de la semilla** como **impostores** (Fase 4): `structuresNear(gen, x, z, radio)` ya devuelve las estructuras y los pueblos con sus posiciones sin generar chunks (barato, es una cuadrícula); se dibujan como **cajas instanciadas** (una `InstancedMesh` por tipo de color) con la altura del terreno bajo ellas.

**Archivos a tocar o crear:**

| Archivo | Cambio |
|---|---|
| `src/lod.js` | `FarTerrain` pasa a administrar la **jerarquía** (L1–L6), el **fundido**, la **segunda pasada** de profundidad y las instancias de impostores; arma el `BufferGeometry` solo a partir de arreglos ya hechos |
| `src/lodworker.js` | Recibe `init` (semilla, `genVersion`, **y el tipo de mundo**), `tile`, `mods` (el `Map` de cambios, **por tandas** para no bloquear) y `resumen`; **arma la geometría** (tapas, paredes y faldones) y devuelve arreglos tipados transferibles |
| `src/lodmesh.js` (nuevo) | La función `construirBaldosa(datos)` compartida entre worker y pruebas (`tools/`) |
| `src/lodmaterial.js` (nuevo) | El material de la baldosa con el parche de shader común (niebla, tonemapping, tinte del cielo, tramado de fundido): lo comparte `PostFX` (`PLAN_GRAFICOS.md`) |
| `src/meshworker.js` (nuevo) | El **worker de chunks**: mantiene copias de los bloques, mallla y devuelve `opaque` y `water` (3.5) |
| `src/world.js` | `update` manda a generar y mallar al worker (con la ruta síncrona para lo que está a ≤ 2 chunks del jugador y para los cambios del jugador); `disposeMeshes` avisa al worker |
| `src/game.js` | Los ajustes (3.4), la niebla y `camera.far`, el render en dos pasadas |
| `src/save.js`, `index.html`, `src/ui.js` | `DEFAULT_SETTINGS.horizonte` (`'apagado' · 'cerca' · 'lejos' · 'muylejos'`), `renderDistance` 2–16, indicador de fps; **migración**: `farDistance` viejo → el nivel más cercano |
| `tools/medir-horizonte.mjs` (nuevo) | Mide tiempos y triángulos por nivel (las cifras de la sección 1.3 salen de un script así) |

### 3.2 Armado de baldosas (worker) y saltos entre niveles

- **Orden:** del más cercano al más lejano, de a **una baldosa por mensaje**, **hasta 3 en vuelo** (como hoy) y **presupuesto de ≈ 2 ms de procesamiento de resultado por cuadro** en el hilo principal (solo `new BufferGeometry` y `scene.add`; el resto lo hizo el worker). **Cola de prioridades**: primero lo que está delante de la cámara y los huecos que dejan los chunks reales al descargarse.
- **Faldones contra grietas:** a cada baldosa se le agregan **cuatro franjas verticales** en sus bordes, que bajan **hasta 24 bloques** (o hasta el fondo de la columna vecina más baja posible), con el color de las paredes: tapan la rendija entre dos pasos distintos. Cuestan **4 × 32 quads ≈ 256 triángulos por baldosa** (≈ 6 %).
- **Fundido:** el reemplazo de un nivel por otro **no es instantáneo**: la baldosa nueva se dibuja **encima** de la vieja durante **0.5 s** con un **tramado ordenado** (`discard` según una matriz de Bayer 4×4 y un uniforme `uFade`), sin transparencia (no ordena ni escribe profundidad extra). Es el mismo patrón de «pantalla en rejilla» que se usa para fundir el LOD en los motores de terreno; funciona con la niebla y con el `PostFX` porque la pasada es opaca.
- **Con los chunks reales:** se mantiene el `discard` del cuadrado `uHide`, pero con **un solape de 8 bloques y el borde tramado** para que no se note el escalón cuando el chunk real aparece. Las baldosas L1 se dibujan **0.3 bloques más abajo** que los chunks para no pelear por la profundidad en el solape.

### 3.3 Construcciones del jugador y estructuras

1. **Al abrir el mundo** el hilo principal manda `mods` (el `Map` de `World.mods`, por tandas de 50 chunks) y el worker calcula en segundo plano los resúmenes de **todos los chunks modificados** (**≈ 2.7 s de CPU de worker por cada 500 chunks**, sin bloquear). Hasta que estén, esas columnas usan el terreno rápido.
2. **Al descargar un chunk** el hilo principal manda su resumen ya calculado (ver arriba) y marca las baldosas que lo contienen como **sucias** (se vuelven a armar a baja prioridad). **Al cambiar bloques**, no hace nada: lo lejano no se entera hasta que el chunk se descarga (aceptable: lo lejano se actualiza al salir de la zona).
3. **Árboles y casas del terreno cercano** (L1, hasta ≈ 256 bloques): salen de los **datos exactos** del anillo cercano; las copas ya no son manchas de azar sino **las copas reales**.
4. **Estructuras y pueblos de la semilla** (Fase 4): cajas con el **color del techo y de la pared de la estructura** (la paleta ya está en `estructuras.js`/`pueblogen.js`), solo **dentro de 1 536 bloques** (más allá sería ruido). Tope de **600 instancias**.

### 3.4 Niveles de ajuste y costo esperado

El ajuste del jugador es **«Horizonte: apagado / cerca / lejos / muy lejos»** y, aparte, **«Distancia de vista»** (chunks reales, 2–16 con **un indicador de fps** y un aviso desde 10: «pesado»). Cifras **medidas con el muestreo real del generador** (triángulos y memoria de las baldosas; fps **estimados**; chunks reales con R = 6):

| Nivel | Distancia | Baldosas | Triángulos | Memoria | CPU de worker (muestreo) | Costo en cuadro (estimación 📏) |
|---|---|---|---|---|---|---|
| **apagado** | 0 | 0 | 0 | 0 | 0 | 0 |
| **cerca** | **768** | 128 | **≈ 450 000** | **≈ 23 MB** | ≈ 0.25 s | **bajo** (menos de la mitad de lo que ya cuestan los 169 chunks) |
| **lejos** | **1 536** | 176 | **≈ 660 000** | **≈ 34 MB** | ≈ 0.35 s | **bajo–medio** |
| **muy lejos** | **3 072** | 224 | **≈ 880 000** | **≈ 45 MB** | ≈ 0.45 s | **medio**; requiere la segunda pasada de profundidad |
| extremo (solo «Personalizado») | 6 144 | 272 | ≈ 1.1 M | ≈ 57 MB | ≈ 0.5 s | **medio–alto** |

(Hoy, «768» son **241 000 triángulos y 12 MB** con pasos 4/8/16; la nueva banda de **paso 2** es la que sube el costo a 450 000 y la que da la «buena definición» pedida.) **Con fusión de celdas planas** (océano, llanos y lagos, que son la mayoría) los triángulos bajan **≈ 30–40 % (estimación)**: es una mejora opcional de la Fase 1.

**Niebla** (en `game.js`): `near = 0.60·D` y `far = 0.98·D` (hoy 0.35 y 0.97): **más nítido de cerca y desvanecido solo en el último tramo**, con el color de la niebla mezclado hacia el color del horizonte del cielo. Con la **niebla de altura** de `PLAN_GRAFICOS.md` (#3) el color depende de la altura de cada punto, así las montañas lejanas se tiñen de azul y los valles tienen bruma.

### 3.5 Worker de chunks y presupuesto por cuadro

El **mayor cambio para poder subir la distancia** y evitar tirones al caminar. **Meta: ≤ 1.5 ms por cuadro en el hilo principal por concepto de chunks.**

- **`meshworker.js`** (1–3 workers según `navigator.hardwareConcurrency − 2`, mínimo 1): guarda **copias de los bloques de cada chunk** (64 KB; ≈ 40 MB con R = 12) y recibe: (a) `gen {cx, cz}` → **genera** (5 ms) y devuelve `blocks` y `tinte` **por transferencia** (el hilo principal aplica `apuntalar`, los `mods` y las entidades de bloque, que son baratas); (b) `mesh {cx, cz, ambient}` → **malla** con los 8 vecinos que ya tiene (8 ms) y devuelve `opaque` y `water` (arreglos tipados transferibles); (c) `edit` (cambios del jugador) y `drop` (chunk descargado).
- **Hilo principal:** pide las generaciones y mallados **en orden de distancia**, con un máximo de **6 trabajos en vuelo por worker**, y al recibirlos hace **solo** `new BufferGeometry` + `scene.add` (**≈ 0.3–0.8 ms por chunk**, que es la subida a la GPU), con un tope de **3 chunks por cuadro** (≈ 2 ms). **La regla de «al menos un chunk por cuadro» desaparece.**
- **Lo que sigue en el hilo principal (ruta síncrona):** **los chunks a ≤ 2 del jugador** (para que se pueda jugar al instante: `readyAt`), **los mallados por edición del jugador** (romper o poner un bloque **tiene que verse en el mismo cuadro**) y el **respaldo si el worker no existe**.
- **Rendimiento esperado (estimación 📏):** **de 13 ms a ≈ 1 ms** de costo del hilo principal por chunk nuevo; con 1 worker, **≈ 75 chunks por segundo** (5 + 8 ms), de sobra para R = 12 al correr y para volar baja. La carga inicial de R = 12 (625 chunks) pasa de **un par de segundos de tirones** a **≈ 8 s sin bloquear**.
- **Costo de memoria:** **+40 MB** (las copias de los bloques en el worker) con R = 12.
- **Seguridad de datos:** el hilo principal sigue siendo **el dueño** de los bloques: el worker trabaja con copias y **nunca** escribe en `World.mods`.

### 3.6 Atmósfera, `PostFX` y segunda pasada de profundidad

- **Material compartido:** las baldosas usan el mismo **parche de shader** que `makeMaterial` de los chunks (tonemapping propio, corrección de color por hora, **niebla de altura** y **dispersión solar**) en vez del `MeshBasicMaterial` actual: **un solo `atmosfera.glsl`** incluido por ambos materiales. Así, cuando entre `PostFX` (bloom, SMAA…), lo lejano **recibe lo mismo** sin trabajo aparte (es geometría opaca; no hay que tocar la cadena de efectos).
- **Dos pasadas** (obligatorias desde 1 500 bloques): (1) cielo (`renderOrder -10`); (2) **terreno lejano** con una cámara de `near = 80` y `far = 1.35·D`; **`clearDepth()`**; (3) **lo cercano** (chunks reales, entidades, agua) con `near = 0.05` y `far = 1 200`. Con el `EffectComposer` de `PostFX` son **dos `RenderPass`** (el segundo con `clearDepth: true`). **Costo:** una pasada más de rasterizado de la geometría lejana, ya contada arriba; el efecto es que **la profundidad lejana deja de bailar** (con `near = 80` a 3 000 bloques la resolución es de **≈ 7 mm**, contra 10 m de hoy).
- **Cielo:** el sol y la luna están a **1 080 bloques** (`sky.js`, `position.copy(dir).multiplyScalar(1080)`) y se dibujan antes y sin escribir profundidad; **no se mueven**. Con la pasada del horizonte los cerros lejanos **se dibujan encima de los astros** (correcto). Hay que **revisar `camera.far = max(1200, …)`**, que con la pasada cercana queda fijo en 1 200.
- **Agua:** el agua lejana es la tapa de la baldosa con un color más oscuro por profundidad (hoy); con el agua de `PLAN_GRAFICOS.md` (Fresnel) se **comparte el color base** pero no la reflexión (de lejos no se nota).

### 3.6.1 Qué hace en «Bajo»

**Bajo es igual que hoy en costo** (`COLA_DE_TRABAJO.md`, v12.0: «Bajo es idéntico a hoy»): **distancia de vista 6, horizonte «cerca» con el esquema viejo de pasos 4/8/16** (≈ 241 000 triángulos, 12 MB), sin paso 2, sin datos exactos, sin impostores, sin segunda pasada. **Sí entran en «Bajo»**, porque no cuestan nada o resuelven errores: **la geometría armada en el worker**, **los faldones** (+6 % de triángulos), **el worker de chunks** (baja el hilo principal) y el **fundido** (solo en la transición). **Medio:** R 8 y «cerca» con paso 2 y datos exactos de lo modificado. **Alto:** R 10, «lejos» con impostores y fundido. **Ultra:** R 12–14, «muy lejos» con la segunda pasada. Cada preset es solo un valor de `renderDistance` y `horizonte`, y **el jugador los puede cambiar a mano** («Personalizado»).

### 3.7 Mundo compacto, cuevas, inframundo y cielo

- **Mundo compacto** (`COLA_DE_TRABAJO.md` §4, v11.13.0: biomas 2–2.5 veces más chicos): el worker del horizonte **debe construir el mismo `Generator`** del mundo: hay que agregar **el tipo de mundo (Normal/Compacto) al mensaje `init`** (hoy solo lleva `seed` y `genVersion`); si no, el horizonte mostraría el mundo equivocado. En un mundo compacto el horizonte es **más interesante** (más variedad por vista) y la misma semilla da menos terreno «vacío»; **si el mundo compacto tiene borde** (decisión de esa tanda), el horizonte **no dibuja más allá del borde**.
- **Cuevas y subterráneo:** el horizonte es **de superficie**: con el jugador bajo tierra (`env.cave > 0.6`, ya existe) **se oculta** y la niebla se cierra (mismo criterio que la niebla de cueva de hoy); los chunks reales siguen con su R.
- **Inframundo** (`infragen.js`): hoy **no hay** horizonte (`dim === 'tierra'` solamente). Fase 5: un horizonte propio con **`columnInfra`** (suelo, techo y mar de lava): se dibuja el suelo y el mar de lava como columnas, **el techo como una sola losa** y la niebla roja de `game.js` (`0.3, 0.08, 0.03`). Es barato (el mismo código con otra función de altura) y da el «vacío rojo» que cuenta el lugar.
- **Cielo** (`cielogen.js`, islas flotantes): **sin horizonte** (las islas tienen cara de abajo; un campo de altura no las representa). Se deja la niebla corta de hoy.

---

## 4. Fases de construcción

| # | Fase | Tamaño | Qué incluye | Qué medir (antes y después) |
|---|---|---|---|---|
| **0** | **Línea base** | **S** | `tools/medir-horizonte.mjs` (las cifras de 1.3 en una herramienta) y un **panel de depuración** (F3) con ms por cuadro, ms por chunk, triángulos y memoria (`renderer.info`) | Las cifras de 1.3 **en el navegador**: fps medios y mínimos (1 % bajo) con R = 4, 6, 8, 10 y 12; **tiros por segundo** al caminar, correr y en vehículo |
| **1** | **Horizonte por niveles** | **M** | Jerarquía L1–L6, **geometría armada en el worker**, **faldones**, **fundido**, ajustes «apagado/cerca/lejos/muy lejos» con migración de `farDistance`, niebla nueva | Triángulos y MB por nivel (deben calzar con 3.4 ±15 %); **sin grietas** (capturas en dos posiciones con pasos distintos); **sin saltos** al caminar 60 s en línea recta; fps con «cerca» no peor que hoy en «Bajo» |
| **2** | **Worker de chunks** | **L** | `meshworker.js`, ruta síncrona para lo cercano y lo editado, rango 2–16, indicador de fps | **Tirones**: la mayor tarea larga del hilo principal (`PerformanceObserver` `longtask`) **< 20 ms** corriendo, y p99 del tiempo de cuadro; carga inicial de R = 12; **que un bloque roto o puesto se vea en el mismo cuadro**; memoria (+40 MB esperados) |
| **3** | **Lo construido** | **M** | Resúmenes de chunks modificados, datos exactos del anillo cercano, el mensaje `mods` por tandas | Que **se vea la casa propia** desde 600 bloques; CPU de worker (≈ 2.7 s por 500 chunks) y que **no se note** en el cuadro; mundos viejos cargan igual |
| **4** | **Estructuras y atmósfera** | **M** | Impostores instanciados, material compartido con `atmosfera.glsl`, **segunda pasada de profundidad**, niebla de altura | Sin z-fighting a 3 000 bloques; 600 instancias ≈ 1 llamada de dibujo por tipo; que `PostFX` (bloom, SMAA) **funcione igual** con y sin horizonte |
| **5** | **Mundos y dimensiones** | **S–M** | Tipo de mundo en `init`, ocultar bajo tierra, horizonte del inframundo, cielo sin horizonte | Mundo compacto y Normal con la misma semilla; que el horizonte coincida con los chunks al acercarse |
| **6** | **Cierre** | **S** | Presets Bajo/Medio/Alto/Ultra, `BALANCE.md`/`CHANGELOG` con las cifras, `ARBOL_CONOCIMIENTO.md` | Bajo **idéntico a hoy** en fps y memoria (la regla de la v12.0) |

**Orden sugerido:** 0 → 1 → 2 → 3 → 4 → 5 → 6. **Las fases 1 y 2 son las que se sienten** (más lejos y sin tirones); la 3 y la 4 son las que dan «ver las casas y los pueblos». **Antes de publicar:** la fase 0 en dos máquinas distintas (una portátil sin GPU dedicada) para fijar los presets con datos y no con estimaciones.

**Qué medir siempre** (en el panel F3 y en el CHANGELOG): **fps medios y 1 % más bajos**, **ms por cuadro (p50, p95, p99)**, **la mayor tarea larga del hilo principal**, **triángulos** y **llamadas de dibujo** (`renderer.info.render`), **memoria** (`renderer.info.memory` y `performance.memory` donde exista), **chunks por segundo** al correr y en vehículo, **cuántas veces se ve el cielo por una grieta** (capturas) y **cuántas baldosas «saltan»** (conteo de cambios de nivel por minuto).

---

## 5. Lo que falta decidir o confirmar

1. **Alcance de «muy lejos»**: 3 072 o 4 096 bloques. Con 3 072 el costo es medio y no hay problema de profundidad con la segunda pasada; con 4 096 se suma un nivel más. **Recomiendo 3 072** y dejar 6 144 solo en «Personalizado».
2. **Fusión de celdas planas** (−30–40 % de triángulos): opcional en la Fase 1; conviene decidirla con la medición de la Fase 0.
3. **Si el mundo compacto tiene borde** (para no dibujar más allá).
4. **Qué pasa en el modo foto** (`foto.js`): cámara libre que se va lejos: el horizonte sigue al jugador, no a la cámara; en la Fase 1 hay que decidir si sigue a la cámara.
5. **No se midió la GPU**: todo costo de dibujo es estimación hasta la fase 0 en el navegador.
