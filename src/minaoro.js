// La mina vieja de Abangares: una sola por partida, en Guanacaste o en la montaña. Una entrada con su marco, una escalera que baja y
// un túnel largo con rieles y una vagoneta que todavía corre. A los lados, galerías con vetas de oro; al fondo, la veta madre, un
// cofre y Don Eliseo, el minero que nunca salió (desde el 31). Si se le hace caso, va con uno en la vagoneta hasta la luz.
// Estado: meta.minaOro { x, y, z, sx, F, xs, L, charla, sigue, salio, vista }; g.vagon (el viaje en vagoneta; no se guarda).
import { armarVagoneta } from './modelos-cosas.js';
import { armarMinero } from './modelos-otros.js';
import { AIR, BLOCKS, FLUID, SOLID, BLOCK_BY_KEY as K } from './blocks.js';
import { regionAt } from './regiones.js';
import { CHUNK } from './worldgen.js';
import { decir } from './misiones.js';
import { anotar } from './diario.js';

export const LAMPARA = 532;
const BAJA = 12, LARGO = 40, COLON = 360; // compacta: tiene que caber entera en lo que está cargado
const set = (w, x, y, z, id) => w.setBlock(x, y, z, id, { updates: false });

function sePuede(g, x, y, z, sx, prueba = false) {
  const w = g.world, M = g.meta, H = M.hist;
  if (y - BAJA - 6 < 12) return false;
  if (!prueba) {
  // ni cerca de la casa, ni del punto de reaparecer, ni de un pueblo
  for (const c of [H && H.casa, M.spawn]) if (c && Math.hypot(c.x - x, c.z - z) < 90) return false;
  const v = g.nearestVillage && g.nearestVillage(x + sx * 30, z);
  if (v && v.dist < (v.v.R || 60) + 30) return false;
  }
  for (let i = -2; i <= BAJA + LARGO + 12; i += 2) {
    for (const dz of [-10, 0, 10]) {
      const X = x + sx * i, Z = z + dz;
      if (!w.isLoaded(X, Z)) return false;
      // nada que uno haya construido o tocado en esa huella
      const cx = Math.floor(X / CHUNK), cz = Math.floor(Z / CHUNK), mods = w.mods && w.mods.get(`${cx},${cz}`);
      if (mods && mods.size && !prueba) return false;
    }
    for (let dy = -BAJA - 6; dy <= 0; dy += 2) if (FLUID[w.getBlock(x + sx * i, y + dy, z)]) return false;
  }
  return true;
}
function cofreOro(g, x, y, z) {
  const w = g.world;
  w.setBlock(x, y, z, K.chest); g.stations.placed(K.chest, x, y, z, 0);
  const be = w.getBE(x, y, z);
  [{ id: 259, count: 8 }, { id: 260, count: 2 }, { id: COLON, count: 60 }, { id: 499, count: 2 }, { id: 258, count: 6 }].forEach((s, i) => { be.slots[i] = s; });
  be.viejo = true; w.touchBE(x, y, z);
}
function construir(g, x, y, z, sx) {
  const w = g.world, F = y - BAJA - 1, xs = x + sx * (BAJA + 1);
  // la entrada: marco de troncos y tablas
  for (const dz of [-2, 2]) for (let dy = 0; dy <= 3; dy++) set(w, x, y + dy, z + dz, K.log);
  for (let dz = -2; dz <= 2; dz++) set(w, x, y + 4, z + dz, K.planks);
  // la escalera
  for (let i = 1; i <= BAJA + 1; i++) {
    const tx = x + sx * i, fy = y - i;
    for (let dz = -1; dz <= 1; dz++) { set(w, tx, fy - 1, z + dz, K.cobble); for (let dy = 0; dy <= 3; dy++) set(w, tx, fy + dy, z + dz, AIR); }
    if (i % 5 === 0) set(w, tx, fy, z + 1, K.torch);
  }
  // el túnel con rieles, puntales y techo de tablas
  for (let i = 0; i <= LARGO; i++) {
    const tx = xs + sx * i;
    for (let dz = -1; dz <= 1; dz++) { set(w, tx, F - 1, z + dz, K.planks); for (let dy = 0; dy <= 3; dy++) set(w, tx, F + dy, z + dz, AIR); set(w, tx, F + 4, z + dz, K.cobble); }
    set(w, tx, F, z, K.rieles);
    if (i % 6 === 3) { for (const dz of [-1, 1]) for (let dy = 0; dy <= 2; dy++) set(w, tx, F + dy, z + dz, K.puntal); for (let dz = -1; dz <= 1; dz++) set(w, tx, F + 3, z + dz, K.planks); }
    else if (i % 8 === 0) set(w, tx, F, z - 1, K.torch);
  }
  // las galerías con vetas de oro
  for (const [i, s] of [[10, 1], [22, -1], [33, 1]]) {
    const tx = xs + sx * i;
    for (let k = 2; k <= 8; k++) for (let dy = 0; dy <= 2; dy++) set(w, tx, F + dy, z + s * k, AIR);
    for (let k = 3; k <= 9; k++) for (const dy of [-1, 3]) if (Math.random() < 0.35) set(w, tx + (Math.random() < 0.5 ? 1 : -1), F + dy + (dy < 0 ? 0 : 0), z + s * k, Math.random() < 0.4 ? 57 : 15);
    for (let dy = 0; dy <= 2; dy++) set(w, tx, F + dy, z + s * 9, 15); // al fondo, la veta
    set(w, tx, F, z + s * 2, K.torch);
  }
  // la veta madre: la sala del fondo
  const cx = xs + sx * (LARGO + 5);
  for (let dx = -4; dx <= 4; dx++) for (let dz = -4; dz <= 4; dz++) {
    set(w, cx + dx, F - 1, z + dz, K.cobble);
    for (let dy = 0; dy <= 4; dy++) set(w, cx + dx, F + dy, z + dz, AIR);
    set(w, cx + dx, F + 5, z + dz, K.cobble);
  }
  for (let dz = -4; dz <= 4; dz++) for (let dy = 0; dy <= 4; dy++) if (Math.random() < 0.55) set(w, cx + sx * 5, F + dy, z + dz, Math.random() < 0.3 ? 57 : 15);
  for (const [dx, dz] of [[-4, -4], [4, -4], [-4, 4], [4, 4]]) for (let dy = 0; dy <= 4; dy++) set(w, cx + dx, F + dy, z + dz, K.puntal);
  set(w, cx - sx * 2, F, z - 3, K.torch); set(w, cx - sx * 2, F, z + 3, K.torch);
  cofreOro(g, cx + sx * 3, F, z + 3);
  // la vagoneta, al principio de los rieles, y Don Eliseo al fondo
  const v = g.entities.spawnMob('vagoneta', xs + 0.5, F + 0.1, z + 0.5);
  const e = g.entities.spawnMob('minero_fantasma', cx + 0.5, F + 0.1, z - 2 + 0.5);
  if (e) e.data.apuro = true;
  return { x, y, z, sx, F, xs, L: LARGO, charla: 0, sigue: false, salio: false, vista: false, vx: v ? 1 : 0 };
}
// vuelven a aparecer si se perdieron (los mobs no se guardan)
function asegurarMobs(g, M) {
  const p = g.player.body.pos, cerca = Math.hypot(p.x - (M.xs + M.sx * M.L / 2), p.z - M.z) < 70;
  if (!cerca) return;
  if (!g.entities.mobs.some((m) => m.type === 'vagoneta' && !m.dead) && g.world.isLoaded(M.xs, M.z)) g.entities.spawnMob('vagoneta', M.xs + 0.5, M.F + 0.1, M.z + 0.5);
  if (!M.salio && !g.entities.mobs.some((m) => m.type === 'minero_fantasma' && !m.dead) && g.world.isLoaded(M.xs + M.sx * (M.L + 5), M.z)) { const e = g.entities.spawnMob('minero_fantasma', M.xs + M.sx * (M.L + 5) + 0.5, M.F + 0.1, M.z - 1.5); if (e) e.data.apuro = true; }
}
// cada segundo
export function tickMinaOro(g) {
  if (g.dim !== 'tierra' || !g.meta) return;
  const M = g.meta.minaOro, p = g.player.body.pos;
  if (M && M.pendiente) { const q = M.pendiente; if (sePuede(g, q.x, q.y, q.z, q.sx, true)) g.meta.minaOro = construir(g, q.x, q.y, q.z, q.sx); return; }
  if (M) {
    if (!M.vista && Math.hypot(p.x - M.x, p.z - M.z) < 24) { M.vista = true; g.ui.toast('⛏ Rieles viejos salen del monte: la mina de oro de Abangares, cerrada desde el 31', 4200); g.achieve('mina_oro', 'La mina vieja de Abangares'); anotar(g, 'Di con la mina vieja de Abangares.', '⛏'); }
    asegurarMobs(g, M);
    return;
  }
  if (g.mode !== 'survival' || (g.day || 1) < 5 || Math.random() > 1 / 240) return;
  const reg = regionAt(g.world.gen, p.x, p.z), bio = g.env && g.env.biome;
  if (reg !== 'guanacaste' && bio !== 'mountains') return;
  const d = g.player.lookDir(), sx = d.x >= 0 ? 1 : -1, x = Math.floor(p.x + sx * 8), z = Math.floor(p.z);
  let y = 130; while (y > 62 && !(SOLID[g.world.getBlock(x, y, z)] && !BLOCKS[g.world.getBlock(x, y, z)].leafy)) y--;
  y++;
  if (!sePuede(g, x, y, z, sx)) return;
  g.meta.minaOro = construir(g, x, y, z, sx);
}
export function marcaMinaOro(g) { const M = g.meta && g.meta.minaOro; return M && !M.salio && !M.pendiente && g.dim === 'tierra' ? { x: M.x, z: M.z } : null; }

