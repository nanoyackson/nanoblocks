// Revisa que los nombres, claves, ids e íconos de todos los objetos y bloques calcen (v11.9.1). nanoyackson vio «la mena de hierro dice
// Puerta» y «el trompo dice yuca»: era la ficha vieja del inventario (ya arreglada), pero esto vigila que no haya enredos de verdad.
// Uso: node tools/revisar-nombres.mjs  → sale con código 1 si encuentra algo.
import { readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { ARTE, BLOCKS, ITEMS, MAX_BLOCK, isBlockId } from '../src/blocks.js';

const raiz = fileURLToPath(new URL('..', import.meta.url));
const pngs = new Set(readdirSync(`${raiz}src/assets/items`).filter((f) => f.endsWith('.png')).map((f) => f.slice(0, -4)));
const problemas = [];
const mal = (t) => problemas.push(t);

// 1. cada bloque está en su casilla y cada ítem en su rango
const vacio = BLOCKS[0];
for (let i = 1; i < MAX_BLOCK; i++) if (BLOCKS[i] !== vacio && BLOCKS[i].id !== i) mal(`Bloque en la casilla ${i} dice ser el ${BLOCKS[i].id} (${BLOCKS[i].key})`);
for (const [id, d] of Object.entries(ITEMS)) {
  if (+id !== d.id) mal(`Ítem en ${id} dice ser el ${d.id} (${d.key})`);
  if (!d.isBlock && isBlockId(+id)) mal(`Ítem ${id} «${d.name}» está en el rango de los bloques`);
}
// 2. claves repetidas (el ícono y las búsquedas por clave toman el primero)
const porClave = (lista) => { const m = new Map(); for (const d of lista) { if (!d || !d.key) continue; (m.get(d.key) || m.set(d.key, []).get(d.key)).push(d.id); } return [...m].filter(([, v]) => v.length > 1); };
for (const [k, v] of porClave(Object.values(ITEMS).filter((d) => !d.isBlock))) mal(`Clave de ítem repetida «${k}»: ${v.join(', ')}`);
for (const [k, v] of porClave([...new Set(BLOCKS)].filter((b) => b !== vacio))) mal(`Clave de bloque repetida «${k}»: ${v.join(', ')}`);
// 3. nombres repetidos entre cosas que uno tiene en la mano (las mitades de la puerta o el frasco colocado no cuentan)
const enMano = Object.values(ITEMS).filter((d) => !(d.isBlock && (BLOCKS[d.id].hidden || BLOCKS[d.id].drop !== undefined)));
const nombres = new Map();
for (const d of enMano) (nombres.get(d.name) || nombres.set(d.name, []).get(d.name)).push(d.id);
const PARES_A_PROPOSITO = new Set(['Frasco con morfo']); // el ítem y el bloque que se coloca
for (const [n, v] of nombres) if (v.length > 1 && !PARES_A_PROPOSITO.has(n)) mal(`Nombre repetido «${n}»: ${v.join(', ')}`);
// 4. íconos: un PNG que nadie usa, o un ítem que apunta a un PNG que no existe
const usados = new Set(Object.values(ITEMS).map((d) => d.icono || d.key));
for (const p of pngs) if (!usados.has(p) && !Object.values(BLOCKS).some((b) => b.key === p)) mal(`PNG sin dueño: assets/items/${p}.png`);
for (const d of Object.values(ITEMS)) if (d.icono && !pngs.has(d.icono)) mal(`Ítem ${d.id} pide el ícono «${d.icono}», que no existe`);
// 4b. v11.13.3: el arte de GPT. Cada clave de ARTE tiene su PNG en public/sprites/arte/ y un dueño (ítem o bloque)
const artes = new Set(readdirSync(`${raiz}public/sprites/arte`).filter((f) => f.endsWith('.png')).map((f) => f.slice(0, -4)));
for (const k of ARTE) {
  if (!artes.has(k)) mal(`ARTE pide «${k}», pero no está public/sprites/arte/${k}.png`);
  if (!Object.values(ITEMS).some((d) => d && d.key === k) && !Object.values(BLOCKS).some((b) => b.key === k)) mal(`ARTE pide «${k}», que no es ningún ítem ni bloque`);
}
// 5. nombres vacíos o sin pulir
for (const d of Object.values(ITEMS)) if (!d.name || /undefined|TODO|_/.test(d.name)) mal(`Ítem ${d.id} (${d.key}) con nombre raro: «${d.name}»`);

console.log(problemas.length ? problemas.join('\n') : 'Todo en orden: ids, claves, nombres e íconos calzan.');
console.log(`${Object.keys(ITEMS).length} ítems revisados, ${problemas.length} problemas`);
process.exitCode = problemas.length ? 1 : 0;
