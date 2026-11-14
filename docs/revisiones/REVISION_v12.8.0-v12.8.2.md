# Revisión de la v12.8.0 «Brillo de noche», v12.8.1 «Jefes que avisan (tramo A)» y v12.8.2 «El pescador y los halos» (encargo 42)

Solo lectura, sobre `252db62`, `dc54e93` y `d711298` (HEAD). Leí completos `src/postfx.js` y `src/halos.js` y los diffs de `game.js`, `atmosfera.js`, `world.js`, `mesher.js`, `lod.js`, `golpes.js`, `armas2.js`, `fauna.js`, `monocongo.js`, `jefes3.js`, `pueblo.js`, `pesca.js`, `bot-economia.js`, `bot-pelea.js` y `revisar-avisos.mjs`; contrasté con `DISENO_JEFES_Y_FINAL.md`, `PREPARACION_C5_Y_JEFES_F2.md` §3 y `BALANCE.md`; miré `docs/capturas/v12.8.0/noche-alto-bloom.jpg`, `v12.8.2/halos-medio-noche.jpg` y `costura-atardecer-medio.jpg`; y repetí con un script propio las cuentas de la pesca. **No corrí el juego ni los bots**: lo visual y lo de medir va «por confirmar».

## Resumen

El **bloom no consigue lo que promete**: la gradación de hora (`atmosGrado`) tiene un hombro que **comprime todo lo que pasa de 1 hacia 1.0**, así que los emisores «por encima de 1» llegan al render target ya aplastados. Los **halos de Medio** salen de **todos** los bloques que brillan (también corales y cuarzo). El **tramo A de los jefes** es correcto en la ventana de la Terciopelo, pero el del Cocodrilo no se puede esquivar nadando y la métrica de «0 % sin aviso» no mira lo que dice, además de que `revisar-avisos` da por hechos los jefes del tramo B que **no se tocaron**. El **pescador no queda cerca de 45 u/día** salvo en los primeros días: 55.8 de media según el propio bot, y 53–79 con lo que el bot no cuenta. Memoria y ciclo de vida del PostFX están bien.

## Los 5 más importantes (en orden)

### 1. El bloom casi no distingue a los emisores: `atmosGrado` los aplasta a ≤ 1 antes del render target — `src/atmosfera.js: GLSL_GRADO`, `src/world.js` (`POST_HDR`)

**Qué pasa.** La v12.8.0 sube los emisores (`diffuseColor.rgb *= 1.0 + vEmis * 1.3`, o sea ×2.3, en `#include <color_fragment>`) para que pasen de 1 y el bloom (umbral 0.95) los encuentre. Pero en Alto y Ultra el mismo fragmento termina con **`atmosGrado`** (`FRAG_NIEBLA`: `#ifdef ATMOS_TONO … gl_FragColor.rgb = atmosGrado(...)`, y `tono: true` en ambos niveles). Esa función acaba con un **hombro**: `hombro = 0.8 + 0.2 · (1 − exp(−(c − 0.8)/0.2))`, que **tiende a 1.0 y nunca lo pasa**. Un canal en 2.0 sale ≈ 0.9995; en 1.15, ≈ 0.98.
**Consecuencias:**
- Los emisores **nunca superan 1.0** en el RT: el HalfFloat no aporta nada para ellos.
- **Cambian de color**: un naranja `(2.3, 1.15, 0)` sale `(≈1.0, ≈0.98, 0)`: **amarillo**, no naranja. La lámpara del capture `noche-alto-bloom.jpg` es amarilla con halo flojo.
- El bloom los ve **igual que cualquier superficie clara** (cielo del horizonte, arena, nieve, lana blanca): con la rodilla de 0.3 todo canal ≥ 0.65 aporta algo, y la lámpara aporta casi lo mismo que la arena de día.
**Por confirmar** con una lectura de píxeles (`readRenderTargetPixels` sobre el RT en una antorcha: máximo del canal) o con una captura del RT.
**Arreglo:** aplicar el brillo de emisor **después** de `atmosGrado` (al final de `FRAG_NIEBLA`, con `#ifdef POST_HDR`), o excluir a los emisores del hombro (`vEmis` como máscara). Y **escalar el bloom con la oscuridad** (el título es «Brillo de noche»): hoy `vEmis` no mira `uDaylight`, así que **de día una antorcha brilla igual**; los halos de Medio sí lo hacen (`fuerza = 0.35 + 0.9·(1 − daylight)`).

