# Próximas tandas (lo que FALTA, listo para la constructora)

Se cruzaron `IDEAS_SUPERVIVENCIA_Y_NATURALIDAD.md`, `AUDITORIA_PANTALLAS.md`, los «bajos» y «por confirmar» de las tres revisiones (`REVISION_v10.7-v11.6.md`, `REVISION_v11.6.2-v11.8.0.md`, `REVISION_v11.8.0-v11.9.x.md`) contra el `CHANGELOG`, `git log` (HEAD = `v11.9.2`) y el código (se comprobó con `grep` cada punto marcado como pendiente). **Quedan fuera los gráficos (`PLAN_GRAFICOS.md`) y el multijugador (`ESTUDIO_APP_Y_MULTIJUGADOR.md`).**

Convenciones:
- Tamaño: **S** menos de una sesión · **M** una sesión larga.
- 👁 = **depende de que nanoyackson lo vea jugando** (sensación, balance o gusto); sin 👁 se puede comprobar con código, scripts y el navegador de la constructora.
- Cada tanda sube `GAME_VERSION`, suma entrada al `CHANGELOG` (archivo y constante) y actualiza el árbol; si cambia lo que se guarda, `SAVE_FORMAT` + migración. «Hecho» siempre incluye: `npm run lint` y `npm run build` en cero warnings, y `tools/revisar-recetas.mjs`, `revisar-nombres.mjs` y `revisar-datos.mjs` limpios.
- El árbol de trabajo hoy trae cambios sin commitear de la constructora en `index.html`, `src/blocks.js`, `src/inventory.js`, `src/textures.js` y `src/ui.js`: las tandas 1 a 3 tocan esos mismos archivos, así que conviene **cerrar esa versión primero**.

## Qué ya está hecho (para no repetirlo)

| De dónde | Ya resuelto | Dónde |
|---|---|---|
| Revisión 1 (v10.7–v11.6) | Los 12 hallazgos (carril de Don Cornudo, brillo tras aturdir, aviso de caída que sigue al salto, pausa, portones, bolsos hasta 20, golpePend, mano izquierda, codos, calma, melee de jefes por `atacar()`, duplicados) y P1 (`sombras2.js` ya re-marca el anillo) y P5 (`Avatar.update`) | v11.6.2 |
| Revisión 2 (v11.6.2–v11.8.0) | Clic central, herramienta sola, escarabajo, «Ordenar la casa» (parcial: ver Tanda 1), bote, `pickBlock`, arena en fila, mapa, baúl que cuenta, «A cofres cercanos», portones y calma, tirar fuera del inventario, antorchas de pared, Jaguar tras aturdimiento | v11.9.1 y v11.9.2 |
| Auditoría de pantallas | **T10** (calma del sistema, `calma.js`), **Mp1** (arrastrar el mapa) y **H2** (`#toast` con `max-content`) | v11.6.2 a v11.9.0 |
| Ideas de supervivencia | **Ninguna de las 20.** Solo hay primeros pasos: agua hervida (`supervivencia2.js`) y la insolación por exposición (`exposicionSol`), que sirven de base a las ideas 5 y 6 | v11.9.1 |
| Textos | El locutor central (`locutor.js`) responde a `INVENTARIO_TEXTOS.md`; sus fallos están en la Tanda 1 | v11.9.0 |

Lo que **sigue pendiente** de la auditoría (verificado en `style.css`, `index.html` y `ui.js`): T1 (Tab bloqueado en todo `bindInput`), T2 (0 `aria-*` / `role`), T3 (`outline: none` en la base y ningún `:focus-visible` global), T4, T5, T6 (aún no pausan mapa, libreta ni tienda), T7, T8, T9 («Elegí un mundo» sigue en `index.html:66`, estados con género en `renderEffects`), T11, T12 (0 `:disabled`), M1, W2 a W6, P1 (`pause()` guarda siempre), P2, A1 a A5, N1, I1 a I11, C1 a C3, Mp2 a Mp5, Lb1 a Lb6, S1 a S4, D1 a D3, H1, H3 y H4.

Orden sugerido: **1 → 2 → 3 → 4 → 5**. La 1 es corta y arregla lo que más se nota hoy (los avisos). La 2 y la 3 son la auditoría. La 4 y la 5 son las ideas (4 = las S, 5 = las M que cambian el balance).

---

## Tanda 1 — «El locutor afinado y la tercera revisión cerrada» (S) · 👁 solo lo marcado

**Objetivo:** que lo urgente sea de verdad urgente, que nada importante se pierda en una pelea, y cerrar los demás hallazgos de `REVISION_v11.8.0-v11.9.x.md`.

1. **`src/locutor.js`, `clasificar` / `URGENTE` / `PRIMER` (hallazgo 1, alto).** Quitar `\bYA\b` con la bandera `i` (o dejarlo solo en mayúsculas), sacar 🔥 y 🌊 de `PRIMER` (dejar ⚠ 🚨 🆘), `\blava\b`, corregir `ahógando`. Los avisos que de verdad son urgentes (tsunami, incendio, sangrado, se rompió la herramienta, ahogo) pasan `{ cat: 'urgente' }` desde donde se emiten (`tsunami.js`, `incendio.js`, `supervivencia3.js`, `game.js`, `armas2.js`).
2. **Prueba automática.** Una `tools/revisar-avisos.mjs` (o dentro de `revisar-datos.mjs`) que importe `clasificar` y la corra sobre todos los literales de `toast`/`decir`/`banner` de `src/` (la expresión que se usó en la revisión sirve), e imprima los urgentes. Falla si hay más de ~40 urgentes o alguno contiene «ya» en minúscula sin otra palabra de la lista. (Hoy: 126 urgentes, 73 de ellos falsos.)
3. **`locutor.js`, `tick` y `enCombate` (hallazgo 2).** Un «importante» que lleva más de ~10 s esperando sale aunque haya pelea (sin interrumpir lo urgente); `enCombate()` exige que el bicho esté persiguiendo o atacando (`m.atk` o `m.data.provoked` reciente), no solo vivo y hostil a 12 bloques. 👁 jugar de noche junto a un pueblo y en un jefe: los logros y la plata se ven después, no se pierden.
4. **`locutor.js`, `decir` (rama `urgente`) (hallazgo 8).** Marcar la entrada interrumpida para no anotarla dos veces en el historial.
5. **`ui.js`, `toast` con `state !== 'playing'` (C1).** Decidir qué pasa con los avisos que nacen dentro del inventario («Ordenar la casa», «Fije una receta primero»): mostrarse ahí mismo o quedar en cola. 👁 mirar cómo se ve.
6. **`inventory.js`, `extras` (hallazgo 4).** Sumar `cruda` para que tirar y recoger la cantimplora no la hierva. *(Archivo con cambios sin commitear: coordinar.)*
7. **`comodidad.js`, `cofresDeCasa` / `ui.js`, `ordenarCasa` (hallazgo 3).** Los cofres de misión ya guardados con `propio: true` siguen contando. Mostrar «Va a tocar N cofres» con la lista antes de mover nada, o una migración que quite `propio` de los cofres dentro de las estructuras de misión.
8. **Decisiones de nanoyackson (hallazgos 5 y 6)** 👁: ¿el barril de lluvia (`monte.js`, `barrilInteract`) da agua limpia?; ¿la insolación empieza a las 7:00 en vez de a las 11:17 (`supervivencia2.js`, `exposicionSol`: `t < 0.22 || t > 0.42`)?
9. **Por confirmar de las revisiones anteriores:** P2 (`modelos-aves.js:27`, `arms: legs`: probar que ninguna voladora use `atacar` sin `tipo`), P4 (rendimiento de `Mob.update` fuera de pantalla: medir con `tools/bot-pelea.js` o un mundo con 200 criaturas), C5 (`revisar-datos.mjs`: comprobar que cada bloque `render: 'model'` con `boxes` tenga su caja de choque).

