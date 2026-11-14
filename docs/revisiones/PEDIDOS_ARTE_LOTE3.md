# Pedidos de arte con GPT — lote 3

Pedido: encargo 19 de la orquestadora. Mismo formato que `PEDIDOS_ARTE_LOTE1.md` (la guía de estilo de la sección 0 de ese archivo, tal cual, y una fila lista para Codex por imagen). **No toca `docs/PEDIDOS_ARTE.md`** (lo edita la constructora). Solo lectura sobre el código.

**Cuántas filas son:** 75 (sección 1: **40**, sección 2: **22**, sección 3: **13**, de las cuales 7 son las pedidas y 6 son extra).

---

## 0. Guía de estilo y qué cambia respecto del lote 1

**Se usa la guía de estilo del lote 1 sin cambios** (§0 de `PEDIDOS_ARTE_LOTE1.md`: formas planas redondeadas, brillo arriba a la izquierda, banda de sombra abajo a la derecha, **sin contorno negro**, sin texto, 512×512 con fondo transparente, legible a 64 px). Cada prompt de abajo ya lleva la guía dentro (no hace falta contexto previo). Lo único nuevo:

| Aspecto | Regla para el lote 3 |
|---|---|
| **Paleta nueva: jade** | verde jade `#3fb58a`, brillo `#8be8c0`, sombra `#1f7a5a`; el aro y los detalles, oro `#f4c542` (paleta del lote 1). |
| **Paleta nueva: cuero** | café rojizo `#a5683a`, brillo `#d99a62`, sombra `#6e4020`, con costuras de cabuya crema `#d9c28f`. (Más rojizo que la madera `#9a6330` para que no se confundan.) |
| **Armas** | en diagonal de abajo-izquierda a arriba-derecha, ≈ 85 % del lienzo (como el lote 1). |
| **Piezas de armadura y escudos** | **de frente** con un ligero giro de 3/4, centradas, ≈ 80 %. Botas y pantalones se dibujan como **un par / una pieza** completos. |
| **Trofeos** | una **placa de madera oscura con borde de cabuya** y encima la cabeza o figura **tallada y pintada a mano** (artesanía, nada realista ni sangriento); **la misma placa en los 9** para que se vean como una colección. |
| **Retratos** | cabeza y hombros (o el frente del cuerpo), **mirando al frente con un ligero giro de 3/4**, ≈ 90 % del lienzo, ojos grandes y claros; se muestran a **48 px** en la barra de vida, así que la silueta manda. |
| **Cruz del botiquín** | **verde**, nunca roja (la cruz roja es un emblema protegido). |
| **Originalidad** | Ninguna espada, armadura ni jefe debe parecerse a las de otros juegos: por eso llevan detalles propios (cabuya, jade, espirales precolombinas, corona de ramitas). |

**Por qué estos 40** (y no otros): el pixel art viejo sigue en **262 de los 304 ítems** (hoy `ARTE` cubre 42 ítems y 1 bloque). Seguí las prioridades pedidas: **armas y escudos** (11: espadas de madera, piedra, hierro, diamante y jade, arco, honda, jabalina, y los tres escudos; el **machete ya tiene arte**), **las 16 piezas de armadura** (4 materiales × 4 tipos), **minerales y lingotes** (5), **cultivos** (4) y **remedios** (4). Lo que **queda para un lote 4** por falta de cupo: hachas y palas de madera y diamante (2 y 2) y azada de diamante y de jade, `flecha` (327), `quartz` (272), `jade_shard` (273), `coffee_cherry` (294), `papaya` (276), `yuca` (480), `cacao` (408), `mango` (377), `piña` (467), `sabila`, `manzanilla`, `hierbabuena`, `jengibre` (428–431), `repelente` (423), `guaco` (524), `lanza`, `mazo`, `garrote` (402–404), `machete_doble` (439), `cerbatana` (433) y los peces (361–365). *Criterio de «más vistos»:* sin juego corriendo no medí la frecuencia real; ordené por lo que cada categoría cruza en **recetas, botín y tiendas** (los materiales de armadura y los lingotes están en casi toda receta; las espadas y los escudos son lo que todos llevan en la mano; el botiquín y la venda se ven en la barra rápida).

---

## 1. Los 40 objetos de uso diario (todavía con pixel art)

### Armas y escudos (11)

#### 1. Espada de madera
- **Archivo:** `item-wood_sword.png` (512×512, fondo transparente) → `assets-src/chatgpt/`
- **Se conecta a:** ítem **312** · `wood_sword` → `public/sprites/arte/wood_sword.png`
- **Hoy:** pixel art 32×32
- **Prompt:**

> Ícono de videojuego en estilo plano (flat) de espada de madera. Una espada de entrenamiento tosca, tallada de madera dura de guayabo: hoja ancha y plana con la punta redondeada y una veta clara al centro, cruceta corta de madera, mango envuelto con cabuya crema y un pomo de nudo. Madera café cálido, sin metal. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. El objeto en diagonal de abajo-izquierda a arriba-derecha (mango abajo, parte activa arriba), centrado, ocupando cerca del 85 % del lienzo y con 20 px de aire. Vista de 3/4 ligeramente desde arriba, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego.

#### 2. Espada de piedra
- **Archivo:** `item-stone_sword.png` (512×512, fondo transparente) → `assets-src/chatgpt/`
- **Se conecta a:** ítem **313** · `stone_sword` → `public/sprites/arte/stone_sword.png`
- **Hoy:** pixel art 32×32
- **Prompt:**

> Ícono de videojuego en estilo plano (flat) de espada de piedra. Una hoja ancha de piedra gris, con el filo ligeramente dentado como de lascas, amarrada a un mango de madera con tres vueltas de cabuya; cruceta de madera pequeña. Se ve pesada y hecha a mano. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. El objeto en diagonal de abajo-izquierda a arriba-derecha (mango abajo, parte activa arriba), centrado, ocupando cerca del 85 % del lienzo y con 20 px de aire. Vista de 3/4 ligeramente desde arriba, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego.

#### 3. Espada de hierro
- **Archivo:** `item-iron_sword.png` (512×512, fondo transparente) → `assets-src/chatgpt/`
- **Se conecta a:** ítem **314** · `iron_sword` → `public/sprites/arte/iron_sword.png`
- **Hoy:** pixel art 32×32
- **Prompt:**

> Ícono de videojuego en estilo plano (flat) de espada de hierro. Una espada recta de hierro gris azulado claro con un canal central más claro, la cruceta curvada hacia abajo, el mango envuelto en cuero café con una tira de tela roja en el extremo y un pomo redondo. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. El objeto en diagonal de abajo-izquierda a arriba-derecha (mango abajo, parte activa arriba), centrado, ocupando cerca del 85 % del lienzo y con 20 px de aire. Vista de 3/4 ligeramente desde arriba, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego.

#### 4. Espada de diamante
- **Archivo:** `item-diamond_sword.png` (512×512, fondo transparente) → `assets-src/chatgpt/`
- **Se conecta a:** ítem **315** · `diamond_sword` → `public/sprites/arte/diamond_sword.png`
- **Hoy:** pixel art 32×32
- **Prompt:**

> Ícono de videojuego en estilo plano (flat) de espada de diamante. Una espada de hoja facetada turquesa translúcida, con facetas más claras y más oscuras que dan volumen, un canal central claro, la cruceta corta del mismo turquesa y el mango envuelto en tela roja con un pomo turquesa. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. El objeto en diagonal de abajo-izquierda a arriba-derecha (mango abajo, parte activa arriba), centrado, ocupando cerca del 85 % del lienzo y con 20 px de aire. Vista de 3/4 ligeramente desde arriba, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego.

#### 5. Espada de jade
- **Archivo:** `item-jade_sword.png` (512×512, fondo transparente) → `assets-src/chatgpt/`
- **Se conecta a:** ítem **324** · `jade_sword` → `public/sprites/arte/jade_sword.png`
- **Hoy:** pixel art 32×32
- **Prompt:**

> Ícono de videojuego en estilo plano (flat) de espada de jade. Una hoja verde jade pulida con forma de hoja larga de laurel, con una espiral tallada en la base de la hoja; cruceta pequeña dorada y mango de madera con cabuya y una borla roja. Verde jade `#3fb58a` con brillo `#8be8c0` y sombra `#1f7a5a`. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. El objeto en diagonal de abajo-izquierda a arriba-derecha (mango abajo, parte activa arriba), centrado, ocupando cerca del 85 % del lienzo y con 20 px de aire. Vista de 3/4 ligeramente desde arriba, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego.

#### 6. Arco
- **Archivo:** `item-arco.png` (512×512, fondo transparente) → `assets-src/chatgpt/`
- **Se conecta a:** ítem **326** · `arco` → `public/sprites/arte/arco.png`
- **Hoy:** pixel art 32×32
- **Prompt:**

