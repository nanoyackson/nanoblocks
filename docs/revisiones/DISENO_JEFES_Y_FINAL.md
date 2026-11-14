# Diseño de los jefes y del final épico («La Noche del Rey»)

Pedido: encargo 13 de la orquestadora. Desarrolla la **tanda 7** de `PROXIMAS_TANDAS.md` y usa lo medido en `docs/BALANCE.md`. Todo es **diseño**: no se editó código ni se corrió el juego. Lo que sale del código está citado con archivo y función (las líneas se mueven); lo que es una **estimación mía** va marcado «≈» o «estimación»; lo que hay que **medir primero** va marcado 📏; lo que depende de que nanoyackson lo juegue, 👁. Estado base: `v11.10.5`.

**Una advertencia que manda sobre todo lo demás:** de los 19 jefes de la tabla **solo 3 están medidos** (Reina Bananera, Don Cornudo y Cangrejo Rey; más el Jaguar viejo). Todas las vidas y tiempos de este documento son **valores de partida con su fórmula**, para ajustar con la corrida de la Fase 0 (sección 5), no cifras definitivas.

---

## 0. Principios

1. **Pareja, no plana.** Cada jefe cuesta un poco más que el anterior (tiempo para matar ×1.1–1.3 por escalón) y **enseña una cosa**; el Rey Zopilote **examina todas**.
2. **Lo que se aprendió se usa.** Las seis lecciones ya existen en el juego: **esquivar el rojo** (anillos y carriles), **parry con el brillo dorado**, **barrerse** (Ctrl+Espacio), **golpe fuerte/arma contundente** (Cangrejo Rey), **atrapar contra la pared** (Don Cornudo) y **oír el aviso** (el cascabel). El Rey las pide, una por fase.
3. **Se muere, pero poco y por culpa propia.** Un jugador promedio debe morir ≈ 1 vez contra el Rey y casi nunca antes (tabla 1.3).
4. **Original y tico.** Nada copiado: el Rey es el señor de la ceniza, la cumbre es un redondel de fiesta de pueblo y la ayuda es la gente de la casa, el Canelo y las cartas de Zenaida.

---

## 1. Curva objetivo y cómo se mide

### 1.1 Cómo mide hoy el bot (`tools/bot-pelea.js`)

- **Duelo** (`DUELOS`, `Bot.empezar`): una cancha plana de 49×49 limpiada hasta 48 de alto, de noche (`t = 0.6`), el bicho nace a 7 bloques, no nace nada más (`spawnT = 1e9`, `miniCd`, `legendCd`, `congoCd` apagados) y se miden **tiempo para matar** (`ttk`), **daño recibido** (`recibido`, de 20), si **ganó** o **murió**, `golpes` y `dps` (`hecho / (seg − t1)`).
- **Equipos** (`EQUIPOS`): `temprana` (madera, sin armadura), `media` (hierro + cuero), `tardia` (diamante + diamante); `ESCENARIOS_PREPARADOS` suma `mejora: 3`, un plato y las hojas del cuaderno.
- **El bot es torpe a propósito**: pega con 35 % de probabilidad por cuadro listo (`puntería`), de frente (`p.yaw` hacia el bicho), no cubre, no hace parry, no esquiva, solo usa espada y **no tiene arco**. Si el bot sobrevive, un jugador de verdad va sobrado.
- **Duelos existentes de jefes**: `reina_bananera`, `escarabajo_hercules`, `cangrejo_rey` y `jaguar_viejo`, con `max: 300`. Todos los demás jefes dicen «sin medir».

### 1.2 Qué duelos agregar (Fase 0)

**Nuevos equipos** en `EQUIPOS` (el bot sube un escalón para compensar que no cubre):

| Equipo | Qué trae | Para qué |
|---|---|---|
| `jefeHierro` | `HIERRO` + set `hierro`, `mejora: 1`, plato `coraza` | Jefes del monte (equipo humano esperado: hierro 1★) |
| `jefeDiamante` | `DIAMANTE` + set `diamante`, `mejora: 3`, plato `fuerza`, hojas | Jefes de dimensión y el Rey |
| `jefeJade` | `jade_sword` (324) + set `jade` (342–345), `mejora: 3`, plato `fuerza`, hojas | El Rey con el mejor equipo posible |

**Nuevos perfiles de habilidad** en `Bot` (hoy solo existe `puntería`), para medir **«cuántas veces muere un jugador promedio»**:

| Perfil | `puntería` | Cubre (parry al ver el brillo) | Esquiva el rojo | Arco |
|---|---|---|---|---|
| `torpe` (el de hoy) | 0.35 | 0 % | 0 % | no |
| `promedio` | 0.50 | 40 % de los golpes dorados | 25 % de los rojos | sí, contra lo que vuela |
| `habil` | 0.70 | 75 % | 50 % | sí |

Implementación: en `Bot.cuadro`, si `cerca.atk && cerca.atk.aviso && !cerca.atk.decidido`, marcar `decidido` y, con la probabilidad del perfil, llamar a `startBlock(g)` (`combate.js`) y soltarlo a los 0.4 s; si `cerca.atkRojo`, `tryRoll(g)`/`tryDodge(g)`. Para volar: dar `ARCO` (326) y 64 flechas (327) y mantener `g.mouse.right = true` ≥ 0.6 s apuntando al blanco, y soltar (lo que hace `tickBow`).

**Nuevos duelos** (`DUELO_MOBS`, todos con `max: 300` y, los del cielo, `arco: true`):

`terciopelo_reina`, `cocodrilo_gigante`, `cadejos`, `segua`, `llorona`, `mona`, `viejo_monte`, `tulevieja`, `mono_congo_gigante`, **`sapo_tata`, `cascabel_rey`, `ciempies_rey`** (los 3 jefes del monte sin medir), `rey_murcielago`, `senor_arenal`, `arpia`, `jefa_ventanilla`, `el_olvido`, `sombra_madre`, y **`rey_zopilote`** (con `max: 400`). Además una variante **`revancha: true`** (vida ×1.5, golpe ×1.3, como `usarOfrenda`) para los seis del monte, porque hoy la revancha es el negocio del hallazgo 2 de la cuarta revisión. El Señor, la Arpía y el Rey se miden **en la cancha plana** (su cerebro solo necesita al jugador): sirve para el tiempo para matar; la ráfaga de borde de la Arpía y la altura del Rey se miden aparte con `/prueba`.