**Hecho cuando:** la prueba de avisos pasa; en una partida de prueba de 5 minutos ninguno de los 10 avisos más comunes («Ya tiene…», «Ya hay un reto…», «Ya casi oscurece…») interrumpe a otro; un logro durante un combate sale al terminarlo; tirar y recoger una cantimplora sin hervir sigue «sin hervir»; «Ordenar la casa» no mueve nada sin mostrar la lista; lint y build en cero.

---

## Tanda 2 — «Teclado, foco y pausa» (S–M) · sin 👁 salvo T6

**Objetivo:** que los menús se puedan usar sin mouse y que leer no cueste vida. (Mejoras 1 y 4 de la auditoría.)

1. **T1 `ui.js`, `bindInput()`, `keydown`:** `if (e.code === 'Tab' && this.state === 'playing') e.preventDefault();` (y `F1`/`F3` como están).
2. **T3 `style.css`:** quitar `outline: none` de la regla base de `button, select, input…` (línea 43) y añadir `:focus-visible { outline: 3px solid #ffd84a; outline-offset: 2px; }`, más el borde dorado para `input` y `select`; que `.lib-tabs button`, `.album-cambio`, `.tecla-fila`, `.tecla-reset`, `.bingo-botones button`, `.shop-row`, `.recipe` y `.slot` también muestren foco.
3. **T12 `style.css`:** `button:disabled, [aria-disabled=true]` con fondo y texto opacos (≈ 5:1), y no usar `opacity` para texto.
4. **T4 `ui.js`, `show()` y `hideScreens()`:** guardar el foco previo, llevarlo al primer `button` del panel (o a `#btn-respawn` en la muerte) y devolverlo al cerrar.
5. **D1 `ui.js`, `showDeath()`:** terminar con `$('#btn-respawn').focus()`.
6. **T5 `ui.js`, `bindInput()`:** Esc vuelve atrás en `worlds`, `new`, `news` y `settings`.
7. **T2 mínimo (una tarde):** `aria-label` en los 4 botones de `armarApariencia()`; `role="dialog" aria-modal="true"` y `aria-labelledby` en cada `.screen`; `aria-live="polite"` en `#toast`, `#captions` y `#recogidos`; `role="progressbar"` en `#loading-bar`; `aria-label="Mapa del mundo"` en `#map-canvas`.
8. **T6 `ui.js`, `openLibreta` / `openMap` / `openShop` / `closeLibreta`:** ajuste «Pausar al abrir mapa, libreta y tienda» (activado por defecto); arreglar `closeLibreta()` (pone `paused = false` siempre) y la hoja Mañas (solo pausa si se abre directo). 👁 nanoyackson decide si el inventario también pausa.
9. **P1 `ui.js`, `pause()`:** guardar solo si pasaron más de 30 s desde el último guardado (el botón «Guardar ahora» y el autoguardado siguen).
10. **P2 `index.html` (`#screen-pause`) + `ui.js`:** botón «Ayuda (Y)» que llame a `openLibreta('ayuda')`.
11. **Lb6 `ui.js` (estado `libreta`) + `libreta.js`:** dejar pasar Tab y poner `role="tab"` / `aria-selected` en `.lib-tabs button`.

**Hecho cuando:** se puede ir de «Menú → Un jugador → Mundo nuevo → Crear» y de «Menú → Ajustes → Volver» solo con Tab, Enter y Esc; el foco se ve en todos los botones, campos y filas (≥ 3:1 sobre cualquier fondo); al morir, Enter reaparece; con el mapa abierto en supervivencia el hambre y las criaturas no avanzan (si la opción está activa); lint y build en cero. *No incluye el inventario por teclado (I1), que es una tanda aparte (M–L).*

---

## Tanda 3 — «Que se lea bien» (M) · 👁 nanoyackson mira capturas de antes y después

**Objetivo:** contraste, pestañas, textos neutros y ajustes ordenados. (Mejoras 2, 3, 5, 6, 8 y 9 de la auditoría.)

1. **Contraste (S1, I2, I3, Lb2) `style.css`:** `.shop-row` a `#5a5a5a` (blanco ≈ 6.9:1) y su `:hover`; precio y dinero (`.shop-row .p`, `#shop-colones`); `.stat-note`, `#craft-table-note`, `.doll-hint`, `.shop-hint` a `#474747`; `.recipe.no` sin `opacity` (fondo y letra opacos); `.lib-logro`, `.lib-hitos`, `.lib-gtit span`, `.plato-lista p`, `.mana-carta span`/`small`, `.partida .dato span` con fondo opaco oscuro.
2. **Recetas (I3, I4, I5) `ui.js`, `renderRecipes()`:** «✓» / «✗» antes del número de ingredientes, estado vacío («Ninguna receta con «…»») y conservar `scrollTop`.
3. **Pestañas (Lb1) `style.css`, `.lib-tabs`:** `flex-wrap: wrap` y `min-height: 32px`, o solo ícono bajo 700 px (con `aria-label`).
4. **Regla duplicada (I6) `style.css`:** quitar `#armor-slots .slot.empty::after` (línea 369), que deja los íconos-guía en 13 px.
5. **Textos neutros y en «usted» (T9):** `index.html:66` («Escoja un mundo»); `ui.js`, `renderEffects()` (`names`: «Ropa empapada», «Panza llena», «Mareo», «Cansancio», «Lodo», «Enredo», «Frescura», «Buen provecho»); `supervivencia3.js`, `tickMojado` («Lleva la ropa empapada»); `muebles.js`, `sentarse()`. Los logros con género (p. ej. «Sentadito») los decide nanoyackson 👁.
6. **Letras (H3, H4, A4):** `#captions div` sin `nowrap` y `max-width: 40vw`; subir a 16 px los 13–14 px del HUD (`#ind-dur`, `#vistas`, `#guardado`, `#receta-fija`, `.slot .mej`); `input[type=range]` a 28 px de alto.
7. **Ajustes (A1, A2, A3) `index.html` + `ui.js`:** `<fieldset>` en Imagen, Sonido, Juego y Accesibilidad; «Restablecer todo» con confirmación; `#btn-settings-back` fijo abajo; etiqueta de pantalla completa corta con un `<small>`.
8. **Mundos y menú (W2, W3, W4, W5, W6, M1) `style.css` + `ui.js`:** `.world .name { overflow-wrap: anywhere }`, `title` en `.meta`, filtro cuando hay más de 6 mundos y `.world button { min-height: 32px }`, opciones de dificultad cortas con `<small id="dif-nota">`, «Volver» unificado, botón «Créditos» que salta a esa sección.
9. **Novedades (N1) `ui.js`, `renderNews()`:** mostrar las últimas 10 versiones con «Ver anteriores» y guardar el manifest en una variable (hoy arma las 382 cada vez).
10. **Mapa y muerte (Mp2, D2, D3):** `mapa.js`, `marker()`: etiqueta solo en los 8 puntos más cercanos y leyenda (tecla L); `supervivencia.js`, `deathTip()`: «el bolso, a 120 bloques al noreste (🧭)»; «Reaparecer y salir al menú».
11. **Primer paso de los tokens (T7, T8):** variables `--fs-*`, `--acento` y `--tinta` en `:root`, y `.btn-s` / `.btn-ok`; migrar primero los 13–15 px. *(Se puede dejar para una tanda 3b.)*
12. **Si hay tiempo (bajos):** I8 (pista «Alt+clic fija» bajo `#inv-sortbar`), I9 (`.slot .count` en pantallas angostas), I10 (pestañas en el catálogo creativo), C1–C3 (leyenda del 🔨, «Solo las que puedo fabricar», «/» para buscar), T11 (modal en lugar de `confirm()`/`alert()`), H1 (`#ruta-panel` con `min(400px, …)`), M2–M4, A5, L-1, S2–S4.

