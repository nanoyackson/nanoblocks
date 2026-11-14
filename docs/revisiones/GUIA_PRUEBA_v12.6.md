# Guía de prueba: lo nuevo de v12.4.8 a v12.6.1 (y el Rey)

Para una sesión de **45 a 55 minutos**, escrita en «usted» y en el orden de juego que menos estorba. Cada punto dice **qué hacer**, **qué debería pasar**, **qué sería un bug** y **cómo reportarlo en una línea**. Al lado de cada paso hay una casilla: **✔ bien / ✘ mal / ? rara**.

*Cómo se armó:* leí el `CHANGELOG.md` desde la 12.4.8 hasta la 12.6.1, los comandos de prueba (`pruebas.js`, `final.js`, `game.js`) y el código de lo nuevo. **No jugué ni corrí el juego** (no puedo abrir el navegador): si un paso no responde como lo escribí, puede ser que yo me equivoqué, y eso también vale reportarlo. Lo más importante de la sesión es **la prueba del Rey** (punto 1): si solo le alcanza el tiempo para una cosa, haga esa.

| Punto | Qué | Minutos |
|---|---|---|
| 0 | Preparar | 4 |
| 1 | **El Rey Zopilote: 5 intentos** | 20 |
| 2 | El tablón de encargos y el cupo | 7 |
| 3 | Tortugas y arrecife | 10 |
| 4 | Calidad automática | 4 (+ espera de 3 min, que usa para el 5.1) |
| 5 | El Locutor del amanecer y las texturas nítidas | 7 |
| | Tablita final | 2 |

---

## 0. Antes de empezar (4 min)

| | |
|---|---|
| **Correr el juego** | En la carpeta del proyecto, `npm run dev` y abrir `http://localhost:5199` en **Chrome**, con la pestaña **al frente** (Chrome frena las de fondo). En la pausa (Esc), abajo, debe decir la versión (**v12.6.1** o la más nueva). |
| **Mundo de prueba** | **Un jugador → Crear mundo nuevo**, nombre «Prueba 12.6», semilla **2026**, modo **Supervivencia**, dificultad **Normal**, tipo **Normal**. **Tiene que ser un mundo nuevo**: el coral blanqueado del punto 3 solo sale en mundos creados desde la 12.6.0. |
| **Comandos** | Pulse **`/`** y escriba. Los `/prueba …` solo andan en supervivencia y en la tierra. Los de esta guía: `/prueba equipo`, `/prueba fuerza`, `/prueba vida`, `/prueba zopilote`, `/prueba dia N`, `/prueba playa`, `/prueba colones N`, `/tiempo dia\|noche`, `/dar <nombre> [n]` (`/lista` le muestra los nombres), `/tp x y z`, `/pueblo ir`. |
| **Medidor** | **Esc → Ajustes → Opciones de video → «Mostrar fps, milisegundos (CPU y GPU), llamadas y triángulos»**: déjelo prendido toda la sesión (sale arriba a la derecha). |
| **Cronómetro** | El del teléfono sirve. Lo va a necesitar en el punto 1. |
| **Si algo sale mal** | Reporte en **una línea**: `Paso 3.2 · v12.6.1 · esperaba: … · pasó: … · captura sí/no`. Si es un error de la consola (F12), péguelo. |

---

## 1. El Rey Zopilote: 5 intentos (20 min) — *v12.4.8 a v12.5.2*

**Qué se está probando:** los jefes se rebalancearon con un bot, y el Rey (2 500 de vida, presión ×0.85) **nunca lo ha peleado una persona**. El objetivo del diseño es que un jugador promedio **muera como una vez** y lo venza en **1 min 40 s a 2 min 10 s**. Usted es la primera medida real.

### 1.1 Cómo llegar rápido (2 min, una sola vez)
1. Salga a un **lugar plano y abierto**, sin árboles encima ni cerros cerca (el Rey baja a posarse). Cualquier pampa de la semilla sirve.
2. Escriba: `/prueba equipo jade 3` → espada, pico, hacha y armadura **de jade con 3 estrellas** (más comida y vendas): es el equipo con el que se calibró el Rey.
3. `/dar arco` y `/dar flecha 64`: el Rey vuela alto y hay que dispararle.
4. `/prueba fuerza`: comida buena y el efecto de «descansado» (como el bot).
5. Opcional (lo que haría un jugador de verdad): lleve el **escudo** que tenga a la mano izquierda.

