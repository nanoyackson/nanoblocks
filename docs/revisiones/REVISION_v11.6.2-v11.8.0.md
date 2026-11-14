# Revisión independiente v11.6.2 → v11.8.0

Alcance: `git diff v11.6.1..v11.8.0` (46 archivos, +1835/−166; tres commits: `2bc16b6` v11.6.2, `dfe46f1` v11.7.0, `97b967d` v11.8.0). Las líneas son las del tag `v11.8.0` (el árbol de trabajo trae cambios sin commitear de la siguiente versión: no se revisaron). Solo lectura, sin correr el juego. `npx eslint src tools` termina sin avisos.

Lo que se ejecutó (no solo se leyó): `blocks.js` y `recipes.js` en Node para comprobar cajas y recetas; un script que lista todos los `onHurt` y qué devuelven; un script que busca `//` que se traga propiedades en la misma línea.

Severidad: crítico · alto · medio · bajo. Cada hallazgo se verificó leyendo el código de alrededor.

---

## Hallazgos verificados

### 1. [ALTO] El clic central en plena pelea puede cambiarle el arma por un bloque
`src/game.js:579` (`onMouseDown`, botón 1) + `:587` (`heavyAttack`) + `:1721` (`pickBlock`).

```js
if (button === 1) { if (this.mode === 'survival' && this.mobAlAlcance() && this.heavyAttack()) return; this.pickBlock(); }
```
`heavyAttack()` devuelve **`false`** cuando `this.attackCd > 0` o cuando la mano no tiene arma (`if (!d || !(d.damage || d.machete) || this.attackCd > 0) return false;`). En ese caso el código cae a `pickBlock()` aunque haya un bicho a tiro.

Escenario: pelea con espada, se pulsa el clic central (golpe fuerte) mientras el golpe anterior aún enfría (lo normal al repetir el clic). El rayo de apuntado pasa por el bicho y sigue hasta el suelo o la pared de atrás: `this.target` queda puesto (solo se anula `mobTarget` cuando el bloque está **más cerca** que el bicho). `pickBlock()` ve el bloque, lo busca en la barra (`selectSlot(i)`) o lo trae de la mochila, y **la espada se va de la mano**, a media pelea, sin aviso.

Arreglo: si hay un bicho al alcance, el clic central se consume siempre:
```js
if (button === 1) { if (this.mode === 'survival' && this.mobAlAlcance()) { this.heavyAttack(); return; } this.pickBlock(); }
```

### 2. [MEDIO] Un comentario se tragó las propiedades del escarabajo rinoceronte
`src/bichos3.js:117` (`BICHOS3.escarabajo`).
```js
attack: 4, // 6 mataba al de espada de madera (BALANCE.md, 11-nov) hurtSound: 'dig.wood', idleSound: null, idleEvery: [999, 999],
```
Todo lo que sigue al `//` es comentario: el escarabajo quedó sin `hurtSound`, `idleSound` e `idleEvery`. Efectos: no suena al ser golpeado (`Mob.hurt` llama `audio.play(this.kind.hurtSound)` con `undefined`), y toma el `idleEvery` por defecto `[6, 18]` con `idleSound` indefinido. No rompe nada (`audio.buffer(undefined)` devuelve null), por eso el lint no avisa. Es el único caso en todo `src/` (se buscó el patrón `// … propiedad:`).
Arreglo: mover el comentario al final de la línea o a una línea aparte. **Prevención:** un test en `tools/revisar-datos.mjs` que compruebe que todo `kind` hostil tenga `hurtSound`.

### 3. [MEDIO] «Ordenar la casa» vacía los cofres de misión y el segundo cofre del bolso, y deja sin respetar los cofres con otro nombre
`src/ui.js:1325` (`ordenarCasa`), `src/stations.js:159-160` (`placed`), `src/supervivencia.js:16` (`dropBolso`).

