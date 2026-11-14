# Revisión de v12.5.2 → v12.6.0 (tortugas y arrecife)

Sesión investigadora, **solo lectura**. Alcance: `git diff 7b15242..0f8b218` (v12.5.2 «Duodécima revisión» y v12.6.0 «Tortugas y arrecife (C5-B)»). Mientras la hacía llegó la **v12.6.1 «Nidos de la arribada»** (`00989eb`): la reviso también, porque cambia justo lo que se pregunta (nidos con entidad, saqueador, luz, vivero) y lo que dice cada hallazgo vale para **las dos** (lo marco «12.6.0» o «12.6.1»).

**Cómo se hizo:** leí el diff y `arrecife.js` entero; corrí las herramientas del repo (`revisar-version`, `revisar-nombres`, `revisar-recetas`: todas en verde); **corrí el generador real** de mundos con `genVersion` 19 y 20 sobre 16 semillas (3 427 chunks de mar poco profundo) para medir el coral blanqueado; medí el atlas con los pintores reales; y leí el código de `three` 0.170 que sube las texturas. **No corrí el juego** (ni el bot): los exploits son por lectura del código y por la aritmética de las constantes; lo marcado «por confirmar» pide una prueba en la pestaña 1.

## Los 5 más importantes

| # | Hallazgo | Gravedad | Dónde |
|---|---|---|---|
| 1 | **Saqueadores.** (a) En la **12.6.0** se podían farmear: sin tope de capturas por noche (el candado `saqueoDia` solo se activa con dos vivos a la vez) y con los nidos de la lora **sin entidad** (nunca eclosionaban: eran blancos permanentes) salía un saqueador cada ~25 s a 5 u: ≈ 75 u por noche, ≈ 300 u por arribada. (b) **Atraparlos baja la fama** (son `vecino`: `VECINO.onHurt` resta 1 de reputación por golpe), al revés de lo que dice el CHANGELOG. (c) Con la **12.6.1** los nidos eclosionan solos en 4–6 minutos de juego, así que **casi nunca hay un nido sin marcar** cuando llegan los saqueadores (las 4 noches siguientes): la mecánica quedó **inerte** | **Alta** (economía y diseño) | `arrecife.js: tickTortugasArrecife`, `cerebroSaqueador`, `atrapar`; `pueblo.js:534` |
| 2 | **Los fragmentos de coral son infinitos.** El «uno por coral cada 3 días» se guarda por **posición** (`meta.fragCoral["x,y,z"]`) y los corales **se rompen y se vuelven a poner** (caen como ítem, `blocks.js:328–331`): mover el coral a otro lugar da otro fragmento al instante. El fragmento es lo único que limita revivir y los hitos 20/60/150 | **Alta** | `arrecife.js: usarArrecife` (rama «sacar un fragmento») |
| 3 | **Los buzos pagan 10 u al día sin tocar el arrecife.** Basta con haber revivido 60 corales y **estar de día en cualquier playa** (`g.env.biome === 'beach'`), aunque esté a 5 000 bloques de los corales; el pago va directo al inventario y **no suma** con el tope de 40 u de los encargos ni pasa por el cupo del comprador: **se acumula encima** | Media–alta (0.4 jornada al día por caminar a la playa) | `arrecife.js: tickTortugasArrecife` (bloque «los buzos») |
| 4 | **Marcar nidos «que no son de la arribada» sí se puede**, y la estaca **pisa la entidad** del nido natural: cualquier `turtle_nest` (la **baula**, la tortuga verde, los nidos de decoración del Parque Tortuguero) se convierte en nido protegido que paga 0.3 u por tortuguita y cuenta para las 100 de la banderita. Con la 12.6.1, además, **un nido sin marcar ya se resuelve solo** en minutos: la estaca solo agrega la paga y los 5 días | Media | `arrecife.js: usarArrecife` (rama estaca), `fauna.js: tickNests`, `arribada.js` |
| 5 | **La firma de `MIN_IDS` obliga a tocar la firma, no a subir la versión,** y la versión mínima se estampa **igual en todos los guardados**: un ítem cosmético fuerza la firma nueva (correcto), pero nada comprueba que `MIN_VERSION` subió con ella, y un mundo que nunca tocó lo nuevo igual queda bloqueado para un juego anterior | Media (proceso) | `tools/revisar-version.mjs`, `save.js: saveWorld` |

