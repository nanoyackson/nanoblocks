// La procesión de las ánimas: de noche, cerca de los pueblos, a veces pasa una fila de ánimas con velas, despacito y rezando bajito.
// No le hacen nada a nadie. Si uno las acompaña un rato con respeto, la última le deja algo al irse; si uno le pega a una, se apagan
// todas las velas de golpe y queda el susto. Estado: g.procesion (no se guarda), meta.procesionCd.
import { armarAnima } from './modelos-otros.js';
import { SOLID } from './blocks.js';
import { villageAt, CELL } from './pueblogen.js';
import { difOf } from './supervivencia.js';

const ESENCIA = 499, CANDELA = 501, CUANTAS = 7, CADA = 1500;
function puebloCerca(g, x, z) {
  const cx = Math.floor(x / CELL), cz = Math.floor(z / CELL);
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) { const v = villageAt(g.world.gen, cx + dx, cz + dz); if (v && Math.hypot(v.x - x, v.z - z) < 110) return v; }
  return null;
}
// cada segundo
export function tickProcesion(g) {
  if (g.dim !== 'tierra' || !g.meta) return;
  const P = g.procesion, p = g.player.body.pos, t = g.time || 0, noche = t > 0.62 && t < 0.9;
  if (!P) {
    if (g.mode !== 'survival' || !noche || (g.clock || 0) < (g.meta.procesionCd || 0) || (g.day || 1) < 3 || Math.random() > 1 / 120) return;
    const v = puebloCerca(g, p.x, p.z);
    if (!v) return;
    empezar(g, p);
    return;
  }
  const vivas = P.animas.filter((m) => !m.dead);
  if (!vivas.length || !noche) { terminar(g, P, P.apagada ? null : 'amanecer'); return; }
  // ¿uno va con ellas? a menos de 8 de alguna, sin pegarle a nadie
  const cerca = vivas.some((m) => Math.hypot(m.body.pos.x - p.x, m.body.pos.z - p.z) < 8);
  if (cerca) { P.acompana++; if (P.acompana === 4) g.ui.toast('🕯 Las ánimas siguen rezando. Acompáñelas sin molestar', 2800); }
  P.t--;
  if (P.t <= 0) terminar(g, P, P.acompana >= 25 ? 'acompanada' : 'pasó');
}
function empezar(g, p) {
  // caminan pasando a unos 4 bloques de uno, de un lado al otro
  const a = Math.random() * Math.PI * 2, dx = Math.cos(a), dz = Math.sin(a);
  const x0 = p.x - dx * 18 - dz * 4, z0 = p.z - dz * 18 + dx * 4;
  const animas = [];
  for (let i = 0; i < CUANTAS; i++) {
    const x = x0 - dx * i * 1.6, z = z0 - dz * i * 1.6;
    let y = g.world.gen.column(Math.floor(x), Math.floor(z)).h + 6;
    while (y > 1 && !SOLID[g.world.getBlock(Math.floor(x), y - 1, Math.floor(z))]) y--;
    const m = g.entities.spawnMob('anima', x, y + 0.2, z);
    if (m) { m.data.dir = { x: dx, z: dz }; m.data.orden = i; animas.push(m); }
  }
  g.procesion = { animas, t: 75, acompana: 0, apagada: false };
  g.meta.procesionCd = (g.clock || 0) + CADA;
  g.ui.toast('🕯 Se oye un rezo bajito… pasa una procesión de ánimas con velas', 3600);
}
function terminar(g, P, como) {
  for (const m of P.animas) if (!m.dead) { g.particles.burst(m.body.pos.x, m.body.pos.y + 1.2, m.body.pos.z, [[1, 0.9, 0.5], [0.9, 0.9, 1]], 8, 0.8); m.dead = true; }
  g.procesion = null;
  if (como === 'acompanada') {
    g.giveItem(CANDELA, 1); g.giveItem(ESENCIA, 2);
    g.ui.toast('🕯 La última ánima le dejó su vela y se deshizo. Gracias por acompañar', 4200);
    g.achieve('procesion', 'Acompañé a las ánimas');
  } else if (como === 'pasó' || como === 'amanecer') g.ui.toast('🕯 La procesión se perdió entre las casas', 2400);
}
// si uno le pega a una: se apagan todas, queda el susto y salen Sombras
export function apagarProcesion(g) {
  const P = g.procesion;
  if (!P || P.apagada) return;
  P.apagada = true;
  g.addEffect('pavor', 4); g.addEffect('miedo', 20);
  g.audio.play('grito', { ui: true, vol: 1, pitch: 0.6 });
  g.ui.toast('🕯 ¡Se apagaron todas las velas de un solo! Algo se mueve en lo oscuro', 3600);
  g.achieve('procesion_mal', 'Eso no se hace');
  const p = g.player.body.pos;
  if (g.settings.hostiles && difOf(g).hostiles) for (let i = 0; i < 3; i++) {
    const x = p.x + Math.cos(i * 2.1) * 8, z = p.z + Math.sin(i * 2.1) * 8;
    let y = Math.floor(p.y) + 6; while (y > 1 && !SOLID[g.world.getBlock(Math.floor(x), y - 1, Math.floor(z))]) y--;
    if (g.world.getBlock(Math.floor(x), y, Math.floor(z)) === 0 && g.world.getBlock(Math.floor(x), y + 1, Math.floor(z)) === 0) g.entities.spawnMob('sombra', x, y + 0.1, z);
  }
  terminar(g, P, null);
}
export function limpiarProcesion(g) { if (g.procesion) for (const m of g.procesion.animas) m.dead = true; g.procesion = null; }
export function pruebaProcesion(g) { if (g.procesion) limpiarProcesion(g); g.time = 0.7; empezar(g, g.player.body.pos); return 'Pasa una procesión de ánimas. Acompáñelas 25 s sin pegarles (o péguele a una, para ver qué pasa)'; }

// ---------- el ánima: manto blanco, capucha, y una vela encendida en las manos ----------
export const ANIMA = {
  anima: {
    name: 'Ánima', w: 0.55, h: 1.7, health: 4, speed: 0.9, hurtSound: 'susurro', idleSound: 'susurro', idleEvery: [3, 7], ghostly: true,
    particle: [[0.9, 0.9, 1], [1, 0.85, 0.4]], drops: [], xp: 0,
    build() { return armarAnima(); },
    brain(m) {
      const D = m.data, b = m.body;
      D.apuro = true; m.noGravity = false;
      if (!D.dir) { m.moving = false; return true; }
      m.goTo(b.pos.x + D.dir.x * 3, b.pos.z + D.dir.z * 3, 1);
      return true;
    },
    // pegarle a una apaga todas
    onHurt(m, g) { if (g.golpeando === m) apagarProcesion(g); return false; },
    animate(m, dt, u) {
      u.llama.scale.set(1, 1 + Math.sin(m.t * 13 + m.data.orden) * 0.25, 1);
      u.body.rotation.z = Math.sin(m.t * 1.6 + (m.data.orden || 0)) * 0.04;
      if (Math.random() < dt * 3) { const b = m.body.pos; m.game.particles.spawn(b.x + Math.sin(m.yaw) * 0.26, b.y + 1.32, b.z + Math.cos(m.yaw) * 0.26, [1, 0.8, 0.35], 0, 0.5, 0, 0.6, -0.5, true); }
    },
  },
};
