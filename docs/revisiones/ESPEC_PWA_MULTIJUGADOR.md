# Especificación técnica: PWA y multijugador (lista para construir al final)

Sesión investigadora, **solo lectura** (encargo 32, 12-nov-2026). Parte de `ESTUDIO_APP_Y_MULTIJUGADOR.md` (B.5, B.8–B.10) y de la § «Multijugador futuro» de `AUDITORIA_SEGURIDAD_PREVIA.md` (reglas 1–16, citadas como **A-n**). Estado base: `v12.4.13`.

**Cómo está hecha:**
- **Medido hoy** (con comandos, en esta compu): el tamaño real de `dist/`; el peso de Trystero (instalé `trystero@0.27.0` en una carpeta temporal fuera del repo y lo empaqueté con el `esbuild` del proyecto); y qué relays de Nostr contestan (conexión WebSocket + ficha NIP-11 de los 30 que trae Trystero por defecto).
- **Leído hoy en la fuente** (documentación y código publicados de Trystero 0.27.0, página de Open Relay, registro de npm).
- **Razonado** (el protocolo, las validaciones, las fases): propuesta mía, marcada como tal.
- **No se probó** una conexión WebRTC real ni un service worker en el navegador (no se abre navegador en esta sesión). Lo marcado **«por confirmar»** hay que probarlo en la fase que lo cita.

## Resumen: lo que hay que decidir y lo que ya está decidido

| Tema | Decisión propuesta | Cifra que la sostiene |
|---|---|---|
| PWA | **Sí, primero** (es independiente del multijugador). Service worker propio generado por un script de 60 líneas (sin librería nueva); la versión instalada manda hasta que la persona acepte «recargar» | `dist/` = **22.7 MB**: lo que se necesita para jugar = **8.1 MB**; los sonidos (**14.6 MB**) se bajan aparte |
| Dónde vive | Cloudflare Pages (carga directa) mientras el repo es privado; GitHub Pages en una **subruta** al publicar | `base: './'` ya sirve en subruta; faltan las rutas `/ui/…` en JS (A1 de la auditoría) |
| Trystero | **`0.27.0`** (la última en npm, **publicada ayer, 11-nov-2026**; cambio grande de API), versión exacta, en un trozo aparte que solo se baja al jugar en línea | **154 KB** minificado · **57 KB gzip** · **50.6 KB brotli** (medido) |
| Identidad | La que ya trae Trystero 0.27 (`userId` de 22 caracteres derivado de una llave ECDSA, persistente en el navegador) **reemplaza** la identidad propia de B.10.1 | `userId` ≈ 131 bits |
| Anfitrión | Verificado criptográficamente con `roles({ selfAsAdmin: true })`: el invitado sabe que el anfitrión es quien dice | la sala se llama `base~<userId del anfitrión>` |
| Relays | El grupo por defecto de Trystero (30) con `redundancy: 6` y, si falla, una lista corta de respaldo | hoy **28 de 30** contestan; mediana de conexión ≈ 2 s |
| TURN | Open Relay (Metered): **20 GB/mes gratis**, con cuenta y clave; solo se baja al fallar la conexión directa | un invitado relayado ≈ 2.9 GB/mes |
| Protocolo | Anfitrión autoritativo; **el invitado manda intenciones, nunca resultados**; topes de tamaño y de frecuencia por tipo | ≈ 9–10 kB/s por invitado |
| Guardado | `meta.jugadores[userId]` dentro del registro del mundo (sin almacén nuevo de IndexedDB), con **`saveWorld` pasado a una sola transacción** | hoy son **dos** transacciones (hallazgo, § 5.1) |
| Orden | PWA (P1–P3) → F0 costuras → F1 sala → F2 construir juntos → F3 inventario y fichas → F4 criaturas → F5 mundo vivo → F6 historia | § 6 |

---

# 1. PWA

## 1.1 Estado y tamaño real de `dist/` (medido hoy)

No hay manifiesto ni service worker; `index.html` solo tiene un ícono SVG incrustado (`<link rel="icon" href="data:image/svg+xml…">`). `vite.config.js` usa `base: './'` y el build ya parte el JS en trozos con nombre (hash en el nombre del archivo).

| Parte de `dist/` | Archivos | Bytes | MB | ¿Cambia el nombre al cambiar el contenido? |
|---|---:|---:|---:|---|
| `assets/*.js` (13 trozos) | 13 | 3 293 252 | **3.29** (gzip ≈ **1.10 MB** el conjunto) | **Sí** (hash) |
| `assets/*.css` | 1 | 91 020 | 0.09 (gzip 18 KB) | Sí |
| `assets/*.png` (íconos de ítems) | ≈ 290 | ≈ 380 000 | 0.38 | Sí |
| `index.html` | 1 | 16 076 | 0.02 | **No** |
| `fonts/` (Inter, woff2) | 9 | 244 749 | 0.24 | No |
| `sprites/` (arte 128 px y otros) | 171 | 2 875 534 | 2.88 | No |
| `ui/` (logo, fondo, retratos de jefes) | 16 | 1 198 646 | 1.20 | No |
| `sounds/` (470 `.ogg` reales + 41 de Kenney + `manifest.json` 66 KB) | 511 | 14 628 562 | **14.63** | No |
| **Total** | **≈ 1 020** | **22 728 816** | **22.73** | |

Trozos de JS más grandes (bytes / gzip): `three` 521 900 / 131 977 · `index` 483 573 / 173 056 · `trama` 444 838 / 161 404 · `base` 417 535 / 160 225 · `criaturas` 361 275 / 117 992 · `lodworker` 323 685 / 108 049 · `arte` 304 652 / 89 943 · `mundo` 197 260 / 69 233 · `textos` 174 092 / 62 101 · `graficos` 46 800 / 17 539.

**Qué carga el juego al arrancar** (por el código): `textures.js: loadSprites` pide **todos** los PNG de `sprites/arte` y los de ítems; `audio.js` pide `sounds/real/manifest.json` y luego los `.ogg`. Así que hoy, para jugar sin conexión hace falta **todo**; los sonidos tienen respaldo (`audio.js`: «sin manifest: solo sonidos sintetizados»), así que pueden faltar sin romper nada.

**Conclusión de tamaños:** el **núcleo para jugar** (index + `assets` + `fonts` + `sprites` + `ui`) es **≈ 8.1 MB**; los **sonidos** son el 64 % del peso (14.6 MB) y conviene bajarlos aparte.

## 1.2 `manifest.webmanifest` (en `public/`)

```json
{
  "name": "NanoBlocks",
  "short_name": "NanoBlocks",
  "description": "Juego de bloques de supervivencia y construcción, con sabor tico.",
  "id": "./",
  "start_url": "./?origen=pwa",
  "scope": "./",
  "display": "standalone",
  "orientation": "landscape",
  "background_color": "#1d1a16",
  "theme_color": "#5ca038",
  "lang": "es-CR",
  "categories": ["games"],
  "icons": [
    { "src": "icons/icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any" },
    { "src": "icons/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any" },
    { "src": "icons/maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ],
  "screenshots": [
    { "src": "icons/captura-ancha.png", "sizes": "1280x720", "type": "image/png", "form_factor": "wide" }
  ]
}
```

- **Todas las rutas son relativas** (`./`, `icons/…`): resuelven bien en `https://x.pages.dev/` y en `https://usuario.github.io/NanoBlocks/`. **No** usar `/` al inicio.
- **`id`:** Chrome identifica la app instalada por `id` + origen. Cambiar de dirección (de `*.pages.dev` a `*.github.io`) **crea otra app instalada y otro IndexedDB vacío** (B.9.2): **fijar la dirección definitiva antes de repartir** y repetirlo en la guía de instalación.
- **Requisitos de instalación en Chrome** (según web.dev y guías de 2026; **por confirmar en Lighthouse**): HTTPS, manifiesto con `name`, `icons` de 192 y 512 y `start_url`, `display` distinto de `browser`. Hay fuentes que no se ponen de acuerdo sobre si todavía se exige un service worker con `fetch`: **lo tendremos de todos modos**, porque sin él no hay juego sin conexión.
- En `index.html`: `<link rel="manifest" href="./manifest.webmanifest">`, `<meta name="theme-color" content="#5ca038">`, `<link rel="apple-touch-icon" href="./icons/apple-touch-icon.png">` y `<link rel="icon" href="./icons/favicon-32.png" sizes="32x32">`.
- **Botón «Instalar»** (Ajustes, solo en Chrome): guardar el evento `beforeinstallprompt` y llamar a `prompt()` al hacer clic; si ya está instalado (`display-mode: standalone`), esconderlo.

## 1.3 Service worker: `sw.js` generado, no escrito a mano

Sin librería nueva (el proyecto tiene **una** dependencia en producción: `three`). Un script **`tools/generar-sw.mjs`** corre después de `vite build`, lee `dist/`, calcula un hash corto (SHA-1, 8 caracteres) por archivo y escribe `dist/sw.js` con la lista. (Alternativa válida: `vite-plugin-pwa` con Workbox; trae más código y más dependencias a cambio de menos script propio.)

