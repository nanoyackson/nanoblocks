# Revisión de la v12.8.3 «Decimosexta revisión» y la v12.8.4 «Decimoséptima revisión» (encargo 44)

Solo lectura, sobre `100adb9` y `a5cd654` (HEAD). Leí los diffs completos de `blocks.js`, `world.js`, `mesher.js`, `halos.js`, `game.js`, `fauna.js`, `jefes-balance.js`, `pueblo.js`, `pesca.js`, `monte.js`, `stations.js`, `encargos2.js`, `bot-economia.js`, `revisar-avisos.mjs` y `revisar-pide.mjs`; **corrí `node tools/revisar-pide.mjs`** (da «Los 11 oficios de PIDE están»), enumeré con un script todos los bloques con `glow`/`luz` y su `aAnim`, y repetí la cuenta del pescador con los precios nuevos. Miré `docs/capturas/v12.8.4/noche-alto-bloom-antes.jpg` y `-despues.jpg`. **No corrí el juego ni los bots**: lo visual y lo de medir va «por confirmar».

## Resumen

Lo de la **v12.8.3** (PIDE, nasas, muestreo de la zona, agotamiento por vecinas, validación al importar) **quedó bien**. En la **v12.8.4**, lo del bloom **mejoró** (el emisor ya se sube después del grado) pero **faroles y fogatas siguen sin brillar en Alto y Ultra** por un `||` en el mallador, y el «hombro» del pase final es en realidad un **recorte duro**. **El aviso del Cocodrilo casi no se ejecuta** (otro ataque del mismo jefe se adelanta) y el bot no pisa agua, así que su medición solo cuenta mordidas. **El pescador da 47.4 con la contabilidad del bot, pero el restaurante de lujo paga 2 a 2.7 veces más** por pargo, dorado, atún y pez gallo: con él, 57–71 u/día.

## Los 5 más importantes (en orden)

### 1. El aviso de la vuelta del Cocodrilo casi nunca corre, y puede disparar el brillo en cada cuadro — `armas2.js:182-195`, `fauna.js` (rama `cocodrilo_gigante`), `golpes.js: brilloAmago`

**Dos cerebros para el mismo jefe.** `MINIJEFES.cocodrilo_gigante` (`armas2.js`) tiene su propio `brain`: primero `ataca(m, c, 10, 'El cocodrilo del Tárcoles se lo llevó', 2.8, …)` (mordida de **10**, alcance **2.8**, y si el jugador está en agua, `vel.y = −6` y el toast «¡La vuelta de la muerte!» **al instante**), y **después** `return FAUNA.cocodrilo.brain(m, dt, c)`. Lo que cambiaron la v12.8.1 y la v12.8.4 (el brillo dorado, `preGiro`, el anillo, el toast «Salga del anillo») está **dentro del cerebro de `FAUNA.cocodrilo`**.
**Por qué casi no corre.** El `ataca` de `armas2.js` arranca con alcance 2.8 y tolerancia vertical `< 2`; el de `FAUNA` pide `distP < 1.8` y `< 1.5`. Siempre que el segundo podría empezar, **el primero ya empezó**: `atacar` (`golpes.js:43`) devuelve `false` mientras haya `m.atk` en curso, y `attackCd` solo se fija **al soltar el golpe** (`golpes.js:219`). Entonces el `atacar` de `FAUNA` no arranca, `preGiro` **no se dispara** y el jugador sufre el ataque **sin aviso**: la mordida de 10 con arrastre inmediato.
**Efecto colateral (por lectura, por confirmar).** En la rama de `FAUNA` el `brilloAmago(m, g)` va **antes** de `atacar` y **sin ningún candado**: se ejecuta en cada cuadro mientras `distP < 1.8` y `attackCd ≤ 0`, lo cual es cierto durante todo el amago del otro ataque (≈ 0.5–0.7 s). Cada llamada crea un destello (`brillo`) y reproduce `armadura.metal`: **decenas de destellos y de sonidos por mordida**. (La Arpía sí lo protege con `m.data.brillo`.)
**El bot no lo ve.** `bot-pelea.js:110` arma «una cancha plana … ni agua donde ahogarse»: la vuelta solo existe **en el agua**. Las «3 tandas de 30 duelos» y la presión 0.5 → 0.6 midieron **solo mordidas**; BALANCE: p 0 / 0.8 / 1, recibido 8.4 (contra 5.4 con 0.5), pero con ruido enorme (0.7 da 8.1 y 0.8 da 14.6: **no es monótono**), y torpe 0 en todas.
**Arreglo:** (a) dejar **una sola mordida**: quitar el `ataca` de `armas2.js` (o su arrastre) y que el gigante use el de `FAUNA` con su aviso, o ponerle el aviso a ese; (b) un candado en `brilloAmago` (`if (!m.data.brillo || …)`) como en la Arpía; (c) un duelo del bot **en agua** (o un modo `agua: true` con la cancha inundada). **Pruebas en tab-1:** 10 mordidas dentro y fuera del agua: ¿hay anillo?, ¿cuántos destellos y sonidos por mordida?; ¿se alcanza a salir en 1 s?

