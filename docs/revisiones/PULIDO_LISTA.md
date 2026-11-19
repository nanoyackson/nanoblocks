# Auditoría de pulido — v13.5.2 en vivo

Hecha el 18-nov jugando la versión en vivo (https://nanoyackson.github.io/nanoblocks/, generador 31) en el navegador integrado de la app, con un mundo propio («Prueba pulido», semilla `pulido-1`; no se tocó ningún mundo de Isaac). Solo lectura: no se cambió `src/` ni `tools/`. Capturas en `docs/revisiones/capturas_pulido/`.

## 0. Qué se pudo y qué no (leer primero)

**Límite importante:** el navegador integrado **no permite capturar el puntero** (`requestPointerLock` falla con `WrongDocumentError`), y sin captura el juego ignora el teclado. Por eso **no se pudo caminar, picar, pelear ni nadar con entrada real**. Lo que se hizo en su lugar:
- Se jugó lo que no necesita captura: menú, crear mundo, prólogo, HUD, y todos los paneles abierto con la API de depuración (`window.nanoblocks.ui`), con 1024 × 768 y 375 × 812.
- Se movió y se hizo pasar el tiempo con `game.update` (≈ 8 minutos de juego: día, noche, hambre, muerte en lava, reaparecer, guardar y cargar, cueva).
- Consola, red y rendimiento por medición directa.
- Texto: pruebas del repo (`revisar-iconos`, `revisar-nombres`, `revisar-datos`, `revisar-recetas`) y búsquedas en `src/`.

**No cubierto** (necesita a una persona con ratón y teclado en un navegador normal; lista al final, §5): sonido, animación de criaturas y herramientas (1.ª y 3.ª persona, agachado, nado, cuerda), combate de verdad, FPS reales con muchas criaturas.

**Los «Haga clic para jugar» que se ven encima de paneles en las capturas son un artefacto de esta prueba** (el hint solo se muestra si el bloqueo falla: `ui.js:562-563`), no un defecto.

**Resumen:** 0 P1 (nada rompe), 10 P2, 17 P3 (Tanda 4, por código, agregada el 19-nov: PU-18 a PU-26). La consola quedó limpia: un único aviso propio del juego (`getImageData`, hallazgo 15). Guardar, cargar, morir y reaparecer funcionan sin errores; ninguna petición falló (250 recursos, 0 con estado ≥ 400).

---

## 1. Hallazgos

Formato: **PU-nn · prioridad · título** — pasos — dónde — captura.

### Tanda 1 — HUD, avisos y primeros minutos (8)

**PU-01 · P2 · El objetivo se pisa con el capítulo, en el panel de arriba a la izquierda.**
La línea «🧭 Sobrevivir la primera noche · 0/13» se parte en dos y tapa «📖 Capítulo 1/9 · La herencia (C)» (el texto de las dos queda encimado y ninguna se lee bien). Se ve desde el primer segundo de un mundo nuevo, con 1024 y con 375 de ancho.
- Pasos: crear un mundo → mirar el panel bajo el minimapa.
- Dónde: `#ind-meta` está `position: absolute; top: 196px; max-width: 240px` (`src/style.css:203-208`), pero `#objetivo` (que empieza en y = 214) vive en el flujo de `#lado-hud`; `src/indicadores.js:34`. Con el título en dos líneas (40 px) invade al de abajo.
- Arreglo: meter `#ind-meta` dentro del flujo de `#lado-hud` (que empuje en vez de flotar), o `white-space: nowrap; text-overflow: ellipsis`. Revisar `.sin-mapa` y la variante a ≤ 700 px.
- Captura: `01_hud_objetivo_solapado.jpg`.

**PU-02 · P2 · El primer clic obligatorio se salta el prólogo.**
Para capturar el ratón hay que hacer clic en «Haga clic para jugar»; ese `mousedown` también dispara `fin()` del prólogo (`window.addEventListener('mousedown', fin, true)`), así que un jugador nuevo que hace clic nada más cargar solo alcanza a leer la primera línea («A su casa llegó una carta.») y nunca ve el título «Las cartas de la abuela». Observado: el texto desapareció con el primer clic.
- Pasos: crear mundo en supervivencia → al ver «A su casa llegó una carta.» hacer clic.
- Dónde: `src/prologo.js:19-22` (mousedown); el comentario de `:12` quiere evitar justo esto con `pointerlockchange`, pero el `mousedown` lo anula.
- Arreglo: quitar el `mousedown` (dejar `keydown` y el soltar-ratón), o ignorarlo hasta 3 s; mostrar «Haga clic para empezar» bajo el título del prólogo.

**PU-03 · P2 · Las pestañas de la libreta están cortadas: 5 de 11 invisibles y la activa sin resaltar.**
La tira `lib-tabs` mide 1 170 px de contenido en un contenedor de 590 (`overflow: auto`, `nowrap`), sin barra ni degradado: «Logros (L)», «Habilidades (H)», «Bestiario (K)», «Diario (N)» y «Lo que se dijo» no se ven, y como se abre en Logros, **no aparece ninguna pestaña marcada**. Quien no conozca los atajos no sabe que existe el bestiario.
- Pasos: abrir la libreta (L) con 1024 de ancho.
- Dónde: `.lib-tabs` (`src/style.css:98-100`, `:225`), pestañas creadas en `src/libreta.js`.
- Arreglo: dejar que envuelvan en dos filas (`flex-wrap: wrap`), o desplazar para dejar visible la pestaña activa (`scrollIntoView`) más un degradado en el borde.
- Captura: `05_libreta_pestanas_cortadas.jpg`.

**PU-04 · P2 · La Ayuda (Y) no enseña los controles y empieza por el combate.**
La pestaña tiene 10 900 caracteres con las secciones «⚔ Pelear», «🌿 Sobrevivir», «🏡 La casa», «🌑 Lo que anda suelto», «📖 Mientras tanto». No hay una sección «Controles / Primeros pasos» (mover, saltar, picar, poner, inventario, mapa, libreta); WASD solo aparece a mitad del texto (posición 2 059). Un jugador nuevo abre Ayuda y lo primero es «Escudo y parry».
- Dónde: `src/ayuda.js` (orden de las secciones).
- Arreglo: sección inicial «🧭 Primeros pasos y controles» (teclas y 5 acciones), y la de combate después de Sobrevivir.

**PU-05 · P3 · La pantalla de muerte y la pausa usan tuteo/«usted» mezclados.**
- «Sus cosas quedaron en el bolso… **Conserva** la armadura y lo que tenía en la mano.» (pantalla de muerte): «Conserva» suena a tuteo imperativo en un juego en «usted».
- El aviso de la carta dice «**Léala** con C» (`historia.js:262`) y el del cuaderno de la abuela «**La lee** con C» (`cuaderno.js:48`).
- Arreglo: «Se conserva la armadura…» (`supervivencia.js:116`) y «Léala con C» en los dos.
- Captura: `06_pantalla_de_muerte.jpg`.

**PU-06 · P3 · Avisos que tapan el título del menú de pausa.**
El aviso («📓 Una hoja del cuaderno de la abuela: …») se queda dibujado encima de «Juego en pausa» y esconde el título del menú.
- Pasos: esperar un aviso largo y pulsar Esc.
- Dónde: capa de avisos de `src/ui.js` (`toast`) vs. `#screen-menu`/pausa; z-index o esconder avisos al pausar.
- Captura: `07_pausa_tapada_por_aviso.jpg`.

**PU-07 · P3 · Tarjeta del mundo con el texto cortado («10:54:48 p. m. …»).**
En «Escoja un mundo» la segunda línea de la tarjeta («Supervivencia · día 1 · 18/11/2026, 10:54:48 p. m. · v13.5.2») no cabe y se corta con puntos suspensivos; la versión (lo útil) es lo que se pierde.
- Dónde: lista de mundos en `src/ui.js` (formato con `toLocaleString`).
- Arreglo: fecha corta sin segundos («18/11 22:54») y la versión primero o en otra línea.
- Captura: `09_lista_de_mundos_texto_cortado.jpg`.

**PU-08 · P3 · Mensaje inicial sin dirección: se aparece mirando el mar.**
Al empezar, la cámara apunta a mar abierto (solo se ve agua, cielo y la mano con una galleta) y el objetivo dice «ahí le dejó tablas, comida y una mesa» sin dónde. La brújula marca el 📖 pero está arriba y chica. Se entiende, pero la primera imagen no invita a moverse.
- Arreglo (producto): al nacer, girar la vista hacia el objetivo (o a tierra firme) y que el primer aviso nombre la flecha («siga el 📖 de la brújula, arriba»).
- Dónde: `giveStarterKit` / `puntoDeSpawn` en `src/game.js`.

### Tanda 2 — Paneles y ancho de teléfono (7)

**PU-09 · P2 · Ajustes: el botón «Listo» fijo tapa los campos del final.**
El botón `#btn-settings-back` es `position: sticky; bottom: 0` sin fondo ni espacio reservado, y queda **encima** de «Clave TURN (opcional)» (el último campo) hasta que se hace scroll. También se ve la barra de scroll blanca del sistema, sin el estilo vidrio del resto.
- Dónde: `src/style.css:775` (agregar fondo `var(--surface)` + `padding-bottom` al contenedor), barra de scroll con el estilo del juego.
- Captura: `08_ajustes_listo_tapa_campos.jpg`.

**PU-10 · P2 · Recetas con 1024 × 768 casi no se ven (≈ 1,5 filas).**
En el inventario con altura 768 (también 1366 × 768, portátil común) el panel «Recetas» gasta su alto en el título, el buscador y las 8 etiquetas de filtro; la lista visible muestra solo la primera receta y media (con barra de scroll). Va contra la regla de `CLAUDE.md` (Recetas a altura fija con scroll interno) sin dar espacio a la lista.
- Dónde: `#craft-panel` (`src/style.css`), filtros en dos filas → una fila con scroll o chips más chicos; lista con `min-height` de 6 filas.
- Captura: `02_inventario_1024x768.jpg`.

**PU-11 · P2 · Inventario a 375 px: se sale por la derecha y Recetas queda fuera de pantalla.**
Medido: `inv-panel` termina en x = 388 (> 375), el botón «…» y la novena columna quedan cortados, y `craft-panel` está en x = 402-745 (hay que deslizar de lado para encontrarlo).
- Dónde: `#screen-inventory`, `inv-panel main-panel` (anchos fijos), `src/style.css` en `@media (max-width: 700px)`.
- Captura: `03_inventario_375.jpg`.

**PU-12 · P2 · No hay controles táctiles ni aviso: en teléfono se puede «jugar» pero no moverse.**
No existe soporte táctil en `src/` (ningún `touchstart`/`pointerType`). El menú a 375 px se ve bien, deja crear un mundo, y se queda en «Haga clic para jugar» sin manera de caminar. Tampoco hay aviso en navegadores sin `requestPointerLock`.
- Arreglo mínimo (barato): detectar `(pointer: coarse)` o falta de `requestPointerLock` y mostrar en el menú y en «Mundo nuevo» «NanoBlocks se juega con teclado y ratón; en el teléfono todavía no». Decidir con Isaac si habrá modo táctil (es un proyecto aparte).
- Dónde: `src/ui.js` (menú), `index.html`.

**PU-13 · P3 · HUD a 375 px: el reloj tapa la brújula y la billetera tapa el aire/sed.**
«☀ Día 1 · 07:45» cubre el extremo derecho de la brújula («NE» cortado) y el chip «₡0» con el cofre queda encima de la fila de burbujas de aire/sed.
- Dónde: `@media (max-width: 700px)` en `src/style.css`; el reloj debajo de la brújula o la brújula más angosta.
- Captura: `04_mapa_375_hud.jpg`.

**PU-14 · P3 · «mouse» y «ratón» mezclados en el texto visible.**
Ajustes dice «Sensibilidad del **mouse**», la Ayuda dice «Pase el **ratón** sobre un objeto». (En `src/` hay 37 «mouse», casi todos nombres de código; hay que revisar solo los textos.)
- Arreglo: elegir «ratón» (o «mouse») y buscarlo en `index.html` y los textos.

**PU-15 · P3 · Advertencia de consola de `getImageData`.**
Una sola advertencia propia del juego al cargar: «Canvas2D: Multiple readback operations using getImageData are faster with the willReadFrequently attribute set to true».
- Dónde: los `getContext('2d')` que luego se leen: `src/textures.js:831`, `:856` y `src/models.js:172`; crear esos canvas con `{ willReadFrequently: true }`.

### Tanda 3 — Balance y datos (2 con sugerencia, 1 pregunta)

**PU-16 · P3 (balance, preguntar a Isaac) · El hambre baja rápido para el kit inicial.**
Medido con `game.update` a la espera quieta (sin correr): comida y sed bajan ≈ 1 punto por minuto de juego (un día dura 20 minutos): 5 → 3 → 2 → 1 en 3 minutos; quedó en 0 y empezó a perder vida (20 → 15). El kit de inicio es 4 galletas y 6 antorchas, y tras reaparecer se vuelve con comida 5 y sed 14 sobre 20, lo que se ve a primera vista como «estoy muriendo de hambre».
- Pregunta: ¿está bien que en los primeros 5 minutos haya que ya comer? Si no: bajar la tasa en el día 1 (o más comida al empezar) y reaparecer con comida y sed a 10.
- Dónde: `src/player.js:200-201` (`hungerT += dt * (moving ? 1,2 : 0,8)`, un punto cada 45 unidades: ≈ 37 s caminando, 56 s quieto), `respawn` en `src/game.js`.

**PU-17 · P3 · Ítems sin línea de «para qué sirve».**
Con el tooltip real (`fichaItem` en `src/comodidad.js:46`), 678 de 1 299 ids muestran solo el nombre; muchos son variantes internas, pero conviene revisar los que sí están en manos del jugador: *Moneda de 5/10/25/50/100*, *Bota vieja*, *Perla*, *Escama de sirena*, *Pedazo de la tierra/del agua/del fuego/del cielo*, *Maletín del tío Rigo*, *Trofeo del torneo de pesca*. `revisar-iconos` y `revisar-nombres` pasan (400 ítems con dibujo, 0 problemas); falta una prueba de «ítem sin descripción».
- Arreglo: una línea de uso/origen para los ítems que se pueden tener en el inventario, y una prueba nueva `revisar-fichas.mjs` (ya hay `lista-items.mjs`).

(El conteo exacto cambia si se revisa solo lo que se obtiene en una partida normal; hay que filtrar los ítems internos.)

---

## 2. Tandas propuestas para la constructora

| Tanda | Versión sugerida | Hallazgos | Esfuerzo |
|---|---|---|---|
| **T1 · HUD, avisos y primeros minutos** | v13.5.3 | PU-01, 02, 03, 04, 05, 06, 07, 08 | 1 día |
| **T2 · Paneles y teléfono** | v13.5.4 | PU-09, 10, 11, 12, 13, 14, 15 | 1 día |
| **T3 · Balance y datos** | v13.5.5 | PU-16, 17 (+ lo que salga de la lista manual de §5) | 0,5 día + decisión de Isaac |

Recomiendo T1 primero: PU-01 y PU-03 se ven en la primera pantalla y en el primer uso de la libreta.

## 3. Primeros 15 minutos (resumen de lo que vive un jugador nuevo)

1. **Menú** y **crear mundo**: claros, textos cortos y con ayuda de dificultad («Al morir, sus cosas quedan en un cofre…»). Opciones «Supervivencia/Creativo», «Normal/Tiquicia de bolsillo». Sin problema.
2. **Prólogo**: bonito, pero el clic de «jugar» lo corta (PU-02).
3. **Inicio**: HUD completo, minimapa, brújula, objetivo y un aviso guiado («Siga la flecha de la brújula… clic izquierdo sostenido a un árbol»), bien dicho en «usted». El panel de objetivo se pisa (PU-01) y no hay controles a la vista (PU-04).
4. **Primera carta**, cuaderno de la abuela, objetivo «Sobrevivir la primera noche · 0/13»: se entiende qué hacer, aunque los avisos aparecen uno detrás de otro (PU-06 por el choque con la pausa).
5. **Primera noche**: oscurece bien, estrellas, la barra de aire/sed visible; a los 4 minutos de espera quieta el hambre ya pega (PU-16).
6. **Morir** (lava en una cueva): pantalla clara, da coordenadas y consejos útiles («Poner un bloque adelante cuesta menos que morir»). Reaparecer funciona.
7. **Guardar y cargar**: guarda al instante (1 ms), la tarjeta del mundo aparece, cargar restaura día, hora, posición, vida, comida e inventario sin avisos en consola.

## 4. Rendimiento (medición directa, RTX 5050, 1024 × 768, resolución 0,7)

| Escena | Actualizar | Dibujar | Llamadas / triángulos | Criaturas |
|---|---|---|---|---|
| Inicio (playa, mar) | 5,4 ms (máx. 7,2) | 3,4 ms | ≈ 320 / ≈ 598 000 por cuadro | 36 |
| Cueva (cayendo a lava) | 6,2 ms, p90 8,6, **máx. 18,5** | 3,1 ms | ≈ 365 / ≈ 423 000 | 26 |
| Tras 3 min de juego en el inicio | — | — | — | **52** |

- ≈ 9-10 ms por cuadro: sin tirones propios en esta máquina. El único pico fue un `update` de 18,5 ms al llegar a la cueva (generación de trozos). **No es representativo de un portátil modesto**: conviene repetirlo en uno (Chrome, 60 s caminando en superficie, pueblo, cueva grande y con 30+ criaturas).
- El panel mostró 15-18 FPS porque el navegador integrado estaba oculto (lo limita), no por el juego: no tomar esa cifra.
- Carga de red: 250 recursos, 0 fallos; DOM listo a 0,3 s y carga a 0,56 s con caché.
- Hay 52 criaturas a la vez cerca del inicio tras 3 minutos: revisar el tope de aparición en superficie (`entities.js`) si en un equipo modesto se nota.

## 5. Lista para una persona con ratón y teclado (lo que no se pudo cubrir)

Para repetir en Chrome normal, con un mundo nuevo (no el de Isaac); 15 minutos:
1. **Sonido**: pasos en pasto/arena/piedra/agua, picar (madera, piedra, mena), golpe con espada y con mano, hambre/sed, campana de la casa, cueva (eco), lluvia, noche (grillos), criaturas (zopilote, chancho, murciélago). Volumen 60 % y «Subtítulos de sonidos» activados: ¿cada sonido tiene su subtítulo?
2. **Animación**: herramientas en 1.ª y 3.ª persona (picar, golpear, comer, beber, lanzar), agacharse (sneak), nadar, cuerda del espeleólogo (subir/bajar/soltar), escalar, caer y rodar (V), escudo.
3. **Combate**: una Sombra de noche (daño, empuje, avisos de «¡Débil!/Resiste»), un cangrejo ciego y un escarabajo de calcita en cueva, y un dueño de salón; mirar que los avisos no se encimen.
4. **Pueblo**: pulpería, tienda (`openShop`), encargos, precios (₡) vs. el botín del día 1.
5. **Rendimiento real**: FPS con F3 en superficie, pueblo, cueva grande y 30+ criaturas.
6. **Táctil**: probar en un teléfono real si Isaac decide soportarlo.

Si algo de esto sale mal, anotar «pasos / qué esperaba / qué pasó» y sumarlo a `PULIDO_LISTA.md` en la tanda que corresponda.

---

### Tanda 4 — Sonido, animación y avisos (por código; 19-nov)

Lo que no se pudo jugar (§0 y §5) se revisó leyendo el código: `src/audio.js`, `src/ui.js` (subtítulos y avisos), `src/player.js`, `src/avatar.js`, `src/game.js` (`updateHand`), `src/combate.js`, `src/locutor.js`. Método: se extrajeron todas las llamadas `audio.play('banco', {…})` (124 bancos distintos) y se compararon con el diccionario `CAPTIONS` (76 entradas, `ui.js:106-121`); los subtítulos solo salen si el sonido lleva `pos` y no `ui: true` (`audio.js:143`). **No se oyó nada**: son defectos de lectura de código, sin confirmar de oído; cada uno dice cómo comprobarlo.

**PU-18 · P2 · Los sonidos de peligro no tienen subtítulo (y quien no oye no se entera).**
Con `pos` y sin entrada en `CAPTIONS`: `derrumbe` (`mina.js:59`, el aviso de que cae el techo), `silbido` (`bombas.js:48`, bomba que cae; `bravos.js:225,230`), `resoplido` (`bravos.js:182`, `bichos3.js:127`, un bravo que embiste), `chancho` y `chancho.chillido` (`rioypatio.js:224,284`, los saínos que cargan en manada), `danta.hurt`, `cadenas` (`leyendas.js:37,56,270`, la leyenda que se acerca), `gato.bufido`. Además `derrumbe` suena con `ui: true` en `lahar.js:43` y `goleta.js:224`: **nunca** subtitula, porque lo de interfaz se excluye aunque sea una emergencia.
- Cómo comprobarlo: Ajustes → «Subtítulos de sonidos», entrar a una mina con derrumbe o acercarse a un saíno enojado: no sale línea.
- Arreglo: agregar los textos a `CAPTIONS` («Cae el techo», «Silbido de bomba», «Resoplido», «Saínos chillan», «Cadenas arrastradas»…), y permitir `opts.sub` para sonidos `ui: true` importantes (lahar, goleta) sin posición (se muestran sin flecha).
- Dónde: `src/ui.js:106-121`, `src/audio.js:143`.

**PU-19 · P2 · Claves del diccionario de subtítulos que no calzan con el sonido que se toca.**
`CAPTIONS` tiene `perro_gruñido` y `chest_open`, pero el código toca `perro.gruñido` (`animales2.js:65`, `finca.js:139`, `leyendas.js:79`) y `chest.open` (`audio.js:187`, `minaoro.js:126`): con el punto no hay subtítulo. Y `fauna2.js:96` pide `hurtSound: 'perro_gruñido'` (con guion bajo) para el coyote: si ese banco no existe, ese quejido suena sintetizado o no suena (hay que oírlo).
- Arreglo: unificar con punto y revisar; una prueba nueva `revisar-subtitulos.mjs` que cruce `play('x', { pos })` contra `CAPTIONS` y falle con claves huérfanas (el script de esta auditoría, `scripts_integracion/caps.mjs` en `docs/revisiones/`, ya lo hace).

**PU-20 · P3 · 49 bancos suenan en el mundo sin subtítulo; unos 25 sí lo merecen.**
Lista completa en la salida de `caps.mjs`. Entre los que conviene subtitular: los de cueva nuevos (`cristal_canta`, `hongo_burbuja`, `magma_burbujea`, `cuevavida.js:285-287`), `lechuza`, `oropendola`, `yiguirro`, `cencerro`, `galope`, `montura`, `pez`, `gato`, `gato.ronroneo`, `aleteo`, `yunque`, `balde`, `puerta.golpe`, `chancleta.golpe`, `balon`, `freir`, `remo`, `carrete`. Se pueden dejar sin subtítulo (a propósito, el comentario de `ui.js:105` lo dice): pasos y golpes de bloque (`step.*`, `dig.*`), clics e interfaz (`click`, `pop`, `recoger`, `soltar`), `punch` y `eat` propios.
- Dónde: `src/ui.js:106-119`.

**PU-21 · P3 · `audio.material('metal', 'dig')` y `('wood', 'dig')` no suenan.**
`audio.material(kind, action, pos)` solo conoce las acciones `step`, `hit`, `break`, `place` y las familias de `FAMILY` (`audio.js:22-33`, `:170-175`; `if (!layers) return`). `defensa.js:72` llama `('metal','dig')` y `monte.js:87` llama `('wood','dig')`: acción inexistente → silencio cuando la defensa o el monte rompe un bloque.
- Arreglo: usar `'break'` (y `'stone'` para el metal, o una familia `metal` con `toolbreak`/`armadura.metal`).

**PU-22 · P3 · Trepar la cuerda de espeleólogo no suena.**
`player.js:146-148` sube y baja con `v.y = ±3.2` pero el sonido de paso solo corre con `b.onGround && hs > 0.5` (`:173-182`): colgado de la cuerda no hay roce, ni agarre, ni cambio al soltarse.
- Cómo comprobarlo: colgarse de una cuerda y subir/bajar con el sonido al 100 %.
- Arreglo: un frote suave cada 0,45 s al moverse en vertical (reusar `dig.cloth`, tono 0,8) y un «toc» al agarrarse.

**PU-23 · P3 · Los pasos no bajan de volumen al agacharse (el sigilo no se oye).**
`material(bl.sound, 'step', pos)` (`player.js:176-181`) no recibe volumen: agachado suena igual que caminando, aunque la Ayuda dice «al agacharse lo notan de más cerca» (conjunto de cuero). La cadencia sí cambia (distancia 2,1 con velocidad menor), el volumen no.
- Arreglo: pasar un factor `vol` (0,45 agachado) y un paso más corto al correr; que `material()` lo acepte (`audio.js:170`).

**PU-24 · P3 · En 3.ª persona nadar y trepar no tienen pose.**
`avatar.js:171-176`: en el agua el muñeco sigue el ciclo de caminar erguido (`enAire` excluye el agua pero la amplitud del paso se calcula igual) y nunca se tiende; `p.body.enCuerda` (`physics.js:164`) no se lee en `avatar.js`, así que colgado de la cuerda queda en pose de salto, con las piernas abiertas. En 1.ª persona nadar sí tiene su movida (`updateHand`, `game.js:2587+`, la mano baja y bracea) pero la cuerda no tiene ninguna (`updateHand`, `game.js:2587+`, no mira `enCuerda`).
- Cómo comprobarlo: F5 (3.ª persona) y nadar, y colgarse de una cuerda.
- Arreglo: pose de nado (tronco inclinado 70-80°, brazos alternando) y de trepar (brazos arriba alternando, piernas dobladas); en la mano, subir y bajar con el avance.

**PU-25 · P3 · Beber con la mano usa la pose de masticar.**
`game.js:3074-3080`: comer y beber comparten `this.eating`; el movimiento de mascar (`chew = sin(t * 22)` en `updateHand`, `game.js:2587+`; `avatar.js:259`) se aplica también al beber (`sip`). Lanzar la caña reutiliza el golpe genérico (`this.swing = 1`, `game.js:1581`) sin pose propia ni en 1.ª ni en 3.ª.
- Arreglo: si `getDef(id).sip`, inclinar la mano hacia arriba sin el temblor de masticar; una pose corta de lanzar (brazo atrás → adelante).

**PU-26 · P3 · Avisos que se pisan con otras capas (no entre sí).**
La cola de avisos funciona: `Locutor` muestra **uno a la vez**, funde los repetidos, tiene `COLA_MAX = 4` y deja pasar lo urgente (`locutor.js:20-26`, `:96-100`); no se encontró forma de que dos avisos se encimen. Lo que sí se pisa son capas distintas en la misma zona:
- `#bossbar` (`top: 12px`, ≈ 85 px de alto con la imagen de 48 px) con `#region-banner` (`top: 10 %` = 77 px a 768, 60 px a 600 de alto): si entra el letrero de región con un jefe a la vista (Caverna del Rey, Guardián de la Colada) las dos quedan juntas. Hay que verificarlo con una pelea de jefe; `src/style.css:90, :335`.
- `#toast` (`top: 27 %`) no se limpia al pausar (`ui.pause()` no llama `limpiarAvisos`) y queda encima del menú: ya es PU-06.
- `#combat-flash` (`top: 40 %`) y `#toast` (27 %) no se tocan con alto ≥ 600 px; con ventanas más bajas (≈ 480) sí, porque el aviso puede ser de 3 líneas (`max-width: 760px`, 19 px).
- Arreglo: `#region-banner` a `top: 16 %` mientras haya jefe, y `limpiarAvisos` al pausar.

**Lo bueno** (verificado por código): hay sonido de golpe propio y ajeno (`tajo`, `punch`, `hurt`), de escudo y parry (`combate.js:135-200`), de armadura puesta, de esquive y de rodar (`combate.js:67-143`), de nadar (`swim`, `player.js:142-145`) y del chapuzón al caer al agua según la fuerza (`player.js:153-159`), comer y beber (`eat`, `sorbo`), cofres y puertas, materiales de pasos para los 248 bloques sólidos (ninguno sin `sound`), y la mano tiene poses de comer, golpear con cada clase de arma, nadar, caer y correr. Ningún estado de animación se queda pegado (`eating` y `blocking` se limpian con `releaseAll`/soltar el botón, `game.js:597, 603, 632`).

| Tanda | Hallazgos | Esfuerzo |
|---|---|---|
| **T4a · Subtítulos** (v13.5.x) | PU-18, 19, 20 (+ prueba `revisar-subtitulos.mjs`) | 0,5 día |
| **T4b · Sonido y animación** | PU-21, 22, 23, 24, 25, 26 | 1 día |

Para confirmar de oído y de vista: PU-22, 23, 24 y 25 (necesitan una persona con ratón y teclado, §5).


---

## Regresión v13.5.9 (19-nov)

Revisada la versión **en vivo** (https://nanoyackson.github.io/nanoblocks/, v13.5.9, generador 31) en el navegador integrado, con un mundo propio («Regresion 13.5.9», semilla `regresion-1`; no se tocó ningún mundo de Isaac; quedó guardado en el navegador de la app y se puede borrar). Solo lectura: no se cambió `src/` ni `tools/`. Mismo límite que §0: el navegador integrado no captura el puntero, así que **no se pudo caminar ni oír nada**; se jugó con la API de depuración (`window.nanoblocks`), `game.update` (≈ 12 minutos de juego en total, del día 1 hasta la noche) y emulación de 1024 × 768 y 375 × 812 (móvil, 5 puntos táctiles). Lo de la Tanda 4 (PU-18 a PU-26) se verificó **leyendo el commit `a18276b`** y corriendo `revisar-subtitulos` y `revisar-fichas` (ambas pasan); sonido y poses siguen sin confirmarse de oído ni de vista.

**Nota previa:** la primera carga en este navegador mostró «v13.5.3» aunque el commit 13.5.9 se había publicado 3 minutos antes; tras borrar el service worker y el caché salió «v13.5.9». Puede ser solo propagación de la publicación, pero conviene comprobar que un jugador con la versión vieja recibe la nueva sin tener que limpiar nada.

**Resultado: 24 de 26 arreglados (✔), 2 con falla (✘: PU-09 y PU-13) y 8 hallazgos nuevos (PU-27 a PU-34, ninguno P1).**

### Los 26 hallazgos

| PU | Estado | Cómo se comprobó / qué queda |
|---|---|---|
| 01 | ✔ | En vivo, 1024 y 375: «Sobrevivir la primera noche» y «Capítulo 1/9» quedan una debajo de la otra, sin encimarse. |
| 02 | ✔ | Por código (`prologo.js`: sin `mousedown`; sale con tecla, al soltar el ratón o a los 8,6 s). En vivo el título «Las cartas de la abuela» llegó a verse completo. No se probó hacer clic durante el prólogo. |
| 03 | ✔ | Las 11 pestañas envuelven en filas (375: 5 filas; todas visibles) y la abierta lleva `on` + `aria-selected` al abrirla con una pestaña (con `openLibreta()` sin pestaña, solo por API, no queda ninguna marcada). |
| 04 | ✔ | Ayuda empieza por «🧭 Primeros pasos y controles» (WASD, picar/poner, E, M/L/C/Y) y el combate quedó después de «Sobrevivir». |
| 05 | ✔ | Pantalla de muerte: «Se conservan la armadura y lo que tenía en la mano»; «Léala con C» en `historia.js` y `cuaderno.js`. |
| 06 | ✔ | Con un aviso largo en pantalla y pausa: el aviso se limpia (opacidad 0) y se ve «Juego en pausa». |
| 07 | ✔ | La tarjeta dice «Supervivencia · v13.5.9 · día 1 · 19/11, 07:30»: versión primero, fecha corta. A 375 px la fecha aún se corta (ver PU-34). |
| 08 | ✔ | Se nace mirando tierra y monte, no el mar; el texto del capítulo nombra «📖 en la brújula». |
| 09 | ✘ | **Parcial.** La barra de scroll ya tiene estilo y al llegar al final «Listo» no tapa el último campo; pero el botón sigue `sticky` con fondo casi transparente (`rgba(255,255,255,.06)`) y mientras se desplaza el texto de los campos se ve **por detrás** de «Listo» (a 375 se lee «Clave TURN (opcional)» debajo del botón). Arreglo: fondo opaco (`var(--surface)`) en el botón o en una franja detrás. |
| 10 | ✔ | A 1024 × 768 la lista de recetas mide 187 px (≈ 3,5 filas, antes 1,5); filtros en una sola fila con desplazamiento; el panel no se mueve al filtrar (inventario 12-379, Recetas 393-756; no pasa de 768). |
| 11 | ✔ | A 375 el inventario, el personaje y Recetas van apilados y entran en 343 px (16-359); sin desplazamiento lateral. |
| 12 | ✔ | En emulación táctil (`pointer: coarse`) sale el aviso «📱 NanoBlocks se juega con teclado y ratón…» en el menú y en «Crear mundo nuevo»; en escritorio no sale. |
| 13 | ✘ | **Parcial.** La billetera ya no tapa aire/sed (queda encima de las burbujas). Pero a 375 el reloj (x 255-365) sigue **encima de la brújula** (56-319): tapa 64 px, la parte derecha. Arreglo: reloj debajo de la brújula o brújula más angosta a ≤ 700 px. |
| 14 | ✔ | Ningún «mouse» en el texto visible (HTML ni libretas; Ayuda dice «ratón»). |
| 15 | ✔ | Consola sin la advertencia de `getImageData` en una carga limpia (ver abajo). |
| 16 | ✔ | Medido con `game.update` quieto: el hambre sube 0,4 por segundo (antes 0,8): un punto de comida cada ≈ 112 s en el día 1; sed 0,31 por segundo. Reaparecer deja comida 10 y sed 10. (No se miró si el ritmo vuelve al normal desde el día 2.) |
| 17 | ✔ | `revisar-fichas`: 401 ítems con línea de uso, 12-90 caracteres. En vivo la tortilla muestra ingrediente, frescura, saciedad, cómo se fabrica y dónde se consigue. Ver PU-32 (línea repetida). |
| 18 | ✔ | Por código: `derrumbe`, `silbido`, `resoplido`, `chancho`, `danta.hurt`, `cadenas`, `gato.bufido` ya están en `CAPTIONS`; `audio.play(..., { sub: true })` subtitula lo de interfaz (lahar, goleta) sin flecha. Sin confirmar en el juego. |
| 19 | ✔ | Claves con punto (`perro.gruñido`, `chest.open`) y el coyote usa `perro.gruñido`; `revisar-subtitulos` falla si hay claves huérfanas y hoy pasa. |
| 20 | ✔ | Se agregaron ≈ 25 textos (cristal, hongo, magma, lechuza, oropéndola, yigüirro, cencerro, galope, gato, aleteo, yunque, remo, carrete…). |
| 21 | ✔ | `defensa.js` y `monte.js` usan `'break'`; no queda ningún `material(…, 'dig')`. |
| 22 | ✔ | Por código: «dig.cloth» al agarrar la cuerda y cada 0,45 s al trepar. Sin oír. |
| 23 | ✔ | Por código: `material(blk.sound, 'step', pos, this.sneaking ? 0.45 : 1)`; `audio.material` acepta `vol`. Sin oír (el paso más corto al correr no se hizo; no era obligatorio). |
| 24 | ✔ | Por código: `avatar.js` tiene pose de nadar (brazada y patada) y de trepar (manos alternas); la mano en 1.ª persona (`game.js`) lo toma de `inWater`/`enCuerda`. Sin verlo. |
| 25 | ✔ | Por código: `sip` inclina la taza sin masticar (`game.js:2659`). Lanzar la caña sigue con el golpe genérico (no se había prometido pose propia). Sin verlo. |
| 26 | ✔ | Por código: `body:has(#bossbar:not(.hidden)) #region-banner { top: 17% }` (`vidrio.css`; `#bossbar` se oculta con `.hidden`, `ui.js:1182`) y `limpiarAvisos` al pausar. No se peleó con un jefe. |

### Hallazgos nuevos

**PU-27 · P3 · El aviso de logro tapa el reloj.**
«¡Logro! · 3 Bandada de pericos» (arriba a la derecha) se dibuja encima de «Día 1 · 07:30» y deja ver solo «a 1 · 07:30». Se ve en 1024 × 768 al ganar un logro; dura unos segundos.
- Arreglo: bajar la pila de logros 40 px o ponerla a la izquierda de la brújula.

**PU-28 · P2 · Ajustes a 375 px: tres controles se salen del panel.**
«Movimiento tranquilo», «Avisos en pantalla» (`#s-avisos`) y «Velocidad de lectura» (`#s-lectura`) miden 388 px y empiezan en x = 58, o sea terminan en 446 con un panel de 16-359: se cortan por la derecha y no se pueden operar bien.
- Pasos: móvil 375 → pausa → Ajustes → bajar hasta «Avisos en pantalla».
- Arreglo: `width: 100%; box-sizing: border-box` (o `max-width: 100%`) en esos `select` y etiquetas dentro de `@media (max-width: 700px)`.

**PU-29 · P3 · Un guardado con 0 de vida carga a un jugador «vivo» con 0 de vida.**
Reproducido forzando el estado (llamé a `ui.closeInventory()` con la pantalla de muerte puesta: el juego volvió a `playing` con `health = 0` y `alive = false`; se guardó, recargué la página y el mundo cargó con `health = 0`, `alive = true`, sin pantalla de muerte, caminable). No es una ruta normal de jugador (la pantalla de muerte bloquea `E`), pero el guardado puede quedar así si se guarda en medio de la animación de muerte (guardado automático cada 30 s).
- Arreglo: no guardar mientras `muerte` / `!alive`, o al cargar con `health <= 0` volver a `showDeath` o reaparecer.

**PU-30 · P3 · Bocadillo de un NPC enorme sobre la pantalla.**
En la noche del día 1, tras 4 minutos quieto, el cartel «¡Hola! Hábleme con clic derecho» de un NPC se pintó a toda la pantalla (letra de ≈ 40 px encima de la brújula y del centro), pegado a la cámara. No lo pude reproducir con otra posición. Candidato: limitar el tamaño máximo del cartel por distancia.

**PU-31 · P3 · El chip de la billetera y la fila de aire/sed se asoman por encima de los paneles a 375 px.**
Con el inventario abierto a 375 se ve «₡0» y las burbujas sobre el borde del panel de Recetas; el HUD queda por encima de la capa de paneles. Arreglo: ocultar `#bars` y la billetera mientras haya una pantalla abierta, o bajar su z-index.

**PU-32 · P3 · La ficha de ítem repite lo mismo en dos líneas.**
En la tortilla: «Ingrediente: sirve para fabricar Gallo pinto, Empanada, Gallos de picadillo y 2 más» y, tres líneas abajo, «Sirve para: Gallo pinto, Empanada, Gallos de picadillo y 2 más». La ficha mide 7 líneas y tapa la billetera.
- Arreglo: dejar una sola (`comodidad.js:46`).

**PU-33 · P3 · Un `beforeunload` bloqueado deja un error en la consola al salir.**
Al recargar con el mundo abierto y sin gesto previo, Chrome registra «Blocked attempt to show a 'beforeunload' confirmation panel…» (2 veces, siempre al navegar yo). Es del navegador y con un clic previo no sale; se anota por si alguien mira la consola.

**PU-34 · P3 · Tarjeta del mundo a 375: la fecha sigue cortada.**
«Supervivencia · v13.5.9 · día …» (la versión ya se ve; la fecha no). Una segunda línea o menos texto lo arregla.

**PU-35 · P3 · Cartel de región a 375: tapa el panel del objetivo y del capítulo.**
En capturas_1361, a 375 px el letrero («Valle Central») queda encima del panel del objetivo y del capítulo. A ese ancho conviene bajarlo, achicarlo o centrarlo más abajo. (Pedido por la orquestadora, para el próximo pulido, después de La Hondura.)

### Lo que revisé sin hallar fallas

- **Consola en ≈ 12 minutos de juego** (2 cargas completas, 2 muertes, inventario, libreta en 11 pestañas, pausa, ajustes, 375 y 1024): 0 errores ni advertencias del juego; las únicas líneas son los 2 `beforeunload` de PU-33. Sin la advertencia de `getImageData`.
- **Hambre del día 1:** comida 19 → 6 y sed 18 → 7 en ≈ 12 minutos de juego quieto; sin pérdida de vida por hambre.
- **Panel de inventario:** no cambia de alto ni de posición al filtrar recetas (regla de `CLAUDE.md`).
- **Aviso táctil:** solo aparece con puntero grueso.
- **Pruebas del repo:** `revisar-subtitulos` y `revisar-fichas` pasan en el árbol actual (v13.6.0 en trabajo).

### Pendiente de una persona con ratón y teclado

PU-22, 23, 24 y 25 (oír y ver), la pose de nadar y trepar en F5, la pelea con jefe y el cartel de región (PU-26), y repetir PU-02 haciendo clic durante el prólogo.