**Cachés y claves**
- **`nb-estatico`** (una sola, persistente entre versiones): la **clave** de cada archivo es su URL, y para los que **no** llevan hash en el nombre (`index.html`, `fonts/`, `sprites/`, `ui/`, `manifest.json`) la URL más `?v=<hash8>`. Así, al actualizar **solo se bajan los archivos que cambiaron** (un cambio típico: `index.html` + 2–4 trozos de JS ≈ **0.4–0.8 MB** en gzip, no los 8 MB).
- **`nb-sonidos`**: los `.ogg`, aparte, con la misma regla de claves.

**Lista `PRECACHE`** (todo lo necesario para jugar): `index.html`, `manifest.webmanifest`, `assets/*`, `fonts/*`, `sprites/*`, `ui/*`, `icons/*`, `sounds/real/manifest.json` ≈ **8.1 MB**. **Si uno falla, la instalación falla** y se reintenta: es lo que se quiere (nunca una versión a medias).

**Sonidos** (`SONIDOS`, 14.6 MB): **no** son parte de la instalación; al terminar `activate` se bajan **en segundo plano** (4 a la vez, ignorando fallas) con un aviso opcional «Descargando sonidos para jugar sin conexión (14 MB)». Un sonido que falte se pide a la red; si no hay red, el juego usa sus sintetizados.

**Estrategia por tipo de archivo**

| Tipo | Estrategia | Por qué |
|---|---|---|
| Navegación (`/`, `index.html`) | **Caché primero**, desde la versión instalada | Un `index.html` nuevo con trozos viejos (o al revés) mezclaría versiones; la versión instalada manda hasta que la persona acepta actualizar |
| `assets/*.js` y `.css` (con hash) | Caché primero, para siempre | El nombre ya cambia con el contenido |
| `assets/*.png`, `sprites/`, `ui/`, `fonts/` | Caché primero (clave con `?v=hash`) | Cambian poco; no cambian entre cuadros |
| `sounds/**/*.ogg` | Caché primero, **al pedirse** (y la descarga de fondo) | 14.6 MB; no deben bloquear la instalación |
| `sounds/real/manifest.json` | Parte del precaché | Mantiene la lista de sonidos en sincronía con la versión |
| `sw.js`, `manifest.webmanifest` | **Red** (los pide el navegador) | `sw.js` se revalida solo; no se cachea en HTTP |
| Otros orígenes (relays, TURN de Metered) y WebSocket | **No se intercepta** | El SW solo atiende `GET` del mismo origen |
| Peticiones con cabecera `Range` | Pasan a la red sin cachear | Evita romper audio/video parcial |

**Esqueleto** (lo escribe la constructora; el `<hash>` y las listas las llena el script):

```js
// sw.js (generado)
const VERSION = '__GAME_VERSION__';            // p. ej. '12.6.0'
const PRECACHE = __PRECACHE__;                 // [[url, clave], ...]  clave = url o url?v=hash8
const SONIDOS = __SONIDOS__;
const POR_URL = new Map([...PRECACHE, ...SONIDOS].map(([u, k]) => [new URL(u, self.location).href, k]));

self.addEventListener('install', (e) => e.waitUntil((async () => {
  const c = await caches.open('nb-estatico');
  const tengo = new Set((await c.keys()).map((r) => r.url));
  for (const [u, k] of PRECACHE) {
    const clave = new URL(k, self.location).href;
    if (!tengo.has(clave)) await c.put(clave, await fetchOk(u));   // falla → falla toda la instalación
  }
  // NO hay skipWaiting() aquí: espera a que la persona acepte (mensaje 'activar')
})()));

self.addEventListener('message', (e) => { if (e.data === 'activar') self.skipWaiting(); });

self.addEventListener('activate', (e) => e.waitUntil((async () => {
  const buenas = new Set([...POR_URL.values()].map((k) => new URL(k, self.location).href));
  for (const nombre of ['nb-estatico', 'nb-sonidos']) {
    const c = await caches.open(nombre);
    for (const r of await c.keys()) if (!buenas.has(r.url)) await c.delete(r);   // lo que ya no existe
  }
  await self.clients.claim();
  self.registration.active && bajarSonidos();        // en segundo plano, sin bloquear
})()));

self.addEventListener('fetch', (e) => {
  const q = e.request;
  if (q.method !== 'GET' || q.headers.has('range')) return;
  const url = new URL(q.url);
  if (url.origin !== self.location.origin) return;
  const base = q.mode === 'navigate' ? new URL('./', self.location).href : url.origin + url.pathname;
  const clave = POR_URL.get(q.mode === 'navigate' ? base + 'index.html' : base) ;
  if (!clave) return;                                // lo que no conocemos va a la red
  e.respondWith(caches.match(new URL(clave, self.location).href).then((r) => r || fetch(q)));
});
```

(Detalles que la constructora debe cuidar: la clave de `index.html` también para `./` y `./?origen=pwa`; `ignoreSearch` en la coincidencia de navegación; `fetchOk` lanza si `!res.ok`.)

## 1.4 Cómo se actualiza sin romper mundos

1. **Registro** (en `main.js`, solo con `import.meta.env.PROD` para que `npm run dev` siga sin service worker): `navigator.serviceWorker.register('./sw.js', { scope: './' })` con `updateViaCache: 'none'`.
2. **Aviso, nunca recarga sola.** Cuando hay un SW nuevo en `waiting`, el juego pone un botón «Hay una versión nueva · Actualizar» **en el menú principal y en Ajustes** (no durante una partida; y si hay partida abierta, un aviso del Locutor de categoría `consejo`, una sola vez). Al aceptar: guardar el mundo, `postMessage('activar')`, y en `controllerchange` recargar.
3. **Cuándo se busca:** al arrancar, cada 6 horas con la pestaña abierta, y al volver a la pestaña (`visibilitychange`), con `registration.update()`.
4. **Con `MIN_VERSION` (lo que ya existe, `save.js: compatibilidad`):** un mundo guardado por una versión más nueva **bloquea** la apertura en una versión vieja («necesita la 12.5.1; esta es la 12.4.13»). El mensaje debe sumar un botón **«Buscar versión nueva»** (`registration.update()` y, si hay una esperando, el flujo del punto 2). Así una persona con la PWA «congelada» sale del bloqueo sola.
5. **IndexedDB.** `DB_VERSION = 1` (`save.js`). Si algún día sube, el código viejo debe cerrar su conexión en `onversionchange` para no bloquear la actualización en otra pestaña. **Nunca** borrar IndexedDB al actualizar.
6. **Dos pestañas.** La pestaña vieja sigue con su versión hasta recargar; el multijugador la rechaza por `PROTOCOL_VERSION` (§ 3.1), no por caché.
7. **Reversa.** Si una versión sale mala: publicar otra con número mayor (el SW es por contenido, no por reloj). Hay que probar con **dos pestañas y tres versiones seguidas** (§ 6, P3).
8. **Almacenamiento.** Chrome da hasta el 60 % del disco por origen (MDN, web.dev): 23 MB es nada. Los mundos están en IndexedDB y es «mejor esfuerzo» (el navegador puede borrarlos si se llena el disco): llamar **`navigator.storage.persist()`** al instalar y tras el primer guardado, y mostrar en Ajustes cuánto ocupa (`navigator.storage.estimate()`) y un recordatorio del botón «Exportar mundo».

## 1.5 Íconos y arte que hay que pedir (pedidos de arte para nanoyackson)

Estilo: el del logo actual de `public/ui/` y de `PEDIDOS_ARTE_LOTE1.md` §0 (plano, sin contorno negro, brillo arriba a la izquierda). Un bloque de pasto con la silueta de un cubo, sin texto, que se lea a 48 px.

| Archivo | Tamaño | Para qué | Notas |
|---|---|---|---|
| `icons/icon-512.png` | 512×512, fondo opaco | Instalación en Chrome y Windows | Cubo centrado, margen 8 % |
| `icons/icon-192.png` | 192×192 | Lista de apps de Android, Chrome | Reducción de la anterior; revisar a ojo |
| **`icons/maskable-512.png`** | 512×512, fondo a sangre | Android recorta en círculo/gota | **Todo lo importante dentro del 80 % central** (zona segura) |
| `icons/apple-touch-icon.png` | 180×180, sin transparencia | «Agregar a pantalla de inicio» | — |
| `icons/favicon-32.png` (+ `favicon.svg` opcional) | 32×32 | Pestaña | Reemplaza el SVG incrustado |
| `icons/captura-ancha.png` | 1280×720 | Diálogo de instalación enriquecido (opcional) | Captura real del juego al atardecer |
| `icons/compartir-1200x630.png` | 1200×630 | `og:image` al compartir el enlace | Logo + una captura |
| Atajos (opcional) | 96×96 c/u | «Continuar partida» | Más adelante |

El **nombre en pantalla** (`short_name`) y la descripción pasan por la auditoría de textos (usted, sin marca ajena); la marca «nanoyackson» está pendiente de confirmar (A3 de la auditoría).

## 1.6 Hosting gratis y la subruta

Límites y fuentes en `ESTUDIO_APP_Y_MULTIJUGADOR.md` B.9.1 (verificados el 11-nov; **no se re-verificaron hoy**).

