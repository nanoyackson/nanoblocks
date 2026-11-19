# Rodeo de lugares con gente y flora propia (generador 31)

Investigación de solo lectura (19-nov). No se tocó `src/` ni `tools/`: todo se midió importando el árbol de trabajo (v13.6.0, generador 31) o en una copia con un prototipo. Scripts, lista de tipos y el parche de prueba en `docs/revisiones/scripts_integracion/rodeo_flora/` (parche: `RODEO_FLORA.patch`, contra `src/carreteras.js`, sin CRLF, no aplicado).

**Resumen:** (1) hoy un camino cruza un lugar con gente que no es pueblo en **1 de cada 5 tramos** (97 cruces en 79 de 363 tramos, 6 semillas); el rodeo de pueblos ajenos casi no tenía nada que arreglar (1 caso en 177 tramos con el generador 30). (2) El rodeo **barato existe**, pero solo con los tipos del principio de la lista de obras: **27 tipos, costo 0 a +170 ms en la primera llamada y −44 % de cruces**. Poner los 58 tipos cuesta **+1,7 a +2,9 s** y quita −64 %. (3) De 48 lugares con gente al aire libre, **24 quedan pelados de plantas** y 31 sin árboles; solo los 5 típicos tienen `flora()`. **Recomendación: sí, las dos cosas, la versión barata, en un generador nuevo** (ver §5).

## 1. Qué es un «lugar con gente que no es pueblo»

Se tomaron los 90 tipos de `estructuras.js` y se separaron (lista en `tipos.json`, columna `npc` = el constructor del lugar pone un NPC):

| Grupo | Tipos | Se cuenta |
|---|---|---|
| Del pueblo | `feria_pueblo`, `cementerio_pueblo`, `casita_bahareque` | No (son del propio pueblo; ver nota al final de §2) |
| Con camino (`ROAD_TO`, 18) | capital, basílica, ruinas, fortín, estadios, estación, refinería, playa de lujo, sanatorio, hacienda, beneficio, muelle de Limón, Marino Ballena, Monteverde, Grecia, Zapote, aeropuerto | Sí, cuando el tramo no es el suyo |
| **Gente (otros), 58 con los típicos** | faro, Churchill, caldera, carreta, mirador Poás/Arenal, refugio, Guanacaste, Tárcoles, templo de música, metálico, Correos, Museo de los Niños, Coronado, Ujarrás, Santa Rosa, esferas, aduana, trapiche, bananera, catarata, puente colgante, Rincón de la Vieja, Barra Honda, parques (Corcovado, Palo Verde, Braulio, Juan Castro, Carara, Amistad, Rincón…), **feria**, cacaotal, lechería, canopy, termales, cerro de la Muerte… + los 5 típicos y 7 de desierto/ruinas | Sí |
| Sin gente | cuevas y geodas (`cueva_*`, `geoda_mayor`, `caverna_rey`, `templo_hundido`, `catarata_escondida`), cumbre, estatua, fuente, cementerio | No (aparte, en §2) |

## 2. (a) Cuántos tramos los cruzan hoy

Ventana de 6 000 × 6 000 alrededor del inicio, generador 31, caches en frío (`cruces.mjs`). Un tramo «cruza» un lugar si algún punto del camino queda a menos de `R + 4` de su centro (la misma regla que el rodeo de pueblos: `v.L + 4`); se descartan los lugares que son el destino del propio tramo, los que están pegados a sus extremos y los que caen dentro del radio de un pueblo (ya los cubre el rodeo de pueblos).

| Semilla | 101 | 202 | 303 | 404 | 505 | 606 | **Total** |
|---|---|---|---|---|---|---|---|
| Tramos en la ventana | 49 | 63 | 65 | 75 | 57 | 54 | **363** |
| Cruces con lugares con gente | 12 | 16 | 22 | 21 | 12 | 14 | **97** (79 tramos = **21,8 %**) |
| Cruces con pueblos ajenos (gen 31) | 0 | 0 | 0 | 0 | 0 | 0 | 0 |

