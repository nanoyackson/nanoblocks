# Revisión independiente v11.9.2 → v11.10.4

Alcance: `git diff v11.9.2..v11.10.4` (52 archivos, +2582/−275; cinco commits: `6901819` v11.10.0, `b628e7c` v11.10.1, `4943032` v11.10.2, `4844517` v11.10.3, `7c15054` v11.10.4). Las líneas son las del tag `v11.10.4`. El árbol de trabajo trae cambios sin commitear de la constructora en `index.html`, `blocks.js`, `compas.js`, `economia.js`, `expediente.js`, `inventory.js`, `save.js`, `style.css`, `supervivencia.js` y `ui.js`: **no se revisaron** (varios tocan justo lo que aquí se marca; ver hallazgo 6). Solo lectura. Se intentó leer el tag con `git checkout`, el sistema lo negó, y no se cambió nada: todo se leyó con `git show` y `git archive`.

Lo que se ejecutó (no solo se leyó), sobre una **copia limpia de `v11.10.4`**:
- `npx eslint . --max-warnings 0` → **0 avisos**; `npx vite build` → **sin avisos** (6.7 s; los íconos de `assets/items` siguen saliendo como archivos aparte, o sea que `assetsInlineLimit` funciona en vite 6.4.6); `npm audit` → **0 vulnerabilidades**.
- `tools/revisar-avisos.mjs`, `revisar-datos.mjs`, `revisar-nombres.mjs`, `revisar-recetas.mjs`: limpios (304 ítems, 0 problemas; urgentes del locutor: 126 → **12**).
- Un script que carga `inventory.js`, `plata.js` y `save.js` en Node y reproduce el **pago con billete grande, la migración, el cambio y `aColones`**; otro que extrae `SHOPS`, `ERRANDS`, `CARTELES`, `MENU` y `PREMIO_BAJA` del código y **recalcula `bot-economia.js` entero** con sus SUPUESTOS.

Severidad: crítico · alto · medio · bajo. Cada hallazgo se verificó leyendo el código de alrededor.

**Cómo funciona la plata ahora** (para leer lo demás): el juego sigue contando en **unidades** (`count(COLON)` y `remove(COLON, n)`), y cada unidad vale **₡500** (`K = 500`). La moneda de siempre (id 360) es la de ₡500 y el «billete de 20» de la v11.10 (id 385) pasó a ser el de ₡10 000 (20 unidades): por eso **no hizo falta escalar los montos guardados** y los cofres y bolsos viejos quedan bien sin tocarlos. `Inventory.add/remove(COLON)` reacomodan **toda** la plata de la mochila en la menor cantidad de piezas (`reacomodarPlata`).

---

## Hallazgos verificados

### 1. [ALTO] Pagar con un billete grande y la mochila llena **hace desaparecer el vuelto**
`src/inventory.js:pagarColones` (y `reacomodarPlata`, `cambiar`) + la migración `save.js:MIGRATIONS[2]`.

```js
pagarColones(c) { const total = this.colones(), paga = Math.min(total, Math.max(0, Math.round(c)));
  this.reacomodarPlata(total - paga);   // ← devuelve lo que no cupo (sobra) y aquí se ignora
  return paga; }
```
`reacomodarPlata` saca **todas** las piezas de plata y vuelve a poner el total en la menor cantidad de piezas, **pero rompe un billete en varios**: ₡19 500 son cinco piezas (₡10 000 + ₡5 000 + 2 × ₡2 000 + ₡500). Si no hay casillas libres para las piezas nuevas, `reacomodarPlata` suma lo que no cupo en `sobra` y la llamada de `pagarColones` **lo tira**. `darColones` (recibir) sí devuelve el sobrante como objeto en el suelo; **pagar no**.

Reproducido en Node (mochila con otras 35 casillas de relleno):

| Caso | Plata antes | Pago | Queda | **Se pierde** |
|---|---|---|---|---|
| Un billete de ₡20 000, mochila llena, pago ₡500 | ₡20 000 | ₡500 | ₡10 000 | **₡9 500** |
| Igual, con **una** casilla libre | ₡20 000 | ₡500 | ₡15 000 | **₡4 500** |

