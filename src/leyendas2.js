// Más leyendas ticas: la Bruja Zárate (de noche, cerca de los pueblos; si uno le lleva un café le da una pócima,
// si la atacan se vuelve lora y le deja un hechizo) y la Mano Peluda (a veces, mientras uno duerme, sale de debajo
// de la cama y se lleva algo… que al despertar aparece tirado por ahí).
import { armarZarate } from './modelos-otros.js';
import { SOLID, AIR, ITEMS } from './blocks.js';
import { hearts } from './fauna.js';
import { decir } from './misiones.js';
import { difOf } from './supervivencia.js';

const CAFES = [298, 421, 295];
const POCIMAS = [
  ['suerte', 300, '🍀 una pócima de la suerte (5 minutos)'], ['energia', 300, '⚡ una pócima de energía (5 minutos)'],
  ['pluma', 180, '🪶 una pócima de pluma: cae despacito (3 minutos)'], ['ignifugo', 240, '🔥 una pócima contra el fuego (4 minutos)'],
  ['buceo', 300, '🫧 una pócima para respirar bajo el agua (5 minutos)'], ['calma', 300, '😌 una pócima de calma (5 minutos)'],
];
const HECHIZOS = [
  ['mareo', 20, '🌀 «¡Que todo le dé vueltas!»'], ['cansado', 60, '🥱 «¡Que le dé sueño todo el día!»'], ['miedo', 30, '😱 «¡Que le dé miedo hasta su sombra!»'],
];

export const BRUJA_ZARATE = {
  name: 'La Bruja Zárate', w: 0.6, h: 1.7, health: 40, speed: 1.1, legend: true, xp: 30,
  hurtSound: 'susurro', idleSound: 'susurro', idleEvery: [10, 20], particle: [[0.5, 0.2, 0.7], [0.3, 1, 0.5]], drops: [],
  build() { return armarZarate(0x4a2460); },
  brain(m, dt, c) {
    const { g, distP, dxp, dzp } = c;
    const d = m.data;
    if (g.daylight > 0.45) { desaparecer(m, g, null); return true; }
    if (distP < 12 && !d.vista) { d.vista = true; g.achieve('zarate', 'Vi a la Bruja Zárate'); decir(g, m, '¿Qué anda haciendo a estas horas, mi cielo? ¿No me traerá un cafecito?', 4.5); }
    d.charla = (d.charla ?? 12) - dt;
    if (distP < 8 && d.charla <= 0) { d.charla = 14 + Math.random() * 10; decir(g, m, ['Un cafecito y le doy algo bueno…', 'En Escazú todas mis vecinas son brujas. Bueno, casi todas.', 'No me vaya a pegar, que me vuelvo lora.', 'Las Sombras me tienen miedo a mí, ¿sabía?'][Math.floor(Math.random() * 4)], 4); }
    if (distP < 3) { m.moving = false; m.targetYaw = Math.atan2(dxp, dzp); } else if (distP < 14) m.goTo(g.player.body.pos.x, g.player.body.pos.z, 0.8);
    else return false;
    return true;
  },
  animate(m, dt, u) {
    u.lora.rotation.y = Math.sin(m.t * 2) * 0.5;
    if (Math.random() < dt * 4) { const b = m.body.pos; m.game.particles.spawn(b.x + (Math.random() - 0.5) * 0.8, b.y + Math.random() * 1.6, b.z + (Math.random() - 0.5) * 0.8, [0.4 + Math.random() * 0.3, 1, 0.5], 0, 0.4, 0, 1, 0, true); }
  },
  interact(m, g) {
    const held = g.inventory.held;
    if (held && CAFES.includes(held.id)) {
      g.inventory.consumeHeld(1);
      const [ef, s, txt] = POCIMAS[Math.floor(Math.random() * POCIMAS.length)];
      g.addEffect(ef, s);
      hearts(g, m.body.pos, 10, [0.5, 1, 0.5]);
      decir(g, m, '¡Ay, qué rico este café! Tenga, por buena gente.', 4);
      g.ui.toast(`🧙 La Bruja Zárate le dio ${txt}`, 3200);
      g.achieve('zarate_cafe', 'Café para la bruja');
      return true;
    }
    decir(g, m, 'Sin cafecito no hay pócima, mi cielo. Así es el negocio.', 3.5);
    return true;
  },
  onHurt(m, g) {
    // se vuelve lora, le deja un hechizo y se va volando
    const [ef, s, txt] = HECHIZOS[Math.floor(Math.random() * HECHIZOS.length)];
    g.addEffect(ef, s);
    g.ui.toast(`🦜 ¡La Bruja Zárate se volvió lora y se fue volando! Antes le gritó: ${txt}`, 3600);
    g.achieve('zarate_lora', 'Hechizado por la bruja');
    desaparecer(m, g, null, true);
    return false;
  },
};
function desaparecer(m, g, msg, lora = false) {
  const p = m.body.pos;
  g.particles.burst(p.x, p.y + 1, p.z, lora ? [[0.2, 0.7, 0.3], [0.9, 0.8, 0.2], [0.8, 0.2, 0.2]] : [[0.4, 0.2, 0.6], [0.3, 1, 0.5]], 40, 3);
  if (lora) for (let k = 0; k < 20; k++) g.particles.spawn(p.x, p.y + 1.5 + k * 0.4, p.z, [0.2, 0.75, 0.3], k * 0.3, 2, k * 0.2, 1.5, 0, false);
  g.audio.play('susurro', { pos: m.soundPos(), vol: 0.6 });
  if (msg) g.ui.toast(msg, 2000);
  m.dead = true;
}

