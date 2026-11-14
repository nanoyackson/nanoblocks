# Preparación de C6 «Manos de maestro» (oficios) — encargo 38-B

Solo lectura, **contra el código de la v12.6.3** (HEAD `6303dfa`). Fuente del diseño: `DISENO_CONTENIDO_C5-C8.md` §C6 y su «Registro de ids». Lo que no pude comprobar va «por confirmar» (no abrí el navegador). Los números salen de `SHOPS` en `src/pueblo.js`, de `src/precios.js`, de `src/encargos2.js` y de una simulación que corrí aparte (el perfil de la sección 7).

## 0. Lo más importante: choques entre el diseño y el código de hoy (en orden)

1. **La calidad «fina» y «obra maestra» no sobrevive a poner el bloque.** Los muebles (mesa grande, alacena, armario, jarrón, puerta tallada, tinaja) son **bloques**; la calidad vive en el ítem (`stack.calidad`, como `stack.mejora` del yunque). Al colocarlo, el bloque pierde ese dato: `setBlock` guarda un id, no un `stack`. Entonces «+1 de comodidad en muebles finos» y «cuenta como obra maestra» **no se pueden cumplir en el bloque puesto**. Salidas: (a) la calidad solo afecta **el precio de venta** y el `+1` de comodidad se quita; (b) ids aparte para la versión fina (`mesa_grande_fina`…) — duplica ids de bloque; (c) entidad de bloque con `calidad`. **Recomiendo (a) para la primera tanda** y dejar la comodidad para la C6b si nanoyackson la quiere.
2. **La comodidad hoy es por *clases*, no por pieza.** `fuerza.js: comodidadAqui` cuenta **una por cada clase** (`cama`, `asiento`, `mesa`, `alfombra`, `flores`, `trofeo`, `pecera`, `luz`, `fuego`; máximo 9 más el nivel de la casa) y el descanso topa en 900 s con `180 + n·60`, o sea desde **n = 12**. «Vajilla +1 (máx. 3 juegos)», «jarrón +2», «puerta tallada +2» **no caben**: una clase da 1 sola vez. `mesa_grande` ya cuenta como `mesa` por la expresión `/mesa|table/` (sin ganar nada nuevo). Salida: una clase nueva `['artesanía', (b) => b.artesania]` (+1 una sola vez, con jarrón, vajilla, puerta tallada o alacena a 5 bloques) y listo; la comodidad ya está cerca del tope.
3. **Los números de precio de §2.4 usan materiales al doble de lo que pagan las tiendas** y rompen la «regla de oro» con las piezas que la tienda ya vende (tabla en §6). Los casos graves: **verja forjada** (15 u por 2; la tienda la da a 1.25 u), **farol forjado** (8 u; la tienda, 3 u), **tejas** (5 u por 8; la tienda las da a 2.5 u). Ahí «el oficio no es un negocio sobre la tienda» **no se cumple**: o no se venden en el mostrador, o se baja el precio, o no se hacen.
4. **El tope del mostrador (10 + 4 × nivel, hasta 50 u/día) + el de los encargos (40 u/día) pasan de largo la meta de C5–C6 (≈ 1.4 jornadas = 35 u por día).** Con la simulación de la sección 7 (3 piezas al día): **42–47 u/día con el tope compartido** y **49–57 u/día con topes separados** (1.7–2.3 jornadas), y solo si los materiales se recogen (comprados: 10–15 u/día). Hay que meter el mostrador **dentro de `M.ganado`** (el tope de 40) o bajar su techo.
5. **Los umbrales de nivel no cuadran con el texto.** §2.2 dice «umbrales 10, 25, 45… 400 (total 1 550)» y «nivel 5 en ≈ 4 días, nivel 10 en ≈ 50 días». Como **XP acumulada** esos umbrales llegan al nivel 5 con 100 XP (≈ 4 días) y al 10 con 400 XP (≈ 13 días). Como **incrementos** (acumulado 10, 35, 80, 150, 250, 390, 580, 830, 1 150, 1 550) dan el nivel 10 en ≈ 50 días, pero el 5 con 250 XP (≈ 8–10 días). Con 3 piezas al día y XP = 2 + valor/2 la simulación da **nivel 5 el día 10, nivel 7 el día 20, nivel 10 el día 45**. **Hay que elegir:** recomiendo los incrementos (acumulados) y corregir «nivel 5 en una tarde» por «en ≈ 10 días»; es lo que pregunta C6.7 a nanoyackson.
6. **El chanchito (6 barro amasado + engobes) vale 140 u en el alfarero ambulante** (`alfarero.js: PRECIO = 140`), y por ahora **no es crafteable** (`recipes.js` no lo tiene). Como pieza de oficio, el mostrador pagaría ≈ 100 u: **un solo chanchito rompe todo el tope del día**. No venderlo en el mostrador ni a encargos (solo para uso propio), o precio de pieza fijo ≤ 12 u.
7. **«Candado: protege un cofre de la ladrona»**: la ladrona del juego (`sombras2.js:198`, `sombra_ladrona`) **roba de la mochila del jugador**, no de un cofre; `pruebas.js` solo tiene el comando `/prueba ladrona`. El candado **no tiene nada que proteger** hoy. Opciones: quitarlo de la tanda, o hacer que proteja el baúl (`be.propio`) de los vecinos/saqueadores (mecánica nueva).
8. **«Yugo: abre la carreta con bueyes de C4»**: la carreta ya está comprada (`487`, 35 u en el mercader) y el yugo en `finca2.js: yugoCerca` es **solo la cercanía** de la carreta al trapiche (v12.4.7), sin ítem. El ítem 1149 no abre nada que hoy esté cerrado. Decidir qué hace (p. ej. exigirlo para que la carreta ayude al trapiche, o quitarlo).
9. **Cayuco y herradura**: no encontré en `src/` nada de cayuco, y no ubiqué dónde vive la velocidad del caballo (`vehiculos*.js` no menciona `caballo`; **por confirmar** con `grep -n caballo src/*.js`). Ambos son trabajo nuevo, no solo «una receta».
10. **Los encargos de C8-A no saben pagar piezas nuevas.** `encargos2.js: valorRef(id)` cae a **0.3 u** para todo lo que ninguna tienda compra o vende (tablas, troncos, barro, tabla fina, clavos…), y `pagoDe` ya paga ×1.25. Una alacena pediría ≈ 1 u. Hace falta una tabla `VALOR_PIEZA` (§5) que `valorRef` consulte primero.

