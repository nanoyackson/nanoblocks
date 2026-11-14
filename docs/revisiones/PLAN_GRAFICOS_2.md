# Plan de gráficos 2: lo que falta después de «Hora dorada»

Sesión investigadora, **solo lectura**. Continúa `PLAN_GRAFICOS.md` (fases 0 y ★2 ya hechas en v12.0.0–v12.1.1). **No se corrió el juego ni se midió nada en el navegador:** lo que dice «hoy» sale de leer `src/` (con archivo y función) y todo costo en ms es una **estimación («≈») para ordenar el trabajo**, no una promesa. Para medir está la § 1 (el medidor y un protocolo que no depende del panel visible).

**Regla de oro (sigue igual):** Bajo no puede costar más que hoy. Todo lo nuevo va detrás de una bandera y, apagado, el shader ni siquiera lo compila.

---

## 0. Qué hay hoy en `src/` (verificado leyendo el código)

| Pieza | Estado | Dónde |
|---|---|---|
| Niveles y banderas | **Hecho** para 4 efectos: `tono`, `niebla`, `cielo`, `bruma`. Bajo = ninguno; Medio = tono+niebla+cielo; Alto = + bruma; **Ultra = igual que Alto** (el comentario lo dice: «crecerá con el agua, el postproceso y las sombras») | `atmosfera.js: FLAGS`, `flagsDe`, `definesDe`, `aplicarDefines` |
| Cómo se activan en el shader | `#define ATMOS_TONO/NIEBLA/CIELO` por material; la clave de caché del shader lleva el nombre del material y las banderas | `atmosfera.js: aplicarDefines`; se llama cada cuadro desde `game.js` (≈ 3276) para `opaqueMat`, `waterMat`, `far.mat`, `sky.domeMat`, `sky.cloudMat` |
| Uniformes compartidas (sol, tinte, niebla, bruma) | **Hecho** (`uSunDir`, `uSunCol`, `uHora`, `uNiebla`, `uBruma`…) y `actualizarAtmosfera` las llena cada cuadro | `atmosfera.js: ATMOS`, `actualizarAtmosfera` |
| Cielo | Cúpula (`ShaderMaterial`) con halo del sol y nubes **de bloque** (`CLOUD_Y = 128`) | `sky.js: Sky`, `Sky.update` |
| Agua | **Sin cambios:** `makeMaterial({ transparent: true, opacity: 0.72, side: DoubleSide, depthWrite: false })`, olas por vértice con `aAnim > 2.5`, una malla por chunk | `world.js: makeMaterial`, `World` (constructor, ≈ 95); `mesher.js: buildChunkGeometry` (rama `r === 4`, ≈ 305–335) |
| Postproceso | **No existe.** El cuadro son tres `renderer.render` seguidos: `farScene` (cielo + horizonte, cámara con near 60), se borra la profundidad, `scene` (lo cercano) y `handScene` (la mano) | `game.js: render` (≈ 3283–3308) |
| Sombras | **No hay.** `MeshBasicMaterial` con luz horneada por vértice (`aLight`) | `world.js: makeMaterial`; el mallador ya calcula la altura del bloque opaco más alto por columna (`HM`, para la luz del cielo) en `mesher.js` ≈ 205 |
| Filtrado de texturas | Sin cambios: `NearestFilter` y sin mipmaps (la «Fase 1 nitidez» del plan **no se hizo**) | `textures.js` 23–25 |
| Regulador de calidad | **No hay.** Solo hay un aviso **una vez**: si en Medio o más va a < 40 fps durante 10 s, el Locutor sugiere Bajo (`avisoFpsDado`) | `ui.js` ≈ 2722–2736 |
| Panel de fps | `fps · ms · calidad` (casilla «Mostrar fps y milisegundos por cuadro»). **Ojo: `ms` es solo CPU** (lo que tarda `game.update`, incluido el *envío* del dibujo, no la GPU) | `main.js` (`game.msCuadro`), `ui.js` ≈ 2738, `index.html` `#s-perf` |
| `renderScale` | `renderer.setPixelRatio(settings.renderScale)` (0.5–2); el deslizador ya existe (`#s-scale`) | `game.js` ≈ 335, `ui.js` ≈ 2715 |
| Detección de GPU | No existe | — |

