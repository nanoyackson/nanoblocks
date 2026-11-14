# Preparación de C5 (tortugas, arrecife y pesca), perfiles del bot y fase 2 de los jefes

Sesión investigadora, **solo lectura** (encargo 34). Estado base: `v12.5.1` (HEAD `7b15242`). Contra el **código de hoy**, no contra el diseño: `DISENO_CONTENIDO_C5-C8.md` (C5-A, C5-B, C6), `DISENO_JEFES_Y_FINAL.md` (fases 0–2), `BALANCE.md` § Jefes, `precios.js`, `tools/bot-economia.js`.

**Cómo se hizo:** leí `arribada.js`, `mar.js`, `mar2.js`, `monte.js`, `redes.js`, `fauna.js` (nidos), `game.js` (pesca), `torneo.js`, `panga.js`, `pezvela.js`, `precios.js`, `pueblo.js` (`SHOPS`), `encargos2.js`, `ui.js` (cupo) y los jefes de `jefes2/3`, `arpia`, `inframundo`, `caverna`, `archivo`. **Corrí** scripts míos (en el scratchpad) que cargan `SHOPS` real y simulan los perfiles nuevos; los números de la § 1.5 y de la § 2 salen de ahí. **No corrí el juego ni el bot** (`bot-economia.js` y `bot-pelea.js` solo corren en el navegador): lo marcado «📏 medir» hay que correrlo en la pestaña 1.

## Lo que cambia respecto del diseño (léalo primero)

1. **Las tortuguitas y los nidos YA existen.** `fauna.js` tiene el mob **`tortuguita`** (2 de vida, corre al mar, logro «Viste a las tortuguitas llegar al mar»), nidos con entidad de bloque `{ type: 'nest', hatch }` y **`tickNests`** (`fauna.js:737`, llamada desde `game.js`) que a su hora los revienta y suelta 3–6 tortuguitas; la **baula** (`fauna2.js:136`) y la tortuga verde (`fauna.js:~333`) ya dejan esos nidos. **Lo único que no tiene nido «vivo» es la tortuga lora de la arribada** (`arribada.js: TORTUGA_LORA.brain`, estado `cava`: pone el bloque `K.turtle_nest` con 25 % y **sin entidad**, así que nunca eclosiona). C5-B **no crea un mob nuevo ni un sistema de eclosión**: le pone entidad a los nidos de la lora, y encima suma la estaca, las amenazas y el pago.
2. **La pesca de hoy ya paga lo más alto del juego.** Con los precios reales de `SHOPS`, `fishLoot` (30 capturas en 8 minutos de pesca, vendidas a los mejores compradores) da **≈ 70 u/día (≈ 2.8 jornadas)**: más que el cazador (58 u), el trabajador (55 u) o el comerciante (39 u) del bot. El diseño suponía 6–12 capturas por día y un techo de 1.6 jornadas: **está 3–5× por debajo de lo que ya pasa** (el `Bobber` pica cada ~11 s: 30 capturas en 8 minutos, § 1.5). Por eso **C5-A no puede subir el ingreso**: tiene que repartir (variedad, zonas, carnada) y bajar un poco (perla del 3 % al 1 %).
3. **La caña `357` está escrita a mano en 5 sitios** (`game.js:1112` y `:1536`, `pezvela.js:88` y `:124`, `torneo.js:14`). Con la caña de fibra (1100) y la de altamar (1101) la boya no se lanza, se cancela sola y el torneo no abre. Hay que cambiarlos por una función **`esCana(id)`** (el ítem ya tiene `rod: true`).
4. **Los pescados están en listas por id en ~12 sitios** (`CRUDO` de `comodidad.js`, `expediente.js`, `fuerza.js`, `plato.js`; `game.js:2943` y `:2950`; `supervivencia2.js: CRUDO_A_COCIDO`; `despensa.js: VIDA`; `panga.js: PESCA`; `torneo.js: PESOS`; `mar.js: isFish`; `finca.js:211`, `:222`; `recipes.js:136, 296–298, 320`). Un pescado nuevo que no esté ahí **no se cuece, no se pudre, no cuenta para el torneo, no lo come el gato**. Propongo un **registro único** (`esPescado(id)` en `blocks.js`) antes de agregar especies.
5. **`fishLoot` lo usa solo `game.js:1508`** (el diseño decía que también lo usan el torneo y la panga: no). Cambiar su firma es de bajo riesgo.
6. **El cupo del comprador no frena la pesca:** es **por vecino** (`ui.js:1385`, `${role}:${vid}`), y los pescados los compran **cuatro puestos** (pescador del muelle, `sodera`, `sodera_playa`, `chef_lujo`): el cupo efectivo es ≈ 90–120 u/día, no 30. Los números de abajo modelan eso.
7. **Los encargos 2.0 (`encargos2.js`) pagan 1.25 × el precio de compra en tienda**, y `PIDE.sodera_playa` ya pide pescado (361, 363, 366): con especies nuevas hay que **decidir** cuáles pide el tablón (§ 1.4).
8. **Cada tanda con ids nuevos exige subir `MIN_VERSION` y copiar la firma** (`MIN_IDS = { bloques, items, hash }`, `tools/revisar-version.mjs`, v12.5.1): C5-B y C5-A son **dos versiones**, y cada una hace el paso.

---

# 1. C5-B (tortugas y arrecife) y C5-A (pesca), contra el código de hoy

## 1.1 Ids (665+ y EXT_ITEM 1100+): el registro que sigue vigente

Verificado hoy (`node`): bloques usados desde 663: **663 y 664** (postigo girado) y **692** (tablón). Libres: **665–691** y **693–1023**. Ítems ≥ 1000: solo **1187** (libro de encargos). Libres: **1100–1186** y **1188–1299**. `MAX_BLOCK = 1024`, `EXT_ITEM = 1100`, `MAX_ITEM = 1300`. Nada choca con el registro de C5 del diseño; lo reproduzco **con la tanda a la que pertenece cada id**:

| Tanda | Bloques | Ítems |
|---|---|---|
| **C5-B1 «Nidos»** | **668** `nido_marcado` | **1124** `estaca_nido`, **1125** `banderita_azul`, **1126** `cabuya` (la cabuya la pide la estaca) |
| **C5-B2 «Arrecife»** | **697** `coral_blanco`, **669** `vivero_coral`, **671** `pecera` | **1121** `fragmento_coral` |
| **C5-A1 «Pesca»** | **667** `boya` | **1100** `cana_fibra`, **1101** `cana_altamar`, **1102** `lombriz`, **1103** `sardina`, **1104** `senuelo`, **1105–1112** peces (`machaca`, `tilapia`, `robalo`, `trucha`, `sabalo`, `pez_gallo`, `atun`, `pargo_mancha`) |
| **C5-A2 «Mariscos y cocina»** | **670** `secadero` | **1113** `langosta`, **1114** `camaron`, **1115** `piangua`, **1116** `ostion`, **1117–1120** platos y `pescado_seco` |
| **C5-A3 «Muelle y vela»** (opcional, después) | **665** `muelle`, **666** `pilote` | **1122** `vela_lona`, **1123** `bote_vela` |

**Cada tanda:** (1) agregar los ids en `blocks.js` (`defs` o `simpleItems`); (2) `node tools/revisar-version.mjs` falla y **imprime la firma nueva**: subir `MIN_VERSION` en `version.js` y copiar `MIN_IDS`; (3) `revisar-nombres` (cada ítem con su ícono: `ARTE` + `public/sprites/arte/<clave>.png`) y `revisar-recetas` en 0; (4) los pedidos de arte salen del registro del diseño. **Aviso del diseño original:** el bloque `coral_blanco` (697) y el ítem `cabuya` (1126) se agregaron al registro tarde; confirmar que están en `PEDIDOS_ARTE`.

## 1.2 Orden de construcción propuesto (cada una, jugable y probada)

| # | Versión | Qué entra | Por qué en este orden |
|---|---|---|---|
| 1 | **C5-B1** | Eclosión de los nidos de la lora, estaca, saqueadores, la voluntaria, banderita | Casi todo ya existe (nido, tortuguita, `tickNests`); es la más barata y prueba el flujo de ids |
| 2 | **C5-B2** | Coral blanco, vivero, fragmentos, pecera | Solo toca `mar2.js` y bloques; independiente de la pesca |
| 3 | **C5-A1** | `esCana`, `esPescado`, cañas, carnada, zonas y `fishLoot` nuevo, 8 especies, libro del pescador | El núcleo; **aquí se rebalancea** (§ 1.5) |
| 4 | **C5-A2** | Nasa por zona (tope 6), mariscos, veda, cocina, secadero | Depende de las zonas de A1 |
| 5 | **C5-A3** | Muelle, bote de vela | Opcional; no toca la economía |

## 1.3 Funciones exactas por archivo

