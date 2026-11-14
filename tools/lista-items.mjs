// Arma docs/PROMPT_ITEMS.md: el prompt único para redibujar en pixel art todos los ítems del juego, con la lista
// (en el orden de las hojas), qué dibujar, la clave, el archivo destino y dónde está el dibujo de hoy.
// Uso: node tools/lista-items.mjs   (volver a correrlo cuando se agreguen ítems nuevos)
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { ITEMS } from '../src/blocks.js';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const TEX = readFileSync(join(ROOT, 'src/textures.js'), 'utf8').split('\n');
const lineOf = (key) => { const i = TEX.findIndex((l) => l.includes(`'${key}'`) && l.includes('item.key')); return i >= 0 ? i + 1 : null; };

// pistas de qué dibujar para lo que no se entiende solo con el nombre (lo tico, sobre todo)
const PISTA = {
  stick: 'palo de madera', coal: 'trozo de carbón negro', iron: 'lingote de hierro', gold: 'lingote de oro', diamond: 'diamante tallado celeste', apple: 'manzana roja',
  brick: 'ladrillo de barro rojizo', door: 'puerta de madera (ícono pequeño)', leather: 'cuero curtido', quartz: 'cristal de cuarzo blanco', jade_shard: 'esquirla de jade verde', jade_ingot: 'lingote de jade verde',
  bread: 'gallo pinto: arroz con frijoles negros revueltos en un plato hondo', casado: 'plato con arroz, frijoles, ensalada, plátano maduro y carne',
  chifrijo: 'tazón con frijoles, chicharrón, arroz y pico de gallo', tamal: 'tamal envuelto en hoja de plátano verde amarrada con mecate',
  pinto_huevo: 'gallo pinto con un huevo frito encima', platano_maduro: 'plátano maduro frito, dorado y caramelizado', churchill: 'copa alta con hielo raspado rojo, leche en polvo y helado',
  pipa: 'pipa (coco verde) con una pajilla', copo: 'copo de hielo raspado con sirope rojo en vasito', cafe_chorreado: 'taza de café negro humeante junto a un chorreador de tela',
  agua_dulce: 'jarro de agua dulce café claro', tapa_dulce: 'tapa de dulce: bloque cónico de panela café', guaro: 'botella pequeña transparente de guaro de caña',
  colon: 'moneda dorada grande de colón costarricense (sin texto)', mascarada: 'máscara de mascarada tica: cabezona de papel maché, colorida', bombeta: 'cohete de fiesta (bombeta) con mecha y palito',
  machete: 'machete de hoja larga con mango de madera', machete_cadejos: 'machete oscuro con brillo rojo, mango negro con cadena', lanza: 'lanza de hierro', mazo: 'mazo de hierro pesado', garrote: 'garrote de madera de guayabo',
  escritura: 'documento enrollado con sello rojo de lacre', escritura_pueblo: 'documento de papel con sello azul de municipalidad', llave_volcan: 'llave antigua de piedra volcánica con brillo naranja',
  pluma_dorada: 'pluma dorada brillante', quetzal_feather: 'pluma larga verde esmeralda de quetzal', macaw_feather: 'pluma roja con punta azul de lapa', pluma_arpia: 'pluma gris pizarra de águila arpía',
  capa_arpia: 'capa de plumas gris pizarra con broche dorado', sombrero_tule: 'sombrero ancho de tule tejido', sombrero_sabanero: 'sombrero de cuero café de ala ancha',
  corazon_arenal: 'corazón de lava: piedra negra con grietas naranjas brillantes', corazon_monte: 'corazón de madera con musgo verde y brillo verde', hongo_potrero: 'hongo de sombrero café claro con pintas blancas',
  oreja_guanacaste: 'vaina de guanacaste en forma de oreja, café oscura', coffee_cherry: 'racimito de cerezas de café rojas', roasted_coffee: 'granos de café tostados café oscuro',
  cane_item: 'tallo de caña de azúcar verde con nudos', jar: 'frasco de vidrio vacío', morpho_jar_item: 'frasco con mariposa morfo azul brillante adentro', dart_frog: 'ranita dardo roja con patas azules',
  antivenom: 'frasquito de suero antiofídico con etiqueta verde', lucky_amulet: 'amuleto de jade verde en un cordón', net: 'red para cazar mariposas', honey: 'frasco de miel dorada de abejas',
  guano: 'saco pequeño de abono (guano)', saddle: 'albarda (montura) de cuero', bote: 'bote de remos de madera pintado de azul', cana_pescar: 'caña de pescar con carrete', bucket: 'balde de metal vacío',
  water_bucket: 'balde de metal con agua', lava_bucket: 'balde con lava', milk_bucket: 'balde con leche', egg: 'huevo blanco', fried_egg: 'huevo frito', tortilla: 'tortilla de maíz palmeada',
  bidon: 'bidón rojo de combustible', mechero: 'encendedor plástico', carro_viejo: 'carro viejo de los 80 visto de lado, rojo, con óxido', polea: 'polea de tirolesa con mosquetón amarillo',
  bola: 'bola de fútbol blanca con pentágonos negros', repelente: 'botellita de repelente con dibujo de limón', cacao: 'semillas de cacao café', chocolate: 'barra de chocolate artesanal envuelta a medias',
  queso_turrialba: 'queso Turrialba: rueda blanca', natilla: 'vasito de natilla blanca', arroz: 'bolsa de arroz', arroz_con_leche: 'tazón de arroz con leche con canela', sopa_negra: 'plato de sopa negra con huevo duro',
  gallo_picadillo: 'gallos: tortilla doblada con picadillo verde', platano_queso: 'plátano maduro con queso derretido', tres_leches: 'porción de queque tres leches con merengue y cereza', cafe_con_leche: 'taza de café con leche',
  olla_carne: 'olla con sopa de carne y verduras', empanada: 'empanada dorada de maíz', chorreada: 'chorreada (panqueque de maíz) con natilla', cajeta: 'cajeta de leche: cuadrito café claro', chicharron: 'chicharrón dorado y crujiente',
  pargo: 'pargo rojo crudo', corvina: 'corvina plateada cruda', guapote: 'guapote (pez de río) crudo', dorado: 'pez dorado (mahi-mahi) verde y amarillo crudo', pescado_frito: 'pescado frito entero con limón',
  ceviche: 'vaso de ceviche con limón y culantro', limon: 'limón mandarina anaranjado', perla: 'perla blanca brillante', bota_vieja: 'bota vieja rota (basura del mar)', azufre: 'trozo de azufre amarillo',
  colmillo_cadejos: 'colmillo negro grande con brillo rojo', calavera_segua: 'calavera de caballo pequeña', lagrima_llorona: 'lágrima de cristal celeste brillante', caldo_hongo: 'tazón de caldo con hongos',
  banana: 'banano amarillo', papaya: 'papaya partida mostrando semillas negras', mango: 'mango maduro amarillo y rojo', meat: 'trozo de carne cruda roja', cooked_meat: 'carne asada dorada',
  corn: 'mazorca de maíz amarilla', corn_seeds: 'puñito de granos de maíz', beans: 'frijoles negros', flecha: 'flecha con plumas', arco: 'arco de madera con cuerda',
  cantimplora_vacia: 'cantimplora de cuero café, vacía y aplanada, con tapón de madera y correa', cantimplora: 'cantimplora de cuero café llena y redonda con una gota de agua azul', sabila: 'mata de sábila (aloe) verde con hojas gruesas y puntiagudas',
  manzanilla: 'ramito de manzanilla con florecitas blancas de centro amarillo', hierbabuena: 'ramita de hierbabuena con hojas verdes dentadas', jengibre: 'raíz de jengibre beige con nudos',
  honda: 'honda de madera en forma de Y con liga de cuero', cerbatana: 'cerbatana larga de caña verde con nudos', dardo: 'dardo fino de madera con punta verde de veneno y cola de algodón',
  jabalina: 'jabalina de madera con punta de hierro y cinta roja', colmillo_jaguar: 'colmillo grande de jaguar, curvo y marfil, con un cordón', diente_cocodrilo: 'diente de cocodrilo enorme, cónico y amarillento',
  veneno_reina: 'frasco con veneno verde brillante y una calavera de serpiente', machete_doble: 'machete de doble filo con mango de cuero, colmillo y diente amarrados',
};
const pista = (it) => {
  if (PISTA[it.key]) return PISTA[it.key];
  if (it.armor) return `${it.name} (pieza de armadura${it.mat ? ` de ${it.mat}` : ''})`;
  if (it.tool) return `${it.name} (herramienta)`;
  return it.name;
};