## 1. Qué hay y qué falta hoy

| Cosa | Estado en el código |
|---|---|
| Rango de ítems nuevo | ✔ `EXT_ITEM = 1100`, `MAX_ITEM = 1300` (`blocks.js:5`); `tools/revisar-ext-item.mjs` lo prueba |
| Ids de C6 (bloques `672–684`, ítems `1130–1153`) | **Todos libres.** En el catálogo hay `668, 669, 671, 692, 697` (C5-B y C8-A) y los ítems `1121, 1124, 1125, 1126, 1187`. `664` es lo último de los postigos; `665–667`, `670` (muelle, pilote, boya, secadero) siguen sin usar (C5-A no se ha construido). Ojo: `1100–1120` y `1122–1123` también están libres: C5-A los usará |
| Estaciones | `stations.js`: `Stations.place` crea la entidad (`furnace`, `chest`, `table`, `stove`, `trapiche`…; líneas ~159–175), el visual por tipo (~403, ~489) y el tic (`furnace` ~565–583). **No hay banco, fragua, torno ni horno de barro** |
| Recetas por estación | `findRecipe(grid, size, mode, sabe)` solo distingue `'craft'` y `'cook'` (`!!rec.cook !== (mode === 'cook')`); **ya existe `rec.aprende` + `meta.recetas`** (recetas que se aprenden): sirve para los libros |
| Habilidades | `habilidades.js`: 7 habilidades en `SKILLS`; el logro `todero` exige que **todas** las claves de `SKILLS` estén en nivel 3 |
| Yunque | `yunque.js`: solo mejora ★ de arma/herramienta/armadura; no toca nada de C6 |
| Alfarero | `alfarero.js`: carretillo que pasa cada 4 días; vende un chanchito a 140 u. **No es un vecino** (es un modelo propio) |
| Maestros | **No hay** rol de vecino `carpintero` ni `alfarera` (por confirmar con `grep -n carpintero src/*.js`); `herrero` aparece en `PIDE` de `encargos2.js`, pero no encontré el rol en `pueblo.js` |
| Cupo | ✔ `encargos2.js`: `CUPO_DIA = 30` por pueblo+ítem (`g.meta.cupoDia`, `pagarConCupo`), y el tope de ganancia de 40 u/día (`M.ganado`, `TOPE_DIA`) |
| Perfiles de `bot-economia.js` | `trabajador`, `cazador`, `comerciante`; **faltan `pescador` y `artesano`** |

