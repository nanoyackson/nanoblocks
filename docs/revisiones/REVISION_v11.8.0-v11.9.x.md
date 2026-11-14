# Revisión independiente v11.8.0 → v11.9.2

Alcance: `git diff v11.8.0..v11.9.2` (tres commits: `88755be` v11.9.0, `c682400` v11.9.1, `c6e4465` v11.9.2; 32 archivos de `src/` y `tools/` con cambios de verdad, el resto son avisos que pasaron a llevar su categoría). El tag `v11.9.2` ya existe. Las líneas citadas son las de ese tag; el árbol de trabajo trae cambios sin commitear de la siguiente versión (`index.html`, `blocks.js`, `inventory.js`, `textures.js`, `ui.js`) que **no** se revisaron. Solo lectura; no se corrió el juego ni `npm run build`/`lint` (el árbol sucio los volvería no comparables con el tag).

Lo que se ejecutó (no solo se leyó):
- `src/locutor.js` importado en Node para correr `clasificar()` sobre **los 810 textos** que el código le pasa a `toast`/`decir`/`banner` (extraídos con una expresión regular de `src/*.js`; las partes con `${}` se sustituyeron por «X»).
- Un `Locutor` de prueba con una `ui` falsa para reproducir interrupciones y el modo pelea.
- `tools/revisar-recetas.mjs`, `tools/revisar-nombres.mjs`, `tools/revisar-datos.mjs`: los tres terminan limpios (251 recetas, 0 tapadas o muertas; 295 ítems, 0 problemas; 0 texturas, sonidos o propiedades perdidas).
- La función `apuntalar` copiada a Node y medida sobre un chunk sintético de 16×16×128.
- `blocks.js` en Node para comprobar qué bloques traen `wall`.

Severidad: crítico · alto · medio · bajo. Cada hallazgo se verificó leyendo el código de alrededor.

---

## Hallazgos verificados

### 1. [ALTO] `clasificar()` marca como «urgente» más de la mitad de lo que no lo es
`src/locutor.js:18-30` (`URGENTE`, `PRIMER`, `clasificar`).

```js
const URGENTE = /tsunami|incendio|…|\bYA\b|…|lava|…/i;     // línea 18
const PRIMER = /^\s*(⚠|🌊|🔥|🩸|☠|🆘|🚨)/u;                // línea 19
```
- **`\bYA\b` con la bandera `i`** casa con la palabra «ya» en minúscula, que en español aparece en cualquier frase («Ya tiene 30 marcadores», «Ya hay un reto en marcha», «Ya está llena»). Estaba pensado para el «YA» de «¡Suba YA!».
- **Los seis emojis de `PRIMER` valen urgencia por sí solos.** «🔥 Qué rico se está junto al fuego…», «🌊 La ola pasó por debajo, rugiendo…», «⚠ Algo brilla en el zacate…» salen como urgentes.
- **`lava` sin `\b`** casa con «lavanderas» (`rioypatio.js`: «🧺 Unas lavanderas golpean la ropa…»).
- (Menor: `ahógando` está mal escrito con tilde y nunca casa; `se ahoga` sí.)

Medido sobre los 810 textos: **126 salen «urgentes»; 52 lo son solo por la palabra «ya», 20 solo por el emoji y 1 por «lavanderas»: 73 de 126 (58 %) no son urgentes.** Ejemplos: `arena.js` «Ya hay un reto en marcha», `comodidad.js` «🌇 Ya casi oscurece…», `supervivencia2.js` «♨ Agua hervida: ya se puede tomar sin miedo», `supervivencia3.js` «🩹 Vendado: ya no sangra», `jefes3.js` «👑 Ya cayeron los seis jefes del monte…», `saberes.js` «📖 Ya se sabe todas las recetas de este libro».

Por qué importa: un «urgente» **interrumpe** lo que está en pantalla, **se salta el filtro de repetidos de 20 s** (`decir`: `cat !== 'urgente' && …`), **se salta el tope de 6 por minuto** (`tick`: `libre` solo cuenta para los no urgentes) y **sale en plena pelea**. Es justo lo que el locutor venía a evitar.