### `arribada.js` (C5-B1)
| Función / lugar | Cambio |
|---|---|
| `TORTUGA_LORA.brain`, rama `d.estado === 'cava'` (línea ≈ 34) | Donde hoy hace `w.setBlock(x, y, z, K.turtle_nest)` (25 %), agregar **`w.setBE(x, y, z, { type: 'nest', hatch: (g.clock || 0) + 240 + Math.random() * 120, lora: true, dia: g.day })`**: así `tickNests` (`fauna.js:737`) ya los revienta y suelta tortuguitas. **No** cambiar `tickNests`: al eclosionar, lee `be.hatch` |
| `tickArribada` | Sumar el recuento por noche: `g.meta.arribada = { dia, nidos, marcados, saqueados, liberadas }` (opcional, se lee con `??`) |
| Nuevo `tickSaqueadores(g)` en este archivo | Las 4 noches siguientes a una arribada: ≤ 2 `saqueador_nidos` por playa (reusar el modelo del cazador de `furtivos.js`: `armar`/`cuadroFurtivos`); cavan solo los `turtle_nest` **sin** marcar (`getBlock === K.turtle_nest`); huyen si uno se les acerca a < 6; golpearlos 2 veces los deja `stunT = 4` y el vecino con rol `guardacostas` (o `voluntaria`) paga 5 u al entregarlo |
| `onHurt` de la lora | Sin cambio (sigue protegida) |
| Nuevo `liberarNido(g, x, y, z)` | Se llama desde `fauna.js: tickNests` cuando el nido es `lora` y **marcado**: cuenta `g.meta.arribada.liberadas += n` y paga a la voluntaria (0.3 u por tortuguita que llegue al agua: se cuenta en `tortuguita.brain`, `b.inWater`, `fauna.js:~384`) |

### `fauna.js` (los nidos, C5-B1)
| Función / lugar | Cambio |
|---|---|
| `tickNests` (737) | Si `be.marcado` **no** reventar con `K.sand`: el bloque 668 vuelve a arena igual. Si `be.lora && !be.marcado` y es de noche: 40 % de «saqueado» (se pierde sin tortuguitas) **solo si hay saqueador vivo** a < 30 bloques |
| `tortuguita.brain` (366) | Al llegar al agua: `if (m.data.lora) g.meta.arribada.liberadas++`; **luz**: si hay `lamp`/`torch` a ≤ 6 de la playa (`g.world.getBlock` en un anillo, cada 1 s por tortuguita) 30 % se desvían a tierra (`m.data.sea = null` y camina 3 s hacia el interior) |
| `tortuguita` `health: 2` | Las defiende el jugador de **fragata/pelícano** (`fauna.js` ya tiene aves: reusar el pelícano; **por confirmar** que exista un mob `fragata`; si no, usar `pelicano` y el cangrejo fantasma de `playa2.js`) |

### `game.js`
| Función / lugar | Cambio |
|---|---|
| `breakBlock` (≈ 866: `if (b.key === 'turtle_nest') { toast; setBE(null) }`) | Agregar `nido_marcado` (no se rompe sin sneak; si se rompe, `-1` de reputación en el pueblo más cercano y un aviso) |
| Colocar `estaca_nido` | En `placeBlock`/uso de ítem: apuntando a un `K.turtle_nest` con `be.type === 'nest'`: `setBlock(…, K.nido_marcado)` y `be.marcado = true`; máx. 12 por arribada (`g.meta.arribada.marcados`) |
| `useRod` (1111) y `updateFishing` (1536) | `held.id === 357` → `esCana(held.id)` |

### `pueblo.js` / `pueblogen.js`
| Lugar | Cambio |
|---|---|
| `SHOPS` | Agregar **`guardacostas`** o **`voluntaria`** (rol nuevo, solo en playas con arribada: en `planVillage6` o como el `buhonero`, vecino suelto con `vid: 'hist:voluntaria'`): sin tienda, con diálogo y el pago; **no** tiene `sell`/`buy` |
| `SHOPS.pescador` (242) | `buy` de los peces nuevos (ver precios § 1.5); `sell` de **`cana_fibra` (30 u)** y **`lombriz`**, **`sardina` (4 por 1 u)** |
| `SHOPS.sodera_playa` (317), `SHOPS.chef_lujo` (294), `SHOPS.sodera` (352) | `buy` de los peces nuevos con los precios del § 1.5 |
| `pueblo.js:365` (parche de cajuela) | Es el patrón para «cambiar un precio al cargar»: **no** replicarlo; poner los precios en `SHOPS` |

### `mar.js` (C5-A1)
| Función / lugar | Cambio |
|---|---|
| **`fishLoot(salt)` (442)** | Pasa a **`fishLoot(salt, zona = null, carnada = null, cana = 357)`**; si `zona` es null devuelve **exactamente lo de hoy** (regla del diseño: lo único que llama es `game.js:1508`). Tabla por zona (§ 1.5); basura del 12 % con **perla 1 %** (hoy 3 %); tamaño `0.7–1.3` en `msg`/dato (sin ítem nuevo: guardar en `meta.pesca.libro[id] = { n, mejor }`) |
| **`Bobber.update` (503)**, rama `state === 'air'` al caer al agua | Calcula la **zona**: `this.zona = zonaDe(w, p, g)` (río: agua dulce, no `ocean/beach`; río frío: altura ≥ 90 o bioma `paramo/nuboso`; estero/manglar: bioma `manglar`; orilla: ≤ 40 de la costa; arrecife: coral a ≤ 6; altamar: ≥ 140 de la costa y con bote). La carnada se lee de la mano libre/hotbar: `g.inventory.count(1102/1103/1104)` o un campo `meta.pesca.carnada` elegido con una tecla (decidir; recomiendo **el primero que haya en la barra**) |
| `Bobber.update`, `this.biteAt` | **Sin carnada correcta: ×1.4** (hoy ×1.0). La carnada correcta **no acelera** (hoy ya es 11 s de media; ver § 1.5): solo evita la penalización y orienta las especies |
| Nueva `zonaDe(w, p, g)` | Reusa `waterAt` y `w.gen.column().biome` (como hoy `salt`), `regionAt` (`regiones.js`) y el recorrido de coral de `mar2.js` |
| `FISH` (13) e `isFish` (15) | `FISH` sigue con los 4 de hoy; agregar un `esPescado(id)` exportado y usarlo en `isFish` y en las 12 listas de la § «Lo que cambia» punto 4 |
| `seaSpawn` (400) | Cardumen de atún visible en altamar (`E.spawnMob('pez', …)` con `data.atun`): **opcional**, después de A1 |

### `mar2.js` (C5-B2)
| Función / lugar | Cambio |
|---|---|
| `mar2Spawn` (152), bloque «¿hay coral cerca del fondo?» (169–173) | `CORALES()` suma `K.coral_blanco`: **no** cuenta como arrecife vivo (no spawnea cardumen); un fragmento plantado sobre un `coral_blanco` lo reemplaza por uno vivo (`coral_red/orange/yellow/purple` al azar) y suma `g.meta.arrecife.vivos++` |
| Nueva `blanquearArrecifes` (generación) | El 35 % de los arrecifes de un mundo **nuevo** (`genVersion` nueva) llevan parches de `coral_blanco`: en `worldgen.js`/`estructuras.js` donde se ponen `K.coral_*` (busque `coral_red`); **mundos viejos: no** (queda sin parches; se pueden crear a mano con `/dar`) |
| `tickVivero(g)` (nuevo, 1 Hz) | Cada `vivero_coral` (bloque 669 bajo el agua, con `be`) produce 2 fragmentos cada 3 días: guarda `be.t0` y suma a `be.slots` como `monte.js` |

### `monte.js` (C5-A2: la nasa por zona)
| Función / lugar | Cambio |
|---|---|
| `MEDIA` (9) | `nasa: 300` → objeto por zona: `{ rio: 300, estero: 300, arrecife: 360 }` |
| `PRESA` (10) | `nasa` pasa de lista a **`{ rio, estero, arrecife }`** (§ 1.5). Para **mundos viejos**, `PRESA.nasa` sigue siendo la de río con las mismas 4 filas **hasta que se vuelva a colocar** (las nasas ya puestas no cambian de tabla) |
| `registrarMonte` (17) | Guardar la **zona** al poner la nasa: `{ x, y, z, tipo, zona }` (campo opcional; sin él, `rio`) y **contar las nasas del jugador**: `if (tipo === 'nasa' && g.meta.monte.filter(q => q.tipo === 'nasa').length >= 6) → avisar y no registrar` |
| `sirve` (22) | Hoy exige ≥ 2 vecinos de agua. Para arrecife: coral a ≤ 4 (`mar2.js CORALES`); para estero: bioma `manglar` |
| `tickMonte` (35), línea `const [id, n] = sorteo(PRESA[q.tipo])` | `PRESA[q.tipo][q.zona ?? 'rio']` y `MEDIA[q.tipo][zona]`; el aviso «🐟 Algo cayó en la nasa» sigue |
| Mensaje de tope | El jugador ve «Ya tiene 6 nasas puestas»; en mundos viejos con > 6 no se quita ninguna |

