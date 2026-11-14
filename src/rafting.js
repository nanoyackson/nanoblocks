// Rafting: los ríos tienen corriente. Como el agua de los ríos está toda al nivel del mar, la dirección sale del
// trazado del cauce (sigue la línea del río hacia donde baja el continente, o sea hacia el mar). Donde el río pasa
// entre cerros altos hay rápidos: más velocidad, espuma y brincos.
import { SEA } from './worldgen.js';

const S = 0.0025;
function riverR(gen, x, z) { return gen.nRiver.fbm2(x * S, z * S, 3); }

// corriente en (x, z): null si no es río
export function corriente(gen, x, z) {
  if (!gen || !gen.nRiver || gen.dim && gen.dim !== 'tierra') return null;
  const r = riverR(gen, x, z);
  if (Math.abs(r) > 0.045) return null;
  const gx = riverR(gen, x + 2, z) - riverR(gen, x - 2, z), gz = riverR(gen, x, z + 2) - riverR(gen, x, z - 2);
  const l = Math.hypot(gx, gz) || 1;
  let tx = -gz / l, tz = gx / l;
  // hacia el mar: donde el continente baja
  const ca = gen.nCont.fbm2((x + tx * 30) * 0.0016, (z + tz * 30) * 0.0016, 4), cb = gen.nCont.fbm2((x - tx * 30) * 0.0016, (z - tz * 30) * 0.0016, 4);
  if (ca > cb) { tx = -tx; tz = -tz; }
  // ¿cañón? (orillas altas a los lados)
  const nx = -tz, nz = tx;
  let alto = 0;
  for (const s of [-7, 7]) alto = Math.max(alto, gen.column(Math.floor(x + nx * s), Math.floor(z + nz * s)).h);
  const rapido = alto > SEA + 12;
  return { x: tx, z: tz, v: rapido ? 6.5 : 3.2, rapido };
}

// mientras va en bote: la corriente lo lleva
export function tickRafting(g, m, dt, enAgua) {
  if (!enAgua) return;
  const b = m.body;
  const c = corriente(g.world.gen, b.pos.x, b.pos.z);
  if (!c) { g.rapidoT = 0; return; }
  const k = Math.min(1, dt * 1.5);
  b.vel.x += (c.x * c.v - b.vel.x) * k * 0.5;
  b.vel.z += (c.z * c.v - b.vel.z) * k * 0.5;
  g.raftDist = (g.raftDist || 0) + c.v * dt;
  if (g.raftDist > 80) g.achieve('rafting', 'Rafting por el río');
  if (!g.raftAviso) { g.raftAviso = true; g.ui.toast('🛶 ¡El río tiene corriente! El bote baja solo río abajo', 2400); }
  if (c.rapido) {
    g.rapidoT = (g.rapidoT || 0) + dt;
    if (Math.random() < dt * 14) g.particles.spawn(b.pos.x + (Math.random() - 0.5) * 3, b.pos.y + 0.3, b.pos.z + (Math.random() - 0.5) * 3, [0.95, 0.98, 1], (Math.random() - 0.5) * 2, 1.5 + Math.random(), (Math.random() - 0.5) * 2, 0.7);
    if (Math.random() < dt * 0.8) { b.vel.y = 3 + Math.random() * 2; g.audio.play('splash', { pos: b.pos, vol: 0.6, pitch: 1.2 }); g.shake = Math.max(g.shake || 0, 0.3); }
    if (g.rapidoT > 6) g.achieve('rapidos', 'Sobreviví a los rápidos');
    if (!g.rapidoAviso) { g.rapidoAviso = true; g.ui.toast('🌊 ¡Rápidos! Agárrese duro', 1800); }
  } else g.rapidoT = 0;
}
