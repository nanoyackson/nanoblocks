# Diseño de contenido C1–C4

Pedido: encargo 14 de la orquestadora, sección 6 de `docs/COLA_DE_TRABAJO.md`. Estado base: `v11.11.0`. **Solo diseño**: no se editó código ni se corrió el juego. Lo que sale del código lleva archivo y función (las líneas se mueven); las recetas se revisaron **contra las 251 recetas reales** (se imprimieron con un script de Node sobre el `HEAD`, con patrón e ingredientes). **«👁» = nanoyackson debería probarlo jugando.** Los precios están en **unidades de `precios.js`** (cada una vale ₡500; una jornada son 25 unidades = ₡12 500; la comida del día son 17).

**Lo más importante para no duplicar** (hallado al leer el código y `ARBOL_CONOCIMIENTO.md`): ya existen el **trapiche** con su caña y su tapa de dulce, el **fogón de leña** (el `stove`, estación de cocina con las recetas `[horno]`), la **fogata**, la **hamaca**, la **silla**, la **carreta con bueyes** pintada de Sarchí, el **perro zaguate**, la **cogida de café por cajuela**, el **beneficio**, la **feria del agricultor** (como estructura), el `adobe` y la `teja`, los **platos servidos**, las **hierbas medicinales** y las **estaciones** (`g.season`: verano e invierno, cada 7 días). Cada tanda **profundiza** eso; casi nada se hace desde cero.

**Reserva de ids** (para que no choque con lo de jefes y final): **ítems 561–585** para C1–C4 (la brecha 560–599 de `blocks.js` está libre; **586–599 quedan para los ítems únicos del final**), **bloques 653–699** (`EXT_BLOCK = 600`; hoy el último es el 652).

**Regla de plata común a las cuatro:** ningún ítem nuevo **entra a `buy` de una tienda** salvo que su precio sea ≤ 1.2 × el de sus ingredientes en tienda (`pueblo.js`, regla de oro); lo hecho en casa con tiempo (ahumado, salado, guarapo) **se come o se usa, no se vende**. Así no aparece otra soda-tortilla (hoy la soda propia paga 3 por una tortilla que la tienda vende a 0.67).

---

## C1 «Fogón y despensa»

### C1.1 Lo que ya existe

| Hay | Dónde | Qué hacer |
|---|---|---|
| **Fogata** (bloque 235): sin entidad, **eterna**; calienta, espanta zancudos, ásala carne cruda y hierve la cantimplora | `blocks.js` (`fogata`), `supervivencia2.js` (`cocinarEnFogata`, `fogataCerca`, `tickFogatas`), `supervivencia3.js` (`tickMojado`: se seca más rápido a su lado), `plaga.js`, `zancudos.js` | Darle **leña y que se apague** |
| **Fogón de leña** (`stove`, bloque 100, estación de cocina de rejilla 3×3 con las recetas `cook`) | `stations.js` (`be.type === 'stove'`, `findRecipe(…, 'cook')`) | Que **gaste leña** por tanda |
| **Olla caliente** (633) y platos | `defensa.js` (`tickOllas`), `platos.js` (`llenarPlato`), `recipes.js` («Plato vacío», «Plato servido») | Se queda; la mesa lo premia |
| **Comida variada** y la fuerza por tres casillas | `variedad.js` (`comerVariado`), `fuerza.js` | Se queda; se suma el bono de mesa |
| **Hierbas** (sábila, manzanilla, hierbabuena, jengibre: ítems 428–431) con un solo uso cada una | `supervivencia2.js` (`HIERBAS`, `usarHierba`), `recipes.js` («Agua de sapo») | Combinarlas en **infusiones** |
| **Cantimplora cruda/hervida** y la ficha del ítem | `supervivencia2.js` (`beberDelRio`, `cocinarEnFogata`), `inventory.js` (`extras`), `comodidad.js` (`fichaItem`) | Reutilizar el truco de la marca en la pila (`cruda`) para la **fecha** |
| **Compostera** (621) | `blocks.js` | Recibe las **sobras** |

### C1.2 Diseño

**1. Leña (ítem 561).** Se hace de troncos: tres recetas (roble, abedul, selva), cada una **2 troncos → 6 leña** (un tronco ya vale 4 tablas: la leña es más barata de lo que parece, a propósito). Se apila 64. No se compra (el pulpero no la vende: hay que cortar).

**2. Fogata con combustible** (`stations.js`, `placed`, y un `tickFogata` por segundo): el bloque gana una **entidad** `{ type: 'fogata', lena: 6, t: 0 }`.
- **Gasta 1 leña cada 240 s (4 min)** (≈ 1 hora de juego por 3 leñas; 6 leñas = 24 min reales, **una noche entera**).
- Al llegar a **0 leña** pasa a **brasas**: bloque nuevo `fogata_brasas` (653, luz 6, cocina al 50 %, 3 min) y después a **apagada**: `fogata_apagada` (654, sin luz). El humo cambia a una hebra delgada.
- **La lluvia sin techo la apaga** (`Weather.colTop`: si `intensity > 0.4` y no hay techo encima, a los 20 s pasa a brasas, a los 60 s a apagada).
- **Clic derecho con leña en la mano:** suma 1–3 leñas (tope 8) y si estaba en brasas o apagada la **reaviva** (apagada pide un **mechero** (391) en la barra, que se gasta un uso).
- **Las fogatas viejas** (sin entidad) se completan solas al primer tic o al primer clic con `lena: 6`: **no hace falta migrar el guardado**. En dificultad **Tranquilo** (`difOf(g)`: agregar el campo `fuego`) **no se apagan** ni gastan leña.
- Que la **calefacción** (`WARM` en `supervivencia.js`) y el secado de la ropa (`tickMojado`) lean `brasas` como 50 % y `apagada` como 0 (misma comprobación `fogataCerca`, que hoy solo mira `K.fogata`).

**3. Fogón de leña con combustible:** su entidad gana `lena` (tope 16); **cada receta cocinada gasta 1 leña**; clic derecho con leña en la mano la carga; sin leña, el aviso «Al fogón se le acabó la leña» y no sale nada. En **Tranquilo** gasta la mitad.

**4. Sal y salazón / ahumado.** Nuevos ítems: **Sal** (562; la venden el pulpero, el minisúper y el pescador, **4 por 2 unidades = ₡1 000**), **Carne ahumada** (563), **Carne salada** (564), **Pescado salado** (565). Se hacen en el **fogón** (recetas `cook`). Duran mucho más (tabla 3) y llenan como el plato base **+25 %**: la carne ahumada llena `food 8` (la asada 6), la salada 6, el pescado salado 5.

**5. Comida que se echa a perder despacio.** Cada **pila de comida perecedera** guarda `dia` (el día de juego en que se **hizo o se recogió**, redondeado). Tabla de vida (`CADUCA`, nuevo, en `variedad.js` o `despensa.js`):

| Comida | Días buena | Pasada (rinde 50 %, 25 % de «panza») | Podrida |
|---|---|---|---|
| Carne cruda, pescado crudo, leche | 2 | día 3–4 | día 5+: se vuelve **Sobras** |
| Platos hechos (casado, gallo pinto, chifrijo, tamal, olla…) | 3 | 4–6 | 7+ |
| Tortilla, pan, empanada | 4 | 5–8 | 9+ |
| Huevo, fruta, café tostado | 8 | 9–16 | 17+ |
| **Ahumada** | 10 | 11–20 | 21+ |
| **Salada / pescado salado** | 14 | 15–28 | 29+ |

