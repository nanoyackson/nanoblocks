# Guía de prueba: lo nuevo de v11.7 a v11.13.5

Para una sesión de juego de **45 a 60 minutos**. Está escrita en «usted», en el orden que menos estorba. Cada punto dice **qué debería ver o sentir** y trae una casilla para anotar: **bien / raro / mal**. Al final hay **diez preguntas** que nos ayudan a decidir.

*Cómo se armó:* leí los `CHANGELOG` y el código de los comandos (`/prueba`, `/dar`, `/tiempo`, `/pueblo`, `/lugar`…) de la versión `11.13.5`. **No jugué ni corrí el juego**: si un paso no responde como dice, anótelo como «raro» y escriba qué pasó; así sabemos si falla el juego o la guía.

---

## 0. Antes de empezar (5 min)

| | |
|---|---|
| **Correr el juego** | En la carpeta del proyecto, `npm run dev` y abrir `http://localhost:5199` en **Chrome**. La versión sale abajo en la pausa: debe decir **v11.13.5**. |
| **Chrome sin zoom** | Antes de abrir el juego pulse **Ctrl + 0** (zoom al 100 %). Se prueba más adelante. |
| **Mundo de prueba** | **Un jugador → Crear mundo nuevo**: nombre «Prueba», modo **Supervivencia**, dificultad **Normal**, tipo de mundo **Normal**. (El mundo compacto se prueba al final, en otro mundo.) |
| **Cómo escribir comandos** | En la partida, pulse **`/`** y escriba. Los que empiezan con `/prueba` solo andan en **supervivencia**, en la **tierra**, y cuando ya arrancó la historia (si dice «espere un segundo», espere). `/prueba` solo, sin nada, muestra la lista. |
| **Atajos que se usan** | **E** inventario · **M** mapa · **Y** ayuda y libreta · **Q** tirar · **R** ordenar (con el inventario abierto) · **`/`** o **Ctrl+F** buscar (con el inventario abierto) · **Ctrl+Espacio** barrerse · **Shift** agacharse · **Esc** pausa. |
| **Si algo sale mal** | Anote el paso, lo que esperaba y lo que pasó. Una captura de pantalla vale por mil palabras. |

---

## 1. Chrome sin zoom (2 min) — *v11.10.2*

Dentro de la partida, **sin** menú abierto:

| # | Pruebe | Debería ver o sentir | Anote |
|---|---|---|---|
| 1.1 | **Ctrl + rueda del ratón** y **Ctrl + `+` / `-`** | La página **no cambia de tamaño** (no hay zoom). | ☐ bien ☐ raro ☐ mal |
| 1.2 | **Ctrl+S, Ctrl+D, Ctrl+P, Ctrl+F, Ctrl+R, F5** (afuera del inventario) | Chrome **no** abre su diálogo ni recarga; la partida sigue. | ☐ bien ☐ raro ☐ mal |
| 1.3 | Pulse **Esc** (pausa) y haga **clic** en «Volver al juego» | El ratón vuelve a la mira **y ese clic no pega ni pone un bloque**. | ☐ bien ☐ raro ☐ mal |
| 1.4 | Haga **Alt+Tab** a otra ventana y vuelva | El juego **no se pierde**: o está en pausa o pide un clic, pero no queda trabado. | ☐ bien ☐ raro ☐ mal |

---

## 2. Brillo (3 min) — *v11.11.0*

| # | Pruebe | Debería ver o sentir | Anote |
|---|---|---|---|
| 2.1 | Escriba **`/tiempo noche`**. Después **Esc → Ajustes → Imagen → Brillo** | Con el **50 %** la noche se ve «como siempre». | ☐ bien ☐ raro ☐ mal |
| 2.2 | Suba el brillo a **80–100 %** (se ve en vivo) | **La noche y las cuevas se aclaran** en el mundo **y en lo que lleva en la mano**; **la interfaz no cambia de brillo**. | ☐ bien ☐ raro ☐ mal |
| 2.3 | Bájelo a **20 %** | Todo más oscuro, pero **la letra de los paneles se lee igual**. | ☐ bien ☐ raro ☐ mal |
| 2.4 | Deje el brillo donde le guste y escriba **`/tiempo dia`** | El día se ve bien en el brillo que dejó (no «quemado»). | ☐ bien ☐ raro ☐ mal |

---