### 2. En Alto y Ultra los faroles y las fogatas siguen sin brillar, y la lista de luces tiene huecos — `mesher.js`, `blocks.js: LUCES`

**Precedencia del mallador.** `ANIM[i] = BLOCKS[i].anim || (BLOCKS[i].luz && … ? 8 : 0)`: si el bloque ya tiene `anim`, **no recibe el 8**. Corrí el cálculo con todos los bloques `luz`:

| Bloque | `anim` | `aAnim` resultante | ¿Emisor del bloom? |
|---|---|---|---|
| `lamp`, `quartz_lamp`, `furnace_lit`, `stove`, `magma` | 0 | **8** | ✔ |
| `torch`, `wall_torch0–3` | 0 | **8** | ✔ |
| `fogata_brasas` | 0 | **8** | ✔ |
| **`farol`** (134), **`farol_zenaida`** (619), **`fogata`** (235) | **1** (vaivén de la llama) | **1** | **✘** (sin brillo) |
| `lava` y sus flujos | 0 | 0 (+0.9 por el mallador) | ✔ por la fracción |

O sea: **los tres bloques más típicos de luz de campamento y de pueblo** (el farol, el de Zenaida y la fogata) tienen halo en Medio (los halos usan `b.luz`, no `aAnim`) pero **no** bloom en Alto y Ultra. Ya pasaba en la v12.8.0 (con `glow`); la v12.8.4 los metió en `LUCES` y creyó cerrarlo.
**Arreglo:** que el 8 no pise el `anim`: usar otra clave (`EMIS[i]` en un `Uint8Array` y un atributo propio) o sumar la marca como **parte entera mayor** (`anim + 8`, y que el vertex use `aB` módulo). Y **una prueba** que falle si algún bloque con `luz` termina con `aAnim ≠ 8` (y `render` distinto de agua y lava).
**Lo que preguntaron: ¿falta alguna luz?**
- **No existen como bloque:** la **vela** (`vela_novena` es de C8-B y no está), el **farol de la feria** (los faroles del desfile son una malla en la mano del vecino, `ponerFarol` de `fiestas2.js`, y los bombillos de fin de año son 96 cubitos `MeshBasicMaterial` con color ≤ 1: **no brillan ni tienen halo**), la **lámpara de carburo** (`lampara_carburo` es un ítem de mano; la mano va después del bloom) y las bombas de lava (`LavaBomb`, naranja ≤ 1). Cuando existan la vela y la mesa de la patronal, **deben nacer con `luz`**.
- **Con `glow` pero fuera de `LUCES`:** `glow_mushroom`, **`hongo_fuego`** (hongo de fuego: pide calidez), `morpho_jar` (la jarra de luciérnagas), **`corazon_tiquicia`** (el objeto central de la historia), `portal` y `portal_cielo`, `cristal` y `cristal_bloque`, `meteorito`, `oro_volcanico`, `tele_on`, `quartz_block` y `coral_purple`. Quitar el coral y el cuarzo **es acertado**. Los demás son decisión de gusto; yo pondría **`hongo_fuego`, `corazon_tiquicia` y los portales** (y quizá la jarra).
- **El fuego del volcán** ✔ está (la lava, los flujos y la caída, y el `magma`); lo que no brilla es lo que **vuela** (las bombas) y los vapores.
- **El comentario del changelog dice que los hongos, el coral, el cuarzo y los cristales «no alumbran»**: **no es exacto**. `glow` es la bandera del **motor de luz de vóxeles** (`world.js`: `glowCount`, y el remallado de los vecinos cuando cambia): esos bloques **sí alumbran** el mapa. Lo que se decidió es que no **resplandezcan**; conviene decirlo así.
- **Prueba nueva:** `tools/revisar-luces.mjs` que liste los bloques con `glow` y sin `luz` y obligue a decidirlo (como `revisar-pide.mjs` con los oficios).

