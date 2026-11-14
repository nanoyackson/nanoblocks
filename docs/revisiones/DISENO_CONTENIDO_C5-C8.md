# Diseño de contenido C5–C8

Pedido: encargo 27 de la orquestadora. Mismo formato que `DISENO_CONTENIDO_C1-C4.md`. Estado base: `v12.4.5`. **Solo diseño**: no se editó código ni se corrió el juego. Lo que sale del código lleva archivo y función (las líneas se mueven). nanoyackson dio permiso creativo («entre más contenido, mejor»); todo es original y tico, sin copiar ningún juego.

**Cómo se hizo:** leí el código de lo que ya existe en cada tema (mar, oficios, volcán, fiestas, pueblos y encargos), `precios.js`, `MAPA_ECONOMIA.md`, `DISENO_JEFES_Y_FINAL.md`, `FASE0_CURVA_JEFES.md` y `PEDIDOS_ARTE*.md` para no repetir nada y para que los números calcen. Lo que es **estimación mía** va marcado «≈». Lo que hay que **medir primero** va marcado 📏 y lo que **depende de que nanoyackson lo juegue** 👁.

---

## 0. Lo más importante (léalo primero)

### 0.1 Dos hallazgos que condicionan todo

1. **Los ids de ítems casi se acabaron.** `isBlockId` (`blocks.js:5`) reserva `id < 256` y `600 ≤ id < 1024` para bloques; los ítems viven en `256–599`. Hoy quedan **23 ids libres de ítem** (`550`, `578–599`) y **`586–599` están reservados para los ítems únicos del final**. C5–C8 piden **≈ 75 ítems nuevos**. **Propuesta: abrir un rango de ítems `1100–1299` (`EXT_ITEM = 1100`)**, por encima de `MAX_BLOCK = 1024`: como `isBlockId` es falso ahí, `getDef(id)` los toma como ítems. Es un cambio de **una línea y un chequeo** (sección 0.4), y **tiene que ir primero** (C5 lo usa desde el principio). Los bloques sí caben: hay **359 ids libres** (`665–1023`).
2. **Falta una versión mínima en el guardado.** Un mundo guardado con bloques `665+` o ítems `1100+` **rompe** un juego viejo (`BLOCKS[id]` da `undefined`). La reseña de la v12.4 ya lo dejó como pendiente: **conviene `meta.minVersion` antes de que salga C5**, que es la primera tanda con ids nuevos de ítem.

### 0.2 Lo que ya existe, resumido (para no duplicar)

| Tema | Ya está | Dónde |
|---|---|---|
| **Mar y pesca** | Una caña (`357`, `rod`), una tabla de 4 peces (`fishLoot`: guapote, corvina, pargo, dorado) más botín raro; peces en cardumen, delfín, ballena, tiburón martillo, **bote de remos** (`358`, ancla 120 u), **lancha con motor y gasolina** (`457`, ancla 3 000 u), mantarrayas, pulpos, tiburón ballena, **arrecifes vivos** con 4 corales (`108–111`); **pez vela** con pelea de tensión; **red de pesca** flotante; **nasa** de río (`612`, 1 pieza cada ~300 s); **torneo de pesca**; **la panga** de Don Macario; pescador de atarraya; **la arribada** de tortugas lora cada 14 noches (nidos sin uso: «no se tocan»); careta de buceo, perlas, naufragios y mapas del tesoro; surf; resaca, aguamalas y rayas | `mar.js`, `mar2.js`, `pezvela.js`, `redes.js`, `monte.js`, `torneo.js`, `panga.js`, `playa.js`, `playa2.js`, `arribada.js`, `tesoros.js`, `surf.js`, `costa.js` |
| **Oficios** | **Cogida de café por cajuela**, **batea de oro**, el **alfarero ambulante** (vende chanchitos, no enseña), **yunque** (mejora ★ hasta 3), compostera, cocina (fogón, despensa, infusiones de C1), peón de la finca, 7 habilidades de uso (minería, tala, pesca, cocina, combate, agricultura, exploración) y maestría por arma | `oficios.js`, `alfarero.js`, `yunque.js`, `despensa.js`, `peon.js`, `habilidades.js`, `maestria.js` |
| **Volcán** | El Arenal retumba y tira bombas, el Poás echa vapor; **lahar**; neblina de gases; terremoto; mena y costra de **azufre** (`143`, `156`), **obsidiana** (bloque `K.obsidian`, la vende el buhonero), mascarilla de gases, efecto `ignifugo`, aguas termales como efecto `termal`; el **inframundo** (portal) y la cueva del Murciélago Rey | `volcanes.js`, `lahar.js`, `neblina.js`, `terremoto.js`, `caverna.js`, `inframundo.js` |
| **Fiestas** | Calendario de **12 días** (faroles día 4, **mascarada día 7**, carnaval o **tope de caballos** de día, fin de año 11–12), el Festival de la Luz, Zapote con chinamos, toros a la tica, bingo, **concurso de gallo pinto**, punto guanacasteco, serenata, procesión de las ánimas, cumpleaños de Doña Eulalia, palo encebado, carreras de cintas, partido, rifa dominical, bombetas. **La «cimarrona» solo se nombra en textos** (`pueblo.js:652`, `pueblo6.js:614`); **no hay banda** | `fiestas2.js`, `festival.js`, `festejos.js`, `toros.js`, `bingo.js`, `concurso.js`, `bailes.js`, `serenata.js`, `procesion.js`, `palo.js`, `cintas.js`, `partido.js`, `rifa.js`, `fiesta.js` |
| **Pueblos y encargos** | Pueblos generados (`pueblogen.js`), vecinos con horario, tiendas y fiado; **diez encargos de recado iguales en todos los pueblos** (`ERRANDS`, `pueblo.js:204`: 8 mazorcas, 10 frijoles, 12 granos de café…, de 5 a 12 u); **reputación por pueblo** (`saberes.js: repDe`, `factorRep`); historias de los vecinos (`misiones.js`); **encargos de la gente de la casa** (`encargos.js`, 4 personas, ruinas); retos semanales, «Se busca», turistas, ermitas (viaje rápido), bus y tren | `pueblo.js`, `saberes.js`, `misiones.js`, `encargos.js`, `retos.js`, `recompensas.js`, `ermitas.js`, `bus.js`, `tren.js` |

### 0.3 Los huecos de la progresión (la razón de estas cuatro tandas)

| # | Hueco | Evidencia |
|---|---|---|
| H1 | **La pesca no tiene progresión.** Un solo tipo de caña, 4 especies, sin carnada, sin profundidad, sin libro de peces, sin mariscos; la nasa solo da peces de río | `mar.js: fishLoot` (4 peces + botín), `monte.js` (`nasa`: 3 peces + bota), un solo `rod` |
| H2 | **El mar y las tortugas se miran, no se juegan.** La arribada es un espectáculo («no se tocan»); el arrecife no se puede cuidar ni dañar | `arribada.js` (sin eclosión ni amenazas), `mar2.js` (arrecife estático) |
| H3 | **Los oficios no tienen taller ni nivel.** Se mejora con el yunque y se cocina, pero **no hay banco de carpintero, fragua ni torno**; el alfarero es un vendedor que pasa. No hay «hacer cosas para vender» | `oficios.js`, `alfarero.js`, `stations.js` (solo mesa, horno, cofre, fogón) |
| H4 | **El volcán es decorado, no un lugar de juego.** Hay bombas, vapor y lahar, pero **no hay cuevas volcánicas, ni termales, ni qué buscar adentro**; la obsidiana solo se compra | `volcanes.js`, `lahar.js`, `lugares3.js` |
| H5 | **Las fiestas se ven y casi no se participan.** Salvo el gallo pinto, el bingo y el palo, es un fondo; no hay «mi pueblo tiene su fiesta», ni banda, ni cargo | `fiestas2.js` (calendario global, no por pueblo) |
| H6 | **Los vecinos piden siempre lo mismo.** Diez recados, mismos en todos los pueblos, sin relación con el oficio de quien pide ni con lo que el jugador sabe hacer | `ERRANDS` en `pueblo.js:204` |
| H7 | **Después del Rey solo hay repetición.** Retos semanales, «Se busca», sobres de álbum: todos reinician; **nada que se construya en la red de pueblos** (caminos, mercado) | `retos.js`, `recompensas.js`, `album.js` |
| H8 | **Biomas con poco que hacer** (con la cuenta de líneas que nombran cada bioma en `src/` como aproximación): selva 90, bosque seco 71, nuboso 56, playa 48, **manglar 36, páramo 22, nieve 21, desierto 20** | manglar, páramo, nieve y desierto casi no tienen oficio ni lugar propio |

### 0.4 Reserva de ids y reglas comunes

- **Ítems nuevos `1100–1299`** (`EXT_ITEM`): C5 `1100–1126`, C6 `1130–1153`, C7 `1160–1170`, C8 `1180–1189`; sobran 100. Lo único que hay que revisar antes de usarlos: que ningún código compare `id < 600` para decidir «es ítem» (en `src/` no encontré ninguno; sí hay tablas de tamaño `MAX_BLOCK` solo para bloques) y que `esUnico`, `categorias.js` y `VALOR` (`inventory.js`) acepten ids altos. 📏 **Prueba mínima:** `/dar` un ítem 1100, guardarlo, cargar y ponerlo en el cofre y la billetera.
- **Bloques nuevos `665–722`** (C5 `665–671` y `697`, C6 `672–684`, C7 `685–691`, C8 `692–696`).
- **Regla de plata común (igual que C1–C4):** ningún ítem **entra a `buy` de una tienda** salvo que su precio sea **≤ 1.2 × el de sus ingredientes en tienda** (regla de oro de `pueblo.js`). **Lo hecho a mano se vende al «mostrador» o a un encargo, no a cualquier tienda.**
- **Cupo del comprador (mecánica nueva, común):** cada comprador paga el precio completo por las primeras **30 unidades de compra al día** y el **40 %** de ahí en adelante. Es el freno de la economía: 30 u ≈ **1.2 jornadas** (una jornada = 25 u = ₡12 500, `precios.js`). Cuesta una tabla `meta.cupoDia` por comprador.
- **Sin `SAVE_FORMAT`:** todo lo nuevo son campos opcionales leídos con `??` (`meta.oficios`, `meta.pesca`, `meta.encargos2`, `meta.comite`, `meta.fiestas`), como C1–C4. Un mundo viejo carga igual.
- **Textos en «usted»**, tico, neutro y corto (lo que pide `AUDITORIA_PANTALLAS.md`); **«Movimiento tranquilo»** quita el balanceo de cámara en todo lo nuevo.
- **Arte:** todos los ítems y los bloques visibles en el inventario llevan pedido para GPT (al final), **íconos 512×512, fondo transparente, estilo plano tipo Kenney**, el mismo prompt base que `PEDIDOS_ARTE.md`. Los bloques se dibujan solos con `pixelart.js`; el pedido es el ícono de inventario.

### 0.5 Orden recomendado (valor para el jugador entre costo de construcción)

**Valor** (1–5): cuánto llena un hueco de la sección 0.3 y cuánto tiempo de juego da. **Costo** en «versiones» (1 = una versión como la 12.1.0). 📏 Es mi estimación: lo ajusta quien construye.

| Orden | Subtanda | Tapa el hueco | Valor | Costo | Valor/costo | Depende de |
|---|---|---|---|---|---|---|
| **0** | **EXT_ITEM + `minVersion`** (sección 0.1) | — | habilitante | 0.3 | — | nada |
| **1** | **C8-A Encargos 2.0 y el tablón** | H6, H7 | 5 | 1.0 | **5.0** | 0 |
| **2** | **C5-B Tortugas y arrecife** | H2, H8 | 4 | 1.0 | **4.0** | 0 |
| **3** | **C5-A Pesca a fondo** | H1, H8 | 5 | 1.5 | **3.3** | 0 |
| **4** | **C8-C El Comité de Caminos** (red de pueblos) | H7 | 4 | 1.5 | **2.7** | C8-A y C6 |
| **5** | **C6 Manos de maestro** (oficios) | H3 | 5 | 2.5 | **2.0** | 0 |
| **6** | **C7 Fuego de la tierra** (volcán y cuevas) | H4, H8 | 4 | 2.0 | **2.0** | 0 (mejor después de C6: usa clavos y tablas finas) |
| **7** | **C8-B Fiesta patronal** (tope, cimarrona, mascarada) | H5 | 3 | 1.5 | **2.0** | C8-A (el mayordomo) y sonido nuevo |

**Por qué ese orden:** los encargos de C8-A son **la tanda más barata y la que más alarga el juego** (reutilizan los ítems de todo lo demás: mientras más oficios hay, mejores encargos); C5-B y C5-A tapan el hueco más visible (el mar); **C8-C va después de C6** porque su gracia es pedirle al jugador cosas que solo los oficios saben hacer. C6 es grande pero se puede partir (carpintería y alfarería primero, herrería después). **C7 y C8-B** valen igual por costo, pero C7 necesita generación del mundo (la parte más cara y arriesgada) y C8-B necesita sonido nuevo.

**Meta de la pareja C5–C6:** dar al jugador del día **15 al 60** un ciclo propio de **horas de juego sin pelear** (pescar, fabricar, vender, cumplir encargos), con un ingreso máximo de **≈ 1.4 jornadas por día** a máxima destreza y equipo (frente a 1 jornada de los oficios de hoy), como lo pide `MAPA_ECONOMIA.md` §5.3.

---

## C5 «Mar adentro»

### C5.1 Lo que ya existe (y no se duplica)

Ver la sección 0.2. Lo que **no se toca**: el bote de remos (ancla 120 u), la lancha (3 000 u) y su gasolina (ítem 390), el pez vela, el torneo, la panga, la red, la careta y las perlas, el surf. **La nasa ya existe** (`monte.js`, bloque `612`): **no se crea otra**; se **extiende** (ver C5-A.4).

### C5-A Pesca a fondo (valor 5, costo 1.5)

**A.1 Cañas por nivel** (la caña de hoy es la de nivel 1):

| Caña | Se consigue | Precio | Qué cambia | Pica antes (con `pesca` nivel 0) |
|---|---|---|---|---|
| **Caña de pescar** (`357`, ya está) | pulpería | 8 u | orilla y río | base |
| **Caña de fibra** (`cana_fibra`) | ferretería o 3 caña brava + 4 cabuya + 2 hierro | **30 u** (≈ 1.2 jornadas) | río y mar; −25 % de espera; permite **carnada** | −25 % |
| **Caña de altamar** (`cana_altamar`) | ferretería del pueblo grande o craft con 6 hierro + 1 cuero | **90 u** (≈ 3.6 jornadas, «herramienta buena = 3–5», como el pico de hierro) | **peces grandes** (atún, pez vela) con la pelea de tensión de `pezvela.js` | −40 % |

**A.2 Carnada** (nueva mecánica, un ítem se gasta al picar):

| Carnada | De dónde | Sirve para |
|---|---|---|
| **Lombriz** | pala en tierra húmeda cerca del agua (25 % de soltar una) | peces de río (machaca, tilapia, trucha, guapote) |
| **Sardina** | la red de pesca, o de comprar (4 por 1 u) | peces de mar (pargo, corvina, pez gallo, atún) |
| **Señuelo** | 2 u de materiales; **no se gasta** (dura 60 usos) | róbalo, sábalo, dorado |
| **Camarón** (ya sale de la nasa) | nasa de estero | pargo mancha y langosta (en nasa) |

Sin carnada: **×0.6** de picadas. Con la carnada correcta: **×1.4** para las especies que la quieren. Es lo que hace que «pescar bien» se aprenda.

**A.3 Nuevas especies y dónde salen** (`fishLoot` se vuelve una tabla por zona; hoy 4 peces):

| Zona (cómo la reconoce el código) | Especies | Hora o temporada | Carnada ideal | Caña mínima |
|---|---|---|---|---|
| **Río** (agua dulce corriente) | guapote (ya), machaca, tilapia | todo el día | lombriz | básica |
| **Río frío** (altura ≥ 90 o páramo/nuboso; truchero de Juan Castro) | **trucha** | de noche y en invierno ×1.5 | lombriz | fibra |
| **Estero y manglar** (agua salobre, bioma manglar) | **róbalo**, **sábalo**, camarón (nasa), piangua | róbalo de noche; sábalo al amanecer | señuelo / camarón | fibra |
| **Orilla de mar** (≤ 40 bloques de la costa) | corvina (ya), pargo (ya), pez gallo | pez gallo en verano | sardina | básica |
| **Arrecife** (cerca de coral vivo) | **pargo mancha**, langosta y ostión (nasa o buceo) | todo el día | camarón | fibra |
| **Altamar** (≥ 140 bloques de la costa, **hace falta bote**) | dorado (ya), **atún**, pez vela (ya) | atún al mediodía; dorado en verano | sardina o señuelo | altamar |