**Métricas nuevas** en cada resultado: `exposicion` (fracción del tiempo en que el blanco era golpeable), `tiempoPorFase` (para el Rey, por la fase de `D.fase`), `muertesPorIntento`. El resumen calcula **`p = ganó/N`** y **muertes esperadas = (1 − p)/p** (cada intento es independiente; con `N = 10` por celda y perfil). Salida a `docs/BALANCE.md`, sección «Jefes».

**Regla de equivalencia (👁 a confirmar jugando):** *el bot torpe con equipo de un escalón arriba ≈ un humano promedio con el equipo esperado y parry a medias.* Por eso la tabla 1.3 da dos columnas de equipo.

### 1.3 Curva objetivo, jefe por jefe

Orden de progresión por **dificultad** (los jefes del monte se llaman en cualquier orden: por eso sus seis valen casi lo mismo, ±25 %, y suben dentro del grupo). TTK y «recibido» son del **bot torpe**; «p» y «muertes» del **perfil promedio**.

| # | Jefe | Día | Equipo humano | Equipo del bot | TTK objetivo | Recibido (de 20) | p | Muertes |
|---|---|---|---|---|---|---|---|---|
| 1 | Terciopelo reina | 5–10 | hierro + cuero | `media` | 6–9 s | 2–4 | 0.95 | 0.05 |
| 2 | Cocodrilo del Tárcoles | 6–12 | hierro + cuero | `media` | 9–12 s | 4–7 | 0.92 | 0.09 |
| 3 | Jaguar viejo | 5–10 | hierro + cuero | `media` | 7–10 s | 6–9 | 0.88 | 0.14 |
| 4 | Leyendas (Llorona 5 s … Tulevieja 10 s) | 4–15 | piedra → hierro | `temprana` → `media` | 5–10 s | 2–6 | 0.93 → 0.85 | 0.08 → 0.18 |
| 5 | Mono congo gigante | 6–12 | hierro + cuero | `media` | 11–14 s | 5–8 | 0.88 | 0.14 |
| 6 | Capitán de la goleta | 6–15 | hierro + hierro | `media` | 10–14 s | 5–8 | 0.85 | 0.18 |
| 7 | **Reina Bananera** | 10–25 | hierro 1★ | `jefeHierro` | **15 s** | 5–7 | 0.88 | 0.14 |
| 8 | **Cascabel del Llano** | | | | **18 s** | 6–8 | 0.85 | 0.18 |
| 9 | **Don Cornudo** | | | | **21 s** | 7–9 | 0.83 | 0.20 |
| 10 | **Tata Sapo** | | | | **24 s** | 8–10 | 0.80 | 0.25 |
| 11 | **Cangrejo Rey** | | | | **28 s** | 9–11 | 0.78 | 0.28 |
| 12 | **Ciempiés Rey** | | | | **32 s** | 10–12 | 0.75 | 0.33 |
| 13 | Murciélago Rey | 12–25 | hierro 2★ | `jefeHierro` | 16–20 s | 7–10 | 0.80 | 0.25 |
| 14 | Jefa de Ventanilla *(trama)* | 15–30 | hierro 2★ | `jefeHierro` | 24–28 s | 7–10 | 0.78 | 0.28 |
| 15 | Señor del Arenal | 18–30 | diamante 1★ | `jefeDiamante` | 26–30 s | 8–11 | 0.72 | 0.39 |
| 16 | Arpía de la Tormenta | 20–32 | diamante 2★ | `jefeDiamante` | 28–33 s | 9–12 | 0.68 | 0.47 |
| 17 | El Olvido *(trama)* | 25–35 | diamante 2★ | `jefeDiamante` | 30–34 s | 10–13 | 0.68 | 0.47 |
| 18 | Sombra Madre (Noche Larga, ola final) | 25–35 | diamante + casa | `jefeDiamante` | 28–34 s | 10–13 | 0.70 | 0.43 |
| 19 | **Rey Zopilote** | 30+ | jade/diamante 3★, plato, Alas | `jefeJade` | **100–130 s** (4 fases) | **13–17** | **0.50** | **1.0** |

**Reglas de aceptación:** (1) la mediana de cada tramo (1–6, 7–12, 13–18, 19) crece ×1.3–1.6 respecto del anterior; (2) dentro de los seis del monte, el TTK sube **pareja** (+3 a +4 s por escalón); (3) ningún jefe de un tramo mata más rápido ni recibe menos daño que la **mediana** del anterior; (4) el Rey, entre 3 y 6 veces el TTK del Ciempiés Rey; (5) **muertes esperadas del perfil promedio** ≤ 0.5 hasta el #18 y ≈ 1 en el Rey; (6) el perfil `habil` gana ≥ 90 % en el Rey (si no, el combate es injusto).

**Lo medido hoy contra esta curva** (`BALANCE.md`, `tardia` = diamante): Reina 14.7 s ✔, Cangrejo Rey 34 s (objetivo 28), **Don Cornudo 40.5 s (objetivo 21: casi el doble)**, Jaguar viejo (`media`) 5 s y 11.5 de daño (objetivo 7–10 s y 6–9). El resto: 📏.

---

## 2. Ajustes por jefe (con archivo y función)

**Fórmula para fijar la vida** una vez medido el DPS: `vida = DPS_bot × TTK_objetivo × exposición`. El DPS del bot con diamante, de los duelos existentes, es ≈ 18 hp/s contra un blanco blando (Reina: 260 / 14.7 s), ≈ 10 contra el Cangrejo (concha) y ≈ 7 contra Don Cornudo (caparazón). **Los valores de abajo son de partida** (calculados con esas cifras donde las hay; `≈` donde no); la corrida de la Fase 0 los corrige.

