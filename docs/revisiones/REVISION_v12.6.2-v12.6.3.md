# Revisión de la v12.6.2 «Agua de material» y la v12.6.3 «Decimotercera revisión» (encargo 38-A)

Solo lectura, sobre los commits `aaa2365` (v12.6.2) y `6303dfa` (v12.6.3). Leí los diffs completos de `src/world.js`, `src/mesher.js`, `src/atmosfera.js`, `src/sky.js`, `src/arrecife.js`, `src/game.js`, `src/pueblo.js`, `src/version.js` y `tools/revisar-version.mjs`, y miré las capturas `docs/capturas/v12.6.2/agua-alto.jpg` y `v12.0.1/horizonte-alto-muy-lejos.jpg`. **No corrí el juego** (no abro el navegador en esta sesión): lo que dependa de verlo va «por confirmar».

## Resumen

La v12.6.3 cierra bien casi todo lo que pedía la decimotercera revisión; hay **un fallo real de borde** (`R.vivos` sin validar) y una laguna de migración. El agua de la v12.6.2 **funciona y se ve bien en la captura**, pero trae **un error de matemática en el empaquetado de datos del vértice** que pinta una banda oscura en cada orilla, y dos decisiones que conviene ajustar (opacidad en lo hondo y la costura con el agua lejana).

## Los 5 más importantes (en orden)

### 1. La orilla y la profundidad viajan en un número que se interpola: sale una banda oscura y un corte en cada orilla — `src/mesher.js` (bloque del agua) + `src/world.js` (fragmento, `#ifdef ATMOS_AGUA`)

**Qué pasa.** El mallador guarda, en la parte decimal de `aAnim`, `prof * 0.06` (0 a 0.36) más `0.5` si la esquina toca la orilla (`anim4[k] = (anim4[k] || 6) + prof * 0.06 + (… ? 0.5 : 0)`). `orilla` va **por esquina**, así que dentro de un mismo cuadrito de agua el varying `vAguaFr` se **interpola** entre valores como `p` y `p + 0.5`. El fragmento lo descompone con `orillaA = step(0.45, vAguaFr)` y `profA = clamp((vAguaFr - orillaA * 0.5) / 0.36, 0, 1)`: eso solo es correcto en los vértices, no a mitad de la cara.

**Cuenta concreta** (agua de 1 bloque de hondo, `p = 0`; el valor va de 0 a 0.5 a lo largo del cuadrito):
- de 0 a 0.36 la profundidad sube de 0 a 1 (¡a un bloque de hondo!) y se **satura en oscuro y opaco** desde el 72 % del recorrido;
- en 0.45 `step` salta a «orilla» y `profA` cae de golpe a 0 (clara) con espuma.

Resultado esperado: junto a cada esquina de orilla, una **franja oscura y opaca seguida de un corte duro a clara**, justo donde la espuma debía suavizar. Con `p = 0.36` pasa al revés (un parche claro dentro del agua honda).

**Por confirmar a ojo** (lo deduje del código; la captura `agua-alto.jpg` se ve limpia porque en ese ángulo casi no hay orilla de lado).

**Arreglo** (chico): mandar la profundidad y la orilla como dos atributos (un `vec2 aAgua`) o, sin atributo nuevo, usar solo la profundidad en el decimal (0 a 0.36) y sacar la orilla de la **distancia al borde** calculada en el fragmento. Si se deja un solo número, que la orilla use `flat`. Costo: +8 bytes por vértice de agua.

### 2. En Medio y Alto el agua honda es casi opaca (alfa 0.9) y esconde el fondo — `src/world.js:121` y el fragmento

`waterMat` tiene `opacity: 0.72`, pero el fragmento **pisa** `diffuseColor.a = mix(0.66, 0.9, profA)`; `profA` llega a 1 a 6 bloques, y a 3 bloques ya es ≈ 0.78. En **Bajo** sigue 0.72 parejo. Efecto de juego: de Medio hacia arriba **se ve peor lo que está en el agua** (arrecife a 3–6 bloques, fragmentos, tesoros, naufragios, peces, la pecera), justo lo que C5-B pide mirar. En `agua-alto.jpg` los corales de la orilla se ven, pero son aguas someras.

**Arreglo:** oscurecer el **color** con la profundidad y dejar el alfa entre 0.66 y 0.78 (tope). **Por confirmar:** probar un arrecife a 4 bloques en Alto.

### 3. Costura entre el agua cercana (con material) y la lejana (sin él) — `src/lodmesh.js`, `src/lodworker.js:11,58-64`, `src/lod.js`