En la tienda (`ui.js`, `renderShop`): `inv.remove(COLON, price)` va **antes** que `inv.add(item)`, así que esto pasa justo al comprar con la mochila repleta, algo común. **Misma falla en dos sitios más:**
- **`cambiar(false)`** (partir billetes en monedas): ignora lo que devuelve `poner(...)` en las dos llamadas; si no caben las monedas, se pierden.
- **La migración 2→3**: `reacomodar` hace `if (i < 0) break;` y **no reparte lo que no cupo**. Con una moneda apilada de 999 (₡499 500) y la mochila llena, quedan **₡480 000**: se pierden **₡19 500**. (Además `desglose` pone `n` billetes en una sola casilla sin respetar el tope de 99: con más de ₡1 980 000 sale una pila de 250 de ₡20 000.)

Arreglo: que `reacomodarPlata` **nunca** descarte (si `sobra > 0`, dejar las piezas sobrantes **en el suelo** a los pies, como hace `add`), que `pagarColones` y `cambiar` usen ese resultado, y que la migración reparta en varias casillas (respetando `maxStack`) y, si no caben, guarde el resto en el banco (`meta.banco`) con un aviso. Una prueba en `tools/` con mochila llena que verifique `antes − paga == después + suelo`.

### 2. [ALTO] Los jefes se pueden «cultivar»: la paga por baja no tiene tope ni enfriamiento
`src/precios.js:PREMIO_BAJA`, `premioBaja`; `src/game.js:killedMob`; `jefes2.js:usarOfrenda`; `inframundo.js:bossSpawn`; `arpia.js:arpiaSpawn`; `final.js:usarCorona`.

La paga es por **baja**, la marca `m.pagado` solo evita pagar dos veces **a la misma criatura**, y **ninguna fuente de jefes tiene enfriamiento por premio**:
- **Ofrenda del monte** (los 6 jefes del monte): la receta es `[29, 408, 375, antorcha]` (una flor, semillas de cacao, un guaro y una antorcha: unas **4–5 unidades, ₡2 000–2 500**, y el cacao se cultiva). `usarOfrenda` no tiene enfriamiento (solo «ya hay un jefe despierto»). La **revancha** (jefe ya vencido) **paga ×1.5**. Un jefe de 80–140 unidades cuesta ₡40 000–70 000 y la revancha ₡60 000–105 000, **de 20 a 40 veces lo invertido**, y la pelea dura 15–40 s con equipo bueno (`BALANCE.md`).
- **Señor del Arenal** (₡120 000): `bossSpawn` vuelve a aparecer **cada ~8 minutos reales** (`bossCdLocal = ck + 480`, o **120 s** si la historia está en el capítulo 6) con 4 % de probabilidad por tic de 2 s, de forma indefinida en el Inframundo.
- **Arpía de la Tormenta** (₡150 000): `arpiaSpawn` cada ~7 minutos (`420`, o **120 s** en el capítulo 7), en las Tierras del Cielo.
- **Corona del monte → Rey Zopilote** (₡500 000): la Corona se hace con los 6 trofeos; como la revancha suelta el doble, **un ciclo de 6 jefes + Rey paga ≈ 1 970 unidades (≈ ₡985 000)** y se puede repetir.
- Para comparar, **un día de trabajo honrado paga ₡12 500 en 20 minutos (₡625 por minuto)**: la Arpía rinde ≈ ₡19 000 por minuto de espera (**30 veces**), el Señor ≈ ₡12 600 (**20 veces**) y las revanchas del monte ≈ ₡30 000 por minuto de pelea.

Arreglo (decidir cuál): que el premio de jefe se pague **una sola vez por jefe y por partida** (`meta.premioJefe[type]`) y la revancha pague un décimo; o **un enfriamiento de varios días de juego por jefe** (`meta.premioJefe[type] = día`); o pagar en objetos y no en plata. En los jefes que reaparecen solos (Señor, Arpía), mismo tope. Y que el bot (hallazgo 3) simule la **revancha**.

