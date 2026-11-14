// La lluvia de ranas: en las tormentas fuertes del Caribe, muy de vez en cuando, una tromba en el mar chupa las ranitas de las
// lagunas y las suelta tierra adentro: llueven ranas (calzonudas, dardos, sapos) durante medio minuto. Caen, rebotan, brincan y
// se van. Inofensivo y rarísimo. Estado: g.lluviaRanas (no se guarda), meta.ranasCd (día).
import { regionAt } from './regiones.js';
import { SOLID } from './blocks.js';

const DURA = 30, TIPOS = ['rana_calzonuda', 'rana_calzonuda', 'rana_dardo', 'sapo', 'rana_vidrio'];
export function tickRanas(g) {
  // las que cayeron se van yendo solas (brincan al monte)
  if (g.ranasSueltas) { let quedan = 0; for (const m of g.entities.mobs) if (m.data.deLluvia && !m.dead) { if (--m.data.deLluvia <= 0) m.dead = true; else quedan++; } if (!quedan && !g.lluviaRanas) g.ranasSueltas = false; }
  const R = g.lluviaRanas;
  if (R) {
    R.t--;
    if (R.t <= 0 || g.dim !== 'tierra') { g.lluviaRanas = null; if (R.vistas >= 10) { g.achieve('lluvia_ranas', '¡Llovieron ranas!'); g.ui.toast('🐸 Ya escampó de ranas. Nadie le va a creer esto', 3600); } }
    return;
  }
  const W = g.weather;
  if (g.dim !== 'tierra' || !g.meta || !W || W.type !== 'storm' || W.intensity < 0.7 || (g.meta.ranasCd || 0) > (g.day || 1) || Math.random() > 1 / 600) return;
  const p = g.player.body.pos;
  if (regionAt(g.world.gen, p.x, p.z) !== 'caribe') return;
  g.meta.ranasCd = (g.day || 1) + 10;
  empezar(g);
}
function empezar(g) {
  g.lluviaRanas = { t: DURA, vistas: 0, cada: 0 };
  g.ui.toast('🐸 ¿Qué es eso que cae con el agua?… ¡Están lloviendo RANAS!', 4200);
}
// cada cuadro: las ranas que caen
export function cuadroRanas(g, dt) {
  const R = g.lluviaRanas;
  if (!R) return;
  R.cada -= dt;
  if (R.cada > 0) return;
  R.cada = 0.35 + Math.random() * 0.4;
  if (g.entities.mobs.filter((m) => TIPOS.includes(m.type) && !m.dead).length > 40) return;
  const p = g.player.body.pos, a = Math.random() * Math.PI * 2, r = 2 + Math.random() * 14, x = p.x + Math.cos(a) * r, z = p.z + Math.sin(a) * r;
  if (!g.world.isLoaded(x, z)) return;
  // que caiga a la intemperie
  for (let y = Math.floor(p.y) + 2; y < Math.floor(p.y) + 22; y++) if (SOLID[g.world.getBlock(Math.floor(x), y, Math.floor(z))]) return;
  const m = g.entities.spawnMob(TIPOS[Math.floor(Math.random() * TIPOS.length)], x, p.y + 18 + Math.random() * 4, z);
  if (!m) return;
  m.body.onGround = false; m.body.vel.y = -4;
  m.data.deLluvia = 40 + Math.floor(Math.random() * 30); // después de un rato se va
  g.ranasSueltas = true;
  R.vistas++;
  if (Math.random() < 0.3) g.audio.play('rana', { pos: { x, y: p.y + 2, z }, vol: 0.6, pitch: 0.9 + Math.random() * 0.4 });
}
export const limpiarRanas = (g) => { g.lluviaRanas = null; };
export function pruebaRanas(g) {
  g.weather.set('storm'); g.weather.timer = 600;
  empezar(g);
  return 'Tormenta y lluvia de ranas por medio minuto';
}
