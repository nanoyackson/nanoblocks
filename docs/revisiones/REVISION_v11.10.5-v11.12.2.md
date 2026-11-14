# Revisión independiente: v11.10.5 → v11.12.2

Encargo 17. Revisión **solo de lectura** (no se editó nada en `src/` ni `tools/`, sin commits, sin abrir el juego ni el navegador). Lo que está marcado «✅ verificado» lo comprobé **leyendo el código o corriendo un script de Node**; lo marcado «por confirmar» necesita verse en el navegador. Cito archivo + función (las líneas se mueven).

## 0. Alcance y una advertencia de método

- **El tag `v11.10.5` es el commit de la billetera** (`07a4150`). Por eso `git diff v11.10.5..v11.12.2` **no incluye la billetera**: arranca después de ella. La billetera tampoco entró en la revisión anterior (`REVISION_v11.9.2-v11.10.4.md`, que llega hasta v11.10.4). **Para esta zona revisé `git show 07a4150` además del diff pedido**; así quedó cubierta. (Para la próxima revisión conviene pedir `v11.10.4..vX`.)
- Commits cubiertos: `07a4150` (v11.10.5 billetera), `2e053ba` (v11.10.6), `21b28d6` (v11.10.7 chanchito y alfarero), `3ad4ca2` (v11.11.0 brillo), `b768612`/`bbed23c` (v11.11.1–2 «nada flota», la mano agarra), `ae987ac` (v11.11.3 íconos de arte), `3a52bc4` (v11.12.0 inventario), `f2db043` (v11.12.1 teclado/foco/pausa), `5342c9e` (v11.12.2 «que se lea bien»). Las zonas 1 a 6 del encargo están todas cubiertas; v11.10.6 y v11.11.0 solo de pasada (precios.js `premioBaja` y el filtro de brillo no estaban en las zonas).
- Pruebas propias: un script que cruza **552 llamadas literales a `achieve(...)`** contra `logros-lista.js` y `logros.js`; otro que cruza la lista `ARTE` con los PNG de `public/sprites/arte/`. No se corrió el juego.

## 1. Billetera (`inventory.js`, `plata.js`, `supervivencia.js`, `ui.js`, `save.js`)

### Lo que revisé y está bien ✅

- **`reacomodarPlata(total)` conserva el valor.** Vacía las casillas con plata y la billetera, y reconstruye `desglose(total)`. `pagarColones`, `darColones` y `cambiar` lo usan siempre con `colones()` (billetera + casillas), así que **ni pierden ni duplican**. `cambiar(true)` además mete en la billetera la plata que estaba sacada en casillas (suma `sacadas`); `cambiar(false)` solo toca la billetera y deja las casillas.
- **`add()`**: una pieza recogida va a la billetera; un billete viejo (386/387) se convierte con `darColones`; `COLON` sin `extra` también. **`closeInventoryDom` devuelve el cursor con `dropToInventory` → `add`**, así que la plata que quedó en el cursor al cerrar vuelve a la billetera.
- **«Sacar» (`sacarPlata`) y «guardar» (`meterPlata`)**: el clic saca una (Mayús o clic derecho, todas) y devuelve `{id,count}` al cursor sin tocar nada más. **Con el cursor ocupado por otra cosa, el clic sobre una pieza no hace nada** (`pintarDesglose`: `if (this.cursor) { if (!VALOR[this.cursor.id]) return; … }`): no hay intercambio ni pérdida. Con plata en el cursor, el clic en el panel la guarda entera (no hay mezcla de piezas distintas). **No hallé forma de duplicar** arrastrando desde el panel.
- **Caída al morir (`dropBolso`)**: la cuenta se conserva. Después de vaciar las casillas (las que no se quedan), `reacomodarPlata(colones() - suma)` deja `billetera − lo que cae` y las piezas que caen entran al cofre. Si la plata estaba en la casilla de la mano (Normal la conserva), `colones()` la incluye y entra a la billetera sin perderse. El redondeo `Math.round(enB·parte/5)·5` es seguro porque la pieza mínima es 5. Las piezas se empujan **al final** de `items` y caben: 36 casillas + 5 de armadura + 11 denominaciones = 52 ≤ 54 (dos cofres).
- **Migración 3→4** (`save.js`, `MIGRATIONS[3]`): suma billetera + casillas y deja `desglose(total)`; no pierde (cuenta billetes viejos por su valor), y `Inventory.load` hace lo mismo otra vez (idempotente). La 4→5 **no pisa** un `meta.chanchito` que ya sea arreglo.
- **Pagos agachado** (`economia.js banco`, `compas.js peonInteract`, `expediente.js audienciaInteract`): el banco deposita `floor(enBilletera/K)` y **devuelve el sencillo** que no hace una unidad (`darColones`); el compa y la mordida comprueban `count(COLON)` antes de `remove`. Sin pérdida.