### 2.1 Minijefes y leyendas (tramo A)

| Jefe | Hoy (vida · golpe) | Ajuste | Dónde |
|---|---|---|---|
| **Terciopelo reina** | 55 · — | Vida **55 → 80** (a 12 hp/s con `media` dura 6.7 s, no 4.6). Aviso: el veneno marca un anillo verde de 0.5 s antes de caer (como la Reina Bananera), que se esquiva rodando | `armas2.js`, `MINIJEFES.terciopelo_reina` |
| **Cocodrilo del Tárcoles** | 130 · — | Se queda. Mordida con **brillo dorado** (parry) y «vuelta de cola» con anillo rojo de 0.6 s al salir del agua | `armas2.js`, `MINIJEFES.cocodrilo_gigante` |
| **Jaguar viejo** | 90 · 9 | **100 · 8** (con `media` el bot recibe 11.5: debe ser ≤ 9). Salto con anillo y agazape de 0.45 s ya puestos en v11.7: sin más | `armas2.js`, `MINIJEFES.jaguar_viejo` |
| **Leyendas** | 60–140 | Vida a **Llorona 70 · Segua 80 · Mona 80 · Cadejos 100 · Viejo del Monte 130 · Tulevieja 140** (solo sube un poco las más débiles; son la 1.ª pelea «con nombre» de la historia, día 4) | `leyendas.js`, `LEYENDAS.*`; `tulevieja.js` |
| **Mono congo gigante** | 170 · 6 | Se queda. Mangos con **sombra roja en el suelo** de 0.7 s (hoy caen sin aviso del lugar); aullido con 0.8 s de aviso antes de empujar | `monocongo.js`, `MONO_CONGO_GIGANTE` |
| **Capitán de la goleta** | 80 · 4 | **80 → 140** (cae solo cuando se vencieron las 6 ánimas: es la pelea que cierra la ola, no un jefe de duelo) y su cañonazo marca un círculo rojo antes de caer | `goleta.js`, el kind del capitán (≈ línea 262) |

### 2.2 Jefes del monte (tramo B): cada uno enseña una cosa

Vida de partida **240 · 260 · 250 · 280 · 300 · 330** (hoy 260 · 280 · 280 · 300 · 320 · 360): la banda sube pareja de 15 a 32 s. La **revancha paga la mitad de lo que pagaba** (cuarta revisión, hallazgo 2) y **sube la vida ×1.5, el golpe ×1.3 y suma una mecánica** de la fase 2 desde el principio.

| # | Jefe | Enseña | Hoy | Ajuste concreto | Dónde |
|---|---|---|---|---|---|
| 7 | **Reina Bananera** | **Esquivar el rojo** (anillo de salto) | 260 · 6, ya en curva | **260 → 240.** Fase 2: el veneno deja de ser un círculo invisible: pinta **un anillo verde de 4.5 de radio** y hace 1 por segundo dentro (hoy suma efecto sin marcar el borde). Las crías (`criasCd`) pasan de 4 a 3 vivas | `jefes2.js`, `JEFES2.reina_bananera.brain` (`D.nube`, `criasCd`) |
| 8 | **Cascabel del Llano** | **Oír el aviso** | 280 · 7 | **280 → 260.** El cascabel suena **1.0 s antes** de enterrarse (hoy el aviso es el polvo); la mordida emerge con círculo rojo de 0.8 s ya existente; el escupitajo (fase 2) se puede **parar con escudo** (parry dorado: la deja aturdida 1.6 s) | `jefes3.js`, `JEFES3.cascabel_rey` |
| 9 | **Don Cornudo (Hércules)** | **Meterlo contra una pared** | 280 · 7; **TTK 40 s** | **280 → 250** y **el caparazón deja pasar 60 % → 75 %** del corte (hoy el bot hace ≈ 7 hp/s: con 250 de vida y 75 % pasa a ≈ 13 → ≈ 20 s). **Trabado contra pared o árbol recibe ×2** (hoy ya «recibe todo»). Pisotón (fase 2) con anillo rojo de 0.7 s | `jefes2.js`, `JEFES2.escarabajo_hercules.brain` y la tabla de caparazón en `armas3.js` (`perfil`, grupo `caparazon`) |
| 10 | **Tata Sapo** | **Esquivar de lado** (la lengua en línea) | 300 · 7 | **300 → 280.** La lengua marca un **carril rojo** (`avisoEmbestida`) de 0.8 s; si agarra, la masticada pega 7 **una sola vez** (hoy veneno aparte); los charcos de la fase 2 duran 6 s y se ven claramente | `jefes3.js`, `JEFES3.sapo_tata` |
| 11 | **Cangrejo Rey** | **Golpe fuerte / arma contundente** | 320 · 7; **TTK 34 s** | **320 → 300.** La concha se **rompe con un solo golpe fuerte** (clic central o F) o un arma contundente y queda **abierta 5 s** (hoy hay que repetir); los chorros marcan un carril azul de 0.6 s | `jefes3.js`, `JEFES3.cangrejo_rey` |
| 12 | **Ciempiés Rey** | **Barrerse / salir del anillo** | 360 · 7 | **360 → 330.** El anillo de su cuerpo se cierra en **2.0 s con las patas encendidas** (aviso) y **se puede salir por abajo barriéndose (Ctrl+Espacio)** o saltando; el salto «de frente» marca anillo rojo de 0.8 s | `jefes3.js`, `JEFES3.ciempies_rey` |

### 2.3 Jefes de dimensión y de la trama (tramo C)

