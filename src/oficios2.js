// C6 «Manos de maestro» (v12.15.1, docs/revisiones/DISENO_CONTENIDO_C5-C8.md §C6): tres oficios (carpintería, herrería, alfarería) con su
// taller, su nivel (0–10, con uso) y su libro; el mostrador que vende solo; y los pequeños bonos de lo que se hace (olla, comal, herradura).
// Sin SAVE_FORMAT nuevo: todo vive en meta.maestro (campos opcionales leídos con ??), un mundo viejo carga igual.
// Lo que cambia estado (nivel, venta del mostrador, leña) lo decide quien tiene el mundo: los talleres y el mostrador no se abren desde una
// ficha de invitado (game.js lo corta), y el tick solo corre donde corre el mundo.
import { BLOCK_BY_KEY as K, itemName } from './blocks.js';
import { difOf } from './supervivencia.js';
import { K as K_UNIDAD, cobrarDelTope } from './plata.js';
import { factorMayordomo } from './mayordomia.js'; // v12.15.4 (C8-B): ×1.5 al mayordomo durante la fiesta

export const OFICIOS = {
  carpinteria: { nombre: 'Carpintería', libro: 1150, icono: '🪚' },
  herreria: { nombre: 'Herrería', libro: 1151, icono: '🔨' },
  alfareria: { nombre: 'Alfarería', libro: 1152, icono: '🏺' },
};
export const UMBRALES = [10, 25, 45, 70, 100, 140, 190, 250, 320, 400]; // XP acumulada para cada nivel (1 a 10)
const M = (g) => (g.meta.maestro ||= { xp: {}, libros: {}, mostr: {}, obras: 0 });
const tranquilo = (g) => difOf(g) && difOf(g).name === 'Tranquilo';

// precio base (unidades de 500) de lo que se vende en el mostrador y da experiencia; lo demás (herramientas, engobes, barro) no se vende
export const PRECIO = new Map([
  [1138, 1], [1137, 0.5], [1135, 0.4], [1136, 1.5], [K.mesa_grande, 13], [K.alacena, 15], [K.mostrador, 10], [K.armario, 18], [K.puerta_tallada, 10], [1149, 12],
  [1133, 8], [1134, 8], [1143, 1.75], [1144, 9], [K.verja_forjada, 7.5], [K.farol_forjado, 8], [1145, 3], [1146, 3], [K.tinaja, 6], [K.teja, 0.6],
  [1147, 8], [K.jarron_chorotega, 9], [K.chanchito, 9],
]);

export const nivelDeXp = (xp) => UMBRALES.filter((u) => xp >= u).length;
export const xpDe = (g, o) => (M(g).xp[o] || 0);
// el nivel que cuenta: sin el libro del oficio solo vale el nivel 0; con el libro, del 3 para arriba (1 a 3 los abre el libro; 4 a 10, el uso)
export const nivelDe = (g, o) => (M(g).libros[o] ? Math.max(3, nivelDeXp(xpDe(g, o))) : 0);
export const nivelMax = (g) => Math.max(0, ...Object.keys(OFICIOS).map((o) => nivelDe(g, o)));

// lo que saberes.js suma a las recetas conocidas: «of:oficio:n» por cada nivel alcanzado
export function conocidasOficios(g, set) {
  if (!g.meta || !g.meta.maestro) return set;
  for (const o of Object.keys(OFICIOS)) for (let n = 1; n <= nivelDe(g, o); n++) set.add(`of:${o}:${n}`);
  return set;
}

// clic derecho con el libro en la mano: abre los niveles 1 a 3 de ese oficio
export function usarLibroOficio(g, held) {
  const o = Object.keys(OFICIOS).find((k) => OFICIOS[k].libro === held.id);
  if (!o) return false;
  if (M(g).libros[o]) { g.ui.toast(`${OFICIOS[o].icono} Ya sabe lo que enseña este libro. Siga practicando: del nivel 4 en adelante se gana con el uso`, 3200); return true; }
  M(g).libros[o] = 1;
  if (g.mode === 'survival') g.inventory.consumeHeld(1);
  g.ui.toast(`${OFICIOS[o].icono} ${OFICIOS[o].nombre}: se le abrieron los niveles 1 a 3. Búsquelos en el libro de recetas del taller`, 4200);
  g.audio.play('craft', { ui: true, vol: 0.5, pitch: 1.1 });
  g.achieve('oficio', 'Manos de maestro');
  return true;
}

