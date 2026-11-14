# Revisión de v12.4.7 → v12.4.9 (enfocada en los jefes)

Sesión investigadora, **solo lectura**. Alcance: `git diff 7ee9db0..85281b8` (v12.4.8 «Jefes parejos» y v12.4.9 «Novena revisión»), `src/jefes-balance.js`, `game.js` (`damagePlayer`, `presionJefe`), la armadura nueva, los rayos del Rey, `finca2.js` (rutinas), `version.js`/`save.js` (MIN_IDS) y el postigo girado. Referencia: `docs/BALANCE.md` § «Jefes: fase 0 medida de verdad» y la tabla 1.3 de `DISENO_JEFES_Y_FINAL.md`.

**Cómo se hizo:** leí el código y crucé cada aviso de daño de los 23 jefes con el nombre que usa `presionJefe`. Corrí `node tools/revisar-version.mjs` (todo bien). **No corrí el juego ni el bot** (`bot-pelea.js` solo corre en el navegador): lo que dice «≈» o «por confirmar» es cálculo mío o falta medir. Las cifras de golpes son aritmética de las constantes del código (jugador de 20 de vida, dificultad Normal salvo que diga otra cosa).

## Resumen (lo que importa primero)

| # | Hallazgo | Gravedad | Dónde |
|---|---|---|---|
| 1 | **La presión no llega a los golpes que no llevan «el nombre corto» del jefe:** el multiplicador de **Don Cornudo (×1.4) no se aplica nunca**, y varios golpes de otros jefes (rayo de la Arpía, salida y escupitajo de la Cascabel, la «vuelta de la muerte» del Cocodrilo) tampoco | **Alta** (los números calibrados no son los que corren) | `jefes-balance.js: nombreCorto`, `game.js: presionJefe` |
| 2 | **El Murciélago Rey cambia de fase con un número fijo (`health < 55`)**: con la vida nueva (215) la fase 2 empieza al 26 % y no al 50 % | **Alta** (es un error que la calibración «absorbió») | `caverna.js:58` |
| 3 | **La armadura nueva es un empeoramiento para todos los bichos**, no solo para los jefes: con el equipo de jefes el daño recibido sube **+44 % (hierro+1)** y **+67 % (diamante+3)**; jade y diamante quedan **iguales** | **Alta** (los asedios y las noches no se volvieron a medir) | `game.js: damagePlayer` |
| 4 | **Tres golpes por encima de la vida del jugador sin armadura** (El Olvido 24, Sombra Madre 21, Reina Bananera 20.7) y varios en 17–18 por el tope ×3 | Media | tabla 4 |
| 5 | El rayo del Rey con `'media'` ahora **sí cuenta la armadura (a la mitad)**: pega menos que antes a quien tiene poca (3.0–3.5 en vez de 3.9), sigue siendo el golpe más fuerte contra jade (2.3 vs 1.0 de la picada) y **desgasta la armadura** (antes no) | Baja | `final.js:32` |
| 6 | **`BALANCE.md` § Armadura y § Estrellas siguen con la fórmula vieja** (28/60/84/88 %; «+12 %» por 3 estrellas) | Media (documento) | `docs/BALANCE.md:40`, `:77` |
| 7 | **Choque de ids con mi diseño C5–C8:** el diseño reservaba **bloques 663–695**; la v12.4.9 ya usó 663 y 664 (postigo girado) | Media (aviso a la orquestadora) | `blocks.js`, `DISENO_CONTENIDO_C5-C8.md` |
| 8 | Rutinas de animales: el filtro «no se acercó en 6 s» marca como **mala** la orilla donde el animal ya está bebiendo (se va a otra cada ~10 s); el camino «libre» solo mira a la altura de los pies | Baja | `finca2.js: destinoRutina`, `caminoLibre` |
| 9 | `presionJefe` mira **un solo jefe** (el primero de la lista a < 40 bloques) | Baja | `game.js: presionJefe` |
| — | MIN_IDS y el postigo girado: **bien** (detalles en § 5) | — | |

---

## 1. Cómo funciona la «presión» y qué se le escapa

