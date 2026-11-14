# Plan de cierre del final del juego (encargo 43)

Solo lectura, **contra el código de la v12.8.3** (HEAD `100adb9`). Comparé `DISENO_JEFES_Y_FINAL.md` (§2 ajustes por jefe, §3 «La Noche del Rey», §4 recompensas, §5 fases) con `src/final.js`, `epilogo.js`, `jefes2.js`, `jefes3.js`, `golpes.js`, `gente.js`, `defensa.js`, `canelo.js`, `correo.js`, `rigo.js`, `manas.js`, `musica.js`, `foto.js`, `hogar.js`, `jefes-balance.js`, `BALANCE.md`, `bot-pelea.js` y `revisar-avisos.mjs`. **No corrí el juego ni los bots**: lo que dependa de verlo va «por confirmar».

## 0. Resumen

- **Hechas:** la **fase 0** (medir) y la **1** (curva y premios), y el **tramo A de la 2** (v12.8.1: Terciopelo, Cocodrilo y Mono congo).
- **A medias:** la **fase 2** (faltan los tramos **B** y **C**, la revancha con enfriamiento y la métrica de «daño sin aviso»), y el **epílogo** (existe, pero no sabe nada del Rey).
- **No existen todavía:** las fases **3 a 9**. No hay arena (`reyfinal.js` no existe), el Rey sigue con **tres fases y los umbrales de 66 y 33 %**, no hay música ni cámara propias, la gente no sube a la cumbre, no hay golpe final ni alba, los créditos son **diez líneas fijas**, no hay mañas de jefe y **ninguno de los ítems únicos existe** (los pedidos de arte están escritos en `PEDIDOS_ARTE_LOTE3.md` §5, pero no hay ni ítem ni imagen).
- **Estimo ≈ 7–8 versiones** de trabajo para cerrar el final (fases 2B a 9). Con el contenido que falta (C6, C7, C8-B, C8-C) son ≈ 15 versiones en total; la propuesta de la §4 las intercala para que el final quede jugable **a mitad del camino** y no al final.
- **Hallazgos que cambian el plan:** (1) **hoy, si el jugador muere peleando contra el Rey, la Corona del monte se pierde** (`usarCorona` la consume al llamarlo y `esUnico` no la cubre), y sus seis trofeos ya se gastaron al tejerla: la fase 3 trae la solución, pero es **un riesgo ahora mismo**; (2) el Rey **ignora el aturdimiento** (`final.js: update` es una función propia y el `stunT` solo frena el comportamiento por defecto), así que «parry ⇒ aturdido» hay que programarlo en el cerebro nuevo; (3) la arena escribe en `world.mods`, que **se guarda** (`saveWorld` cada 30 s): si se cierra la pestaña a mitad de la pelea, el cráter **queda guardado**; el diseño dice «`g.rey` no se guarda», y eso solo cubre el estado, no los bloques.

## 1. Estado real, fase por fase

