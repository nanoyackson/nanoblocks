# Plan v13.3.0 — Que el mundo se vea natural (cuevas masivas, estructuras, pueblos, caminos, ríos y mar)

Investigación de solo lectura sobre `master` en la v13.2.2 (generador 23). Pedido de Isaac: «mejorar la generación de mundo, estructuras y cuevas se integren mejor con el mundo»; ve «algunos errores de generación» pero no mandó capturas. Todo se midió con scripts de Node (copias en `docs/revisiones/scripts_integracion/`) que generan trozos reales con `Generator(semilla, 23)`; los prototipos se probaron en una copia en la carpeta temporal, **sin tocar `src/`**. Nada de esto está en el juego todavía.

**Cómo leer las cifras.** «Por 1000 trozos» es por cada 1000 trozos de 16×16 del mundo (hay ≈ 9,5 estructuras y 0,21 pueblos por cada 1000 trozos). Semillas 101, 202, 303, 404, 505, 606, 707, 808, 909, 1010 (estructuras, terreno, caminos), 1111-1414 (segunda pasada de causas) y 101-808 (integridad); área ±2400 bloques; 8 537 estructuras contadas en el área, **2 160 generadas y medidas** (81 tipos, hasta 3 por tipo y semilla) más 599 en una segunda pasada de causas, y 84 pueblos (60 + 24). Se midió geometría, no se vio a ojo: faltan las capturas de Isaac para confirmar cuáles son *sus* errores.

## 0. Cuevas masivas (I-CM) — prioridad 1 de Isaac

Pedido: «cuevas masivas, que se conecten una con otra, prácticamente infinitas de explorar». Se diseña una versión propia (nombres ticos, sin copiar algoritmos ni nombres de otro juego): **Salón** (caverna grande), **Vena** (túnel largo), **Sima** (pozo vertical, palabra de la espeleología tica) y **Red Honda** (el sistema conectado).

### 0.1 Diagnóstico del generador 23 (flood fill de aire subterráneo)

Ventana de 512×512 (1 024 trozos) alrededor del punto de inicio, 6 semillas (101-606); aire = celda vacía bajo la superficie (`y < h-3`), conectividad por caras. Script `scripts_integracion/caves.mjs`.

| Medida | Resultado (rango de las 6 semillas) |
|---|---|
| Aire en todo el volumen subterráneo | **4,2 – 6,1 %** |
| Aire por banda de altura | y 1-10: 0 % · 11-20: 2,7-5,8 % · 21-30: 8-13 % · **31-40: 11,7-19,3 %** · **41-50: 11,9-16,2 %** · 51-60: ≈ 5 % · 61-80: ≈ 5,5 % |
| Sistemas de cueva (aire conectado) | 6 051 – 6 764 por ventana; casi todos son bolsas chicas |
| El sistema mayor | **371 mil – 975 mil celdas = 31 – 62 % de todo el aire**; ocupa 346-505 × 366-512 bloques (casi toda la ventana) y 76-89 de alto |
| Qué tan lejos se llega caminando sin cavar | **1 344 – 2 019 pasos** de punta a punta del sistema mayor (la ventana corta el resto) |
| Sistemas de más de 2 000 celdas / de más de 20 000 | 20-31 / 6-9 |
| Salas «núcleo» (hueco con 5 × 5 × 5 libres) de ≥ 150 celdas | 30-36 por ventana; con ≥ 20 de ancho 28-34; con ≥ 40 de ancho **15-18** (están fundidas con túneles anchos, así que sobreestiman); alto máximo 39-43 |
| Tiempo del generador | 5-9 ms por trozo (6-8 en Node limpio) |

**Lectura:** la conectividad que pide Isaac **ya existe** (un solo sistema domina y cruza la ventana entera), pero es una red de espagueti angosto: el volumen total es chico (≈ 5 %), casi no hay salones de verdad (la sala típica mide 20-40 de ancho y la mayor altura es de uniones) y no hay nada diseñado: la red depende del azar del ruido. Lo que falta es **volumen y grandeza**, y que la conectividad sea una garantía y no una casualidad.

### 0.2 Propuesta de generador 24 (prototipo medido)

- **Red por regiones, no por ruido.** Una cuadrícula de regiones de 96 × 96 bloques; cada una tiene un **nodo** (posición y profundidad 26-46, todo de `hash3`). Cada nodo se une por una **Vena** garantizada con su vecino del este y del sur (y con el diagonal en 30 % de los casos). Las venas son túneles de radio 2,6-4,4 con curvas, subidas y bajadas y ensanches ocasionales. Así toda región queda unida con sus vecinas **sin depender del ruido**: el grafo de la Red Honda es conexo por construcción.
- **Salones.** El 60 % de los nodos son salón: elipsoide de **40-96 de ancho y 18-46 de alto**, borde rugoso (ruido), pilares en la mitad de ellos, y los lagos y la lava de siempre: el agua por cuencas y la lava por zonas (generador 23) rellenan el fondo del salón, así que abajo hay lava y a media altura lagos.
- **Simas.** Un 40 % de los salones suben un pozo de radio ≈ 3,5 hasta la superficie (boca), con la misma exclusión de obras de I1 (nunca dentro de un pueblo ni de una estructura, ni sobre el mar).
- **Reglas de convivencia:** techo del salón o de la vena a **≥ 8 bloques** bajo el suelo (≥ 14 bajo el fondo del mar o de un lago, y nada pegado a la costa: ya existe `nearSea`); piso ≥ y 11 (la losa de roca y el fondo de lava se respetan); el relleno de agua y lava se hace **después** del cavado, con las mismas reglas de v22/v23; los sitios kársticos y la Caverna del Rey se construyen después y pisan lo que haya (cada uno limpia su caja); I1 sella bajo las obras de superficie; los salones quedan **bajo** los cimientos, a ≥ 8 de profundidad.
- Todo sale de `hash3`/Simplex con la semilla (nada de `Math.random`). La máscara de cada trozo se arma una vez por trozo recorriendo solo el volumen de cada salón o vena que lo toca (no 3 ruidos por celda).