`damagePlayer` hace: `amount *= presionJefe(this, cause)` **después** de la dificultad y **antes** de la armadura (`game.js` ≈ 1788). `presionJefe` busca el **primer** jefe de `JEFES_BALANCE` vivo a menos de 40 bloques (cada 0.5 s) y devuelve su `dano` solo si el texto `cause` contiene `nombreCorto(kind.name)` (el nombre sin «El / La / Don …»).

### 1.1 Golpes del jefe que **se escapan** (llevan otro nombre en el aviso)

| Jefe (multiplicador) | Golpe | Texto del aviso | Por qué no coincide |
|---|---|---|---|
| **Don Cornudo (×1.4)** | **todos los propios**: «Embestida de Don Cornudo» (`jefes2.js:113`), «El pisotón de Don Cornudo» (`jefes2.js:144`) | `nombreCorto('Don Cornudo, el escarabajo Hércules')` = **«Cornudo, el escarabajo Hércules»** (le quitó «Don» pero queda la coma y el apodo) | Solo el golpe genérico (`Golpe de Don Cornudo, el escarabajo Hércules`, `golpes.js:201`) sí coincide. **El ×1.4 es inerte en sus dos ataques fuertes.** La tabla de verificación de BALANCE lo muestra: Cornudo salió *más fácil* de lo pedido (TTK ≈ 34 s, p promedio 1 contra 0.75–0.88) |
| **Arpía (×3)** | «Le cayó un rayo de la Arpía» (`arpia.js:101`, 6) | nombre = «La Arpía de la Tormenta» → busca «Arpía de la Tormenta» | El rayo no se multiplica; las garras («La Arpía de la Tormenta le clavó las garras», `arpia.js:37`) sí |
| **Cascabel (×0.55)** | «La Cascabel salió de debajo de la tierra» (`jefes3.js:157`, 5+2) y «El escupitajo de la Cascabel» (`jefes3.js:172`) | nombre = «La Cascabel del Llano» → busca «Cascabel del Llano» | Solo «Mordida de la Cascabel del Llano» (`:166`) coincide: la mordida baja a la mitad y la salida de tierra queda entera |
| **Cocodrilo (×0.5)** | «La vuelta de la muerte de un cocodrilo» (`fauna.js:265`, 1.5 cada 0.45 s) | nombre = «El Cocodrilo gigante del Tárcoles» | Con ×0.5 en el golpe y ×1 en la vuelta, **la vuelta pasa a ser casi todo el daño** (3.3 por segundo contra una mordida de ~1.5–2) |
| **Llorona (×3)** | «La Llorona se lo llevó» (drenaje, 1 cada 2.2 s, `leyendas.js:207`) y «Las lágrimas de la Llorona» (`:227`) **sí** coinciden | — | **Al revés (de más):** el drenaje del ambiente se triplica (1 → 3 cada 2.2 s con `ignoreCd`): es un golpe «propio» según el criterio, pero conviene decidirlo a propósito |
| Señor del Arenal (×2.45) | «Le cayó una bomba de lava del Arenal» (`volcanes.js:37`) y el picotazo del zopilote de fuego | — | Correcto que no se multipliquen (son del volcán y de las crías); «El Señor del Arenal golpeó el suelo» sí coincide |

Todos los demás (Terciopelo, Jaguar, Segua, Cadejos, Mona, Viejo del Monte, Tulevieja, Mono congo, Reina Bananera, Tata Sapo, Cangrejo, Ciempiés, Murciélago Rey, Jefa, Olvido, Sombra Madre, Rey Zopilote) **coinciden** en su golpe principal y sus especiales con nombre. (El Olvido y la Sombra Madre solo tienen el golpe genérico `Golpe de …`: coincide.)