| Fase | Diseño | Hoy | Veredicto |
|---|---|---|---|
| **0** Medir | duelos, perfiles, métricas | `bot-pelea.js`: `PERFILES` (torpe, promedio, hábil), `JEFES({perfiles, veces, solo, revancha})`, equipos `jefeHierro/Diamante/Jade`, `exposicion`, `parrys`, `ruedas`; BALANCE con la tabla | ✔ hecha |
| **1** Curva y premios | vidas, golpes, premio único | `jefes-balance.js` (vida y `dano` por jefe; el Rey en **2 500 · ×0.85**), `precios.js` (`premioBaja`, `meta.premioJefe`) | ✔ hecha. **Discrepancia:** BALANCE habla de «3 100 · TTK 110 s» (fase 1) y el código tiene 2 500; decisión de la 4.13 («con 1.0, 0 de 8»), **sin jugar con una persona** |
| **2A** Avisos, tramo A | Terciopelo, Cocodrilo, Mono | v12.8.1 (ver `REVISION_v12.8.0-v12.8.2.md` §C) | ✔ hecha, con reservas (Cocodrilo no esquivable nadando; `dano` sin retocar) |
| **2B** Avisos, tramo B | filas 5–10 de `PREPARACION_C5_Y_JEFES_F2.md` §3.1 | **Nada de esas filas está hecho.** Siguen: la nube de la Reina sin anillo, el escupitajo de la Cascabel sin parry, `caparazon.corte` en **0.6**, la concha del Cangrejo en `stunT = 2.5`, el Ciempiés sin salida barriéndose, el Tata con su veneno aparte | ❌ por hacer |
| **2C** Avisos, tramo C | filas 11–16 | Murciélago Rey sin carril ni cansancio; la Jefa sin dorado ni parry; **el Señor del Arenal sigue con `setTimeout`** (`inframundo.js:72`); la Arpía sin silbido; la Sombra Madre sin sus dos escudos | ❌ por hacer |
| 2 (resto) | enfriamiento de 3 días de la Ofrenda; métrica de «sin aviso» | `usarOfrenda` sin `meta.ofrendaDia`; la métrica de `g.diag` **solo cuenta lo atribuido** y `revisar-avisos` pasa en verde aunque el tramo B no esté | ❌ / débil |
| **3** Arena | `reyfinal.js`: `armarRedondel`, restauración, anillo que se achica | **No existe.** `usarCorona` solo hace nacer al Rey a 18 bloques | ❌ |
| **4** Cerebro | 4 fases (70/40/12 %), coraza, rasante, escolta, combo, golpe final | **3 fases** (66/33 %): vuelo, tormenta, alas rotas (`final.js: update`); picada con `chilla` 0.9 s (sin carril rojo), `posado` 4/3 s, rayos con `avisoCaida` 1.2 s (hasta 3), plumas ×3, en tierra: brinco con anillo, aletazo con `anilloAviso` 0.8 s y ceniza que marea. **Sin** coraza, rasante, escolta, combo ni coro | ⚠ base útil |
| **5** Música y cámara | `composeRey`, 5 cinemáticas | `musica.js` solo tiene `composePelea`; el Rey activa `pelea` por `D.apuro`/`g.apuro` (**por confirmar**), sin crecer por fase. Hay `g.shake`, `g.slowmo` (parry), `foto.js: barras-cine` | ❌ (piezas sueltas) |
| **6** Gente y trama | vecinos con faroles, frases, carta, Canelo, Seguro | Existen las piezas: `gente.js` (`PERSONAS` con `frases`, `ponerPersona`), `defensa.js: ayudaEnPelea` (solo con `g.asedio` o `g.nocheLarga`), `canelo.js`, `correo.js` (Don Chema), `rigo.js` (el Seguro, `meta.seguro`), Wilber que dispara. **Falta** unirlas a la pelea | ❌ (todo por conectar) |
| **7** Remate y epílogo | golpe final, alba, créditos con nombres, líneas de cierre, únicos, mañas | `vencerRey` marca `meta.reyZopilote`, `creditosPendientes` y suena `aplausos`; `creditos(g)` es un **rollo fijo de 10 líneas** (`CREDITOS`); `epilogo.js: lineas` no menciona al Rey | ❌ |
| **8** Arte | 5 ítems únicos | Pedidos en `PEDIDOS_ARTE_LOTE3.md` §5; **sin ítem y sin imagen** (en `public/sprites/arte/` solo están `corona_monte`, `pluma_rey`, `pinza_rey`, `trofeo_rey_zopilote`). El fallback de la v12.8.2 (bolsita con inicial) evita el ítem invisible | ❌ |
| **9** Docs y cierre | BALANCE, árbol, `/prueba final fase…` | `pruebaFinal(g, que)` solo conoce `creditos` y «el Rey delante» | ❌ |

### 1.1 Lo que sí existe del final (para no rehacerlo)

- **`final.js`:** el Rey (`FINAL.rey_zopilote`: `update`, `onHurt` que impide el cuerpo a cuerpo en el aire), `rayo`, la clase `Pluma`, `vencerRey`, `creditos`, `etapasHTML` (la hoja «El camino»), `usarCorona` (de noche, altura ≥ 95, cielo abierto) y `pruebaFinal`.
- **`golpes.js`:** `atacar` (acepta `cadena`, `tipo`, `alSoltar`), `avisoCaida`, `avisoEmbestida`, `anilloAviso`, `brilloAmago`, `brilloRojo`, `marcarAviso/avisoVivo`.
- **`jefes3.js`:** `presentarJefe`, y la **concha rota con un golpe fuerte contundente** del Cangrejo (`D.concha`, `m.stunT`), que es el modelo de la coraza de la fase 3.
- **`manas.js`:** el catálogo de 18 mañas en tres familias (`FAMILIAS`, `MANAS`, `NIVELES`, `oferta`) y `mana(g, 'clave')` en `progreso.js`.
- **`hogar.js: TROFEO_DE`:** los trofeos de cada jefe. **`alas.js`:** las Alas del Rey. **`recogerUnicos`** (`game.js:1424`) y `esUnico` (`inventory.js:10`).
- **Ítems únicos ya existentes:** **`cigarros_62`** (id **510**, «Cigarros del 62, sin abrir (un recuerdo)»), que **es** el `cigarro_anselmo` del diseño: no hay que crear otro.
- **Ids:** `586–599` están **libres** (nada en `blocks.js`), y los ítems únicos ya reservaron ese rango; `esUnico` hoy cubre 495–498, 502–507, 510–520 y 522, o sea que hay que **ampliarlo**. Alternativa: usar `1190–1199` (libres en `EXT_ITEM`).

