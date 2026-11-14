# Ideas de supervivencia y naturalidad

Basado en `docs/PLAN_MAESTRO_21.md`, la parte de supervivencia de `docs/ARBOL_CONOCIMIENTO.md` y el código de `supervivencia.js`, `supervivencia2.js`, `supervivencia3.js`, `player.js`, `fuerza.js`, `muebles.js`, `weather.js`, `clima2.js`, `clima3.js`, `avatar.js`, `entities.js` y `game.js` (`lieDown`, `updateFishing`, `eating`). Solo lectura: nada de esto se probó corriendo el juego. Cada idea nombra los archivos y las funciones donde enchufaría. Las originales son todas; la sátira, si aparece, es contra instituciones ficticias.

---

## 1. Qué hay hoy (el mapa de sistemas)

| Sistema | Dónde | Cómo funciona |
|---|---|---|
| Hambre | `player.js`, bloque «hambre» | `hungerT` sube 0.8 / 1.2 / 3 por segundo (quieto / andando / corriendo) × dificultad; a 45 baja un punto. Con `food <= 0` quita 1 de vida cada 4 s (en Difícil mata; en las demás deja en 1). Curarse exige `food >= 15` y `water >= 6` y cuesta comida. |
| Sed | `supervivencia2.js`, `tickSed` | Un punto cada ≈ 38 s al paso normal; ×1.6 en bosque seco, playa y desierto a pleno sol; insolación sin sombrero. Beber del río: `beberDelRio` (+3, 25 % de «panza» salvo agua celeste); cantimplora de 4 tragos. |
| Fuerza de la comida | `fuerza.js`, `comidaFuerza`, `tickFuerza` | Hasta 3 comidas distintas a la vez dan vida y aguante máximos por 4–9 min. `valor(id)` excluye lo crudo. Repetir una comida rinde menos (lo dice `ayuda.js`). |
| Descanso | `fuerza.js`, `tickDescanso`; `game.js`, `lieDown`/`getUp` | `descansado` tras dormir o estar quieto junto al fuego; dura según la comodidad. Cansancio por noches en vela en `supervivencia3.js`, `tickCansancio` (desde 2 noches). |
| Heridas | `supervivencia3.js`, `quizaSangra`, `usarCura`, `tickHeridas` | Sangrado, garrapatas, `quebrado` (`quizaQuebrar` en `player.js`), necrosis de la terciopelo. Venda, alcohol, suero, tablilla, botiquín. |
| Frío y mojado | `supervivencia.js`, `tickFrio`; `supervivencia3.js`, `tickMojado` | Frío solo en el páramo o sobre y=102, y se quita con `WARM` o con pechera de cuero. `tickMojado`: el agua y la lluvia mojan; mojado gasta más comida y de noche da escalofrío; la fogata seca. |
| Fogata y cocina | `supervivencia2.js`, `cocinarEnFogata`, `CRUDO_A_COCIDO`, `fogataCerca`, `tickFogatas` | La fogata cocina, seca, espanta zancudos. Es un bloque que no se consume. |
| Hierbas | `supervivencia2.js`, `HIERBAS`, `hierbaDeMatorral`, `usarHierba` | Sábila, manzanilla, hierbabuena, jengibre, guaco: cada una quita un efecto. 8 % de caer al cortar matorral. |
| Muerte | `supervivencia.js`, `dropBolso`, `todosBolsos`, `deathTip` | Tres niveles (`tranquilo` / `normal` / `difícil`); el bolso queda en un cofre. |
| Clima | `weather.js`, `clima2.js`, `clima3.js`, `tickTemblor` | Lluvia, tormenta, nieve, rayos, ceniza, sequía de Guanacaste, el huracán «Chepe», temblores. |
| Consejos y avisos | `supervivencia.js`, `tickConsejos`, `tickCuerpo` | Toasts por estado, una vez por bajón. |
| Cuerpo animado | `avatar.js`, `anatomia.js`, `armasmano.js`, `pulido.js` | Rodillas, codos, golpes, gestos de la gente, polvo, ondas, gotas al salir del agua (v10.8–v11.6). |

---

## 2. Dónde hay huecos

