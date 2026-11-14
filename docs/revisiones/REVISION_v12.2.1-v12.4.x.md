# Revisión independiente v12.2.1 → v12.4.1 (encargo 24)

Solo lectura: no edité código ni hice commits. Revisé `git diff v12.2.1..v12.4.1` (3 commits: v12.3.0 «Lluvia y verano», v12.4.0 «Pura vida en la finca, parte 1» y v12.4.1 «Séptima revisión»). La v12.4.2 todavía no existe (el último tag es `v12.4.1` y el árbol de trabajo solo tiene `docs/COLA_DE_TRABAJO.md` modificado). Las líneas son del tag `v12.4.1`.

**Lo que corrí:** `tools/revisar-nombres` (319 ítems, 0 problemas), `revisar-recetas` (274 recetas, 0 tapadas, las mismas 2 «para mirar» de siempre), `revisar-datos` (todo en cero), `revisar-fisica` (todo ✔), y tres scripts míos en el scratchpad: la reventa en la feria con la fórmula real de `precioBonito` y `factorDia`, la simulación de la constante de tiempo de `g.cuerpo`, y el conteo de baldosas anterior.
**Lo que NO corrí:** el juego ni el navegador. **`tools/bot-economia.js` no corre en Node**: importa con rutas absolutas del servidor de Vite (`/src/pueblo.js`) y su propia cabecera dice que se usa desde la consola con `npm run dev`, que no puedo abrir. Hice las cuentas de economía a mano con el código real. Todo lo marcado «por confirmar» necesita jugarse.

---

## Los 5 hallazgos más importantes

### 1. La mecedora se cura sin tope: se levanta y se vuelve a sentar (C4)
- **Dónde:** `muebles.js`, `tickMuebles` (la rama de la mecedora): `S.curados` y `S.mece` viven en el objeto `g.sentado`, y `sentarse()` crea uno nuevo en cada sentada.
- **Qué pasa:** el tope de «6 por sentada» (12 hp, 72 s) no limita nada: tocar W y volver a hacer clic en la mecedora empieza otra sentada con `curados = 0`. Cuesta ~1 s por cada 72 s. Además, cada 20 s sentado `S.t` da otro `+1` de vida (rama de la silla), que también corre en la mecedora, y la sentada baja el hambre (`hungerT − dt·0.6`). Sin costo en comida, sin enfriamiento.
- **Cómo reproducirlo:** quedarse con poca vida, sentarse en la mecedora, esperar 72 s, levantarse, volver a sentarse y ver que cura otros 6 corazones. Por confirmar el efecto real en juego.
- **Arreglo:** guardar el contador en `g.meta` (o en `g`) con un enfriamiento global: por ejemplo «máximo 6 curaciones y después 5 minutos sin curar», o una marca de tiempo `g.mecedoraHasta`. También conviene que sentarse con Sombras cerca o recién golpeado no cure (`g.danoT` ya existe: «lo que no es urgente»).

### 2. Cada 20 s sentado, el jugador salta de vuelta a donde empezó (bug de v12.2.0, sigue en v12.4.1)
- **Dónde:** `muebles.js`, `tickMuebles` (misma función): la llegada suave usa `f = min(1, S.t / 0.35)` y `S.t` se pone en **0** cada 20 s (`if (S.t > 20) { S.t = 0; … }`).
- **Qué pasa:** en el cuadro siguiente `f = 0`, así que `b.pos = D` (`S.desde`, el punto de donde se acercó a la silla, hasta 4.6 bloques lejos) y vuelve a deslizarse a la silla en 0.35 s. Es un tirón de cámara cada 20 segundos mientras se está sentado, y en la mecedora, con el balanceo, se nota todavía más. Se introdujo con «sentarse sin saltos» (v12.2.0) y mi revisión 22 lo pasó por alto.
- **Arreglo:** separar los dos contadores: `S.t` para el deslizamiento (no se reinicia) y `S.rest` para los 20 s del descanso. Por confirmar en el navegador (sentarse y esperar 20 s).

