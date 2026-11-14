# Revisión de la v12.6.4 «Agua que se nota», v12.6.5 «El arrecife se ve» y v12.6.6 «Cómo se agarran las cosas» (encargo 40)

Solo lectura, sobre `fdaa2ca`, `b42e075` y `7b2f89c` (HEAD). Leí los diffs de `src/agarre.js`, `src/avatar.js`, `src/game.js`, `src/models.js`, `src/plata.js`, `src/encargos2.js`, `src/arrecife.js`, `src/fauna.js`, `src/mesher.js`, `src/world.js`, `src/atmosfera.js` y `tools/hoja-mano.js`; **corrí `tipoAgarre` sobre los 650 ítems y bloques** del catálogo y abrí las 11 hojas `docs/capturas/v12.6.6/mano-01..11.jpg`, `v12.6.5/orilla-diagonal-medio.jpg` y `tortilla-despues.jpg`. **No corrí el juego**: lo visual va «por confirmar».

## Resumen

Lo más serio es de **contenido y clasificación**, no de código: cinco ítems del rango nuevo **no se ven en la mano** y el clasificador de agarre sigue engañándose con el nombre en media docena de ítems y con los tamaños de escudos y objetos grandes. Del agua, la v12.6.4 **arregló de verdad** el defecto de la orilla que marqué en la revisión anterior (profundidad y orilla ya van en dos varyings). `cobrarDelTope` está bien (sin doble conteo y con reinicio correcto) y la limpieza de nidos **no cuesta casi nada por tic**.

## Los 5 más importantes (en orden)

### 1. Cinco ítems no se ven en la mano, ni en primera ni en tercera persona — `docs/capturas/v12.6.6/mano-11.jpg`

En la última hoja, los ítems **1121 `fragmento_coral`, 1124 `estaca_nido`, 1125 `banderita_azul`, 1126 `cabuya` y 1187 `libro_encargos`** salen **vacíos**: la mano en puño sin nada (izquierda y derecha). No es un problema de agarre: `itemCanvas(id)` (`textures.js:884`) devuelve `spriteCanvases.get(id) || paintFlat(ITEMS[id])`, y `paintFlat` solo sabe pintar unas claves; **en `public/sprites/arte/` (128 archivos) no hay ícono de ninguno de los cinco**. Los dos mallados (`makeHeldItemMesh` y `heldMesh`) dibujan entonces una lámina transparente. Es exactamente lo que pasa con los ítems de C5-B y C8-A mientras no llegue su arte, pero **afecta a la jugabilidad**: el jugador planta un fragmento y marca nidos con «nada» en la mano. **Por confirmar** si en el inventario aparece algún marcador (no lo vi).
**Arreglo:** pedidos de arte (los íconos de C5-B y C8-A, ya listados en `PEDIDOS_ARTE`) y, mientras tanto, un **fallback visible** en `itemCanvas` (una bolsita o un cuadrito con la inicial) para que ningún ítem quede invisible; una prueba de `tools/` que falle si un ítem del catálogo no tiene sprite ni pintor.

### 2. El clasificador sigue buscando texto en el nombre: `chicharron` es un «recipiente» — `agarre.js: RECIPIENTE`

La regex `RECIPIENTE` tiene la alternativa `chicha` (la bebida) y **`397 chicharron` la cumple**; `420 tres_leches` (un pastel) cumple `leche` y queda de pie «agarrado por la base» como una botella. Con `(^|_)olla` se arregló «collar», pero el resto de las alternativas **siguen siendo subcadenas sueltas** (`jar`, `chicha`, `cafe`, `leche`, `sopa`, `pipa`, `agua_`…). Recorrí el catálogo y estas son **las coincidencias de la regex**, con su veredicto:

