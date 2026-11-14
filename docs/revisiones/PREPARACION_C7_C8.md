# Preparación de C7 «Fuego de la tierra», C8-B «Fiesta patronal» y C8-C «El Comité de Caminos» (encargo 39)

Solo lectura, **contra el código de la v12.6.3** (HEAD `6303dfa`). Diseño: `DISENO_CONTENIDO_C5-C8.md` §C7, §C8-B, §C8-C y su «Registro de ids». Mismo método que `PREPARACION_C6.md`. Lo que no pude comprobar (no abro el navegador) va «por confirmar».

## 0. Lo más importante

**Estado de las dependencias hoy.** C8-A (tablón y encargos 2.0) está hecho. **C5-A (pesca), C6 (oficios) y C7 no están construidos**: no existen la sopa de mariscos (1117), la tabla fina, el farol forjado, las tejas de oficio, las herraduras, el mostrador ni el cayuco. Por eso:
- **C8-C** (Comité de Caminos) pide cosas de C5-A, C6 y C7: **va última** y sus etapas se pueden sustituir por equivalentes de hoy (§3).
- **C8-B** (patronal) usa herradura y mostrador de C6, pero **se puede construir antes** sin ellos (sin herradura el caballo corre normal; el ×1.5 del mostrador se enchufa después).
- **C7** no depende de nada, pero es **la que cambia el generador del mundo**.

**Orden que recomiendo:** C8-B (barata: 1.5) → C7 (2.0, con `genVersion` 21) → C8-C (1.5), una vez que C6 y C5-A existan. Ver §6.

**Los 8 choques más importantes de las tres, en orden:**
1. **C7 es la única tanda que cambia el generador.** `genVersion` de los mundos nuevos es **20** (`ui.js:339`); el último cambio de generador es v12.6.0 (`worldgen2.js:384`, `version >= 20`, coral blanqueado). C7 usa **21**, y todo lo del generador va con `gen.version >= 21` o `minV: 21`. Los mundos viejos (incluidos los de prueba de nanoyackson) **no tendrán tubos, termales ni observatorio**.
2. **Tres sistemas ya existentes chocan con «la erupción cada ≈ 25 días»** (§1.5): el Arenal ya erupciona cada 45–105 s cuando uno anda a < 320 bloques (`volcanes.js`, `st.next`); el terremoto grande ya tiene su propio ciclo de 25 días (`terremoto.js`, `M.terremotoCd`, desde el día 10); y `g.cenizaHasta` es compartido con el Corazón (`corazon.js:47`, 3 600 s) y con `clima2.js`.
3. **Las aguas termales son una «agua» más** (`render: 'water'`, familia 1): reciben el sombreado nuevo de la v12.6.2 (azul, reflejo del cielo, espuma) y **una lava vecina se enfría sola en obsidiana o adoquín** al primer vecino que cambie (`world.js:349,393`). Hay que decidir su bandera y separarla de los canales de lava (§1.4).
4. **La patronal por pueblo (24 días) choca con el calendario global de 12 días** de `fiestas2.js`: cuatro de cada doce días ya son fiesta global (4, 7, 9, 11, 12). Con santos repartidos al azar **la mascarada o el tope propios caerán el mismo día que los globales** (§2.2).
5. **`procesion.js` es la procesión de las ánimas** (fantasmas de noche, `ANIMA`, `pruebaProcesion` pone `g.time = 0.7`), **no una procesión religiosa**: el diseño la reusa para la novena. Hay que usar otra cosa (la mecánica de `m.data.ruta` que ya usan los faroles y el carnaval).
6. **El tope de caballos ya existe** (`fiestas2.js:181-189`: caballos con `data.tope` dando vueltas a la plaza el día 9) y solo es de adorno: el minijuego se **monta sobre eso**, no se crea de cero.
7. **La cimarrona no tiene sonido en los bancos CC0.** Hay percusión de comparsa y cencerro, pero **ninguna trompeta ni clarinete** (§4). Eso decide si «suena a banda de fiesta tica» (la pregunta 3 de C8.5).
8. **Los topes no cuadran con lo que paga cada tanda.** El tablón ya topa en 40 u/día (`M.ganado`); el observatorio, la evacuación, la mayordomía y el mercado regional **pagan por fuera** de ese tope y del cupo de 30 u por ítem (`CUPO_DIA`, `encargos2.js:198`). El diseño dice cupo de 20 en el mercado regional: **hoy es 30**. Hay que enchufarlo todo a un solo `cobrarDelTope` (ver `REVISION_v12.6.2-v12.6.3.md`).

## 1. C7 «Fuego de la tierra»

### 1.1 Ids ya corridos (todos libres hoy)

| Rango | Estado en el código |
|---|---|
| Bloques `685–691` (fumarola, sismógrafo, tierra volcánica, aguas termales, cristales de azufre, veta de obsidiana, bloque de pómez) | **libres**. Cerca hay `692` (tablón, ya usado por C8-A), `693–696` libres (C8) y `697` (coral blanco, C5-B) |
| Ítems `1160–1170` (lasca, cuchillo, cristal, pómez, ceniza fértil, huevo termal, sismograma, casco, botas, pase, muestra) | **libres**. Usados hoy: `1121, 1124, 1125, 1126, 1187` |
| Nombres del registro | `revisar-nombres.mjs` va a pedir nombre cortos y únicos para 11 ítems y 7 bloques |
| Firma de ids | agregar ids **obliga** a subir `MIN_VERSION` y copiar la firma a `MIN_IDS` **con su `version`** (v12.6.3), si no `tools/revisar-version.mjs` falla |

### 1.2 Funciones y archivos que hay que tocar