> El camino «de verdad» (la Corona se ofrece **de noche, en una cumbre a más de 95 de altura**) toma 20 minutos. Hoy no hace falta: `/prueba zopilote` le da el Rey, la Corona, las **Alas del Rey** (para planear) y **16 bombetas**.

### 1.2 Cada intento (≈ 3 min)
1. `/prueba vida` (vida, comida y agua llenas, sin efectos).
2. **Revise la armadura** (inventario): si alguna pieza está baja de durabilidad, vuelva a escribir `/prueba equipo jade 3`.
3. `/prueba zopilote`. El Rey aparece **18 bloques adelante y 12 arriba**, con su nombre y su barra de vida arriba. **Arranque el cronómetro en ese momento.**
4. Pelee. **El intento termina cuando el Rey muere o cuando usted muere.** Pare el cronómetro. Anote:
   - **¿Murió?** sí o no.
   - **Segundos** (del cronómetro).
   - **Qué lo mató** (la pantalla de muerte lo dice): una de estas seis, o «otra»: *La picada* · *Picotazo* · *Una pluma* · *Un rayo* · *Le cayó encima* · *Un aletazo*.
   - Si murió: **qué fase iba el Rey** (1, 2 o 3 según los avisos de abajo) y **cuánta vida le quedaba**, a ojo (barra).
5. **Después de un intento**, si el Rey sigue a la vista, **aléjese más de 100 bloques** (`/tp` a 150 bloques de distancia) y vuelva: los bichos a más de 96 bloques desaparecen y así no se le juntan dos Reyes. Al ganar salen **los créditos y el epílogo** (una sola vez): ciérrelos y siga; en los otros intentos el premio no se repite.

### 1.3 Qué debería ver (por fase)
- **Fase 1 (de 100 % a 66 %):** el Rey **vuela en círculos arriba**, **chilla** (casi un segundo de aviso), **se tira en picada** hacia usted (esquívela) y **se posa** unos 4 s: **ahí sí se le llega con el arma**. De cerca da un **picotazo con aviso**; con el escudo se puede parar.
- **Fase 2 (66 %):** aviso «⛈ ¡El Rey Zopilote llama la tormenta! Fíjese en los círculos del suelo». Suelta **plumas** (tres a la vez) y **rayos que caen donde hay un círculo en el suelo**: se esquivan saliéndose del círculo.
- **Fase 3 (33 %):** «🪶 ¡Se le rompieron las alas!». **Baja al suelo**, **salta** (marca un círculo antes), **barre con las alas** (un **anillo rojo** de unos 6 bloques: sálgase o salte) y suelta **ceniza** (mareo). Los rayos siguen.
- **Duración esperada:** de **100 a 130 s** si usted pelea bien; **hasta 3 min** si se confunde. **Muerte esperada:** **una de cada tres intentos** más o menos (el diseño apunta a una muerte por victoria).

### 1.4 Qué sería un bug (anótelo aunque sea «rara»)
- Un golpe que **lo mata de un solo golpe** teniendo la vida llena (el tope es 60 % de la vida: 12 de 20).
- Algo que lo mata **sin aviso**: la regla del diseño es que todo golpe grande avisa (chillido, círculo, anillo, carril).
- Plumas o rayos **imposibles de esquivar**, o un círculo que **no coincide** con donde cae el rayo.
- El Rey **atravesando el suelo**, posándose dentro de un árbol/cerro, o **quedándose quieto sin posarse** más de 10 s.
- **Que no se pueda ganar** con el equipo de jade (un Rey con demasiada vida) o que caiga en menos de **60 s** (demasiado fácil).
- La barra de vida que **no baja** o salta, créditos que salen **más de una vez**, o el juego que **se congela** (miré los fps).
- **Las cinco muertes por lo mismo** (por ejemplo, siempre la picada): dígame cuál, que ahí hay que tocar.

**Reporte en una línea:** `Rey intento 3 · murió sí · 74 s · la picada · fase 1 · 80 % de vida`.

---

## 2. El tablón de encargos y el cupo (7 min) — *v12.4.12 y 12.5.1*

