# Revisión de v12.4.10 → v12.4.12

Sesión investigadora, **solo lectura**. Alcance: `git diff 85281b8..55ad357` (v12.4.10 «Textos más cortos», v12.4.11 «EXT_ITEM», v12.4.12 «El tablón del pueblo y el Locutor del amanecer»): `src/encargos2.js` (nuevo), el cupo del comprador (`ui.js: renderShop`), `locutor.js` (diferidos), `blocks.js`/`version.js` (rango 1100+).

**Qué corrí:** `revisar-ext-item` (todo bien), `revisar-version` (todo bien), `revisar-nombres` (323 ítems, 0 problemas), `revisar-recetas` (0 tapadas), `revisar-plata` (0 raros), y unos scripts míos que cargan `SHOPS` y `encargos2.js` en Node para ver pagos y listas (en el scratchpad). **No corrí el juego ni `bot-economia.js`** (solo corre en el navegador): los ingresos del punto 2 los razoné con los `SUPUESTOS` del bot y los precios reales de `SHOPS`.

## Los 5 más importantes

| # | Hallazgo | Gravedad | Dónde |
|---|---|---|---|
| 1 | **Un encargo aceptado hoy no se puede entregar mañana.** El tablón compara por `k = pueblo:día:n` con la lista *de hoy*; al día siguiente la lista cambia y el encargo aceptado queda huérfano hasta que vence. El «vence a los 2 días» de los comunes nunca sirve (solo valen los mandados) | **Alta** (falla funcional, no exploit) | `encargos2.js:83–108` (`usarTablon`) |
| 2 | **Los mandados se pagan 4–10 u y el bus cuesta 1–2 u.** Con el bus a cualquier pueblo (`bus.js:173`: `ceil(d/400)`), un mandado es plata casi sin viaje; y se pueden llevar hasta 5 al mismo destino a la vez | **Alta** (economía) | `encargos2.js:62` (pago), `bus.js:173` |
| 3 | **`MIN_IDS` quedó ciego a los ids bajos.** La prueba solo compara el id **máximo** (692 y 1187). El primer bloque de C5 (665) o el primer ítem de pesca (1100) pasan en verde **sin subir `MIN_VERSION`**: un juego 12.4.12 abriría un mundo con ids que no conoce | **Alta** (se rompió lo que la 9.ª revisión quería asegurar) | `version.js:11`, `tools/revisar-version.mjs` |
| 4 | **El cupo del comprador casi no limita:** es **por vecino** (no por oficio) y las cosechas las compran **4–7 puestos distintos**, cada uno con su propio cupo de 30 u. A los volúmenes del bot el ingreso **no baja** (0 %; 14 % si todo va a un puesto) | Media (el objetivo del cupo no se cumple) | `ui.js:1385`, `encargos2.js:171–181` |
| 5 | **Comprar y entregar da ganancia:** el pago es 1.25 × el precio de **compra** en tienda (1.4× urgente, 1.96× grande). Dentro del tope de 40 u son +8 a +19 u/día sin riesgo, y con fama ≥ 5 el tablón de un pueblo sube de 29 a 50 u/día | Media | `encargos2.js:24–35` (`valorRef`, `pagoDe`) |

Más abajo: 6 (`meta.encargos2` dañado rompe el tic de 1 s), 7 (Locutor: el resumen cuenta el tiempo pausado), 8 (fama), 9 (tablón en mundos viejos), 10 (EXT_ITEM: nada usa `id < 600`).

---

## 1. C8-A: `src/encargos2.js`

### 1.1 Repetir encargos guardando y cargando
**No se puede.** `meta.encargos2` (`activos`, `hechosHoy`, `ganado`, `dia`) vive en `g.meta` y se guarda completo con el mundo; `hechosHoy` se compara con `e.k` (que lleva el día) y `ganado` se reinicia comparando `M.dia` con `g.day` (`cumplir`, ≈ 133–138). Cargar un guardado anterior devuelve **también** la plata, así que es el «guardar y cargar» de cualquier juego, no un exploit propio. Lo único a vigilar:
- `hechosHoy` se vacía solo **dentro de `cumplir`**, no al cambiar el día: un día sin cumplir nada deja la lista del día anterior, pero las claves llevan el día y no chocan. Sin consecuencia.
- Un mundo **importado a mano** puede traer `meta.encargos2` con cualquier forma (ver § 6).

