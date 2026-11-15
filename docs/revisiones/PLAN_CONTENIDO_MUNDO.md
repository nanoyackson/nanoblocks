# Plan de contenido del mundo: cuevas, biomas y balance (v13.4.x)

> Los §1-§8 son el plan de cuevas. Los §9-§11 (biomas, criterio de balance para todo y orden revisado) se añadieron después a pedido de Isaac y **mandan** sobre §3 (frecuencia de lugares) y §7 (orden) cuando se contradicen.

Investigación de solo lectura sobre `master` en la v13.3.2 (generador 25: Red Honda y Salones). Pedido de Isaac: «agregue más contenido en las cuevas», con los cuatro pilares marcados: **1** salones con carácter, **2** lugares para descubrir, **3** criaturas y peligros, **4** minerales y botín (el C2 del `PLAN_CUEVAS.md`, que ahora sí entra). Sin cambios en `src/`. Los números de minerales salen de generar 1 024 trozos en 4 semillas (`scripts_integracion/ores.mjs`, generador 25); los de balance, de `BALANCE_PICAR.md`, `BALANCE_PROGRESION.md`, `precios.js`, `jefes-balance.js` y `MAPA_ECONOMIA.md`. Todo nombre, criatura y aspecto es original y tico.

**Idea central.** El salón ya existe (CM1) pero todos son «una sala vacía». Cada nodo de la Red Honda recibe un **tipo** que sale de `hash3` (y del bioma de arriba y la profundidad), y de ese tipo cuelga todo: decoración, sonido, criaturas, peligro, veta y, en casi la mitad, un **lugar** construido. Así el contenido se reparte solo y encaja con la red de venas que ya está.

## 1. Punto de partida (medido)

| Dato (generador 25, por trozo, promedio) | Valor |
|---|---|
| Carbón / hierro / hierro hondo | 31,7 / 34,4 / 2,5 |
| Oro / oro hondo | 10,2 / 6,7 (**16,9**) |
| **Diamante / diamante hondo** | 1,8 / 10,1 (**11,9**, casi todo entre y 3 y 17) |
| **Jade** | 0,67 (y 0-14) |
| Racimos de cristal / bloques de cristal | 6,9 / 2,4 |
| Cuarzo / calcita / hongo brillante / estalactita / estalagmita | 2,5 / 5,0 / 4,7 / 4,4 / 3,9 |
| Aire subterráneo, trozos con cueva | ≈ 3 500 bloques por trozo, 83 % de los trozos |
| Tiempo de generar un trozo (Node, un hilo) | 6,8-8,7 ms normal, 7,9-9,9 ms en pueblo (meta ≤ 12) |

**Lo que ya existe y se aprovecha:** sitios kársticos (Barra Honda, Venado, Geoda mayor; `cuevas.js`), Caverna del Rey (`caverna.js`, jefe `rey_murcielago` 130 de vida), Mina de Abangares (`minaoro.js`, vagoneta), derrumbe de mina con puntales (`mina.js`), fauna de la 13.1.2 (cangrejo ciego 6 de vida, grillo 4, escarabajo de calcita 10; tope total 6 y por zona 3; `cuevavida.js`, solo la hace aparecer el anfitrión), murciélago y vampiro (5 de vida, muerde 1), hongos reventones (`hongos.js`), casco de espeleólogo (id 1167), oscuridad y lava por profundidad (v13.2.0), libreta con bestiario y diario (`anotar`), y el tope de jefes por día de `precios.js`.

**Anclas de balance que no se tocan:**
- Valores de venta (₡500 por unidad): oro **10 u** (₡5 000), diamante **15 u** (₡7 500), jade **25 u** (₡12 500). Una jornada ≈ 25 u (₡12 500); `TOPE_DIA = 40` para encargos y buzos.
- Daño: tope ×2 (v13.2.6); espada de jade con todo al máximo 15,9; defensa con piso ×0,62. Enemigos comunes: Sombra 20 de vida y 3 de golpe, chupacabras 30 y 4. Minijefes (T3): vida 50-150, `dano` ×0,6-1,45, pagan **7-10 u una vez por día de juego** y el 10 % las demás (`PREMIO_BAJA`, `MINIJEFE`).
- Picar: `breakTime` con bonos sumados y tope ×1,5; regla de oro: a igual nivel de bonos manda el material (`revisar-picar.mjs`). **Ningún bloque nuevo puede dar un tiempo de picar menor que su equivalente**: las vetas usan los mismos minerales (misma dureza y tier), y lo nuevo (cristal puro) queda en dureza 2,5, tier 1.

## 2. Pilar 1 — Salones con carácter

Cada salón tiene un tipo fijo (por nodo). Reglas de reparto: Candil 20 %, Hongal 20 %, Agujas 25 %, Laguna 15 %, Caldera 20 % (la Caldera solo si el piso queda bajo y 30, donde ya hay lava; si no, se convierte en Agujas). El **bioma de arriba** inclina: selva y nuboso → Hongal; desierto y bosque seco → Agujas (caliza); volcán → Caldera.

