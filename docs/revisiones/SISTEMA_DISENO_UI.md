# Sistema de diseño de la interfaz nueva (encargo 16)

Para que las maquetas **A «vidrio»** y **B «minimal grafito»** salgan coherentes en todas las pantallas. Estado base: `v11.12.0`. **Solo diseño**: no se tocó código. Lo medido (contrastes) salió de un script (`contraste.mjs`, fórmula WCAG 2.1) y no de la vista; lo que depende de verlo corriendo va marcado «📏 ver en la maqueta».

**Lo que dijo nanoyackson, traducido a reglas** (se usan abajo como criterio de cada decisión):

1. «Más opciones, más confuso» → **a la vista solo lo que se usa cada minuto**; el resto va a un «⋯», a un atajo o a un tooltip. Meta: **la mitad de botones visibles**.
2. «Las categorías las quería para las RECETAS, no para el inventario» → **el inventario pierde las 9 pestañas y el selector de orden**; **las recetas ganan los filtros por categoría** (patrón 4.1).
3. «Moderno, tecnológico, clean y smooth» → un solo lenguaje: **poco color, mucho aire, bordes finos, movimiento corto y suave**, tipografía sans con números tabulares.

---

## 1. Inventario de pantallas y paneles

Cuentas hechas sobre `index.html`, `src/ui.js` y `src/style.css` (v11.12.0). «Visibles» = controles que el jugador ve sin hacer nada más (botones, pestañas, selectores, casillas de opción; **no** cuenta casillas de objetos ni la hoja de teclas).

| Pantalla | Qué hay hoy | Visibles hoy | Qué sobra o se esconde | Acción principal | Visibles meta |
|---|---|---:|---|---|---:|
| **Inventario** (`#screen-inventory`, `buildStationArea`, `armarFiltros`) | Personaje + muñeco que gira, 9 pestañas de categoría con contador, buscador, selector «Ordenar: …» (4 órdenes), 3 botones («Ordenar», «A cofres cercanos», «Traer receta»), cuadrícula 27 + barra rápida 9, billetera, panel de recetas a la derecha | **≈ 17** (9 pestañas + buscador + selector + 3 botones + 3 de la billetera) | **Fuera:** las 9 pestañas y el selector de orden (se piden para recetas, no aquí). **Al «⋯»:** «A cofres cercanos», «Traer receta» (ya vive mejor en el recetario: ver 3.4), los 4 órdenes. **Atajo:** `/` o Ctrl+F para buscar (ya existe; el campo se **colapsa a una lupa** y se expande al tocarla), `R` = ordenar (ver 4.2). **Tooltip:** la ayuda de cada botón | **Mover y equipar** (arrastrar) | **≈ 4**: lupa, «Ordenar», «⋯» y el botón de la billetera |
| **Mesa de crafteo / cocina** (`station.type` `crafting`/`cooking`; `craft-area`) | Cuadrícula 3×3 (o 2×2), flecha, resultado, y todo lo del inventario abajo | 0 botones propios (+ lo del inventario) | La nota «(mesa 3×3)/(2×2 — las grandes piden mesa)» pasa a **chip discreto** junto al título; «A cofres cercanos»/«Traer receta» al «⋯» | **Poner ingredientes y recoger el resultado**; mejor aún, **clic en una receta del recetario llena la cuadrícula** (ya existe) | **≈ 3** |
| **Recetario** (`#craft-panel`, `#craft-list`, `#craft-buscar`, `renderRecetas` ≈ línea 2269) | Buscador de receta/ingrediente + una lista larga y plana con ingredientes en iconos; «Clic derecho: fijar la receta» como **texto fijo** debajo del buscador | **1** buscador (pero una lista de cientos de filas) | **Ganar:** fila de **chips de categoría** + chip «Puedo hacer» (patrón 4.1). **Quitar de la vista:** el texto «Clic derecho…» → **tooltip** al pasar sobre una receta y en el «⋯» de la receta (fijar 📌) | **Elegir una receta** (clic = llenar la cuadrícula o crearla) | **≈ 7 chips + buscador** (los chips son *filtros*, no botones de acción) |
| **Cofres** (`station.type === 'chest'`, 27 casillas) | Barra de 5 botones: «Sacar todo», «Depositar todo», «Guardar lo que ya hay aquí», «Ordenar», «Ordenar la casa» + la cuadrícula del cofre + todo el inventario | **5 + los del inventario** | **Visibles:** «Sacar todo» y «Depositar todo» (las dos acciones comunes). **Al «⋯»:** «Guardar lo que ya hay aquí», «Ordenar», «Ordenar la casa». **Atajo:** Shift+clic mueve una casilla al otro lado (ya existe); `R` ordena | **Mover cosas entre cofre e inventario** | **2 + «⋯»** |
| **Baúl grande** (54 casillas) | Lo mismo que el cofre con el doble de casillas | igual | Igual que el cofre; **la cuadrícula del baúl con scroll interno** si no cabe (la casilla no se encoge por debajo de 34 px: ver 2.5) | igual | **2 + «⋯»** |
| **Horno** (`furnace`) | Entrada, llama, combustible, flecha de progreso, resultado | 0 propios | Nada que quitar. **Añadir:** una línea de **estado** («Fundiendo: 6 s») en lugar de un botón | **Poner material y combustible** | **0** |
| **Tienda** (`#screen-shop`) | Título, fila de moneda con **3 botones** («Pedir fiado (10 colones)», «Cambiar plata: a billetes», «A monedas»), 2 columnas Comprar/Vender, pista de teclas | **3** (+ filas de productos) | **Al «⋯» del encabezado:** «Pedir fiado» y los dos cambios (son raros); **chip** con el saldo y la deuda. **Pista inferior** (`.shop-hint`) → **tooltip del «?»** | **Comprar** (clic; Shift = ×5) | **1 («⋯»)** |
| **Billetera** (HUD `#billetera-hud` + `#inv-billetera`) | En el HUD, un texto con el total; en el inventario, una fila de piezas (billetes y monedas) | 1 texto + piezas | Una sola **píldora** en el HUD (ícono de moneda + total; nunca el desglose); el **desglose** solo en el inventario y **plegado** | **Ver cuánto tengo** (solo lectura) | **1** |
| **Libreta** (`#screen-libreta`, `.lib-tabs`) | **10 pestañas** con emoji + atajo: Ayuda (Y), Partida, Álbum (I), Mañas (U), Cartas (C), Logros (L), Habilidades (H), Bestiario (K), Diario (N), «Lo que se dijo» | **10** | **Agrupar en 4** y esconder el resto en «Más ▾»: **Partida** (Partida + Logros + Habilidades), **Colección** (Álbum + Bestiario), **Diario** (Diario + Cartas + Mañas), **Ayuda** (Ayuda + «Lo que se dijo»). Los atajos por letra **se conservan** (Y/I/U/C/L/H/K/N) y se muestran en el tooltip, no en la pestaña | **Leer** | **4 pestañas** (sub-pestañas de segundo nivel solo dentro de cada una) |
| **Mapa** (`#screen-map`) | Lienzo + una línea de **7 instrucciones** en texto (`.shop-hint`) | 0 botones, **1 párrafo largo** | Las instrucciones pasan a un **«?»** con tooltip y a un panel de teclas; solo se queda a la vista «Esc: cerrar» | **Mirar y marcar destino** | **0–1** («?») |
| **Ajustes** (`#screen-settings`) | **21 controles** en una columna: 8 deslizadores (distancia, FOV, sensibilidad, volumen, música, brillo, horizonte, resolución), 11 casillas, 3 selectores + hoja de teclas | **≈ 22** | **Partir en 4 pestañas** (**Juego**, **Video**, **Audio**, **Controles**) con **un solo grupo visible** a la vez: ≈ 6 controles por pestaña. **Esconder en «Avanzado» (plegado):** horizonte, resolución, pantalla completa, avisos y lectura. Cada ajuste con **una línea de ayuda gris** (no en negrita) en lugar de paréntesis largos en la etiqueta | **Ajustar y «Listo»** | **≈ 6** por pestaña |
| **Pausa** (`#screen-pause`) | 5 botones: «Volver al juego», «Guardar ahora», «Ayuda (Y)», «Ajustes», «Guardar y salir al menú» + info | **5** | **Visibles: 3** («Continuar», «Ajustes», «Guardar y salir»). **Al «⋯»/atajo:** «Guardar ahora» (el juego ya guarda solo; mostrar «💾 Guardado hace 2 min» como texto), «Ayuda» (`Y`) | **Continuar** | **3** |
| **Muerte** (`#screen-dead`) | Título, causa, consejo, 2 botones | **2** | Nada (ya es mínima). Solo **calmar** el rojo: viñeta oscura en vez de pantalla roja plena | **Reaparecer** | **2** |
| **Menú principal** (`#screen-menu`) | Logo, frase aleatoria, 3 botones (Un jugador, Novedades, Ajustes), versión | **3** | **«Novedades» baja a un enlace pequeño** (insignia «nuevo» si hay) junto a la versión | **Un jugador** | **2 + enlace** |
| **Mundos / mundo nuevo** (`#screen-worlds`, `#screen-new`) | Lista de mundos con botones por mundo, «Crear mundo nuevo», «Importar mundo», «Volver»; formulario con 5 campos | **3 + N por mundo** | «Importar mundo» y los botones por mundo (renombrar, exportar, borrar) **al «⋯» de cada mundo**; el formulario: nombre, semilla y modo a la vista; **dificultad en un selector segmentado de 3 opciones** | **Jugar** el mundo / **Crear** | **2 + «⋯»** |
| **HUD** (`#hud`, 30+ elementos) | Mira, brújula, mapa pequeño, barra rápida (9), corazones, hambre, sed, aire, armadura, estamina, XP, jefe, avisos, subtítulos, billetera, misión, objetivo, receta fija, reloj, «Guardado», efectos, versión, línea de comandos | **≈ 12 a la vez** en un momento normal | **Una jerarquía en tres capas** (4.5): **siempre** (mira, barra rápida, vida, hambre), **por contexto** (aire solo bajo el agua, estamina solo al gastarla, jefe solo con jefe, XP solo al ganar), **a pedido** (reloj, mirando, objetivo, brújula: ya existen como opciones en Ajustes). Las barras se agrupan en **un bloque a la izquierda de la barra rápida**, no repartidas | **Mirar el mundo** | **≈ 4 fijos** |