**Prototipo (semillas 101 y 202, mismo flood fill):**

| | Gen 23 | Prototipo gen 24 |
|---|---|---|
| Aire subterráneo | 4,7 / 4,2 % | **8,1 / 7,7 %** (banda 31-40: 28-30 %) |
| Sistema mayor | 57 % / 43 % del aire | **86 % / 92 %**, ocupa los 512 × 512 completos |
| Camino a pie punta a punta | 1 881 / 1 724 | 1 410 / 1 340 (más directo, no más corto en volumen) |
| Salas núcleo ≥ 40 de ancho | 17 / 15 | **25 / 25**, con altura hasta 56-62 |
| Fugas de agua / lava / agua colgando (1 semilla) | 3 / 0 / 0 | 3 / 0 / 0 |

La proporción de salones (60 %), su tamaño y el 0,3 de diagonales son números de ajuste (`CMS`, radios, `RC`); el prototipo es una base y no está pulido (sin decoración propia, sin salones raros, sin segunda capa).

### 0.3 Costo

- **Tiempo por trozo:** **+0,5 a +1,2 ms** (≈ +10-15 %) en trozo normal y de pueblo, medido en Node con la máquina ocupada; sigue dentro de la meta ≤ 12 ms salvo el trozo de pueblo más cargado (11,8-12,3 ms con todo el paquete I1-I4 encendido). Si hiciera falta, la máscara se guarda por trozo vecino y la red se puede cambiar a regiones de 128.
- **Memoria:** una máscara de 32 KB por trozo mientras se genera (se descarta); caché de nodos y venas por región, despreciable.
- **Dibujo (cara bajo tierra):** +16-20 % de caras visibles en trozos subterráneos (≈ +150 caras por trozo, 750 → 900 en promedio). Es poco frente a la superficie, pero con salones de 90 de ancho **el cuello de botella será ver mucha pared a la vez**: la distancia de dibujo bajo tierra y la neblina de profundidad (v13.2.0) lo contienen; hay que revisar con un salón grande en el navegador antes de cerrar.
- **Multijugador:** sin cambios en la red (cada máquina genera igual con `{seed, genVersion}`); lo único nuevo es que los mobs de cueva los genera el anfitrión sobre más volumen: hay que revisar el tope de `trySpawnCave` (`entities.js:~1048`) para que un salón grande no llene de murciélagos.
- **Mundos guardados:** solo mundos nuevos (generador 24); los de 23 o menos salen idénticos.
- **Perderse o marearse:** más volumen y salones grandes sin referencias desorientan. Ayudas propuestas: **hitos** (un cairn de piedra con farol y una placa «Salón …» en cada cruce de venas), **nombre del salón** en el cartel de entrada y en la libreta, y mostrar en el minimapa solo lo ya recorrido bajo tierra («mapa de cueva») sin revelar lo nuevo; la profundidad en pantalla ya existe desde la v13.2.0.
- **Fauna:** la fauna de la v13.1.2 (cangrejo ciego, grillo, escarabajo) y los murciélagos siguen por región; con salones grandes conviene que cada salón tenga su «dueño» (un jefe pequeño o una colonia) y tope por salón.

### 0.4 Fases

- **CM1 — Red Honda y Salones** (3 días): promover el prototipo (parámetros, pilares, lagos y lava, relieve del piso), prueba nueva en `tools/` con flood fill (≥ 85 % del aire en un solo sistema, aire 7-10 %, tiempo ≤ 12 ms) y huella de mundos 21/22/23 idénticos.
- **CM2 — Simas, hitos y ayudas** (2 días): bocas a la superficie con exclusión de obras (depende de I1), hitos y placas, mapa de cueva en el minimapa, tope de fauna por salón.
- **CM3 — Variedad** (2-3 días): salones con carácter (de cristal, de musgo, de goteo, de lava) reutilizando las zonas que ya existen, una segunda capa hondo («La Hondura», y 11-26) con ríos de lava, y integración con los sitios kársticos (que salgan de un salón en vez de aparecer sueltos).
- **CM4 — C2 del plan de cuevas** (vetas grandes, diamante en salones, re-balanceo de economía con Isaac): solo si Isaac lo confirma.

### 0.5 Qué preguntarle a Isaac sobre las cuevas