### 1.2 Cosas del diseño que ya no calzan con el código

1. **Vida del Rey:** el diseño dice 900 → 1 000; el código tiene **2 500 × 0.85** (`jefes-balance.js`). Las cuentas de §3.2.5 (≈ 133 s) **no valen** con esa vida: hay que **remedir con el cerebro nuevo** (la fase 0 fija «línea base: hoy 110 s con 3 100»).
2. **Umbrales:** el diseño pide 70/40/12 y el código usa 66/33.
3. **`cigarro_anselmo`:** ya existe como `cigarros_62` (510).
4. **`ayudaEnPelea`** exige `g.asedio || g.nocheLarga` (`defensa.js:84`): hay que abrirlo a `g.rey`.
5. **`m.data.inmortal`**, que el diseño usa para los vecinos de la ladera, **no existe** (no encontré el flag en `src/`): hay que agregarlo al `hurt` de `entities.js` o dar a esos vecinos un `onHurt` que devuelva `false`.
6. **La pausa y la música:** el diseño pide que pausar congele la música; hoy `Music.update` corre sin mirar `g.paused` (**por confirmar**).

## 2. Plan por fase: cambios concretos y su prueba

Convención: **tab-1** = jugarlo a mano en la pestaña 1 con `npm run dev` (puerto 5199); **bot** = `await JEFES({ solo: [...], veces: 10 })` de `tools/bot-pelea.js` en el navegador.

### Fase 2B — Avisos del tramo B (≈ 0.8 versión)

| Jefe | Archivo y función | Cambio |
|---|---|---|
| **Reina Bananera** | `jefes2.js`, `JEFES2.reina_bananera.brain` (la nube `D.nube`) | `anilloAviso` verde del radio real (4.5) mientras dura la nube; crías de 4 a 3 (`criasCd`) |
| **Cascabel** | `jefes3.js`, `tirar`/`Bola` (el escupitajo, línea ~172) | un parry (`g.blocking` y `golpeLlega`) anula el daño y deja a la Cascabel aturdida 1.6 s |
| **Don Cornudo** | `armas3.js` (perfil `caparazon`) o, mejor, `jefes2.js: escarabajo_hercules.onHurt` | corte 0.6 → 0.75 **solo para él**, y ×2 si `m.data.trabado` (contra pared o árbol). Cuidado: `caparazon` es **global** (escarabajo, cangrejo, armadillo, alacrán…) |
| **Tata Sapo** | `jefes3.js`, `sapo_tata.brain` | la masticada pega una vez (quitar el veneno aparte), charcos que duran 6 s y **se ven** |
| **Cangrejo Rey** | `jefes3.js`, `onHurt` (línea 216) y el chorro (~205) | `m.stunT = 5` al romper la concha; carril azul 0.6 s en el chorro |
| **Ciempiés Rey** | `jefes3.js`, `ciempies_rey.brain` (`D.anillo`, `D.tiro`) | no pegar si `g.player.sliding` o está en el aire; el salto «de frente» con anillo de 0.8 s |

Y, de lo suelto: **`usarOfrenda`** (`jefes2.js`): `meta.ofrendaDia` con 3 días de enfriamiento; **`tools/revisar-avisos.mjs`**: que `PENDIENTES` incluya el tramo B (o que busque el aviso **de cada ataque**); **`g.diag`** (`game.js`, `damagePlayer`): atribuir también los mangos y los avisos sin `quien`.
**Prueba:** tab-1 jugando cada jefe con la maña apagada («¿entendí qué hacer en la primera muerte?»); bot: `JEFES({ solo: ['reina_bananera','cascabel_rey','escarabajo_hercules','sapo_tata','cangrejo_rey','ciempies_rey'], veces: 10 })` con p hábil ≥ 0.9, p torpe < 0.5 y TTK ±25 % de la tabla; retocar `dano` en `jefes-balance.js` **uno por uno**; `revisar-avisos` y lint en cero.

### Fase 2C — Avisos del tramo C (≈ 0.8 versión)

