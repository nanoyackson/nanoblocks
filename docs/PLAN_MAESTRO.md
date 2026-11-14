# Plan maestro de NanoBlocks

> Plan vigente (7-nov-2026): [PLAN_MAESTRO_18.md](PLAN_MAESTRO_18.md) — «Que valga la pena sobrevivir». Completos: el 17 ([PLAN_MAESTRO_17.md](PLAN_MAESTRO_17.md), v3.59), el 16 ([PLAN_MAESTRO_16.md](PLAN_MAESTRO_16.md), v3.56–v3.58), el 15 ([PLAN_MAESTRO_15.md](PLAN_MAESTRO_15.md), v3.54–v3.55), el 14 ([PLAN_MAESTRO_14.md](PLAN_MAESTRO_14.md), v3.53), el 13 ([PLAN_MAESTRO_13.md](PLAN_MAESTRO_13.md), v3.52), el 12 ([PLAN_MAESTRO_12.md](PLAN_MAESTRO_12.md), v3.51), el 11 ([PLAN_MAESTRO_11.md](PLAN_MAESTRO_11.md), v3.50), el 10 ([PLAN_MAESTRO_10.md](PLAN_MAESTRO_10.md), v3.47–v3.49), el 9 ([PLAN_MAESTRO_9.md](PLAN_MAESTRO_9.md), v3.43–v3.46), el 8 ([PLAN_MAESTRO_8.md](PLAN_MAESTRO_8.md), v3.37–v3.42), el 7 ([PLAN_MAESTRO_7.md](PLAN_MAESTRO_7.md), v3.26–v3.36), el 6 ([PLAN_MAESTRO_6.md](PLAN_MAESTRO_6.md), v3.17–v3.25), el 5 ([PLAN_MAESTRO_5.md](PLAN_MAESTRO_5.md), v3.5–v3.16), el 4 ([PLAN_MAESTRO_4.md](PLAN_MAESTRO_4.md), v2.80–v3.4) y el 3 ([PLAN_MAESTRO_3.md](PLAN_MAESTRO_3.md), v2.60–v2.79).

Objetivo: un juego de bloques **original** con tanto contenido como los grandes del género, pero con identidad
propia: **Costa Rica**. Se toman como aprendizaje las ideas que hicieron grandes a los juegos de bloques
(mundos ricos, progreso, criaturas, construcción, aventura RPG estilo *cube world*), sin copiar nombres,
criaturas, arte ni estructuras de ningún juego existente.

Reglas de trabajo en cada actualización:
1. Implementar → `npm run lint` y `npm run build` en cero → probar en el navegador (lógica + captura) → commit con etiqueta.
2. Los mundos guardados nunca se rompen (migraciones; generador por versión).
3. Changelog en el juego (Novedades) y en `CHANGELOG.md`; árbol en `docs/ARBOL_CONOCIMIENTO.md`.

Estado: ✅ hecho · 🔨 en curso · ⏳ pendiente

---

## ✅ Hecho hasta ahora
- 1.0 Mundo infinito, física, supervivencia, crafteo, Danta y Sombra, dinamita, guardado.
- 1.1 Arte y sonido pulidos, ítems en el suelo, animaciones.
- 1.2 Estaciones (mesa, horno, cofre, puerta), cámara de cine, sonidos reales, horizonte lejano.
- 1.2.1 Arreglos del video, ordenar estilo Terraria.
- 1.3 Cuevas ricas, jade, volcanes, selva, ruinas, agua/lava con niveles, cultivos, armadura.
- 1.4 Clima (lluvia, tormenta, nieve, relámpagos), partículas de ambiente, lapas, monos congos, murciélagos, cama.

---