### 3. [ALTO] `bot-economia.js`: los SUPUESTOS de cazar no calzan con el código; el balance se mide contra un jugador 10 veces más lento
`tools/bot-economia.js:SUPUESTOS` y `correr`.

Los precios, premios y la mecánica de «Se busca» **sí** calzan (comprobado recalculando el bot con el código real). Lo que no calza es **cuánto hace uno en un día**:

| Supuesto | Dice | El código permite | Dónde |
|---|---|---|---|
| `minijefeCada` | **1 cada 8 días de juego** (≈ 160 min) | **1 cada ~8–10 min reales** (`miniCd` 420, −2 por tic de 2 s, 40 % de acierto, solo de ≥ día 5) → unos 2 por día de 20 min en selva o junto al agua | `armas2.js:miniSpawn`, `entities.js:955` |
| `leyendaCada` | 1 cada 8 días | **~1 por minuto y medio de noche cerrada** (`legendCd` 60, −2 por tic, 35 %), unas 2–4 por noche desde el día 4 | `leyendas.js:legendSpawn` |
| `jefeCada` | 1 jefe del monte cada 15 días, solo 3 jefes | **los que uno quiera** (hallazgo 2), 6 jefes | `jefes2.js:usarOfrenda` |
| (falta) | el Mono congo, el Señor y la Arpía no cuentan | el Mono congo sale **cada ~6 min de día** en la selva (₡16 000–20 000) | `monocongo.js:monoCongoSpawn` |

Con eso, el «cazador» del bot gana **₡27 000 por día** (recalculado: 54 unidades), pero un cazador activo en la selva puede sumar **≈ ₡100 000 por día** (≈ 2 minijefes × ₡17 500, ≈ 2 monos × ₡18 000, ≈ 3 leyendas × ₡12 500). Entonces **un pico de hierro de ₡45 000 sale en ~10 minutos de caza, no en 3–5 días**, y el criterio «los tres a menos de 1.5×» (hoy 1.49) solo se cumple porque el bot subestima a uno de los tres. Otros supuestos que conviene fijar: `bravosDia: 2` (sin medir; el código genera bravos por bioma en cada tic), `platosSoda: 2` (clientes: **uno cada 35–75 s de día, hasta 2 a la vez**, ≈ 8–10 por día; ver hallazgo 12), `cajuelasDia: 5` («temporada de café» **no existe en el código**: cada cajuela son 20 granos maduros, `oficios.js:POR_CAJUELA`) y `ventaDia` (40 mazorcas, 48 de café y 16 pargos por día, sin sustento en el código).

Arreglo: poner las cadencias en **minutos de juego medidos** (con una corrida real) y no «cada N días»; sumar Mono congo, revancha, Señor y Arpía; y agregar al informe `ingreso por minuto` junto a `por día` para ver el cazador contra la jornada de ₡12 500.

### 4. [MEDIO] `aColones` reescribe textos que no son montos y se salta otros
`src/plata.js:aColones` y los sitios donde se aplica (`ui.js:dialog`, `pintarAviso`, `tarjetaLogro`, `registroTexto`, `avisoPanel`, `shop-debt`, `libretaHTML` entera, `misiones.js:burbuja`).

Probado en Node:

| Entrada | Salida | |
|---|---|---|
| `Son 40 colones, mi cepa` | `Son ₡20 000, mi cepa` | ✔ |
| `Debe 12 colones (le quedan 3 días)` | `Debe ₡6 000 (le quedan 3 días)` | ✔ (no toca los días) |
| `Cóctel ₡6 000 y pipa ₡700` | `Cóctel ₡6 000 y pipa ₡350 000` | ✘ **₡700 ya era real** |
| `₡500` | `₡250 000` | ✘ |
| `a 300 000 colones` | `a 300 ₡0` | ✘ **mutila las cifras con separador** (`000 colones` se lee como `0`) |
| `Colones: 40` | `Colones: 40` | ✘ no lo convierte |

