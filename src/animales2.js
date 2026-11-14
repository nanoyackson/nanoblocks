// Más maña de los animales de la finca:
// · los perros le ladran a lo que anda en la oscuridad (Sombras, leyendas, Chatas): se paran firmes, brincan y ladran;
// · las gallinas, al oscurecer, se suben al palo (una cerca, un tronco, una rama baja) y ahí pasan la noche;
// · las vacas, cuando viene tormenta, se juntan en un solo montón y le dan la espalda al viento.
// Mientras hacen eso, m.data.animo manda (entities.js no les corre el cerebro). Nada se guarda.
import { BLOCKS, AIR, SOLID } from './blocks.js';

const PERCHA = /^(poste|cerca|baranda)|fence|log$|^tronco/; // ojo: «compostera» tiene «poste» adentro
function buscarPercha(g, b) {
  const w = g.world, x0 = Math.floor(b.x), y0 = Math.floor(b.y), z0 = Math.floor(b.z);
  let best = null;
  for (let dx = -6; dx <= 6; dx++) for (let dz = -6; dz <= 6; dz++) for (let dy = -1; dy <= 3; dy++) {
    const x = x0 + dx, y = y0 + dy, z = z0 + dz, id = w.getBlock(x, y, z), B = BLOCKS[id];
    if (!B || !PERCHA.test(B.key) || B.leafy) continue;
    if (w.getBlock(x, y + 1, z) !== AIR || w.getBlock(x, y + 2, z) !== AIR) continue;
    const d = Math.hypot(dx, dz) - dy * 0.3;
    if (!best || d < best.d) best = { x, y: y + 1, z, d };
  }
  return best;
}
// cada segundo: quién hace qué
export function tickAnimales2(g) {
  if (g.dim !== 'tierra') return;
  const p = g.player.body.pos, noche = g.daylight < 0.25, W = g.weather, tormenta = !!(W && W.type !== 'clear' && W.intensity > 0.5);
  const cerca = g.entities.mobs.filter((m) => !m.dead && !m.dying && Math.hypot(m.body.pos.x - p.x, m.body.pos.z - p.z) < 48);
  for (const m of cerca) if (m.data.animo && (m.tamed || m.data.arreo || m.data.sigue || m.data.ruta) && ['ladra', 'percha', 'junta'].includes(m.data.animo.tipo)) m.data.animo = null; // domados y arreados: mandan otros
  const malos = cerca.filter((m) => m.kind.hostile || m.kind.legend || m.data.impostor); // al vecino que no es, los perros le ladran desde antes
  for (const m of cerca) {
    if (m.tamed || m.data.arreo || m.data.sigue || m.data.ruta) continue;
    const A = m.data.animo;
    if (m.type === 'perro') {
      const t = malos.find((o) => Math.hypot(o.body.pos.x - m.body.pos.x, o.body.pos.z - m.body.pos.z) < 16);
      if (t) {
        m.data.animo = { tipo: 'ladra', m: t, t: (A && A.t) || 0 };
        if (noche && !g.perrosAviso && Math.hypot(m.body.pos.x - p.x, m.body.pos.z - p.z) < 24) { g.perrosAviso = true; g.ui.toast('🐕 Los perros le están ladrando a algo en la oscuridad…', 3000); g.achieve('perros_ladran', 'Los perros avisaron'); }
      } else if (A && A.tipo === 'ladra') m.data.animo = null;
    } else if (m.type === 'gallina') {
      if (noche && !A) { const q = buscarPercha(g, m.body.pos); if (q) m.data.animo = { tipo: 'percha', ...q, arriba: false }; }
      else if (!noche && A && A.tipo === 'percha') { m.data.animo = null; m.body.vel.y = 3; } // al amanecer se tiran del palo
      if (A && A.tipo === 'percha' && A.arriba && noche && Math.hypot(m.body.pos.x - p.x, m.body.pos.z - p.z) < 8) g.achieve('gallinas_palo', 'Las gallinas ya se subieron al palo');
    } else if (m.type === 'vaca') {
      if (A && A.tipo === 'robada') continue; // la lleva un Chata con mecate (abigeato.js)
      if (tormenta) {
        const otras = cerca.filter((o) => o.type === 'vaca' && Math.hypot(o.body.pos.x - m.body.pos.x, o.body.pos.z - m.body.pos.z) < 30);
        if (otras.length >= 2) { const cx = otras.reduce((s, o) => s + o.body.pos.x, 0) / otras.length, cz = otras.reduce((s, o) => s + o.body.pos.z, 0) / otras.length; m.data.animo = { tipo: 'junta', x: cx, z: cz }; }
      } else if (A && A.tipo === 'junta') m.data.animo = null;
    }
  }
  if (!noche) g.perrosAviso = false;
}
// cada cuadro: lo hacen
export function cuadroAnimales2(g, dt) {
  if (g.dim !== 'tierra') return;
  for (const m of g.entities.mobs) {
    const A = m.data.animo;
    if (!A || m.dead || m.dying) continue;
    const b = m.body;
    if (A.tipo === 'ladra') {
      const o = A.m.body.pos;
      if (A.m.dead) { m.data.animo = null; continue; }
      m.moving = false; m.targetYaw = Math.atan2(o.x - b.pos.x, o.z - b.pos.z);
      A.t -= dt;
      if (A.t <= 0) {
        A.t = 0.9 + Math.random() * 0.8;
        g.audio.play(Math.random() < 0.7 ? 'perro' : 'perro.gruñido', { pos: m.soundPos(), vol: 0.9, pitch: 0.9 + Math.random() * 0.25 });
        if (b.onGround) b.vel.y = 3.2; // el brinquito de cada ladrido
      }
    } else if (A.tipo === 'percha') {
      const dx = A.x + 0.5 - b.pos.x, dz = A.z + 0.5 - b.pos.z, d = Math.hypot(dx, dz);
      if (!A.arriba) {
        if (d > 1.3) { m.goTo(A.x + 0.5, A.z + 0.5, 1.2); if ((A.intento = (A.intento || 0) + dt) > 12) m.data.animo = null; }
        else { A.arriba = true; b.pos.x = A.x + 0.5; b.pos.z = A.z + 0.5; b.pos.y = A.y; g.particles.burst(b.pos.x, b.pos.y + 0.3, b.pos.z, [[0.95, 0.92, 0.85]], 5, 0.8); g.audio.play('aleteo', { pos: m.soundPos(), vol: 0.5 }); }
      } else {
        // en el palo: quietas, esponjadas, con la cabeza metida
        if (SOLID[g.world.getBlock(A.x, A.y - 1, A.z)] || BLOCKS[g.world.getBlock(A.x, A.y - 1, A.z)].render === 'shape') { b.pos.x = A.x + 0.5; b.pos.z = A.z + 0.5; b.pos.y = A.y; b.vel.x = b.vel.y = b.vel.z = 0; }
        else m.data.animo = null; // le quitaron el palo
        m.moving = false;
      }
    } else if (A.tipo === 'junta') {
      const dx = A.x - b.pos.x, dz = A.z - b.pos.z, d = Math.hypot(dx, dz);
      if (d > 2.2) m.goTo(A.x, A.z, 1.1);
      else { m.moving = false; m.targetYaw = (g.weather && g.weather.windDir) || 0.8; } // todas con la espalda al viento
      if (Math.random() < dt * 0.05) g.audio.play('vaca', { pos: m.soundPos(), vol: 0.7 });
    }
  }
}