| Archivo | Qué |
|---|---|
| `src/worldgen2.js` | `volcanoIn()` (volcanes: celda de 640, 35 % de probabilidad, `kind` arenal o poás) y la columna (`lavaTop`, `acidTop`, `volcanoK`): el **tubo se ancla a un volcán**; guardas con `this.gen.version >= 21` |
| `src/estructuras.js` | la tabla de tipos (`minV`, `cell`, `R`, `fits`/`place`, `build`) y `buildStructuresInChunk` (línea ~1098): el tubo de lava y las termales **entran aquí**, como `barra_honda` (`naturaleza2.js`) y la Caverna del Rey (`caverna.js`, con foso de lava y jefe al entrar). Los dos de C7 son `minV: 21`; el generador de volcanes necesita un `place` propio (como `placePuenteColgante`) |
| `src/worldgen.js` | `Generator` ya recibe `version` (línea 25) y se la pasa a `GenV2`; **el LOD usa el mismo generador** (`lodworker.js:18`) y no ve nada subterráneo: ningún cambio |
| `src/ui.js:339` | `genVersion: 20` → `21` (solo mundos nuevos); el comentario lista lo que trae cada versión |
| `src/blocks.js` | 7 bloques y 11 ítems; el `drop` de la veta de obsidiana y de la tierra volcánica; **ojo: `K.obsidian` es `tier: 4, hardness: 25`** (pico de diamante): la veta necesita un `tier` menor (2 o 3) o las lascas quedan fuera del alcance del que empieza |
| `src/pixelart.js`, `src/textures.js` | baldosas de fumarola, termal (con animación de agua), veta, tierra volcánica, sismógrafo |
| `src/volcanes.js` | `tickVolcanoes`: separar «retumbo de ambiente» de «erupción de evento» (§1.5); la señal de cada volcán va en `g.zoneState[zn.id]` (`game.js:1961-1967`, `zn.kind === 'erupcion'`) |
| `src/neblina.js`, `src/terremoto.js`, `src/clima2.js`, `src/lahar.js` | los avisos (temblores −3 días, ceniza −2), la ceniza que cae y se acumula (`clima2.js:89`) y el lahar con lluvia (`lahar.js`: `weather.type !== 'clear'`) |
| `src/armas2.js` (`MINIJEFES`, línea ~144; `miniSpawn`) y `src/entities.js:191` | el Guardián de la Colada como mob (`MOB_TYPES`), con `avisoCaida` de `golpes.js` para el pisotón |
| `src/precios.js` | `PREMIO_BAJA` y el conjunto `MINIJEFE` (línea 39): `guardian_colada: [8, 10]`, que comparte el cupo del día de los minijefes (`premioDia.mini`) |
| `src/inframundo.js` | el ceniciento y el zopilote de fuego (`INFRA_MOBS`) se reutilizan; el basilisco y el murciélago de ceniza son modelos nuevos o variantes |
| `src/bestiario.js`, `tools/bot-pelea.js` | entradas del Guardián; duelo nuevo para medir antes de fijar 150 de vida |
| `src/yunque.js` (no) | no cambia: el cuchillo de obsidiana es **arma de caza**, fuera de la curva de jefes |
| `src/neblina.js` (mascarilla) | `MASCARILLA = 525` ya define quién aguanta los gases; la fumarola lo reutiliza |
| `src/temporadas.js` | `BASE` de temperatura por bioma: las termales usan `fx.termal` (`+25`), ya existe; falta el aviso de pase |
| `src/encargos2.js` | los pedidos de la vulcanóloga y `valorRef` para lasca, cristal, pómez y muestra |

### 1.3 Los chunks del volcán y las cuevas con `genVersion` (con cuidado)

- **Cómo se generan hoy.** El volcán es **geometría** de la columna (`worldgen2.js` ~55-90): cono con `Math.pow(k, exp) * hgt` y, si `d < cr`, cráter con `lavaTop` (Arenal: `rim - 3`) o `acidTop` (Poás: laguna ácida). Las cuevas son `isCave(wx, y, wz, h)` con `carveTop = h - 3` en volcán y lagos de lava en `y ≤ 10`; los lagos subterráneos de agua (`aqOn`, `aqLevel` entre 18 y 35) **no se generan en el bioma volcán** (`col.biome !== 'volcano'`, línea 90) pero **sí alrededor**. Todo es **determinista por semilla + `genVersion`**: un chunk se genera igual cada vez; solo lo que el jugador cambia se guarda (`mods`).
- **Las estructuras se escriben por chunk.** `buildStructuresInChunk` recorre los tipos y, para cada punto de colocación cercano (`Math.abs(P.x - (x0 + 8)) > T.R + 9`), construye **su porción** en este chunk. Un tubo largo de 120–180 bloques necesita **R ≈ 95**; hoy el mayor es `marino_ballena` con R 62. Es viable (el costo es una vuelta más por chunk), pero **el recorrido del tubo tiene que ser una función pura de `P` y de la semilla**, no de lo que haya en chunks vecinos (si no, dos chunks cortan distinto el mismo tubo).
- **El orden importa.** Después del terreno y las cuevas vienen los caminos (`version >= 6`), los pueblos (`>= 3`) y las estructuras (`>= 5`); un tubo **pisa** cuevas y lagos subterráneos. Si un canal de lava toca un lago subterráneo, no pasa nada al generar (las mezclas de fluidos corren con las actualizaciones, no al crear) pero **el primer bloque que el jugador cambie al lado lo convierte en obsidiana/adoquín**. Regla: **paredes de basalto de 1 bloque entre lava y agua** y que el tubo no baje de `aqLevel + 2` bajo el volcán.
- **Tamaños que no cuadran.** El diseño dice «3–5 tubos por mundo»: el mundo es **infinito** y un volcán sale en el 35 % de las celdas de 640, así que hay **un tubo por cada volcán que exista**. Los cráteres miden `r = 62–78` (Arenal) y `105–125` (Poás, de **laguna ácida, sin lava**); un tubo de 120–180 sale del cono. Propongo: tubos **solo en los Arenal**, radiales desde la falda hasta debajo del cráter, y la cámara del magma **bajo** el lago de lava del cráter (`lavaTop`). En el mundo `compacto` el `VOLCANO_CELL` **no** se escala (la escala `kb` solo toca biomas): **por confirmar** que el volcán quede a distancia jugable.
- **Lejos de pueblos y spawn (200 bloques).** Las estructuras se esquivan por orden en la tabla (`feria_pueblo` y `cementerio_pueblo` van primero); **no encontré** en `placeOf` un chequeo de distancia a pueblos para tipos de volcán: hay que agregarlo en el `place` nuevo.
- **Mundos viejos.** No cambian nada (guardas `>= 21`). Los ítems de C7 solo se consiguen en un mundo nuevo, salvo lo que el generador no necesite: la erupción como evento y los sismógrafos **pueden funcionar en mundos viejos** (los volcanes existen) si se decide no atarlos al observatorio; **decisión de nanoyackson** (§7).
- **Guardado y versión.** Bloques `685+` ⇒ `MIN_VERSION` nueva. Un mundo de `genVersion` 21 abierto en un juego anterior **no** pierde lo que el jugador hizo (`mods`), pero el juego anterior no sabe generar los tubos: `MIN_VERSION` lo bloquea. `importar.js:56` acepta `genVersion` de 1 a 1000: sin cambio.
- **Pruebas ya existentes que hay que correr:** `tools/revisar-mundo.mjs` (semillas sin superposiciones; el tubo no debe pisar pueblos, caminos ni otras estructuras), `tools/revisar-version.mjs`, `tools/revisar-ext-item.mjs`.