### `redes.js` (la red de pesca, C5-A1)
| Función | Cambio |
|---|---|
| `recogerRed` (23) | Hoy usa `FISH` fijos (dorado 15 %, pargo 45 %, corvina 40 % en el mar; guapote/corvina en el río) con `n = 2 + rand*4` cada `ESPERA = 150 s`. **La red no cambia de ingreso**: 2–5 peces por 150 s ≈ 8 por día por red **sin tope de redes**. Sumar `zona` (la del bloque, con `zonaDe`) y usar la tabla nueva **con el mismo número de peces**; **tope de 3 redes tiradas** (`g.meta.redes` ya las lista). La sardina (carnada de mar) sale de **la red** (el diseño lo dice): `if (mar) 1 de cada 4 piezas es sardina (1103)` |

### Otros archivos que no se pueden olvidar
| Archivo | Qué |
|---|---|
| `torneo.js:8` `PESOS` y `:14` | `PESOS` por id (peso, kg) para las especies nuevas; `held.id !== 357` → `esCana` |
| `panga.js:11` `PESCA` | Agregar los peces nuevos de orilla a lo que vende Don Macario |
| `pezvela.js:88, 124` | `esCana` y que `quizaPezVela(g, f)` solo se dé con **caña de altamar** (hoy cualquier caña) |
| `despensa.js:18` `pon([262, 361, …], [2, 4])` | Los peces y mariscos crudos nuevos con `[2, 4]` (2 días buena, 4 pasada); `pescado_seco` con `[30, 60]`; los platos nuevos con `[3, 6]` |
| `recipes.js:136, 296–298, 320` | `cook` y `smelt` de cada pez nuevo a `365` (pescado frito) o a un plato propio; las 4 recetas nuevas del diseño §C5.3; `revisar-recetas` en 0 |
| `variedad.js` | Reconoce `sopa_mariscos`, `arroz_camarones`, `langosta_gratinada` como platos distintos |
| `blocks.js` `ARTE` | Una clave por cada ítem/bloque visible (`revisar-nombres`) |
| `encargos2.js:17` `PIDE` | `sodera_playa: [361, 363, 366]` → sumar 2 especies nuevas **baratas** (machaca, tilapia, pargo mancha); **no** atún ni langosta (el pago `1.25 × valorRef` los volvería la mejor ganancia; ver § 1.4) |
| `ui.js:1385` cupo | Nada que cambiar; solo asegurar que **los compradores de pescado** sean los 4 de arriba (los precios se leen de `SHOPS`) |
| `logros-lista.js`, `libreta.js`, `ayuda.js` | Pestaña «Libro del pescador» (`meta.pesca.libro`), logros y los 5 temas de ayuda |
| `tools/bot-economia.js` | Perfiles de la § 2 |

## 1.4 Qué choca con el cupo por pueblo y por ítem, y con los encargos 2.0

**Cupo del comprador (`ui.js:1385`, `encargos2.js: pagarConCupo`).**
- **Es por vecino y por oficio** (`role:vid`), no por pueblo ni por ítem: el pescador del muelle de un pueblo paga 30 u completas al día **por cualquier mezcla** de lo que le lleven. Los pescados los compran **`pescador`, `sodera`, `sodera_playa` y `chef_lujo`** (por `SHOPS.buy`): **4 × 30 = 120 u** a precio lleno al día. El techo del diseño («Cupo del pescador: 30 u») **no existe en la práctica**: hay que decirlo en `BALANCE.md`.
- **Las especies nuevas necesitan compradores:** si una especie solo la compra el pescador, 30 u de cupo se llenan con 20 róbalos. **Recomendación:** cada especie nueva en **dos** compradores (pescador + una soda) con **precios distintos** (el muelle, el más barato; las sodas pagan más: hoy 1.5 el pargo contra 1 en el muelle) para que el jugador reparta.
- **Si se quiere frenar de verdad:** cambiar la clave del cupo a **`ítem + pueblo`** (ya lo recomendé en la revisión 12.4.10–12.4.12); para el pescador eso es 30 u **por especie y por pueblo**: más variedad = más cupo, que es el incentivo correcto.
- **La banderita azul** (`+25 %` de los turistas de la playa) y el pago de los buzos (10 u/día) deben pasar por **el cupo del guía** (no hay hoy: `turistas.js` paga sin cupo). **Decidir**: o se les agrega cupo (30 u) o se dejan en ≤ 10 u/día como el diseño.

**Encargos 2.0 (`encargos2.js`).**
- **`valorRef` mira `SHOPS.sell` primero:** como el pescador **vende** `361/362/364` (a 1.5/1.5/5 u) y `PIDE.sodera_playa` incluye `361` y `366`, hoy un encargo de pargo paga **1.25 × 1.5 = 1.9 u** por pieza (frente a 1.0–1.5 u por vender), y un encargo de **dorado** paga 6.3 u (la tienda lo paga a 4–5). Con especies nuevas **que la tienda no vende**, el pago cae a `0.8 × lo que paga` ×1.25 = **1.0 ×**: razonable. **Regla:** las especies nuevas **no se venden** en tienda (solo se compran), salvo la carnada.
- **El arbitraje** del hallazgo de la revisión 31 (comprar y entregar) **no aplica al pescado** (se pesca gratis), pero **sí a la carnada** (la sardina se vende a 0.25 u y no se pide).
- **El tope de 40 u/día de encargos** y el cupo de la tienda **suman**: un pescador puede cobrar 40 u de encargos + 120 u de ventas. El techo real lo da el tiempo de pesca (30 capturas), no los topes.
- **El tablón y la veda de la piangua:** un encargo de piangua en veda se vuelve imposible: `encargosDelDia` no sabe de la veda. **No poner piangua en `PIDE`.**

**Torneo y panga.** El torneo cuenta kilos por id (`PESOS`): **sumar** las especies nuevas o, más seguro, `PESOS[id] ?? [0.5, 3, nombre]` por defecto. La panga vende 3 pescados por 6 colones (`PRECIO = 6`): con las especies nuevas **no** subir el precio por pieza (el jugador compra en la panga y vende en el muelle: hoy 3 por 6 colones = 1 u la pieza, 3 piezas a 1 u = 3 u: ya es un pequeño arbitraje que existe; sin cambios).

## 1.5 Números de balance revisados (con `precios.js` y los precios reales de `SHOPS`)

**Cadencia real de pesca** (`Bobber`, `mar.js:503`): espera `4 + 14·U` s (media 11 s) × `(1 − lluvia·0.4)` × `mult.mordida`; ventana de picada 1.3 s (2.3 con `pesca ≥ 5`); si se pierde, otra espera de `3 + 10·U` (media 8 s). Con 1.5 s de acción: **atento 13.8 s por captura (35 en 8 min), promedio 16.3 s (30), distraído 18.7 s (26)**. **Ese es el ritmo que hay que usar**; el diseño decía 6–12 al día.

**Valor de una captura hoy** (`fishLoot`, tabla de `mar.js:442`): al pescador del muelle **1.68 u en el mar** y 1.44 u en el río; vendiendo al mejor comprador de cada pieza **3.18 u** en el mar (perla a 25 u en la inmobiliaria, dorado a 8 en el lujo). La **perla** (3 % de las capturas, 18 u al pescador) es el **32 %** del valor al muelle. **Con el cupo repartido en 3–4 compradores, 30 capturas de mar hoy dan ≈ 70 u/día (2.8 jornadas).**

**Propuesta de precios** (u por pieza; `SHOPS.pescador.buy` y las sodas; las sodas pagan más que el muelle; las especies nuevas **no** se venden en tienda):
machaca 0.5 · tilapia 0.5 · trucha 1 · róbalo 1.5 · sábalo 1.5 · pez gallo 2 · atún 4 · pargo mancha 1.5 · camarón 0.5 · ostión 1 · piangua 0.25 · **langosta 6** · los de hoy no cambian (pargo y corvina 1–1.5, guapote 1, dorado 4–5). **Basura: 12 %, perla 1 %** (hoy 3 %), bota 6 %, oro 1.5 %, palitos 2 %, botella con mapa 1.5 %.

**Tablas por zona** (pesos; el resto hasta 1 es basura del 12 %). Cada línea es lo que el perfil «pescador» de la § 2 usa:

| Zona (caña y carnada) | Tabla | Capturas/día | **u/día** (con cupo repartido) | Jornadas |
|---|---|---|---|---|
| **Río**, caña básica, sin carnada (×0.7) | guapote .36 · machaca .28 · tilapia .24 | 21 | **17.7** | 0.7 |
| **Río frío**, fibra + lombriz | trucha .30 · guapote .28 · machaca .20 · tilapia .10 | 29 | **28.6** | 1.1 |
| **Estero**, fibra + señuelo | róbalo .22 · sábalo .12 · corvina .20 · tilapia .16 · guapote .18 | 29 | **38.6** | 1.5 |
| **Orilla de mar**, básica, sin carnada (×0.7) | corvina .40 · pargo .38 · dorado .05 · pez gallo .05 | 21 | **36.3** | 1.5 |
| **Orilla de mar**, + sardina | igual | 29 | **51.8** | 2.1 |
| **Arrecife**, fibra + camarón | pargo mancha .20 · pargo .28 · corvina .24 · ostión .08 · pez gallo .08 | 29 | **45.9** | 1.8 |
| **Altamar**, bote + caña de altamar + sardina (×0.9 por las peleas del atún) | pargo .32 · corvina .28 · pez gallo .12 · dorado .10 · atún .06 | 27 | **56.2** | 2.2 |

**Lectura (decisiones que le tocan a nanoyackson):**
1. **El «techo de 1.6 jornadas» del diseño no se puede cumplir sin bajar lo que ya hay**: el mar de orilla, que existe hoy y **no necesita nada nuevo**, ya da 2.1–2.8 jornadas. **Propongo techo = 2.2 jornadas (56 u/día a 8 minutos de pesca)**, que es lo que da altamar y deja a la orilla en 1.5 sin carnada (−48 % de lo de hoy) y en 2.1 con sardina (−26 %): son la perla 3 % → 1 % y la penalización ×1.4 sin carnada.
2. **Las cañas no aceleran las picadas** (a diferencia del diseño: −25 %/−40 %): cada reducción aumenta las capturas por día 15–30 % y rompe el techo. Lo que dan: **zonas** (estero, arrecife, altamar), **especies caras** y **no poder pescar en altamar sin la de altamar**. La carnada solo quita una penalización.
3. **Agotamiento (opcional, recomendado):** `meta.pesca.zonas[celda]` con `celda = floor(x/48),floor(z/48)`: tras **10 capturas de especie «buena» (precio ≥ 1.5) en la misma celda el mismo día**, las siguientes salen **solo de la basura y de lo común (×0.5)**. Obliga a moverse y es el mejor freno al «sentarse a pescar 8 minutos en el mismo lugar»; cuesta una tabla pequeña. **Sin esto, el techo depende solo de que el jugador no pesque más de 8 minutos**, lo cual no se puede dar por hecho.
3b. **Si nanoyackson prefiere no tocar lo que hoy paga:** dejar la orilla como está y poner el techo en 2.8 jornadas; las zonas nuevas se quedan **por debajo** (variedad sin plata extra).

**La nasa** (`monte.js`): presas por día = `1200 s / MEDIA` por nasa (**4.0** en río y estero con 300 s; **3.3** en arrecife con 360 s). Valor por presa: **hoy 1.00 u** (la tabla pargo/corvina/guapote/bota) → **24 u/día con 6 nasas** (hoy sin tope). Propuesta: **río** guapote .4, machaca .3, tilapia .3 → 0.70 u (**17 u/día** con 6); **estero** camarón .5, róbalo .2, tilapia .2, bota .1 → 0.85 u (**20 u**); **arrecife** camarón .35, ostión .2, pargo mancha .25, **langosta .04** (6 u), bota .16 → 1.58 u (**32 u/día con 6**). El diseño decía «+8 u de nasas»: **eran 20–32**. Recomiendo **baja la langosta a .03 y el arrecife a MEDIA 420 s** (28 u). **La nasa trabaja con el chunk descargado** (`sirve()` devuelve `true` si no está cargado): una nasa vacía cada día es ingreso pasivo **sin jugar**; el cupo de 6 casillas (`CUPO`) obliga a vaciarla cada ~2 días.

**La red** (`redes.js`): 2–5 peces cada 150 s ≈ **8 peces al día por red**, **sin tope de redes**: es un ingreso **mayor** que la nasa (≈ 8 u/día por red a 1 u la pieza). **Poner tope de 3 redes** y la misma tabla por zona.

**Tortugas (C5-B):** pago de la voluntaria **0.3 u por tortuguita que llega al agua**: un nido da 3–6 (`tickNests`) → **1–2 u por nido**, **tope 30 u por arribada** (24 nidos marcados × 8 de promedio = 6 u por nido; con 12 marcados máx.: ≈ 18 u). La arribada es cada 14 noches (`noche_arribada`: `day % 14 === 7`): **≈ 1.3 u por día de juego**: **no es ingreso, es logro** (como pide el diseño). **Las multas de los saqueadores** (5 u c/u): máx. 2 por playa por arribada → 10 u cada 14 días. **Buzos (coral):** 10 u/día solo con ≥ 60 corales: sin cupo en `turistas.js` hoy: **dejarlo en 10 u/día fijos** y que la voluntaria pague el de las tortuguitas **una vez por arribada**.

## 1.6 Pruebas en la pestaña 1 (con `npm run dev`, puerto 5199)

Convenciones: consola `const g = window.nanoblocks.game`; **con el panel oculto `requestAnimationFrame` no corre**: avanzar con `for (let i = 0; i < 600; i++) g.update(1/60)`; `/dar <clave> [n]`, `/tp x y z`, `/tiempo noche|dia`, `/modo supervivencia`. Mundo nuevo con semilla fija (la del `CLAUDE.md`) y **otro mundo viejo de la v12.4** para la compatibilidad.

### C5-B1: arribada, estaca, saqueadores, voluntaria
1. `/tp` a una playa (bioma `beach`); `g.day = 7` y `/tiempo noche`; avanzar 600 pasos: salen tortugas lora (`g.entities.mobs.filter(m => m.type === 'tortuga_lora')`). Al terminar, **cada bloque `turtle_nest` tiene `g.world.getBE(x,y,z)` con `type: 'nest'`, `lora: true`**.
2. **Eclosión:** avanzar `g.clock` 300 s (`g.update` o `g.clock += 300`): el nido desaparece y salen 3–6 `tortuguita`; llegan al agua y suman `g.meta.arribada.liberadas`.
3. **Estaca:** `/dar estaca_nido 3`, apuntar a un nido y usar: el bloque pasa a `nido_marcado`; **marcar 13**: el 13.º no deja; romper el marcado sin agacharse no lo rompe.
4. **Luz:** poner 1 antorcha a 4 bloques del nido antes de la eclosión y contar cuántas tortuguitas se desvían (≈ 30 %); sin antorchas, 0.
5. **Saqueadores:** `g.day = 8` de noche en la playa con nidos **sin marcar**: ≤ 2 saqueadores; cavan solo los sin marcar; los marcados quedan. Golpear a uno 2 veces → `stunT`; hablar con la voluntaria → 5 u.
6. **Voluntaria:** liberar 100 en total (`g.meta.arribada.liberadas = 99` y soltar una) → `banderita_azul` y el logro; **sin dar plata dos veces** al recargar (guardar, cargar, `liberadas` igual).
7. **Mundo viejo** (v12.4): abrir, ir a una playa de arribada, ver que **sigue sin saqueadores y sin voluntaria** y que los nidos viejos (sin BE) no se rompen ni hacen error.

### C5-B2: arrecife
1. `/tp` a un arrecife (`K.coral_red` cerca); `/dar fragmento_coral 5`; con careta, plantar sobre `coral_blanco` (`/dar coral_blanco`): pasa a vivo; `g.meta.arrecife.vivos` sube.
2. **Vivero:** colocar bajo el agua, esperar 3 días (`g.day += 3`): `be.slots` con 2 fragmentos; no produce en el aire.
3. **Cardumen:** cerca del coral vivo recién plantado, `mar2Spawn` crea peces a 6 bloques (contar en 60 s).
4. **Hitos 20/60/150:** poner `g.meta.arrecife.vivos = 59`, plantar 1 → logro y turistas buzos; **no** pagan 10 u dos veces el mismo día.
5. **Mundo nuevo vs viejo:** el nuevo tiene parches blancos en el 35 % de los arrecifes; el viejo, ninguno.

### C5-A1: pesca
1. **`esCana`:** `/dar cana_fibra`; lanzar y recoger: la boya se mantiene (antes de arreglarlo se cancelaría); lo mismo con `cana_altamar`; con la de pescar de siempre, igual que hoy.
2. **Sin zona = hoy:** `fishLoot(true)` y `fishLoot(false)` sin más argumentos dan la **misma tabla** (1000 corridas: ±2 % por especie con los pesos de hoy).
3. **Zonas:** en cada una (`/tp`) echar 200 lanzamientos con `g.update` (forzar `f.biteAt = f.t` para acelerar) y contar especies: coinciden con la tabla ±5 %; el **río frío** solo con altura ≥ 90 o `paramo`; **altamar** solo sin bote **no** sale atún.
4. **Carnada:** sin carnada, `biteAt` medio ×1.4; con la correcta, ×1.0; `lombriz` baja de la mano al picar.
5. **Ingreso:** con `tools/bot-economia.js` y el perfil **pescador** (§ 2): `await (await import('/tools/bot-economia.js')).correr()` → `pescador` entre **40 y 60 u/día** al día 20; si da > 60, bajar pesos de las especies caras.
6. **Libro del pescador:** pescar 3 especies → «Pescó 3 de N» y récord de tamaño; recargar: persiste (`meta.pesca`).
7. **Torneo:** abrir con la caña de fibra; las especies nuevas suman kilos.
8. **Despensa:** un pez nuevo se pudre en 2–4 días (`g.day += 3` y mirar `estadoComida`); se cuece a `365`; `CRUDO`: no da fuerza.
9. **Compatibilidad:** mundo viejo con una caña `357` en el cofre y la hotbar: sigue andando; un mundo **guardado con v12.5.x** (con `cana_fibra` en el inventario) **no abre** en un juego anterior (MIN_VERSION) y sí en el nuevo.