| Jefe | Archivo y función | Cambio |
|---|---|---|
| **Murciélago Rey** | `caverna.js`, `REY.flyGoal` | picada con carril rojo y chillido; **se cansa** 3 s en el suelo tras cada picada; vida 130 → 190 si el TTK baja de 15 s |
| **Jefa de Ventanilla** | `archivo.js`, `tickJefa` (bloque `V.marca`) | el sellazo con `brilloAmago` y **parry** que lo anula y la atonta 1.6 s; el doble sigue rojo |
| **Señor del Arenal** | `inframundo.js`, `SENOR.update` (línea ~72) | **quitar el `setTimeout`**: guardar `m.data.slamT` y descontar con `dt` (si no, el golpe sobrevive al jefe, al cambiar de mundo o a la pausa); `anilloAviso` de 1.2 s y radio 5.5; la bomba de `volcanes.js` con círculo de 1 s |
| **Arpía** | `arpia.js`, `ARPIA.update` | silbido 1 s antes de la ráfaga y 3 rayos a media vida; se posa 2 s tras cada picada fallida |
| **Sombra Madre** | `historia.js`, `OLAS[3]` y `soltarOla` | 2 Sombras escudo a mitad de vida |
| **El Olvido** | `arena.js` | solo medir |

**Prueba:** igual que 2B, y una prueba de **limpieza**: los anillos y carriles desaparecen al morir el jefe, al cambiar de mundo (`limpiarFxGolpes`) y al pausar; con el Señor, **parado a 6 bloques la onda no pega**.

### Fase 3 — La arena del Rey (L, ≈ 1.5 versiones)

Archivo nuevo **`src/reyfinal.js`**, enlazado desde `usarCorona` (`final.js`) y desde las rutinas de limpieza de `game.js` (junto a `limpiarZopilotes…`, línea ~466).
- **`armarRedondel(g, cx, cy, cz)`**: redondel de piedra de 26 de radio, altar con la Corona, 8 postes con `K.farol`, sendero lateral. Cambia bloques con **`world.setBlock(x, y, z, id, { updates: false })`** y guarda `[x, y, z, idViejo]` en `g.rey.cambios` (tope 2 500).
- **`restaurarRedondel(g)`**: devuelve cada bloque; llamarlo **al vencer, al morir (`respawn`, `game.js:1860`), al salir al menú, al cambiar de mundo y al cargar**.
- **Guardado seguro (lo que el diseño no cubre):** `world.setBlock` anota en `world.mods` y `saveWorld` corre cada 30 s: **cerrar la pestaña a media pelea dejaría el cráter guardado**. Hay que escribir la lista de cambios en **`meta.reyArena`** (≈ 30 KB como mucho, opcional con `Number.isFinite`/`Array.isArray` al leer) y, **al cargar**, restaurarla antes de que el jugador llegue; se borra al restaurar. Sin `SAVE_FORMAT` nuevo (campo opcional).
- **El anillo que se achica** (26 → 18 → 14): `K.ceniza` cae por `world.tickCaidas` (`world.js:535`): **confirmar** que la ceniza puesta con `setBlock` entra en la cola de caídas (si no, usar `K.sand`/grava) y que cae sin dejar piezas en el mundo; la cornisa a 6 bloques (3–4 de daño, no muerte).
- **Devolver la Corona si el jugador muere** (**lo urgente**): `meta.coronaEnUso` y, en `respawn`, `g.giveItem(CORONA, 1)` si el Rey no fue vencido; que `esUnico(552)` sea verdadero para que `recogerUnicos` también la rescate.
- **`g.rey`** (`{ fase, cambios, gente, t0 }`): no se guarda.
**Prueba:** tab-1: (a) pelear y **morir**; (b) pelear y **volver al menú**; (c) pelear y **cerrar la pestaña**, reabrir; (d) `/prueba final`: el mundo queda **idéntico** (comparar con `world.mods` antes y después: misma cantidad de entradas); mundo viejo sin `meta.reyArena` carga igual; 2 500 bloques sin tirones (medidor de CPU).

### Fase 4 — El cerebro del Rey (L, ≈ 1.5 versiones)

