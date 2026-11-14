# Revisión de seguridad final — red v12.11.0–v12.15.4 (antes de v13.0.0)

Alcance leído: `src/red/*` completo (validar, limites, sesion, ficha, cofres, reglas, transporte, codigo), manejadores de `pantallas.js`, `index.html` (CSP), manifest. Solo lectura; nada tocado fuera de este archivo.

**Resultado: 0 críticos, 3 medios.** Lo demás revisado está bien (ver «Sin hallazgos»).

## MEDIOS

### M1 — Cofre: el invitado «lava» mejoras, filo y durabilidad (crea ítems mejores que los que tenía)
- **Dónde:** `src/red/cofres.js:42-47` (`cierre` copia `{...s}` de lo que dice el invitado) + `src/red/sesion.js:271` (`ponerCofre(cierreCofre(...))`) + `src/red/cofres.js:16-19` (`permisoDe` toma la mejora/filo máxima del cofre).
- **Explotación:** el invitado mete una espada ⭐1 al cofre y, en `cofre_cierra`, dice que la casilla es `{id, count:1, mejora:50, filo:50}`; `cierre` solo cuenta ids y cantidades, así que las propiedades pasan intactas; al reabrir, `permiso.mejora=50` y `cambioOk` deja subirla a su mochila.
- **Arreglo:** en `cierre`, al armar `sale[i]`, no copiar `mejora/filo/dur/cruda/dia` del invitado: tomarlas de una pila de `antes` con el mismo id, o de la mochila que perdió (`abre`); si no hay, borrarlas. O al menos topar `mejora ≤ max(mejora de antes, de abre)`, `filo` igual y `dur ≤ ITEMS[id].durability`.

### M2 — Cupo farmeable: poner (gratis) y romper (+4) infinitos → ítems comunes de la nada
- **Dónde:** `src/red/sesion.js:369` (`creditoBloque` en cada rotura) y `:365-366` (poner no cuesta nada ni toca el cupo); `src/red/ficha.js:21` (`CUPO_MAX=300`).
- **Explotación:** el invitado repite poner/romper un bloque propio hasta ~10 ops/s (límite `bloque`): +20 de cupo por segundo, topado a 300 que se repone solo, y con ese cupo `cambioOk` le acepta subir en la mochila cualquier ítem no único (diamantes, esmeraldas, etc.) sin receta. El comentario de ficha.js habla de un límite «muy despacio»; con este bucle no es despacio.
- **Arreglo:** acreditar el cupo solo al romper un bloque que no se puso en los últimos N min (guardar en un `Set` por clave `x,y,z` lo que el invitado puso y no acreditar su rotura), o acreditar según lo que ese bloque realmente suelta (`dropDe(actual)`), no un 4 fijo; y bajar `CUPO_MAX` para ítems de valor.

### M3 — Cofre en mundo creativo: pilas del invitado sin validar contra el catálogo
- **Dónde:** `src/red/sesion.js:273` (`else if (dice) ponerCofre(..., dice)`); `validar.js` `limpiaPila` solo valida forma (id 1–65535).
- **Explotación:** en un mundo creativo (`abre === null`) el invitado manda `cofre_cierra` con ids inexistentes o `count` > pila máxima; el anfitrión los guarda y al abrir/dibujar el cofre (`ITEMS[id]` indefinido) puede fallar la pantalla del anfitrión, y el estado inválido queda guardado en su mundo.
- **Arreglo:** pasar `dice` por la misma verificación que `invOk` (`idValido(id)`, `count ≤ maxStack(id)`, `dur ≤ durability`) antes de `ponerCofre`; si alguna pila falla, descartar el cierre y conservar `antes`.

## Sin hallazgos (revisado y correcto)
- **Validación/topes:** lista blanca por tipo, claves exactas, copia nueva, `__proto__/constructor/prototype` rechazados, `pesoOk` con tope y profundidad, `maxReceiveBytes` 1 MiB en Trystero, cubo global de 300 msg/s antes de validar, escalera aviso/expulsión por ritmo.
- **Dirección/identidad:** mensajes del anfitrión con `roles:['admin']` (un invitado no puede suplantarlo); el invitado ignora todo lo que no venga del `anfitrionId`; el remitente sale de `ctx.userId`, no del cuerpo.
- **Ítems/plata:** plata y únicos no suben (`cambioOk`), `rev` descarta fotos viejas, 8 trampas seguidas = expulsión; cofre con candado único, suelta al salir/cerrar/10 min, no duplica por reconexión (`suelta` recalcula con la mochila real).
- **Bloques/golpes:** alcance, `viejo`, `puedePoner/Romper` (sin cofres, hornos, camas, portales), 60 rechazos/10 s = expulsión; golpe con alcance y cadencia en el anfitrión, daño con el arma de la ficha.
- **XSS:** chat vía `textContent`; nombres/cartel con `textoLimpio` (sin `<>&`) y `esc()` en `pantallas.js` (todo `innerHTML` de red escapa nombres y peerId).
- **Llaves/TURN:** la clave de sala no viaja por la red; el userId se valida con `LLAVE`; la API key de TURN solo vive en `localStorage` del anfitrión y solo se usa en un `fetch` (no se imprime ni se exporta en respaldos).
- **PWA:** CSP restrictiva (`script-src 'self'`, sin `unsafe-eval`), manifest sin nada peligroso.

## Nota (no seguridad, funcional)
- La CSP `connect-src 'self' ws: wss:` (index.html:9) **bloquea** el `fetch https://openrelay.metered.ca/...` de `pedirTurn` (`transporte.js`); el TURN opcional fallará en silencio en producción. Si se quiere TURN, añadir `https://openrelay.metered.ca` a `connect-src`.
