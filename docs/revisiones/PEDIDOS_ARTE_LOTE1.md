# Pedidos de arte con GPT — lote 1 (40 íconos)

Pedido: encargo 11 de la orquestadora. Referencias de estilo y calidad: `assets-src/chatgpt/moneda-*.png`, `billete-*.png`, `item-carne.png`, `item-palo.png` (se miraron las imágenes) y `docs/PROMPTS_CHATGPT.md` §3 y §5. **No toca `docs/PEDIDOS_ARTE.md`** (lo edita la constructora). Solo lectura sobre el código; los números de la auditoría salen de leer `textures.js` y de **medir los PNG reales** de `src/assets/items/` con un script (silueta y color sobre los 291 íconos de 32×32).

---

## 0. Guía de estilo (la «familia» de la plata)

Se obtuvo de mirar la plata aprobada: formas planas y redondeadas, colores sólidos con degradados casi invisibles, **un brillo claro en diagonal arriba a la izquierda**, **una banda de sombra más oscura abajo a la derecha**, **sin contorno negro**, un anillo o canto grueso que da volumen y una sombra suave pegada al objeto. La carne cruda y el palo siguen lo mismo, con el objeto en diagonal.

| Aspecto | Regla para todos los prompts |
|---|---|
| **Lienzo** | 512×512, PNG con **fondo transparente** (nada de suelo, marco ni degradado de fondo). |
| **Tamaño del objeto** | Herramientas y armas: ≈ 85 % del lienzo en diagonal. Comida, envases y objetos: ≈ 75 %, centrados. Siempre ≥ 20 px de aire. |
| **Ángulo** | Vista de 3/4 ligeramente desde arriba. **Herramientas y armas en diagonal de abajo-izquierda a arriba-derecha** (mango abajo, parte activa arriba). El resto, centrado y casi frontal. |
| **Luz** | Desde arriba a la izquierda, siempre. Un **brillo** claro (una franja o un óvalo) en ese lado. |
| **Sombra** | Una banda más oscura del mismo color en el lado de abajo-derecha del propio objeto, más una sombra suave pegada; **nunca** sombra proyectada sobre un suelo. |
| **Contorno** | **Ninguno negro.** Las formas se separan por cambio de tono, no por línea. Esquinas redondeadas (radio ≥ 12 px a 512). |
| **Grosor y detalle** | Nada de detalles menores de ≈ 12 px (se pierden a 64 px, que es como se ve en el inventario). La silueta manda: debe reconocerse **en negro sobre blanco**. |
| **Textura** | Lisa. Nada de ruido, fotorrealismo, pinceladas ni texturas de madera dibujadas hilo por hilo: la veta se sugiere con una o dos líneas claras. |
| **Texto** | Ninguno (salvo cifras en la plata). Sin logos ni marcas. |
| **Originalidad** | Diseño propio de NanoBlocks (juego ficticio, Costa Rica). **Nada copiado de otros juegos**: ni siluetas ni combinaciones de color características. Para evitar el parecido con el género, los pedidos usan rasgos ticos propios: atado con **cabuya**, mangos con nudos y envuelto en tela roja, cabezas asimétricas. |

**Paleta fija por material** (aproximada, tomada de la plata y la carne; úsese la misma en todos los prompts):

| Material | Tono base | Brillo | Sombra |
|---|---|---|---|
| Madera | café cálido `#9a6330` | `#c28a52` | `#5e3a1a` |
| Cabuya / fibra | crema `#d9c28f` | `#efe0b0` | `#a8925c` |
| Piedra | gris `#9aa1aa` | `#c7ccd2` | `#656c75` |
| Hierro | gris azulado claro `#c8d3e0` | `#f1f5fa` | `#8396ab` |
| Diamante | turquesa `#3fd6e6` | `#aef4fa` | `#1b94ad` |
| Oro / dorado | `#f4c542` | `#ffe58a` | `#c68f1b` |
| Rojo (carne, tela) | `#d9404f` | `#f08a92` | `#a82838` |
| Verde hoja | `#5aa83c` | `#8ed05e` | `#35702a` |
| Barro / ladrillo | terracota `#c0553a` | `#e08a66` | `#7e3322` |
| Agua / vidrio | celeste `#6cc4f0` | blanco | `#3b86b8` |

**Cómo usar la guía:** cada fila de la sección 3 ya trae **el prompt completo** (la guía va incluida al final de cada uno), así que se puede correr una por una en Codex sin contexto. Si salió fuera de familia, repetir el mismo prompt agregando: *«más plano, sin degradados fuertes, sin contorno, con el brillo arriba a la izquierda»*.

---

## 1. Auditoría de íconos

### 1.1 Cómo se dibujan hoy

El juego tiene **304 ítems** (`ITEMS` en `blocks.js`). `textures.js` (`loadSprites`) escoge el dibujo de cada uno, en este orden de prioridad:

1. **`src/assets/items/<clave>.png`** (o el de la clave de `icono`): **291 PNG de 32×32 en pixel art**, cortados de hojas con `tools/cortar-hojas.mjs` (prompt de `docs/PROMPT_ITEMS.md`). Se dibujan en un canvas de **64×64 con `imageSmoothingEnabled = false`** (vecino más cercano). **Cubren 292 de los 304 ítems.**
2. **Campo `sprite`** (20 ítems, p. ej. `sprite: 'pick_silver'`): 31 PNG de Kenney en `public/sprites/`, con suavizado alto. **Hoy están ocultos** porque casi todos esos ítems ya tienen PNG en (1). Detalle que confunde: el mapeo de materiales usa nombres cruzados (madera → `pick_bronze`, piedra → `pick_iron`, hierro → `pick_silver`).
3. **`paintFlat(item)`** (`textures.js:92`, **169 ramas** `item.key === '…'` en Canvas 2D: formas planas de 64×64 con dos tonos y un brillo). Es el **respaldo procedural**. Casi todas sus ramas quedan **tapadas** por (1); hoy solo dibuja los **12 ítems sin PNG**: las monedas (ids 329, 346–349) y los billetes nuevos (354, 355, 359, 370, 385–387), cuyo arte aprobado (`assets-src/chatgpt/`) todavía no está conectado.

**Todo lo demás en pantalla:** `iconURL(id)` convierte ese canvas de 64×64 en URL; `style.css` pinta `.slot img` a **40×40 con `image-rendering: pixelated`**; los bloques usan íconos isométricos de 48 px (`blockIcon`).

