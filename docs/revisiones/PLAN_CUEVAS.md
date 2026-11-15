# Plan v13.1.0 — Cuevas y mundo bajo tierra

Investigación de solo lectura. Mediciones con un script de Node fuera del repo (`Generator(seed 123457, genVersion 21)`, 256 trozos alrededor del origen, `Uint16Array`; nunca en «seed»). Sin cambios en `src/`.

## 1. Estado actual

**Dónde vive.** `src/worldgen.js:78-92` (`isCave` base), `src/worldgen2.js:146-165` (`isCave` v2: base + fideos + cavernas), `:226-232` (cavado y lagos), `:245-286` (vetas), `:288-319` (decoración), `:321-345` (geodas), `:347-376` (ruinas). Aparte: `caverna.js` (Caverna del Rey, estructura única cada ~1500 bloques, `estructuras.js:906`), `minaoro.js` (Abangares, se construye después de generar, una por partida), `fuego.js` (tubos de lava, solo `gen.version >= 21` y solo bajo volcanes), `mina.js` (derrumbes y pierna rota), `hongos.js`, `infragen.js` (otra dimensión, no entra).

**Cómo se cava (todo ruido 3D continuo en coordenadas del mundo).**
- Espagueti `|A|<0.075 y |B|<0.075` (escala 0.022/0.034), más «fideos» finos `<0.04` (0.045/0.06), más «queso» `nCaveC` si `y<48` (base) o `y<56 y y<h-10` (v2).
- `y<=10` toda cueva se llena de **lava**; por regiones de 48×48 (45 %) las cuevas de `y<=aqLevel` (18–35) se llenan de **agua**.
- Roca profunda (`deep_rock`) bajo `y≈14` (±3, con borde en dientes).

**Medido (256 trozos):**
| Banda y | Aire |
|---|---|
| 1–10 | 0 % (31 % lava, el resto roca: no hay cuevas transitables) |
| 11–20 | 16 % |
| 21–30 | 22 % |
| 31–40 | 23 % |
| 41–50 | 22 % |
| 51–60 | 10 % |
| 61–75 | 3 % |

- 222 de 256 trozos (87 %) tienen más de 200 bloques de aire bajo tierra. O sea, **casi todo trozo tiene cueva**, y entre y=20 y y=50 más de una quinta parte del volumen es hueco (mucho para un «queso»: se siente como un colador, no como lugares).
- Por trozo (media): carbón 26, hierro 32, oro 9 (+5 oro hondo), **diamante 1.2 (+8.3 hondo = ~9.5)**, jade 0.7, musgo 51, hongo brillante 5.6, estalactita/estalagmita 3.9 + 3.9, cristal 7.2, calcita 6, cuarzo 3, telaraña 0.2. Lava (bloques) ~400/trozo, agua ~380–610.
- Estructuras: ruina 7×5×7 con 1–2 cofres (7 % de los trozos), geodas (5 %), Caverna del Rey, Mina de Abangares (1 por partida), tubos de lava (solo volcanes).
- Criaturas: `trySpawnCave` solo murciélagos (máx 5) y vampiros (<y40, 40 %); hongo reventón; sombra de noche. Nada propio de la cueva más allá de eso, y ningún mob se queda por zona.
- Luz/ambiente: sin luz natural, brillan hongos y cristal; casco de espeleólogo (+brillo); polvo en el aire (`game.js:3557`); ambiente grabado «cueva» y arpa lenta (`musica.js`). **No hay goteo, agua corriendo, ni eco por zona**: el mismo ambiente en todas partes.
- Generación: ~9.4 ms por trozo (todo el generador, en el hilo principal). No hay lag de cuevas en sí; el costo es el barrido `16×16×128` ×3 ruidos 3D.

## 2. Problemas concretos
1. **Monotonía.** Un solo estilo (espagueti+queso+fideos del mismo ruido) en todo el mundo; las decoraciones (musgo/goteo/cristal) por ruido pero sin «lugares». No hay tipos por región ni por bioma: bajo el desierto, la selva o el volcán la cueva es igual.
2. **Colador.** ~22 % de aire a y20–50 hace que no haya roca maciza para minar; el «queso» alcanza un 87 % de trozos. Cuesta que una cueva sea memorable.
3. **Muros de acuífero.** `aqBorder` sella 2 bloques cada 48 (`worldgen2.js:200-208`, y 10<y≤37): cuevas que se cortan en líneas rectas con pared lisa cada 48 bloques (y `nearSea` hace lo mismo bajo la costa). Es el «cortada en el borde» que se ve; no es por borde de trozo (el ruido es continuo).
4. **Fondo sin cuevas.** `y<=10` es lava en todo hueco; el fondo es una losa. Los diamantes (y3–17) quedan en roca maciza y lava, sin ruta de exploración.
5. **Recompensas pobres.** Solo ruinas (7 %) y los dos sitios únicos. Cofre ≈ cada 14 trozos de ruina idéntica (misma caja 7×7×5). Nada que invite a explorar sin cavar.
6. **Minerales «parejos».** Vetas aleatorias por trozo (random walk) sin geología: sin vetas grandes, sin zonas ricas; el diamante es casi gratis una vez abajo (9.5/trozo) y el oro (14/trozo) también.
7. **Lagos y ríos.** Lagos planos por regiones, sin corriente; no hay ríos subterráneos ni cascadas internas.
8. **Criaturas y sonido repetitivos** (ver arriba).