## ✅ 1.5 — Fauna de Costa Rica I (comportamientos profundos)
Cada animal con modelo propio, animaciones, sonido, comportamiento y **utilidad**:
- **Perezoso** (de dos y tres dedos): cuelga de los árboles, se mueve lentísimo, baja al suelo de vez en cuando. Acariciarlo da *Calma* (el hambre baja más lento).
- **Mono cara blanca**: travieso; roba ítems tirados y huye a los árboles; se lo puede "sobornar" con banano para que deje de molestar.
- **Tucán**: come frutas; si lo domesticás con papaya te avisa de árboles frutales cercanos (vuela hacia ellos).
- **Quetzal**: rarísimo, solo en bosque nuboso; verlo de cerca da un logro y a veces suelta una *Pluma de quetzal* (ingrediente del amuleto de suerte).
- **Jaguar**: depredador de la selva de noche; acecha agachado y se lanza si te acercás; pelea fuerte. Los perros de finca lo espantan.
- **Cocodrilo**: en ríos y desembocaduras (homenaje al puente del Tárcoles); acecha bajo el agua y muerde a quien nada cerca.
- **Tortuga marina**: de noche suben a la playa a desovar (arribada); los huevos eclosionan y las tortuguitas corren al mar. Protegerlas da reputación.
- **Rana calzonuda** (ojos rojos): croa en la lluvia y de noche, salta. **Rana dardo** roja: tocarla envenena; con ella se hacen *dardos venenosos*.
- **Colibrí**: zumba alrededor de las flores; los cultivos cerca de flores crecen más rápido (polinización).
- **Mariposa morfo azul**: vuela en la selva; se puede atrapar con una red en un *frasco* (decoración que brilla).
- **Terciopelo** y **bocaracá**: serpientes venenosas en el pasto y en ramas; mordida = veneno. Cura: *Suero antiofídico* (homenaje al Instituto Clodomiro Picado).
- **Pizote**: andan en manadas, husmean el suelo, se meten a los cultivos.
- **Iguana / garrobo**: toman sol en rocas y troncos, bajan corriendo al asustarse.
- **Abejas meliponas**: colmenas en troncos; sin aguijón; dan *miel* (comida y medicina).
- **Danta** (mejorada): se domestica con frutas, te sigue y carga un cofre (animal de carga).
- **Murciélago** (mejorado): deja *guano* en las cuevas = abono que acelera cultivos.

## ✅ 1.6 / 1.7 — Finca tica y cocina tica (banano, pejibaye, piña, arroz y yuca quedan para más adelante)
- **Gallina** (huevos), **vaca** de Guanacaste (leche, cuero), **perro de finca** (te sigue, ataca Sombras y espanta jaguares), **caballo criollo** (montura, con **albarda**).
- Domesticar, alimentar, reproducir, ponerles nombre (etiqueta).
- Cultivos nuevos: **café** (cafetal, *coger café* en temporada), **caña de azúcar** → *trapiche* → **tapa de dulce**, **banano**, **plátano**, **pejibaye**, **papaya**, **piña**, **cacao**, **yuca**, **arroz** (en agua).
- Cocina tica: *chorreador* para **café chorreado**, **agua dulce**, **gallo pinto con huevo**, **casado**, **chifrijo**, **tamales**, **arroz con leche**, **natilla**, **plátano maduro**, **agua de sapo**, **pejibaye con mayonesa**.
- Olla de cocina (estación nueva) con animación de cocinar.

## ✅ 1.8 — Pueblos ticos y comercio (sabaneros con ganado y carreta de Sarchí quedan para más adelante)
- Pueblitos generados: **pulpería**, **soda**, **iglesia** con plaza, **plaza de fútbol** con marcos, casas de adobe y de madera con tejas, **parada de bus**.
- Vecinos (NPC) con nombres ticos, diálogos ("¡Pura vida!", "Diay mae", "¡Qué chiva!"), horarios (de día trabajan, de noche en la casa).
- **Colones** (monedas y billetes) y comercio: el pulpero compra y vende; misiones simples ("traeme 10 mazorcas").
- **Sabaneros** en Guanacaste con ganado; **boyeros** con **carreta de Sarchí** pintada (bloque decorativo y transporte).

## ✅ 1.9 — Mar y costa (tabla de surf y manglares quedan para Biomas 2.0)
- **Bote** (remo) y **tabla de surf** que agarra olas en playas del Pacífico.
- **Ballena jorobada** (salta y canta), **delfines** que nadan junto al bote, **tiburón martillo** (Isla del Coco), peces de colores, **arrecife de coral**, **manglares**.
- **Pesca** con caña: peces, chatarra, tesoros. Cocinar pescado → *ceviche*.
- **Naufragios** con cofres.

## ✅ 2.0 — Leyendas ticas (clases, calabozos grandes, encantamientos y brebajes quedan pendientes) · antes «Aventura»
- **Niveles de jugador y experiencia**, puntos de habilidad (fuerza, agilidad, minería, cocina).
- **Clases opcionales**: guardaparques, minero, agricultor, explorador.
- **Calabozos** temáticos (ruinas precolombinas grandes, minas abandonadas de oro de Abangares) con **jefes**:
  - *El Cadejos* (perro negro gigante de la leyenda), *La Segua*, *El Padre sin Cabeza*, *La Llorona* — leyendas ticas como jefes de noche.