### C5-A2: nasa, mariscos, cocina
1. **Tope de 6 nasas:** colocar la 7.ª → aviso y no se registra; en un **mundo viejo con 9 nasas** siguen trabajando.
2. **Zona:** una nasa en estero (`manglar`) saca camarón/róbalo; en arrecife (coral a ≤ 4) langosta rara; en río, la tabla de río. Medir 200 presas por zona con `MEDIA = 1`.
3. **Veda:** en `g.day % 30 ∈ [a, a+3]` recoger piangua baja 1 de reputación en el pueblo más cercano (`g.meta.repPueblo`) y el pescador avisa; **fuera de veda**, no.
4. **Cocina:** fogón con `2 camarón + 2 piangua + 1 pescado + 1 balde` → sopa (`1117`); `variedad.js` la cuenta como plato nuevo; la despensa la trata como plato (`[3, 6]`).
5. **Secadero:** `pescado + sal` → `pescado_seco` en 3 días, no se pudre en 30; **no se vende** (no está en ningún `buy`).
6. **Cupo:** vender 40 u de róbalo al pescador: 30 completas y 10 al 40 % (aviso «ya compró bastante»); **venderlo a la sodera** después: paga completo (otro vecino).
7. **Encargos:** el tablón de un pueblo costero con `sodera_playa` pide máx. machaca/tilapia/pargo mancha; ningún encargo pide piangua, atún ni langosta.

---

# 2. Perfiles del bot: «pescador» y «artesano» (en el formato de `tools/bot-economia.js`)

**Cómo se pegan.** Todo va **después de `botin`/`conTope`** (para usar `media`, `SHOPS`, `pago`) y **antes de `correr()`**; dentro de `correr()`, al armar `P`:

```js
// ...dentro de const P = [ ...los tres de siempre,
perfil('pescador', perfilPescador(PESCA, METAS[0][1]())),
perfil('artesano', perfilArtesano(ARTESANO)),
// ]
```
Y en `criterios` (los tres originales siguen igual; el `razon` se calcula **solo con los tres de siempre**, no con los nuevos):
```js
const nuevos = P.slice(3).map((p) => p.porDia);
criterios['pescador y artesano a menos de 2.3 jornadas (57 u/día)'] = nuevos.every((x) => x <= 57);
criterios['pescador y artesano pagan la comida del día'] = P.slice(3).every((p) => p.minimo >= 0);
```
**Qué hacen por día, con qué equipo y qué venden**

| Perfil | Por día de juego (20 min) | Equipo | Qué vende y a quién |
|---|---|---|---|
| **pescador** | **8 minutos de pesca** (≈ 30 capturas, 16.3 s c/u; × 0.7 sin carnada, × 0.9 en altamar por las peleas) + hasta 6 nasas que vacía una vez | empieza con la caña básica en la playa; compra **caña de fibra (30 u)**, luego **6 nasas (24 u)**, luego **bote (120 u) + caña de altamar (90 u)**, siempre en ese orden y con lo ahorrado (come 17 u al día) | todo a los compradores de pescado con **el cupo de 30 u por vecino**: cada pieza va al que más paga y aún tiene cupo; lo que no cabe, al 40 % |
| **artesano** | **8 minutos de taller** (≈ 26 piezas de 18 s) | banco (5 u) y libro (40 u) de **un** oficio (carpintería); con `oficios: 3`, fragua, torno y horno (≈ 70 u en total) | **encargos del tablón** (1 al día, y +1 cada 3 niveles hasta 3) que pagan **1.25 × el precio** y dan **2 × XP**; **mostrador propio** (5 piezas por día como máximo, tope en plata `6 + 3 × nivel`); **no** vende a las tiendas (regla de oro) |

### 2.1 El código (pegar tal cual)

```js
// ---- el cupo del comprador (ui.js, v12.4.12): cada vecino paga completo 30 u al día y el 40 % de ahí en adelante ----
export const CUPO = 30;
const SIN_LUJO = /lujo|bartender|inmobiliaria/;
// quién compra algo y a cuánto (u por pieza), de mejor a peor; los de lujo no cuentan (como precio()); lo que aún no está en SHOPS usa
// el precio de la propuesta, en un comprador llamado «propuesta» (el pescador del muelle)
export function compradores(id, propuesta = {}) {
  const L = [];
  for (const [k, s] of Object.entries(SHOPS)) { if (SIN_LUJO.test(k)) continue; for (const [i, n, p] of s.buy || []) if (i === id) L.push({ puesto: k, p: p / n }); }
  if (!L.length && propuesta[id] !== undefined) L.push({ puesto: 'propuesta', p: propuesta[id] });
  return L.sort((x, y) => y.p - x.p);
}
// vende un día de cosecha: ventas = [[id, cantidad], ...]. Cada pieza va al comprador que más paga y aún tiene cupo; lo que no cabe
// va al mejor al 40 %. Devuelve lo que se cobra y cuánto se perdió por el cupo
export function venderConCupo(ventas, propuesta = {}) {
  const usado = {}, filas = [];
  for (const [id, n] of ventas) for (const c of compradores(id, propuesta)) filas.push({ id, n, ...c });
  let cobrado = 0, lleno = 0;
  const pendiente = new Map(ventas.map(([id, n]) => [id, n]));
  for (const f of filas.sort((x, y) => y.p - x.p)) {
    const quedan = pendiente.get(f.id) || 0; if (!quedan) continue;
    const libre = Math.max(0, CUPO - (usado[f.puesto] || 0)), caben = Math.min(quedan, f.p > 0 ? libre / f.p : quedan);
    if (caben <= 0) continue;
    usado[f.puesto] = (usado[f.puesto] || 0) + caben * f.p; cobrado += caben * f.p; lleno += caben * f.p; pendiente.set(f.id, quedan - caben);
  }
  for (const [id, n] of pendiente) if (n > 0) { const c = compradores(id, propuesta)[0]; const p = c ? c.p : 0; cobrado += n * p * 0.4; lleno += n * p; }
  return { cobrado, lleno };
}

// ---- C5: el pescador ----
export const PRECIO_C5 = { 1105: 0.5, 1106: 0.5, 1107: 1.5, 1108: 1, 1109: 1.5, 1110: 2, 1111: 4, 1112: 1.5, 1113: 6, 1114: 0.5, 1115: 0.25, 1116: 1 }; // lo que paga el muelle por pieza; sale de SHOPS cuando ya estén
export const PESCA = {
  pescaMin: 8, // minutos de pesca por día de juego (de 20)
  segPorCaptura: 16.3, // mar.js: Bobber: espera media 11 s + 1.5 s de acción + picadas que se pierden → 30 capturas en 8 min
  basura: { perla: 0.01, bota: 0.06 }, // fishLoot nuevo: 12 % de basura (oro, palitos y botella valen 0 en el muelle); la perla paga 18
  zonas: { // ids: 361 pargo, 362 corvina, 363 guapote, 364 dorado; 1105… de C5 (pesos; el resto hasta 1 es basura)
    rio: { 363: 0.36, 1105: 0.28, 1106: 0.24 },
    rioFrio: { 1108: 0.30, 363: 0.28, 1105: 0.20, 1106: 0.10 },
    estero: { 1107: 0.22, 1109: 0.12, 362: 0.20, 1106: 0.16, 363: 0.18 },
    orilla: { 362: 0.40, 361: 0.38, 364: 0.05, 1110: 0.05 },
    arrecife: { 1112: 0.20, 361: 0.28, 362: 0.24, 1116: 0.08, 1110: 0.08 },
    altamar: { 361: 0.32, 362: 0.28, 1110: 0.12, 364: 0.10, 1111: 0.06 },
  },
  nasas: { // presas por día = 1200 s / media; se vacían una vez al día; hasta 6
    estero: { media: 300, tabla: { 1114: 0.5, 1107: 0.2, 1106: 0.2 } },
    arrecife: { media: 360, tabla: { 1114: 0.35, 1116: 0.2, 1112: 0.25, 1113: 0.04 } },
  },
  precios: { cañaFibra: 30, cañaAltamar: 90, bote: 120, nasa: 4 }, // u (bote: ANCLAS de precios.js)
};
export function perfilPescador(S = PESCA, gastoDia = 17 /* METAS[0][1]() */) {
  let ahorro = 20; const tiene = { fibra: false, altamar: false, bote: false, nasas: 0 };
  return (d) => {
    const capturas = (S.pescaMin * 60) / S.segPorCaptura;
    let zona = 'orilla', f = 0.7; // al empezar: la playa, caña básica, sin carnada (×0.7)
    if (tiene.fibra) { zona = d % 2 ? 'estero' : 'orilla'; f = 1; }
    if (tiene.fibra && tiene.nasas) zona = 'arrecife';
    if (tiene.bote && tiene.altamar) { zona = 'altamar'; f = 0.9; } // las peleas del atún comen tiempo
    const piezas = capturas * f;
    const ventas = Object.entries(S.zonas[zona]).map(([id, w]) => [+id, w * piezas]);
    const { cobrado } = venderConCupo(ventas, PRECIO_C5);
    const basura = piezas * (S.basura.perla * 18 + S.basura.bota * 1); // la perla y la bota se venden al muelle
    let nasas = 0;
    if (tiene.nasas) {
      const N = S.nasas[tiene.altamar ? 'arrecife' : 'estero'], presas = (1200 / N.media) * tiene.nasas;
      nasas = venderConCupo(Object.entries(N.tabla).map(([id, w]) => [+id, w * presas]), PRECIO_C5).cobrado;
    }
    const dia = cobrado + basura + nasas;
    ahorro += dia - gastoDia;
    if (!tiene.fibra && ahorro >= S.precios.cañaFibra) { tiene.fibra = true; ahorro -= S.precios.cañaFibra; }
    else if (tiene.fibra && !tiene.nasas && ahorro >= 6 * S.precios.nasa + 15) { tiene.nasas = 6; ahorro -= 6 * S.precios.nasa; }
    else if (tiene.fibra && !tiene.bote && ahorro >= S.precios.bote + S.precios.cañaAltamar) { tiene.bote = tiene.altamar = true; ahorro -= S.precios.bote + S.precios.cañaAltamar; }
    return dia;
  };
}

export function tier(S, zona, f) { const piezas = (S.pescaMin * 60) / S.segPorCaptura * f; const { cobrado, lleno } = venderConCupo(Object.entries(S.zonas[zona]).map(([id, w]) => [+id, w * piezas]), PRECIO_C5); const basura = piezas * (S.basura.perla * 18 + S.basura.bota); return { piezas: Math.round(piezas), u: +(cobrado + basura).toFixed(1), ev: +((cobrado + basura) / piezas).toFixed(2), sinCupo: +(lleno + basura).toFixed(1) }; }
```