## 3. Inventario en vidrio (10 min) — *v11.8, 11.10.2, 11.12.0, 11.13.1–5*

Para tener qué mover, escriba **`/prueba equipo hierro`** (da espada, pico, hacha, armadura de hierro, 8 casados, 4 ollas de carne, 6 vendas y 16 antorchas). Después **`/dar log 64`**, **`/dar planks 64`** y **`/dar stone 64`** (los nombres son las claves del juego; si no reconoce uno, escriba **`/lista`** para ver los que sí).

| # | Pruebe | Debería ver o sentir | Anote |
|---|---|---|---|
| 3.1 | Pulse **E** | Panel **oscuro con desenfoque** y esquinas suaves, con el juego asomando detrás. La **letra es Inter** (limpia, sin dibujitos de píxeles). Las casillas **se ven a su tamaño** (en 1280×720 y en pantallas grandes). | ☐ bien ☐ raro ☐ mal |
| 3.2 | Mire el panel de arriba a abajo | Arriba **íconos** (lupa, ordenar, depositar a cofres, «⋯»), **no una fila de botones**; **no hay pestañas de categoría** en el inventario (esas son para las recetas). | ☐ bien ☐ raro ☐ mal |
| 3.3 | Pulse **R** (o el ícono de ordenar) | El inventario se **junta y ordena** (la barra rápida no se toca). Clic **derecho** en el ícono: menú para escoger el **criterio** (categoría, nombre, cantidad, recientes). | ☐ bien ☐ raro ☐ mal |
| 3.4 | Pulse **`/`** (o **Ctrl+F**) y escriba «pico» | El campo de búsqueda **se abre**; lo que no calza se **apaga** y lo que calza **se resalta**; **Esc** limpia. | ☐ bien ☐ raro ☐ mal |
| 3.5 | **Pase el ratón sobre una casilla** y pulse **1 a 9** | Ese objeto **pasa a la barra rápida** en el número que pulsó. | ☐ bien ☐ raro ☐ mal |
| 3.6 | **Reparto al arrastrar:** tome una pila grande (clic), y **arrastre sobre varias casillas vacías con el botón apretado** | **Se reparte en partes iguales y se ve en vivo**; al soltar queda repartido. **Esc** a medio reparto: todo vuelve como estaba. | ☐ bien ☐ raro ☐ mal |
| 3.7 | **Clic derecho** sobre una pila | Toma **la mitad**. Con un objeto en el cursor, clic derecho en una casilla pone **uno**. | ☐ bien ☐ raro ☐ mal |
| 3.8 | **Q** con el ratón sobre una casilla (**Ctrl+Q** tira toda la pila); también **suelte un objeto afuera del panel** | Lo **tira al suelo frente a usted**; se puede recoger. | ☐ bien ☐ raro ☐ mal |
| 3.9 | **Con el inventario cerrado**, mire un bloque y pulse el **clic central (rueda)** | **Agarra ese bloque** (si lo tiene, lo pasa a la mano). En pelea **no cambia el arma**. | ☐ bien ☐ raro ☐ mal |
| 3.10 | **Recetario** (columna de la derecha): escriba «pan» o «hacha» con y sin tilde/mayúscula | **Busca sin importar tildes ni mayúsculas.** | ☐ bien ☐ raro ☐ mal |
| 3.11 | **Chips de categoría** del recetario (Herramientas, Armadura, Comida, Construcción, Materiales, Varios) y **«Puedo hacer»** | Se pueden **sumar**; «Puedo hacer» deja **solo lo que ya puede fabricar**; cada receta muestra ✓ o ✗. Pasando el ratón sobre el buscador, un tooltip explica los atajos. | ☐ bien ☐ raro ☐ mal |
| 3.12 | **Mayús + clic** en una receta posible; **clic derecho** en otra | Mayús+clic **pone el máximo** de veces que alcance; clic derecho **fija la receta** en pantalla (📌). | ☐ bien ☐ raro ☐ mal |
| 3.13 | Ponga un **cofre** (`/dar chest 2`, o fabríquelo), ábralo y use el ícono de **sacar todo**, **depositar** y **R / Mayús+R** | **Sacar todo** vacía el cofre a su inventario; **Mayús+R deposita** lo suyo (menos la barra rápida); el «⋯» guarda lo menos usado («Ordenar la casa…» solo en cofres de su casa). | ☐ bien ☐ raro ☐ mal |
| 3.14 | **Tab** por los botones del menú y de Ajustes; **Esc** para volver atrás | El **foco se ve** (borde dorado/azul) y **Enter** activa. (Ojo: en el inventario, el teclado todavía es a medias.) | ☐ bien ☐ raro ☐ mal |