1. **¿Cuánto más grandes?** Hoy hay ≈ 5 % de aire. El prototipo da ≈ 8 % con salones de 40-96 de ancho. ¿Así, el doble (salones de hasta 130 de ancho y más cantidad), o más moderado?
2. **¿Bocas gigantes a la superficie?** Hoy son simas de 7 bloques de ancho. ¿Quiere también agujeros enormes (20-30 de ancho, visibles desde lejos) en el campo?
3. **¿Entra ya lo de diamantes y vetas grandes (C2)?** Cambia la economía y hay que re-balancearla.
4. **¿Cómo prefiere orientarse?** Hitos con farol y nombre, un mapa de cueva que se va dibujando, o las dos cosas.
5. **¿Debe haber oscuridad total o cristales que alumbren los salones grandes?**

## 1. Veredicto en una línea

Lo que Isaac ve como «errores» lo más probable es que venga de **las bocas de cueva de la v13.1 (generador 22)**, que se abren debajo de casas y estructuras, y de **ríos y pendientes** que los pueblos y caminos no manejan (calles cortadas, caminos que tapan el río, casas en barrancos). Los bordes de trozo **no** son el problema: el congelamiento de la 13.2.3 era una sola función (las placas de los rótulos del camino con coordenadas del mundo) y hoy hay 0 casos en 31 153 trozos.

## 2. Lo que está bien (medido, no hace falta tocarlo)

| Revisión | Resultado |
|---|---|
| Datos de bloque con coordenadas fuera del trozo (la clase del fallo de `world.js:526`) | **0** en 9 743 entradas / 31 153 trozos (8 mundos) |
| Un trozo sale distinto según el orden en que se generan los vecinos | **0 de 480** (otro generador, orden mezclado) |
| Estructuras de `estructuras.js` que gastan distinta cantidad de azar según el trozo (costura en el borde) | **0 de 591** |
| Excepciones al generar | 0 |
| Árboles cortados en el borde del trozo | No: el margen de 3 (`worldgen.js:109`) y el de 13 (`worldgen2.js decorate4`) cubren las copas. Copas sin tronco: 10 % de las copas, pero son fragmentos chicos (≈ 7 hojas en promedio) |

Un solo hallazgo menor de esta zona: **0,7 % de las entradas** (72 de 9 743: placas 52, puertas 18, cofres 2) quedan sin sus datos porque otra construcción pisó el bloque. `ensureChunk` (`world.js:535`) las salta en silencio; hoy no hay aviso.

## 3. Defectos, de más a menos frecuentes y visibles