| # | Jefe | Hoy | Ajuste concreto | Dónde |
|---|---|---|---|---|
| 13 | **Murciélago Rey** | 110 · 5 | **110 → 190** (a ≈ 12 hp/s con `jefeHierro`, 16 s; hoy cae en ≈ 9 s). Picada con **carril rojo** y chillido; su segunda fase llama murciélagos (ya) y **se cansa**: 3 s en el suelo tras la picada, golpeable | `caverna.js`, `REY` y `tickCaverna` |
| 14 | **Jefa de Ventanilla** | 240 · 6 | Se queda. El «sellazo» (7, 2.2 de alcance, 2 s de aviso) pasa a **dorado** (parry) y a rojo solo el «sellazo doble» de la fase 2 | `arena.js`, `jefaVentanilla`; `archivo.js` (`g.ventanilla`) |
| 15 | **Señor del Arenal** | 320 · 7 | **320 → 380.** Bombas de lava con **círculo rojo** de 1.0 s; la **onda de fuego** hoy sin aviso pasa a anillo rojo de 1.2 s que se salta. Fase 2 (50 %): más bombas y **lava en el suelo que se enfría** y deja plataformas | `inframundo.js`, `SENOR` |
| 16 | **Arpía de la Tormenta** | 260 · 6 | **260 → 340** (hoy tiene menos vida que cinco jefes del monte y «cierra la escala»). Mantiene picada con amago (parry), rayos marcados y ráfagas; **a menos de la mitad, tres rayos y la ráfaga se avisa con el silbido 1 s antes**; se posa 2 s tras cada picada fallida | `arpia.js`, `ARPIA` y su `update` |
| 17 | **El Olvido** | 340 · 8 | **340 → 360, golpe 8 → 7.** Lo que Anselmo tapó sale «todo junto»: las oleadas previas ya pesan, no debe ser además el golpe más duro del juego | `arena.js`, `elOlvido`; `anselmo.js` |
| 18 | **Sombra Madre** | 220 · 7 | **220 → 300**, y en la **ola final** (`historia.js`, `OLAS[3]`) **invoca 2 Sombras escudo a mitad de vida** (hoy sale con una escolta fija). La casa arreglada y los vecinos (ver 3.5) la ayudan | `arena.js`, `sombraMadre`; `historia.js`, `soltarOla` |

### 2.4 Cadencias y premios (arreglan la cuarta revisión; la curva depende de ellas)

- **Premio de jefe una sola vez por jefe** (`meta.premioJefe[tipo]`), la revancha **un décimo**; el Señor y la Arpía **no reaparecen** pagando: `bossSpawn` (`inframundo.js`) y `arpiaSpawn` (`arpia.js`) siguen, pero la segunda vez en adelante solo dan el trofeo. Ver sección 4.
- **Revancha de los 6 del monte con enfriamiento** de 3 días de juego entre ofrendas (`usarOfrenda`, `jefes2.js`).

---

## 3. La pelea final: «La Noche del Rey»

### 3.0 Resumen

Se llama igual que hoy (la **Corona del monte** de los seis trofeos, de noche, en una cumbre de altura ≥ 95 con cielo abierto: `final.js`, `usarCorona`), pero ahora es **un acto de 4 fases**, con una arena que se transforma, la **gente de la casa** subiendo con faroles, música que crece y un remate. Dura **8–10 minutos reales** (1 de preludio, ≈ 2 de pelea y unos 5 entre cinemáticas cortas, diálogos y créditos). **Nunca se quita el control más de 5 s seguidos** (excepto el golpe final, que es lento pero jugable).

**Idea:** el Rey Zopilote es el último peligro de Tiquicia y a la vez **el examen**: cada fase usa una lección de los jefes del monte. Y no se vence solo: **la casa llena** lo hace posible (Zenaida: «el Rey no se vence a golpes: se vence con la mesa llena»).

### 3.1 La arena: «El Redondel de la Cumbre»

Al usar la Corona, `usarCorona` ya no solo hace nacer al Rey: **arma la arena** (nuevo módulo `src/reyfinal.js`, función `armarRedondel(g, cx, cy, cz)`):

- Un **redondel de piedra de 26 de radio** a la altura del jugador, con **un altar** en el centro (la Corona encima) y **8 postes con farol** (`K.farol`) en el borde, como un redondel de fiestas de pueblo. Un **sendero** baja por un lado (por ahí suben los vecinos).
- **Seguro para el mundo:** se guardan `[x,y,z,idViejo]` de cada bloque cambiado (≤ 2 500) y se **restauran al terminar, al morir, al salir del mundo y al cargar** (`g.rey` no se guarda; la arena vive en `world.mods` solo mientras dura; ver 5.5). Sin esto, la pelea deja un cráter permanente.
- **Transformación por fases:**
  - **F1 «Vuelo»:** cielo despejado y luna; el redondel entero; faroles encendidos.
  - **F2 «Tormenta»:** `Weather.set('storm')` y relámpagos; los faroles **se apagan de a pares** con el viento (luz baja); el **anillo exterior se agrieta** (los bloques de los 4 metros de afuera pasan a `ceniza`, que **cae** por `tickCaidas`), así el redondel **se achica de 26 a 18**; abajo hay una **cornisa de seguridad** a 6 bloques (cae 3–4 de daño, no es muerte).
  - **F3 «Alas rotas»:** el Rey baja al suelo; el redondel queda cubierto de **ceniza** (niebla gris baja, partículas) y el anillo siguiente se agrieta a 14. Aparece el altar medio roto.
  - **F4 «El Amanecer»:** **el cielo se aclara** (`g.time` avanza hacia el alba durante ≈ 60 s con un tope; `calma.js` lo respeta) y las nubes se abren; los faroles **se vuelven a encender solos** de a uno cuando la gente toca el cencerro (ver F4). El redondel queda de 14.

### 3.2 Las cuatro fases

Umbrales por vida: **100–70 %, 70–40 %, 40–12 %, 12–0 %** (hoy: 66 y 33 %, tres fases). Vida del Rey **900 → 1 000** (≈ la que dan 120 s con 45–65 % de exposición; ver 3.2.5). Sigue siendo `FINAL.rey_zopilote` en `final.js`; el cerebro nuevo vive en `reyfinal.js` y `FINAL.rey_zopilote.update` delega por `D.fase`.