---

## 4. Manos en primera persona (4 min) — *v11.11.1–2*

Con lo del paso 3 en la barra rápida (si no, **`/prueba equipo hierro`**):

| # | Pruebe | Debería ver o sentir | Anote |
|---|---|---|---|
| 4.1 | Cambie entre **espada, pico, hacha, antorcha y comida** (1–9 o rueda) | **La mano agarra lo que lleva**: la espada y las herramientas **en puño** (el mango cruza la mano), **la antorcha** también, y **nada flota** frente a la cámara. | ☐ bien ☐ raro ☐ mal |
| 4.2 | Lleve en la mano un **bloque** | Va **apoyado en la palma, sostenido por abajo**, más chico y a la vista. | ☐ bien ☐ raro ☐ mal |
| 4.3 | **Arco** (`/dar arco`, `/dar flecha 20`) y **escudo** (`/dar escudo_hierro`; el de jade `/dar escudo_jade`) | El arco se agarra **por el medio**; el escudo va **pegado al antebrazo izquierdo**, con la mano agarrando la correa. | ☐ bien ☐ raro ☐ mal |
| 4.4 | Con una **pechera puesta**, mire la manga del brazo | La **manga toma el color de la pechera**. (Si se la pone *después* de tener el objeto en la mano, puede tardar en cambiar hasta que cambie de objeto: anótelo.) | ☐ bien ☐ raro ☐ mal |
| 4.5 | **`/dar mochila`**, y pulse **F5** (tercera persona) | **Se ve la mochila de cuero en la espalda** del muñeco; **sigue** cada pose (caminar, agacharse). | ☐ bien ☐ raro ☐ mal |
| 4.6 | Cambie de objeto **muy rápido** (rueda del ratón) durante 10 segundos | **Ningún tirón ni parpadeo**; el juego no se pone pesado. | ☐ bien ☐ raro ☐ mal |

---

## 5. Billetera y plata (10 min) — *v11.10.0–7, 11.13.1–3*

Escriba **`/prueba colones 200`** (son 200 «unidades»: **₡100 000**). Después **`/pueblo ir`** para ir al pueblo más cercano.

| # | Pruebe | Debería ver o sentir | Anote |
|---|---|---|---|
| 5.1 | Mire el **HUD**, a la derecha de la barra rápida | Una **billetera de cuero** con el total **«₡100 000»** (con espacio de miles), no un emoji. Al ganar plata **brinca y suena una moneda**. | ☐ bien ☐ raro ☐ mal |
| 5.2 | **E**, y **clic en la fila de la billetera** del inventario | Se **abre el cajón**: **billetes en abanico** y **monedas** en el monedero, cada pieza con su cantidad, y dos **ranuras de tarjeta** (Banco y Chanchito). **Esc** o clic afuera lo cierra **sin cerrar el inventario**. | ☐ bien ☐ raro ☐ mal |
| 5.3 | Clic en un **billete** (saca uno al cursor), **Mayús+clic** (saca todos de ese valor), luego **clic en la billetera abierta** | La plata **se guarda otra vez** y el total **no cambia**. Con **otra cosa** en el cursor, clic en una pieza **no hace nada**. | ☐ bien ☐ raro ☐ mal |
| 5.4 | **Compre algo** en una tienda o pulpería (clic en un producto; **Mayús+clic** = cinco) | **Cobra el precio** («casado ₡4 500») y **le da el vuelto con la menor cantidad de piezas**; el total del HUD baja justo. | ☐ bien ☐ raro ☐ mal |
| 5.5 | **Venda** algo en la columna de la derecha de la tienda | Entra la plata **a la billetera** (no ocupa casillas). | ☐ bien ☐ raro ☐ mal |
| 5.6 | En la tienda: **«Cambiar plata: a billetes»** y **«A monedas»** (si no los ve, están en el «⋯» o junto al saldo) | **A billetes**: junta todo en la menor cantidad de billetes; **a monedas**: parte los billetes en monedas de ₡500. **El total no cambia.** | ☐ bien ☐ raro ☐ mal |
| 5.7 | **Banco** (en el pueblo): **agáchese (Shift)** y haga clic derecho al encargado | **Deposita lo de la billetera** (con el sencillo que no hace una unidad de vuelta). Vuelva a hablarle: devuelve el saldo. | ☐ bien ☐ raro ☐ mal |
| 5.8 | **Morir y recuperar el bolso.** Con unos ₡100 000 en la billetera y **dificultad Normal**, muérase a propósito (por ejemplo **`/inframundo`** y lava, o una caída grande) | **Pantalla de muerte sobria** (sin rojo plano) con el aviso del bolso: **a cuántos bloques y hacia dónde**, y **«se le cayeron ₡… en el bolso»** (en Normal, **la mitad** de la plata; en Difícil, toda). **No reaparece solo** aunque tenga **Espacio apretado**. | ☐ bien ☐ raro ☐ mal |
| 5.9 | Reaparezca, abra el **mapa (M)** y vaya al **🎒** | El bolso es **un cofre donde cayó**; adentro están sus cosas **y las piezas de la plata**. Recójalo: **la plata vuelve a la billetera**. | ☐ bien ☐ raro ☐ mal |
| 5.10 | Repita la muerte, pero **antes** saque billetes a casillas del inventario (Mayús+clic en la billetera) | Cae **la mitad del total** aunque la haya sacado de la billetera (ya no «se salva» la de la mano). | ☐ bien ☐ raro ☐ mal |