| # | Defecto | Frecuencia | Dónde y por qué |
|---|---|---|---|
| D1 | **Casas, estructuras y calles sobre una boca de cueva.** El piso o los cimientos quedan con un vacío debajo; la boca (un hoyo de ~28 columnas) aparece al lado o dentro del pueblo | **72 % de las estructuras** (6,8 por 1000 trozos) y **24 de 24 pueblos** (≈ 360 columnas de piso colgando por pueblo; 7 % de las celdas de calle con aire a 2 bloques) | `worldgen2.js:22`: `BOCA_CELDA = 16, BOCA_PROB = 0.9` (el comentario de `:177` dice «celda de 40»). `bocaIn` (`:178-196`) no excluye pueblos ni estructuras y se cava **antes** (`worldgen.js:114-123`). Los cimientos solo llegan hasta `column().h` (`estructuras.js:72`, `pueblogen.js:131-140`). **Es regresión de la v13.1:** con generador 21 son 3 219 columnas colgando sobre boca (estructuras) y 970 (pueblos); con 23, 14 403 y 3 575 (**×4,5 y ×3,7**) |
| D2 | **Caminos que cruzan el río sin puente**: tapan el cauce con un dique de tierra | **94 % de los cruces**: 1 027 diques contra 96 puentes en 467 tramos (146 mil bloques); 1,14 diques por 1000 trozos; 7 por 1000 bloques de camino | `carreteras.js:47` marca «agua» con `h < SEA-3`, pero el fondo del río es justo `SEA-3 = 59` (`worldgen.js:59-61`): nunca se considera agua. El relleno de `:174` entierra el cauce |
| D3 | **Calles de pueblo cortadas por el río o la laguna** (la calle se corta y sigue al otro lado) | **13 de 16 pueblos con calles (81 %)** tienen al menos un corte; 6-8 % de las celdas de calle | `pueblo6.js:134` `if (h < SEA - 1) continue;` (se salta la celda; no hay puente). El caserío igual (`pueblogen.js:122`) |
| D4 | **Casas y pueblos en pendiente o junto a barranco** | **26 % de los edificios** con desnivel ≥ 4 bajo su huella (14 % ≥ 7); **23 % de las celdas alrededor** con terreno ≥ 4 más alto que el piso (pared de corte vertical); 5 % con cimiento alto; calles con **23 escalones ≥ 2 por 1000 celdas**; 16 % de los edificios tocan la banda del río y 5 % están más de 25 % en agua. Estructuras: **29 %** con desnivel ≥ 8 dentro del 70 % de su radio (2,7 por 1000 trozos): hacienda 93 %, sanatorio 86 %, capital 83 %, coronado 82 %, ruinas 80 %, estadio nacional 75 %; 20 % con río adentro (1,9 por 1000 trozos) | `villageAt` (`pueblogen.js:25`) revisa solo 6 puntos a ≤ 20 bloques con tolerancia 7, pero el pueblo mide 90-108 de radio (desnivel medio dentro de la caja del pueblo: **42 bloques**). `flat()` (`estructuras.js:190`) revisa 8 puntos en un anillo. No hay terraza ni talud: la casa se corta o se levanta con pared |
| D5 | **Bromelias flotando** sobre el bosque nuboso | **227 por 1000 trozos** (de 30 a 575 por 784 trozos, según cuánto nuboso haya) | `worldgen2.js:665` las pone en `top + 3` y la copa solo llega a `top + 2` en el centro |
| D6 | **Cañones en vez de ríos**: el río es una zanja con pared | **50 %** de las columnas del cauce tienen una pared ≥ 8 a ≤ 8 bloques; **25 %** ≥ 14 (garganta). El cauce central ocupa 2,4 % del área | `worldgen.js:59-61`: el valle crece con `k²` y no se ensancha cuando el terreno es alto. Las playas quedan dentro del cañón |
| D7 | **Caminos que pasan por encima de otras estructuras** (la estructura pisa el camino) | **46 % de los tramos** (213 de 467) cruzan la huella de una estructura que no es su destino: feria de pueblo 61, carreta 18, cementerio de pueblo 15, feria 12, canopy 10 | Los caminos se dibujan antes (`worldgen.js:119-123`) y `makeSegment` (`carreteras.js:28`) no esquiva nada. También: 1 133 rachas de terraplén ≥ 4, 382 de trinchera ≥ 4 y 2 618 saltos ≥ 2 en total |
| D8 | **Árboles y copas con las obras** | 69 % de las estructuras tienen ≥ 1 trozo de copa suelto (2,1 por estructura; 6,9 por pueblo → ≈ 20 por 1000 trozos). **19 %** de las estructuras (≈ 1,8 por 1000 trozos) tienen ≥ 3 columnas con árbol dentro de su huella (fortín, capital, ruinas, ujarras, catarata…) | `estructuras.js:1118` `clearTrees(T.clearR \|\| Math.min(T.R+3, 14))`: tope de 14; solo borra dentro del radio, así que las copas de árboles de afuera quedan sin tronco |
| D9 | **Fugas de agua y lava** junto a lo construido o a la costa | agua **6,6** por 1000 trozos (2,8 junto al mar), lava **1,4**; 1,5 % de las estructuras (carara 33 %, braulio 30 %, irazú 42 %) y 3 de 24 pueblos | Bocas junto al agua: **30,6 por 1000 trozos**; también 449 bocas por 1000 trozos en total (13 columnas por trozo = 5 % del suelo) |
| D10 | **Estructuras que dibujan más allá de su radio** y quedan recortadas en línea recta según cómo caiga el trozo | 4 tipos de ~90: irazú (R 32 → 34), san Lucas (22 → 26), cueva del Venado (30 → 35), Marino Ballena (62 → 75). ≈ 0,25 por 1000 trozos | `estructuras.js:1116` solo pide construir si el centro del trozo está a ≤ `R+9`: lo que pase de `R+1` puede quedar sin dibujar |
| D11 | **Costuras de bioma** | Playa↔tierra con escalón ≥ 3 en 34-42 % de los bordes (pared detrás de la playa); bosque↔llanura sin escalón pero con salto de densidad de árboles ×8,6 (0,03 → 0,0035, `worldgen.js plantLife`): borde duro | Los biomas son umbrales de ruido continuo (`worldgen.js:67-75`); no hay mezcla |

**No medible con scripts estáticos:** la **Mina de Abangares** se construye en partida (`minaoro.js:45`); `sePuede` (`:17`) solo mira líquidos en la línea central cada 2 bloques, así que podría abrirse a una cueva (no se vio un caso; conviene una prueba en navegador). **Caverna del Rey** y los sitios kársticos están hechos para ir bajo tierra (100 % «enterrados» en la medición, a propósito); caverna del Rey: río en 37 %, pendiente ≥ 8 en 67 %.

## 3b. Defectos añadidos por Isaac (D12-D14)

**D12 · Ríos que parten las montañas en un cañón recto.** Medido con `column()` en 3 semillas (2 400 × 2 400 bloques, paso 2, columnas del cauce `rio < 0.012` fuera del mar; script `scripts_integracion/riv.mjs`):

| Medida | Resultado |
|---|---|
| Pared a 12 bloques del cauce (máximo de 8 direcciones) | mediana **10**, p75 16, **p90 25**, máximo **60** bloques |
| Cauce con pared ≥ 10 / ≥ 20 / ≥ 30 | **54 %** / **17 %** / **8 %** |
| Cauce con pared ≥ 20 **y** subida ≥ 6 en solo 3 bloques (vertical) | **11 %** |
| Frecuencia del cañón alto (pared ≥ 20) | ≈ 3,7 trozos de cauce por cada 1000 trozos del mundo |

Dónde se decide: `worldgen.js:57-61`. La línea del río es donde el ruido `nRiver` cruza por cero (`:57`, escala 0,0025) y **no mira la altura del terreno**; luego el valle se hunde con `h = (SEA-3) + (h-(SEA-3))*(k*k)` (`:59-61`), así que en una montaña de 100 el cauce queda 40 más abajo con la pared saliendo en unos pocos bloques. `shapeColumn` (`worldgen2.js:67`) y los cerros (`:~118`) solo atenúan el levantamiento con el mismo factor `k²`.

