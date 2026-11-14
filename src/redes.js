// Pescador profesional: la red de pesca se tira al agua (queda flotando con sus corchos) y a los minutos se recoge
// con varios pescados (más y mejores en el mar). Con muchas redadas, el logro de pescador.
import { BLOCK_BY_KEY as K, FLUID } from './blocks.js';
import { regionAt } from './regiones.js';
import { FISH } from './mar.js';

export const RED = 463;
const ESPERA = 150; // segundos hasta que la red está llena
const MAX_REDES = 3; // v12.7.0: antes sin tope (cada red ≈ 8 peces al día)

export function tirarRed(g, ft) {
  if (!ft || FLUID[ft.id] !== 1) { g.ui.toast('La red se tira al agua', 1200); return false; }
  const w = g.world;
  // la superficie: el agua más alta de esa columna
  let y = ft.y;
  while (FLUID[w.getBlock(ft.x, y + 1, ft.z)] === 1) y++;
  if (w.getBlock(ft.x, y + 1, ft.z) !== 0) { g.ui.toast('Ahí no cabe la red', 1200); return false; }
  const R = (g.meta.redes = g.meta.redes || {});
  if (Object.keys(R).length >= MAX_REDES) { g.ui.toast(`🎣 Ya tiene ${MAX_REDES} redes tiradas: recoja una antes`, 2200); return false; } // v12.7.0 (preparación C5 §1.5)
  w.setBlock(ft.x, y, ft.z, K.red_pesca);
  R[`${ft.x},${y},${ft.z}`] = { t0: g.clock || 0 };
  g.audio.play('splash', { pos: { x: ft.x + 0.5, y: y + 1, z: ft.z + 0.5 }, vol: 0.6 });
  if (!g.meta.redAviso) { g.meta.redAviso = true; g.ui.toast('🎣 Red tirada. Vuelva en un par de minutos y recójala con clic derecho', 2600); }
  return true;
}

// clic derecho sobre la red
export function recogerRed(g, t) {
  const k = `${t.x},${t.y},${t.z}`;
  const R = (g.meta.redes = g.meta.redes || {});
  const r = R[k] || (R[k] = { t0: (g.clock || 0) - ESPERA });
  const falta = Math.ceil(ESPERA - ((g.clock || 0) - r.t0));
  if (falta > 0) { g.ui.toast(`🎣 La red todavía está vacía… falta como ${falta > 60 ? `${Math.ceil(falta / 60)} min` : `${falta} s`}`, 1600); return; }
  const mar = regionAt(g.world.gen, t.x, t.z) === 'mar' || g.world.gen.column(t.x, t.z).biome === 'beach';
  const n = 2 + Math.floor(Math.random() * 4);
  const p = g.player.body.pos;
  for (let i = 0; i < n; i++) {
    const r2 = Math.random();
    const id = mar ? (i % 4 === 3 ? 1103 : r2 < 0.15 ? FISH.dorado : r2 < 0.6 ? FISH.pargo : FISH.corvina) : (r2 < 0.7 ? FISH.guapote : FISH.corvina); // v12.7.0: la sardina (carnada) sale de la red
    g.entities.dropItem(id, 1, t.x + 0.5, t.y + 1, t.z + 0.5, { x: (p.x - t.x - 0.5) * 1.5, y: 4, z: (p.z - t.z - 0.5) * 1.5 }, 0.2);
  }
  if (Math.random() < 0.08) g.entities.dropItem(368, 1, t.x + 0.5, t.y + 1, t.z + 0.5, { x: 0, y: 4, z: 0 }, 0.2);
  r.t0 = g.clock || 0;
  g.audio.play('carrete', { pos: { x: t.x + 0.5, y: t.y + 1, z: t.z + 0.5 }, vol: 0.7 });
  g.particles.burst(t.x + 0.5, t.y + 1, t.z + 0.5, [[0.8, 0.9, 1], [1, 1, 1]], 14, 2.5);
  g.ui.toast(`🐟 ¡Redada! ${n} pescados`, 1400);
  g.meta.redadas = (g.meta.redadas || 0) + 1;
  g.achieve('red', 'Redada');
  if (g.meta.redadas >= 15) g.achieve('pescador_pro', 'Pesca de oficio');
}