- **`dia` viaja con la pila** (se suma a `extras()` de `inventory.js`, igual que `cruda`, para que tirarla y recogerla **no** la renueve) y al juntar dos pilas **gana la más vieja**. Los cofres guardan `dia` porque sus casillas se guardan tal cual.
- La **ficha** (`fichaItem`) dice «Buena (le quedan 2 días)», «Pasada: rinde la mitad» o «Echada a perder».
- **Podrida** se convierte (al abrir el inventario o cada día) en **Sobras** (570), que **solo sirven para la compostera** (abono). Nadie se muere de hambre por un comida mala: al peor, cae «panza» (efecto que ya existe).
- **Tranquilo:** todo dura el doble. **Sin una pila con `dia`** (mundos viejos) se la fecha el día en que se carga: nada se pudre de golpe al actualizar.

**6. Mesa servida con bono** (`muebles.js`, `usarMueble`, y `game.js` donde se come): comer un **plato servido o hecho** **sentado** (`g.sentado`) a menos de 2 bloques de una **mesa de comedor** (238) da **+15 % de saciedad** y el efecto **aguante 4 min** (el de `variedad.js`). Una vez por comida; sin logro repetido.

**7. Botica con infusiones** (4 ítems nuevos, **cook** en el fogón, cada una gasta el balde de agua como el «Café chorreado»):
- **Agua de manzanilla** (566): quita `mareo` y `escalofrio` y deja **descansado** al dormir (cura +4 corazones si duerme en 10 min).
- **Agua de jengibre** (567): cura `panza` y suma 4 min de `aguante` corto.
- **Té de hierbabuena** (568): cura `panza` y las garrapatas; **+2 de comida**.
- **Jarabe de sábila** (569): cura `sangrando` y sube la vida 6 (no se amontona con el botiquín: comparten 40 s de espera).
Cada una **3 raciones** (3 usos) y **perece en 3 días**.

### C1.3 Recetas (todas `cook` en el fogón, salvo la leña) y choques

| Sale | Patrón / ingredientes | Choque con las 251 |
|---|---|---|
| Leña ×6 (3 recetas) | **Forma** `L/L` con `L` = Tronco de roble · abedul · selva | `L/L` no se usa; la única `P/P` es de Tablas → Palo; la `L/S` del Garrote lleva palo |
| Carne salada ×3 | Suelta: **Carne cruda + Carne cruda + Sal** (cook) | El Chicharrón es *Carne + Carne* sin sal: distinto |
| Carne ahumada ×1 | Suelta: **Carne cruda + Leña** (cook) | Nada usa Leña |
| Pescado salado ×1 (3 recetas) | Suelta: **Pargo rojo / Corvina / Dorado + Sal** (cook) | Los Ceviches llevan 2–3 limones |
| Agua de manzanilla ×3 | Suelta: **Balde con agua + Manzanilla + Tapa de dulce** (cook) | «Café chorreado» = Café tostado + Balde; «Agua dulce» = Tapa + Balde |
| Agua de jengibre ×3 | Suelta: **Balde con agua + Jengibre + Limón mandarina** (cook) | «Agua de sapo» = *Agua dulce* + Jengibre + Limón (sin horno y sin balde) |
| Té de hierbabuena ×3 | Suelta: **Balde con agua + Hierbabuena + Tapa de dulce** (cook) | Distinto de manzanilla por la hierba |
| Jarabe de sábila ×2 | Suelta: **Balde con agua + Sábila + Miel de melipona** (cook) | Único |

Los ítems de la despensa **no** se venden (regla de plata común). La **Sal** sí se compra: 2 unidades por 4.

### C1.4 Textos (en «usted», neutros, tica)

- Fogata: «🔥 La fogata está en brasas: échele leña antes de que se apague.» · «🌧 El aguacero apagó la fogata. Con un mechero y leña se vuelve a prender.»
- Fogón: «Al fogón se le acabó la leña.»
- Ficha de comida: «Buena (le quedan 2 días)» · «Pasada: ya no rinde como antes y puede caer mal» · «Echada a perder: solo sirve para la compostera.»
- Mesa: «🍽 Comer sentado a la mesa rinde más. Provecho.»
- Infusión: «🍵 Agua de manzanilla: se le calmó el cuerpo. Ya puede dormir.»

**Consejos del locutor** (`consejoUnaVez`, categoría `consejo`, una sola vez): `lena` «🪵 Con 2 troncos se hacen 6 leñas para la fogata (clic derecho con leña en la mano)»; `brasas` «🔥 Una fogata sin leña se apaga: tenga a mano unas leñas»; `sal` «🧂 Con sal y el fogón, la carne dura semanas»; `pasada` «🥩 Lo que lleva muchos días guardado ya no rinde: cómalo pronto o sálelo»; `mesa` «🍽 Una mesa, una silla y un plato servido: se come mejor sentado».

**Logros** (`g.achieve(clave, texto)` y `logros-lista.js`): `lena` «Primera leña»; `fogata_viva` «La fogata no se me apagó» (una noche entera encendida); `ahumado` «Carne de ahumadero»; `despensa` «Una despensa de abuela» (3 salazones distintas a la vez); `mesa_servida` «A la mesa, a comer»; `botica` «Botica de la abuela» (las 4 infusiones).

### C1.5 Riesgos

- **Balance:** la comida que se echa a perder **sube el gasto real de comida**: la medición del día (₡8 500) **no cambia** (se come en el día). El **bot de economía** no ve la despensa; lo que sí mide es la **venta**: por eso nada de esto se vende. **Pasarlo por `bot-economia`**: sin cambios esperados; la sal es un gasto de ≈ ₡250 al día.
- **Rendimiento:** cada fogata es una entidad; el bucle de `stations.js` ya recorre todas las entidades por cuadro: una fogata más no pesa, pero **la comprobación de lluvia** (`colTop`) va **una vez por segundo y solo cerca** (24 bloques), no por cuadro. La fecha de las pilas es un número más en la casilla.
- **Guardado:** **sin `SAVE_FORMAT`**: campos nuevos opcionales (`be.lena`, `slot.dia`), leídos con `??`. Un mundo viejo carga igual.
- **Cuidado:** `extras()` debe llevar `dia` (si no, tirar y recoger renueva); y la compostera debe aceptar **Sobras**.

### C1.6 👁 Que nanoyackson pruebe

Cuánto dura una fogata (¿4 min por leña es mucho?); si el aviso de «pasada» molesta; si la mesa con bono se siente; si el fogón sin leña frustra (por eso el modo Tranquilo).

---

## C2 «El cuerpo que siente»

### C2.1 Lo que ya existe