### 1.2 Qué se ve bien y qué no (medido)

Se miraron las imágenes de las herramientas, la comida, los materiales y los objetos de historia: **el pixel art actual está bien hecho** (colores vivos, siluetas claras, ver comida, frutas, armaduras). Los problemas son de **identidad** y de **estilo**:

**a) Íconos que se confunden** (silueta de 32×32 y color medidos sobre los 291; IoU = coincidencia de silueta, 1.00 = idénticos):

| Grupo | Pares | IoU | Qué pasa |
|---|---|---|---|
| **Baldes** | balde · balde con agua · con lava · de leche | **0.99–1.00** | Misma silueta; solo cambia el color del contenido |
| **Papeles** | escritura de lote con vista al mar · hoja de firmas | **1.00** | El mismo dibujo con otro color |
| **Platos** | pejibaye · pejibaye con mayonesa | **1.00** | Idénticos salvo la salsa |
| **Planos** | casita de adobe · casa de madera | **0.97** | Casi igual |
| **Picos** | madera · piedra · hierro · diamante | **0.89–0.94** | Misma silueta de cabeza; cambia el color |
| **Azadas** | madera · piedra · hierro · diamante | **0.88–0.94** | Misma silueta; **parecen un pico chiquito** (no se reconocen como azada) |
| **Palas** | piedra · hierro | 0.93 | |
| **Hachas** | piedra · hierro | 0.83 | |
| **Botellas** | alcohol · guaro · agua bendita | **0.87–0.95** | Botella con etiqueta |
| **Dulces y pepitas** | azufre · pepita de oro · cajeta · tanelas | **0.85–0.92** | Masa amarilla o café sin forma propia |
| **Terracota** | ladrillo · carne asada · batea · cajeta | **0.81–0.92** | Rectángulo terracota |
| Otros | agua dulce ~ limón · empanada ~ oro/plátano maduro · huevo ~ natilla · tapa de dulce ~ cajuela/mochila/libro | 0.80–0.85 | |

**b) Íconos pobres** (4 colores o menos, o pocos píxeles): `chancleta_zenaida`, `cucharon_zenaida`, `delantal_zenaida`, `sombrero_zenaida`, `panuelo_chata`, `saco_gangoche`, `tablilla` (esta última se lee como una escalera).

**c) Estilo mezclado.** La plata nueva y los íconos `item-carne`/`item-palo` son **planos y suaves a 512 px**; todo lo demás es **pixel art de 32 px con contorno oscuro**. Con la plata conectada, la tienda y el inventario van a mostrar dos estilos juntos. Por eso este lote cubre primero lo que más se ve y más se confunde, **por familias**, para no dejar una herramienta de pixel art junto a otra de flat.

**d) Originalidad.** La silueta de las herramientas (cabeza en arco, mango diagonal) es la convención del género y **se parece mucho a la de otros juegos de bloques**. Los prompts piden rasgos propios (cuerdas de cabuya, cabezas asimétricas, mangos con nudos y empuñadura de tela roja) para que el set se pueda publicar sin dudas.

**e) Detalle técnico que afecta al arte nuevo** (ver sección 5): el camino de `assets/items` dibuja con **vecino más cercano**, así que un PNG de 512 px reducido a 64 saldría con dientes de sierra; y `.slot img` está en `pixelated`.

---

## 2. Los 40 objetos que más ganan, y por qué

Criterio: **cuánto se ven** (barra de acceso rápido, inventario, tiendas, fichas) × **cuánto se confunden o se ven pobres** (auditoría 1.2). Se reparten así:

| Grupo | # | Por qué |
|---|---|---|
| **Herramientas y armas (12)** | 12 | Siempre en la barra de acceso rápido y las más repetidas: picos (4 materiales), hachas (piedra/hierro), azadas (madera/piedra/hierro), palas (piedra/hierro) y el **machete**, el arma más tica. Se piden las que se confunden entre sí; el resto de materiales (madera/diamante/jade de las otras clases) se hacen en el lote 2 **con la misma plantilla**. |
| **Comida (10)** | 10 | Lo que más se compra y se come: gallo pinto, casado, gallo pinto con huevo, café chorreado, agua dulce, tamal, ceviche, empanada, cajeta y carne asada. Son los precios que acaban de pasar a colones reales. |
| **Materiales y envases (10)** | 10 | Los **4 baldes** (idénticos), las **3 botellas**, el ladrillo, la tapa de dulce y el azufre. |
| **Objetos de historia (8)** | 8 | Los de Zenaida (chancleta, cucharón, delantal, sombrero), la tablilla, el pañuelo de los Chatas y los dos papeles idénticos (escritura y hoja de firmas). Son los íconos más pobres y los que cargan la historia. |

**Orden recomendado de generación:** primero **herramientas** (se ven todo el tiempo), luego **baldes y botellas** (son pares idénticos), luego **comida**, luego **historia**.

**Lote 2 (no incluido):** espadas y azadas/picos de madera, diamante y jade, armaduras (16 piezas), pepita de oro, pejibaye (2), planos (2), pedazos del Corazón (4, hoy casi iguales), arco, flechas, sopa negra y los demás platos.

---

## 3. Los 40 pedidos (uno por uno, listos para correr en Codex)

Cada fila tiene: **archivo**, **dónde se conecta** (id y clave del ítem), **qué le pasa hoy** y **el prompt completo en español** (la guía de estilo ya va dentro). Guardar cada resultado como `assets-src/chatgpt/item-<clave>.png`.

### Herramientas y armas (12)

#### 1. Pico de madera
- **Archivo:** `item-wood_pickaxe.png` (512×512, fondo transparente) → `assets-src/chatgpt/`
- **Se conecta a:** ítem **300** · `wood_pickaxe` → `src/assets/items-gpt/wood_pickaxe.png` (ver «Cómo se conecta», sección 5)
- **Hoy:** misma silueta que el de piedra y el de hierro (IoU 0.94); casi igual a la azada
- **Prompt:**

