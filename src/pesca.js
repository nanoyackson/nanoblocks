// C5-A1 «Pesca a fondo» (v12.7.0, docs/revisiones/DISENO_CONTENIDO_C5-C8.md §C5-A y PREPARACION_C5_Y_JEFES_F2.md §1).
// Lo que pica depende de DÓNDE cae la boya (la zona), de la CARNADA que se lleve en la barra y de la CAÑA:
// - zonas: río, río frío (altura ≥ 90, páramo o nuboso), estero (manglar), orilla de mar, arrecife (coral vivo a ≤ 6) y altamar
//   (≥ 140 bloques de la costa, en bote, con la caña de altamar). Sin la caña que pide la zona, pica lo de la zona más cercana;
// - carnada: la lombriz para el río, el señuelo para el estero, la sardina para el mar (y el arrecife, mientras no haya camarón).
//   Sin la carnada de la zona se espera más (×1.4); con ella, lo de siempre. La lombriz y la sardina se gastan al picar; el
//   señuelo dura 60 usos;
// - el ingreso NO sube (la preparación lo midió: la pesca ya es lo mejor pagado). Lo que cambia es la variedad: las especies nuevas
//   solo se compran (no se venden en tienda), la perla baja del 3 % al 1 % y, tras 10 especies «buenas» en la misma celda de
//   48 × 48 el mismo día, ahí solo pica lo común (hay que moverse);
// - libro del pescador (pestaña de la libreta, meta.pesca.libro): cada especie con cuántas y su récord de tamaño.
// Guardado: meta.pesca = { libro: { id: { n, mejor } }, celdas: { 'cx,cz': { dia, n } } } (opcional, se lee con ??).
import { BLOCK_BY_KEY as K, getDef, esPescado } from './blocks.js';
import { SEA } from './worldgen.js';
import { lv as skillLv } from './habilidades.js';

export const CANA = 357, CANA_FIBRA = 1100, CANA_ALTAMAR = 1101, LOMBRIZ = 1102, SARDINA = 1103, SENUELO = 1104, CAMARON = 1114;
export const PEZ = { machaca: 1105, tilapia: 1106, robalo: 1107, trucha: 1108, sabalo: 1109, pez_gallo: 1110, atun: 1111, pargo_mancha: 1112 };
const NIVEL_CANA = { [CANA]: 1, [CANA_FIBRA]: 2, [CANA_ALTAMAR]: 3 };
export const nivelCana = (id) => NIVEL_CANA[id] || 1;

// las tablas suman 0.88: el 12 % restante es la basura (abajo). Pesos de la preparación §1.5
export const ZONAS = {
  rio: { nombre: 'río', min: 1, carnada: [LOMBRIZ], t: { 363: 0.36, 1105: 0.28, 1106: 0.24 } },
  rioFrio: { nombre: 'río frío', min: 2, sino: 'rio', carnada: [LOMBRIZ], t: { 1108: 0.3, 363: 0.28, 1105: 0.2, 1106: 0.1 } },
  estero: { nombre: 'estero', min: 2, sino: 'rio', carnada: [SENUELO], t: { 1107: 0.22, 1109: 0.12, 362: 0.2, 1106: 0.16, 363: 0.18 } },
  orilla: { nombre: 'orilla de mar', min: 1, carnada: [SARDINA], t: { 362: 0.4, 361: 0.38, 364: 0.05, 1110: 0.05 } },
  arrecife: { nombre: 'arrecife', min: 2, sino: 'orilla', carnada: [CAMARON, SARDINA], t: { 1112: 0.2, 361: 0.28, 362: 0.24, 1110: 0.1, 364: 0.06 } },
  altamar: { nombre: 'altamar', min: 3, sino: 'orilla', carnada: [SARDINA, SENUELO], t: { 361: 0.32, 362: 0.28, 1110: 0.12, 364: 0.1, 1111: 0.06 } },
};
// las que pagan 1.5 u o más: cuentan para el agotamiento de la celda
const BUENOS = new Set([364, 1107, 1109, 1110, 1111, 1112]);
const AGOTA = 10;
// largo normal (cm) de cada especie, para el récord del libro
export const LARGO = { 361: 45, 362: 50, 363: 30, 364: 90, 1105: 25, 1106: 30, 1107: 70, 1108: 35, 1109: 120, 1110: 80, 1111: 110, 1112: 40 };
export const ESPECIES = Object.keys(LARGO).map(Number);