| Destino | Cuándo | Cómo | Cuidado |
|---|---|---|---|
| **Cloudflare Pages** (carga directa, sin repo conectado) | Mientras el repo sea privado | `npm run build && node tools/generar-sw.mjs && npx wrangler pages deploy dist` | URL en la raíz (`https://x.pages.dev/`). Admite un archivo `_headers` (**por confirmar** la sintaxis vigente): `sw.js` y `index.html` con `Cache-Control: no-cache`; `assets/*` con `public, max-age=31536000, immutable` |
| **GitHub Pages**, rama `pages` o carpeta `/docs`, sin Actions | Al publicar el repositorio | Copiar `dist/` a la rama `pages` | **Subruta** `https://usuario.github.io/NanoBlocks/`; no se pueden poner cabeceras (el caché HTTP es de 10 min): el SW y la revalidación de `sw.js` del navegador lo cubren |

**Subruta, lo concreto:**
- `base: './'` ya hace relativas las rutas que Vite ve. **No** las de los textos de JS: `ui.js:1094`, `final.js:205` y `207` (`/ui/jefes/…`) y `url(/ui/…)`, `url(/sprites/…)` en `style.css:19, 30, 248` y `vidrio.css:166` (A1 de la auditoría): pasarlas a `import.meta.env.BASE_URL` o a `./…`. **Probar siempre con `npx vite preview --base /NanoBlocks/`** antes de publicar.
- `manifest`: `scope: "./"`, `start_url: "./?origen=pwa"` (relativos al manifiesto). El SW va en la raíz de la subruta (`dist/sw.js`), así su alcance cubre todo el juego.
- **CSP** (`<meta http-equiv="Content-Security-Policy">`, A2): `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; media-src 'self' blob:; worker-src 'self' blob:; manifest-src 'self'; connect-src 'self' wss: https://*.metered.live`. Los `wss:` sin lista son necesarios porque los relays de Nostr son decenas y cambian; el `https://*.metered.live` es solo para pedir las credenciales de TURN. Quitar los `onerror` en línea de `final.js` antes.

---

# 2. Multijugador con Trystero sobre Nostr

## 2.1 La versión y su peso

| Dato | Valor | Fuente |
|---|---|---|
| Última versión en npm | **`0.27.0`**, publicada **2026-11-11 17:47 UTC (ayer)** | registro de npm (consulta de hoy) |
| Anteriores | 0.26.0 (4-oct), 0.25.4 (30-ago), 0.25.3 (13-jul) | registro de npm |
| Qué es | `trystero` es un paquete delgado que depende de `@trystero-p2p/nostr` 0.27.0, que depende de `@trystero-p2p/core` 0.27.0 y de `@noble/secp256k1` | `package.json` instalado |
| Licencia | MIT | `package.json` |
| **Tamaño empaquetado** (mío, esbuild, solo `joinRoom`) | **154 126 bytes** minificado · **56 870 gzip** · **50 638 brotli** | medido hoy |
| Tamaño según su documentación | ≈ 46.3 KB brotli (`joinRoom`), +5.2 KB con `roles()` | `docs/signaling.md` |

**Riesgo de versión:** 0.27.0 es **un cambio mayor de API** (guía «Upgrading to 0.27.0»: `onPeerJoin` pasa de propiedad a método, `selfId` pasa a `await room.getSelf()`, `makeAction` ya no recibe callbacks, `joinRoom` toma 2 argumentos…) y **tiene un día de vida**. Recomiendo: (1) **fijar `0.27.0` exacta** (como el resto de `package.json`); (2) hacer **antes de la fase 1 un «spike» de un día** (dos perfiles de Chrome, una sala, un mensaje en cada sentido, un `ban`, un `password` equivocado) y **no seguir** si algo no anda; (3) **plan B:** `0.25.4` (API anterior) o `@trystero-p2p/torrent` (42.6 KB). Las dos cosas que este plan pide y 0.27 trae ya hechas: identidad verificable y anfitrión verificable.

**Carga perezosa:** Trystero va en su **propio trozo** (`red`), cargado con `import('./red/transporte.js')` solo al pulsar «Jugar con amistades»; el juego en solitario **no paga ni un byte** (hoy el `index` pesa 483 KB). Agregarlo a `vite.config.js` como un trozo fijo más y a `tools/revisar-trozos.mjs`.

## 2.2 Relays de Nostr (probados hoy)

Trystero 0.27 trae **30 relays por defecto** (`defaultRelayUrls`) y usa **5 a la vez** (`redundancy: 5`). Probé hoy desde esta compu (una sola vez; es una foto, no una promesa): conexión WebSocket y ficha NIP-11 de los 30.

- **Contestan 28 de 30.** Fallan `nostr-pub.wellorder.net` (sin respuesta en 6 s) y `relay.masize.com` (HTTP 502).
- **Tiempo de conexión:** de 0.44 s (`fanfares.nostr1.com`) a 3.7 s (`relay.notoshi.win`); mediana ≈ 2.0 s.
- **Ninguno exige pago ni autenticación** donde lo declaran; el mensaje máximo más chico que declaran es **128 KB** (`maxMsg 131 072`), muy por encima de lo que pesa un SDP cifrado. Casi todos son `strfry` (el programa de relay más usado).

**Recomendación**
1. **Usar el grupo por defecto y subir la redundancia:** `relayConfig: { redundancy: 6, warnOnRelayFailure: false }`. Trystero elige entre los 30, reintenta y retira los que no sirven; no hay que mantener una lista a mano.
2. **Lista de respaldo** (solo si falla el grupo por defecto, es decir `room.onError` con `code: 'relay-failed'`): `wss://fanfares.nostr1.com`, `wss://no.str.cr`, `wss://nostr.azzamo.net`, `wss://nostr.hifish.org`, `wss://nostr.liberty.fans`, `wss://relay.primal.net`, `wss://relay.snort.social`, `wss://relay.nostr.net`, `wss://relay.ditto.pub` (los más rápidos y de software conocido entre los que contestaron). Reintentar **una vez** con `relayConfig: { urls: RESPALDO }`.
3. **Mostrar el problema, no ocultarlo:** si ni así conecta, el texto es «No se pudo contactar con ningún servidor de salas. Revise su conexión o pruebe en otra red».
4. **Para las pruebas:** un relé local propio (`@trystero-p2p/ws-relay/server`, Node ≥ 22, `devDependency`, solo en `tools/`) para no depender de internet ni de los relays públicos en cada prueba (§ 6).
5. **Qué no se probó:** que cada relay **acepte los eventos** de Trystero (publicación y suscripción), no solo la conexión. Es lo primero que mide el spike.

## 2.3 STUN y TURN

- **STUN:** Trystero ya trae por defecto STUN de Google y de Cloudflare (`rtcConfig`); no hay que hacer nada.
- **Cuánta gente necesita TURN:** su documentación dice «≈ 10–15 %» de las conexiones reales; para Costa Rica **sin dato** (ver B.8.1). Es el seguro, no el camino normal.
- **Open Relay (Metered)**, según su página de hoy: **20 GB de uso gratis al mes**, TURN y TURNS, puertos **80 y 443** (atraviesa firewalls estrictos), TCP y UDP. **Exige cuenta gratis y una clave de API**; las credenciales se piden por REST: `GET https://<su-app>.metered.live/api/v1/turn/credentials?apiKey=<CLAVE>` devuelve el arreglo `iceServers`. La página dice que las entradas viejas de «50 GB» están **desactualizadas** (ya lo anotaba B.8.1).
- **Cómo se conecta:** al abrir o unirse a una sala se hace esa petición (si hay clave) y el resultado va en **`turnConfig`** de `joinRoom` (Trystero lo agrega a los STUN). Con TURN, **el tráfico sigue cifrado de punta a punta** (DTLS): Metered solo ve bytes.
- **El problema de la clave en un repo público:** la clave va en el navegador y cualquiera podría gastar los 20 GB. Opciones, de mejor a peor: (a) **cada anfitrión pone su propia clave gratis en Ajustes** (lo más limpio; la mayoría de las salas no la necesitará); (b) una clave del proyecto con tope y que se pueda rotar (si se agota, **solo se pierde el respaldo**: las conexiones directas siguen); (c) mintear credenciales de corta vida con un servidor propio: descartado (no hay Workers). **Por confirmar** si el panel de Metered permite limitar la clave por dominio.
- **Cuota esperada:** B.8.0 estima 2.9 GB/mes por invitado relayado (3 h/día): con el 100 % de las salas relayadas sobran 3–7×.
- **Cloudflare Realtime TURN** (1000 GB/mes gratis) queda como plan B: necesita un servicio que firme credenciales; no se puede sin servidor.
- **Medir en la práctica:** registrar (solo local, `console.info` y un contador en Ajustes → «Red») el **tipo de candidato ICE ganador** (`host`, `srflx` o `relay`) de cada conexión, para tener el dato de Costa Rica.
- **Privacidad (A-3):** pantalla antes de crear/unirse: «Jugar en línea muestra su dirección de red a las demás personas de la sala».

## 2.4 Cómo se une un invitado

**Código de invitación** (lo que se comparte; un solo texto):

