# Costo de calcular los tramos de camino (`roadsNear`)

Investigación de solo lectura (17-nov). No se tocó `src/` ni `tools/`: todo se midió en copias del repo (HEAD v13.5.0 y el árbol de trabajo con el generador 31 en curso) y los scripts están en `docs/revisiones/scripts_integracion/costo_tramos/`. Medición de `tools/revisar-rutas.mjs`: `roadsNear(gen, x, z, 12)` cada 16 bloques en 3 000 bloques desde el inicio, generador nuevo por semilla (cachés en frío), Node 24, un hilo.

## 1. Qué semilla y qué llamada dan los ~4 s

**Resumen:** los 4 s **no son el costo real**: salen de medir con la máquina ocupada. Solo, el mismo experimento da **0,6 - 1,0 s**, y es siempre **la primera llamada (la del inicio, d = 0)**.

| Prueba | Semilla 303, gen 30, primera llamada |
|---|---|
| 24 procesos a la vez (6 semillas × gen 28, 29, 30, 31) | **3 832 ms** (gen 30), 3 851 (gen 31) |
| Un proceso solo | **987 ms** (gen 30), 976 (gen 31) |

La relación es 3,9× (la máquina tiene menos núcleos que procesos): coincide con los 3,9-4,1 s que vio la constructora. Con la semilla 202 sola da 0,6 s (0,55 s en su medición). Las 6 semillas **solas**, primera llamada, gen 28 / 30 / 31 (ms):

| Semilla | 101 | 202 | 303 | 404 | 505 | 606 |
|---|---|---|---|---|---|---|
| Gen 28 | 683 | 588 | 898 | 513 | 656 | 581 |
| Gen 30 | 751 | 598 | **987** | 563 | 719 | 600 |
| Gen 31 | 694 | 625 | 976 | 557 | 720 | 607 |

La peor semilla es la **303** (≈ 1 s). **Cuándo pasa:** el 85-90 % del tiempo total de la prueba es esa primera llamada, que en el juego ocurre **al generar el primer trozo del inicio**, o sea **dentro de la pantalla de carga** (el primer trozo en frío tarda ≈ 2,8 s en Node; de ellos ≈ 1 s es esta llamada). Después `roadsNear` en el mismo sitio cuesta 0-1 ms (caché).

**Al caminar** sí hay tirones, pero más chicos: entre 3 000 bloques, 2-4 llamadas de **150-260 ms** cuando la ventana de tramos entra a otras celdas de 384 bloques (en d ≈ 400, 1 136, 1 520-1 568 y 2 288 según la semilla); el resto de llamadas cuesta < 50 ms. Esos tirones de 150-260 ms son lo que se ve «congelado» al caminar.

## 2. Qué parte cuesta (perfil de CPU, semilla 303, gen 30, primera llamada)

| Parte | ms (inclusivo) | % de `roadsNear` |
|---|---|---|
| `roadsNear` → `segmentsIn` | 1 234 | 100 |
| **`structuresNear` (las obras ROAD_TO: `placeOf` → `overlaps`)** | **1 161** | **94** |
| `column()` llamado desde ahí (≈ 340 000 llamadas, casi todas distintas: 1 % repetidas) | 1 084 | 88 |
| de eso, `shapeColumn` (volcán y cerro) | ≈ 530 | 43 |
| `noise2` / `fbm2` | 266 | 22 |
| `volcanoIn` + `cerroIn` (propio, claves de texto en un `Map`, 9 + 9 por columna) | 194 + 145 | 28 |
| `linksOf`, `villageAt`, `makeSegment`, `mejorCurva` | < 60 | < 5 |
| `findSpawn` | 1-2 | 0 |

**Lectura:**
- **No son los tramos ni los pueblos**: `makeSegment` y `linksOf` pesan < 5 %. El costo es **buscar las obras con camino** (`ROAD_TO`, 18 tipos) dentro de un radio de 650-1 100 bloques: para colocar una obra hay que evitar solaparse con **todos los tipos anteriores de la lista** (`overlaps`), y cada uno prueba hasta 14-240 puntos con `column()`. Ahí se evalúan ≈ 7 000-11 000 celdas de obra (≈ 25 % con obra) y ≈ 200 000-340 000 `column()` (2,7 µs cada una).
- Las celdas grandes dominan: `zapote` (celda 2 400, 60 intentos) 174-251 ms por celda, `marino_ballena` (240 intentos) 206 ms, `monteverde` 62-178 ms: 5 de 72 celdas de primer nivel son el 60 % del tiempo.
- **Cachés en frío:** todo lo anterior es cachés vacíos (`structCache`, `roadLinks`, `roadCache`, `volcanoCache`); con cachés tibios, 0-1 ms. Estos mismos cachés los necesita después la generación de trozos (las obras), por eso gran parte es un costo de arranque inevitable, no un desperdicio.

## 3. Desde qué versión ocurre

**Desde siempre.** El barrido de obras `ROAD_TO` es de la v2.33.0 (caminos a los monumentos) y la primera llamada cuesta lo mismo en todos los generadores, medido con la semilla 303 sola:

| Generador | 6 | 13 | 22 | 24 | 27 | 28 | 30 | 31 |
|---|---|---|---|---|---|---|---|---|
| Primera llamada (ms) | 526 | 628 | 624 | 623 | 851 | 898 | 987 | 976 |

El gen 29 no es un salto: la v13.4.2 ya había quitado el costo extra que se había añadido a `makeSegment` (4,6 s). Sube ≈ 10-20 % entre 24 y 30 porque `column()` creció (volcanes en gen 27, `GEN_SUPERFICIE`). El gen 31 no cambia el costo (976 vs 987). Con la máquina libre ningún generador pasa de 1,0 s en la primera llamada.

