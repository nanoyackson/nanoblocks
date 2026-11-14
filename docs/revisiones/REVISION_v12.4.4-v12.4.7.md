# Revisión independiente v12.4.4 → v12.4.7 (encargo 28)

Solo lectura: no edité código ni hice commits. Revisé `git diff v12.4.4..v12.4.7` (v12.4.5 «Más liviano», v12.4.6 «Goteras y mundos del futuro», v12.4.7 «Casa de bahareque»). Las líneas son del tag `v12.4.7`.

**Lo que corrí (todo en el scratchpad o en Node, sin tocar el árbol):**
- **`vite build` completo** a una carpeta aparte (7 s, sin tocar `dist/`) y un script que lee los `import` de cada trozo para buscar ciclos.
- La **generación real del mundo** con `genVersion 17` y `18` en 38–40 semillas, normal y compacto: casitas, agua, pendientes, pueblos y otras estructuras.
- `tools/revisar-mundo.mjs` (copia con `genVersion 18`; el original sigue en 17).

**Lo que NO corrí:** el juego ni el navegador. Lo marcado «por confirmar» necesita jugarse.

---

## Los 5 hallazgos más importantes

### 1. La cura de la mecedora no se guarda: sale de balde guardar y volver (v12.4.4)
- **Dónde:** `muebles.js`, `tickMuebles`: `g.mecedora = { n, cd }` vive en `g`, **no en `meta`**. `danoT` (el «recién golpeado») tampoco se guarda.
- **Qué pasa:** el enfriamiento de 5 minutos solo existe mientras la página está abierta. **Recargar la página** (o cerrar la pestaña) deja la mecedora lista otra vez: 6 curas de 2 de vida (12 de 20) cada ~80 s, indefinidamente. Además, `Game` es **un solo objeto para toda la sesión** (`main.js`: `window.nanoblocks = { game, ui }`), así que el contador **pasa de un mundo a otro** sin recargar: se cura en el mundo A, se entra al B y la mecedora «ya se meció». La v12.4.1 limpió `caidaPend`, `bebeManos` y `rollIntento` al cambiar de mundo (`game.js` ~462); la mecedora quedó fuera.
- **Cómo reproducirlo (por confirmar):** bajar la vida, mecerse 6 curas, «Guardar y salir al menú», volver a entrar al mismo mundo: la mecedora debe curar de inmediato, sin los 5 minutos.
- **La siesta sí queda bien:** `meta.siestaCura` y `meta.siestaDia` guardan el **número del día** (`game.js` ~1654, 1657), se guardan con el mundo y no se pueden repetir; `siestita` solo quita un punto de `sinDormir`.
- **Arreglo:** `meta.mecedora = { n, hasta }` con `hasta = day + time` (el reloj del mundo, que sí se guarda) en vez de `cd` en segundos de `dt`; y `g.mecedora = null` al cambiar de mundo. De paso, pasar `danoT` a `meta` o ponerlo en 0 al entrar.

### 2. Las rutinas de los animales los dejan empujando paredes y cercas (v12.4.7)
- **Dónde:** `finca2.js`, `destinoRutina` y `buscar`; `entities.js` (el bloque `if (rutina)`), que usa **`goTo`**, una línea recta sin esquivar nada (`entities.js:236`).
- **Qué pasa:** `buscar` elige la **casilla techada más cercana** (`tapado`: cualquier bloque sólido de 2 a 9 bloques encima, incluidas las hojas) o la **orilla** más cercana (radio 12–16). No comprueba que el camino esté libre: un animal en un **corral** busca un techo **fuera de la cerca**, o el techo de una casa **al otro lado de la pared**, y camina contra el obstáculo mientras dure el aguacero (>0.5 de intensidad) o la «hora del agua» (0.18–0.28 del día, unos 2 minutos). `R.llego` y `dr < 1.1` son las únicas salidas; **no hay tiempo máximo ni detección de «no avanzo»**.
- **Lo que sí está bien:** no se ahogan. Los animales de tierra en el agua suben (`entities.js:440`, `b.vel.y ≥ 1.5`) y no existe aire para mobs; además `m.body.inWater` apaga la rutina. Tampoco se atoran bajo un techo a medias: `buscar` exige 2 bloques libres arriba del suelo. La gente del pueblo, los mansos, lo que vuela y lo que nada quedan fuera (`m.rutina = null`).
- **Rendimiento (por confirmar):** al empezar el aguacero **todos los animales buscan en el mismo segundo**: hasta 40 animales × ~6 anillos × 8–36 casillas × ~21 `getBlock` ≈ **80 000 consultas en un cuadro** (el caché de 10 s se sincroniza y se vuelve a pedir todo a la vez cada 10 s).
- **Arreglo:** (a) comprobar que la línea recta no cruza un sólido a la altura de los pies y la cabeza antes de aceptar el punto; (b) recordar la distancia al destino cada 3 s y, si no baja en 6 s, marcar el punto como malo por 60 s; (c) repartir las búsquedas (`m.rutinaBusca.t` con un desfase por animal).