**Hecho cuando:** los contrastes de los selectores del punto 1 miden ≥ 4.5:1 con la misma fórmula de la auditoría (`AUDITORIA_PANTALLAS.md`, cabecera); ninguna pestaña de la libreta se parte a 640 px ni a 375 px; no queda «Elegí» ni estados con género en `renderEffects`; hay capturas antes y después de tienda, recetas, libreta y ajustes (👁); lint y build en cero.

---

## Tanda 4 — «El cuerpo se siente» (ideas S: ★1, ★2, ★3, 9, 7, 15) (S × 6) · 👁 todas

**Objetivo:** que caer, tener hambre, sentarse y beber se noten en el cuerpo y no solo en un texto. No toca el balance. Todas respetan `calmaActiva(g)` y no suben `SAVE_FORMAT`.

1. **★1 Rodar al aterrizar.** `player.js` (caída: `fallDamage`, `softLanding`, `vyBefore`), `combate.js` (`tryRoll`), `game.js` (`g.roll`, `g.flipPitch`): al tocar suelo con `vyBefore < -9` se abre 0.25 s; si se pulsa rodar, `fallDamage × 0.4` y animación de voltereta. Logro «Cayó como gato de potrero».
2. **★2 Señales del cuerpo.** `supervivencia.js`, `tickCuerpo`: con `food <= 6` sonido de tripas cada 20–40 s (un banco nuevo en `audio.js`); con `water < 6` aliento áspero y temblor leve de la mano; con `cansado`, párpados (`ui.pestaneo()`); con `frio > 4`, vaho (`particles.spawn`).
3. **★3 Sentarse y acostarse con cuerpo.** `muebles.js`, `sentarse()` y `lieDown` (hoy teletransporta); `avatar.js:123` (`const sentado = riding || !!g.parapente` → sumar `g.sentado`); `game.js`, `getUp` con una curva de 0.35 s y un fundido corto.
4. **9 Agacharse y recoger.** `avatar.js:86` (`p.sneaking ? 0.12 : 0` cambia de golpe: suavizar) e inclinar el cuerpo y estirar el brazo cuando `entities.js` (`ItemDrop`) pasa a `recogido`.
5. **7 Beber con las manos.** `supervivencia2.js`, `beberDelRio`: agachar 0.15, juntar las manos (`manoIzquierda` de `armasmano.js`) y 3 tragos de 0.4 s; con la cantimplora, mostrar el nivel (`dur`) bajando.
6. **15 Despertar con sobresalto.** `game.js`, `getUp` cuando el motivo es un golpe, un cencerro o un asedio (`asedio.js`): salto de cámara de 0.4 s y «¡Qué susto!»; sin sueño no se da `descansado`.

**Hecho cuando:** cada uno se ve y se oye en el navegador (👁 nanoyackson los mira uno por uno), con «Movimiento tranquilo» activado quedan sin sacudidas ni cámara que se mueve, el daño por caída es el mismo salvo que se ruede, y lint y build en cero.

---

## Tanda 5 — «Campamento, comida y ropa» (ideas M: ★4, ★5, ★6 y 8) (M × 3 + S) · 👁 balance y gusto

**Objetivo:** que acampar, comer y abrigarse sean decisiones. Hay que probar el balance, sobre todo en «Difícil». Parte de lo hecho en v11.9.1 (cantimplora cruda y `exposicionSol`) se reutiliza: **cerrar primero las decisiones de la Tanda 1 (punto 8).**

1. **★4 Leña y fogata que se apaga.** `stations.js`, `placed` (el BE de la fogata guarda combustible); `supervivencia2.js`, `tickFogatas`, `cocinarEnFogata`, `fogataCerca`; `supervivencia3.js`, `tickFrio` (`WARM`); `weather.js`, `colTop` (la lluvia sin techo la apaga). En «Tranquilo» la fogata no se apaga (`difOf(g)`). Fogón de leña como mejora.
2. **★5 Conservas y comida que se echa a perder.** El día de elaboración va en el `extra` de la pila (`inventory.js`, `add(id, count, dur, extra)`, redondeado al día para seguir apilando); pasados N días pasa a «pasado»; `comodidad.js`, `fichaItem` («se echa a perder en 3 días»); `fuerza.js`, `valor()` ignora lo pasado; ahumar con `CRUDO_A_COCIDO` y salar con un ítem nuevo (sal del mar: id, ítem, receta; `tools/revisar-nombres.mjs` y `revisar-recetas.mjs` limpios).
3. **★6 El cuerpo y la temperatura, con ropa.** Un valor `g.cuerpo` de −1 a 1 en `supervivencia3.js` (`tickFrio`, `tickMojado`) que suma bioma y hora, mojado, `WARM` y ropa; `tickSed` y `exposicionSol` leen de él; piezas nuevas (sombrero de paja, capote; el sombrero sabanero ya existe en `armadura.js`); icono en `renderEffects`.
4. **8 Lluvia sobre el zinc.** `weather.js` (`colTop` ya calcula el bloque que tapa) + `audio.js` (`setEmitter`): repiqueteo metálico con zinc o lámina; goteras que humedecen.

**Hecho cuando:** una partida de prueba de 10 días en «Tranquilo» no apaga la fogata ni echa a perder la comida; en «Difícil» sí, y el jugador tiene cómo evitarlo (leña, sal, ahumar); `tickMojado` no acumula doble con `calma` y `fuerza` (`hungerT` revisado); un mundo viejo carga sin cambios (los campos nuevos se leen con `||=` o `?? 0`); 👁 nanoyackson prueba una noche de lluvia en el campo y una mañana en la playa.

---

## Después (no se mandan todavía)

Ideas sin tanda, en el orden en que convendría tomarlas: **16** Mesa servida (S; reutiliza la pose de sentado de la Tanda 4), **10** Cojera y convalecencia (M), **11** Animales con rutinas (M), **17** Ruido y sigilo (M), **18** Morral que crece (M), **12** Antojos del día (M), **13** Botica de la abuela (M; usa la olla y `saberes.js`), **14** Nadar con costo (M), **19** Temporadas (L) y **20** Trepar (L). De la auditoría: **I1** inventario por teclado (M–L) y **T7/T8** completos (migrar todos los tamaños y botones a los tokens).


---

# Fase final: «Antes de publicar»

Va **después** de los gráficos y el multijugador y **justo antes** de abrir el GitHub público. Son dos tandas: la **6** (ciberseguridad y limpieza del historial) y la **7** (progresión de jefes y final épico). La 6 **no se puede saltar**: el historial se vuelve público de golpe y no se puede retirar. La 7 se puede hacer antes si nanoyackson quiere, porque no depende de la publicación; está aquí porque pidió que cerrara la fase.

---

## Tanda 6 — Auditoría de ciberseguridad (plan + primer barrido de hoy) (M) · sin 👁

**Cómo se hizo el primer barrido (solo lectura, sobre `master` + los 411 commits de `git rev-list --all`):** expresiones regulares sobre todo el historial (`git grep` por revisión) para llaves y tokens, correos, rutas personales y nombres; `git log` para autores y mensajes; `npm audit --json`; lectura de los ~45 usos de `innerHTML`, de `save.js` (importación) y de todas las entradas de texto del jugador. **No se usó `gitleaks` ni `trufflehog`** (no están instalados): hay que correrlos antes de publicar (punto 6.1).