Más abajo: § 2 (generación con `genVersion` 20, **medida**), § 3 (pecera: no hay comodidad infinita), § 4 (regulador y atlas: sin hallazgos graves) y otros detalles.

---

## 1. Exploits

### 1.1 Nidos y tortuguitas

**El tope de 30 u por arribada: aguanta.** `meta.tortugas.pagado` se guarda con el mundo y se pone en 0 solo en `anotarArribada` (cuando se avisa una arribada nueva, `arribadaAviso !== day`). Cada tortuguita paga `min(0.3, 30 − pagado)`, así que **100 tortuguitas** llenan el tope (y la banderita sale en la número 100, `liberadas === 100`, una sola vez).
- **Guardar y cargar no lo reinicia:** `pagado`, `marcados`, `marcadosDe` y `liberadas` están en `meta` y los nidos marcados llevan su fecha de eclosión en la entidad de bloque (se guarda con el chunk). Lo único que no se guarda son las tortuguitas **ya nacidas** (las entidades no se guardan): recargar con tortuguitas en camino las pierde y **no** se paga (nadie gana).
- **Cambiar el día no lo reinicia:** `noche_arribada = day % 14 === 7`: una arribada cada 14 días, una sola vez `anotarArribada` por día (`arribadaAviso`).
- **Dormir** adelanta las 5 noches a propósito (cada sueño es un día): no es exploit, es lo previsto.
- **Límite de marcas:** 12 por arribada (`marcados`, `marcadosDe === M.arribada`). Sin ninguna arribada todavía, `M.arribada` es `undefined` y `ar = 0`: **se pueden marcar 12 nidos en total y nada más** (el contador no se reinicia hasta la primera arribada); el pago de ese caso sale una vez (`!M.arribada` deja pagar hasta 30 u y `pagado` no se reinicia).
- **Posibles 144 tortuguitas a la vez** (12 nidos × 8–12) y el diseño pedía un máximo de 80 vivas: **no hay tope** (cada nido nace con un segundo de diferencia, `return` tras uno por tic). Cada una, si no halla el mar en 30 bloques, busca con 240 `getBlock` por cuadro: con muchos nidos tierra adentro cuesta (**por medir** con el panel de fps).

**Marcar nidos que no son de la arribada (hallazgo 4).** `usarArrecife` acepta **cualquier** `K.turtle_nest` con la estaca en la mano, sin mirar de dónde vino:
- **La baula** (`fauna2.js:159`) y la tortuga verde (`fauna.js:342`) dejan nidos con entidad `{ type: 'nest', hatch }` (3–6 tortuguitas sin pago); la estaca **los reemplaza** por `{ type: 'nido', eclosiona: día + 5, arribada: ar }`, así que pasan al sistema pagado (8–12 tortuguitas y 0.3 u c/u). La baula sale casi cada noche en alguna playa, así que **la fuente de nidos ya no depende de la arribada**: 12 nidos por arribada (14 días) × 10 tortuguitas = el tope de 30 u y las 100 de la banderita en pocas semanas.
- **Los nidos de decoración del Parque Tortuguero** (`parques.js:156`, sin entidad) también se pueden marcar.
- Es poco dinero (30 u por arribada), así que lo dejaría, pero hay que **decirlo**: si «nido de la arribada» es una regla, hay que exigir `be.lora` (que la 12.6.1 ya pone) o `be.type === 'nest' && be.lora`.
- **Con la 12.6.1** la estaca perdió la mitad de su razón: los nidos de la lora llevan `{ type: 'nest', hatch: reloj + 240–360 s, lora: true }` y **`tickNests` los eclosiona solos en 4–6 minutos de juego** (3–6 tortuguitas, sin pago). Marcarlos exige hacerlo **antes** de esos 4–6 minutos, y a cambio se espera 5 noches. **Por probar** que haya tiempo real de marcar 12 (las tortugas ponen durante toda la noche).