Mover `FINAL.rey_zopilote.update` a `reyfinal.js` y delegar por `D.fase`; mantener `final.js` para `rayo`, `Pluma`, `vencerRey`, `creditos`.
- **Umbrales** 70/40/12 y **vida** a remedir (hoy 2 500 × 0.85; el diseño pensaba en 1 000). **Tranquilo**: bajar la vida y quitar el combo de F4.
- **F1:** picada con `avisoEmbestida(m, g, 0.9, 20, 3)` (carril rojo, hoy solo hay `chilla`); picotazo posado con `atacar(…, tipo: 'mordida')` ya dado; **3 zopilotes de escolta** (los de `fauna3.js`, 6 de vida, con `brilloAmago`).
- **F2:** el Canelo ladra 1 s antes de cada rayo (`canelo.js: esCanelo`), sin él el trueno suena 0.6 s antes; rayo que cae bajo el Rey lo deja «sonado» 2 s; `anillo` que se achica con aviso.
- **F3:** **coraza de ceniza** que absorbe el 65 % del corte hasta un golpe fuerte contundente (copiar la lógica de `jefes3.js` `onHurt`/`D.concha`) y queda expuesta 6 s; **aletazo rasante** (ola baja con carril blanco que se salta o se pasa barriéndose: `trySlide`); 2 zopilotes de ceniza cada 20 s.
- **F4:** combo de tres golpes dorados (`atacar(…, cadena: 3)`); cada parry bien hecho resta un 3 % y aturde; **el coro**: 4 toques (cada 10 s) que lo frenan 3 s; **golpe final**: con ≤ 5 % queda de rodillas y el próximo golpe lo termina (12 s o se levanta).
- **El aturdimiento hay que programarlo:** `entities.js` solo respeta `stunT` en el comportamiento por defecto; el cerebro del Rey es `kind.update`, que **no lo mira**: en `update`, `if (m.stunT > 0) { …no atacar…; return }`.
- Tamaño de lo que cambia: **`bot-pelea.js`** necesita duelos por fase (`rey_f1…rey_f4`, con `solo`) y que el perfil `habil` golpee la coraza con el golpe fuerte.
**Prueba:** bot: `JEFES({ solo: ['rey_zopilote'], perfiles: ['torpe','promedio','habil'], veces: 10 })`: **100–130 s** para el torpe, `habil` recibe **6–9**, p promedio ≈ 0.8, y **muertes esperadas ≈ 1**; la suma de fases coincide con la tabla; tab-1: jugar cada fase con `/prueba final fase2|fase3|fase4` (se agregan en la fase 9). Remedir con 10 duelos por celda en 2 o 3 mundos.

### Fase 5 — Música y cámara (M, ≈ 0.8 versión)

- **`musica.js`:** `composeRey(fase)` (al lado de `composePelea`, línea 105) y el parámetro `s.rey` en `Music.update` (línea ~120), que **sustituye** a `s.pelea`; en `game.js:3393` agregar `rey: this.rey ? this.rey.fase : 0`. Capas por fase como en el diseño §3.4 (todo con los bancos que ya hay: `latido`, `campana`, `trueno`, `rumble`, `aleteo`, `arpia`, `aplausos`, `loop.marimba`, y las notas de marimba y arpa). Subida de volumen por fase con `gain.setTargetAtTime`; **callar en pausa** (`g.paused`) y con el locutor.
- **Cámara:** 5 momentos de ≤ 5 s con `g.shake`, `g.hurtTilt`, `g.slowmo`, las **barras de `foto.js`** (`#barras-cine`; hoy se alternan con `toggleFoto`: exponer una función para encenderlas y apagarlas por código), saltables con cualquier tecla; **`calmaActiva(g)`** quita `shake` e inclinaciones.
**Prueba:** tab-1 con `/prueba final fase2|3|4`: se oye crecer; nunca más de 5 s sin control; con «Movimiento tranquilo» no hay sacudidas; el volumen del ajuste «Música» se respeta; pausar calla.

### Fase 6 — Gente y trama (M, ≈ 0.8 versión)

- **Subir con faroles:** al armar el redondel, para cada persona que el jugador ya conoce (misma regla que `listoEpilogo`: `meta.gente.p[k]`, `H.guila`, `M.prima`, `M.anselmo`), `ponerPersona(g, k, x, z, y)` (`gente.js:93`) en la ladera; `m.data.inmortal = true` (**flag nuevo**, ver §1.2).
- **Frases:** `decir(g, m, texto, seg)` con las de la tabla de §3.3; reutilizar `PERSONAS[k].frases` donde se pueda, y agregar `rey: [...]` a cada persona.
- **`ayudaEnPelea`** (`defensa.js:83`): abrir `const pelea = g.asedio || g.nocheLarga || g.rey`; Chepa, Flor y Tino ya saben curar, dar de comer y reparar; sumar Doña Eulalia (bendición de 6 min de aguante en el preludio).
- **Wilber** (`gente.js: disparar`): que derribe a los zopilotes de la escolta.
- **Carta de Zenaida** (`carta_zopilote`): agregarla a `CARTAS` de `historia.js` y entregarla por `correo.js` (Don Chema) en el preludio, con `ui.dialog` de 4 s.
- **Seguro de Rigo** (`rigo.js`, `meta.seguro`): que morir en la pelea no suelte nada **una vez** (**por confirmar** dónde se aplica hoy).
**Prueba:** tab-1: con la casa llena, con la casa vacía y con la mitad de la gente: **solo suben los que ya conoce**; ninguno muere ni se atasca; el Canelo avisa; un mundo sin la historia terminada pelea al Rey con menos ayuda y no rompe nada.

