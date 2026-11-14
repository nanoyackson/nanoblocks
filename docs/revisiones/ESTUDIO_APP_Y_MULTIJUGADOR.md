# Estudio: app instalable y multijugador

Última actualización del juego, según el pedido. Las cifras del juego salen de leer el código y medir (`grep`, `du`, ejecutar `blocks.js`); las del ecosistema (Tauri, Electron, SmartScreen, Cloudflare) se **verificaron en la web hoy**, con el enlace en cada caso. Lo que no se pudo verificar va marcado «por probar». Solo lectura: no se construyó nada.

**Datos de partida del juego** (medidos):
- Vite 6 + three 0.170, `base: './'`, sin backend. `dist/` pesa **21 MB**, de los cuales ~17 MB son sonidos y íconos de `public/` y ~3 MB de JavaScript (los trozos más grandes: `index` 644 kB, `trama` 600 kB, `criaturas` 553 kB, `three` 517 kB, `lodworker` 311 kB).
- Guardado: **IndexedDB** `nanoblocks` (`save.js`: almacenes `worlds` y `chunks`; solo se guardan los **cambios** de cada chunk, porque el terreno se regenera desde la semilla) y ajustes en **localStorage** (`SETTINGS_KEY`). Ya existe exportar/importar un mundo como `.nanoblocks.json` (`exportWorld`/`importWorld`, con `migrate()` por `SAVE_FORMAT`).
- Un solo hilo de juego (`main.js` con `requestAnimationFrame`) y un Web Worker para el terreno lejano (`lodworker.js`).

---

# Parte A: app descargable para pasarle a amistades (Windows primero)

## A.1 Las cuatro opciones

| | **PWA instalable** | **Tauri 2** | **Electron** | **Zip portable + servidor mínimo** |
|---|---|---|---|---|
| Qué es | La misma web, instalada desde Chrome/Edge con ícono y ventana propia | Cascarón nativo (Rust) que usa el WebView2 de Windows | Cascarón que **lleva su propio Chromium** | Carpeta con `dist/` + un `.exe`/`.bat` que sirve archivos en `localhost` y abre el navegador |
| Tamaño a repartir | ~21 MB (se baja al visitar; ya queda en caché) | Cascarón de pocos MB + 21 MB de juego. WebView2: modo `downloadBootstrapper` (+0 MB, lo baja al instalar), `embedBootstrapper` (+~1.8 MB), `offlineInstaller` (+~127 MB) | Cascarón con Chromium: del orden de ~100 MB de más (**no verificado**, medir) | 21 MB + servidor (~1–40 MB según cómo se empaquete) |
| Esfuerzo | **S** (1–2 días): `manifest.webmanifest`, service worker con precaché, íconos | **M** (3–5 días): proyecto Rust, ventana, íconos, firmar, CI | **M** (3–4 días): `main` de Electron, empaquetado (`electron-builder`) | **S–M** (1–2 días) |
| Instalación | 1 clic en «Instalar» (sin SmartScreen) | `.exe` NSIS o `.msi` | `.exe` | Descomprimir y ejecutar |
| SmartScreen | **No aplica** | Sí, para el instalador | Sí | Sí (el `.exe` baja con marca de la web) |
| Actualizaciones | **Automáticas** (el service worker baja la versión nueva) | `tauri-plugin-updater`, **siempre con firma** | `electron-updater`/Squirrel | A mano |
| Puntero bloqueado, audio | Igual que hoy (ya funciona) | WebView2 es Chromium: **debería** funcionar; **por probar** | Funciona (es Chromium completo) | Igual que hoy |