### 3. La feria del sábado deja ganar plata en el mismo tramo (reventa de mazorca) (C4)
- **Dónde:** `ui.js:1343` (`feria = … ? 1.25 : 1`) contra `pueblo.js`, `SHOPS.feriante`: **vende** `[268, 6, 2]` (6 mazorcas por 2 colones) y **compra** `[268, 4, 1]` (4 por 1).
- **Cuentas con el código real (`precioBonito`, `factorDia` 0.8–1.25, `K = 500`):** comprar cuesta 0.333 colones por mazorca. El feriante paga, con el 25 % y el mejor `factorDia`, hasta **0.388** por mazorca. En el 43 % de los sábados (123 de 285 simulados) paga más de lo que cuesta: **+16 % por vuelta**, sin tope de existencias y sin que importe la reputación. El resto de las cosechas (269, 275, 276, 377) no dan ganancia contra su precio de venta. La nota de `factorDia` dice «no alcanzan para hacerse rico comprando y revendiendo»; con la feria sí se pierde esa garantía en una cosecha.
- **También:** el precio se calcula al abrir la tienda y no se actualiza; abierta a las 4:59 sigue con el 25 % después de las 5.
- **Arreglo:** que el bonus de feria solo aplique a lo que el jugador **no** pueda comprarle al mismo tramo (quitar `268` de `[268, 6, 2]` o subir su precio los sábados: `sell` × 1.25 también), o recalcular el precio al hacer clic.

### 4. La siesta cura 6 de vida sin límite y puede mover el reloj hacia atrás (C4 «siesta diaria»)
- **Dónde:** `game.js`, `siesta()` (líneas ~1649–1656) y `lieDown(..., this.daylight > 0.4 && !storm)`.
- **Qué pasa:**
  - Cada siesta hace `health + 6` y `time = Math.min(0.48, time + 0.12)`. El tope `0.48` **no distingue** de qué lado está el reloj: con `time = 0.55` (tarde) pasa a `0.48`, o sea **el día retrocede**. Como cualquier cama de día cuenta, se puede repetir la siesta hasta arreglar la vida, y con tarde+tormenta de por medio se estira la luz.
  - La novedad v12.4.0 (`siestaDia`) solo limita **quitar el cansancio** a una vez por día y solo si, después de sumar 0.12, la hora cae entre 0.24 y 0.42: una siesta a las 0.35 deja la hora en 0.47 y **no** quita el cansancio ese día.
  - Sin enfriamiento ni costo: el `+6` ya existía, pero la mecedora (hallazgo 1) y la siesta juntas hacen que casi no haga falta curarse de otra forma.
- **Arreglo:** `this.time = Math.max(this.time, Math.min(0.48, this.time + 0.12))` (que nunca retroceda); chequear `siestaDia` **antes** de sumar tiempo; que la cura de 6 también tenga una vez por día (o un enfriamiento de 3 minutos).

### 5. `despachar()` sigue cargando baldosas después de apagar el horizonte (v12.4.1)
- **Dónde:** `lod.js`, `onTile` llama a `this.despachar()` (línea ~182) **antes** de comprobar `this.want`, y `update()` sale en `if (this.distance <= 0) return;` sin vaciar `this.cola` ni `this.want`.
- **Qué pasa:** al pasar el selector a «Apagado», `setDistance(0)` libera las baldosas (bien), pero la cola vieja (`cola`) sigue llena: cada baldosa que llega del worker dispara `despachar()`, que pide la siguiente de la cola vieja hasta 5 en vuelo. Como `want` también es el viejo, `onTile` las acepta y las agrega al grupo (oculto). Resultado: la GPU vuelve a llenarse (20–33 MB) con el horizonte apagado, justo lo que v12.4.1 quería arreglar.
- **Arreglo:** en `setDistance(d)` con `d <= 0`: `this.cola = []; this.want = new Map(); this.pending.clear();`, y en `onTile`, si `this.distance <= 0` salir antes de `despachar()`.