// ---------- el viaje en vagoneta ----------
function subir(g, m) {
  const M = g.meta.minaOro;
  if (!M || g.vagon || g.riding || g.monta || !g.player.alive) return false;
  const s = (m.body.pos.x - (M.xs + 0.5)) * M.sx;
  const dir = s < M.L / 2 ? 1 : -1;
  let fantasma = null;
  if (dir < 0 && M.sigue && !M.salio) fantasma = g.entities.mobs.find((o) => o.type === 'minero_fantasma' && !o.dead && Math.hypot(o.body.pos.x - m.body.pos.x, o.body.pos.z - m.body.pos.z) < 14) || null;
  g.vagon = { m, s: Math.max(0, Math.min(M.L, s)), dir, vel: 0, derrumbe: false, fantasma };
  g.audio.play('chest.open', { pos: m.soundPos(), vol: 0.7, pitch: 0.6 });
  g.ui.toast(dir > 0 ? '🛤 ¡Agárrese! La vagoneta arranca túnel adentro' : fantasma ? '🛤 Don Eliseo se monta detrás de usted. «Vámonos, que ya es hora»' : '🛤 De vuelta a la salida', 2600);
  return true;
}
export function vagonUpdate(g, dt) {
  const V = g.vagon, M = g.meta.minaOro;
  if (!V || !M) { g.vagon = null; return; }
  const m = V.m, P = g.player, b = P.body;
  if (m.dead || !P.alive) { g.vagon = null; return; }
  const fin = V.dir > 0 ? M.L : 0, falta = Math.abs(fin - V.s);
  V.vel = Math.min(falta < 6 ? Math.max(1.5, falta * 1.4) : 10, V.vel + dt * 5);
  V.s += V.dir * V.vel * dt;
  const x = M.xs + 0.5 + M.sx * V.s, z = M.z + 0.5, y = M.F + 0.1 + Math.abs(Math.sin(V.s * 2.1)) * 0.04;
  m.body.pos.x = x; m.body.pos.y = y; m.body.pos.z = z; m.body.vel.x = m.body.vel.y = m.body.vel.z = 0;
  m.yaw = m.targetYaw = M.sx * V.dir > 0 ? Math.PI / 2 : -Math.PI / 2;
  b.pos.x = x; b.pos.z = z; b.pos.y = y + 0.45; b.vel.x = b.vel.y = b.vel.z = 0; b.fallStart = null;
  if (V.fantasma && !V.fantasma.dead) { const f = V.fantasma.body.pos; f.x = x - M.sx * V.dir * 0.7; f.z = z; f.y = y + 0.4; V.fantasma.body.vel.y = 0; }
  // chispas de las ruedas y el traqueteo
  if (Math.random() < dt * V.vel * 2) g.particles.spawn(x + (Math.random() - 0.5) * 0.6, y + 0.05, z + (Math.random() < 0.5 ? -0.35 : 0.35), [1, 0.8, 0.3], -M.sx * V.dir * 2, 1, 0, 0.3, 8, true);
  V.ruido = (V.ruido || 0) - dt;
  if (V.ruido <= 0) { V.ruido = 0.35; g.audio.play('step.stone', { pos: { x, y, z }, vol: 0.5 + V.vel * 0.04, pitch: 0.6 + V.vel * 0.05 }); }
  g.shake = Math.max(g.shake || 0, V.vel * 0.012);
  // a media ida, se viene el techo detrás
  if (V.dir > 0 && !V.derrumbe && V.s > M.L * 0.55) {
    V.derrumbe = true; V.vel = 14;
    g.audio.play('derrumbe', { ui: true, vol: 1 });
    g.shake = 1;
    for (let k = 0; k < 4; k++) g.particles.burst(x - M.sx * (3 + k), M.F + 3, z, [[0.45, 0.42, 0.4], [0.6, 0.58, 0.55]], 16, 2);
    g.ui.toast('🪨 ¡Se vino el techo detrás! ¡Arre, vagoneta, arre!', 2600);
    g.achieve('vagoneta_derrumbe', 'Le gané al derrumbe en vagoneta');
  }
  if (falta < 0.15) bajar(g);
}
function bajar(g) {
  const V = g.vagon, M = g.meta.minaOro;
  g.vagon = null;
  const b = g.player.body;
  b.pos.z = M.z + 0.5 + 1; b.pos.y = M.F + 0.1; g.sinCaida = (g.clock || 0) + 2;
  g.achieve('vagoneta', 'Viaje en vagoneta');
  if (V.fantasma && !V.fantasma.dead && V.dir < 0) salirALaLuz(g, V.fantasma);
}
function salirALaLuz(g, e) {
  const M = g.meta.minaOro;
  M.salio = true;
  decir(g, e, 'Ya se ve la luz de arriba… Gracias. Dígale a mi gente que ya salí.', 4.5);
  e.data.sube = 4.5;
  g.giveItem(LAMPARA, 1); g.giveItem(COLON, 50);
  g.audio.play('campana', { ui: true, vol: 0.5, pitch: 1.2 });
  g.ui.toast('⛏ Don Eliseo sube despacito hacia la luz. Le deja su lámpara de carburo y ₡50', 5600);
  g.achieve('minero_salio', 'Don Eliseo salió de la mina');
  anotar(g, 'Saqué a Don Eliseo de la mina en la vagoneta. Se fue hacia la luz.', '⛏');
}
export const limpiarVagon = (g) => { g.vagon = null; };