### 1.2 ¿Se pasa el tope de 40 u por día?
**Es un tope blando, como diseñé:** `ganado` cuenta lo que *valía* cada encargo (`a.pago`) y lo que excede de 40 se paga al 40 % (`cumplir`: `min(pago, lleno) + (pago − lleno) × 0.4`). El tope es **por jugador y por día**, entre todos los pueblos. Lo que sí pasa:
- **No hay límite de encargos por día:** 3–5 por pueblo y por día, sin tope de pueblos; cada uno de más aporta el 40 %. Medí el tablón completo de un pueblo (300 días, semilla fija): suma **media 29 u/día sin fama (máx 53)** y **media 50 u/día con fama 5 (máx 101)**. Con fama 5 el tablón de **un solo pueblo** ya llena el tope (40 + 0.4 × 10 ≈ 44 u/día, ≈ 1.8 jornadas, contra la «jornada» de 25 u del diseño).
- **La fama sube rápido** (+1 por encargo, +2 urgente a tiempo): con 5 encargos al día se llega a 5 el segundo día y a 10 (rebaja de 20 % en las tiendas) al tercero. A partir de ahí el tablón siempre está en el techo.
- **El encargo «grande» (fama ≥ 5, el primero del día, ×3 y ×1.4)** puede valer **63 u él solo** (casado: 2 × 3 × 6 × 1.25 × 1.4 × …, ver tabla) y llena el tope de un golpe. Plata por pieza (pago de un encargo base, de uno urgente y de uno grande, en u):

| Pedido | valorRef | n | pago | urgente | grande (n × 3) |
|---|---|---|---|---|---|
| Ceviche / Casado | 6.0 | 2 | 15 | 17 | **63** |
| Gallo pinto con huevo | 5.0 | 2 | 13 | 14 | 53 |
| Balde de leche / Pescado frito | 4.0 | 2 | 10 | 12 | 42 |
| Hierro, cuero, empanada, tapa de dulce, pargo | 1.0–1.5 | 4–6 | 8 | 9 | 32 |
| Cosechas (mazorca, banano, mango, huevo…) | 0.3–0.7 | 8–16 | 7 | 8 | 28 |
| Leña / frijoles / carbón | 0.2–0.3 | 16 | 4–6 | 5–7 | 17–26 |

Recomendación: o bajar el multiplicador grande (×1.4 → ×1.1) o hacer que **el encargo grande no cuente al tope más de 20 u**; y que el techo suba con la fama solo si se quiere (hoy sube solo).

### 1.3 Arbitraje (el punto 5 de arriba)
`valorRef` es el precio **al que la tienda vende** (`SHOPS.sell`, el más barato entre todas) y el pago es **1.25 ×** eso. Si el jugador **compra** lo que se pide y lo entrega, gana el 25 % (40 % urgente, 96 % grande): contra la regla de oro de `BALANCE.md` («nada se puede comprar y revender con ganancia») y contra mi propio diseño («un encargo nunca paga mucho más que comprar»). **Dentro del tope** son **+8 u/día** (1.25), **+11 u/día** (urgente) o **hasta +19 u/día** (grande), sin riesgo y sin salir del pueblo; pasado el tope paga el 40 % de 1.25 ≈ 0.5 de lo gastado y deja de convenir. Ejemplo real: el casado lo vende la soda a 6 u; el encargo de 2 casados paga 15 u (costo 12) y el grande de 6 paga 63 u (costo 36). **Arreglo:** que `valorRef` use el **menor** entre el precio de compra y 0.8 × el de venta más alto *cuando alguna tienda lo vende*, o que el pago sea `min(1.25 × valorRef, 0.95 × precio de compra)`; los encargos de lo que **no** se compra (oficios, pesca) quedan en 1.25.

