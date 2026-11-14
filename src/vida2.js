// Mundo vivo 2: el temporal del Caribe (días de lluvia y ríos crecidos), sorpresas en la carretera (vaca en media
// calle, presa por un choque, bloqueo ficticio), las tiendas que cierran de noche y la misa del domingo.
import { BLOCK_BY_KEY as K } from './blocks.js';
import { regionAt } from './regiones.js';
import { decir } from './misiones.js';

// ---------- horario: casi todo cierra de noche ----------
const ABIERTO_DE_NOCHE = new Set(['cantinero', 'recepcionista', 'pistero', 'lotero', 'doctora', 'policia', 'bombero', 'farero']);
export function cerrado(g, role) {
  return g.daylight < 0.25 && !ABIERTO_DE_NOCHE.has(role);
}
export const CERRADO = ['Ya cerramos, mi amor. Abrimos a las 7 de la mañana.', 'Cerrado… vuelva mañana tempranito.', '¡Uy, ya es tarde! Mañana con gusto le atiendo.'];

// ---------- temporal del Caribe ----------
function tickTemporal(g) {
  const M = g.meta, d = g.day || 1, p = g.player.body.pos;
  if (!M.temporal && d >= 4 && (M.temporalCd ?? 6) <= d && Math.random() < 0.002) {
    M.temporal = { hasta: d + 2 };
    M.temporalCd = d + 9 + Math.floor(Math.random() * 6);
  }
  if (M.temporal && d > M.temporal.hasta) { M.temporal = null; if (g.dim === 'tierra') g.ui.toast('☀ Pasó el temporal. Los ríos van bajando.', 2600); }
  if (!M.temporal || g.dim !== 'tierra') return;
  const caribe = ['caribe', 'norte'].includes(regionAt(g.world.gen, p.x, p.z));
  if (!caribe) return;
  if (!g.temporalAviso) { g.temporalAviso = true; g.ui.toast('🌧 ¡Temporal en el Caribe! Lluvia por días y los ríos crecidos: cuidado con la corriente', 3600); g.achieve('temporal', 'Sobreviví al temporal'); }
  if (g.weather && g.weather.type === 'clear') { g.weather.set(Math.random() < 0.3 ? 'storm' : 'rain'); g.weather.timer = 600; }
  // ríos crecidos: la corriente arrastra (en agua dulce, no en el mar)
  const b = g.player.body;
  if (b.inWater && regionAt(g.world.gen, p.x, p.z) !== 'mar') {
    const dir = M.temporal.dir || (M.temporal.dir = Math.random() * Math.PI * 2);
    b.vel.x += Math.cos(dir) * 1.6; b.vel.z += Math.sin(dir) * 1.6;
    if (!g.corrienteAviso) { g.corrienteAviso = true; g.ui.toast('🌊 ¡La corriente lo arrastra! Salga del río', 2000); }
  }
}