```
NB1.<salaBase>~<userIdAnfitrion>.<clave>
```
- `salaBase`: 22 caracteres base62 aleatorios (≈ **131 bits**, A-1; `crypto.getRandomValues`, nunca el nombre del mundo).
- `userIdAnfitrion`: los 22 caracteres que Trystero agrega solo (`roles({ selfAsAdmin: true })` hace que el `roomId` completo sea `salaBase~userId`; el invitado entra con `use: [roles()]` y **verifica** que el anfitrión es ese usuario; si no, no entra).
- `clave`: 10 caracteres base32 de Crockford (≈ 50 bits) que van como **`password`** de Trystero (PBKDF2-SHA256 de 600 000 vueltas: cifra los apretones de manos para que los relays no puedan leerlos ni entrar).
- Total ≈ 58 caracteres. También como **enlace**: `https://…/#sala=NB1.…` (lo que va después de `#` **no se envía a ningún servidor**); al abrirlo el juego llena el código solo.

**Flujo del anfitrión** (menú del mundo → «Jugar con amistades»):
1. Aviso de privacidad (§ 2.3) y aceptación.
2. «Abrir sala»: se crea el código; botón «Copiar código» y «Copiar enlace». `maxUsers: 6` (anfitrión incluido; A-2 sugería hasta 8, 6 es lo del estudio).
3. Lista «Quién quiere entrar»: cuando alguien conecta aparece **«Ana quiere entrar»** con **Dejar entrar / No** (A-2), y en cualquier momento **Expulsar** y **Bloquear** (`room.ban(userId)` de Trystero, que además lo rechaza al volver).

**Flujo del invitado** (menú principal → «Unirse con un código»):
1. Aviso de privacidad, apodo (se limpia con la misma función que el nombre del mundo; ≤ 16 caracteres) y pegar el código.
2. «Buscando la sala… (hasta 20 s)» con botón «Cancelar». Errores en palabras: «no se encontró la sala» (nadie con ese código), «el código no es correcto» (`decrypt-failed`: clave distinta), «la sala está llena» (`room-full`), «el anfitrión no lo dejó entrar», «su versión del juego no es la misma: recargue para actualizar».
3. **Qué ve:** una sala de espera con el nombre del mundo y del anfitrión, y los nombres de quienes ya están; al ser aceptado entra **al mundo del anfitrión** (misma semilla, hora y clima) con **su** personaje (la ficha de § 5). **No ve** el menú de mundos del anfitrión, ni puede guardar el mundo, ni usar comandos.
4. **Su dirección de red es visible** para quienes estén en la sala (aviso ya mostrado).

**Nombre de la sala en los relays:** Trystero cifra y *hashea* el tema (`SHA-256 de trystero:<appId>:<roomId>`), así que los relays no ven el código en claro; sí ven el tema hasheado y el tráfico (A-1).

**`appId`:** una constante fija **no** ligada a la versión del juego, p. ej. `nanoblocks.<dirección-definitiva>` (si se pusiera `PROTOCOL_VERSION` en el `appId`, una versión vieja nunca encontraría la sala y no se podría decirle «recargue»). La versión va en el saludo (§ 3.1).

---

# 3. El protocolo, mensaje por mensaje

## 3.0 Principios

1. **El anfitrión es la única autoridad** (A-premisa). Todo invitado es hostil por defecto.
2. **El invitado manda intenciones, nunca resultados** (A-10, A-11, A-12): «quiero poner un bloque aquí», no «hay un bloque aquí».
3. **Cada tipo de mensaje es una `makeAction`** de Trystero (el nombre mide 1–32 bytes; uso el prefijo `nb.`). Los mensajes **del anfitrión** se declaran con `roles: ['admin']` (solo el anfitrión verificado puede enviarlos; los demás los rechazan solos). Los mensajes **del invitado** se envían con `target: <userId del anfitrión>`; el invitado **no registra** manejadores de los mensajes de otros invitados, así que un invitado malicioso no puede suplantar a otro (aunque Trystero arma una malla completa entre todos).
4. **Quién es el remitente lo dice Trystero (`context.userId`), nunca el cuerpo** (A-8). Cualquier campo `de`/`id` que venga adentro se **ignora**. El anfitrión asigna un **`pid`** de 1 byte a cada jugador conectado para los mensajes binarios.
5. **Formato:** JSON chico para lo raro (saludo, chat, intenciones) y **binario** (`ArrayBuffer` con `DataView`) para lo frecuente (posiciones, criaturas, bloques). **Todo se valida antes de leerse** (A-5, A-6): se copia a un objeto nuevo solo con las claves conocidas y tipos exactos; **claves de más, `NaN`, `Infinity`, `__proto__`, `constructor`, `prototype` = descartar y contar**; nada de `Object.assign` ni *spread* de lo recibido sobre el estado.
6. **Tope duro global:** `maxReceiveBytes: 1 << 20` (1 MiB) en `joinRoom` (Trystero trae 256 MiB por defecto: A-4) y en cada acción un `onReceive` que compara `byteLength` con el tope de su tipo **antes** de entregar el contenido.
7. **Versión:** `PROTOCOL_VERSION` (entero, empieza en 1) **y** `GAME_VERSION` en el saludo; si no coinciden, el anfitrión responde `rechazo` con motivo `version` (A-4) y el invitado ve «recargue para actualizar».
8. **Sin clientes que se crean amigos:** no hay mensajes de un invitado a otro. Un mensaje de invitado a invitado se ignora y suma al contador de descartes del remitente.

## 3.1 Tabla de mensajes

`G→A`: del invitado al anfitrión. `A→G`: del anfitrión a uno. `A→T`: del anfitrión a todos. Tamaños en bytes **tope** (se descarta lo que pase). Frecuencias: **normal / ráfaga permitida / tope sostenido** por invitado (cubo de fichas por tipo, A-7).

| # | Acción (`nb.…`) | Sentido | Contenido | Tamaño máx. | Frecuencia (normal · tope) | Autoridad |
|---|---|---|---|---|---|---|
| 1 | `hola` | G→A | `{ v:int, g:str(≤12), nombre:str(≤16), cuerpo:{ camisa, piel, pelo: int 0–31 } }` | 256 | 1 al entrar; 1 cada 5 s | Anfitrión (aprueba) |
| 2 | `acepta` | A→G | `{ ok:true, pid:u8, mundo:{ nombre, seed, genVersion, tipo, dificultad, dim, dia, hora }, ficha:{…§5}, jugadores:[{pid,nombre,cuerpo}] }` | 65 536 (Trystero lo trocea) | 1 | Anfitrión |
| 3 | `rechazo` | A→G | `{ motivo: 'version'\|'lleno'\|'no'\|'bloqueado'\|'ya-conectado'\|'espere' }` | 64 | 1 | Anfitrión |
| 4 | `pos` | G→A | binario: `seq u16, x f32, y f32, z f32, yaw i16, pitch i16, flags u8 (agachado, corre, vuela, suelo, golpea), arma u16, dim u8` | **32** | 10 Hz · 15 · **ráfaga 30** | **Cada invitado manda su movimiento; el anfitrión lo valida y corrige** |
| 5 | `jugadores` | A→T | binario: por jugador `pid u8, x,y,z f32, yaw,pitch i16, flags u8, arma u16, vida u8` (≤ 6) | 192 | 10 Hz | Anfitrión |
| 6 | `corrige` | A→G | `x,y,z f32, seq u16` (vuelve a la última posición válida) | 20 | por evento (≤ 2/s) | Anfitrión |
| 7 | `chunks_pide` | G→A | `{ c:[[cx,cz],…] }` (≤ 16 pares, enteros) | 160 | 5/s · ráfaga 10 | Anfitrión |
| 8 | `chunks_dato` | A→G | por chunk: `cx,cz, mods:[[idx u16, id u16],…], be:[…]` (solo chunks que tengan cambios) | 65 536 (por mensaje, varios chunks si caben) | bajo demanda | Anfitrión |
| 9 | `rompe_inicio` | G→A | `{ x,y,z: int, seq }` (apunta a un bloque para romperlo) | 24 | 10/s | Anfitrión |
| 10 | `bloque` | G→A | binario: `op u8 (0 romper, 1 poner), x,y,z i32, id u16, cara u8, viejo u16, seq u16` | **28** | 10/s · 20 · **ráfaga 20** | **Anfitrión** |
| 11 | `bloques` | A→T | lote de cambios confirmados: `[x,y,z i32, id u16]…` (≤ 64 por mensaje) | 1 024 | ≤ 20 Hz | Anfitrión |
| 12 | `inv_op` | G→A | `{ opId:int, op:'mover'\|'dividir'\|'soltar'\|'equipar'\|'fabricar'\|'usar'\|'elegir', a:int, b:int, n:int, receta:int, esperado:[id,n] }` | 96 | 10/s · 15 | **Anfitrión** (el inventario vive allá, A-11) |
| 13 | `inv_estado` | A→G | `{ rev:int, slots:{ idx:[id,n,dur?] }, armor:[…], billetera:{id:n}, sel:int }` (solo lo que cambió; o completo al entrar) | 4 096 (completo ≤ 8 192) | por evento + 1/30 s (latido) | Anfitrión |
| 14 | `vida` | A→G | `vida u8, hambre u8, agua u8, aire u8` | 8 | 2 Hz y al cambiar | Anfitrión |
| 15 | `golpe` | G→A | `{ mob:int, pesado:bool }` | 24 | 5/s · ráfaga 8 | **Anfitrión** (alcance, enfriamiento y arma reales, A-12) |
| 16 | `mobs` | A→G | binario, solo lo que está a ≤ 64 bloques del invitado: por criatura `id u32, tipo u16, x,y,z f32, yaw i8, anim u8, vida u8` (≤ 60) | **1 400** | 6 Hz | Anfitrión |
| 17 | `mob_ev` | A→G | `{ e:'nace'\|'muere'\|'datos', id, tipo, x,y,z, extra? }` | 256 | por evento | Anfitrión |
| 18 | `tiempo` | A→T | `{ dia:int, hora:f32, clima:u8, intens:u8, luna:u8 }` y eventos `rayo{x,z}` | 32 | 1 Hz | Anfitrión |
| 19 | `aviso` | A→G | `{ cat:'urgente'\|'importante'\|'consejo'\|'ambiente'\|'registro', texto:str(≤120) }` (el Locutor del invitado) | 160 | ≤ 4/s | Anfitrión |
| 20 | `fx` | A→T | `{ t:'sonido'\|'particula'\|'dano'\|'golpe', … }` (solo lo cercano) | 96 | ≤ 20/s | Anfitrión |
| 21 | `chat` | G→A y A→T | G→A: `{ texto:str(≤200) }`. A→T: `{ pid, texto }` | 256 | **1/s · ráfaga 3** | Anfitrión (filtra y reparte) |
| 22 | `estacion` | G→A, A→G | abrir/cerrar/mover en cofre, horno, mesa (`be`): `{ opId, x,y,z, accion, a, b, n, esperado }` y respuesta con el estado | 128 / 4 096 | 10/s | **Anfitrión** (fase 5) |
| 23 | `tienda` | G→A, A→G | comprar/vender con un vecino: `{ opId, vid, fila, n }` y resultado | 64 / 512 | 5/s | Anfitrión (fase 5) |
| 24 | `salud` | G→A | `ping` de aplicación cada 5 s (`room.ping` de Trystero mide el tiempo de ida y vuelta) | 8 | 0.2 Hz | — |
| 25 | `expulsa` | A→G | `{ motivo }` | 64 | por evento | Anfitrión |
| 26 | `dormir` | G→A, A→T | voto de «a dormir» y resultado (fase 5) | 16 | por evento | Anfitrión |

