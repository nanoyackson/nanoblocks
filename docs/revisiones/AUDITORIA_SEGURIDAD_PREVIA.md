# Preauditoría de seguridad antes de abrir el GitHub público (encargo 23)

Solo lectura: no toqué git (ni commits, ni ramas, ni reescrituras) ni código. Revisé el repositorio local en `master`: **442 commits**, una sola rama y ningún remoto configurado (no hay nada publicado todavía), y `HEAD` ≈ v12.4.0.
**Qué corrí:** `git log --all -p` completo (14.7 MB de texto) con barridos de patrones; `git rev-list --objects` para blobs grandes; búsqueda de cada sumidero HTML y de código dinámico en `src/`; lectura de `save.js`, `diario.js`, `libreta.js` y otros; `npm audit --omit=dev` (con red) y `npm ls`; los manifiestos de licencias.
**Qué NO corrí:** `gitleaks` ni `trufflehog` (no están instalados; hay que correrlos sobre el repositorio ya limpio, ver el último punto de los críticos). Tampoco el juego ni un archivo malicioso real: lo marcado «por confirmar» se debe probar.

## Resumen en una mirada

| Área | Estado |
|---|---|
| Secretos, llaves y tokens en el historial | **Ninguno encontrado** (sin `.env`, claves, URLs con credenciales ni archivos binarios sospechosos) |
| Datos personales | **Sí hay**: correo personal en los 442 commits, una ruta con el usuario de Windows, la marca «nanoyackson» |
| XSS | Un camino real (partida importada → `diario`), por lo demás todo escapado o con `textContent` |
| Importar partidas | Funciona y limpia dos campos; **sin tope de tamaño ni validación de esquema** |
| Dependencias | `npm audit`: **0 vulnerabilidades**. Solo `three` va al navegador (MIT) |
| Licencias | Falta `LICENSE` propia y el aviso de `three`; arte generado con IA sin cláusula |
| Publicación | Rutas absolutas `/ui/...` que se rompen en una subruta de GitHub Pages |

---

## CRÍTICOS (resolver antes de hacer público)

### C1. El correo personal de nanoyackson está en los 442 commits (y el trailer de Claude también)
- **Dónde:** `git log --all --format='%an|%ae|%cn|%ce'` devuelve una sola identidad, `nanoyackson|<correo-personal>`, como autor **y** como committer en los 442 commits. Los 442 llevan además `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>` (el trailer no es un dato personal; decidir si se deja).
- **Por qué importa:** publicar el historial entrega el correo a cualquiera, para spam y suplantación, y queda en forks y cachés aunque después se borre. Ver también el hallazgo H2 de `docs/revisiones/PROXIMAS_TANDAS.md`.
- **Arreglo (no lo ejecuté):** trabajar en un **clon nuevo**, nunca en este repositorio.
  1. Archivo `mailmap.txt` con una línea: `nanoyackson <ID+usuario@users.noreply.github.com> <<correo-personal>>` (el correo `noreply` sale en Settings → Emails de GitHub).
  2. `git clone --no-local <este repo> limpio && cd limpio && git filter-repo --mailmap ../mailmap.txt` (reescribe autor y committer).
  3. Si se quiere quitar el trailer: `git filter-repo --message-callback 'return message.replace(b"\nCo-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>", b"")'`.
  4. Verificar: `git log --all --format='%ae %ce' | sort -u` debe dar solo el `noreply`.
  5. Antes del primer push, en GitHub activar «Keep my email addresses private» y «Block command line pushes that expose my email», y fijar `git config user.email` al `noreply` en las dos laptops.
- **Alternativa más simple si no importa el historial:** publicar un repositorio nuevo con un único commit inicial (`git checkout --orphan`) y guardar este como privado. Pierde el historial, pero elimina de raíz C1, C2 y los restos de abajo.
- **Importante:** las reescrituras cambian todos los hashes; los tags (`v11.x`, `v12.x`) se reescriben con `filter-repo` pero hay que revisarlos. Nunca subir el repositorio viejo a ningún remoto.