Reproducido con un `Locutor` de prueba:
```
decir('🏆 Primera casa', importante)   → sale en pantalla
decir('Ya hay un reto en marcha')       → urgente: lo interrumpe al instante
cola resultante: [urgente «🔥 Qué rico se está junto al fuego…», importante «🏆 Primera casa»]
```
El logro desapareció antes de leerse y esperó turno detrás de dos textos que no eran urgentes.

Arreglo: (a) `\bYA\b` sin la `i` (solo mayúsculas) o quitarlo; (b) `PRIMER` solo con `⚠ 🚨 🆘` (🔥 y 🌊 son la mayoría de los falsos); (c) `\blava\b`; (d) que los avisos que **de verdad** son urgentes (tsunami, incendio, sangrado, se rompió la herramienta, ahogo) pasen `{ cat: 'urgente' }` desde donde se emiten, y la adivinanza por texto sea el último recurso y conservadora; (e) una prueba en `tools/` que corra `clasificar` sobre todos los literales y falle si hay más de ~40 urgentes o alguno contiene «ya» en minúscula sin otra palabra de la lista.

### 2. [MEDIO] En pelea, lo «importante» (logros, misiones, jefes, plata) espera y la fila se lo come
`src/locutor.js:92-107` (`tick`), `:46-54` (`enCombate`), `:79-85` (tope `COLA_MAX = 4`).

`tick` solo saca algo no urgente si `!combate && libre`. `enCombate()` es cierto cuando hubo daño hace menos de 4 s **o** hay un bicho `hostile`/`boss`/`provoked` a menos de 12 bloques, **sin mirar si lo ha visto a uno o está dormido**. Mientras tanto, lo importante que llega se encola y, pasado el tope de 4, se **bota** lo más viejo de menor prioridad (queda en «Lo que se dijo» como «no salió»). En una pelea larga (jefe, noche con varios hostiles cerca, una manada) el jugador no ve su logro, la misión ni la plata que cobró, y cuando se calma se pierde la relación con lo que pasó.

Probado con la `ui` falsa: con `danoT` reciente, `decir('👑 El Cuche Mayor despertó', importante)` no se muestra (queda esperando).

Arreglo: que un «importante» que lleva más de ~10 s esperando salga aunque haya pelea (corto, sin interrumpir lo urgente), y que `enCombate()` exija que el bicho esté **persiguiendo o atacando** (`m.atk`, `m.data.provoked` reciente) y no solo vivo y hostil a 12 bloques. **Por confirmar jugando** qué tan seguido queda uno «en combate» sin pelear (noche en el pueblo con bichos).

### 3. [MEDIO] «Ordenar la casa» sigue tocando cofres de misión que ya existen en los mundos viejos
`src/stations.js:placed` + `src/comodidad.js:260` (`cofresDeCasa`).

El arreglo de v11.9.2 es correcto **para lo que se cree de ahora en adelante**: `placed(…, propio = false)` y solo `game.js:1287` pasa `true`. Pero `propio: true` lo ponía `placed()` en **todos** los cofres desde la v4.49 (`git log -S'propio: true' -- src/stations.js` → `a6de40a`), así que en los mundos ya jugados el maletín de Rigo, los cofres de `reliquias`, `expediente`, `archivo`, `anselmo`, `encargos`, `minaoro`, `hallazgos`, `historia` y el cofre de arriba del bolso **conservan `propio: true`** guardado. El segundo cofre del bolso sí queda cubierto (por posición, `q.y + 1`), los de misión no. No hay migración.

Arreglo posible: en `migrate`/al cargar, quitar `propio` de los cofres que están dentro de una estructura de misión (o en una lista de posiciones que cada script ya conoce), o al menos que «Ordenar la casa» **muestre cuántos cofres va a tocar** antes de mover nada. **Por decidir (nanoyackson)**: sin una regla para los viejos, lo más sencillo es la vista previa.

### 4. [BAJO] Tirar la cantimplora sin hervir y recogerla la deja limpia
`src/inventory.js:13` (`extras`) + `src/game.js:627` (tirar con Q) + `src/entities.js:dropItem`.