- **El rodeo de pueblos casi no tenía trabajo:** con el generador 30 (sin rodeo) solo 1 de 177 tramos (101, 202, 303) pasa por un pueblo ajeno. Los lugares con gente son ≈ 50 veces más.
- **De los 97:** 80 con lugares sin camino propio (los 58 tipos) y 17 con obras `ROAD_TO` (15 tramos). **Al centro** (a menos de la mitad de R): 38 de 97. Por tipo de camino: lastre 44, cantonal 36, nacional 17.
- **Los más cruzados** (6 semillas): carreta 10, Santa Rosa 6, termales 5, trapiche 5, Guanacaste 4, lechería 4, canopy 4, Rincón (parque) 4, beneficio 4 (ROAD_TO), Tárcoles 3, catarata 3, Barra Honda 3, mirador Poás 3, templo de música 3, Rincón de la Vieja 3; el resto 1-2 (Zapote, capital, estación, Monteverde, bananera, Coronado, metálico, feria…).
- **Qué se ve:** los caminos se dibujan antes que las obras (`worldgen.js:145` y `:149`), así que donde coinciden **la obra pisa el camino**: el camino aparece cortado por el borde o el cuerpo del lugar y sigue del otro lado. R es el radio de reclamo, no la huella real, así que parte de los 97 son roces del borde (D medio / R = 0,64).
- **Aparte** (no cuentan arriba): 25 cruces con entradas de cueva (`cueva_venado` sola: 12), 24 con lugares sin gente (cumbres, estatuas), y 87 cruces con la feria o el cementerio **del propio pueblo** (76 tramos salen del pueblo rozando su feria o cementerio; solo 9 al centro). Esto último es otro asunto (el camino de salida), no del rodeo.

## 3. (b) Cuánto cuesta un rodeo barato

Hoy `obrasAjenas` (carreteras.js) solo usa `villageAt` (caché, gratis). Para sumar lugares hay que llamar a `structuresNear(gen, mx, mz, R, EXTRA, cellOk)` por tramo, con `cellOk` solo para las celdas a menos de `0,3 · largo + 30 + celda · 0,71 + R` de la línea del tramo (no un radio grande). Prototipo en `RODEO_FLORA.patch`.

**El costo no depende de cuántos tipos se piden, sino de cuál es el último de la lista.** `placeOf` comprueba cada tipo contra **todos los anteriores** de la lista (`overlaps`): pedir `hacienda_vieja` (casi al final) obliga a calcular antes los 87 anteriores, y ahí están los caros. Costo marginal medido en frío en una ventana de 2 000 × 2 000 (semilla 303, `ptipo.mjs`): feria 232 ms, cueva_venado 525, zapote 160, cueva_barra_honda 139, termales 120, san_lucas 99, rincón_parque 94, amistad 82, esferas 81, marino_ballena 66; los primeros 33 tipos suman 144 ms y los primeros 43 suman 311 ms, de un total de 2 090 ms.

Caminata de 3 000 bloques con `roadsNear` cada 16 (`m1.mjs`, máquina libre, un proceso). Primera llamada / total (ms), semillas 101 · 202 · 303:

| Conjunto extra | Tipos | Primera llamada | Total caminata | Cruces (6 sem., pen. 150) |
|---|---|---|---|---|
| Nada (hoy) | 0 | 125 · 299 · 790 | 480 · 718 · 961 | 97 |
| **EARLY** (hasta Santa Rosa, antes de las esferas) | 19 | 180 · 390 · 795 | 542 · 747 · 963 | 67 (−31 %) |
| **MEDIA** (EARLY + esferas, aduana, trapiche, bananera, catarata, puente colgante, Rincón de la Vieja, Barra Honda) | 27 | 285 · 470 · 704 | 498 · 769 · 865 | **54 (−44 %)** |
| Solo `ROAD_TO` | 18 | 309 · 808 · 877 | 597 · 964 · 1 115 | n/m |
| «Barata» (34 tipos, con trapiche… hacienda_vieja) | 34 | 1 699 · 3 109 · 2 832 | 2 822 · 3 548 · 3 554 | n/m |
| Todo (58) | 58 | 1 715 · 3 169 · 2 887 | 2 877 · 3 594 · 3 583 | **35 (−64 %)** |