### 1.2 Saqueadores (hallazgo 1)
- **¿Aparecen sin arribada? No.** La condición exige `M.arribada` (solo la fija `anotarArribada`, que corre al avisar la arribada) y `hoy ∈ (arribada, arribada + 4]` de noche y en supervivencia, y un `turtle_nest` sin marcar a ≤ 40 bloques (`buscarNido`).
- **¿Se pueden farmear?**
  - **En la 12.6.0, sí.** La tirada es 5 % por segundo mientras haya menos de 2 vivos. `M.saqueoDia = hoy` se asigna solo cuando `hay + 1 >= 2` (es decir, al nacer el **segundo** a la vez); si uno atrapa al primero antes, `hay` vuelve a 0 y **nace otro**. Cada captura paga 5 u (`atrapar`, sin tope). El saqueador sale a 10–16 bloques del nido y tarda unos segundos en llegar: parado junto al nido sale **una captura cada ≈ 25–30 s** (20 s de espera media + el camino) ≈ 5 u cada 28 s ≈ **10 u por minuto**. Una noche de juego dura unos 8 minutos con `daylight < 0.3` → **≈ 80 u por noche, ≈ 320 u por arribada** (4 noches), frente a las **10 u** (2 por playa) que decía el diseño. **Hacía falta un nido sin marcar que siguiera ahí**: en la 12.6.0 los nidos de la lora no tenían entidad y **nunca se iban**: perfecto para el farmeo.
  - **En la 12.6.1, casi no.** Los nidos de la lora eclosionan solos en 4–6 minutos de juego y `tickNests` los pasa a arena; para cuando llega la primera noche con saqueadores (`hoy > arribada`) **ya no queda ninguno**, salvo los de la baula/tortuga verde (cuando coinciden con esas 4 noches) y los del Parque Tortuguero (sin entidad: nunca eclosionan **ni se pierden**, pero los cava el saqueador una sola vez y quedan como arena). Resultado: **la mecánica de los saqueadores, que era la amenaza que justificaba marcar, es hoy casi inalcanzable**.
- **El golpe baja la fama** (contra el CHANGELOG, que dice «sin bajar la fama»): el saqueador es un `vecino` (`spawnMob('vecino')`) y `Mob.hurt` llama a `kind.onHurt`; `VECINO.onHurt` (`pueblo.js:534`) hace `g.meta.reputation -= 1` y suelta una frase de queja. `tickReputacion` (`saberes.js`) anota el cambio en el pueblo más cercano **si hay uno a ≤ 120 bloques**: en una playa cerca de un pueblo, cada captura baja 1 de fama (a ≤ −3, «le cobran más caro» ×1.25); **lejos de los pueblos no pasa nada** (el cambio se pierde). **Arreglo:** que `atrapar` compense con `+1` o que el saqueador sea un mob propio (no `VECINO`) con `onHurt` de «atrapado» y el golpe no cuente como violencia contra un vecino.
- Otras cosas del saqueador: `m.hurtT > 0 || m.health < kind.health` lo «atrapa» con **cualquier daño** (caída, un mob manso que lo empuja, una flecha perdida): no hace falta que lo golpee uno; `pagar(5)` va directo al inventario sin pasar por el cupo ni por el tope de encargos. Los `vecino` normales tienen interacción con clic derecho: el saqueador **se puede «hablar»** con el menú de un vecino cualquiera (nombre «Saqueador de nidos»; revisar jugando qué dice).

### 1.3 Fragmentos de coral y vivero (hallazgo 2)
- **¿Se reinician al cambiar de mundo o al importar?** `fragCoral` y `arrecife` están en `meta` de **cada mundo**: un mundo nuevo empieza de cero, y **importar** copia el `meta` tal cual (el importador no valida estas claves): la copia hereda el mismo cuaderno, no lo reinicia. El vivero lleva su día en la **entidad de bloque** (se guarda y se exporta con el chunk). Nada se reinicia solo: **el problema es otro.**
- **Fragmentos infinitos.** La regla «uno por coral cada 3 días» se anota por **posición** (`F["x,y,z"] = día`). Los corales **caen como ítem al romperlos** (`blocks.js:328–331`: `coral_*` con `tool: 'pickaxe'` y sin `drop`) y se pueden **poner de nuevo** en cualquier sitio. Ciclo: sacar el fragmento (careta y mano vacía) → recoger el coral con el pico → ponerlo a otro lado → otro fragmento al instante. Con un solo coral, fragmentos sin límite. Con ellos, **cada coral blanco** del arrecife se puede revivir (el mundo nuevo tiene miles: ver § 2) y los hitos de 20/60/150 salen en minutos. Hoy el «uno cada 3 días» solo frena al jugador que **no** conoce el truco.
  - **Arreglo:** llevar la cuenta **por coral generado**, no por posición: p. ej. marcar el bloque con una entidad (`be.frag = día`) que **se pierde** si se rompe y vuelve a poner, o **quitar el drop** de los corales (`drop: 0`, como el nido) para que no se puedan mover; o limitar por día global (`meta.arrecife.fragDia ≤ 6`).