**Decisiones que no importan**
- **La fogata y las antorchas no se gastan.** Una vez puestas, duran para siempre: no hay que llevar leña, no se apagan con la lluvia ni de noche. El «campamento» es una decisión de una sola vez.
- **Dormir es gratis.** Se salta la noche entera sin riesgo ni costo más que «no haya Sombras cerca» (`game.js`, `lieDown`). El descanso depende de la comodidad (`fuerza.js`), pero no de lo que pasó ese día.
- **La carga no pesa.** `SLOTS = 36` y el bolso al morir; no hay razón de elegir qué llevar.
- **Nadar no cuesta.** En el agua el jugador va a 0.55 de velocidad (`player.js`) y gasta aire solo con la cabeza adentro; con armadura de hierro nada igual que sin nada.
- **El botiquín cura todo** (`usarCura`, `BOTIQUIN`): una venda que borra once estados. Las demás curas pierden razón de ser.

**Medidores que nunca aprietan**
- **La sed.** El río es gratis y a mano (`beberDelRio`, +3 por clic con la mano vacía); el 25 % de «panza» es el único precio y se cura con manzanilla. Un jugador que vive junto a un río nunca ve la barra bajar de 10.
- **El hambre** aprieta por la regla de curarse (`food >= 15`), pero el jugador que ya tiene una finca llena el estómago de sobra: la comida se acumula sin vencer.
- **El frío** solo existe en el páramo y las cumbres. El calor solo existe como «más sed». En la costa y el valle central la temperatura no es una decisión: es lo mismo de día que de noche.

**Recursos sin uso o con uso único**
- Las hierbas (`HIERBAS`) solo borran un efecto y no se combinan. Con ocho de cada una no pasa nada nuevo.
- La comida cruda cae mal y listo; no hay conservas, ahumado ni salado.
- `AGUA` (tabla en `supervivencia2.js`) tiene 14 bebidas con valores distintos pero ninguna tiene un efecto propio más allá de los puntos de agua.

**Bucles que se agotan pronto**
- Cuando se construye la casa y se llena la despensa, el ciclo diario de supervivencia termina. La historia y el combate siguen, pero el hambre, la sed y el frío dejan de ser un problema.
- El clima tiene sequía, huracán y rayos, pero no hay un calendario de temporadas (lluviosa y seca) que cambie lo que hay que hacer cada mes.

**Transiciones bruscas (animaciones que faltan)**
- **Sentarse:** `muebles.js`, `sentarse()` coloca al jugador en la silla de un cuadro a otro (`p.pos = seat`, `vel = 0`). En tercera persona, `avatar.js` solo conoce `sentado = riding || !!g.parapente` (línea que arma `sentado`): una silla no pone las piernas dobladas.
- **Acostarse y levantarse:** existe la cámara de `lieDown`/`getUp` (`this.cine`), pero en tercera persona el cuerpo se queda de pie; al levantarse el cambio de cámara es abrupto.
- **Agacharse:** `avatar.js`, `this.root.position.set(b.x, b.y - (p.sneaking ? 0.12 : 0), b.z)` baja al avatar de golpe.
- **Beber del río:** `beberDelRio` suma agua, suena un trago y llama a `tocar()`; la mano extendida es la misma que para abrir una puerta.
- **Recoger del suelo:** el drop se encoge hacia el pecho (v11.0) pero el cuerpo no se inclina.
- **Caer:** el aterrizaje dobla las rodillas y hunde la cámara (`landHit`); no hay forma de amortiguarlo con una voltereta aunque `tryRoll` ya exista.
- **Nadar:** brazada en primera persona, pero no hay cambio al entrar de a poco (`tickMojado` y el chapuzón ya existen).
- **Trepar:** no existe; `player.js:132` solo sale del agua «trepando» con un empujón de `v.y = 5.2`.
- **Animales:** solo pastan (`graze` en `Mob.update`). No duermen, no beben, no se resguardan de la lluvia.

---

## 3. Las 20 ideas, por valor ÷ esfuerzo

Tamaños: **S** = menos de una sesión de trabajo, **M** = una sesión larga, **L** = varias. ★ = las 6 que haría primero.