### 1.4 Mandados que se cobran sin viajar
- **Sin el tablón no se cobra:** `entregar` de un mandado solo avisa que se entrega allá (`encargos2.js` ≈ 111) ✓.
- **Se cobra** al hablarle a **cualquier** vecino del pueblo de destino estando a ≤ 120 bloques de su centro (`entregarMandado`, ≈ 120–131); va antes que la tienda (`pueblo.js: VECINO.interact`), así que **la primera charla con el pulpero entrega el recado en lugar de abrir la tienda** (se nota).
- **Viaje mínimo:** el destino está a 150–600 bloques del pueblo de origen, y hay que llegar a ≤ 120 de él: **≥ 30 bloques** de camino desde la plaza. Pago: `max(4, round(d/60))` = **4 a 10 u**. A pie son 30 s a 2.5 min: razonable.
- **El bus lo rompe** (`bus.js:173`): pasaje `ceil(d/400)` = **1 a 2 u** (ida y vuelta 2–4) contra 4–10 u de pago. Cada viaje en bus deja **+2 a +8 u** y se pueden llevar **5 mandados a la vez al mismo destino** (no hay restricción: `otros[floor(rnd)]` puede repetirse) y cobrarlos hablando 5 veces. Un viaje: 20–50 u por 2 u de pasaje; el tope de 40 u lo frena, pero **con un solo viaje**.
- **Arreglo:** un mandado por destino a la vez, y que el pago suba con el tiempo *real* (no con la distancia en línea recta): por ejemplo `max(4, round(d/60))` solo si no se llegó en bus (marcar `g.meta.ultimoBus`), o restar el pasaje.
- **Tablón fabricado en medio de dos pueblos** (§ 9): en un mundo viejo puede quedar a 75 bloques de ambos; el viaje real baja a ≈ 75. Menor.

### 1.5 Fama negativa
- **Sin piso:** `tickEncargos` resta 1 por cada **urgente** vencido (`R[a.vid] − 1`, ≈ 163–166), sin límite. A ≤ −3, `factorRep` sube lo que cobra la tienda **×1.25** y baja lo que paga **×0.8** (`saberes.js`). Cinco urgentes aceptados y no entregados = −5 y un pueblo caro hasta que se recupere con encargos (+1 c/u).
- **No es explotable** (solo castiga al jugador) pero **sí injusto en dos casos:** (a) **dormir** pasa el día: un urgente aceptado en la tarde vence al amanecer y baja la fama aunque uno solo haya dormido; (b) un urgente aceptado de noche (el día cambia en la madrugada) vence en minutos. Sugerencia: urgente = «hasta el amanecer siguiente», no «hasta el cambio de día», o no penalizar si el jugador durmió.
- **Se avisa:** el toast dice «el pueblo se queja», pero **no dice cuál pueblo ni cuánta fama**. Ayuda mostrar `a.vnombre`.
- **Solo castiga a los urgentes**: los comunes se borran sin castigo ✓ (como dice el CHANGELOG).

### 1.6 El tablón fabricado en un mundo viejo (que se ata al pueblo equivocado)
`usarTablon(g, x, y, z)` usa **la posición del bloque** (no la del jugador): `nearestVillage(x, z)` y `near.dist ≤ 120` (≈ 83–84). Consecuencias:
- **Ata al pueblo más cercano al tablón**, no al que el jugador tenía en mente. Un tablón entre dos pueblos a 95 y 110 bloques va al de 95; a 125 de ambos dice «muy lejos». Es determinista, pero la regla «a menos de 120 del centro» es **laxa**: la plaza de un pueblo mide ≈ 40 de lado, así que se puede poner el tablón en pleno campo, a 100 bloques, y funciona. Sugerencia: bajar a ≤ 60 (el radio real del pueblo) o exigir ≥ 1 vecino a ≤ 30.
- **Dos tablones del mismo pueblo** (uno generado y uno fabricado) **comparten** encargos (`e.k` incluye el id del pueblo) ✓ consistente.
- `nearestVillage` devuelve `null` si `genVersion < 3` (mundos muy viejos): el tablón dice «muy lejos» y no hay manera de saber por qué.
- **Los mundos nuevos** ponen el tablón en `pueblogen.js` (al lado de la cancha, `x − 1, y + 1`, borde oeste a mitad de la cancha) y `pueblo6.js` (parque central, `S(4, 1, 1)`). Revisé que no pisa los faroles de las esquinas ni los marcos de la cancha; **por confirmar con una captura** que no quede enterrado en un pueblo con otra orientación de plaza.