| Salón | Qué se ve | Sonido y ambiente | Qué aporta |
|---|---|---|---|
| **El Candil** (cristal) | racimos y bloques de cristal en piso, techo y paredes; el brillo cambia de color por región (ya existe) | tintineo agudo y zumbido bajo; polvo brillante | luz gratis, **esquirlas** y cristal puro; sitio seguro para descansar (sin murciélagos) |
| **La Hongueada** (hongal) | hongos gigantes de 6-12 de alto (tronco y sombrero, bloques nuevos), musgo, brillos verdes | «pff» de esporas, goteo húmedo; esporas flotando | hongo comestible, ingredientes de cocina; araña y madre esporal |
| **Las Agujas** (goteo) | estalactitas y columnas de calcita de 10-25 de alto, pozas | eco largo y gotas fuertes (ya hay eco por sala) | calcita, agua; **riesgo de estalactita que cae**; pozas para pescar |
| **La Laguna Honda** | lago de 30-60 de ancho con **islas**, orillas de arena y cañas | corriente suave y chapoteo | agua para pescar, isla con cofre; anguila mayor |
| **La Caldera** (lava) | lago de lava, basalto, obsidiana y oro volcánico, puentes de roca | rugido y burbujeo, rojo en la niebla | **diamante y jade** (donde está la veta), brasa viva; el mejor botín y el peor peligro |
| **La Geoda mayor** (existe) | se integra: es la «Caldera de cristal» de una región | ya tiene | sigue como sitio kárstico, sin cambios |

- **Generación (gen 26):** `cmNodo` (`worldgen2.js:254`) suma `tipo` y la máscara de cada trozo guarda el tipo por celda (`Uint8`, hoy usa 1 y 2). La decoración (`worldgen2.js decorate`, el barrido de cuevas) lee el tipo y cambia las probabilidades: 3-6 % de racimos en Candil en vez de 0,2 %, hongos gigantes en Hongal, columnas y estalactitas largas en Agujas, isla y arena en Laguna, basalto y obsidiana en Caldera.
- **Tiempo real:** la región del sonido y del brillo ya vive en `cuevavida.js`; se le suma el tipo detectado por los bloques cercanos (cristal, hongo gigante, calcita larga, basalto), así que el ambiente funciona **también en mundos viejos**.
- Cada tipo escribe su primera visita en la libreta (`anotarCueva`) y suma al logro «Espeleólogo de verdad» (los 5 tipos).

## 3. Pilar 2 — Lugares para descubrir

Un lugar cada ≈ 2 salones (45 %), o sea ≈ 1 por cada 130 trozos, **dentro** del salón (se construyen con `Ctx` como `cuevas.js`: deterministas, con `c.loot`), con su placa y su nota en la libreta (`anotar`). Los cofres ya son del anfitrión.

| Lugar | Contenido | Botín esperado | Aporte |
|---|---|---|---|
| **Campamento de los Espeleólogos del 78** | 3 tiendas de lana, fogón apagado, cuerda, un cofre y **3 notas** encadenadas en la libreta (diario de una expedición que no volvió) | 8-14 u: comida, antorchas, esquirlas, 1 «cuerda» | pista narrativa y suministros; marca que hay un dueño cerca |
| **Mina vieja La Esperanza** | galería de 25-40 con rieles, **vagoneta** (la de `minaoro.js`), puntales y derrumbe posible, veta de oro en la pared | 15-30 u: oro, hierro, carbón, 1 casco o pico viejo | la «mina para explorar» (el C5 del plan viejo); la Mina de Abangares sigue siendo única y en partida |
| **Altar de los Ancestros** | plataforma de piedra lisa con 4 esferas (como las de Diquís), petroglifos (placas), brasero | 25-60 u: **jade (2-4)**, oro, cristal, máscara de la gente de antes | jade y lore; el centro de la Caldera o de la Laguna |
| **Isla del Silencio** | isla de la Laguna con un árbol muerto, un bote roto y un cofre | 20-30 u: pesca rara, perla, cuerda | recompensa por cruzar el lago |
| **Cámara de eco** | sala pequeña de calcita y cristal cuyo eco responde con un tono distinto | 10-20 u: esquirlas, «Cristal de eco» | puzle de oído y pista del mapa |
| **Cenote cerrado** | pozo con agua turquesa al fondo y una repisa con cofre | 15-25 u | descubrimiento vertical (usa la cuerda) |

Notas de la libreta: tono de misterio con humor tico («el café del campamento se acabó el día 3, el que lo tomó dice que fue el mae del grupo»). Logro «Lo que dejaron» (leer las 3 notas del campamento) y «Todo el camino» (visitar 4 tipos de lugar).

## 4. Pilar 3 — Criaturas y peligros

Solo las hace aparecer **el anfitrión**, con tope por salón (CM2) y los topes de `cuevavida.js`. Los comunes **no pagan** (regla de `precios.js`: lo manso y lo común no paga); solo los dueños pagan, sumados al contador de minijefes del día.