- **Revivir cuenta cada vez** (`R.revividos++`), sin distinguir si el coral blanco **es del arrecife** o uno que el jugador puso: el coral blanco **también se puede romper y poner** (`drop` propio) pero revivirlo convierte el bloque, y para repetir hay que conseguir otro blanco: **limitado por cuántos blancos haya** (miles), no por el diseño. Si se quiere un tope, que solo cuenten los blancos **generados** (marca en la entidad o `genVersion`) o que el `drop` del coral blanco sea 0.
- **El vivero** (`be.dia`, 2 fragmentos cada 3 días): la **primera vez** que se toca crea la entidad con `dia = hoy` (hay que esperar 3 días), **no** hay tope de viveros (cada uno ≈ 7 cañas bravas: 0.67 fragmento al día por vivero; 10 viveros ≈ 6.7 al día) y el CHANGELOG 12.6.1 lo limita a «agua encima» con `FLUID[...]`: **cualquier agua cuenta, incluso un charco o una pileta de balde** (no solo el mar, como dice el aviso) y también la **lava** (`FLUID` vale 2): arreglo trivial con `=== 1` y que sea el mar (`SEA`).

### 1.4 Buzos a 10 u al día (hallazgo 3)
- **No se suman al tope de los encargos, lo acompañan.** `pagar(g, 10)` (inventario directo) no toca `meta.encargos2.ganado` (el tope de 40 u del tablón) ni `pagarConCupo` (el cupo del comprador): **se acumulan**. Un jugador al día 20 puede cobrar **40 u de encargos + 10 u de buzos + las ventas de cada puesto**.
- **No dependen del arrecife**: la condición es `R.revividos >= 60`, no estar cerca de los corales ni que los 60 sigan vivos. `g.env.biome` de `beach` u `ocean` basta, y **en el primer minuto del día** (sale en cuanto `!noche`): 10 u (₡5 000) por poner un pie en la playa. Es el ingreso pasivo de mayor relación pago/esfuerzo de lo nuevo (0.4 jornada al día).
- **Arreglo:** que el pago exista solo si el jugador **está a ≤ 40 bloques de un coral revivido** (guardar la lista de posiciones de los revividos: ya se sabe `t.x,t.y,z` al revivir) y con tope de **una vez por día y por arrecife**; o rebajarlo a 4–5 u. El diseño decía «cupo del guía» (`turistas.js`): no está.
- Se paga también en creativo (`tickTortugasArrecife` no mira el modo para los buzos): sin consecuencia (el creativo ya tiene todo), pero la plata queda en la billetera si después se pasa a supervivencia.

### 1.5 Datos importados
`T(g)` y `A(g)` normalizan que `meta.tortugas` y `meta.arrecife` sean objetos, pero **no que sus campos sean números**: con un archivo importado a mano, `pagado`, `liberadas` o `revividos` en `NaN` hacen que `pagar(NaN)` pase el `u <= 0` (porque `NaN <= 0` es falso) y llegue a `darColones(Math.round(NaN))`; y un `be.eclosiona` no numérico hace que `be.eclosiona > hoy` sea falso: el nido nace **de inmediato**. Poner `Number.isFinite` en esos campos, como en el hallazgo del tablón (§ 6 de la revisión 12.4.10–12.4.12).

