# La Hondura — segunda capa honda de las cuevas

Diseño de solo lectura (19-nov), sobre master con la v13.5.5 (generador 31). Es la pieza «La Hondura» que el `PLAN_CONTENIDO_MUNDO.md` dejó pendiente (CM3/CC5: «una segunda capa honda, y 11-26, con ríos de lava»). Todo nombre y aspecto es original y tico. No se tocó `src/`.

**En una frase:** bajo la Red Honda (y 26-46) hay una capa de cámaras altas y calientes, de piso entre y 11 y 14 y techo hasta y 28, con ríos de lava, puentes de basalto, el mejor diamante y el jade a la vista; se llega por gargantas desde la Red Honda, cuesta y paga más, y es el «fin del camino» de las cuevas.

## 1. Punto de partida (medido, generador 31)

256 trozos alrededor del inicio, 2 semillas (101 y 303; `scripts_integracion/hond.mjs`). Por banda de altura, porcentaje de celdas y minerales por trozo:

| Banda y | Aire | Lava | Agua | Diamante | Jade | Oro | Cristal |
|---|---|---|---|---|---|---|---|
| 1-10 | 0 % | 0,9-1,2 % | 0 | **1,5-1,6** | **0,5-0,6** | 2,9-3,3 | 0 |
| 11-15 | 1,2-4,3 % | 1,6-1,8 % | 1-4 % | 0,7-1,0 | 0,1-0,2 | 2,0-2,3 | 0,5-1,1 |
| 16-20 | 4,4-8,4 % | 1,5-1,7 % | 1,7-4,9 % | 0,2 | 0 | 1,8-2,3 | 0,4-0,6 |
| 21-25 | 9,5-13,8 % | 1,0-1,1 % | 1,6-4,0 % | 0 | 0 | 1,7-1,9 | 1,0-1,2 |
| 26-30 | 18-22 % | 0,1-0,5 % | 1,8-3,7 % | 0 | 0 | 1,7 | 1,2-1,7 |
| 31-40 | 25-27 % | 0 | 0,3-0,9 % | 0 | 0 | 1,0-1,1 | 3,1-3,8 |

**Lectura:**
1. **El diamante y el jade viven en y 1-15, pero casi todo el aire está arriba de y 21.** El diamante (≈ 2,6 por trozo entre y 1 y 20, el 90 % en y ≤ 15) está dentro de roca maciza: hoy se llega a él **picando a ciegas**, no explorando. Esa es la oportunidad de La Hondura: abrir cámaras que dejen ver la veta.
2. Lo único «hondo» que ya existe son salones con piso bajo (los de y 11-29, de la Red Honda) y los lagos de lava de zonas (`LAVA_PROB` 0,75, nivel 11-30, `worldgen2.js:54, :275`); no hay una capa con identidad propia. La Caldera (§2 del plan de contenido) es un salón, no una capa.
3. La regla de CM1 «piso ≥ y 11» (la losa de y 1-10 se respeta, `LAVA_FONDO = 10`) **se queda**: La Hondura no abre la losa; la usa de pared y de pozo de minerales.

## 2. Qué es

Un **segundo sistema de cuevas**, escalonado por debajo del primero:

- **Cámaras hondas** (`hondo`): elipsoides de 28-56 de ancho (menos anchos que los salones de 40-96) y **22-34 de alto**: techo hasta y 24-28, piso a y 11-14. Altura grande, ancho moderado: se sienten como pozos de catedral.
- **Colada** (río de lava): una cápsula de 3-5 de ancho que corre por el piso entre cámaras, con lava a la altura del piso y **puentes de basalto** cada 18-26 bloques. Nunca más del 35 % del piso de una cámara.
- **Gargantas**: simas verticales de radio 2,5-3,5 que unen un salón de la Red Honda (piso ≤ y 36) con la cámara de abajo. Sin ellas La Hondura queda aislada (regla de conectividad, §7).
- **Paredes ricas**: en el muro de cada cámara, 1 a 3 vetas (diamante 60 %, jade 25 %, oro 15 %) **visibles desde el piso**; el diamante y el jade siguen donde están (y ≤ 20), pero ahora asoman.
- **Ambiente**: calor, resplandor rojo, rumor de magma, columnas de basalto, azufre amarillo en grietas, geodas de cuarzo ahumado.