La función arma su lista con `cofresCerca(g).filter((c) => c.be.propio && !bolsos.some((q) => q && q.x === c.x && q.y === c.y && q.z === c.z))`. Tres problemas, todos comprobados:
1. **El bolso tiene dos cofres** (`dropBolso` pone uno en `[x, y, z]` y otro en `[x, y + 1, z]`) y `meta.bolso` solo guarda `{x, y, z}`: se excluye el de abajo; **el de arriba entra** en la lista y se reparte por la casa. `tickBolso` puede dar «¡Recuperó sus cosas!» sin haberlas recogido.
2. **`propio: true` lo pone `Stations.placed()` siempre**, y `placed()` también la llaman los guiones de misión: `rigo.js:47` (el maletín), `reliquias.js:45`, `expediente.js:57`, `archivo.js:93`, `anselmo.js:145`, `encargos.js:79`, `minaoro.js:40`, `hallazgos.js:64`, `historia.js:116`. El comentario de la función dice «solo toca cofres que uno puso», pero esos también cuentan. Con otro cofre propio a menos de 6 bloques, el botín queda mezclado con la casa.
3. **Cofres con nombre libre**: solo se respeta un nombre que mencione una categoría (`categoriaDeNombre`). Un cofre llamado «Provisiones del abuelo» tiene `cat = null` y `nombre` puesto, así que **no entra en `libres`, pero sí se vacía** (`c.be.slots[i] = null` para todos los de `L`) y lo que le toque se llena por el relleno `resto` con cosas cualquiera. No se pierde nada, pero no se respeta el nombre.

Arreglos: (1) excluir también `q.y + 1` (o guardar `meta.bolso.cofres`); (2) que `placed(…, { propio })` reciba un argumento y solo `game.js` (colocar a mano) lo ponga en `true`; (3) un cofre con nombre sin categoría **no se toca** (`if (c.be.nombre && !c.cat) continue;` antes de vaciar).

### 4. [MEDIO] La herramienta sola: la guardia de pelea cubre a todas las herramientas y a los animales «provocados»
`src/game.js:675` (`herramientaSola`).
```js
if (hd && (hd.damage || hd.machete) && this.entities.mobs.some((m) => … (m.kind.hostile || m.kind.boss || m.data.provoked) && dist < 5)) return;
```
- **Todas las herramientas tienen `damage`** (`blocks.js`: `damage: k.baseDmg + m.dmg`), así que con un bicho a menos de 5 bloques el cambio de herramienta se desactiva para el pico, el hacha, la pala y la azada, no solo para las armas. De noche, con una Sombra cerca, uno no pasa de la pala al pico. Es seguro, pero no es lo que dice el texto («con un arma en la mano»).
- **`m.data.provoked` se pone en `true` con cualquier golpe** (`Mob.hurt`) y no se apaga nunca: una gallina o una vaca a la que se le pegó una vez cuenta para siempre como amenaza a menos de 5 bloques. Los dos casos dejan la opción «Agarrar sola la herramienta adecuada» inútil sin explicación.
- **Lo demás está bien:** el umbral de 0.35 s (`br.sostenido`, `br.revisado`) se resetea al soltar (`onMouseUp` pone `this.breaking = null`), un clic corto nunca llega a 0.35 s, y la parte de pelea con `mobAlAlcance()` retorna antes de empezar a picar.

Arreglo: restringir a `claseDe(hd) !== 'herramienta' && claseDe(hd) !== 'pico'`, o a `hd.tool === 'sword' || hd.machete || hd.tool === 'axe' && hostil`; y para el bicho, `m.kind.hostile || m.kind.boss || (m.data.provoked && m.attacking)` (por ejemplo `m.atk || m.attackCd > 0`, o `m.data.golpeT` reciente).

### 5. [MEDIO] El bote todavía atraviesa o se pega en varios casos
`src/mar.js:325` (`boatRide`) y `:342` (comprobación de proa).

