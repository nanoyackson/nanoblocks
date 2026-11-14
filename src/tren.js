// El tren al Caribe: en la estación, el jefe de estación vende el pasaje (6 colones) a la otra estación más
// cercana o, si no hay, a un pueblo del Caribe. Pantalla a negro con el pito del tren, el viaje y la llegada.
import { structuresNear, STRUCT_NAMES } from './estructuras.js';
import { villageAt, CELL } from './pueblogen.js';
import { regionAt } from './regiones.js';

function destino(g) {
  const p = g.player.body.pos, gen = g.world.gen;
  let best = null, bd = Infinity;
  for (const s of structuresNear(gen, p.x, p.z, 4000, new Set(['estacion']))) {
    const d = Math.hypot(s.x - p.x, s.z - p.z);
    if (d > 150 && d < bd) { bd = d; best = { x: s.x, z: s.z, nombre: STRUCT_NAMES.estacion || 'la estación', d }; }
  }
  if (best) return best;
  // un pueblo del Caribe
  const cx = Math.floor(p.x / CELL), cz = Math.floor(p.z / CELL);
  for (let r = 1; r < 12; r++) for (let i = -r; i <= r; i++) for (let j = -r; j <= r; j++) {
    if (Math.max(Math.abs(i), Math.abs(j)) !== r) continue;
    const v = villageAt(gen, cx + i, cz + j);
    if (v && regionAt(gen, v.x, v.z) === 'caribe') return { x: v.x, z: v.z + 10, nombre: v.name ? `${v.name} (Caribe)` : 'un pueblo del Caribe', d: Math.hypot(v.x - p.x, v.z - p.z) };
  }
  return null;
}

export function trenInteract(m, g) {
  if (m.data.role !== 'jefe_estacion' || g.dim !== 'tierra') return false;
  if (g.trenViaje) return true;
  const D = destino(g);
  if (!D) { g.ui.dialog(m.data.name, 'El tren no tiene para dónde ir… la línea está en reparación desde hace años.', 4200); return true; }
  if (g.mode === 'survival') {
    if (g.inventory.count(360) < 6) { g.ui.dialog(m.data.name, `El pasaje a ${D.nombre} vale 6 colones. Vuelva cuando los tenga.`, 4200); return true; }
    g.inventory.remove(360, 6);
  }
  g.ui.dialog(m.data.name, `¡Pasajeros al tren! Destino: ${D.nombre}. Agárrese, que la vía tiene sus brincos.`, 4200);
  g.audio.play('tren', { ui: true, vol: 1 });
  const o = document.getElementById('sleep-overlay');
  if (o) { o.style.transition = 'opacity 1.2s'; o.style.opacity = 1; }
  g.trenViaje = { D, t: 0, fase: 'negro' };
  return true;
}

// cada cuadro: en negro, pasar al destino y esperar a que cargue el terreno
export function tickTren(g, dt) {
  const V = g.trenViaje;
  if (!V) return false;
  V.t += dt;
  const b = g.player.body;
  if (V.fase === 'negro' && V.t > 1.3) {
    V.fase = 'carga';
    b.pos.x = V.D.x + 0.5; b.pos.z = V.D.z + 0.5; b.pos.y = 140;
  }
  if (V.fase === 'carga') {
    b.vel.x = b.vel.y = b.vel.z = 0; b.fallStart = null;
    if (g.world.isLoaded(Math.floor(b.pos.x), Math.floor(b.pos.z)) && V.t > 2.5) {
      b.pos.y = g.world.gen.column(Math.floor(b.pos.x), Math.floor(b.pos.z)).h + 2.2;
      // subir hasta aire libre (por si cae dentro de algo)
      while (g.world.getBlock(Math.floor(b.pos.x), Math.floor(b.pos.y), Math.floor(b.pos.z)) || g.world.getBlock(Math.floor(b.pos.x), Math.floor(b.pos.y) + 1, Math.floor(b.pos.z))) b.pos.y++;
      const mins = Math.round(V.D.d / 1000 * 20 + 15);
      g.time = (g.time + mins / 1440) % 1;
      V.fase = 'llega'; V.t = 0;
      const o = document.getElementById('sleep-overlay');
      if (o) o.style.opacity = 0;
      g.audio.play('tren', { ui: true, vol: 0.7, pitch: 0.9 });
      g.ui.toast(`🚂 Chu-chuuu… llegó a ${V.D.nombre} (${mins} minutos de viaje)`, 3600);
      g.achieve('tren', 'Viaje en tren');
      g.meta.viajesTren = (g.meta.viajesTren || 0) + 1;
      if (g.meta.viajesTren >= 3) g.achieve('tren3', 'Maquinista honorario');
    }
    return true;
  }
  if (V.fase === 'llega') g.trenViaje = null;
  return V.fase === 'negro';
}