- **Altamar y la lancha:** con el bote de remos se llega (140 bloques ≈ 50 s remando); **con lancha se llega en 15 s y se pesca más lejos (≥ 300) donde el atún es más grande** (+30 % de precio). Así la lancha de 3 000 u deja de ser solo un lujo: es el oficio del pescador.
- **Libro del pescador** (nueva pestaña de la libreta, sin ítem): cada especie con su récord de tamaño (cm, se tira con un dado ponderado por nivel), la zona y la carnada, «Pescó N de 17» y logros por completarlo.
- **El tamaño importa:** cada pieza sale con un tamaño entre 0.7 y 1.3 del normal (`pesca` sube el piso); precio = base × tamaño (**el récord paga ×1.5 una vez**).

**A.4 La nasa y la boya** (extender lo que hay, no crear una):

- La **nasa** de `monte.js` pasa a leer **dónde está puesta**: en agua dulce, igual que hoy; **en estero**, camarón y róbalo; **sobre el arrecife**, langosta, pargo mancha y ostión (`MEDIA` 300 s → **360 s en arrecife**, para que sea paga y no un grifo). Máximo **6 nasas activas por jugador** (hoy sin tope).
- La **boya** (bloque nuevo `665+`) marca una nasa en el agua para encontrarla sin careta: se ve a lo lejos y sale en la brújula si se tiene el «Libro del pescador».

**A.5 Mariscos en el manglar:** **piangua** a mano en las raíces (sin herramienta, 6 por mata, **se repone en 3 días**) y **ostión** con la careta en el fondo. **La veda** (mecánica tica): **cada temporada (30 días) hay 4 días de veda de la piangua** que el pescador anuncia; si se recoge en veda el vecino lo reprende y se pierde **1 de reputación en ese pueblo** (≠ multa): es el tipo de decisión que da carácter.

**A.6 Cocina nueva** (recetas `cook` en el fogón, ver C5.3): sopa de mariscos, arroz con camarones, langosta gratinada (lujo, solo en la soda de lujo o a mano con nivel `cocina` 5), **pescado seco** (el **secadero** seca y sala en 3 días; dura 30; no se vende; **se come o se usa en encargos**).

**A.7 Cupo y precios** (todo en unidades, 1 u = ₡500; compradores: el pescador del muelle, la panga, la soda y el restaurante de lujo):

| Especie | Precio de venta (u) | Compra de la soda para cocinar (u) | Notas |
|---|---|---|---|
| machaca / tilapia | 1 | — | de río, abundantes |
| guapote, corvina, pargo (ya están) | **no se tocan** (1) | — | |
| trucha | 2 | — | solo en agua fría |
| róbalo / sábalo | 3 | — | de estero |
| pargo mancha | 3 | — | arrecife |
| pez gallo | 4 | — | |
| dorado (ya) | 4 | — | |
| **atún** | **6** (×1.3 con lancha) | — | pelea de tensión |
| pez vela (ya) | foto, se devuelve | — | |
| camarón | 1 | — | de nasa |
| piangua | 0.5 | — | de a seis |
| ostión | 2 | — | a veces perla (18 u, ya existe) |
| **langosta** | **9** | — | solo nasa en arrecife |
| pescado seco | no se vende | — | |
| sopa de mariscos / arroz con camarones | **12 / 11** | cuesta ≈ 8 en materiales | sube `variedad.js` |
| langosta gratinada | **36** (solo lujo) | — | |

**Cupo del pescador: 30 u al día** al precio completo, **40 %** lo demás. Una pasada típica (📏 `bot-economia`):

| Perfil | Equipo | Pescas por día de juego (20 min, 8 de pesca) | Ingreso con cupo |
|---|---|---|---|
| Aficionado | caña de pescar, orilla, sin carnada | ≈ 6 piezas × 1.2 | **≈ 7 u** (0.3 jornada) |
| De río | caña de fibra + lombriz | ≈ 10 × 1.8 | **≈ 18 u** (0.7) |
| De altamar en bote de remos | caña de altamar + sardina | ≈ 12 × 3.6 | **30 + 5 = 35 u** (1.4) |
| Con lancha y nasas (6) | + 6 nasas | + 8 u de nasas | **≈ 40 u** (1.6; techo) |

Inversión: bote de remos 120 + caña de altamar 90 = **210 u (≈ 8.4 jornadas)**; se paga solo en **6 días de pesca buena**. Es «herramienta buena = 3–5 días» más el bote, coherente con `MAPA_ECONOMIA.md` §5.3. **Techo: 1.6 jornadas/día**, comparable al jefe del monte por hora de juego.

**A.8 Muelle** (bloques `muelle` y `pilote`): se construyen sobre el agua; **el bote y la lancha se atracan** (tienen su «amarre»: al bajar de la lancha en el muelle no se pierde, y la gasolina se recarga con el pistero si hay uno cerca). Sirve de «puerto» de la casa de la abuela.

### C5-B Tortugas y arrecife (valor 4, costo 1.0)

**B.1 Proteger la arribada** (extiende `arribada.js`; hoy las tortugas «no se tocan» y no pasa nada después):

1. La noche de la arribada quedan **nidos** en la arena (ya hay bloque de nido). Con la **estaca de nido** (2 palos + 1 cabuya + 1 cinta amarilla) el jugador **marca** un nido y se vuelve **nido protegido** (bloque `nido_marcado`, con malla). Cada jugador puede marcar **hasta 12** por arribada.
2. **Las amenazas** (solo de noche, en las 4 noches siguientes): **saqueadores** (usa el modelo de los cazadores furtivos, `furtivos.js`) que cavan nidos **sin marcar**; **pizotes y perros** (el zaguate propio cuida nidos cercanos si tiene lealtad ≥ 2); **cangrejos fantasma**.
3. **A las 5 noches eclosionan**: de cada nido protegido salen **8–12 tortuguitas** (mob nuevo, 2 de vida, no atacan, van solas al mar a 20–40 bloques). En el camino las acechan **fragatas, pelícanos y cangrejos**; el jugador las **defiende** (golpear a la fragata) y **debe apagar las antorchas de la playa** (la luz las desorienta: dato real de conservación; si hay luz, 30 % van para tierra).
4. **Pago de la «Asociación de Voluntarios de la Playa»** (la voluntaria Doña Lía, una nueva `vecino` en la playa de la arribada): **0.3 u por tortuguita que llega al agua** (3 u por nido completo), **tope 30 u por arribada**; a las **100 liberadas** (suma de todas las arribadas) entrega la **banderita azul** (honor para la casa: los turistas de la playa pagan +25 %) y el logro **«Voluntario de la tortuga»**.
5. **Sin huevos en el inventario, nunca** (es ilegal y el juego lo dice): **los saqueadores se «capturan»** (golpearlos los deja atontados; el Guardacostas del pueblo los arresta) y la **multa** paga **5 u** al que los entregó. Pesa **menos que un encargo**: es una cuestión de principio, no de plata.

**B.2 Restaurar el arrecife:**

- **Coral blanco** (bloque nuevo `697`): el arrecife **blanqueado**, con la careta se ve apagado entre los corales. Aparece en **parches de 20–60 bloques** (el 35 % de los arrecifes de un mundo nuevo; **más cuanto más caliente la temporada de verano**).
- **Vivero de coral** (bloque que se hunde, `669`): se arma con tubos (caña brava), cabuya y **fragmentos de coral** (que se sacan a mano con la careta de los corales vivos **sin matarlos**: 1 fragmento por coral cada 3 días). En 3 días el vivero da **2 fragmentos**.
- **Plantar** un fragmento sobre un coral blanco lo **revive** (cualquiera de los 4 colores) y **su radio de 6 bloques atrae cardúmenes** (usa el spawn de `mar2.js`: más peces cerca de coral vivo, hoy ya lo hace). Hitos: **20 / 60 / 150 corales** → logros; a los **60**, los **buzos** (turistas, `turistas.js`) pagan **10 u al día** en la playa (cupo del guía); a los **150**, sale una **mantarraya** más en la zona.
- **Pecera** (decorativa, `671`): se llena con un pez vivo y da **+1 de comodidad** (suma con lo de `fuerza.js`).

**B.3 Números:** el ingreso por conservación es **bajo a propósito** (≤ 12 u por arribada + ≤ 10 u/día de buzos): **lo que paga es el logro, la banderita y el sentido**. Es la parte del juego donde lo tico no es «matar nada».

### C5.2 Mobs nuevos

| Mob | Dónde | Detalle |
|---|---|---|
| **Tortuguita** | playa de la arribada | 2 de vida, manso, camina al mar, **no se puede recoger**, la luz fuerte la desvía |
| **Saqueador de nidos** | playa, de noche, 4 noches después de la arribada | humano, **no pega** (huye al verse atrapado), cava nidos sin marcar; sale 2 por playa |
| **Langosta** (decorado) | arrecife | se ve al fondo; **solo la nasa las saca** (no se pesca a mano, evita farmeo) |
| **Cardumen de atún** | altamar | visible a lo lejos (mejora la picada ×1.3 si se pesca debajo del cardumen) |
| **Garza** | manglar y estero | ambiente (vuela y se posa), da vida al manglar |

### C5.3 Recetas y choques

| Receta | Sale | Estación |
|---|---|---|
| 3 caña brava + 4 cabuya + 2 hierro | **Caña de fibra** | mesa |
| 6 hierro + 1 cuero + 1 cabuya | **Caña de altamar** | mesa |
| 2 palo + 1 cabuya | 1 **estaca de nido** | mesa |
| 2 caña brava | 3 **cabuya** (fibra retorcida; base de todo lo que se amarra) | mesa |
| 4 caña brava + 3 cabuya + 1 cuero | **Vela de lona** | mesa |
| 6 tablas + 1 vela de lona + 2 hierro | **Bote de vela** (450 u en el astillero, **sin gasolina; el viento (la estación) lo mueve: más rápido en verano**) | mesa |
| 2 camarón + 2 piangua + 1 pescado + 1 balde de agua | **Sopa de mariscos** | fogón (gasta leña) |
| 1 arroz + 3 camarón + 1 limón | **Arroz con camarones** | fogón |
| 1 langosta + 1 queso Turrialba + 1 limón | **Langosta gratinada** | fogón |
| 1 pescado + 1 sal (en el secadero) | **Pescado seco** | secadero (3 días) |
| 2 palo + 4 cabuya + 3 caña brava | **Vivero de coral** | mesa |
| 1 pescado/camarón + 1 palo + 1 cabuya | 3 **señuelos** | mesa |

**Choques:** `revisar-recetas` debe quedar en 0 (la sopa no pisa la receta de «caldo» ni la «Agua de sapo»; la langosta ya no usa 1 pescado crudo); `revisar-nombres` con los 27 ítems y 8 bloques nuevos; **`variedad.js`** reconoce los 3 platos nuevos como platos distintos. `despensa.js`: los mariscos crudos **se pudren en 2 días**, el pescado seco **no**.

### C5.4 Textos y consejos (en «usted»)

- «🎣 Para pescar mejor, lleve carnada: la lombriz para el río, la sardina para el mar.»
- «🐢 Las tortuguitas se guían por la luz: apague las antorchas de la playa.»
- «🪸 Las manchas blancas del arrecife se pueden cuidar: plante un fragmento de coral.»
- «🐚 Hoy es día de veda de la piangua: déjela quieta.»
- «🚤 Mar adentro pican los grandes. El atún se pelea con paciencia: cuerda cuando afloja, quieto cuando corre.»

### C5.5 Riesgos

| Riesgo | Mitigación |
|---|---|
| **La pesca se vuelve la mejor plata** (techo 1.6 jornadas) | **Cupo del comprador** (sección 0.4); 📏 pasar por `bot-economia` con un perfil «pescador» antes de publicar |
| **Rendimiento:** los nidos y las tortuguitas | Máximo **12 nidos y 80 tortuguitas** vivas a la vez (**un chunk, una playa**); las tortuguitas son entidades simples sin cerebro (siguen un punto) |
| **Se rompe `fishLoot`** (lo usa el torneo y la panga) | `fishLoot(salt, zona, carnada, caña)` con valores por defecto: **si no se pasan, da lo de hoy** |
| **Nasa con 6 por jugador** (cambia el comportamiento viejo) | En mundos viejos las nasas ya puestas siguen funcionando; el tope se aplica al **poner nuevas** |
| **Contenido «sensible»** (huevos de tortuga) | **Nunca** hay ítem de huevo; la multa va al saqueador, no al jugador |

### C5.6 👁 Que nanoyackson pruebe

1. ¿Pescar con carnada **se siente** mejor o es un trámite? 2. El **atún** con la caña de altamar: ¿la pelea de tensión (igual que el pez vela) es divertida o repite? 3. Una **arribada completa**: marcar nidos, apagar antorchas, ver salir las tortuguitas; ¿se entiende lo de las luces sin leer? 4. ¿**La veda** molesta o da gracia? 5. ¿Cuánta plata hizo en un día de pesca? (≈ 18–35 u si todo va bien.)

---

## C6 «Manos de maestro»

### C6.1 Lo que ya existe (y no se duplica)

Cogida de café, batea de oro, el alfarero ambulante (`alfarero.js`: vende chanchitos, **no enseña ni se le puede pedir**), yunque (`yunque.js`, mejora ★ de lo que ya existe), compostera, peón de la finca, las 7 habilidades de uso (`habilidades.js`) y la **maestría por arma** (`maestria.js`). **No hay estaciones de trabajo** más allá de la mesa, el horno, el fogón y el cofre (`stations.js`), ni ofcios con nivel, ni «hacer para vender».

### C6.2 Diseño

**Principio:** el jugador **elige** un oficio (o los tres) y sube con **su taller**; cada oficio es un **ciclo** (materia prima → pieza → venta o encargo) con su estación, su nivel y su arte. **No suben el combate** (ver C6.6): son **vida, casa y plata**.

**2.1 Tres oficios y su taller:**

| Oficio | Estación (bloque) | Herramientas (ítem) | Materia prima |
|---|---|---|---|
| **Carpintería** | **Banco de carpintero** (`672`) | serrucho, cepillo, formón | troncos y tablas (ya hay), **tabla fina** (cepillada) |
| **Herrería** | **Fragua** (`673`, **gasta leña**: 1 por tanda, como el fogón) | martillo de forja, tenazas | hierro (258) y carbón |
| **Alfarería** | **Torno** (`674`) y **horno de barro** (`675`, gasta leña) | (a mano) | barro (ya hay), **barro amasado**, **engobes** |

**Los engobes salen de cosas que ya existen** (nada de ítems nuevos de mina): **rojo** = 1 hierro → 4; **negro** = 1 carbón → 4; **crema** = 1 calcita (la vende el buhonero) → 4. Con ellos se pinta la **cerámica chorotega** (negro, rojo y crema sobre fondo claro, de Guaitil), que es el sello tico del oficio.

**2.2 Nivel de oficio (0–10, con uso, como `habilidades.js`):** cada pieza fabricada da **XP = 2 + valor/2**; los umbrales son **10, 25, 45, 70, 100, 140, 190, 250, 320, 400** (total 1 550: un día de taller de ≈ 25 u da ≈ 25–35 XP → nivel 5 en **≈ 4 días**, nivel 10 en **≈ 50 días**). Cada nivel desbloquea recetas (tabla abajo) y **+5 % de probabilidad de pieza «fina»** (máximo 50 %).

| Calidad | Cómo sale | Efecto |
|---|---|---|
| **Normal** | siempre | el valor de la tabla |
| **Fina** | 5 % × nivel | **precio ×1.25** y, en muebles y cerámica, **+1 de comodidad** (`fuerza.js: comodidadAqui`) |
| **Obra maestra** | nivel ≥ 8 y **sello de maestro** en la mano, 10 % | **precio ×1.5**, lleva su nombre, **cuenta como «obra maestra» para los encargos grandes** de C8 |