**F1 — «El Vuelo» (100–70 %). Lección: esquivar el rojo y el parry dorado.**
- Mantiene lo de hoy (vueltas altas, **picada con chillido y carril rojo** nuevo: `avisoEmbestida` de ancho 3 y largo 20, 0.9 s; se esquiva rodando o barriéndose; **posado** de 5 s después de cada picada: ahí se le llega con el arma).
- **Picotazo posado = golpe dorado** (ya usa `atacar` con `tipo: 'mordida'`): un **parry lo aturde 1.6 s** (`stunT`) y recibe ×2 (`topeAturde`, jefes ×1.8): es la ventana buena.
- **Escolta:** 3 **zopilotes** pequeños (`fauna3.js`, los «de adorno») bajan en picada con **brillo dorado** (parry) y 6 de vida. Si la gente ya está en el redondel, **Wilber** los derriba con flechas (5 de daño cada 2 s, como en los asedios) y **el Canelo** (si lo adoptó) los muerde.
- Se puede pegar con el arco al Rey en el aire (flecha 2–9 por tiro; honda y jabalina también); sigue **sin entrar el cuerpo a cuerpo** si está alto (`onHurt`: «Está muy alto»).

**F2 — «La Tormenta» (70–40 %). Lección: oír el aviso y leer el suelo.**
- **Rayos con círculo rojo** (ya, 1.2 s) hasta **tres a la vez** y, nuevo, **el Canelo ladra 1 s antes de cada rayo** (si está en el redondel): es el «cascabel» de esta pelea. Sin el Canelo, el trueno suena 0.6 s antes.
- **Plumas dardo** (3 de daño ×3, ya): se **desvían con el escudo** o se esquivan; con parry dorado una vuelve y le pega.
- **El redondel se achica** (26 → 18) a los 3 s de entrar a la fase: el anillo cae en tres golpes de 2 s con aviso rojo en el borde, para que nadie esté parado ahí.
- **Anselmo** llega con una linterna y **tapa la grieta que se abrió** (reconstruye 4 bloques de ancho del borde con basalto, una sola vez): un respiro, y una frase (3.3).
- El Rey **se posa 3 s** tras cada picada: la ventana es más corta, pero ahora hay **rayos que lo dejan «sonado»**: si uno cae en el círculo bajo él, queda 2 s aturdido (hay que atraerlo).

**F3 — «Alas rotas» (40–12 %). Lección: golpe fuerte y barrerse.**
- Cae al suelo (`D.f = 'cae'`, ya) y pelea a pie: **brinco** con anillo rojo de 3.5 (ya), **aletazo** con anillo (ya) y **nuevo aletazo rasante**: una **ola baja** que sale del Rey a ras de suelo con un carril blanco; **se salta o se pasa barriéndose** (Ctrl+Espacio da un instante sin que lo toquen).
- **Plumaje de ceniza:** una **coraza** que absorbe el **65 %** del corte **hasta que un golpe fuerte (clic central/F) o un arma contundente la rompe**; rota, queda **expuesto 6 s** (= la «concha» del Cangrejo Rey) y se vuelve a formar a los 12 s. Es el examen del **golpe fuerte**.
- **Ceniza que ciega** (ya: `mareo` 4 s): el remedio está en **Doña Flor**, que si el jugador baja de la mitad de vida lo cura (`ayudaEnPelea`, hoy solo en asedios) y quita el mareo.
- Aparecen 2 **zopilotes de ceniza** cada 20 s (6 de vida, brillo dorado).

**F4 — «El Amanecer» (12–0 %). Lección: parry encadenado y la casa llena.**
- El cielo se aclara. El Rey **se tambalea y se enfurece**: **combo de tres golpes dorados seguidos** (picotazo–aleteo–picotazo, `cadena: 3` en `atacar`, ya soportada) cada 6 s. **Cada parry bien hecho** resta un 3 % de su vida y lo aturde; el que falla pega 6.
- **El coro:** al empezar la fase la gente (Yendry con el cencerro de la finca; ver 3.3) **toca la campana** y **cada toque** (cada 10 s, 4 toques) lo **frena 3 s en el suelo**, una ventana larga para el golpe fuerte; con **los cuatro toques**, queda de rodillas.
- **El golpe final** (3.6): con ≤ 5 % de vida queda de rodillas, sale **un destello dorado** sobre él y el próximo golpe (cualquier ataque) lo termina con **cámara lenta jugable**.

**3.2.5 Vida y tiempo (estimación, 📏):** DPS del bot con `jefeJade` ≈ 18–20 hp/s sobre un blanco expuesto; exposición ≈ 0.45 (F1), 0.4 (F2), 0.65 (F3 con coraza), 0.55 (F4). Con 1 000 de vida repartida 30/30/28/12 % salen **≈ 35, 40, 38 y 20 s** de pegada ≈ **133 s ≈ 2 min 15 s** para el bot torpe. Es el objetivo (100–130 s). **No se mide hasta que exista el cerebro nuevo** y la Fase 0 haya hecho el duelo de hoy como línea base.

**Daño recibido (objetivo para el bot torpe: 13–17 de 20):** picada 8, picotazo 5, rayo 6, pluma 3, brinco 7, aletazo 6, rasante 4, combo de F4 5 + 5 + 6. El **perfil `habil` debe recibir 6–9**.

### 3.3 Los personajes en la pelea (todos de la historia, ninguno inventado)

Voces de `historia.js`, `gente.js` y compañía. Los vecinos **suben con faroles** por el sendero cuando la Corona está en el altar (`spawnMob('vecino', …)` con la `seed` de cada uno en `gente.js:PERSONAS`) y se quedan **en la ladera del redondel**, **inmortales** (`m.data.inmortal`). Solo suben los que el jugador **ya conoce** (misma regla del epílogo `listoEpilogo`): si falta alguno, no está, y no pasa nada.