### 2.1 El tablón
1. `/pueblo ir`. Camine por la **plaza**: el tablón es un **bloque de madera con dos postes y un panel**, al lado de la cancha o en el parque central.
2. **Clic derecho** al tablón: muestra un encargo («Doña Rosa pide 8 de mazorca · paga 7 u») y pasa al siguiente en cada clic. **Mayús + clic derecho**: lo **acepta**. Con el primero que acepte, el juego le regala un **Libro de encargos** (clic derecho con él en la mano: la lista de lo que lleva).
3. Para entregar: `/dar <lo que pide> <cantidad>` (si no sabe el nombre, `/lista`; la mazorca es `corn`, los frijoles `beans`) y **Mayús + clic derecho** al tablón otra vez.
4. **Qué debería pasar:** cobra la plata (₡ en la billetera), aparece «¡Encargo cumplido!… +1» de fama con el nombre del pueblo, y sale el logro «Encargo del tablón».
5. **Otro día:** acepte un encargo común, escriba `/prueba dia 20` (otro día) y vuelva al tablón: **el que aceptó ayer debe aparecer primero y poderse entregar**.
6. **Cada pueblo tiene encargos distintos**; si se mueve a otro pueblo (`/pueblo ir` desde lejos), no deben ser los mismos.

**Bug si:** el encargo aceptado ayer **no se puede entregar**; el tablón dice «muy lejos» estando en la plaza; el pago es **mucho mayor** que lo que vale comprar eso en la tienda (comprar y entregar no debe dar ganancia); un encargo pide algo **imposible** (por ejemplo, un ítem que no existe todavía); **cobra dos veces** el mismo encargo; la lista **cambia a mitad del día** sin que usted haya hecho nada.
**Reporte:** `Paso 2.1 · el encargo de ayer no deja entregar · captura sí`.

### 2.2 El cupo del comprador
1. De **día** (`/tiempo dia`), con la pulpería abierta. `/dar corn 300` (300 mazorcas).
2. Hable con el **pulpero** (clic derecho) y venda mazorcas en paquetes (con **Mayús** vende 5 seguidos). Cada paquete son 4 mazorcas por unos ₡500.
3. **Qué debería pasar:** a las **30 unidades vendidas** de mazorca en ese pueblo (≈ 30 paquetes, ₡15 000), sale el aviso «🧾 En este pueblo ya compraron bastante mazorca hoy: de aquí en adelante pagan menos» y **los siguientes paquetes pagan el 40 %**.
4. **Vaya a otro vendedor del mismo pueblo** (la panadera, la feriante): también paga el 40 % por la mazorca (el cupo es **por pueblo y por producto**, no por vecino). Venda **otra cosa** (por ejemplo `/dar beans 100`): esa sí paga completo.
5. Mañana (`/prueba dia 30`): la mazorca vuelve a pagar completo.

**Bug si:** el aviso no sale; el precio del paquete **no cambia** después del aviso; el cupo es de **otro** producto que no vendió; otro pueblo **hereda** el cupo; el cupo **no se reinicia** al día siguiente; recibe **menos** de lo que dice el paquete **antes** del aviso.
**Reporte:** `Paso 2.2 · vendí 40 paquetes de mazorca, el aviso salió a los 60 · captura sí`.

---

## 3. Tortugas y arrecife (10 min) — *v12.6.0 y 12.6.1*

### 3.1 La arribada y marcar un nido (5 min)
1. `/dar estaca_nido 3` (la estaca de nido). `/prueba playa`: lo lleva a una playa, de amanecida.
2. `/prueba dia 7` (**la arribada es el día 7, 21, 35…**) y `/tiempo noche`. Párese **en la orilla**, con el agua adelante y la arena atrás.
3. **Qué debería pasar** (puede tardar 1–2 minutos): sale «🐢 ¡Arribada! Cientos de tortugas lora salen a desovar… con una estaca de nido puede proteger los nidos». Las tortugas suben a la arena, **cavan** (partículas de arena) y **algunas dejan un nido** (un bloque de arena con huevos, aparte del dibujo de la arena).
4. **Apunte a un nido** con la estaca en la mano y **clic derecho**: queda como **«Nido protegido»** (con una malla); sale «🐢 Nido protegido: en 5 noches salen las tortuguitas. Apague las antorchas de la playa ese día». Marque **2 o 3**.
5. **Importante (v12.6.1):** los nidos **sin marcar eclosionan solos** a los 4 o 6 minutos de juego (salen 3 a 6 tortuguitas que corren al mar, sin pago). Los marcados esperan 5 días.
6. **Para ver nacer los marcados:** `/prueba dia 12`, `/tiempo noche`, y **quédese a menos de 48 bloques** (de noche y con los chunks cargados). Salen **8 a 12 tortuguitas por nido** que van **solas al mar**. Con **antorchas, faroles o lámparas a menos de 6 bloques**, **el 30 % se desvía a tierra** y se pierde.
7. **Cada tortuguita que llega al agua** le paga **0.3 u** (₡150); el tope es **30 u por arribada**; a las **100 tortuguitas** recibe la **banderita azul** y el logro «Voluntario de la tortuga» (para llegar a 100 hacen falta 9 nidos: use `/prueba dia` para repetir la arribada de 14 en 14 si quiere).
8. Si intenta **romper** un nido protegido sin agacharse: «Es un nido protegido: para quitarlo, agáchese (Mayús)».

