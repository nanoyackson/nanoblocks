# Revisión independiente v10.7.0 → v11.6.0

Alcance: `git diff v10.7.0..v11.6.0` (57 archivos, +1821/−485, 9 commits). Revisión solo de lectura, sin correr el juego (el navegador lo usa la constructora). `npx eslint src tools` termina sin avisos. Los números de línea son los de `master` en `a247973`.

Qué se leyó a fondo: `golpes.js`, `anatomia.js`, `armadura.js`, `portones.js`, el diff completo de `entities.js`, `combate.js`, `supervivencia*.js`, `ui.js`, `armasmano.js`, `avatar.js`, `vestidor.js`, `personaje.js`, `lowpoly.js` (loft), `pueblo.js` (gestos), `bravos.js`, `bichos*.js`, `jefes2/3.js` y los puntos de llamada de `atacar`/`aviso*`. Se leyó por muestreo: `modelos-*.js`, `style.css`.

Severidad: crítico (pierde progreso o rompe el juego) · alto (falla visible y reproducible) · medio (comportamiento incorrecto en casos plausibles) · bajo (rincón, cosmética o deuda).

## Resumen

No hay hallazgos críticos. Los guardados viejos están bien migrados: `bolsos`, `fijas` y `consejosVistos` se crean con `||=` y el `meta` se guarda entero, así que no hacía falta subir `SAVE_FORMAT`. El orden de los consejos viejos coincide con el de `consejosVistos`, y la ruta de los ítems recogidos no duplica objetos.

Los problemas reales están en la capa de avisos de combate: uno por cuadro en Don Cornudo, un flag que se queda colgado y avisos que no siguen al ataque.

---

## Hallazgos verificados

### 1. [ALTO] Don Cornudo crea un carril rojo por cada cuadro durante «atrás»
`src/jefes2.js:131`

```js
if (E && E.fase === 'atras') { E.t -= dt; ...; if (E.t <= 0 || b.hitWall) D.emb = { fase: 'escarba', ... }; avisoEmbestida(m, g, 0.8, 18, 2.2); return true; }
```

`avisoEmbestida` queda fuera del `if` de transición, así que corre en cada cuadro de la fase `atras` (1.1 s ≈ 66 llamadas a 60 fps). Cada llamada crea un `PlaneGeometry`, un `MeshBasicMaterial` y una entrada en `g.fxGolpes`, que vive 0.8 s. Resultado:
- Hasta ~48 carriles superpuestos a la vez, con la opacidad sumada (el rojo se ve casi opaco en vez de tenue).
- Cada carril dispara su propio `brilloRojo` (sprite y sonido `armadura.metal`) en su último 0.26 s: unos 66 sonidos metálicos y sprites en poco más de un segundo.
- Costo de CPU/GC en una pelea de jefe.

Escenario: pelear con Don Cornudo a menos de 3 bloques. Se dispara al cumplirse `D.cd <= 0`.

Arreglo: llamar `avisoEmbestida` una sola vez, en la línea de la transición:
```js
if (E.t <= 0 || b.hitWall) { D.emb = { fase: 'escarba', t: 0.8, yaw: ... }; avisoEmbestida(m, g, 0.8, 18, 2.2); }
```
Así el carril solo aparece cuando de verdad empieza a escarbar, igual que en la rama de más abajo (línea 150).

### 2. [MEDIO] Después de un aturdimiento, el brillo de la Arpía y la Tulevieja deja de avisar
`src/arpia.js:34,72` · `src/tulevieja.js:31,45` · interrupciones en `src/combate.js:162`, `src/armas3.js:137`, `src/entities.js:366`

El brillo del amago usa un flag: `if (m.windT < 0.26 && !m.data.brillo) { m.data.brillo = true; brilloAmago(...) }`. El flag solo vuelve a `false` cuando `windT` llega a 0 por su propio camino (línea `m.data.brillo = false; arcoGolpe(...)`). Pero el parry (`best.windT = 0`), «¡Tambalea!» (`m.windT = 0` en `armas3.js`) y el aturdimiento genérico ponen `windT = 0` desde fuera.