### Hallazgos

**B1 (media, diseño): sacar la plata a una casilla la salva de la caída, y la que queda en las casillas se pierde entera.** En Normal (`keep: 'equipo'`) solo cae la mitad **de la billetera**: `dropBolso` recorre primero las casillas y **todo lo que no es la casilla en mano va al cofre completo** (`items.push(s)`), incluida la plata sacada, mientras que la casilla en mano **se queda siempre**. Resultados: (a) un jugador que sabe «Mayús+clic → casilla en mano» **guarda el 100 %** (una casilla aguanta hasta 99 billetes de ₡20 000 = ₡1.98 M); (b) uno que dejó plata suelta en una casilla corriente **pierde el 100 %** de esa parte, aunque la nota de dificultad promete «se cae la mitad». El aviso de la muerte (`deathTip`) solo cuenta `plataCaida` (la de la billetera). *Arreglo sugerido:* en `dropBolso`, tratar toda la plata (billetera + casillas, **incluida la mano**) como una sola cuenta: sumar `colones()`, y que caiga la `parte` del total.
*Verificado leyendo; el caso de la mano en Normal se puede probar con `/give` y morir.*

**B2 (baja): el cursor y la cuadrícula 2×2 no entran en la caída.** `showDeath` no llama a `closeInventoryDom` ni a `exitStation`; con el inventario abierto al morir (el inventario **no pausa**), lo que está en `this.cursor` (también plata sacada con Mayús) y en `this.grid2` **sobrevive a la muerte** y vuelve al inventario al próximo cierre. Es la «puerta trasera» de B1 y además deja `this.station` y el `#cursor-stack` colgados sobre la pantalla de muerte (por confirmar el efecto visual). Con un cofre abierto al morir, **el contenido del cofre no se toca** (verificado: el bolso se arma aparte). *Arreglo:* en `showDeath`, devolver el cursor al inventario **antes** de `dropBolso` (o llamar a `closeInventoryDom` en la muerte) y `exitStation`.

**B3 (baja, por confirmar): conteos mayores al tope de pila.** Con «A monedas» (`cambiar(false)`) un millón de colones son 2 000 monedas de ₡500 en la billetera; «Sacar» con Mayús pone **2 000 en el cursor** (tope de pila 999 según `blocks.js`), y `dropBolso` empuja `{id, count: n}` con `n` sin límite al cofre (billetes: tope 99; pueden pasar de 99 con unos ₡2 M). No encontré dónde se recorta; en un cofre una casilla con `count` 2 000 se verá y moverá, pero **`slotDown` al soltar en una casilla no se probó**: probar «sacar todo de las monedas de 500 con 1 500 piezas y soltar en una casilla vacía y en una con 500».

**B4 (baja): `count(id)` y `remove(id)` de una pieza suelta no ven la billetera.** `count(354)` (billete de 1 000) devuelve 0 aunque estén en la billetera; solo `COLON` está traducido. Hoy ninguna receta pide un billete suelto (busqué usos de `VALOR`/ids de plata fuera de `plata.js`/`inventory.js`), pero cualquier pedido nuevo que lea `count` de una pieza **fallará en silencio**. Dejarlo documentado en `ARBOL_CONOCIMIENTO.md`.

**B5 (info): la plata en cofres no cambia** (migración 3→4 deja billetes viejos como objeto). Un billete viejo sacado de un cofre y movido a una casilla con el ratón **vale lo suyo** (`VALOR` lo incluye en `colones()`) y se cambia en la próxima operación de plata o al guardar y cargar; no se pierde.