*Para la pregunta de economía:* en esta parte anote **cuánto le costó ganar ₡70 000** si lo intentó jugando (paso 6).

---

## 6. Chanchito y alfarero (6 min) — *v11.10.7*

Escriba **`/prueba colones 300`** y **`/prueba alfarero`** (Don Ubaldo llega **a la par suya**).

| # | Pruebe | Debería ver o sentir | Anote |
|---|---|---|---|
| 6.1 | **Clic derecho** a Don Ubaldo, y otra vez | La primera vez **ofrece** («Son 140 colones…», o sea **₡70 000**); el segundo clic **le vende el chanchito** y cobra. Otra visita igual: «ya no tengo». Logro «Le compré al alfarero». | ☐ bien ☐ raro ☐ mal |
| 6.2 | **Ponga el chanchito** en el suelo y ábralo con clic derecho | Un **chanchito de barro con su ícono plano** (no un cubito); abre **27 casillas** con título «Chanchito de barro (el mismo en todos sus chanchitos)». Logro «Ahorrando en el chanchito». | ☐ bien ☐ raro ☐ mal |
| 6.3 | Meta **monedas, billetes y otros objetos** y ciérrelo; **ponga un segundo chanchito** lejos y ábralo | **Los dos tienen lo mismo.** | ☐ bien ☐ raro ☐ mal |
| 6.4 | **Abra la billetera (5.2)** y mire la ranura «🐷 Chanchito» | Muestra **la plata** que hay en los chanchitos. (Si metió plata y la cifra no cambió, anótelo: puede tardar en actualizarse.) | ☐ bien ☐ raro ☐ mal |
| 6.5 | **Rompa** un chanchito (con la mano o el pico) | **Suelta solo el chanchito vacío**; **lo de adentro no se pierde ni se duplica** (el otro chanchito lo sigue teniendo). | ☐ bien ☐ raro ☐ mal |
| 6.6 | Muera con un chanchito lleno (como en 5.8) | **Lo de adentro no se cae al bolso** (el chanchito nunca se pierde); solo el objeto, si lo llevaba. | ☐ bien ☐ raro ☐ mal |

---

## 7. Pausa del mapa, la libreta y la tienda (3 min) — *v11.12.1, 11.13.3*