### 2. El tramo A de los jefes: ventanas correctas en la Terciopelo, **el Cocodrilo no se esquiva nadando**, y la métrica no mide lo que dice — `armas2.js`, `fauna.js`, `monocongo.js`, `golpes.js`, `tools/revisar-avisos.mjs`

Ver el cuadro de la sección C. Lo más serio:
- **Cocodrilo gigante.** El aviso de la «vuelta de la muerte» (`preGiro = 0.6 s`, anillo de 2.5) se da **después de que la mordida ya pegó** (`alGolpe(llego)`), y solo agarra al jugador si **sigue en el agua a menos de 2.5 bloques**. Nadando se va a ≈ 2 bloques/s: en 0.6 s **no se llega ni a la mitad** del radio. La única salida real es estar a ≤ 1 bloque de la orilla. El changelog dice «si se aleja, se salva»; el toast dice «Aléjese»: **no es posible alejarse**. Además el anillo (`anilloAviso`) nace a `b.pos.y + 0.15` del cocodrilo, que va **bajo el agua** (`surf − 0.35`): debajo de un agua que desde la v12.6.4 es más opaca. **Por confirmar** que se vea.
- **La métrica «Daño sin aviso: 0 %»** (BALANCE, tramo A) **no puede dar otra cosa**: `atacar` marca un aviso por cada golpe (`marcarAviso(g, m, prep + 0.15)`), y `damagePlayer` solo suma lo atribuido a un jefe (`jefeDelGolpe`: por `g.atacante` o por el nombre en la causa). **Los mangos del Mono quedan fuera a propósito** (sin atacante) y el aullido no hace daño. Para el Mono congo, donde el daño sin atribuir es lo que importa, el 0 % es **ausencia de datos**, no ausencia de daño.
- **`revisar-avisos.mjs` da por hechos jefes que no se tocaron.** Su `AVISOS_POR_JEFE` solo exige que el **archivo** del jefe contenga alguna llamada de aviso (`avisoCaida|avisoEmbestida|anilloAviso|brilloAmago|brilloRojo`), y `PENDIENTES` solo excluye a los tres del tramo C. Los del **tramo B** (Reina Bananera, Cascabel, Don Cornudo, Tata Sapo, Cangrejo, Ciempiés: filas 5–10 de la preparación §3.1) **no recibieron ningún cambio** en la v12.8.1 y pasan en verde porque sus archivos ya tenían avisos viejos. La salida dice «Los 11 jefes de la fase 2 que ya están tienen su aviso»: **es falso para 6 de ellos**. **Arreglo:** que `PENDIENTES` incluya el tramo B, o que la prueba busque el aviso **de cada ataque** (no del archivo).
- **El balance quedó sin retocar.** La preparación pedía compensar el `dano` (Terciopelo 1.3 → ≈ 1.5, Cocodrilo 0.5 → ≈ 0.8, Mono ×1.15) y `jefes-balance.js` **no cambió** en estas tres versiones. Lo medido (BALANCE «Fase 2 medida, tramo A», 10 duelos): Terciopelo p = 0.2 / **1** / 0.9; **Cocodrilo p = 1 / 1 / 1** (los tres perfiles ganan siempre: el objetivo del promedio es 0.88–0.95); Mono 0 / 0.5 / 1. El Cocodrilo quedó **demasiado fácil** y el Mono más difícil que antes (0.5 contra 0.6).

### 3. El pescador no queda cerca de 45 u/día — `pueblo.js`, `pesca.js`, `tools/bot-economia.js`, BALANCE «El pescador»

Reproduje la cuenta del bot (cupo 30 u **por puesto**, sin lujo, sin oro) con los precios de `SHOPS` de hoy y me da lo mismo que el BALANCE (río 29 · río frío 35 · estero 41 · orilla 46 · arrecife 50 · altamar 52–55). **Pero:**