### 1.4 La lava y el agua nueva (v12.6.2)

| Punto | Cómo está hoy | Qué hacer |
|---|---|---|
| **Lava y el sombreado del agua** | La lava va al **buffer opaco** (`mesher.js`: `buf = lava ? opaque : water`) con `anim4 = 0 ó 3`; el material opaco **no** define `ATMOS_AGUA`. La lava no se ve afectada por Fresnel ni espuma | nada; pero la **orilla** del agua (`SOLID`) no cuenta la lava como orilla: sin espuma junto a la lava (bien) |
| **Aguas termales** | Si se definen con `render: 'water'` van al material del agua y reciben el tinte azul (`vec3(0.78, 0.92, 1.12)`), el reflejo del cielo y la espuma. El agua ácida y la celeste **ya pasan por ahí** (`agua_acida`, `agua_celeste`, `render: 'water'`): con la v12.6.2 sus colores cambian un poco (**por confirmar a ojo**) | darles una **bandera propia** (p. ej. un tercer valor base en `aAnim`, 7) para saltarse el reflejo y el tinte: se ve «agua tibia y turbia», con vapor. **Mismo cuidado con el agua ácida y la celeste** |
| **Lava junto al termal** | `world.js:349`: lava que toca agua (`FLUID === 1`) se enfría: fuente → obsidiana, corriente → adoquín; y `world.js:393` cuando el agua cae sobre lava. El termal, si es familia 1, hace lo mismo | o se define el termal como **familia 1** y se asume (los canales de lava van aparte, con basalto de por medio), o como familia nueva sin mezcla (cambia `FLUID`, la simulación, `canFlowInto` y la natación): **recomiendo familia 1 + separación** |
| **Comprobaciones `FLUID === 1` que ahora incluyen al termal** | `arrecife.js` (vivero: ya pide `y < SEA`, pero el termal está más alto: pasa), `oficios.js: batear` (excluye solo `agua_celeste`: **bateando en el termal saldría oro**), `game.js:3232` (bajo el agua: niebla azul y burbujas dentro de una poza) | excluir el termal en `batear`; la niebla azul bajo el agua en una poza de 1 bloque probablemente molesta: **por confirmar** |
| **Bajo el agua / sol** | `abajoA` en el shader solo mira la cámara contra el fragmento | no afecta |
| **Fumarolas** | vapor con partículas (`volcanes.js` ya lo hace para el Poás) | reutilizar |
| **Costos** | las termales son pocas celdas de agua: despreciable | — |

### 1.5 Choques con sistemas ya existentes

- **Erupciones del Arenal hoy.** `volcanes.js` hace erupcionar al volcán **cada 45–105 s de reloj** mientras uno está a menos de 320 bloques (bombas, ceniza 50–90 s, toast «¡El Arenal hizo erupción!», logro). Si se añade «el volcán más cercano se despierta cada 25 días», hay que **partir** esto en dos: el **retumbo** (lo de hoy, sin ceniza fuerte) y la **erupción** del evento. Si no, el evento no se nota y el aviso de 3 días miente.
- **`g.cenizaHasta`** lo ponen el volcán (`volcanes.js:64`), el Corazón de Tiquicia (`corazon.js:47`, 3 600 s) y `clima2.js` lo lee para caer y acumular: **una sola variable** para tres cosas. La erupción de C7 con 4 minutos de juego tiene que usar el mismo mecanismo sin pisar la del Corazón (tomar el máximo, no asignar).
- **`terremoto.js`:** el sismo grande va por `M.terremotoCd = día + 25` desde el día 10 y la prueba `Math.random() < 0.06`. «Temblores 3 días antes» de C7 y el terremoto **coinciden en ciclo (25 días)**: hay que **desfasarlos** (por ejemplo, que la erupción no se programe en ±2 días del último terremoto) o fundirlos (el temblor suave de C7 es el aviso del grande).
- **Lahar** (`lahar.js`): necesita lluvia (`weather.type !== 'clear'`) y que el jugador esté en las faldas (`volcanoK` entre 0.2 y 0.75); en **verano no llueve**: la erupción de verano no da lahar. **Temporadas** (`temporadas.js`): verano e invierno de 30 días; la erupción cada 18–32 días cae en cualquiera. Para que el lahar no sea un caso raro, ponerlo como condición de la erupción en invierno (**por confirmar** con nanoyackson).
- **Daños a la finca (12 cultivos cubiertos de ceniza)** necesitan la lista de cultivos de la finca de C4: `finca.js`/`finca2.js` (**por confirmar** la función que los lista).

### 1.6 Números con `precios.js` y las tiendas de hoy