### ★ 1. Rodar al aterrizar (S)
- **Problema:** una caída de 5+ bloques es solo daño (`player.js`, `res.fallDamage`, con la excepción `softLanding`). El jugador no tiene qué hacer al caer.
- **Cómo calza:** al tocar suelo con `vyBefore < -9`, abrir una ventana de 0.25 s; si el jugador pulsa la tecla de rodar (`tryRoll` en `combate.js`) dentro de ella, `fallDamage × 0.4`, `landHit` más suave y animación de voltereta que ya existe (`g.roll`, `g.flipPitch`). Añadir al `softLanding` el caso `g.roll`.
- **Tica:** el logro «Cayó como gato de potrero». Reutiliza el esquive que ya se aprende.

### ★ 2. Señales del cuerpo que se oyen y se ven (S)
- **Problema:** `tickCuerpo` avisa con textos una vez por bajón; hambre, sed y cansancio solo se leen.
- **Cómo calza:** en `supervivencia.js`, `tickCuerpo`, además del toast: con `food <= 6` un sonido de tripas (`audio.play('tripas')`) cada 20–40 s; con `water < 6` aliento áspero y la mano de primera persona con un temblor leve (`handLag` en `game.js`); con `cansado` bostezo y párpados que bajan (ya existe `ui.pestaneo()`). Con `frio > 4` vaho al respirar (`particles.spawn` blanco frente a la cámara).
- **Tica:** «ya me suenan las tripas» en un globito si hay gente cerca (`dialog` de `ui.js`).

### ★ 3. Sentarse y acostarse con cuerpo (S)
- **Problema:** `sentarse()` teletransporta; `lieDown` mueve la cámara pero el avatar no se acuesta.
- **Cómo calza:** en `muebles.js`, `sentarse()` mueve a `g.sentado` con una curva de 0.35 s (`p.pos` interpolado en `tickMuebles`) y, en `avatar.js`, `sentado = riding || !!g.parapente || !!g.sentado` (las piernas ya tienen la pose de montar). `lieDown`: rotar `P.body` a horizontal mientras `g.lying` (el avatar ya existe). Levantarse: invertir con `getUp` (`cine.dir = -1`) y un fundido corto a 0.3 s.
- **Tica:** hamaca con el vaivén ya existente (`hamaca`), más lento al dormir.

### ★ 4. Leña, fogata que se apaga y fogón (M)
- **Problema:** la fogata es eterna, así que acampar no cuesta nada ni obliga a planear.
- **Cómo calza:** guardar combustible en el BE de la fogata (`world.getBE`, como los cofres): `K.fogata` consume 1 de madera o carbón cada 4 min; sin combustible baja a «brasas» (sigue cocinando poco) y se apaga. La lluvia sin techo (`Weather.colTop`) la apaga. `cocinarEnFogata`, `fogataCerca`, `tickFogatas` y `WARM` (en `tickFrio`) deben leer ese estado; `stations.js` ya modela BEs.
- **Tica:** «fogón de leña» como mejora de la fogata (con piedras y olla), con una receta de la abuela que solo se aprende ahí (`saberes.js`).

### ★ 5. Conservas: ahumar, salar y comida que se echa a perder (M)
- **Problema:** la comida se acumula para siempre; nadie se preocupa por lo que lleva. Lo crudo solo «cae mal».
- **Cómo calza:** cada comida perecedera lleva en su `extra` (ya viaja en `inventory.add(id, count, dur, extra)`) el día en que se hizo, redondeado al día para que siga apilándose; pasados N días pasa a «pasado» (sirve menos, y a veces cae mal, como el agua del río). Ahumar (en la fogata, sobre `CRUDO_A_COCIDO`) y salar (con sal sacada del mar, un ítem nuevo) alargan la vida. `fuerza.js`, `valor()` ignora lo pasado; `comodidad.js`, `fichaItem`, muestra «se echa a perder en 3 días».
- **Tica:** chicharrones, carne ahumada, pescado salado de la costa, «ceviche del día» que solo dura hoy.