---

## Resto de hallazgos

### C3 «Lluvia y verano» (`temporadas.js`)

**¿Se puede quedar pegado el «Calor» o el escalofrío?** No de forma permanente. `tickTemporadas` re-aplica el efecto cada segundo con 4–6 s de duración mientras `g.cuerpo` pase el umbral y deja de hacerlo cuando baja. `g.cuerpo` se acerca al objetivo un 5 % por segundo (constante de ~20 s): de −60 a −50 con la cobija (+25) tarda **~10 s**, con fogata (+40) ~6 s. Dos cosas que sí molestan:
- **La cobija «no funciona» durante ~10 s (por confirmar).** `usarCobija` borra `escalofrio`, pero `g.cuerpo` sigue ≤ −50 y el tick de un segundo después lo vuelve a poner. Se ve como «uso la cobija y sigo con escalofrío». Arreglo: aplicar el efecto de la cobija también al valor `g.cuerpo` (por ejemplo `g.cuerpo += 25` de una vez), o acelerar la mezcla cuando hay abrigo.
- **`g.cuerpo` no se reinicia al morir ni al cambiar de modo.** Si se muere congelado a −60, se reaparece con escalofrío de inmediato durante unos segundos. Arreglo: `g.cuerpo = undefined` en la reaparición y al volver a Supervivencia.
- **Convive con `tickFrio`** (`supervivencia.js`): el páramo y las cumbres siguen dando escalofrío por su regla vieja (`g.frio`), además de la nueva. No se contradicen (los dos cuentan fogata y `termal` como abrigo), pero el capote y el sombrero no ayudan en la vieja.
- Termómetro de calor: con el metal puesto (`+8` si ya hace calor) en pleno sol de verano en la costa se pasa de 60 con facilidad (16 + 10 + 35 + 8). Es intencional según el comentario, pero obliga a llevar sombrero de paja en todo verano costero.

**¿El capote de hule pierde la armadura?** Por diseño sí: ocupa `armorSlot: 1` (la pechera) con `points: 0`. Al hacer clic derecho con él en la mano se equipa y la pechera de antes pasa a la casilla de la barra (`game.js` ~1240), así que **no se pierde ninguna pieza**, solo la defensa mientras se lleva. Dos detalles:
- El recorte `+0.25 × mejora` de `armorValue` (`inventory.js` ~163) se aplica a cualquier pieza: si el yunque deja mejorar el capote o el sombrero, ganan defensa aunque se anunciaron «sin defensa». Por confirmar en `yunque.js`.
- El capote seca en la lluvia (el `else if (m > 0)` de `tickMojado` se aplica) y los textos son coherentes. Bien.

**La cobija con usos:** `durability: 5`, `stack: 1`, la barra de durabilidad aparece al primer uso (`fillSlot`). No es reparable por la receta (no tiene `mat`). Cada clic derecho gasta un uso aunque no haga falta (cinco clics seguidos con `useCd 0.8` la consumen en 4 s). Arreglo: no gastarla si ya hay `termal` > 60 o si `g.cuerpo > −20`.

**Aguacero fijo (1:30 a 3) frente a eventos y al clima viejo:**
- `tickTemporadas` excluye `asedio`, `nocheLarga`, `torneo` y `bingo`, pero **no** el huracán (`clima3.js`: `tickHuracan` vuelve a poner `storm` cada cuadro y el aguacero lo pisa un segundo), la sequía, el tsunami, la carrera ni los combates de jefe. Lo más visible: el aviso «El aguacero de las dos» sale en medio de un huracán, y `aguaceroHoy` da el logro «Aguacero de las dos» con una tormenta de huracán. Arreglo: agregar a la lista las banderas de esos eventos (el huracán vive en `meta.huracan`, la sequía en `g.sequia`; los nombres del tsunami y los jefes hay que mirarlos en su archivo).
- `W.set('rain'); W.timer = 120` convive bien con el reloj viejo de `Weather` (cada `set` ya ajusta el temporizador y la intensidad se suaviza). Con `Weather.load` en una partida guardada dentro de la ventana, `aguaceroDia` no se guarda y puede repetir el aguacero una vez más (inofensivo, misma `hash3` determinista).
- En el bioma desierto `g.dry` apaga el efecto visual y el sonido pero el aviso y el logro salen igual.

