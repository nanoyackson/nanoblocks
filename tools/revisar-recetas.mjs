// Revisa que todo ingrediente de toda receta se pueda conseguir de verdad: que alguna receta lo fabrique, que salga de un bloque o que
// aparezca en el código como botín, tienda o regalo. Encontró recetas que llevaban meses sin poderse hacer.
// Uso: node tools/revisar-recetas.mjs (lo que sale hay que mirarlo: los bloques que sueltan otra cosa pueden tener un caso especial en dropFromBlock).
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { RECIPES, SMELT, findRecipe, layout, fitsIn, modoDe } from '../src/recipes.js';
import { ITEMS, BLOCKS, itemName } from '../src/blocks.js';

const dir = fileURLToPath(new URL('../src/', import.meta.url));
const fuera = new Set(['recipes.js', 'version.js', 'logros-lista.js', 'pixelart.js', 'textures.js']);
const fuentes = readdirSync(dir).filter((f) => f.endsWith('.js') && !fuera.has(f)).map((f) => readFileSync(dir + f, 'utf8'));
const fabricados = new Set(RECIPES.map((r) => r.out[0]));
for (const v of Object.values(SMELT)) fabricados.add(v);
const usos = new Map();
for (const r of RECIPES) for (const id of (r.items || Object.values(r.key || {})).flat()) { if (!usos.has(id)) usos.set(id, []); usos.get(id).push(itemName(r.out[0])); }
let malos = 0;
for (const [id, u] of usos) {
  if (fabricados.has(id)) continue;
  const b = BLOCKS[id], it = ITEMS[id];
  if (b && b.drop !== undefined && b.drop !== id) { malos++; console.log(`Bloque ${id} «${b.name}» suelta ${b.drop}, no a sí mismo. Lo piden: ${u.join(', ')}`); continue; }
  if (b) continue;
  if (!it) { malos++; console.log(`${id} no existe. Lo piden: ${u.join(', ')}`); continue; }
  const re = new RegExp(`\\b${id}\\b|\\b${it.key}\\b`), veces = fuentes.filter((t) => re.test(t)).length; // v12.7.0: antes «\b» dentro del template era un retroceso y la búsqueda nunca encontraba nada
  if (veces <= (fuentes.some((t) => t.includes(`id: ${id},`)) ? 1 : 0)) { malos++; console.log(`${id} «${it.name}» no sale de ningún lado. Lo piden: ${u.join(', ')}`); }
}
console.log(`${RECIPES.length} recetas, ${usos.size} ingredientes, ${malos} para mirar`);

// v11.9.1: cada receta, puesta tal cual en la mesa, ¿da ella misma? Si otra gana (misma forma o mismos ingredientes) queda tapada; si
// no sale nada, está muerta. nanoyackson no podía hacer el cartelito porque el trompo tenía la misma receta.
const todas = new Set(RECIPES.filter((r) => r.aprende).map((r) => r.aprende));
let tapadas = 0;
for (const r of RECIPES) {
  const size = fitsIn(r, 2) ? 2 : 3, cells = layout(r, size);
  if (!cells) continue;
  const grid = new Array(size * size).fill(null);
  for (const c of cells) grid[c.cell] = { id: c.id, count: 1 };
  const gana = findRecipe(grid, size, modoDe(r), new Set([...todas, ...RECIPES.filter((x) => x.req).map((x) => x.req)]));
  if (gana === r) continue;
  tapadas++;
  console.log(gana ? `Tapada: «${itemName(r.out[0])}» la gana «${itemName(gana.out[0])}» (misma receta)` : `Muerta: «${itemName(r.out[0])}» no sale ni puesta igualita`);
}
console.log(`${tapadas} recetas tapadas o muertas`);
if (tapadas) process.exitCode = 1;