| Criatura | Dónde | Vida / golpe | Comportamiento | Botín |
|---|---|---|---|---|
| **Salamandra de cristal** | Candil | 8 / 0 (mansa) | brilla; si la golpean, destella y ciega 1 s | esquirla 0-1 |
| **Murciélago pescador** | Laguna | 4 / 0 (mansa) | vuela sobre el agua | **guano** 0-1 |
| **Tarántula pajarera** | Hongal | 16 / 2 + lentitud 2 s | cuelga del techo y cae al pasar bajo ella | seda (telaraña) 1-2 |
| **Ciempiés cavernario** | Agujas, cuevas hondas | 18 / 3 | embosca desde la pared y se retira | veneno de ciempiés 0-1 |
| **Culebrón de brasa** | Caldera | 24 / 4 + quemadura 3 s | sale de la lava; no la deja | **brasa viva** 0-2 |
| **Dueños (minijefes T3):** | uno por salón con lugar, **una vez por mundo** (10 % las demás) | | | |
| El Centinela de Cristal | Candil | 95, `dano` 1,1 | invulnerable mientras 4 racimos lo alimentan: hay que romperlos | cristal puro 2-4 |
| La Madre Esporal | Hongal | 85, `dano` 0,8 | nubes de esporas (lentitud + 1 por segundo, máx. 3 s) y 2 hongos reventones | harina de hongo, semillas |
| La Reina de las Agujas | Agujas | 110, `dano` 1,2 | telas y estalactitas que caen | seda ×6 |
| El Guardián de la Colada (ya existe) | Caldera | 150, `dano` 1 | arena en la lava | brasa viva, **diamante** |
| La Anguila Mayor | Laguna | 90, `dano` 0,9 | descarga bajo el agua | escama azul |

- **Balance:** el daño sigue el cálculo de jefes: `JEFES_BALANCE` (`vida`, `dano`) y ningún golpe quita más del 60 %; con la espada de hierro (6) y los bonos normales, un dueño de 100 de vida cae en 10-14 golpes. Hay que calibrar con `tools/bot-pelea.js` (`JEFES()`) como en la v12.4.9. Premio: se agregan a `MINIJEFE` y a `PREMIO_BAJA` con **7-9 u**, así el **primero del día paga y los demás el 10 %**: sin inflación aunque haya muchos.
- **Peligros (tiempo real, el anfitrión decide, ninguno mata de un golpe, 3 puntos como máximo por evento y ≥ 10 s entre eventos, apagados en modo pacífico y creativo):**
  - **Techo inestable** (Mina vieja, ya existe el derrumbe en `mina.js` con puntales): avisa 1,2 s con polvo y grietas.
  - **Aire malo** (Mina vieja y Hongal): las antorchas parpadean y se apagan; tras 6 s sin máscara, 1 de daño cada 2 s. Cura: ventilar (picar un hueco), la **Máscara** del pulpero (20 u) o salir. Las zonas salen de la semilla, así que cada persona ve el mismo lugar.
  - **Estalactita que cae** (Agujas): sombra en el piso 1,2 s antes; 3 de daño; solo por ruido (picar, correr, golpear).
  - **Corriente** (Laguna): arrastra suave; sin daño propio.
- Fichas de bestiario y notas de libreta para cada una (`bestiario.js`), con el mismo estilo de las de la 13.1.2.

## 5. Pilar 4 — Minerales y botín (C2) y rebalance

**Vetas.** Cada salón profundo (piso < y 24) puede tener una **veta** de 8-14 menas pegada a la pared, visible desde la sala; la Caldera la tiene siempre y casi todas llevan diamante, un tercio llevan jade. Las vetas usan los minerales que ya existen (misma dureza y tier) y un bloque nuevo, **cristal puro**, de dureza 2,5 y tier 1.

| Mineral | Hoy (por trozo) | Después (por trozo) | Valor de lo que sale por trozo |
|---|---|---|---|
| Carbón | 31,7 | 30 | sin cambio |
| Hierro | 37 | 34 (más en vetas) | sin cambio |
| **Oro** | 16,9 | **11** (7 disperso + 4 en vetas, minas y Caldera) | 169 u → 110 u |
| **Diamante** | **11,9** | **4,0** (1,6 disperso hondo + 2,4 en vetas) | 178 u → **60 u** |
| **Jade** | 0,67 | **0,60** (0,2 disperso + 0,4 en altares y Caldera) | 17 u → 15 u |
| Racimos de cristal | 6,9 | 6,9 + Candil denso; ahora **sueltan esquirlas** | nuevo |
| Cuarzo / calcita | 2,5 / 5,0 | igual + geodas mayores | decoración |

- **Por qué 4 y no 12:** un kit completo de diamante pide 11 diamantes de herramientas y 24 de armadura (`recipes.js`), y hoy se junta en 3 trozos (12 por trozo). Con 4 por trozo, **concentrados en las vetas de los salones hondos**, hace falta explorar una Caldera: el dueño y la lava son el precio. Una veta da 8-12 diamantes (≈ 120-180 u): cuesta una buena ruta, no un paseo. El jade se queda casi igual porque solo mejora lo de diamante (`recipes.js:24`): su valor está en **dónde** está (altar y Caldera).
- **Tope de venta:** una veta de diamante vale 8 jornadas si se vende de una vez. Propongo (pregunta 2) que la compra de gemas y minerales del buhonero cuente contra el `TOPE_DIA` (`cobrarDelTope`: hasta 40 u/día y lo demás al 40 %), igual que encargos y buzos. Así la economía sube, pero no se rompe.
- **Cofres:** valor esperado por lugar en §3 (8-60 u); por trozo ≈ 0,3 u (1 lugar por 130 trozos), muy por debajo de los 60 u de diamante; el botín no desbalancea.
- **Reglas de oro que se mantienen (y se prueban):** (1) ningún bloque nuevo se pica más rápido que su equivalente (se extiende `revisar-picar.mjs` con cristal puro y las menas de veta); (2) el material manda a igual nivel de bonos (no hay herramienta nueva); (3) daño y defensa: nada del botín da bonos, solo se crean recetas que **no** pasan de los topes ×2 / ×0,62; (4) los dueños pagan por día, no por unidad; (5) `precioBonito` para los precios nuevos.

