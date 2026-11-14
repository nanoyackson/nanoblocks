# Revisión independiente v11.13.5 → v12.2.1 (encargo 22)

Solo lectura: no edité código ni hice commits. Revisé `git diff v11.13.5..v12.2.1` (8 commits, 144 archivos; en `src/`: atmósfera, horizonte, física, fogón y despensa, cuerpo) y cito las líneas **del tag v12.2.1** (`git show v12.2.1:src/...`). El árbol de trabajo ya va en v12.3.0 y algunas líneas se movieron.

**Lo que corrí:** `tools/revisar-fisica.mjs` (todo ✔), `revisar-recetas`, `revisar-nombres`, `revisar-datos` y `revisar-avisos` (sin problemas nuevos), más dos scripts míos en el scratchpad: pruebas de física con `Body` real (pared de 1 bloque, caídas con `dt` grande, empotrado, losas y escaleras) y un conteo de baldosas del horizonte con la misma regla que `FarTerrain.hojas`.
**Lo que NO corrí:** el juego ni el navegador. Todo lo que dice «por confirmar» necesita jugarse.

---

## Los 5 hallazgos más importantes

### 1. La cojera no impide correr (C2) — probable bug, arreglo de una línea
- **Dónde:** `cuerpo.js:95` (`if (fx.cojera) P.sprinting = false`, función `tickCuerpo2`) contra `player.js:72–73` (`Player.update`) y `game.js:2631` / `~2655` (el orden de los cuadros).
- **Qué pasa:** `tickCuerpo2` corre **después** de `p.update` en el mismo cuadro. En cada cuadro `Player.update` vuelve a poner `sprinting = true` (línea 72) y ya usa `SPRINT` para la velocidad (línea 87) antes de que `tickCuerpo2` lo apague. El efecto solo quita el flag para lo que se lea después (el campo de visión, quizá partículas). La velocidad de carrera no cambia.
- **Cómo reproducirlo (por confirmar):** romperse la pierna, curarse con tablilla (sale 🦵 Cojera 180 s) y correr con Ctrl o Mayús + W. Si corre a velocidad de carrera, está confirmado.
- **Arreglo:** en `player.js:73` sumar `|| this.effects.cojera` junto a `this.effects.bala`, que ya hace exactamente eso. Después se puede borrar la línea de `cuerpo.js:95`.

### 2. La fecha de la comida se mezcla al juntar pilas (C1)
- **Dónde:** `inventory.js:28` (`Inventory.add`: junta con la primera pila del mismo `id`) y las uniones de `ui.js`: 1727, 2247, 2266, 2292, 2336 y 2388–2391. Ninguna mira `dia`. `despensa.js:53` (`revisarCasillas`) trata la pila entera con una sola fecha.
- **Qué pasa:** una pila tiene un solo `dia`. Si se recoge carne fresca y ya hay una pila vieja, la carne fresca toma la fecha vieja. Al revés, comida vieja que se junta con una pila fresca se «rejuvenece». Es un riesgo para el jugador: pierde comida buena sin entender por qué.
- **Cómo reproducirlo:** el día 3 tener 4 carnes crudas (buenas 2 días, «pasadas» hasta el 4.º, después podridas) y matar otro animal el día 5. La carne nueva entra a la pila de 4 y toma su fecha (día 3). El día 8 la pila tiene edad 5 y todo se vuelve **Sobras**, aunque la carne nueva solo tenga 3 días y debería seguir «pasada». Con la pila en la barra o en un cofre se ve igual.
- **Arreglo propuesto:** una sola función `juntar(a, b)` que use el **promedio ponderado por cantidad** de `dia` (o la fecha más vieja, si se prefiere castigar). Que `Inventory.add` y las seis uniones de `ui.js` la llamen. Alternativa barata: no juntar si `|dia_a − dia_b| >= 1`, con el mismo costo de código pero más casillas ocupadas.
- **Nota:** `add()` ya ignora `cruda`, `mejora` y `filo` al juntar (error viejo del mismo tipo, no nuevo de v12).

### 3. Horizonte «Muy lejos» en Bajo: 2 401 baldosas y 160 s para llenarlo
- **Dónde:** `lod.js:97` (rama `!this.fina` de `hojas()`), `lod.js:123` (`if (this.inFlight >= 3) break`) y el selector de 4 niveles de `index.html:178`, que no depende de la calidad.
- **Qué pasa (conteo con la misma regla de `hojas`, jugador parado en 517, 233):**

