# Guía de prueba

Para probar todo sin esperar 15 días de juego. Se abre con `npm run dev` y la consola del juego con **T** (o `/`).

## Lo más importante: una partida normal
Antes de usar trampas, conviene jugar una partida de verdad y anotar:
- ¿Se entiende qué hacer al empezar? ¿Y qué hacer cada capítulo?
- ¿Cuánto dura la primera noche? ¿Cuántas veces se muere uno?
- ¿La primera noche es justa? ¿El primer asedio (día 5)?
- ¿Se llega a descubrir lo nuevo sin leer el registro de cambios?
- ¿Hay demasiados avisos seguidos?
- ¿Los números cuadran con [BALANCE.md](BALANCE.md)? Ahí se ajusta lo que se sienta injusto.

**Lo que más me sirve de usted**: qué se sintió aburrido, injusto o confuso. Con eso se corrige casi todo rápido.

## Sonidos que nadie ha escuchado
Solo se comprobó que están y que entran. Hay que oírlos:

| Sonido | Cómo oírlo |
|---|---|
| Yunque | `/prueba cosas`, poner el yunque, una herramienta en la mano y clic derecho |
| Derrumbe | `/prueba derrumbe` |
| Chancleta | Comando `/dar chancleta_zenaida`, clic derecho hacia una Sombra |
| Latido con poca vida | Dejarse pegar hasta quedar con 2 corazones |
| Cencerro y golpes a la puerta | `/prueba asedio` con un cencerro y una puerta puestos |
| Música de pelea | `/prueba asedio` y esperar a que empiece |

## Comandos: `/prueba <cosa>`
Conviene usarlos en un mundo aparte, porque son trampa. `/prueba` solo muestra la lista.

### Equipo
| Comando | Qué hace |
|---|---|
| `/prueba equipo hierro 2` | Arma, herramientas y armadura de hierro con 2 estrellas, más comida y vendas. También `cuero`, `diamante` y `jade` |
| `/prueba cosas` | Una de cada cosa nueva: yunque, compostera, puntales, tranca, aceite, candela, esencia, chancleta, tablilla, bombetas, trampas, cencerro, trofeos… |
| `/prueba dia 15` | Salta a ese día, de mañana |
| `/prueba vida` | Vida, comida y agua llenas |
| `/prueba colones 200` | Colones |
| `/prueba manas` | Experiencia: la oferta de mañas se abre sola |
| `/prueba nemesis` | De noche llega la Sombra con nombre |

### La casa y la historia
| Comando | Qué hace |
|---|---|
| `/prueba casa` | Va a la casa de la abuela |
| `/prueba arreglada` | La da por arreglada y va ahí. Casi todo lo demás lo hace solo |
| `/prueba nivel 3` | Casa en ese nivel (1 a 4) |
| `/prueba capitulo 5` | Salta a ese capítulo (1 a 9) |
| `/prueba final` | La Noche Larga, con los cuatro pedazos |
| `/prueba terminada` | Da la historia por terminada, y deja el Corazón en la mochila |

### Peleas
| Comando | Qué hace |
|---|---|
| `/prueba asedio` | Asedio a la casa. Dura unos minutos |
| `/prueba apuro` | Lleva a un pueblo al atardecer: tocan la campana y vienen Sombras por la plaza |
| `/prueba ceniza` | Deja el Corazón y la noche. Póngalo en el suelo y déle clic derecho para la Noche de Ceniza |
| `/prueba ladrona` · `/prueba grande` | Una Sombra de esas a la derecha |