Valores de referencia reales (ver `PREPARACION_C6.md` §6): hierro 1.2 u (se paga a 1.5), cuero 1.5 u, madera sin precio de tienda (`valorRef` = 0.3 por defecto), `K.farol` 3 u.

| Concepto | Diseño | Revisado | Observación |
|---|---|---|---|
| **Sismógrafo** (paga 14 u) | materiales «≈ 11 u» ⇒ 1.2 × 11 = 14 | con el hierro a 1.2 u y los clavos de C6 (2 u cada 8) son **≈ 8.7 u**; 14 u = **1.6×** | pagar **10–12 u** o subir la receta; si el diseño de C6 se corrige, este también |
| **Red sísmica** (5 × 14 = 70 u una vez) | gasto ≈ 55 u, neto +15 | gasto real ≈ 44; neto ≈ +26 con los 14 u | ok, pero **una sola vez** y no pasa por ningún tope |
| **Muestra volcánica** (6 u, cupo 3/día) | 2 lascas + 1 cristal + 1 pómez | 2 + 3 + 0.5 = **5.5 u** ⇒ 6 u es ×1.1 (ok) | **la lasca vale 1 u solo en papel** (no se vende a tiendas): su valor es el tiempo de picar la veta |
| **Sismogramas** (1 u, tope 5) | — | 5 u por día máximo | |
| **Ingreso diario de la tanda** | «≈ 15 u al día como máximo» | 3 muestras × 6 + 5 sismogramas × 1 = **23 u/día** | corregir el texto o bajar el cupo a 2 muestras |
| **Evacuación** | 60 u cada ≈ 25 días | pasando por el tope de 40 u/día del tablón: **48 u** (40 + 20 × 0.4) | decidir si la evacuación paga fuera del tope (recomiendo **dentro**, como los buzos de C5-B) |
| **Pase de las termales** | 6 u por 10 min | la mecedora cura 12 puntos en 72 s sin costo; el termal 30 puntos en 90 s | el pase **sí es negocio** frente a la mecedora (más cura por 6 u): bien, es el punto |
| **Hotel termal** | 30 u la noche | la cabina vale 50 u (`ANCLAS`) | ok |
| **Huevo termal** (7 de comida) | huevo 287 sin precio de tienda | huevo frito vale 5 | ok, no se vende |
| **Casco / botas / cuchillo** | casco 2 puntos; cuchillo daño 6, 120 usos | el casco de hierro vale 2 puntos en la escala de `FASE0_CURVA_JEFES.md` §4 | sin choque con la curva; el cuchillo no entra al yunque |
| **Guardián de la Colada** | 150 de vida, golpe 8, premio 8–10 | entre el Cocodrilo (130) y el Mono congo (170); `PREMIO_BAJA` de minijefes 7–9 | medir con el bot **antes** de fijar |

### 1.7 Sonidos que hacen falta (solo de lo que ya hay)

| Pedido | Hay en `manifest.json` | Propuesta |
|---|---|---|
| `sismo.retumbo` | **`rumble`** (2), `derrumbe` (2), `trueno` (2) | usar `rumble` (ya lo usa `terremoto.js`) con `pitch` bajo |
| `fumarola.vapor` | **`loop.hervir`** (1), `rafaga` (2), `serpiente` (hiss) | un lazo de `loop.hervir` con filtro agudo, o `rafaga` por golpes |
| Lazo del volcán / la lava | **`loop.volcan`**, **`loop.lava`** (2) | ya sirven para el tubo y el cráter |
| Cueva | **`loop.cave`** | ya |
| Termal | **`loop.hervir`**, `splash`, `loop.river` | mezcla de burbujeo y agua suave |
| Erupción | **`explode`**, `rumble`, `trueno` | `volcanes.js` ya las usa |
| Pisotón del Guardián | **`derrumbe`**, `puerta_golpe` | ok |

**No falta ninguno nuevo para C7.** Ningún archivo nuevo que bajar.

### 1.8 Lista de pruebas en tab-1 (C7)

1. `npm run lint` y `npm run build` en cero; `node tools/revisar-mundo.mjs` (40–60 semillas) **sin superposiciones** de tubos con pueblos, caminos ni estructuras; `revisar-version.mjs` (firma y `MIN_IDS.version`); `revisar-ext-item.mjs`; `revisar-nombres.mjs`; `revisar-recetas.mjs` (el cuchillo de obsidiana no pisa el de monte ni el de pinza).
2. **Mundo nuevo (`genVersion` 21) y un mundo viejo (20):** en el viejo, ningún tubo ni termal; el volcán igual que antes.
3. **Mismo chunk, dos veces:** viajar lejos, volver (el chunk se regenera): el tubo debe ser **idéntico** (sin cortes en los bordes de chunk). Probar con 3 semillas.
4. **Un tubo:** entrar por la falda, andar por la orilla de los canales; la lava no sale a la superficie ni toca agua; las paredes de basalto separan canal y lago. Cambiar un bloque junto al canal: no debe haber obsidiana espontánea junto a ningún lago subterráneo.
5. **Frontera del LOD:** mirar el volcán desde lejos con el LOD: el cráter con lava se ve igual que antes (`lodworker.js: COL.lava`).
6. **Agua nueva:** una poza termal en Medio y en Alto: que se vea tibia (no con el reflejo azul), sin espuma de orilla fuera de lugar, y que la lava vecina (a 2 bloques) siga como lava. **Agua ácida y celeste:** comparar con una captura de antes de la v12.6.2.
7. **Batea en el termal:** no debe sacar oro.
8. **Erupción:** forzarla con una prueba (como `pruebaLahar`): avisos a −3, −2, −1 días con 3 sismógrafos; sin ellos, de sorpresa; los vecinos **no mueren**; la ceniza cubre 12 cultivos y se limpia con pala; **el Corazón de Tiquicia** (`corazon.js`) no pierde su ceniza.
9. **Terremoto:** no coincide con la erupción el mismo día (±2).
10. **Fumarola** sin y con mascarilla (`525`): daño y mareo solo sin ella; pica con mascarilla y da cristal.
11. **Guardián:** a pie con hierro, 10 duelos con el bot (`JEFES()`): muertes ≈ 0.15, TTK 9–12 s; pisotón con aviso de 0.8 s; el `ignifugo` y las botas lo anulan; premio 8–10 u una vez por día (`premioDia.mini`).
12. **Casco con linterna:** ilumina en cuevas (`env.cave > 0.6`) y **no** en el exterior.
13. **Importar** un mundo con `meta` dañado (números `NaN` en sismógrafos): no debe romper el tic.

