# Inventario de textos pasajeros

Hecho por lectura y conteo sobre `master` (la constructora está editando `src/`; cada hallazgo lleva archivo y función o línea aproximada). Los conteos salen de `grep` y de un script que recorre `src/*.js` (excluye `version.js` y `ayuda.js`, que son contenido de libreta, no avisos). Frecuencias teóricas calculadas de los temporizadores que se leyeron; las marcadas «aprox.» dependen de algo que no se vio corriendo.

**Cifras globales:** 889 llamadas `ui.toast(` (≈ 215 archivos distintos) · 145 `decir(` (globos de vecinos, 60+ archivos) + 80 `ui.dialog(` · 48 `regionBanner(` · 561 `achieve(` (cada una dispara tarjeta + sonido + línea de diario) · 13 `combatFlash(` · 129 textos de toast/diálogo con más de 90 caracteres (30 con más de 130).

---

## 1. Mecanismos

Todos viven en `src/ui.js` salvo indicación. «Cola» = si un texto nuevo espera su turno; «se pisa» = si borra al anterior.

| Mecanismo | Firma y archivo | Duración | Cola / se pisa | Dónde se dibuja |
|---|---|---|---|---|
| **Toast** | `toast(text, ms = 1800)` · `ui.js` (+ `mostrarToast`, `seguirToast`, `limpiarAvisos`) | `ms` (la mayoría 1.4–3.6 s; máx. visto 10 s). Tiempo mínimo en pantalla antes del siguiente: `min(ms, 1200 + 35 × largo)` | Cola de **5**; si hay más, **se descartan en silencio**. Si el texto nuevo comparte los primeros **8 caracteres** con el actual, **lo pisa al instante** (el contador reemplaza). Se ignora un duplicado ya en cola. Historial de 40 en `this.avisos` | `#toast` (centro, `top: 27 %`, 28 px amarillo). Ancho limitado a media pantalla por `left: 50 %` sin `width` |
| **Banner de región/capítulo** | `regionBanner(name, lema)` · `ui.js` | 3.2 s (`bannerHasta`) | Cola de **3** (`bannerCola`); el cuarto se pierde | `#region-banner` (arriba, 48 px) |
| **Diálogo de personaje** | `dialog(name, text, ms = 4200)` · `ui.js` | 4.2 s | **Sin cola: se pisa** (un solo `dialogT`) | `#dialog` (abajo, sobre la barra) |
| **Globo de vecino** | `decir(g, m, texto, seg = 3.2)` · `misiones.js` (`tickCharlas` lo apaga) | 1.2–4 s | **Uno por vecino** (reemplaza el suyo); **sin tope global**: 10 vecinos hablando = 10 globos | Sprite 3D sobre la cabeza (`burbuja()`), en el mundo |
| **Logro** | `achieve(key, text)` · `game.js` → `ui.achievement(text, icon, n)` | 5 s (4.2 + 0.8 de salida) | **Sin cola ni tope**: cada tarjeta es `position: absolute; top: 10px; right: 10px`, así que **varias quedan superpuestas en el mismo sitio** (`.achv`). Además `anotar()` escribe la línea en el diario y suena `craft` | `.achv` en `#hud`, arriba a la derecha |
| **Letrero de combate** | `combatFlash(kind, text)` · `ui.js` | 0.7 s | **Se pisa** (una sola etiqueta; reinicia la animación) | `#combat-flash` (centro, 40 px) |
| **Número de daño** | `numeroDano(n, x, y, z)` · `ui.js`; `avisoGolpe(g, m, txt, mult)` · `armas3.js` | 0.8 s / 1.1 s | Nodo nuevo por golpe, **sin tope** | `.num-dano` posicionado sobre el enemigo (proyección 3D→2D) |
| **Marca de dirección del golpe** | `golpeDesde(dx, dz, yaw)` · `ui.js` | 0.8 s | Nodo por golpe | `.golpe-dir` (arco rojo) |
| **Subtítulo de sonido** | `caption(name, pos, player)` · `ui.js` (se llama desde `audio.js`) | 2.5 s | Un renglón por texto (mismo texto se renueva); máx. **6**, quita el más viejo | `#captions` (abajo a la derecha) |
| **Registro de recogidas** | `registroObjeto(id, n)` · `ui.js` (lo llama `ItemDrop.update`) | 2.6 s + 0.3 s de salida | **Suma** por objeto (`+7 Madera`); máx. **5** filas | `#recogidos` (derecha, sobre los subtítulos) |
| **Nombre del objeto en mano** | `showItemName(text)` · `ui.js` | 1.6 s | Se pisa | `#itemname` (sobre la barra) |
| **Cartel de equipar** | `equipPop(id, points)` · `ui.js` | 2.2 s | Nodo nuevo | `#equip-pop` |
| **Misión/objetivo fijos** | `mision(text)`, `objetivo(o)` · `ui.js` | **Permanentes** (hasta que cambian) | Reemplazan solos (`#mision-hud`, `#objetivo`) | Arriba al centro y a la izquierda |
| **Chat y consola** | `chat(text)` · `ui.js` | 9 s (visible) | Tope de **10** líneas | `.chatlog` (abajo a la izquierda) |
| **Radio** | `locutor(g)` · `noticias.js` (usa `toast`) | 6.5 s | Hereda la cola del toast | `#toast` |
| **Indicadores de estado** | `indicadores.js` (`#ind-dur`, `#ind-meta`), `permiso.js` (`#tramite`), `tiro.js` (`#tiro`), `torneo.js` (`#torneo`), `influencer.js` (`#vistas`), `pezvela.js` (`#vela-barra`), `toros.js` (`#monta-*`) | Permanentes mientras dure la actividad | Cada uno su caja, **escribe directo al DOM** | HUD, posiciones fijas distintas (ver sección 5) |
| **Carteles grandes sueltos** | `jefes3.js` (`#jefe-titulo`, 4.2 s), `foto.js` (`#titulo-video`), `prologo.js`, `epilogo.js`, `final.js` (créditos) | 3–40 s | Cada uno a su manera | Pantalla completa / centro |
| **Pie de la mira** | `comodidad.js`, texto de `#mirando` y `#receta-fija` | Permanente según lo apuntado | Reemplaza | Centro-abajo y lateral |
| **Reloj** | `comodidad.js` → `#reloj` | Permanente | — | Arriba a la derecha |
| **Pensamiento de diario** | `anotar(g, texto, icono)` · `diario.js` | No se muestra en pantalla | Se archiva | Hoja del Diario (N) |

