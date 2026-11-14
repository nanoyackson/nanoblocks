// Hallazgos: caminando por el monte, cada tanto aparece adelante algo que otro dejó: un campamento abandonado, una carreta volcada o un
// círculo de piedras con raíces de Sombra. Cada uno trae un cofre. Así salir a caminar paga, aunque no haya una misión de por medio.
import { AIR, BLOCKS, BLOCK_BY_KEY as K, FLUID, SOLID } from './blocks.js';
import { anotar } from './diario.js';
import { difOf } from './supervivencia.js';
import { structuresNear, structRadius } from './estructuras.js';

const CADA = 420, COLON = 360;
const COMIDA = [263, 265, 270, 350, 261];
function botin(g, tipo) {
  const dia = g.day || 1, r = (a, b) => a + Math.floor(Math.random() * (b - a + 1)), L = [];
  L.push({ id: COMIDA[r(0, COMIDA.length - 1)], count: r(2, 4) });
  L.push({ id: COLON, count: r(3, 6) + Math.min(14, dia) });
  if (Math.random() < 0.6) L.push({ id: 440, count: r(1, 2) });
  if (Math.random() < 0.5) L.push({ id: K.torch, count: r(4, 8) });
  if (Math.random() < 0.35) L.push({ id: 258, count: r(1, 3) });
  if (tipo === 'carreta' && Math.random() < 0.5) L.push({ id: K.planks, count: r(6, 14) });
  if (tipo === 'altar') L.push({ id: 499, count: r(1, 2) });
  if (tipo === 'mina') { L.push({ id: 258, count: r(3, 6) }, { id: 257, count: r(4, 8) }); if (Math.random() < 0.6) L.push({ id: 259, count: r(1, 2) }); if (Math.random() < 0.3) L.push({ id: 499, count: 1 }); if (Math.random() < 0.08) L.push({ id: 260, count: 1 }); }
  if (Math.random() < 0.08) L.push({ id: 444, count: 1 });
  return L;
}
// solo sobre suelo que no haya puesto nadie, y sin pisar cultivos, antorchas ni nada que no sea monte
const NATURAL = new Set([K.grass, K.dirt, K.sand, K.snow_grass, K.stone, K.gravel].filter(Boolean));
const MONTE = /grass|flower|helecho|fern|vine|liana|hongo/;
function libre(w, x, y, z) {
  for (let dx = -3; dx <= 3; dx++) for (let dz = -3; dz <= 3; dz++) {
    const suelo = w.getBlock(x + dx, y, z + dz);
    if (BLOCKS[suelo].crop || BLOCKS[suelo].render === 'model') return false;
    for (let dy = 1; dy <= 3; dy++) {
      const q = w.getBlock(x + dx, y + dy, z + dz);
      if (q !== AIR && !BLOCKS[q].leafy && !MONTE.test(BLOCKS[q].key)) return false;
    }
  }
  return true;
}
function sitio(g) {
  const w = g.world, p = g.player.body.pos, d = g.player.lookDir(), base = Math.atan2(d.z, d.x), H = g.meta.hist;
  for (let i = 0; i < 40; i++) {
    const a = base + (Math.random() - 0.5) * 1.5, r = 34 + Math.random() * 24;
    const x = Math.floor(p.x + Math.cos(a) * r), z = Math.floor(p.z + Math.sin(a) * r);
    if (!w.isLoaded(x + 3, z + 3) || !w.isLoaded(x - 3, z - 3)) continue;
    // el suelo de verdad, por debajo de las copas y los troncos
    const alto = (ax, az) => { let y = 130; for (; y > 62; y--) { const q = w.getBlock(ax, y, az); if (FLUID[q]) break; if (SOLID[q] && !BLOCKS[q].leafy && !/log|tronco/.test(BLOCKS[q].key)) break; } return y; };
    const y = alto(x, z), id = w.getBlock(x, y, z);
    if (y <= 62 || FLUID[id] || BLOCKS[id].leafy || BLOCKS[id].key === 'asfalto' || SOLID[w.getBlock(x, y + 1, z)] || SOLID[w.getBlock(x, y + 2, z)]) continue;
    let parejo = true;
    for (const [dx, dz] of [[3, 0], [-3, 0], [0, 3], [0, -3]]) { const q = alto(x + dx, z + dz); if (Math.abs(q - y) > 2 || FLUID[w.getBlock(x + dx, q, z + dz)]) { parejo = false; break; } }
    if (!parejo) continue;
    if (!NATURAL.has(id) || !libre(w, x, y, z)) continue;
    if (H && H.casa && Math.hypot(H.casa.x - x, H.casa.z - z) < 50) continue;
    const M = g.meta;
    if ([M.corazon, M.carpa, M.spawn, M.lote, M.escondites && M.escondites.cofre].some((q) => q && Math.hypot(q.x - x, q.z - z) < 40)) continue;
    const v = g.nearestVillage(x, z);
    if (v && v.dist < 115) continue;
    if (structuresNear(w.gen, x, z, 40).some((q) => Math.hypot(q.x - x, q.z - z) < structRadius(w.gen, q.type) + 12)) continue;
    return { x, y: y + 1, z };
  }
  return null;
}
function cofre(g, x, y, z, tipo) {
  const w = g.world;
  w.setBlock(x, y, z, K.chest);
  g.stations.placed(K.chest, x, y, z, 0);
  const be = w.getBE(x, y, z);
  botin(g, tipo).forEach((s, i) => { be.slots[i] = s; });
  w.touchBE(x, y, z);
}
function poner(w, x, y, z, id) { if (w.getBlock(x, y, z) === AIR || !SOLID[w.getBlock(x, y, z)]) w.setBlock(x, y, z, id); }
const CONSTRUIR = {
  campamento(g, { x, y, z }) {
    const w = g.world;
    cofre(g, x, y, z, 'campamento');
    poner(w, x + 2, y, z + 1, K.fogata);
    // un toldo de lana sobre dos postes
    for (const dx of [-1, 1]) { poner(w, x + dx, y, z - 1, K.log); poner(w, x + dx, y + 1, z - 1, K.log); }
    for (let dx = -1; dx <= 1; dx++) for (const dz of [-1, 0]) poner(w, x + dx, y + 2, z + dz, K.wool);
    poner(w, x - 2, y, z + 1, K.log);
  },
  carreta(g, { x, y, z }) {
    const w = g.world;
    for (let dx = -1; dx <= 1; dx++) { poner(w, x + dx, y, z, K.planks); poner(w, x + dx, y, z + 1, K.planks); }
    poner(w, x - 1, y, z + 2, K.log); poner(w, x + 1, y, z - 1, K.log);
    cofre(g, x, y + 1, z, 'carreta');
    poner(w, x + 1, y + 1, z + 1, K.planks);
  },
  altar(g, { x, y, z }) {
    const w = g.world;
    cofre(g, x, y, z, 'altar');
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * 6.283, ax = Math.round(x + Math.cos(a) * 3), az = Math.round(z + Math.sin(a) * 3);
      if (i % 2) poner(w, ax, y, az, K.nido_raiz); else { poner(w, ax, y, az, K.cobble); if (i % 4 === 0) poner(w, ax, y + 1, az, K.cobble); }
    }
  },
};
// la boca de mina: un túnel en escalera que baja a una sala con dos cofres y puntales. Abajo esperan Sombras.
const PROFUNDO = 12;
function sePuedeMina(g, { x, y, z }, sx) {
  const w = g.world;
  if (y - PROFUNDO - 2 < 14) return false;
  for (let i = -5; i <= PROFUNDO + 6; i++) {
    if (!w.isLoaded(x + sx * i, z)) return false;
    for (let dz = -4; dz <= 4; dz++) for (let dy = -PROFUNDO - 2; dy <= 3; dy++) { const q = w.getBlock(x + sx * i, y + dy, z + dz); if (FLUID[q] || BLOCKS[q].render === 'model') return false; }
  }
  return true;
}
function construirMina(g, s, sx) {
  const w = g.world, { x, y, z } = s, cx = x + sx * (PROFUNDO + 3), suelo = y - PROFUNDO;
  // el marco de la entrada
  for (const dz of [-1, 1]) { w.setBlock(x, y, z + dz, K.log); w.setBlock(x, y + 1, z + dz, K.log); }
  for (let dz = -1; dz <= 1; dz++) w.setBlock(x, y + 2, z + dz, K.planks);
  // la escalera: bloque por bloque hacia abajo, con su piso y altura para pasar
  for (let i = 1; i <= PROFUNDO; i++) {
    const tx = x + sx * i, fy = y - i;
    for (let dz = -1; dz <= 1; dz++) {
      w.setBlock(tx, fy - 1, z + dz, K.cobble);
      for (let dy = 0; dy <= 3; dy++) w.setBlock(tx, fy + dy, z + dz, 0);
    }
    if (i % 4 === 0) w.setBlock(tx, fy, z + 1, K.torch);
  }
  // la sala
  for (let dx = -3; dx <= 3; dx++) for (let dz = -3; dz <= 3; dz++) {
    w.setBlock(cx + dx, suelo - 1, z + dz, K.planks);
    for (let dy = 0; dy <= 3; dy++) w.setBlock(cx + dx, suelo + dy, z + dz, 0);
    w.setBlock(cx + dx, suelo + 4, z + dz, K.cobble);
  }
  for (const [dx, dz] of [[-3, -3], [3, -3], [-3, 3], [3, 3]]) for (let dy = 0; dy <= 3; dy++) w.setBlock(cx + dx, suelo + dy, z + dz, K.puntal);
  w.setBlock(cx, suelo, z - 2, K.torch); w.setBlock(cx, suelo, z + 2, K.torch);
  cofre(g, cx + sx * 2, suelo, z - 2, 'mina');
  cofre(g, cx + sx * 2, suelo, z + 2, 'mina');
  return { x, y, z, sala: { x: cx, y: suelo, z } };
}
function sombrasDeMina(g, q) {
  if (!g.settings.hostiles || !difOf(g).hostiles) return;
  const dia = g.day || 1, S = q.sala;
  for (const [dx, dz] of [[-2, -2], [-2, 2], [1, 0]]) {
    const m = g.entities.spawnMob(dia >= 12 && dx === 1 ? 'sombra_grande' : 'sombra', S.x + dx + 0.5, S.y + 0.2, S.z + dz + 0.5);
    if (!m) continue;
    m.data.apuro = true; m.data.provoked = true;
    m.health += Math.min(14, Math.floor(dia / 2));
  }
  g.audio.play('sombra', { pos: { x: S.x, y: S.y + 1, z: S.z }, vol: 0.9 });
}
const NOMBRE = { mina: 'una boca de mina abandonada', campamento: 'un campamento abandonado', carreta: 'una carreta volcada', altar: 'un círculo de piedras con raíces de Sombra' };
function sombrasDelAltar(g, q) {
  if (!g.settings.hostiles || !difOf(g).hostiles) return;
  const w = g.world, dia = g.day || 1;
  for (let i = 0; i < 2; i++) {
    const a = Math.random() * 6.283, x = Math.floor(q.x + Math.cos(a) * 6), z = Math.floor(q.z + Math.sin(a) * 6);
    if (!w.isLoaded(x, z)) continue;
    let y = q.y + 6;
    while (y > q.y - 8 && !(SOLID[w.getBlock(x, y - 1, z)] && !SOLID[w.getBlock(x, y, z)])) y--;
    const m = g.entities.spawnMob('sombra', x + 0.5, y + 0.2, z + 0.5);
    if (!m) continue;
    m.data.apuro = true; m.data.provoked = true;
    m.health += Math.min(14, Math.floor(dia / 2));
    g.particles.burst(x + 0.5, y + 1, z + 0.5, [[0.05, 0.02, 0.1], [0.3, 0.12, 0.4]], 12, 1.8);
  }
  g.audio.play('sombra', { ui: true, vol: 0.5 });
}
// cada segundo
export function tickHallazgos(g) {
  if (g.mode !== 'survival' || g.dim !== 'tierra' || !g.meta) return;
  const M = g.meta, p = g.player.body.pos, U = g.hallazgoPos;
  g.hallazgoPos = { x: p.x, z: p.z };
  const q = M.hallazgo;
  if (q) {
    const d = Math.hypot(q.x - p.x, q.z - p.z);
    if (d < 22 && !q.visto) {
      q.visto = true;
      M.hallazgos = (M.hallazgos || 0) + 1;
      g.ui.toast(`🔎 Por ahí se ve ${NOMBRE[q.tipo]}`, 3000);
      g.achieve('hallazgo', 'Lo que otros dejaron');
      if (M.hallazgos >= 10) g.achieve('hallazgo10', 'Curioso de oficio');
      anotar(g, `Me topé con ${NOMBRE[q.tipo]}.`, '🔎');
    }
    if (q.tipo === 'altar' && d < 12 && !q.sombras) { q.sombras = true; sombrasDelAltar(g, q); }
    if (q.tipo === 'mina' && q.sala && !q.sombras && Math.hypot(q.sala.x - p.x, q.sala.z - p.z) < 9 && Math.abs(q.sala.y - p.y) < 5) { q.sombras = true; sombrasDeMina(g, q); }
    if (d > 180) M.hallazgo = null; // quedó atrás: que no estorbe al siguiente
    if (M.hallazgo) return;
  }
  // solo cuenta lo caminado de verdad, no los saltos de una candela o un viaje
  if (!U || g.riding) return;
  const paso = Math.hypot(p.x - U.x, p.z - U.z);
  if (paso > 20) return;
  M.andado = (M.andado || 0) + paso;
  if (M.andado < CADA || g.asedio || g.nocheLarga || g.apuro || g.ceniza || g.grieta) return;
  const s = sitio(g);
  if (!s) { M.andado = CADA - 40; return; }
  M.andado = 0;
  const r = Math.random(), dia = g.day || 1, sx = Math.random() < 0.5 ? 1 : -1;
  if ((M.forzarMina || (dia >= 4 && r > 0.8)) && sePuedeMina(g, s, sx)) {
    M.forzarMina = false;
    M.hallazgo = { ...construirMina(g, s, sx), tipo: 'mina' };
    return;
  }
  const tipo = dia >= 6 && r < 0.25 ? 'altar' : r < 0.6 ? 'carreta' : 'campamento';
  CONSTRUIR[tipo](g, s);
  M.hallazgo = { ...s, tipo };
}