| # | Pruebe | Debería ver o sentir | Anote |
|---|---|---|---|
| 7.1 | Pulse **M** con animales o el sol andando | El **juego se pausa** mientras el mapa está abierto; al cerrar (**M** o **Esc**), **sigue** (el sol vuelve a moverse). | ☐ bien ☐ raro ☐ mal |
| 7.2 | Lo mismo con la **libreta (Y)** y con la **tienda** | Pausan igual y **al cerrar por cualquier vía no queda pausado**. | ☐ bien ☐ raro ☐ mal |
| 7.3 | **Ajustes → Juego → «Pausar al abrir el mapa, la libreta y la tienda»**: apáguelo y repita 7.1 | Ahora **el mundo sigue** mientras mira el mapa. (Vuélvalo a prender.) | ☐ bien ☐ raro ☐ mal |
| 7.4 | En el **mapa**, aléjese con la rueda | Los lugares **se agrupan con un número**; la **leyenda** deja esconder pueblos, naturaleza, lugares, misiones o lo suyo. **Arrastre o WASD** lo mueve; **clic marca destino**. | ☐ bien ☐ raro ☐ mal |
| 7.5 | **Esc → «Ayuda (Y)»** | Abre la libreta en la hoja de ayuda. La pausa tiene **3 botones** (continuar, ajustes, guardar y salir). | ☐ bien ☐ raro ☐ mal |

---

## 8. Avisos «uno a la vez» y «Lo que se dijo» (4 min) — *v11.9.0, 11.9.1, 11.10.1*

| # | Pruebe | Debería ver o sentir | Anote |
|---|---|---|---|
| 8.1 | Recoja **varias cosas seguidas** (por ejemplo `/prueba cosas` y revise la mochila, o pique y recoja) y mire los avisos en pantalla | **Sale un aviso a la vez**, por importancia, **al ritmo de lectura**; no se amontonan cuatro encima. | ☐ bien ☐ raro ☐ mal |
| 8.2 | Abra la **libreta (Y) → «Lo que se dijo»** | Están **todos los avisos**, también los que no alcanzaron a salir, **del más nuevo al más viejo**. | ☐ bien ☐ raro ☐ mal |
| 8.3 | **Ajustes → Accesibilidad:** pruebe **Avisos en pantalla** (pocos / normal / todos) y **Velocidad de lectura** (tranquila / normal / rápida) | «Pocos» **calla** los comentarios; «Todos» no tiene tope por minuto; la velocidad cambia **cuánto dura** cada aviso en pantalla. | ☐ bien ☐ raro ☐ mal |
| 8.4 | **En plena pelea** (paso 9) | **Solo habla lo urgente**; lo importante sale a los ~10 s; un «ya» o un fueguito **no interrumpen**. | ☐ bien ☐ raro ☐ mal |

---

## 9. Combate legible (8 min) — *v11.5.0, 11.6.x, 11.7.0, 11.9.2*

Equípese: **`/prueba equipo hierro`** (con **escudo** en la mano izquierda: **`/dar escudo_hierro`**). Escriba **`/tiempo noche`**.

| # | Pruebe | Debería ver o sentir | Anote |
|---|---|---|---|
| 9.1 | **`/sombra 3`** (Sombras de noche) y pelee | **Se lee quién ataca**: cada golpe se prepara con un aviso. **Las Sombras con estrellas ya no se quedan atontadas con cada golpe.** | ☐ bien ☐ raro ☐ mal |
| 9.2 | Mire a **una Sombra hondera** preparar el tiro | **Sube el brazo, la honda zumba y brilla en dorado justo antes de soltar**; la piedra deja estela; **con el escudo se para**. | ☐ bien ☐ raro ☐ mal |
| 9.3 | **Brillo dorado = parry** (escudo arriba justo al golpe) | El dorado **dice «pare ahora»**; si lo logra, **se ve y se siente** (destello). | ☐ bien ☐ raro ☐ mal |
| 9.4 | **Rojo = quitarse del camino**: **`/prueba jefes2`** (la Reina Bananera; también `cornudo`, `tata`, `cascabel`, `cangrejo`, `ciempies`) | Antes del salto o del golpe fuerte aparece **un círculo/aviso rojo**. | ☐ bien ☐ raro ☐ mal |
| 9.5 | **El anillo que no persigue:** cuando la Reina marca el anillo y salta, **sálgase del círculo antes** | **El salto cae en el punto que marcó al empezar**; **si se sale del anillo, se salva**. Si la aturde a media preparación, **vuelve a marcar** antes de saltar. | ☐ bien ☐ raro ☐ mal |
| 9.6 | **`/prueba bravos`** (bravos en grupo) | Cada uno **avisa** su golpe; la pelea no es un borrón. | ☐ bien ☐ raro ☐ mal |
| 9.7 | Mire la **barra de vida del jefe** | Con **retrato** (los 7 jefes: Reina, Don Cornudo, Tata Sapo, Cascabel, Cangrejo, Ciempiés y Rey Zopilote) y **nombre**. (Los retratos **nuevos** de GPT todavía no están; los actuales son de 48 px.) | ☐ bien ☐ raro ☐ mal |
| 9.8 | **Muerte en pelea de noche** | La pantalla de muerte **no lo ciega** y se entiende **qué pasó**. | ☐ bien ☐ raro ☐ mal |