**D13 · Caminos y calles que parten montañas.**
- Caminos (`roads` en 4 semillas, 61 mil bloques): solo el **3 %** de los puntos pasa por terreno alto (> 92), pero ahí el corte es un tajo vertical: trincheras ≥ 8 → **0,54 por 1000 bloques de camino**, ≥ 12 → 0,21, máximo **24** de profundidad; terraplenes ≥ 8 → 0,83, ≥ 12 → 0,23; **17 saltos de ≥ 2 por 1000 bloques** (escalones que un vehículo no sube).
- Dónde se decide: la curva es una Bézier con **un solo desvío lateral al azar** (`carreteras.js:~34-36`, `off = (hash - 0.5) * 0.5 * len`) que no mira el relieve; la cota sale de un promedio de ±5 puntos (`:~51-55`) y el corte es vertical: `:174-176` borra de `y+1` hasta `max(y+6, h)` y rellena con tierra hasta `y`, sin talud.
- Calles de pueblo: son una cuadrícula fija (`pueblo6.js:~28`) con la cota de cada celda = altura del suelo (`:136`), sin talud: **23 escalones de ≥ 2 por 1000 celdas de calle** y paredes de corte junto al **23 %** de las celdas alrededor de las casas (ver D4).

**D14 · Agua más alta que el mar alrededor de una estructura.** Se comparó, en 4 semillas, cada estructura contra el mismo terreno sin ella (agua nueva por encima de y = 62). De 80 tipos, 32 añaden agua sobre el mar, pero casi todos son **cascadas, fuentes y estanques a propósito** tierra adentro (catarata +31/+40, palo verde +18, braulio +23…). Los que **la ponen sobre el mar abierto** (costa):
- **Templo hundido** (`templo.js:11`: `for (let y = 1; y <= 9; y++) c.set(x, y, z, W)`): rellena 9 bloques de agua sobre un piso que puede estar entre `SEA-16` y `SEA-6` (`estructuras.js`, `fits` del tipo), así que el agua llega hasta **+3 sobre el mar** (6 de 12 muestras): es el «domo». 0,13 por 1000 trozos.
- **Playa de lujo** (`lujo.js:44`: piscinas con `c.set(x,0,z, ...water)` al nivel del terreno de la costa, que puede ser hasta `SEA+3`; `:86` acuario de vidrio a +4): +1 a +7 sobre el mar. 0,06 por 1000 trozos.
- Menores, de 1-2 bloques: **tortuguero** (+2), **estadio en obra** (+2), **zapote** (+2), **corcovado** (+1), **tárcoles** (+5, río), refinería (+6, estanque).
- **El agua por cuencas de la v13.1.0 no lo hace:** `nivelAgua` (`worldgen2.js:~222`) va de 18 a 33, siempre bajo el mar; `aqLevel` (v ≤ 21) igual. Las bocas y salones nunca vacían ni suben el mar (`nearSea`, `carveTop`).
- Arreglo: el agua que una estructura pone **en mar abierto o costa** se limita a `min(y, SEA)` (una función `agua(c, dy)` que todas usan) y los pozos y piscinas de costa se hunden al nivel del mar; una regla en la prueba nueva (`tools/revisar-integracion.mjs`): ningún bloque de agua nuevo con y > 62 en una columna de bioma `ocean` o `beach`.

### Costo actual y margen (meta ≤ 12 ms por trozo)

Node, un solo hilo, sin otra carga: trozo normal **6,2-8,3 ms** (5,2-6,6 sin obras); trozo dentro de un pueblo **8,5-11,7 ms** (5,2-7,2 sin obras). **Un pueblo de la semilla 505 ya está en 11,7**: no hay margen para sumar más de ~1 ms por trozo de pueblo.

## 4. Opciones

Todas las opciones que cambian lo que se genera van tras **`GEN_INTEGRACION = 24`** y `ui.js:344` pasa a `genVersion: 24` (mismo patrón que `GEN_CUEVAS` y `GEN_PROF`): los mundos de 23 o menos salen **idénticos**. Un solo número para todo el paquete, para que los mundos cambien una vez.

