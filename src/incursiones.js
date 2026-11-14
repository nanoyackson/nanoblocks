// Las incursiones del monte (v6.2): vencer a un jefe tiene su precio. Desde el día 6, cada tres noches (las que no hay asedio), si uno
// está cerca de la casa o de donde duerme, los bichos del bioma de algún jefe ya vencido vienen a buscarlo: bananeras, escarabajos en
// estampida, sapos, luces malas, cangrejos o ciempiés. Llegan en dos tandas. Si se vencen todas, hay premio. Estado: g.incursion (no se
// guarda), meta.incursionDia.
import { hayAsedioHoy, puestoSombra } from './asedio.js';
import { difOf } from './supervivencia.js';

const RAID = {
  reina_bananera: { tipo: 'arana_bananera', n: 5, txt: '🕷 ¡Las bananeras bajan del monte! Vienen por usted: algo quedó de la Reina…' },
  escarabajo_hercules: { tipo: 'escarabajo', n: 3, txt: '🪲 Retumba el suelo: ¡vienen escarabajos en estampida!' },
  sapo_tata: { tipo: 'sapo_bufo', n: 6, txt: '🐸 Croan por todos lados: los sapos del Tata vienen a cobrar' },
  cascabel_rey: { tipo: 'luz_mala', n: 3, txt: '🔥 Luces malas en el zacate… y vienen para acá' },
  cangrejo_rey: { tipo: 'cangrejo_tenaza', n: 5, txt: '🦀 Clac, clac, clac: los cangrejos del Rey salieron del mar y vienen por usted' },
  ciempies_rey: { tipo: 'ciempies', n: 4, txt: '🐛 Tacatacata: ¡ciempiés por todas partes!' },
};
const casaCerca = (g) => {
  const p = g.player.body.pos, H = g.meta.hist, S = g.meta.spawn;
  return (H && H.casa && Math.hypot(H.casa.x - p.x, H.casa.z - p.z) < 40) || (S && Math.hypot(S.x - p.x, S.z - p.z) < 40);
};
const centroCasa = (g) => { const H = g.meta.hist, S = g.meta.spawn, p = g.player.body.pos; return H && H.casa ? { x: H.casa.x + 4, z: H.casa.z + 3, y: H.casa.y + 1 } : S ? { x: S.x, z: S.z, y: S.y } : { x: p.x, z: p.z, y: p.y }; };
function soltar(g, I, cuantas) {
  const p = I.centro || g.player.body.pos;
  for (let i = 0; i < cuantas; i++) {
    const a = Math.random() * Math.PI * 2, q = puestoSombra(g, p.x, p.z, Math.floor(p.y), a, 16 + Math.random() * 6);
    if (!q) continue;
    const m = g.entities.spawnMob(I.tipo, q.x + 0.5, q.y + (I.tipo === 'luz_mala' ? 1.5 : 0.2), q.z + 0.5);
    if (!m) continue;
    m.data.provoked = true; m.data.incursion = true;
    g.particles.burst(q.x + 0.5, q.y + 0.6, q.z + 0.5, [[0.4, 0.32, 0.2], [0.2, 0.15, 0.1]], 10, 1.6);
    I.mobs.push(m);
  }
}
// cada segundo
export function tickIncursiones(g) {
  const I = g.incursion;
  if (I) {
    I.t++;
    if (!I.segunda && I.t >= 25) { I.segunda = true; soltar(g, I, I.n - Math.ceil(I.n / 2)); g.ui.toast('⚠ ¡Viene la segunda tanda!', 2000); }
    const vivas = I.mobs.filter((m) => !m.dead && !m.dying).length;
    // si uno se va lejos de la casa (o las deja atrás), se van: el premio es para quien las pelea
    const C = I.centro, pl = g.player.body.pos;
    if (C && Math.hypot(pl.x - C.x, pl.z - C.z) > 60) { for (const m of I.mobs) if (!m.dead && !m.dying) m.dead = true; g.incursion = null; g.ui.toast('🌫 Se fue lejos de la casa: los bichos se devolvieron al monte', 2600); return; }
    if (I.segunda && vivas === 0) {
      if (I.mobs.some((m) => m.dead && !m.dying)) { g.incursion = null; return; } // alguna se desapareció (lejos o sin cargar): sin premio
      g.incursion = null;
      g.addXP(40);
      g.ui.toast('🛡 ¡Aguantó la incursión del monte! La casa sigue en pie (+40 de experiencia)', 3600);
      g.achieve('incursion', 'Aguanté la incursión del monte');
      return;
    }
    if (I.t > 160 || g.daylight > 0.5 || g.dim !== 'tierra') { for (const m of I.mobs) if (!m.dead && !m.dying) m.dead = true; g.incursion = null; }
    return;
  }
  const dia = g.day || 1, J = (g.meta && g.meta.jefes2) || {};
  if (g.mode !== 'survival' || !g.settings.hostiles || !difOf(g).hostiles || g.dim !== 'tierra' || dia < 6 || dia % 3 !== 0 || hayAsedioHoy(g)) return;
  if (g.meta.incursionDia === dia || g.daylight > 0.3 || (g.time || 0) < 0.55 || (g.time || 0) > 0.85) return;
  const vencidos = Object.keys(J).filter((k) => RAID[k]);
  if (!vencidos.length || !casaCerca(g) || Math.random() > 1 / 40) return;
  g.meta.incursionDia = dia;
  const R = RAID[vencidos[Math.floor(Math.random() * vencidos.length)]];
  const n = R.n + Math.min(3, Math.floor((dia - 6) / 6));
  g.incursion = { tipo: R.tipo, n, mobs: [], t: 0, segunda: false, centro: centroCasa(g) };
  soltar(g, g.incursion, Math.ceil(n / 2));
  g.audio.play('cencerro', { ui: true, vol: 0.8 });
  g.ui.toast(R.txt, 4200);
}
export function limpiarIncursion(g) { if (g.incursion) { for (const m of g.incursion.mobs) m.dead = true; g.incursion = null; } }
// /prueba incursion: la de un jefe al azar (o la de la Reina si no hay ninguno vencido)
export function pruebaIncursion(g) {
  limpiarIncursion(g);
  const J = (g.meta && g.meta.jefes2) || {}, k = Object.keys(J).find((q) => RAID[q]) || 'reina_bananera', R = RAID[k];
  const p = g.player.body.pos;
  g.incursion = { tipo: R.tipo, n: R.n, mobs: [], t: 0, segunda: false, centro: { x: p.x, z: p.z, y: p.y } };
  soltar(g, g.incursion, Math.ceil(R.n / 2));
  g.ui.toast(R.txt, 4200);
  return `Incursión: ${R.tipo} (la segunda tanda llega a los 25 s)`;
}