## 2. Funciones y archivos que hay que tocar

| Archivo | Qué |
|---|---|
| `src/blocks.js` | los 13 bloques (`672–684`) y los 24 ítems (`1130–1153`); claves y nombres de la tabla de registro. `getDef` ya sirve para ids altos |
| `src/pixelart.js`, `src/textures.js`, `src/texturas_arte.js` | las baldosas de los bloques (banco, fragua, torno, horno, muebles) y los engobes de la cerámica chorotega |
| `src/recipes.js` | las recetas: cada una con `est: 'banco' \| 'fragua' \| 'torno' \| …` y `aprende: 'carpinteria1'`. **Generalizar `findRecipe`:** `(rec.est ?? (rec.cook ? 'cook' : 'craft')) !== mode` |
| `src/stations.js` | `Stations.place`: entidades `banco`, `fragua`, `torno`, `horno_barro` con `grid` como `stove` (línea 174); visuales; tic de la fragua y del horno de barro (copiar el del `furnace`: `be.cook`, `COOK_TIME`) |
| `src/despensa.js` | la leña: `usarFogon` y el gasto (`be.lena ?? 8`, 1 por tanda, 0.5 en «Movimiento tranquilo»): la fragua y el horno de barro **reutilizan** esa lógica; `LENA = 561` |
| `src/game.js` | `USABLES_CLIC` (línea ~149) para los bloques nuevos; el encadenado de `rightClick` (~972, `usarFogon`/`usarYunque`) para abrir las estaciones; el mostrador (que vende solo) y el cayuco (vehículo) |
| `src/ui.js` | `craftMode()` (línea ~2034): hoy `'cook'` si la estación es `cooking`; que devuelva el modo por estación; el recetario (~2525) filtra por `!!r.cook === (mode === 'cook')`: también hay que generalizarlo |
| **módulo nuevo** `src/oficios2.js` | **No tocar `habilidades.js`** (agregar 3 claves a `SKILLS` cambia el logro `todero` y el panel H). El módulo guarda `meta.oficios = { carpinteria: { xp }, herreria: { xp }, alfareria: { xp } }`, calcula el nivel, la probabilidad de pieza fina (`5 % × nivel`, máx. 50 %), el sello de maestro y exporta `VALOR_PIEZA` |
| `src/encargos2.js` | `PIDE` y `encargosDelDia`: tipo nuevo `'taller'` (solo si hay nivel ≥ 1); `valorRef` consulta `VALOR_PIEZA`; `cumplir`: 2 × XP y pasar por el tope de 40 u. **Extraer `cobrarDelTope`** (hoy duplicado en `arrecife.js`, ver `REVISION_v12.6.2-v12.6.3.md`) a un módulo neutro |
| `src/pueblo.js`, `src/modelos-gente.js` | rol de vecino `carpintero`, `herrero` y `alfarera` (con su tienda de libros en `SHOPS`); `pueblogen.js` los pone en los pueblos grandes |
| `src/alfarero.js` | decidir si la alfarera fija **sustituye** al carretillo o conviven (el diseño dice «no se quita») |
| `src/fuerza.js` | `CATEGORIAS`: la clase nueva de artesanía (punto 2 de la sección 0) |
| `src/despensa.js` (alacena) | la podredumbre se calcula sobre ítems del **inventario** (cada 3 s, «fechar»); no hay refrigerador que la frene (**por confirmar**: el tipo `refri` de `stations.js:163` no aparece en `despensa.js`). La alacena «guarda a la mitad» pide un gancho nuevo para ítems dentro de una entidad de bloque |
| `src/version.js`, `tools/revisar-version.mjs` | los ids nuevos obligan a subir `MIN_VERSION` y a copiar la **firma nueva** a `MIN_IDS` **con su `version`** (ver la v12.6.3); si no, el script falla |
| `tools/revisar-plata.mjs`, `tools/revisar-recetas.mjs`, `tools/revisar-ext-item.mjs` | las pruebas de plata y de recetas tienen que cubrir los ítems 1130–1153 |
| `tools/bot-economia.js` | el perfil `artesano` (§7) |
| `docs/ARBOL_CONOCIMIENTO.md`, `CHANGELOG.md` | árbol y entradas (regla del proyecto) |