### 3. El «hombro» del pase final es un recorte, y el realce de después del grado tiene tres efectos — `postfx.js: FINAL`, `world.js:128`

- **`FINAL`:** `h = c / (1.0 + max(c − 1.0, 0.0))`. Para `c ≥ 1` queda `c / c = 1`: **es un recorte duro a 1**, no un hombro (el comentario dice «se dobla»). Todo lo que pase de 1 en un canal sale **exactamente 1** en ese canal: un emisor `(2.7, 1.4, 0.1)` de noche sale `(1, 1, 0.1)`: **amarillo**, no naranja. Se ve en `noche-alto-bloom-despues.jpg`: el centro de la lava es **amarillo-blanco** y el borde, naranja (en la captura de antes era naranja plano). El halo aporta color, pero el bloque emisor pierde su matiz.
- **¿Se queman los cielos, el sol o la nieve de día?** **El realce no los toca:** solo multiplica los fragmentos con `vEmis` (los bloques emisores), y los mide: el máximo en el RT es **1.44 de día** (ya cuenta: `0.96 · (1 + 0.5)`) y 2.72 de noche. **Pero el bloom sí los ve**: el umbral sigue en 0.95 con rodilla 0.3 (`postfx.js` no cambió), así que cualquier píxel con un canal ≥ 0.65 aporta algo (el cielo del horizonte, nubes, nieve). Con `uFuerza` 1.0 (Alto) o 1.3 (Ultra), **un cielo claro de 0.9 gana ≈ +0.05 a +0.1, y las nubes y la nieve (≈ 1.0) empujan un halo de ≈ 0.1–0.3**, que se **recorta a 1**: no se «quema» más, pero **sangra una orla clara sobre las siluetas oscuras** (árboles y montañas contra el cielo de mediodía) y puede lavar el contraste. **Por confirmar** con una captura de mediodía con bloom prendido y apagado (la carpeta solo trae la noche). **Arreglo posible:** subir el umbral de día (`uUmbral = 1.0 + 0.3 · uDaylight`) o escalar `uFuerza` con la oscuridad, o limitar el bloom a los píxeles marcados como emisor.
- **Con el agua y el sol del agua:** el material del agua **no recibe `POST_HDR`** (solo `bloques`), así que el agua no cambia ✔. Pero **los destellos del sol en el agua** (`solA`, hasta ≈ 3 × `uSunCol`) se suman a `diffuseColor` y pasan por `atmosGrado` (hombro a 1.0) antes del RT: llegan **≤ 1**; el bloom los ve apenas como un píxel claro más. Si se quiere un destello que **brille**, hay que sumarlo **después** del grado, como el emisor.
- **Los emisores lejanos se realzan DESPUÉS de la niebla.** En el orden de `FRAG_NIEBLA` van `atmosNiebla` y luego `atmosGrado`, y el realce va después de ambos (`premultiplied_alpha_fragment`): un farol o la lava a 100 bloques, ya mezclados con el color de la niebla, **se multiplican por 1.5 de día y hasta 3.1 de noche**: el color de la niebla (azulado) sale brillante y sobrepasa 1 → un **halo azul-blanco en el horizonte** donde haya una lámpara o un flujo de lava lejos. **Arreglo:** multiplicar solo la parte que no es niebla (`× (1 − fogFactor)`) o dejar de realzar a más de ~60 bloques.
- **`uDaylight` es el del mundo**, no el de la cueva: de día, una antorcha en una cueva sale con el realce flojo (×1.5), igual que el halo de Medio (`g.daylight` global). **Por confirmar** si molesta.
- **Sin HalfFloat:** ✔ (`post = fx.bloom && postfx.hdr`, y los halos); **detalle:** `POST_HDR` sigue definido para los bloques aunque `post` sea falso (`aplicarDefines` mira `f.bloom`, no `post`), así que sin HalfFloat los emisores se **suben ×1.5–3.1 y se recortan en 8 bits**, y encima llevan halos: más amarillos. Debería seguir a `post`.

### 4. El pescador: 47.4 con la cuenta del bot, 57–71 con el restaurante de lujo — `pueblo.js` (`SHOPS`), `pesca.js`, BALANCE