El parche mira solo **hacia adelante y en línea recta** (`proa(1.25) || proa(0.9)` con `dir = Math.sign(vel · rumbo)`). Quedan, en orden de probabilidad:
1. **Girar junto a la orilla:** `m.yaw` gira libre (2.5 rad/s) y la caja de choque (cuadrada de 1.4) no gira. Con `dir === 0` (parado) no se comprueba nada, y con `dir === 1` solo se mira la proa: **la popa y los costados entran en los bloques al girar** (visualmente el casco se mete en la playa o en un muro). El casco mide ~3 de largo y la caja 1.4.
2. **En tierra va a 0.7 m/s**, no a 0: `speed = surf !== null ? … : 0.7`. El bote sigue siendo manejable por la playa (más lento que antes). Debe ser 0 (y que `W` baje al jugador o avise).
3. **El salto de varar** (`b.pos.y += 1.05`, una vez cada 1.2 s) **se mueve sin colisión**: solo mira que arriba de la celda de proa haya aire (`hy + 1` y `hy + 2`), no las celdas de los costados ni lo que cubre al casco. Con un voladizo, una raíz o una barandilla, el bote queda enterrado y, como `findSurface` (3 bloques de buscar agua) sigue dando `surf`, el muelle lo tira hacia abajo contra el bloque.
4. **`findSurface` acepta agua hasta 3 bloques por debajo de `y + 0.6`:** un bote encima de la orilla de un charco puede seguir «a flote» sobre tierra firme.

Arreglo: (a) comprobar **proa, popa y los dos costados cada cuadro** (no solo con `dir`), y no permitir el giro (`m.yaw`) si el casco rotado toca un sólido; (b) `speed = 0` en tierra; (c) el salto de varar con `boxHitsSolid` de la caja ya elevada antes de aplicarlo; (d) exigir agua en la celda de la quilla.

### 6. [BAJO] `pickBlock` en supervivencia: usa el id del bloque, no el del objeto; ignora casillas fijas
`src/game.js:1721`.
- Busca `this.target.id` en el inventario. Los bloques cuyo objeto es otro (`wall_torch0..3` → antorcha 42; `furnace_lit` → horno; `door_*` ya está resuelto → 266; `farmland`, cultivos, `bed`, `bonita`, etc.) nunca se encuentran: avisa «No anda antorcha encima» aunque la tenga. Arreglo: normalizar con `b.drop` / `b.placeAs` / una tabla `OBJETO_DE_BLOQUE` antes de buscar.
- La permuta `[inv.slots[k], inv.slots[j]] = …` **saca el objeto de una casilla fija** (`meta.fijas`) y deja ahí lo que hubiera en la barra: se rompe la promesa de «las casillas fijas no se tocan». Arreglo: saltar los índices de `meta.fijas` al buscar `j` (y al elegir `k`).

### 7. [BAJO] Arena: la caída en cadena no tiene tope y el generador sigue sin «despertarla»
`src/world.js:197` (`neighborUpdates`) y `:237` (`fall`); `src/entities.js:900` (`spawnFalling`).

- **El parche cubre lo que el jugador toca**, no lo generado: `Generator.generate()` y `ensureChunk()` siguen escribiendo directo en `c.blocks`, así que la arena que el generador deja sin apoyo (techos de cueva en playa, océano y desierto; vetas de grava; ver el diagnóstico anterior) **sigue flotando hasta que alguien cambie un bloque vecino**.
- **Cascada sin tope.** Con el parche, cada `fall()` llama a `setBlock(AIR)` → `neighborUpdates` → `fall()` de los 4 vecinos y del de abajo, **de forma recursiva y síncrona**. Un techo de arena grande sobre una cueva puede soltar cientos o miles de `FallingBlock` en **un mismo cuadro** (cada uno una malla, un `Body` y `particles.dust` 20 veces por segundo), sin cola ni límite en `spawnFalling`. Con cadenas de miles de bloques conectados la recursión podría pasar de la pila (cada bloque son 3 llamadas): `main.js` captura el error y el juego sigue, pero queda a medias. **Por confirmar en un desierto con cueva grande** (no se probó corriendo).
- **Columnas altas:** la recursión es de la altura de la columna (≤ ~60): sin problema.
- **Chunks sin cargar:** `getBlock` de un chunk no cargado devuelve aire, así que no despierta nada allí (bien), pero **un `FallingBlock` cuyo chunk se descarga mientras cae sigue cayendo en el vacío** hasta `y < 0` y desaparece (con `survival`, además suelta un ítem bajo el mundo).
Arreglo: (a) un presupuesto de caídas por cuadro (cola en `spawnFalling`, por ejemplo 20/cuadro) y hacer `fall` iterativo; (b) un barrido por chunk al cargar que rellene o encole la arena sin apoyo (en generación: sustituir por arenisca/piedra); (c) detener los `FallingBlock` cuyo chunk no está (`!w.isLoaded`).