**2.3 Aprender el oficio:** en cada pueblo grande hay un **maestro** (`vecino` con rol nuevo: carpintero, herrero, alfarera). **Aprender** = hacerle **un encargo de aprendiz** (3 piezas de nivel 0) y **comprar su libro** (`libro_carpinteria`, `libro_herreria`, `libro_alfareria`, **40 u ≈ 1.6 jornadas**) que abre los **niveles 1–3**; los niveles 4–10 se ganan **con uso**. La alfarera es **la misma mujer del alfarero ambulante**: ahora tiene taller (no se quita, se le da un lugar fijo).

**2.4 Recetas por oficio** (valores de materiales de referencia: tronco 2 u, tabla 0.5, tabla fina 1, hierro 3, carbón 0.5, leña 0.3, barro 0.6, engobe 1, cuero 1.5; **precio de venta = ⌈1.2 × materiales + nivel⌉**, para respetar la regla de oro; 📏 `revisar-plata.mjs`):

| Nivel | Pieza | Materiales | Precio (u) | Para qué sirve |
|---|---|---|---|---|
| **Carpintería** | | | | |
| 0 | tabla fina | 1 tabla (cepillo) | 1 | base de todo |
| 0 | mango | 1 tabla fina | 1 | herramientas |
| 1 | **mesa grande** | 6 tablas finas + 2 troncos (=10) | **13** | mesa de la familia (+2 comodidad, `mesa_comedor` la reemplaza para la «mesa servida») |
| 2 | **alacena** | 8 tablas finas + 2 bisagras (=11) | **15** | **guarda comida con la podredumbre a la mitad** (`despensa.js`) |
| 2 | **mostrador** | 6 tablas finas + 2 clavos (=7) | **10** | **vende solo** (sección 2.5) |
| 3 | **armario** | 10 tablas finas + 4 clavos + 2 bisagras (=14) | **18** | 18 casillas para ropa, armadura y herramientas |
| 3 | **cayuco** | 1 tronco + 4 tablas finas + formón (=6) | no se vende | canoa **al 70 % de la velocidad del bote, sin cofre**; **cuesta 6 u frente a 120 u** del bote: la opción del que empieza |
| 4 | **puerta tallada** | 4 tablas finas + formón + 2 bisagras (=7) | **10** | puerta que da **+2 de comodidad** |
| 5 | **yugo** | 2 tablas finas + 2 cuero + engobe rojo (=7) | **12** | **abre la carreta con bueyes de C4** (el «yugo con bueyes» que quedó pendiente) |
| **Herrería** | | | | |
| 0 | **clavos ×8** | 1 hierro | 3 | base de todo |
| 0 | **bisagras ×2** | 1 hierro | 3 | puertas y alacenas |
| 1 | **martillo, tenazas** | 2 hierro + 1 mango | 8 c/u | herramientas del oficio |
| 2 | **herradura ×4** | 2 hierro | 7 | **el caballo corre un 10 % más** |
| 3 | **candado** | 2 hierro + llave | 9 | **protege un cofre de la ladrona** (`ladrona` de `pruebas.js`) |
| 3 | **verja forjada ×2** | 4 hierro | 15 | reja de hierro (el `K.verja` de hoy) |
| 4 | **farol forjado** | 2 hierro + 1 vidrio + 1 antorcha | 8 | luz de plaza; **lo pide el Comité de Caminos (C8-C)** |
| **Alfarería** | | | | |
| 0 | **barro amasado ×2** | 2 barro + 1 balde de agua | 2 | base |
| 1 | **olla de barro** | 2 barro amasado | 3 | **la comida en olla de barro sale +10 % más llena** |
| 1 | **comal** | 2 barro amasado | 3 | **tortillas y arepas +1 de comida** |
| 2 | **tinaja** | 6 barro amasado (cuece en el horno) | 6 | **guarda agua limpia** (8 de la cantimplora: no se pudre) |
| 3 | **tejas ×8** | 4 barro | 5 | techos (`K.teja` hoy se compra) |
| 4 | **vajilla chorotega** | 2 barro amasado + 3 engobes | **8** | **+1 de comodidad** (máx. 3 juegos) |
| 5 | **jarrón chorotega** | 4 barro amasado + 3 engobes | **9** | decoración y **+2 de comodidad** |
| 6 | **chanchito** | 6 barro amasado + engobe rojo + crema | (≈ 9 u de materiales) | **antes solo se compraba al alfarero ambulante** |

**2.5 El mostrador (tienda propia):** se pone **en un pueblo o en la casa** (6 casillas); los **vecinos y los turistas** compran **1 pieza cada ~90 s de 8 a 17 h** entre lo que esté al **precio del cartelito que el jugador ponga** (entre el 80 % y el 130 % del base; **por encima de 110 % casi no se vende**). **Tope del mostrador:** **10 + 4 × nivel más alto de sus oficios** (nivel 5 → **30 u/día**; nivel 10 → **50 u/día**, ≈ 2 jornadas). En fiesta patronal de ese pueblo, **×1.5** (C8-B). **No se pone fuera de un pueblo con reputación ≥ 3.**

**2.6 Pedidos de taller:** los **encargos de oficio** de C8-A (un vecino pide «una alacena fina», «4 herraduras», «una olla para el domingo») pagan **1.25 × el precio** y **dan 2× XP**; es **la fuente principal de plata del artesano** al principio, antes del mostrador.

### C6.3 Bloques e ítems nuevos

Ver el registro de ids (sección «Registro»): **13 bloques** (`672–684`) y **24 ítems** (`1130–1153`). **Mobs:** ninguno (los maestros son `vecino` con rol nuevo: carpintero, herrero y alfarera, con su modelo en `modelos-gente.js`).

### C6.4 Balance (con `precios.js` y `MAPA_ECONOMIA.md`)

- **Ingreso por día de oficio** (📏 `bot-economia`): nivel 0–2 con encargos: **≈ 12–18 u**; nivel 5 con encargos y mostrador: **≈ 25–32 u**; nivel 10 con obras maestras: **≈ 45–50 u (2 jornadas)**; **techo** el del mostrador.
- **Inversión** para empezar: banco (8 tablas + 1 hierro) ≈ 5 u, fragua (8 piedra + 4 ladrillo + 1 cuero) ≈ 10 u, torno (4 tablas + 2 piedra + 1 tronco) ≈ 6 u, horno de barro ≈ 8 u, libro 40 u: **≈ 70 u para los tres** (≈ 2.8 jornadas), **recuperados en 3–4 días**.
- **Regla de oro:** las piezas **no entran a `buy` de las tiendas** (solo mostrador y encargos); las tiendas siguen vendiendo lo suyo (`K.verja`, `K.teja`, `K.farol`), **a un precio igual o mayor que el del oficio**, para que el oficio sea **una alternativa, no un negocio con ganancia sobre la tienda**.
- **Comodidad:** los muebles finos y la vajilla suben `comodidadAqui`; **la comodidad ya tiene tope** (`fuerza.js`: 900 s de descanso), así que no hay inflación.

### C6.5 Textos y consejos

- «🪚 Con el banco de carpintero, las tablas salen finas: de ahí salen los muebles buenos.»
- «🔥 La fragua pide leña: una por tanda, igual que el fogón.»
- «🏺 Los dibujos negros, rojos y crema son de la cerámica chorotega: llévelos al jarrón y a la vajilla.»
- «🛒 Ponga un mostrador en el pueblo: la gente compra de 8 a 5, y más en la fiesta.»

### C6.6 Riesgos

| Riesgo | Mitigación |
|---|---|
| **Estos oficios no deben subir el combate** (rompe la curva de `FASE0_CURVA_JEFES.md`) | **Nada de armas nuevas ni de ★ extra**; el yunque no cambia. Las herraduras y el candado son utilidad |
| **Cuesta mucho** (13 bloques, 24 ítems, 3 estaciones con rejilla, 3 oficios con nivel) | **Partir en dos:** (C6a) carpintería y alfarería, (C6b) herrería; las estaciones reusan `stations.js` (como el fogón, con sus recetas `cook`/propias) |
| **Rendimiento del mostrador** | un comprador por 90 s por pueblo cargado: 1 Hz, igual que `rutinas.js` |
| **El cayuco compite con el bote de 120 u** | va sin cofre y al 70 %; **el bote de remos sigue siendo la compra de 5 jornadas** del que quiere guardar la pesca |

### C6.7 👁 Que nanoyackson pruebe

1. ¿Se entiende **qué hace cada estación** sin leer? 2. ¿Sube el nivel con un **ritmo** agradable (nivel 5 en una tarde)? 3. ¿Los **dibujos chorotega** del arte se leen como cerámica y no como «adorno cualquiera»? 4. ¿Cuánta plata hizo con el **mostrador** en un día? 5. ¿Los **encargos de oficio** (C8-A) lo llevan por el taller o se sienten pegados?

---

## C7 «Fuego de la tierra»

### C7.1 Lo que ya existe (y no se duplica)

**El volcán de hoy es un decorado vivo:** el Arenal retumba y tira bombas de lava (`volcanes.js`), el Poás echa vapor, el **lahar** baja con lluvia (`lahar.js`), hay **neblina y gases** (`neblina.js`), **terremotos** (`terremoto.js`), **azufre** como mena y costra (`143`, `156`) y **obsidiana** como bloque (`K.obsidian`), que solo vende el buhonero. **Las aguas termales** existen solo como **efecto** (`termal`: +25 de temperatura del cuerpo, C3). **Lo que falta:** un **lugar** donde entrar, algo que **buscar** y alguien a quien **ayudar**.

### C7.2 Diseño

**2.1 Las cuevas volcánicas (tubos de lava)** — generación de mundo (`worldgen2.js`, como las geodas y las cuevas extra):

- **3 variantes** en volcanes, montaña y páramo: **tubo corto** (60–90 bloques), **tubo largo** (120–180) y la **cámara del magma** (una sala grande con un lago de lava, al final del largo).
- **Sección de 5 × 4**, **canales de lava a un lado** (hay que andar por la orilla: hace falta **botas de ceniza** o cuidado), **techos con estalactitas de obsidiana**, **vetas de obsidiana** (`veta_obsidiana`, suelta **lascas**) y **cristales de azufre**.
- **Fauna:** el **ceniciento** y el **zopilote de fuego** que ya existen en el inframundo (`inframundo.js`) **se reutilizan** (cuestan modelos nuevos = 0), un **murciélago de ceniza** (variante de color del murciélago) y el **basilisco** (el lagarto «Jesucristo» que corre sobre el agua y la lava: ambiente, no ataca).
- **Fin del tubo largo:** un **cofre de colada** (2–4 ítems: lascas, cristales, 1–2 mapas del tesoro, 12 % de una receta de casco) y el **minijefe** (ver abajo).
- **Sin hambre de rendimiento:** se generan con el mismo método que `barra_honda` (cueva ya existente) y **un tubo por volcán** (3–5 por mundo).

**2.2 El minijefe: «El Guardián de la Colada»** (lagarto de fuego gigante, **T3 minijefe**, como el Jaguar viejo y el Cocodrilo):

| Dato | Valor | Cómo salió |
|---|---|---|
| Vida | **150** | entre el Cocodrilo (130) y el Mono congo (170) |
| Golpe | **8** | como las Sombras grandes (6–8); la armadura de hierro lo deja en 3 |
| Especial | **pisotón de lava**: anillo rojo de **0.8 s** (se salta), **6** de daño y **quema 3 s** (el `ignifugo` y las botas de ceniza lo anulan) | usa `avisoCaida` como el Jaguar |
| TTK objetivo (bot con `media`) | **9–12 s** | `FASE0_CURVA_JEFES.md`: tramo A–B |
| Premio por baja | **[8, 10] u** (`PREMIO_BAJA`) y el 10 % las demás veces | la escala de los minijefes (`precios.js`: 7–9) |
| Suelta | 4 lascas, 2 cristales, 25 % un **casco de espeleólogo** (receta) | |

**2.3 Aguas termales** (estructura **«Termales»** al pie de un volcán, con 4–6 pozas de **agua tibia** `aguas_termales` y una casita con la taquilla):

- **Pase** (`pase_termales`): **6 u (≈ ₡3 000)** y dura **10 minutos de juego** (la taquillera lo sella; gratis con reputación ≥ 5 en ese pueblo).
- **Efecto:** `termal` (calienta), **cura 1 de vida cada 3 s durante 90 s**, quita **cansancio y escalofrío**, y da **«descansado» 4 min** (comodidad ya sube por la estructura). **Compárese con la mecedora** (12 hp por 72 s sin costo, tope 6 curas + 5 min de enfriamiento): el termal **cura más pero cuesta plata** y **se acaba en el pase**.
- **Huevos de aguas termales:** un huevo (`287`) en la poza **60 s** sale **cocido con sal volcánica** (`huevo_termal`: **7 de comida**, más que el huevo frito de 5); **no se vende** (come en casa).
- **Hotel termal** (estructura opcional): **30 u** la noche (≈ 2.4 jornadas; la cabina común vale 25 000 ₡ = 50 u en `ANCLAS`, así que **es más barata por incluir el termal**): **la mejor cama del juego** (descansado 8 min).

**2.3b La tierra volcánica y la ceniza fértil:** al enfriarse una **erupción** (ver 2.5) quedan **parches de `tierra_volcanica`** que **se cosechan con pala** (`ceniza_fertil`, 2–4 por bloque) y **dan +25 % de crecimiento a los cultivos** (una bolsa abona 9 bloques por una cosecha). **Coordinar con C3:** el «+25 % de cultivos en invierno» que quedó pendiente **no se suma** (tope +40 %).

**2.4 El observatorio y los sismógrafos** (una estructura **«Observatorio vulcanológico»**, 1 por volcán, con la **vulcanóloga Doña Leda** y su casita de piedra):

- **Misión corta (la «Red sísmica»):** colocar **5 sismógrafos** (bloque `sismografo`: 4 tablas finas + 2 clavos + 1 hierro + 2 cuero) en un **anillo de 40–120 bloques** alrededor del cráter. **Pagan 14 u cada uno** (1.2 × los ≈ 11 u de materiales: regla de oro) y **dan el logro «La montaña tiene oído»**.
- **Con 3 o más sismógrafos** el volcán **avisa** de las erupciones (2.5); sin ellos hay solo **retumbos** (como hoy). Cada sismógrafo **imprime un sismograma** (`sismograma`) cada día, que **la vulcanóloga paga a 1 u** (tope 5).
- **Muestras volcánicas** (`muestra_volcanica`: 1 frasco = 2 lascas + 1 cristal de azufre + 1 pómez): **6 u cada una**, **cupo 3 al día**.

**2.5 La erupción como evento:** una vez cada **≈ 25 días** (con aleatoriedad: 18–32) **el volcán más cercano al jugador** «se despierta». **Con ≥ 3 sismógrafos** el aviso es de **3 días**:

| Día | Qué pasa |
|---|---|
| **−3** | **temblores** (`terremoto.js` suave), el sismograma sube, el toast «🌋 El volcán se está moviendo» |
| **−2** | **ceniza ligera** en el aire, los animales se inquietan |
| **−1** | **la vulcanóloga pide evacuar**: avisar a **5 vecinos del pueblo más cercano** (hablarles), subir a los viejitos a la **carreta** (ya existe) o al `refugio` (estructura que ya hay) |
| **Día 0** | **erupción de 4 minutos de juego**: bombas (las del Arenal, ya existen), **ceniza densa** (se ve poco), **lahar si llueve** (ya existe). **Los vecinos no mueren** (se refugian); **la casa de la abuela y las siembras sí sufren** (ver abajo) |
| **+1** | **parches de tierra volcánica**; las **termales se llenan** (más pases) |

**Premio y castigo:** evacuar a 5 vecinos paga **60 u (≈ 2.4 jornadas) y +3 de reputación** en ese pueblo; **no hacer nada** quita **−2 de reputación** y la ceniza **cubre 12 cultivos** al azar de la finca (se limpian con pala en 1 minuto cada uno: molesto, **no pierde plata**). **Sin sismógrafos no hay aviso ni premio**: la erupción llega de sorpresa y solo hay el daño de ceniza.