> Ícono de videojuego en estilo plano (flat) de pico de madera. Un pico rústico hecho de madera dura de guayabo: mango recto y largo con dos nudos, y la cabeza curva también de madera, amarrada al mango con cabuya (fibra clara) en dos vueltas. Madera café cálido con vetas claras. Se ve tosco, hecho a mano, sin metal. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. El objeto en diagonal de abajo-izquierda a arriba-derecha, centrado, ocupando cerca del 85 % del lienzo y con 20 px de aire. Vista de 3/4 ligeramente desde arriba, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego.

#### 2. Pico de piedra
- **Archivo:** `item-stone_pickaxe.png` (512×512, fondo transparente) → `assets-src/chatgpt/`
- **Se conecta a:** ítem **301** · `stone_pickaxe` → `src/assets/items-gpt/stone_pickaxe.png` (ver «Cómo se conecta», sección 5)
- **Hoy:** misma silueta que el de madera y el de hierro
- **Prompt:**

> Ícono de videojuego en estilo plano (flat) de pico de piedra. Un pico de piedra: cabeza de piedra gris angulosa, tallada a golpes, con dos puntas desiguales, amarrada con cuerda de cabuya clara a un mango recto de madera café medio. Piedra gris con caras claras y oscuras. Se ve primitivo y robusto. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. El objeto en diagonal de abajo-izquierda a arriba-derecha, centrado, ocupando cerca del 85 % del lienzo y con 20 px de aire. Vista de 3/4 ligeramente desde arriba, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego.

#### 3. Pico de hierro
- **Archivo:** `item-iron_pickaxe.png` (512×512, fondo transparente) → `assets-src/chatgpt/`
- **Se conecta a:** ítem **302** · `iron_pickaxe` → `src/assets/items-gpt/iron_pickaxe.png` (ver «Cómo se conecta», sección 5)
- **Hoy:** misma silueta que el de piedra (IoU 0.89) y el de diamante (0.94)
- **Prompt:**

> Ícono de videojuego en estilo plano (flat) de pico de hierro. Un pico de hierro forjado: cabeza gris azulada clara con dos puntas largas, una un poco más gruesa que la otra, un ojo redondo donde entra el mango y una abrazadera de metal; mango de madera café oscuro con empuñadura envuelta en tela roja desgastada. Metal con brillo suave. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. El objeto en diagonal de abajo-izquierda a arriba-derecha, centrado, ocupando cerca del 85 % del lienzo y con 20 px de aire. Vista de 3/4 ligeramente desde arriba, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego.

#### 4. Pico de diamante
- **Archivo:** `item-diamond_pickaxe.png` (512×512, fondo transparente) → `assets-src/chatgpt/`
- **Se conecta a:** ítem **303** · `diamond_pickaxe` → `src/assets/items-gpt/diamond_pickaxe.png` (ver «Cómo se conecta», sección 5)
- **Hoy:** misma silueta que el de hierro (IoU 0.94)
- **Prompt:**

> Ícono de videojuego en estilo plano (flat) de pico de diamante. Un pico de cristal celeste: cabeza facetada de diamante azul turquesa con destellos blancos y caras de dos tonos, dos puntas simétricas rectas, montada en un mango de madera oscura con remates dorados. Diseño propio de NanoBlocks, con facetas de cristal bien marcadas. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. El objeto en diagonal de abajo-izquierda a arriba-derecha, centrado, ocupando cerca del 85 % del lienzo y con 20 px de aire. Vista de 3/4 ligeramente desde arriba, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego.

#### 5. Hacha de piedra
- **Archivo:** `item-stone_axe.png` (512×512, fondo transparente) → `assets-src/chatgpt/`
- **Se conecta a:** ítem **305** · `stone_axe` → `src/assets/items-gpt/stone_axe.png` (ver «Cómo se conecta», sección 5)
- **Hoy:** casi igual al hacha de hierro (IoU 0.83)
- **Prompt:**

> Ícono de videojuego en estilo plano (flat) de hacha de piedra. Un hacha de piedra: hoja de piedra gris lascada con un filo irregular, encajada y amarrada con cabuya clara a un mango de madera café con un nudo. Hoja ancha y gruesa, aspecto primitivo. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. El objeto en diagonal de abajo-izquierda a arriba-derecha, centrado, ocupando cerca del 85 % del lienzo y con 20 px de aire. Vista de 3/4 ligeramente desde arriba, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego.

#### 6. Hacha de hierro
- **Archivo:** `item-iron_axe.png` (512×512, fondo transparente) → `assets-src/chatgpt/`
- **Se conecta a:** ítem **306** · `iron_axe` → `src/assets/items-gpt/iron_axe.png` (ver «Cómo se conecta», sección 5)
- **Hoy:** casi igual al hacha de piedra
- **Prompt:**

> Ícono de videojuego en estilo plano (flat) de hacha de hierro. Un hacha de hierro forjado: hoja gris azulada clara, ancha, con el filo curvo bien brillante y una muesca pequeña arriba; mango largo de madera café oscuro con un anillo de metal y la empuñadura envuelta en tela roja. Aspecto de hacha de finca bien cuidada. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. El objeto en diagonal de abajo-izquierda a arriba-derecha, centrado, ocupando cerca del 85 % del lienzo y con 20 px de aire. Vista de 3/4 ligeramente desde arriba, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego.

#### 7. Azada de madera
- **Archivo:** `item-wood_hoe.png` (512×512, fondo transparente) → `assets-src/chatgpt/`
- **Se conecta a:** ítem **316** · `wood_hoe` → `src/assets/items-gpt/wood_hoe.png` (ver «Cómo se conecta», sección 5)
- **Hoy:** parece un pico chiquito: nadie la reconoce como azada
- **Prompt:**

> Ícono de videojuego en estilo plano (flat) de azada de madera. Un azadón de campo costarricense hecho de madera: mango largo y recto, y una hoja ancha y plana de madera dura, perpendicular al mango y en ángulo hacia abajo, como para remover tierra, amarrada con cabuya. No tiene puntas como un pico. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. El objeto en diagonal de abajo-izquierda a arriba-derecha, centrado, ocupando cerca del 85 % del lienzo y con 20 px de aire. Vista de 3/4 ligeramente desde arriba, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego.

#### 8. Azada de piedra
- **Archivo:** `item-stone_hoe.png` (512×512, fondo transparente) → `assets-src/chatgpt/`
- **Se conecta a:** ítem **317** · `stone_hoe` → `src/assets/items-gpt/stone_hoe.png` (ver «Cómo se conecta», sección 5)
- **Hoy:** parece un pico chiquito
- **Prompt:**