| Hay | Dónde |
|---|---|
| **Rodar** (esquive en el suelo con aire) | `combate.js` (`tryRoll`, `spend`), `g.roll`, `g.flipPitch` |
| **Daño por caída** y el aterrizaje suave | `player.js` (`res.fallDamage`, `softLanding`, `quizaQuebrar`), la maña `cae_de_pie` |
| **Avisos del cuerpo** por texto | `supervivencia.js` (`tickCuerpo`, el helper `aviso`) |
| **Sentarse** (la silla **teletransporta**) y **acostarse** (`lieDown`, `getUp`; la cámara baja, el avatar no) | `muebles.js` (`sentarse`, `usarMueble`, `tickMuebles`), `game.js` (`lieDown`, `getUp`), `avatar.js` (`sentado = riding || g.parapente`) |
| **Agacharse** (`p.sneaking ? 0.12 : 0` **de golpe**) y recoger objetos | `avatar.js` (≈ línea 86), `entities.js` (`ItemDrop`) |
| **Beber** con un clic | `supervivencia2.js` (`beberDelRio`, `beber`, `tomarCantimplora`) |
| **Pierna quebrada** (`quebrado`) y la tablilla | `player.js` (`quizaQuebrar`), `recipes.js` («Tablilla»), `BOTIQUIN` |
| `ui.pestaneo()`, `handLag`, partículas, `g.slowmo`, `g.shake`, `hurtTilt`, `calmaActiva` | `ui.js`, `game.js`, `calma.js` |

### C2.2 Diseño (nada nuevo de ítems: todo es sensación)

Todo respeta **«Movimiento tranquilo»** (`calmaActiva(g)`): ahí solo queda el sonido y el texto.

1. **Rodar al aterrizar** (`player.js`, donde se aplica `fallDamage`): en lugar de aplicar el daño al tocar el suelo, si `vyBefore < −9` y el daño es ≥ 3, queda **pendiente 0.25 s** (`g.caidaPend`). Si en esa ventana se pulsa **rodar**, el daño es **× 0.4**, **no hay pierna quebrada**, la voltereta de `flipPitch` sale y **gasta 10 de aire**; si no, se aplica entero. Si muere, se teletransporta o cambia de dimensión mientras está pendiente, se aplica de una vez. **Logro:** «Cayó como gato de potrero».
2. **Señales del cuerpo** (`tickCuerpo`): con `food ≤ 6`, **tripas** cada 20–40 s (se reutiliza el banco CC0 `rumble`, `pitch 1.8`, volumen 0.18, sin archivo nuevo); con `water < 6`, **la mano tiembla** (`handLag` +0.01) y los párpados bajan cada 40 s (`ui.pestaneo()`); con **frío o sueño**, **vaho** blanco frente a la cámara cada 2.5 s (`particles.spawn`), y bostezo escrito («Qué sueño…») una vez por bajón. Los textos de hoy se quedan como respaldo.
3. **Sentarse y acostarse con el cuerpo** (`muebles.js`, `game.js`, `avatar.js`): `sentarse` mueve a `g.sentado` **en 0.35 s** (curva, no salto) y `avatar.js` toma `sentado = riding || !!g.parapente || !!g.sentado` (las piernas ya tienen la pose). `lieDown`: el cuerpo se rota a horizontal en 0.5 s; `getUp` lo invierte con un fundido de 0.3 s. En la **hamaca** el vaivén (`mece`) es más lento al dormir.
4. **Agacharse y recoger** (`avatar.js`, `entities.js:ItemDrop`): suavizar el descenso con el helper `k()` (0.15 s) y, al recoger un objeto a < 1.5 bloques, **inclinar el cuerpo 0.3 rad durante 0.25 s** con el brazo estirado (`g.recogeT`).
5. **Beber con las manos** (`beberDelRio`): con la mano vacía y agua enfrente, **agacha la cámara 0.15** y hace **3 tragos de 0.4 s** (`beber(g, 1)` cada uno) con las dos manos juntas (`manoIzquierda`); con la cantimplora muestra el nivel (`dur`) bajando. Se interrumpe si le pegan.
6. **Despertar con sobresalto** (`game.js:getUp`): si lo despierta un golpe, un cencerro o un asedio, se levanta con un **salto de cámara de 0.4 s** y «¡Qué susto!»; ese despertar **no da `descansado`**.
7. **Cojera suave:** al curarse la **pierna quebrada** con la tablilla queda **cojera** 3 min (`convalecencia`): no se puede correr, el avatar y las criaturas con piernas **cojean** (rodilla asimétrica: `doblarRodilla` con fase distinta) y la cámara se inclina apenas. **El botiquín ya no cura `quebrado`** (solo la tablilla): decisión de balance, 👁.

### C2.3 Textos y consejos

- «🤸 ¡Cayó como gato de potrero!» · «🦵 Se le arregló la pierna, pero cojea un rato: no corra todavía.» · «😮 ¡Qué susto!» · «💧 Beba con las manos: clic en el agua con la mano vacía.»
- **Consejos:** `rodar` «🤸 Al caer de alto, toque rodar justo antes de llegar al suelo: el golpe pega menos»; `tripas` «🍽 Si le suenan las tripas, coma algo»; `cojera` «🦵 Con la pierna recién curada no se puede correr un rato».
- **Logros:** `gato_potrero` «Cayó como gato de potrero»; `siesta` «Siesta en la hamaca»; `bebe_manos` «Agüita de las manos».

### C2.4 Riesgos

- **Balance:** el rodar **baja** el daño de caída (alivia); la cojera y que el botiquín no cure el hueso lo **suben**: se compensan. Sin plata de por medio.
- **Rendimiento:** solo animaciones; el vaho es 1 partícula cada 2.5 s.
- **Guardado:** **ninguno** (`g.caidaPend`, `g.recogeT`, `g.sentado` no se guardan; la cojera es un efecto como los de hoy, en `meta.effects`).
- **Cuidado:** la **caída pendiente** debe aplicarse al morir/teletransportarse y no puede dejar vivo a alguien que debía morir (aplicarla antes del `respawn`).

### C2.5 👁 Que nanoyackson pruebe

La ventana de 0.25 s para rodar (¿es justa?), el sonido de tripas (¿molesta?), si la cojera frustra, y las poses de sentarse y acostarse (se ven en tercera persona).

---

## C3 «Lluvia y verano»

### C3.1 Lo que ya existe

| Hay | Dónde |
|---|---|
| **Estaciones** `g.season` (`verano`/`invierno`, **cada 7 días**, aviso al cambiar) | `game.js` (≈ 3349), `weather.js` (`set`: duración de la lluvia según la estación), `clima3.js` (sequía), `quema.js`, `rio.js`, `naturaleza3.js` (papagayo), `juegos.js` (papalote), `mundo2.js`, `pulido.js` |
| **Lluvia** con `colTop` (primer bloque que tapa) | `weather.js` (`update`, `colTop`, `Weather.set('storm')`) |
| **Mojado** y `empapado` | `supervivencia3.js` (`tickMojado`) |
| **Frío del páramo** (solo páramo o altura > 102) con `ABRIGO`, `METAL`, `WARM` | `supervivencia.js` (`tickFrio`) |
| **Calor y sol**: sed por bioma seco, `exposicionSol`, insolación | `supervivencia2.js` (`tickSed`, `exposicionSol`) |
| **Zinc** (191) y **lámina** (209), **barril de lluvia**, **sombrero sabanero** (412), **sombrero de tule** (405) | `blocks.js`, `monte.js` (`barrilInteract`) |
| **Pronóstico de la tele** (chiste) | `muebles.js` (`CANALES`) |

### C3.2 Diseño

