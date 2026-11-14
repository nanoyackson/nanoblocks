// ¿De dónde sale esto y para qué sirve? La ficha de cada objeto lo dice, armado solo con las recetas, el horno, lo que suelta cada criatura, los
// bloques y las tiendas. Así no hay que acordarse de nada ni mantener una lista a mano: lo nuevo aparece solo.
import { RECIPES, SMELT, ingredients } from './recipes.js';
import { BLOCKS, BLOCK_BY_KEY as K, itemName } from './blocks.js';
import { MOB_TYPES } from './entities.js';
import { SHOPS } from './pueblo.js';
import { conocidas } from './saberes.js';

let IDX = null;
const nuevo = () => ({ fabrica: null, secreta: null, horno: [], mobs: [], bloques: [], tiendas: [], usos: [], usosSecretos: [] });
function armar() {
  const I = new Map(), de = (id) => { if (!I.has(id)) I.set(id, nuevo()); return I.get(id); };
  const usar = (id, out) => { const u = de(id).usos; if (id !== out && !u.includes(out)) u.push(out); };
  const tiendas = new Map();
  for (const r of RECIPES) {
    const out = r.out[0], E = de(out);
    // las recetas que se aprenden no se cuentan hasta aprenderlas
    if (r.aprende) {
      if (!E.fabrica) E.secreta = r.aprende;
      for (const [ing] of ingredients(r)) if (ing !== out) de(ing).usosSecretos.push([out, r.aprende]);
      continue;
    }
    E.secreta = null;
    // la cuadrícula de la mochila es de 2×2: lo demás pide mesa
    const grande = r.pattern ? r.pattern.length > 2 || r.pattern[0].length > 2 : (r.items || []).length > 4;
    const donde = r.taller ? 'taller' : r.cook ? 'fogón' : grande ? 'mesa' : 'mano';
    if (!E.fabrica || donde === 'mano') E.fabrica = donde;
    for (const [ing] of ingredients(r)) usar(ing, out);
  }
  for (const [crudo, listo] of Object.entries(SMELT)) { const c = Number(crudo); de(listo).horno.push(c); usar(c, listo); }
  for (const k of Object.keys(MOB_TYPES)) {
    const M = MOB_TYPES[k];
    if (!M || !M.name || !M.drops) continue;
    for (const [id, , max] of M.drops) if (max > 0 && !de(id).mobs.includes(M.name)) de(id).mobs.push(M.name);
  }
  BLOCKS.forEach((b, id) => {
    if (!b || !b.name || b.drop === undefined || b.drop === 0 || b.drop === id) return;
    if (b.name.startsWith(itemName(b.drop))) return; // la antorcha de la pared, el horno encendido
    if (!de(b.drop).bloques.includes(b.name)) de(b.drop).bloques.push(b.name);
  });
  for (const S of Object.values(SHOPS)) {
    const nom = String(S.title || '').replace(/^La carretilla de /, '').replace(/^(Pulpería|Soda) de /, '$1 de ');
    for (const [id, n, precio] of S.sell || []) if (nom) { const L = tiendas.get(id) || []; if (!L.some((t) => t[0] === nom)) L.push([nom, precio / (n || 1)]); tiendas.set(id, L); }
  }
  // primero lo más barato: la pulpería antes que el restaurante de autor
  for (const [id, L] of tiendas) de(id).tiendas = L.sort((a, b) => a[1] - b[1]).map((t) => t[0]);
  return I;
}
// lo que se encuentra en el mundo, y no se puede deducir de los datos
const DONDE = {
  [K.obsidian]: 'En la cima de los volcanes, con pico de diamante',
  [K.calcite]: 'En las geodas, bajo tierra',
  499: 'Al partir un nido de Sombra',
  [K.iron_ore]: 'En las cuevas, con pico de piedra',
  [K.coal_ore]: 'En las cuevas, con cualquier pico',
  [K.gold_ore]: 'En lo hondo, con pico de hierro',
  [K.diamond_ore]: 'Cerca del fondo, con pico de hierro',
  [K.clay]: 'En la orilla de los ríos',
};
const corto = (id) => itemName(id).replace(/\s*\(.*\)$/, '');
const lista = (L, n = 2) => (L.length > n ? `${L.slice(0, n).join(', ')} y ${L.length - n} más` : L.join(', '));

export function origenLineas(id, g) {
  if (!IDX) IDX = armar();
  const E = IDX.get(id) || nuevo(), L = [];
  if (DONDE[id]) L.push(`🗺 ${DONDE[id]}`);
  const sabidas = conocidas(g);
  if (E.secreta) L.push(sabidas.has(E.secreta) ? '🛠 Receta aprendida: se fabrica en la mesa' : '📜 Hay una receta, pero hay que aprenderla');
  if (E.fabrica) L.push(E.fabrica === 'fogón' ? '🍳 Se cocina en el fogón' : E.fabrica === 'mesa' ? '🛠 Se fabrica en la mesa de trabajo' : '🛠 Se fabrica a mano o en la mesa');
  if (E.horno.length) L.push(`🔥 Sale del horno con: ${lista(E.horno.map(corto))}`);
  if (E.bloques.length) L.push(`⛏ Sale de: ${lista(E.bloques)}`);
  if (E.mobs.length) L.push(`💀 Lo suelta: ${lista(E.mobs)}`);
  if (E.tiendas.length) L.push(`🏪 Se consigue con: ${lista(E.tiendas, 1)}`);
  const usos = [...E.usos, ...E.usosSecretos.filter(([, k]) => sabidas.has(k)).map(([out]) => out)];
  if (usos.length) L.push(`🧩 Sirve para: ${lista(usos.map(corto), 3)}`);
  return L;
}