**Recetas y objetos nuevos** (ids de ítem 1192-1299 libres; bloques desde 700):

| Receta | Ingredientes | Efecto |
|---|---|---|
| **Farol de cristal** | 3 esquirlas + antorcha | luz sin fuego y sin que se apague (aire malo no lo apaga) |
| **Cristal de eco** | 4 esquirlas + hierro | al usarlo, marca 20 s los hitos y salones a ≤ 120 bloques en el minimapa (12 usos); ayuda a orientarse (pregunta 4) |
| **Casco con lente** | casco de espeleólogo (1167) + 2 esquirlas | más alcance de luz bajo tierra (el casco gana valor) |
| **Sopa de hongo** | hongo gigante ×2 + agua, en el fogón | comida 7 y visión nocturna 120 s |
| **Abono de guano** | 2 guano | cultivos de 5×5 crecen ×1,25 (agro) |
| **Cuerda de espeleólogo** | 3 bejucos | cuerda que se pone en vertical y se baja o sube (cenotes y simas) |
| **Brasa viva** (combustible) | del Culebrón | quema 8 ítems en el horno (nada de progresión) |
| **Vidriera de cristal** | 2 cristal puro | decoración |

Nada de esto toca armas ni armaduras: la progresión sigue por hierro, diamante y jade.

## 6. Integración

| Qué | Dónde se hace | ¿Generador? |
|---|---|---|
| Tipo de salón, decoración, vetas, rebalance de minerales, lugares (campamento, mina, altar, isla, cámara, cenote) | `worldgen2.js` (`cmNodo`, `cmMask`, `decorate`) y `cuevas.js` (`Ctx`), todo por `hash3` | **Sí: generador 26** (o el siguiente libre si CM2 usa 26); los mundos ≤ 25 salen idénticos |
| Ítems, recetas, esquirlas, guano, cuerda, libreta, logros, sonidos y ambiente por tipo | `blocks.js`, `recipes.js`, `bestiario.js`, `cuevavida.js`, `audio.js` | **No**: vale también en mundos viejos |
| Fauna, dueños, peligros | `cuevavida.js`, `entities.js`, `mina.js`, `jefes-balance.js`, `precios.js` | **No** (como la fauna de la 13.1.2). El anfitrión decide y la hace aparecer; las personas invitadas ven lo que ya se sincroniza |

- **Red:** el terreno sale de `{seed, genVersion}` en cada máquina; fauna y peligros los decide el anfitrión (`entities.spawnMob` descarta lo de un invitado) y el daño pasa por los avisos que ya existen (hay que revisar que el daño de un peligro lo aplique el anfitrión, como el derrumbe). Zonas de aire malo y estalactitas salen de la semilla, así que el aviso visual es igual para todos. Cofres y placas del anfitrión como siempre.
- **Guardado:** nuevos datos en `meta` (dueños muertos, notas leídas, esquirlas) con valores por defecto; si se guarda algo nuevo, subir `SAVE_FORMAT` con su migración y las ids con `MIN_VERSION`/`MIN_IDS` (regla de `CLAUDE.md`).
- **Costo (estimado, sin prototipo; hay que medirlo en CC2):** +0,5 a +1,2 ms por trozo (el tipo se lee en el mismo barrido de decoración que hoy; lugares y vetas solo en trozos con salón, 1 de cada ~60) sobre los 6,8-9,9 ms actuales: entra en la meta de 12. FPS: las luces sueltas ya están topadas (`halos.js`, 64 a ≤ 28 bloques; cristal y hongos van por otro canal), los hongos gigantes suman ≈ +300 caras por trozo de Hongal y los mobs nuevos están bajo el tope total de fauna de cueva (6 + 1 dueño); partículas de espora ≤ 40.
- **Orientación:** los tipos dan identidad a cada salón (se «recuerda» el Candil); con CM2 (hitos y mapa de cueva) y el Cristal de eco no se pierde uno.

## 7. Fases y orden con lo que ya está planeado

Orden propuesto (una subida de generador por entrega, para no tener un número por cada idea):