**Dos cosas que cambian el plan respecto de `PLAN_GRAFICOS.md`:**
1. `uBrillo` ya es una uniforme de los materiales (`brillo.js`), **no** un filtro CSS: el «Brillo» no estorba al postproceso.
2. El mallador **corre en el hilo principal** (`world.js` ≈ 435, no hay worker de bloques; solo `lodworker.js` para el horizonte). Todo cálculo extra por chunk (espuma, alturas de sombra) suma a `msCuadro`.

---

## 1. Primero, poder medir (costo 0 ms, es el requisito de todo lo demás)

El panel de hoy **no ve la GPU**: un efecto que cuesta 3 ms de GPU no mueve `msCuadro`, y `game.fps` se queda pegado al *vsync* (60/120/144) hasta que se cae. Hay que agregar:

| Qué | Cambio concreto | Costo |
|---|---|---|
| **`gpu X ms`** en el panel | En `Game.render` (`game.js` ≈ 3283–3308) envolver los tres `renderer.render` en una consulta `EXT_disjoint_timer_query_webgl2` (`gl.getExtension`), promedio de los últimos 60 resultados; si la extensión no existe (Safari, Firefox por defecto) mostrar «gpu —». Mostrarlo en `ui.js` ≈ 2738 | ≈ 0.01 ms |
| **Llamadas y triángulos** | `renderer.info.render.calls` y `.triangles`, y `renderer.info.memory.textures/geometries` en el mismo texto (`ui.js` ≈ 2738) | 0 |
| **Prueba de costo que no depende de `requestAnimationFrame`** | Función de consola `window.nanoblocks.costo(clave)`: congela `game.update`, fija la cámara, y para «sin/con» la bandera mide `N = 120` llamadas seguidas a `game.render(0)` terminando con `gl.finish()` (o una lectura de 1 píxel para forzar la espera); devuelve ms/cuadro y el Δ. **Funciona con el panel oculto** (el `CLAUDE.md` avisa que con el panel oculto `requestAnimationFrame` no corre) y sin el tope del *vsync* | 0 en juego |
| **Amplificador de píxeles** (para quien solo tenga el panel) | `renderScale = 2` (4× los píxeles) hace que todo efecto «de píxeles» se note en `fps`: costo a 1× ≈ `(1/fps_con − 1/fps_sin) / 4` | 0 |

**Protocolo único (mismo para todo lo que sigue):** semilla fija, cámara fija en modo foto, `window.nanoblocks.game.time = 0.46` (atardecer) y tres escenas: **A** un lago con árboles y el sol bajo; **B** bosque denso al mediodía; **C** pueblo de noche con antorchas y lava. Para cada nivel (Bajo, Medio, Alto, Ultra) y cada bandera suelta (casillas de «Opciones de video», que pasan a Personalizado): anotar `fps`, `msCuadro`, `gpu`, `calls`, `triangles` en **dos máquinas** (una laptop modesta con iGPU y una con tarjeta). Un efecto **pasa** si su Δ medido ≤ la estimación de la tabla (§ 8) y no causa tirones de > 50 ms en 60 s de caminata.

---

## 2. El orden propuesto (menor costo y mayor efecto primero)