## 2. Chanchito (`ui.js openChanchito`, `stations.js`, `estructuras.js`, `alfarero.js`, `misiones.js`)

### Verificado ✅

- **No se pierde ni se duplica al romperlo.** El BE del chanchito es `{ type: 'chanchito', facing }` **sin casillas**; `Stations.broken` (`stations.js`, «Al romper: suelta lo que tenía adentro») lee `be.slots || be.grid || []`, así que **no vuelca nada** y no se rompe (no lanza). El contenido vive en `meta.chanchito` y **no depende de ningún bloque**: romper todos los chanchitos no pierde lo guardado, y colocar otro lo abre. Se guarda con la partida (`meta`). La explosión o lava sigue el mismo camino (sin contenido propio).
- **«Ordenar la casa» / «A cofres cercanos»** recorren `be.type === 'chest'`/`baul`, **no** el chanchito (el tipo es `chanchito`), así que no lo mezclan.
- **`hash3` de los cofres de estructura** (`Ctx.chest`): `hash3(5151, wx, oy+dy, wz) < 1/12` por **posición del mundo**, sin tocar el generador de azar de la construcción (`loot()` consume `rnd()` antes y el chanchito no consume más). Cada llamada a `c.loot(...)` crea un arreglo **nuevo** de 27 con `null`, así que meter el chanchito en `slots.indexOf(null)` **no contamina** otros cofres. Los cofres de `canopy.js` también son arreglos nuevos. Es determinista aunque la estructura se genere en varios chunks. Esperado ≈ 8 % de los cofres de estructura.
- **Abuela** (`misiones.js terminar`): el chanchito solo la primera vez (`historiasHechas[h.id]` se incrementa **después**), y entra con `giveItem` (si la mochila está llena, cae al suelo; no se pierde).
- **Alfarero** (`alfarero.js`): el cobro verifica `count(COLON) < PRECIO` **antes** de `remove`, `A.vendido` impide el doble cobro, `giveItem` no pierde por inventario lleno. `tickAlfarero` corre dentro de `tickLocas` (una vez por segundo, y no pausado), de modo que `QUEDA = 240` son 240 s reales y la probabilidad 1/90 es por segundo. `limpiarAlfarero` está en la limpieza de `game.js` (al salir del mundo) y libera el modelo con `disposeModel`.

### Hallazgos

**C1 (baja): el chanchito vacío del botín no avisa si el cofre está lleno.** Si `slots` no tiene `null` (`indexOf` = −1) simplemente no se agrega; no rompe nada, solo **baja la probabilidad real** de los cofres muy llenos (p. ej. `loot(..., 9)` sobre 27 siempre tiene huecos, así que hoy no pasa). Sin acción.

**C2 (info): el contenido queda inaccesible sin chanchito.** Si se rompen todos y no hay uno en el inventario, lo guardado espera hasta tener otro (alfarero cada ≥4 días, 1 de 12 cofres, la abuela una vez). Es coherente con el texto («no se pierde nunca»), pero conviene que la nota del consejo diga que **hay que conservar uno**.

## 3. Primera persona (`game.js agarrar`/`armMesh`/`rebuildHand`, `combate.js updateShieldHand`, `personaje.js`, `models.js`, `avatar.js`)

### Verificado ✅