| Quién | Momento | Qué dice (ejemplo, voz de la casa) | Qué hace en juego |
|---|---|---|---|
| **Zenaida** (la abuela, en una carta) | Antes de F1 y al entrar a F4 | «Mi güila: si ya llegó arriba es porque ya no le quedan Sombras por aprenderse. Lo que viene no se vence a golpes: se vence con la mesa llena.» | La lee **Don Chema** (cartero) corriendo: **carta nueva** `carta_zopilote`, en 4 s con `ui.dialog`; da el **brillo del Corazón** si lo tiene (hoy `meta.corazon`) |
| **Don Chema** | Preludio | «¡Alcanzó, alcanzó! Llegó esta mañana, sin remitente. Ya sabe cómo es doña Zenaida.» | Entrega la carta y **se queda en la ladera** |
| **Doña Eulalia** | Preludio | «Mijo, mija, yo le llevo un tres leches, que sin comer no se pelea.» | **Bendición**: 6 minutos de `aguante` (efecto ya existe en `variedad.js`) |
| **Niña Chepa** | Preludio, si está | «Coma, coma, que después no hay tiempo.» | **Plato de fuerza** (`fuerza`, 6 min) y, en F3, si `food < 12`, otro (`ayudaEnPelea`) |
| **Doña Flor** | F3 | «¡Aguante, que ya casi!» | Cura 6–10 si baja de la mitad y quita ceniza/veneno (ya existe) |
| **Ñor Tino** | F2 | «¡Esa espada llega rota, déjeme verla!» | Una vez **repara el arma** (`yunque`) cuando la durabilidad baja de 20 % |
| **Mae Wilber** | F1 y F2 | «¡Esos zopilotes son míos!» | **Derriba a los zopilotes** de la escolta (flecha de 5 cada 2 s) |
| **Don Anselmo** | F2 | «Yo ya tapé una grieta. Esta me la dejo con gusto.» | **Tapa el borde roto** (basalto, una vez); mira el cielo al amanecer: «Nunca fui a comprar los cigarros» |
| **Tío Rigo** | Preludio | «¿Seguro contra Sombras? Cobré por adelantado, mi cepa.» | Con el **Seguro** comprado, **morir aquí no suelta nada** (ya existe: una sola vez) |
| **Prima Marielos** | F2 (cómica) | «Le doy 300 colones por este cerro, ¡se ve mucho mejor sin el pájaro!» | Solo habla (comedia); tras la fase **le tira un «papel»** a la fiesta |
| **Yendry** (la güila) | F4 | «¡Ahora, ahora!» | **Toca el cencerro** (campana, banco CC0 `campana`) en cada toque del coro |
| **El Canelo** (zaguate) | F1–F2 | (ladridos) | Muerde a los zopilotes y **avisa de los rayos** |

Frases en `decir(g, m, texto, segundos)` (globo sobre la cabeza, `misiones.js`) para no quitar el control; **solo la carta** usa `ui.dialog` y dura 4 s.

### 3.4 Música que crece (bancos CC0 existentes + código)

Todo con lo que ya hay: las notas reales de **marimba y arpa** (`nota.marimba.*`, `nota.arpa.*`, VCSL en dominio público) y los bancos CC0 `latido` (3 sonidos), `campana` (2), `trueno` (2), `rumble` (2), `aleteo` (4), `arpia` (2), `aplausos` (2) y `loop.marimba` (2) de `public/sounds/real/manifest.json`. **Cero archivos nuevos.**

Nuevo `Music.composeRey(fase)` en `musica.js` (junto a `composePelea`) y un parámetro `s.rey = g.rey ? g.rey.fase : 0` que **sustituye** `s.pelea` en `Music.update` (mismo `callar()`/entrada rápida):

| Fase | Capas (todas por código) | Tempo |
|---|---|---|
| **Preludio** | Un **latido** (`latido`) cada 2 s y una nota larga de arpa en menor, solos | 40 por minuto |
| **F1** | El ostinato de arpa de `composePelea` en menor, grave, + **latido** en cada compás | `beat` 0.19 |
| **F2** | + **marimba** haciendo el bajo (octava abajo) + **truenos** (`trueno`) sincronizados al primer tiempo de cada 4 compases | `beat` 0.17 |
| **F3** | + el ostinato **doblado una octava** (más agudo) + **campanas** (`campana`) en los tiempos fuertes | `beat` 0.155 |
| **F4** | Cambia a **pentatónica mayor** (`MAJOR`): marimba en terceras (`compose` de «valle»), arpa arriba y **un toque de campana por cada toque del coro** (3.2) | `beat` 0.22, se afloja |
| **Golpe final** | `callar()` (silencio de 1.0 s) y **un motivo de 12 notas de marimba**, solo, en mayor: «el himno de la casa» (la misma melodía que suena en la mesa larga del epílogo) | libre |
| **Créditos** | `concert()` (marimba de día en 6/8 con terceras), con `aplausos` al final | 0.24 |

El volumen sube un 25 % por fase (`gain.setTargetAtTime`) y todo respeta el ajuste «Música» y se calla con el locutor en diálogo largo. 👁 nanoyackson prueba que no canse.

### 3.5 Cámara y cinemáticas (sin quitar el control)

Se reusan `g.shake`, `g.hurtTilt`, `g.flipPitch`, `g.slowmo` (el parry y el esquive perfecto ya lo usan) y las **barras de cine** de `foto.js` (`barras-cine`). **Cinco momentos, todos ≤ 5 s y saltables con cualquier tecla:**

1. **La llamada** (3 s): el viento se para, `shake` 0.8, la Corona brilla en el altar, aparece el título («El Rey Zopilote» con el apodo) por el locutor (`presentarJefe`).
2. **El cambio a tormenta** (2 s, sin barras): `hurtTilt` y relámpago blanco; el control sigue.
3. **La caída** (3 s): el Rey se viene abajo (`D.f = 'cae'`), `shake` 0.8, `slowmo` 0.4 s al golpear el suelo.
4. **El amanecer** (4 s): barras de cine, el cielo se aclara, el cencerro suena; el control **se mantiene**, solo se mueve la luz.
5. **El golpe final** (6 s, **jugable**): ver 3.6.

Con «Movimiento tranquilo» activado (`calmaActiva`) no hay `shake` ni inclinaciones: solo luz y sonido.

### 3.6 El golpe final y el remate