| Zona | Bot (BALANCE) | Con el oro de naufragio | + restaurante de lujo (pargo 2, dorado 8, atún 6, pez gallo 3) |
|---|---|---|---|
| Río (lombriz) | 29 | **36** | 36 |
| Río frío | 35 | **42** | 42 |
| Estero | 41 | **47** | 47 |
| Orilla | 46 | **53** | **67** |
| Arrecife | 50 | **58** | **72** |
| Altamar | 52 | **58** | **79** |

- **El promedio del mes es 55.8 u/día** (BALANCE), no 45: «≈ 45–50» solo vale para los días 2–7 con la caña de fibra alternando estero y arrecife; desde el bote y las 6 nasas, 58–61. El criterio `≤ 57 u` pasa por **1.2 u**.
- **Lo que el bot no cuenta** (≈ +7 a +20 u/día): (a) el **oro de naufragio** (1.5 % de las capturas, 1–2 piezas; la pulpería lo compra a **10 u**: ≈ +6.6 u/día); (b) el **restaurante de lujo** (`SIN_LUJO`), que paga más por pargo, dorado, atún, pez gallo y langosta; (c) el cupo es **por pueblo e ítem** en el juego (`ui.js:1386`) y el bot lo modela **por puesto** (más estricto); (d) **cocina, ostión y piangua** (v12.7.2).
- **Las nasas pasaron a 450 s (estero) y 900 s (arrecife) sin decirlo en el changelog** (solo está en un comentario de `pesca.js`). Valor real: río **16.8** u/día con 6, estero **12.0**, arrecife **8.8**. **La nasa de arrecife quedó casi inútil** (1.33 presas al día por nasa) y el diseño la planteaba como lo que paga la langosta; el aviso «Nasa en el arrecife: camarón, ostión y, de vez en cuando, langosta» sigue igual.
- **Efecto colateral en los encargos.** Con que el muelle **ya no venda pargo ni corvina**, `encargos2.js: valorRef` no encuentra precio de venta y usa el **80 % de lo que mejor paga cualquier comprador, el de lujo incluido** (pargo: 2 u ⇒ 1.6) y `pagoDe` ya no se topa contra «comprarlo»: **un encargo de pargo (4 piezas) paga ≈ 8 u = 2 u por pieza**, contra 1.25 u en la soda y ≤ 1.4 antes del cambio. `PIDE.sodera` y `PIDE.sodera_playa` incluyen el pargo (361). **Es la regla de oro rota por el cambio de precios.** Arreglo: quitar el pargo de `PIDE` o fijar su valor de referencia a lo que paga la soda.
- **Lo bueno:** el muelle vende el dorado a **9** y el lujo lo compra a 8: **se cerró el viejo ciclo de comprar dorado y revenderlo al restaurante** (+3 u por pieza). El muelle sigue sin vender nada que otro compre más caro.
- **Decisión para nanoyackson:** o se acepta «≈ 55 u de media» (2.2 jornadas: es el techo que se había dicho) y se cambia el título del BALANCE, o se baja de verdad (por ejemplo el lujo y el oro). Y que el bot **importe** las tablas del juego, use el cupo por pueblo e ítem y sume oro y lujo.

### 4. Los halos de Medio salen de **todos** los bloques que brillan — `halos.js: anotarLuces`, `COLOR`; `mesher.js` (ANIM 8)