const P = (g) => {
  const M = g.meta.pesca && typeof g.meta.pesca === 'object' ? g.meta.pesca : (g.meta.pesca = {});
  if (!M.libro || typeof M.libro !== 'object') M.libro = {};
  if (!M.celdas || typeof M.celdas !== 'object') M.celdas = {};
  for (const [k, c] of Object.entries(M.celdas)) if (!c || typeof c !== 'object' || !Number.isFinite(c.n) || !Number.isFinite(c.dia)) delete M.celdas[k]; // v12.8.3: de un mundo importado
  return M;
};

// «¿está a 140 bloques de tierra?» por celda de 16 (el terreno del generador no cambia)
const LEJOS = new Map();
// la zona donde cayó la boya (se calcula una vez, al caer al agua)
export function zonaDe(g, p) {
  const w = g.world, x = Math.floor(p.x), z = Math.floor(p.z), bio = w.gen.column(x, z).biome;
  if (bio === 'manglar') return 'estero';
  if (bio !== 'ocean' && bio !== 'beach') return p.y >= 90 || bio === 'paramo' || bio === 'nuboso' ? 'rioFrio' : 'rio';
  // coral vivo cerca del fondo
  const vivos = new Set(['coral_red', 'coral_orange', 'coral_yellow', 'coral_purple'].map((k) => K[k]));
  for (let dx = -6; dx <= 6; dx++) for (let dz = -6; dz <= 6; dz++) for (let y = Math.floor(p.y) - 1; y > Math.floor(p.y) - 12; y--) if (vivos.has(w.getBlock(x + dx, y, z + dz))) return 'arrecife';
  // qué tan lejos está la tierra: anillos cada 10 bloques hasta 140
  // v12.8.3 (decimosexta revisión, punto 3): antes 16 ángulos por anillo (a 140 bloques, una muestra cada 55: un islote se colaba).
  // Ahora una muestra cada ≤ 12 bloques en todos los anillos, y el resultado se guarda por celda de 16 (no se recalcula cada lance)
  const ck = `${x >> 4},${z >> 4}`;
  let lejos = LEJOS.get(ck);
  if (lejos === undefined) {
    lejos = true;
    for (let r = 10; r <= 140 && lejos; r += 10) { const n = Math.max(16, Math.ceil((2 * Math.PI * r) / 12)); for (let a = 0; a < n; a++) { const t = (a / n) * Math.PI * 2; if (w.gen.column(Math.floor(x + Math.cos(t) * r), Math.floor(z + Math.sin(t) * r)).h >= SEA) { lejos = false; break; } } }
    if (LEJOS.size > 400) LEJOS.clear();
    LEJOS.set(ck, lejos);
  }
  return lejos && g.riding && g.riding.kind && g.riding.kind.boat ? 'altamar' : 'orilla';
}
// la zona que vale con esta caña: si no alcanza, la más cercana que sí
export function zonaConCana(zona, cana) { let z = zona; while (ZONAS[z].min > nivelCana(cana) && ZONAS[z].sino) z = ZONAS[z].sino; return z; }
// la primera carnada de la barra que le sirve a la zona
export function carnadaDe(g, zona) {
  const pide = ZONAS[zona].carnada, inv = g.inventory;
  for (let i = 0; i < 9; i++) { const s = inv.slots[i]; if (s && pide.includes(s.id)) return s.id; }
  return null;
}

