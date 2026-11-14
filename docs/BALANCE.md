# Balance de supervivencia

Referencia viva de los números que mandan. Auditoría del 8-nov-2026 (v3.61); ajustes aplicados en la v3.62. Lo marcado como
**medido** se probó corriendo el juego; lo demás sale de las constantes del código. Nadie lo ha jugado de punta a punta: estos
números son el punto de partida, no el veredicto.

## Reglas que no se rompen
- **Economía**: nada se puede comprar y revender con ganancia. `pueblo.js` lo fuerza al cargar, sobre todas las tiendas, en el
  peor caso (mejor día y mejor reputación). **Medido**: 0 huecos en las 25 tiendas.
- **Toda amenaza tiene una respuesta temprana**: Sombras → luz, casa o espada; sed → río o cantimplora; frío → cuero o fuego;
  zancudos → repelente o fogata; sangrado → venda.
- **Las metas de la ruta se pueden cumplir**: la Llave del volcán tiene receta alcanzable y su pista dice la verdad.

## Tiempo y vitales (dificultad Normal)
| Dato | Valor |
|---|---|
| Día | 1200 s: 600 de sol y 600 de noche. El primer anochecer llega a los 540 s |
| Comida de 20 a 0 | 18.8 min quieto, 12.5 caminando, 5 corriendo |
| Agua de 20 a 0 | 20 min quieto, 14 caminando, 6 corriendo |
| Regeneración | +1 cada 3 s, con comida ≥ 15 y agua ≥ 6 |
| Sin comida / sin agua | Baja hasta 1 de vida (en Difícil, mata) |
| Adentro de la casa arreglada | +1 cada 5 s, sin gastar comida |

## Amenazas (Normal)
| Amenaza | Vida | Daño | Notas |
|---|---|---|---|
| Sombra | 16, +1 cada 2 días (tope +14) | 3 | Velocidad 3. No nace a ≤ 8 bloques de una luz ni a ≤ 34 de la casa. Tope por noche en Normal: 3, 4 y 5 las tres primeras, después 6, más 1 cada 5 días (hasta 4), 2 en luna llena y 2 cerca de un nido; menos 2 con el Corazón entero y hasta 2 menos por nidos partidos |
| Hondera | 12 | 2 (piedra, cada 3 s) | Mantiene la distancia. Antes la piedra pegaba 3 y mataba más que el golpe de cerca |
| Zancudos | 1 | 0.5 cada 4 a 7 s | Máximo 3 (5 en Difícil, con daño 1). No aparecen bajo techo |
| Ladrona | 10 | 1 | Desde el día 8, un 12 % de las Sombras. Roba hasta 8 y huye a 4.9 por 18 s |
| Grande | 60 | 6 | Desde el día 12, un 4 % de las Sombras. Velocidad 2.1. Suelta 1 o 2 de esencia |
| Leyendas | 60 a 140 | 2 a 5 | El parry ya las aturde. Salen desde el día 4 |
| Minijefas y Mono congo | | | Desde el día 5. El veneno de la Terciopelo reina atraviesa la armadura |
| Sombra Madre | 220 | 7 | Final de la historia. **Medido**: refuerzos a 66 % y 33 %, y salto con aviso |

## Armas (daño por segundo, sin combo)
Espada de madera 8 · piedra 10 · hierro 12 · diamante 14 · jade 16 · machete 10.5 · lanza 10.8 · mazo 11.6 · garrote 8.6.

## Armadura
Hay dos fórmulas desde la v12.4.13:
- **Contra los bichos comunes** (Sombras, bravos, leyendas, asedios, Noche Larga): reducción = puntos × 4 % + dureza × 2 %, con tope de 88 %. Cuero 28 %, hierro 60 %, diamante 84 %, jade 88 %.
- **Contra los jefes** (los golpes de un jefe de `src/jefes-balance.js`, con la que se calibraron): puntos × 3 % + dureza × 2 %, con tope de 80 %. Cuero 21 %, hierro 45 % (hierro con 1 estrella: 48 %), diamante 76 % (con 3 estrellas: 80 %, el tope) y jade con 3 estrellas 80 %. Contra los jefes, jade y diamante con 3 estrellas quedan **iguales**: el jade se distingue por la durabilidad (700 contra 530).
- **Por qué dos:** en la v12.4.8 la fórmula nueva era para todo, y la Noche Larga se perdió 4 de 4 con el bot (con la vieja se ganaba). Los asedios no cambiaron.
- **Además, contra los jefes ningún golpe quita más del 60 % de la vida** (12 de 20), ya con la armadura contada. Solo lo nota quien llega con menos equipo del que toca (el golpe de El Olvido, de 24, sin armadura).
- **Ojo con los jefes topados en ×3** (Llorona, Cadejos, Murciélago Rey, Arpía, El Olvido): por ese tope, contra poca armadura su golpe vale siempre 12; el ×3 solo se nota contra armadura buena. Es lo buscado: castigan de verdad al que llega bien equipado y no matan de un golpe al que llega flojo.
- **De quién es un golpe** (v12.5.2): lo dice `golpes.js` (`g.atacante`), y sin atacante el nombre o el alias del aviso. Una Sombra que pelea al lado de su jefe pega lo suyo, con la armadura de siempre.

## Economía
- Los precios del día se mueven entre ×0.8 y ×1.25.
- Vehículos: bici 30, lancha 150, moto 180, carro 300.
- Pepita 3 colones, oro 10 a 14: fundir ya no sale tan a pérdida (antes 4 pepitas valían 24 y el oro, 4). Batea: 25 % en Guanacaste y Norte, 12 % en otras regiones.

## Reparar
Una unidad de material: 25 % en herramientas y 15 % en armadura.

## Lo que trabaja solo
Trampa: una presa cada 260 s en promedio. Nasa: una cada 300 s. Ambas paran con 6 cosas adentro. Barril: +1 de agua cada 20 s de lluvia, hasta 8.

## Defensas de la casa
Olla caliente: 7 de daño en área a 3.6 bloques, cada 4 s, 1 de carbón por vez, carga hasta 8. Alambre: 2 de daño por segundo y 35 % de velocidad por 2 s; 8 % de romperse cada vez. En un asedio o la Noche Larga, a 22 bloques o menos: Flor cura 6 (10 con su encargo) si uno anda con menos de la mitad, cada 50 s (35); Chepa da 7 de comida (10) si uno anda bajo 12, cada 60 s (40); Tino suma 2 golpes (4) a cada puerta dañada, cada 20 s. Sombra apagadora: 12 de vida, daño 2, velocidad 3.4, desde el día 6, 8 % de las que nacen. Si le pegan, o tarda más de 8 s en llegar a una antorcha, pelea.

## La casa de todos (nivel 5)
Pide: gente en la casa 4/4, Anselmo (fase 5), Marielos (fase 5), 8 sillas y 2 mesas de comedor, además de la Casa de leyenda. Da: radio sin Sombras de 90, finca doble y 2 Sombras menos por oleada en los asedios (mínimo 2).

## Asedios
Cada 5 días, si la casa está arreglada y uno anda a ≤ 34 bloques. 3 Sombras + día/5 + oleada (tope 9), 2 oleadas (3 desde el día 15). Premio: 12 + 2 × día colones. La puerta aguanta 8 golpes, uno por segundo (16 con tranca).

En un asedio, una Noche Larga o un pueblo en apuros no nace nada más: solo vienen las oleadas, y van llegando de a poco. Cada nido vivo manda una Sombra más al asedio. Hay que vencer al menos a un tercio de cada oleada: si no, la pelea termina sin premio (no aplica a la Noche Larga, que no puede quedar sin final). Sus Sombras ganan vida con los días (hasta +10) y persiguen desde 60 bloques. Las que se alejan más de 50 bloques o 16 de altura de uno, o tardan más de 80 s (100 en la Noche Larga, 120 en la de Ceniza), se van; la Sombra que no alcanza a uno aparece al lado a los 7 s.

## Nidos
Desde el día 5, uno cada 3 días (máximo 3). Con hacha de hierro se parte en unos 4.5 s, a mano en 27 s. Guardias: 2, más 1 cada 10 días (tope 4), uno cada 12 s si uno anda a ≤ 16 bloques. Premio: 8 + día colones y 2 o 3 de esencia.