### 1.7 ¿La lista determinista es igual para todos los pueblos?
**No, y está bien.** Medí 300 días con dos pueblos con los mismos oficios: **0 días con la misma lista**; la misma llamada dos veces da lo mismo; `hash3(s, día × 31 + k, vx, vz)` depende de la semilla, del día y de las coordenadas del pueblo. Tres detalles:
1. **No es del todo determinista:** el primer encargo cambia de forma al cruzar **fama 5** (`encargosDelDia` lee `repPueblo`): la lista del día cambia **a mitad del día** (el mismo `k`, otro tamaño y pago). Un encargo ya aceptado conserva lo suyo (se copia a `activos`), pero el que se ve en el tablón cambia. Si se quiere estable: decidir «grande» con la fama **al empezar el día** (guardar `M.famaDia`).
2. **Hash con choque entre días vecinos:** `dia * 31 + k` con `k` hasta 84: la tirada `k` del día *d* coincide con la `k − 31` del día *d + 1* (p. ej. destino del encargo 2 de hoy = tipo del encargo 1 de mañana). Cada tirada sigue siendo uniforme, pero hay **correlación entre días**. Cambiar a `dia * 128 + k`.
3. `oficios(v)`: usa `v.npcs`; si un pueblo no trae `npcs` (pueblos de planes viejos), pide solo «vecino» (3 oficios menos de variedad). Los dos generadores que revisé (`planVillage` y `planVillage6`) sí traen `npcs`.

---

## 2. El cupo del comprador (30 u por puesto y día)

### 2.1 ¿Se reinicia al cambiar de día y al guardar?
**Sí.** `pagarConCupo` / `cupoUsado` comparan `meta.cupoDia.dia` con `g.day`: si es otro día, el objeto se reemplaza entero (`encargos2.js:171–181`). `meta.cupoDia` se guarda con el resto de `meta` (el importador copia `meta` completo: `importar.js` `limpiarValor`). Sin `SAVE_FORMAT` nuevo: correcto, es opcional.

### 2.2 ¿Lo esquiva vender de a 1?
**No.** El cupo suma **u de precio lleno** (`C[clave] += precio`), no unidades: vender de a una pieza, de a un paquete o con Mayús (5 seguidas) da lo mismo; el paquete que cruza el umbral paga a medias (`min(precio, libre) + exceso × 0.4`). El redondeo `precioBonito(…, false)` baja a pasos de 25 colones (nunca sube), así que no abre una rendija. Dos rarezas de pantalla, no de plata:
- **El precio de la fila no coincide** con lo que se paga cuando el paquete cruza el cupo (se ve 3 u y paga 1.8). El toast «ya compró bastante» sale **después** y redibuja la tienda.
- Si el cupo se llena **a mitad de una venta con Mayús**, `openShop` se vuelve a abrir y puede cortar las que faltaban (revisar jugando).

### 2.3 Lo que sí lo esquiva (el punto 4 de arriba)
- **La clave es `${role}:${vid}`** y `vid = ${pueblo}:${nombre del vecino}` (`pueblo.js:671`): el cupo es **por vecino**, no por oficio. Dos vecinos con el mismo rol (poco común) tienen cupos aparte; lo importante es que **cada oficio distinto** tiene el suyo.
- **Las cosechas las compran muchos puestos:** mazorca 7 (buhonero, pulpero, mercader, minisuper, panadera, feriante, tamalera), banano 7, tapa de dulce 7, café en cereza 6, papaya 6, frijoles 4, mango 2, huevo 3. Un pueblo tiene 3–4 de ellos: **el cupo efectivo por cosecha es 90–120 u/día, no 30**. Para llegar a «pagar menos» hay que cosechar **> 60 mazorcas/día en un solo puesto** (0.5 u c/u).
- **Los encargos del tablón no pasan por el cupo.** Ni los pagos de la soda propia ni del mandado.