**Presupuesto de ancho de banda** (por invitado, peor caso): `pos` 22 B × 10 = 0.22 kB/s; `jugadores` ≈ 5 × 24 × 10 = 1.2 kB/s; `mobs` 60 × 21 × 6 ≈ 7.6 kB/s; el resto < 0.5 kB/s → **≈ 9–10 kB/s** (coincide con B.8.0: 8.5 kB/s) más ≈ 1 kB/s de encabezados de Trystero con ≈ 30 mensajes/s. **El anfitrión con 5 invitados sube ≈ 50 kB/s (≈ 400 kbps)**: cabe en casi cualquier fibra; en datos móviles puede apretar.

**Observación sobre `pos` y la cola de entrega:** los canales de datos de Trystero son confiables y ordenados; con pérdida de paquetes un `pos` viejo puede llegar tarde. Por eso `seq u16` en `pos`, `corrige` y `bloque`: el anfitrión **descarta** `pos` más viejos que el último procesado y el invitado ignora `corrige` de un `seq` anterior al que ya mandó. (**Por confirmar** si en redes con pérdida hace falta una cola «solo el último» del lado del invitado.)

## 3.2 Validación del anfitrión, mensaje por mensaje

Marco a la derecha la regla de la auditoría (A-n). Todo `descarto` **suma 1 al contador de descartes** del invitado (A-16).

| Mensaje | Qué comprueba el anfitrión | Si falla |
|---|---|---|
| **todos** | Existe como mensaje conocido (lista blanca, A-6); `byteLength ≤ tope` (A-5); esquema exacto, números finitos y enteros donde corresponda; sin claves raras; el remitente (`context.userId`) está **aceptado** y **no bloqueado**; cubo de fichas del tipo no vacío (A-7) | descarto; sostenido → aviso al anfitrión; muy sostenido → expulsión (§ 3.3) |
| `hola` | `v === PROTOCOL_VERSION` y `g === GAME_VERSION` (A-4); `nombre` limpio (control fuera, ≤ 16, sin `<>&`; único entre conectados y fichas: si choca se agrega « 2»); `cuerpo` índices en rango; **un solo peer por `userId`** (el segundo desplaza al primero con `rechazo: 'ya-conectado'`); cupo (`maxUsers`) | `rechazo` con motivo |
| `pos` | **Velocidad:** `dist(pos, últimaValida) / (tiempo real transcurrido) ≤ v_máx × 1.35 + 0.5`, con `v_máx` = `SPRINT` 5.612 (`player.js`), `FLY_SPRINT` 21.6 si `vuela` y el modo lo permite, y la velocidad del vehículo si va montado (A-9); **mundo:** `y ≥ −20` y `|x|,|z| ≤ límite del mundo`; **caja del jugador sin entrar en bloques sólidos** (si entra, `Body.desatascar`, A-9); **saltos:** solo por las vías del juego (cama, portal, `/tp` del anfitrión) | `corrige` a la última posición válida; 10 correcciones en 10 s → expulsión temporal |
| `chunks_pide` | Cada `(cx,cz)` entero, **a ≤ `renderDistance` (máx. 8 en red) chunks de la última posición válida**; ≤ 16 pares | descarto |
| `rompe_inicio` | Alcance (`REACH_SURVIVAL` = 4.6, `REACH_CREATIVE` = 6, `game.js`) **+ 1.0 de margen** por la latencia, desde la última posición válida; el bloque existe y no es irrompible; guarda `{x,y,z,t0}` | descarto |
| **`bloque`** (romper) | Hubo un `rompe_inicio` para ese bloque; `ahora − t0 ≥ 0.7 × tiempo de rotura` según dureza y herramienta que el **anfitrión** sabe que tiene en la mano (instantáneo en creativo); alcance y **línea de vista** (rayo desde el ojo, como `game.js`); `viejo` coincide con lo que hay (A-10) | `corrige_bloque`: el anfitrión reenvía el bloque real (mensaje `bloques`) |
| **`bloque`** (poner) | El invitado **tiene** el ítem en el hueco elegido (ficha del anfitrión); `id` es bloque válido (`isBlockId`, `BLOCKS`); la celda es reemplazable (aire, agua…) y la nueva forma **no se cruza con la caja de ningún jugador**; alcance y vista; no es zona protegida (la casa o estructuras del anfitrión, **por decidir**); límite de bloques por segundo | rechazado; reenvío del estado real |
| `inv_op` | `opId` mayor que el último visto de ese jugador (**ignora repetidos**, B.10.5); `esperado` coincide con lo que hay en esos huecos (compara-y-cambia); huecos en rango (0–35 y armadura 0–4); cantidades `1 ≤ n ≤ pila` (`maxStack`); `fabricar`: la receta existe (`RECIPES`) y los ingredientes están **en su inventario** (`inv.count`); `usar`: el ítem existe y puede usarse (`ITEMS`); todo se ejecuta en **una función síncrona** del anfitrión (A-11, B.10.5) | `inv_estado` completo con la verdad; se cuenta |
| `golpe` | El `mob` existe y está vivo; **distancia ≤ alcance del arma + 1.0** a la última posición válida; **enfriamiento** del arma (`combate.js`: `cd` por tipo de arma); el arma sale de **su** ficha, no del mensaje; daño calculado por `asestar` en el anfitrión (A-12) | descarto |
| `chat` | Longitud ≤ 200, sin controles, **si empieza con `/` se rechaza** y el invitado ve «Los comandos no están disponibles en línea» (A-13, A-15); se reparte con `textContent` en todos (nunca `innerHTML`); lista de silenciados | descarto; 3 faltas = silencio de 30 s |
| `estacion` / `tienda` | Misma regla de compara-y-cambia que `inv_op`; el invitado debe estar **a ≤ 4.6** del bloque o del vecino; una sola persona modifica un horno a la vez (cerrojo: el primero que abrió) | rechazo con el estado real |
| `salud` | — | — |
| **Comandos** | **Ningún** `/…` viaja por la red; `window.nanoblocks` solo local (A-15); en el anfitrión, un invitado no puede disparar `super`, `/give`, `/tp` | — |

**Dónde vive la validación:** funciones **puras** en `src/red/validar.js` (entrada: mensaje + estado del jugador + reloj; salida: `{ ok, motivo }`), sin tocar Three.js ni el DOM, para poder **probarlas en Node** con miles de mensajes sin abrir un navegador (§ 6, F0).

## 3.3 Límite de mensajes por segundo

Un **cubo de fichas** por invitado y tipo (reposición por segundo / capacidad). Valores iniciales (A-7 sugería otros parecidos; se ajustan con el spike):

| Tipo | Reposición/s | Capacidad (ráfaga) |
|---|---|---|
| `pos` | 15 | 30 |
| `bloque` | 10 | 20 |
| `rompe_inicio` | 10 | 20 |
| `inv_op` | 10 | 15 |
| `golpe` | 5 | 8 |
| `chunks_pide` | 5 | 10 |
| `chat` | 1 | 3 |
| `estacion`, `tienda` | 5 | 10 |
| `hola` | 0.2 | 1 |
| `salud` | 0.5 | 2 |
| **Total por invitado** | **60** | **120** |