```js
// ---- C6: el artesano (DISENO_CONTENIDO_C5-C8.md §C6.2): carpintería, herrería y alfarería con nivel de oficio ----
// [nivel, pieza, materiales (u, a precio de tienda), precio de venta (u), oficio]. Los materiales los junta uno mismo (autoabasto)
export const PIEZAS_C6 = [
  [0, 'tabla fina', 0.5, 1, 'c'], [0, 'mango', 1, 1, 'c'], [1, 'mesa grande', 10, 13, 'c'], [2, 'alacena', 11, 15, 'c'], [2, 'mostrador', 7, 10, 'c'],
  [3, 'armario', 14, 18, 'c'], [4, 'puerta tallada', 7, 10, 'c'], [5, 'yugo', 7, 12, 'c'],
  [0, 'clavos x8', 3, 3, 'h'], [0, 'bisagras x2', 3, 3, 'h'], [2, 'herradura x4', 6, 7, 'h'], [3, 'candado', 7, 9, 'h'], [3, 'verja forjada x2', 12, 15, 'h'], [4, 'farol forjado', 7, 8, 'h'],
  [1, 'olla de barro', 2.4, 3, 'a'], [1, 'comal', 2.4, 3, 'a'], [2, 'tinaja', 3.6, 6, 'a'], [3, 'tejas x8', 2.4, 5, 'a'], [4, 'vajilla chorotega', 4.2, 8, 'a'], [5, 'jarron chorotega', 5.4, 9, 'a'], [6, 'chanchito', 6, 9, 'a'],
];
export const ARTESANO = {
  tallerMin: 8, // minutos de taller por día de juego (de 20)
  segPorPieza: 18, // buscar, poner, esperar la tanda y sacar: ≈ 26 piezas en 8 min
  umbrales: [10, 25, 45, 70, 100, 140, 190, 250, 320, 400], // XP por nivel (suma 1 550)
  encargosDia: 3, // máximo al día; empieza con 1 y sube 1 cada 3 niveles (C8-A: los de oficio son una parte del tablón)
  pagoEncargo: 1.25, xpEncargo: 2, // C8-A: pagan 1.25 × el precio y dan 2 × XP
  mostrador: { piezasPorDia: 5, base: 6, porNivel: 3 }, // una pieza cada ~90 s de 8 a 17 h = 450 s: 5 al día; tope 10 + 4 × nivel
  autoabasto: 0.5, // fracción de los materiales que junta uno mismo (sin gastar plata); el resto se compra
  inversion: { banco: 5, fragua: 10, torno: 6, horno: 8, libro: 40 }, // u: ≈ 70 para los tres oficios (§C6.4)
  oficios: 1, // 1 = uno solo (el primero: carpintería); 3 = los tres
};
export function perfilArtesano(S = ARTESANO) {
  let xp = 0, pagado = false;
  const nivelDe = (x) => { let n = 0, t = 0; for (const u of S.umbrales) { t += u; if (x >= t) n++; } return n; };
  return (d) => {
    const n = nivelDe(xp), of = ['c', 'a', 'h'].slice(0, S.oficios);
    let hay = PIEZAS_C6.filter(([nv, , , pr, o]) => nv <= n && of.includes(o) && pr >= 3);
    if (!hay.length) hay = PIEZAS_C6.filter(([nv, , , , o]) => nv <= n && of.includes(o)); // nivel 0 de carpintería: solo tablas y mangos (1 u)
    const dia0 = d <= 5 ? (S.inversion.banco + (S.oficios > 1 ? S.inversion.fragua + S.inversion.torno + S.inversion.horno : 0) + S.inversion.libro * S.oficios) : 0; 
    const precioMedio = media(hay.map((p) => p[3])), matMedio = media(hay.map((p) => p[2]));
    const tope = Math.floor((S.tallerMin * 60) / S.segPorPieza);
    // encargos del tablón (3 al día, de los oficios que tenga): 1.25 × precio; mostrador: hasta 5 piezas y el tope en plata
    const enc = Math.min(Math.min(S.encargosDia, 1 + Math.floor(n / 3)), tope), ventasPos = S.mostrador.piezasPorDia, capU = S.mostrador.base + S.mostrador.porNivel * n;
    const ventaU = Math.min(ventasPos * precioMedio, capU), ventaPiezas = ventaU / precioMedio;
    const ingreso = enc * precioMedio * S.pagoEncargo + ventaU;
    const gastoMat = (enc + ventaPiezas) * matMedio * (1 - S.autoabasto);
    // XP: 2 + precio/2 por pieza, doble en los encargos
    xp += enc * (2 + precioMedio / 2) * S.xpEncargo + ventaPiezas * (2 + precioMedio / 2);
    return ingreso - gastoMat - dia0 / 5; // la inversión (≈ 70 u para los tres oficios) se reparte en los primeros 5 días
  };
}
```

### 2.2 Salida esperada (mis scripts, con `SHOPS` real; la correrá la constructora en el navegador)

- `tier()` por zona (u/día, con el cupo): río básica sin carnada **17.7** · río frío fibra **28.6** · estero **38.6** · orilla sin carnada **36.3** · orilla con sardina **51.8** · arrecife **45.9** · altamar **56.2**.
- **`perfil('pescador')` completo** (progresión por ahorro): ≈ **36 u el día 1**, ≈ **52 u el día 2** (compra la fibra con lo ahorrado), **≈ 62 u del día 3 al 7** (nasas) y **≈ 76 u desde el día 8** (bote y caña de altamar; las 6 nasas de arrecife suman ≈ 20 u). **Es más de lo propuesto como techo (56 u)** porque suma las nasas: **hay que bajarlas** (§ 1.5) o poner el techo en 2.5 jornadas. **Esto es lo primero que tiene que revisar la constructora.**
- **`perfil('artesano')`** (carpintería, un oficio): ≈ −5 el día 1 (la inversión), **≈ 8–10 u del día 2 al 4**, ≈ **25 u el día 5**, ≈ **35 u el día 8**, ≈ **50 u del día 12** en adelante y ≈ 58 u al día 30. Con los tres oficios: negativo hasta el día 5 (la inversión de 70 u), ≈ 26 u el día 8 y ≈ 44 u al día 30. **Más cerca del diseño** (12–18 / 25–32 / 45–50) con `mostrador: { base: 6, porNivel: 3 }` (el diseño decía `10 + 4 × nivel`: con `10 + 4n` un solo oficio llega a **67 u/día**, 2.7 jornadas: **bajar el tope del mostrador**).
- **Nivel por día:** 1 piezas de carpintería (nivel 0) es la parte floja: ≈ 2 u por pieza (tabla fina y mango): **el día 1–3 el artesano gana casi nada**; se compensa con los **encargos de aprendiz** (3 piezas de nivel 0) que el diseño pide: **agregar al perfil un pago único de 5 u** si la constructora los implementa.