> Ícono de videojuego en estilo plano (flat) de arco. Un arco de madera de guayabo, curvo y sin flecha, con la cuerda crema tensa, la empuñadura envuelta en cuero café y un lazo de cabuya en una de las puntas. Madera café cálido con una veta clara. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. El objeto en diagonal de abajo-izquierda a arriba-derecha (mango abajo, parte activa arriba), centrado, ocupando cerca del 85 % del lienzo y con 20 px de aire. Vista de 3/4 ligeramente desde arriba, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego.

#### 7. Honda
- **Archivo:** `item-honda.png` (512×512, fondo transparente) → `assets-src/chatgpt/`
- **Se conecta a:** ítem **432** · `honda` → `public/sprites/arte/honda.png`
- **Hoy:** pixel art 32×32
- **Prompt:**

> Ícono de videojuego en estilo plano (flat) de honda. Una honda tica: una bolsa de cuero ovalada con una piedra gris redonda dentro y dos cuerdas largas de cabuya que forman una U hacia arriba. (Excepción de la regla: aquí no hay mango; la diagonal la da la U de las cuerdas.) Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. El objeto en diagonal de abajo-izquierda a arriba-derecha (mango abajo, parte activa arriba), centrado, ocupando cerca del 85 % del lienzo y con 20 px de aire. Vista de 3/4 ligeramente desde arriba, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego.

#### 8. Jabalina
- **Archivo:** `item-jabalina.png` (512×512, fondo transparente) → `assets-src/chatgpt/`
- **Se conecta a:** ítem **435** · `jabalina` → `public/sprites/arte/jabalina.png`
- **Hoy:** pixel art 32×32
- **Prompt:**

> Ícono de videojuego en estilo plano (flat) de jabalina. Una jabalina: asta larga y delgada de madera clara, con la punta en forma de hoja de piedra gris amarrada con cabuya y, en el extremo de abajo, tres plumas (roja, verde y crema) atadas. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. El objeto en diagonal de abajo-izquierda a arriba-derecha (mango abajo, parte activa arriba), centrado, ocupando cerca del 85 % del lienzo y con 20 px de aire. Vista de 3/4 ligeramente desde arriba, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego.

#### 9. Escudo de madera
- **Archivo:** `item-escudo_madera.png` (512×512, fondo transparente) → `assets-src/chatgpt/`
- **Se conecta a:** ítem **399** · `escudo_madera` → `public/sprites/arte/escudo_madera.png`
- **Hoy:** pixel art 32×32
- **Prompt:**

> Ícono de videojuego en estilo plano (flat) de escudo de madera. Un escudo redondo hecho de tablas de madera café unidas por dos travesaños oscuros con remaches, el borde reforzado con cabuya crema y un pequeño botón central de madera más clara. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. Una sola pieza centrada, casi de frente con un ligero giro de 3/4, ocupando cerca del 80 % del lienzo y con 20 px de aire, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego.

#### 10. Escudo de hierro
- **Archivo:** `item-escudo_hierro.png` (512×512, fondo transparente) → `assets-src/chatgpt/`
- **Se conecta a:** ítem **400** · `escudo_hierro` → `public/sprites/arte/escudo_hierro.png`
- **Hoy:** pixel art 32×32
- **Prompt:**

> Ícono de videojuego en estilo plano (flat) de escudo de hierro. Un escudo redondo de hierro gris azulado, con un borde grueso más claro, remaches parejos y un botón central saliente de hierro; una franja vertical más oscura lo parte en dos tonos. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. Una sola pieza centrada, casi de frente con un ligero giro de 3/4, ocupando cerca del 80 % del lienzo y con 20 px de aire, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego.

#### 11. Escudo de jade
- **Archivo:** `item-escudo_jade.png` (512×512, fondo transparente) → `assets-src/chatgpt/`
- **Se conecta a:** ítem **401** · `escudo_jade` → `public/sprites/arte/escudo_jade.png`
- **Hoy:** pixel art 32×32
- **Prompt:**

> Ícono de videojuego en estilo plano (flat) de escudo de jade. Un escudo redondo de jade verde pulido, con un aro dorado grueso en el borde y un botón central dorado; una espiral tallada alrededor del botón. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. Una sola pieza centrada, casi de frente con un ligero giro de 3/4, ocupando cerca del 80 % del lienzo y con 20 px de aire, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego.

### Armaduras, 4 piezas por material (16)

#### 12. Casco de cuero
- **Archivo:** `item-leather_head.png` (512×512, fondo transparente) → `assets-src/chatgpt/`
- **Se conecta a:** ítem **330** · `leather_head` → `public/sprites/arte/leather_head.png`
- **Hoy:** pixel art 32×32
- **Prompt:**

> Ícono de videojuego en estilo plano (flat) de casco de cuero. Un gorro-casco de cuero café de tres paneles, con costuras de cabuya crema bien visibles, orejeras cortas y una correa bajo la barbilla con una hebilla dorada chica. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. Una sola pieza centrada, casi de frente con un ligero giro de 3/4, ocupando cerca del 80 % del lienzo y con 20 px de aire, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego.

#### 13. Pechera de cuero
- **Archivo:** `item-leather_chest.png` (512×512, fondo transparente) → `assets-src/chatgpt/`
- **Se conecta a:** ítem **331** · `leather_chest` → `public/sprites/arte/leather_chest.png`
- **Hoy:** pixel art 32×32
- **Prompt:**

> Ícono de videojuego en estilo plano (flat) de pechera de cuero. Un chaleco de cuero café con tirantes anchos, cordones de cabuya cruzados sobre el pecho y dos bolsillos cosidos al frente. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. Una sola pieza centrada, casi de frente con un ligero giro de 3/4, ocupando cerca del 80 % del lienzo y con 20 px de aire, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego.

#### 14. Pantalones de cuero
- **Archivo:** `item-leather_legs.png` (512×512, fondo transparente) → `assets-src/chatgpt/`
- **Se conecta a:** ítem **332** · `leather_legs` → `public/sprites/arte/leather_legs.png`
- **Hoy:** pixel art 32×32
- **Prompt:**

> Ícono de videojuego en estilo plano (flat) de pantalones de cuero. Un pantalón de cuero café visto de frente, con rodilleras de cuero más oscuro cosidas con cabuya y un cinturón con hebilla dorada chica. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. Una sola pieza centrada, casi de frente con un ligero giro de 3/4, ocupando cerca del 80 % del lienzo y con 20 px de aire, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego.

#### 15. Botas de cuero
- **Archivo:** `item-leather_feet.png` (512×512, fondo transparente) → `assets-src/chatgpt/`
- **Se conecta a:** ítem **333** · `leather_feet` → `public/sprites/arte/leather_feet.png`
- **Hoy:** pixel art 32×32
- **Prompt:**

> Ícono de videojuego en estilo plano (flat) de botas de cuero. Un par de botas altas de cuero café, una al lado de la otra, con cordones de cabuya y suela más oscura. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. Una sola pieza centrada, casi de frente con un ligero giro de 3/4, ocupando cerca del 80 % del lienzo y con 20 px de aire, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego.

#### 16. Casco de hierro
- **Archivo:** `item-iron_head.png` (512×512, fondo transparente) → `assets-src/chatgpt/`
- **Se conecta a:** ítem **334** · `iron_head` → `public/sprites/arte/iron_head.png`
- **Hoy:** pixel art 32×32
- **Prompt:**

> Ícono de videojuego en estilo plano (flat) de casco de hierro. Un casco de hierro gris azulado redondeado, con una banda frontal con remaches, un cubrenariz corto y una cresta baja en el centro; interior de cuero rojo asomando en el borde. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. Una sola pieza centrada, casi de frente con un ligero giro de 3/4, ocupando cerca del 80 % del lienzo y con 20 px de aire, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego.

#### 17. Pechera de hierro
- **Archivo:** `item-iron_chest.png` (512×512, fondo transparente) → `assets-src/chatgpt/`
- **Se conecta a:** ítem **335** · `iron_chest` → `public/sprites/arte/iron_chest.png`
- **Hoy:** pixel art 32×32
- **Prompt:**

> Ícono de videojuego en estilo plano (flat) de pechera de hierro. Un peto de placas de hierro gris azulado con hombreras redondas, remaches en el borde de cada placa y un cinturón de cuero café con hebilla. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. Una sola pieza centrada, casi de frente con un ligero giro de 3/4, ocupando cerca del 80 % del lienzo y con 20 px de aire, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego.

#### 18. Pantalones de hierro
- **Archivo:** `item-iron_legs.png` (512×512, fondo transparente) → `assets-src/chatgpt/`
- **Se conecta a:** ítem **336** · `iron_legs` → `public/sprites/arte/iron_legs.png`
- **Hoy:** pixel art 32×32
- **Prompt:**

> Ícono de videojuego en estilo plano (flat) de pantalones de hierro. Un pantalón con placas de hierro gris azulado en los muslos y rodilleras redondas, el cinturón de cuero café con hebilla; visto de frente. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. Una sola pieza centrada, casi de frente con un ligero giro de 3/4, ocupando cerca del 80 % del lienzo y con 20 px de aire, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego.