El agua del LOD es un color plano opaco (`COL.water` `[0.16, 0.34, 0.68]`, más oscura con la hondura) con el material del LOD, **que no recibe `ATMOS_AGUA`** (`aplicarDefines` solo lo pone donde `atmosNombre === 'agua'`). El agua cercana, mirada de lado, ahora mezcla hasta el 55 % del color del cielo (Fresnel) y brilla con el sol; **donde termina la zona cercana empieza un azul plano**. En `horizonte-alto-muy-lejos.jpg` se ve la diferencia entre el agua cercana (clara, con el fondo a la vista) y la lejana (azul profundo). Ya era una frontera antes (translúcida frente a opaca), pero el Fresnel la hace más notoria al atardecer.

**Arreglos posibles (de menos a más trabajo):** (a) bajar el peso del Fresnel con la distancia (`fA *= 1 - smoothstep(...)` usando la misma distancia de la niebla) para que el agua cercana **converja** al color lejano; (b) en el LOD, mezclar `uCieloHoriz` por el ángulo con la cámara; (c) un material de agua simple para el LOD. **Por confirmar** con una captura de la frontera al atardecer.

### 4. `R.vivos` sin validar y sin migración — `src/arrecife.js`, funciones `A()` y `cercaDeVivos()`

- `A()` solo exige `Array.isArray(R.vivos)`; los **elementos** no se validan. Un mundo importado con `vivos: [1, null]` hace que `cercaDeVivos` llame `s.split` sobre un número: **TypeError en el tic de 1 s** (`tickTortugasArrecife`) mientras `revividos ≥ 60`. `numeros()` (la limpieza de v12.6.3) cubre los numéricos, no esta lista. Tampoco se acota el largo en la importación (el tope de 400 solo lo aplica `usarArrecife` al empujar).
  **Arreglo:** en `A()`, `R.vivos = R.vivos.filter((s) => typeof s === 'string' && /^-?\d+,\d+,-?\d+$/.test(s)).slice(-MAX_VIVOS)`. **Por confirmar** si `validarMundo` (`src/importar.js:48`) ya recorta `meta.arrecife`; no lo leí a fondo.
- **Mundos de la v12.6.0–12.6.2**: los corales que ya revivieron **no están** en `vivos` y sí en `world.mods` (cambiados por el jugador): `delGenerador` dice que no son del generador y `vivos.includes(k)` es falso, así que **no dan fragmentos y los buzos no vienen** hasta revivir uno nuevo (los 60 hitos ya cobrados no cambian). Como esas versiones no salieron, solo afecta los mundos de prueba de nanoyackson; la salida cómoda es dejarlo y decirlo en el changelog, o rellenar `vivos` con los corales no blancos de `mods` cercanos.
- Al pasar de 400 corales vivos, `shift()` saca a los **más viejos**: dejan de dar fragmentos y de contar para los buzos. Con el tope de 150 de la medalla no es un problema real; solo conviene saberlo.

### 5. El vivero acepta cualquier agua «familia 1» por debajo del mar — `src/arrecife.js`, rama `K.vivero_coral`

`FLUID[w.getBlock(t.x, t.y + 1, t.z)] !== 1 || t.y >= SEA` impide el vivero en seco y en lava (bien), pero:
- una **piscina subterránea** o un cubo de agua puesto a mano bajo el nivel del mar (`y < SEA`) también cumple: no hace falta estar en el mar;
- `agua_celeste` (la de los pozos termales y el Río Celeste) tiene `FLUID === 1` (`batear` en `oficios.js` la excluye aparte), así que también vale.

**Arreglo:** exigir que **todo el tramo hasta `SEA`** sea `FLUID === 1` y que no sea `K.agua_celeste`, o que `regionAt(...) === 'mar'`.

## Lo demás, por tema

### A. El shader del agua (v12.6.2)