export function zarateSpawn(E, g) {
  if (g.mode !== 'survival' || !g.settings.hostiles || !difOf(g).hostiles || g.daylight > 0.25 || g.dim !== 'tierra' || (g.day || 1) < 3) return false;
  g.zarateCd = (g.zarateCd ?? 200) - 2;
  if (g.zarateCd > 0 || E.mobs.some((m) => m.type === 'bruja_zarate' && !m.dead)) return false;
  const p = g.player.body.pos, v = g.nearestVillage(p.x, p.z);
  if (!v || v.dist > 70 || Math.random() > 0.3) { g.zarateCd = 30; return false; }
  const w = g.world;
  for (let t = 0; t < 10; t++) {
    const a = Math.random() * Math.PI * 2, r = 12 + Math.random() * 8;
    const x = Math.floor(p.x + Math.cos(a) * r), z = Math.floor(p.z + Math.sin(a) * r);
    if (!w.isLoaded(x, z)) continue;
    let y = Math.floor(p.y) + 8;
    while (y > 1 && !SOLID[w.getBlock(x, y - 1, z)]) y--;
    if (w.getBlock(x, y, z) !== AIR || w.getBlock(x, y + 1, z) !== AIR) continue;
    E.spawnMob('bruja_zarate', x + 0.5, y + 0.1, z + 0.5);
    g.zarateCd = 600 + Math.random() * 500;
    return true;
  }
  return false;
}

// ---------- la Mano Peluda: al despertar después de dormir la noche ----------
export function manoPeluda(g, cama, forzar = false) {
  if (g.mode !== 'survival' || (g.day || 1) < 3 || !cama || (!forzar && Math.random() > 0.12)) return;
  const inv = g.inventory.slots;
  const opciones = [];
  for (let i = 9; i < inv.length; i++) if (inv[i]) opciones.push(i);
  if (!opciones.length) return;
  const i = opciones[Math.floor(Math.random() * opciones.length)];
  const s = inv[i];
  const n = Math.min(s.count, 1 + Math.floor(Math.random() * 3));
  const nombre = (ITEMS[s.id] && ITEMS[s.id].name) || 'algo';
  g.inventory.remove(s.id, n);
  // lo deja tirado cerquita de la cama (la Mano Peluda es traviesa, no ladrona)
  const b = cama;
  const a = Math.random() * Math.PI * 2;
  g.entities.dropItem(s.id, n, b.x + 0.5 + Math.cos(a) * 3, b.y + 1, b.z + 0.5 + Math.sin(a) * 3);
  g.ui.toast(`✋ En la noche sintió algo peludo debajo de la cama… ¡la Mano Peluda se llevó ${nombre} ×${n}! (lo dejó tirado por ahí cerca)`, 4600);
  g.achieve('mano_peluda', 'La Mano Peluda');
}