const items = Object.values(ITEMS).filter((i) => i && i.id >= 256).sort((a, b) => a.id - b.id);
const POR_HOJA = 64;
const filas = items.map((it, i) => {
  const hoja = Math.floor(i / POR_HOJA) + 1, celda = i % POR_HOJA;
  const hoy = it.sprite ? `public/sprites/${it.sprite}.png` : lineOf(it.key) ? `src/textures.js:${lineOf(it.key)}` : 'src/textures.js (dibujo genérico)';
  return { n: i + 1, hoja, fila: Math.floor(celda / 8) + 1, col: (celda % 8) + 1, ...it, que: pista(it), hoy };
});
const hojas = Math.ceil(items.length / POR_HOJA);

let md = `# Prompt único: pixel art de todos los ítems de NanoBlocks

> Generado con \`node tools/lista-items.mjs\` (${items.length} ítems, ${hojas} hojas). Volver a correrlo si se agregan ítems.

## Cómo usarlo
1. Copiá **el prompt** de abajo (con la lista completa) en tu generador de imágenes o dáselo a un artista.
2. Pedí **una hoja por mensaje** («Hacé la HOJA 1», después la 2…). Cada hoja es un PNG de **256×256** con fondo transparente: una cuadrícula de **8×8 celdas de 32×32 px**, en el orden de la lista (fila por fila, de izquierda a derecha).
3. Guardá cada hoja como \`assets-src/items/hoja-1.png\`, \`hoja-2.png\`, … (en la carpeta del juego).
4. Corré \`node tools/cortar-hojas.mjs\`: corta cada hoja y deja cada ítem en **\`src/assets/items/<clave>.png\`**.
5. Listo: el juego usa solo las imágenes de esa carpeta (las que falten siguen con el dibujo de hoy). Si el servidor de desarrollo (\`npm run dev\`) ya estaba corriendo, reinicialo para que vea los archivos nuevos. Si preferís dibujarlos uno por uno, guardalos directo como \`src/assets/items/<clave>.png\` (32×32, fondo transparente).

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
`;
for (const h of Array.from({ length: hojas }, (_, i) => i + 1)) {
  md += `\n### HOJA ${h}\n`;
  for (const f of filas.filter((x) => x.hoja === h)) md += `${f.n}. [H${f.hoja} F${f.fila} C${f.col}] \`${f.key}\` — ${f.que}\n`;
}
md += `\n(fin del prompt)\n\n## Tabla de archivos (para nosotros)\n\n| # | Hoja·fila·col | Clave | Nombre en el juego | Archivo nuevo | Dibujo de hoy |\n|---|---|---|---|---|---|\n`;
for (const f of filas) md += `| ${f.n} | ${f.hoja}·${f.fila}·${f.col} | \`${f.key}\` | ${f.name} | \`src/assets/items/${f.key}.png\` | \`${f.hoy}\` |\n`;
writeFileSync(join(ROOT, 'docs/PROMPT_ITEMS.md'), md);
// un prompt por hoja, listo para pegar en GPT (cada uno trae las reglas de estilo y solo su parte de la lista)
const reglas = md.split('## El prompt (copiar desde aquí)')[1].split('**La lista**')[0].trim();
mkdirSync(join(ROOT, 'docs/prompts-items'), { recursive: true });
for (let h = 1; h <= hojas; h++) {
  const mias = filas.filter((x) => x.hoja === h);
  let t = `${reglas}\n\nAhora hacé la HOJA ${h} de ${hojas}: una sola imagen PNG de 256×256 px con fondo transparente, cuadrícula de 8×8 celdas de 32×32 px. Llená las celdas fila por fila, de izquierda a derecha, en este orden exacto${mias.length < 64 ? ` (son ${mias.length}; las demás celdas quedan vacías)` : ''}:\n\n`;
  mias.forEach((f, i) => { t += `${i + 1}. (fila ${f.fila}, columna ${f.col}) ${f.que}\n`; });
  t += '\nNo escribas números ni texto en la imagen. Solo los íconos.\n';
  writeFileSync(join(ROOT, `docs/prompts-items/hoja-${h}.txt`), t);
}
writeFileSync(join(ROOT, 'assets-src/items/orden.json'), JSON.stringify(filas.map((f) => f.key), null, 1));
// solo los que todavía no tienen dibujo nuevo: una hoja aparte («faltan»), para no tocar las posiciones de las hojas ya hechas
const faltan = filas.filter((f) => !existsSync(join(ROOT, `src/assets/items/${f.key}.png`))).slice(0, POR_HOJA);
if (faltan.length) {
  let t = `${reglas}\n\nAhora hacé la HOJA «FALTAN»: una sola imagen PNG de 256×256 px con fondo transparente, cuadrícula de 8×8 celdas de 32×32 px. Llená las celdas fila por fila, de izquierda a derecha, en este orden exacto (son ${faltan.length}; las demás celdas quedan vacías):\n\n`;
  faltan.forEach((f, i) => { t += `${i + 1}. (fila ${Math.floor(i / 8) + 1}, columna ${(i % 8) + 1}) ${f.que}\n`; });
  t += '\nNo escribas números ni texto en la imagen. Solo los íconos.\nGuardala como assets-src/items/faltan.png\n';
  writeFileSync(join(ROOT, 'docs/prompts-items/faltan.txt'), t);
}
writeFileSync(join(ROOT, 'assets-src/items/faltan.json'), JSON.stringify(faltan.map((f) => f.key), null, 1));
console.log(`docs/PROMPT_ITEMS.md: ${items.length} ítems en ${hojas} hojas · faltan dibujar ${faltan.length} (docs/prompts-items/faltan.txt)`);