### Fase 7 — Remate, epílogo y únicos (M, ≈ 1 versión)

- **`vencerRey`** (`final.js`): estado `D.vencido`, alba (`g.time` hacia el amanecer con tope, respetando `calma.js`), zopilotes que se van, faroles que se encienden, remate hablado (§3.6), **Yendry le da la Campana de la casa**; premio **una sola vez** (`meta.premioJefe`), la segunda vez no repite créditos ni ítems.
- **Créditos** (`final.js: creditos`): reemplazar `CREDITOS` (10 líneas fijas) por un rollo **dinámico**: nombres e íconos de `meta.gente`, sus frases y **tres números de la partida** (días, caídas, jefes); mantener «Seguir jugando».
- **Epílogo** (`epilogo.js: lineas`): sumar las líneas de la §3.7 del diseño **condicionadas** a que cada hilo exista, más **la del Rey** (`meta.reyZopilote`). **Ojo:** la línea 23 actual, «Don Anselmo todavía no ha ido por los cigarros», **contradice** la del diseño («fue por los cigarros. No volvió»): hay que hacerla condicional.
- **Ítems únicos** en `blocks.js` (ids 586–599 o 1190–1199): `campana_casa`, `pluma_oro_rey`, `mantilla_zenaida`, `foto_cumbre` (y **reusar** `cigarros_62`, 510); `esUnico` ampliado; recetas en `recipes.js` (4 plumas de oro → Alas del Amanecer; ver `alas.js`); la **campana** con clic derecho en el patio (cura 6, llena la comida un poco y +1 de reputación al día: `meta.campanaDia`); la **foto**, como bloque de pared decorativo.
- **Mañas de jefe** (`manas.js`): familia nueva `jefe` en `FAMILIAS`, 9 entradas en un arreglo aparte (`MANAS_JEFE`) que se guardan en `meta.manasJefe` **sin gastar** casillas (`NIVELES`), y `mana(g, k)` de `progreso.js` que lee ambas listas. Los 9 efectos en: telaraña/veneno de araña (`bichos`), avisos +0.15 s (`golpes.js: VENTANA_AVISO`), empuje de las embestidas (`jefes2.js`), veneno −30 % (`addEffect`), escudo +20 % (`combate.js`), aire del barrido (`trySlide`), lava y fuego −30 % (`ignifugo`), planeo +25 % (`alas.js`) y **+2 corazones** (`meta.vidaExtra`, como el Corazón).
- **MIN_VERSION y MIN_IDS:** ids nuevos ⇒ subir `MIN_VERSION` y la firma (`tools/revisar-version.mjs`).
**Prueba:** tab-1: vencer al Rey **dos veces** (la 2.ª no repite créditos ni ítems ni maña); epílogo con y sin cada hilo; los créditos con la casa llena y vacía; `node tools/revisar-version.mjs`, `revisar-ext-item.mjs`, `revisar-nombres.mjs`.

### Fase 8 — Arte (S, en paralelo)

Entregar a GPT los 4 pedidos de `PEDIDOS_ARTE_LOTE3.md` §5 (campana, pluma de oro, mantilla, foto; el cigarro ya tiene ítem 510) y conectarlos con `public/sprites/arte/<clave>.png`. **No bloquea nada**: el fallback de la v12.8.2 (bolsita con inicial) deja jugar. **Prueba:** `tools/revisar-iconos.mjs` y `tools/hoja-mano.js`.

### Fase 9 — Docs y cierre (S, ≈ 0.3 versión)

`BALANCE.md` (la tabla «Fase 2 medida» completa y la del Rey por fase), `ARBOL_CONOCIMIENTO.md`, `CHANGELOG`, `GAME_VERSION`; **`pruebaFinal(g, que)`** (`final.js:236`): agregar `fase2|fase3|fase4|creditos|epilogo|remate`, que salten a su fase **con la arena armada**. **Prueba:** cada `/prueba` salta a lo suyo; lint y build en cero.

## 3. Revisión de los textos del final