**I1 · Obras sin bocas y con suelo firme** (D1, D9 en parte). Prototipo medido.
- Alcance: `bocaIn` rechaza bocas a menos de `R+22` de una estructura y `R+26` de un pueblo (función `cercaDeObra`, con las ubicaciones que ya se calculan y guardan en caché; el prototipo no incluye todavía la distancia al agua: sumar «a ≤ 8 de agua» para las fugas de D9); y un pase al final de las obras que **rellena el vacío bajo toda columna que la obra tocó** (hasta 14 bloques, solo si hay suelo firme debajo; se excluyen caverna del rey, los sitios kársticos, canopy, puentes y templo hundido). Se anota por trozo la altura más baja que escribió cada columna (`Ctx.set` en `estructuras.js`, el `set` de `pueblogen.js`).
- Archivos: `worldgen2.js`, `worldgen.js`, `estructuras.js`, `pueblogen.js`.
- **Medido (prototipo, semillas 1111 y 1212):** columnas de estructura colgando sobre boca **14 403 → 12** con solo excluir bocas (−99,9 %), y **→ 813** con solo el relleno (−94 %); pueblos **3 575 → 1** y **→ 230**; estructuras con ≥ 6 columnas sobre boca **213 → 1**. Los vacíos «hondos» que quedan (≈ 5 000) son voladizos de diseño (balcones, aleros, puentes), no defectos.
- Costo: **sin costo medible** (pueblo 6,8-9,0 ms con el prototipo contra 8,5-11,7 sin él; el cavado deja de probar bocas dentro de los pueblos). Ruido de la máquina ±1 ms.
- Riesgo mundos guardados: ninguno (gen 24). Red: determinista (solo `hash3`/Simplex y lugares ya cacheados); el anfitrión manda `genVersion`.
- Esfuerzo: 1 día con prueba.

**I2 · Ríos con puente, calles con puente** (D2, D3). Prototipo medido.
- Alcance: `makeSegment` marca como agua también el cauce (`rio < 0.045 && h < SEA`), y la regla de «más de 46 bloques de agua» solo cuenta mar, no un río que corre junto al camino; `buildStreets` y la calle del caserío ponen losa y barandas sobre el agua en vez de saltarse la celda.
- Archivos: `carreteras.js`, `pueblo6.js`, `pueblogen.js`.
- **Medido:** diques **411 → 117** (−72 %) y puentes **37 → 316**; calles: las **69** celdas de agua a nivel de calle de un pueblo con río pasan a tener losa (antes 0). Los 117 diques que quedan son lagunas poco profundas (ampliable). Lado malo: 7 de 197 tramos desaparecen por la regla del mar (se corrige en el mismo cambio).
- Costo 0 ms. Riesgo: ninguno (gen 24). Esfuerzo: 0,5 día.

**I3 · Terraza y talud, y mejor sitio para los pueblos** (D4).
- Alcance: (a) `villageAt` y `flat()` miden 16-24 puntos hasta 0,6 R y rechazan desniveles grandes (menos pueblos en montaña: **pregunta 3**); (b) cada edificio y estructura nivela su huella y baja con talud 1:1 en vez de pared; (c) las calles usan perfil con pendiente limitada y media losa como los caminos (`carreteras.js` `losa_asfalto`) para quitar los escalones ≥ 2.
- Archivos: `pueblogen.js`, `pueblo6.js`, `estructuras.js` (`Ctx.foundation`, `flat`).
- **No hay prototipo**: el costo es estimado, +0,5-1 ms por trozo de pueblo, y ahí el margen es de 0,3 ms en el peor caso (semilla 505). Hay que medir al construirlo.
- Riesgo: cambia dónde caen los pueblos (gen 24; mundos viejos intactos). Esfuerzo: 2-3 días, es lo más grande.

**I4 · Caminos educados** (D7).
- Alcance: `makeSegment` rodea las estructuras que no son su destino (radio + 3) y las dibuja a un lado; terraplén y trinchera con talud; perfil que suba como máximo 1 por bloque (las pendientes largas usan media losa).
- Archivos: `carreteras.js`. Costo: se calcula una vez por tramo (con caché), ≈ 0 ms por trozo. Riesgo: gen 24. Esfuerzo: 1 día.

**I5 · Árboles limpios** (D5, D8).
- Alcance: (a) las bromelias solo donde hay hoja debajo (`worldgen2.js:665`); (b) los árboles no se siembran dentro de la caja de una obra (se usa el mismo `cercaDeObra` de I1) y `clearTrees` pierde el tope de 14; (c) se borran las copas sueltas del borde de la obra (≈ +6 de radio).
- Archivos: `worldgen.js plantLife`, `worldgen2.js` (`decorate`, `decorate4`), `estructuras.js`. Costo ≈ 0 ms.
- Riesgo: (a) solo quita un bloque de decoración y se podría aplicar a **todos** los mundos; recomiendo meterlo igual en gen 24 para que nada cambie en mundos ya abiertos. Esfuerzo: 0,5 día.

**I6 · Ríos menos cañón** (D6, opcional, de gusto).
- Alcance: el ancho del valle crece con la altura (`wm = 1 + max(0, h − SEA)/12`). **Medido (solo la forma):** paredes ≥ 8 pasan de **52 % a 27 %** y gargantas ≥ 14 de **25 % a 7 %** (con `/30`: 42 % y 15 %). Hay que mantener consistente el `0.045` que usan `shapeColumn` (`worldgen2.js:67`), `bocaIn` y los caminos.
- Archivos: `worldgen.js:59-61`, `worldgen2.js`, `carreteras.js`. Costo 0 ms. Riesgo: cambia el relieve alrededor de todo río (gen 24). Esfuerzo: 1 día. **Depende de la pregunta 2.**

**I7 · Bordes de bioma y playas suaves** (D11, opcional).
- Alcance: densidad de árboles continua en vez de saltar de 0,03 a 0,0035; umbrales de bioma con un poco de ruido para que el borde no sea una línea lisa; no abrir «playa» donde la pendiente es ≥ 2.
- Archivos: `worldgen.js`, `worldgen2.js shapeColumn`. Sin prototipo ni medida visual. Costo ≈ 0 ms. Riesgo: gen 24. Esfuerzo: 1 día.