- **Costo por cuadro: ninguno nuevo en el agarre.** `agarrar` corre **una vez por objeto** dentro de `rebuildHand` (cuando termina la animación de equipar), no por cuadro. Cada cuadro solo sigue `tintHand` (recorre el `root`, que ahora tiene unos 10 meshes más del brazo: despreciable) y, con escudo, el recorrido de `updateShieldHand`. El costo extra es por **cambio de objeto**: un `armarBrazoMano` (unos 10 tubos y un bulto, con `grano`) más unas matrices; lo medí leyendo, no corriendo; **por confirmar** con `performance.now()` en un cambio rápido de barra (rueda del ratón).
- **Fugas:** `rebuildHand` desecha el `root` anterior recorriendo todo (`traverse`: `geometry.dispose()` y `material.dispose()`, y `map.dispose()` solo si no es `sharedMap`), y el brazo es hijo del `root`, así que **se libera con él**. El brazo del escudo es hijo de `g.shieldMesh`, que se libera con el mismo recorrido cuando cambia de escudo. `Pieza.malla()` crea un material por malla (no compartido): no hay riesgo de desechar un material global. **No encontré fuga de geometría ni de material al cambiar de objeto.**
- **La postura no deriva:** `pose` es un literal nuevo en cada llamada de `rebuildHand`, así que `pose.p[1] += 0.13` no se acumula entre equipamientos. Los hachas (`scale.x = -1`) usan `transformDirection` (la matriz con espejo) y la base `makeBasis` se arma con productos cruz, correcta.
- **Mochila del avatar** (`avatar.js`): `count(447)` por cuadro son 36 casillas, despreciable; la mochila cuelga de `P.body`, y `Vestidor.apariencia` solo quita lo marcado `userData.pj`, de modo que **no se pierde al cambiar de camisa**; se oculta con `visible`.

### Hallazgos

**M1 (baja): la manga del brazo no se actualiza si cambia la pechera con el objeto en mano.** `armMesh` toma el color de `inventory.armor[1]` **al armar**; `rebuildHand` solo corre al cambiar el id del objeto (`id !== this.handHeldId`). Si el jugador se pone o se quita la pechera con la herramienta ya en mano (por ejemplo desde el inventario), el brazo conserva la manga vieja hasta el siguiente cambio de objeto. Igual para el brazo del escudo. Cosmético. *Arreglo:* invalidar `handHeldId = -1` cuando cambie el id de `armor[1]`.

**M2 (info, ya existía): para las herramientas que no son hacha, la postura de «herramienta» se pisa con la de «plano»** (`rebuildHand`: `if (def && def.tool) pose = {…}` y después `if (axe) … else pose = {…plano}`; el `else` pertenece al `if (axe)`). No es del rango (el diff solo agregó `this.agarrar`), pero el agarre se calcula con esa postura final y por eso se ve bien. Dejarlo anotado por si alguien «arregla» la intención.

## 4. Íconos `arte` (`blocks.js ARTE`, `textures.js loadSprites`/`blockIcon`)

### Verificado ✅

- **La lista `ARTE` tiene 43 claves y hay 43 PNG** en `public/sprites/arte/`: ninguna clave sin archivo, ningún archivo sin clave, sin duplicados; los que no aparecen en el texto de `blocks.js` (herramientas `iron_*`, `stone_*`, …) se arman por fórmula, no por literal.
- **Respaldo si una imagen no carga:** `loadImage` resuelve `null` en `onerror` (nunca rechaza), así que `Promise.all` no falla. Con `it.arte` y sin imagen, la rama cae a `nuevoURL[it.icono||it.key]` → `it.sprite` → `paintFlat(it)`, idéntica al orden antiguo; el icono nunca queda vacío. Para los bloques (`arteBloque`), si no carga, `blockIcon` sigue con el cubito isométrico de siempre.
- **No pisa la carne asada:** `cooked_meat` está en `ARTE` y la línea final de `loadSprites` que «cocina» el icono de la carne cruda se salta porque `nuevoURL.cooked_meat` existe (hay `assets/items/cooked_meat.png`). Verificado.
- Costo: `canvas.drawImage` de 128 px a `ICON` una vez por ítem al arrancar; 43 peticiones extra **en paralelo con las demás**; **no hay re-pintado por cuadro**.

### Hallazgos

**I1 (baja): una imagen que falla se nota solo en la consola.** Si un PNG de `arte` no carga (caché, nombre cambiado) el juego cae en silencio al arte viejo; nadie lo ve. *Sugerencia:* un `console.warn` con la clave en la rama de respaldo, y una verificación en `tools/` que cruce `ARTE` con los archivos (el script que usé hace exactamente eso).

