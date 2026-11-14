# Prompt único: pixel art de todos los ítems de NanoBlocks

> Generado con `node tools/lista-items.mjs` (262 ítems, 5 hojas). Volver a correrlo si se agregan ítems.

## Cómo usarlo
1. Copiá **el prompt** de abajo (con la lista completa) en tu generador de imágenes o dáselo a un artista.
2. Pedí **una hoja por mensaje** («Hacé la HOJA 1», después la 2…). Cada hoja es un PNG de **256×256** con fondo transparente: una cuadrícula de **8×8 celdas de 32×32 px**, en el orden de la lista (fila por fila, de izquierda a derecha).
3. Guardá cada hoja como `assets-src/items/hoja-1.png`, `hoja-2.png`, … (en la carpeta del juego).
4. Corré `node tools/cortar-hojas.mjs`: corta cada hoja y deja cada ítem en **`src/assets/items/<clave>.png`**.
5. Listo: el juego usa solo las imágenes de esa carpeta (las que falten siguen con el dibujo de hoy). Si el servidor de desarrollo (`npm run dev`) ya estaba corriendo, reinicialo para que vea los archivos nuevos. Si preferís dibujarlos uno por uno, guardalos directo como `src/assets/items/<clave>.png` (32×32, fondo transparente).

## El prompt (copiar desde aquí)

Necesito pixel art de **íconos de ítems** para un juego de bloques con identidad costarricense («NanoBlocks»). Es un set original: no copies sprites de ningún juego existente.

**Formato**
- Hojas PNG de **256×256 px con fondo transparente**, cuadrícula de **8×8 celdas de 32×32 px**, sin bordes ni separación entre celdas. Cada celda es un ítem, en el orden exacto de la lista (fila por fila, de izquierda a derecha). Las celdas que sobran en la última hoja, vacías.
- Cada ícono ocupa ~26×26 px centrado en su celda, con 3 px de aire alrededor.

**Estilo (igual para todo el set)**
- Pixel art limpio, sin antialias ni degradados suaves, sin texto ni logos ni marcas.
- Contorno de 1 px más oscuro que el color del objeto (no negro puro), luz desde arriba a la izquierda, sombra abajo a la derecha, 1–2 pixeles de brillo.
- Paleta viva y cálida (trópico): verdes de selva, rojos, amarillos, azules del Caribe; máximo ~12 colores por ícono.
- Que se reconozca a 32×32 y también ampliado: siluetas claras, nada de detalles de 1 px sueltos.
- Herramientas y armas en diagonal (mango abajo a la izquierda, punta arriba a la derecha). Armaduras de frente. Comidas en plato, taza o envoltura cuando aplica (vista de 3/4).
- Mismo material = mismos colores: madera café cálido, piedra gris, hierro gris claro azulado, oro amarillo, diamante celeste, jade verde.

**La lista** (número · hoja/fila/columna · clave · qué dibujar)

### HOJA 1
1. [H1 F1 C1] `stick` — palo de madera
2. [H1 F1 C2] `coal` — trozo de carbón negro
3. [H1 F1 C3] `iron` — lingote de hierro
4. [H1 F1 C4] `gold` — lingote de oro
5. [H1 F1 C5] `diamond` — diamante tallado celeste
6. [H1 F1 C6] `apple` — manzana roja
7. [H1 F1 C7] `meat` — trozo de carne cruda roja
8. [H1 F1 C8] `bread` — gallo pinto: arroz con frijoles negros revueltos en un plato hondo
9. [H1 F2 C1] `brick` — ladrillo de barro rojizo
10. [H1 F2 C2] `cooked_meat` — carne asada dorada
11. [H1 F2 C3] `door` — puerta de madera (ícono pequeño)
12. [H1 F2 C4] `corn_seeds` — puñito de granos de maíz
13. [H1 F2 C5] `corn` — mazorca de maíz amarilla
14. [H1 F2 C6] `beans` — frijoles negros
15. [H1 F2 C7] `tortilla` — tortilla de maíz palmeada
16. [H1 F2 C8] `leather` — cuero curtido
17. [H1 F3 C1] `quartz` — cristal de cuarzo blanco
18. [H1 F3 C2] `jade_shard` — esquirla de jade verde
19. [H1 F3 C3] `jade_ingot` — lingote de jade verde
20. [H1 F3 C4] `banana` — banano amarillo
21. [H1 F3 C5] `papaya` — papaya partida mostrando semillas negras
22. [H1 F3 C6] `macaw_feather` — pluma roja con punta azul de lapa
23. [H1 F3 C7] `quetzal_feather` — pluma larga verde esmeralda de quetzal
24. [H1 F3 C8] `honey` — frasco de miel dorada de abejas
25. [H1 F4 C1] `guano` — saco pequeño de abono (guano)
26. [H1 F4 C2] `antivenom` — frasquito de suero antiofídico con etiqueta verde
27. [H1 F4 C3] `net` — red para cazar mariposas
28. [H1 F4 C4] `jar` — frasco de vidrio vacío
29. [H1 F4 C5] `dart_frog` — ranita dardo roja con patas azules
30. [H1 F4 C6] `lucky_amulet` — amuleto de jade verde en un cordón
31. [H1 F4 C7] `morpho_jar_item` — frasco con mariposa morfo azul brillante adentro
32. [H1 F4 C8] `egg` — huevo blanco
33. [H1 F5 C1] `fried_egg` — huevo frito
34. [H1 F5 C2] `bucket` — balde de metal vacío
35. [H1 F5 C3] `water_bucket` — balde de metal con agua
36. [H1 F5 C4] `lava_bucket` — balde con lava
37. [H1 F5 C5] `milk_bucket` — balde con leche
38. [H1 F5 C6] `saddle` — albarda (montura) de cuero
39. [H1 F5 C7] `coffee_cherry` — racimito de cerezas de café rojas
40. [H1 F5 C8] `roasted_coffee` — granos de café tostados café oscuro
41. [H1 F6 C1] `cane_item` — tallo de caña de azúcar verde con nudos
42. [H1 F6 C2] `tapa_dulce` — tapa de dulce: bloque cónico de panela café
43. [H1 F6 C3] `cafe_chorreado` — taza de café negro humeante junto a un chorreador de tela
44. [H1 F6 C4] `agua_dulce` — jarro de agua dulce café claro
45. [H1 F6 C5] `wood_pickaxe` — Pico de madera (herramienta)
46. [H1 F6 C6] `stone_pickaxe` — Pico de piedra (herramienta)
47. [H1 F6 C7] `iron_pickaxe` — Pico de hierro (herramienta)
48. [H1 F6 C8] `diamond_pickaxe` — Pico de diamante (herramienta)
49. [H1 F7 C1] `wood_axe` — Hacha de madera (herramienta)
50. [H1 F7 C2] `stone_axe` — Hacha de piedra (herramienta)
51. [H1 F7 C3] `iron_axe` — Hacha de hierro (herramienta)
52. [H1 F7 C4] `diamond_axe` — Hacha de diamante (herramienta)
53. [H1 F7 C5] `wood_shovel` — Pala de madera (herramienta)
54. [H1 F7 C6] `stone_shovel` — Pala de piedra (herramienta)
55. [H1 F7 C7] `iron_shovel` — Pala de hierro (herramienta)
56. [H1 F7 C8] `diamond_shovel` — Pala de diamante (herramienta)
57. [H1 F8 C1] `wood_sword` — Espada de madera (herramienta)
58. [H1 F8 C2] `stone_sword` — Espada de piedra (herramienta)
59. [H1 F8 C3] `iron_sword` — Espada de hierro (herramienta)
60. [H1 F8 C4] `diamond_sword` — Espada de diamante (herramienta)
61. [H1 F8 C5] `wood_hoe` — Azada de madera (herramienta)
62. [H1 F8 C6] `stone_hoe` — Azada de piedra (herramienta)
63. [H1 F8 C7] `iron_hoe` — Azada de hierro (herramienta)
64. [H1 F8 C8] `diamond_hoe` — Azada de diamante (herramienta)