**Total de controles visibles** (sin contar el HUD): hoy **≈ 80**, con la meta **≈ 35** (**−55 %**, cumple la meta de la mitad). El mayor ahorro está en Inventario (17 → 4), Ajustes (22 → 6 por pestaña) y Libreta (10 → 4).

**Reglas de decisión, para no discutir caso por caso:**

- **A la vista** si se usa **más de una vez por sesión corta** (mover, comprar, continuar).
- **Al «⋯»** si se usa a veces o es de gestión (ordenar la casa, importar).
- **Atajo + tooltip** si es de experto (Shift+clic, `/`, fijar con clic derecho).
- **Nunca un texto de instrucciones largo en pantalla**: la instrucción es un **tooltip** o el **«?»** del encabezado.

---

## 2. Tokens

Los dos estilos **comparten estructura y nombres**; solo cambian los valores. Así una pantalla escrita con `var(--…)` sirve para A y B y se puede **cambiar de maqueta con una sola clase en `<body>`** (`ui-vidrio` / `ui-grafito`), que también deja a nanoyackson probar las dos sin tocar nada más.

### 2.1 Colores

| Token | **A «vidrio»** | **B «grafito»** | Uso |
|---|---|---|---|
| `--bg` (fondo de pantalla) | mundo desenfocado + velo `rgba(6,9,16,.55)` | `#14161a` sólido (en pantallas completas) o velo `rgba(10,11,14,.72)` sobre el mundo | detrás de los paneles |
| `--surface` (panel) | `rgba(11,15,23,.88)` + desenfoque | `#1c1f25` | cuerpo del panel |
| `--surface-2` (elevado: casilla, chip, campo) | `rgba(255,255,255,.06)` | `#262a32` | lo que está dentro del panel |
| `--surface-3` (hover/activo) | `rgba(255,255,255,.12)` | `#313640` | estado hover |
| `--border` | `rgba(255,255,255,.14)` | `#3a404c` | borde fino de 1 px |
| `--border-strong` | `rgba(255,255,255,.28)` | `#6b7585` | casilla, campo (3:1 como borde de control) |
| `--text` | `#f2f5fa` | `#eceef2` | texto principal |
| `--text-soft` | `#b4bdcc` | `#9aa3b2` | etiquetas, ayudas |
| `--accent` | `#63cdff` (cian) | `#3dd6c4` (turquesa) | selección, foco, botón primario |
| `--on-accent` | `#06121c` | `#071412` | texto sobre el acento |
| `--danger` | `#ff8f8f` | `#ff8080` | borrar, vida baja |
| `--success` | `#6ee59a` | `#6ee7a0` | «puedo hacer», guardado |
| `--warn` | `#ffd166` | `#ffd166` | moneda, aviso |

