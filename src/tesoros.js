// Tesoros y buceo: mapas del tesoro (cofre enterrado en una X, o un naufragio en el fondo del mar), el mapa del pirata
// de la Isla del Coco, la careta de buceo (más aire y se ve mejor bajo el agua) y las perlas de los arrecifes.
import { BLOCK_BY_KEY as K } from './blocks.js';
import { SEA } from './worldgen.js';

export const MAPA = 444, CARETA = 445, PERLA = 369;
const COLON = 360;
const RUMBOS = ['norte', 'noreste', 'este', 'sureste', 'sur', 'suroeste', 'oeste', 'noroeste'];
const BIOMA = { jungle: 'la selva', forest: 'el bosque', plains: 'la llanura', bosque_seco: 'el bosque seco', beach: 'la playa', ocean: 'el mar', nuboso: 'el bosque nuboso', paramo: 'el páramo', manglar: 'el manglar', desert: 'el desierto', guanacaste: 'Guanacaste' };

function rumbo(dx, dz) {
  const a = Math.atan2(dx, -dz); // 0 = norte (−z)
  return RUMBOS[((Math.round(a / (Math.PI / 4)) % 8) + 8) % 8];
}
function pista(g, t) {
  const p = g.player.body.pos, dx = t.x - p.x, dz = t.z - p.z, d = Math.hypot(dx, dz);
  const lejos = d < 60 ? 'aquí cerquita' : d < 150 ? `a unos ${Math.round(d / 10) * 10} pasos` : `lejos, como a ${Math.round(d / 50) * 50} pasos`;
  const col = g.world.gen.column(Math.round(t.x), Math.round(t.z));
  const donde = t.tipo === 'naufragio' ? 'bajo el agua, donde se hundió un barco' : t.tipo === 'coco' ? 'en la isla, cerca de la costa' : `en ${BIOMA[col.biome] || 'el monte'}`;
  return `🗺️ «Camine hacia el ${rumbo(dx, dz)}, ${lejos}, ${donde}. Cave en la ❌.»`;
}

function elegirLugar(g) {
  const p = g.player.body.pos, gen = g.world.gen;
  const naufragio = Math.random() < 0.3;
  for (let k = 0; k < 60; k++) {
    const a = Math.random() * Math.PI * 2, r = 120 + Math.random() * 230;
    const x = Math.round(p.x + Math.cos(a) * r), z = Math.round(p.z + Math.sin(a) * r);
    const col = gen.column(x, z);
    if (naufragio && col.h < SEA - 2 && col.h > SEA - 16) return { x, z, tipo: 'naufragio' };
    if (!naufragio && col.h > SEA + 1 && col.h < 110 && col.biome !== 'ocean') return { x, z, tipo: 'tierra' };
  }
  return null;
}

// usar el mapa (clic derecho)
export function usarMapa(g) {
  if (g.dim !== 'tierra') { g.ui.toast('El mapa es de la Tierra…', 1400); return; }
  const M = g.meta;
  if (!M.tesoro) {
    const t = elegirLugar(g);
    if (!t) { g.ui.toast('El mapa está muy borroso… pruebe en otro lado', 1600); return; }
    M.tesoro = t;
    g.ui.toast('🗺️ ¡El mapa marca una ❌! Sale en la brújula y en el mapa (M)', 2600);
    g.audio.play('dig.cloth', { ui: true, vol: 0.5, pitch: 0.8 });
    g.achieve('mapa_tesoro', 'A la caza de tesoros');
  }
  g.ui.dialog('Mapa viejo', pista(g, M.tesoro), 6000);
}

// al descubrir la Isla del Coco, el mapa del pirata
export function mapaDelCoco(g, s) {
  const M = g.meta;
  if (M.tesoroCoco) return;
  M.tesoroCoco = true;
  const a = Math.random() * Math.PI * 2;
  M.tesoro = { x: Math.round(s.x + Math.cos(a) * 14), z: Math.round(s.z + Math.sin(a) * 14), tipo: 'coco' };
  g.ui.dialog('Un pirata viejo', '¡Arrr! Usted llegó hasta la Isla del Coco… le dejo mi mapa: el tesoro de Lima está enterrado aquí cerca. ¡Cave en la ❌!', 6500);
}