### HOJA 2
65. [H2 F1 C1] `jade_hoe` — Azada de jade (herramienta)
66. [H2 F1 C2] `jade_pickaxe` — Pico de jade (herramienta)
67. [H2 F1 C3] `jade_axe` — Hacha de jade (herramienta)
68. [H2 F1 C4] `jade_shovel` — Pala de jade (herramienta)
69. [H2 F1 C5] `jade_sword` — Espada de jade (herramienta)
70. [H2 F1 C6] `machete` — machete de hoja larga con mango de madera
71. [H2 F1 C7] `arco` — arco de madera con cuerda
72. [H2 F1 C8] `flecha` — flecha con plumas
73. [H2 F2 C1] `machete_cadejos` — machete oscuro con brillo rojo, mango negro con cadena
74. [H2 F2 C2] `leather_head` — Casco de cuero (pieza de armadura de leather)
75. [H2 F2 C3] `leather_chest` — Pechera de cuero (pieza de armadura de leather)
76. [H2 F2 C4] `leather_legs` — Pantalones de cuero (pieza de armadura de leather)
77. [H2 F2 C5] `leather_feet` — Botas de cuero (pieza de armadura de leather)
78. [H2 F2 C6] `iron_head` — Casco de hierro (pieza de armadura de iron)
79. [H2 F2 C7] `iron_chest` — Pechera de hierro (pieza de armadura de iron)
80. [H2 F2 C8] `iron_legs` — Pantalones de hierro (pieza de armadura de iron)
81. [H2 F3 C1] `iron_feet` — Botas de hierro (pieza de armadura de iron)
82. [H2 F3 C2] `diamond_head` — Casco de diamante (pieza de armadura de diamond)
83. [H2 F3 C3] `diamond_chest` — Pechera de diamante (pieza de armadura de diamond)
84. [H2 F3 C4] `diamond_legs` — Pantalones de diamante (pieza de armadura de diamond)
85. [H2 F3 C5] `diamond_feet` — Botas de diamante (pieza de armadura de diamond)
86. [H2 F3 C6] `jade_head` — Casco de jade (pieza de armadura de jade)
87. [H2 F3 C7] `jade_chest` — Pechera de jade (pieza de armadura de jade)
88. [H2 F3 C8] `jade_legs` — Pantalones de jade (pieza de armadura de jade)
89. [H2 F4 C1] `jade_feet` — Botas de jade (pieza de armadura de jade)
90. [H2 F4 C2] `pinto_huevo` — gallo pinto con un huevo frito encima
91. [H2 F4 C3] `casado` — plato con arroz, frijoles, ensalada, plátano maduro y carne
92. [H2 F4 C4] `chifrijo` — tazón con frijoles, chicharrón, arroz y pico de gallo
93. [H2 F4 C5] `tamal` — tamal envuelto en hoja de plátano verde amarrada con mecate
94. [H2 F4 C6] `platano_maduro` — plátano maduro frito, dorado y caramelizado
95. [H2 F4 C7] `cana_pescar` — caña de pescar con carrete
96. [H2 F4 C8] `bote` — bote de remos de madera pintado de azul
97. [H2 F5 C1] `colon` — moneda dorada grande de colón costarricense (sin texto)
98. [H2 F5 C2] `pargo` — pargo rojo crudo
99. [H2 F5 C3] `corvina` — corvina plateada cruda
100. [H2 F5 C4] `guapote` — guapote (pez de río) crudo
101. [H2 F5 C5] `dorado` — pez dorado (mahi-mahi) verde y amarillo crudo
102. [H2 F5 C6] `pescado_frito` — pescado frito entero con limón
103. [H2 F5 C7] `ceviche` — vaso de ceviche con limón y culantro
104. [H2 F5 C8] `limon` — limón mandarina anaranjado
105. [H2 F6 C1] `bota_vieja` — bota vieja rota (basura del mar)
106. [H2 F6 C2] `perla` — perla blanca brillante
107. [H2 F6 C3] `colmillo_cadejos` — colmillo negro grande con brillo rojo
108. [H2 F6 C4] `calavera_segua` — calavera de caballo pequeña
109. [H2 F6 C5] `lagrima_llorona` — lágrima de cristal celeste brillante
110. [H2 F6 C6] `bombeta` — cohete de fiesta (bombeta) con mecha y palito
111. [H2 F6 C7] `guaro` — botella pequeña transparente de guaro de caña
112. [H2 F6 C8] `mascarada` — máscara de mascarada tica: cabezona de papel maché, colorida
113. [H2 F7 C1] `mango` — mango maduro amarillo y rojo
114. [H2 F7 C2] `llave_volcan` — llave antigua de piedra volcánica con brillo naranja
115. [H2 F7 C3] `azufre` — trozo de azufre amarillo
116. [H2 F7 C4] `caldo_hongo` — tazón de caldo con hongos
117. [H2 F7 C5] `churchill` — copa alta con hielo raspado rojo, leche en polvo y helado
118. [H2 F7 C6] `pipa` — pipa (coco verde) con una pajilla
119. [H2 F7 C7] `copo` — copo de hielo raspado con sirope rojo en vasito
120. [H2 F7 C8] `oreja_guanacaste` — vaina de guanacaste en forma de oreja, café oscura
121. [H2 F8 C1] `pluma_dorada` — pluma dorada brillante
122. [H2 F8 C2] `escritura` — documento enrollado con sello rojo de lacre
123. [H2 F8 C3] `bidon` — bidón rojo de combustible
124. [H2 F8 C4] `mechero` — encendedor plástico
125. [H2 F8 C5] `olla_carne` — olla con sopa de carne y verduras
126. [H2 F8 C6] `empanada` — empanada dorada de maíz
127. [H2 F8 C7] `chorreada` — chorreada (panqueque de maíz) con natilla
128. [H2 F8 C8] `hongo_potrero` — hongo de sombrero café claro con pintas blancas

### HOJA 3
129. [H3 F1 C1] `cajeta` — cajeta de leche: cuadrito café claro
130. [H3 F1 C2] `chicharron` — chicharrón dorado y crujiente
131. [H3 F1 C3] `corazon_arenal` — corazón de lava: piedra negra con grietas naranjas brillantes
132. [H3 F1 C4] `escudo_madera` — Escudo de madera (pieza de armadura de wood)
133. [H3 F1 C5] `escudo_hierro` — Escudo de hierro (pieza de armadura de iron)
134. [H3 F1 C6] `escudo_jade` — Escudo de jade (pieza de armadura de jade)
135. [H3 F1 C7] `lanza` — lanza de hierro
136. [H3 F1 C8] `mazo` — mazo de hierro pesado
137. [H3 F2 C1] `garrote` — garrote de madera de guayabo
138. [H3 F2 C2] `sombrero_tule` — sombrero ancho de tule tejido
139. [H3 F2 C3] `pluma_arpia` — pluma gris pizarra de águila arpía
140. [H3 F2 C4] `capa_arpia` — capa de plumas gris pizarra con broche dorado
141. [H3 F2 C5] `cacao` — semillas de cacao café
142. [H3 F2 C6] `chocolate` — barra de chocolate artesanal envuelta a medias
143. [H3 F2 C7] `queso_turrialba` — queso Turrialba: rueda blanca
144. [H3 F2 C8] `natilla` — vasito de natilla blanca
145. [H3 F3 C1] `sombrero_sabanero` — sombrero de cuero café de ala ancha
146. [H3 F3 C2] `escritura_pueblo` — documento de papel con sello azul de municipalidad
147. [H3 F3 C3] `carro_viejo` — carro viejo de los 80 visto de lado, rojo, con óxido
148. [H3 F3 C4] `polea` — polea de tirolesa con mosquetón amarillo
149. [H3 F3 C5] `arroz_con_leche` — tazón de arroz con leche con canela
150. [H3 F3 C6] `sopa_negra` — plato de sopa negra con huevo duro
151. [H3 F3 C7] `gallo_picadillo` — gallos: tortilla doblada con picadillo verde
152. [H3 F3 C8] `platano_queso` — plátano maduro con queso derretido
153. [H3 F4 C1] `tres_leches` — porción de queque tres leches con merengue y cereza
154. [H3 F4 C2] `cafe_con_leche` — taza de café con leche
155. [H3 F4 C3] `arroz` — bolsa de arroz
156. [H3 F4 C4] `repelente` — botellita de repelente con dibujo de limón
157. [H3 F4 C5] `corazon_monte` — corazón de madera con musgo verde y brillo verde
158. [H3 F4 C6] `bola` — bola de fútbol blanca con pentágonos negros
159. [H3 F4 C7] `cantimplora_vacia` — cantimplora de cuero café, vacía y aplanada, con tapón de madera y correa
160. [H3 F4 C8] `cantimplora` — cantimplora de cuero café llena y redonda con una gota de agua azul
161. [H3 F5 C1] `sabila` — mata de sábila (aloe) verde con hojas gruesas y puntiagudas
162. [H3 F5 C2] `manzanilla` — ramito de manzanilla con florecitas blancas de centro amarillo
163. [H3 F5 C3] `hierbabuena` — ramita de hierbabuena con hojas verdes dentadas
164. [H3 F5 C4] `jengibre` — raíz de jengibre beige con nudos
165. [H3 F5 C5] `honda` — honda de madera en forma de Y con liga de cuero
166. [H3 F5 C6] `cerbatana` — cerbatana larga de caña verde con nudos
167. [H3 F5 C7] `dardo` — dardo fino de madera con punta verde de veneno y cola de algodón
168. [H3 F5 C8] `jabalina` — jabalina de madera con punta de hierro y cinta roja
169. [H3 F6 C1] `colmillo_jaguar` — colmillo grande de jaguar, curvo y marfil, con un cordón
170. [H3 F6 C2] `diente_cocodrilo` — diente de cocodrilo enorme, cónico y amarillento
171. [H3 F6 C3] `veneno_reina` — frasco con veneno verde brillante y una calavera de serpiente
172. [H3 F6 C4] `machete_doble` — machete de doble filo con mango de cuero, colmillo y diente amarrados
173. [H3 F6 C5] `venda` — Venda
174. [H3 F6 C6] `alcohol` — Alcohol
175. [H3 F6 C7] `suero` — Suero oral
176. [H3 F6 C8] `botiquin` — Botiquín
177. [H3 F7 C1] `mapa_tesoro` — Mapa del tesoro
178. [H3 F7 C2] `careta` — Careta de buceo
179. [H3 F7 C3] `brocha` — Brocha
180. [H3 F7 C4] `mochila` — Mochila de cuero
181. [H3 F7 C5] `pan_casero` — Pan casero de la abuela
182. [H3 F7 C6] `agua_de_sapo` — Agua de sapo
183. [H3 F7 C7] `arroz_con_leche` — tazón de arroz con leche con canela
184. [H3 F7 C8] `libro_recetas` — Libro de recetas viejo
185. [H3 F8 C1] `plano_adobe` — Plano: casita de adobe
186. [H3 F8 C2] `plano_madera` — Plano: casa de madera con corredor
187. [H3 F8 C3] `plano_rancho` — Plano: rancho de playa
188. [H3 F8 C4] `bicicleta` — Bicicleta
189. [H3 F8 C5] `moto` — Moto
190. [H3 F8 C6] `lancha` — Lancha con motor
191. [H3 F8 C7] `cajuela` — Cajuela (canasto para coger café)
192. [H3 F8 C8] `cajuela_llena` — Cajuela llena de café