> Ícono de videojuego en estilo plano (flat) de azada de piedra. Un azadón de campo con la hoja de piedra gris, ancha, plana y cuadrada, perpendicular al mango largo de madera café, amarrada con cabuya clara. La hoja se ve claramente como paleta para remover tierra, no como pico. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. El objeto en diagonal de abajo-izquierda a arriba-derecha, centrado, ocupando cerca del 85 % del lienzo y con 20 px de aire. Vista de 3/4 ligeramente desde arriba, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego.

#### 9. Azada de hierro
- **Archivo:** `item-iron_hoe.png` (512×512, fondo transparente) → `assets-src/chatgpt/`
- **Se conecta a:** ítem **318** · `iron_hoe` → `src/assets/items-gpt/iron_hoe.png` (ver «Cómo se conecta», sección 5)
- **Hoy:** parece un pico chiquito (IoU 0.94 con el de diamante)
- **Prompt:**

> Ícono de videojuego en estilo plano (flat) de azada de hierro. Un azadón de campo con hoja de hierro gris azulada clara, ancha y plana, perpendicular al mango largo de madera café oscuro, con un ojo de metal y la hoja con un filo brillante. Claramente una azada, no un pico. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. El objeto en diagonal de abajo-izquierda a arriba-derecha, centrado, ocupando cerca del 85 % del lienzo y con 20 px de aire. Vista de 3/4 ligeramente desde arriba, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego.

#### 10. Pala de piedra
- **Archivo:** `item-stone_shovel.png` (512×512, fondo transparente) → `assets-src/chatgpt/`
- **Se conecta a:** ítem **309** · `stone_shovel` → `src/assets/items-gpt/stone_shovel.png` (ver «Cómo se conecta», sección 5)
- **Hoy:** casi igual a la de hierro (IoU 0.93)
- **Prompt:**

> Ícono de videojuego en estilo plano (flat) de pala de piedra. Una pala con la paleta de piedra gris lascada, redondeada y ancha, amarrada con cabuya a un mango largo de madera café con un puño en forma de D. Aspecto primitivo. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. El objeto en diagonal de abajo-izquierda a arriba-derecha, centrado, ocupando cerca del 85 % del lienzo y con 20 px de aire. Vista de 3/4 ligeramente desde arriba, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego.

#### 11. Pala de hierro
- **Archivo:** `item-iron_shovel.png` (512×512, fondo transparente) → `assets-src/chatgpt/`
- **Se conecta a:** ítem **310** · `iron_shovel` → `src/assets/items-gpt/iron_shovel.png` (ver «Cómo se conecta», sección 5)
- **Hoy:** casi igual a la de piedra
- **Prompt:**

> Ícono de videojuego en estilo plano (flat) de pala de hierro. Una pala de hierro: paleta de metal gris azulada clara, de punta redondeada, con un reborde brillante y un remache; mango largo de madera café oscuro con puño en D envuelto en tela roja. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. El objeto en diagonal de abajo-izquierda a arriba-derecha, centrado, ocupando cerca del 85 % del lienzo y con 20 px de aire. Vista de 3/4 ligeramente desde arriba, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego.

#### 12. Machete
- **Archivo:** `item-machete.png` (512×512, fondo transparente) → `assets-src/chatgpt/`
- **Se conecta a:** ítem **325** · `machete` → `src/assets/items-gpt/machete.png` (ver «Cómo se conecta», sección 5)
- **Hoy:** es la herramienta más tica y hoy es un cuchillo genérico
- **Prompt:**

> Ícono de videojuego en estilo plano (flat) de machete. Un machete de campo costarricense: hoja ancha y larga de acero gris claro, con el lomo recto y la punta un poco curva hacia abajo, un filo brillante y una línea de brillo; mango de madera café oscuro con dos remaches dorados y una tira de cabuya enrollada. Se ve pesado y práctico, de los que se usan en la finca. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. El objeto en diagonal de abajo-izquierda a arriba-derecha, centrado, ocupando cerca del 85 % del lienzo y con 20 px de aire. Vista de 3/4 ligeramente desde arriba, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego.


### Comida (10)

#### 13. Gallo pinto
- **Archivo:** `item-bread.png` (512×512, fondo transparente) → `assets-src/chatgpt/`
- **Se conecta a:** ítem **263** · `bread` → `src/assets/items-gpt/bread.png` (ver «Cómo se conecta», sección 5)
- **Hoy:** es la comida más común y hoy se parece a una sopa
- **Prompt:**

> Ícono de videojuego en estilo plano (flat) de gallo pinto. Un plato hondo de barro café con gallo pinto: arroz blanco mezclado con frijoles negros (se ven los dos), bien servido en montoncito, con hojitas de culantro verde encima y un hilo de vapor suave. Se ve casero y caliente. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. Un solo objeto centrado, ocupando cerca del 75 % del lienzo, vista de 3/4 desde arriba, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego.

#### 14. Casado
- **Archivo:** `item-casado.png` (512×512, fondo transparente) → `assets-src/chatgpt/`
- **Se conecta a:** ítem **351** · `casado` → `src/assets/items-gpt/casado.png` (ver «Cómo se conecta», sección 5)
- **Hoy:** plato clave del juego; hoy es una masa de colores
- **Prompt:**

> Ícono de videojuego en estilo plano (flat) de casado. Un plato blanco redondo con un casado tico visto desde arriba: arroz blanco, frijoles negros, un picadillo naranja, plátano maduro frito dorado, ensalada de repollo y tomate, y un bistec de carne con cebolla; cada parte bien separada y con su color. Un tenedor pequeño al lado. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. Un solo objeto centrado, ocupando cerca del 75 % del lienzo, vista de 3/4 desde arriba, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego.

#### 15. Gallo pinto con huevo
- **Archivo:** `item-pinto_huevo.png` (512×512, fondo transparente) → `assets-src/chatgpt/`
- **Se conecta a:** ítem **350** · `pinto_huevo` → `src/assets/items-gpt/pinto_huevo.png` (ver «Cómo se conecta», sección 5)
- **Hoy:** casi igual al gallo pinto y a otros platos
- **Prompt:**

