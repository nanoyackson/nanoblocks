# Revisión de la v12.7.0 «Pesca a fondo», v12.7.1 «Doña Lía y las fragatas» y v12.7.2 «Mariscos y la veda» (encargo 41)

Solo lectura, sobre `10fd907`, `37ec947` y `766f96e` (HEAD). Leí completo `src/pesca.js` y los diffs de `blocks.js`, `game.js`, `mar.js`, `monte.js`, `redes.js`, `torneo.js`, `pezvela.js`, `turistas.js`, `arrecife.js`, `fauna.js`, `pueblo.js`, `recipes.js`, `despensa.js`, `encargos2.js`, `textures.js`, `version.js` y `tools/bot-economia.js`; contrasté las tablas con `PREPARACION_C5_Y_JEFES_F2.md` §1.5 y el diseño §C5-A. Recorrí con `grep` todos los sitios donde sigue escrito un `357` o una lista de pescados. **No corrí el juego**: lo visual y lo de medir va «por confirmar».

## Resumen

Las **tablas de pesca coinciden con la §1.5** (salvo el arrecife, que cambió a propósito), la **carnada solo se gasta al recoger una picada** y el registro `esCana`/`esPescado` quedó **bien puesto**: no encontré ningún `357` suelto ni un pescado sin registrar. Lo que sí falla: **un comentario se tragó dos oficios de los encargos**, **el bot de economía quedó desfasado del código** (así que su «techo de 2.2 jornadas» no certifica nada), **la zona se detecta con un muestreo con huecos** y **el agotamiento por celda se esquiva sin esfuerzo**. Además, el arreglo de los íconos que dejé pendiente **sí se cerró** (los ítems del rango nuevo ya tienen dibujo).

## Los 5 más importantes (en orden)

### 1. Un comentario se tragó `panadera` y `carnicero` en `PIDE` — `src/encargos2.js:18`

La línea quedó así (una sola línea de fuente):

```js
sodera: [361, 363, 262, 287], sodera_playa: [361, 363, 366, 1105, 1106, 1112], // v12.7.0: las especies nuevas baratas (no atún ni langosta) panadera: [263, 287, 292], carnicero: [262, 271],
```

Todo lo que viene después del `//` **es comentario**: `PIDE.panadera` y `PIDE.carnicero` **ya no existen**. `oficios(v)` (`encargos2.js:55`) filtra los oficios del pueblo con `PIDE[x]`, así que **las panaderas y los carniceros dejaron de generar encargos** en el tablón (pan, tortillas, carne y cuero), y un pueblo que solo tenga esos oficios cae en «vecino». No da error ni aviso: simplemente cambian los encargos de todos los pueblos con panadería o carnicería.
**Arreglo:** mover el comentario al final de la línea (o a una línea aparte). **Prueba barata:** `tools/` que falle si `Object.keys(PIDE)` pierde una clave que había (la lista de oficios con tienda en `SHOPS`).

### 2. El bot de economía quedó desfasado del código: su «techo de 2.2 jornadas» no certifica nada — `tools/bot-economia.js`

La v12.7.1 agregó `PESCA` y `perfilPescador` **copiando las tablas**, y la v12.7.2 cambió el código sin tocar la copia:

| Dato | En el código | En el bot | Efecto |
|---|---|---|---|
| Tabla del arrecife | pargo mancha .20, pargo .28, corvina .24, **pez gallo .10, dorado .06** (`pesca.js:28`) | …, **ostión .08, pez gallo .08** | el bot paga ostiones que la caña no saca |
| Nasa del arrecife | `media: 420`, langosta **.03**, bota .17 (`pesca.js:148`) | `media: 360`, langosta **.04**, sin bota | 17 % más presas y más langosta |
| Nasa del estero | camarón .5, róbalo .2, tilapia .2, **bota .1** | sin bota | |
| Cupo del comprador | **por pueblo y por ítem** (`ui.js:1386`, v12.5.1: 30 u por pueblo y producto) | `CUPO = 30` **por puesto** (`venderConCupo`) | el bot frena donde el juego no frena: casi toda la pesca (≤ 30 u por especie) **sale sin cupo** |
| Basura | oro de naufragio (1.5 %, 1–2 piezas) | «vale 0 en el muelle» | la **pulpería lo compra a 10 u** (`[259, 1, 10]`): ≈ **+6.5 u/día** que no cuenta |
| Lujo | excluido (`SIN_LUJO`) | | el restaurante paga atún 6, pez gallo 3, langosta 8 y langosta gratinada 18: no se modela |

