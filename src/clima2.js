// Clima extremo: rayos que caen cerca en las tormentas (queman árboles y le pueden pegar a uno a la intemperie)
// y la ceniza del volcán: después de una erupción cae ceniza en los alrededores y va cubriendo el suelo.
import { BLOCKS, BLOCK_BY_KEY as K, SOLID, AIR } from './blocks.js';
import { CHUNK } from './worldgen.js';

// ---------- rayos ----------
function columnaAlta(g, cx, cz, r) {
  // el punto más alto de unos cuantos al azar (los rayos buscan lo alto)
  const w = g.world;
  let best = null;
  for (let k = 0; k < 8; k++) {
    const x = Math.floor(cx + (Math.random() - 0.5) * 2 * r), z = Math.floor(cz + (Math.random() - 0.5) * 2 * r);
    if (!w.isLoaded(x, z)) continue;
    let y = 140;
    while (y > 1 && w.getBlock(x, y, z) === AIR) y--;
    if (!best || y > best.y) best = { x, y, z };
  }
  return best;
}
function rayo(g, x, y, z) {
  const w = g.world, P = g.particles;
  // el rayo: una línea zigzagueante de luz desde el cielo
  let rx = x + 0.5, rz = z + 0.5;
  for (let yy = y + 40; yy > y; yy -= 0.6) {
    rx += (Math.random() - 0.5) * 0.5; rz += (Math.random() - 0.5) * 0.5;
    P.spawn(rx, yy, rz, [0.85, 0.9, 1], 0, 0, 0, 0.35, 0, true);
  }
  P.burst(x + 0.5, y + 1, z + 0.5, [[1, 1, 0.8], [1, 0.7, 0.2], [0.4, 0.4, 0.42]], 30, 4);
  if (g.weather) g.weather.flash = 1;
  const pl = g.player.body.pos, d = Math.hypot(pl.x - x, pl.z - z);
  g.audio.thunder(Math.max(5, d));
  g.shake = Math.max(g.shake || 0, Math.max(0, 0.8 - d / 50));
  // quema: hojas alrededor se van, troncos quedan negros
  for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) for (let dy = -4; dy <= 1; dy++) {
    const X = x + dx, Y = y + dy, Z = z + dz, id = w.getBlock(X, Y, Z), b = BLOCKS[id];
    if (b.leafy && Math.random() < 0.7) w.setBlock(X, Y, Z, AIR);
    else if (/log$/.test(b.key) && Math.abs(dx) <= 1 && Math.abs(dz) <= 1) w.setBlock(X, Y, Z, K.tronco_quemado);
    else if ((b.key === 'grass' || b.key === 'tall_grass') && dy >= -1 && Math.random() < 0.4) w.setBlock(X, Y, Z, b.key === 'grass' ? K.dirt : AIR);
  }
  // criaturas cerca
  for (const m of g.entities.mobs) if (!m.dying && Math.hypot(m.body.pos.x - x, m.body.pos.z - z) < 2.5 && Math.abs(m.body.pos.y - y) < 4) { m.hurt(8, x, z); if (m.dying) g.killedMob && g.killedMob(m); }
  // el jugador: solo si está a la intemperie y muy cerca
  if (d < 3 && Math.abs(pl.y - y) < 4 && g.mode === 'survival') {
    let techo = false;
    for (let yy = Math.floor(pl.y) + 2; yy < Math.floor(pl.y) + 30; yy++) if (SOLID[w.getBlock(Math.floor(pl.x), yy, Math.floor(pl.z))]) { techo = true; break; }
    if (!techo) { g.damagePlayer(6, null, null, 'Le cayó un rayo', true); g.achieve('rayo', 'Le cayó un rayo (y vivió para contarlo)'); }
  }
  if (d < 25) g.achieve('rayo_cerca', 'Un rayo cayó cerquita');
}
// los pararrayos que hay cerca (se buscan en lo que uno ha construido: world.mods), revisados cada medio minuto
function pararrayosCerca(g, cx, cz, r) {
  const t = g.clock || 0;
  if (!g.pararrayosLista || t - g.pararrayosT > 30 || t < g.pararrayosT) {
    g.pararrayosT = t; g.pararrayosLista = [];
    // world.mods: por chunk «cx,cz», un Map de índice → bloque (índice = x + z·CHUNK + y·CHUNK²)
    for (const [k, m] of g.world.mods || []) {
      const [ccx, ccz] = k.split(',').map(Number);
      for (const [i, v] of m) if (v === K.pararrayos) g.pararrayosLista.push({ x: ccx * CHUNK + (i % CHUNK), y: Math.floor(i / (CHUNK * CHUNK)), z: ccz * CHUNK + (Math.floor(i / CHUNK) % CHUNK) });
    }
  }
  let best = null;
  for (const P of g.pararrayosLista) { if (Math.hypot(P.x - cx, P.z - cz) > r || g.world.getBlock(P.x, P.y, P.z) !== K.pararrayos) continue; if (!best || P.y > best.y) best = P; }
  return best;
}
export function tickRayos(g, dt) {
  const W = g.weather;
  if (g.dim !== 'tierra' || !W || W.type !== 'storm' || W.intensity < 0.6) return;
  g.rayoT = (g.rayoT ?? 15) - dt;
  if (g.rayoT > 0) return;
  g.rayoT = 18 + Math.random() * 40;
  const p = g.player.body.pos;
  const c = columnaAlta(g, p.x, p.z, 36);
  if (!c) return;
  // un pararrayos cerca y más alto que lo que iba a pegar se lo jala
  const P = pararrayosCerca(g, c.x, c.z, 28);
  if (P && P.y + 1 >= c.y - 4) {
    let rx = P.x + 0.5, rz = P.z + 0.5; // el rayo bajando derechito a la punta
    for (let yy = P.y + 40; yy > P.y + 1; yy -= 0.6) { rx += (Math.random() - 0.5) * 0.4; rz += (Math.random() - 0.5) * 0.4; const k = (yy - P.y) / 40; g.particles.spawn(P.x + 0.5 + (rx - P.x - 0.5) * k, yy, P.z + 0.5 + (rz - P.z - 0.5) * k, [0.85, 0.9, 1], 0, 0, 0, 0.35, 0, true); }
    g.particles.burst(P.x + 0.5, P.y + 1.2, P.z + 0.5, [[1, 1, 0.7], [0.7, 0.85, 1]], 30, 3);
    g.audio.thunder(Math.hypot(P.x - p.x, P.z - p.z));
    if (g.weather) g.weather.flash = 1;
    if (Math.hypot(P.x - p.x, P.z - p.z) < 40) { g.ui.toast('⚡ ¡El rayo cayó en el pararrayos! Ni la casa ni usted se enteraron', 2400); g.achieve('pararrayos', 'El pararrayos hizo su trabajo'); }
    return;
  }
  rayo(g, c.x, c.y, c.z);
}