| Punto | Estado |
|---|---|
| `ATMOS_AGUA` solo en el material del agua | ✔ `aplicarDefines` (`atmosfera.js`) lo agrega solo cuando `f.agua && m.userData.atmosNombre === 'agua'`; los demás materiales no se recompilan. La clave de caché lleva el nombre y la lista de defines: el agua en Bajo y en Medio no comparten programa. |
| Banderas por nivel | ✔ `agua: false` en Bajo, `true` en Medio, Alto y Ultra; `NOMBRE_FLAG`, la casilla `s-v-agua` de `index.html` y los dos bucles de `ui.js` (cambiar y mostrar) están actualizados. |
| Colores del reflejo | ✔ `ATMOS.uCieloHoriz` y `uCieloCenit` se copian de `sky.js` **antes** de que el rayo los aclare (`flash`): los relámpagos no aclaran el reflejo (**por confirmar** si se quiere). Los valores iniciales (día) valen hasta el primer cuadro. |
| Packing de `aAnim` (base 3 ola / 6 quieta) | ✔ las bases siguen separables: `floor(aAnim + 0.001)` vale 3 ó 6 (máximo `6.86`); el viento de las hojas (1 y 2) no cambia. Ver el punto 1 por la **fracción**. |
| Lava | ✔ también recibe `aAnim` 3 (ola) pero va al material opaco, que no define `ATMOS_AGUA`: sin efecto. |
| Profundidad | ✔ `prof` cuenta hasta 6 celdas de agua hacia abajo; los accesos a `P[cell - PLANE*(prof+1)]` por debajo del fondo del chunk dan `undefined` y cortan. El costo es **una vez por celda**, no por cara. |
| Orilla | ✔ `orilla(ox, oz)` mira cuatro celdas sólidas alrededor de la esquina; usa el relleno de un bloque del `P`, que existe en los bordes del chunk. |
| Bajo el agua | **Parcial.** `abajoA = step(pA.y, cameraPosition.y)` apaga el Fresnel y el brillo del sol cuando la cámara está bajo el fragmento: ✔ como pidió la tarea («debajo del agua no hay reflejo»). Pero la **profundidad** (más oscura y opaca) sigue activa: **mirando hacia arriba desde el agua la superficie sale oscura y opaca (alfa hasta 0.9)** y esconde el sol; antes tenía alfa 0.72. **Por confirmar a ojo.** Arreglo: multiplicar `profA` por `abajoA`. |
| Noche | El reflejo se multiplica por `max(uDaylight, 0.15)` y la espuma por `max(uDaylight, 0.25)`: no queda neón. El brillo del sol usa `uSunDir` y `uSunCol`; **por confirmar** que de noche `uSunCol` baja a cero (si el sol queda bajo el horizonte, `rA·uSunDir` no da brillo). |
| Lluvia y nublado | **Por confirmar:** el brillo solar (`solA`, ×1.5) no se atenúa con `overcast`. Con la lluvia lo normal es que no brille. |
| `uTime` y `uDaylight` re-declarados en el fragmento | ✔ inocuo (mismos objetos de uniform). |
| Costos | La nota del changelog dice «menos de 0,1 ms por cuadro». **No hay medición en el repo** (no encontré salida del medidor de GPU en `docs/`): por confirmar. Cuenta del shader: 6 `sin`/`cos`, 3 `normalize`, 2 `pow`, 1 `reflect`, 3 `mix` y 2 `smoothstep` por píxel de agua; con `DoubleSide` y `depthWrite: false` los pasos se acumulan. En una iGPU a 1080p con medio cuadro de agua **estimo** entre 0.2 y 0.6 ms (estimación mía, 📏 a medir: capturar el medidor de GPU con `agua` encendida y apagada en la misma vista, a Medio y Alto). El varying `vAguaFr` y el `floor` también corren en los materiales opacos y en Bajo: despreciable. |
| Agua del LOD | Sin el material nuevo (punto 3). Es la diferencia que mide el cambio en Medio y Alto. |

### B. Los arreglos de la decimotercera revisión (v12.6.3)