**Temporadas en mundos viejos sin fecha:** funcionan, porque se derivan de `g.day` (`temporadaDe(day || 1)`) y no se guarda nada nuevo (`SAVE_FORMAT` sigue en 6). Lo que cambia para una partida vieja:
- **La temporada se invierte de golpe al cambiar de 7 a 30 días** (`game.js` ~3460): un mundo en el día 8–14, que era invierno, pasa a verano. En la carga no hay aviso (`alCambiarTemporada` ignora `antes` indefinido).
- **Un invierno entero dura ~10 horas reales** (30 días × 20 min) y `game.js:3013` hace que el cafeto **no dé cereza** en todo ese tiempo (`b.crop === 'cafe' && b.stage >= 2 && invierno → continue`). Con 7 días era una pausa corta; con 30 es medio año del jugador sin café. Por confirmar si es lo que se quiere (el verano trae el papagayo de Guanacaste, `naturaleza3.js:76`, y ahora también dura 30 días).
- `meta.inviernoDesde` solo se escribe al ENTRAR al invierno, así que quien carga en medio de uno nunca recibe «Un invierno completo» de ese ciclo. Menor.

### C4 parte 1 (`economia.js`, `despensa.js`, `muebles.js`, `game.js`)
- **Guarapo:** `AGUA[574] = 4`, `returns: 289`. Se hace con 3 cañas en el trapiche; la miel de caña `cook(575, 2, [574], [289])` devuelve el balde. No está en ninguna lista de compra (revisé `pueblo.js`, `precios.js` y `economia.js`): no se vende, así que no hay reventa. **Pero** `pon([574], [1, 1])` lo pudre a los 2 días y `revisarCasillas` lo reemplaza por `Sobras` y **se pierde el balde** (`{ id: SOBRAS, count }`). Arreglo: devolver también un `289` por cada guarapo podrido.
- **Miel de caña:** 1 guarapo → 2 mieles de 3 de hambre (6 puntos) por 3 cañas. Cuesta más tiempo que una comida común y no se vende: sin exploit.
- **Siesta diaria:** ver hallazgo 4.
- **Mecedora:** ver hallazgos 1 y 2.
- **`bot-economia.js`:** no corre en Node (ver arriba). Hice a mano la única cuenta que importaba (feria, hallazgo 3).

### v12.4.1 (las correcciones de mi revisión 22)
Verifiqué cada una contra el código:

| Hallazgo de la 22 | Estado en v12.4.1 |
|---|---|
| 1. Cojera no impide correr | ✔ `player.js:73` agrega `\|\| this.effects.cojera`. Probado por lectura (por confirmar en juego) |
| 2. Fecha de la comida al juntar | ✔ `juntar()` en `inventory.js` y en los 14 sitios de `ui.js` (todas las uniones de la lista); queda un redondeo, abajo |
| 3. Horizonte en Bajo, ritmo de pedidos | ✔ `alcance()` limita Bajo a 1 536 y `despachar()` repone hasta 5; **con el fallo del hallazgo 5** |
| 4. Fogatas lejanas | ✔ `if (w.isLoaded && !w.isLoaded(x, z)) continue` en `despensa.js:124` |
| 5. Rodar sin poder rodar | ✔ `tryRoll` ya devuelve `true`/`false` (`combate.js:66–73`), `rollIntento` solo se anota en el aire y `intentarRodar()` exige que salga |