// ---------- sorpresas en la carretera ----------
const CALLE = () => new Set([K.asfalto, K.asfalto_linea, K.asfalto_parche, K.asfalto_roto].filter(Boolean));
const PANCARTAS = ['¡Arreglen los huecos!', '¡Queremos el puente que nos prometieron!', '¡Ni un hueco más!', '¡Que vuelva el bus de las 6!', '¡Agua para el barrio!'];
function sitioCalle(g) {
  const w = g.world, p = g.player.body.pos, d = g.player.lookDir();
  const calle = CALLE();
  for (let r = 16; r < 30; r += 2) {
    const x = Math.floor(p.x + d.x * r), z = Math.floor(p.z + d.z * r);
    for (let y = Math.floor(p.y) + 4; y > p.y - 6; y--) {
      if (calle.has(w.getBlock(x, y, z)) && w.getBlock(x, y + 1, z) === 0) return { x, y: y + 1, z, d };
    }
  }
  return null;
}
function tickCarretera(g) {
  const p = g.player.body.pos, w = g.world;
  // limpiar lo de eventos viejos
  for (const m of g.entities.mobs) if (m.data && m.data.evento && (m.data.evento -= 1) <= 0) { g.particles.burst(m.body.pos.x, m.body.pos.y + 1, m.body.pos.z, [[0.85, 0.85, 0.85]], 8, 1.2); m.dead = true; }
  if (g.dim !== 'tierra' || g.mode !== 'survival') return;
  if (!CALLE().has(w.getBlock(Math.floor(p.x), Math.floor(p.y - 0.5), Math.floor(p.z)))) return;
  g.calleCd = (g.calleCd ?? 90) - 1;
  if (g.calleCd > 0) return;
  const s = sitioCalle(g);
  if (!s) { g.calleCd = 15; return; }
  g.calleCd = 300 + Math.random() * 300;
  const r = Math.random();
  const lado = { x: -s.d.z, z: s.d.x };
  if (r < 0.35) {
    const m = g.entities.spawnMob('vaca', s.x + 0.5, s.y + 0.1, s.z + 0.5);
    m.frozen = true; m.data.evento = 45; m.yaw = m.targetYaw = Math.random() * 6;
    g.ui.toast('🐄 ¡Una vaca en media calle! Aquí manda ella.', 2600);
    g.achieve('vaca_calle', 'Ganado en la calle');
  } else if (r < 0.7) {
    for (let k = 0; k < 4; k++) {
      const m = g.entities.spawnMob('carro', s.x + 0.5 + s.d.x * k * 3.2, s.y + 0.1, s.z + 0.5 + s.d.z * k * 3.2);
      m.frozen = true; m.data.evento = 60; m.yaw = m.targetYaw = Math.atan2(s.d.x, s.d.z);
    }
    g.audio.play('hueco', { pos: { x: s.x, y: s.y, z: s.z }, vol: 0.6 });
    g.ui.toast('🚗 ¡Presa! Hubo un choque adelante… y todo el mundo frenó a ver.', 2800);
    g.achieve('presa', 'Atrapado en la presa');
  } else {
    for (let k = -2; k <= 2; k++) {
      const x = s.x + 0.5 + lado.x * k * 1.3, z = s.z + 0.5 + lado.z * k * 1.3;
      const m = g.entities.spawnMob('vecino', x, s.y + 0.1, z);
      m.data = { vid: `bloqueo:${g.clock}:${k}`, name: 'Manifestante', role: 'vecino', seed: Math.floor(Math.random() * 1e6) + 1, home: { x, y: s.y, z }, plaza: { x, y: s.y, z }, evento: 60 };
      m.kind.dress(m);
      m.frozen = true; m.yaw = m.targetYaw = Math.atan2(-s.d.x, -s.d.z);
      setTimeout(() => { if (!m.dead) decir(g, m, PANCARTAS[(k + 2) % PANCARTAS.length], 8); }, 600 + (k + 2) * 500);
    }
    g.ui.toast('🪧 Bloqueo (ficticio): el barrio pide arreglar los huecos. Pase por el ladito', 3400);
    g.achieve('bloqueo', 'Pasé por el bloqueo');
  }
}

// ---------- misa del domingo ----------
function tickMisa(g) {
  const d = g.day || 1;
  if (d % 7 !== 0 || g.dim !== 'tierra') return;
  const t = g.time || 0;
  if (t < 0.3 || t > 0.42) return;
  const p = g.player.body.pos;
  const v = g.nearestVillage(p.x, p.z);
  if (!v || v.dist > 90) return;
  if (g.meta.misaAviso !== d) { g.meta.misaAviso = d; g.ui.toast('⛪ Es domingo: misa en la iglesia del pueblo (las campanas llaman)', 3200); }
  const bell = v.v.bell || { x: v.v.x, y: v.v.y + 12, z: v.v.z - 20 };
  g.misaCampT = (g.misaCampT || 0) - 1;
  if (g.misaCampT <= 0) { g.misaCampT = 20; g.audio.play('campana', { pos: bell, vol: 1, vary: 0.03 }); }
  if (Math.hypot(bell.x - p.x, bell.z - p.z) < 14) g.achieve('misa', 'A misa de 10');
}

export function tickVida2(g) {
  tickTemporal(g);
  tickCarretera(g);
  tickMisa(g);
}

export const temporalActivo = (g) => !!(g.meta && g.meta.temporal);