Con los precios nuevos reproduje la cuenta del bot (cupo por puesto, sin lujo): río 29 · río frío 35 · estero 32 · orilla 37 · arrecife 39 · altamar 40 (BALANCE dice 29 · 35 · 32 · 38 · 40 · 46; **la de altamar no me da** y **por confirmar** el 46) y el mes completo sí cae en **≈ 47**. Pero:

| Especie | Muelle | Sodas | **Restaurante de lujo** (`chef_lujo`) | Relación |
|---|---|---|---|---|
| Pargo (361) | 0.75 | 1.0 | **2.0** | ×2.7 el muelle |
| Corvina (362) | 0.75 | 1.0 | — | — |
| Dorado (364) | 3 | 3.5 | **8** | ×2.3 las sodas |
| Pez gallo (1110) | 1.5 | 1.5 | **3** | ×2 |
| Atún (1111) | 2.5 | — | **6** | ×2.4 |
| Langosta (1113) | 6 | — | **8** | ×1.3 |

- **Sí: casi todo pez de mar vale más en el lujo**, y los precios del lujo **no se tocaron** en la v12.8.4. Con él (y el cupo por pueblo e ítem del juego) las zonas dan: orilla **57**, arrecife **60**, altamar **71** (contra 37–40 del bot), y con las nasas (≈ 12–17) y la cocina, bastante más. Los del bot excluyen el lujo (`SIN_LUJO`), por diseño: es «precios de lujo» de turistas.
- **El tope del restaurante de lujo** es el cupo de la tienda: **30 u al día por ítem y pueblo** (`CUPO_DIA`, `ui.js:1386`) al precio lleno y el 40 % después. En piezas: **15 pargos, 3.8 dorados, 5 atunes, 10 peces gallo y 3.8 langostas** al día. Para los pargos (≈ 11 por día de pesca de orilla) **no hay tope efectivo**; los dorados y atunes sí lo topan. Y el lujo **no está en todos los pueblos**: `chef_lujo` sale con la estructura `playa_lujo` (una cada ≈ 1 400 bloques, 80 %): hay que viajar a venderle.
- **Lo bueno:** (a) el muelle ya no vende pargo ni corvina y **no hay ciclo de compra y reventa** (el muelle vende dorado a 9, el lujo lo compra a 8); (b) **los encargos** dejaron de mirar al lujo (`encargos2.js: precios`, `if (!S.lujo)`): el pargo pasa a pagar ≈ 1 u por pieza (= la soda), arreglado lo que marqué en la revisión anterior; (c) la perla baja a 0.5 % y el oro a 0.5 % (v12.8.3): con 29 capturas, ≈ −2.6 y −4.4 u/día.
- **Rarezas de precios:** el **guapote** (1) paga más que el pargo y la corvina (0.75) en el muelle; el **pargo mancha**, el **róbalo** y el **sábalo** bajaron a 1 en todas partes (era 1.5–1.75): ahora los de zona «cara» (estero y arrecife) rinden **igual que** los de orilla.
- **Decisión para nanoyackson:** el criterio «meta 42–48» se mide **sin lujo**. O se acepta que **el lujo es un premio extra** (y se anota en BALANCE: «con lujo 57–71»), o se baja el lujo (p. ej. pargo 1.5, dorado 6, atún 4) para que el techo real quede cerca de 50. Y el bot debería correr una variante «con lujo» para que el número honesto esté a la vista.

### 5. PIDE y la prueba nueva: bien, con tres límites — `encargos2.js`, `tools/revisar-pide.mjs`