### 8. [BAJO] Arrastrar el mapa: un clic se pierde si se suelta fuera
`src/ui.js:847` (`openMap`, escuchas de `mousedown`/`mouseup`/`click`).
`mapArrastro` se pone en `true` en un `mouseup` de `window` y solo se limpia en el `click` del canvas. Si se arrastra y se suelta **fuera del canvas**, no hay `click` sobre él y la bandera queda en `true`: **el siguiente clic verdadero para marcar un destino se descarta**. Arreglo: poner `mapArrastro = false` en `mousedown` del canvas y limpiarla con un `setTimeout(0)` tras el `mouseup`.

### 9. [BAJO] El baúl grande no cuenta donde se cuentan cofres
`src/hogar.js:41` (`else if (id === K.chest) n.cofre++`) y `src/vivienda.js:60` (`c.chest = true`) solo cuentan `K.chest`. Quien sustituye sus cofres por baúles pierde esos requisitos de la casa y del lote. Arreglo: `id === K.chest || id === K.baul`.

### 10. [BAJO] `quickStackNearby` («A cofres cercanos») ignora de quién es el cofre
`src/ui.js` (`quickStackNearby`): usa `cofresCerca` sin el filtro `propio` ni el de bolsos. Ya era así con cofres normales; ahora incluye baúles. Puede guardar en un cofre de ruinas o en el del bolso lo que «ya contiene». Mismo filtro que `ordenarCasa`.

### 11. [BAJO] La opción «Movimiento tranquilo» no llega a los portones, ni responde si el sistema cambia
`src/portones.js:23` sigue usando `g.settings.calma`, no `calmaActiva(g)`: con la reducción de movimiento del sistema (sin la opción propia) los portones siguen animando. Además `ui.js` pone la clase `body.calma` solo al sincronizar ajustes; no hay `matchMedia(...).addEventListener('change')`, así que cambiar la preferencia del sistema con el juego abierto no se refleja hasta tocar Ajustes.

### 12. [BAJO] Tirar cosas desde el inventario: casos de borde
`src/ui.js:1378` (`soltarBajoMouse`), `:~420` (`mouseup`), `src/entities.js:900` (`dropItem`).
- **No se duplica ni se pierde nada en el camino normal**: `tirarAlSuelo` crea el objeto y la casilla/cursor se descuenta en el mismo bloque síncrono; `containerChanged('chest')` toca el `BE` (se guarda); `extras()` conserva mejora y aceite; `dur` viaja por parámetro.
- **El tope de 300 objetos en el suelo** (`dropItem`: `if (this.items.length > 300) { this.items[0].remove(); this.items.shift(); }`) **borra el más viejo sin avisar**. Ahora que se puede vaciar un baúl de 54 casillas arrastrando afuera, es posible llegar al tope y perder cosas (incluido un ítem único: ese caso solo lo salva el filtro de chunk descargado, no el recorte).
- **En creativo** arrastrar el catálogo hacia afuera crea 64 objetos reales por soltada (en vez de «borrar»). Arreglo: en creativo el soltar fuera borra el cursor.
- **Soltar el clic fuera de la ventana** del navegador cuenta como «fuera de los paneles» (`e.target` es `html`): tira el cursor.

---

## Por confirmar