**I2 (info): el icono de bloque con arte se dibuja plano, sin variantes.** `iconCache` guarda el `dataURL` por bloque; si `iconURL(id)` se llamara **antes** de que `loadSprites` termine (por ejemplo, una pantalla pintada a medio cargar), el chanchito quedaría cacheado como cubito. `main.js` espera `loadSprites()` antes de abrir el menú, así que hoy no pasa; si alguien mueve esa espera, aparece.

## 5. Inventario v11.12.0 (`ui.js armarFiltros`/`aplicarFiltros`/`sortRange`/`renderRecipes`/`layOut`, `style.css`)

### Verificado ✅

- **`--zoom-ui` y `--s`:** `zoomUI = max(1, min(innerHeight/1080, innerWidth/1920))` (nunca encoge), se actualiza en `resize`. En 4K (3840×2160) da 2 y la casilla `clamp(34, min(6vh, 2.85vw), 58)` queda en 58 → 116 px reales, como dice la nota. Los `max-height` en `vh` se dividen por el zoom (reglas de `#screen-inventory .inv-wrap/.inv-panel/.craft`). En ventanas más bajas que anchas (p. ej. 1280×720) `--zoom-ui = 1`.
- **Filtros mientras se arrastra:** `renderInventory` llama a `aplicarFiltros` y este solo **cambia clases** (`apagada`, `resalta`) sobre las casillas y **reconstruye las pestañas solo si cambia la firma** (categoría activa + conteos). No toca el cursor ni el reparto (`this.drag`), así que arrastrar con un filtro activo **no pierde ni mueve nada**. Con un cofre abierto marca también `stationEls.chest` (y el chanchito, que es un cofre de 27 casillas).
- **`settings.ordenInv`:** `sortRange` lo lee en cada orden; un valor inválido cae a `porCat` (rama por defecto), no rompe. `Inventory.vistos` (para «Recientes») no se guarda: tras recargar queda igual y cae a la categoría (aceptable).
- **Mayús+clic en el recetario:** `vecesMax` usa `min(have(id)/k, maxStack)` con `k` = total del ingrediente en la receta, de modo que con el mismo ingrediente en varias casillas no se pasa; `layOut` devuelve primero lo que había en la cuadrícula y quita `veces` por casilla; si `remove` da menos, la casilla queda con menos y la receta sale en proporción. No encontré duplicación (se resta del inventario lo que entra a la mesa).

### Hallazgos

**V1 (media): las pestañas de categoría, los botones «Ordenar»/«A cofres cercanos»/«Traer receta» y los de cofre solo responden al ratón.** Están armados con `addEventListener('mousedown', …)` (`armarFiltros`, `buildStationArea`), no con `click`: **Tab llega a ellos (son `<button>`) pero Enter y Espacio no hacen nada**. Además **ninguna casilla, receta ni fila de tienda tiene `tabindex`** (no hay ningún `tabindex` en `src/` ni en `index.html`), así que las reglas `.slot:focus-visible`, `.recipe:focus-visible` y `.shop-row:focus-visible` que agregó v11.12.1 **no se activan nunca**. El texto de la versión («Los menús se usan con Tab, Enter y Esc») es cierto para los botones estáticos del menú, pero **no para el inventario, el recetario ni la tienda**, que siguen solo con ratón. *Arreglo:* `click` además de `mousedown` en los botones, y `tabindex="0"` + `keydown` Enter/Espacio en recetas y filas de tienda (el inventario con teclado es otra tanda).

**V2 (media): el selector de orden (`#inv-orden`) atrapa el teclado.** `sel.addEventListener('keydown', (e) => e.stopPropagation())` corta **todas** las teclas, incluidas **Esc** y **E** (cerrar el inventario) y 1–9, y el selector **conserva el foco** después de elegir. Con el selector enfocado, Esc/E no cierran el inventario hasta que se hace clic en otro lado. (El buscador sí lo hace bien: Esc limpia, y al segundo Esc sale con `blur`.) *Arreglo:* `sel.addEventListener('change', () => sel.blur())` y no detener `Escape`/`KeyE`, o hacer `blur` en `Escape`.