Reglas: **«usted»**, **neutro de género**, **nada contra instituciones reales**, tico natural sin caricatura. Revisé lo que existe (`final.js`, `epilogo.js`, `historia.js`, `gente.js`, `anselmo*.js`, `prima.js`, `guila.js`, `rigo.js`, `correo.js`, `expediente.js`) y los textos **propuestos** por el diseño §3.3, §3.6 y §3.7.

| Texto | Dónde | Veredicto |
|---|---|---|
| Avisos y toasts del Rey («¡El Rey Zopilote llama la tormenta! Fíjese en los círculos del suelo», «Está muy alto: espere a que se pose o tírele de lejos») | `final.js` | ✔ «usted» y neutro |
| Créditos fijos | `final.js: CREDITOS` | ⚠ (1) **«Hecho para el canal de nanoyackson»**: depende de la decisión pendiente G4 del `CHECKLIST_PUBLICAR.md` (la marca puede salir); (2) **«Íconos con ayuda de GPT»** queda corto frente a `THIRD_PARTY.md` (retratos, logo, fondo del menú, billetera y texturas también son de IA): unificar con «arte generado con IA»; (3) falta nombrar a las notas de marimba (`CREDITS` de `version.js` las tiene, el rollo no); (4) «Y usted, que llegó hasta aquí» ✔ |
| Epílogo actual | `epilogo.js: lineas` | ✔ voz impersonal, sin género. **Línea 23** («Don Anselmo todavía no ha ido por los cigarros.») **choca** con la línea nueva del diseño: hacerla condicional |
| Cartas de Zenaida («Mi güila:») | `historia.js` | ✔ «güila» sirve para cualquier persona; «usted» |
| «¡Usted es la cepa de doña Zenaida!», «la misma cara de su abuela» | `historia.js:361, 563` | ✔ (`cepa` es nombre, no concuerda con la persona) |
| «Hasta la municipalidad quiere ponerle su nombre a una calle. Está en estudio.» | `historia.js:563` | ✔ genérico y ficticio; **escribir siempre «la Municipalidad de Tiquicia»** (el expediente ya lo hace) para que nunca se lea como una real |
| Expediente («Ruta del Progreso», «Lic. Porras») | `expediente.js` | ✔ sátira **ficticia declarada** de una burocracia inventada; ningún nombre propio de institución real. Conviene no agregar siglas reales (ICE, CCSS, MOPT, INS…) en lo nuevo |
| «Mijo, mija, yo le llevo un tres leches» (Doña Eulalia) | diseño §3.3 | ⚠ **par de géneros**; usar «mi cepa» o «mi güila», que ya usa el juego |
| «Coma, coma, que después no hay tiempo» (Chepa) · «Esa espada llega rota, déjeme verla» (Tino) · «Aguante, que ya casi» (Flor) | diseño §3.3 | ✔ |
| «Seguro contra Sombras… cobré por adelantado, mi cepa» (Rigo); «El tío Rigo cobró la póliza» | diseño §3.3, §3.7 | ✔ seguro genérico (sin aseguradora real) |
| «Le doy 300 colones por este cerro» (Marielos) | diseño §3.3 | ✔ (la moneda del juego) |
| «Yendry aprendió a parar un golpe. Todavía no a pedir permiso.» | diseño §3.7 | ✔ (que no se lea como burla de una niña: es cariñosa; **por confirmar** con nanoyackson) |
| «Voy por los cigarros.» / «cigarro sin encender» | diseño §3.3, §4 | ✔ ya es parte de la historia (`cigarros_62`); es un recuerdo, no una apología |
| «La Municipalidad quiere pasarle una carretera a la casa, para el 2049» | `expediente.js:44` | ✔ ficticia |
| «En la iglesia hasta tocaron las campanas» | `historia.js:541` | ✔ respetuoso |
| Frases de las personas nuevas (`rey: [...]`) | por escribir | **regla:** una sola persona por frase, «usted» o sin pronombre, sin sexo del jugador, sin nombres de instituciones reales ni de personas reales |

**No encontré voseo** (`tenés`, `mirá`, `vení`…) ni tuteo en los textos narrativos revisados (las coincidencias eran «venía»). **Sí conviene** pasar por `INVENTARIO_TEXTOS.md` y por `tools/revisar-estilo.mjs` los textos nuevos antes de cada versión.

## 4. Cómo intercalar el final con lo que falta de contenido