**2.6 Fumarolas:** grietas con vapor (`fumarola`) en los cráteres y en las faldas: **dañan 1 cada 2 s con mareo** si uno se queda y **no se tiene la mascarilla de gases** (que ya existe); sueltan **cristales de azufre** al **picarlas con la mascarilla** (la mena y la costra de hoy se quedan: esto es un **lugar nuevo** de azufre).

**2.7 Ítems de equipo** (todos **por debajo de la curva** de `FASE0_CURVA_JEFES.md`; **ninguno sube el techo de daño actual**):

| Ítem | Qué es | Números | Por qué calza |
|---|---|---|---|
| **Cuchillo de obsidiana** (`1161`) | cuchillo (clase `cuchillo`, cd 0.3) | **daño 6**, durabilidad **120** (frágil), por la espalda **×3** como el cuchillo de monte | el cuchillo de monte es 5 (≈ 17.8 dps) y el de pinza (jefe del monte) 8 (≈ 28 dps): **6 ≈ 21 dps, entre los dos**; **la espada de hierro (6) da ≈ 15 dps**; la durabilidad corta lo mantiene como **arma de caza, no de jefes** |
| **Casco de espeleólogo** (`1167`) | casco con linterna propia | **2 puntos** (como el casco de hierro), durabilidad 300; **ilumina en cuevas** (`env.cave > 0.6`) | mantiene `armorValue` en la escala de `FASE0_CURVA_JEFES.md` §4 (cuero 7, hierro 15, diamante 20) |
| **Botas de ceniza** (`1168`) | botas | **1 punto**, **lava y fuego ×0.5**, no se quema en ceniza caliente | utilidad, no defensa |

**2.8 Obsidiana y pómez:** **lascas** de las vetas (1 u, **no se venden a tiendas**; al observatorio sí); **piedra pómez** (0.5 u) y **bloque de pómez** (**liviano: flota en agua**, es un material decorativo y de balsas); **cristales de azufre** (3 u al observatorio, **hacen pólvora de bombetas** como el azufre de hoy).

### C7.3 Recetas y choques

| Receta | Sale |
|---|---|
| 2 lasca de obsidiana + 1 palo + 1 cabuya | **Cuchillo de obsidiana** |
| 3 cuero + 4 pómez + 1 ceniza fértil | **Botas de ceniza** |
| 4 hierro + 2 cuero + 1 antorcha + 1 vidrio | **Casco de espeleólogo** (aprendido del cofre de colada) |
| 4 tablas finas + 2 clavos + 1 hierro + 2 cuero | **Sismógrafo** |
| 2 lasca + 1 cristal + 1 pómez | **Muestra volcánica** |
| 1 huevo en el termal 60 s | **Huevo de aguas termales** |

**Choques:** `revisar-recetas` en 0 (el cuchillo de obsidiana no pisa el de monte ni el de pinza); `revisar-nombres` con los 11 ítems y 7 bloques; **`K.obsidian`** sigue vendiéndose, pero **el bloque entero de obsidiana sigue siendo de construcción** (la veta suelta lascas, el bloque de siempre se compra).

### C7.4 Balance

- **Ingresos de la tanda:** red sísmica **70 u (una vez)**, muestras y sismogramas **≈ 15 u al día** como máximo, **evacuación 60 u cada ≈ 25 días (2.4 jornadas)**, y el **minijefe** (8–10 u). **No es una fuente diaria de plata**: es un lugar con **cosas que hacer y un evento**.
- **Gastos:** pase 6 u, hotel 30 u, sismógrafos ≈ 55 u. Neto del primer volcán: **+15 u**: **se hace por el lugar**, no por la plata.
- 📏 El minijefe **entra en el simulador** (`curva-jefes.mjs` de `FASE0_CURVA_JEFES.md`) con 150 de vida y 8 de golpe antes de fijar los números.

### C7.5 Textos y consejos

- «🌋 Doña Leda dice que la montaña avisa: con tres sismógrafos se sabe cuándo se despierta.»
- «😷 Las fumarolas queman los pulmones: póngase la mascarilla.»
- «♨ En los termales se descansa de verdad: seis colones el pase, diez minutos.»
- «🔦 Con el casco de espeleólogo se ve lo que la antorcha no alcanza.»

### C7.6 Riesgos

| Riesgo | Mitigación |
|---|---|
| **Generación de mundo** (el más caro y el más riesgoso: **cambia el generador**) | **Solo mundos nuevos** o `genVersion` nueva (`typesFor`, `minV`, como las demás estructuras); **los mundos viejos no cambian** (no tienen cuevas volcánicas, y no pasa nada) |
| **Lava cerca de la casa** | Los tubos **no se generan a menos de 200 bloques de pueblos ni del spawn** |
| **La erupción** puede ser molesta | Se puede **apagar** con la opción «Movimiento tranquilo» (solo toast y ceniza visual) y en **Tranquilo** no hay castigo |
| **El minijefe** y la curva | Se mide con el simulador antes de fijar la vida |
| **`worldgen2` es de las partes con más pruebas** | `tools/revisar-mundo.mjs` (40–60 semillas) debe pasar sin superposiciones |

### C7.7 👁 Que nanoyackson pruebe

1. Un **tubo de lava**: ¿da miedo y ganas de seguir, o es un pasillo? 2. El **termal**: ¿vale 6 u? 3. La **erupción con aviso**: ¿se entiende lo de avisar a los vecinos sin que sea una carga? 4. El **Guardián** a pie con equipo de hierro: ¿cuántas veces muere? (objetivo ≈ 0.15, como los minijefes.) 5. El **casco**: ¿se nota la luz en una cueva normal también?

---

## C8 «El pueblo se junta»

**Tres partes que se construyen por separado:** **A** los encargos (la más barata y la primera de todo el documento), **B** la fiesta patronal y **C** el Comité de Caminos (la red de pueblos).

### C8.1 Lo que ya existe (y no se duplica)

`ERRANDS` (10 recados iguales, `pueblo.js:204`), `repPueblo` y `factorRep` (`saberes.js`), las historias de los vecinos (`misiones.js`), los encargos de la gente de la casa (`encargos.js`), **retos semanales** (`retos.js`), «Se busca» (`recompensas.js`), turistas (`turistas.js`), ermitas, **bus y tren**, y el **calendario de fiestas** de 12 días con tope de caballos y mascarada (`fiestas2.js`).

### C8-A Encargos 2.0 y el tablón (valor 5, costo 1.0)

**A.1 El tablón** (bloque `tablon_encargos`, **uno por pueblo, en la plaza**; se genera con el pueblo): una lista de **3–5 encargos que se renuevan cada día** (semilla `hash3(día, pueblo)` para que **sea determinista y no cambie al recargar**). El jugador los **ve** sin hablar con nadie, los **acepta** con clic derecho y los **lleva en el «Libro de encargos»** (`libro_encargos`, ítem que se entrega al **primer encargo**; sale en la brújula y en la ruta `J`).

**A.2 Quién pide qué** (el hueco H6: hoy todos piden lo mismo): cada pueblo tiene un **perfil** que sale de **sus tiendas y de su bioma**, y cada encargo se genera **según quién lo pide**:

| Tipo | Ejemplo | De qué depende |
|---|---|---|
| **Entrega** | «8 mazorcas», «10 pargos» | el oficio de quien pide (soda → pescado; pulpería → cosechas; herrero → hierro) |
| **Oficio** (C6) | «una alacena fina», «4 herraduras» | solo si el jugador **tiene el oficio a ese nivel** |
| **Pesca** (C5) | «2 róbalos de estero», «un atún» | solo en pueblos de costa o río |
| **Comida** | «un casado», «sopa de mariscos para el domingo» | las recetas que el jugador **ya sabe hacer** (`conocidas`) |
| **Mandado** | «lleve este paquete a [pueblo]» | el pueblo está a 150–600 bloques; usa **ermita, bus o carreta**; **entrega con firma** |
| **Obra** | «ponga 12 tablas de piso en el corredor de la escuela» | cuenta bloques puestos dentro de una zona marcada |
| **Volcán** (C7) | «una muestra volcánica» | solo con un observatorio a ≤ 400 bloques |

**A.3 El pago (la fórmula, calza con `precios.js`):**

`pago = ⌈ Σ valorRef(ítem) × n × (1.25 + 0.15·urgente + 0.25·raro) ⌉`

- **`valorRef(ítem)`** = su precio de **compra en tienda** (`SHOPS.sell`) si existe; si no, **0.8 × su precio de venta** (`SHOPS.buy`); si tampoco, la tabla de la tanda que lo creó. (Es la «regla de oro»: **un encargo nunca paga menos que vender ni mucho más que comprar**.)
- **urgente** = plazo de **1 día de juego** (+15 %); **raro** = lo que sale de un jefe o de un lugar (+25 %).
- **Tope diario de encargos: 40 u** (1.6 jornadas); sobre eso se pagan **al 40 %** (**el mismo cupo** de la sección 0.4).
- **Reputación:** **+1** por encargo cumplido en ese pueblo, **+2** si era urgente y a tiempo, **−1** si era urgente y se dejó vencer (los comunes vencen en silencio, sin castigo). **Ya existe** el descuento de tienda por reputación (`factorRep`: ≥ 5 → 0.9, ≥ 10 → 0.8).

**A.4 Lo que da la reputación nueva** (`repPueblo`):

| Reputación | Se abre |
|---|---|
| **≥ 3** | poner un **mostrador** en ese pueblo (C6) |
| **≥ 5** | **encargos grandes** (×3 de materiales, pagan 1.4 × y dan una **receta** del pueblo: `saberes.js`); el pase gratis a los termales |
| **≥ 10** | **«cliente de confianza»**: el tablón deja **fiar** un encargo (se entrega mañana), y el pueblo lo menciona en la **fiesta patronal** (C8-B) |

**A.5 Números concretos de un día** (📏 `bot-economia`): un jugador que **solo hace encargos** del tablón de **un pueblo** gana **≈ 20–30 u** (4 encargos de 6–8 u), **que es una jornada** (el ancla de `MAPA_ECONOMIA.md`). Con **dos pueblos y mandados** llega al **tope de 40 u**.

**A.6 Cómo se reemplaza lo de hoy:** `ERRANDS` **no se borra**: queda como **«recado del vecino al hablarle»** (el 55 % de las veces que uno habla), **pero sus 10 recados salen ahora por el perfil** y **pagan por la fórmula** (hoy pagan 5–12 u fijos). Los **retos semanales** (`retos.js`) y **«Se busca»** se quedan igual.

### C8-B La fiesta patronal (valor 3, costo 1.5)

**B.1 Cada pueblo tiene su santo y su fiesta** (hoy el calendario es **global** de 12 días): `santoDia(pueblo) = 1 + hash(vid) % 24` en un **ciclo de 24 días**; la fiesta dura **3 días** (`santoDia`, +1, +2). Con 5–8 pueblos cerca **casi siempre hay una fiesta a < 600 bloques**. Los **nombres de los santos** se eligen de una lista tica (San Isidro, San Antonio, Santiago, la Candelaria, Santa Cruz, la Virgen de los Ángeles) y salen en la **placa de la iglesia y en la brújula**.

**B.2 El programa (3 días, un estandarte y una tarima en la plaza):**

| Día | Qué hay | Qué hace el jugador |
|---|---|---|
| **1: La novena** (noche) | **velas** (`vela_novena`), el **estandarte** del santo (`estandarte_santo`) en la iglesia, una **procesión corta** (usa `procesion.js`) | encender 1 vela (gratis) o **9** (la «novena» de verdad, 9 noches: logro); **+1 de reputación** |
| **2: La cimarrona y el tope** (día) | **la cimarrona** (una banda de **6 músicos** que recorre el pueblo), el **tope de caballos** con premio, **chinamos y turno** (`feria_pueblo`) | **participar en el tope** (ver abajo), **tocar un instrumento** con la banda, **comer en los chinamos** |
| **3: La mascarada y la pólvora** (día y noche) | **mascaradas** (cabezonas, **giganta, calavera y diablo**), **baile en la tarima**, **castillo de pólvora** de noche | **ponerse una máscara** (`g.disguised` ya existe) y **bailar** con la comparsa, **tirar bombetas** |

**B.3 El tope** (el desfile de caballos de **fiestas2.js**, que hoy es de adorno): **con un caballo** (`montura`) y una **herradura** (C6; sin herradura corre normal) el jugador **se une al desfile**: debe **mantener su caballo entre otros dos jinetes, a media distancia** (una banda de ±1.5 bloques, durante 90 s), y **no pisar a los peatones**. **Premio: 10 u y la cinta del «mejor jinete»** (una vez por fiesta). Es un **minijuego de ritmo suave**, no de combate.

**B.4 La cimarrona** (nuevo grupo de **6 `vecino` con rol «cimarronero»**: redoblante, platillos, trompeta, clarinete, bombardino y bombo; **modelos de vecino con un instrumento**): **recorre el pueblo** de la iglesia a la tarima en **4 minutos**, **suena con su pista** (**sonido nuevo**: ver abajo) y **se puede acompañar**; **el jugador puede tocar** el `tambor_cimarrona` o la `trompeta` (un clic sigue el compás, sin puntaje: solo hace sonar un golpe que **encaja** o **desentona** según el tiempo; **logro «Cimarronero»** a los 30 compases buenos).

**B.5 La mayordomía:** el jugador puede **apadrinar la fiesta** (hablar con el cura o con el presidente de la junta **antes del día 1**): **cuesta 60 u (≈ ₡30 000)** y **se compromete a llevar 20 tamales y la pólvora (5 bombetas)**; a cambio recibe la **banda de mayordomo**, **+5 de reputación**, **×1.5 en las ventas de su mostrador** durante la fiesta (C6) y **el pueblo lo menciona un año (24 días)**. **No da plata**: es un gasto de prestigio, como en la vida real; **el logro «Mayordomo»**.

**B.6 Sonido nuevo (pedido para la constructora, CC0 de Freesound):** **`loop.cimarrona`** (una marcha de banda de metales y percusión, 30–60 s, un lazo), **`cimarrona.golpe`** (redoblante) y **`cimarrona.nota`** (trompeta), **`fragua.martillo`** y **`torno.giro`** (C6), **`fumarola.vapor`** y **`sismo.retumbo`** (C7). **Solo los marcados CC0** (como el resto).

### C8-C El Comité de Caminos (valor 4, costo 1.5)

**La misión larga de la red de pueblos.** Es **una cadena de 6 etapas** a lo largo de **5 pueblos** (los 5 más cercanos al hogar, ordenados por distancia), que **pide algo de cada tanda anterior**:

| Etapa | Pueblo | Lo que se pide | De qué tanda |
|---|---|---|---|
| **1. El mojón cero** | el de la casa | **6 mojones** (`mojon_camino`, de 4 piedra + 1 pómez; ≈ 3 u) **puestos cada ~40 bloques** del camino hacia el pueblo B (el juego cuenta los que quedan a ≤ 12 bloques de la línea recta) | C7 (pómez) |
| **2. El puente** | B | **un puente de tablas** sobre el río más cercano (**12 tablas finas**, ≈ 12 u), contado como obra | C6 (carpintería) |
| **3. La luz de la plaza** | C | **4 faroles forjados** (`farol_forjado`, ≈ 8 u c/u) | C6 (herrería) |
| **4. El techo de la escuela** | D | **20 tejas** (alfarería) o 20 de la tienda | C6 (alfarería) |
| **5. La minga** (comida) | E | **10 sopas de mariscos** o **20 tamales** para el banquete | C5 / cocina |
| **6. La Gran Minga** | el de la casa | un sábado, **los vecinos de los 5 pueblos** se juntan en la plaza (los `vecino` de cada pueblo **aparecen** en la tarima y en la mesa larga); **ceremonia de 3 minutos** con la cimarrona | todo |

**Reparto de la plata:** costo total de materiales **≈ 80 u**; **recompensa: 200 u** (≈ 8 jornadas, **una sola vez**) más:

- el **«Pase de los Caminos»** (`pase_caminos`): **el bus entre esos 5 pueblos pasa a ser gratis** (`bus.js`) y se **desbloquea el viaje por ermita entre ellos** sin gastar (`ermitas.js`);
- una **placa con su nombre** en cada plaza (`placa`, ya existe);
- **+5 de reputación en los 5 pueblos** y el logro **«El Comité de Caminos»**;
- **el mercado regional** (ver abajo).

