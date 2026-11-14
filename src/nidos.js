// Los nidos de Sombra: desde el día 5, cada tanto crece algo negro en el monte. Mientras viva, de ahí salen Sombras cuando uno
// se arrima, nacen más por la noche en esa zona y los asedios vienen más duros. Partirlo con el hacha da esencia de sombra (con
// la que se hace el aceite de filo y el farol de Zenaida) y, cada tres nidos, la comarca queda con una Sombra menos por noche.
// Es la manera de hacer algo contra las Sombras en vez de nada más aguantarlas.
import { BLOCKS, BLOCK_BY_KEY as K, AIR, SOLID, FLUID, ITEMS, itemName } from './blocks.js';
import { anotar } from './diario.js';
import { ventaja } from './progreso.js';
import { difOf } from './supervivencia.js';

export const ESENCIA = 499, ACEITE = 500, CANDELA = 501;
const TOPE = 3, CADA = 3, SEA = 62, GOLPES_ACEITE = 60, RADIO_FAROL = 30;
const hostil = (g) => g.mode === 'survival' && g.dim === 'tierra' && g.settings.hostiles && difOf(g).hostiles;

export const nidosVivos = (g) => ((g.meta && g.meta.nidos) || []).length;
// cada 3 nidos rotos, una Sombra menos por noche (hasta 2 menos)
export const calmaComarca = (g) => Math.min(2, Math.floor(((g.meta && g.meta.nidosRotos) || 0) / 3));
// cerca de un nido vivo nacen más
export function nidoCerca(g, x, z, r = 70) { return ((g.meta && g.meta.nidos) || []).some((q) => Math.hypot(q.x - x, q.z - z) < r); }
export function nidoMasCercano(g) {
  const L = (g.meta && g.meta.nidos) || [], p = g.player.body.pos;
  let mejor = null, d = 1e9;
  for (const q of L) { const e = Math.hypot(q.x - p.x, q.z - p.z); if (e < d) { d = e; mejor = q; } }
  return mejor;
}