## 4. Arreglos posibles (deterministas, iguales en anfitrión e invitado, sin cambiar la huella)

Ninguno cambia un solo bloque: solo cambia **cuánto se calcula**, no **qué**. Verificado en una copia con los dos arreglos A y B juntos: `column()` en 6 068 puntos y `roadsNear` en 10 201 consultas por semilla, idénticos (id, largo, extremos y suma de control de cada tramo, y el orden) en gen 22, 27, 30 (semillas 101, 202, 303, 404) y gen 31 (202, 505), y trozos reales generados idénticos (hash, 6 trozos). Cero diferencias en todo.

**A · Los volcanes y cerros del vecindario, por celda (−45 %).** `shapeColumn` pregunta 9 volcanes y hasta 9 cerros por cada columna, cada pregunta con una clave de texto (`${cx},${cz}`). Se guarda la lista de los (≤ 2) que existen alrededor de cada celda, en el mismo orden (`volcanesCerca`, `cerroVec`), y la columna recorre esa lista. **Gana en todo el juego**, no solo en caminos (todo `column()` y la generación de trozos).
- Medido: primera llamada **987 → 540 ms**, total de la caminata **1 250 → 670 ms**, semilla 303 gen 30. Primer trozo en frío 2,8 → 1,5 s.
- Riesgo: ninguno de contenido (mismo orden, mismos valores); +2 `Map` pequeños por generador. Esfuerzo: 1 hora. Archivos: `worldgen2.js` (`shapeColumn`, `cerroNear`).

**B · Solo buscar obras donde hay un pueblo cerca (−10 a −75 % extra).** Un camino a una obra sale siempre de un pueblo a ≤ 450 bloques de la obra, así que un tramo que toque la consulta nace a ≤ ~700 bloques de ella. Si en la ventana no hay pueblo, no se buscan obras; si lo hay, solo las celdas a ≤ 450 de él (`structuresNear(..., cellOk)`, mismo orden de recorrido). Medido encima de A: semilla 101 total 579 → 338 ms (primera llamada 377 → 92), semilla 202 567 → 503 (peor 342 → 266), semilla 303 668 → 653 (casi nada: hay pueblo en el inicio).
- Riesgo: depende de que ningún camino a obra se aleje de su pueblo más de ~700 (hoy el máximo es 450 + curva + salida del pueblo); verificado igual en 10 201 consultas × 6 pruebas, pero conviene dejar una prueba en `revisar-rutas` que compare contra la búsqueda completa en 2 semillas. Con el rodeo de obras ajenas del gen 31 no cambió nada. Esfuerzo: 2-3 horas.

**C · Repartir el costo en cuadros (para que ninguna llamada pase de ~16 ms, y sin cambiar nada).** Hoy cada celda de obra se calcula sincrónicamente la primera vez que alguien la pide. Se agrega `calentarObras(gen, x, z, presupuestoMs)`: el juego la llama cada cuadro con 4-6 ms para recorrer, en el mismo orden de siempre, las celdas de obra de la ventana de camino **siguiente** (cuando el jugador está a ≤ 150 bloques del borde de la celda de 384), de modo que al cruzar los cachés ya estén tibios. Es idéntico porque el resultado depende de la semilla y no del orden (los cachés solo guardan).
- Límite: una sola celda grande puede tardar 150-250 ms (`zapote`, `marino_ballena`, `monteverde`); sin partirla por dentro no se puede bajar de eso. Solución parcial: ordenar esas celdas para calentarlas **primero y durante la pantalla de carga**. Con A+B ya bajan a 60-100 ms.
- Esfuerzo: 1 día. Riesgo: bajo en el resultado (solo cachés), medio en la integración (hay que llamarla desde `game`/`world`).

**D (descartado) · Reducir `tries` de los tipos grandes.** Cambiaría dónde caen las obras (huella). No.

## 5. Recomendación

1. **A + B ya** (un commit pequeño, 3-4 horas), con la prueba de equivalencia (`ver.mjs` y `chk.mjs` de la carpeta, o una versión recortada dentro de `revisar-rutas`). La primera llamada pasa de ≈ 1,0 a 0,1-0,5 s y los tirones al caminar de 150-260 ms a 70-100 ms (peor medido tras A+B: 303 → 541 ms en el inicio; 202 → 305 ms en d = 1 520).
2. **C** si después quiere que ninguna llamada pase de un cuadro; no es necesaria para entrar al mundo.
3. **Arreglar la prueba de costo de `revisar-rutas`:** compara contra «gen 28 + 25 %» dentro del mismo proceso, así que el ruido de la máquina ocupada (3,9×) no debería romperla, pero un tope absoluto (p. ej. 4 s) sí. Sugerencia: tomar el **mínimo de 3 repeticiones**, o comparar solo la relación contra el 28, nunca valores absolutos de ms.

Medidas finales (gen 31, primera llamada solo, antes → con A + B): 101: 703 → 103 ms · 202: 607 → 305 · 303: 959 → 541 · 404: 572 → 328 · 505: 724 → 521 · 606: 683 → 245. Total de la caminata: 1 126 → 386, 1 041 → 557, 1 215 → 661, 1 153 → 630, 996 → 784, 1 034 → 477.

Parche de referencia (no aplicado): `scripts_integracion/costo_tramos/COSTO_TRAMOS.patch` (contra HEAD, sin CRLF).
