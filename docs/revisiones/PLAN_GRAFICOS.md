# Plan de gráficos con niveles de calidad

Solo lectura: nada se corrió ni se midió en el navegador. Lo de **cómo dibuja hoy** sale de leer el código (con archivo y función). Lo de **costos de GPU** son **estimaciones relativas** (marcadas «≈») para ordenar prioridades: hay que medirlas con el propio juego (ver sección 5.5). Lo del ecosistema (three.js, `postprocessing`, licencias) se **verificó en la web hoy** y lleva su enlace; lo que no se pudo confirmar dice «por confirmar».

**Principio de identidad.** El objetivo es una *luz y un aire* propios: atardecer de Guanacaste, bruma de bosque nuboso, el verde del Caribe. Se usan técnicas genéricas (tonemapping, niebla, reflejos, sombras suaves), sin copiar paquetes de sombras, personajes ni arte de ningún juego. La miniatura de referencia sirve solo como brújula de *ambiente* (luz cálida baja, agua que refleja, rayos entre el follaje).

---

## 1. Cómo dibuja hoy

### 1.1 Motor y pantalla
| Dato | Valor | Dónde |
|---|---|---|
| three.js | **0.170.0** (fijada exacta en `package.json`) | `package.json` |
| Renderer | `WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' })` | `game.js`, constructor de `Game` (~línea 251) |
| Espacio de color de salida | **`LinearSRGBColorSpace`** (no hay conversión sRGB; los colores «ya vienen listos para pantalla») | `game.js` ~259 |
| Tonemapping | **Ninguno** (`renderer.toneMapping` queda en `NoToneMapping`) | — |
| Luces de three | **Ninguna** en el mundo (solo hay `HemisphereLight`/`DirectionalLight` en el vestidor y el bestiario, que tienen su propia escena) | `vestidor.js` 21–23, `bestiario.js` 77–78 |
| Sombras | **No hay** (`shadowMap` no se activa) | — |
| Postproceso | **No hay** (ni `EffectComposer`, ni render a textura) | — |
| `autoClear` | `false`; se limpia a mano y se dibujan **dos escenas**: el mundo y después la mano (`handScene`, `handCamera`) | `game.js` ~3158–3167 |
| Resolución | `renderer.setPixelRatio(settings.renderScale)` (0.5–2, es un factor sobre el tamaño CSS, no sobre el DPR) | `game.js` ~325 |
| «Brillo» de Ajustes | **Filtro CSS** sobre el canvas (`brightness()` y `contrast()`), no un uniform | `game.js` ~3034 |
| Medidor de fps | `game.fps` (contador por segundo en `main.js`) | `main.js` |

### 1.2 Luz: está «horneada» en los vértices
No hay iluminación calculada en GPU. El mallador (`mesher.js`, `buildChunkGeometry`) escribe, **por vértice**:
- **Color** = textura × `f.shade` (sombreado por cara) × **oclusión ambiental por vértice** (`AO_CURVE = [0.5, 0.68, 0.84, 1.0]`).
- **`aLight`** (dos canales): luz del cielo (altura del bloque opaco más alto por columna) y luz de lámparas/antorchas.
- **`aAnim`**: 1 = hojas, 2 = plantas, 3 = agua (olas).

El material (`world.js`, `makeMaterial`) es un **`MeshBasicMaterial`** parcheado con `onBeforeCompile`. Ahí se mezcla en el vertex shader: `uDaylight`, `uSkyColor` (color de la luz del cielo según la hora: `Game.updateLightColor`: cálido al mediodía, dorado al atardecer, azul de luna), la luz de antorcha anaranjada con **titileo** (`flick`), un pequeño aumento de saturación y los movimientos de hojas/plantas/agua (`transformed.x/z`, `waveA`). Es un buen esqueleto: **todo efecto nuevo que sea «de material» se agrega en este mismo parche**.

### 1.3 Cielo, niebla, nubes, clima
- **Cielo** (`sky.js`, `Sky`): cúpula con `ShaderMaterial` (degradado cenit→horizonte, resplandor del sol `pow(s, 6)` y `pow(s, 40)`), **sol y luna pixelados** (sprites), estrellas (`Points`), nubes **de bloque** (`CLOUD_Y = 128`, `CLOUD_CELL = 12`, 5×5 copias de una malla). Colores `DAY`, `SUNSET`, `NIGHT`. `Sky.update` calcula `daylight` y fija `renderer.setClearColor` y `fog.color` al color del horizonte.
- **Niebla**: `THREE.Fog` **lineal** (`near/far`), que `game.js` (~3110–3147) reescribe cada cuadro según distancia de visión, horizonte lejano, lluvia, agua (`near 0.5, far 14`), inframundo (humo rojizo), bosque nuboso (`mist`) y neblina del Cerro de la Muerte. Es la única «atmósfera»; **no hay niebla de altura ni dispersión hacia el sol**.
- **Lluvia/nieve** (`weather.js`): 1400 segmentos de línea y puntos; relámpagos con `flash`.
- **Terreno lejano** (`lod.js`, `lodworker.js`): baldosas de 128 bloques en baja resolución, material propio con la misma luz (`uDaylight`, `uSkyColor`), se esconde con un `discard` donde hay chunks reales.

### 1.4 Agua
`waterMat = makeMaterial({ transparent: true, opacity: 0.72, side: DoubleSide, depthWrite: false })`: **textura de agua del atlas + olas por vértice** (`aAnim > 2.5`, `sin`/`cos` sobre `wpA.x/z`) y un leve oscurecimiento por ola. **Sin reflejo, sin Fresnel, sin espuma, sin profundidad de color.** Una malla de agua por chunk (`Chunk.waterMesh`).