**1. Temperatura del cuerpo** (`g.cuerpo`, de −100 a +100, se recalcula cada segundo en `supervivencia3.js:tickCuerpoClima`, **sin guardar**): `objetivo = base(bioma, hora) + estación + sol − mojado·0.4 + fuego + ropa` y `cuerpo += (objetivo − cuerpo)·0.05`.
- **base:** costa +10 de día, selva +6, valle 0, páramo −35 de día y −55 de noche; **de noche** −15 en todos.
- **estación:** verano +10, invierno −5. **sol** (`exposicionSol`, ya existe): 0 a +25. **mojado:** `g.mojado` (0–100) resta hasta 40. **fuego:** una fogata/fogón cerca suma +40 (brasas +20). **ropa:** sombrero de paja −15 de sol, **capote** quita el mojado, **cobija** +25 de frío, **METAL** (casco o pechera de hierro/diamante) **+8 de calor** y **−8 de frío** al revés (`METAL` ya existe); el sombrero sabanero y el de tule −10 de sol.
- **Umbrales:** `cuerpo ≤ −50` → `escalofrio` (ya existe); `cuerpo ≥ +60` → **`calor`** (efecto nuevo: **la sed ×1.4**, **correr gasta ×1.25 de aire**, el avatar suda); `≥ +90` y poca agua → **insolación** (la de hoy). **`tickFrio` queda solo como caso extremo** del páramo.
- **Icono** en `renderEffects` (`ui.js`): `🥶 Frío` / `🥵 Calor`, con un termómetro de 5 pasos. En **Tranquilo** los umbrales se corren 15 puntos.

**2. Ropa nueva** (3 ítems, ver tabla de arte): **Capote de hule** (571, pechera sin defensa: **el mojado no sube**; **se compra** en la pulpería y la ferretería a **30 unidades = ₡15 000**); **Sombrero de paja** (572, casco sin defensa: sol −15; **se hace** con caña brava); **Cobija de lana** (573, **clic derecho** 4 min de abrigo con el efecto `termal` que ya existe, 5 usos, **se hace** con lana). Elegir capote o pechera es **una decisión**: o abrigo, o armadura.

**3. Lluvia sobre el zinc** (`weather.js` + `audio.js`): `Weather` ya calcula `colTop`; si el bloque que tapa es **zinc (191) o lámina (209)**, la lluvia de afuera se oye **un 50 % más baja** y se suma un **repiqueteo metálico** (los sonidos CC0 de Kenney `impactTin_medium_00x`, **ya en `public/sounds`**, a volumen 0.06–0.1 y `pitch` 1.6–2.0, 6–10 por segundo). Techo de otro material con **un hueco** (columna con un bloque de aire entre dos tejas): **gotera**: cae una gota visible y moja un poco (`tickMojado` +1 por segundo bajo la gotera).

**4. Temporadas de verdad.** Hoy cada estación dura **7 días** (un «año» de 14): se siente un parpadeo. Pasa a **30 días cada una** (`temporadaDe(day)` en un `temporadas.js`, sin guardar: se calcula de `g.day`) con **4 días de transición** (los últimos 4 de cada estación: la lluvia empieza o afloja de a poco). **Un mundo viejo** simplemente tiene otra estación el día en que se actualice: el aviso del cambio sale como siempre.
- **Invierno (lluvioso):** el **«aguacero de las dos»**: casi todos los días (80 %) llueve entre las **13:30 y las 15:00** (`t` 0.31–0.36; la hora ya existe en el reloj del juego) durante ≈ 120 s; **los cultivos crecen +25 %** (`agro.js`, `trackCrop`); **el río crece** más (`rio.js`, ya usa `season`); **más zancudos** y **barro** (`enlodado`) en los caminos; **el barril de lluvia se llena** el doble.
- **Verano (seco):** los cultivos **−15 %** salvo con agua cerca (balde/acequia); **más quemas** y **papagayo** (ya existen); **el barril de lluvia se vacía** 1 de agua por día; **el café madura** (ver C4); **sol y calor** (cuerpo +10).
- **La tele dice la verdad:** `CANALES` (`muebles.js`) pasa a leer `g.weather`/`temporadaDe`: «Mañana: aguacero a las dos, como siempre».

### C3.3 Recetas

| Sale | Receta | Choque |
|---|---|---|
| **Sombrero de paja** (572) | **Forma** `·C·/CCC` con `C` = **Caña brava** (554) | El sombrero sabanero usa el mismo patrón con **Cuero** (`·L·/LLL`): **ingredientes distintos**, no choca |
| **Cobija de lana** (573) | **Forma** `WWW/WWW` con `W` = Lana | La Cortina es `WW/WW/WW` (2 columnas); la Cama `WWW/PPP`: no choca |
| **Capote de hule** (571) | **Se compra** (no tiene receta) | — |

### C3.4 Textos y consejos

- «🥵 Hace un calor que no se aguanta: busque sombra y tome agua.» · «🥶 Le entró el frío: arrímese a la fogata o póngase la cobija.» · «☔ El aguacero de las dos, como siempre: mejor bajo techo.» · «🌧 Entró el invierno: aguaceros casi todas las tardes. Los cultivos se alegran.» · «☀ Entró el verano: época seca, cuide el agua.»
- **Consejos:** `capote` «☔ Un capote de hule (en la pulpería) lo deja seco bajo el aguacero, pero ocupa el puesto de la pechera»; `calor` «🥵 Con calor, la sed sube: un sombrero de paja ayuda»; `zinc` «🏠 El zinc suena bonito bajo la lluvia… y no hay goteras si está bien puesto».
- **Logros:** `aguacero_dos` «Aguacero de las dos» (verlo bajo un techo de zinc); `capote` «Seco como pollo en el aguacero»; `verano_sol` «Sol de verano sin insolación»; `invierno` «Un invierno completo».

### C3.5 Riesgos

- **Balance:** el **calor sube el gasto de agua y de aire**: probar con un día de verano en la costa sin sombrero; la ropa lo corrige. **Plata:** el capote (₡15 000 ≈ 1.2 jornadas) y la cobija (lana + tiempo) son gastos nuevos; **pasarlo por `bot-economia`** (suma ≈ 30 unidades una sola vez al mes). **El crecimiento de cultivos +25 % / −15 %** cambia los ingresos de «comerciante» (`ventaDia`): **medir** los 30 días con la estación **invierno** y con **verano** (el bot hoy supone una finca estable).
- **Rendimiento:** `g.cuerpo` es una cuenta de 10 sumandos por segundo; el repiqueteo son 6–10 sonidos cortos por segundo **solo bajo zinc con lluvia**; la gotera consulta `colTop`, que ya se cachea.
- **Guardado:** **ninguno**: la estación sale de `g.day`; `g.cuerpo` se recalcula. Pero **cambiar la duración de las estaciones mueve la fecha de todo lo que depende de `g.season`** en mundos viejos (nada se rompe, solo se corre).
- **Cuidado:** que la lluvia de las 2 **no caiga en eventos** (asedio, Noche Larga, torneo, bingo): se salta si `g.asedio || g.nocheLarga || g.torneo`.

### C3.6 👁 Que nanoyackson pruebe

Si 30 días por estación se siente largo; el aguacero de las dos (¿es muy seguido?); el calor en la costa; el capote contra la armadura (¿qué prefiere?).

---

## C4 «Pura vida en la finca»

### C4.1 Lo que ya existe (y no se duplica)