## Pueblo en apuros
Desde el día 6, cada 6 días como mínimo, entre los tiempos 0.46 y 0.56 del día si uno anda a ≤ 48 bloques de un pueblo. No cae el mismo día de un asedio. 2 oleadas de 3 + día/6 + oleada (tope 8). Premio: 15 + 2 × día colones y 2 de reputación.

## Noche de Ceniza
Oleada n (desde 0): 4 + n Sombras (tope 14), con +2n de vida (tope +30). Honderas desde la 2.ª, escudos desde la 3.ª, capitana cada 5 desde la 5.ª y grandes desde la 8.ª. Paga 6 + 3n colones y 1 de esencia cada 3 oleadas.

## Mientras la historia lo pide
La Sirena sale en unos 25 s de noche junto al agua (**medido**: 24 s), y vuelve a los 120 s (si no, 300 s, con 50 % de que no salga, y luego 600 a 1200 s). El Señor del Arenal y la Arpía vuelven en 120 s (si no, 480 y 420). Las leyendas salen 4 veces más seguido en su capítulo.

## Yunque y seguro
Cada estrella (hasta 3) da +12 % de daño o de velocidad, y +0.25 de protección por pieza: cuatro piezas con 3 estrellas dan +12 % de reducción contra los bichos comunes y +9 % contra los jefes (v12.4.13). Costo: su material 2, 4 y 6, más 1 y 2 de esencia en la segunda y la tercera. Deja la pieza como nueva. Con el martillo de Ñor Tino hay una cuarta estrella: 8 de material, 3 de esencia y 2 diamantes. Seguro del tío Rigo: 25 colones, luego 40; cubre una muerte.

## La plata (v11.10.3)
Cada unidad interna del juego (lo que cobran las tiendas y los encargos, el «colón» de antes) vale **K = ₡500** (`plata.js`). Canasta de referencia contra los precios reales de 2026: casado ₡3000 (real ~₡4500), gallo pinto ₡1500 (~₡3000), café chorreado ₡1000 (~₡1500), machete ₡7500 (~₡7000). K sale entre 470 (machete) y 1000 (gallo pinto); se eligió 500 porque la moneda de siempre queda justa como la de ₡500 y no hace falta migrar cofres ni lo que está en el suelo. Para acercar la canasta (casado, gallo pinto, café) la perilla son esos precios en `pueblo.js`, en la 11.10.4 junto con los ingresos.

