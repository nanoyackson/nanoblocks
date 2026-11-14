# Plan maestro 20 — «Pelea con maña y progreso por etapas»

Pedido de nanoyackson el 10-nov-2026, después de jugar:

- Que la pelea se sienta **parecida a la de Valheim**: que cada arma pese, que se note la diferencia entre armas, y que el aguante, el escudo y el desvío importen.
- Un **progreso por etapas**: el modo supervivencia más cómodo, que uno vaya subiendo de nivel de equipo de verdad.
- **Más bichos hostiles** con funciones distintas, porque «solo sombra me sale y ni se ven diferentes».
- Un personaje mejor hecho, una muerte mejor animada y, en general, modelos más «pro».
- Subir de nivel no debe curar todo: «estuvo muy easy».

La regla de siempre sigue: las mecánicas son genéricas del género (aguante, desvío, combos, tipos de daño) y todo lo demás —nombres, criaturas, arte— es propio y tico. Nada se copia de Valheim.

## A. Arreglos de la partida de nanoyackson
- ✅ v4.95: subir de nivel da +2 corazones (ya no llena vida y comida); la cámara del cofre ya no se mete en la pared; el viento papagayo no entra a la casa; cada Sombra con ojos de su color y silueta propia.

## B. Pelea con maña
- ✅ B1 **Clases de arma** con su forma de pegar. Cada golpe gasta aguante según el peso del arma:
  - espada: combo de tres cortes;
  - machete: rápido y barato;
  - hacha: lenta, pega duro y rompe escudos;
  - mazo o garrote: contundente, aturde, y el golpe fuerte es de área;
  - lanza: estocada larga, y el golpe fuerte es tirarla;
  - cuchillo: muy rápido, y pega triple por la espalda.
- ✅ B2 **Tipos de daño** —corte, contundente y punta— con debilidades y resistencias por criatura, y un aviso de «¡Débil!» o «Resiste» al pegar.
- ✅ B3 **Combos y ritmo**: una cadena de golpes con el último más fuerte, cada clase con su animación de la mano, y la ventana del combo visible.
- ✅ B4 **Escudo**: desvío en la ventana justa (aturde y deja un golpe doble), escudos con su forma de bloquear, y bloquear gasta aguante según el golpe.
- ✅ B5 **Aturdimiento**: cada criatura tiene un aguante de golpes; al llenarlo queda tambaleando y recibe doble.
- ✅ B6 **Aviso de ataque** (ya existía para las criaturas comunes: el amago con destello rojo): las criaturas se preparan antes de pegar (se echan atrás y les brillan los ojos), para que se pueda esquivar o desviar.

## C. Progreso por etapas
- ✅ C1 **Comer da fuerza** (v5.2, `fuerza.js`): los platos buenos suben la vida y el aguante máximos por un rato (hasta tres a la vez).
- ✅ C2 **Descansado** (v5.2): dormir, o estar bajo techo junto al fuego, da un rato de aguante que regenera más rápido y más experiencia. Dura más entre más cómoda la casa.
- ✅ C3 (v5.4: «El camino» en la hoja de la partida) **Etapas por jefe**: cada jefe vencido abre el siguiente material y la siguiente mesa. Se muestra en una hoja de etapas.

## D. Bichos hostiles con funciones distintas, por bioma (nanoyackson: «cierta variedad por bioma»)
- ✅ D1 araña bananera (selva, manglar, bosque): telaraña que enreda y mordida con veneno.
- ✅ D2 escarabajo rinoceronte (bosque, selva, nuboso): escarba y embiste. De frente aguanta; si se estrella contra un árbol o una pared, queda atontado.
- ✅ D3 ciempiés gigante (montaña, nuboso, páramo, cuevas): el cuerpo de segmentos sigue a la cabeza, ataca en zigzag, muerde y se va.
- ✅ D4 luz mala (llanos secos de Guanacaste): se apaga (y así no se le puede pegar), reaparece en otro lado y tira llamaradas. Va en lugar de las abejas, porque los avisperos ya existen.
- ✅ D5 sapo bufo (cerca del agua): si se le pega de cerca, escupe veneno.
- ✅ D6 cangrejo tenaza (playa): ataja con la tenaza y contesta con un pellizco que hace sangrar.
- ✅ D7 el reparto de la noche: 45 % de los intentos van primero a los bichos del bioma (hasta 4–7 a la vez), lejos de pueblos y de la luz.