### Sistemas y personajes
| Comando | Qué hace |
|---|---|
| `/prueba nido` | Crece un nido; la brújula lo marca |
| `/prueba hallazgo` | Camine un poco y aparece adelante |
| `/prueba mina` | Igual, pero una boca de mina |
| `/prueba derrumbe` | Se viene el techo (hay que estar bajo techo) |
| `/prueba rigo` | El tío Rigo: hablarle varias veces, con colones |
| `/prueba canelo` | El perro de la abuela: darle comida |
| `/prueba buhonero` | Don Carlos con la tienda |
| `/prueba peon` | Don Chepito. Hablarle dos veces con 40 colones y sembrar cerca |
| `/prueba guila` | Yendry, tras el final: tres lecciones y la carta |
| `/prueba escondite` | El primer escondite de Zenaida |
| `/prueba plato` | Tres platos servidos y dos vacíos, de noche. Póngalo y espere |
| `/prueba expediente` | Arranca la Ruta del Progreso (hay que estar cerca de la casa). Hoja, ocho firmas y escritura |
| `/prueba gente` | Arranca el siguiente rescate (🆘 en la brújula). Después, una cama de sobra en la casa |
| `/prueba caserio` | Los cuatro viven en la casa. Hablarles dos días seguidos da los encargos |
| `/prueba prima` | Llega la prima Marielos. Hablarle y repetir el comando la hace avanzar |
| `/prueba correo` | Don Chema sube con la carta que siga. Hablarle para recibirla |
| `/prueba bravos` | Pone delante saínos, chupacabras, Toro Guaco y Chatas (o uno: `/prueba bravos chata`). Para ver al Toro y al chupacabras, de noche |
| `/prueba bailarin` | El forastero elegante delante: háblele tres veces, o mírele los pies de cerca para pelear |
| `/prueba playa2` | Corriente de resaca, aguamalas y rayas en la playa más cercana |
| `/prueba asalto` | Los Chatas asaltan la pulpería del pueblo: dos minutos para llegar |
| `/prueba lahar` | Un lahar baja desde donde mira: cinco segundos para quitarse de lado |
| `/prueba palo` | Un palo encebado delante: péguese y brinque (Espacio) una y otra vez |
| `/prueba toros` | Un redondel con su toro: aguante 30 segundos adentro, o clic derecho al toro para montarlo (A y D, ocho segundos) |
| `/prueba chapulines` | Siembra una milpa delante y le suelta la nube encima: golpes al aire, fogata o gallinas |
| `/prueba torsalo` · `/prueba bala` · `/prueba bocaraca` | Un tórsalo (chicharrón con clic derecho), la picada de hormiga bala, o una bocaracá que cae encima |
| `/prueba goleta` | La goleta fantasma (mejor de noche, en un bote mar adentro): cañonazos, seis ánimas marineras y el capitán |
| `/prueba pezvela` | Un pez vela en la línea (con la caña en la mano): clic derecho para recoger, sin reventar la cuerda |
| `/prueba bomba` | En un pueblo: un vecino grita «¡Bomba!» y echa una copla, línea por línea |
| `/prueba lunaroja` | Pone la noche de luna roja: cinco oleadas de Sombras, una cada 70 s; al amanecer, el botín si tumbó seis de cada diez |
| `/prueba minaoro` | La mina de Abangares delante: escalera, túnel con rieles, vagoneta (clic derecho), galerías de oro y Don Eliseo al fondo |
| `/prueba festival` | Cerca de un pueblo con calles (mejor de noche): pasa el desfile de carrozas del Festival de la Luz |
| `/prueba rifa` | Cinco fracciones y salta al domingo a mediodía: la radio canta la rifa |
| `/prueba abigeato` | Una vaca delante y dos Chatas que se la llevan con mecate: tumbe al que la jala |
| `/prueba concurso` | La mesa del concurso de gallo pinto delante, con dos pintos con huevo: clic derecho al jurado |
| `/prueba serenata` | Un serenatero a unos pasos, de noche: toca un pasillo con notas de arpa; clic derecho para darle ₡2 y que toque otra |
| `/prueba clasico` | Salta al domingo en la tarde: cerca de un pueblo, el clásico por la radio con goles y la gente celebrando |
| `/prueba terremoto` | El terremoto grande: a media sacudida se abre una grieta cerca; después, tres réplicas |
| `/prueba impostor` | De noche, alguien con ropa de vecino quieto contra una pared: acérquese o háblele |
| `/prueba furtivos` | Tres cepos adelante (uno con un animal) y el cazador: agáchese junto a cada cepo para desarmarlo |
| `/prueba perezoso` | Un perezoso cruzando delante: clic derecho para cargarlo y llévelo junto a un tronco |
| `/prueba incendio` | En un pueblo: se prende una casa; apáguela con baldes de agua o espere a los bomberos (75 s) |
| `/prueba chompipe` | Un chompipe adelante: arrímesele y abre la cola y lo corretea |
| `/prueba globo` | El globo de Don Fito delante: clic derecho a la canasta (₡15) y a volar |
| `/prueba ranas` | Tormenta con lluvia de ranas por medio minuto |
| `/prueba arcoiris` | Un arcoíris doble del lado contrario del sol |
| `/prueba fauna4` | Un oso hormiguero, una martilla y una pava, delante |
| `/prueba carrera` | Arma la pista de la carrera de carretas junto al pueblo: móntese en la del medio y espere la cuenta |
| `/prueba fumigadora` | La avioneta fumigadora hace cuatro pasadas encima de usted (quédese debajo y verá) |
| `/prueba panga` | En una playa: llega la panga de Don Macario y vende pescado (clic derecho, ₡6 tres) |
| `/prueba armas` | Espada, hacha, mazo, lanza, garrote y machete en la barra y tres muñecos delante. Pruebe:<br>- la cadena de golpes y el remate;<br>- «¡Débil!» y «Resiste» (la Sombra al corte, el alacrán a lo contundente);<br>- el escudo que se rompe con hacha o mazo;<br>- quedarse sin aire;<br>- el mazazo en área;<br>- cubrirse con el arma (clic derecho) |
| `/prueba bichos3` | Los seis bichos de bioma delante (o uno: `bichos3 escarabajo`). Pruebe:<br>- la telaraña de la bananera;<br>- el escarabajo que escarba, embiste y se estrella contra un árbol;<br>- el escupitajo del sapo al pegarle de cerca;<br>- el zigzag del ciempiés;<br>- la luz mala que se apaga (de noche);<br>- la tenaza que ataja y contesta |
| `/prueba jefes2` | La Reina Bananera delante y dos ofrendas. Para los otros: `jefes2 cornudo`, `tata`, `cascabel`, `cangrejo` o `ciempies`. Pruebe:<br>- la telaraña en abanico, las crías, el salto y el veneno de la segunda fase;<br>- que Don Cornudo se trabe contra un árbol y los pisotones;<br>- los trofeos y sus recetas (mazo de cuerno, chaleco de seda) |
| `/prueba zopilote` | El Rey Zopilote viene volando, y le da la Corona, las Alas del Rey y 16 bombetas. Pruebe:<br>- las picadas y que solo se le pega posado;<br>- los rayos y las plumas de la segunda fase;<br>- los aletazos y la ceniza de la tercera;<br>- el trofeo y los créditos («Seguir jugando»);<br>- planear (Espacio en el aire) y el empujón de la bombeta.<br>`/prueba zopilote creditos`: solo los créditos |
| `/prueba fuerza` | Tres comidas buenas en la mochila y queda descansado. Pruebe:<br>- comérselas y ver subir los corazones y el aguante, con los iconitos encima de los corazones;<br>- que la misma comida no se repite hasta que se baje;<br>- quedarse quieto bajo techo junto a una fogata (descansado) |
| `/prueba estrellas` | Una Sombra ★ y una ★★ delante: más grandes, con estrellas doradas sobre la cabeza, más vida y más golpe. Al vencerlas sueltan y dan más |
| `/prueba ermitas` | Dos ermitas en la mochila: ponga una aquí y otra lejos, y con clic derecho viaje entre ellas |
| `/prueba incursion` | Una incursión del monte alrededor de usted (la de un jefe vencido, o la de la Reina): dos tandas, y premio si se vencen todas |
| (sin comando) Conjuntos de armadura | Póngase las cuatro piezas de cuero, hierro, diamante o jade: sale el aviso del conjunto. Pruebe:<br>- cuero: ir más rápido y que agachado lo noten de más cerca;<br>- hierro: que cubrirse gaste menos aire;<br>- diamante: más daño;<br>- jade: que la vida suba sola |
| (sin comando) Esquive perfecto | Ruede (V) justo cuando una Sombra va a pegar: cámara lenta, le devuelve aire, y el próximo golpe sale «¡Contraataque!» |
| (sin comando) La cadena de golpes | Con la espada, pegue seguido: debajo de la mira se llenan los rombitos y el tercero (naranja) es el remate |
| `/prueba abejas` | Un enjambre de abejas africanizadas delante. Pruebe que lo persiga, meterse al agua para que pierda el rastro, y una antorcha en la mano para mantenerlas a raya |
| (sin comando) El gancho | Haga el gancho (3 hierros y 2 cueros), apunte a un acantilado o a un árbol lejos y clic derecho: lo jala hasta allá. Espacio lo suelta |
| `/prueba muneco` | Un muñeco de práctica: póngalo, péguele (cada 3 s dice el daño por segundo), clic derecho para cambiarle el material y ver «¡Débil!» o «Resiste»; agachado y clic derecho lo recoge |
| `/prueba hongos` | Un hongo reventón delante: acérquese a menos de 3 (se infla y revienta) o revéntelo de lejos |
| `/prueba trenfantasma` | Junto a una estación del tren: pasa el tren fantasma por la vía (párese en los rieles si se atreve) |
| `/prueba tsunami` | En una playa, mirando al mar: el mar se recoge y a los 20 s entra la ola. Súbase a lo alto |
| `/prueba procesion` | Pasa la procesión de las ánimas cerca: acompáñela 25 s, o péguele a una |
| `/prueba sebusca` | Pega un cartel de «Se busca» (o `/prueba sebusca puma`); con `/prueba bravos <tipo>` sale la criatura delante |
| `/prueba marabunta` | Una marabunta a 16 bloques viene hacia usted. Hágase a un lado, o póngale una antorcha adelante |
| `/prueba neblina` | Cae la neblina del Cerro aunque no sea el páramo. Quédese quieto sin fuego para ver las almas en pena |
| `/prueba quema` | Prende una quema delante (mirar a zacate o árboles). Apagarla con un balde de agua, o dejarla y ver que se acaba sola. Si llueve después, lo quemado rebrota. A la tercera apagada llega la bomba de espalda |
| `/prueba archivo` | Pone el Archivo Municipal cerca (📁 en la brújula). Tres sellos, reja y jefa |
| `/prueba epilogo` | Muestra la pantalla del final, sin tocar la partida. Cualquier tecla la cierra |
| `/prueba album` | 10 sobres de estampas. Clic derecho para abrirlos; el álbum es la tecla I |
| `/prueba grieta` | Pone la Grieta cerca, con 3 gallos pintos: el arco de Anselmo después del final |
| `/prueba inspector` | El Lic. Porras, de la Municipalidad ficticia: hablarle dos veces |
| `/prueba playa` | Cangrejos, ermitaños y Don Macho con la atarraya, de amanecida |