| Id | Clave | Sale como | Debe ser | Por qué |
|---|---|---|---|---|
| 397 | `chicharron` | recipiente | **pequeno** | `chicha` ⊂ chicharrón |
| 420 | `tres_leches` | recipiente | pequeno (o plato) | `leche` |
| 416, 450 | `arroz_con_leche(_zenaida)` | recipiente | ok (se come en vaso) | — |
| 417, 392 | `sopa_negra`, `olla_carne` | recipiente | ok | — |
| 633 | `olla_caliente` (bloque) | no aplica (bloque) | — | — |
| 576 | `collar_cuero` | **pequeno** (arreglado) | pequeno | la hoja `mano-11` aún lo rotula «recipiente»: **está tomada antes del arreglo** (volver a sacarla) |
| 517, 521 | `sobre_marielos`, `sobre_estampas` | pequeno | **plano** | son sobres; `PLANO` no tiene `sobre` |
| 531 | `foto_vela` | pequeno | plano | una foto |
| 508 | `tablilla` | pequeno (en `PEQUENO`) | plano o pequeno | ok |
| 354–359, 370, 385–387 | `billete_*` | pequeno | pequeno | ok, pero planos de verdad |

**Tabla explícita propuesta** (la clave del ítem manda sobre las regex; las regex quedan solo para lo que no esté en la tabla):

```js
// v12.6.7: lo dudoso, a mano (la clave manda sobre las regex)
const EXPLICITO = {
  // comida que no es bebida ni recipiente
  chicharron: 'pequeno', tres_leches: 'pequeno', collar_cuero: 'pequeno',
  // papeles chicos
  sobre_marielos: 'plano', sobre_estampas: 'plano', foto_vela: 'plano',
  // herramientas de verdad (sin «damage» ni «tool» en el catálogo)
  martillo_tino: 'herramienta', catalejo_wilber: 'herramienta', cana_brava: 'herramienta', tranca: 'herramienta',
  // objetos grandes que no son herramienta
  tabla_surf: 'grande', parapente: 'grande', papalote: 'grande', bandera_circuito: 'herramienta', arco_cintas: 'grande',
  // escudos (son armadura con ranura): al antebrazo
  escudo_madera: 'escudo', escudo_hierro: 'escudo', escudo_jade: 'escudo', escudo_concha: 'escudo',
  // enormes como herramienta: mejor de frente y chicos
  bomba_espalda: 'grande', sello_goma: 'pequeno',
};
```
(`grande` y `escudo` son tipos nuevos: ver el punto 3). **Y una prueba:** `tools/revisar-agarre.mjs` que imprima el tipo de los 650 ítems y falle si cambia uno de una lista fija: hoy nada lo vigila, y cada ítem nuevo (C6, C7) entra por las regex.

### 3. Tamaños: escudos y objetos grandes salen diminutos; algunas herramientas, enormes — `agarre.js: AGARRES`, `TAM_3P`

De las hojas:
- **Escudos** (`399–401`, `560`): el catálogo no les da `tool`, `damage` ni `dur`, así que **caen en `pequeno`** (0.24 en primera persona, 5.5 px en tercera): **un escudo del tamaño de una moneda**. Además **las hojas no los muestran** (`hoja-mano.js` descarta los ítems con `armorSlot`; las cabezas salen porque `armorSlot` vale 0), así que **nadie los vio**.
- **Objetos grandes que salen chicos** (`pequeno`): `479 tabla_surf`, `476 parapente`, `473 papalote`, `478 bandera_circuito`, `488 arco_cintas`, `513 martillo_tino` (un martillo del tamaño de una cuchara frente al `403 mazo`), `516 catalejo_wilber`, `554 cana_brava`, `509 tranca`. Los vehículos (`358 bote`, `457 lancha`, `455 bicicleta`, `456 moto`, `477 avioneta`, `487 carreta_bueyes`, `414 carro_viejo`) en mano son como un juguete: aceptable, no lo cambiaría.
- **Enormes** (`herramienta`, tamaño 0.5): `522 bomba_espalda` (tan grande como el torso en `mano-09`), `520 sello_goma` (un sello como un martillo), `505 chancleta_zenaida` (las dos chancletas gigantes, `mano-08`) y **`357 cana_pescar`**, que **llena toda la celda** en ambas vistas (`mano-04`): como caña es razonable, pero en tercera persona sale de la hoja. La lista de herramientas por `dur` (`arco, mechero, honda, cerbatana, brocha, batea, bomba_espalda, gancho`) mezcla armas con cosas que no lo son.
- **Tapados:** en primera persona los papeles `plano` (`389`, `413`, `444`) ocupan media esquina inferior izquierda: **no tapan el centro** y se leen bien. Los ítems chicos en tercera persona quedan **detrás del puño** (5.5 px contra un puño de 4): son visibles por arriba, pero poco; es el costo del tamaño.
- **Girados / flotando:** no vi ninguno girado al revés ni flotando; **los cinco vacíos** son lo único anómalo (punto 1).