**V3 (baja): al reiniciar con «Restablecer todo» el selector no se actualiza.** `btn-settings-reset` borra las claves y copia `DEFAULT_SETTINGS`, pero `ordenInv` **no está en `DEFAULT_SETTINGS`** (queda sin definir → «categoría») y el `<select id="inv-orden">` ya armado **sigue mostrando el valor anterior** (p. ej. «Nombre») mientras el orden real es «Categoría». `syncSettings` no lo toca. *Arreglo:* agregar `ordenInv: 'categoria'` a `DEFAULT_SETTINGS` y volver a poner `sel.value` en `syncSettings`.

**V4 (baja): el filtro persiste entre aperturas y entre estaciones.** `invCat`/`invBusca` viven en `UI`; se ve la pestaña encendida, pero **el texto del buscador y las casillas apagadas al 28 % siguen al abrir otro cofre**: el jugador puede creer que «no hay nada». Y si saca el último objeto de la categoría activa (llevándolo en el cursor), `aplicarFiltros` salta a «Todo» a mitad de arrastre. *Sugerencia:* limpiar el filtro al cerrar (`closeInventory`).

**V5 (info): `/` y Ctrl+F** se atienden en `state === 'inventory'` aunque haya un campo de texto con foco que no detenga la tecla (p. ej. el nombre del cofre, `ui.js` ≈ línea 1526 sí detiene todo con `stopPropagation`, así que ahí está bien).

## 6. v11.12.1–2: foco, pausa de paneles y logros

### Verificado ✅

- **Pausa de mapa, libreta y tienda** (`pausaPanel`/`despausaPanel`): los tres cierres (`closeMap`, `closeLibreta`, `closeShop`) llaman a `despausaPanel`, y esta **solo despausa si el panel fue quien pausó** (`pausoPanel`). `pause()` solo corre desde `state === 'playing'`, o sea que **no puede pisar un panel abierto**. Los otros que ponen `paused = true` (bingo, ermitas, epílogo, modo foto) o no coinciden con un panel o ya cuidan su propio estado. **No encontré una forma de que el juego quede pausado al cerrar un panel**, ni de que se despause algo ajeno en el uso normal.
- **Foco:** `show()` lleva el foco al primer botón (menos inventario y mapa) y `hideScreens()` lo devuelve a quien lo tenía si sigue en la página y no es de otro panel, o lo suelta (`blur`). No quedan botones ocultos con foco que reciban Espacio en la partida.
- **`pause()` guarda solo si pasaron 30 s** (`game.lastSave` es `performance.now()` en los tres lados: coherente).
- **Logros renombrados (39 nombres):** la clave de cada logro es el **id** (`achievements` es un `Set` de ids), así que **las partidas viejas no pierden ni repiten ninguno**. El cruce automático de **552 llamadas literales** `achieve('id','nombre')` contra `logros-lista.js` + `logros.js` dio **0 diferencias de nombre**: cada `achieve` con id conocido dice **el mismo nombre que la lista**. **No queda ningún `achieve` con un nombre viejo** (los nombres antiguos solo sobreviven en el texto histórico de `CHANGELOG`). La libreta muestra el nombre del **catálogo** (el `achTexts` guardado solo se usa para los que no están en el catálogo), de modo que los ya ganados con nombre viejo **se ven con el nombre nuevo**.

### Hallazgos

**F1 (media, por confirmar): al morir el foco salta a «Reaparecer» y un Espacio sostenido lo pulsa.** `showDeath` hace `setTimeout(() => $('#btn-respawn').focus(), 60)` (v11.12.1 «Enter reaparece»). Quien nada hacia arriba, o salta, con **Espacio sostenido** cuando muere (ahogarse, lava, caída al agua): a los 60 ms el botón recibe el foco y los **eventos de repetición de Espacio** caen sobre él; al **soltar la tecla el navegador dispara el clic**, y el jugador **reaparece sin ver la pantalla** (con el aviso del bolso, la distancia y el rumbo de v11.12.2). *Probar:* mantener Espacio al morir ahogado. *Arreglo:* dar el foco con retraso mayor y solo si ninguna tecla está presionada, o poner `tabindex="-1"` y `focus` al primer `keyup`, o ignorar los 400 ms iniciales.

