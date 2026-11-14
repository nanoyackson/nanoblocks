// La neblina del Cerro de la Muerte y los gases del cráter. En el páramo, de noche o de madrugada, a veces cae de golpe una
// neblina que no deja ver nada: enfría rápido y, si uno se queda quieto sin fuego ni nada caliente, salen almas en pena. En los
// cráteres, bolsas de gas que huelen a azufre ahogan a quien no lleve mascarilla.
// Estado: g.neblinaM (no se guarda), meta.neblinaCd.
import { atacar } from './golpes.js';
import { armarAlma } from './modelos-alimanas.js';
import { BLOCK_BY_KEY as K, AIR } from './blocks.js';
import { difOf } from './supervivencia.js';

const DURA = [100, 160], CADA = 420, MASCARILLA = 525;
const CALIENTE = new Set(['fogata', 'torch', 'wall_torch0', 'wall_torch1', 'wall_torch2', 'wall_torch3', 'farol', 'farol_zenaida', 'furnace_lit', 'stove', 'lava'].map((k) => K[k]).filter(Boolean));
function calorCerca(g, r = 4) {
  const p = g.player.body.pos, w = g.world, x0 = Math.floor(p.x), y0 = Math.floor(p.y), z0 = Math.floor(p.z);
  for (let dx = -r; dx <= r; dx++) for (let dz = -r; dz <= r; dz++) for (let dy = -2; dy <= 2; dy++) if (CALIENTE.has(w.getBlock(x0 + dx, y0 + dy, z0 + dz))) return true;
  const h = g.inventory.held;
  return !!h && (h.id === K.torch || h.id === K.lamp);
}
const abrigado = (g) => { const e = g.player.effects; return !!(e.termal || e.energia || e.ignifugo); };
// 0..1: qué tan espesa está ahora (la lee game.js para la niebla)
export function neblinaMuerteK(g) {
  const N = g.neblinaM;
  if (!N || g.dim !== 'tierra') return 0;
  return Math.min(1, Math.min(N.t0 - N.t, N.t) / 8); // entra y se va en 8 s
}
// cada segundo
export function tickNeblina(g) {
  if (g.dim !== 'tierra' || !g.meta) return;
  tickGases(g);
  const N = g.neblinaM, P = g.player, p = P.body.pos;
  const bio = g.env && g.env.biome;
  if (!N) {
    const t = g.time || 0, madrugada = t > 0.55 || t < 0.08;
    if (bio !== 'paramo' || !madrugada || (g.clock || 0) < (g.meta.neblinaCd || 0) || Math.random() > 1 / 180) return;
    const d = DURA[0] + Math.random() * (DURA[1] - DURA[0]);
    g.neblinaM = { t: d, t0: d, quieto: 0, ultimo: { x: p.x, z: p.z }, almas: 0 };
    g.meta.neblinaCd = (g.clock || 0) + CADA + d;
    g.ui.toast('🌫 Cae la neblina del Cerro de la Muerte. Siga caminando, o prenda fuego', 4200);
    g.audio.play('rafaga', { ui: true, vol: 0.6, pitch: 0.7 });
    return;
  }
  N.t--;
  if (N.t <= 0 || (bio !== 'paramo' && !N.libre)) {
    g.neblinaM = null;
    for (const m of g.entities.mobs) if (m.type === 'alma_en_pena' && !m.dead) { g.particles.burst(m.body.pos.x, m.body.pos.y + 1, m.body.pos.z, [[0.8, 0.85, 0.95]], 14, 1.2); m.dead = true; }
    if (N.t <= 0 && P.alive && g.mode === 'survival') { g.ui.toast('🌤 Se levantó la neblina. Salió con vida del Cerro de la Muerte', 3200); g.achieve('neblina_muerte', 'Salí de la neblina del Cerro'); }
    return;
  }
  if (g.mode !== 'survival' || !P.alive) return;
  const calor = calorCerca(g) || abrigado(g);
  // la hipotermia: sin calor, el frío entra rapidísimo
  if (!calor) { g.addEffect('escalofrio', 3); N.frio = (N.frio || 0) + 1; if (N.frio % 12 === 0) g.damagePlayer(1, null, null, 'Hipotermia en la neblina del Cerro de la Muerte', true, false); if (N.frio === 4) g.ui.toast('🥶 Se está enfriando. Una fogata, una antorcha en la mano, un café o jengibre', 3000); }
  else N.frio = 0;
  // quedarse quieto sin calor llama a las almas en pena
  const mov = Math.hypot(p.x - N.ultimo.x, p.z - N.ultimo.z); N.ultimo = { x: p.x, z: p.z };
  N.quieto = mov < 0.5 && !calor ? N.quieto + 1 : 0;
  const almas = g.entities.mobs.filter((m) => m.type === 'alma_en_pena' && !m.dead).length;
  if ((N.quieto >= 5 || (!calor && Math.random() < 0.04)) && almas < 4 && g.settings.hostiles && difOf(g).hostiles) {
    N.quieto = 0;
    const a = Math.random() * Math.PI * 2, r = 6 + Math.random() * 4;
    const m = g.entities.spawnMob('alma_en_pena', p.x + Math.cos(a) * r, p.y + 0.5, p.z + Math.sin(a) * r);
    if (m && !N.almas++) g.ui.toast('👻 Entre la neblina se mueven almas en pena… muévase o prenda fuego', 3000);
  }
}
// ---------- los gases del cráter: sin mascarilla ahogan y marean ----------
function tickGases(g) {
  const P = g.player, p = P.body.pos;
  if (g.mode !== 'survival' || !P.alive) return;
  const col = g.world.gen.column(Math.floor(p.x), Math.floor(p.z));
  const k = col.volcanoK || 0;
  // cerca de la boca, y arriba (no en las faldas)
  if (k < 0.72 || p.y < col.h - 2) { g.gasT = 0; return; }
  const visible = Math.random() < 0.7;
  if (visible) for (let i = 0; i < 6; i++) g.particles.spawn(p.x + (Math.random() - 0.5) * 8, p.y + Math.random() * 2, p.z + (Math.random() - 0.5) * 8, [0.85, 0.8, 0.45], 0, 0.3, 0, 2, -0.2);
  g.gasT = (g.gasT || 0) + 1;
  if (g.inventory.count(MASCARILLA)) { if (g.gasT === 1) g.ui.toast('😷 Huele a azufre. Con la mascarilla puesta, se aguanta', 2400); return; }
  if (g.gasT === 1) g.ui.toast('☠ ¡Huele a azufre! Gases del cráter: aléjese de la boca o use mascarilla', 3000);
  if (g.gasT >= 2) { g.addEffect('mareo', 2); g.damagePlayer(1, null, null, 'Los gases del cráter', true, false); }
}
export function limpiarNeblina(g) { g.neblinaM = null; g.gasT = 0; }
// para /prueba neblina: cae ya, aunque no sea el páramo
export function pruebaNeblina(g) { g.neblinaM = { t: 90, t0: 90, quieto: 0, ultimo: { x: g.player.body.pos.x, z: g.player.body.pos.z }, almas: 0, libre: true }; g.time = 0.7; return 'Cae la neblina del Cerro (90 s). Párese sin moverse y sin fuego para ver las almas en pena'; }