**Conclusión de mecanismos:** hay **dos** que sí tienen cola (`toast`, `regionBanner`), **dos** que se pisan sin cola (`dialog`, `combatFlash`), y **tres** que se acumulan sin tope en el mismo lugar (`achievement`, `numeroDano`, `decir` por vecino). El toast **descarta** a partir del sexto aviso en cola y **sobrescribe** por prefijo de 8 letras: dos avisos distintos que empiezan igual («🐝 …», «📻 …», «🌊 …», «🦥 …») se pisan aunque no sean el mismo.

---

## 2. Fuentes por sistema

Conteos de llamadas (toast · diálogo/globo · banner · achieve). La categoría propuesta usa las cinco del locutor: **U** urgente, **I** importante, **C** consejo, **A** ambiente, **R** registro.

| Sistema | Toast | Diálogo/globo | Banner | Achieve | Archivos principales | Ejemplo | Categoría propuesta |
|---|---:|---:|---:|---:|---|---|---|
| Combate y criaturas hostiles | 236 | 9 | 10 | 99 | `bravos` (22), `leyendas` (21), `nidos` (13), `arena` (12), `jefes2` (11), `final` (11), `jefes3` (8), `asedio` (10), `bichos2` (8), `sombras2` (6) | «🐜 ¡AY! Le picó una hormiga bala…» | **U** lo que quita vida o exige actuar ya (veneno, asedio, puma); **I** inicio/fin de jefe y oleada; **C** «cómo se le gana» (primera vez); **R** botín |
| Supervivencia y cuerpo | 71 | 0 | 0 | 29 | `supervivencia2` (12), `supervivencia3` (11), `comodidad` (8), `fuerza` (6), `monte`, `yunque` (8) | «🥱 Lleva dos noches sin dormir…» | **U** sangrado y veneno; **C** `tickConsejos`, `tickCuerpo`, sed, hambre; **R** curas hechas |
| Clima, desastres y naturaleza | 54 | 3 | 0 | 35 | `quema` (13), `tsunami` (6), `terremoto`, `incendio`, `cielo2`, `clima2/3` | «🌊 ¡El mar se está recogiendo!…» | **U** tsunami, incendio de casa; **I** luna roja, temblor; **A** aguacero, charcos |
| Fauna, mascotas y mar | 82 | 7 | 0 | 50 | `fauna` (16), `mar2` (7), `mascotas` (6), `fauna2` (5), `plaga`, `pezvela` | «🦥 ¡El perezoso se le colgó de la mochila!…» | **I** hitos de pesca y mascota; **A** curiosidades («rana de vidrio»); **R** capturas |
| Pueblo, vecinos y economía | 53 | 90 | 1 | 71 | `economia`, `satira`, `rigo`, `peon`, `elecciones`, `cuidacarros`, `cumple`, `buhonero` | «¿Marielos? Es mi sobrina…» (globo/diálogo) | **A** globos y charla; **I** trámites con plata; **R** compras |
| Minijuegos y eventos | 91 | 19 | 3 | 50 | `juegos` (11), `cintas`, `carrera`, `aros`, `sacos`, `toros` (10), `bingo`, `clasico`, `rifa` | «🏁 ¡Circuito de 8 aros en el cielo!…» | **I** inicio/resultado; **A** narración de radio, ambiente de plaza; **C** reglas |
| Historia, misiones y encargos | 106 | 63 | 26 | 72 | `historia`, `anselmo` (13), `expediente`, `guila`, `prima`, `correo`, `reliquias`, `gente`, `canelo` | «📦 ¡Cuchara de Zenaida! La carta dice dónde está el siguiente» | **I** capítulos y cartas; **C** pistas; **A** diálogos largos |
| Vehículos y monturas | 43 | 14 | 0 | 33 | `avioneta` (11), `vehiculos`, `vehiculos2`, `aire`, `alas`, `bus`, `compas` | «✈ W acelera · S baja el motor · …» | **C** (primera vez de cada vehículo; son **instrucciones de teclas**) |
| Interfaz y sistema | 123 | 5 | 8 | 78 | `game` (80), `foto` (16), `ui` (9), `ermitas`, `amanecer` | «Volando» / «Caminando» (cambio de modo) | **R** (guardado, modos, cámara); **U** errores de guardado |
| Otros | 42 | 17 | 3 | 44 | `finca` (10), `plato` (9), `mundo2`, `oficios`, `rioypatio`, `vidapueblo2` | «🌑 Se oye un llanto…» | mezcladas |
| **Logros** (transversal) | — | — | — | **561** | todos | «¡Logro! · 73: Sentadito» | **R** (con tarjeta pequeña y sin sonido propio) |
| **Subtítulos de sonido** | — | — | — | — | `audio.js` + `captionText()` | «◀ Pasos ▶» | **A** |
| **Registro de recogidas** | — | — | — | — | `entities.js` | «+3 Madera» | **R** |

**Lectura de la tabla:** Interfaz, Combate y Mini­juegos son los mayores emisores de toasts, pero Pueblo/vecinos (90 globos/diálogos) e Historia (63) emiten más texto largo. El logro (561) es el emisor con más llamadas y el único sin cola.

