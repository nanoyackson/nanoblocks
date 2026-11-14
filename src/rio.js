// El río crecido: con aguaceros fuertes, los ríos cerca de uno suben un bloque y se salen a las orillas bajas; la
// corriente arrastra al que se meta y el agua trae cosas (palos, troncos, una bota vieja… y hasta una gallina).
// Solo pone agua donde había aire, guarda cada bloque en la partida y lo quita cuando escampa (si sigue siendo agua).
import { BLOCK_BY_KEY as K, FLUID, AIR, SOLID } from './blocks.js';
import { SEA } from './worldgen.js';

const MAX = 900;
const COSAS = [[256, 'palos'], [K.log, 'un tronco'], [368, 'una bota vieja'], [261, 'manzanas'], [384, 'orejas de guanacaste']];
const aguacero = (g) => !!(g.weather && g.weather.intensity > 0.8 && !g.dry && !g.cold && (g.weather.type === 'storm' || g.season === 'invierno'));

export function tickRio(g, dt) {
  if (g.dim !== 'tierra') return;
  g.rioT = (g.rioT || 0) - dt;
  const M = g.meta;
  const C = (M.crecida ||= []);
  const p = g.player.body.pos, w = g.world;
  // la corriente: si uno está en agua crecida, lo arrastra
  if (C.length && g.player.body.inWater) {
    const fx = Math.floor(p.x), fz = Math.floor(p.z);
    if (Math.abs(Math.floor(p.y) - SEA) <= 3 && hayCrecidaCerca(C, fx, fz)) {
      const a = ((g.day || 1) * 1.7) % (Math.PI * 2);
      g.player.body.vel.x += Math.cos(a) * 9 * dt; g.player.body.vel.z += Math.sin(a) * 9 * dt;
      if (!g.corrienteAviso) { g.corrienteAviso = true; g.ui.toast('🌊 ¡La corriente del río crecido lo arrastra! Salga del agua', 2400); g.achieve('corriente', 'Arrastrado por la corriente'); }
    }
  } else g.corrienteAviso = false;
  if (g.rioT > 0) return;
  g.rioT = 1.5;
  if (aguacero(g)) {
    // subir el río alrededor (por tandas)
    if (C.length < MAX) {
      let puestos = 0;
      for (let t = 0; t < 60 && C.length < MAX; t++) {
        const x = Math.floor(p.x + (Math.random() - 0.5) * 56), z = Math.floor(p.z + (Math.random() - 0.5) * 56);
        if (!w.isLoaded(x, z)) continue;
        const col = w.gen.column(x, z);
        // el cauce del río es poco hondo (el mar abierto, no)
        if (col.h < SEA - 4) continue;
        for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) {
          const xx = x + dx, zz = z + dz;
          if (C.length >= MAX) break;
          // la superficie del agua llega hasta SEA: la crecida va un bloque arriba
          const y = SEA + 1;
          if (w.getBlock(xx, y, zz) !== AIR) continue;
          const abajo = w.getBlock(xx, y - 1, zz);
          // encima del río, o en la orilla baja pegada al agua
          const rio = FLUID[abajo] === 1;
          const orilla = SOLID[abajo] && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([ax, az]) => FLUID[w.getBlock(xx + ax, y - 1, zz + az)] === 1 || FLUID[w.getBlock(xx + ax, y, zz + az)] === 1);
          if (!rio && !orilla) continue;
          w.setBlock(xx, y, zz, K.water, { updates: false });
          C.push([xx, y, zz]);
          puestos++;
        }
      }
      if (puestos && !g.crecidaAviso) { g.crecidaAviso = true; g.ui.toast('🌧🌊 ¡Con este aguacero el río se creció! Cuidado en las orillas', 3200); g.achieve('rio_crecido', 'El río se creció'); }
    }
    // la crecida trae cosas
    if (C.length > 30 && Math.random() < 0.25) {
      const [x, y, z] = C[Math.floor(Math.random() * C.length)];
      if (Math.hypot(x - p.x, z - p.z) < 30) {
        if (Math.random() < 0.06) { g.entities.spawnMob('gallina', x + 0.5, y + 1.2, z + 0.5); if (!g.gallinaAviso) { g.gallinaAviso = true; g.ui.toast('🐔 ¡La corriente trajo una gallina! (alguien la va a extrañar)', 2400); } }
        else { const [id] = COSAS[Math.floor(Math.random() * COSAS.length)]; g.entities.dropItem(id, 1 + Math.floor(Math.random() * 2), x + 0.5, y + 1.3, z + 0.5); }
      }
    }
  } else if (C.length) {
    // escampó: el río baja de a poquito
    g.crecidaAviso = false;
    let quitados = 0;
    for (let i = C.length - 1; i >= 0 && quitados < 120; i--) {
      const [x, y, z] = C[i];
      if (!w.isLoaded(x, z)) continue;
      if (FLUID[w.getBlock(x, y, z)] === 1) w.setBlock(x, y, z, AIR, { updates: false });
      C.splice(i, 1);
      quitados++;
    }
    if (!C.length) g.ui.toast('🌤 El río volvió a su cauce', 1800);
  }
}
function hayCrecidaCerca(C, x, z) {
  for (let i = C.length - 1; i >= 0 && i > C.length - 400; i--) if (Math.abs(C[i][0] - x) <= 2 && Math.abs(C[i][2] - z) <= 2) return true;
  return false;
}
