# Revisión de textos de v12 (v12.0.0 → v12.4.7)

Sesión investigadora, solo lectura. Reglas usadas: `AUDITORIA_PANTALLAS.md` e `INVENTARIO_TEXTOS.md` («usted», neutro de género, tico sin caricatura, toast ≤ ~80 caracteres, sin repetir el mismo aviso, nada que se burle de instituciones reales, nombre que calce con ícono y receta).

**Cómo se hizo:** se leyeron los textos nuevos en `despensa.js`, `finca2.js`, `economia.js`, `temporadas.js`, `cuerpo.js`, `muebles.js`, `mascotas.js`, `carreta.js`, `supervivencia3.js`, `ui.js`, `logros-lista.js`, `ayuda.js` y `locutor.js`. Se corrieron las dos herramientas del repo:

- `node tools/revisar-nombres.mjs` → «322 ítems revisados, 0 problemas» (ids, claves, nombres e íconos calzan en lo automático).
- `node tools/revisar-avisos.mjs` → 685 avisos literales (importante 546, consejo 68, ambiente 23, urgente 12, registro 36). Los 12 urgentes son todos viejos; **ningún aviso nuevo de v12 se clasificó como urgente**, salvo el de sangrado, que se declara urgente a propósito y ya existía.

**Lo que NO se verificó:** nada del juego corrió (sin navegador, por regla). Las frecuencias de abajo son teóricas, leídas del código; y que un nombre calce con su ícono *a la vista* y con su receta *en el sentido* queda por confirmar jugando. Las fichas de ayuda se contrastaron con `VIDA` (despensa): «Duran 3 días» **sí coincide** (`pon([AGUA_MANZANILLA…], [3, 3])`).

## 1. Lo más importante (los 10 primeros)