### 1.6 Otros detalles de uso (no son exploits)
- **`usarArrecife` se come el clic derecho** de `coral_blanco`, `vivero_coral`, `pecera` y `nido_marcado` con **cualquier cosa en la mano** (incluso un bloque): no se puede **poner un bloque contra** esos cuatro (para construir un muelle junto al coral, por ejemplo). Los otros bloques «de uso» (`toggleTo`) dejan poner bloques si el jugador se agacha; aquí no. Arreglo: `if (g.player.sneaking && held && isBlockId(held.id)) return false;` al inicio.
- **El `nido_marcado` recién agregado** en la 12.6.1 se protege de la mano con agacharse, pero **no del fuego, el agua o las explosiones**, y romperlo no borra la entidad (queda un `nido` huérfano que **sigue eclosionando** donde estaba, aunque el bloque ya no esté: `tickTortugasArrecife` no comprueba el bloque, solo cambia a arena si sigue siendo `nido_marcado`). Inofensivo, pero hay que llamar a `setBE(null)` al romperlo (`game.js: breakBlock`), como ya se hace con `turtle_nest`.
- **El saqueador no toca los nidos protegidos** (el objetivo exige `K.turtle_nest`) ✓ y **`finca2.js`** ya no lo acuesta a dormir ✓.

---

## 2. Generación con `genVersion` 20 (medida)

Corrí `Generator(seed, 19)` y `Generator(seed, 20)` sobre **16 semillas** (12345, 777, 2026, … y 1–8), en los chunks de mar poco profundo (`ocean`, entre `SEA − 18` y `SEA − 3`): **3 427 chunks, 2 129 con arrecife**.

| Medida | Resultado |
|---|---|
| Bloques distintos entre v19 y v20 **que no sean coral → coral blanco** | **0** (en los 3 427 chunks): `genVersion` 20 no cambia nada más |
| Corales de color en v19 | **108 955** |
| En v20: de color / blancos | **71 878 / 37 077** (los mismos 108 955 en total) → **34 % blancos** |
| Chunks con arrecife que tienen blanco | **1 396 de 2 129 (66 %)** |
| Fracción de blanco por chunk | mediana **18 %**, p90 **97 %**, máx 100 % (son **parches**: el ruido tiene longitud de onda ≈ 40 bloques) |
| Mundos con arrecife / con parches | 16 de 16 / 16 de 16 (62–119 chunks con blanco por mundo en este muestreo) |

- **Mundos viejos:** `g.version >= 20` falso → **ni un coral blanco**, ni en lo ya explorado ni en lo nuevo que se genere (su `genVersion` queda fija). Entonces **fragmentos, vivero, hitos y buzos no tienen qué restaurar** en un mundo de la v12.5 hacia atrás: la estaca y la pecera sí funcionan, el arrecife no. El texto de ayuda y los avisos (`«con un fragmento… se puede revivir»`) no lo dicen. **Decisión de nanoyackson:** (a) dejarlo así y decirlo en la ayuda; (b) dar una manera de blanquear a mano; o (c) que el mundo viejo, al abrirse por primera vez en esta versión, pueda **subir su `genVersion`** para los chunks que **todavía no** se han generado (hay precedente en la v12.4.7). No lo recomiendo sin medir, pero es lo que da el contenido a los jugadores existentes.
- **Choque con otras estructuras del mar:** como v19 y v20 son **idénticos salvo el color**, **no hay choques nuevos**: cualquier estructura que ya pisaba el arrecife (el naufragio de `seaFeatures` se pinta **después** del bucle de corales y los sobrescribe; las estructuras de `estructuras.js` se aplican encima del terreno) lo sigue haciendo igual. Los corales blancos son **bloques completos** (cubos con `tool: 'pickaxe'`), así que **no abren** ni cierran pasos distintos a los de color.
- **Otros sistemas que ven el coral:** `mar2.js: CORALES()` (cardúmenes y pulpos) **solo mira los 4 de color**, así que un arrecife blanqueado **no atrae peces** ✓ (como pide el diseño: «el coral blanco no cuenta como arrecife vivo»); la nasa de C5-A tendrá que decidir si el coral blanco cuenta para `sirve()` (**por decidir**).
- **El umbral:** la 12.6.0 subió el umbral de `0.15` a `0.22` en la prueba (185 blancos contra 214 de color); mi medida (34 %) coincide con el 35 % del diseño.
- **Detalle de compatibilidad:** `MIN_VERSION` 12.6.0 impide abrir un mundo nuevo (con bloque 697) en un juego anterior ✓.