| Hay | Dónde |
|---|---|
| **Trapiche** (99): entidad `{ cane, made, t }`, **3 cañas → 1 tapa de dulce cada 6 s**, clic con caña la mete, clic vacío saca la tapa | `blocks.js`, `stations.js` (`placed`, tic del trapiche), `game.js` (`b.key === 'trapiche'`), `recipes.js` («Trapiche») |
| **Tapa de dulce** (297) y todo lo que se hace con ella (Agua dulce, Cajeta, Chocolate, Tanelas…) | `recipes.js` |
| **Café**: cultivo `cafe1/2/3` (95–97) con la cereza madura, **cajuela** (20 granos), **recibidor** (el caficultor la paga 5 unidades), **tostado** y **chorreado** | `agro.js`, `game.js` (`b.crop === 'cafe'`), `oficios.js` (`cogerConCajuela`), `pueblo.js` (`SHOPS.caficultor`), `recipes.js` |
| **Carreta con bueyes** (487), **ruedas** y **madera pintada de Sarchí** | `carreta.js`, `recipes.js` |
| **Hamaca** (239) y **silla** (237) | `muebles.js` (`usarMueble`) |
| **Perro zaguate** (`finca.js`: con carne te sigue y defiende) y el **zaguate que trae cosas** (`compas.js`, `TRAE`); **el Canelo** de la abuela | `finca.js`, `compas.js`, `canelo.js` |
| **Feria del agricultor** (estructura) y los **precios del día** | `pueblos2.js`, `economia.js` (`tickPrecios`, `factorDia`), `bingo.js` (`sabado(g)`) |
| **Adobe** (105), **teja** (107), **baldosa roja** (600), **repellos**, **planos** de casas | `blocks.js`, `planos.js`, `estructuras.js` (la «tapia») |
| **Mobs pacíficos** que solo pastan | `entities.js`, `finca.js` |

### C4.2 Diseño

#### C4.2.a Trapiche y tapa de dulce
- **Guarapo:** clic derecho al trapiche **con un balde vacío** (o la cantimplora vacía) saca **guarapo** en vez de tapa (3 cañas → 1 balde de **Balde de guarapo**, 574): **+4 de sed, +6 de aire, perece en 1 día**; **no se vende**.
- **Miel de caña** (575): una **paila** sobre el fogón: la receta **cook** `Balde de guarapo → Miel de caña ×2`; la miel sirve para las recetas del dulce (sustituye a la tapa en Cajeta de leche) y **llena 3**.
- **La molienda:** en **verano**, los **días 20–22** de cada estación el pueblo muele caña (`g.season === 'verano'` y `dia % 30` entre 20 y 22): el caficultor/pulpero compra **caña** (296) a **1 unidad por 3** y hay marimba; **no hay mecánica nueva**, solo precio y ambiente.
- **El yugo con bueyes (opcional, M):** un **boyero** (NPC) puede mover el trapiche con dos bueyes: ×2 velocidad (6 s → 3 s por tapa) si hay **dos bueyes** (el mob de la carreta, `carreta.js`) a < 4 bloques.

#### C4.2.b Café en verano
- **Temporada:** el café **solo madura en verano** (`b.crop === 'cafe'` en `game.js`/`agro.js`: en invierno el cafeto **florece** (se queda en su etapa intermedia `cafe2`; **por confirmar** si esa textura se ve «en flor»: si no, se dibuja una nueva) y **no da cereza**; en verano pasa a `cafe3`). Así la cajuela tiene su época.
- **Recibidor:** el caficultor paga la cajuela **5 unidades** (ya) **+20 % los sábados de verano** (7 a 30 de verano, `sabado(g)`): **6 unidades**.
- **Chorreado con su gesto:** el «Café chorreado» ya se hace; sin cambio (solo el ícono nuevo del lote 2).

#### C4.2.c Carreta pintada con bueyes
- **Pintar la carreta** (`carreta.js`): clic derecho con la **brocha** (446) en la mano sobre la carreta **cambia el color de la caja** (5 colores: rojo, amarillo, azul, verde y celeste de **Sarchí**; el color sale de qué **madera pintada** lleve el jugador en el inventario: gasta 1). Se guarda en `meta.carretaPintura` (opcional).
- **Carga:** **9 casillas** en la caja (una entidad `{ type: 'carreta', slots }` como el cofre): se abre con **E** junto a la carreta (no sentado); **solo se mueve despacio** (2.6 bloques/s, ya) y **se pierde** un 10 % si vuelca (`física`): no hay daño nuevo.

#### C4.2.d Hamaca y mecedora
- **Mecedora** (655, bloque): se sienta (como la silla) y **se mece** (`tickMuebles`: balanceo ±6° a 0.6 Hz); sentado **recupera 1 corazón cada 12 s** (hasta 6) y baja `calma`; hace **ruido de madera** (`dig.wood`). Receta abajo.
- **Hamaca:** la **siesta** (de día, **12:00–14:00**) cura 6 y quita `cansado` una vez al día; hoy solo duerme (`usarMueble`).

#### C4.2.e Zaguate compañero (`finca.js`, `compas.js`)
- **Lealtad** (`meta.zaguate = { nombre, dia, lealtad, hambreDia }`): sube 1 por cada día juntos (1–3).
- **Nombre:** se le pone con **un cartelito en la mano** (clic derecho, la misma UI de `armarTituloCofre`).
- **Comida:** **una comida cada 2 días** (cualquiera, la carne cruda cuenta): si pasa 3 días sin comer **se va un día y vuelve** (como el Canelo, no se muere).
- **Niveles:** 1 **ladra** si hay algo cerca de noche; 2 **busca** (el `TRAE` de `compas.js` sale cada 4 min en vez de cada 8 y con mejor tabla); 3 **pelea** (+3 de daño a sus golpes y 8 de vida más).
- **Collar** (576): se pone con clic derecho; es **adorno y +4 de vida**.

#### C4.2.f Feria del agricultor los sábados
- **Día:** `sabado(g)` (`bingo.js`), de **08:00 a 17:00** (el reloj ya existe), solo en pueblos con la estructura (`pueblos2.js`). **Aviso** igual que el bingo.
- **Precios:** sobre las 7 cosechas de `COSECHAS` (`economia.js`) **+25 %** al venderlas al feriante (`SHOPS.feriante`).
- **Concurso de la mejor cosecha:** hablar con el juez (un feriante), **inscribirse por 2 unidades (₡1 000)** y presentar **8 de una cosecha**: gana **20 unidades (₡10 000)** y el **Listón de la feria** (577, adorno de la casa) quien traiga la **mayor cantidad total de las 8 mejores**; los otros participantes son rivales con un puntaje fijo por semana (como `torneo.js`: `rivales`). Un concurso por sábado, máximo uno por jugador.
- **Regateo (opcional, S):** clic derecho a un puesto con la plata en la mano: un **40 % de chance de −10 %** en el precio (una vez por puesto y sábado).

#### C4.2.g Construcción tradicional (set de 7 bloques)
Bloques nuevos (653 y 654 son los de C1; estos van de **655**): **Mecedora** (655), **Pared de bahareque** (656), **Bahareque encalado** (657), **Horcón** (658), **Techo de palma** (659), **Postigo** (660), **Banca de corredor** (661). La mecedora va en C4.2.d.
- **Bahareque:** barro con caña, la pared de las casas tradicionales; se pinta de cal.
- **Horcón:** poste de tronco grueso (`render: 'shape'`, igual que la cerca). **Techo de palma:** losa inclinada (usa el sistema de `Losa`/`Escalera`). **Postigo:** ventana de madera con dos hojas que **abren** (`toggleTo`, como la puerta). **Banca:** se sienta como la silla.
- **Planos** (`planos.js`): se suma el plano **«Casa de bahareque con corredor»** (se vende en la ferretería, `plano_bahareque`, **25 unidades = ₡12 500**) que reutiliza las tres variantes de `planos.js`.
- **Estructura:** una **casita de bahareque** (generador, versión nueva: `genVersion`): en pueblos del Valle; el que ya está explorado no cambia.