### C2. Ruta personal y datos de trabajo interno en el historial
Búsqueda: `git log --all -S'<ruta-personal>'` y `-S'<correo-personal>'`.

| Dato | Archivo | Commits |
|---|---|---|
| `<ruta-personal>` | `docs/PROMPT_SIGUIENTE_SESION.md:2` | `a247973` («docs: prompt para seguir en otra sesión», lo introduce) y `4943032` (v11.10.2); el archivo tiene 9 revisiones |
| La misma ruta y el correo, escritos en el texto del informe | `docs/revisiones/PROXIMAS_TANDAS.md:136–139` (H2, H3, H5) | el commit que lo agregó, en `HEAD` |
| «nanoyackson» como nombre en 20+ documentos (`CHANGELOG.md` 28 veces, `COLA_DE_TRABAJO.md` 17, `PLAN_MAESTRO_*`) | docs | muchos |

- **Cliente:** una ruta personal revela el modelo de trabajo y datos de un cliente.
- **Arreglo:**
  1. Sacar de **todo** el historial `docs/PROMPT_SIGUIENTE_SESION.md` (es un mensaje interno para otra sesión): `git filter-repo --path docs/PROMPT_SIGUIENTE_SESION.md --invert-paths`.
  2. Para `docs/revisiones/` (23 archivos versionados: planes, revisiones, pedidos de arte, listas internas) decidir si se publican; si no, `--path docs/revisiones --invert-paths`. Si se publican, pasar `--replace-text` con `regex:<ruta-de-usuario>\[^\n`]*==>[ruta local]` y el correo `==>[correo]`.
  3. Revisar también los 75 archivos de `docs/capturas/` (capturas de pantalla): confirmar a ojo que no muestran el escritorio, el nombre de usuario ni la barra de pestañas. Lo dejo **por confirmar**; no los abrí.
  4. Decidir si «nanoyackson» como nombre del autor es público (en el juego solo aparece «nanoyackson», ver H5 del informe anterior).

### C3. XSS por una partida importada: `meta.diario[].i` sin escapar
- **Archivo:línea:** `diario.js:35` (`<i>${e.i}</i>`, `diarioHTML`) y `ui.js:1221` (`body.innerHTML = aColones(libretaHTML(...))`, que lo inserta como HTML).
- **Qué pasa:** `importWorld` (`save.js:156`) toma `payload.meta` **entero** del archivo, así que `meta.diario` puede traer `{"d":1,"i":"<img src=x onerror=...>","t":"x"}`. Todo lo demás de la libreta sí pasa por `esc()` (`libreta.js:15`, `bestiario.js:104`, `cuaderno.js:57`, `historia.js:267`, y `e.t` en el mismo `diario.js`), pero el icono `i` no.
- **Reproducir (por confirmar):** exportar un mundo, editar el JSON agregando ese texto al diario, importarlo y abrir la libreta (pestaña Diario). Si salta el `onerror`, está confirmado.
- **Daño:** ejecuta JavaScript en el origen del juego: puede leer y escribir todos los mundos de IndexedDB y `localStorage`, y, en GitHub Pages, comparte origen con todos los demás proyectos del mismo usuario en `usuario.github.io`. En un juego que se intercambia por archivo, o más adelante por multijugador, es el vector más realista.
- **Arreglo:** `esc(e.i)` (y mirar los otros lugares que insertan campos de `meta` sin escapar: ver la tabla de sumideros, filas marcadas «por confirmar»). Además, validar el esquema al importar (C4) para que ningún texto llegue sin pasar por una función de limpieza.

### C4. `importWorld` confía en todo lo que trae el archivo
- **Archivo:línea:** `save.js:156–173` (`importWorld`), `ui.js:325` (el botón que lo llama).
- **Qué hay hoy (bien):** comprueba `app === GAME_NAME`, genera un `id` nuevo, quita `<`, `>` y caracteres de control del **nombre del mundo** y de los **rótulos de cofre**, y acorta a 40 y 32. JSON malicioso con `__proto__`: `JSON.parse` lo crea como una propiedad normal y `{...payload.meta}` la copia como propiedad, **no** cambia el prototipo; no encontré ningún `Object.assign`/merge profundo de `meta` que lo active (`Object.assign` en `game.js:474` y otros usan objetos propios).
- **Qué falta:**
  1. **Sin tope de tamaño:** `file.text()` + `JSON.parse` de un archivo de GB congela o tumba la pestaña. Poner `if (file.size > 64 * 2**20) throw` antes de leerlo.
  2. **Sin validación de tipos:** `meta` se guarda tal cual. Un `meta.spawn` o `player` con `NaN`/`null`/cadenas, un `inventory.slots` con ids que no existen o cantidades de 1e9, `seed` que no es texto o es gigante, `format` mayor al actual (la migración lanza error, bien) o menor y con campos raros. Hay que hacer una lista blanca de campos conocidos con tipos y rangos.
  3. **Bloques fuera de rango:** `chunks` guarda los ids de bloque sin comprobar. Un id que no está en `BLOCKS` probablemente rompe el mallador y las tablas (`BLOCKS[id].render` sobre `undefined`); es un cierre del juego con ese mundo (por confirmar). Validar `id < BLOCKS.length`, claves `"cx,cz"` en rango y un máximo de entradas por chunk.
  4. **Entidades de bloque (`be`):** solo se limpia `nombre`; `slots` de cofres, hornos y chanchito aceptan ítems y cantidades arbitrarias (trampa, no peligro).
  5. **El `alert(err.message)`** de `ui.js:325` muestra el mensaje del error; es texto del sistema, no del archivo, así que no hay inyección.
- **Arreglo:** un `validarMundo(payload)` en `save.js` con esquema y tope de tamaño, y que todo lo desconocido se descarte (no se copie con `...`). Probar con un archivo con `__proto__`, `constructor`, números gigantes y ids negativos.

### C5. Antes de publicar: correr los escáneres sobre el repositorio **ya limpio**
`gitleaks detect --log-opts="--all"` y `trufflehog git file://. --since-commit <primer commit>`. Mi barrido a mano no los reemplaza (no encontré nada, pero no son equivalentes).