- **El golpe:** con ≤ 5 % de vida el Rey queda de rodillas con un destello dorado. **El próximo ataque lo termina** (si se tarda más de 12 s se levanta y vuelve a la F4). Al caer: `slowmo` 0.6 s, la cámara hace un **giro corto** alrededor del Rey (1.2 s) y **se apaga la música** (1.0 s de silencio, solo el viento).
- **El alba:** `g.time` llega al amanecer, los zopilotes se van volando y **los faroles se encienden de uno en uno**. La gente se acerca; el jugador mantiene el control.
- **El remate hablado** (6–8 s, con globos): Chepa: «¡A comer!»; Tino: «Y esa espada, mañana me la trae.»; Eulalia: «¿Ya ven? Se podía.»; Marielos: «Yo siempre dije que la vista era lo mejor.»; Anselmo (sin que nadie le pregunte): «Voy por los cigarros.» (y no vuelve a hablar). **Yendry** le entrega a la persona la **Campana de la casa** (ver 4).
- **Créditos** (`final.js`, `creditos`): el rollo **deja de ser plano**: pasa con los **nombres y los íconos de quienes subieron** (los reales de `meta.gente`), sus frases de la ladera, y **tres números de la partida** (días, caídas, jefes). Termina en «Seguir jugando», como hoy, con el **himno de marimba** de fondo.

### 3.7 El epílogo que cierra los hilos

`epilogo.js` (`lineas`, `tickEpilogo`, `listoEpilogo`) sigue siendo la **mesa larga** del domingo (hoy exige todas las historias cerradas), pero **ahora cuenta también la Noche del Rey** y **cierra cada hilo con una frase**; si alguno quedó abierto, la línea se salta, no se inventa:

| Hilo | Línea de cierre (lo que dice la pantalla en negro) |
|---|---|
| Zenaida | «La casa de la abuela ya no tiene huecos. Ni miedo.» |
| El Corazón | «El Corazón de Tiquicia quedó en la repisa. Las noches ya son noches.» |
| Anselmo | «Don Anselmo fue por los cigarros. No volvió. Tampoco hace falta.» |
| Marielos | «La prima Marielos vendió su primer lote… y una casa que no era suya, a la dueña.» |
| Rigo | «El tío Rigo cobró la póliza. Esta vez, a favor de la casa.» |
| Chema | «Don Chema trajo la última carta. Dejó de llover.» |
| Eulalia | «Doña Eulalia cumplió noventa y uno. El tres leches salió mejor que nunca.» |
| Tino · Chepa · Flor · Wilber | «El yunque suena otra vez. La olla no se vacía. La mata de Flor floreó. Mae Wilber ya no mira la cumbre.» |
| Yendry | «Yendry aprendió a parar un golpe. Todavía no a pedir permiso.» |
| El Canelo | «Y el Canelo duerme en el patio, cada noche, sin que nadie se lo pida.» |
| **El Rey** | «Día N: el Rey Zopilote cayó. La gente lo vio. Fue en una noche sin luna que terminó antes de tiempo.» |

Condición: el epílogo sale **la primera vez que, estando todo cerrado, hay un domingo cerca de la casa** (ya es así). Se suma **un guiño al final**: la última línea es siempre «Coma bien, que la vida es larga.» (ya está).

---

## 4. Recompensas

**Regla de plata** (cuarta revisión, hallazgo 2): **el premio en plata de un jefe se paga una vez**; la revancha un décimo (`PREMIO_BAJA`, `premioBaja` en `precios.js`; `meta.premioJefe[tipo]`). Los valores topados ya están (v11.10.4): monte ₡40 000–70 000 (80–140 unidades), Rey ₡500 000 (1 000), etc.

**Mañas de jefe** (nueva «familia» en `manas.js`): una **maña propia** por jefe, la primera vez, **sin gastar** una casilla de nivel; se guardan en `meta.manas` y se ven en la libreta. Cada una es un flag que se consulta con `mana(g, 'clave')`:

| Jefe | Maña | Efecto |
|---|---|---|
| Reina Bananera | **Seda de la Reina** | La telaraña y el veneno de araña duran la mitad |
| Cascabel del Llano | **Oído de cascabel** | Los avisos rojos duran +0.15 s |
| Don Cornudo | **Cuerno firme** | Las embestidas lo empujan la mitad |
| Tata Sapo | **Panza de sapo** | El veneno hace 30 % menos |
| Cangrejo Rey | **Concha** | El escudo aguanta 20 % más y el parry con él dura +0.05 s |
| Ciempiés Rey | **Mil patas** | El barrido y el esquive gastan 25 % menos aire |
| Señor del Arenal | **Piel de ceniza** | La lava y el fuego pegan 30 % menos |
| Arpía | **Pluma al viento** | Las alas planean un 25 % más |
| **Rey Zopilote** | **Rey de la cumbre** | **+2 corazones** permanentes (`p.vidaExtra`) |

**Objetos únicos nuevos** (con **pedido de arte**: mismo estilo plano de `PEDIDOS_ARTE_LOTE1.md`, 512×512, fondo transparente; los prompts completos se agregan a ese archivo como «lote 2»):

| Ítem (clave) | Cae de | Qué es y para qué sirve | Pedido de arte (resumen) |
|---|---|---|---|
| **`campana_casa`** | Rey Zopilote (se la da Yendry) | **Campana de la casa**: tocada en el patio **llama a la gente a la mesa**: cura 6, llena la comida un poco y sube la reputación una vez al día | Campana de bronce con asa de cuero y una lazada de cabuya, brillo dorado arriba a la izquierda |
| **`pluma_oro_rey`** | Rey Zopilote | **Pluma de oro del Rey** ×1: con 4 se arman las **Alas del Amanecer** (planear un 50 % más) | Pluma larga amarillo-oro con raquis marrón y una vena clara, en diagonal |
| **`mantilla_zenaida`** | Epílogo (mesa larga) | **Mantilla de Zenaida**: de adorno en la casa y da **cuero duro 5 %** puesta | Chal de lana color vino con flecos y una flor bordada, doblado |
| **`foto_cumbre`** | Rey Zopilote (a los vecinos que subieron) | **Foto de la cumbre**: marco de madera con **la gente de la casa** a contraluz; se cuelga en la pared (decoración) | Marco de madera clara con una foto de siluetas en una cumbre al amanecer |
| **`cigarro_anselmo`** | Anselmo (al final) | **Cigarro sin encender** (de los de 1962): objeto de colección, cierra el logro «Los cigarros» | Un cigarro blanco con anillo dorado, un fósforo apoyado y una cajetilla vieja detrás |