### 2.4 Billetera y vuelto
Sin problema: `pagarConCupo` devuelve u con pasos de 0.05 (₡25) tras `precioBonito`; `giveColones` → `darColones(n × 500)` arma las piezas de menor a mayor y suelta lo que no cabe (`ui.js: giveColones`); hay monedas de ₡5, 10, 25, 50, 100, así que ₡25 siempre se puede dar justo. **Lo fiado se cobra primero** (`d = min(meta.fiado, pay)`) con el pago **ya recortado por el cupo**: pagar deuda con una cosecha sobrada la abarata. Menor.

### 2.5 ¿Cuánto bajó el ingreso diario de cada oficio?
Razonado con los `SUPUESTOS` de `tools/bot-economia.js` y los precios de `SHOPS` (el mejor puesto por ítem):

| Perfil (bot) | Qué vende a un puesto | u/día (lleno) | Con cupo | Baja |
|---|---|---|---|---|
| **Trabajador** (4 mandados + 6 cajuelas) | cajuelas al caficultor, 4 u c/u (`pueblo.js:365`) = 24 u; los mandados no pasan por la tienda | ≈ 55 | ≈ 55 | **0 %** |
| **Cazador** (premios y botín) | casi todo es premio, no tienda | ≈ 58 | ≈ 58 | **0 %** |
| **Comerciante** (24 mazorcas, 30 café, 8 bananos, 6 pargos, soda) | buhonero 27.3 u + chef de lujo 12 u (+ soda propia) | ≈ 39 | ≈ 39 | **0 %** (14 % si todo va a un puesto) |
| Agricultor grande (supuesto mío) | 120 mazorcas/día a un puesto: 60 u → 42 u; 240: 120 → 66 | — | — | **−30 % / −45 %** en un puesto, **0 %** repartiendo en 3–4 |

**Conclusión:** a los volúmenes que usó la medición de la v11.10.6 el cupo **no baja nada**, y solo morde a quien vende cientos al mismo puesto. Si el objetivo era frenar «la finca que vende todo al pulpero», hay que cambiar la clave a `pueblo + ítem` (cuánto de **esa cosa** se vendió hoy en el pueblo) o a `ítem` en todo el mundo. Los perfiles nuevos «pescador» y «artesano» (C5, C6) siguen **sin agregarse a `bot-economia.js`**.

---

## 3. El Locutor con la fila de diferidos (`locutor.js`)

**¿Se pierde un aviso urgente? No.** Lo urgente se inserta al frente, nunca se saca de la cola (`k < 0 → break`), el cambio a `>=` solo cambia **cuál importante** sale primero (el más nuevo de la misma prioridad), y lo que se saca de la cola pasa a `diferidos` (importante) o `espera` (consejo); solo los de ambiente/registro se botan (al historial). Los diferidos tienen tope de 12 y el más viejo se anota «botado» en el historial: **nada desaparece del todo**.

**¿Aparece el resumen en momentos raros?** Sí, tres, por el mismo motivo: el reloj es `performance.now()` y el aviso lleva `t` desde que se **creó**, pero `tick()` solo corre mientras `ui.state === 'playing'` y no hay aviso en pantalla:
1. **Menús, tienda, libreta, mapa, inventario, pausa** (`ui.state` ≠ `playing`): el tiempo corre y al volver (`playing`) el primer `tick` ve «≥ 2 diferidos con más de 60 s» y **lanza el resumen de inmediato**. Caso curioso: el resumen dice «están en la libreta»; si uno abre la libreta a leerlos y se queda un minuto, **al cerrarla sale el resumen** de lo que acaba de leer. Arreglo: contar solo el tiempo en `playing` (acumular en `tick`), o vaciar `diferidos` al abrir la libreta.
2. **Dormir:** el estado sigue `playing`, así que la ráfaga del amanecer cae justo ahí; el resumen sale **~60 s después de despertar**, en medio de lo que uno esté haciendo («Hoy hay 6 avisos más»). Es el comportamiento buscado, pero por ese minuto **ningún diferido sale solo**: salen mientras haya presupuesto (`POR_MINUTO = 6`) y los primeros 4–6 ya se llevaron el presupuesto.
3. **Muerte y reaparición:** `limpiar()` vacía `diferidos` al salir del mundo; **en la reaparición no se vacía** (por confirmar que no pase por `limpiar`): podría salir el resumen de la vida anterior.