### HOJA 4
193. [H4 F1 C1] `batea` — Batea
194. [H4 F1 C2] `pepita` — Pepita de oro
195. [H4 F1 C3] `cartelito` — Cartelito para nombre
196. [H4 F1 C4] `red_pesca_item` — Red de pesca
197. [H4 F1 C5] `escama_sirena` — Escama de sirena
198. [H4 F1 C6] `fragmento_meteorito` — Fragmento de meteorito
199. [H4 F1 C7] `corona_pina` — Corona de piña (para sembrar)
200. [H4 F1 C8] `pina` — Piña
201. [H4 F2 C1] `fresco_pina` — Fresco de piña
202. [H4 F2 C2] `cajeta_pina` — Cajeta de piña
203. [H4 F2 C3] `mechon_congo` — Mechón del Mono congo (clic derecho: aullar)
204. [H4 F2 C4] `silbato_reto` — Silbato del reto (clic derecho: arma la arena)
205. [H4 F2 C5] `copa_reto` — Copa del reto
206. [H4 F2 C6] `papalote` — Papalote (clic derecho: volarlo)
207. [H4 F2 C7] `trompo` — Trompo (clic derecho al piso: bailarlo)
208. [H4 F2 C8] `chumicos` — Chumicos (clic derecho a un vecino: jugar)
209. [H4 F3 C1] `parapente` — Parapente (clic derecho cayendo: abrirlo)
210. [H4 F3 C2] `avioneta` — Avioneta (clic derecho al suelo: ponerla)
211. [H4 F3 C3] `bandera_circuito` — Bandera de circuito (clic derecho: aros en el cielo)
212. [H4 F3 C4] `tabla_surf` — Tabla de surf (clic derecho en el mar)
213. [H4 F3 C5] `yuca` — Yuca
214. [H4 F3 C6] `vigoron` — Vigorón
215. [H4 F3 C7] `rosquillas` — Rosquillas
216. [H4 F3 C8] `tanelas` — Tanelas
217. [H4 F4 C1] `arroz_con_pollo` — Arroz con pollo
218. [H4 F4 C2] `trofeo_pesca` — Trofeo del torneo de pesca
219. [H4 F4 C3] `peluche_perezoso` — Peluche de perezoso (premio de feria)
220. [H4 F4 C4] `carreta_bueyes` — Carreta con bueyes (clic derecho al suelo: ponerla)
221. [H4 F4 C5] `arco_cintas` — Arco de cintas (clic derecho: armarlo)
222. [H4 F4 C6] `cinta` — Cinta de la carrera de cintas
223. [H4 F4 C7] `permiso_todo` — Permiso de Todo (sellado siete veces)
224. [H4 F4 C8] `saco_gangoche` — Saco de gangoche (clic derecho: carrera de sacos)
225. [H4 F5 C1] `racimo_pejibaye` — Racimo de pejibayes (crudos)
226. [H4 F5 C2] `pejibaye` — Pejibayes cocinados
227. [H4 F5 C3] `pejibaye_mayonesa` — Pejibayes con mayonesa
228. [H4 F5 C4] `pedazo_tierra` — Pedazo de la tierra
229. [H4 F5 C5] `pedazo_agua` — Pedazo del agua
230. [H4 F5 C6] `pedazo_fuego` — Pedazo del fuego
231. [H4 F5 C7] `pedazo_cielo` — Pedazo del cielo
232. [H4 F5 C8] `esencia_sombra` — Esencia de sombra
233. [H4 F6 C1] `aceite_filo` — Aceite de filo (clic derecho: va a su mejor arma)
234. [H4 F6 C2] `candela_regreso` — Candela de regreso (clic derecho: vuelve a donde durmió)
235. [H4 F6 C3] `maletin` — Maletín del tío Rigo
236. [H4 F6 C4] `machete_zenaida` — Machete de Zenaida
237. [H4 F6 C5] `delantal_zenaida` — Delantal de Zenaida (pieza de armadura de leather)
238. [H4 F6 C6] `chancleta_zenaida` — Chancleta de Zenaida (clic derecho: se tira y vuelve)
239. [H4 F6 C7] `sombrero_zenaida` — Sombrero de Zenaida (pieza de armadura de leather)
240. [H4 F6 C8] `cucharon_zenaida` — Cucharón de Zenaida (con tenerlo, la comida rinde más)
241. [H4 F7 C1] `tablilla` — Tablilla (arregla la pierna quebrada)
242. [H4 F7 C2] `tranca` — Tranca (clic derecho a una puerta)
243. [H4 F7 C3] `cigarros_62` — Cigarros del 62, sin abrir (un recuerdo)
244. [H4 F7 C4] `hoja_firmas` — Hoja de firmas (clic derecho a un vecino)
245. [H4 F7 C5] `escritura` — documento enrollado con sello rojo de lacre
246. [H4 F7 C6] `martillo_tino` — Martillo de Ñor Tino
247. [H4 F7 C7] `recetario_chepa` — Recetario de Niña Chepa
248. [H4 F7 C8] `mata_flor` — La mata de Doña Flor
249. [H4 F8 C1] `catalejo_wilber` — Catalejo de Mae Wilber
250. [H4 F8 C2] `sobre_marielos` — Sobre sellado: «Para Marielos»
251. [H4 F8 C3] `otra_chancleta` — La otra chancleta (con las dos, se pega más duro)
252. [H4 F8 C4] `sello_oficina` — Sello de oficina
253. [H4 F8 C5] `sello_goma` — Sello de goma (a veces deja aturdido)
254. [H4 F8 C6] `sobre_estampas` — Sobre de estampas (clic derecho: abrirlo)
255. [H4 F8 C7] `bomba_espalda` — Bomba de espalda (clic derecho: rocía agua lejos; se llena en el agua)
256. [H4 F8 C8] `agua_bendita` — Agua bendita (clic derecho: 3 minutos en que sus golpes le entran a los espantos)