## 3. Las estaciones (cómo encajan)

- **Banco de carpintero (672)**: copia del `stove` (`grid` de 3×3, modo `'banco'`). Receta con el cepillo en la mano o en la cuadrícula: la herramienta **no se gasta** (como el yunque) o se desgasta con `wearHeld` (como la batea, `oficios.js`).
- **Fragua (673)** y **horno de barro (675)**: leña por tanda igual que el fogón (`be.lena ?? 8`, tope 16, `despensa.js:159–176`); se cargan con la leña en la mano.
- **Torno (674)**: modo `'torno'` sin leña; el barro amasado sale del torno y **cuece** en el horno (`COOK_TIME` del horno de hoy).
- **Mostrador (680)**: una entidad `be.mostrador = { slots: 6, precio: {…} }` y un tic de 1 s (el mismo de `rutinas.js`, por confirmar el nombre de la función): vende 1 pieza cada ~90 s **si hay un vecino o turista** (hoy el ciclo de vecinos es `rutinas.js`). **No se pone fuera de un pueblo con reputación ≥ 3** (`g.meta.repPueblo[v.id]`, `saberes.js: repDe`).
- **Aprender**: el **libro** (40 u ≈ 1.6 jornadas, ids 1150–1152) añade `meta.recetas` (`rec.aprende`): es la mecánica que ya existe. El «encargo de aprendiz» (3 piezas de nivel 0) es un `tipo: 'taller'` fijo de `encargos2.js`.

## 4. Nivel y calidad de oficio

- **Guardado**: `meta.oficios = { carpinteria: { xp: n }, … }`, opcional (`??`), con `Number.isFinite` al leer (lección de la v12.6.3). **Sin `SAVE_FORMAT` nuevo.**
- **XP por pieza**: `2 + valor/2` (la del diseño) y ×2 en los encargos de taller.
- **Niveles** (acumulados): `[10, 35, 80, 150, 250, 390, 580, 830, 1150, 1550]` (§0, punto 5).
- **Fina**: `Math.random() < min(0.5, 0.05 × nivel)`; se guarda en `stack.calidad = 'fina'` solo para **ítems** (ver §0, punto 1).
- **Obra maestra**: nivel ≥ 8 + sello de maestro en la mano. El sello (1153) es `esUnico`-like (un solo ítem por mundo o de uno en uno); **por confirmar** si debe entrar a `esUnico` (`inventory.js:10`).

## 5. Cupo, encargos y mostrador (los choques)

| Mecanismo de hoy | Cómo choca con C6 |
|---|---|
| **Tope de 40 u/día** (`M.ganado`, `TOPE_DIA`; `cumplir`) | Ya lo comparten encargos y buzos (v12.6.3). Los **encargos de taller** (§2.6) deben pasar por el mismo tope; el **mostrador** también, para no pasar de 1.4 jornadas (§0, punto 4) |
| **Cupo del comprador** (`CUPO_DIA = 30` por pueblo+ítem; `pagarConCupo`, `cupoUsado`) | Es para lo que **vende a una tienda** (`ui.js:1385`). El mostrador no vende por ahí; usar `pagarConCupo` con la clave `mostrador:${pueblo}:${id}` evita que el mismo mueble pague 30 u por día completo |
| **`valorRef` = 0.3** para todo lo que no está en `SHOPS` | Una tabla `VALOR_PIEZA` (clavos 0.25, tabla fina 1, alacena 15…) que `valorRef` lea primero; si no, todas las piezas valen 1 u |
| **Pago máximo 100 u** (`cumplir`: `Math.min(100, …)`) | Está bien, pero cubre mal el chanchito de 140 u (§0, punto 6) |
| **`MAX_ACTIVOS = 5`** encargos | Los de taller cuentan; con 5 aceptados no se acepta otro: probarlo con el libro de encargos |
| **Plan 12-día de la fiesta (C8-B)** | «×1.5 en la fiesta patronal» exige que C8-B exista; mientras no, el multiplicador no se aplica |