1. **CM2** (simas, hitos, mapa de cueva, **tope de fauna por salón**) — primero: es requisito de la fauna nueva y de los lugares.
2. **CC1 · Botín y recetas, sin generador** (3 días): esquirla, guano, brasa, cuerda, farol, cristal de eco, casco con lente, sopa, abono; fichas de bestiario y logros; los peligros de tiempo real en lo que ya existe (aire malo en las cuevas hondas, estalactita en las Agujas ya generadas por el ruido). Vale en todos los mundos y se puede entregar sola.
3. **CM3 + CC2 · Salones con carácter y vetas** (4-5 días, **un solo generador 26**): el CM3 del plan (variedad) y el pilar 1, más las vetas y el rebalance de minerales de §5, con la prueba de flood fill y de minerales (diamante 3,5-4,5 por trozo) y huella de los mundos 21-25 idénticos.
4. **CC3 · Lugares para descubrir** (3 días, mismo generador 26 si sale junto con CC2, o 27): campamento, mina vieja, altar, isla, cámara, cenote, con notas en la libreta.
5. **CC4 · Dueños y peligros hondos** (4 días, tiempo real): los 4 dueños nuevos, calibración con `bot-pelea`, premios, techo inestable y aire malo en la mina vieja.
6. **I9 + I10 y luego I3 + I4** (superficie): son independientes de las cuevas; recomiendo hacerlos **entre CC2 y CC3** o después de CC4, en un generador aparte (27), para no mezclar riesgo de relieve con riesgo de economía. Si Isaac prefiere ver ríos y caminos antes, pueden ir antes de CC3 sin estorbar.
7. **CC5 · Pulido** (2 días): sonidos propios de cada tipo, segunda capa honda («La Hondura») y ajuste de números con una partida de prueba.

Total ≈ 19-21 días de trabajo; lo que se ve primero y no arriesga el mundo es **CC1**.

## 8. Preguntas para Isaac (solo las imprescindibles)

1. **Diamante.** Hoy sale a 12 por trozo (un kit completo en 3 trozos). ¿Lo dejamos en ≈ 4 por trozo, casi todo en vetas dentro de las cuevas hondas, o prefiere más (6) o menos (2)? El oro baja un poco también (17 → 11).
2. **Vender minerales.** ¿Que el buhonero compre diamante, oro y jade con el mismo tope diario de las demás ganancias (₡20 000 al día a precio completo y el resto al 40 %), o libre como hoy?
3. **Los dueños de los salones.** ¿Se quedan muertos para siempre (una vez por mundo), o regresan después de unos días?
4. **Para no perderse.** ¿Cristal de eco que marca salones, mapa de cueva que se dibuja solo, o las dos cosas?
5. **Mundos viejos.** Las criaturas, recetas y ambientes nuevos pueden llegar también a mundos ya creados (sin cambiar el terreno), como la fauna de la 13.1.2. ¿Quiere eso o solo mundos nuevos?

## 9. Biomas (agregado de Isaac: «mejore la generación de los biomas»)

### 9.1 Diagnóstico medido

Ventana de 2 400 × 2 400 bloques (22 500 trozos) alrededor del inicio, `column()` cada 8 bloques, **6 semillas**, generador 25 (`scripts_integracion/bio.mjs`). Estructuras: `structuresNear` en la semilla 101.

| Bioma | % del mundo (media de 6) | Rango entre semillas | % en manchas ≥ 40 trozos* | Primer hallazgo desde el inicio (bloques) | Estructuras por 1 000 trozos del bioma |
|---|---|---|---|---|---|
| Bosque (`forest`) | 23,9 | 19-26 | 87 | 1-48 | 35 |
| Mar (`ocean`) | 17,9 | 17-19 | 93 | 16-26 | (11 en total) |
| **Playa (`beach`)** | **17,1** | 16-18 | 61 | 8-72 | 4 |
| Llanura (`plains`) | 16,1 | 15-20 | 74 | 1-79 | 38 |
| Desierto | 6,9 | 5-8,5 | 80 | 25-266 | **0** |
| Bosque seco | 4,5 | 3,4-5,2 | 47 | 9-244 | 33 |
| Manglar | 3,6 | 2,4-4,4 | 39 | 9-143 | 7 |
| Nuboso | 3,5 | 2,9-3,9 | **0** | 9-216 | 5 |
| Selva (`jungle`) | 2,5 | 1,8-3,4 | 55 | 23-222 | 26 |
| Páramo | 2,3 | 2-2,6 | 18 | 19-176 | 4 |
| Volcán | 1,1 | 0,5-1,5 | 70 | **266-473** | 10 |
| Montaña (`mountains`) | 0,8 | 0,8-1 | **0** | 12-142 | 1 |

\* Parte del área del bioma que cae en una mancha de al menos 40 trozos (≈ 640 × 640 bloques); 3 semillas. La nieve (`snowy`) no existe: desde el generador 16 se convierte en páramo, nuboso o bosque. Estructuras: 419 en 22 500 trozos (18,6 por 1 000), solo semilla 101.

