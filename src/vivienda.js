// Mi lote y mi casa: la escritura (la del pueblo, que se saca en la municipalidad después del trámite, o la de
// lujo con vista al mar) se usa sobre el terreno y ese lote queda suyo. Después la «misión de vivienda» revisa
// lo que va construyendo alrededor (paredes, techo, puerta, cama, cocina, cofre y luz) y paga cada paso; al
// terminar la casa llega el bono de vivienda… con unos añitos de atraso.
import { BLOCKS, BLOCK_BY_KEY as K } from './blocks.js';

export const ESCRITURAS = [389, 413];
const COLON = 360;
const R = 7;

const WALL = new Set(['planks', 'bricks', 'bloque_concreto', 'adobe', 'plaster', 'cobble', 'paint_blue', 'paint_green', 'paint_yellow', 'paint_pink', 'repello_rojo', 'smooth_stone', 'concreto', 'glass', 'log', 'jungle_log', 'birch_log', 'stone', 'sandstone', 'mossy'].map((k) => K[k]).filter(Boolean));
const ROOF = new Set(['zinc', 'teja', 'losa_teja', 'lamina_metal'].map((k) => K[k]).filter(Boolean));
const LIGHT = new Set(['lamp', 'farol', 'torch', 'wall_torch0', 'wall_torch1', 'wall_torch2', 'wall_torch3', 'quartz_lamp'].map((k) => K[k]).filter(Boolean));

export const PASOS = [
  { key: 'paredes', title: 'Levantar paredes', hint: '40 bloques de pared (madera, bloques, adobe, ladrillo…) en el lote', ok: (c) => c.walls >= 40 },
  { key: 'techo', title: 'Ponerle techo', hint: '20 de zinc o de teja arriba de la casa', ok: (c) => c.roof >= 20 },
  { key: 'puerta', title: 'Una puerta', hint: 'Para que no se le meta el perro del vecino', ok: (c) => c.door },
  { key: 'cama', title: 'Una cama', hint: 'Para dormir en lo propio', ok: (c) => c.bed },
  { key: 'cocina', title: 'La cocina de leña', hint: 'Un fogón para el gallo pinto', ok: (c) => c.stove },
  { key: 'cofre', title: 'Un cofre', hint: 'Para guardar las cositas', ok: (c) => c.chest },
  { key: 'luz', title: 'Luz', hint: 'Un bombillo, farol o antorcha', ok: (c) => c.light },
];

// usar la escritura apuntando al suelo
export function useEscritura(g, held, t) {
  if (!t || g.dim !== 'tierra') { g.ui.toast('📜 Apunte al terreno donde quiere su lote (en la Tierra)', 2200); return; }
  const top = t.y + 1;
  if (g.meta.lote) {
    const L = g.meta.lote;
    g.ui.toast(`📜 Usted ya tiene un lote en ${Math.round(L.x)}, ${Math.round(L.z)}. Este nuevo lo reemplaza.`, 2600);
  }
  g.meta.lote = { x: t.x, y: top, z: t.z, vista: held.id === 389, day: g.day || 1 };
  g.meta.casa = {};
  if (g.mode === 'survival') g.inventory.consumeHeld(1);
  // estacas en las esquinas del lote
  for (const [dx, dz] of [[-R, -R], [R, -R], [-R, R], [R, R]]) {
    const x = t.x + dx, z = t.z + dz;
    for (let y = top + 4; y > top - 6; y--) {
      if (BLOCKS[g.world.getBlock(x, y, z)].solid) { if (!g.world.getBlock(x, y + 1, z)) g.world.setBlock(x, y + 1, z, K.cerca); break; }
    }
  }
  g.particles.burst(t.x + 0.5, top + 0.5, t.z + 0.5, [[1, 0.9, 0.4], [0.6, 1, 0.5]], 30, 2.5);
  g.audio.play('monedas', { ui: true, vol: 0.5 });
  g.ui.toast(held.id === 389 ? '🏖 ¡Lote con vista al mar! Las estacas marcan las esquinas. Abra la ruta (J) para ver la misión de vivienda' : '🏠 ¡Este lote ahora es suyo! Las estacas marcan las esquinas. Abra la ruta (J) para ver la misión de vivienda', 4200);
  g.achieve('lote', 'Un lote a mi nombre');
}