## Lista de cosas por mirar
- [ ] **El prólogo** al crear un mundo nuevo: que se lea y no estorbe.
- [ ] **La primera noche** sin trampas.
- [ ] **Comer rápido** (mantener G) y **poner antorcha** (X) mientras se pelea o en una cueva.
- [ ] **Yunque**: las estrellas en el inventario y la ficha.
- [ ] **Chancleta**: que se sienta bien tirarla.
- [ ] **Números de daño** y la **marca roja** de dónde vino el golpe: ¿ayudan o estorban? Los números se apagan en Ajustes.
- [ ] **Borde rojo con poca vida**: ¿exagerado?
- [ ] **La ruta (J)**: que se entienda y quepa. La rueda baja el panel.
- [ ] **Mañas**: ¿se abre en buen momento? ¿Hay alguna que nadie escogería o que sea obligatoria?
- [ ] **La Sombra con nombre**: dejarse matar por una Sombra y esperarla a la noche siguiente. ¿Da gusto vencerla?
- [ ] **Los cigarros de Anselmo**: leer las páginas en orden, y la escena de Rigo al final. ¿Se entiende? ¿Pega?
- [ ] **El Olvido**: ¿se entiende que hay que cubrirse cuando respira hondo?
- [ ] **Plato servido**: ¿se nota que la Sombra viene en son de paz? ¿Se deja de usar pasadas las primeras?
- [ ] **La audiencia**: ¿se descubre lo del plato? ¿Son muy lejos las firmas o la plaza?
- [ ] **Pendientes** en la hoja de la partida: ¿sirven al volver a jugar?
- [ ] **Rescates**: ¿salen muy seguido o muy poco? ¿Se entiende lo de la cama de sobra?
- [ ] **Sueños**: ¿se alcanzan a leer? ¿Dan ganas de dormir para ver el siguiente?
- [ ] **La ficha de los objetos**: ¿se lee bien? ¿Es mucho texto?
- [ ] **Encargos**: ¿vale la pena el viaje? ¿Se ven bien las ruinas y el mirador?
- [ ] **La prima Marielos**: ¿cae bien o cansa? ¿La carta pega?
- [ ] **El correo**: ¿llegan muy seguido o muy poco? ¿Dan ganas de leerlas?
- [ ] **El Archivo Municipal**: ¿da gusto recorrerlo? ¿Se entiende el sellazo de la Jefa?
- [ ] **Olla y alambre**: ¿valen el hierro? ¿La olla se queda sin carbón muy rápido?
- [ ] **Sombra apagadora**: ¿molesta bien o molesta mal?
- [ ] **Hoja de Ayuda** (tecla Y) y el consejo al morir: ¿ayudan de verdad?
- [ ] **Los noventa de Doña Eulalia**: ¿se nota la pista? Es a propósito que lo diga una sola vez
- [ ] **El álbum**: ¿dan ganas de llenarlo? ¿Salen muchas o pocas repetidas?
- [ ] **Avisos**: ¿demasiados seguidos en la mañana?
- [ ] **Noche de Ceniza**: ¿hasta qué oleada se llega? Buena para video.
- [ ] **Texto de la carta de Yendry**: se arma con lo que pasó en la partida.
- [ ] Que no haya objetos con ícono raro: los de las reliquias y los 10 últimos están dibujados a mano.

## Si algo falla
Abrir la consola del navegador (F12) y copiar el error en rojo. Con eso y lo que estaba haciendo, se corrige rápido.
