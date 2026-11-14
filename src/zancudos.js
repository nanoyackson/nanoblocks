// Zancudos: al atardecer y de noche, en el manglar, la selva o cerca del agua, llega una nubecita zumbando que pica
// (poquito, pero molesta). Con repelente (limón + guaro, o de la farmacia) no se arriman. De día se van.
import { armarZancudo } from './modelos-otros.js';
import { difOf } from './supervivencia.js';
import { fogataCerca } from './supervivencia2.js';
import { temporalActivo } from './vida2.js';
import { quizaFiebre } from './monte.js';

export const REPELENTE = 423;

export const ZANCUDO = {
  name: 'Zancudo', w: 0.15, h: 0.15, health: 1, speed: 4.5, flying: true, hostile: true, attack: 1, xp: 1,
  hurtSound: null, idleSound: null, particle: [[0.2, 0.2, 0.2]], drops: [],
  build() { return armarZancudo(); },
  flyGoal(m, g) {
    const pl = g.player.body.pos, b = m.body.pos, ck = g.clock || 0;
    m.data.born = m.data.born ?? ck;
    // se van de día o al rato
    if (g.daylight > 0.62 || ck - m.data.born > 120) { m.dead = true; return { x: b.x, y: b.y, z: b.z }; }
    // con repelente: se alejan
    if (g.player.effects.repelente || (m.data.fogT = (m.data.fogT || 0) - 1) < -30 && fogataCerca(g, pl.x, pl.y, pl.z) && (m.data.fogT = 0, true)) return { x: b.x + (b.x - pl.x) * 3, y: pl.y + 3, z: b.z + (b.z - pl.z) * 3 };
    const t = ck * 3 + (m.data.ph ??= Math.random() * 6);
    const d = Math.hypot(pl.x - b.x, pl.y + 1.5 - b.y, pl.z - b.z);
    if (d < 0.9 && ck > (m.data.cd || 0) && g.mode === 'survival' && g.player.alive) {
      const bravo = (g.meta.dificultad || 'normal') === 'dificil';
      m.data.cd = ck + ((bravo ? 2.5 : 4) + Math.random() * (bravo ? 2 : 3)) * (g.meta.cuaderno && g.meta.cuaderno.zancudos ? 2 : 1);
      g.damagePlayer(bravo ? 1 : 0.5, null, null, 'Se lo comieron los zancudos', true);
      quizaFiebre(g);
      if (!g.meta.picado) { g.meta.picado = true; g.ui.toast('🦟 ¡Ay, un zancudo! Un repelente (limón + guaro) los aleja', 3000); }
    }
    return { x: pl.x + Math.cos(t) * 0.7, y: pl.y + 1.5 + Math.sin(t * 1.7) * 0.3, z: pl.z + Math.sin(t) * 0.7 };
  },
  animate(m, dt, u) { u.wings.forEach(({ p, side }) => { p.rotation.z = side * Math.sin(m.t * 60) * 0.9; }); },
};

// cada segundo: zumbido del más cercano y, al anochecer en lugares húmedos, llega una nubecita
export function tickZancudos(g) {
  const E = g.entities, p = g.player.body.pos;
  const zs = E.mobs.filter((m) => m.type === 'zancudo' && !m.dead);
  let near = null, nd = 9;
  for (const m of zs) { const d = Math.hypot(m.body.pos.x - p.x, m.body.pos.y - p.y - 1.5, m.body.pos.z - p.z); if (d < nd) { nd = d; near = m; } }
  g.audio.setEmitter('zancudo', 'loop.zancudo', near ? { x: near.body.pos.x, y: near.body.pos.y, z: near.body.pos.z } : null, 0.55);
  if (g.mode !== 'survival' || g.dim !== 'tierra' || !difOf(g).hostiles || !g.settings.hostiles || g.player.effects.repelente || fogataCerca(g, p.x, p.y, p.z)) return;
  if (g.daylight > 0.55 || g.daylight < 0.05 || zs.length >= ((g.meta.dificultad || 'normal') === 'dificil' ? 5 : 3) || Math.random() > 0.06) return;
  // bajo techo no entran
  if (g.weather && g.weather.top(Math.floor(p.x), Math.floor(p.z)) > p.y + 1.6) return;
  const col = g.world.gen.column(Math.floor(p.x), Math.floor(p.z));
  const humedo = ['manglar', 'jungle'].includes(col.biome) || (g.weather && g.weather.intensity > 0.3) || col.h <= 64 || temporalActivo(g);
  if (!humedo) return;
  const n = 1 + Math.floor(Math.random() * 2);
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2;
    E.spawnMob('zancudo', p.x + Math.cos(a) * 7, p.y + 2, p.z + Math.sin(a) * 7);
  }
}