| # | Dónde | Texto actual | Texto propuesto | Por qué |
|---|---|---|---|---|
| 1 | `economia.js:30` | toast «🐂 Hoy es sábado: hay feria del agricultor en el pueblo (de 8 a 5)» **y**, en la misma línea, consejo «🧺 Los sábados hay feria: sus cosechas valen un 25 % más con el feriante» | Un solo toast: «🐂 Sábado de feria del agricultor, de 8 a 5: sus cosechas valen más con el feriante» (y quitar el `consejoUnaVez`) | Dos avisos del mismo tema el mismo día; el consejo repite al toast. Además «25 %» está escrito a mano: si cambia el factor en `precios.js`, el texto miente. Por confirmar el factor real. |
| 2 | `finca2.js:21` y `:24` | «La inscripción vale mil colones.» / «La inscripción son dos unidades, nada más.» | «La inscripción son dos unidades (mil colones).» en ambos | Mismo precio dicho con dos monedas distintas; el jugador no sabe si necesita 1 000 o 2. Con 1 u = ₡500 son lo mismo, pero el texto no lo dice. Y el premio en `:36` dice «Veinte unidades»: unificar a «20 unidades (diez mil colones)» o dejar solo unidades en todo el concurso. |
| 3 | `finca2.js:160` (molienda) | «🍬 ¡Día de molienda! El pueblo muele caña: el caficultor y la pulpería se la compran (3 por una unidad)» (~100 caracteres) | «🍬 ¡Día de molienda! Venda su caña en el pueblo: 3 por una unidad» | Pasa el tope de ~80; «se la compran» es ambiguo (¿la caña o el jugo?); hay dos nombres de comprador. Detalles del caficultor y la pulpería van a la ayuda. |
| 4 | `despensa.js:82` | consejo «🪵 La fogata gasta leña: con 2 troncos se hacen 6 leñas (clic derecho a la fogata con leña en la mano)» (~105) | «🪵 La fogata gasta leña: 2 troncos dan 6 leñas. Échele con clic derecho» | Largo, dos ideas, paréntesis. |
| 5 | `despensa.js:96`, `:109`, `:133` | Tres textos casi iguales de fogata apagada: «…con un mechero en la barra y leña en la mano se vuelve a prender» / «Fogata apagada. Con leña en la mano y un mechero en la barra se prende de nuevo» / «El aguacero apagó la fogata. Con un mechero y leña se vuelve a prender» | Una sola fórmula: «🔥 La fogata se apagó. Échele leña y préndala con el mechero» (y para la lluvia: «🌧 El aguacero apagó la fogata. Échele leña y préndala con el mechero») | Tres redacciones distintas de la misma instrucción; clave de repetido distinta, así que pueden salir seguidas. Dos de ellas pasan de 80. |
| 6 | `despensa.js:142` y `:143` | toast «La fogata está en brasas: échele leña antes de que se apague» **+** consejo «Una fogata sin leña se apaga: tenga a mano unas leñas» (el mismo tick) | Quitar el consejo `brasas`, o dejarlo solo en `:143` y subir el toast a «🔥 Fogata en brasas: échele leña» | Mismo mensaje dos veces, con 3 variantes en `:110` también («En brasas: échele leña antes de que se apague»). |
| 7 | `logros-lista.js:402` y `:398`, `:400` | «La fogata no se me apagó» / «Seco como pollo en el aguacero» / «Agüita de las manos» | «Fogata que no se apaga» / «Seco en pleno aguacero» / «Agüita en las manos» | El resto de logros está en tercera persona o es sustantivo; «se me» es primera persona. «Seco como pollo en el aguacero» invierte la frase hecha (un pollo en el aguacero queda mojado) y se lee como error, no como chiste. |
| 8 | `muebles.js:10-18` (`CANALES`, la tele) | «📺 Noticias: «Se abre una nueva calle… se cierra en 3 meses por huecos»» y «📺 Programa de cocina: «Hoy: cómo hacer un casado sin gastar… no se puede»» y «📺 Lotería en vivo: salió el 23, como siempre que usted no compra.» | Cambiar la primera a «📺 Noticias: «Hoy inauguran un puente… ya lo están remendando»» o quitarla; las otras dos se pueden quedar | La de las calles apunta a obras públicas en general (institución real: el MOPT/las municipalidades). No es grave, pero la regla es nada que se burle de instituciones reales: mejor el chiste sin sujeto. La telenovela del sobrino y el gallo pinto son seguras. |
| 9 | `carreta.js:112` y `:115` | «…lleve madera pintada (de Sarchí, celeste, verde, amarilla o rosada)» / «¡Carreta recién pintada a lo Sarchí!» | «…lleve madera pintada (celeste, verde, amarilla o rosada)» / «🎨 ¡Carreta recién pintada!» | «de Sarchí» parece un color más en la lista. Sarchí es un pueblo real y la carreta pintada es cultura, no burla; la frase funciona mejor como adorno aparte que como un color. Por confirmar si «de Sarchí» es un ítem real de pintura. |
| 10 | `ui.js:2732` (aviso de fps) | «🐢 El juego va un poco lento. En Ajustes → Opciones de video, la calidad «Bajo» lo aliviana» (6 s) | «🐢 Va lento. Ajustes → Video → calidad «Bajo» lo alivia» | Largo para un toast; además la ruta en el menú debe calzar con el texto real del `index.html` (por confirmar que se llame «Opciones de video»). Frecuencia: una sola vez por perfil (`avisoFpsDado`), bien. |

## 2. Resto de la tabla (texto actual → propuesto)

