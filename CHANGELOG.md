# Registro de versiones

## 13.3.1 — 2026-11-15 · Herramientas y armas con volumen y golpe natural en tercera persona

- Herramientas y armas con volumen en tercera persona y en las demas personas de la sala (pedido de Isaac: la espada era un item plano y el movimiento se veia raro): el dibujo del item se extruye pixel a pixel (el mismo makeHeldItemMesh de la primera persona) y la geometria se arma una sola vez por item y se comparte entre todos los avatares; cada avatar tiene su propio material para teñirse con su luz. Antes era una lamina plana que flotaba junto a la mano.
- Agarre: el mango queda DENTRO del puño derecho y la hoja sale hacia adelante y arriba (en reposo se ve de lado, como se sostiene una herramienta); las herramientas miden 14 px en vez de 11; el bloque chico va en el puño, apoyado sobre los dedos, y la comida y los recipientes siguen saliendo por el borde de abajo. Los NPC no cargan items planos (sus cosas son geometria propia), asi que no cambian.
- Golpe natural: un arco de arriba hacia abajo y hacia adelante, del hombro al frente del cuerpo. Las poses del jugador (POSES_JUGADOR en golpes.js) ya no abren el brazo hacia adentro (el lateral y el reves cruzaban la cara hasta el hombro contrario); la muñeca gira la hoja hacia adelante durante el golpe y vuelve suave a reposo. Picar, talar, palear y poner usan el mismo arco, mas corto y repetido. Las poses de las criaturas (POSES) no cambian.
- Los demas jugadores se ven golpear: el bit 32 de flags en la posicion dice «esta golpeando» (validar.js ya deja pasar 0-255, un cliente viejo lo ignora; el protocolo no cambia). Remotos anima el golpe con reloj propio, encadena golpes mientras el bit siga puesto, rota las movidas segun el arma (espada, hacha, garrote, mazo, lanza, cuchillo) y usa el arco corto de trabajo con pico, herramientas o la mano vacia. Probado en red real con anfitrion e invitado: cada uno ve al otro golpear y nadie es expulsado.
- Primera persona: sin cambios. Prueba nueva en npm run revisar: tools/revisar-golpe3p.mjs (poses del jugador, bit de red, Remotos). Capturas de antes y despues en docs/revisiones/capturas_3p/.

## 13.3.0 — 2026-11-15 · Obras integradas al terreno (generador 24)

- Generador 24, obras integradas al terreno (base de la serie 13.3): los mundos nuevos nacen con generador 24 (GEN_MAX = 24, GEN_INTEGRACION en worldgen2.js) y piden la 13.3.0 (meta.minVersion); un cliente viejo ante un anfitrion de generador 24 se rechaza con el aviso de actualizar. Los mundos 21, 22 y 23 quedan IDENTICOS: tools/huella-mundos.mjs genera trozos reales de los tres (4 semillas x 6 lugares x 3x3 trozos) y compara su hash con tools/huella-gen.json, tomado con el codigo de la v13.2.6.
- I1, nada de vacio ni de bocas de cueva bajo las obras: ninguna boca de cueva a menos de R+22 de una estructura ni de R+26 de un pueblo (en el generador 23 hay 43 mil celdas de boca dentro de esos radios en 4 semillas, en el 24 cero); y rellenarBajoObras tapa los huecos de hasta 14 bloques bajo lo construido con roca firme (menos en las estructuras que SI van sobre una cueva: caverna del rey, puente colgante, templo hundido, Barra Honda, geoda, catarata, termales). Vacio a 1-2 bloques bajo las calles de pueblo: de 7,9 % a 0,0 %.
- I2 e I11, agua y puentes: el cauce de un rio es agua para las carreteras y para las calles del pueblo, y donde cruza hay puente en vez de calle hundida; el agua que una estructura deja en la costa o el oceano se recorta al nivel del mar (el domo de agua del templo hundido).
- I5 e I8, detalles y radios: las bromelias cuelgan solo de hojas, clearTrees limpia hasta R+6 sin tope, y los radios de irazu (34), san Lucas (26), cueva del Venado (35) y Marino Ballena (75) estan corregidos solo en el generador 24 (RADIOS24).
- Pruebas nuevas en npm run revisar: huella-mundos (los mundos 21/22/23 no cambian) y revisar-integracion (bocas, vacio bajo calles, agua sobre el mar, coordenadas validas, datos de estructura que se pierden, radios, y tiempo por trozo: mediana de 7-8 ms, igual o mejor que el generador 23).
- Pruebas tolerantes a los finales de linea CRLF (una copia del repo con autocrlf las rompia: revisar-pwa buscaba \n exacto): revisar-pwa usa \r?\n y revisar-datos, revisar-estilo, revisar-pide y revisar-plata separan lineas con /\r?\n/. Comprobado en una copia convertida a CRLF (pasan pwa, datos, plata, version y nombres).

## 13.2.6 — 2026-11-15 · Daño a punto medio

- Balance del daño, punto medio (Isaac: el recorte de la v13.2.4 se pasó, de ×5,2 a ×1,4; pidió «un poco»): el tope del daño total sube a ×2 (src/habilidades.js, TOPE_DANO) y los bonos se escalaron para que, con TODO al máximo, se llegue justo a ×2 (+0,99): nivel del jugador +2,7 % por nivel (tope +23 %), Combate +1,5 % por nivel (+15 %), maestría de arma +0,75 % por nivel (+15 %), yunque +7 % por estrella (+28 % con ★★★★), Mano pesada +5 %, plato de fuerza +8 %, conjunto de diamante +5 %. Siguen sumándose, no multiplicándose. Una espada de madera con todo al máximo pega ≈ 8 (7,96; antes 20,9 en la v13.2.3 y 5,6 en la v13.2.4), la de jade 15,9.
- Defensa: el piso sube a ×0,62 (antes ×0,70) y las reducciones se escalaron para llegar justo ahí: rango Guardián 8 %, Guerrero 8 %, ojo 4 %, coraza 9 %, Cuero duro 6 %, amuleto 3 %. La experiencia por nivel y todos los demás bonos quedan como en la v13.2.4. Todos los textos del juego dicen los números nuevos.
- tools/revisar-progresion.mjs, con las reglas nuevas: el tope de ×2 se alcanza con todo al máximo; una espada de madera con todo al máximo (≈ 8) no supera a una de jade con todo al máximo; a igual nivel de bonos (sin bonos, a medias, al máximo) el material siempre manda; el daño máximo no pasa de 16; la defensa no baja de ×0,62. La tabla nueva está en docs/revisiones/BALANCE_PROGRESION.md. tools/revisar-picar.mjs sin cambio.
- Limpieza: eslint ya ignora docs/revisiones/scripts_integracion/ (scripts sueltos de la investigadora que hacían fallar npm run lint con 28 errores); se suben docs/revisiones/PLAN_INTEGRACION_MUNDO.md y esa carpeta.

## 13.2.5 — 2026-11-15 · Manos al derecho

- Arreglo: las manos del personaje (y de la gente que comparte el modelo) estaban giradas (Isaac: palmas hacia afuera, pulgar del lado equivocado). Causa (src/anatomia.js, brazoHumano): la palma estaba hecha ancha de lado a lado y con los dedos en fila de izquierda a derecha, o sea mirando al frente, y el pulgar salía hacia adentro. Ahora, en reposo, la palma es ancha de adelante hacia atrás y mira al cuerpo: los dedos se alinean en esa dirección (índice adelante, meñique atrás), se curvan un poco hacia el torso y el pulgar queda adelante. Es un solo cambio en brazoHumano, así que vale para el personaje, el vestidor y los vecinos (modelos-gente, modelos-monte, modelos-otros). Visto de frente, de lado y de espalda en el vestidor (antes, de frente, las manos se veían anchas con la palma al frente; ahora de canto) y en primera persona (la mano que sostiene el objeto).

## 13.2.4 — 2026-11-15 · Criaturas, carro, paneles y balance

- Arreglo: las criaturas ya no se retuercen ni se acuestan al recibir un golpe (Isaac, v13.2.2: «se retuercen sobre un eje abajo y se acuestan súper raro y rápido»). Causa (src/entities.js, Mob.hurt): cada golpe SUMABA una inclinación (lean) y un balanceo (roll) a todo el cuerpo, sin tope y girando sobre los pies; con golpes seguidos llegaban a 1,7 rad (casi 100°) y las que no tienen patas ni siquiera los soltaban nunca. Ahora el golpe es un balanceo corto con tope (±0,12 y ±0,09 rad, medido: antes hasta 0,53 rad en pantalla, ahora 0,11 con cinco golpes seguidos), siempre vuelve a cero y lo demás sigue igual: destello rojo, empujón en la dirección del golpe y, si muere, la caída de lado una sola vez. Medido en 15 especies (vaca, perro, danta, jaguar, sombras, cangrejo ciego, grillo de cueva, escarabajo de calcita, tortuga, iguana, gallina…). En red, la criatura del invitado es un títere (no recibe hurt() local): ve lo que el anfitrión le manda.
- Arreglo: el interior del carro en primera persona. Causa (src/vehiculos.js): los ojos iban a 1,75 sobre la base del carro y el techo llega a 1,47: la cámara quedaba ENCIMA de la cabina y el capó y el techo tapaban media pantalla. Ahora los ojos van a 1,15 (una persona sentada, dentro de la cabina; las paredes de la cabina son de una sola cara y desde adentro no estorban) y el carro trae su interior (src/modelos-vehiculos.js): tablero oscuro, volante al frente del asiento, marcos del parabrisas y borde del techo; se ve el capó abajo y el camino al frente despejado. La tercera persona no cambia. El bus ya traía su interior (tablero, barra, ventanas abiertas, asientos) y se ve despejado: no se tocó.
- Arreglo: las pantallas del inventario, mesa de trabajo, horno, cofre y demás ya no parpadean al abrir ni quedan pegadas arriba. Parpadeo, causa (src/style.css): la animación de entrada de las estaciones (slide-in) estaba en .inv-wrap sin la clase .opening; al abrir mandaba la animación del vidrio y a los 900 ms, cuando se quita .opening, volvía a empezar la de la estación (desde la derecha y transparente): el «parpadeo raro un segundo después». Ahora solo corre al abrir, una vez. Centrado: el conjunto de paneles va centrado en vertical contra un alto fijo (Recetas y la fila de la pantalla tienen alto fijo y desplazan por dentro), así que al filtrar recetas nada se mueve (medido a 1366×768: personaje e inventario centrados, Recetas fija de 12 a 748 con 252 recetas y con 2).
- Balance de la progresión (Isaac: «nerfear un poco los porcentajes de daño y demás mejoras al subir de nivel y mañas, que sea un poquito más lenta la progresión»). Los bonos de daño ahora se SUMAN (nivel + Combate + maestría + yunque + maña + plato + conjunto de diamante) y se topan en ×1,4 en total (antes se multiplicaban: con todo al máximo daban ×5,2 y una espada de madera pegaba 20,9 contra 6 de una de hierro; ahora 5,6). La defensa también suma y no baja de ×0,70 (antes llegaba a ×0,59).
- Valores más bajos: bono de daño por nivel del jugador +3,5 % (antes +5 %, tope +30 % en vez de +50 %); Combate 2 % por nivel (antes 3 %); maestría de arma 1 % por nivel (antes 1,5 %), también el menor gasto de aguante; estrella del yunque +9 % de daño (antes +12 %); Mano pesada +7 % (10 %); conjunto de diamante +7 % (10 %); plato de fuerza +10 % (15 %); Puntería ×1,15 (1,25); Se le pega la plata ×1,15 (1,25). Minería, tala, pesca y agricultura: la chance de doble baja un tercio; Cocina 3,5 % por nivel (5 %); Exploración 2 % (3 %); pesca 3,5 % (5 %). Defensa: rango Guardián 7 % (10 %), Guerrero 7 % (10 %), coraza 8 % (12 %), Cuero duro 5 % (8 %), ojo 3 % (5 %), amuleto 3 % (5 %). Rangos: estamina 12 % (20 %), hambre y sed 5 % (8 %), vida 20 % más rápida (30 %); hojas del cuaderno y mañas de comida, sed y hambre también un poco menos. Todos los textos del juego dicen los números nuevos.
- Subir cuesta más desde el nivel 3: el nivel del jugador cuesta hasta 30 % más (nivel 10 y más; +13 % acumulado al nivel 10, +22 % al 15, +28 % al 30; los niveles 1 a 3 igual) y cada habilidad hasta 25 % más (nivel 8 y más; niveles 1 y 2 igual). Como las mañas se ganan por nivel (2, 4, 7, 10, 13…), llegan un poco más tarde.
- Partidas guardadas: conservan su nivel. SAVE_FORMAT 10 (migración 9 → 10 en src/save.js): la experiencia se vuelve a escribir con la curva nueva sin cambiar el nivel de nadie ni cuánto lleva del siguiente (xp 500, nivel 11 → xp 586, nivel 11; Minería 300 → 340). Solo cambian los valores de los bonos. Un mundo guardado con esta versión no lo abre una más vieja (lo rechaza con aviso, como siempre).
- Nuevo tools/revisar-progresion.mjs (en npm run revisar): imprime la tabla de antes y después por nivel y comprueba que el daño máximo no pasa de ×1,4 ni de 12, que una espada de madera con todo al máximo no pega más que una de hierro sin bonos (ni la de piedra más que la de diamante), que la defensa no baja de ×0,70, que los niveles 1 a 3 cuestan igual, que lo alto cuesta entre 20 y 30 % más y que la migración no cambia el nivel de ninguna partida. La tabla está en docs/revisiones/BALANCE_PROGRESION.md.

## 13.2.3 — 2026-11-15 · Sin congelarse

- Arreglo: el juego se congelaba volando en creativo lejos del origen (Isaac, v13.2.2: «se quedó pegado y no volvió a moverse más»; el mapa, Escape y los menús seguían, el mundo no cargaba más).
- Causa exacta (src/carreteras.js, drawFeature, la placa de las carreteras): anotaba la estructura con coordenadas del MUNDO (x, z) en vez de las del trozo, y world.ensureChunk las usa como índice del arreglo del trozo (idx(st.x, st.y, st.z)). Cerca del origen el índice caía en otro bloque y la placa simplemente no se registraba; a más de ~1 000 bloques el índice se salía del arreglo (en la prueba, x = −1374, z = −1515 daba −7438), BLOCKS[undefined].key lanzaba un TypeError y, como el trozo nunca llegaba a cargarse, la excepción se repetía en cada cuadro: world.update no pasaba de ese trozo, el jugador (que solo se mueve si su trozo está cargado) quedaba quieto y main.js solo anotaba el PRIMER error, así que no se veía nada. Venía desde el generador 6 (carreteras): no es de la lava del generador 23 ni de los workers (no hay workers de trozos).
- Ahora las placas de las carreteras se anotan con coordenadas locales (x − origen del trozo): sus textos por fin se registran. Los bloques no cambian: los mundos 22 y anteriores siguen idénticos bloque a bloque.
- Que nunca más quede congelado: (1) world.ensureChunk reintenta una vez un trozo que falla al generarse y, si sigue fallando, lo llena con un respaldo seguro (bedrock, roca hasta y 59 y aire arriba: depende solo de la altura, igual en todas las máquinas) y anota el error; (2) una estructura con coordenadas fuera del trozo o sobre un bloque desconocido se salta en vez de tumbar la carga; (3) un trozo que no se puede mallar se deja sin malla y se sigue; (4) main.js anota cada error distinto del cuadro (consola y window.__nbErrores), avisa una vez en pantalla y, si el cuadro falla 90 veces seguidas, regenera los trozos cargados (game.recuperarTrozos); (5) si el jugador queda retenido esperando terreno más de 1,2 s sale «⏳ Cargando terreno…».
- Nuevo tools/revisar-masa.mjs (en npm run revisar): genera 960 trozos de los generadores 23 y 22 en 6 semillas y 5 lugares hasta ±3 200 bloques del origen (11 biomas, desde y = 1 hasta y = 119) y comprueba que ninguno lanza una excepción, que cada estructura trae coordenadas locales válidas sobre un bloque que existe, que no hay ids de bloque desconocidos y que el tiempo por trozo es razonable (promedio 21 ms; el peor, 706 ms, un pueblo). Sin el arreglo falla: x = −1374, z = −1515, índice −7438.
- Probado en el navegador (Chrome real y el del panel): vuelo en línea recta, en espiral y en órbita sobre pueblos de hasta ~2 400 bloques con el generador 23 sin una sola excepción (build de desarrollo y de producción); el mundo semilla 3 en el trozo que antes fallaba (−1374, −1515) carga normal; un trozo roto a propósito se rellena con el respaldo y el juego sigue; un error persistente se anota y recuperarTrozos regenera los 225 trozos; y el aviso «Cargando terreno…» sale.
- Arreglo: una pestaña con un mundo abierto se recargaba sola (Isaac: «Leave site? Changes you made may not be saved» a media partida, con dos pestañas abiertas). Causa exacta (src/pwa.js, el oyente de controllerchange): el service worker es uno solo para todas las pestañas; al activar la versión nueva desde una pestaña (la del menú, o por la actualización automática de la 13.2.1) TODAS reciben controllerchange y todas hacían location.reload(), también la que estaba jugando. Ahora, con un mundo abierto, no recarga nunca: deja el aviso fijo «Hay una versión nueva» y se aplica sola al volver al menú, ya guardado (si el anfitrión sale con invitados solo avisa). Sin mundo abierto recarga como antes. El beforeunload (cerrar con cambios sin guardar) no cambia. Probado en Chrome con dos pestañas del build de producción en localhost (una en el menú, otra en un mundo; se publicó otra versión): la del menú se actualizó, la del mundo siguió sin recargar con el aviso fijo y recargó al salir al menú; revisar-pwa lo comprueba.
- Arreglo: el panel de depuración (F3) caía encima del minimapa y no se leía. Ahora va a la derecha del minimapa y bajo la brújula (también en pantalla chica), con fondo semitransparente. Y el jugador no cae al fondo esperando un trozo: game.terrenoListo exige cargadas su columna y las cuatro de alrededor; si no, queda retenido arriba con «Cargando terreno…» (también al ir en vehículo o montura).

## 13.2.2 — 2026-11-15 · Logo sin cortes

- Arreglo: en el menú principal se cortaba el logo (Isaac, en el sitio en vivo con la 13.2.1, ventana de ~1193×773: faltaba la «s» de NanoBlocks y el velo oscuro de detrás terminaba en bordes rectos arriba y a la derecha).
- Causa (medida en el navegador): el logo del menú mide hasta 720 px de ancho (vidrio.css, v11.13.3) pero el panel del menú es de 640 px (.panel.wide) y .panel recorta con overflow (x oculto, y con scroll). En 1193×773 el panel va de x = 281 a 911 y el logo llegaba a 985: se cortaba en x ≈ 911; el velo (::before, que sale 18 % arriba y 8 % a los lados) también se recortaba en el borde del panel, por eso terminaba recto. No era un fallo de repintado ni de la 13.2.1: pasaba siempre que el logo pasaba de los 640 px.
- Ahora el panel del menú mide hasta 760 px, el logo ocupa solo lo suyo y se centra (max-width 100 %), los botones siguen midiendo 630 px, el velo va sin filter: blur (el degradado radial ya es suave) y con un margen arriba para que quepa dentro del panel, y la animación del logo usa backwards en vez de both para no dejar una capa de composición con el transform final. Medido a 1193×773, 1366×768, 1920×1080, 375×812 y 667×375: la imagen cabe siempre dentro del panel y el velo no se recorta.

## 13.2.1 — 2026-11-15 · Se actualiza solo

- El juego se actualiza solo cuando sale una versión nueva (Isaac tuvo que borrar las cookies para ver la 13.2.0 y perdió su mundo). Antes el service worker nuevo esperaba hasta que alguien encontrara Ajustes → Aplicación → Actualizar. Ahora (src/pwa.js, función decidir): en el menú o al arrancar, si hay una versión nueva esperando, se activa y la página se recarga UNA vez, con el aviso «Actualizando a la versión X…»; con un mundo abierto NUNCA recarga a media partida: sale un aviso fijo (no un toast de 7 s) «Hay una versión nueva. Actualizar ahora», cuyo botón guarda el mundo y recarga, y la versión se aplica sola al volver al menú, ya guardado.
- Multijugador: un anfitrión que sale con invitados dentro no recibe la versión sola (solo el aviso fijo y el botón); un invitado guarda lo suyo y la recibe al salir. Un invitado viejo ante un anfitrión nuevo ve «Actualice el juego: recargue la página» y una sola recarga basta (en el menú el service worker nuevo ya se activa solo).
- Se busca versión nueva al arrancar, cada 15 minutos (antes 6 horas) y al volver a la pestaña o a la ventana. El service worker generado contesta «version» para que el aviso diga qué versión llega.
- Sin bucles: la versión ya intentada se guarda en sessionStorage antes de activarla y nunca hay más de una recarga automática por versión; si el service worker nuevo falla al instalarse (o lo reemplaza otro) el juego sigue con el que hay, sin errores. Antes de cualquier recarga el mundo queda guardado; no se borra ningún dato.
- Nuevo tools/revisar-pwa.mjs (en npm run revisar): la decisión en cada caso (menú, mundo abierto, anfitrión con invitados, versión ya intentada), cinco revisiones seguidas = una sola aplicación, intervalo de 15 min y el cableado de ui.js y del service worker. Probado en el navegador con dos builds de producción servidos en el mismo origen.

## 13.2.0 — 2026-11-15 · Más lava y menos luz abajo

- Lo hondo es más difícil (decisión de Isaac sobre PLAN_CUEVAS.md punto 5: «¿más lava y menos luz abajo?», «Sí, más difícil»). Solo esas dos cosas: nada de criaturas de noche ni de las vetas grandes (C2) ni C5.
- Menos luz con la profundidad (nuevo src/profundidad.js; en tiempo real, no toca el generador, así que vale también en mundos viejos y sin reconstruir mallas: solo se mueven una uniforme del shader, el brillo y la niebla). Normal de y = 40 para arriba y casi negro de y = 15 para abajo, con una curva suave (ningún escalón de un bloque pasa de 0.10; sin saltos al cruzar un umbral): luz del cielo que se cuela por las bocas, piso de luz del shader (queda el 70 %, para que se vean siluetas y no negro absoluto) y niebla, que baja hasta 46 bloques de alcance. Las antorchas, la lava, los hongos y el cristal siguen alumbrando igual (su luz va por otro canal: en la prueba una antorcha da lo mismo a y = 44 que a y = 14). El deslizador de brillo no deja lavada la oscuridad (cuenta hasta 70 % menos abajo; el modo oscuro no cambia) y el casco de espeleólogo gana valor: su linterna sube de 0,55 a 0,75 conforme se baja.
- Más lava abajo (generador 23, GEN_PROF en worldgen2.js; GEN_CUEVAS sigue en 22). Zonas de ~28 bloques con el borde ondulado, 75 % con lava y un nivel de y = 11 a 30 (hay más zonas bajas que altas, así que la lava crece hacia el fondo), y se rellenan todos los huecos de cueva por debajo del nivel: charcos y bolsas desde y ≈ 30 y lagos de lava bajo y ≈ 20, con orilla transitable donde el piso de la sala sube. Donde hay agua subterránea no hay lava. Cada zona se tapa con una pared fina donde la vecina tiene menos lava (mismo molde que el agua por cuencas), y la prueba comprueba que ningún bloque de lava queda junto a aire o agua de lado ni encima de aire (0 fugas en 1 160 bloques). Todo sale de hash3 y Simplex, nada de Math.random. Tiempo por trozo: 5,3 ms con generador 22 y 5,3 ms con 23 (meta ≤ 12).
- Lava por trozo (promedio de 144 trozos de 4 semillas), generador 22 → 23: y ≤ 10 (el piso de siempre) 26,4 → 26,4; y 11–15 0,0 → 13,6; 16–20 0,0 → 12,3; 21–25 0,0 → 11,0; 26–30 0,0 → 1,8; 31 o más 0,0 → 0,0.
- Las bolsas grandes se avisan antes de caer en ellas: de la lava con lava a los lados que hay en 28 bloques a la redonda suben brasas anaranjadas (a lo más 3 chorros cada 0,35 s; sin luces extra ni mallas). Y, la primera vez que se baja de y = 34 bajo techo, un aviso y una línea del diario: «Cuanto más hondo, más oscuro y más caliente: lleve antorchas.»
- Los mundos nuevos nacen con generador 23 (GEN_MAX = 23) y un mundo guardado con generador 23 pide la 13.2.0 (meta.minVersion); los de 22 o menos quedan IDÉNTICOS (huella FNV de 36 trozos de tres mundos 22, calculada con el código de la 13.1.2, y los de 21 y 17 de revisar-cuevas). Red: un cliente de la 13.1.2 ante un anfitrión con generador 23 se rechaza con «Actualice el juego: recargue la página» (probado con el código del tag v13.1.2).
- Nuevo tools/revisar-profundidad.mjs (en npm run revisar): mundos 22 idénticos, 23 determinista y sin Math.random, tabla de lava por banda (la lava crece hacia el fondo y arriba de y = 30 no cambia), cero fugas, tiempo por trozo, curva de luz monótona con mínimo 0,12, el casco y la niebla.
- Probado en el navegador: mundo de prueba nuevo con generador 23 (semilla 424242), lago de lava con orilla en y 14–26 y brasas visibles, salas selladas de 7×7 bajadas a y = 44, 30, 20 y 14 sin luz, con antorcha y con casco; y en red con relés reales (anfitrión y un invitado en el mundo 23): el hash del terreno de 31×29×31 bloques alrededor del lago es el mismo (755dee09, 6 091 de lava, 9 131 de aire), el invitado sigue «dentro» y nadie es expulsado.

## 13.1.2 — 2026-11-14 · Vida y sonido de la cueva

- Vida y sonido de la cueva (C4 de docs/revisiones/PLAN_CUEVAS.md). No cambia el terreno: no sube el generador y vale en cualquier mundo, nuevo o viejo.
- Tres criaturas propias de cueva, con modelo original y ficha en el bestiario: el cangrejo ciego (pálido y sin ojos, junto al agua), el grillo de cueva (antenas largas y patas de brincar, en lo seco y oscuro) y el escarabajo de calcita (con costra de calcita; si uno se le arrima se hace bolita y parece una piedra). Son pacíficas. Las hace aparecer solo el anfitrión (spawnMob ya descarta lo de un invitado; las personas las reciben por los mensajes de criaturas de siempre) con tope por zona: a lo más 3 en 22 bloques, 2 de cada especie y 6 en total.
- Sonido de cueva, todo sintetizado (sin archivos nuevos) y local a cada persona (sin tráfico de red): goteo desde las estalactitas, agua corriendo donde hay agua a cielo abierto de cueva, y un eco que crece con el tamaño de la sala (se mide hasta dónde llega el aire en 8 direcciones y hacia arriba). A lo más 3 emisores de sonido cerca, de cada clase a lo más 2, y un charco grande cuenta como uno. Los subtítulos los nombran.
- El brillo de los hongos y del cristal cambia con el lugar: motas de luz que flotan, verde azulado en selva, manglar y bosque nuboso; ámbar en lo seco; rojizo en volcán; azul pálido en altura; y el cristal con un tono distinto por región.
- Libreta: una línea la primera vez que se pisa cada tipo de cueva (sala enorme, goteo, agua corriendo, hongos y cristal). Nueva prueba /prueba cuevavida (las tres criaturas delante) y tools/revisar-cuevavida.mjs en npm run revisar: modelos y animaciones, topes del spawn (total, zona y especie), que un invitado no haga nacer nada, qué especie le toca a cada sitio, máximo 3 emisores, tamaño de sala y color del brillo.

## 13.1.1 — 2026-11-14 · Sitios kársticos

- Sitios kársticos con nombre tico (C3 de docs/revisiones/PLAN_CUEVAS.md), solo en mundos de generador 22 (minV 22): la Cueva de Barra Honda (galería caliza con estalactitas y columnas gigantes de calcita, tres pozos con agua al fondo y una repisa de cuarzo con el cofre), la Cueva de Venado (sala larga con un río subterráneo, dos puentes de piedra, estalactitas y hongos, y el cofre en un banco de la orilla) y la Geoda mayor (esfera de basalto, caliza y cuarzo con racimos de cristal y el cofre sobre un pedestal en el centro).
- Cada sitio tiene una boca de piedra en la superficie con su placa y dos antorchas, un pozo con escalera de caracol, un cofre con botín propio y una entrada en la libreta al descubrirlo («Descubrí Cueva de Barra Honda (rara)»; la Geoda mayor es legendaria). Hay uno cada ~800 bloques por tipo, en tierra firme.
- En red: todo sale de la semilla (la construcción usa el azar de semilla + posición, nunca Math.random), así que cada máquina genera los mismos cofres con el mismo botín; los cofres siguen siendo los de siempre (candado y mensajes cofre_* del anfitrión). Los pozos y el río llevan agua forrada de piedra y por debajo del piso, para que no se desborde.
- Nuevo tools/revisar-karst.mjs (en npm run revisar): para tres semillas y cada sitio comprueba que hay un cofre en su lugar, que el botín es idéntico con otro Generator y otro orden de trozos, que el cofre se alcanza a pie desde la boca, que el mundo 21 no los tiene y que traen nombre, rareza y placa.

## 13.1.0 — 2026-11-14 · Cuevas nuevas

- Cuevas rediseñadas (C1 de docs/revisiones/PLAN_CUEVAS.md). Los mundos nuevos nacen con generador 22 (GEN_CUEVAS); los de 21 o menos quedan IDÉNTICOS (nuevo tools/revisar-cuevas.mjs: huella de 36 trozos de tres mundos viejos, calculada con el código de la 13.0.5; en el navegador y en Node da lo mismo).
- Menos cuevas y más grandes. Un tipo de cueva por región (ruido de baja frecuencia, inclinado por bioma: salas más húmedas y grandes en selva, manglar y bosque nuboso; más túnel en el desierto y el bosque seco): salas grandes y raras («queso»), espagueti largo y fideos finos solo pegados a una sala para unirla con el resto. La capa de y 51–60 casi no tiene huecos.
- Bocas a la superficie: rampas en diagonal de 2–3 bloques de ancho (una por celda de 16, con cierta probabilidad, nunca en mar, manglar, volcán ni cauces) que bajan hasta una sala chica. Todo sale de la semilla (Simplex y hash3), nada de Math.random.
- Adiós a las paredes rectas del acuífero (el muro de 2 bloques cada 48): el agua va por cuencas, con niveles escalonados que siguen los contornos de un ruido, y solo se tapa donde una columna vecina tiene menos agua.
- Medido con el script del plan (256 trozos alrededor del origen), antes (v21) → después (v22). Semilla 123457: aire bajo tierra (y 1–60) 15,6 % → 10,0 %; trozos con la boca dentro del propio trozo 44 % → 38 % (y alcanzables desde arriba 70 % → 75 %); franja de 48 con aire 0,0 % frente a 23,6 % del interior → 12,0 % frente a 11,7 % (sin muro); 10,5 → 10,7 ms por trozo. Semilla 777: aire 9,6 %, bocas propias 43 %, 11,4 ms por trozo. Metas del plan: aire 8–12 %, sin pared recta, ≥ 1 de cada 3 con entrada, ≤ 12 ms: cumplidas.
- Red: un anfitrión que manda un generador más nuevo que el que sabe este juego (GEN_MAX = 22 en version.js) se rechaza al entrar, con el mensaje «Actualice el juego: recargue la página». Probado en revisar-cuevas con una sesión de invitado de verdad (entra con 21 y 22, no entra con 23). Un mundo guardado con generador 22 pide la 13.1.0 (meta.minVersion).

## 13.0.5 — 2026-11-14 · Picar más parejo

- Balance de picar. Isaac: «a nivel 3 de minería, picar con pico de madera es como si fuera de diamante encantado». Causa medida: el yunque (+12 % por estrella), la Minería, la hoja «manos» y la maña «buen brazo» se MULTIPLICABAN entre sí (todo al máximo daba ×2,6), así que un pico de madera criado alcanzaba al de piedra y el de piedra al de hierro.
- Ahora los bonos de velocidad se SUMAN y el total se topa en ×1,5 sobre la base de la herramienta. Minería +2 % por nivel (máx. +20 %) y mineral doble +1,5 % por nivel; Tala +2,5 % y tronco doble +2 %; yunque +6 % de velocidad por estrella (el daño sigue en +12 %); hoja «manos» y maña «buen brazo» +5 % cada una. Los textos de las habilidades, del yunque, del cuaderno y de las mañas dicen los números nuevos. El XP y las estrellas guardados no se tocan.
- Regla de oro: el pico de madera con todo al máximo nunca pica más rápido que uno de piedra sin bonos, ni el de piedra al máximo más rápido que uno de hierro sin bonos. Nueva verificación en npm run revisar (tools/revisar-picar.mjs).
- Tiempo de picar piedra, antes → después (segundos): madera todo en 0, 1,13 → 1,13; madera con Minería 3, 1,00 → 1,06; madera con Minería 3 + ★1 + manos + buen brazo, 0,71 → 0,92; diamante ★★★, 0,21 → 0,24; diamante al máximo, 0,11 → 0,19; piedra al máximo, 0,21 → 0,38 (hierro sin bonos: 0,38); madera al máximo, 0,43 → 0,75 (piedra sin bonos: 0,56). Tabla completa con el mineral de hierro y todos los factores encontrados en docs/revisiones/BALANCE_PICAR.md.

## 13.0.4 — 2026-11-14 · Inventario sin saltos

- En la pantalla del inventario, Personaje e Inventario ya no suben ni bajan según cuántas recetas muestre el filtro o la búsqueda: el recuadro tiene alto fijo (el de la pantalla), los dos paneles quedan arriba y Recetas se estira a todo el alto y se desplaza por dentro. Con pocas recetas sobra espacio abajo, pero el panel no se encoge.
- Lo mismo en la mesa de trabajo, el horno y las demás estaciones con Recetas al lado, y en pantallas angostas (la lista de recetas tiene alto fijo en la columna).
- Medido con getBoundingClientRect en 1400×900, 1400×720, 1024×768 y 390×800, con «Todo», cada filtro y búsquedas de 0, 4 y 250 resultados: la posición de Personaje, Inventario y Recetas no cambia ni un píxel (antes, con una búsqueda vacía, Personaje e Inventario bajaban de 16 a 242 px).

## 13.0.3 — 2026-11-14 · Nadie se mete dentro de nadie

- La gente y las criaturas ya no se meten unas dentro de otras: hay una separación suave (empuje proporcional al traslape en el plano horizontal, con el ancho del modelo, brazos y sombrero incluidos) que pasa por la misma colisión con bloques, así que nadie queda dentro de una pared. Los jefes no se mueven; los demás se apartan de ellos.
- El jugador tampoco se mete dentro de una persona o animal: sale entero de su parte, y la criatura se aparta apenas (con tope) y nunca hacia un precipicio. Los enemigos y los jefes no empujan ni son empujados por quien juega.
- Rendimiento: cuadrícula de 2 bloques, solo cerca de quien juega. Medido en Hojancha con 42 vecinos: 0,017 ms por cuadro; los pares a menos de 0,5 bloques de distancia pasaron de 2,4 en promedio a 0,01. En red lo calcula solo el anfitrión y las posiciones viajan en los mensajes de criaturas de siempre (5 por segundo): no hay mensajes nuevos.
- «Correr con un toque de Ctrl» viene ACTIVADO por defecto (quien lo apagó a propósito lo conserva apagado). Un toque corre y otro deja de correr; soltar W no corta la carrera mientras el ajuste está encendido. En móvil o con control no cambia nada.
- Nueva prueba en npm run revisar (tools/revisar-separar.mjs): once en el mismo punto pegados a una pared se separan en pocos segundos y ninguno queda dentro de un bloque; el jefe no se mueve; el jugador no atraviesa a una persona corriendo ni la tira del borde.

## 13.0.2 — 2026-11-14 · Mapa fluido al alejar y arrastrar

- El mapa de pantalla completa ya no se traba al alejarlo (escala 16) y arrastrarlo. Medido en un mundo de prueba, antes → después: cada cuadro al arrastrar sobre zona nueva, mediana 85 ms → 12,6 ms (el peor, 631 ms → 21 ms); arrastrar lejos, de 4 s por cuadro a 18 ms como máximo.
- Cómo: las baldosas se generan con presupuesto en milisegundos (centro primero) y, a escala 8 y 16, con una columna cada 2 píxeles (4 veces menos trabajo, mismo aspecto); el caché de baldosas es LRU y de 1 500; las carreteras y los lugares se guardan por bloques de 512 bloques en vez de recalcularse en cada redibujo; los lugares se revisan de a un tipo por vuelta y no se tocan mientras se arrastra; y varios movimientos del ratón por cuadro piden un solo redibujo.
- Lo que no cambia: abrir el mapa lejos por primera vez en una zona nueva sigue tardando unos 5 s en completarse (sobre todo los lugares, que son caros de calcular), pero ahora se va llenando sin bloquear el arrastre. Una vez lleno, redibujar cuesta de 4 a 6 ms.

## 13.0.1 — 2026-11-14 · Listas desplegables legibles

- Las opciones de las listas desplegables (Tipo de mundo, Dificultad, Ajustes, orden del inventario) se leen: fondo oscuro y texto claro, y la opción marcada se distingue.

## 13.0.0 — 2026-11-14 · NanoBlocks, publicado

- Primera versión pública: el juego completo (mundo, pueblo, criaturas, jefes, el Rey y su final, jugar con amistades) en github.com/nanoyackson/nanoblocks, y para jugar en https://nanoyackson.github.io/nanoblocks/.
- Sin cambios de jugabilidad ni de guardado: es la 12.16.6 con la versión de lanzamiento. Los mundos guardados siguen abriéndose igual.

## 12.16.6 — 2026-11-14 · Todo listo para publicar

- Listo para publicar (sin publicar): checklist `CHECKLIST_PUBLICAR.md` al día con v12.9–v12.16.5 (quedan abiertos A2, A6, B8, D8, E5, G3, G4 y H2–H6, todo de nanoyackson salvo H2).
- Decisión A1 aplicada: el nombre de pila del autor pasó a «nanoyackson» en CHANGELOG, docs, `src/` y `tools/` (script; revisado el sentido de las frases).
- G2: `THIRD_PARTY.md` cotejado con `public/`: 283 grabaciones CC0 (469 archivos, todos en el manifest), Kenney, Inter y three.js; sumados Trystero 0.27.0 y los servicios de red (relés Nostr, STUN, TURN openrelay).
- H1: copia limpia (`npm ci`, lint, build) en cero y sin «(!)» ni «Circular». E6: Lighthouse 11 PWA = 100 (instalable, maskable, splash, viewport); falta la prueba en un teléfono real.
- H7: `CONTRIBUTING.md` y `.github/PULL_REQUEST_TEMPLATE.md`. D6: búsqueda de rutas y correos vacía (solo quedan los dos documentos de trabajo que se borran en H2).

## 12.16.5 — 2026-11-14 · Gente y trama · Remate y epílogo (fases 6 y 7 del Rey)

- Gente y trama (fase 6): al usar la Corona suben con faroles, por el sendero, los vecinos que la partida YA conoce (Don Chema, Doña Eulalia, Niña Chepa, Doña Flor, Ñor Tino, Mae Wilber, Don Anselmo, Tío Rigo, Prima Marielos y Yendry; el Canelo solo si es de la casa y anda con uno). Son criaturas inmortales (`m.data.inmortal`, nuevo en `Mob.hurt`) paradas sobre el sendero de piedra, afuera del anillo que se achica: no se mueren ni se atascan, y se limpian con el redondel. Si falta alguno, no está y no pasa nada (`src/reyremate.js`).
- Qué hace cada uno: Don Chema lee la carta nueva de Zenaida (`carta_zopilote`, 4 s con `ui.dialog`; entra al cuaderno de cartas) y, si hay Corazón, lo deja entero; Eulalia da 6 min de aguante; Chepa 6 min de fuerza y, en F3 con hambre, otro plato (`ayudaEnPelea` ahora acepta `g.rey`); Flor cura si baja de la mitad; Tino arregla el arma una vez cuando baja del 20 %; Wilber tumba con flechas de 5 a los zopilotes de la escolta cada 2 s; Anselmo tapa el borde roto con basalto una vez; Marielos habla y «vende»; Yendry toca el cencerro y grita en cada toque del coro; el Canelo ladra antes de cada rayo y muerde a la escolta; el Seguro de Rigo ya cubría morir aquí (una vez).
- Remate (fase 7): al caer el Rey, el reloj sube al amanecer, los faroles del redondel se encienden de uno en uno (con una campanada), la gente dice sus líneas (Chepa, Tino, Eulalia, Marielos, Anselmo) y Yendry entrega la Campana de la casa. Después salen los créditos (una sola vez), con el himno de marimba (`concert()`) y aplausos al cerrar. Vencer al Rey una 2.ª vez no repite premios, créditos ni maña.
- Créditos dinámicos (`rolloCreditos` en `reyremate.js`): nombres e íconos de quienes subieron, sus frases, el Canelo y tres números de la partida (días, caídas, jefes). El autor es «nanoyackson».
- Ítems únicos nuevos: `campana_casa` (1190; clic derecho en el patio: cura 6, +4 de comida y +1 de reputación en el pueblo, una vez al día, `meta.campanaDia`), `mantilla_zenaida` (1191; en el bolso, 5 % menos de daño; la deja el epílogo) y `foto_cumbre` (bloque 698, un marco en la mesa; cae si subió alguien). El cigarro es el `cigarros_62` (510) que ya existía: Anselmo lo suelta al final. Arte ya conectado (`ARTE`; `cigarros_62.png` es la copia de `cigarro_anselmo.png`); el marco no muestra la foto (solo la textura de tablas): anotado en `PEDIDOS_ARTE.md`. Cada persona recibe esos premios una sola vez (`meta.reyPremio`, por `userId` con invitados).
- Mañas de jefe (`src/manasjefe.js`, sin imports): una por jefe, la primera vez, sin gastar casillas (`meta.manasJefe`; se ven en la libreta, pestaña mañas, y `mana(g, k)` las lee): Seda de la Reina, Oído de cascabel, Cuerno firme, Panza de sapo, Concha, Mil patas, Piel de ceniza, Pluma al viento y Rey de la cumbre (+2 corazones).
- Epílogo (`epilogo.js`): cierra cada hilo con una frase del diseño y cuenta la Noche del Rey si ocurrió (la historia NO exige al Rey); si un hilo quedó abierto, su línea se salta. La línea vieja de Anselmo ahora es condicional (si ya fue por los cigarros). Deja la mantilla una vez.
- Con invitados: los créditos y un cierre corto salen en la máquina de cada persona presente; el premio llega por el botín, una vez por persona. «Tranquilo» ya no tiene el combo de la F4.
- /prueba final fase2|fase3|fase4|creditos|epilogo (y /prueba zopilote fase2…): saltan a cada fase con el redondel y la gente armados.
- SAVE_FORMAT 9 (meta.manasJefe y meta.reyPremio; migración 8→9) y MIN_VERSION 12.16.5 (ids 1190, 1191 y bloque 698).
- PARA QUE NANOYACKSON REVISE EL TONO. Nombres de mañas: Seda de la Reina, Oído de cascabel, Cuerno firme, Panza de sapo, Concha, Mil patas, Piel de ceniza, Pluma al viento, Rey de la cumbre. Frases nuevas (en `FRASES` y `CIERRE` de `reyremate.js` y en `lineas` de `epilogo.js`): las de la tabla 3.3 del diseño más «La doña dejó otra línea al pie: «Cuando suene la campana, no se quede mirando.»» (Chema, F4), «¡Se la dejé como nueva!» (Tino), «¡Aquí firma, aquí firma, que ya le tengo comprador al cerro!» (Marielos, F3), «Nunca fui a comprar los cigarros…» (Anselmo, alba), «¡Tome, es de la casa! Para que nos llame cuando haya que comer.» (Yendry), «¡Otra vez!», «¡Ya casi, ya casi!», «¡El último!» (Yendry, toques del coro) y los renglones de los créditos («Subieron con faroles», «Ladró antes de cada rayo, sin que nadie se lo pidiera», etc.).

## 12.16.4 — 2026-11-14 · Arreglos de red

- Un invitado honesto que explora ya NO se expulsa por «demasiados mensajes»: `src/red/limites.js` marca `pos` y `chunks_pide` como «blandos» (si exceden se descartan sin castigo; solo un inundador sostenido, más de 400 descartes en 5 s, cae). En `sesion.js` la velocidad se mide contra una referencia de al menos 0,15 s atrás (antes dos posiciones pegadas por el relé daban una velocidad falsa y acumulaban «correcciones»), y el invitado pide los trozos de alrededor al cambiar de zona (a lo sumo uno cada 3 s) en vez de solo cada 30 s.
- Redondel del Rey en red: `MAX_CAMBIOS` pasa de 3 000 a 8 000 (el redondel en una ladera usa ~4 000), así que altar, faroles y cornisa ya no quedan fuera del diario ni de lo que ve el invitado.
- Arpía: la ráfaga SIEMPRE avisa (silbido + anillo azul): 0,6 s con vida normal, 1,0 s furiosa.
- CSP: `#red-codigo-ver` ya no usa `onclick` inline (`addEventListener`). `Anfitrion.hola → fichas()` ya no lanza si el anfitrión tiene el menú abierto sin partida cargada (rechaza el «hola» con gracia).
- Pruebas nuevas en `npm run revisar`: `tools/revisar-red4.mjs` (vuelo largo de 2 min con ráfagas de mensajes sin expulsión; pedidos de trozos a 20/s sin expulsión; inundadores de `pos` y de `bloque` sí caen; Arpía avisa a 0,6 s y 1,0 s) y en `revisar-rey.mjs` el redondel completo (altar, 8 faroles, cornisa, diario con 40 % de margen).

## 12.16.3 — 2026-11-14 · Música y cámara del Rey (fase 5)

- Música y cámara del Rey (fase 5 del diseño): `Music.composeRey(fase)` y el parámetro `s.rey` de `Music.update` (sustituye a la música de pelea). Preludio (latido cada 2 s y arpa larga), F1 ostinato de arpa grave con latido, F2 + bajo de marimba y truenos, F3 + octava doblada y campanas, F4 pentatónica mayor con marimba en terceras y campana cada dos compases, golpe final: 1 s de silencio y el himno de la casa (12 notas de marimba, una sola vez). El volumen sube por fase (×0,8 / 1 / 1,25 / 1,5 / 1,4) y sigue mandando el ajuste «Música». Cero archivos de sonido nuevos (bancos CC0 `latido`, `trueno`, `campana`).
- Cinco momentos de cámara en `src/reycine.js` (≤ 5 s, el control nunca se quita, cualquier tecla o clic los salta): la llamada (3 s, barras, temblor, brillo de la Corona), el cambio a tormenta (2 s, relámpago blanco), la caída (3 s, barras, cámara lenta de 0,4 s al tocar el suelo), el amanecer (4 s, barras, luz dorada y cencerro) y el golpe final (giro corto de 1,2 s). La cámara lenta del golpe final baja de 1,4 s a 0,6 s.
- Con invitados: la música y las cinemáticas corren también en la máquina de quien visita. No hay mensajes de red nuevos: la fase se saca de la vida de la criatura `rey_zopilote` (la misma que ya viaja en la sincronía, con los umbrales 70/40/12 %). La cámara lenta la pone solo el anfitrión (él simula), así que no desincroniza a nadie.
- «Movimiento tranquilo» (`calmaActiva`): sin sacudidas, inclinaciones ni relámpagos; quedan la luz y el sonido.
- Decidido (orquestadora, 14-nov): la vida del Rey se queda como en v12.16.2 (hábil ~80 s, promedio ~86 s); anotado en `BALANCE.md`.
- Lo que viene: v12.16.4 gente, trama, remate y epílogo (créditos con `concert()` y aplausos, los vecinos que suben, Yendry y la campana, dificultad «Tranquilo» sin combo). No toca guardado ni ids (sin cambio de SAVE_FORMAT ni MIN_VERSION).

## 12.16.2 — 2026-11-14 · Cerebro del Rey (fase 4)

- Cerebro del Rey (fase 4 del diseño): el Rey Zopilote pasa a **cuatro fases** con umbrales 70 / 40 / 12 % de su vida máxima real (la que escala con la red, `data.vmax`; antes comparaba con la vida base y con invitados se descuadraba).
- F1 «El Vuelo»: carril rojo de 3 de ancho y 20 de largo (0,9 s) antes de la picada, que se esquiva rodando; **escolta** de 3 zopilotes chicos de 6 de vida cada 22 s. F2 sin cambios de fondo (tormenta, rayos, plumas; el anillo se achica) más un trueno de aviso en cada tanda de rayos.
- F3 «Alas rotas»: **coraza de ceniza** que absorbe el 65 % de cada golpe hasta que un golpe fuerte (clic central o F) o un arma contundente la rompe (queda aturdido 5,5 s y se vuelve a formar a los 12 s); **aletazo rasante** (ola baja con carril blanco: se salta o se pasa barriéndose); 2 zopilotes de ceniza cada 20 s.
- F4 «El Amanecer»: **combo de tres golpes dorados** (5-5-6) cada 6 s, cada parry le quita el 3 % de vida y lo aturde; el **coro** de 4 toques de campana (cada 10 s) lo frena 3 s, y el cuarto lo deja 5 s en el suelo; a ≤ 5 % de vida queda **de rodillas** con un destello dorado y el próximo golpe, cualquiera, lo termina en cámara lenta. No cae sin pasar por las rodillas.
- Calibrado con `tools/bot-pelea.js` (que ahora rompe la coraza con golpe fuerte según el perfil): vida 1 000 → **2 900**, presión 0.85 → 0.25 y `AGUANTE_FASE` (a pie le entra el 40 % / 30 % de cada golpe en F3 / F4). Hábil: 79 s y 8,0 de daño recibido; promedio: 86 s y 12,8; torpe pierde a veces (3 de 4, 240 s). Detalle y pendientes en `docs/BALANCE.md`.
- `combate.js`: el parry llama a `kind.alParry(m, g)` si el jefe lo define (solo lo usa el Rey). `reyfinal.js`: `soltarEscolta` / `quitarEscolta` (la escolta se limpia al vencer, morir, salir o cargar). La escolta son vampiros chicos de 6 de vida (procedural: no hay arte de zopilote chico; anotado para `PEDIDOS_ARTE.md`).
- Con invitados: el anfitrión simula, el Rey apunta a la persona más cercana y la vida escala al nacer (v12.14.1). No toca guardado ni ids (sin cambio de SAVE_FORMAT ni MIN_VERSION).
- Lo que viene: v12.16.3 música y cámara (la F4 aún no aclara el cielo ni cambia la música); v12.16.4 gente, trama, remate y epílogo (la campana de la F4 suena sin que Yendry la toque; dificultad «Tranquilo» sin combo, pendiente).

## 12.16.1 — 2026-11-14 · Arena del Rey (fase 3)

- Arena del Rey (`src/reyfinal.js`, nuevo): al usar la Corona se arma el «Redondel de la Cumbre» a la altura de quien la usa: piso de piedra de 26 de radio (franjas de piedra y basalto), altar al centro, 8 postes con farol, un sendero de 10 escalones por detrás y una cornisa de seguridad 6 bloques abajo (donde no hay ladera). Se despejan matas, ramas y laderas encima del piso.
- Restauración total: cada bloque que cambia la pelea se anota en un diario [x, y, z, idViejo] (tope 3 000; no toca cofres ni nada con datos) y se deshace al vencer al Rey (45 s después), al morir (al revivir en la cama, no antes, para no perder lo que cae al suelo), al salir al menú, al cambiar de dimensión, si el Rey desaparece y al cargar. Un mundo guardado en plena pelea (pestaña cerrada) se limpia solo al volver. Si la restauración deja a alguien dentro de un bloque, se le sube.
- La Corona no se pierde: si el Rey no fue vencido vuelve a la mochila al morir, salir o cargar (y se recoge la que haya quedado tirada, sin duplicarla). Vencido el Rey, no vuelve.
- El anillo se achica: al pasar a la fase 2 la franja de afuera se agrieta (ceniza, aviso rojo en el borde, «¡El borde se cae!») y cae en tres golpes de 2 s, de 26 a 18; en la fase 3 hasta 14. Los 8 faroles quedan dentro del último anillo. `g.rey` (estado de la pelea) no se guarda; lo único guardado es `meta.reyArena` (el diario).
- SAVE_FORMAT 8 (migración 7→8: `reyArena: null`) y MIN_VERSION 12.16.1: una versión vieja no abre un mundo guardado en plena pelea (no sabría deshacer el redondel).
- Con invitados: arma y restaura SOLO el anfitrión; los cambios viajan por la sincronía normal de bloques, así que los invitados ven el redondel y también cómo se deshace. Un invitado que use la Corona ve «se ofrece en el mundo de quien abrió la sala». Aviso `nb.aviso` al armarse.
- Arreglo (de la v12.11.0): `Game.stop()` lanzaba «remotos.limpiar is not a function» en una partida en solitario (el Map vacío de remotos no tiene `limpiar`), así que salir al menú no terminaba de guardar ni de limpiar. Ahora solo limpia si es la red.
- Pruebas: `tools/revisar-rey.mjs` (entra en `npm run revisar`; mundo falso con colinas, un cofre y un trozo sin cargar): armar y restaurar deja el mundo idéntico, anillo achicado, mundo guardado en plena pelea, morir (la restauración espera al revivir; Corona única), salir, cambio de dimensión, victoria (sin Corona) e invitado. Pestaña real en un mundo de prueba (borrado): en una cumbre el diario llega al tope de 3 000; salir al menú y recargar con la arena armada y guardada a medias deja el mundo idéntico (hash de 250 000 bloques) y la Corona vuelve; armar cuesta 8 ms y el cuadro no sube (mediana 3,6 → 3,9 ms, panel oculto: sin dibujar). Límites: no se probó con dos pestañas ni la Jefa de Ventanilla (necesita el Archivo); la Arpía furiosa sí avisó con el silbido y soltó la ráfaga; su posado tras picada fallida no se alcanzó a ver.
- Lo que viene: v12.16.2 cerebro del Rey (4 fases, coraza, escolta, combo, golpe final); los vecinos que suben y la música son de 12.16.3 y 12.16.4. Por ahora el Rey conserva las 3 fases de antes y la arena solo reacciona a ellas (achicar en fase 2 y 3).

## 12.16.0 — 2026-11-14 · Avisos y lecciones (tramo C)

- Murciélago Rey: la picada avisa con un carril rojo de 0.7 s hacia donde está uno; en la segunda fase se cansa y queda 3 s cerca del suelo, golpeable.
- Jefa de Ventanilla: el sellazo simple es dorado (se para con el escudo y la deja 3 s sin sellar); en la fase 2 se alterna con el «doble sello» rojo de dos círculos.
- Señor del Arenal: cada bomba de lava marca un círculo rojo donde cae; la onda de fuego marca un anillo de 1.2 s y se salta (antes pegaba sin aviso).
- Arpía: a menos de la mitad de vida la ráfaga se avisa con un silbido y un anillo azul 1 s antes; se posa 2 s tras una picada fallida.
- El Olvido: el anillo se ve mientras respira hondo. La Sombra Madre ya llamaba refuerzos con escudo a 66 % y 33 % (nada nuevo).
- Sin tocar la vida ni el golpe de ningún jefe: esos números los fija `jefes-balance.js` (medidos en la v12.4.9). Quedan sin hacer: lava del Señor que se enfría en plataformas y el golpe 8→7 del Olvido.
- tools/revisar-avisos.mjs: `ATAQUES_C` comprueba el aviso de cada ataque del tramo C (ya corre dentro de `npm run revisar`). Los avisos corren en el anfitrión como el resto de los jefes, así que valen con invitados.

## 12.15.6 — 2026-11-14 · Preparar la publicación

- Preparar la publicación (solo lo que no depende de decisiones): C-1 CSP probada con la compilación y el service worker (consola sin violaciones); C-2 `npm audit` con 0 vulnerabilidades; C-4 sin gitleaks/trufflehog instalados, se hizo un `git grep` de patrones de secretos (sin hallazgos).
- Limpieza: borrado `docs/PROMPT_SIGUIENTE_SESION.md`; rutas y correo personales fuera de los docs de auditoría; frases de cuenta y equipo personales neutralizadas; placeholder de semilla «ej. pura vida»; comentario de `texturas_arte.js`.
- E1: el juego carga desde una subruta (`/x/`): imágenes, fondo, fuentes y manifest con rutas relativas. Sin cambios de código (ya usaba `base: './'`). E4 ya estaba hecho (`meta.minVersion` + aviso de actualización).

## 12.15.5 — 2026-11-14 · Seguridad final

- Cofre (M1): al cerrar, el anfitrión ya no se cree las propiedades que dice el invitado: mejora ⭐ y filo se topan a lo que había en el cofre o en su mochila al abrir, la durabilidad a la del ítem, y «cruda»/«día» solo vienen de una pila igual del cofre. Nadie «lava» una espada ⭐1 en ⭐50.
- Cupo (M2): romper un bloque que un invitado puso hace menos de 10 minutos ya no da cupo (poner y romper en bucle no fabrica ítems comunes); romper lo que ya estaba en el mundo sigue dando +4.
- Cofre en creativo (M3): lo que el invitado dice al cerrar se valida contra el catálogo (ids que existen, cantidad ≤ pila, durabilidad); si no cuadra, el cofre queda como estaba.
- Nota funcional: la CSP deja conectar con openrelay.metered.ca para que el TURN opcional de Ajustes funcione en producción.
- tools/revisar-cofres.mjs: una prueba por hallazgo (el intento de trampa se rechaza) y una del invitado honesto.

## 12.15.4 — 2026-11-13 · La fiesta patronal (C8-B)
- **`src/patronal.js`**: cada pueblo tiene santo (`santoDe`) y fiesta de 3 días en ciclo de 24 (`santoDia = 1 + hash(id) % 24`). Aviso la víspera a < 600 bloques. Día 1 novena (noche: vecinos con farol dando vueltas a la plaza, vela gratis, `vela_novena` da +1 de reputación por fiesta; 9 velas = logro). Día 2: cimarrona (6 vecinos `cimarronero` con instrumento visual, ruta circular, `loop.comparsa` espacial) y tope (4 caballos `jinete`; el jugador montado va con el grupo (los dos jinetes más cercanos a ≤ 8 bloques, sin acercarse a menos de 2,5) 90 s; −10 s si pisa a un vecino; premio 10 u una vez por fiesta; con herradura 2–9 (los jinetes se amontonan al andar, por eso no se pide una separación exacta)). Día 3: cabezonas, comparsa que baila, castillo de pólvora (`Rocket`) de noche.
- Ítems 1180 tambor, 1181 trompeta (compás de 120/min), 1182–1184 máscaras (cascos `mat: mascarada`, cuentan como `g.disguised`), 1185 banda de mayordomo, 1186 vela; bloques 693 estandarte, 694 tarima, 695 arco. Recetas nuevas. Tarima y estandarte visuales en la plaza durante la fiesta.
- **Mayordomía** (Don Chepe, presidente de la junta, 2 días antes): 60 u → 20 tamales + 5 bombetas → banda, +5 de reputación, ×1.5 en `tickMostradores` (`factorMayordomo`) los 3 días de esa fiesta; el pueblo lo menciona 24 días. `fiestas2.js` exporta `ponerFarol/ponerCabezona/quitarCabezona` y respeta lo marcado `data.patronal`/`data.cabe`.
- **En red**: el anfitrión simula músicos, caballos, mayordomía, reputación y premio; las criaturas llegan a las personas invitadas como siempre; cada pantalla pone su música, tarima, pólvora, instrumentos y baile. Tope y mayordomía = anfitrión. **Sin hacer**: cinta del mejor jinete (solo logro), chinamos, placa y brújula con el santo, sonidos nuevos (se reutilizan comparsa/caja/pito), nombre del santo en la placa. Sin SAVE_FORMAT nuevo; MIN_VERSION 12.15.4.

## 12.15.3 — 2026-11-13 · El Comité de Caminos (C8-C)
- **Don Evelio** (`src/comite.js`, rol `presidente_comite`) aparece en la plaza del pueblo que toca (el de la casa desde el día 2; en cada etapa, el pueblo de esa etapa). Une 2 a 5 pueblos (los más cercanos a la casa, a ≤ 1 200 bloques). Etapas: 6 mojones en el camino al pueblo B (bloque 696, ≤ 12 bloques de la recta y separados 20), 12 tablas finas (o 24 tablas), 4 faroles forjados, 20 tejas, 10 sopas de mariscos (o 20 tamales) y la Gran Minga en el pueblo de la casa.
- Premio único: 200 u (₡100 000), **Pase de los Caminos** (ítem 1189: bus gratis entre esos pueblos vía `viajaGratis` en `bus.js`), +5 de reputación en cada pueblo del Comité, logros «El mojón cero» y «El Comité de Caminos». Ítems 1188 (sello), 1189; bloque 696. Recetas: 4 piedra + 1 pómez o 1 arcilla → mojón. SIN SAVE_FORMAT nuevo (`meta.comite`); MIN_VERSION 12.15.3.
- **Simplificado / sin hacer**: la obra del puente se paga entregando tablas (no cuenta bloques puestos); la ceremonia es una charla (sin cimarrona, viene con C8-B); placas en las plazas y mercado regional pendientes. En red lo ve y lo juega solo el anfitrión (los invitados no ven a Don Evelio). Arte del mojón: provisional (textura de la pómez), anotado en `PEDIDOS_ARTE.md`.

- **Arreglo de C7 (multijugador)**: el Guardián de la Colada ahora lo despierta y simula el anfitrión también cuando la persona que entra a la cámara es una invitada (antes solo contaba la posición del anfitrión); en el mundo de una invitada no corre.

## 12.15.2 — 2026-11-13 · Fuego de la tierra (C7): tubos de lava y termales
- **Tubos de lava** en los volcanes (solo mundos nuevos, generador 21; `src/fuego.js`): uno por volcán, corto (60–90) o largo (120–180 con cámara del magma). Sección 5×4 que rodea el cono, boca en zanja con placa, canal de lava, estalactitas de obsidiana, vetas (lascas), cristales de azufre, pómez y fumarolas. No nacen a menos de 200 bloques de pueblos ni del inicio.
- **Cámara del magma** (tubos largos): lago de lava, cofre de colada y **El Guardián de la Colada** (minijefe 150 de vida, golpe 8, pisotón de lava con aviso 0,8 s; paga 8–10 u).
- **Fumarolas** (queman sin mascarilla; con ella se pican y dan cristales de azufre), **Termales** (estructura al pie de un volcán, taquillera, pase de 6 u por 10 min, huevo de aguas termales) y equipo: cuchillo de obsidiana, casco de espeleólogo, botas de ceniza.
- Bloques 685, 688–691; ítems 1160–1163, 1165, 1167–1169. SIN SAVE_FORMAT nuevo (`meta.coladaVencida`); MIN_VERSION 12.15.2; los mundos viejos no tienen tubos ni termales.
- **Pendiente a propósito** (presupuesto): observatorio y sismógrafos, erupción como evento, ceniza fértil y tierra volcánica, muestras volcánicas, hotel termal, pómez que flota; el casco se arma directo. Ids reservados: 686, 687, 1164, 1166, 1170.

## 12.15.1 — 2026-11-13 · Manos de maestro (C6): oficios
- Los **tres oficios** del diseño C6: carpintería (banco de carpintero), herrería (fragua) y alfarería (torno y horno de barro). Los cuatro talleres se hacen en la mesa y son bloques con `station: 'taller'`: la cuadrícula del taller solo da las recetas de SU oficio (`taller:<cual>` en `modoDe` de `recipes.js`), la mesa y el fogón no las ven. 13 bloques (672–684) y 24 ítems (1130–1153); el arte ya generado (`public/sprites/arte/`) está conectado en `ARTE`, y el mango y el farol forjado quedan procedurales (pedido en `PEDIDOS_ARTE.md`).
- Nivel de oficio 0–10 con uso (`src/oficios2.js`): cada pieza da 2 + valor/2 de experiencia; umbrales 10, 25, 45, 70, 100, 140, 190, 250, 320, 400. Los libros (carpintería, herrería, alfarería; 40 u en el tramo de Don Chalo, Mercado Central) abren los niveles 1 a 3 con clic derecho; del 4 al 10 se gana con el uso. Sin el libro solo valen las recetas de nivel 0. Las recetas se piden con `req: 'of:oficio:n'`, que `conocidas()` (saberes.js) arma desde el nivel.
- Herramientas que se llevan en la mochila y no se gastan (`herr`: cepillo para la tabla fina, formón, martillo de forja) y leña en la fragua y el horno de barro (1 por tanda; en Tranquilo, media; clic derecho al taller con leña en la mano, hasta 16).
- El **mostrador** (9 casillas) vende solo de 8 a 17 h: 1 pieza cada 90 s, con tope de 10 + 4 × el nivel más alto del día (comparte con el tablón y el arrecife el tope de ganancia diario de `cobrarDelTope`, que ya pagaba al 40 % lo que pase). La caja pasa a la billetera al abrirlo. Solo se venden piezas de oficio (tabla `PRECIO`).
- Lo que sirve de verdad: la alacena (la comida guardada se echa a perder a la mitad de prisa), el armario (18 casillas), la tinaja (9), la mesa grande (comer sentado a ella da el mismo bono que la de comedor), la olla de barro (+10 % de comida, en la mochila), el comal (+1 a tortillas y arepas), la herradura (caballo +10 %), el cayuco (canoa al 70 % del bote) y tres clases nuevas de comodidad (mueble fino, cerámica, talla).
- Lo que quedó SIMPLIFICADO o sin enganche, a propósito: no hay maestro vecino ni encargo de aprendiz (los libros se compran); no hay calidad «fina» por pieza (el mostrador paga +1,25 % por nivel, que es el valor esperado), y la obra maestra (nivel 8, sello en la mochila, 10 %) se paga aparte en el momento; el mostrador no pide reputación ni pone precio con cartelito; la puerta tallada es un adorno de pared (no se abre); el candado y el yugo solo se venden (la ladrona roba de la mochila, no de cofres, y la carreta con bueyes ya se hace sola). La vajilla no suma comodidad.
- Multijugador: los talleres y el mostrador del anfitrión no se abren desde una ficha de invitado (igual que hornos y fogones); el invitado sí ve los bloques nuevos llegar. El mostrador y la leña solo cambian donde corre el mundo. Sin SAVE_FORMAT nuevo (`meta.maestro`, opcional); MIN_VERSION 12.15.1 y la firma de ids nueva.
- Pruebas: lint 0, build sin «(!)» ni «Circular», `npm run revisar` verde (0 recetas tapadas o muertas; ícono, agarre y luces al día). En un mundo de prueba (borrado al terminar): carpintería de punta a punta (cepillo, tabla fina, libro, mesa grande y mostrador, que vendió 3 piezas en 300 s y pagó ₡1.500 a la billetera al abrirlo), herrería con y sin leña (bloquea sin leña, gasta 1 por tanda) y el martillo exigido para las herraduras, alfarería (amasado devuelve el balde, engobes, olla, comal y tinaja en el horno), guardar y recargar (nivel, libros y mostrador siguen) y 2 pestañas con relés Nostr reales (el invitado recibe el banco y la mesa, y no puede abrir el taller). No probado: la herradura montado, el cayuco en el agua, la alacena con comida de varios días y la obra maestra.

## 12.15.0 — 2026-11-13 · Cierre del multijugador: cofres con candado y dormir en grupo
- Cofres con candado: una persona invitada ya puede abrir cofres (y baúles) del mundo del anfitrión. Pide `nb.cofre_abre`; el anfitrión pone un candado por cofre (`Anfitrion.candados`), le manda una copia (`nb.cofre`) y a quien lo intente le contesta `nb.cofre_no` («ocupado», con el nombre de quien lo tiene; «lejos»; «no»). El anfitrión tampoco puede abrirlo mientras lo tiene otra persona. El candado se suelta al cerrar, al salir, al caerse la conexión, al expulsarla, al cerrar la sala y a los 10 minutos (`nb.cofre_suelta`). Hornos y fogones siguen cerrados a invitados
- Sin duplicar ítems (`src/red/cofres.js`, puro y probado): el cofre vive solo en el anfitrión y la copia del invitado se tira al cerrar. Mientras está abierto, la foto de la mochila puede subir solo lo que había en el cofre (`cambioOk(…, permiso)`, que se gasta). Al cerrar, el anfitrión NO se fía de lo que el invitado dice que quedó: lo calcula con lo que ganó o perdió su mochila (`cierre`). Si se cae a mitad, se descuenta lo que ya llevaba. Límite: lo que había depositado y no llegó a confirmarse se pierde (nunca se duplica)
- Dormir por votación: la persona invitada que se acuesta de noche manda `nb.cama`; el anfitrión (también acostado) espera a que todas las personas presentes estén en cama, avisa a todas «Duermen X de Y: faltan N en cama para que amanezca» (`nb.aviso`) y entonces pasa la noche y manda `nb.amanece`. Quien se levanta o se desconecta deja de contar. La siesta de día sigue siendo individual
- Guía corta «Cómo jugar con amistades» dentro de la pantalla de la sala (se ve al unirse, al abrir la sala y ya dentro): crear la sala, compartir el código, aprobar, unirse, cofres y camas, qué hacer si no conecta y la clave TURN opcional (Ajustes → Jugar en línea)
- Nuevos mensajes en la lista blanca (`transporte.js`, `validar.js`, `limites.js`): `cofre_abre`, `cofre_cierra`, `cama` (invitado → anfitrión) y `cofre`, `cofre_no`, `cofre_suelta`, `amanece` (anfitrión → invitado). `tools/revisar-cofres.mjs` (entra en `npm run revisar`): un anfitrión real con canal falso, cofre ocupado, mentira al cerrar, caída a mitad, votación de cama, sala llena (la persona 7) y versión distinta
- Pruebas: `tools/revisar-cofres.mjs` (39 comprobaciones) y 3 pestañas reales con relés Nostr en un mundo de prueba (borrado al terminar): una persona abre el cofre y la otra recibe «Ana tiene abierto ese cofre» (y el anfitrión también); sacar 10 de piedra y cerrar deja el cofre y la ficha cuadrados; a Beto se le corta la conexión (recarga de la pestaña) con 5 de tierra ya en la mochila: el cofre baja 20→15, el candado se libera, Beto vuelve con sus 5 y reabre; los tres se acuestan de noche y amanece en todas (día 2, hora 0,02); sala llena (la persona 7 recibe «llena») y versión distinta («version») probadas con el anfitrión real y un canal falso. NO probado: TURN (no hay credencial real), hornos/fogones para invitados (siguen cerrados), un anfitrión que rompe un cofre mientras otra persona lo tiene abierto

## 12.14.1 — 2026-11-13 · Jefes y leyendas en red
- Con una sala abierta, TODOS los jefes, leyendas, minijefes, el Mono congo gigante y la Bruja de Zárate funcionan con invitados: los simula el anfitrión y entran en `nb.mobs` (ahora 9 campos: se suma la vida máxima; flags 1 muriendo, 2 barra de jefe, 4 segunda fase) con prioridad sobre las criaturas comunes. Se quita «sin jefes con invitados» de v12.14.0
- La persona invitada ve el jefe como títere con su barra y su retrato (`updateBossBar` mira `provoked` y la vida máxima que manda el anfitrión), el aviso «anda cerca» al aparecer y «se enfurece» al pasar a segunda fase. El anfitrión también difunde `nb.aviso` (nuevo, ≤120 caracteres) con los logros `vencer_*` del mundo y la caída del jefe
- Cualquier persona puede pegarle (mismo `nb.golpe`, validado por `validar.js`/`limites.js`: alcance, 0,22 s entre golpes, daño con el arma de SU ficha). Los jefes que piensan con `g.player` (los de `kind.update`) ahora ven a la persona más cercana (`Mob.conObjetivoCercano`) y su daño sin destinatario se reenvía por `nb.dano` a esa persona (`g.jugadorReal` en `damagePlayer`)
- La vida de jefes y leyendas escala al nacer con las personas presentes: +50 % por persona extra, tope ×2,5 (`spawnMob`; fija `data.vmax`). Quienes le pegaron (`m.partRed`) cobran cada uno su propio sorteo del botín y las mismas monedas (`Game.repartirJefe`); si el jefe cae por un golpe de invitado, el anfitrión corre `killedMob` completo (logros, monedas, XP: el jefe vencido cuenta para el mundo)
- Límites conocidos: los títeres de jefe no tienen animaciones propias (alas, tenazas, ataques especiales: solo posición y rumbo); si alguien entra con el jefe ya vivo, no se reescala su vida; las leyendas que se «apaciguan» sin morir (Viejo del Monte) no pagan por la red; los efectos propios de cada jefe (rocas, olas, proyectiles) solo se ven en la pantalla del anfitrión
- Pruebas: `tools/revisar-red.mjs` (mobs de 9 campos, `aviso`) y 2 pestañas reales con relés Nostr y mundos de prueba (borrados al terminar): Reina Bananera, Cangrejo Rey, Mono congo gigante, Tata Sapo y Viejo del Monte con invitado (barra y retrato en el invitado, vida ×1,5, golpe del invitado baja la vida del jefe, el jefe mata al invitado), Tata Sapo vencido por el invitado (botín, ₡ y aviso «cayó» al invitado) y una danta común sigue dando botín (v12.14.0)

## 12.14.0 — 2026-11-13 · Criaturas con invitados (F4 mínima)
- Con una sala abierta, las criaturas las simula el anfitrión y atacan a la persona viva más cercana (la local o una invitada): `damagePlayer(…, objetivo)` y `g.remotos` ya se usan. Valen las criaturas con cerebro genérico o que pasan por `atacar()` con la persona de `ctx` (`pl`, `dxp`, `dzp`, `distP`)
- Las personas invitadas ven las criaturas como títeres (`nb.mobs`, 5 Hz, las 40 más cercanas a ≤ 64 bloques): solo interpolan posición, rumbo y vida; no piensan, no nacen y no sueltan nada. El mundo de un invitado ya no hace nacer criaturas propias
- El golpe de un invitado a un títere viaja como `nb.golpe`; el anfitrión mira que exista, alcance (≤ 6 + ancho/2) y un mínimo de 0,22 s entre golpes, y calcula el daño con el arma de SU ficha (no hay fuego amigo: las personas no son blanco). El botín es de quien da el último golpe: `nb.botin` y se le acredita en el cupo de su ficha para que su foto de mochila cuadre
- El daño a una persona invitada viaja como `nb.dano` y lo aplica su propio juego (con su armadura y su dificultad); el anfitrión solo ataca a quien su última foto dice que está en pie
- Las criaturas nacen alrededor de cualquiera de las personas y no se tira lo que está cerca de alguna. Los jefes y leyendas siguen naciendo con invitados (simulados por el anfitrión, atacan al anfitrión; no se muestran a los invitados todavía): verlos, pelearlos en grupo y su barra van en la v12.14.1
- Arreglo: la campaña de la abuela (`tickHistoria`) ya no corre en el mundo de un invitado (se construía una casa propia y el anfitrión la rechazaba bloque a bloque hasta expulsarlo por ritmo)
- Límites conocidos (PENDIENTES_RED): las criaturas con `kind.update` propio o que vuelan siguen atacando solo al anfitrión; los títeres no tienen animaciones especiales; no se les puede hablar ni montar; el botín de un invitado y el cupo son del tamaño de la ficha (≤ 300 unidades)
- Pruebas: `tools/revisar-red.mjs` con los nuevos mensajes `mobs`, `dano` y `botin` y 2 pestañas reales con relés Nostr: una Sombra del anfitrión persigue y daña al invitado (20 → 9), el invitado la mata y el botín llega a su mochila y a su ficha

## 12.13.0 — 2026-11-13 · Fichas: lo suyo se guarda (F3)
- Cada persona que visita una sala tiene su ficha (mochila, vida, hambre, agua, aire, plata y lugar), guardada por su llave en `meta.jugadores` del mundo del anfitrión. Al salir y volver con la misma llave recupera lo suyo; con otra llave empieza de cero con el equipo inicial (4 tortillas y 6 antorchas)
- El anfitrión manda: la mochila viaja como foto (`inv`, cada ≥0,5 s si cambió y como mínimo cada 5 s) y solo se acepta si cuadra: la plata no sube, no aparecen ítems únicos ni mejoras o filo, y lo que sube lo explica una receta o un cupo (60 al entrar, tope 300, +6/s, +4 por bloque roto aceptado). Si no cuadra se le manda su ficha verdadera (`ficha`, con versión nueva); 8 fotos malas seguidas lo sacan (`ritmo`)
- Una segunda pestaña con la misma llave se rechaza; máximo 12 fichas por mundo (`fichas`); bloquear queda anotado en la ficha. Mundo creativo: la ficha no lleva mochila
- Guardado en la misma transacción de `saveWorld`: cada 5 s si algo cambió, de inmediato cuando alguien sale, al cerrar la sala y en cada `game.save()`. Importar un mundo sanea vida, lugar y mochila de cada ficha
- Cofres, hornos y cocina están cerrados para invitados (anti-duplicación); los hostiles locales del invitado se apagan hasta las criaturas en red (v12.14.0)
- Límites conocidos: un invitado podría ganar de más ítems comunes, muy despacio, al ritmo del cupo; vender sube la plata, así que su foto se revierte; puertas y camas por la red quedan para otra versión
- Pruebas: `tools/revisar-inventario-red.mjs` (en `npm run revisar`) y 3 pestañas reales con relés Nostr: la misma llave recupera mochila, vida, hambre y lugar; otra llave empieza de cero; plata e ítems inventados se rechazan; la segunda pestaña se rechaza

## 12.12.0 — 2026-11-13 · Construir juntos (F2)
- Construir juntos: quien entra a una sala pone y rompe bloques, y los cambios llegan a todas las personas. El anfitrión decide: revisa alcance, ritmo, tipo de bloque y soporte contra su mundo real, y a quien se equivoca le devuelve el bloque verdadero
- Quien llega tarde recibe el mundo por trozos; al volver a la pestaña (y cada 30 s) se pide de nuevo el estado de lo de alrededor, así se repara cualquier corte
- Por ahora solo viajan bloques simples: cofres, hornos, puertas, camas, barriles y portales llegan con la v12.13.0. Portales apagados mientras hay sala; quien visita juega en creativo hasta las fichas (F3)
- Nuevos mensajes `bloque`, `bloques`, `chunks_pide` y `chunks_dato` (validar.js y limites.js); reglas en `src/red/reglas.js`; el mundo avisa cada cambio con `redCambio` (sin duplicar el motor de poner y romper)
- Limitaciones conocidas: los mobs del invitado no se sincronizan; sus explosiones locales las corrige el anfitrión; el TURN opcional y la sala con 6 personas reales no se probaron (solo la regla de «sala llena»)

## 12.11.0 — 2026-11-13 · Jugar con amistades (sala)
- Jugar con amistades: menú «Jugar con amistades» y, en pausa, «Sala». Quien abre la sala recibe un código (también un enlace con #sala=); las demás personas lo pegan y piden entrar. Quien anfitrioneó aprueba, rechaza, expulsa o expulsa y bloquea
- Cada persona ve a las demás con su avatar (camisa, piel y pelo), con el nombre encima; el chat va por la sala; la hora, el día y el clima son los del anfitrión. El anfitrión manda: corrige posiciones imposibles (teleport) y expulsa a quien manda basura
- Todo mensaje que llega pasa por `validar.js` y `limites.js`; también lo que manda el anfitrión (nuevos validadores acepta, rechazo, jugadores, corrige, tiempo, chatr, expulsa)
- Trystero 0.27.0 (Nostr, WebRTC con STUN público) en su propio trozo `red`: el juego sin red no lo descarga. TURN opcional: cada anfitrión pega su clave en Ajustes → Jugar en línea
- Una segunda pestaña con la misma llave se rechaza; construir en conjunto llegó en la v12.12.0

## 12.10.0 — 2026-11-13 · Costuras del multijugador
- Costuras del multijugador (todavía sin red): el guardado de un mundo ahora es una sola transacción (o se guarda todo o nada), y los mundos guardan `jugadores` y `epoca` (SAVE_FORMAT 7; los mundos viejos migran solos)
- Nuevo `src/red/validar.js` y `src/red/limites.js`: validación de mensajes de red y límites por segundo, puros y probados en Node (`tools/revisar-red.mjs`, parte de `npm run revisar`)
- `damagePlayer(…, objetivo)` y `g.remotos` listos para cuando haya otros jugadores; el daño a un remoto se delega a `alDanarRemoto`
- El respaldo tiene tope de tamaño: se parte en varios archivos y salta (avisando) los mundos que fallan o son enormes
- Importar un mundo es atómico: si falla a medias se borra lo que entró, y los errores se muestran en vez de ocultarse; al importar la época sube en 1; se sanean `jugadores` y `epoca`

## 12.9.0 — 2026-11-13 · NanoBlocks, instalable
- Se puede instalar como aplicación (Chrome, Edge, celular): Ajustes → Aplicación → «Instalar NanoBlocks»; íconos provisionales con la N de pasto
- Después de la primera visita el juego abre sin conexión (service worker generado, sin librerías); los sonidos se bajan aparte, en segundo plano
- Si hay una versión nueva, un aviso en Ajustes y un consejo en partida: nunca recarga sola, guarda el mundo y actualiza cuando uno acepta
- Si el navegador no tiene service worker (o en desarrollo), el juego va exactamente igual

## 12.8.9 — 2026-11-13 · El arte ya hecho, conectado
- `tools/conectar-arte.py` reduce a 128 px lo de `assets-src/chatgpt/` que faltaba en `public/sprites/arte/` (87 PNG, sin pisar lo que ya estaba). Sin leer los PNG uno a uno.
- `ARTE` (`blocks.js`) suma los que tienen ítem o bloque; las monedas (`moneda_5` … `colon`) y los billetes (`billete_1000` … `billete_20000`) quedan con ícono de GPT. Si no carga, `loadSprites` deja el dibujo de respaldo.
- 47 PNG (oficios, mueblería, pesca de altura) quedan copiados sin uso: todavía no existe su ítem (anotado en `docs/PEDIDOS_ARTE.md`).

## 12.8.8 — 2026-11-13 · Balance de la Cascabel, Cornudo y el Tata
Fase 2B-bis de `docs/revisiones/PLAN_CIERRE_FINAL.md`.
- **`g.diag` completo:** los avisos de `armas2`, `arpia`, `bravos`, `final`, `jefes2`, `jefes3`, `leyendas`, `monocongo` y `sombras2` ahora pasan `m` como `quien`; los mangos del Mono congo cuentan con `g.diagDe` (`game.js damagePlayer`).
- **Cascabel:** `avisoCaida` r 1.5 de 0.8 s donde sale de la tierra (sin aviso 25 % → 0 %); el veneno de la mordida 10 → 2 s (era más de la mitad del daño). `jefes-balance.js`: 285 · 0.55 → **165 · 0.25**.
- **Don Cornudo:** 125 · 1.4 → **300 · 0.8**. **Tata:** 585 · 1 → **750 · 1.1**.
- **Bot (10 por celda, torpe / hábil), p y TTK del hábil:** Cascabel 1 / 1 (16.5 s, recibido 6.7) · Cornudo **0** / 1 (20.7 s, recibido 6.8) · Tata **0** / 1 (24.6 s, recibido 4.3). Sin aviso 0 % en los tres.
  - **Queda:** el torpe todavía gana a la Cascabel (p 1) y el Tata le pega al hábil menos de los 8–10 de la tabla (4–5); se dejan «aceptables».
- **Sin cambio de guardado** (`SAVE_FORMAT` igual).


## 12.8.7 — 2026-11-13 · Los jefes del monte avisan
Fase 2B de `docs/revisiones/PLAN_CIERRE_FINAL.md` (avisos del tramo B).
- **`golpes.js`:** `COLOR_AVISO` (rojo, verde, azul) y `AZUL_AVISO`; `anilloAviso(…, quien, color)` y `avisoEmbestida(…, ancho, color)` aceptan color.
- **Reina Bananera:** anillo verde de r 4.5 mientras dura la nube (con `m`, cuenta como aviso); crías `Math.min(2, 3 - vivas)`, tope 3.
- **Cascabel:** el escupitajo pasa `fromX/fromZ` a `damagePlayer` (el parry de `combate.js` lo ataja y la aturde 1.6 s) y el veneno 6 solo sin parry (`g.parryT`).
- **Don Cornudo** (`escarabajo_hercules.onHurt`, no el perfil global `caparazon`): por el costado, con corte, ×1.25 (0.75 / 0.6), y ×2 si `D.trabado` (se trabó contra una pared; se borra cuando termina el `stunT`).
- **Tata:** la masticada ya no pone veneno 8 (queda el mareo 5); los charcos duran 6 s con un anillo verde de partículas r 1.4.
- **Cangrejo Rey:** romper la concha → `stunT = 5`; el chorro en dos tiempos: `D.chorroPre = 0.6` con carril azul (`avisoEmbestida`, ancho 1.2) y después el tiro.
- **Ciempiés Rey:** el anillo rojo r 1.8 donde va a caer, en los últimos 0.8 s; el tiro no pega con `g.slide` o en el aire.
- **Ofrenda:** enfriamiento de 3 días **por jefe** (`g.meta.ofrendaDia[tipo]`); si no pasaron, avisa y no gasta la ofrenda. *(Decisión abierta: por jefe y no global.)*
- **`tools/revisar-avisos.mjs`:** `PENDIENTES` queda solo con el tramo C; `ATAQUES_B` exige el aviso de cada ataque del tramo B (6 regex).
- **Probado en tab-1:** Reina (crías 2→3→3), Cascabel (con parry: daño 0, aturdida 1.6; sin parry: veneno), Cornudo (1.25 / 2.5 / 2), Tata (un golpe de 7, sin veneno), Cangrejo (carril azul y chorro a los 0.6 s; concha rota → stunT 5), Ciempiés (aviso solo en t ≤ 0.8; barriéndose o brincando no pega; en el suelo, sí).
- **Bot (10 por celda, torpe / hábil), p y TTK del hábil:** Reina 0 / 0.9 (14.2 s) · Cascabel **1** / 1 (19.5) · Cornudo 0.2 / 1 (**7**) · Tata 0 / 1 (16.3) · Cangrejo 0 / 1 (22.5) · Ciempiés 0.1 / 1 (23.8). Daño sin aviso: 0 salvo la Cascabel (≈ 25 %).
  - **No cumple todavía:** la Cascabel la gana el torpe (p < 0.5 pedido) y tiene golpes sin aviso; Don Cornudo cae en 7 s (tabla ~34) y el Tata en 16 (25). **No se retocó `jefes-balance.js`**: queda en la cola (fase 2B-bis).

## 12.8.6 — 2026-11-12 · Decimoctava revisión
De `docs/revisiones/REVISION_v12.8.3-v12.8.4.md`, sus puntos 1 a 5.
- **1. El aviso del Cocodrilo gigante.** La mordida que de verdad pega es la de `armas2.js` (alcance 2.8), y la de `FAUNA.cocodrilo` casi nunca arrancaba: la vuelta de la muerte llegaba sin aviso.
  - Ahora la vuelta ya no arrastra al instante: en el agua, con 50 %, arranca `preGiro` de 1 s (el anillo y «Salga del anillo»); si al terminar sigue a menos de 1.8, gira.
  - El brillo dorado (`brilloAmago`) lleva candado (`m.data.brilloT`, una vez cada 1.2 s y solo sin un ataque en curso), en `armas2.js` y en `fauna.js`: antes salía en cada cuadro del amago.
  - **Probado en la pestaña 1** (40 s simulados, el jugador en el agua): 30 mordidas, 40 destellos (antes, decenas por mordida) y 5 vueltas, **las 5 con anillo y aviso**. El bot de jefes sigue sin pelear en agua (anotado).
- **2. Las luces.** El mallador hacía `anim || 8`: el farol, el farol de Zenaida y la fogata ya tenían anim 1 (el vaivén de la llama) y se quedaban sin el 8 del emisor.
  - `blocks.js animDe(b)` **suma** el 8 a la animación y `world.js` lo separa (`aE = step(7.5, aB)`).
  - `LUCES` suma el hongo de fuego, el corazón de Tiquicia, los dos portales y la jarra de morfos, con su color en los halos de Medio. Los que alumbran pero no resplandecen van en `SIN_RESPLANDOR` (hongo, cuarzo, coral, cristales, meteorito, oro volcánico, tele).
  - Corrección de lo dicho en la v12.8.4: esos bloques **sí alumbran** el mapa (`glow` es la bandera del motor de luz); lo que no hacen es resplandecer.
  - **Prueba nueva:** `tools/revisar-luces.mjs` falla si un bloque con `glow` no está en `LUCES` ni en `SIN_RESPLANDOR`, o si una luz llega al mallador sin el +8.
  - **Medido en el RT, de noche en Alto:** farol 2.26, fogata 2.27, farol de Zenaida 2.06, hongo de fuego 1.87 (antes ≤ 1); el cuarzo, 0.5.
- **3. El pase final y el realce:**
  - **El hombro** era `c / c = 1`, un recorte. Ahora es una curva sobre el canal más alto (igual hasta 0.9, después se acerca a 1) que escala los tres canales: la lava sale naranja y no amarilla.
  - **De día**, el umbral del bloom sube de 0.95 a 1.3 y la fuerza baja a la mitad (`postfx.terminar(fuerza, dia)`): el cielo, las nubes y la nieve no dejan orla sobre los árboles.
  - **De lejos**, el realce de los emisores se apaga entre 60 y 100 bloques: allá ya van mezclados con la niebla, y realzados daban un halo azul en el horizonte.
  - **Sin HalfFloat**, `POST_HDR` también se apaga (antes los emisores se subían y se recortaban en 8 bits): `game.js` cambia `fx` a `bloom: false, halos: true` antes de `aplicarDefines`.
  - Capturas en `docs/capturas/v12.8.6/`: `noche-alto-luces.jpg` y `mediodia-alto-bloom.jpg`.
- **4. El pescador y el restaurante de lujo:**
  - el lujo paga el pargo a 1.25 (antes 2), el dorado a 4.5 (8), el atún a 3.5 (6), el pez gallo a 2 (3) y la langosta a 7 (8);
  - `bot-economia` tiene la variante «con lujo» (`compradores`, `venderConCupo`, `perfilPescador` y `tier` con `conLujo`; el lujo es otro pueblo, con su propio cupo);
  - **pescador 47.4 u/día sin lujo y 51.7 con lujo** (antes, 57–71 con lujo según la revisión);
  - el comerciante baja de 48.3 a 43.8, porque sus 6 pargos diarios se contaban al precio del lujo. Los criterios siguen en verde (razón 1.33).
- **5. `revisar-pide`:** quita también los `/* … */`, corta el bloque en **su** llave de cierre (contando llaves) y revisa cada lista: que no esté vacía y que cada id exista (`getDef`; las listas con nombre, como `COSECHAS`, salen de `economia.js`). Probado rompiéndola a propósito: una lista vacía y un id inventado la hacen fallar.
- **`npm run revisar`** corre todas las revisiones de `tools` que van en Node.

## 12.8.5 — 2026-11-12 · Que los mundos no se pierdan (urgente)
El 12-nov el navegador del panel se cerró y se llevó IndexedDB y localStorage de `localhost:5199`: todos los mundos. La orquestadora lo puso en la sección 0 de la COLA. Tres cosas, en `src/respaldo.js` (nuevo) y `save.js`:
- **Almacenamiento persistente:** al arrancar se pide `navigator.storage.persist()` (si no lo era ya). En Ajustes, el grupo nuevo «Mundos guardados» dice si quedó persistente, cuándo fue el último respaldo y cuántos mundos tenía. En el navegador del panel **no lo concede**, y Ajustes lo dice.
- **El respaldo:**
  - «💾 Descargar respaldo (todos los mundos)», en la pantalla de mundos y en Ajustes (`save.js descargarRespaldo`): un archivo `nanoblocks-respaldo-AAAA-MM-DD.json` con `{ app, respaldo: true, mundos: [...] }`, armado con el mismo `payloadMundo` que exportar un mundo;
  - **«Importar mundo o respaldo»** reconoce el respaldo y pasa **cada mundo por `validarMundo`**, como un archivo aparte (uno roto no frena a los demás, máximo 200, tope del archivo 256 MB). Los mundos vuelven con su nombre, sin «(importado)».
  - **Recordatorio:** cada ~2 horas de juego sin bajar un respaldo (`tickRespaldo`, el contador va en `localStorage`) sale un aviso suave. Se apaga en Ajustes (`avisoRespaldo`).
- **La marca de que había mundos:** una **cookie** (`nanoblocks_mundos`, va aparte de IndexedDB y localStorage) guarda cuántos mundos hay. Si al arrancar no hay ninguno y la marca dice que había, el menú lo dice y explica cómo importar el respaldo (captura `docs/capturas/v12.8.5/aviso-mundos-perdidos.jpg`). Borrar un mundo con el botón baja la marca, así que no da un falso aviso. Si el navegador borró también las cookies, no hay cómo saberlo.
- **Probado en la pestaña 1** (nunca en la de nanoyackson):
  - con 2 mundos, el respaldo trae 2; los borré y el respaldo los devolvió con sus chunks;
  - la marca da 2 y, al desaparecer los mundos sin el botón, sale el aviso;
  - el recordatorio sale a las 2 h (y el contador vuelve a 0) y no sale si está apagado;
  - al final la marca quedó en el número real de mundos (0).

## 12.8.4 — 2026-11-12 · Decimoséptima revisión
De `docs/revisiones/REVISION_v12.8.0-v12.8.2.md`, sus puntos 1 a 5.
- **1. El bloom ve a los emisores.** `atmosGrado` termina con un hombro que nunca pasa de 1, y el emisor se subía **antes**: la lámpara salía amarilla y del mismo brillo que la arena.
  - Ahora se sube **después** (`world.js`, antes de `premultiplied_alpha_fragment`), y más de noche que de día: `× (1 + vEmis · (0.5 + 1.6 · (1 − uDaylight)))`.
  - Medido en el RT: el máximo es **2.72 de noche y 1.44 de día** (antes ≤ 1).
  - Capturas en `docs/capturas/v12.8.4/`: `noche-alto-bloom-antes.jpg` (la de la 12.8.0) y `noche-alto-bloom-despues.jpg`.
- **2. Tramo A:**
  - **La vuelta del Cocodrilo:** el aviso dura **1 s** (antes 0.6), el anillo va a la altura del jugador (antes quedaba bajo el agua) y el radio es **1.8** (antes 2.5): nadando se alcanza a salir.
  - **Presión del Cocodrilo: 0.5 → 0.6.** Con 0.5 ganaban los tres perfiles; con 0.6, p 0 / 0.8 / 1 (objetivo del promedio, 0.88–0.95). Con 0.7 y 0.8 el promedio no mejoró (0.7–0.8): hay mucho ruido con 10 duelos.
  - **`revisar-avisos`:** el tramo B pasa a `PENDIENTES`. Sus archivos ya tenían avisos viejos y la prueba los daba por hechos sin haberlos tocado.
- **3. El pescador a 42–48 u/día:**
  - el muelle paga 0.75 por el pargo y la corvina y 3 por el dorado;
  - las sodas pagan 1 por el pargo, la corvina, el róbalo, el sábalo y el pargo mancha, y 3.5 por el dorado;
  - el pez gallo baja a 1.5 y el atún a 2.5;
  - la perla de la caña baja del 1 % al 0.5 %.
  - **Resultado:** pescador **47.4 u/día** (cazador 58.3) y los criterios de siempre en verde. La tabla está en `BALANCE.md`.
  - **Los encargos** ya no toman en cuenta lo que paga el restaurante de lujo (`encargos2.js: precios`): con el pargo, el tablón pagaba 2 u por pieza.
- **4. Solo las luces de verdad:** `LUCES` en `blocks.js` (antorchas, lámparas, faroles, fogatas, lava, magma, y el horno y la cocina encendidos; `b.luz`). Las usan los halos de Medio (`anotarLuces`) y los emisores del bloom (`mesher.js`, aAnim 8). Quedan fuera el coral morado, el cuarzo, los hongos, los cristales y los portales.
- **5. Sin HalfFloat no hay bloom:** con 8 bits nada pasa de 1, así que `post = fx.bloom && postfx.hdr`. En ese caso el RT se libera y se dibujan los halos.
- **Probado en la pestaña 1:**
  - el RT de noche y de día;
  - las luces de un chunk (lámpara, antorcha y lava; el cuarzo no);
  - los halos en Medio;
  - con `hdr = false`: sin RT y con halos;
  - 3 tandas de 30 duelos del Cocodrilo;
  - `bot-economia`.
  - El servidor de desarrollo se había caído y se volvió a levantar; las pruebas van en una pestaña aparte, no en la de nanoyackson.

## 12.8.3 — 2026-11-12 · Decimosexta revisión
De `docs/revisiones/REVISION_v12.7.0-v12.7.2.md`, sus puntos 1 a 5 y sus pruebas.
- **1. `PIDE` (urgente):** desde la 12.7.0 un `//` en `encargos2.js` se había tragado a la **panadera** y al **carnicero**, que dejaron de dar encargos sin un solo error. El comentario pasa al final de su línea y `PIDE` se exporta.
  - `tools/revisar-pide.mjs` (nuevo) lee el bloque sin comentarios y falla si falta uno de los 11 oficios o si aparece uno nuevo sin revisar. `encargos2.js` no corre en Node por las texturas: por eso lee el texto.
- **2. `bot-economia`:**
  - las tablas de pesca y de nasas **se importan** de `pesca.js` (`ZONAS`, `NASA`), ya no se copian;
  - el cupo es **por pueblo y por ítem**, como en el juego (antes era por puesto);
  - cuenta el **oro** de la basura (la pulpería lo paga a 10 u).
  - Con eso el pescador subía a 63.6 u/día. Se ajustó:
    - el oro de la basura baja del 1.5 % al 0.5 % (la bota sube al 7 %);
    - el róbalo, el sábalo y el pargo mancha pagan 1 u en el muelle y 1.25 en la soda de playa.
  - **Resultado:** pescador **57.5 u/día** (cazador 58.3); con la caña de fibra 38–61 (≈ 45–50); por zona: río 32 · río frío 38 · estero 38 · orilla 47 · arrecife 49 · altamar 58. Los criterios de siempre, en verde.
  - **Sin modelar** (decisión para nanoyackson): la cocina (sopa y arroz), el ostión y la piangua. La revisión estima que, sumados, el máximo ronda 100 u/día.
- **3. `zonaDe`:**
  - el arrecife se busca **de a un bloque** (antes con paso 2: un coral solo se perdía);
  - para altamar se toma una muestra cada ≤ 12 bloques en cada anillo (antes 16 ángulos: a 140 bloques, una cada 55) y el resultado se guarda **por celda de 16**.
  - Medido: 0.4 ms el primer lance y 0.3 ms con el caché.
- **4. Agotamiento:** se suman **la celda de la boya y sus 8 vecinas**. Antes, parado junto a una raya, cada lado tenía su propio 10.
- **5. Nasas:**
  - en el mar sin coral, zona **`orilla`**: pargo .35, corvina .35, camarón .2 y bota .1, cada 450 s (antes salían peces de río);
  - **la séptima no se queda puesta:** `registrarMonte` devuelve `false`, y `stations.js` quita el bloque y devuelve la nasa.
- **Datos importados:** `meta.pesca.celdas`, `meta.mariscos.matas`/`fondo` y `meta.monte` se limpian si traen basura (`NaN`, `null`, textos).
- **Probado en la pestaña 1:**
  - `PIDE` tiene los 11 oficios;
  - un coral en columna impar → «arrecife», y sin coral → «orilla»;
  - con la celda vecina agotada, en altamar solo salen pargo y corvina;
  - la nasa del mar queda como «orilla»;
  - de 7 nasas quedan 6 y la séptima se quita;
  - lo importado con `NaN`, `null` y textos se limpia sin errores;
  - `bot-economia` da la tabla de arriba.
  - Lo demás de la lista (carnada, veda, ostión, secadero) ya estaba probado en las 12.7.x.

## 12.8.2 — 2026-11-12 · El pescador y los halos
Lo de la sección 0 de la COLA, que llegó tarde: la orquestadora lo pedía como v12.8.1, pero ese número ya era de los jefes. Trae el balance del pescador, la decimoquinta revisión (`REVISION_v12.6.4-v12.6.6.md`, puntos 1 a 5) y los halos de Medio (§5.5 de `PLAN_GRAFICOS_2.md`, decididos por la orquestadora).
- **(A) El pescador a ≈ 45 u/día con la caña de fibra.**
  - La causa: el muelle **vendía** pargo y corvina (1.5 u) y la regla de oro de `pueblo.js` bajaba a 0.5 u lo que pagaba por ellos. Ahora **no los vende**, y el dorado lo vende a 9 u (más de 1.25 × lo que paga).
  - Las sodas pagan un poco menos por el pargo, la corvina, el róbalo, el sábalo, el pez gallo y el pargo mancha. La nasa del estero espera 450 s y la del arrecife 900 s (antes 300 y 420).
  - **Perfil del bot:** empieza en el río con lombriz, compra la caña de fibra y alterna estero y arrecife; después, nasas, bote y caña de altamar. Las tablas del bot son las del juego.
  - **Resultado** (`bot-economia`, en `BALANCE.md`): día 1, 29 u; con la caña de fibra (días 2–7), 41–61 u (unos **45–50** en promedio); desde el bote y las nasas, 58–61; **promedio del mes, 55.8 u**, por debajo del cazador (58.3).
  - Los criterios de siempre, en verde (razón 1.21). El de los perfiles nuevos («pagan la comida») falla solo por el **artesano**, que es de C6 (todavía no existe) y paga su inversión el día 1.
- **(B1) Nada invisible:**
  - `paintFlat` dibuja una **bolsita con la inicial** si el lienzo queda vacío;
  - `tools/revisar-iconos.mjs` (nuevo) falla si un ítem no tiene arte, PNG, sprite ni pintor. Hoy, 348 de 348.
- **(B2) La tabla `EXPLICITO`** en `agarre.js` (la clave manda sobre las regex):
  - el chicharrón y el tres leches ya no son recipientes, los sobres y la foto son planos, y el martillo, el catalejo, la caña brava y la tranca son herramientas;
  - **tipos nuevos:** `grande` (tabla de surf, parapente, papalote, arco de cintas y bomba de espalda) y `escudo` (pegado al antebrazo, de canto). El sello de goma pasa a pequeño;
  - en tercera persona, el papel sale a 3.4 px y lo pequeño a 2.4 px (antes se metían en el brazo).
  - **`tools/revisar-agarre.mjs`** (nuevo) compara el tipo de cada ítem con `tools/agarre-esperado.json` (con `--guardar` se reescribe).
- **(B3) Las hojas de la mano otra vez:** 12 en `docs/capturas/v12.8.2/`. La 12 es la de armaduras y escudos (`hoja-mano.js` ya no se los salta). Ningún ítem vacío.
- **(B4) `migrarVivos`** cuenta solo los corales bajo el mar (`y < SEA` y agua encima, si el chunk está cargado).
- **(B5) La costura con el lod:** además del agua lejana de la 12.8.0, el alfa del agua cercana va a 1 con la distancia (`mix(a, 1, lejosA·0.8)`). Las capturas `costura-atardecer-medio` y `costura-atardecer-alto` no muestran corte.
- **(C) Halos de Medio** (`src/halos.js`, nuevo; bandera `halos`, solo en Medio, con su casilla):
  - un `THREE.Points` aditivo con textura radial sobre las antorchas, lámparas y lava a ≤ 28 bloques (hasta 64), que titilan como la antorcha del shader;
  - en la lámpara y la lava, el halo va 0.75 hacia la cámara para que el cubo no lo tape;
  - las luces salen de `world.js meshChunk` (`anotarLuces`: los bloques que brillan de cada chunk, de arriba para abajo);
  - captura en `halos-medio-noche.jpg`.
  - **Costo sin medir:** el panel del navegador estaba oculto y todo el cuadro salía a 50–100 ms. Por construcción es una sola llamada de hasta 64 puntos.

## 12.8.1 — 2026-11-12 · Jefes que avisan (fase 2, tramo A)
De `PREPARACION_C5_Y_JEFES_F2.md` §3: la infraestructura común (§3.2) y los jefes 1–3 del tramo A (§3.1). Los tramos B y C siguen en sus versiones.
- **Infraestructura (`golpes.js`):**
  - `anilloAviso` vive ahora aquí (antes en `jefes3.js`, que lo vuelve a exportar para `jefes2.js` y `final.js`);
  - `marcarAviso(g, quien, dur)` lo llaman todos los avisos: `avisoCaida` (con quién, nuevo), `avisoEmbestida`, `anilloAviso`, `brilloAmago`, `brilloRojo` y el amago de `atacar`;
  - `avisoVivo(g, tipo)` lo usa `game.js damagePlayer` para repartir el daño de los jefes en `g.diag[tipo] = { conAviso, sinAviso }` (no se guarda).
- **`tools/bot-pelea.js`:** cada duelo trae `conAviso` y `sinAviso`, y `resumen` da `sinAvisoPct`.
- **`tools/revisar-avisos.mjs`:** `AVISOS_POR_JEFE` exige un aviso en el archivo de cada jefe de la fase 2. Los tres del tramo C que todavía no lo tienen (Murciélago Rey, Jefa de Ventanilla, Señor del Arenal) quedan como pendientes.
- **Tramo A:**
  1. **Terciopelo reina:** el escupitajo marca 0.5 s un anillo (`avisoCaida` de 1.4) donde está uno y el veneno cae ahí; se esquiva saliéndose. Pega el 65 % de las veces, como antes: con el 100 % el torpe pasaba de p 0.5 a 0.2.
  2. **Cocodrilo del Tárcoles:**
     - la vuelta de la muerte del gigante empieza con **0.6 s de anillo rojo** de 2.5; si uno sale del radio, no lo agarra (el cocodrilo chico, igual que antes);
     - la mordida del gigante lleva **brillo dorado**;
     - la vuelta le cuenta al cocodrilo (`g.atacante`).
  3. **Mono congo gigante:** el aullido avisa **0.8 s antes** con un anillo del radio del empujón (10). Los mangos ya tenían su sombra.
     - **No** se les puso `g.atacante` a los mangos: con él les pegaba la presión ×1.55 del jefe y el torpe ya no ganaba nunca.
- **Medida** (10 duelos por perfil, `JEFES({ solo: [los 3] })`, en la pestaña 1):

  | Jefe | p torpe / promedio / hábil | TTK torpe | Recibido torpe / promedio | Daño sin aviso |
  |---|---|---|---|---|
  | Terciopelo reina (50 · ×1.3) | 0.2 / 1 / 0.9 | 6.7 | 16 / 6.9 | 0 % |
  | Cocodrilo (85 · ×0.5) | 1 / 1 / 1 | 8.3 | 18.5 / 5.4 | 0 % |
  | Mono congo (290 · ×1.55) | 0 / 0.5 / 1 | — | — / 10.9 | 0 % |

  - Los tres quedan dentro de lo que dejó la fase 1 (TTK ~8 · ~9 · ~13 y p promedio 0.8 · 0.8 · 0.6), con el 0 % del daño sin aviso (el criterio pide menos del 10 %).
  - No se tocó `jefes-balance.js`. **Para nanoyackson u orquestadora:** el Mono congo sigue con p promedio ≈ 0.5–0.6 (el objetivo era 0.88). Bajar su presión de 1.55 a ≈ 1.3 lo acercaría.

## 12.8.0 — 2026-11-12 · Brillo de noche (PostFX y bloom)
De `docs/revisiones/PLAN_GRAFICOS_2.md` §5, más el agua lejana del lod con reflejo del cielo (opción (b) de la costura de la 12.6.5, que decidió la orquestadora).
- **`src/postfx.js` (nuevo).** El cuadro (cielo, horizonte y lo cercano) se dibuja en un render target de media precisión: `HalfFloat` si la tarjeta deja escribir en él (`EXT_color_buffer_float` o `_half_float`), si no de 8 bits.
  - **Bloom por reducción:** un umbral suave (0.95, rodilla 0.3), 4 niveles en Alto y 5 en Ultra, la subida sumando con un filtro de tienda y el pase final.
  - **Pase final:** escena + bloom (fuerza 1.0 en Alto, 1.3 en Ultra), con un hombro que deja igual lo que no pasa de 1.
  - **La mano** va después, directo a pantalla y sin bloom, como dice el plan.
  - **En Bajo y Medio no se crea nada,** y si se baja de Alto se libera la memoria (unos 11 MB a 800 × 600).
- **Emisores (`POST_HDR`, solo en el material de los bloques).** El mallador marca los bloques que brillan con `aAnim` 8 y la lava con la fracción .9. Con bloom, `world.js` los sube ×2.3 por encima de 1.
- **Bandera `bloom`** (Alto y Ultra) en `atmosfera.js`, con su casilla `#s-v-bloom` en Video → Personalizado.
- **El agua lejana del lod** (`lod.js`, con `ATMOS_AGUA` ahora también en el material `lejos`): la cara de arriba del agua, azul y a `SEA + 0.875`, mezcla el cielo por el ángulo (Fresnel) y suma un brillo de sol (`^60`) que se apaga con nublado (`uAgua.z`). Se ve en Medio, Alto y Ultra.
- **Costo** (`nanoblocks.costo('bloom', 60)`, de noche con lámpara, antorchas y lava): de 0 a 0,36 ms en 4 corridas, unos 0,15 ms de media.
- **Capturas** en `docs/capturas/v12.8.0/`: la misma vista de noche en Medio (sin bloom) y en Alto (con bloom), y el atardecer en Alto mirando al mar, con el agua lejana y la estela hasta el horizonte.
- **Falta (siguen en la COLA):** el SMAA (suavizado) del mismo PostFX, los halos baratos para Medio (§5.5, por confirmar con nanoyackson) y pasar el hombro de `GLSL_GRADO` al pase final.

## 12.7.2 — 2026-11-12 · Mariscos y la veda (C5-A2)
De `DISENO_CONTENIDO_C5-C8.md` §C5-A.4–A.6 y `PREPARACION_C5_Y_JEFES_F2.md` §1.3 (`monte.js`) y §1.5 (la nasa). Ids nuevos: firma de `MIN_IDS` al día y `MIN_VERSION` 12.7.2.
- **La nasa por zona** (`monte.js` con `pesca.js NASA` y `zonaNasa`). Al ponerla se guarda la zona:
  - **estero** (manglar): camarón .5, róbalo .2, tilapia .2, bota .1, cada 300 s;
  - **arrecife** (coral vivo a ≤ 4): camarón .35, ostión .2, pargo mancha .25, **langosta .03** y bota .17, cada **420 s** (la preparación recomendaba bajarlo de 360);
  - **río**: guapote .4, machaca .3 y tilapia .3.
  - Las nasas puestas antes de la 12.7.2 (sin zona) siguen con la tabla de siempre.
  - **Tope de 6 nasas:** la séptima avisa y no pesca; las de mundos viejos no se quitan.
- **La piangua** (`usarMarisco`): a mano, con clic derecho a un tronco de mangle (`jungle_log`) del manglar junto al agua. Da 6 por mata (celdas de 4 × 4) y se repone en 3 días.
  - **La veda:** los días 11 a 14 de cada mes del juego. Sacarla en veda baja 1 de reputación (`tickReputacion` se la anota al pueblo más cercano) y lo regañan.
  - El pescador lo avisa una vez por veda en la playa o el manglar (`avisoVeda`).
  - No hay piangua en `PIDE` (el tablón no la pide).
- **El ostión:** con la careta y buceando, clic derecho a la arena, la grava o el barro del fondo del mar o del manglar. Sale un 35 % de las veces, cada sitio cada 3 días y hasta 6 al día; un 5 % trae perla.
- **El secadero** (bloque 670, `pixelart.js P.secadero`; 3 caña brava + 2 palos). Con un pescado crudo en la mano y sal en el inventario se pone a secar, hasta 4 a la vez. A los 3 días da **pescado seco** (1120), que dura 30–60 días y no se vende.
- **Cocina del fogón:**
  - sopa de mariscos: 2 camarón + 2 piangua + 1 pescado + 1 balde de agua, que se devuelve;
  - arroz con camarones: 1 arroz + 3 camarón + 1 limón;
  - langosta gratinada: langosta + queso Turrialba + limón.
- **Ítems:** langosta 1113, camarón 1114, piangua 1115, ostión 1116, los tres platos (1117–1119) y el pescado seco (1120). Los mariscos crudos entran en `PESCADOS`: se pudren en 2–4 días, no dan fuerza crudos y el gato los come. Los platos duran 3–6 días.
- **Tiendas:**
  - el muelle compra camarón (0.5), ostión (1), piangua (0.25) y langosta (6);
  - la soda de playa compra la sopa (6) y el arroz (5);
  - el restaurante de lujo compra la langosta (8) y la langosta gratinada (18).
- **Íconos:** dibujados en `paintFlat` (langosta, camarón, piangua, ostión, gratinada); los demás con `icono` + `tinte`.
- **Probado en la pestaña 1:**
  - la nasa del manglar queda como «estero» y 40 tiradas dan camarón 20, róbalo 10, tilapia 9 y bota 1;
  - la séptima nasa avisa;
  - la piangua da 6 y luego «ya no tiene»; en veda (día 12) da reputación −1 con el regaño;
  - el ostión sale con careta en el agua;
  - el secadero gasta la sal, se niega sin sal y al tercer día da 2 pescados secos;
  - las 4 recetas existen y los íconos se ven en la mano.
- **Falta:** la boya (bloque 667), el muelle y el bote de vela (C5-A3, opcional) y la pelea del atún.

## 12.7.1 — 2026-11-12 · Doña Lía y las fragatas (sobras de C5-B)
De `DISENO_CONTENIDO_C5-C8.md` §B.1 (3 y 4) y §B.2, más los perfiles de `PREPARACION_C5_Y_JEFES_F2.md` §2.
- **Doña Lía** (`arrecife.js quizaDonaLia`): un vecino sin tienda que aparece en la playa (bioma `beach`) la noche de la arribada y la de los nacimientos (día + 5). No se guarda: se vuelve a poner cuando hace falta. Al hablarle (`data.alHablar`, gancho nuevo en `VECINO.interact`, `pueblo.js`) dice cuánto se pagó de la arribada, cuántas tortuguitas lleva al mar y cuántas le faltan para la banderita. El pago sigue automático, como en la 12.6.0.
- **La fragata** (`FRAGATA`, mob nuevo en `MOB_TYPES`, con el modelo de `costa.js`, ahora exportado):
  - al nacer un nido protegido bajan hasta 2 (máximo 3 vivas) a cazar tortuguitas en la arena, y si alcanzan una se la llevan;
  - un golpe las espanta (logro «Fuera de la playa»); se van solas a los 50 s;
  - medido: sin defenderlas se llevan ~22 % (6 de 27 en 3 nidos).
  - Los pelícanos siguen como decorado de `costa.js`.
- **La banderita azul:** con 100 tortuguitas al mar (`conBanderita`), los tours de los turistas pagan +25 % (`turistas.js`).
- **Los 150 corales** (`arrecifeRico`): cerca de un coral revivido, el tope de mantarrayas pasa de 7 a 8 y salen el doble de seguido (`mar2.js`).
- **`tools/bot-economia.js`:**
  - los perfiles **pescador** y **artesano** pegados de la §2.1 y sus dos criterios;
  - «nadie se queda sin comer» y la razón 1.5× miran solo los tres perfiles de siempre.
  - **Resultado:** trabajador 55.6 u/día, cazador 58.3, comerciante 39.3, **pescador 17.1** y artesano 42.9; los criterios de siempre, en verde.
  - **Por qué el pescador da mucho menos que lo que esperaba la preparación (36 → 76 u):** la **regla de oro** de `pueblo.js` (nada se compra y se revende con ganancia) baja a 0.5 u lo que pagan por el pargo y la corvina, que también se venden. La preparación no la tuvo en cuenta.
  - Con eso, el perfil pesca en la orilla sin carnada (≈ 17 u, lo justo para comer) y **nunca junta para la caña de fibra**. Por zona (`tier`): río 29 u, río frío 35, estero 39, orilla 24, arrecife 36 y altamar 33.
  - El criterio «pescador y artesano pagan la comida» falla por el día 1: el pescador apenas cubre la comida y el artesano paga su inversión.
  - **No se tocó el balance** (decisión de nanoyackson): o se le sube el pago a las especies de orilla, o el perfil arranca en el río con lombriz.

## 12.7.0 — 2026-11-12 · Pesca a fondo (C5-A1)
De `docs/revisiones/DISENO_CONTENIDO_C5-C8.md` §C5-A, con los números y el orden de `PREPARACION_C5_Y_JEFES_F2.md` §1. Es la tanda 3 de la §1.2. La nasa por zona, los mariscos, la veda, la cocina y el secadero (C5-A2) van en la siguiente. Ids nuevos: firma de `MIN_IDS` al día y `MIN_VERSION` 12.7.0.
- **`src/pesca.js` (nuevo).** `zonaDe` reconoce la zona donde cae la boya: río, río frío (altura ≥ 90, páramo o nuboso), estero (manglar), orilla, arrecife (coral vivo a ≤ 6) y altamar (≥ 140 bloques de tierra y en bote).
  - **Caña mínima por zona:** sin la caña que pide la zona, pica lo de la zona más cercana.
  - **Carnada:** la primera que haya en la barra y le sirva a la zona. Sin ella, la espera sube ×1.4; con ella, queda como siempre (las cañas no aceleran: §1.5).
  - **Tablas por zona** con los pesos de la §1.5 y **basura del 12 %**: la **perla baja del 3 % al 1 %**.
  - **Agotamiento:** tras 10 piezas «buenas» (≥ 1.5 u) en la misma celda de 48 × 48 el mismo día, ahí solo pica lo común.
  - **Libro del pescador** (`meta.pesca.libro`): cuántas de cada especie y el récord de tamaño, de 0.7 a 1.3 del normal (el nivel de pesca sube el piso).
- **Ítems:**
  - `cana_fibra` (1100, 30 u en el muelle o 3 caña brava + 2 cabuya + 1 hierro) y `cana_altamar` (1101, 90 u en la ferretería o 4 hierro + 1 cabuya + 1 cuero);
  - carnada: `lombriz` (1102: 25 % al cavar tierra o pasto con pala a ≤ 3 del agua, o 6 por 1 u), `sardina` (1103: 4 por 1 u, y en la red de mar una de cada 4 piezas) y `senuelo` (1104: un pescado + palo + cabuya → 3; dura 60 usos);
  - peces 1105–1112: machaca, tilapia, róbalo, trucha, sábalo, pez gallo, atún y pargo mancha.
  - Los íconos reusan el dibujo de un pez parecido con un tinte nuevo (`icono` + `tinte` en `textures.js`). También tienen dibujo ahora los ítems de C5-B que salían vacíos: 1121, 1124–1126 y 1187.
- **Un solo registro** (`blocks.js`): `esCana(id)` (el ítem tiene `rod`) y `esPescado(id)` / `PESCADOS`. Lo usan:
  - la caña en `game.js`, `pezvela.js` y `torneo.js`;
  - los crudos en `comodidad.js`, `expediente.js`, `fuerza.js`, `plato.js` y `game.js` (cocina y la tripa revuelta);
  - el gato de `finca.js` e `isFish` de `mar.js`.
  - Y, con las especies nuevas: `despensa.js` (se pudren en 2–4 días), `supervivencia2.js` (fogata), `recipes.js` (horno → pescado frito, y con sal → salado) y `torneo.js` (`PESOS`).
- **Tiendas.** Las especies nuevas **solo se compran**:
  - el muelle paga de 0.5 a 4 u por pieza y vende la caña de fibra, la lombriz y la sardina;
  - las sodas pagan más: la de playa, róbalo, sábalo, pez gallo y pargo mancha; la de siempre, machaca, tilapia y trucha;
  - el restaurante de lujo paga el atún a 6 y el pez gallo a 3;
  - el tablón (la soda de playa) pide también machaca, tilapia y pargo mancha, nunca atún ni langosta.
- **La red:** a lo sumo **3 tiradas** a la vez (antes sin tope).
- **El pez vela:** solo con la caña de altamar.
- **Herramientas:**
  - `revisar-recetas` tenía la búsqueda rota desde siempre: `\b` dentro del template era un retroceso, así que nada contaba como fuente. Ahora encuentra bien y solo quedan 2 avisos (las hojas y el pasto alto, que no se sueltan a sí mismos);
  - `revisar-ext-item` usaba el 1100 como ítem de prueba: ahora toma el primero libre.
- **Probado en la pestaña 1:**
  - la tabla de cada zona coincide con la preparación (±1 % en 4 000 tiradas);
  - en un mundo nuevo se reconocen río, estero (manglar), orilla y arrecife;
  - con la caña de fibra y lombriz en el río la boya se queda, pica, sale una tilapia, se gasta 1 lombriz y queda en el libro;
  - la espera media es 9,9 s con lombriz y 16,5 s sin carnada;
  - la pestaña «Pesca» de la libreta se dibuja;
  - la lombriz sale con pala junto al agua;
  - los íconos nuevos se ven en la mano.
- **Falta:**
  - la pelea de tensión del atún: hoy sale como un pez más;
  - el precio por tamaño y el ×1.5 del récord: el tamaño solo va al libro, porque las pilas no guardan tamaño;
  - los perfiles «pescador» y «artesano» de `bot-economia`, que van en la próxima versión con las sobras de C5-B.

## 12.6.6 — 2026-11-12 · Cómo se agarran las cosas
Pedido de nanoyackson: «hay que mejorar la mano como agarra algunas cosas, vi que la galleta la agarra rarísimo». La «galleta» es la tortilla (270), lo primero de la barra en un mundo nuevo. En primera persona salía enorme, tapaba media pantalla y la mano la agarraba por una esquina, como si fuera un mango.
- **`src/agarre.js` (nuevo):** `tipoAgarre(id)` clasifica cada objeto según su definición y su clave:
  - `herramienta`: `tool`, `damage`, `bow`, `rod`, `machete`, `thrust`, o `dur` sin ser armadura ni recipiente, más la jabalina;
  - `plano`: planos, papeles, libros, escrituras y mapas;
  - `recipiente`: `bucket`, `sip`, `drink`, y baldes, botellas, frascos, tazas y bebidas por la clave;
  - `pequeno`: todo lo demás (comida, materiales, monedas y billetes);
  - `bloque`.
  - `AGARRES` da el tamaño y la pose de cada tipo, `TAM_3P` el tamaño en tercera persona y `agarreDe` el punto de agarre.
- **Primera persona** (`game.js rebuildHand`):
  - las cosas pequeñas miden 0.24 (antes 0.5, como una espada), van de frente con un giro leve y apoyadas sobre los dedos;
  - los recipientes miden 0.28, van de pie y se agarran por la base (por el costado, el puño los tapaba);
  - los planos miden 0.36, van abiertos e inclinados hacia uno;
  - las herramientas se agarran a un octavo del mango (antes a un quinto, `models.js`).
  - También se arregló un descuido: la pose de las herramientas (`def.tool`) se pisaba siempre con la de los objetos planos.
- **Tercera persona** (`avatar.js heldMesh`): las herramientas, como antes; lo demás mide de 5,5 a 8 px (antes 11 px), sale de la mano por el borde de abajo, el papel va inclinado y el recipiente derecho.
- **`tools/hoja-mano.js` (nuevo):** la hoja de contactos. Pasa por todos los ítems (y 6 bloques) y dibuja cada uno en primera persona (el recorte de la mano en una pantalla de 800 × 600) y en tercera, con su tipo. Las 11 hojas (316 objetos) están en `docs/capturas/v12.6.6/mano-01…11.jpg`, más `tortilla-antes.jpg` y `tortilla-despues.jpg`.
- **Ajustes hechos con las hojas:**
  - los billetes pasaron de «plano» a «pequeño» (salían grandes y cortados);
  - el collar dejó de ser recipiente («c**olla**r» contenía «olla»);
  - la jabalina se agarra como lanza;
  - los objetos pequeños se apoyan sobre los dedos (si no, el puño tapaba la mitad).
- **Sin ícono todavía:** los ítems nuevos de C5-B (1121, 1124–1126) y el libro de encargos (1187) salen vacíos en la mano porque no tienen ícono (esperan los de GPT).

## 12.6.5 — 2026-11-12 · El arrecife se ve
De `docs/revisiones/REVISION_v12.6.2-v12.6.3.md`, sus puntos 1 a 5 y dos detalles más.
- **1. La banda oscura y el corte en la orilla:** ya no salen. Desde la 12.6.4, la profundidad y la orilla viajan separadas (`vAgua`) y la profundidad va por esquina. *Prueba 1:* orilla en diagonal en Medio, con el degradado suave y sin franja (`docs/capturas/v12.6.5/orilla-diagonal-medio.jpg`).
- **2. Lo hondo ya no tapa el arrecife:** el alfa tiene un tope de 0,78 (antes 0,95) y lo hondo se oscurece en el color (`0.02, 0.11, 0.30`). Desde abajo del agua no cuenta la profundidad: el alfa queda en ~0,67 y se ve el cielo. *Prueba 2:* el coral a 6 de hondo se ve desde arriba, y buceando con la careta a 4 bloques se ve claro (`arrecife-desde-arriba-alto.jpg`, `arrecife-con-careta-alto.jpg`).
- **3. La costura con el agua lejana del lod**, con la opción (a):
  - uniforme nuevo `ATMOS.uAgua`, que pone `actualizarAtmosfera`: el fundido va de `R·16·0.5` a `R·16·0.92` y la `z` es el nublado;
  - lejos, el color tira al del agua del lod (`0.16, 0.34, 0.68`), el Fresnel baja 85 % y el sol 60 %.
  - *Prueba 3:* atardecer en Alto y en Ultra (`costura-atardecer-alto.jpg`, `costura-atardecer-ultra.jpg`). La costura se suaviza pero no desaparece: el agua del lod sigue siendo un azul plano. Si molesta, la opción (b) le da al lod un reflejo del cielo por el ángulo.
- **4. `R.vivos`:**
  - `A()` deja solo textos `x,y,z` y aplica el tope de 400 (un `[1, null]` importado tiraba TypeError en el tic);
  - **migración** (una vez, `vivosV`): los corales de color que están en `world.mods` pasan a la lista, hasta los que diga `revividos`, para los mundos de la 12.6.0–12.6.2.
  - **`cobrarDelTope` vive ahora en `plata.js`** (con `TOPE_DIA`) y lo usan los encargos y los buzos: ya no hay copia que se desalinee.
- **5. El vivero** pide agua (no celeste) en toda la columna hasta el nivel del mar. *Probado:* en una piscina bajo tierra y bajo agua celeste no cría; en el mar sí.
- **El sol con nublado y lluvia:** el brillo del agua baja hasta 90 % con `weather.intensity`. *Probado:* con lluvia no hay estela.
- **Nidos huérfanos:** si el bloque ya no es el nido (explosión, agua, pistón), `tickTortugasArrecife` y `fauna.js tickNests` borran la entidad en vez de hacer nacer tortuguitas. *Probado* con los dos tipos de nido.
- **Costo** (`nanoblocks.costo('agua', 60)`, atardecer mirando al mar, 6 corridas): de −0,10 a +0,58 ms, unos 0,2 ms de media, dentro de los ~0,5 ms.
- **Sin cambio:** el aviso de la estaca para los nidos de la arribada de antes de la 12.6.1 (sin entidad) dice «sigue su curso solo», aunque esos no nacen.

## 12.6.4 — 2026-11-12 · Agua que se nota
Lo que pidió la orquestadora al ver las capturas de la 12.6.2: entre Bajo y Alto casi no había diferencia. También trae las dos decisiones que quedaban de la 12.6.3.
- **El agua de material, reforzada** (`world.js makeMaterial`, solo con `ATMOS_AGUA`; Bajo queda igual):
  - **Profundidad y orilla por separado:** el vértice separa la fracción de `aAnim` en `vAgua` (x = profundidad, y = orilla). Antes iban en una sola variable interpolada y la espuma casi no salía.
  - **La profundidad va por esquina** (`mesher.js`): el promedio de las 4 columnas que la comparten, con la tierra en 0, hasta 8 de hondo (`× 0.05`). Antes iba por celda, hasta 6, y cambiaba a saltos.
  - **Color:** la orilla turquesa (`0.30, 0.80, 0.78`) y lo hondo azul oscuro (`0.03, 0.15, 0.36`), por la luz del vértice; el alfa va de 0,5 a 0,95.
  - **Fresnel de Schlick** (`0.03 + 0.97·(1−cos)^5`): mirando para abajo, casi nada; rasante, hasta el 85 % de cielo.
  - **El sol:** un lóbulo ancho (`^90`, la estela) y uno fino (`^900`, los destellos) sobre una normal con rizos cortos. Con el sol bajo brilla hasta 2,5 veces más, y de noche no hay.
  - **La espuma:** una banda blanca de unos 0,3 a 0,5 bloques donde el agua toca un bloque sólido, que va y viene (`vaivén`) y se rompe en manchas.
- **Costo:** `nanoblocks.costo('agua', 60)` en Alto, mirando al sol sobre el agua: −0,06, +0,14, +0,23 y +0,01 ms (unos 0,08 ms de media), bajo el tope de ~0,5 ms.
- **Capturas** en `docs/capturas/v12.6.4/`: `agua-bajo` y `agua-alto` con la misma vista, y `agua-alto-hora-dorada` (time 0.48, mirando al sol).
- **Nidos de la lora** (decisión de la orquestadora):
  - todos nacen **a la quinta noche**: `arribada.js` les pone `eclosiona: día + 5` y `fauna.js tickNests` los hace nacer de noche desde ese día (3 a 6 tortuguitas sin paga). Los de la 12.6.1, que no traen `eclosiona`, toman su `dia + 5`. La baula y la tortuga verde siguen con su reloj;
  - marcar un nido conserva su fecha (`arrecife.js`) y el aviso dice cuántas noches faltan;
  - así los saqueadores de las 4 noches siguientes tienen nidos sin marcar que cavar, y marcar sirve para protegerlos.
- **Coral blanco en mundos viejos:** se usó la opción (a). El juego no guarda qué chunks ya se generaron (los que no se tocan se regeneran desde la semilla), así que no se puede cambiar `genVersion` solo en los chunks nuevos sin blanquear también el mar ya visto. La ayuda (`ayuda.js`, «Revivir el arrecife») avisa en los mundos con `genVersion` < 20, y suma «Nidos de la arribada».
- **Probado en la pestaña 1:**
  - un nido de lora del día 7 sigue en los días 8, 10 y 11; el 12 no nace de día y de noche nace;
  - un nido marcado conserva `eclosiona: 12`;
  - un nido de la 12.6.1 del día 3 no nace el 7 y sí el 8;
  - la baula nace con su reloj;
  - la ayuda muestra el aviso con `genVersion` 19 y no con 20;
  - de noche, el agua no brilla.

## 12.6.3 — 2026-11-12 · Decimotercera revisión
De `docs/revisiones/REVISION_v12.5.2-v12.6.0.md` §7. Todo en `arrecife.js` salvo lo marcado.
- **Saqueadores:**
  - **2 por noche como máximo** (`meta.tortugas.saqueoN` / `saqueoNDia`; antes atrapar al primero dejaba salir otro y se podía farmear: unas 80 u por noche);
  - **atraparlos no baja la fama:** `VECINO.onHurt` (`pueblo.js`) no resta reputación si es el saqueador.
- **Fragmentos de coral:**
  - solo de un coral **del arrecife**: si su posición está en `world.mods` (lo puso el jugador) no da, salvo que sea uno que el jugador revivió en ese mismo sitio (`meta.arrecife.vivos`). Antes, moverlo daba otro al instante;
  - **6 por día** (`fragN` / `fragDia`).
- **Buzos:** pagan solo a ≤ 40 bloques de un coral revivido (`meta.arrecife.vivos`, las últimas 400 posiciones), solo en supervivencia, y **cuentan en el tope del día de los encargos** (`cobrarDelTope` en `arrecife.js`, con la misma cuenta de `encargos2.js`: lo que pase de 40 u paga al 40 %; no se importa para no hacer un ciclo de trozos). Un mundo que ya tenía 60 revividos sin la lista cobra cuando reviva el siguiente.
- **Nidos:**
  - la estaca solo marca nidos con `be.lora` (los de la arribada). La baula, la tortuga verde y los nidos de decoración del Parque Tortuguero siguen como antes;
  - romper un `nido_marcado` borra su entidad (`game.js breakBlock`, también en creativo). Antes el nido huérfano seguía naciendo.
- **Vivero:** solo con agua (`FLUID === 1`, no lava) encima y por debajo del nivel del mar.
- **Agachado con un bloque en la mano**, `usarArrecife` deja poner el bloque.
- **Datos importados:** `Number.isFinite` en `meta.tortugas`, `meta.arrecife`, `be.eclosiona` y `be.dia`.
- **Constantes:** `K` y `COLON` vienen de `plata.js`.
- **`MIN_IDS.version`:** la firma lleva la versión que la trajo, y `tools/revisar-version.mjs` exige que sea `MIN_VERSION`.
- **Probado en la pestaña 1:**
  - un coral trasplantado da 0 fragmentos; 9 del arrecife dan 6;
  - el nido de baula no se marca y el de lora sí; al romper el nido protegido la entidad queda en `null`;
  - agachado con piedra, `usarArrecife` da `false`;
  - `pagado: 'x'` y `revividos: NaN` se limpian;
  - con 30 tiradas seguidas salen 2 saqueadores; al golpear uno, la fama queda igual y el saqueador queda atrapado;
  - los buzos pagan cerca (y suman al tope: 35 → 45) y no pagan lejos.
- **Queda para nanoyackson:**
  - **la mecánica del saqueador:** desde la 12.6.1, los nidos de la lora eclosionan solos en minutos, así que casi no queda nido sin marcar cuando llegan los saqueadores. Las opciones son que los nidos de la lora esperen a la noche 5 y solo nazcan si están marcados, o aceptar que el saqueador queda para la baula y el parque;
  - **los mundos viejos sin coral blanco** (§2 de la revisión): (a) decirlo en la ayuda, (b) blanquear a mano o (c) subir `genVersion` para los chunks no generados.

## 12.6.2 — 2026-11-12 · Agua de material
De `docs/revisiones/PLAN_GRAFICOS_2.md` §4.1. Solo en Medio y Alto (flag `agua` de `atmosfera.js`); en Bajo el agua queda igual.
- **El shader del agua** (`world.js makeMaterial`, con `#define ATMOS_AGUA` solo en el material `agua`):
  - Fresnel con una normal procedural que se mueve;
  - el cielo reflejado con los colores de la cúpula (`ATMOS.uCieloHoriz` / `uCieloCenit`, que copia `sky.js`);
  - el brillo del sol (`pow(…, 220)`);
  - más azul, oscura y opaca donde es honda (alfa de 0,66 a 0,9), clara en la orilla y con espuma que se mueve;
  - con la cámara debajo del agua, nada de reflejo.
- **La profundidad y la orilla** las calcula el mallador (`mesher.js`, rama del agua) y van en la parte decimal de `aAnim` (base 3 = con ola, 6 = quieta): hasta 6 celdas de agua hacia abajo y una marca de orilla por esquina. Sin textura extra ni otra pasada.
- **Ajustes:** casilla «Agua que refleja el cielo» (`#s-v-agua`) en Video → Personalizado.
- **Costo medido** con `nanoblocks.costo('agua', 60)` junto a la playa, en Medio: entre −0,21 y +0,13 ms en 6 corridas, o sea, por debajo del ruido (unos 3 ms por cuadro en total).
- **Capturas** en `docs/capturas/v12.6.2/` (agua-bajo, agua-medio y agua-alto, misma vista).
- **Pendiente:** el agua lejana del lod (`lod.js`) sigue con el material de siempre; de lejos el cambio casi no se nota.

## 12.6.1 — 2026-11-12 · Nidos de la arribada
Lo que pide `docs/revisiones/PREPARACION_C5_Y_JEFES_F2.md` §1.3 para C5-B, que la v12.6.0 no tenía.
- **Los nidos de la tortuga lora** llevan su entidad (`{ type: 'nest', hatch, lora: true }`, `arribada.js`): **eclosionan solos** con el `tickNests` de siempre (`fauna.js`) si nadie los saquea. Antes no tenían entidad y nunca eclosionaban. Los marcados con la estaca siguen con lo suyo (5 noches y el pago).
- **El saqueador** borra también la entidad del nido que cava; si no, el nido saqueado igual eclosionaba.
- **La luz que desorienta:** antorchas, faroles y lámparas a 6 bloques (antes solo antorchas, a 8).
- **El vivero** solo cría con agua encima. Probado: en el aire 0 fragmentos, bajo el agua 2.
- **El nido protegido** no se rompe sin agacharse. Probado.

## 12.6.0 — 2026-11-12 · Tortugas y arrecife (C5-B)
De `docs/revisiones/DISENO_CONTENIDO_C5-C8.md` §C5-B (`src/arrecife.js`, nuevo). Ids nuevos, con la firma de `MIN_IDS` al día y `MIN_VERSION` 12.6.0.
- **Bloques e ítems nuevos:**
  - bloques: `nido_marcado` (668), `vivero_coral` (669), `pecera` (671) y `coral_blanco` (697);
  - ítems: `fragmento_coral` (1121), `estaca_nido` (1124), `banderita_azul` (1125) y `cabuya` (1126).
  - Pintores nuevos en `pixelart.js`; los íconos de GPT se conectan cuando lleguen.
- **Recetas:** cabuya (2 caña brava → 3), estaca de nido (2 palos y 1 cabuya), vivero (palos, cabuya y caña brava) y pecera (5 vidrios). `revisar-recetas` en 0.
- **Los nidos de la arribada:**
  - con la **estaca de nido**, clic derecho a un nido lo marca (hasta 12 por arribada); queda protegido y **a las 5 noches salen 8 a 12 tortuguitas** (la tortuguita de siempre, que va sola al mar);
  - **las antorchas a menos de 8 bloques** desorientan al 30 %: caminan para tierra y se pierden;
  - cada tortuguita de un nido protegido que llega al mar paga **0.3 u** (tope 30 u por arribada);
  - a las **100**, la **banderita azul** y el logro «Voluntario de la tortuga».
- **Los saqueadores:**
  - en las 4 noches después de una arribada aparecen hasta 2, **sobre la arena**, junto a un nido **sin marcar**: lo cavan en ~4 s y se van;
  - **golpear a uno lo atrapa**: el guardacostas se lo lleva y la multa le paga **5 u**, sin bajar la fama;
  - **nunca hay huevos en el inventario**.
  - Las rutinas de la noche no lo acuestan a dormir.
- **El arrecife:**
  - en los mundos nuevos (`genVersion` **20**) hay **parches de coral blanqueado**;
  - **con la careta y la mano vacía**, clic derecho a un coral vivo saca un **fragmento** sin matarlo (uno por coral cada 3 días);
  - **el fragmento revive** un coral blanco con un color al azar;
  - **el vivero** da 2 fragmentos cada 3 días;
  - hitos a los 20, 60 y 150 corales revividos; desde 60, **los buzos dejan 10 u al día** si uno anda por la playa.
- **La pecera:** con un pargo o un guapote vivo cuenta como comodidad (`fuerza.js`); vacía, no.
- **Probado en tab-1:**
  - un nido marcado, del que nacieron 12 tortuguitas, y el pago de 0.3 u por la que llegó al mar;
  - un saqueador que apareció en la arena, cavó un nido sin marcar a los 12 s y huyó, y otro atrapado (5 u);
  - el fragmento con careta, que no se puede repetir el mismo día, y un coral revivido;
  - la pecera, que vacía no cuenta y con pez sí;
  - **en un mundo nuevo**, coral blanco y de color en la misma zona del arrecife (185 contra 214, así que subí el umbral para acercarlo al 35 % del diseño).
- **Quedan del diseño:** la voluntaria **Doña Lía** como NPC (hoy la Asociación paga sola), las fragatas y los pelícanos que acechan, el +25 % de los turistas con la banderita, la mantarraya de los 150 corales y el perfil «pescador» en `bot-economia.js`.

## 12.5.2 — 2026-11-12 · Duodécima revisión
§5 de `docs/revisiones/REVISION_v12.4.13-v12.5.0.md`.
1. **El regulador** (`regulador.js`, reescrito):
   - **lo que baja vive solo en memoria** (`game.escalaAuto` y `game.calidadRegulada`). Antes escribía `settings.calidad`, que se guarda y se comparte: un Ultra quedaba en Medio para siempre;
   - **no vuelve a subir solo** dentro de la sesión (subir y bajar oscilaba cada ~125 s);
   - la meta es **60 fps**, salvo un **tope de pantalla parejo** (30, 40, 45, 48 o 50 Hz, casi sin dispersión), que no es el juego lento y no se toca;
   - en **Bajo no actúa**;
   - tocar a mano la calidad, un efecto o la resolución deshace lo bajado (con `resize`) y lo deja **3 min** sin actuar;
   - el panel dice «(automático)» cuando la calidad la bajó él.
   - **Probado** con intervalos simulados:
     - con 30 Hz parejos no tocó nada;
     - con 25 fps irregulares bajó a 85 % → 70 % → Alto → Medio, y lo guardado siguió en Ultra;
     - con 60 fps después no volvió a subir.
2. **De quién es un golpe:**
   - `golpes.js` pasa el atacante (`g.atacante`) y `jefeDelGolpe` usa ese y nada más;
   - sin atacante (rayos, veneno, embestidas directas) cuenta el nombre o el alias del aviso;
   - **el origen del golpe ya no cuenta**: tomaba por el jefe a los secuaces, las explosiones y los proyectiles que caían a su lado.
   - **Probado:** una Sombra pegada al Olvido pega 3 (antes 9); el Olvido, 9 (×3).
   - **Remedido:** la Noche Larga del día 30 con diamante (perfil promedio) gana 2 de 2, con vida mínima de 18.5 y 21; la del día 20 con hierro, 1 de 2 (antes 0 de 2); el Olvido y la Sombra Madre, 5 de 5.
3. **El atlas sin negro en lo transparente:**
   - se arma como `THREE.DataTexture` (un `Uint8Array`) y no en un lienzo 2D, que guardaba los píxeles transparentes en negro;
   - el RGB de cada píxel transparente lleva el **color medio de los opacos de su baldosa** (sangrado de color), con el alfa en 0;
   - así los mipmaps ya no oscurecen ni hacen desaparecer de lejos las flores, el pasto, la caña, las enredaderas y el vidrio.
   - Probado: el mundo se dibuja igual de cerca (captura).
4. **El medidor** solo trabaja con el panel encendido (`costo()` lo enciende mientras mide); al apagarlo se borran las consultas pendientes, y el dibujo va en `try/finally` para que una consulta no quede abierta.
5. **`BALANCE.md`:** el ×3 de los jefes topados solo cuenta contra armadura buena (por el tope del 60 %), y de quién es un golpe.

## 12.5.1 — 2026-11-12 · Undécima revisión
Los 8 puntos de §9 de `docs/revisiones/REVISION_v12.4.10-v12.4.12.md`, en su orden.
1. **`MIN_IDS` mira todos los ids:**
   - era solo el máximo, y un id nuevo por debajo (el 665 de C5, el 1100 de la pesca) pasaba en verde;
   - ahora es una **firma**: cuántos bloques, cuántos ítems y un hash FNV de la lista (`MIN_IDS = { bloques: 319, items: 323, hash }`). `tools/revisar-version.mjs` falla si cambia e imprime la firma nueva;
   - la prueba también exige que los ítems de 600 en adelante estén en `EXT_ITEM–MAX_ITEM`.
   - Probado: con un ítem 1100 de mentira, la prueba falla.
2. **Un encargo aceptado se entrega al otro día:**
   - el tablón muestra primero los que se aceptaron otros días y siguen vigentes (antes se comparaban contra la lista de hoy y quedaban huérfanos);
   - un urgente aceptado de noche vence al día siguiente;
   - el aviso de los vencidos dice qué pueblo bajó la fama y cuánto.
   - Probado: un común aceptado ayer aparece primero en el tablón y se cobra.
3. **Mandados:** uno por destino a la vez. Si se llega en bus (menos de 10 min de viaje), el recado paga la tercera parte; el bus anota `g.llegoEnBus`. Probado: uno de 9 u pagó 3 en bus.
4. **El pago:** lo que se puede comprar paga como mucho el **95 % de comprarlo**, redondeando hacia abajo (antes 1.25 veces: comprar y entregar daba ganancia). Lo que no se compra sigue en 1.25 veces. El encargo grande queda en ×1.1 (antes 1.4). Probado: cinco encargos, todos por debajo de su precio de compra.
5. **El cupo, por pueblo e ítem** (antes por vecino: las cosechas las compran 4–7 puestos y no limitaba). El aviso dice el producto. Falta: sumar los perfiles «pescador» y «artesano» a `bot-economia.js`, con C5 y C6.
6. **Locutor:**
   - un **reloj que solo corre jugando**: en la tienda, la libreta o los menús los diferidos no envejecen, y el resumen ya no sale al cerrar la libreta;
   - los repetidos se funden también en los diferidos;
   - un diferido con 3 min de juego va al historial.
   - Probado: 3 s en la tienda no movieron el reloj.
7. **`meta.encargos2` dañado o importado** ya no rompe el tic de 1 s: `E2` normaliza la forma y descarta los mandados sin destino. Un pago importado se topa a 100 u. El hash del día pasa a `dia × 128 + k`, sin choques entre días vecinos.
8. **El encargo grande** se fija con la fama del comienzo del día (`famaDia`): la lista ya no cambia a mitad del día. Un tablón fabricado tiene que estar a **60 bloques o menos** del centro del pueblo (antes 120).

## 12.5.0 — 2026-11-12 · Gráficos: medir y regular
Las entregas 1, 2 y la nitidez de `docs/revisiones/PLAN_GRAFICOS_2.md` (§1, §3 y la «Fase 1» de `PLAN_GRAFICOS.md`). No agrega ids ni toca el guardado: son ajustes del navegador.
- **El medidor** (`src/medidor.js`, nuevo):
  - el tiempo real de **GPU** de cada cuadro con `EXT_disjoint_timer_query_webgl2` (promedio de 60; «gpu —» donde el navegador no la tiene);
  - **llamadas, triángulos y texturas** de las tres pasadas juntas (`renderer.info.autoReset = false`);
  - el panel ahora dice «fps · cpu · gpu · llamadas · triángulos · tex · calidad».
  - **`window.nanoblocks.costo(clave)`** dibuja N cuadros quietos sin y con una bandera (calentando antes y alternando) y espera a la GPU con `gl.finish()`. Ojo: con el panel oculto el navegador frena el dibujo y los números salen ruidosos; hay que usarlo con el panel a la vista.
  - Probado: el panel marcó «gpu 20.0 ms · 121 llamadas · 321 k triángulos».
- **El regulador automático** (`src/regulador.js`, nuevo; reemplaza el aviso de la v12.2.1):
  - **cómo mide:** el intervalo real entre cuadros en ventanas de 5 s (mediana), contra una meta que es el refresco más rápido visto (tope 60);
  - **cuándo baja:** dos ventanas por debajo del 70 % de la meta. Primero la **resolución** (85 % y 70 %, multiplicando a la del jugador), después el **nivel** (Ultra → Alto → Medio; **nunca a Bajo**);
  - **cuándo sube:** con 60 s por encima del 95 %, deshaciendo solo lo que bajó él;
  - un cambio por minuto como mucho, y un aviso por bajada;
  - no actúa en pausa, cargando, con la pestaña oculta ni en modo foto;
  - casilla **«Calidad automática»** (`settings.calidadAuto`, encendida por defecto). Tocar a mano la calidad o la resolución hace que olvide lo que había bajado, pero no lo apaga.
  - Probado con intervalos simulados: bajó 85 % → 70 % → Alto → Medio, volvió a subir un escalón por minuto y en pausa no se movió.
  - Se arregló un error al probarlo: la meta salía de los cuadros recientes y, cuando todo iba lento, la meta bajaba y el regulador subía de nuevo.
- **Nitidez de texturas** (bandera nueva `nitidez`, de Medio en adelante; Bajo queda igual que siempre):
  - **el atlas** pone cada baldosa en una celda con 4 px de margen que la repiten «dando la vuelta», para que los mipmaps no mezclen vecinas (de 256 a 384 de ancho);
  - **el filtrado:** de cerca sigue el píxel (`mag Nearest`), y de lejos `NearestMipmapLinear` con anisotropía de 4 en Medio, 8 en Alto y 16 en Ultra;
  - en «Opciones de video», la casilla «Texturas nítidas de lejos».
  - Probado: captura de un lago con bosque de lejos, sin costuras entre baldosas y con el pasto de cerca igual de nítido.

## 12.4.13 — 2026-11-12 · Décima revisión
Los puntos 1, 2, 3, 4, 6, 8 y 9 de `docs/revisiones/REVISION_v12.4.7-v12.4.9.md`, con la remedición de los jefes.
- **1 y 9. De qué jefe es un golpe** (`game.js jefeDelGolpe`, antes `presionJefe`):
  - primero por el **origen**: si el golpe sale del cuerpo de un jefe vivo, es de él;
  - sin origen (rayos, veneno), por el nombre en el aviso, sin mayúsculas, quitando el apodo después de la coma y con **alias** en `jefes-balance.js` (`Cornudo`, `Arpía`, `Cascabel`, `cocodrilo`);
  - mira **todos** los jefes a menos de 40 bloques (antes solo el primero) y no los que están muriendo.
  - El drenaje de la Llorona se sigue multiplicando: es su ataque y se calibró así.
  - Medido: la embestida de Don Cornudo, la vuelta del cocodrilo y el rayo de la Arpía ya reciben su multiplicador. Don Cornudo pasó de p 1 a **0.6** con el perfil promedio (el objetivo era 0.83).
- **2. Murciélago Rey:** la fase 2 empieza a la mitad de su vida (`kind.health × 0.5`; antes con 55 fijo, que con la vida nueva era el 26 %). Con la fase 2 la pelea se alargó a 30 s: la vida baja de 215 a **130** y queda en 18 s.
- **3. La armadura y la Noche Larga** (se midió con el bot):
  - **Las dos fórmulas:** con la fórmula nueva para todo, la Noche Larga se perdía 4 de 4. Separé las fórmulas: contra los jefes, la nueva (con la que se calibraron); contra todo lo demás, la de siempre.
  - **No era la armadura:** con la fórmula vieja la Noche Larga **siguió** perdiéndose 4 de 4. Lo que mataba era **la Sombra Madre** de la ola final (28.5 de los 34.5 de daño), con ×3 y 855 de vida desde la v12.4.8.
  - **Se queda la separación:** los asedios y las noches se ajustaron con la fórmula vieja, y la nueva solo se midió contra jefes.
  - **La Sombra Madre** pasa a ×1.5 y 600 de vida. Con el perfil promedio, la Noche Larga del día 30 con diamante se gana **2 de 2**. La del día 20 con hierro sigue perdiéndose (0 de 2): es un tramo antes del equipo que pide el diseño (días 25–35, diamante).
  - Asedios (días 5 a 30, con el torpe): ganados todos, con vida mínima de 14 a 18.5.
- **4. Ningún golpe de jefe quita más del 60 % de la vida** de una vez, ya con la armadura contada. Solo lo nota quien llega con menos equipo del que toca: el golpe de El Olvido (24) o el de la Reina Bananera (20.7) sin armadura.
- **6. `BALANCE.md`:** Armadura (las dos fórmulas) y Yunque (+9 % contra jefes) al día.
- **8. Rutinas:** el animal que llegó a menos de 1.3 bloques ya no marca como «mala» la orilla donde está bebiendo.
- **Remedición de jefes** (`JEFES()`, torpe y promedio, 5 por celda): el tramo A y el B quedan parecidos a la v12.4.8.
  - **Tata Sapo:** ×1.
  - **Rey Zopilote:** 2 500 de vida y ×0.85. El torpe tarda unos 105 s; el promedio ganó 5 de 5 con ×0.8 y 0 de 8 con ×1.
  - **Ojo:** los resultados cambian mucho de un mundo de prueba a otro (el Sapo dio 2 de 5 en uno y 0 de 8 en otro). Hace falta medir con 10 por celda en 2 o 3 semillas y **probar el Rey con una persona**.

## 12.4.12 — 2026-11-12 · El tablón del pueblo (C8-A)
De `docs/revisiones/DISENO_CONTENIDO_C5-C8.md` §C8-A y §0.4, más la vuelta del Locutor que había quedado pendiente de la v12.4.10.

**El tablón** (`src/encargos2.js`, nuevo):
- **Bloque 692 `tablon_encargos`.** En los mundos nuevos (`genVersion` **19**) sale en la plaza (al lado de la cancha) o en el parque central. En los mundos viejos se fabrica (`PPP / PPP / P·P` de tablas y palos) y se pone a menos de 120 bloques del centro de un pueblo, que queda como su dueño.
- **Los encargos del día:** 3 a 5, deterministas (`hash3` con la semilla, el día y el pueblo: los mismos aunque se recargue). Lo que se pide sale de **quién vive en el pueblo**: la pulpería y la feria piden cosechas, la soda pescado y carne, la panadera pan, huevos y leche, el herrero hierro y carbón, los vecinos maíz, frijoles, leña y huevos.
- **Tres tipos:**
  - **entrega**;
  - **comida**: casado, gallo pinto, tamal, empanada o pescado frito;
  - **mandado**: un recado a otro pueblo a 150–600 bloques, que se cobra al hablarle a cualquier vecino de allá.
  - Los de **oficio, pesca, obra y volcán** llegan con C5–C7.
- **Cómo se usa:** clic derecho pasa de un encargo a otro y Mayús + clic acepta o entrega. Se llevan hasta 5 a la vez.
- **El pago** es la fórmula del diseño: `⌈ valorRef × n × (1.25 + 0.15·urgente) ⌉`, donde `valorRef` es lo que cobra la tienda o, si no lo vende, el 80 % de lo que paga.
  - Los urgentes son para el mismo día.
  - Con fama 5 o más en el pueblo, uno de los encargos sale **grande**: triple de materiales y paga 1.4 veces.
  - **Tope de 40 u al día:** de ahí en adelante se paga el 40 %.
- **La fama** (`meta.repPueblo`): +1 por encargo cumplido, +2 si era urgente y a tiempo, −1 si un urgente se vence. Los comunes vencen sin castigo, a los 2 días.
- **El Libro de encargos** (ítem **1187**, el primero del rango `EXT_ITEM`) se recibe con el primer encargo; con clic derecho dice qué se lleva.
- **Logros:** «Lo que pide el pueblo», «Encargo del tablón» y «De confianza en el pueblo» (10 encargos).
- **Probado:**
  - el tablón aparece en la plaza de un pueblo nuevo;
  - la lista es la misma al recalcular;
  - aceptar y entregar paga 5 u (₡2 500), sube la fama +1 y da el libro;
  - un urgente vencido baja la fama 1;
  - el mandado se cobra en el pueblo de destino.

**El cupo del comprador** (§0.4): cada puesto (oficio y pueblo) paga completo hasta 30 u al día y el 40 % de ahí en adelante, con un aviso una sola vez y la tienda redibujada. Probado vendiendo mazorca al pulpero: 4 u por tanda de 5 hasta llenar, y después 1.5.

**La vuelta del Locutor** (§6 de `TEXTOS_v12.md`):
- **Lo que se midió:** se contaron los avisos de un sábado de feria en el pueblo, un aguacero de invierno con fogata y la ruta de la playa al páramo. Después del amanecer van a 6–8 por minuto (los de ambiente ya se filtraban bien) y el frío y el calor no se alternaron.
- **El problema era el amanecer:** caen **10 a 15 avisos en el mismo instante** (el día, la región, la feria, el bingo, el nido, la cama, el globo, los retos…), y todo lo que no cabía en la cola de 4 **se botaba**.
- **El arreglo:**
  - lo importante que no cabe espera en una fila de **diferidos** y sale cuando hay turno;
  - si al minuto quedan dos o más, se juntan en un solo aviso: «📋 Hoy hay N avisos más: están en la libreta («Lo que se dijo»)»;
  - con la misma prioridad, ahora sale primero el que llegó primero.
- **Probado en tiempo real:** con 14 avisos juntos salieron en orden del 1 al 6, y el resto en el resumen.

**Versión mínima 12.4.12** (`MIN_IDS = { bloque: 692, item: 1187 }`).

## 12.4.11 — 2026-11-12 · EXT_ITEM
Lo que habilita C5–C8 (`docs/revisiones/DISENO_CONTENIDO_C5-C8.md` §0.1 y §0.4).
- **Rango nuevo de ítems `1100–1299`** (`blocks.js`: `EXT_ITEM = 1100`, `MAX_ITEM = 1300`), arriba de `MAX_BLOCK`:
  - `isBlockId` da falso y `getDef` lo toma como ítem;
  - las tablas de tamaño fijo (`SOLID`, `OPAQUE`, el mallador) son solo de bloques, así que no hubo que cambiarlas.
- **Prueba nueva `tools/revisar-ext-item.mjs`:** registra un ítem 1100 de prueba y comprueba `getDef`, la pila, el inventario (apilar, sacar, guardar y cargar) y la importación (en el inventario y en un cofre; un id del rango que no existe se descarta).
- **En el juego:** un cofre con el ítem 1100 se guarda y se carga bien. Desde la consola no se puede registrar el ítem en el módulo del juego (sale otra copia), así que la prueba con `/dar` y el inventario queda para el primer ítem real de C5.
- **Los bloques que reserva el diseño se corren 2 lugares** (663 y 664 son los postigos girados de la v12.4.9): C5 queda en `665–671` y `697`, C6 en `672–684`, C7 en `685–691` y C8 en `692–696`. El registro y los pedidos de arte del documento están actualizados.

## 12.4.10 — 2026-11-12 · Textos más cortos
De `docs/revisiones/TEXTOS_v12.md`: la tabla 1 completa y los cambios de la tabla 2, en el orden de su §6.
- **Feria:** un solo aviso el sábado («sus cosechas valen más con el feriante»), sin el «25 %» escrito a mano y sin el consejo repetido. El del producto mejor pagado se acorta.
- **El concurso**, en una sola moneda: «dos unidades (mil colones)», «20 unidades y el listón» y «su cosecha vuelve a su bolsa».
- **Molienda:** «Venda su caña en el pueblo: 3 por una unidad».
- **Fogata y fogón:**
  - una sola fórmula: «Échele leña y préndala con el mechero»;
  - sale el consejo de las brasas, que repetía al aviso;
  - los mensajes de «lleno» y de «se acabó la leña», más cortos.
- **Logros:** «Fogata que no se apaga», «Seco en pleno aguacero» y «Agüita en las manos» (el nombre cambia; la clave no).
- **La tele:** el chiste de las calles pasa a uno sin sujeto («inauguran un puente… y ya lo están remendando»).
- **La carreta:** «la de Sarchí» en la lista de pinturas (es un ítem real: Madera pintada de Sarchí) y «¡Carreta recién pintada!».
- **Fps:** «Va lento. Ajustes → Opciones de video → calidad «Bajo» lo alivia» (el botón del menú se llama así).
- **Otros, más cortos o sin repetir:**
  - **la comida:** la que se echa a perder, la que queda como sobras, y sale el consejo de la mesa, que repetía al aviso;
  - **el clima y la ropa:** el zinc, el calor (que se fusiona con el consejo del sombrero), la gotera y la ropa empapada;
  - **el cuerpo:** rodar al caer y la cojera, que pierde el consejo repetido;
  - **la mecedora**, sin «lo deja» (que tiene género);
  - **el zaguate:** «tiene hambre» en vez de «anda de vago», y los avisos de lealtad sin el número técnico;
  - **el cartelito.**
- **Sin probar en el juego:** el sábado de feria, una tarde de aguacero con fogata y la ruta playa→páramo (lo pide la §6 para ver si el Locutor aguanta). El juego arranca sin errores y `revisar-nombres` sigue en 0.

## 12.4.9 — 2026-11-12 · Novena revisión
Los 6 puntos de `docs/revisiones/REVISION_v12.4.4-v12.4.7.md`.
- **Mecedora** (hallazgo 1):
  - el contador va en `meta.mecedora = { n, hasta }`, con `hasta` medido en el reloj del mundo (día + hora; los 5 min son 0.25 de día);
  - al cambiar de mundo se limpian `danoT` y el jefe cercano.
  - Probado: tras 6 curas queda `hasta` guardado y ya no existe `g.mecedora`.
- **Rutinas** (hallazgo 2):
  - un destino solo vale si se llega en línea recta sin nada sólido a la altura de los pies o de la cabeza;
  - si en 6 s el animal no se acerca, ese punto queda marcado como malo por un minuto;
  - las búsquedas se reparten (60 % de probabilidad de esperar al empezar y de 8 a 12 s de caché por animal).
  - Probado: una vaca dentro de un corral no va al techo de afuera y sigue paseando; sin la cerca, llega al techo.
- **Casita de bahareque** (hallazgo 3):
  - va **al final de `TYPES`**, así que cede ante todas las demás estructuras;
  - postigo girado nuevo (bloques **663 y 664**, `postigo_z`): las estructuras lo giran al rotar (solo el postigo, para no cambiar mundos viejos), el plano 578 lo pone a lo largo de cada pared y al ponerlo a mano queda atravesado hacia donde se mira, como el portón;
  - cimiento hasta x = −5, para que la huerta no quede flotando.
  - Probado: en tres casitas con rotaciones 1, 2 y 3, cada postigo va a lo largo de su pared.
- **`import()` con aviso** (hallazgo 5):
  - la libreta se limpia antes de cargar y, si el trozo no llega, avisa «recargue la página»;
  - lo mismo con `/prueba`.
  - Nueva prueba `tools/revisar-trozos.mjs`: lee `dist/assets` y busca ciclos de imports estáticos entre los trozos. Da 13 trozos y ningún ciclo.
- **`MIN_VERSION`** (hallazgo 4):
  - sube a **12.4.9** por los bloques 663 y 664, con `MIN_IDS = { bloque: 664, item: 578 }` al lado;
  - prueba nueva `tools/revisar-version.mjs`: falla si hay un id por encima de lo cubierto y prueba las comparaciones;
  - `leerVersion` acepta «v12.4.7»; lo que no es versión (texto, «12.4.7-beta») da null, y un mundo con una `minVersion` así **no se abre**.
- **Gotera y calor** (punto 6): el capote también tapa la gotera (probado: con capote 0 de mojado, sin capote 4), y con «Movimiento tranquilo» no salen el sudor ni el aire tibio.

## 12.4.8 — 2026-11-12 · Jefes parejos (fases 0 y 1)
De `docs/revisiones/FASE0_CURVA_JEFES.md` y `DISENO_JEFES_Y_FINAL.md`. Las tablas completas están en `docs/BALANCE.md`, sección «Jefes».
- **Fase 0, medida en el juego:**
  - `tools/bot-pelea.js` suma los perfiles `torpe` / `promedio` / `habil`:
    - parry al ver el brillo dorado (sostiene el clic derecho);
    - voltereta ante el brillo rojo y los anillos y carriles del suelo;
    - arco contra lo que vuela.
  - También suma los equipos `jefeHierro` / `jefeDiamante` / `jefeJade`, `JEFES()` con los 23 jefes y las métricas de exposición, fases, parrys y volteretas. `resumen` da `p` y las muertes esperadas.
  - El Capitán de la goleta queda fuera: sin su barco no pelea.
  - **La cancha queda solo con el jefe** (y las crías que nacen a su lado) y con repelente. Antes se colaban las culebras terciopelo y los zancudos, que daban casi la mitad del daño medido. También se limpian los créditos del Rey vencido, que frenaban los duelos siguientes.
  - Lo medido (690 duelos) confirmó la curva del informe: el tramo C, más fácil que el B; Don Cornudo, una pared; el Rey, en 32 s.
- **Fase 1, aplicada:**
  - **Armadura nueva** (`game.js damagePlayer`): pasa de `min(0.88, puntos·0.04 + dureza·0.02)` a `min(0.80, puntos·0.03 + dureza·0.02)`. Ahora el cuero deja pasar el 79 % del daño, el hierro el 52 %, y el diamante y el jade cerca del 20 %.
  - **Los rayos del Rey** pasan con media armadura (`armored = 'media'`).
  - **`src/jefes-balance.js`**, con la vida y el daño de cada jefe:
    - la vida reemplaza a `kind.health`;
    - el daño multiplica en `damagePlayer` los golpes propios del jefe (los que llevan su nombre en el aviso, sin contar las crías ni el ambiente).
  - Se calibró con el bot en dos vueltas: la vida con el TTK objetivo del torpe y el daño con las muertes objetivo del promedio. Las Sombras tienen un TTK objetivo de 15–18 s.
  - **El Rey Zopilote:** vida 900 → **3 100** y daño ×0.65. El torpe tarda unos 110 s y pierde siempre; el promedio gana 7 de 8 en ~88 s.
- **Lo que queda abierto** (anotado en `BALANCE.md`):
  - con 5–8 duelos por celda y un mundo de prueba distinto en cada tanda, los resultados de algunos jefes varían mucho;
  - la Mona y la Jefa de Ventanilla salieron más mortales al bajarles el daño, así que se dejaron en el valor seguro;
  - lo que vuela llega al tope de ×3 de daño: más presión tendría que salir de más ataques;
  - y lo más importante: **una persona tiene que jugar el Rey** y contar las muertes de los primeros 5 intentos.

## 12.4.7 — 2026-11-12 · Casa de bahareque
Lo que quedaba de C4 «Pura vida en la finca» (`docs/revisiones/DISENO_CONTENIDO_C1-C4.md`, C4.2.e a C4.2.h). Con esto C3 y C4 quedan completos, salvo las poses de C2.
- **Plano de bahareque** (ítem **578**, ferretería, **25 unidades**):
  - la casa de bahareque encalado con corredor, techo de palma, postigos en las ventanas y horcones en los postes del corredor (`planos.js` acepta un `poste` y un `logro` por plano);
  - el logro «Casa de bahareque».
  - El ícono usa el plano genérico con una marca crema; queda un pedido en `PEDIDOS_ARTE.md`.
  - Probado: la obra se levanta entera (60 de bahareque, 90 de techo de palma, 6 horcones, 4 postigos y la baranda) y da el logro.
- **Casita de bahareque en el campo:**
  - estructura nueva `casita_bahareque` (`estructuras.js`, `minV: 18`): el zócalo de bahareque y arriba encalado, postigos, corredor con horcones, banca y mecedora, techo de palma que tapa el corredor, cama, mesa con farol y una huerta al lado;
  - en llanuras y bosques, en el mapa con 🏡.
  - Los **mundos nuevos** nacen con `genVersion` **18**; los viejos no cambian.
- **Día de molienda** (`finca2.js`):
  - en verano, los días 20, 21 y 22 de la temporada, el caficultor y la pulpería compran **caña a 3 por una unidad** (el cantinero la paga siempre a 4 por una);
  - la primera vez en el día con el pueblo cerca, un aviso y la marimba;
  - el logro «Día de molienda» al venderla.
  - Probado: los días 19 a 23 y 50, y la fila de la caña en la pulpería.
- **El yugo:** con la carreta y sus bueyes a menos de 4 bloques, el trapiche muele **el doble** (3 s por tapa en vez de 6). Probado: 3 tapas contra 1 en 12 s.
- **El nombre del zaguate:**
  - con **Mayús + clic** del cartelito, un cuadro para escribir el nombre que uno quiera (16 letras, sin HTML; `ui.pedirTexto`);
  - el clic solo sigue pasando por la lista de nombres;
  - los avisos de la lealtad dicen el nombre.
  - Probado: «Firulais <b>» queda «Firulais b» y sale en el aviso de la lealtad.
- **Rutinas** (`finca2.js destinoRutina`, a 1 Hz, sin guardar, en `m.rutina`; `entities.js` camina hacia ahí):
  - **con el aguacero** van bajo techo o bajo las hojas;
  - **en verano** de 0.15 a 0.35 buscan sombra;
  - **al mediodía** de 0.18 a 0.28 van a la orilla a beber, y al llegar bajan la cabeza;
  - las búsquedas se guardan 10 s por animal;
  - no aplica a los mansos, la gente del pueblo, lo que vuela ni lo que nada.
  - Probado: una vaca camina 6 bloques hasta un charco y baja la cabeza, y con lluvia se mete bajo un techo a 8 bloques.
- **`MIN_VERSION` pasa a 12.4.7:** un mundo con el plano 578 rompería un juego anterior.

## 12.4.6 — 2026-11-12 · Goteras y mundos del futuro
Lo que quedaba de C3 «Lluvia y verano», más dos encargos de la orquestadora (`meta.minVersion` y un nombre de la limpieza para publicar).
- **`meta.minVersion`:**
  - `version.js` define `MIN_VERSION`, la versión más vieja del juego que puede abrir lo que esta guarda (hoy **12.4.0**, por los bloques 656–662). Se sube cuando un mundo traiga algo que un juego anterior rompería. `saveWorld` lo escribe en cada guardado.
  - `save.js` suma `compararVersion` (número a número: 12.4.10 > 12.4.9) y `compatibilidad(meta)`.
  - **Bloquea** si `minVersion` es más nueva que el juego o si el `format` pasa de `SAVE_FORMAT`; en ese caso el menú muestra un aviso de un solo botón y no abre el mundo.
  - **Pregunta** («¿Abrirlo igual?») si lo guardó una versión más nueva pero compatible, por ejemplo la otra laptop un poco más adelantada.
  - Al importar, un archivo de una versión futura se rechaza con el mismo mensaje.
  - `preguntar()` acepta `no: null` para un aviso con un solo botón.
  - Probado: las cuatro combinaciones, un mundo «de la 99.0.0» en la lista del menú (sale el aviso, el mundo no se abre) y la importación rechazada. Ojo: los juegos anteriores a esta versión no miran `minVersion`; la protección vale de aquí en adelante.
- **Nombre real fuera** (`LIMPIEZA_PARA_PUBLICAR.md` §6): el portero del estadio llevaba el nombre de un futbolista de verdad; ahora es «Chalo».
- **Goteras** (`supervivencia3.js tickMojado`): con lluvia, si justo arriba no hay techo pero las cuatro columnas de al lado sí lo tienen (un hueco en el techo), es una gotera: moja **1 por segundo** (bajo la lluvia son 7) y se ven caer las gotas desde el hueco; la primera vez, un aviso. Probado: 5 s bajo el hueco dan 5 de mojado y, al taparlo, se seca.
- **Cultivos por temporada** (`game.js`): en invierno crecen un **25 % más**; en verano un **15 % menos**, salvo con agua cerca (la misma `hydrated` del riego).
- **Barril de lluvia** (`monte.js`): en invierno se llena **el doble** de rápido; en verano se le va **1 de agua por día**. Probado: 3 → 2 → 2 (el mismo día) → 1.
- **Calor:** con el efecto `calor`, correr gasta un 25 % más de comida, del pelo caen gotitas de sudor y del suelo al sol sube aire tibio (partículas, una vez por segundo).

## 12.4.5 — 2026-11-12 · Más liviano
Lo pidió la orquestadora: que el archivo principal gane margen de una vez (estaba en 699.93 kB y el límite es 700), con la meta de bajar de 500.
- **Antes y después:** index de 699.93 kB a **478.61 kB** (gzip, de 255 a 173 kB). three ya iba aparte (521.90 kB).
- **Dos trozos que se calculan solos** (`vite.config.js`, `enBase`), con el grafo de módulos del build:
  - **`base`** (415 kB): todo módulo de `src/` cuyo cierre de imports estáticos no toca el núcleo (`main`, `game` ni `ui`) ni un trozo fijo.
  - **`arte`** (304 kB): la misma regla, pero solo con modelos, texturas y bloques.
  - Por construcción ninguno importa al index ni a otro trozo, así que no hay ciclos (los trozos «vida» y «datos» que probé a mano en la v12.4.3 sí los daban). Un módulo nuevo cae solo donde corresponde.
  - Las listas fijas (`mundo`, `graficos`, `criaturas`, `textos`, `trama`) pasan a una tabla `TROZOS`.
- **Se cargan al usarlos** (`import()`):
  - la libreta, la primera vez que se abre (si mientras llega uno cambia de pestaña o la cierra, no se pinta una pestaña vieja);
  - los comandos `/prueba`.
  - `final.js`, el bestiario y el cuaderno ya salieron del index por la regla de `base`, así que no hacía falta pasarlos a dinámicos; el recetario y la tienda son parte de `ui.js`.
- **Probado en el build de verdad** (`vite preview`):
  - el mundo arranca con los 9 trozos;
  - las 10 pestañas de la libreta, el inventario con las 224 recetas, el mapa, la tienda de la feria y `/prueba` (9 líneas) andan;
  - ningún error en la consola y ningún pedido fallido.
  - En dev, la libreta y `/prueba` también funcionan.

## 12.4.4 — 2026-11-12 · Octava revisión
Los 7 puntos de `docs/revisiones/REVISION_v12.2.1-v12.4.x.md`, más una fuga del horizonte que salió al probarlos.
- **Mecedora** (hallazgo 1):
  - el contador va en `g.mecedora` y no en la sentada: 6 curaciones de 2 y después 5 minutos sin curar, aunque uno se levante y se vuelva a sentar;
  - recién golpeado (8 s) no cura, ni la mecedora ni el descanso de la silla.
  - Probado: 6 curaciones, enfriamiento de 295 s y, al volver a sentarse, sigue sin curar.
- **Tirón cada 20 s sentado** (hallazgo 2): `S.t` es solo el deslizamiento y el descanso lleva su contador (`S.rest`). Probado: 80 s sentado sin moverse ni un poquito.
- **Feria** (hallazgo 3): el tramo nunca paga más del 90 % de lo que él mismo cobra por lo mismo (la mazorca se podía revender con ganancia el 43 % de los sábados). Si la feria se acaba con la tienda abierta, el precio se recalcula al hacer clic.
- **Siesta** (hallazgo 4): el reloj nunca va para atrás (a las 0.55 quedaba en 0.48); el cansancio de mediodía se mira con la hora de antes de dormir, y la cura de 6 es una vez por día (`meta.siestaCura`). Probado en la tarde, repetida y a mediodía.
- **Horizonte apagado** (hallazgo 5): `setDistance(0)` vacía `cola`, `want` y `pending`, y `onTile` no vuelve a pedir nada.
- **Fuga del horizonte** (encontrada aquí, viene de la v12.4.1): `onTile` llamaba a `despachar()` con la baldosa ya fuera de `pending` y todavía no en `tiles`, así que cada una se pedía y se armaba **dos veces**. La segunda pisaba a la primera en el `Map` y esa malla quedaba en el grupo, sin liberar, para siempre: el doble de memoria de video, que crecía cada vez que se movía el horizonte. Ahora se despacha después de anotarla y una clave repetida reemplaza la malla vieja. Probado: 145 baldosas, 145 mallas, y 0 al apagarlo.
- **Cobija:** calienta el cuerpo de una vez (`g.cuerpo` sube por lo menos a −20, antes el escalofrío volvía unos 10 s) y no gasta usos si uno ya anda abrigado.
- **Aguacero de las dos:** no sale durante el huracán, la sequía ni el tsunami. Las novedades avisan que la temporada dura 30 días.
- **Guarapo podrido:** devuelve el balde (todo lo que se toma y tiene `returns`). Al reaparecer, la temperatura del cuerpo vuelve a la normal.
- **Extras de la revisión:**
  - `juntar()` guarda la fecha sin redondear y la edad se cuenta en días enteros;
  - `rollPulsado`, que no se leía, sale del código.
- **Queda para después:** el `meta.minVersion`, para que un juego viejo no abra un mundo más nuevo; lo de los cafetos en un invierno de 30 días (es una decisión de producto) y el capote con mejoras del yunque.

## 12.4.3 — 2026-11-12 · Seguridad
Viene de `docs/revisiones/AUDITORIA_SEGURIDAD_PREVIA.md`, antes de publicar. No toca el historial de git ni la marca: eso va en la tanda «Antes de publicar», con lo que ya decidió nanoyackson.
- **C3, el diario:** el icono de cada entrada ahora se escapa (`diario.js`). Un mundo importado podía traer `<img onerror=…>` y ejecutar JavaScript al abrir la libreta.
  - Probado en el juego: se importó un mundo así, se abrió el diario y el `onerror` sale como texto, sin crear ninguna imagen ni ejecutar nada.
  - Las filas «por confirmar» de la tabla de sumideros: el torneo vive en `g` (no en `meta`), así que no se puede reemplazar al importar; el epílogo sí interpola textos de `meta`, y quedan cubiertos por C4.
- **C4, `validarMundo()`** (`src/importar.js`, nuevo, que se carga solo al importar):
  - tope de 64 MB antes de leer el archivo;
  - fuera `__proto__`, `constructor` y `prototype`;
  - todos los textos de `meta`, sin `<`, `>` ni caracteres de control y con tope de largo;
  - números finitos y acotados, y anidado de 14 niveles como mucho;
  - con tipo y rango: la posición y el estado del jugador, el día, la semilla y la aparición;
  - el inventario y la billetera: ids que existen, cantidades hasta la pila y la fecha de la comida;
  - los cambios de bloques: claves `cx,cz`, índices dentro del chunk e ids de bloque válidos;
  - las entidades de bloque: cofres con pilas válidas y el rótulo de 32 como mucho.
  - Prueba nueva, `tools/revisar-importar.mjs` (19 casos: `__proto__`, `constructor`, HTML, `1e300`, `NaN`, ids negativos y que no existen, cantidades de `1e9`, claves raras): todo bien.
  - En el juego, exportar e importar un mundo de verdad conserva los bloques, el inventario y la fecha de la comida.
- **A1, subcarpeta:** las rutas `/ui/jefes/…` del JS pasan a relativas (`./ui/…`). Probado con `vite build --base /NanoBlocks/`: el CSS sale con `/NanoBlocks/ui/…` y el JS pide `./ui/jefes/…`, relativo a la página.
- **A2, CSP:**
  - `index.html` lleva `Content-Security-Policy` en un `<meta>`: todo del mismo sitio; imágenes y sonidos también de `data:`/`blob:`; el worker del mismo sitio; nada de scripts en línea ni `eval`; `'unsafe-inline'` solo en estilos.
  - Los `onerror="this.remove()"` en línea de los retratos del final pasan a un único escuchador en `main.js`.
  - Probado: el juego corre con la CSP y sin ninguna violación (el horizonte, los íconos y los sonidos andan).
- **A3, licencias** (las decidió nanoyackson):
  - `LICENSE` (MIT) para el código y `LICENSE-ARTE` (CC BY 4.0) para el arte y los textos propios;
  - `THIRD_PARTY.md` suma three.js (MIT; su aviso de licencia se conserva en el código compilado, comprobado) y las herramientas de desarrollo, y dice qué arte se hizo con IA.
- El trozo principal del build había vuelto a pasar los 700 kB. Con `importar.js` cargado aparte queda en 699 kB, justo bajo el límite: el próximo módulo grande hay que ponerlo en su propio trozo.

## 12.4.2 — 2026-11-12 · Pura vida en la finca, parte 2 (C4)
El código nuevo está en `src/finca2.js`; la carreta, en `carreta.js`.
- **Carreta:**
  - con la **brocha** en la mano y madera pintada en el inventario, clic derecho pinta la caja (de Sarchí roja, celeste, verde, amarilla o rosada); gasta una madera y un uso de la brocha;
  - **Mayús + clic derecho** abre la carga de 9 casillas;
  - el color y la carga se guardan con la carreta.
- **El zaguate con lealtad** (de 1 a 3, en los datos del perro):
  - sube un punto por día si comió en los últimos 2 días; con 3 días sin comer, baja;
  - ahora come de todo (antes solo carne);
  - con lealtad 2 trae cosas el doble de seguido; con lealtad 3 muerde +3;
  - el **collar de cuero** (576: palo, cuero, palo) le da +4 de vida;
  - probado: lealtad 1 → 2 → 3; 4 días sin comer → 2. Logro «Zaguate de toda la vida».
- **Concurso de la mejor cosecha:**
  - el sábado de feria, **Mayús + clic derecho al feriante** con 8 o más de una cosecha en la mano; la inscripción vale ₡1 000;
  - si le gana a los rivales de la semana, recibe 20 unidades (₡10 000) y el **listón de la feria** (577), y entrega las 8;
  - uno por sábado;
  - probado con 64 de maíz: −₡1 000 + ₡10 000, el listón y −8 de maíz.
- **Las rutinas de los animales:** de noche (de 0.55 a 0.95), los animales pacíficos a menos de 40 bloques se echan a dormir con su «Zz» y no se mueven. Se despiertan si uno se arrima a menos de 3 o les pegan. Logro «El pueblo duerme».
- **Texturas de la casa tradicional** (de GPT, `assets-src/chatgpt/tex-*.png`):
  - reducidas a 16×16 en `src/texturas_arte.js`, con el contraste realzado para que el detalle no se pierda;
  - el bahareque lleva encima la caña asomando, y el encalado va sin el zócalo, que se repetía al apilar;
  - el horcón tiene su propio lado de corteza;
  - muestra en `docs/capturas/v12.4.2/`.
- Los íconos del collar y del listón son del lote 3.
- **Queda pendiente de C4:**
  - beber al mediodía, la sombra de verano y refugiarse del aguacero en las rutinas;
  - el plano y la casita de bahareque en los pueblos, la molienda, el yugo con bueyes y el nombre del zaguate.

## 12.4.1 — 2026-11-12 · Séptima revisión
Los arreglos salen de `docs/revisiones/REVISION_v12.0.0-v12.2.1.md`. Cada uno se confirmó en el juego.
1. **La cojera no dejaba de correr**: `tickCuerpo2` apagaba `sprinting` después de que `Player.update` ya lo había usado. Ahora la cojera está en la misma condición que la picada de bala (`player.js`). Probado con las mismas teclas: con cojera no corre, sin cojera sí.
2. **La fecha de la comida al juntar pilas**:
   - `juntar(t, n, dia, hoy)` (`inventory.js`) deja el promedio ponderado por cantidad; lo que no trae fecha cuenta como de hoy;
   - la usan `Inventory.add` y las 12 uniones de `ui.js`: arrastrar, Mayús+clic, el reparto, depositar, ordenar, el doble clic y el clic derecho;
   - probado: 4 carnes del día 3 más 1 fresca del día 5 dan el día 3 (3.4), y ya no toma la fecha vieja entera.
3. **El horizonte**:
   - en Bajo llega como mucho a 1 536 (`alcance()`), porque «muy lejos» eran 2 401 mallas; la niebla y la segunda pasada usan ese alcance;
   - cada baldosa que llega pide la siguiente (`despachar()`, hasta 5 en vuelo; antes 3, cada 0.2 s), y probado: 5 en vuelo;
   - apagarlo libera la memoria de la GPU (antes solo lo ocultaba).
4. **Las fogatas lejanas**: si el chunk no está cargado, `tickLena` ya no borra su registro (`getBlock` daba aire). Probado con una fogata a 80 bloques, fuera de lo cargado: sigue registrada.
5. **Rodar al caer**:
   - el intento en el aire (`rollIntento`) solo cuenta si al aterrizar la voltereta de verdad sale, porque en enfriamiento o sin aire no sale;
   - la voltereta se pide en el mismo cuadro (`g.intentarRodar`), no con un `import()` que llegaba tarde;
   - la caída pendiente, los tragos y los intentos se limpian al cambiar de mundo;
   - probado sobre piedra con una caída de 15: tocó rodar con aire −4.4; sin aire −11 y quebrada; sin rodar −11.
- **Extra:**
  - la clave de caché de los shaders lleva el nombre del material (bloques, agua, lejos, nubes);
  - el aviso de fps espera 20 s con el mundo listo;
  - la física reusa el objeto de la posición segura (antes uno nuevo por cuerpo y cuadro);
  - el rescate a la superficie salta las copas de los árboles y parte de `HEIGHT`;
  - hay pescado salado también del guapote;
  - la carne salada rinde 2 por 2 (antes 3 por 2: daba más comida que la asada y no se pudría).

## 12.4.0 — 2026-11-12 · Pura vida en la finca, parte 1 (C4)
Sale de `docs/revisiones/DISENO_CONTENIDO_C1-C4.md`. La segunda parte va en la v12.4.1: la carreta pintada con carga, el zaguate con lealtad, el concurso de la feria y las rutinas de los animales.
- **Trapiche:**
  - con un balde vacío en la mano, clic derecho saca **guarapo** (574) de 3 cañas; quita 4 de sed y dura un día;
  - en el fogón, el guarapo da 2 de **miel de caña** (575) y devuelve el balde;
  - nada de esto se vende. Logro «Guarapo de la casa».
- **Café en verano:** en invierno el cafeto se queda en flor y no da cereza. Lo que ya estaba maduro se puede coger igual.
- **Mecedora** (655): se sienta como en la silla y se mece (el cuerpo y un poquito la cámara, menos con «Movimiento tranquilo»). Recupera un corazón cada 12 s, hasta 6 por sentada. Probado: de 8 a 20 de vida. Logro «Mecedora de abuela».
- **Banca de corredor** (661): se sienta como la silla.
- **La siesta de mediodía** en la hamaca, entre las 12 y las 2, quita el cansancio una vez al día; ya curaba 6.
- **Feria del sábado:** de 8 a 5, el feriante paga las 7 cosechas un 25 % más. Esa mañana sale el aviso «hay feria del agricultor».
- **Construcción tradicional:**
  - pared de bahareque (656: barro ×2 + caña brava ×2 → 4) y bahareque encalado (657: con calcita);
  - horcón (658: 3 troncos → 2) y techo de palma (659: 6 de caña brava → 6);
  - postigo (660 / 662, que abre y cierra: 4 palos → 2).
- **Arte:** los íconos de los 9 ítems y bloques nuevos son del lote 3. Las texturas de bloque son pixel art provisional, y su pedido quedó anotado en `PEDIDOS_ARTE.md`.
- **Queda para la v12.4.1 o después:** el plano y la casita de bahareque en los pueblos, la molienda de verano, el yugo con bueyes y el +20 % de la cajuela los sábados.

## 12.3.0 — 2026-11-12 · Lluvia y verano (C3)
Sale de `docs/revisiones/DISENO_CONTENIDO_C1-C4.md`. El código nuevo está en `src/temporadas.js`. Nada nuevo se guarda: la temporada sale de `g.day`.
- **Temporadas de 30 días** (antes, 7). Los últimos 4 días de cada una son de transición. En un mundo viejo cambia la estación del día en que se actualiza, con el aviso de siempre. Pasar un invierno completo da logro.
- **El aguacero de las dos:**
  - en invierno, el 80 % de los días (40 % en la transición) llueve entre la 1:30 y las 3 de la tarde, unos 2 minutos;
  - no cae durante el asedio, la Noche Larga, el torneo ni el bingo;
  - verlo bajo un techo de zinc da el logro «Aguacero de las dos».
- **La temperatura del cuerpo** (`g.cuerpo`, cada segundo):
  - suman y restan el bioma, la noche, la temporada, el sol, lo mojado, una fogata cerca, la cobija y el metal de la armadura (calienta con calor y enfría con frío);
  - con −50 o menos, escalofrío; con +60 o más, el efecto nuevo **🥵 Calor**, que sube la sed ×1.4;
  - en Tranquilo los umbrales se corren 15;
  - medido: la costa al sol de verano da 61 (calor) y con sombrero de paja 46; el páramo de noche, −45.
- **Ropa nueva**, con el dibujo del lote 3:
  - **Capote de hule** (571): el aguacero no lo moja, pero ocupa el puesto de la pechera y no defiende. Se compra en la pulpería y la ferretería por 30 unidades (₡15 000).
  - **Sombrero de paja** (572): quita el sol fuerte. Se hace con caña brava (` C /CCC`).
  - **Cobija de lana** (573): clic derecho, 4 minutos de abrigo, 5 usos. Se hace con 6 de lana.
- **La lluvia sobre el zinc:** bajo zinc o lámina, el aguacero de afuera se oye a la mitad y repica en la lámina (6–10 golpecitos por segundo con los sonidos CC0 que ya estaban).
- **La tele** a veces da el pronóstico de verdad según la temporada.
- 3 logros, 2 consejos (calor y zinc) y un tema nuevo en la ayuda.
- **Pendiente de C2 hecho:** la cojera se ve. La pierna derecha casi no se dobla y el cuerpo se hunde al pisar con ella.
- **Queda para otra vuelta:**
  - las goteras;
  - los cultivos +25 % en invierno y −15 % en verano;
  - el barril de lluvia;
  - el sudor del avatar;
  - el aire extra al correr con calor;
  - las poses de acostarse y recoger.

## 12.2.1 — 2026-11-12 · Medio de fábrica
nanoyackson aprobó el look de la hora dorada y decidió que la calidad por defecto sea **Medio**.
- **Por defecto:** `DEFAULT_SETTINGS.calidad = 'medio'` (antes era `'bajo'`).
- **Migración** (`settingsVersion` 3, una sola vez): el «Bajo» guardado era el valor de fábrica y no una elección, así que pasa a Medio. Desde ahora, cambiar la calidad o un efecto a mano marca `calidadElegida` y eso se respeta.
  - Probado: un «Bajo» de fábrica pasa a Medio; un «Bajo» elegido a mano se queda; ya migrado no se vuelve a tocar.
- **Aviso de fps:** mientras no exista el regulador automático (v12.4), si en Medio o más el juego va a menos de 40 fps por 10 s seguidos, el locutor sugiere «Bajo» en Opciones de video, una sola vez. Solo cuenta jugando y con la pestaña a la vista.
- La nota de Medio en Opciones de video dice que es la de fábrica.
- El «sin desenfoque» de Bajo se aplica desde que arranca el juego.
- `tools/atardecer.js` devuelve la calidad que había al limpiar (antes la dejaba en «bajo» en los ajustes guardados).

## 12.2.0 — 2026-11-12 · El cuerpo que siente (C2)
Sale de `docs/revisiones/DISENO_CONTENIDO_C1-C4.md`. Todo está en `src/cuerpo.js` y no hay ítems nuevos: todo es sensación. Con «Movimiento tranquilo» solo quedan el sonido y el texto. Nada nuevo se guarda.
- **Rodar al aterrizar:**
  - con una caída de 3 o más de daño, el golpe espera 0.25 s;
  - si rueda en esa ventana, o si tocó rodar justo antes de llegar al suelo, el daño es ×0.4 y la pierna no se quiebra;
  - si se muere o lo teletransportan mientras espera, el golpe se aplica entero;
  - el golpe entra aunque la voltereta dé unos instantes de invulnerabilidad;
  - probado sobre piedra con una caída de 15: sin rodar −11 y la pierna quebrada; rodando −4.4 y sana. Logro «Cayó como gato de potrero».
- **Señales del cuerpo:**
  - con hambre (comida 6 o menos) suenan las tripas cada 20–40 s, con el sonido sintético `rumble`, bajito;
  - con sed (agua menos de 6) la mano tiembla y los párpados pesan;
  - con frío o sueño sale vaho delante de la cara, y con sueño, un «🥱 Qué sueño…» por bajón.
- **Beber con las manos:** del río, con la mano vacía, son tres tragos de 0.4 s con la cámara agachada. Un golpe lo corta. Logro «Agüita de las manos».
- **Sentarse:** la silla ya no teletransporta: se llega en 0.35 s con una curva suave, y el cuerpo toma la pose de sentado. **Agacharse** baja suave, sin golpe.
- **Despertar con sobresalto:** si le pegan acostado o durmiendo, se levanta de un brinco con «😮 ¡Qué susto!». Esa noche no pasa y no da buen descanso.
- **Cojera:** al curar la pierna quebrada con la tablilla quedan 3 minutos de cojera, sin poder correr. **El botiquín ya no arregla el hueso**: solo la tablilla (👁 decisión de balance).
- 3 consejos nuevos (rodar, tripas, cojera) y 2 logros.
- Queda para otra vuelta: el cuerpo acostado en horizontal en tercera persona, el vaivén lento de la hamaca al dormir, la inclinación al recoger y la cojera animada en las piernas.

## 12.1.3 — 2026-11-12 · Sin parpadeo y sin ascensor (urgente, lo vio nanoyackson jugando)
Las causas venían de `docs/revisiones/DIAGNOSTICO_PARPADEO_Y_VIENTO.md`. Antes de arreglar, las confirmé en el juego y en Node.
- **El parpadeo del inventario.**
  - Cada clic vaciaba y volvía a crear todas las casillas y el recetario entero: unas 1 000 `<img>` nuevas, que el navegador decodificaba otra vez. Por un cuadro, todos los íconos quedaban en blanco.
  - Ahora `fillSlot` guarda una firma de lo que muestra y, si no cambió, no toca la casilla. Si cambió, reusa la misma `<img>` y solo le cambia el `src` cuando cambia el ítem.
  - El recetario se rehace solo si cambia lo que se ve: qué recetas salen, su ✓/✗ y si alcanza cada ingrediente. Las cantidades se cuentan una sola vez, no por cada ingrediente.
  - Los clics del recetario cuentan lo que hay en el momento (`tengo()`).
  - `contain: layout style` en las casillas y la lista, para que una casilla que cambia no recalcule el panel entero.
  - Medido en el juego, 8–10 clics por pantalla: **0 imágenes nuevas por clic**. Mediana de 2.5–3.6 ms en inventario y mesa (antes ~35 ms); 0.5–0.7 ms en cofre y baúl. Fue con la pestaña de fondo, que el navegador frena. Solo cuando de verdad cambia una receta se rehace la lista (~10–34 ms).
- **La ráfaga que lo sacó 100 bloques arriba.**
  - **La causa:** el viento papagayo escribía la posición con una prueba de un solo punto, y la caja quedaba unos centímetros dentro de una pared. Después, al caer, la física subía los pies al tope de cualquier bloque que tocara la caja, aunque fuera de costado: el «ascensor».
  - Reproducido con la física vieja: metido 4 cm de costado en una pared de 120 bloques, en 1 segundo sube a **y = 121**.
  - **`physics.js`:** en vertical, un bloque que la caja solo toca de costado ya no cuenta como suelo ni como techo.
  - **`desatascar()`** al empezar cada paso: si la caja quedó dentro de un bloque, sale al hueco libre más cercano (a los lados hasta 1 bloque, arriba hasta 2) o vuelve a la última posición segura, siempre sin daño de caída. Esto cubre también todo lo que escribe la posición (globo, avioneta, tirolesa, surf, bravos, modo foto).
  - **El papagayo** ahora empuja por la física (`moveStep`, que prueba toda la caja), con tope de 0.08 por cuadro.
  - **El huracán** tiene tope de 9 m/s.
  - **La salida al llegar** (teletransporte, reaparición): primero el hueco más cercano, después hasta 12 bloques arriba y, si sigue enterrado, la superficie de esa columna. Antes subía hasta 200 por dentro de la roca.
  - Los otros empujones (golpes, embestidas, la arpía, los jefes) ya iban por velocidad con subpasos; con el desatascador tampoco pueden atravesar.
- **`tools/revisar-fisica.mjs`** (nuevo):
  - 2 minutos de viento fuerte en tres direcciones contra una pared alta, en una cueva y en una ladera;
  - el caso del ascensor;
  - un bloque que aparece encima del jugador.
  - Resultado: nunca queda dentro de un bloque y nunca sube más de 0.13 por cuadro. En el juego, caminar, chocar, saltar a un bloque y bajar siguen igual.

## 12.1.2 — 2026-11-12 · Íconos, lote 3
Lote 3 de arte de GPT (`docs/revisiones/PEDIDOS_ARTE_LOTE3.md`), tomado de `assets-src/chatgpt/`.
- **69 íconos nuevos** conectados con el campo `arte`, en `public/sprites/arte/` a 128 px: armas, escudos y armaduras de cada material, minerales y lingotes, cultivos, remedios, la leña, la sal, la despensa, la botica y los trofeos.
  - Al convertirlos se recorta el margen vacío y se centran, para que todos llenen la casilla igual.
  - `ARTE` ahora tiene 112 claves y `tools/revisar-nombres.mjs` comprueba que cada una tenga su PNG y su dueño: 0 problemas.
- **Retratos de los jefes** en la barra de vida: 13, en `public/ui/jefes/` a 96 px (se muestran a 48).
  - Reemplazan a los 7 de antes y suman la arpía, la jefa de ventanilla, el rey murciélago, el señor del Arenal, la Sombra madre y el Olvido.
- **Quedan esperando** 21 dibujos de cosas que todavía no existen en el juego (bahareque, mecedora, guarapo, horcón, techo de palma, la pluma de oro del Rey…). Se conectan cuando se construya su tanda: basta con volver a correr la conversión.
- Probado en el juego: todos los íconos cargan (ningún aviso de «Arte sin cargar») y la barra de vida muestra el retrato.

## 12.1.1 — 2026-11-12 · Hora dorada, de verdad
Corrección pedida tras revisar las capturas de la v12.0.0, donde Medio y Alto se veían lavados y grises y no había hora dorada.
- **El atardecer de verdad es `time 0.48`**: el sol queda a 7° sobre el horizonte (con 0.46 estaba a 14°, todavía alto). `tools/atardecer.js` usa 0.48 y deja escoger la hora: `medir(nivel, time, altura)` y `HORAS`.
- **Gradación por hora** (`atmosGrado`):
  - al atardecer, la luz directa va ámbar/naranja y las sombras azul-violeta, con saturación y contraste un poco arriba;
  - de noche, luz de luna azul;
  - al mediodía casi nada: sale un poquito más rico que Bajo.
  - Hay una uniforme nueva, `uHora` (hora dorada y noche), y `uGrado` pasa a `vec4` para sumar el contraste.
- **Niebla de altura:** solo a lo lejos (desde el 55 % del alcance de la niebla), así lo cercano no se lava. Su color es el del cielo en el horizonte y se dora hacia el sol.
- **Bruma por bioma:** ahora es un tinte que multiplica el color del cielo; nunca un gris.
- **Cielo al ponerse el sol:** degradado naranja en el horizonte → rosa → azul profundo arriba, más encendido del lado del sol.
- **Nubes:** la cara de abajo se enciende en naranja al atardecer.
- **Capturas** en `docs/capturas/v12.1.1/`, misma cámara (semilla 2026, el lago): Bajo, Medio y Alto al atardecer, al mediodía y de noche, más una con «muy lejos» al atardecer.
- Los fps siguen sin poder medirse con el panel del navegador oculto. Lo nuevo es solo cuenta por píxel: las mismas llamadas de dibujo y los mismos triángulos en los tres niveles.

## 12.1.0 — 2026-11-11 · Fogón y despensa (C1)
Viene de `docs/revisiones/DISENO_CONTENIDO_C1-C4.md`. Toda la lógica está en `src/despensa.js`.
- **Leña** (561): 2 troncos de cualquier tipo dan 6 leñas.
- **Fogata con leña:**
  - arranca con 6 leñas y gasta 1 cada 4 minutos;
  - sin leña queda en **brasas** (bloque 653, todavía calienta), a los 3 minutos se **apaga** (654) y la lluvia sin techo la apaga;
  - clic derecho con leña la carga (hasta 8), y apagada pide además un mechero en la barra;
  - una noche entera encendida da logro;
  - las fogatas viejas se registran solas con 6 leñas;
  - en Tranquilo no se gasta.
- **Fogón:** cada tanda gasta 1 leña (en Tranquilo, media). Se carga con clic derecho con leña (Mayús: todas, hasta 16). Al abrirlo dice cuánta leña tiene. Los fogones viejos arrancan con 8.
- **Sal** (562): 4 por 2 unidades en la pulpería, el minisúper y el pescador.
- **Despensa** (563–565): carne ahumada, carne salada y pescado salado, todo en el fogón. No se venden.
- **La comida se echa a perder despacio:**
  - cuánto aguanta buena: crudo 2 días, platos 3, pan 4, fruta 8, ahumada 10, salada 14;
  - después queda pasada, rinde la mitad y a veces cae mal; al final se vuelve **Sobras** (570), que solo sirven para la compostera;
  - la fecha viaja con la pila (`extras`) y los cofres se revisan al abrirlos;
  - en Tranquilo todo dura el doble;
  - la ficha de cada comida dice cuánto le queda.
- **Mesa servida:** un plato comido sentado cerca de la mesa de comedor llena un 15 % más y da 4 minutos de aguante.
- **Botica** (566–569): agua de manzanilla, agua de jengibre, té de hierbabuena y jarabe de sábila, todo en el fogón con un balde de agua.
- 6 logros nuevos, 5 consejos del locutor y 3 temas nuevos en la ayuda.
- Los íconos de los ítems nuevos son provisionales (dibujo procedural): falta pedirlos en `PEDIDOS_ARTE.md`.
- **Sin SAVE_FORMAT:** son campos opcionales y un mundo viejo carga igual.
- Probado en el juego:
  - la fogata pasa a brasas y a apagada; sin mechero no prende y con mechero sí;
  - con lluvia: a los 20 s brasas, a los 60 s apagada;
  - el fogón se vacía, deja de cocinar y se carga;
  - la comida se fecha; la pasada rinde ×0.5; la carne de 5 días se vuelve sobras;
  - la mesa da ×1.15;
  - las infusiones funcionan.
- revisar-recetas (263 recetas, 0 tapadas), revisar-nombres (314 ítems, 0 problemas), revisar-plata y revisar-datos en verde.

## 12.0.1 — 2026-11-11 · Horizonte lejano
Sección 5b de la COLA: fase 1 de `docs/revisiones/PLAN_HORIZONTE.md`, dentro de la pausa de la v12.0.
- **Árbol de baldosas** (`lod.js`), desde «Medio»:
  - raíces de 1 024 bloques que se parten en cuatro mientras quedan cerca (a menos de 1,5 veces su lado), hasta baldosas de 64 junto a los chunks;
  - cada baldosa tiene 32×32 celdas, así que el paso crece con la distancia (2 hasta ~192 bloques, 4 hasta ~384, 8 hasta ~768, 16 hasta ~1 536, 32 más allá);
  - las hojas nunca se pisan.
- **En «Bajo», las baldosas de antes:** 128 bloques, con paso 4, 8 o 16. Comparado contra el código de la v12.0.0 en Node, con la misma posición: las mismas 169 baldosas y +6 % de triángulos (348 900 contra 328 404), que son los faldones.
- **Faldones:** cada baldosa baja 24 bloques en sus cuatro bordes y tapa la rendija entre dos resoluciones.
- **Fundido:** la baldosa que reemplaza a otra entra con un tramado ordenado (Bayer 4×4) en 0,5 s, y la vieja se quita recién cuando lo que la cubre terminó de entrar. Sin huecos ni saltos.
- **La malla se arma en el worker** (`lodmesh.js`, `construirBaldosa`). Antes eran 2–3 ms por baldosa en el hilo principal; ahora solo se crea el `BufferGeometry`.
- **«Horizonte lejano»** (en Opciones de video): Apagado, Cerca (768), Lejos (1 536) o Muy lejos (3 072). Los valores viejos van al nivel más cercano.
- **Muy lejos** dibuja el cielo y el horizonte en una **segunda pasada**, con su propia cámara de near 60. Después borra la profundidad y dibuja lo cercano (camera.far 1 200). Así la profundidad lejana no baila.
- **Bajo tierra** (cueva > 0.6) el horizonte no se dibuja.
- **Niebla:** desde «Medio», más nítido de cerca y desvanecido solo al final (near 0.6·D, far 0.98·D). En Bajo, como antes.
- **Distancia de visión** de 2 a 16 chunks. Desde 10 avisa «pesado: mire los fps».
- **Medido** con `tools/atardecer.js` (`horizonte(calidad, D)`), en la escena del lago:

| Calidad | Horizonte | Baldosas | Triángulos | Memoria |
|---|---|---|---|---|
| Bajo | Cerca (768) | 169 | 348 900 | 18 MB |
| Medio | Cerca (768) | 141 | 581 962 | 30 MB |
| Medio | Lejos (1 536) | 189 | 811 112 | 42 MB |
| Alto | Muy lejos (3 072) | 237 | 1 056 122 | 54 MB |

  Las llamadas de dibujo son las baldosas. Los fps no se pudieron medir con el panel del navegador oculto (el navegador frena la pestaña); hay que medir con la pestaña al frente y el medidor de fps.
- Capturas en `docs/capturas/v12.0.1/`: «muy lejos» desde lo alto y Bajo a ras del suelo, igual que antes.
- El build separa los gráficos (atmósfera, cielo y horizonte) en su propio trozo (`graficos`, 45 kB): el principal había pasado de 700 kB. Probado: el build carga, entra a un mundo y arma el horizonte, sin errores.
- Queda para las fases siguientes del plan: el worker de chunks, ver lo construido de lejos, los impostores de las estructuras y el horizonte del inframundo.

## 12.0.0 — 2026-11-11 · Hora dorada
Fases 0 y ★2 de `docs/revisiones/PLAN_GRAFICOS.md`: la atmósfera «de material», sin postproceso. **PAUSA:** antes de seguir con la 12.1 (agua, postproceso) hace falta el visto bueno de nanoyackson a las capturas.
- **`src/atmosfera.js`** (nuevo): uniformes compartidas por los bloques, el terreno lejano, la cúpula y las nubes (sol, tinte de luces y sombras, gradación, niebla de altura, bruma), y el GLSL de cada efecto. **Regla de oro:** cada efecto va detrás de un `#define` (`ATMOS_TONO`, `ATMOS_NIEBLA`, `ATMOS_CIELO`). En «Bajo» no se compila nada nuevo, así que dibuja igual que antes.
- **Calidad** (`settings.calidad`, por defecto «bajo»), con los niveles Bajo, Medio, Alto, Ultra y Personalizado:
  - **Medio:** tono y gradación por hora, con luces ámbar, sombras azuladas y un hombro suave arriba de 0.8 para que nada se queme; niebla de altura exponencial que se tiñe hacia el sol (dispersión) y cielo mejorado (degradado más largo, banda clara de dispersión en el horizonte y el lado del sol más cálido).
  - **Alto:** lo mismo, más la bruma por bioma: selva y manglar verdosos, desierto y bosque seco cálidos, páramo y montaña azulados, costa clara.
  - **Ultra:** por ahora igual que Alto. Ahí van a llegar el agua, el postproceso y las sombras.
  - **Personalizado:** cada efecto con su casilla. Tocar una pasa a Personalizado con lo que había.
  - Bajo, además, apaga el desenfoque de los paneles (`body.sin-blur`).
- **«Opciones de video»:** pantalla nueva en vidrio que se abre desde Ajustes. Tiene la calidad con su nota y los cuatro efectos; ahí se mudó todo el grupo «Imagen» (distancia, campo de visión, **brillo**, horizonte lejano, resolución, pantalla completa y balanceo). Esc o «Listo» vuelven a Ajustes.
- **Medidor de fps** (casilla en Opciones de video): arriba a la derecha, con los fps, los milisegundos por cuadro (`game.msCuadro`, medido en `main.js`) y el nivel.
- **`tools/atardecer.js`:** la escena fija para comparar (semilla 2026, un lago con una isla y el sol bajo a un lado, `time = 0.46`). `medir(nivel)` da la mediana de 60 cuadros con `gl.finish()`, las llamadas de dibujo y los triángulos.
- **Capturas** en `docs/capturas/v12.0.0/`: Bajo, Medio y Alto al atardecer, y la pantalla de Opciones de video.
- **Medición:**
  - en los tres niveles salen las mismas 263 llamadas de dibujo y los mismos ~628 000 triángulos: lo nuevo es solo un poco más de cuenta por píxel, sin pasadas ni geometría extra;
  - los milisegundos no son confiables con el panel del navegador oculto: el navegador frena la pestaña, y el mismo nivel dio de 3.5 a 150 ms;
  - hay que medir con la pestaña al frente (`tools/atardecer.js`, o el medidor de fps jugando).
- `vite.config.js` deja de vigilar `assets-src/` y `docs/`: un PNG del arte a medio escribir tumbaba el servidor (EBUSY).

## 11.13.5 — 2026-11-11 · Sexta revisión: que todo se lea
De `docs/revisiones/REVISION_v11.12.2-v11.13.2.md`.
- **G1: texto invisible.** El paso a tokens había dejado letra del mismo color que el fondo, o casi.
  - Lo que es papel va en crema con tinta oscura. Usa los tokens nuevos `--papel`, `--papel-2`, `--on-papel`, `--on-papel-soft`, `--tinta-roja` y `--tinta-verde`. Son las cartas de la abuela, las estampas del álbum y el cartón, el canto y los botones del bingo.
  - Los rellenos de color (logros ganados, «¡BINGO!», cambiar repetidas, el día de hoy en el almanaque, la casilla LIBRE) llevan letra oscura (`--on-color`).
  - En la libreta, una regla `#lib-body b` les ganaba a los títulos de las cartas y de las estampas; ya no.
- **G2: el velo detrás de la letra.**
  - Los ~33 textos del HUD y de los paneles que iban sobre `--velo` (.55) pasan a `--surface` (.88): vistas, tiro, metas, guardado, lo que mira, objetivo, receta, reloj, subtítulos, ruta, tooltip, efectos, logros, recogidos, pistas, ermitas, almanaque y pendientes. Con cielo claro o nieve detrás quedan ≥ 4.5:1.
  - `--velo` queda solo para los telones de pantalla completa y las barras sin letra.
  - `--border-strong` sube a .42, para que el borde de los controles llegue a 3:1.
- **G3: la letra chica.** Los 93 textos que se habían achicado a 10–12 px vuelven a 14 px (13 px los que eran de 10–11). Solo quedan chicos, y marcados a propósito, los contadores y las teclas: la cantidad de la casilla, el valor de la plata, la moneda y la tarjeta.
- **`tools/revisar-estilo.mjs` reforzada:**
  - ve los colores dentro de `@keyframes`;
  - lee entero cada `cssText`, `setProperty` y `style="…"` de `src/*.js`;
  - avisa del `monospace`;
  - calcula el contraste letra-fondo de cada regla con los tokens resueltos, con el fondo translúcido sobre el peor caso (nieve, cielo de día o cueva) y siguiendo la cascada entre `style.css` y `vidrio.css`;
  - avisa de la letra de menos de 13 px que no lleve la marca `/* chico */`;
  - la tolerancia queda en cero en todo;
  - con el CSS de la v11.13.4 marca el bingo, los logros ganados y 38 casos más, que antes pasaban limpios.
  - Sin el DOM no puede ver los choques de especificidad (como el `#lib-body b`). Por eso el recorrido de capturas también se midió con un barrido de contraste en el DOM real: 0 textos debajo de 4.5:1 en la libreta (cartas, álbum y logros), el bingo y el HUD.
- **Estilos viejos que quedaban:**
  - las barras del pez vela y de montar toros pasan de estilos en línea con `monospace` y colores a mano a `vidrio.css`;
  - el inventario usa los mismos colores de categoría que el recetario (`--cat-*`); antes tenía su propia tabla;
  - los tintes de la luna roja, el eclipse y la cueva de los bravos quedan marcados como contenido (`// contenido:`).
- **M1: el inicio del mundo compacto.** Ya no cae dentro de la feria ni del cementerio del pueblo: el inicio les guarda el anillo seguro (60 + R) y, si no hay sitio, al menos queda fuera de su caja. `tools/revisar-mundo.mjs` ahora lo vigila. Probado con 60 semillas, incluidas las tres que fallaban (166312, 277178 y 332611) y la del mirador (118798): todo bien.
- **Desenfoque:**
  - fuera el `blur(3px)` de la pantalla del inventario, que además dejaba ciegos los blur de sus paneles;
  - los recuadros chicos del HUD ya no desenfocan (`--blur-small: none`): con fondo .88 no se notaba y se pagaba en cada cuadro;
  - «Movimiento tranquilo» apaga todo desenfoque, y `body.sin-blur` queda listo para el nivel «Bajo» de la v12.0.0.
- `tools/escenas-ui.js` llena la libreta con cartas, estampas y logros de muestra, y abre el bingo.
- Capturas en `docs/capturas/v11.13.5/`: cartas, álbum, logros, bingo y el HUD con cielo de día y sobre nieve.

## 11.13.4 — 2026-11-11 · Letra Inter
- **Inter servida desde el repo** (permiso de nanoyackson). Viene del paquete oficial `@fontsource/inter` 5.3.0, no de Google Fonts. Son los pesos que usa la interfaz (400, 500, 600 y 700) en WOFF2, con los subconjuntos latin y latin-ext (este trae el ₡). Pesan 240 KB, están en `public/fonts/inter/` y usan `font-display: swap`, así que mientras carga se ve la sans del sistema.
- La licencia OFL va al lado de la fuente: `public/fonts/inter/LICENSE.txt`.
- `THIRD_PARTY.md` (nuevo) lista lo de terceros: Inter, Kenney y Freesound CC0.
- La letra queda anotada en los créditos del final.
- Iba a entrar en la v11.13.3, pero ese tag ya estaba puesto. Para no moverlo, va como versión propia.

## 11.13.3 — 2026-11-11 · Pulido de vidrio + quinta revisión
- **Mapa del mundo compacto:**
  - al alejar, los pueblos y lugares cercanos entre sí se juntan en un círculo con el número. La rejilla que los junta va pegada al mundo, así que los grupos no saltan al arrastrar, y crece con el zoom: 28 px a ×2, 48 a ×4, 72 a ×8 y 96 a ×16;
  - con nombre van solo los 8 lugares sueltos más cercanos;
  - debajo del mapa, una leyenda con cinco capas: Pueblos, Naturaleza (parques, volcanes, cataratas…), Lugares, Misiones y Lo suyo (casa, cama, marcadores, bolso, lote, ermitas). Un clic esconde o muestra cada capa, y el número dice cuántos hay en la vista.
- **Menú principal:** el logo lleva un velo oscuro difuso detrás, contorno y sombra, y es un poco más grande. Ya no se pierde sobre el fondo.
- **Ajustes:**
  - el panel es más ancho: 1080 px en pantallas de 1100 o más, con dos columnas por grupo;
  - letra de cuerpo de 16 px y deslizadores más largos (~475 px a 1920×1080);
  - el valor de cada deslizador va en acento.
- **Pregunta propia:** «Restablecer todo» y «Borrar» un mundo ya no usan la ventanita del navegador, sino un aviso en vidrio. El foco empieza en «Cancelar»; Esc o un clic afuera cancelan.
- **Quinta revisión** (`docs/revisiones/REVISION_v11.10.5-v11.12.2.md`):
  - **B1.** Al morir, la plata sacada a las casillas (también la de la mano) vuelve a la billetera antes de repartir. Así cae la mitad (o toda) de *toda* la plata, y no se puede salvar ni perder entera según dónde estaba.
  - **B2.** Morir con el inventario abierto devuelve primero lo del cursor y la mesa 2×2, y eso entra en la cuenta del bolso.
  - **B3.** Sacar plata de la billetera nunca da más de una pila (99 billetes o 999 monedas), y la plata del bolso cae en pilas que respetan ese tope. Confirmado en el juego: 6 325 000 cayeron como 99 + 99 + 99 + 19 billetes de 20 000 y uno de 5000.
  - **C2.** El consejo del chanchito dice que hay que conservar uno.
  - **M1.** Cambiar la pechera cambia la manga del brazo en primera persona, también la del escudo.
  - **I1.** Si un PNG de arte no carga, sale un aviso en la consola. `tools/revisar-nombres.mjs` revisa que cada clave de `ARTE` tenga su PNG y su dueño.
  - **V1.** Los íconos (ordenar, depositar, buscar…) responden a Enter y Espacio. Las recetas y las filas de la tienda se alcanzan con Tab y se usan con Enter (Mayús+Enter hace el máximo).
  - **V2.** El selector de orden ya no atrapa Esc ni E, y suelta el foco al escoger.
  - **V3.** `ordenInv` tiene su valor por defecto («categoria»).
  - **V4.** El filtro y la búsqueda del inventario se limpian al cerrarlo.
  - **F1.** Confirmado: un Espacio sostenido al morir pulsaba «Reaparecer», porque `show()` le daba el foco a los 30 ms. Ahora el foco llega a los 450 ms y solo cuando no hay teclas apretadas.
  - **F2.** Pausar guarda si pasaron más de 5 s desde el último guardado (antes, 30).
  - **F3.** El rumbo de la muerte ya coincidía: +z = sur.
  - **F4.** Están en el catálogo los tres logros que faltaban: «hervir», «variado» y «variado5».
  - **F5.** Lo de la pregunta propia, arriba.
- Capturas en `docs/capturas/v11.13.3/`.

## 11.13.2 — 2026-11-11 · Vidrio, parte 2
- **Ya no queda estilo viejo:** `style.css` no tiene ni un color ni un radio escrito a mano (`tools/revisar-estilo.mjs`, ahora estricto por defecto). Los dorados, verdes, rojos y azules pasaron a los tokens de aviso, éxito, peligro y acento; los cremas de la libreta, a superficies o a texto; los velos negros, a `--velo`. Los estilos en línea de los `.js` (durabilidad, recetas, vestidor, tinta) también usan tokens.
- **Libreta:** el panel es de vidrio y las pestañas son texto con el subrayado de acento; si no caben, se desplazan a lo ancho. La línea de atajos de abajo pasa a un tooltip.
- **Mapa:** panel de vidrio; las instrucciones, en un tooltip sobre el mapa. Las etiquetas usan la letra de la interfaz (se fue VT323 y, con ella, la carga desde Google Fonts).
- **Menús, mundos, mundo nuevo, novedades, ajustes (en grupos con su título en acento), pausa y muerte**, en vidrio, con el botón principal en acento.
- **HUD y avisos:**
  - el locutor sale en una píldora de vidrio;
  - el diálogo con vecinos lleva el nombre arriba en dorado;
  - la barra del jefe es fina y redondeada;
  - la misión, el objetivo, la receta fijada y la brújula, en vidrio;
  - el banner de región, los subtítulos, «Guardado», las vistas y la tarjeta de logro, con la misma letra.
- **Billetera:** las dos ranuras de tarjeta de la billetera abierta muestran lo que hay en el banco y la plata guardada en los chanchitos.
- `tools/escenas-ui.js` abre también la libreta por hoja, el mapa, la pausa, la muerte, un diálogo y las pantallas del menú. Las capturas del recorrido están en `docs/capturas/v11.13.2/`.
- Pendiente: Inter servida desde el repo; hay que bajar la fuente y pide permiso.

## 11.13.1 — 2026-11-11 · Vidrio
Primera parte de la interfaz nueva, la dirección A «vidrio» que escogió nanoyackson (`docs/maquetas/ui-a-vidrio.html`, `docs/revisiones/SISTEMA_DISENO_UI.md`): los paneles de juego y el HUD. La segunda parte (libreta, mapa, menús, ajustes, minijuegos y lo demás) va en la v11.13.2.
- **Tokens únicos** en `src/tokens.css` (colores, radios, sombras, letra y movimiento) y una capa de componentes en `src/vidrio.css`. `style.css` pasó por un script que cambió 468 valores sueltos por tokens: los grises de los paneles claros a superficies oscuras, la letra oscura a clara, las sombras de píxel y los biseles a sombras suaves, y los tamaños de letra a la escala de la fuente nueva.
- **Paneles de vidrio:** inventario, mesa, recetario, cofre, baúl, chanchito, horno y tienda. Fondo oscuro translúcido con desenfoque, borde de 1 px, esquinas de 16 px y letra sans moderna en vez de la pixelada. Los botones, los campos, las casillas, la barra rápida, los tooltips, los globos de los vecinos y los avisos van con el mismo estilo. El menú principal deja el logo libre.
- **Inventario más limpio:**
  - sin pestañas de categoría;
  - arriba a la derecha, íconos de línea con tooltip: 🔍 buscar (el buscador sale al tocarlo o con `/`), ⇅ ordenar (clic: con el último criterio; clic derecho: escoger entre categoría, nombre, cantidad y recientes) y ⤓ a cofres cercanos;
  - «Traer receta» queda en el «⋯».
- **Cofre, baúl y chanchito:**
  - en la cabeza: ⇅ ordenar, ⤓ depositar todo, ⤒ sacar todo, ≋ guardar lo que ya hay aquí y ✎ ponerle nombre;
  - «Ordenar la casa» va en el «⋯», porque toca muchos cofres y pide confirmar;
  - en pantalla ancha, el cofre y el inventario van lado a lado y centrados.
- **Atajos:** R ordena el panel que está bajo el ratón y Mayús+R deposita todo en el cofre abierto. Al ordenar o depositar, las casillas se acomodan con una animación corta, que se apaga con «Movimiento tranquilo».
- **Recetario:** las categorías ahora son filtros del recetario (Herramientas, Armadura, Comida, Construcción, Materiales y Varios), con «Puedo hacer» y el contador de cada uno; se pueden sumar. La ayuda pasa a un tooltip.
- **La billetera de verdad (arte de GPT):**
  - en el HUD, la billetera de cuero con el total al lado; brinca y suena suave al entrar plata, y se encoge un poco al pagar;
  - en el inventario, una fila con la billetera y el total. Clic abre el cajón con la billetera abierta: los billetes en abanico en el bolsillo largo y las monedas en el monedero, cada uno con su cantidad;
  - clic saca una pieza (Mayús: todas) y soltar plata la guarda. Esc o un clic afuera cierra el cajón.
- **`tools/revisar-estilo.mjs`:** lista los colores y radios escritos a mano. `vidrio.css` ya va todo con tokens; en `style.css` quedan 211 colores con sentido (dorado, rojo, verde…), que se pasan a tokens en la v11.13.2 (`--estricto`).
- **`tools/escenas-ui.js`:** arma un mundo con mesa, cofre, baúl, horno y chanchito, y abre cada pantalla para capturarla.
- La fuente es la sans del sistema; Inter servida desde el repo queda pendiente.
- Capturas de antes y después en `docs/capturas/v11.13.1/`.

## 11.13.0 — 2026-11-11 · Tiquicia de bolsillo
- **Tipo de mundo al crearlo:** «Normal» (el de siempre, sin cambios) o **«Tiquicia de bolsillo»**, con una línea que explica cada uno. Se guarda en el mundo (`meta.tipoMundo`, formato de guardado 6; los mundos viejos son «Normal»). La semilla sigue mandando: misma semilla y mismo tipo dan el mismo mundo.
- **En Tiquicia de bolsillo:**
  - **biomas 2.25 veces más chicos** y continentes 1.6 veces más chicos, para que haya de todo cerca, también la costa; las transiciones son las mismas de siempre, solo más juntas;
  - el inicio queda **a unos 70 bloques del pueblo más cercano**;
  - **cada tipo de lugar que se ubica por el terreno recibe un sitio fijo** entre 60 y 600 bloques del inicio: los chicos más cerca, los grandes más lejos y la Caverna del Rey de 150 para afuera, para que haya un anillo seguro;
  - más allá, los lugares siguen apareciendo a un tercio de la distancia normal;
  - **nada se encima**: ni con otros lugares ni con los pueblos.
- **Medido con `tools/revisar-mundo.mjs`** (5 semillas, lugares distintos alrededor del inicio):

  | Tipo | a 150 | a 300 | a 600 | Vecino más cercano | Pueblo más cercano | Encimados |
  |---|---|---|---|---|---|---|
  | Normal | 0–1 | 3–7 | 21–27 | 100–112 | 184–810 | 0 |
  | Tiquicia de bolsillo | 4–11 | 31–35 | 62–63 | 75–82 | 70–71 | 0 |

- **No todo cabe a 300:** son 77 tipos de lugar que juntos ocupan unos 241 000 bloques², casi todo el anillo de 60 a 300 bloques. Por eso la garantía es a 600 bloques y unos 35 caen a menos de 300. Quedan sin acercar los lugares con grilla propia (miradores de volcán, Chirripó, Isla del Coco, La Amistad, Zurquí, Tárcoles, San Lucas, el puente colgante), la feria y el cementerio del pueblo (van pegados a pueblos) y el aeropuerto (muy grande y pide terreno plano).
- **Mapa:** solo los 8 lugares más cercanos al centro llevan nombre; los demás, solo su ícono.
- Lo que depende de distancias (encargos de 100 a 700 bloques de la casa, misiones de 50 a 100, el correo, las criaturas) queda igual: con el mundo más chico siguen teniendo sentido.
- Capturas del mapa con la semilla 12345 en los dos tipos, en `docs/capturas/v11.13.0/`.

## 11.12.2 — 2026-11-11 · Que se lea bien
La Tanda 3 de `docs/revisiones/PROXIMAS_TANDAS.md` (cierra la sección 3 de la cola).
- **Contraste ≥ 4.5:1:**
  - filas de la tienda en `#5a5a5a` con letra blanca; lo que no alcanza va opaco, sin transparencia;
  - la plata de la tienda, las notas del personaje, de la mesa y de la tienda;
  - las recetas que no se pueden hacer, con fondo y letra opacos;
  - los logros sin sacar y los hitos;
  - la letra de los platos, de las mañas y de la hoja de la partida, sobre un fondo oscuro.
- **Pestañas de la libreta:** pasan a la otra línea en vez de partirse (en 640 px quedan en tres filas, ninguna cortada).
- **Letras:**
  - los subtítulos ya no se salen de la pantalla (40 % del ancho, en varias líneas);
  - durabilidad, vistas, «Guardado», la receta fijada y las estrellas de mejora, a 16 px;
  - los deslizadores, de 28 px de alto;
  - se quitó una regla repetida que dejaba los íconos-guía de la armadura en 13 px.
- **Sin género y en «usted»:**
  - «Escoja un mundo»;
  - estados como «Ropa empapada», «Panza llena», «Mareo», «Cansancio», «Lodo», «Enredo», «Frescura» y «Buen provecho»;
  - «Lleva la ropa empapada»; «En la silla se descansa»;
  - 39 logros con nombre nuevo, neutro y a lo tico: «A echarse un descansito», «Mano santa en el bingo», «Mandamás del monte», «Gané la arena», «Un lote a mi nombre», «Doctorado en huecos», «El cariño de la abuela»…
- **Ajustes:**
  - en cuatro grupos: Imagen, Sonido, Juego y Accesibilidad;
  - «Restablecer todo» pide confirmar;
  - «Listo» queda fijo abajo;
  - la nota de pantalla completa va aparte, en chiquito.
- **Mundo nuevo:** la dificultad es corta, con su explicación abajo, que cambia al escogerla.
- **Novedades:** muestra las últimas 10 versiones, con «Ver anteriores».
- **Al morir:** dice dónde quedó el bolso («a 108 bloques al noreste») y el otro botón dice lo que hace: «Reaparecer y salir al menú».
- Capturas en `docs/capturas/v11.12.2/`.

## 11.12.1 — 2026-11-11 · Teclado, foco y pausa
La Tanda 2 de `docs/revisiones/PROXIMAS_TANDAS.md`.
- **Menús con teclado:**
  - Tab ya no se bloquea fuera de la partida;
  - Esc vuelve atrás en Mundos, Mundo nuevo, Novedades y Ajustes;
  - al abrir un panel, el foco va al primer botón y al cerrarlo vuelve a donde estaba;
  - al morir, el foco queda en «Reaparecer» y Enter reaparece.
  Se puede ir de «Menú → Un jugador → Mundo nuevo» y volver solo con el teclado.
- **El foco se ve** en botones, campos, filas, pestañas y casillas: dorado con un borde oscuro, que se lee sobre cualquier fondo. Lo deshabilitado tiene fondo y letra opacos, sin transparencia.
- **Pausa:**
  - el mapa, la libreta y la tienda pausan el juego (ajuste «Pausar al abrir el mapa, la libreta y la tienda», activado por defecto);
  - el inventario, los cofres y la mesa no pausan, como se decidió;
  - cerrar la libreta ya no despausa algo que pausó otra cosa;
  - las mañas siempre pausan;
  - al pausar se guarda solo si pasaron más de 30 s desde el último guardado;
  - nuevo botón «Ayuda (Y)» en la pantalla de pausa.
- **Accesibilidad mínima:**
  - cada pantalla es un diálogo con su título;
  - los avisos, los subtítulos y lo recogido se anuncian solos;
  - la barra de carga es una barra de progreso y el mapa tiene nombre;
  - los botones de apariencia llevan su etiqueta y las pestañas de la libreta, su rol.

## 11.12.0 — 2026-11-11 · Inventario a la medida
Primera parte de la sección 3 (la Tanda 2 «Teclado, foco y pausa» va en la v11.12.1 y la Tanda 3 «Que se lea bien», en la v11.12.2).
- **Se ajusta solo:**
  - la casilla mide según la pantalla: 36 px en 1280×720 y 55 px en 1920×1080;
  - arriba de 1080p, la pantalla del inventario entera (casillas y letras) crece junta con `--zoom-ui`: en 4K la casilla mide 116 px;
  - con un cofre, el baúl de 54 o la mesa abiertos, la estación va a un lado y el inventario completo queda a la vista en los tres tamaños.
- **Pestañas por categoría** (`categorias.js`), con ícono, contador y su color. La casilla lleva abajo un borde del color de su categoría. Filtrar **no esconde nada**: lo que no calza se apaga.
- **Buscador:** se abre con `/` o Ctrl+F con la ventana abierta. Busca sin tildes ni mayúsculas, resalta lo que encuentra y Esc limpia. También marca lo del cofre abierto.
- **Orden a escoger** para «Ordenar» (y para los cofres): categoría, nombre, cantidad o recientes. Se recuerda en los ajustes.
- **Recetario:**
  - busca sin tildes;
  - cada receta lleva ✓ o ✗ y los ingredientes que faltan van en rojo;
  - aviso cuando ninguna receta calza;
  - ya no salta al inicio al refrescarse;
  - **Mayús+clic** pone el máximo que alcanza (clic normal: una vez).
- Capturas en 3 tamaños en `docs/capturas/v11.12.0/`.

## 11.11.3 — 2026-11-11 · Íconos nuevos
- **Lote 1 de arte** (`docs/revisiones/PEDIDOS_ARTE_LOTE1.md`): 40 íconos nuevos, más la carne y el palo de muestra. Son los picos, hachas, azadas y palas de madera, piedra, hierro y diamante; el machete; los cuatro baldes; las tres botellas; el ladrillo, la tapa de dulce y el azufre; la comida (gallo pinto, casado, gallo pinto con huevo, café chorreado, agua dulce, tamal, ceviche, empanada, cajeta y carne asada); y los objetos de la historia (lo de Zenaida, la tablilla, el pañuelo de los Chatas, la escritura y la hoja de firmas). Están en `public/sprites/arte/` (128 px, recortados y centrados) y mandan sobre el pixel art viejo, que queda de respaldo si la imagen no carga. Se leen bien en la casilla, en la barra, en la mesa y en la mano; en primera persona se siguen viendo con grosor y con la mano agarrándolos.
- **El chanchito de barro** con su ícono y el modelo retocado como en la hoja de referencia: un solo cuerpo con la cara al frente, el hocico salido, orejas paradas en las esquinas, la colita enrollada y la banda crema con triangulitos café y cuadritos amarillos. La ranura va en el lomo.
- Capturas en `docs/capturas/v11.11.3/`.

## 11.11.2 — 2026-11-11 · Nada flota, parte 2
- **La mano agarra lo que lleva** (primera persona): antes, con algo en la mano se dibujaba solo el objeto y la espada, el pico o la antorcha flotaban delante de la cámara. Ahora sale el brazo con la piel del personaje y la manga de la camisa (o del color de la pechera, si lleva una), **con el puño cerrado sobre el mango**. El agarre de cada ícono sale de sus píxeles (la punta de abajo a la izquierda es el mango); el arco se agarra por el medio y la jabalina un poco adelante del cabo. El brazo es parte del mismo grupo que el objeto, así acompaña el golpe, comer, beber, poner bloques y el parry. Todo lo que se lleva va un poco más arriba, para que el puño no quede detrás de la barra rápida.
- **Bloques en la palma**, sostenidos por abajo, un poco más chicos y a la vista. **El escudo** lleva el antebrazo izquierdo detrás, agarrando la correa.
- **Tercera persona:** la mochila de cuero se ve en la espalda cuando uno la lleva (cuerpo, tapa, bolsa, hebilla y tirantes sobre los hombros, por encima de la armadura). **Barrerse** tiene pose: piernas adelante, una rodilla doblada y el cuerpo echado para atrás (se inclina la figura entera, para que brazos y cabeza no se despeguen).
- Capturas de antes y después en `docs/capturas/v11.11.2/`.

## 11.11.1 — 2026-11-11 · Nada flota
Segunda mitad de «Brillo y nada flota».
- **`tools/revisar-modelos.js`** (en la consola: `(await import('/tools/revisar-modelos.js')).revisar()`): arma los 137 modelos de criaturas, jefes, vecinos y vehículos, y al jugador sin nada y con cada juego de armadura con algo en la mano (espada, pico, machete, hacha o antorcha). Los pone en siete poses (quieto, caminando, golpe, parry, barrido, sentado y nadando) y busca piezas que no tocan a ninguna otra (**flotan**) o que quedan enteras adentro de otra (**metidas**). Lo metido que ya está en reposo es de diseño (ojos, asientos del bus) y se cuenta aparte.
- **Arreglado lo que encontró:** el escudo de hierro y el de jade quedaban 5 cm afuera del antebrazo (ahora va pegado); el letrero del muñeco de práctica flotaba delante del palo. Resultado: **0 piezas sueltas** en 147 modelos × 7 poses. Hombros, codos, caderas y rodillas, la armadura, el sombrero y lo que se lleva en la mano no tienen huecos.
- Lo que sigue saliendo «metido en pose» (chata, vecino, la bruja Zárate y el jugador con armadura de pluma) sale de poses exageradas que el juego no les pone (brazos cruzados o nadando).

## 11.11.0 — 2026-11-11 · Brillo
Primera mitad de «Brillo y nada flota» (la segunda, «nada flota», va en la v11.11.1).
- **Brillo de 0 a 100 %** en Ajustes, con vista en vivo. El **50 % es exactamente la luz de siempre**. Arriba de 50 se levantan las sombras y la noche con una curva más suave y un piso de luz (a 100 % una cueva sin antorchas se ve gris, no negra); abajo de 50 los medios tonos se oscurecen.
- Va en la luz del mundo (`brillo.js`: la misma curva en el shader de los bloques, en las criaturas, los objetos tirados, el jugador y la mano), **no en un filtro de la imagen**: la interfaz no cambia. El brillo viejo (filtro, 0 a 1) pasa solo al nuevo (`settings.luz`).

## 11.10.7 — 2026-11-11 · Chanchito de barro
- **El chanchito de barro:** una alcancía rara que se pone como bloque (barro rojizo pintado a mano, con su hocico, orejas, patitas y colita). Funciona como un cofre «enlazado»: **todos los chanchitos del jugador abren las mismas 27 casillas**, estén donde estén, con plata y con lo que sea. Lo de adentro nunca se pierde: ni al morir ni si rompen el chanchito, que suelta solo el chanchito vacío. Al abrirlo tintinean las monedas.
- **Cómo se consigue:** uno de cada doce cofres de estructuras y ruinas trae uno; la abuela regala el suyo la primera vez que le ayuda con la leña y el maíz; y **Don Ubaldo, el alfarero**, pasa a veces de día por la plaza del pueblo (como mucho una vez cada cuatro días) y vende uno por visita, caro: ₡70 000. Clic derecho para que ofrezca y otro para comprar.
- Un consejo la primera vez que tiene uno. Dos logros nuevos. `/prueba alfarero` lo trae a la par.
- **Guardado:** formato 5 (la alcancía, `meta.chanchito`, y los topes de la paga por peligro de la v11.10.6).
- El ícono y el modelo van con dibujo propio mientras llega el de GPT (`docs/PEDIDOS_ARTE.md`).

## 11.10.6 — 2026-11-11 · Cuarta revisión: plata
Los hallazgos de `docs/revisiones/REVISION_v11.9.2-v11.10.4.md`, con la economía medida otra vez contra lo que de verdad hace el código.
- **El vuelto ya no se pierde** (#1): con la billetera, pagar con un billete grande y la mochila llena deja el vuelto completo; cambiar y recibir tampoco pierden nada. La migración vieja (2→3) ya no bota plata si no cabe: va a la billetera. Lo prueba `tools/revisar-plata.mjs`.
- **Los jefes no se cultivan** (#2): cada jefe paga completo una sola vez por mundo; las revanchas, el Señor del Arenal y la Arpía que vuelven a salir, el 10 % («ya le habían pagado»). De minijefes y de leyendas (con el Mono congo) paga completo el primero de cada día de juego; los demás de ese día, el 10 %. El «Se busca» ya iba de a uno cada tres días.
- **Balance medido de nuevo** (#3): `tools/bot-economia.js` con las cadencias del código (dos minijefes, tres leyendas y dos monos por día, un jefe nuevo cada cuatro días, revanchas pagando la ofrenda, diez clientes en la soda) y una columna «por minuto». Para que calce se bajó la paga por peligro (bravos ₡500–1 500, minijefes ₡3 500–4 500, leyendas ₡2 000–4 000, jefes del monte ₡20 000–35 000), los carteles de «Se busca» a la mitad y la cajuela a ₡2 000. Trabajador ₡27 800 por día, cazador ₡29 200 y comerciante ₡19 700: 1.48 veces. Tabla en `docs/BALANCE.md`.
- **La soda propia ya no paga más que la tienda** (#9): lo que pagan los clientes queda por debajo de lo que cuesta comprar el plato hecho, y la propina es del 10 al 30 % del plato.
- **Sombras ladronas** (#5): ya no se llevan monedas ni billetes de las casillas. De la billetera sacan poquito (el 10 % o ₡5 000, lo que sea menos) y, si la alcanza, lo sueltan todo con un aviso claro.
- **Lo manso no paga** (#7): el cuche de monte sale de la tabla, y cualquier animal que no sea bravo ni jefe no paga.
- **Monedas chicas** (#8): los precios del día se redondean a montos de vuelto (de ₡25 en ₡25 bajo ₡1 000, de ₡50 bajo ₡5 000, de ₡100 bajo ₡20 000): ₡450, ₡525, ₡3 650. Lo que uno paga se redondea hacia arriba y lo que le pagan, hacia abajo, así la regla de oro no se abre.
- **Los montos se leen bien** (#4): lo que ya está en colones lleva una marca invisible y no se vuelve a multiplicar; «300 000 colones» ya no se mutila; los carteles grandes (vecinos, cuentas saldadas) también salen en colones. `tools/revisar-plata.mjs` pasa los 140 textos con montos.
- **Inventario** (#7b): repartir arrastrando solo empieza en una casilla vacía o del mismo objeto (antes podía volver tablones carbón), y cerrar el inventario con el botón apretado deshace el reparto.
- **De paso** (#9): al cerrar la pestaña pregunta también si hay algo sin guardar (inventario, vida, plata) o si está guardando; la cuenta de reintentos de la arena que cae ya no crece sin fin.

## 11.10.5 — 2026-11-11 · Billetera
Tercera parte de «Colones de verdad»: la plata deja de estorbar en el inventario.
- **La billetera:** lo que recoge entra solo a la billetera y no ocupa casillas. El total sale discreto a la par de la barra rápida («👛 ₡12 500») y brinca en verde o rojo cuando cambia. En el inventario, el panel «Billetera» muestra el desglose: clic saca una pieza al cursor (Shift o clic derecho, todas las de ese valor) para darla, botarla o guardarla en un cofre; soltar plata sobre el panel la guarda otra vez. Las tiendas y los encargos cobran y pagan desde la billetera, con el vuelto en la menor cantidad de piezas.
- **Monedas y billetes nuevos:** los 11 dibujos de `assets-src/chatgpt/` pasan a `public/sprites/plata_*.png` (128 px). En las casillas se lee el valor en una esquina («500», «5k»), por si a tamaño chico no se distingue la cifra. El dibujo procedural queda de respaldo.
- **Al morir se cae parte de la plata:** Tranquilo (fácil) nada, Normal la mitad y Difícil toda, redondeada a piezas de verdad y guardada en el bolso donde cayó. La pantalla de muerte lo dice («Se le cayeron ₡41 500 en el bolso»). Lo del banco nunca se pierde.
- **Pagar sin sacar la plata:** agachado y clic derecho, el banco deposita toda la billetera, el compa cobra su día y el licenciado Porras recibe su «sobrecito». Con una pieza en la mano sigue funcionando como antes.
- **Billetes viejos:** los de 25 000 y 50 000 no existen en la vida real: al cargar o al recogerlos se cambian por piezas de verdad, por su valor.
- **Guardado:** formato 4. La plata del inventario y de la barra pasa a la billetera; la de cofres, bolsos y la mochila queda como objeto.

## 11.10.4 — 2026-11-11 · Ganarse la vida
Segunda parte de «Colones de verdad»: lo que se gana a la misma escala que lo que se paga, medido con un bot.
- **La canasta a precio de aquí** (`precios.js`, tabla central): casado ₡4 500, gallo pinto ₡2 500, con huevo ₡3 500, café chorreado ₡1 500. Lo que solo se compra hecho va por ritmo de trabajo: pico de hierro ₡45 000, arco ₡35 000, cama ₡25 000, bote ₡60 000, bici ₡85 000, moto ₡900 000, lancha ₡1 500 000 y escritura del lote ₡300 000. Las tiendas de lujo siguen cobrando de más a propósito.
- **Paga por peligro:** matar lo manso o lo común no paga. Los bravos dejan monedas al caer (₡1 500–3 500), igual las élites, las leyendas (₡10 000–20 000) y los minijefes (₡15 000–20 000). Los jefes pagan directo: del monte, ₡40 000–70 000; de la historia, hasta ₡500 000 el Rey Zopilote. La revancha paga la mitad más. Las monedas que ya soltaban la Chata, el Mico Malo, la Mona y el Mono congo pasan a esta tabla, para no pagar doble.
- **Trabajos:** la cajuela llena de café paga ₡2 500 (unas cinco por jornada en temporada).
- **Medido** con `tools/bot-economia.js` (30 días de juego, jornada de referencia ₡12 500, el mínimo del MTSS 2026). El trabajador gana ₡18 100 por día, el comerciante ₡19 600 y el cazador ₡27 000: 1.49 veces entre el que más y el que menos. Nadie se queda sin comer y nadie compra todo; el pico tarda 3–6 días, el lote 18–27 y la moto no se alcanza en un mes. Tabla en `docs/BALANCE.md`.
- **Seguridad:** vite 6.4.6 y eslint 9.39.5 (`npm audit`: 0 vulnerabilidades). Un error al leer el guardado ya no se pinta como HTML.

## 11.10.3 — 2026-11-11 · Colones de verdad
Pedido de nanoyackson. Primera parte: la plata. Los ingresos, el bot de economía y el balance de 30 días vienen en la 11.10.4.
- **Monedas y billetes como los de aquí**, con arte propio, inventado (no los del BCCR). Monedas de 5, 10, 25, 50, 100 y 500. Billetes de 1000 (la carreta), 2000 (la guaria), 5000 (el volcán), 10 000 (el yigüirro) y 20 000 (la ballena).
- **Escala de 2026:** por dentro el juego cuenta como siempre, y cada «colón» de antes vale **₡500**. Un casado sale a ₡3000, el gallo pinto a ₡1500, el café a ₡1000 y el machete a ₡7500. Todos los montos se ven así: avisos, diálogos, globos de los vecinos, la tienda, la libreta y la ayuda, con espacio de miles («₡12 500»).
- **Pagar y recibir:** la plata siempre queda en la menor cantidad de piezas, y el vuelto ya va adentro. En cualquier comerciante, «Cambiar plata» junta todo en billetes o lo parte en monedas de 500.
- **Guardados (formato 3):** la moneda de siempre ya es la de 500, así que en cofres y en el suelo no cambia nada. La plata de la mochila y de la mochila de cuero se reacomoda en la menor cantidad de piezas. Los billetes de 50 y 100 de la 11.10 pasan a «billetes viejos» de 25 000 y 50 000: siguen valiendo y se cambian solos al usar «Cambiar plata».
- El arte es por ahora dibujado por el juego. Cuando lleguen los PNG de `assets-src/chatgpt/`, se cambia.

## 11.10.2 — 2026-11-11 · Que Chrome no estorbe
- **El mouse no se pierde:** si Chrome no deja capturarlo (pide esperar un segundo después de soltarlo, por ejemplo al cerrar el inventario muy rápido), se reintenta solo. Si tampoco, queda una capa discreta y el clic que lo recupera ya no pega ni pone un bloque. En pantalla completa se bloquea todo el teclado (Esc sostenido sigue saliendo).
- **Atajos del navegador:** mientras se juega no hacen nada, salvo en el menú y escribiendo en un campo. Son Ctrl + rueda y Ctrl +/−/0 (zoom), Ctrl+S/D/P/F/R, Ctrl + Espacio, F1, F3, F5 y F7, Alt solo y Retroceso. Cerrar la pestaña con cambios sin guardar pregunta antes.
- **Teclas 1–9 sobre una casilla** (inventario, cofre, baúl, mesa u horno): pasan ese objeto a esa casilla de la barra, intercambiando. De la salida de la mesa se fabrica directo a la barra. Respeta las casillas fijas.
- **Reparto al arrastrar, en vivo:** se ve mientras se arrastra, la receta de la mesa responde al instante, y cada casilla aparece con un saltito (sin él con «Movimiento tranquilo»). Clic izquierdo reparte en partes iguales y clic derecho deja uno por casilla. Esc o soltar fuera de los paneles devuelve todo.
- **Proyectiles:** flechas, piedras, escupitajos y demás respetan la forma real. Pasan por encima de una losa y se clavan en la tabla de la puerta, no en el aire de la celda (`world.solidoEn`).
- **Avisos:**
  - el cartel de la región y el título del jefe hacen fila con lo demás, sin encimarse;
  - mientras alguien habla (un diálogo abierto), solo sale lo urgente;
  - con el inventario o un cofre abierto, los avisos salen ahí mismo, en una línea del panel.
- **«Ordenar la casa»** muestra la lista de cofres que va a tocar (nombre y distancia), con «Sí, ordenar» y «Mejor no».
- **Texto del jugador:** el nombre de un cofre tiene un tope de 32 letras, sin caracteres de control. Un mundo importado limpia su nombre y los rótulos de sus cofres.
- **Pilas:** cada objeto respeta la pila declarada: la bicicleta, los trofeos y las herramientas únicas ya no se apilan a 64, y la jabalina va de 4 en 4.

## 11.10.1 — 2026-11-11 · Tercera revisión
Arreglos de `docs/revisiones/REVISION_v11.8.0-v11.9.x.md`.
- **Lo urgente, urgente de verdad:** el locutor marcaba como urgente cualquier «ya» en minúscula, todo lo que empezaba con 🔥 o 🌊 y hasta «lavanderas»; 73 de 126 urgentes no lo eran, y por eso interrumpían, salían en pelea y se saltaban el tope por minuto. La adivinanza ahora es conservadora, y lo urgente de verdad viene marcado desde donde se dice: tsunami, incendio, sangrado y herramienta rota. `tools/revisar-avisos.mjs` lo vigila: hoy quedan 12 urgentes de 646 avisos.
- **En pelea:** lo importante que lleva más de 10 s esperando sale igual, sin interrumpir lo urgente, y se ven el logro, la misión o la plata. Además, «en pelea» ya no es solo tener un bravo vivo a 12 bloques: tiene que estar atacando, a 6 bloques, o haberle pegado hace poco.
- **«Ordenar la casa»** primero avisa cuántos cofres va a reordenar y pide tocar otra vez. En los mundos viejos los cofres de misión pueden venir marcados como suyos.
- **Cantimplora:** tirarla y recogerla ya no la hierve.
- **Arena:** la caída cuyo chunk se descargó vuelve a la fila.
- **Historial:** lo que vuelve a salir después de una interrupción no se anota dos veces.
- **Queda para nanoyackson:** el agua del barril de lluvia sale limpia (se dejó así: agua de lluvia); la insolación pega entre las 11:15 y las 16:00 (podría ampliarse de 7:00 a 17:00).

## 11.10.0 — 2026-11-11 · Bolsillos y barriga
- **Plata con billetes:** las monedas se apilan hasta 999 (antes 64). Hay billetes de Tiquicia, con arte propio: el de ₡20 con un yigüirro, el de ₡50 con un volcán y el de ₡100 con una guaria. Al pagar valen como colones: se gastan primero las monedas y, si no alcanzan, se parte el billete más chico que sirva y el vuelto vuelve en monedas. En cualquier comerciante hay «Monedas → billetes» (deja 20 sueltas) y «Billetes → monedas». No hace falta migrar nada: los guardados viejos siguen igual.
- **Comida sin castigo:** comer lo mismo llena siempre igual. La variedad del día tiene premio: tres comidas distintas dan aguante por 6 minutos, y cinco dan además fuerza (más daño). La ficha de cada comida dice si cuenta como nueva hoy, y «comer rápido» prefiere la que no ha comido.
- **Barrido en cualquier dirección:** Ctrl + Espacio (o la Z, que se puede cambiar en Ajustes) lo barre hacia donde camina: adelante, a los lados o para atrás (para atrás, más corto). Ya no hace falta ir hacia adelante. La vista se ladea hacia el lado del barrido.
- **Cofres:** con un cofre abierto se marca en verde lo de su inventario que calza ahí, sea porque el cofre ya lo tiene o por la categoría que dice su nombre o la que domina adentro. «Apilar rápido» ahora se llama «Guardar lo que ya hay aquí».
- **Mapa:** además de arrastrarlo, se mueve con WASD o las flechas.

## 11.9.2 — 2026-11-11 · Segunda revisión
Arreglos de la revisión independiente de la 11.6.2 a la 11.8.0 (`docs/revisiones/REVISION_v11.6.2-v11.8.0.md`).
- **Clic central en pelea:** con un bicho a tiro es siempre el golpe fuerte, aunque el arma esté enfriando. Antes podía caer en «elegir bloque» y quitarle la espada.
- **El escarabajo rinoceronte** volvió a sonar al pegarle: un comentario a media línea se había tragado su sonido. `tools/revisar-datos.mjs` ahora avisa si vuelve a pasar.
- **«Ordenar la casa»** y «A cofres cercanos» solo tocan los cofres que usted puso con la mano. Quedan fuera los dos cofres de cada bolso y los de misión o botín. Un cofre con nombre propio que no es una categoría («Provisiones del abuelo») se deja tal cual.
- **Herramienta sola:** la guardia de pelea es solo para armas (el pico, el hacha o la pala ya no se quedan sin cambiar con una Sombra cerca), y solo cuenta a los bravos de verdad: una gallina a la que se le pegó una vez ya no cuenta.
- **Bote:**
  - se revisa todo el casco (proa, popa y costados), también al girar;
  - si ya roza, solo gira o avanza para soltarse;
  - en tierra apenas se arrastra;
  - para varar, el casco subido tiene que caber entero;
  - deja de flotar sobre la orilla de un charco.
- **Clic central:** agarra el objeto de verdad (la antorcha de pared da antorcha y el horno prendido da horno) y no toca las casillas fijas.
- **Arena:** las caídas hacen fila, unas 24 por cuadro, sin recursión. Un techo de arena grande ya no suelta miles de bloques de un golpe.
- **Saltos con anillo:** si al puma, al Jaguar viejo, a la brincona o a la Reina los aturden a media preparación, vuelven a marcar el anillo. Antes brincaban sin aviso.
- **Más arreglos:**
  - la antorcha de pared se apunta pegada a su pared;
  - el baúl cuenta como cofre para la casa y el lote;
  - un arrastre del mapa ya no se traga el clic siguiente;
  - «Movimiento tranquilo» llega a los portones y responde si el sistema cambia;
  - en creativo, soltar fuera del inventario borra en vez de crear 64;
  - soltar fuera de la ventana ya no tira nada;
  - el tope de cosas en el suelo (400) nunca se lleva un objeto único.

## 11.9.1 — 2026-11-11 · Lo que estorbaba
- **Recetas que no salían:** el cartelito tenía la misma receta que el trompo, el plato la del bote, la cajuela la de las estacas y la jabalina la de la lanza; el mazo de hierro no salía nunca (su patrón tenía una columna vacía). Ahora el **cartelito** es tabla sobre palo, el **plato** es una tabla sobre tres, la **cajuela** son las estacas boca abajo y la **jabalina** lleva dos palos abajo. Además, una receta con forma le gana a una sin forma con los mismos ingredientes.
- **Chequeos automáticos:**
  - `tools/revisar-recetas.mjs` pone cada receta en la mesa y avisa si otra le gana o si no sale. Quedaron 0.
  - `tools/revisar-nombres.mjs` revisa ids, claves, nombres e íconos de los 292 ítems. Encontró y se arregló: la escritura de la casa y la del lote compartían clave; había dos «Arroz con leche» (el de la receta aprendida ahora es «de Zenaida»), y dos bloques se llamaban «Ceniza» (el fino ahora es «Capa de ceniza»).
  - Lo de «la mena dice Puerta» y «el trompo dice yuca» era la ficha del inventario, ya arreglada en la 11.8.
- **Arena flotando:** al cargar el mundo, la arena, la grava o la ceniza que el generador dejaba colgando sin nada firme debajo se vuelve arenisca, piedra o basalto. Y si uno le quita lo de al lado, la que queda suelta se cae.
- **Insolación:** solo cuenta a cielo abierto, de día y sin lluvia; bajo techo no, y bajo un árbol a medias. Ya no es un dado cada segundo: se acumula con unos 90 s de sol seguido (sin sombrero y con poca agua) y baja rápido a la sombra. El calor de la sed sigue la misma regla.
- **Agua hervida:** la cantimplora que se llena en el río queda «sin hervir» y a veces cae mal. Con ella en la mano, clic derecho a una fogata la hierve. Al apuntarle a la fogata lo dice, la ficha también, y la ayuda lo explica.
- **Golpes con aviso:** la cornada del Toro Guaco, el zarpazo del puma y los demás golpes de los bravos ahora se preparan y brillan (pasan por `atacar()`). La estampida de los saínos sigue igual: ya avisa con el castañeteo.
- **Herramienta sola:** además de mantener el clic, no cambia si acaba de tirar un espadazo (1.5 s).

## 11.9.0 — 2026-11-11 · Un texto a la vez
nanoyackson, después de jugar: «es demasiado texto en muy poco tiempo». El juego ahora habla menos, más despacio y por orden de importancia.
- **Un solo locutor** (`src/locutor.js`): todos los avisos, consejos, comentarios, logros y registros pasan por ahí. Sale uno a la vez, con fundido.
- **Lo que tarda en leerse:** cada texto se queda 2.5 s más unos 55 ms por letra (tope de 9 s), con una pausa de 0.6 s antes del siguiente.
- **Por importancia:** lo **urgente** (peligro, tsunami, incendio, se rompió la herramienta) corta lo que haya y pasa adelante. Lo **importante** (logros, capítulos, jefes, plata) espera su turno. Los **consejos** esperan a que haya 8 s de calma y nunca salen peleando. Lo de **ambiente** (radio, partido, sanatorio, el hongo) se bota si hay fila o si ya salió otro hace menos de 45 s. El **registro** («Volando», «Guardado», lo nuevo del bestiario) va al rincón de lo recogido.
- **En plena pelea** (un bravo a 12 bloques o un golpe en los últimos 4 s) solo sale lo urgente.
- **Sin ráfagas:**
  - a lo sumo 6 textos no urgentes por minuto;
  - fila de 4 como máximo;
  - el mismo texto repetido se junta en uno solo («×2»);
  - los logros hacen fila con lo demás: antes se encimaban varias tarjetas;
  - los vecinos ya no hablan a más de 14 bloques, y como mucho tres a la vez.
- **Nada se pierde:** la pestaña nueva «💬 Lo que se dijo» de la libreta tiene los últimos 60, con la hora del juego, incluidos los que no salieron.
- **Ajustes nuevos:** «Avisos en pantalla» (Pocos: sin comentarios y cada consejo una vez · Normal · Todos: sin tope por minuto) y «Velocidad de lectura» (Tranquila ×1.4 · Normal · Rápida ×0.75).
- **Textos más cortos:** se recortaron 60 avisos de más de 90 letras. Ya no queda ninguno fijo que pase de 96. Las teclas de los vehículos dejan lo básico y el resto queda en la ayuda.
- **Medido** en un mundo de prueba, 5 minutos simulados caminando de día: el juego quiso decir **25 textos (unos 5 por minuto, con picos de 3 en 4 segundos)**. Antes salían todos, con los logros encima. Ahora salen como mucho **6 por minuto, de a uno**, y 7 de esos 25 se fueron al rincón del registro. En la prueba de ráfaga (20 textos en 2 segundos) salieron 8 en 30 s, en orden de importancia, y los demás quedaron en el historial.

## 11.8.0 — 2026-11-11 · Manos libres y casa ordenada
Pedidos de nanoyackson jugando.
- **La herramienta sola espera:** solo cambia de herramienta si usted mantiene el clic en el bloque (un tercio de segundo). Si en plena pelea el espadazo se va al piso, ya no le quita la espada; y con un arma en la mano y un bicho bravo a menos de 5 bloques, no la cambia aunque mantenga el clic.
- **Clic central:** agarra el bloque que está mirando. En supervivencia, si lo anda encima, se lo pone en la mano (de la barra lo selecciona; de la mochila lo trae). En creativo lo copia. Si hay un bicho al alcance y tiene arma, sigue siendo el golpe fuerte (y la F también).
- **Tirar cosas desde el inventario:** con algo agarrado, suéltelo afuera de los paneles y cae al suelo (clic derecho: de a uno). La Q también sirve con el inventario o un cofre abierto: tira una de la casilla que tiene debajo del mouse, y con Ctrl la pila entera.
- **Cofres con nombre:** el lápiz ✏️ del título le pone nombre al cofre, y el nombre sale al apuntarle.
- **Baúl grande:** 54 espacios. Se hace con dos cofres y un lingote de hierro.
- **«Ordenar la casa»:** desde un cofre suyo, junta lo de los cofres cercanos y lo reparte por categoría (herramientas, comida, minerales, madera…). El cofre que se llama «Minerales» se queda con los minerales. A los que no tienen nombre les pone uno sugerido, que usted puede cambiar. «Ordenar» también acomoda por categoría.
- **Mesa de trabajo e inventario:** ya no se cortan. En la mesa, las recetas van a la par del inventario. En el inventario normal, el personaje y las recetas van a la izquierda y el inventario a la derecha, y en pantallas anchas las tres columnas. En la lista de recetas va el nombre corto; el resto sale al pasar el mouse.
- **Mapa:** se arrastra para mirar más allá; doble clic o C lo vuelve a centrar en usted. El título ya no se ve doble.
- **Formas reales:** la puerta cerrada choca como una tabla y no como un cubo. El cofre es un poquito más chico. Al apuntar, las losas, las puertas (abiertas o cerradas), las plantas y las antorchas se seleccionan por su forma, con el contorno ajustado.
- **Modelos:** las patas de los cuadrúpedos llevan muslo y paleta redondos que se meten en el cuerpo, y ya no se ven pegadas; además son menos cuadradas.
- **Arreglos:** la ficha del inventario se queda con lo que hay de verdad en la casilla (una mena de hierro decía «Puerta»). La arena flotante ahora se cae al quitarle lo de al lado. El bote ya no se mete de trompa en la tierra ni trepa la playa escalón por escalón.

## 11.7.0 — 2026-11-11 · Balance medido
- **Aturdimiento según la vida real:** las Sombras con estrellas, las de los asedios y las que suben con los días ya no se tambalean con cada golpe, como si tuvieran la vida de una común. Ahora pegan entre medio, y una espada sola ya no las deja atontadas de corrido.
- **Bichos que mataban de entrada:** el escarabajo rinoceronte pega 4 (antes 6). El cangrejo tenaza pega 2 (antes 3), y su tenaza deja pasar el 40 % del corte en vez de atajarlo todo.
- **El Jaguar viejo** pega 7 (antes 9). Ahora se agazapa y marca con un círculo rojo dónde va a caer; si usted se sale, se salva.
- **Don Cornudo** tiene 280 de vida (antes 340) y pega 7 (antes 8).
- **Consejo nuevo:** la primera vez que una cáscara o la tenaza le ataja un filo, el juego le dice que eso pide algo contundente o pegarle de lado.
- Medido con el bot antes y después: tabla en `docs/BALANCE.md`.

## 11.6.2 — 2026-11-11 · Revisión
- **El círculo rojo dice la verdad:** el puma, la Sombra brincona, la Reina Bananera y la Mona saltan al punto que marcaron al empezar el amago. Si usted se sale del anillo, se salva. Antes el salto lo perseguía y caía encima igual. El anillo se va justo cuando aterrizan.
- **Más mordidas con aviso:** el Jaguar viejo, el Cocodrilo del Tárcoles, la Terciopelo reina, el Murciélago Rey y el picotazo del Rey Zopilote ahora se preparan y brillan, y se pueden parar con parry.
- **Don Cornudo** sacaba un carril rojo por cuadro mientras se echaba para atrás (decenas encimados y un ruido metálico seguido). Ahora sale uno.
- **La Arpía y la Tulevieja** dejaban de brillar después de un parry o un tambaleo. Ya brillan siempre.
- **En pausa** los avisos y los portones se quedan quietos, igual que las criaturas.
- **Portones:** abrir y cerrar rápido ya no hace parpadear el bloque, y cada apertura remalla una vez menos.
- **Bolsos:** se recuerdan hasta 20 (antes 5, y el sexto dejaba un cofre sin marca). La brújula del inframundo y el consejo al morir miran todos.
- **Más arreglos:** la mano izquierda de los puñetazos cambia con la apariencia; los vecinos ya no se quedan con el codo doblado; «Movimiento tranquilo» respeta también la opción del sistema en la cámara; un golpe a medio camino ya no se resuelve al cambiar de mundo o al morir; los avisos que quedaban se limpian al cambiar de mundo.
- **Por dentro:** una sola tabla de poses de golpe, `todosBolsos` en todos lados, importaciones fusionadas y menos trabajo por cuadro en el personaje de tercera persona.

## 11.6.1 — 2026-11-11 · El bot vuelve a contar
- **Herramienta, sin cambios en el juego.** El bot de balance (`tools/bot-pelea.js`) contaba las bajas en el clic, pero desde la v11.3 el golpe conecta después: siempre daba 0. Ahora cuenta bajas y golpes cuando el golpe de verdad llega.
- **Duelos:** uno contra uno con 23 enemigos (bichos por bioma, élites con estrellas, la minijefa y tres jefes) y tres equipos (madera sin armadura, hierro con cuero, diamante). Da tiempo para matar y daño recibido.
- **Arreglos del bot:** apuntaba a la Sombra equivocada mientras el arma viajaba, perseguía Sombras paradas en un risco encima de la cancha y peleaba encima de la casa que dejaban los asedios.
- **Balance medido de nuevo** en `docs/BALANCE.md`, con una lista de ajustes propuestos (sin aplicar).

## 11.6.0 — 2026-11-11 · Lo que viene de lejos
- **La Sombra hondera se prepara:** sube el brazo, la honda zumba dando vueltas sobre la cabeza y brilla en dorado justo antes de soltar; la piedra deja estela. Con escudo se para. Antes tiraba de una y el brazo ni se movía, porque la animación de las Sombras lo pisaba.
- **Escupitajos de jefes:** brillo rojo al salir.
- **Lo que cae del cielo marca el suelo:** los rayos de la Arpía y del Rey Zopilote, los mangos del Mono congo y los cañonazos de la goleta dejan un círculo rojo donde van a caer.

## 11.5.0 — 2026-11-11 · Dorado para parar, rojo para quitarse
- **Colores que dicen qué hacer:** el brillo dorado es para el parry; el rojo, para quitarse del camino.
- **Embestidas con carril:** el Toro Guaco, el toro del redondel, el escarabajo rinoceronte y Don Cornudo marcan en el suelo una franja roja por donde van a pasar, que los sigue mientras apuntan; al final brilla en rojo. Igual con la lengua del Tata Sapo y el ataque de la Cascabel.
- **Saltos con círculo:** la Sombra brincona, la Mona, el puma, la Reina Bananera, el Mono congo gigante y el Rey Zopilote marcan un círculo rojo donde van a caer.
- **El puma se agazapa** antes de tirarse, con su bufido, para que dé chance de voltearse.
- **Arreglo:** el brillo rojo de las embestidas se perdía antes de dibujarse.

## 11.4.0 — 2026-11-10 · Combate con peso
- **Sus golpes pesan:** el arma arranca al hacer clic y conecta cuando llega, a medio camino. Si el enemigo se quita, se va al aire. Cada arma da su paso adelante y la vista acompaña el corte.
- **Puñetazos con las dos manos:** directo, directo con la izquierda y gancho.
- **En tercera persona** por fin se ve el golpe completo: el brazo se arma y suelta, el tronco gira, las piernas dan el paso y el arma se dobla con el codo. Antes el personaje se quedaba tieso.
- **Enemigos con más maña:** los jefes encadenan golpes, la gente grande a veces también, y entre golpe y golpe se mueven alrededor de uno midiendo la distancia. Si el golpe viene de donde no está viendo, una marca roja avisa antes.
- **Interacciones:** abrir, agarrar y usar estiran la mano, y al comer la mano va a la boca también en tercera persona. Las voladoras avisan con el mismo brillo.

## 11.3.0 — 2026-11-10 · Golpes que se ven venir
- **Golpes que se ven venir:** todo ataque cuerpo a cuerpo de Sombras, gente, leyendas, bichos y fieras ahora se carga, suelta y se recupera con el cuerpo: el arma sube, el tronco gira, las piernas dan el paso y al soltar deja un arco.
- **El brillo del parry:** justo antes del impacto brilla la mano o la cabeza y suena un tin. Cubrirse al verlo cae dentro de la ventana del parry.
- **El golpe se puede esquivar:** ya cargada, la criatura queda comprometida; si uno se quita del frente o se aleja, se va al aire y queda descubierta.
- **El parry se siente:** el mundo se frena un toque, al enemigo se le bota el brazo y queda tambaleando con la cabeza caída.

## 11.2.0 — 2026-11-10 · Armadura a la medida
- **Armadura a la medida:** cascos, pecheras con hombreras y canilleras, grebas con rodillera, botas y escudos ahora tienen forma y siguen el cuerpo, en vez de cajas encima. Se doblan con rodillas y codos. También los sombreros, la mascarada y la capa de la Arpía.

## 11.1.0 — 2026-11-10 · Con coyunturas
- **Rodillas y codos:** el personaje, los vecinos, los Chatas y el Bailarín doblan las piernas al andar y al sentarse, y los brazos en el vaivén. La armadura de piernas se dobla con ellos.
- **Golpes con cuerpo:** las criaturas se echan para atrás según de dónde les pegan; antes de atacar se preparan, y Chatas, chupacabras, Mico Malo y bécquer ahora dan tiempo de levantar el escudo.
- **Gente con gestos:** quietos se rascan la cabeza, se cruzan de brazos, se estiran, miran la muñeca y saludan al que llega; hablando asienten.
- **El mundo al paso:** el zacate y las hojas sueltan pedacitos al rozarlos, el suelo suelto levanta polvo, el salto también, y en agua bajita salen ondas.
- **Empapado:** el agua y el aguacero sin techo mojan. Mojado gasta más comida y de noche da escalofríos; la fogata seca rápido.

## 11.0.0 — 2026-11-10 · Que se sienta natural
- **Interfaz sin cortes:** todas las pantallas entran y salen con fundido; entrar al mundo y morir también. Botones que se hunden, barra rápida que crece al escoger, avisos que suben.
- **Barras que hablan:** el corazón, la comida o el agua que cambia destella o brinca; lo que se acaba late; con comida en la mano, la barra enseña hasta dónde llenaría.
- **Recoger:** el objeto se encoge rumbo al pecho, aparece «+3 Madera» al lado, los montones iguales se unen en el suelo y la mochila llena avisa sin dejarle el objeto pegado.
- **Agua:** chapuzón según qué tan duro cae, el agua lo mece, la mano bracea y al sacar la cabeza escurren gotas.
- **Portones y cortinas** se abren con recorrido; cada golpe sacude la grieta del bloque.
- **Supervivencia:** aviso temprano de por qué no corre o no se cura, consejos según lo que le pasa (y saltando lo que ya hizo), varios bolsos marcados a la vez, casillas fijas con Alt+clic y herramienta adecuada al picar (se apaga en Ajustes).
- **Ajuste nuevo:** «Movimiento tranquilo»; también respeta la preferencia del sistema. Textos chiquitos más grandes.
- **Sombreros y gorras** encajados en la cabeza: ya no flotan (vecinos, Chatas, Bailarín, minero, Tulevieja).
- **Arreglo:** con un bloque en la mano ya se puede picar ese mismo tipo de bloque (el tiempo daba inválido y nunca se rompía); un bloque ya no cuenta como pico, hacha ni arma.

## 10.9.0 — 2026-11-10 · Se mueve natural
**Se mueve natural (plan 21, parte 1).**
- **Cámara:** el balanceo entra y sale suave en vez de cortarse al saltar; al aterrizar baja en dos o tres cuadros y vuelve con calma; se inclina apenas al moverse de lado; la sacudida es continua y no ruido, y con un golpe la cabeza se va hacia el lado contrario.
- **La mano:** gira con la inercia al mirar; picar ya no da tirones; poner un bloque es un empujoncito y no un golpe; comer entra y sale suave; reacciona al recibir daño, y las armas también sienten el aire y la carrera.
- **Criaturas:** giran con resorte y velocidad tope, sin latigazos; al borde de un barranco deciden una vez; giran sobre el sitio dando pasitos; respiran con el torso; miran a ratos y no fijo; echan la cabeza para atrás con un golpe. Arañas, escarabajos, cangrejos y ciempiés mueven las patas según lo que andan, sin saltar a cero al detenerse.

## 10.8.0 — 2026-11-10 · Cuerpos con anatomía
**Cuerpos con anatomía** (`src/anatomia.js`), porque el torso de huevo y los hombros no convencían.
- **Superficies suaves:** el kit suma `loft`, que arma el cuerpo por secciones y lo sombrea por vértice, sin facetas.
- **El torso** ahora tiene cadera, cintura, costillas, pecho, hombros que caen y cuello. **Los brazos** salen del hombro y bajan por bíceps, codo y antebrazo hasta la mano; **las piernas** tienen muslo, rodilla y pantorrilla.
- **La ropa va recta como tela:** los cuadros y las rayas siguen la vuelta del cuerpo, ya no salen en rombos.
- Lo llevan el personaje, los vecinos (cada uno con su contextura), los Chatas y el Bailarín. Las caras no cambiaron, y ahora tienen cuello.

## 10.7.0 — 2026-11-10 · Lo último en cajas
**Lo último que quedaba en cajas** (`src/modelos-cosas.js`).
- **Bus** de carrocería redondeada con sus franjas, llantas y chofer; **bueyes** de la carreta con giba, papada y cuernos; **globo** de gajos a rayas, de una sola pieza, con canasta de mimbre; **vagoneta** oxidada con remaches.
- **Patito** de la feria, **rana de vidrio** con corazón, huesos y tripa a la vista, y **aguamala** de tentáculos ondulados.
- **El brazo en primera persona** ya tiene manga, puño, mano con dedos y pulgar, y toma la camisa y la piel del vestidor.

## 10.6.0 — 2026-11-10 · Revisión 24
**24.ª revisión: 9 arreglos de los modelos.**
- **Los fantasmas ya no quedan tapados por el agua** ni se ven por dentro: marineros, capitán, minero, ánimas y almas.
- **Partes separadas o flotando:** aletas de la ballena y del tiburón ballena, crestas, tubérculos, baula y tortuga lora sobre la arena, la lora de la Bruja Zárate y la cresta de la pava.
- **Colmillos del congo gigante:** ya no se estiran 30 cm al aullar.
- **Pulpo:** todas las patas van para abajo.
- **Movimientos de cabeza que nunca se veían** (el juego los pisaba): ahora se ven el picoteo del chompipe, el aullido del coyote y del congo, la cabeza gacha de las ánimas, la embestida de los toros y varios más.
- **La raya** se oscurece de noche y parpadea al recibir daño.

## 10.5.0 — 2026-11-10 · Los vehículos
**Los vehículos** (`src/modelos-vehiculos.js`).
- **Carro** con trompa, vidrios, bompers, retrovisores, antena, llantas con rin y sus raspones; **bote** de casco azul y blanco con tablas, borda y remos; **avioneta** con cabina de vidrio, alas con puntales, tren de aterrizaje y hélice.
- **Moto** con tanque, motor de aletas, escape y guardabarros; **bici** de tubos finos, sillín y pedales; las dos con ruedas redondas de verdad y rayos que giran.

## 10.4.0 — 2026-11-10 · El personaje rehecho
**El personaje rehecho** (`src/personaje.js`), para que no desentone al lado de las criaturas.
- Cabeza con cara de verdad (cejas, ojos con pupila, nariz, boca, cachetes, orejas), pelo con mechones y patillas, y sombrero de lona con ala curva, copa abollada y cinta roja.
- Camisa con hombros, cuello, botones y bolsa; faja con hebilla; mangas arremangadas y manos con dedos y pulgar; jeans con costura y remiendo; botas con cordones.
- Sigue respondiendo al vestidor (camisa, piel, pelo y sombrero) y a la armadura, con los mismos pivotes para caminar, pegar, planear y morir.

## 10.3.0 — 2026-11-10 · Los últimos personajes
**Los últimos personajes** (`src/modelos-otros.js`).
- **Bailarín Elegante** de frac, corbata y sombrero de copa, con sus patas de gallo al revelarse; **Bruja Zárate** con moño, nariz larga, bastón torcido y la lora en el hombro.
- **Murciélago Rey** con corona, orejas enormes y alas de dedos largos; **congo gigante** con barba, manto dorado y colmillos.
- **Minero fantasma** con casco, lámpara y pico; **toro del redondel** con su divisa; **ánimas** de la procesión con capucha hueca y vela.
- **Sapo**, **tortuga lora** y **zancudo**.

## 10.2.0 — 2026-11-10 · Lo que quedaba de la fauna
**Lo que quedaba de la fauna** (`src/modelos-finales.js`).
- **Mantarraya** con sus cuernitos enroscados, **pulpo** de tentáculos anillados y pupila acostada, **tiburón ballena** con puntos, bocota y rémoras, **mapache** con antifaz y cola anillada.
- **Ranas** calzonuda y dardo, **tortuguita** y **loro** de frente roja.

## 10.1.0 — 2026-11-10 · El mar y las aves de monte
**El mar y las aves de monte** (`src/modelos-mar.js`).
- **Delfín** con sonrisa y aletas; **ballena jorobada** con surcos, tubérculos, percebes y aletas largas y blancas; **tiburón martillo** con agallas y ojos en las puntas; **peces** de cada especie con su dibujo.
- **Manatí** con bigotes y cola de paleta; **baula** con las quillas de su concha de cuero; **raya** con aguijón.
- **Marineros fantasma** con harapos de neblina y el **capitán de la goleta** con tricornio, parche, barba y farol verde.
- **Martilla** de ojos enormes y cola enroscada; **pava** con papada roja; **chompipe** con carúnculas, moco y abanico de plumas.

## 10.0.0 — 2026-11-10 · El volcán y la Arpía
**El volcán y la Arpía** (`src/modelos-volcan.js`).
- **Ceniciento** de ceniza con vetas de brasa que alumbran; **zopilote de fuego** con las puntas de las alas encendidas.
- **Señor del Arenal:** gigante de basalto con hombros de picos, corona, dientes, vetas de magma y el corazón de lava en el pecho.
- **Arpía de la Tormenta:** pecho blanco con banda negra, disco en la cara, pico ganchudo, copete doble que se levanta, alas barradas y garras enormes.

## 9.9.0 — 2026-11-10 · Revisión 23
**23.ª revisión: lo que el resto del código asumía de los modelos viejos (11 arreglos).**
- **Los trajes de los vecinos habían dejado de ponerse** desde v9.3: bailes del punto guanacasteco, cuidacarros, lavanderas y turista influencer. Ya vuelven a salir.
- **Anselmo** ya no se queda negro después de darle de comer.
- **Avisos por color:** las patas del Ciempiés Rey se prenden de verdad cuando el anillo se cierra, también de noche; los ojos del Bailarín se ponen rojos al revelarse.
- **Sombras jefas:** ya no quedan negro puro ni apagan su calavera. **La acechadora** ahora solo muestra los ojos, como dice el bestiario.
- **Caballo y venado** conservan la inclinación del cuello. **Sombras del monte** y **vampiro** son más grandes de verdad. **La sirena** recupera el brillo de aleta y escamas.
- Los retratos del bestiario y las etiquetas de las mascotas ya no dejan memoria sin liberar.

## 9.8.0 — 2026-11-10 · Alimañas y almas
**Las alimañas y las almas** (`src/modelos-alimanas.js`).
- **Alacrán** con la cola enroscada de verdad y su aguijón; **tarántula** peluda de patas articuladas; **bocaracá** amarilla con las «pestañas» sobre los ojos; **coral** y **falsa coral** con sus anillos en el orden correcto.
- **Alma en pena** con capucha hueca y manto en harapos. Antes su transparencia no se aplicaba (el material era una lista); ahora sí se ve translúcida.

## 9.7.0 — 2026-11-10 · Más animales silvestres
**Más animales silvestres** (`src/modelos-silvestres.js`).
- **Zorro pelón** de cara blanca, orejas negras y cola pelada; **ardilla** con la cola enorme sobre el lomo; **guatusa** alta de ancas; **coyote** de ojos amarillos y lomo oscuro; **oso hormiguero** con su chaleco negro, hocico larguísimo y lengua.

## 9.6.0 — 2026-11-10 · Las leyendas ticas
**Las leyendas ticas rehechas** (`src/modelos-leyendas.js`): lo más propio del juego.
- **Cadejos** negro y blanco: perrazo de crin erizada, colmillos, cascos de cabra y cadenas de eslabones que arrastra.
- **Segua:** traje típico con cintas de colores, cara bonita con flor en el pelo y, al transformarse, cabeza de yegua descarnada con dientes.
- **Padre sin Cabeza** con sotana, botones, rosario y candela. **Llorona** con el pelo mojado sobre la cara, lágrimas y vestido que se deshace.
- **Carreta sin Bueyes** pintada a la tica, con ruedas de estrella, arcos y yugo. **Duende** con gorro doblado, barba, cinturón y saco.
- **Mona** jorobada con rebozo, nariz ganchuda y greñas. **Viejo del Monte** de corteza, con cara tallada, barba de bejucos, cuernos de rama y pies de raíz.
- **Tulevieja** con sombrero de tule, patas de ave y alas. **Sirena** con cola de escamas.

## 9.5.0 — 2026-11-10 · Los animales menores
**Los animales menores** (`src/modelos-menores.js`).
- **Mono congo** con manto dorado y barba; **murciélago** y vampiro con membranas entre los dedos; **quetzal** con copete, pecho rojo y las plumas larguísimas de la cola; **tortuga** con placas y aletas.
- **Colibrí**, **morfo** con alas azules de borde oscuro, **tití** de cara blanca y hocico negro, **tepezcuintle** con filas de manchas, **rana calzonuda** de ojos rojos que se ven de noche y **gato** en tres pelajes.

## 9.4.0 — 2026-11-10 · Más fauna tica
**Más fauna tica rehecha** (`src/modelos-aves.js`).
- **Perezoso** con antifaz, sonrisa, musgo en el pelo y garras largas; **mono cara blanca** con capita negra y cara rosada.
- **Tucán** con el pico enorme en verde, naranja y rojo; **lapa** con alas de plumas rojas, amarillas y azules, cara blanca y pico curvo.
- **Iguana** con cresta, papada y cola anillada; **armadillo** con concha de bandas que se hace bolita.

## 9.3.0 — 2026-11-10 · La gente del pueblo
**La gente del pueblo rehecha** (`src/modelos-gente.js`).
- Cuerpo con hombros y cintura, brazos con manos y pulgar, piernas con zapatos, y faldas de verdad en vez de pantalón de color.
- Camisas lisas con botonadura, a cuadros, a rayas, de la Sele, rojinegras o moradas, algunas de manga corta.
- Sombreros con ala curva y cinta, gorras con visera, melena larga, delantales con bolsa, mantilla de beata, botas y mecate enrollado del sabanero.
- La cara por persona se conserva. Medido en un pueblo con 50 vecinos: de 8 a 10 ms por cuadro.

## 9.2.0 — 2026-11-10 · Animales de finca y de monte
**Los animales de finca y de monte abierto** (`src/modelos-finca.js`).
- **Danta** con trompa que se mueve, orejas de borde claro y crin corta; **venado** con astas ramificadas y cola blanca; **pizote** con hocico respingado y cola anillada; **terciopelo** con cabeza de lanza y rombos.
- **Vaca brahman** con giba, papada y ubre; **perro zaguate** con manchas y orejas caídas; **caballo** con crin, copete, cascos y montura; **gallina** con cresta, cola levantada y patas de dedos.
- Probados en el mundo, incluidos la montura del caballo y el cofre de la danta.

## 9.1.0 — 2026-11-10 · Más del monte rehecho
**Más gente y animales del monte rehechos** (`src/modelos-monte.js`).
- **Saíno y cuche de monte:** crin parada, collar claro, hocico con disco y colmillos; el cuche, con ojos rojos y colmillos largos.
- **Mico Malo:** pelo erizado, cara con ceño y boca torcida, brazos largos y cola enroscada.
- **Bécquer:** cuerpo redondo con manchas en silla de montar y cabeza de boa.
- **Chatas:** camisa, faja, pañuelo con pintitas, gorra con visera y su machete.
- **Jaguar:** rosetas de verdad, cuerpo pesado y bigotes. **Cocodrilo:** escudos en el lomo, hocico largo con dientes y ojos en lo alto.

## 9.0.0 — 2026-11-10 · Las bravas de cuatro patas
**Las bravas de cuatro patas rehechas** (`src/modelos-bravos.js`).
- **Chupacabras:** cuerpo jorobado y flaco con las costillas marcadas, cresta de espinas moradas, orejas de murciélago, quijada abierta con colmillos y ojos rasgados con pupila roja.
- **Toro Guaco:** masa enorme con giba, cuernos abiertos y curvos con la punta oscura, argolla en la nariz, ojos de brasa y brasas en el lomo.
- **Puma:** cuerpo largo y bajo, cara con hocico claro y bigotes, y la cola larga con la punta oscura.

## 8.9.0 — 2026-11-10 · Las Sombras rehechas
**Las Sombras rehechas** (`src/modelos-sombra.js`), que era la queja original: «ni se ven diferentes».
- **La Sombra base:** manto con pliegues que cae en harapos, capucha puntiaguda con un hueco de verdad y la calavera metida adentro, mangas anchas con jirones y manos de hueso con garras. Las del monte llevan cornamenta ramificada.
- **Cada variante se reconoce por la silueta**, además del color de los ojos: la hondera con pañuelo, faja y bolsa de piedras; la del escudo con escudo de tablas redondo, casco con cresta y hombreras con púas; la ladrona con antifaz de aros y saco con monedas; la grande con cuernos curvos; la apagadora con su apagavelas de lata; la brincona con púas en el lomo.
- Probadas las ocho en el mundo: se mueven, se deshacen al morir y no dan errores.

## 8.8.0 — 2026-11-10 · Revisión 22
**22.ª revisión: 12 hallazgos de v8.0 en adelante.**
- **Hongo reventón:** ya no impide dormir ni viajar por ermita, ni hace sonar el cencerro; no nace dentro de la casa; reventarlo da su experiencia y cuenta como baja; no sale con estrellas; se oscurece de noche.
- **Muñeco de práctica:** ya no brinca con cada golpe, solo se para en la tierra, no se encima con otro, se oscurece de noche y no entra al bestiario.
- **Escudo de concha:** solo le devuelve el golpe al que pegó de cerca y no cuenta doble una baja.
- **Don Fermín, el sereno:** camina a su paso de verdad, no pelea a través del piso, deja a la criatura que no alcanza, no le manda encima a uno lo que garrotea, no nace enterrado, no da encargos, se despide al amanecer y, si lo tumban, el pueblo se queda sin sereno un rato.
- **Gancho:** se suelta al montarse en algo o cambiar de dimensión, pide un clic nuevo en vez de relanzarse solo, y la cuerda ya no se corta al jalar.

## 8.7.0 — 2026-11-10 · Los siete jefes rehechos
**Los siete jefes rehechos** (`src/modelos-jefes.js`).
- **Reina Bananera:** corona roja en el lomo, saco de huevos atrás, ojos que brillan y patas anilladas en rojo y oro.
- **Don Cornudo:** élitros oliva con pintas, cuerno enorme con barbita y otro abajo que sube a su encuentro.
- **Tata Sapo:** verrugas, glándulas, buche que se infla y lengua de verdad.
- **Cascabel del Llano:** cabeza de víbora con cejas, rombos en el lomo, lengua bífida y anillos en el cascabel.
- **Cangrejo Rey:** concha de caracol en espiral y tenazas con dientes.
- **Ciempiés Rey:** segmentos redondos, garras de veneno y antenas anilladas.
- **Rey Zopilote:** cuerpo con pechuga clara, collar de plumas, cabeza de colores con carúncula, alas hechas de plumas y primarias separadas como dedos.
- Probados en pelea los siete: se mueven, entran en segunda fase y mueren sin errores.

## 8.6.0 — 2026-11-10 · Bichos con volumen de verdad
**Bichos con volumen de verdad** (`src/lowpoly.js`, `src/modelos-bichos.js`, `tools/pasarela.js`).
- **Kit de modelado low-poly:** una `Pieza` junta bultos (elipsoides deformables) y tubos (patas, cuernos y antenas que se afinan) en una sola malla, con el sombreado horneado en los vértices: luz de arriba, panza oscura, grano y brillo para los caparazones. La luz del mundo los sigue oscureciendo igual.
- **Rehechos con el kit**, dejando de ser cajas: araña bananera (patas anilladas y articuladas, quelíceros rojos, cheurones en el lomo), escarabajo rinoceronte (concha lustrosa con costura, cuerno curvo ahorquillado), sapo bufo (verrugas, glándulas, ojos dorados de pupila acostada), ciempiés (segmentos redondos y ola de patas al correr), cangrejo tenaza (tenaza con dedo que muerde) y hongo reventón (sombrero con laminillas y pecas).
- **Pasarela de modelos:** `tools/pasarela.js` los pone en un escenario neutro para revisarlos de cerca.
- Costo medido: de 4.7 a 4.9 ms por cuadro con 20 bichos.

## 8.5.1 — 2026-11-10 · Arreglo del arranque
**Arreglo urgente: el juego no arrancaba desde v8.5.0.**
- El escudo de concha todavía no tenía ícono y el dibujo de respaldo (`paintFlat`) no conocía la forma de un escudo: se caía al cargar los sprites y la partida nunca abría.
- Ya tiene su ícono (generado con GPT) y el dibujo de respaldo sabe hacer escudos; una pieza sin forma propia ya no puede tumbar el arranque.
- Verificado en el navegador: un desvío a tiempo le devuelve 2.5 veces el golpe a la criatura y al jugador no le quita nada; sin desvío no devuelve.

## 8.5.0 — 2026-11-10 · El hongo reventón y el escudo de concha
**El hongo reventón y el escudo de concha** (`src/hongos.js`).
- **Hongo reventón:** vive en las cuevas, el bosque nuboso y la selva, desde el día 2. Parece un hongo morado cualquiera, no se mueve y no hace nada… hasta que uno se le arrima a 3 bloques.
  - Ahí tiembla y se infla (ese es el aviso) y al segundo revienta: una nube de esporas que marea, envenena y queda flotando 5 segundos.
  - Se esquiva alejándose a tiempo, o reventándolo de lejos con una flecha o la honda (logro «De lejos, por si acaso»).
- **Escudo de concha** (ítem 560, con la pinza del Cangrejo Rey, el cuerno de Don Cornudo y dos hierros): ataja el 85 %, y si se desvía justo a tiempo le devuelve el golpe al que lo tiró (2.5 veces el daño). Se repara con la pinza. Logro «Se lo devolví».
- Bestiario, ayuda y `/prueba hongos`.

## 8.4.0 — 2026-11-10 · 21.ª revisión: 11 arreglos
**La 21.ª revisión: 11 arreglos de la v7.1 a la v7.8.**
- **El tajo de viento** ya no corta a través de las paredes (avanza de a pasitos y revisa el bloque primero), no sale si uno está pegado a una pared, y no le pega a mascotas, botes, ni a los que lo siguen a uno. El mazo y la lanza tampoco.
- **La maestría del arco** tampoco sube con el muñeco.
- **La arremetida de la lanza** ya no cuenta como esquive perfecto, y no se hace si adelante no hay piso (para no tirarse por un barranco).
- **La revancha** tiene su propio doble de botín y experiencia, sin dar el logro de las estrellas. Ahora sí pega más (30 % en sus ataques principales), y la segunda fase llega a media vida real.
- **El golpe fuerte** cuenta la maestría al revisar el aire, igual que el golpe normal.
- **La Sombra acechadora** se deja ver al morir, y sus estrellas sí cuentan en el golpe.
- **El humo contra las abejas** es lo que dice la ayuda: antorcha en la mano, fogata, fogón u horno.
- **Rendimiento:** las abejas ya no crean objetos en cada cuadro, y las texturas del personaje que no dependen del color se reusan entre apariencias.
- **Textos:** sin suponer el género.

## 8.3.0 — 2026-11-10 · El sereno
**El sereno** (`src/sereno.js`). De noche, en el pueblo donde uno anda (no en las ciudades), sale Don Fermín, el sereno, con su farol prendido.
- **La ronda:** camina por la plaza y las calles, y de vez en cuando dice algo («Las doce y todo sereno…»).
- **Si una criatura brava se mete al pueblo:** se le va encima a garrotazos, gritándole («¡Fuera de aquí, sinvergüenza!», «¡Vaya a asustar a su abuela!»).
- **No es invencible:** si hay cuatro o más juntas, se esconde y pide ayuda.
- **Al amanecer** se va a dormir.
- Logro «El sereno cuida el pueblo» y `/prueba sereno`, que hace de noche.

## 8.2.0 — 2026-11-10 · Los golpes de área avisan
**Los golpes de área avisan en el suelo.** Mientras un jefe prepara un golpe de área, se marca en el suelo un anillo rojo que muestra hasta dónde llega:
- el pisotón de Don Cornudo (7 bloques);
- la caída del Tata Sapo, donde va a caer (6);
- el aletazo del Rey Zopilote con las alas rotas (6.5).

Así se sabe cuánto alejarse o cuándo brincar.

## 8.1.0 — 2026-11-10 · El muñeco de práctica
**El muñeco de práctica** (`src/muneco.js`, ítem 559). Se hace con dos tablas, dos palos y una lana. Es un saco relleno de zacate en un palo, con cara cosida.
- **Ponerlo:** clic derecho apuntando al suelo. Mira hacia uno y se bambolea con los golpes.
- **Aguanta todo:** sirve para practicar la cadena de golpes y ver cuánto pega cada arma. Cada 3 segundos de pelea dice el daño total y el daño por segundo.
- **Cambiarle el material:** clic derecho lo pasa por tela de Sombra, caparazón, cuero, escama, piedra o nada, para ver el «¡Débil!» y el «Resiste» de cada arma.
- **Recogerlo:** agachado y clic derecho.
- Queda guardado en el mundo y se vuelve a parar cuando uno pasa cerca.
- Pegarle no sube la maestría, para que no se pueda subir de nivel sin pelear.
- `/prueba muneco` y página en la ayuda. El gancho tiene ahora su ícono pixel art (GPT).

## 8.0.0 — 2026-11-10 · El gancho con mecate
**El gancho con mecate** (`src/gancho.js`, ítem 558). Tres hierros y dos cueros.
- **Cómo se usa:** se apunta a un bloque a hasta 20 de distancia y, con clic derecho, el gancho vuela con su mecate, se clava (suena la piedra) y lo jala a uno hasta allá, cada vez más rápido.
- **Cómo se suelta:** solo, al llegar, si algo lo tapa o a los 2.5 segundos; también con Espacio.
- **No duele:** mientras jala, ni al aterrizar.
- **Para qué sirve:** subir acantilados, cruzar ríos, trepar a los árboles o salir de un apuro en una pelea.
- **Desgaste:** se gasta con el uso (200 tiros).
- **Se suelta solo** al morir o al salir del mundo.
- Página en la ayuda.

## 7.9.0 — 2026-11-10 · El pueblo se entera
**El pueblo se entera.** La gente de los pueblos comenta lo que uno ha hecho con los jefes:
- la Reina Bananera («en la bananera ya nadie revisa los racimos con miedo»);
- Don Cornudo, el Tata Sapo, la Cascabel, el Cangrejo Rey (los pescadores ofrecen una pesca gratis) y el Ciempiés Rey;
- con los seis vencidos, la pista de la Corona («en lo más alto hay alguien esperándola»);
- el Rey Zopilote («hasta tocaron las campanas»);
- las ermitas puestas por los caminos.

Además, el Machete del Viento tiene su ícono pixel art, hecho con GPT.

## 7.8.0 — 2026-11-10 · El Machete del Viento
**El Machete del Viento y la arremetida de la lanza** (`src/legendarias.js`).
- **Machete del Viento** (ítem 557): un machete, dos plumas del Rey Zopilote y un lingote de jade. Es la primera arma legendaria, hecha con lo del jefe final.
  - Pega 10 y aguanta 1500 golpes; se repara con plumas.
  - **Su golpe fuerte suelta un tajo de viento:** una media luna blanca que vuela 14 bloques en línea, corta a todas las criaturas que encuentre (el 70 % del golpe a cada una) y las aturde un poquito.
- **La lanza arremete:** su golpe fuerte lo tira a uno unos 3 bloques para adelante con la estocada (con un instante sin que le peguen), y además atraviesa a los que están en fila.
- Logro «El tajo del viento» y página en la ayuda.

## 7.7.0 — 2026-11-10 · Cada golpe suena a lo suyo
**Cada golpe suena a lo suyo.** Al pegar, el sonido depende del tipo de daño del arma (con sonidos del banco de siempre):
- **Contundente** (mazo, garrote, puño): un golpe seco y grave, más grave entre más pesada el arma, con un retumbo de piedra.
- **Punta** (lanza, cuchillo): una estocada.
- **Corte** (espada, machete, hacha): el tajo de siempre.

Lo atajado no suena así, porque ya suena en el escudo, la concha o el caparazón.

## 7.6.0 — 2026-11-10 · La Sombra acechadora
**La Sombra acechadora** (`src/sombras2.js`). Desde el día 10, de noche, a veces sale una Sombra que casi no se ve.
- **Cómo se ve:** es casi transparente; solo se le ven los ojos blancos. Se deja ver al acercarse a menos de 3 bloques, cuando uno la mira de frente, cuando pega o cuando le pegan.
- **Cómo pelea:** le da la vuelta a uno buscando la espalda. De frente no pega; si uno la sigue con la vista, no encuentra el hueco y sigue rodeando.
- **Por la espalda pega el doble,** con un aviso la primera vez: «voltéese a ver de vez en cuando».
- Es débil al corte, como todas las Sombras. Puede soltar esencia. Está en el bestiario.

## 7.5.0 — 2026-11-10 · Abejas africanizadas
**El enjambre de abejas africanizadas** (`src/abejas.js`). Es un peligro de día, con su propia forma de escaparse. Desde el día 3, en el bosque, el bosque seco, la selva o los llanos, a veces uno pasa cerca del panal y sale el enjambre del árbol.
- **El enjambre:** una nube de 46 abejas amarillas y negras que zumba y lo persigue a uno, más rápido que caminando. Adentro de la nube pican sin parar, con ardor.
- **El arma casi no sirve:** cada golpe espanta unas cuantas (la nube se va achicando), pero hacen falta muchos.
- **Lo que sí sirve:**
  - meterse al agua y quedarse abajo (o agachado en el agua): a los 3.5 segundos pierden el rastro y se van;
  - el humo, de una antorcha en la mano o una fogata a 4 bloques: no se acercan a menos de 5;
  - sacarles 30 bloques corriendo, o aguantar 70 segundos: se devuelven al panal.
- Puede soltar miel. Logros, bestiario, ayuda y `/prueba abejas`.

## 7.4.0 — 2026-11-10 · Maestría por arma
**Maestría por arma** (`src/maestria.js`). Cada clase de arma (espada, machete, hacha, mazo, garrote, lanza, cuchillo, puño, pico, herramienta y arco) sube de nivel aparte, con el uso.
- **Puntos:** cada golpe que entra da puntos según el daño. Lo atajado no cuenta.
- **Niveles:** hasta 20. Cada nivel da un 1.5 % más de daño con esa clase y gasta un 1.5 % menos de aguante por golpe. En el 20, +30 % de daño y 30 % menos de aire.
- **Ritmo:** al principio sube rápido (unos 40 espadazos para el nivel 4) y después cuesta más (el 20 pide unos 4000 puntos).
- **Dónde se ve:** en la libreta, en Habilidades, con su barra. Al subir de nivel sale un letrero.
- **Logros:** «Maestro de un arma» (nivel 10) y «Leyenda del arma» (nivel 20).

Así vale la pena quedarse con un arma, aunque probar otras también rinde.

## 7.3.0 — 2026-11-10 · Las ermitas en el mapa
**Las ermitas en el mapa.** El mapa grande (M) marca cada ermita de camino que uno haya puesto, con su nombre, para saber a dónde se puede viajar y dónde quedó cada una.

## 7.2.0 — 2026-11-10 · La revancha de los jefes
**La revancha de los jefes.** Volver a llamar con la Ofrenda a un jefe del monte que ya se venció trae su revancha.
- Viene más bravo: 50 % más de vida y pega 30 % más fuerte (en sus golpes comunes).
- Suelta el doble de botín y da el doble de experiencia.
- La presentación dice «revancha» con «Volvió más bravo… y con más botín», y la barra dice «(revancha)».
- Logro «La revancha».
- Además, la barra de vida de los jefes ahora se mide contra su vida real (la que traen de más en la revancha), para que no arranque pasada del tope.

## 7.1.0 — 2026-11-10 · 20.ª revisión y las criaturas rodean
**La 20.ª revisión (12 arreglos de la v5.1 a la v6.4) y las criaturas rodean.**
- **Rodean a uno:** las criaturas que persiguen en manada ya no llegan en fila india. Cada una entra por su lado (se abren de lejos y de cerca van derecho), así que en una pelea con varias hay que cuidarse la espalda.
- **Las ventanas de las ermitas y de los créditos son modales de verdad:** el juego queda quieto y sin teclas, Esc las cierra y se quitan al salir del mundo. Antes, Esc abría la pausa por debajo y el mundo podía seguir corriendo con el menú encima.
- **El viaje de ermita revisa todo:**
  - montado, en la tirolesa, la vagoneta, el globo o planeando no se puede;
  - si uno se muere o sale del mundo durante el fundido, no se mueve;
  - el juego queda quieto mientras dura.
- **Las incursiones se ganan peleando:**
  - huir o dejar los bichos atrás ya no da el premio;
  - si uno se aleja más de 60 bloques de la casa, se van;
  - la segunda tanda sale alrededor de la casa, no de donde uno esté.
- **El alcance del arma ya no deja clics muertos:** una criatura más allá del alcance ya no se traga el clic. Se puede picar el bloque de atrás o tirar el golpe al aire.
- **Las estrellas:**
  - comparten material, así que ya no queda una textura sin liberar por cada criatura;
  - la caja de golpe crece con el cuerpo, y las flechas ya no atraviesan la cabeza que se ve.
- **Las barritas de vida** ya no se corren de lado cuando la criatura gira.
- **Las flechas:**
  - las de fuego o envenenadas que fallan se recogen como lo que eran;
  - el arco tira primero la flecha de la ranura de al lado del arco, así que se puede escoger.
- **Partidas viejas:** las bombetas 550 que duraron poco (v5.1–v5.5) pasan a ser las de siempre al cargar.
- **Al salir del mundo** se reinicia el esquive perfecto y la cadena, para que no pasen a otra partida.
- **Textos sin suponer el género:**
  - «vienen por usted» en vez de «a buscarlo»;
  - «Ya no le cabe más» en vez de «Ya está lleno»;
  - «Buen descanso» en vez de «Descansado»;
  - logros «Comer bien da fuerza» y «Un buen descanso».

## 7.0.0 — 2026-11-10 · Su personaje, a su gusto
**Su personaje, a su gusto.** En el vestidor del inventario hay cuatro botones para escoger cómo se ve el personaje:
- 👕 **camisa:** cuadros azul, rojo, verde o morado, amarilla o blanca;
- ✋ **piel:** cinco tonos;
- 💇 **pelo:** negro, café, castaño claro, canoso, azabache o colorado;
- 🎩 **sombrero:** con o sin.

Cómo funciona:
- El personaje se rearma al instante en el vestidor y en tercera persona.
- Se guarda en cada mundo (`meta.apariencia`).
- Los colores mantienen todo el detalle de las texturas pintadas: cuadros, bolsa, botones, sombras.
- El texto del vestidor ahora dice «Arrastre para girar», de usted.

## 6.9.0 — 2026-11-10 · Trofeos de los jefes del monte
**Trofeos de los jefes del monte para colgar** (bloques 645–650). nanoyackson pidió poder colgar el trofeo en la casa, como con el jefe final. Ahora cada uno de los seis jefes del monte da también, la primera vez que se le vence, su trofeo para la casa: la Reina Bananera, Don Cornudo, el Tata Sapo, la Cascabel del Llano, el Cangrejo Rey y el Ciempiés Rey.
- Son aparte del trofeo que se usa en las recetas.
- Cuentan para «Casa de leyenda» y para los logros de trofeos.
- **El del Rey Zopilote** ahora pasa por el mismo sistema: sale una vez, con su aviso de ponerlo en la casa.

## 6.8.0 — 2026-11-10 · Retratos de los jefes
**Retratos de los jefes** (pixel art hecho con GPT, en `public/ui/jefes/`).
- **Los siete retratos:** los seis jefes del monte y el Rey Zopilote tienen el suyo, de 48×48.
- **Dónde salen:** en la barra de vida del jefe, arriba de su nombre, y en «El camino» de la hoja de la partida (en gris los que faltan, a color los vencidos).
- **Arreglado:** los jefes nuevos (los seis del monte y el Rey Zopilote) no mostraban la barra de vida de arriba, porque solo salía con los jefes «enojados» de antes. Ahora sale con cualquier jefe que esté peleando.

## 6.7.0 — 2026-11-10 · La cadena de golpes se ve
**La cadena de golpes se ve.** Debajo de la mira aparecen unos rombitos, uno por cada golpe de la cadena del arma: tres con la espada, dos con el hacha. Se van llenando en amarillo con cada golpe, y el del remate se pone naranja. Una rayita muestra cuánto tiempo queda para seguir la cadena. Así se aprende el ritmo de cada arma.

La barra de los jefes y «El camino» quedan listos para mostrar un retrato de cada jefe en cuanto lleguen los dibujos.

## 6.6.0 — 2026-11-10 · El bestiario dice las debilidades
**El bestiario dice las debilidades.** Cada ficha del bestiario (libreta, tecla K) lleva ahora, en amarillo, a qué tipo de daño es débil la criatura y a qué resiste. Por ejemplo: «Sombra: débil a corte · resiste punta» o «Alacrán: débil a contundente · resiste corte». Así se puede escoger el arma antes de salir.

## 6.5.0 — 2026-11-10 · Conjuntos de armadura
**Conjuntos de armadura** (`src/conjuntos.js`). Con las cuatro piezas del mismo material (casco, pechera, pantalón y botas) se gana un bono propio, y avisa cuando se completa:
- **Cuero, «Andar de baquiano»:** un 8 % más rápido y, agachado, las criaturas lo notan a uno a la mitad de distancia (para colarse).
- **Hierro, «Pecho de hierro»:** cubrirse gasta un 25 % menos de aire y los golpes empujan la mitad.
- **Diamante, «Filo de diamante»:** un 10 % más de daño.
- **Jade, «Corazón de jade»:** la vida se recupera sola, medio corazón cada 6 segundos, aunque no se esté lleno.

La ficha de cada pieza dice qué da su conjunto. Logro «Conjunto completo» y página en la ayuda.

## 6.4.0 — 2026-11-10 · La entrada y la caída de los jefes
**Los jefes con su entrada y su caída.**
- **La presentación:** cuando se llama a un jefe (con la ofrenda o la Corona), aparece su nombre en grande con un apodo debajo, y se desvanece solo:
  - «Señora de la selva»;
  - «El que tumba los árboles»;
  - «El dueño del manglar»;
  - «La que suena antes de morder»;
  - «Rey de la arena y la marea»;
  - «Cien patas en la oscuridad»;
  - «Dueño de las cumbres».
- **La caída:** cuando cualquier jefe muere hay cámara lenta un segundo, un temblor fuerte, un estallido grande de partículas con sus colores, el trueno y el letrero «¡… cayó!».

## 6.3.0 — 2026-11-10 · Las Sombras se deshacen
**Las Sombras se deshacen** (`src/entities.js`). nanoyackson pidió mejorar la muerte, y ahora también la de las criaturas.
- **Las Sombras ya no caen de lado como cualquiera: se deshacen.** La tela se desploma y se ensancha, la Sombra se hunde en una columna de humo negro con brasas, y los ojos quedan brillando un instante antes de apagarse.
  - Lo hacen todas las variantes.
  - La animación es un poquito más larga (1.15 s).
- **Las demás criaturas** levantan polvo cuando pegan contra el suelo al caer.
- **Por dentro:** una criatura puede traer su propia muerte con `kind.morir(m, dt, esc, g)` y `kind.morirDura`.

## 6.2.0 — 2026-11-10 · Las incursiones del monte
**Las incursiones del monte** (`src/incursiones.js`). Vencer a un jefe tiene su precio. Desde el día 6, cada tres noches (las que no hay asedio), si uno anda cerca de la casa o de donde duerme, vienen a buscarlo los bichos del bioma de algún jefe ya vencido:
- de la Reina, bananeras;
- de Don Cornudo, escarabajos en estampida;
- del Tata, sapos bufo;
- de la Cascabel, luces malas;
- del Cangrejo Rey, cangrejos tenaza;
- del Ciempiés Rey, ciempiés.

Cómo funciona:
- Suena el cencerro y llegan en dos tandas, la segunda a los 25 segundos. Con los días vienen más.
- Si se vencen todas: +40 de experiencia y el logro «Aguanté la incursión del monte».
- Con el sol, o a los 160 segundos, las que queden se van.
- Página en la ayuda y `/prueba incursion`.

## 6.1.0 — 2026-11-10 · Flechas especiales
**Flechas especiales** (`src/armas.js`, ítems 555 y 556, íconos de GPT).
- **Flecha de fuego** (4 flechas, carbón y azufre): echa chispas en el vuelo. Al pegar, la criatura arde 5 segundos, se le ven las llamas y va perdiendo vida.
- **Flecha envenenada** (4 flechas y el veneno de la terciopelo; con la glándula del Tata salen 8): envenena 10 segundos.
- **Qué flecha tira el arco:** la primera clase que encuentre en la mochila, así que basta acomodarlas para escoger.
- **Arreglado:** las flechas marcaban el golpe como de arma en la mano, así que el Rey Zopilote en el aire también las atajaba. Ahora solo ataja el arma en la mano, como dice la ayuda: a las flechas sí les entra.

## 6.0.0 — 2026-11-10 · Barras de vida
**Barras de vida sobre las criaturas** (`src/barras.js`). Cuando uno le pega a una criatura, sobre su cabeza aparece una barrita con lo que le queda, durante 5 segundos. Así se ve de un vistazo a quién le falta poco en una pelea con varias.
- **El color:** verde, después amarillo (menos de la mitad) y rojo (menos de un cuarto).
- **El golpe recién dado** se queda en blanco y se va vaciando atrasado, para que se note cuánto quitó.
- Se ve del mismo tamaño en las criaturas grandes y en las chiquitas, y queda encima de las estrellas cuando las hay.
- **Los jefes no la llevan,** porque ya tienen su barra grande arriba.
- **Por dentro:** son sprites con materiales compartidos, así que no se crean texturas nuevas en cada golpe.

## 5.9.0 — 2026-11-10 · Ermitas de camino
**Ermitas de camino** (`src/ermitas.js`, bloque 644). nanoyackson pidió que la supervivencia fuera más cómoda. Esta es la idea del viaje rápido, a lo tico: las capillitas de cemento con su cruz que hay a la orilla de las carreteras.
- **Cómo se hace:** tres piedras, una antorcha y una flor amarilla. Se pone donde uno quiera: la casa, un pueblo, la entrada de una cueva o el bioma de un jefe.
- **El modelo:** base de piedra, cuerpo blanco con ribete celeste, una ventanita con la candela prendida, techito gris y cruz arriba.
- **El nombre:** cada ermita se llama como el pueblo más cercano o la región («Ermita de Liberia»).
- **Cómo se viaja:** clic derecho abre la lista de las otras ermitas, con su distancia, y se escoge a cuál ir. Se llega al lado, con la pantalla en negro mientras carga el mundo de allá.
- **Con criaturas bravas cerca no se puede viajar,** y entre un viaje y otro hay que esperar 20 segundos.
- Si una ermita desaparece, sale de la lista cuando uno pasa cerca.
- Logros, ayuda y `/prueba ermitas`.

## 5.8.0 — 2026-11-10 · Los créditos con su ilustración
**Los créditos con su ilustración.** El fondo de los créditos finales ahora es una ilustración hecha con GPT (en Codex): el Rey Zopilote planeando sobre una cumbre de Costa Rica al amanecer, con neblina en los valles, heliconias rojas y el personaje (camisa de cuadros y sombrero de lona) viéndolo desde abajo.
- La pantalla aparece poco a poco y las letras tienen sombra para que se lean sobre la imagen.
- Va encima de todo el HUD.
- Está en `public/ui/creditos.jpg`, de 200 KB; el original quedó en `assets-src/ui/`.

## 5.7.0 — 2026-11-10 · Esquive perfecto
**Esquive perfecto y contraataque** (`src/combate.js`). Rodar, barrerse o brincar de lado justo cuando una criatura iba a pegar ya no solo esquiva: es un **esquive perfecto**.
- El mundo va en cámara lenta medio segundo.
- Devuelve 15 de aguante.
- Sale «¡Esquive perfecto!».
- El próximo golpe, en el segundo y medio siguiente, es un **contraataque**: pega ×1.6 y cuenta como crítico.
- Hay que esperar 2 segundos para el siguiente esquive perfecto. Logro «Esquive perfecto» y página en la ayuda.

## 5.6.0 — 2026-11-10 · 19.ª revisión: 20 arreglos
**La 19.ª revisión: 20 arreglos de la v4.95 a la v5.1.** Una revisión independiente leyó todo el código nuevo (la muerte, las armas, los bichos, los jefes, el final y las alas) y también la fumigadora, la panga, el tren fantasma y la carrera, que no se habían revisado.
- **Lo más grave:**
  - **La ofrenda, la Corona y la bombeta en las alas no hacían nada con clic derecho** en supervivencia: solo se llamaban desde «comer» y no son comida. Ahora van al principio del clic derecho. Las pruebas pasaban porque llamaban las funciones directo; ahora se probó con `rightClick()`.
  - **Cubrirse con el arma le quitaba al clic derecho sus usos:** con un arma en la mano no se podía usar el yunque, los portones, el trapiche, la compostera, la olla, el plato, el Corazón ni las cosechas. Ahora, si se apunta a algo que se usa, se usa.
  - **Al Rey Zopilote y a la luz mala no se les quitaba nunca el aturdimiento:** después de un desvío, cada golpe pegaba doble. Ahora se va solo.
- **Medianos:**
  - Lo atajado (escudo, concha, caparazón de frente, tenaza, luz apagada) ya no aturde ni envenena. Mob.hurt ahora dice si el golpe entró.
  - «Por la espalda» se daba siempre en el primer golpe; ahora tiene que ser de verdad por la espalda.
  - Los jefes podían nacer metidos en la roca, sobre todo en cuevas o frente a un cerro. Ahora buscan un hueco libre delante, y si no hay campo, la ofrenda no se gasta.
  - El Tata Sapo y la Reina se quedaban congelados si un brinco caía al agua honda.
  - La bombeta nueva repetía la clave de la de siempre y no se podía fabricar. Ahora las alas usan la bombeta de las fiestas, y la pólvora y la caña brava (de la caña de azúcar de la mochila) son otra receta que da 6.
  - Las alas, el mazo de cuerno, la lanza de colmillo, el cuchillo de pinza y el chaleco de seda no se podían reparar. Ahora se reparan con pluma, cuerno o seda.
  - Para apuntar a la gente y a lo que se monta, el alcance vuelve a ser 3.6. El alcance de cada arma se mide al pegar (puño y herramientas 3.2–3.3).
  - Los créditos esperan a que uno esté vivo y jugando, sin otra pantalla encima. Los rayos y las plumas se acaban con el Rey.
- **Pequeños:**
  - El viento de planear seguía sonando al morir.
  - Abrir las alas a un bloque del suelo salvaba de cualquier caída, y aterrizar a toda velocidad no dolía.
  - El Rey se podía posar dentro de un árbol.
  - El aviso de la Corona no salía si el último jefe era la Reina o Don Cornudo, y se repetía con los demás.
  - El logro de la luz mala salía con el primer golpe.
  - Las crías de la Reina salían de tamaño completo.
  - El empuje del arma quedaba pegado si fallaba un golpe.
- **Textos sin suponer el género:** los mensajes decían «lo enredó», «lo embistió» o «lo masticó», y la panga decía «mi estimado». Ahora usan frases neutras.

## 5.5.0 — 2026-11-10 · Criaturas con estrellas
**Criaturas con estrellas** (`src/estrellas.js`). De noche, desde el día 4, a veces sale una versión más brava de una criatura hostil común. Se reconoce por las estrellas doradas que flotan sobre la cabeza y porque es más grande. Al apuntarle, el nombre lleva sus estrellas.
- **⭐:** el doble de vida, pega 1.5 veces más, es un 15 % más grande, y suelta y da el doble de experiencia.
- **⭐⭐** (desde el día 9): 3.5 veces la vida, pega el doble, es un 30 % más grande, y suelta y da el triple.
- **Cuántas salen:** la probabilidad crece con los días, hasta 22 % para una estrella y 8 % para dos.
- **Cuáles no:** solo las que nacen solas pueden traer estrellas. Las de los asedios y las que llaman los jefes no, y tampoco los jefes, las leyendas ni los bichitos.
- Logros «Una con estrella» y «Dos estrellas al suelo», y `/prueba estrellas`.

## 5.4.0 — 2026-11-10 · El camino
**El camino** (`etapasHTML` en `src/final.js`). La hoja de la partida (libreta, tecla P) tiene una lista nueva con las etapas del progreso: lo hecho en verde con ✔ y lo que falta con ○. Así uno sabe qué sigue sin tener que acordarse:
- sobrevivir la primera noche y llegar al nivel 5;
- hacer la Ofrenda del monte (dice con qué se hace);
- los seis jefes del monte: dónde vive cada uno, el día en que se venció y qué da su trofeo;
- tejer la Corona (cuántos trofeos lleva, de seis);
- vencer al Rey Zopilote y planear con sus alas.

## 5.3.0 — 2026-11-10 · El personaje rehecho
**El personaje rehecho** (`src/personaje.js`). nanoyackson dijo que hacía falta mejorar al personaje: eran cajas de un solo color. Ahora cada pieza lleva su textura pintada en pixel art, con cuatro pixeles por cada dieciseisavo de bloque:
- **Camisa de cuadros azul:** tapeta con botones, bolsa en el pecho, cuello blanco, mangas con puño arremangado y sombras abajo.
- **Faja de cuero con hebilla dorada.**
- **Cara:** cejas, ojos con blanco, pupila café y brillo, nariz con sombra, boca, cachetes y flequillo disparejo.
- **Cabeza:** orejas, pelo con mechones a los lados y atrás, y cuello.
- **Sombrero de lona:** ala con sombra debajo, copa con abolladura y cinta roja con franja amarilla.
- **Manos** con los dedos marcados.
- **Jeans** con costura dorada, tela con hilos y un remiendo en la rodilla.
- **Botas de cuero** con cordones y suela oscura.
- **Lo que no cambia:** los pivotes son los mismos, así que todas las animaciones siguen igual (caminar, pegar, cubrirse, planear, la muerte). Se ve en el vestidor del inventario y en tercera persona.

## 5.2.0 — 2026-11-10 · Comer con fuerza y descansar
**Comer con fuerza y descansar** (`src/fuerza.js`). nanoyackson pidió que la supervivencia fuera más cómoda y con progreso. Son dos ideas nuevas:
- **La comida da fuerza:** las comidas buenas (las que llenan 3 o más, cocinadas) suben la vida máxima y el aguante máximo por unos minutos.
  - Cada una da 1 o 2 corazones y hasta +25 de aguante, y dura de 4 a 9 minutos. Al final se va desinflando.
  - Se pueden tener hasta **tres comidas distintas a la vez**. La misma no se repite hasta que le queda menos de la mitad.
  - Se ven en el HUD, arriba de los corazones, con su barrita (que se pone naranja cuando se acaba).
  - Lo crudo llena, pero no da fuerza. Al morir se pierde.
  - Con más de diez corazones, los corazones se achican para caber.
- **Descansado:** dormir (o la siesta), o quedarse quieto unos segundos bajo techo junto a una fogata o un fogón, lo deja descansado.
  - Mientras dura, el aguante vuelve 50 % más rápido y se gana 25 % más de experiencia.
  - Dura de 3 a 15 minutos según la comodidad del lugar: cama, asiento, mesa, alfombra, flores, trofeos, luz y fuego a 5 bloques, más el nivel de la casa de la abuela si está cerca.
- Logros, ayuda y `/prueba fuerza`.

## 5.1.0 — 2026-11-10 · El final: el Rey Zopilote
**El final: el Rey Zopilote, las alas y las bombetas** (`src/final.js`, `src/alas.js`). nanoyackson pidió «al puro final algo como el jefe final del juego y poder pasárselo», un trofeo para colgar en la casa, poder seguir jugando, y algo para volar con algo parecido a cohetes («sin plagiar demasiado, idea nada más»). Todo es diseño propio:
- **La Corona del monte:** se teje con los seis trofeos de los jefes del monte. Se ofrece de noche, en lo más alto (altura 95 o más, con cielo abierto).
- **El Rey Zopilote** (900 de vida): un zopilote rey gigante.
  - El modelo: cabeza calva de colores (naranja, rojo, amarillo y morado), carúncula, ojos blancos, pico ganchudo, collar de plumas grises, y alas de tres tramos que se doblan y aletean, con las puntas blancas.
  - **Fase 1:** da vueltas alto y se tira en picada: chilla y encoge las alas, y ese es el aviso. Después de cada picada se queda posado unos segundos, y solo ahí le llega el arma. En el aire le pegan las flechas, la honda o la lanza arrojadiza.
  - **Fase 2, la tormenta:** llama rayos (un círculo que brilla en el suelo, del que hay que salirse) y tira plumas como dardos.
  - **Fase 3, con las alas rotas:** cae y ya no vuela. Brinca encima, barre con las alas (las abre antes: hay que salirse o brincar), suelta ceniza que marea y sigue llamando rayos. Va humeando.
- **Al vencerlo:**
  - da la **Cabeza del Rey Zopilote**, un bloque de trofeo para colgar en la casa que cuenta como trofeo;
  - suelta de 4 a 6 plumas;
  - salen **los créditos**, con el botón **«Seguir jugando»**, porque el mundo sigue.
- **Las Alas del Rey Zopilote** (cuatro plumas y dos cueros; se ponen en el pecho):
  - En el aire, cayendo, Espacio las abre y se planea: mirar para abajo da velocidad y mirar para arriba la gasta en altura.
  - La vista se abre con la velocidad y el viento suena según qué tan rápido va. Chocar fuerte contra una pared duele.
  - Se gastan con el vuelo. En tercera persona se ven en la espalda, cerradas o abiertas, con el cuerpo acostado y los brazos abiertos.
- **Las bombetas** (pólvora, de carbón y azufre, más caña brava, de la caña de azúcar):
  - planeando, clic derecho da un empujón con chispas;
  - en el suelo, se tiran al cielo y revientan de colores, como en las fiestas.
- **Íconos de GPT:** los siete ítems nuevos son pixel art hecho con GPT (en Codex), cortado a 32×32 con fondo transparente.
- Logros, ayuda y `/prueba zopilote` (`/prueba zopilote creditos`).

## 5.0.0 — 2026-11-10 · Los seis jefes del monte
**Los seis jefes del monte** (`src/jefes3.js`). Se completa la tanda: ahora cada bioma tiene su jefe, y todos se llaman con la misma Ofrenda del monte, de noche y en su lugar.
- **El Tata Sapo** (manglar, 300 de vida): un sapo gigante con verrugas y glándulas.
  - Infla el buche (ese es el aviso) y saca la lengua en línea recta, hasta 11 bloques. Si lo agarra, lo jala a la boca, lo mastica (7 de daño, veneno y mareo) y lo escupe lejos. Se esquiva moviéndose de lado.
  - Brinca alto y al caer retumba, y salen sapos bufo.
  - A media vida va dejando charcos de veneno.
  - Suelta dos glándulas, que dan el antídoto.
- **La Cascabel del Llano** (bosque seco y llanos de Guanacaste, 280 de vida): una culebra larga con rombos en el lomo y cascabel en la cola.
  - Suena el cascabel y se tira.
  - Se mete bajo tierra, y enterrada no se le puede pegar. El polvo avanza hacia uno, se levanta un círculo de tierra (el aviso) y revienta desde abajo, tirándolo al aire.
  - A media vida escupe veneno.
  - Suelta su cascabel, que da las botas de cascabel.
- **El Cangrejo Rey** (playa, 320 de vida): un cangrejo enorme con una concha de caracol en el lomo.
  - Tira chorros de agua que empujan lejos y corre de lado, cruzándose por delante.
  - Si se le pega mucho seguido, se encierra en la concha, y ahí solo un golpe fuerte con mazo o garrote se la raja.
  - A media vida llama cangrejos tenaza.
  - Suelta su pinza, que da el cuchillo de pinza.
- **El Ciempiés Rey** (montaña, nuboso, páramo y cuevas hondas, 360 de vida): dieciocho segmentos que siguen a la cabeza.
  - Da vueltas alrededor de uno y lo encierra en un anillo. Cuando se le prenden las patas en amarillo, se tira de frente: hay que salirse antes.
  - A media vida escupe veneno.
  - Suelta su colmillo, que da la lanza de colmillo (envenena).
- **Al vencer a los seis** sale el logro y el aviso de la Corona del monte, lo que sigue en el camino al jefe final.
- La ofrenda dice en qué lugares vive cada jefe. Bestiario, ayuda, logros y `/prueba jefes2 tata|cascabel|cangrejo|ciempies`.

## 4.99.0 — 2026-11-10 · Los jefes del monte
**Los jefes del monte, primera tanda** (`src/jefes2.js`). nanoyackson pidió más jefes, y algo como Valheim: llamar al jefe con una ofrenda y que su trofeo abra cosas nuevas.
- **La Ofrenda del monte:** una jícara con flor amarilla, cacao, guaro y una antorcha. Se usa con clic derecho, de noche, en el bioma del jefe.
- **La Reina Bananera** (selva, 260 de vida): una araña enorme con el lomo de marcas rojas, saco de huevos, ojos rojos y quelíceros que se mueven.
  - Da vueltas alrededor de uno y teje en abanico (tres telarañas, cinco a media vida).
  - Tira crías de dos en dos, hasta cuatro.
  - Se levanta (ese es el aviso) y le cae encima a uno: pega 9.
  - A media vida se enfurece y suelta veneno alrededor: hay que salirse del círculo verde.
  - Suelta 3 sedas.
- **Don Cornudo, el escarabajo Hércules** (bosque, 340 de vida): élitros oliva con pintas negras y dos cuernos.
  - Escarba y embiste corrigiendo el rumbo hacia uno: hay que esquivarlo a última hora.
  - Si choca contra un árbol o una pared se le traba el cuerno 4 segundos, y ahí recibe todo. De frente el caparazón aguanta el 80 %.
  - De cerca se echa para atrás para tomar impulso.
  - A media vida da pisotones que solo se esquivan brincando.
  - Suelta su cuerno.
- **Lo que sale de los trofeos:**
  - **Mazo de cuerno:** daño 14, pega en área y rompe escudos.
  - **Chaleco de seda bananera:** protección 6, y las telarañas no se le pegan.
  - **Cuchillo de monte** (hierro y palo): la clase cuchillo, que pega el triple por la espalda.
- **Ya definidos para lo que viene:** la lanza de colmillo (envenena), el cuchillo de pinza (hace sangrar), las botas de cascabel y el antídoto del Tata, que quita el veneno y lo aguanta 4 minutos.
- **Íconos hechos por GPT:** los 14 ítems nuevos los dibujó GPT desde la app de Codex. Son pixel art de 32×32, ya cortados, con fondo transparente. El pedido está en `docs/prompts-items/jefes.txt`.
- Logros, bestiario, ayuda y `/prueba jefes2` (`jefes2 cornudo`).

## 4.98.0 — 2026-11-10 · Bichos de cada bioma
**Bichos de cada bioma** (`src/bichos3.js`). nanoyackson dijo «solo sombra me sale» y pidió «cierta variedad por bioma». Ahora, desde el día 2, cada bioma tiene sus bichos de noche, y cada uno pide otra forma de pelear:
- **Araña bananera** (selva, manglar, bosque): desde lejos tira telaraña, y si le pega a uno queda enredado y casi no se puede mover. Después viene a morder, con veneno. Se le cierra la distancia o se ataja la telaraña con el escudo.
- **Escarabajo rinoceronte** (bosque, selva, nuboso): escarba el suelo, levantando polvo (ese es el aviso), y embiste en línea recta. Pega 6 y tira lejos.
  - Brinca los escalones de un bloque, pero contra un árbol o una pared se estrella y queda atontado: ahí se le pega.
  - De frente, el caparazón aguanta casi todo; solo un mazazo de verdad le entra.
- **Sapo bufo** (cerca del agua): brinca hacia uno. Si se le pega de cerca, escupe el veneno de las glándulas (veneno y mareo). Mejor de lejos, con la lanza o cubierto.
- **Ciempiés gigante** (montaña, nuboso, páramo y cuevas): el cuerpo de diez segmentos sigue el camino de la cabeza. Se acerca en zigzag, muerde con veneno y se va para volver por otro lado.
- **Luz mala** (llanos secos de Guanacaste): una luz que flota. Mientras brilla, tira una llamarada. Después se apaga, y apagada no se le puede pegar: se va a otro lado y vuelve a prender. Con el sol se apaga del todo.
- **Cangrejo tenaza** (playa): ataja de frente con la tenaza grande todo lo que no sea contundente, y si se le pega ahí contesta con un pellizco que hace sangrar. Con mazo o garrote, o por el lado.
- **El reparto:** el 45 % de los intentos de aparición de noche van primero a los bichos del bioma, hasta 4 a la vez (7 con los días), lejos de los pueblos y de la luz.
- Cada uno entra con su debilidad al sistema de armas: los de caparazón al mazo, el sapo a la punta y la luz mala casi a nada.
- Están en el bestiario y en la ayuda. Logros nuevos. `/prueba bichos3` los pone delante; `/prueba bichos3 escarabajo` pone uno solo.

## 4.97.0 — 2026-11-10 · Armas con maña
**Armas con maña** (`src/armas3.js`, `src/armasmano.js`). Antes todas las armas eran un número de daño y un tiempo de espera, y como nanoyackson notó, casi no se sentía la diferencia. Ahora cada una pega a su manera:
- **Siete clases de arma,** cada una con su tipo de daño, su cadena de golpes y su golpe especial:

  | Clase | Daño | Cadena | Lo suyo |
  |---|---|---|---|
  | Espada | corte | lado, revés y estocada | |
  | Machete | corte | rápido y barato | |
  | Hacha | corte | baja en diagonal y después un tajo ancho | rompe escudos |
  | Mazo | contundente | de arriba, de lado y mazazo | el mazazo pega en área y rompe escudos |
  | Garrote | contundente | igual que el mazo | también pega en área |
  | Lanza | punta | estocadas | alcance 4.6; el golpe fuerte atraviesa a los que están en fila |
  | Cuchillo | punta | puñaladas cortitas | triple por la espalda |

- **Aguante de verdad:** cada golpe gasta aire según el peso del arma. Sin aire no se pega: tiembla la barra y suena un resoplido. Hay que medir la pelea.
- **Cada criatura es débil o resistente a un tipo de daño.** Al pegarle sale «¡Débil!» en amarillo o «Resiste» en gris, y al apuntarle se ve («débil a contundente · resiste corte»):
  - las Sombras se rasgan con el filo;
  - los de caparazón se quiebran a mazazos;
  - a los de cuero y escama les entra la punta;
  - los espantos casi no sienten nada.
- **Aturdimiento:** cada golpe llena una barra según el arma (el mazo llena mucho, el cuchillo poco). Llena, la criatura se tambalea dos segundos y recibe doble.
- **Por la espalda,** o si no lo vio venir, se pega ×1.5; con el cuchillo, ×3 («¡Puñalada!»).
- **El golpe se siente:**
  - el mundo se frena un instante al conectar, más con lo pesado;
  - el empuje depende del arma: el mazo tira lejos y el cuchillo casi nada;
  - las criaturas grandes y los jefes se mueven menos.
- **Cada arma se mueve distinto en la mano:** cortes de lado y de revés con su estela, golpes de arriba, el mazazo al suelo, estocadas largas. El golpe fuerte es el remate con más vuelo. Con cualquier arma se puede tirar el golpe al aire.
- **Cubrirse sin escudo:** con espada, hacha, mazo, garrote, machete o lanza, el clic derecho cruza el arma delante de la cara. Ataja menos que un escudo y el desvío pide más puntería.
- **La ficha del arma** dice su clase, su tipo de daño, la cadena, el aguante por golpe y lo especial.
- Logros «A tambalearse», «Con el arma correcta» y «Puñalada trapera». `/prueba armas` pone las seis armas en la barra y tres muñecos delante.

## 4.96.0 — 2026-11-10 · La muerte con su momento
**La muerte con su momento** (`src/muerte.js`). Antes la pantalla de muerte salía de golpe. Ahora la caída dura unos dos segundos y medio, y después sale la pantalla de siempre, que ahora dice «¡Se murió!».
- **El golpe:** el mundo va en cámara lenta un instante y suena el último latido (dos veces, cada vez más lento).
- **La caída:** el personaje trastabilla con los brazos arriba y se va de espaldas hacia el lado contrario del golpe.
  - Cae hacia donde hay espacio para el cuerpo entero, para no quedar metido en un escalón.
  - Rebota contra el suelo, levanta polvo y queda con los brazos y las piernas abiertos y la cabeza de lado.
  - Lo que tenía en la mano se le zafa.
  - El cuerpo sigue el empujón del golpe y cae al suelo; antes quedaba congelado en el aire.
- **La cámara:** sale de los ojos y se aleja girando despacito alrededor del cuerpo. Escoge el lado más despejado, y entre árboles o en un hueco la toma va casi en picada. Nunca se mete en una pared.
- **La imagen** pierde el color poco a poco, y el HUD se desvanece mientras cae.
- Mientras cae no hay teclas ni clics.

## 4.95.0 — 2026-11-10 · Lo que se vio jugando
**Lo que nanoyackson vio jugando.** Cuatro arreglos que salieron de una partida de verdad.
- **Subir de nivel ya no llena la vida y la comida.** Antes, en una pelea larga, cada nivel lo dejaba a uno como nuevo y las Sombras no daban miedo. Ahora da +2 corazones, y nada de comida.
- **La cámara del cofre** (y de las otras estaciones) ya no se mete en una pared. Prueba primero el frente del cofre, después el lado de uno y después los otros tres. Si ninguno está libre, se queda en primera persona.
- **El viento papagayo no entra a la casa.** Con techo encima y pared del lado de donde sopla, no empuja ni mete polvo, y el silbido se oye bajito, como desde adentro.
- **Cada Sombra se distingue a simple vista,** con ojos de color propio (lo que se ve de noche) y algo en la silueta:
  - hondera: ojos verdes, pañuelo y faja;
  - con escudo: ojos rojos, casco con cresta y hombreras;
  - ladrona: ojos dorados, antifaz blanco y monedas en el saco;
  - apagadora: ojos azules y un apagavelas de sombrero;
  - brincona: ojos amarillo verdoso y púas en la espalda;
  - grande: ojos carmín y cachos.

## 4.94.0 — 2026-11-10 · El tren fantasma
**El tren fantasma** (`src/trenfantasma.js`). Algunas noches, cerca de una estación del tren, se oye un pito que no es de ningún horario: «a esta hora no pasa ningún tren».
- **El tren:** pasa a toda velocidad por la vía de la estación un tren que ya no existe. Todo se ve como aparición, sin niebla.
  - Una locomotora negra con caldera, chimenea que echa humo verdoso, cabina, quitapiedras, ruedas rojas y farol verde.
  - Tres vagones de madera con ventanas que alumbran verde y siluetas sentadas adentro.
- **No para.** La vía se encuentra sola, buscando los rieles de la estación.
- **Si agarra a uno en la vía,** le pasa a través: solo frío (escalofrío y miedo).
- Logros «Vi pasar el tren fantasma» y «Me atravesó el tren fantasma». `/prueba trenfantasma`.

## 4.93.0 — 2026-11-10 · La panga de los pescadores
**La panga de los pescadores** (`src/panga.js`). En la tarde, en las playas cerca de los pueblos, llega del mar una panga (una por día).
- **La panga:** modelo nuevo con casco blanco y franja azul, motor fuera de borda, hieleras de colores y la red. Entra con su motor y su espuma y vara en la orilla.
- **Los pescadores:** bajan Don Macario y Kevin, su hijo. «¡Pescado fresco, recién salido!».
- **La venta:** con clic derecho a Don Macario, tres pescados por ₡6: pargo, corvina y a veces un dorado, hasta cuatro veces. «Hágalo frito con patacones, ya verá».
- **No es negocio revenderlos:** en la pulpería pagan menos.
- A los dos minutos se van mar adentro. Logro «Pescado fresco de la panga» y `/prueba panga`.

## 4.92.0 — 2026-11-10 · La avioneta fumigadora
**La avioneta fumigadora** (`src/fumigadora.js`). De día, sobre los campos de los pueblos (cafetales, bananales, milpas y potreros), a veces pasa una avioneta biplano amarilla. A lo sumo pasa una vez cada quince minutos de juego.
- **El modelo:** dos alas, montantes, cabina, cola, la barra de boquillas y la hélice que gira.
- **El vuelo:** cuatro pasadas, ida y vuelta, bajito y corriéndose de lado en cada una, con el motor sonando.
- **La fumigación:** sobre el campo suelta una nube blanca que baja despacio. Si a uno le cae encima, se marea diez segundos («huele horrible y todo da vueltas»).
- Logros «Me fumigaron» y «Vi pasar la avioneta fumigadora». `/prueba fumigadora`.

## 4.91.0 — 2026-11-10 · La carrera de carretas
**La carrera de carretas** (`src/carrera.js`). Los días de fiesta, de día, a la orilla del pueblo arman una pista derecha de 45 bloques, en un tramo parejo, sin agua ni escalones de más de un bloque (no todos los pueblos tienen dónde).
- **La pista:** un arco de salida azul y una meta roja, los dos con sus cuadros de bandera. Hay tres carretas con bueyes: las de los lados son de Don Chepe y Doña Lupita, y la del medio es para uno.
- **La salida:** al montarse (clic derecho), el juez cuenta «¡Tres… dos… uno…!» con campana y suelta el silbato: «¡ARRE!». Si uno se adelanta, es salida en falso y vuelve al arco.
- **La carrera:** se aprieta W para que los bueyes corran. Los rivales van a su ritmo, con arranques y cansancio, y aprietan casi tanto como uno: hay que ir derechito.
- **El premio:** ₡30 y aplausos para quien gane, una vez por día de fiesta. Si gana un rival: «¡Esos bueyes míos comen mejor que yo!».
- Logro «Ganador de la carrera de carretas», ayuda y `/prueba carrera`.
- **Arreglo:** las mascotas que esperaban que cargara su chunk no entraban en el guardado; si se salía en ese momento, se perdían.

## 4.90.0 — 2026-11-10 · Arreglos de la decimoctava revisión
**Arreglos de la decimoctava revisión** (independiente, de la v4.75 a la v4.86):
- **El serenatero, el «vecino que no es» y el cazador furtivo salían invisibles.** Como se les salta el cerebro para manejarlos, nunca se vestían. Ahora se visten al aparecer, y el serenatero se ve con su guitarra.
- **El jurado del concurso** ya no se va caminando de la mesa ni corre para la casa con la lluvia: se queda y mira a quien se acerca.
- **El globo:**
  - Subirse otra vez mientras Don Fito lo desinfla lo botaba a uno desde 38 bloques. Ahora no deja.
  - Si un viaje se corta en el aire, se baja sano al suelo.
  - Guardar o salir en pleno vuelo deja a uno en el suelo de abajo.
  - Ya no atraviesa cerros: el quemador lo sube.
  - Aterriza bien en las laderas y ya no deja a nadie en mar abierto.
- **La grieta del terremoto** ya no se abre en los pueblos (las calles y la cancha son del generador) ni debajo de lo que uno puso.
- **No pasa de un mundo a otro:** el próximo temblor, el terremoto en curso y los días del globo, la serenata, el impostor y el festival. Antes, después de una partida larga, un mundo nuevo pasaba muchísimo tiempo sin temblores.
- **Los cepos desarmados** se quitan al salir del mundo (ya no con un temporizador suelto).
- **El incendio** solo pasa en casas de vecinos de verdad.
- **La serenata** calla las notas que dejó programadas si se corta, y no toca en medio de una pelea.
- **El perezoso** ya no queda flotando si se corta en la subida, y se suelta si uno muere cargándolo.

## 4.89.0 — 2026-11-10 · Más fauna tica
**Más fauna tica** (`src/fauna4.js`). Tres animales nuevos, con modelo propio. Ninguno hace daño:
- **El oso hormiguero (tamandúa):** color crema con su chaleco negro, hocico largo, orejitas y cola. Cuando se detiene, olfatea el suelo y saca la lengua. Sale de día en la selva, el bosque y el bosque seco.
- **La martilla (kinkajú):** dorada, de ojos grandes y cola larga que se mueve. Sale de noche y se trepa a los árboles. Vive en la selva, el nuboso y el bosque.
- **La pava:** el pavo de monte, negro con pintitas blancas en el pecho, ojo y papada rojos, cresta y patas rojas. Sale de día en el nuboso, la selva y la montaña.
- Bestiario y `/prueba fauna4`.

## 4.88.0 — 2026-11-10 · El arcoíris después del aguacero
**El arcoíris después del aguacero** (`src/arcoiris.js`). Cuando escampa de día, seis de cada diez veces sale un arcoíris grandote en el cielo, del lado contrario del sol, con sus siete colores. Es distinto del de la poza de la catarata.
- **Doble:** a veces (tres de cada diez) sale doble, con un segundo arco más tenue por fuera y los colores al revés, como pasa de verdad.
- **Cómo está hecho:** cada arco se calcula a los 42° de la sombra del sol y siempre queda lejos, así que se ve igual desde cualquier lado. Aparece despacito y en un minuto y medio se desvanece.
- Logros «Arcoíris después del aguacero» y «Arcoíris doble». `/prueba arcoiris`.

## 4.87.0 — 2026-11-10 · La lluvia de ranas
**La lluvia de ranas** (`src/ranas.js`). En las tormentas fuertes del Caribe, muy de vez en cuando (a lo sumo una vez cada diez días), una tromba en el mar chupa las ranitas de las lagunas y las suelta tierra adentro.
- **Durante medio minuto llueven ranas** a la intemperie alrededor de uno: calzonudas, dardos, sapos y ranas de vidrio, que caen de lo alto, rebotan y se ponen a brincar. Se oyen croar.
- **Son inofensivas.** Se van solas al rato, y no hay más de cuarenta a la vez.
- **Si cayeron por lo menos diez,** sale el logro «¡Llovieron ranas!» y el aviso «Nadie le va a creer esto». `/prueba ranas`.

## 4.86.0 — 2026-11-10 · El globo de Don Fito
**El globo aerostático de Don Fito** (`src/globo.js`). Los sábados y domingos, de día, Don Fito estaciona su globo en un claro con cielo abierto cerca de la plaza del pueblo, y sale el aviso.
- **El modelo:**
  - canasta de mimbre con su borde;
  - mecates y quemador;
  - una bolsa enorme de catorce anillos con rayas azules, blancas y rojas, que gira despacito.
- **Por ₡15** (clic derecho a la canasta) se sube uno:
  - **Sube:** unos 38 bloques en 14 segundos, con llamaradas del quemador (fuego y su sonido).
  - **Vuela:** un minuto, a donde lo lleve el viento.
  - **Baja:** donde caiga. Si abajo hay agua, sigue hasta encontrar tierra.
- **Al aterrizar:** «¡Aterrizamos! Bueno… más o menos donde dijo el viento», sin daño por la caída. Don Fito se queda desinflando el globo. Se probó con un viaje de 72 segundos que aterrizó a 202 bloques.
- Arriba no se puede usar el mouse: se va de pasajero.
- Logro «Vuelta en globo», ayuda, diario y `/prueba globo`.

## 4.85.0 — 2026-11-10 · El chompipe
**El chompipe** (`src/chompipe.js`). El pavo de las fincas, con modelo nuevo: negro con brillo verdoso, cuello y cabeza pálidos, pico amarillo, moco rojo que cuelga y se bambolea, papada, y la cola de nueve plumas con puntas blancas.
- **Dónde sale:** de día, en los potreros y montes cerca de los pueblos (no más de dos a la vez).
- **Tranquilo**, anda picoteando el suelo.
- **Si uno se le arrima a menos de cuatro bloques,** se esponja: el cuerpo se infla y la cola se abre en abanico. Hace «¡glu-glu-glu!» y le corretea a uno siete segundos a picotazos. Duelen poquito y nunca matan.
- **Si se le pega,** sale corriendo. Suelta carne.
- Logro «Me correteó el chompipe», bestiario y `/prueba chompipe`.

## 4.84.0 — 2026-11-10 · Incendio en el pueblo
**Incendio en el pueblo** (`src/incendio.js`). Desde el día 6, muy de vez en cuando (a lo sumo una vez cada seis días), se prende una casa del pueblo.
- **Cómo se ve:** llamas que bailan en las paredes y el techo (en tres capas: rojo, anaranjado y amarillo), humo y el chisporroteo del fuego.
- **La gente** grita «¡Fuego, fuego!», «¡Traigan agua!», «¡Llamen a los bomberos!» y se aparta.
- **Para apagarlo:** baldazos de agua, con el balde lleno y clic derecho sobre las llamas. Cada baldazo apaga lo que está cerca.
- **Si no,** a los 75 segundos llegan los **Bomberos de Tiquicia** (ficticios). Traen camión con modelo nuevo (cabina, franja blanca, escalera y luces que giran), sirena, y apagan foco por foco con el chorro de la manguera.
- **Si uno apagó la mitad o más,** la familia le da las gracias y ₡25, y la reputación sube 3. Logro «Bombero voluntario».
- Las llamas son de ver: no queman bloques. Ayuda, diario y `/prueba incendio`.

## 4.83.0 — 2026-11-10 · El perezoso en la calle
**El perezoso en la calle** (`src/perezosocalle.js`). De día, cerca de una carretera, a veces un perezoso se baja a cruzarla, a su ritmo: unos ocho centímetros por segundo.
- **Para ayudarle:** clic derecho y uno lo carga en brazos («pesa más de lo que parece»). Llevándolo junto a cualquier tronco, se agarra solo y se va subiendo despacito.
- **El agradecimiento:** desde la rama se le queda viendo a uno, y queda el efecto **Calma** por tres minutos. Logro «Le ayudé a cruzar a un perezoso» y queda en el diario.
- **Si nadie le ayuda,** igual cruza… algún día. A lo sumo pasa una vez cada dos días. `/prueba perezoso`.

## 4.82.0 — 2026-11-10 · Cazadores furtivos
**Cazadores furtivos** (`src/furtivos.js`). Desde el día 4, de día, en la selva, el bosque o el nuboso y lejos de los pueblos, a veces un cazador ilegal deja tres cepos de metal escondidos en el zacate. Tienen modelo nuevo: base, plato, quijadas abiertas con dientes y cadena. En uno ya cayó un venado o un tepezcuintle, que se queja.
- **El aviso:** al acercarse sale «Algo brilla en el zacate…» y ⚠ en la brújula.
- **El cazador** (vestido de vecino) sale corriendo monte adentro apenas lo ven.
- **Pisar un cepo:** se cierra de golpe, quita 3 y enreda un rato.
- **Desarmarlo:** agachado (Shift) junto al cepo, segundo y medio con cuidado. Si tenía un animal, lo suelta y sale cojeando, pero vivo.
- **Con los tres desarmados,** el guardaparques del Sistema de Áreas de Conservación (ficticio) da las gracias y ₡30 por la denuncia, y sube la reputación.
- Logros «Desarmé los cepos del cazador furtivo» y «Liberé al animal del cepo». Ayuda, diario y `/prueba furtivos`.

## 4.81.0 — 2026-11-10 · El vecino que no es
**El vecino que no es** (`src/impostor.js`). Desde el día 5, algunas noches, en el pueblo, aparece alguien con ropa de vecino: cara, ropa y sombrero como cualquiera. Está quieto, pegado a una pared y mirándola.
- **Las señales:** no contesta, no se mueve, su nombre es «¿Vecino?» y **los perros le ladran desde antes**.
- **Si uno se le acerca** a menos de cuatro bloques, se va volteando despacito; a los tres segundos ya es tarde.
- **Si se le habla o se le pega,** también se descubre.
- **Al descubrirse:** se le deshace la ropa en humo negro y queda una Sombra (grande desde el día 12) que viene por uno. Hay grito, temblor de pantalla y miedo.
- Al amanecer, si nadie lo descubrió, se deshace solo. Respeta la dificultad y las hostiles apagadas.
- Logro «El vecino que no era» y `/prueba impostor`.

## 4.80.0 — 2026-11-10 · Arreglos de la decimoséptima revisión
**Arreglos de la decimoséptima revisión** (independiente, de la v4.64 a la v4.75):
- **Guardado:**
  - Domar un perro mientras ladraba dejaba de guardar la partida: llevaba dentro una referencia a otro mob que no se puede guardar, y los bloques cambiados en ese rato se perdían.
  - Ahora de las mascotas solo se guarda lo que se puede guardar (nada de mobs, globitos ni objetos vivos).
  - Si un guardado falla, los chunks pendientes se vuelven a intentar la próxima vez.
- **Animales con maña:** al domar un animal o meterlo en un arreo, su maña se suelta: mandan otros.
- **La mina de Abangares:**
  - Nunca se talla sobre lo construido o tocado por uno, ni a menos de 90 bloques de la casa o del punto de reaparecer, ni cerca de un pueblo.
  - Ahora revisa que toda la huella esté cargada, cofre del fondo incluido. Antes podía quedar sin el botín.
  - La vagoneta y Don Eliseo ya no aparecen en terreno sin cargar.
- **Abigeato:** alejarse hasta que el Chata desaparezca ya no cuenta como rescate. Tampoco se roban vacas domadas ni de un arreo.
- **Pararrayos:** la lista de pararrayos ya no pasa de una partida a otra.
- **Luna roja:** el botín sale una sola vez por noche, aunque una tormenta apague y prenda la luna.
- **El aguacero** ya no mueve a los vecinos con guion (el guía, el influencer, los del partido, los sueltos), ni a los que andan asustados.
- **Fiado:**
  - Pedir y pagar el mismo día ya no cuenta para los logros.
  - En las partidas de antes, el plazo empieza a correr hoy (antes no vencía nunca).

## 4.79.0 — 2026-11-10 · El terremoto grande
**El terremoto grande** (`src/terremoto.js`). Desde el día 10, muy de vez en cuando (y con por lo menos 25 días entre uno y otro), el temblor que toca es **el grande**: magnitud 7,2 a 7,8.
- **La sacudida:** dura unos 15 segundos y mueve la pantalla más que nunca. Sale el aviso «¡salga a lo abierto, lejos de paredes y barrancos!».
- **La grieta:** a media sacudida se abre una zanja de 22 a 38 bloques cerca de uno. Es de dos bloques de ancho en el medio y hasta siete de hondo, con polvo saliendo.
  - Solo se abre en tierra natural (zacate, tierra, arena, piedra, grava): nunca en lo que uno construyó o cambió.
  - No se abre junto al agua, para no inundar nada.
- **Después:** el comunicado de la Comisión Nacional de Sustos (ficticia) y tres réplicas de 4,6 a 5,8, una cada minuto o dos.
- **En la costa,** como cualquier temblor fuerte, puede traer el tsunami de la v4.58.
- Logro «Sobreviví al terremoto grande», diario, ayuda y `/prueba terremoto`.

## 4.78.0 — 2026-11-10 · El clásico del domingo
**El clásico del domingo** (`src/clasico.js`). Los domingos en la tarde, cerca de un pueblo, Radio Marimba transmite el clásico (ficticio) entre el **Deportivo Tiquicia** y el **Real Chayote**.
- **El partido:** noventa minutos en noventa segundos.
  - Narración cada tanto: «¡Pegó en el palo, señoras y señores!», «El portero sale jugando con los pies. Ay, Dios mío»…
  - Entre cero y seis goles, con «¡GOOOOOL!» (grabación real), el minuto y el marcador.
  - El medio tiempo y el pitazo final.
- **La gente:** cada vecino tiene su equipo. Con cada gol, los de ese equipo brincan y celebran («¡Qué golazo!») y los otros se lamentan («¡Ese árbitro está comprado!»). Al final: «¡Campeones, campeones!» o «El otro domingo nos desquitamos».
- Logros «Oí el clásico entero por la radio» y «Un clásico de muchos goles». `/prueba clasico`.

## 4.77.0 — 2026-11-10 · La serenata
**La serenata** (`src/serenata.js`). Algunas noches, en el pueblo, Jeffrey, el serenatero, se para afuera de una casa donde hay alguien adentro, mirando a la ventana, con su guitarra terciada (modelo nuevo: caja, boca, mástil y clavijero) y rasgueando.
- **La música:** toca un **pasillo** en tres por cuatro, con bajo en el uno, acorde en el dos y el tres y la melodía por arriba, armado cada vez distinto con **notas reales de arpa**. Mientras toca se calla la música del juego, y se oye más fuerte entre más cerca esté uno.
- **El final:** se enciende la luz de la ventana y se asoma la muchacha. «¡Buenas noches, mi reina!», y se despide: «¡Ahí le dejo el corazón!».
- **Propina:** con clic derecho se le dan ₡2 y toca otra «a petición del público».
- Logros «Vi una serenata» y «Propina para el serenatero». `/prueba serenata`.

## 4.76.0 — 2026-11-10 · El concurso de gallo pinto
**El concurso de gallo pinto** (`src/concurso.js`). Los días de fiesta, de día, en la plaza ponen una mesa con mantel, cuatro ollas de pinto y su rótulo. Ahí está el jurado, Doña Hortensia, que lleva cuarenta años juzgando.
- **Para concursar:** se le lleva un gallo pinto en la mano y se le da clic derecho. Lo prueba y lo califica contra el de tres vecinos (Doña Flor, Don Toño, Doña Chepa…). Sale la tabla con todas las notas y su comentario («¿esto es de paquete?»).
- **La nota:**
  - con huevo vale más;
  - cada nivel de **cocina** suma;
  - y un poquito de suerte.
  Sin práctica casi no se gana, así que comprar el pinto en la pulpería no es negocio.
- **Si gana:** ₡20 y aplausos. La primera vez también da la **Cuchara de Oro del concurso** (objeto 534, con ícono). Una vez por día de fiesta.
- Logros «Campeón del gallo pinto» y «Tricampeón del gallo pinto». Ayuda y `/prueba concurso`.

## 4.75.0 — 2026-11-10 · El abigeato
**El abigeato** (`src/abigeato.js`). Desde el día 6, algunas noches (a lo sumo una cada cinco días), si hay una vaca cerca de la casa y uno anda por ahí, llegan dos Chatas a robársela.
- **Cómo pasa:**
  - La vaca berrea y sale el aviso.
  - El «Chata con mecate» le echa el lazo (se ve la cuerda entre los dos) y se la lleva despacito monte adentro, jalándola a tirones.
  - El otro Chata se queda atajando.
- **Si se tumba al del mecate,** la vaca queda libre y se vuelve sola. Suma reputación, el logro «No se llevaron la vaca» y queda en el diario.
- **Si se alejan 50 bloques** (o pasan dos minutos y medio), se perdió la vaca.
- **Los perros les ladran**, gracias a la maña de la v4.71. Respeta las hostiles apagadas y la dificultad. `/prueba abigeato`.

## 4.74.0 — 2026-11-10 · La Rifa Dominical
**La Rifa Dominical** (ficticia; `src/rifa.js`). En la pulpería y el minisúper se venden fracciones a ₡2. Son el objeto 533, con ícono de billetito y su sello rojo.
- **El domingo a mediodía** Radio Marimba canta el número y la serie, y se revisan hasta diez fracciones:
  - el premio chiquito es ₡10 (una de cada 25);
  - el gordito es ₡250 (una de cada 200), «¡el pueblo entero lo va a saber!».
- **Las fracciones se gastan** con el sorteo. Si no hay premio: «El otro domingo sí», dicen todos.
- **Como toda rifa, la casa gana:** medido en 40 000 fracciones, devuelve ₡1,57 por cada ₡2 (anotado en `docs/BALANCE.md`).
- Logros «Premio en la Rifa Dominical» y «¡Me saqué el gordito!». Ayuda y `/prueba rifa`.

## 4.73.0 — 2026-11-10 · El fiado, con cuaderno de verdad
**El fiado de la pulpería, con cuaderno de verdad** (`src/ui.js`). El fiado de antes (₡10 cuando uno anda sin plata) ahora tiene reglas de pulpería tica:
- **Cuánto fían:** depende de cómo lo conozcan en ese pueblo. Son ₡10 de entrada, ₡15 con buena fama y hasta ₡30 con la mejor.
- **Plazo:** cinco días. La deuda dice cuántos días quedan y, con la plata en la bolsa, se paga de un clic. También se sigue cobrando sola al venderle cosas al pulpero.
- **Si se pasa el plazo:**
  - queda apuntado como **moroso**;
  - sale el aviso de que en el pueblo se comenta;
  - el pulpero ya no fía: «El cuaderno no miente».
- **Al pagar tarde** se borra lo de moroso, con su regaño. Pagar a tiempo da los logros «Pagué lo fiado» y, a la tercera, «Cliente de confianza».

## 4.72.0 — 2026-11-10 · El Festival de la Luz
**El Festival de la Luz** (`src/festival.js`). En las noches de las fiestas de fin de año, en los pueblos con calles, pasa una vez por noche un desfile de cinco carrozas.
- **Las carrozas:**
  - una estrella gigante de bombillos;
  - una carreta pintada con las ruedas de colores girando;
  - un tucán con su pico anaranjado;
  - un árbol de cinco pisos;
  - un volcán que echa chispas y humo.
- **Cómo son:** cada una va sobre su plataforma con borde dorado y llantas, forrada de bombillos que titilan cambiando de color.
- **El desfile:** van por la calle más cercana a la plaza, separadas, siguiendo el suelo, con los tambores de la comparsa y pólvora que sale de las carrozas. Cuando pasa la primera cerca, aplauden. Logro «Vi pasar el Festival de la Luz».
- Todo es de ver: no son bloques ni se guarda. `/prueba festival`.

## 4.71.0 — 2026-11-10 · Más maña de los animales
**Más maña de los animales** (`src/animales2.js`):
- **Los perros le ladran a lo que anda en la oscuridad.** Si hay una Sombra, una leyenda o un Chata a menos de 16 bloques, el perro se para firme mirándolo, ladra y gruñe, y en cada ladrido pega un brinquito.
  - De noche, si uno anda cerca, sale el aviso «Los perros le están ladrando a algo en la oscuridad…», que sirve de alarma.
  - Logro «Los perros avisaron».
- **Las gallinas se suben al palo.** Al oscurecer, cada gallina busca una cerca, un poste o un tronco cerca, llega, aletea y se sube. Ahí pasa la noche quieta.
  - Al amanecer se tira. Si le quitan el palo, se baja.
  - Logro «Las gallinas ya se subieron al palo».
- **Las vacas se juntan con la tormenta.** Cuando viene tormenta, las vacas cercanas se juntan en un solo montón y se quedan quietas, todas para el mismo lado, mugiendo de vez en cuando. Al escampar vuelven a lo suyo.
- **Por dentro:** mientras hacen esto, `m.data.animo` manda y `entities.js` no les corre el cerebro. Los domados no cambian.

## 4.70.0 — 2026-11-10 · La mina vieja de Abangares
**La mina vieja de Abangares** (`src/minaoro.js`). Una sola por partida, desde el día 5, en Guanacaste o en la montaña. Sale ⛏ en la brújula cuando se ve.
- **La entrada:** un marco de troncos y tablas y una escalera con antorchas que baja doce bloques.
- **El túnel:** 40 bloques con rieles, piso de tablas, puntales con techo cada seis y antorchas.
- **Las galerías:** tres, a los lados, con vetas de oro (también oro profundo).
- **El fondo:** la sala de la veta madre, con una pared de oro, puntales y un cofre viejo con oro, diamantes, colones, esencias y hierro.
- **La vagoneta:** modelo nuevo de hierro y madera, con ruedas que giran. Con clic derecho uno se monta y corre sola sobre los rieles, con chispas, traqueteo y hasta 10 bloques por segundo. A media ida **se viene el techo detrás** y la vagoneta sale disparada.
- **Don Eliseo, el minero que nunca salió:** fantasma de Las Juntas, con casco, lámpara de carburo, bigote canoso y el pico al hombro. Se quedó desde el 31 esperando la vagoneta de la salida.
  - Si se le habla, cuenta su historia y pide que lo saquen.
  - En el viaje de vuelta se monta detrás de uno.
  - A la salida se va subiendo hacia la luz y deja su **Lámpara de carburo** (objeto 532, con ícono) y ₡50.
- **Si se pierden** la vagoneta o Don Eliseo (los mobs no se guardan), vuelven a aparecer al acercarse. La mina se arma solo cuando todo el terreno está cargado; si no, espera.
- Logros «La mina vieja de Abangares», «Viaje en vagoneta», «Le gané al derrumbe en vagoneta» y «Don Eliseo salió de la mina».
- Bestiario, ayuda, diario y `/prueba minaoro`.

## 4.69.0 — 2026-11-10 · El pararrayos
**El pararrayos** (bloque 642, en `src/clima2.js`). Un palo de hierro con la punta de oro.
- **Receta:** se fabrica con 1 de oro sobre 2 de hierro, en columna.
- **Qué hace:** en las tormentas eléctricas fuertes, si un rayo iba a caer a menos de 28 bloques de un pararrayos (y el pararrayos queda alto), el rayo baja derechito a la punta. No quema el árbol, no tumba el techo y no le pega a uno.
- **Cómo se ve:** su chispazo, su trueno y el aviso «¡El rayo cayó en el pararrayos!». Logro «El pararrayos hizo su trabajo».
- **Por dentro:** los pararrayos se buscan entre lo construido por uno (`world.mods`) cada medio minuto, así que no cuesta nada mientras no haya tormenta.

## 4.68.0 — 2026-11-10 · La luna roja, más brava
**La luna roja, más brava** (`src/lunaroja.js`). Cada cuarta luna llena, además de más leyendas y el doble de experiencia, ahora las Sombras llegan en **cinco oleadas**, una cada 70 segundos y cada una más grande.
- **Las oleadas:**
  - Salen 3, 5, 7, 9 y 11 Sombras: 35 en total.
  - Primero las normales; después honderas, de escudo y brinconas; en la última, las grandes adelante.
  - Nacen a unos veinte bloques y vienen por uno desde lejos.
- **Al amanecer** se cuenta lo que se tumbó, lo haga quien lo haga. Con seis de cada diez, entre la ceniza queda el botín: colones (hasta ₡90), esencias de Sombra y, si aguantó las cinco, un diamante.
- Logros «Aguanté las oleadas de la luna roja» y «Ni una Sombra quedó en pie». Queda en el diario.
- Respeta las hostiles apagadas y la dificultad. `/prueba lunaroja` pone la noche roja.

## 4.67.0 — 2026-11-10 · Arreglos de la decimosexta revisión
**Arreglos de la decimosexta revisión** (independiente, de la v4.57 a la v4.64):
- **Bichos:** en Tranquilo no pican bichos, y la bocaracá respeta las hostiles apagadas. Antes caía y dejaba necrosis permanente.
- **La goleta:**
  - Cuenta las bajas aunque no las haga uno (la dinamita, el peón, el Cadejos), y el capitán muerto de cualquier modo hunde el barco y da el botín. Antes quedaba trabada tirando cañonazos.
  - También se va si uno llega a tierra a caballo o en un bote varado, o si se apagan las hostiles a medio evento.
- **`g.sinCaida` vuelve a cero al cargar un mundo.** Era una marca del reloj de la partida, y al pasar a un mundo más nuevo quedaban horas sin daño por caída.
- **Salir al menú en plena pelea con el pez vela** ya no deja la barra pintada ni la pelea viva para el siguiente mundo. Lo mismo con la monta.
- **Tsunami:** solo pega a quien está frente a la ola, no 300 bloques costa abajo, y no bajo tierra. Al reaparecer se limpia. Se arregló `P.flying`.
- **La monta:**
  - Al morir se baja uno, y la barra se esconde en pausa y en la pantalla de muerte.
  - Montado no se puede usar el mouse: nada de camas ni caballos desde el lomo del toro.
- **Garrapatas y tórsalo ya no se van solos:** no se descuentan, aunque uno se vaya a otra dimensión o pase a creativo, y salen sin contador de segundos. El tórsalo tapado con chicharrón queda guardado en la partida.
- **Lahar:** el aviso de «le pasó por encima del techo» sale solo si de verdad estaba bajo techo.

## 4.66.0 — 2026-11-10 · La gente y el aguacero
**La gente y el aguacero** (`src/pueblo.js`). Cuando se viene un aguacero de verdad, los pueblos cambian:
- **Uno de cada tres vecinos carga sombrilla.** La abre y sigue con lo suyo, con el brazo arriba sosteniéndola. Hay seis colores: rojo, azul, negro, verde, amarillo y morado.
- **Los demás corren a la casa** con las manos en la cabeza, y alguno grita al pasar: «¡Qué aguacero!», «¡Se me mojó la ropa del tendedero!», «Ya decía yo que el yigüirro estaba cantando…».
- **Si la casa queda lejos** o se atascan, entran cuando uno no los está viendo.
- **Al escampar salen otra vez.** Si amanece lloviendo, los que no tienen sombrilla se quedan adentro.
- **Los de los negocios** (pulpero, cajera…) siguen atendiendo.
- **Medido en un pueblo:** de 26 vecinos en la calle quedan 10 con el aguacero, y al escampar salen 27.

## 4.65.0 — 2026-11-10 · ¡Bomba!
**¡Bomba!** (`src/bombas.js`). En los días de fiesta, cerca de la plaza y con gente alrededor, cada minuto más o menos alguien grita «¡BOMBA!».
- **Cómo sale:** otros dos vecinos repiten «¡Bomba!» y el que la gritó suelta su copla de cuatro versos, línea por línea en globitos.
- **Al final:** la gente responde («¡Uepaaa!», «¡Otra, otra!», «¡Esa sí estuvo buena!»…), suenan los aplausos y la copla entera queda en el aviso para leerla con calma.
- **Las coplas:** 25, todas escritas para el juego. Hablan de la muni (ficticia), el gallo pinto, el bus, el toro, las Sombras, el Cadejos, la hormiga bala, el pez vela, los chapulines y el tsunami.
- **Primero salen las que no ha oído.** Logros «¡Bomba!», «Diez bombas oídas en las fiestas» y «Me sé todas las bombas» (se guardan en `meta.bombas`).
- `/prueba bomba`, en un pueblo.

## 4.64.0 — 2026-11-10 · El pez vela
**El pez vela** (`src/pezvela.js`). Pescando mar adentro, en agua honda, a veces lo que pica es un pez vela: la primera vez es uno de cada cinco, después uno de cada ocho. Tiene modelo propio de unos tres metros: lomo azul con rayas, panza plateada, pico largo, cola en tijera y la vela dorsal con pintitas, que se para cuando salta.
- **La pelea:**
  - Cada clic derecho recoge cuerda pero sube la tensión.
  - Cuando el pez **corre**, se aleja y jala: recoger ahí casi revienta la cuerda.
  - Cuando **salta**, la tensión baja rápido y conviene recoger.
  - Cuando **descansa**, se recoge con cuidado.
- **En pantalla:** arriba sale la barra de tensión (verde, amarilla y roja) con la distancia y lo que está haciendo el pez.
- **Si se revienta** o pasan 75 segundos, se va.
- **Si se trae hasta uno:** foto con él y de vuelta al mar, como se hace en Costa Rica. Queda de recuerdo la **Foto con el pez vela** (objeto 531, con ícono), más 40 de experiencia y 40 de pesca. Logros «Pez vela, y de vuelta al mar» y, con tres, «Capitán de pesca deportiva».
- **Balance medido:**
  - recoger sin parar revienta la cuerda en menos de un segundo;
  - esperar cuando corre lo saca en 8 a 40 segundos.
- Ayuda, diario y `/prueba pezvela`.

## 4.63.0 — 2026-11-10 · La monta de toros
**La monta de toros** (en `src/toros.js`). En el redondel de las fiestas, además de torear, ahora se puede montar el toro.
- **Para subirse:** clic derecho al toro, de cerca.
- **El toro corcovea:** brinca en su sitio, da vueltas y cada medio segundo pega un tirón hacia un lado. Los tirones son más fuertes entre más se aguanta.
- **El equilibrio:** si se va de un lado, se sigue yendo. Con A y D uno se echa al lado contrario. Arriba sale una barra (verde en el centro, roja en las orillas) con los segundos, y la cámara se ladea con uno.
- **Ocho segundos encima** son ₡30, aplausos y el logro «Montador de redondel», una vez por día de fiesta. Si le bota, revuelca sin matar y sin cobrar la caída, y queda anotado el mejor tiempo.
- **El balance se midió con un bot:**
  - sin tocar nada, le bota en un par de segundos;
  - con reflejos de 0,2 s gana siempre;
  - con 0,3 s, dos de cada tres;
  - con 0,4 s pierde.
- El personaje va sentado en el lomo en tercera persona.

## 4.62.0 — 2026-11-10 · La goleta fantasma
**La goleta fantasma** (`src/goleta.js`). Desde el día 4, algunas noches, mar adentro (en agua honda y lejos de la costa), sale de la neblina una goleta vieja: casco verdoso, velas en jirones, foque roto, bandera negra y siete faroles verdes con su halo. Se ve como aparición, sin niebla encima, y sale 🏴 en la brújula.
- **Da vueltas alrededor de uno** con la banda hacia uno y tira cañonazos con caída cada 4,5 segundos (4 de daño; apunta adonde uno va, con su error). Moverse es lo que salva. Al caer al agua salpican.
- **Su tripulación:** seis ánimas marineras, de camisa de rayas y pañuelo, que vuelan sobre el agua con el machete oxidado (2 de daño y escalofrío).
- **El capitán:** sale cuando caen las seis. Tiene tricornio, parche, barba y farol verde, 80 de vida y 4 de daño, y a media vida llama a dos marineros más. Mientras está él, los cañonazos van más seguido.
- **Si cae el capitán,** la goleta se hunde de proa entre burbujas verdes y su cofre le queda a uno: ₡120, 6 de oro, 4 perlas, 2 diamantes y el **Farol de la goleta fantasma** (objeto nuevo 530, con ícono).
- **Si uno llega a tierra,** se aleja o amanece, la goleta se pierde otra vez en la neblina.
- Logro «Hundí la goleta fantasma», bestiario, ayuda, diario y `/prueba goleta`.

## 4.61.0 — 2026-11-10 · Bichos del monte húmedo
**Bichos del monte húmedo** (`src/bichos2.js`):
- **Tórsalo.** Caminando de día por potreros, montes y bosques, desde el día 2, a veces una mosca le deja un piquete con gusano.
  - No se va solo: cada tanto pica por dentro (medio corazón) y no deja dormir en la cama.
  - Se saca tapándolo con un pedazo de chicharrón (clic derecho: en vez de comérselo, va sobre el piquete): en 25 segundos sale el gusano. El botiquín también lo saca. El repelente lo evita.
- **Hormiga bala.** En la selva, el bosque nuboso y el manglar, caminando sin cuidado (agachado no pasa), pica: 3 de daño y cuatro minutos de dolor con punzadas. En ese rato no se puede correr, se camina más lento y se pega un 30 % más suave.
- **Bocaracá.** La víbora amarilla de pestañas, con su modelo nuevo de pintitas oscuras y escamas paradas sobre los ojos.
  - Espera en las hojas y cae encima cuando uno pasa por debajo; si cae justo encima, la mordida es segura.
  - Envenena y pudre la herida como la terciopelo: se cura con suero o guaco. Un casco aguanta la que cae; las botas de bécquer, la del suelo.
- Logros, ayuda, bestiario y `/prueba torsalo`, `/prueba bala` y `/prueba bocaraca`.

## 4.60.0 — 2026-11-10 · La plaga de chapulines
**La plaga de chapulines** (`src/plaga.js`). De día y sin lluvia, desde el día 3, a veces baja una nube de chapulines sobre una siembra crecida cerca de uno: maíz, frijol, café o piña. Pasa a lo sumo una vez cada cuatro a seis días.
- **Cómo es la nube:** 140 chapulines revoloteando, con su zumbido. Sale 🦗 en la brújula.
- **Qué hace:** cada dos segundos y medio se come una mata, que vuelve a quedar como recién sembrada.
- **Cómo se espanta:** haciendo escándalo cerca de la nube (golpes al aire, como quien pega latas), con una fogata prendida cerca de la siembra o soltándoles gallinas, que corren a comérselos.
- **Si no se espanta,** se va sola a los cien segundos, bien llena.
- Logros «Espanté la plaga de chapulines» y «Ni probaron la siembra». Ayuda y `/prueba chapulines`, que siembra una milpa delante.

## 4.59.0 — 2026-11-10 · Arreglos de la decimoquinta revisión
**Arreglos de la decimoquinta revisión** (independiente, de la v4.54 a la v4.57):
- **Toros:**
  - Pegado al toro ya no se gana gratis: de cerca da un cabezazo, que cuenta como revolcón.
  - Subirse a dos bloques dentro del redondel ya no cuenta como estar adentro. La altura se mide con los pies en el suelo, así que un revolcón que le saca volando no le saca del intento.
  - Los tres revolcones se cumplen: hay que salir de verdad y volver a entrar. Antes, al segundo se reiniciaba solo.
  - El revolcón ya no mata, aunque la dificultad lo agrande: deja por lo menos medio corazón, y la caída del revolcón no cuenta.
  - El redondel ya no se arma encima de la soda ni de la cantina. En los pueblos que tienen su redondel de bloques, el toro sale ahí. Si no, se busca un claro parejo sin nada adentro; si no hay, ese día no hay toros en ese pueblo.
  - Solo el toro del evento torea. El logro de los olés dice «en una tanda».
- **Palo encebado:** soltarse a media subida ya no cobra la caída, porque la física la volvía a medir desde donde uno estaba. Ahora hay un rato sin daño por caída (`g.sinCaida`), que también usa el revolcón del toro.
- **Lahar:** la copa de un árbol ya no salva. Sí salva un techo de verdad a menos de cuatro bloques, y entonces sale un aviso. El logro «Me quité del lahar» es solo para quien se quitó de lado.
- **El Chata deudor:** no aparece en la hoja si la dificultad apaga las hostiles. Se cobra aunque se le tire de lejos (hasta 80 bloques).

## 4.58.0 — 2026-11-10 · El tsunami
**El tsunami** (`src/tsunami.js`). Después de un temblor fuerte (magnitud 6 o más), si uno anda en la costa, a veces el mar se recoge de golpe.
- **El fondo queda al aire:** arena mojada con charcos y algas donde antes había agua, y peces brincando.
- **Repican las campanas** del pueblo si hay uno cerca, y a los veinte segundos entra una ola de unos doce bloques de alto, con su cresta de espuma que se viene encima.
- **Abajo, revuelca:** 9 de daño, le saca tierra adentro y deja escalofrío. Los animales y la gente de la orilla también salen arrastrados.
- **Arriba, se ve pasar:** a unos 15 bloques sobre el mar no hace nada. Logros «Vi pasar el tsunami desde arriba» y «Me revolcó el tsunami».
- Después la ola deja palos, troncos y pescado en la orilla, y la Comisión Nacional de Sustos (ficticia) da su comunicado.
- Ayuda, `/prueba tsunami` y plan maestro 19 («Tiquicia exagerada»).

## 4.57.0 — 2026-11-10 · Toros a la tica
**Toros a la tica** (`src/toros.js`). En los días de fiesta, de día, junto a la plaza del pueblo arman un redondel de postes y tablas y sueltan un toro café, con mancha blanca, cuernos claros y la divisa de colores en el lomo.
- **Si uno se mete de improvisado,** el toro rasca el suelo y embiste. Pega poquito (2), pero revuelca y saca volando.
- **Si aguanta 30 segundos adentro** sin que lo revuelque tres veces, la gradería aplaude y paga ₡20, más ₡5 por cada «¡olé!»: cada embestida que esquiva de cerquita. Una vez por día de fiesta. Logros «Improvisado del redondel» y «Cinco olés seguidos».
- **Al toro no se le pega:** aquí se torea, nada más.
- Ayuda y `/prueba toros`.

## 4.56.0 — 2026-11-10 · Arreglos de la decimocuarta revisión
**Arreglos de la decimocuarta revisión** (v4.50 a v4.55):
- **El palo encebado:**
  - ya no cobra daño por caída (llegar arriba costaba vida); al ganar, uno baja al pie del palo;
  - no se trepa a caballo, en la tirolesa, en el modo foto, sentado, dormido ni desde un sótano;
  - si hay un bloque estorbando, uno se suelta;
  - los avisos ya no se repiten, el palo se decide con la hora (no con la luz de un relámpago) y su modelo se libera al quitarlo.
- **El lahar:** ya no atraviesa techos ni llega bajo tierra. Correr cuesta arriba hacia el lodo ya no salva (como dice el aviso). Se decide una sola vez, cuando pasa.
- **El lodo** se quita en el agua siempre (antes solo si también había garrapatas).
- **El Chata deudor:** lo cobra uno (en supervivencia y cerca), no un rayo ni el vigilante. Devuelve lo suyo y ₡10 más, así dejarse robar no da negocio. No queda en la hoja con las hostiles apagadas, y no salen dos deudores a la vez.
- **Textos:** «le hace resbalar», «Cuesta abajo, alcanza a cualquiera», «Le queda el lodo encima», «Mírelo a los ojos».

## 4.55.0 — 2026-11-10 · El palo encebado
**El palo encebado** (`src/palo.js`). En los días de fiesta, de día, en la plaza del pueblo paran un palo de 7 bloques untado de grasa, con un saco de premio y una banderita tica arriba.
- Se sube pegado al palo y brincando (Espacio) una y otra vez: cada brinco sube medio bloque, pero la grasa lo baja todo el tiempo (más entre más arriba, y mucho más si deja de brincar).
- Medido: con 6 brincos por segundo se llega en unos 3.5 s, con 4 en unos 9 s, y con 2.5 no se pasa de la mitad.
- Arriba: aplausos, ₡30 y lo que traiga el saco (gallo pinto, café, esencia…). Una vez por día de fiesta. Logro «Arriba del palo encebado».
- Ayuda y `/prueba palo`.

## 4.54.0 — 2026-11-10 · El pueblo habla de lo nuevo
**El pueblo habla de lo nuevo.** Los vecinos ahora:
- **Comentan lo que uno ha hecho:** salvar la pulpería («el ángel de la pulpería»), el Chata que se le escapó con la plata, cobrar carteles de «Se busca», apagar quemas, torear al Toro Guaco o verle los pies al forastero.
- **Dan consejos de lo que anda suelto,** según el día: los Chatas en la carretera (y el pañuelo), los saínos que castañetean, la resaca, las rayas, la regla de la coral, el puma, las ánimas, el Toro Guaco y el lahar.

Así lo importante también se aprende conversando, no solo en la Ayuda.

## 4.53.0 — 2026-11-10 · El Chata que la debe
**El Chata que la debe.** Cuando un Chata se escapa con la plata, ya no desaparece y listo: queda con nombre y apodo («Pelón Brenes», «Mecha Corta Mora»…) y anotado en la hoja de la partida con lo que debe. Otra noche, entre los próximos Chatas de la carretera viene él, con su nombre a la vista y más vida (55). Si se le agarra, devuelve la plata con intereses (1.5 veces). Logro «El que la debe, la paga». Si se escapa de nuevo, la deuda se suma.

## 4.52.0 — 2026-11-10 · El lahar
**El lahar** (`src/lahar.js`). Lloviendo, en las faldas de un volcán (ni en el llano ni en el cráter), a veces (como mucho cada 10 minutos) se suelta un río de lodo, ceniza y piedras:
- Primero se oye un rugido cuesta arriba y hay **cinco segundos** para quitarse de lado. Cuesta abajo lo alcanza.
- Se ve bajar el lodo café con piedras grises.
- Si lo agarra: 8 de daño, lo empuja cuesta abajo y lo deja **enlodado** 25 s (camina más despacio; el agua quita el lodo).
- Si se quita a tiempo, logro «Me quité del lahar».
- Ayuda, consejo al morir y `/prueba lahar` (viene desde donde uno mira).

## 4.51.0 — 2026-11-10 · El aviso del atardecer
**El aviso del atardecer, útil.** En los tres primeros días, el «ya casi oscurece» dice qué le falta a uno para aguantar la noche: una espada (de madera sirve), antorchas (donde hay luz no nacen Sombras) o un techo (la casa de la abuela o un hueco tapado). Si ya tiene todo, se lo confirma. Desde que las noches son bravas, la primera noche a la intemperie y sin nada no se aguanta, y un jugador nuevo tiene que saberlo a tiempo. Además, medido el rendimiento de noche con las criaturas nuevas: 1.8 ms por cuadro de actualización y 1 ms de dibujo.

## 4.50.0 — 2026-11-10 · Arreglos de la decimotercera revisión
**Arreglos de la decimotercera revisión** (v4.45 a v4.49):
- **Con las hostiles apagadas o en Tranquilo** ya no salen aguamalas, rayas, alacranes ni el Bailarín.
- **Alacranes de cofre:** solo salen de los cofres que el mundo generó (estructuras, pueblos, naufragios), nunca de los que uno puso (ni de los viejos guardados antes) ni de los que deja la historia. Que ya se abrió queda guardado.
- **El Bailarín:**
  - se aparece detrás de uno solo donde hay piso y aire; si no hay lugar, no salta;
  - el azufre ya no atraviesa paredes ni techos;
  - tiene barra de jefe;
  - el revelado también se va al amanecer.
- **La playa:**
  - la aguamala solo pica a quien está en el agua (no en el bote ni en la arena);
  - en los ríos no hay resaca, aguamalas ni rayas;
  - la resaca mueve con choque (no mete en bloques);
  - la raya deja parálisis en vez de «pierna quebrada».
- **El asalto** solo empieza con el pueblo cargado y con tiempo para durar sus dos minutos y medio.
- **Las ánimas** se ofenden con cualquier arma de uno (también el arco y las reliquias), y la marca del golpe ya no puede quedar colgada.
- **Textos:** «Picadura de alacrán», «Asalto de los Chatas», «le agarra y le aprieta», y Don Mario ya no promete fiado.

## 4.49.0 — 2026-11-10 · Alacranes y tarántulas
**Alacranes y tarántulas** (`src/bichos.js`). Bichos del suelo del bosque seco, los llanos y las cuevas:
- **Alacrán:** chiquito, café, con tenazas y la cola enroscada. Si uno se le pone encima, pica: 2 de daño, veneno y ardor (las botas de bécquer aguantan el veneno). La primera vez que se abre un cofre viejo de una estructura (no los que pone uno), hay un 12 % de que salga un alacrán («sacuda antes de meter la mano»).
- **Tarántula:** grande, peluda, con manchas naranjas. De cerca asusta (miedo 2 s), pero no hace nada.
- Logros, bestiario y Ayuda.

## 4.48.0 — 2026-11-10 · Asalto a la pulpería
**Asalto a la pulpería** (`src/asalto.js`). Desde el día 4, de noche, si uno anda a menos de 70 bloques de un pueblo, a veces (como mucho una vez por hora de juego) tres Chatas se meten a asaltar la pulpería. Se oyen los gritos y aparece 🏪 en la brújula y el mapa.
- Hay dos minutos y medio para vencerlos. Si se logra, Don Mario lo agradece con ₡40 y dos gallos pintos (logro «Salvé la pulpería»).
- Si no se llega a tiempo, o si uno se aleja y los Chatas se pierden, se llevan la caja.
- No pasa con las criaturas hostiles apagadas ni en Tranquilo. Ayuda y `/prueba asalto`.

## 4.47.0 — 2026-11-10 · La playa brava
**La playa brava** (`src/playa2.js`). Tres peligros de verdad de las playas ticas, cada uno con lo que se hace contra él:
- **Corriente de resaca:** en franjas fijas de algunas playas (cerca de la orilla, donde el fondo baja), el agua jala mar adentro a unos 2 bloques por segundo. Contra ella no se avanza. Nadando paralelo a la playa se sale, y la corriente se acaba un poco más allá de las olas. Aviso la primera vez y logro «Nadé paralelo a la playa».
- **Aguamalas:** campanas moradas medio transparentes que flotan a la deriva cerca de la orilla, en grupitos. Su toque quita 2 y deja **ardor** 30 s, durante el cual la vida no se recupera sola. La sábila lo calma.
- **Rayas:** enterradas en la arena del agua bajita, casi no se ven. Si se les pisa, clavan el aguijón: 4 de daño, ardor y cojera. Si uno se acerca agachado («arrastrando los pies»), salen de la arena y se van nadando (logro).
- Bestiario, Ayuda («La playa brava»), consejos al morir y `/prueba playa2`.

## 4.46.0 — 2026-11-09 · El Bailarín Elegante
**El Bailarín Elegante** (`src/bailarin.js`): el «diablo en el baile» de los cuentos. En las noches de fiesta, cerca de la plaza de un pueblo, a veces (como mucho cada 40 minutos) aparece un forastero muy bien vestido: traje negro, corbata roja, broche dorado, sombrero de copa y bigote fino. Baila solo dando vueltitas y siempre mira a quien se acerca.
- **Bailar con él** (clic derecho, tres piezas): regala una moneda de oro, deja un escalofrío y se va. Logro «Bailé con el forastero».
- **Mirarle los pies** (de cerca y mirando para abajo, o pegarle): tiene pata de gallo. Huele a azufre, se le prenden los ojos rojos y hay pelea:
  - es jefe, con 120 de vida;
  - se aparece por detrás cada 5–7 s;
  - echa bocanadas de azufre que marean;
  - pega con 5.
- Vencido, deja oro, esencias y colones, y su trofeo para la casa. Si amanece antes de que nadie le mire los pies, se despide con una venia.
- Bestiario, Ayuda, consejo al morir y `/prueba bailarin`.

## 4.45.0 — 2026-11-09 · Arreglos de la duodécima revisión
**Arreglos de la duodécima revisión** (v4.36 a v4.44):
- **La bécquer** ya no vuelve a agarrar a uno después de espantarla con el cacho o el mechón. Antes, al acabar el espanto, devolvía a uno de golpe al lugar donde lo había agarrado. Además suelta sola si la mueven lejos.
- **Las garrapatas** se quitan de verdad con el baño. Antes quedaban en «NaN» para siempre y ni el alcohol las quitaba.
- **La procesión** solo se ofende con los golpes de uno (espada, honda, flechas), no con rayos, lava ni explosiones. Ya no saca Sombras si las criaturas hostiles están apagadas, y las que saca nacen en el suelo. La fila ahora pasa a unos 4 bloques de uno.
- **El «Se busca»** se cobra en supervivencia y si la criatura cae a menos de 32 bloques de uno (la mate uno, sus perros o un rayo).
- **La marabunta** vacía su caché de alturas al cambiar de mundo y solo pica a los animales que están en el suelo.
- **El espanto** (cacho, mechón) no espanta a la Sombra mansa que viene a comer al plato.
- **Textos:**
  - «de la bécquer»;
  - el pañuelo «le confunden con alguien de la banda»;
  - las botas «aguantan el veneno», que es lo que hacen (el daño de la mordida sí entra);
  - «Si se agacha, no muerden»;
  - el aviso del puma;
  - la causa «Picaduras de la marabunta»;
  - las garrapatas se quitan durmiendo en una Casa de leyenda.

## 4.44.0 — 2026-11-09 · La procesión de las ánimas
**La procesión de las ánimas** (`src/procesion.js`). Desde el día 3, de noche y a menos de 110 bloques de un pueblo, a veces (como mucho cada 25 minutos) pasa una fila de siete ánimas: mantos blancos medio transparentes, capucha gacha y una vela encendida en las manos. Caminan despacio pasando cerca de uno y rezando bajito.
- **Si uno las acompaña** (a menos de 8 bloques) unos 25 de sus 75 segundos, la última se vuelve, le deja su vela (la candela de regreso) y dos esencias, y se deshace. Logro.
- **Si uno le pega a una,** se apagan todas las velas de golpe: pavor, miedo 20 s y tres Sombras alrededor. Logro «Eso no se hace».
- Bestiario, Ayuda y `/prueba procesion`.

## 4.43.0 — 2026-11-09 · Garrapatas
**Garrapatas.** Caminando por el zacate alto de los potreros y el bosque seco, a veces (2 % por segundo dentro del zacate) se pegan garrapatas. No se van solas: cada 25 s quitan un poco de comida y medio corazón (sin bajar de 2 corazones). Se quitan con alcohol, con el botiquín, bañándose 6 s en el río o durmiendo en la casa. Salen en pantalla como «🕷 Garrapatas». Logro, Ayuda.

## 4.42.0 — 2026-11-09 · Se busca
**«Se busca»** (`src/recompensas.js`). Cada tres mañanas (desde el día 2) pegan en la pulpería un cartel con una criatura que anda haciendo daño por la zona y lo que pagan por ella:
- Pueden salir los Chatas (dos), la bécquer, el chupacabras, el Mico Malo, el puma, el Toro Guaco o el cuche de monte, según el día.
- Paga de ₡40 a ₡90, más ₡5 cada tres días (hasta ₡40 más), y la mitad de las veces una esencia.
- Dura cuatro días y está en la hoja de la partida («Pendientes»), con los días que le quedan. No sale en Tranquilo.
- Logros «Se busca… y se encontró» y «Cazarrecompensas del cantón» (5 cobrados).
- Ayuda y `/prueba sebusca [tipo]`.

## 4.41.0 — 2026-11-09 · Coral y falsa coral
**Coral y falsa coral.** Dos culebritas de anillos casi iguales salen de día en el suelo del bosque, la selva y el bosque nuboso; la mitad de las veces es la falsa.
- En la **coral** de verdad, el rojo toca al amarillo. Su mordida (si uno no va agachado) da 2 de daño, **parálisis** 25 s (un efecto nuevo: camina a menos de la mitad) y veneno.
- En la **falsa coral**, el rojo toca al negro, y la mordida no hace nada.
- Las botas de bécquer aguantan las dos. El suero, el guaco, el botiquín y la casa quitan la parálisis.
- Logros por cada una, bestiario, Ayuda («Coral y falsa coral») y consejo al morir; `/prueba bravos coral` o `falsa_coral`.

## 4.40.0 — 2026-11-09 · Pañuelo y cacho
**El pañuelo de los Chatas y el cacho del Toro Guaco.**
- **Pañuelo de los Chatas** (528, con ícono): los Chatas lo sueltan la mitad de las veces. Va en la cabeza (1 punto de armadura). Con él puesto, los Chatas creen que uno es de la banda: saludan («¿Diay, mae, qué hubo?») y no asaltan, salvo que les peguen. Logro «De la banda».
- **Cacho del Toro Guaco** (529, con ícono): el Toro lo deja al vencerlo. Soplado (clic derecho, cada 45 s) espanta durante 8 s a todas las criaturas hostiles que no son jefes a 16 bloques. Logro.
- **Arreglo viejo:** el mechón del mono congo ponía en pánico a las criaturas, pero en las hostiles el «perseguir» iba antes que el «huir» y no se iban. Ahora existe el **espanto** (`data.espanto`), que salta el cerebro y la persecución y hace huir de verdad, con el mechón y con el cacho.

## 4.39.0 — 2026-11-09 · Botas de bécquer
**Botas de bécquer.** La bécquer ahora suelta de 2 a 3 **pieles de bécquer** (ítem 526, con ícono). Con cuatro, en la cuadrícula como unas botas, se hacen las **botas de bécquer** (527): armadura de pies de 3 puntos, 1 de dureza y 450 de vida, que se repara con cuero. Además, las culebras no les pasan el colmillo: ni la terciopelo ni su reina dejan veneno ni necrosis a quien las lleva puestas. La Ayuda de la bécquer lo cuenta.

## 4.38.0 — 2026-11-09 · La marabunta
**La marabunta** (`src/marabunta.js`). Las hormigas guerreras salen de día en la selva y el bosque (desde el día 2, como mucho una cada 15 minutos) y cruzan el monte como una alfombra rojo oscuro de unos 14 × 6 bloques que avanza despacio.
- Se anuncia con un aviso («se oye un crujido de hojas…») y con 🐜 en la brújula y el mapa. Adelante brincan los pajaritos hormigueros.
- A quien se queda encima, lo pican (1 por segundo). Los animales salen corriendo, y los más chiquitos pueden caer.
- El fuego las desvía: una fogata o una antorcha adelante (o la antorcha en la mano, en su camino) las hace doblar 90°. Da logro.
- Si pasa sin picarlo, logro «Vi pasar la marabunta».
- Ayuda, consejo al morir y `/prueba marabunta`.

## 4.37.0 — 2026-11-09 · El puma
**El puma.** El león de montaña, café claro y de cola larga con la punta oscura. Desde el día 3 sale al atardecer y de noche en las montañas, el bosque nuboso, el páramo y el bosque alto (por encima de 78).
- Acecha por detrás. Si uno lo mira de frente, se agacha, gruñe y se echa para atrás despacio, y no ataca.
- Si uno le da la espalda, se acerca agachado y, a menos de 7 bloques, se tira encima de un brinco (5 de daño); después pelea a zarpazos.
- Con poca vida se va. El sol no lo quema: al amanecer se aleja.
- Trofeo, logro «Le sostuve la mirada al puma», bestiario, Ayuda y consejo al morir; `/prueba bravos puma`.

## 4.36.0 — 2026-11-09 · Trofeos y arreglos
**Trofeos nuevos y arreglos de la undécima revisión** (v4.26 a v4.35):
- **Cinco trofeos nuevos** para la casa: Toro Guaco, cuche de monte, chupacabras, bécquer y Padre sin Cabeza. Logro «La sala de los trofeos» al tener 12.
- **Bestiario:** descripciones de todas las criaturas nuevas; saínos, cuche, bécquer y Mico Malo marcados como peligrosos.
- **En Tranquilo** ya no salen criaturas bravas ni almas en pena.
- **La necrosis de la terciopelo se guarda:** antes, salir y volver a entrar la curaba gratis.
- **Generador v17:** cerca de la boca de un volcán, el río ya no rebaja el cono. En v16, en un 3 % de los volcanes el cráter quedaba colgado sobre una torre con la lava al aire. Los mundos v16 siguen igual.
- **Las criaturas nacen en el suelo:** antes, casi la mitad de los puntos de la selva y el bosque caían encima de los árboles. El Mico Malo busca hojas desde el suelo hacia arriba, así que ahora también sale en el bosque.
- **El Toro Guaco ya puede salir:** el chupacabras se comía su sorteo.
- **Las piedras del Mico Malo:** atraviesan las hojas al salir y tienen su propia causa de muerte.
- **La vuelta de la muerte** ya no bota herramientas, armas ni cosas mejoradas. Se corta al pegarle al cocodrilo, al salir del agua o al morir.
- **El cuche** no se come lo que alguien sembró o puso.
- **La Llorona** solo hunde de muy cerca, para que se pueda salir nadando.
- **El Cadejos** huele el guaro (mareo largo), no el mareo corto del llanto o los gases.
- **Textos:**
  - En la pantalla salen «✝ Bendición» y «😱 Pavor» en vez de sus nombres internos.
  - Textos de usted y sin género; «¡Alto ahí!» en boca de los Chatas.
  - El aviso de barrerse dice la tecla que esté configurada.
  - La Ayuda aclara que la necrosis se cura durmiendo en una Casa de leyenda.

## 4.35.0 — 2026-11-09 · La neblina del Cerro
**La neblina del Cerro de la Muerte y los gases del cráter** (`src/neblina.js`, de las ideas de nanoyackson):
- **La neblina:** en el páramo, de madrugada, a veces cae de golpe (como mucho una cada 7 minutos) y dura entre 100 y 160 s. No se ve más allá de unos 9 bloques. Sin calor (fogata o antorcha a 4 bloques, antorcha o lámpara en la mano, café, jengibre) entra escalofrío y cada 12 s pierde 1 de vida por hipotermia.
- **Almas en pena:** si uno se queda quieto 5 s sin calor (y a veces aunque no), sale un alma en pena a 6–10 bloques, hasta 4. Son figuras blancas, medio transparentes y sin pies, que flotan; su toque da 2 de daño, escalofrío y miedo. El fuego en la mano las deshace de cerca, y se van cuando se levanta la neblina. Logros por salir vivo de la neblina y por vencer un alma.
- **Gases del cráter:** cerca de la boca de un volcán hay bolsas de gas amarillento que huelen a azufre. Sin mascarilla marean y quitan 1 por segundo.
- **Mascarilla de gases:** se hace con lana, dos carbones y un cuero; basta llevarla en la mochila. Tiene ícono propio.
- Ayuda, consejos al morir y `/prueba neblina`.

## 4.34.0 — 2026-11-09 · Culebras y cocodrilos
**Culebras y cocodrilos más serios** (de las ideas de nanoyackson):
- **El veneno de la terciopelo pudre la herida:** cada mordida baja 1 corazón el tope de vida, hasta 4 (de 20 a 12). Se cura con el suero antiofídico, durmiendo en la casa o con **guaco**, una hierba nueva con ícono propio que sale cortando matorral, sobre todo en la selva y el manglar.
- **La vuelta de la muerte del cocodrilo común:** si lo muerde en el agua, a veces (30 %) lo agarra. Uno da vueltas y se hunde con él 1.3 s, pierde 1.5 cada 0.45 s, y la mitad de las veces se le suelta en el agua lo que lleva en la mano (sin perder las mejoras; los objetos únicos nunca se sueltan).
- Ayuda «Culebras y cocodrilos» y consejos al morir.

## 4.33.0 — 2026-11-09 · Las leyendas, más bravas
**Las leyendas, más bravas** (ideas de nanoyackson):
- **La Segua:** además de voltearse si uno se acerca o le pega, se voltea si uno **le habla** o le da la espalda de cerca más de 1.4 s. Al transformarse deja **pavor**: la vista se cierra en negro 3.5 s.
- **El Padre sin Cabeza:** ya no solo asusta. Camina hacia uno y da con el báculo: 3 de daño, y además saca 45 de aire. Los golpes lo atraviesan, salvo con **agua bendita** (ítem nuevo con ícono, ₡6 en la pulpería): tomarla da 3 minutos de bendición. Tiene 100 de vida y da logro al vencerlo. La luz todavía lo espanta.
- **La Llorona:** a menos de 5 bloques lo va jalando hacia el agua más cercana, y si uno está en el agua, lo hunde.
- **El Cadejos negro:** al que anda tomado (con guaro) o carga ₡300 o más, lo huele de lejos y viene derecho.
- **La Tulevieja:** cada 11 a 15 s, de cerca, su llanto marea (camina en zigzag y la vista da vueltas).
- Ayuda con «Las leyendas, de cerca» y consejo al morir por el báculo.

## 4.32.0 — 2026-11-09 · Cuche, Mico Malo y bécquer
**Más criaturas de las ideas de nanoyackson** (en `bravos.js`):
- **El cuche de monte:** desde el día 5, a veces manda una manada de saínos. Es grandote (1.7 veces un saíno), con 55 de vida, colmillos largos, crin rojiza y ojos rojos. Avisa de más lejos y carga más rápido, se lleva las matas y las hojas de por medio, y su colmillo deja sangrando 60 s.
- **El Mico Malo:** desde el día 3, en la selva y el bosque, aparece arriba de un árbol. Es un mono negro de brazos largos y ojos que echan fuego. Desde lo alto tira piedras; si uno anda cerca, baja a arañar y se lleva hasta 6 de algo de la mochila, y trepa al huir. Si se le alcanza, devuelve lo robado. El sol no lo quema.
- **La bécquer:** la boa enorme de las historias del sur, en la selva y el manglar. Quieta parece un tronco caído (café con manchas oscuras, sin ojos a la vista). Si uno pasa al lado, lo agarra: no se puede mover y pierde 1.5 por segundo durante 3.5 s. Cada golpe que se le da la hace soltar casi un segundo antes. Después pelea y a veces vuelve a apretar.
- Logros al vencer a cada uno; Ayuda y consejos al morir; `/prueba bravos` acepta los nombres nuevos.

## 4.31.0 — 2026-11-09 · Criaturas bravas
**Criaturas bravas de Costa Rica** (`src/bravos.js`), pedidas por nanoyackson: más variedad de enemigos, con modelos propios.
- **Saínos:** chanchos de monte con collar claro y crin en el lomo. Andan de día en manadas de 3 a 5 por el bosque, la selva y el bosque seco. Si uno se acerca, se paran y castañetean los dientes; si se queda, cargan todos juntos. Si le pega a uno, se ponen bravos todos.
- **Chupacabras** (desde el día 3): de noche en potreros y llanos, y más seguido si hay gallinas o vacas cerca. Va primero por los animales de la finca y después por uno. Pega, se aparta y vuelve. Es jorobado y gris, con una cresta de espinas moradas, ojos negros rasgados de pupila roja y garras.
- **El Toro Guaco** (desde el día 4): toro negro, enorme, con ojos como brasas y humo en el lomo, solo de noche en los llanos de Guanacaste y el bosque seco. Rasca el suelo y resopla, y embiste en línea recta; si choca contra algo, queda atontado. Al aclarar se deshace en humo.
- **Los Chatas** (desde el día 2): asaltantes del camino, con pañuelo en la cara, gorra y machete. Salen de noche en las carreteras, de 2 o 3. El primer machetazo que conecta le saca hasta un 30 % de los colones (máximo ₡60) y el que la tiene sale corriendo; si se alcanza, la plata se recupera. Atajan con el machete el 40 % de los golpes de frente que no son cargados, se hacen a un lado de un brinco y aguantan 38 de vida.
- Logros al vencer al chupacabras, al Toro Guaco y a los Chatas. Entradas en la Ayuda y consejos al morir. Comando `/prueba bravos [saino|chupacabras|toro_guaco|chata]`.

## 4.30.0 — 2026-11-09 · Lo de la mano, con volumen
**Lo que se lleva en la mano, con volumen y nítido.** nanoyackson: «deberíamos mejorar cómo se ven las cosas en la mano». El ícono se dibujaba como una lámina plana, estirada con suavizado (por eso se veía borroso) y tan grande que tapaba media pantalla. Ahora:
- **Con grosor:** cada pixel del ícono es una cajita de su color, con los costados más oscuros, así que se ve sólido al moverse y al pegar (`makeHeldItemMesh` en `models.js`).
- **Nítido:** las texturas de todos los ítems usan pixeles nítidos, también los que quedan tirados en el suelo.
- **Más chico:** un 20 % menos que antes.
- Los bloques siguen como cubito, la antorcha como palito, el machete en 3D. Las flores y matas también salen con grosor.

## 4.29.0 — 2026-11-09 · Noches bravas
**Noches bravas.** nanoyackson: «solo Sombra vi y súper fácil de matar». Ahora:
- **De noche la Sombra va primero.** Antes, la fauna, la finca y las leyendas se comían los turnos de aparición y las Sombras llegaban de a poquito. Medido: la primera noche llegan 6 en el primer minuto (antes 3, y lentas); el día 4, 8.
- **Más por noche:** Normal pasa de 6 a 8 y Difícil de 9 a 12. La ayuda de novato solo resta en las dos primeras noches (2 y 1).
- **En manada:** desde el día 3 nacen de 1 a 3 juntas.
- **Más duras:** la Sombra común pasa de 16 a 20 de vida, además de lo que suma con los días.
- **Las variantes desde el día 2:** hondera, con escudo y la nueva **Sombra brincona**. La brincona se agacha con los ojos encendidos (ese es el aviso) y se tira de un brinco encima de uno desde 3 a 7 bloques, con 4 de daño. Si falla, queda aturdida 1.4 s. Se esquiva quitándose de lado, barriéndose o con la voltereta. Está en la Ayuda y en el consejo al morir.
- Tranquilo sigue sin Sombras.

## 4.28.0 — 2026-11-09 · Barrerse con Z
**Barrerse con Z.** La deslizada salía con Shift mientras uno corría, y el mismo Shift que sirve para agacharse en un borde lo barría hacia el borde. Ahora tiene tecla propia, **Z** (se cambia en Ajustes → Teclas, «Barrerse»):
- Funciona caminando hacia adelante; corriendo llega más lejos (0.65 s contra 0.5 s) y por un instante no lo tocan.
- Quieto, Z dice cómo se hace. Sin aire, avisa.
- Shift queda solo para agacharse. La Ayuda tiene la entrada «Barrerse».

## 4.27.0 — 2026-11-09 · Carne cruda y cuero
**Carne cruda y cuero, no «de danta».** La gallina, la vaca, el venado, el cocodrilo y las Sombras soltaban «Carne de danta» y «Cuero de danta». Era el objeto genérico de carne y cuero con un nombre que ya no tenía sentido. Ahora se llaman **Carne cruda** y **Cuero**; las recetas, la carnicería y lo que ya estaba guardado siguen igual.

## 4.26.0 — 2026-11-09 · Ríos que no quedan colgados
**Generador v16: ríos que ya no quedan colgados.** El Chirripó y los volcanes levantaban el terreno después de tallar los ríos, y el cauce quedaba arriba: una zanja angosta y profunda, seca o con agua bajando en pendiente, y con paredes de arenisca, porque la arena de la orilla subía junto con el cerro. Ahora, dentro del cauce, el levantamiento se atenúa con la misma curva del río: el río cruza el cerro por un cañón al nivel del agua. La playa o el mar que quedaban levantados tierra adentro pasan a llanura. Medido en 6000×6000 bloques: centros de río levantados de 670 a 44 (los que quedan están en cráteres o en el fondo del mar), playa alta de 3042 a 0. Solo afecta mundos nuevos; los viejos se generan igual que antes para que no haya costuras.

## 4.25.0 — 2026-11-09 · Arreglos de la décima revisión
Arreglos de la décima revisión independiente (v4.21 a v4.24):
- **La bomba de espalda ya no se gasta ni desaparece al minar o pegar** con ella en la mano (contaba como herramienta). Además es un objeto único: no se pierde tirada en el suelo ni al morir.
- **La quema ya no sale del bosque seco** ni de los llanos de Guanacaste, aunque nazca en la orilla.
- **Solo arde el monte silvestre**: nada sembrado (maíz, café, piña, banano, cacao), nada colocado (estacas, alambre, trampas, cencerros) y nada que alguien haya puesto o cambiado (troncos de una casa o de una obra). Tampoco entra a 90 bloques de un pueblo, ni cerca del lote o de la cama.
- **El final dice lo que pasó**: si uno la agarra chiquitica, «la apagó a tiempo»; y cuenta como apagada si uno apagó más de lo que se quemó solo, aunque el último foco se consumiera.
- **El balde alcanza las copas** de los árboles (hasta 7 bloques de alto).
- Lo quemado que nadie volvió a ver se olvida a los 40 días, para que no llene la lista del rebrote.
- El logro «Bombero de monte» pasa a «Apagafuegos de monte».
- La carta sin sello de Don Chema no llega en medio de un asedio ni de la Noche de Ceniza, y el aviso dice dónde quedó.
- La Ayuda aclara que el cortafuegos se hace de dos bloques de ancho.

## 4.24.0 — 2026-11-09 · La bomba de espalda
**La bomba de espalda.** Al apagar la tercera quema, la brigada de voluntarios le manda una bomba de espalda (ítem 522), con ícono propio.
- Clic derecho rocía un chorro hasta 9 bloques y apaga los focos alrededor de donde cae, igual que un baldazo, pero desde lejos y sin ir al río cada vez.
- Trae 8 rociadas; solo gasta cuando cae sobre fuego. Se llena apuntando a cualquier agua (sin sacarla).
- La barra de la mano y la ficha dicen «💧 Agua n/8» en vez de desgaste, y no avisa como herramienta por romperse. No se mejora en el yunque.

## 4.23.0 — 2026-11-09 · El monte rebrota
**El monte rebrota.** Lo que deja una quema (tierra con ceniza) ahora se anota, y cuando llueve vuelve a echar pasto, tres columnas por segundo, con alguna mata de pasto alto. Los troncos negros se quedan, como en el monte de verdad. Si uno ya construyó o cavó ahí, se respeta. Cuando rebrota todo: logro «Rebrotó el monte» y una línea en el diario. Antes el aviso lo prometía y no pasaba.

## 4.22.0 — 2026-11-09 · Quemas de verano
**Quemas de verano.** En verano, sin lluvia, andando por el bosque seco o los llanos de Guanacaste, a veces se prende el monte entre 28 y 50 bloques de distancia (más seguido en la sequía, y como mucho una cada 4 días). Se ve la columna de humo y aparece 🔥 en la brújula y en el mapa.
- El fuego avanza por el zacate, las matas y los árboles, más rápido a favor del viento. Lo quemado queda en tierra con ceniza y troncos negros; el pasto se vuelve tierra.
- **Un balde de agua** apaga los focos alrededor del golpe (3 bloques), sin dejar charco, y devuelve el balde vacío. **Donde no hay nada que arda, no pasa**: con la pala se hace un cortafuegos. La lluvia la apaga sola. Nunca entra al terreno de la casa.
- Si el último foco lo apagó uno (y apagó por lo menos 4), la brigada de voluntarios del cantón manda ₡40 (₡20 si ya se había comido mucho). Logros «Bombero de monte», «Brigadista» (tres apagadas) y «Humo de verano» (verla acabarse sola).
- Pararse en las llamas quema según la dificultad; la Piel de fuego protege. Las llamas se dibujan aparte, así que una quema a medias no queda guardada en el mundo.
- La hoja de Ayuda y la pantalla de muerte lo explican; `/prueba quema` prende una delante.

## 4.21.0 — 2026-11-09 · Arreglos de la sexta revisión
Arreglos de la sexta revisión independiente (v4.17 a v4.20):
- **La cabeza de agua ya no sale en el mar ni en los manglares.** Solo en el cauce de un río; en el mar abierto no hay de dónde salir en 6 segundos.
- **Don Chema jubilado ya no sube.** Las cartas que faltaban después de la suya llegan solas, una por día, junto a la puerta y con la letra de él. Su carta de despedida tiene diálogo propio («Esta no es del bolso. Es mía»).
- **Las avispas pican según la dificultad** (0.6 en Tranquilo, 1 en Normal, 1.4 en Difícil).
- **Cortar hojas desde el agua no suelta avisperos** (antes regalaba el logro sin correr).
- **La miel del panal dura 15 minutos en el suelo** en vez de 5, y los avisos dicen «vaya pronto».
- **El locutor de la radio y las noticias vistas se reinician al cambiar de partida.**
- **El build vuelve a salir sin advertencias**: el historial de versiones, la lista de logros y las cartas van en un archivo `textos`, y el expediente y el epílogo en uno `trama`. El archivo principal bajó de 928 a 473 kB.

## 4.20.0 — 2026-11-08 · Avisperos
**Avisperos.** Al cortar hojas en el bosque, la selva, el bosque nuboso o el bosque seco, a veces (1.5 %) se cae un avispero. Las avispas persiguen hasta 9 segundos y pican 1 por segundo. Se sale de ellas corriendo a 14 bloques o metiéndose al agua, y la miel del panal queda donde cayó. La hoja de Ayuda y la pantalla de muerte lo explican.

## 4.19.0 — 2026-11-08 · La última vuelta
**Don Chema se jubila.** Cuando ya le trajo casi todo el correo, la última carta la sube en la mano: treinta y un años subiendo cerros, y lo que más recuerda es el café de esta casa. Le deja su bicicleta («los frenos no sirven, pero la cuesta tampoco es tan brava si uno va contento»).

## 4.18.0 — 2026-11-08 · La casa de todos
- **La casa de todos**, nivel 5 de la casa: hace falta la Casa de leyenda, la gente de la casa (los cuatro), Don Anselmo de vuelta, Marielos a la mesa, 8 sillas y 2 mesas de comedor. Las Sombras nacen lejísimos (90 bloques), la finca deja el doble cada mañana y en los asedios vienen dos Sombras menos por oleada. La hoja de la ruta dice qué falta.
- **Postales para el álbum**: llegar por primera vez al Volcán Arenal, el Chirripó, las Esferas, Tortuguero, Monteverde, Playa Conchal o la Isla del Coco pega su estampa de la página de Lugares.

## 4.17.0 — 2026-11-08 · Doce arreglos
Una revisión independiente de la v4.10 a la v4.16 encontró 12 puntos. Quedaron arreglados:
- **La cabeza de agua salía donde no debía**: en lagos de cueva, charcos y piscinas, y casi nunca en un río de verdad. Ahora solo sale en el cauce de un río. **Medido**: en un río sí, en un charco no. Tampoco sigue contando si uno se muere o cruza un portal en esos 6 segundos.
- **Con escudo puesto ya no se podía tirar la chancleta**: ahora se tira igual.
- **Lo que no se puede volver a conseguir**: si se cierra la pestaña o la mochila va llena, ya no se pierde. Vuelve con uno al regresar.
- **El epílogo** ya no despausa el juego si se abrió el menú encima.
- **Yendry** ya no se esconde en una copa, un techo, el fondo del agua o dentro de un cerro, y un escondido de antes de recargar ya no cuenta.
- **La cuarta estrella en diamante** ya pide bien el diamante. La ficha dice «3/4» cuando se puede subir más, y la guía y los consejos ya no dicen «hasta 3».
- **La radio** habla como mucho cada 3 minutos.
- **El botón del álbum** no aparece cuando lo único que falta todavía no puede salir.
- **Un texto de Yendry** ya no asume el género de quien juega.

## 4.16.0 — 2026-11-08 · Lo nuevo en el mapa
- **El mapa (M) muestra lo nuevo**: la Grieta, el Archivo Municipal, la marca vieja de la escritura, la audiencia, los encargos de la gente de la casa y a quien pide auxilio.
- **Don Tobías** ya dice que la tecla Y explica cómo funciona cada cosa.

## 4.15.0 — 2026-11-08 · La cuarta estrella
**La cuarta estrella.** Con Ñor Tino viviendo en la casa y su martillo de vuelta, el yunque llega a cuatro estrellas: 48 % más de daño o de velocidad, y +1 de protección por pieza. Cuesta 8 de su material, 3 de esencia y 2 diamantes. Hasta entonces, el yunque avisa que Ñor Tino sabe hacerlo.

## 4.14.0 — 2026-11-08 · Ocho arreglos
Otra revisión independiente, de la v4.5 a la v4.9, encontró 8 puntos. Quedaron arreglados:
- **El escudo no bloqueaba si uno miraba al enemigo** que estaba por pegar, justo cuando más hace falta. Era un error de hace mucho: ahora con escudo y mirando a algo hostil, el clic derecho bloquea, y con un vecino en la mira, se le sigue hablando.
- **El epílogo se cerraba solo** si uno venía caminando: la tecla sostenida lo saltaba y no volvía a salir. Ahora caminar no lo cierra, y mientras se lee, el juego espera.
- **Consejos al morir equivocados**: un rayo o un jaguar daban el consejo de las caídas, y una piedra del temblor, el de la hondera. Ahora cada uno da el suyo, y el de comer dice la tecla que uno tenga.
- **Lo que no se puede volver a conseguir** ya no se queda tirado al salir al menú ni al cruzar un portal: vuelve a la mochila. Y si no cabe, se dice.
- **El álbum ya no adelanta la historia**: Don Anselmo, El Olvido, la Jefa de Ventanilla, la Sombra Madre, Marielos y Yendry no salen en los sobres hasta que aparecen en la partida.
- **La Ayuda** dice que bloquear pide escudo, y tiene un texto más sin género.

## 4.13.0 — 2026-11-08 · Escondido
- **Escondido con Yendry**: después de su regalo del día, si se le vuelve a hablar, propone jugar escondido. Se va a esconder a 14–28 bloques, y hay 90 segundos para encontrarla y hablarle, sin brújula, «que eso es trampa». Si la encuentra, da dos sobres de estampas; si no, gana ella y pide revancha mañana.
- **Cuatro sueños nuevos**: el número de la Ventanilla, el álbum al que le falta una estampa, el río que crece y una carta de Don Chema sin remitente.

## 4.12.0 — 2026-11-08 · Noticias en la radio
**Radio Marimba ahora da noticias** (ficticias). Entre pieza y pieza, el locutor cuenta lo que uno ha hecho, a su manera: los asedios que aguantó la casa («el de la ferretería dice que fue su cemento»), la Sombra con nombre que anda suelta, el señor que volvió de comprar cigarros («dice que había fila; estamos verificando»), el álbum completo, la Ventanilla 3 que cerró a la hora… Si no ha pasado nada, hay deportes, clima y avisos municipales.

## 4.11.0 — 2026-11-08 · El Canelo escarba
**El Canelo escarba.** Una vez por día, de mañana y cerca de uno, el perro de la abuela se pone a escarbar y saca algo: colones enterrados, semillas, manzanas, un sobre de estampas o, rara vez, esencia de Sombra.

## 4.10.0 — 2026-11-08 · La cabeza de agua
**La cabeza de agua.** Cuando llueve y uno anda metido en un río, el río puede crecer de golpe con lo que cayó en la montaña.
- **Avisa**: primero se oye un rugido río arriba, y hay 6 segundos para salir del agua.
- **Si sale a tiempo**, ve pasar troncos, piedras y lodo, y gana un logro.
- **Si se queda**, la corriente lo arrastra: 7 de daño y escalofrío.
- Pasa como mucho una vez cada 8 minutos, y no en el mar.
- La hoja de Ayuda y la pantalla de muerte lo explican.

**Rendimiento medido** con el caserío, la Sombra con nombre, el plato y el correo activos a la vez: una actualización del juego tarda unos 5 ms y el dibujo unos 4 ms. Los sistemas nuevos casi no pesan.

## 4.9.0 — 2026-11-08 · Traer receta
- **Traer receta**: un botón nuevo en el inventario saca de los cofres que uno tenga a la mano (6 bloques a la redonda) exactamente lo que le falta a la receta fijada con 📌. Ya no hay que abrir cofre por cofre.
- **Yendry trae un sobre de estampas por día** después de recibir su carta, cada vez con su excusa.

## 4.8.0 — 2026-11-08 · El álbum de estampas
**El álbum de estampas de Tiquicia**, en la libreta (tecla **I**). Son 40 estampas en cinco páginas: Leyendas, Fauna, Lugares, La familia y Los que asustan.
- **Sobres**: se compran en la pulpería a 8 colones, o los suelta a veces una Sombra vencida (5 %), una leyenda (30 %) o un jefe (siempre). Se abren con clic derecho y traen tres estampas.
- **Las raras** (los jefes, Zenaida, Anselmo, la Isla del Coco…) salen cuatro veces menos.
- **Repetidas**: tres se cambian por una que falte, con un botón en el álbum.
- **Cada página llena paga**: colones, esencia, botiquín, diamante o casados. El álbum completo paga 200 colones y 3 diamantes.
- `/prueba album` da 10 sobres.

## 4.7.0 — 2026-11-08 · Quince arreglos más
Una revisión independiente que simuló el Archivo en 107 mundos encontró 15 puntos. Quedaron todos arreglados:
- **En el desierto, la arena tapaba la entrada del Archivo**, y la grava caía en las oficinas: ahora la obra no hace caer la arena ni la grava. Lo mismo para la Grieta.
- **Morir en la oficina de la Jefa** la hacía reaparecer sin parar bajo la pantalla de muerte.
- **La Sombra apagadora**: si le pegan, o a los 8 segundos sin llegar a la antorcha, pelea como cualquiera. Tampoco apaga a través del techo, ni en pueblos, en la Grieta o en el ruedo.
- **Modo Tranquilo**: el Archivo ya no trae funcionarios ni Jefa.
- **Lo que no se puede volver a conseguir** ya no se pierde si se queda en un suelo que se deja de cargar: vuelve a la mochila. Y quien rompe la reja a pico, también pasó.
- **Con poca distancia de visión**, la grada del Archivo podía quedar sin terminar.
- **Don Chema** entrega de verdad una carta por visita.
- **Ñor Tino** ya no deja una puerta más fuerte que nueva, ni grita si no hay nada que arreglar.
- **La olla** devuelve su carbón al romperla y no lo gasta en lo que no se deja pegar. El alambre ya frena a todas las Sombras, y no molesta a las leyendas.
- **El Sello de goma** se ve como sello en la mano.
- **Más textos** sin género asumido.

## 4.6.0 — 2026-11-08 · El epílogo
**Un epílogo para quien termine todas las historias.** Con Don Anselmo en la casa, los cuatro encargos cumplidos, Marielos y Yendry, el primer domingo cerca de la casa sale una pantalla en negro que cuenta esa partida con sus propios números: los días, las veces que se cayó, la Sombra con nombre que venció, a cuántas les guardó el plato. Termina con los créditos de toda la gente. Sale una sola vez.

`/prueba epilogo` muestra la pantalla sin tocar la partida.

**Balance**: el bot de pruebas se quedaba quieto porque la oferta de mañas ahora pausa el juego; ya no. Con eso, volví a medir y los asedios del día 5 al 30 se siguen ganando.

## 4.5.0 — 2026-11-08 · Ayuda y los noventa
- **Hoja de Ayuda** en la libreta (tecla **Y**): explica cómo funciona cada cosa, con sus teclas, y va creciendo con lo que uno se va topando, para no estropear las sorpresas.
- **Consejo en la pantalla de muerte**: según qué acabó con usted, un consejo útil. Parry contra las Sombras, zigzag contra las honderas, moverse cuando la Jefa de Ventanilla pide un timbre…
- **Los noventa de Doña Eulalia**: desde el día 16 y el capítulo 4, ella lo deja caer una sola vez. Si uno le lleva un tres leches un domingo, se arma la fiesta en la plaza, con bombetas y la gente gritando, y ella abre una carta que Zenaida le dejó «para cuando alguien se acordara».
- **Don Tobías escribe**: cuando Don Anselmo ya volvió a la casa, llega por correo lo que nunca le dijo a nadie: quién le cargaba el canasto a Zenaida.

## 4.4.0 — 2026-11-08 · Defender la casa
**Defender la casa ahora da más opciones, y la luz ya no lo arregla todo.**
- **Olla caliente**: se hace con 5 de hierro y se carga con carbón (hasta 8). A lo hostil que se arrime a 3.6 bloques le cae agua hirviendo: 7 de daño a todos, cada 4 segundos, y gasta 1 de carbón.
- **Alambre de púas**: enreda a lo hostil que lo pise (va a un tercio de velocidad) y lo lastima. A uno no le hace nada, y de vez en cuando se rompe.
- **La gente de la casa ayuda en plena pelea**: Doña Flor le cura si anda con menos de media vida, Niña Chepa le da de comer y Ñor Tino le remienda la puerta. Con su encargo cumplido, hacen más y más seguido.
- **Sombra apagadora**: desde el día 6. No viene por uno, viene por la luz: busca la antorcha más cercana y la apaga. Tiene poca vida pero es rápida, y si no encuentra antorchas, pelea como cualquiera.

## 4.3.0 — 2026-11-08 · El Archivo Municipal
**El Archivo Municipal: una mazmorra nueva.** Sátira con una municipalidad ficticia: «Bodega 3, por falta de espacio», un sótano en medio del monte.
- **Cómo se llega**: desde el día 18, Don Chema trae una carta «fuera de actas». La brújula marca 📁 una grada que baja.
- **Nueve oficinas**: con repello, libreros, sillas de espera y letreros («Horario: de 10 a 11. Cerrado por almuerzo de 10 a 11»). En cada oficina que uno pisa por primera vez salen Funcionarios de turno.
- **Tres sellos**: el de Trámite, el de Visto Bueno y el de Vuelva Mañana, en tres cofres. Con los tres, la reja de la Ventanilla 3 se abre sola.
- **La Jefa de Ventanilla**, jefa nueva, 240 de vida. «Le falta un timbre»: marca el piso donde uno está y a los 2 segundos cae el sellazo, así que hay que moverse. Llama compañeros al 66 % y al 33 %. Si uno se muere: «Cerraron por almuerzo».
- **El premio**: el **Sello de goma**, un arma de 8 de daño que a veces deja aturdido («¡SELLADO!»), colones, esencia y el expediente que Zenaida metió en 1991. Conviene leerlo después de la libreta de Anselmo.
- `/prueba archivo` pone uno cerca.

## 4.2.0 — 2026-11-08 · Hay correo
**Don Chema y el correo.** Si hay algo para uno, el último cartero sube a la casa de mañana. Trae una carta por visita, y se le habla para recibirla.
- **12 cartas**, según cómo vaya la partida: un cobro de la Municipalidad por un rancho que no existe, un banco ficticio, una reseña de turista, una postal de Marielos, un dibujo de Yendry, una nota sin firma de alguien que comió en su plato…
- **Don Hermes** le paga a la cepa los 40 colones que le debía a Zenaida desde el 71.
- **Una carta que Zenaida dejó pagada** para el día 30, con unos frijoles.
- **La Sirena devuelve la otra chancleta**, 64 años después. Con las dos, la chancleta pega 60 % más.
- **La hija de Ñor Tino**: después de su encargo, ella escribe, y unos días más tarde llega a la casa. Once años sin hablarse.
- `/prueba correo` lo llama.

## 4.1.0 — 2026-11-08 · Veinticuatro arreglos
Una revisión independiente del código nuevo y de **toda la trama** encontró 24 puntos. Quedaron arreglados.

**Errores**
- **El mirador de Wilber no se podía subir**: las gradas iban para el otro lado. Ahora llegan, y él vigila desde arriba. **Medido** subiendo con el personaje.
- **El mirador pisaba lo que uno construyó**: ahora escoge la esquina del patio más libre y no toca lo que hay.
- **Las ruinas y la Grieta podían caer dentro de un pueblo** o encima de un monumento, un rancho o un marcador: ahora se alejan, y si al llegar hay cofres u otras cosas puestas, la ruina se va a otro lado.
- **Partidas viejas**: quien ya vivía en la casa nunca pedía su encargo.
- **Si se perdía el sobre de Marielos**, la historia se trababa: ahora se resuelve igual. Y lo que no se puede volver a conseguir ya no desaparece del suelo a los 5 minutos.
- **Romper el cofre de un encargo** ya no lo traba.
- **La llegada de Marielos antes de la Noche Larga** ya no tapa la escena del sobre, y ahora llega de día y con cuerpo.
- **La ficha**: ya no revela las recetas que hay que aprender, no dice «Antorcha: sale de Antorcha» y pone primero las tiendas más baratas.
- **Dos logros compartían clave**: «Mandadero del pueblo» volvió a su lugar.

**La trama**
- **Rigo y Eulalia hablan en orden**: Rigo se presenta antes de contar nada, y ya no pregunta por la libreta con su papá sentado al lado. Eulalia se presenta antes de hablar de la escritura.
- **Contradicciones**: la carta hablaba de un «bus» que nadie mencionó, Marielos decía «le puso techo» cuando ya estaba, Anselmo hablaba de un solo güila cuando eran tres, y la última carta decía estar debajo de un Corazón que seguía partido.
- **Wilber**: su historia ya no se contradice, y una Sombra ya no cuenta exactamente la misma.
- **«Y como ya tiene seguro…»** ya no se lo dice a quien no lo compró.
- **Sueños**: la despedida de Zenaida sale de última, y los martillazos solo si de verdad hay martillazos.
- **Menos repetición**: menos «no estoy llorando» y menos «coma bien» en boca de otros, más tico («refri», «vacaciones de medio año») y dos moralejas menos.
- **Más textos neutrales** respecto al género de quien juega.

Regresión: 36 comandos `/prueba` seguidos sin errores, y la ficha de todos los objetos revisada.

## 4.0.0 — 2026-11-08 · La otra cepa
**Trama dentro de la campaña: la prima Marielos.** Otra nieta de Zenaida, vende bienes raíces y le gustaría hacer un hotel en el lote.
- **Las ofertas**: desde el día 8 llega con carpeta y ofrece 300 colones por la casa, luego 500 y luego 800. Cada vez se le va notando más que no viene por la plata.
- **Lo que se le sale**: a ella, que cuidó a Zenaida cuando se quebró la cadera, no le dejó ni una carta.
- **Sí le dejó**: con el tercer escondite, o con el tercer pedazo para quien no anduvo buscando, aparece un sobre sellado: «Para Marielos. Cuando se le pase». Entregarlo abre una carta nueva de Zenaida.
- **Después**: viene a comer los domingos («para vigilar la propiedad»), y antes de la Noche Larga llega con el carro lleno: antorchas, botiquines, estacas y casados.
- **El tío Rigo** también dice lo suyo, hay un sueño nuevo y sale en la carta para Yendry.
- `/prueba prima` la llama, y con varias llamadas se avanza.

## 3.99.0 — 2026-11-08 · De dónde sale, y los encargos
**La ficha de cada objeto ahora dice de dónde sale y para qué sirve.** Se arma sola con las recetas, el horno, lo que suelta cada criatura, los bloques y las tiendas: «🔥 Se funde en el horno», «💀 Lo suelta», «🏪 Se compra», «🧩 Sirve para»… Y lo que hay que ir a buscar lo dice aparte: obsidiana, calcita, minerales, barro y esencia.

**Encargos de la gente de la casa.** Después del primer día, cada persona pide un favor: ir por lo que dejó en el lugar de donde la dejaron de esperar. Son ruinas a unos 250 bloques de la casa, marcadas con 📌 en la brújula, con Sombras cuidándolas y una placa que cuenta algo.
- **Ñor Tino y su martillo**: ahora arregla todo lo que uno trae puesto, no solo lo de la mano.
- **Niña Chepa y su recetario**: dos platos por día.
- **Doña Flor y su mata**: además de curar, un botiquín por día.
- **Mae Wilber y su catalejo**: levanta un mirador en el patio, y dispara más lejos y más duro.
- **La mesa larga**: con los cuatro encargos cumplidos, los domingos se come juntos cerca de la casa: panza llena y fuerza por 10 minutos.
- `/prueba caserio` pone a los cuatro en la casa.

## 3.98.0 — 2026-11-08 · Quince arreglos
Una revisión independiente de todo lo nuevo (de la v3.91 a la v3.96) encontró 15 puntos. Quedaron todos arreglados:
- **El Olvido no soltaba nada** y desaparecía de golpe: ahora termina de morir, y el premio va directo a la mochila (6 de esencia, 3 diamantes y carbón).
- **Si no era uno quien le daba el golpe final** (dinamita, peón), la pelea quedaba colgada. Ya no. Además, ahora se le ve la barra de vida.
- **Perder la hoja de firmas trababa la misión**: el peajero, Porras y Doña Eulalia dan otra, y las firmas no se pierden.
- **La escritura podía caer en la copa de un árbol** o en una pared de uno: ahora va en suelo natural y despejado.
- **La Sombra con nombre**: ya no se la adjudican a una Sombra si lo mató un jaguar o una dinamita, y si uno vuelve y la vence esa misma noche, también paga. Ya no deja una 🩸 clavada al cambiar de mundo o de dimensión.
- **La Sombra mansa** ya no se enoja por pisar una estaca, ni la atacan el peón, el perro o el Cadejos blanco. Llega junto al plato, y no al techo de la casa.
- **Hostiles apagados**: la gente de la casa se queda, solo dejan de salir rescates. La Grieta se resuelve con el plato, igual que en Tranquilo.
- **El plato también funciona en modo Tranquilo.**
- **Un rescate que salió bien** ya no avisa después que «ya no se oye a nadie».
- **Salir del mundo justo al final de la Grieta**: la boca se tapa al volver.
- **El trofeo de El Olvido** ya cuenta como trofeo y no se lo puede robar la ladrona.
- **Más textos** al trato de usted y sin género («¡Llegó a un pueblo!», «Atrapó una rana dardo»…), «la plaza del pueblo» bien escrito, y Don Anselmo ya no habla de quien todavía no conoce.
- «🌟 Maña nueva» solo sale cuando de verdad hay una nueva.

**Regresión**: 33 comandos `/prueba` seguidos sin errores, la Grieta jugada de punta a punta y una partida con todo lo nuevo guardada y vuelta a cargar.

## 3.97.0 — 2026-11-08 · Sueños y recuerdos
- **Sueños**: al dormir de noche, cada tanto y nunca dos noches seguidas, aparece una línea sobre la pantalla negra según cómo vaya la partida. Hay 13, cada uno sale una sola vez y queda en el diario. Van colando pistas de Zenaida y de Anselmo antes de que se entiendan.
- **Lo que quedó en la casa**: en una partida nueva, adentro hay un retrato de boda y un almanaque del 62 con un mandado apuntado: «Cigarros». Nadie lo explica hasta mucho después.
- **La escalera de la Grieta**: ahora es una cinta sin huecos con baranda por dentro, y tiene portillos para el que se quiera tirar al agua. **Medido** caminando con el personaje: de arriba abajo en 36 segundos, sin daño.

## 3.96.0 — 2026-11-08 · La gente de la casa
La casa ya no es solo donde se duerme: ahora se viene a vivir gente.
- **Alguien pide auxilio**: desde el día 3, cada 3 días como mínimo, andando lejos de la casa de día. La brújula marca 🆘. Hay que quitarle las Sombras de encima.
- **Una cama de sobra**: la primera cama es de uno. Por cada cama más en la casa o cerca de ella, se viene a vivir uno de los rescatados. Hay razón para construir cuartos.
- **Cuatro personas**, cada una con su historia de alguien a quien dejaron de esperar:
  - **Ñor Tino, herrero**: deja como nueva una herramienta o pieza por día, la que uno traiga en la mano.
  - **Niña Chepa, cocinera**: un plato con efecto por día.
  - **Doña Flor, curandera**: una vez por día quita todos los males, llena la vida y da dos vendas.
  - **Mae Wilber, vigilante**: le dispara a lo que se acerque a la casa, a 18 bloques o menos, y avisa cuánto falta para el próximo asedio.
- **Con los cuatro** es un caserío: cada mañana le dejan 8 colones.
- **Salen en todas partes**: en la hoja de la partida, en los pendientes, en lo que dice Don Anselmo y en la carta para Yendry.
- **Modo Tranquilo**: no hay rescates.
- `/prueba gente` arranca el siguiente rescate.

## 3.95.0 — 2026-11-08 · La Ruta del Progreso
**Trama para la mitad de la partida: la Ruta del Progreso.** Sátira con una municipalidad ficticia.
- **Desde el día 20**, el Lic. Porras llega con un rollo de planos: por la casa de Zenaida va a pasar una carretera de cuatro carriles, con entrega en el 2049. Deja a un peajero provisional en el corredor, que no cobra nada pero comenta.
- **Las firmas**: ocho vecinos tienen que firmar la hoja, cada uno con su opinión sobre la carretera. Sirve cualquier vecino, incluso los de la historia.
- **La escritura**: Zenaida no confiaba en los bancos ni en el catastro. Doña Eulalia dice dónde está: enterrada en el patio, bajo una tabla, a dos cuartas de la superficie.
- **La audiencia pública**: en la plaza del pueblo, de día, con la gente gritando lo suyo. Se resuelve de tres maneras, según lo que uno tenga en la mano:
  - **La escritura**: es de 1931, anterior a la Municipalidad. Paga 150 colones.
  - **100 colones**: se archiva, pero la gente vio. Baja la reputación.
  - **Un plato de comida**: nadie le dice que se puede, solo se queja del hambre. Se le traspapela el expediente, le regala un Permiso de Todo y viene a almorzar los domingos.
- **Nada de esto castiga**: lo peor que pasa es el peajero.
- `/prueba expediente` lo arranca.

**Pendientes y lo que viene**: la hoja de la partida (libreta) ahora empieza con todo lo que uno tiene a medias (mañas, Sombra con nombre, maletín, escondites, Yendry, expediente, nidos) y con cuánto falta para el próximo asedio, la luna llena y Don Carlos.

## 3.94.0 — 2026-11-08 · Guardarle el plato
Si las Sombras son los que nadie esperó, también se les puede dar de comer.
- **Plato servido**: se hace en la mesa con tablas y un gallo pinto, o se llena un plato vacío con clic derecho y cualquier comida cocinada. La casa de la abuela ya trae uno vacío bajo la ventana, sin explicación.
- **De noche viene alguien**: una Sombra mansa, despacio, que no le hace caso a uno. Come, deja algo y se va. Si no encuentra camino, se pasa por lo oscuro hasta el plato, aunque la puerta esté cerrada.
- **Quién era**: al terminar de comer se sabe quién fue en vida. Hay 20 historias cortas, unas tristes y otras no tanto, y quedan en la hoja de la partida.
- **Si uno le pega**, se acaba la paz y pelea como cualquier otra.
- **Premios por servir**: colones y a veces esencia cada vez; a las 6, una Sombra menos cada noche; a las 12, un corazón más; a las 20, un logro.
- La carta que uno le deja a Yendry lo menciona.
- `/prueba plato` da platos y hace de noche.

## 3.93.0 — 2026-11-08 · Los cigarros de Anselmo
**Una trama nueva por debajo de las cartas: los cigarros de Anselmo.** En la familia siempre se dijo que el abuelo se fue a comprar cigarros en el 62 y no volvió.
- **La libreta**: junto a cada pedazo del Corazón aparece una página de una libreta vieja. Se va armando quién la escribió, por qué la abuela «nunca pasó de dos» y qué son de verdad las Sombras.
- **El tío Rigo y Doña Eulalia** reconocen la letra y dicen lo que saben, o lo que juraron no decir.
- **Después del final**, Doña Eulalia entrega la carta que Zenaida no pensaba dar, y la brújula marca **la Grieta**: un pozo con escalera de caracol, en medio del monte, a unos cientos de bloques de la casa.
- **Al fondo** hay más de dos mil platos lavados, un cofre con cigarros del 62 sin abrir y alguien que pregunta si ya es domingo. Hay que llevarle un **gallo pinto**.
- **La pelea**: al soltar la Grieta sale todo junto: tres oleadas y **El Olvido**, un jefe nuevo con su trofeo. Cuando respira hondo hay que cubrirse con el escudo; si no, se apaga la pantalla un rato y uno ya no sabe qué traía en la mano.
- **El regreso**: un corazón más, Don Anselmo se queda en la casa y guarda un plato cada mañana, y hay una escena con el tío Rigo que llevaba 64 años pendiente. Y una última página.
- **Si uno se muere o se aleja**, él vuelve a aguantar: se baja y se le habla otra vez.
- **Modo Tranquilo**: basta con el plato.
- `/prueba grieta` pone una cerca para probarla.

**Arreglos de una revisión independiente del código**
- La misión de Yendry **no se podía terminar**: al darle la venda, uno se vendaba a sí mismo y la perdía.
- La oferta de mañas ahora **pausa el juego**, y no se abre bajo el agua, en el aire ni con enemigos a menos de 32 bloques.
- La Sirena y la Bruja Zárate le quitaban el cupo a las leyendas que cuentan para la historia. Además, el Padre y el Cadejos blanco ya no se acumulan: uno de cada uno.
- El tercer cartel seguido se perdía y podía salir días después.
- Mano verde y la cosecha doble de la habilidad **ya doblan de verdad**.
- Vencer al Viejo del Monte cuenta también para la ruta.
- Doña Eulalia ya no llama cada 12 segundos para siempre.
- Tres textos más que asumían el género del jugador.

## 3.92.0 — 2026-11-08 · La que le ganó
Morir ya no es solo perder tiempo: deja a alguien con quien arreglar cuentas.
- **La Sombra que lo mata se queda con nombre**: «La Deuda», «El Recibo», «La Ventanilla 3», «La Suegra», «El Último Bus»… La pantalla de muerte lo dice.
- **Vuelve por usted**: desde la noche siguiente, en cualquier momento de la noche llega con más vida y más fuerza, rodeada de un humo rojo. La brújula la marca con 🩸 y se le ve el nombre al mirarla.
- **Si vuelve a ganar, sube de nivel**, hasta 5.
- **Si uno la vence, se saldan las cuentas**: colones, esencia y experiencia según su nivel, y tres logros nuevos.
- **Si uno huye** o sale el sol, se va, pero vuelve otra noche. No sale en un asedio, en una plaza ni en la Noche de Ceniza.
- **El mundo se entera**: la gente del pueblo la comenta, sale en la hoja de la partida y en la carta que uno le escribe a Yendry.
- **Modo Tranquilo**: no hay.
- `/prueba nemesis` la llama.

**Un solo trato**: el juego ya no alterna «vos» con «usted». Unos 90 textos del sistema, avisos y causas de muerte quedaron parejos, y también salieron los «mijo» y otros textos que le asumían el género al jugador.

## 3.91.0 — 2026-11-08 · Mañas: decidir cómo jugar
Pasado el nivel 10, subir de nivel casi no daba nada, y nadie decidía cómo quería jugar. Ahora hay **mañas**:
- **Cada tanto, una decisión**: en los niveles 2, 4, 7, 10, 13, 17, 21, 26, 31 y 37 se ofrecen tres mañas, una de pelea, una de monte y una de oficio, y uno se queda con una para toda la partida.
- **19 mañas** para armar el personaje: Mano pesada, Por un pelito (una vez al día, el golpe mortal le deja un corazón), Reflejos, Camello, Buche de hierro, Ojo de gato, Cae de pie, Sueño pesado, Buen ojo, Mano verde, Se le pega la plata…
- **Hacha de monte**: con hacha, cortar un tronco tumba el árbol entero, de abajo para arriba. Un horcón de la casa no se viene abajo, porque un árbol tiene copa.
- **No estorba**: la oferta se abre sola solo cuando no hay pelea cerca. Si uno la cierra sin escoger, queda en la libreta (tecla **U**) y se le recuerda cada 4 minutos.
- **Partidas viejas**: lo ganado por nivel queda pendiente y se puede escoger.
- `/prueba manas` da experiencia para ver la oferta.

## 3.90.0 — 2026-11-08 · Catorce arreglos para el primer recorrido
Una auditoría siguió la historia capítulo por capítulo, como un jugador nuevo. En Normal ningún paso era imposible, pero varias cosas iban a trabar o confundir:
- **La Sirena**: podía tardar varias noches, sin ninguna señal, y uno creía que estaba roto. Mientras el capítulo la pide, sale pronto y se oye su canto.
- **Morir en el Inframundo o el Cielo**: el bolso se daba por recogido o apuntaba a la nada. Ahora sabe en qué dimensión quedó. El 🌀 de la brújula marca el portal para volver, allá el 🎒 marca el cofre, y la pantalla de muerte lo explica.
- **Calcita y obsidiana**: nadie decía dónde están. Ahora lo dicen los objetivos, la ruta y Doña Eulalia, y Don Carlos las vende. El premio de la ruta da 11 de obsidiana, lo justo para el marco y la Llave, en vez de 4.
- **Jefes que hacían esperar 8 minutos sin avisar**: mientras la historia los pide, el Señor del Arenal y la Arpía vuelven en 2, y el objetivo ya dice que hay que aguantar ahí.
- **Leyendas**: se dice que salen desde el día 4, salen más seguido en su capítulo y el Padre, el Cadejos blanco y la Carreta ya no les quitan el cupo. La ruta ahora también cuenta a la Mona y al Duende, igual que la historia.
- **Modo Tranquilo**: el capítulo de las leyendas era imposible. Ahora se pasa solo.
- **La pechera encontrada** en una ruina ya le sirve a Doña Eulalia.
- **El techo de la casa**: los huecos que faltan brillan.
- **La casa** solo se construye con todo su terreno cargado. Antes podía quedar incompleta.
- **Con la mochila llena**, los premios y pedazos caen al suelo en vez de perderse.
- **La brújula**: lo que sigue en la historia, el bolso y el portal quedan pegados al borde con una flecha aunque estén detrás de uno.
- **El prólogo** se cortaba solo al entrar al juego. Ahora dura lo que debe, y Don Tobías repite que le hablen hasta que le hablen.
- **Avisos y carteles**: los largos duran más y los carteles hacen fila.
- **Una sola voz al empezar**: el objetivo, los consejos y Don Tobías ahora dicen lo mismo: ir a la casa, que ahí hay tablas, comida y mesa.

## 3.89.0 — 2026-11-08 · El pueblo comenta lo que usted hace
- **El pueblo comenta lo que usted hace**: los vecinos ya saben de su racha, sus muertes, los nidos partidos, el Canelo, el seguro del tío Rigo, Don Chepito, el Permiso de Todo, la multa del inspector, la Noche de Ceniza, los trofeos y los escondites.

## 3.88.0 — 2026-11-08 · El inspector
- **El inspector** (`inspector.js`, sátira ficticia): desde el día 10, cada 10 días, el Lic. Porras de la Municipalidad llega a decir que la casa no aparece en el catastro. Se arregla con 30 colones de multa o, si uno sobrevivió al trámite eterno, con el Permiso de Todo, que le saca lágrimas y paga 100 colones de reintegro. Si no se paga, no pasa nada: solo vuelve. Logros «En regla, por ahora» y «Con todos los sellos».

## 3.87.0 — 2026-11-08 · Comandos de prueba, boca de mina, Yendry y más avisos en la pelea
- **Comandos de prueba** (`pruebas.js`, consola con T): `/prueba <cosa>` salta a cualquier parte sin esperar: asedio, apuro, Noche de Ceniza, capítulos, nido, personajes, equipo… La lista completa y qué mirar están en `docs/GUIA_DE_PRUEBA.md`.
- **Boca de mina**: un nuevo hallazgo desde el día 4. Una escalera baja 12 bloques a una sala con dos cofres (hierro, carbón, a veces oro, esencia o diamante) y puntales. Abajo esperan Sombras.
- **Yendry** (`guila.js`): la última carta de Zenaida pide buscar a un güila y dejarle una carta. Dos días después del final, Yendry llega a la casa a pedir que le enseñen. Tres lecciones cortas, y al final uno le deja una carta armada con lo que de verdad pasó en la partida: días, muertes, nidos, récord. Logro «Ya hay quién».
- **Con poca vida**: el borde de la pantalla late en rojo y se oye el corazón (sonido real, CC0).
- **Números de daño** sobre los enemigos. Se apagan en Ajustes.

## 3.86.0 — 2026-11-08 · Diez arreglos de la segunda revisión
Una segunda revisión independiente encontró estos errores, varios causados por los arreglos de la v3.82. Todos corregidos:
- **Oleadas colgadas por una Sombra fantasma**: una Sombra que salía del mundo por estar muy lejos seguía contando en la pelea, y esta nunca seguía. En la Noche Larga, la Madre podía quedar invisible e invencible. Ahora lo que sale queda fuera de la pelea, y la Madre no se borra por lejos.
- **Sombras que se esfumaban al perseguir**: la distancia máxima se medía desde la casa o la plaza y no desde el jugador, y se perdía el premio aunque uno se quedara peleando. Ahora se mide desde el jugador.
- **Oleadas imposibles en terreno quebrado**: las Sombras podían nacer dentro de la roca o caer a un barranco. Ahora nacen sobre el suelo más cercano a la altura de la pelea o, si no hay, cerca del jugador. También en la Noche Larga.
- **Para ganar una oleada basta vencer a un tercio**, no a la mitad: con la mitad, una Sombra atorada podía hacer perder una pelea bien peleada. Quedarse lejos o encerrado sigue sin pagar.
- **La carrera de sacos** se confundía con la ladrona, por un nombre repetido: matar a un competidor daba el logro y soltaba un objeto vacío.
- **Los hallazgos caían dentro de pueblos y sobre construcciones**, y pisaban cultivos y antorchas. Ahora solo salen en monte, sobre suelo natural, lejos de pueblos, estructuras, la casa, la carpa y el Corazón.
- **El trofeo de la Sombra Madre** se podía perder para siempre si la remataba el Canelo o una estaca. Ahora sale siempre, y las partidas ya terminadas lo reciben.
- **Los consejos de la mañana** se gastaban sin mostrarse si todavía no aplicaban. Ahora esperan.
- **La música de pelea** sonaba encima de la pieza anterior y seguía al terminar. Ahora se apaga en medio segundo al entrar y al salir. Falta escucharla.
- **La ladrona** ya no se pierde sin aviso: huye 18 segundos, no se borra por lejos y el aviso siempre sale.
- **Los avisos en fila** ya no salen sobre la pantalla de muerte ni pasan a otro mundo.
- El prólogo también se quita al entrar al juego o soltar el ratón, y en modo Tranquilo el seguro ya no se gasta.

## 3.85.0 — 2026-11-08 · Revisión automática de datos
- **Revisión automática de datos** (`tools/revisar-datos.mjs`): logros que la historia espera y nadie da, objetos que no existen en tiendas o botines, texturas sin dibujo y sonidos sin archivo. Todo en cero después de un arreglo: la compostera y el peón pedían un sonido que no existía.

## 3.84.0 — 2026-11-08 · Recetas que no se podían hacer
- **Recetas que no se podían hacer**: una revisión nueva (`tools/revisar-recetas.mjs`) encontró que la cerbatana pedía el bloque de caña, que nunca llega a la mochila, y que las hojas nunca soltaban hojas, así que la madera pintada verde y el repello verde menta tampoco salían. Ahora la cerbatana usa la caña que se recoge, y al cortar hojas, una de cada ocho suelta la hoja misma.

## 3.83.0 — 2026-11-08 · Poner antorcha rápido
- **Poner antorcha rápido** (tecla X, se cambia en Ajustes → Teclas): pone una antorcha donde se apunta sin soltar lo que se tiene en la mano, aunque esté en la mochila.
- El peón se agacha al cosechar.

## 3.82.0 — 2026-11-08 · Doce arreglos de una revisión independiente
Una revisión independiente del código de hoy encontró estos errores, todos corregidos:
- **La Noche de Ceniza enterraba el patio**: la ceniza que caía era el bloque sólido, y se apilaba. Ahora la de esa noche es solo de ver. **La de los volcanes** usaba el mismo bloque por error, desde antes de hoy: ahora es la capita fina que se había dibujado para eso.
- **El seguro cubría dos muertes** y la pantalla de muerte nunca lo decía. Un cambio mío había caído en la función equivocada. Ahora cubre una sola, y lo dice.
- **Las oleadas se ganaban sin pelear**: quedándose lejos o encerrado en un cuarto, las Sombras se retiraban por tiempo y eso contaba como victoria, con colones sin tope en la Noche de Ceniza. Ahora hay que vencer al menos a la mitad de cada oleada; si no, la pelea termina sin premio.
- **La ladrona**: lo robado se perdía si la mataba el Canelo o el sol, y podía llevarse objetos únicos como el Corazón o el cucharón. Ahora queda tirado donde cayó, y lo único no se roba (tampoco el Duende).
- **Mejoras y aceite** se perdían con el Duende, el mono cara blanca y el peón de un día. Ya no.
- **Don Carlos se podía contratar como peón** y se perdía la tienda. Ya no.
- **Cruzar un portal en pleno asedio o apuro** dejaba la pelea colgada, y no dejaba dormir. Ahora la pelea termina al cruzar.
- **El cofre de los escondites se podía regenerar** para sacar colones y reliquias sin fin. Ahora los colones salen una sola vez y el cofre tarda 5 minutos en volver.
- **Mejorar el arco no subía el daño**. Ahora sí.
- **Comer rápido desordenaba la barra** si se cambiaba de casilla mientras se masticaba, y al morir comiendo se caía el arma. Ya no.
- **La carretilla de Don Carlos se quedaba sin vendedor** si él desaparecía. Ahora se va con él.
- **Modo Tranquilo**: ya estaba corregido en la v3.79.

## 3.81.0 — 2026-11-08 · Hallazgos al caminar
- **Hallazgos** (`hallazgos.js`): caminando por el monte, cada unos 420 bloques aparece adelante algo que otro dejó, con un cofre: un campamento abandonado, una carreta volcada o, desde el día 6, un círculo de piedras con raíces de Sombra (con esencia, y dos Sombras cuidándolo). Traen comida, colones, vendas y a veces hierro o un mapa del tesoro. Logros «Lo que otros dejaron» y «Curioso de oficio».

## 3.80.0 — 2026-11-08 · Trofeos de jefes y Casa de leyenda
- **Trofeos de jefes**: vencer al Murciélago Rey, al Señor del Arenal, a la Arpía, a la Sombra Madre, al Mono congo gigante o al Cadejos deja un trofeo, una sola vez, para poner en la casa. Logros «El primer trofeo» y «No queda ni uno».
- **Casa de leyenda**: un cuarto nivel para la casa, con tres trofeos cerca. Las Sombras nacen a 70 bloques o más y dormir ahí quita todos los malestares.
- **Balance en Difícil medido**: el bot gana el asedio del día 10, pero no el del día 15 sin preparar, y preparado todavía pierde la Noche Larga. Tabla en `docs/BALANCE.md`.

## 3.79.0 — 2026-11-08 · La hoja de la partida, sonidos nuevos y modo Tranquilo sin asedios
- **La hoja de la partida** (pestaña 📊 en la libreta): días, tiempo jugado, mejor racha, vencidos, muertes, nidos, asedios, plazas, récord de ceniza, cartas, pedazos, hojas, escondites, semanas y logros.
- **Sonidos reales nuevos (CC0)**: las piedras del derrumbe y el golpe de la chancleta.
- **Modo Tranquilo**: los asedios y los guardias del maletín y los escondites ya no aparecen. Lo agregado hoy se había saltado esa regla.

## 3.78.0 — 2026-11-08 · Prólogo, carteles de capítulo, música de pelea y bombetas contra Sombras
- **Prólogo**: al empezar un mundo nuevo en supervivencia, unos segundos en negro con el principio de la historia y el título «Las cartas de la abuela». Cualquier tecla lo salta. La primera carta llega al terminar.
- **Capítulos con su cartel**: cada capítulo nuevo se anuncia con cartel grande en vez de un aviso.
- **Música de pelea** (`musica.js`, con las mismas notas reales de arpa y marimba): en un asedio, la Noche Larga, un pueblo en apuros o la Noche de Ceniza entra un ostinato apurado en lo grave. Falta escucharla.
- **Las bombetas sirven en un apuro**: el estallido deja atontadas a las Sombras a 11 bloques o menos durante 2.5 segundos.

## 3.77.0 — 2026-11-08 · Un consejo cada mañana y la ruta que cabe en la pantalla
- **Un consejo cada mañana**: junto al resumen del amanecer, a lo sumo un consejo de algo que uno todavía no ha usado (cama, cantimplora, trampas, platos, tranca, yunque, nidos, comer rápido, destino en el mapa, resembrar, compostera, puntales). Si ya lo usó, no lo dice.
- **La ruta (J) cabe en la pantalla**: con todo lo que se le fue agregando medía más que la ventana y se cortaba. Ahora muestra primero la meta que sigue y las dos siguientes, cuenta las ya cumplidas, y la rueda del ratón baja el panel mientras está abierto.
- Se cambiaron tres íconos de avisos que Windows 10 no puede mostrar.

## 3.76.0 — 2026-11-08 · Recoger el bolso de un clic, la tranca, destino en el mapa y el peón de la finca
- **Recoger el bolso de un clic**: abrir el cofre donde uno se murió mete todo en la mochila, con mejoras y aceite, y quita el cofre. Lo que no quepa se queda y el cofre se abre normal.
- **La tranca** (2 tablas + hierro, salen 2): clic derecho a una puerta y aguanta 16 golpes en vez de 8. Al mirarla, se ve que está trancada. Logro «Bien trancada».
- **Destino en el mapa**: un clic marca el punto y la brújula lo señala. Otro clic en el mismo punto lo quita. Logro «Con rumbo».
- **El peón de la finca** (`peon.js`): cuando la casa ya es «Casa de verdad», Don Chepito llega de día a pedir trabajo. Por 40 colones, una sola vez, cosecha lo maduro cerca de la casa, vuelve a sembrar y guarda todo en el cofre de la abuela, mientras uno ande a 60 bloques o menos. Avisa si el cofre se llena. Logro «Alguien cuida la finca».

## 3.75.0 — 2026-11-08 · Pierna quebrada, derrumbes, el Corazón y la Noche de Ceniza
- **La pierna quebrada** (`mina.js`): una caída de 9 bloques o más puede quebrarla (de 13 en adelante, siempre). Se camina a poco más de la mitad de la velocidad por 4 minutos, hasta entablillarla: tablilla (palos + venda) o botiquín. En modo Tranquilo no pasa.
- **Derrumbes en la mina**: por debajo de la altura 40, picar puede hacer que el techo cruja. Da 2.4 segundos de aviso para salir corriendo y cae grava alrededor. **El puntal** (palos + tabla) evita los derrumbes a 6 bloques. Logro «Salí de esa».
- **El Corazón de Tiquicia** (`corazon.js`): al terminar la historia queda en la mochila. Puesto donde uno quiera, las Sombras no nacen a 70 bloques y cerca de él la vida vuelve sola.
- **La Noche de Ceniza**: de noche, clic derecho al Corazón. Oleadas sin fin, cada una más dura, hasta que uno se muera o se aleje. Paga colones por oleada y esencia cada 3, y guarda el récord, que sale en la ruta (J). No amanece mientras dure. Logros a las 5, 10 y 20 oleadas.

## 3.74.0 — 2026-11-08 · Los escondites de Zenaida, sus reliquias y la chancleta
- **Los escondites de Zenaida** (`reliquias.js`): la abuela no confiaba en los bancos. Desde el capítulo 4, la brújula y el mapa marcan un cofrecito, junto a tres piedras apiladas, cada vez más lejos de la casa (de 220 a 540 bloques). Cada uno trae colones, una nota con historia y una reliquia:
  - **Machete de Zenaida**: daño 8, con barrido.
  - **Delantal de Zenaida**: protege más que la pechera de hierro y menos que la de diamante.
  - **Chancleta de Zenaida**: clic derecho, se tira y vuelve sola, pegando a la ida y a la vuelta. «La otra se la quedó la Sirena en el 62».
  - **Sombrero de Zenaida**: protege más que el casco de hierro.
  - **Cucharón de Zenaida**: con tenerlo en la mochila, la comida llena 20 % más.
  - Desde el tercero, las Sombras también andan buscando el escondite. Si el cofre se pierde, vuelve a aparecer.
  - Logros «El machete de Zenaida», «La chancleta de Zenaida», «La chancleta voladora», «Hasta las Sombras le tienen miedo» y «Todo lo que tenía».

## 3.73.0 — 2026-11-08 · Avisos en fila, comer rápido, resembrar con azada y la dirección del golpe
- **Los avisos hacen fila**: antes uno nuevo borraba al anterior y muchos ni se alcanzaban a leer. Ahora cada uno se queda al menos un momento, y los últimos 15 se pueden releer en el diario (N).
- **Comer rápido** (mantener G, se cambia en Ajustes → Teclas): come lo que mejor le rinde sin desperdiciar, aunque esté en la mochila, y al terminar vuelve a lo que tenía en la mano. No escoge nada crudo.
- **Resembrar con azada**: al cosechar con la azada en la mano, se vuelve a sembrar sola si anda semilla. Logro «Azada en mano».
- **De dónde vino el golpe**: una marca roja en la pantalla indica la dirección.
- La vida del enemigo que se mira ya cuenta la vida extra con que nacen las Sombras.

## 3.72.0 — 2026-11-08 · El Canelo, Sombras ladrona y grande, el buhonero y retos de la semana
- **El Canelo** (`canelo.js`): cuando la casa queda arreglada aparece un perro flaco en el patio, el de la abuela. Con cualquier comida se queda con uno. Muerde lo que venga, ladra de noche si algo se acerca y, si queda muy golpeado, se va y vuelve al otro día: no se muere de verdad. Logro «El perro de la abuela».
- **Sombras nuevas**:
  - **La ladrona** (desde el día 8): le roba hasta 8 unidades de algo de la mochila (nunca lo que tiene en la mano, herramientas ni colones) y sale corriendo. Corre más que caminando, pero se alcanza corriendo. Si la vence, lo recupera; a los 24 segundos se pierde. Logro «Al que roba, se le alcanza».
  - **La grande** (desde el día 12): lenta, con 60 de vida, pega 6 y suelta esencia de sombra. Así la esencia no depende solo de los nidos.
- **El buhonero** (`buhonero.js`): cada 4 días, de mañana, Don Carlos llega a la casa con su carretilla. Compra la cosecha ahí mismo y vende esencia, aceite, candelas, vendas, faroles y mapas del tesoro. Logro «Llegó el buhonero».
- **Retos de la semana** (`retos.js`): cada 7 días, tres encargos al azar que se miden solos (enemigos vencidos, nidos, puntos de minería, pesca, cocina…), y se ven en la ruta (J). Cada uno paga colones, y los tres juntos, 2 de esencia. Piden un poco más cada semana. También sirven después de terminar la historia.

## 3.71.0 — 2026-11-08 · Balance con el equipo mejorado, la playa y pizotes en manada
- **Balance con el equipo mejorado**: el bot (`tools/bot-pelea.js`) ahora también mide con 3 estrellas, un plato con efecto y todas las hojas.
  - Con todo eso el bot ganó todas las peleas que terminó, sin apuros.
  - Las Sombras de asedios, Noche Larga y pueblos en apuros ahora ganan vida con los días (hasta +10), igual que las de cada noche.
  - **Arreglo**: las Sombras de una oleada que nacían a más de 24 bloques no veían al jugador y se iban a pasear hasta que se les acababa el tiempo. Ahora las de una pelea persiguen desde 60 bloques. Este error lo había metido la v3.68.
- **La playa** (`playa.js`):
  - **Cangrejos rojos** que corren de lado, abren las tenazas y se entierran en la arena si uno se acerca. De noche salen más.
  - **Ermitaños** que caminan despacito y se meten en la concha.
  - **El pescador de atarraya**: al amanecer y al atardecer, Don Macho tira la red desde la orilla (se abre en el aire, cae, la jala a tirones). Si saca algo y uno le habla, regala un pescado al día. Logros «El pescador de atarraya» y «Un regalo del mar».
- **Pizotes en manada**: siguen a la que va adelante, y algunas son crías más pequeñas.
- **Íconos**: quedan dibujados los 10 que faltaban (trofeo, peluche, carreta, arco de cintas, cinta, Permiso de Todo, saco, y los tres de pejibaye). Están hechos a mano en pixel art: si se quieren con el estilo de las hojas de GPT, el prompt sigue en `docs/PROMPT_ITEMS.md`.
- **Verificado corriendo**: las antorchas evitan Sombras (0 contra 6 en la misma noche), la carpa protege 26 bloques y deja de hacerlo al quitarla, quitar la cama o la carpa limpia sus datos, Doña Eulalia da su consejo en cada capítulo, la nasa pesca en agua de verdad y las marcas de casa, nido y maletín salen en el mapa.

## 3.70.0 — 2026-11-08 · El yunque, el tío Rigo y su seguro, y la compostera
- **El yunque** (`yunque.js`; 4 de hierro + 3 de piedra labrada): con un arma, herramienta o pieza de armadura en la mano, clic derecho la mejora hasta 3 veces y la deja como nueva.
  - Cuesta su propio material (2, 4 y 6) y, de la segunda mejora en adelante, esencia de sombra (1 y 2).
  - Cada estrella da 12 % más de daño en armas, 12 % más de velocidad y de daño en herramientas, y +0.25 de protección por pieza de armadura.
  - Las estrellas se ven en el espacio del inventario y en la ficha. Se conservan al reparar, tirar, recoger o guardar el objeto (el aceite de filo también).
  - Sonido real, CC0. Logros «Al yunque» y «Tres estrellas».
- **El tío Rigo** (`rigo.js`): desde el día 6, de día, llega a la casa el hijo de Zenaida, el que se fue a vender seguros.
  - Vende el **Seguro contra Sombras** (25 colones): si se muere, no se le cae nada, una sola vez.
  - Las Sombras le roban el maletín, y hay que ir por él a un cofre en el monte, con guardias, marcado en la brújula y el mapa.
  - Dentro del maletín aparece una póliza que la abuela pagó por cuarenta años, y una carta nueva, «La póliza».
  - Después sigue vendiendo el seguro, a 40 colones. Si el cofre se pierde, la historia no se traba.
- **La compostera** (tablas): cuatro sobras de comida, hojas o zacate dan una bolsa de abono para los cultivos. Logro «Nada se bota».
- **Arreglo**: el aceite de filo se perdía si el arma se tiraba al suelo o se dejaba en la cuadrícula al cerrar.

## 3.69.0 — 2026-11-08 · El cuaderno de la abuela, platos con efecto y candela de regreso
- **El cuaderno de la abuela** (`cuaderno.js`): doce hojas que van apareciendo según lo que uno hace: arreglar la casa, hacerse una cantimplora, parar un golpe, partir un nido, defender un asedio, llegar a 7 días sin morir… Cada una cuenta algo de Zenaida y deja una ventaja para siempre (la comida rinde más, menos sed, vendas mejores, trampas más seguidas, herramientas que duran, un corazón más). Se lee en la pestaña de cartas, y las que faltan dicen qué hay que hacer. Logros «El cuaderno de la abuela» y «El cuaderno completo».
- **Platos con efecto** (`platos.js`): la comida buena también deja algo por 5 minutos, y solo vale el último plato:
  - Casado y chifrijo: 15 % más de daño.
  - Olla de carne y vigorón: 12 % menos de daño.
  - Gallo pinto con huevo y arroz con pollo: la estamina vuelve 40 % más rápido.
  - Ceviche: la mitad de sed.
  - Sopa negra y tamal: 40 % menos hambre y sed.
  - La ficha del plato dice qué da. Así, antes de un asedio o de ir por un nido, conviene pensar qué se come.
- **Candela de regreso** (esencia de sombra + palo + carbón, salen 2): en 3 segundos vuelve a donde durmió por última vez. Si le pegan, se apaga, y en plena pelea no prende. Sirve para salir de expedición sin tener que deshacer todo el camino.
- La ruta (J) ahora también muestra cuántas hojas lleva.

## 3.68.0 — 2026-11-08 · Medido con un bot, nidos de Sombra, racha de días y pueblos en apuros
- **Balance medido con un bot** (`tools/bot-pelea.js`): un jugador torpe que pelea solo en una cancha plana y dice cuánto duró. Lo que encontró y se corrigió:
  - La primera noche no la mataba la Sombra: la mataban **el Cadejos y la Terciopelo reina**, que ya salían el día 1. Ahora las leyendas salen desde el día 4 y las minijefas y el Mono congo gigante desde el día 5.
  - Las primeras tres noches vienen menos Sombras: 3, 4 y 5 en vez de 6.
  - **En un asedio se amontonaban hasta 17 enemigos**, porque seguían naciendo los normales. Ahora en las peleas grandes (asedio, Noche Larga, pueblo en apuros) solo vienen las oleadas, y van llegando de a poco.
  - **Una Sombra caída en una cueva dejaba la pelea colgada** hasta el amanecer; en la Noche Larga, que no amanece, para siempre. Ahora las que se alejan o tardan demasiado se van, y la Madre vuelve al patio si se pierde.
  - **Subirse a un pilar ya no salva a nadie**: la Sombra que no alcanza aparece al lado.
  - La piedra de la hondera mataba más que el golpe de cerca: baja de 3 a 2.
- **Nidos de Sombra** (`nidos.js`): desde el día 5, cada tres días crece uno en el monte (máximo 3), que marcan la brújula y el mapa. Lo cuidan guardias, también de día; cerca nacen más Sombras y cada nido vivo manda una más a los asedios. Se parte con hacha y da esencia de sombra y colones. Cada 3 nidos partidos, una Sombra menos por noche (hasta 2). Logros «Partí un nido de Sombra», «La comarca respira» y «Ni un nido en Tiquicia».
- **Con la esencia de sombra**:
  - **Aceite de filo**: su mejor arma de la barra pega 30 % más por 60 golpes.
  - **Farol de Zenaida**: las Sombras no nacen a 30 bloques.
- **La racha** (`amanecer.js`): cada amanecer dice cuántos días lleva sin morir y a cuántos venció. Paga colones a los 3, 7, 14 y 30 días, y morir la corta. La ruta (J) muestra racha, vencidos y muertes.
- **Pueblo en apuros** (`apuros.js`): desde el día 6, cada tanto, al anochecer, si uno anda por un pueblo, tocan la campana porque vienen Sombras por la plaza. Quedarse a ayudar paga colones y reputación, y los vecinos lo comentan después. Irse no tiene castigo.
- **Arreglo**: el juego se caía si empezaba a llover justo mientras cargaban los sonidos de la lluvia.

## 3.67.0 — 2026-11-08 · Defender la casa
- **Defender la casa** (`asedio.js`):
  - **Asedios**: cada 5 días, si la casa está arreglada y uno anda cerca, las Sombras vienen por ella. Avisa en la tarde para dar tiempo de prepararse; si uno no va, la dejan en paz. Son 2 oleadas (3 desde el día 15), con más Sombras y más variadas según el día, y paga colones y experiencia. Logros «Defendí la casa» y «A esta casa no entra nadie».
  - **Tumban las puertas**: encerrarse ya no alcanza. Las Sombras golpean la puerta (con sonido real, CC0) hasta tumbarla, también en la Noche Larga. Ahí tienen sentido las estacas, la luz y tener una puerta de repuesto.
  - **Cencerro** (palos + hierro): suena (real, CC0) y avisa qué anda cerca cuando algo hostil se arrima a 14 bloques o menos. Logro «Sonó el cencerro».
- **La historia se siente viva**:
  - **El pueblo comenta**: según el capítulo, los vecinos dan rumores con pistas de lo que sigue («Dicen que a la Sirena le gustan las flores rojas»). Al terminar, lo reconocen.
  - **Doña Eulalia se queda en su pueblo** y da un consejo distinto en cada capítulo.
  - **La tumba de la abuela** en el patio de la casa, con flores y una placa que se puede leer.
  - **El final cambia el mundo**: con el Corazón entero nacen 2 Sombras menos por noche.
- La casa ya no sale en la zona de frío de las cumbres.

## 3.66.0 — 2026-11-08 · La casa sube de nivel
- **La casa también progresa** (`hogar.js`), con su avance en la ruta (J):
  - *Rancho arreglado*: el nivel de la historia. Sombras lejos y descanso adentro.
  - *Casa de verdad* (fogón u horno, otro cofre, mesa de comedor y silla): la comida casera llena 25 % más y dormir ahí deja la vida llena.
  - *Finca de la abuela* (6 cultivos, barril de lluvia y 2 faroles o lámparas): las Sombras nacen más lejos y cada mañana aparece comida en el cofre de la abuela.
- **Carpa de campamento** (3 de lana + palos): para las expediciones lejos de casa. Se duerme adentro, guarda el lugar donde reaparece y las Sombras nacen más lejos. Solo protege la última que se armó. Logro «Campamento armado».
- **Arreglos**:
  - Al quitar una cama, su modelo y sus datos se quedaban en el mundo. Ahora se limpian.
  - La casa de la abuela podía salir bajo el nivel del mar, y a veces lejos de donde convenía por un filtro mal hecho. Ahora busca bien y, si de verdad no hay tierra (una isla), se levanta sobre pilotes.

## 3.65.0 — 2026-11-08 · Buscar y fijar recetas
- **Más calidad de vida**:
  - **Buscador de recetas**: por nombre o por ingrediente («hierro» muestra todo lo que lleva hierro).
  - **Fijar una receta**: clic derecho en el recetario y queda en pantalla lo que le falta («Hierro 1/3 · Palo 0/2»). Avisa cuando ya tiene todo.
  - **El día y la hora** arriba a la derecha, y un aviso cuando ya casi oscurece (se apaga en Ajustes).
  - **El mapa** marca la casa de la abuela y el objetivo de la historia.
  - **La ficha de la comida** avisa si ya la comió mucho y cuánto rinde, antes de comerla.
  - La armadura avisa cuando está por romperse, y el aviso de las herramientas ya sugiere repararlas.

## 3.64.0 — 2026-11-08 · Vivir del monte
- **Vivir del monte** (`monte.js`), cosas que se dejan armadas y trabajan solas:
  - **Trampa de lazo** (palos + cuero): sobre zacate o tierra agarra animalitos con el tiempo (carne, cuero, huevos). Se abre como un cofre y deja de atrapar con 6 cosas adentro, así que hay que volver. Logro «Cayó en la trampa».
  - **Nasa de pesca** (palos + cuero): en el río, con agua a los lados, junta pescado (y alguna bota vieja). Logro «La nasa trabaja sola».
  - **Barril de lluvia** (tablas + hierro): sin techo, junta agua limpia cuando llueve, hasta 8. Se toma con la mano vacía, sin riesgo de caer mal, o se llena la cantimplora. Vale oro en la sequía. El letrero dice cuánta agua tiene. Logro «Agua del cielo».
  - **Estacas** (4 por palos): lastiman a lo que venga caminando, sirven para defender la casa en la Noche Larga, y a veces se rompen. A uno no le hacen nada. Logro «Que venga el que quiera».
- **Fiebre**: a veces un zancudo la pega (3 % por picada, 6 % en Difícil). Quita la regeneración y baja la velocidad 5 minutos. La quitan el suero, el botiquín, la doctora o dormir; el repelente la previene.
- **Arreglo**: dormir en plena Noche Larga borraba a las Sombras y saltaba la pelea. Esa noche ya nadie duerme.
- Fabricar cada una por primera vez explica cómo se usa.

## 3.63.0 — 2026-11-08 · Rangos y premios
- **Sentido de progresión** (`progreso.js`):
  - **Cada meta de la ruta paga un premio**, pensado para la meta siguiente (el hierro antes de la armadura, botiquines antes de las leyendas, obsidiana antes del Inframundo). La ruta (J) muestra qué premio da la meta actual.
  - **Rangos con ventajas de verdad**, según las metas cumplidas, y se acumulan:
    - *Vecino* (2): las tiendas cobran 5 % menos.
    - *Baquiano* (4): la estamina se recupera 20 % más rápido.
    - *Sabanero* (6): hambre y sed 8 % más lentas.
    - *Guardián* (9): 10 % menos de daño.
    - *Leyenda de Tiquicia* (13): la vida se recupera 30 % más rápido.
  - **La ruta (J) ahora resume el avance**: rango, barra hacia el siguiente, corazones, pedazos del Corazón y día.
  - **Fabricar algo clave por primera vez dice qué abre** («Con el pico de hierro ya puede sacar oro y diamante, en lo hondo»), para que se note cada salto.

## 3.62.0 — 2026-11-08 · Balance de supervivencia
- **Balance de supervivencia** (auditoría completa; números y reglas en `docs/BALANCE.md`):
  - **Se acabó el dinero infinito**: se podían comprar tapas de dulce, café o dorado y revenderlos con ganancia. Ahora una regla recorre todas las tiendas al cargar y lo hace imposible, aunque se agreguen ítems. Los precios del día se mueven menos (×0.8 a ×1.25).
  - **El dinero vale más**: vehículos más caros (carro 300, moto 180, lancha 150, bici 30), comida de panadería menos regalada, la batea rinde menos y la pepita vale la mitad. El oro sube a 10-14 colones.
  - **La sed importa**: curarse pide agua además de comida, y sin agua se baja hasta 1 de vida. Tomar del río cae mal más seguido.
  - **Las antorchas protegen de verdad**: las Sombras ya no nacen a 8 bloques o menos de una luz, como decía el consejo del juego.
  - **Las Sombras son una amenaza real**: corren más (3, antes 2.3) y ganan vida con los días.
  - **La cama se puede hacer temprano**: la lana cuesta 2 cueros (antes 4) y la danta siempre suelta al menos uno. El Viejo del Monte sale a las 8 cacerías (antes 5) y ya no en Tranquilo.
  - **La llave del Inframundo se puede conseguir**: sale con diamante, oro y obsidiana (antes pedía jade) y a veces en cofres viejos. La pista decía que salía en volcanes y no era cierto.
  - **Armas parejas**: la espada vuelve a tener sentido. Machete 5 → 4, mazo 9 → 11, garrote 4.5 → 6, honda 3-8 (antes 1.5-5), lanza más lenta.
  - **La armadura buena se nota**: el tope de protección sube a 88 %, y el jade por fin rinde más que el diamante.
  - **Parry contra leyendas**: la pista decía que se podía, pero el Cadejos, la Segua y la Llorona lo ignoraban. Ahora las aturde, y vencerlas sube Combate.
  - **Cocinar rinde**: el casado y el chifrijo salen de a dos.
  - **Zancudos más justos**: 5 zancudos quitaban cerca de 1 de vida por segundo, más que las Sombras (medido). Ahora son máximo 3, pican 0.5 y no aparecen bajo techo. En Difícil siguen como antes.
  - **Frío más justo**: da la mitad de hambre, y las pecheras de metal abrigan a medias.
  - **Metas bien contadas**: «Armadura de hierro» ya no se cumple con una bota; pide las 4 piezas. La espada de piedra cuenta para «Herramientas de piedra».
  - **Reparar** baja a 25 % en herramientas y 15 % en armadura, y ya sirve para lanza, mazo y garrote. La arena de retos da menos experiencia.

## 3.61.0 — 2026-11-08 · Las cartas de la abuela
- **La historia de supervivencia: «Las cartas de la abuela»** (`historia.js`). Hasta ahora el juego no tenía una historia principal, solo metas sueltas:
  - **La premisa**: la abuela Zenaida le deja al jugador su casa vieja y una tarea pendiente. Era la última que cuidaba el **Corazón de Tiquicia**, la esfera de piedra que tenía las noches en paz, y que se partió en cuatro pedazos en el temblor grande. Diez cartas la van contando; se leen y releen con la **tecla C**, en la libreta.
  - **Nueve capítulos** con el objetivo siempre en pantalla y su marca en la brújula (📖):
    1. *La herencia*: llegar a la casa de la abuela, generada cerca del inicio (🏡).
    2. *La casa vieja*: arreglarla (cama, puerta, luz y tapar los 8 huecos del techo). Una vez lista, **las Sombras ya no nacen cerca** y adentro se recupera vida sin gastar comida. En el cofre dejó materiales para empezar.
    3. *La comadre*: buscar a **Doña Eulalia** en el pueblo, que cuenta la historia y pide una pechera de hierro.
    4. *Se les puede ganar*: vencer una leyenda.
    5. *El pedazo de la tierra*: el Murciélago Rey.
    6. *El pedazo del agua*: a la Sirena no se le pega; hay que llevarle una flor roja.
    7. *El pedazo del fuego*: el Señor del Arenal, en el Inframundo.
    8. *El pedazo del cielo*: la Arpía de la Tormenta.
    9. *La noche larga*: volver a casa con los cuatro pedazos y aguantar **cuatro oleadas de noche** hasta la jefa final, **la Sombra Madre**: 220 de vida, llama refuerzos cuando la hieren y se hunde en el suelo para salir al lado de uno, con aviso.
  - **Corazones de verdad**: la vida máxima ya puede crecer. Ganarle a la primera leyenda da un corazón, cada pedazo otro y el final otro: de 10 a 16 corazones.
  - Cuatro íconos nuevos para los pedazos. Don Tobías también recuerda lo que encargó la abuela.
- La historia corre en los mundos de supervivencia, también en los que ya existían. En un mundo viejo, la casa aparece cerca del punto de inicio.

## 3.60.0 — 2026-11-08 · Comodidades de supervivencia
- **Calidad de vida en supervivencia** (`comodidad.js`):
  - **Reparar**: en la cuadrícula de fabricar, la pieza gastada + una unidad de su material le devuelve 40 % de vida a las herramientas y 25 % a la armadura; dos piezas gastadas iguales se juntan en una, con un 5 % extra. Hasta ahora nada se podía reparar. Logro «Lo viejo se arregla».
  - **La herramienta rota se reemplaza sola** por otra igual (o del mismo tipo) de la mochila, y **avisa** cuando le queda 10 % de vida.
  - **Ficha del objeto**: al pasar el mouse se ve el daño, la velocidad, la protección, cuánto llena, la vida que le queda y con qué se repara.
  - **Lo que estoy mirando**: un letrerito bajo la mira con el nombre del bloque o la vida de la criatura; si la herramienta en la mano no sirve, dice qué pico pide.
  - **El objetivo siempre en pantalla**: la siguiente meta de la ruta, bajo el minimapa. Las dos cosas se pueden apagar en Ajustes.

## 3.59.0 — 2026-11-07 · Noches ticas
- **Noches ticas** (`noches.js` y `sky.js`):
  - **El río de murciélagos**: una vez por tarde, al atardecer (en bosque, selva, llanura, bosque seco, nuboso y montaña), sale de un cerro **una cinta de 70 murciélagos** que pasa por encima ondulando, cada uno revoloteando a su manera con su aleteo rapidito; chillan al pasar. Logro «El río de murciélagos».
  - **La lechuza**: de noche se posa una **lechuza blanca** en un poste, un techo o la copa de un árbol; **gira la cabeza casi media vuelta** para mirarlo a uno y **chilla** (sonido real, CC0) («dicen los abuelos que es de mal agüero»). Si uno se acerca, **se va volando sin hacer ruido**, con aletazos hondos y planeos largos. Logro «Cantó la lechuza».
  - **La Vía Láctea**: una banda ancha de estrellitas finas y bruma tenue cruza el cielo y **gira con las demás estrellas**; se ve clarita **lejos de los pueblos** y casi se borra cerca de sus luces (también con nubes). Logro «La Vía Láctea».
- El **plan maestro 17** queda completo.

## 3.58.0 — 2026-11-07 · El chancho que se escapa
- **El chancho del patio** (`rioypatio.js`):
  - En los pueblos, de día, andan **uno o dos chanchos criollos** (negros, o rosados con manchones negros, siempre con barro y su crin en el lomo): caminan un poquito, se paran a **hozar con la trompa** (tiran tierrita) y **gruñen** (sonido real, CC0); mueven las orejas y la colita.
  - De vez en cuando **uno se escapa**: sale **chillando** (sonido real, CC0) en zigzag por el pueblo, huyéndole a la gente, y **Doña Lupe** sale corriendo detrás con los brazos arriba («¡Agarren ese chancho!»). Ella lo alcanza después de un buen rato y se lo lleva para la casa.
  - **Si uno lo agarra** (lo alcanza corriendo), la doña le regala **un tamal** por la ayuda. Logro «Agarré el chancho».
- **Arreglo**: los vecinos que «se van» (clientes de la soda, bailarines, lavanderas, el arreo, el carretillero…) solo desaparecían en **supervivencia**; en **creativo** se quedaban para siempre y se acumulaban (en un pueblo había 42 bailarines retirados, algunos encima de los tramos). Ahora se van en cualquier modo.
- El **plan maestro 16** queda completo.

## 3.57.0 — 2026-11-07 · Las lavanderas del río
- **Las lavanderas del río** (`rioypatio.js`):
  - En las mañanas despejadas, a la orilla de los ríos (no en el mar ni en el manglar), aparecen **dos o tres lavanderas** con falda, delantal y pañuelo en la cabeza, cada una con su **piedra de lavar** metida en el agua y su **canasto de ropa** al lado.
  - **Golpean la ropa**: levantan la pieza con las dos manos y la **azotan contra la piedra** (¡plaf!, salpica y suena); cuando hablan, bajan el ritmo. Cada tanto **tienden una pieza limpia en el zacate**, que se abre suave.
  - **Conversan** entre ellas (chismes ficticios: «¿Supo lo de la hija de doña Chela?»). Logro «Las lavanderas del río».
  - La orilla se busca con los **bloques reales** (los ríos se tallan después del generador).

## 3.56.0 — 2026-11-07 · Pelícanos y fragatas
- **La costa** (`costa.js`):
  - **Pelícanos**: de día, cerca del mar, pasa de vez en cuando una **fila de 4 a 7 pelícanos** (pardos, cabeza blanca con gorrito amarillo y el pico largo con su bolsa) **rasando las olas**; suben y bajan con el agua y, si hay una punta de tierra, la remontan suave. El primero **aletea y los demás lo copian uno por uno** (la ola de aleteo de la fila) y después planean; las alas se doblan en dos partes.
  - **La clavada**: a veces uno ve un pez, se sale de la fila, sube, **pliega las alas y se clava de cabeza en tirabuzón**; salpica (con sonido), queda **flotando**, se traga el pez y se acomoda. Logro «El pelícano se clavó».
  - **Fragatas**: dos fragatas negras **planean altísimo** sobre la costa en círculos lentos, ladeadas en la térmica, con las alas en ángulo y la **cola de tijera**.

## 3.55.0 — 2026-11-07 · El arreo del sabanero
- **El sabanero arreando el ganado** (`campo.js`):
  - En los potreros (llanura, bosque seco y toda la región de Guanacaste), lejos de los pueblos y como mucho una vez al día, pasa **un sabanero a caballo** arreando **de 5 a 7 vacas** por un camino que pasa a unos pasos de uno. El sabanero escoge un potrero **parejo y despejado** (sin barrancos, agua ni bosque cerrado).
  - El sabanero (sombrero de lona, camisa, pañuelo rojo, faja y botas) **se mece con el paso del caballo**, mira al ganado y de vez en cuando **grita** («¡Ooooooh, vaca!») mientras **da vueltas al mecate en lo alto**; el caballo a veces relincha.
  - Las vacas caminan cada una por su carril y esperan a las de atrás; la que se traba **brinca y busca otro carril**. El **perro** va de un lado al otro del hato y corre a ladrarle a la que se desvía.
  - Al llegar al final del potrero se van. El caballo del sabanero no se presta (no se puede domar ni montar). Logro «El arreo del sabanero».
- El **plan maestro 15** queda completo.

## 3.54.0 — 2026-11-07 · Oropéndolas y granizo
- **Oropéndolas y granizo** (`naturaleza4.js`):
  - **Colonias de oropéndolas**: en la selva, el bosque y el bosque nuboso, de los árboles altos cuelgan **nidos largos de paja** (de 3 a 6, lejos del tronco) que **se mecen** cada uno a su ritmo (más con el viento de las tormentas). Las oropéndolas (castañas, cabeza negra, pico con punta anaranjada y **cola amarilla**) van y vienen entre los nidos en vuelos con arco, aletean al despegar y planean al llegar; posadas en la entrada hacen **la reverencia**: se inclinan hasta casi colgar, abren las alas y **gorgotean** (canto real, CC0). Si uno se acerca mucho, se van a otro nido. Logro «La reverencia de la oropéndola».
  - **Granizo**: en las tormentas fuertes (no en el desierto, la playa, el mar ni la nieve), a veces cae **granizo**: bolitas blancas que caen girando, **rebotan**, se quedan **blanqueando el suelo** un rato y **se derriten**; en el agua se hunden con una salpicadita. Suena el granizo (real, CC0) y **a la intemperie duele** (medio corazón cada 4 s). Logro «Cayó granizo».

## 3.53.0 — 2026-11-07 · El yigüirro, quedó y el carretillero
- **Más vida tica** (`vidapueblo2.js`):
  - **El yigüirro**, el ave nacional: de día, en potreros y montes, unos yigüirros **brincan por el suelo** a saltitos, **picotean** y **cantan** (canto real, CC0); cantan más seguido cuando entra el **invierno** («anuncian las lluvias»). Si uno se acerca mucho, **salen volando** aleteando. Logro «El canto del yigüirro».
  - **Güilas jugando «quedó»**: por las mañanas, cinco chiquitos en la plaza; el que la lleva persigue al más cercano, los demás huyen sin salirse de la plaza y al tocarlo grita «¡Quedó!» (el nuevo tiene un respiro antes de perseguir). Logro «¡Quedó!».
  - **El carretillero de frutas**: Don Chepe recorre el pueblo en la mañana empujando su **carretilla llena de frutas** (la rueda gira al caminar) y grita «¡Mangos, mangos!». Con clic derecho le compra **un mango, una papaya o una piña por un colón**. Logro «¡Mangos, mangos!».
- El **plan maestro 14** queda completo.

## 3.52.0 — 2026-11-07 · Barcos, trombas y luces raras
- **Mar adentro y cielo arriba** (`marcielo.js`):
  - **Barcos pesqueros** en el horizonte: desde la costa se ven pasar despacito, a 100–150 bloques, meciéndose con las olas (casco de color, cabina, mástil con pluma); **de noche con sus lucecitas** (la blanca del mástil, la roja y la verde). Logro «Barcos en el horizonte».
  - **Trombas marinas**: en las **tormentas**, si uno está cerca del mar, a veces baja de las nubes una **columna de agua en espiral** (angosta abajo y ancha arriba) con la espuma en la base y el ruido del viento; aparece y se deshace suave. Logro «Vi una tromba marina».
  - **Luces raras en el cielo**: muy de vez en cuando (como mucho una vez cada tres noches, con cielo despejado), aparecen **tres luces** con halo que flotan, titilan, hacen un **zigzag rapidísimo** y se van hacia arriba… «¿Vio eso?». Logro «¿Vio eso?».
- El **plan maestro 13** queda completo.

## 3.51.0 — 2026-11-07 · Pueblo vivo y el torito de pólvora
- **Pueblo vivo** (`pueblovivo.js`):
  - **Humo de los fogones**: al amanecer y al atardecer sale humito de leña de los techos de las casas del pueblo, que se va con el viento.
  - **Ropa tendida** en los patios (camisas, sábanas y trapos de colores en una cuerda entre dos postes) que **ondea con el viento**.
  - **Perros callejeros**: de noche, uno o dos perros del barrio se acercan a unos 5 bloques y **le ladran** al desconocido; si uno se les acerca o amanece, se van. Logro «Me ladraron los perros del barrio».
  - **El torito de pólvora**: en las **noches de fiesta**, «el del torito» corre por la plaza con el armazón del toro en alto (cuernos y varillas) **echando chispas doradas** y tronando cohetitos; a ratos **persigue a la gente** y, si lo alcanza, un chispazo y un empujón («¡Jajaja, corra, corra!»). Logros «¡El torito!» y «Me alcanzó el torito».
- El **plan maestro 12** queda completo.

## 3.50.0 — 2026-11-07 · Pericos, rocío y vendedores en la presa
- **Bandadas de pericos**: al amanecer y al atardecer, una bandada de 12 a 20 **pericos verdes** cruza el cielo de un lado al otro, aleteando rapidito (con ratitos de planeo), meciéndose y **chillando** desde el centro de la bandada. Logro «Bandada de pericos».
- **Rocío**: en las mañanas sin lluvia, el **zacate brilla** con gotitas de rocío que aparecen y se apagan alrededor de uno. Logro «Gotitas de rocío».
- Sátira ficticia: **vendedores en la presa eterna**. Entre los carros parados caminan el vendedor de **agua** («¡Agua, agua fría! ¡Pipa fría!»), la de **maní** y el de **cargadores** («universal… para casi ningún celular»), cada uno con su cajita. Clic derecho para comprarles (1 colón). Logros «Compras en la presa» y «El cargador universal».
- (Los colibríes que toman néctar de las flores ya existían.) El **plan maestro 11** queda completo.

## 3.49.0 — 2026-11-07 · Punto guanacasteco
- **Punto guanacasteco** (`bailes.js`): en los **días de fiesta** (y todas las tardes en los pueblos de **Guanacaste**) salen **tres parejas a bailar a la plaza**: ella con blusa blanca y **falda ancha de colores que gira y se abre** al dar la vuelta, él con **pañuelo y faja rojos** y un brazo arriba. Dan vueltas uno alrededor del otro, se acercan y se alejan, **zapatean** al ritmo y suena la **marimba** (grabaciones reales de Freesound CC0). Cada pareja busca un lugar libre y a nivel de la plaza. Logro «¡Bomba!».
- El **plan maestro 10** queda completo.

## 3.48.0 — 2026-11-07 · Ranas de vidrio, huecos con matas y el gato
- **Rana de vidrio** (`extras10.js`): de noche, en el bosque nuboso y la selva, salen ranitas **transparentes**: se les ve el **corazón rojo latiendo** (más rápido si uno se acerca), la espina y la tripita, con sus ojos dorados grandes. Brincan de vez en cuando y se alejan si uno se les mete encima. Clic derecho: «se le ve el corazón». En el bestiario.
- Sátira ficticia: **huecos con matas**. En las calles de asfalto de los pueblos, de vez en cuando aparece un **hueco con una mata sembrada** (flor roja, amarilla o zacate), el asfalto agrietado alrededor y, escrito con tiza: «¿Y la muni?». Hasta 6 por pueblo. Logro «¿Y la muni?».
- **El gato trae regalos**: el gato adoptado sale sigiloso cada tanto y vuelve con algo: una lagartija (que se le escapa), una hoja, un palito, un pescado, un huevo «de quién sabe quién»… y muy de vez en cuando una pepita de oro o una perla. Logro «Un regalito del gato».

## 3.47.0 — 2026-11-07 · Títulos para los videos
- Modo foto: **Y = título para el video**: un cartel grande y animado («NanoBlocks presenta» · el **nombre del mundo** · «Día N · región · de día/al atardecer/de noche») que entra deslizándose, se queda unos segundos y se va. Combina con las barras de cine (V). Logro «Con título y todo».
- Arranca el **plan maestro 10** («Pura vida, edición diez»); el 9 quedó completo.

## 3.46.0 — 2026-11-07 · Pejibayes con mayonesa
- **Pejibayes**: el **racimo de pejibayes** (492) cae a veces de las hojas de la **selva** y lo vende el Mercado Central. En el fogón se **cocinan** (con agua: salen 3, 493) y con **huevo y limón** se hace la mayonesa: **pejibayes con mayonesa** (494, 9 de comida), como debe ser. El Mercado también los vende ya listos.
- El **plan maestro 9** queda completo.

## 3.45.0 — 2026-11-07 · Carrera de sacos
- **Carrera de sacos** (`sacos.js`; saco de gangoche 491, 2 colones en la pulpería): clic derecho y uno se mete al **saco** (de gangoche de café, con su sello azul) contra **tres güilas** del pueblo, también en saco. Aparece la **meta** 25 bloques adelante (dos postes y una cuerda con banderitas), cuenta regresiva y **¡FUERA!**: en el saco no se camina, se avanza **a brincos** (Espacio o W). Los güilas brincan a su ritmo y a veces **se van de jupa** («¡Dayana se fue de jupa!»). El que gana se lleva 10 colones. Logros «Carrera de sacos» y «Campeón del saco».

## 3.44.0 — 2026-11-07 · El trámite eterno
- Sátira ficticia (`permiso.js`): **el trámite eterno del «Permiso de Todo»**. Lo empieza el **oficial** del pueblo («Sin eso no puede andar por aquí, ni en bici») y arranca la vuelta: **municipalidad** → **banco** (constancia de no deudor) → **pulpería** (timbre fiscal, 2 colones) → municipalidad → **escuela** (la maestra hace la fotocopia **a mano** porque la fotocopiadora está mala desde el 2019) → municipalidad: «¡Todo en orden! Ay, no… se cayó el sistema. **Vuelva mañana**». Al otro día: el **Permiso de Todo, sellado siete veces** (490), 10 colones «por la molestia» y más reputación. Arriba a la izquierda se ve siempre adónde ir. Logros «Me pidieron el Permiso de Todo» y «Sobreviví al trámite».

## 3.43.0 — 2026-11-07 · Dron, zompopas y viento papagayo
- Modo foto: **O = toma de dron**: la cámara **gira sola alrededor del personaje**, mirándolo siempre, con un subibaja suave; otra O la acelera y otra la apaga; cualquier tecla de movimiento la para. Logro «Toma de dron».
- **Zompopas** (`naturaleza3.js`): de día, en el monte, la selva, el bosque seco y el nuboso, aparecen **filas de hormigas** por caminitos que serpentean por el suelo: de ida cargan su **pedacito de hoja verde** y de vuelta van sin nada, meneándose al caminar. Son cientos de hormigas dibujadas en una sola pasada (no pesan). Logro «Las zompopas trabajando».
- **Viento papagayo**: en el **verano de Guanacaste**, de día, llegan **ráfagas** que suben y bajan suave: **empujan al personaje** (sin atravesar paredes), levantan **polvo y hojas** que cruzan la pantalla, suben el papalote y hacen **silbar el viento**. Logro «Viento papagayo».
- Arranca el **plan maestro 9** («Diay, ¿y ahora qué?»); el 8 quedó completo.

## 3.42.0 — 2026-11-07 · Carrera de cintas
- **Carrera de cintas** (`cintas.js`; arco de cintas 488: 5 tablas + 2 lanas, o 6 colones en el Mercado Central): con clic derecho se arma, atravesado 6 bloques enfrente, un **arco de madera** (dos postes y la viga) con **cinco cintas de colores** que cuelgan con su argollita y **se mecen con el viento**. Hay que pasar por debajo **a caballo, al galope** y **bien alineado** con una cinta: si le atina, **la saca** (sale volando y la gana, ítem 489); si pasa despacio o desalineado, la cinta se sacude («¡Uyyy, casi! La rozó»). Sacar las cinco da 15 colones del pueblo. Logros «Armé el arco de cintas», «Saqué una cinta» y «Rey de las cintas».
- El **plan maestro 8** queda completo.

## 3.41.0 — 2026-11-07 · Carreta con bueyes
- **Carreta con bueyes** (`carreta.js`; ítem 487: 3 maderas de Sarchí, 2 ruedas de carreta, 2 palos y una albarda, o 35 colones en el Mercado Central): la **carreta pintada a lo Sarchí** (caja roja con rombos azules y franjas amarillas) con **ruedas redondas con su mandala de colores que giran**, la lanza, el **yugo** y **dos bueyes** (uno blanco y uno café) que **caminan de verdad**: patas que se cruzan, cabeza que cabecea, cola que espanta moscas y, quietos, rumian. Uno va **sentado en la carreta**; W avanza despacito, S frena, A/D dobla, Shift se baja; sube escalones de un bloque, cruje la madera y los bueyes mugen de vez en cuando. Logros «Boyero de Sarchí» y «Carretero de toda la vida» (500 bloques).

## 3.40.0 — 2026-11-07 · El cuidacarros
- Sátira ficticia (`cuidacarros.js`): **el cuidacarros**. De día, al bajarse de la bici, la moto, la lancha o la avioneta en un pueblo, aparece **Don Memo** con **chaleco fosforescente** y una **franela roja** que agita con el brazo arriba: «¡Se lo cuido, jefe!». Se queda al lado del vehículo y cada tanto pide «una monedita para el cafecito». Con clic derecho se le da 1 colón y le **saca brillo** (chispitas). Al volver a montarse: si pagó, «¡Ahí está, intacto y brillante!»; si no… «Uy, jefe… alguien le dejó una rayita. Yo no vi nada, ¿eh?» (es broma: no le pasa nada). Logros «¡Se lo cuido, jefe!», «La monedita del cuidacarros» y «Una rayita».

## 3.39.0 — 2026-11-07 · Gallos al amanecer y chicharras
- **Gallos al amanecer**: cerca de cualquier pueblo, al salir el sol se oye un **coro de gallos** desde distintos puntos del pueblo, cada uno con su tono («¡Kikirikí! Los gallos del pueblo anuncian el día»). Logro «Despertado por los gallos».
- **Chicharras**: en las **tardes de verano** sin lluvia, en el bosque seco, el potrero, el monte y la selva, entra poco a poco el **chirrido de las chicharras** (sonido real de Freesound CC0, 2 grabaciones en bucle) y se apaga suave al caer la tarde. Logro «Tarde de chicharras».

## 3.38.0 — 2026-11-07 · Mariposas morpho
- **Mariposas** (`mariposas.js`): de día y sin lluvia, **morphos azules** brillantes en la selva y el manglar (grandes, de aleteo lento y amplio) y mariposas **amarillas, naranjas y blancas** en los potreros y el monte. Aletean de verdad (dos alas con bisagra y pausas de planeo), vuelan ondulado sin rumbo fijo, esquivan los bloques, no se meten al agua y **se espantan** si uno se acerca. Logro «Morpho azul».

## 3.37.0 — 2026-11-07 · Time-lapse
- Modo foto: **T = time-lapse** (×60, ×200 o ×600): el día corre rapidísimo —atardeceres, noche estrellada, amanecer— y **las nubes también corren**. Arranca y frena suave, sin brincos. Logro «Atardecer en time-lapse».
- Arranca el **plan maestro 8** («Más tico que el gallo pinto»); el 7 quedó completo.

## 3.36.0 — 2026-11-07 · Tiro al blanco y los íconos nuevos
- **Tiro al blanco** (`tiro.js`): en el turno y la feria, con la **honda** (o la cerbatana) en la mano, clic derecho a la **feriante** (2 colones, incluye 12 piedras o dardos). Aparecen **seis patitos amarillos** en dos filas que pasan de lado a lado dando saltitos; hay **30 segundos** (contador en pantalla) para botar los que pueda: al pegarles se van de espaldas. Premios: los 6 → **peluche de perezoso** (486), 4–5 → un chocolate, 2–3 → un chicharrón. Logros «Tiro al blanco» y «Puntería de feria».
- **Íconos nuevos**: entraron los **58 íconos en pixel art** que dibujó GPT para los ítems de las últimas versiones (papalote, parapente, avioneta, tabla de surf, comida guanacasteca, mechón del congo, meteorito, botiquín, planos, etc.). Solo faltan 2 (el trofeo de pesca y el peluche).

## 3.35.0 — 2026-11-07 · El influencer extranjero
- Sátira ficticia (`influencer.js`): **el influencer extranjero**. De día, en los pueblos y las playas (uno por día como mucho), aparece un turista con **camisa hawaiana, lentes oscuros y palo de selfie** con la lucecita roja de «grabando» que **lo sigue a uno** y suelta frases («¡Hola, mis amigos! Aquí con un local auténtico», «Bro, ¿esto es orgánico?»). Arriba sale el contador **● REC con las vistas**. Todo lo espectacular que uno haga mientras graba suma vistas: pelear y vencer jefes, pescar (un dorado vale más), abrir el parapente, agarrar una ola, despegar, aterrizar… o **estrellarse** en avioneta (lo que más vistas da). Al pasar las **100 000 vistas se hace viral**: le paga 25 colones «por la colaboración» y sube la reputación. A los 4 minutos se va «a grabar un sunset». Logros «Salí en un vlog» y «Me hice viral».

## 3.34.0 — 2026-11-07 · Torneo de pesca
- **Torneo de pesca** (`torneo.js`): con la **caña en la mano**, clic derecho al **pescador** del pueblo para inscribirse (3 colones; sin la caña sigue vendiendo como siempre). Durante **3 minutos** cada pescado que uno saque **se pesa** (pargo, corvina, guapote y el dorado, que puede pasar de 12 kg) y suma. Tres rivales del pueblo (Don Chepe «el Anzuelo», Doña Mireya y Mae Brayan) van sumando también, y una **tabla en pantalla** con el reloj muestra quién va ganando. Al final: **1.º** 30 colones y el **trofeo** (485), **2.º** 12, **3.º** 5. Botas viejas y palitos no cuentan. Logros «Torneo de pesca», «Campeón de pesca» y «¡Qué animalón!».

## 3.33.0 — 2026-11-07 · Cámara suave al montarse y en los escalones
- **Cámara suave**: al **montarse o bajarse** de la bici, la moto, el caballo, la lancha o la avioneta, y al **subir un escalón**, la cámara ya no salta de golpe: se desliza en una fracción de segundo. Las caídas y el movimiento normal siguen al instante (sin sensación de retraso).

## 3.32.0 — 2026-11-07 · La cancha se arma poco a poco
- La **cancha de la arena de retos se arma poco a poco**: del centro hacia afuera, anillo por anillo, con polvito y golpes de obra (1,2 s); cuando queda lista suena el silbato y empieza la cuenta regresiva.

## 3.31.0 — 2026-11-07 · Cámara que se inclina y avioneta que se ladea
- **Cámara y avioneta más cinematográficas**: la **avioneta se ladea en las curvas** según qué tan rápido dobla (había un error: la inclinación nunca se inicializaba y el avión iba siempre derecho) y el **piloto se ladea y cabecea con ella**. La **cámara acompaña la inclinación** (en la avioneta, en el parapente y meciéndose sobre la tabla de surf) y la **vista se abre** con la velocidad (avioneta, ola del surf, parapente).

## 3.30.0 — 2026-11-07 · Más pulido de animaciones
- Más pulido: el **peón** pega con un arco de verdad (levanta el brazo y lo baja con fuerza); la **boca del Mono congo** se abre y se cierra suave (y le tiembla al aullar); las **banderas de las caravanas ondean**; la **meta de la ruta** entra con animación cuando cambia y el color de la **durabilidad** cambia con transición.

## 3.29.0 — 2026-11-07 · Pulido de animaciones y parapente rehecho
- **Pulido de animaciones** (pedido de nanoyackson: que todo se sienta bien hecho y suave):
  - **Criaturas** (todas las que caminan): resorte de **aplastar y estirar** al recibir un golpe, al saltar y al aterrizar; **aparecen con un rebotito**; se **inclinan hacia adelante** al andar y **hacia adentro al doblar**, con su vaivén. La **muerte**: caen hacia el lado contrario del golpe con un rebote al tocar el suelo y **se encogen** antes de la nube.
  - **Mano** (primera persona): el objeto nuevo **sube con rebote**; **respira** en reposo; **inercia** al saltar y caer (baja con el aterrizaje); corriendo se inclina.
  - **Personaje en tercera persona**: el balanceo **arranca y para suave**; rebote del paso y vaivén del cuerpo; **pose en el aire** (brazos arriba al caer); corriendo se inclina; respira quieto.
  - **Parapente rehecho**: vela de **11 celdas en arco** (más ancha al centro, con las **bocas de aire** al frente y colores simétricos), decenas de **cuerdas** hasta dos bandas, **frenos** naranja, **silla con respaldo**, y el piloto **sentado** con las piernas al frente que se mecen y **las manos en los frenos** (tira del lado al que dobla). La vela se **despliega con rebote**, se mece encima del piloto, se inclina en las curvas y al cerrarse **se pliega y cae**.
  - **Surf**: la tabla aparece y la ola la **levanta y empina poco a poco**; el surfista va **agachado con los brazos abiertos** haciendo equilibrio.
  - **Trompo**: al final se **ladea, cae y rebota**. **Zopilotes**: llegan **bajando en espiral** desde muy alto. **Aros**: aparecen **uno tras otro con rebote**, el que sigue **respira** y al pasarlo **late**. **Avioneta**: la hélice **arranca y frena de a poco**. **Bingo**: el panel **entra con animación**, el número cantado **rebota** y las casillas se marcan suave.
- Arreglos: en el **modo foto** el personaje (y la vela o la tabla) ya no giran con la cámara libre; el objeto de la mano no se ve mientras vuela, surfea o maneja; el trompo cae bien aunque se apunte al zacate.

## 3.28.0 — 2026-11-07 · La arribada
- **La arribada** (`arribada.js`): cada 14 noches (desde la noche del día 7), si uno anda en la playa, **las tortugas lora salen del mar en grupos**, suben a la arena, **cavan** (con su arenita), algunas dejan **nido** y vuelven al agua; puede haber más de 25 a la vez. Están protegidas (no se dejan hacer daño). Logro «Vi la arribada». En el bestiario.

## 3.27.0 — 2026-11-07 · Comida guanacasteca
- **Comida guanacasteca** (en el fogón): **vigorón** (yuca + chicharrón + limón; 9 de comida), **rosquillas** (2 mazorcas + queso; salen 3), **tanelas** (mazorca + queso + tapa de dulce; salen 2) y **arroz con pollo** (2 de arroz + carne; salen 2, 10 de comida).
- **Yuca** nueva (480): el zacate de **Guanacaste** a veces la suelta y el Mercado Central la vende.

## 3.26.0 — 2026-11-07 · Surf
- **Surf** (`surf.js`; tabla 479: 3 tablas + lana, o 15 colones en la pulpería): con la tabla en la mano y metido **en el mar**, clic derecho para pararse en ella. **W rema** hacia donde mira; las **olas llegan en series** (cada 7–13 s) y, si uno va remando **hacia la playa** cuando pasa una, **la agarra**: sale disparado con la espuma detrás y la tabla inclinada. Si no, pasa de largo («la próxima reme hacia la playa»). Al llegar a la arena se baja solo; Shift también. En el río no hay olas.
- Logros «Pura vida, mae: a surfear», «Agarré una ola», «Hasta la orilla» y «Surfista de Jacó» (10 olas).
- Arranca el **plan maestro 7** («Tuanis a full»); el 6 quedó completo.

## 3.25.0 — 2026-11-07 · Circuito de aros y los congos del amanecer
- **Circuito de aros** (`aros.js`; bandera de circuito 478: palo + 2 lanas): con clic derecho aparecen **8 aros gigantes en el cielo** dando una vuelta de 70 bloques alrededor de uno, a distintas alturas. Hay que **pasarlos en orden** (el que sigue brilla amarillo y gira; los ya pasados se ponen verdes) en **avioneta o parapente**. El **cronómetro** arranca en el primero y al pasar el último anota el tiempo y el **récord** del mundo. Otro clic con la bandera lo quita (se desarma solo a los 10 minutos). Logros «Armé un circuito», «Ocho de ocho» y «As del aire» (menos de 45 s).
- **Los congos aúllan al amanecer**: en la selva, el monte, el bosque nuboso y el manglar, al salir el sol se oyen aullidos de congos a lo lejos («El despertador de la selva»).
- (Las bombetas de mano ya existían.)

## 3.24.0 — 2026-11-07 · El río crecido
- **El río crecido** (`rio.js`): con un **aguacero fuerte** (tormenta, o lluvia intensa en invierno) los ríos cercanos **suben un bloque y se salen a las orillas bajas** (también la costa poco honda: ¡marejada!). La **corriente arrastra** al que se meta (con aviso), y el agua **trae cosas**: palos, troncos, una bota vieja, manzanas… y a veces **una gallina**. Cuando escampa, el río **vuelve a su cauce** de a poquito.
- Solo pone agua donde había aire, sin que corra, guarda cada bloque en la partida (hasta 900) y los quita al escampar si siguen siendo agua. Logros «El río se creció» y «Arrastrado por la corriente».

## 3.23.0 — 2026-11-07 · La avioneta
- **Avioneta** (`avioneta.js`; ítem 477: 5 hierros, 2 tablas, lana y un bidón): se pone en el suelo con clic derecho (mejor en un llano largo o una pista) y con otro clic derecho uno se sube a la cabina. **W acelera**, **S baja el motor / frena**, y la avioneta **va hacia donde uno mira con el mouse**: arriba/abajo para subir y bajar, a los lados para doblar (se inclina en las curvas). **Despega** pasando 13 de velocidad; si en el aire baja de 9, **pierde sustentación** y se va de trompa (con aviso). Hélice que gira, luces roja y verde en las puntas, tren de aterrizaje y sonido de motor.
- **Aterrizar**: bajando suave sobre el piso dice cuántos bloques voló; si baja muy rápido o choca de frente a buena velocidad: **¡se estrella!** (explosión, daño y chatarra para recoger). Shift se baja; en el aire pide confirmación (¿trae parapente?) y la avioneta sin piloto cae y se hace pedazos.
- Gasta gasolina (el bidón la llena) y tiene techo de vuelo. Logros «Piloto de avioneta», «Despegue», «Aterricé entero», «Aterrizaje forzoso», «Sobre las nubes», «Vuelo largo» (1000 bloques) y «Me tiré de la avioneta».

## 3.22.0 — 2026-11-07 · Parapente
- **Parapente** (`aire.js`; ítem 476: 4 lanas + 2 palos, o 25 colones en la pulpería): tírese de algo alto y, **cayendo**, clic derecho lo abre. La vela de siete colores con sus cuerdas aparece encima; uno **planea hacia donde mira** (9 bloques por segundo) bajando despacito, con **Shift** baja más rápido y otro clic derecho lo cierra. De día, sobre arena, roca caliente, el páramo o cerca de los volcanes hay **térmicas** que lo suben. **Sin daño por caída** mientras va colgado; al tocar el piso se cierra solo y dice cuántos bloques voló (en el agua: ¡splash!). Logros «Vuelo en parapente», «Cazador de térmicas» y «Piloto de parapente» (150 bloques).
- La fila del banco y el Ebáis ya existían (se marcan en el plan 6).

## 3.21.0 — 2026-11-07 · La Bruja Zárate y la Mano Peluda
- Leyendas nuevas (`leyendas2.js`):
  - **La Bruja Zárate** (la de Escazú): desde el día 3, de noche y cerca de los pueblos, aparece una viejita de vestido morado, pelo blanco en moño, ojos verdes que brillan, bastón torcido y **una lora en el hombro**, rodeada de chispitas. Pide un **cafecito**: con café chorreado, café con leche o café tostado en la mano y clic derecho, le da **una pócima** (suerte, energía, pluma, contra el fuego, para respirar bajo el agua o calma). Si la atacan, **se vuelve lora y se va volando**… dejando **un hechizo** («¡Que todo le dé vueltas!», sueño o miedo). Con el día, desaparece. En el bestiario.
  - **La Mano Peluda**: a veces (12 %), después de dormir la noche, uno amanece sin algo de la mochila: la Mano Peluda salió de debajo de la cama y **se lo llevó**… pero es traviesa, no ladrona: lo deja tirado cerca de la cama.
  - Logros «Vi a la Bruja Zárate», «Café para la bruja», «Hechizado por la bruja» y «La Mano Peluda».
- (El Padre sin cabeza ya existía.)

## 3.20.0 — 2026-11-07 · El mapache ladrón y los zopilotes
- Fauna nueva (`fauna3.js`):
  - **El mapache ladrón**: de noche, en el monte, el potrero, la playa o el manglar, si uno anda **comida en la mochila** se acerca de puntillas, **le mete la mano** y se lleva 1 o 2 de algo, y **sale corriendo** con el botín en la boca. Si lo alcanza y le pega, **suelta lo robado**. Antifaz negro, cola con anillos. Logros «Me robó un mapache» y «Devuélvame eso, mapache». En el bestiario.
  - **Zopilotes**: cuando uno mata algo grande, aparecen tres zopilotes que **dan vueltas en el cielo** sobre el lugar (planeando y aleteando de vez en cuando) y se van a los dos minutos y medio. Y si uno anda **con muy poca vida**, ¡dan vueltas sobre uno! («Ya me andan esperando»).

## 3.19.0 — 2026-11-07 · Bingo de la iglesia
- **Bingo de la iglesia** (`bingo.js`): los **sábados**, al llegar al pueblo avisa que hay bingo. La **beata** vende el cartón (2 colones, «para el techo de la iglesia») y se abre el salón: un **cartón de 5 × 5** (B-I-N-G-O, con la casilla libre del centro). La señora **canta los números** cada pocos segundos, con sus dichos («¡B-7, el siete de la suerte!», «los dos patitos», «la niña bonita»…); uno **marca con clic** solo lo que ya cantaron y, con línea, columna o diagonal completa, grita **¡BINGO!**
- Premios al azar: chicharrones, colones, tamales, cafés con leche, un mapa del tesoro… y hasta **un diamante** «donado por un feligrés misterioso». Si grita sin tener línea: **¡falso bingo!** y el salón se ríe. Si se duerme, gana **Doña Chepa** (otra vez). Esc o «Salir» vuelven al juego.
- Logros «Noche de bingo», «¡BINGO!», «Falso bingo» y «La reina del bingo» (3 ganados).

## 3.18.0 — 2026-11-07 · Papalote, trompo y chumicos
- Juegos tradicionales (`juegos.js`):
  - **Papalote** (473; 3 palos + lana, o en la pulpería): con clic derecho se suelta y **se eleva con el viento**: en **verano** sube hasta unos 25 bloques y se va lejos; en invierno apenas se levanta y con lluvia **se moja**. Tiene sus cuatro colores, la **cola de lacitos** que se mece y la **cuerda** que hace panza hasta la mano. Si lo vuela en plena **tormenta**… **le cae un rayo** («Inventor de la electricidad»). Se enrolla con otro clic o al cambiar de objeto. Logro «Papalote en las nubes».
  - **Trompo** (474; tablas + palo): clic derecho al piso y **baila** girando con su tambaleo y polvito hasta que se cae (6–13 s; con suerte, más). Si pasa de 13 s: «Trompo bailarín».
  - **Chumicos** (475, en la pulpería): con chumicos en la mano, clic derecho a un vecino para **jugar una partida**: si gana se lleva uno del vecino, si pierde le deja el suyo (con sus comentarios). Logros «Una de chumicos» y «Rey de los chumicos» (10 ganadas).
- Arreglo: al salir de la partida se limpian los proyectiles, los mangos del congo, la arena y el papalote (antes solo al cambiar de dimensión).

## 3.17.0 — 2026-11-07 · Cámara lenta y barras de cine
- Modo foto para el canal: **C = cámara lenta** (½, ¼ y ⅒; el mundo va despacio pero la cámara se sigue moviendo a velocidad normal, ideal para tomas de acción) y **V = barras de cine** (formato película arriba y abajo, entran con animación). Al salir con F2 todo vuelve a la normalidad. Logro «Todo en cámara lenta».
- Arranca el **plan maestro 6** («Pura vida al máximo», `docs/PLAN_MAESTRO_6.md`); el 5 quedó completo.

## 3.16.0 — 2026-11-07 · Indicadores de meta y durabilidad
- Indicadores en pantalla (`indicadores.js`):
  - **La siguiente meta de la ruta** del aventurero debajo del minimapa, con cuántas lleva («🧭 Primer hierro · 3/13»). Sube a la esquina si el minimapa está apagado; se esconde con el HUD, en el modo foto y al completar la ruta.
  - **Durabilidad** de la herramienta o arma en la mano junto a la barra («🔧 45/250»), en verde, amarillo o rojo según lo que le queda; con menos del 10 % parpadea y avisa una vez: «le quedan 20 usos, hágase otro antes de que se rompa».
- (Ordenar, juntar y recoger todo de los cofres ya estaba en los botones de la ventana del cofre.)

## 3.15.0 — 2026-11-07 · La calle nueva que abren cada semana
- Sátira ficticia (`calle.js`): **la calle nueva que abren y cierran cada semana**. De los días 2 a 4 de cada semana del juego, la municipalidad abre una **zanja** de 3 × 3 en una calle de asfalto del pueblo, con **conos**, **barrera** y el **Ing. Zanjas**, que no sabe para qué es el hueco («Es una obra de mejoramiento vial. Primero empeora, después mejora»). Después la **tapan con un parche**… y la otra semana abren otra al lado. Con las semanas, la calle queda hecha un mosaico de parches.
- Solo toca bloques de calle (y aire para los conos) y guarda lo que cambió en la partida para devolverlo; si el terreno no está cargado, espera. Logros «Hablé con el ingeniero» y «La calle de nunca acabar» (3 zanjas tapadas).

## 3.14.0 — 2026-11-07 · Elecciones municipales (ficticias)
- Sátira (todo ficticio) en `elecciones.js`: **elecciones municipales** cada 20 días.
  - **4 días de campaña**: en el pueblo dan vueltas a la plaza **tres caravanas** con **banderas** de colores, **pitos** y papelitos: el *Partido Unión de Vecinos Unidos* (PUVU, «¡Unidos por la unión!»), el *Partido del Progreso que Viene* (PPV, «¡El progreso viene! (algún día)») y el *Movimiento Bache Cero* (MBC). Los candidatos gritan sus promesas («Bachearemos los baches de los baches», «Una rotonda en cada esquina», «El estadio para el 2090»…) y con clic derecho le dan a uno un **tamal de campaña** (uno por candidato por día).
  - **Día de elecciones**: clic derecho a un candidato para **votar** (queda el dedo morado de tinta). En la noche salen los **resultados** con porcentajes y su buen **abstencionismo**.
  - Después, cada 4 días, el periódico informa que la promesa del ganador sigue **«en estudio»**, que formaron una comisión o que «va muy avanzada» (no hay nada).
  - Logros: «Pito, bandera y caravana», «El tamal de campaña», «Ejercí mi derecho al voto», «Voté por el que ganó» y «Promesas de campaña».

## 3.13.0 — 2026-11-07 · Neblina, luciérnagas y sapos
- El mundo más vivo (`mundo2.js`):
  - **Neblina del amanecer**: desde un poco antes de que salga el sol hasta media mañana, la montaña (de 80 m para arriba, el páramo, el volcán y el bosque nuboso) amanece con **neblina espesa** que se va levantando sola. Logro «Entre la neblina».
  - **Luciérnagas** en las noches secas de verano, en el monte, el potrero, la selva y el manglar: lucecitas verde-amarillas que se prenden y se apagan alrededor (logro «Noche de luciérnagas» después de 20 s entre ellas).
  - **Sapos** que salen a cantar en las **noches de lluvia** (hasta 6 cerca): cafés, con verrugas, ojos dorados y el **buche que se infla** cuando cantan; brincan lejos si uno se acerca y se van cuando escampa.
  - **Besar al sapo** (clic derecho): casi siempre «era un sapo nomás», pero muy de vez en cuando… **era un príncipe encantado** que da 20 colones de agradecimiento. Logros «Besé un sapo» y «Besé un sapo (y funcionó)».

## 3.12.0 — 2026-11-07 · Arena de retos
- **Arena de retos** (`arena.js`): el **silbato del reto** (471, en la pulpería a 12 colones) con clic derecho arma, donde uno esté, una **cancha de arena cercada** de 15 × 15 con postes y antorchas (aplana y limpia el terreno; no toca cofres). Suena el silbato y empiezan **5 oleadas** de Sombras con cuenta regresiva y descanso entre una y otra: Sombras, honderas, con escudo y, al final, **la Sombra capitana** (más grande, más brava y con barra de jefe).
- Premios: cada oleada da colones (4, 8, 12, 16, 20) y experiencia; la final, además, **un diamante** y la **Copa del reto** (472). Si sale de la cancha o lo vencen, pierde el reto. Las Sombras de la arena no se queman con el sol (se puede pelear de día).
- Sonido nuevo: **silbato de árbitro** real (Freesound CC0, 2 variantes). Logros «Al ruedo», «Campeón de la arena», «Leyenda de la arena» (3 copas) y «Vencí a la Sombra capitana».

## 3.11.0 — 2026-11-07 · El Mono congo gigante
- Jefe nuevo (`monocongo.js`): **el Mono congo gigante**. Aparece **de día en la selva** de vez en cuando (con un aullido que sacude todo) y tiene barra de jefe. Ataques:
  - **Aullido**: retumba la pantalla, **marea** y **empuja** lejos al que esté cerca.
  - **Mangos en curva**: le tira mangos de lejos (¡plaf!); a media vida **se enfurece** y tira **de a tres**, y aúlla más seguido.
  - **Salto enorme**: brinca por encima y cae cerquita con un temblor que golpea.
  - De cerca, manotazos.
- Suelta el **Mechón del Mono congo** (470), mangos y colones. Con el mechón en la mano y clic derecho, uno **aúlla como congo** y las criaturas hostiles de alrededor salen corriendo (cada 30 s). Logros «Vencí al Mono congo gigante» y «Aullé como congo».
- Las criaturas pueden marcarse como `diurno` para que el sol no las queme.

## 3.10.0 — 2026-11-07 · Compañeros: el peón por un día y el perro que trae cosas
- Compañeros (`compas.js`): **contratar un peón por un día**. Con colones en la mano, clic derecho a un vecino (que no atienda negocio): ofrece sus servicios por **10 colones** y, con otro clic, se cierra el trato. Durante un día de juego **lo sigue**, **pelea** contra las criaturas hostiles que anden cerca (grita «¡Al patrón no lo toca!» y mueve el brazo al pegar), **carga cosas** (clic derecho abre sus 18 espacios) y **hace conversa** de vez en cuando. Shift + clic: se queda esperando. Al terminar el día devuelve lo que cargaba y se va a la casa. Se guarda con la partida como las mascotas. Logros «Patrón por un día» y «Mi peón es un león» (10 golpes).
- El **perro zaguate** adoptado ahora **trae cosas**: cada uno o dos minutos sale corriendo, olfatea y vuelve con algo en el hocico que deja a los pies: palos, una bota vieja, manzanas, colones, orejas de guanacaste, hierro, oro, jade… y muy de vez en cuando **un diamante**. Logros «¿Quién es un buen perro?» y «El perro millonario».

## 3.9.0 — 2026-11-07 · Mantarrayas, pulpos, tiburón ballena y arrecifes vivos
- Más mar (`mar2.js`): **mantarrayas** en grupos de 3 a 6 que planean aleteando y, cada tanto, **saltan fuera del agua y dan vueltas en el aire** antes del chapuzón (logro «Vi saltar las mantarrayas»).
- **Pulpo** en el fondo, cerca del coral o en aguas bajas: las patas ondulan; si uno se le acerca nadando, **tira tinta** (nube negra, la pantalla se oscurece un momento) y se va rapidísimo (logro «Entintado»). Con paciencia y clic derecho «le agarra el dedo» (logro «Amigo del pulpo»).
- **Tiburón ballena**: el pez más grande, con sus manchas blancas, rémoras pegadas y la boca abierta comiendo plancton cerca de la superficie. Manso y protegido; nadar a su lado da el logro «Nadé con el tiburón ballena».
- **Arrecifes vivos**: cerca del coral aparecen cardúmenes de 6 a 10 peces de colores que nadan juntos alrededor.
- Las tres criaturas nuevas están en el bestiario.

## 3.8.0 — 2026-11-07 · El piñal: piña, fresco y cajeta
- **Piñal** (bloques 607–610): la **corona de piña** (466) se siembra en zacate, tierra o tierra arada y crece en 4 etapas hasta la **piña** madura. Al cosecharla da 1–2 **piñas** (467, el doble con la habilidad de agricultura) y la corona para volver a sembrar; si se arranca antes, solo devuelve la corona. Logro «Piñero de la Zona Norte».
- Coronas silvestres: el zacate de la **Zona Norte** y del **Caribe** a veces suelta una. El Mercado Central vende coronas y piñas, y compra piñas a 4 colones las 3.
- Cocina: **fresco de piña** (piña + tapa de dulce + agua; quita la sed y da energía) y **cajeta de piña** (2 piñas + tapa de dulce). Una piña también se puede deshacer en su corona.
- (El trapiche con la tapa de dulce, el chocolate de cacao y el café tostado ya existían desde antes.)

## 3.7.0 — 2026-11-07 · El cielo: estrellas fugaces, meteoritos, luna roja y eclipse
- El cielo (`cielo2.js`): **lluvia de estrellas fugaces** cada 6 noches (estelas que cruzan el cielo; logro «Pedí un deseo») y, de vez en cuando, **cae un meteorito** cerca: estela de fuego, temblor, explosión y un **cráter** con una roca de **meteorito** (bloque 606, brilla) que suelta un **fragmento de meteorito** (465): clic derecho da 10 minutos de suerte, o se vende en la pulpería (30 colones).
- **Luna roja** cada 28 días: la noche se tiñe de rojo, salen más leyendas y **toda la experiencia vale el doble** (logro «Bajo la luna roja»).
- **Eclipse de sol**: desde el día 5, de vez en cuando (cada 12–21 días como mínimo) el día se oscurece poco a poco durante 70 s y vuelve el sol (logro «Vi el eclipse»).

## 3.6.0 — 2026-11-07 · Cámara cinematográfica
- Modo foto (`foto.js`) para grabar el canal: **cámara cinematográfica** — **1** guarda un punto (posición, hacia dónde mira y zoom), **2** reproduce un **recorrido suave** entre todos los puntos (curva Catmull-Rom, 3 s por tramo; cualquier tecla de movimiento lo para), **3** los borra. **Z congela el tiempo** (todo se queda quieto mientras la cámara se mueve) y **X** cambia el **filtro** (normal, blanco y negro, sepia, colores vivos). Al salir con F2 se quita el filtro y se descongela. En el modo foto las letras ya no abren menús (todo va a la cámara). Logro «Director de cine».

## 3.5.0 — 2026-11-07 · Minimapa
- `src/minimapa.js`: **minimapa** arriba a la izquierda (150×150, 100×100 en pantallas chicas): el mismo dibujo del mapa grande alrededor del jugador (biomas, ríos, caminos, lugares, marcadores, la cama, el lote) con la flecha, pero sin los nombres. Se refresca cada medio segundo de a poquito. Se prende y apaga con la **O** (configurable en Ajustes → Teclas; se recuerda). No sale en el modo foto, con la interfaz escondida (F1) ni en el inframundo. `drawMap` acepta `{ sinEtiquetas }`.

## 3.4.0 — 2026-11-07 · El tren
- `src/tren.js`: **el tren**. En la estación, el **jefe de estación** vende el pasaje (6 colones) a la **otra estación más cercana** (a más de 150 bloques) o, si no hay, a **un pueblo del Caribe**. Suena el pito, la pantalla se va a negro, el jugador viaja (espera a que cargue el terreno del destino) y llega parado en el suelo, con los minutos de viaje sumados a la hora. Logros «Viaje en tren» y «Maquinista honorario» (3 viajes).
- Con esto queda **completo el plan maestro 4**.

## 3.3.0 — 2026-11-07 · Partido en el estadio
- `src/partido.js`: **partido en el Estadio Nacional**. Al entrar de día arranca un **5 contra 5**: jugadores con **chaleco rojo y azul**; el más cercano de cada equipo corre a la bola y la **patea hacia el marco contrario**, los demás se acomodan entre la bola y su marco. **Goles** cuando la bola cruza la línea entre los palos (con aplausos, confeti y el marcador grande «Rojos 1 – 0 Azules»). Cada 25–45 s **la ola** recorre las graderías. Uno puede meterse a patear (clic a la bola). Termina a 3 goles o a los 3 minutos (o si uno se va) y descansa 2 minutos antes del siguiente. Detecta solo para dónde quedaron los marcos aunque el estadio esté girado. Logros «Fui al estadio» y «Hice la ola».

## 3.2.0 — 2026-11-07 · Rafting y rápidos
- `src/rafting.js`: **los ríos tienen corriente**. Como el agua de los ríos está toda al nivel del mar, la dirección sale del **trazado del cauce** (sigue la línea del río hacia donde baja el continente, o sea hacia el mar). En bote, la corriente lo lleva río abajo aunque uno no reme (a remo se puede ir contra ella). Donde el río pasa **entre cerros altos** hay **rápidos**: más velocidad, espuma, brincos con salpicadas y la pantalla tiembla. Funciona en todos los mundos. Logros «Rafting por el río» (80 bloques de corriente) y «Sobreviví a los rápidos».

## 3.1.0 — 2026-11-07 · La catarata escondida
- **Generador v15** (mundos nuevos): **la catarata escondida** (`src/catarata2.js`, rara, en selva, bosque o nuboso). Un farallón de 22 bloques con una **caída de agua de 5 de ancho** y una poza grande; **atravesando el agua** hay una **cueva secreta** con piso de musgo, hongos que brillan, cristales en el techo y un **cofre** (oro, diamante, perlas, jade, libro de recetas, a veces escama de sirena). Placa con la leyenda. De día con sol se forma un **arcoíris** en la poza. Logros «Detrás del agua» y «El arcoíris de la catarata».

## 3.0.0 — 2026-11-07 · NanoBlocks 3.0: el templo hundido
- **NanoBlocks 3.0** 🎉 — hito después de 40 versiones seguidas (2.60 a 2.99): sed y fogata, habilidades, armas y mini-jefes, historias del pueblo, fauna nueva, tesoros y buceo, economía y soda, fiestas, bestiario, muebles, sitio arqueológico, bloques de 16 bits, bici, moto y lancha, rayos y ceniza, la Caverna del Rey, oficios, mascotas, modo foto, diario, sátira, sequía y huracán, red de pesca, guía, carnaval, la Llorona completa y la Sirena.
- **Generador v14** (mundos nuevos): **el templo hundido** (`src/templo.js`, legendario): ruinas de piedra musgosa en el fondo del mar poco hondo (6 a 16 bloques de agua), con plataforma y escalones, **columnas quebradas**, un **santuario** de techo medio caído con **cristales que alumbran** y un **cofre** (oro, muchas perlas, diamantes, jade, escamas de sirena, libro de recetas, mapa del tesoro y colones), y **coral** alrededor. De noche, cerca, **aparece la Sirena** sobre el santuario (una vez por noche). Logro «El templo bajo el mar». Con la careta o la escama de sirena se explora con calma.

## 2.99.0 — 2026-11-07 · La Sirena del río
- `src/sirena.js`: **la Sirena del río** (leyenda nueva). De noche, cerca de un río o lago, de vez en cuando aparece en la orilla (cola de pescado turquesa con escamas que brillan, pelo verde oscuro, ojos que brillan) y **canta** (canto real de Freesound CC0, bucle «loop.sirena», con subtítulo). Su canto **encanta**: jala al jugador hacia el agua y a veces lo marea; **agachado** (tapándose los oídos) no lo jala, y aguantar 15 s así da el logro «Resistí el canto de la sirena». Si uno cae al agua a su lado, **lo hunde**. Con una **flor** roja o amarilla se va contenta y deja una **escama de sirena** (464): al usarla, 10 minutos de aire largo bajo el agua. Si le pegan, se zambulle. Con el día se va. Sale en el bestiario.

## 2.98.0 — 2026-11-07 · La presa eterna
- **La presa eterna** (`satira.js`, ficticia): a menos de 260 bloques de la capital, en cualquier calle (asfalto, o la piedra lisa y el concreto de la ciudad) siempre hay **presa**: van apareciendo hasta 8 carros parados alrededor y suenan **pitos** de gente desesperada. Al salir de ahí los carros desaparecen. Aviso «Bienvenido a la Circunvalación (ficticia): presa desde 1979. Tiempo estimado: sí» y logro «La presa eterna».

## 2.97.0 — 2026-11-07 · Guía turístico
- `src/turistas.js`: **guía turístico**. De día en los pueblos, cada 5–10 min puede aparecer una **pareja de turistas** (ficticios, con sombrero de safari y cámara). Al hablarle a uno, eligen el **lugar famoso más cercano** (a más de 60 bloques: catarata, volcanes, parques nacionales, la basílica, el canopy, el sitio arqueológico…) y ofrecen pagar según la distancia; lo **siguen** y el destino sale con 🏕 en la brújula y el mapa. En el camino comentan («Wow, so beautiful!», «¿Falta mucho, amigo?»). Al llegar pagan **lo acordado más propina** y se van. +1 de reputación. Logros «Guía turístico» y «Guía de cinco estrellas» (5 tours). Si se recarga la partida en medio del tour, vuelven a aparecer al lado.

## 2.96.0 — 2026-11-07 · Atajos configurables
- `src/teclas.js`: **atajos configurables**. En Ajustes hay una sección **Teclas** con 15 acciones (inventario, mapa, ruta, logros, habilidades, bestiario, diario, marcar punto, soltar, golpe cargado, voltereta, fijar enemigo, cambiar cámara, modo foto y consola): clic en una y después la tecla nueva (Esc cancela). Si otra acción usaba esa tecla, se intercambian. El movimiento (W/A/S/D, Espacio, Shift, Ctrl), Esc, F1, F3 y F5 quedan fijos. Botón para volver a las teclas de siempre. Se guarda en los ajustes (`settings.teclas`).

## 2.95.0 — 2026-11-07 · La Llorona en su forma completa
- **La Llorona en su forma completa** (`leyendas.js`): ahora tiene 60 de vida (antes 40) y da 60 de experiencia. Con **media vida se enfurece**: cada 9 s **grita** (sacude la pantalla, marea, da miedo y empuja al jugador hacia atrás) y cada 2,6 s **tira lágrimas** desde lejos (un chorrito de gotas que viaja hasta uno; 2 de daño). Con **un cuarto de vida** grita y llora más seguido, **aparece y desaparece** alrededor del jugador cada 5 s en una nube fría y el drenaje de cerca es más rápido.

## 2.94.0 — 2026-11-07 · Carnaval y tope
- Fiesta nueva en el calendario (`fiestas2.js`, **día 9** del ciclo de 12, de día):
  - En los pueblos del **Caribe**: **carnaval**. Hasta 8 vecinos forman una **comparsa** con penacho de plumas de colores, **bailan** (se mecen con los brazos arriba) y dan vueltas a la plaza; suenan **tambores** reales (bucle «loop.comparsa», Freesound CC0) y cae confeti. Logro «Carnaval en el Caribe».
  - En los demás pueblos: **tope de caballos**: hasta 5 caballos dan la vuelta a la plaza; al terminar el día se van. Logro «Tope de caballos».

## 2.93.0 — 2026-11-07 · Don Tobías, el guía
- `src/guia.js`: **Don Tobías, el guía**. En supervivencia, los primeros 3 días aparece al lado del jugador y lo sigue de lejos (si se queda muy atrás, lo alcanza). Al hablarle se presenta en tres partes (lo básico: madera y mesa, las Sombras de noche, agua, comida variada, la cama y la libreta) y después cada vez dice **cuál es la siguiente meta de la ruta del aventurero** con su pista. Al cuarto día se despide. Logro «Bien guiado».

## 2.92.0 — 2026-11-07 · Red de pesca
- `src/redes.js`: **red de pesca** (463: lana en X). Clic derecho al agua: queda **tirada y flotando** en la superficie (bloque extendido 605, con sus corchos). A los **2,5 minutos** se recoge con clic derecho: salen **2 a 5 pescados** (en el mar y la playa pargo, corvina y a veces dorado; en agua dulce guapote y corvina) y a veces una bota vieja; si está vacía avisa cuánto falta. La red queda puesta para la siguiente redada (se quita rompiéndola). Logros «Redada» y «Pescador de oficio» (15 redadas).

## 2.91.0 — 2026-11-07 · Sequía y huracán
- `src/clima3.js`: **sequía en Guanacaste** en la segunda mitad de cada verano (días 4 a 7 del ciclo de 14): las cosechas en Guanacaste crecen a la mitad, el bosque seco da 30 % más sed y pasan **remolinos de polvo**. Aviso y logro «Verano seco en Guanacaste».
- **Huracán «Chepe» (ficticio)**: desde el día 8, de vez en cuando (cada 20–30 días como mínimo) un día de huracán en el Caribe y la Zona Norte: tormenta todo el día, **el viento empuja** a quien esté sin techo, pasan hojas y basura y **láminas de zinc volando**. Es solo de mentira: no rompe nada del mundo. Logro «Sobreviví al huracán Chepe».

## 2.90.0 — 2026-11-07 · Cuevas de cristal
- **Generador v13** (mundos nuevos): **cuevas de cristal**. En las cuevas hondas (debajo de la altura 46), por zonas, salen **racimos de cristal** que brillan (bloque extendido 603) en el piso y el techo, y **bloques de cristal** (604, también con luz) incrustados en la roca. En un mundo de prueba salieron unos 600 racimos y 190 bloques en 90 chunks. Se sacan con pico; la pulpería compra 4 racimos por 6 colones.

## 2.89.0 — 2026-11-07 · La platina y el permiso de la soda
- `src/satira.js` (todo ficticio): **la platina**. En los puentes de un carril de las carreteras, una de cada tantas losas de concreto es «la platina»: al pasar encima (a pie o en vehículo) suena ¡CLANG!, sacude y el carro brinca. Siempre es la misma losa. Logros «La famosa platina» y «Ya me sé todas las platinas» (20).
- **Permiso de funcionamiento de la soda**: con la soda abierta, el funcionario de la municipalidad arranca el trámite: tres días seguidos de «vuelva mañana» (no hay sistema, falta el sello, la jefa está de vacaciones, el formulario es el viejo…) y al cuarto día sale por 20 colones del timbre. Sin permiso, de vez en cuando llega el **inspector municipal**: multa de hasta 15 colones y la soda queda cerrada 2 minutos. Logros «Trámite eterno», «Soda con todos los permisos» y «Me cerraron la soda».

## 2.88.0 — 2026-11-07 · Diario del aventurero y marcadores con nombre
- `src/diario.js`: **diario del aventurero** (cuarta hoja de la libreta, tecla **N**): se escribe solo con cada amanecer («Amaneció el día 5 en Guanacaste, con lluvia»), cada lugar descubierto, cada logro, cada muerte (con la causa) y cada marcador; agrupado por día, lo más nuevo arriba (guarda los últimos 250).
- **Marcadores con nombre**: **Shift+B** pone uno donde uno está, con nombre automático («Cerca de la Basílica…» si hay un lugar cerca, o «Valle Central 3»). Salen en el mapa (🔖 con su nombre) y los 3 más cercanos en la brújula. En el mapa, **clic derecho** sobre uno lo borra. Hasta 30. (B sigue marcando el punto rojo de siempre.)
- Consejo de inicio nuevo sobre Shift+B y el diario.

## 2.87.0 — 2026-11-07 · Modo foto
- `src/foto.js`: **modo foto** con **F2**. La cámara se separa del personaje y vuela libre: W/A/S/D hacia donde mira, Espacio sube, Shift baja, Ctrl más rápido, la rueda del mouse acerca o aleja (zoom de 15° a 110°). El personaje se queda quieto y **se ve** (para salir en la foto). Se esconde toda la interfaz (brújula, barras, experiencia, avisos de misión…). **Enter** guarda la foto en Descargas como `nanoblocks-AAAAMMDD-HHMMSS.png` (con destello y clic de cámara; se toma justo después de dibujar el cuadro). F2 sale y deja la interfaz como estaba. Logros «Fotógrafo de NanoBlocks» y «Álbum de viaje» (10 fotos). Consejo nuevo en la pantalla de carga.

## 2.86.0 — 2026-11-07 · Loro, perezoso de mochila y nombres
- `src/mascotas.js`: **loro de frente roja** (selva, bosque o manglar, de día): con semillas de maíz o frijol se hace su amigo (40 % cada vez), vuela al **hombro derecho** y va ahí; cada 18–43 s **dice una frase tica** con globito («¡Pura vida!», «¡Upe!», «¿Quiere cacao?», «¡Arroz y frijoles!»…). Clic derecho: se queda o lo sigue. Logro «Loro de hombro».
- **Perezoso de mochila**: con un banano, el perezoso se le **cuelga de la espalda** y va con uno (cada minuto da un ratito de calma). Shift + clic derecho lo baja. Logro «Perezoso de mochila».
- **Cartelito** (462: tablas y palo → 2): clic derecho sobre una mascota le pone **nombre** (cada clic cambia: Canelo, Chispa, Pancho, Lola, Moncho…) con un letrerito sobre la cabeza. Logro «Bautizo de mascota».
- Las mascotas se revisan antes del clic de cada criatura (`mascotaInteract` en `Mob.interact`).

## 2.85.0 — 2026-11-07 · Café por cajuela y batea de oro
- `src/oficios.js`: **cogida de café por cajuela**. La **cajuela** (458: palos, o 3 colones en el beneficio) en la mano: al coger un cafeto maduro los granos caen adentro (avisa «12 de 20»); con 20 se vuelve **cajuela llena** (459), que el caficultor del beneficio compra a 24 colones (con el precio del día). Logros «Coger café por cajuela» y «Cogedor de café de los buenos» (10 cajuelas).
- **Batea de oro** (460: tablas; 80 usos): clic derecho al agua de un río (no del mar) y quedarse quieto 3 s; a veces sale una **pepita de oro** (461), más seguido en Guanacaste y la zona norte. 4 pepitas hacen 1 de oro; la pulpería las compra a 6. Logros «Oro de Abangares» y «Fiebre del oro» (25 pepitas).

## 2.84.0 — 2026-11-07 · La Caverna del Rey
- **Generador v12** (mundos nuevos): **La Caverna del Rey** (`src/caverna.js`, épica, en bosque, selva, llanura, bosque seco o nuboso). Arriba, una boca de piedra musgosa con antorchas y una placa; una **escalera de caracol** baja 26 bloques hasta una **gran sala** con pilares, antorchas y telarañas, un **foso de lava con un puente de un bloque**, **dos cuartos con cofres** (hierro, oro, carbón, a veces diamante y jade, perlas, vendas, colones) y al fondo el **trono**, con un cofre más rico (y un mapa del tesoro y un libro de recetas).
- **El Murciélago Rey** (jefe, 110 de vida, con barra): despierta al entrar a la sala del trono (una vez por caverna). Da vueltas encima y se tira **en picada** cada 4 s (2,5 en la segunda fase), **chilla** (miedo y mareo) y desde la mitad de la vida **llama a 3 murciélagos** en cada chillido. Suelta oro, diamantes y una pluma de quetzal; +60 de experiencia. Logros «A la boca de la caverna» y «Vencí al Murciélago Rey». Sale en el bestiario.

## 2.83.0 — 2026-11-07 · Rayos y ceniza del volcán
- `src/clima2.js`: **rayos** en las tormentas fuertes: cada 18–58 s cae uno a menos de 36 bloques, en lo más alto de unos cuantos puntos al azar (busca árboles y cerros). Se ve la descarga zigzagueante desde el cielo, relampaguea, truena encima y tiembla un poco. Quema: las hojas alrededor desaparecen, los troncos quedan como **tronco quemado** (bloque extendido 601, negro con brasas; suelta carbón) y el pasto se vuelve tierra. Les hace 8 de daño a las criaturas que estén ahí, y al jugador 6 si está a menos de 3 bloques **sin techo**. Logros «Un rayo cayó cerquita» y «Le cayó un rayo (y vivió para contarlo)».
- **Ceniza del volcán**: después de cada erupción del Arenal, hasta 300 bloques a la redonda cae ceniza por casi un minuto y medio (copos grises) y va dejando **capitas de ceniza** en el suelo (bloque extendido 602, se quita con pala). Sin casco da un poco de tos (mareo). Logro «Bajo la ceniza».

## 2.82.0 — 2026-11-07 · Lancha con motor
- **Lancha con motor** (457: 60 colones en el taller): se pone en el agua como el bote, pero lleva un motor fuera de borda atrás (caja negra con tapa roja). Va a 13 (18 a fondo con Ctrl) contra 5,5 del bote a remo, deja espuma y suena el motor; gasta gasolina (el bidón se la llena con clic derecho) y sin gasolina toca remar. Logro «Por los canales en lancha».
- Al bajarse de la moto o la lancha (también cuando lo bota un hueco) se apaga el sonido del motor.

## 2.81.0 — 2026-11-07 · Bicicleta y moto
- `src/vehiculos2.js`: **bicicleta** (455: hierro, palo y cuero; o 18 colones en el taller) y **moto** (456: 70 colones en el taller; gasolina con el bidón, como el carro). Se ponen en el suelo, clic derecho para montarse, W acelera/pedalea, S frena, A/D gira (se inclinan al doblar), Espacio timbre o pito, Shift se baja.
  - Bici: hasta 10 en calle, 6 en el monte y 2,2 en arena, barro o grava; pedalear da hambre.
  - Moto: hasta 21 en calle y 9 en el monte; gasta gasolina.
  - En un **hueco** a buena velocidad lo pueden **botar** (2–3 de daño). Logros «Pedaleando por Tiquicia», «Motorizado», «De jupa contra el suelo» y «Mil bloques en dos ruedas».
- Los vehículos ahora pueden traer su propia forma de manejar (`kind.ride`); el carro sigue con `carRide`.

## 2.80.0 — 2026-11-07 · Bloques de 16 bits
- **Bloques de 16 bits**: los chunks (`world.js`) y las regiones del mallado (`mesher.js`) pasan a `Uint16Array`, y las tablas de bloques a 1024 (`MAX_BLOCK`). Nuevo rango de **bloques extendidos 600–1023** (`EXT_BLOCK`); los ítems siguen en 256–599. Para saber si un ID es bloque se usa `isBlockId(id)` (antes había `< 256` regados en `game`, `models`, `textures`, `ui` y `avatar`). Los mundos guardados no cambian: los cambios del jugador ya se guardaban como números sueltos.
- Primer bloque extendido: **baldosa roja** (600; 4 de 4 de arcilla). Probado de punta a punta: se pone, se dibuja, va en la mano y en el inventario, se guarda y vuelve al cargar el mundo.
- Las fiestas de fin de año pasan a los días 11 y 12 del ciclo (antes el día 1 de cada mundo nuevo arrancaba en fiesta).

## 2.79.0 — 2026-11-07 · Planos de casas que se construyen solas
- `src/planos.js`: **planos de casas ticas** (Ferretería El Clavo): **casita de adobe** (452, 15 colones: 40 adobe, 25 tejas, 25 tablas, 2 vidrios y una puerta), **casa de madera con corredor** (453, 25 colones: 56 de madera pintada celeste, 50 láminas de zinc, 60 tablas, 4 vidrios, 8 cercas y una puerta) y **rancho de playa** (454, 10 colones: 12 troncos, 25 tablas y 30 de hojas para el techo).
- Con el plano en la mano, clic derecho en el suelo: si están los materiales (en creativo no hacen falta), la casa **se levanta sola bloque por bloque** (40 por segundo, con polvo y sonido), creciendo hacia donde uno mira y con la puerta de frente. Piso, paredes con ventanas, techo a dos aguas y, en la de madera, el corredor con postes y baranda. Si hay muchos bloques en el camino avisa que no cabe; si faltan materiales dice cuáles. Logro «Casa en un ratito».
- Con esto queda completo el plan maestro 3.

## 2.78.0 — 2026-11-07 · Música por región y portal navideño
- **Música por región** (`musica.js`, `compose(noche, cueva, región)`; la región se revisa cada 3 s): **Caribe** con aire de calipso (más rápida, notas a contratiempo, bajo extra y adornos agudos como de steel pan); **Guanacaste** con el punto en 6/8 de siempre; **Valle Central** más pausada y con más terceras; **bosque nuboso y cordillera** con arpa tranquila también de día; **Pacífico** más espaciada. De noche y en las cuevas sigue el arpa en menor.
- **Portal navideño** (fiestas de fin de año): en la plaza del pueblo aparece un ranchito de madera con la Sagrada Familia, el buey, el burrito y la estrella que gira (adorno que no toca el mundo; busca un lugar libre junto a la plaza con el terreno cargado). Logro «Visité el portal».

## 2.77.0 — 2026-11-07 · Recetas que se aprenden y reputación por pueblo
- `src/saberes.js`: **recetas que se aprenden** (`aprende` en `recipes.js`; `findRecipe` recibe las que uno sabe, y el libro de recetas solo muestra esas):
  - **Pan casero de la abuela** (448: tortilla, huevo y miel → 2; cura 2 corazones). Se aprende al terminar la historia de la abuela, o se lo enseña la panadera o la tamalera.
  - **Agua de sapo** (449: agua dulce, jengibre y limón → 2; mucha agua y energía). Se la enseña la sodera, el caficultor o el frutero.
  - **Arroz con leche** (450, en el fogón: arroz, balde de leche y miel → 3, devuelve el balde; da calma).
  - **Libro de recetas viejo** (451): sale en los tesoros (35 %) y en la bóveda del sitio arqueológico; al leerlo enseña una receta que uno no sepa. Logros «Recetas de la abuela» y «Recetario completo».
- **Reputación por pueblo**: cada vez que la reputación sube o baja (encargos, historias, la soda, pegarle a un vecino…), se le anota al pueblo más cercano. En las tiendas de ese pueblo sale con estrellas (⭐ desde 2, ⭐⭐ desde 5, ⭐⭐⭐ desde 10, 😠 desde −3): con 5 o más le venden 10 % más barato y le compran 10 % más caro (con 10, 20 %); con −3 o menos, le cobran 25 % más. Aviso al pasar de nivel. Logro «Querido en el pueblo».

## 2.76.0 — 2026-11-07 · Mochila de cuero y gallinas bien comidas
- **Mochila de cuero** (ítem 447: cuero y un palo): clic derecho abre **27 espacios más** que se guardan con la partida (`meta.mochila`). Logro «Con la mochila al hombro».
- **Corral**: la gallina bien comida (con lo que le gusta, igual que para la cría) **pone huevos el triple de rápido** por 4 minutos, y muy de vez en cuando pone **un huevo de oro** (2 de oro). Logro «La gallina de los huevos de oro».

## 2.75.0 — 2026-11-07 · Repello de colores, azulejo, mosaico, rejas y brocha
- Construcción tica (bloques 249–254): **repello celeste, amarillo y verde menta** (repello blanco + madera pintada celeste, flor amarilla u hojas), **azulejo** blanco con florecitas azules (vidrio y repello), **mosaico de colores** (flores y madera pintada) y **reja de hierro forjado** con volutas, que deja ver a través (8 por 8 de hierro).
- **Brocha** (ítem 446: lana y dos palos, 96 usos): clic derecho sobre repello o adobe y cambia de color en orden (blanco → celeste → amarillo → verde → adobe). Logro «Pintor de brocha gorda».
- **Ojo**: ya casi no quedan IDs de bloque (son de 0 a 255): solo quedan libres el **214** y el **255**. Para seguir agregando bloques hay que pasar los chunks a 16 bits (cambio grande, con migración de guardado).

## 2.74.0 — 2026-11-07 · Sitio arqueológico y el acertijo de las esferas
- **Generador v11** (mundos nuevos desde esta versión): agrega el **sitio arqueológico** (`src/ruinas2.js`, tipo `sitio_arqueologico`, raro, en selva, bosque, llanura o bosque seco). Tiene cuatro montículos circulares de piedra con su escalinata, una calzada empedrada, petroglifos tallados (espirales y figuritas), una placa y un montículo central con una **bóveda de piedra cerrada**.
- **Acertijo**: alrededor del montículo central hay **4 pedestales**; por el sitio hay **5 esferas de piedra** regadas entre el monte (bloque 245, se recogen con pico). Al poner una esfera sobre un pedestal avisa «2 de 4»; con las cuatro, tiembla y **se abre la puerta de piedra**, y adentro hay un cofre con oro, jade, colones, un diamante y un mapa del tesoro. Los pedestales y la puerta no se pueden romper. Logros «Arqueólogo aficionado» y «El secreto de las esferas».
- Bloques nuevos: esfera de piedra (245), pedestal antiguo (246), petroglifo (247) y puerta de piedra (248), con su pixel art.

## 2.73.0 — 2026-11-07 · Temporal, carretera, horario y misa
- `src/vida2.js`: **temporal del Caribe**. Desde el día 4, cada 9–15 días puede entrar un temporal de 2 días: en el Caribe y la Zona Norte llueve sin parar (a veces tormenta), los **ríos crecidos arrastran** al que nade en agua dulce y salen más zancudos. Logro «Sobreviví al temporal».
- **Sorpresas en la carretera** (andando por asfalto, cada 5–10 min, 16–30 bloques adelante): una **vaca en media calle** (45 s), una **presa** de 4 carros parados «porque hubo un choque y todos frenan a ver» (60 s) o un **bloqueo de calle ficticio**: 5 vecinos con globitos («¡Arreglen los huecos!», «¡Queremos el puente que nos prometieron!»…). Logros por cada una.
- **Horario de los pueblos**: de noche las tiendas cierran («Ya cerramos, mi amor. Abrimos a las 7»); la cantina, el hotel, la bomba, el lotero, la doctora, la policía, los bomberos y el faro siguen. Logro «Llegué tarde a la pulpe».
- **Misa del domingo** (cada 7 días, en la mañana): aviso, y las campanas llaman cada 20 s; estar cerca de la iglesia da el logro «A misa de 10».

## 2.72.0 — 2026-11-07 · Muebles: silla, hamaca, tele, radio y refri
- `src/muebles.js`: muebles nuevos (bloques 237–244, con recetas y texturas propias):
  - **Silla** (2: tablas y palos): clic derecho para **sentarse** (la cámara baja; el hambre casi no baja y cada 20 s cura medio corazón y a veces quita una noche de cansancio). Cualquier tecla de movimiento lo levanta.
  - **Mesa de comedor** (tablas y palos), con mantel de puntitos.
  - **Hamaca** (palos y lana): de día, siesta; de noche, se duerme como en cama. Logro «Hamaqueándome».
  - **Tele vieja** (tablas, vidrio y hierro): se prende y se apaga (la pantalla brilla); al prenderla sale un canal ficticio («Canal 7 y medio», la telenovela «Pasión en el cafetal», noticias de huecos…).
  - **Radio** (tablas, hierro y palo): encendida y con uno cerca, suena **marimba** una pieza tras otra, con notitas de colores. «Radio Marimba (ficticia)».
  - **Refri** (hierro y vidrio): guarda 27 cosas como un cofre (bloque con `station: 'chest'` y datos de tipo `refri`).
- Shift + clic derecho sobre un mueble pone bloques encima como siempre.

## 2.71.0 — 2026-11-07 · Sombras honderas y con escudo
- `src/sombras2.js`: dos Sombras nuevas que salen desde el **día 3** (16 % y 14 % de las Sombras), armadas desde `SOMBRA` en `entities.js` (`variantesSombra`):
  - **Sombra hondera**: honda en la mano y saco de piedras; se queda a 5–13 bloques (si uno se acerca, se aleja), y cada 2,4–3,4 s tira una **piedra en parábola** apuntando adelante de donde va el jugador (3 de daño; la armadura ayuda).
  - **Sombra con escudo**: escudo de tablas con un cráneo pintado; **ataja los golpes de frente** (suena a madera y avisa), salvo los golpes cargados; hay que rodearla. A veces **esquiva** de un brinco hacia un lado. 22 de vida, suelta hierro a veces. Logro «Rompe escudos».
- `game.golpeCargado` dice si el golpe en curso es cargado (se anota antes del daño). El conteo de Sombras incluye las nuevas.

## 2.70.0 — 2026-11-07 · Polvo, huellas, gotas y hojas
- `src/pulido.js` (cada cuadro): **polvo al correr** del color del suelo (sale de la textura del bloque que pisa); **huellas** en la arena, la grava, la tierra y la nieve (marquitas oscuras que duran 6 s, alternando pie izquierdo y derecho); **gotas** que caen del cuerpo durante 3 s al salir del agua; y **hojas que caen** de los árboles cercanos (verdes, o secas y amarillas en verano; con lluvia el viento las mueve más).

## 2.69.0 — 2026-11-07 · Bestiario y calidad de vida
- `src/bestiario.js`: **bestiario** (tecla **K**, o la tercera hoja de la libreta). Cada criatura que uno ve a menos de 14 bloques queda anotada (con aviso). Muestra un **retrato sacado del modelo 3D** de cada una (se dibuja una vez y queda guardado), si es tranquila, peligrosa, leyenda o jefe, sus corazones y daño, el día en que la vio y una descripción tica. Las que faltan salen como «???». Logros «Naturalista» (10) y «Biólogo de campo» (30).
- Calidad de vida: aviso chiquito **«💾 Guardado»** abajo a la derecha en cada guardado automático, y ajuste **«Correr con un toque de Ctrl»** (sin mantenerlo).

## 2.68.0 — 2026-11-07 · Fiestas: faroles, mascarada y fin de año
- `src/fiestas2.js`: **calendario de fiestas** (ciclo de 12 días de juego, con aviso en la mañana):
  - **Desfile de faroles** (día 4, de noche): hasta 8 vecinos del pueblo dan vueltas a la plaza con un farolito encendido en la mano (`m.data.ruta` en `entities.js`). Logro «El desfile de faroles».
  - **Día de la mascarada** (día 7): un tercio de los vecinos anda con **cabezona** (cabeza gigante pintada de colores, con ojos grandes, nariz y boca). Con la máscara de mascarada puesta en el pueblo: logro «Cabezona en la fiesta».
  - **Fiestas de fin de año** (días 12 y 1): una sarta de 96 **bombillos de colores** que parpadean alrededor de la plaza, **bombetas** de noche y **tamales** a la venta en la soda, la panadería y la pulpería. Logro «Fiestas de fin de año».

## 2.67.0 — 2026-11-07 · Precios del día, soda propia y banco
- `src/economia.js`: **precios del día**. Lo que compran las tiendas (cosechas, pescado, minerales…) vale entre 60 % y 160 % según el día; en la tienda sale ▲ si se paga bien y ▼ si se paga mal. Cada mañana, si alguna cosecha se paga muy bien, avisa la **feria del agricultor** («hoy el café se paga 150 %»).
- **Soda propia**: un **rótulo de soda** (bloque 236: tabla + madera rosada + tabla). Con el rótulo cerca, de día llegan clientes (hasta 2 a la vez) que piden algo con un globito (tortillas, carne asada, café chorreado, empanada, tamal, sopa negra, casado u olla de carne); clic derecho con lo que pidió para servirle: paga de 3 a 10 colones más propina a veces. Si se tarda 75 s se va bravo (−1 de reputación). Logros «Mi propia soda» y «Sodero del año» (15 clientes).
- **Banco**: la cajera abre una cuenta de ahorros. La primera vez del día toca hacer **la fila** («usted es el número 281, vamos por el 8»); después, con colones en la mano los deposita y con la mano vacía los retira. Paga 3 % por día (hasta 30 colones por día). Logros «La fila del banco», «Cuenta de ahorros» y por llegar a 500.

## 2.66.0 — 2026-11-07 · Tesoros, naufragios y buceo
- `src/tesoros.js`: **mapas del tesoro** (444). Se consiguen en la pulpería (25 colones), pescando («¡una botella con un mapa adentro!», 2 %) o dentro de otros tesoros. Clic derecho: el mapa marca una **❌** a 120–350 bloques (en tierra, o 30 % de las veces un **naufragio** en el fondo del mar poco hondo), con una pista («camine hacia el noroeste, como a 200 pasos, en la selva…»). La ❌ sale en la brújula y en el mapa (M). Al cavar en la X sale un **cofre** con colones, oro, a veces diamantes, jade, perlas y hasta otro mapa; el del naufragio trae una careta. Logros: «Cazador de tesoros», «¡Encontré el tesoro!», «El cofre del naufragio» y «Pirata del Pacífico» (5 tesoros).
- **Isla del Coco**: al descubrirla, un pirata viejo le deja el mapa del **tesoro de Lima** (cofre mucho más rico: machete del Cadejos, plumas de quetzal…; logro «El tesoro de Lima»).
- **Careta de buceo** (445: cuero + vidrio + cuero, o 8 colones en la pulpería): 5 min en que el aire dura el triple y se ve mucho más lejos bajo el agua.
- **Perlas** (369): 6 % al romper coral y 2 % en la arena del fondo del mar; la pulpería las compra a 12 colones.

## 2.65.0 — 2026-11-07 · Zorro pelón, ardilla, guatusa, coyotes, manatí y baula
- `src/fauna2.js`: seis animales nuevos con modelo, conducta y aparición propia (`fauna2Spawn`, desde `trySpawn`):
  - **Zorro pelón** (de noche en bosque, selva, llanura o bosque seco): la primera vez que lo golpean **se hace el muerto** 6 s (se acuesta de lado) y después sale corriendo. Logro «Se hizo el muerto».
  - **Ardilla** (de día en bosque, nuboso o llanura): rápida y asustadiza; con maíz o semillas de maíz en la mano se acerca y come de la mano (logro).
  - **Guatusa** (de día en selva o bosque): asustadiza; de vez en cuando **cava y esconde una semilla** (maíz, frijol o café) que uno puede recoger.
  - **Coyotes** (manada de 2–3, de noche en bosque seco, llanura o Guanacaste): aúllan al verlo y atacan (3 de daño); **le tienen miedo al fuego** (antorcha o fogata en la mano) y de día se van.
  - **Manatí** (agua de manglar o selva): nada despacio, se deja acariciar (logro «Amigo del manatí») y no se debe lastimar.
  - **Tortuga baula** (de noche en la playa): sale del mar, camina a la arena seca, **cava y deja su nido** con sonido de arena, y vuelve al mar (logro «Vi desovar a la baula»).
- Sonidos reales nuevos (Freesound CC0): coyotes, ardilla, siseo, chillidos de guatusa y arena; con subtítulos. `swim` de `mar.js` ahora se exporta.

## 2.64.0 — 2026-11-07 · Heridas, cansancio y botiquín
- `src/supervivencia3.js`: **heridas**. Un golpe de 4 o más de una criatura puede dejarlo **sangrando** (15 % en tranquilo, 30 % en normal, 50 % en difícil; 90 s): pierde 1 de vida cada 4 s con gotas rojas y corre un poco más lento. Si la dificultad no deja morir de hambre, el sangrado tampoco mata.
- **Cansancio**: cada día que pasa sin dormir en cama suma una noche en vela. Con 2 o más: efecto «Cansado» (12 % más lento) y la imagen se ve borrosa (más con cada noche); con 3 o más se le cierran los ojos de vez en cuando. El café (energía) lo aguanta mientras dura; dormir en cama lo quita; la siesta resta una noche.
- **Botiquín** (clic derecho para usar): **venda** 440 (3 de una lana; para el sangrado y cura 1 corazón), **alcohol** 441 (guaro + frasco; para el sangrado y baja el veneno), **suero oral** 442 (agua llena y quita panza y mareo) y **botiquín** 443 (venda + alcohol + suero: quita todo y cura 5 corazones; logro «Primeros auxilios»). La Farmacia La Salud los vende.
- Consejo de inicio nuevo sobre el sangrado.

## 2.63.0 — 2026-11-07 · Historias del pueblo, globitos y apagones
- `src/misiones.js`: **historias encadenadas** con los vecinos (una a la vez; al hablar con un vecino común sale una 35 % de las veces, cada historia se puede hacer 2 veces, 4 min de descanso entre una y otra). La historia activa sale arriba (`#mision-hud`) y con ❗ en la brújula y el mapa:
  - **El perro perdido**: el Canelo anda a 60–100 bloques; al acercarse lo sigue; llevarlo con la dueña (25 colones).
  - **La vaca que se escapó**: la Pinta, igual, y paga 20 colones + balde de leche.
  - **La abuela y la leña**: 12 troncos (de cualquier árbol) → 6 mazorcas → comida (20 colones + 2 sopas negras).
  - **El novio que no llega**: Chepe está lejos y le da vergüenza; con una flor roja se anima, lo sigue y hay boda con campanas (30 colones).
  - Cada una da logro, +15 de experiencia y +2 de reputación; las cuatro, «Cuentacuentos del pueblo». Si se recarga el mundo en medio de «llevarlo», el animal o Chepe vuelve a aparecer al lado. Los que siguen al jugador usan `m.data.sigue` (en `entities.js`, antes del cerebro).
- **Vecinos que conversan**: en el pueblo, de día, dos vecinos que estén cerca se miran y se dicen algo con **globitos** sobre la cabeza (12 conversaciones ticas).
- **Apagones**: de noche en el pueblo, cada 20–40 min se apagan las lámparas y faroles cercanos de 45 a 90 s y después vuelve la luz («la Compañía de Luz (ficticia) dice que ya viene»). Logro «Se fue la luz».
- Build: las criaturas van en su propio archivo (`criaturas`), para que ningún archivo del juego pase el límite de tamaño.

## 2.62.0 — 2026-11-07 · Honda, cerbatana, jabalina y mini-jefes
- `src/armas2.js`: armas de largo alcance con su propio proyectil (`Proyectil`, en `g.proyectiles`). **Honda** (432: palos y cuero): se carga como el arco, tira piedra labrada (1,5–5 de daño) y empuja. **Cerbatana** (433: 3 cañas): dispara de una un **dardo envenenado** (434: rana dardo + palo = 6) que deja la criatura con veneno 8 s (1 de daño por segundo, chispas verdes). **Jabalina** (435: hierro y palos = 2): se carga y se tira (4–13 de daño); se clava y se recoge (si pega, cae al lado). La lanza de hierro 402 sigue siendo de cuerpo a cuerpo.
- **Mini-jefes** (con barra de jefe, uno a la vez, cada 12–20 min de juego según dónde ande): **el Jaguar viejo** (selva, bosque o manglar de noche; 1,6× de grande, 90 de vida, ruge y da miedo, salta cada 2,4 s, 9 de daño; suelta su colmillo 436), **el Cocodrilo gigante del Tárcoles** (agua en tierra baja; 2,1×, 130 de vida, 10 de daño y «la vuelta de la muerte» que lo hunde si está en el agua; diente 437) y **la Terciopelo reina** (selva o bosque nuboso; 2,6×, 55 de vida, escupe veneno desde lejos con mareo, a media vida llama a 3 crías; veneno 438, que da 12 dardos). Logros por cada uno y «Rey del monte» por los tres; +40 de experiencia.
- **Machete de doble filo** (439: machete + colmillo + diente): 8 de daño, 700 de durabilidad.
- Logros «Cazador silencioso» (cerbatana) y «David con honda».

## 2.61.0 — 2026-11-07 · Habilidades y libreta de logros
- `src/habilidades.js`: 7 habilidades que suben con el uso (0 a 10; puntos guardados en `meta.skills`): **minería** (picar piedra y minerales: pica 4 %/nivel más rápido, 3 %/nivel de veta doble; nivel 5, carbón de la piedra; nivel 10, el pico se gasta la mitad), **tala** (troncos: 5 %/nivel más rápido, 4 %/nivel de tronco doble; 5, manzanas y palos; 10, hacha a la mitad), **pesca** (pican 5 %/nivel antes, 3 %/nivel de pescado doble; 5, más tiempo para recoger; 10, a veces oro o diamante), **cocina** (comer comida buena y asar en la fogata: la comida llena 5 %/nivel más; 5, lo crudo no cae mal; 10, comer cura 2 corazones), **combate** (vencer enemigos, más con jefes y leyendas: 3 %/nivel más daño; 5, medio corazón por victoria; 10, 10 % menos daño recibido), **agricultura** (cosechar: 6 %/nivel de cosecha doble; 5, semilla extra; 10, a veces guano) y **exploración** (descubrir lugares según la rareza: hambre y sed 3 %/nivel más lentas; 5, el doble de experiencia por lugar; 10, corre 8 % más rápido). Aviso, sonido y chispas al subir; logros por nivel 5, 10 y «Todero».
- **Libreta** (`src/libreta.js`): **L** abre los logros (progreso total, por tema con nombre, los ganados en dorado y los que faltan en gris como meta) y **H** las habilidades (barra, bono actual, puntos que faltan y lo que se desbloquea en el 5 y el 10). L y H cambian de hoja; Esc cierra.
- `src/logros.js` (íconos por tema, antes en `game.js`) y `src/logros-lista.js`, que arma `node tools/lista-logros.mjs` leyendo todos los `achieve('clave', 'Texto')` del código (149 + jefes + habilidades = 173). Cada logro ganado guarda su texto en `meta.achTexts`.
- Dos consejos de inicio nuevos (H/L y la sed) y dos de la pantalla de carga.
- Íconos: los 158 ítems ya usan el pixel art nuevo; el build deja los PNG como archivos aparte (`assetsInlineLimit` en `vite.config.js`), sin la advertencia de tamaño.

## 2.60.0 — 2026-11-07 · Sed, fogata, hierbas y temblores
- `src/supervivencia2.js`: **sed**. Barra de agua (gotas, guardada en el jugador como `water`) que baja más rápido corriendo, con calor (bosque seco, playa, desierto, Guanacaste a pleno sol) y en el inframundo. Sin agua: deshidratación (1 de vida cada 5 s; en tranquilo y normal no mata si la dificultad no deja morir de hambre). Insolación al mediodía en lo seco, sin sombrero y con poca agua (mareo 8 s). Se toma agua con clic derecho al río o al lago con la mano vacía (3; 15 % de que caiga mal, salvo el río Celeste), de las bebidas y frutas (tabla `AGUA`: pipa 8, agua dulce 6, café 3, leche 5, el guaro quita 2…) y de la **cantimplora** (426/427: cuero y palos; se llena en el agua, 4 tragos de 6).
- **Fogata** (bloque 235, palos y tronco): da luz, calienta en el páramo, espanta y aleja los zancudos (radio 6), echa humo y chispas con sonido de fuego, y con carne o pescado crudo en la mano, clic derecho la asa (logro «Asado a la leña»). Shift + clic derecho pone bloques encima como siempre.
- **Hierbas del monte** (8 % al cortar pasto alto o helecho, según el bioma): sábila 428 (cura 4 y quita quemaduras), manzanilla 429 (quita panza y mareo), hierbabuena 430 (calma 3 min y quita el miedo), jengibre 431 (calor 1 min). Logro «Remedios de la abuela».
- **Temblores**: cada 15–40 min tiembla (magnitud 4,3–6,9): la pantalla se sacude según la magnitud, retumba, en las cuevas cae polvo y desde 5,5 alguna piedra; al final un vecino comenta si se está en el pueblo. Logro «Sobreviví al temblor».

## 2.59.0 — 2026-11-07 · Íconos redibujables en pixel art
- `docs/PROMPT_ITEMS.md` (lo arma `node tools/lista-items.mjs`): prompt único para redibujar en pixel art los 158 ítems, en 3 hojas de 8×8 celdas de 32×32, con reglas de estilo, la lista en orden (clave y qué dibujar, con pistas para lo tico) y la tabla de archivo nuevo / dibujo de hoy (`public/sprites/…` o `src/textures.js:línea`). También escribe `assets-src/items/orden.json`.
- `tools/cortar-hojas.mjs`: corta `assets-src/items/hoja-N.png` en `src/assets/items/<clave>.png` (escala sin suavizar si la hoja viene más grande; salta celdas vacías). Usa ffmpeg.
- `textures.js`: `import.meta.glob('./assets/items/*.png')`; si hay imagen para la clave de un ítem, manda sobre el sprite Kenney y el dibujo por código (pixel art nítido, sin suavizar). Si el servidor de desarrollo ya corría cuando se crearon los archivos, reiniciarlo.

## 2.58.0 — 2026-11-07 · Mejenga, comida variada, noches bravas, brújula y brillo
- `src/mejenga.js`: bola (mob `bola` con física propia: gravedad, rebote, roce, choque con paredes, giro). Aparece en la cancha de la plaza del pueblo cercano (`tickMejenga`); clic le pega hacia donde se mira, caminando encima se lleva pegada. Al primer toque se arma la mejenga con hasta 3 vecinos (no tenderos) que corren a la bola y patean al marco del este; goles por la boca de cada marco, marcador en el letrero, a 3 goles (ganar: 10 colones y logro `mejenga`). Ítem 425 «Bola de fútbol» (pulpería, 6): se pone en el suelo y se levanta con clic derecho.
- Supervivencia: comida variada (si de las últimas 6 comidas 2 o 3+ fueron lo mismo, llena 70 % / 40 %, con aviso); la carne y el pescado crudos dan «dolor de panza» 30 % de las veces (hambre ×2 y 85 % de velocidad, 40 s; lo curan las comidas que curan). Las noches se ponen más bravas: +1 Sombra cada 5 días (hasta +4) y en luna llena (cada 7 días) +2 Sombras y leyendas el doble de seguido, con aviso al anochecer.
- Calidad de vida: brújula arriba (rumbos y los lugares de uno con su distancia: cama, bolso, lote y el punto marcado con **B**, que también sale en el mapa); ajuste de **Brillo** en Ajustes (filtro de la imagen); lo que se acaba en la mano se rellena solo con el mismo ítem de la mochila.
- Arreglo: en `mejenga.js` la distancia a la plaza pisaba el largo de la cancha (`d`).

## 2.57.0 — 2026-11-07 · El Viejo del Monte y el Padre sin Cabeza que se ve
- `leyendas.js` `viejo_monte`: guardián del bosque (2,6 de alto, 130 de vida, jefe): tronco con corteza, hombros de musgo, cabeza de tocón con ojos verdes que brillan, barba de musgo y bejucos, cuernos de ramas, brazos de rama y piernas de raíz. Golpea fuerte (con aviso para parry) y cada 7 s enreda con bejucos a media distancia (efecto `enredado`: 30 % de velocidad por 3 s). Sale cuando se cazan 5 animales del monte en 10 minutos (`meta.caza`; aviso a los 3). Suelta el «Corazón del monte» (ítem 424: vida llena + 10 min de calma).
- Padre sin Cabeza: brillo tenue de fantasma (se ve en la oscuridad), rosario blanco con su cruz y humo rojizo que le sale del cuello.

## 2.56.0 — 2026-11-07 · Gatos del pueblo y la Segua con traje típico
- `finca.js` `gato`: en los pueblos (`envPueblo` > 0,3, hasta 3): atigrado naranja, negro o blanco con manchas, ojos verdes que brillan, bigotes; se sienta a ratos y huye si uno llega corriendo. Con pescado (pargo, corvina, guapote, dorado o pescado frito) lo adopta: lo sigue, ronronea cerca y le bufa al Duende (`data.asustado`: no roba y se aleja). Clic derecho: que se quede. Sonidos reales (Freesound CC0): `gato` (110011, 333916, 412017), `gato.ronroneo` (260881), `gato.bufido` (343927).
- La Segua: enagua del traje típico con cintas de colores, cara con ojos, pestañas, chapas y labios rojos, flor roja en el pelo; transformada: dientes de caballo, fosas de la nariz, cascos que asoman y humo que le sale del hocico.

## 2.55.0 — 2026-11-07 · El Cadejos con cascos de cabra, vampiros y ropa tica
- Cadejos (`leyendas.js`): cascos de cabra en las patas, crin erizada en el lomo, colmillos más grandes y la lengua afuera, brasas rojas que se le desprenden (se ve en lo oscuro) y el sonido de las cadenas al andar.
- Murciélago vampiro (`entities.js` `VAMPIRO`): en las cuevas hondas (y < 40), 40 % de las bandadas en supervivencia (máx. 3): ojos rojos, colmillos, orejas grandes; vuela bajito hacia uno, muerde 1, se cura y se aleja un rato.
- Ropa de los vecinos (`pueblo.js`): lisa, a cuadros, a rayas, la camiseta de la Sele (roja con franja azul y blanca y número), la rojinegra o la morada de las aficiones (sin escudos ni marcas); mangas del mismo color; algunos con gorra de visera.

## 2.54.0 — 2026-11-07 · Caras de los vecinos, Sombras nuevas y tres leyendas más
- **Arreglo de colores de todas las criaturas** (`models.tintModel`): la luz pisaba el color propio de cada material, así que ojos, narices, picos, manchas y botas salían todos del mismo gris claro. Ahora guarda el color base (`userData.baseColor`) y la luz lo oscurece encima.
- Vecinos (`pueblo.js` `cara()`): cara en 3D distinta por persona: ojos con blanco, iris de color (café, verde o celeste raro) y pupila con brillo, cejas del color del pelo con expresión, nariz y orejas con volumen, boca con labios (y sonrisa), y según quién: bigote, barba, chapas, aretes, pelo largo o anteojos. Parpadean.
- Sombras: cara de calavera pálida que brilla en la capucha, dos brasas por ojos, manos de hueso con garras, brazos estirados hacia uno al perseguir, brasas que caen de la capa, tamaños variados y la «Sombra del monte» con cornamenta (22 %).
- Leyendas nuevas (`leyendas.js`): **La Carreta sin Bueyes** (espanto pintado a la tica que pasa sola por las calles de noche arrastrando cadenas; tres pasadas en línea recta, atropella con 4 y tira lejos; los golpes no le hacen nada), **El Duende** (chiquitico de gorro rojo en el bosque: se arrima, roba un ítem que no esté en la mano y sale corriendo riéndose; pegarle hace que lo suelte; al amanecer se va con el botín) y **La Mona** (bruja de Guanacaste hecha mono grande, cerca de pueblos y en el bosque seco: se agacha, brinca alto y cae encima; parry la aturde; suelta colones y mangos). Logros nuevos.

## 2.53.0 — 2026-11-07 · Supervivencia de verdad (y la Llorona por fin se ve)
- `src/supervivencia.js`: dificultad por mundo (`meta.dificultad`, se escoge al crear: Tranquilo / Normal / Difícil; los mundos viejos quedan en Normal). Multiplica el daño de las criaturas, el hambre, el costo de curarse, el tope de Sombras, si el hambre mata y con cuánta comida se reaparece (20 / 12 / 8).
- Al morir (`dropBolso`): en Normal lo del inventario (menos lo de la mano) queda en uno o dos cofres donde se cayó; en Difícil también la armadura; en Tranquilo no se pierde nada. `meta.bolso` + 🎒 en el mapa; `tickBolso` lo da por recuperado al vaciarlo (logro `bolso`). La pantalla de muerte dice qué pasó (`deathTip`).
- Hambre: curarse cuesta 4 / 10 / 16 de hambre por punto (antes 6); en Difícil el hambre mata, en las otras deja en 1 con aviso «¡Tiene mucha hambre!».
- Frío (`tickFrio`): en el páramo o sobre la altura 102, sin pechera de cuero ni capa de la Arpía ni fuego/luz a 3 bloques ni aguas termales: escalofrío y más hambre (doble de noche); de noche, tras un minuto, quita vida.
- Primeros minutos: bolsito de inicio (4 tortillas y 6 antorchas) y seis consejos que van saliendo (`tickConsejos`).
- `src/zancudos.js`: zancudos al atardecer/noche en manglar, selva, cerca del agua o con lluvia (2–4, pican 1, zumbido real Freesound 662970). Repelente de limón (ítem 423, limón + guaro → 2, o en la farmacia): 5 min sin zancudos.
- **Arreglo de la Llorona**: su `brain` usaba `b = m.body` y leía `b.x/b.y` (no existen; la posición está en `body.pos`), el giro quedaba en NaN y el modelo no se dibujaba (solo se veía la barra y se oía el llanto), además nunca se movía. Ahora brilla pálida de noche (`userData.glow`, no se oscurece), se dibuja después del agua, deja neblina y se acerca desde 34 bloques. Protección en `Mob.update`: un giro NaN se corrige solo.
- Ruta: la pista de la armadura de hierro dice «más de la mitad».

## 2.52.0 — 2026-11-07 · Páramo sin nieve, luces con palanca, subtítulos y rana calzonuda
- **Generador v10** (mundos nuevos, `worldgen2.column`): en Costa Rica no neva. El bioma `snowy` pasa a `paramo` sobre altura 84 y a `nuboso`/`forest` más abajo; `mountains` sobre 100 pasa a `paramo`; el mar ya no se congela. En una muestra de 8×8 km: nieve 12 % → 0 %, páramo ×3.
- Luces que se apagan: bloques 233 `lamp_off` y 234 `farol_off` (sin brillo, texturas apagadas). `lamp` y `farol` ganan `toggleTo`: clic derecho los apaga y los prende, y la palanca los enciende (ON) o los apaga (OFF) a 5 bloques junto con puertas, portones y cortinas.
- Accesibilidad: opción «Subtítulos de sonidos» en Ajustes (`settings.subtitulos`). `audio.onCaption` avisa cada sonido del mundo con posición; `ui.caption` muestra qué sonó con ◀/▶ según el lado, sin repetir, hasta 6 a la vez y se van a los 2,5 s (tabla `CAPTIONS` en `ui.js`).
- `fauna.js`: `calzonuda` (rana de ojos rojos, costados azules y patas anaranjadas; de noche en selva, manglar y nuboso; brinca).

## 2.51.0 — 2026-11-07 · Comida tica y Las Pailas
- Ítems 416–422: arroz con leche, sopa negra (quita el veneno), gallos de picadillo, plátano con queso, tres leches, café con leche (energía) y arroz. Recetas de fogón (`recipes.js`), dibujos en `textures.js`; la pulpería vende arroz y la soda vende sopa negra, gallos, arroz con leche y café con leche.
- `parques3.js` `buildRinconParque` (generador v9, `minV: 9`, bosque seco/llanura): catarata La Cangreja (farallón de basalto, caída y poza de `agua_celeste`), volcancito de lodo con zona `lodo`, fumarolas con zona `fumarola`, sendero en anillo, guanacastes, puesto de guardaparques, pizote y cara blanca. Cuenta para `parques`.

## 2.50.0 — 2026-11-07 · Tanda grande: mano, charcos, La Amistad, tití, tepezcuintle y logros con ícono
- `avatar.js`: lo que se tiene en la mano se ve en tercera persona (ítems como lámina con su dibujo `itemCanvas`, bloques como cubito con su textura `tileCanvas`), se rearma al cambiar de ítem.
- `src/charcos.js`: con lluvia (intensidad > 0,35) los `fondo_hueco` cercanos se llenan de agua de abajo hacia arriba solo si la celda está encerrada (no se riega a la calle); tras ~40 s sin lluvia se secan desde arriba. Logro `charco`.
- `parques3.js` `buildAmistadParque` (generador v9, `minV: 9`, `high(12, 8, 84)`, legendaria): robledal con robles musgosos, bromelias y bejucos, mojón fronterizo con banderas de Costa Rica y Panamá, estación de guardaparques, dantas y quetzales. Cuenta para `parques`.
- `fauna.js`: `titi` (tropa de 4–6 en selva/bosque cálido de día, brincan, huyen si llegás corriendo) y `tepezcuintle` (de noche, huye; cazarlo cobra una multa de hasta 10 colones y logro `multa`). Sonidos reales (Freesound CC0): `titi` (479823) y `tepezcuintle` (430055).
- Logros con ícono: `achIcon(key)` elige un emoji por tema (⚔️ ⭐ 🌋 ☁️ 🪢 🌿 🚗 🏠 🍽️ 🐾 🎉 🗣️ o 🏆), el aviso lleva el número de logro y el ícono entra girando.

## 2.49.0 — 2026-11-07 · Portones, cortinas, macetas y palancas
- Bloques 222–232 (`blocks.js`, formas en dieciseisavos): `porton`/`porton_z` (cerrado, sólido) ↔ `*_open` (abierto, no sólido), `cortina`/`cortina_z` ↔ `*_open` (recogida a los lados), `maceta` (tres cajas que toman su pedazo de `maceta_side`: barro, tallo y flores) y `palanca` ↔ `palanca_on`. Campo nuevo `toggleTo` (clic derecho → `game.toggleBlock`), `lever`.
- Al poner portón o cortina el panel queda de frente a quien lo pone (`*_z` si mira en x). El portón no se cierra encima de nadie.
- La palanca abre o cierra a la vez puertas, portones y cortinas a 5 bloques (logro `palanca`).
- Texturas nuevas en `pixelart.js` (portón de reglas con travesaño, cortina floreada roja, maceta, palanca). Recetas y ferretería (portón, palanca).

## 2.48.0 — 2026-11-07 · Cámara en tercera persona
- F5 o P: primera persona → de espaldas (4,2 bloques) → de frente (3,2, sin mira). La cámara retrocede por la línea de la mirada y solo la paran bloques sólidos de verdad (no hojas, plantas, vidrio ni cables); al acercarse es instantáneo y al alejarse suave. La mano y el escudo en primer plano no se dibujan en tercera persona.
- `src/avatar.js`: el personaje del vestidor puesto en el mundo (armado con `Vestidor.prototype` sobre un grupo propio, escala 0,9, materiales pasados a `MeshBasicMaterial` porque el mundo no tiene luces): armadura que se rearma al cambiar, caminar con brazos y piernas, golpe con el brazo derecho, escudo arriba al bloquear, agachado, sentado al montar, brazos arriba en la tirolesa, cabeza que sigue la mirada y tinte de luz como las criaturas.

## 2.47.0 — 2026-11-07 · Tirolesa y canopy
- `src/tirolesa.js`: con la polea (ítem 415) clic derecho a un cable → `startZip` sigue la línea de `cable`/`cable_z` (pasos de ±1 en altura, hasta 400 bloques) hacia el lado que baja o hacia donde se mira; `zipUpdate` cuelga al jugador 2 bloques bajo el cable, acelera con la pendiente (máx. 17), Espacio frena, Shift suelta; al final suelta con impulso y `pluma` 3 s. Emisores `loop.tirolesa` (grabación real 196403) y `loop.wind`. Logros `tirolesa`, `tirolesa_rapida`, `canopy_largo`.
- Los cables que pone el jugador quedan a lo largo de hacia donde mira (`cable_z` si mira en z): así se arman tirolesas propias. La ferretería vende poleas (8); receta con hierro y palo.
- `src/canopy.js` (generador v9, `minV: 9`): torre-árbol con escalera de caracol y plataforma a 18, línea de 43 cables que baja hasta ~6 sobre el terreno (siempre ≥ 4), plataforma de llegada con sacos y escalera, guía, rótulo y cofres con poleas. `R: 52` (el cable llega a 46 bloques del centro).

## 2.46.0 — 2026-11-07 · El bus del pueblo, la feria y el cementerio
- `src/bus.js`: mob `bus` («Transportes La Ilusión», ficticio) con carrocería, ventanas, rótulo encendido, chofer, asientos, llantas y puerta de dos hojas animada; `tickBus` lo trae a la parada de cualquier pueblo de cuadras (v6+) cuando uno está a < 45 bloques (cada 60–100 s). Fases `llega` (frena con `bus.freno` y se inclina) → `para` (puerta abierta, `bus.puerta`, se ladea) → `cierra` → `sale` (pita y acelera). Sigue la altura de la calle (`surfaceAt`, inclinación limitada a ±0,1).
- Viaje: clic derecho escoge entre los 4 pueblos más cercanos (precio 1 colón por cada 400 m), Shift + clic paga y se sube: `busRide` lo sienta adentro (se esconde la carrocería y aparece el interior con ventanas abiertas), arranca con uno a bordo; a 26 bloques la pantalla va a negro, el bus pasa al pueblo destino y espera (`hold`) a que cargue, entra a la parada, abre y lo baja en la acera. Pasa el tiempo del viaje, chistes de bus, logros `bus` y `bus5`.
- **Generador v9**: tipos `feria_pueblo` (al sur) y `cementerio_pueblo` (al norte) anclados a cada pueblo de cuadras con `place` sobre la celda de pueblos (reusan `buildFeria`/`buildCementerio`; el cementerio trae su zona del llanto). Van primero en `TYPES` para que los demás los esquiven.
- Sonidos reales nuevos (Freesound CC0): `bus.freno` (801435, 422442) y `bus.puerta` (380320).

## 2.45.0 — 2026-11-07 · Arreglos (sonido, cactus, agua) y lugares más cerca
- **Sonido al salir al menú:** `game.stop()` llama `audio.silenceWorld()` (apaga emisores, baja `amb.out` y la lluvia a 0, `worldMuted`) y desconecta la música programada (`this.music = null`); `audio.ambience()` vuelve a subir el ambiente al entrar a un mundo.
- **Cactus con rendijas:** ahora es `render: 'shape'` con caja `[1,0,1,15,16,15]` y texturas sin bordes transparentes (las caras se tocan en las esquinas).
- **Rendijas en el agua corriendo:** la ola del shader (`aAnim` 3) solo se aplica a esquinas con altura < 1; antes una celda con agua encima (sin ola) y su vecina (con ola) no coincidían y se abría una ranura de hasta 0,09.
- **Generador v8** (mundos nuevos): tipos grandes sin `place` con `cell` ≥ 1000 usan `cell × 0.78` (en la misma semilla: 36 → 62 lugares grandes a menos de 1 km, ~225 bloques entre ellos).
- **Rumores:** `scanStep` revisa un tipo por vez en ~900 bloques (`game.nearSeen`); los vecinos (30 %) cuentan del lugar sin descubrir más cercano con distancia y rumbo (`game.rumor()`, sin carretas/estatuas/etc.), logro `rumor`.

## 2.44.0 — 2026-11-07 · El carro viejo y los huecos
- `src/vehiculos.js`: mob `carro` (`vehicle: true`, modelo con cabina, vidrios, focos, placa y llantas que giran; `update` propio, `onHurt` lo devuelve como ítem tras 4 golpes, `interact` sube o echa gasolina con bidón), `carRide` (W/S acelera-frena-reversa, A/D gira según la velocidad, Espacio pita, Shift baja; máx. 15 en calle y 7 en monte; gasolina por distancia; sube escalones de 1; choques) y los **huecos**: si una de las 4 llantas pisa aire/agua/fondo de hueco/asfalto roto con calle alrededor → salto, sacudida y chance de reventar llanta (menos velocidad, se ladea). `repairCar`: el mecánico o la llantera cambian llantas a 10 colones c/u.
- Ítem 414 «Carro viejo (de segunda)», se pone en el suelo. El taller (`mecanico`) vende el carro (120) y bidones; la bomba ahora vende bidón (8).
- Sonidos reales nuevos (Freesound CC0): `carro.arranque` (250009), `loop.motor` (369054, 349171), `pito` (434878, 423990), `hueco` (96137, 170633), `llanta` (243375).
- Logros: `carro`, `llanta`, `llantera`, `huecos` (25), `carretera` (500 bloques).

## 2.43.0 — 2026-11-07 · Mi lote y la misión de vivienda
- `src/vivienda.js`: `useEscritura` (ítems 389 y 413 sobre el terreno → `meta.lote`, estacas de cerca en las esquinas a ±7, logro `lote`), `tickVivienda` (cada 3 s cerca del lote: cuenta paredes, techo, puerta, cama, cocina, cofre y luz en 15×15; 5 colones por paso, `casa_propia` + 40 XP al final, bono de vivienda de 30 colones tres días después, logro `bono`) y `viviendaHTML` (sección «Mi casa» en la ruta J).
- Ítem 413 «Escritura de lote en el pueblo». La municipalidad (`funcionario`) ahora vende en la «Ventanilla de catastro»: el primer día pide el trámite y manda a volver mañana (`meta.tramite`); desde el día siguiente vende la escritura (40), cercas y faroles.
- Mapa: marcador 🏠 del lote.

## 2.42.0 — 2026-11-07 · Cacao, lechería y sombrero de sabanero
- `src/agro2.js` (generador v6): `cacaotal` (selva: árboles de cacao con mazorcas pegadas al tronco, árboles de sombra, casa cónica de palma, mesa de secado, metate, cofre con chocolate) y `lecheria` (establo, sala de ordeño con tanque, quesera con cocina, potrero con vacas; «Cooperativa La Vaquita», ficticia).
- Bloque 221 `mazorca_cacao` (cruz, suelta 408). Ítems 408 semillas de cacao, 409 chocolate artesanal (energía), 410 queso Turrialba, 411 natilla, 412 sombrero de sabanero (casco `mat: 'sabanero'`, visible en el vestidor).
- Recetas: fogón chocolate (cacao ×2 + tapa de dulce), queso (leche ×2), natilla (leche + limón); sombrero con cuero.

## 2.41.0 — 2026-11-07 · Redondel y turno en los pueblos (generador v7)
- Generador **v7** para mundos nuevos (`ui.js genVersion: 7`); los mundos v6 guardados no cambian.
- `pueblo6.js` (solo v7, con su propio `mulberry32(r ^ 0x7b7b)` para no mover los lotes): `redondel` al oeste (75 %: ruedo de arena r 9, barrera, gradería de 3 escalones, postes con faroles, toril con verja, cabina, toro «Malacrianza II», zona `redondel`) y `turno` al este (65 %: chinamos con franja de color, cocina/mesa, rueda de Chicago de metal rojo, tómbola con bombetas, zona `turno`). Roles `montador` y `feriante`.
- `game.js` `tickZones`: `turno` avisa, da logro `turno`, emisor `loop.pueblo` y bombetas de noche; `redondel` da `improvisado`, el toro te levanta (2 de daño, empujón) y aguantar 20 s da `valiente_redondel` + 25 XP.

## 2.40.0 — 2026-11-07 · Braulio Carrillo, Juan Castro Blanco y Carara
- `src/parques3.js` (generador v6): Braulio Carrillo (`land` selva/nuboso: Ruta 32 de dos carriles con baranda, derrumbe con conos y rótulo satírico del «Ministerio de Obras Eternas» ficticio; confluencia río Sucio con lecho de arenisca y Honduras con basalto; helechos arborescentes), Juan Castro Blanco (`high`: tres estanques de truchas, naciente con caída de agua, soda del truchero con cocina y cofre con caña) y Carara (`land`: almendro gigante con cuatro lapas, sendero en anillo, laguna con cocodrilo).
- Logro `parques` cuenta también Braulio, Juan Castro, Carara y Turrialba.

## 2.39.0 — 2026-11-07 · La Arpía de la Tormenta
- `src/arpia.js`: jefa voladora del cielo (`flyGoal`): picada con amago `windT` (parry → `stunT`, baja a la altura del jugador), rayos marcados (`m.data.strikes`, círculo que se cierra, 6 de daño sin bloqueo, `weather.flash`), ráfaga que empuja (×0,25 con el escudo arriba); furia bajo 50 % (3 rayos, cooldowns menores). `arpiaSpawn` en `trySpawn` del cielo (dimT ≥ 45, 5 % por chequeo, descanso 420 s).
- Ítems 406 (pluma de la Arpía) y 407 (Capa de la Arpía, pechera `mat: 'arpia'`, 7 pts, planeo a −5 m/s y sin daño por caída: `player.capa`). Receta `A A / ALA / ADA`. Capa visible en el vestidor.
- Sonidos reales nuevos (Freesound CC0): `arpia` (381200, 39338) y `rafaga` (146932, 683096).
- Arreglo: `killedMob` daba el logro solo a `legend`; ahora también a `boss` (el Señor del Arenal no contaba para la ruta).
- `ruta.js`: meta final nueva «Vencer a la Arpía de la Tormenta» (al final, para no correr los índices guardados).

## 2.38.0 — 2026-11-07 · Cerro de la Muerte, Conchal, Turrialba y San Lucas
- `src/lugares3.js` (generador v6): Cerro de la Muerte (`high`, soda con cocina, antenas, cruz, pajonal), Playa Conchal (`coast`, arena de calcita «de conchas»), Volcán Turrialba (cono de ceniza con cráter de azufre, zonas `fumarola` y `erupcion`; legendario, chance 0,4) e Isla San Lucas (`place` propio: islita en agua llana con costa a ~70 bloques, 40 % de las celdas; penal con celdas, verjas y cofre del preso). Nombres, rareza, logros e íconos del mapa; chunk `mundo`.

## 2.37.0 — 2026-11-07 · El campo alrededor de los pueblos
- `pueblo6.js`: cuatro parcelas de 20×20 en las esquinas de afuera según `regionOf` (cafetal, potrero, bananal, milpa) con `parcela()` que sigue el terreno; `v.R` sube a L+34 y se guarda `v.L` (lo usa `carreteras.exitOf`).

## 2.36.0 — 2026-11-07 · La Tulevieja
- `src/tulevieja.js`: jefa voladora con `flyGoal` (vueltas alto, picada, amago `windT` con chillido, aturdimiento que la baja al suelo). Aparece en `legendSpawn` cerca del agua (45 %). Ítem 405 (sombrero de tule, casco `mat: 'tule'`).

## 2.35.0 — 2026-11-07 · Venados y armadillos
- `fauna.js`: mobs `venado` (huye con `goTo` opuesto y saltos; distancia de susto menor si te agachás) y `armadillo` (`brain` bolita, `onHurt` ignora golpes menores de 4); aparición en `faunaSpawn`.

## 2.34.0 — 2026-11-07 · Zapote, aeropuerto y Zurquí
- `src/festejos.js`: `buildZapote`, `buildAeropuerto` (R 62), `placeZurqui` (loma 10+ más alta que los extremos a ±26) + `buildZurqui`.

## 2.33.0 — 2026-11-07 · La ruta del aventurero
- `src/ruta.js`: `RUTA` (12 metas con `done(g)`), `tickRuta` (cada segundo desde `tickLocas`; final con `regionBanner`), `rutaHTML`; panel `#ruta-panel` con la J. `ui.takeResult` anota `meta.crafted`.
- `carreteras.js`: `ROAD_TO` (16 tipos) une cada monumento con el pueblo más cercano a menos de 450 (pseudo-pueblo con `structR`); `structuresNear(..., only)` para buscar solo esos tipos.

## 2.32.0 — 2026-11-07 · Movimientos de combate
- `combate.js`: `weaponStats` (tiempo entre golpes y costo por arma), `tryRoll` (V), `trySlide` (Shift corriendo), `toggleLock` (R, aro `lockMark`, la vista sigue al enemigo), `tryHop` (espacio + A/D/S enfocado), `buildRoundShield`/`roundShieldTexture`. `player.forcedVel` para que la voltereta y la deslizada manden la velocidad; `game.flipPitch` gira la cámara; `swingRate` según el arma.
- `vite.config.js`: las estructuras del mundo van en el archivo `mundo` (build sin aviso de tamaño).

## 2.31.0 — 2026-11-07 · Combate de verdad
- `src/combate.js`: estamina (`spend`, `tickCombat`), escudo (`SHIELD_SLOT` 4 en `inventory.armor`, `startBlock`/`stopBlock`, `onPlayerHit`: esquive con `iframes`, parry < 0,3 s que pone `stunT`, bloqueo con `block` del escudo), `strike`/`afterStrike` (combo, fuerte, crítico con aturdido), `tryDodge`, `updateShieldHand`.
- `entities.js`: amago `windT` antes del golpe (alcance según el ancho), aturdimiento `stunT` que corta la IA. `game.js`: clic derecho bloquea con escudo y arma, clic del medio o F = `heavyAttack`, espacio bloqueando = esquive; animaciones de lanza, mazo y golpe fuerte. Ítems 399-404 con recetas e íconos; el vestidor muestra el escudo en el brazo.

## 2.30.0 — 2026-11-07 · El Señor del Arenal
- `inframundo.js`: mob `senor_arenal` (jefe, `brain` con `bombCd`/`slamCd`, bombas `LavaBomb` con velocidad balística hacia el jugador) y `bossSpawn` (90 s en la dimensión, 8 min entre apariciones). Ítem 398 (corazón: `ignifugo` 900 s). `game.dimT`.
- `entities.js`: quemarse con la luz del día solo en la superficie.

## 2.29.0 — 2026-11-07 · Regiones de Costa Rica
- `src/regiones.js`: `REGIONES` (nombre, lema, pueblos) y `regionOf(col)`/`regionAt` a partir de bioma, calor, humedad y altura. `planVillage6` nombra los pueblos por región; `tickDiscover` anuncia la región (`ui.regionBanner`, `#region-banner`) y guarda `meta.regions`.

## 2.28.0 — 2026-11-07 · Feria, cementerio y Limón
- `src/pueblos2.js`: `buildFeria`, `buildCementerio` (zona `cementerio`: emisor `loop.llanto` de noche), `buildMuelleLimon`. Roles y tiendas `feriante` y `tamalera`.

## 2.27.0 — 2026-11-07 · Potrero y horizonte
- Bloques 219 (boñiga) y 220 (boñiga con hongos, forma de cajas con texturas por franja), ítems 395-397. `game.tickPotrero` (vacas → boñigas, boñigas → hongos, visiones del viaje); efecto `viaje` aplica `filter`/`transform` CSS al canvas y FOV ondulante (`tripT`, `tripOn`). Abono: boñiga en cultivo = etapa + 1.
- `world.shownRadius` (chunks dibujados completos alrededor del jugador) alimenta `uHide` del horizonte; `lod.js` usa `uSkyColor` y la misma saturación que lo cercano.

## 2.26.0 — 2026-11-07 · Más parques nacionales
- `src/parques2.js`: `buildCahuita` (coral por hash), `buildTenorio` (quebradas que se juntan, `agua_celeste`), `buildMonteverde`, `buildPaloVerde`, `placeIslaCoco` (agua honda a 40, 90 y 150 bloques) + `buildIslaCoco` (tesoro de Lima).
- Bloque 218 (agua celeste, sin ácido).

## 2.25.1 — 2026-11-07 · La cola de la ballena, como la de verdad
- `buildMarinoBallena`: istmo con ancho y curva variables (`stemX`, `stemHW`), aletas en media luna (elipse menos elipse corrida), islote `isle`, bajos de arena por cercanía (solo en el chunk propio), R 62.

## 2.25.0 — 2026-11-07 · Parques nacionales
- `src/parques.js`: `arco()`, `caseta()`, `palm()`; `buildMarinoBallena` (cola = istmo + dos elipses rotadas, arena a la altura del mar con `top = SEA - oy`; R 46), `buildCorcovado`, `buildManuelAntonio`, `buildTortuguero` (v6).
- Easter eggs: cofres escondidos con placa, comando `/puravida`, logro `parques`.

## 2.24.0 — 2026-11-07 · Volcanes, cavernas y la Amistad
- `src/naturaleza2.js`: `buildIrazu` (v6, `high(12, 14, 84)`), `buildRinconVieja` (zona `lodo`: burbujas y emisor `loop.hervir`), `buildBarraHonda` (sala elipsoidal y `spiral` desde el piso), `placeAmistad`/`buildAmistad` (busca río de 14 a 80 de ancho).
- Bloque 217 (lodo, `hurts`). Ítems 392-394 con recetas de fogón y en la soda.

## 2.23.0 — 2026-11-07 · Cofres, cama, horno y mesa de verdad
- `stations.js`: `buildChest` (caja y tapa huecas, forro, flejes, cerradura, pestillo) y `refreshChest` (hasta 9 cosas con montoncitos; `TREASURE` hace brillar el interior); `glowRing`; cama de varias piezas; horno con `doorPivot`, `pool`, chimenea, chispas y brasas al fundir; mesa con `hammer` (`hitT` desde `ui.takeResult`) y aro `ready`.
- Texturas nuevas: cofre_madera, cofre_tapa, cofre_forro, hierro_cofre, oro_cofre, puerta_horno, cama_manta, cama_almohada, cama_sabana, cama_lado (la cama ya no usa la textura transparente `bed_side`).
- `game.js`: `lieDown`, `getUp`, `tickLying`, `siesta`, `sleepNight` (se puede acostar de día); dinamita pide mechero (391, `dur` 48) o antorcha.
- Sonidos Freesound CC0: recoger, soltar, cofre.abrir, cofre.cerrar, picar; `audio.chest()`, `audio.drop()`.

## 2.22.0 — 2026-11-07 · Mejores sonidos
- Bancos nuevos (Freesound CC0, en `tools/process-sounds.mjs`): swish, tajo, armadura.metal, armadura.cuero, inv.open, inv.close, fuse, rumble, recoger, danta, danta.hurt, sombra, sombra.hurt, perezoso, quetzal, tortuga. Ya no quedan criaturas con sonido sintetizado.
- `audio.js`: `spatial()` devuelve `far` y `play()` pone un filtro pasa-bajos según la distancia; `opts.range`; `slash(hit, pos)` y `armor(mat, off)` arman sonidos en capas.

## 2.21.0 — 2026-11-07 · Machete y vestidor
- `models.js`: `makeMacheteMesh(dark)` (cajas con colores en los vértices). `game.js`: `rebuildHand` usa el machete 3D; `macheteHand()` con cuadros clave (reposo, armado, fin del corte) y estela `slashFx` (anillo aditivo que crece); `slashDir` alterna en cada golpe; `tintHand` compartido; tajo al aire en `leftClick`.
- `src/vestidor.js`: clase `Vestidor` con su propio `WebGLRenderer` sobre `#doll-canvas`; personaje de cajas, piezas de armadura con textura generada por material, animaciones de entrada y salida, chispas en `#doll-fx`, `onImpact`. `ui.js`: panel `#char-panel`, `startDoll()` (rAF mientras el inventario está abierto), medidores, `equipPop()`; clase `opening` para la entrada. Estilos en `style.css` (bloque «vestidor»).

## 2.20.0 — 2026-11-07 · Campo y naturaleza
- `src/agro.js`: `shed()` y builders beneficio, trapiche (tipo `trapiche`), hacienda (con redondel), bananera, catarata; `placePuenteColgante` busca una cañada (extremos 6+ más altos que el centro a ±20) y `buildPuenteColgante` hace la comba con una parábola.
- Bloques 215-216 (café secándose, saco de café). Rol y tienda `caficultor`.

## 2.19.0 — 2026-11-07 · Patrimonio histórico
- `src/historicos.js`: `hall()` (edificio de varios pisos con escaleras internas), `gable()`, y 10 builders: sanatorio, metalico, correos, museo_ninos, grecia, coronado, ujarras, santa_rosa, esferas, aduana (todos v6).
- `estructuras.js`: condición `high(rad, tol, minH)` para tierra alta. Zona `sanatorio` (de noche: susurros, crujidos y avisos).

## 2.18.0 — 2026-11-07 · La refinería que no refina
- `src/refineria.js`: `buildRefineria` (tipo `refineria`, v6, `coast(30, 8)`, R 54, celda 2600) con `tank()`, `pipeX/pipeZ`. Nombre de parodia (RECOPA) y textos que la marcan como ficticia.
- Bloques 211-213 (óxido, tubería en z y en x), ítem 390 (bidón). Roles `operador` (tienda: vende bidones) y `guarda_planta`; `pistero` ahora es tienda y compra bidones; logro `transportista` en `renderShop`.

## 2.17.0 — 2026-11-07 · Paraíso en dólares
- `src/lujo.js`: `buildPlayaLujo` (tipo `playa_lujo`, v6, `coast(28, 10)`, R 50, celda 1400) con `box()` y `palm()`.
- `SHOPS` con `lujo: true` (bartender, chef_lujo, barista_lujo, inmobiliaria) y `sodera_playa` con precios normales; la recepcionista cobra 60 colones y adelanta a la mañana con `ui.sleepFade`. `renderShop` da logros al comprar. Ítem 389 (escritura) con ícono propio.
- La sátira va contra precios y especulación, no contra las personas; los turistas son amables y la playa se marca como pública.

## 2.16.0 — 2026-11-07 · Estadios, tren y monumentos de Chepe
- `src/estadios.js`: `standRow` (fila de gradería por distancia a un rectángulo, con esquinas redondas), `field`, `buildEstadioNacional` (R 42, celda 3200), `buildEstadioObra` (ficticio, R 38), `buildEstacion`, `buildMonumentoNacional`, `buildTemploMusica`.
- Zonas nuevas `estadio` (sonido `gol` y aviso cada 35-65 s), `tren` (silbato) y `retreta` (comparte la función de marimba del teatro). Sonidos Freesound CC0: 241630 y 397434 (gol), 71778 (silbato).
- Bloques 205-210. Roles futbolista, aficionado, ingeniero, jefe_estacion.

## 2.15.0 — 2026-11-07 · Carreteras llenas de huecos
- `src/carreteras.js` (v6): cada pueblo se une con sus 2 vecinos más cercanos (hasta 3 celdas, < 900 bloques; `linksOf`, tramo por pareja ordenada en `gen.roadCache`). `makeSegment`: sale por el final de la avenida del pueblo, curva Bézier, alturas suavizadas (ventana ±5), agua honda = puente (máx. 46), agua baja = relleno; tipo nacional/cantonal/lastre y lista de `feats` (obra, peaje, presa, derrumbe, rótulo, cráter).
- `buildRoadsInChunk` corre en `worldgen.js` después de la decoración y antes de pueblos y monumentos; huecos por hash de columna; `losa_asfalto` donde sube un bloque. `roadsNear` para el mapa.
- Bloques 198-204 (parche, asfalto agrietado, cono, fondo de hueco, lata de maquinaria, barrera, losa de asfalto). Roles `constructor` y `peajero` (cobra 1 colón). `tickDiscover` revisa si el jugador pisa un fondo de hueco.

## 2.14.0 — 2026-11-07 · Pueblos y ciudades ticas
- `src/pueblo6.js`: `planVillage6` (v6; caserío con r < 0.28 sigue con el plano viejo, ciudad con r > 0.8): calles en numeral (`v.streets`), cuadras con edificios por tipo, lotes a lo largo de las avenidas (locales grandes primero, después casas), `v.R`, `v.name`, `v.city`. `buildStreets` (asfalto, línea, acera, postes cada 9 con cable, huecos y parches por hash). `edifice()` (paredes, ventanas, corredor, techo de teja, zinc o plano, puerta, rótulo, tanque) y `DEC` con 27 tipos; marco local u/v con `frameOf`.
- `pueblogen.js`: en v6 el margen de celda sube a 110 y entra el bosque seco; delega en `buildKind6` y dibuja calles antes que los edificios.
- Bloques 183, 184, 188-197. Roles nuevos con frases y tiendas (`SHOPS`): minisúper, panadera, carnicero, farmacéutica, cantinero, ferretero, frutero, copero; doctora cura; funcionario y fila. Mapa y bienvenida con el nombre del pueblo; logros `ciudad`, `ebais`, `tramite`.
- `main.js`: el ciclo de cuadros atrapa errores (antes un error en `Mob.update` lo detenía); `entities.js` ya no asume brazos y ojos en criaturas con capa.

## 2.13.0 — 2026-11-07 · Monumentos a lo grande
- Generador **v6** para mundos nuevos (`ui.js` crea con `genVersion: 6`). `estructuras.js`: `typesFor(gen)` filtra por `minV` y aplica las sobreescrituras `v6` de cada tipo (celda, radio, condiciones, constructor); `overlaps()` evita que una estructura caiga encima de otra de un tipo anterior en la lista.
- `src/monumentos_grandes.js`: `buildRuinasGrande` (R 40), `buildFortinGrande` (R 21, con parque y quiosco) y `buildGuanacasteGigante` (tipo nuevo `guanacaste`, solo v6).
- `STRUCT_RARE`, `STRUCT_ACH`, `structRadius`; `game.tickDiscover` guarda `meta.discovered` (id → tipo) y da logros. Rol `guia`.
- Legendarios más escasos en v6: capital 3000, basílica 2600, ruinas 2200, fortín 1800, guanacaste 1100.

## 2.12.0 — 2026-11-07 · Las Tierras del Cielo
- Tercera dimensión `cielo` (prefijo `sky:` en el guardado): `src/cielogen.js` (`islandIn` por celdas de 72, islas en trompo, mar de nubes a `CLOUD_Y`, templos con cofre), tinte propio del pasto, `ambientSky` 10.
- Portales generalizados: `findFrame(..., frameId)` y `buildPortal(..., frameId, portalId)`; `portalKind` y `arrival.kind` deciden adónde y qué portal se arma al llegar.
- Bloques 185-187 (nube `soft`, portal del cielo, piedra celeste), ítem 388 (pluma dorada, efecto `pluma`); caer al vacío del cielo te devuelve a la superficie.
- Arreglo: las dimensiones sin tinte dejaban el pasto y las hojas negros.

## 2.11.0 — 2026-11-07 · Cartago, Orosi y el Tárcoles
- `estructuras.js`: `basilica`, `ruinas`, `orosi` (con zona `campana`) y `tarcoles` (ubicación propia `placeTarcoles`: busca un río de 6 a 28 de ancho en tierra caliente y orienta el puente). Rol `peregrino`.

## 2.10.0 — 2026-11-07 · Luz más realista
- Shader de bloques: `uSkyColor` (`SKY_LIGHT` en `world.js`) multiplica la luz del cielo; luz de bloques anaranjada `(1.05, 0.68, 0.38)` con parpadeo; las dos se suman con tope 1,15; saturación ×1,14.
- `game.updateLightColor`: mediodía cálido, hora dorada, luna azul, gris con lluvia, rojizo en el inframundo; `LIGHT_TINT` (`models.js`) tiñe a las criaturas en `tintModel`.

## 2.9.0 — 2026-11-07 · El arte del Teatro y la carreta
- `src/arte.js`: imágenes grandes repartidas en bloques (`muralImage` 64×32, `wheelImage` 48×48 con transparencia, `slicePainter`). Bloques 157-164 (mural, se ve por abajo) y 165-182 (rueda grande en los dos sentidos, `shape` delgada).
- `teatro()` rehecho (W 13, D 27) y `Ctx.setW` para poner bloques en ejes del mundo (el mural queda entero con cualquier rotación). La capital sube a R 44.
- `buildCarreta` con ruedas de 3×3 ordenadas por eje del mundo.

## 2.8.0 — 2026-11-07 · Volcanes y cerros
- `GenV2.volcanoIn` (v5): `kind` arenal/poas con `exp`, `crf`, `depth`; `shapeColumn` deja `acidTop` (laguna ácida del Poás) y `volcanoKind`. `cerroIn`/`cerroNear`: macizo del Chirripó (gaussiana de 60 bloques), bioma `paramo` sobre 96 con pajonales y lagunas glaciares.
- Bloques 154-156 (agua ácida `acid`, pajonal, costra de azufre). Estructuras con ubicación propia (`place`): `mirador_poas`, `mirador_arenal`, `cumbre`, `refugio`.
- `src/volcanes.js`: `LavaBomb`, `tickVolcanoes` (humo y erupciones del Arenal, vapor del Poás, logro de cumbre); `env.volcan` para el retumbo.
- `guanacasteShape` con tronco 2×2 (3×3 en la base del monumental) y lo usa también el generador.

## 2.7.0 — 2026-11-07 · San José y el guanacaste
- `estructuras.js`: tipo `capital` (celda 1500, radio 36, despeje grande `clearR`), `Frame` (sub-construcción con su propio origen y rotación: cada edificio mira a la plaza), `zone` (teatro, campana, capital), `getMaybe`, `guanacasteShape` (compartido con el arbolito).
- `world.zones`; `game.tickZones` (función del teatro con `Music.concert()` y aplausos, campanas de la catedral, llegada a la capital); `growGuanacaste`.
- Vecinos: acomodador, canciller, mercader (tienda) y lotero (chances de 2 colones). Ítem 384 (oreja de guanacaste) y bloque 153 (arbolito, `crop: 'guanacaste'`).
- Sonido real de aplausos (CC0).

## 2.6.0 — 2026-11-07 · Costa Rica monumental I
- `src/estructuras.js` (sin gráficos): tipos con grilla propia (`cell`, `chance`, `R`, `fits`, `build`), `placeOf` con caché, condiciones `land`/`coast` (mar abierto, rotación mirando al mar), `Ctx` con rotación (`rotFacing`), cimientos, círculos, escalera de caracol (`spiral`), puertas, cofres, placas (BE `placa` con título y texto), personas/animales (`npc` con `mob`, `frozen`, `tamed`), faros (`beacon`) y `clearTrees`.
- Generador v5 llama `buildStructuresInChunk` después de los pueblos. `world.beacons`; `game.updateBeacons` dibuja el haz giratorio.
- Vecinos nuevos con puesto fijo (`KEEPERS`): churchillero y pescador (con tienda), farero, guarda y boyero; `spawnVillager` también pone animales de las estructuras (y no los duplica).
- Bloques 148-152, ítems 381-383; `/lugar`; marcadores en el mapa; logros de placas (`meta.monuments`).

## 2.5.1 — 2026-11-07 · Inframundo caminable
- `columnInfra`: piso 24-64 continuo (amplitud mayor y escala más ancha), `LAVA_SEA` 37 (~16 % de lava); islas desde 9 bloques sobre el piso; columnas piso-techo más raras.
- `finishArrival` en el inframundo busca en espiral (radio 24) un piso sobre la lava con aire libre para el portal.
- Zopilotes: máximo 2, picotazo cada 3,5 s.

## 2.5.0 — 2026-11-07 · Inframundo Volcánico
- **Dimensiones**: `Generator(seed, version, dim)` y `World(..., dim)`; `game.dims` guarda mods/be por dimensión; los chunks del inframundo se guardan con prefijo `inf:` en la misma partida (`meta.dim` dice dónde está el jugador). `game.switchDim(target, dest)` guarda, cambia de mundo, apaga el horizonte lejano y el cielo; `finishArrival` busca o construye el portal de llegada (escala 1:8).
- `src/infragen.js` (sin gráficos): `columnInfra`, `genInfra`. `src/inframundo.js`: `ceniciento`, `zopilote_fuego`, `infraSpawn`, `findFrame`, `buildPortal`.
- Mesher: `ambientSky` para la penumbra pareja del inframundo. Bloques 140-147, ítems 378-380. Mascotas con `dim` (`awayPets`).
- Arreglo: la animación de criaturas hostiles era solo de la Sombra (`u.cloth`).

## 2.4.0 — 2026-11-07 · Ideas locas
- Guaro (ítem 375, `guaro`, receta de fogón con 3 cañas + balde de agua): efecto `mareo` (zigzag en `input`, hipo, cámara que se mece en `render`).
- Mascarada (ítem 376, casco de armadura): `game.disguised`; las criaturas hostiles no persiguen de lejos salvo que las provoquen (`data.provoked` en `Mob.hurt`); diálogos propios de los vecinos.
- `game.tickLocas`: lluvia de mangos (ítem 377) en verano bajo hojas de roble, y ToucanFest (5 tucanes a menos de 24 bloques).
- Sonido real de hipo (CC0).

## 2.3.0 — 2026-11-07 · Mapa y marimba
- `src/mapa.js`: `drawMap` pinta desde `gen.column` en baldosas de 64 px con caché (relieve por diferencia de altura), marcadores de pueblos (`villageAt`), aparición y jugador; la UI lo dibuja de a poco (`drawMapLoop`, 4 baldosas por vuelta). Tecla M, estado `map`, zoom 1-16 bloques por píxel.
- `src/musica.js`: `Music` compone piezas (motivo de 6 notas que se repite y varía, bajo, terceras) en pentatónica; transpone la grabación más cercana (`nota.marimba.<midi>`, `nota.arpa.<midi>`); espera 2-5 min entre piezas; bus propio con el ajuste `music`.
- 17 notas CC0 (VCSL) procesadas en `tools/process-sounds.mjs`.

## 2.2.0 — 2026-11-07 · Biomas ticos
- **Generador v4**: `GenV2.shapeColumn` reasigna `nuboso` (alturas 83-107 húmedas), `manglar` (costa cálida y húmeda) y `bosque_seco` (llanura cálida y seca) solo si `version >= 4`; `GenV2.decorate4` con `guanacaste`, `ceiba`, `arbolNuboso`, `mangle` (busca troncos hasta 10 bloques fuera del chunk para que las copas grandes no se corten), suelo del nuboso y aguas termales.
- Bloques 135-139: tronco con musgo, bromelia, helecho, alfombra de musgo (`shape`), travertino.
- `game.js`: neblina (`this.mist`) que acerca y aclara la niebla en el nuboso; `env.termal`, vapor en `ambientParticles`, efecto `termal` que cura; estaciones (`this.season`, 7 días) que cambian la duración de la lluvia en `weather.set`.
- Quetzales más comunes en el nuboso; el ambiente de selva suena en nuboso y manglar; el horizonte lejano pinta copas en los biomas nuevos.

## 2.1.0 — 2026-11-07 · Construcción
- Render `shape` (tipo 6 en `mesher.js`): bloques hechos de cajas (`boxes` en dieciseisavos) con su pedazo de textura; la cerca arma poste + travesaños según vecinos (`FENCE_POST`, `FENCE_ARMS`).
- Física: `BOXES` (cajas de colisión por id; `collide` si difiere de lo que se ve), `moveAxis`/`boxHitsSolid` revisan también la fila de abajo (cercas de 1,5), `moveStep` sube medio bloque al chocar con algo bajo.
- Bloques 112-116 (losas, `slab`, `full`), 117-132 (escaleras ×4 orientaciones, `stairBase`, variantes ocultas que sueltan la base), 133 cerca, 134 farol (`anim: 1` para mecerse).
- `src/fiesta.js`: `Rocket` (bombeta: mecha, silbido, estela, estallido en esfera/anillo/palmera, espanta animales). Ítem 374.
- 6 grabaciones CC0 nuevas (mecha, silbido, estallidos).

## 2.0.0 — 2026-11-07 · Leyendas ticas
- `src/leyendas.js`: criaturas `cadejos`, `cadejos_blanco`, `segua`, `padre`, `llorona` (`legend`, `boss`, `ghostly`), se van al amanecer (`daylight > 0.45`); `legendSpawn` (de noche, en supervivencia con hostiles, una a la vez, enfriamiento 150-300 s, según el lugar: pueblo → Padre/Segua, agua → Llorona, reputación ≥ 3 → Cadejos blanco).
- `src/armas.js`: `Arrow` (sub-pasos, se clava, se recoge), `levelOf`/`xpNeed`, `ORE_XP`.
- `game.js`: arco (`bowDraw`, `tickBow`, zoom del FOV), machete en `breakTime`, `addXP`/`killedMob`/`damageBonus`, `updateBossBar`; experiencia guardada en `meta.xp`.
- `Mob.remove` llama `kind.onRemove` (la Llorona apaga su emisor de llanto).
- HUD: barra de experiencia con nivel y barra de jefe. Ítems 325-328 (machete, arco, flecha, machete del Cadejos) y 371-373 (trofeos que compra la pulpería).
- 16 grabaciones CC0 nuevas.

## 1.9.0 — 2026-11-07 · Mar y costa
- **Generador v3** (mundos nuevos): los pueblos de la 1.8 pasan a v3 (en v2 se habrían metido en zonas ya exploradas) + `GenV2.seaFeatures` (arrecifes en mar tibio de 3 a 18 de profundidad, naufragios con cofre). Los mundos v1/v2 no cambian.
- `src/mar.js`: `swim()` (nado genérico con meta, timidez, saltos y varado), criaturas `pez` (5 especies, cardumen con líder), `delfin` (sigue el bote, salta, no se deja lastimar, da la Gracia del delfín), `ballena` (respira y sopla, salta, canta), `tiburon` (muerde en el agua, protegido), `bote` (flota, se guarda como mascota `tamed`); `boatRide`, `seaSpawn`, `fishLoot`, `Bobber` (boya con física y cuerda con comba).
- `Mob.update`: gancho `kind.update(m, dt)` para criaturas con movimiento propio.
- Ítems 357-358 y 361-369 (caña, bote, pescados, pescado frito, ceviche, limón, bota vieja, perla); bloques 108-111 (corales). Recetas, horno y fogón.
- 16 grabaciones CC0 nuevas (ballena, delfín, carrete, lanzar, remo, gaviotas, chapoteo).

## 1.8.0 — 2026-11-07 · Pueblos ticos
- `src/pueblogen.js` (sin gráficos; también lo carga el worker del horizonte): `villageAt` (celdas de 384 bloques, 45 %, terreno plano en llanura/bosque/selva) y `buildVillageInChunk` (despeja árboles, caminos de grava, plaza, iglesia con campanario, pulpería, soda, parada, casas con interior). Se aplica después de `decorate` (desde la 1.9, solo generador v3).
- `src/pueblo.js`: criatura `vecino` (modelo por persona, horario día/noche, encargos guardados en `meta.errands`, reputación en `meta.reputation`), tiendas `SHOPS` (pulpero con fiado en `meta.fiado`, sodera), `spawnVillager`, `BELL_TIMES`.
- `world.villageNpcs` (lo llena `ensureChunk` con las estructuras `{ npc }`); las estructuras con `id` se validan por id. `game.tickVillages` hace aparecer vecinos, campanas y el logro de llegada; comando `/pueblo [ir]`.
- UI: globo de diálogo (`ui.dialog`) y pantalla de tienda (`ui.openShop`, estado `shop`).
- Bloques 101-107 (madera pintada ×4, adobe, repello, teja) y colón (ítem 360) con recetas.
- Mesher: la luz del cielo se propaga 3 bloques de lado (aleros y bocas de cueva dejan de verse negros).
- 13 grabaciones CC0 nuevas: campana, monedas, caja registradora, balón, gente conversando, «mmm» de vecinos.

## 1.7.0 — 2026-11-07 · Cocina tica
- Bloques 94-100: cafeto (4 etapas, cosecha con clic derecho), caña (`caneOk`, crece a 3), trapiche (modelo con rodillos y yugo, BE `trapiche`), fogón (`station: 'cooking'`, BE `stove`).
- Recetas de cocina (`cook: true`, `returns`) separadas por modo en `findRecipe(grid, size, mode)`; efecto Energía.
- Ítems 294-299 y 350-356 (comidas ticas).
- Generador v2: cafetos silvestres y caña junto al agua.

## 1.6.0 — 2026-11-07 · Finca tica
- `src/finca.js`: gallina, vaca, perro zaguate y caballo criollo; cría (`feedForLove`, `loveBrain`, crías con `babyScale`), aparición en llanuras (`fincaSpawn`).
- Montar: `game.mount/dismount/rideUpdate` (el caballo sigue la mirada, Ctrl galope, salto), la física del caballo la maneja el jinete.
- Baldes (ids 289-292) con raycast que ve fuentes de fluido; albarda (293); huevo y huevo frito (287-288).
- 12 grabaciones CC0 nuevas (perro, caballo, galope, balde, montura).

## 1.5.0 — 2026-11-07 · Fauna de Costa Rica
- `src/fauna.js`: 15 especies con modelo, sonido, cerebro (`brain`), animación (`animate`), interacción (`interact`) y aparición por bioma (`faunaSpawn`); nidos de tortuga (`tickNests`).
- `Mob`: ganchos `brain/animate/interact/onHurt/flyGoal`, `frozen`, `goTo`, `follow`, mascotas guardadas en `meta.pets`.
- Efectos del jugador (`player.effects`: veneno, calma), logros (`game.achieve`), reloj de juego (`game.clock`).
- Ítems 275-286 y bloques 90-93 (racimo de bananos, colmena, nido, frasco con morfo).
- 36 grabaciones CC0 nuevas de Freesound (animales y ambiente) procesadas en `tools/process-sounds.mjs`.

## 1.4.0 — 2026-11-07 · Vida y clima
- `src/weather.js`: lluvia (segmentos), nieve (puntos), techos por columna, salpicaduras, relámpagos y truenos con retraso por distancia; nublado en `sky.update`.
- Audio: lluvia sintetizada en dos capas con filtro bajo techo, gotas, truenos, aullido del mono congo, graznido de lapa, chillido de murciélago, aleteo.
- Fauna voladora (`Mob.flyUpdate`): lapa roja, murciélago; mono congo en la selva.
- Partículas de ambiente: hojas, luciérnagas, polvo de cueva.
- Cama (id 89, modelo 3D) con dormir y punto de reaparición.
- `docs/PLAN_MAESTRO.md`: hoja de ruta hasta 2.x.

## 1.3.0 — 2026-11-07 · Cuevas y cosechas
- Generador v2 (`src/worldgen2.js`, solo mundos nuevos: `meta.genVersion = 2`): cuevas fideo y cavernas, roca profunda, acuíferos por regiones de 48×48 con paredes de contención, lava bajo y=10, decoración (musgo, hongos brillantes, lianas, espeleotemas), geodas, ruinas con cofres de botín, volcanes (celdas de 640), selva, esferas de piedra.
- Fluidos con niveles (ids 72-83), simulación por cola (`world.fluidQueue`), esquinas promediadas en el mallado, corrientes en `Body`, lava ↔ agua.
- `FallingBlock` (arena/grava), antorchas 3D y de pared (ids 67-70), comer animado, azada, tierra arada, cultivos (maíz/frijol, 4 etapas, `world.crops`).
- Armadura (ids 330-345) con reducción de daño y desgaste; herramientas de jade y azadas (ids 316-324, los 300-315 no cambian).
- Recogida de ítems por caja alrededor del jugador.

## 1.2.1 — 2026-11-07 · Arreglos del video + ordenar al estilo Terraria
- `contextmenu` bloqueado en todo el documento (salvo campos de texto).
- Pointer lock: pantalla completa primero y después el mouse; gracia de 900 ms ante pérdidas por cambio de pantalla; `unadjustedMovement`; filtro de saltos de `movementX/Y`.
- Pantalla completa opcional (ajustes v2 la apagan en configuraciones viejas); `keyboard.lock` solo para W/D/T/N/R, así Esc sale con un toque.
- Arrastre para repartir (izquierdo en partes iguales, derecho de a uno), doble clic para juntar en el cursor.
- Botones al estilo Terraria: Sacar todo, Depositar todo, Apilar rápido, Ordenar (cofre); Ordenar y A cofres cercanos (inventario).
- Hacha reflejada sobre el mango en la mano.

## 1.2.0 — 2026-11-07 · Mega actualización: estaciones, sonido real y cine
- Crafteo en cuadrícula 2×2 / 3×3 con recetas con forma (`src/recipes.js`) y libro de recetas que acomoda los ingredientes uno por uno.
- Estaciones con cámara cinematográfica: mesa (ingredientes visibles encima, resultado flotando), horno (funde, se enciende, ilumina, fuego y humo), cofre (27 espacios, tapa con resorte).
- Puertas de 2 bloques con bisagra animada; antorchas con luz, llama y humo; "pop" al colocar bloques.
- Sonidos reales de Freesound (CC0) recortados por `tools/process-sounds.mjs`: pasos, golpes y roturas por material, comida, agua, fuego, cofre, puerta, explosión y ambientes (pájaros, selva, grillos, viento, cueva, bajo el agua).
- Horizonte lejano (`src/lod.js` + `src/lodworker.js`): terreno en baja resolución más allá de la distancia de visión, en un Web Worker, escondido por shader donde hay chunks reales.
- Pieles de criaturas compartidas entre instancias (antes ~16 texturas por criatura).
- Logo, fondo del menú e íconos generados con ChatGPT.
- Arreglos: atajos del navegador (Ctrl+D) que pausaban el juego; pantalla completa con bloqueo de teclado; escala de resolución; aviso si se pierde el contexto WebGL.
- Formato de guardado 2 (entidades de bloque por chunk); los mundos de formato 1 se convierten solos.

## 1.1.0 — 2026-11-06 · Pulido: se ve, se oye y se mueve mejor
- Texturas de bloques rehechas a mano (paletas curadas, manchas tileables, relieve, tramado ordenado) y variación por posición.
- Tinte de pasto y hojas por bioma; hojas y plantas se mecen; olas en el agua (shader).
- Sprites de Kenney (CC0) para ítems y herramientas; ítems que caen al suelo, imán al jugador, Q / Ctrl+Q para tirar.
- Audio con grabaciones reales de Kenney (CC0) por material, sonido 3D, eco en cuevas, filtro bajo el agua y ambiente (viento, pájaros, grillos, gotas, agua).
- Danta y Sombra con piel pintada por cara y animaciones nuevas (mirar, pastar, orejas, trompa, cola, flotar, embestida, muerte).
- Brazo con manga, golpe y cambio de ítem animados; cámara que se hunde al aterrizar y se inclina con el daño.
- Partículas con pixeles reales del bloque (romper, picar, correr, aterrizar).
- Cielo con degradado y resplandor del sol, halos, estrellas con brillo variable y nubes 3D.
- Pantalla de créditos dentro de Novedades.

## 1.0.0 — 2026-11-06 · Primera versión: el mundo nace
- Mundo infinito por chunks con semilla: llanuras, bosques, desiertos, tundra, playas, océanos, montañas y ríos.
- Cuevas (túneles y cavernas), vetas de carbón, hierro, oro y diamante, grava y barro.
- Árboles de roble y abedul, cactus, pasto alto y flores.
- Luz: oclusión ambiental por vértice, sombra bajo techo, cuevas oscuras y lámparas que iluminan de verdad.
- Física: gravedad, salto, correr, agacharse sin caer, nadar, daño por caída, hielo resbaloso, arena y grava que caen, agua que fluye.
- Supervivencia (vida, hambre, aire, herramientas con desgaste y niveles de pico) y Creativo (vuelo, catálogo).
- Inventario de 36 espacios, mesa de trabajo y 30+ recetas.
- Día y noche de 20 minutos con sol, luna, estrellas y nubes.
- Criaturas originales: Danta (pacífica, da carne) y Sombra (espectro nocturno que se deshace con el sol).
- Dinamita con reacción en cadena.
- Guardado automático, varios mundos, exportar/importar, ajustes, consola de comandos.