// lo llama mar.js (Bobber) cuando la boya cae al agua: zona, caña y carnada, y la espera (×1.4 sin la carnada de la zona)
export function alCaerAgua(g, f) {
  const held = g.inventory.held, cana = held ? held.id : CANA;
  f.zonaReal = zonaDe(g, f.pos);
  f.zona = zonaConCana(f.zonaReal, cana);
  f.carnada = carnadaDe(g, f.zona);
  if (!f.carnada) f.biteAt = f.t + (f.biteAt - f.t) * 1.4;
}

function sortear(t) {
  let r = Math.random() * Object.values(t).reduce((a, b) => a + b, 0);
  for (const [id, w] of Object.entries(t)) { r -= w; if (r <= 0) return +id; }
  return +Object.keys(t)[0];
}
// lo que sale (sin efectos): basura del 12 % (perla 1 %) y la tabla de la zona
export function lootZona(zona, agotada = false) {
  const r = Math.random();
  if (r < 0.005) return { id: 369, n: 1, msg: '¡Una perla!' }; // v12.8.4: 0.5 % (antes 1: la paga 18 u el muelle)
  if (r < 0.015) return { id: 259, n: 1 + Math.floor(Math.random() * 2), msg: '¡Oro de un naufragio!' }; // v12.8.3: 0.5 % (antes 1.5: la pulpería lo paga a 10)
  if (r < 0.085) return { id: 368, n: 1, msg: 'Una bota vieja… 🙄' };
  if (r < 0.105) return { id: 256, n: 2, msg: 'Palitos' };
  if (r < 0.12) return { id: 444, n: 1, msg: '¡Una botella con un mapa adentro!' };
  let t = ZONAS[zona].t;
  if (agotada) { t = Object.fromEntries(Object.entries(t).filter(([id]) => !BUENOS.has(+id))); if (!Object.keys(t).length) t = { 362: 1 }; }
  return { id: sortear(t), n: 1 };
}

// lo llama game.js (useRod) al recoger con el pez picado: el pescado, la carnada que se gasta, la celda y el libro
export function pescar(g, f) {
  const M = P(g), hoy = g.day || 1, zona = f.zona || 'orilla';
  const ck = `${Math.floor(f.pos.x / 48)},${Math.floor(f.pos.z / 48)}`, C = M.celdas[ck] && M.celdas[ck].dia === hoy ? M.celdas[ck] : (M.celdas[ck] = { dia: hoy, n: 0 });
  // v12.8.3 (punto 4): se suman la celda y sus 8 vecinas (antes, parado junto a una raya, cada lado tenía su propio 10)
  const cx0 = Math.floor(f.pos.x / 48), cz0 = Math.floor(f.pos.z / 48);
  let suma = 0; for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) { const V = M.celdas[`${cx0 + dx},${cz0 + dz}`]; if (V && V.dia === hoy) suma += Number(V.n) || 0; }
  const agotada = suma >= AGOTA;
  const loot = lootZona(zona, agotada);
  if (BUENOS.has(loot.id)) C.n++;
  if (suma + 1 === AGOTA && BUENOS.has(loot.id)) loot.msg = '🎣 Aquí ya pescó bastante de lo bueno hoy: lo grande se fue. Pruebe en otro lado';
  const cel = Object.keys(M.celdas); if (cel.length > 60) for (const k of cel) if (M.celdas[k].dia !== hoy) delete M.celdas[k]; // no crece sin fin
  // la carnada: la lombriz y la sardina se gastan; el señuelo pierde un uso
  if (f.carnada && g.mode === 'survival') {
    const inv = g.inventory;
    if (f.carnada === SENUELO) {
      const i = inv.slots.findIndex((s) => s && s.id === SENUELO);
      if (i >= 0) { const s = inv.slots[i]; s.dur = (s.dur ?? 60) - 1; if (s.dur <= 0) inv.slots[i] = null; inv.changed && inv.changed(); }
    } else inv.remove(f.carnada, 1);
  }
  // el libro: cuántas y el récord de tamaño (el nivel de pesca sube el piso)
  if (esPescado(loot.id) && LARGO[loot.id]) {
    const L = M.libro[loot.id] && typeof M.libro[loot.id] === 'object' ? M.libro[loot.id] : (M.libro[loot.id] = { n: 0, mejor: 0 });
    const piso = Math.min(1, 0.7 + skillLv(g, 'pesca') * 0.02), tam = piso + Math.random() * (1.3 - piso), cm = Math.round(LARGO[loot.id] * tam);
    const nueva = !(L.n > 0);
    L.n = (Number(L.n) || 0) + 1;
    const nombre = ((getDef(loot.id) || {}).name || 'pez').toLowerCase();
    if (nueva) {
      const tiene = ESPECIES.filter((id) => M.libro[id] && M.libro[id].n > 0).length;
      loot.msg = `📗 ¡${nombre[0].toUpperCase()}${nombre.slice(1)} para el libro del pescador! (${cm} cm · ${tiene} de ${ESPECIES.length})`;
      if (tiene >= 6) g.achieve('libro_pesca6', 'Medio libro del pescador');
      if (tiene >= ESPECIES.length) g.achieve('libro_pesca', 'El libro del pescador completo');
    } else if (cm > (Number(L.mejor) || 0)) loot.msg = loot.msg || `📏 ¡Récord de ${nombre}: ${cm} cm!`;
    L.mejor = Math.max(Number(L.mejor) || 0, cm);
    if (f.zona === 'altamar') g.achieve('altamar', 'Mar adentro');
  }
  return loot;
}