---

## ALTOS

### A1. Rutas absolutas que se rompen en una subruta de GitHub Pages
- **Dónde:** `ui.js:1094` (`/ui/jefes/${tipo}.png`), `final.js:205` y `207` (`src="/ui/jefes/..."`), `style.css:19`, `30`, `248` y `vidrio.css:166` (`url(/ui/...)`, `url(/sprites/...)`).
- **Qué pasa:** `vite.config.js` usa `base: './'`, que reescribe lo que Vite ve (los `url()` del CSS y los imports), **no** los textos de JavaScript. Un sitio en `https://usuario.github.io/NanoBlocks/` pide `https://usuario.github.io/ui/jefes/x.png` y da 404: los retratos de jefes y las estaciones del final no cargan. En CSS Vite sí los resuelve; en los strings de JS no (por confirmar con `vite build && vite preview --base /NanoBlocks/`).
- **Arreglo:** `import.meta.env.BASE_URL` (o `./ui/...` relativo) en esas cuatro líneas de JS.

### A2. No hay política de contenido (CSP) y hay `onerror` en línea
- **Dónde:** `index.html` no tiene `<meta http-equiv="Content-Security-Policy">`; `final.js:205` y `207` inyectan `onerror="this.remove()"`.
- **Por qué:** GitHub Pages no deja poner cabeceras, pero el `<meta>` sirve y sería la segunda barrera si aparece otro XSS. Hoy el único `<script>` es `./src/main.js` (módulo) y no hay `eval`, `new Function`, `document.write` ni `setTimeout` con texto (conteo: 0 de cada uno).
- **Propuesta (probar):** `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; media-src 'self' blob:; worker-src 'self' blob:; connect-src 'self'` (con `wss://` de los relays si llega el multijugador). Hace falta cambiar los `onerror` en línea por un listener, y mantener `'unsafe-inline'` en estilos mientras existan `style=`.

