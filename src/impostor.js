// El vecino que no es: algunas noches, en el pueblo, alguien con ropa de vecino se queda quieto pegado a una pared, mirándola. No
// contesta, no se mueve, y los perros le ladran. Si uno se le acerca mucho, se voltea despacito; si se le habla o se le pega, se
// deshace la ropa y queda lo que era: una Sombra. Estado: g.impostor (no se guarda), g.impostorNoche.
import { SOLID, AIR } from './blocks.js';
import { difOf } from './supervivencia.js';
import { decir } from './misiones.js';

function pared(g) {
  const w = g.world, p = g.player.body.pos;
  for (let k = 0; k < 40; k++) {
    const a = Math.random() * Math.PI * 2, r = 9 + Math.random() * 10, x = Math.floor(p.x + Math.cos(a) * r), z = Math.floor(p.z + Math.sin(a) * r);
    for (let y = Math.floor(p.y) + 3; y >= Math.floor(p.y) - 3; y--) {
      if (!SOLID[w.getBlock(x, y - 1, z)] || w.getBlock(x, y, z) !== AIR || w.getBlock(x, y + 1, z) !== AIR) continue;
      for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (SOLID[w.getBlock(x + dx, y, z + dz)] && SOLID[w.getBlock(x + dx, y + 1, z + dz)]) return { x: x + 0.5, y, z: z + 0.5, dx, dz };
    }
  }
  return null;
}
function aparecer(g) {
  const q = pared(g);
  if (!q) return false;
  const m = g.entities.spawnMob('vecino', q.x, q.y + 0.05, q.z);
  if (!m) return false;
  Object.assign(m.data, { role: 'vecino', name: '¿Vecino?', impostor: true, seed: 1 + Math.floor(Math.random() * 1e6), home: { x: Math.floor(q.x), y: q.y, z: Math.floor(q.z) }, plaza: { x: Math.floor(q.x), y: q.y, z: Math.floor(q.z) }, vid: 'impostor', animo: { tipo: 'impostor' } });
  if (m.kind.dress) m.kind.dress(m);
  g.impostor = { m, mira: Math.atan2(q.dx, q.dz), cerca: 0 };
  g.impostorNoche = g.day || 1;
  return true;
}
export function revelar(g, porque) {
  const I = g.impostor;
  if (!I || I.m.dead) return;
  const b = I.m.body.pos;
  I.m.dead = true;
  g.particles.burst(b.x, b.y + 1, b.z, [[0.05, 0.02, 0.08], [0.25, 0.1, 0.3], [0.6, 0.55, 0.5]], 30, 2.5);
  const s = g.entities.spawnMob((g.day || 1) >= 12 ? 'sombra_grande' : 'sombra', b.x, b.y + 0.1, b.z);
  if (s) { s.data.provoked = true; s.data.apuro = true; }
  g.audio.play('sombra', { pos: { x: b.x, y: b.y + 1, z: b.z }, vol: 1.2, pitch: 0.8 });
  g.audio.play('grito', { ui: true, vol: 0.5, pitch: 1.1 });
  g.addEffect('miedo', 4); g.shake = Math.max(g.shake || 0, 0.7);
  g.ui.toast(porque === 'habla' ? '😱 Se volteó… ¡y no tenía cara! No era un vecino' : '😱 ¡Se le cayó la ropa y era una Sombra!', 3600);
  g.achieve('impostor', 'El vecino que no era');
  g.impostor = null;
}
// cada segundo
export function tickImpostor(g) {
  const I = g.impostor;
  if (I) {
    if (I.m.dead || g.daylight > 0.4 || g.dim !== 'tierra') { if (!I.m.dead) { const b = I.m.body.pos; g.particles.burst(b.x, b.y + 1, b.z, [[0.05, 0.02, 0.08]], 14, 1.5); I.m.dead = true; } g.impostor = null; }
    return;
  }
  if (g.dim !== 'tierra' || g.mode !== 'survival' || g.daylight > 0.22 || g.impostorNoche === (g.day || 1) || (g.day || 1) < 5) return;
  if (!g.settings.hostiles || !difOf(g).hostiles || Math.random() > 1 / 200) return;
  const p = g.player.body.pos, v = g.nearestVillage && g.nearestVillage(p.x, p.z);
  if (!v || v.dist > 40) return;
  aparecer(g);
}
// cada cuadro: quieto mirando la pared; si uno se acerca, se voltea despacito
export function cuadroImpostor(g, dt) {
  const I = g.impostor;
  if (!I || I.m.dead) return;
  const m = I.m, p = g.player.body.pos, b = m.body.pos, d = Math.hypot(p.x - b.x, p.z - b.z);
  m.moving = false; b.x = I.m.data.home.x + 0.5; b.z = I.m.data.home.z + 0.5;
  if (d < 4.5) {
    I.cerca += dt;
    const hacia = Math.atan2(p.x - b.x, p.z - b.z);
    let dy = hacia - I.mira; while (dy > Math.PI) dy -= Math.PI * 2; while (dy < -Math.PI) dy += Math.PI * 2;
    m.targetYaw = I.mira + dy * Math.min(1, I.cerca / 3); // tres segundos para darse vuelta del todo
    if (I.cerca > 3.2) revelar(g, 'mira');
  } else { I.cerca = Math.max(0, I.cerca - dt); m.targetYaw = I.mira; }
}
// clic derecho o golpe
export function impostorInteract(m, g) {
  if (!m.data.impostor) return false;
  decir(g, m, '…', 1.2);
  revelar(g, 'habla');
  return true;
}
export const limpiarImpostor = (g) => { if (g.impostor && !g.impostor.m.dead) g.impostor.m.dead = true; g.impostor = null; };
export function pruebaImpostor(g) {
  limpiarImpostor(g);
  g.time = Math.max(g.time || 0, 0.7);
  return aparecer(g) ? 'Alguien con ropa de vecino, quieto contra una pared por aquí cerca. Acérquese…' : 'No hubo pared cerca: pruebe en el pueblo';
}