**Arreglo:** dos tipos nuevos en `AGARRES`/`TAM_3P`: `escudo` (≈ 0.42 / 9 px, pegado al antebrazo, girado de canto) y `grande` (≈ 0.40 / 9 px, de frente y a la altura de la cadera).

### 4. La migración de `R.vivos` cuenta cualquier coral de color puesto por el jugador — `arrecife.js: migrarVivos`

Respuesta a la pregunta: **sí**. `migrarVivos` recorre **todo** `world.mods` de la tierra y toma **cualquier** bloque con id de los cuatro corales de color (`coral_red/orange/yellow/purple`), sea cual sea su origen: un coral que el jugador **recogió y puso de adorno** (se pueden picar y colocar), uno **trasplantado** o uno nacido de un fragmento que **nunca fue blanco**. Lo único que lo frena es el tope: **hasta `revividos`** entradas, en el **orden de iteración del mapa** (el orden en que se cambiaron los chunks), no el real. Consecuencias: (a) corales de adorno lejos del arrecife pueden quedar «vivos» (dan fragmentos y anclan a los buzos) y los verdaderos quedar fuera; (b) el recorrido lee **todos** los cambios del mundo **de una vez, en el primer tic** de un mundo que tenga `revividos > 0` y poco `vivos`: en un mundo grande es un tirón de unas decenas de milisegundos, una sola vez; (c) la lógica de la posición `y`/`z` es correcta (`idx = x + z·16 + y·256` coincide con `world.js`).
**Arreglo barato:** filtrar por `y < SEA` **y** agua (`FLUID === 1`) en la celda de arriba (un coral de adorno en tierra o en un estante queda fuera), y repartir la migración en varios tics (por chunk). **No es grave** (los mundos de 12.6.0–12.6.2 son solo de prueba), pero conviene dejarlo escrito en el changelog.

### 5. El fundido con el agua del LOD funciona, pero **el alfa no converge**: queda una costura — `world.js` fragmento, `lejosA`

`uAgua = (0.5·R, 0.92·R, over)` con `R = renderDistance × 16` (`atmosfera.js`; `world.renderDistance` existe y se reescribe al cambiar la distancia, y la calidad automática también lo mueve, así que el fundido la sigue: ✔). El **color** sí converge: a más de `0.92·R`, el 80 % es el `COL.water` del LOD (`vec3(0.16, 0.34, 0.68)`, atenuado con la profundidad), y el Fresnel se apaga en un 85 % y el sol en un 60 %. **Pero el alfa no**: queda `mix(0.5, 0.78, prof)` (agua translúcida que deja ver el fondo cercano) mientras el LOD es **opaco**. En el borde, el fondo marino de los chunks cercanos (arena y coral) se ve **a través** del agua y, más allá, un azul plano: una **banda de transición de color**, sobre todo sobre arena clara y en Medio. **Por confirmar con una captura de la frontera** (la `orilla-diagonal-medio.jpg` es cerca).
**Arreglo (una línea):** `diffuseColor.a = mix(diffuseColor.a, 1.0, lejosA * 0.8);` junto a la mezcla de color.

## Lo demás, por tema

### A. `agarre.js` y las hojas (`tipoAgarre`)