Y **no modela** lo que sumó la v12.7.2: **cocina** (sopa, arroz, langosta gratinada), **ostión** (6 por día con 5 % de perla), **piangua** ni el secadero. Mi cuenta aparte (📏 estimación, con los precios de `SHOPS` de hoy y 8 minutos de pesca por día):

| Fuente | u/día |
|---|---|
| Pesca de orilla con sardina o altamar | ≈ 52–62 (con el oro) |
| 6 nasas (río 17, estero 18, arrecife 19) | ≈ 17–19 |
| Perla de la caña (1 %) | ≈ 5 (ya la cuenta el bot) |
| Ostión (6/día × 1 u) + perla (6 × 5 % × 18 u) | ≈ 11 |
| Cocina: sopa de mariscos, vendida a 6 u contra ≈ 2 u de insumos; arroz con camarones, 5 u contra ≈ 2.5 u | **+15–20** sobre venderlo crudo (lo limita el camarón: 6 nasas de estero dan ≈ 12 camarones/día) |

Total posible: **≈ 100–110 u/día (≈ 4 jornadas)** frente al «techo» de la preparación (**2.2 jornadas = 57 u**). La sopa, el arroz y los mariscos suben mucho el valor de lo mismo que ya se pescaba. **No es un fallo de código**, pero el criterio `pescador y artesano a menos de 2.3 jornadas` del bot **pasa en verde sin medir todo eso**.
**Arreglo:** que el bot **importe** `ZONAS`, `NASA` y `PESCADOS` de `pesca.js`/`blocks.js` (no copiarlos), use el cupo por pueblo e ítem y sume cocina, ostión y oro. Decisión para nanoyackson: ¿el techo de 2.2 jornadas cuenta nasas y cocina o solo la caña?

### 3. La zona se detecta con un muestreo con huecos (altamar y arrecife) — `pesca.js: zonaDe` (líneas 46–57)

- **Altamar a 140 bloques de tierra.** Se prueban anillos cada 10 bloques con **16 ángulos**: a 140 bloques las muestras quedan a **≈ 55 bloques** una de otra (2π·140/16). **Un islote o una roca de menos de ~50 bloques de ancho entre dos muestras no se ve**: el jugador queda en «altamar» (y gana el atún) a 20 bloques de tierra. A 20–30 bloques el hueco es de ≈ 8–12 bloques: ahí sí se ve casi todo. Además cuesta **224 llamadas a `gen.column`** (14 anillos × 16) en cada lanzamiento al mar (puede ser un tirón de milisegundos; **por medir**). El jugador solo llega a 140 bloques con el bote: la condición `g.riding.kind.boat` es correcta (el bote de remos y la lancha son el mismo mob `bote`, `mar.js:264`, `boat: true`; **también** la «lancha del canal» de Tortuguero).
  **Arreglo:** 24–32 ángulos hasta 60 bloques y 16 después, o guardar la «distancia a tierra» por celda de 32 bloques en una tabla pequeña (se calcula una vez).