### 1.5 Atlas de texturas (`textures.js`, `pixelart.js`)
- **Todo es procedural:** `pixelart.js` (1507 líneas) pinta **288 baldosas de 16×16** con paletas curadas y ruido; `buildAtlas()` las pega en un `canvas` de **256 × 512** (16 columnas × 18 filas, alto potencia de 2 → 512), ≈ 0.5 MB en GPU.
- **Filtrado**: `NearestFilter` en `min` y `mag`, **`generateMipmaps = false`**, sin anisotropía. Es lo que da el look «píxel», pero **en la distancia centellea** (shimmer), sobre todo en hojas, arena y piedra.
- Los pintores usan **coordenadas absolutas de 16 px** (`t.set(x, y, …)`, `Math.floor(t.rnd() * T)` con `T = 16`): subir `T` no escala el dibujo, hay que re-pintar.
- El mismo atlas lo usan el mundo, las mallas de bloques sueltos (`models.js` 218, 239), los portones (`tileUV`), las grietas y las partículas.

### 1.6 Mallas y costos de partida
- Un **`CHUNK = 16`**, **`HEIGHT = 128`**; por chunk, **una malla opaca y una de agua**. Distancia de visión 2–12 chunks (por defecto 6 → ~169 chunks ≈ 340 llamadas de dibujo en el peor caso; a 12 llegan a ~1250). `matrixAutoUpdate = false`, culling por esfera.
- Las criaturas son **`MeshBasicMaterial` con colores por vértice** (`lowpoly.js`, `Pieza.malla`): la luz de cada modelo se aplica con `tintModel` (cambia `material.color` cada cuadro, recorriendo el grupo).

### 1.7 Personajes y modelos
| Archivo | Papel |
|---|---|
| `lowpoly.js` (`Pieza`) | Kit de geometría: `bulto`, `tubo`, y desde v10.8 **`loft`** (superficies por secciones con normales suaves y sombreado por vértice con `LUZ`/`MEDIO`). **Solo emite `position` y `color`: no hay UV ni normales en la malla.** |
| `anatomia.js` | `torsoHumano`, `brazoHumano`, `piernaHumana` (cadera, cintura, hombros, codo y rodilla articulados), `articular`, `doblarRodilla`, `doblarCodo`. |
| `personaje.js` | El tico del vestidor y del avatar: cabeza (`C.bulto`, nariz, boca, ojos), sombrero, camisa con cuadros pintados por `pinta`, jeans, botas. |
| `armadura.js` | Cascos, pecheras, grebas, botas y escudos con `loft`/`bulto`. |
| `avatar.js`, `vestidor.js` | Tercera persona (`Avatar`) y el muñeco de inventario (su propio `WebGLRenderer` con `antialias: true` y luces). |
| `modelos-gente.js`, `pueblo.js` | Vecinos (`torsoVecino`, `cabezaVecino`, `contextura(seed)`…), con gestos (`gestoVecino`). |
| `modelos-*.js` (21 archivos usan `lowpoly`) | Criaturas, jefes, leyendas, vehículos. |

### 1.8 Opciones de video que existen hoy (Ajustes, no hay pantalla «Video»)
Distancia de visión (`renderDistance` 2–12), Campo de visión (`fov` 50–110), **Brillo** (filtro CSS), **Horizonte lejano** (`farDistance` 0–1536), **Resolución** (`renderScale` 0.5–2), Pantalla completa, Balanceo y «Movimiento tranquilo». Se guardan en `localStorage` (`nanoblocks.settings`, `DEFAULT_SETTINGS` en `save.js`). No hay presets ni detección de hardware.

---

## 2. Técnicas posibles (three.js / WebGL2 sobre esta base)