---

## 3. Los que más ruido hacen (fuentes por temporizador, ráfaga o sin enfriamiento)

Frecuencia «teórica» = lo máximo que el código permite bajo las condiciones indicadas. Los 15 peores van ordenados por (frecuencia × largo × si se superpone a otros).

| # | Fuente (archivo, función) | Qué dispara | Frecuencia teórica | Por qué es ruido | Propuesta |
|---|---|---|---|---|---|
| 1 | **`achieve()`** (`game.js:3245`, 561 llamadas) | Tarjeta `.achv` + sonido + línea de diario, por cada hito | En los primeros minutos puede haber varias por minuto (silla, cama, mapa, fogata, hierbas…). **Sin cola:** las tarjetas se montan en el mismo rincón | Tapan el aviso que importa y suenan igual que un logro grande | Cola propia; máx. 1 tarjeta cada 4 s; los pequeños solo al **registro** (sin tarjeta) |
| 2 | **`tickConsejos`** (`supervivencia.js`, 1 Hz) | 12 consejos de 80–120 caracteres, 5.2 s cada uno, durante los días 1–3 | Uno cada **25 s** (`consejoHasta = playT + 25`) mientras queden por decir, o sea unos 12 en los primeros 5–8 min de juego activo | Compiten con lo que el jugador está aprendiendo; se leen a la vez que `tickCuerpo`, `bolsito`, la ruta y los banners | Categoría **C**: solo salen si no hay nada **I/U** en cola; mínimo 90 s entre consejos |
| 3 | **Comer** (`game.js:2795-2832` + `fuerza.js:comidaFuerza`) | Hasta **tres** mensajes por mordisco: efecto de la comida, «Comida con fuerza», «Eso ya lo tiene en la panza», «¿Otra vez X?», más `achieve('fuerza')` | 1 ráfaga de 2–4 avisos por cada comida | Ráfaga: se pisan por prefijo y la cola se llena | Unir en un solo aviso («🍲 Comió: +2 corazones y +10 aguante · 6 min») |
| 4 | **Clásico del domingo** (`clasico.js:tickClasico`, 1 Hz) | Radio por minuto simulado: arranque, goles, narraciones (minuto % 15 = 7), final del 1.er tiempo y final | **90 s** de partido con ≈ 10 avisos de 90–120 caracteres, uno cada **9 s**; más globos de vecinos por gol (60 % de los vecinos a 30 bloques) | 9 s de media entre avisos largos | Categoría **A**; un solo resumen al final + goles como **registro** |
| 5 | **Gol del estadio** (`game.js:1956`) | Toast al azar de 3 textos | Cada **35–65 s** (media 50 s) **sin importar la hora**, mientras el jugador esté a menos de `zn.r` del estadio | Repetitivo y fuera de contexto | Solo en horario de partido y 1 vez por visita |
| 6 | **Sanatorio** (`game.js:1946`) | «Se oyen pasos…», «¿Quién anda ahí?» | Cada **25–55 s** (media 40 s) de noche dentro de la zona | Ambiente que se vuelve metralleta; ya lleva sonido | **A** con enfriamiento de 3 min; el sonido basta |
| 7 | **Viaje del hongo** (`game.js:3276`, `tickLocas` a 1 Hz) | Frases de alucinación + 12 partículas | 10 % por segundo = **1 cada 10 s** mientras dure el efecto `viaje` | 6 por minuto | 1 cada 45 s o solo partículas |
| 8 | **Locutor de radio** (`noticias.js:30`) | Noticia de 6.5 s (≈ 100 caracteres) | Hasta 1 cada **180 s** (50 % en cada cambio de pieza de música) | Es el texto con más tiempo en pantalla y bloquea la cola del toast ≥ 4.7 s | **A**, 3.5 s; solo si no hay nada **I/U** |
| 9 | **Frío del páramo** (`supervivencia.js:tickFrio`, 1 Hz) | «¡Qué frío hace…!» al llegar a `frio === 5`; «Ya se calentó» al salir | En la **frontera** del páramo (donde `alto` cambia) vuelve a disparar cada vez que se cruza: hasta uno cada 6–10 s | Re-aviso por pasos de borde | Histeresis: una vez por visita (`meta`) |
| 10 | **Insolación** (`supervivencia2.js:tickSed`) | «¡Qué sol! Le dio una insolación…» + `mareo` | 5 % por segundo tras 20 s de enfriamiento: **1 cada ~40 s** en desierto/playa/bosque seco al mediodía sin sombrero y con `water < 10` | Mensaje de 100 caracteres que se repite si se sigue allí | Enfriamiento de 3 min, o solo icono de efecto |
| 11 | **Mochila llena** (`entities.js:ItemDrop.update`) | «🎒 Se le llenó la mochila: bote algo con Q o guárdelo en un cofre» | Cada **8 s** (`mochilaT = clock + 8`) mientras se camine sobre ítems con la mochila llena | Cada 8 s, 90 caracteres | **C** con 60 s; el icono de la mochila parpadeando basta |
| 12 | **Combate (marcas flotantes)** (`numeroDano`, `avisoGolpe`, `golpeDesde`, `combatFlash`) | 2–3 nodos DOM por golpe propio o recibido + letrero | Con 3 enemigos: **5–8 nodos por segundo**, sin tope | Ruido visual, no de lectura, pero compite con los textos reales | Tope de 4 simultáneos; los números ≥ 12 se fusionan |
| 13 | **Fuerza y descanso** (`fuerza.js:tickFuerza`, `tickDescanso:111`) | «Se le bajó una comida» y «Buen descanso (comodidad N)…» (173 caracteres) | Una por cada comida que vence (hasta 3 en 4–9 min) y una por cada vez que se repite el descanso | El texto de descanso es el 12.º más largo | **R**; acortar (ver sección 4) |
| 14 | **Globos de vecinos** (`decir`, 145 llamadas) | Cada vecino puede hablar por su cuenta: `cuidacarros` cada 12–20 s, `sereno` ~1 cada 20 s (`dt × 0.05`) y gritos cada 6–8 s, `serenata`, `elecciones`, `economia`… | En una plaza con 8–10 vecinos puede haber **varios globos a la vez**, sin tope global | Se leen mal y no se sabe cuál es importante | Tope de **3** globos visibles y solo a menos de 10 bloques |
| 15 | **Inicio de evento nocturno** (`asedio.js`, `lunaroja.js`, `cielo2.js:23`, `nidos.js`) | Toast + banner + `achieve` + (a veces) diálogo en el mismo cuadro | 1 ráfaga de **3–4** textos por evento, varias veces por noche en luna roja | Ráfaga, y la cola descarta a partir del sexto | Un solo **U/I** y el resto a **R** |