**Otros defectos del Locutor, menores:**
- **Sin duplicados:** `decir()` busca `enCola` solo en `cola` y `espera`, **no en `diferidos`**: el mismo aviso repetido durante la ráfaga llena la fila de copias (hasta 12) y salen todas. Añadir `this.diferidos.find((q) => q.clave === clave)` y sumar `n++`.
- **Sin vencimiento:** un solo diferido (no 2) puede salir **minutos después** (`ambiente` sí tiene un tope de 20 s). Sugerencia: 3 min → al historial.
- **Orden:** un aviso nuevo entra a `cola` y sale **antes** que los diferidos más viejos (los diferidos solo salen con la cola vacía).
- El texto «Hoy hay N avisos más» está bien, pero `N` cuenta los diferidos **al juntarlos**, no los que llegaron antes y ya se dijeron.

---

## 4. EXT_ITEM 1100+ (`blocks.js`, v12.4.11)

**No encontré ningún lugar que use `id < 600`, `id > 599` ni una tabla de tamaño fijo con ítems.** Busqué en todo `src/` y `tools/`: `< 600`, `599`, `new Array(…)` y `Uint8Array(…)` con `MAX_BLOCK` o un número, `isBlockId` y recorridos de `ITEMS`:
- Las tablas de tamaño fijo (`OPAQUE`, `SOLID`, `BOXES`, `FLUID`, `LIGHT_BLOCK`, las del mallador) son de **bloques** (`MAX_BLOCK = 1024`) y los ítems 1100+ no entran.
- `ITEMS` es un **objeto** indexado por id; `getDef`, `maxStack`, `itemName`, `textures.js` (`for (const it of Object.values(ITEMS))`), `creativeCatalog` (`Object.keys(ITEMS)`), `categorias.js` (por `isBlockId` y expresiones regulares), `importar.js` (`idValido`), `inventory.js`, el cofre y la billetera lo tratan sin rangos.
- `VALOR` (`plata.js`) es el valor de las **monedas**, no una tabla de ítems.
- `SHOPS`, `recipes.js` y el recetario usan ids sueltos (el libro 1187 y el tablón 692 están en `recipes` y en el catálogo creativo).
- La prueba `revisar-ext-item.mjs` cubre `getDef`, pila, inventario, guardado, importación y cofre.

**Lo que sí encontré:**
1. **`MIN_IDS` ciego** (hallazgo 3): `revisar-version.mjs` solo mira `Math.max` de bloques e ítems; con `MIN_IDS = { bloque: 692, item: 1187 }`, **cualquier id nuevo por debajo** pasa en verde: los bloques 665–691 de C5–C7 y los ítems 1100–1186. Cuando llegue C5-B (ítem 1100) la prueba no obliga a subir `MIN_VERSION` y **un juego anterior abriría un mundo con ítems que no conoce** (`ITEMS[id].tool` falla: `inventory.js:163`). **Arreglo:** en lugar del máximo, guardar la **cuenta** de ids definidos (`MIN_CUENTA = { bloques: N, items: M }`) o un hash de la lista de claves, y que la prueba falle si **cambia** sin subir `MIN_VERSION`; o una tabla `[{ version, bloque, item }]` con los ids que introdujo cada versión.
2. `MAX_ITEM` (1300) está definido pero **no lo exige nadie** (solo la prueba): un ítem 1300+ pasaría. Añadir un chequeo en `revisar-nombres.mjs` (ítem ∈ `[EXT_ITEM, MAX_ITEM)` si es > 599).
3. Los **ids de ítem entre 600 y 1099** (lo que dejan `EXT_BLOCK` y `MAX_BLOCK`) siguen siendo «bloque o nada»: bien, pero un ítem accidental ahí se vería como bloque vacío. La prueba de nombres lo atrapa.