- **Orden de la función:** bloque → `PEQUENO` → `HERRAMIENTA` → `tool|damage|bow|rod|machete|thrust|dur` → `PLANO` → `bucket|sip|drink|RECIPIENTE` → `pequeno`. Lo bueno: **`dur` ya no arrastra recipientes** (`!RECIPIENTE.test(k)`: la `batea` es recipiente) ni armaduras. Lo frágil: el orden. Un ítem con `dur` cuyo nombre no cae en la regex es **herramienta por defecto** (`bomba_espalda`, `sello_goma`, `brocha`, `gancho`).
- **Clasificación actual por tipo** (corrida sobre el catálogo): herramienta 52 (incluye las antorchas), pequeno 269, plano 14, recipiente 36. **Por regla:** las **armaduras** (pecheras, pantalones, botas, cascos) salen `pequeno`, que es razonable (el ícono en la mano).
- **Hojas.** Las 11 hojas cubren 6 bloques y unos 320 ítems; **no incluyen los ítems con `armorSlot` distinto de 0** (pecheras, pantalones, botas, escudos): **hay que agregar una hoja de armadura y escudos**.
- **Hoja desfasada:** `mano-11` rotula `576 collar_cuero · recipiente`; hoy la regla da `pequeno`.
- **Primera persona (`game.js: rebuildHand`):** `tipo === 'bloque'` o antorcha → cubito; el resto, `makeHeldItemMesh(id, T.tam)`; el hacha sigue girada aparte. El `agarre` de `makeHeldItemMesh` pasó de 1/5 a **1/8** del mango (más lejos del puño): sin riesgo.
- **`root.userData.tipo`** queda guardado pero **no lo lee nadie** (por confirmar con `grep -n "userData.tipo" src/`): borrarlo o usarlo para la animación del equipar.

### B. `avatar.js` en tercera persona (`heldMesh`)

| Tipo | Lado (px del muñeco) | Posición (px) | Giro |
|---|---|---|---|
| herramienta | 11 | `(2.5, -8, 2.6)` | `x = -0.35` (como antes) |
| pequeno | 5.5 | `(0.3, -12.2 + 0.42·5.5 = -9.9, 2.1)` | `x = -0.15` |
| recipiente | 6.5 | `(0.3, -9.5, 2.1)` | 0 |
| plano | 8 | `(0.3, -8.8, 2.6)` | `x = -0.7` |

El antebrazo mide **4 px de ancho y de fondo** (de `-2` a `+2` en `z`). Con eso:
- **`plano`:** el giro de `-0.7` rad manda la **arista de arriba a `z = 2.6 − 4·sin(0.7) ≈ 0`**: la mitad superior del papel **queda dentro del antebrazo** y solo asoma por los lados (el papel mide 8 px contra los 4 del brazo); **por confirmar a ojo**: en `mano-07/09` (`451`, `452`, `511`, `512`) el papel se ve «delante del brazo» pero con el borde de arriba cortado. Arreglo: `z = 3.4` o girarlo hacia el otro lado (`x = +0.5`).
- **`pequeno`:** el giro de `-0.15` deja la arista de arriba a `z ≈ 1.7`, o sea **0.3 px dentro** de la cara delantera del antebrazo: roce mínimo, puede titilar a distancia (z-fighting). Con `z = 2.4` se evita.
- **Cuerpo:** la mano cuelga a los lados; las láminas de hasta 8 px **se sobreponen 2 px al torso** solo si el brazo está pegado (reposo). No se ve en las hojas (están de frente).
- **Tamaño máximo:** `herramienta` 11 px es lo mismo de antes (sin regresión). Los 5.5 px de `pequeno` son **casi del ancho del puño** (4): se leen como «algo en la mano» y no como un bulto.
- **`this.heldObj.visible`** se apaga con parapente, surf y montura (`avatar.js:226`): sin cambio.

### C. El agua de la v12.6.4 y v12.6.5

