# Fase 0: la curva de los jefes (encargo 25)

Medición pedida por `DISENO_JEFES_Y_FINAL.md` (sección 5, Fase 0). Solo lectura: no toqué código del juego ni hice commits.

## Lo primero: qué es esto y qué no es

- **`tools/bot-pelea.js` no se puede correr desde aquí.** Es un módulo de navegador (importa `/src/estrellas.js` por ruta absoluta y maneja `window.nanoblocks`), y mis reglas prohíben abrir navegador o `npm run dev`. Por eso **no hay corridas del juego real**.
- **Lo que hice:** un simulador de Monte Carlo en Node (`curva-jefes.mjs`) alimentado con los **datos reales de `src/`** (vida, golpe, cadencias y avisos de cada jefe; daño de las armas; fórmula de armadura de `game.js damagePlayer`; regeneración de `player.js`) y **calibrado contra los duelos que sí se midieron** (`docs/BALANCE.md`). Corrí **400 peleas por celda** (jefe × equipo × perfil), más que las 20 pedidas.
- **Honestidad sobre el alcance:** el modelo reproduce bien los 4 duelos medidos (tabla abajo), pero de los 24 jefes **solo 4 tienen medición real**. Los otros 20 usan el daño por segundo del grupo de afinidad (`armas3.js GRUPO`) y los ataques leídos del código. Todo lo que dependa de eso es **estimación (±30 %)** hasta que alguien corra los duelos en el navegador (ver «Qué hace falta para cerrar la Fase 0»).
- **Los scripts** están en la carpeta de notas compartida: `…\side-session-notes\local_fb4cc01b-…\fase0-simulador\` (`curva-jefes.mjs`, `calibra.mjs`, `correr.mjs`, `ajustar2.mjs`, `rey-*.mjs`, `res.json`). Se corren con `node correr.mjs salida.json`.

## Resumen (lo que decide la vida del Rey y si los jefes suben parejo)

1. **La curva NO sube pareja: el daño recibido se desploma en el tramo C.** Con el equipo esperado, un jugador promedio recibe ~13 de 20 contra el Cascabel (hierro) y ~20 contra Don Cornudo, pero **1.6 contra la Arpía y 3 contra el Señor del Arenal** (diamante). La causa es una sola línea: la armadura de diamante y la de jade **pasan solo el 12 %** del daño (`1 − min(0.88, puntos·0.04 + dureza·0.02)`), contra el 40 % del hierro. **El jade no mejora nada** frente al diamante: ambos topan en el 88 %, así que su dureza extra se desperdicia.
2. **Don Cornudo es una pared** (hoy, con hierro 1★): 3.8 muertes esperadas del jugador promedio, TTK 34 s. Su caparazón deja pasar solo ~40 % del daño (7 hp/s medido) y su cuerpo a cuerpo es el más duro del grupo (22.7 de daño medido con diamante).
3. **El Tata Sapo es un regalo** (TTK ≈ 12 s, recibe 4 de daño): cae casi tres veces más rápido que sus vecinos Cornudo y Cangrejo Rey. *(Estimación: es el que más depende de que `cuero` sea la afinidad correcta; hay que medirlo.)*
4. **El Rey Zopilote de hoy (900 de vida) cae en ~44 s** (objetivo 100–130), y es **desigual**: el jugador torpe muere 7 de cada 10 intentos y el hábil casi nunca. **Casi todo su daño real sale de los rayos de la fase 2, que ignoran la armadura** (`final.js rayo()`: `damagePlayer(6, null, null, …, true)` sin el sexto argumento `armored`).
5. **Para ~1 muerte promedio en la pelea final:** vida **900 → ≈ 2 200** y golpes **×0.85** (rayo 6 → 5, pluma 3 → 2.5, picada 8 → 7), con las mismas ventanas de ataque. Es sensible a cuánto esquiva el jugador real: con el 25 % de esquive son 2.6 muertes; con el 55 %, 0.26. **Hay que probarlo con una persona** antes de fijarlo.

---

## 1. Datos reales de cada jefe (de `src/`)

*Velocidad* = `kind.speed` (bloques/s). *Defensa* = grupo de afinidad de `armas3.js` y su factor contra el **corte** de la espada (caparazón 0.6, sombra 1.2, espanto 0.7, cuero 1.0, reptil 0.75, piedra 0.65, volador 1.1); la armadura del jugador reduce lo que pega el jefe (sección 3). *Golpe* = `kind.attack`. Los ataques especiales con **`✗`** pasan la armadura (`damagePlayer(..., true)` sin `armored`).

| # | Jefe | Vida | Golpe | Vel. | Defensa | Ataques especiales (daño · cada cuánto · aviso) | Archivo |
|---|---|---|---|---|---|---|---|
| 1 | Terciopelo reina | 55 | 6 | 2.0 | reptil | mordida 6 + veneno 20 s ✗ · 2.6 s; escupe 2 ✗ + veneno · ~4 s | `armas2.js` |
| 2 | Cocodrilo del Tárcoles | 130 | 10 | 1.4 | reptil | mordida 10 · 2.8 s (en el agua arrastra) | `armas2.js` |
| 3 | Jaguar viejo | 90 | 7 | 3.6 | cuero | zarpazo 7 · 2.4 s; salto con anillo 0.45 s | `armas2.js` |
| 4a | Llorona | 60 | — | 1.2 | espanto | drenaje 1 ✗ · 2.2 s; lágrimas 2 ✗ | `leyendas.js` |
| 4b | Segua | 70 | 4 | 2.4 | espanto | mordida 4 · 1.1 s | `leyendas.js` |
| 4c | Mona | 70 | 4 | 2.8 | cuero | caída 5 · ~6 s | `leyendas.js` |
| 4d | Cadejos | 90 | 4 | 2.6 | cuero | mordida 4 · 1.5 s | `leyendas.js` |
| 4e | Viejo del Monte | 130 | 6 | 1.6 | cuero | cadena de golpes (jefe: 2–3 golpes) | `leyendas.js` |
| 4f | Tulevieja | 140 | 5 | 7 (vuela) | espanto | picada 5 · ~6 s; llanto ✗ | `tulevieja.js` |
| 5 | Mono congo gigante | 170 | 6 | 2.6 | cuero | manotazos 6 · 1.4 s; caída 5; mangos 3 | `monocongo.js` |
| 6 | Capitán de la goleta | 80 | 4 | 2.2 | espanto | machetazo 4 · 1.5 s; cañonazo 4 | `goleta.js` |
| 7 | Reina Bananera | 260 | 6 | 2.4 | caparazón | salto 9 · 8 s (5 s en F2), anillo 0.7+2.2 s; veneno F2 1/s ✗; crías | `jefes2.js` |
| 8 | Cascabel del Llano | 280 | 7 | 2.6 | reptil | mordida 7; emerge 9 · 9 s (6 s F2) aviso 0.8 s; escupe F2 2 ✗ + veneno | `jefes3.js` |
| 9 | Don Cornudo | 280 | 7 | 1.6 | caparazón (*«recibe 60 %»*) | embestida 7 · 4 s (2.5 s F2), aviso 1 s; pisotón F2 5 | `jefes2.js` |
| 10 | Tata Sapo | 300 | 7 | 1.2 | cuero | lengua+masticada 7 · 3.5 s; brinco 5 · 9 s (6 s F2), anillo; charcos F2 ✗ | `jefes3.js` |
| 11 | Cangrejo Rey | 320 | 7 | 1.8 | caparazón (concha) | carrera 7 · 6 s (4 s F2); chorro 2 ✗ · 2.8 s; cangrejos F2 | `jefes3.js` |
| 12 | Ciempiés Rey | 360 | 7 | 5.0 | caparazón | se tira 9 · ~4.5 s; escupe F2 2 ✗ + veneno | `jefes3.js` |
| 13 | Murciélago Rey | 110 | 5 | 6.0 (vuela) | volador | mordida 5 (6 en F2) · 1 s | `caverna.js` |
| 14 | Jefa de Ventanilla | 240 | 6 | 2.2 | sombra | cadena de 2–3 golpes (`atacar`, jefe) | `arena.js` |
| 15 | Señor del Arenal | 320 | 7 | 1.5 | piedra | golpe al suelo 6 · 5 s; bombas de lava (3 en F2) · 3.6 s | `inframundo.js` |
| 16 | Arpía de la Tormenta | 260 | 6 | 8 (vuela) | volador | garras 6 · ~7 s; rayo 6 · 6.5 s (4.5 s y 3 rayos en F2) | `arpia.js` |
| 17 | El Olvido | 340 | 8 | 2.7 | sombra | cadena de golpes | `arena.js` |
| 18 | Sombra Madre | 220 | 7 | 2.5 | sombra | cadena + escolta | `arena.js` |
| 19 | **Rey Zopilote** | **900** | 8 | 2.6 | volador | F1 (>66 %): picada 8, picotazo 5; F2: plumas 3×3 · 1.6 s, **3 rayos 6 ✗ · 2.2 s**; F3: aletazo 6, brinco 7, **rayo 6 ✗ · 3.5 s** | `final.js` |

**Punto de la progresión y equipo esperado** (de la tabla 1.3 del diseño, que son estimaciones mías): A, día 4–15, hierro + cuero; B (los seis del monte), día 10–25, hierro 1★ y plato de coraza (−12 %); Murciélago y Jefa, día 12–30, hierro 2★; Señor del Arenal, día 18–30, diamante 1★; Arpía y El Olvido, día 20–35, diamante 2★; Sombra Madre, día 25–35, diamante 3★; Rey, día 30+, jade 3★ y plato.

**Equipo (datos reales de `blocks.js`):** espada de madera 4, piedra 5, hierro 6, diamante 7, jade 8; la mejora da +12 % por estrella (`yunque.js`). **La armadura deja pasar:** cuero 72 %, hierro 40 %, **diamante 12 %, jade 12 %** (con la fórmula de `game.js`; la mejora de armadura suma 0.25 puntos por pieza y estrella).

## 2. Cómo se midió y qué tan bueno es el modelo

**Perfiles** (diseño 1.2): `torpe` (el bot de hoy: no cubre ni esquiva), `promedio` (esquiva/cubre el 40 % de lo avisado) y `hábil` (70 %). El esquive se multiplica por el aviso de cada ataque (anillo rojo = 1.0, sin aviso = 0).

**Calibración contra lo medido** (bot torpe, 400 corridas; BALANCE.md = una a tres corridas reales):

| Duelo medido (BALANCE.md) | TTK medido | TTK modelo | Daño medido | Daño modelo |
|---|---|---|---|---|
| Reina Bananera, diamante | 14.7 s | 15.6 s | 6.8 | 5.8 |
| Cangrejo Rey, diamante | 32 s | 32.3 s | 14.7 | 20.2 |
| Don Cornudo, diamante (280 de vida) | 40.5 s | 41.2 s | 22.7 | 20.8 |
| Jaguar viejo, hierro + cuero | 5 s | 5.4 s | 11.5 | 10.3 |
| Con el equipo `media` el bot muere (0/3) | Reina, Cornudo, Cangrejo | gana 34 %, 0 %, 6 % | | |

El TTK sale a ±6 %, el daño a ±35 % (el modelo sobrestima el Cangrejo y subestima algo la Reina). **Eso es lo que hay que confiar de él.** El resto de los TTK dependen de un solo número por jefe, el **daño por segundo del bot con diamante**: 27 (cuero), 26 (sombra), 22 (reptil), 19 (espanto), 17.5 (piedra), 30 (volador), **más lo medido** (Reina 18.6, Cangrejo 10.2, Cornudo 7.0). Esos grupos salen de los duelos de bichos comunes del mismo grupo.

## 3. La curva hoy (equipo esperado de cada jefe, 400 corridas)

TTK y daño en promedio de las peleas ganadas; «p» = probabilidad de ganar a la primera; **muertes** = (1 − p)/p, el promedio de veces que murió antes de ganar.

| # | Jefe | Equipo | Vida | TTK torpe (P25–P75) | Rec. torpe | TTK prom. | Rec. prom. | p prom. | **Muertes prom.** | Muertes hábil |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Terciopelo reina | media | 55 | 4.0 (3.7–4.3) | 9.7 | 3.5 | 7.1 | 1.00 | 0.00 | 0.00 |
| 2 | Cocodrilo | media | 130 | 8.4 (7.7–8.9) | 12.8 | 7.2 | 9.4 | 1.00 | 0.00 | 0.00 |
| 3 | Jaguar viejo | media | 90 | 5.3 (4.9–5.7) | 9.4 | 4.7 | 7.1 | 1.00 | 0.00 | 0.00 |
| 4a | Llorona | media | 60 | 5.4 | 2.7 | 4.7 | 2.3 | 1.00 | 0.00 | 0.00 |
| 4b | Segua | media | 70 | 5.5 | 8.5 | 4.8 | 6.3 | 1.00 | 0.00 | 0.00 |
| 4c | Mona | media | 70 | 4.3 | 5.9 | 3.8 | 4.1 | 1.00 | 0.00 | 0.00 |
| 4d | Cadejos | media | 90 | 5.1 | 5.5 | 4.4 | 4.3 | 1.00 | 0.00 | 0.00 |
| 4e | Viejo del Monte | media | 130 | 6.9 | 9.9 | 5.9 | 7.4 | 0.60 | **0.67** | 0.26 |
| 4f | Tulevieja | media | 140 | 20.1 | 10.5 | 16.9 | 6.8 | 1.00 | 0.00 | 0.00 |
| 5 | Mono congo gigante | media | 170 | 8.8 | 15.3 | 7.6 | 12.6 | 0.87 | 0.15 | 0.04 |
| 6 | Capitán goleta | media | 80 | 6.2 | 8.2 | 5.4 | 5.6 | 1.00 | 0.00 | 0.00 |
| 7 | Reina Bananera | hierro 1★ | 260 | 16.2 (15.0–17.4) | 12.7 | 13.7 | 8.9 | 1.00 | 0.00 | 0.00 |
| 8 | Cascabel del Llano | hierro 1★ | 280 | 19.3 (17.7–20.8) | 19.7 | 16.8 | 13.0 | 0.99 | 0.01 | 0.00 |
| 9 | **Don Cornudo** | hierro 1★ | 280 | 35.7 (35.0–36.4) | 28.7 | 34.2 | 24.2 | 0.21 | **3.82** | 0.47 |
| 10 | **Tata Sapo** | hierro 1★ | 300 | **13.7** (12.7–14.7) | 8.3 | 11.7 | 4.4 | 1.00 | 0.00 | 0.00 |
| 11 | Cangrejo Rey | hierro 1★ | 320 | 33.2 (30.5–35.5) | 24.4 | 28.3 | 17.3 | 1.00 | 0.00 | 0.00 |
| 12 | Ciempiés Rey | hierro 1★ | 360 | 30.9 (28.9–33.2) | 24.9 | 27.0 | 20.0 | 0.84 | 0.19 | 0.03 |
| 13 | Murciélago Rey | hierro 2★ | 110 | 10.2 | 5.7 | 8.8 | 3.6 | 1.00 | 0.00 | 0.00 |
| 14 | Jefa de Ventanilla | hierro 2★ | 240 | 10.4 | 11.6 | 8.9 | 8.2 | 1.00 | 0.00 | 0.00 |
| 15 | Señor del Arenal | diamante 1★ | 320 | 19.0 | 4.3 | 16.1 | 3.0 | 1.00 | 0.00 | 0.00 |
| 16 | Arpía | diamante 2★ | 260 | 18.4 | 2.8 | 15.7 | **1.6** | 1.00 | 0.00 | 0.00 |
| 17 | El Olvido | diamante 2★ | 340 | 12.6 | 7.0 | 10.6 | 4.8 | 1.00 | 0.00 | 0.00 |
| 18 | Sombra Madre | diamante 3★ | 220 | 7.6 | 3.9 | 6.7 | 2.8 | 1.00 | 0.00 | 0.00 |
| 19 | **Rey Zopilote (hoy)** | jade 3★ | 900 | **48.1** (44.2–53.1) | 25.8 | **43.8** | 19.3 | 0.85 | **0.17** | 0.01 |

### Gráfico de texto (jugador promedio; ▌= 2 s de pelea · •= 1 hp de daño recibido)

```
Jefe                    TTK (s)                                        Daño recibido (de 20)
Terciopelo reina         ██ 3.5                                          •••••••              7.1
Cocodrilo                ████ 7.2                                        •••••••••            9.4
Jaguar viejo             ██ 4.7                                          •••••••              7.1
Leyendas (6)             ██─████████ 3.8–16.9                            ••─•••••••           2.3–7.4
Mono congo               ████ 7.6                                        •••••••••••••        12.6
Capitán goleta           ███ 5.4                                         ••••••               5.6
--- tramo A: mediana 5 s ----------------------------------------------------------------------
Reina Bananera           ███████ 13.7                                    •••••••••            8.9
Cascabel                 ████████ 16.8                                   •••••••••••••        13.0
Don Cornudo              █████████████████ 34.2   ◄ PARED                ························ 24.2
Tata Sapo                ██████ 11.7              ◄ REGALO               ••••                 4.4
Cangrejo Rey             ██████████████ 28.3                             •••••••••••••••••    17.3
Ciempiés Rey             ██████████████ 27.0                             ••••••••••••••••••••  20.0
--- tramo B: mediana 27.6 s (hierro, 40 % pasa) --------------------------------------------------
Murciélago Rey           ████ 8.8                                        ••••                 3.6
Jefa de Ventanilla       ████ 8.9                                        ••••••••             8.2
Señor del Arenal         ████████ 16.1                                   •••                  3.0
Arpía                    ████████ 15.7             ◄ más fácil que la Reina   ••            1.6
El Olvido                █████ 10.6                                      •••••                4.8
Sombra Madre             ███ 6.7                                         •••                  2.8
--- tramo C: mediana 9.7 s (diamante, 12 % pasa) ------------------------------------------
Rey Zopilote (hoy)       ██████████████████████ 43.8                     ••••••••••••••••••• 19.3
```

### Los escalones

Cada fila es un salto respecto del jefe anterior **dentro de su tramo**; marco los fuera de la regla del diseño (cada tramo ×1.3–1.6 sobre el anterior; ningún jefe más fácil que la mediana del anterior).

| Escalón | Qué pasa | Gravedad |
|---|---|---|
| **A → B** | La mediana de TTK pasa de 5 s a 27.6 s (×5.5, la regla pide ×1.3–1.6) y el daño de 7 a 15. Es el salto de «jefe de un duelo corto» a «pelea de media minuta»; casi todo lo añade el Cornudo y el Cangrejo | media |
| **Cornudo (9)** | TTK 34 s y **3.8 muertes** del promedio: cuatro veces más muertes que todo el resto del tramo B junto | **alta** (pared) |
| **Tata Sapo (10)** | TTK 11.7 s: **un tercio** de Cornudo, 40 % de Cangrejo y menos que la Reina del tramo anterior | **alta** (regalo; estimación) |
| **Sapo → Cangrejo (10 → 11)** | El daño recibido sube ×3.9 (de 4.4 a 17.3) | media |
| **B → C** | La mediana de TTK **baja** de 27.6 a 9.7 s y el daño de 15 a 3.5. El tramo C es **más fácil** que el B, lo contrario de lo que se quiere | **alta** (inversión) |
| **Arpía (16)** | Recibe 1.6 de 20: **menos que cualquier jefe de cualquier tramo**, y es «el jefe de la tormenta» | alta |
| **C → Rey** | La mediana ×4.5, pero el Rey (44 s) es solo 1.6× el Ciempiés Rey (27 s), cuando la regla del diseño dice 3–6× | alta |

## 4. Por qué pasa (las causas, con el código)

1. **La armadura se aplana en el diamante.** `game.js damagePlayer`: `amount *= 1 − Math.min(0.88, puntos·0.04 + dureza·0.02)`. Cuero 7 puntos → pasa 72 %; hierro 15 → 40 %; **diamante 20 puntos + 8 de dureza → 96 %, topado en 88 → pasa 12 %**; **jade 20 + 16 → también topado en 12 %**. Entre hierro y diamante el daño recibido se divide por 3.3, y entre diamante y jade no cambia nada. Por eso un jefe «de diamante» pega a un tercio de lo que pega uno «de hierro» con los mismos números.
2. **Los ataques con `damagePlayer(..., true)` (sin `armored`) ignoran la armadura.** Son los rayos y plumas del Rey, el veneno de la Terciopelo, los escupitajos y charcos. En el tramo C son **casi todo el daño que queda** (en el Rey, ~60 % del daño que recibe el jugador promedio). Eso es lo que hace al Rey mortal para el torpe aun con 88 % de armadura.
3. **La vida de jefe no sube con el tramo.** La mayoría de los jefes de dimensión (110–340) tiene menos vida que los del monte (260–360), pero con la armadura de diamante el jugador recibe un tercio del daño y sube de tramo con más vida de la que el jefe puede quitarle.
4. **El caparazón es una lotería:** la afinidad del corte contra `caparazon` es 0.6 y el Cornudo, además, ataja de frente (`onHurt`). Su daño por segundo medido (7) es 2.5× menos que el de la Reina (18.6), aunque ambos son «caparazón».

### El Rey Zopilote de hoy, por dentro (la diagnosis)

Con el jugador promedio, jade 3★ (400 peleas):

| Fase | Tiempo medio | Qué le pega |
|---|---|---|
| F1 (66–100 %) | 20 s | picada y picotazo (con armadura: casi nada) |
| F2 (33–66 %) | 18 s | **3 rayos sin armadura: 8.9 de 19 de daño medio total**; plumas 2.8 |
| F3 (0–33 %) | **5 s** | rayo 3.0; el barrido (con armadura) casi nada |

- En F1 y F2 solo se le puede pegar mientras está **posado** (4 s y 3 s de cada ciclo de ~11 y ~9 s): es la «exposición» del diseño. En F3 está siempre al alcance y **cae en 5 s**.
- Las muertes del promedio salen **el 54 % en F2 y 46 % en F3** (los rayos); el torpe muere el 71 % en F2.
- **Con equipo de hierro el Rey es imposible** (p = 0.07): con el 40 % que pasa la armadura de hierro, F1 solo ya hace 10.9 de daño. Con diamante y jade el resultado es el mismo (0.83 y 0.86), porque ambas topan en 88 %.

## 5. Propuesta de números

### 5.1 Antes de tocar los jefes: dos cambios de sistema (recomendados)

Sin ellos, igualar el tramo C obliga a daños absurdos (ver la columna «armadura actual»: Arpía ×8, Señor ×5).

1. **Subir lo que pasa la armadura premium**: en `game.js damagePlayer`, `Math.min(0.88, puntos·0.04 + dureza·0.02)` → **`Math.min(0.80, puntos·0.03 + dureza·0.02)`**. Resultado: cuero pasa 79 %, hierro 55 %, **diamante 24 %, jade 20 %** (hoy 72 / 40 / 12 / 12). El jade vuelve a ser mejor que el diamante y el tramo C vuelve a cobrar daño.
2. **Que los rayos del Rey y los ataques de área sí respeten la armadura, aunque sea a medias** (`damagePlayer(..., true, true)` y un multiplicador de 0.5 sobre la reducción para lo «perforante»). Así la armadura de jade se nota en el último jefe en lugar de ser inútil.

### 5.2 Vida y daño de cada jefe (objetivo: la tabla 1.3; modelo con armadura nueva)

«**Daño ×**» es un multiplicador sobre **todos los golpes del jefe** (el golpe base y los especiales), con la armadura **nueva** (y entre paréntesis la actual). Resuelto para dar **el TTK del bot torpe de la tabla 1.3** y **las muertes esperadas del promedio** de esa misma tabla (500 corridas por celda).

| # | Jefe | Vida hoy → **propuesta** | Daño × (armadura nueva / actual) | TTK torpe | TTK prom. | Muertes prom. (objetivo) | Muertes hábil |
|---|---|---|---|---|---|---|---|
| 1 | Terciopelo reina | 55 → **114** | ×0.74 (0.77) | 7.4 | 6.5 | 0.04 (0.05) | 0.01 |
| 2 | Cocodrilo | 130 → **165** | ×0.93 (1.02) | 10.5 | 8.9 | 0.11 (0.09) | 0.04 |
| 3 | Jaguar viejo | 90 → **151** | ×1.29 (1.40) | 8.3 | 7.2 | 0.13 (0.14) | 0.04 |
| 4a | Llorona | 60 → **55** | ×6.1 (6.2) *(solo tiene drenaje; subir su frecuencia)* | 4.9 | 4.2 | 0.05 (0.08) | 0.02 |
| 4b | Segua | 70 → **76** | ×1.70 (1.85) | 5.9 | 5.1 | 0.09 (0.10) | 0.04 |
| 4c | Mona | 70 → **113** | ×2.04 (2.22) | 6.5 | 5.5 | 0.13 (0.12) | 0.02 |
| 4d | Cadejos | 90 → **139** | ×2.22 (2.43) | 7.4 | 6.4 | 0.12 (0.14) | 0.08 |
| 4e | Viejo del Monte | 130 → **171** | ×0.62 (0.67) | 8.9 | 7.7 | 0.18 (0.16) | 0.04 |
| 4f | Tulevieja | 140 → **67** | ×3.6 (3.8) *(vuela: muy poca exposición; mejor bajarle el vuelo)* | 9.8 | 8.5 | 0.17 (0.18) | 0.08 |
| 5 | Mono congo | 170 → **245** | ×0.72 (0.77) | 12.4 | 10.8 | 0.15 (0.14) | 0.04 |
| 6 | Capitán goleta | 80 → **164** | ×1.40 (1.54) | 11.7 | 10.2 | 0.22 (0.18) | 0.05 |
| 7 | Reina Bananera | 260 → **240** | ×1.35 (1.91) | 14.8 | 12.8 | 0.14 (0.14) | 0.04 |
| 8 | Cascabel | 280 → **252** | ×1.10 (1.40) | 17.1 | 14.9 | 0.18 (0.18) | 0.01 |
| 9 | **Don Cornudo** | 280 → **135** *(o que el caparazón deje pasar más)* | ×0.68 (0.99) | 20.2 | 17.4 | 0.16 (0.20) | 0.02 |
| 10 | **Tata Sapo** | 300 → **537** | ×1.68 (2.32) | 23.1 | 20.2 | 0.23 (0.25) | 0.01 |
| 11 | Cangrejo Rey | 320 → **264** | ×1.30 (1.48) | 26.2 | 23.3 | 0.38 (0.28) | 0.04 |
| 12 | Ciempiés Rey | 360 → **357** | ×0.88 (1.07) | 30.8 | 26.8 | 0.37 (0.33) | 0.05 |
| 13 | Murciélago Rey | 110 → **197** | ×1.87 (2.79) | 16.7 | 14.8 | 0.33 (0.25) | 0.05 |
| 14 | Jefa de Ventanilla | 240 → **625** | ×0.67 (1.01) | 24.8 | 21.8 | 0.31 (0.28) | 0.08 |
| 15 | Señor del Arenal | 320 → **482** | ×2.87 (5.10) | 27.6 | 23.9 | 0.39 (0.39) | 0.10 |
| 16 | Arpía | 260 → **436** | ×4.89 (8.00) *(ver nota)* | 27.8 | 25.1 | 0.44 (0.47) | 0.03 |
| 17 | El Olvido | 340 → **892** | ×1.18 (1.94) | 31.3 | 26.4 | 0.60 (0.47) | 0.08 |
| 18 | Sombra Madre | 220 → **951** | ×1.32 (2.19) | 29.6 | 25.7 | 0.42 (0.43) | 0.11 |
| 19 | **Rey Zopilote** | 900 → **2 190** | ×0.71 (0.85) | 105 | 96 | 0.86 (1.0) | 0.03 |

**Cómo leer y aplicar los números**
- **La vida es lo de menos, el TTK es lo que se siente.** Las propuestas de vida salen de `vida = DPS_bot × TTK_objetivo × exposición`; si se corrige el DPS tras medir de verdad, la vida se reescala de forma lineal: `vida_nueva = vida_propuesta × (TTK_objetivo / TTK_medido)`. Una vida de 600–950 en las Sombras (Jefa, Olvido, Madre) es lo que pide el TTK de 25–32 s con diamante porque la espada corta una Sombra al 120 %: **mejor bajar el objetivo de TTK de esos tres a ~15–20 s y dejar la vida en 400–500** que subirla a 900.
- **Daño ×** > 2 no se debe cumplir subiendo el golpe (un golpe de 20 no es justo): se cumple con **más ataques o menos tiempo entre ellos** (por ejemplo, la Arpía: rayo cada 6.5 → 3.5 s y el segundo y tercer rayo desde la fase 1; el Señor del Arenal: la onda de fuego cada 5 → 3 s y bombas desde el principio). El multiplicador es la «presión» total, no el tamaño del golpe.
- **Cornudo:** la forma más sencilla de dejarlo en 20 s sin tocar la vida es **subir lo que pasa el caparazón del 60 % al 75–80 %** (lo que ya propone el diseño). Con la vida en 135 en vez de 280, el modelo da lo mismo, pero se «siente» como un jefe sin vida.
- **Tata Sapo:** vida 300 → 537 es el único cambio de vida «grande» de los seis del monte. Si al medirlo resulta que el Sapo no es de afinidad `cuero`, el número cambia mucho: **medirlo primero**.
- **Cangrejo, Ciempiés, Murciélago y Olvido** quedan 0.1 por encima de su objetivo de muertes: es el ruido del modelo (±0.1).

### 5.3 El Rey Zopilote final: la meta de ~1 muerte

Las ventanas de ataque (posado 4 s en F1, 3 s en F2; las plumas, los rayos, el barrido) se **dejan tal cual**: la diferencia entre ventanas de 4/3 s y de 2.5/2 s no cambia la cuenta (el modelo reescala la vida). Lo que cambia es:

| Parámetro | Hoy | Propuesta | Efecto (modelo, 500 corridas) |
|---|---|---|---|
| Vida | 900 | **2 190** (×2.4) | TTK del torpe 48 → **105 s**, del promedio 44 → **96 s** (objetivo 100–130) |
| Golpes (picada, picotazo, plumas, rayos, aletazo, brinco) | picada 8, pico 5, pluma 3, rayo 6, aletazo 6, brinco 7 | **×0.85** (picada 7, pico 4, pluma 2.5, rayo 5, aletazo 5, brinco 6) | muertes promedio 0.86 |
| Armadura nueva (5.1) | — | **con la fórmula nueva**: golpes ×0.71 | muertes promedio 1.0 (p ≈ 0.5) |
| Rayos de F2 | 6, sin armadura | 5, **con media armadura** | quita la dependencia de la armadura premium |

**Sensibilidad (con 2 190 de vida y ×0.85):** el promedio muere más o menos según cuánto esquive de verdad el jugador:

| Esquive real del jugador promedio | Probabilidad de ganar | Muertes promedio |
|---|---|---|
| 10 % | 0.13 | 6.8 |
| 25 % | 0.28 | 2.6 |
| **40 % (supuesto del diseño)** | **0.54** | **0.9** |
| 55 % | 0.79 | 0.26 |
| 70 % | 0.92 | 0.08 |

Es decir, **la meta de 1 muerte promedio solo se cumple si el jugador esquiva ~40 % de lo avisado**, y el resultado cambia ×10 entre un jugador que esquiva el 25 % y uno que esquiva el 55 %. **Es el supuesto menos fiable de toda la medición** (nadie lo ha medido). Recomiendo que nanoyackson (u otra persona) juegue el Rey con la versión nueva y se cuenten las muertes de los primeros 5 intentos antes de fijar el número.

### 5.4 Reglas de aceptación que cumple la propuesta

- Cada tramo sube sobre el anterior (mediana del TTK del bot torpe: A ≈ 8 s → B ≈ 22 s → C ≈ 29 s → Rey 105 s) y **ningún jefe de C es más fácil que la mediana de B** (se logra con el cambio de armadura 5.1 y el daño ×).
- Dentro del grupo de los seis del monte el TTK sube parejo: 14.8, 17.1, 20.2, 23.1, 26.2, 30.8 s (paso de +2.3 a +3.3 s).
- El Rey queda 3.4× por encima del Ciempiés Rey (105 contra 31 s), dentro de «3 a 6 veces».
- Muertes esperadas del promedio ≤ 0.5 en todos menos el Rey (en los últimos escalones el modelo da 0.3–0.6: El Olvido 0.6 y Cangrejo 0.38 quedan algo por encima, dentro del ruido de ±0.1–0.15 y de la incertidumbre del modelo).

## 6. Qué hace falta para cerrar la Fase 0 (y qué NO se pudo hacer aquí)

1. **Correr los duelos reales en el navegador** (hoy solo hay 4 medidos). Con `tools/bot-pelea.js`: añadir a `DUELO_MOBS` los 12 que faltan (`terciopelo_reina`, `cocodrilo_gigante`, `cadejos`, `segua`, `llorona`, `mona`, `viejo_monte`, `tulevieja`, `mono_congo_gigante`, `sapo_tata`, `cascabel_rey`, `ciempies_rey`, `rey_murcielago`, `senor_arenal`, `arpia`, `jefa_ventanilla`, `el_olvido`, `sombra_madre`, `rey_zopilote`) y los equipos `jefeHierro`, `jefeDiamante` y `jefeJade` de la sección 1.2 del diseño. **Prioridad:** Tata Sapo, Cascabel, Ciempiés Rey, Arpía y Rey Zopilote (son los que más mueven la curva y los que más dependen de supuestos).
2. **El bot de hoy solo cubre el perfil `torpe`.** Para `promedio` y `hábil` hay que agregar el parry y el esquive que describe la sección 1.2 (por ahora es el único supuesto sin base: ver la sensibilidad del Rey).
3. **Las cifras de este informe son del modelo**, no del juego. Donde el modelo y el bot discrepen, manda el bot; los scripts de la carpeta de notas sirven para reescalar la propuesta con un solo comando cuando haya datos nuevos (`ajustar2.mjs`).
4. **Pendiente que el modelo no cubre:** las crías y secuaces (arañas, cangrejos, sombras de la escolta), el cuerpo a cuerpo entre ataques especiales de los jefes con aviso de brillo dorado (parry) y los efectos de estado (mareo de la ceniza, veneno) más allá de su daño directo.

*Escrito por la sesión investigadora. Solo lectura: no se ejecutó el juego ni el navegador; todo lo no medido de verdad está marcado como estimación.*