## 2. C8-B «Fiesta patronal»

### 2.1 Ids ya corridos

| Rango | Estado |
|---|---|
| Bloques `693–696` (estandarte, tarima, arco de fiesta, mojón de camino) | **libres** (`692` ya es el tablón) |
| Ítems `1180–1186` (tambor, trompeta, tres máscaras, banda de mayordomo, vela de la novena) | **libres** (`1187` ya es el libro de encargos) |
| Existentes que se reusan | `K.farol`, `bombeta` (id **374**, la pulpería la vende a 1.5 u: `[374, 4, 6]`), la máscara `376` (la mascarada actual) y `g.disguised` (`game.js:2636`: armadura 0 con id 376) |

### 2.2 Funciones y archivos que hay que tocar

| Archivo | Qué |
|---|---|
| `src/fiestas2.js` | `fiestaHoy(g)` es **global** (ciclo de 12 días); `tickFiestas` evalúa **solo el pueblo más cercano** (`g.nearestVillage`, `enPueblo = dist < 60`): una `fiestaPatronal(g, v)` por pueblo **entra en el mismo sitio**, con el mismo costo |
| `src/fiestas2.js` (tope) | los caballos del tope (`data.tope`, `ruta` circular de r = 11) y `spawnMob('caballo')`: el minijuego «mantener el caballo entre dos jinetes» se monta sobre `g.riding`/`monta` (**por confirmar** los nombres en `game.js:1552`) |
| `src/pueblo.js` (roles, `LINES`), `src/modelos-gente.js` | el cura/mayordomo y los músicos: **más barato** que 6 roles nuevos: **6 `vecino` genéricos con un utilero** (el instrumento en la mano, como `ponerFarol` y `ponerPlumas`) |
| `src/audio.js` | `setEmitter(key, bank, pos, vol)` (línea 205): un solo emisor por clave; sirve para `loop.cimarrona` |
| `src/blocks.js`, `pixelart.js` | estandarte, tarima, arco, máscaras, instrumentos |
| `src/encargos2.js`, `src/ui.js` | el «mayordomo» como encargo (60 u) |
| `src/saberes.js` | `repPueblo` (+1 la vela, +5 la mayordomía) |
| `src/game.js` (`USABLES_CLIC`, `rightClick`) | tocar el tambor y la trompeta |
| `src/ui.js` (`openShop`) y `src/calma.js` | «Movimiento tranquilo» (`calmaActiva`) en todo lo animado |
| `src/pueblogen.js`/`pueblo6.js` | la tarima y el estandarte en la plaza (`gen.version >= 21` o similar: **solo pueblos nuevos**; en los viejos, un bloque que se pone a mano o una estructura temporal durante la fiesta) |

### 2.3 Choques

1. **Calendario global vs patronal.** `fiestaHoy`: faroles (día 4), mascarada (7), carnaval/tope (9), fin de año (11–12) del ciclo de 12. La patronal de 3 días cada 24 **cae con probabilidad alta sobre uno de esos días**: dos mascaradas el mismo día, dos topes, y las cabezonas globales (`ponerCabezona` en `vecino` con `seed % 3 === 0`) se mezclan con las de la patronal. Salidas: (a) **la patronal reemplaza** a la global en ese pueblo durante sus 3 días (el diseño dice «el global se queda y la patronal solo agrega»: hay que **decir qué gana cuando coinciden**); (b) escoger `santoDia` de modo que no coincida (solo 3 días seguidos del ciclo de 12 están libres de fiestas globales: `d % 12` en {1, 2, 3}; **todos los pueblos quedarían igual**, no sirve); **recomiendo (a)**.
2. **`procesion.js` no es una procesión de santo.** Es la «procesión de las ánimas» (mobs `ANIMA`, de noche, `pruebaProcesion` fija `g.time = 0.7`). La novena puede usar `m.data.ruta = { cx, cz, r, a }` (la mecánica de los faroles) con velas en la mano.
3. **Temporadas y lluvia.** En invierno hay aguacero a las 2 (`temporadas.js`): el día 2 (tope de día) y la pólvora de la noche 3 (`Rocket`, `fiesta.js`) chocan con la lluvia. Reglas: con `g.weather.type !== 'clear'`, el tope se **pospone o se hace igual con aviso**; la pólvora no se tira (o se suspende con aviso). **El mostrador ×1.5 (C6) y los chinamos** dependen de que haya día.
4. **Cupo y encargos 2.0.** Los chinamos (comida) venden por `SHOPS`: pasan por `CUPO_DIA`. El tope del día de los encargos (`M.ganado`) **no** cuenta el premio del tope (10 u) ni la reputación: si se suma, que sea por `cobrarDelTope`. **Los encargos del tablón pueden pedir comida del banquete (`PLATOS`) durante la fiesta**: bien, no choca.
5. **Mayordomía: el costo real.** «60 u y llevar 20 tamales y 5 bombetas». El tamal vale **5 u** en la panadería (`[353, 1, 5]`) y la bombeta **1.5 u** en la pulpería (`[374, 4, 6]`): **20 tamales = 100 u y 5 bombetas ≈ 7.5 u**, o sea **≈ 168 u** si se compran (≈ 6.7 jornadas), no 60. Cocinados, el costo baja. «No da plata» es correcto, pero el diseño no lo dice así; **decidir si los 60 u incluyen los tamales** (recomiendo: 60 u en total, tamales aparte).
6. **Mejor jinete: 10 u una vez por fiesta.** Con los topes diarios (`M.ganado`), 10 u es poco; **mínimo riesgo**. La herradura (C6) **no existe**: el diseño ya dice «sin herradura corre normal».
7. **Rendimiento (6 músicos + sonido espacial).** `tickFiestas` ya trabaja con los vecinos del pueblo cercano (hasta 8 con `ruta`); **un solo grupo a la vez** y `setEmitter` con `pos` solo a < 60 bloques (como el carnaval: `v.dist < 60`).
8. **Cultural:** las máscaras (giganta, calavera, diablo) son de cartón pintado con humor; no usar máscaras rituales indígenas. Ya hay `376` y `disguised`: **reusar** y sumar tres ítems más, no un sistema nuevo.