- El ruido entre corridas es de ≈ ±100 ms (303 con MEDIA salió *menos* que sin nada), así que EARLY y MEDIA son **ruido a +170 ms** en la primera llamada, sin cambio en el resto de la caminata. En cambio, cualquier conjunto con un tipo del final de la lista cuesta lo mismo que todos (+1,7 a +2,9 s en la primera llamada, la de la pantalla de carga): **no es aceptable** (la regla es ≤ 12 ms por trozo; esa es la razón por la que el 29 y el 31 lo quitaron).
- **Con la penalización de hoy (+60 por muestra dentro de una obra) el rodeo casi no sirve:** con los 58 tipos solo baja de 50 a 35 cruces (3 semillas); con +150 baja a 17; con +400 queda en 18 (no mejora). Hay que subirla a **150**; sobre los pueblos no cambia nada (1 caso en 177).
- **Lo que cuesta el trazado:** con MEDIA + 150, 49 de 362 tramos (13 %) cambian de curva y el largo medio sube 10 bloques en los que cambian (≈ +3 %); el largo medio total pasa de 317,7 a 318,7.
- Los 17 cruces con `ROAD_TO` y los de tipos fuera del conjunto se quedan. Poner además los 18 `ROAD_TO` suma +90 a +500 ms en la primera llamada: no vale la pena aparte.
- Con `calentarObras` (la 13.5.5 ya lo tiene) las celdas de los tipos que se agreguen se calientan de a cuadros al caminar; eso no cambia la primera llamada (pantalla de carga).

## 4. (c) Qué lugares quedan pelados de flora

Hoy `flora(c, R, n, plantas)` (`tipicas.js:12`, solo `gen.version >= 31`) la usan **solo 5 builders**: Mirador de la Neblina (R9, 45), Cairn (R8, 110), Campamento del botánico (R9, 150) y Hacienda vieja (R13, 50); el Muelle siembra matas sobre la baranda. Ningún otro de los 85 tipos llama `flora(`.

Medición real (`verde.mjs` + `vd2.mjs`): se generan los trozos de 2 lugares de cada tipo en 4 semillas (8 por tipo) y se mira la cara de arriba de cada columna dentro de R (muestreo cada 2 bloques) contra un anillo de referencia a R+4 … R+18. «Plantas» = bloque `cross`; «hojas» = copa de árbol.

**Con gente y al aire libre (48 lugares), 24 tienen plantas dentro < 40 % del anillo** (plantas dentro % / anillo %), ordenados de más a menos pelado; `*` = tiene camino (`ROAD_TO`):

rincón_parque 0/4,6 · templo_música 0/5,2 · zapote* 0/3,8 · capital* 0,4/4,7 · hacienda* 0,6/3,6 · **lechería 0,7/5,3** · **santa_rosa 0,7/4,5** · mirador_arenal 0,8/7,9 · beneficio* 0,8/4,5 · juan_castro 0,8/12,0 · **termales 1,1/4,7** · **correos 1,2/6,8** · **feria 1,2/5,2** · monteverde* 1,3/6,4 · **metálico 1,4/6,3** · fortín* 1,4/4,2 · **museo_niños 1,7/5,9** · tenorio 1,9/5,4 · corcovado 1,9/6,9 · refugio 2,0/27,5 · guanacaste 2,3/7,2 · cerro_muerte 3,1/12,1 · sanatorio* 3,1/7,9 (y la feria del pueblo 1,1/5,1).