| # | Entrega | Efecto visual | Costo ≈ (iGPU / tarjeta, 1080p) | Esfuerzo | Depende de |
|---|---|---|---|---|---|
| **1** | **Medidor de GPU + `costo()`** (§ 1) | — (habilita medir) | ≈ 0 | S | — |
| **2** | **Regulador automático** (§ 3) | Mantiene los fps: sin él, Alto y Ultra son riesgo | negativo (ahorra) | S–M | 1 |
| **3** | **Agua «de material»** en Medio/Alto (§ 4): Fresnel, cielo reflejado, brillo del sol, color por profundidad, espuma de orilla | **Muy alto** (es el elemento de la referencia) | **0.15–0.4 / 0.03–0.1** | M | — |
| **4** | **PostFX base + bloom** (§ 5) | Alto: antorchas, lava, sol y ventanas brillan | base **1.0–1.8 / 0.2–0.4** + bloom **0.8–1.6 / 0.15–0.3** | M–L | 1, 2 |
| **5** | **Rayos de luz** (§ 6) | Alto: haces entre el follaje y sobre el lago | **0.5–1.0 / 0.1–0.2** | S (sobre el 4) | 4 |
| **6** | **Reflejo barato y refracción** (§ 4.2) | Alto: el lago refleja cielo y montañas y deforma el fondo | **0.1–0.3 / 0.05** (espejo) + **0.1–0.3** (refracción) | M | 3, 4 |
| **7** | **Sombras del sol por mapa de alturas** (§ 7) | **Alto:** montañas, casas y árboles proyectan sombra | **0.9–1.8 / 0.2–0.5** (8 pasos) | M–L | 1, 2 |
| **8** | **Ultra** (§ 8): reflejo planar real, GTAO, nubes volumétricas | Medio | **+8 a +14 / +2 a +4** | L | 3–7 |

*Además, fuera de la lista pedida pero casi gratis:* la **nitidez de texturas** (Fase 1 de `PLAN_GRAFICOS.md`, no hecha: `textures.js` 23–25) cuesta ≈ 0.05–0.2 ms y quita el centelleo a distancia, que el aire nuevo hace más visible. Va entre el 2 y el 3 si nanoyackson lo quiere.

---

## 3. Regulador automático de calidad

**Hoy:** solo el aviso de `ui.js` ≈ 2722–2736. **Meta:** un módulo `src/regulador.js` que se llama desde `main.js: frame` (después de `game.update`) y reemplaza ese aviso.

**Cambio concreto:**
1. **Medir con el intervalo real entre cuadros**, no con `game.fps` (entero y pegado al vsync) ni con el `dt` ya recortado a 0.05 (`main.js`): guardar `now − last` crudo en una ventana de 120 cuadros y usar la **mediana** (p50) y el p95. Descartar los cuadros de más de 250 ms (carga de chunks, pestaña oculta) y todo mientras `ui.state !== 'playing'`, en pausa, en modo foto o en la pantalla de carga (`ui.listoDesde` ya existe).
2. **Criterio:** si el p50 de una ventana de 5 s está por debajo del 70 % de la meta (la meta = el *refresh* medido, tope 60) **dos ventanas seguidas**, bajar un escalón. Para subir: 60 s estables por encima del 95 % de la meta, y nunca más de **un cambio por minuto** (histéresis).
3. **Escalones, en este orden:** (1) **resolución dinámica** con un factor propio `escalaAuto` (1 → 0.85 → 0.7) que **multiplica** a `settings.renderScale` sin pisarlo; (2) apagar lo más caro en este orden: reflejo planar (Ultra) → sombras → rayos → bloom → suavizado → refracción; (3) bajar el nivel completo (Ultra → Alto → Medio; **nunca a Bajo solo**: Bajo lo decide el jugador). Cada cambio de `renderScale` llama a `game.resize()` (reasigna el búfer: tirón de 10–40 ms), por eso son pocos escalones y con histéresis.
4. **Aviso:** un solo toast corto por bajada («Bajé las sombras para mantener los fps»), como `consejo` con clave `regulador:baja` (para que el Locutor no lo repita); casilla «Calidad automática» (nueva `settings.calidadAuto`, en `DEFAULT_SETTINGS`, `save.js`) y que tocar a mano cualquier control la apague.
5. **Detección inicial** (más adelante, ya con el regulador): `WEBGL_debug_renderer_info` + `hardwareConcurrency` + `maxTextureSize` y una prueba de 2–3 s durante la pantalla de carga con `costo()` (§ 1).