## 6. Los números con `precios.js` y las tiendas de hoy

**Valor de los materiales hoy.** Las tiendas solo *compran* hierro y carbón; nadie vende ni compra tablas, troncos o barro.

| Material | Diseño (C6.2.4) | Lo que paga/cobra el juego hoy | Fuente |
|---|---|---|---|
| Hierro (258) | 3 u | **1.5 u** lo pagan (2 por 3); no se vende; `valorRef` = 1.2 | `SHOPS.pulpero.buy`, `ferretero.buy` |
| Carbón (257) | 0.5 u | **0.125 u** (8 por 1) | idem |
| Cuero (271) | 1.5 u | 1.5 u se vende (2 por 3) / 1 u se compra | `carnicero` |
| Vidrio | — | 0.5 u (8 por 4) | `pulpero`, `ferretero` |
| Teja | — | **0.31 u** (16 por 5); 8 tejas = 2.5 u | `pulpero`, `ferretero` |
| Verja de hierro | — | **0.625 u** (8 por 5) | `ferretero.sell` |
| Farol | — | **3 u** (2 por 6; en el buhonero, 1 por 14) | `pulpero`, `ferretero` |
| Antorcha | — | 0.375 u (8 por 3) | `pulpero` |
| Tronco, tabla, barro, lana, leña | 2 / 0.5 / 0.6 / — / 0.3 | **sin precio de tienda** (`valorRef` = 0.3) | `encargos2.js: valorRef` |
| Cama | — | 10 u (tienda), ancla de 50 u (`ANCLAS[89]`, `precios.js`) | `precios.js` |
| Jornada | 25 u (₡12 500) | ✔ | `precios.js`, `plata.js` |

**Piezas de herrería y de tienda, recalculadas** (`⌈1.2 × materiales + nivel⌉` con el hierro a 1.2 u y las demás cosas a lo que paga la tienda):

| Pieza | En el diseño | Recalculada | Lo que cobra la tienda hoy | Conflicto |
|---|---|---|---|---|
| Clavos ×8 (1 hierro) | 3 u | **2 u** | no se venden | — |
| Bisagras ×2 (1 hierro) | 3 u | **2 u** | no se venden | — |
| Martillo / tenazas (2 hierro + mango) | 8 u | **6 u** | no se venden | — |
| Herradura ×4 (2 hierro) | 7 u | **5 u** | no se venden | — |
| Candado (2 hierro + llave) | 9 u | **≈ 8 u** | no se vende | sin función (§0, punto 7) |
| **Verja forjada ×2** (4 hierro) | **15 u** | **≈ 9 u** | **1.25 u** por 2 | **≈ 7× la tienda** |
| **Farol forjado** (2 hierro, vidrio, antorcha) | 8 u | **≈ 8 u** | **3 u** (14 u en el buhonero) | **2.7× la tienda** |
| **Tejas ×8** (4 barro) | 5 u | **≈ 5 u** | **2.5 u** | **2× la tienda** |
| Mesa grande, alacena, mostrador, armario, puerta tallada | 13 / 15 / 10 / 18 / 10 u | sin cambio (la madera no tiene precio de tienda) | — | verificar contra la cama de 10 u |
| Chanchito | (≈ 9 u de materiales) | — | **140 u** (alfarero) | §0, punto 6 |

**Qué cambiar (propuesta):** (a) las **piezas con equivalente en tienda** (verja, farol, tejas) **no van al mostrador ni a encargos**: se hacen para uno mismo o para la casa, o se cobran a lo que cobra la tienda; (b) la «inversión inicial» de §C6.4 baja: el banco (8 tablas + 1 hierro) son ≈ 3.6 u reales y la fragua depende del precio del ladrillo (264), **por confirmar**; (c) **nanoyackson decide** si la tienda de herramientas del oficio (martillo, tenazas) se vende en una tienda o se hace a mano.

## 7. Perfil «artesano» de `bot-economia`, listo para pegar