> Ícono de videojuego en estilo plano (flat) de gallo pinto con huevo. Un plato blanco con una porción de gallo pinto y encima un huevo frito de yema naranja brillante y clara blanca con orillas doradas; al lado dos rodajas de plátano maduro y una tortilla de maíz. Desayuno tico. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. Un solo objeto centrado, ocupando cerca del 75 % del lienzo, vista de 3/4 desde arriba, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego.

#### 16. Café chorreado
- **Archivo:** `item-cafe_chorreado.png` (512×512, fondo transparente) → `assets-src/chatgpt/`
- **Se conecta a:** ítem **298** · `cafe_chorreado` → `src/assets/items-gpt/cafe_chorreado.png` (ver «Cómo se conecta», sección 5)
- **Hoy:** se confunde con otros dibujos de utensilios
- **Prompt:**

> Ícono de videojuego en estilo plano (flat) de café chorreado. Un chorreador de café tico: un soporte de madera con un brazo que sostiene una bolsita de tela clara, y debajo una taza de cerámica blanca con una florecita roja pintada, llena de café oscuro humeante con dos hilos de vapor. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. Un solo objeto centrado, ocupando cerca del 75 % del lienzo, vista de 3/4 desde arriba, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego.

#### 17. Agua dulce
- **Archivo:** `item-agua_dulce.png` (512×512, fondo transparente) → `assets-src/chatgpt/`
- **Se conecta a:** ítem **299** · `agua_dulce` → `src/assets/items-gpt/agua_dulce.png` (ver «Cómo se conecta», sección 5)
- **Hoy:** se confunde con el limón (IoU 0.80)
- **Prompt:**

> Ícono de videojuego en estilo plano (flat) de agua dulce. Un vaso alto de vidrio con agua dulce (agua con tapa de dulce): líquido color ámbar translúcido con un reflejo claro, un trocito de tapa de dulce café oscuro asomando en el fondo y burbujitas; una rodaja de limón en el borde. Se ve fresca. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. Un solo objeto centrado, ocupando cerca del 75 % del lienzo, vista de 3/4 desde arriba, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego.

#### 18. Tamal
- **Archivo:** `item-tamal.png` (512×512, fondo transparente) → `assets-src/chatgpt/`
- **Se conecta a:** ítem **353** · `tamal` → `src/assets/items-gpt/tamal.png` (ver «Cómo se conecta», sección 5)
- **Hoy:** poco reconocible
- **Prompt:**

> Ícono de videojuego en estilo plano (flat) de tamal. Un tamal tico envuelto en hoja de plátano verde, atado con cabuya en forma de cruz; una punta está abierta y deja ver la masa amarilla con un pedacito de carne y una tira de chile rojo. Forma rectangular achatada, con las hojas dobladas. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. Un solo objeto centrado, ocupando cerca del 75 % del lienzo, vista de 3/4 desde arriba, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego.

#### 19. Ceviche
- **Archivo:** `item-ceviche.png` (512×512, fondo transparente) → `assets-src/chatgpt/`
- **Se conecta a:** ítem **366** · `ceviche` → `src/assets/items-gpt/ceviche.png` (ver «Cómo se conecta», sección 5)
- **Hoy:** dibujo pequeño y muy detallado, se pierde a 64 px
- **Prompt:**

> Ícono de videojuego en estilo plano (flat) de ceviche. Una copa ancha de vidrio llena de ceviche de pescado blanco, con cilantro picado verde, cebolla morada y trocitos de chile dulce rojo, una rodaja de limón en el borde y dos galletas saladas al lado. Colores frescos. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. Un solo objeto centrado, ocupando cerca del 75 % del lienzo, vista de 3/4 desde arriba, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego.

#### 20. Empanada
- **Archivo:** `item-empanada.png` (512×512, fondo transparente) → `assets-src/chatgpt/`
- **Se conecta a:** ítem **393** · `empanada` → `src/assets/items-gpt/empanada.png` (ver «Cómo se conecta», sección 5)
- **Hoy:** parece una pepita de oro (IoU 0.83) y un plátano
- **Prompt:**

> Ícono de videojuego en estilo plano (flat) de empanada. Una empanada tica de media luna: masa dorada tostada con el borde repulgado en zigzag, brillo suave, y un lado abierto que deja ver el relleno de picadillo rojizo. Se ve crujiente y caliente. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. Un solo objeto centrado, ocupando cerca del 75 % del lienzo, vista de 3/4 desde arriba, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego.

#### 21. Cajeta de leche
- **Archivo:** `item-cajeta.png` (512×512, fondo transparente) → `assets-src/chatgpt/`
- **Se conecta a:** ítem **396** · `cajeta` → `src/assets/items-gpt/cajeta.png` (ver «Cómo se conecta», sección 5)
- **Hoy:** se parece a un ladrillo y a las tanelas
- **Prompt:**

> Ícono de videojuego en estilo plano (flat) de cajeta de leche. Una cajita redonda de madera clara abierta, llena de cajeta (dulce de leche) cremosa de color caramelo con un remolino en la superficie, y una cucharita de madera apoyada al lado con un poco de cajeta brillando. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. Un solo objeto centrado, ocupando cerca del 75 % del lienzo, vista de 3/4 desde arriba, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego.

#### 22. Carne asada
- **Archivo:** `item-cooked_meat.png` (512×512, fondo transparente) → `assets-src/chatgpt/`
- **Se conecta a:** ítem **265** · `cooked_meat` → `src/assets/items-gpt/cooked_meat.png` (ver «Cómo se conecta», sección 5)
- **Hoy:** se parece a un ladrillo (IoU 0.92)
- **Prompt:**

> Ícono de videojuego en estilo plano (flat) de carne asada. Un bistec asado dorado oscuro con marcas de parrilla cruzadas, un borde de grasa dorada brillante, un hueso de punta blanca que sale abajo a la izquierda, y dos hilos de humo. Mismo tamaño y ángulo que la carne cruda, pero ya cocinada. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. Un solo objeto centrado, ocupando cerca del 75 % del lienzo, vista de 3/4 desde arriba, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego.


### Materiales y envases (10)

#### 23. Balde
- **Archivo:** `item-bucket.png` (512×512, fondo transparente) → `assets-src/chatgpt/`
- **Se conecta a:** ítem **289** · `bucket` → `src/assets/items-gpt/bucket.png` (ver «Cómo se conecta», sección 5)
- **Hoy:** los cuatro baldes tienen exactamente la misma silueta (IoU 0.99–1.00); solo cambia el contenido
- **Prompt:**