| Punto | Veredicto |
|---|---|
| **El defecto de la orilla que marqué** (profundidad y orilla en un solo número interpolado) | ✔ **arreglado en la v12.6.4**: el vértice las separa en `vAgua = (profundidad 0–1, orilla 0/1)` y se interpolan cada una por su lado. Los rangos son compatibles (`prof × 0.05` llega a 0.40 < 0.45 del `step`, la orilla suma 0.5, los lados valen 0.4). **Nuevo costo en el mallador:** la profundidad pasa a ser **por esquina** (4 columnas × hasta 9 celdas por vértice), ≈ 160 lecturas por celda de superficie; un chunk de océano son ≈ 40 mil lecturas: despreciable (**no medí**) |
| **Aspecto en `orilla-diagonal-medio.jpg`** | La orilla se ve bien (turquesa claro a azul), pero **aparecen parches cuadrados oscuros y curvas de nivel** en la zona de profundidad media, de un bloque de lado: se ve «a cuadros». Viene de que la profundidad (0–8 bloques) **salta de a un bloque** por esquina y de ahí el `smoothstep`. **Por confirmar** si es el aspecto buscado; si no, suavizar con un promedio vecino o un `smoothstep` más ancho |
| **`uAgua` y el fundido con el LOD** | Ver el punto 5 |
| **El tope de alfa** | ✔ `0.5 → 0.78` según la profundidad (antes llegaba a 0.9): **se ve el arrecife**. Pero **no es un tope duro**: `a = max(a, fA·0.9)`, `max(a, sol)` y `max(a, espuma·0.92)` lo suben hasta **1.0** en el reflejo rasante, en los destellos del sol y en la espuma. Es lo buscado, pero conviene decirlo: de lejos y de lado el agua es **opaca** (hasta el 85 % de `fA`) |
| **Debajo del agua** | ✔ `abajoA = 0`: sin Fresnel ni sol, y el alfa vale **0.67 parejo** (`mix(0.5, 0.78, 0.6)`), sin profundidad. **Queda el color** según `profA` (de abajo el agua sobre una zona honda se ve más oscura): leve; por confirmar. Resuelve lo que dejé «por confirmar» (mirar al sol desde abajo) |
| **Atenuación con lluvia** | ✔ el brillo del sol `× (1 − 0.9·uAgua.z)` y **sin sol de noche** (`step(0, uSunDir.y)`). **El Fresnel y los rizos no cambian con la lluvia:** el agua bajo la lluvia refleja el cielo, que ya es gris (`uCieloHoriz` viene de `sky.js` con el nublado: **por confirmar**), pero sigue **lisa**: bajo el aguacero no hay «agua picada». Opcional: `nA.xz *= 1 + over·1.5` |
| **Costos** | Fragmento: 9 `sin`/`cos`, 4 `normalize`, 3 `pow`, 1 `reflect`, varios `mix`: algo más que la v12.6.2. **Sin medir**: la nota de `version.js` dice «menos de 0,1 ms» y **no hay medición guardada**. Pendiente: el medidor de GPU con `agua` encendida y apagada, Medio y Alto |
| **`R.vivos` de la v12.6.5** | ✔ se sanea (`POS` regex y tope de 400) ✔; la migración, punto 4 |
| **Vivero** | ✔ `bajoElMar`: toda la columna hasta `SEA` debe ser agua, sin `agua_celeste`: cierra la piscina subterránea. Cuesta hasta 62 lecturas por clic: irrelevante |

### D. `cobrarDelTope` en `plata.js` (encargos y buzos)

- **Sin doble conteo.** Los dos llamadores pasan por `cobrarDelTope` **una sola vez** cada uno: `cumplir` (`encargos2.js:162`) y los buzos (`arrecife.js:208`); `M.ganado += u` ocurre **dentro** de la función y **no** en `cumplir` (se quitó la línea que sumaba `a.pago` en la v12.6.5). `encargos2.js` ya no declara `TOPE_DIA` (no queda ningún otro uso en `src/` ni en `tools/`).
- **El reinicio del día** está duplicado pero es inocuo: `cumplir` revisa `M.dia !== hoy` **antes** (reinicia `ganado` y `hechosHoy`) y `cobrarDelTope` lo vuelve a revisar (ya es igual: no hace nada). Si **los buzos pagan primero** en un día nuevo, `cobrarDelTope` reinicia `ganado` **y `hechosHoy`** (la lista de encargos hechos): correcto, es un día nuevo. **El día cambia al final de la noche** (`game.js: time ≥ 1` y la siesta), así que no hay reinicio a media noche.
- **Objeto compartido:** `E2(g)` y `cobrarDelTope` operan sobre el **mismo** `g.meta.encargos2`: `cumplir` toma `M = E2(g)` antes de llamar y sigue usándolo después (`M.hechos`, `hechosHoy`): ✔. Si `encargos2` no existe (primer pago de los buzos), `cobrarDelTope` lo crea con `{ dia, ganado, hechosHoy }` y `E2` completa `activos` y lo demás después ✔; `tickEncargos` ahora lo ve (`if (!g.meta.encargos2) return` deja de cortar): trabajo de un `filter` por segundo, sin efecto.
- **Entrada hostil:** un `u` **no finito** haría `M.ganado = NaN`; la siguiente llamada lo detecta (`!Number.isFinite`) y reinicia: sin efecto. Un `u` negativo **bajaría** `ganado` (no hay llamador así hoy; las tandas nuevas deberían pasar `Math.max(0, u)`).
- **Pendiente para C6/C7/C8:** el módulo ya es el lugar correcto. Falta que **el premio de un solo uso** (red sísmica, Comité) tenga su propia función (`pagarFueraDelTope`) para que nadie lo mande por aquí por error.