#### 19. Botas de hierro
- **Archivo:** `item-iron_feet.png` (512×512, fondo transparente) → `assets-src/chatgpt/`
- **Se conecta a:** ítem **337** · `iron_feet` → `public/sprites/arte/iron_feet.png`
- **Hoy:** pixel art 32×32
- **Prompt:**

> Ícono de videojuego en estilo plano (flat) de botas de hierro. Un par de botas con puntera y tobillera de hierro gris azulado sobre cuero café, una al lado de la otra. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. Una sola pieza centrada, casi de frente con un ligero giro de 3/4, ocupando cerca del 80 % del lienzo y con 20 px de aire, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego.

#### 20. Casco de diamante
- **Archivo:** `item-diamond_head.png` (512×512, fondo transparente) → `assets-src/chatgpt/`
- **Se conecta a:** ítem **338** · `diamond_head` → `public/sprites/arte/diamond_head.png`
- **Hoy:** pixel art 32×32
- **Prompt:**

> Ícono de videojuego en estilo plano (flat) de casco de diamante. Un casco facetado de diamante turquesa, con facetas claras y oscuras, una banda frontal con una gema más clara al centro y una cresta baja translúcida. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. Una sola pieza centrada, casi de frente con un ligero giro de 3/4, ocupando cerca del 80 % del lienzo y con 20 px de aire, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego.

#### 21. Pechera de diamante
- **Archivo:** `item-diamond_chest.png` (512×512, fondo transparente) → `assets-src/chatgpt/`
- **Se conecta a:** ítem **339** · `diamond_chest` → `public/sprites/arte/diamond_chest.png`
- **Hoy:** pixel art 32×32
- **Prompt:**

> Ícono de videojuego en estilo plano (flat) de pechera de diamante. Un peto de placas turquesa facetadas con hombreras anchas, una gema clara al centro del pecho y un cinturón de cuero café. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. Una sola pieza centrada, casi de frente con un ligero giro de 3/4, ocupando cerca del 80 % del lienzo y con 20 px de aire, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego.

#### 22. Pantalones de diamante
- **Archivo:** `item-diamond_legs.png` (512×512, fondo transparente) → `assets-src/chatgpt/`
- **Se conecta a:** ítem **340** · `diamond_legs` → `public/sprites/arte/diamond_legs.png`
- **Hoy:** pixel art 32×32
- **Prompt:**

> Ícono de videojuego en estilo plano (flat) de pantalones de diamante. Un pantalón con placas turquesa facetadas en muslos y rodillas, cinturón de cuero café con una gema chica; visto de frente. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. Una sola pieza centrada, casi de frente con un ligero giro de 3/4, ocupando cerca del 80 % del lienzo y con 20 px de aire, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego.

#### 23. Botas de diamante
- **Archivo:** `item-diamond_feet.png` (512×512, fondo transparente) → `assets-src/chatgpt/`
- **Se conecta a:** ítem **341** · `diamond_feet` → `public/sprites/arte/diamond_feet.png`
- **Hoy:** pixel art 32×32
- **Prompt:**

> Ícono de videojuego en estilo plano (flat) de botas de diamante. Un par de botas con puntera y tobillera facetadas turquesa sobre cuero café, una al lado de la otra. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. Una sola pieza centrada, casi de frente con un ligero giro de 3/4, ocupando cerca del 80 % del lienzo y con 20 px de aire, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego.

#### 24. Casco de jade
- **Archivo:** `item-jade_head.png` (512×512, fondo transparente) → `assets-src/chatgpt/`
- **Se conecta a:** ítem **342** · `jade_head` → `public/sprites/arte/jade_head.png`
- **Hoy:** pixel art 32×32
- **Prompt:**

> Ícono de videojuego en estilo plano (flat) de casco de jade. Un casco de jade verde pulido con la frente tallada con una greca, dos orejeras redondas con borde dorado y un penacho corto de plumas verdes y rojas. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. Una sola pieza centrada, casi de frente con un ligero giro de 3/4, ocupando cerca del 80 % del lienzo y con 20 px de aire, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego.

#### 25. Pechera de jade
- **Archivo:** `item-jade_chest.png` (512×512, fondo transparente) → `assets-src/chatgpt/`
- **Se conecta a:** ítem **343** · `jade_chest` → `public/sprites/arte/jade_chest.png`
- **Hoy:** pixel art 32×32
- **Prompt:**

> Ícono de videojuego en estilo plano (flat) de pechera de jade. Un peto de placas de jade verde con hombreras, una banda dorada al centro y una greca tallada (zigzag y espirales) sobre el pecho. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. Una sola pieza centrada, casi de frente con un ligero giro de 3/4, ocupando cerca del 80 % del lienzo y con 20 px de aire, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego.

#### 26. Pantalones de jade
- **Archivo:** `item-jade_legs.png` (512×512, fondo transparente) → `assets-src/chatgpt/`
- **Se conecta a:** ítem **344** · `jade_legs` → `public/sprites/arte/jade_legs.png`
- **Hoy:** pixel art 32×32
- **Prompt:**

> Ícono de videojuego en estilo plano (flat) de pantalones de jade. Un pantalón con placas de jade verde en muslos y rodillas unidas con cabuya, un cinturón con una placa dorada al frente; visto de frente. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. Una sola pieza centrada, casi de frente con un ligero giro de 3/4, ocupando cerca del 80 % del lienzo y con 20 px de aire, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego.

#### 27. Botas de jade
- **Archivo:** `item-jade_feet.png` (512×512, fondo transparente) → `assets-src/chatgpt/`
- **Se conecta a:** ítem **345** · `jade_feet` → `public/sprites/arte/jade_feet.png`
- **Hoy:** pixel art 32×32
- **Prompt:**

> Ícono de videojuego en estilo plano (flat) de botas de jade. Un par de botas con tobillera de jade verde y un filete dorado sobre cuero café, una al lado de la otra. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. Una sola pieza centrada, casi de frente con un ligero giro de 3/4, ocupando cerca del 80 % del lienzo y con 20 px de aire, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego.

### Minerales y lingotes (5)

#### 28. Carbón
- **Archivo:** `item-coal.png` (512×512, fondo transparente) → `assets-src/chatgpt/`
- **Se conecta a:** ítem **257** · `coal` → `public/sprites/arte/coal.png`
- **Hoy:** pixel art 32×32
- **Prompt:**

> Ícono de videojuego en estilo plano (flat) de carbón. Un trozo de carbón de forma irregular, con facetas planas negro azulado y un brillo gris claro en la cara de arriba a la izquierda. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. Un solo objeto centrado, ocupando cerca del 75 % del lienzo, vista de 3/4 desde arriba, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego.

#### 29. Lingote de hierro
- **Archivo:** `item-iron.png` (512×512, fondo transparente) → `assets-src/chatgpt/`
- **Se conecta a:** ítem **258** · `iron` → `public/sprites/arte/iron.png`
- **Hoy:** pixel art 32×32
- **Prompt:**

> Ícono de videojuego en estilo plano (flat) de lingote de hierro. Un lingote de hierro en forma de trapecio con los bordes redondeados, gris azulado claro, con un brillo en la cara de arriba y una banda más oscura abajo a la derecha. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. Un solo objeto centrado, ocupando cerca del 75 % del lienzo, vista de 3/4 desde arriba, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego.

#### 30. Lingote de oro
- **Archivo:** `item-gold.png` (512×512, fondo transparente) → `assets-src/chatgpt/`
- **Se conecta a:** ítem **259** · `gold` → `public/sprites/arte/gold.png`
- **Hoy:** pixel art 32×32
- **Prompt:**

> Ícono de videojuego en estilo plano (flat) de lingote de oro. Un lingote de oro en forma de trapecio con los bordes redondeados, amarillo dorado con una franja de brillo en la cara de arriba y una banda ámbar más oscura abajo a la derecha. Sin sello ni texto. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. Un solo objeto centrado, ocupando cerca del 75 % del lienzo, vista de 3/4 desde arriba, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego.

#### 31. Diamante
- **Archivo:** `item-diamond.png` (512×512, fondo transparente) → `assets-src/chatgpt/`
- **Se conecta a:** ítem **260** · `diamond` → `public/sprites/arte/diamond.png`
- **Hoy:** pixel art 32×32
- **Prompt:**

> Ícono de videojuego en estilo plano (flat) de diamante. Un diamante tallado, turquesa translúcido, visto de frente con sus facetas (corona y pabellón) en tonos claro y oscuro y un destello blanco arriba a la izquierda. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. Un solo objeto centrado, ocupando cerca del 75 % del lienzo, vista de 3/4 desde arriba, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego.

#### 32. Lingote de jade
- **Archivo:** `item-jade_ingot.png` (512×512, fondo transparente) → `assets-src/chatgpt/`
- **Se conecta a:** ítem **274** · `jade_ingot` → `public/sprites/arte/jade_ingot.png`
- **Hoy:** pixel art 32×32
- **Prompt:**

> Ícono de videojuego en estilo plano (flat) de lingote de jade. Una barra corta de jade pulido verde, de extremos redondeados, con una espiral muy simple tallada en la cara de arriba y un brillo claro arriba a la izquierda. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. Un solo objeto centrado, ocupando cerca del 75 % del lienzo, vista de 3/4 desde arriba, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego.