**Costo:** ≈ 0.01 ms de CPU. **Cómo medirlo con el panel:** poner `renderScale` en 2 (fps bajo a propósito) y comprobar que el regulador baja `escalaAuto` y los fps suben a la meta sin oscilar; que **no** actúa en pausa; que tras 60 s estables sube un escalón y no baja de inmediato.

---

## 4. Agua

### 4.1 «De material» (Medio y Alto): Fresnel, cielo, sol, profundidad y espuma

Todo en el parche del agua; **sin postproceso y sin textura extra**.

**Cambios concretos:**
1. **`world.js: makeMaterial` (o un parche aparte sobre `waterMat`)**, activado por una bandera nueva `agua` → `#define ATMOS_AGUA` (agregarla en `atmosfera.js: FLAGS`, `NOMBRE_FLAG`, `definesDe`, y a la lista `for (const k of [...])` de `aplicarDefines`; aplicar las banderas de agua **solo** a `waterMat` para no recompilar los otros materiales).
2. **Fresnel sin normales:** la malla no las emite, pero las caras de agua son casi todas «de arriba»: `vec3 V = normalize(cameraPosition - vAtmosWP); float F = pow(1.0 - clamp(V.y, 0.0, 1.0), 3.0);` (`vAtmosWP` ya existe en `parcheAtmos`, pero solo se declara con `ATMOS_NIEBLA` o `ATMOS_TONO`: en Medio y Alto lo están; si se deja la bandera `agua` sola en Personalizado, hay que declararlo también bajo `ATMOS_AGUA`). Normal **procedural** animada: `n = normalize(vec3(sin(p.x*0.9+uTime*1.1)*0.06, 1.0, cos(p.z*0.8+uTime)*0.06))`.
3. **Cielo reflejado:** `R = reflect(-V, n)`; color = `mix(uCieloHoriz, uCieloCenit, smoothstep(0.0, 0.8, R.y))` con **dos uniformes nuevas** que `Sky.update` (`sky.js` ≈ 236–260) ya conoce (los colores del horizonte y del cenit de la cúpula) y deja en `ATMOS`. Brillo del sol: `pow(max(dot(R, uSunDir), 0.0), 220.0) * uSunCol * 1.5` (`uSunDir` y `uSunCol` ya existen en `ATMOS`). El color final: `mix(agua, reflejo, F * 0.65)`.
3. **Color por profundidad (la «refracción barata» de Medio):** la opacidad y el tinte suben con la profundidad (orilla clara 0.5 → fondo oscuro 0.9; turquesa en el Caribe y azul en el Pacífico con la `uBruma` que ya guarda el bioma). Necesita un dato por vértice: **`mesher.js: buildChunkGeometry`**, rama `r === 4`: ya recorre las 4 celdas de cada esquina (`cornerH`); contar las celdas de agua hacia abajo hasta tocar suelo (tope 6) es ≈ 6 lecturas por cara de agua.
4. **Espuma de orilla (gratis en memoria):** en la misma rama, marcar una esquina como «orilla» si **alguna** de las celdas que la comparten es sólida (`SOLID[id2]`, ya se lee). Empaquetarlo **dentro de `aAnim`** como fracción (`aAnim = base + 0.25 * orilla`, con `base ∈ {0, 3}`): los umbrales actuales del vértice (`aAnim > 0.5 && aAnim < 2.5` hojas y plantas; `aAnim > 2.5` olas) **no cambian**; el fragmento lee `fract(aAnim) > 0.1`. Así no hace falta un atributo nuevo ni más memoria. La profundidad (punto 3) sí necesita su propio canal (`aAgua`, +4 bytes por vértice de agua: unos 0.3 MB por cada 80 000 vértices de agua) o un segundo empaque en `aAnim`: **decidir al implementar**.
5. **Debajo del agua:** con la cámara por debajo de la superficie (`cameraPosition.y < vAtmosWP.y`) el Fresnel y el reflejo se apagan (hoy se ve plano: `ui.setUnderwater` y la niebla corta `near 0.5, far 14`).
6. **El agua lejana** (`lod.js`, mismo `uDaylight/uSkyColor`) usa el mismo parche con bandera propia: **por confirmar** cómo dibuja hoy el mar lejano.