## 3. A qué profundidad va

| Parte | Altura | Notas |
|---|---|---|
| Piso de cámaras | **y 11-14** | nunca bajo y 11 (losa intacta) |
| Techo de cámaras | y 24-28 | choca con el piso de los salones bajos (y ≥ 26): se une por las gargantas, no se funde (techo de la cámara a ≥ 3 bajo el piso del salón salvo en la garganta) |
| Colada | piso de cámara | lava a y 11-13 |
| Gargantas | de y 26 a 36 hasta el techo | radio 2,5-3,5 |

Cae **bajo** `LAVA_TOPE` (y 30) y comparte con ella: la lava de zonas ya existente (nivel 11-30) no se vuelve a calcular dentro de una cámara; ahí manda el nivel de la colada (ver §7).

## 4. Contenido y progresión

### 4.1 Cómo se encuentra
- **Densidad objetivo:** **6-8 cámaras por 1 000 trozos** (una por ≈ 140 trozos, la mitad de los salones: 16,7 por 1 000), **2,5-3,5 gargantas por 1 000**, **ninguna a menos de 300 bloques del inicio** (Z1 de §10.2 del plan de contenido), 3 / 7 por 1 000 en Z2 / Z3.
- Cada cámara lleva **uno de cuatro tipos**, también por `hash3` y el bioma de arriba (el volcán lo inclina, igual que a la Caldera): **Fragua** (colada y basalto, la clásica), **Geoda** (cuarzo ahumado y jade, sin lava abierta), **Azufre** (gas y cristales amarillos, usa la Máscara) y **Ceniza** (silencio, esporas de ceniza, el dueño).

### 4.2 Qué trae cada uno
| Cámara | Recurso propio | Peligro | Lugar o dueño |
|---|---|---|---|
| **Fragua** | veta de diamante, oro | colada, calor | «La Fragua de los Antiguos» (precolombina, jade/oro 30-60 u) |
| **Geoda** | jade, cuarzo ahumado, cristal | poco (bichos) | «El Nido de Cristal» (cofre 20-40 u) |
| **Azufre** | azufre, brasa viva | aire malo (Máscara), poca luz | — |
| **Ceniza** | ceniza, obsidiana | el dueño | **El Tizón Mayor** (dueño, uno por mundo, no regresa) |

- **Dueño nuevo:** el Tizón Mayor, un montón de brasas con forma de gigante (minijefe T3, vida ≈ 130, daño ×1,3, calibrar con `bot-pelea`); paga en el tope diario como los otros (7-9 u, primero del día; §4 del plan de contenido). Suelta brasa viva y 2-3 diamantes.
- **Criaturas** (solo anfitrión, tope de fauna por cámara de CM2): salamandra de brasa (vida 14, mansa hasta que la golpean), culebrón de brasa (vida 24, golpe 4 + quemadura; ya está en el plan de contenido §4), ciempiés cavernario (vida 18, golpe 3). Ninguna paga (regla de `precios.js`).
- **Peligros:** calor (usa el efecto `calor` que ya existe, hambre ×3,75 con tope de 90 s; se cura con agua y saliendo), aire malo en Azufre (§4 del plan de contenido), lava de la colada. Nada mata de un golpe: ≤ 3 puntos por evento, ≥ 10 s entre eventos, apagado en modo pacífico y creativo.

### 4.3 Progresión (quién llega y cuándo)
1. **Lejos del inicio y hondo.** No hay cámara a D < 300; solo se entra por gargantas, que empiezan con una repisa (hace falta **cuerda de espeleólogo** y **cubo de agua** para la lava; ya existen).
2. **Intermedio** (hierro, cuerda, algo de comida): entra por la garganta a una Geoda o un Azufre, sin lava abierta, y saca jade y cristal.
3. **Avanzado** (armadura de hierro o más, agua, Máscara): Fragua y Ceniza, el dueño y el diamante en veta de 12.
Eso es lo que decía §10.2 del plan de contenido: «lo grande queda detrás del dueño». La economía no cambia (el diamante sigue en ≈ 2,5 / 4 / 5 por trozo según zona); lo que cambia es **dónde está y cómo se llega**: del ≈ 90 % que hoy se encuentra picando a ciegas en y 1-15 a ≈ 60 % en vetas visibles de las cámaras.