---

## 3. La pecera
**No da comodidad infinita.** `comodidadAqui` (`fuerza.js`) cuenta **una por clase** (`hay` es un `Set` de nombres de categoría): `['pecera', …]` es **una** categoría, así que 1 pecera o 20 suman **+1** a la comodidad; con el tope de 900 s del descanso (`180 + 60·n`), la pecera vale **60 s** más de «descansado» como mucho. Detalles:
- Una **pecera vacía no cuenta** (`be.pez` ausente → `continue`): bien, y ese `continue` también **salta las demás categorías** de ese bloque (da igual: solo es la pecera).
- **«Pez vivo»**: la pecera acepta `361` (pargo) o `363` (guapote) **crudos** (los de la caña y la nasa): ningún pez está vivo. Solo el texto. Y el pez **se consume**: no se puede recuperar (al romperla, el `be.pez` se pierde).
- **El recuento** barre 11 × 11 × 5 = 605 bloques cada vez que se llama (descansar, dormir): sin problema.

---

## 4. Regulador (12.5.2) y atlas `DataTexture`

### 4.1 ¿Queda algún camino que escriba `settings.calidad`?
**No desde el regulador.** Busqué toda asignación a `calidad` en `src/`:
- `regulador.js`: solo lee `s.calidad`, guarda lo bajado en `game.calidadRegulada` y `game.escalaAuto` (memoria) ✓.
- `ui.js:2727, 2729`: las asignaciones del **jugador** (menú y casillas) ✓; y ahora llaman a `olvidar()` (que además llama a `resize()`) ✓.
- `medidor.js: costo()` (consola): **sí** escribe `s.calidad` y `s.video` **temporalmente** (`'personalizado'`), y los restaura en `finally` ✓ (además la 12.5.2 le agregó `s.perf`). Es síncrona, nada llama a `saveSettings` en medio. Una cosa: `s.perf = true;` se ejecuta **antes** del `try`, pero no hay nada que pueda fallar entre medias.
- `save.js: loadSettings`: las migraciones de siempre.
- **`game.js` (3291):** `flagsDe({ ...settings, calidad: calidadRegulada })` usa una **copia**: la calidad efectiva no toca el objeto guardado ✓.

Pendientes menores (no son escrituras):
- **El resto del juego lee `settings.calidad`, no la efectiva:** `game.js:3227` (el horizonte `fina`), `game.js:3266` (`far.setCalidad`), `ui.js:2724` (clase `sin-blur`) y `lod.js`: solo distinguen «Bajo» de lo demás, así que bajar de Alto a Medio no cambia nada de eso (inofensivo); si algún día distinguen más niveles, hay que pasarles la efectiva.
- **`TOPES = [30, 40, 45, 48, 50]` con ±1.5 y dispersión < 8 %:** una máquina **limitada por la GPU de forma muy pareja** a 40–41.5 fps (justo la zona que sí debería regularse, < 42) se toma por «pantalla con tope» y **no se regula**. Es una banda estrecha: el 40 y el 45 como topes comunes son los dudosos (los refrescos reales son 30/48/50/60…). Podría quitarse el 40 y el 45.
- **«En Ajustes se vuelve a subir»:** para subir hay que **cambiar** la calidad (el menú no emite `change` si se escoge el valor que ya tenía): conviene un botón «Volver a la calidad escogida».
- El regulador **sigue actuando con «Personalizado»** solo en la resolución (`BAJA['personalizado']` no existe): bien.