### Semillas y cultivos (4)

#### 33. Semillas de maíz
- **Archivo:** `item-corn_seeds.png` (512×512, fondo transparente) → `assets-src/chatgpt/`
- **Se conecta a:** ítem **267** · `corn_seeds` → `public/sprites/arte/corn_seeds.png`
- **Hoy:** pixel art 32×32
- **Prompt:**

> Ícono de videojuego en estilo plano (flat) de semillas de maíz. Una bolsita de manta crema atada con cabuya, medio abierta, de la que se desborda un puñado de granos de maíz amarillos. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. Un solo objeto centrado, ocupando cerca del 75 % del lienzo, vista de 3/4 desde arriba, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego.

#### 34. Mazorca
- **Archivo:** `item-corn.png` (512×512, fondo transparente) → `assets-src/chatgpt/`
- **Se conecta a:** ítem **268** · `corn` → `public/sprites/arte/corn.png`
- **Hoy:** pixel art 32×32
- **Prompt:**

> Ícono de videojuego en estilo plano (flat) de mazorca. Una mazorca de maíz con las hojas verdes abiertas hacia abajo, mostrando los granos amarillos en filas parejas. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. Un solo objeto centrado, ocupando cerca del 75 % del lienzo, vista de 3/4 desde arriba, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego.

#### 35. Frijoles
- **Archivo:** `item-beans.png` (512×512, fondo transparente) → `assets-src/chatgpt/`
- **Se conecta a:** ítem **269** · `beans` → `public/sprites/arte/beans.png`
- **Hoy:** pixel art 32×32
- **Prompt:**

> Ícono de videojuego en estilo plano (flat) de frijoles. Un montoncito de frijoles rojo oscuro y brillantes, con una vaina verde abierta al lado. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. Un solo objeto centrado, ocupando cerca del 75 % del lienzo, vista de 3/4 desde arriba, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego.

#### 36. Banano
- **Archivo:** `item-banana.png` (512×512, fondo transparente) → `assets-src/chatgpt/`
- **Se conecta a:** ítem **275** · `banana` → `public/sprites/arte/banana.png`
- **Hoy:** pixel art 32×32
- **Prompt:**

> Ícono de videojuego en estilo plano (flat) de banano. Un racimo de tres bananos amarillos con las puntas y el tallo verde oscuro, curvos y unidos por arriba. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. Un solo objeto centrado, ocupando cerca del 75 % del lienzo, vista de 3/4 desde arriba, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego.

### Remedios (4)

#### 37. Suero antiofídico
- **Archivo:** `item-antivenom.png` (512×512, fondo transparente) → `assets-src/chatgpt/`
- **Se conecta a:** ítem **281** · `antivenom` → `public/sprites/arte/antivenom.png`
- **Hoy:** pixel art 32×32
- **Prompt:**

> Ícono de videojuego en estilo plano (flat) de suero antiofídico. Una ampolla de vidrio con tapón de goma gris y un líquido amarillo pálido, con una etiqueta crema que lleva dibujada una serpiente enroscada pequeña. Sin texto. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. Un solo objeto centrado, ocupando cerca del 75 % del lienzo, vista de 3/4 desde arriba, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego.

#### 38. Venda
- **Archivo:** `item-venda.png` (512×512, fondo transparente) → `assets-src/chatgpt/`
- **Se conecta a:** ítem **440** · `venda` → `public/sprites/arte/venda.png`
- **Hoy:** pixel art 32×32
- **Prompt:**

> Ícono de videojuego en estilo plano (flat) de venda. Un rollo de venda blanca enrollada, con la punta suelta cayendo hacia abajo a la derecha y una tira de cabuya crema que lo ata. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. Un solo objeto centrado, ocupando cerca del 75 % del lienzo, vista de 3/4 desde arriba, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego.

#### 39. Botiquín
- **Archivo:** `item-botiquin.png` (512×512, fondo transparente) → `assets-src/chatgpt/`
- **Se conecta a:** ítem **443** · `botiquin` → `public/sprites/arte/botiquin.png`
- **Hoy:** pixel art 32×32
- **Prompt:**

> Ícono de videojuego en estilo plano (flat) de botiquín. Una cajita de lata verde con asa de cuero, tapa con broche dorado y una cruz crema grande al frente (cruz verde de farmacia, nunca una cruz roja). Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. Un solo objeto centrado, ocupando cerca del 75 % del lienzo, vista de 3/4 desde arriba, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego.

#### 40. Suero oral
- **Archivo:** `item-suero.png` (512×512, fondo transparente) → `assets-src/chatgpt/`
- **Se conecta a:** ítem **442** · `suero` → `public/sprites/arte/suero.png`
- **Hoy:** pixel art 32×32
- **Prompt:**

> Ícono de videojuego en estilo plano (flat) de suero oral. Una botellita transparente con tapa azul y un líquido celeste clarito adentro, con una etiqueta crema con una gota azul dibujada. Sin texto. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. Un solo objeto centrado, ocupando cerca del 75 % del lienzo, vista de 3/4 desde arriba, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego.

---

## 2. Recompensas únicas de jefes y del final (`DISENO_JEFES_Y_FINAL.md` §4)

Se numeran seguido (el número es el de la fila total). Las **5 «nuevas»** todavía **no existen como ítem**: el diseño las define (campana, pluma de oro, mantilla, foto, cigarro) y la constructora les asigna id al construirlas; el arte puede hacerse antes. Las **8 «que ya existen»** están en `ITEMS` hoy con pixel art. Los **9 trofeos** son **bloques** (`TROFEO_DE` en `hogar.js`; el de Rey Zopilote es **la Cabeza**, colgable): se dibujan **planos** como el chanchito (`arteBloque` de `textures.js`), sin cubito isométrico.

### Únicos nuevos del final (5, todavía sin ítem: ids por asignar)

#### 41. Campana de la casa
- **Archivo:** `item-campana_casa.png` (512×512, fondo transparente) → `assets-src/chatgpt/`
- **Se conecta a:** ítem **por asignar** · `campana_casa` (ver §5) → `public/sprites/arte/campana_casa.png`
- **Hoy:** no existe
- **Prompt:**

> Ícono de videojuego en estilo plano (flat) de campana de la casa. Una campana de bronce con la boca ancha, un asa de cuero café y una lazada de cabuya con un badajo de madera; el bronce dorado con brillo arriba a la izquierda y una banda cobriza abajo a la derecha. Sencilla, como la de un patio de finca. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. Un solo objeto centrado, ocupando cerca del 75 % del lienzo, vista de 3/4 desde arriba, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego.

#### 42. Pluma de oro del Rey
- **Archivo:** `item-pluma_oro_rey.png` (512×512, fondo transparente) → `assets-src/chatgpt/`
- **Se conecta a:** ítem **por asignar** · `pluma_oro_rey` (ver §5) → `public/sprites/arte/pluma_oro_rey.png`
- **Hoy:** no existe
- **Prompt:**

> Ícono de videojuego en estilo plano (flat) de pluma de oro del rey. Una pluma larga en diagonal, amarillo oro con un raquis café y una vena clara que la recorre; las barbas se separan un poco en la punta. Sin adornos, de aspecto precioso. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. El objeto en diagonal de abajo-izquierda a arriba-derecha (mango abajo, parte activa arriba), centrado, ocupando cerca del 85 % del lienzo y con 20 px de aire. Vista de 3/4 ligeramente desde arriba, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego.

#### 43. Mantilla de Zenaida
- **Archivo:** `item-mantilla_zenaida.png` (512×512, fondo transparente) → `assets-src/chatgpt/`
- **Se conecta a:** ítem **por asignar** · `mantilla_zenaida` (ver §5) → `public/sprites/arte/mantilla_zenaida.png`
- **Hoy:** no existe
- **Prompt:**

> Ícono de videojuego en estilo plano (flat) de mantilla de zenaida. Un chal de lana color vino doblado en triángulo, con flecos cortos crema en el borde y una flor bordada pequeña (roja y amarilla) en una esquina. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. Un solo objeto centrado, ocupando cerca del 75 % del lienzo, vista de 3/4 desde arriba, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego.

#### 44. Foto de la cumbre
- **Archivo:** `item-foto_cumbre.png` (512×512, fondo transparente) → `assets-src/chatgpt/`
- **Se conecta a:** ítem **por asignar** · `foto_cumbre` (ver §5) → `public/sprites/arte/foto_cumbre.png`
- **Hoy:** no existe
- **Prompt:**

> Ícono de videojuego en estilo plano (flat) de foto de la cumbre. Un marco de madera clara con una fotografía adentro: siluetas pequeñas de gente de pie sobre una cumbre, a contraluz, con un amanecer naranja y celeste detrás. Los rostros no se distinguen. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. Un solo objeto centrado, ocupando cerca del 75 % del lienzo, vista de 3/4 desde arriba, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego.