// ---------- el alma en pena: una figura blanca, sin pies, que flota y enfría con solo tocar ----------
export const ALMAS = {
  alma_en_pena: {
    name: 'Alma en pena', w: 0.6, h: 1.7, health: 12, speed: 1.8, hostile: true, attack: 2, hurtSound: 'susurro', idleSound: 'susurro', idleEvery: [5, 10],
    particle: [[0.85, 0.88, 0.95], [0.6, 0.65, 0.75]], drops: [], xp: 8,
    build() { return armarAlma(); },
    brain(m, dt, c) {
      const { g, distP, dxp, dzp, pl } = c;
      m.noGravity = true; m.data.apuro = true;
      const b = m.body;
      // flota un poquito sobre el suelo
      let gy = Math.floor(b.pos.y); while (gy > 1 && g.world.getBlock(Math.floor(b.pos.x), gy, Math.floor(b.pos.z)) === AIR) gy--;
      b.vel.y = ((gy + 1.4 + Math.sin(m.t * 2) * 0.15) - b.pos.y) * 2;
      // el fuego las deshace
      const h = g.inventory.held;
      if (!g.neblinaM || (distP < 6 && h && (h.id === K.torch || h.id === K.lamp))) { g.particles.burst(b.pos.x, b.pos.y + 1, b.pos.z, m.kind.particle, 14, 1.2); m.dead = true; return true; }
      if (g.mode !== 'survival' || !g.player.alive) return true;
      m.targetYaw = Math.atan2(dxp, dzp); m.goTo(pl.x, pl.z, 1);
      if (distP < 1.5 && m.attackCd <= 0) atacar(m, g, { tipo: 'zarpazo', dano: m.kind.attack, causa: 'Un alma en pena lo tocó', alcance: 1.5, armored: false, cd: 1.6, alGolpe: (llego) => { if (llego) { g.addEffect('escalofrio', 6); g.addEffect('miedo', 3); } } });
      return true;
    },
    animate(m, dt, u) {
      u.brazos.forEach((a, i) => { a.rotation.x = -1.3 + Math.sin(m.t * 2 + i) * 0.15; });
      u.body.rotation.z = Math.sin(m.t * 1.3) * 0.06;
      if (Math.random() < dt * 8) { const b = m.body.pos; m.game.particles.spawn(b.x + (Math.random() - 0.5) * 0.5, b.y + 0.2, b.z + (Math.random() - 0.5) * 0.5, [0.85, 0.88, 0.95], 0, -0.2, 0, 1, -0.3); }
    },
    alMorir(m, g) { g.achieve('alma_en_pena', 'Que descanse esa alma'); },
  },
};