> Ícono de videojuego en estilo plano (flat) de balde. Un balde de lata gris con asa de alambre levantada, abollado, con la boca ovalada y vacía (se ve el interior oscuro) y un aro de metal más claro en el borde. Familia de cuatro baldes: este es el vacío. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. Un solo objeto centrado, ocupando cerca del 75 % del lienzo, vista de 3/4 desde arriba, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego.

#### 24. Balde con agua
- **Archivo:** `item-water_bucket.png` (512×512, fondo transparente) → `assets-src/chatgpt/`
- **Se conecta a:** ítem **290** · `water_bucket` → `src/assets/items-gpt/water_bucket.png` (ver «Cómo se conecta», sección 5)
- **Hoy:** idéntico al balde vacío salvo el color
- **Prompt:**

> Ícono de videojuego en estilo plano (flat) de balde con agua. El mismo balde de lata gris con asa, ahora lleno hasta el borde de agua azul clara brillante, con una ola suave en la superficie, un reflejo blanco y una gotita que cae por el costado. El mismo tamaño y ángulo que el balde vacío. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. Un solo objeto centrado, ocupando cerca del 75 % del lienzo, vista de 3/4 desde arriba, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego.

#### 25. Balde con lava
- **Archivo:** `item-lava_bucket.png` (512×512, fondo transparente) → `assets-src/chatgpt/`
- **Se conecta a:** ítem **291** · `lava_bucket` → `src/assets/items-gpt/lava_bucket.png` (ver «Cómo se conecta», sección 5)
- **Hoy:** idéntico al balde vacío salvo el color
- **Prompt:**

> Ícono de videojuego en estilo plano (flat) de balde con lava. El mismo balde de lata gris con asa, lleno de lava naranja y amarilla incandescente con burbujas y una costra oscura, un resplandor rojizo alrededor del borde y una chispa que sube. El mismo tamaño y ángulo que el balde vacío. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. Un solo objeto centrado, ocupando cerca del 75 % del lienzo, vista de 3/4 desde arriba, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego.

#### 26. Balde de leche
- **Archivo:** `item-milk_bucket.png` (512×512, fondo transparente) → `assets-src/chatgpt/`
- **Se conecta a:** ítem **292** · `milk_bucket` → `src/assets/items-gpt/milk_bucket.png` (ver «Cómo se conecta», sección 5)
- **Hoy:** idéntico al balde vacío salvo el color
- **Prompt:**

> Ícono de videojuego en estilo plano (flat) de balde de leche. El mismo balde de lata gris con asa, lleno de leche blanca cremosa con un poco de espuma que se desborda en una gota gruesa por el costado, y un brillo suave. El mismo tamaño y ángulo que el balde vacío. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. Un solo objeto centrado, ocupando cerca del 75 % del lienzo, vista de 3/4 desde arriba, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego.

#### 27. Alcohol
- **Archivo:** `item-alcohol.png` (512×512, fondo transparente) → `assets-src/chatgpt/`
- **Se conecta a:** ítem **441** · `alcohol` → `src/assets/items-gpt/alcohol.png` (ver «Cómo se conecta», sección 5)
- **Hoy:** se confunde con el guaro (IoU 0.95) y el agua bendita
- **Prompt:**

> Ícono de videojuego en estilo plano (flat) de alcohol. Una botella chaparra de plástico blanco con tapa azul y una etiqueta celeste con una gotita grande dibujada; un asa pequeña y la boca con un tapón de rosca. Aspecto de botiquín, limpio y médico, sin cruces ni texto. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. Un solo objeto centrado, ocupando cerca del 75 % del lienzo, vista de 3/4 desde arriba, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego.

#### 28. Guaro de caña
- **Archivo:** `item-guaro.png` (512×512, fondo transparente) → `assets-src/chatgpt/`
- **Se conecta a:** ítem **375** · `guaro` → `src/assets/items-gpt/guaro.png` (ver «Cómo se conecta», sección 5)
- **Hoy:** se confunde con el alcohol y el agua bendita
- **Prompt:**

> Ícono de videojuego en estilo plano (flat) de guaro de caña. Una botella de vidrio transparente alargada con tapa metálica plateada y una etiqueta roja redonda con un tallo de caña de azúcar dibujado en blanco, líquido casi incoloro con un brillo. Una botella de licor de caña sin ningún texto. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. Un solo objeto centrado, ocupando cerca del 75 % del lienzo, vista de 3/4 desde arriba, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego.

#### 29. Agua bendita
- **Archivo:** `item-agua_bendita.png` (512×512, fondo transparente) → `assets-src/chatgpt/`
- **Se conecta a:** ítem **523** · `agua_bendita` → `src/assets/items-gpt/agua_bendita.png` (ver «Cómo se conecta», sección 5)
- **Hoy:** se confunde con el alcohol y el guaro
- **Prompt:**

> Ícono de videojuego en estilo plano (flat) de agua bendita. Una botellita de vidrio azul claro con tapón de corcho y un hilo rojo amarrado al cuello, una cruz dorada sencilla en la panza, líquido celeste que brilla, y un halo de luz suave alrededor. Sin texto. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. Un solo objeto centrado, ocupando cerca del 75 % del lienzo, vista de 3/4 desde arriba, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego.

#### 30. Ladrillo
- **Archivo:** `item-brick.png` (512×512, fondo transparente) → `assets-src/chatgpt/`
- **Se conecta a:** ítem **264** · `brick` → `src/assets/items-gpt/brick.png` (ver «Cómo se conecta», sección 5)
- **Hoy:** se parece a carne asada, batea y cajeta (IoU 0.81–0.92)
- **Prompt:**

> Ícono de videojuego en estilo plano (flat) de ladrillo. Un ladrillo de barro cocido terracota, rectangular, con tres agujeros redondos visibles en la cara de arriba, aristas ligeramente desgastadas, dos tonos de rojo ladrillo y una mancha de hollín; visto en 3/4 con la cara de arriba, el costado y la punta. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. El objeto en diagonal de abajo-izquierda a arriba-derecha, centrado, ocupando cerca del 85 % del lienzo y con 20 px de aire. Vista de 3/4 ligeramente desde arriba, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego.