#### 45. Cigarro de Anselmo
- **Archivo:** `item-cigarro_anselmo.png` (512×512, fondo transparente) → `assets-src/chatgpt/`
- **Se conecta a:** ítem **por asignar** · `cigarro_anselmo` (ver §5) → `public/sprites/arte/cigarro_anselmo.png`
- **Hoy:** no existe
- **Prompt:**

> Ícono de videojuego en estilo plano (flat) de cigarro de anselmo. Un cigarro blanco sin encender con un anillo dorado, un fósforo de madera apoyado a su lado y detrás una cajetilla vieja de cartón crema y rojo, sin texto ni marca. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. Un solo objeto centrado, ocupando cerca del 75 % del lienzo, vista de 3/4 desde arriba, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego.

### Recompensas que ya existen sin arte (8)

#### 46. Corona del monte
- **Archivo:** `item-corona_monte.png` (512×512, fondo transparente) → `assets-src/chatgpt/`
- **Se conecta a:** ítem **552** · `corona_monte` → `public/sprites/arte/corona_monte.png`
- **Hoy:** pixel art 32×32
- **Prompt:**

> Ícono de videojuego en estilo plano (flat) de corona del monte. Una corona de ramas de bejuco entrelazadas, con hojas verdes, flores amarillas y unas cuentas rojas de semilla, atada con cabuya; ligeramente abierta, vista de 3/4 desde arriba. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. Un solo objeto centrado, ocupando cerca del 75 % del lienzo, vista de 3/4 desde arriba, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego.

#### 47. Pluma del Rey Zopilote
- **Archivo:** `item-pluma_rey.png` (512×512, fondo transparente) → `assets-src/chatgpt/`
- **Se conecta a:** ítem **551** · `pluma_rey` → `public/sprites/arte/pluma_rey.png`
- **Hoy:** pixel art 32×32
- **Prompt:**

> Ícono de videojuego en estilo plano (flat) de pluma del rey zopilote. Una pluma larga y oscura (gris carbón con la punta negra) en diagonal, con el raquis blanco y una franja clara a lo largo; se ve señorial pero más sobria que la pluma de oro. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. El objeto en diagonal de abajo-izquierda a arriba-derecha (mango abajo, parte activa arriba), centrado, ocupando cerca del 85 % del lienzo y con 20 px de aire. Vista de 3/4 ligeramente desde arriba, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego.

#### 48. Seda de la Reina Bananera
- **Archivo:** `item-seda_reina.png` (512×512, fondo transparente) → `assets-src/chatgpt/`
- **Se conecta a:** ítem **536** · `seda_reina` → `public/sprites/arte/seda_reina.png`
- **Hoy:** pixel art 32×32
- **Prompt:**

> Ícono de videojuego en estilo plano (flat) de seda de la reina bananera. Una madeja de hilo de seda blanco verdoso, enrollada en un ovillo con una hebra suelta cayendo hacia un lado y una hojita de banano verde atada. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. Un solo objeto centrado, ocupando cerca del 75 % del lienzo, vista de 3/4 desde arriba, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego.

#### 49. Cuerno de Don Cornudo
- **Archivo:** `item-cuerno_hercules.png` (512×512, fondo transparente) → `assets-src/chatgpt/`
- **Se conecta a:** ítem **537** · `cuerno_hercules` → `public/sprites/arte/cuerno_hercules.png`
- **Hoy:** pixel art 32×32
- **Prompt:**

> Ícono de videojuego en estilo plano (flat) de cuerno de don cornudo. Un cuerno largo y curvo de escarabajo, café oscuro en la base y marfil claro en la punta, con una muesca cerca de la base; en diagonal. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. El objeto en diagonal de abajo-izquierda a arriba-derecha (mango abajo, parte activa arriba), centrado, ocupando cerca del 85 % del lienzo y con 20 px de aire. Vista de 3/4 ligeramente desde arriba, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego.

#### 50. Glándula del Tata Sapo
- **Archivo:** `item-glandula_tata.png` (512×512, fondo transparente) → `assets-src/chatgpt/`
- **Se conecta a:** ítem **538** · `glandula_tata` → `public/sprites/arte/glandula_tata.png`
- **Hoy:** pixel art 32×32
- **Prompt:**

> Ícono de videojuego en estilo plano (flat) de glándula del tata sapo. Un bulto redondeado y verrugoso, verde oliva con puntos dorados, del que cuelga una gota espesa de líquido amarillo verdoso. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. Un solo objeto centrado, ocupando cerca del 75 % del lienzo, vista de 3/4 desde arriba, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego.

#### 51. Cascabel de la Cascabel del Llano
- **Archivo:** `item-cascabel_llano.png` (512×512, fondo transparente) → `assets-src/chatgpt/`
- **Se conecta a:** ítem **539** · `cascabel_llano` → `public/sprites/arte/cascabel_llano.png`
- **Hoy:** pixel art 32×32
- **Prompt:**

> Ícono de videojuego en estilo plano (flat) de cascabel de la cascabel del llano. El cascabel de una serpiente: cinco anillos huecos apilados y cada vez más chicos, crema ámbar, con una curva suave y un brillo en cada anillo. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. Un solo objeto centrado, ocupando cerca del 75 % del lienzo, vista de 3/4 desde arriba, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego.

#### 52. Pinza del Cangrejo Rey
- **Archivo:** `item-pinza_rey.png` (512×512, fondo transparente) → `assets-src/chatgpt/`
- **Se conecta a:** ítem **540** · `pinza_rey` → `public/sprites/arte/pinza_rey.png`
- **Hoy:** pixel art 32×32
- **Prompt:**

> Ícono de videojuego en estilo plano (flat) de pinza del cangrejo rey. Una pinza grande de cangrejo, roja anaranjada, abierta, con los dientes del borde de color crema y manchitas claras en el lomo. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. Un solo objeto centrado, ocupando cerca del 75 % del lienzo, vista de 3/4 desde arriba, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego.

#### 53. Colmillo del Ciempiés Rey
- **Archivo:** `item-colmillo_ciempies.png` (512×512, fondo transparente) → `assets-src/chatgpt/`
- **Se conecta a:** ítem **541** · `colmillo_ciempies` → `public/sprites/arte/colmillo_ciempies.png`
- **Hoy:** pixel art 32×32
- **Prompt:**

> Ícono de videojuego en estilo plano (flat) de colmillo del ciempiés rey. Un colmillo largo y curvo, rojo oscuro con la punta anaranjada y una ranura brillante por dentro, en diagonal. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. El objeto en diagonal de abajo-izquierda a arriba-derecha (mango abajo, parte activa arriba), centrado, ocupando cerca del 85 % del lienzo y con 20 px de aire. Vista de 3/4 ligeramente desde arriba, luz desde arriba a la izquierda. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego.

### Trofeos y cabezas de jefe (9; son bloques, se dibujan planos)

#### 54. Trofeo: La Reina Bananera
- **Archivo:** `item-trofeo_reina.png` (512×512, fondo transparente) → `assets-src/chatgpt/`
- **Se conecta a:** bloque **645** · `trofeo_reina` → `public/sprites/arte/trofeo_reina.png`
- **Hoy:** bloque (pixel art)
- **Prompt:**

> Ícono de videojuego en estilo plano (flat) de trofeo de pared: la reina bananera. Una placa de madera oscura con borde de cabuya y sobre ella la cabeza tallada y pintada de una araña grande, verde y café, con ocho ojitos claros y los colmillos cortos. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. Un solo trofeo de pared centrado, visto de frente con un ligero giro de 3/4, ocupando cerca del 80 % del lienzo, luz desde arriba a la izquierda. Es una pieza de artesanía (madera tallada y pintada a mano), nada sangriento ni realista. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego.

#### 55. Trofeo: Don Cornudo
- **Archivo:** `item-trofeo_cornudo.png` (512×512, fondo transparente) → `assets-src/chatgpt/`
- **Se conecta a:** bloque **646** · `trofeo_cornudo` → `public/sprites/arte/trofeo_cornudo.png`
- **Hoy:** bloque (pixel art)
- **Prompt:**

> Ícono de videojuego en estilo plano (flat) de trofeo de pared: don cornudo. Una placa de madera oscura con borde de cabuya y sobre ella la cabeza tallada de un escarabajo grande, verde oliva, con un cuerno largo y curvo hacia arriba. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. Un solo trofeo de pared centrado, visto de frente con un ligero giro de 3/4, ocupando cerca del 80 % del lienzo, luz desde arriba a la izquierda. Es una pieza de artesanía (madera tallada y pintada a mano), nada sangriento ni realista. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego.

#### 56. Trofeo: Tata Sapo
- **Archivo:** `item-trofeo_tata.png` (512×512, fondo transparente) → `assets-src/chatgpt/`
- **Se conecta a:** bloque **647** · `trofeo_tata` → `public/sprites/arte/trofeo_tata.png`
- **Hoy:** bloque (pixel art)
- **Prompt:**