**El mercado regional (después de la misión):** cada pueblo **tiene una especialidad** (Guanacaste: cuero y queso; Valle: café y flores; Caribe: cacao, coco y pescado; Sur: pejibaye; Norte: piña y yuca; Pacífico: sal y mariscos; Nuboso: hongos y trucha; Cordillera: papa y lana), que **compra 25 % más caro lo que en otros pueblos es común** y **vende 15 % más barato lo suyo**. Es **un incentivo para cargar la carreta de C4** (9 casillas) y llevar cosas de un pueblo a otro. **El freno:** cada pueblo **compra hasta 20 u al día por producto** (cupo de la sección 0.4) y **el margen neto no pasa de 1.2 jornadas por viaje** (**la regla de oro no se rompe: se vende lo de otro lugar, no lo comprado en el mismo**).

**Nuevos `vecino`** (roles): **presidente del Comité** (Don Evelio), **carpintero**, **herrero**, **alfarera**, **vulcanóloga**, **cimarronero**, **mayordomo/cura**, **guardacostas**, **voluntaria de tortugas**. **Cada uno con su modelo y sus frases**, en `modelos-gente.js` y `pueblo.js: LINES`.

### C8.2 Números de la tanda (resumen)

| Concepto | Valor |
|---|---|
| Tope diario de encargos del tablón | **40 u** (1.6 jornadas), 40 % sobre eso |
| Pago de un encargo | **1.25 × valor de referencia** (+0.15 urgente, +0.25 raro) |
| Reputación | +1, +2 urgente a tiempo, −1 urgente vencido |
| Mayordomía | **60 u**, +5 de reputación, ×1.5 mostrador |
| Mejor jinete del tope | **10 u** una vez por fiesta |
| Comité de Caminos | **≈ 80 u de materiales, 200 u de premio** una vez; mercado regional con cupo de 20 u por producto y día |

### C8.3 Textos y consejos (en «usted»)

- «📋 Pase por el tablón de la plaza: hay encargos para hoy.»
- «🔔 Mañana es la fiesta de San Isidro en el pueblo: habrá novena, tope y cimarrona.»
- «🥁 La cimarrona anda por la plaza: arrímese y toque con ellos.»
- «🛣 El Comité de Caminos necesita manos: Don Evelio lo espera en la plaza.»
- «🏇 Para el tope hace falta caballo; con herradura corre más parejo.»

### C8.4 Riesgos

| Riesgo | Mitigación |
|---|---|
| **Los encargos se vuelven un trabajo repetitivo** | Tope diario de 40 u; **tipos mezclados** y un **solo tablón por pueblo**; los encargos **dependen del oficio que el jugador no tiene si no lo tiene** (no pide lo imposible) |
| **Rendimiento de la cimarrona** (6 NPC y un sonido espacial) | Solo **un grupo activo a la vez** (la fiesta más cercana, < 300 bloques); sale de la lista si el jugador se aleja |
| **La misión del Comité rompe en mundos con menos de 5 pueblos** | Pide **2 a 5 etapas** según los pueblos que haya a < 1 200 bloques (**mínimo 2**) |
| **`fiestas2.js` choca** con el calendario por pueblo | El calendario global **se queda** para la mascarada y el Festival de la Luz; **la patronal es por pueblo y solo agrega** |
| **Cultural:** las máscaras y la mascarada | Son la **mascarada costarricense** (giganta, calavera, diablo de fiesta) con **cartón pintado y humor**, no las máscaras rituales de pueblos indígenas |

### C8.5 👁 Que nanoyackson pruebe

1. Una **mañana de tablón**: ¿los encargos tienen **sentido** según el pueblo? 2. ¿Se siente **demasiado trabajo** o **una meta**? 3. **La cimarrona**: ¿suena a banda de fiesta tica (el sonido es lo más importante de la fiesta)? 4. **El tope**: ¿el minijuego es amable o frustrante? 5. **El Comité**: ¿vale la pena el pase y la placa para el esfuerzo?

---

## Registro de ids (ítems desde 1100, bloques desde 665)

*(v12.4.11, constructora: todas las reservas de bloques corridas 2 lugares; 663 y 664 los usan los postigos girados de la v12.4.9.)*

### C5 «Mar adentro»

| Id | Clave | Nombre | Qué es |
|---|---|---|---|
| **1100** | `cana_fibra` | Caña de fibra | caña tier 2 (carrete, pica antes) |
| **1101** | `cana_altamar` | Caña de altamar | caña tier 3 (pez grande) |
| **1102** | `lombriz` | Lombriz | carnada de agua dulce |
| **1103** | `sardina` | Sardina (carnada) | carnada de mar |
| **1104** | `senuelo` | Señuelo | carnada artificial |
| **1105** | `machaca` | Machaca | pez de río |
| **1106** | `tilapia` | Tilapia | pez de río y laguna |
| **1107** | `robalo` | Róbalo | pez de estero |
| **1108** | `trucha` | Trucha | pez de río frío |
| **1109** | `sabalo` | Sábalo | pez grande de estero |
| **1110** | `pez_gallo` | Pez gallo | pez de altamar |
| **1111** | `atun` | Atún | pez de altamar (pelea) |
| **1112** | `pargo_mancha` | Pargo mancha | pez de arrecife |
| **1113** | `langosta` | Langosta | marisco de arrecife (nasa) |
| **1114** | `camaron` | Camarón | marisco (nasa, estero) |
| **1115** | `piangua` | Piangua | concha del manglar (veda) |
| **1116** | `ostion` | Ostión | molusco (a veces perla) |
| **1117** | `sopa_mariscos` | Sopa de mariscos | plato de la soda |
| **1118** | `arroz_camarones` | Arroz con camarones | plato de la soda |
| **1119** | `langosta_gratinada` | Langosta gratinada | plato de lujo |
| **1120** | `pescado_seco` | Pescado seco | despensa larga (secadero) |
| **1121** | `fragmento_coral` | Fragmento de coral | para el vivero |
| **1122** | `vela_lona` | Vela de lona | para el bote de vela |
| **1123** | `bote_vela` | Bote de vela | vehículo (vela, sin gasolina) |
| **1124** | `estaca_nido` | Estaca de nido | marca un nido protegido |
| **1125** | `banderita_azul` | Banderita azul | premio de conservación |
| bloque **665** | `muelle` | Muelle de tablones | bloque (losa sobre el agua) |
| bloque **666** | `pilote` | Pilote de amarre | bloque (poste con argolla) |
| bloque **667** | `boya` | Boya | bloque (marca flotante) |
| bloque **668** | `nido_marcado` | Nido protegido | bloque (nido con estaca) |
| bloque **669** | `vivero_coral` | Vivero de coral | bloque (bajo el agua) |
| bloque **670** | `secadero` | Secadero de pescado | bloque (seca y sala) |
| bloque **671** | `pecera` | Pecera | bloque decorativo (comodidad) |
| **1126** | `cabuya` | Cabuya | fibra para amarrar (2 caña brava → 3) |
| bloque **697** | `coral_blanco` | Coral blanco | bloque (arrecife blanqueado) |

### C6 «Manos de maestro»

| Id | Clave | Nombre | Qué es |
|---|---|---|---|
| **1130** | `serrucho` | Serrucho | herramienta de carpintería |
| **1131** | `cepillo` | Cepillo de carpintero | herramienta (tabla fina) |
| **1132** | `formon` | Formón | herramienta (talla) |
| **1133** | `martillo_forja` | Martillo de forja | herramienta de herrería |
| **1134** | `tenazas` | Tenazas | herramienta de herrería |
| **1135** | `clavos` | Clavos | pieza de herrería |
| **1136** | `bisagras` | Bisagras | pieza de herrería |
| **1137** | `mango` | Mango de madera | pieza de carpintería |
| **1138** | `tabla_fina` | Tabla fina | pieza de carpintería (cepillada) |
| **1139** | `barro_amasado` | Barro amasado | pieza de alfarería |
| **1140** | `engobe_rojo` | Engobe rojo | pintura de alfarería |
| **1141** | `engobe_negro` | Engobe negro | pintura de alfarería |
| **1142** | `engobe_crema` | Engobe crema | pintura de alfarería |
| **1143** | `herradura` | Herradura | caballo más rápido |
| **1144** | `candado` | Candado | protege un cofre |
| **1145** | `olla_barro` | Olla de barro | cocina mejor |
| **1146** | `comal` | Comal | cocina tortillas |
| **1147** | `vajilla_chorotega` | Vajilla chorotega | decoración y comodidad |
| **1148** | `cayuco` | Cayuco | vehículo (canoa de un tronco) |
| **1149** | `yugo` | Yugo | para los bueyes de la carreta |
| **1150** | `libro_carpinteria` | Libro de carpintería | enseña recetas |
| **1151** | `libro_herreria` | Libro de herrería | enseña recetas |
| **1152** | `libro_alfareria` | Libro de alfarería | enseña recetas |
| **1153** | `sello_maestro` | Sello de maestro | marca una obra maestra |
| bloque **672** | `banco_carpintero` | Banco de carpintero | bloque (estación) |
| bloque **673** | `fragua` | Fragua | bloque (estación, gasta leña) |
| bloque **674** | `torno_alfarero` | Torno de alfarero | bloque (estación) |
| bloque **675** | `horno_barro` | Horno de barro | bloque (cuece cerámica) |
| bloque **676** | `alacena` | Alacena | bloque (guarda comida; se pudre más despacio) |
| bloque **677** | `armario` | Armario | bloque (guarda ropa y armadura) |
| bloque **678** | `mesa_grande` | Mesa grande | bloque (mesa de la familia) |
| bloque **679** | `tinaja` | Tinaja | bloque (guarda agua) |
| bloque **680** | `mostrador` | Mostrador | bloque (vende solo) |
| bloque **681** | `jarron_chorotega` | Jarrón chorotega | bloque decorativo |
| bloque **682** | `puerta_tallada` | Puerta tallada | bloque (puerta con comodidad) |
| bloque **683** | `verja_forjada` | Verja forjada | bloque (reja de hierro) |
| bloque **684** | `farol_forjado` | Farol forjado | bloque (luz de plaza) |

### C7 «Fuego de la tierra»

| Id | Clave | Nombre | Qué es |
|---|---|---|---|
| **1160** | `lasca_obsidiana` | Lasca de obsidiana | material (vetas del volcán) |
| **1161** | `cuchillo_obsidiana` | Cuchillo de obsidiana | cuchillo afilado, frágil |
| **1162** | `cristal_azufre` | Cristal de azufre | material (fumarolas) |
| **1163** | `piedra_pomez` | Piedra pómez | material liviano |
| **1164** | `ceniza_fertil` | Ceniza fértil | abono volcánico |
| **1165** | `huevo_termal` | Huevo de aguas termales | comida (se cuece en el termal) |
| **1166** | `sismograma` | Sismograma | dato para el observatorio |
| **1167** | `casco_minero` | Casco de espeleólogo | casco con luz propia |
| **1168** | `botas_ceniza` | Botas de ceniza | botas contra el calor |
| **1169** | `pase_termales` | Pase a los termales | entrada a las aguas termales |
| **1170** | `muestra_volcanica` | Muestra volcánica | encargo del observatorio |
| bloque **685** | `fumarola` | Fumarola | bloque (gas; con mascarilla) |
| bloque **686** | `sismografo` | Sismógrafo | bloque (cinco alrededor del volcán) |
| bloque **687** | `tierra_volcanica` | Tierra volcánica | bloque (cultivos +25 %) |
| bloque **688** | `aguas_termales` | Aguas termales | bloque (agua tibia, descansa) |
| bloque **689** | `cristal_azufre_bloque` | Cristales de azufre | bloque (veta) |
| bloque **690** | `veta_obsidiana` | Veta de obsidiana | bloque (suelta lascas) |
| bloque **691** | `pomez_bloque` | Bloque de pómez | bloque (liviano) |

### C8 «El pueblo se junta»

| Id | Clave | Nombre | Qué es |
|---|---|---|---|
| **1180** | `tambor_cimarrona` | Tambor de cimarrona | instrumento (se toca) |
| **1181** | `trompeta` | Trompeta | instrumento (se toca) |
| **1182** | `mascara_giganta` | Máscara de giganta | disfraz de mascarada |
| **1183** | `mascara_calavera` | Máscara de calavera | disfraz de mascarada |
| **1184** | `mascara_diablo` | Máscara de diablo | disfraz de mascarada |
| **1185** | `banda_mayordomo` | Banda de mayordomo | honor de la fiesta patronal |
| **1186** | `vela_novena` | Vela de la novena | objeto de la novena |
| **1187** | `libro_encargos` | Libro de encargos | lleva los encargos |
| **1188** | `sello_comite` | Sello del Comité de Caminos | misión de la red de pueblos |
| **1189** | `pase_caminos` | Pase de los Caminos | recompensa final de la misión |
| bloque **692** | `tablon_encargos` | Tablón de encargos | bloque (en la plaza) |
| bloque **693** | `estandarte_santo` | Estandarte del santo | bloque (fiesta patronal) |
| bloque **694** | `tarima` | Tarima | bloque (escenario de la plaza) |
| bloque **695** | `arco_fiesta` | Arco de fiesta | bloque (entrada a la plaza) |
| bloque **696** | `mojon_camino` | Mojón del camino | bloque (obra del Comité) |

**Conteo:** 72 ítems (`1100–1153`, `1160–1170`, `1180–1189`; **quedan ~125 libres** en `1100–1299`) y 33 bloques (`665–697`; **quedan ~330 libres** hasta 1023). **Mobs:** tortuguita, saqueador de nidos, langosta (decorado), cardumen de atún, garza, murciélago de ceniza, basilisco, **Guardián de la Colada** (minijefe) y la cimarrona (6 vecinos). **Roles de `vecino`:** carpintero, herrero, alfarera, vulcanóloga, cimarronero, mayordomo, guardacostas, voluntaria de tortugas, presidente del Comité.


## Pedidos de arte para Codex (todas las tandas)

**Estilo:** el de `docs/revisiones/PEDIDOS_ARTE_LOTE1.md` §0 (plano tipo Kenney, **512×512, fondo transparente**, **sin contorno negro**, brillo arriba a la izquierda y sombra abajo a la derecha, paleta por material). Cada prompt lleva la guía dentro. **Los bloques** se dibujan solos en el juego con `pixelart.js` (texturas de 16×16); **el pedido de aquí es el ícono plano de 512 px para el inventario**. **Dos reglas de esta tanda:** (1) **la cerámica chorotega** (vajilla, jarrón) se dibuja con **negro, rojo ladrillo y crema** sobre fondo claro, **dibujos geométricos propios** (nada de copiar piezas reales); (2) **las máscaras de mascarada** son de **cartón pintado con humor** (giganta, calavera, diablo de fiesta), **sin rostros aterradores**.