- **Árboles:** 31 de los 48 tienen en el interior menos de la cuarta parte de la copa que hay en el anillo (el claro de la obra se quedó sin árboles). `flora()` no siembra árboles; solo plantas.
- **Ya bien servidos:** trapiche (54 % de plantas, siembra propia), cacaotal, bananera, canopy, Guanacaste (copa 69 %), amistad_parque, braulio, carara, Monteverde (copa); los 5 típicos con `flora()` quedan por encima del anillo en plantas (campamento 15 / 3, hacienda vieja 6,1 / 3,4, mirador 15,8 / 13,8; el cairn queda en 16,6 / 28 por estar en altura).
- **Pelados que no importan** (excluidos): cuevas, volcanes y cumbres (suelo desnudo natural), islas, estadios y refinería (el techo es lo de arriba), playa y muelles.
- La diferencia en absoluto es chica (el anillo tiene sólo 4-8 % de plantas), pero a la vista pesa: un lugar con gente rodeado de pasto y flores alto con el interior de tierra pelada (feria, lechería, correos, metálico, termales).

**Costo de sembrar:** `flora()` hace *n* intentos (45-150) de leer y escribir un bloque en el propio trozo; es un costo por trozo con lugar, sin tocar `structuresNear` ni los caminos (no medido por separado; frente a ≈ 6 ms por trozo es < 1 %).

## 5. (d) Lista concreta y recomendación

**Rodeo: hacerlo, en su versión barata.**
1. **Conjunto MEDIA (27 tipos):** faro, Churchill, caldera, carreta, estatua, Guanacaste, Tárcoles, metálico, Correos, Museo de los Niños, Coronado, Santa Rosa, Ujarrás, monumento nacional, templo de música, mirador Poás, mirador Arenal, refugio, Orosí, esferas, aduana, trapiche, bananera, catarata, puente colgante, Rincón de la Vieja, Barra Honda (`gente_media.txt`; los 19 primeros son `gente_early.txt`). Siempre que sea un conjunto **cerrado en un prefijo de la lista de `estructuras.js`**: si se añade un tipo al final de la lista, vuelve el costo de 2-3 s (vale una prueba en `revisar-caminos` que mida la primera llamada y falle si pasa de, p. ej., +400 ms).
2. **Penalización de 60 a 150** (`cost += 150` en `mejorCurva`, sin efecto sobre pueblos).
3. **No incluir** feria, termales, lechería, canopy, cacaotal, hacienda vieja, campamento y los parques del final (son los que arrastran 232 + 120 + … ms por cascada). La feria y los termales, que son los más visibles, **se quedarían cruzados**: la forma de atenderlos sin costo es moverlos a una posición anterior en la lista (cambia dónde caen las obras: huella; no se recomienda) o aceptar el cruce.
4. Resultado esperado (6 semillas): 97 → 54 cruces (−44 %), 79 → 45 tramos (22 % → 12 %), +0 a +170 ms en la primera llamada.

**Flora: hacerla (barato, sin costo de mundo).** Ponerla en estos 19 builders en este orden de visibilidad (plantas del bioma con `flora(c, R, n, plantas)`): feria (R19, n≈60), lechería (R22, 70), santa_rosa (R23, 70), termales (R14, 40, helechos y bromelias), correos (R15, 45), metálico (R17, 50), museo_niños (R19, 55), aduana (R23, 60), esferas (R15, 45), catarata (R21, 60), barra_honda (R13, 40), templo_música (R12, 35), mirador_arenal (R5, 20), refugio (R7, 25), tenorio (R26, 70), corcovado (R18, 60), cerro_muerte (R15, 40, pajón), juan_castro (R19, 60), rincón_parque (R24, 60). Los `ROAD_TO` pelados (hacienda, beneficio, sanatorio, basílica, capital, Grecia, zapote, estación) también, con n más alto. El `n` es de partida y debe afinarse mirando 2-3 lugares en pantalla (no se miró a ojo).

**Versión:** los dos cambian bloques de mundos ya existentes del 31 → generador nuevo. `PLAN_HONDURA.md` ya reserva el **32**; esto iría en el **33**, o junto con el 32 si Isaac prefiere un solo salto. Ambos gatean con `gen.version >= N` y los mundos menores salen idénticos (huella en `tools/huella-mundos.mjs`).

**Lo que no hice:** no corrí el juego con el parche ni miré a ojo los caminos rodeados (solo geometría y tiempos); la medición de flora lee la cara de arriba de cada columna, no distingue maleza de plantas puestas por el bioma; la prueba de costo es de Node, no del navegador (allí los ms son ≈ 2×).