### ★ 6. El cuerpo y la temperatura, con ropa (M)
- **Problema:** el frío es un parche del páramo; el calor es solo sed.
- **Cómo calza:** un valor `g.cuerpo` de -1 a 1 que suma: bioma y hora (`weather.js`, `tickFrio` y el factor `calor` de `tickSed`), `g.mojado` (ya existe en `tickMojado`), `WARM`/sombra, y la ropa (`ABRIGO`, `METAL`, y piezas nuevas: sombrero de paja, capote). `escalofrio` y la insolación se activan con este valor; `tickFrio` pasa a ser solo el caso extremo. Un icono pequeño junto a los efectos (`renderEffects`).
- **Tica:** capote de hule para el aguacero de las dos; sombrero sabanero (ya existe como `mat: 'sabanero'` en `armadura.js`) contra el sol.

### 7. Beber con las manos y tragos contados (S)
- **Problema:** `beberDelRio` es un clic que suma agua con la misma mano de abrir puertas.
- **Cómo calza:** al apuntar a agua, agachar la cámara 0.15 (`landHit`-like), juntar las dos manos (`manoIzquierda` de `armasmano.js` ya existe para el jab) y repetir 3 tragos de 0.4 s con `beber(g, 1)`; en tercera persona, agachar el avatar (idea 14). Con la cantimplora, mostrar el nivel (`dur`) subiendo.
- **Tica:** sonido de «agüita fresca» distinto en el río celeste.

### 8. La lluvia sobre el zinc (S)
- **Problema:** la lluvia que no cae bajo techo suena igual con cualquier techo; el zinc (id 191, `K.zinc`) es un símbolo tico.
- **Cómo calza:** `Weather` ya calcula el bloque que tapa (`colTop`): si es `zinc` o `lamina_metal`, bajar el volumen de gotas y subir un loop de repiqueteo metálico (`audio.setEmitter`); las goteras (techo de otro material con un hueco) humedecen: `tickMojado` ya lee `techo`.
- **Tica:** «el aguacero de las dos» sonando en el rancho; el programa de la tele (`CANALES` de `muebles.js`) ya bromea con él.

### 9. Agacharse, levantarse y recoger con el cuerpo (S)
- **Problema:** `this.root.position.set(b.x, b.y - (p.sneaking ? 0.12 : 0), b.z)` baja al avatar de golpe; recoger un ítem no inclina nada.
- **Cómo calza:** en `avatar.js`, suavizar con `k()` el descenso (ya hay un helper de suavizado) y, cuando un `ItemDrop` pase al estado `recogido` (`entities.js`), inclinar `P.body.rotation.x` 0.3 durante 0.25 s con el brazo derecho estirado (`tocar()` ya existe para la mano en primera persona).
- **Tica:** ninguna; es oficio.

### 10. Cojera y convalecencia (M)
- **Problema:** una pierna quebrada solo ralentiza; el botiquín (`BOTIQUIN`) limpia todos los estados a la vez.
- **Cómo calza:** con `quebrado`, el avatar y las criaturas con piernas cojean (`doblarRodilla` con una fase asimétrica); la cámara sube y baja a un lado. Tras curarse, queda `convalecencia` 3 min (regeneración mínima, no se puede correr). El botiquín deja de borrar `quebrado`: lo cura la tablilla (`TABLILLA`).
- **Tica:** la abuela escribe una carta de reposo en el cuaderno (`cuaderno.js`).

### 11. Animales con rutinas: duermen, beben, se resguardan (M)
- **Problema:** `Mob.update` solo tiene `graze`; el campo es un decorado que se ve igual de día y de noche.
- **Cómo calza:** en `entities.js`, la rama `!this.kind.hostile`: de noche (`g.daylight < 0.3`), los pacíficos buscan un sitio y se echan (`body.rotation`, `head` abajo, respiración lenta ya hecha en v10.9); junto al agua, bajan la cabeza a beber (`headPitch`); con lluvia fuerte, se resguardan bajo hojas o techo. Las criaturas tienen `head` y `legs` normalizados (`golpes.js` ya depende de eso).
- **Tica:** el perezoso duerme colgado de día, la danta se revuelca en el lodo, las gallinas se recogen al anochecer.