#### C4.2.h Animales con rutinas (nuevo módulo `rutinas.js`, `entities.js`)
Una capa que decide **una vez por segundo** y solo para los pacíficos a < 40 bloques:
- **Duermen de noche** (`g.time` 0.55–0.95): se echan (cuerpo bajo, cabeza abajo, `Zz` cada 3 s), **no se mueven** y se levantan si el jugador está a < 3 bloques o les pegan.
- **Beben al mediodía** (0.18–0.28): si hay agua a < 16 bloques, caminan y **bajan la cabeza**.
- **Sombra de verano** (0.15–0.35, `season === 'verano'`): buscan árbol o techo a < 12 bloques.
- **Aguacero:** las gallinas **se meten bajo techo** (si hay uno cerca) y el resto se junta bajo hojas.
- **De la finca:** las vacas **vuelven al corral** (cerca de postes) al atardecer.
- **Por especie:** el perezoso **duerme de día colgado**, la danta se revuelca en el barro después de llover, las gallinas se recogen al atardecer.
- El estado **no se guarda** (se recalcula por la hora).

### C4.3 Recetas y choques

| Sale | Patrón / ingredientes | Choque |
|---|---|---|
| **Balde de guarapo** | **Sin receta**: se saca del trapiche con un balde | — |
| **Miel de caña ×2** (cook) | Suelta: **Balde de guarapo** | Único |
| **Mecedora ×1** | **Forma** `P··/PPP/SPS` con `P` = Tablas, `S` = Palo | La Silla es `P··/PPP/S·S` (otra tercera fila): no choca |
| **Banca de corredor ×2** | **Forma** `PPP/·S·` con Tablas y Palo | La Mesa de comedor es `PPP/S·S`; ninguna otra receta es `PPP/·S·` |
| **Pared de bahareque ×4** | Suelta: **Barro + Barro + Caña brava + Caña brava** | El Adobe es *Barro + Barro + Tierra + Tierra* |
| **Bahareque encalado ×4** | Suelta: **Bahareque ×4 + Calcita** | Idéntico esquema a los Repellos (con otro ingrediente) |
| **Horcón ×2** | **Forma** `L/L/L` con `L` = Tronco de roble | Las `L/L` de la leña son de 2 filas; la Puntal es `S/P/S` |
| **Techo de palma ×6** | **Forma** `CCC/CCC` con `C` = Caña brava | Las Losas son `MMM` de una sola fila; no choca |
| **Postigo ×2** | **Forma** `SS/SS` con `S` = Palo | La Piedra pulida es `SS/SS` de **Piedra**, la Arenisca de **Arena**: ingredientes distintos |
| **Collar de cuero ×1** | **Forma** `S·S/·L·` con Palo y Cuero | La Honda es `S·S/·L·/·S·` (3 filas): no choca |
| **Plano de bahareque** | **Se compra** en la ferretería | — |

Todos los ítems de este apartado se usan (no se venden), salvo los que ya tienen precio.

### C4.4 Textos y consejos

- «🍯 Del trapiche sale guarapo: con un balde, clic derecho.» · «🐂 Hoy es sábado: hay feria del agricultor en el pueblo.» · «🏆 ¡Ganó el concurso de la mejor cosecha! Veinte unidades y el listón.» · «🪑 La mecedora lo deja como nuevo.» · «🐕 ¡Zaguate le lamió la mano! Ya le tiene confianza (lealtad 2).» · «☕ Es verano: el café ya madura.»
- **Consejos:** `guarapo` «🥤 Con un balde vacío en la mano, clic derecho al trapiche saca guarapo»; `feria` «🧺 Los sábados hay feria: sus cosechas valen un 25 % más»; `cafe_verano` «☕ El café solo madura en verano: en invierno está en flor»; `zaguate` «🐕 Un zaguate se hace de la familia: le gusta comer cada dos días»; `mecedora` «🪑 Sentado en la mecedora se recupera la vida».
- **Logros:** `guarapo` «Guarapo de la casa»; `molienda` «Día de molienda»; `feria_ganador` «Mejor cosecha del cantón»; `mecedora` «Mecedora de abuela»; `zaguate3` «Zaguate de toda la vida»; `bahareque` «Casa de bahareque»; `rutina` «El pueblo duerme» (ver a un animal dormido).

### C4.5 Riesgos

- **Balance / plata (pasar por `bot-economia`):** el **trapiche** no cambia (la tapa vale lo mismo; el guarapo y la miel **no se venden**); **café en verano** puede subir la cajuela a 6 unidades solo los sábados de verano (media del mes +≈ 0.7 unidades al día: despreciable); **la feria** suma +25 % solo a las 7 cosechas **un día de siete** (+3.6 % de la venta del «comerciante»; el supuesto `ventaDia` sigue dentro de la banda) y el **concurso** paga **20 unidades por sábado** como tope (si el bot lo cuenta, +2.9 unidades al día: pasa por debajo de 1.5× entre los perfiles); **el plano** de bahareque (₡12 500) es un gasto. **El zaguate de nivel 2 que «trae cosas» el doble de seguido** sube la plata del `TRAE` (hoy 1–3 unidades): revisar que no pase de **+1 unidad al día**.
- **Rendimiento:** **`rutinas.js` es lo único que cuesta**: decisiones a 1 Hz por mob, limitadas a 40 bloques y a 40 mobs; **búsquedas de agua/árbol cacheadas** por 10 s. Los 7 bloques nuevos suman texturas al atlas (los íconos de bloque se generan solos). El concurso y la feria **solo corren con el pueblo cerca**.
- **Guardado:** `meta.zaguate`, `meta.carretaPintura`, `meta.feria`: **opcionales** (`??`); **sin `SAVE_FORMAT`**. Los bloques nuevos son ids nuevos: un mundo viejo no los tiene. **El generador de la casita** pide `genVersion` nuevo (regla del proyecto) para no cambiar lo explorado.
- **Cuidado:** **el café que no madura en invierno** deja a quien tiene cajuelas sin empleo: la cajuela puede **seguir sirviendo** con cerezas que ya estén maduras (`cafe3`) y el aviso lo explica. **Los bueyes del yugo** no deben contarse como vecinos.

### C4.6 👁 Que nanoyackson pruebe

El ritmo del café por estaciones (¿frustra que no haya en invierno?), la feria del sábado y el concurso, la mecedora, el zaguate con lealtad y si el hambre cada 2 días estorba, y las rutinas de los animales (el costo en cuadros por segundo con un potrero lleno).

---

## Pedidos de arte para Codex (todas las tandas)

**Estilo:** el de `docs/revisiones/PEDIDOS_ARTE_LOTE1.md` §0 (plano, 512×512, fondo transparente, **sin contorno negro**, brillo arriba a la izquierda y sombra abajo a la derecha, paleta por material). Cada prompt lleva la guía dentro. **Los bloques** (ids 653–661) **se dibujan solos** en el juego con `pixelart.js` (texturas de 16×16) y su ícono isométrico sale del bloque; **el pedido de aquí es el ícono plano de 512 px para el inventario** de cada uno, para cuando se pase todo el arte a GPT.