- **`juntar()` redondea con `Math.round` y siempre gana la pila grande.** Con una pila fresca de 60 (día 10) y piezas viejas (día 6) agregadas de a una, el promedio da 9.9 y se redondea a 10: las viejas se «rejuvenecen» (hasta llenar los 64 de la pila, unas pocas piezas). En sentido contrario, las frescas absorbidas por una pila vieja quedan viejas. Es un error de menos de 0.5 día; solo se nota amontonando muchas piezas de a una. Arreglo: guardar `dia` fraccionario (sin `round`) y comparar con `Math.floor` al leerlo.
- **`rollPulsado` ya no se lee en ningún lado** (`game.js:551` y `462` lo escriben): variable muerta. Se puede quitar.
- **`rollIntento` queda armado** si se aprieta el rodar en el aire sin que haya caída fuerte; solo vale 0.25 s, así que es inofensivo.
- **`despachar()`**: ver hallazgo 5. Otro borde: usa la `cola` de hasta 0.2 s atrás, así que tras un teletransporte puede pedir 5 baldosas del lugar viejo; se descartan al llegar (`want`), trabajo perdido del worker, no un fallo.
- **`atmosNombre` y `customProgramCacheKey`:** corrige el riesgo que marqué en la 22 (clave por nombre de material). Bien.
- **Aviso de fps:** ahora exige `game.ready` y 20 s (`ui.js`); resuelto.

### Mundos viejos y SAVE_FORMAT
- `SAVE_FORMAT` sigue en **6** y no hay migración nueva; todo lo de v12.3–12.4 son campos opcionales que se leen con `??` (`be.lena ?? 8`, `s.dia ?? hoy`, `meta.fogatas`, `meta.siestaDia`, `meta.inviernoDesde`) o salen de `g.day`. **Un mundo viejo carga bien**, y nada se pudre de golpe (la comida sin fecha toma la de hoy).
- **IDs nuevos:** bloques 653–662 y objetos 561–575 (con 571–573 asignados directo en `ITEMS[…]`). `revisar-nombres` confirma que no chocan.
- **Lo único que cambia sin aviso al jugador con una partida vieja:** la temporada (7 → 30 días, arriba), las fogatas viejas que arrancan con 6 leñas y los fogones con 8 (de la v12.1.0, ya revisada), y el `Calor`/`escalofrío` nuevo con la costa en verano. Conviene un aviso en la pantalla de novedades de la v12.3 («la temporada ahora dura 30 días»).
- No encontré ningún caso donde un mundo guardado en v12.4.x falle al abrirse en v12.2.1 (por si alguien vuelve atrás): los bloques con id desconocido (655–662, `mecedora`, etc.) dan `undefined` en `BLOCKS[id]`, lo que sí rompería el mallador (ver revisión de seguridad C4: mismo riesgo con ids fuera de rango). Es una limitación conocida de no tener «versión mínima» en el guardado. Sugerencia: guardar `meta.minVersion` o un id de bloque máximo y negarse a abrir si el mundo es más nuevo que el juego.

---

## Para la constructora, en orden
1. Mecedora: contador y enfriamiento fuera de `g.sentado` (hallazgo 1) y separar `S.t` del descanso de 20 s (hallazgo 2).
2. Feria: no bonificar lo que el mismo tramo vende (hallazgo 3).
3. Siesta: que el reloj no retroceda, chequear `siestaDia` antes de sumar tiempo y limitar la cura (hallazgo 4).
4. `setDistance(0)`: vaciar `cola`, `want` y `pending`, y que `onTile` no despache con el horizonte apagado (hallazgo 5).
5. Cobija: aplicar el calor a `g.cuerpo` de una vez y no gastar usos de más.
6. Aguacero: excluir huracán, tsunami y sequía; aviso de la temporada de 30 días en las novedades.
7. Guarapo podrido que devuelva el balde; `g.cuerpo` a cero al reaparecer.

*Escrito por la sesión investigadora, solo lectura. Nada de esto se ejecutó en el navegador.*
