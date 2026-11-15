// El yunque: con un arma, herramienta o pieza de armadura en la mano, clic derecho la mejora hasta 3 veces y la deja como nueva.
// Cuesta su propio material y, de la segunda en adelante, esencia de sombra: es adonde va a dar lo que sobra de la minería y de
// partir nidos. La mejora vive en stack.mejora (daño en game.attack, velocidad en game.breakTime, protección en inventory.armorValue).
// Y la compostera, en el mismo espíritu de no botar nada: cuatro sobras de comida o de monte dan una bolsa de abono.
import { BLOCK_BY_KEY as K, ITEMS, getDef, itemName } from './blocks.js';
import { materialDe } from './comodidad.js';
import { ESENCIA } from './nidos.js';
import { POR_ESTRELLA_VEL } from './habilidades.js';

export const TOPE_MEJORA = 3;
// la cuarta estrella la sabe dar Ñor Tino, cuando recupera su martillo (encargos.js)
const conTino = (g) => { const P = g.meta && g.meta.gente && g.meta.gente.p && g.meta.gente.p.tino; return !!(P && P.fase === 2 && (P.nivel || 1) >= 2); };
export const topeDe = (g) => TOPE_MEJORA + (conTino(g) ? 1 : 0);
const POR_NIVEL = 0.12, ABONO = 280, POR_ABONO = 4;
export const factorMejora = (s) => 1 + ((s && s.mejora) || 0) * POR_NIVEL;
export const factorVelocidad = (s) => 1 + ((s && s.mejora) || 0) * POR_ESTRELLA_VEL;
const estrellas = (n) => '★'.repeat(n);

export function costoMejora(s, def) {
  const n = (s.mejora || 0) + 1, m = materialDe(def), L = [];
  if (m) L.push([m, n * 2]);
  if (n >= 2) L.push([ESENCIA, n - 1]);
  if (n >= 4) { const d = L.find(([id]) => id === 260); if (d) d[1] += 2; else L.push([260, 2]); } // la cuarta pide diamante
  return L;
}
export function usarYunque(g, t) {
  const inv = g.inventory, s = inv.held, def = s && getDef(s.id);
  if (!def || !def.durability) { g.ui.toast('🔨 Póngase en la mano un arma, una herramienta o una pieza de armadura', 2600); return; }
  if (!materialDe(def)) { g.ui.toast('🔨 Esto no se puede mejorar en el yunque', 2200); return; }
  const n = s.mejora || 0;
  if (n >= topeDe(g)) {
    const pista = n === TOPE_MEJORA && g.meta.gente && g.meta.gente.p && g.meta.gente.p.tino ? '. Ñor Tino dice que con su martillo le saca una cuarta' : '';
    g.ui.toast(`🔨 ${itemName(s.id)} ya está en lo más alto: ${estrellas(n)}${pista}`, 3000);
    return;
  }
  const costo = costoMejora(s, def);
  if (g.mode === 'survival') {
    const falta = costo.filter(([id, c]) => inv.count(id) < c);
    if (falta.length) { g.ui.toast(`🔨 Para mejorarla le falta: ${falta.map(([id, c]) => `${c - inv.count(id)} ${itemName(id)}`).join(', ')}`, 3200); return; }
    for (const [id, c] of costo) inv.remove(id, c);
  }
  s.mejora = n + 1;
  s.dur = def.durability;
  inv.changed();
  for (let k = 0; k < 3; k++) setTimeout(() => { if (g.audio) g.audio.play('yunque', { pos: { x: t.x + 0.5, y: t.y + 1, z: t.z + 0.5 }, vol: 0.9 }); }, k * 260);
  g.particles.burst(t.x + 0.5, t.y + 1, t.z + 0.5, [[1, 0.8, 0.3], [1, 0.5, 0.15], [1, 1, 0.8]], 26, 3);
  g.ui.toast(`🔨 ${itemName(s.id)} ${estrellas(s.mejora)}: ${def.armor ? 'protege más' : !def.tool || def.tool === 'sword' ? `${Math.round((factorMejora(s) - 1) * 100)} % más de daño` : `${Math.round((factorVelocidad(s) - 1) * 100)} % más de velocidad y ${Math.round((factorMejora(s) - 1) * 100)} % más de daño`}, y quedó como nueva`, 3200);
  g.achieve('yunque', 'Al yunque');
  if (s.mejora === TOPE_MEJORA) g.achieve('mejora3', 'Tres estrellas');
  if (s.mejora === 4) { g.achieve('mejora4', 'Cuarta estrella'); g.ui.toast('🔨 Ñor Tino se asoma: «Eso. Así se le pega a un fierro»', 2800); }
}
// ---------- la compostera ----------
const sirveCompost = (id) => {
  const d = ITEMS[id];
  if (d && d.food) return true;
  if (id === 570) return true; // v12.1.0: las sobras de la despensa
  return [K.leaves, K.jungle_leaves, K.tall_grass, K.fern].includes(id);
};
export function usarCompostera(g, t) {
  const s = g.inventory.held;
  if (!s || !sirveCompost(s.id)) { g.ui.toast('🌱 La compostera recibe sobras de comida, hojas y zacate', 2400); return; }
  const C = (g.meta.compost ||= {}), k = `${t.x},${t.y},${t.z}`;
  C[k] = (C[k] || 0) + 1;
  if (g.mode === 'survival') g.inventory.consumeHeld(1);
  g.particles.burst(t.x + 0.5, t.y + 1, t.z + 0.5, [[0.35, 0.5, 0.2], [0.4, 0.28, 0.14]], 8, 1);
  g.audio.play('dig.leaves', { pos: { x: t.x + 0.5, y: t.y + 1, z: t.z + 0.5 }, vol: 0.6 });
  if (C[k] < POR_ABONO) { g.ui.toast(`🌱 Compostera: ${C[k]} de ${POR_ABONO}`, 1200); return; }
  C[k] = 0;
  g.entities.dropItem(ABONO, 1, t.x + 0.5, t.y + 1.1, t.z + 0.5);
  g.achieve('compost', 'Nada se bota');
}
