# Balance de la progresión (v13.2.4, ajustado en la v13.2.6)

> **v13.2.6:** el recorte de daño de la v13.2.4 se pasó (de ×5,2 a ×1,4; Isaac pidió «un poco»). Isaac eligió el punto medio: **tope ×2** y defensa con piso **×0,62**. Los bonos de daño se escalaron para que con todo al máximo sumen +0,99 (nivel +23 %, Combate +15 %, maestría +15 %, yunque +28 % con ★★★★, Mano pesada +5 %, plato +8 %, conjunto de diamante +5 %). La defensa suma 8+4+9+6+3 % y +8 % del Guerrero = ×0,62. La experiencia y el resto de los bonos quedan como en la v13.2.4. Las columnas «Ahora» de abajo son las de la v13.2.4; las cifras de la v13.2.6 están en esta nota y en la tabla de más abajo.

Pedido de Isaac: «nerfear un poco los porcentajes de daño y demás mejoras que me dan incremental al subir de nivel y mañas, que sea un poquito más lenta la progresión». Misma línea que `BALANCE_PICAR.md` (v13.0.5): los bonos se suman con tope en vez de multiplicarse.

## Inventario de bonos (dónde vive cada uno)

| Bono | Dónde | Antes | Ahora |
|---|---|---|---|
| Daño por nivel del jugador | `habilidades.js` (`danoNivel`), `game.js` (`damageBonus`) | +5 % por nivel, tope +50 % | v13.2.4: +3,5 %, tope +30 % · **v13.2.6: +2,7 %, tope +23 %** |
| Combate (habilidad) | `habilidades.js` (`mult.danoSuma`) | +3 % por nivel (nivel 10 = +30 %) | v13.2.4: +2 % · **v13.2.6: +1,5 % (+15 %)** |
| Maestría de arma | `maestria.js` | +1,5 % por nivel (20) y −1,5 % de aguante | v13.2.4: +1 % y −1 % · **v13.2.6: +0,75 % de daño** (aguante −1 %) |
| Estrellas del yunque (daño) | `game.js` (`asestar`), `yunque.js` | ×(1 + 0,12 por ★), multiplicado | v13.2.4: +9 % · **v13.2.6: +7 % por ★, sumado** |
| Maña Mano pesada · plato de fuerza | `progreso.js` (`ventaja.danoSuma`) | ×1,10 · ×1,15 | v13.2.4: +7 % · +10 % · **v13.2.6: +5 % · +8 %** |
| Conjunto de diamante | `habilidades.js` (`DANO_CONJUNTO`) | ×1,10 | v13.2.4: +7 % · **v13.2.6: +5 %** |
| Tope de todo el daño | `habilidades.js` (`danoTotal`) | sin tope (×5,2 al máximo) | v13.2.4: ×1,4 · **v13.2.6: ×2** |
| Puntería · Se le pega la plata | `progreso.js` | ×1,25 · ×1,25 | ×1,15 · ×1,15 |
| Defensa: Guardián, Guerrero (Combate 10), ojo, coraza, Cuero duro, amuleto | `progreso.js` (`ventaja.recibido`), `habilidades.js` (`mult.recibido`) | multiplicados: 0,9·0,9·0,95·0,88·0,92·0,95 = ×0,59 | v13.2.4: suman 7+7+3+8+5+3 %, piso ×0,70 · **v13.2.6: 8+8+4+9+6+3 %, piso ×0,62** |
| Estamina del rango · hoja «aguante» | `progreso.js` | ×1,2 · ×1,15 | ×1,12 · ×1,1 |
| Vida del rango Leyenda | `progreso.js` (`regen`) | 30 % más rápida | 20 % |
| Hambre/sed: rango, hoja, mañas | `progreso.js`, `cuaderno.js`, `manas.js` | 8 / 5 / 15 / 25 % | 5 / 3 / 10 / 18 % |
| Cocina, comida (hoja, cucharón, maña) | `habilidades.js`, `progreso.js` | 5 % por nivel · 10 / 20 / 15 % | 3,5 % por nivel · 7 / 12 / 10 % |
| Exploración · pesca (pican antes) | `habilidades.js` | 3 % · 5 % por nivel | 2 % · 3,5 % |
| Chance de doble (minería, tala, pesca, agricultura) | `habilidades.js` (`mult.doble`) | 1,5 / 2 / 3 / 6 % por nivel | 1 / 1,5 / 2 / 4 % |
| Velocidad de picar | `habilidades.js` | ya sumada y topada en ×1,5 (v13.0.5) | sin cambio |