### 4.4 Recetas y objetos
Sin ítems nuevos obligatorios. Dos opcionales (Isaac decide, §8, pregunta 3): bloque **basalto columnar** (decoración) y **cristal ahumado** (decoración). El resto usa lo que ya hay: diamante, jade, brasa viva, azufre, cuerda, Máscara, cubo de agua, obsidiana.

## 5. Costo estimado

| Concepto | Estimación |
|---|---|
| Cámaras (≈ 35-45 % del volumen de salones) | +0,25-0,5 ms por trozo |
| Colada y gargantas (cápsulas como las venas) | +0,1-0,25 ms |
| Relleno y sello de la lava en cámaras (una pasada por columna, reusa `nivelLava`/sello) | +0,1-0,15 ms |
| **Total** | **+0,4-0,9 ms por trozo** |

- Base: CM1 sumó +0,5-1,2 ms con 16,7 salones y las venas por 1 000 trozos; La Hondura tiene 7 cámaras por 1 000 y menos ancho. El generador 31 ronda 8-9 ms (medido por la constructora); con La Hondura queda en **9-10 ms (< 12)**.
- Mi medición con la máquina ocupada dio 13-17 ms de promedio de trozo para el generador 31 (256 trozos incluidos pueblos); sirve solo como relación: **la prueba de tiempo debe compararse contra el generador 31 en el mismo proceso** (`revisar-rutas`).
- Dibujo: más aire profundo (la banda y 11-25 pasa de 1,2-13,8 % a ≈ 8-16 %); +60-120 caras por trozo con cueva; con las nieblas y el límite de dibujo bajo tierra de la v13.2.0 no debería notarse. Hay que revisar una Fragua grande en el navegador (lava = luz, `halos.js` ya topa en 64 luces a ≤ 28 bloques, solo calidad media).
- Memoria: una máscara de 32 KB por trozo mientras se genera (se descarta), como `cmMask`; caché de nodos por región, despreciable.
- Red: sin cambios (cada máquina genera igual con `{seed, genVersion}`); fauna y dueño solo del anfitrión.

## 6. Riesgos para la huella (mundos publicados)

1. **Generador nuevo, 32.** Todo lo de terreno (cámaras, colada, gargantas, paredes, lugares) va en `gen.version >= 32` (`GEN_HONDURA`); los mundos ≤ 31 salen idénticos. Se agrega a `tools/huella-mundos.mjs` (huella 21-31) y a `meta.minVersion`; un cliente viejo ante un anfitrión con generador 32 se rechaza (como en 25, 26 y 27).
2. **No consumir los mismos azares.** Todo con `hash3` con sales nuevas (por ejemplo 9600-9699) y nunca `Math.random`; no mover el orden de las llamadas a `c.rnd` de estructuras. **Si no se respeta, cambian trozos que no deberían.**
3. **La lava de zonas.** `nivelLava` (`worldgen2.js:275-283`) se evalúa por columna; dentro de una cámara hay que **sustituirla** por el nivel de la colada, no sumarla (si no, se duplican lagos). Se hace solo con `version >= 32` y solo dentro de la máscara (`val` nuevo `3` en la máscara de cuevas, junto a 1 y 2).
4. **Fugas de lava y agua.** La Hondura es el lugar con más lava; la regla del §10.5 del plan (piso seco ≥ 60 %) y el flood fill de `revisar-red-honda` deben extenderse: **cero celdas de lava con aire a su lado sin muro** (el fluido se derrama y baja el rendimiento).
5. **Interacción con la Caldera y los salones bajos.** El techo de la cámara llega a y 24-28 y el piso de un salón puede llegar a y 17: hace falta la regla «techo de la cámara ≥ 3 bajo cualquier salón no conectado por garganta» o se funden y quedan salones de 40 de alto sin plan. Se prueba con el mismo flood fill.
6. **El sitio kárstico y la Caverna del Rey** (`caverna.js`, `cuevas.js`) se construyen **después** y pisan lo que haya: se verifica que ninguna cámara queda dentro de su caja (o que la caja limpia sola).
7. **Mundos viejos.** El **contenido de tiempo real** (criaturas, ambiente, dueño en cámaras ya generadas) solo existe donde haya cámaras: en mundos ≤ 31 no hay, y se dice sin prometer lo contrario.