| Archivo | Se conecta a | Prompt |
|---|---|---|
| `item-lena.png` | C1 · ítem **561** · `lena` → `src/assets/items-gpt/lena.png` | Ícono de videojuego en estilo plano (flat) de leña. Un pequeño atado de cuatro leños cortos de madera café con los extremos más claros donde se cortó, amarrados con una tira de cabuya crema; uno de ellos con una muesca y la corteza áspera. Se ve seca y lista para el fogón. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. Un solo objeto centrado, ocupando cerca del 75 % del lienzo, vista de 3/4 desde arriba, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego. |
| `item-sal.png` | C1 · ítem **562** · `sal` → `src/assets/items-gpt/sal.png` | Ícono de videojuego en estilo plano (flat) de sal. Una bolsita de manta crema atada con cabuya, medio abierta, de la que se desborda un montoncito de sal gruesa blanca con destellos celestes; un cucharón de madera pequeño asoma al lado. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. Un solo objeto centrado, ocupando cerca del 75 % del lienzo, vista de 3/4 desde arriba, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego. |
| `item-carne_ahumada.png` | C1 · ítem **563** · `carne_ahumada` → `src/assets/items-gpt/carne_ahumada.png` | Ícono de videojuego en estilo plano (flat) de carne ahumada. Un trozo de carne ahumada de color café rojizo oscuro con vetas de grasa clara y un brillo grasoso, colgado de un gancho de alambre con una cuerda de cabuya, con dos hilitos de humo grises saliendo. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. Un solo objeto centrado, ocupando cerca del 75 % del lienzo, vista de 3/4 desde arriba, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego. |
| `item-carne_salada.png` | C1 · ítem **564** · `carne_salada` → `src/assets/items-gpt/carne_salada.png` | Ícono de videojuego en estilo plano (flat) de carne salada. Un trozo de carne salada rosado pálido cubierto de cristales de sal blanca, en una tabla de madera pequeña; se ve seca y curada, con un hueso blanco asomando. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. Un solo objeto centrado, ocupando cerca del 75 % del lienzo, vista de 3/4 desde arriba, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego. |
| `item-pescado_salado.png` | C1 · ítem **565** · `pescado_salado` → `src/assets/items-gpt/pescado_salado.png` | Ícono de videojuego en estilo plano (flat) de pescado salado. Un pescado abierto en dos y salado, color crema rosado, con la espina y una capa de sal gruesa, sostenido por un palito de madera atravesado; cola plateada hacia arriba. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. Un solo objeto centrado, ocupando cerca del 75 % del lienzo, vista de 3/4 desde arriba, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego. |
| `item-agua_manzanilla.png` | C1 · ítem **566** · `agua_manzanilla` → `src/assets/items-gpt/agua_manzanilla.png` | Ícono de videojuego en estilo plano (flat) de agua de manzanilla. Una taza de barro café con asa, llena de un té amarillo dorado muy claro, con dos flores de manzanilla blancas con centro amarillo flotando y un hilo de vapor. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. Un solo objeto centrado, ocupando cerca del 75 % del lienzo, vista de 3/4 desde arriba, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego. |
| `item-agua_jengibre.png` | C1 · ítem **567** · `agua_jengibre` → `src/assets/items-gpt/agua_jengibre.png` | Ícono de videojuego en estilo plano (flat) de agua de jengibre. Un vaso corto de vidrio con agua turbia color miel clara, rodajas de jengibre beige con borde fino y una rodaja de limón en el borde; un palito de madera dentro. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. Un solo objeto centrado, ocupando cerca del 75 % del lienzo, vista de 3/4 desde arriba, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego. |
| `item-te_hierbabuena.png` | C1 · ítem **568** · `te_hierbabuena` → `src/assets/items-gpt/te_hierbabuena.png` | Ícono de videojuego en estilo plano (flat) de té de hierbabuena. Un jarrito de peltre blanco con borde azul y asa, lleno de té verde claro con hojas de hierbabuena verdes flotando, y vapor suave saliendo. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. Un solo objeto centrado, ocupando cerca del 75 % del lienzo, vista de 3/4 desde arriba, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego. |
| `item-jarabe_sabila.png` | C1 · ítem **569** · `jarabe_sabila` → `src/assets/items-gpt/jarabe_sabila.png` | Ícono de videojuego en estilo plano (flat) de jarabe de sábila. Un frasco de vidrio con tapón de corcho lleno de un jarabe verde translúcido y espeso con una penca de sábila verde con espinitas dibujada al frente en una etiqueta crema, sin texto. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. Un solo objeto centrado, ocupando cerca del 75 % del lienzo, vista de 3/4 desde arriba, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego. |
| `item-sobras.png` | C1 · ítem **570** · `sobras` → `src/assets/items-gpt/sobras.png` | Ícono de videojuego en estilo plano (flat) de sobras. Un plato de barro viejo con restos de comida revueltos: cáscaras, un hueso, arroz y una hojita marchita, de color café verdoso apagado; dos moscas pequeñas encima. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. Un solo objeto centrado, ocupando cerca del 75 % del lienzo, vista de 3/4 desde arriba, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego. |
| `item-capote_hule.png` | C3 · ítem **571** · `capote_hule` → `src/assets/items-gpt/capote_hule.png` | Ícono de videojuego en estilo plano (flat) de capote de hule. Un capote de hule amarillo para el aguacero, con capucha, botones grandes y gotas de agua resbalando por la tela brillante; doblado a medias y visto de frente. Amarillo mostaza con sombras anaranjadas. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. Un solo objeto centrado, ocupando cerca del 75 % del lienzo, vista de 3/4 desde arriba, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego. |
| `item-sombrero_paja.png` | C3 · ítem **572** · `sombrero_paja` → `src/assets/items-gpt/sombrero_paja.png` | Ícono de videojuego en estilo plano (flat) de sombrero de paja. Un sombrero de paja de ala ancha tejido a mano, color paja dorada, con una cinta de tela roja alrededor de la copa y las fibras del borde sueltas; visto en 3/4 desde arriba. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. Un solo objeto centrado, ocupando cerca del 75 % del lienzo, vista de 3/4 desde arriba, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego. |
| `item-cobija_lana.png` | C3 · ítem **573** · `cobija_lana` → `src/assets/items-gpt/cobija_lana.png` | Ícono de videojuego en estilo plano (flat) de cobija de lana. Una cobija de lana gruesa doblada en un rectángulo, color vino con franjas crema en los extremos y flecos cortos; el borde de arriba un poco levantado. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. Un solo objeto centrado, ocupando cerca del 75 % del lienzo, vista de 3/4 desde arriba, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego. |
| `item-guarapo.png` | C4 · ítem **574** · `guarapo` → `src/assets/items-gpt/guarapo.png` | Ícono de videojuego en estilo plano (flat) de balde de guarapo. Un balde de lata gris con asa de alambre lleno hasta el borde de guarapo (jugo de caña) verde amarillento turbio con espuma blanca, un trozo de caña de azúcar verde apoyado al lado. Mismo balde y ángulo que el balde con agua. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. Un solo objeto centrado, ocupando cerca del 75 % del lienzo, vista de 3/4 desde arriba, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego. |
| `item-miel_cana.png` | C4 · ítem **575** · `miel_cana` → `src/assets/items-gpt/miel_cana.png` | Ícono de videojuego en estilo plano (flat) de miel de caña. Una jarra de barro con tapa de corcho y un chorro de miel de caña ámbar oscuro cayendo en un plato hondo, con un brillo dorado y una cucharita de madera. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. Un solo objeto centrado, ocupando cerca del 75 % del lienzo, vista de 3/4 desde arriba, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego. |
| `item-collar_cuero.png` | C4 · ítem **576** · `collar_cuero` → `src/assets/items-gpt/collar_cuero.png` | Ícono de videojuego en estilo plano (flat) de collar de cuero. Un collar de perro de cuero café con una hebilla metálica dorada y una plaquita redonda de cobre sin texto colgando, formando un círculo abierto. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. Un solo objeto centrado, ocupando cerca del 75 % del lienzo, vista de 3/4 desde arriba, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego. |
| `item-liston_feria.png` | C4 · ítem **577** · `liston_feria` → `src/assets/items-gpt/liston_feria.png` | Ícono de videojuego en estilo plano (flat) de listón de la feria. Un listón de premio redondo (rosetón) azul con puntas largas que cuelgan y un centro dorado con una espiga de maíz dibujada, sin texto. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. Un solo objeto centrado, ocupando cerca del 75 % del lienzo, vista de 3/4 desde arriba, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego. |
| `item-fogata_brasas.png` | C1 · bloque **653** · `fogata_brasas` → `src/assets/items-gpt/fogata_brasas.png` | Ícono de videojuego en estilo plano (flat) de fogata en brasas (bloque). Una fogata baja casi apagada: un círculo de piedras grises con leños carbonizados negros y brasas naranja y rojas brillando en el centro, una hebra delgada de humo; vista de 3/4. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. Un solo objeto centrado, ocupando cerca del 75 % del lienzo, vista de 3/4 desde arriba, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego. |
| `item-fogata_apagada.png` | C1 · bloque **654** · `fogata_apagada` → `src/assets/items-gpt/fogata_apagada.png` | Ícono de videojuego en estilo plano (flat) de fogata apagada (bloque). Una fogata apagada: un círculo de piedras grises con leños negros y ceniza gris clara en el centro, sin llama, con un charquito de agua; vista de 3/4. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. Un solo objeto centrado, ocupando cerca del 75 % del lienzo, vista de 3/4 desde arriba, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego. |
| `item-mecedora.png` | C4 · bloque **655** · `mecedora` → `src/assets/items-gpt/mecedora.png` | Ícono de videojuego en estilo plano (flat) de mecedora (bloque). Una mecedora de madera café cálido con respaldo de listones, brazos curvos y patines curvos abajo, con un cojín de tela roja con flores; vista de 3/4. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. Un solo objeto centrado, ocupando cerca del 75 % del lienzo, vista de 3/4 desde arriba, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego. |
| `item-bahareque.png` | C4 · bloque **656** · `bahareque` → `src/assets/items-gpt/bahareque.png` | Ícono de videojuego en estilo plano (flat) de pared de bahareque (bloque). Un cubo de pared de bahareque: barro café rojizo con las cañas entrecruzadas visibles en un cuadro, manchas de barro y una esquina con el marco de madera; vista de 3/4. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. Un solo objeto centrado, ocupando cerca del 75 % del lienzo, vista de 3/4 desde arriba, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego. |
| `item-bahareque_encalado.png` | C4 · bloque **657** · `bahareque_encalado` → `src/assets/items-gpt/bahareque_encalado.png` | Ícono de videojuego en estilo plano (flat) de bahareque encalado (bloque). Un cubo de pared de bahareque pintado de cal blanca con la cal descascarada abajo mostrando el barro café y las cañas; una franja azul celeste en la base; vista de 3/4. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. Un solo objeto centrado, ocupando cerca del 75 % del lienzo, vista de 3/4 desde arriba, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego. |
| `item-horcon.png` | C4 · bloque **658** · `horcon` → `src/assets/items-gpt/horcon.png` | Ícono de videojuego en estilo plano (flat) de horcón (bloque). Un poste grueso de tronco sin pulir (horcón), de madera oscura con nudos y la corteza áspera, con una muesca arriba donde apoya una viga; vista de 3/4. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. Un solo objeto centrado, ocupando cerca del 75 % del lienzo, vista de 3/4 desde arriba, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego. |
| `item-techo_palma.png` | C4 · bloque **659** · `techo_palma` → `src/assets/items-gpt/techo_palma.png` | Ícono de videojuego en estilo plano (flat) de techo de palma (bloque). Una losa inclinada de techo de palma: hojas de palma verdes y doradas apiladas en capas, atadas con cabuya, con las puntas abajo; vista de 3/4. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. Un solo objeto centrado, ocupando cerca del 75 % del lienzo, vista de 3/4 desde arriba, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego. |
| `item-postigo.png` | C4 · bloque **660** · `postigo` → `src/assets/items-gpt/postigo.png` | Ícono de videojuego en estilo plano (flat) de postigo (bloque). Una ventana de postigo de madera pintada de azul celeste con dos hojas abiertas hacia afuera, con una reja de palitos y un marco blanco; vista de frente. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. Un solo objeto centrado, ocupando cerca del 75 % del lienzo, vista de 3/4 desde arriba, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego. |
| `item-banca_corredor.png` | C4 · bloque **661** · `banca_corredor` → `src/assets/items-gpt/banca_corredor.png` | Ícono de videojuego en estilo plano (flat) de banca de corredor (bloque). Una banca larga de madera clara de tablones con dos patas gruesas y respaldo bajo, con una maceta con flores rojas a un lado; vista de 3/4. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. Un solo objeto centrado, ocupando cerca del 75 % del lienzo, vista de 3/4 desde arriba, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego. |