---

## 5. Otros hallazgos de la versión

### 6. `meta.encargos2` dañado o importado rompe el tic de 1 s
`tickEncargos` (`game.js:2740`) corre **antes** de `tickDespensa`, `tickMision`, `tickHeridas`… en el mismo bloque de 1 Hz. Si el mundo trae `encargos2` sin `activos` (un archivo importado a mano, o un guardado de otra versión), `M.activos.length` lanza `TypeError` **cada segundo** y se **saltan todos los tics que siguen** (despensa, misiones, heridas…); `main.js` lo traga con un `try/catch` y el juego sigue «vivo» pero medio muerto. Lo mismo en `usarTablon` (`M.activos.find`) y `verLibro`. El importador copia `meta` entero (`limpiarValor`) sin validar la forma de `encargos2`/`cupoDia`. **Arreglo:** una función `E2(g)` que normalice (`if (!Array.isArray(M.activos)) M.activos = []`, `ganado`/`hechos` numéricos) y que `tickEncargos` la use; y que `validarMundo` descarte `encargos2` si no es un objeto con `activos` arreglo. Un `pago` enorme en un `activos` importado también se cobra (como cualquier ítem de un archivo importado: aceptable, pero que `cumplir` ponga un tope razonable al pago, p. ej. 100 u).

### 7. Cambios de textos de la v12.4.10
La tabla 1 de `TEXTOS_v12.md` y los cambios de la 2 están aplicados. **Un detalle:** el aviso de feria quedó «Sábado de feria del agricultor, de 8 a 5: sus cosechas valen más con el feriante» y el consejo se quitó ✓; el aviso del producto mejor pagado pasó a «📈 Feria: hoy X se paga N %»: bien. No volví a medir la frecuencia de avisos (la v12.4.12 dice que sí: «6–8 por minuto después del amanecer»).

### 8. Pequeñeces del código nuevo
- `entregar` (`encargos2.js:110–118`) cuenta el ítem **sin mirar la calidad**: con la despensa (`VIDA`) una comida **pasada** vale igual que una fresca (`g.inventory.count(a.id)`).
- `usarTablon` con la herramienta o el bloque en la mano: el `USABLES_CLIC` ya incluye `tablon_encargos`, así que **no se puede poner un bloque contra el tablón** sin agacharse; es el mismo comportamiento de la compostera, aceptable.
- `entregarMandado` busca `g.meta.encargos2`, pero no valida `a.destino`; un mandado importado sin `destino` lanza (mismo punto 6).
- El **logro «De confianza en el pueblo»** se da con 10 encargos totales (`M.hechos`), no por pueblo: el nombre dice pueblo.

---

## 9. Qué haría la constructora, en orden
1. **`MIN_IDS`** (hallazgo 3): cambiar la prueba antes de C5 (si no, se rompe en silencio).
2. **Encargos entregables al día siguiente** (hallazgo 1): comparar por `k` sin el día, o guardar el encargo completo en `activos` y entregarlo desde el tablón de **su** pueblo aunque ya no esté en la lista de hoy.
3. **Mandados:** uno por destino y que el bus descuente o anule el pago (hallazgo 2).
4. **Pago** (hallazgo 5): que ningún encargo de algo que se compra pague más de ~0.95 × el precio de compra; bajar el multiplicador de «grande».
5. **Cupo** (hallazgo 4): clave por `pueblo + ítem` (o por ítem), o subir el tope solo del oficio nuevo; agregar «pescador» y «artesano» a `bot-economia.js` y correrlo en el navegador.
6. **Locutor:** contar solo el tiempo en `playing`; buscar duplicados en `diferidos`; vencimiento de 3 min.
7. **`E2(g)`** normalizando el estado (§ 6) y `dia * 128 + k` en el hash.
8. Fijar el **«grande»** al empezar el día y bajar el radio de un tablón fabricado a ≤ 60 bloques.

*Escrito por la sesión investigadora. Solo lectura: no se corrió el juego ni `bot-economia.js`. Los pagos y las listas salen de cargar el código real en Node; los ingresos por oficio son razonados con los supuestos del bot y no medidos.*