### 3. La casita de bahareque le quita estructuras a otras, y tiene 3 detalles mal armados (v12.4.7)
- **Dónde:** `estructuras.js`: `TYPES` (la casita se insertó **después de `carreta` y antes de `estatua`, `capital`, parques…**), `overlaps` (cada tipo solo mira a los de **antes** en la lista) y `buildCasitaBahareque`.
- **Qué pasa:**
  1. **Prioridad.** Como `overlaps` da preferencia a los tipos anteriores, **toda estructura posterior que caiga a menos de `R + 7 + 8` de una casita se descarta**. Medido con el generador real, comparando `genVersion 17` contra `18` con la misma semilla: en mundos **normales** desaparece ~5 % de las estructuras de esos tipos (62 de 1 228 a 600 bloques), y en **compactos**, donde la grilla se divide en tres, ~10 % de las posteriores (p. ej. `orosi` 92 → 82, `capital` 46 → 40 a 900 bloques del inicio). En la semilla 31337 compacta **se pierde `amistad`** cerca del inicio. `revisar-mundo.mjs` con `genVersion 18` sigue en verde (no encima nada, el pueblo queda a menos de 150), porque no cuenta lo que desaparece. Los mundos viejos no cambian (`minV 18`).
  2. **Los postigos no giran.** `postigo` (`blocks.js:660`) no tiene `facing: true`, así que su caja `[0,0,7,16,16,9]` queda siempre en el eje X. `c.set(-3, 2, 2, K.postigo)` y `c.set(3, 2, 2, …)` (las ventanas de las paredes laterales) quedan **atravesadas**: una tabla delgada perpendicular a la pared con el hueco abierto a los lados. **Y al rotar la estructura (4 orientaciones) también quedan mal las dos de al frente**, así que siempre hay **2 de 4** mal puestas. Lo mismo en el **plano 578** (`planos.js`: `ventana` pone el postigo también en las paredes laterales).
  3. **La huerta flota o queda enterrada.** `c.set(-5, 0, z, farmland_wet)` queda **fuera de la cimentación** (`foundation(-4, -4, 4, 5)`): en 841 casitas de prueba, la columna ±5 quedó a la altura del centro solo en 843 de 1 682 casos; **~50 % queda 1 bloque más baja** (tierra arada flotando sobre el aire) y ~21 % 1 más alta (enterrada); el resto ±2.
  - **Lo que sí está bien:** dentro de la caja de 9 × 10 de la casa, **1 de 841** tiene una columna bajo el nivel del mar y **ninguna** supera los 5 de desnivel (39 pasan de 3, el 4.6 %); **0 a menos de 60 bloques de un pueblo** y **0 junto a otra estructura** dentro de `R + 11`. El techo de palma es sólido (`SOLID`), así que protege de la lluvia aunque sea de escalones de media altura.
  - **La cama** va como `c.set(…, K.bed)` sin entidad de bloque, y el resto de las estructuras usan `c.be(x, 1, z, K.bed, { type: 'bed', facing: 0 })` (`estructuras.js:672`). Probablemente se ve y sirve con la orientación por defecto, **por confirmar**.
  - **El plano 578:** 56 de bahareque encalado pagados contra ~60 puestos, 50 de techo contra ~100: **es la misma convención de los otros planos** (los materiales de `mats` no cuadran con lo colocado; los 453 y 454 hacen igual). No es un error nuevo, pero el plano de bahareque sale **más barato de lo que parece**: ~5 jornadas en materiales (14 calcitas, 28 barro, ~80 caña brava, 12 troncos, 8 palos) frente a los 25 u del plano. 📏 revisar con `revisar-plata.mjs`.
- **Arreglo:** (a) mover la casita **al final de `TYPES`** (cede ante los demás y no le quita nada a nadie; solo cambia el orden de prioridad de los mundos nuevos) o ponerle `place` propio; (b) `facing: true` en `postigo` y `postigo_abierto` (como `puerta`), o poner los 4 con una orientación por pared (con `c.be` y `facing`); (c) `foundation(-5, -4, 4, 5)` o poner la huerta dentro de la cimentación.

