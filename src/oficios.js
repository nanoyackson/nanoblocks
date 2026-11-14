// Oficios: la cogida de café por cajuela (con la cajuela en la mano, el café maduro cae adentro; llena se vende en
// el beneficio) y la batea de oro en los ríos, como en las minas de Abangares (pepitas que se juntan para hacer oro).
import { FLUID, BLOCK_BY_KEY as K } from './blocks.js';
import { regionAt } from './regiones.js';

export const CAJUELA = 458, CAJUELA_LLENA = 459, BATEA = 460, PEPITA = 461;
const POR_CAJUELA = 20;

// coger café maduro con la cajuela: los granos van a la cajuela en vez de caer al suelo
export function cogerConCajuela(g, n) {
  const inv = g.inventory, s = inv.held;
  if (!s || s.id !== CAJUELA) return false;
  s.granos = (s.granos || 0) + n;
  g.ui.toast(`☕ Cajuela: ${Math.min(POR_CAJUELA, s.granos)} de ${POR_CAJUELA} granos`, 900);
  if (s.granos >= POR_CAJUELA) {
    const sobra = s.granos - POR_CAJUELA;
    inv.slots[inv.selected] = { id: CAJUELA_LLENA, count: 1 };
    if (sobra > 0) inv.add(294, sobra);
    inv.changed();
    g.audio.play('dig.cloth', { ui: true, vol: 0.6, pitch: 0.8 });
    g.ui.toast('🧺 ¡Cajuela llena! Véndala en el beneficio (el caficultor la paga bien)', 2600);
    g.meta.cajuelas = (g.meta.cajuelas || 0) + 1;
    g.achieve('cajuela', 'Coger café por cajuela');
    if (g.meta.cajuelas >= 10) g.achieve('cogedor', 'Cogedor de café de los buenos');
  } else inv.changed();
  return true;
}

// la batea: clic derecho al agua de un río (no del mar). Hay que esperar un ratito y a veces sale una pepita
export function batear(g, ft) {
  if (!ft || FLUID[ft.id] !== 1 || ft.id === K.agua_celeste) return false;
  const reg = regionAt(g.world.gen, ft.x, ft.z);
  if (reg === 'mar') { g.ui.toast('En el mar no se batea: busque un río', 1400); return true; }
  if (g.bateando) return true;
  g.bateando = { t: 0, x: ft.x, y: ft.y, z: ft.z, reg };
  g.audio.play('splash', { pos: { x: ft.x + 0.5, y: ft.y + 1, z: ft.z + 0.5 }, vol: 0.5, pitch: 1.2 });
  if (!g.meta.bateaAviso) { g.meta.bateaAviso = true; g.ui.toast('🥘 Bateando… quédese quieto unos segundos (en Guanacaste y la zona norte hay más oro)', 2800); }
  return true;
}
export function tickBatea(g, dt) {
  const B = g.bateando;
  if (!B) return;
  const p = g.player.body.pos;
  if (Math.hypot(p.x - B.x - 0.5, p.z - B.z - 0.5) > 4 || !g.inventory.held || g.inventory.held.id !== BATEA) { g.bateando = null; return; }
  B.t += dt;
  if (Math.random() < dt * 6) g.particles.spawn(B.x + 0.5 + (Math.random() - 0.5) * 0.6, B.y + 1, B.z + 0.5 + (Math.random() - 0.5) * 0.6, [0.75, 0.85, 1], (Math.random() - 0.5), 1, (Math.random() - 0.5), 0.5);
  if (B.t < 3) return;
  g.bateando = null;
  const prob = B.reg === 'guanacaste' || B.reg === 'norte' ? 0.25 : 0.12;
  g.swing = 1;
  if (Math.random() < prob) {
    const n = Math.random() < 0.15 ? 2 : 1;
    g.inventory.add(PEPITA, n);
    g.audio.play('monedas', { ui: true, vol: 0.4, pitch: 1.4 });
    g.ui.toast(n > 1 ? '✨ ¡Dos pepitas de oro!' : '✨ ¡Una pepita de oro!', 1400);
    g.meta.pepitas = (g.meta.pepitas || 0) + n;
    g.achieve('batea', 'Oro de Abangares');
    if (g.meta.pepitas >= 25) g.achieve('fiebre_oro', 'Fiebre del oro');
  } else {
    if (Math.random() < 0.3) g.inventory.add(K.gravel, 1);
    g.ui.toast('Pura arenilla… otra vez', 900);
  }
  if (g.mode === 'survival' && g.inventory.wearHeld()) g.ui.toast('Se rompió la batea');
}