Escenario: la Arpía amaga, brilla (flag en `true`), el jugador hace parry o la tambalea. En el siguiente amago `windT < 0.26` ya no emite brillo, porque el flag sigue en `true`. El brillo es justamente la señal del parry, y para el jefe que más se parrea queda mudo hasta que un amago complete su ciclo.

Arreglo: en `arpia.js:72` y `tulevieja.js:45`, donde se asigna `windT = 0.6/0.55`, poner también `m.data.brillo = false`. Más robusto: guardar `m.data.brilloT = ck` y comparar contra el amago actual.

### 3. [MEDIO] El círculo rojo de caída no sigue al salto: el aviso «miente» si el jugador se mueve
`src/bravos.js:441` (puma) · `src/jefes2.js:49` y `:39` (Reina Bananera) · `src/leyendas.js:378` y `:385` (la Mona)

Patrón común: `avisoCaida(g, pl.x, pl.y, pl.z, ...)` dibuja un anillo fijo en la posición del jugador **al empezar** el amago. El salto se calcula después (puma 0.45 s; Reina 0.7 s; Mona 0.5 s) con `dxp/dzp/distP` **actuales**, y el que cae es el jugador donde esté. Si uno esquiva saliéndose del anillo (lo que el anillo enseña a hacer), el salto lo persigue y cae encima de todos modos.

Además en el puma el anillo dura 0.85 s y el agazapado 0.45 s: queda dibujado durante el vuelo.

Arreglo: decidir cuál es la regla de juego. Opción A (recomendada, coherente con el color rojo = «quítese»): fijar el objetivo al empezar (`S.tx = pl.x; S.tz = pl.z`) y saltar hacia ese punto, no hacia el jugador actual. Opción B: que el anillo siga al jugador hasta soltar (como el carril de `avisoEmbestida`) y quede congelado en el último instante. El Mono congo (`monocongo.js:57`) ya lo hace bien: calcula la velocidad en el mismo cuadro del anillo.

### 4. [MEDIO] Los avisos de combate siguen corriendo con el juego en pausa
`src/game.js:2544-2545` (`tickPortones(this, dt); tickFxGolpes(this, dt);`) frente a `:2546` (`this.entities.update(this.paused ? 0 : dt)`)

`entities.update` y casi todo lo demás reciben `paused ? 0 : dt`; `tickFxGolpes` y `tickPortones` reciben `dt` sin protección. Con el menú abierto, la criatura queda congelada a media preparación, pero el brillo (0.26 s), el carril o el anillo expiran. Al reanudar, el enemigo sigue en `atk` y pega sin el aviso que el jugador debía ver. Un portón a medio abrir también se completa en pausa.

Arreglo: `tickFxGolpes(this, this.paused ? 0 : dt)` y lo mismo con `tickPortones`. Con `dt = 0`, `k` no avanza y la función no destruye nada.

### 5. [MEDIO] Abrir y cerrar portones remalla el chunk dos veces, y no se puede solapar
`src/world.js` (`ocultarBloque`) · `src/portones.js:36,50` · palanca en `game.js:1297`

Cada animación llama `ocultarBloque(on)` y `ocultarBloque(off)`, y cada una marca `c.dirty = true`. Con el `setBlock` real son tres reconstrucciones de chunk por apertura. La palanca que abre «todo lo que hay a 5 bloques» multiplica el costo por cada portón o cortina.

Además `c.ocultos` es un `Set`, no un contador. Si el jugador alterna el mismo portón rápido, la primera animación termina y ejecuta `ocultarBloque(false)` mientras la segunda sigue en curso. El bloque vuelve a dibujarse debajo de la pieza animada y parpadea.

Arreglo: usar un `Map` índice→contador, o cancelar la animación previa del mismo `(x,y,z)` antes de crear otra (`g.portones.find(...)`). Para el costo, no marcar `dirty` al ocultar si el `setBlock` ya lo hizo en el mismo cuadro, o agrupar con un solo remallado diferido.

### 6. [MEDIO-BAJO] `meta.bolsos` recorta a 5 y pierde la marca de los más viejos; otros consumidores solo miran el último
`src/supervivencia.js:49` · `src/ui.js:691` · `src/supervivencia.js:96`