### 4. `MIN_VERSION` es una constante, no sale del contenido del mundo (v12.4.6)
- **Dónde:** `version.js:9` (`MIN_VERSION = '12.4.7'`), `save.js` (`saveWorld`: `meta.minVersion = MIN_VERSION`, `compararVersion`, `compatibilidad`).
- **Qué pasa:** **cada guardado de cualquier mundo** queda con `minVersion 12.4.7`, tenga o no ítems o bloques de esa versión (un mundo viejo, al guardarse en la 12.4.7, ya no lo abre la 12.4.6). Y **solo funciona si alguien se acuerda de subir la constante** cuando agrega un id nuevo (el `CHANGELOG` de la 12.4.6 ya lo dice: «subir al agregar bloques o ítems»). **No hay una prueba automática** que compare el id más alto de `BLOCKS`/`ITEMS` con lo que dice `MIN_VERSION`. C5 abre un rango de ítems nuevo (`1100+`): olvidar ese salto rompe justo lo que esta función evita.
- **Las comparaciones** (el caso que pidió: «12.10.0» contra «12.4.7»): `compararVersion` compara **número a número**: `12.10.0` vs `12.4.7` da 1 (mayor, bien) y `12.4.10` vs `12.4.9` también. **Debilidades:** un texto con prefijo `v12.4.7` o cualquier cosa no numérica se lee como `0` (**más viejo: se abre sin bloquear**); `12.4.7-beta` cuenta como `12.4.7`; con menos partes, las faltantes valen 0. Un archivo **importado** cuyo `minVersion` no sea texto se ignora (solo se mira `format`).
- **Lo que sí está bien:** los mundos **sin `minVersion`** (anteriores a la 12.4.6) pasan por `format > SAVE_FORMAT` y por `gameVersion` (`avisa` si es más nuevo y compatible, con «Abrir igual» como botón y «Cancelar» con el foco por defecto). La **importación** bloquea antes de leer el resto (`save.js:182`). El botón «Jugar» de la lista es la **única** entrada; no encontré otro `loadWorld` que abra un mundo sin pasar por ahí. Todo juego **anterior a la 12.4.6** (12.4.5 y antes) **no tiene la comprobación**: la protección empieza desde esta versión.
- **Arreglo:** una prueba en `tools/` que cargue `BLOCKS` e `ITEMS` y falle si hay un id registrado por encima de lo que cubre `MIN_VERSION` (por ejemplo, un `minIdBloque` y `minIdItem` junto a la constante); y que `compararVersion` descarte un prefijo `v` y trate lo no numérico como error.

### 5. Los `import()` nuevos no tienen manejo de errores: si falla, queda en blanco sin aviso (v12.4.5)
- **Dónde:** `ui.js` `openLibreta` (`import('./libreta.js').then(...)`, sin `.catch`) y `game.js` (`case 'prueba': import('./pruebas.js').then(...)`, sin `.catch`); `libreta.js` y `pruebas.js` son trozos aparte (`libreta-….js` 3.8 kB y `pruebas-….js` 10.3 kB en el build).
- **Qué pasa:** si el trozo no carga (se publicó una versión nueva y la pestaña vieja pide un `libreta-XXXX.js` que ya no existe, pérdida de conexión), **la libreta se abre vacía** (o con lo de la pestaña anterior: `body.innerHTML` no se limpia al abrir) y **`/prueba` no dice nada**; el error queda como «unhandled rejection» en la consola. Es el caso típico de las páginas estáticas con caché (GitHub Pages).
- **Lo que sí está bien (lo que pidió):** **no queda nada sin inicializar.** `libreta.js` solo exporta `libretaHTML`; los manejadores de clic de la libreta se enganchan **antes** del `import` (`body.dataset.ready`) y las pestañas se pintan con la guarda `this.state === 'libreta' && this.libTab === tab`, que descarta una respuesta vieja si se cambió de pestaña o se cerró. Tampoco hay otro `import` estático de `libreta.js` en `src/`.
- **Arreglo:** `.catch(() => this.toast('No se pudo cargar la libreta: recargue la página', 3000))` y limpiar `body.innerHTML` al abrir; igual para `pruebas`. `/prueba` también devuelve ahora `[]` de inmediato y escribe después: cualquier prueba o herramienta que lea el resultado de `runCommand('/prueba …')` de forma síncrona queda sin nada (no encontré ninguna en `tools/`).