- **Arrecife.** Busca coral vivo en una rejilla de **7 × 7 columnas con paso 2** y **11 de profundidad** (49 columnas, ≈ 540 lecturas). Un coral aislado de 1 bloque en una columna impar **se pierde**; un parche de 2 × 2 casi siempre se ve. **Los corales blanqueados no cuentan** (`coral_blanco` no está en `vivos`): en un mundo de generador 20 donde el arrecife está blanqueado, **ahí se pesca «orilla»** hasta revivirlo. Es coherente con el tema, pero conviene decirlo (la ayuda y el libro hablan de «cerca de coral»).
- **Lagos de montaña y volcán.** `bio !== 'ocean' && bio !== 'beach'` ⇒ río o río frío: **la laguna ácida del Poás** (`FLUID === 1`) da **trucha**, y las aguas de un cráter alto, también. Detalle, no grave.
- **Costa que no es `beach`/`ocean`.** Una ensenada donde el bioma de la columna es otro (p. ej. bosque seco con agua de mar) cuenta como **río**. Por confirmar si el generador lo permite.
- **Sin la caña de la zona** (`zonaConCana`) cae a la zona más cercana que sí alcanza (altamar → orilla; arrecife → orilla): ✔ coincide con el diseño y con la §1.5. El logro `altamar` solo sale con `f.zona === 'altamar'` ✔.

### 4. El agotamiento por celda de 48 se esquiva moviéndose casi nada, y casi no se activa donde importa — `pesca.js: pescar` (líneas 97–101)

- **La celda es la de la boya, no la del jugador**: `floor(f.pos.x / 48), floor(f.pos.z / 48)`. Basta **parar junto a una línea de la cuadrícula** y lanzar un poco a cada lado (o más lejos y más cerca) para que cada lado lleve **su propio contador de 10**; **en una esquina son cuatro celdas**. Moverse **1 bloque** no basta (la boya cae a 10–25 bloques), pero **ponerse a 20 bloques de una línea y lanzar a distinto alcance** sí. Cada celda aporta otras 10 piezas buenas por día: con dos celdas, 20; con cuatro, 40.
- **Casi no se activa.** `BUENOS = {364, 1107, 1109, 1110, 1111, 1112}` y el contador solo sube con esas especies: **río y río frío no tienen ninguna** (nunca se agota), la orilla tiene dos al 5 % (dorado y pez gallo: ≈ 3 por día) y solo **altamar** (28 % de las capturas), el estero y el arrecife llegan a 10 en una sesión. Es decir: **el freno solo corre en las zonas caras**, que es lo que se quería, pero sin pensar en la esquina.
- **El efecto al agotarse es leve**: quita las especies buenas de la tabla y deja lo común y la basura; la pesca sigue (ahora peor pagada).
- **Arreglo sencillo:** contar por **la celda de la boya y sus 8 vecinas** (o por un círculo de 48 bloques centrado en la boya, guardando las últimas posiciones del día), o por **zona y día** además de por celda. **La poda** (`cel.length > 60`) borra las celdas de otros días: ✔.

### 5. La nasa en el mar abierto saca peces de río, y la séptima nasa queda puesta e inerte — `pesca.js: zonaNasa`, `monte.js: registrarMonte`

- **`zonaNasa`** devuelve `'estero'` si el bioma es manglar, `'arrecife'` si hay coral vivo a ±4 y **`'rio'` en todo lo demás**, también el **mar sin coral** (orilla, bahía). Esa nasa ahora saca guapote, machaca y tilapia (agua dulce) **en agua salada**; antes de la v12.7.2 sacaba pargo y corvina. Las nasas viejas (sin `zona`) conservan la tabla de siempre, así que **las nuevas rinden menos en el mar que las viejas**. **Arreglo:** `bio === 'ocean' || bio === 'beach'` ⇒ la tabla de la orilla (pargo, corvina, camarón), o una zona `'orilla'` en `NASA`.
- **El tope de 6.** `registrarMonte` cuenta **todas** las nasas de `meta.monte`, también las de chunks sin cargar que ya no existen (`tickMonte` solo olvida las entradas cuando el chunk está cargado); si el jugador destruye una lejos, **la cuenta se queda alta** hasta volver. Al llegar al tope, **la nasa se pone igual** (el ítem se consume y el bloque queda) pero **no se registra**: no pesca, y el mensaje dice «recoja una», sin decir que **esa misma** no sirve; si se recoge otra, la inerte sigue inerte. **Arreglo:** rechazar la colocación (`return false` desde `Stations.place`) o registrarla cuando haya hueco.
- **Nasas viejas.** Siguen andando (sin zona, MEDIA 300 y la tabla de antes) y **cuentan** para el tope: un mundo con 10 nasas conserva las 10 pero no deja poner más. ✔ razonable.
- **Valor de las nasas nuevas** (precios del muelle): río 0.70 u por presa ⇒ **≈ 17 u/día con 6**; estero 0.75 ⇒ **≈ 18**; arrecife 1.10 (420 s, langosta .03) ⇒ **≈ 19**. Coinciden con la propuesta de la preparación (17/20/28 → 17/18/19 tras bajar la langosta y subir a 420 s) ✔. La nasa guarda **6 piezas como máximo** (`CUPO`): obliga a pasar cada ~2 días.

