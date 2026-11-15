# Balance de picar (v13.0.5)

Reporte de Isaac: «a nivel 3 de minería, picar con pico de madera es como si fuera de diamante encantado». Medido con `game.breakTime` en un mundo de prueba (survival) y picando de verdad (clic sostenido simulado en `handleMouse`): coincide a la centésima.

## Qué acelera picar (todo lo que se encontró)

`breakTime` = `dureza × 1.5` ÷ (velocidad base de la herramienta) ÷ (otros factores). Nada más toca el progreso: el avance es `progress += dt` (sin cooldown entre bloques, sin minar en área, sin auto-picar). Los factores eran:

| Factor | Valor antes | Cómo se combinaba |
|---|---|---|
| Velocidad base del pico (`TOOL_MATS`) | madera 2, piedra 4, hierro 6, diamante 8, jade 10 | base |
| Yunque (`factorMejora`) | +12 % por estrella (3 estrellas; 4 con Ñor Tino) | **×** |
| Minería (`mult.picar`) | +4 % por nivel (nivel 10 = +40 %) | **×** |
| Hoja «manos» (cuaderno) | ×1,10 | **×** |
| Maña «buen brazo» | ×1,15 | **×** |

Todo multiplicado entre sí: con todo al máximo el factor era 1,48 × 1,40 × 1,10 × 1,15 = **×2,6**, y por eso un pico de madera «bien criado» alcanzaba al de piedra y el de piedra al de hierro. (La Minería nivel 3 sola da solo ×1,12; el salto grande viene del yunque y de las hojas/mañas apiladas.)

Los «oficios», comidas, efectos y bonos de jefes o de la red **no** cambian el tiempo de picar (se revisó `game.js`, `progreso.js`, `manas.js`, `cuaderno.js`, `habilidades.js`, `yunque.js`).

## Tiempos reales de picar, en segundos (antes → después)

Piedra: dureza 1,5, tier 1. Mineral de hierro: dureza 3, tier 2 (con pico de madera, tier insuficiente: ×3,3 y no suelta nada).

| Caso | Piedra antes | Piedra después | Hierro antes | Hierro después |
|---|---|---|---|---|
| Pico de madera, todo en 0 | 1,13 | 1,13 | 7,42 | 7,42 |
| Pico de madera, Minería 3 | 1,00 | 1,06 | 6,63 | 7,00 |
| Pico de madera, Minería 3 + lo normal (★1, manos, buen brazo) | 0,71 | 0,92 | 4,68 | 6,09 |
| Pico de diamante ★★★ | 0,21 | 0,24 | 0,41 | 0,48 |
| Pico de diamante, todo al máximo | 0,11 | 0,19 | 0,21 | 0,38 |
| Pico de piedra, sin bonos | 0,56 | 0,56 | 1,13 | 1,13 |
| Pico de piedra, todo al máximo | 0,21 | 0,38 | 0,43 | 0,75 |
| Pico de hierro, sin bonos | 0,38 | 0,38 | 0,75 | 0,75 |
| Pico de madera, todo al máximo | 0,43 | 0,75 | 2,83 | 4,95 |

«Todo al máximo» = Minería 10, yunque ★★★★, hoja «manos» y maña «buen brazo».

**Regla de oro (antes rota):** madera al máximo (0,43 s) era más rápido que piedra sin bonos (0,56 s), y piedra al máximo (0,21 s) más rápido que hierro sin bonos (0,38 s). Ahora: 0,75 s > 0,56 s, y 0,38 s = 0,38 s (empate, nunca más rápido).

## Qué cambió

- Los bonos de velocidad se **suman** (yunque + Minería/Tala + hoja + maña) y el total se topa en **×1,5** sobre la velocidad base (`velocidadPicar` en `habilidades.js`, la usa `game.breakTime`).
- Minería +2 % por nivel (máx. +20 %), mineral doble +1,5 % por nivel. Tala +2,5 % y tronco doble +2 %.
- Yunque: +6 % de velocidad por estrella (el daño sigue en +12 %).
- Hoja «manos» y maña «buen brazo»: de ×1,10 y ×1,15 a +5 % cada una.
- Escala entre materiales: se dejó (2, 4, 6, 8, 10): cada salto es ×1,5 o más, y el tope ×1,5 basta para que la regla de oro se cumpla.
- Las partidas guardadas no se tocan: el XP y las estrellas valen igual, pero cada uno rinde menos.
- La verificación es `tools/revisar-picar.mjs` (en `npm run revisar`).