**F2 (baja): `pause()` ya no guarda si se guardó hace menos de 30 s.** Si el jugador pausa y cierra la pestaña dentro de ese lapso, puede perder hasta 30 s de cambios (la ventana `beforeunload` sí avisa cuando hay más de 5 s sin guardar). Antes, pausar **siempre** guardaba. El texto de la pausa dice «Guardado automático cada 30 s», pero el botón «Guardar ahora» sigue ahí. *Sugerencia:* bajar el límite a 5 s (el mismo de `beforeunload`).

**F3 (baja): la distancia/rumbo del bolso parte de `meta.spawn`.** Es correcto mientras `respawn()` siga usando `meta.spawn` (lo usa); si algún día hay cama como punto de reaparición, el mensaje mentirá. Y el eje **+z = sur** del cálculo de rumbo coincide con la brújula del HUD (`ui.js` brújula N en 0), por confirmar con un bolso al sur.

**F4 (baja): los tres logros que no están en el catálogo.** `hervir`, `variado` y `variado5` (en `supervivencia2.js`, `variedad.js`) **no están en `logros-lista.js` ni en `logros.js`**: se ganan y salen en la libreta por su texto guardado, pero **no cuentan en el «N de total»** hasta ganarlos y no aparecen como «🔒 pendientes». Ya era así antes de v11.12.2; se anota aquí porque el encargo pedía revisar el catálogo.

**F5 (info): `confirm()` nativo en «Restablecer todo»** (`ui.js`): con pantalla completa o bloqueo del puntero puede salir feo o suspender el audio en algunos navegadores; el resto del juego usa paneles propios. No es bloqueante.

## 7. Otros detalles vistos de pasada

- **Costo de Novedades:** `renderNews` ahora arma solo 10 versiones («Ver anteriores»); bien, antes eran casi 400 de una vez.
- **v11.10.6 (`precios.js premioBaja`)**: `meta.premioJefe`/`premioDia` se crean con `||=` en el uso, así que los mundos nuevos (que no pasan por la migración) funcionan. ✅
- **`aColones`**: la marca `⁠` en `fmtColones` evita la doble conversión; vigilar que ningún texto nuevo mezcle «₡» con números ya en colones.

## 8. Resumen: los 5 más importantes

1. **V1 — Teclado a medias (media).** Las pestañas, los botones del inventario/cofre y todo el recetario y la tienda siguen con `mousedown`; no hay `tabindex` en ningún lado, así que el CSS de foco de `.slot/.recipe/.shop-row` no sirve y la afirmación «los menús se usan con Tab, Enter y Esc» solo vale para los menús estáticos.
2. **V2 — Selector de orden que atrapa el teclado (media).** `#inv-orden` detiene todas las teclas y conserva el foco: Esc y E no cierran el inventario hasta hacer clic fuera.
3. **B1 + B2 — La caída de plata al morir se puede esquivar y no es pareja (media).** La casilla en mano siempre se conserva y el cursor/2×2 sobreviven a la muerte (el inventario no pausa), mientras la plata suelta en otras casillas se pierde entera; la promesa «se cae la mitad» solo cumple para la billetera. Arreglar tratando todo (`colones()` + cursor) como una sola cuenta.
4. **F1 — Reaparecer con Espacio sostenido (media, por confirmar).** El foco automático a «Reaparecer» a los 60 ms hace que quien muere nadando con Espacio apretado reaparezca al soltarlo, sin leer el aviso del bolso.
5. **B3 — Pilas por encima del tope (baja–media, por confirmar).** «A monedas» + «Sacar todo» pone 2 000 monedas en el cursor (tope 999) y `dropBolso` empuja cuentas sin límite: hay que probar soltarlas en una casilla vacía y en una con piezas.

**Lo que está bien (verificado):** sin pérdida ni duplicación en `reacomodarPlata`/pagos/migración 3→4→5; sin duplicación al arrastrar del panel de la billetera ni al romper el chanchito; arreglos de botín por cofre nuevos (sin contaminación); sin fugas de geometría/material en `rebuildHand`/escudo; las 43 imágenes de arte existen y el respaldo funciona; **0 diferencias** entre `achieve` y la lista de logros y ningún id con nombre viejo; la pausa de paneles no puede quedar pegada.