### 6.0 Resultado del primer barrido

| # | Hallazgo | Gravedad | Dónde |
|---|---|---|---|
| H1 | **Sin llaves, tokens ni claves privadas en el historial.** Patrones buscados en los 411 commits: `sk-…`, `AIza…`, `ghp_…`, `AKIA…`, `api_key=…`, `Bearer …`, `BEGIN … PRIVATE KEY`. Cero coincidencias. No hay `.env` ni archivos de credenciales en ninguna revisión. Los scripts de íconos con GPT/Codex **no están en el repo** (`assets-src/` está en `.gitignore`; las únicas menciones a «Codex»/«OpenAI» son texto de `CHANGELOG.md` y `docs/PLAN_MAESTRO_20.md`) | ✔ limpio | historial |
| H2 | **El correo personal de nanoyackson va en los 411 commits** (`nanoyackson <<correo-personal>>`) y el trailer `Co-Authored-By: Claude Opus 5.5` también en los 411. Al publicar el historial, el correo queda visible para cualquiera (y lo recogen los rastreadores de spam). El contenido de los archivos **no** trae ningún correo | **Alto** (privacidad) | metadatos de git |
| H3 | **Ruta personal** `<ruta-personal>` en `docs/PROMPT_SIGUIENTE_SESION.md` (9 revisiones del archivo). Revela el nombre de usuario de Windows y que es un proyecto de cliente | Medio | `docs/PROMPT_SIGUIENTE_SESION.md` |
| H4 | **Documentos internos versionados** que no conviene publicar: `docs/PROMPT_SIGUIENTE_SESION.md`, `docs/PROMPTS_CHATGPT.md`, `docs/PROMPT_ITEMS.md`, `docs/prompts-items/*.txt` (prompts de generación de imágenes), `docs/PLAN_MAESTRO*.md` (20 archivos de planes internos que nombran a «nanoyackson»), `docs/revisiones/` (9 archivos versionados; incluye `DIAGNOSTICO_BUGS_ISAAC.md`), `CLAUDE.md` y `.claude/launch.json`. Ninguno trae secretos, pero muestran el flujo interno con IA y nombres reales. Fuera del repo (bien): `side-session-notes/`. `docs/COLA_DE_TRABAJO.md` (cola interna de trabajo; ya está versionado: sacarlo del repositorio público) | Medio | `docs/`, raíz |
| H5 | **Nombres reales/de marca en el código**: «nanoyackson» (README, `ui.js:129`, créditos de `final.js`) y la semilla de ejemplo del formulario. Es la marca del canal y se publica a propósito; se anota solo para que sea una decisión consciente. El mensaje del commit `v11.8.0` dice «pedidos de nanoyackson» | Bajo | `README.md`, `src/ui.js`, `src/final.js` |
| H6 | **Falta `LICENSE`** en la raíz y el `package.json` es `private: true` sin campo `license`. Sin licencia, «publicado» no es «reutilizable». Los activos de terceros están bien documentados: los 283 sonidos de `manifest.json` son CC0, Kenney tiene sus `LICENSE-*.txt`, la música usa VCSL (dominio público). Falta decidir la licencia propia y listar `three` (MIT) y la fuente VT323 (OFL) en los créditos. Los créditos finales dicen «Íconos con ayuda de GPT»: revisar los términos de uso de esas imágenes (`public/ui`, `public/sprites`) | Medio | raíz, `final.js` |
| H7 | **`.gitignore` es corto** (`node_modules/`, `dist/`, `assets-src/`): no cubre `.env*`, `*.key`, `*.pem`, `.claude/settings*.json`, `docs/COLA_DE_TRABAJO.md`. Una llave puesta mañana por descuido se commitearía | Medio | `.gitignore` |
| H8 | **Google Fonts desde el navegador del visitante** (`index.html:8-9`, `fonts.googleapis.com` / VT323). Cada visita manda la IP del jugador a Google (privacidad y, en la UE, consentimiento) y obliga a abrir la CSP a dos dominios externos | Medio | `index.html` |
| D1 | **`npm audit`: 4 avisos (1 alto, 1 moderado, 2 bajos), todos de desarrollo.** `vite` 6.0.7 (alto: 18 avisos del servidor de desarrollo, p. ej. `server.fs.deny` y lectura de archivos por WebSocket; corrige `vite@6.4.6`), `esbuild` (moderado, `<=0.24.2`, el mismo servidor; viene con vite), `eslint` 9.17 y `@eslint/plugin-kit` (bajos, ReDoS en comentarios de configuración; corrige `eslint@9.39.5`). **El sitio publicado es estático** (`vite build` → `dist/`), así que **nada de esto llega al visitante**; el riesgo es de quien corre `npm run dev` en una red compartida. `three` 0.170.0 no tiene avisos | Bajo (dev) | `package.json` |
| X1 | **XSS: hoy no se encontró ningún camino explotable.** De las 4 entradas de texto del jugador (nombre del mundo, semilla, nombre de cofre `be.nombre`, comandos `/`): el nombre del mundo y del cofre se pintan con `textContent`/`.value` (`ui.js:237`, `armarTituloCofre`); `foto.js:126` filtra `<>&`; `libreta.js`, `diario.js`, `cuaderno.js`, `bestiario.js` e `historia.js` pasan todo por `esc()`; los datos de `torneo.js` y de la brújula son del propio juego. Pero la defensa es **disciplina, no estructura**: hay ~45 `innerHTML` con plantillas, **cinco copias** del escapador (`bestiario`, `cuaderno`, `diario`, `historia`, `libreta`; la de `libreta.js:34` y `libreta.js:15` no son iguales: una escapa `"` y otra no) y **un sitio sin escapar**: `ui.js:231` pone `e.message` de IndexedDB en el HTML | Bajo hoy / **alto con chat** | `src/*.js` |
| X2 | **Importar un mundo casi no se valida** (`save.js:importWorld`): solo comprueba `payload.app` y `payload.meta`; **sin tope de tamaño** (`file.text()` lee todo), `payload.chunks.map(...)` revienta con un mensaje técnico si no es una lista, y los ids de bloque no se miran: `world.setBlock` y la malla leen `BLOCKS[id]` sin comprobar el rango (`world.js:140`, `:147`), así que un archivo con un id inexistente puede dejar un mundo que **falla cada vez que se carga ese chunk** (se puede borrar desde la lista, que solo lee `meta`). Se probó por lectura de código; **por confirmar probando con un archivo de prueba**. No encontré `Object.assign(meta, importado)`, así que `__proto__` no contamina (el `{...payload.meta}` copia la clave como propiedad propia) | Medio | `src/save.js` |
| P1 | **PWA aún no existe** (ni manifiesto ni service worker), así que el barrido de caché es un plan, no un hallazgo. Un aviso importante: en **GitHub Pages todos los proyectos de una misma cuenta comparten el origen `usuario.github.io`**, y con él el `IndexedDB` y el `localStorage`: otro repo de la misma cuenta (o uno futuro con una falla) **podría leer los mundos guardados**. Se arregla con un dominio propio o una organización dedicada | Medio | hosting |
| M1 | **Multijugador: aún no existe** (ver 6.5). Es el que más riesgo nuevo trae | — | — |

### 6.1 Limpiar el historial: recomendación