| Calidad | Distancia | Baldosas | Celdas | GPU aprox. |
|---|---|---|---|---|
| Bajo | 768 | 169 | 80 896 | ~11 MB |
| Bajo | 1 536 | 625 | 110 080 | ~15 MB |
| Bajo | 3 072 | **2 401** | 223 744 | ~31 MB |
| Medio+ | 768 | 139 | 142 336 | ~20 MB |
| Medio+ | 1 536 | 187 | 191 488 | ~26 MB |
| Medio+ | 3 072 | 235 | 240 640 | ~33 MB |

  - En Bajo (el modo para máquinas modestas) «Muy lejos» manda 2 401 mallas aparte, o sea 2 401 draw calls por cuadro, más el cálculo de culling. Antes del cambio el máximo era 1 536 (625 baldosas).
  - Los pedidos al worker salen con tope de 3 en vuelo y solo en `update`, que corre cada 0.2 s (`game.js` `farT`). Como `onTile` no pide más al llegar una baldosa, el techo es **~15 baldosas por segundo**: Medio + 3 072 llena en unos 16 s, Bajo + 3 072 en unos 160 s con huecos visibles.
- **Arreglo propuesto:** (a) en Bajo, limitar `farDistance` a 1 536 (o usar el árbol de 256 bloques para las baldosas lejanas); (b) que `onTile` llame a un `despachar()` que reponga hasta 4–6 en vuelo; (c) dejar el tope de 3 solo si el worker se satura (por confirmar con DevTools).

### 4. Las fogatas lejanas se olvidan si su chunk no está cargado (C1)
- **Dónde:** `despensa.js:124–125` (`tickLena`): `const b = w.getBlock(x, y, z); if (!fogatas().has(b)) { delete F[k]; continue; }`.
- **Qué pasa:** `World.getBlock` devuelve AIRE en un chunk no cargado. El filtro de distancia es de 96 bloques, pero con distancia de visión 2–5 chunks (la que usan las máquinas modestas) hay fogatas a menos de 96 bloques cuyo chunk no está cargado. Se las trata como «ya no hay fogata» y se borra su registro de `meta.fogatas`. Cuando el jugador vuelve, `tickFogatas` (`supervivencia2.js`) las registra de nuevo con **6 leñas** y se pierden la leña real, el cronómetro de lluvia y `encendida` (el logro «La fogata no se me apagó»).
- **Cómo reproducirlo (por confirmar):** poner distancia de visión 3, dejar una fogata con 8 leñas y alejarse 60 bloques sin pasar de 96, esperar un par de segundos, volver y mirar cuántas leñas dice.
- **Arreglo:** antes de borrar, `if (!w.isLoaded(x, z)) continue;` (existe en `world.js:130`).

### 5. Rodar «antes de caer» cuenta aunque no se haya podido rodar (C2)
- **Dónde:** `cuerpo.js:15` (`caidaPendiente`: `antes = clock − rollPulsado < 0.25`) y `cuerpo.js:52` (en `tickCuerpo2`: `if (C.antes && !g.roll) import('./combate.js').then(m => m.tryRoll(g))` y luego `resolverCaida(g, true)`). `game.js` solo apunta `rollPulsado` al apretar la tecla, sin saber si el rodar salió.
- **Qué pasa:** si la voltereta estaba en enfriamiento o sin aguante, apretar la tecla poco antes de tocar el suelo igual rebaja el golpe a 40 %. Es una ventaja gratis. Además, al aterrizar se llama a `tryRoll` otra vez, que puede arrancar una segunda voltereta (aguante y enfriamiento otra vez).
- **Otros bordes de la misma función:** `g.caidaPend` no se limpia al cambiar de mundo ni al salir al menú. Si pasa en los 0.25 s del golpe, `!g.ready` lo resuelve con daño en el mundo nuevo. Dos caídas fuertes seguidas pisan la primera (se pierde su daño). Hay una exposición mínima.
- **Arreglo:** que `tryRoll` devuelva `true/false` y `rollPulsado` se guarde solo si tuvo éxito; y poner `g.caidaPend = null` en el mismo lugar donde se limpian los demás estados del mundo (`game.js` ~línea 456).

---

## Respuestas a lo que pidió el encargo