// ---------- el taller: herramienta, leña y experiencia ----------
const tieneLena = (be) => be.lena ?? 0;
export function usarTaller(g, t, held) { // clic derecho a la fragua o al horno de barro con leña: la carga (hasta 16)
  const b = g.world.getBlock(t.x, t.y, t.z);
  if (b !== K.fragua && b !== K.horno_barro) return false;
  if (!held || held.id !== 561) return false;
  let be = g.world.getBE(t.x, t.y, t.z);
  if (!be) { be = { type: 'taller', taller: b === K.fragua ? 'herreria' : 'horno', grid: new Array(9).fill(null), lena: 0 }; g.world.setBE(t.x, t.y, t.z, be); }
  const tiene = tieneLena(be);
  if (tiene >= 16) { g.ui.toast('🔥 Está llena (16 leñas)', 1600); return true; }
  const n = Math.min(16 - tiene, held.count, (g.keys.has('ShiftLeft') || g.keys.has('ShiftRight')) ? 16 : 1);
  be.lena = tiene + n;
  if (g.mode === 'survival') g.inventory.consumeHeld(n);
  g.world.touchBE(t.x, t.y, t.z);
  g.audio.material('wood', 'place', { x: t.x + 0.5, y: t.y + 1, z: t.z + 0.5 });
  g.ui.toast(`🪵 Leña: ${be.lena} de 16`, 1300);
  return true;
}
export const lenaTaller = (g, st) => { const be = st && g.world.getBE(st.x, st.y, st.z); return be ? tieneLena(be) : 0; };
// antes de fabricar una tanda: ¿está la herramienta y hay leña? (gasta 1; en Tranquilo, media). Sin dificultad de supervivencia no se gasta nada
export function puedeTaller(g, st, r) {
  if (!st || st.type !== 'taller' || !r.taller || g.mode !== 'survival') return true;
  if (r.herr && g.inventory.count(r.herr) < 1) { g.ui.toast(`🧰 Le falta la herramienta: ${itemName(r.herr)} (llévela en la mochila)`, 3000); return false; }
  if (r.lena) {
    const be = g.world.getBE(st.x, st.y, st.z);
    if (!be) return true;
    const gasto = tranquilo(g) ? 0.5 : 1;
    if (tieneLena(be) < gasto) { g.ui.toast('🔥 Se acabó la leña: échele con clic derecho (con leña en la mano)', 3000); return false; }
    be.lena = Math.round((tieneLena(be) - gasto) * 2) / 2;
    g.world.touchBE(st.x, st.y, st.z);
  }
  return true;
}
// después de fabricar: experiencia (2 + valor/2 por pieza), subidas de nivel y la obra maestra
export function alFabricarTaller(g, st, r) {
  if (!r.taller || g.mode !== 'survival') return;
  const o = r.oficio, valor = (PRECIO.get(r.out[0]) || 0) * r.out[1], antes = nivelDeXp(xpDe(g, o));
  M(g).xp[o] = xpDe(g, o) + Math.round(2 + valor / 2);
  const ahora = nivelDeXp(xpDe(g, o));
  if (ahora > antes) {
    const libro = M(g).libros[o];
    g.ui.toast(`${OFICIOS[o].icono} ${OFICIOS[o].nombre}: nivel ${ahora}${!libro && ahora >= 1 ? ' (sin el libro, las recetas nuevas siguen cerradas: se compra en el Mercado Central)' : ''}`, 3600);
    g.audio.play('craft', { ui: true, vol: 0.5, pitch: 1.15 });
    if (ahora >= 10) g.achieve('maestro10', 'Maestro de oficio');
  }
  if (valor >= 5 && nivelDe(g, o) >= 8 && g.inventory.count(1153) > 0 && Math.random() < 0.1) {
    M(g).obras = (M(g).obras || 0) + 1;
    pagar(g, valor * 0.5);
    g.ui.toast('🏅 ¡Obra maestra! Salió tan buena que se la pagaron aparte', 3200);
  }
}

// ---------- el mostrador (tienda propia) ----------
// lo registra game.js cuando cambia un bloque; el tick lo corre una vez por segundo (donde corre el mundo)
export function alCambiarBloqueOficio(g, x, y, z, old, id) {
  const k = `${x},${y},${z}`;
  if (id === K.mostrador) M(g).mostr[k] = 1;
  else if (old === K.mostrador) delete M(g).mostr[k];
}
const pagar = (g, u) => { if (u > 0) g.inventory.darColones ? g.inventory.darColones(Math.round(u * K_UNIDAD)) : null; };
export function tickMostradores(g, dt = 1) {
  const m = g.meta.maestro;
  if (!m || g.dim !== 'tierra' || g.mode !== 'survival') return;
  const hora = ((g.time || 0) * 24 + 6) % 24;
  if (hora < 8 || hora >= 17) return;
  const hoy = g.day || 1, tope = 10 + 4 * nivelMax(g);
  if (m.venta === undefined || m.venta.dia !== hoy) m.venta = { dia: hoy, n: 0 };
  for (const k of Object.keys(m.mostr || {})) {
    const [x, y, z] = k.split(',').map(Number);
    const be = g.world.getBE(x, y, z);
    if (!be || !Array.isArray(be.slots)) continue; // el trozo no está cargado
    be.t = (be.t || 0) + dt;
    if (be.t < 90) continue;
    be.t = 0;
    if (m.venta.n >= tope) continue;
    const i = be.slots.findIndex((s) => s && PRECIO.has(s.id));
    if (i < 0) continue;
    const s = be.slots[i], u = PRECIO.get(s.id) * (1 + 0.0125 * nivelMax(g)) * factorMayordomo(g);
    s.count--; if (s.count <= 0) be.slots[i] = null;
    m.venta.n++;
    be.caja = (be.caja || 0) + Math.round(cobrarDelTope(g, u) * K_UNIDAD);
    g.world.touchBE(x, y, z);
  }
}
// al abrir el mostrador: la caja pasa a la billetera
export function cobrarCaja(g, be) {
  if (!be || be.type !== 'mostrador' || !(be.caja > 0)) return;
  const c = be.caja;
  be.caja = 0;
  if (g.inventory.darColones) g.inventory.darColones(c);
  g.ui.toast(`🛒 La caja del mostrador: ₡${c.toLocaleString('es-CR')}`, 3200);
}

// ---------- bonos de lo hecho a mano ----------
// olla de barro en la mochila: los platos salen un 10 % más llenos; comal: tortillas y arepas dan 1 más
export function bonoOficio(g, id, food) {
  if (g.mode !== 'survival') return { mult: 1, add: 0 };
  return { mult: food >= 6 && g.inventory.count(1145) > 0 ? 1.1 : 1, add: (id === 270 || id === 394) && g.inventory.count(1146) > 0 ? 1 : 0 };
}
export const velocidadCaballo = (g) => (g.inventory.count(1143) > 0 ? 1.1 : 1); // herradura en la mochila