`anotarLuces` toma `BLOCKS[…].glow` **a secas**. Entre los 31 bloques con `glow` hay **`coral_purple`** (los arrecifes: decenas a la vista), **`quartz_block`** (un bloque de construcción blanco), `furnace_lit`, `stove`, `portal`, `tele_on`, `meteorito`, `oro_volcanico` y `magma`, además de lo esperado (antorchas, lámparas, faroles, lava, fogatas). `COLOR(b)` da **naranja cálido a todo lo que no es lava ni antorcha**: los corales y el cuarzo salen con halo **naranja** de noche. En Alto y Ultra el **mismo conjunto** (`mesher.js`: `glow && no agua ni lava && !level ⇒ aAnim 8`) se multiplica ×2.3: un muro de cuarzo brilla como una lámpara.
**Otros detalles:**
- **Aspecto** (`halos-medio-noche.jpg`): los halos de las antorchas y de la lava se ven bien, cálidos y suaves; el de la lámpara es discreto.
- **Costo:** despreciable. 64 puntos con una textura de 64 px, una subida de 1.5 KB por cuadro, y la lista se rehace **2 veces por segundo** sobre 5 × 5 chunks (hasta 1 024 luces por chunk; ≈ 25 mil comprobaciones en el peor caso). `anotarLuces` corre en cada remallado de un chunk con `glowCount > 0` (barre hasta 65 mil bloques): ≈ 0.1 ms.
- **Los puntos comparten una profundidad** (la del centro): al pasar el centro tras el borde de un bloque, el **halo entero se corta de golpe**, aunque la mayor parte debería verse. Las antorchas de pared (`wall_torch`) están retiradas, las lámparas se acercan a la cámara 0.75 bloques para evitarlo, pero la antorcha de pie no.
- **Muy cerca de la cámara** el halo es enorme (`size 2.8` con atenuación): a 1.5 bloques cubre media pantalla; `gl_PointSize` tiene un tope por tarjeta, así que se verá un **cuadrado recortado**. **Por confirmar.**
- **`fuerza` usa `g.daylight` global**, no el de dentro de la cueva: de día, una antorcha en una cueva tiene el halo débil (0.35), pese a que el comentario dice «de noche y bajo techo». Con `env.cave` quedaría fuerte bajo techo.
- **La lava**: hasta 1 024 luces por chunk, de arriba abajo, y las 64 más cercanas se amontonan en un solo punto (sumando aditivo): un charco de lava es **una mancha brillante**, no varias luces. Aceptable; que tenga un tope de 3 por columna lo haría más fino.
- **Con las dos banderas** (Personalizado: `bloom` y `halos`) los halos **no se dibujan** (`fx.halos && !post`) pero la casilla sigue marcada. Cosmético.

### 5. Sin HalfFloat el bloom sigue encendido y no puede funcionar — `postfx.js` constructor, `game.js` (`post = !!fx.bloom`)

`hdr = isWebGL2 && (EXT_color_buffer_float || EXT_color_buffer_half_float)` (en three 0.170 `capabilities.isWebGL2` existe: «backwards compatibility», `WebGLCapabilities.js:113`), y si falla usa `UnsignedByteType` (8 bits). **Todo se hace igual**: `fx.bloom` sigue prendido, la escena va al RT, y **nada puede pasar de 1** (ni siquiera sin el hombro del punto 1): el umbral 0.95 con rodilla 0.3 toma entonces **cualquier píxel claro**, y el pase final recorta con el mismo hombro. Resultado: **un resplandor general sobre cielo, arena y nieve**, sin emisores que destaquen. Cuesta lo mismo que con HalfFloat (RT, 4–5 pasadas) sin dar lo prometido.
**Arreglo:** si `!postfx.hdr`, tratar `bloom` como apagado (y encender los halos de Medio, que no necesitan RT): una línea en `game.js` (`const post = fx.bloom && (this.postfx ? this.postfx.hdr : true)`), y avisarlo en Ajustes. **Por confirmar** si hay tarjetas reales sin la extensión (en escritorio casi todas la traen; iOS Safari y algunos Android con WebGL2 traen solo `EXT_color_buffer_half_float`, que **sí** está cubierto).

## Lo demás, por tema

### A. `postfx.js` y el bloom: preguntas puntuales