| Dónde | Texto actual | Texto propuesto | Nota |
|---|---|---|---|
| `despensa.js:50` | «🥩 Lo que lleva muchos días guardado ya no rinde: cómalo pronto o sálelo» | «🥩 La comida guardada se echa a perder: cómala pronto o sálela» | Corto; «rinde» es ambiguo. |
| `despensa.js:100` | «La fogata ya tiene toda la leña que cabe (8)» | «🔥 La fogata está llena (8 leñas)» | Menos largo. |
| `despensa.js:105` / `:167` | «Leña en la fogata: N de 8» / «Leña en el fogón: N de 16» | (sin cambio) | Bien: corto y con dato. |
| `despensa.js:161` / `:176` | «El fogón ya está lleno de leña (16)» / «Al fogón se le acabó la leña: clic derecho al fogón con leña en la mano» | «🔥 El fogón está lleno (16 leñas)» / «🔥 Al fogón se le acabó la leña: échele» | Redundante. |
| `despensa.js:199` y `:203` | consejo «Una mesa, una silla y un plato servido: se come mejor sentado» + toast «Comer sentado a la mesa rinde más. Provecho.» | Quitar el consejo o el toast | Mismo mensaje dos veces; el toast sale al comer, el consejo al armar la mesa: dejar solo el toast. |
| `despensa.js:210-213` | «🍵 Agua de manzanilla: se le calmó el cuerpo. Ya puede dormir», «…jengibre: se le quitó el malestar y anda con más aguante», «Té de hierbabuena: panza tranquila y sin garrapatas», «Jarabe de sábila: paró la sangre y le volvió el color» | (sin cambio de tono) | Bien: «usted» implícito, sin género, tico moderado. Solo acortar el de jengibre a «se le quitó el malestar y le sobra aguante». «Té de hierbabuena… sin garrapatas» sorprende: el efecto real es quitar garrapatas (código en `:212`); confirmar que la ayuda lo diga igual (sí lo dice). |
| `despensa.js:230` | «🦠 Se le echó a perder comida (N): ahora son sobras para la compostera» | «🦠 Se echó a perder comida (N): quedó como sobras para la compostera» | «Se le echó» es válido y neutro; solo suavizar. |
| `despensa.js:236` | «Con sal y el fogón, la carne dura semanas» | (sin cambio) | Bien. |
| `finca2.js:22` | «Ya participó hoy. El otro sábado hay otro concurso, ¡no se lo pierda!» | (sin cambio) | Bien. |
| `finca2.js:36` / `:39` | «¡Ganó el concurso de la mejor cosecha con X! Veinte unidades y el listón» / «Este sábado ganó Doña Tere con una cosecha más grande. Su X se queda con usted: ¡el otro sábado!» | «🥈 Este sábado ganó Doña Tere con una cosecha más grande. Su cosecha de X vuelve a su bolsa: ¡el otro sábado!» | La segunda frase es confusa («se queda con usted» suena a premio). |
| `finca2.js:49` | «Un zaguate se hace de la familia: le gusta comer cada dos días» | «🐕 Un zaguate se encariña si lo alimenta cada dos días» | Más claro. |
| `finca2.js:53` | «anda de vago: hace días que no come» | «🐕 «X» tiene hambre: hace días que no come» | «anda de vago» insinúa pereza, el dato es hambre. |
| `finca2.js:57` | «¡X ya es de toda la vida! Pelea más duro (lealtad 3)» / «…le lamió la mano! Ya le tiene confianza: trae cosas más seguido (lealtad 2)» | «🐕 ¡X ya es de la familia! Pelea más duro» / «🐕 ¡X le lamió la mano! Ahora trae cosas más seguido» | Largos (~95) y con «lealtad N» entre paréntesis, que es dato técnico. |
| `economia.js:34` | «Feria del agricultor: hoy X se paga N % (véndalo en el pueblo)» | «📈 Feria: hoy X se paga N %» | Corto. Por confirmar: el consejo (:30) dice «25 % más» pero este calcula N % real; si N no es 125 hay contradicción visible. |
| `temporadas.js:62` | «☔ El aguacero de las dos, como siempre: mejor bajo techo» | (sin cambio) | Bien. |
| `temporadas.js:71` | «🏠 El zinc suena bonito bajo la lluvia… y no hay goteras si está bien puesto» | «🏠 Techo de zinc bien puesto: sin goteras» | Largo y no da instrucción. |
| `temporadas.js:82` / `:86` | «Le entró el frío: arrímese a la fogata o póngase la cobija» / «Hace un calor que no se aguanta: busque sombra y tome agua» + consejo «Con calor, la sed sube: un sombrero de paja ayuda» | Quitar el consejo del calor o fundirlo: «🥵 Hace calor: busque sombra, tome agua y use sombrero de paja» | Toast y consejo juntos en el mismo evento. |
| `temporadas.js:108` / `:112` | «Ya anda bien abrigado» / «Se envolvió en la cobija de lana: 4 minutos calientito» | (sin cambio) | Bien. |
| `temporadas.js:119` | «Entró el invierno: aguaceros casi todas las tardes. Los cultivos se alegran» / «Entró el verano: época seca, cuide el agua» | (sin cambio) | Bien. |
| `temporadas.js:20-24` (`pronostico`) | «Mañana: aguacero a las dos, como siempre» / «Ya va aflojando el invierno…» / «Se viene el invierno: alisten el capote» / «Sol y calor, época seca…» | (sin cambio) | Bien. Ojo: «Se viene el invierno» sale cuando quedan ≤ 4 días **de verano**, pero el texto de arriba (`:119`) dice «Entró el invierno» al cambiar, repite la misma idea sin gravedad. |
| `cuerpo.js:18` | «Al caer de alto, toque rodar justo antes de llegar al suelo: el golpe pega menos» | «🤸 Al caer de alto, toque rodar justo antes del suelo: el golpe pega menos» | Largo. Por confirmar el nombre de la tecla en el texto. |
| `cuerpo.js:27` | «¡Cayó como gato de potrero!» | (sin cambio) | Bien. |
| `cuerpo.js:95` | «🥱 Qué sueño…» | (sin cambio) | Bien. |
| `cuerpo.js:111` / `:112` | toast «Se le arregló la pierna, pero cojea un rato: no corra todavía» + consejo «Con la pierna recién curada no se puede correr un rato» | Quitar el consejo | Mismo mensaje. |
| `muebles.js:57` | «En la silla se descansa (menos cansancio y hambre). Muévase para levantarse» | (sin cambio) | Bien. |
| `muebles.js:87` / `:88` | «La mecedora lo deja como nuevo» / «Ya se meció bastante: la mecedora vuelve a curar en 5 minutos» | «🪑 La mecedora lo repone» / «🪑 Ya se meció bastante: vuelve a curar en 5 minutos» | «lo deja» marca género masculino (**regla de neutro**). Mismo problema en otros textos con pronombre de objeto: buscar «lo/la» fuera de nombres propios. |
| `mascotas.js:64` | «Ahora se llama «N» (otro clic para cambiarlo; Mayús + clic, escribirlo)» | «🏷 Ahora se llama «N»» | El paréntesis es instrucción que se puede ir a la ayuda. |
| `carreta.js:126` | «¡Arre, bueyes! W avanza · S frena · A/D dobla · Shift se baja» | (sin cambio) | Bien (teclas, jerga tica). |
| `supervivencia3.js:93` | «¡Una gotera! Hay un hueco en el techo justo encima» | «💧 ¡Gotera! Hay un hueco en el techo» | Corto. |
| `supervivencia3.js:103` | «Lleva la ropa empapada: gasta más comida y de noche da frío. Al lado de una fogata se seca rápido» (~100) | «🌧 Ropa empapada: gasta más comida y da frío. Séquese junto a una fogata» | Largo; «Lleva» no usa «usted». |
| `supervivencia3.js:134` | «Dos noches sin dormir: más lento y ve borroso. Cama o café» | (sin cambio) | Bien. |