### A3. Marca, licencia y terceros
- **Sin `LICENSE`:** un repositorio público sin licencia es «todos los derechos reservados» y nadie lo puede reutilizar. Decidir (MIT para el código, y aparte la del arte propio).
- **`THIRD_PARTY.md` está incompleto:** lista Inter (OFL), Kenney (CC0, interfaz e impactos y Voxel Pack) y «sonidos del mundo, solo los marcados CC0» (el manifiesto `public/sounds/real/manifest.json` tiene **283 créditos, todos CC0**; bien). Falta:
  - **`three` 0.170.0 (MIT)**: va dentro del `dist/` y la licencia MIT exige conservar el aviso.
  - El arte generado con **ChatGPT** (logo, fondo del menú, íconos del lote 1–3, retratos): `src/version.js:12` lo dice en los créditos del juego, pero `THIRD_PARTY.md` no. Revisar los términos de uso del servicio sobre propiedad y uso comercial, y decir en el README que es arte generado.
  - Las dependencias de desarrollo (`vite` 6.4.6, `eslint` 9.39.5, `@eslint/js`, `globals`) son MIT y no se distribuyen; basta con mencionarlas o dejarlas fuera.
- **Marca «nanoyackson»:** `README.md:3`, `ui.js:212` (el menú), `final.js:173` (créditos) e `index.html:83` (la semilla de ejemplo). Es la marca de un canal; confirmar con el dueño del canal que se puede publicar con ese nombre.

---

## Mapa de `innerHTML` y sumideros (src/)

Conteo: **48 usos de `innerHTML`** (en 17 archivos), **0** de `insertAdjacentHTML`, `outerHTML`, `document.write`, `eval`, `new Function`, `srcdoc`, `window.open`, `setTimeout` o `setInterval` con texto. `postMessage` (3, para los workers) no recibe texto de afuera.

**Sin texto del jugador (constantes, números o nombres del juego): seguros**
`armas3.js:220`, `bingo.js:49` y `84`, `comodidad.js:134` y `143` (`itemName` del juego), `ermitas.js:64`, `final.js:184`, `fuerza.js:75`, `influencer.js:119`, `pezvela.js:37`, `prologo.js:7`, `teclas.js:46` y `50`, `ui.js:140`, `349`, `354`, `377`, `737`, `801`, `838`, `843`, `929`, `931`, `1023` (la brújula solo pone el emoji `it.t` de cada marca, no el nombre del marcador), `1061`, `1178` (`c.nombre` fijo), `1314`, `1324`, `1341`, `1374` (la ruta sale de datos del juego), `1444`, `1486`, `1884`, `1906`, `1949`, `1952`, `2006`, `2038`, `2493`, `2496`, `2615`.

**Reciben texto que puede venir de un archivo o del jugador**

| Sumidero | Texto | Estado |
|---|---|---|
| `ui.js:354–356` (lista de mundos) | nombre del mundo | **seguro**: `textContent` |
| `ui.js:1666–1679` (nombre del cofre) | `be.nombre` | **seguro**: `textContent`, tope de 32, filtro de controles |
| `foto.js:126` (modo foto) | `g.meta.name` | quitan `<`, `>` y `&`: seguro (frágil: un `esc()` común sería mejor) |
| `libreta.js:58`, `71`, `72`, `bestiario.js:117`, `cuaderno.js:61`, `62`, `historia.js:272`, `diario.js:31` y `35` (`e.t`) | textos de la partida | **seguros**: pasan por `esc()` |
| **`diario.js:35` (`e.i`)** | icono de cada entrada de diario | **XSS** (hallazgo C3) |
| `torneo.js:48` | `r.nombre` de los rivales | seguro mientras `RIVALES` sea fijo; **por confirmar** si `g.torneo` se guarda en `meta` y se puede reemplazar al importar |
| `epilogo.js:32` | líneas de `lineas(g)` | por confirmar que ninguna interpola `meta.name` u otro texto del jugador |
| `ui.js:1221` | todo lo de `libretaHTML` | seguro solo si cada pieza se escapa (ver C3) |
| `ui.js:1094`, `final.js:205` | `tipo` y `k` | claves del juego, no del jugador |