**Publicar desde un historial nuevo** (un repositorio recién creado con un solo commit «NanoBlocks v11.x»), y conservar el repositorio actual como archivo privado. Razones: hay 411 commits, 388 tags y 20 planes internos; reescribir con `git filter-repo` obliga a quitar rutas en todas las revisiones, reescribir autor y trailers con `--mailmap` y volver a crear los tags, y **cualquier miss queda público para siempre**. El costo de perder el historial es solo de curiosidad (el `CHANGELOG.md` ya cuenta cada versión).
- **Si nanoyackson quiere conservar el historial** (para mostrar el proceso): `git filter-repo --invert-paths --path docs/PROMPT_SIGUIENTE_SESION.md --path docs/PROMPTS_CHATGPT.md --path docs/PROMPT_ITEMS.md --path docs/prompts-items --path-glob 'docs/PLAN_MAESTRO*.md' --path docs/revisiones --path CLAUDE.md --path .claude --mailmap <archivo>` (el archivo cambia el correo por el `…@users.noreply.github.com`), en **un clon nuevo**, y **volver a correr `gitleaks` y `trufflehog` sobre el resultado**. *(No se corrió nada: esto es el plan.)*
- **En cualquiera de los dos casos:** usar el correo `noreply` de GitHub como autor, decidir si se quita el trailer `Co-Authored-By`, ponerle `LICENSE` antes del primer push, y activar **Secret scanning + Push protection** del repositorio en cuanto exista.
- **Los documentos internos** (`PLAN_MAESTRO*`, `revisiones/`, `PROMPT*`) pasan a una carpeta fuera del repo (por ejemplo `NanoBlocks-interno/`) o a un segundo repo **privado**. `docs/ARBOL_CONOCIMIENTO.md`, `docs/BALANCE.md` y `docs/GUIA_DE_PRUEBA.md` sí valen para el público, tras revisarlos.

### 6.2 Plan por área

| Área | Qué hacer | Archivos | Tamaño |
|---|---|---|---|
| **Secretos y datos personales** | Correr `gitleaks detect --log-opts="--all"` y `trufflehog git file://. --since-commit …` sobre el repositorio **ya limpio**; ampliar `.gitignore` (`.env*`, `*.key`, `*.pem`, `.claude/`, `docs/COLA_DE_TRABAJO.md`); `git grep` final de «isaac», `<ruta-personal>`, `@<dominio>`, «Claude» | `.gitignore`, historial | S |
| **Licencia y créditos** | `LICENSE` propio; `THIRD_PARTY.md` con three (MIT), VT323 (OFL), Kenney (CC0), Freesound (CC0), VCSL (dominio público); revisar la línea «Íconos con ayuda de GPT» | raíz, `src/final.js` (`CREDITOS`) | S |
| **Dependencias** | `vite` → 6.4.6 y `eslint` → 9.39.5 (menores; fijar versiones exactas como hoy); `npm audit` en cero; decidir si se actualiza `three` (hoy 0.170.0; el PLAN_GRAFICOS ya lo pide) | `package.json`, `package-lock.json` | S |
| **Inyección de HTML (XSS)** | (1) Un solo `src/seguro.js` con `esc()` (escapa `& < > " '`) y reemplazar las cinco copias; (2) `ui.js:231`: `textContent` o `esc(e.message)`; (3) regla de ESLint que prohíba `innerHTML` con `${}` sin pasar por `esc` (o una etiqueta `html\`…\``); (4) prueba en `tools/` que inyecta `<img src=x onerror=…>` en nombre de mundo, de cofre, de personaje y de marcador y verifica que no se ejecuta; (5) **regla de oro para el chat y los carteles: siempre `textContent`** | `src/ui.js`, `libreta.js`, `diario.js`, `cuaderno.js`, `bestiario.js`, `historia.js`, `eslint.config.js` | M |
| **Validación de importaciones** | En `importWorld`: tope de tamaño (p. ej. 60 MB de archivo y 20 000 chunks); `payload` debe ser objeto con `chunks` lista y `be` lista; cada `id` entero entre 0 y `BLOCKS.length - 1` (los desconocidos pasan a aire con aviso); coordenadas, `meta.name` (≤ 40 caracteres, sin controles ni `<>`), `meta.day`, `meta.time`, vida y cantidades de inventario numéricas y acotadas (sin `NaN`, `Infinity` ni negativos); descartar claves `__proto__`, `constructor` y `prototype` al copiar; errores con mensaje en español, no el de `JSON.parse`. Misma función para el **mundo que llegue por red** (6.5). Prueba: carpeta `tools/pruebas-import/` con un archivo roto, uno enorme y uno con ids absurdos | `src/save.js`, `src/world.js` | M |
| **Hosting y PWA** | **CSP** y cabeceras (abajo); service worker con ámbito y caché acotados; dominio propio o cuenta dedicada por el origen compartido de GitHub Pages; autoalojar VT323 y quitar Google Fonts | `index.html`, `public/`, `vite.config.js`, `_headers` | M |
| **Multijugador** | Ver 6.5 | módulo de red | M (dentro de la fase 1 de B.5) |
| **Prueba externa** | Una pasada final con `eslint-plugin-security` o similar y la lista OWASP DOM-XSS; el repositorio **privado** de prueba con la CSP puesta, probado en Chrome | — | S |

### 6.3 CSP y cabeceras de la PWA

GitHub Pages **no deja poner cabeceras**: solo sirve `<meta http-equiv="Content-Security-Policy">` (sin `frame-ancestors` ni `report-uri`). Cloudflare Pages sí acepta un archivo `_headers` con cabeceras reales (CSP completa, `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer`, `Permissions-Policy`, `Cross-Origin-Opener-Policy`). Si nanoyackson quiere cabeceras de verdad, ese es un motivo para quedarse en Cloudflare Pages también al publicar (ver B.9). Política de partida para este juego (a probar y apretar):

```
default-src 'self';
script-src 'self';
style-src 'self' 'unsafe-inline';      /* el juego usa style="" en HTML generado */
img-src 'self' data: blob:;
media-src 'self' blob: data:;
font-src 'self';                       /* tras autoalojar VT323 */
worker-src 'self' blob:;
connect-src 'self';                    /* con multijugador: sumar los wss: de Nostr y los de TURN */
object-src 'none'; base-uri 'none'; form-action 'none'
```
- `script-src 'self'` funciona porque `index.html` solo tiene un `<script type="module" src>` y ningún script en línea (verificado); el trabajador de `lod.js` es de la misma carpeta.
- **Con el multijugador por Nostr, `connect-src` necesita `wss://*`** (los relés cambian): eso debilita la política. Mitigación: lista fija de 5 a 8 relés y una opción `connect-src` por versión.
- **Service worker:** registrarlo con `./sw.js` y alcance `./` (nunca `/`); precaché **solo de archivos propios con hash**; caché con nombre `nanoblocks-<GAME_VERSION>` y borrado de los viejos; **nunca cachear respuestas de otros orígenes ni respuestas «opacas»**; `sw.js` sin caché fuerte (en GitHub Pages las cabeceras son fijas: `updateViaCache: 'none'`). *Caché envenenada:* si una respuesta mala se cachea una vez, queda; por eso el precaché es de una lista cerrada y se verifica el tamaño o el hash.

### 6.4 Datos que sí se guardan en el navegador

`IndexedDB` `nanoblocks` (mundos, chunks) y `localStorage` (`nanoblocks.settings`, atajos, identidad de la Parte B.10): **nada personal**, pero la identidad del jugador (llave de B.10) es sensible; guardarla **no exportable** y avisar antes de «borrar datos del sitio».

### 6.5 Multijugador: el invitado malicioso (reglas del anfitrión)