---

## 10. Barrido con Ctrl + Espacio (2 min) — *v11.10.0, 11.11.2*

| # | Pruebe | Debería ver o sentir | Anote |
|---|---|---|---|
| 10.1 | **Ctrl + Espacio** caminando **adelante**, **a los lados** y **para atrás** | Se **barre hacia donde camina**; **para atrás es más corto**. (La **Z** hace lo mismo y se cambia en Ajustes.) | ☐ bien ☐ raro ☐ mal |
| 10.2 | **F5** (tercera persona) y repita | **El muñeco se echa para atrás y baja**, con las piernas adelante (una más doblada), **sin despegar los brazos ni la cabeza**. | ☐ bien ☐ raro ☐ mal |
| 10.3 | En **primera persona**, **con el escudo o el arco** | **Ningún objeto flota** ni atraviesa el cuerpo. | ☐ bien ☐ raro ☐ mal |

---

## 11. Comida variada (3 min) — *v11.10.0*

Con lo del paso 3 (casados, olla de carne) y **`/dar pan_casero 3`**, **`/dar tortilla 3`**, **`/dar apple 3`**. Baje la barra de hambre (corra, pique) o use **`/prueba vida`** y después bájela jugando.

| # | Pruebe | Debería ver o sentir | Anote |
|---|---|---|---|
| 11.1 | **Coma varias veces el mismo plato** | **Ya no castiga**: sigue llenando igual (sin «empacho» ni penalización). | ☐ bien ☐ raro ☐ mal |
| 11.2 | **Coma tres o cuatro platos distintos** seguidos | **Lo variado da premio**: debería aparecer un estado bueno en la lista de efectos (y un aviso) por comer variado. | ☐ bien ☐ raro ☐ mal |
| 11.3 | ¿Se entiende **por qué** le dio el premio? | El aviso o el tooltip lo explican; **no hay que adivinar**. | ☐ bien ☐ raro ☐ mal |

---

## 12. Insolación, cantimplora y bote (7 min) — *v11.9.1, 11.9.2*

| # | Pruebe | Debería ver o sentir | Anote |
|---|---|---|---|
| 12.1 | **`/clima despejado`** y **`/tiempo mediodia`**. Quédese **al sol, sin sombrero y con poca agua**, y baje la sed | A los **~90 s de sol** sale el aviso «¡Qué sol! Una insolación…». **Anote el tiempo.** | ☐ bien ☐ raro ☐ mal |
| 12.2 | **Métase bajo techo** (en una casa de tablas con puerta cerrada o un cuarto con techo) y espere el mismo tiempo | **No se junta insolación encerrado**; **a la sombra baja rápido**. | ☐ bien ☐ raro ☐ mal |
| 12.3 | **Cantimplora:** **`/dar cantimplora_vacia`**, llénela **en el agua** (clic derecho al río o al mar) | Aviso «Cantimplora llena… (sin hervir: en la fogata, clic derecho la hierve)»; el agua **sin hervir a veces cae mal** (aviso de «panza»). | ☐ bien ☐ raro ☐ mal |
| 12.4 | **`/dar fogata`**, póngala y **clic derecho a la fogata con la cantimplora en la mano** | **La hierve**: queda «agua limpia (4 tragos)»; tomarla **ya no cae mal**. | ☐ bien ☐ raro ☐ mal |
| 12.5 | **Bote:** **`/dar bote`**, póngalo **en el agua** y súbase | Navega; **al girar junto a la orilla no se mete en la tierra** (se desliza, no queda atascado). | ☐ bien ☐ raro ☐ mal |
| 12.6 | **Arena:** si hay una playa cerca, **cave la arena** de abajo | **Cae de a poco**, sin trabar el juego ni dejar arena flotando. | ☐ bien ☐ raro ☐ mal |

---

## 13. Mundo compacto (6 min) — *v11.13.0, 11.13.5*

**Esc → Guardar y salir al menú → Un jugador → Crear mundo nuevo**, nombre «Compacto», **Tipo de mundo: Tiquicia de bolsillo**, Supervivencia, Normal.