**Texto del jugador que existe hoy:** nombre del mundo (≤40, la semilla ≤60), rótulos de cofre (≤32), la búsqueda del inventario y del recetario (solo filtra, no se escribe en el HTML) y el nombre de marcadores (lo arma el juego). No hay carteles, chat ni mascotas con nombre libre. `fetch` solo pide archivos propios (`./sounds/...`). `window.nanoblocks = { game, ui }` (`main.js:22`) deja el juego entero a mano desde la consola: no es un riesgo de seguridad en un juego local, pero en multijugador no se puede confiar en nada de lo que haga el cliente.

---

## Dependencias y licencias

| Paquete | Versión | Licencia | En el navegador |
|---|---|---|---|
| `three` | 0.170.0 | MIT | **Sí** (único) |
| `vite` | 6.4.6 | MIT | No (build) |
| `eslint`, `@eslint/js`, `globals` | 9.39.5, 9.17.0, 15.14.0 | MIT | No |

- `npm audit --omit=dev`: **found 0 vulnerabilities**. Versiones fijadas con valor exacto y `package-lock.json` presente. Conviene activar Dependabot al publicar.
- **Assets:** Inter (OFL 1.1, con `LICENSE.txt`), Kenney (CC0, con sus `LICENSE-*.txt`), 283 sonidos de Freesound en CC0 según el manifiesto. Pendiente solo lo de A3 (IA, `three`, `LICENSE`).
- **Blobs grandes en el historial:** ninguno mayor de 1.5 MB (el paquete completo pesa 25 MB). `assets-src/` está en `.gitignore` y nunca se versionó. Ningún archivo borrado con nombre de llave o `.env`.

---

## Multijugador futuro (Trystero/Nostr): modelo de amenaza y reglas para el diseño

**Premisa:** el anfitrión es la única autoridad. Todo cliente invitado es hostil por defecto, porque Trystero deja a cualquiera con el identificador de la sala conectarse por WebRTC, y los relays Nostr son públicos.

### Amenazas
1. **Suplantación y sala adivinable:** quien conozca o adivine el nombre de la sala entra. Los relays ven los nombres de las salas y los SDP.
2. **Fuga de IP:** WebRTC revela la IP pública (STUN/ICE) a todos los pares, y viceversa: el anfitrión y los invitados se ven las IP.
3. **Cheating del cliente:** posiciones imposibles, inventario inventado, bloques puestos o rotos sin permiso, daño inflado, comandos de administración (`/give`, `/tp`, `super` existen en `game.js`: **nunca** deben ejecutarse por un mensaje de un invitado).
4. **Denegación de servicio:** mensajes enormes (Trystero reensambla acciones de cualquier tamaño en memoria), inundación de mensajes, miles de ediciones de bloques por segundo, entradas a medias.
5. **Inyección:** nombres de jugador y chat con HTML (el juego usa `innerHTML` en 48 sitios), objetos con `__proto__`, `constructor`.

### Reglas concretas para el diseño
**Conexión**
1. Sala con identificador **aleatorio largo** (≥128 bits, p. ej. 22 caracteres base64) y la opción `password` de Trystero (cifra los SDP). No usar el nombre del mundo.
2. El anfitrión aprueba cada invitado (lista de espera con nombre) y puede **expulsar y bloquear** por `peerId`; máximo de invitados (p. ej. 8).
3. Avisar en la interfaz que jugar en línea expone la IP a los demás; ofrecer relay TURN solo opcional.
4. Versión del protocolo en el saludo; rechazar versiones distintas.