**Bug si:** la estaca marca algo que **no es un nido**; el nido protegido **nunca nace**; nacen **cientos** de golpe y el juego se pone lento (fps); las tortuguitas **no van al mar** o se quedan paradas; **paga más de 30 u** por arribada; se puede marcar el **nido 13** de la misma arribada; la luz **no desvía** a ninguna; se queda un nido huérfano (el bloque ya no está y siguen naciendo).
**Reporte:** `Paso 3.1 · marqué 3 nidos, a los 5 días no nació ninguno · captura sí`.

### 3.2 Los saqueadores (2 min, **lo más difícil de ver**)
1. Mismo escenario: en la noche de la arribada (**día 7**), **apenas aparezca un nido sin marcar** (déjelo sin marcar), escriba **rápido** (antes de 4 minutos, o el nido eclosiona solo) `/prueba dia 8` y `/tiempo noche`. Quédese **a menos de 40 bloques** del nido, en la arena.
2. **Qué debería pasar:** en el día 8, 9, 10 u 11 (las 4 noches siguientes a la arribada), de noche, puede aparecer **un saqueador de nidos** (un vecino con linterna, aviso «🔦 Alguien anda con una linterna por la playa…»). Camina al nido, **cava unos 4 s** y huye. **Si lo golpea una vez**, «🚓 ¡Lo atrapó! … la multa le da 5 unidades».
3. **Anote la fama:** los saqueadores son personas: ¿le aparece **«desconfianza»**, o baja la reputación del pueblo cercano al golpearlo? (Debería **no** bajar; si baja, repórtelo.)
4. **Sin arribada no hay saqueadores**: en un día fuera de ese rango (por ejemplo `/prueba dia 15` de noche en la playa) **no debe salir ninguno**.

**Bug si:** aparecen **sin** arribada; **uno tras otro** sin límite (si pudiera atrapar diez en una noche sería plata gratis: **cuénteme cuántos**); cavan un nido **marcado**; el golpe le **baja la fama**; el saqueador **flota o se queda en una pared**; usted **recibe huevos** en el inventario (nunca debe pasar).
**Reporte:** `Paso 3.2 · atrapé 6 saqueadores en una noche, 30 u · captura sí`.

### 3.3 El arrecife: fragmento, coral blanco, vivero (3 min)
1. `/dar careta` (la careta de buceo). Nade mar adentro en la playa hasta un **arrecife** (corales de colores en el fondo, entre 3 y 18 bloques de profundidad, aguas poco profundas). En su mundo nuevo debe haber **manchas de coral blanco** (como apagado) entre los de color: un tercio aproximado.
2. **Fragmento:** con la careta en la mochila y la **mano vacía**, clic derecho a un **coral de color**: «🪸 Un fragmento de coral…». El coral **no se muere**. Si repite en el **mismo** coral: «A este coral ya se le sacó un fragmento: déjelo crecer unos días».
3. **Revivir:** con el **fragmento en la mano**, clic derecho a un **coral blanco**: se vuelve de color («¡El coral revive! Llevan N»). Si lo toca sin fragmento: «Coral blanqueado: con un fragmento… se puede revivir».
4. **Vivero:** `/dar vivero_coral`. Póngalo **en el fondo, con el mar encima**. Clic derecho: «El vivero está criando: 3 días más». `/prueba dia N+3` y clic derecho otra vez: **2 fragmentos**. **Fuera del agua** debe decir que tiene que estar bajo el agua del mar y **no** dar nada.
5. **Pecera (extra):** `/dar pecera` y póngala; con un **pargo o guapote** en la mano, clic derecho: «¡Qué bonita la pecera!». Vacía **no** da comodidad.
6. **Buzos (solo si le queda tiempo):** a los **60 corales revividos** (`/dar fragmento_coral 64` y revíva 60), si camina de **día por una playa**, salen «🤿 Los buzos… le dejaron 10 unidades», **una vez al día**.

