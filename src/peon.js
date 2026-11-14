// El peón de la finca: cuando la casa ya es «Casa de verdad», Don Chepito llega a pedir trabajo. Se contrata una vez (40 colones) y
// desde entonces, de día y mientras uno ande cerca, cosecha lo que esté maduro, vuelve a sembrar y guarda todo en el cofre de la abuela.
// Es la recompensa de haber hecho finca: el trabajo repetitivo se va delegando. El estado vive en meta.hist.peon.
import { BLOCKS, BLOCK_BY_KEY as K, SOLID, AIR } from './blocks.js';
import { decir } from './misiones.js';
import { anotar } from './diario.js';

const ANCHO = 9, FONDO = 7, PRECIO = 40, COLON = 360, RADIO = 28;
const COSECHA = { corn: [268, 2], beans: [269, 3], pina: [467, 1], cafe: [294, 3] };
const FRASES = ['Esta tierra está buena, ¿oyó?', 'Doña Zenaida me enseñó a sembrar. Y a callarme.', 'Mañana ojalá no llueva. O sí. Da igual.', '¡Upe! Ya casi está esa mata.', 'Yo cuido esto como si fuera mío. Bueno, casi.'];
const cofre = (H) => ({ x: H.casa.x + 1, y: H.casa.y + 1, z: H.casa.z + 5 });