| Arreglo | Veredicto |
|---|---|
| **Saqueadores** (`arrecife.js`, `pueblo.js`) | ✔ A lo sumo 2 por noche: `M.saqueoN`/`M.saqueoNDia` con `hay < 2 && M.saqueoN < SAQUEOS_NOCHE`; se sube solo cuando de verdad nace uno. **Atraparlo ya no cuesta fama**: `VECINO.onHurt` sale sin tocar la reputación, devuelve `undefined` y `entities.js:257` deja pasar el daño normal (solo `false` lo cancela). El día cambia al final de la noche (`game.js:2675`, `time ≥ 1` y la siesta), así que el contador no se reinicia a media noche. **Por confirmar** corriéndolo. Si `numeros()` borra un `saqueoN` dañado, `undefined < 2` es falso: esa noche no salen saqueadores (inofensivo). `M.saqueoDia` viejo queda huérfano en los guardados (inofensivo). |
| **Fragmentos y `world.mods`** | ✔ La estructura es la que supone `delGenerador`: `world.mods` es `Map('cx,cz' → Map(idx → id))` (`world.js:130,192`) y `idx(x, y, z)` es `x + z·16 + y·256` (`worldgen.js:21`); `setBlock` solo anota cuando cambia el bloque (`if (old === id) return old`), así que un coral natural nunca queda en `mods`. Topes: 6 por día y 1 por coral cada 3 días. Ver el punto 4 por `vivos` y la migración. |
| **Buzos dentro del tope** | ✔ pagan solo con `R.revividos ≥ 60`, de día, en supervivencia y a ≤ 40 bloques de un coral vivo; `cobrarDelTope` **copia** la cuenta de `cumplir` (`encargos2.js:159-162`: `TOPE_DIA = 40`, 40 % de lo que pase). **Riesgo de deriva:** el 40 y el 0.4 están dos veces; si alguien cambia el tope de los encargos, los buzos no lo siguen. **Arreglo:** exportar un `cobrarDelTope(g, u)` desde un módulo neutro (por ejemplo `plata.js`) y que lo usen los dos (el comentario del código explica que no se importa de `encargos2.js` por un ciclo en el build). Con la C6 esto se vuelve importante: el taller también va a pagar por ahí (ver `PREPARACION_C6.md` §5). |
| **`be.lora`** | ✔ `arribada.js:31` marca `lora: true` en los nidos nuevos y `usarArrecife` rechaza la estaca en cualquier nido sin esa marca (baula, verde, parque). Dos detalles: (1) los nidos de la arribada **anteriores a la v12.6.1 no tienen entidad** («antes nunca eclosionaban», comentario de `arribada.js:31`) y ahora tampoco aceptan la estaca: el aviso dice «sigue su curso solo», cosa que **no es cierta** para ellos (no eclosionan); (2) `be0.type !== 'nest'` mira el tipo **sin** marcar; al marcar, el tipo pasa a `'nido'` y `tickTortugasArrecife` ya revisa `'nido'`: coherente. |
| **Vivero con `FLUID === 1`** | ✔ funciona, pero deja pasar las piscinas subterráneas y el agua celeste (punto 5). |
| **`MIN_IDS` con su versión** | ✔ `version.js`: `MIN_IDS = { …, version: '12.6.0' }` y `tools/revisar-version.mjs` compara `MIN_IDS.version === MIN_VERSION` (pasa hoy, ambas `'12.6.0'`). Atrapa el descuido de subir una y no la otra. **No** atrapa «agregué ids y no subí nada»: eso ya lo hace la firma (bloques, ítems y hash). Nada en el juego **lee** `MIN_IDS.version`: es solo del script. |
| **Nido protegido** (`game.js`) | ✔ al romper un `nido_marcado` se borra la entidad (`setBE(…, null)`). Queda un hueco: `world.setBlock` **no** limpia la entidad de bloque, así que un nido marcado que desaparece por **otra vía** (explosión, dinamita, agua o un pistón) sigue **huérfano** y puede seguir «naciendo». Arreglo general: limpiar la entidad en `world.setBlock` cuando el bloque viejo tenía una (o en `onBlockChange`). **Por confirmar** si las explosiones llaman a `setBlock`. |
| **Poner bloques agachado** (`usarArrecife`) | ✔ `sneaking && held && isBlockId(held.id)` sale con `false` antes de cualquier rama; así se puede apoyar un bloque contra el coral, el vivero, la pecera y el nido. Efecto colateral aceptable: agachado con un bloque en la mano ya no marca un nido con la estaca (la estaca no es bloque, así que no se afecta). |
| **`Number.isFinite` en lo importado** | ✔ `numeros()` en `T()` y `A()`, `Number.isFinite(F[k])`, `be.eclosiona`, `be.dia` y `pagar` con `!(u > 0)` (acepta `NaN`). No cubre los **elementos** de `vivos` (punto 4) ni el tamaño de `fragCoral` importado (el recorte de 400 solo corre cuando se saca un fragmento). |

## Pruebas pendientes (para quien construya, en tab-1)

1. **Orilla:** Medio y Alto, de día, mirando una orilla en diagonal con agua de 1 bloque de hondo: no debe haber franja oscura ni corte (punto 1).
2. **Arrecife:** buceando a 4 bloques con la careta, ¿se ve el coral? (punto 2).
3. **Frontera:** captura de la costura cercana/lejana al atardecer, Alto y Ultra (punto 3).
4. **Costo:** medidor de GPU, agua encendida y apagada, misma vista, Medio y Alto; apuntar los milisegundos (la tarea dice < 0.1).
5. **Debajo del agua:** mirar hacia arriba al mediodía: ¿se ve el sol?
6. **Reflejo de noche y con lluvia:** sin brillo del sol fuera de lugar.
7. **Importar:** un mundo con `meta.arrecife = { vivos: [1, null], revividos: 60 }`: no debe lanzar errores en consola.
8. **Vivero:** en una piscina bajo el nivel del mar y bajo agua celeste: debe negarse.
9. **Saqueadores:** atrapar uno no baja la reputación y salen ≤ 2 por noche (con `/prueba` si existe).

*Escrito por la sesión investigadora, solo lectura.*