**Otros con el mismo patrón (no entran en los 15):** `tsunami.js:67/144/154` repite el mismo texto de 100 caracteres en tres sitios; `foto.js` (16 toasts, uno por tecla de modo foto); `game.js:507` («Volando»/«Caminando» al alternar el vuelo); `torneo.js:36` (un toast por pez); `quizaFiebre` (`monte.js`, un toast de 116 caracteres por cada picada con éxito).

**Los que ya están bien resueltos** (una sola vez con bandera): `zancudos` (`meta.picado`), `abejas` (`D.avisoPica`), `marabunta` (`M.avisado`), `hongos` (`meta.hongoAviso`), `tickMojado` (`meta.empapadoDicho`), `tickCuerpo` (`g.avisosCuerpo` con histéresis 6↔9).

---

## 4. Textos de más de 90 caracteres

129 en total (toast = T, diálogo = D). Se listan todos, con el recorte propuesto. Reglas del recorte: «usted», sin género marcado, jerga tica, máximo ~80 caracteres para toast y ~110 para diálogo (partido en dos globos con `↵` si hace falta). Los textos con `${…}` conservan sus variables.

| # | Archivo:línea | Tipo | Largo | Recorte propuesto |
|---:|---|:-:|---:|---|
| 1 | expediente.js:42 | D | 295 | «Cambió el reglamento: aquí pasa la Ruta del Progreso, cuatro carriles, para el 2049.↵La casa estorba. Junte ocho firmas de vecinos y pruebe que es suya, y tiene audiencia. Tome la hoja.» |
| 2 | rigo.js:107 | D | 259 | «Mi cepa, soy su tío Rigo. Lamento lo de mi mamá.↵Por ${PRECIO} colones le dejo el Seguro contra Sombras: si se muere, no se le cae nada. Una sola vez, letra menuda. Hábleme para firmar.» |
| 3 | expediente.js:222 | D | 256 | «¿Es para mí? Treinta años en esa ventanilla y nadie… Disculpe, se me metió algo en el ojo.↵Tome: un Permiso de Todo, para una emergencia. No le diga a nadie. ¿Los domingos se come en esa casa?» |
| 4 | rigo.js:115 | D | 230 | «Las Sombras me robaron el maletín con las pólizas. Quedó en un cofre en el monte: ya se lo marqué en la brújula.↵${vendido ? 'Y ya tiene seguro…' : 'Y yo que le iba a vender uno…'}» |
| 5 | foto.js:30 | T | 229 | «📷 Modo foto: WASD mueve · Espacio/Shift sube y baja · rueda = zoom · Enter = foto · F2 sale» (el resto, en la hoja de ayuda) |
| 6 | cumple.js:17 | D | 228 | «No me haga caso: el domingo cumplo noventa. Zenaida me hacía un tres leches malísimo, como esponja de lavar, y yo me lo comía.↵Este año… bueno. ¿Qué me decía?» |
| 7 | cumple.js:29 | D | 205 | «…Ay, ¿quién le dijo? No me conteste. Está malísimo, ¿verdad? No: está bueno, por eso no sabe igual.↵Siéntese. Tome: esto me lo dejó Zenaida «para cuando alguien se acordara».» |
| 8 | expediente.js:206 | D | 186 | «…1931, con sello de la Junta. Es anterior a la Municipalidad: técnicamente, la Municipalidad está en su patio.↵Se archiva el proyecto. Le devuelvo lo de los timbres.» |
| 9 | rigo.js:103 | D | 180 | «¿Marielos? Mi sobrina: cuidó a mi mamá los últimos años y nadie se lo agradeció.↵No le venda ni le compre nada. Pero déle café.» |
| 10 | lunaroja.js:58 | T | 179 | «🌅 Amaneció: ${S.matadas} de ${S.total} Sombras caídas. Botín: ₡${…}, esencias${S.ola >= OLAS ? ' y un diamante' : ''}» |
| 11 | rigo.js:141 | D | 179 | «Mire lo que encontré: mi mamá le pagó una póliza por cuarenta años, a nombre suyo.↵Tome los 80 colones y esta carta, que venía adentro.» |
| 12 | fuerza.js:111 | T | 173 | «😌 Buen descanso (${C.n}): más aguante y más experiencia por ${min} min» |
| 13 | peon.js:91 | D | 172 | «Trabajé aquí con doña Zenaida. Por ${PRECIO} colones, una vez, le cuido la finca: cosecho, resiembro y guardo en el cofre. Hábleme si le sirve.» |
| 14 | economia.js:98 | D | 160 | «Saque ficha: es el número ${n}, vamos por el ${m}. Vuelva en un ratito.» |
| 15 | avioneta.js:49 | T | 148 | «✈ W acelera · S baja motor · mouse apunta · Shift se baja · ⛽ ${%}» (la guía completa, en la ayuda del vehículo) |
| 16 | nidos.js:72 | T | 148 | «🕸 ¡Nido partido! +${esencia} esencia, ₡${colones}${más ? ' · una Sombra menos por noche' : ''}» |
| 17 | satira.js:76 | T | 145 | «🧾 Inspector municipal: la soda no tiene permiso. Multa de ₡${multa}; cierra 2 min» |
| 18 | maestria.js:26 | T | 143 | «${icono} ${clase}: maestría ${n} (+${%} % daño)» |
| 19 | alas.js:18 | T | 142 | «🪶 A planear: mire abajo para velocidad, arriba para subir · Espacio cierra las alas» |
| 20 | rigo.js:126 | D | 140 | «Ay, mi maletín… ¡está todo! Tome 25 colones; su próxima póliza va por la casa. Venga en unos días.» |
| 21 | furtivos.js:107 | T | 139 | «📻 Denuncia al guardaparques del Sistema de Áreas de Conservación (ficticio): ₡30 de recompensa» |
| 22 | expediente.js:213 | D | 138 | «No vi nada. Aquí su recibo: «donación para el café». Se archiva. La gente también vio, ¿eh? Yo no.» |
| 23 | jefes2.js:204 | T | 138 | «🕯 Aquí no vive ningún jefe: cada uno tiene su lugar (selva, manglar, llanos, playa, montaña, cuevas)» |
| 24 | vehiculos.js:64 | T | 138 | «🚗 W/S acelera y frena · A/D gira · Espacio pita · Shift se baja · ⛽ ${%} · llantas ${n}/4» → en la ayuda; dejar «🚗 Shift se baja · ⛽ ${%}» |
| 25 | muneco.js:45 | T | 136 | «🎯 ${mat}: ${suma} de daño en ${seg} s (${dps}/s)» |
| 26 | concurso.js:78 | T | 135 | «🏆 ¡Ganó el concurso de gallo pinto! ₡20${primera ? ' y la Cuchara de Oro' : ''}» |
| 27 | rigo.js:145 | D | 134 | «Se le venció la póliza, mi cepa. Renovar son ${PRECIO_FINAL} colones. Hábleme para firmar.» |
| 28 | economia.js:29 | T | 132 | «📈 Feria: hoy ${cosecha} se paga a ${%} %» |
| 29 | incendio.js:98 | T | 132 | «🧯 ¡Apagado! ${n} de ${total} focos. La familia le da ₡25 y las gracias» |
| 30 | rigo.js:97 | D | 131 | «Firme aquí, aquí y aquí. No lea eso. ¡Bienvenida la gran familia asegurada! Si se muere, no se le cae nada.» |
| 31 | final.js:220 | T | 130 | «👑 La Corona pide lo más alto, con el cielo abierto: suba a una cumbre (altura ${y} de 95)» |
| 32 | fuerza.js:32 | T | 130 | «💪 +${v} corazón y +${a} aguante por ${min} min» |
| 33 | goleta.js:226 | T | 130 | «🏴 ¡La goleta se hunde! El cofre del capitán flota: ₡120, oro, perlas, diamantes y su farol» |
| 34 | plaga.js:31 | T | 127 | «🦗 ¡Chapulines en la siembra! Espántelos: golpes al aire, humo o gallinas» |
| 35 | satira.js:59 | D | 127 | «¡Felicidades! Su permiso de funcionamiento. Póngalo a la vista; se renueva cada año… o cuando nos acordemos.» |
| 36 | torneo.js:36 | T | 127 | «🎣 ${pez}: ${kg} kg${record ? ' · ¡récord!' : ''} · Total ${total} kg» |
| 37 | compas.js:45 | T | 126 | «🤝 ${nombre} lo acompaña un día · clic derecho: carga · Shift+clic: espera» |
| 38 | vehiculos2.js:46 | T | 126 | «${icono} Shift se baja · W acelera · S frena» (resto, a la ayuda) |
| 39 | leyendas2.js:110 | T | 124 | «✋ La Mano Peluda se llevó ${nombre} ×${n} en la noche (quedó tirado cerca)» |
| 40 | minaoro.js:174 | T | 124 | «⛏ Don Eliseo sube despacito hacia la luz. Le deja su lámpara de carburo y ₡50» |
| 41 | nidos.js:55 | T | 124 | «🕸 Un nido de Sombra crece en el monte (🕸 en la brújula): mientras viva, peores noches» |
| 42 | pezvela.js:78 | T | 123 | «📸 ¡Pez vela de dos metros! Foto, y de vuelta al mar. Le queda de recuerdo» |
| 43 | clasico.js:48 | T | 122 | «📻 Min ${n}: «${narración}»» → eliminar (ver ruido #4) |
| 44 | lunaroja.js:62 | T | 122 | «🌅 Se fue la luna roja: ${m} de ${t} Sombras; sin botín (faltó cerca del 60 %)» |
| 45 | tsunami.js:144 | T | 121 | «📻 Comisión Nacional de Sustos (ficticia): «Ya pasó. Revise la casa»» |
| 46 | sacos.js:111 | T | 119 | «🥔 Ganó ${nombre}. Usted quedó ${lugar}.º: ¡a practicar brincos!» |
| 47 | pezvela.js:53 | T | 118 | «🎣 ¡Picó un pez vela! Recoja con clic derecho: espere si corre, recoja si salta» |
| 48 | monte.js:102 | T | 116 | «🤒 Fiebre de zancudo: sin regenerar y sin fuerza. Suero, botiquín o dormir la quitan» |
| 49 | incendio.js:57 | T | 115 | «🔥 ¡Se quema una casa! Apáguela a baldazos (balde con agua, clic derecho)» |
| 50 | asedio.js:110 | T | 114 | «🌑 Esta noche las Sombras van a la casa de la abuela: prepare defensas» |
| 51 | gente.js:155 | T | 113 | «${icono} ${nombre} manda a decir: si hay una cama de sobra, se viene a vivir» |
| 52 | reliquias.js:105 | T | 113 | «📦 ¡${Nombre} de Zenaida! La carta dice dónde sigue: brújula» |
| 53 | surf.js:48 | T | 113 | «🏄 W rema hacia donde mira · reme a la playa al venir la ola · Shift se baja» |
| 54 | cielo2.js:23 | T | 112 | «🌕🩸 ¡Luna roja! Más leyendas, Sombras por oleadas y doble experiencia» |
| 55 | fauna.js:447 | T | 112 | «☠ Herida podrida: tope de ${n} corazones. Suero antiofídico o guaco» |
| 56 | fauna3.js:52 | T | 112 | «🦝 Un mapache se llevó ${item} ×${n} de la mochila (péguele y lo suelta)» |
| 57 | rifa.js:25 | T | 112 | «📻 Salió el ${numero}, serie ${serie}. Sus ${n} fracciones: ni la terminación» |
| 58 | bravos.js:480 | T | 111 | «🐍 ¡Coral de verdad! Rojo con amarillo: sin fuerza en las piernas. Suero o guaco» |
| 59 | rifa.js:14 | T | 111 | «📻 Radio Marimba: ya se cantó la Rifa: ${numero}, serie ${serie}» |
| 60 | yunque.js:45 | T | 111 | «🔨 ${item} ${estrellas}: ${qué mejora}» |
| 61 | abigeato.js:35 | T | 110 | «🐄 ¡Se llevan una vaca! Unos Chatas la jalan: alcance al del mecate» |
| 62 | expediente.js:37 | D | 110 | «¿Perdió la hoja? Es una falta. Tome otra: las firmas ya constan en autos.» |
| 63 | game.js:2688 | T | 110 | «📒 Se pasó el plazo del fiado: en la pulpería ya consta como moroso» |
| 64 | goleta.js:124 | T | 110 | «🏴 Entre la neblina sale una goleta vieja, de faroles verdes… ¡y viene hacia usted!» |
| 65 | recompensas.js:26 | T | 109 | «📜 Pegaron un «Se busca»: ${texto}. Paga ₡${premio}» |
| 66 | mascotas.js:63 | T | 107 | «🦥 ¡El perezoso se colgó de su mochila! Da calma (Shift+clic derecho lo baja)» |
| 67 | supervivencia3.js:116 | T | 107 | «🥱 Dos noches sin dormir: más lento y vista borrosa. Cama o café» |
| 68 | terremoto.js:74 | T | 107 | «📻 Comisión Nacional de Sustos (ficticia): «Esperen réplicas; no se metan a la grieta»» |
| 69 | aros.js:30 | T | 106 | «🏁 ¡8 aros en el cielo! Pase en orden (el amarillo sigue), en avioneta o parapente» |
| 70 | carrera.js:69 | T | 106 | «🐂 Carrera de carretas a la orilla del pueblo: la del medio es suya (clic derecho)» |
| 71 | clasico.js:38 | T | 106 | «📻 Radio Marimba: ¡arrancó el clásico! ${A} contra ${B}» |
| 72 | peon.js:88 | D | 106 | «Lo maduro lo cosecho y lo guardo en el cofre. Llevo ${n} matas.» |
| 73 | quema.js:162 | T | 106 | «🚒 Apagada. La brigada le manda ₡${paga}. Quemado: ${m2}» |
| 74 | rigo.js:131 | D | 105 | «Olvide el maletín: apareció en el carro. Venga en unos días.» |
| 75 | aire.js:65 | T | 104 | «🪂 Parapente abierto · Shift baja rápido · clic derecho lo cierra» |
| 76 | historia.js:364 | D | 103 | «Todavía no, mi amor: sin pechera de hierro no respondo por usted. Hierro, horno y mesa.» |
| 77 | influencer.js:108 | T | 103 | «🔥 ¡Viral! El influencer le paga ₡25 «por la colaboración»» |
| 78 | turistas.js:35 | T | 103 | «📸 ¡Llegaron a ${lugar}! ₡${pago} y ${propina} de propina. «Thank you, pura vida!»» |
| 79 | leyendas.js:329 | T | 102 | «🧙 ¡El Duende le robó ${n} × ${item}! Péguele y lo suelta» |
| 80 | plaga.js:82 | T | 102 | «🦗 Se fueron los chapulines: se comieron ${n} mata${s}» |
| 81 | playa2.js:44 | T | 102 | «🌊 ¡Resaca! No nade contra ella: nade paralelo a la playa» |
| 82 | supervivencia2.js:88 | T | 102 | «🔥 La fogata calienta y espanta zancudos. Con carne o pescado crudo en la mano: clic derecho» |
| 83 | bichos2.js:76 | T | 101 | «🥓 Piquete tapado con chicharrón: espere a que el gusano salga» |
| 84 | playa2.js:106 | T | 101 | «🐟 Una raya salió nadando. En agua bajita se camina arrastrando los pies» |
| 85 | corazon.js:93 | T | 100 | «🌋 Oleada ${n}: ₡${paga}${esencia}. Un respiro…» |
| 86 | quema.js:167 | T | 100 | «🎒 Con la tercera, la brigada le da una bomba de espalda» |
| 87 | reliquias.js:82 | T | 100 | «📦 Doña Eulalia: Zenaida guardó cosas por todo el país. Brújula al primer escondite» |
| 88 | tsunami.js:67 | T | 100 | «🌊 ¡El mar se recoge: tsunami! Suba a lo alto, YA» |
| 89 | tsunami.js:154 | T | 100 | (mismo texto que #88: unificar en una constante) |
| 90 | clasico.js:46 | T | 99 | «📻 ¡GOOOL del ${eq}! ${A} ${a}, ${B} ${b}» |
| 91 | bravos.js:433 | T | 98 | «🐆 Un puma no le quita los ojos: no le dé la espalda» |
| 92 | concurso.js:55 | T | 98 | «🍳 Concurso de gallo pinto en la plaza: lleve uno y déselo al jurado» |
| 93 | historia.js:363 | D | 98 | «Ahí sí. Esto me lo dejó Zenaida para este día, y la aguja de su mamá.» |
| 94 | mar2.js:140 | T | 98 | «🦈 Nada junto a un tiburón ballena: el pez más grande del mar, solo come plancton» |
| 95 | panga.js:92 | T | 98 | «🚤 Varó una panga: Don Macario vende pesca (clic derecho, ₡6 por tres)» |
| 96 | perezosocalle.js:32 | T | 98 | «🦥 Un perezoso cruza la carretera: clic derecho lo lleva a un árbol» |
| 97 | playa2.js:112 | T | 98 | «🐟 ¡Pisó una raya! En agua bajita, camine arrastrando los pies» |
| 98 | prima.js:62 | D | 98 | «No me mire así: lo cargué a la cuenta de un cliente. Póngaselo, y si se muere vendo la casa.» |
| 99 | buhonero.js:50 | T | 97 | «🛒 Don Carlos llegó con la carretilla: compra cosecha y vende lo difícil» |
| 100 | cintas.js:38 | T | 97 | «🎀 Arco listo: pase por debajo a caballo, alineado con una cinta» |
| 101 | globo.js:35 | T | 97 | «🎈 Don Fito prende el quemador: el viento decide adónde vamos» |
| 102 | arena.js:146 | T | 96 | «🏆 ¡${n} oleadas! ${premio} colones, un diamante y la Copa del reto» |
| 103 | compas.js:99 | T | 96 | «🤝 Terminó el día de ${nombre}${devolvió ? ': le devolvió lo que cargaba' : ''}» |
| 104 | fauna.js:621 | T | 96 | «🚫 Cazar tepezcuintle está prohibido: multa de ₡${n}» |
| 105 | game.js:2814 | T | 96 | «🤢 Estaba crudo: dolor de panza. La sopa negra o la leche lo cura» |
| 106 | carrera.js:109 | T | 95 | «🏆 ¡Ganó la carrera en ${t} s! ₡30» |
| 107 | combate.js:81 | T | 95 | «Barrida: W y ${tecla}» |
| 108 | correo.js:71 | T | 95 | «✉ Carta sin sello, con la letra de Don Chema: ya está en la libreta» |
| 109 | game.js:1042 | T | 95 | «Marco de calcita (2 de ancho, 3 de alto) y toque con una pluma de quetzal» |
| 110 | marabunta.js:44 | T | 95 | «🐜 Se oye crujir hojas: viene una marabunta (🐜 en la brújula)» |
| 111 | bichos2.js:51 | T | 94 | «🐜 ¡Hormiga bala! Dolor largo: no corre y pega más suave» |
| 112 | satira.js:56 | D | 94 | «Ya salió su permiso: ₡20 del timbre. ¿No los tiene? Vuelva cuando los tenga.» |
| 113 | arribada.js:64 | T | 93 | «🐢 ¡ARRIBADA! Cientos de tortugas lora desovan: no las toque» |
| 114 | defensa.js:16 | T | 93 | «🍲 Olla: ${n}/${max} de carbón. Clic derecho con carbón» |
| 115 | elecciones.js:121 | T | 93 | «🗳 Ganó ${candidato} (${sigla}) con ${%} %» |
| 116 | extras10.js:35 | T | 93 | «🐸 Rana de vidrio: se le ve el corazón latiendo. No la toque mucho» |
| 117 | minaoro.js:102 | T | 93 | «⛏ Rieles viejos salen del monte: la mina de oro de Abangares, abandonada desde el 31» |
| 118 | perezosocalle.js:66 | T | 93 | «🦥 Lo mira despacito desde la rama. Calma rara… (Calma, 3 min)» |
| 119 | vivienda.js:31 | T | 93 | «📜 Ya tenía un lote en ${x}, ${z}: este lo reemplaza» |
| 120 | bailarin.js:30 | T | 92 | «🎩 Un forastero muy elegante saca a bailar a todo el mundo en la plaza» |
| 121 | bichos3.js:174 | T | 92 | «🪲 De frente aguanta el caparazón: hágalo chocar con un árbol, o por el lado» |
| 122 | corazon.js:59 | T | 92 | «🌋 ${razón}: ${n} oleada${s}${récord}» |
| 123 | economia.js:80 | T | 92 | «🍽 ¡Cliente en la soda! Vea qué pide (globito) y sírvale con clic derecho» |
| 124 | procesion.js:55 | T | 92 | «🕯 La última ánima le dejó su vela en la mano y se deshizo. Gracias por acompañar» |
| 125 | elecciones.js:52 | T | 91 | «🗳 Hoy son las elecciones municipales: vaya al pueblo y vote (clic derecho)» |
| 126 | leyendas.js:157 | T | 91 | «✝ El báculo le sacó el aire. Solo agua bendita (pulpería) le hace daño» |
| 127 | procesion.js:66 | T | 91 | «🕯 Se apagaron todas las velas de un solo… algo se mueve en lo oscuro» |
| 128 | toros.js:72 | T | 91 | «🐂 ¡Toros a la tica! Al redondel de improvisado: aguante 30 segundos» |
| 129 | vida2.js:85 | T | 91 | «🪧 Bloqueo (ficticio): el barrio pide arreglar los huecos. Pase por el ladito» |

**Notas del recorte:** (a) las **instrucciones de teclas de vehículos** (#15, 24, 38, 53, 75) no son avisos: deben ir a la hoja de ayuda de cada vehículo y al subtítulo permanente de la primera vez; (b) los **diálogos** largos de Rigo, Expediente y Cumple son escenas: conviene partirlos en 2 globos de `decir` (≤ 110 caracteres) en vez de reducirlos mucho; (c) las **frases con «Comisión Nacional de Sustos» y «Sistema de Áreas de Conservación»** mantienen el «(ficticia)» que marca la sátira contra instituciones ficticias.

---

## 5. Textos que se escriben directo al DOM (se saltan las funciones comunes)

Creados o actualizados con `createElement`/`innerHTML`/`textContent` fuera de `ui.js`. Son los que el locutor no puede ordenar sin cambiarlos.

| Archivo:línea | Qué escribe | Dónde | Observación |
|---|---|---|---|
| `armas3.js:165` (`avisoGolpe`) | «¡Parry!/¡Crítico!/…» sobre el enemigo | Nodo `.num-dano.aviso-golpe` | Sin tope ni cola |
| `armas3.js:216-219` | Pips del combo | `#combo-pips` | Visual, no texto |
| `bingo.js:46-122` | Pantalla completa del bingo y cada canto | `#bingo` | Modal propio |
| `comodidad.js:101-105` | Lo que se mira (`#mirando`) | `#mirando` | Permanente, fuera de cola |
| `comodidad.js:128-137` | Receta fijada | `#receta-fija` | Permanente |
| `comodidad.js:151` | Día y hora | `#reloj` | Permanente |
| `epilogo.js:28-32` | Texto del final, línea por línea | `#prologo.epilogo` | Pantalla completa |
| `ermitas.js:61-64` | Pregunta «¿A cuál ermita va?» | Modal | Modal propio |
| `final.js:181-183` | Créditos y «Seguir jugando» | `#creditos-final` | Pantalla completa |
| `foto.js:122-126` | Título de video | `#titulo-video` | 16 toasts más en modo foto |
| `foto.js:75-81` | Descarga y destello | `a`, `.flash-foto` | — |
| `fuerza.js:67-75` | Íconos de comidas con fuerza | `#fuerza` | Gráfico |
| `game.js:1770` | Consejo de muerte + aviso del némesis | `#death-tip` | Se junta con `deathTip()` |
| `indicadores.js:9-42` | Durabilidad y meta | `#ind-dur`, `#ind-meta` | Cambia con animación propia |
| `influencer.js:118-119` | Vistas del influencer | `#vistas` | Permanente |
| `jefes3.js:276-277` | Título del jefe | `#jefe-titulo` | 4.2 s, **sin cola**: puede chocar con `regionBanner` |
| `permiso.js:24-26` | Trámite | `#tramite` | Permanente |
| `pezvela.js:35-113` | «¡Está corriendo! / ¡Saltó!» | `#vela-barra` | Texto con mensajes de acción |
| `prologo.js:5-7` | Carta inicial | `#prologo` | Pantalla completa |
| `teclas.js:46-70` | Lista de teclas | Ajustes | UI, no pasajero |
| `tiro.js:74-76` | Puntaje de tiro | `#tiro` | Permanente |
| `torneo.js:45-48` | Tabla del torneo | `#torneo` | Permanente |
| `toros.js:166-238` | «Aguante X / 8 s» | `#monta-*` | Barra de monta |
| `bravos.js:546` | Velo (sin texto) | `div` | Visual |
| `cielo2.js:10`, `mar2.js:108` | Capas de color | `.cielo-capa` | Visual |

**Dentro de `ui.js`** también escriben directo (aceptable, es la capa común): `#pause-info`, `#death-cause`, `#death-tip`, `#click-hint`, `#loading-tip`, `#shop-*`, `#map-scale`.

**Lo que el «locutor» debería absorber primero:** `toast`, `regionBanner`, `dialog` (ya pasan por `ui.js`), `achieve` → `achievement` y `registroObjeto`. Lo que debería **dejar pasar** (no es aviso): HUD permanente (`#mirando`, `#reloj`, `#receta-fija`, `#objetivo`, `#mision-hud`, `#ind-*`), globos de vecinos en el mundo y los modales de pantalla completa.

---

## 6. Sugerencia de mapa de categorías (para la constructora)

| Categoría | Qué entra | Duración | Se interrumpe | Se descarta si hay cola |
|---|---|---|---|---|
| **urgente** | Daño inminente: asedio, tsunami, incendio, puma, veneno, sangrado, «se rompió la herramienta», errores de guardado | 2.5–3 s | A cualquiera | Nunca |
| **importante** | Inicio/fin de evento y jefe, capítulo, nivel, logros grandes, plata gastada | 3–4 s | A consejo y ambiente | Se pasa a registro |
| **consejo** | `tickConsejos`, «primera vez» de cada mecánica, instrucciones de vehículos | 4–5 s | Se pospone si hay U/I | Se descarta (máx. 1 en cola) |
| **ambiente** | Radio, sanatorio, hongo, partido, comentarios de pueblo | 2–3 s | Se pospone y caduca a los 20 s | Se descarta |
| **registro** | `+7 Madera`, logros pequeños, guardado, cambios de modo | sin tarjeta (línea en `#recogidos` o diario) | No interrumpe | Se funde |

Reglas que arreglan los 15 peores de golpe: **(1)** tope de 1 aviso largo cada 4 s; **(2)** una ráfaga se funde en un aviso (comer, inicio de evento); **(3)** el prefijo de 8 letras se cambia por una clave explícita (`clave`) para no pisar por accidente; **(4)** el tope de globos de vecinos y de números de daño; **(5)** pausar la cola mientras haya un menú, mapa o diálogo abierto.