- **En los textos actuales no encontré ninguno donde un número de días, bloques o cantidades quede pegado a «colones»**: el patrón `\d+ colones` solo casa con montos hoy. El riesgo es **latente**: cualquier texto nuevo con un monto **ya en colones reales** (`₡500`, `700`, `300 000 colones`) se multiplica otra vez ×500. De hecho `lujo.js` tuvo que escribir **«₡1.4»** para que `aColones` lo convierta en ₡700: es un truco que depende de esta función.
- **`regionBanner` no pasa por `aColones`** (`ui.js:regionBanner`, `el.querySelector('span').textContent = lema`): los carteles de `amanecer.js` («Los vecinos se enteraron: N colones»), `apuros.js`, `nemesis.js` («Cuentas saldadas: N colones») y `gente.js` («8 colones») muestran **unidades sin convertir** (₡35 en vez de ₡17 500).
- Aplicarlo a **todo el HTML de la libreta** es frágil (atributos, etiquetas): mejor convertir en el origen.

Arreglo: que **ningún texto lleve el monto escrito**: que lo arme una función (`fmtUnidades(n)`) desde la tabla; y mientras tanto, `aColones` solo sobre un marcador explícito (p. ej. `{₡6}`), y `regionBanner` por el mismo camino. Una prueba en `tools/revisar-avisos.mjs` que falle con `\d+ colones` o `₡\d+` en un literal de `src/` fuera de `plata.js`.

### 5. [MEDIO] Las Sombras ladronas ahora **sí pueden robar plata**
`src/sombras2.js:robar` (≈ 408).

```js
inv.slots.forEach((s, i) => { if (s && i !== inv.selected && !durability && s.id !== 360 && !esUnico(s.id)) c.push(i); });
```
Hasta la v11.10 la plata era solo el id 360 y la ladrona lo excluía. Ahora la plata son **13 ids** (monedas 329, 346–349, billetes 354, 355, 359, 370, 385–387) y **solo el 360 está excluido**: la ladrona puede llevarse hasta **8 billetes de ₡20 000 (₡160 000)** de una pila. Si uno la alcanza, los recupera; si no, se pierden. Arreglo: `esPlata(s.id)` en lugar de `s.id !== 360` (importar de `plata.js`).

### 6. [MEDIO] El banco, el peón y la «mordida» exigen tener en la mano **la moneda de ₡500**
`src/economia.js:104` (`if (held && held.id === COLON)` y `n = held.count`), `src/compas.js:31` (`held.id !== COLON`), `src/expediente.js:188`.

Como `reacomodarPlata` junta la plata en la menor cantidad de piezas, **la moneda de ₡500 solo existe si el total termina en ₡500**; con ₡2 000 o ₡20 000 uno solo tiene billetes y no puede **depositar, contratar al peón ni dar la mordida** («Para abrir una cuenta, tráigame colones en la mano»). Además el banco deposita solo `held.count` de esa pila, no un monto. **El árbol de trabajo ya trae cambios sin commitear en esos tres archivos** (no se revisaron): si es lo que están arreglando, confirmar que acepten `esPlata(held.id)` y paguen el valor de la pieza (`VALOR[held.id] / K`).

### 7. [MEDIO] `cuche_monte` (animal manso) paga; y el reparto en vivo del inventario tiene un hueco viejo y uno nuevo
**7a.** `PREMIO_BAJA.cuche_monte: [4, 7]` (₡2 000–3 500). El cuche de monte es `hostile: false` (`bravos.js:280`, sale en manadas con los saínos desde el día 5, `bravos.js:580`) y `premioBaja` **solo excluye lo domado, la arena y los nidos**. La regla de nanoyackson dice que matar mansos no paga. Arreglo: `if (!m.kind.hostile && !m.kind.boss) return 0` (o sacarlo de la tabla).