`cruda: true` vive en la pila de la cantimplora (`supervivencia2.js:beberDelRio`). Al tirarla o moverla por código que usa `extras(s)`, solo viajan `mejora` y `filo`, así que **la que se recoge de nuevo ya no es `cruda`**: tirar y recoger es hervir gratis. (Mover la pila entre casillas no pierde la marca; el paso por los cofres no se verificó.) El logro `hervir` solo se da en `cocinarEnFogata`, así que el atajo no lo regala: lo único que se pierde es la molestia de hervir.

Arreglo: sumar `cruda` a `extras` (`s.cruda ? { cruda: true } : …`) y a donde se rearma la pila al recogerla. Nota: `inventory.js` tiene cambios sin commitear de la siguiente versión; coordinar con la constructora.

### 5. [BAJO] El barril de lluvia llena la cantimplora «limpia» y el agua del río no
`src/monte.js:84` (`barrilInteract`) vs `src/supervivencia2.js:62-69` (`beberDelRio`).

Del río o del lago, la cantimplora sale `cruda`; del barril de lluvia sale limpia aunque sea agua que cayó del techo. Puede ser a propósito (agua de lluvia = potable). **Por decidir (nanoyackson)**; si no es a propósito, el barril también debería pasar `cruda: true`. Los otros orígenes de agua (`agua_celeste` limpia) están bien.

### 6. [BAJO] La insolación solo ocurre entre las ~11:17 y las ~16:05 y solo en cuatro biomas
`src/supervivencia2.js:exposicionSol` (`if (t < 0.22 || t > 0.42) return 0`) y `:tickSed` (`sol` se calcula solo si el bioma es `bosque_seco`, `beach`, `desert` o `guanacaste`).

Con la fórmula del propio locutor (`Locutor.anotar`: hora = `((time + 0.25) % 1) × 24`, así `time = 0` es las 6:00) la ventana es 11:17–16:05. El comentario dice «mañana y tarde fuertes» pero deja fuera de las 6:00 a las 11:17, cuando el sol del trópico ya pega. Es una decisión de diseño más que un error. **Por decidir (nanoyackson)**; si se quiere ampliar, `t > 0.04 && t < 0.46` cubriría de 7:00 a 17:00. Todo lo demás de la insolación está bien: `solT` sube solo cuando `sol > 0.6`, sin sombrero (`armor[0]`) y con `water < 10`; baja 3 por segundo bajo techo o sombra; sale a los 90 s juntos; las hojas valen 0.5 (no cuenta) y la lluvia 0.2.

### 7. [BAJO] Una caída pendiente se descarta si su chunk se descarga antes
`src/world.js:tickCaidas` (`!this.isLoaded(x, z)` → `continue`).

El `continue` saca la entrada de la fila sin volverla a mirar; si el jugador se aleja justo entonces, la arena queda colgando hasta que algo toque a su vecino. Muy poco probable (la fila avanza 24 por cuadro) y sin pérdida de datos. **Por confirmar** con un techo de arena muy grande cerca del borde de la distancia de dibujo.

### 8. [BAJO] El historial repite lo que vuelve a la fila después de una interrupción
`src/locutor.js:75` (`decir`, rama `urgente`) + `:109` (`mostrar` → `anotar(e, 'dicho')`).

Un «importante» interrumpido por un urgente regresa a la fila y, al volver a salir, se anota otra vez como «dicho» (si entre medio hay otro texto, el historial lo muestra dos veces). Sin pérdida; solo ruido en «Lo que se dijo». Arreglo: marcar `e.visto = true` al interrumpirlo y no volver a anotar ese mismo `e`.

---

## Por confirmar (no se pudo verificar leyendo)