### 1. Atmósfera y calidad
- **¿La migración puede pisar una elección a mano?** Sí, **una sola vez, y a propósito**: `save.js:192–193`. Quien eligió «Bajo» a mano en v12.0.0–v12.2.0 queda en Medio, porque en ese rango no existía `calidadElegida` y no hay forma de distinguir una elección de un valor de fábrica. Es el costo que nanoyackson aceptó. Lo que se elija desde v12.2.1 queda con `calidadElegida: true` (`ui.js:2678–2679`) y se respeta. `personalizado` y cualquier otra opción distinta de «bajo» nunca se tocan.
- **Partidas viejas sin `settingsVersion`:** `(saved.settingsVersion || 1) < 3` las trata como versión 1. Pasan primero por el reinicio de pantalla completa (`< 2`), que ya existía, y después por el `< 3`, así que quedan en Medio, a menos que tengan `calidadElegida`. La migración se hace en memoria y no se guarda hasta que algo toque los ajustes: se repite en cada arranque con el mismo resultado, sin daño.
- **`farDistance`:** `save.js:189` lleva el valor viejo al nivel más cercano. Con empate (por ejemplo 1 152) gana el menor; y un valor como 1 200 sube a 1 536, que cuesta más. No es un bug.
- **`#define` por nivel:** `aplicarDefines` pone `customProgramCacheKey = () => clave`, que **reemplaza** la clave por defecto de three (el texto de `onBeforeCompile`). Hoy funciona porque `opaqueMat`, `waterMat`, `far.mat` y `cloudMat` difieren en `alphaTest`, `side`, `map` y `fog`. Basta que dos materiales de `MeshBasicMaterial` con `vertexColors` coincidan en esos parámetros (por ejemplo, si las nubes pasan a `fog: true`) para que compartan programa y uno muestre el shader del otro. Riesgo bajo; el arreglo es incluir un nombre en la clave: `() => 'cloud|' + clave`.
- **La hora dorada (`time 0.48`)** no me dio errores: `sky.js` sobrescribe `uSunDir` con el mismo vector que `actualizarAtmosfera` (se reparte el objeto `ATMOS` en `domeMat`), así que no se pisan.
- **Aviso de <40 fps** (`ui.js:2685–2692`): no mira `game.ready` ni si el mundo todavía está cargando; durante los primeros 10 s de un mundo nuevo en una máquina modesta puede saltar por la carga y, como `avisoFpsDado` se guarda para siempre, nunca avisa cuando de verdad va lento. Tampoco distingue un tope de 30 fps del navegador (ahorro de batería). Sugerencia: contar solo con `game.ready` y `performance.now() − arranque > 20 s`.

### 2. Horizonte lejano
- **Worker y cola:** `lodworker.js` arma la malla y devuelve `Transferable`s; bien. El problema es el ritmo (hallazgo 3).
- **Quadtree y fundido Bayer:** `onTile` crea un material clonado por baldosa que se solapa (`tapa`); `tick` lo cambia por `this.mat` al terminar el fundido y lo libera con `dispose()`; `quitar` también lo libera. No encontré fuga en el camino normal. `dispose()` libera geometrías, material, worker y saca el grupo de la escena o de `farScene`.
- **Fuga al apagar el horizonte:** `lod.js:118` (`if (this.distance <= 0) return`) sale **antes** de la limpieza. Pasar el selector a «Apagado» solo oculta el grupo y deja las 139–235 baldosas (20–33 MB) en la GPU hasta cambiar de mundo. No es grave, pero se arregla llamando a `quitar` para todas en `setDistance(0)`.
- **Cambio de distancia:** bajar de 3 072 a 768 sí libera lo que queda fuera (`listas()` da `true` si nada lo reemplaza).
- **Cambio de mundo y dimensión:** `game.js:355` y 2123 llaman `far.dispose()`; con `dosPasadas` el cielo vuelve a `scene` (`game.js` ~3276). Correcto.
- **Respuestas a pedidos descartados:** `onTile` ignora las respuestas que ya no están en `pending`, pero el worker igual las calcula. Con 160 pendientes eso es trabajo perdido, no fuga.
- **Detalle visual (por confirmar):** mientras una baldosa fina convive con su madre gruesa (hasta que las cuatro hijas terminan el fundido), las dos dibujan casi a la misma altura y puede verse parpadeo en esa cuarta parte unos cientos de milisegundos.

### 3. Física (`physics.js`)
Probé con el `Body` real, con `dt` de 1/60, 1/20 y 0.25 s:

| Prueba | Resultado |
|---|---|
| Pared de 1 bloque, empuje a 6, 20 y 60 m/s | **No se atraviesa** (queda en x = 2.70) en los 9 casos |
| Caída a 80 m sobre un suelo de 1 bloque | Aterriza en y = 1.00 con los tres `dt` |
| Empotrado a 2.9 / 3.2 en pared de 1 bloque | Sale del lado de donde venía (x = 2.70) |
| Empotrado a 3.5 / 3.8 | Sale al lado +x (x = 4.30): con el centro pasado de la mitad lo saca al lado más cercano, que puede ser el opuesto |
| Losas | Sube y baja sin atascarse; las escaleras de frente con la espalda llena bloquean (esperado) |
| `revisar-fisica.mjs` | todo ✔ |