## 7. Reglas comprobables (para `revisar-contenido`)

| Regla | Rango |
|---|---|
| Cámaras por 1 000 trozos | 5-9; ninguna a D < 300 |
| Gargantas por 1 000 trozos | 2-4; cada cámara con ≥ 1 |
| Aire banda y 11-25 | 7-16 % (hoy 1,2-13,8 %) |
| Aire de La Hondura conectado a la Red Honda | ≥ 90 % |
| Piso seco por cámara (sin Fragua) | ≥ 60 %; Fragua ≥ 40 % |
| Lava de La Hondura | ≤ 6 % del aire; ninguna celda con aire adyacente sin muro |
| Piso mínimo | y ≥ 11 (nunca la losa) |
| Dueño por 1 000 trozos en Z2 / Z3 | 0,3-0,8 / 0,8-1,6 (una parte de los ya previstos en §10.2, no encima) |
| Vetas visibles por cámara (diamante, jade u oro) | 1-3, a ≤ 6 del piso |
| Diamante por trozo (suma de todo) | sin cambio: 2,5 / 4 / 5 por zona (≥ 40 % en La Hondura) |
| Huella 21-31 idénticos; tiempo de trozo | sin cambio; ≤ 12 ms (relación contra gen 31 ≤ 1,15×) |

## 8. Decisiones de producto para Isaac

1. **¿Cuánto peligro?**
   - **A — Moderado (recomiendo):** colada con puentes, calor suave y aire malo solo en Azufre; el castigo es dar la vuelta, no morir. Se entiende y se juega «rico pero sin exagerar».
   - B — Duro: lava abierta ancha, calor que cuesta comida y vida; para quien quiere un reto.
   - C — Estético: sin calor ni dueño, solo paisaje y minerales.
2. **¿Cómo se entra?**
   - **A — Solo por gargantas desde la Red Honda (recomiendo):** progresión clara.
   - B — También por cráteres de volcán (un tiro de 60 de alto con lava): espectacular, más caro de probar y de balancear.
3. **¿Ítems y bloques nuevos?**
   - **A — Solo dos decorativos (basalto columnar y cristal ahumado), sin economía nueva (recomiendo).**
   - B — Ninguno.
   - C — Un material nuevo para fabricar (p. ej. «corazón de magma»): obliga a rebalancear recetas.
4. **¿Dueño nuevo?** **A — El Tizón Mayor, uno por mundo, no regresa (recomiendo; sigue la regla ya decidida).** B — reusar al Guardián de la Colada.
5. **¿Cuándo?** **A — Generador 32 propio, después de la tanda de pulido T1-T4 y antes de cualquier otra cosa de terreno (recomiendo: aísla la huella).** B — juntarlo con otro generador (más rápido, más riesgo).

## 9. Fases

| Fase | Contenido | Generador | Esfuerzo |
|---|---|---|---|
| **HO0** | `revisar-contenido` con las reglas de §7 sobre lo ya existente (banda y 11-25, lava, conexión) | no | 0,5 día |
| **HO1** | Cámaras, gargantas y colada por `hash3`; máscara con `val = 3`; sello de lava; prueba de flood fill y huella | **32** | 3-4 días |
| **HO2** | Tipos (Fragua, Geoda, Azufre, Ceniza), paredes con vetas visibles, lugares (Fragua de los Antiguos, Nido de Cristal) | 32 | 2-3 días |
| **HO3** | Criaturas, calor, aire malo, dueño (el Tizón Mayor), sonido y luz; calibrar con `bot-pelea` | no | 3 días |
| **HO4** | Pulido: sonidos, nieblas, textos en libreta y bestiario, ajuste de números con una partida | no | 1-2 días |

Total ≈ 10-13 días. **HO1 y HO2 comparten el generador 32** (una sola subida); HO3 y HO4 no necesitan generador y llegan también a cámaras ya generadas.

## 10. Qué no hace La Hondura
- No cambia los minerales por trozo ni los precios (§5 y §10.2 del plan de contenido).
- No abre nada bajo y 11 ni toca la losa de lava del fondo.
- No cambia superficie, biomas, pueblos ni caminos.
- No agrega ítems de progresión (armas, armaduras): sigue la regla de «nada del botín da bonos».