| Archivo | Se conecta a | Prompt |
|---|---|---|
| `item-cana_fibra.png` | C5 · ítem **1100** · `cana_fibra` → `src/assets/items-gpt/cana_fibra.png` | Ícono de videojuego en estilo plano (flat) de caña de fibra. Una caña de pescar de fibra con carrete de manivela, el mango de madera clara y el hilo enrollado, la punta ligeramente curvada; en diagonal. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. Un solo objeto centrado, ocupando cerca del 75 % del lienzo, vista de 3/4 desde arriba, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego. |
| `item-cana_altamar.png` | C5 · ítem **1101** · `cana_altamar` → `src/assets/items-gpt/cana_altamar.png` | Ícono de videojuego en estilo plano (flat) de caña de altamar. Una caña de pescar gruesa de altamar con carrete grande de metal color latón, el mango forrado de cabuya y un anillo guía dorado; en diagonal. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. Un solo objeto centrado, ocupando cerca del 75 % del lienzo, vista de 3/4 desde arriba, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego. |
| `item-lombriz.png` | C5 · ítem **1102** · `lombriz` → `src/assets/items-gpt/lombriz.png` | Ícono de videojuego en estilo plano (flat) de lombriz. Dos lombrices rosadas enroscadas sobre un puñito de tierra café húmeda; sencillo y simpático, sin ojos ni cara. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. Un solo objeto centrado, ocupando cerca del 75 % del lienzo, vista de 3/4 desde arriba, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego. |
| `item-sardina.png` | C5 · ítem **1103** · `sardina` → `src/assets/items-gpt/sardina.png` | Ícono de videojuego en estilo plano (flat) de sardina (carnada). Tres sardinas plateadas con el lomo azul, juntas y en fila, brillo claro en el costado. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. Un solo objeto centrado, ocupando cerca del 75 % del lienzo, vista de 3/4 desde arriba, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego. |
| `item-senuelo.png` | C5 · ítem **1104** · `senuelo` → `src/assets/items-gpt/senuelo.png` | Ícono de videojuego en estilo plano (flat) de señuelo. Un señuelo de pesca de madera pintada en forma de pececito amarillo y rojo con un anzuelo de tres puntas y una argolla. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. Un solo objeto centrado, ocupando cerca del 75 % del lienzo, vista de 3/4 desde arriba, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego. |
| `item-machaca.png` | C5 · ítem **1105** · `machaca` → `src/assets/items-gpt/machaca.png` | Ícono de videojuego en estilo plano (flat) de machaca. Un pez de río alargado de color plateado verdoso con una franja oscura y la boca grande, de perfil. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. Un solo objeto centrado, ocupando cerca del 75 % del lienzo, vista de 3/4 desde arriba, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego. |
| `item-tilapia.png` | C5 · ítem **1106** · `tilapia` → `src/assets/items-gpt/tilapia.png` | Ícono de videojuego en estilo plano (flat) de tilapia. Una tilapia ovalada de color gris rosado con aleta dorsal alta y una mancha oscura en la cola, de perfil. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. Un solo objeto centrado, ocupando cerca del 75 % del lienzo, vista de 3/4 desde arriba, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego. |
| `item-robalo.png` | C5 · ítem **1107** · `robalo` → `src/assets/items-gpt/robalo.png` | Ícono de videojuego en estilo plano (flat) de róbalo. Un róbalo alargado plateado con una línea lateral oscura bien marcada y la cabeza chata, de perfil. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. Un solo objeto centrado, ocupando cerca del 75 % del lienzo, vista de 3/4 desde arriba, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego. |
| `item-trucha.png` | C5 · ítem **1108** · `trucha` → `src/assets/items-gpt/trucha.png` | Ícono de videojuego en estilo plano (flat) de trucha. Una trucha arcoíris de lomo verde oliva con una franja rosada y puntitos negros, de perfil. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. Un solo objeto centrado, ocupando cerca del 75 % del lienzo, vista de 3/4 desde arriba, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego. |
| `item-sabalo.png` | C5 · ítem **1109** · `sabalo` → `src/assets/items-gpt/sabalo.png` | Ícono de videojuego en estilo plano (flat) de sábalo. Un sábalo grande plateado de escamas enormes que brillan, la boca hacia arriba y la última aleta dorsal en filamento largo, de perfil. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. Un solo objeto centrado, ocupando cerca del 75 % del lienzo, vista de 3/4 desde arriba, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego. |
| `item-pez_gallo.png` | C5 · ítem **1110** · `pez_gallo` → `src/assets/items-gpt/pez_gallo.png` | Ícono de videojuego en estilo plano (flat) de pez gallo. Un pez gallo de cuerpo plateado dorado con siete espinas largas en la aleta dorsal como cresta de gallo, de perfil. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. Un solo objeto centrado, ocupando cerca del 75 % del lienzo, vista de 3/4 desde arriba, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego. |
| `item-atun.png` | C5 · ítem **1111** · `atun` → `src/assets/items-gpt/atun.png` | Ícono de videojuego en estilo plano (flat) de atún. Un atún aleta amarilla robusto con el lomo azul oscuro, el vientre plateado y las aletas pequeñas amarillas, de perfil. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. Un solo objeto centrado, ocupando cerca del 75 % del lienzo, vista de 3/4 desde arriba, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego. |
| `item-pargo_mancha.png` | C5 · ítem **1112** · `pargo_mancha` → `src/assets/items-gpt/pargo_mancha.png` | Ícono de videojuego en estilo plano (flat) de pargo mancha. Un pargo mancha de cuerpo rojizo con una mancha oscura en el costado y las aletas rosadas, de perfil. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. Un solo objeto centrado, ocupando cerca del 75 % del lienzo, vista de 3/4 desde arriba, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego. |
| `item-langosta.png` | C5 · ítem **1113** · `langosta` → `src/assets/items-gpt/langosta.png` | Ícono de videojuego en estilo plano (flat) de langosta. Una langosta espinosa de color rojo anaranjado con antenas largas y la cola segmentada, vista desde arriba en diagonal. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. Un solo objeto centrado, ocupando cerca del 75 % del lienzo, vista de 3/4 desde arriba, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego. |
| `item-camaron.png` | C5 · ítem **1114** · `camaron` → `src/assets/items-gpt/camaron.png` | Ícono de videojuego en estilo plano (flat) de camarón. Un camarón rosado y curvo con las antenas finas y la cola en abanico, de perfil. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. Un solo objeto centrado, ocupando cerca del 75 % del lienzo, vista de 3/4 desde arriba, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego. |
| `item-piangua.png` | C5 · ítem **1115** · `piangua` → `src/assets/items-gpt/piangua.png` | Ícono de videojuego en estilo plano (flat) de piangua. Dos conchas negras de piangua, una abierta que muestra el interior perlado y otra cerrada, con lodo del manglar pegado. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. Un solo objeto centrado, ocupando cerca del 75 % del lienzo, vista de 3/4 desde arriba, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego. |
| `item-ostion.png` | C5 · ítem **1116** · `ostion` → `src/assets/items-gpt/ostion.png` | Ícono de videojuego en estilo plano (flat) de ostión. Una ostra rugosa de color gris verdoso abierta a medias, con una perlita blanca brillando adentro. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. Un solo objeto centrado, ocupando cerca del 75 % del lienzo, vista de 3/4 desde arriba, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego. |
| `item-sopa_mariscos.png` | C5 · ítem **1117** · `sopa_mariscos` → `src/assets/items-gpt/sopa_mariscos.png` | Ícono de videojuego en estilo plano (flat) de sopa de mariscos. Un plato hondo de barro lleno de sopa de mariscos anaranjada con un camarón, una concha y una rodaja de limón; sale un poquito de vapor. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. Un solo objeto centrado, ocupando cerca del 75 % del lienzo, vista de 3/4 desde arriba, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego. |
| `item-arroz_camarones.png` | C5 · ítem **1118** · `arroz_camarones` → `src/assets/items-gpt/arroz_camarones.png` | Ícono de videojuego en estilo plano (flat) de arroz con camarones. Un plato blanco con arroz amarillento y cinco camarones rosados encima, con culantro picado y un gajo de limón. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. Un solo objeto centrado, ocupando cerca del 75 % del lienzo, vista de 3/4 desde arriba, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego. |
| `item-langosta_gratinada.png` | C5 · ítem **1119** · `langosta_gratinada` → `src/assets/items-gpt/langosta_gratinada.png` | Ícono de videojuego en estilo plano (flat) de langosta gratinada. Media langosta roja abierta en un plato blanco con queso gratinado dorado encima, perejil y una rodaja de limón. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. Un solo objeto centrado, ocupando cerca del 75 % del lienzo, vista de 3/4 desde arriba, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego. |
| `item-pescado_seco.png` | C5 · ítem **1120** · `pescado_seco` → `src/assets/items-gpt/pescado_seco.png` | Ícono de videojuego en estilo plano (flat) de pescado seco. Un pescado abierto y seco de color café claro, colgado de la cola con una cabuya, con cristales de sal. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. Un solo objeto centrado, ocupando cerca del 75 % del lienzo, vista de 3/4 desde arriba, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego. |
| `item-fragmento_coral.png` | C5 · ítem **1121** · `fragmento_coral` → `src/assets/items-gpt/fragmento_coral.png` | Ícono de videojuego en estilo plano (flat) de fragmento de coral. Una ramita de coral cuerno de ciervo de color naranja con puntas rosadas, pequeña, con una cinta azul de cabuya en la base. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. Un solo objeto centrado, ocupando cerca del 75 % del lienzo, vista de 3/4 desde arriba, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego. |
| `item-vela_lona.png` | C5 · ítem **1122** · `vela_lona` → `src/assets/items-gpt/vela_lona.png` | Ícono de videojuego en estilo plano (flat) de vela de lona. Una vela triangular de lona crema remendada con un parche azul, amarrada a un palo corto, con una cabuya. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. Un solo objeto centrado, ocupando cerca del 75 % del lienzo, vista de 3/4 desde arriba, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego. |
| `item-bote_vela.png` | C5 · ítem **1123** · `bote_vela` → `src/assets/items-gpt/bote_vela.png` | Ícono de videojuego en estilo plano (flat) de bote de vela. Un botecito de madera con una vela triangular crema y el casco pintado de azul celeste con una franja blanca, visto de costado. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. Un solo objeto centrado, ocupando cerca del 75 % del lienzo, vista de 3/4 desde arriba, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego. |
| `item-estaca_nido.png` | C5 · ítem **1124** · `estaca_nido` → `src/assets/items-gpt/estaca_nido.png` | Ícono de videojuego en estilo plano (flat) de estaca de nido. Una estaca de madera con una cinta amarilla y una banderita verde en la punta, clavada en un montoncito de arena. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. Un solo objeto centrado, ocupando cerca del 75 % del lienzo, vista de 3/4 desde arriba, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego. |
| `item-banderita_azul.png` | C5 · ítem **1125** · `banderita_azul` → `src/assets/items-gpt/banderita_azul.png` | Ícono de videojuego en estilo plano (flat) de banderita azul. Una banderita azul en un asta de madera corta, con una tortuga marina blanca bordada en el centro; símbolo de playa cuidada. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. Un solo objeto centrado, ocupando cerca del 75 % del lienzo, vista de 3/4 desde arriba, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego. |
| `item-muelle.png` | C5 · bloque **665** · `muelle` → `src/assets/items-gpt/muelle.png` | Ícono de videojuego en estilo plano (flat) de muelle de tablones (bloque). Un tramo corto de muelle de tablones de madera gris salada con clavos visibles y dos pilotes que bajan, visto en 3/4. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. Un solo objeto centrado, ocupando cerca del 75 % del lienzo, vista de 3/4 desde arriba, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego. |
| `item-pilote.png` | C5 · bloque **666** · `pilote` → `src/assets/items-gpt/pilote.png` | Ícono de videojuego en estilo plano (flat) de pilote de amarre (bloque). Un poste grueso de madera oscura con una argolla de hierro y una soga enrollada, con algas secas en la base. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. Un solo objeto centrado, ocupando cerca del 75 % del lienzo, vista de 3/4 desde arriba, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego. |
| `item-boya.png` | C5 · bloque **667** · `boya` → `src/assets/items-gpt/boya.png` | Ícono de videojuego en estilo plano (flat) de boya (bloque). Una boya redonda de plástico rojo y blanco con una argolla arriba y una cuerda corta, brillo en la parte alta. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. Un solo objeto centrado, ocupando cerca del 75 % del lienzo, vista de 3/4 desde arriba, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego. |
| `item-nido_marcado.png` | C5 · bloque **668** · `nido_marcado` → `src/assets/items-gpt/nido_marcado.png` | Ícono de videojuego en estilo plano (flat) de nido protegido (bloque). Un montículo de arena con una estaca de cinta amarilla y una malla de alambre en forma de media luna encima, para cuidar los huevos. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. Un solo objeto centrado, ocupando cerca del 75 % del lienzo, vista de 3/4 desde arriba, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego. |
| `item-vivero_coral.png` | C5 · bloque **669** · `vivero_coral` → `src/assets/items-gpt/vivero_coral.png` | Ícono de videojuego en estilo plano (flat) de vivero de coral (bloque). Un bastidor de tubos blancos con ramitas de coral naranja y rosado amarradas con cabuya, como una mesita de jardín bajo el agua. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. Un solo objeto centrado, ocupando cerca del 75 % del lienzo, vista de 3/4 desde arriba, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego. |
| `item-secadero.png` | C5 · bloque **670** · `secadero` → `src/assets/items-gpt/secadero.png` | Ícono de videojuego en estilo plano (flat) de secadero de pescado (bloque). Un bastidor de madera con tres pescados abiertos colgando de cabuya y una canasta de sal gruesa al pie. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. Un solo objeto centrado, ocupando cerca del 75 % del lienzo, vista de 3/4 desde arriba, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego. |
| `item-pecera.png` | C5 · bloque **671** · `pecera` → `src/assets/items-gpt/pecera.png` | Ícono de videojuego en estilo plano (flat) de pecera (bloque). Una pecera de vidrio con marco de madera, agua celeste, arena, una plantita verde y dos pececitos de colores. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. Un solo objeto centrado, ocupando cerca del 75 % del lienzo, vista de 3/4 desde arriba, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego. |
| `item-cabuya.png` | C5 · ítem **1126** · `cabuya` → `src/assets/items-gpt/cabuya.png` | Ícono de videojuego en estilo plano (flat) de cabuya. Un rollo de cabuya, una soga fina de fibra color paja con una punta suelta y deshilachada. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. Un solo objeto centrado, ocupando cerca del 75 % del lienzo, vista de 3/4 desde arriba, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego. |
| `item-coral_blanco.png` | C5 · bloque **697** · `coral_blanco` → `src/assets/items-gpt/coral_blanco.png` | Ícono de videojuego en estilo plano (flat) de coral blanco (bloque). Un cubo de coral blanqueado de color blanco hueso, apagado y quebradizo, con ramitas muertas. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. Un solo objeto centrado, ocupando cerca del 75 % del lienzo, vista de 3/4 desde arriba, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego. |
| `item-serrucho.png` | C6 · ítem **1130** · `serrucho` → `src/assets/items-gpt/serrucho.png` | Ícono de videojuego en estilo plano (flat) de serrucho. Un serrucho de hoja de acero gris con dientes marcados y el mango de madera café con un agujero para los dedos; en diagonal. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. Un solo objeto centrado, ocupando cerca del 75 % del lienzo, vista de 3/4 desde arriba, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego. |
| `item-cepillo.png` | C6 · ítem **1131** · `cepillo` → `src/assets/items-gpt/cepillo.png` | Ícono de videojuego en estilo plano (flat) de cepillo de carpintero. Un cepillo de carpintero de madera clara con la cuchilla de hierro asomando abajo y una virutita rizada saliendo. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. Un solo objeto centrado, ocupando cerca del 75 % del lienzo, vista de 3/4 desde arriba, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego. |
| `item-formon.png` | C6 · ítem **1132** · `formon` → `src/assets/items-gpt/formon.png` | Ícono de videojuego en estilo plano (flat) de formón. Un formón de hoja de acero con el filo biselado y el mango de madera con un aro de latón; en diagonal. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. Un solo objeto centrado, ocupando cerca del 75 % del lienzo, vista de 3/4 desde arriba, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego. |
| `item-martillo_forja.png` | C6 · ítem **1133** · `martillo_forja` → `src/assets/items-gpt/martillo_forja.png` | Ícono de videojuego en estilo plano (flat) de martillo de forja. Un martillo de herrero de cabeza cuadrada de hierro oscuro con el mango de madera gruesa; en diagonal. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. Un solo objeto centrado, ocupando cerca del 75 % del lienzo, vista de 3/4 desde arriba, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego. |
| `item-tenazas.png` | C6 · ítem **1134** · `tenazas` → `src/assets/items-gpt/tenazas.png` | Ícono de videojuego en estilo plano (flat) de tenazas. Unas tenazas largas de hierro oscuro sujetando un trozo de hierro al rojo vivo en la punta; en diagonal. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. Un solo objeto centrado, ocupando cerca del 75 % del lienzo, vista de 3/4 desde arriba, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego. |
| `item-clavos.png` | C6 · ítem **1135** · `clavos` → `src/assets/items-gpt/clavos.png` | Ícono de videojuego en estilo plano (flat) de clavos. Un montoncito de seis clavos de hierro oscuro con la cabeza plana, algunos cruzados, y un reflejo claro en el metal. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. Un solo objeto centrado, ocupando cerca del 75 % del lienzo, vista de 3/4 desde arriba, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego. |
| `item-bisagras.png` | C6 · ítem **1136** · `bisagras` → `src/assets/items-gpt/bisagras.png` | Ícono de videojuego en estilo plano (flat) de bisagras. Un par de bisagras de hierro negro forjado, con la forma de media hoja de ciprés y los tornillos con cabeza redonda. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. Un solo objeto centrado, ocupando cerca del 75 % del lienzo, vista de 3/4 desde arriba, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego. |
| `item-mango.png` | C6 · ítem **1137** · `mango` → `src/assets/items-gpt/mango.png` | Ícono de videojuego en estilo plano (flat) de mango de madera. Un mango largo y liso de madera clara con una veta suave y el extremo más grueso redondeado. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. Un solo objeto centrado, ocupando cerca del 75 % del lienzo, vista de 3/4 desde arriba, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego. |
| `item-tabla_fina.png` | C6 · ítem **1138** · `tabla_fina` → `src/assets/items-gpt/tabla_fina.png` | Ícono de videojuego en estilo plano (flat) de tabla fina. Una tabla de madera clara cepillada y lisa con una veta delicada y una virutita enrollada al lado. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. Un solo objeto centrado, ocupando cerca del 75 % del lienzo, vista de 3/4 desde arriba, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego. |
| `item-barro_amasado.png` | C6 · ítem **1139** · `barro_amasado` → `src/assets/items-gpt/barro_amasado.png` | Ícono de videojuego en estilo plano (flat) de barro amasado. Un bollo de barro rojizo amasado y húmedo, con la huella de unos dedos y un poco de agua brillando. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. Un solo objeto centrado, ocupando cerca del 75 % del lienzo, vista de 3/4 desde arriba, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego. |
| `item-engobe_rojo.png` | C6 · ítem **1140** · `engobe_rojo` → `src/assets/items-gpt/engobe_rojo.png` | Ícono de videojuego en estilo plano (flat) de engobe rojo. Un cuenco pequeño de barro lleno de pintura arcillosa rojo ladrillo con un pincel fino apoyado. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. Un solo objeto centrado, ocupando cerca del 75 % del lienzo, vista de 3/4 desde arriba, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego. |
| `item-engobe_negro.png` | C6 · ítem **1141** · `engobe_negro` → `src/assets/items-gpt/engobe_negro.png` | Ícono de videojuego en estilo plano (flat) de engobe negro. Un cuenco pequeño de barro lleno de pintura arcillosa negra brillante con un pincel fino apoyado. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. Un solo objeto centrado, ocupando cerca del 75 % del lienzo, vista de 3/4 desde arriba, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego. |
| `item-engobe_crema.png` | C6 · ítem **1142** · `engobe_crema` → `src/assets/items-gpt/engobe_crema.png` | Ícono de videojuego en estilo plano (flat) de engobe crema. Un cuenco pequeño de barro lleno de pintura arcillosa color crema con un pincel fino apoyado. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. Un solo objeto centrado, ocupando cerca del 75 % del lienzo, vista de 3/4 desde arriba, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego. |
| `item-herradura.png` | C6 · ítem **1143** · `herradura` → `src/assets/items-gpt/herradura.png` | Ícono de videojuego en estilo plano (flat) de herradura. Una herradura de hierro con los siete agujeros de los clavos, de forma de U, brillo en la curva. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. Un solo objeto centrado, ocupando cerca del 75 % del lienzo, vista de 3/4 desde arriba, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego. |
| `item-candado.png` | C6 · ítem **1144** · `candado` → `src/assets/items-gpt/candado.png` | Ícono de videojuego en estilo plano (flat) de candado. Un candado grande de hierro negro con el arco de acero y una llave antigua colgando de un cordón. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. Un solo objeto centrado, ocupando cerca del 75 % del lienzo, vista de 3/4 desde arriba, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego. |
| `item-olla_barro.png` | C6 · ítem **1145** · `olla_barro` → `src/assets/items-gpt/olla_barro.png` | Ícono de videojuego en estilo plano (flat) de olla de barro. Una olla de barro rojizo de panza ancha con dos asas pequeñas y la boca con un borde más oscuro. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. Un solo objeto centrado, ocupando cerca del 75 % del lienzo, vista de 3/4 desde arriba, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego. |
| `item-comal.png` | C6 · ítem **1146** · `comal` → `src/assets/items-gpt/comal.png` | Ícono de videojuego en estilo plano (flat) de comal. Un comal redondo de barro café oscuro, liso y plano, con una tortilla de maíz doradita encima. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. Un solo objeto centrado, ocupando cerca del 75 % del lienzo, vista de 3/4 desde arriba, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego. |
| `item-vajilla_chorotega.png` | C6 · ítem **1147** · `vajilla_chorotega` → `src/assets/items-gpt/vajilla_chorotega.png` | Ícono de videojuego en estilo plano (flat) de vajilla chorotega. Un plato y una taza de cerámica pintada a mano, fondo crema con dibujos geométricos en rojo ladrillo y negro, inspirados en la cerámica chorotega. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. Un solo objeto centrado, ocupando cerca del 75 % del lienzo, vista de 3/4 desde arriba, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego. |
| `item-cayuco.png` | C6 · ítem **1148** · `cayuco` → `src/assets/items-gpt/cayuco.png` | Ícono de videojuego en estilo plano (flat) de cayuco. Una canoa larga hecha de un solo tronco ahuecado de madera café, vista de costado, con un remo apoyado dentro. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. Un solo objeto centrado, ocupando cerca del 75 % del lienzo, vista de 3/4 desde arriba, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego. |
| `item-yugo.png` | C6 · ítem **1149** · `yugo` → `src/assets/items-gpt/yugo.png` | Ícono de videojuego en estilo plano (flat) de yugo. Un yugo de madera tallada y pintada con motivos sencillos en rojo y azul, con dos argollas de cuero a los lados. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. Un solo objeto centrado, ocupando cerca del 75 % del lienzo, vista de 3/4 desde arriba, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego. |
| `item-libro_carpinteria.png` | C6 · ítem **1150** · `libro_carpinteria` → `src/assets/items-gpt/libro_carpinteria.png` | Ícono de videojuego en estilo plano (flat) de libro de carpintería. Un libro grueso de tapas de cuero café con un serrucho dorado grabado en la portada y una cinta marcapáginas. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. Un solo objeto centrado, ocupando cerca del 75 % del lienzo, vista de 3/4 desde arriba, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego. |
| `item-libro_herreria.png` | C6 · ítem **1151** · `libro_herreria` → `src/assets/items-gpt/libro_herreria.png` | Ícono de videojuego en estilo plano (flat) de libro de herrería. Un libro grueso de tapas de cuero gris oscuro con un martillo dorado grabado en la portada y una cinta marcapáginas. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. Un solo objeto centrado, ocupando cerca del 75 % del lienzo, vista de 3/4 desde arriba, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego. |
| `item-libro_alfareria.png` | C6 · ítem **1152** · `libro_alfareria` → `src/assets/items-gpt/libro_alfareria.png` | Ícono de videojuego en estilo plano (flat) de libro de alfarería. Un libro grueso de tapas de cuero rojizo con una vasija dorada grabada en la portada y una cinta marcapáginas. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. Un solo objeto centrado, ocupando cerca del 75 % del lienzo, vista de 3/4 desde arriba, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego. |
| `item-sello_maestro.png` | C6 · ítem **1153** · `sello_maestro` → `src/assets/items-gpt/sello_maestro.png` | Ícono de videojuego en estilo plano (flat) de sello de maestro. Un sello de mango de madera con la base de metal dorado grabada con una estrella de cuatro puntas, junto a una gota de lacre rojo. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. Un solo objeto centrado, ocupando cerca del 75 % del lienzo, vista de 3/4 desde arriba, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego. |
| `item-banco_carpintero.png` | C6 · bloque **672** · `banco_carpintero` → `src/assets/items-gpt/banco_carpintero.png` | Ícono de videojuego en estilo plano (flat) de banco de carpintero (bloque). Un banco de carpintero de madera clara con un tornillo de banco de hierro en una esquina y un serrucho y un cepillo encima. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. Un solo objeto centrado, ocupando cerca del 75 % del lienzo, vista de 3/4 desde arriba, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego. |
| `item-fragua.png` | C6 · bloque **673** · `fragua` → `src/assets/items-gpt/fragua.png` | Ícono de videojuego en estilo plano (flat) de fragua (bloque). Una fragua de piedra gris con el fuego naranja brillando adentro, un fuelle de cuero a un lado y un yunque pequeño al frente. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. Un solo objeto centrado, ocupando cerca del 75 % del lienzo, vista de 3/4 desde arriba, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego. |
| `item-torno_alfarero.png` | C6 · bloque **674** · `torno_alfarero` → `src/assets/items-gpt/torno_alfarero.png` | Ícono de videojuego en estilo plano (flat) de torno de alfarero (bloque). Un torno de alfarero de madera con una rueda baja y una pieza de barro rojizo girando encima, con un cuenco de agua al lado. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. Un solo objeto centrado, ocupando cerca del 75 % del lienzo, vista de 3/4 desde arriba, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego. |
| `item-horno_barro.png` | C6 · bloque **675** · `horno_barro` → `src/assets/items-gpt/horno_barro.png` | Ícono de videojuego en estilo plano (flat) de horno de barro (bloque). Un horno de barro en forma de cúpula con una boca arqueada donde brilla el fuego naranja y una chimenea chica arriba. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. Un solo objeto centrado, ocupando cerca del 75 % del lienzo, vista de 3/4 desde arriba, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego. |
| `item-alacena.png` | C6 · bloque **676** · `alacena` → `src/assets/items-gpt/alacena.png` | Ícono de videojuego en estilo plano (flat) de alacena (bloque). Una alacena de madera pintada de verde menta con dos puertas de listones, a través de los listones se ven frascos y panes. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. Un solo objeto centrado, ocupando cerca del 75 % del lienzo, vista de 3/4 desde arriba, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego. |
| `item-armario.png` | C6 · bloque **677** · `armario` → `src/assets/items-gpt/armario.png` | Ícono de videojuego en estilo plano (flat) de armario (bloque). Un armario alto de madera café oscura con dos puertas talladas con un rombo y una perilla de latón. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. Un solo objeto centrado, ocupando cerca del 75 % del lienzo, vista de 3/4 desde arriba, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego. |
| `item-mesa_grande.png` | C6 · bloque **678** · `mesa_grande` → `src/assets/items-gpt/mesa_grande.png` | Ícono de videojuego en estilo plano (flat) de mesa grande (bloque). Una mesa larga de madera maciza con patas torneadas y un mantel corrido a cuadros rojos y blancos con una olla encima. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. Un solo objeto centrado, ocupando cerca del 75 % del lienzo, vista de 3/4 desde arriba, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego. |
| `item-tinaja.png` | C6 · bloque **679** · `tinaja` → `src/assets/items-gpt/tinaja.png` | Ícono de videojuego en estilo plano (flat) de tinaja (bloque). Una tinaja grande de barro rojizo con la boca tapada con una tabla redonda y una jícara colgando de un clavo. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. Un solo objeto centrado, ocupando cerca del 75 % del lienzo, vista de 3/4 desde arriba, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego. |
| `item-mostrador.png` | C6 · bloque **680** · `mostrador` → `src/assets/items-gpt/mostrador.png` | Ícono de videojuego en estilo plano (flat) de mostrador (bloque). Un mostrador corto de madera con un toldito de rayas rojas y crema y tres productos puestos encima con sus precios en tarjetitas sin letras. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. Un solo objeto centrado, ocupando cerca del 75 % del lienzo, vista de 3/4 desde arriba, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego. |
| `item-jarron_chorotega.png` | C6 · bloque **681** · `jarron_chorotega` → `src/assets/items-gpt/jarron_chorotega.png` | Ícono de videojuego en estilo plano (flat) de jarrón chorotega (bloque). Un jarrón de cerámica con asa, fondo crema pintado con dibujos geométricos negros y rojo ladrillo, inspirado en la cerámica chorotega. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. Un solo objeto centrado, ocupando cerca del 75 % del lienzo, vista de 3/4 desde arriba, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego. |
| `item-puerta_tallada.png` | C6 · bloque **682** · `puerta_tallada` → `src/assets/items-gpt/puerta_tallada.png` | Ícono de videojuego en estilo plano (flat) de puerta tallada (bloque). Una puerta de madera oscura con un sol tallado en el centro, bisagras de hierro negro y una aldaba redonda. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. Un solo objeto centrado, ocupando cerca del 75 % del lienzo, vista de 3/4 desde arriba, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego. |
| `item-verja_forjada.png` | C6 · bloque **683** · `verja_forjada` → `src/assets/items-gpt/verja_forjada.png` | Ícono de videojuego en estilo plano (flat) de verja forjada (bloque). Un tramo de reja de hierro forjado negro con barrotes terminados en punta de lanza y una espiral en el centro. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. Un solo objeto centrado, ocupando cerca del 75 % del lienzo, vista de 3/4 desde arriba, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego. |
| `item-farol_forjado.png` | C6 · bloque **684** · `farol_forjado` → `src/assets/items-gpt/farol_forjado.png` | Ícono de videojuego en estilo plano (flat) de farol forjado (bloque). Un farol de calle de hierro negro con una espiral en el brazo y una luz cálida amarilla adentro. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. Un solo objeto centrado, ocupando cerca del 75 % del lienzo, vista de 3/4 desde arriba, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego. |
| `item-lasca_obsidiana.png` | C7 · ítem **1160** · `lasca_obsidiana` → `src/assets/items-gpt/lasca_obsidiana.png` | Ícono de videojuego en estilo plano (flat) de lasca de obsidiana. Una lasca puntiaguda de obsidiana negra brillante con un reflejo azul violáceo en el filo. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. Un solo objeto centrado, ocupando cerca del 75 % del lienzo, vista de 3/4 desde arriba, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego. |
| `item-cuchillo_obsidiana.png` | C7 · ítem **1161** · `cuchillo_obsidiana` → `src/assets/items-gpt/cuchillo_obsidiana.png` | Ícono de videojuego en estilo plano (flat) de cuchillo de obsidiana. Un cuchillo de hoja de obsidiana negra brillante con el mango de madera amarrado con cabuya; en diagonal. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. Un solo objeto centrado, ocupando cerca del 75 % del lienzo, vista de 3/4 desde arriba, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego. |
| `item-cristal_azufre.png` | C7 · ítem **1162** · `cristal_azufre` → `src/assets/items-gpt/cristal_azufre.png` | Ícono de videojuego en estilo plano (flat) de cristal de azufre. Un racimo de cristales amarillo limón de azufre, puntiagudos y translúcidos, con un poquito de polvo amarillo en la base. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. Un solo objeto centrado, ocupando cerca del 75 % del lienzo, vista de 3/4 desde arriba, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego. |
| `item-piedra_pomez.png` | C7 · ítem **1163** · `piedra_pomez` → `src/assets/items-gpt/piedra_pomez.png` | Ícono de videojuego en estilo plano (flat) de piedra pómez. Una piedra pómez gris clara llena de agujeritos redondeados, liviana, con un brillo suave en lo alto. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. Un solo objeto centrado, ocupando cerca del 75 % del lienzo, vista de 3/4 desde arriba, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego. |
| `item-ceniza_fertil.png` | C7 · ítem **1164** · `ceniza_fertil` → `src/assets/items-gpt/ceniza_fertil.png` | Ícono de videojuego en estilo plano (flat) de ceniza fértil. Una bolsita de manta gris atada con cabuya, medio abierta, con ceniza fina y oscura derramándose. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. Un solo objeto centrado, ocupando cerca del 75 % del lienzo, vista de 3/4 desde arriba, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego. |
| `item-huevo_termal.png` | C7 · ítem **1165** · `huevo_termal` → `src/assets/items-gpt/huevo_termal.png` | Ícono de videojuego en estilo plano (flat) de huevo de aguas termales. Un huevo cocido a medio pelar con la clara blanca y una pizca de sal volcánica, junto a un chorrito de vapor. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. Un solo objeto centrado, ocupando cerca del 75 % del lienzo, vista de 3/4 desde arriba, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego. |
| `item-sismograma.png` | C7 · ítem **1166** · `sismograma` → `src/assets/items-gpt/sismograma.png` | Ícono de videojuego en estilo plano (flat) de sismograma. Una tira de papel crema con una línea de aguja negra que se agita en picos, enrollada en un extremo. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. Un solo objeto centrado, ocupando cerca del 75 % del lienzo, vista de 3/4 desde arriba, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego. |
| `item-casco_minero.png` | C7 · ítem **1167** · `casco_minero` → `src/assets/items-gpt/casco_minero.png` | Ícono de videojuego en estilo plano (flat) de casco de espeleólogo. Un casco de cuero y metal amarillo con una linterna redonda al frente que ilumina con un halo cálido. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. Un solo objeto centrado, ocupando cerca del 75 % del lienzo, vista de 3/4 desde arriba, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego. |
| `item-botas_ceniza.png` | C7 · ítem **1168** · `botas_ceniza` → `src/assets/items-gpt/botas_ceniza.png` | Ícono de videojuego en estilo plano (flat) de botas de ceniza. Un par de botas de cuero grueso gris ceniza con suelas altas de goma y refuerzos de metal en la punta. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. Un solo objeto centrado, ocupando cerca del 75 % del lienzo, vista de 3/4 desde arriba, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego. |
| `item-pase_termales.png` | C7 · ítem **1169** · `pase_termales` → `src/assets/items-gpt/pase_termales.png` | Ícono de videojuego en estilo plano (flat) de pase a los termales. Un boleto de papel crema con una orilla ondulada y un dibujo azul de aguas con vapor, con un sello redondo verde. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. Un solo objeto centrado, ocupando cerca del 75 % del lienzo, vista de 3/4 desde arriba, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego. |
| `item-muestra_volcanica.png` | C7 · ítem **1170** · `muestra_volcanica` → `src/assets/items-gpt/muestra_volcanica.png` | Ícono de videojuego en estilo plano (flat) de muestra volcánica. Un frasquito de vidrio con tapón de corcho lleno de piedritas negras y rojizas y una etiqueta de cabuya. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. Un solo objeto centrado, ocupando cerca del 75 % del lienzo, vista de 3/4 desde arriba, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego. |
| `item-fumarola.png` | C7 · bloque **685** · `fumarola` → `src/assets/items-gpt/fumarola.png` | Ícono de videojuego en estilo plano (flat) de fumarola (bloque). Una grieta en roca gris con costras amarillas de azufre de la que sale una columnita de vapor blanco. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. Un solo objeto centrado, ocupando cerca del 75 % del lienzo, vista de 3/4 desde arriba, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego. |
| `item-sismografo.png` | C7 · bloque **686** · `sismografo` → `src/assets/items-gpt/sismografo.png` | Ícono de videojuego en estilo plano (flat) de sismógrafo (bloque). Un sismógrafo de caja de madera con un tambor de papel y una aguja negra que dibuja una línea en zigzag, sobre un trípode. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. Un solo objeto centrado, ocupando cerca del 75 % del lienzo, vista de 3/4 desde arriba, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego. |
| `item-tierra_volcanica.png` | C7 · bloque **687** · `tierra_volcanica` → `src/assets/items-gpt/tierra_volcanica.png` | Ícono de videojuego en estilo plano (flat) de tierra volcánica (bloque). Un cubo de tierra negra y suelta con brotes verdes y un poquito de ceniza gris encima. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. Un solo objeto centrado, ocupando cerca del 75 % del lienzo, vista de 3/4 desde arriba, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego. |
| `item-aguas_termales.png` | C7 · bloque **688** · `aguas_termales` → `src/assets/items-gpt/aguas_termales.png` | Ícono de videojuego en estilo plano (flat) de aguas termales (bloque). Un cubo de agua celeste turquesa humeante con una orilla de piedras claras y un chorrito de vapor. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. Un solo objeto centrado, ocupando cerca del 75 % del lienzo, vista de 3/4 desde arriba, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego. |
| `item-cristal_azufre_bloque.png` | C7 · bloque **689** · `cristal_azufre_bloque` → `src/assets/items-gpt/cristal_azufre_bloque.png` | Ícono de videojuego en estilo plano (flat) de cristales de azufre (bloque). Un cubo de roca gris con un racimo grande de cristales amarillo limón creciendo en una cara. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. Un solo objeto centrado, ocupando cerca del 75 % del lienzo, vista de 3/4 desde arriba, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego. |
| `item-veta_obsidiana.png` | C7 · bloque **690** · `veta_obsidiana` → `src/assets/items-gpt/veta_obsidiana.png` | Ícono de videojuego en estilo plano (flat) de veta de obsidiana (bloque). Un cubo de roca oscura con una veta de obsidiana negra brillante que refleja una luz violeta. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. Un solo objeto centrado, ocupando cerca del 75 % del lienzo, vista de 3/4 desde arriba, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego. |
| `item-pomez_bloque.png` | C7 · bloque **691** · `pomez_bloque` → `src/assets/items-gpt/pomez_bloque.png` | Ícono de videojuego en estilo plano (flat) de bloque de pómez (bloque). Un cubo de piedra pómez gris clara lleno de agujeritos, parece liviano. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. Un solo objeto centrado, ocupando cerca del 75 % del lienzo, vista de 3/4 desde arriba, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego. |
| `item-tambor_cimarrona.png` | C8 · ítem **1180** · `tambor_cimarrona` → `src/assets/items-gpt/tambor_cimarrona.png` | Ícono de videojuego en estilo plano (flat) de tambor de cimarrona. Un tambor redondo de cimarrona de aros metálicos y parche crema, con una correa roja y dos baquetas cruzadas. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. Un solo objeto centrado, ocupando cerca del 75 % del lienzo, vista de 3/4 desde arriba, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego. |
| `item-trompeta.png` | C8 · ítem **1181** · `trompeta` → `src/assets/items-gpt/trompeta.png` | Ícono de videojuego en estilo plano (flat) de trompeta. Una trompeta de latón dorado con tres pistones y la campana ancha, con un reflejo largo en la curva; en diagonal. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. Un solo objeto centrado, ocupando cerca del 75 % del lienzo, vista de 3/4 desde arriba, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego. |
| `item-mascara_giganta.png` | C8 · ítem **1182** · `mascara_giganta` → `src/assets/items-gpt/mascara_giganta.png` | Ícono de videojuego en estilo plano (flat) de máscara de giganta. Una máscara de mascarada de rostro de mujer grande de cartón pintado, mejillas rosadas, labios rojos y un lunar, con un pañuelo florido. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. Un solo objeto centrado, ocupando cerca del 75 % del lienzo, vista de 3/4 desde arriba, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego. |
| `item-mascara_calavera.png` | C8 · ítem **1183** · `mascara_calavera` → `src/assets/items-gpt/mascara_calavera.png` | Ícono de videojuego en estilo plano (flat) de máscara de calavera. Una máscara de calavera sonriente de cartón blanco con las cuencas negras y flores de colores pintadas en la frente. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. Un solo objeto centrado, ocupando cerca del 75 % del lienzo, vista de 3/4 desde arriba, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego. |
| `item-mascara_diablo.png` | C8 · ítem **1184** · `mascara_diablo` → `src/assets/items-gpt/mascara_diablo.png` | Ícono de videojuego en estilo plano (flat) de máscara de diablo. Una máscara de diablo de fiesta de cartón rojo con cuernos curvos, bigote negro y una sonrisa traviesa, sin nada aterrador. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. Un solo objeto centrado, ocupando cerca del 75 % del lienzo, vista de 3/4 desde arriba, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego. |
| `item-banda_mayordomo.png` | C8 · ítem **1185** · `banda_mayordomo` → `src/assets/items-gpt/banda_mayordomo.png` | Ícono de videojuego en estilo plano (flat) de banda de mayordomo. Una banda de tela azul y blanca de mayordomo cruzada, con un rosetón dorado y flecos en la punta. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. Un solo objeto centrado, ocupando cerca del 75 % del lienzo, vista de 3/4 desde arriba, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego. |
| `item-vela_novena.png` | C8 · ítem **1186** · `vela_novena` → `src/assets/items-gpt/vela_novena.png` | Ícono de videojuego en estilo plano (flat) de vela de la novena. Una vela blanca gruesa en un platito de barro con una llama pequeña amarilla y una estampita del santo atada con cabuya. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. Un solo objeto centrado, ocupando cerca del 75 % del lienzo, vista de 3/4 desde arriba, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego. |
| `item-libro_encargos.png` | C8 · ítem **1187** · `libro_encargos` → `src/assets/items-gpt/libro_encargos.png` | Ícono de videojuego en estilo plano (flat) de libro de encargos. Una libreta de tapas de cuero café con una cinta roja y tres hojitas sobresaliendo con puntos de colores. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. Un solo objeto centrado, ocupando cerca del 75 % del lienzo, vista de 3/4 desde arriba, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego. |
| `item-sello_comite.png` | C8 · ítem **1188** · `sello_comite` → `src/assets/items-gpt/sello_comite.png` | Ícono de videojuego en estilo plano (flat) de sello del comité de caminos. Un sello de goma con mango de madera y la base redonda con un camino que se bifurca y una campanita, junto a una gota de tinta azul. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. Un solo objeto centrado, ocupando cerca del 75 % del lienzo, vista de 3/4 desde arriba, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego. |
| `item-pase_caminos.png` | C8 · ítem **1189** · `pase_caminos` → `src/assets/items-gpt/pase_caminos.png` | Ícono de videojuego en estilo plano (flat) de pase de los caminos. Una tarjeta de cartulina verde con una franja dorada y un dibujo de una carreta y un camino, con una cuerdita para colgarla. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. Un solo objeto centrado, ocupando cerca del 75 % del lienzo, vista de 3/4 desde arriba, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego. |
| `item-tablon_encargos.png` | C8 · bloque **692** · `tablon_encargos` → `src/assets/items-gpt/tablon_encargos.png` | Ícono de videojuego en estilo plano (flat) de tablón de encargos (bloque). Un tablón de madera con tres papelitos clavados de colores y un cartelito en el medio, con un techito de teja encima. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. Un solo objeto centrado, ocupando cerca del 75 % del lienzo, vista de 3/4 desde arriba, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego. |
| `item-estandarte_santo.png` | C8 · bloque **693** · `estandarte_santo` → `src/assets/items-gpt/estandarte_santo.png` | Ícono de videojuego en estilo plano (flat) de estandarte del santo (bloque). Un estandarte de tela azul con una estrella dorada y flecos, colgado de un asta de madera con una cinta blanca. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. Un solo objeto centrado, ocupando cerca del 75 % del lienzo, vista de 3/4 desde arriba, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego. |
| `item-tarima.png` | C8 · bloque **694** · `tarima` → `src/assets/items-gpt/tarima.png` | Ícono de videojuego en estilo plano (flat) de tarima (bloque). Una tarima baja de tablones de madera con escalones al frente y una guirnalda de banderines de colores. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. Un solo objeto centrado, ocupando cerca del 75 % del lienzo, vista de 3/4 desde arriba, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego. |
| `item-arco_fiesta.png` | C8 · bloque **695** · `arco_fiesta` → `src/assets/items-gpt/arco_fiesta.png` | Ícono de videojuego en estilo plano (flat) de arco de fiesta (bloque). Un arco de guirnaldas de banderines de colores y faroles de papel colgando entre dos postes de madera. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. Un solo objeto centrado, ocupando cerca del 75 % del lienzo, vista de 3/4 desde arriba, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego. |
| `item-mojon_camino.png` | C8 · bloque **696** · `mojon_camino` → `src/assets/items-gpt/mojon_camino.png` | Ícono de videojuego en estilo plano (flat) de mojón del camino (bloque). Un mojón de piedra blanca con una franja azul y un número, como los de las carreteras, y una flechita grabada. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. Un solo objeto centrado, ocupando cerca del 75 % del lienzo, vista de 3/4 desde arriba, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego. |

