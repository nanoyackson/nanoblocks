// Habilidades que suben con el uso (minería, tala, pesca, cocina, combate, agricultura y exploración), del 0 al 10.
import { ventaja } from './progreso.js';
// Cada nivel da un bono chiquito; en el nivel 5 y en el 10 se desbloquea algo especial.
export const SKILLS = {
  mineria: { name: 'Minería', icon: '⛏️', bono: (n) => `pica ${n * 4} % más rápido · ${n * 3} % de mineral doble`, hito5: 'De la piedra a veces sale carbón', hito10: 'Pico de oro: el pico se gasta la mitad' },
  tala: { name: 'Tala', icon: '🪓', bono: (n) => `corta ${n * 5} % más rápido · ${n * 4} % de tronco doble`, hito5: 'Al talar a veces caen manzanas y palos', hito10: 'Leñador: el hacha se gasta la mitad' },
  pesca: { name: 'Pesca', icon: '🎣', bono: (n) => `pican ${n * 5} % antes · ${n * 3} % de pescado doble`, hito5: 'Más tiempo para recoger cuando pica', hito10: 'Pescador viejo: a veces sale oro o un diamante' },
  cocina: { name: 'Cocina', icon: '🍳', bono: (n) => `la comida llena ${n * 5} % más`, hito5: 'Lo crudo ya no le cae mal', hito10: 'Mano de abuela: comer cura 2 corazones' },
  combate: { name: 'Combate', icon: '⚔️', bono: (n) => `${n * 3} % más daño`, hito5: 'Recupera medio corazón al vencer a un enemigo', hito10: 'Guerrero: 10 % menos daño recibido' },
  agricultura: { name: 'Agricultura', icon: '🌽', bono: (n) => `${n * 6} % de cosecha doble`, hito5: 'Al cosechar sale una semilla más', hito10: 'Mano verde: al cosechar a veces sale abono' },
  exploracion: { name: 'Exploración', icon: '🧭', bono: (n) => `hambre y sed ${n * 3} % más lentas`, hito5: 'Cada lugar descubierto da el doble de experiencia', hito10: 'Trotamundos: corre 8 % más rápido' },
};
const MAX = 10;
// experiencia total para llegar a cada nivel (sube más lento al final)
const NEED = Array.from({ length: MAX + 1 }, (_, n) => Math.round(18 * n ** 1.7));

export function skillInfo(g, k) {
  const xp = ((g.meta && g.meta.skills) || {})[k] || 0;
  let lv = 0;
  while (lv < MAX && xp >= NEED[lv + 1]) lv++;
  const prev = NEED[lv], next = NEED[Math.min(MAX, lv + 1)];
  return { xp, lv, prog: lv >= MAX ? 1 : (xp - prev) / (next - prev), falta: lv >= MAX ? 0 : Math.ceil(next - xp) };
}
export const lv = (g, k) => (g.mode === 'survival' ? skillInfo(g, k).lv : 0);

export function gainSkill(g, k, amt = 1) {
  if (g.mode !== 'survival' || !SKILLS[k] || !g.meta) return;
  const before = skillInfo(g, k).lv;
  const S = (g.meta.skills = g.meta.skills || {});
  S[k] = (S[k] || 0) + amt;
  const after = skillInfo(g, k).lv;
  if (after <= before) return;
  const s = SKILLS[k];
  const extra = after === 5 ? ` · ¡Nuevo! ${s.hito5}` : after === 10 ? ` · ¡Maestro! ${s.hito10}` : '';
  g.ui.toast(`${s.icon} ${s.name} nivel ${after}: ${s.bono(after)}${extra} (H para ver)`, 3600);
  g.audio.play('nivel', { ui: true, vol: 0.45, pitch: 1.25 });
  const p = g.player.body.pos;
  g.particles.burst(p.x, p.y + 1.2, p.z, [[1, 0.85, 0.3], [1, 1, 0.7]], 18, 2);
  if (after >= 5) g.achieve(`habilidad5_${k}`, `${s.name}: nivel 5`);
  if (after >= 10) g.achieve(`habilidad10_${k}`, `Maestro de ${s.name.toLowerCase()}`);
  if (Object.keys(SKILLS).every((q) => skillInfo(g, q).lv >= 3)) g.achieve('todero', 'Todero: todo a nivel 3');
}

// ---- bonos que usa el juego ----
export const mult = {
  picar: (g, tool) => (1 + (tool === 'pickaxe' ? lv(g, 'mineria') * 0.04 : tool === 'axe' ? lv(g, 'tala') * 0.05 : 0)) * ventaja.picar(g),
  doble: (g, k) => Math.random() < lv(g, k) * ({ mineria: 0.03, tala: 0.04, pesca: 0.03, agricultura: 0.06 }[k] || 0),
  dano: (g) => (1 + lv(g, 'combate') * 0.03) * ventaja.dano(g),
  recibido: (g) => (lv(g, 'combate') >= 10 ? 0.9 : 1) * ventaja.recibido(g),
  comida: (g) => (1 + lv(g, 'cocina') * 0.05) * ventaja.comida(g),
  gasto: (g) => (1 - lv(g, 'exploracion') * 0.03) * ventaja.gasto(g),
  mordida: (g) => 1 - lv(g, 'pesca') * 0.05,
};