---

## Lo que pidió el encargo, punto por punto

### 1. La regla `enBase` de `vite.config.js` (v12.4.5)
- **¿Un módulo nuevo puede caer mal y crear un ciclo o cargar dos veces? Hoy no.** Corrí el build completo y leí los `import` de cada trozo: **0 ciclos estáticos entre trozos** (`arte`, `base`, `mundo`, `criaturas`, `graficos`, `trama`, `textos`, `three`, `index`, `importar`, `libreta`, `pruebas`). `libreta` y `pruebas` importan del `index` de forma estática, lo cual es normal en un trozo dinámico (el `index` ya está cargado). Tamaños: `index` 481.8 kB, `base` 416.5, `trama` 438.4, `criaturas` 360.8, `three` 521.9, `arte` 303.9; **todos bajo los 700 kB**. «Cargar dos veces» no puede pasar: cada módulo vive en un solo trozo.
- **Por qué la regla es correcta:** `enBase` solo acepta un módulo si **todo** lo que importa de forma estática, hasta el fondo, también puede entrar. Así `base` nunca importa de otro trozo ni del `index`.
- **Lo que la regla NO protege (riesgo de futuro):** los trozos **fijos** (`criaturas`, `mundo`, `trama`…) siguen escogiéndose a mano. Si un archivo de `criaturas` empieza a importar un módulo nuevo que a su vez importa `game.js` o `ui.js`, ese módulo cae en el `index` y `criaturas ↔ index` forma un ciclo: es justo el que dio «vida» y «datos» antes. La regla de `base` no lo ve. Y `textures.js` importa PNG (`import.meta.glob`), que `enBase` rechaza porque no son `.js`: por eso `textures`, `models` y compañía **no caen en la base ni en el arte por la regla**, solo por el manual de la lista.
- **Recomendación:** dejar mi script de ciclos (en el scratchpad, `ciclos.mjs`: lee `dist/assets/*.js` y busca ciclos entre trozos) como `tools/revisar-trozos.mjs`, y correrlo después de cada `vite build`. Cuesta 20 líneas y es la prueba que le falta a la regla.
- **Costo de compilar:** `enBase` recorre el cierre completo de cada módulo sin memorizar los intermedios (solo la raíz): con ~300 archivos el build tardó 7 s, sin problema.

### 2. `compatibilidad(meta)` y `MIN_VERSION`
Ver el hallazgo 4. Resumen de los casos pedidos:

| Caso | Resultado |
|---|---|
| `minVersion '12.10.0'` en un juego `12.4.7` | **bloquea** (10 > 4) ✔ |
| `gameVersion '12.10.0'`, `minVersion '12.4.7'` | **avisa** y pregunta «Abrir igual» ✔ |
| `minVersion '12.4.10'` contra `'12.4.9'` | mayor ✔ (se compara por números) |
| Un mundo **sin `minVersion`** | se mira `format` y `gameVersion`; abre normal ✔ |
| `minVersion 'v13.0'` o texto raro | **no bloquea** (se lee como 0): hay que descartar el prefijo `v` |
| Importar un mundo con `minVersion` mayor | **bloquea** antes de validar (`save.js:182`) ✔ |
| Importar con `minVersion` que no es texto | se ignora; solo cuenta `format` |

### 3. Goteras, cultivos, barril y sudor (v12.4.6)
- **Gotera** (`supervivencia3.js`, `tickMojado`): detecta «hueco arriba, techo en las 4 columnas de al lado, entre 2 y 9 bloques sobre la cabeza».
  - **Falso positivo posible:** un **pozo o un tiro de mina de 1 × 1** abierto al cielo (las 4 paredes de tierra son techo para `tapa`) y un claro de 1 × 1 entre copas. Ahí se moja a **+1 por segundo** en vez de +7 y sale «¡Una gotera!», lo cual **subestima** la lluvia real (benigno).
  - **El capote no aplica:** la rama `else if (gotera)` suma mojado sin mirar el capote, que solo se mira en la rama de la lluvia directa (`lluvia && !capote`). Con capote bajo una gotera se moja igual; el capote debería ganar en las dos.
  - **Bien:** la nueva condición `llueve` **excluye el desierto y la nieve** (`!g.dry && !g.cold`), lo que antes mojaba en la nieve; las partículas son 3 por segundo.