// la pestaña «Pesca» de la libreta
export function libroPescaHTML(g) {
  const M = P(g), tiene = ESPECIES.filter((id) => M.libro[id] && M.libro[id].n > 0).length;
  const zonaDeEspecie = (id) => Object.values(ZONAS).filter((Z) => Z.t[id]).map((Z) => Z.nombre).join(', ');
  let h = `<div class="lib-scroll"><p class="mana-nota">📗 Libro del pescador: ${tiene} de ${ESPECIES.length} especies. Lleve carnada en la barra: la lombriz para el río, el señuelo para el estero y la sardina para el mar.</p><ul class="lib-lista">`;
  for (const id of ESPECIES) {
    const L = M.libro[id], d = getDef(id) || {};
    h += L && L.n > 0 ? `<li>🐟 <b>${d.name}</b>: ${L.n} · récord ${L.mejor} cm <small>(${zonaDeEspecie(id)})</small></li>` : `<li>❔ <i>Sin pescar</i> <small>(${zonaDeEspecie(id)})</small></li>`;
  }
  return `${h}</ul></div>`;
}

// ---------- v12.7.2 (C5-A2): la nasa por zona, mariscos, veda y secadero ----------
export const LANGOSTA = 1113, PIANGUA = 1115, OSTION = 1116, PESCADO_SECO = 1120, SAL = 562, CARETA = 445;
// la nasa: dónde se pone decide qué saca (monte.js). Sin zona (las puestas antes de la 12.7.2): la tabla de siempre.
// v12.8.2: el estero cada 450 s y el arrecife cada 900 s (con 6 nasas el pescador pasaba de 65 u al día; meta ≈ 45–55)
export const NASA = {
  rio: { media: 300, presa: [[363, 1, 0.4], [1105, 1, 0.3], [1106, 1, 0.3]] },
  orilla: { media: 450, presa: [[361, 1, 0.35], [362, 1, 0.35], [CAMARON, 1, 0.2], [368, 1, 0.1]] }, // v12.8.3: el mar sin coral (antes salían peces de río)
  estero: { media: 450, presa: [[CAMARON, 1, 0.5], [1107, 1, 0.2], [1106, 1, 0.2], [368, 1, 0.1]] },
  arrecife: { media: 900, presa: [[CAMARON, 1, 0.35], [OSTION, 1, 0.2], [1112, 1, 0.25], [LANGOSTA, 1, 0.03], [368, 1, 0.17]] },
};
export const MAX_NASAS = 6;
export function zonaNasa(g, x, y, z) {
  const w = g.world, bio = w.gen.column(x, z).biome;
  if (bio === 'manglar') return 'estero';
  const vivos = new Set(['coral_red', 'coral_orange', 'coral_yellow', 'coral_purple'].map((k) => K[k]));
  for (let dx = -4; dx <= 4; dx++) for (let dz = -4; dz <= 4; dz++) for (let dy = -4; dy <= 1; dy++) if (vivos.has(w.getBlock(x + dx, y + dy, z + dz))) return 'arrecife';
  return bio === 'ocean' || bio === 'beach' ? 'orilla' : 'rio'; // v12.8.3: el mar sin coral, con su tabla
}