- **C1. Avisos que se generan dentro del inventario** (`ordenarCasa`, «A cofres cercanos», «Fije una receta primero»…). `tick` no muestra nada mientras `ui.state !== 'playing'` **pero sí deja vencer** el aviso actual. Hay que mirar jugando si esos mensajes se ven encima del inventario, salen recién al cerrarlo (ya fuera de contexto) o se pierden con la fila.
- **C2. Los avisos nuevos de «Lo que se dijo» (`libreta.js:dichoHTML`)** no se probaron en pantalla: el HTML se arma con `e()` que escapa `&<>`; revisar que no se rompa con comillas en los atributos (no hay atributos con texto, así que debería estar bien).
- **C3. El bote entre dos orillas** (`mar.js:cascoChoca`): si el casco roza en dos puntos, solo gira «para soltarse»; si ningún giro reduce el choque, la proa no puede girar. En la práctica se sale de reversa (retrocede mientras reduzca puntos), pero **jugarlo** en una cala estrecha.
- **C4. `lint` y `build` sobre el tag** no se corrieron (árbol sucio).

---

## Revisado sin hallazgos

1. **`findRecipe` y `recortar`** (`recipes.js`). Se recortan filas y columnas vacías (el mazo, con una columna vacía a la derecha, ya coincide), se comprueba `pat.length/pat[0].length > size` sobre el patrón recortado y el espejo sigue funcionando. La prioridad «forma antes que suelta» guarda solo la primera suelta y devuelve la de forma si existe; no cambia lo que ya funcionaba. `tools/revisar-recetas.mjs`: 251 recetas, 0 tapadas.
2. **Las cinco recetas arregladas** (plato vacío `[' P ','PPP']`, cartelito `['P','S']`, cajuela `['SSS','S S']`, jabalina `['  I',' S ','SS ']`, mazo): ya no chocan con el bote, el trompo, las estacas ni la lanza.
3. **`world.apuntalar`** (`world.js`, al final). Recorre desde `CAPA` (salta la capa 0), mira el bloque de abajo (`i - CAPA` es correcto con el índice `x + z·16 + y·256`), y como va de abajo hacia arriba, una columna de arena colgada solo convierte la de más abajo. **Costo medido: 0.08 ms por chunk** (16×16×128). `ensureChunk` lo llama sobre lo generado y antes de aplicar `mods`, así que se calcula igual cada vez y **no necesita `SAVE_FORMAT`**. En el inframundo no hace nada (la ceniza va sobre basalto, `infragen.js:39`). En los pueblos, un camino de grava sobre un arroyo se vuelve piedra: inofensivo. **Con los mundos viejos**: la única diferencia visible es una arena colgada que el jugador había apuntalado con su propio bloque (los `mods` se aplican después): se ve como arenisca y suelta arenisca. Cosmético.
4. **Las caídas en fila** (`tickCaidas`, `caidasSet`). Se deduplican por `x,y,z`, salen 24 por cuadro, se revalida `gravity` y `SOLID` al sacarlas, y el `setBlock(AIR)` despierta a los vecinos. Ya no hay recursión. (Ver hallazgo 7 para el caso de chunk descargado.)
5. **`exposicionSol` y la insolación**: salvo lo del hallazgo 6, correcta; `g.weather.intensity` y `type` existen (`weather.js:13-14`), `leafy` y `SOLID` se leen bien, 24 lecturas de bloque solo en los cuatro biomas secos.
6. **La cantimplora sin hervir**: el flujo completo es coherente. `beberDelRio` marca `cruda` salvo `agua_celeste`; `game.js:910` no se bebe si es cruda y se apunta a la fogata; `cocinarEnFogata` la hierve y da `hervir`; `tomarCantimplora` da `panza` 25 % de las veces solo en supervivencia; `panza` es un efecto que ya existe (`game.js:2839`); `fichaItem` y `textoMirando` lo anuncian. La pila no se funde con otras (tiene `dur`). (Ver hallazgo 4.)
7. **`pegar()` pasado a `atacar()`** (`bravos.js:28`). Por defecto lleva amago de 0.45 s y pasa por `atacar` (re-entrada protegida por `m.atk`, aturdimiento por `stunT`). El único llamador que usa el valor devuelto es la manada (`bravos.js:55`), que pasa `0` y mantiene el golpe instantáneo (con el castañeteo avisando); los demás (`chupacabras`, `Toro Guaco`, `Chatas`, `Mico Malo`, `bécquer`, `puma`) no dependen del `true`. Efectos secundarios van por `alGolpe(llego)`. El aviso del puma y de la coral sí cambió de texto, sin tocar lógica.
8. **Mi segunda revisión**, punto por punto:
   - Clic central (`game.js:579`): con bicho a tiro es siempre golpe fuerte, aunque enfríe.
   - Herramienta sola: `arma` solo cuenta espada, machete o lo que tiene `damage` sin `tool`; `provoked` ya no cuenta; se añade la pausa de 1.5 s tras un espadazo (`lastHitT` lo pone `combate.js:210` con el mismo reloj).
   - Bote: `cascoChoca` comprueba 15 puntos del casco; solo se mueve si el choque baja; 0.3 en tierra; el varado conserva el requisito de que el casco entre entero.
   - Cofres: `placed(…, propio)` + `cofresDeCasa` (ver hallazgo 3 para los viejos) y los cofres con nombre libre no se tocan.
   - Baúl grande cuenta en `hogar.js:41` y `vivienda.js:60`.
   - «A cofres cercanos» usa `cofresDeCasa`.
   - Portones usan `calmaActiva` y `calma.js` escucha el cambio del sistema.
   - Soltar fuera: solo dentro de `#screen-inventory` y fuera de los paneles; en creativo borra el cursor; el tope de objetos en el suelo pasó de 300 a 400 y ya no borra ítems únicos.
   - `pickBlock` respeta casillas fijas y el objeto del bloque (`furnace_lit`, antorcha de pared, puerta).
   - Mapa arrastrado: `mapArrastro` se limpia al soltar fuera.
   - Antorchas de pared en `world.cajas`: `wall` es 0–3 en las cuatro (`FACING_VEC[b.wall]` no falla con ningún otro bloque).
   - Salto del Jaguar tras un aturdimiento: se vuelve a marcar el anillo desde cero.