**Supuestos que hay que revisar** (anotados en el código): `pescaMin: 8` (¿cuánto pesca un jugador de verdad por día? 👁), `segPorCaptura: 16.3`, `compradoresPescado` (ahora sale de `SHOPS`: 4 puestos), `tallerMin: 8`, `segPorPieza: 18`, `autoabasto: 0.5`.

---

# 3. Fase 2 de `DISENO_JEFES_Y_FINAL.md` («Avisos y lecciones»), con los números medidos

**Qué es la fase 2** (§ 5): *«Los avisos y mecánicas de 2.1–2.3 (carriles y anillos, cascabel, concha rota con un golpe, barrido bajo el anillo, ondas del Señor, Arpía). Verificar: cada jefe enseña lo prometido: una prueba jugada por jefe con la maña apagada; `revisar-avisos.mjs` y lint en cero.»* Las fases 0 y 1 ya están (v12.4.8–v12.4.13): `jefes-balance.js` (vida y presión) y la tabla medida de `BALANCE.md` § Jefes.

## 3.0 Antes de empezar (precondiciones)
1. **Que entre el arreglo del atacante** (`g.atacante`, revisión 33): hoy `jefeDelGolpe` atribuye por vecindad y la fase 2 va a cambiar **qué golpes pegan y cuándo**: sin el arreglo, cada medición mezcla secuaces con jefe.
2. **Remedir la base de los tres que cambiaron en la 12.4.13** (no están en `BALANCE.md`): Murciélago Rey (130), Sombra Madre (600, ×1.5), Rey Zopilote (2500, ×0.85). Correr `JEFES({ solo: ['rey_murcielago', 'sombra_madre', 'rey_zopilote'], veces: 10 })` (`tools/bot-pelea.js`, en el navegador) y anotar **TTK torpe/promedio y recibido** en `BALANCE.md`.
3. **Qué ya está hecho** (verificado leyendo el código; no se repite): Reina Bananera, **salto con `avisoCaida`** (`jefes2.js:40–51`); Don Cornudo, **pisotón con `anilloAviso` de 7** (`jefes2.js:138`) y el aviso de «de frente no le entra» (`:164`); Tata Sapo, **lengua con carril rojo** (`avisoEmbestida`, `jefes3.js:119`); Cascabel, **polvo + sonido 0.8 s antes de salir** (`jefes3.js:150`) y mordida con carril (`:173`); Cangrejo, **concha que solo rompe un golpe fuerte contundente** (`jefes3.js: onHurt`, `D.concha`, `stunT 2.5`); Ciempiés, el **anillo y el aviso de patas** (`jefes3.js:249`); Arpía, **rayos con `avisoCaida`** (`arpia.js:49`) y **ráfaga que se aguanta con escudo** (`arpia.js:~57`); El Olvido, **«respira hondo» con 2 s de aviso** (`anselmo.js: jefeTick`); Rey Zopilote, **anillo del aletazo** (`final.js:122`).

## 3.1 Qué cambia exactamente (lo que **falta** del diseño), archivo por archivo

| # | Jefe (tramo, vida hoy · presión) | Cambio | Archivo y función | TTK hoy (torpe) | Efecto esperado en la medida |
|---|---|---|---|---|---|
| 1 | **Terciopelo reina** (A, 50 · ×1.3) | El **escupitajo** (hoy daño instantáneo 65 %: `armas2.js:210`) pasa a **dar aviso**: 0.5 s con un anillo verde en el suelo donde está el jugador (`avisoCaida`, `golpes.js:112`) y el veneno cae **ahí**; se esquiva rodando | `armas2.js`, `MINIJEFES.terciopelo_reina.brain` (bloque `escupe`) | 6.8 (con 55); ≈ 8 (con 50) | El promedio **recibe menos** (hoy 5.3): subir `dano` de 1.3 a ≈ 1.5 para compensar; correr 10 duelos |
| 2 | **Cocodrilo** (A, 85 · ×0.5) | La **vuelta de cola** (`fauna.js:258–268`, 1.5 cada 0.45 s sin aviso, `armored false`) pasa a **empezar con un anillo rojo de 0.6 s** al salir del agua y **a poder esquivarse saliendo del radio**; la mordida con **brillo dorado** (`atacar` con `brilloAmago`) | `fauna.js` (rama `giro`) y `armas2.js` (el kind `cocodrilo_gigante`); **alias**: la vuelta ya cuenta como golpe del jefe (arreglado en la 12.4.13) | ≈ 9 | Hoy la vuelta es **casi todo el daño** (3.3/s contra ×0.5 en la mordida): con aviso, el `dano` del jefe **sube de 0.5 a ≈ 0.8** para que la mordida cuente; remedir |
| 3 | **Mono congo** (A, 290 · ×1.55) | Los **mangos** (`monocongo.js:100–112`) con **sombra roja en el suelo** 0.7 s antes de caer (`avisoCaida` en `f.p` proyectado) y el **aullido** con 0.8 s de aviso antes de empujar | `monocongo.js`, función de los mangos (`g.mangos`) y el `brain` del empujón | ≈ 13 | Daño recibido promedio **baja** (8.8); subir `dano` ×1.15 |
| 4 | **Capitán de la goleta** (no medido) | El **cañonazo** (`goleta.js:91`) marca un círculo rojo antes de caer | `goleta.js` (`cuadroGoleta`, la bala) | — | Sin medida (el bot no lo mide: fuera de su barco no pelea) |
| 5 | **Reina Bananera** (B, 220 · ×2.3) | El **veneno** (`jefes2.js:70–75`, `D.nube`: círculo **invisible** de 4.5) pinta **un anillo verde** del radio real con `anilloAviso`; sigue 1/s dentro; **las crías** de 4 a 3 vivas (`criasCd`) | `jefes2.js`, `JEFES2.reina_bananera.brain` | 17 | El anillo **no cambia el daño**, pero el promedio recibe 4.4: sin cambio en `dano`; `criasCd` −25 % de crías baja un poco el TTK de los secuaces |
| 6 | **Cascabel** (B, 285 · ×0.55) | **El escupitajo** (fase 2, `jefes3.js:172`, `tirar(…)`) **se puede parar con escudo** (parry: se aturde 1.6 s): en la `Bola` (`jefes3.js`) al impactar, `if (g.blocking && golpeLlega)` → `m.stunT = 1.6` y sin daño | `jefes3.js`, `tirar`/`Bola` y su `alPegar` | 18 | Daño recibido promedio (17: el más alto de B) **baja**; el `dano` 0.55 queda |
| 7 | **Don Cornudo** (B, 125 · ×1.4) | **Caparazón:** `armas3.js:45` `caparazon.corte` **0.6 → 0.75**; **trabado contra pared o árbol recibe ×2** (`m.data.trabado` ya se marca en `jefes2.js:133` cuando choca): en `onHurt`/`golpeLlega` multiplicar | `armas3.js` (perfil `caparazon`) y `jefes2.js` (`escarabajo_hercules.onHurt`) | **~34** (el más largo de B) | **+25 % de corte** → TTK ≈ 27 s (objetivo 15–32 ✓): **no tocar la vida**; con pared ×2 el hábil baja a ≈ 18 s |
| 8 | **Tata Sapo** (B, 585 · ×1) | La masticada **pega una vez sola** (hoy veneno aparte, `jefes3.js:100`); los charcos de la fase 2 **duran 6 s y se ven** | `jefes3.js`, `sapo_tata.brain` | 25 | El promedio recibe 5.6 y p=0.6: quitar el veneno aparte **baja el daño**: `dano` 1 → **1.2** para volver a p ≈ 0.8 |
| 9 | **Cangrejo Rey** (B, 245 · ×1.3) | La concha rota queda **abierta 5 s** (hoy `stunT = 2.5`, `D.concha = 0`): `m.stunT = 5`; los **chorros** (`jefes3.js:205`, `tirar`) marcan **carril azul** 0.6 s (`avisoEmbestida` con color) | `jefes3.js`, `cangrejo_rey.onHurt` y el chorro | 29 | Con 5 s abierta el TTK baja ≈ 20 % → **vida 245 → 270** para quedar en 29 |
| 10 | **Ciempiés Rey** (B, 520 · ×0.4) | El anillo **se puede salir barriéndose** (`trySlide`, Ctrl+Espacio: `combate.js`) o saltando: en `jefes3.js:249` (`D.tiro`) **no pegar si `g.player.sliding` o el jugador está en el aire**; el salto «de frente» con **anillo rojo de 0.8 s** | `jefes3.js`, `ciempies_rey.brain` (`D.anillo`, `D.tiro`) | 32 | Con salida el daño baja; **`dano` 0.4 → 0.6** (hoy el más bajo de B con p = 1) |
| 11 | **Murciélago Rey** (C, 130 · ×3) | **Picada con carril rojo** y chillido (`avisoEmbestida`, `caverna.js:~62`) y **se cansa**: tras cada picada, **3 s en el suelo** golpeable (`d.cansa = ck + 3`, `m.body.vel`) | `caverna.js`, `REY.flyGoal` | 24 (con 215; **remedir con 130 y fase 2 al 50 %**) | El suelo da **exposición** (el bot de la fase 0 lo midió con `arco: true`): puede **bajar el TTK de 24 a ≈ 15**: **vida 130 → 190** (el diseño original pedía 190) |
| 12 | **Jefa de Ventanilla** (C, 400 · ×1.4) | El **sellazo** (`archivo.js:177`, daño directo con la marca a 2 ticks) pasa a **dorado**: a `M.t === 1` mostrar `brilloAmago` y aceptar un **parry** (`g.blocking` y `golpeLlega`) que anula el daño y atonta 1.6 s; el **doble** (fase 2) sigue **rojo** | `archivo.js`, `tickJefa` (bloque `V.marca`) | ~21 (hábil p = 0.6 < promedio 0.78: **justo lo que arregla**) | Con parry el **hábil sube**: p hábil ≥ 0.9; `dano` 1.4 queda |
| 13 | **Señor del Arenal** (C, 815 · ×2.45) | La **onda de fuego** (`inframundo.js:70–79`, `setTimeout 500`, sin aviso) pasa a **anillo rojo de 1.2 s** (`anilloAviso(g, b.x, b.y, b.z, 5.5, dt)`) y el daño al terminar (sin `setTimeout`: **guardar el contador en `m.data.slamT`** y descontar con `dt`, así no se escapa al borrar el mob o cambiar de mundo); **bombas** (`volcanes.js:37`) con círculo de 1.0 s | `inframundo.js` (`SENOR.update`), `volcanes.js` (la bomba) | 28 | Daño recibido promedio **baja** (0.8 con el torpe); **`dano` 2.45 → 3** y el diseño pedía +vida (**815 → 900**) si el TTK pasa de 30 |
| 14 | **Arpía** (C, 345 · ×3) | **A menos de la mitad**: 3 rayos y la **ráfaga con silbido 1 s antes** (`arpia.js:~57`: hoy el aviso es el «¡Ráfaga!» al soltarla); **se posa 2 s** tras cada picada fallida | `arpia.js`, `ARPIA.update` | 35 | Se posa = más exposición; TTK baja ≈ 10 %: **vida 345 → 370** |
| 15 | **El Olvido** (C, 865 · ×3) | Ya cumple (aviso de 2 s del aliento). **Sin cambio de mecánica**; confirmar que el **golpe 8 → 7** del diseño sigue siendo necesario con el tope del 60 % | `arena.js`, `elOlvido` | 17 | Solo medir |
| 16 | **Sombra Madre** (C, 600 · ×1.5) | **Ola final** (`historia.js`, `OLAS[3]`, `soltarOla`): **invoca 2 Sombras escudo a mitad de vida** | `historia.js` | 16 (con 855) | Más enemigos = más daño recibido; **`dano` queda en 1.5** hasta remedir |
| 17 | **Rey Zopilote** | Sin cambios de aviso en la fase 2 (su pelea es la fase 3–4 del diseño) | — | 110 | — |
| — | **Revancha de los 6 del monte** | **Enfriamiento de 3 días de juego** entre ofrendas (`usarOfrenda`, `jefes2.js:212`: hoy vida ×1.5 y golpe ×1.3 sin enfriamiento) | `jefes2.js`, `usarOfrenda` (`g.meta.ofrendaDia`) | — | No cambia la curva |