**Bug si:** en el mundo nuevo **no hay ni un coral blanco** (puede ser que no haya arrecife cerca: pruebe otra costa); el fragmento sale **sin careta**; el **mismo coral** da fragmento varias veces el mismo día; el coral blanco **se pone de color sin gastar** el fragmento; el vivero da fragmentos **en el aire** o **antes de 3 días**; los buzos pagan **más de una vez al día** o sin 60 revividos; el arrecife blanqueado **atrae peces** de colores (no debería).
**Reporte:** `Paso 3.3 · saqué fragmentos del mismo coral 5 veces seguidas · captura sí`.

---

## 4. Calidad automática (4 min + 3 de espera) — *v12.5.0 y 12.5.2*

**Qué es:** si la compu no da, el juego **baja solo la resolución (100 → 85 → 70 %) y luego el nivel (Ultra → Alto → Medio)**. Lo que baja **no se guarda** en Ajustes. En **Bajo** no actúa. Si usted toca la calidad, un efecto o la resolución **a mano**, deshace lo bajado y **se queda quieto 3 minutos**.

### 4.1 Cómo mirar (qué dice el medidor)
Arriba a la derecha: **`NN fps · cpu X ms · gpu Y ms · N llamadas · N triángulos · N tex · Calidad`**. Si el juego bajó algo, dice **`(automático)`** detrás de la calidad y **`resolución 85 %`** (o 70 %). **«gpu —»** es normal en Firefox y Safari; en Chrome debe dar un número.

### 4.2 Hacerlo bajar (3 min de espera)
1. **Esc → Ajustes → Opciones de video**: **Calidad: Ultra**, **«Calidad automática»: marcada**, **Distancia de visión: la más alta**, **Horizonte lejano: «Muy lejos»**, y suba **«Resolución»** al máximo. (Quiere una compu apretada a propósito.)
2. Cierre Ajustes y **no los toque más**: tocar algo reinicia la espera de **3 minutos**. Camine por el campo y mire el medidor.
3. **Haga mientras tanto el punto 5.2 (el Locutor).**
4. Si sus fps se quedan **por debajo de 42** (70 % de 60) durante 10 segundos seguidos, **debe salir un aviso «📉 Bajé la resolución a 85 % para mantener los fps»**; un minuto después, otro a **70 %**; y luego «Bajé la calidad a Alto» y «a Medio». Cada paso espera **60 s** del anterior y **no hay subida sola**.
5. **Si su compu es buena y no baja de 42 fps, no pasa nada, y eso no es un bug** (dígame los fps que tenía).
6. **Recargar la página** (F5) y abrir Ajustes: **la calidad debe seguir en Ultra** (lo que usted escogió), no en Medio.
7. Cambie la **calidad a mano** (por ejemplo a «Alto» y de vuelta): la resolución **vuelve a 100 %** de inmediato y el medidor ya no dice «(automático)».

**Bug si:** Ajustes **queda guardado en una calidad más baja** de la que usted puso; **sube y baja solo** (cada dos minutos); baja **sin necesidad** con 60 fps; en **Bajo** cambia algo; el medidor **no dice** que bajó; al tocar la calidad la imagen **queda borrosa** (resolución baja pegada); hay un **tirón largo** al cambiar de resolución (más de un segundo).
**Reporte:** `Paso 4.2 · Ultra, 30 fps · bajó a 85 % a los 20 s, a 70 % al minuto · recargué y sigue Ultra: bien`.

---

## 5. Lo último (7 min) — *v12.4.12 y 12.5.0/12.5.2*