### HOJA 5
257. [H5 F1 C1] `guaco` — Guaco (clic derecho: cura la mordida de culebra)
258. [H5 F1 C2] `mascarilla` — Mascarilla de gases (en la mochila, protege de los gases del cráter)
259. [H5 F1 C3] `piel_becquer` — Piel de bécquer
260. [H5 F1 C4] `botas_becquer` — Botas de bécquer (las culebras no le pasan el colmillo) (pieza de armadura de leather)
261. [H5 F1 C5] `panuelo_chata` — Pañuelo de los Chatas (puesto, lo confunden con uno de la banda) (pieza de armadura de leather)
262. [H5 F1 C6] `cacho_toro` — Cacho del Toro Guaco (clic derecho: lo sopla y espanta a las criaturas)

(fin del prompt)

## Tabla de archivos (para nosotros)

| # | Hoja·fila·col | Clave | Nombre en el juego | Archivo nuevo | Dibujo de hoy |
|---|---|---|---|---|---|
| 1 | 1·1·1 | `stick` | Palo | `src/assets/items/stick.png` | `public/sprites/stick.png` |
| 2 | 1·1·2 | `coal` | Carbón | `src/assets/items/coal.png` | `public/sprites/ore_coal.png` |
| 3 | 1·1·3 | `iron` | Hierro | `src/assets/items/iron.png` | `public/sprites/ore_iron.png` |
| 4 | 1·1·4 | `gold` | Oro | `src/assets/items/gold.png` | `public/sprites/ore_gold.png` |
| 5 | 1·1·5 | `diamond` | Diamante | `src/assets/items/diamond.png` | `public/sprites/ore_diamond.png` |
| 6 | 1·1·6 | `apple` | Manzana | `src/assets/items/apple.png` | `public/sprites/apple.png` |
| 7 | 1·1·7 | `meat` | Carne cruda | `src/assets/items/meat.png` | `public/sprites/meat.png` |
| 8 | 1·1·8 | `bread` | Gallo pinto | `src/assets/items/bread.png` | `public/sprites/stew.png` |
| 9 | 1·2·1 | `brick` | Ladrillo | `src/assets/items/brick.png` | `src/textures.js:104` |
| 10 | 1·2·2 | `cooked_meat` | Carne asada | `src/assets/items/cooked_meat.png` | `src/textures.js (dibujo genérico)` |
| 11 | 1·2·3 | `door` | Puerta | `src/assets/items/door.png` | `src/textures.js:113` |
| 12 | 1·2·4 | `corn_seeds` | Semillas de maíz | `src/assets/items/corn_seeds.png` | `src/textures.js:531` |
| 13 | 1·2·5 | `corn` | Mazorca | `src/assets/items/corn.png` | `src/textures.js:522` |
| 14 | 1·2·6 | `beans` | Frijoles | `src/assets/items/beans.png` | `src/textures.js:536` |
| 15 | 1·2·7 | `tortilla` | Tortilla | `src/assets/items/tortilla.png` | `src/textures.js:541` |
| 16 | 1·2·8 | `leather` | Cuero | `src/assets/items/leather.png` | `src/textures.js:546` |
| 17 | 1·3·1 | `quartz` | Cuarzo | `src/assets/items/quartz.png` | `src/textures.js:551` |
| 18 | 1·3·2 | `jade_shard` | Fragmento de jade | `src/assets/items/jade_shard.png` | `public/sprites/ore_emerald.png` |
| 19 | 1·3·3 | `jade_ingot` | Lingote de jade | `src/assets/items/jade_ingot.png` | `src/textures.js:556` |
| 20 | 1·3·4 | `banana` | Banano | `src/assets/items/banana.png` | `src/textures.js:561` |
| 21 | 1·3·5 | `papaya` | Papaya | `src/assets/items/papaya.png` | `src/textures.js:565` |
| 22 | 1·3·6 | `macaw_feather` | Pluma de lapa | `src/assets/items/macaw_feather.png` | `src/textures.js:570` |
| 23 | 1·3·7 | `quetzal_feather` | Pluma de quetzal | `src/assets/items/quetzal_feather.png` | `src/textures.js:570` |
| 24 | 1·3·8 | `honey` | Miel de melipona | `src/assets/items/honey.png` | `src/textures.js:580` |
| 25 | 1·4·1 | `guano` | Guano (abono) | `src/assets/items/guano.png` | `src/textures.js:589` |
| 26 | 1·4·2 | `antivenom` | Suero antiofídico | `src/assets/items/antivenom.png` | `src/textures.js:580` |
| 27 | 1·4·3 | `net` | Red para mariposas | `src/assets/items/net.png` | `src/textures.js:593` |
| 28 | 1·4·4 | `jar` | Frasco vacío | `src/assets/items/jar.png` | `src/textures.js:580` |
| 29 | 1·4·5 | `dart_frog` | Rana dardo (en frasco) | `src/assets/items/dart_frog.png` | `src/textures.js:580` |
| 30 | 1·4·6 | `lucky_amulet` | Amuleto de la suerte | `src/assets/items/lucky_amulet.png` | `src/textures.js:597` |
| 31 | 1·4·7 | `morpho_jar_item` | Frasco con morfo | `src/assets/items/morpho_jar_item.png` | `src/textures.js:580` |
| 32 | 1·4·8 | `egg` | Huevo | `src/assets/items/egg.png` | `src/textures.js (dibujo genérico)` |
| 33 | 1·5·1 | `fried_egg` | Huevo frito | `src/assets/items/fried_egg.png` | `src/textures.js (dibujo genérico)` |
| 34 | 1·5·2 | `bucket` | Balde | `src/assets/items/bucket.png` | `src/textures.js (dibujo genérico)` |
| 35 | 1·5·3 | `water_bucket` | Balde con agua | `src/assets/items/water_bucket.png` | `src/textures.js (dibujo genérico)` |
| 36 | 1·5·4 | `lava_bucket` | Balde con lava | `src/assets/items/lava_bucket.png` | `src/textures.js (dibujo genérico)` |
| 37 | 1·5·5 | `milk_bucket` | Balde de leche | `src/assets/items/milk_bucket.png` | `src/textures.js (dibujo genérico)` |
| 38 | 1·5·6 | `saddle` | Albarda | `src/assets/items/saddle.png` | `src/textures.js (dibujo genérico)` |
| 39 | 1·5·7 | `coffee_cherry` | Café en cereza | `src/assets/items/coffee_cherry.png` | `src/textures.js:602` |
| 40 | 1·5·8 | `roasted_coffee` | Café tostado | `src/assets/items/roasted_coffee.png` | `src/textures.js:602` |
| 41 | 1·6·1 | `cane_item` | Caña de azúcar | `src/assets/items/cane_item.png` | `src/textures.js:608` |
| 42 | 1·6·2 | `tapa_dulce` | Tapa de dulce | `src/assets/items/tapa_dulce.png` | `src/textures.js:694` |
| 43 | 1·6·3 | `cafe_chorreado` | Café chorreado | `src/assets/items/cafe_chorreado.png` | `src/textures.js:699` |
| 44 | 1·6·4 | `agua_dulce` | Agua dulce | `src/assets/items/agua_dulce.png` | `src/textures.js:699` |
| 45 | 1·6·5 | `wood_pickaxe` | Pico de madera | `src/assets/items/wood_pickaxe.png` | `public/sprites/pick_bronze.png` |
| 46 | 1·6·6 | `stone_pickaxe` | Pico de piedra | `src/assets/items/stone_pickaxe.png` | `public/sprites/pick_iron.png` |
| 47 | 1·6·7 | `iron_pickaxe` | Pico de hierro | `src/assets/items/iron_pickaxe.png` | `public/sprites/pick_silver.png` |
| 48 | 1·6·8 | `diamond_pickaxe` | Pico de diamante | `src/assets/items/diamond_pickaxe.png` | `public/sprites/pick_diamond.png` |
| 49 | 1·7·1 | `wood_axe` | Hacha de madera | `src/assets/items/wood_axe.png` | `public/sprites/axe_bronze.png` |
| 50 | 1·7·2 | `stone_axe` | Hacha de piedra | `src/assets/items/stone_axe.png` | `public/sprites/axe_iron.png` |
| 51 | 1·7·3 | `iron_axe` | Hacha de hierro | `src/assets/items/iron_axe.png` | `public/sprites/axe_silver.png` |
| 52 | 1·7·4 | `diamond_axe` | Hacha de diamante | `src/assets/items/diamond_axe.png` | `public/sprites/axe_diamond.png` |
| 53 | 1·7·5 | `wood_shovel` | Pala de madera | `src/assets/items/wood_shovel.png` | `public/sprites/shovel_bronze.png` |
| 54 | 1·7·6 | `stone_shovel` | Pala de piedra | `src/assets/items/stone_shovel.png` | `public/sprites/shovel_iron.png` |
| 55 | 1·7·7 | `iron_shovel` | Pala de hierro | `src/assets/items/iron_shovel.png` | `public/sprites/shovel_silver.png` |
| 56 | 1·7·8 | `diamond_shovel` | Pala de diamante | `src/assets/items/diamond_shovel.png` | `public/sprites/shovel_diamond.png` |
| 57 | 1·8·1 | `wood_sword` | Espada de madera | `src/assets/items/wood_sword.png` | `public/sprites/sword_bronze.png` |
| 58 | 1·8·2 | `stone_sword` | Espada de piedra | `src/assets/items/stone_sword.png` | `public/sprites/sword_iron.png` |
| 59 | 1·8·3 | `iron_sword` | Espada de hierro | `src/assets/items/iron_sword.png` | `public/sprites/sword_silver.png` |
| 60 | 1·8·4 | `diamond_sword` | Espada de diamante | `src/assets/items/diamond_sword.png` | `public/sprites/sword_diamond.png` |
| 61 | 1·8·5 | `wood_hoe` | Azada de madera | `src/assets/items/wood_hoe.png` | `public/sprites/hoe_bronze.png` |
| 62 | 1·8·6 | `stone_hoe` | Azada de piedra | `src/assets/items/stone_hoe.png` | `public/sprites/hoe_iron.png` |
| 63 | 1·8·7 | `iron_hoe` | Azada de hierro | `src/assets/items/iron_hoe.png` | `public/sprites/hoe_silver.png` |
| 64 | 1·8·8 | `diamond_hoe` | Azada de diamante | `src/assets/items/diamond_hoe.png` | `public/sprites/hoe_diamond.png` |
| 65 | 2·1·1 | `jade_hoe` | Azada de jade | `src/assets/items/jade_hoe.png` | `public/sprites/hoe_diamond.png` |
| 66 | 2·1·2 | `jade_pickaxe` | Pico de jade | `src/assets/items/jade_pickaxe.png` | `public/sprites/pick_diamond.png` |
| 67 | 2·1·3 | `jade_axe` | Hacha de jade | `src/assets/items/jade_axe.png` | `public/sprites/axe_diamond.png` |
| 68 | 2·1·4 | `jade_shovel` | Pala de jade | `src/assets/items/jade_shovel.png` | `public/sprites/shovel_diamond.png` |
| 69 | 2·1·5 | `jade_sword` | Espada de jade | `src/assets/items/jade_sword.png` | `public/sprites/sword_diamond.png` |
| 70 | 2·1·6 | `machete` | Machete | `src/assets/items/machete.png` | `src/textures.js:612` |
| 71 | 2·1·7 | `arco` | Arco | `src/assets/items/arco.png` | `src/textures.js:625` |
| 72 | 2·1·8 | `flecha` | Flecha | `src/assets/items/flecha.png` | `src/textures.js:629` |
| 73 | 2·2·1 | `machete_cadejos` | Machete del Cadejos | `src/assets/items/machete_cadejos.png` | `src/textures.js:612` |
| 74 | 2·2·2 | `leather_head` | Casco de cuero | `src/assets/items/leather_head.png` | `src/textures.js (dibujo genérico)` |
| 75 | 2·2·3 | `leather_chest` | Pechera de cuero | `src/assets/items/leather_chest.png` | `src/textures.js (dibujo genérico)` |
| 76 | 2·2·4 | `leather_legs` | Pantalones de cuero | `src/assets/items/leather_legs.png` | `src/textures.js (dibujo genérico)` |
| 77 | 2·2·5 | `leather_feet` | Botas de cuero | `src/assets/items/leather_feet.png` | `src/textures.js (dibujo genérico)` |
| 78 | 2·2·6 | `iron_head` | Casco de hierro | `src/assets/items/iron_head.png` | `src/textures.js (dibujo genérico)` |
| 79 | 2·2·7 | `iron_chest` | Pechera de hierro | `src/assets/items/iron_chest.png` | `src/textures.js (dibujo genérico)` |
| 80 | 2·2·8 | `iron_legs` | Pantalones de hierro | `src/assets/items/iron_legs.png` | `src/textures.js (dibujo genérico)` |
| 81 | 2·3·1 | `iron_feet` | Botas de hierro | `src/assets/items/iron_feet.png` | `src/textures.js (dibujo genérico)` |
| 82 | 2·3·2 | `diamond_head` | Casco de diamante | `src/assets/items/diamond_head.png` | `src/textures.js (dibujo genérico)` |
| 83 | 2·3·3 | `diamond_chest` | Pechera de diamante | `src/assets/items/diamond_chest.png` | `src/textures.js (dibujo genérico)` |
| 84 | 2·3·4 | `diamond_legs` | Pantalones de diamante | `src/assets/items/diamond_legs.png` | `src/textures.js (dibujo genérico)` |
| 85 | 2·3·5 | `diamond_feet` | Botas de diamante | `src/assets/items/diamond_feet.png` | `src/textures.js (dibujo genérico)` |
| 86 | 2·3·6 | `jade_head` | Casco de jade | `src/assets/items/jade_head.png` | `src/textures.js (dibujo genérico)` |
| 87 | 2·3·7 | `jade_chest` | Pechera de jade | `src/assets/items/jade_chest.png` | `src/textures.js (dibujo genérico)` |
| 88 | 2·3·8 | `jade_legs` | Pantalones de jade | `src/assets/items/jade_legs.png` | `src/textures.js (dibujo genérico)` |
| 89 | 2·4·1 | `jade_feet` | Botas de jade | `src/assets/items/jade_feet.png` | `src/textures.js (dibujo genérico)` |
| 90 | 2·4·2 | `pinto_huevo` | Gallo pinto con huevo | `src/assets/items/pinto_huevo.png` | `src/textures.js:704` |
| 91 | 2·4·3 | `casado` | Casado | `src/assets/items/casado.png` | `src/textures.js:704` |
| 92 | 2·4·4 | `chifrijo` | Chifrijo | `src/assets/items/chifrijo.png` | `src/textures.js:704` |
| 93 | 2·4·5 | `tamal` | Tamal | `src/assets/items/tamal.png` | `src/textures.js:704` |
| 94 | 2·4·6 | `platano_maduro` | Plátano maduro | `src/assets/items/platano_maduro.png` | `src/textures.js:704` |
| 95 | 2·4·7 | `cana_pescar` | Caña de pescar | `src/assets/items/cana_pescar.png` | `src/textures.js:644` |
| 96 | 2·4·8 | `bote` | Bote de remos | `src/assets/items/bote.png` | `src/textures.js:660` |
| 97 | 2·5·1 | `colon` | Colón | `src/assets/items/colon.png` | `src/textures.js:687` |
| 98 | 2·5·2 | `pargo` | Pargo rojo | `src/assets/items/pargo.png` | `src/textures.js:665` |
| 99 | 2·5·3 | `corvina` | Corvina | `src/assets/items/corvina.png` | `src/textures.js:665` |
| 100 | 2·5·4 | `guapote` | Guapote | `src/assets/items/guapote.png` | `src/textures.js:665` |
| 101 | 2·5·5 | `dorado` | Dorado | `src/assets/items/dorado.png` | `src/textures.js:665` |
| 102 | 2·5·6 | `pescado_frito` | Pescado frito | `src/assets/items/pescado_frito.png` | `src/textures.js:665` |
| 103 | 2·5·7 | `ceviche` | Ceviche | `src/assets/items/ceviche.png` | `src/textures.js:672` |
| 104 | 2·5·8 | `limon` | Limón mandarina | `src/assets/items/limon.png` | `src/textures.js:676` |
| 105 | 2·6·1 | `bota_vieja` | Bota vieja | `src/assets/items/bota_vieja.png` | `src/textures.js:680` |
| 106 | 2·6·2 | `perla` | Perla | `src/assets/items/perla.png` | `src/textures.js:683` |
| 107 | 2·6·3 | `colmillo_cadejos` | Colmillo del Cadejos | `src/assets/items/colmillo_cadejos.png` | `src/textures.js:633` |
| 108 | 2·6·4 | `calavera_segua` | Calavera de la Segua | `src/assets/items/calavera_segua.png` | `src/textures.js:636` |
| 109 | 2·6·5 | `lagrima_llorona` | Lágrima de la Llorona | `src/assets/items/lagrima_llorona.png` | `src/textures.js:641` |
| 110 | 2·6·6 | `bombeta` | Bombeta | `src/assets/items/bombeta.png` | `src/textures.js:620` |
| 111 | 2·6·7 | `guaro` | Guaro de caña | `src/assets/items/guaro.png` | `src/textures.js:129` |
| 112 | 2·6·8 | `mascarada` | Máscara de mascarada | `src/assets/items/mascarada.png` | `src/textures.js:119` |
| 113 | 2·7·1 | `mango` | Mango | `src/assets/items/mango.png` | `src/textures.js:495` |
| 114 | 2·7·2 | `llave_volcan` | Llave del volcán | `src/assets/items/llave_volcan.png` | `src/textures.js:483` |
| 115 | 2·7·3 | `azufre` | Azufre | `src/assets/items/azufre.png` | `src/textures.js:488` |
| 116 | 2·7·4 | `caldo_hongo` | Caldo de hongo de fuego | `src/assets/items/caldo_hongo.png` | `src/textures.js:490` |
| 117 | 2·7·5 | `churchill` | Churchill | `src/assets/items/churchill.png` | `src/textures.js:467` |
| 118 | 2·7·6 | `pipa` | Pipa fría | `src/assets/items/pipa.png` | `src/textures.js:473` |
| 119 | 2·7·7 | `copo` | Copo | `src/assets/items/copo.png` | `src/textures.js:478` |
| 120 | 2·7·8 | `oreja_guanacaste` | Oreja de guanacaste (semilla) | `src/assets/items/oreja_guanacaste.png` | `src/textures.js:462` |
| 121 | 2·8·1 | `pluma_dorada` | Pluma dorada | `src/assets/items/pluma_dorada.png` | `src/textures.js:458` |
| 122 | 2·8·2 | `escritura` | Escritura de lote con vista al mar | `src/assets/items/escritura.png` | `src/textures.js:453` |
| 123 | 2·8·3 | `bidon` | Bidón de combustible | `src/assets/items/bidon.png` | `src/textures.js:449` |
| 124 | 2·8·4 | `mechero` | Mechero | `src/assets/items/mechero.png` | `src/textures.js:443` |
| 125 | 2·8·5 | `olla_carne` | Olla de carne | `src/assets/items/olla_carne.png` | `src/textures.js:429` |
| 126 | 2·8·6 | `empanada` | Empanada | `src/assets/items/empanada.png` | `src/textures.js:434` |
| 127 | 2·8·7 | `chorreada` | Chorreada | `src/assets/items/chorreada.png` | `src/textures.js:438` |
| 128 | 2·8·8 | `hongo_potrero` | Hongo de potrero | `src/assets/items/hongo_potrero.png` | `src/textures.js:418` |
| 129 | 3·1·1 | `cajeta` | Cajeta de leche | `src/assets/items/cajeta.png` | `src/textures.js:423` |
| 130 | 3·1·2 | `chicharron` | Chicharrón | `src/assets/items/chicharron.png` | `src/textures.js:425` |
| 131 | 3·1·3 | `corazon_arenal` | Corazón del Arenal | `src/assets/items/corazon_arenal.png` | `src/textures.js:414` |
| 132 | 3·1·4 | `escudo_madera` | Escudo de madera | `src/assets/items/escudo_madera.png` | `src/textures.js:402` |
| 133 | 3·1·5 | `escudo_hierro` | Escudo de hierro | `src/assets/items/escudo_hierro.png` | `src/textures.js:402` |
| 134 | 3·1·6 | `escudo_jade` | Escudo de jade | `src/assets/items/escudo_jade.png` | `src/textures.js:402` |
| 135 | 3·1·7 | `lanza` | Lanza de hierro | `src/assets/items/lanza.png` | `src/textures.js:407` |
| 136 | 3·1·8 | `mazo` | Mazo de hierro | `src/assets/items/mazo.png` | `src/textures.js:410` |
| 137 | 3·2·1 | `garrote` | Garrote de guayabo | `src/assets/items/garrote.png` | `src/textures.js:410` |
| 138 | 3·2·2 | `sombrero_tule` | Sombrero de tule | `src/assets/items/sombrero_tule.png` | `src/textures.js:397` |
| 139 | 3·2·3 | `pluma_arpia` | Pluma de la Arpía | `src/assets/items/pluma_arpia.png` | `src/textures.js:387` |
| 140 | 3·2·4 | `capa_arpia` | Capa de la Arpía | `src/assets/items/capa_arpia.png` | `src/textures.js:392` |
| 141 | 3·2·5 | `cacao` | Semillas de cacao | `src/assets/items/cacao.png` | `src/textures.js:368` |
| 142 | 3·2·6 | `chocolate` | Chocolate artesanal | `src/assets/items/chocolate.png` | `src/textures.js:371` |
| 143 | 3·2·7 | `queso_turrialba` | Queso Turrialba | `src/assets/items/queso_turrialba.png` | `src/textures.js:375` |
| 144 | 3·2·8 | `natilla` | Natilla | `src/assets/items/natilla.png` | `src/textures.js:379` |
| 145 | 3·3·1 | `sombrero_sabanero` | Sombrero de sabanero | `src/assets/items/sombrero_sabanero.png` | `src/textures.js:382` |
| 146 | 3·3·2 | `escritura_pueblo` | Escritura de lote en el pueblo | `src/assets/items/escritura_pueblo.png` | `src/textures.js:453` |
| 147 | 3·3·3 | `carro_viejo` | Carro viejo (de segunda) | `src/assets/items/carro_viejo.png` | `src/textures.js:654` |
| 148 | 3·3·4 | `polea` | Polea de tirolesa | `src/assets/items/polea.png` | `src/textures.js:650` |
| 149 | 3·3·5 | `arroz_con_leche` | Arroz con leche | `src/assets/items/arroz_con_leche.png` | `src/textures.js:279` |
| 150 | 3·3·6 | `sopa_negra` | Sopa negra | `src/assets/items/sopa_negra.png` | `src/textures.js:349` |
| 151 | 3·3·7 | `gallo_picadillo` | Gallos de picadillo | `src/assets/items/gallo_picadillo.png` | `src/textures.js:357` |
| 152 | 3·3·8 | `platano_queso` | Plátano con queso | `src/assets/items/platano_queso.png` | `src/textures.js:362` |
| 153 | 3·4·1 | `tres_leches` | Tres leches | `src/assets/items/tres_leches.png` | `src/textures.js:365` |
| 154 | 3·4·2 | `cafe_con_leche` | Café con leche | `src/assets/items/cafe_con_leche.png` | `src/textures.js:349` |
| 155 | 3·4·3 | `arroz` | Arroz | `src/assets/items/arroz.png` | `src/textures.js:346` |
| 156 | 3·4·4 | `repelente` | Repelente de limón | `src/assets/items/repelente.png` | `src/textures.js:342` |
| 157 | 3·4·5 | `corazon_monte` | Corazón del monte | `src/assets/items/corazon_monte.png` | `src/textures.js:338` |
| 158 | 3·4·6 | `bola` | Bola de fútbol | `src/assets/items/bola.png` | `src/textures.js:334` |
| 159 | 3·4·7 | `cantimplora_vacia` | Cantimplora (vacía) | `src/assets/items/cantimplora_vacia.png` | `src/textures.js:324` |
| 160 | 3·4·8 | `cantimplora` | Cantimplora con agua | `src/assets/items/cantimplora.png` | `src/textures.js:324` |
| 161 | 3·5·1 | `sabila` | Sábila | `src/assets/items/sabila.png` | `src/textures.js:329` |
| 162 | 3·5·2 | `manzanilla` | Manzanilla | `src/assets/items/manzanilla.png` | `src/textures.js:329` |
| 163 | 3·5·3 | `hierbabuena` | Hierbabuena | `src/assets/items/hierbabuena.png` | `src/textures.js:329` |
| 164 | 3·5·4 | `jengibre` | Jengibre | `src/assets/items/jengibre.png` | `src/textures.js:329` |
| 165 | 3·5·5 | `honda` | Honda | `src/assets/items/honda.png` | `src/textures.js:304` |
| 166 | 3·5·6 | `cerbatana` | Cerbatana | `src/assets/items/cerbatana.png` | `src/textures.js:307` |
| 167 | 3·5·7 | `dardo` | Dardo envenenado | `src/assets/items/dardo.png` | `src/textures.js:310` |
| 168 | 3·5·8 | `jabalina` | Jabalina (para tirar) | `src/assets/items/jabalina.png` | `src/textures.js:312` |
| 169 | 3·6·1 | `colmillo_jaguar` | Colmillo del Jaguar viejo | `src/assets/items/colmillo_jaguar.png` | `src/textures.js:314` |
| 170 | 3·6·2 | `diente_cocodrilo` | Diente del cocodrilo del Tárcoles | `src/assets/items/diente_cocodrilo.png` | `src/textures.js:314` |
| 171 | 3·6·3 | `veneno_reina` | Veneno de la Terciopelo reina | `src/assets/items/veneno_reina.png` | `src/textures.js:318` |
| 172 | 3·6·4 | `machete_doble` | Machete de doble filo | `src/assets/items/machete_doble.png` | `src/textures.js:321` |
| 173 | 3·6·5 | `venda` | Venda | `src/assets/items/venda.png` | `src/textures.js:295` |
| 174 | 3·6·6 | `alcohol` | Alcohol | `src/assets/items/alcohol.png` | `src/textures.js:298` |
| 175 | 3·6·7 | `suero` | Suero oral | `src/assets/items/suero.png` | `src/textures.js:298` |
| 176 | 3·6·8 | `botiquin` | Botiquín | `src/assets/items/botiquin.png` | `src/textures.js:302` |
| 177 | 3·7·1 | `mapa_tesoro` | Mapa del tesoro | `src/assets/items/mapa_tesoro.png` | `src/textures.js:288` |
| 178 | 3·7·2 | `careta` | Careta de buceo | `src/assets/items/careta.png` | `src/textures.js:292` |
| 179 | 3·7·3 | `brocha` | Brocha | `src/assets/items/brocha.png` | `src/textures.js:286` |
| 180 | 3·7·4 | `mochila` | Mochila de cuero | `src/assets/items/mochila.png` | `src/textures.js:283` |
| 181 | 3·7·5 | `pan_casero` | Pan casero de la abuela | `src/assets/items/pan_casero.png` | `src/textures.js:274` |
| 182 | 3·7·6 | `agua_de_sapo` | Agua de sapo | `src/assets/items/agua_de_sapo.png` | `src/textures.js:277` |
| 183 | 3·7·7 | `arroz_con_leche` | Arroz con leche | `src/assets/items/arroz_con_leche.png` | `src/textures.js:279` |
| 184 | 3·7·8 | `libro_recetas` | Libro de recetas viejo | `src/assets/items/libro_recetas.png` | `src/textures.js:281` |
| 185 | 3·8·1 | `plano_adobe` | Plano: casita de adobe | `src/assets/items/plano_adobe.png` | `src/textures.js:270` |
| 186 | 3·8·2 | `plano_madera` | Plano: casa de madera con corredor | `src/assets/items/plano_madera.png` | `src/textures.js:270` |
| 187 | 3·8·3 | `plano_rancho` | Plano: rancho de playa | `src/assets/items/plano_rancho.png` | `src/textures.js:270` |
| 188 | 3·8·4 | `bicicleta` | Bicicleta | `src/assets/items/bicicleta.png` | `src/textures.js:265` |
| 189 | 3·8·5 | `moto` | Moto | `src/assets/items/moto.png` | `src/textures.js:265` |
| 190 | 3·8·6 | `lancha` | Lancha con motor | `src/assets/items/lancha.png` | `src/textures.js:262` |
| 191 | 3·8·7 | `cajuela` | Cajuela (canasto para coger café) | `src/assets/items/cajuela.png` | `src/textures.js:253` |
| 192 | 3·8·8 | `cajuela_llena` | Cajuela llena de café | `src/assets/items/cajuela_llena.png` | `src/textures.js:253` |
| 193 | 4·1·1 | `batea` | Batea | `src/assets/items/batea.png` | `src/textures.js:258` |
| 194 | 4·1·2 | `pepita` | Pepita de oro | `src/assets/items/pepita.png` | `src/textures.js:260` |
| 195 | 4·1·3 | `cartelito` | Cartelito para nombre | `src/assets/items/cartelito.png` | `src/textures.js:250` |
| 196 | 4·1·4 | `red_pesca_item` | Red de pesca | `src/assets/items/red_pesca_item.png` | `src/textures.js:247` |
| 197 | 4·1·5 | `escama_sirena` | Escama de sirena | `src/assets/items/escama_sirena.png` | `src/textures.js:244` |
| 198 | 4·1·6 | `fragmento_meteorito` | Fragmento de meteorito | `src/assets/items/fragmento_meteorito.png` | `src/textures.js:241` |
| 199 | 4·1·7 | `corona_pina` | Corona de piña (para sembrar) | `src/assets/items/corona_pina.png` | `src/textures.js:229` |
| 200 | 4·1·8 | `pina` | Piña | `src/assets/items/pina.png` | `src/textures.js:229` |
| 201 | 4·2·1 | `fresco_pina` | Fresco de piña | `src/assets/items/fresco_pina.png` | `src/textures.js:235` |
| 202 | 4·2·2 | `cajeta_pina` | Cajeta de piña | `src/assets/items/cajeta_pina.png` | `src/textures.js:238` |
| 203 | 4·2·3 | `mechon_congo` | Mechón del Mono congo (clic derecho: aullar) | `src/assets/items/mechon_congo.png` | `src/textures.js:225` |
| 204 | 4·2·4 | `silbato_reto` | Silbato del reto (clic derecho: arma la arena) | `src/assets/items/silbato_reto.png` | `src/textures.js:217` |
| 205 | 4·2·5 | `copa_reto` | Copa del reto | `src/assets/items/copa_reto.png` | `src/textures.js:221` |
| 206 | 4·2·6 | `papalote` | Papalote (clic derecho: volarlo) | `src/assets/items/papalote.png` | `src/textures.js:205` |
| 207 | 4·2·7 | `trompo` | Trompo (clic derecho al piso: bailarlo) | `src/assets/items/trompo.png` | `src/textures.js:211` |
| 208 | 4·2·8 | `chumicos` | Chumicos (clic derecho a un vecino: jugar) | `src/assets/items/chumicos.png` | `src/textures.js:215` |
| 209 | 4·3·1 | `parapente` | Parapente (clic derecho cayendo: abrirlo) | `src/assets/items/parapente.png` | `src/textures.js:199` |
| 210 | 4·3·2 | `avioneta` | Avioneta (clic derecho al suelo: ponerla) | `src/assets/items/avioneta.png` | `src/textures.js:194` |
| 211 | 4·3·3 | `bandera_circuito` | Bandera de circuito (clic derecho: aros en el cielo) | `src/assets/items/bandera_circuito.png` | `src/textures.js:191` |
| 212 | 4·3·4 | `tabla_surf` | Tabla de surf (clic derecho en el mar) | `src/assets/items/tabla_surf.png` | `src/textures.js:186` |
| 213 | 4·3·5 | `yuca` | Yuca | `src/assets/items/yuca.png` | `src/textures.js:171` |
| 214 | 4·3·6 | `vigoron` | Vigorón | `src/assets/items/vigoron.png` | `src/textures.js:174` |
| 215 | 4·3·7 | `rosquillas` | Rosquillas | `src/assets/items/rosquillas.png` | `src/textures.js:178` |
| 216 | 4·3·8 | `tanelas` | Tanelas | `src/assets/items/tanelas.png` | `src/textures.js:180` |
| 217 | 4·4·1 | `arroz_con_pollo` | Arroz con pollo | `src/assets/items/arroz_con_pollo.png` | `src/textures.js:182` |
| 218 | 4·4·2 | `trofeo_pesca` | Trofeo del torneo de pesca | `src/assets/items/trofeo_pesca.png` | `src/textures.js:166` |
| 219 | 4·4·3 | `peluche_perezoso` | Peluche de perezoso (premio de feria) | `src/assets/items/peluche_perezoso.png` | `src/textures.js:160` |
| 220 | 4·4·4 | `carreta_bueyes` | Carreta con bueyes (clic derecho al suelo: ponerla) | `src/assets/items/carreta_bueyes.png` | `src/textures.js:154` |
| 221 | 4·4·5 | `arco_cintas` | Arco de cintas (clic derecho: armarlo) | `src/assets/items/arco_cintas.png` | `src/textures.js:150` |
| 222 | 4·4·6 | `cinta` | Cinta de la carrera de cintas | `src/assets/items/cinta.png` | `src/textures.js:150` |
| 223 | 4·4·7 | `permiso_todo` | Permiso de Todo (sellado siete veces) | `src/assets/items/permiso_todo.png` | `src/textures.js:147` |
| 224 | 4·4·8 | `saco_gangoche` | Saco de gangoche (clic derecho: carrera de sacos) | `src/assets/items/saco_gangoche.png` | `src/textures.js:143` |
| 225 | 4·5·1 | `racimo_pejibaye` | Racimo de pejibayes (crudos) | `src/assets/items/racimo_pejibaye.png` | `src/textures.js:134` |
| 226 | 4·5·2 | `pejibaye` | Pejibayes cocinados | `src/assets/items/pejibaye.png` | `src/textures.js:134` |
| 227 | 4·5·3 | `pejibaye_mayonesa` | Pejibayes con mayonesa | `src/assets/items/pejibaye_mayonesa.png` | `src/textures.js:134` |
| 228 | 4·5·4 | `pedazo_tierra` | Pedazo de la tierra | `src/assets/items/pedazo_tierra.png` | `src/textures.js (dibujo genérico)` |
| 229 | 4·5·5 | `pedazo_agua` | Pedazo del agua | `src/assets/items/pedazo_agua.png` | `src/textures.js (dibujo genérico)` |
| 230 | 4·5·6 | `pedazo_fuego` | Pedazo del fuego | `src/assets/items/pedazo_fuego.png` | `src/textures.js (dibujo genérico)` |
| 231 | 4·5·7 | `pedazo_cielo` | Pedazo del cielo | `src/assets/items/pedazo_cielo.png` | `src/textures.js (dibujo genérico)` |
| 232 | 4·5·8 | `esencia_sombra` | Esencia de sombra | `src/assets/items/esencia_sombra.png` | `src/textures.js (dibujo genérico)` |
| 233 | 4·6·1 | `aceite_filo` | Aceite de filo (clic derecho: va a su mejor arma) | `src/assets/items/aceite_filo.png` | `src/textures.js (dibujo genérico)` |
| 234 | 4·6·2 | `candela_regreso` | Candela de regreso (clic derecho: vuelve a donde durmió) | `src/assets/items/candela_regreso.png` | `src/textures.js (dibujo genérico)` |
| 235 | 4·6·3 | `maletin` | Maletín del tío Rigo | `src/assets/items/maletin.png` | `src/textures.js (dibujo genérico)` |
| 236 | 4·6·4 | `machete_zenaida` | Machete de Zenaida | `src/assets/items/machete_zenaida.png` | `src/textures.js (dibujo genérico)` |
| 237 | 4·6·5 | `delantal_zenaida` | Delantal de Zenaida | `src/assets/items/delantal_zenaida.png` | `src/textures.js (dibujo genérico)` |
| 238 | 4·6·6 | `chancleta_zenaida` | Chancleta de Zenaida (clic derecho: se tira y vuelve) | `src/assets/items/chancleta_zenaida.png` | `src/textures.js (dibujo genérico)` |
| 239 | 4·6·7 | `sombrero_zenaida` | Sombrero de Zenaida | `src/assets/items/sombrero_zenaida.png` | `src/textures.js (dibujo genérico)` |
| 240 | 4·6·8 | `cucharon_zenaida` | Cucharón de Zenaida (con tenerlo, la comida rinde más) | `src/assets/items/cucharon_zenaida.png` | `src/textures.js (dibujo genérico)` |
| 241 | 4·7·1 | `tablilla` | Tablilla (arregla la pierna quebrada) | `src/assets/items/tablilla.png` | `src/textures.js (dibujo genérico)` |
| 242 | 4·7·2 | `tranca` | Tranca (clic derecho a una puerta) | `src/assets/items/tranca.png` | `src/textures.js (dibujo genérico)` |
| 243 | 4·7·3 | `cigarros_62` | Cigarros del 62, sin abrir (un recuerdo) | `src/assets/items/cigarros_62.png` | `src/textures.js (dibujo genérico)` |
| 244 | 4·7·4 | `hoja_firmas` | Hoja de firmas (clic derecho a un vecino) | `src/assets/items/hoja_firmas.png` | `src/textures.js (dibujo genérico)` |
| 245 | 4·7·5 | `escritura` | Escritura de la casa, de 1931 | `src/assets/items/escritura.png` | `src/textures.js:453` |
| 246 | 4·7·6 | `martillo_tino` | Martillo de Ñor Tino | `src/assets/items/martillo_tino.png` | `src/textures.js (dibujo genérico)` |
| 247 | 4·7·7 | `recetario_chepa` | Recetario de Niña Chepa | `src/assets/items/recetario_chepa.png` | `src/textures.js (dibujo genérico)` |
| 248 | 4·7·8 | `mata_flor` | La mata de Doña Flor | `src/assets/items/mata_flor.png` | `src/textures.js (dibujo genérico)` |
| 249 | 4·8·1 | `catalejo_wilber` | Catalejo de Mae Wilber | `src/assets/items/catalejo_wilber.png` | `src/textures.js (dibujo genérico)` |
| 250 | 4·8·2 | `sobre_marielos` | Sobre sellado: «Para Marielos» | `src/assets/items/sobre_marielos.png` | `src/textures.js (dibujo genérico)` |
| 251 | 4·8·3 | `otra_chancleta` | La otra chancleta (con las dos, se pega más duro) | `src/assets/items/otra_chancleta.png` | `src/textures.js (dibujo genérico)` |
| 252 | 4·8·4 | `sello_oficina` | Sello de oficina | `src/assets/items/sello_oficina.png` | `src/textures.js (dibujo genérico)` |
| 253 | 4·8·5 | `sello_goma` | Sello de goma (a veces deja aturdido) | `src/assets/items/sello_goma.png` | `src/textures.js (dibujo genérico)` |
| 254 | 4·8·6 | `sobre_estampas` | Sobre de estampas (clic derecho: abrirlo) | `src/assets/items/sobre_estampas.png` | `src/textures.js (dibujo genérico)` |
| 255 | 4·8·7 | `bomba_espalda` | Bomba de espalda (clic derecho: rocía agua lejos; se llena en el agua) | `src/assets/items/bomba_espalda.png` | `src/textures.js (dibujo genérico)` |
| 256 | 4·8·8 | `agua_bendita` | Agua bendita (clic derecho: 3 minutos en que sus golpes le entran a los espantos) | `src/assets/items/agua_bendita.png` | `src/textures.js (dibujo genérico)` |
| 257 | 5·1·1 | `guaco` | Guaco (clic derecho: cura la mordida de culebra) | `src/assets/items/guaco.png` | `src/textures.js (dibujo genérico)` |
| 258 | 5·1·2 | `mascarilla` | Mascarilla de gases (en la mochila, protege de los gases del cráter) | `src/assets/items/mascarilla.png` | `src/textures.js (dibujo genérico)` |
| 259 | 5·1·3 | `piel_becquer` | Piel de bécquer | `src/assets/items/piel_becquer.png` | `src/textures.js (dibujo genérico)` |
| 260 | 5·1·4 | `botas_becquer` | Botas de bécquer (las culebras no le pasan el colmillo) | `src/assets/items/botas_becquer.png` | `src/textures.js (dibujo genérico)` |
| 261 | 5·1·5 | `panuelo_chata` | Pañuelo de los Chatas (puesto, lo confunden con uno de la banda) | `src/assets/items/panuelo_chata.png` | `src/textures.js (dibujo genérico)` |
| 262 | 5·1·6 | `cacho_toro` | Cacho del Toro Guaco (clic derecho: lo sopla y espanta a las criaturas) | `src/assets/items/cacho_toro.png` | `src/textures.js (dibujo genérico)` |