**Conteo:** 26 pedidos (10 ítems de C1 y 2 bloques, 3 ítems de C3, 4 ítems y 7 bloques de C4). Los íconos se verifican con la lista de `PEDIDOS_ARTE_LOTE1.md` §4 y se conectan por la carpeta `items-gpt` de ese mismo documento (§5).

---

## Resumen de riesgos transversales

| Tanda | Balance / plata | Rendimiento | Guardado |
|---|---|---|---|
| **C1** | Sin plata nueva (nada de lo hecho se vende; sal ≈ ₡250 por día); el gasto de comida real sube un poco | Una entidad por fogata (barato); `dia` en la pila | **Sin `SAVE_FORMAT`** (campos opcionales) |
| **C2** | El rodar alivia, la cojera y el botiquín nuevo suben; neutro | Solo animaciones | **Ninguno** |
| **C3** | Capote ₡15 000 + cobija; cultivos +25 %/−15 %: **medir** `ventaDia` en las dos estaciones | `g.cuerpo` 1/s, repiqueteo solo bajo zinc | **Ninguno** (la estación sale del día) |
| **C4** | Feria +25 % un día de siete, concurso ≤ 20 unidades, plano ₡12 500, TRAE del zaguate ≤ +1 unidad/día | **`rutinas.js` es lo único pesado** (1 Hz, 40 mobs, 40 bloques) | `meta.zaguate`, `meta.carretaPintura`, `meta.feria` opcionales; el generador pide `genVersion` |

**Orden sugerido:** C2 (sin riesgo) → C1 → C3 → C4. **Cada tanda** corre `tools/revisar-recetas.mjs` y `revisar-nombres.mjs` en 0, pasa por `bot-economia` si toca plata y deja la libreta y la ayuda al día.