// la veda de la piangua: 4 días de cada 30 (los días 11 a 14 de cada mes del juego)
export const enVeda = (g) => { const d = ((g.day || 1) - 1) % 30; return d >= 10 && d <= 13; };
const Mar = (g) => {
  const M = g.meta.mariscos && typeof g.meta.mariscos === 'object' ? g.meta.mariscos : (g.meta.mariscos = {});
  if (!M.matas || typeof M.matas !== 'object') M.matas = {};
  if (!M.fondo || typeof M.fondo !== 'object') M.fondo = {};
  for (const [k, c] of Object.entries(M.matas)) if (!c || typeof c !== 'object' || !Number.isFinite(c.n) || !Number.isFinite(c.dia)) delete M.matas[k]; // v12.8.3: de un mundo importado
  for (const [k, d] of Object.entries(M.fondo)) if (!Number.isFinite(d)) delete M.fondo[k];
  return M;
};
const limpiar = (O, hoy, dias) => { const k = Object.keys(O); if (k.length > 300) for (const c of k) if (!(hoy - (O[c].dia ?? O[c]) < dias)) delete O[c]; };

// clic derecho (lo llama game.js rightClick); true si lo atendió
export function usarMarisco(g, t, held) {
  const w = g.world, hoy = g.day || 1, sv = g.mode === 'survival';
  // el secadero
  if (t.id === K.secadero) return usarSecadero(g, t, held);
  if (held) return false;
  // la piangua: a mano, en las raíces del manglar (troncos de mangle junto al agua)
  if (t.id === K.jungle_log && t.y <= SEA + 2 && w.gen.column(t.x, t.z).biome === 'manglar') {
    const M = Mar(g), k = `${t.x >> 2},${t.z >> 2}`, mata = M.matas[k] && hoy - M.matas[k].dia < 3 ? M.matas[k] : (M.matas[k] = { dia: hoy, n: 0 });
    if (mata.n >= 6) { g.ui.toast('🐚 Esta mata ya no tiene piangua: en unos días se repone', 2000); return true; }
    mata.n++; limpiar(M.matas, hoy, 3);
    g.inventory.add(PIANGUA, 1);
    if (enVeda(g)) {
      if (sv) g.meta.reputation = (g.meta.reputation || 0) - 1; // tickReputacion (saberes.js) se lo anota al pueblo más cercano
      g.ui.toast('🐚 ¡Es día de veda de la piangua! Un vecino lo vio y lo regaña: se pierde un poco de fama en el pueblo', 3200);
      g.achieve('veda', 'Se la saltó la veda');
    } else g.ui.toast(`🐚 Una piangua (${6 - mata.n} más en esta mata)`, 1400);
    return true;
  }
  // el ostión: con la careta, buceando, en el fondo de arena, grava o barro del mar o del manglar
  if ((t.id === K.sand || t.id === K.gravel || t.id === K.clay) && g.player.body.inWater && tieneCareta(g)) {
    const bio = w.gen.column(t.x, t.z).biome;
    if (!['ocean', 'beach', 'manglar'].includes(bio) || t.y >= SEA) return false;
    const M = Mar(g), k = `${t.x},${t.y},${t.z}`;
    if (M.fondo[k] !== undefined && hoy - M.fondo[k] < 3) { g.ui.toast('🤿 Aquí ya buscó: no hay nada', 1200); return true; }
    M.fondo[k] = hoy; limpiar(M.fondo, hoy, 3);
    if (M.ostionDia !== hoy) { M.ostionDia = hoy; M.ostionN = 0; }
    if (M.ostionN >= 6) { g.ui.toast('🤿 Hoy ya sacó bastantes ostiones', 1600); return true; }
    if (Math.random() < 0.35) {
      M.ostionN++;
      g.inventory.add(OSTION, 1);
      if (Math.random() < 0.05) { g.inventory.add(369, 1); g.ui.toast('🤿 ¡Un ostión… con una perla adentro!', 2400); } else g.ui.toast('🤿 Un ostión', 1200);
    } else g.ui.toast('🤿 Nada por aquí', 1000);
    return true;
  }
  return false;
}
const tieneCareta = (g) => g.inventory.count(CARETA) > 0 || g.inventory.armor.some((s) => s && s.id === CARETA);