**Categoría** (para el filtro del recetario y el subrayado de la casilla; mismos valores en A y B, por brillo): herramientas `#ff9f5a`, armadura `#7fb2ff`, comida `#ff7f7f`, minerales `#c9a0ff`, madera `#d9a86c`, tierra y piedra `#b7a58a`, plantas `#6ee7a0`, construcción `#8fd3e8`, varios `#aab4c4`. **Rareza** (si nanoyackson la quiere más adelante): común `#aab4c4`, poco común `#6ee7a0`, raro `#7fb2ff`, épico `#c9a0ff`, legendario `#ffd166`. **Regla:** el color de categoría **nunca va solo**: siempre con su nombre o ícono (daltonismo).

**Contraste calculado** (WCAG 2.1; texto normal ≥ 4.5:1, bordes de control ≥ 3:1). Para A se calculó **en el peor caso: el mundo detrás es casi blanco (`#e8f0ff`, un cielo de día)**, que es lo que rompe los paneles de vidrio:

| Dirección | Par | Razón | |
|---|---|---:|---|
| A | texto `#f2f5fa` sobre el panel (mundo claro / negro) | **13.15 / 17.78** | ✅ |
| A | texto suave `#b4bdcc` (claro / negro) | **7.59 / 10.26** | ✅ |
| A | acento `#63cdff` | **8.01** | ✅ |
| A | éxito `#6ee59a` / peligro `#ff8f8f` / aviso `#ffd166` | **9.1 / 6.6 / 10.0** | ✅ |
| A | texto `#06121c` sobre botón primario | **10.05** | ✅ |
| A | `#fff` sobre casilla seleccionada `#1f6f9e` | **5.49** | ✅ |
| A | las 9 categorías sobre el panel | **5.88 a 9.31** (mínimo: comida) | ✅ |
| B | texto sobre fondo / superficie / elevada | **15.59 / 14.21 / 12.39** | ✅ |
| B | texto suave `#9aa3b2` sobre superficie / elevada | **6.49 / 5.66** | ✅ |
| B | acento `#3dd6c4` sobre superficie; `#071412` sobre el acento | **9.13; 10.39** | ✅ |
| B | éxito / peligro / aviso sobre superficie | **10.69 / 6.80 / 11.45** | ✅ |
| B | borde de control `#6b7585` sobre superficie (3:1) | **3.54** | ✅ |
| B | las 9 categorías y las 5 rarezas sobre superficie | **6.76 a 11.45** | ✅ |

**Hallazgo importante:** la primera versión del vidrio (`rgba(18,22,32,.72)`) **falló** sobre un cielo claro: el texto suave daba **3.69** y el peligro **3.05**, y seis de las nueve categorías no llegaban. Por eso el panel de vidrio es **`rgba(11,15,23,.88)`**, es decir, bastante opaco; el «vidrio» lo da el **desenfoque y el borde de luz**, no la transparencia. Quien ajuste la maqueta **no debe bajar de ≈ .85 de opacidad** sin volver a calcular.

### 2.2 Radios, espaciado, sombras, desenfoque

| Token | A «vidrio» | B «grafito» |
|---|---|---|
| `--r-panel` | 16 px | 10 px |
| `--r-ctrl` (botón, campo, chip) | 10 px | 8 px |
| `--r-slot` (casilla) | 10 px | 6 px |
| `--r-pill` (chip, billetera) | 999 px | 999 px |
| Espaciado (escala de 4) | `--sp-1…8` = 4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 px | igual |
| `--blur` (panel) | `blur(18px) saturate(1.25)` | ninguno |
| `--blur-small` (chip, tooltip) | `blur(10px)` | ninguno |
| `--shadow-panel` | `0 24px 60px rgba(0,0,0,.45), inset 0 1px 0 rgba(255,255,255,.10)` | `0 12px 32px rgba(0,0,0,.40)` |
| `--shadow-pop` (tooltip, menú) | `0 8px 24px rgba(0,0,0,.45)` | `0 6px 18px rgba(0,0,0,.45)` |
| `--glow-accent` (foco, selección) | `0 0 0 2px var(--accent), 0 0 18px rgba(99,205,255,.35)` | `0 0 0 2px var(--accent)` (sin brillo) |

**Costo de rendimiento del vidrio** (📏 medir en la maqueta A): `backdrop-filter` obliga a la GPU a desenfocar el lienzo del juego detrás del panel en **cada cuadro**. Recomendación: **un solo panel con desenfoque a la vez** (el panel, no cada casilla); los hijos usan `--surface-2` (alfa simple, sin desenfoque); en el nivel **Bajo** de `PLAN_GRAFICOS.md` y con «Movimiento tranquilo» el vidrio **cae a opaco** (`--surface` sólido `#12161f`). Esto además cubre navegadores sin `backdrop-filter`: `@supports not (backdrop-filter: blur(1px))` → superficie sólida.

### 2.3 Tipografía

**Recomendación: Inter** (variable, **self-hosted**).