| Pregunta | Respuesta |
|---|---|
| **Fugas al cambiar de calidad** | ✔ Ninguna. Al pasar a Bajo o Medio, `game.js` llama a `postfx.liberar()` (`escena` y los N niveles `dispose()`; `if (this.postfx.escena)` evita repetirlo) y al volver a Alto `preparar` los rehace. El `PostFX` (materiales, `quad`, `Scene`) vive lo que el `Game`: **uno solo por sesión** |
| **Al cambiar el tamaño de la ventana** | ✔ `preparar` compara `w`, `h` y `n` contra el último; si cambian, `liberar()` y rehace. **Se llama en cada cuadro** con `getDrawingBufferSize`, así que **arrastrar el borde de la ventana reasigna 4–6 texturas por cuadro** (sin fuga: tirón). El regulador (`escalaAuto` 1 → 0.85 → 0.7, cada ≥ 60 s) provoca la misma reasignación, una vez por escalón |
| **Al cambiar de mundo** | ✔ No hay `new Game` por mundo (`main.js:19`): el `PostFX` y sus RT se reutilizan; ninguna fuga. **Detalle:** si el jugador vuelve al menú con Alto, los RT **siguen ocupando** la VRAM (≈ 30 MB a 1080p, ≈ 120 MB a 4K); nadie los libera hasta cambiar de calidad. `postfx.memoria()` existe pero **no se muestra en ningún lado** |
| **HalfFloat** | Ver el punto 5. En 8 bits se pierde el sentido del bloom |
| **La mano dibujada después** | ✔ Sale del RT: `terminar` dibuja el pase final **a pantalla** (`setRenderTarget(null)`) y luego `game.js` hace `clearDepth()` + `render(handScene)`: la mano queda **sin bloom**, como decía el plan. Consecuencia visible: **la antorcha o la lámpara en la mano no brillan** mientras las del mundo sí |
| **El HUD y el menú** | ✔ Son **DOM** (`ui.js`): quedan fuera del bloom. Lo mismo la niebla de bajo el agua (`ui.setUnderwater`) y las gotas |
| **Autoclear** | ✔ `terminar` guarda y restaura `renderer.autoClear` (en este juego es `false`) |
| **Antialias** | El renderer ya se creaba con `antialias: false` (`game.js:267`): no se pierde nada al pasar a un RT |
| **Color** | `outputColorSpace` es lineal (`game.js:275`): no hay desajuste entre el camino con RT y el de pantalla |
| **Muestreo del umbral** | `BRILLO` toma **una muestra bilineal** del cuadro a media resolución: un emisor pequeño (una antorcha lejana) **titila** al moverse la cámara (la técnica habitual usa 13 muestras). **Por confirmar** a ojo |
| **Empaquetado `aAnim` 8 y lava .9** | ✔ **Sin choque.** Bases: hojas 1–2, agua 3 (ola) o 6 (quieta), emisores **8**. La fracción: agua **0 a 0.9** (profundidad × 0.05 hasta 0.40 + orilla 0.5) y lava **0.9**. El caso «agua honda con orilla» (6.9, o sea `frA = 0.9`) **coincide** con la lava, y `vEmis = aB > 7.5 || frA > 0.85` valdría 1 en esas esquinas del agua, pero `POST_HDR` **solo se define en el material `bloques`** (`aplicarDefines`: `nom === 'bloques'`) y el agua usa otro material: **sin efecto hoy**. Si algún día el agua o el LOD recibe `POST_HDR`, hay que mover los emisores a una base propia (8.0) y dejar la fracción solo para el agua. Los bloques con `anim` propio **no** reciben el 8 (`BLOCKS[i].anim || …`) |
| **El regulador con PostFX** | Mira los intervalos **totales** entre cuadros (los pases del bloom cuentan) ✔; baja primero la **resolución** (3 escalones) y después el nivel (Ultra → Alto → Medio). **Con bloom el primer remedio debería ser más barato:** bajar de 5 a 4 niveles o apagar el bloom, antes que la resolución (que obliga a rehacer los RT). Y **Alto → Medio** quita de golpe bloom, bruma y nitidez (la bruma es lo único que Medio no tiene). El regulador no dispara por la memoria. Con `calidadRegulada` el `post` se calcula sobre `sEf` ✔ y se libera al bajar a Medio |

### B. El agua lejana del LOD con `ATMOS_AGUA` (v12.8.0)