| Nivel | Qué lleva | Costo ≈ iGPU / tarjeta |
|---|---|---|
| Medio | Fresnel + cielo reflejado + sol + profundidad + espuma | 0.15–0.4 / 0.03–0.1 |
| Alto | + normal con dos octavas y espuma que se mueve | +0.1–0.2 / +0.03 |

**Cómo medirlo:** escena A, mirando al lago de frente, a 1× y a `renderScale` 2; Δ con la casilla `agua` apagada (Personalizado). Revisar aparte `msCuadro` (el mallado del chunk con agua sube ≈ 0.05–0.1 ms por chunk con agua: está en el hilo principal).

### 4.2 Reflejo y refracción «baratos» de más nivel (Alto)

- **Espejo barato (reflejo real del cielo, las nubes y las montañas lejanas):** una segunda pasada **solo de `farScene`** (cielo, nubes y horizonte; no hay chunks) con la cámara reflejada respecto del plano del agua, a una textura de **256×128**, **una vez cada 3 cuadros**. El plano es el nivel del mar (`SEA = 62`) por defecto; si el jugador está junto a otro lago (lago de montaña) se toma la altura del agua más cercana (**por confirmar** que baste con eso). `Game.render` ya construye `farScene` y `farCam` (≈ 3285): la cámara reflejada reutiliza el mismo código. El fragmento del agua mezcla esa textura por `F` en vez del color analítico de § 4.1. Costo ≈ **0.1–0.25 iGPU / 0.05 tarjeta** (repartido entre cuadros). **No** refleja árboles ni casas cercanas: eso es el reflejo planar de Ultra.
- **Refracción real (el fondo se deforma):** requiere el color de la escena opaca como textura. Dos caminos: (a) sin PostFX, `renderer.copyFramebufferToTexture` justo antes de pintar el agua (≈ 0.4–0.9 iGPU / 0.1–0.2 tarjeta, **solo cuando el agua ocupe > 5 % de la pantalla**); (b) con el PostFX del § 5, el agua se dibuja **después** de volcar la escena opaca al RT y lo lee gratis. Recomiendo (b); desplazamiento = `n.xz * 0.015 / distancia`, apagado cerca de la orilla (para no muestrear píxeles que están **delante** del agua: se necesita la profundidad, que el RT del § 5 ya tiene).

**Cómo medirlo:** igual que 4.1 más escena A con la cámara mirando de lado al agua (peor caso para el espejo) y con tormenta (el espejo se apaga cuando `weather.intensity > 0.5`).

---

## 5. Postproceso propio (`PostFX`) y bloom

**Por qué un `PostFX` propio y no `EffectComposer`:** el cuadro de hoy ya son tres pasadas con `clearDepth` en medio (`game.js` ≈ 3283–3308) y la mano se dibuja al final; un propio pequeño las respeta y comparte texturas entre bloom, rayos y suavizado.