Experiencia: `armas.js` (`xpNeed`, nivel del jugador y las mañas, que llegan en los niveles 2, 4, 7, 10, 13…) y `habilidades.js` (`necesitaHabilidad`).

## Experiencia: antes y después (la tabla sale de `node tools/revisar-progresion.mjs`)

```

Experiencia total para llegar al nivel (jugador):
  nivel | antes | ahora | +%
      1 |    10 |    10 | 0 %
      3 |    48 |    48 | 0 %
      5 |   110 |   111 | 1 %
      8 |   248 |   267 | 8 %
     10 |   370 |   417 | 13 %
     15 |   780 |   950 | 22 %
     20 |  1340 |  1678 | 25 %
     30 |  2910 |  3719 | 28 %

Experiencia para llegar al nivel de una habilidad (Minería, Combate…):
  nivel | antes | ahora | +%
      1 |    18 |    18 | 0 %
      2 |    58 |    58 | 0 %
      3 |   117 |   121 | 3 %
      5 |   278 |   312 | 12 %
      8 |   617 |   772 | 25 %
     10 |   902 |  1128 | 25 %

Multiplicador de daño con TODO al máximo: antes ×5,22 · ahora ×1,40 (tope ×1,40)

Daño de la espada: sin bonos / con todo al máximo (antes → ahora):
  wood    4 / 20,88 → 5,60
  stone   5 / 26,10 → 7,00
  iron    6 / 31,32 → 8,40
  diamond 7 / 36,54 → 9,80
  jade    8 / 41,77 → 11,20

Bono de daño solo por nivel del jugador (antes → ahora):
  nivel  1: +5 % → +3 %
  nivel  3: +15 % → +10 %
  nivel  5: +25 % → +18 %
  nivel  8: +40 % → +28 %
  nivel 10: +50 % → +30 %
  nivel 15: +50 % → +30 %

Daño recibido con TODO al máximo (Guerrero, rango, ojo, coraza, cuero duro, amuleto): antes ×0,59 · ahora ×0,70 (piso ×0,70)

Migración 9 → 10: xp 500 → 586 (nivel 11 → 11), Minería 300 → 340

Balance de la progresión: bien.
```

Los niveles 1 a 3 cuestan igual; lo lento se nota del nivel 5 en adelante.

## Daño y defensa en la v13.2.6 (sale de `node tools/revisar-progresion.mjs`)

| Espada | Sin bonos | Todo al máximo v13.2.3 | v13.2.4 (×1,4) | **v13.2.6 (×2)** |
|---|---|---|---|---|
| Madera | 4 | 20,88 | 5,60 | **7,96** |
| Piedra | 5 | 26,10 | 7,00 | **9,95** |
| Hierro | 6 | 31,32 | 8,40 | **11,94** |
| Diamante | 7 | 36,54 | 9,80 | **13,93** |
| Jade | 8 | 41,77 | 11,20 | **15,92** |

Bono de daño solo por nivel del jugador (v13.2.3 → v13.2.6): nivel 1 +5 % → +3 %; 3: +15 % → +8 %; 5: +25 % → +14 %; 8: +40 % → +22 %; 10 y más: +50 % → +23 %.
Daño recibido con todo al máximo: antes ×0,59, v13.2.4 ×0,70, ahora **×0,62** (piso ×0,62).

## Reglas de oro (están en `npm run revisar`)

- El daño con TODO al máximo llega al tope ×2 (±0,03) y no pasa de 16 en ninguna espada; la de madera queda en ≈ 8.
- Una espada de madera con todo al máximo (7,96) no pega más que una de jade con todo al máximo (15,92), y **a igual nivel de bonos (sin bonos, a medias, al máximo) el material siempre manda**: cada material pega más que el anterior.
- El bono por nivel del jugador no pasa de +23 %.
- La defensa no baja de ×0,62.
- Los niveles 1 a 3 cuestan igual que antes; el nivel 10 del jugador, entre 25 y 30 % más; las habilidades altas, entre 20 y 25 %.
- La migración no cambia el nivel de ninguna partida.

## Partidas guardadas

`SAVE_FORMAT` 10. La migración 9 → 10 (`save.js`: `reescalarXp`, `reescalarHabilidad`) reescribe la experiencia con la curva nueva sin tocar el nivel ni la proporción que lleva del siguiente. Los jugadores con nivel alto conservan su nivel; solo cambian los valores de los bonos.