Dos cambios en `tools/bot-economia.js`: **(1)** agregar este bloque **antes de `correr()`**; **(2)** en el arreglo `P` dentro de `correr()`, agregar `perfil('artesano', artesanoDia(false)),` (y `artesanoDia(true)` si el mostrador va dentro del tope de 40 u). Corre en el navegador, como el resto (`E.correr()`).

```js
// ---- C6 «Manos de maestro»: el perfil artesano (PREPARACION_C6.md §7). Los supuestos son 📏 a medir en tab-1 ----
Object.assign(SUPUESTOS, {
  piezasDia: 3,         // piezas que se alcanzan a hacer en un día de 20 min (con 3, el nivel 10 llega hacia el día 45)
  tallerDia: 1,         // encargos de taller (C8-A) que se cumplen por día, desde el nivel 1; pagan ×1.25 y dan el doble de XP
  mostradorVende: 5,    // 1 pieza cada ~90 s de 8 a 17 h: ≈ 450 s al día (por confirmar si los 90 s son reales)
  materialPropio: true, // la madera, el barro y el hierro se recogen: su costo es tiempo, no plata (con false: se compran)
  topeDia: 40,          // TOPE_DIA de encargos2.js: lo que pase de ahí paga el 40 %
});
const XP_NIVEL = [10, 35, 80, 150, 250, 390, 580, 830, 1150, 1550]; // XP acumulada por nivel (§0, punto 5)
const PIEZAS = [ // [nivel que la abre, materiales (u), precio (u)]: las de §2.4 con los materiales de §6
  [0, 1, 2], [0, 0.5, 1], [1, 10, 13], [2, 10, 15], [2, 7, 10], [3, 14, 18], [4, 7, 10], [4, 6, 8], [5, 7, 9],
];
// compartido = el mostrador también cuenta en el tope de 40 u (lo que se recomienda)
function artesanoDia(compartido) {
  let xp = 0; // el perfil se llama día por día, en orden: el nivel sube con lo que se fabrica
  return () => {
    const S = SUPUESTOS, nivel = XP_NIVEL.filter((n) => xp >= n).length;
    const [, mat, precio] = PIEZAS.filter(([n]) => n <= nivel).sort((a, b) => b[2] - a[2])[0]; // la de más precio que ya sabe hacer
    let hechas = S.piezasDia, ing = 0, ganado = 0;
    const taller = nivel >= 1 ? Math.min(S.tallerDia, hechas) : 0;
    for (let i = 0; i < taller; i++) { const p = precio * 1.25, lleno = Math.max(0, S.topeDia - ganado); ing += Math.min(p, lleno) + Math.max(0, p - lleno) * 0.4; ganado += p; }
    hechas -= taller;
    if (nivel >= 2) { // el mostrador: tope 10 + 4 × nivel
      let v = Math.min(Math.min(S.mostradorVende, hechas) * precio * 0.95, 10 + 4 * nivel);
      if (compartido) { const lleno = Math.max(0, S.topeDia - ganado); v = Math.min(v, lleno) + Math.max(0, v - lleno) * 0.4; }
      ing += v;
    }
    if (!S.materialPropio) ing -= S.piezasDia * mat;
    xp += taller * (2 + precio / 2) * 2 + (S.piezasDia - taller) * (2 + precio / 2);
    return ing;
  };
}
```

**Resultado de correr este mismo modelo aparte** (30 días, `piezasDia: 3`):

| Variante | Media (u/día) | Día 5 / 10 / 20 / 30 |
|---|---|---|
| Materiales propios, mostrador **aparte** del tope | 49.1 | 44.5 / 52.5 / 56.7 / 56.7 |
| Materiales propios, mostrador **dentro** del tope de 40 | 41.5 | 41.8 / 45.0 / 46.7 / 46.7 |
| Materiales **comprados**, mostrador aparte | 10.5 | 2.5 / 10.5 / 14.7 / 14.7 |

Nivel por día (materiales propios): **día 5 → nivel 3; día 10 → 5; día 20 → 7; día 30 → 9; día 45 → 10.** La meta de C5–C6 (≈ 35 u por día) se pasa; para llegar a ella hay que **bajar el techo del mostrador** a algo como `6 + 3 × nivel` (36 u en nivel 10) y/o meterlo en el tope compartido. El criterio `razon <= 1.5` de `correr()` compara tres perfiles: con el artesano (y el pescador de C5) **hay que revisar qué perfiles entran** o se queda fuera de rango (los otros ganan menos que 40 u/día; **no corrí `correr()`**: requiere el navegador).