### 12. Antojos del día (M)
- **Problema:** `comidaFuerza` premia comer distinto, pero no hay razón para escoger un plato.
- **Cómo calza:** cada mañana, `meta.antojo = id` de una comida que la persona ya haya probado; comerla ese día da +1 de fuerza o no gasta una de las 3 casillas. El texto sale en `#objetivo` o en el diario (`diario.js`). Repetir tiene la penalización ya existente.
- **Tica:** «hoy se me antoja un gallo pinto con huevo»; los vecinos de `gente.js` piden lo mismo.

### 13. La botica de la abuela: infusiones (M)
- **Problema:** `HIERBAS` se gasta de una en una; con `usarHierba` cada hierba hace una sola cosa.
- **Cómo calza:** en una olla sobre la fogata (`usarOlla`, `olla_caliente` en `game.js`) se mezclan 2 hierbas y agua: «agua de manzanilla con jengibre» da calor y buen sueño (`descansado` más largo). Las mezclas se aprenden del cuaderno (`cuaderno.js`, `PAGINAS`) y de `saberes.js`.
- **Tica:** agua dulce de tapa de dulce y jengibre; «agua de sapo» ya es receta.

### 14. Nadar con costo, resaca y carga (M)
- **Problema:** nadar es gratis y la playa (`tickResaca` en `game.js`) ya tiene un peligro, que nadie evita porque no gasta nada.
- **Cómo calza:** `g.stamina` baja nadando (usa `spend()` de `combate.js`); la armadura de hierro o `METAL` aumenta el gasto y, con aguante en cero, `air` baja más rápido. El avatar pasa de estar parado a horizontal al nadar (`surfK` ya existe para surf).
- **Tica:** los salvavidas ficticios de «Guardacostas del Pacífico» (institución inventada) con un cartel de playa.

### 15. Despertar con sobresalto (S)
- **Problema:** `lieDown` no se interrumpe más que con Sombras cercanas (`game.js`, antes de acostarse); si empieza un asedio con el jugador durmiendo, no pasa nada especial.
- **Cómo calza:** en `getUp`, si el motivo es un golpe, un cencerro o un asedio (`asedio.js`), levantarse con un salto de cámara de 0.4 s, `pestaneo` inverso y un toast «¡Qué susto!». Sin sueño, `descansado` no se otorga.
- **Tica:** el cencerro de la finca (ya hay cencerros en `asedio.js`) como despertador.

### 16. Mesa servida (S)
- **Problema:** los platos (`platos.js`, `llenarPlato`) no cambian cómo se come.
- **Cómo calza:** comer sentado (`g.sentado`) a una mesa de comedor con un plato (`plato_vacio` lleno) dobla el efecto de `fuerza.js` y calma el hambre un 15 % más, y mueve al avatar a la pose sentado de la idea 3. La mesa ya existe en `muebles.js` (`MUEBLES`).
- **Tica:** el casado se come sentado; el «fiado» (`economia.js`) se anota si se come en una soda.

### 17. Ruido y sigilo con consecuencias (M)
- **Problema:** el sigilo solo se mide con `g.conjunto === 'leather' && g.player.sneaking ? 0.5` en `entities.js` (distancia de detección).
- **Cómo calza:** un `g.ruido` que sube al correr, saltar, romper bloques y andar con armadura de metal; baja al agacharse. Las criaturas lo oyen a `24 × ruido`. Sale en la brújula como un pequeño «oído» o por el vaho de la idea 2.
- **Tica:** el cencerro de las vacas sirve de ruido de fondo; los pasos en zinc suenan.

### 18. Morral que crece (M)
- **Problema:** el inventario tiene 36 casillas siempre (`SLOTS = 36` en `inventory.js`) y `meta.fijas` solo ordena; no hay decisiones de espacio.
- **Cómo calza:** empezar con 27 y desbloquear las 9 filas de abajo con «morral de cabuya» y «alforjas» (recetas y tienda); el mensaje «Se le llenó la mochila» (`ItemDrop.update`) ya existe. `moveAll`, `sortRange` y `meta.fijas` respetan el nuevo límite.
- **Tica:** el morral de cabuya de la abuela, con su historia en el cuaderno.