### E. La limpieza de nidos huérfanos (`fauna.js: tickNests`, `arrecife.js: tickTortugasArrecife`)

- **Costo.** `tickNests` corre **una vez por segundo** (`nestT`) y ya recorría **todas** las entidades de bloque de **todos los chunks** (`for … of w.blockEntities` con `ck.split(',')` por chunk): eso es lo caro, y **ya existía**. El chequeo nuevo es **un `getBlock` por nido** (solo cuando `be.type === 'nest'`, después del `continue` de las demás clases): un acceso a un arreglo por nido. Con **1 000 nidos** son ≈ 1 000 accesos por segundo: **despreciable** (microsegundos). El de `tickTortugasArrecife` (`'nido'`) solo corre **de noche** y tiene el mismo costo.
- **Lo que sí se nota** es que el recorrido de **todas** las entidades de bloque (cofres, puertas, camas, hornos) se hace **cada segundo** aunque no haya un solo nido: con decenas de miles de entidades sería ≈ 1 ms por segundo; **no es nuevo ni grave**. Mejora fácil: un `Set` de las posiciones de nidos (`g.nidos`) y recorrer solo ese.
- **`return` tras el primer nacimiento** («de a una por cuadro»): como se llama **una vez por segundo**, con 40 nidos que cumplen se tarda **40 segundos** en nacer todos, y la limpieza de huérfanos **de los chunks siguientes se pospone** hasta terminar. No es un fallo (los huérfanos no estorban), solo que el comentario dice «por cuadro» y es **por segundo**.
- **Corrección de fondo:** la limpieza **depende** de que el bloque no sea `K.turtle_nest` / `K.nido_marcado`; al **marcar**, `usarArrecife` cambia el bloque **y** la entidad en la misma llamada (el `setBlock` va antes que el `setBE`), así que el tic nunca ve el estado intermedio ✔.
- **`be.lora` y la quinta noche:** ✔ `eclosiona` ya es el día + 5 para todos los de la lora y los nidos de la v12.6.1 sin `eclosiona` toman `dia + 5`; marcar toma esa fecha («la del nido, no la de marcarlo»), con el aviso «en N noches» ✔.

## Pruebas pendientes (para quien construya, en tab-1)

1. **Hoja de la mano completa** otra vez: sacar `mano-01..11` con el código final, **más una hoja de armadura y escudos** (`armorSlot ≠ 0`); ningún ítem vacío.
2. **Los cinco ítems nuevos** (1121, 1124, 1125, 1126, 1187): con ícono o con el fallback; en primera y tercera persona.
3. **La tabla explícita:** `chicharron` y `tres_leches` agarrados de frente, **escudos** al antebrazo, `martillo_tino`, `tabla_surf` y `parapente` de buen tamaño; `bomba_espalda` y `sello_goma` no enormes.
4. **Tercera persona (F5):** papeles (`451`, `511`, `512`) sin el borde de arriba dentro del brazo, de cerca y de lejos (sin parpadeo).
5. **Agua:** la frontera con el LOD al atardecer en Medio y Alto (antes y después del `mix(a, 1, lejosA)`); la orilla diagonal sin parches cuadrados exagerados; bajo la lluvia con sol (sin destellos); el arrecife visible a 4 bloques.
6. **Migración:** un mundo de 12.6.0–12.6.2 con 60 corales revividos y 30 corales de adorno en una casa: que **no** cuenten los de adorno (con el filtro de agua); el tiempo del primer tic.
7. **Tope del día:** ganar 40 u en encargos y luego pasar por el arrecife con 60 corales: el buzo paga **4 u** (40 %); al día siguiente, 10 u. Y al revés (buzos primero).
8. **Nidos:** 200 nidos de la arribada en una playa: el segundo de ejecución de `tickNests` (medidor de CPU) **no sube**; romper un nido protegido con dinamita: el tic limpia la entidad.

*Escrito por la sesión investigadora, solo lectura. No toqué `src/` ni `tools/`.*