## 8. Pruebas en tab-1

1. `npm run lint` y `npm run build` en cero avisos; `node tools/revisar-version.mjs` (firma y `MIN_IDS.version`), `node tools/revisar-ext-item.mjs`, `node tools/revisar-recetas.mjs` y `node tools/revisar-plata.mjs` en verde, con los ítems 1130–1153.
2. **Ids:** `/dar` un ítem 1130 y uno 1153, guardar, recargar, ponerlo en el cofre y en la billetera; y un mundo con el bloque 672 colocado en un juego anterior debe **negarse a abrir** (MIN_VERSION).
3. **Las tres estaciones:** poner banco, fragua y torno; abrir cada una con clic derecho; la cuadrícula acepta la receta correcta y **rechaza** la de otro oficio; `Esc` cierra sin perder los ingredientes.
4. **Leña:** la fragua gasta 1 leña por tanda (0.5 con «Movimiento tranquilo»), se queda sin leña y avisa; el horno de barro igual.
5. **Aprender:** sin el libro, la receta de nivel 1 no sale; con el libro, sí (`rec.aprende`); el nivel 0 sale sin libro.
6. **Nivel:** fabricar hasta subir de nivel 1 a 2; ver el aviso y que una receta nueva se abre; recargar y comprobar que `meta.oficios` se conserva; **importar un mundo con `xp: NaN`** y comprobar que no rompe.
7. **Calidad:** fabricar 30 piezas con nivel 5: ≈ 25 % finas (precio ×1.25 al vender); poner un mueble fino y recoger: la calidad no se pierde ni se inventa (lo que decida el punto 1 de §0).
8. **Mostrador:** poner uno en un pueblo con reputación ≥ 3 (sí) y < 3 (no); poner 3 piezas con su precio al 100 % y al 125 %; esperar 2 minutos de juego de día: se vende en cantidades razonables; **al sobrepasar el tope del día, la venta baja al 40 %**; de noche no vende.
9. **Encargos de taller:** el tablón ofrece uno de taller solo con nivel ≥ 1; se entrega y paga ×1.25; el XP es doble; cuenta dentro de los 40 u del día (con los buzos del arrecife: **ambos suman**).
10. **Regla de oro:** ninguna pieza del mostrador paga más de 1.2× lo que cuesta en tienda (verja, farol, tejas); **el chanchito no se vende ahí**.
11. **Comodidad:** con la clase nueva de artesanía, la comodidad sube **una vez** (no por cada pieza).
12. **Rendimiento:** con 3 mostradores en un pueblo cargado, el tic de 1 s no pasa de 1 ms (medidor de la barra de rendimiento).
13. **Arte:** los 13 bloques y los 24 ítems se ven en el inventario (pedido de arte a GPT para los íconos: 512×512, fondo transparente).

## 9. Orden de construcción recomendado

1. **C6-0 (0.3 versión):** ids, `oficios2.js` (nivel y `VALOR_PIEZA`), `findRecipe` generalizado y `MIN_VERSION`/`MIN_IDS`. Con una sola estación de prueba.
2. **C6a (1.2 versiones):** carpintería y alfarería (banco, torno, horno de barro, muebles y cerámica, libros y XP). Es lo que más se parece al fogón.
3. **C6b (0.8 versión):** herrería (fragua, clavos, bisagras, herraduras). **El candado y el yugo solo si nanoyackson les da una función** (§0, puntos 7 y 8).
4. **C6c (0.5 versión):** mostrador y encargos de taller (necesita `cobrarDelTope` ya extraído y el modelo de tope decidido).
5. El cayuco, aparte (depende de un vehículo nuevo).

*Escrito por la sesión investigadora, solo lectura. Decisiones que quedan para nanoyackson: la calidad en los bloques, el tope del mostrador, los niveles (10 días contra 4 para el nivel 5), qué hacen el candado y el yugo, y si las piezas con equivalente en tienda se venden.*