function contar(g, L) {
  const c = { walls: 0, roof: 0, door: false, bed: false, stove: false, chest: false, light: false };
  const w = g.world;
  for (let dz = -R; dz <= R; dz++) for (let dx = -R; dx <= R; dx++) for (let dy = -2; dy <= 9; dy++) {
    const id = w.getBlock(L.x + dx, L.y + dy, L.z + dz);
    if (!id) continue;
    if (WALL.has(id) && dy >= 0 && dy <= 5) c.walls++;
    else if (ROOF.has(id) && dy >= 2) c.roof++;
    else if (BLOCKS[id].door) c.door = true;
    else if (BLOCKS[id].bed) c.bed = true;
    else if (id === K.stove) c.stove = true;
    else if (id === K.chest || id === K.baul) c.chest = true;
    else if (LIGHT.has(id)) c.light = true;
  }
  return c;
}

// cada pocos segundos revisa la casa (solo si el lote está cargado)
export function tickVivienda(g) {
  const L = g.meta.lote;
  if (!L || g.dim !== 'tierra' || !g.world.isLoaded(L.x, L.z)) return;
  const p = g.player.body.pos;
  if (Math.hypot(p.x - L.x, p.z - L.z) > 48) return;
  g.viviendaT = (g.viviendaT || 0) - 1;
  if (g.viviendaT > 0) return;
  g.viviendaT = 3;
  const st = (g.meta.casa = g.meta.casa || {});
  const c = contar(g, L);
  for (const paso of PASOS) {
    if (st[paso.key] || !paso.ok(c)) continue;
    st[paso.key] = g.day || 1;
    const left = g.inventory.add(COLON, 5);
    if (left) g.entities.dropItem(COLON, left, p.x, p.y + 1, p.z);
    g.ui.toast(`🏠 Casa: ✔ ${paso.title} (+5 colones)`, 2400);
    g.audio.play('nivel', { ui: true, vol: 0.35 });
  }
  if (!st.final && PASOS.every((s) => st[s.key])) {
    st.final = g.day || 1;
    g.ui.regionBanner('¡Casa propia!', L.vista ? 'Con vista al mar y todo. ¡Pura vida!' : 'Hecha a mano en su propio lote. ¡Pura vida!');
    g.achieve('casa_propia', 'Casa propia');
    g.addXP(40);
    g.audio.play('aplausos', { ui: true, vol: 0.5 });
    st.bono = (g.day || 1) + 3;
  }
  // el bono de vivienda: llega, pero tres días tarde
  if (st.bono && (g.day || 1) >= st.bono && !st.bonoPagado) {
    st.bonoPagado = true;
    const left = g.inventory.add(COLON, 30);
    if (left) g.entities.dropItem(COLON, left, p.x, p.y + 1, p.z);
    g.ui.toast('📨 Llegó el bono de vivienda: 30 colones… para una casa que ya terminó hace días', 4200);
    g.achieve('bono', 'El bono llegó (tarde)');
  }
}

export function viviendaHTML(g) {
  const L = g.meta.lote;
  if (!L) return '<li class="next casa"><b>🏠 Mi casa</b><span>Saque una escritura de lote en la municipalidad de cualquier pueblo (el trámite tarda un día) y úsela sobre el terreno.</span></li>';
  const st = g.meta.casa || {};
  const first = PASOS.findIndex((s) => !st[s.key]);
  return `<li class="casa ${st.final ? 'ok' : ''}"><b>🏠 Mi casa ${L.vista ? '(con vista al mar)' : ''} · ${Math.round(L.x)}, ${Math.round(L.z)}</b></li>` +
    PASOS.map((s, i) => `<li class="${st[s.key] ? 'ok' : i === first ? 'next' : ''}"><b>${st[s.key] ? '✔' : i === first ? '➜' : '·'} ${s.title}</b>${!st[s.key] && i === first ? `<span>${s.hint}</span>` : ''}</li>`).join('');
}