9. **Locutor, resto**: `duracion` (mín. 2.5 s, 55 ms por letra, tope 9 s, escala 0.75/1/1.4) correcta; fusión de repetidos (`×n`) en pantalla y en fila; ambiente descartado si hay fila, hay pelea, salió otro hace menos de 45 s (salvo «Todos») o esperó más de 20 s; `consejo` espera 8 s de calma y no sale en pelea; `registro` va al rincón sin hacer fila; modo «Pocos» bota ambiente y consejos ya vistos; `limpiar(todo)` vacía todo; historial con tope de 60 y `ui.avisos` de 40; los ajustes `avisos` y `lectura` existen en `index.html`, `ui.js` y se guardan con los demás. La llamada `toast(texto, ms, cat)` es compatible con los viejos `toast(texto, ms)` (el `ms` se ignora).
10. **Los avisos reescritos** (84 archivos): los cambios son de categoría y de texto; ninguno cambió lógica ni condiciones. `tools/revisar-datos.mjs` no encuentra propiedades tragadas por comentarios.
11. **Versión y formato**: `GAME_VERSION` 11.9.2, `CHANGELOG` y `package.json` coinciden; `SAVE_FORMAT` no cambió y no hacía falta.

---

## Los 5 más importantes

1. **`clasificar()` convierte en «urgente» el 58 % de los urgentes** (hallazgo 1, alto): quitar `\bYA\b` con `i`, el emoji 🔥/🌊 y `lava` sin `\b`, y que lo urgente de verdad pase su categoría explícita.
2. **En pelea lo importante nunca sale** (hallazgo 2): dejar pasar a los «importantes» que esperan más de ~10 s y afinar `enCombate()`.
3. **«Ordenar la casa» en mundos viejos** (hallazgo 3): los cofres de misión ya guardados con `propio: true` siguen contando; al menos mostrar cuántos va a tocar.
4. **La cantimplora se «hierve» tirándola y recogiéndola** (hallazgo 4): sumar `cruda` a `extras()`.
5. **Decisiones para nanoyackson** (hallazgos 5 y 6): ¿el agua del barril es limpia?, ¿el sol pega desde las 7:00 o desde las 11:00?