## Economía medida otra vez (v11.10.6, 11-nov-2026)
La revisión independiente (`docs/revisiones/REVISION_v11.9.2-v11.10.4.md`, #3) encontró que el bot de la v11.10.4 suponía un minijefe y una leyenda **cada ocho días**, cuando el código saca uno cada ~8–10 minutos y 2–4 leyendas por noche: medía contra un cazador diez veces más lento. Con las cadencias del código, la primera corrida dio **cazador ₡61 900 por día contra comerciante ₡15 300 (4.05 veces)**.

Supuestos nuevos (`SUPUESTOS`, cada uno con su fuente en el código):
- **trabajador:** 4 mandados y 6 cajuelas por día (no hay «temporada»: cada cajuela son 20 granos maduros);
- **cazador:** 6 bravos, 2 élites, 2 minijefes, 3 leyendas y 2 monos congo por día, un «Se busca» cada tres días, un jefe del monte nuevo cada cuatro días desde el día 8 y una revancha por día (pagando la ofrenda, ₡2 500);
- **comerciante:** 24 mazorcas, 30 granos de café, 8 bananos y 6 pargos por día, y 10 platos en su soda.

Cambios para que pase: cada jefe paga completo una vez por mundo y las demás el 10 %; minijefes y leyendas pagan completo el primero de cada día y el 10 % los demás; paga por peligro más baja (`precios.js`), «Se busca» a la mitad, cajuela ₡2 000, y la soda paga por debajo del precio de tienda.

| Perfil | Gana por día | Por minuto | Al día 30 | Pico de hierro | Bici | Escritura del lote |
|---|---|---|---|---|---|---|
| Trabajador | ₡27 800 | ₡1 390 | ₡589 000 | día 2 | día 4 | día 16 |
| Cazador | ₡29 158 | ₡1 458 | ₡629 737 | día 6 | día 8 | día 18 |
| Comerciante | ₡19 660 | ₡983 | ₡344 800 | día 4 | día 7 | día 26 |

Criterios: nadie se queda sin comer ✔ · nadie compra todo a los 30 días (la moto no sale) ✔ · el que más gana, a 1.48 veces del que menos ✔. Cultivar jefes ya no paga: una revancha deja unos ₡2 700 y la ofrenda cuesta ₡2 500. Lo que queda por medir jugando (C1 de la revisión): una hora real en la selva contando minijefes, monos y leyendas.

## Economía medida (v11.10.4, 11-nov-2026) — reemplazada por la de arriba
`tools/bot-economia.js` (en la consola: `(await import('/tools/bot-economia.js')).correr()`) lee los precios y premios de verdad: tiendas, encargos, carteles, `precios.js` y el menú de la soda. Simula 30 días. Los **supuestos** de lo que uno hace en un día están en `SUPUESTOS` y son de un jugador que juega con calma:
- **trabajador:** 3 mandados por día y 5 cajuelas en los días de cosecha;
- **cazador:** 2 bravos y 1 élite por día, un «Se busca» cada 3 días, un minijefe cada 8, una leyenda cada 8 y un jefe del monte cada 15 desde el día 8;
- **comerciante:** vende 40 mazorcas, 48 granos de café, 12 bananos y 16 pargos por día, y sirve 2 platos en su soda.

Los tres comen gallo pinto, casado y café (₡8 500 por día) y arrancan con ₡10 000.

| Perfil | Gana por día | Al día 30 | Pico de hierro | Bici | Escritura del lote |
|---|---|---|---|---|---|
| Trabajador | ₡18 100 | ₡298 000 | día 3 | día 8 | — |
| Comerciante | ₡19 625 | ₡343 750 | día 4 | día 7 | día 27 |
| Cazador | ₡26 984 | ₡564 524 | día 6 | día 8 | día 18 |

Criterios: nadie se queda sin comer ✔ · nadie compra todo con sobra a los 30 días ✔ · el que más gana, a 1.49 veces del que menos ✔ (tope 1.5). Plata infinita: la regla de oro de `pueblo.js` sigue cerrando la reventa, y lo manso no paga. Los bravos sí pagan algo y salen solos de noche: si alguien los «cultiva», la perilla es `PREMIO_BAJA` (`precios.js`). Lo que más pesa en el cazador es el «Se busca» de siempre (`recompensas.js`): si se siente fácil, esa es la perilla.

## Comer variado (v11.10)
Repetir comida ya no rinde menos: siempre llena lo de su ficha. Antes las últimas 6 comidas bajaban a 70 % la segunda repetida y a 40 % la tercera. Premio por variedad del día (`variedad.js`, `meta.variedad`): 3 comidas distintas dan el efecto «aguante» (estamina ×1.4) por 360 s, y 5 dan además «fuerza» (+15 % de daño) por 360 s, una vez por día. Si se siente que la fuerza sale demasiado fácil, la perilla es `FUERZA_EN` (5).

## Platos y hojas
Solo vale el último plato, 5 minutos (7.5 con la hoja de cocina). Fuerza +15 % de daño, coraza −12 %, aguante: estamina ×1.4, fresco: sed ×0.5, lleno: hambre y sed ×0.6. Las hojas del cuaderno suman: comida ×1.1, sed ×0.9, zancudos la mitad, estamina ×1.15, venda +3 de vida, trampas ×1.25, daño recibido ×0.95, desgaste −15 %, hambre y sed ×0.95, picar ×1.1 y un corazón. Las medidas del bot son sin platos ni hojas.

## La Sombra con nombre
Vida: (la de su tipo + día, hasta +20) × (1.5 + 0.35 × nivel). Daño × (1 + 0.15 × nivel). Nivel tope 5. Llega una vez por noche como máximo, desde la noche siguiente a la muerte. Paga 25 + 15 × nivel colones, nivel de esencia y 25 × nivel de experiencia. Si la vida se siente mucha para el día 2, esa es la perilla.

## La Grieta
Oleadas de 4, 5 y 6 Sombras (+día/3 de vida, tope +12) y El Olvido: 340 de vida, daño 8, velocidad 2.7. Refuerzos de 3 al bajar de 66 % y de 33 %. Respira hondo cada 13 s (9 con poca vida), con 2 s de aviso. Premio: 250 de experiencia, un corazón, 6 de esencia, 3 diamantes y 6 de carbón, directo a la mochila. Nadie la ha peleado en una partida real: si se siente corta o larga, la perilla es la vida en `arena.js`.

## Plato servido
Una visita por plato y por noche, si uno anda a 44 bloques o menos (también en modo Tranquilo). Cada una deja 2 a 6 colones, 34 % de 1 de esencia y 8 de experiencia. A las 6 distintas, una Sombra menos en el tope de cada noche; a las 12, un corazón. Cuesta un gallo pinto o una comida cocinada de 5 o más.

## La gente de la casa
Un rescate cada 3 días como mínimo, desde el día 3, de día y a más de 60 bloques de la casa: 2 Sombras, más 1 cada 8 días (tope 5), con +día/3 de vida (tope +10). Paga 25 de experiencia y 10 colones. Wilber dispara cada 2 s, 5 de daño, a 18 bloques o menos, y no le tira a los jefes. Tino: una reparación completa al día. Si se siente que el yunque o reparar ya no valen la pena, esa es la perilla. Con los cuatro: 8 colones por día.

## Encargos de la gente
Ruina a 170–320 bloques de la casa, 3 Sombras (hasta 5, con +día/3 de vida). Paga 15 colones y 40 de experiencia. Nivel 2: Tino arregla todo lo puesto; Chepa, dos platos; Flor, un botiquín por día; Wilber, 9 de daño a 28 bloques. Mesa larga: los domingos, comida y agua llenas, y fuerza y lleno por 10 minutos.

## El Archivo Municipal
Funcionarios: 2 Sombras por oficina (4 en la sala de espera), con +día/3 de vida (tope +12). Jefa de Ventanilla: 240 de vida, daño 6, velocidad 2.2; sellazo de 7 de daño a 2.2 bloques, con 2 s de aviso, cada 8 s (5 con poca vida); 3 compañeros al 66 % y al 33 %. Premio: 120 colones, 4 de esencia, 120 de experiencia y el Sello de goma (8 de daño, 30 % de aturdir 1.6 s, 0.8 a los jefes). Sale desde el día 18, por correo.

## El álbum
40 estampas; las raras pesan 1 y las comunes 4. Sobre: 3 estampas, 8 colones en la pulpería; 5 % de las Sombras, 30 % de las leyendas y todos los jefes sueltan uno. Tres repetidas por una que falte. Medido: 60 sobres dan unas 35 distintas, y con los cambios se llena. Premios por página: 40 a 80 colones más un objeto; completo: 200 colones y 3 diamantes. Se pagan una sola vez, así que no hay ganancia infinita.

## La cabeza de agua
Con lluvia y dentro del cauce de un río (nunca en el mar, los manglares ni lo hondo), a la altura del agua: 4 % por segundo de que empiece, como mucho una cada 480 s. 6 s de aviso. Si sigue en el agua: 7 de daño, empujón y 30 s de escalofrío.

## Noches (desde v4.29)
Tope de Sombras: Normal 8, Difícil 12, más 1 cada 5 días (hasta 4), +2 en luna llena y +2 cerca de un nido; menos la calma (Corazón entero, comarca, platos) y el novato (2 la primera noche, 1 la segunda). De noche, 60 % de los intentos de aparición van primero a la Sombra, a 18–40 bloques, sin luz a 8 bloques ni en zona segura. Desde el día 3, manadas de 1–3 (hasta 3 desde el día 7). Sombra común: 20 de vida (antes 16) + día/2 (máx. 14). Brincona: 14 de vida, 4 de daño, brinca de 3 a 7.5 bloques, carga 0.55 s, aturdida 1.4 s si falla, espera 3–5 s entre brincos. Medido con el bot el 9-nov (v4.42, Normal, primera noche, cancha plana): a mano muere a los 48 s (pico de 6 Sombras a la vez); con espada de madera amanece con la vida en 12 de 20 como mínimo; con piedra y cuero amanece, vence 17 y queda en 12. La primera noche a la intemperie y sin nada ya no se aguanta: hay que hacerse una espada o encerrarse con antorchas. Lo demás (asedios, Noche Larga) no se volvió a medir.

## Quemas de verano
Solo en verano, sin lluvia y con uno en bosque seco o llanos de Guanacaste: 1/300 por segundo en la sequía y 1/600 fuera de ella, como mucho una cada 4 días y nunca antes del día 3. Arranca a 28–50 bloques. Cada foco arde 7–11 s y tiene 30 % por segundo de brincar a una vecina (45 % de esas veces a favor del viento). Topes: 70 focos a la vez, 260 quemados, 300 s de riego. Un balde apaga en 3.2 bloques de radio y 7 de alto. Solo arde lo silvestre y nunca sale de la zona seca; no entra a 90 bloques de un pueblo ni a 16 del lote o la cama. Medido con baldazos cada 4 s: se gana con 2 a 7 baldes si uno llega en los primeros 30–45 s; después se acaba sola. Paga ₡40 (o ₡20 si ya quemó 30 o más). Daño en las llamas: 1.5 × el daño de la dificultad por segundo. Lo quemado se anota en `meta.rebrote` (tope 1200 columnas) y rebrota solo con lluvia, 3 columnas por segundo, 22 % con pasto alto. Bomba de espalda: 8 rociadas, alcance 9, mismo radio que el balde (3.2); solo gasta si cae sobre fuego.

## Avisperos
1.5 % al romper hojas en bosque, selva, nuboso o bosque seco (nunca desde el agua). Daño por segundo según la dificultad (0.6 / 1 / 1.4), hasta 9 s; se acaba a 14 bloques o en el agua. Deja 2 de miel que duran 15 min en el suelo.

## Mañas
Se escoge una en los niveles 2, 4, 7, 10, 13, 17, 21, 26, 31 y 37 (`NIVELES` en `manas.js`). Los números de cada una están en el mismo archivo y en `ventaja` de `progreso.js`. Se suman a todo lo demás: si alguna combinación se siente abusiva, se baja ahí. Las medidas del bot son sin mañas.

## Medido con el bot (`tools/bot-pelea.js`)
Un jugador torpe: no cubre ni esquiva, se queda peleando en una cancha plana de 49 × 49 y no le llegan visitas (leyendas ni minijefas). Sirve para comparar, no como veredicto. Última pasada de la v3.71, con pocas corridas por fila: hay que leerla como tendencia.

| Pelea | Equipo | Sin preparar | Preparado (3 estrellas, plato, hojas) |
|---|---|---|---|
| Asedio día 5 | Piedra y cuero | Ganó 2 de 2 (vida mínima 16 y 20) | Ganó 2 de 2 (11 y 20) |
| Asedio día 10 | Hierro y cuero | Ganó 2 de 2 (4 y 20) | No se midió |
| Asedio día 10 | Hierro y hierro | Ganó 2 de 2 (10.5 y 20) | Ganó 2 de 2 (20 y 20) |
| Asedio día 15 | Hierro y hierro | Ganó 2 de 2 (15.5 y 20) | Ganó 2 de 2 (20 y 20) |
| Asedio día 30 | Diamante | Ganó 2 de 3 (una no terminó en 400 s; 18.5 en la que se anotó) | No se midió |
| Noche Larga día 20 | Hierro, 13 corazones | Ganó 1 de 2 (0 y 5) | Ganó 2 de 2 (16 y 25) |
| Noche Larga día 30 | Diamante, 14 corazones | Ganó 2 de 2 (17 y 26) | Ganó 1 de 1 (15) |

En **Difícil** (una corrida por fila, sin preparar / preparado): asedio día 5 ganó / ganó; día 10 con hierro ganó / ganó; día 15 con hierro murió / ganó; día 30 con diamante murió; Noche Larga día 20 murió / murió; Noche Larga día 30 ganó / murió. Es difícil de verdad, y para un bot que no cubre, eso es lo esperado.

**Remedición en la v4.6**, sin mañas, con una corrida por fila: asedio día 5 con cuero ganó (vida mínima 8.5); día 10 con cuero, 14, y con hierro, 18; día 15 con hierro, 15.5; día 30 con diamante, 14.5; Noche Larga día 20 con hierro murió. Sin cambios de fondo. En una corrida en cadena, las primeras noches con madera y con piedra murieron en menos de 20 s; corridas aparte y repitiendo la secuencia no lo reprodujeron (vida mínima 17), así que queda sin explicar.

Lectura: sin preparar, la Noche Larga con hierro es a cara o cruz, y preparado se gana sin apuros. Eso está bien para un bot que no cubre: un jugador que sí cubre va a tener más margen, y la vida extra de las oleadas es la perilla por si se siente fácil (`Math.min(10, día / 3)`).

Sin explicar: unas pocas corridas de asedio no terminan dentro de los 400 s del bot, aunque ninguna se quedó colgada para el jugador (el asedio termina al amanecer). El bot ahora anota el estado cuando pasa.

Antes de los ajustes de la v3.68: en la primera noche mataban el Cadejos y la Terciopelo reina, el pico de enemigos en un asedio llegaba a 17 y una Sombra caída en una cueva dejaba la pelea colgada.

Lo que el bot no dice bien: la primera noche sale optimista (si la cancha queda en un hueco, a las Sombras les cuesta llegar), y como se queda quieto, recibe más piedras que un jugador que se mueve.

## Falta medir jugando
Cuánto tarda de verdad cada meta de la ruta y si se entiende qué hacer. Eso solo lo dice una partida real. **Si algo se siente injusto, este es el documento donde se ajusta.**

## Rifa Dominical (v4.74)
Fracción a ₡2; premio de ₡10 con 1/25 y gordito de ₡250 con 1/200. Medido en 40 000 fracciones: devuelve ₡1,57 por fracción (la casa gana; no es negocio). Tope de 10 fracciones revisadas por domingo.

## Armas con maña (v4.97, `src/armas3.js`)
Cada clase de arma tiene en `CLASES`:
- su tipo de daño (corte, contundente o punta);
- el tiempo entre golpes y el aguante por golpe (puño 3, cuchillo 4, machete 6, espada 8, lanza 8, garrote 10, pico 10, hacha 12, mazo 15; el golpe fuerte gasta ×2.2);
- la cadena de golpes (espada 1 / 1.1 / 1.7, mazo 1 / 1.25 / 1.9…);
- el alcance (la lanza 4.6, las demás 2.8–3.4), el empuje, el aturdimiento y lo que ataja al cubrirse sin escudo.

Reglas:
- **Aguante.** Sin al menos el 35 % del costo no se pega. Se recupera a 24 por segundo (antes 28), después de 0.55 s si fue un golpe y de 1 s si fue correr o cubrirse.
- **Debilidades** (`AFIN`):
  - Sombras: corte ×1.2, punta ×0.75.
  - Caparazón: contundente ×1.6, corte ×0.6.
  - Blindados: contundente ×1.4.
  - Espantos: ×0.6–0.7 a todo.
  - Cuero: punta ×1.35.
  - Reptiles: punta ×1.3, corte ×0.75.
  - Piedra: contundente ×1.5.
  - Voladores: punta ×1.4.
- **Por la espalda** (o sin haberlo visto) ×1.5. El cuchillo, ×3.
- **Aturdimiento.** Se tambalea al llegar al 60 % de la vida en «daño × aturdimiento del arma» (los jefes, ×1.8). Tambaleando recibe ×2.
- **Frenón del golpe:** 0.035 s + 0.025 × empuje, más si es fuerte o remate.

Medido con el bot el 10-nov (Normal, primera noche): con espada de madera amaneció dos veces (vida mínima 17 y 8); con piedra y cuero, una vez (16). Con el costo de antes (espada 10, pausa de 1 s después de cada golpe) el bot moría las tres veces, porque pega sin parar y nunca recuperaba aire.

## Rendimiento medido (v7.3, 10-nov)
De noche, sin pelea, el cuadro dura 7,6 ms en promedio, con el render incluido.
Con 20 criaturas peleando a la vez (5 con estrella y todas con barrita de vida) más la Reina Bananera, dura 8,4 ms.
Lo nuevo del plan 20 suma menos de 1 ms por cuadro.

## Golpes en tres tiempos (v11.3 y v11.4)

Los enemigos se preparan entre 0.42 y 0.85 s según su tamaño (0.12 más los jefes) y el daño cae en medio del soltar. El brillo sale 0.26 s antes del impacto; el parry dura 0.3 s con escudo y 0.26 con arma. Jefes encadenan 2 o 3 golpes y la gente grande 2, una de cada cinco veces. El golpe propio conecta a medio camino (espada 0.14 s, mazo fuerte 0.37 s) y exige estar de frente.

Medido con el bot el 10-nov, una corrida por fila, sin cubrirse: primera noche con piedra y cuero amaneció (18); con madera murió a los 37 s; asedio día 5 con cuero ganó (11); día 10 con cuero, 15.5, y con hierro, 18; día 15 con hierro murió. El bot no hace parry: un jugador que lee el golpe va con más margen.

## Bot de balance arreglado: duelos y escenarios (v11.6.1, 11-nov-2026)

**Por qué los números de antes no servían:** desde la v11.3 el golpe propio conecta a medio camino (`golpePend` → `asestar`) y el
bot contaba las bajas en el clic, así que siempre daba 0. Ahora cuenta las bajas en `killedMob` y los golpes en `asestar`
(envuelve esos métodos solo mientras corre; `bot.terminar()` los devuelve). De paso se arreglaron tres fallas del bot que
ensuciaban lo medido desde la v11.4:
- con varias Sombras, mientras el arma viajaba apuntaba a la más cercana y no a la que golpeaba (139 clics, 10 golpes dados);
- perseguía Sombras paradas en un risco 33 bloques arriba de la cancha (ahora la limpia hasta 48 de alto e ignora lo que anda en
  otro piso);
- los asedios dejaban la casa construida en el centro de la cancha y lo que venía después quedaba encima (ahora se repara antes
  de cada pelea).

**Las mediciones del 10-nov de la sección anterior quedan en duda por eso.**

Nuevo modo **duelo** (`DUELOS` en `tools/bot-pelea.js`): uno contra uno, el bicho nace a 7 bloques, de noche, sin estrellas al
azar y sin que nazca nada más. Tres equipos: **temprana** = espada de madera sin armadura; **media** = espada de hierro y cuero;
**tardía** = espada de diamante y armadura de diamante. Día 10, Normal, sin mañas, platos ni hojas. El bot sigue siendo torpe: no
cubre, no hace parry, no esquiva, solo usa espada y pega de frente (35 % de probabilidad por cuadro con el golpe listo; al del
escudo, cargado). Tres corridas por fila. TTK = segundos desde que nace hasta que cae (incluye unos 0.7 s de acercarse).
«Recibido» = vida perdida en promedio, de las que ganó (20 = la barra entera).

### Duelos: tiempo para matar (s) · daño recibido · ganó de 3
| Enemigo (vida, golpe) | Temprana | Media | Tardía |
|---|---|---|---|
| Sombra (20, 3) | 2.5 · 1 · 3/3 | 1.9 · 0.7 · 3/3 | 1.7 · 0 · 3/3 |
| Sombra hondera (12, 2) | 1.7 · 0 · 3/3 | 1.6 · 0 · 3/3 | 1.5 · 0 · 3/3 |
| Sombra brincona (14, 4) | 1.8 · 0 · 3/3 | 1.2 · 0 · 3/3 | 1.0 · 0 · 3/3 |
| Araña bananera (16) | 3.1 · 0 · 3/3 | 2.3 · 0.5 · 3/3 | 1.6 · 0 · 3/3 |
| **Escarabajo (42, 6)** | **6.7 · 17.5 · 1/3** | 5.7 · 9.8 · 3/3 | 5.0 · 1.3 · 3/3 |
| Sapo bufo (18) | 2.8 · 1.3 · 3/3 | 2.1 · 0.7 · 3/3 | 1.6 · 0.3 · 3/3 |
| Ciempiés (20) | 4.0 · 1.2 · 3/3 | 2.0 · 0.7 · 3/3 | 1.6 · 0 · 3/3 |
| **Cangrejo tenaza (26, 3)** | **7.6 · 13.3 · 2/3** | **8.6 · 12.7 · 3/3** (vida mín. 3) | 7.7 · 2.2 · 3/3 |
| Luz mala (14) | 2.4 · 1 · 3/3 | 1.7 · 0 · 3/3 | 2.0 · 0 · 3/3 |
| Mico Malo (24) | 2.7 · 1.8 · 3/3 | 1.9 · 0 · 3/3 | 0.9 · 0 · 3/3 |
| Chupacabras (30) | 3.1 · 2.5 · 3/3 | 2.0 · 1 · 3/3 | 1.8 · 0 · 3/3 |
| Puma (40) | 3.8 · 0.2 · 3/3 | 3.2 · 0 · 3/3 | 2.2 · 0 · 3/3 |
| Bécquer (50, 3) | 5.8 · 0 · 3/3 | 3.9 · 0.8 · 3/3 | 3.0 · 0 · 3/3 |
| Chata (38) | 3.0 · 1.7 · 3/3 | 1.9 · 0 · 3/3 | 1.6 · 0 · 3/3 |
| *Élite:* Sombra 1★ (40, ×1.5) | 2.4 · 0 · 3/3 | 1.7 · 0.2 · 3/3 | 1.9 · 0 · 3/3 |
| *Élite:* Sombra 2★ (70, ×2) | 3.1 · 0 · 3/3 | 2.8 · 0 · 3/3 | 1.9 · 0 · 3/3 |
| *Élite:* Sombra grande (60, 6) | 3.9 · 6 · 3/3 | 3.0 · 3 · 3/3 | 2.5 · 0.3 · 3/3 |
| *Élite:* Sombra del escudo (22) | 3.4 · 0 · 3/3 | 1.9 · 0 · 3/3 | 1.3 · 0 · 3/3 |
| *Élite:* Toro Guaco (80, 7) | 6.1 · 11.3 · 3/3 | 4.0 · 5.5 · 3/3 | 3.5 · 1 · 3/3 |
| *Minijefa:* **Jaguar viejo (90, 9)** | **el bot muere en 4 s · 0/3** | 4.6 · **17** · 3/3 (vida mín. 0.5) | 4.1 · 1.7 · 3/3 |
| *Jefe:* Reina Bananera (260, 6) | muere en 6–10 s · 0/3 | muere en 8–12 s (le baja 113–131) · 0/3 | 14.7 · 6.8 · 3/3 |
| *Jefe:* **Escarabajo Hércules (340, 8)** | muere en 3–6 s (le baja 6) · 0/3 | muere en 6 s (le baja 11–18) · 0/3 | **52.7 · 29.7** · 3/3 (vida mín. 3) |
| *Jefe:* Cangrejo rey (320, 7) | muere en 4–14 s · 0/3 | muere en 8–12 s (le baja 40–88) · 0/3 | 32 · 14.7 · 3/3 |

Una primera tanda en otro mundo dio lo mismo dentro de ±1 s: es estable.

### Escenarios de siempre (dos corridas por fila; ahora sí cuentan bajas)
| Pelea | Resultado (vida mínima) | Bajas | Daño recibido |
|---|---|---|---|
| Primera noche, a mano | murió a los 46 s / amaneció (17.5) | 4 / 5 | 24 / 18 |
| Primera noche, madera | murió a los 532 s / amaneció (20) | 5 / 15 | 32 / 9 |
| Primera noche, piedra y cuero | murió a los 555 s / amaneció (20) | 15 / 7 | 53 / 11 |
| Asedio día 5, cuero | ganó (16) / ganó (20) | 9 / 8 | 20 / 10.5 |
| Asedio día 10, cuero | ganó (18) / ganó (20) | 11 / 9 | 6 / 8 |
| Asedio día 10, hierro | ganó (19) / ganó (20) | 10 / 9 | 9.5 / 14.5 |
| Asedio día 15, hierro | ganó (18) / ganó (20) | 18 / 18 | 10.5 / 9.5 |
| Asedio día 30, diamante | ganó (19) / ganó (20) | 22 / 22 | 2.5 / 13.5 |
| Noche Larga día 20, hierro, +3 corazones | ganó (10.5) / ganó (13.5) | 20 / 20 | 31 / 32.5 |
| Noche Larga día 30, diamante, +4 corazones | ganó (19) / ganó (24) | 21 / 19 | 14.5 / 12 |

### Lectura
- **Demasiado fácil: las Sombras con estrellas o escaladas se tambalean con un golpe.** `topeAturde` (armas3.js) usa
  `kind.health`, la vida *base* del tipo, y no la real. Una Sombra 2★ tiene 70 de vida pero se tambalea al llegar a 12 de
  aturdimiento: el primer golpe de una espada de madera (13) ya la tambalea, y tambaleando recibe ×2, así que cae en 3 golpes
  (13 + 27 + 41) sin llegar a pegar. Pasa igual con la vida extra por días, asedios, nidos y la Sombra con nombre. Por eso casi
  ninguna Sombra le hace daño al bot: quedan encadenadas en el aturdimiento.
- **Injusto temprano: el escarabajo y el cangrejo tenaza** son bichos comunes que matan al jugador de espada de madera (2 de 3
  y 1 de 3). El caparazón del escarabajo deja pasar solo el 60 % del corte. La tenaza del cangrejo ataja de frente el 100 % de lo
  que no sea contundente (`onHurt` en bichos3.js), por eso tarda 8 s en morir con cualquier espada. La respuesta es un arma
  contundente o pegarle de lado, pero un jugador temprano no tiene con qué y no hay pista.
- **Injusto: el Jaguar viejo** (minijefa desde el día 5). Mata sin armadura en 4 s y, con hierro y cuero, deja la vida en 0.5. Su
  salto (velocidad 11, cada 2.4 s) no tiene el círculo rojo ni el agazape que sí tiene el puma desde la v11.5.
- **Jefes:** con equipo medio no se gana ninguno sin cubrirse, y eso cuadra: se llaman con la Ofrenda, así que uno escoge cuándo.
  El **Escarabajo Hércules** es el raro: aun con diamante tarda 53 s y deja la vida en 3; con hierro le baja apenas 11–18 de 340
  antes de morir. Con espada, el caparazón lo deja en ~6 de daño por segundo. La Reina Bananera (15 s) y el Cangrejo rey (32 s)
  se sienten bien.
- **La primera noche** se perdió en 3 de 6 corridas. Pero con madera y con piedra el bot murió a los 530–555 s, casi al
  amanecer, por desgaste (32–53 de daño en total) y no por un pico. Para un bot que no se cubre ni se encierra, va bien.
- **Asedios y Noche Larga:** se ganan siempre y con margen. Solo la Noche Larga con hierro aprieta (vida mínima 10–13).

### Ajustes propuestos (sin aplicar: decide la orquestadora)
1. **Aturdimiento según la vida real** (`topeAturde`, armas3.js): `Math.max(10, (m.data.vmax || m.kind.health || 20) * 0.6)`. Para
   que una espada no encadene a la Sombra común en cada golpe, subir además el factor de 0.6 a **0.8**. Efecto esperado: con
   madera, la Sombra 2★ pasa de 3 a unos 5 golpes y vuelve a pegar entre medio. Es el cambio que más pesa: después hay que
   remedir todo.
2. **Escarabajo:** golpe **6 → 4**. Sigue pidiendo algo contundente, pero ya no mata al que solo tiene espada.
3. **Cangrejo tenaza:** golpe **3 → 2**, y que la tenaza deje pasar el **40 %** del corte en vez de nada. Con eso el TTK con
   hierro bajaría de 8.6 s a unos 5 s.
4. **Jaguar viejo:** golpe **9 → 7**, y darle al salto el mismo `avisoCaida` y agazape (0.45 s) que tiene el puma.
5. **Escarabajo Hércules:** vida **340 → 280** y golpe **8 → 7**. Ya es débil a lo contundente (×1.6). La meta es que con
   diamante dure 30–35 s, como el Cangrejo rey.
6. **Sombra del escudo:** cae de un golpe cargado (22 de vida) con cualquier espada. Si se quiere que el escudo pese, vida
   **22 → 32**. Prioridad baja: es justo lo que el juego enseña a hacer.
7. **No tocar** asedios, Noche Larga, Reina Bananera ni Cangrejo rey hasta remedir con el punto 1. Si se ajusta el aturdimiento,
   todo lo de Sombras se pone más difícil, y puede que el margen sobre en otro lado.

Cómo repetirlo, en la consola:
- `const B = await import('/tools/bot-pelea.js'); const g = await B.mundoDePrueba();`
- `window.bot = new B.Bot(g, [...B.DUELOS, ...B.ESCENARIOS]);`
- luego `bot.seguir(25000)` hasta que `queda` sea 0; `B.resumen(bot.resultados)` agrupa los duelos.

Con la pestaña oculta conviene llamar `seguir` a mano, porque el navegador frena los temporizadores.

## Ajustes aplicados y remedición (v11.7.0, 11-nov-2026)

Aplicados, por decisión de la orquestadora: los puntos 1 a 5 de la lista anterior. El 6 (Sombra del escudo) no se tocó. Además, la
primera vez que un caparazón o la tenaza le atajan un corte, sale un consejo una sola vez (`consejoUnaVez`, id `caparazon`). La
tenaza deja pasar el 40 % porque `entities.hurt` ahora acepta que `onHurt` devuelva un factor. Mismo bot, mismas condiciones,
tres corridas por duelo y dos por escenario.

### Antes → después (TTK en s · daño recibido · ganó de 3)
| Enemigo | Temprana | Media | Tardía |
|---|---|---|---|
| Sombra | 2.5 · 1 · 3/3 → 2.5 · 2.7 · 3/3 | 1.9 · 0.7 → 1.9 · 0 | igual |
| Sombra 1★ | 2.4 · 0 → 2.9 · 4.2 | 1.7 · 0.2 → 2.8 · 3 | 1.9 · 0 → 2.1 · 0.2 |
| Sombra 2★ | 3.1 · 0 → **4.5 · 7.5** | 2.8 · 0 → 3.6 · 4.2 | 1.9 · 0 → 2.6 · 0.5 |
| Sombra grande | 3.9 · 6 → 4.5 · 9.7 | 3.0 · 3 → 2.7 · 2.8 | igual |
| Escarabajo | 1/3 → **2/3** (10 s · 12.3) | 5.7 · 9.8 → 8.2 · 9.5 | igual |
| Cangrejo tenaza | 2/3 → **3/3** (6.7 · 10) | 8.6 · 12.7 → **4.3 · 4.5** | 7.7 · 2.2 → 3.6 · 0.3 |
| Chupacabras | 3.1 · 2.5 → 5.9 · 5 | 2.0 · 1 → 2.5 · 2.7 | igual |
| Chata | 3.0 · 1.7 → 3.7 · 6.3 | igual | igual |
| Toro Guaco | 3/3 → 2/3 (6 · 14) | 4.0 · 5.5 → 4.3 · 5.2 | igual |
| Jaguar viejo | 0/3 → **2/3** (5.5 · 19.5) | vida mín. 0.5 → **6.5** (5 · 11.5) | 4.1 · 1.7 → 3.9 · 2 |
| Escarabajo Hércules | muere | muere (le baja hasta 122 de 280) | 52.7 · 29.7 → **40.5 · 22.7** |
| Reina Bananera / Cangrejo rey | sin cambio (16 s y 34 s con diamante) | | |

| Escenario (dos corridas) | Antes | Después |
|---|---|---|
| Primera noche, a mano | murió / amaneció | murió a los 43 s / murió a los 34 s |
| Primera noche, madera | murió (532 s) / amaneció | amaneció (15) / *corrida inválida del bot* |
| Primera noche, piedra y cuero | murió (555 s) / amaneció | amaneció (15.5) / murió (359 s) |
| Asedio día 5, cuero | ganó (16 / 20) | ganó (14.5 / 15.5) |
| Asedio día 10, cuero / hierro | ganó (18–20) | ganó (16.5 / 8–20) |
| Asedio día 15 y 30 | ganó (18–20) | ganó (17.5–20) |
| Noche Larga día 20, hierro | ganó (10.5 / 13.5) | ganó (7.5 / 14.5) |
| Noche Larga día 30, diamante | ganó (19 / 24) | ganó (19 / 19) |

### Lectura
- **El aturdimiento hizo lo que se buscaba:** las Sombras con estrellas y las grandes ya pegan entre golpe y golpe (la 2★ con
  madera le baja 7.5, antes 0), sin volver injusto lo común. Con madera la Sombra común se sigue ganando 3 de 3, y los asedios
  del día 5 se ganan los dos. **No hizo falta ningún ajuste extra.**
- La primera noche sin armas se perdió las dos veces. Ya estaba escrito así («a la intemperie y sin nada ya no se aguanta»), y
  con madera o con piedra se amanece.
- El escarabajo común tarda más con espada (10 s con madera, antes 6.7), porque ya no se tambalea con cada golpe, pero pega
  menos: gana 2 de 3. Si se quiere que la madera alcance siempre, la perilla siguiente es la vida, **42 → 34**. No se aplicó.
- El Toro Guaco con madera ahora se pierde 1 de 3 (antes 3/3). Es lo esperado sin el aturdimiento encadenado. Se deja así.
- El Hércules con diamante bajó a 40 s. Si se quiere llegar a la meta de 30–35 s, vida **280 → 250**. No se aplicó.
- Falla del bot: después de una Noche Larga, la primera noche con madera terminó en 0 s con «amaneció», porque el día se pasó
  en el primer cuadro. No es del juego. Queda anotado para el próximo arreglo del bot.

## El Rey Zopilote, cuatro fases (v12.16.2, 14-nov): medido con `tools/bot-pelea.js` (`jefeJade`, duelo sin arena)
Cerebro nuevo (coraza, rasante, escolta, combo de la F4, golpe final; umbrales 70/40/12 %). Nuevo en el bot: perfil `fuerte` (torpe 0, promedio 0.3, hábil 0.7): el golpe fuerte rompe la coraza.
- Primera pasada con la vida del diseño (1 000) y presión 0.85: promedio 36 s, hábil 24 s, torpe moría siempre. El diseño suponía 18–20 hp/s del bot y mide **≈ 40 hp/s en el aire y ≈ 100 hp/s a pie** (jade ★3 con plato de fuerza). Por eso se recalibró, como manda `jefes-balance.js`: **vida 2 900** (×escala de red al nacer), **presión 0.25**, y `AGUANTE_FASE` = {F1 1, F2 1, F3 0.4, F4 0.3} (a pie le entra menos de cada golpe, para que las fases 3 y 4 no pasen en 8 s).
- Tanda final (4 duelos por perfil): torpe 3/4 (TTK 240 s, murió 1; no puede romper la coraza), **promedio 4/4, TTK 86 s, recibido 12.8**, **hábil 4/4, TTK 79 s, recibido 8.0** (meta 6–9 ✔). Fases (s, hábil): 20 / 16 / 19 / 8.
- **Pendiente de nanoyackson:** la meta «100–130 s» se cumple solo como promedio de los tres perfiles (≈ 135); por perfil, promedio y hábil quedan en 80–86 s y el torpe en 240 s. Subir la vida a ~3 500 lleva al promedio a ~100 s pero empuja al torpe sobre el tope de 400 s. El daño recibido de cada ataque (picada, picotazo, rayo, pluma, rasante, combo 5-5-6) no se midió por separado.
- Prueba jugada en el navegador (mundo `prueba-rey`, borrado): la Corona arma el redondel; con la vida forzada a 90/60/35/10 % pasa por las 4 fases (anillo 26→18, coraza en F3, rodillas a ≤ 5 %), el golpe final lo vence, sale `meta.reyZopilote` y 45 s después el redondel queda restaurado (0 bloques de diferencia).
- **Decidido (orquestadora, 14-nov):** la vida del Rey se queda como quedó en v12.16.2 (2 900; hábil ~80 s, promedio ~86 s). No se sube para llegar a la banda 100–130 s por perfil.

## Jefes: fase 0 medida de verdad (v12.4.8, 12-nov)
`tools/bot-pelea.js`: perfiles `torpe` / `promedio` / `habil` (parry con el brillo dorado, voltereta ante lo rojo y arco contra lo que vuela), equipos `jefeHierro` / `jefeDiamante` / `jefeJade` y `JEFES()` con los 23 jefes (el Capitán de la goleta no se mide: fuera de su barco no pelea).
- 690 duelos: 10 por jefe y perfil.
- En la cancha queda solo el jefe; antes, culebras terciopelo y zancudos daban casi la mitad del daño medido.

TTK y daño recibido del torpe; p = la probabilidad de que el promedio gane a la primera.

| Jefe | Vida | TTK torpe | Recibido torpe | p torpe / prom / hábil | Recibido prom |
|---|---|---|---|---|---|
| Terciopelo reina | 55 | 6.8 | 17.1 | 0.5 / 1 / 1 | 5.3 |
| Cocodrilo | 130 | — | muere | 0 / 0.3 / 0.9 | 2.3 |
| Jaguar viejo | 90 | 6.2 | 13.9 | 1 / 1 / 1 | 4.1 |
| Llorona · Segua · Mona · Cadejos | 60–90 | 4–5.4 | 2.3–6 | 1 / 1 / 1 | 2–4.5 |
| Viejo del Monte | 130 | 6.4 | 12.9 | 1 / 1 / 1 | 4 |
| Tulevieja | 140 | 50 | 28.8 | 1 / 1 / 1 | 8.7 |
| Mono congo | 170 | 7.6 | 15.9 | 1 / 1 / 1 | 8.8 |
| Reina Bananera | 260 | 16.9 | 17.9 | 1 / 1 / 1 | 4.4 |
| Cascabel | 280 | 17.6 | 15.9 | 1 / 1 / 1 | 17 |
| Don Cornudo | 280 | — (TTK estimado 50) | muere | 0 / 0.8 / 1 | 12.7 |
| Tata Sapo | 300 | 12.1 | 14 | 1 / 1 / 1 | 5.6 |
| Cangrejo Rey | 320 | 35.9 | 26.8 | 0.5 / 1 / 1 | 14.4 |
| Ciempiés Rey | 360 | — (TTK estimado 22) | muere | 0 / 0.9 / 1 | 16.6 |
| Murciélago Rey | 110 | 17.9 | 0.5 | 1 / 1 / 1 | 0 |
| Jefa de Ventanilla | 240 | 11.9 | 9.1 | 1 / 1 / 1 | 4.5 |
| Señor del Arenal | 320 | 11 | 2.8 | 1 / 1 / 1 | 0.8 |
| Arpía | 260 | 23.6 | 3.6 | 1 / 1 / 1 | 1.9 |
| El Olvido | 340 | 6.4 | 2.9 | 1 / 1 / 1 | 1.5 |
| Sombra Madre | 220 | 5.1 | 1.3 | 1 / 1 / 1 | 0.3 |
| **Rey Zopilote** | 900 | 32.4 | 26.2 | 0.3 / 0.8 / 1 | 11.8 |

**Lo que dicen los datos:**
- Se confirma la inversión del informe: el tramo C es mucho más fácil que el B.
- Don Cornudo es una pared (el torpe no lo baja) y el Tata Sapo es más fácil que sus vecinos.
- El Rey cae en ~32 s (el objetivo es 100–130).

**Fase 1 (primera propuesta, ya reemplazada por la tabla de abajo):**
- **Vida:** vida × TTK objetivo / TTK del torpe.
- **Daño:** el multiplicador con el que el promedio reciba lo que da las muertes objetivo de la tabla 1.3 (con ±35 % de variación entre peleas).
- **La tabla:** {"terciopelo_reina":[55,1.45],"cocodrilo_gigante":[105,0.5],"jaguar_viejo":[125,1.85],"llorona":[60,3],"segua":[80,2.1],"mona":[125,1.65],"cadejos":[140,3],"viejo_monte":[175,1.9],"tulevieja":[70,3],"mono_congo_gigante":[275,0.8],"reina_bananera":[230,1.95],"cascabel_rey":[290,0.6],"escarabajo_hercules":[120,0.7],"sapo_tata":[595,0.8],"cangrejo_rey":[250,0.9],"ciempies_rey":[515,0.4],"rey_murcielago":[205,3],"jefa_ventanilla":[365,1.4],"senor_arenal":[815,3],"arpia":[330,3],"el_olvido":[795,2.55],"sombra_madre":[660,3],"rey_zopilote":[2850,0.3]}
- **Cómo aplicarla:** el script listo está en el scratchpad de la sesión (`fase1.py`):
  - `src/jefes-balance.js`;
  - la armadura `min(0.80, p·0.03 + d·0.02)`;
  - los rayos del Rey con `'media'`;
  - la presión de daño en `damagePlayer`, solo sobre los golpes que llevan el nombre del jefe.
- Después hay que volver a medir con `JEFES()` y corregir una vez.
- **Cuidado:**
  - el multiplicador de 3 de varios jefes está en el tope (en el tramo C la presión hay que subirla con más ataques, no con golpes más grandes);
  - el TTK de lo que vuela usa el perfil promedio, porque el torpe no tiene arco.

### El pescador con el restaurante de lujo (v12.8.6)
| Perfil | u por día | Al día 30 |
|---|---|---|
| Trabajador | 55.6 | ₡589 000 |
| Cazador | 58.3 | ₡629 737 |
| Comerciante | 43.8 | ₡412 300 |
| **Pescador** (sin lujo) | **47.4** | ₡465 869 |
| **Pescador (con lujo)** | **51.7** | ₡530 109 |
| Artesano (C6, todavía no existe) | 42.9 | ₡397 793 |

- **El restaurante de lujo** (`chef_lujo`) paga: pargo 1.25, dorado 4.5, atún 3.5, pez gallo 2 y langosta 7. Antes pagaba 2, 8, 6, 3 y 8, que en la revisión daban 57–71 u/día.
- **La variante con lujo** vende también allá, en otro pueblo y con su propio cupo de 30 u por ítem. Casi todo lo que gana de más sale de ese segundo cupo, no del precio.
- **Por zona (sin lujo / con lujo):** río 29 / 29 · estero 32 / 32 · orilla 38 / 42 · arrecife 40 / 43 · altamar 42 / 47.
- **El comerciante baja de 48.3 a 43.8:** `pago()` toma el mejor comprador, y el de sus 6 pargos diarios era el lujo.

### El pescador (v12.8.4): meta 42–48 u/día
| Perfil | u por día | Al día 30 |
|---|---|---|
| Trabajador | 55.6 | ₡589 000 |
| Cazador | 58.3 | ₡629 737 |
| Comerciante | 48.3 | ₡479 800 |
| **Pescador** | **47.4** | ₡465 869 |
| Artesano (C6, todavía no existe) | 42.9 | ₡397 793 |

- **Pescador por día:** 29 el día 1; con la caña de fibra, 32–51; con bote y nasas, 49–51.
- **Por zona:** río 29 · río frío 35 · estero 32 · orilla 38 · arrecife 40 · altamar 46.
- **Precios:**
  - el muelle paga pargo y corvina a 0.75, dorado a 3, pez gallo a 1.5 y atún a 2.5;
  - las sodas pagan 1 por el pargo, la corvina, el róbalo, el sábalo y el pargo mancha, y 3.5 por el dorado;
  - la perla de la caña sale el 0.5 % de las veces.

### Fase 2, tramo A: el Cocodrilo con presión 0.6 (v12.8.4, 10 duelos por perfil)
| Presión | p torpe / prom / hábil | TTK prom | Recibido prom |
|---|---|---|---|
| 0.5 (v12.8.1) | 1 / 1 / 1 | — | 5.4 |
| 0.6 | 0 / 0.8 / 1 | 7.9 | 8.4 |
| 0.7 | 0 / 0.7 / 1 | 8.3 | 8.1 |
| 0.8 | 0 / 0.8 / 1 | 8.4 | 14.6 |

### El pescador (v12.8.3): el bot con las tablas del juego, el cupo por ítem y el oro
| Perfil | u por día | Al día 30 |
|---|---|---|
| Trabajador | 55.6 | ₡589 000 |
| Cazador | 58.3 | ₡629 737 |
| Comerciante | 48.3 | ₡479 800 |
| **Pescador** | **57.5** | ₡617 561 |
| Artesano (C6, todavía no existe) | 42.9 | ₡397 793 |

- **Pescador por día:**
  - día 1: 32 u;
  - con la caña de fibra (días 2–7): 38–61 (≈ 45–50);
  - con bote, caña de altamar y nasas: 60–61.
- **Por zona:** río 32 · río frío 38 · estero 38 · orilla 47 · arrecife 49 · altamar 58.
- **Sin modelar:** cocina, ostión y piangua (la revisión estima ≈ 100 u/día de máximo si se suman).

### El pescador (v12.8.2, `tools/bot-economia.js`, perfil «pescador»): meta ≈ 45 u/día con la caña de fibra
| Perfil | u por día (promedio del mes) | Al día 30 |
|---|---|---|
| Trabajador | 55.6 | ₡589 000 |
| Cazador | 58.3 | ₡629 737 |
| Comerciante | 48.3 | ₡479 800 |
| **Pescador** | **55.8** | ₡592 207 |
| Artesano (C6, todavía no existe) | 42.9 | ₡397 793 |

- **Pescador por día:**
  - día 1, en el río con lombriz: 29 u;
  - días 2–7, con la caña de fibra, alternando estero y arrecife: 41–61 (≈ 45–50 en promedio);
  - desde el bote, la caña de altamar y las 6 nasas: 58–61.
- **Por zona** (`tier`, con el cupo): río 29 · río frío 35 · estero 41 · orilla 45 · arrecife 50 · altamar 55.
- **Qué se cambió:**
  - el muelle ya no vende pargo ni corvina, y el dorado lo vende a 9 (la regla de oro dejaba lo que pagaba en 0.5 u);
  - las sodas pagan algo menos por los peces de mar;
  - las nasas son más lentas (estero 450 s, arrecife 900 s).
- **Criterios:** los de siempre, en verde (razón 1.21). «Pescador y artesano pagan la comida» falla solo por el artesano, por su inversión del día 1.

### Fase 2 medida, tramo B (v12.8.7): avisos de los seis jefes (10 duelos por celda, torpe y hábil)
| Jefe | Vida · presión | p torpe / hábil | TTK hábil (tabla) | Daño sin aviso |
|---|---|---|---|---|
| Reina Bananera | 220 · 2.3 | 0 / 0.9 | 14.2 (17) | 0 % |
| Cascabel | 285 · 0.55 | **1** / 1 | 19.5 (18) | ≈ 25 % |
| Don Cornudo | 125 · 1.4 | 0.2 / 1 | **7** (~34) | 0 % |
| Tata Sapo | 585 · 1 | 0 / 1 | **16.3** (25) | 0 % |
| Cangrejo Rey | 245 · 1.3 | 0 / 1 | 22.5 (29) | 0 % |
| Ciempiés Rey | 520 · 0.4 | 0.1 / 1 | 23.8 (32) | 0 % |

### Fase 2B-bis medida (v12.8.8; 10 duelos por celda)
| Jefe | vida · dano | p torpe / hábil | TTK hábil (tabla) | Recibido hábil | Sin aviso |
|---|---|---|---|---|---|
| Cascabel | 165 · 0.25 (veneno 2 s, anillo de salida) | **1** / 1 | 16.5 (18) | 6.7 | 0 % |
| Don Cornudo | 300 · 0.8 | 0 / 1 | 20.7 (21) | 6.8 | 0 % |
| Tata Sapo | 750 · 1.1 | 0 / 1 | 24.6 (24) | 4.3 (8–10) | 0 % |
- Aceptables: el torpe aún gana a la Cascabel y al Tata le falta daño sobre el hábil; subir `dano` no movió el recibido en una tanda.
- *(Anotado antes de la 2B-bis)* **Pendiente (2B-bis):** subir `dano` de la Cascabel (el torpe gana siempre) y buscar su golpe sin aviso; Cornudo, con ×2 trabado y ×1.25 de costado, muere muy rápido (subir vida); el Tata, algo rápido. Retocar uno por uno y volver a medir.

### Fase 2 medida, tramo A (v12.8.1): avisos de la Terciopelo, el Cocodrilo y el Mono congo (10 duelos por celda)
| Jefe | Vida · presión | p torpe / prom / hábil | TTK torpe | Recibido prom | Daño sin aviso |
|---|---|---|---|---|---|
| Terciopelo reina | 50 · 1.3 | 0.2 / 1 / 0.9 | 6.7 | 6.9 | 0 % |
| Cocodrilo | 85 · 0.5 | 1 / 1 / 1 | 8.3 | 5.4 | 0 % |
| Mono congo | 290 · 1.55 | 0 / 0.5 / 1 | — | 10.9 | 0 % |

- El amago de `atacar` cuenta como aviso; los mangos del Mono no cuentan como golpe del jefe (sin `g.atacante`, a propósito).

### Fase 1 aplicada (v12.4.8): verificación con la tabla final (5 duelos por celda; la Mona, la Jefa y el Rey con 8)
| Jefe | Vida | TTK torpe (obj.) | p promedio (obj.) | p hábil |
|---|---|---|---|---|
| Terciopelo · Cocodrilo · Jaguar | 50 · 85 · 105 | ~8 · ~9 · ~7 (7.5 · 10.5 · 8.5) | 0.8 · 0.8 · 0.8 (0.88–0.95) | 1 |
| Leyendas (Llorona … Viejo del Monte) | 50–175 | 5–8 (5–8.5) | 0.8–1 (0.87–0.93) | 1 |
| Tulevieja | 60 | ~16 (10) | 1 (0.85) | 1 |
| Mono congo | 290 | ~13 (12.5) | 0.6 (0.88) | 1 |
| Reina · Cascabel · Cornudo · Sapo · Cangrejo · Ciempiés | 220 · 285 · 125 · 585 · 245 · 520 | 17 · 18 · ~34 · 25 · 29 · 32 (15–32) | 0.8 · 1 · 1 · 0.6 · 0.6 · 1 (0.75–0.88) | 1 |
| Murciélago Rey · Jefa de Ventanilla | 215 · 400 | 24 · ~21 (18 · 18) | 1 · varía (0.8 · 0.78) | 1 · 0.6 |
| Señor del Arenal · Arpía · El Olvido · Sombra Madre | 815 · 345 · 865 · 855 | 28 · 35 · 17 · 16 (28 · 30 · 15 · 15) | 0.8 · 1 · 1 · 1 (0.68–0.72) | 1 |
| **Rey Zopilote** | **3 100** | **110** (115) | **0.88** (0.5) | 1 |

- **Lectura:**
  - el TTK sube parejo por tramo (A 5–9 s, B 17–34, C 16–35, Rey 110);
  - el hábil gana casi todo y el torpe pierde casi todo;
  - el promedio queda entre 0.6 y 1, cerca de lo pedido o algo más fácil.
- **Pendiente:**
  - medir 10 por celda en 2 o 3 mundos (el ruido entre mundos es grande);
  - en el tramo C, más ataques en lugar de más daño;
  - el Rey, con una persona.
- **La tabla vive en `src/jefes-balance.js`.** Para recalibrar se corre `JEFES()` y se reescala: la vida × (TTK objetivo / TTK medido) y el daño × (recibido objetivo / recibido medido).

### Mañas de jefe y premios del Rey (v12.16.5)
- Una maña por jefe la primera vez que cae, sin gastar casillas de nivel (`meta.manasJefe`): Reina → Seda de la Reina (telaraña y veneno de araña ×0,5); Cascabel → Oído de cascabel (+0,15 s en los avisos); Cornudo → Cuerno firme (embestida ×0,5); Tata Sapo → Panza de sapo (veneno −30 %); Cangrejo Rey → Concha (escudo +20 %, parry +0,05 s); Ciempiés Rey → Mil patas (barrido y esquive −25 % de aire); Señor del Arenal → Piel de ceniza (lava y fuego −30 %); Arpía → Pluma al viento (planeo −25 % de caída); Rey → Rey de la cumbre (+2 corazones).
- Premios del Rey una sola vez por persona (`meta.reyPremio`): Campana de la casa, Foto de la cumbre (si subió alguien) y Cigarros del 62 (si subió Anselmo); la plata ya se paga una vez (`premioBaja`), la revancha un décimo. La Mantilla de Zenaida (−5 % de daño en el bolso) la deja el epílogo una vez.
- La gente de la ladera: Eulalia (+6 min de aguante), Chepa (+6 min de fuerza; en F3 con hambre, otro plato), Flor (cura 6–10 bajo la mitad), Wilber (flecha de 5 cada 2 s a la escolta), Tino (arma al 100 % una vez bajo el 20 %). No cambian la vida del Rey: la curva medida en v12.16.2 sigue como línea base; con toda la gente arriba el combate se siente más fácil, y 👁 nanoyackson decide si hay que subir la vida o quitar ayudas.