`unshift` más `length = Math.min(length, 4)` descarta el bolso más viejo en la sexta muerte. El cofre con las cosas sigue en el mundo, pero sin marca en el mapa ni en la brújula: la pérdida práctica del contenido. Además `ui.js:691` (visibilidad de la brújula en el inframundo) y `deathTip` solo consultan `meta.bolso`, no la lista.

Arreglo: quitar el tope, o subirlo a un número que no se alcance en práctica (por ejemplo 20), o avisar con un toast al descartar. Usar `todosBolsos(g)` en `ui.js:691` y en `deathTip`.

### 7. [BAJO] `golpePend` no se reinicia al cambiar de mundo o morir
`src/game.js:734-753` frente al bloque de reinicio de `game.js:445`

`golpePend` guarda una referencia al mob. `tickGolpePropio` no corre en pausa, así que si se sale al menú con un golpe pendiente (la ventana es de ~0.2 s de juego), al reanudar otro mundo el golpe se resuelve contra el mob del mundo anterior si por casualidad está cerca (`golpeLlega` solo compara posiciones). Efectos: `hurt`, XP, `killedMob` sobre un mob huérfano.

Arreglo: añadir `this.golpePend = null; this.golpeAnim = null;` en el bloque de reinicio (línea 445) y en `respawn()`.

### 8. [BAJO] La mano izquierda de los puñetazos nunca se reconstruye ni se libera
`src/armasmano.js` (`manoIzquierda`)

`g.manoIzq` se crea una vez con `meta.apariencia` del momento del primer jab. Si el jugador cambia de piel o camisa en el vestidor, o abre otro mundo con otra apariencia, la mano izquierda conserva la anterior. No hay `dispose` (geometría y material).

Arreglo: reconstruirla cuando cambie `JSON.stringify(meta.apariencia)` (la misma llave que ya usa `Avatar`) y liberar la anterior.

### 9. [BAJO] Un vecino que entra en conversación, golpe o aguacero se queda con el codo doblado
`src/pueblo.js:~505-513`

`gestoVecino` limpia `a.codoMeta = undefined` al inicio, pero solo se ejecuta en la rama final (`else gestoVecino`). Si el vecino está en `mojandose`, `golpe` o `talk`, esa rama no corre y el `codoMeta` del último cuadro de gesto sigue activo: `doblarCodo` mantiene el codo en esa posición mientras el resto del brazo lo manda otra rama. `m.gesto` también queda a medias y se reanuda después.

Arreglo: al inicio del método (antes de las ramas), cancelar el gesto: `if (m.data.mojandose || m.data.golpe > 0 || m.data.talk > 0) { m.gesto = null; for (const a of u.npcArms) a.codoMeta = undefined; }`.

### 10. [BAJO] «Movimiento tranquilo» no se respeta igual en la interfaz y en el juego
`src/ui.js` (`syncSettings`) frente a `src/game.js` (`settings.calma` en el cálculo de cámara y flotación)

La interfaz activa `body.calma` si `settings.calma` **o** si el sistema pide `prefers-reduced-motion`. `game.js` usa solo `this.settings.calma`. Quien tiene reducción de movimiento en el sistema pero no activó la opción propia ve la interfaz calmada y el temblor de cámara y el oleaje completos.

Arreglo: una función única `calmaActiva(g)` que combine ambas y la usen los dos lados.

### 11. [MEDIO, regla del proyecto] Melee enemigo sin pasar por `atacar()`
`src/armas2.js:140` (helper `ataca` usado en `:162` jaguar viejo, `:172` cocodrilo del Tárcoles, `:203` Terciopelo reina) · `src/caverna.js:73` (Murciélago Rey) · `src/final.js:105` (picotazo del Rey Zopilote)

Estos llaman `g.damagePlayer` directo en el momento en que se cumple la distancia: sin preparación, brillo ni ventana de parry. Son ataques de la misma clase que los que `golpes.js` convirtió. Los de `jefes*.js` y la mayoría de `final.js` ya tienen su aviso propio (carril, anillo, `windT` con brillo), así que no se listan. No son regresiones de este rango (ya estaban así), pero rompen la regla que el rango estableció.