// ---------- los modelos ----------
const LINEAS = [
  '¡Ay, alguien! Hace tanto que no oía pasos… Soy Eliseo, de Las Juntas.',
  'El 31 se vino el techo y aquí me quedé, esperando la vagoneta de la salida. Nunca llegó.',
  'Las vetas de las galerías son suyas, llévese lo que quiera. A mí el oro ya no me sirve de nada.',
  '¿Me hace un favor? Lléveme en la vagoneta hasta la salida. Solo no me atrevo.',
];
export const MINA_ORO = {
  vagoneta: {
    name: 'Vagoneta de la mina', w: 1, h: 0.9, health: 999, speed: 0, noJump: true, hurtSound: null, idleSound: null, idleEvery: [999, 999],
    particle: [[0.4, 0.38, 0.36]], drops: [], xp: 0,
    build() { return armarVagoneta(); },
    brain(m, dt, c) { m.moving = false; m.data.apuro = true; if (c.g.vagon && c.g.vagon.m === m) return true; return true; },
    onHurt() { return false; },
    interact(m, g) { return subir(g, m); },
    animate(m, dt, u) { const V = m.game.vagon; if (V && V.m === m) u.ruedas.forEach((r) => { r.rotation.x += dt * V.vel * 4 * V.dir; }); },
  },
  minero_fantasma: {
    name: 'Don Eliseo, el minero', w: 0.6, h: 1.8, health: 999, speed: 0.8, noJump: true, hurtSound: 'susurro', idleSound: 'susurro', idleEvery: [9, 16],
    particle: [[0.7, 0.85, 1]], drops: [], xp: 0,
    build() { return armarMinero(); },
    brain(m, dt, c) {
      const { g, dxp, dzp, distP } = c;
      m.data.apuro = true;
      if (m.data.sube > 0) { m.data.sube -= dt; m.noGravity = true; m.body.vel.y = 1.2; m.body.vel.x = m.body.vel.z = 0; if (m.data.sube <= 0) { g.particles.burst(m.body.pos.x, m.body.pos.y + 1, m.body.pos.z, m.kind.particle, 20, 1.5); m.dead = true; } return true; }
      if (g.vagon && g.vagon.fantasma === m) { m.moving = false; return true; }
      if (distP < 6) m.targetYaw = Math.atan2(dxp, dzp);
      m.moving = false;
      return true;
    },
    onHurt(m, g) { decir(g, m, 'Diay… ¿para qué me pega? Si ya estoy muerto.', 2.6); return false; },
    interact(m, g) {
      const M = g.meta.minaOro;
      if (!M) return false;
      if (M.charla < LINEAS.length) { decir(g, m, LINEAS[M.charla], 4.2); M.charla++; if (M.charla === LINEAS.length) { M.sigue = true; g.ui.toast('⛏ Don Eliseo quiere salir: móntese en la vagoneta aquí al fondo y él se sube detrás', 4200); } }
      else decir(g, m, 'Cuando usted diga, nos vamos en la vagoneta.', 3);
      return true;
    },
    animate(m, dt, u) {
      u.brazos[0].rotation.x = Math.sin(m.t * 1.2) * 0.1;
      u.body.rotation.z = Math.sin(m.t * 0.9) * 0.04;
      if (Math.random() < dt * 4) { const b = m.body.pos; m.game.particles.spawn(b.x + (Math.random() - 0.5) * 0.5, b.y + 0.2, b.z + (Math.random() - 0.5) * 0.5, [0.7, 0.85, 1], 0, 0.3, 0, 1, -0.3); }
    },
  },
};
export function pruebaMinaOro(g) {
  const p = g.player.body.pos, d = g.player.lookDir(), sx = d.x >= 0 ? 1 : -1, x = Math.floor(p.x + sx * 6), z = Math.floor(p.z);
  let y = Math.floor(p.y) + 10; while (y > 2 && !SOLID[g.world.getBlock(x, y - 1, z)]) y--;
  if (sePuede(g, x, y, z, sx, true)) g.meta.minaOro = construir(g, x, y, z, sx);
  else { g.meta.minaOro = { pendiente: { x, y, z, sx } }; return 'La mina se arma apenas cargue todo el terreno de adelante (o aquí no cabe: pruebe en otro lado)'; }
  return `La mina vieja de Abangares, a 6 bloques (hacia ${sx > 0 ? 'el este' : 'el oeste'}): baje la escalera y móntese en la vagoneta`;
}
