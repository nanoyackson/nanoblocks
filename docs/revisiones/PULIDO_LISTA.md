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

**Resumen:** 0 P1 (nada rompe), 8 P2, 9 P3. La consola quedó limpia: un único aviso propio del juego (`getImageData`, hallazgo 15). Guardar, cargar, morir y reaparecer funcionan sin errores; ninguna petición falló (250 recursos, 0 con estado ≥ 400).

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
- Dónde: `src/player.js` (hambre/sed), `respawn` en `src/game.js`.

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