Arreglo: `ataca` de `armas2.js` puede delegar en `atacar(m, g, { dano, causa, alcance, cd: 1.3, alGolpe })` y arreglar los cuatro sitios de golpe. Para `caverna.js:73` y `final.js:105`, envolver en `atacar` con `tipo: 'mordida'`/`'pico'`.

### 12. [BAJO] Código duplicado y muerto que conviene unificar
- `todosBolsos(g)` existe en `supervivencia.js:15`, pero `mapa.js:138`, `ui.js:710` y `encargos.js` repiten `[meta.bolso, ...(meta.bolsos || [])]`. Importar la función.
- `movidaDe` en `armasmano.js` y `movidaEn` en `avatar.js` son idénticas. Exportar una sola.
- `POSES` en `golpes.js` y `POSES3` en `avatar.js` describen poses de brazo casi iguales por tipo de golpe; unificar la tabla evitaría que diverjan.
- Importaciones dobles del mismo módulo en `bichos3.js:12-13`, `bravos.js:7-8`, `leyendas.js` y `monocongo.js` (`import { atacar }` y `import { avisoEmbestida }` separados). Fusionar.
- En `Mob.update` genérico, `windT` ya no lo pone nadie (solo Arpía y Tulevieja lo usan con su propio `update`): las líneas `this.windT = 0` en `:366` y `(this.windT || 0) > 0` en `:375` son inertes para el flujo genérico. Son inofensivas pero confunden.

---

## Por confirmar (no se pudo verificar leyendo)

- **P1. Sombra acechadora, aviso de caída** (`sombras2.js:343`). El `avisoCaida` se coloca en la posición del jugador al armar la «carga» (0.55 s). No se leyó el código del salto posterior. Si re-apunta al jugador, tiene el mismo problema del hallazgo 3.
- **P2. Pájaros con `arms: legs`** (`modelos-aves.js:27`). `brazosDe(u)` devuelve las patas como «brazos». Si algún ave llegara a usar `atacar` sin `tipo` explícito, `tipoPara` elegiría una pose de brazos y rotaría las patas. Hoy las voladoras usan `flyUpdate`, así que probablemente no se dispara; el aturdimiento sí las toca (`poseGolpe` rama stun).
- **P3. Mallas de aviso al descargar un chunk** (`golpes.js:131-135`). Solo se limpian si `q.dead || q.dying`. En la ruta de salida por distancia (`entities.js:~939`) se pone `m.dead = true` antes de `remove()`, así que está bien. Pero `entities.clear()` (`:868-870`) vacía `this.mobs` sin marcarlos `dead`; los carriles activos seguirían hasta cumplir su `dur` (≤ 1.4 s) sobre un mob ya desmontado. Efecto visual de un par de décimas; no se probó.
- **P4. Rendimiento de `Mob.update` fuera de pantalla.** Las adiciones por cuadro (respiración con `u.body.scale.set`, `doblarRodilla` por pierna, `doblarCodo`, `gestoVecino` con `npcArms.every(...)` por vecino) corren para todo mob activo. No se vio si hay un descarte previo por distancia; si lo hay, no pesa.
- **P5. `Avatar.update` en tercera persona** hace `JSON.stringify(meta.apariencia)` y `armor.map().join()` por cuadro (asignaciones). No está en el diff del rango (`apK` y `sig` ya existían), pero conviene cachear por referencia o por un contador de versión.

## Revisado sin hallazgos

- Fugas de geometría/material: `arcoGolpe`, `avisoEmbestida`, `avisoCaida`, `brillo`, `portones` y `vestidor.removePiece` liberan lo que crean. La textura de `brilloTex` es un singleton intencional.
- Migración de guardados: sin problema (ver arriba).
- Divisiones por cero: `tickGolpe` usa `Math.hypot(...) || 1`; `tickFxGolpes` tolera `dur = 0`.
- `parry`: la ventana (0.26–0.34 s antes del impacto) calza con `VENTANA_AVISO = 0.26`. Reaccionar al brillo alcanza si la reacción es menor a ~0.26 s; es ajustado con arma sin escudo, pero no es un error.
- Textos nuevos del juego: sin voseo ni formas de «tú» en las líneas añadidas; sin adjetivos con género sobre el jugador.
- `ItemDrop.unirse` es O(n²) sobre ≤ 300 ítems cada 0.7 s: aceptable.