Fuentes: [Tauri: instalador de Windows (modos de WebView2, MSI/NSIS)](https://v2.tauri.app/distribute/windows-installer/), [Tauri: updater](https://v2.tauri.app/plugin/updater/), [Electron: versiones](https://releases.electronjs.org/) (la página lista 45.2.3 como estable a esta fecha; cada versión mayor trae un Chromium nuevo cada ~8 semanas).

## A.2 Guardados: dónde están y cómo migrarlos

- **Hoy:** IndexedDB y localStorage **atados al origen** (`https://sitio` o `http://localhost:5199`). Cada origen es un baúl distinto: el mundo de `localhost:5199` **no aparece** en la versión publicada ni en la app instalada. Eso es lo que más sorprende a la gente.
- **PWA:** usa el almacenamiento del navegador donde se instaló. Pedir `navigator.storage.persist()` al abrir (Chrome lo concede con más facilidad a una app instalada) evita que el navegador borre el mundo bajo presión de disco; sin eso, IndexedDB es «best effort». Fuente: [web.dev: persistent storage](https://web.dev/persistent-storage) y [web.dev: offline data](https://web.dev/learn/pwa/offline-data).
- **Tauri/Electron:** guardan en la carpeta de datos de usuario de la app. **Ojo:** el origen debe ser **estable** (`tauri://localhost`, o un protocolo propio en Electron): si cambia entre versiones, el mundo «desaparece».
- **Migrar:** ya existe el camino `.nanoblocks.json` (Exportar → Importar). Cambios recomendados antes de repartir:
  1. **«Respaldo completo»**: exportar *todos* los mundos más los ajustes en un solo archivo (hoy es por mundo).
  2. **Respaldo automático a disco** (PWA: File System Access API en Chrome/Edge; Tauri/Electron: ruta fija): una copia al salir.
  3. Importar sin renombrar a «(importado)» cuando es el mismo `meta.id` y la versión es posterior (hoy siempre crea uno nuevo).
  4. Probar el peso de un mundo grande en JSON (los `mods` son pares `[índice, id]`: crece rápido; comprimir con `CompressionStream('gzip')`, nativo).

## A.3 Firma y SmartScreen (importante para repartir `.exe`)

- Firmar **ya no compra confianza instantánea**: Microsoft dice que con Artifact Signing la reputación se construye por archivo con el tiempo, y para certificados EV tampoco hay salto inmediato desde 2024. Fuentes: [Microsoft: opciones de firma de código](https://learn.microsoft.com/en-us/windows/apps/package-and-deploy/code-signing-options), [Windows App Dev: Artifact Signing/SmartScreen (Q&A)](https://learn.microsoft.com/en-us/answers/questions/5855708/trusted-signing-regression-in-smartscreen-reputati).
- **Artifact Signing** (antes Trusted Signing) para personas individuales: **solo EE. UU. y Canadá**; para organizaciones, EE. UU., Canadá, UE y Reino Unido, según Microsoft. Desde Costa Rica, lo que queda es un certificado OV de una CA comercial. La fecha de apertura y los requisitos cambian: revisar la página de elegibilidad antes de contar con ello.
- **Lo práctico para amistades:** un instalador sin firmar mostrará «Windows protegió su PC». Se pasa con «Más información → Ejecutar de todas formas»: aceptable entre amistades, malo para un público amplio. La PWA evita el problema por completo.

## A.4 Recomendación (A)

1. **Primero la PWA** (S, 1–2 días): manifest + service worker (precaché de `dist/`) + `navigator.storage.persist()` + botón «Respaldo completo». Se publica en un hosting estático gratis. Las amistades abren un enlace, pulsan «Instalar» y tienen ícono, ventana propia, juego sin conexión, **actualizaciones solas** y sin SmartScreen. Es lo único que se actualiza sin que yo tenga que hacer nada.
2. **Después, solo si piden un `.exe`:** **Tauri 2 (NSIS)**, por el tamaño y porque WebView2 ya trae Chromium. Antes de comprometerse, **spike de 1 hora**: abrir el juego en un Tauri de prueba y comprobar pointer lock, audio, pantalla completa y que Esc se comporte como en Chrome. Si algo falla, **Electron** (mayor, pero es el mismo Chromium que se prueba hoy).
3. **Descartado:** el zip con servidor mínimo. Es lo más frágil (antivirus, puertos, la marca de la web sobre el `.exe`) y no gana nada sobre la PWA.

**Tamaño estimado de todo A.** PWA: S. Tauri: +M. Electron: +M. Firma y actualizaciones firmadas: +S (más el costo del certificado, **cotizar**).

---

# Parte B: multijugador cooperativo (2–6 personas)

## B.1 Qué tan lejos está el juego

**Lo que ayuda (la base es mejor de lo que parece):**
- **El mundo es determinista:** el terreno sale de `semilla + genVersion` (`Generator`), y lo guardado son solo los **cambios** de cada chunk (`World.mods`: `Map<chunkKey, Map<índice, id>>`). Unirse a un mundo ajeno = generar igual en local y recibir los `mods` (unos pocos kB a cientos de kB). No hay que enviar terreno.
- **`World.setBlock` es el único embudo** de cambios de bloques (152 llamadas, todas pasan por él) y ya avisa con `onBlockChange(x, y, z, old, id)`: ahí se engancha la replicación.
- **El golpe del jugador ya es «latente»** (`golpePend` → `asestar`, v11.3): se decide al llegar el arma, no al hacer clic: encaja con «mandar al anfitrión una petición de golpe».
- **`Avatar`** (el jugador en tercera persona) ya dibuja un cuerpo completo con armadura y poses: sirve tal cual para mostrar a los demás.
- Los cerebros de las criaturas reciben el jugador **por contexto** (`kind.brain(m, dt, { g, pl, dxp, dzp, distP })`), no siempre por global: generalizable.

**Lo que complica (medido):**

| Medida | Valor |
|---|---|
| Referencias a `g.player` / `game.player` / `this.player` | **1139**, en **189 archivos** |
| Referencias a `.meta` (estado único de partida: historia, misiones, economía, cultivos…) | **1232**, en **162 archivos** |
| Referencias a `.inventory` | 395 |
| `Math.random()` en lógica de juego | **1961** |
| Llamadas a `ui.toast`/`ui.dialog` desde la simulación | **967** |
| Recorridos de `entities.mobs` | 136 |
| `g.riding` (vehículos y monturas) | 87 |
| Tamaño de los núcleos | `game.js` 3366 líneas, `world.js` 544, `entities.js` 1105, `player.js` 234 |

**Conclusión: está lejos de un modelo anfitrión-autoritativo «de verdad».** El juego es un monolito de un solo jugador: la simulación, el estado de partida y la interfaz están mezclados, y casi todo asume `g.player`. Pero **sí** se puede llegar a un cooperativo **anfitrión-autoritativo en el navegador** (el anfitrión corre el juego completo; los demás son clientes que muestran y piden cosas) sin reescribir los 189 archivos, si se hace en este orden: **primero el mundo y la gente (fácil), después las criaturas (difícil), al final el estado de historia (muy difícil)**.

**Por qué el anfitrión tiene que ser un navegador, no un servidor.** Un servidor sin pantalla (Node) exigiría poder crear una `Mob` sin Three.js ni DOM, y hoy cada criatura construye su modelo 3D al nacer (`armar*` en `modelos-*.js`, `makeItemMesh`) y hasta 130+ módulos tocan `document` o la interfaz. Hacerlo «headless» es una reescritura. Con el anfitrión en el navegador de quien invita, **el juego existente corre como está** y solo se añade la capa de red.

## B.2 Transporte: WebRTC punto a punto frente a relé WebSocket

> **Actualización (nov-2026):** nanoyackson descartó Cloudflare Workers. La recomendación de relé de esta sección queda **reemplazada por B.8** (WebRTC punto a punto + Trystero/Nostr + STUN/TURN gratis, relé solo como último respaldo). El análisis de comparación de esta sección sigue valiendo.

| | **WebRTC (canal de datos, P2P)** | **Relé WebSocket (Cloudflare Worker + Durable Object, o un Node pequeño)** |
|---|---|---|
| Topología | Estrella: el anfitrión abre un canal con cada invitado (hasta 5) | Estrella: todos se conectan al relé; el relé reenvía al anfitrión |
| Señalización | Hace falta un buzón mínimo para el apretón de manos (código de sala) | El propio relé es la sala |
| NAT / casas con CGNAT | STUN funciona en la mayoría de casos; el resto **necesita TURN** (otro servicio). El STUN de Cloudflare es gratis; su TURN da 1000 GB/mes gratis y luego US$ 0.05/GB ([fuente](https://developers.cloudflare.com/realtime/turn/faq/)) | **Funciona siempre** (todo sale a 443) |
| Latencia | La mejor (directo) | +1 salto (decenas de ms): irrelevante para este juego |
| Tráfico/costo | 0 sin TURN | Mensajes salientes de WebSocket no se facturan; los entrantes cuentan por solicitud; usar la **API de hibernación**. Plan gratis con Durable Objects SQLite; **los límites numéricos varían según la fuente: verificar** ([Cloudflare: precios](https://developers.cloudflare.com/durable-objects/platform/pricing)) |
| Complejidad | Alta (ICE, reintentos, fallos de NAT) | **Baja** (un socket por jugador) |
| Alternativa sin servidor propio | [Trystero](https://github.com/dmotz/trystero): buzón sobre Nostr/BitTorrent/MQTT público: cero operación, pero depende de relés públicos de terceros | — |

**Recomendación (B, transporte): relé WebSocket.** Es lo más corto, lo más robusto y lo menos mágico: el anfitrión y cada invitado abren un WebSocket **saliente** (se evita todo NAT), el relé reenvía a la sala. Con 2–6 personas y mensajes pequeños, el costo es casi nulo. Dejar la capa de transporte detrás de una interfaz (`enviar(a, tipo, datos)`, `alRecibir`) para poder cambiar a WebRTC más tarde sin tocar el juego.

## B.3 Qué se sincroniza

| Dato | Quién manda | Frecuencia | Notas |
|---|---|---|---|
| Entrada al mundo | Anfitrión → invitado | 1 vez | `meta` (semilla, `genVersion`, día, hora, dificultad) + `mods` + `be` (el mismo formato que `exportWorld`) |
| Bloques (`setBlock`) | Quien edita → anfitrión → todos | Por evento | El anfitrión valida y reenvía con un contador; ordena por llegada |
| Jugadores (posición, mirada, pose, arma en mano, armadura) | Cada uno de los suyos | 10–20 Hz | Cada cliente es dueño de **su** movimiento (amistades, no competitivo): sin predicción ni reconciliación |
| Criaturas | **Anfitrión** | 5–10 Hz, solo las cercanas (≤ 64 bloques de algún jugador) | Clientes las ven como «títeres» interpolados |
| Objetos tirados | Anfitrión | Por evento + snapshot cercano | Recogida: petición al anfitrión (el primero gana) |
| Tiempo, día, clima, relámpagos | Anfitrión | 1 Hz (+ eventos) | Hoy cada cliente tiene su `Weather` aleatorio: pasa a ser pasivo |
| Inventarios y vida | **Cada jugador** (local) | Al cambiar/guardar | El invitado guarda su personaje en **su** IndexedDB, con el `id` del mundo |
| Cofres, hornos, mesas (`be`) | Anfitrión | Al abrir/cerrar y por evento | Hoy no hay bloqueo: dos manos en el mismo cofre |
| Eventos con efecto (daño, sonido, partículas, avisos) | Anfitrión → afectado | Por evento | Hoy la simulación llama a `ui.toast` (967 sitios): necesita un canal «mostrar esto a X» |
| Chat y emotes | Todos | Por evento | Ya hay `ui.chat` |

## B.4 Los 20 puntos más duros (con archivo)

Ordenados por cuánto cuesta desatarlos.

1. **`game.js`, clase `Game`: `this.player`, `this.inventory`, `this.meta` como únicos.** 1139 + 395 + 1232 referencias. Estrategia: no tocarlas; el jugador local sigue siendo `g.player`, y los demás son entidades aparte (`g.remotos`), vistas solo por las partes nuevas.
2. **`entities.js`, `Mob.update`: el objetivo es siempre `g.player`** (`distP`, `dxp`, `dzp` se calculan una vez). Hay que pasar a `jugadorMasCercano(m)` y construir el contexto con él.
3. **Los cerebros de criaturas** (`bravos.js`, `leyendas.js`, `jefes2.js`, `jefes3.js`, `final.js`, `fauna.js`, `bichos*.js`, `monocongo.js`, `arpia.js`, `caverna.js`…, ~60 archivos): muchos usan `g.player.body.pos`, `g.damagePlayer(...)` y `g.player.body.vel` directo en vez del contexto. Hay que revisarlos uno por uno; empezar por `golpes.js` (`atacar` cubre casi todo el cuerpo a cuerpo).
4. **`game.js`, `damagePlayer(...)` y `combate.js`, `onPlayerHit`:** golpe, parry, esquive, aturdimiento, `g.iframes`, `g.blocking` son estado del jugador local. Necesitan un objetivo (`quién`) y una forma de ejecutar el golpe **en el cliente del afectado**.
5. **`entities.js`, `trySpawn`/`spawnT` y la descarga por distancia (> 96 bloques de `g.player`):** el nacimiento y borrado natural se miden desde un solo jugador. Debe ser la unión de todos.
6. **`world.js`, `update(px, pz)`:** carga y descarga de chunks centrada en un punto. El anfitrión necesita cargar los de **todos** los jugadores; los invitados solo los suyos.
7. **`world.js`, `neighborUpdates`, `scheduleFluid`, `fall`:** física de fluidos, arena y plantas se calcula donde se edita. Debe correr **solo en el anfitrión** y difundirse como `setBlock` (cuidado con las avalanchas de `FallingBlock`).
8. **`game.js`, cambio de dimensión (~línea 2077: `this.world = new World(...)`)**: hay un solo mundo activo (tierra, cielo, inframundo). Con varios jugadores, o todos viajan juntos o hay varios `World` vivos. **MVP: todos en la misma dimensión; portales deshabilitados o por votación.**
9. **`game.js`, `update(dt)`: `slowmo`, `hitStop`, `muerte`, `camaraLenta` escalan el `dt` global** (líneas ~2453–2458). En multijugador la cámara lenta de uno no puede congelar a los demás.
10. **`game.js`, `paused`:** el menú y el inventario pausan el mundo. No se puede pausar con otros jugando; el menú pasa a ser una capa sobre el juego vivo.
11. **`meta` mezcla mundo y personaje:** `historia.js`, `hogar.js`, `misiones.js`, `expediente.js`, `anselmo.js`, `cuaderno.js`, `economia.js`… guardan en `meta.hist`, `meta.fiado`, `meta.cuaderno`, etc. Hay que dividir en **`meta.mundo`** (casa, cultivos, nidos, eventos del día) y **`meta.jugador[id]`** (historia, ruta, habilidades, mañas, logros, diario).
12. **`save.js`/`game.js`, guardado:** un solo `meta` por mundo. Anfitrión: mundo; cada invitado: su personaje en su dispositivo, atado al `meta.id`.
13. **`ui.js` y las 967 llamadas `g.ui.*` dentro de la simulación:** la lógica «habla» con la pantalla. Se necesita `avisar(jugadorId, tipo, texto)` y que el anfitrión lo mande al jugador correcto. **El «locutor» central (Encargo 3) es el primer paso natural.**
14. **`stations.js` (cofres, hornos, mesas, `be`) y `world.getBE/setBE`:** sin cerrojo; el horno avanza en el cliente que lo tiene cargado. Anfitrión como dueño, y «abrir» como petición.
15. **`entities.js`, `ItemDrop` y recogida (`g.inventory.add`):** la recogida es local y el objeto se borra. Con varios, el objeto es del anfitrión y la recogida es una petición.
16. **`game.js`, `killedMob`, `achieve`, XP, habilidades, maestría:** al caer una criatura el crédito va al jugador local. Hace falta quién pegó (`g.golpeando` ya existe como pista).
17. **Vehículos y monturas (`g.riding`, 87 usos: `mar.js` bote, `vehiculos*.js`, `avioneta.js`, `bus.js`, `tren.js`):** un solo conductor; y el pasajero hereda posición. Con varios, quién conduce manda; los demás son pasajeros.
18. **Minijuegos y eventos globales (`clasico.js`, `bingo.js`, `torneo.js`, `asedio.js`, `lunaroja.js`, `corazon.js`, `arena.js`, `tsunami.js`):** estado en `g.xxx` y `meta`, con texto y cámara locales. Primer corte: solo el anfitrión los inicia y los demás los ven; los que dependen de la cámara o del jugador se desactivan en red.
19. **`Weather` (`weather.js`) y `Sky`:** el clima es aleatorio por cliente (`Math.random()`) y cae alrededor de la cámara. Debe ser pasivo: el anfitrión manda tipo/intensidad/relámpagos.
20. **Dormir y escenas (`game.js`, `lieDown`, `sleepFade`; `g.cine`, `g.foto`, la muerte):** saltar la noche cambia `g.time`. En red, solo si todos duermen (o la mayoría) y las escenas son del cliente.

(Aparte, **fácil**: `audio.js` y las partículas son locales y no necesitan red salvo para eventos ajenos; `lodworker.js` y el terreno lejano son de cada cliente.)

## B.5 Plan por fases

Tamaños: S ≈ 2–3 días · M ≈ 1–2 semanas · L ≈ 2–4 semanas (trabajo concentrado de una persona con esta base de código).

| Fase | Entrega | Tamaño | Riesgo principal |
|---|---|---|---|
| **0. Costuras** | Registro `g.remotos`; `jugadorMasCercano()`; interfaz de transporte (`enviar`/`alRecibir`); bus de avisos por jugador (el «locutor» del Encargo 3); número de protocolo = `GAME_VERSION`; mensajes con esquema | **S–M** | Ninguno; no cambia lo jugable |
| **1. «Visitar y construir» (MVP real)** | Relé + salas con código; unirse = semilla + `mods` + `be`; **ediciones de bloques**; **jugadores visibles** (`Avatar`, nombre, arma) con interpolación; **hora y clima** del anfitrión; chat. Invitados en modo **sin Sombras ni criaturas hostiles** al principio, sin daño | **M** | Orden de ediciones; chunks ya cambiados al unirse; tope de tamaño de `mods` |
| **2. Criaturas y combate** | Criaturas **del anfitrión** como títeres interpolados en los clientes; nacimiento y descarga por unión de jugadores; `golpes.js` y `damagePlayer` con objetivo; peticiones de golpe; objetos tirados y recogida; muerte y reaparición por jugador; crédito de bajas | **L** | El mayor riesgo del proyecto: ~60 cerebros que asumen `g.player` (punto 3); equilibrio con 2–3 jugadores (`tools/bot-pelea.js` sirve de base) |
| **3. Estaciones y mundo vivo** | Cofres/hornos como entidades del anfitrión con «abrir» por petición; fluidos y arena solo en el anfitrión; cultivos; vehículos con conductor | **M–L** | Avalanchas; dos manos en el mismo cofre |
| **4. Historia y economía por jugador** | Separar `meta.mundo` y `meta.jugador[id]`; guardado por personaje; reconexión | **L** | Es la parte más invasiva (162 archivos tocan `meta`); admitir que la campaña sea del anfitrión y los invitados «ayudan» |

## B.6 Camino más corto a «jugar con dos amigos»

**Fases 0 + 1, más una versión mínima de la 2 (solo criaturas básicas):** unas **4 a 6 semanas** de trabajo concentrado, y se puede **cortar en cualquier punto estable**:

1. **A las ~2 semanas (fases 0 + 1):** «mundo compartido»: tres personas construyendo juntas, viéndose, con el mismo día y clima, chat y sin peligros. **Ya se puede jugar con dos amigos** a construir y explorar.
2. **A las ~5 semanas (+ criaturas mínimas):** las criaturas **hostiles generales** (las que pasan por `atacar()`, ~15 tipos) pegan al jugador más cercano; los **jefes y leyendas** quedan **solo para el anfitrión** (los invitados ven y ayudan); la historia sigue siendo del anfitrión.
3. **Lo que se deja fuera a propósito:** portales y dimensiones, minijuegos de cámara, vehículos con varios pasajeros, campaña por jugador.

**Por qué este orden:** es lo único que da algo jugable **pronto** y reversible: si en la semana 2 resulta que a las amistades les basta construir juntas, no hace falta la fase 2. Y todo lo que se construye (transporte, avatares remotos, avisos por jugador) **sirve** para lo siguiente.

## B.7 Riesgos y decisiones a tomar

- **Versión del juego:** todos deben tener la misma `GAME_VERSION` (la PWA con actualización automática ayuda a esto; en red, rechazar al que no coincida).
- **Anfitrión que se va:** sin servidor autoritativo, si el anfitrión cierra el juego se acaba la sala. Aceptable entre amistades; guardar al salir (ya existe).
- **Trampas:** no importa entre amistades; confiar en el cliente para su movimiento y su inventario.
- **Costo de mantener:** cada sistema nuevo del juego debe preguntarse «¿es del mundo o del jugador?». Anotarlo en `ARBOL_CONOCIMIENTO.md`.
- **Decisión de nanoyackson:** (a) ¿la campaña de la abuela es solo del anfitrión?, (b) ¿quién gana el botín: el que pega o todos?, (c) ¿se permite el fuego amigo?, (d) ¿portales: se mueven todos o se votan?
- **Si no se quiere asumir nada de esto:** la **PWA (Parte A)** ya permite jugar «lado a lado» sin red; el multijugador no es necesario para repartir el juego.

---

## Resumen de recomendaciones

1. **App (A):** **PWA primero** (S), **Tauri 2** solo si piden `.exe` (M; spike de 1 hora para confirmar pointer lock), **Electron** si Tauri falla; descartar el zip. Firma desde Costa Rica: OV comercial; el instalador sin firmar da aviso de SmartScreen.
2. **Multijugador (B):** **anfitrión en el navegador; transporte según B.8 (WebRTC + Trystero + TURN gratis; relé solo de respaldo)**; fases 0 y 1 en ~2 semanas dan **construir juntos**; con criaturas básicas, ~5 semanas dan **jugar con dos amigos**; historia y minijuegos quedan para el anfitrión.
3. **Hosting y guardado (B.9, B.10):** página en Cloudflare Pages por carga directa (puente) y GitHub Pages al publicar el repo, sin Actions; fijar la dirección definitiva antes de invitar gente; identidad por llave y ficha por jugador en el mundo del anfitrión, con operaciones atómicas.
4. **Preparar ya** (útil aunque no se haga nada de red): el **locutor** central (avisos por jugador), separar en `meta` lo del mundo y lo del jugador en lo nuevo que se agregue, y pasar `jugadorMasCercano()` en los cerebros nuevos en lugar de `g.player`.

**Fuentes:** [Tauri: Windows Installer](https://v2.tauri.app/distribute/windows-installer/) · [Tauri: Updater](https://v2.tauri.app/plugin/updater/) · [Electron: Releases](https://releases.electronjs.org/) · [Microsoft: Code signing options](https://learn.microsoft.com/en-us/windows/apps/package-and-deploy/code-signing-options) · [Microsoft Q&A: Artifact Signing y SmartScreen](https://learn.microsoft.com/en-us/answers/questions/5855708/trusted-signing-regression-in-smartscreen-reputati) · [Cloudflare: Durable Objects pricing](https://developers.cloudflare.com/durable-objects/platform/pricing) · [Cloudflare: TURN FAQ/precios](https://developers.cloudflare.com/realtime/turn/faq/) · [Trystero](https://github.com/dmotz/trystero) · [web.dev: persistent storage](https://web.dev/persistent-storage) · [web.dev: offline data](https://web.dev/learn/pwa/offline-data) · [MDN: Pointer Lock API](https://developer.mozilla.org/en-US/docs/Web/API/Pointer_Lock_API).

---

## B.8 Sin Workers: multijugador gratis para 2 a 6 amigos con un código

nanoyackson descartó Cloudflare Workers + Durable Objects. Esta sección compara las alternativas **gratis y vigentes a noviembre de 2026**, con los límites verificados en la web (enlace en cada caso). Lo que solo aparece en blogs de terceros o en páginas de la competencia va marcado «**no oficial**»; lo que no se encontró, «**sin dato**». Esto **reemplaza** la recomendación de B.2 («relé WebSocket en Cloudflare»); el resto de B (anfitrión en el navegador, fases, puntos duros) no cambia.

### B.8.0 El tráfico de la prueba: 3 jugadores, 3 horas al día

Se parte de B.3 y se pone en números (mensajes **binarios** en lote, no JSON):

| Flujo | Cálculo | Resultado |
|---|---|---|
| Pose de cada jugador | 24 B × 15 Hz | 0.36 kB/s |
| Criaturas cercanas (≈ 40) del anfitrión a cada invitado | 40 × 20 B × 8 Hz | 6.4 kB/s |
| Objetos tirados + ediciones de bloques + hora y clima | ≈ 1 + 0.3 + 0.05 kB/s | 1.4 kB/s |
| **Anfitrión → cada invitado** (incluye la pose del otro invitado) | 0.72 + 6.4 + 1.4 | **≈ 8.5 kB/s (≈ 70 kbps)** |
| **Invitado → anfitrión** | pose + acciones | ≈ 0.5 kB/s |
| **Subida del anfitrión** con 2 invitados | 2 × 8.5 | **≈ 17 kB/s (≈ 140 kbps)** |
| Mensajes por segundo (un lote por cliente y tic) | 2 × 10 Hz + 2 × 15 Hz | **≈ 50 msg/s** |

**Por 3 horas al día × 30 días (10 800 s/día):**
- **Por un relé** (todo pasa por él): entra ≈ 18 kB/s y sale ≈ 18 kB/s → ≈ 195 MB/día por sentido → **≈ 5.8 GB/mes de entrada y 5.8 GB/mes de salida** (≈ 7.5 GB/mes con encabezados y TLS).
- **Mensajes:** 50 msg/s × 10 800 s ≈ **540 000 por día** (≈ 16 millones al mes por sentido).
- **Seis jugadores** (peor caso): subida del anfitrión ≈ 42 kB/s (≈ 340 kbps): cabe en cualquier fibra; en datos móviles con poca subida puede apretar.
- **Por TURN** (solo quien no conecta directo): cada invitado relayado mueve ≈ 9 kB/s ≈ **97 MB/día ≈ 2.9 GB/mes**.

### B.8.1 WebRTC punto a punto (el tráfico del juego no pasa por ningún servidor)

El anfitrión abre un canal de datos con cada invitado. Un servidor solo sirve para **presentarlos** (señalización), una vez por sala.

**Señalización:**

| Opción | Límites y estado vigentes | ¿Aguanta? |
|---|---|---|
| **Trystero** (salas por código) | Por defecto usa la red **Nostr** (muchos relés públicos); ofrece también MQTT, BitTorrent, IPFS y las administradas Supabase y Firebase. Un resumen del repositorio las ordena por robustez: Nostr, MQTT, BitTorrent, IPFS; un tema del proyecto reporta **problemas con los trackers públicos de BitTorrent** y que los públicos **no garantizan disponibilidad**. Se puede alojar el propio relé. Fuentes: [README de Trystero](https://cdn.jsdelivr.net/npm/trystero@0.25.4/README.md), [resumen del repositorio](https://awesome.ecosyste.ms/projects/github.com%2Fdmotz%2Ftrystero), [tema sobre trackers](https://githaven.org/Shiloh/remnantchat/issues/2). | **Sí**: solo unos kB al crear la sala. Más estable hoy: Nostr. **Sin dato** de disponibilidad medida |
| **Servidor gratis de PeerJS** (`0.peerjs.com`) | Gratis, por donaciones, **sin SLA**, **sin TURN**; recomiendan alojar el propio para producción. Reportes sueltos (**no oficiales**) de demoras y caídas. Fuentes: [peerjs.com/server/cloud](https://peerjs.com/server/cloud), [comparación 2026](https://dev.to/alakkadshaw/peerjs-alternatives-in-2026-free-turn-auto-reconnect-and-which-webrtc-library-to-actually-pick-14ad). | Aguanta el tráfico, pero **la menor confianza** |
| **Buzón propio mínimo** (script que guarda ofertas y respuestas por código; sondeo cada 1–2 s) | Sin límites propios. Sirve en el **hosting de Hostinger que nanoyackson ya paga** (PHP o Node con peticiones cortas; límite 120 s por petición; ver B.8.4). | **Sí**, el más controlable; ~60 líneas |

**STUN gratis:** el de Cloudflare (`stun.cloudflare.com`) es **gratis e ilimitado** ([fuente](https://developers.cloudflare.com/realtime/turn/faq/)); el de Google (`stun.l.google.com:19302`) es de uso gratuito sin garantías (**no oficial**). Son bytes por conexión.

**TURN gratis (para CGNAT o NAT simétrico):**

| Opción | Límite vigente | ¿Aguanta? |
|---|---|---|
| **Open Relay (Metered)** | **20 GB/mes gratis** según su página oficial (entradas viejas dicen 50 GB: **desactualizadas**); pide cuenta gratis y clave de API. Fuentes: [Open Relay](https://metered.ca/tools/openrelay/), [Metered STUN/TURN](https://metered.ca/stun-turn). | **Sí**: todos relayados ≈ 5.8 GB/mes; un invitado ≈ 2.9 GB/mes. Margen 3.4–7× |
| **Cloudflare Realtime TURN** | **1000 GB/mes gratis**, luego US$ 0.05/GB. No es Workers, pero **las credenciales cortas requieren una llamada autenticada a la API** (hoy la haría un Worker; sin él, otro servidor). Fuente: [Cloudflare TURN FAQ](https://developers.cloudflare.com/realtime/turn/faq/). | Sobra en cuota; la complicación son las credenciales → reserva |

**¿Cuánta gente necesitaría TURN en Costa Rica? Sin dato propio.**
- No se halló cifra de CGNAT por operador (Tigo, Liberty, Kolbi, Claro) ni de IPv6 residencial reciente; lo último es un estudio de 2020 que mide **operadores**, no hogares. Fuente: [MICITT, 2020](https://micitt.go.cr/sites/default/files/publicaciones/estudio/estado_de_adopcion_de_ipv6_en_costa_rica_a_marzo_2020.pdf).
- A nivel mundial se citan **10–25 %** de sesiones WebRTC que necesitan relé (cifras de proveedores, **no oficiales**). Fuente: [resumen de cifras](https://www.forasoft.com/learn/video-streaming/articles-streaming/nat-stun-turn-ice-webrtc).
- **Suposición de trabajo:** 10–20 % de invitados en casa y más en datos móviles; con 2 invitados, ≈ **20–35 %** de que alguno necesite TURN. Por eso TURN es el **seguro**, no un extra.

### B.8.2 Relé WebSocket propio en un plan gratis

| Servicio | Límites vigentes | ¿WebSocket? ¿Se duerme? | ¿Aguanta 3 × 3 h? |
|---|---|---|---|
| **Render (web service gratis)** | Se apaga tras **15 min sin tráfico entrante**; **desde el 24-feb-2026 los mensajes de WebSocket de conexiones abiertas también lo mantienen despierto**. Despertar ≈ **1 min**. Cuota exacta de horas/ancho de banda **no confirmada**. Fuentes: [novedad de Render](https://render.com/changelog/free-web-services-now-remain-active-while-receiving-websocket-messages), [Render: gratis](https://render.com/docs/free). | Acepta WebSocket | **Probable** (≈ 90 h/mes, 7.5 GB/mes); el primero espera ≈ 1 min; **verificar cuota de ancho de banda** |
| **Koyeb** | El **FAQ oficial pide tarjeta**; un blog **no oficial** dice que escala a cero tras 1 h sin uso y que un WebSocket abierto lo mantiene; cambios de dueño (**no oficial**). Fuentes: [Koyeb: precios](https://www.koyeb.com/docs/faqs/pricing), [guía de terceros](https://dev.to/snapdeploy/free-backend-hosting-7-platforms-that-wont-kill-your-api-2026-1i1g). | Sin confirmar en docs oficiales | Con tarjeta y detalles **por confirmar**: no lo usaría |
| **Railway** | **Prueba única de US$ 5** y luego **US$ 1/mes** de crédito. Fuente: [Railway](https://docs.railway.com/pricing/free-trial). | Sí | **No** sostiene un proceso encendido |
| **Fly.io** | **Sin asignación gratis para clientes nuevos**. Fuente: [Fly.io](https://fly.io/docs/about/discontinued-plans/). | — | **No** |
| **Glitch** | **Cerró el alojamiento el 8-jul-2025.** Fuente: [Glitch](https://blog.glitch.com/post/goodbye-glitch). | — | **No existe** |
| **Google Cloud e2-micro «siempre gratis»** | Tarjeta; **1 GB/mes de salida a Norteamérica** (**no oficial**). Nuestra salida ≈ 5.8 GB/mes: **se pasa y cobra**. | Sí | **No sin pagar** |
| **Mensajería administrada** | **Supabase Realtime gratis:** 200 conexiones y **100 msg/s**; 50 msg/s con 2 receptores rozan el tope ([límites](https://supabase.com/docs/guides/realtime/limits)); cuota mensual **por confirmar**. **Ably** (**no oficial**): 6 M msg/mes. **Pusher Sandbox** (**no oficial**): 200 000 msg/día. | Sí | Nuestros ≈ 540 000 msg/día **exceden** Ably y Pusher; Supabase queda justo. Solo servirían bajando a ≈ 5 Hz |
| **Deno Deploy** | **Sin dato**. | — | — |

### B.8.3 Una VM «siempre gratis» (Oracle Cloud y similares)

- **Oracle Cloud Always Free:** VM sin plazo, pero **pide registrar tarjeta** (**no oficial**), la **reclamación de instancias ociosas** puede borrarla (ventana de **7 días** con CPU/red/memoria bajo un umbral de 10–20 %, **no oficial**) y hay **reportes de recortes en 2026** (p. ej. Ampere A1, **no confirmado**). Fuentes: [recursos Always Free](https://docs.oracle.com/en-us/iaas/Content/FreeTier/resourceref.htm), [reglas de reclamación](https://oracommit.blogspot.com/2026/02/understanding-oci-always-free-compute.html).
- **Esfuerzo alto:** Node, servidor WebSocket, TLS (Caddy/Let's Encrypt), dominio, puertos y mantenimiento.
- **Riesgo:** cierre de cuenta o máquina, sin soporte.
- **Veredicto:** el tráfico cabe, pero **no es «sin complicaciones»**; respaldo secundario.

### B.8.4 Hostinger (hosting compartido)

- **El hosting de Node.js no acepta WebSocket entrantes:** cada petición se corta a los **120 s** y **no hay WebSocket entrante ni procesos en segundo plano**. Fuentes: [Node.js en Hostinger](https://docs.hostinger.com/node.js/overview), [¿sockets?](https://www.hostinger.com/support/?p=1364).
- **No sirve como relé del juego.** Un **VPS** de Hostinger sí, pero **es de pago**.
- **Lo que sí hace, dentro de lo que ya paga:** (1) **alojar el juego** (archivos estáticos/PWA de la Parte A); (2) **el buzón de señalización** de B.8.1 por sondeo corto (< 120 s por petición), con unos kB por sala.

### B.8.5 El anfitrión como servidor y relé desde su compu

El anfitrión ya es autoritativo (B.1), pero **un navegador no puede escuchar conexiones entrantes** y su casa probablemente no es alcanzable desde afuera (CGNAT, router).

| Pieza | Qué haría falta | Estado y límites |
|---|---|---|
| **Programa auxiliar** que escuche (un `relay.js` de Node, o la app Tauri/Electron de la Parte A con servidor adentro) | Que el anfitrión lo ejecute | Los amigos no lo necesitan |
| **Túnel** | **Cloudflare Quick Tunnel** (`cloudflared`, sin cuenta): 200 peticiones en vuelo, **sin SSE**, «para pruebas», **la dirección cambia cada vez**; **WebSocket no confirmado**. Fuentes: [Quick Tunnels](https://developers.cloudflare.com/tunnel/get-started/quick-tunnels/), [guía de terceros](https://flaviocopes.com/cloudflare-quick-tunnels/). **playit.gg** (túneles para juegos, **no oficial**). **Tailscale Personal:** 6 usuarios según fuentes de 2026 (otras dicen 3; **no oficial**), pero **todos deben instalarlo**: rompe el «solo con un código». ZeroTier: **datos en conflicto**. Fuentes: [Tailscale 2026](https://www.activepieces.com/blog/tailscale-pricing-plans-costs-and-features-2026), [ZeroTier](https://docs.zerotier.com/pricing). | Funciona, pero **suma otro programa y otro punto de falla** |

**Conclusión:** viable pero **lo más complicado** y con límites gratis poco claros; **no es el camino principal**. Cobra sentido dentro de la app instalable (Tauri/Electron).

### B.8.6 Resumen: ¿qué aguanta 3 jugadores × 3 horas?

| Opción | Tráfico por el servidor | ¿Aguanta? | Complicación | Confiabilidad |
|---|---|---|---|---|
| WebRTC + Trystero (Nostr) + STUN | ≈ 0 (solo señal) | **Sí** | Baja | Media |
| WebRTC + PeerJS Cloud | ≈ 0 | Sí | Baja | **Baja** |
| WebRTC + buzón propio (Hostinger) | ≈ 0 | **Sí** | Media-baja | **Alta** |
| + TURN Open Relay (20 GB/mes) | 2.9–5.8 GB/mes si todos usan TURN | **Sí** (margen 3.4–7×) | Baja | Media-alta |
| Relé WebSocket en Render gratis | 7.5 GB/mes | **Probable** (cuota sin confirmar) | Media | Media (1 min de arranque) |
| Koyeb / Railway / Fly.io / Glitch / GCP | — | **No** | — | — |
| Supabase / Ably / Pusher | 100 msg/s / 16 M al mes / 540 000 al día | **Al límite o no** | Baja | Media |
| Oracle Always Free | 7.5 GB/mes | Sí | **Alta** | Media (puede cerrarla) |
| Hostinger Node.js como relé | — | **No** (sin WebSocket entrante) | — | — |
| Anfitrión + túnel | ≈ 0 | Sí (≈ 140 kbps de subida) | **Alta** | Baja-media |

### B.8.7 Recomendación única

**WebRTC punto a punto con el anfitrión autoritativo: Trystero sobre Nostr para las salas con código, STUN gratis (Cloudflare o Google) y TURN de Open Relay (20 GB/mes) como seguro para quien esté detrás de CGNAT.**

Por qué es la más gratis, robusta y sencilla:
1. **Cero servidores propios y cero costo:** el tráfico del juego (≈ 8.5 kB/s por invitado) viaja directo; el servidor solo presenta a los jugadores (unos kB) y Trystero ya trae salas con código y canales de datos.
2. **Límites holgados:** TURN para todos los invitados a la vez usaría ≈ 5.8 GB/mes de 20 GB.
3. **Una sola pieza de código** detrás de la interfaz `enviar`/`alRecibir` de B.2, intercambiable sin tocar el resto.
4. **Hostinger se usa para lo que sí hace bien:** alojar el juego.

**Respaldo cuando falle la conexión directa (en orden):**
1. **TURN de Open Relay** (ya dentro de la configuración ICE): la conexión pasa por su relé sin que el jugador note nada; resuelve NAT/CGNAT.
2. **Si falla la señalización pública** (relés de Nostr caídos): cambiar de estrategia de Trystero (MQTT) o usar el **buzón propio en Hostinger** (~60 líneas, sondeo corto).
3. **Si una red bloquea WebRTC por completo** (raro): un **relé WebSocket mínimo (~40 líneas) en Render gratis**, que se despierta al crear la sala (≈ 1 min de espera) y se mantiene despierto con el tráfico. Único caso en que el tráfico del juego pasa por un servidor.

**Costo total: US$ 0** (cuenta gratis de Open Relay), sin Workers. **Riesgos a asumir:** relés públicos de Nostr sin SLA (mitigado por el buzón propio); la cuota de Open Relay depende de su política (hoy 20 GB/mes); y la fracción de invitados que necesita TURN en Costa Rica **no tiene dato**: conviene **medirla** con las primeras salas (registrar el tipo de candidato ICE ganador: `host`, `srflx` o `relay`).

**Fuentes verificadas hoy:** [Open Relay](https://metered.ca/tools/openrelay/) · [Cloudflare TURN FAQ](https://developers.cloudflare.com/realtime/turn/faq/) · [Trystero](https://cdn.jsdelivr.net/npm/trystero@0.25.4/README.md) · [PeerJS Cloud](https://peerjs.com/server/cloud) · [Render](https://render.com/changelog/free-web-services-now-remain-active-while-receiving-websocket-messages) · [Koyeb](https://www.koyeb.com/docs/faqs/pricing) · [Railway](https://docs.railway.com/pricing/free-trial) · [Fly.io](https://fly.io/docs/about/discontinued-plans/) · [Glitch](https://blog.glitch.com/post/goodbye-glitch) · [Oracle](https://docs.oracle.com/en-us/iaas/Content/FreeTier/resourceref.htm) · [Supabase](https://supabase.com/docs/guides/realtime/limits) · [Hostinger Node.js](https://docs.hostinger.com/node.js/overview) · [Hostinger sockets](https://www.hostinger.com/support/?p=1364) · [Quick Tunnels](https://developers.cloudflare.com/tunnel/get-started/quick-tunnels/) · [MICITT 2020](https://micitt.go.cr/sites/default/files/publicaciones/estudio/estado_de_adopcion_de_ipv6_en_costa_rica_a_marzo_2020.pdf).

---

## B.9 Dónde vive la página (PWA en Chrome) y cómo se actualiza

**Requisito de nanoyackson:** el juego sigue en Chrome, como PWA instalable, en una página gratis. El código va a un GitHub **público** solo al final y hasta entonces no se gastan GitHub Actions.

**Estado actual del repo (verificado):** `vite.config.js` usa `base: './'` (sirve en cualquier subcarpeta), pero **no hay manifiesto ni service worker** todavía (`grep` de `manifest`/`serviceWorker` solo halla el `manifest.json` de sonidos). La PWA de la Parte A está por hacer.

### B.9.1 Opciones gratis, sin Actions

| Opción | Límites vigentes | Sin Actions | Veredicto |
|---|---|---|---|
| **GitHub Pages** (publicar desde rama y carpeta, p. ej. rama `pages` o carpeta `/docs`) | Sitio publicado ≤ **1 GB**; tráfico **blando de 100 GB/mes**; **10 compilaciones por hora** (blando); Pages en repos **privados requiere plan de pago** (**por confirmar** en la página de planes). Fuente: [Límites de GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits). | **Sí**: «desplegar desde una rama» usa la compilación propia de GitHub, no un flujo de Actions escrito por nosotros (si ese flujo interno cuenta contra la cuota de Actions **no se confirmó**; en repos públicos Actions es gratis). | **Mejor destino final**, cuando el repo sea público |
| **Cloudflare Pages** (carga directa con `wrangler pages deploy dist`, sin repo conectado) | Plan gratis: **ancho de banda y peticiones estáticas ilimitados**, 500 compilaciones/mes (no se usan si se sube `dist` ya construido), 1 compilación a la vez. No es Workers. Fuente: [Límites de Cloudflare Pages](https://developers.cloudflare.com/pages/platform/limits). | **Sí** (la compilación se hace en tu propia compu) | **Mejor puente mientras el repo siga privado** |
| **Hostinger** (hosting compartido de pago) | Hosting estático sin tope práctico para este uso (ver B.8.4); **sin HTTPS no hay PWA ni service worker**, pero Hostinger entrega certificado. | Sí | Sirve, pero hay que subir archivos a mano |

**Recomendación:** **mientras el repo es privado**, publicar `dist/` en **Cloudflare Pages por carga directa** (un comando, cero Actions, cero costo, sin tope de tráfico). **Cuando el código se publique en GitHub**, pasar a **GitHub Pages desde la rama `pages`** (o carpeta `/docs`) con `dist/` ya construido y commiteado: sigue sin Actions y la dirección final queda atada al repo público. Mientras tanto Hostinger queda de segundo puesto.

### B.9.2 Cómo se actualiza el juego cuando entra un pull request

El pull request se **revisa y se funde en `main`** como siempre; la publicación es un paso aparte y **manual** (sin Actions):

1. Tras fundir el PR: `git pull` en `main` → `npm run lint` y `npm run build` (cero warnings, ya es la regla del proyecto).
2. Publicar `dist/`:
   - Hoy: `npx wrangler pages deploy dist` (Cloudflare Pages).
   - Al final: copiar `dist/` a la rama `pages` (o a `/docs`) y `git push`. Un script de unas líneas en `tools/` lo hace (**lo escribiría la constructora, no esta sesión**).
3. Los jugadores ya instalados reciben la nueva versión por el **service worker** (con `registerType: 'prompt'`: «hay versión nueva, recargar»; no recargar solo en medio de una partida).

**Lo que conviene decidir de antemano (si no, duele):**
- **Guardados por origen.** IndexedDB (`nanoblocks`) y localStorage viven **por dirección web**: cambiar de `*.pages.dev` a `*.github.io` **deja los mundos atrás**. Antes de tener amigos jugando, **fijar la dirección definitiva** (o usar un dominio propio en Hostinger apuntando a la página) y mientras tanto recordar a cada persona el botón de exportar mundo (`exportWorld` en `save.js`).
- **Versión del protocolo.** El anfitrión y los invitados deben ejecutar **la misma versión de red**: el apretón de manos envía `GAME_VERSION` y `PROTOCOL_VERSION`; si difieren, el invitado ve «recarga para actualizar» en lugar de entrar con una versión mezclada. Cambios en lo que se guarda siguen exigiendo subir `SAVE_FORMAT` + migración (regla del proyecto).
- **Caché.** Un service worker mal hecho deja a una persona con la versión vieja para siempre: versionar el caché por `GAME_VERSION` y probar la actualización con dos pestañas.
- **Límite de compilaciones.** 10/hora en GitHub Pages sobra para publicaciones manuales.

---

## B.10 Guardado por jugador: que nadie pierda ni duplique nada

**Requisito de nanoyackson:** el anfitrión tiene la partida entera y guarda todo. Un invitado que se va y vuelve recupera **exactamente** inventario, armadura, bolsos, vida, posición y progreso.

**Punto de partida (verificado en el código):** hoy el jugador y el inventario **viajan dentro del registro del mundo**: `meta.player = this.player.toJSON()` y `meta.inventory = this.inventory.toJSON()` (`game.js`, función de guardado, ≈ línea 464; `Inventory.toJSON()` = `{ slots, selected, armor }`). Los cambios de bloques van aparte, por chunk (`chunks` en `save.js`). Para multijugador hay que **sacar al jugador del `meta`** y guardarlo **por identidad**.

### B.10.1 Identidad estable por jugador

Sin cuentas ni servidor, la identidad es una **llave que el propio navegador genera**:

1. **Primera vez:** el navegador crea un par de llaves **ECDSA P-256** con WebCrypto (`crypto.subtle.generateKey`, **no exportable** por defecto) y lo guarda en IndexedDB (`identidad`). El **`jugadorId`** es el hash corto de la llave pública (p. ej. 16 caracteres base32). El nombre a mostrar es aparte y se puede cambiar.
2. **Al entrar a una sala**, el anfitrión manda un **reto aleatorio** y el invitado lo **firma**. Si el `jugadorId` ya existe en el mundo del anfitrión y la firma verifica, **es la misma persona**: se le carga su ficha. Si no existe, el anfitrión crea una ficha nueva (con el equipo inicial de un jugador nuevo).
3. **Anti-suplantación:** nadie puede entrar como otro jugador sin su llave (copiar el código de sala o el nombre no basta).
4. **Perdió el navegador o cambió de compu:** la llave se perdería. Solución: botón **«Respaldo de mi identidad»** que descarga un archivo (llave exportada, protegida con una frase) y **«Recuperar»**. **Alternativa más simple** si nanoyackson prefiere: el anfitrión puede **reasignar** una ficha existente a una llave nueva con un clic («esta es mi amiga Ana, dale la ficha de Ana»), porque la confianza entre amigos ya existe.
5. **Cero datos personales** viajan o se guardan: solo `jugadorId`, apodo y la ficha del juego.

### B.10.2 Qué se guarda por jugador (en el mundo del anfitrión)

Un almacén nuevo en IndexedDB `jugadores`, con clave `mundoId|jugadorId`:

```
{ k, world, jugadorId, nombre, llavePublica,
  inv: { slots, selected, armor, bolsos },   // mismo formato que Inventory.toJSON()
  vida, hambre, aire…,                        // estado vital
  pos: { x, y, z, yaw, pitch, dim },          // posición y dimensión
  cama: { x, y, z } | null,                   // punto de reaparición
  progreso: { logros, recetas, misiones… },   // lo que el juego ya guarda en meta.player
  rev,                                         // contador que sube en cada guardado
  ultimaVez }                                  // para limpieza y avisos
```

- El jugador del anfitrión es **una ficha más** (clave propia): así el anfitrión puede ser invitado en la partida de otro y viceversa.
- **El mundo conserva** bloques, criaturas, tiempo, clima y cofres. **Lo que pertenece a una persona** (inventario, armadura, bolsos, vida, posición) vive solo en su ficha. Hay que **repartir el contenido actual de `meta.player` / `meta.inventory`** en estas dos partes (**por confirmar** campo a campo qué es del mundo y qué del jugador; ver el punto de separación `meta` ya señalado en B.4).
- Una migración (`SAVE_FORMAT` + paso en `migrate`) mueve el `meta.player`/`meta.inventory` actuales a la ficha del anfitrión, sin romper mundos viejos.

### B.10.3 Cuándo se guarda

- **El anfitrión es la única copia autoritativa.** El invitado **no guarda nada propio como verdad**; solo puede conservar una copia de solo lectura para mostrar mientras se reconecta.
- **Guardado continuo:** cada ficha y los chunks modificados se escriben **cada ≈ 5 s si hay cambios** y **de inmediato** tras eventos críticos (entrega, intercambio, muerte, abrir/cerrar cofre, cierre de sesión de un invitado).
- **Una sola transacción de IndexedDB** abarca **todos los almacenes** afectados (`jugadores`, `chunks`, `mundo`): IndexedDB las hace atómicas, así que **nunca** queda «el objeto salió del cofre pero no entró al inventario».
- **Al irse un invitado:** el anfitrión hace un guardado inmediato de su ficha y marca `ultimaVez`. **La ficha se queda en el mundo**; el cuerpo desaparece del juego.
- **Al volver:** reto firmado → ficha → **el anfitrión manda el estado completo** y el invitado reaparece **en su `pos`** (si el sitio ahora es un bloque sólido, se sube al primer hueco libre) con su `inv`, `vida` y `progreso` idénticos.

### B.10.4 Si el anfitrión cierra en medio

- **Cierre limpio** (`visibilitychange`/`pagehide`): guardado final y mensaje «el anfitrión se fue»; los invitados quedan en **sala de espera** (sin mover ni usar el inventario).
- **Cierre brusco** (cierra la pestaña, se va la luz, se cae el internet): se pierde **como mucho lo de los últimos ≈ 5 s** (los eventos críticos ya se habían guardado). **No se duplica nada**, porque lo guardado en la última transacción es coherente.
- Al abrir de nuevo, el anfitrión **reanuda el mundo y reconoce a cada jugador por su llave**; los invitados vuelven con el código (o la misma dirección) y reciben su ficha.
- **No hay «anfitrión de reemplazo»** (migración de anfitrión) en el primer ciclo: sin servidor, la partida **vive donde está guardada**. Cualquiera que reciba una copia del mundo (`exportWorld`) podría anfitrionar, pero **entonces las fichas de esa copia son las que valen** (no se mezclan dos líneas de tiempo). Para detectar copias cruzadas, el mundo lleva un **`epoca`** (número que sube cada vez que se importa/duplica) y un invitado con otra época recibe «este mundo no es el mismo que visitaste».

### B.10.5 Cómo se evita duplicar o perder objetos

**Regla de oro:** **un objeto nunca se copia, solo se mueve**, y **todo movimiento lo ejecuta el anfitrión** en una sola función síncrona (JavaScript es de un solo hilo: dos peticiones no pueden mezclarse a la mitad). El invitado **no cambia su inventario**: envía **intenciones** y el anfitrión responde con el resultado.

1. **Intenciones con comprobación («compara y cambia»).** «Mover 1 pico del hueco 3 del cofre C al hueco 7 de mi inventario» lleva el contenido **esperado** de cada hueco. Si no coincide (otro jugador ya lo sacó), el anfitrión **rechaza** y devuelve el estado real. Esto resuelve **dos personas tomando lo mismo del mismo cofre**: gana la primera petición, la otra recibe «ya no está».
2. **Identificador de operación (`opId`).** Cada intención lleva un número único; el anfitrión recuerda los últimos `opId` por jugador y **ignora repetidos**. Si el mensaje se reenvía por una caída de la conexión, **no se ejecuta dos veces**.
3. **Objetos tirados al suelo («entregas en vuelo»).** Cada objeto suelto tiene un **`id` único del mundo**. **Recogerlo** = en un solo paso, el anfitrión **borra la entidad y suma al inventario**. Si dos jugadores lo tocan a la vez, la **primera intención gana** y la segunda no encuentra el `id`.
4. **Dar un objeto a un amigo (entrega directa).** Dos pasos dentro de **una misma función del anfitrión**: sacar del emisor y meter en el receptor. Si el receptor tiene el inventario lleno, **no se saca** (o se deja caer a sus pies como objeto suelto con su `id`). Nunca hay un estado en el que «ya salió pero aún no llegó».
5. **Cofres compartidos.** Un cofre **abierto por varios a la vez** funciona con la regla 1 (compara y cambia) y el anfitrión **reparte las actualizaciones** a quienes lo tienen abierto. Si un jugador **se desconecta con el cofre abierto**, el cofre **no cambia**: lo que no se confirmó no se aplicó.
6. **Intercambio (trueque) entre dos jugadores.** **Confirmación en dos fases** coordinada por el anfitrión: ambos proponen y **ambos** aceptan; solo entonces el anfitrión **valida que ambos siguen teniendo lo ofrecido y que hay espacio** y ejecuta **el intercambio completo en un solo paso**. Si **alguien se desconecta antes de aceptar**, **todo se cancela** y cada quien conserva lo suyo. Si se desconecta **después** de aceptar, el paso ya se ejecutó entero (se guarda de inmediato). **No hay un punto intermedio.**
7. **Muerte y desconexión.** Al morir se deja caer lo que dicte la regla del juego, **como objetos sueltos con `id`**; al desconectarse un jugador **no se cae nada** (queda guardado en su ficha).
8. **Invariante comprobable.** Una herramienta de prueba (en `tools/`, **para la constructora**) **cuenta cada tipo de objeto** del mundo (fichas + cofres + objetos sueltos + criaturas que llevan cosas) **antes y después** de cada escenario (desconexión a mitad, doble clic, reenvío, cierre del anfitrión) y exige **la misma suma**. Un fallo de conteo es un bug de duplicación o pérdida.
9. **Qué NO se debe hacer:** que el invitado calcule su inventario y se lo cuente al anfitrión (permite **hacer trampa y duplicar**); guardar por ficha **sin transacción** común con el cofre; usar el nombre como identidad.

### B.10.6 Casos de borde y lo que queda por decidir

| Caso | Comportamiento propuesto |
|---|---|
| Dos pestañas con la misma llave | La segunda **desplaza** a la primera («ya estás conectado en otra ventana») |
| El invitado vuelve y su sitio ya tiene un edificio | Sube al primer hueco libre encima, o a su cama |
| Se borra una ficha o se expulsa a alguien | El anfitrión puede **archivar** la ficha (se conserva para volver a darla) |
| Anfitrión importa un mundo que ya tenía fichas | Las fichas viajan con el mundo (en `exportWorld` hay que **incluir `jugadores`**) |
| Inventario del anfitrión y partida en solitario | Es la misma ficha: **solitario y anfitrión comparten formato** |
| Por decidir (nanoyackson): si el invitado puede **conservar una copia de seguridad** de su ficha (firmada por el anfitrión) para restaurarla si al anfitrión se le pierde el mundo | Sube la confianza, pero **abre la puerta a duplicar** si se restaura sobre un mundo que siguió; **recomiendo no hacerlo** en el primer ciclo |

**Costo de implementar el guardado por jugador:** unos 3 a 5 días dentro de la fase 1 de B.5 (separar `meta.player`/`meta.inventory`, almacén `jugadores`, identidad y retos), más 2 a 3 días de la herramienta de invariantes y los escenarios de desconexión. **Es un requisito de diseño de la fase 1, no un extra de la fase 4**: si se hace al final, hay que reescribir cómo se guardan los inventarios.