## 3. Frecuencia real de los avisos nuevos (por código, no medida)

El Locutor deja pasar 6 textos por minuto, no repite el mismo (`DUP_MS` = 20 s), deja 8 s de calma tras una pelea y bota los ambientes si hay cola. Cada aviso de v12 se arma así:

| Aviso | Cuándo sale | Frecuencia máxima | ¿Se amontona? |
|---|---|---|---|
| Aguacero de las dos (`temporadas.js:62`) | una vez por día de invierno, en la ventana 0.3125–0.375 | 1/día, solo en invierno (30 días de 60) | Se suma al consejo del zinc (`:71`, una sola vez en la vida). Sin choques. |
| Frío / calor (`temporadas.js:82`, `:86`) | al entrar el efecto (no al recibirlo de nuevo) | depende del clima; en una ruta mixta (playa de día, páramo de noche) puede alternar cada pocos minutos | Posible **ráfaga** al caminar entre biomas: frío ↔ calor. No hay tope propio; solo el DUP de 20 s. Por confirmar jugando. |
| Cambio de temporada (`:119`) | 1 cada 30 días | 1/30 días | Nada. |
| Feria (`economia.js:30`, `:34`) | cada día 6 de 7 | 1 toast + 1 consejo (el consejo solo la primera vez) + 1 toast del producto mejor pagado | Hasta **3 textos** el mismo día. Es el caso más cargado. |
| Molienda (`finca2.js:160`) | una vez en cada uno de los 3 días de verano (20–22) y solo cerca de un pueblo | 1/día, 3 días por año | Tarda a salir hasta que haya pueblo cerca. Largo. |
| Lealtad del zaguate (`finca2.js:49-57`) | al subir/bajar nivel y la primera vez | hasta 3 por mascota, de a un nivel por día | Nada. |
| Despensa: comida pasada (`despensa.js:49`, `:50`) | al comer algo pasado (25 % de las veces) y consejo una vez | frecuente si el jugador deja mucha comida | Dos avisos casi al mismo tiempo. |
| Fogata (`despensa.js:96`, `:109`, `:110`, `:133`, `:142`, `:143`) | cada vez que se interactúa o la lluvia apaga | muy frecuente al cocinar | **6 redacciones** para 3 situaciones: unificar (#5 y #6). |
| Gotera (`supervivencia3.js:93`) | una sola vez por mundo (`goteraDicha`) | 1/mundo | Nada. |
| Fps (`ui.js:2732`) | una sola vez por perfil | 1 | Nada. |
| Radio / tele (`muebles.js:34`, `:43`) | al usarlas | por clic | Sin tope (aparece como toast, no consejo); si el jugador hace clic seguido salen muchos canales. El Locutor lo funde por clave igual a otro **solo si el texto es idéntico**. |

**Conclusión de frecuencias:** nada de lo nuevo se pasa de 6 por minuto por sí solo. Los riesgos reales son: (1) el sábado de feria (3 textos), (2) la fogata (6 redacciones), (3) frío ↔ calor alternando al cruzar biomas, y (4) tele/radio con clic repetido. Con las fusiones de la tabla 1 esos cuatro bajan.

## 4. Nombres de ítems y bloques: calce con ícono y receta

`revisar-nombres` no encuentra problemas de ids, claves, nombres ni íconos (322 ítems). Lo que no puede ver la herramienta y queda **por confirmar jugando**:

| Dónde | Nombre | Duda |
|---|---|---|
| `blocks.js:277`, `:283`, `:285` | ítems con paréntesis largos | Un nombre con paréntesis largo se corta en el slot del inventario; usar el nombre corto y poner el detalle en la ficha. |
| `blocks.js:585-600` | grupo de nombres de comida con paréntesis | Igual: verificar que la ficha (`fichaComida`) muestre bien «cruda/pasada/podrida» sin repetir el estado en el nombre. |
| `blocks.js:789-791` | ítems con paréntesis | Ídem. |
| Guarapo (`blocks.js`, id 574) | texto «da aire» en la ficha | No se pudo verificar el efecto real: por confirmar. |
| Agua de manzanilla / jengibre, té de hierbabuena, jarabe de sábila | ver `despensa.js:210-213` | Los cuatro nombres calzan con su efecto (manzanilla→calma/mareo, jengibre→panza, hierbabuena→garrapatas, sábila→sangre). La ficha de ayuda coincide. |

## 5. Reglas: lo que sí cumple v12

- «Usted» y trato respetuoso: casi todo bien («arrímese», «échele», «tenga a mano»). Excepciones: `supervivencia3.js:103` («Lleva…»).
- Neutro de género: bien salvo «la mecedora **lo** deja como nuevo» (`muebles.js:87`).
- Tico moderado: «gato de potrero», «zaguate», «a lo Sarchí», «Pura vida», «capote» están bien dosificados. Nada de caricatura.
- Instituciones reales: solo hay un caso débil (las calles/huecos de la tele, `muebles.js:12`). El Archivo Municipal y «La Vaquita» ya se declaran ficticios.
- Los 18 logros nuevos y los 5 temas de ayuda nuevos mantienen el tono; solo tres logros en primera persona o con la frase hecha invertida (#7).
- Plata: el único punto flojo es unidades vs colones en el concurso de feria (#2). Las fichas de comida y el banco usan «colones»; la molienda usa «unidad». Conviene una regla: **«unidades» en avisos de mundo, «colones» solo con banco o pulpería**.

## 6. Sugerencia de orden de trabajo para la constructora

1. #1, #5 y #6 (fusionar avisos de feria y de fogata): es lo que más cambia la sensación de «avisos repetidos».
2. #2 y #3 (plata y molienda).
3. #7 y #8 (logros y tele): solo textos.
4. Resto de la tabla 2, agrupado en un solo commit «textos v12».
5. Tras eso, correr `revisar-avisos` y `revisar-nombres` otra vez, y jugar una vuelta de sábado de feria + una tarde de aguacero con fogata + una ruta playa→páramo para ver si el Locutor aguanta.

*Escrito por la sesión investigadora. Solo lectura: no se corrió el juego y ningún texto del repo fue modificado.*