El anfitrión corre el juego entero y **no confía en nadie**:
1. **Todo mensaje se valida en el anfitrión:** esquema fijo (tipo + campos con tipo y rango), **tamaño máximo por mensaje** (p. ej. 16 kB) y **por tipo** (una pose ocupa 24 bytes: si llega más, se descarta), y **mensajes binarios con longitud verificada** antes de leer. Un mensaje inválido suma una falta; al llegar a 5 en un minuto, expulsión temporal.
2. **Ritmo:** tope por invitado (p. ej. 60 mensajes/s y 20 kB/s) y por acción (romper, poner, soltar, abrir cofre, chat 1 por segundo). Cola con límite: lo que sobra se tira.
3. **Autoridad:** posición con velocidad y alcance razonables (se comprueba contra lo que permite `physics.js`); romper o poner **solo a menos de 6 bloques y con el objeto en la mano**; el inventario es del anfitrión (B.10): el invitado manda intenciones, nunca cantidades ni ids sueltos; **ningún id se usa sin comprobar el rango** (`0 ≤ id < BLOCKS.length`, `ITEMS`).
4. **No puede escribir archivos ni ejecutar código:** el navegador no se lo permite, y aun así: **nunca `eval`, `new Function` ni `innerHTML` con texto recibido**; el chat, los nombres y los carteles siempre con `textContent`, máximo 200 caracteres, sin caracteres de control ni de dirección (`U+202E`).
5. **Nunca aceptar un mundo, una ficha o un `meta` de un invitado** sin pasar por la misma validación de la importación (6.2); la ficha del jugador la guarda y la lee el anfitrión.
6. **Sala:** código largo (≥ 60 bits, p. ej. 12 caracteres), contraseña opcional (Trystero cifra la señalización con ella), lista de invitados aceptados y expulsión por `jugadorId` (la llave de B.10), no por apodo.
7. **Mensajes falsos de «anfitrión»:** el invitado ignora todo lo que no venga del canal del anfitrión de esa sala; el anfitrión no reenvía mensajes de un invitado a otro sin validarlos.
8. **Privacidad de la IP (avisarlo en pantalla):** en WebRTC **los jugadores ven la IP del otro** (candidatos ICE), y los servidores STUN/TURN y los relés de Nostr ven la IP y la hora de conexión. Chrome oculta la IP local con mDNS, pero no la pública. Mensaje al crear o unirse a una sala: *«Jugar con amigos comparte su dirección de internet con ellos y con los servidores de conexión. Juegue solo con gente de confianza.»* Opción «Ocultar mi IP» = `iceTransportPolicy: 'relay'` (todo pasa por TURN; gasta de los 20 GB/mes de Open Relay, ver B.8).
9. **Prueba:** un «invitado malo» en `tools/` que manda mensajes enormes, ids absurdos, ráfagas, posiciones imposibles y texto con `<script>`, y exige que el anfitrión no se caiga, no cambie el mundo y no pierda ni duplique objetos (se suma a la herramienta de invariantes de B.10).

**Hecho cuando:** (a) `gitleaks` y `trufflehog` en cero sobre el repositorio que se va a publicar y `git log` sin el correo ni «isaac»; (b) `LICENSE` y `THIRD_PARTY.md` listos; (c) `npm audit` en cero avisos; (d) la prueba de inyección no ejecuta nada en ningún campo; (e) importar un archivo roto, uno enorme y uno con ids absurdos da un mensaje claro y no daña los mundos existentes; (f) la CSP está puesta en una página de prueba y el juego corre sin errores en consola; (g) Google Fonts fuera; (h) el «invitado malo» no logra nada; (i) lint y build en cero.

---

## Tanda 7 — Progresión de jefes y final épico (M–L) · 👁 la mitad

### 7.1 Todos los jefes, en el orden esperado de enfrentarlos

Los datos salen del código (`health`, `attack`, `boss`/`mini`, condiciones de aparición) y de `docs/BALANCE.md` (duelos medidos con `tools/bot-pelea.js`: tiempo para matar en segundos · daño recibido sobre 20 · ganó de 3; el bot es torpe: pega con 35 % de probabilidad, no se cubre ni esquiva). **«Día» y «equipo esperado» son propuesta mía** a partir de las condiciones del código y de los escenarios medidos (asedios y Noche Larga); el juego no los fija. **Los que no tienen «medido» no se han medido nunca.**

| # | Jefe | Cómo y dónde sale (código) | Vida · golpe | Mecánicas y fases | Medido (bot) | Día · equipo esperado |
|---|---|---|---|---|---|---|
| 1 | **Sombra capitana** (arena de retos) | `arena.js`: silbato del reto de la pulpería; oleada 5 de 5 | 70 · 5 | Sombra grande; 4 oleadas antes | sin medir | 3–8 · madera/piedra + cuero |
| 2 | **Terciopelo reina** (mini) | `armas2.js`, `miniSpawn`: día ≥ 5, selva o bosque nuboso, 40 % cada cierto tiempo de calma | 55 · — | Veneno (`VENENO_REINA`) | sin medir | 5–10 · hierro + cuero |
| 3 | **Jaguar viejo** (mini) | `miniSpawn`: día ≥ 5, de noche, selva/bosque/manglar | 90 · 9 | Salto con aviso desde v11.7; pega muy duro | temprana 2/3 (5.5 s · 19.5), media 5 s · 11.5, tardía 3.9 · 2 | 5–10 · hierro + cuero |
| 4 | **Cocodrilo del Tárcoles** (mini) | `miniSpawn`: día ≥ 5, en el agua (altura ≤ 66) | 130 · — | Mordida de agua | sin medir | 6–12 · hierro + hierro |
| 5 | **Leyendas**: Cadejos, Segua, Llorona, Mona, Viejo del Monte, Tulevieja (y la Sirena, capítulo de la historia) | `leyendas.js`: noche, día ≥ 4 (antes mataba al novato) | 60–140 · 4–6 (Cadejos 90, Segua 70, Llorona 60, Mona 70, Viejo 130, Tulevieja 140) | Cada una con su truco; la Tulevieja vuela y cae al aturdirla | sin medir | 4–12 · piedra a hierro |
| 6 | **Mono congo gigante** | `monocongo.js`: día ≥ 5, de día, selva | 170 · 6 | Aullido que marea y empuja, mangos en curva, saltos; a media vida se enfurece | sin medir | 6–12 · hierro + cuero |
| 7 | **Jefes del monte** (6; Ofrenda del monte: flor amarilla, cacao, guaro y antorcha; de noche, en su bioma; nivel 5 sugerido). **Revancha**: vida ×1.5, golpe ×1.3 | `jefes2.js` (`usarOfrenda`), `jefes3.js` | Reina Bananera 260 · 6; Cascabel del Llano 280 · 7; **Don Cornudo (Hércules) 280 · 7** (era 340 · 8); Tata Sapo 300 · 7; Cangrejo Rey 320 · 7; Ciempiés Rey 360 · 7 | Reina: teje, cría, cae encima, veneno a media vida. Cascabel: se entierra y revienta desde abajo. Hércules: embiste (trabado contra una pared recibe todo), caparazón, pisotones. Tata: lengua, buche, charcos. Cangrejo: concha (solo el mazazo la raja), chorros, llama tenazas. Ciempiés: anillo que se cierra, veneno y velocidad | Reina 14.7 s · 6.8 (diamante); **Hércules 40.5 s · 22.7 (diamante)**; Cangrejo 34 s · ~14.7 (diamante); con equipo medio ninguno se gana sin cubrirse; **Tata, Cascabel y Ciempiés: sin medir** | 10–25 · hierro + hierro, 1 a 3 ★, platos |
| 8 | **Capitán de la goleta** | `goleta.js`: día ≥ 4, de noche, mar adentro, 1/200 por chequeo; sale al caer 6 ánimas | 80 · 4 | Cañonazos y ánimas voladoras | sin medir | 6–15 · hierro |
| 9 | **Murciélago Rey** | `caverna.js`: al entrar a su sala (una vez por caverna); suelta la pluma de quetzal | 110 · 5 | Vuela rápido (6); cuevas | sin medir | 10–20 · hierro |
| 10 | **Señor del Arenal** | `inframundo.js`: capítulo del fuego; Inframundo (marco de obsidiana + Llave del volcán), aparece a los pocos minutos | 320 · 7 | Bombas de lava apuntadas, onda de fuego; lento pero duro | sin medir | 18–30 · hierro/diamante |
| 11 | **Arpía de la Tormenta** | `arpia.js`: capítulo del cielo; Tierras del Cielo (calcita + pluma de quetzal) | 260 · 6 | Picada con amago (parry), rayos marcados, ráfagas que empujan al borde; con menos de la mitad, tres rayos | sin medir | 20–32 · diamante |
| 12 | **Jefa de Ventanilla** / **El Olvido** (jefes de misión: trámite; la Grieta de Anselmo) | `arena.js` (`elOlvido`), `anselmo.js` | 240 · 6 / 340 · 8 | Sellazo con aviso; El Olvido: lo que Anselmo tenía tapado | sin medir | 20–35 · diamante |
| 13 | **Sombra Madre** (final de la historia de Zenaida) | `historia.js`: Noche Larga en la casa, 4 oleadas | 220 · 7 | La última de cuatro olas; +vida por día en las demás | los asedios y Noche Larga se ganan siempre | 25–35 · diamante, casa arreglada |
| 14 | **Rey Zopilote** (jefe final del juego) | `final.js`: Corona del monte (los 6 trofeos), de noche, altura ≥ 95 y cielo abierto | **900 · 8** | 3 fases por vida (66 % / 33 %): aire, tormenta, alas rotas | **sin medir** | 30+ · diamante/jade, 3 ★, plato y Alas del Rey |
| — | *Aparte:* Bailarín Elegante (120 · 5), de fiesta, mirarle los pies | `bailarin.js` | — | Opcional; da oro | sin medir | cualquiera |