## Lo demás, por tema

### A. `pesca.js` y las tablas contra la §1.5

| Zona | §1.5 | Código | Veredicto |
|---|---|---|---|
| Río | guapote .36 · machaca .28 · tilapia .24 | igual | ✔ |
| Río frío | trucha .30 · guapote .28 · machaca .20 · tilapia .10 | igual | ✔ |
| Estero | róbalo .22 · sábalo .12 · corvina .20 · tilapia .16 · guapote .18 | igual | ✔ |
| Orilla | corvina .40 · pargo .38 · dorado .05 · pez gallo .05 | igual | ✔ |
| Arrecife | pargo mancha .20 · pargo .28 · corvina .24 · **ostión .08 · pez gallo .08** | pargo mancha .20 · pargo .28 · corvina .24 · **pez gallo .10 · dorado .06** | ✔ cambio razonable (el ostión es de buceo y nasa); el bot no lo sabe (punto 2) |
| Altamar | pargo .32 · corvina .28 · pez gallo .12 · dorado .10 · atún .06 | igual | ✔ |
| Basura 12 % | perla 1, oro 1.5, bota 6, palitos 2, botella 1.5 | `lootZona`: .01 / .025 / .085 / .105 / .12 | ✔ exacto; el sorteo de la tabla va sobre el resto (`sortear` normaliza) |
| Cañas | no aceleran picadas | no tocan `biteAt` | ✔ (como pidió la §1.5) |
| Carnada | sin ella ×1.4 de espera | `alCaerAgua`: `biteAt × 1.4` | ✔ |
| Trucha «de noche y en invierno ×1.5», pez gallo «en verano», atún «al mediodía» (diseño A.3) | — | **no están** | decisión: la preparación los dejó fuera; no es fallo |
| Pez vela solo con la de altamar | — | `pezvela.js:46`: `held.id !== 1101` | ✔; **no exige bote ni altamar**: con la caña de altamar desde la orilla en agua honda (`h ≤ SEA − 8`) sale igual (antes pasaba con cualquier caña) |

- **La carnada que se gasta sin picar:** **no** pasa. `inv.remove(f.carnada, 1)` está **dentro de `pescar`**, que solo corre al recoger con `f.state === 'bite'`. Recoger antes de tiempo o perder la ventana (1.3 s) **no gasta nada**. **Dos detalles:** (a) se gasta también si lo que sale es una **bota o palitos** (es «el anzuelo ya fue»; aceptable); (b) la carnada se **elige al lanzar** y se **consume al recoger**: si el jugador la suelta entre medio, `remove` no hace nada y pesca **sin pagarla** (trivial); (c) si sale **pez vela** (`quizaPezVela` retorna antes de `pescar`), **no se gasta carnada**.
- **Señuelo:** `s.dur ?? 60`, `stack: 1` ✔; la receta da **3 señuelos por 1 pez + palo + cabuya**.
- **Libro del pescador** (`libroPescaHTML`): 12 especies; el récord usa `LARGO` y el nivel de pesca ✔; `P(g)` crea `meta.pesca` si falta ✔ (mundos viejos).
- **Tirones:** `zonaDe` solo corre al caer la boya; no hay costo por cuadro.
- **Los íconos pendientes del informe anterior:** ✔ **cerrados**: `textures.js` pinta `fragmento_coral`, `estaca_nido`, `banderita_azul`, `cabuya`, `lombriz`, `senuelo`, `camaron`, `piangua`, `ostion`, `langosta` y `langosta_gratinada`; `libro_encargos` usa el ícono del libro de recetas; las especies nuevas y los platos usan `icono`/`tinte` de otro ítem.