## 3. Fases propuestas
Regla común para **todas** las que cambien el cavado: nueva constante `GEN_CUEVAS = 22` (como `GEN_TUBOS = 21`, `fuego.js:12`), y `ui.js:343` crea mundos con `genVersion: 22`. Todo cambio de terreno se condiciona a `gen.version >= 22`; los mundos 21 y anteriores quedan idénticos (los trozos ya guardados además no se regeneran: solo cambiaría lo que falte por generar, y eso daría costuras si no se condiciona). Las fases C4+ que son solo decoración y mobs no necesitan versión.

**C1 — Rediseño del cavado (la base).** Tres capas bien distintas en vez de un ruido: **queso** grande y raro (por regiones, ~8 % aire total), **espagueti** largo conectado a la superficie por bocas (para entrar), **fideos** solo como conexión. Un campo de «tipo de cueva» de baja frecuencia elige estilo por región (y por bioma: más húmeda en selva/manglar, más seca y caliza en Guanacaste). Quitar los muros de acuífero rectos (la costura de §2.3): el agua se resuelve con niveles por cuenca (ruido, no cuadrícula). Capa de aire controlada en `y 51–60` (menos huecos que rompen la superficie).
- Archivos: `worldgen.js` (`isCave`, si hay que parar el viejo), `worldgen2.js` (`isCave`, `aqBorder`, constantes), `ui.js:343`, `version.js`+CHANGELOG, árbol.
- Riesgo mundos viejos: bajo si va tras `version >= 22`; un error en la condición rompe costuras. **Sí sube gen.version.**
- Rendimiento: neutral si se baja el número de ruidos 3D por voxel (ahora ~5); hoy ~9.4 ms/trozo, objetivo ≤ 12. Poner un corte rápido por `y` y por `h`.
- Tamaño: 1 versión. Verificar con el mismo script de §1 (aire por banda, trozos con cueva).

**C2 — Capa profunda y geología.** `deep_rock` con su propia veta y un «fondo cuevero»: de y 4–10 pasan a haber **cámaras de lava transitables** (islas, puentes de roca), no una losa; vetas grandes (cuerpos de 30–60 bloques de hierro/oro con ganga a su alrededor, 1 por ~6 trozos) en lugar de random-walk pequeño; diamante solo junto a una veta grande o a lava (baja de ~9.5 a ~3/trozo, pero más visible); más variedad de roca (calcita y toba en cuevas húmedas).
- Archivos: `worldgen2.js` (vetas y cavado `y<=10`), `blocks.js` (si se suma roca/mineral nuevo: ids >603 con textura), `textures.js`.
- Riesgo viejos: solo con `version>=22`. **Sí sube gen.version** (comparte el 22 con C1).
- Rendimiento: bajo (vetas puntuales). Tamaño: 1 versión.

**C3 — Sitios kársticos con nombre tico.** Tres tipos de sala-regalo, colocados por celdas como `estructuras.js` (determinista por semilla, ver `sitiosAnillo`): **Cueva de Barra Honda** (galería caliza con estalactitas gigantes y pozos), **Cueva de Venado** (río subterráneo con agua corriendo y puentes de piedra), **Geoda mayor** (cuarzo/cristal grande con cofre). Cada uno trae un cofre con botín propio, una placa y una entrada en la libreta (`libreta.js`) al descubrirlo («Descubrimientos»).
- Archivos: nuevo `src/cuevas.js` (como `caverna.js`), `estructuras.js` (entradas de `TYPES` con `minV: 22`), `libreta.js`, `bestiario.js` si hay bicho, textos en `historia/lugares`.
- Riesgo viejos: `minV: 22` ya los excluye de los mundos viejos. **Sí sube gen.version** (ya en 22). Atención a los cofres: `structures` devuelve BE; ver §4.
- Rendimiento: bajo (una estructura por ~1000 bloques; reutilizar `buildCaverna` como molde).
- Tamaño: 1 versión (tres sitios chicos).