> Ícono de videojuego en estilo plano (flat) de trofeo de pared: tata sapo. Una placa de madera oscura con borde de cabuya y sobre ella la cabeza tallada de un sapo grande, verde oliva con verrugas doradas, la boca ancha y los ojos dorados. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. Un solo trofeo de pared centrado, visto de frente con un ligero giro de 3/4, ocupando cerca del 80 % del lienzo, luz desde arriba a la izquierda. Es una pieza de artesanía (madera tallada y pintada a mano), nada sangriento ni realista. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego.

#### 57. Trofeo: La Cascabel del Llano
- **Archivo:** `item-trofeo_cascabel.png` (512×512, fondo transparente) → `assets-src/chatgpt/`
- **Se conecta a:** bloque **648** · `trofeo_cascabel` → `public/sprites/arte/trofeo_cascabel.png`
- **Hoy:** bloque (pixel art)
- **Prompt:**

> Ícono de videojuego en estilo plano (flat) de trofeo de pared: la cascabel del llano. Una placa de madera oscura con borde de cabuya y sobre ella la cabeza tallada de una serpiente cascabel, color arena con rombos café, la lengua roja chica y un cascabel colgando abajo. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. Un solo trofeo de pared centrado, visto de frente con un ligero giro de 3/4, ocupando cerca del 80 % del lienzo, luz desde arriba a la izquierda. Es una pieza de artesanía (madera tallada y pintada a mano), nada sangriento ni realista. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego.

#### 58. Trofeo: Cangrejo Rey
- **Archivo:** `item-trofeo_cangrejo.png` (512×512, fondo transparente) → `assets-src/chatgpt/`
- **Se conecta a:** bloque **649** · `trofeo_cangrejo` → `public/sprites/arte/trofeo_cangrejo.png`
- **Hoy:** bloque (pixel art)
- **Prompt:**

> Ícono de videojuego en estilo plano (flat) de trofeo de pared: cangrejo rey. Una placa de madera oscura con borde de cabuya y sobre ella un cangrejo rojo tallado con una pinza grande levantada y los ojos saltones. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. Un solo trofeo de pared centrado, visto de frente con un ligero giro de 3/4, ocupando cerca del 80 % del lienzo, luz desde arriba a la izquierda. Es una pieza de artesanía (madera tallada y pintada a mano), nada sangriento ni realista. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego.

#### 59. Trofeo: Ciempiés Rey
- **Archivo:** `item-trofeo_ciempies.png` (512×512, fondo transparente) → `assets-src/chatgpt/`
- **Se conecta a:** bloque **650** · `trofeo_ciempies` → `public/sprites/arte/trofeo_ciempies.png`
- **Hoy:** bloque (pixel art)
- **Prompt:**

> Ícono de videojuego en estilo plano (flat) de trofeo de pared: ciempiés rey. Una placa de madera oscura con borde de cabuya y sobre ella la cabeza tallada de un ciempiés rojo oscuro, con antenas largas y dos colmillos curvos anaranjados. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. Un solo trofeo de pared centrado, visto de frente con un ligero giro de 3/4, ocupando cerca del 80 % del lienzo, luz desde arriba a la izquierda. Es una pieza de artesanía (madera tallada y pintada a mano), nada sangriento ni realista. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego.

#### 60. Cabeza del Rey Zopilote
- **Archivo:** `item-trofeo_rey_zopilote.png` (512×512, fondo transparente) → `assets-src/chatgpt/`
- **Se conecta a:** bloque **643** · `trofeo_rey_zopilote` → `public/sprites/arte/trofeo_rey_zopilote.png`
- **Hoy:** bloque (pixel art)
- **Prompt:**

> Ícono de videojuego en estilo plano (flat) de cabeza del rey zopilote. Una placa de madera oscura con borde de cabuya y sobre ella la cabeza tallada de un zopilote rey: la cabeza pelada de colores (naranja, rojo, amarillo y azul claro), el pico curvo crema y el cuello con una gorguera de plumas gris. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. Un solo trofeo de pared centrado, visto de frente con un ligero giro de 3/4, ocupando cerca del 80 % del lienzo, luz desde arriba a la izquierda. Es una pieza de artesanía (madera tallada y pintada a mano), nada sangriento ni realista. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego.

#### 61. Trofeo: Señor del Arenal
- **Archivo:** `item-trofeo_senor_arenal.png` (512×512, fondo transparente) → `assets-src/chatgpt/`
- **Se conecta a:** bloque **625** · `trofeo_senor_arenal` → `public/sprites/arte/trofeo_senor_arenal.png`
- **Hoy:** bloque (pixel art)
- **Prompt:**

> Ícono de videojuego en estilo plano (flat) de trofeo de pared: señor del arenal. Una placa de madera oscura con borde de cabuya y sobre ella una máscara tallada de roca volcánica negra con grietas naranjas como lava y dos ojos de brasa. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. Un solo trofeo de pared centrado, visto de frente con un ligero giro de 3/4, ocupando cerca del 80 % del lienzo, luz desde arriba a la izquierda. Es una pieza de artesanía (madera tallada y pintada a mano), nada sangriento ni realista. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego.

#### 62. Trofeo: Arpía de la Tormenta
- **Archivo:** `item-trofeo_arpia.png` (512×512, fondo transparente) → `assets-src/chatgpt/`
- **Se conecta a:** bloque **626** · `trofeo_arpia` → `public/sprites/arte/trofeo_arpia.png`
- **Hoy:** bloque (pixel art)
- **Prompt:**

> Ícono de videojuego en estilo plano (flat) de trofeo de pared: arpía de la tormenta. Una placa de madera oscura con borde de cabuya y sobre ella la cabeza tallada de un águila arpía: gris con las plumas de la nuca en cresta partida, el pico corto y fuerte y los ojos amarillos. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. Un solo trofeo de pared centrado, visto de frente con un ligero giro de 3/4, ocupando cerca del 80 % del lienzo, luz desde arriba a la izquierda. Es una pieza de artesanía (madera tallada y pintada a mano), nada sangriento ni realista. Sin fondo, sin suelo, sin marco. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar objetos de ningún otro juego.

---

## 3. Retratos de jefe para la barra de vida

**Cómo se usan hoy:** `UI.bossBar(name, frac, tipo)` (`ui.js`) pinta `#boss-img` con `/ui/jefes/<tipo>.png` **solo si el tipo está en `RETRATOS`** (el conjunto de `ui.js`: reina_bananera, escarabajo_hercules, sapo_tata, cascabel_rey, cangrejo_rey, ciempies_rey, rey_zopilote). `final.js` (`etapasHTML`) usa los mismos PNG en la lista de etapas (`.etapa-jefe`). **Los siete ya tienen retrato: PNG de 48×48 en pixel art** (los miré: p. ej. el zopilote de cabeza naranja y el sapo dorado). La barra los muestra a **48×48** (`#boss-img`, y `vidrio.css` ya le puso `image-rendering: auto`), así que un PNG nuevo de **512×512 se reduce con suavizado**: conviene entregar también una copia de **96×96** (retina) y que `RETRATOS` lea `/ui/jefes/<tipo>.png`. Las 7 primeras filas **reemplazan** a las actuales (mismo nombre de archivo); las 6 **extra** son los jefes con barra de vida que hoy **no muestran retrato** (`JEFE` de `precios.js`): hay que agregar su clave a `RETRATOS`. Los **mini-jefes** (terciopelo, jaguar, cocodrilo) y las **leyendas** (Cadejos, Segua, Llorona, Mona, Viejo del Monte, Tulevieja, Mono congo) tampoco tienen y quedan para un lote 4 por si se quieren.

### Los 7 jefes del monte y el Rey Zopilote (reemplazan los de 48×48 de hoy)

#### 63. Retrato: La Reina Bananera
- **Archivo:** `retrato-reina_bananera.png` (512×512, fondo transparente) → `assets-src/chatgpt/`
- **Se conecta a:** jefe `reina_bananera` → `public/ui/jefes/reina_bananera.png` (y copia de 96×96)
- **Hoy:** retrato de 48×48 en pixel art
- **Prompt:**

> Retrato de La Reina Bananera en estilo plano (flat). Una araña tarántula enorme de plantación de banano: cabeza y frente peludos verde oliva y café, ocho ojos pequeños claros en dos filas, colmillos cortos marrón brillante, patas delanteras levantadas en los lados; una hojita de banano verde pegada al lomo. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. Retrato de jefe para una barra de vida: solo la cabeza y los hombros (o el frente del cuerpo), centrado, mirando al frente con un ligero giro de 3/4, ocupando cerca del 90 % del lienzo. Silueta fuerte y ojos grandes y claros que se lean a 48 px; expresión amenazante pero de cuento, nada sangriento. Sin fondo, sin marco, sin texto. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar criaturas de ningún otro juego.

#### 64. Retrato: Don Cornudo
- **Archivo:** `retrato-escarabajo_hercules.png` (512×512, fondo transparente) → `assets-src/chatgpt/`
- **Se conecta a:** jefe `escarabajo_hercules` → `public/ui/jefes/escarabajo_hercules.png` (y copia de 96×96)
- **Hoy:** retrato de 48×48 en pixel art
- **Prompt:**