### B. Economía de la v12.7.2

| Punto | Veredicto |
|---|---|
| **Nasas: 6 y cada 420 s (arrecife)** | ✔ aplicado (río y estero 300 s). Ver punto 5 |
| **Piangua: 6 por mata, 3 días, veda** | La «mata» es una **celda de 4 × 4 bloques** (`t.x >> 2, t.z >> 2`), no un árbol: un manglar tiene muchas celdas, así que **no hay tope por zona** (solo 6 por celda cada 3 días). Vale 0.25 u: **no importa en plata**, importa para la sopa (2 por plato). La ventana de 3 días arranca **en la primera recogida** y no se renueva. **Veda:** días 11–14 de cada mes de 30 ✔ (`(día − 1) % 30 ∈ [10, 13]`), **−1 de fama por cada piangua** recogida (hasta −6 por celda), solo en supervivencia; en creativo no hay castigo pero sí piangua. El aviso sale una vez por veda y solo si se está en manglar o playa |
| **Ostión: 6 por día, 5 % de perla** | Cada intento marca el bloque 3 días (`M.fondo`); el tope diario cuenta **éxitos** (35 % por intento): los intentos son gratis y rápidos. Valor: 6 × 1 u + 0.3 perlas × 18–25 u ⇒ **≈ 11–13 u/día**. **No exige bucear**: basta `body.inWater` (nadando en la superficie sobre 3 bloques de arena) y la careta en el inventario |
| **Secadero: ¿rompe la comida?** | **No.** El pescado seco vale **4** de comida, dura 30–60 días y no se vende (ninguna tienda lo compra; `valorRef` cae a 0.3). El **pescado salado** del fogón (`565`) ya daba **6** de comida y duraba 14–28 días con la misma receta (pescado + sal): el seco es **peor y redundante**, solo más duradero. Efectos laterales: `comidaFuerza` exige `valor ≥ 3` y el seco es 4 ⇒ **da el buff de fuerza menor**; **cuenta como comida distinta** para `comerVariado`. El secadero cuesta 3 caña brava y 2 palos y seca 4 piezas por 1 sal cada una |
| **Platos nuevos contra `precios.js`** | `precios.js` no cambió (sin `ANCLAS` nuevas) ✔. Compra del soda de playa: **sopa 6 u, arroz 5 u**; chef de lujo: **langosta gratinada 18 u**, atún 6, langosta 8. Comida: sopa **12**, arroz **10**, gratinada **14** (el casado, 16; el pescado frito, 8): **son de lo mejor del juego por insumo**, pero la comida de lujo del casado sigue por encima. **El diseño decía sopa 12 y arroz 11 u: están a la mitad** (6 y 5); coherente con querer frenar el ingreso |
| **¿Ciclo de compra y reventa?** | **Ninguno nuevo.** Lo que se vende en el muelle (carnada 0.17–0.25 u, cañas 30 y 90 u) **nadie lo compra**; lo que se compra (especies nuevas) **nadie lo vende**. Persisten dos **viejos**: el dorado (muelle 5 u, **restaurante de lujo 8 u**, ≈ +3 u por pieza hasta 30 u/día) y el pargo (muelle 1.5 u, lujo 2 u). Con el cupo por pueblo e ítem son ≈ 11 y 7 u/día, como antes |
| **Cañas: ¿valen lo que dice la tienda?** | **No.** La caña de fibra cuesta **30 u** en el muelle pero se hace con 3 caña brava, 2 cabuya y **1 hierro**; la de altamar vale **90 u** y se hace con **4 hierro + 1 cabuya + 1 cuero** (≈ **7 u** de materiales; el diseño decía 6 hierro). Con la caña de altamar a 7 u y el bote de remos (`['P P','PPP']`, tablas) **la «inversión de 210 u»** de la preparación **no existe**: el que junta hierro se salta el gasto |
| **Cocina** | `cook(1117…)`: sopa con **5 variantes de pez**; langosta gratinada **sin el nivel de cocina 5** que pedía el diseño. Los mariscos crudos (`1113–1116`) están en `PESCADOS`: se pudren y **caen mal crudos** (30 % de «panza» con cocina < 5), como el pescado |