**Fórmula para reajustar** (como lo dice `BALANCE.md`): `vida_nueva = vida × TTK_objetivo / TTK_medido` y `dano_nuevo = dano × recibido_objetivo / recibido_medido`; la tabla vive en `src/jefes-balance.js`.

## 3.2 Infraestructura común (hacerla primero, una vez)
1. **Un solo ayudante de avisos** en `golpes.js`: `avisoAnillo(g, x, y, z, r, dur, color)` (hoy hay `anilloAviso` en `jefes3.js:288`, `avisoCaida` y `avisoEmbestida` en `golpes.js`: dispersos; que `anilloAviso` exporte desde `golpes.js` y los jefes lo importen de ahí, **sin ciclos** con `jefes3.js`).
2. **Contador de «daño sin aviso»** (la medida de «cada jefe enseña lo prometido»): en `golpes.js`, cada `avisoCaida`/`avisoEmbestida`/`anilloAviso` pone `g.avisoVivo = { t: g.clock + dur, quien }`; en `damagePlayer`, si `jefe` (de `jefeDelGolpe`/`g.atacante`) y **no hay aviso vivo de ese jefe**, suma el daño a `g.meta.diagJefes[tipo].sinAviso` (**no se guarda**: `g.diag`, solo para el bot); si hay, a `.conAviso`.
3. **`tools/bot-pelea.js`:** que `JEFES()` devuelva por cada celda `{ sinAviso, conAviso, evitados }`; hoy mide `exposicion` y `tiempoPorFase`.
4. **`tools/revisar-avisos.mjs`** ya existe (cuenta avisos literales y categorías): agregar que cada jefe de `JEFES_BALANCE` tenga **al menos un `avisoCaida`/`avisoEmbestida`/`anilloAviso`** en su archivo (grep por tipo): una lista `AVISOS_POR_JEFE` en la herramienta.

## 3.3 Prueba por jefe («con la maña apagada»)
Para **cada** jefe del cuadro: en la pestaña 1, `/prueba <jefe>` (de `pruebas.js`) con el equipo de su tramo (`jefeHierro`/`jefeDiamante`/`jefeJade` en `bot-pelea.js`), **sin habilidades de maña** (`g.meta.manas = {}`), dificultad Normal y:
1. **Jugarlo a mano** hasta ganar o morir; anotar «¿entendí qué hacer en la primera muerte?».
2. **Bot:** `await JEFES({ solo: ['<jefe>'], veces: 10 })`: **criterios** por celda: (a) **TTK dentro de ±25 %** de la tabla de `BALANCE.md`; (b) **p hábil ≥ 0.9** y p torpe < 0.5 en B y C; (c) **daño sin aviso < 10 %** del recibido (nueva métrica de § 3.2); (d) **`recibido` promedio dentro de ±35 %** de lo medido.
3. **Cada mecánica con su aviso:** una prueba que **no permite** pegar si uno está fuera del radio (ej. Señor del Arenal: parado a 6 bloques, la onda no hace daño); y que el aviso **desaparece** al morir el jefe, al cambiar de mundo (`limpiarFxGolpes`) y al pausar (sin quedar anillos rojos fijos).
4. `node tools/revisar-avisos.mjs` y `npm run lint` en cero; `revisar-nombres`/`revisar-recetas` no cambian.
5. **Documentar** en `BALANCE.md` una tabla nueva «Fase 2 medida» (misma forma que «Fase 1 aplicada»), `ARBOL_CONOCIMIENTO.md` (los avisos por jefe) y subir `GAME_VERSION` (el cambio de `armas3.js: caparazon` afecta a **todas** las criaturas de caparazón: escarabajo, cangrejo, armadillo, alacrán: **remedir una**).

## 3.4 Riesgos
- **`armas3.js: caparazon.corte 0.6 → 0.75`** es **global** (todo bicho de caparazón recibe 25 % más del corte): si solo se quiere a Don Cornudo, ponerlo en su `onHurt` (multiplicador solo para `escarabajo_hercules`).
- **El parry de la Jefa y del escupitajo** toca `combate.js: onPlayerHit` y la ventana de `golpeLlega`: probar con **escudo de madera y de concha** (el de concha «devuelve el golpe»).
- **Compensar el `dano`** de la tabla 3.1 **uno por uno y con 10 duelos**: el ruido entre mundos es grande (BALANCE: «medir 10 por celda en 2 o 3 mundos»).
- **Sin `SAVE_FORMAT` ni ids:** la fase 2 no toca el guardado; sí sube `GAME_VERSION`.
- **Orden dentro de la fase:** primero **la infraestructura (3.2)**, luego **tramo A** (1–3), **B** (5–10), **C** (11–16), y **la medición por tramo** antes de pasar al siguiente (el diseño: «cada TTK dentro de la banda»).

*Escrito por la sesión investigadora. Solo lectura: no se corrió el juego ni los bots. Los números de pesca y de artesano salen de scripts propios con `SHOPS` real (reproducibles pegando el código de la § 2 en la consola del navegador); los de jefes, de `BALANCE.md` y de leer el código.*