- **Licencia verificada:** Inter está bajo **SIL Open Font License 1.1** (Google Fonts lo indica en su ficha de licencia y el copyright lo atribuye a «The Inter Project Authors», `rsms/inter`; el paquete `@fontsource-variable/inter` declara `OFL-1.1`). Fuentes: [Google Fonts: Inter, licencia](https://fonts.google.com/specimen/Inter/license), [Inter en Wikipedia (proyecto y repositorio)](https://en.wikipedia.org/wiki/Inter_(typeface)), [`@fontsource-variable/inter` en npm](https://www.npmjs.com/package/@fontsource-variable/inter). **Lo que no se verificó:** el texto completo de la OFL ni el peso exacto del archivo; la OFL exige llevar **el aviso de licencia junto a los archivos** de la fuente: guardar `OFL.txt` en `public/fonts/` y mantener la línea de créditos en `version.js`.
- **Por qué Inter:** muy legible a 12–16 px en pantalla, **números tabulares** (`font-feature-settings: 'tnum'`) para billetera y cantidades que no «bailan», cubre `ñ`, tildes, `¿` y `¡` en el subconjunto latino, y un solo archivo variable evita cargar tres pesos.
- **Alternativas** (también OFL según su conocimiento general; **por confirmar en la web antes de adoptarlas**): **Manrope** (más geométrica y suave, buena para A), **Space Grotesk** (más «tecnológica», con carácter en números y títulos, pero **peor en párrafos largos**) y **Rubik** (redondeada, más amable, menos «tech»). Si nanoyackson quiere el sello más «tecnológico» solo en **títulos y números**, la combinación es **Space Grotesk para títulos + Inter para el resto** (dos archivos).
- **Servida local, no desde Google Fonts:** hoy `index.html` (líneas 8–9) llama a `fonts.googleapis.com` para VT323 (CSP: `style-src` y `font-src` externos). La propuesta **elimina ese `<link>`** y pone `public/fonts/Inter-latin.woff2` con `@font-face { font-display: swap; }` (subconjunto latino, variable en peso 400–700). Se necesita **cambiar también** `src/mapa.js` (el lienzo usa `'16px VT323, monospace'`) y la línea de créditos de `version.js`.
- **VT323 se retira del cuerpo.** Si se quiere conservar un toque de identidad pixelada, **solo en el logo** (ya es una imagen: `public/ui/logo.png`) y en los números de daño dentro del mundo (no es UI); en la interfaz, **ya no**.

| Rol | Tamaño | Peso | Interlineado | Notas |
|---|---|---|---|---|
| `--fs-display` (título de pantalla) | 28 px | 600 | 1.15 | letra con espaciado −0.01em |
| `--fs-title` (panel) | 18 px | 600 | 1.25 | |
| `--fs-body` | 15 px | 400 | 1.4 | mínimo del cuerpo en 720p |
| `--fs-small` (ayuda, contadores) | 13 px | 500 | 1.3 | **nunca menos de 12 px** |
| `--fs-micro` (etiquetas de tecla) | 11 px | 600, MAYÚSCULAS | 1 | solo en teclas `⌘`/`R` |
| Números (cantidad, billetera) | = contexto | 600 | — | `font-variant-numeric: tabular-nums` |

Las pantallas que hoy usan `zoom: var(--zoom-ui)` (inventario) **mantienen ese mecanismo**: los tamaños anteriores están en px de 1080p y el zoom los escala en 4K.

### 2.4 Movimiento

| Token | Valor | Uso |
|---|---|---|
| `--t-fast` | 120 ms | hover, foco, pulsar |
| `--t-base` | 200 ms | abrir/cerrar tooltips y menús, cambiar de pestaña |
| `--t-slow` | 320 ms | abrir/cerrar un panel grande |
| `--ease-out` | `cubic-bezier(.2, .8, .2, 1)` | **entra** (arranca rápido, frena suave) |
| `--ease-in` | `cubic-bezier(.4, 0, 1, 1)` | **sale** (acelera, sin rebote) |
| `--ease-spring` | `cubic-bezier(.34, 1.4, .64, 1)` | **solo** casilla al soltar y píldora al ganar un objeto (rebote chico) |

**Reglas:** (1) solo se animan `opacity` y `transform` (no `width`, `top`, `box-shadow` con desenfoque); (2) **al salir siempre más corto que al entrar** (≈ 70 %); (3) **nada rebota** salvo `--ease-spring` en los dos usos de arriba; (4) con **«Movimiento tranquilo»** o `prefers-reduced-motion`, ver 4.6.

### 2.5 Tamaños (rejilla)

- **Casilla** `--s`: ya existe (`clamp(34px, min(6vh, 2.85vw), 58px)`, v11.12.0); **se conserva**, es lo mejor de esa versión (cabe en 720p y crece en 4K). Hueco entre casillas **4 px** (A) / **3 px** (B).
- **Objetivo táctil/ratón** de botones y chips: **≥ 32 px de alto** (≥ 28 px solo en pantallas de ≤ 760 px de alto).
- **Ancho de panel** estándar: 1 columna **360 px**, 2 columnas **720 px**, inventario completo **960 px** (3 columnas: personaje 220 + inventario 460 + recetario 340; en ≤ 1199 px el recetario pasa **debajo**, como ya hace el CSS actual).

---

## 3. Componentes

Todos los ejemplos usan solo tokens; **el mismo CSS sirve para A y B**. Las variantes de estado se describen primero en palabras y después va el CSS mínimo.

### 3.1 Panel

**Cómo se ve:** una superficie con esquinas redondeadas, **borde de 1 px** y una **línea de luz arriba** (en A: `inset 0 1px 0` clara; en B: sin ella). Título a la izquierda, acciones (⋯, cerrar) a la derecha, **16 px de relleno**. **Sin** título centrado ni marco doble.

```css
.panel-ui { background: var(--surface); border: 1px solid var(--border); border-radius: var(--r-panel);
  box-shadow: var(--shadow-panel); padding: var(--sp-4); color: var(--text); font: 400 var(--fs-body)/1.4 var(--font);
  backdrop-filter: var(--blur); }
.panel-ui > header { display: flex; align-items: center; gap: var(--sp-2); margin-bottom: var(--sp-3); }
.panel-ui > header h3 { margin: 0; font: 600 var(--fs-title)/1.25 var(--font); flex: 1; }
```

### 3.2 Casilla (normal · hover · seleccionada · arrastrando · deshabilitada)

| Estado | Cómo se ve |
|---|---|
| **Normal** | Fondo `--surface-2`, borde `--border` de 1 px, ícono centrado al 80 %, cantidad **abajo a la derecha** en 600 con sombra de 1 px, sin subrayado de categoría |
| **Hover** | Fondo `--surface-3`, el ícono sube **1 px** (`translateY(-1px)`), tooltip a los **350 ms** (no antes: evita el parpadeo al cruzar la cuadrícula) |
| **Seleccionada / barra rápida activa** | **Anillo** `--accent` de 2 px (`--glow-accent`), fondo un poco más claro; **no** se agranda (hoy `scale: 1.1` + borde blanco de 4 px) |
| **Arrastrando** | Origen: ícono al **35 %** de opacidad y borde punteado; el **fantasma** sigue al cursor al 90 %, escala 1.06 y con sombra (4.4); destino válido: anillo `--accent`; destino inválido: anillo `--danger` tenue |
| **Deshabilitada / apagada** | Fondo `--surface` (sin elevar), ícono **al 40 %** y a escala de grises; cursor `not-allowed` y **sin tooltip de acción**; **no** es solo transparencia: lleva un **candado** de 12 px (contraste del candado ≥ 3:1) |
| **Con categoría** (solo en el recetario) | **Punto de 6 px** del color de categoría arriba a la izquierda; **no** el subrayado de 3 px de hoy (`.grid .slot { box-shadow: inset 0 -3px 0 var(--catc) }`) |

```css
.slot { width: var(--s); height: var(--s); display: grid; place-items: center; position: relative;
  background: var(--surface-2); border: 1px solid var(--border); border-radius: var(--r-slot);
  transition: background var(--t-fast) var(--ease-out), box-shadow var(--t-fast) var(--ease-out); }
.slot:hover { background: var(--surface-3); }
.slot:hover img { transform: translateY(-1px); }
.slot.sel { box-shadow: var(--glow-accent); }
.slot.arrastrando img { opacity: .35; }
.slot.arrastrando { border-style: dashed; }
.slot.destino-ok { box-shadow: 0 0 0 2px var(--accent); }
.slot.destino-no { box-shadow: 0 0 0 2px color-mix(in srgb, var(--danger) 60%, transparent); }
.slot[aria-disabled="true"] img { opacity: .4; filter: grayscale(1); }
.slot .count { position: absolute; right: 4px; bottom: 2px; font: 600 calc(var(--s) * .3)/1 var(--font); font-variant-numeric: tabular-nums; text-shadow: 0 1px 2px #000; }
```

**Qué se quita de la casilla de hoy:** el biselado de 2 px (`inset 2px 2px 0 #a5a5a5…`), el contorno blanco de 4 px de la seleccionada y el «verde de calza» (`.calza`, que solo existe para la búsqueda del inventario: queda en el recetario, ver 4.1).

### 3.3 Botón (primario · secundario · ícono)

| Variante | Cómo se ve | Uso |
|---|---|---|
| **Primario** | Relleno `--accent`, texto `--on-accent` en 600, **uno por pantalla** | «Continuar», «Comprar», «Reaparecer», «Listo» |
| **Secundario** | Relleno `--surface-2`, borde `--border`, texto `--text` | «Ajustes», «Ordenar» |
| **Ícono** | Cuadrado de 32 px, sin texto visible, `aria-label` y tooltip obligatorios | «⋯», «?», lupa, cerrar |
| **Peligro** | Igual que el secundario, con texto `--danger` (nunca relleno rojo grande) | «Borrar mundo» |

Estados comunes: **hover** `--surface-3` (primario: 8 % más claro); **foco visible** anillo `--accent` de 2 px con 2 px de separación (el foco **ya** es ≥ 3:1 desde v11.12.1: se conserva el principio, se cambia el color); **pulsado** `translateY(1px)` y 90 % de brillo; **deshabilitado** fondo `--surface`, texto `--text-soft` (≥ 3:1 como componente inactivo; el WCAG no lo exige, pero se mantiene legible) y cursor `not-allowed`.

```css
.btn { min-height: 32px; padding: 0 var(--sp-3); border-radius: var(--r-ctrl); border: 1px solid var(--border);
  background: var(--surface-2); color: var(--text); font: 500 var(--fs-body)/1 var(--font); cursor: pointer;
  transition: background var(--t-fast) var(--ease-out), transform var(--t-fast) var(--ease-out); }
.btn:hover { background: var(--surface-3); }
.btn:active { transform: translateY(1px); }
.btn:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
.btn.primario { background: var(--accent); color: var(--on-accent); border-color: transparent; font-weight: 600; }
.btn.primario:hover { filter: brightness(1.08); }
.btn.icono { width: 32px; padding: 0; display: inline-grid; place-items: center; }
.btn:disabled { background: var(--surface); color: var(--text-soft); cursor: not-allowed; }
```

### 3.4 Chip de filtro

**Cómo se ve:** píldora de 28 px de alto, texto de 13 px, **un punto de 6 px del color de la categoría** a la izquierda y el **contador en gris** a la derecha (`Comida 14`). **Apagado:** fondo `--surface-2`, borde `--border`. **Encendido:** borde y texto `--accent`, fondo `--accent` al 14 %, el punto crece a 8 px. **Varios chips pueden estar encendidos a la vez** (se suman: «Comida» + «Plantas»). El chip **«Todo»** apaga los demás. Un chip con **0 resultados** se atenúa pero **no desaparece** (la fila no «salta»).

```css
.chip { display: inline-flex; align-items: center; gap: 6px; height: 28px; padding: 0 var(--sp-3); border-radius: var(--r-pill);
  background: var(--surface-2); border: 1px solid var(--border); color: var(--text); font: 500 var(--fs-small)/1 var(--font); cursor: pointer; }
.chip::before { content: ''; width: 6px; height: 6px; border-radius: 50%; background: var(--cat, var(--text-soft)); transition: transform var(--t-fast) var(--ease-out); }
.chip small { color: var(--text-soft); font-variant-numeric: tabular-nums; }
.chip[aria-pressed="true"] { border-color: var(--accent); color: var(--accent); background: color-mix(in srgb, var(--accent) 14%, transparent); }
.chip[aria-pressed="true"]::before { transform: scale(1.35); }
.chip[data-n="0"] { opacity: .5; }
```

### 3.5 Buscador

**Cómo se ve:** campo de 32 px con **lupa** a la izquierda, **placeholder** gris («Buscar receta o ingrediente»), una **tecla `/`** pequeña a la derecha cuando está vacío (descubrimiento del atajo, en vez del texto «( / )»), y una **✕** cuando tiene texto. **Foco:** borde `--accent`. **En el inventario:** es **solo lupa** y se expande al tocarla o al pulsar `/` (ahorra el ancho y deja la cuadrícula protagonista). Mientras hay texto, lo que no calza **se atenúa al 35 %** (no desaparece: sigue la regla de v11.12.0 «filtrar no esconde nada») y lo que calza lleva el anillo `--accent`; en el recetario, en cambio, **sí se oculta** lo que no calza (es una lista, no un lugar).

### 3.6 Tooltip

**Cómo se ve:** caja pequeña, fondo `--surface` (en A, con `--blur-small`), **borde de 1 px**, radio `--r-ctrl`, **máximo 260 px de ancho**. **Estructura fija en tres líneas** (como ya hace el tooltip de objetos): **nombre** (600, `--text`) → **propiedades** (13 px, `--text-soft`) → **ayuda** (13 px, `--text-soft`, precedida de una tecla en gris). Para botones: **nombre de la acción + atajo** en una sola línea (`Ordenar  R`). Aparece a los **350 ms** de reposo (200 ms en botones de ícono, que no tienen texto), **sigue** al cursor en las casillas y queda **fijo** junto al botón en los demás; sale a los 100 ms. En pantalla táctil (**por confirmar si el juego la soporta**) el tooltip sale con pulsación larga. `role="tooltip"` y `aria-describedby`: lo que el tooltip dice **también** debe poder leerse con teclado (en foco, no solo en hover).

### 3.7 Pestaña

**Cómo se ve:** fila de textos de 14 px con **subrayado de 2 px** `--accent` bajo la activa (que se **desliza** al cambiar: ver 4.3) y **sin cajas**. Inactivas en `--text-soft`; hover en `--text`. Una **insignia de punto** `--accent` si la hoja tiene algo nuevo (en la Libreta: «Cartas» con carta sin leer). La fila **hace scroll horizontal con borde difuminado** si no cabe, en vez de partirse en dos líneas.

```css
.tabs { display: flex; gap: var(--sp-4); border-bottom: 1px solid var(--border); position: relative; }
.tabs button { background: none; border: 0; padding: var(--sp-2) 0; color: var(--text-soft); font: 500 14px/1 var(--font); cursor: pointer; }
.tabs button[aria-selected="true"] { color: var(--text); }
.tabs .barra { position: absolute; bottom: -1px; height: 2px; background: var(--accent); border-radius: 2px;
  transition: transform var(--t-base) var(--ease-out), width var(--t-base) var(--ease-out); }
```

### 3.8 Barra de vida y de hambre (HUD)

**Cómo se ve:** **dos barras horizontales finas** (8 px de alto) pegadas **sobre la barra rápida**, alineadas a sus extremos izquierdo (vida) y derecho (hambre), **con el número encima en 12 px** (`74`), en vez de 10 corazones y 10 muslos de 22 px. Relleno con **degradado suave** (vida: `--danger` → rosado; hambre: `--warn` → ámbar), **fondo** `rgba(0,0,0,.45)`, **radio 4 px**. **Cambios:** al recibir daño, un **trazo blanco** se queda un momento y se encoge hacia el nuevo valor (el «daño reciente», 350 ms); al curar, el relleno crece con `--ease-out`. **Vida baja (< 25 %):** pulso lento del borde `--danger` (1.2 s) —**sin** movimiento en «Movimiento tranquilo»: color fijo y número rojo—. **Alternativa conservadora:** si nanoyackson prefiere los corazones (identidad del juego), **se conservan los íconos pero agrupados de a 5 y a 18 px**, con la misma barra de armadura arriba; es una decisión suya (sección 6).

```css
.bar { position: relative; height: 8px; border-radius: 4px; background: rgba(0,0,0,.45); overflow: hidden; }
.bar > i { position: absolute; inset: 0 auto 0 0; width: var(--v, 100%); border-radius: inherit;
  background: linear-gradient(90deg, var(--c1), var(--c2)); transition: width var(--t-base) var(--ease-out); }
.bar > i.dano { background: #fff; opacity: .85; transition: width 350ms var(--ease-out) 120ms; }
.bar.vida { --c1: #ff6b6b; --c2: #ffa0a0; } .bar.hambre { --c1: #ffb347; --c2: #ffd166; }
.bar.baja { box-shadow: 0 0 0 1px var(--danger); }
```

### 3.9 Toast del locutor

**Cómo se ve:** hoy `#toast` es un texto de **28 px con sombra dura** en el 27 % superior. Propuesta: **una píldora** (fondo `--surface`, borde, `--blur-small` en A) de **una a dos líneas** de 15 px, con un **ícono de categoría** a la izquierda (consejo 💡, urgente ⚠, ambiente 🌿: se conservan las **tres categorías** de `data-cat`), anclada **arriba al centro a 64 px del borde**. Entra con **fundido + subida de 8 px** (200 ms), **queda según la «Velocidad de lectura»** de Ajustes y sale en 140 ms. **Urgente:** borde `--danger` y texto `--danger`; consejo: texto `--text`; ambiente: texto `--text-soft`. **Se apilan** como máximo **dos** (el resto espera; ya hay un tope por minuto en «Avisos en pantalla»). El nombre del que habla (`#dialog-name`) va como **primera línea pequeña** en `--warn`.

### 3.10 Billetera del HUD

**Cómo se ve:** **píldora** (`--r-pill`, fondo `--surface-2` al 70 %) con la **moneda** de 18 px y el **total** en 600 con números tabulares (`₡ 12 500`), a la **derecha de la barra rápida**; **no** muestra el desglose de billetes. Al **ganar** plata: el número **sube con conteo** de 400 ms y la píldora hace un `scale(1.06)` con `--ease-spring`, con un `+500` en `--success` que sube y se desvanece (no se queda). Al **gastar**: el `−500` en `--danger`. **En pantallas ≤ 900 px de ancho** pasa **sobre** la barra rápida, a la derecha (hoy ya lo hace con `@media (max-width: 900px)`). En el inventario, el desglose se ve **plegado** (un clic lo abre).

---

## 4. Patrones

### 4.1 Categorías = filtros del recetario (no del inventario)

- **Dónde:** **arriba del recetario**, justo bajo el buscador, **una sola fila de chips** (scroll horizontal si no cabe): `Todo · Puedo hacer · Herramientas · Armadura · Comida · Construcción · Materiales · Varios`.
- **De dónde salen las categorías:** la lógica ya existe (`categoria(id)` en `src/categorias.js`); se aplica **al objeto que la receta produce** (`r.out[0]`). El recetario necesita **una agrupación más corta** que las 9 del inventario viejo: **fusionar** minerales + madera + tierra + plantas en **«Materiales»** (en el recetario no se cura un trozo de madera: se hace un tablón) y **dejar «Construcción»** aparte. Así **son 6 categorías reales + Todo + «Puedo hacer»**. **Por confirmar con nanoyackson** si quiere 6 o las 9 (sección 6).
- **«Puedo hacer»** (chip especial, `--success`): muestra **solo las recetas con ingredientes completos** (hoy las que no se pueden se ven al 45 % con la clase `.recipe.no`). Es el filtro **más usado**; por eso va **segundo**, y es el que deja de lado el desorden.
- **Comportamiento:** un chip o varios (se suman); **la búsqueda de texto respeta los chips encendidos**; **conservar el scroll** de la lista al cambiar de filtro (ya lo hace `renderRecetas`); si no queda nada: el mensaje vacío existente («Ninguna receta con …»), con un botón «Quitar filtros».
- **Contador en el chip** = cuántas recetas hay **con el resto de los filtros aplicados** (así el 0 avisa antes de pulsar).
- **El inventario:** **sin** pestañas de categoría. **Orden:** un solo botón **«Ordenar»** (atajo `R`) con el orden por categoría **por defecto**; los otros tres órdenes (nombre, cantidad, recientes) quedan **dentro del «⋯»**. **Búsqueda** en el inventario: se conserva (lupa).

### 4.2 Acciones secundarias en un menú («⋯»)

- **Ícono:** `⋯` horizontal, botón de ícono de 32 px, **siempre arriba a la derecha del panel** (misma posición en inventario, cofres, tienda, mundos, libreta).
- **Menú:** una **lista** de 160–240 px de ancho (fondo `--surface`, `--shadow-pop`, radio `--r-ctrl`), **ítems de 32 px** con ícono a la izquierda y **tecla de atajo a la derecha** en `--text-soft`. Se abre con **fundido + 4 px de subida** (160 ms), se cierra con clic fuera, `Esc` o al elegir (no se queda abierto).
- **Teclado:** `Tab` entra, **flechas** mueven, `Enter` elige, `Esc` cierra y **devuelve el foco** al botón. `aria-haspopup="menu"`, `aria-expanded`.
- **Contenido por pantalla:** **Inventario:** «A cofres cercanos», orden por nombre/cantidad/recientes. **Cofre:** «Guardar lo que ya hay aquí», «Ordenar», «Ordenar la casa». **Tienda:** «Pedir fiado», «Cambiar a billetes», «A monedas». **Mundo:** «Exportar», «Renombrar», «Borrar» (peligro, al final, separado por línea). **Libreta:** «Más ▾» con las hojas que no entran.
- **Acciones peligrosas** (borrar mundo, vaciar): **nunca** dentro de un «⋯» sin **confirmación**; el ítem se pinta `--danger` y pide un segundo paso («Borrar» → «¿Seguro? Se pierde el mundo»).

### 4.3 Ayudas en tooltips

- **Toda instrucción larga** de hoy pasa a un **tooltip o a un «?»**: la línea del mapa (7 instrucciones), `.shop-hint` de la tienda y la libreta, «Clic derecho: fijar la receta», «Arrastre para girar» (el muñeco: queda solo el cursor `grab`).
- **El «?»** del encabezado de cada panel abre una **tarjeta de teclas** (tooltip que se queda mientras el cursor está encima o con foco): **teclas con aspecto de tecla** (caja de 22 px, `--surface-2`, borde inferior de 2 px), así se parece a una referencia y no a un párrafo.
- **Nunca** dos ayudas a la vez; **nunca** ayuda sin un nombre accesible (`aria-label`).
- **Ayuda al jugador nuevo:** primeras 3 aperturas del inventario, un **toast de consejo** («Arrastre para mover · clic derecho: mitad»); después, nada (ya hay `Avisos en pantalla: pocos`).

### 4.4 Abrir y cerrar paneles

| Cosa | Entrada | Salida |
|---|---|---|
| **Velo** (detrás del panel) | fundido 200 ms a `rgba(6,9,16,.55)` (A: + desenfoque de 6 px del mundo, **solo en pantallas completas**) | fundido 140 ms |
| **Panel grande** (inventario, libreta, ajustes) | **escala 0.97 → 1 y subida de 12 px + fundido**, 320 ms, `--ease-out` | **escala 1 → 0.985 y fundido**, 200 ms, `--ease-in` |
| **Panel chico** (pausa, muerte, tienda) | igual con 8 px, 240 ms | 160 ms |
| **Menú, tooltip** | fundido + 4 px, 160–200 ms | 100 ms |
| **Hoja de la libreta / pestañas** | **fundido cruzado** de 120 ms (la barra de la pestaña se desliza) | — |
| **Contenido que llega** (recetas, productos) | **entrada escalonada** de 12 ms por fila, **máximo 10 filas** (no 300) | — |

Reglas: el panel **no bloquea la entrada** mientras anima (la primera tecla ya funciona); el foco entra **al primer control** y vuelve **al origen** al cerrar; `Esc` cierra **el más interior primero** (menú → panel). **Sin pantalla negra** entre menú y mundo: el velo es el mismo.

### 4.5 Jerarquía del HUD (tres capas)

1. **Siempre:** mira, barra rápida, vida, hambre. **≈ 4 elementos.**
2. **Por contexto** (aparece solo cuando importa y se va solo a los 3–5 s sin cambios): aire (bajo el agua), estamina (al gastarla), armadura (si la llevo puesta), XP (al ganarla), jefe (con jefe), billetera (al cambiar), «Guardado», región (al entrar).
3. **A pedido:** reloj, objetivo, «lo que miro», brújula, mapa pequeño, versión. Ya son opciones de Ajustes: **por defecto apagadas** salvo brújula (las opciones se **reúnen en una pestaña «Pantalla»** de Ajustes con una vista previa; ver sección 1).

Posiciones fijas (sin que se pisen): **arriba centro** = toast y jefe; **arriba izquierda** = mapa pequeño y objetivo; **arriba derecha** = reloj; **abajo centro** = barras y barra rápida; **abajo derecha** = billetera; **derecha media** = subtítulos y avisos de recogidos. Esto reemplaza las posiciones sueltas de `style.css` (`top: 222px`, `top: 120px`…).

### 4.6 Cómo se ve el arrastre

- **Al tomar** (clic o arrastre sobre una casilla con objeto): la casilla de origen baja al **35 %** y se pone punteada; el **fantasma** (`#cursor-stack`) aparece **bajo el cursor con 8 px de desfase** hacia abajo-derecha, **escala 1.06**, sombra `--shadow-pop`, la cantidad visible.
- **Sobre un destino válido:** el destino muestra el anillo `--accent`; **si el objeto se apila**, aparece un `+N` pequeño en `--success`; **si se intercambia**, una flecha ⇄ de 14 px. **Sobre un destino inválido** (armadura en una casilla equivocada): anillo `--danger` tenue y **el fantasma se inclina 4°** (sin sonido nuevo).
- **Al soltar:** el fantasma **se asienta** en 140 ms con `--ease-spring` (un rebote de ~3 %); si se suelta fuera, **vuelve** a su casilla en 200 ms con `--ease-out` (no «desaparece»).
- **Mitad / uno** (clic derecho, rueda): la cantidad en el fantasma cambia con un **tic** de 80 ms; el contador del origen se actualiza a la vez.
- **Shift+clic:** una **estela** corta (opcional) desde el origen al destino de 160 ms; **en «Movimiento tranquilo» sin estela**: el objeto simplemente cambia.
- Se mantiene la mecánica actual (`slotDown`, `slotEnter`): **este documento solo cambia la apariencia, no el comportamiento** (el arrastre ya funciona; no hay que reescribirlo).

### 4.7 «Movimiento tranquilo» (`body.calma`) y `prefers-reduced-motion`

**Hoy** la regla de `style.css` (`body.calma *` y la consulta `prefers-reduced-motion`) **colapsa toda animación a 0.01 ms**: es eficaz, pero **también quita las transiciones que informan** (la barra de vida salta, el menú aparece de golpe). Propuesta:

- **Se conserva el fundido (`opacity`) y se quita todo lo que se mueve:** en `calma`, las duraciones de **entrada de paneles** pasan a **120 ms de solo fundido**, sin escala ni desplazamiento; la **barra de pestañas** cambia de lugar sin deslizar; **sin** `--ease-spring`, **sin** pulsos (vida baja, billetera), **sin** estela, **sin** conteo animado de números (cambian de una vez), **sin** escalonado.
- **Lo que no cambia:** la **información** (colores, íconos, números). Que lo importante (vida baja, destino inválido) **se vea sin depender del movimiento**: borde fijo en `--danger` en lugar de pulso.
- **El vidrio cae a opaco** (sin `backdrop-filter`): menos tinte y menos costo; también aplica en el nivel **Bajo**.
- **Implementación sugerida (ya cabe en el CSS existente):** un token `--m: 1` (o `0` en calma) que multiplica duraciones (`calc(var(--t-base) * var(--m))`) y define `--lift: 12px` (`0px` en calma). Una sola variable que **flota** el cambio en todas las pantallas, en vez de otra lista de reglas.
- **Tamaño de letra y foco** no se tocan con la calma (son de accesibilidad, no de movimiento).

---

## 5. Referencias de tendencia (en palabras, sin copiar ninguna interfaz)

Rasgos comunes de las interfaces de juegos recientes que se sienten limpias; **se describen como ideas, no como ejemplos concretos**:

1. **Jerarquía de tres capas en el HUD:** lo vital siempre, lo contextual a demanda y lo demás escondido; los juegos que se sienten «limpios» **sacan del cuadro lo que no cambió** en pocos segundos.
2. **Paneles de superficie suave sobre el mundo:** esquinas redondeadas, **bordes finos de luz** y desenfoque del fondo en las pantallas completas; el mundo se sigue **intuyendo** detrás (sensación de estar dentro del juego, no en un menú).
3. **Un solo color de acento** y el resto neutro; **el color se reserva para decir algo** (seleccionado, peligro, éxito, categoría), no para decorar.
4. **Tipografía sans con números tabulares** y muy pocos pesos (400/600), con **etiquetas pequeñas en mayúsculas** solo para teclas y secciones.
5. **Iconografía de línea o de relleno plano** coherente (mismo trazo en todo): aquí los íconos de los objetos son arte propio del juego, así que **el sistema solo pone orden alrededor** (marcos, brillo, sombras) sin tocar el arte.
6. **Menús contextuales («⋯»), paletas de búsqueda y filtros en chips** en lugar de filas de botones: lo secundario **aparece cuando se pide**.
7. **Movimiento corto con curvas que frenan** (entra rápido, se asienta suave), sin rebotes largos; el rebote queda para **«recompensas»** (ganar un objeto, soltar una casilla).
8. **Retroalimentación sin texto:** el número que sube, el anillo que se enciende, el `+N` que se desvanece, **antes** que un mensaje de aviso.
9. **Ayudas dentro de tooltips y de un «?»**, con las teclas dibujadas como teclas.
10. **Accesibilidad como estilo, no como extra:** contraste alto, foco visible grueso, **modo de movimiento reducido** que quita el movimiento pero deja la información.

**Lo que NO se hace:** no se copia el diseño, los íconos, las proporciones ni la composición de ninguna interfaz en particular; las ideas de arriba son **principios generales** y los valores concretos (colores, radios, tiempos) son **propios** de este documento.

---

## 6. Lo que falta decidir o confirmar

1. **¿Categorías del recetario: 6 o 9?** Recomiendo **6 + «Todo» + «Puedo hacer»** (los minerales, madera, tierra y plantas juntos en «Materiales»).
2. **Vidas y hambre: ¿barras finas o corazones?** Las barras ganan en limpieza; los corazones son identidad. Se puede **ofrecer ambos** como ajuste («Estilo de la barra»), pero eso es **una opción más**, justo lo que nanoyackson no quiere; recomiendo **barras** y dejar los corazones solo en el modo de «Interfaz clásica» si algún día se pide.
3. **Fuente:** Inter (recomendada) o Space Grotesk para títulos. **Decisión de gusto** de nanoyackson sobre las dos maquetas.
4. **Tabla de la sección 1:** las cifras «visibles hoy» son **recuento mío** sobre el HTML y el JS; algunas pantallas (cofres, mundos) generan botones por JS, así que conviene **verificarlas contra la maqueta**.
5. **Qué pasa con la pantalla táctil / mando:** este documento supone **ratón y teclado**; si el juego va a la web móvil, los objetivos táctiles deben ser **≥ 44 px** (por confirmar en el estudio de la app, `ESTUDIO_APP_Y_MULTIJUGADOR.md`).
6. **Rendimiento del vidrio** (`backdrop-filter`) **no se midió**: hay que ver la maqueta A en una portátil sin GPU dedicada **antes de elegirla**.
7. **Pantallas que no se revisaron a fondo** por falta de acceso rápido: Bingo (`#bingo`), álbum y cartas dentro de la libreta, modo foto y minimapa; heredan los tokens, pero su **inventario de controles** queda pendiente.

**Para la constructora, en orden:** (1) tokens y `@font-face` (un solo archivo CSS de variables con las dos clases `ui-vidrio`/`ui-grafito`); (2) componentes 3.1–3.10 como clases; (3) inventario + recetario (4.1); (4) cofres y tienda con «⋯» (4.2); (5) ajustes en pestañas y pausa de 3 botones; (6) HUD en tres capas (4.5); (7) libreta y mapa; (8) movimiento tranquilo (4.7); (9) **retirar el CSS antiguo** (biseles, `VT323`, tamaños de 22–40 px) pantalla por pantalla a medida que se migra, para no quedar con dos sistemas conviviendo.