### C. `esCana` / `esPescado`: ¿queda algo suelto?

- **`357` suelto:** solo en **lugares legítimos**: la tienda (`pueblo.js:244`, el muelle vende la caña), la receta (`recipes.js:66`), el botín de un cofre (`estructuras.js:233`), `CANA` y la prueba `giveItem(357)` de `pezvela.js:126`. **`game.js` (lanzar y soltar), `pezvela.js` y `torneo.js` usan `esCana`** ✔ (el torneo abre con cualquiera de las tres cañas).
- **Pescados con id escrito:** **no queda ninguno** en `comodidad`, `expediente`, `fuerza`, `plato`, `game` (comer y «panza»), `finca` (el gato y `feedForLove`), `despensa` (`VIDA`: también la lombriz y la sardina), `recipes` (sal) ni `supervivencia2` (fogata). Las listas que **no** incluyen las especies nuevas **a propósito**: `panga.js: PESCA` (vende solo los de siempre) y el `mar.js` viejo (`fishLoot`, ahora solo el respaldo: la boya siempre trae zona).
- **Huecos menores:** (a) **`arrecife.js: PECES = [361, 363]`** (la pecera solo acepta pargo y guapote vivos): el **pargo mancha** (`1112`) sería lo natural; (b) `torneo.js: PESOS` no tiene mariscos (no se pescan con caña: ✔); (c) la **lombriz y la sardina** se pudren (2–4 días) en la barra: pueden convertirse en «Sobras» si se llevan mucho; **por confirmar** que sea lo buscado; (d) `CRUDO_A_COCIDO` y `SMELT` no cuecen los mariscos (✔: se cocinan en el fogón con receta).
- **`PESCADOS`** incluye `1113–1116`, así que el **gato** los acepta (`feedForLove`): inofensivo.

### D. Doña Lía, las fragatas y el +25 % de los turistas

- **¿Se acumula con otros bonos?** **No.** El +25 % de la banderita azul va **solo sobre `T.pago`** (el pago base del turista: `20 + distancia/12`), **no** sobre la propina, y **no** pasa por `cobrarDelTope` ni por ningún cupo (`turistas.js` nunca tuvo tope). `conBanderita` es permanente: `meta.tortugas.liberadas ≥ 100`. Los buzos (10 u/día) **sí** pasan por el tope compartido; los turistas, **no**: el +25 % se suma a una fuente ya sin tope (≈ 20–60 u por viaje). **Decisión:** dejarlo o pasarlo por `cobrarDelTope`.
- **Doña Lía** (`quizaDonaLia`): no da plata ni bono; solo diálogo. Aparece de noche en **playa** la noche de la arribada y la quinta noche (la de los nacimientos), a 6 bloques del jugador; se va si el jugador se aleja > 40 bloques; **una sola** a la vez. Su función `alHablar` vive en `m.data`: si el juego **guarda** los vecinos invocados, la función se pierde y quedaría un «vecino» llamado «Doña Lía (voluntaria)» sin su diálogo (**por confirmar** que esos mobs no se guarden). Cuesta un `mobs.find` por segundo: nada.
- **Fragatas** (`quizaFragatas`): al nacer un nido protegido, **hasta dos** intentos de 45 % (tope de 3 vivas); cada una se lleva **una** tortuguita y huye; se va sola a los 50 s. El peor caso es **2 de 8–12** (≈ 17–25 %, el «22 %» de la tarea); **el valor esperado es ≈ 0.9 tortuguitas por nido (≈ 9 %)**. Espantarlas es un golpe (4 de vida). Como solo cazan tortuguitas con `deNido` (de nidos protegidos), **no** afectan a las de la baula ni a las del parque ✔. Se **acumula** con el 30 % de las que se desvían por las antorchas (`desviada`), pero cada una cuenta aparte: el pago por tortuguita al agua baja con ambos, y la banderita de las 100 tarda un poco más.
- **Mantarrayas con 150 corales** (`arrecifeRico`): +1 mantarraya y el doble de probabilidad cerca del arrecife revivido; sin costo notable.