**Ecosistema verificado hoy:**
- **three.js:** el proyecto usa **0.170.0**; las versiones publicadas ya llegan al menos a **0.187.0** (un espejo de unpkg lo lista; el número exacto actual está **por confirmar con `npm view three version`**). Fuentes: [registro npm](https://registry.npmjs.com/three), [unpkg three@0.187.0](https://unpkg.com/three@0.187.0/README.md). three usa versiones `0.x`: cada subida puede romper cosas; conviene **subir de versión en una fase aparte y con captura de comparación**.
- **Complementos oficiales de postproceso** (`three/addons/postprocessing/…`): existen `GTAOPass` (mejor que SSAO pero más caro), `SSAOPass`, `SMAAPass` (opera en lineal: va **antes** de `OutputPass`), `SSRPass` (SSR «básico»), `UnrealBloomPass`, `OutputPass` (tonemapping y espacio de color, **siempre el último**) y `Reflector` (reflejo plano). Fuentes: [docs de three.js](https://threejs.org/docs/), [GTAOPass](https://threejs.org/docs/pages/GTAOPass.html), [SSAOPass](https://threejs.org/docs/pages/SSAOPass.html), [SMAAPass](https://threejs.org/docs/pages/SMAAPass.html), [SSRPass](https://threejs.org/docs/pages/SSRPass.html), [manual de postproceso](https://threejs.org/manual/pages/how-to-use-post-processing.html). Un `EffectComposer` renderiza **un pase completo por efecto** (varias pasadas a pantalla completa).
- **CSM** (sombras en cascada): `three/addons/csm/CSM.js`, **solo con `WebGLRenderer`** (para WebGPU hay `CSMShadowNode`); los foros reportan fricción con materiales que no son los estándar. Fuentes: [CSM](https://threejs.org/docs/pages/CSM.html), [CSMShadowNode](https://threejs.org/docs/pages/CSMShadowNode.html).
- **Librería `postprocessing` (pmndrs):** última estable vista **6.39.x** (beta 7.0.0), fusiona varios efectos en **un solo pase** (más eficiente que apilar pases de three). El rango exacto de `peerDependencies` de `three` **no se pudo confirmar**: hay que comprobar con `npm view postprocessing peerDependencies` y probar contra la versión que se use. Fuente: [GitHub pmndrs/postprocessing](https://github.com/pmndrs/postprocessing), [README 6.39.4](https://cdn.jsdelivr.net/npm/postprocessing@6.39.4/README.md).
- **Rayos de sol:** `GodRays` de pmndrs (parte de un mesh origen; se apaga cuando el origen sale de pantalla), `three-good-godrays` (raymarching en pantalla, sobre `postprocessing`), y un `GodraysNode` solo para WebGPU/TSL. Fuentes: [three-good-godrays](https://cdn.jsdelivr.net/npm/three-good-godrays@0.12.0/README.md), [GodraysNode](https://threejs.org/docs/pages/GodraysNode.html).
- **Oclusión en pantalla:** `N8AO` (recomienda SMAA aparte porque el MSAA de hardware no funciona con AO; `N8AOPostPass` para pmndrs). Fuente: [N8AO](https://github.com/N8python/n8ao).
- **WebGPU/TSL:** existe en three, pero no se recomienda ahora para una base ya en WebGL2 con shaders parcheados (la disponibilidad varía por navegador y GPU; **por confirmar**).

### 2.0 Decisión de arquitectura (la que más pesa)
Hay **dos familias** de técnicas:

**A. «De material»** (se hacen en el mismo parche de `makeMaterial`, **sin postproceso**): tonemapping propio, corrección de color por hora, niebla de altura y dispersión solar, agua con Fresnel/reflejo falso/espuma, viento, luz de antorcha en mano, sombras por mapa de alturas. Costo bajo, **no cambian el flujo de render**, y funcionan en «Medio».

**B. «De pantalla»** (necesitan renderizar a textura con profundidad): bloom, rayos de sol, SSAO/GTAO, SMAA, reflejos planares/SSR, profundidad de campo. Exigen un **pipeline de postproceso** (`PostFX`) y tocan cómo se dibuja la mano, el agua y los efectos de pantalla.

**Recomendación:** construir **un `PostFX` propio y pequeño** (render del mundo a un `WebGLRenderTarget` `HalfFloat` con `depthTexture`, 3–4 pases: bloom por reducción, rayos de sol radiales, y un pase final que combina tonemapping + gradación + SMAA opcional), usando **los addons de three solo donde convenga** (SMAA, y GTAO/SSR para Ultra). Razones: (1) las pasadas propias comparten texturas y cuestan menos que apilar pases genéricos; (2) evita depender de una librería con rango de `three` sin confirmar; (3) el juego ya parchea shaders a mano. Si en un *spike* de 1 día la librería `postprocessing` anda bien con 0.170, es una alternativa válida para fusionar efectos.

### 2.1 Tabla de técnicas

Costo en GPU (≈, iGPU de portátil a 1080p, relativo al cuadro actual): **≈0** = despreciable, **bajo** < 0.5 ms, **medio** 0.5–2 ms, **alto** 2–5 ms, **muy alto** > 5 ms. Hay que medirlo (5.5).

| # | Técnica | Qué aporta | Costo ≈ | Archivos a tocar | Riesgos |
|---|---|---|---|---|---|
| 1 | **Tonemapping propio + exposición** (curva filmica con hombro suave sobre ~0.8, ACES o AgX) | Luces altas que no se «queman», colores del atardecer más ricos, antorchas/lava con brillo real | ≈0 (en el material) / bajo (en post) | `world.js` (`makeMaterial`), `lod.js`, `sky.js`, `game.js` (`brillo`) | Hoy la salida es lineal «ya lista para pantalla»: aplicar ACES encima **cambia todo el aspecto**. Se evita con una curva que deja intacto lo < 0.8 y solo comprime lo alto, y subiendo el nivel **solo en Medio+**. El «Brillo» pasa de filtro CSS a exposición |
| 2 | **Corrección de color por hora** (levante/ganancia, saturación, temperatura según `time`) | Es lo que más hace «hora dorada»: sombras azuladas, luces ámbar, cielo rosado | ≈0 | `world.js`, `game.js` (`updateLightColor`), `sky.js` | Mantener legible de noche y en cuevas (no oscurecer de más) |
| 3 | **Niebla de altura + dispersión solar** (exponencial; se tiñe hacia el sol cuando se mira a él; bruma por bioma con una uniform) | Profundidad, valles con bruma, halo dorado hacia el sol bajo | ≈0 | `world.js`, `lod.js` (reemplazar `fog_fragment`), `game.js` (~3110–3147: pasar a uniforms), `sky.js` | La niebla de `THREE.Fog` la reescriben ~10 sitios (agua, lava, neblina). Hay que centralizarlo en un objeto `Atmosfera` primero |
| 4 | **Cielo físico + nubes** (dispersión de Rayleigh/Mie analítica en la cúpula, disco solar, nubes 2D con ruido fractal; mantener las nubes de bloque como opción de identidad) | Atardeceres creíbles, color del horizonte coherente con la niebla | bajo (cúpula) / medio–alto (nubes volumétricas por raymarching) | `sky.js` | Las nubes de bloque son parte del estilo: dejarlas en Bajo/Medio |
| 5 | **Agua**: Fresnel + reflejo falso del cielo + brillo especular del sol + normal animada procedural + color/transparencia por profundidad + **espuma de orilla** | La mitad del «ahhh» de la referencia | ≈0–bajo | `mesher.js` (añadir atributos `aShore` y `aDepth`), `world.js` (parche del agua), `pixelart.js` (normal tileable), `lod.js` | Sin buffer de profundidad, la espuma sale del mallador (vecinos sólidos): barato y exacto en bloques |
| 5b | **Reflejo planar** (segunda pasada del mundo espejada, baja resolución, solo cuando hay agua en vista) | Reflejo real de montañas y árboles | alto (≈ + 40–80 % de la escena) | `game.js` (`render`), `world.js` | Duplica llamadas de dibujo; limitarlo a una distancia corta y a 0.5 de resolución, y solo en Alto/Ultra |
| 5c | **SSR** (`SSRPass` o propio) | Reflejos sin segunda escena | alto–muy alto | `PostFX` | Artefactos en bordes; el SSR de three es «básico»; cae al cielo si no encuentra nada |
| 6 | **Sombras suaves del sol** — ver 2.2 | Edificios, árboles y montañas proyectan sombra; mucho realismo | medio (mapa de alturas) / alto (CSM) | `mesher.js`/`world.js` (textura de alturas), `world.js` (parche) | Ver 2.2 |
| 7 | **Oclusión ambiental**: la **de vértice ya existe** (`AO_CURVE`); mejorar con AO suave entre caras (`smooth lighting`) en «Alto»; **SSAO/GTAO/N8AO** solo en «Ultra» | Contacto y rincones más ricos | ≈0 (vértice) / medio–alto (pantalla) | `mesher.js` (curva, 4 muestras por cara), `PostFX` | El MSAA no funciona con AO en pantalla (N8AO lo advierte): usar SMAA. Los vóxeles ya lucen bien con AO por vértice: **el beneficio extra de SSAO es pequeño** |
| 8 | **Bloom** (reducción en 4–5 niveles, umbral suave) | Antorchas, lava, sol y ventanas brillan | bajo–medio | `PostFX` (pase propio o `UnrealBloomPass`) | Con tonemapping lineal «ya listo» casi nada pasa del umbral: requiere que los emisores (antorchas, lava, sol) escriban **valores > 1** (HalfFloat) |
| 9 | **Rayos de sol** (dispersión radial en pantalla, a media resolución, con máscara de profundidad: cielo = fuente, bloques/hojas = oclusores) | Haces de luz entre el follaje y sobre el lago al atardecer | medio | `PostFX`, `game.js` (posición del sol en pantalla) | Se apagan si el sol sale de cuadro (usar un desvanecimiento suave); hay que decidir si cuentan nubes |
| 10 | **Hojas y pasto con viento** (fase por posición, ráfagas de ruido, el pasto se aparta del jugador con una uniform de posición) | Mundo vivo | ≈0 | `world.js` (parche `aAnim`), `mesher.js` | Hoy ya hay oscilación (`aAnim 1/2`); es una mejora, no una novedad |
| 11 | **Luz de antorchas**: bloom + halo + luz dinámica de **una** antorcha (la de la mano/avatar) como uniform con caída `1/d²` | La antorcha en mano ilumina el entorno al caminar | ≈0 | `world.js`, `game.js` | La luz «horneada» del mundo no cambia; solo se suma la de la mano |
| 12 | **Profundidad de campo** (solo modo foto) | Retratos con fondo desenfocado | medio (solo en foto) | `foto.js`, `PostFX` (`BokehPass` o propio) | Solo activo en modo foto: sin costo en juego |
| 13 | **SMAA / suavizado de bordes** | Bordes sin dientes de sierra | bajo | `PostFX` (`SMAAPass`), o MSAA del framebuffer (`antialias: true`) hoy desactivado | En Bajo no se activa; MSAA en iGPU cuesta caro |
| 14 | **Resolución dinámica** (`renderScale` automático) | Mantiene fps sin tocar efectos | negativo (ahorra) | `game.js` | Ya existe `renderScale`; falta el control automático |

### 2.2 Sombras: la opción propia para vóxeles
**Problema:** `MeshBasicMaterial` **no recibe sombras de three**; hacer sombras en cascada exige cambiar el material, el pase de profundidad por todos los chunks (varias veces), y cuidar el «peter-panning». Es la opción más cara.

**Opción recomendada, de bajo costo y propia del juego: sombras por mapa de alturas.** El mallador ya conoce «la altura del bloque opaco más alto por columna» (para la luz del cielo). Se guarda esa altura en una **textura de alturas del mundo cercano** (por ejemplo 512×512 columnas alrededor del jugador, `R16F`, se actualiza por chunk al mallar). En el *fragment shader*, para cada punto se **marcha 8–12 pasos hacia el sol** comparando la altura del terreno/edificio con la altura del rayo: si la columna lo supera, está en sombra; la **penumbra** sale de cuánto lo supera. Produce sombras suaves de montañas, árboles y casas, **sin pase de profundidad y sin cambiar materiales**. Limitaciones: no da sombras de voladizos y cuevas (eso lo sigue haciendo la luz del cielo horneada) ni de criaturas (se agrega un óvalo bajo cada una). Es el equivalente a «luz de cielo por columna», solo que con dirección. ≈ costo medio, **solo en Alto/Ultra**.

**Opción alternativa (Ultra):** CSM de three con un material parcheado que lea el mapa de sombras. Más realista y más caro; **no recomendado** como primer paso.

---

## 3. Texturas HD

### 3.1 El problema de partida
El atlas es 16×16 procedural, `NearestFilter` y **sin mipmaps**: a distancia centellea; de cerca se ve «pixel». Antes de pensar en HD hay que decidir **qué estética se quiere**: *pixel nítido* (identidad actual) o *pintado a mano en alta*. Propuesta: **ambas**, como paquetes seleccionables.

### 3.2 Primero lo barato (Fase 1): nitidez sin cambiar el arte
Con el mismo atlas de 16 px:
1. **Muestreo «bilineal nítido»** en el fragment shader (se conserva el píxel duro, pero los bordes entre texeles se suavizan y no centellean): `uv' = (floor(uv * N) + 0.5 + clamp((fract(uv * N) − 0.5) / fwidth(uv * N) , −0.5, 0.5)) / N`.
2. **Mipmaps manuales de 3–4 niveles** y **anisotropía** 4–8: con `NearestFilter` en `mag` y `LinearMipmapLinear` en `min`.
3. **Márgenes (gutter) de 2–4 px** copiados con el contorno «que da la vuelta» (los pintores ya son enrollables: `Tile.set` hace `% T`) para que los mipmaps no mezclen baldosas vecinas.
   - *Alternativa:* un **array de texturas** (`sampler2DArray`, una capa por baldosa): sin sangrado por diseño y escala limpia, pero exige que el mallador emita `layer` y tocar todos los usuarios de `tileUV` y `atlasTexture` (mundo, portones, partículas, modelos): **más invasivo**.

### 3.3 Paquete HD (32 × 32, 64 × 64 y 128 × 128)
Como los pintores no escalan, hay **tres rutas combinables**:
| Ruta | Cómo | Pros | Contras |
|---|---|---|---|
| **A. Reescalado + detalle** (`tools/atlas-hd.mjs`) | Escalar la baldosa de 16 con un filtro que respeta aristas (scale2x/EPX u otro) y sumar **detalle fino procedural** (ruido de alta frecuencia por material) | Cero arte nuevo; mantiene el diseño | Es «más fino», no «más dibujado» |
| **B. Redibujar con IA en local** (como ya hace con los íconos de ítems: hojas de 8×8, `tools/cortar-hojas.mjs`) | Un prompt por hoja con las baldosas (288) → PNG por clave en `src/assets/tiles/<clave>.png`; el constructor del atlas usa la imagen si existe y, si no, la escalada de la ruta A | Identidad propia y coherente; ya existe el flujo | Hay que revisar cada baldosa tileable; las bordes deben calzar |
| **C. CC0 realista** | Texturas **PBR** de [ambientCG](https://docs.ambientcg.com/license) y [Poly Haven](https://polyhaven.com/license), bajadas a 64–128 y estilizadas (posterizar/pintar encima) | Detalle y mapas de normales/rugosidad **reales** | Fotorrealistas: **chocan con el estilo tico**; solo para pasto, piedra, tierra, arena y madera, y como base para pintar encima |

**Licencias (verificado hoy):** **ambientCG** publica todo bajo **CC0** («libertad casi ilimitada»); **Poly Haven** indica que todos sus assets son **CC0** (equivalente a dominio público); la única condición práctica es **no declararse autor original ni re-licenciarlas**. **Kenney** declara sus juegos de assets como CC0 (revisar cada paquete). Aun así, las guías externas recomiendan **leer la licencia de cada recurso concreto** antes de incluirlo; guardar en `CREDITS` el enlace y la fecha. Fuentes: [ambientCG: licencia](https://docs.ambientcg.com/license), [Poly Haven: licencia](https://polyhaven.com/license), [Kenney: soporte](https://kenney.nl/support).

**Mapas de normales y rugosidad opcionales.** No hace falta dibujarlos: un script de construcción (`tools/mapas-normales.mjs`) deriva el **normal** desde la luminancia de cada baldosa (filtro Sobel) y una **rugosidad** por material (piedra/madera/arena/agua). En el shader el mundo sigue **sin luces de three**: el normal sirve para modular el color con el **sol y el cielo** (`dot(N, sunDir)`), lo que da relieve a la piedra y al pasto sin pasar a un material PBR. Para armar la base tangente basta un atributo `aCara` (0–5) que el mallador ya conoce por cara: el shader reconstruye el TBN de una tabla constante.

### 3.4 Memoria por nivel (RGBA8; ~+33 % con mipmaps; ~+25 % con márgenes)
| Resolución de baldosa | Atlas | Albedo | + mipmaps y márgenes | + normal y rugosidad |
|---|---|---|---|---|
| **16** (hoy) | 256 × 512 | 0.5 MB | — (sin mipmaps) | — |
| **32** | 512 × 1024 | 2 MB | ≈ 3.3 MB | ≈ 8–10 MB |
| **64** | 1024 × 2048 | 8 MB | ≈ 13 MB | ≈ 35–40 MB |
| **128** | 2048 × 4096 | 32 MB | ≈ 53 MB | ≈ 140–160 MB |

Con **compresión** (`KTX2Loader`: BC7/ASTC con Basis) esas cifras bajan 4–6 veces, a costa de un paso de construcción y del transcodificador. Para este juego, **64 con normales** (~40 MB sin comprimir) es un techo razonable para Ultra; 128 solo con compresión. Hay que comprobar `renderer.capabilities.maxTextureSize` (4096 es seguro; 8192 en casi todas las de escritorio).

### 3.5 Cargar paquetes según la calidad
- Estructura: `src/assets/tiles/16|32|64/…` (o archivos `atlas-32.webp`, `atlas-64.webp`, `normal-64.webp`).
- `buildAtlas(res)` recibe la resolución y **cambia el contenido de `atlasTexture` en su sitio** (`image` y `needsUpdate`): como el mundo, los modelos, los portones y las grietas ya guardan una referencia a ese mismo objeto (`textures.js`), **no hay que reasignar materiales**. El diseño de UV no cambia (mismo orden de baldosas) → **no hay que remallar**.
- El paquete se baja la primera vez que se elige (los PNG van como archivos aparte, como ya hace `vite.config.js` con los íconos) y se guarda en caché del navegador.

---

## 4. Personajes con más detalle

### 4.1 Lo que se puede subir
Hoy la figura humana es un **loft sombreado por vértice** (`anatomia.js`) con cabeza de `bulto`, nariz y boca de `tubo`, **ojos fijos** y pelo/sombrero de `bulto`. **No hay UV** (`Pieza.malla` solo emite `position` y `color`) y todo lo pinta `pinta(u)` por color de vértice.

| Mejora | Cómo | Esfuerzo | Notas |
|---|---|---|---|
| **Ojos que parpadean y miran** | Ojos como grupo propio (`esclera` + `pupila` + **párpado** que escala en `y`); parpadeo cada 3–6 s con un temporizador por criatura; la pupila sigue la cabeza (`headYaw`/`headPitch`, que ya existen) | **S** | Las Sombras ya tienen `eyes.scale.y` para parpadear; es el mismo patrón |
| **Expresiones** (neutro, habla, dolor, alegría, sueño, comer) | **Morph targets** (`BufferGeometry.morphAttributes`) de boca y cejas, o 3 mallas intercambiables; `m.data.talk`, `hurtT`, `g.eating` y `lying` ya dicen cuándo | **M** | Sube el «encanto»: la gente habla (hoy solo mueve la mano) |
| **Piel con textura** (poros, pecas, sol) | (a) **más pintura por vértice** con más `lados/pasos` en Alto/Ultra; (b) **UV cilíndricas** en `loft` (`u.a` y `u.t` ya existen) + una textura de piel de 128 px | **M** | (a) no requiere UV; (b) abre la puerta al resto |
| **Ropa con pliegues** | (a) **geometría**: ruido en `rx/rz` de las secciones y `pliegue` en `tubo` (ya existe) con más segmentos; (b) **normal map** cilíndrico de tela con el sol propio del shader | **M–L** | Necesita UV (3.2) y un material propio para personajes (sol + cielo + normal) |
| **Pelo** | Mechones como `tubo` finos con degradado (50–200 en Ultra), o **tarjetas** con alfa y viento; el sombrero ya cubre muchas cabezas | **M** | Solo en Ultra y solo cerca (LOD) |
| **Manos y dedos** | Los dedos ya existen en `brazoHumano`; falta agarrar objetos (pose de la mano) | **S–M** | Ya hay `armarBrazoMano` en primera persona |

### 4.2 Rendimiento con muchos vecinos (LOD)
Un vecino ronda los **6–10 mil triángulos** (torso `loft` 24×3×10, brazos, piernas, cabeza); con 30 en una plaza son ~300 mil, hoy sin LOD (se descartan solo a > 96 bloques).
1. **LOD de geometría por distancia**: tres niveles que **comparten el mismo esqueleto de grupos** (cabeza, brazos, piernas): `completo` (≤ 14 bloques), `medio` (14–36: la mitad de lados/pasos, sin pelo ni dedos) y `lejano` (36–80: un solo `loft` por miembro con 8 lados, sin cara). Se **cambia `mesh.geometry`** (no se recrea el árbol) con histéresis para evitar parpadeo.
2. **Compartir geometrías**: construir una vez por `(rol, apariencia, contextura)` y reutilizar (los vecinos con la misma semilla lucen igual).
3. **Frecuencia de trabajo por distancia**: `tintModel` y las poses (`poseGolpe`, `doblarRodilla`, respiración) cada 2–4 cuadros cuando están lejos o fuera de cámara (hoy `Mob.update` hace todo cada cuadro).
4. **Nivel «Bajo»**: sin ojos que parpadeen, sin expresiones, sin pelo; LOD «medio» desde 8 bloques. **Igual o más liviano que hoy.**

---

## 5. Niveles de calidad

### 5.1 Qué activa cada uno
✅ = activo · ◐ = versión reducida · — = apagado.

| Característica | **Bajo** (= hoy) | **Medio** | **Alto** | **Ultra** |
|---|---|---|---|---|
| Postproceso (render a textura) | — | — | ✅ | ✅ |
| Filtrado de texturas | Nearest, sin mipmaps (**igual que hoy**) | Bilineal nítido + mipmaps + anisotropía 4 | + anisotropía 8 | + anisotropía 16 |
| Resolución de baldosas | 16 | 32 | 64 | 64 + normales (128 si hay compresión) |
| Tonemapping + gradación por hora | — | ✅ (en el material) | ✅ | ✅ (ACES/AgX) |
| Niebla de altura y dispersión solar | — (niebla lineal de hoy) | ✅ | ✅ | ✅ + bruma por bioma |
| Cielo | Cúpula de hoy | Cúpula mejorada (Rayleigh/Mie) | + nubes 2D | + nubes volumétricas |
| Agua | Como hoy | Fresnel + reflejo falso + espuma | + color por profundidad, brillo del sol | Reflejo **planar** (o SSR) |
| Bloom | — | — | ✅ ligero | ✅ completo |
| Rayos de sol | — | — | ✅ (media res.) | ✅ (res. mayor) |
| Sombras del sol | — | — | ◐ (mapa de alturas, 8 pasos) | ✅ (12 pasos + criaturas) |
| Oclusión ambiental | De vértice (hoy) | De vértice mejorada | De vértice mejorada | + SSAO/GTAO |
| Suavizado de bordes | — | — | SMAA | SMAA |
| Hojas/pasto con viento | Como hoy | ✅ (ráfagas + pasto que se aparta) | ✅ | ✅ |
| Luz de antorcha en mano | — | ✅ | ✅ | ✅ |
| Personajes | Como hoy | Ojos que parpadean | + expresiones y LOD | + pelo, pliegues, piel |
| Profundidad de campo | — | — | — | Solo en modo foto |
| Resolución (`renderScale`) | 1.0 (o 0.75 en iGPU antiguas) | 1.0 | 1.0 | 1.0–1.25 |
| Distancia de visión sugerida | 6 | 8 | 10 | 12 |
| Costo relativo ≈ (hoy = 1.0) | **≤ 1.0** | ≈ 1.15–1.3 | ≈ 1.8–2.5 | ≈ 3–5 |

**«Personalizado»**: cada fila es un interruptor/deslizador propio; al tocar uno el nivel pasa a «Personalizado».

**Regla de oro:** **Bajo no puede costar más que hoy**. Todo lo nuevo vive detrás de una bandera y, apagado, el *shader* ni siquiera lo compila (`#define`s en `onBeforeCompile`), de modo que Bajo ejecuta el mismo código de hoy.

### 5.2 Detección automática al primer arranque
Se combinan tres señales (de menor a mayor confianza); resultado: un nivel inicial **y nunca más alto que Alto sin prueba**:
1. **Información de WebGL (instantánea):** `WEBGL_debug_renderer_info` → `UNMASKED_RENDERER_WEBGL` (cadenas como «Intel(R) UHD», «Iris», «Apple M», «NVIDIA», «Radeon», «Adreno»), `capabilities.maxTextureSize`, soporte de `EXT_color_buffer_half_float`/`float` (necesario para HDR), `navigator.hardwareConcurrency`, `navigator.deviceMemory`, `devicePixelRatio` y tamaño de pantalla.
2. **Prueba corta (2–3 s):** durante la pantalla de carga (el mundo ya se genera ahí) se renderiza la escena inicial en **Medio** midiendo la mediana del tiempo de cuadro (`performance.now()`; opcionalmente `EXT_disjoint_timer_query_webgl2` para GPU pura). Si la mediana es < 14 ms sube un nivel (hasta Alto), si > 24 ms baja uno.
3. **Lista conocida:** una tabla pequeña por familia de GPU como valor inicial razonable (iGPU antigua → Bajo; iGPU moderna → Medio; dedicada → Alto).

Se **guarda** en `settings.calidad = 'auto'` con `calidadElegida`; el jugador puede fijar cualquier nivel.

### 5.3 Bajar solo si los fps caen (regulador)
- Se vigila `game.fps` (ya existe) con una ventana de 5 s: si el promedio está por debajo de **40 fps** (o 70 % de la meta) dos ventanas seguidas, se actúa en este orden: **1) resolución dinámica** (`renderScale` de 1.0 → 0.85 → 0.7), **2)** apagar lo más caro (reflejo planar → rayos → sombras → bloom), **3)** bajar el nivel completo. Con histéresis: solo se sube de nuevo tras 60 s estables, y **nunca más de una vez por minuto**.
- Se avisa con un aviso breve («Bajé a Medio para mantener los fps») y se puede desactivar con «Calidad automática».
- No actúa en pausa, en pantalla de carga ni en modo foto.

### 5.4 Pantalla «Opciones de video»
Una hoja nueva (separada de los demás Ajustes, que ya son 20 controles): *Calidad* (Auto/Bajo/Medio/Alto/Ultra/Personalizado), *Resolución* (`renderScale`), *Distancia de visión*, *Horizonte lejano*, *Texturas* (16/32/64), *Sombras*, *Reflejos del agua*, *Rayos de sol*, *Bloom*, *Suavizado*, *Calidad de personajes*, *Viento*, *Exposición* (reemplaza el «Brillo» de filtro CSS) y el medidor de fps. Debe seguir los criterios de la auditoría de pantallas (agrupar en secciones, «Listo» fijo, `aria-label`, sin tuteo ni voseo).

### 5.5 Cómo medir
Una **superposición de depuración** (`?perf` o F3): fps, ms por cuadro, `renderer.info.render.calls` y `.triangles`, memoria de texturas (`renderer.info.memory`) y, si el navegador la ofrece, el tiempo de GPU con `EXT_disjoint_timer_query_webgl2`. Sin eso, los costos de la tabla anterior son ordenamientos, no promesas.

---

## 6. Plan por fases

Ordenadas por **impacto visual / esfuerzo**. Tamaños: **S** ≈ 2–3 días · **M** ≈ 1–2 semanas · **L** ≈ 2–4 semanas de trabajo concentrado.

| Fase | Entrega | Tamaño | Impacto | Riesgos |
|---|---|---|---|---|
| **0. Infraestructura** | Objeto `Atmosfera` (niebla, colores, hora) que reemplaza los ~10 sitios que tocan `scene.fog`; `settings.calidad` y las banderas de calidad; `#define`s en `makeMaterial`; superposición `?perf` | **S** | — (habilita todo) | Mínimo |
| **★ 1. Nitidez de texturas** | Muestreo bilineal nítido + mipmaps manuales + márgenes + anisotropía; opción MSAA/SMAA | **S** | **Alto**: se acaba el centelleo a distancia y se ve «cuidado» sin cambiar el estilo | Sangrado entre baldosas (se resuelve con márgenes) |
| **★ 2. Atmósfera «de material»** | Tonemapping propio y gradación por hora; niebla de altura + dispersión solar; bruma por bioma; cúpula de cielo mejorada | **S–M** | **Muy alto**: es la «hora dorada» | Que no cambie el look de Bajo (se prueba con la captura) |
| **★ 3. Agua** | Fresnel, reflejo falso del cielo, brillo del sol, normal animada, color por profundidad y **espuma de orilla** desde el mallador; cascadas con bruma | **M** | **Muy alto**: el lago y la cascada de la referencia | Atributos nuevos en `mesher.js` (compatibles con el formato actual: son de render, no de guardado) |
| **★ 4. Postproceso (`PostFX`) + bloom + rayos de sol + SMAA** | RT HalfFloat con profundidad; bloom; rayos radiales; pase final de color; la mano se dibuja después; efectos de agua/lava integrados | **M–L** | **Alto**: luz cálida, antorchas que brillan, haces de luz | Mano, agua y lava (hoy filtros CSS y escenas separadas); `postprocessing` vs pases propios (spike de 1 día) |
| 5. Sombras suaves por mapa de alturas | Textura de alturas + marcha hacia el sol en el shader; óvalo bajo las criaturas | **M–L** | **Alto** | Memoria y actualización de la textura al mallar |
| 6. Texturas HD | `tools/atlas-hd.mjs`, normales derivadas, paquetes 32/64, carga por calidad; luego redibujado con IA por hojas | **M** | Medio–alto | Coherencia de estilo; tamaño de descarga |
| 7. Personajes | Ojos, expresiones, LOD, y luego piel/pliegues/pelo | **M** | Medio (alto en cercanía) | UV en `loft`; mantener fps con vecinos |
| 8. Ultra | Reflejo planar o SSR, SSAO/GTAO, nubes volumétricas, DoF en modo foto | **L** | Medio | Costo; mantenerlo opcional |
| 9. Detección automática y regulador | Secciones 5.2 y 5.3 | **S–M** | (calidad de vida) | Falsos positivos de detección |
| 10. Subir three.js | De 0.170.0 a la versión estable actual, con la captura de comparación | **S–M** | — | Roturas entre versiones menores |

**Las 4 que haría primero (★):** (1) nitidez de texturas, (2) atmósfera «de material», (3) agua, (4) postproceso con bloom y rayos de sol. Juntas producen el aspecto de la referencia (luz cálida baja, agua que refleja, haces de luz) **sin tocar el estilo de los bloques**. La fase 0 va por delante (es corta). Las sombras (5) y el paquete de texturas (6) son las siguientes por impacto.

### Qué probar primero con una captura de antes y después
Mismo mundo (semilla fija), misma cámara en **modo foto**, `g.time ≈ 0.46` (atardecer; en la consola: `window.nanoblocks.game.time = 0.46`), mirando a un lago con árboles y el sol bajo a un lado. **Tres capturas por fase** (Bajo, Medio, Alto):
1. **Fase 2 (atmósfera):** es la que más cambia la foto con menos código: conviene validar **primero** si el aspecto gusta antes de invertir en lo demás.
2. **Fase 3 (agua):** cambia el elemento principal de la referencia; probar de día y al atardecer, con y sin viento.
3. **Fase 4 (bloom + rayos):** probar con el sol **dentro y fuera** del cuadro (los rayos se apagan si sale) y una antorcha de noche.
4. **Fase 1 (nitidez):** capturas a 30–60 bloques de distancia sobre hojas y arena (donde hoy centellea) y a 1 bloque (de cerca).

En cada captura: anotar fps y ms por cuadro con la superposición `?perf` en una laptop modesta y en una máquina buena.

---

## Resumen corto

1. **Hoy:** three 0.170.0, `MeshBasicMaterial` con **luz horneada por vértice**, salida lineal sin tonemapping, **sin luces, sombras ni postproceso**, niebla lineal, agua de textura con olas de vértice, atlas procedural **16×16 con `NearestFilter` y sin mipmaps**, personajes de `loft` sin UV.
2. **Camino:** efectos «de material» (tonemapping, hora dorada, niebla de altura, agua con Fresnel y espuma) **sin postproceso**, y un `PostFX` propio (bloom, rayos de sol, SMAA) para Alto/Ultra; sombras por mapa de alturas (barato y propio de vóxeles) en vez de CSM.
3. **Texturas:** primero **nitidez** con el atlas de hoy; luego paquetes 32/64 reescalados + detalle procedural y, si nanoyackson quiere, redibujados con IA como los íconos. CC0 real (ambientCG, Poly Haven) solo como base de materiales realistas.
4. **Niveles:** Bajo (= hoy, nada nuevo se ejecuta) / Medio / Alto / Ultra / Personalizado, con detección por info de WebGL y prueba corta, y un regulador que baja primero la resolución y después los efectos más caros.
5. **Primeras 4:** nitidez de texturas, atmósfera, agua y postproceso; probar **primero la atmósfera** con una captura de atardecer.

**Fuentes verificadas hoy:** [three en npm](https://registry.npmjs.com/three) · [three@0.187.0](https://unpkg.com/three@0.187.0/README.md) · [docs de three.js](https://threejs.org/docs/) · [GTAOPass](https://threejs.org/docs/pages/GTAOPass.html) · [SSAOPass](https://threejs.org/docs/pages/SSAOPass.html) · [SMAAPass](https://threejs.org/docs/pages/SMAAPass.html) · [SSRPass](https://threejs.org/docs/pages/SSRPass.html) · [CSM](https://threejs.org/docs/pages/CSM.html) · [pmndrs/postprocessing](https://github.com/pmndrs/postprocessing) · [three-good-godrays](https://cdn.jsdelivr.net/npm/three-good-godrays@0.12.0/README.md) · [N8AO](https://github.com/N8python/n8ao) · [ambientCG: licencia](https://docs.ambientcg.com/license) · [Poly Haven: licencia](https://polyhaven.com/license) · [Kenney](https://kenney.nl/support).