> Retrato de Don Cornudo en estilo plano (flat). Un escarabajo Hércules enorme: élitros verde oliva con puntos oscuros, el tórax negro brillante, un cuerno largo y curvo hacia arriba que parte de la cabeza y un cuerno corto debajo; ojos pequeños y amarillos. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. Retrato de jefe para una barra de vida: solo la cabeza y los hombros (o el frente del cuerpo), centrado, mirando al frente con un ligero giro de 3/4, ocupando cerca del 90 % del lienzo. Silueta fuerte y ojos grandes y claros que se lean a 48 px; expresión amenazante pero de cuento, nada sangriento. Sin fondo, sin marco, sin texto. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar criaturas de ningún otro juego.

#### 65. Retrato: El Tata Sapo
- **Archivo:** `retrato-sapo_tata.png` (512×512, fondo transparente) → `assets-src/chatgpt/`
- **Se conecta a:** jefe `sapo_tata` → `public/ui/jefes/sapo_tata.png` (y copia de 96×96)
- **Hoy:** retrato de 48×48 en pixel art
- **Prompt:**

> Retrato de El Tata Sapo en estilo plano (flat). Un sapo gigante, viejo y rechoncho, verde oliva con verrugas doradas y una gran glándula detrás de cada ojo, la boca ancha en una sonrisa torcida, ojos dorados con la pupila horizontal. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. Retrato de jefe para una barra de vida: solo la cabeza y los hombros (o el frente del cuerpo), centrado, mirando al frente con un ligero giro de 3/4, ocupando cerca del 90 % del lienzo. Silueta fuerte y ojos grandes y claros que se lean a 48 px; expresión amenazante pero de cuento, nada sangriento. Sin fondo, sin marco, sin texto. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar criaturas de ningún otro juego.

#### 66. Retrato: La Cascabel del Llano
- **Archivo:** `retrato-cascabel_rey.png` (512×512, fondo transparente) → `assets-src/chatgpt/`
- **Se conecta a:** jefe `cascabel_rey` → `public/ui/jefes/cascabel_rey.png` (y copia de 96×96)
- **Hoy:** retrato de 48×48 en pixel art
- **Prompt:**

> Retrato de La Cascabel del Llano en estilo plano (flat). Una serpiente cascabel hembra, con el cuerpo en espiral y la cabeza levantada de frente: escamas color arena con rombos café oscuro, la lengua roja bífida, los ojos amarillos con la pupila vertical y el cascabel crema visible a un lado. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. Retrato de jefe para una barra de vida: solo la cabeza y los hombros (o el frente del cuerpo), centrado, mirando al frente con un ligero giro de 3/4, ocupando cerca del 90 % del lienzo. Silueta fuerte y ojos grandes y claros que se lean a 48 px; expresión amenazante pero de cuento, nada sangriento. Sin fondo, sin marco, sin texto. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar criaturas de ningún otro juego.

#### 67. Retrato: El Cangrejo Rey
- **Archivo:** `retrato-cangrejo_rey.png` (512×512, fondo transparente) → `assets-src/chatgpt/`
- **Se conecta a:** jefe `cangrejo_rey` → `public/ui/jefes/cangrejo_rey.png` (y copia de 96×96)
- **Hoy:** retrato de 48×48 en pixel art
- **Prompt:**

> Retrato de El Cangrejo Rey en estilo plano (flat). Un cangrejo rojo de playa, visto de frente: dos pinzas grandes levantadas, una más grande que la otra, los ojos saltones sobre tallos, el caparazón anaranjado con una corona pequeña de conchitas y caracoles encima. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. Retrato de jefe para una barra de vida: solo la cabeza y los hombros (o el frente del cuerpo), centrado, mirando al frente con un ligero giro de 3/4, ocupando cerca del 90 % del lienzo. Silueta fuerte y ojos grandes y claros que se lean a 48 px; expresión amenazante pero de cuento, nada sangriento. Sin fondo, sin marco, sin texto. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar criaturas de ningún otro juego.

#### 68. Retrato: El Ciempiés Rey
- **Archivo:** `retrato-ciempies_rey.png` (512×512, fondo transparente) → `assets-src/chatgpt/`
- **Se conecta a:** jefe `ciempies_rey` → `public/ui/jefes/ciempies_rey.png` (y copia de 96×96)
- **Hoy:** retrato de 48×48 en pixel art
- **Prompt:**

> Retrato de El Ciempiés Rey en estilo plano (flat). Un ciempiés gigante, rojo oscuro con las patas anaranjadas: la cabeza de frente con dos antenas largas, dos colmillos curvos brillantes y los primeros segmentos del cuerpo enroscándose hacia abajo. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. Retrato de jefe para una barra de vida: solo la cabeza y los hombros (o el frente del cuerpo), centrado, mirando al frente con un ligero giro de 3/4, ocupando cerca del 90 % del lienzo. Silueta fuerte y ojos grandes y claros que se lean a 48 px; expresión amenazante pero de cuento, nada sangriento. Sin fondo, sin marco, sin texto. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar criaturas de ningún otro juego.

#### 69. Retrato: El Rey Zopilote
- **Archivo:** `retrato-rey_zopilote.png` (512×512, fondo transparente) → `assets-src/chatgpt/`
- **Se conecta a:** jefe `rey_zopilote` → `public/ui/jefes/rey_zopilote.png` (y copia de 96×96)
- **Hoy:** retrato de 48×48 en pixel art
- **Prompt:**

> Retrato de El Rey Zopilote en estilo plano (flat). Un zopilote rey (buitre) de frente: la cabeza pelada con colores (naranja, rojo, amarillo y azul claro), el pico curvo crema con una carúncula naranja sobre él, un ojo claro con el anillo rojo, la gorguera de plumas gris y blanco, y una corona pequeña de ramitas doradas. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. Retrato de jefe para una barra de vida: solo la cabeza y los hombros (o el frente del cuerpo), centrado, mirando al frente con un ligero giro de 3/4, ocupando cerca del 90 % del lienzo. Silueta fuerte y ojos grandes y claros que se lean a 48 px; expresión amenazante pero de cuento, nada sangriento. Sin fondo, sin marco, sin texto. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar criaturas de ningún otro juego.

### Extra: jefes con barra de vida y sin retrato (6; `RETRATOS` los ignora hoy)

#### 70. Retrato: El Murciélago Rey
- **Archivo:** `retrato-rey_murcielago.png` (512×512, fondo transparente) → `assets-src/chatgpt/`
- **Se conecta a:** jefe `rey_murcielago` → `public/ui/jefes/rey_murcielago.png` (y copia de 96×96)
- **Hoy:** sin retrato (la barra de vida sale sin imagen)
- **Prompt:**

> Retrato de El Murciélago Rey en estilo plano (flat). Un murciélago enorme de frente: orejas grandes y puntudas, la nariz en forma de hoja, las alas abiertas a los lados como una capa, el pelaje café grisáceo y unos colmillos pequeños; una corona de roca chica entre las orejas. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. Retrato de jefe para una barra de vida: solo la cabeza y los hombros (o el frente del cuerpo), centrado, mirando al frente con un ligero giro de 3/4, ocupando cerca del 90 % del lienzo. Silueta fuerte y ojos grandes y claros que se lean a 48 px; expresión amenazante pero de cuento, nada sangriento. Sin fondo, sin marco, sin texto. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar criaturas de ningún otro juego.

#### 71. Retrato: El Señor del Arenal
- **Archivo:** `retrato-senor_arenal.png` (512×512, fondo transparente) → `assets-src/chatgpt/`
- **Se conecta a:** jefe `senor_arenal` → `public/ui/jefes/senor_arenal.png` (y copia de 96×96)
- **Hoy:** sin retrato (la barra de vida sale sin imagen)
- **Prompt:**

> Retrato de El Señor del Arenal en estilo plano (flat). Un gigante de roca volcánica negra, visto de frente, con grietas naranjas como lava en la cara y el pecho, los ojos como brasas, los hombros anchos y un penacho de humo gris encima de la cabeza. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. Retrato de jefe para una barra de vida: solo la cabeza y los hombros (o el frente del cuerpo), centrado, mirando al frente con un ligero giro de 3/4, ocupando cerca del 90 % del lienzo. Silueta fuerte y ojos grandes y claros que se lean a 48 px; expresión amenazante pero de cuento, nada sangriento. Sin fondo, sin marco, sin texto. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar criaturas de ningún otro juego.

#### 72. Retrato: La Arpía de la Tormenta
- **Archivo:** `retrato-arpia.png` (512×512, fondo transparente) → `assets-src/chatgpt/`
- **Se conecta a:** jefe `arpia` → `public/ui/jefes/arpia.png` (y copia de 96×96)
- **Hoy:** sin retrato (la barra de vida sale sin imagen)
- **Prompt:**