**Detalle del Rey Zopilote hoy** (medido leyendo `final.js`): picada 8, picotazo 5 (con aviso y parry), rayo 6 (círculo de 1.2 s), pluma 3 (tres por ráfaga), caída 7, aletazo 6 (anillo de 0.8 s), ceniza que marea 4 s. Posado 4 s (fase 1) o 3 s (fase 2) **entre picadas**: ahí se le llega con el arma; **en el aire solo le entran los tiros**.

### 7.2 Dónde se rompe la progresión hoy

1. **El salto final es de ×2.5.** El mayor de los jefes del monte tiene 360 de vida; el Rey, 900. Y desde el Rey hacia abajo la escala no es monótona: **la Arpía (260), «que cierra la escala de jefes» según su propio comentario, tiene menos vida que cinco de los seis jefes del monte**, y la Sombra Madre (220) menos que todos ellos.
2. **Don Cornudo (Hércules) es el raro:** 40.5 s con diamante contra 14.7 s de la Reina (casi ×3) y 34 s del Cangrejo Rey, con 280 de vida. El caparazón deja pasar poco al corte y el bot se queda a ~7 de daño por segundo. `BALANCE.md` ya propone **280 → 250** y sigue sin aplicarse.
3. **El Jaguar viejo** (minijefe del día 5) sigue siendo el más duro del principio: con equipo temprano el bot gana 2 de 3 dejando 19.5 de 20; es más difícil que la Reina Bananera, que es un jefe «de verdad».
4. **Cuatro jefes del monte, todos los de dimensión y el Rey no están medidos.** El bot solo tiene duelos para Reina, Hércules y Cangrejo. Sin medir Tata, Cascabel y Ciempiés, no se puede ordenar el grupo de seis; y sin medir Señor, Arpía y Rey, no se sabe si la cola de la curva sube o baja.
5. **Orden libre.** Los seis jefes del monte se llaman en cualquier orden (solo importa el bioma): conviene que **los seis valgan casi lo mismo** (±25 % en tiempo de pelea) o que se ordenen por bioma con una pista. Hoy van de 260 a 360 de vida y de 15 a 40 s.
6. **Estimación del Rey** (no medida): el bot con diamante hace entre 7 y 18 de daño por segundo según el enemigo; el Rey está **al alcance de la espada solo entre un tercio y la mitad del tiempo** (posado 4 s de un ciclo de ~11 s en la fase 1). Con 900 de vida salen **más de 2 minutos solo de pegar y probablemente cerca de 3**, contra 15–40 s de los demás: ×5 a ×10. Por confirmar con el bot.

### 7.3 Curva objetivo, medible con `tools/bot-pelea.js`

Se mide como hoy, con los **tres equipos de `BALANCE.md`** más dos nuevos: **jefe-hierro** (hierro + hierro, 1 ★) y **jefe-diamante** (diamante + diamante, 3 ★, plato de fuerza). Cada corrida da `TTK`, `recibido` y `ganó de 3` (el bot ya los imprime). Objetivo, **para el bot torpe con el equipo esperado de ese tramo**:

| Tramo | Jefes | Equipo | TTK objetivo | Recibido (de 20) | Gana |
|---|---|---|---|---|---|
| A | Minijefes, leyendas, Mono congo, Capitán | hierro + cuero | 8–15 s | 4–9 | 3/3 |
| B | Jefes del monte (los 6) | hierro + hierro, 1 ★ | 15–30 s, subiendo Reina → Ciempiés | 6–12 | 3/3 |
| C | Murciélago Rey, Señor, Arpía, Jefa, Olvido, Sombra Madre | diamante, 1–2 ★ | 25–40 s | 8–14 | 2/3 o 3/3 |
| D | Rey Zopilote | diamante, 3 ★, plato | **90–120 s** en total (30–40 s por fase) | 12–18 | **2/3**: el bot torpe pierde a veces; con parry y esquive, no |

**Reglas de aceptación:** (1) la mediana de cada tramo es entre ×1.3 y ×1.6 la del anterior; (2) ningún jefe del tramo B+1 mata más rápido ni recibe menos daño que la mediana del tramo B; (3) dentro del tramo B los seis quedan a ±25 %; (4) ningún jefe del tramo A deja al bot con menos de 5 de vida con el equipo esperado. **Primeros ajustes** (en este orden, y remedir después de cada uno): Hércules **280 → 250**; subir **Arpía y Sombra Madre** (≈ 320 y 300) o darles más fases para que cierren el tramo C; Jaguar viejo **9 → 8** con equipo temprano; fijar la vida de los seis del monte en una banda (p. ej. 270–330) y que los trucos hagan la diferencia, no los números.

**Trabajo de herramienta (M–L):** (a) `tools/bot-pelea.js`: sumar `DUELOS` para Tata, Cascabel, Ciempiés, Murciélago, Señor, Arpía, Sombra Madre, Olvido y Rey; el Señor necesita la dimensión del inframundo, la Arpía las Tierras del Cielo, el Rey altura ≥ 95 de noche y cielo abierto, y **un bot que pegue al Rey solo cuando está posado y use arco contra el aire** (hoy solo cuerpo a cuerpo); (b) los dos equipos nuevos en `JUEGOS`; (c) una tabla `docs/BALANCE.md` por tramo; (d) repetir cada duelo tres veces.

### 7.4 El final del juego, hoy