// ---------- ceniza del volcán ----------
// la erupción la anuncia volcanes.js poniendo g.cenizaHasta; aquí cae y se va acumulando en el suelo
export function tickCeniza(g, dt) {
  if (!g.cenizaHasta || (g.clock || 0) > g.cenizaHasta || g.dim !== 'tierra') return;
  const p = g.player.body.pos, P = g.particles, w = g.world;
  // copos grises que caen despacio
  for (let k = 0; k < 6; k++) P.spawn(p.x + (Math.random() - 0.5) * 30, p.y + 10 + Math.random() * 6, p.z + (Math.random() - 0.5) * 30, [0.42, 0.4, 0.38], (Math.random() - 0.5) * 0.4, -1.2, (Math.random() - 0.5) * 0.4, 8, 0.05);
  if (g.ceniza) return; // la de la Noche de Ceniza es solo de ver: en una hora enterraría la casa
  // de vez en cuando una capita de ceniza sobre el suelo a la intemperie
  g.cenizaCapaT = (g.cenizaCapaT || 0) - dt;
  if (g.cenizaCapaT <= 0) {
    g.cenizaCapaT = 0.15;
    const x = Math.floor(p.x + (Math.random() - 0.5) * 28), z = Math.floor(p.z + (Math.random() - 0.5) * 28);
    if (!w.isLoaded(x, z)) return;
    let y = 140;
    while (y > 1 && w.getBlock(x, y, z) === AIR) y--;
    const b = BLOCKS[w.getBlock(x, y, z)];
    if (SOLID[b.id] && !b.leafy && b.render !== 'shape' && w.getBlock(x, y + 1, z) === AIR) w.setBlock(x, y + 1, z, 602); // la capita: K.ceniza es el bloque sólido, que se apilaba
  }
  if (!g.cenizaAviso) { g.cenizaAviso = true; g.ui.toast('🌋 Está cayendo ceniza del volcán: todo se pone gris (tápese la boca)', 3200); g.achieve('ceniza', 'Bajo la ceniza'); }
  // respirar ceniza da un poquito de tos (mareo) si uno anda sin casco
  if (!g.inventory.armor[0] && Math.random() < dt * 0.02) g.addEffect('mareo', 3);
}