| # | Pruebe | Debería ver o sentir | Anote |
|---|---|---|---|
| 13.1 | Mire **la nota** bajo «Tipo de mundo» al escoger cada opción | Normal: «Grande, como siempre…». Compacto: «Todo más cerca: biomas chicos, un pueblo a la par…». | ☐ bien ☐ raro ☐ mal |
| 13.2 | Al aparecer, escriba **`/pueblo`** | **Un pueblo a menos de 150 bloques** (debería salir ~70). **No aparece encima de la feria ni del cementerio.** | ☐ bien ☐ raro ☐ mal |
| 13.3 | **`/lugar`** (lista los 8 lugares más cercanos) | **Varios a menos de 300 bloques** (se prometen unos 35 tipos); **nada peligroso a menos de 60 bloques** del inicio. | ☐ bien ☐ raro ☐ mal |
| 13.4 | **`/lugar <tipo> ir`** con uno de la lista y camine de vuelta | **Se llega a pie en pocos minutos.** | ☐ bien ☐ raro ☐ mal |
| 13.5 | Abra el **mapa (M)** y aléjese | Solo los **8 más cercanos** llevan nombre; los demás, **ícono**; **no es «pura letra»**. | ☐ bien ☐ raro ☐ mal |
| 13.6 | Camine **diez minutos** en línea recta | **Cambia el bioma seguido** (más cortos que en Normal); **no se siente repetido ni apretado**. | ☐ bien ☐ raro ☐ mal |
| 13.7 | Salga y entre a un **mundo viejo** (el de la prueba) | **Carga igual que siempre** (como Normal), sin errores. | ☐ bien ☐ raro ☐ mal |

---

## 14. El vidrio con el juego de fondo (4 min) — *v11.13.1–5*

Mire cada pantalla con **el sol de mediodía, con nieve o cielo claro detrás**, y otra vez de noche (`/tiempo mediodia` / `/tiempo noche`).

| # | Pantalla | Debería ver o sentir | Anote |
|---|---|---|---|
| 14.1 | **Pausa, Ajustes (grupos Imagen, Sonido, Juego, Accesibilidad)** | Letra **grande y limpia**; «Listo» fijo abajo; «Restablecer todo» pide confirmar. | ☐ bien ☐ raro ☐ mal |
| 14.2 | **HUD:** misión, objetivo, reloj, avisos | Van **sobre vidrio oscuro, letra de 14 px**, **se leen con cielo claro o nieve detrás**. | ☐ bien ☐ raro ☐ mal |
| 14.3 | **Libreta:** **Logros** (ganados vs. por ganar), **Cartas** de la abuela, **Álbum**, **Bestiario** | **Papel crema con tinta oscura**: **se leen** los logros ganados, las cartas y los nombres de las estampas. | ☐ bien ☐ raro ☐ mal |
| 14.4 | **Bingo** (el del pueblo, `/prueba festival` o la plaza) | **Se lee todo**: la casilla LIBRE, los números marcados y los botones. | ☐ bien ☐ raro ☐ mal |
| 14.5 | **Tooltips** de objetos (pase sobre un ítem) | Fondo **oscuro y opaco**, tres líneas: nombre, propiedades, ayuda. | ☐ bien ☐ raro ☐ mal |
| 14.6 | **Rendimiento:** con el inventario abierto **y** el juego detrás, muévase | **Sin tirones** al abrir paneles ni con el HUD lleno. Si su compu tiene gráficos integrados, **anótelo** (el vidrio pide más a la GPU). | ☐ bien ☐ raro ☐ mal |
| 14.7 | **Ajustes → Accesibilidad → «Movimiento tranquilo»** | Se **quitan las sacudidas y la mayoría de animaciones** (los paneles aparecen casi de golpe); **la información sigue igual**. | ☐ bien ☐ raro ☐ mal |
| 14.8 | **Muerte:** la pantalla | Sobria, con **Reaparecer** con foco (Enter); **«Reaparecer y salir al menú»** abajo. | ☐ bien ☐ raro ☐ mal |

---

## 15. Las 10 preguntas que más nos ayudan

Respóndalas con una frase; con «sí / más o menos / no» y un ejemplo basta.