### 5.1 El Locutor del amanecer (haga esto durante la espera del 4.2)
**Qué es:** al amanecer caen **10 a 15 avisos juntos** (el día, la región, la feria, el nido…). Antes se botaban los que no cabían; ahora **salen de a poco** y, si al minuto quedan dos o más, se juntan en **un solo aviso**: «📋 Hoy hay N avisos más: están en la libreta («Lo que se dijo»)».
1. `/prueba dia 12`, `/tiempo noche`, `/dar bed` y **ponga la cama** (en la casa o al aire libre). **Clic derecho a la cama** para dormir.
2. Al despertar (**día 13, un sábado de feria**) mire los avisos: deben salir **en orden, uno a la vez** (de 4 a 6 en los primeros 20 segundos).
3. Espere **un minuto**: si quedaron avisos sin salir, aparece **«📋 Hoy hay N avisos más…»**. Abra la **libreta (tecla L) → «Lo que se dijo»**: ahí **deben estar todos**, los dichos y los botados.
4. **Urgentes:** un **urgente** (por ejemplo, un golpe de vida en peligro) **nunca** debe perderse ni esperar detrás de la fila.

**Bug si:** se **pierde un aviso** que debía salir (y no está en la libreta); el **resumen sale mientras usted está en el menú, la tienda o la libreta**, o **apenas cierra la libreta**; sale un aviso **viejo** («Hoy es sábado») a las **tres horas** del día; los avisos se **amontonan** (más de dos a la vez); **repite el mismo** aviso varias veces; un aviso urgente **no sale**.
**Reporte:** `Paso 5.1 · al despertar solo salieron 2 y no hubo resumen ni quedaron en la libreta`.

### 5.2 Las texturas nítidas de lejos
**Qué es:** a distancia, el pasto, las hojas, la arena y la piedra **ya no centellean**, y las flores, el pasto alto, la caña, las enredaderas y el vidrio **no se oscurecen ni se borran**.
1. Cambie la calidad a mano (esto **deshace** lo que bajó el regulador del punto 4: está bien). Suba la **Distancia de visión** (12 o más) y mire un **prado con flores y una casa con ventanas** a **100 y 150 bloques**.
2. Con **«Texturas nítidas de lejos» marcada** (viene en Medio, Alto y Ultra) debe verse **parejo** al caminar. **Desmárquela** (o ponga **Bajo**) y compare: el pasto y la arena **centellean** al moverse.
3. Con la casilla marcada, **las flores y el vidrio deben conservar su color** de lejos (no más oscuros que de cerca) y **las ventanas siguen viéndose** hasta donde alcanza la vista.
4. Fíjese en el **suelo lejano visto de lado** (a ras de pasto): si ve **rayitas o cuadros de colores** donde se juntan los bloques, anótelo.

**Bug si:** las flores, el pasto alto o el vidrio **se ven negros o grises** de lejos; las **ventanas desaparecen** a 100 bloques; **líneas de colores** entre los bloques lejanos; el mundo se ve **borroso de cerca** (no debe: de cerca sigue el píxel duro); el juego se pone **más lento** con la casilla marcada (diga los fps con y sin).
**Reporte:** `Paso 5.2 · Medio con nitidez · el vidrio de la casa desaparece a 120 bloques · captura sí`.

---

## Tablita final (llene al terminar)

**El Rey (punto 1):**

| Intento | ¿Murió? (sí/no) | Segundos | Qué lo mató / cómo terminó | Fase del Rey y vida que le quedaba |
|---|---|---|---|---|
| 1 | | | | |
| 2 | | | | |
| 3 | | | | |
| 4 | | | | |
| 5 | | | | |

**Resto de la guía** (✔ bien / ✘ mal / ? rara):

| Punto | | Nota en una línea |
|---|---|---|
| 2.1 El tablón y el encargo de otro día | | |
| 2.2 El cupo del comprador | | |
| 3.1 Marcar un nido y que nazcan | | |
| 3.2 Saqueadores (cuántos atrapó) | | |
| 3.3 Fragmento, coral blanco y vivero | | |
| 4 Calidad automática (¿bajó? ¿se guardó?) | | |
| 5.1 El Locutor del amanecer | | |
| 5.2 Las texturas nítidas de lejos | | |

**Para el Rey, tres preguntas de cierre:** (1) ¿Se sintió **justo**, difícil o imposible? (2) ¿Alguna muerte fue **sin aviso**? (3) ¿Qué ataque **no entendió** la primera vez?

**Cómo reportar** (una línea por cosa): `Paso X.Y · v12.6.1 · esperaba: … · pasó: … · captura sí/no`. Si es rendimiento: nivel de calidad, distancia de visión, horizonte y los fps del medidor.

*Escrita por la sesión investigadora. No se corrió el juego: todo está leído del código y de los registros de versiones. Si algún comando no responde como aquí, es información útil para quien construye.*