> Retrato de La Arpía de la Tormenta en estilo plano (flat). Un águila arpía de frente con las alas medio abiertas: plumaje gris con el pecho blanco, una cresta de plumas partida en dos en la nuca, el pico fuerte y los ojos amarillos; relámpagos azules pálidos muy chiquitos en las plumas de las alas. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. Retrato de jefe para una barra de vida: solo la cabeza y los hombros (o el frente del cuerpo), centrado, mirando al frente con un ligero giro de 3/4, ocupando cerca del 90 % del lienzo. Silueta fuerte y ojos grandes y claros que se lean a 48 px; expresión amenazante pero de cuento, nada sangriento. Sin fondo, sin marco, sin texto. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar criaturas de ningún otro juego.

#### 73. Retrato: La Sombra Madre
- **Archivo:** `retrato-sombra_madre.png` (512×512, fondo transparente) → `assets-src/chatgpt/`
- **Se conecta a:** jefe `sombra_madre` → `public/ui/jefes/sombra_madre.png` (y copia de 96×96)
- **Hoy:** sin retrato (la barra de vida sale sin imagen)
- **Prompt:**

> Retrato de La Sombra Madre en estilo plano (flat). Una figura alta y encapuchada hecha de sombra morada oscura, de frente, sin rostro salvo dos ojos blancos muy brillantes, con volutas de humo que se separan de los bordes de la capa. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. Retrato de jefe para una barra de vida: solo la cabeza y los hombros (o el frente del cuerpo), centrado, mirando al frente con un ligero giro de 3/4, ocupando cerca del 90 % del lienzo. Silueta fuerte y ojos grandes y claros que se lean a 48 px; expresión amenazante pero de cuento, nada sangriento. Sin fondo, sin marco, sin texto. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar criaturas de ningún otro juego.

#### 74. Retrato: El Olvido
- **Archivo:** `retrato-el_olvido.png` (512×512, fondo transparente) → `assets-src/chatgpt/`
- **Se conecta a:** jefe `el_olvido` → `public/ui/jefes/el_olvido.png` (y copia de 96×96)
- **Hoy:** sin retrato (la barra de vida sale sin imagen)
- **Prompt:**

> Retrato de El Olvido en estilo plano (flat). Una masa de niebla gris plateada con forma de cabeza y hombros, sin facciones; en la cara solo dos huecos claros y muchas pequeñas siluetas desvanecidas (una silla, una llave, un sombrero) que se deshacen en el borde. Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. Retrato de jefe para una barra de vida: solo la cabeza y los hombros (o el frente del cuerpo), centrado, mirando al frente con un ligero giro de 3/4, ocupando cerca del 90 % del lienzo. Silueta fuerte y ojos grandes y claros que se lean a 48 px; expresión amenazante pero de cuento, nada sangriento. Sin fondo, sin marco, sin texto. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar criaturas de ningún otro juego.

#### 75. Retrato: La Jefa de la Ventanilla
- **Archivo:** `retrato-jefa_ventanilla.png` (512×512, fondo transparente) → `assets-src/chatgpt/`
- **Se conecta a:** jefe `jefa_ventanilla` → `public/ui/jefes/jefa_ventanilla.png` (y copia de 96×96)
- **Hoy:** sin retrato (la barra de vida sale sin imagen)
- **Prompt:**

> Retrato de La Jefa de la Ventanilla en estilo plano (flat). Una funcionaria con cara de pocos amigos vista de frente, detrás de una ventanilla de madera con barrotes: peinado recogido, anteojos redondos, el sello de goma en una mano levantada; colores de oficina vieja (beige, verde apagado y café). Fondo transparente, 512×512, sin contorno negro y sin texto. Colores sólidos con degradados muy suaves, una franja de brillo clara arriba a la izquierda y una banda de sombra más oscura abajo a la derecha, y una sombra suave pegada al objeto. Formas redondeadas y simples que se lean bien reducidas a 64 px. Retrato de jefe para una barra de vida: solo la cabeza y los hombros (o el frente del cuerpo), centrado, mirando al frente con un ligero giro de 3/4, ocupando cerca del 90 % del lienzo. Silueta fuerte y ojos grandes y claros que se lean a 48 px; expresión amenazante pero de cuento, nada sangriento. Sin fondo, sin marco, sin texto. Diseño original de NanoBlocks, un juego ficticio de Costa Rica; no imitar criaturas de ningún otro juego.

---

## 4. Revisión de cada imagen antes de aceptarla

Como la lista del lote 1 (§4) más lo propio de este lote. Para cada PNG:
- [ ] 512×512, **fondo transparente** (las cuatro esquinas con alfa 0), sin sombra en el suelo ni marco.
- [ ] El objeto ocupa 75–85 % (retratos: ≈ 90 %), centrado, con aire.
- [ ] **A 64 px** (retratos: a **48 px**) se reconoce igual que el pixel art de al lado: probar con el ícono actual.
- [ ] Brillo arriba a la izquierda, sombra abajo a la derecha, **sin contorno negro**, sin texto.
- [ ] **Las 4 espadas se distinguen por el material a simple vista** (madera, piedra, hierro, diamante, jade) y **los 4 cascos / 4 pecheras / 4 pantalones / 4 botas se distinguen entre sí y entre materiales** (probar las 16 juntas a 64 px).
- [ ] **Hierro / diamante / jade / cuero** usan la paleta del material, y el cuero **no se parece a la madera**.
- [ ] Los 9 trofeos comparten la **misma placa** y se distinguen por la cabeza.
- [ ] Los 13 retratos se leen a 48 px con la **silueta** sola (en negro sobre blanco se reconoce cada jefe).
- [ ] **El botiquín lleva cruz verde, no roja.** Sin texto en ninguna imagen.
- [ ] No imita ningún ícono ni criatura de otro juego.

Si falla alguno, repetir el prompt agregando lo que faltó (p. ej. *«más plano, sin degradados fuertes, sin contorno, con el brillo arriba a la izquierda»*; para las piezas: *«de frente, sin perspectiva fuerte»*).

---

## 5. Cómo se conecta (para la constructora; no se editó nada)

1. **Ítems y bloques con ícono nuevo:** guardar el PNG como `public/sprites/arte/<clave>.png` (reducido a **128×128**, como los del lote 1) y **agregar la clave a la lista `ARTE` de `blocks.js`** (el bucle del final pone `arte: 'arte/<clave>'` en el ítem o en el bloque, y `loadSprites`/`blockIcon` de `textures.js` lo cargan, con respaldo al pixel art si no carga). Una verificación como la que usé (cruzar `ARTE` con los archivos de la carpeta) detecta claves sin archivo.
2. **Los 5 únicos nuevos** (campana, pluma de oro, mantilla, foto, cigarro) necesitan primero su **entrada en `ITEMS`** (ids libres; los últimos ids de ítem usados llegan a ~660) según `DISENO_JEFES_Y_FINAL.md` §4; el PNG puede esperar ahí sin romper nada.
3. **Trofeos:** son bloques con modelo propio; `arteBloque` dibuja la imagen plana en el ícono (inventario y hotbar). Si la constructora quiere que **el modelo 3D** también tome la nueva placa, es un trabajo aparte (no incluido).
4. **Retratos:** `public/ui/jefes/<tipo>.png` (pixel art de 48×48 hoy). Para los 6 extra, **agregar la clave a `RETRATOS`** (`ui.js`). Entregar 96×96 y dejar `#boss-img` a 48×48 con `image-rendering: auto` (ya está así en `vidrio.css`).
5. **Costo de descarga:** 75 PNG nuevos de ~30–60 KB a 128×128 ≈ 3–4 MB (los 13 retratos a 96×96 son 13 más pequeños); conviene pasarlos por `pngquant` antes de subirlos.

---

## 6. Notas

- **No se generó ninguna imagen** ni se tocó código; este archivo es el pedido.
- Los ids y claves salen de `ITEMS`/`BLOCKS` de `blocks.js` del `HEAD` (v11.13.2): conté **304 ítems, 42 con `arte`** (y el chanchito como bloque), y los 21 bloques de trofeo (ids 624–650).
- La campana, la foto, la mantilla, la pluma de oro y el cigarro **siguen siendo del diseño** (`DISENO_JEFES_Y_FINAL.md`): si nanoyackson cambia alguno de esos objetos, su fila se ajusta antes de pedirla.
- El **sub-lote C1–C4** de `DISENO_CONTENIDO_C1-C4.md` (25 ítems nuevos, entre ellos leña, sal, cecina, aguas de hierbas, capote, cobija y los bloques de rancho) **no entra aquí**: son ítems que todavía no existen y su pedido ya está redactado aparte.


## Estado (v12.1.2, constructora)
- Conectados: 69 íconos (`public/sprites/arte/<clave>.png`, 128 px) y los 13 retratos (`public/ui/jefes/<tipo>.png`, 96 px, en la barra de vida).
- Esperan su contenido (todavía no existen en el juego): bahareque, bahareque_encalado, banca_corredor, campana_casa, capote_hule, carne, cigarro_anselmo, cobija_lana, collar_cuero, foto_cumbre, guarapo, horcon, liston_feria, mantilla_zenaida, mecedora, miel_cana, palo, pluma_oro_rey, postigo, sombrero_paja, techo_palma.