- Armas nuevas: **machete** (corta pasto y caña rapidísimo), **arco** y **flechas**, **honda**, **lanza** precolombina.
- Encantamientos originales con **jade** y **oro precolombino**: *Filo del jaguar*, *Vista de lapa*, *Piel de cocodrilo*.
- Pociones / brebajes de plantas medicinales (sábila, hombre grande, manzanilla).

## 🔨 2.2 — Biomas y mundo (✅ nuboso, manglar, bosque seco, guanacaste, ceiba, aguas termales, estaciones · ✅ páramo en las cumbres sin nieve (2.52), cataratas, puentes colgantes, Poás, isla del Coco)
- Biomas nuevos: **bosque nuboso** (Monteverde, niebla, musgo en los troncos, quetzales), **páramo** (Chirripó, frío, pajonales), **manglar**, **bosque seco** de Guanacaste (árbol de guanacaste gigante, temporada seca), **sabana**, **llanuras del Caribe**, **cafetales** en las faldas, **isla del Coco** (isla en el mar).
- **Cataratas** (tipo La Fortuna), **aguas termales** junto a volcanes, **puentes colgantes** generados entre árboles, **cráter con laguna ácida** (tipo Poás).
- Árboles grandes: **ceiba**, **guanacaste**, **higuerón** (con raíces), palmeras de coco.
- Estaciones del año: **verano** e **invierno** ticos (seca y lluviosa) que cambian el clima y los cultivos.

## 🔨 2.1 — Construcción (✅ losas, escaleras, cercas, faroles, bombetas · ✅ tirolesa (2.47), portones, cortinas, macetas y palanca (2.49) · ✅ luces con palanca (2.52) · ⏳ botones)
- Escaleras, losas, cercas, vallas, portones, ventanas, faroles colgantes que se mecen, cortinas, alfombras, macetas.
- **Mecanismos**: palancas, botones, placas de presión, cables de cobre, pistones, puertas automáticas, rieles con vagoneta.
- **Canopy**: cable entre árboles para tirarse en tirolesa.
- **Fuegos artificiales y bombetas** para fiestas.

## ✅ 2.5 — Otra dimensión: **El Inframundo Volcánico** (falta: jefe El Señor del Arenal)
- Se entra por un portal de **obsidiana y jade** dentro de un volcán. Cavernas de magma, ríos de lava, **basalto columnar**, hongos de fuego, criaturas de ceniza.
- Recursos nuevos: **azufre**, **piedra pómez**, **oro volcánico**; jefe final: *El Señor del Arenal*.

## 🔨 2.3 — Calidad de vida y presentación (✅ mapa del mundo, música de marimba · ✅ tercera persona (2.48) · ✅ logros con íconos (2.50) · ✅ subtítulos de sonidos (2.52) · ⏳ más accesibilidad, multijugador)
- Mapa y brújula, **mapa del mundo** en pantalla, marcadores.
- Logros con íconos, estadísticas.
- Música original generativa por bioma (marimba, guitarra, quijongo).
- Modo **tercera persona** (F5) con modelo del jugador animado y skins.
- Multijugador local (en red) como meta grande.
- Accesibilidad: subtítulos de sonidos, daltonismo, controles configurables, control de mando.

## 🔨 2.6–2.8 — Costa Rica monumental (pedido de nanoyackson 7-nov)
- ✅ 2.6: Faro de Puntarenas, puesto de Churchill, muelle de Caldera, Fortín de Heredia, carretas, estatuas, Fuente de la Hispanidad.
- ✅ 2.7: San José (Parque Central, Teatro Nacional, Catedral, Casa Amarilla, Mercado Central) y guanacaste sembrable.
- ✅ 2.8: Arenal (erupciones), Poás (laguna ácida), Chirripó (páramo, cumbre, refugio).
- ✅ 2.9: Teatro Nacional con arte y mural; carreta con ruedas grandes.
- ✅ 2.10: iluminación más realista (sol cálido, hora dorada, luna azul, antorchas anaranjadas).
- ✅ 2.11: Basílica de los Ángeles, Ruinas de Cartago, Iglesia de Orosi, puente del Tárcoles.
- ✅ 2.12: segunda dimensión, las Tierras del Cielo.
- ✅ 2.13: Ruinas de Cartago y Fortín gigantes, guanacaste monumental, descubrimiento con rareza y logros, generador v6.
- ✅ Jefe del inframundo: El Señor del Arenal (2.30).