### 4.2 El atlas `DataTexture`
- **Memoria:** **305 baldosas** → 20 filas de 24 px = 480 → alto **512** (el ancho es 384): **786 432 bytes (0.75 MB)** en RGBA y **≈ 1.0 MB con mipmaps** en la GPU. Queda **un hueco de 31 baldosas** antes de que el alto pase a 1024 (3 MB): con C5–C8 por delante (≈ 40 bloques nuevos de aspecto) **se va a duplicar el alto** hacia C7; sigue siendo poco (**3 MB**), pero conviene saberlo: no es un salto de rendimiento, solo de memoria.
- **La copia en la CPU** (`texture.image.data`, 0.75 MB) se queda mientras viva el juego; se puede soltar tras la primera subida (`atlasTexture.onUpdate = () => { atlasTexture.image.data = null }` **no** sirve porque el cambio de nivel vuelve a subirla). Despreciable.
- **El cambio de nivel funciona:** `three` 0.170 mete `generateMipmaps`, `minFilter`, `anisotropy` y `magFilter` en la **clave de caché** de la textura (`WebGLTextures.getTextureCacheKey`), así que `aplicarNitidez` (que cambia esos campos y `needsUpdate`) **crea una textura nueva con los niveles de mipmap correctos y borra la vieja** (`usedTimes`): sin fugas y sin el problema del almacenamiento inmutable de un solo nivel. Cuesta **una subida de 0.75 MB** por cambio (Alto → Medio por el regulador, Medio → Alto por el jugador): instantáneo.
- **El cambio de mundo:** el atlas es un objeto único del módulo (`atlasTexture`); `World`/`models`/`portones` lo usan **sin** `dispose` (`models.js:111` lo excluye; `world.js:532` solo desecha los materiales) ✓; no se reconstruye. `nitidezActual` sobrevive al cambio de mundo ✓ (no resube).
- **El sangrado de color** (`textures.js: buildAtlas`) se ve bien en el código: cada píxel transparente lleva el color medio de **los opacos de su baldosa** y el alfa en 0; **67 baldosas** tienen píxeles transparentes; **armar el atlas en Node** tarda **28 ms** (sin el costo de los pintores en el navegador). Las baldosas totalmente transparentes caen a `128,128,128` (gris): no importa (nunca se ve).
- `unpackAlignment`/`flipY`/`premultiplyAlpha`: `DataTexture` usa 1, `flipY = false` explícito ✓, y `premultiplyAlpha` en falso ✓ (el negro del lienzo ya no existe). `colorSpace` queda en `NoColorSpace` igual que antes.
- Cosas de `tileImages`/`tileData` (los lienzos de 16×16 para partículas y modelos) **siguen** (≈ 305 lienzos pequeños): no son parte de este cambio.

---

## 5. La firma de `MIN_IDS` (hallazgo 5)

**¿Obliga a subir la versión en cada cambio, aunque sea un ítem cosmético? A tocar `MIN_IDS`, sí; a subir `MIN_VERSION`, no.**
- **Qué se calcula:** `firmaIds()` toma **todos los ids definidos** (bloques sin `air`, ítems con `key`) y saca **cuántos son y un hash FNV-1a de la lista**. Cualquier id nuevo, **aunque sea un adorno**, cambia la firma y la prueba falla con el valor nuevo (hoy `{ bloques: 323, items: 327, hash: 'e6949a85' }`). Renombrar una clave, cambiar un nombre o una receta **no** cambia la firma ✓.
- **Lo que no se exige:** la prueba compara **solo la firma**; no que `MIN_VERSION` haya subido a la vez. Alguien puede copiar la firma nueva y dejar `MIN_VERSION = '12.5.2'`: pasa en verde, y un juego 12.5.2 abriría un mundo con un id que no conoce. **Arreglo en una línea:** guardar junto a la firma la versión que la introdujo (`MIN_IDS = { …, version: '12.6.0' }`) y que la prueba exija `MIN_IDS.version === MIN_VERSION`.
- **¿Es correcto obligar por un ítem cosmético?** Sí en lo de fondo: un ítem nuevo puede quedar en el inventario o en un cofre guardado, y un juego anterior se cae al tocar `ITEMS[id]` (`inventory.js: ITEMS[id].tool`). Lo que **sobra** es la precisión: `saveWorld` estampa `meta.minVersion = MIN_VERSION` en **todo** guardado (`save.js:138`), **haya usado o no** lo nuevo. Un mundo de un jugador que nunca vio una estaca queda igual **bloqueado** para un juego anterior. Eso hoy es aceptable (la PWA actualiza), pero con el aviso de § 1.4 de la especificación (la PWA «congelada» en una versión vieja) significa que **cada versión con ids deja atrás** a quien no actualizó, aunque su mundo no lo necesite.
- **Si quiere más precisión (opcional, no urgente):** estampar `minVersion` **por mundo**, como el mayor entre la versión mínima de base y la de los ids que **de verdad** aparecen: una tabla `DESDE = { 668: '12.6.0', 669: '12.6.0', 1121: '12.6.0', … }` y calcular al guardar el máximo de los ids presentes en el inventario, los cofres y los chunks modificados (`mods`). Es más código; el primer arreglo (la versión dentro de la firma) cuesta una línea y cierra el hueco que importa.
- **Fricción real:** cada versión con ids exige 3 pasos (agregar los ids, correr la prueba, copiar la firma y subir `MIN_VERSION`). Con C5-A, C6, C7 y C8 por delante (≈ 75 ítems), conviene **agruparlos en pocas versiones** (como ya se hizo con EXT_ITEM).