**Conteo:** 105 pedidos (72 ítems y 33 bloques). Los íconos se verifican con la lista de `PEDIDOS_ARTE_LOTE1.md` §4 y se conectan por la carpeta `items-gpt` de ese mismo documento (§5); la constructora agrega las claves a `ARTE` (`blocks.js`) al conectarlos.

---

## Pedidos de sonido (para la constructora; solo CC0 de Freesound, como el resto)

| Archivo | Tanda | Para qué | Notas |
|---|---|---|---|
| `loop.cimarrona` (+ `cimarrona.golpe`, `cimarrona.nota`) | C8-B | la banda de la fiesta patronal; el redoblante y la trompeta sueltos para tocar con ella | una marcha de metales y percusión de 30–60 s en lazo; **lo más importante de la fiesta** |
| `fragua.martillo`, `fragua.fuelle` | C6 | martilleo sobre hierro y el fuelle | 2 golpes y 1 resoplido |
| `torno.giro`, `horno.crepitar` | C6 | el torno de alfarero y el horno de barro | un lazo corto cada uno |
| `fumarola.vapor`, `sismo.retumbo` | C7 | la fumarola y el aviso de erupción | un siseo y un retumbo grave |
| `tortuguita.pasos` | C5-B | las tortuguitas en la arena | muy bajito |