Y un tope del anfitrión de **300 mensajes/s entre todos** (con 6 personas el uso normal ronda 50–90). **Escalera de castigo** (A-7, A-16): fuera del cubo → se descarta; **> 20 % descartados durante 5 s** → aviso en la lista del anfitrión («Ana está mandando demasiado»); **> 50 % durante 20 s** o **fichas negativas por 10 s** → **expulsión** (`room.ban` 5 minutos, ampliable a permanente por el anfitrión). Los contadores se muestran en el panel «Sala» del anfitrión.

---

# 4. Qué se sincroniza y qué no

Quién manda, cómo viaja y en qué fase entra.

| Cosa | Quién manda | Cómo viaja | No viaja | Fase |
|---|---|---|---|---|
| **Terreno** | Cada uno lo genera igual (`semilla + genVersion`) | Nada | Los chunks no se envían | F1 |
| **Cambios de bloques** (`World.mods`) | Anfitrión | Al entrar y al acercarse: `chunks_pide` / `chunks_dato` (solo chunks **con** cambios) | El mundo entero (A-14: el invitado no recibe ni guarda el mundo) | F2 |
| **Bloques editados** | Anfitrión (tras validar) | `bloque` (intención) → `bloques` (confirmados) | Resultados calculados por el invitado | F2 |
| **Física de mundo** (agua, arena que cae, cultivos, plantas) | **Solo el anfitrión** (`neighborUpdates`, `scheduleFluid`, `fall`: B.4 #7) | Como `bloques` (se agrupa y limita: ≤ 200 cambios/s por invitado para no inundar la red con una avalancha) | En el invitado esos procesos **no corren** (`setBlock` con `{ updates: false }`) | F5 |
| **Bloques con datos** (cofres, hornos, mesas) | Anfitrión | `chunks_dato` (`be`) al entrar; `estacion` para operar | Edición local | F5 (solo lectura en F2) |
| **Jugadores** | Cada uno su movimiento, validado | `pos` → `jugadores` (10 Hz); el cuerpo se dibuja con el `Avatar` existente | Predicción/reconciliación (amistades, no competitivo) | F1 |
| **Criaturas y vecinos** | **Anfitrión** (cerebros, nacimiento, descarga por unión de jugadores) | `mobs` (6 Hz, solo ≤ 64 bloques) + `mob_ev`; en el invitado son **títeres** (`Mob` con `data.titere`, sin cerebro, solo interpolan) | Los cerebros (≈ 60 archivos que asumen `g.player`: B.4 #3) | F4 |
| **Jefes y leyendas** | **Solo anfitrión**; los invitados los ven y los golpean | Igual que las criaturas | Las arenas, `anselmo`, el final: solo el anfitrión los inicia | F4 (ver) / F6 (pelear en grupo) |
| **Daño a un jugador** | Anfitrión calcula; **`damagePlayer(objetivo)`** con el jugador más cercano; la presión del jefe (`presionJefe`) se calcula con **el jefe más cercano a la víctima** (hoy usa solo `g.player`) | `vida`, `fx` | — | F4 |
| **Objetos tirados** | Anfitrión (`id` único); **recoger = el anfitrión borra la entidad y suma al inventario en un solo paso** | `mob_ev`/`fx` | Recogida local | F3 |
| **Reloj, día, clima, relámpagos** | **Anfitrión** | `tiempo` (1 Hz); el invitado avanza su `g.time` con el mismo `dt` y se **corrige si se desvía > 1 s**; el `Weather` del invitado pasa a **pasivo** (no usa `Math.random()`: B.4 #19) | El reloj local | F1 |
| **Dormir** | Votación del anfitrión (todos o mayoría) | `dormir` | `sleepFade` por cuenta propia | F5 |
| **Inventario, armadura, billetera, vida, hambre** | **Anfitrión (ficha)**, no el invitado (decisión de B.10 y A-11; ajusta B.3, que lo dejaba local) | Intenciones `inv_op`; el estado vuelve en `inv_estado`/`vida`; el `Inventory` del invitado es un **espejo de solo lectura** (sus métodos que cambian algo se desvían a mensajes) | El contenido calculado por el cliente | F3 |
| **Avisos, logros, diálogos** | Anfitrión decide, el invitado muestra | `aviso` (por el Locutor del invitado) | Los ~970 `ui.toast` directos de la simulación (B.4 #13: F0 los pasa por `avisar(jugadorId, …)`) | F0 |
| **Chat** | Todos, repartido por el anfitrión | `chat` | Comandos | F1 |
| **Historia, misiones, economía del mundo** (`meta.hist`, `fiado`, `cuaderno`…) | **Del anfitrión** al principio; los invitados «ayudan» | Nada | Campaña por jugador (F6) | F6 |
| **Dimensiones y portales** | MVP: **todos en la misma dimensión**; portales apagados o por votación | — | `new World` por cada invitado | F6 |
| **Vehículos, monturas** | El que conduce manda; los demás pasajeros | `pos` con bandera + `vehiculo` | Dos conductores | F5 |
| **Minijuegos de cámara y eventos globales** (`clasico`, `bingo`, `torneo`, `asedio`, `tsunami`…) | Solo el anfitrión los inicia; los de cámara se apagan en red | — | — | F6 |
| **Guardado del mundo** | **Solo anfitrión** (A-14) | — | Un invitado jamás sube un archivo de partida | F3 |
| **Sonido y partículas** | Local; eventos ajenos por `fx` | `fx` | — | F2 |

**El «cliente en modo red» de `World`:** el invitado crea el mismo `World` pero **sin** `neighborUpdates`, fluidos, `fall`, cultivos ni nacimiento de criaturas: solo genera terreno y aplica lo que le llega. Esa bandera (`world.red = 'cliente'`) es la costura de F0.

---

# 5. Guardado de los invitados en el mundo del anfitrión

## 5.1 Hallazgo previo: `saveWorld` hoy **no** es atómico

`save.js: saveWorld` (línea 135) hace **dos transacciones seguidas**: primero `tx('worlds', 'readwrite', put(meta))` y después `tx('chunks', 'readwrite', …)`. Si la pestaña se cierra entre las dos, queda la ficha nueva con el cofre viejo (o al revés): **con un solo jugador es casi inofensivo; con intercambio de objetos entre personas es exactamente la duplicación o pérdida que B.10.5 quiere evitar.** B.10.3 supone una sola transacción: **hay que hacerlo** (F0): `db.transaction(['worlds', 'chunks'], 'readwrite')` y todas las escrituras dentro, con un solo `oncomplete`.

## 5.2 Dónde y con qué forma

**Decisión (distinta de B.10.2, y por qué):** las fichas van en **`meta.jugadores`** dentro del registro del mundo (almacén `worlds`), **no** en un almacén nuevo `jugadores`. Razones: (1) sin subir `DB_VERSION` (menos riesgo con la PWA y con pestañas viejas); (2) viaja gratis con `exportWorld` / `importWorld` y con los respaldos; (3) queda en la **misma transacción** que los chunks cuando F0 la unifique; (4) 6 fichas ≈ 30 KB. **El anfitrión sigue usando `meta.player` y `meta.inventory`** como hoy (así el juego en solitario y los 162 archivos que tocan `meta` **no cambian**); no se vuelve «una ficha más» (B.10.2 lo proponía).

```
meta.epoca        : int        // sube cada vez que se importa o duplica el mundo
meta.jugadores    : {          // por userId (22 caracteres base62), máx. 12 fichas
  "<userId>": {
    v: 1,
    nombre: "Ana",             // el último; ≤ 16, limpio
    nombres: ["Ana", "Anita"], // los 5 últimos (para la lista del anfitrión)
    desde: 12,                 // día del mundo en que se creó la ficha
    ultimaVez: 1783000000000,  // Date.now() de la última desconexión
    rev: 4821,                 // sube en cada guardado de la ficha (detecta copias viejas)
    estado: "activo" | "archivado",
    bloqueado: false,
    inv: { slots: [...36], selected: 0, armor: [...5], billetera: { "360": 3 } },  // = Inventory.toJSON()
    vital: { vida, hambre, agua, aire, volando },
    pos: { x, y, z, yaw, pitch, dim },
    cama: { x, y, z, dim } | null,
    cuerpo: { camisa, piel, pelo },
    progreso: { ... }          // lista blanca (ver abajo)
  }
}
```

- **`progreso`**, lista blanca: en F3 solo `logros` (claves de `logros-lista.js`) y `recetas`; en F6 sumar lo demás **campo a campo** (habilidades, maestría, diario…) leyendo `achieve` y los módulos que escriben en `meta`. **Por confirmar** cuáles de los ≈ 1 232 usos de `.meta` son del mundo y cuáles del jugador (B.4 #11): la regla para lo nuevo es anotar en el `ARBOL_CONOCIMIENTO` «¿del mundo o del jugador?».
- **Migración:** `SAVE_FORMAT 7` (`save.js: MIGRATIONS`): `jugadores: {}` y `epoca: 1`; opcional con `??`. `validarMundo` (importar.js) la valida: máx. 12 fichas, claves de 22 caracteres base62, cada ficha ≤ 64 KB, `limpiarValor`, casillas con `limpiarPilas` (ids válidos con `idValido`, que ya cubre el rango 1100+).
- **`MIN_VERSION`** sube cuando se guarde por primera vez una ficha (la versión de F3), y **`MIN_IDS`** no cambia (no hay ids nuevos; ver la corrección del hallazgo de la 31 en la v12.5.1).

## 5.3 Cuándo se guarda

- **Cada ≈ 5 s si hay cambios** (`rev` sube) y **de inmediato** tras: entregar un encargo, intercambio, comprar/vender, abrir o cerrar un cofre, muerte, desconexión de un invitado y cierre del anfitrión (`pagehide` y `visibilitychange`).
- **Una sola transacción** (§ 5.1): ficha + chunks tocados + `meta`.
- **Al irse un invitado:** guardado inmediato y `ultimaVez`; **la ficha se queda**; su cuerpo desaparece de la escena y lo suyo no se cae.
- **Al volver:** se verifica su `userId` (lo hace Trystero), se manda `acepta` con la ficha completa y el invitado reaparece en `pos` (si hay un bloque sólido, **sube al primer hueco libre** o a su cama).
- **Cierre brusco del anfitrión:** se pierden como mucho 5 s; no se duplica nada porque la última transacción es coherente. Los invitados quedan en «sala de espera» sin poder usar el inventario; al volver el anfitrión (mismo mundo, mismo código **no** sirve: se abre una sala nueva y el código nuevo se comparte otra vez; la llave de identidad hace que su ficha los reconozca).
- **Anfitrión de reemplazo:** no en este ciclo (B.10.4). Si alguien recibe una copia del mundo, **`epoca`** distingue la línea de tiempo: al entrar, el invitado manda la `epoca` que recuerda (guardada en `localStorage` por `userId`+mundo) y, si es otra, ve «Este mundo no es el mismo que visitó» y elige entrar como persona nueva o cancelar.

## 5.4 «¿Y si el invitado vuelve con otro nombre?»

La identidad es el **`userId`**, **no** el nombre (B.10.1, ahora con la llave de Trystero en vez de una propia):
- **Mismo navegador, otro apodo:** la ficha es la misma (mismo `userId`); el nombre nuevo reemplaza al anterior y el viejo pasa a `nombres`. **No** se pierde nada. Si el apodo choca con otra persona conectada o con otra ficha, se muestra como «Ana 2» (A-13: nombre limpio con la función de los mundos).
- **Otro navegador, otro computador o datos borrados:** el `userId` es **otro** → para el juego es **una persona nueva** con una ficha nueva (equipo inicial). **Dos salidas** (decisión sencilla entre amistades): (a) **El invitado respalda su identidad**: Ajustes → «Respaldo de mi identidad» descarga un archivo con `exportUserIdentity()` (protegido con una frase) y en el otro equipo «Recuperar» (`importUserIdentity`) devuelve el **mismo** `userId`; (b) **El anfitrión reasigna la ficha**: «Fichas guardadas» → *Ana (última vez: hace 3 días)* → «Dar esta ficha a [persona conectada]», con confirmación; la ficha vieja se **archiva** y la nueva toma su contenido (la operación es un solo guardado atómico).
- **Dos pestañas con la misma llave:** Trystero ya trata una persona con dos pestañas como **un** usuario con dos peers; el juego acepta **un** peer por `userId` y la segunda pestaña recibe `rechazo: 'ya-conectado'` («ya está conectada desde otra ventana»), o desplaza a la primera (por decidir; B.10.6 proponía desplazar).
- **Probar con dos pestañas en la misma compu** hace que las dos compartan el `userId` (misma identidad `'local'`): para simular a dos personas, **una ventana de incógnito** o el parámetro `?identidad=temporal` (en el código, `identity: 'none'`); ver § 6.

---

# 6. Fases de construcción

Tamaños (como B.5): **S** 2–3 días · **M** 1–2 semanas · **L** 2–4 semanas de trabajo concentrado. Cada fase termina **jugable y probada**, con `npm run lint` y `npm run build` en cero warnings, `docs/ARBOL_CONOCIMIENTO.md` al día y una captura de las pantallas nuevas en `docs/capturas/<versión>/`. Una fase **no empieza** hasta que la anterior pasó sus pruebas.

**Cómo se prueba con una sola compu:**
- **Dos personas distintas:** ventana normal de Chrome (anfitrión) + **ventana de incógnito** (invitado: otro `userId`, otro IndexedDB, otro `localStorage`), o un **segundo perfil** de Chrome. Dos pestañas del mismo perfil comparten identidad y sirven solo para probar «dos pestañas de la misma persona».
- **Sin internet ni depender de relays públicos:** `node tools/relay-local.mjs` (un `createWsRelayServer` de `@trystero-p2p/ws-relay/server`, `devDependency`, en `ws://localhost:8081`) y `?relay=ws://localhost:8081` en la dirección. Para la prueba con relays reales, sin el parámetro.
- **Latencia y pérdida artificial:** en Chrome DevTools → Red → «Reducida» o un perfil personalizado; verifica `corrige`, `seq` y los cubos de fichas.
- **Registro:** el panel «Sala» del anfitrión (conectados, `room.ping`, descartes por tipo, tipo de candidato ICE: `host`/`srflx`/`relay`).

## Fase P: PWA (independiente, puede ir antes de todo)

| Fase | Entrega | Tamaño | Se prueba con |
|---|---|---|---|
| **P1** | `manifest.webmanifest`, íconos (pedidos de arte de § 1.5), `<link>` en `index.html`, botón «Instalar» en Ajustes, rutas absolutas de JS corregidas (A1), CSP | **S** | Lighthouse «Installable»; `npx vite preview --base /NanoBlocks/`; instalar en Chrome y abrir la app instalada |
| **P2** | `tools/generar-sw.mjs`, registro del SW solo en producción, precaché (8.1 MB), sonidos en segundo plano, `navigator.storage.persist()`, estado en Ajustes («Listo para jugar sin conexión») | **S–M** | DevTools → Application → Service Workers y Cache Storage; modo avión: abre, genera un mundo, juega, guarda y recarga; el mundo sigue |
| **P3** | **Actualización:** aviso «Hay una versión nueva», `activar`, `MIN_VERSION` con «Buscar versión nueva», limpieza de cachés viejas | **S** | **Tres versiones seguidas con dos pestañas abiertas** (v1 → v2 → v3): la pestaña vieja sigue jugable; recargar toma la nueva; un mundo guardado en v3 se rechaza con mensaje en v1 y el botón lo arregla; el mundo de v1 abre en v3 |

## Fase 0: costuras (no cambia lo jugable)

- `PROTOCOL_VERSION`; `src/red/` con `validar.js`, `limites.js`, `formato.js` (empaquetado binario) **puros** y probados en Node.
- **`saveWorld` en una sola transacción** (§ 5.1) y su prueba (cerrar entre el `put` del `meta` y el de los chunks no deja un estado mixto).
- `SAVE_FORMAT 7` con `meta.jugadores` y `meta.epoca` (migración y `validarMundo`).
- **`avisar(jugadorId, texto, cat)`**: el bus de avisos por jugador (B.4 #13) sobre el Locutor; los ~970 `ui.toast` de la simulación pasan por él sin cambiar su resultado en solitario.
- `g.remotos` (registro de jugadores remotos, vacío), `jugadorMasCercano(pos)`, `world.red` (bandera), `damagePlayer(…, objetivo)` con el jugador local por defecto.
- Un trozo `red` en `vite.config.js`; `tools/relay-local.mjs`; `tools/revisar-red.mjs`.
- **Pruebas:** `revisar-red.mjs` pasa los mensajes hostiles de la auditoría (campos de más, `NaN`, `Infinity`, cadenas de 10 MB, `{"__proto__":…}`, 1 000 ediciones por segundo) por `validar.js` y `limites.js` con un reloj falso, y verifica que **no cambia ningún estado**; el juego en solitario se juega igual (comparar con una captura del inventario y una noche).

**Tamaño S–M. Riesgo:** ninguno jugable; es la base.

## Fase 1: sala, código y presencia («nos vemos»)

- **Spike previo de un día** con Trystero 0.27.0 (§ 2.1) y decisión «sigue / plan B».
- Pantallas: aviso de privacidad, «Jugar con amistades», abrir sala (código, copiar código/enlace), lista de solicitudes con **Dejar entrar / No / Expulsar / Bloquear**, «Unirse con un código», sala de espera y errores en palabras (§ 2.4).
- Mensajes: `hola`, `acepta`, `rechazo`, `pos`, `jugadores`, `corrige`, `tiempo`, `chat`, `salud`, `expulsa`.
- El invitado genera el mismo mundo local (semilla + `genVersion`; sin cambios de bloques todavía), ve **avatares** (`Avatar`, nombre, arma en mano), **hora y clima del anfitrión** (`Weather` pasivo) y **chat**. **Sin criaturas hostiles ni daño** para los invitados; el anfitrión sigue jugando normal.
- Seguridad completa de conexión: sala larga (A-1), `password` (A-1), aprobación (A-2), versión (A-4), `maxUsers`, `ban`, tope 1 MiB, CSP con `wss:`.
- **Se prueba con dos ventanas** (normal + incógnito, relé local y luego relays reales): entrar, verse caminar, correr, agacharse; `Ctrl+C`/`V` del código; clave equivocada → «el código no es correcto»; un tercer «invitado» con la sala llena; expulsar y volver a entrar (bloqueado); versión distinta (editar `GAME_VERSION` en una copia) → «recargue»; **teletransporte hecho a mano** desde la consola del invitado → el anfitrión lo corrige (A-9) y cuenta; **mensajes hostiles** del cliente de prueba → el anfitrión sigue a 60 fps.
- **Tamaño M. Riesgo:** relays públicos (spike) y el comportamiento de `roles()` (nuevo en 0.27).

## Fase 2: construir juntos (el primer MVP jugable)

- `chunks_pide` / `chunks_dato` (cambios de bloques y bloques con datos en solo lectura), `rompe_inicio`, `bloque`, `bloques`; `world.red = 'cliente'` en el invitado (no corre física).
- Los invitados juegan en **modo creativo local** (bloques ilimitados, sin hambre ni daño) para no sincronizar todavía el inventario: lo que se valida es **alcance, línea de vista, tiempo de rotura (que en creativo es 0), id válido, la celda libre y que no se pise a otro jugador**.
- `fx` de sonido y partículas de bloques ajenos.
- **Pruebas con dos ventanas:** construir una casa entre los dos al mismo tiempo; **dos personas rompiendo el mismo bloque** (gana la primera, la otra ve el estado real); entrar **después** de que el anfitrión construyó (ve todo); poner un bloque a 20 de distancia (rechazado y corregido); 1 000 ediciones por segundo desde la consola (se limita y se expulsa); **el invitado cierra y vuelve** y la obra sigue ahí; el anfitrión guarda y recarga el mundo con la obra de ambos. Medir el tamaño de `chunks_dato` de un mundo grande (el mundo de pruebas con muchas obras) y el tiempo de entrada.
- **Tamaño M. Riesgo:** orden de ediciones y chunks ya modificados al unirse; tope de tamaño de los `mods`.

## Fase 3: fichas, inventario del anfitrión y guardado por persona

- `meta.jugadores` y `ficha` completas; `inv_op`, `inv_estado`, `vida`; `Inventory` espejo en el invitado (las acciones de la interfaz mandan intenciones); recoger y soltar objetos (`id` único, el anfitrión borra y suma en un solo paso); fabricar; comer; **modo supervivencia** para los invitados.
- Guardado cada 5 s y en eventos críticos (§ 5.3); «Fichas guardadas» del anfitrión (archivar, reasignar); respaldo de identidad (§ 5.4).
- **`tools/revisar-inventario-red.mjs` (invariante, B.10.5 punto 8):** cuenta cada tipo de objeto del mundo (fichas + cofres + suelo) **antes y después** de cada escenario (desconexión a media operación, doble clic, mensaje reenviado, cierre del anfitrión) y exige **la misma suma**.
- **Pruebas con dos ventanas:** entregar un objeto a la otra persona; dos manos tomando lo mismo (gana una); desconectar al invitado a media operación (vuelve con lo suyo, nada duplicado); **volver con otro apodo** (misma ficha); **volver desde otro perfil** (ficha nueva, y reasignar con el anfitrión); cerrar la pestaña del anfitrión **en seco** y reabrir (se pierde a lo sumo lo de 5 s); importar el mundo (nueva `epoca`).
- **Tamaño M–L. Riesgo:** el `Inventory` espejo toca muchas pantallas (inventario, mesa, cofre, billetera: 395 referencias a `.inventory`).

## Fase 4: criaturas y combate (la más riesgosa)

- Criaturas **del anfitrión** como títeres interpolados (`mobs`, `mob_ev`); nacimiento y descarga por **unión de jugadores** (B.4 #5, #6); `golpe`; muerte y reaparición por jugador; crédito de bajas; el daño llama a `damagePlayer(objetivo)` con el jugador más cercano.
- **Solo las criaturas que pasan por `atacar()`** (≈ 15 tipos, B.6); **jefes y leyendas solo del anfitrión** (los invitados los ven y los golpean pero no los inician); los cerebros que usan `g.player` directo se revisan **uno por uno** y se dejan en una lista `PENDIENTES_RED` con el archivo; los que no se hayan pasado **no nacen** si hay invitados.
- **Pruebas con dos ventanas:** una Sombra persigue al más cercano y cambia de objetivo cuando el otro se acerca; el invitado muere y reaparece en su cama, sin perder lo guardado; la presión de un jefe se calcula con la víctima correcta; `tools/bot-pelea.js` (en el navegador) con 2 jugadores para ver el equilibrio.
- **Tamaño L. Riesgo:** ≈ 60 cerebros; equilibrio con 2–3 jugadores.

## Fase 5: mundo vivo

- `estacion` (cofre, horno, mesa con cerrojo), `tienda`, fluidos/arena/cultivos solo en el anfitrión y difundidos con el límite de § 4, vehículos con conductor, `dormir` por votación.
- **Pruebas:** dos personas en el mismo cofre (compara-y-cambia); un trueque con confirmación en dos fases; una avalancha de arena que no hunde a la otra persona; los invariantes de F3 repetidos con cofres.
- **Tamaño M–L.**

## Fase 6: historia, jefes en grupo y endurecimiento

- Separar `meta` en «del mundo» y «del jugador» donde haga falta (`progreso`, lista blanca ampliada), logros por persona, escalar la vida de los jefes con el número de jugadores (**decisión de nanoyackson**), portales por votación o apagados, minijuegos de cámara apagados.
- **Cliente hostil de verdad:** un cliente headless (Node, con `rtcPolyfill: werift`, `devDependency`) que se une y manda todo lo de la lista de la auditoría; el anfitrión debe mantener 60 fps y **no cambiar su estado**.
- Telemetría local del tipo de ICE; revisión de los textos de red con `AUDITORIA_PANTALLAS`; guía de usuario (cómo invitar, qué se ve, qué se ve de usted: la dirección de red).
- **Tamaño L.**

**Corte seguro:** F0 + F1 + F2 (**≈ 4 a 5 semanas**, con el spike) ya dan «construir juntos»; F3 agrega ser una persona con su ficha; F4 el combate. Cada corte es estable y reversible.

## Decisiones que quedan para nanoyackson (no las tomé yo)

1. ¿La campaña de la abuela es solo del anfitrión? (propuesto: sí, los invitados ayudan).
2. ¿Quién gana el botín: el que pega o todos? ¿Fuego amigo?
3. ¿Portales: apagados en red o votación?
4. ¿Los invitados nuevos empiezan con el equipo inicial o con «lo que traiga el anfitrión»?
5. ¿La dirección definitiva del juego (para `appId`, `id` del manifiesto y los enlaces)?
6. Clave de Open Relay: ¿una del proyecto o cada anfitrión la suya (recomendado)?
7. ¿Dos pestañas con la misma llave: se desplaza a la primera o se rechaza a la segunda?

## Lo que no se verificó

- **Ninguna conexión WebRTC real**: ni con relays, ni entre dos ventanas, ni con TURN. El spike de la F1 es el primero.
- **Que cada relay acepte los eventos de Trystero** (solo medí conexión).
- **El service worker en el navegador** (el esqueleto de § 1.3 es especificación, no código probado).
- **`_headers` de Cloudflare Pages** y los límites de hosting de B.9 (no re-verificados hoy).
- **Si Metered permite limitar la clave por dominio.**
- **Los porcentajes de gente que necesita TURN en Costa Rica** (sin dato).

**Fuentes (consultadas hoy):** [registro de npm: trystero](https://registry.npmjs.org/trystero) · [Trystero en GitHub](https://github.com/dmotz/trystero) · [docs/signaling.md](https://github.com/dmotz/trystero/blob/main/docs/signaling.md) · [docs/troubleshooting.md](https://github.com/dmotz/trystero/blob/main/docs/troubleshooting.md) · [docs/api.md](https://github.com/dmotz/trystero/blob/main/docs/api.md) · [docs/identity.md](https://github.com/dmotz/trystero/blob/main/docs/identity.md) · [docs/roles.md](https://github.com/dmotz/trystero/blob/main/docs/roles.md) · [MIGRATION.md](https://github.com/dmotz/trystero/blob/main/MIGRATION.md) · [Open Relay (Metered)](https://www.metered.ca/tools/openrelay/) · [web.dev: criterios de instalación](https://web.dev/articles/install-criteria) · [web.dev: manifiesto](https://web.dev/learn/pwa/web-app-manifest) · [web.dev: almacenamiento](https://web.dev/articles/storage-for-the-web) · [web.dev: persistent storage](https://web.dev/articles/persistent-storage) · [MDN: cuotas y desalojo](https://developer.mozilla.org/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria) · [Cloudflare TURN](https://developers.cloudflare.com/realtime/turn/) · [Límites de GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits) · [Límites de Cloudflare Pages](https://developers.cloudflare.com/pages/platform/limits).

*Escrito por la sesión investigadora. Solo lectura: nada del repositorio fue modificado, salvo este documento.*