### 19. Temporadas: lluviosa y seca (L)
- **Problema:** hay clima, pero no estaciones; el año no se siente.
- **Cómo calza:** `g.day` ya cuenta los días; cada 60 días, cambiar `Weather.timer`/probabilidades (`weather.js`) a una temporada lluviosa (aguacero casi diario por la tarde, ríos más crecidos: `crecida.js`) y otra seca (viento, quemas: `incendio.js`, sequía de `clima3.js`). Las cosechas (`agro.js`/`agro2.js`) cambian de ritmo.
- **Tica:** «aguacero a las 2, como siempre»; el pronóstico de la tele de `muebles.js` pasa a ser cierto.

### 20. Trepar: bejucos y escaleras de mano (L)
- **Problema:** el movimiento vertical es solo saltar y apilar bloques; la selva (`jungle`) pide lianas.
- **Cómo calza:** un bloque «bejuco» y una receta de escalera de mano; en `physics.js`/`player.js`, un modo de movimiento como el de agua (`b.inWater`) con subir y bajar a velocidad fija; animación de brazos alternados en `avatar.js` (los codos y rodillas articulados de `anatomia.js` ya sirven) y de la mano en `game.js`.
- **Tica:** subir al árbol del mango, el puente colgante (`placePuenteColgante` de `agro.js`) ya existe; el bejuco lo completa.

---

## 4. Orden por valor ÷ esfuerzo, y las 6 primeras

| # | Idea | Tamaño | Por qué sube |
|---|---|---|---|
| ★ 1 | Rodar al aterrizar | S | Todo existe (`tryRoll`, `landHit`); da una decisión nueva en cada caída |
| ★ 2 | Señales del cuerpo | S | Convierte el aviso de texto en sensación; no toca balance |
| ★ 3 | Sentarse y acostarse con cuerpo | S | Cierra las dos transiciones más bruscas del jugador |
| ★ 4 | Leña y fogata que se apaga | M | Vuelve una decisión el campamento, que hoy no cuesta nada |
| ★ 5 | Conservas y comida que se echa a perder | M | Arregla el hueco de la comida sobrante y da sentido a la sal y el humo |
| ★ 6 | Temperatura del cuerpo y ropa | M | Hace que la costa, el valle y el páramo se jueguen distinto |
| 7 | Beber con las manos | S | |
| 8 | Lluvia sobre el zinc | S | |
| 9 | Agacharse y recoger con el cuerpo | S | |
| 10 | Cojera y convalecencia | M | |
| 11 | Animales con rutinas | M | |
| 12 | Antojos del día | M | |
| 13 | Botica de la abuela | M | |
| 14 | Nadar con costo | M | |
| 15 | Despertar con sobresalto | S | |
| 16 | Mesa servida | S | |
| 17 | Ruido y sigilo | M | |
| 18 | Morral que crece | M | |
| 19 | Temporadas | L | |
| 20 | Trepar | L | |

**Cómo se combinan las 6 primeras:** la 3 prepara la pose de sentado que la 16 reutiliza; la 4 y la 6 se alimentan mutuamente (la fogata sin leña deja de dar calor); la 5 usa el mismo fogón de la 4 para ahumar; la 2 da el aviso diegético que la 6 necesita (el vaho). Ninguna necesita subir `SAVE_FORMAT` si los campos nuevos (`meta.antojo`, el combustible del BE, el `extra` de la comida) se leen con `||=` o `?? 0`, como `bolsos` y `fijas`.

**Recomendación de empaquetado** (para no hacer versiones sueltas): v11.7 con 1, 2, 3 y 9 (todas S, todo animación y sensación); v11.8 con 4 y 5 (fogata y conservas, comparten el fogón); v11.9 con 6 (temperatura y ropa). Después, 7, 8 y 15 como un paquete de pulido de una tarde.

**Riesgos de balance a probar con `tools/bot-pelea.js` o a mano:** la 4 y la 5 hacen más dura la supervivencia en `Difícil`: conviene que en `Tranquilo` la fogata no se apague y la comida no se pase (`difOf(g)` ya distingue). La 6 cambia el consumo de comida (`tickMojado` suma a `hungerT`): revisar que no se acumule con `calma` y `fuerza`.