**I8 · Radios honestos y una prueba que lo vigile** (D10, §2).
- Alcance: corregir `R` de irazú, san Lucas, cueva del Venado y Marino Ballena (o su `clearR`); nuevo `tools/revisar-integracion.mjs` con lo medido aquí: coordenadas dentro del trozo, orden de generación, azar por trozo, extensión ≤ `R+1`, pisos sobre vacío, diques, copas sueltas y datos que se pierden (que `ensureChunk` avise en vez de saltarlos en silencio). Los scripts de `docs/revisiones/scripts_integracion/` sirven de base.
- Costo 0 ms por trozo. Riesgo: corregir `R` solo **completa** lo que antes se recortaba; es seguro, pero por regla va en gen 24. Esfuerzo: 1 día.

## 4b. Opciones nuevas

**I9 · Ríos que rodean la montaña y se abren en valle** (D12).
- **Medido (prototipo de la línea del río):** sumar al ruido `r += 0,12 * max(0, h − 74) / 40` hace que la línea del río se desvíe y **rodee** el relieve (el río nace al pie de la montaña como un manantial): pared ≥ 20 **16,7 % → 7,4 %**, ≥ 30 **7,7 % → 1,7 %**, vertical **11,1 % → 3,9 %**, p90 25 → 18; el cauce total baja 15 %. Con un `0,05` es más suave (9,1 / 2,2 / 5,3 %).
- Complementos: el ensanche del valle de I6 (`wm = 1 + max(0, h-SEA)/12`: paredes ≥ 8 pasan de 52 % a 27 %) y, donde igual quede una pared ≥ 12, **escalonarla en terrazas de 2-3 bloques con una cascada** (`water_fall` ya existe, `catarata*.js`) en vez de un corte recto (sin prototipo; estimo +0,2 ms por trozo con cauce).
- Archivos: `worldgen.js:57-61`, `worldgen2.js:67` (consistencia del `0.045`), nuevos manantiales/cascadas en `worldgen2.js`. Costo en tiempo: **0 ms** (una suma en `column()`). **Generador 24**, solo mundos nuevos. Riesgo: cambia el relieve entero alrededor de los ríos (y dónde caen pueblos y estructuras). Esfuerzo: 1-2 días.

**I10 · Caminos y calles que rodean, zigzaguean o hacen túnel** (D13).
- **R1 · Ruta guiada por el relieve (medida).** `makeSegment` prueba 13 curvas laterales y se queda con la de menor costo (subidas, cumbres, mar). Resultado en 4 semillas: trincheras ≥ 8 **33 → 14**, ≥ 12 **13 → 5**, puntos sobre terreno alto **2 098 → 741 (−65 %)**, saltos ≥ 2 **1 028 → 301 (−71 %)**; a cambio el camino es **25 % más largo** (61 mil → 76 mil bloques) y cruza más agua (los diques suben 56 %: **va con I2**). Costo: una vez por tramo (con caché), unos 800 `column()` ≈ 5 ms la primera vez, **0 ms por trozo**. Gen 24.
- **R2 · Taludes.** En vez de un tajo vertical, el corte y el terraplén bajan 1:1 a ambos lados (`carreteras.js:174-176`). Sin prototipo; +0,3 ms estimados en trozos con camino. Gen 24.
- **R3 · Zigzag.** Donde la pendiente pasa de 1:3, la ruta usa dos o tres tramos en diagonal (cuñas) con curva de nivel. Es un A* con costo de pendiente; 2-3 días, costo por tramo, 0 ms por trozo. Gen 24.
- **R4 · Túnel con portal** cuando un corte sería ≥ 10 durante ≥ 8 bloques: se deja la montaña, se vacía 5 × 5 y se pone un arco de piedra. +0,2 ms en los pocos trozos con túnel; 1 día. Gen 24.
- **R5 · Calles de pueblo**: perfil con pendiente limitada y media losa (como los caminos) y terraza con talud en cada edificio (es I3). 
- Orden recomendado: R1 + R2 (+ I2) primero; R4 si Isaac quiere túneles; R3 solo si los zigzags le interesan.

**I11 · El agua de una estructura nunca pasa del nivel del mar en mar abierto** (D14).
- Función común `aguaDe(c, dy)` que recorta a `SEA`; templo hundido llena hasta `min(oy + 9, SEA)`; piscinas de costa a `min(y, SEA)`. Costo 0 ms. **Generador 24** (cambia los bloques de esas estructuras en trozos aún sin visitar; los mundos viejos conservan el domo). Esfuerzo: 0,5 día.

### Qué no hace falta (descartado)

- «Estructuras con conocimiento de los trozos vecinos»: no se necesita. Cada trozo ya construye lo suyo con la misma semilla y el mismo azar (0 costuras, 0 dependencia del orden). Un cambio así sí costaría rendimiento.
- Pilotes bajo estructuras: I1 lo resuelve con el relleno y no cambia el aspecto.

## 5. Red y mundos guardados