**7b. Reparto al arrastrar** (`ui.js:slotDown`, `repartir`, `endDrag`, `closeInventoryDom`):
- **Una casilla con otra cosa recibe el reparto.** `slotDown` empieza el arrastre en **cualquier** casilla, aunque tenga otro objeto, y `slotEnter` solo revisa que las casillas que se **suman** sean del mismo tipo, no la primera. En `repartir`, `if (s) s.count += put` suma el **objeto del cursor como cantidad de lo que haya**: con 20 tablones en el cursor y carbón (5) en la primera casilla, al pasar por una segunda queda **9 de carbón (¡de la nada!) y los tablones se pierden**. El código viejo (`endDrag` de la v11.9.2) tenía el mismo defecto, pero ahora se ve en vivo. Arreglo: en `slotDown`, empezar el arrastre solo si la casilla está vacía o es del mismo tipo (si no, es el clic normal de intercambio).
- **Cerrar el inventario con el botón apretado deja el reparto a medias.** `closeInventoryDom` devuelve el cursor al inventario pero **no limpia `this.drag`** ni avisa a los contenedores (`containerChanged`): el cofre que se modificó en vivo **no se marca para guardar** (los objetos se fueron al cofre y al recargar no están) y el siguiente `slotEnter` con el `drag` viejo vuelve a escribir las casillas desde `d.orig`, pisando lo que haya. Solo Esc lo cancela. Arreglo: `if (this.drag) this.cancelarReparto()` al inicio de `closeInventoryDom`. **Por confirmar jugando** (hay que cerrar con E o Tab con el botón apretado).

### 8. [BAJO] Redondeo y piezas: las monedas de ₡5 a ₡100 **nunca existen**
`src/plata.js:desglose`, `precios.js`.

Como todo se mueve en **unidades de ₡500**, **todo monto es múltiplo de ₡500** y `desglose` nunca produce las monedas de ₡5, ₡10, ₡25, ₡50 y ₡100 (ni los precios pueden ser ₡700, ₡800 o ₡1 250: los precios caen en ₡500, ₡1 000, ₡1 500…). Es consecuencia de `K = 500`: se pidieron monedas desde ₡5. **Decisión de nanoyackson**: dejar `K` o bajarlo a 50 (cada unidad ₡50; los montos de hoy ×10), y de paso `desglose` descarta en silencio lo que sobra de menos de ₡5 (`Math.round` y piezas): hoy inalcanzable, pero quedaría si algún monto llega en colones sueltos.

### 9. [BAJO] Otros
- **`beforeunload`** (`ui.js`): solo pregunta si `world.dirtyMods.size > 0` (cambios de bloques). Un autoguardado en curso ya vació `dirtyMods` (`game.js`: `dirtyMods.clear()` va **antes** del `await saveWorld`), y los cambios solo de inventario o de vida no cuentan: la pestaña se cierra sin aviso y se pierden hasta 30 s. En desarrollo, un `location.reload()` también dispara el aviso.
- **`tickCaidas`** (`world.js`): `caidasVueltas` no se vacía cuando el chunk por fin carga y la caída se resuelve (fuga mínima).
- **`ANCLAS` y la «regla de oro»** (`pueblo.js`): las anclas se aplican **después** del bucle de la regla y solo **suben** precios de venta, así que no abren huecos nuevos; pero la tabla de ventas de la **soda propia** (`economia.js:MENU`) sigue en valores viejos y **ya paga más de lo que cuesta comprar el plato**: la soda paga 3 por una tortilla que la tienda vende a 0.67 (×4.5), 5 por una empanada que cuesta 1 (×5), 7 por un tamal de 2.5 (×2.8), 8 por una sopa de 5. Ya era así antes (tortilla ×3), pero con ≈ 8–10 clientes por día es una fuente de plata que el bot no cuenta. Conviene revisarla junto con el hallazgo 2.

---

## Revisado sin hallazgos

