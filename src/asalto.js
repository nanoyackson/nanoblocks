// El asalto a la pulpería: de noche, a veces los Chatas se meten a asaltar la pulpería del pueblo más cercano. Se oyen los gritos.
// Si uno llega y los saca a tiempo, Don Mario lo agradece (y no se olvida); si no, se llevan la caja.
// Estado: g.asalto (no se guarda), meta.asaltoCd, meta.pulperiaSalvada.
import { difOf } from './supervivencia.js';
import { SOLID } from './blocks.js';

const COLON = 360, PINTO = 263, DURA = 150, CADA = 3600;
function suelo(g, x, z, y0) {
  let y = Math.floor(y0) + 8;
  while (y > 1 && !SOLID[g.world.getBlock(Math.floor(x), y - 1, Math.floor(z))]) y--;
  return y;
}
// cada segundo
export function tickAsalto(g) {
  if (g.dim !== 'tierra' || g.mode !== 'survival' || !g.meta) return;
  const A = g.asalto, p = g.player.body.pos, t = g.time || 0, noche = t > 0.62 && t < 0.92;
  if (!A) {
    if (t < 0.62 || t > 0.79 || (g.day || 1) < 4 || !g.settings.hostiles || !difOf(g).hostiles || (g.clock || 0) < (g.meta.asaltoCd || 0) || Math.random() > 1 / 200) return;
    const v = g.nearestVillage(p.x, p.z);
    if (!v || v.dist > 70 || v.dist < 12 || !g.world.isLoaded(v.v.x, v.v.z)) return;
    empezar(g, v.v);
    return;
  }
  A.t--;
  const vencido = (m) => m.dying || m.health <= 0;
  const vivos = A.chatas.filter((m) => !m.dead && !m.dying);
  // si se descargaron (uno se fue lejos), no cuenta como vencerlos
  if (A.chatas.some((m) => m.dead && !vencido(m))) { for (const m of vivos) m.dead = true; g.asalto = null; g.ui.toast('🏪 Los Chatas se fueron con la caja de la pulpería', 3000); return; }
  if (!vivos.length) {
    g.asalto = null;
    const M = g.meta;
    M.pulperiaSalvada = (M.pulperiaSalvada || 0) + 1;
    g.giveItem(COLON, 40); g.giveItem(PINTO, 2);
    g.ui.dialog('Don Mario (pulpero)', '¡Diay, qué susto! Gracias, de verdad. Tenga, para el camino.', 5000);
    g.ui.toast('🏪 Salvó la pulpería: ₡40 y dos gallos pintos', 3200);
    g.achieve('pulperia', 'Salvé la pulpería');
    return;
  }
  // se oyen desde lejos
  if (A.t % 12 === 0) g.audio.play('grito', { pos: { x: A.x, y: A.y + 1, z: A.z }, vol: 0.9, pitch: 1.1 });
  if (A.t <= 0 || !noche) {
    for (const m of vivos) { g.particles.burst(m.body.pos.x, m.body.pos.y + 1, m.body.pos.z, [[0.3, 0.3, 0.3]], 8, 1); m.dead = true; }
    g.asalto = null;
    g.ui.toast('🏪 Los Chatas se fueron con la caja de la pulpería', 3000);
  }
}
function empezar(g, v) {
  const y = suelo(g, v.x, v.z, v.y || g.player.body.pos.y);
  const chatas = [];
  for (let i = 0; i < 3; i++) {
    const a = i * 2.1, x = v.x + Math.cos(a) * 3, z = v.z + Math.sin(a) * 3;
    const m = g.entities.spawnMob('chata', x, suelo(g, x, z, y) + 0.1, z);
    if (m) { m.data.asalto = true; m.data.grito = true; chatas.push(m); }
  }
  if (!chatas.length) return;
  g.asalto = { chatas, t: DURA, x: v.x, y, z: v.z };
  g.meta.asaltoCd = (g.clock || 0) + CADA;
  g.ui.toast('🏪 ¡Gritos en el pueblo! Los Chatas están asaltando la pulpería (🏪 en la brújula)', 4200);
  g.audio.play('grito', { ui: true, vol: 0.8, pitch: 1.1 });
}
export function marcaAsalto(g) { return g.asalto && g.dim === 'tierra' ? { x: g.asalto.x, z: g.asalto.z } : null; }
export function limpiarAsalto(g) { if (g.asalto) for (const m of g.asalto.chatas) m.dead = true; g.asalto = null; }
export function pruebaAsalto(g) {
  limpiarAsalto(g); g.time = 0.7;
  const p = g.player.body.pos, d = g.player.lookDir();
  empezar(g, { x: p.x + d.x * 14, z: p.z + d.z * 14, y: p.y });
  return g.asalto ? 'Asalto a 14 bloques: venza a los tres Chatas antes de que se vayan' : 'No hubo dónde ponerlos';
}