**Cambios concretos:**
1. **`src/postfx.js` (nuevo)**: crea `WebGLRenderTarget` con `type: HalfFloatType` y `depthTexture` (si falta `EXT_color_buffer_float` / `EXT_color_buffer_half_float`: usar `RGBA8` y bloom sin HDR). `Game.render`: `renderer.setRenderTarget(rt)` antes de `farScene` y `scene`; después, `PostFX.render()` vuelca a pantalla con un pase final; **la mano (`handScene`) se dibuja después, directo a pantalla**, igual que hoy (sin bloom ni suavizado: a propósito).
2. **Emisores por encima de 1:** con `#define POST_HDR`, `world.js: makeMaterial` deja que las antorchas (`aLight.y`), la lava y el sol pasen de 1.0 (hoy se recorta en `clamp(L, …, vec3(1.15))`, ≈ línea 52) y **el hombro suave de `GLSL_GRADO` (`atmosfera.js` ≈ 44) pasa al pase final** (si no, comprime los emisores antes del bloom).
3. **Bloom por reducción** (5 niveles, umbral suave en 1.05): `postfx.js` hace 5 reducciones y 4 sumas; sin atributos nuevos en la malla.
4. **Bandera `bloom`** (Alto: ligero, 4 niveles; Ultra: completo, 5) y **`postfx`** implícita si alguna de `bloom/rayos/suavizado/sombras?` la pide. En Bajo y Medio **no se crea** el RT.
5. **Variante barata para Medio (sin RT):** «halos» aditivos: un `InstancedMesh` de sprites con textura radial suave sobre antorchas, lámparas y lava cercanas (≤ 64), que parpadean con el mismo `flick` del shader. ≈ 0.05–0.2 ms. **Por confirmar** si nanoyackson prefiere eso a no tener nada en Medio.
6. **Suavizado (SMAA)** va en este mismo `PostFX` para Alto/Ultra: ≈ 0.6–1.2 iGPU / 0.1–0.25 tarjeta; el MSAA de hardware no se usa (los bordes del RT con `samples` en iGPU salen caros).

| Pieza | Costo ≈ iGPU / tarjeta |
|---|---|
| RT HalfFloat + pase final (vuelco, hombro, gradación) | 1.0–1.8 / 0.2–0.4 |
| Bloom ligero (Alto) | 0.6–1.2 / 0.1–0.2 |
| Bloom completo (Ultra) | 0.8–1.6 / 0.15–0.3 |
| SMAA | 0.6–1.2 / 0.1–0.25 |

**Cómo medirlo:** escena C (antorchas y lava de noche); casillas `bloom` y `suavizado` sueltas con `costo('bloom')`. El **vuelco al RT** se mide apagando todo lo demás: así se ve lo que cuesta «tener» el postproceso aunque no haga nada, que es lo que más sorprende en iGPU. Vigilar la **memoria** (`renderer.info.memory`): un RT de 1080p en RGBA16F son 16 MB (+ profundidad + mips del bloom ≈ 25 MB).

---

## 6. Rayos de luz

**Cambios concretos (sobre el `PostFX` del § 5; sin él no hay rayos):**
1. Pase radial a **¼ de resolución** (24 muestras) desde la posición del sol en pantalla (`ATMOS.uSunDir` proyectado con la cámara).
2. **Máscara de fuente:** píxeles de **cielo** (profundidad = 1) **y brillantes** (luma > ≈ 0.7). OJO: hoy, entre `farScene` y `scene` se hace `clearDepth`, así que la profundidad del RT **no distingue cielo de montaña lejana** (ambos quedan en 1): la luminancia lo resuelve de manera aproximada (las montañas son más oscuras que el halo del sol). **Por confirmar con captura**; si hay fuga de luz por las montañas, escribir además un canal «cielo» en el pase lejano.
3. **Se apagan** (con desvanecimiento suave): si el sol sale del cuadro, de noche, en cuevas (`g.env.cave`), bajo el agua, en el inframundo y con lluvia (`weather.intensity > 0.5`); y se **cargan** con la hora dorada (`ATMOS.uHora.x`) y la niebla (`uNiebla`): al mediodía casi nada.
4. Bandera `rayos` (Alto: media resolución ¼; Ultra: ½).

**Costo ≈ 0.5–1.0 iGPU / 0.1–0.2 tarjeta.** **Cómo medirlo:** escena A con el sol **dentro y fuera** del cuadro (el costo se va a cero al apagarse) y escena B bajo el follaje.
**Alternativa sin RT para Medio:** «haces de mentira»: 20–40 planos aditivos con textura de franja, mirando a la cámara, repartidos entre los árboles cuando el sol está bajo; ≈ 0.1–0.3 ms y sin oclusión real (**por confirmar** si se ve bien con las hojas de bloque).