- **Rey Zopilote** (`final.js`): se llama con la **Corona del monte** (6 trofeos) de noche y arriba de la altura 95; tres fases por vida (aire, tormenta, alas rotas), picadas con aviso, rayos con círculo, plumas, brinco y aletazo con anillo, ceniza que marea; `presentarJefe` pone el **título** («El Rey Zopilote») y un temblor de pantalla; al caer: logro, aplausos, `meta.creditosPendientes` y a los 4.5 s los **créditos** (un rollo de 9 renglones y «Seguir jugando»); trofeo (la Cabeza del Rey), plumas para las Alas del Rey. Segunda vez: solo un aviso.
- **La historia de Zenaida** (`historia.js`): 9 capítulos (la herencia, la casa vieja, la comadre, se les puede ganar, los cuatro pedazos —tierra, agua, fuego, cielo—, la noche larga) y unas veinte cartas; cierra con la **Noche Larga** en la casa y la **Sombra Madre**.
- **Después:** el **Corazón** (`corazon.js`: la Noche de Ceniza, oleadas sin fin con récord), **Yendry** (`guila.js`: tres lecciones y su propia carta) y el **epílogo** (`epilogo.js`: un domingo de mesa larga con todos, una pantalla en negro con números de la partida; exige historias de Tino, Chepa, Flor, Wilber, Anselmo, la prima y Yendry).
- **Lo que no tiene:** **música propia del jefe** (la `Music` de `musica.js` es generativa —marimba de día, arpa de noche— y no distingue peleas), **cinemática** (solo el título y un temblor), **arena** (se pelea donde cayó la cumbre; no se transforma), **personajes en la pelea** (el pueblo no aparece), y el **Rey es un jefe aparte de la historia**: la Sombra Madre cierra los hilos de Zenaida y el Rey cierra la Corona, **sin que una pelea llame a la otra**. Los créditos son texto plano, sin la gente que el jugador conoció.

### 7.5 Propuesta: «La noche del Rey» (todo original y tico; tamaño por punto)

**Idea:** unir los dos finales. El Rey Zopilote es el último peligro de Tiquicia y **la gente a la que el jugador ayudó sube a verlo**. La música crece con las fases, la cumbre cambia y el remate cierra los hilos del epílogo. Todo con piezas que ya existen (`gente.js`, `ayudaEnPelea` en `defensa.js`, `Weather.set`, `presentarJefe`, `foto.js` con barras de cine, `procesion.js`, `corazon.js`).

**Acto 0 — La subida (preludio) · M**
1. **La caravana de farolitos.** Al ofrecer la Corona (`usarCorona`) la gente de la casa (Tino, Chepa, Flor, Wilber, Doña Eulalia, Don Anselmo, Yendry, el Canelo) **sube con faroles** hasta la cumbre y se queda abajo, en la ladera: ayudan **desde lejos** y no se pueden matar. Se usa `genteEnCasa` y los vecinos de `gente.js`. **M**
2. **Cinemática corta con barras de cine** (`foto.js`: `barras-cine`), 6–8 s: el viento se para, la sombra tapa la luna, y llega el título. Reemplaza el «temblor + título» de hoy. **S**
3. **Voz de Zenaida.** Una última carta («Mi güila: si está arriba, es que ya me escuchó…») que se lee en una línea antes del combate, solo si se terminó su historia; si no, un anciano del pueblo dice una frase corta. **S**

**Acto 1 — El aire (0–66 % de vida) · S–M**
4. **Música que crece.** Pieza propia de pelea en `musica.js`: marimba grave en 6/8 con **un instrumento nuevo por fase** (fase 1: marimba y un tambor de cuero; fase 2: sumar un coro de voces y percusión; fase 3: todo y un cierre). Un volumen que sube con la vida del Rey. **M**
5. **El pueblo ayuda sin aburrir.** Cada uno da **una ayuda por fase, ligada a su oficio**: Tino (herrero) arregla las armas rotas una vez; Chepa (cocinera) deja un plato de fuerza; Flor (curandera) cura una vez al llegar a media vida; **Wilber (vigilante que dispara)** da fuego de cobertura cada 2 s cuando el Rey está en el aire (usa `ayudaEnPelea`). Con un tope para que no ganen solos. **M**

**Acto 2 — La tormenta (66–33 %) · M–L**
6. **La cumbre se transforma.** Al pasar a fase 2: tormenta forzada (`Weather.set('storm')`), relámpagos, niebla y **el suelo se agrieta por tramos** (una lista de bloques que se vuelven vacío y se restauran al terminar; con tope de bloques y guardado seguro de lo cambiado). La zona segura **se achica por anillos**. **L**
7. **El Corazón responde.** Si el jugador tiene los cuatro pedazos (los del Corazón de Tiquicia), brillan en el inventario y **una vez** pueden dar un escudo de luz de 4 s (usa `corazon.js`); si no los tiene, el pueblo enciende una pira. **M**
8. **Un hilo de la historia a media pelea.** El Rey dice **una frase** (texto del locutor con categoría `importante`, sin interrumpir) que alude a lo que el jugador hizo (p. ej. a la Corona o a un jefe vencido de `meta.jefes2`). **S**

**Acto 3 — Alas rotas (33–0 %) · M**
9. **La caída.** Cinemática corta: el Rey cae en la cumbre; el cielo se parte y aparece **el primer rayo de sol** del amanecer a lo lejos. Pelea en el suelo con la arena ya hecha ceniza. **M**
10. **El golpe final con el pueblo.** Al llegar a 5 % de vida se queda tambaleando y **el jugador remata** (ese golpe tiene cámara lenta de `foto.js`); no sale una barra de «hazlo ya», solo un destello. **S**

**Remate y epílogo · M**
11. **Amanecer y créditos con la gente.** El cielo se despeja y los créditos pasan **con los retratos y nombres de quienes subieron** (los reales de `meta.gente`, lo que el jugador logró de `meta.hist`: casa arreglada, comensales, jefes vencidos, días). Reemplaza el rollo plano de 9 renglones de `final.js` (`CREDITOS`). **M**
12. **La carta de Zenaida, abierta.** Si se terminó su historia, el epílogo **sale solo al día siguiente en la mesa larga** (`epilogo.js`), con lo que pasó en la noche del Rey. Si no, queda como hoy. **S**
13. **Trofeo y mundo.** La Cabeza del Rey, un **nuevo ciclo de «la Noche de Ceniza»** (récord) con el Rey como jefe opcional, y «Seguir jugando». **S**

**Costo y orden:** primero **4** (música), **2** y **9–10** (cinemáticas): dan la sensación de épica por poco costo (S–M). Después **5** y **6** (ayuda del pueblo y arena que cambia: M–L, las que más pesan). Después **11–13** (remate). **Riesgos:** el rendimiento (partículas y relámpagos con tormenta + niebla); cambiar bloques en la cumbre debe **restaurarse** aunque el jugador muera o salga del mundo; la música nueva exige **sonidos CC0** (Freesound/VCSL, ya son la fuente del juego) o notas generativas. **Hecho cuando:** el Rey pasa la medición de 7.3 (tramo D), hay música distinta en cada fase (👁), la arena cambia en la fase 2 y se **restaura** al terminar, el pueblo aparece y ayuda sin que el jugador pierda el control, los créditos nombran a quienes subieron, y un mundo viejo sin la historia completa sigue pudiendo pelear al Rey (con la ayuda reducida).

**Dependen de que nanoyackson lo vea jugando (👁):** la **música** (4), el **tono de las frases** (3, 8, 11) y la **dificultad real del Rey** (7.3, tramo D).