- Cada máquina genera el terreno con `{seed, genVersion}` (`red/pantallas.js`, `red/validar.js`); todo lo nuevo sale de `hash3`/Simplex, ningún `Math.random`. Hay que sumar `24` a `GEN_MAX` (`version.js:7`) y la prueba de `revisar-trozos`/`revisar-cuevas` con la huella de mundos 21, 22 y 23 para demostrar que siguen idénticos.
- Los mundos guardados no guardan trozos sino cambios (`mods`): con gen 24 solo los mundos nuevos cambian. Un amigo con la versión vieja se bloquea por `GEN_MAX`, igual que en la 13.1 y la 13.2.

## 6. Recomendación

**Orden de entrega (una sola subida a generador 24, v13.3.0 en adelante, en entregas por partes):**
1. **I1 (obras sin bocas, suelo firme) + I2 (puentes) + I11 (agua del mar) + I8 (prueba)**: la base. I1 es requisito de las simas de CM2 y de que los salones no dañen aldeas. ≈ 3 días.
2. **CM1 (Red Honda y Salones)**: es lo que más pidió Isaac y el prototipo ya existe (+0,5-1,2 ms). ≈ 3 días. Luego CM2 y CM3.
3. **I9 (ríos que rodean la montaña) + I10 R1/R2 (caminos guiados y con talud)**: cambian el relieve y las rutas; ≈ 3 días entre los dos. Después I4, I3 y, si se quiere, I10 R4 (túneles).
4. I6, I7 y CM4 (vetas grandes) solo con la confirmación de Isaac.

Detalle del primer paquete (antes de los añadidos):

1. **Una sola subida a generador 24 (v13.3.0)** con **I1 + I2 + I5 + I8** primero (≈ 3 días): arregla D1, D2, D3, D5, D8, D9 y D10, que son lo más frecuente y lo que más se nota, con costo medido ≈ 0 ms y sin riesgo para mundos guardados. Sale con la prueba nueva.
2. Después **I4** (1 día) y **I3** (2-3 días, medir el costo en trozos de pueblo; ahí manda el límite de 12 ms).
3. **I6 e I7 solo si Isaac los quiere** (son de gusto). **Sin I1 y I2 el resto casi no se nota**, porque los huecos y los cortes de río son lo que salta a la vista.
4. Pedirle a Isaac **2-3 capturas** de lo que ve (sin ellas, el diagnóstico es por números): con ellas se confirma que sus «errores» son D1-D4.

## 7. Preguntas para Isaac (solo de producto)

1. **Entradas de cueva en el campo.** Hoy hay casi una cada dos trozos (5 % del suelo): el campo parece picado. ¿Las dejamos igual (pero lejos de las casas), a la mitad, o a un cuarto (más raras y más especiales)?
2. **Ríos de montaña.** Hoy son zanjas con paredes altas (la mitad de los ríos). ¿Quiere ríos que se abran y queden suaves en la montaña, o le gustan los cañones?
3. **Pueblos en terreno inclinado.** ¿Preferimos que **no haya pueblo** donde está muy inclinado (quedan más separados pero planos) o que el pueblo se haga en **terrazas** con escalones y taludes?
4. **Ferias y cementerios de pueblo.** Hoy los caminos pasan encima. ¿El camino les da la vuelta (más largo) o la feria se corre lejos del camino?
5. **Puentes.** ¿De concreto como las carreteras de Costa Rica, o de madera como el puente colgante? (Afecta solo el aspecto.)
6. **Ríos y montañas.** ¿Prefiere que los ríos nazcan al pie de la montaña y la rodeen (más cortos), o que la crucen con garganta y cascadas escalonadas?
7. **Caminos en montaña.** ¿Que den la vuelta (más largos), que suban en zigzag, o que hagan túnel con portal de piedra?
8. **Mundos viejos.** Con generador 24 solo cambian los mundos nuevos. ¿Está bien dejar los mundos ya creados como están, o quiere algo para arreglarlos (cada arreglo tendría que ser una versión aparte)?

## 8. Cómo se midió (para repetirlo)

- Cuevas masivas: `caves.mjs <raíz> <semilla> 23 32` (flood fill) y `prototipo_cm_patch.py` (parche del prototipo, se aplica a una copia de `src/`, nunca al repo). Ríos y caminos: `riv.mjs`, `rd2.mjs`; agua del mar: `wat.mjs`.
- Scripts en `docs/revisiones/scripts_integracion/`: `est2.mjs <raíz> <semilla> 23 <porTipo> <pueblos>` (causas del piso colgante, escalones, paredes, copas), `ter.mjs <raíz> <semilla> 23 <N> full` (fugas, bocas, copas, ríos, bordes), `roads.mjs <raíz> <semilla> 23` (diques, puentes, saltos, cruces) y `coords.mjs <raíz> <semilla> 23` (coordenadas fuera del trozo y dependencia del orden). «Piso colgante» = bloque más bajo que la obra cambió con ≥ 2 de aire debajo; se compara el trozo con obras contra el mismo trozo sin obras (`structTypes = []` y sin pueblos).
- Limitaciones: 10-14 semillas; «boca» = aire en la superficie de la columna en el mundo sin obras; el desnivel y el río se miden con `column()` (no incluye lo que dibujan las obras); los números de costo son de un solo hilo en esta máquina.