function sitio(g) {
  const w = g.world, p = g.player.body.pos, H = g.meta.hist;
  for (let i = 0; i < 40; i++) {
    const a = Math.random() * Math.PI * 2, r = 38 + Math.random() * 24;
    const x = Math.floor(p.x + Math.cos(a) * r), z = Math.floor(p.z + Math.sin(a) * r);
    if (!w.isLoaded(x, z) || !w.isLoaded(x + 2, z + 2) || !w.isLoaded(x - 2, z - 2)) continue;
    let y = 120;
    while (y > SEA && !SOLID[w.getBlock(x, y, z)]) y--;
    if (y <= SEA || FLUID[w.getBlock(x, y, z)] || BLOCKS[w.getBlock(x, y, z)].leafy) continue;
    if (w.getBlock(x, y + 1, z) !== AIR || w.getBlock(x, y + 2, z) !== AIR || w.getBlock(x, y + 3, z) !== AIR) continue;
    if (H && H.casa && Math.hypot(H.casa.x - x, H.casa.z - z) < 56) continue;
    const v = g.nearestVillage(x, z);
    if (v && v.dist < 48) continue;
    return { x, y, z };
  }
  return null;
}
function crecer(g, { x, y, z }) {
  const w = g.world;
  w.setBlock(x, y + 1, z, K.nido_sombra);
  w.setBlock(x, y + 2, z, K.nido_sombra);
  for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1]]) {
    let ry = y + 2;
    while (ry > y - 3 && !SOLID[w.getBlock(x + dx, ry, z + dz)]) ry--;
    if (w.getBlock(x + dx, ry + 1, z + dz) === AIR && SOLID[w.getBlock(x + dx, ry, z + dz)]) w.setBlock(x + dx, ry + 1, z + dz, K.nido_raiz);
  }
  (g.meta.nidos ||= []).push({ x, y: y + 1, z, dia: g.day || 1 });
  g.meta.nidoDia = g.day || 1;
  g.audio.play('rumble', { ui: true, vol: 0.45 });
  g.ui.toast('🕸 Un nido de Sombra crece en el monte (🕸 en la brújula): peores noches', 5600);
  anotar(g, 'Creció un nido de Sombra en el monte.', '🕸');
}
function partido(g, q, i) {
  const w = g.world;
  g.meta.nidos.splice(i, 1);
  g.meta.nidosRotos = (g.meta.nidosRotos || 0) + 1;
  if (w.getBlock(q.x, q.y + 1, q.z) === K.nido_sombra) w.setBlock(q.x, q.y + 1, q.z, AIR);
  if (w.getBlock(q.x, q.y, q.z) === K.nido_sombra) w.setBlock(q.x, q.y, q.z, AIR);
  for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) for (let dy = -3; dy <= 2; dy++) if (w.getBlock(q.x + dx, q.y + dy, q.z + dz) === K.nido_raiz) w.setBlock(q.x + dx, q.y + dy, q.z + dz, AIR);
  for (const m of g.entities.mobs) if (m.data && m.data.nido === q && !m.dead) m.data.irse = 1;
  g.particles.burst(q.x + 0.5, q.y + 1, q.z + 0.5, [[0.05, 0.02, 0.1], [0.3, 0.12, 0.4], [0.55, 0.3, 0.7]], 40, 3.2);
  g.shake = Math.max(g.shake || 0, 0.5);
  g.audio.play('sombra', { ui: true, vol: 0.8 });
  const dia = g.day || 1, colones = ventaja.premio(g, 8 + dia), esencia = 2 + Math.floor(Math.random() * 2);
  g.giveItem(ESENCIA, esencia); g.giveItem(360, colones); g.addXP(15 + dia);
  const antes = Math.min(2, Math.floor((g.meta.nidosRotos - 1) / 3)), ahora = calmaComarca(g);
  g.ui.toast(`🕸 ¡Partió el nido! ${esencia} de esencia de sombra y ${colones} colones${ahora > antes ? ' · La comarca respira: una Sombra menos cada noche' : ''}`, 4200);
  g.achieve('nido', 'Partí un nido de Sombra');
  if (g.meta.nidosRotos >= 3) g.achieve('nido3', 'La comarca respira');
  if (g.meta.nidosRotos >= 10) g.achieve('nido10', 'Ni un nido en Tiquicia');
  anotar(g, 'Partí un nido de Sombra.', '🕸');
}
function guardias(g, q, d) {
  q.cd = (q.cd || 0) - 1;
  if (d > 16 || q.cd > 0) return;
  const w = g.world, vivos = g.entities.mobs.filter((m) => m.data && m.data.nido === q && !m.dead && !m.dying).length;
  if (vivos >= Math.min(4, 2 + Math.floor((g.day || 1) / 10))) return;
  const a = Math.random() * Math.PI * 2, r = 3 + Math.random() * 3, x = Math.floor(q.x + Math.cos(a) * r), z = Math.floor(q.z + Math.sin(a) * r);
  let y = q.y + 5;
  while (y > q.y - 6 && !SOLID[w.getBlock(x, y - 1, z)]) y--;
  const m = g.entities.spawnMob('sombra', x + 0.5, y + 0.2, z + 0.5);
  if (!m) return;
  m.data.nido = q; m.data.provoked = true;
  m.health += Math.min(14, Math.floor((g.day || 1) / 2));
  g.particles.burst(x + 0.5, y + 1, z + 0.5, [[0.05, 0.02, 0.1], [0.3, 0.12, 0.4]], 10, 1.6);
  q.cd = 12;
}
// cada segundo
export function tickNidos(g) {
  if (!hostil(g) || !g.meta) return;
  const w = g.world, p = g.player.body.pos, dia = g.day || 1, L = (g.meta.nidos ||= []);
  // crece uno cada tanto, de día (se ve venir y hay tiempo de ir). Nunca en plena pelea.
  if (dia >= 5 && dia - (g.meta.nidoDia || 2) >= CADA && L.length < TOPE && g.time > 0.05 && g.time < 0.4 && !g.asedio && !g.nocheLarga) {
    const s = sitio(g);
    if (s) crecer(g, s);
  }
  for (let i = L.length - 1; i >= 0; i--) {
    const q = L[i];
    if (!w.isLoaded(q.x, q.z)) continue;
    if (w.getBlock(q.x, q.y, q.z) !== K.nido_sombra) { partido(g, q, i); continue; }
    const d = Math.hypot(q.x - p.x, q.z - p.z);
    if (d < 48 && g.particles) g.particles.burst(q.x + 0.5, q.y + 2.2, q.z + 0.5, [[0.08, 0.03, 0.14], [0.25, 0.1, 0.35]], 3, 0.7);
    if (d < 26 && !q.visto) { q.visto = true; g.ui.toast('🕸 Un nido de Sombra. Pártalo con el hacha, y cuídese: lo cuidan', 3600); }
    guardias(g, q, d);
  }
  // los faroles de Zenaida que ya no están se olvidan
  const F = g.meta.faroles;
  if (F) for (let i = F.length - 1; i >= 0; i--) if (w.isLoaded(F[i].x, F[i].z) && w.getBlock(F[i].x, F[i].y, F[i].z) !== K.farol_zenaida) F.splice(i, 1);
}