## 🔨 2.13+ — Prompt maestro «Costa Rica» (nanoyackson 7-nov)
Etapas en orden; cada una sale como versión propia, en mundos nuevos (generador v6+).
- ✅ Registro de estructuras con rareza, descubrimiento, sin traslapes, legendarios escasos (2.13).
- ✅ Pueblos completos (2.14): parque con quiosco, iglesia de dos torres, escuela con bandera, minisúper, cantina, carnicería, panadería, Ebáis, municipalidad, postes y cables, casas de zinc/bloques/madera/adobe, ventas de frutas; ciudades con banco, súper, ferretería, bomba, taller, bomberos, liceo y terminal. ⏳ redondel, feria del agricultor, cementerio.
- ✅ Carreteras entre pueblos (2.15): huecos de verdad, parches de varios materiales, charcos, cráteres, obras con cuadrilla, peajes, presas, derrumbes, rótulos, puentes de un carril. ✅ carro viejo que sufre los huecos (2.44). ✅ buses en las paradas que llevan a otro pueblo (2.46). ✅ lluvia que llena los huecos (2.50).
- ✅ Estadios (2.16): Estadio Nacional y estadio ficticio en remodelación eterna; estación del tren, Monumento Nacional, Templo de la Música.
- ✅ Edificios históricos (2.16 y 2.19): Sanatorio Durán, Edificio Metálico, Correos, Museo de los Niños, Templo de la Música, iglesia de Grecia, Coronado, Monumento Nacional, Antigua Aduana, estación del tren, esferas del Diquís, Ujarrás, Casona de Santa Rosa. ⏳ Puente de la Amistad, muelles de Limón.
- ✅ Turismo de lujo y gentrificación (2.17): resort, beach club, villa, condominio, marina, inmobiliaria, precios de lujo contra la soda local, logros. ✅ comprar lote y misión de vivienda (2.43).
- ✅ «La refinería que no refina» (2.18, ficticia): tanques, tuberías, muelle con tanquero, cisternas, unidad vieja oxidada, bidones para la bomba.
- ✅ Agro (2.20): beneficio de café, trapiche, hacienda con redondel, bananera con cable vía. ✅ cacaotal y lechería con queso, natilla y chocolate (2.42). ⏳ invernaderos.
- ✅ Naturaleza (2.20): catarata de La Fortuna y puentes colgantes. ✅ Irazú, Rincón de la Vieja, Barra Honda (2.24). ✅ venado y armadillo (2.35), Tulevieja (2.36). ✅ mono congo (ya existía con modelo y aullido propios).
- ✅ Olla de carne, empanadas, chorreadas (2.24); saco de café (2.20); mechero (2.23). ✅ sombrero de sabanero (2.42).
- ✅ Parques nacionales (2.25): Marino Ballena (cola de ballena en la arena), Corcovado, Manuel Antonio, Tortuguero; easter eggs. ✅ (2.26) Cahuita, Tenorio (río Celeste), Monteverde, Palo Verde, Isla del Coco. ✅ (2.40) Braulio Carrillo, Juan Castro Blanco, Carara. ✅ La Amistad como parque (2.50). ✅ Rincón de la Vieja, sector Las Pailas (2.51).
- ✅ Regiones de Costa Rica con letrero y pueblos con nombre de su región (2.29); feria, cementerio y muelle de Limón (2.28).
- ✅ Campo alrededor de los pueblos por región (2.37). ✅ Cerro de la Muerte, Playa Conchal, Volcán Turrialba, Isla San Lucas (2.38).
- ✅ Escala de jefes completa (2.39): leyendas de noche → Señor del Arenal (inframundo) → Arpía de la Tormenta (cielo), con la Capa de la Arpía de recompensa.
- ✅ Puente de la Amistad (2.24). ✅ redondel y turno en los pueblos (2.41, generador v7). ✅ jefe del inframundo (2.33), comprar lote (2.43), carro con huecos (2.44). ✅ feria y cementerio pegados a cada pueblo (2.46).

## Ideas locas aceptadas (✅ 2.4: bombeta, guaro, mascarada, fiado, ToucanFest, lluvia de mangos)
- *Bombeta* que asusta a todos los animales.
- *Guaro de caña* (bebida) que hace caminar en zigzag.
- *Mascarada*: máscaras gigantes de carnaval que se usan como casco.
- *El tico de la pulpería* que fía (te presta y te cobra después).
- Un *ToucanFest*: cuando se juntan 5 tucanes hacen una fiesta de colores.
- Lluvia de mangos en verano (cuidado con la cabeza).