### 2.4 Números

| Concepto | Valor | Contra el código de hoy |
|---|---|---|
| Vela de la novena | gratis (1) o 9 | sin precio; 9 noches = logro |
| Reputación | +1 por vela; +5 mayordomo | `repPueblo`; `factorRep` ya da 0.9 con 5 y 0.8 con 10 |
| Premio del tope | 10 u una vez por fiesta | ≈ 0.4 jornada |
| Mayordomía | 60 u + 20 tamales (≈ 100 u) + 5 bombetas (≈ 7.5 u) | **≈ 168 u comprados** |
| Mostrador ×1.5 | solo con C6 | sin C6 no aplica |
| Chinamos | `SHOPS` del pueblo | cupo 30 u por ítem y pueblo |

### 2.5 Sonidos que hacen falta

| Pedido | Hay en `manifest.json` | Propuesta |
|---|---|---|
| `loop.cimarrona` | **`loop.comparsa`** (1): «Street carnival drums» y «Samba» (CC0); **`cencerro`** (4, «Cowbell»); `loop.marimba` (2) | marcha de **percusión**: `loop.comparsa` + golpes de `cencerro` |
| `cimarrona.golpe` (redoblante) | **no hay golpe suelto**; el redoble está en el lazo de `loop.comparsa` | **recortar un golpe** del lazo existente (`tools/process-sounds.mjs` ya procesa los bancos; un recorte de un CC0 sigue siendo CC0) |
| `cimarrona.nota` (trompeta) | **no hay ninguna trompeta, clarinete ni bombardino** (revisé los 283 créditos: solo `pito` = bocina de carro, `silbato`, `campana`, `tren`) | **Plan A (solo lo que hay):** que el «instrumento» sea **tambor** (golpe recortado) y que la trompeta suene con las **notas de `marimba`/`arpa`** (hay 10 y 7 notas reales: `nota.marimba.41…96`, `nota.arpa.28…101`, ya usadas en `bailarin.js`): suena a fiesta de pueblo, no a cimarrona. **Plan B (recomendado si nanoyackson aprueba):** **bajar 2 archivos nuevos CC0 de Freesound** (una nota de trompeta y una marcha corta de metales) y registrarlos en `manifest.json` con su crédito (es la regla de `THIRD_PARTY.md`: «solo los marcados CC0») |
| Aplausos, campana de la novena, pólvora | **`aplausos`** (2), **`campana`** (2), **`bombeta`** (3) y `f_silbido`/`f_estallido` (CC0) | ya sirven |
| Baile en tarima | **`loop.marimba`** (ya la usa `bailes.js`) | para el día 3 |

**Dicho claro:** con lo que hay se puede hacer una **«cimarrona de redoble»** (percusión y cencerro) que suena a comparsa, **no** a banda de metales. «Suena a banda de fiesta tica» (la pregunta 3 de C8.5) **no se cumple sin un sonido de metales**.

### 2.6 Lista de pruebas en tab-1 (C8-B)

1. Lint, build, `revisar-version.mjs` (ids nuevos), `revisar-nombres.mjs`.
2. **El calendario:** poner `g.day` en un santo del pueblo cercano y revisar los 3 días; el día que coincide con la mascarada global (7), con el carnaval (9) y con el fin de año (11–12): **no** hay dos mascaradas ni dos topes.
3. **Novena:** velas encendidas de noche (1 y 9), vecinos en ruta circular con vela; `+1` de reputación una sola vez por noche.
4. **Tope:** unirse con un caballo; 90 s entre dos jinetes; premio 10 u una sola vez por fiesta; no pisar peatones; con «Movimiento tranquilo».
5. **Cimarrona:** 6 vecinos con instrumento; un solo grupo a la vez; el sonido se apaga a > 60 bloques; **2 pueblos con fiesta el mismo día**: solo suena el más cercano.
6. **Lluvia:** forzar `g.weather` y comprobar que la pólvora de la noche 3 se suspende con aviso.
7. **Mayordomía:** pagar, ser mayordomo, banda puesta; el pueblo lo menciona 24 días; un segundo mayordomo en el mismo pueblo **no** se puede.
8. **Cupo y tope:** premios y chinamos dentro de `CUPO_DIA` y `M.ganado`.
9. **Rendimiento:** con la fiesta y 8 vecinos en ruta, el medidor no sube.
10. **Importar** un mundo con `meta.fiestas` dañado: no rompe.

## 3. C8-C «El Comité de Caminos»

### 3.1 Ids ya corridos

| Rango | Estado |
|---|---|
| Bloque `696` (mojón de camino) | **libre** |
| Ítems `1188` (sello del Comité), `1189` (pase de los Caminos) | **libres** |
| Existentes | `K.placa` (ya existe: `c.placa(...)`), `bus.js`, `ermitas.js`, `repPueblo`, `K.tablon_encargos` (692) |

### 3.2 Funciones y archivos que hay que tocar