1. **Migración 2→3 y mundos viejos con plata fuera de la mochila.** Cofres, bolsos (cofres con `be.slots`) y lo que está en el suelo **no necesitan migración**: la moneda 360 sigue siendo 1 unidad = ₡500 y los billetes 385/386/387 conservan su valor (20, 50 y 100 unidades = ₡10 000, ₡25 000 y ₡50 000, `VALOR`). Las dos piezas «viejas» (386, 387) se cuentan en `colones()` y se cambian solas la primera vez que uno paga o recibe. Los objetos sueltos no se guardan. (Salvo la pérdida del hallazgo 1 con la mochila llena.)
2. **`PREMIO_BAJA`, claves y pagos dobles.** Las 31 claves existen en `MOB_TYPES` (`becquer`, `viejo_monte`, `mono_congo_gigante`…); `m.pagado` evita que una misma baja pague dos veces; los `drops` con colones de la Chata, el Mico Malo, la Mona y el Mono congo se **quitaron** (no se suman a la paga); el Bailarín conserva su `[COLON, 20, 40]` (no está en la tabla); la arena y los nidos no pagan por baja (`m.data.arena`/`nido`; las Sombras de las olas ni están en la tabla). El «Se busca» **sí se suma** a la paga (premio de cartel + `premioBaja`), y el «Chata deudor» además devuelve `D.n + 10`: es intencional, pero tres pagos por una sola pelea.
3. **El resto de `bot-economia.js`.** Calzan con el código: las metas (`ANCLAS`: comida 5 + 9 + 3 = 17 unidades = ₡8 500; pico 90; arco 70; cama 50; carreta 35; bici 170; lote 600; moto 1 800), la cajuela (5), el encargo medio (7.9), el cartel (la suma `+ min(40, ⌊día/3⌋·5)` y el ritmo de «uno cada 3 días» son exactamente los de `recompensas.js`) y el importe de `MENU`. Importa lo exportado (`ERRANDS`, `CARTELES`, `MENU`) correctamente.
4. **Pointer lock con reintento** (`ui.js:lockPointer`, `fail`). No hay bucle: el reintento se agenda **una sola vez** (`lockReintento`), solo si el estado es `'playing'` y se repone al lograr el lock. Con un panel abierto (inventario, mapa, libreta, tienda, pausa, **modal**: `abrirModal` pone `state = 'modal'`) no se pide. El clic que recupera el mouse no juega y los siguientes, pasados 1.5 s, sí.
5. **Atajos bloqueados** (`ui.js`, el `keydown` en captura). Excluyen los campos de texto (`INPUT`, `TEXTAREA`, `contentEditable`: el nombre del cofre, la búsqueda de recetas y la consola `/` siguen escribiendo) y solo actúan en estados de partida (`playing`, `inventory`, `map`, `libreta`, `shop`, `paused`, `dead`, `command`); en el **menú y los ajustes no tocan nada**. El **modo foto (F2)** usa W/A/S/D, Ctrl, Espacio, Shift, Z/C/Y/O/T/V y 1–3: el Ctrl+S/Ctrl+D que antes abría «Guardar» o «Marcadores» ahora no (mejora); F2 no se bloquea. Alt (soltar con Alt+clic) sigue funcionando. Efecto secundario a saber: **F5 y Ctrl+R quedan bloqueados en pausa y en la pantalla de muerte**.
6. **Teclas 1–9 desde la salida de la mesa** (`ui.js:aLaBarra`). Fabrica **una** vez por pulsación: se sale si hay cursor o arrastre, ignora `e.repeat`, revisa antes que la receta quepa en la casilla (`barra.count + r.out[1] > maxStack`) y solo después llama `takeResult(false)`; las casillas fijas se respetan; del horno solo se saca; a la armadura solo entra su pieza.
7. **`solidoEn()`** (`world.js`, usado por flechas, plumas, dardos y bombas). Usa `cajas()` en coordenadas locales 0–1 (la misma que la física), devuelve `true` si el bloque es sólido sin cajas y es de costo despreciable (una llamada por proyectil por cuadro).
8. **vite 6.4.6 y eslint 9.39.5.** `package.json` los fija exactos y el `package-lock.json` lo refleja; `vite.config.js` **no cambió** y no necesita cambios: `server: { port, strictPort }` sin `host` (queda en `localhost`: no se expone a la red), `server.fs` en sus valores por defecto (estricto), `base: './'`, `assetsInlineLimit` en forma de función (sigue válido en vite 6.4: los PNG de ítems salen aparte) y `manualChunks` funcionando. `eslint.config.js` no cambió y el lint pasa en cero. Los `tools/*.js` que se importan con ruta `/tools/…` en `npm run dev` siguen dentro de la raíz permitida.
9. **Lo de la tercera revisión.** `clasificar` bajó de 126 a **12 urgentes**; los «importantes» esperan como mucho 10 s; `enCombate` pide proximidad o un golpe reciente; los avisos con el inventario abierto salen en `avisoPanel`; `cruda` ya viaja en `extras`; «Ordenar la casa» pide confirmación y lista los cofres (`confirmarCasa`); `ui.js:231` ya usa `textContent`; `importWorld` limpia el nombre del mundo y de los cofres (`limpio`).
10. **`presentarJefe` por el locutor** (`jefes3.js`): usa `textContent` y hace fila; **barrerse hacia donde se camina** (`combate.js:trySlide`): reinicia `hurtTilt` y `flipPitch`; **comer variado** (`variedad.js`): un premio por día, sin posibilidad de repetirlo.

