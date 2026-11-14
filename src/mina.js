// Riesgos del trabajo: una caída fea quiebra la pierna (hasta entablillarla) y en lo hondo de la mina el techo se puede venir abajo,
// con aviso para salir corriendo. Los puntales lo evitan: abajo también hay que construir.
import { AIR, BLOCK_BY_KEY as K, SOLID } from './blocks.js';
import { difOf } from './supervivencia.js';

export const TABLILLA = 508;
const HONDO = 40, PROB = 0.006, RADIO_PUNTAL = 6;

// ---------- la pierna ----------
export function quizaQuebrar(g, dano) {
  if (g.mode !== 'survival' || !g.player.alive || dano < 6 || !difOf(g).hostiles) return;
  if (dano < 10 && Math.random() > 0.6) return;
  g.addEffect('quebrado', 240);
  g.ui.toast('🦴 ¡Se quebró la pierna! Una tablilla (palos + venda) o el botiquín la arreglan', 3600);
  g.achieve('quebrado', 'Se me quebró la pierna');
}

// ---------- el derrumbe ----------
function hayPuntal(g, x, y, z) {
  const w = g.world;
  for (let dx = -RADIO_PUNTAL; dx <= RADIO_PUNTAL; dx++) for (let dz = -RADIO_PUNTAL; dz <= RADIO_PUNTAL; dz++) for (let dy = -3; dy <= 3; dy++) if (w.getBlock(x + dx, y + dy, z + dz) === K.puntal) return true;
  return false;
}
// lo llama breakBlock al picar
export function quizaDerrumbe(g, t, b) {
  if (g.mode !== 'survival' || g.derrumbe || b.tool !== 'pickaxe' || t.y >= HONDO || g.dim !== 'tierra' || !difOf(g).hostiles) return;
  if (Math.random() > PROB || (g.clock || 0) < (g.derrumbeCd || 0) || hayPuntal(g, t.x, t.y, t.z)) return;
  g.derrumbeCd = (g.clock || 0) + 180;
  g.derrumbe = { t: 2.4, x: t.x, y: t.y, z: t.z };
  g.audio.play('rumble', { ui: true, vol: 0.8 });
  g.shake = Math.max(g.shake || 0, 0.6);
  g.ui.toast('🧱 ¡El techo está crujiendo! Muévase, que se viene abajo', 2400);
}
// cada cuadro
export function tickDerrumbe(g, dt) {
  const D = g.derrumbe;
  if (!D) return;
  D.t -= dt;
  const w = g.world;
  if (D.t > 0) {
    g.shake = Math.max(g.shake || 0, 0.25);
    if (Math.random() < dt * 30) g.particles.spawn(D.x + (Math.random() - 0.5) * 6, D.y + 2.5 + Math.random() * 2, D.z + (Math.random() - 0.5) * 6, [0.5, 0.48, 0.44], 0, -1.5, 0, 0.6, 8);
    return;
  }
  g.derrumbe = null;
  let puestos = 0;
  const p = g.player.body.pos;
  // la grava cae de los techos alrededor de donde se estaba picando
  for (let k = 0; k < 40 && puestos < 8; k++) {
    const x = D.x + Math.round((Math.random() - 0.5) * 7), z = D.z + Math.round((Math.random() - 0.5) * 7);
    let y = D.y + 5;
    while (y > D.y - 4 && !(SOLID[w.getBlock(x, y + 1, z)] && w.getBlock(x, y, z) === AIR)) y--;
    if (y <= D.y - 4) continue;
    w.setBlock(x, y, z, K.gravel);
    puestos++;
    g.particles.burst(x + 0.5, y + 0.5, z + 0.5, [[0.5, 0.48, 0.44], [0.35, 0.33, 0.3]], 6, 1.2);
    if (Math.hypot(x + 0.5 - p.x, z + 0.5 - p.z) < 1.1 && y >= p.y - 0.5) g.damagePlayer(4, null, null, 'Se le vino el techo encima', true);
  }
  g.audio.play('derrumbe', { pos: { x: D.x + 0.5, y: D.y + 2, z: D.z + 0.5 }, vol: 1 });
  g.shake = Math.max(g.shake || 0, 0.9);
  if (g.player.alive) {
    g.achieve('derrumbe', 'Salí de esa');
    if (!g.meta.puntalAviso) { g.meta.puntalAviso = true; g.ui.toast('🧱 Se vino abajo. Con puntales (palos y tablas) cerca, eso no pasa', 3600); }
  }
}
export function limpiarDerrumbe(g) { g.derrumbe = null; }