**Arreglo mínimo sugerido (para la constructora):** en `JEFES_BALANCE` agregar un campo `alias` (por ejemplo `escarabajo_hercules: { …, alias: ['Cornudo'] }`, `arpia: ['Arpía']`, `cascabel_rey: ['Cascabel']`, `cocodrilo_gigante: ['cocodrilo']`) y que `presionJefe` busque cualquiera. Más robusto: que quien pega pase **`m.type`** (`damagePlayer(…, { jefe: m })`) y no depender del texto; son ~90 llamadas, así que el alias es lo realista. **Después hay que volver a medir** esos cuatro jefes: hoy están calibrados *sin* esos multiplicadores (Cornudo seguirá fácil hasta que el ×1.4 funcione; la Arpía y la Cascabel cambian de peso entre ataques).

### 1.2 Golpes de **otros** que se multiplican de más
- **Un segundo jefe cerca:** `presionJefe` toma el primero de la lista y sale del ciclo. Si hay dos jefes a menos de 40 bloques (dos leyendas, el Señor del Arenal y una leyenda), los golpes del segundo **no** se multiplican (el texto no coincide con el primero). No hay golpes ajenos multiplicados, pero sí golpes propios sin multiplicar. Probabilidad baja, impacto bajo. Arreglo: probar **todos** los jefes cercanos y quedarse con el que coincida por texto.
- **Subcadenas:** «Mona», «Cadejos» y «Olvido» son cortos. Hoy ningún aviso de otro bicho los contiene (revisé los ~90 `damagePlayer`), pero «El Cadejos blanco» (aliado, no pega) o una cría con nombre propio lo harían. No es un problema hoy; sí una trampa para el siguiente jefe.
- **Jefe «moribundo»:** el chequeo mira `m.dead` pero no `m.dying`. En la animación de muerte la presión sigue aplicando a cualquier golpe con su nombre (efecto mínimo).
- El efecto de la presión **también aplica a golpes con `fromX = null`** (rayos, veneno): esos se saltan la dificultad pero **sí** reciben la presión. Es coherente, pero hay que saberlo (el rayo del Rey no sube en Difícil; el drenaje de la Llorona sí sube ×3).

## 2. La armadura nueva (`game.js: damagePlayer`)

Antes: `1 − min(0.88, puntos·0.04 + dureza·0.02)`. Ahora: `1 − min(0.80, puntos·0.03 + dureza·0.02)`.

| Equipo (puntos, dureza) | Daño que se recibe, **antes** | **Ahora** | Cambio |
|---|---|---|---|
| Cuero (7, 0) | 72 % | 79 % | +10 % de daño |
| Hierro +1 estrella (16, 0) — el de los duelos del tramo B | 36 % | **52 %** | **+44 %** |
| Diamante sin estrellas (20, 8) | 12 % | 24 % | **2×**¹ |
| Diamante +3 estrellas (23, 8) — el de los duelos del tramo C | 12 % | **20 %** | **+67 %** |
| Jade +3 (23, 16) | 12 % | **20 %** | +67 % |

¹ Diamante sin estrellas: antes 0.8 + 0.16 = 0.96 → tope 0.88 (12 %); ahora 0.60 + 0.16 = 0.76 (24 %).

**Lo que pasa:**
1. **No es un ajuste de jefes: es global.** `armored = true` en casi todos los golpes de bichos comunes (Sombras, leyendas, bravos, asedios). Con diamante+3 una Sombra grande que pegaba 0.72 por golpe ahora pega 1.2. La calibración de la tabla de jefes ya incluye la armadura nueva (la verificación de BALANCE se midió con ella), pero **los asedios, la Noche Larga y las noches de BALANCE (§ «Medido con el bot») se midieron con la fórmula vieja y no se repitieron**. Ejemplo de la tabla: «Asedio día 30, diamante» dejó la vida mínima en **2.5** en una de las dos corridas; con ≈ 1.7× de daño recibido, eso es **morir**. Es el primer escenario que hay que volver a medir (`escenarios` de `bot-pelea.js`, en el navegador).
2. **Jade ya no vale nada frente a diamante.** El tope de 0.80 se alcanza con diamante+3 (0.69 + 0.16 = 0.85 → 0.80) y con jade+3 (0.69 + 0.32 = 1.01 → 0.80): **idénticos en defensa**. Jade solo se diferencia por durabilidad (700 vs 530) y por ser el material del Rey. Si la idea era que jade siguiera siendo el techo, el tope debería quedar en ≈ 0.85 o la dureza pesar más.
3. **Las estrellas (mejora) valen menos:** cada punto vale 3 % (antes 4 %): tres estrellas en las cuatro piezas dan 9 % y no 12 %. `BALANCE.md:77` aún dice «+12 %».
4. **Cuero casi no cambia (+10 %); hierro sí (+44 %).** El tramo A/B (el hierro de los primeros jefes) es el que más nota el cambio sin haberse medido con bichos comunes.
5. **Los comentarios del código y la documentación no coinciden con la tabla.** El comentario de `game.js:1792` dice «hierro 52 %, diamante ~20 %»: son los valores **con estrellas** del bot (hierro+1, diamante+3); sin estrellas el hierro es 55 % y el diamante 24 %. Y `BALANCE.md:40` sigue con «Cuero 28 %, hierro 60 %, diamante 84 %, jade 88 %».