**Todo mensaje (en el anfitrión, antes de leerlo)**
5. **Tope de tamaño por tipo** (posición ≤ 64 bytes, chat ≤ 256 caracteres, bloque ≤ 32 bytes) y tope duro de la acción de Trystero; descartar y contar el exceso.
6. **Lista blanca de tipos de mensaje** y de campos; esquema por tipo (números finitos, enteros donde corresponda, rangos); descartar todo lo demás. Parsear a `Object.create(null)` o `Map`, y rechazar las claves `__proto__`, `constructor`, `prototype`. Nada de `Object.assign`/spread de un objeto recibido sobre el estado.
7. **Tasa por invitado:** cubo de fichas por tipo (p. ej. posición 20/s, bloques 10/s, chat 1 mensaje/s con ráfaga 3, golpes 5/s); si se pasa de forma sostenida, ignorar y luego expulsar.
8. Los identificadores de jugador los asigna **el anfitrión**, no el cliente; ignorar cualquier `id` de remitente que venga en el cuerpo.

**Qué valida el anfitrión**
9. **Posición:** velocidad máxima (`SPRINT` + margen) por tiempo transcurrido entre mensajes; teletransporte solo por las vías del juego (cama, portal); la caja no puede estar dentro de bloques sólidos; si falla, el anfitrión **corrige** al cliente a la última posición válida (sirve `Body.desatascar`).
10. **Bloques:** el cliente **pide** poner o romper; el anfitrión comprueba alcance (`REACH_SURVIVAL` 4.6), línea de vista, que el bloque exista, la herramienta y el tiempo de rotura, que tenga el ítem para colocar, y que no sea una zona protegida. El cliente no manda el resultado.
11. **Inventario:** vive en el anfitrión. El cliente manda acciones («mover casilla A a B», «fabricar la receta r», «usar ítem en casilla n»), nunca el contenido. Validar recetas, cantidades (≤ tamaño de pila) e ids con `BLOCKS`/`ITEMS`. El anfitrión envía el estado y el cliente solo lo dibuja.
12. **Combate y daño:** lo calcula el anfitrión (alcance, enfriamiento, arma real); el cliente solo declara «golpeé al objetivo X».
13. **Chat y nombres:** longitud máxima, caracteres de control fuera, y mostrarlo siempre con `textContent` (nunca `innerHTML`); lista de bloqueo y silenciar. El nombre del jugador se limpia con la misma función que el de los mundos.
14. **Mundo y guardado:** el anfitrión es el dueño del guardado; los invitados no reciben ni guardan el mundo entero (solo los chunks cercanos). Un invitado jamás sube un archivo de partida.
15. **Comandos y depuración:** ningún comando (`/…`) llega por la red; `window.nanoblocks` solo local.
16. **Registro:** contar mensajes descartados por invitado y mostrarlos al anfitrión; expulsar al pasar un umbral.

**Prueba antes de lanzar:** un cliente de prueba que mande mensajes con campos extra, números `NaN`/`Infinity`, cadenas de 10 MB, `{"__proto__":...}` y 1 000 ediciones por segundo, y el anfitrión debe seguir a 60 fps sin cambiar el estado.

---

## Orden sugerido de trabajo

1. **Limpiar el historial** (C1 y C2) en un clon nuevo, o empezar un repositorio nuevo con un solo commit.
2. `esc(e.i)` en `diario.js:35` (C3) y un `validarMundo()` con tope de tamaño (C4).
3. Correr `gitleaks` y `trufflehog` sobre el repositorio limpio (C5).
4. Rutas `/ui/...` con `BASE_URL` (A1) y probar `vite preview --base /NanoBlocks/`.
5. `LICENSE`, `THIRD_PARTY.md` completo (`three`, arte con IA) y confirmar la marca (A3).
6. CSP con `<meta>` y quitar los `onerror` en línea (A2).
7. Revisar a ojo las 75 capturas de `docs/capturas/`.

*Escrito por la sesión investigadora, solo lectura. Lo marcado «por confirmar» no se probó en el navegador.*