| Archivo | Qué |
|---|---|
| **módulo nuevo** `src/comite.js` | la cadena de 6 etapas con su estado en `meta.comite` (opcional, `??`, con `Number.isFinite` al leer) |
| `src/game.js` (`nearestVillage(x, z, cells)`, línea ~2711) y `saberes.js` | «los 5 pueblos más cercanos al hogar, por distancia»: `g.meta.hist.casa` (la casa) y `nearestVillage` con `cells = 4` (`ui.js:2332` ya la usa así); los `v.id` son estables y los datos del pueblo vienen de `pueblogen.js` |
| `src/encargos2.js` | el tablón y la `reputación`; el presidente del Comité (Don Evelio) puede ser un vecino con diálogo largo |
| `src/pueblo.js` (`LINES`) y `modelos-gente.js` | los roles nuevos (presidente, voluntaria, guardacostas, etc.): **solo el presidente** hace falta para C8-C |
| `src/bus.js` | `pasaje = max(1, ceil(d / 400))` unidades (`bus.js:174`): el «bus gratis» es una condición en `busRide`/la compra (`bus.js:156-157`) |
| `src/ermitas.js` | `usarErmita`/`abrirLista`: **no encontré cobro por viajar** (solo hay que poner ermitas a mano y `registrar`): el «viaje por ermita entre ellos sin gastar» **hoy ya es gratis**. **Por confirmar** (leer `abrirLista`) |
| `src/ui.js` (`openShop`, ~línea 1362-1396) | el **mercado regional**: factor por región al precio de compra de la tienda (`price = base * factorDia * feria / fr`, con tope del 90 % de lo que cobra la misma tienda) y al de venta |
| `src/regiones.js` | `regionAt()`: `norte`, `guanacaste`, `caribe`, etc.: la especialidad por pueblo se lee de ahí; **el diseño usa 8 especialidades** (Guanacaste, Valle, Caribe, Sur, Norte, Pacífico, Nuboso, Cordillera): comprobar las **claves reales** de `regiones.js` |
| `src/estructuras.js` (placas) | `placa(...)` en cada plaza al terminar |
| `src/logros-lista.js` | logro «El Comité de Caminos» |

### 3.3 Choques

1. **Depende de tres tandas sin construir.** Etapa 1 pide pómez (C7: `piedra_pomez` 1163 no existe); etapa 2 pide **tabla fina** (C6); etapa 3, **farol forjado** (C6); etapa 4, tejas (hay en la tienda: **sí se puede hoy**); etapa 5, **sopa de mariscos** (C5-A: 1117, no existe) o **tamales** (353: **sí hoy**). **Sustitutos de hoy** que cuadran en precio: mojón de piedra y antorcha (sin pómez), puente de **tablas comunes** (`K.planks`), faroles normales (`K.farol`, 3 u), tejas (`K.teja`) y **tamales**. Se pueden **sustituir las etapas** y cambiar por los de C5–C7 cuando existan.
2. **Costos reales.** Con precios de tienda de hoy: 6 mojones (4 piedra + 1 pómez; piedra sin precio de tienda, `valorRef` 0.3) ≈ **10 u**; puente de 12 tablas finas ≈ **12 u** (con tablas comunes ≈ 3.6 u); 4 faroles forjados: el diseño dice 8 u cada uno = **32 u**, pero materiales reales (2 hierro, vidrio, antorcha) ≈ **3.3 u** cada uno, y el farol normal cuesta 3 u en tienda: la etapa 3 sale **13 u** reales (o 12 u comprados); 20 tejas: **6.25 u** (la tienda; el oficio las valora al doble); **20 tamales: 100 u** (panadería); 10 sopas de mariscos: sin precio (C5-A). **Total hoy ≈ 130–140 u**, no «≈ 80 u»; la recompensa de **200 u** deja **≈ +65 u de neto** (≈ 2.6 jornadas), todavía positiva.
3. **200 u de recompensa «una sola vez»** son 8 jornadas: pasar por el tope del tablón (40 u/día) la reduce a **48 u** ese día; hay que decidir si es premio **fuera de tope** (lo normal con un hito único).
4. **El bus gratis ahorra poco.** El pasaje es `ceil(d / 400)` **unidades**: un viaje de 1 200 bloques cuesta **3 u** (≈ ₡1 500). Un pase de 200 u para ahorrar 3 u por viaje **no es el premio**; el valor está en la placa, la reputación y el mercado.
5. **Mercado regional vs lo que ya hay.** (a) El tope actual es de 30 u por ítem y pueblo (`CUPO_DIA`), no 20; (b) el precio de compra de una tienda ya está **topado al 90 % de lo que la misma tienda cobra** (`ui.js:1384`): un +25 % solo se nota donde esa tienda no vende lo mismo; (c) el día de **feria** (sábado) ya da ×1.25 a las cosechas del feriante: **suma 1.25 × 1.25 = 1.56×** si no se coordina; (d) **la reputación** ya baja precios (`factorRep`: ×0.8 con 10); (e) un **margen neto ≤ 1.2 jornadas por viaje (30 u)** pide un **tope por viaje o por día total**, no solo por producto: 5 productos × 20 u = **100 u** de venta por día. Hay que sumar un tope diario del mercado a `cobrarDelTope`.
6. **Pueblos insuficientes.** El diseño ya prevé 2–5 etapas según los pueblos a < 1 200 bloques (mínimo 2). En `compacto` hay más, en `normal` pueden ser menos de 5: la lista de etapas se arma **al empezar** y se **guarda** (`meta.comite.pueblos` con los `v.id`), para que no cambie al moverse.
7. **Contar obras.** «6 mojones a ≤ 12 bloques de la recta», «un puente sobre el río» y «4 faroles» hay que **detectarlos en el mundo**: mojones y faroles son bloques fáciles de contar (escanear `world.mods` del tramo); **el puente** no es un bloque: hace falta una regla (p. ej. 12 bloques de tabla colocados sobre agua en el tramo) y es **lo más frágil**; alternativa: que el puente sea un **ítem entregable** (12 tablas finas) en vez de una obra.
8. **«Gran Minga»:** los vecinos de 5 pueblos «aparecen» en una tarima: hay que **crear mobs `vecino` con la apariencia de otros** (semillas de cada pueblo) en un solo lugar; con 5 pueblos × ~8 vecinos son 40 mobs. Tope sugerido: **6–10 representantes** (`entities.js` ya limita los mobs cercanos).
9. **Reputación +5 en 5 pueblos** pasa por `repPueblo`: ya hay `factorRep`; +5 en cinco pueblos baja los precios un 10 % en todos: **efecto económico no previsto**.