- **C1. Salto del Jaguar viejo / puma tras un aturdimiento.** `armas2.js` (`MINIJEFES.jaguar_viejo`) y `bravos.js` guardan `m.data.salto = { fase: 'agazapa', tx, tz }`. El `brain` no corre mientras está aturdido (`decided` es `true`), así que, al terminar el aturdimiento, `S.t` ya venció y el salto sale **de inmediato hacia el punto marcado hace segundos**, sin el aviso de 0.45 s (el anillo ya se apagó). Probable; no se probó.
- **C2. Cascada de arena** (hallazgo 7): rendimiento y recursión **no medidos**.
- **C3. `ordenarCasa` y la brújula/`tickBolso`:** que «¡Recuperó sus cosas!» salga tras ordenar con el bolso cerca se dedujo del código, sin probar.
- **C4. Antorchas de pared y selección:** `world.cajas` usa una caja fina centrada (`CAJA_FINA`) para `thin`, también en las **antorchas de pared** (`wall_torch0..3`), que van pegadas a un costado de la celda. Un rayo cerca de la pared puede no acertarle y apuntar al muro de atrás. No se probó.
- **C5. `Body` y cajas de modelo:** `BOXES` ahora incluye bloques `render: 'model'` con cajas. Hoy solo el cofre las tiene (se comprobó con Node), así que no cambia otra cosa; si se agrega una caja a la cama, la mesa o el trapiche, cambiará su colisión.

---

## Revisado sin hallazgos