function llegar(g, H) {
  const w = g.world, x = H.casa.x + ANCHO + 1, z = Math.floor(H.casa.z + FONDO / 2);
  let y = H.casa.y + 8;
  while (y > H.casa.y - 12 && !(SOLID[w.getBlock(x, y - 1, z)] && !SOLID[w.getBlock(x, y, z)])) y--;
  const m = g.entities.spawnMob('vecino', x + 0.5, y + 0.2, z + 0.5);
  if (!m) return null;
  const here = { x, y, z };
  Object.assign(m.data, { home: here, plaza: { ...here }, name: 'Don Chepito (peón)', role: 'vecino', vid: 'hist:peon', seed: 19333, peonFinca: true, arreo: true });
  if (m.kind.dress) m.kind.dress(m);
  return m;
}
function guardar(g, H, id, n) {
  const c = cofre(H), be = g.world.getBE(c.x, c.y, c.z);
  if (!be || !be.slots) return false;
  let i = be.slots.findIndex((s) => s && s.id === id && s.count + n <= 64);
  if (i < 0) i = be.slots.findIndex((s) => !s);
  if (i < 0) return false;
  if (be.slots[i]) be.slots[i].count += n; else be.slots[i] = { id, count: n };
  g.world.touchBE(c.x, c.y, c.z);
  return true;
}
// la mata madura más cerca de la casa
function buscarMata(g, H) {
  const w = g.world, cx = H.casa.x + ANCHO / 2, cz = H.casa.z + FONDO / 2;
  for (const k of w.crops) {
    const [x, y, z] = k.split(',').map(Number);
    if (Math.hypot(x - cx, z - cz) > RADIO) continue;
    const b = BLOCKS[w.getBlock(x, y, z)];
    if (b && b.crop && b.stage === 3 && COSECHA[b.crop]) return { x, y, z, b };
  }
  return null;
}
// cada segundo
export function tickPeon(g) {
  if (g.mode !== 'survival' || g.dim !== 'tierra' || !g.meta) return;
  const H = g.meta.hist;
  if (!H || !H.hogar || !H.casa || (H.nivel || 1) < 2) return;
  const p = g.player.body.pos, t = g.time || 0, deDia = t > 0.03 && t < 0.44;
  const m = g.entities.mobs.find((q) => !q.dead && q.data && q.data.peonFinca);
  const lejos = Math.hypot(H.casa.x + ANCHO / 2 - p.x, H.casa.z + FONDO / 2 - p.z) > 60;
  if (!m) {
    if (!deDia || lejos || g.asedio || g.ceniza || !g.world.isLoaded(H.casa.x, H.casa.z)) return;
    if (!llegar(g, H)) return;
    if (!H.peonVisto) { H.peonVisto = g.day || 1; g.ui.toast('🌾 Un señor con machete viene a la casa: anda buscando trabajo', 3800); }
    return;
  }
  if (!deDia) { if (!m.data.irse) { m.data.arreo = false; decir(g, m, 'Hasta mañana. Se me cuida.', 3); m.data.irse = 4; } return; }
  if (!H.peon) { m.moving = false; return; }
  // el trabajo
  m.data.charla = (m.data.charla || 0) - 1;
  if (m.data.charla <= 0) { m.data.charla = 30 + Math.random() * 30; if (Math.hypot(m.body.pos.x - p.x, m.body.pos.z - p.z) < 16) decir(g, m, FRASES[(Math.random() * FRASES.length) | 0], 3); }
  const b = m.body.pos;
  let M = m.data.mata;
  if (M) { const id = BLOCKS[g.world.getBlock(M.x, M.y, M.z)]; if (!id || !id.crop || id.stage !== 3) M = m.data.mata = null; }
  if (!M) M = m.data.mata = buscarMata(g, H);
  if (!M) { m.moving = false; return; }
  const d = Math.hypot(M.x + 0.5 - b.x, M.z + 0.5 - b.z);
  if (d > 1.6) { m.goTo(M.x + 0.5, M.z + 0.5, 1.5); return; }
  m.moving = false;
  const [id, n] = COSECHA[M.b.crop], nuevo = K[`${M.b.crop}0`];
  if (!guardar(g, H, id, n)) {
    if (!H.peonLleno) { H.peonLleno = true; g.ui.toast('🌾 Don Chepito dice que el cofre de la abuela está lleno', 3200); }
    return;
  }
  H.peonLleno = false;
  H.peonCosechas = (H.peonCosechas || 0) + 1;
  if (nuevo) g.world.setBlock(M.x, M.y, M.z, nuevo, { updates: false }); else g.world.setBlock(M.x, M.y, M.z, AIR);
  g.particles.burst(M.x + 0.5, M.y + 0.5, M.z + 0.5, [[0.5, 0.9, 0.4], [0.9, 0.8, 0.3]], 8, 1.2);
  m.lunge = 0.4; // se agacha a cortar
  if (Math.hypot(M.x - p.x, M.z - p.z) < 24) g.audio.play('dig.leaves', { pos: { x: M.x + 0.5, y: M.y + 0.5, z: M.z + 0.5 }, vol: 0.6 });
  m.data.mata = null;
}
export function peonFincaInteract(m, g) {
  if (!m.data.peonFinca) return false;
  const H = g.meta.hist, nom = m.data.name;
  if (H.peon) { g.ui.dialog(nom, `Lo que esté maduro lo cosecho y lo guardo en el cofre de doña Zenaida. Llevo ${H.peonCosechas || 0} matas.`, 3600); return true; }
  if (!H.peonOfreció) {
    H.peonOfreció = true;
    g.ui.dialog(nom, `Trabajé aquí con doña Zenaida. Por ${PRECIO} colones, una sola vez, le cuido la finca: cosecho, vuelvo a sembrar y le guardo todo en el cofre. Hábleme otra vez si le sirve.`, 7000);
    return true;
  }
  if (g.inventory.count(COLON) < PRECIO) { g.ui.dialog(nom, `Son ${PRECIO} colones. Yo espero, que el maíz no se va a ningún lado.`, 3200); return true; }
  g.inventory.remove(COLON, PRECIO);
  H.peon = g.day || 1;
  g.audio.play('aplausos', { ui: true, vol: 0.3 });
  g.ui.dialog(nom, 'Hecho. Usted vaya a lo suyo, que de esto me encargo yo.', 3600);
  g.achieve('peon_finca', 'Alguien cuida la finca');
  anotar(g, 'Don Chepito se quedó a cuidar la finca.', '🌾');
  return true;
}