- **Cultivos** (`game.js` ~3019): invierno ×1.25 siempre; verano ×0.85 si no hay agua; la caña (`cane`) no entra (sale antes). Con invierno ×1.25 y colibrí ×1.8 la probabilidad por tick es 0.19: bien. **`!this.hydrated` en verano ignora la lluvia** (si llueve en verano se castiga igual), detalle menor.
- **Barril** (`monte.js`): invierno el doble (1/10), verano evapora 1 por día. **Detalle:** el chequeo de evaporación (`be.secoDia !== g.day`) corre en el mismo tick que la lluvia y **le quita la primera gota de cada día de verano en cuanto cae** (la 2.ª y siguientes sí quedan). Es el «1 por día» de la v12.4.6, pero se nota si llueve en verano.
- **Sudor** (`temporadas.js`): **no respeta «Movimiento tranquilo»** (`calmaActiva`): el diseño de C3 dice que con calma quedan solo el sonido y el texto. Son 2 partículas de sudor y 4 de aire tibio por segundo (8 bloques a la redonda, solo de día con calor). Menor.
- **Hambre con calor:** el factor 3.75 solo al correr (`player.js`): +25 %, bien.

### 4. La casita y el plano 578
Ver el hallazgo 3 (generación real en 38–40 semillas).

### 5. Molienda, yugo, nombre de la mascota, rutinas
- **Día de molienda** (`finca2.js`): `diaDeMolienda` son los días 20 a 22 del verano (30 días). **Paga 1 u por 3 cañas** (₡167 por caña), **menos** que moler uno mismo (3 cañas → 1 tapa de dulce que el pulpero paga a 2 u: 0.67 por caña): **nadie la va a vender**. El logro «Día de molienda» sale con **cualquier venta** de la caña (`ui.js`: `id === 296`). Es ambiente, y está bien como ambiente; solo hay que saber que **no es una fuente de plata**. `comprasMolienda` se calcula 3 veces por cada apertura de tienda (barato).
- **Yugo** (`stations.js` + `finca2.js: yugoCerca`): no hay ítem: **basta tener la carreta con bueyes a menos de 4 bloques** del trapiche (el de C6 la pide después). El trapiche muele **el doble** de rápido (3 s por tanda). Recorre **todos los mobs** por cada trapiche con 3 o más cañas y por cuadro de estaciones; sin problema hoy (muy pocas veces).
- **El nombre de la mascota** (`ui.pedirTexto`, `mascotas.js`):
  - **No hay HTML:** el nombre se dibuja en un `canvas` (`ponerEtiqueta`) y en los avisos pasa por `textContent`; se quitan `<` y `>`. Seguro.
  - **Largo:** 16 unidades UTF-16: **un emoji ocupa 2**, y el `.slice(0, 16)` puede **partir un emoji por la mitad** (queda un «�» y, si está al final, el nombre acaba con un carácter inválido).
  - **Se aceptan** espacios de ancho cero y marcas de dirección (U+200B, U+202E): se puede poner un nombre «invisible» o invertido. Solo cosmético.
  - **Una etiqueta de 16 letras anchas** da un sprite de **hasta ~4.5 bloques de ancho** sobre un perro de 0.5: se ve enorme.
  - **No pausa el juego:** `pedirTexto` suelta el mouse (`exitLock` con `suppressPause`) pero el estado sigue en `playing`: de noche, con Sombras cerca, escribir el nombre es arriesgado (suele pausar solo el inventario y la libreta).
  - El foco y las teclas están bien (`stopPropagation` en `keydown` y `keyup` del velo; Esc cancela, Enter acepta).
- **Rutinas:** ver el hallazgo 2.

### 6. Mecedora y siesta con el guardado
Ver el hallazgo 1: la **siesta queda bien** (se guarda en `meta`), **la mecedora no**.

---

## Para la constructora, en orden
1. Mecedora: `meta.mecedora = { n, hasta }` y reinicio al cambiar de mundo (hallazgo 1).
2. Rutinas: comprobar el camino, tiempo máximo y reparto de búsquedas (hallazgo 2).
3. Casita: al final de `TYPES`, `facing` en el postigo, cimentación hasta x = −5 (hallazgo 3).
4. `.catch` en los `import()` de `libreta` y `pruebas` (hallazgo 5) y `tools/revisar-trozos.mjs` con mi script de ciclos.
5. Una prueba que ate `MIN_VERSION` al id más alto de bloques e ítems, y `compararVersion` robusto a `v` y texto (hallazgo 4).
6. Gotera: que el capote también la cubra; sudor y partículas de calor con `calmaActiva`.

*Escrito por la sesión investigadora. Solo lectura: no se corrió el juego; las cifras de generación salen del generador real en Node.*