**Recomendación:** (a) actualizar `BALANCE.md` § Armadura y § Yunque; (b) correr de nuevo los escenarios de asedio/noche/primeras noches con la armadura nueva antes de la versión que se publique; (c) decidir si jade debe superar a diamante (subir el tope a ~0.85 solo cuenta si `tough` se hace valer); (d) si el objetivo era **solo** hacer los jefes más peligrosos, hay una opción más limpia: dejar la fórmula vieja para los bichos comunes y que la **presión** de cada jefe (que ya existe) cargue el aumento.

## 3. Los rayos con `armored = 'media'` (`final.js:32`)

Antes de la v12.4.9 el rayo del Rey Zopilote se llamaba `damagePlayer(6, null, null, '…', true)`: **sin** el sexto argumento, es decir `armored = false` (la armadura **no** lo reducía). Ahora lleva `'media'`: **la armadura sí cuenta, pero a la mitad** (`rebaja × 0.5`). O sea, es una **rebaja del rayo para quien lleva armadura**, no un aumento. Con `dano 0.65` (base 6 → 3.9):

| Equipo | Rayo antes (sin armadura) | Rayo ahora (media) | Picada del Rey (8 × 0.65, armadura completa) |
|---|---|---|---|
| Sin armadura | 3.9 | 3.9 | 5.2 |
| Cuero | 3.9 | 3.5 | 4.1 |
| Hierro +1 | 3.9 | 3.0 | 2.7 |
| Diamante +3 / Jade +3 | 3.9 | **2.3** | 1.0 |

Lectura: contra el equipo esperado en el tramo final (jade+3) el rayo sigue siendo **el golpe que más pega del Rey** (2.3 contra 1.0 de la picada), que parece lo buscado; y para el equipo flojo ahora pega menos (3.0–3.5 en vez de 3.9). Lo que hay que mirar: (1) el rayo cae con `ignoreCd` (el anillo de aviso de `g.rayosRey` lo anuncia): **medir cuántos rayos por minuto** caen en la fase 3, porque si caen en cadena suman; (2) como ahora `armored` es verdadero (`'media'`), **cada rayo gasta 1 de durabilidad a todas las piezas** (`wearArmor`) y puede mostrar «¡Se rompió una pieza de armadura!»: en una pelea de ≈ 110 s con decenas de rayos el cuero (durabilidad 80) se rompe a mitad del combate; (3) como `fromX` es nulo, **no sube en Difícil**: el único daño del Rey que no escala con la dificultad.

## 4. La Mona, la Jefa y los voladores en el tope ×3

**Los topes:** seis jefes están pegados al ×3 (Llorona, Cadejos, Murciélago Rey, Arpía, El Olvido, Sombra Madre) y la Segua en 2.95. Es la señal de que el daño *medido* pedía más y la fórmula no pudo darlo. `BALANCE.md` ya lo dice («en el tramo C la presión hay que subirla con más ataques, no con golpes más grandes»). Con esos tres números, **un solo golpe**:

| Golpe | Base × presión | Sin armadura | Cuero | Hierro +1 | Diamante +3 | Difícil (×1.4): cuero / hierro / diamante |
|---|---|---|---|---|---|---|
| **El Olvido** (golpe) | 8 × 3 = **24** | **muerte** | 19 | 12.5 | 4.8 | 26.5 · 17.5 · 6.7 |
| **Sombra Madre** (golpe) | 7 × 3 = **21** | **muerte** | 16.6 | 10.9 | 4.2 | 23.2 · 15.3 · 5.9 |
| **Reina Bananera** (cae encima) | 9 × 2.3 = **20.7** | **muerte** | 16.4 | 10.8 | 4.1 | 22.9 · 15.1 · 5.8 |
| **Arpía** (garras) | 6 × 3 = 18 | 18 | 14.2 | 9.4 | 3.6 | 19.9 · 13.1 · 5.0 |
| **Murciélago Rey** (mordida, fase 2) | 6 × 3 = 18 | 18 | 14.2 | 9.4 | 3.6 | 19.9 · 13.1 · 5.0 |
| Señor del Arenal (golpe) | 7 × 2.45 = 17.2 | 17.2 | 13.5 | 8.9 | 3.4 | 19.0 · 12.5 · 4.8 |
| Cadejos / Tulevieja / Segua | ≈ 12 | 12 | 9.4 | 6.1 | 2.4 | ≈ 13 · 8.6 · 3.3 |
| **Mona** (brinco) | 5 × 1.65 = 8.3 | 8.3 | 6.5 | 4.3 | 1.6 | 9.1 · 6.0 · 2.3 |
| **Jefa** (Sellazo) | 7 × 1.4 = 9.8 | 9.8 | 7.7 | 5.1 | 2.0 | 10.8 · 7.1 · 2.7 |
| Rey Zopilote (picada) | 8 × 0.65 = 5.2 | 5.2 | 4.1 | 2.7 | 1.0 | 5.8 · 3.8 · 1.5 |