- **Costo:** por **píxel**, no por baldosa: cada fragmento del LOD evalúa `abs(vWorldLod.y − (SEA + 0.875)) < 0.06 && b > r·1.4` (barato) y **solo los píxeles de agua** entran a la rama (normalizar, un `pow(…, 5)`, un `reflect`, un `pow(…, 60)`): ≈ 20 operaciones. Con mar a la vista son la mayoría de los píxeles del LOD, pero 20 operaciones por píxel es menos que el agua cercana. El número de baldosas **no cambia** el costo del fragmento (sí las llamadas de dibujo, que no aumentan). **Sin medir.**
- **Compilación:** `aplicarDefines` pone `ATMOS_AGUA` también al material `'lejos'`. **Las baldosas que se funden entran como clones** (`this.mat.clone()` con una copia de `defines`): si el jugador cambia de calidad mientras una baldosa se está fundiendo, ese clon **conserva los defines viejos** hasta que termina de fundirse y se vuelve a `this.mat` (≈ 0.5 s): inocuo.
- **Detección del agua:** el color no se compara con el del lod, sino por «azul domina» **después** de la luz del día y del tinte del cielo (`b > r·1.4`). Con el agua `(0.16, 0.34, 0.68)` la razón es ≥ 1.7 aun con el cielo de atardecer: ✔. **También cae ahí el hielo** (misma altura y azul): refleja el cielo; razonable.
- **Aspecto:** `costura-atardecer-medio.jpg` y `atardecer-alto-agua-lejana.jpg` muestran la transición sin escalón visible. El alfa de lo cercano ya converge a 1 (`mix(a, 1, lejosA·0.8)`, **mi recomendación de la revisión anterior, aplicada**) ✔.

### C. «Jefes que avisan» (v12.8.1, fase 2, tramo A): cada aviso contra su ventana

| Jefe y ataque | Aviso | Ventana de daño | ¿Calzan? | Observaciones |
|---|---|---|---|---|
| **Terciopelo reina**, escupitajo | `avisoCaida` de **1.4 de radio y 0.5 s**, en la posición del jugador al escupir; el veneno cae **ahí** (`charco`) | El daño llega **a los 0.5 s** (`C.t ≤ 0`) si el jugador sigue a < 1.4 | ✔ exacto: el anillo se retira en el mismo instante (`dur 0.5`) | **Sigue habiendo un 65 % aleatorio** (`Math.random() < 0.65`): quedarse dentro del anillo no garantiza el daño, lo que **enseña mal** la lección («esquivar» y «tener suerte» se confunden). Se recomienda 100 % y ajustar el `dano`. **0.5 s es corto** (la opacidad sube de 0.15 a 0.5 en ese tiempo): es lo que pedía el diseño. Si el jugador se aleja a más de 18 bloques durante el vuelo, el `brain` sale **antes** de descontar `charco` y el golpe cae **más tarde** en las coordenadas viejas, sin anillo (inofensivo, pero **aviso que no se ve**) |
| **Cocodrilo gigante**, mordida | `brilloAmago` (dorado) al empezar el amago de `atacar` (prep 0.55) | El golpe cae a los 0.55 s | ✔ | El brillo sale **al empezar**, no «en el momento justo» como describe `brilloAmago`; se ve 0.55 s antes del daño: no es un fallo |
| **Cocodrilo gigante**, vuelta de la muerte | Anillo rojo de **2.5** y toast durante `preGiro = 0.6 s`, **tras** la mordida | A los 0.6 s, si sigue en el agua a < 2.5: `giro 1.3` y 1.5 de daño cada 0.45 s | **No** | Ver el punto 2: nadando no se escapa; el anillo está bajo el agua; con el 30 % por mordida, el aviso **se repite** con cada mordida que lo dispara (cada ≥ 2.6 s) |
| **Mono congo**, aullido | `anilloAviso` de **10** durante los últimos **0.8 s** del temporizador + gruñido | El empujón y el mareo caen en `aullido ≤ 0`, para quien esté a < 10 | ✔ el radio coincide con el efecto (10) | **No es accionable:** en 0.8 s a pie se recorren ≈ 3.5 bloques, y a corta distancia el empuje es de hasta 9: **solo avisa, no enseña qué hacer** (no hay parada con escudo). El anillo de **radio 10** es el **más ralo**: `anilloAviso` lanza 160 partículas/s con vida de 0.35 s ⇒ **≈ 56 vivas a la vez** repartidas en 63 bloques de circunferencia (**≈ 0.9 por bloque**, contra 3.6 en un anillo de 2.5): se ve **punteado**. Y se dibuja a la altura del mono, en un terreno de selva irregular el anillo queda en el aire o **dentro de la tierra** |
| **Mono congo**, mangos | `avisoCaida` de **0.9** durante todo el vuelo `T` (la sombra donde va a caer), ahora con `m` | El mango pega si pasa a < 0.9 | ✔ (ya estaba; solo se anota el dueño) | El daño del mango **no se atribuye** al jefe (sin `g.atacante`, a propósito): por eso no entra en `diag` ni se multiplica por `dano` |
| **Mono congo**, salto | `avisoCaida` de 3.2 y 1.3 s (anterior) | cae a 1.2 s | ✔ | **Sin** el parámetro `quien`: marca `'*'` (genérico) |