---

## 6. Otros hallazgos de la versión

- **`tickTortugasArrecife` recorre todas las entidades de bloque cada segundo, de noche** (`for [ck, m] of w.blockEntities`, con `w.getChunk` por chunk), además de `fauna.js: tickNests`. Con miles de cofres y puertas es poco (unos miles de iteraciones por segundo) pero **es el único tic nuevo que escala con el tamaño del mundo**: guardar la lista de nidos en `meta.tortugas.nidos` (se llena al marcar) lo haría constante. **Por medir.**
- **Constantes que se repiten:** `arrecife.js` usa `K_UNIDAD = 500` y `COLON = 360` a mano (`plata.js` ya los exporta como `K` y `COLON`): si cambia la escala, se desalinea. Importarlos.
- **`usarArrecife` se llama en cada clic derecho a un bloque** (`game.js:920`): cuatro comparaciones de id por clic: nada.
- **Textos:** «en 5 noches salen las tortuguitas» (la fecha de eclosión es `día + 5` y solo de noche: si se duerme a la noche del quinto día, nace esa misma noche); el aviso del vivero («bajo el agua del mar») no coincide con lo que se comprueba (§ 1.3).
- **Pruebas que declaró el CHANGELOG 12.6.0:** un nido marcado → 12 tortuguitas → 0.3 u; un saqueador que cavó a los 12 s; un fragmento que no se repite el mismo día; la pecera; coral blanco en mundo nuevo. **No dice nada de:** el golpe que baja la fama, los fragmentos moviendo el coral, los buzos en una playa lejana, ni los nidos de la baula. Son las cuatro pruebas que agregaría.
- **`revisar-nombres` y `revisar-recetas`** siguen en 0; `revisar-version` pasa con la firma de la 12.6.0.

## 7. Qué haría la constructora, en orden
1. **Fragmentos:** que el límite no se pueda saltar moviendo el coral (`drop: 0` en los corales y en `coral_blanco`, o entidad que se pierda al mover) y un tope diario de revivir.
2. **Buzos:** atarlos a un coral revivido cercano (≤ 40 bloques) o bajar el pago.
3. **Saqueadores:** decidir qué hacer con la mecánica (con la 12.6.1 casi no aparece: o se deja que los nidos de la lora **esperen a la noche 5** y solo eclosionan si están **marcados**, o se acepta que son solo del Parque Tortuguero/baula); un tope de capturas por noche (`M.saqueados[hoy] ≤ 2`) y **que atrapar no baje la fama**.
4. **Nidos:** exigir `be.lora` para marcar (o aceptarlo y decirlo); `setBE(null)` al romper el nido protegido; vivero solo con `FLUID === 1` y bajo el mar.
5. **`MIN_IDS.version`** junto con la firma, y la prueba que lo exige.
6. **Mundos viejos:** decidir (a), (b) o (c) de § 2.
7. **Importación:** `Number.isFinite` en `meta.tortugas`, `meta.arrecife`, `be.eclosiona`, `be.dia`.
8. **UX:** `usarArrecife` deja poner bloques si el jugador se agacha.

*Escrito por la sesión investigadora. Solo lectura: no se corrió el juego. La medida de `genVersion` 20 y la del atlas salen de ejecutar el generador y los pintores reales en Node; el comportamiento de `three` sale de leer `WebGLTextures.js` (0.170.0); los exploits, de leer el código.*