**Lectura:**
- **Los tres primeros matan de un golpe a un jugador sin armadura, y con cuero lo dejan a 1–4 de vida.** Con una «mejora» (el escudo y el parry sí los frenan: pasan por `atacar()`, con brillo y amago) es evitable, pero el primer encuentro, sobre todo en **Difícil** (con cuero: 26.5 y 23.2 son muerte segura), es un cañón. Conviene una regla de diseño en `BALANCE.md`: **«ningún golpe individual quita más del 60 % de la vida a quien lleva el equipo del tramo»**. Hoy se cumple (hierro+1 contra el Olvido: 12.5 de 20 = 62 %, al límite; diamante+3 contra todos: ≤ 24 %) pero **no** para quien llega un tramo antes.
- **La Reina Bananera (tramo B, hierro) con 20.7 de golpe base** es parecida al Olvido y está en el tramo medio: con hierro+1 son 10.8 (54 %). Es la que más se acerca al borde.
- **La Mona (×1.65) está bien:** su único daño es el brinco avisado (agachada de 0.5 s, el punto se fija al agacharse); 8.3 sin armadura no mata y con hierro son 4.3. **No hay problema en el multiplicador; sí en que la vida pasó de 70 a 135** (más ráfagas de brincos por pelea, pero el bot mide TTK 5–8 s, dentro de lo pedido).
- **La Jefa de Ventanilla:** el bot da `p` hábil **0.6 < p promedio 0.78**, al revés de lo normal. La causa más probable (**por confirmar**) es que el **Sellazo no se puede parar con el escudo**: `archivo.js:177` llama a `damagePlayer(7, …, true, true)` directamente, sin `atacar()`; solo se esquiva moviéndose en los 2 s de la marca. Un jugador bueno no gana nada con el parry y el bot hábil lo gasta intentándolo. Si es así, el 1.4 de presión está bien, pero la Jefa **no premia la maña**: dar al Sellazo un brillo/parry o un tiempo de marca visible distinto.
- **Los voladores (Arpía 3, Murciélago Rey 3, Tulevieja 2.35):** `BALANCE.md` avisa que su TTK se midió con el perfil **promedio** (el torpe no tiene arco). Con el arco, las dos garras de 18 pasan a ser un riesgo de burla: un jugador sin arco **no puede** cortar la picada. Es lo que hay que dejar claro en la ayuda de cada jefe («lleve arco»). **Sobre la Arpía hay una inconsistencia:** sus garras sí se triplican (18) pero su rayo (6) no (§ 1.1), así que la Arpía vuelve a dar más miedo de cerca que de lejos.
- **El Murciélago Rey (error #2):** su fase 2 está en `d.fase = m.health < 55 ? 2 : 1` (`caverna.js:58`). Con vida 110 era el 50 %; **con la vida nueva (215) es el 25.6 %**. La fase 2 (picada cada 2.5 s en lugar de 4, mordida de 6 en lugar de 5, y llama a sus murciélagos) casi no ocurre. Todos los números del bot (TTK 24 s, `p` 1) se midieron con ese error. **Corregir a `m.health < m.kind.health * 0.5`** va a hacer la pelea más difícil: probablemente permita **bajar la presión del ×3** (que hoy está en el tope), así que el arreglo mejora dos cosas a la vez. Remedir.
- Otros umbrales absolutos: busqué `health <` con número fijo en todo `src/` y **no hay más** (los demás usan `kind.health`, `D.vmax` o fracciones).

## 5. v12.4.9: rutinas, MIN_IDS, postigo girado

### 5.1 Rutinas con camino libre (`finca2.js`)
Bien hecho y barato, con dos detalles:
1. **Falso «no se acercó»:** `destinoRutina` marca el punto como malo cuando `ck − R.t0 > 6` sin que la distancia baje 0.5. Si el animal **llegó** (el motor lo detiene a `dr < 1.1`, `entities.js:386`) la distancia deja de bajar, y a los 6 s se declara «mala» la orilla (o el techo) donde ya está. Con **techo o sombra** no pasa nada grave: al volver a buscar, `buscar()` devuelve `{ llego: true }` porque ya está tapado. Con **agua** sí: la orilla se descarta por 60 s y el animal se va a **otra** orilla; cada animal «bebe 6 s y se muda». Arreglo de una línea: considerar «llegó» cuando `d < 1.3` y no medir progreso (`P.llego = true`).
2. **`caminoLibre` solo mira a la altura de los pies** (`y0` fijo, dos bloques de alto): una cuesta de un bloque cuenta como pared y un hueco o un barranco **no** cuentan. Resultado: en terreno con lomas los animales «no encuentran techo» y se quedan; en un acantilado pueden mandarse al vacío (`buscar` ya exige suelo ±2 en el destino, pero no en el medio). Es conservador (nadie queda atrapado), así que lo dejaría igual; vale una nota.
3. Costo: en el peor caso (ningún punto sirve) `buscar` hace ≈ 10 000 `getBlock` por animal y por búsqueda; cada animal busca cada 8–12 s y solo 40 % de las veces al empezar. Con 20 animales cerca son ≈ 20 000 lecturas por segundo en el pico: aceptable, pero **medir con el panel de fps al empezar un aguacero con un corral lleno** (👁).

### 5.2 `MIN_IDS` y la versión mínima
- `version.js`: `MIN_VERSION = '12.4.9'`, `MIN_IDS = { bloque: 664, item: 578 }`. `tools/revisar-version.mjs` pasa los 8 chequeos (corrí: «Todo bien»). Prueba que el bloque más alto (664) y el ítem más alto (578) están cubiertos y que `compararVersion` compara número a número.
- **Un hueco del chequeo:** compara los ids con `MIN_IDS`, pero **no que `MIN_VERSION` sea la versión que introdujo el id más alto**. Alguien puede subir `MIN_IDS.bloque` a 700 sin subir `MIN_VERSION` y la prueba sigue en verde; el mundo se abriría en un juego viejo. Sugerencia: guardar en `version.js` `MIN_IDS_DESDE = '12.4.9'` y que la prueba falle si `MIN_VERSION < MIN_IDS_DESDE`, o derivarlos de una sola tabla `{ version, bloque, item }`.
- `leerVersion` rechaza `«12.4.7-beta»`: coherente (una `minVersion` rara no se abre), pero un mundo de una versión de prueba futura no abriría ni con un aviso. Aceptable.
- **Choque con mis ids de C5–C8:** el diseño reservó bloques **663–695** (y mi `REG` de `DISENO_CONTENIDO_C5-C8.md` los numera así). La v12.4.9 tomó **663 y 664** para `postigo_z` / `postigo_z_abierto`. **Hay que renumerar a mano los bloques de C5–C8 a partir de 665** (los ítems 1100+ no cambian). Lo anoto como pendiente de la investigadora: lo hago si la orquestadora lo pide.

### 5.3 Postigo girado (663/664)
- `blocks.js`: dos bloques nuevos (`hidden: true`), cajas giradas 90° (`[7,0,0, 9,16,16]`), el abierto con hojas en los extremos de z, `drop: 660` (suelta el postigo normal: bien), `toggleTo` cruzado. Coherente con el 660/662.
- `estructuras.js: Ctx.set` gira el postigo **solo si `r % 2`** (rotación de 90/270°): bien; `GIRA` es un mapa de 4 entradas, no cambia mundos viejos (el casita es de `minV 18`). La casita se movió al **final** de `TYPES` para que ceda ante todos (cambia qué estructuras ocupan qué celda **solo si** el generador procesa en orden; en mundos nuevos nada más). Bien.
- `game.js` (colocar): si el jugador mira en x, el postigo se pone como `postigo_z`. **Falta** que la **vista previa del bloque** y el **ítem del inventario** sigan siendo 660 (sí: `drop: 660`). Por confirmar jugando: abrir y cerrar un postigo girado; romperlo; ponerlo en las cuatro orientaciones.
- `planos.js`: la regla de giro usa `(lx === ±hw) !== (fwd[0] !== 0)`. Revisé los cuatro casos a mano y sale bien (las paredes laterales corren «hacia adelante»; si mira en x, se invierte). **Por confirmar con una captura**, porque es una condición de paridad fácil de invertir.

## 6. Otros cambios del diff (rápido)
- `save.js` (`leerVersion`, `compatibilidad`, `importWorld`): menos permisivo y más claro; `String(meta.minVersion).slice(0, 20)` evita arrastrar un objeto. Bien.
- `game.js`: `this.danoT = -99; this.jefeCerca = null` al cargar un mundo: bien (evitaba que una pelea anterior silenciara avisos en el mundo nuevo).
- `temporadas.js` y `supervivencia3.js`: partículas de sudor respetan `calmaActiva`; el capote también tapa la gotera. Bien.
- `ui.js`: el aviso de fps ya dice «Opciones de video» (cumple § 10 de `TEXTOS_v12.md`).
- `jefes-balance.js` (**vida**): se aplica a `MOB_TYPES[t].health` en `entities.js:193`. Es una mutación del objeto de cada tipo, correcta porque todos los consumidores leen `kind.health` (barras, `topeAturde`, `vmax`). La **Jefa** y **El Olvido** que se crean desde `arena.js` con `…SOMBRA` heredan la vida nueva sin problema.

## 7. Qué haría la constructora, en orden
1. `caverna.js:58`: fase 2 del Murciélago Rey por fracción (y remedir; probablemente baja el ×3).
2. `jefes-balance.js` + `presionJefe`: alias por jefe (Cornudo, Arpía, Cascabel, Cocodrilo) o pasar el tipo; **decidir** si el drenaje de la Llorona se triplica; probar todos los jefes cercanos, no solo el primero. Remedir esos cuatro.
3. Volver a medir asedios, Noche Larga y primeras noches con la armadura nueva; **actualizar `BALANCE.md`** (Armadura y Yunque) y decidir si jade debe superar a diamante.
4. Revisar el rayo del Rey en la fase 3 (rayos por minuto y desgaste de armadura).
5. Reservar ids: renumerar C5–C8 a ≥ 665; agregar `MIN_IDS_DESDE` a la prueba.
6. Rutinas: «llegó» a < 1.3 en vez de «no se acercó».

*Escrito por la sesión investigadora. Solo lectura: no se corrió el juego ni el bot; las cifras de daño salen de las constantes del código y no se midieron con el bot.*