- **Escalones:** el cambio de `moveAxis` solo ignora bloques que están por encima de los pies (al caer) o por debajo de la cabeza (al subir) con 0.05 de margen. `moveStep` (sube 0.55) sigue igual. No vi regresión.
- **`desatascar` por cuadro:** corre en **todo** `Body.step`, o sea mobs, objetos y bloques que caen. Cuesta un `boxHitsSolid` más por cuerpo y cuadro, aceptable. Pero `this.seguro = {x,y,z}` (`physics.js:136`) crea un objeto nuevo cada vez que no está atascado: con 100 cuerpos son unos 6 000 objetos por segundo. Sugerencia: reusar un solo objeto (`seguro.x = p.x`).
- **Teletransporte enterrado** (`game.js:2574–2575`): si tras 12 bloques sigue atascado, busca desde `y = 126` hacia abajo el primer bloque sólido de esa columna. Eso incluye copas de árboles y techos de construcciones, y el 126 es fijo (revisar `HEIGHT`). No es el ascensor de 100 bloques, pero puede dejar al jugador sobre una copa o un techo. Preferible: la superficie sin hojas, o el spawn.
- **Silla:** `silla` es `solid: false`, así que `desatascar` no la empuja.

### 4. Inventario: la firma de `fillSlot` (`ui.js:749–780`)
- **Cantidad y durabilidad:** la firma es `id|count|mejora|durF.toFixed(3)`. Si cambia solo la cantidad o solo la durabilidad la firma cambia y se rehace la casilla (reusando la `<img>`). No queda ícono viejo.
- **Lo que no cambia la firma y no se ve:** `dia` (la frescura solo se ve en la ficha, que se lee al pasar el ratón), `cruda` y `filo`. Ninguno se dibuja en la casilla, así que no hay desfase.
- **Otros:** `fija` y `calza` se aplican fuera de la firma; el `iconCache` nunca se invalida (ya era así, y el arte se carga antes de arrancar). Si un código externo vacía una casilla con `innerHTML` la firma quedaría vieja; no encontré ninguno que lo haga con `invEls` o `armorEls`.

### 5. Contenido C1 y C2
- **Recetas y nombres:** `revisar-recetas` (265 recetas, 0 tapadas o muertas) y `revisar-nombres` (317 ítems, 0 problemas). Las 2 «para mirar» (hojas de roble y pasto alto) son anteriores a v12.
- **Hueco:** el **guapote** (363) se come y se cocina (`CRUDO_A_COCIDO`) y se echa a perder, pero no hay receta de pescado salado para él (`recipes.js`: `cook(565, 1, [361|362|364, 562])`). Una línea más.
- **Balance por confirmar:** `cook(564, 3, [MEAT, MEAT, 562])` da 3 carnes saladas de 9 de hambre por 2 crudas, o sea 27 contra 18 de la asada, y nunca se echa a perder como ella. Si la intención es «guardar», puede ser 2 por 2.
- **Beber con las manos:** el golpe corta si `P.health < B.vida`; cualquier pérdida de vida lo corta (hambre, veneno), no solo un golpe. Menor.
- **Despertar con susto:** `damagePlayer` llama a `despertarSusto` por **cualquier** daño estando acostado, incluido el de veneno o hambre. Una noche con sangrado o veneno no se puede dormir. Si el golpe llega después del `mid` del `sleepFade`, la noche ya pasó (día, cura, bichos muertos) pero se borra `descansado`. Ventana pequeña. Por confirmar.
- **«La fogata no se me apagó»:** dormir salta la noche sin gastar leña y deja `time = 0.02`; si se encendió antes de ~0.45 el logro se da con un fuego que no ardió. Menor.
- **Tablilla y botiquín:** `sleepNight` sigue quitando `quebrado` con `curaTodo` o la maña `sueno_pesado`, saltándose la tablilla y su cojera. Decidir si es a propósito.
- **Sentarse (`muebles.js`):** la silla ahora llega en 0.35 s moviendo `pos` sin colisión, como antes en un solo cuadro. No empeora.

---

## Lo que sí está bien (para no repetirlo)
- El arreglo del «ascensor» funciona: ninguna de las pruebas de `revisar-fisica.mjs` ni de las mías lo reproduce.
- El horizonte libera memoria al cambiar de mundo y dimensión; el fundido no deja materiales colgados.
- La migración no rompe partidas viejas y se repite sin daño.
- `fillSlot` no deja íconos viejos con cantidad o durabilidad.

## Para la constructora, en orden
1. `player.js:73`: `|| this.effects.cojera` (hallazgo 1).
2. `despensa.js:124`: `if (!w.isLoaded(x, z)) continue;` (hallazgo 4).
3. Función única para juntar pilas con `dia` (hallazgo 2).
4. Horizonte: tope en Bajo, `despachar()` en `onTile`, liberar con distancia 0 (hallazgo 3).
5. `caidaPendiente`: que el rodar fallido no cuente y limpiar `caidaPend` (hallazgo 5).
6. Aviso de fps solo con `game.ready` y 20 s de calentamiento.
7. Reusar el objeto `seguro` y guardar la clave de caché con un nombre por material.

*Escrito por la sesión investigadora, solo lectura. Nada de esto se ejecutó en el navegador.*
