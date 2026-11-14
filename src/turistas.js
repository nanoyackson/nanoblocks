// Guía turístico: en los pueblos a veces aparece una pareja de turistas (con cámara y sombrero) que quiere conocer
// un lugar famoso cercano. Al hablarles, lo siguen; el destino sale en la brújula y el mapa (🏕) y al llegar pagan.
import { flat } from './fauna.js';
import { decir } from './misiones.js';
import { STRUCT_NAMES, structuresNear } from './estructuras.js';
import { conBanderita } from './arrecife.js';

const DESTINOS = new Set(['catarata', 'irazu', 'monteverde', 'manuel_antonio', 'tortuguero', 'tenorio', 'corcovado', 'cahuita', 'marino_ballena', 'basilica', 'puente_colgante', 'canopy', 'sitio_arqueologico', 'rincon_vieja', 'carara', 'braulio', 'conchal', 'mirador_arenal', 'mirador_poas', 'esferas', 'orosi', 'ruinas']);
const FRASES = ['Wow, so beautiful!', '¡Pura vida! ¿Así se dice?', 'Can we see a sloth?', '¿Falta mucho, amigo?', 'Amazing… ¡qué verde!', 'Picture, picture!'];

function vestir(m) {
  const u = m.group.userData;
  if (!u.head || u.turista) return;
  u.head.add(flat(0xf0e0b0, 0.7, 0.05, 0.7, 0, 0.47, 0), flat(0xf0e0b0, 0.42, 0.14, 0.42, 0, 0.55, 0)); // sombrero de safari
  if (u.npcArms) u.npcArms[0].add(flat(0x2a2a2e, 0.18, 0.14, 0.1, 0, -0.62, 0.12)); // cámara
  u.turista = true;
}

// cada segundo
export function tickTuristas(g) {
  if (g.dim !== 'tierra' || g.mode !== 'survival') return;
  const M = g.meta, p = g.player.body.pos;
  const turs = g.entities.mobs.filter((m) => !m.dead && m.data && m.data.turista);
  for (const m of turs) vestir(m);
  const T = M.tour;
  if (T && T.paso === 'llevar') {
    // si se recargó la partida, vuelven a aparecer al lado
    if (!turs.length) for (let k = 0; k < 2; k++) crear(g, p.x + 2 + k, p.y + 0.5, p.z + 1, true);
    for (const m of turs) m.data.sigue = true;
    if (Math.random() < 0.04 && turs[0]) decir(g, turs[0], FRASES[Math.floor(Math.random() * FRASES.length)], 3);
    if (Math.hypot(T.pos.x - p.x, T.pos.z - p.z) < 18 && turs.some((m) => Math.hypot(m.body.pos.x - p.x, m.body.pos.z - p.z) < 10)) {
      const propina = 5 + Math.floor(Math.random() * 15), extra = conBanderita(g) ? Math.round(T.pago * 0.25) : 0; // v12.7.1: la banderita azul
      const left = g.inventory.add(360, T.pago + extra + propina);
      if (left) g.entities.dropItem(360, left, p.x, p.y + 1, p.z);
      g.audio.play('monedas', { ui: true, vol: 0.6 });
      g.ui.toast(`📸 ¡Llegaron a ${T.nombre}! Le pagan ${T.pago + extra} colones${extra ? ' (la banderita azul le sube la paga)' : ''} y ${propina} de propina. «Thank you, pura vida!»`, 3600);
      if (turs[0]) decir(g, turs[0], '¡Gracias, amigo! ¡Pura vida!', 4);
      for (const m of turs) { m.data.sigue = false; m.data.irse = 8; m.data.turista = false; }
      M.tour = null;
      M.tours = (M.tours || 0) + 1;
      g.achieve('guia_turistico', 'Guía turístico');
      if (M.tours >= 5) g.achieve('guia_cinco', 'Guía de cinco estrellas');
      M.reputation = (M.reputation || 0) + 1;
    }
    return;
  }
  // aparecen en el pueblo (una pareja a la vez)
  if (turs.length || (g.envPueblo || 0) < 0.3 || g.daylight < 0.4) return;
  g.turCd = (g.turCd ?? 120) - 1;
  if (g.turCd > 0) return;
  g.turCd = 300 + Math.random() * 300;
  const a = Math.random() * Math.PI * 2;
  for (let k = 0; k < 2; k++) crear(g, p.x + Math.cos(a) * 9 + k, p.y + 1, p.z + Math.sin(a) * 9, false);
  g.ui.toast('🧳 Unos turistas andan por el pueblo con cara de perdidos… háblele a uno', 3000);
}

function crear(g, x, y, z, siguiendo) {
  const m = g.entities.spawnMob('vecino', x, y, z);
  m.data = { vid: `turista:${g.clock}:${Math.random()}`, name: 'Turista', role: 'turista', seed: Math.floor(Math.random() * 1e6) + 1, home: { x, y, z }, plaza: { x, y, z }, turista: true, sigue: siguiendo };
  m.kind.dress(m);
  return m;
}

// al hablar con un turista: proponen un destino y lo siguen
export function turistaInteract(m, g) {
  if (!m.data.turista) return false;
  const M = g.meta, p = g.player.body.pos;
  if (M.tour) { decir(g, m, `¿Ya mero llegamos a ${M.tour.nombre}?`, 3); return true; }
  let best = null, bd = Infinity;
  for (const s of structuresNear(g.world.gen, p.x, p.z, 500)) {
    if (!DESTINOS.has(s.type)) continue;
    const d = Math.hypot(s.x - p.x, s.z - p.z);
    if (d > 60 && d < bd) { bd = d; best = s; }
  }
  if (!best) { g.ui.dialog('Turista', 'Hello! Queremos ver algo famoso… pero aquí cerca no hay nada. ¡Gracias igual!', 4200); return true; }
  const pago = Math.round(20 + bd / 12);
  M.tour = { paso: 'llevar', pos: { x: best.x, z: best.z }, nombre: STRUCT_NAMES[best.type] || 'ese lugar', pago };
  g.ui.dialog('Turista', `Hello, amigo! ¿Nos lleva a ${M.tour.nombre}? Le pagamos ${pago} colones. (Sale con 🏕 en la brújula)`, 5600);
  for (const t of g.entities.mobs) if (t.data && t.data.turista) t.data.sigue = true;
  return true;
}