**Del tramo B y C:** ninguno se tocó (ver el punto 2). Y todo `avisoCaida`/`anilloAviso` sin `quien` marca la clave **`'*'`**, que hace que `avisoVivo(g, tipo)` sea verdadero para **cualquier** jefe mientras dure: con varios jefes vivos (asedios) el «con aviso» se infla. Hoy son pocos, pero conviene pasar `quien` en todos.

### D. Lo que sí quedó bien

- **v12.8.0:** ciclo de vida y memoria del PostFX; la mano y el HUD fuera del bloom; `antialias` y `outputColorSpace` coherentes; el empaquetado de `aAnim` sin colisión en los materiales que lo usan; `POST_HDR` solo donde corresponde; las banderas `bloom` y `halos` en Ajustes y en `flagsDe`; el agua del LOD sin costura.
- **v12.8.1:** `marcarAviso`/`avisoVivo` y `g.diag` (solo para el bot, no se guarda); `anilloAviso` movido a `golpes.js` con `jefes3.js` reexportándolo (sin ciclos); el `g.atacante` que ya se pedía.
- **v12.8.2:** el muelle deja de vender pargo y corvina y cierra el ciclo del dorado; los halos no necesitan RT; la migración de `vivos` filtra por mar (**mi recomendación de la revisión anterior, aplicada**); `mix(a, 1, lejosA)` en el agua cercana.

## Pruebas pendientes (para quien construya, en tab-1)

1. **Bloom:** leer el máximo del canal rojo de una antorcha en el RT (`readRenderTargetPixels` con HalfFloat): ¿pasa de 1? Con el brillo de emisor **después** de `atmosGrado`, comparar con y sin; mirar una antorcha **de día** y **de noche** (¿debe brillar menos de día?).
2. **Sin HalfFloat:** forzar `hdr = false` y mirar de día (¿sale un resplandor general?).
3. **Halos:** un arrecife de noche en Medio (corales morados), un muro de cuarzo, una antorcha a 1.5 bloques de la cámara y tras el borde de un bloque, una cueva de día.
4. **Regulador:** con Ultra y una carga que baje a 40 fps, ver el orden (resolución primero) y el tirón al rehacer los RT; arrastrar el borde de la ventana con Alto y mirar el tiempo del cuadro.
5. **LOD:** el medidor de GPU con el mar entero a la vista, con y sin `agua` (Medio y Alto).
6. **Terciopelo:** parado dentro del anillo 10 veces: ¿cuántas pega? Moviéndose 1.5 bloques: ¿ninguna?
7. **Cocodrilo gigante:** en agua profunda, con la vuelta disparada: ¿se llega a salir? ¿se ve el anillo bajo el agua?
8. **Mono:** el anillo del aullido en una ladera de selva: ¿se ve? ¿hay qué hacer en 0.8 s?
9. **Bot:** correr `JEFES()` con `solo: ['cocodrilo_gigante']` después de subir `dano`; objetivo p promedio 0.88–0.95.
10. **`revisar-avisos`:** quitar a mano el aviso de un jefe del tramo B y ver que **falle**.
11. **Pescador:** `E.correr()` con las tablas importadas del juego y el cupo por pueblo e ítem; agregar oro y lujo.
12. **Encargos:** el tablón de un pueblo con soda de playa: ¿ofrece pargo a 2 u por pieza?

*Escrito por la sesión investigadora, solo lectura. No toqué `src/` ni `tools/`.*