1. **¿Se lee bien el combate de noche?** ¿Distingue el **dorado (parar)** del **rojo (quitarse)** a simple vista, con las Sombras de noche y con la Reina o un jefe?
2. **¿La economía se siente justa?** ¿Cuánto tardó en juntar **₡70 000** (el chanchito)? ¿Le alcanzó la plata para comer, o le sobró demasiado?
3. **¿El vidrio se ve bien con el juego de fondo?** ¿Hay alguna pantalla donde **se pierde la letra** (cielo claro, nieve, mediodía) o donde el desenfoque **estorba**?
4. **¿El mundo compacto queda demasiado lleno o justo?** ¿Le gusta tener **tantos lugares cerca**, o prefiere el mundo grande con menos?
5. **¿El inventario nuevo está más claro que el de antes?** ¿Le **faltan las pestañas de categoría** en el inventario (ahora solo están en las recetas), o no las extrañó? ¿Encontró rápido ordenar, depositar y buscar?
6. **¿Perder la mitad de la plata al morir (Normal) es justo?** ¿Le da miedo, le da igual, o le molesta? ¿Y recuperar el bolso fue fácil con el aviso de distancia y rumbo?
7. **¿Las manos en primera persona se ven mejor?** ¿Hay algún objeto que **todavía flota, se atraviesa o se ve raro** (arco, escudo, bloque, antorcha)?
8. **¿Los avisos «uno a la vez» ayudan o se pierde información?** ¿Revisó «Lo que se dijo»? ¿Cuál es su ajuste ideal (pocos / normal / todos) y la velocidad de lectura?
9. **¿La pausa automática del mapa, la libreta y la tienda le gusta?** ¿O prefiere que el mundo siga andando (el ajuste se apaga en Ajustes → Juego)?
10. **¿Qué es lo primero que arreglaría o agregaría?** Lo que más le molestó en estos 45–60 minutos y lo que más le gustó.

**Bonus, si le sobra tiempo:** ¿la **comida variada** se entiende sin explicación?, ¿la **insolación** avisa con tiempo?, y ¿la **letra Inter** se ve igual en su Chrome que en las capturas?

---

## Apéndice: comandos usados (todos verificados en el código de `11.13.5`)

| Comando | Qué hace |
|---|---|
| `/prueba` | Sin nada, la **lista** de pruebas. Solo en **supervivencia** y en la **tierra** (`/prueba vida` también anda en otras dimensiones). |
| `/prueba equipo cuero\|hierro\|diamante\|jade [estrellas]` | Arma, herramientas, armadura puesta, 8 casados, 4 ollas, 6 vendas, 16 antorchas. |
| `/prueba colones N` | Da N **unidades** de plata (cada una vale ₡500). |
| `/prueba alfarero` | Don Ubaldo llega a la par suya. |
| `/prueba vida` · `/prueba dia N` · `/prueba cosas` | Vida y comida al máximo · día N de mañana · una de cada cosa nueva. |
| `/prueba bravos [tipo]` · `/prueba jefes2 [cornudo\|tata\|cascabel\|cangrejo\|ciempies]` | Bravos delante · un jefe del monte (la Reina si no dice cuál) y dos ofrendas. |
| `/prueba plato` · `/prueba festival` · `/prueba nemesis` | Plato del día / festival del pueblo / némesis (por si quiere más). |
| `/tiempo dia\|mediodia\|atardecer\|noche\|medianoche` | Cambia la hora. |
| `/clima despejado\|lluvia\|tormenta` | Cambia el clima. |
| `/dar <ítem o bloque> [cantidad]` · `/lista` | Da objetos (hasta 640); `/lista` muestra los nombres. |
| `/sombra [n]` · `/danta [n]` · `/animal <tipo> [n]` | Aparecen criaturas. |
| `/pueblo` · `/pueblo ir` | Distancia y rumbo al pueblo más cercano · ir. |
| `/lugar [tipo] [ir]` · `/lugares` | Lugares cercanos (con `ir`, lo lleva). |
| `/inframundo` · `/cielo` · `/superficie` | Cambia de dimensión (útil para morir en la lava o probar el portal). |
| `/modo creativo\|supervivencia` · `/tp x y z` · `/semilla` · `/curar` · `/guardar` | Utilidades. |

*`/dar` usa las claves internas (`log`, `planks`, `stone`, `chest`, `apple`, `arco`, `escudo_hierro`, `bote`, `fogata`, `mochila`…): si un nombre no lo reconoce, `/lista` muestra el exacto.*