### E. Mundos viejos y `MIN_IDS`

- **Firma:** `MIN_IDS = { bloques: 324, items: 348, hash: '83d9634f', version: '12.7.2' }` y `MIN_VERSION = '12.7.2'`: ✔ coherentes (`MIN_IDS.version === MIN_VERSION`, lo que vigila `revisar-version.mjs`). **+1 bloque** (el secadero, `670`) y **+21 ítems** (1100–1120 menos los de C5-B) ✔. La prueba `revisar-ext-item.mjs` ya busca el primer id libre (`while (ITEMS[id]) id++`): ✔, el `1100` dejó de estar libre.
- **Un mundo de la 12.6.x abierto en la 12.7.2** sube su `minVersion` a 12.7.2 al guardarse: **ya no abre en un juego anterior**. Normal; conviene decirlo en el changelog.
- **Nasas viejas:** funcionan (sin `zona`: tabla y MEDIA de siempre), cuentan para el tope, y pueden ser **más de 6**. **Sin `meta.pesca` ni `meta.mariscos`:** se crean al usarlos (`P`, `Mar`).
- **Entrada hostil:** `meta.pesca.celdas`, `meta.mariscos.matas/fondo` y `meta.monte` **no se validan al importar** (no los encontré en `importar.js`): una celda con `n: "x"` o `NaN` hace que el agotamiento no frene; una `mata` con `n: NaN` da **piangua sin límite**; un `meta.monte` con un `null` hace tirar `registrarMonte` (`q.tipo`) y `tickMonte` (`q.x`). Conviene un filtro como el de `A()` en `arrecife.js` (`numeros()` y `typeof`). **Por confirmar** si `validarMundo` recorta `meta` en general.

## Pruebas pendientes (para quien construya, en tab-1)

1. `PIDE`: en un pueblo con panadera y otro con carnicero, el tablón ofrece **pan, tortillas, carne o cuero**; una prueba de `tools/` que lista `Object.keys(PIDE)`.
2. **Bot:** que importe `ZONAS`/`NASA`/`PESCADOS`, use cupo por pueblo e ítem y corra con cocina, ostión y oro; `E.correr()` en el navegador y comparar con mi estimación (≈ 100 u/día posibles).
3. **Zona:** una boya en el mar a 20 y 60 bloques de un islote de 8 bloques (¿«altamar» o «orilla»?); en un arrecife de un solo coral; sobre coral blanqueado; en la laguna del Poás; en una ensenada.
4. **Altamar:** el tiempo de `zonaDe` con el medidor (224 `column`); con bote de remos a 140 bloques de la costa **sin** la caña de altamar (debe dar orilla).
5. **Agotamiento:** junto a una línea de la celda de 48, 10 piezas buenas a cada lado: ¿se agota cada lado por separado? Pasar los 10 en altamar: «lo grande se fue».
6. **Carnada:** recoger sin que pique, perder la ventana, dejar la lombriz en el suelo entre el lance y la picada.
7. **Nasa:** una en el mar sin coral (¿tabla de río?), 7 nasas (la séptima), romper una nasa con el chunk descargado y contar.
8. **Piangua y veda:** el día 11, 6 piangua en una celda y la caída de la fama (−1 por piangua); la 7.ª no sale; a los 3 días vuelve.
9. **Ostión:** a 6 éxitos al día; sin careta no sale; sobre el agua sin bucear.
10. **Secadero y cocina:** pescado + sal ⇒ 3 días; sopa y arroz en el fogón; el precio de venta (6 y 5 u) contra el cupo de 30 u; la langosta gratinada en el restaurante.
11. **Turistas:** una excursión con y sin la banderita azul (+25 % del pago base, sin la propina).
12. **Mundo viejo:** abrir uno de la 12.6.x con 10 nasas puestas; guardar y reabrir; importar un mundo con `meta.mariscos.matas = { "0,0": { n: NaN } }`.

*Escrito por la sesión investigadora, solo lectura. No toqué `src/` ni `tools/`.*