**Restricciones.** Una sola constructora (en serie). El final **no depende** de C6, C7, C8-B ni C8-C, salvo detalles opcionales (la herradura para el tope, el mostrador). **C8-C sí depende** de C5-A (hecha), C6 y C7. **C7 cambia el generador** (`genVersion` 21) y conviene **no mezclarlo con una fase del Rey** (si algo falla en los mundos nuevos, que no se confunda con la pelea). La **PWA** (E1–E6 del `CHECKLIST_PUBLICAR.md`) **no toca el juego** (manifest, `BASE_URL`, service worker, íconos): puede correr **en paralelo**, en otra sesión, desde el bloque 3.

**Propuesta: siete bloques de dos versiones**, uno de contenido y otro del final, siempre cerrando con lint, build y la prueba de cada fase.

| Bloque | Contenido | Final | Por qué ahí |
|---|---|---|---|
| **1** | — | **2B + 2C** (+ enfriamiento de la Ofrenda) y **devolver la Corona al morir** | Cierra la curva y quita el riesgo de perder la Corona; la fase 0 manda: «no se publica sin que la curva se cumpla» |
| **2** | **C6-0 y C6a** (ids, `oficios2.js`, banco, torno, horno, carpintería y alfarería) | **3 Arena del Rey** | La arena es infraestructura invisible (no compite con lo de oficios) y es lo que más riesgo de guardado tiene: conviene hacerla temprano |
| **3** | **C8-B** sin la herradura ni el mostrador (patronal, novena, tope, cimarrona de redoble) | **4 Cerebro del Rey** (medir con el bot) | La patronal reusa `fiestas2.js`, ajena al combate; el cerebro necesita varias corridas del bot, que se hacen sin tocar contenido |
| **4** | **C6b y C6c** (herrería, mostrador, encargos de taller) | **5 Música y cámara** | La música del Rey comparte `musica.js` con nada de oficios; C6c toca `encargos2.js`, aparte |
| **5** | **C7 sin el generador** (ítems, sismógrafos, erupción como evento, termal puesto a mano) | **6 Gente y trama** | La gente sube con lo que ya hay; el volcán no toca a las personas |
| **6** | **C7 con `genVersion` 21** (tubos, termales, observatorio) | **7 Remate, epílogo y únicos** | El generador va **solo** de contenido; el remate es lo más narrativo y se prueba mejor con el juego estable. **Punto de control:** una partida completa de nanoyackson hasta los créditos |
| **7** | **C8-C** (Comité de Caminos y mercado regional; ya hay C6 y C7) | **8 Arte (en paralelo desde el bloque 2) y 9 Docs y cierre** | Lo último del contenido, y el cierre del final |

**Resultado:** el final queda **jugable de punta a punta en el bloque 6** (≈ versión 12.9.x–12.14) y **cerrado en el 7**, **antes** de la PWA y el multijugador; la PWA puede ir en paralelo y publicarse cuando termine el bloque 7. Con el multijugador decidido «antes de publicar» (checklist A4), **recomiendo empezarlo después del bloque 7**: el final asume un solo jugador, y la arena, la gente y el golpe final hay que repensarlos (¿quién da el golpe? ¿la Corona la tiene el anfitrión?).

**Puntos de control con nanoyackson (no se avanza sin ellos):**
1. Después del bloque 1: ¿la vida y la presión del Rey de hoy (2 500 × 0.85) le parecen bien **jugando**? (hoy nadie lo ha peleado a mano).
2. Después del bloque 3: el Rey de 4 fases, **a mano**: ¿cuántas veces murió? (objetivo ≈ 1).
3. Después del bloque 6: una **partida completa** (casa llena → Corona → créditos → epílogo).

## 5. Decisiones que quedan para nanoyackson

1. **Vida del Rey:** 2 500 (hoy) contra 1 000 (diseño): la fija la medición de la fase 4.
2. **¿La historia exige vencer al Rey?** El diseño recomienda que **no**; el epílogo ya cuenta si ocurrió (hay que hacer condicional la línea de Anselmo).
3. **«Épico» = ¿1 muerte de media?** Y la **Corona al morir**: ¿se devuelve siempre o una sola vez? (recomiendo siempre).
4. **Marca en los créditos** («Hecho para el canal de nanoyackson»): depende de la decisión de la publicación.
5. **Las mañas de jefe**: ¿gratis (sin casilla) como dice el diseño, o dentro de las casillas existentes?
6. **Textos de la gente en la pelea y del epílogo:** los revisa nanoyackson al jugarlo (COLA §8).
7. **Dónde va el multijugador** respecto del final (propongo después del bloque 7).

*Escrito por la sesión investigadora, solo lectura. No toqué `src/` ni `tools/`.*