**Lectura:**
1. **La playa ocupa casi lo mismo que el mar y la llanura (17 %)**: la regla `h ≤ SEA+1` (`worldgen.js:70`) pinta de playa también planicies bajas tierra adentro; toca más bosque (18 715 celdas de frontera) y llanura (27 117) que mar (22 352). Es el bioma más sobrerrepresentado y el menos «de lugar»: 4 estructuras por 1 000 trozos.
2. **Bosque + llanura = 40 %** del mundo y reciben ≈ 70 % de las estructuras. Los biomas con identidad fuerte (nuboso, páramo, volcán, manglar, selva) suman **≈ 13 %** y están en pedazos pequeños.
3. **Nuboso (3,5 %) y montaña (0,8 %) son polvo**: ninguna mancha llega a 40 trozos (máximo 24-93). El nuboso sale como cinta fina entre bosque y páramo (15 702 contactos con bosque, 5 495 con páramo); la montaña casi no existe porque `h > 92` se reasigna a páramo (> 96), nuboso o bosque (`worldgen2.js:124-132`).
4. **El desierto (7 %) no tiene ni una estructura** en 22 500 trozos. El volcán queda a 266-473 bloques del inicio y es ≈ 1 %.
5. **Bordes:** todas las fronteras son de un paso, sin banda de transición; en el **21 %** de las celdas de frontera la altura salta más de 8 bloques entre vecinos a 8 de distancia (el I7 de bordes suaves). Contactos duros: desierto|bosque (2 208), desierto|montaña, selva|nuboso.
6. **Identidad:** casi todos los biomas ya tienen fauna, flora y sonido (nuboso, manglar, selva y bosque seco salen en 25-35 archivos de `src/`: fauna, bichos, mariposas, música, agro, pesca), pero **lo propio para ir a buscar** (recurso y estructura típica) es flaco en páramo, nuboso, manglar, desierto y playa.

### 9.2 Propuestas

**B1 · Reparto y tamaño (generador de superficie).**
- Playa: solo a ≤ 6 bloques de agua y ≤ 3 sobre el mar; el resto de planicies baja a llanura o bosque. Meta: playa 17 → **7-9 %** (la diferencia: +2 % desierto/bosque seco, +1 % manglar y selva, +1 % nuboso/páramo, el resto sigue en llanura/bosque).
- Piso de mancha: cada bioma con identidad (nuboso, páramo, manglar, selva, volcán, bosque seco) con **≥ 50 % de su área en manchas ≥ 40 trozos** (hoy 0-47 %), con un filtro de moda 3 × 3 sobre `biome` que absorbe motas de < 6 trozos.
- Montaña real: hoy 0,8 %. O se acepta que «montaña» = cerros + páramo, o se le da un 3-4 % de macizos de roca a h > 100 (pregunta 7).
- Distancia: los biomas jugables a ≤ 700 bloques del inicio en ≥ 5 de 6 semillas (el volcán, hoy a 473, es el límite).

**B2 · Bordes suaves (I7 ampliado).** Banda de transición de 24-40 bloques entre biomas climáticamente lejanos (desierto|bosque, selva|nuboso, desierto|montaña): mezcla de flora, suelo mezclado y altura limitada a ≤ 3 por 8 bloques (se une al ensanche de valles de I9). Meta: fronteras con salto > 8 **21 % → < 8 %**. Costo: ≈ 0 ms (interpolación en `column()`).

**B3 · Identidad por bioma** (todo original y tico; es el **refuerzo** a lo que ya existe en fauna, flora y música):

| Bioma | Flora y árboles propios | Fauna | Recurso propio | Lugar típico (estructura) | Cueva de abajo |
|---|---|---|---|---|---|
| Bosque nuboso | árboles musgosos con epífitas, helechos arborescentes, neblina baja | aves de neblina, ranas de cristal | **orquídeas** (tinte y brebajes), madera musgosa | **Mirador de la Neblina** (plataforma entre copas con cofre) | Hongueada y Laguna |
| Manglar | raíces zancudas, ostras | cangrejos, garzas, cocodrilo (ya) | ostras con **perla** (la Isla del Silencio la usa) | Muelle del Piangüero (palafito con encargo de pesca) | Laguna |
| Bosque seco | guanacaste, cornizuelo, pastizal dorado | venado, zopilote, chiza | **semilla de guanacaste**, miel nativa | Hacienda vieja con trapiche | Agujas (caliza) y Cámara de eco |
| Páramo | frailejón, pajonal, laguna de altura | cóndor y zorro | **cristal de altura** (Candil frío) | **Cairn de los Antiguos** (con vista) | Candil |
| Selva | árboles de contrafuerte, bejucos (ya) | tapir, lapa, ranas (ya) | **cacao silvestre** (chocolate, comida buena) | Campamento del botánico (notas) | Hongueada |
| Volcán | liquen y ceniza | culebrón de brasa, murciélago de azufre | **azufre y obsidiana** (ya) | Cráter con mirador | **Caldera** |
| Desierto | cactus, palmeras de oasis, dunas | escorpión (ya) | sal y arenisca tallada | **Oasis con ruina** (hoy: 0 estructuras) | Agujas secas y Altar |
| Playa | palmeras cocoteras | tortugas, cangrejos | cocos, caracolas | Tortuguero (ya existe) | sin salones propios |

Flora y estructuras nuevas van en el generador de superficie; fauna, ítems de recurso y recetas, en tiempo real (valen en mundos viejos). Las estructuras siguen `estructuras.js` (`fits` por bioma, `Ctx`, `c.loot`, nada de `Math.random`).

**B4 · La superficie se refleja en las cuevas.** El tipo de salón (§2) sale del bioma en la columna del nodo (se calcula una vez por nodo: **0 ms por trozo**), con estos pesos en %:

| Bioma de arriba | Candil | Hongueada | Agujas | Laguna | Caldera* |
|---|---|---|---|---|---|
| Selva, nuboso, manglar (húmedo) | 10 | 40 | 15 | 30 | 5 |
| Bosque seco, desierto (seco) | 25 | 5 | 45 | 5 | 20 |
| Páramo, montaña (frío) | 45 | 5 | 20 | 10 | 20 |
| Volcán | 10 | 0 | 10 | 0 | 80 |
| Bosque, llanura, playa, mar (neutro) | 20 | 20 | 25 | 15 | 20 |

\* Caldera solo si el piso queda bajo y 30; si no, se vuelve Agujas. Bajo desierto y bosque seco no hay agua libre en salones (la Laguna se cambia por Cámara de eco); bajo selva y manglar el goteo y el musgo suben 1,5×; bajo el páramo el cristal es frío (tinte azul). Sustituye el reparto fijo de §2. Para mundos viejos, la región de ambiente de `cuevavida.js` ya lee el bioma de arriba, así que el ambiente y la fauna siguen al bioma sin generador.

**Costos y riesgos:** cambiar el reparto mueve **dónde caen pueblos y estructuras** y todo lo que depende del bioma. Por eso va en un **generador de superficie aparte**, junto a I9+I10, I3+I4, I7 e I11 (un solo salto de relieve y de huella). Tiempo ≈ 0 ms (los filtros trabajan sobre la rejilla de biomas cacheada por región); flora nueva ≈ +0,3 ms por trozo de ese bioma.

## 10. Criterio de balance para todo el plan

**Principio:** rico, pero que el jugador **no tropiece con todo**. Se mide por 1 000 trozos (256 000 bloques² de superficie) y se reparte por **distancia al inicio** (D) y **profundidad** (P).

### 10.1 Qué es «exagerado» hoy

| Cosa hecha o planeada | Hoy | Veredicto |
|---|---|---|
| Aire subterráneo 8 % | gen 23: 4,2-6,1 %; gen 25 ≈ 8 % (concentrado en y 26-50) | **Se queda** (fue el pedido de «cuevas masivas», no toca la superficie). Moderar a ≈ 7 % = `CMS` 0,5, generador nuevo (pregunta 6) |
| Salones | 16,7 por 1 000 trozos (1 cada ~60 trozos) | **Se queda**; lo especial se raciona |
| Simas (CM2) | 40 % de los salones = 6,7 por 1 000, radio 3,5 | **Moderar a 3-5 por 1 000**, ninguna en D < 150 |
| **Bocas gigantes** (CM2, 20-30 de ancho) | no existen | **≤ 0,4 por 1 000** (una por ≈ 2 500 trozos, 800 × 800 bloques), D ≥ 450, sobre salones con ry ≥ 18, nunca en pueblo/obra/mar |
| Diamante | **11,9 por trozo (≈ 180 u)** | **Exagerado:** 2,5-5 según D |
| Oro | 16,9 por trozo | ≈ 11 |
| Lugares (§3: 45 % de salones ≈ 7,5 por 1 000) | planeado | **Moderar** a 2,5-7,5 según D |
| Dueños (§4: uno por salón con lugar ≈ 7 por 1 000) | planeado | **Moderar** a 0-3 por 1 000, solo hondos y D ≥ 250 |

Lo ya publicado (aire, simas) que se modere va con generador nuevo: los mundos de 25 o menos no cambian.

### 10.2 Rareza por distancia y por profundidad

Distancia desde el inicio: **Z1 < 300**, **Z2 300-1 000**, **Z3 > 1 000** bloques. Profundidad (y del piso del salón): **Alta ≥ 45**, **Media 30-44**, **Honda 11-29**.

| Por 1 000 trozos | Z1 | Z2 | Z3 | Notas |
|---|---|---|---|---|
| Salones | 16,7 | 16,7 | 16,7 | explorar debe ser posible siempre |
| Simas / bocas gigantes | 3 / 0 | 4 / 0,2 | 5 / 0,4 | gigantes solo desde Z2 |
| **Lugares** | **2,5** | **5** | **7,5** | prob. por salón 0,15 / 0,30 / 0,45; en Z1 solo campamento, cámara de eco y cenote |
| **Dueños** (minijefes) | **0** | **1,5** | **3** | solo salones Hondos o Caldera; en Z2 solo Centinela o Madre |
| Caldera | 1 | 3,3 | 3,3 | solo piso < 30 |
| **Diamante por trozo** | 2,5 | 4,0 | 5,0 | vetas de 6 / 8 / 12 menas |
| Jade por trozo | 0,3 | 0,6 | 0,8 | altar y Caldera |
| Oro por trozo | 8 | 11 | 12 | |
| Cofres de más de 25 u | 0 | 0,5 | 1,5 | |