1. **Puertas en física, rayo y contorno (`world.cajas`).** Se verificó la geometría contra el modelo de `stations.js` (`buildVisual`, tipo `door`): cerrada es la tabla del frente `z ∈ [0.32, 0.5]` (coincide con el panel de 0.18 en `z = 0.41 ± 0.09`); abierta oscila hacia `−z` para las dos bisagras (se comprobó el signo de `hingeSign` y de la rotación), y la caja `[0.32…0.5, −0.5…0.41]`/`[−0.5…−0.32, …]` es la misma. La orientación sale de `be.facing` de la mitad de abajo (`y − 1` para la de arriba), igual que `textoMirando`. Sin BE se usa `facing 0`, igual que el modelo.
2. **Cerrar una puerta encima de alguien.** `Stations.toggleDoor` no cierra si algún cuerpo (jugador o criatura) toca la celda entera de 1×2 (`intersectsBlock`): es conservador (más de lo necesario, porque la tabla es fina) pero **no deja a nadie atrapado**; el abrir nunca atrapa (la puerta abierta es `solid: false`). `placeDoor` comprueba al jugador antes de colocar (`game.js`, `intersectsBlock` en el bucle de `tall`). La palanca (`game.js:1317`) usa el mismo `toggleDoor`.
3. **Costo de `world.cajas` por cuadro.** La física solo la llama para las 4 ids de puerta (`CAJA_DINAMICA`) y cuando hay una puerta en la caja del cuerpo; reserva 2 arreglos y un `spread` por llamada: despreciable aun con aldeas. El rayo la llama por celda atravesada (≤ ~6 por cuadro) y para cubos devuelve `BOXES[id]` (= null) sin trabajo. `rayoCajas` está bien (ojo dentro de la caja → `ny = 1`; caja detrás del origen → falla).
4. **Ordenar el inventario respeta las casillas fijas.** `sortRange` sigue sacando solo las que no están en `meta.fijas` y reparte saltando las fijas; con `ordenCategoria` el orden es estable y no hay `NaN` (todas las categorías existen).
5. **`ordenarCasa` no pierde ni duplica objetos.** La capacidad total no cambia (misma cantidad de casillas, pilas fusionadas solo cuando son «sueltas»: sin `dur`, `mejora`, `filo`); `resto` encuentra hueco siempre; se guarda con `touchBE` por cofre. El costo es bajo: `cofresCerca` hace 13×7×13 = 1183 consultas y las búsquedas internas son del orden de 10⁶ operaciones simples incluso con 40 baúles.
6. **`be.nombre` y el baúl grande.** `armarTituloCofre` guarda con `touchBE` (el nombre persiste), usa `textContent`, `maxLength 24`, y el campo detiene la propagación de teclas (no cierra el inventario al escribir «e»). `Stations.broken` suelta el contenido de las 54 casillas y borra el `BE`. Mundos viejos: `be.nombre` es opcional; no hay baúles en mundos antiguos; `SAVE_FORMAT` no necesita subir. `textoMirando` muestra el nombre.
7. **`onHurt` con factor.** Se listaron todos los `onHurt`: solo `bichos3.js:321` (cangrejo tenaza) devuelve un número (`0.4`) y `fauna3.js:28` una comparación booleana; el resto devuelve `true`/`false` o nada. El cambio de `Mob.hurt` es compatible.
8. **`consejoUnaVez` y `pistaCaparazon`.** La migración (`consejosVistos ||= CONSEJOS.slice(0, meta.consejo)`) es la misma que usa `tickConsejos`; el único camino donde `pistaCaparazon` crea la lista vacía antes que `tickConsejos` ocurre en mundos de más de 3 días, donde `tickConsejos` ya no corre: inofensivo.
9. **`apagarAviso` y `limpiarFxGolpes`.** `avisoCaida` devuelve ahora la entrada; `apagarAviso` solo adelanta `f.t`; llamarla sobre un aviso ya liberado no hace nada. `limpiarFxGolpes` libera mallas, geometrías y materiales y vacía la lista al reiniciar. En pausa `tickFxGolpes`/`tickPortones` reciben 0.
10. **`calma.js`.** La función combina la opción y el sistema; `matchMedia` se evalúa una vez y `.matches` es vivo. Pendiente solo lo del hallazgo 11.
11. **Los saltos con anillo (puma, Reina, Sombra, Mona, Jaguar):** saltan al punto marcado (`S.tx/S.tz`), el anillo dura el amago más el vuelo y se apaga al caer (`apagarAviso`). `leyendas.js`: `d.aviso` se anula al soltar.
12. **Arpía/Tulevieja:** `m.data.brillo = false` al fijar `windT` resuelve el flag colgado.
13. **Bolsos:** el tope pasó de 4 a 19 (`unshift` + `length = Math.min(len, 19)` = 20 en total), con `todosBolsos` en `ui.js`, `mapa.js`, `encargos.js` y `deathTip`.
14. **`manoIzquierda`.** Libera la mano anterior (geometría y materiales) cuando cambia la apariencia; la comparación usa `JSON.stringify` solo mientras dura el puñetazo.
15. **`Avatar.update`.** Compara por referencia (`meta.apariencia` se reemplaza entera en `armarApariencia`) y arma la firma de armadura solo cuando algún id cambia; el estado inicial `sig = ''` fuerza el primer armado.
16. **Portones.** Cancelar la animación previa de la misma celda (`g.portones.filter`) evita el parpadeo; el `ocultarBloque(true, false)` sin remallar es correcto porque el `setBlock` del mismo cuadro ya marca el chunk, y el `ocultarBloque(false)` del final sí remalla.
17. **Número de versión y formato.** `package.json`, `GAME_VERSION` y la entrada del `CHANGELOG` coinciden en 11.8.0; `SAVE_FORMAT` sigue en 2 y los campos nuevos (`be.nombre`, id 651) son aditivos.
18. **Clic central y `heavyAttack` con la mano vacía:** el flujo con la mano vacía y bicho al alcance cae en el hallazgo 1 (mismo arreglo).

---

## Los 5 más importantes

1. **Clic central en pelea cambia el arma** (hallazgo 1, alto): una línea, y ya está pasando.
2. **El comentario que se tragó `hurtSound`, `idleSound` e `idleEvery` del escarabajo** (hallazgo 2): el lint no lo ve; añadir una prueba de datos.
3. **«Ordenar la casa» toca cofres que no son de la casa** (hallazgo 3): el segundo cofre del bolso, los cofres de misión creados con `placed()` y los cofres con nombres libres.
4. **El bote: popa y costados sin comprobar, 0.7 m/s en tierra y el salto de varar sin colisión** (hallazgo 5): el parche de proa cubre solo el caso más visible.
5. **La arena en cadena puede soltar miles de bloques en un cuadro y el generador la sigue dejando flotando** (hallazgo 7): hace falta cola de caídas y un barrido al cargar.