- **Arreglo de PIDE:** ✔ `panadera` y `carnicero` están de vuelta, `PIDE` ahora es `export const` (para pruebas) y el comentario explica lo ocurrido.
- **La prueba** (`node tools/revisar-pide.mjs`): lee el texto de `PIDE`, borra los `//` línea por línea y exige los **11 oficios** con la forma `clave: [` o `clave: NOMBRE`; también **falla** si aparece un oficio **nuevo** que no esté en `OFICIOS` («súmelos»). **Corre en verde.** ✔ Es la prueba correcta para el fallo que hubo.
- **Límites:** (1) **no mira los ids** (un id mal escrito, o uno que ya no existe, pasa) ni que cada lista no esté **vacía**; (2) **no quita `/* … */`** (un comentario de bloque pasaría la prueba y tragaría oficios) y corta en el **primer `};`**; (3) **fallará a propósito** cuando lleguen los maestros de C6 (carpintero, alfarera) o la vulcanóloga a `PIDE`: ahí hay que sumarlos a `OFICIOS` (está dicho en el mensaje, y es lo deseable). **Sugerencia:** que también compruebe que cada id de cada lista exista (`getDef`) y tenga precio de referencia (`valorRef`), y que `package.json` la lleve en un guion `npm run revisar` junto con las demás.
- **Efecto del cambio de `precios()`** (lujo excluido): el valor de referencia de lo que solo compra un puesto de lujo cae al **0.3** de reserva. Hoy solo les pasa a la langosta gratinada y a poco más, que no están en `PIDE`: sin efecto; pero **al sumar** platos de lujo a los encargos hay que recordarlo. La **perla** (`369`) ya no sube a 25 por la inmobiliaria (también `lujo: true`): ahora vale 18 para los encargos.
- **Resto de la v12.8.3, correcto:** nasas en el mar sin coral (`orilla`: pargo .35, corvina .35, camarón .2, bota .1; media 450), la séptima nasa se devuelve (`registrarMonte` da `false` y `stations.js` la quita y la regala), `zonaDe` por muestreo de ≤ 12 bloques **con caché por celda de 16**, el agotamiento suma **la celda y sus 8 vecinas**, el **arrecife sin saltos de 2** (13 × 13 columnas) y la validación de `meta.pesca`, `meta.mariscos` y `meta.monte` al importar.

## Lo demás

- **Capturas de la v12.8.4:** `noche-alto-bloom-antes.jpg` y `-despues.jpg` **no son la misma escena** (la primera es la ladera de la 12.8.0; la segunda, una plataforma de prueba con una lámpara, dos antorchas y un charco de lava): sirven para ver que el halo de la lava ahora es fuerte y amarillento, no para comparar el brillo de **la misma** lámpara. El número «1.44 de día / 2.72 de noche» sale del RT medido por quien construyó (no lo reproduje).
- **`LUCES` y `anotarLuces`:** el filtro por `luz` evita el coral y el cuarzo ✔ (el cuarzo ya no tiene halo naranja); el `furnace` apagado no, y el `furnace_lit`, sí ✔; el `stove` tiene `glow` siempre (lo trata como luz aunque esté frío): **por confirmar** si es lo buscado.
- **`revisar-avisos.mjs`:** el tramo B pasa a `PENDIENTES` ✔ (lo que dije en la revisión anterior). Sigue comprobando el **archivo**, no el ataque.
- **Fase 2 en el cuadro de `PLAN_CIERRE_FINAL`:** los hallazgos 1 (Cocodrilo) y 3 arriba pasan a la lista de **2B/2C**: la fase 2 no puede darse por hecha en el tramo A.

## Pruebas pendientes (para quien construya, en tab-1)

1. **Cocodrilo:** `/prueba` del gigante cerca de agua; 10 mordidas dentro y fuera del agua; contar destellos y sonidos de `brilloAmago` por mordida; ¿hay anillo?, ¿se sale en 1 s nadando? Después del arreglo, un duelo **en agua** del bot.
2. **Emisores:** un farol, una fogata y una antorcha de noche en Alto: ¿brillan los tres? (`aAnim` en el mallador); una prueba de `tools/` que lo exija.
3. **Luces:** poner `hongo_fuego`, `corazon_tiquicia` y un portal: ¿con halo y bloom? Un bloque nuevo con `glow` sin `luz` debe **hacer fallar** `revisar-luces`.
4. **Bloom de día:** captura de mediodía con bloom prendido y apagado (cielo, nubes, nieve, silueta de árboles); con las colinas nevadas.
5. **Niebla:** un flujo de lava y un farol a 100 y 150 bloques, de día y de noche: ¿halo azul?
6. **Sin HalfFloat** (`hdr = false`): ¿los emisores se ven amarillos?; `POST_HDR` apagado en ese caso.
7. **Pescador:** `E.correr()` con la variante «con lujo»; vender 15 pargos, 4 dorados y 5 atunes al `chef_lujo` y ver el 40 % a partir del tope.
8. **PIDE:** romper a propósito un oficio y un id en `PIDE` y ver que `revisar-pide` falle (hoy el segundo pasa).

*Escrito por la sesión investigadora, solo lectura. No toqué `src/` ni `tools/`.*