#### 31. Tapa de dulce
- **Archivo:** `item-tapa_dulce.png` (512×512, fondo transparente) → `assets-src/chatgpt/`
- **Se conecta a:** ítem **297** · `tapa_dulce` → `src/assets/items-gpt/tapa_dulce.png` (ver «Cómo se conecta», sección 5)
- **Hoy:** se confunde con cajuela, mochila y libro (IoU 0.81–0.83)
- **Prompt:**

> Ícono de videojuego en estilo plano (flat) de tapa de dulce. Una tapa de dulce (panela): un bloque en forma de cono truncado achatado de azúcar de caña caramelizada, café ámbar oscuro con brillo, la superficie de arriba un poco más clara con grietitas, y una hoja seca de caña pegada al costado. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. Un solo objeto centrado, ocupando cerca del 75 % del lienzo, vista de 3/4 desde arriba, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego.

#### 32. Azufre
- **Archivo:** `item-azufre.png` (512×512, fondo transparente) → `assets-src/chatgpt/`
- **Se conecta a:** ítem **379** · `azufre` → `src/assets/items-gpt/azufre.png` (ver «Cómo se conecta», sección 5)
- **Hoy:** parece una pepita de oro (IoU 0.91)
- **Prompt:**

> Ícono de videojuego en estilo plano (flat) de azufre. Un racimo de cristales de azufre amarillo limón pálido, angulosos y con caras brillantes de dos tonos, con un toque verdoso, saliendo de una piedra gris volcánica pequeña. Debe verse claramente distinto del oro: más pálido, con cristales puntiagudos. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. Un solo objeto centrado, ocupando cerca del 75 % del lienzo, vista de 3/4 desde arriba, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego.


### Objetos de historia (8)

#### 33. Chancleta de Zenaida
- **Archivo:** `item-chancleta_zenaida.png` (512×512, fondo transparente) → `assets-src/chatgpt/`
- **Se conecta a:** ítem **505** · `chancleta_zenaida` → `src/assets/items-gpt/chancleta_zenaida.png` (ver «Cómo se conecta», sección 5)
- **Hoy:** pobre: 3 colores, se lee como una mancha café
- **Prompt:**

> Ícono de videojuego en estilo plano (flat) de chancleta de zenaida. Una chancleta de hule vieja y querida: suela azul gastada con huellas blancas del pie, tira en V de color blanco amarillento, una orilla desgastada y un pellizco en la punta. Vista desde arriba en leve diagonal. Se ve como el arma de una abuela tica. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. Un solo objeto centrado, ocupando cerca del 75 % del lienzo, vista de 3/4 desde arriba, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego.

#### 34. Cucharón de Zenaida
- **Archivo:** `item-cucharon_zenaida.png` (512×512, fondo transparente) → `assets-src/chatgpt/`
- **Se conecta a:** ítem **507** · `cucharon_zenaida` → `src/assets/items-gpt/cucharon_zenaida.png` (ver «Cómo se conecta», sección 5)
- **Hoy:** pobre: 3 colores y forma plana
- **Prompt:**

> Ícono de videojuego en estilo plano (flat) de cucharón de zenaida. Un cucharón grande de madera oscura, con mango largo y un corazoncito tallado en la punta del mango, la cuchara honda y manchada de uso, con un brillo grasoso. Se ve el cucharón de cocinar de toda la vida. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. El objeto en diagonal de abajo-izquierda a arriba-derecha, centrado, ocupando cerca del 85 % del lienzo y con 20 px de aire. Vista de 3/4 ligeramente desde arriba, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego.

#### 35. Delantal de Zenaida
- **Archivo:** `item-delantal_zenaida.png` (512×512, fondo transparente) → `assets-src/chatgpt/`
- **Se conecta a:** ítem **504** · `delantal_zenaida` → `src/assets/items-gpt/delantal_zenaida.png` (ver «Cómo se conecta», sección 5)
- **Hoy:** pobre: 4 colores
- **Prompt:**

> Ícono de videojuego en estilo plano (flat) de delantal de zenaida. Un delantal de cocina de tela blanca con flores rojas y verdes estampadas, un bolsillo grande al frente con una cuchara asomando, las cintas del cuello y de la cintura colgando; pequeñas manchas de harina. Visto de frente, un poco arrugado. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. Un solo objeto centrado, ocupando cerca del 75 % del lienzo, vista de 3/4 desde arriba, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego.

#### 36. Sombrero de Zenaida
- **Archivo:** `item-sombrero_zenaida.png` (512×512, fondo transparente) → `assets-src/chatgpt/`
- **Se conecta a:** ítem **506** · `sombrero_zenaida` → `src/assets/items-gpt/sombrero_zenaida.png` (ver «Cómo se conecta», sección 5)
- **Hoy:** pobre: 4 colores; se parece al sombrero sabanero
- **Prompt:**

> Ícono de videojuego en estilo plano (flat) de sombrero de zenaida. Un sombrero de paja de ala ancha y copa redonda, tejido a mano, con una cinta de tela estampada de flores rojas y una margarita seca prendida; la paja un poco deshilachada en el borde. Debe distinguirse del sombrero de sabanero: más suave y de ala caída. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. Un solo objeto centrado, ocupando cerca del 75 % del lienzo, vista de 3/4 desde arriba, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego.

#### 37. Tablilla
- **Archivo:** `item-tablilla.png` (512×512, fondo transparente) → `assets-src/chatgpt/`
- **Se conecta a:** ítem **508** · `tablilla` → `src/assets/items-gpt/tablilla.png` (ver «Cómo se conecta», sección 5)
- **Hoy:** pobre y se lee como una escalera
- **Prompt:**

> Ícono de videojuego en estilo plano (flat) de tablilla. Una tablilla para una pierna quebrada: dos tablitas de madera clara paralelas, sujetas con tres vendas blancas anudadas, con un acolchado de tela arriba y las puntas de las vendas colgando. Debe verse como un entablillado, no como una escalera. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. El objeto en diagonal de abajo-izquierda a arriba-derecha, centrado, ocupando cerca del 85 % del lienzo y con 20 px de aire. Vista de 3/4 ligeramente desde arriba, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego.