### 3.4 Números con `precios.js`

| Concepto | Diseño | Hoy |
|---|---|---|
| Materiales | ≈ 80 u | **130–140 u** (con tamales a 5 u) ≈ 90 u si se cocinan |
| Recompensa | 200 u (8 jornadas, una vez) | 48 u dentro del tope del día, 200 u fuera |
| Pasaje de bus | «gratis» | un viaje típico de 3 u |
| Mercado regional | +25 % compra / −15 % venta; cupo 20; margen ≤ 1.2 jornadas por viaje | cupo 30; tope 90 % de la misma tienda; suma con feria (×1.56); sin tope diario total |

### 3.5 Sonidos

La Gran Minga pide «la cimarrona»: lo mismo que §2.5 (percusión + cencerro con lo que hay; metales solo si se baja un CC0 nuevo). Aplausos (`aplausos`) para la ceremonia: ya hay.

### 3.6 Lista de pruebas en tab-1 (C8-C)

1. Lint, build, `revisar-version.mjs`, `revisar-nombres.mjs`.
2. **Mundo con menos de 5 pueblos:** la misión pide 2–5 etapas y no se rompe; con `meta.comite` dañado no lanza.
3. **Cada etapa:** 6 mojones (a ≤ 12 bloques de la recta; con 5 y con 7: cuenta bien), el puente, faroles, tejas, banquete; entregar de menos y de más.
4. **Gran Minga:** la ceremonia con la cimarrona; los vecinos aparecen y se van; no más de N mobs.
5. **Premio:** una sola vez (recargar y volver a pasar), dentro o fuera del tope según se decida; el pase y la placa en las 5 plazas (`placa`); **reputación +5**: ver que los precios cambian de forma razonable.
6. **Mercado regional:** comprar barato en el pueblo del producto y vender caro en otro; con feria el sábado **no** pasa de 1.56×; el tope diario total frena a 30 u de margen.
7. **Bus gratis** con el pase, solo entre esos 5 pueblos; el resto cobra.
8. **Ermitas:** viajar entre las del Comité (por confirmar si algo cambia).
9. **Importar** un mundo con un pueblo que ya no existe en `meta.comite.pueblos`: debe saltar la etapa, no romper.

## 4. Sonidos: resumen único

| Quien lo pide | Sonido | ¿Está en los bancos CC0? | Sustituto |
|---|---|---|---|
| C7 | `sismo.retumbo`, `fumarola.vapor` | **sí** (`rumble`, `loop.hervir`/`rafaga`) | — |
| C7 | volcán, lava, cueva | **sí** (`loop.volcan`, `loop.lava`, `loop.cave`) | — |
| C8-B/C | `loop.cimarrona` | **solo percusión** (`loop.comparsa`, `cencerro`) | cimarrona de redoble |
| C8-B/C | `cimarrona.golpe` | recortable del lazo | `tools/process-sounds.mjs` |
| C8-B/C | `cimarrona.nota` (trompeta) | **no** | notas de `marimba`/`arpa` (Plan A) o **2 archivos CC0 nuevos** (Plan B, decide nanoyackson) |
| C8-B | aplausos, campana, bombetas | **sí** | — |
| C6 (aparte) | `fragua.martillo` | `yunque` (6, «Hammer and anvil») | — |
| C6 (aparte) | `torno.giro` | no | `swish` o `loop.motor` filtrado |

## 5. Dónde entran los topes (para no pagar por fuera)

`encargos2.js` tiene dos frenos distintos: **`CUPO_DIA = 30`** por pueblo+ítem (lo que se **vende a una tienda**) y **`TOPE_DIA = 40`** u/día de ganancia (encargos y, desde la v12.6.3, buzos). Hoy **nada de C7 ni de C8-B/C está dentro de ninguno**. Propuesta: sacar `cobrarDelTope(g, u)` a un módulo neutro y que lo usen todos (observatorio, evacuación, premio del tope, mercado regional, Gran Minga si se quiere topar). El premio de un solo uso (el de 200 u del Comité y la red sísmica de 70 u) **puede ir fuera**, pero con un registro `meta.premios` para que no se repita.

## 6. Orden recomendado y dependencias

1. **C8-B** sin lo de C6 (herradura, mostrador): 1.0 versión; sonidos con el Plan A; el calendario resuelto antes.
2. **C7** (2.0 versiones): primero lo que **no toca el generador** (ítems, sismógrafos, erupción como evento, termal como bloque puesto a mano) y después, en otra versión, **`genVersion` 21** (tubos, termales y observatorio generados).
3. **C8-C** (1.5): con los sustitutos de hoy y las etapas intercambiables; el mercado regional **al final** (es lo que toca precios).

## 7. Decisiones que quedan para nanoyackson

1. ¿La erupción y los sismógrafos funcionan **también en mundos viejos** (sin observatorio)?
2. ¿La patronal **reemplaza** a la fiesta global cuando coinciden?
3. ¿Se acepta la **cimarrona de redoble** o se bajan 2 CC0 de metales (Plan B)?
4. ¿La mayordomía son 60 u **con** los tamales o aparte (168 u en total)?
5. ¿La recompensa del Comité va **dentro** del tope del tablón o **fuera** (hito único)?
6. ¿El pase de caminos pone el bus gratis aunque el ahorro es chico?
7. ¿El mercado regional sube a 30 u de cupo (el de hoy) o se baja a 20 solo ahí?
8. ¿La veta de obsidiana se pica con pico de hierro (tier 3) en vez del de diamante?

*Escrito por la sesión investigadora, solo lectura.*