---

## 7. Sombras del sol por mapa de alturas (la opción propia para vóxeles)

**Por qué esta:** `MeshBasicMaterial` no recibe sombras de three, y un mapa de profundidad en cascada obligaría a dibujar los chunks varias veces. El mallador **ya** calcula la altura del bloque opaco más alto por columna (`HM` en `buildChunkGeometry`, `mesher.js` ≈ 205): es justo el dato necesario.

**Cambios concretos:**
1. **Textura de alturas «con vuelta»:** `RG16F` de **512×512** columnas (1 MB), direccionada por `x mod 512, z mod 512` (no hay que re-centrarla al caminar). Canal R = altura del bloque **opaco** más alto; canal G = altura del **follaje** (`leafy`, hojas de bloque, que dan sombra a medias). `mesher.js: buildChunkGeometry` ya tiene `HM`: devolver además una copia de 16×16 por chunk (con el follaje aparte) y que `world.js` la suba con `texSubImage2D` (≈ 0.02 ms por chunk). **Por confirmar** si `OPAQUE` incluye hojas: hoy se usa para la luz del cielo, que sí atraviesa las hojas; el canal G hay que calcularlo con `leafy`.
2. **Shader (`ATMOS_SOMBRA`):** por cada píxel opaco, marchar **8** pasos (Alto) o **12** (Ultra) hacia el sol (`uSunDir`), de 2 a 4 bloques cada uno, hasta ≈ 48 bloques; sombra = `max` de cuánto supera la columna al rayo; la **penumbra** sale de esa diferencia. Se aplica **solo al componente directo del cielo** (`skyL * (0.65 + 0.35 * sombra)`): lo bajo techo y las cuevas ya lo resuelve la luz horneada.
3. **Rango y desvanecimiento:** solo a ≤ 96 bloques del jugador (más allá, sin sombra: ahorra costo y evita bordes); con el sol a menos de ≈ 3° sobre el horizonte, la sombra se desvanece a la luz plana de hoy (si no, las sombras serían infinitas).
4. **Criaturas:** un óvalo oscuro bajo cada una (`InstancedMesh`, una sola llamada; ≤ 20 cercanas en Alto, ≤ 40 en Ultra).
5. **Bandera `sombras`** (Alto: 8 pasos sin criaturas lejanas; Ultra: 12 pasos). No hay `SAVE_FORMAT`: es solo de dibujo.

**Limitaciones (decirlo en la ayuda):** no da sombras de voladizos ni de interiores (eso lo sigue haciendo la luz horneada), ni de las nubes.

**Costo ≈ iGPU / tarjeta:** Alto (8 pasos) **0.9–1.8 / 0.2–0.5**; Ultra (12 pasos + criaturas) **1.4–2.6 / 0.3–0.7**; CPU ≈ 0.02 ms por chunk mallado; memoria 1 MB.
**Cómo medirlo:** escena B (bosque) y A (lago con montañas) con el sol bajo: el peor caso son pixeles opacos a pantalla completa (mirar al suelo); `costo('sombras')` y `renderScale` 2. Revisar a ojo el «peter-panning» (sombra desprendida) y el borde de los 96 bloques.

---

## 8. Ultra y el presupuesto por nivel

**Lo que hoy falta de Ultra** (hoy = Alto): en orden de efecto/costo:

| Pieza | Para qué | Costo ≈ iGPU / tarjeta | Nota |
|---|---|---|---|
| Sombras con 12 pasos + criaturas | más fina | +0.5–0.8 / +0.1–0.2 | ya en § 7 |
| **Reflejo planar real** del agua cercana (segunda pasada del mundo espejada, **a media resolución, solo chunks a ≤ 3 de distancia** y solo si el agua ocupa pantalla) | árboles y casas se reflejan | **2.5–5 / 0.6–1.5** (CPU +1–3 ms: otra vez el recorrido y el envío) | el panel **sí** ve la parte de CPU en `msCuadro` |
| **Texturas de 64 con normales** (`PLAN_GRAFICOS.md` § 3) | detalle de cerca | ≈ 0 ms, **~40 MB de memoria** | decisión de estilo de nanoyackson |
| **Nubes volumétricas** a ¼ de resolución | cielo más rico | 2–4 / 0.5–1 | las nubes de bloque son parte de la identidad: dejarlas como opción |
| **GTAO** | contacto y rincones | 3–5 / 0.7–1.2 | **último:** el AO por vértice ya existe y lo que aporta es poco en vóxeles |
| Profundidad de campo | solo modo foto | 0 en juego | — |

**Presupuesto por nivel** (extra sobre Bajo = hoy; cada línea es lo **nuevo** de este plan, suma acumulada):

| Nivel | Qué suma de este plan | Δ ≈ iGPU / tarjeta (ms) | Comentario |
|---|---|---|---|
| **Bajo** | nada | **0** | igual que hoy (regla de oro) |
| **Medio** | agua de material (§ 4.1) + halos (§ 5.5, opcional) | **+0.2 a +0.6 / +0.05 a +0.15** | cabe en cualquier iGPU |
| **Alto** | + PostFX con bloom, SMAA, rayos, espejo barato, refracción, sombras de 8 pasos, agua Alto | **+4.3 a +8.6 / +0.9 a +1.9** | pensado para tarjeta o iGPU moderna (Iris Xe, M1); el regulador lo baja si no da |
| **Ultra** | + planar real, sombras de 12 pasos, GTAO, nubes volumétricas | **+13 a +23 / +3 a +6** | solo tarjeta; con regulador |

Coherente con el multiplicador de `PLAN_GRAFICOS.md` (Alto ≈ 1.8–2.5× y Ultra ≈ 3–5× el cuadro de hoy): **por confirmar** midiendo el cuadro de Bajo en el equipo de nanoyackson (la base real de ms de la que parten esos porcentajes **no se conoce**).

---

## 9. Riesgos y decisiones para nanoyackson

1. **El orden entre el agua y el postproceso:** el agua de material (§ 4.1) no depende de nada; la refracción y los rayos sí dependen del `PostFX`. Si `PostFX` se retrasa, 4.1 + regulador + sombras se pueden entregar solos.
2. **El hombro suave** de `atmosfera.js` tiene que moverse al pase final cuando exista el postproceso; si se olvida, el bloom casi no se nota.
3. **La mano** se dibuja al final y sin efectos (decisión: pierde bloom; gana nitidez).
4. **Hojas de bloque y sombras:** las copas hacen sombras muy oscuras si cuentan como sólidas; el canal G (follaje a media sombra) evita bosques negros. Probar con la escena B.
5. **three.js 0.170.0:** `PLAN_GRAFICOS.md` § 10 sugiere subir la versión; **no es necesario** para nada de esto (todo se hace con `WebGLRenderTarget`, `copyFramebufferToTexture` y shaders propios).
6. **Configuración:** las banderas nuevas son `agua`, `bloom`, `rayos`, `sombras`, `suavizado`, `reflejo`; se agregan en `atmosfera.js: FLAGS / NOMBRE_FLAG`, en la lista de `ui.js` ≈ 2719 y en las casillas `#s-v-*` de `index.html`. Son ajustes del navegador (`settings`), **no** del mundo: no hay `SAVE_FORMAT` ni `MIN_VERSION` en juego.
7. **Documentar al entregar:** `ARBOL_CONOCIMIENTO.md` (módulos nuevos `postfx.js` y `regulador.js`), `CHANGELOG`, y una captura de cada escena en `docs/capturas/<versión>/` en Bajo, Medio y Alto.

*Escrito por la sesión investigadora. Solo lectura: no se corrió el juego; los costos en ms son estimaciones («≈») a medir con la § 1; lo marcado «por confirmar» depende de una captura o de leer más código.*