#### 38. Pañuelo de los Chatas
- **Archivo:** `item-panuelo_chata.png` (512×512, fondo transparente) → `assets-src/chatgpt/`
- **Se conecta a:** ítem **528** · `panuelo_chata` → `src/assets/items-gpt/panuelo_chata.png` (ver «Cómo se conecta», sección 5)
- **Hoy:** pobre: 4 colores
- **Prompt:**

> Ícono de videojuego en estilo plano (flat) de pañuelo de los chatas. Un pañuelo triangular negro, anudado, como el que se pone un bandido de carretera, con una calaverita blanca pequeña estampada en el centro y los extremos del nudo colgando; bordes un poco deshilachados. Sin texto. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. Un solo objeto centrado, ocupando cerca del 75 % del lienzo, vista de 3/4 desde arriba, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego.

#### 39. Escritura de lote con vista al mar
- **Archivo:** `item-escritura.png` (512×512, fondo transparente) → `assets-src/chatgpt/`
- **Se conecta a:** ítem **389** · `escritura` → `src/assets/items-gpt/escritura.png` (ver «Cómo se conecta», sección 5)
- **Hoy:** idéntica a la hoja de firmas (IoU 1.00)
- **Prompt:**

> Ícono de videojuego en estilo plano (flat) de escritura de lote con vista al mar. Un pergamino enrollado a medias, color crema, atado con una cinta azul turquesa y un sello de lacre dorado, que muestra dibujada una palmera, el sol y una ola. Se ve como el título de un lote frente al mar. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. Un solo objeto centrado, ocupando cerca del 75 % del lienzo, vista de 3/4 desde arriba, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego.

#### 40. Hoja de firmas
- **Archivo:** `item-hoja_firmas.png` (512×512, fondo transparente) → `assets-src/chatgpt/`
- **Se conecta a:** ítem **511** · `hoja_firmas` → `src/assets/items-gpt/hoja_firmas.png` (ver «Cómo se conecta», sección 5)
- **Hoy:** idéntica a la escritura (IoU 1.00)
- **Prompt:**

> Ícono de videojuego en estilo plano (flat) de hoja de firmas. Una hoja de papel blanca de trámite con renglones, una columna de garabatos de firmas en tinta azul, dos sellos de tinta rojos torcidos, un clip y una esquina doblada. Se ve como un formulario municipal, sin texto legible. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. Un solo objeto centrado, ocupando cerca del 75 % del lienzo, vista de 3/4 desde arriba, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego.


---

## 4. Revisión de cada imagen antes de aceptarla

Para cada PNG, marcar:
- [ ] 512×512, **fondo transparente** (las cuatro esquinas con alfa 0), sin sombra proyectada en el suelo ni marco.
- [ ] El objeto ocupa 75–85 % del lienzo, centrado, con aire.
- [ ] **Reducido a 64 px** se reconoce igual que el de pixel art de al lado (hacer la prueba junto al ícono actual).
- [ ] Brillo arriba a la izquierda, sombra abajo a la derecha, **sin contorno negro**, sin texto.
- [ ] Usa la paleta del material (madera, piedra, hierro, diamante…).
- [ ] **No se confunde con su pareja** de la tabla 1.2 (el pico de piedra no se parece al de hierro; la azada no parece pico; los cuatro baldes se distinguen por el contenido a simple vista).
- [ ] No imita ningún ícono de otro juego.

Si falla alguno, repetir el prompt agregando lo que faltó (por ejemplo: *«la hoja de la azada debe ser ancha y perpendicular al mango, sin puntas»*).

---

## 5. Cómo se conecta (para la constructora; no se editó nada)

**Punto de partida:** `loadSprites` (`textures.js`) da prioridad a `src/assets/items/<clave>.png`, después al campo `sprite` y al final a `paintFlat`. Por eso **poner un PNG nuevo en `public/sprites/` o asignar `sprite` no alcanza** para los 40 de este lote: **todos ya tienen un PNG en `src/assets/items/` y ese gana**. Propuesta mínima (A) y alternativa (B):

**A. Carpeta nueva `src/assets/items-gpt/<clave>.png` con prioridad máxima** (recomendada):
1. En `textures.js`, junto a `NUEVOS`, un `import.meta.glob('./assets/items-gpt/*.png', { eager: true, query: '?url', import: 'default' })` y, **antes** del `if (nuevoURL[...])`, una rama que cargue ese PNG si existe.
2. Dibujarlo con **`imageSmoothingEnabled = true` y `imageSmoothingQuality = 'high'`** (el camino de pixel art lo apaga a propósito). Para que no salga con dientes de sierra al bajar de 512 a 64 px, **reducir en dos pasos** (512 → 128 → 64) o convertir de antemano a 128×128.
3. Subir `ICON` de 64 a **128** para el arte nuevo (la plata y el resto se ven mejor) y dejar `.slot img` en `image-rendering: auto` (hoy `pixelated`; con el pixel art de 64 px el cambio es casi invisible).
4. Un `tools/convertir-arte.mjs` que lea `assets-src/chatgpt/item-*.png`, los pase a 128×128 con buen filtro (con `ffmpeg`, como `cortar-hojas.mjs`) y los deje en `src/assets/items-gpt/<clave>.png`. Una prueba en `tools/revisar-nombres.mjs` que avise de archivos cuya clave no existe en `ITEMS`.

**B. Sustituir el PNG viejo:** copiar el nuevo a `src/assets/items/<clave>.png`. **No recomendado:** el camino de ese directorio usa vecino más cercano y se vería mal.

**Los que ya están listos para conectar** (no son de este lote): la plata (`moneda-*.png`, `billete-*.png`) y `item-carne.png`, `item-palo.png`, que pasan por el mismo camino nuevo.

---

## 6. Notas

- **No se generó ninguna imagen** ni se tocó código; este archivo es el pedido.
- Los **IoU** y diferencias de color se midieron con un script sobre los 291 PNG de `src/assets/items/` (silueta = píxeles con alfa ≥ 40; se comparan los pares con IoU ≥ 0.80 y diferencia de color < 45). Los nombres de ítem (ids y claves) salen de `ITEMS` en `blocks.js` del `HEAD`.
- Si nanoyackson prefiere probar el estilo antes de pedir los 40, empezar por **tres** que cubren los tres casos más difíciles: `item-machete.png` (herramienta tica), `item-water_bucket.png` (par idéntico) y `item-casado.png` (plato complejo).