## Resumen de riesgos transversales

| Tanda | Balance / plata | Rendimiento | Guardado |
|---|---|---|---|
| **0** (ids + versión mínima) | — | nada | **`meta.minVersion`** (campo nuevo) para que un juego viejo **no abra** un mundo con ids nuevos |
| **C8-A** | **40 u/día de tope**, cupo 30 u del comprador; la fórmula respeta `precios.js` y la regla de oro | `valorRef` y el tablón se calculan **una vez al día por pueblo** | `meta.encargos2` y `meta.repPueblo` (ya existe) |
| **C5** | **Techo de 1.6 jornadas/día** de pesca a máxima destreza; cupo del pescador de 30 u; conservación ≤ 12 u por arribada | nidos ≤ 12 y tortuguitas ≤ 80 vivas; `fishLoot` **conserva** el comportamiento de hoy si no recibe zona | `meta.pesca` (libro del pescador y récords) |
| **C6** | **Techo de 2 jornadas/día** en nivel 10 con mostrador; la inversión inicial (≈ 70 u) se recupera en 3–4 días | 1 comprador por 90 s por pueblo cargado | `meta.oficios` (nivel y XP por oficio) y los **mostradores** (en la entidad de bloque) |
| **C8-C** | **200 u de premio una vez** (frente a ≈ 80 u de materiales); mercado regional con cupo de 20 u por producto y día | solo se calculan los pueblos de la misión | `meta.comite` (etapa, pueblos, mojones) |
| **C7** | **No es plata diaria**: 70 u la red sísmica (una vez), ≈ 15 u/día en muestras, 60 u por evacuación cada ≈ 25 días | **la generación de mundo es lo único pesado** (3–5 tubos por mundo); la erupción dura 4 minutos | `meta.volcan` (sismógrafos y última erupción); **`genVersion` nueva** para las cuevas |
| **C8-B** | mayordomía = **gasto de 60 u**, no ganancia | **1 cimarrona activa a la vez**, 6 NPC | `meta.fiestas` (velas de la novena, mayordomo) |

**Sin `SAVE_FORMAT`** en ninguna (todo opcional con `??`), **salvo** que `genVersion` suba para C7 (eso ya lo maneja el generador sin romper mundos viejos).

**Orden de construcción sugerido** (el de la sección 0.5): **0 → C8-A → C5-B → C5-A → C6 → C8-C → C7 → C8-B.** Cada tanda: `revisar-recetas` y `revisar-nombres` en 0, `revisar-plata` y `bot-economia` si toca plata (**agregar los perfiles «pescador» y «artesano»** a `bot-economia.js`), la libreta y la ayuda al día, y **una captura de cada pantalla nueva** en `docs/capturas/<versión>/`.

## Lo que queda fuera (para otra vuelta)

- **Agua nueva y postproceso:** los gráficos de Alto y Ultra.
- **Multijugador:** ninguna de las cuatro tandas usa mensajes de red; los mostradores, los encargos y la fiesta quedan **del anfitrión** y se pueden compartir después sin cambios de diseño.
- **Ganadería con bueyes y molienda de verano** (pendientes de C4): se pueden sumar a C6 (el yugo ya se hace ahí).
- **El «Gran Comité» de varios jugadores:** la misión de C8-C es de uno; la versión cooperativa va con el multijugador.

*Escrito por la sesión investigadora. Solo diseño: no se corrió el juego; los números marcados 📏 hay que medirlos, y lo marcado 👁 depende de que nanoyackson lo juegue.*