// el secadero: con un pescado crudo en la mano y sal en el inventario, se pone a secar (hasta 4); a los 3 días, pescado seco
function usarSecadero(g, t, held) {
  const w = g.world, hoy = g.day || 1;
  let be = w.getBE(t.x, t.y, t.z);
  if (!be || be.type !== 'secadero' || !Array.isArray(be.piezas)) { be = { type: 'secadero', piezas: [] }; w.setBE(t.x, t.y, t.z, be); }
  be.piezas = be.piezas.filter((d) => Number.isFinite(d));
  const listas = be.piezas.filter((d) => hoy - d >= 3).length;
  if (listas) {
    be.piezas = be.piezas.filter((d) => hoy - d < 3); w.touchBE(t.x, t.y, t.z);
    g.inventory.add(PESCADO_SECO, listas);
    g.ui.toast(`🐟 ${listas} pescado${listas > 1 ? 's' : ''} seco${listas > 1 ? 's' : ''}: dura un mes sin pudrirse`, 2000);
    g.achieve('secadero', 'Pescado seco de la abuela');
    return true;
  }
  if (held && esPescado(held.id) && held.id < 1113) {
    if (be.piezas.length >= 4) { g.ui.toast('🐟 El secadero está lleno (4 pescados)', 1800); return true; }
    if (g.mode === 'survival') {
      if (g.inventory.count(SAL) < 1) { g.ui.toast('🧂 Para secar el pescado hace falta sal', 2000); return true; }
      g.inventory.remove(SAL, 1); g.inventory.consumeHeld(1);
    }
    be.piezas.push(hoy); w.touchBE(t.x, t.y, t.z);
    g.ui.toast(`🐟 Pescado salado al secadero (${be.piezas.length} de 4): en 3 días está`, 1800);
    return true;
  }
  const falta = be.piezas.length ? Math.max(1, 3 - (hoy - Math.min(...be.piezas))) : 0;
  g.ui.toast(be.piezas.length ? `🐟 Secándose ${be.piezas.length}: ${falta} día${falta > 1 ? 's' : ''} más` : '🐟 Póngale un pescado crudo (con sal en el inventario) y en 3 días está seco', 2200);
  return true;
}
// el aviso de la veda (una vez por veda, cerca del mar o del manglar)
export function avisoVeda(g) {
  if (!enVeda(g) || g.dim !== 'tierra') return;
  const M = Mar(g), v = Math.floor(((g.day || 1) - 1) / 30);
  if (M.vedaAviso === v) return;
  const p = g.player.body.pos, bio = g.world.gen.column(Math.floor(p.x), Math.floor(p.z)).biome;
  if (bio !== 'manglar' && bio !== 'beach') return;
  M.vedaAviso = v;
  g.ui.toast('🐚 El pescador avisa: hoy es veda de la piangua (cuatro días). Déjela quieta en el manglar', 3600);
}