## F. Más jefes (nanoyackson: «agregar mas jefes»)
- ✅ F1a v4.99: la Ofrenda del monte (se usa de noche en el bioma del jefe), la Reina Bananera (selva) y Don Cornudo, el escarabajo Hércules (bosque). Con los trofeos se hacen el mazo de cuerno y el chaleco de seda. Además el cuchillo de monte.
- ✅ F1b el Tata Sapo (manglar) y la Cascabel del Llano (bosque seco): su trofeo da el antídoto y las botas de cascabel. (v5.0)
- ✅ F1c el Cangrejo Rey (playa) y el Ciempiés Rey (montaña y cuevas): su trofeo da el cuchillo de pinza y la lanza de colmillo. (v5.0)
- ✅ F2 **el jefe final** (v5.1: el Rey Zopilote, `final.js`) (nanoyackson: «al puro final algo como el jefe final del juego y poder pasárselo»):
  - se llama con algo hecho con los seis trofeos del monte;
  - pelea en tres fases, en un lugar propio;
  - al vencerlo, su trofeo se cuelga en la casa, salen los créditos y se sigue jugando libre.
  - Diseño propio: solo se toma la idea de un jefe final.
- ✅ F3 **planear y volar** (v5.1: Alas del Rey Zopilote y bombetas, `alas.js`) (nanoyackson: «algún objeto para poder volar… y algo parecido a los cohetes»):
  - alas propias (de lapa o de zopilote rey) que se ponen en la espalda y planean;
  - bombetas ticas que dan impulso en el aire.
  - Se ganan al final del progreso.

## H. Más ideas del género, hechas a nuestra manera
- ✅ H1 v5.5: criaturas con estrellas (`estrellas.js`): versiones más bravas, de noche y desde el día 4.
- ✅ H2 v5.7: esquive perfecto y contraataque.
- ✅ H3 v5.9: ermitas de camino (viaje rápido entre las que uno pone).
- ✅ H4 v6.0: barras de vida sobre las criaturas.
- ✅ H5 v6.1: flechas de fuego y envenenadas.
- ✅ H6 v6.2: incursiones del monte.
- ✅ H7 v6.3–6.4: las Sombras se deshacen al morir; entrada y caída de los jefes.
- ✅ H8 v6.5: conjuntos de armadura.

## G. GPT (la app de ChatGPT/Codex)
- ✅ G1 v4.99: los 14 íconos nuevos los generó GPT (en Codex): pixel art de 32×32, cortados y con fondo transparente.
  - El pedido está en `docs/prompts-items/jefes.txt`; lo que GPT entregó, en `assets-src/items/jefes/`.
  - Le pedí a Codex que no tocara otros archivos del repo, y no los tocó.
- ✅ G2a v5.1: 7 íconos más (alas, bombeta, pluma, corona, trofeo, pólvora, caña brava), en `assets-src/items/final/`.
- ✅ G2b v5.8: la ilustración de los créditos (`public/ui/creditos.jpg`).
- ✅ G2c v6.1 y v6.8: íconos de las flechas y retratos de los siete jefes.
- ⏳ G2 seguir usándolo: íconos de lo que venga, referencias visuales para los modelos de los jefes, la piel del personaje.

## E. Personaje y modelos
- ✅ E1 (v5.3, `personaje.js`) el personaje rehecho: proporciones, cara, ropa por capas y animaciones.
- ✅ E2 la animación de muerte: caer de rodillas, desplomarse y una cámara que se aleja.
- ✅ E3 modelos low-poly (`lowpoly.js`, v8.6–v10.3): bichos, jefes, Sombras, fauna, gente, leyendas, mar. E4 v10.4: el personaje. Quedan vehículos y detalles menores.