// ---------- lo que se hace con la esencia ----------
export function registrarFarol(g, x, y, z) {
  (g.meta.faroles ||= []).push({ x, y, z });
  g.ui.toast(`🏮 Mientras esté encendido, las Sombras no nacen a ${RADIO_FAROL} bloques o menos`, 3400);
  g.achieve('farol_zenaida', 'El farol de Zenaida');
}
export function zonaFarol(g, x, z) { return ((g.meta && g.meta.faroles) || []).some((q) => Math.hypot(q.x - x, q.z - z) < RADIO_FAROL); }
// el aceite va al arma de mejor daño de la barra
export function untarFilo(g) {
  const inv = g.inventory;
  let mejor = null, dmg = 0;
  for (let i = 0; i < 9; i++) { const s = inv.slots[i], d = s && ITEMS[s.id]; if (d && d.damage && d.damage > dmg && d.durability) { dmg = d.damage; mejor = s; } }
  if (!mejor) { g.ui.toast('Primero necesita un arma en la barra', 2000); return false; }
  mejor.filo = GOLPES_ACEITE;
  g.audio.play('swish', { ui: true, vol: 0.5 });
  g.ui.toast(`🗡 ${itemName(mejor.id)}: un 30 % más de daño por ${GOLPES_ACEITE} golpes`, 2800);
  g.achieve('aceite', 'Filo de sombra');
  return true;
}
// lo llama el ataque: devuelve cuánto multiplica el golpe y va gastando el aceite
export function filoGolpe(g) {
  const s = g.inventory.held;
  if (!s || !s.filo || s.filo <= 0 || g.mode !== 'survival') return 1;
  s.filo--;
  if (!s.filo) { delete s.filo; g.ui.toast('🗡 Se le acabó el aceite al filo', 1800); }
  return 1.3;
}

// ---------- la candela de regreso: en 3 segundos lo lleva a donde durmió por última vez ----------
export function encenderCandela(g) {
  if (g.candela) return false;
  if (g.dim !== 'tierra') { g.ui.toast('🕯 Aquí no prende: solo sirve en la tierra', 2200); return false; }
  if (g.asedio || g.nocheLarga || g.apuro || g.ceniza || g.grieta) { g.ui.toast('🕯 En plena pelea no prende. Termine lo que empezó', 2400); return false; }
  if (g.riding) { g.ui.toast('🕯 Bájese primero', 1800); return false; }
  g.candela = { t: 3, vida: g.player.health };
  g.audio.play('swish', { ui: true, vol: 0.4 });
  g.ui.toast('🕯 La candela prendió… no se mueva de susto', 2000);
  return true;
}
// cada segundo
export function tickCandela(g) {
  const C = g.candela;
  if (!C) return;
  const P = g.player, p = P.body.pos;
  if (!P.alive || P.health < C.vida) { g.candela = null; g.ui.toast('🕯 Le pegaron y se apagó la candela', 2200); return; }
  g.particles.burst(p.x, p.y + 1, p.z, [[1, 0.85, 0.4], [0.9, 0.6, 0.2]], 14, 1.4);
  C.t -= 1;
  if (C.t > 0) return;
  g.candela = null;
  const s = g.meta.spawn;
  p.x = s.x; p.y = s.y; p.z = s.z;
  P.body.vel.x = P.body.vel.y = P.body.vel.z = 0;
  P.body.fallStart = null;
  g.ready = false; // que cargue el mundo antes de soltarlo, igual que al reaparecer
  g.audio.play('nivel', { ui: true, vol: 0.4 });
  g.ui.toast('🕯 De vuelta. Huele a cera y a casa', 2400);
  g.achieve('candela', 'De vuelta a la casa');
}