**Progresión (qué encuentra cada quien):**
- **Nuevo** (Z1, banda Alta): salones con ambiente y sin enemigos fuertes, Candil para descansar, campamento con suministros, cámara de eco, carbón y hierro; diamante solo disperso (≈ 0,9 por trozo).
- **Intermedio** (Z2, Media): minas viejas, oro e hierro en vetas, primeros dueños, aire malo, cristal para fabricar; diamante en veta de 8 (un kit de diamante cuesta 3-4 vetas).
- **Avanzado** (Z3 u Honda): Caldera con su dueño, altar con jade, diamante en veta de 12, lava y peligros combinados; botín de 25-60 u.
Explorar lejos y hondo sube el premio, y la economía (₡12 500 por jornada) no se rompe porque lo grande queda detrás del dueño y del tope diario (§5).

### 10.3 Reglas fijas
- Cada dueño una vez por mundo y el primero del día paga (`precios.js`).
- Entre lugares, ≥ 60 bloques.
- Ninguna Caldera a ≤ 250 bloques del inicio.
- Fauna hostil de cueva: 6 comunes + 1 dueño en 22 bloques (tope de CM2).

### 10.4 Comprobaciones para `npm run revisar`

Prueba nueva `tools/revisar-contenido.mjs`, ≥ 6 semillas, ventana de 2 400 × 2 400 (los emplazadores sin generar bloques: milisegundos; el mineral con 256 trozos por zona). **Falla si algo sale del rango:**

| Regla | Rango |
|---|---|
| Salones por 1 000 trozos | 12-22 |
| Simas | 2,5-6; ninguna con D < 150 ni sobre pueblo u obra |
| Bocas gigantes | 0-0,6; ninguna con D < 450 |
| Lugares Z1 / Z2 / Z3 | 1-4 / 3-7 / 5-10 |
| Dueños Z1 / Z2 / Z3 | 0 / 0,5-2,5 / 1,5-4,5; ninguno en banda Alta |
| Caldera | 2-5; ninguna a D < 250 |
| Distancia mínima entre lugares | ≥ 60 |
| Diamante por trozo Z1 / Z2 / Z3 | 1,5-3,5 / 3-5,5 / 4-6,5 |
| Jade por trozo | 0,2-1,0 |
| Aire subterráneo / un solo sistema / trozos con cueva | 6-10 % / ≥ 85 % del aire / ≥ 70 % |
| Biomas: máximo de uno / mínimo de los 8 con identidad | ≤ 30 % / ≥ 1,5 % |
| Playa | 6-10 % |
| Área en manchas ≥ 40 trozos, biomas con identidad | ≥ 50 % |
| Primer hallazgo de cada bioma jugable | ≤ 700 bloques en ≥ 5 de 6 semillas |
| Fronteras con salto > 8 de altura | < 8 % |
| Estructuras por 1 000 trozos de cada bioma jugable | ≥ 3 (desierto hoy: 0) |
| Huella: mundos 21-25 idénticos; tiempo de trozo | sin cambio; ≤ 12 ms |

Se extienden `revisar-picar` (bloques nuevos) y `revisar-progresion` (sin bonos nuevos) como en §5.

## 11. Orden revisado (sustituye a §7)

Dos paquetes de generador para no mezclar riesgos: **superficie** y **cuevas**. Las cuevas leen el bioma, así que la superficie va primero; lo que no necesita generador sale antes para que Isaac vea avances ya.

1. **CB0 · Prueba de densidades** (1 día, sin generador): `revisar-contenido.mjs` con los rangos de §10.4 aplicados a lo que ya existe (fija el punto de partida y avisa si algo se pasa).
2. **CC1 · Botín, recetas y peligros hondos** (3 días, sin generador).
3. **CM2 · Hitos, mapa de cueva y tope de fauna por salón** (2 días, sin generador). Las simas y bocas gigantes, ya **moderadas**, esperan al paquete de cuevas.
4. **BI0 · Identidad de biomas en tiempo real** (3 días, sin generador): recursos-ítem, fauna, recetas, notas y música por bioma (B3); vale en mundos viejos.
5. **Paquete superficie · generador 26** (7-9 días): B1 reparto, B2 bordes, flora y estructuras típicas de B3, **I9+I10, I3+I4**, I7, I11. Una sola subida; huella de 21-25 idéntica y `revisar-contenido`.
6. **Paquete cuevas · generador 27** (8-10 días): **CM3 + CC2** (salones por tipo y bioma con B4, vetas y rebalance), **CC3** (lugares con las densidades de §10.2) y **CM2 simas y bocas gigantes moderadas**.
7. **CC4 · Dueños y peligros hondos** (4 días) y **CC5 · Pulido** (2 días), sin generador.

Total ≈ 31-36 días. Alternativa si Isaac quiere cuevas antes que superficie: las cuevas salen como generador 26 (el bioma de arriba se incorpora después como generador 27) y la superficie, al final; es más trabajo duplicado, por eso recomiendo el orden de arriba.

### Preguntas nuevas para Isaac
6. **Aire.** ¿Se queda en 8 % (salones grandes) o prefiere un poco menos (≈ 7 %, generador nuevo)?
7. **Montaña.** ¿Cerros (se renombra) o bioma real de 3-4 % con macizos de roca?
8. **Desierto.** ¿Se queda como desierto y dunas o lo volvemos «salinas» de Guanacaste (más tico)? Hoy es 7 % del mundo y no tiene estructuras.
9. **Orden.** ¿Superficie primero (generador 26) y cuevas después, o cuevas primero?