function botin(tipo) {
  const slots = new Array(27).fill(null);
  const put = (id, n) => { let i = Math.floor(Math.random() * 27); while (slots[i]) i = (i + 1) % 27; slots[i] = { id, count: n }; };
  const r = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const rico = tipo === 'coco' ? 3 : tipo === 'naufragio' ? 1.5 : 1;
  put(COLON, Math.min(64, Math.round(r(20, 45) * rico)));
  if (rico > 1) put(COLON, Math.min(64, Math.round(r(20, 45) * rico)));
  put(259, Math.round(r(2, 6) * rico));
  if (Math.random() < 0.5 * rico) put(260, r(1, 2));
  if (Math.random() < 0.4 * rico) put(274, r(1, 2));
  if (tipo !== 'tierra' || Math.random() < 0.3) put(PERLA, r(1, 3));
  if (Math.random() < 0.25) put(MAPA, 1);
  if (Math.random() < 0.35) put(451, 1);
  if (tipo === 'coco') { put(328, 1); put(278, r(1, 2)); }
  if (tipo === 'naufragio') put(CARETA, 1);
  return slots;
}

// al romper un bloque: ¿cavó en la X?
export function cavarTesoro(g, t) {
  const T = g.meta.tesoro;
  if (!T || g.mode !== 'survival' || g.dim !== 'tierra') return false;
  if (Math.abs(t.x - T.x) > 1 || Math.abs(t.z - T.z) > 1) return false;
  const h = g.world.gen.column(T.x, T.z).h;
  if (t.y > h + 1 || t.y < h - 5) return false;
  g.world.setBlock(t.x, t.y, t.z, K.chest);
  g.world.setBE(t.x, t.y, t.z, { type: 'chest', facing: 0, slots: botin(T.tipo) });
  g.particles.burst(t.x + 0.5, t.y + 1, t.z + 0.5, [[1, 0.85, 0.2], [1, 1, 0.6]], 40, 4);
  g.audio.play('cofre.abrir', { pos: { x: t.x + 0.5, y: t.y + 0.5, z: t.z + 0.5 }, vol: 0.9 });
  g.audio.play('monedas', { ui: true, vol: 0.6 });
  g.ui.toast(T.tipo === 'coco' ? '🏴‍☠️ ¡EL TESORO DE LA ISLA DEL COCO! ¡Era cierto!' : T.tipo === 'naufragio' ? '⚓ ¡Un cofre del naufragio!' : '💰 ¡Encontró el tesoro!', 3600);
  g.achieve('tesoro', '¡Encontré el tesoro!');
  if (T.tipo === 'naufragio') g.achieve('naufragio', 'El cofre del naufragio');
  if (T.tipo === 'coco') g.achieve('tesoro_coco', 'El tesoro de Lima');
  g.addXP(25);
  g.meta.tesoros = (g.meta.tesoros || 0) + 1;
  if (g.meta.tesoros >= 5) g.achieve('pirata', 'Pirata del Pacífico');
  g.meta.tesoro = null;
  return true;
}

// careta de buceo: 5 minutos con aire que dura el triple y se ve mejor
export function usarCareta(g) {
  g.addEffect('buceo', 300);
  g.ui.toast('🤿 Careta puesta: el aire le dura el triple y ve mejor bajo el agua (5 min)', 2400);
  g.audio.play('splash', { ui: true, vol: 0.3, pitch: 1.6 });
}

// las perlas: al romper coral (y a veces arena del fondo)
export function perlaDe(g, b, x, y, z) {
  if (g.mode !== 'survival') return false;
  const coral = /^coral_/.test(b.key);
  const fondo = b.key === 'sand' && y < SEA - 2;
  if ((coral && Math.random() < 0.06) || (fondo && Math.random() < 0.02)) {
    g.entities.dropItem(PERLA, 1, x + 0.5, y + 0.5, z + 0.5);
    g.ui.toast('🦪 ¡Una perla!', 1400);
    return true;
  }
  return false;
}