Los **trofeos** de cada jefe ya existen (`TROFEO_DE` en `hogar.js`) y el Rey sigue dando **la Cabeza** (colgable), **plumas** y **la corona de la historia**; la **Corona del monte se consume** al llamarlo.

---

## 5. Fases de construcción (tamaño y qué verificar)

| # | Fase | Tamaño | Qué incluye | Verificar |
|---|---|---|---|---|
| **0** | **Medir** | **M** | `bot-pelea.js`: equipos `jefeHierro`/`jefeDiamante`/`jefeJade`, perfiles `torpe`/`promedio`/`habil` (parry, esquive, arco), 19 duelos nuevos + variantes de revancha, métricas `exposicion`, `tiempoPorFase`, p y muertes esperadas; una corrida de 10 por celda; resultado a `BALANCE.md` | El duelo del Rey de **hoy** como línea base (TTK real); los seis del monte medidos; las columnas de la tabla 1.3 llenas |
| **1** | **Curva y premios** | **M** | Vidas y golpes de 2.1–2.3, premio de jefe una sola vez, enfriamiento de la Ofrenda | Cada TTK dentro de la banda ±25 %; los seis del monte suben parejo; el bot con `habil` gana ≥ 90 % en todos los de B |
| **2** | **Avisos y lecciones** | **M** | Los avisos y mecánicas de 2.1–2.3 (carriles y anillos, cascabel, concha rota con un golpe, barrido bajo el anillo, ondas del Señor, Arpía) | Cada jefe **enseña** lo prometido: una prueba jugada por jefe con la maña apagada; `tools/revisar-avisos.mjs` y lint en cero |
| **3** | **Arena del Rey** | **L** | `src/reyfinal.js`: `armarRedondel`, **restauración de bloques**, anillo que se achica, cornisa, `g.rey` (estado no guardado), limpieza al morir/salir/cargar | **Restaura siempre** (morir, salir al menú, cerrar la pestaña, `/prueba`); no deja cráter; el mundo viejo carga igual; rendimiento con 2 500 bloques |
| **4** | **Cerebro del Rey** | **L** | Las 4 fases en `final.js`/`reyfinal.js` (coraza, rasante, escolta, combo de F4, golpe final), umbrales 70/40/12 | El bot con `jefeJade` da **100–130 s**; la fase por fase suma lo esperado; `habil` recibe 6–9; `torpe` pierde a veces |
| **5** | **Música y cámara** | **M** | `Music.composeRey`, parámetro `s.rey`, 5 cinemáticas ≤ 5 s con tecla para saltar, `slowmo` del golpe final, `calmaActiva` | Se oye crecer por fase; nunca más de 5 s sin control; con «Movimiento tranquilo» no hay sacudidas; `volumen` de música respetado |
| **6** | **Gente y trama** | **M** | Los vecinos suben con faroles (`spawnMob('vecino', …)`), sus frases (`decir`), la carta nueva, `ayudaEnPelea` extendida a `g.rey`, el Canelo, el Seguro de Rigo | Solo suben los que la partida ya conoce; ninguno se muere ni se atasca; con falta de alguno no se rompe nada |
| **7** | **Remate y epílogo** | **M** | Golpe final, alba, créditos con nombres reales, `epilogo.js` con las líneas de cierre, `campana_casa`, `foto_cumbre`, `mantilla_zenaida`, `cigarro_anselmo`, mañas de jefe | Créditos y epílogo salen una vez; la maña no se duplica; el Rey vencido una 2.ª vez **no repite** el premio ni los créditos |
| **8** | **Arte** | **S** | Pedido «lote 2» a GPT (5 objetos únicos) y la «Cabeza del Rey» ya existe | Los 5 PNG pasan la lista de `PEDIDOS_ARTE_LOTE1.md` §4 |
| **9** | **Docs y cierre** | **S** | `BALANCE.md` (curva medida), `ARBOL_CONOCIMIENTO.md`, `CHANGELOG`, `GAME_VERSION`; `/prueba final fase2|fase3|fase4|creditos|epilogo` | Cada `/prueba` salta a su fase; lint y build en cero |

**Orden recomendado:** 0 → 1 → 2 (cierran la curva y los jefes del monte) → 3 → 4 → 5 → 6 → 7 → 8 → 9. **No publicar** sin que la Fase 0 diga que la curva se cumple.

**Verificaciones transversales:** (a) **nada se guarda a medias**: `g.rey`, el redondel y los vecinos de la pelea **no** entran al guardado; si se cierra la pestaña en la F3, al volver el mundo está limpio y la Corona **no se pierde** (se devuelve si el Rey no fue vencido); (b) **morir en la pelea** devuelve al jugador a su cama con el redondel restaurado y la Corona en el inventario (`recogerUnicos`, ya existe para los únicos); (c) **pausar** congela todo, incluida la música; (d) **dificultad «Tranquilo»** baja la vida del Rey a 700 y quita la F4 de combo; (e) **Movimiento tranquilo**; (f) un mundo **sin la historia terminada** puede pelear al Rey con menos ayuda (solo los que ya conoce).

---

## 6. Lo que queda por decidir (de nanoyackson)

1. **¿Vida del Rey 1 000 o se deja en 900?** Depende de la medición de la Fase 0 (la corrida de hoy da la línea base).
2. **¿Que la historia exija al Rey** (hoy son dos finales paralelos: la Noche Larga cierra a Zenaida, el Rey cierra la Corona)? Recomiendo **no exigirlo**: el epílogo lo cuenta si ocurrió.
3. **¿Cuántas muertes es «épico»?** El diseño apunta a 1 de media; 👁 jugarlo.
4. **Los nombres de las mañas de jefe** y los **textos de la gente** son míos: nanoyackson decide el tono.