---

## Por confirmar

- **C1. Cadencias reales de aparición** (hallazgo 3): están leídas del código (tics de 2 s en `entities.js:955`); falta una corrida de 60 minutos reales en la selva anotando minijefes, mono y leyendas por día.
- **C2. Cuántos clientes atiende de verdad la soda propia** (35–75 s entre clientes, solo si hay rótulo cerca y es de día): afecta el supuesto `platosSoda` y el arbitraje.
- **C3. Cerrar con E o Tab con el botón apretado durante un reparto** (hallazgo 7b): se dedujo del código.
- **C4. Los cambios sin commitear** en `economia.js`, `compas.js`, `expediente.js`, `inventory.js` y `save.js` pueden resolver 1 y 6; no se revisaron.

---

## Los 5 más importantes

1. **Pagar con un billete grande y la mochila llena pierde el vuelto** (hallazgo 1, alto): hasta ₡9 500 al comprar un ₡500; la misma pérdida en `cambiar(false)` y en la migración (₡19 500 con una moneda de 999). Reproducido en Node. `reacomodarPlata` nunca debe descartar lo que no cabe.
2. **Los jefes se pueden cultivar** (hallazgo 2, alto): la Ofrenda cuesta ₡2 000–2 500 y no tiene enfriamiento, la revancha paga ×1.5, y el Señor del Arenal y la Arpía reaparecen solos cada 7–9 minutos pagando ₡120 000 y ₡150 000: entre 20 y 30 veces el ritmo de la jornada. Premio una sola vez por jefe, o enfriamiento.
3. **El bot mide contra un cazador 10 veces más lento** (hallazgo 3, alto): supone un minijefe y una leyenda cada 8 días; el código da uno cada ~8–10 minutos y una cada ~1½ minutos de noche. Con eso un pico de hierro sale en ~10 minutos de caza y no en 3–5 días.
4. **`aColones` mutila o multiplica de nuevo textos ya reales** (hallazgo 4, medio) **y los carteles (`regionBanner`) no lo usan**: «a 300 000 colones» → «a 300 ₡0», «₡500» → «₡250 000», y «Cuentas saldadas: 40 colones» sale sin convertir.
5. **La plata nueva rompió dos reglas viejas** (hallazgos 5 y 6): las Sombras ladronas ya pueden robar billetes (solo se excluía el id 360), y el banco, el peón y la mordida exigen tener en la mano **la moneda de ₡500**, que casi nunca existe con la plata junta en la menor cantidad de piezas. Más el cuche de monte (manso) que paga y el reparto en vivo que suma el objeto del cursor a otro tipo de objeto.