**C4 — Vida y sonido de la cueva (sin cambiar el terreno).** Mobs propios por tipo de cueva (p. ej. «murciélago de bocas», «cangrejo ciego» en agua, un bicho de calcita), con `trySpawnCave` ampliado y un tope por zona; **goteo** (espeleotemas con gota que suena y deja charco), **agua corriendo** y eco por tamaño de sala; hongos y cristal que brillan distinto según la región; cada especie y cada tipo de cueva da una línea en la libreta/bestiario.
- Archivos: `entities.js` (`trySpawnCave`), `fauna*.js` o `bichos*.js`+`modelos-*.js`, `audio.js`/`musica.js`, `bestiario.js`, `libreta.js`.
- Riesgo viejos: ninguno (todo es de partida, no de generación). **No sube gen.version.**
- Rendimiento: bajo; el cuidado está en el tope de mobs y en emisores de sonido (máx 3 cerca).
- Tamaño: 1 versión.

**C5 — Minas abandonadas y premios (opcional).** Galerías de mina de oro/cobre abandonadas (puntales, rieles, cofres de minero, una vagoneta suelta) como variante corta de Abangares (`minaoro.js`) con `puntal` ya hecho (`mina.js`); geodas más raras y con premio; el derrumbe se conecta con las galerías.
- Archivos: `minaoro.js` (reutiliza `construir`), `worldgen2.js` (ruinas variadas en lugar de 7×7 fija), `mina.js`.
- Riesgo viejos: ninguno si va como estructura `minV:22` o se limita a `construir` en partida. **Sube gen.version solo si se mete a la generación** (ya en 22).
- Rendimiento: bajo. Tamaño: 1 versión.

Orden: C1 → C2 → C3 → C4 (C4 puede ir antes de C3 si falta tiempo) → C5.

## 4. Red (multijugador)
- Cada quien **genera el terreno localmente** a partir de `{seed, genVersion}` que manda el anfitrión (`red/pantallas.js:46,214`, `validar.js:244`). Por eso: (a) el generador **tiene que ser idéntico** en todas las máquinas con la misma `genVersion`; hay que cuidar que todo ruido de C1–C3 salga de `seed`/`hash3`, nunca de `Math.random` ni de orden de carga; (b) si el anfitrión es de 13.1.0 y la persona es 13.0.x, la persona **genera cuevas distintas** y se ve «flotando»: hay que subir la versión de protocolo o rechazar `genVersion > soporta` con un mensaje claro (`validar.js` ya limita `genVersion` ≤ 1000; no compara con lo que el cliente sabe).
- Lo que la generación devuelve como **entidades de bloque** (cofres con botín de C3/C5) lo escribe cada cliente; los cofres compartidos son del anfitrión (`cofres.js`, candado): el botín debe salir de `hash3`/semilla igual en todos (hoy `lootTable(rnd)`), y las **cantidades que se quitan** viajan por los mensajes `cofre_*` ya existentes.
- Los **mobs** (C4) los genera solo el anfitrión (`trySpawn`, `entities.js`); las personas los reciben por la red: el tope de mobs por zona cuenta lo de todas las fichas (`puntoDeSpawn` ya usa el punto de cualquiera).
- Derrumbes, rotura de bloques y agua que cambia (C1: niveles de agua más grandes) pasan por `bloque`/`suelta` con tope de ritmo (`limites.js`); un lago grande que se desborda (`updates`) puede hacer mucho tráfico si se rompe a pico; ver que el desborde sea acotado.
- Sonido y partículas son locales a cada quien: sin tráfico.

## 5. Recomendación
1. **Empezar por C1 + la medición** (sin la base, lo demás se ve igual de repetido). Que C1 cierre con el mismo script de §1 mostrando: aire total ≈ 8–12 % (hoy ~16 % y ~22 % a y20–50), sin muros de acuífero rectos, cuevas con entrada desde la superficie en ≥ 1 de cada 3 trozos.
2. Seguir con **C3** (da lugares y libreta) y **C4** (vida y sonido): son lo que el jugador nota.
3. **C2** si hay presupuesto; es el que más afecta a la economía (diamante/oro): hay que re-balancear con Isaac.
4. **Dejar afuera** si falta tiempo: C5 (minas), el río con corriente real (agua dinámica es cara y arriesgada en la red) y el sistema de «tipo por bioma» más fino; basta un tipo por región.
5. Decisión de producto que sigue abierta (de Isaac): cuánta dificultad extra sube con la profundidad (¿más lava y menos luz abajo?, ¿criaturas solo de noche?).
6. Antes de publicar: **mismo `genVersion` 22 en una sola versión** (C1–C3 juntos o con la misma bandera) para no tener dos saltos de generación; probar un mundo 21 (idéntico) y uno nuevo.
